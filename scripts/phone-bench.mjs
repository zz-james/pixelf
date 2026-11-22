#!/usr/bin/env node
/**
 * Measures the game's frame time on an Android phone over USB.
 *
 *   npm run bench:phone -- [--duration 30] [--warmup 3] [--port 8770]
 *                          [--device SERIAL] [--package com.android.chrome]
 *                          [--no-build]
 *
 * What it does:
 *   1. checks that adb sees exactly one authorised phone (or the one given
 *      with --device)
 *   2. runs `npm run build` (skip with --no-build) and serves dist/ on a local
 *      port, with an endpoint that collects the page's perf reports
 *   3. runs `adb reverse` so the phone can reach that port over the USB cable
 *   4. opens the game on the phone with ?perf=beacon (see src/perf.ts) and
 *      collects one report per second for --duration seconds
 *   5. prints the frame rate and the per-phase times, then removes the port
 *      forward and stops the server, even if something fails
 *
 * Before you run it: connect the phone, accept the USB debugging prompt, and
 * keep the screen on and unlocked. This script changes no phone setting, so it
 * does not keep the screen awake for you. Chrome must not be in battery saver,
 * and results from one device are indicative only.
 *
 * The page that opens is left open in Chrome on the phone. Close it yourself.
 */
import { execFileSync, execSync, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, normalize, extname, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");

/* ---------- arguments ---------- */
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const duration = Number(opt("duration", 30));
const warmup = Number(opt("warmup", 3));
const port = Number(opt("port", 8770));
const wantedSerial = opt("device", null);
const pkg = opt("package", "com.android.chrome");
const doBuild = !args.includes("--no-build");

/* ---------- helpers ---------- */
const ADB_TIMEOUT_MS = 20000;
function fail(message) {
  throw new Error(message);
}

let serial = null;
const adb = (...a) =>
  execFileSync("adb", serial ? ["-s", serial, ...a] : a, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: ADB_TIMEOUT_MS, // adb can hang if its server wedges; fail instead
  });

/* Everything that needs undoing is recorded here and undone once. */
let server = null;
let reversed = false;
let cleaned = false;
const cleanup = () => {
  if (cleaned) return;
  cleaned = true;
  if (reversed) {
    try {
      adb("reverse", "--remove", `tcp:${port}`);
    } catch {
      console.error(
        `Could not remove the adb reverse for port ${port}. Run: adb reverse --remove tcp:${port}`
      );
    }
  }
  if (server) server.close();
};
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.once(sig, () => {
    cleanup();
    process.exit(130);
  });
}

const findDevice = () => {
  try {
    execFileSync("adb", ["version"], { stdio: "ignore", timeout: ADB_TIMEOUT_MS });
  } catch {
    fail("adb was not found on your PATH. Install Android platform-tools.");
  }
  const lines = execFileSync("adb", ["devices"], { encoding: "utf8", timeout: ADB_TIMEOUT_MS })
    .split(/\r?\n/)
    .slice(1)
    .map((l) => l.trim().split(/\s+/))
    .filter((p) => p.length >= 2);

  if (lines.length === 0) {
    fail(
      "No Android device found. Connect the phone with USB and turn on USB debugging."
    );
  }
  const ready = lines.filter(([, state]) => state === "device");
  if (wantedSerial) {
    const hit = lines.find(([s]) => s === wantedSerial);
    if (!hit) fail(`Device ${wantedSerial} is not connected.`);
    if (hit[1] !== "device") {
      fail(`Device ${wantedSerial} is ${hit[1]}, not ready.`);
    }
    return wantedSerial;
  }
  if (ready.length === 0) {
    const states = lines.map(([s, st]) => `${s} (${st})`).join(", ");
    fail(
      `No authorised device. Found: ${states}. Accept the "Allow USB debugging" prompt on the phone.`
    );
  }
  if (ready.length > 1) {
    fail(
      `More than one device is connected (${ready
        .map(([s]) => s)
        .join(", ")}). Choose one with --device SERIAL.`
    );
  }
  return ready[0][0];
};

const deviceInfo = () => {
  const prop = (p) => adb("shell", "getprop", p).trim();
  let chrome = "unknown";
  try {
    const m = adb("shell", "dumpsys", "package", pkg).match(/versionName=(\S+)/);
    if (m) chrome = m[1];
  } catch {
    /* package missing or listing refused: leave as unknown */
  }
  let awake = "unknown";
  try {
    awake = adb("shell", "dumpsys", "power").match(/mWakefulness=(\w+)/)?.[1] ?? awake;
  } catch {
    /* ignore */
  }
  return {
    model: prop("ro.product.model"),
    android: prop("ro.build.version.release"),
    chrome,
    awake,
  };
};

/* ---------- local server ---------- */
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};

const reports = []; // one entry per one-second report from the page
let onReport = () => {};

