/**
 * Optional per-phase frame timing, switched on by adding ?perf to the page URL
 * (?perf=overlay also shows the numbers on the page, ?perf=beacon posts them
 * to the page's server, and ?perf=overlay,beacon does both).
 *
 * Once a second it prints the average and maximum milliseconds spent in each
 * phase of a frame, plus the frame rate. When the flag is absent every
 * function here returns after one boolean check, and nothing is allocated.
 * With the flag on, the only allocation is the report text, once a second.
 *
 * Usage: perfFrameStart() at the top of the frame, perfLap(PHASE_X) after
 * each phase (it charges the time since the previous lap to that phase), and
 * perfFrameEnd() when the frame is done.
 */

const mode: string | null = new URLSearchParams(window.location.search).get(
  "perf"
);
export const perfEnabled: boolean = mode !== null;
/* ?perf=overlay,beacon: comma-separated options. */
const options: string[] = mode === null ? [] : mode.split(",");
const showOverlay: boolean = options.includes("overlay");
/* beacon: also POST each report as JSON to /__perf on the page's own server.
   scripts/phone-bench.mjs uses this to collect numbers from a phone without
   attaching a debugger, which can slow the page down. */
const sendBeacon: boolean = options.includes("beacon");

/* Phase ids. The names match the calls in warrior.ts and render.ts. */
export const PHASE_UPDATE = 0; // game logic, before renderFrame
export const PHASE_BACKGROUND = 1; // drawBackground
export const PHASE_PARALLAX = 2; // drawParallax
export const PHASE_PARTICLES = 3; // drawParticles
export const PHASE_BEAMS = 4; // drawPhaserBeam, both ships
export const PHASE_SPRITES = 5; // drawPlayer, both ships
export const PHASE_HUD = 6; // updateStatusDisplay
export const PHASE_RADAR = 7; // updateRadarDisplay
export const PHASE_CANVAS = 8; // blitToCanvas

const NAMES: string[] = [
  "update",
  "background",
  "parallax",
  "particles",
  "beams",
  "sprites",
  "hud",
  "radar",
  "canvas",
];
const PHASE_COUNT = NAMES.length;
const TOTAL = PHASE_COUNT; // the slot after the last phase holds the frame total

/* Time in ms added up over the current one-second window. */
const sum = new Float64Array(PHASE_COUNT + 1);
const max = new Float64Array(PHASE_COUNT + 1);

let lastMark = 0;
let frameStart = 0;
let frames = 0;
let windowStart = 0;
let overlay: HTMLPreElement | null = null;

export const perfFrameStart = (): void => {
  if (!perfEnabled) return;
  frameStart = lastMark = performance.now();
  if (windowStart === 0) windowStart = frameStart;
};

/* Charges the time since the previous lap (or the frame start) to a phase. */
export const perfLap = (phase: number): void => {
  if (!perfEnabled) return;
  const now = performance.now();
  const d = now - lastMark;
  lastMark = now;
  sum[phase] += d;
  if (d > max[phase]) max[phase] = d;
};

const report = (now: number): void => {
  const seconds = (now - windowStart) / 1000;
  let text = `${(frames / seconds).toFixed(1)} fps  (avg / max ms)\n`;
  text += `frame      ${(sum[TOTAL] / frames).toFixed(2)} / ${max[TOTAL].toFixed(
    2
  )}\n`;
  for (let i = 0; i < PHASE_COUNT; i++) {
    text += `${NAMES[i].padEnd(10)} ${(sum[i] / frames).toFixed(2)} / ${max[
      i
    ].toFixed(2)}\n`;
  }

  console.log(`[perf] ${text}`);

  if (sendBeacon) {
    const phases: { [name: string]: number[] } = {};
    for (let i = 0; i < PHASE_COUNT; i++) {
      phases[NAMES[i]] = [sum[i] / frames, max[i]];
    }
    navigator.sendBeacon(
      "/__perf",
      JSON.stringify({
        frames,
        seconds,
        total: [sum[TOTAL] / frames, max[TOTAL]],
        phases,
      })
    );
  }

  if (showOverlay) {
    if (!overlay) {
      overlay = document.createElement("pre");
      overlay.style.cssText =
        "position:fixed;top:0;left:0;margin:0;padding:4px 6px;" +
        "background:rgba(0,0,0,0.7);color:#0f0;font:11px monospace;" +
        "pointer-events:none;z-index:10;";
      document.body.appendChild(overlay);
    }
    overlay.textContent = text;
  }

  sum.fill(0);
  max.fill(0);
  frames = 0;
  windowStart = now;
};

export const perfFrameEnd = (): void => {
  if (!perfEnabled) return;
  const now = performance.now();
  const d = now - frameStart;
  sum[TOTAL] += d;
  if (d > max[TOTAL]) max[TOTAL] = d;
  frames++;
  if (now - windowStart >= 1000) report(now);
};
