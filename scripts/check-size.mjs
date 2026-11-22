#!/usr/bin/env node
/**
 * Fails if the gzipped JavaScript in dist/ is over the size budget.
 *
 *   node scripts/check-size.mjs [--budget 15] [--dist dist]
 *
 * It adds up every .js file under the dist folder, gzipped with zlib's
 * default level (the same way `vite build` reports sizes, so the two figures
 * agree), and compares the total with the budget in kB (1 kB = 1000 bytes, as
 * Vite prints). `npm run build` runs it after the
 * build, and `npm run size` runs it on its own.
 *
 * --budget and --dist exist so the check can be tried without editing this
 * file, for example `node scripts/check-size.mjs --budget 5` should fail.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

/* The working budget for gzipped JavaScript, in kB. See "Performance budget"
   in CLAUDE.md. */
const DEFAULT_BUDGET_KB = 15;

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};

const budgetKb = Number(opt("budget", DEFAULT_BUDGET_KB));
const dist = resolve(root, opt("dist", "dist"));

const stop = (message) => {
  console.error(`Size check: ${message}`);
  process.exit(1);
};

if (!Number.isFinite(budgetKb) || budgetKb <= 0) {
  stop("--budget must be a positive number of kB.");
}
if (!existsSync(dist) || !statSync(dist).isDirectory()) {
  stop(`${relative(root, dist) || dist} not found. Run npm run build first.`);
}

const jsFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return jsFiles(path);
    return entry.name.endsWith(".js") ? [path] : [];
  });

const files = jsFiles(dist);
if (files.length === 0) {
  stop(`no .js files found in ${relative(root, dist) || dist}.`);
}

let totalBytes = 0;
for (const file of files) {
  const bytes = gzipSync(readFileSync(file)).length;
  totalBytes += bytes;
  console.log(`  ${relative(dist, file).replace(/\\/g, "/")}  ${(bytes / 1000).toFixed(2)} kB gzipped`);
}

const budgetBytes = budgetKb * 1000;
const percent = Math.round((totalBytes / budgetBytes) * 100);
const summary = `JavaScript, gzipped: ${(totalBytes / 1000).toFixed(2)} kB of a ${budgetKb} kB budget (${percent}%)`;

if (totalBytes > budgetBytes) {
  console.error(`Size check FAILED. ${summary}`);
  console.error(`Over by ${((totalBytes - budgetBytes) / 1000).toFixed(2)} kB. Reduce the bundle, or raise the budget deliberately (see Performance budget in CLAUDE.md).`);
  process.exit(1);
}
console.log(`Size check passed. ${summary}`);