const startServer = () =>
  new Promise((ok, bad) => {
    const s = createServer((req, res) => {
      const url = new URL(req.url, "http://localhost");
      if (req.method === "POST" && url.pathname === "/__perf") {
        let body = "";
        req.on("data", (c) => (body += c));
        req.on("end", () => {
          try {
            reports.push({ at: Date.now(), ...JSON.parse(body) });
            onReport();
          } catch {
            /* ignore a malformed report */
          }
          res.writeHead(204).end();
        });
        return;
      }
      const rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, "");
      let file = join(DIST, rel);
      if (!file.startsWith(DIST)) return res.writeHead(403).end();
      if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
      if (!existsSync(file)) return res.writeHead(404).end("not found");
      res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
      res.end(readFileSync(file));
    });
    s.once("error", (e) =>
      bad(
        new Error(
          e.code === "EADDRINUSE"
            ? `Port ${port} is already in use. Pick another with --port.`
            : e.message
        )
      )
    );
    s.listen(port, "127.0.0.1", () => ok(s));
  });

/* ---------- collecting and reporting ---------- */
const waitForReports = () =>
  new Promise((ok, bad) => {
    const started = Date.now();
    const timer = setInterval(() => {
      const last = reports.length ? reports[reports.length - 1].at : null;
      if (last === null && Date.now() - started > 30000) {
        clearInterval(timer);
        bad(
          new Error(
            "No reports from the phone after 30 s. Check the screen is on and unlocked, and that Chrome opened the page."
          )
        );
      } else if (last !== null && Date.now() - last > 10000) {
        clearInterval(timer);
        bad(
          new Error(
            "Reports stopped arriving. The phone may have locked its screen or sent Chrome to the background."
          )
        );
      }
    }, 1000);
    onReport = () => {
      if (reports.length >= warmup + duration) {
        clearInterval(timer);
        ok();
      }
    };
  });

const summarise = (rows) => {
  let frames = 0;
  let seconds = 0;
  let minFps = Infinity;
  const names = Object.keys(rows[0].phases);
  const sum = { total: 0 };
  const worst = { total: 0 };
  for (const n of names) {
    sum[n] = 0;
    worst[n] = 0;
  }
  for (const r of rows) {
    frames += r.frames;
    seconds += r.seconds;
    minFps = Math.min(minFps, r.frames / r.seconds);
    sum.total += r.total[0] * r.frames;
    worst.total = Math.max(worst.total, r.total[1]);
    for (const n of names) {
      sum[n] += r.phases[n][0] * r.frames;
      worst[n] = Math.max(worst[n], r.phases[n][1]);
    }
  }
  return { frames, seconds, fps: frames / seconds, minFps, names, sum, worst };
};

const print = (info, s, nReports) => {
  const avgTotal = s.sum.total / s.frames;
  console.log("");
  console.log(`Device:      ${info.model}, Android ${info.android}, Chrome ${info.chrome}`);
  console.log(`Run:         ${nReports} one-second reports after a ${warmup} s warm-up (${s.frames} frames)`);
  console.log(`Frame rate:  ${s.fps.toFixed(1)} fps average, ${s.minFps.toFixed(1)} fps in the slowest second`);
  console.log(
    `Frame time:  ${avgTotal.toFixed(2)} ms average, ${s.worst.total.toFixed(2)} ms worst` +
      ` (${((avgTotal / (1000 / 60)) * 100).toFixed(0)}% of a 60 Hz frame)`
  );
  console.log("");
  console.log("phase        avg ms   max ms   share");
  for (const n of s.names) {
    const avg = s.sum[n] / s.frames;
    console.log(
      `${n.padEnd(12)} ${avg.toFixed(2).padStart(6)}   ${s.worst[n].toFixed(2).padStart(6)}   ${(
        (avg / avgTotal) *
        100
      )
        .toFixed(0)
        .padStart(4)}%`
    );
  }
  console.log("");
  console.log("The page is still open in Chrome on the phone; close it when you are done.");
};

/* ---------- main ---------- */
const main = async () => {
  if (![duration, warmup, port].every((n) => Number.isFinite(n) && n >= 0) || duration < 1) {
    fail("--duration, --warmup and --port must be numbers, and --duration at least 1.");
  }
  serial = findDevice();
  const info = deviceInfo();
  if (info.awake !== "Awake") {
    console.warn(`Warning: the phone reports its screen as "${info.awake}". Wake and unlock it, or no frames will render.`);
  }

  if (doBuild) {
    console.log("Building...");
    execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
  }
  if (!existsSync(join(DIST, "index.html"))) {
    fail("dist/index.html not found. Run npm run build, or drop --no-build.");
  }

  server = await startServer();
  adb("reverse", `tcp:${port}`, `tcp:${port}`);
  reversed = true;

  const url = `http://localhost:${port}/?perf=beacon&run=${Date.now()}`;
  console.log(`Opening ${url} on ${info.model}. Keep the screen on and unlocked.`);
  /* One string, so the phone's shell sees the URL in quotes: an unquoted &
     would split the command. */
  /* am start reports "Error: Activity not started" on stderr with exit code 0,
     so read both streams. */
  const started = spawnSync(
    "adb",
    ["-s", serial, "shell", `am start -a android.intent.action.VIEW -d '${url}' ${pkg}`],
    { encoding: "utf8", timeout: ADB_TIMEOUT_MS }
  );
  const out = `${started.stdout ?? ""}${started.stderr ?? ""}`;
  if (/Error|Exception/.test(out)) fail(`Could not open the page in ${pkg}:\n${out}`);

  await waitForReports();
  const rows = reports.slice(warmup, warmup + duration);
  print(info, summarise(rows), rows.length);
};

try {
  await main();
} catch (e) {
  console.error(`\nError: ${e.message}`);
  process.exitCode = 1;
} finally {
  cleanup();
}
