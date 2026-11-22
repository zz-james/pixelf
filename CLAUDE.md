# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server
- `npm run typecheck` — `tsc` (noEmit; strict, `noUnusedLocals`/`noUnusedParameters` are on, so unused vars fail the build)
- `npm run build` — `tsc && vite build`
- `npm run preview` — serve the production build
- `npm test` — run the Vitest tests
- `npm run bench:phone` — builds, then measures frame time and per-phase times on an Android phone connected by USB (`scripts/phone-bench.mjs`; options such as `--duration 30` and `--device SERIAL` go after `--`). Needs `adb`, USB debugging accepted, and the phone awake and unlocked. It uses `adb reverse`, not Wi-Fi.

There is no linter configured. Tests use Vitest: `npm test` runs them once (`npx vitest` watches). Test files sit next to the code as `*.test.ts`; so far `src/pixelf/surfaces.test.ts` pins down `blitSurface` byte for byte.

## What this is

A browser port (TypeScript + Vite) of the C/SDL game Penguin Warrior. The player's ship fights a scripted AI opponent (the "devil") in a 2000x2000 world seen through a 640x480 camera. Sprites and images live in `public/`.

## Architecture

**`src/pixelf/` is a custom SDL-style software renderer, not a canvas-drawing-API wrapper.** `surfaces.ts` keeps a pixel buffer (`Surface = {pixels, w, h}`) and exposes blit/fill operations. Everything draws into the main surface, and `blitToCanvas()` copies the buffer to the `<canvas>` once per frame. Draw by writing pixels or blitting surfaces, never with `ctx.fillRect` and similar. Endianness matters because the buffer is also viewed as a `Uint32Array`. `keys.ts` holds a global pressed-keys map, and `particle.ts` is the particle system.

**`src/warrior.ts` is the game loop and wiring.** `main()` loads assets and initialises the status display, radar, background and both players. `playGame()` then runs the `requestAnimationFrame` loop, in this order each frame: firing timers → `chargePhasers` → `updateTimers` → `handleInput` → `runGameScript` (the AI) → `checkOpponentCombat` → `updatePlayer` for both ships → status → `updateCamera` → particles → `renderFrame`. Both ships are `Player_t` objects (see `globals.ts`), created in `warrior.ts`, passed to the other modules as arguments and mutated in place. `PlayerType` and `PlayerState` enums are in `globals.ts`, along with all tuning constants (velocities, phaser charge/damage, AI distances, HUD layout, world size).

The rest of the game logic is split into small modules that `warrior.ts` composes:
- `clock.ts` owns `timeScale` (frame delta / 30ms, capped by `MAX_TIME_SCALE`) and `updateTimeScale`. Import `timeScale` as a live binding; don't copy it. Movement, charging, timers and damage scale by it, so the original 30 ticks/second constants still apply.
- `player.ts` has ship setup and movement (`initPlayer`, `updatePlayer`) and the phaser rules (`canPlayerFire`, `firePhasers`, `chargePhasers`).
- `input.ts` reads the keyboard and joystick into one reused `InputState` (`readInput`) and applies steering, thrust and turn to the player.
- `combat.ts` holds hits, damage, kills, explosions and the respawn, invincibility and hit-explosion timers. `isRespawning()` is the way to ask whether the player is dead.
- `camera.ts` exports `cameraX`/`cameraY` (live bindings) and `updateCamera`; `render.ts` draws a frame (`renderFrame`) and blits to the canvas.
- `perf.ts` is optional per-phase frame timing. Add `?perf` to the page URL to print average and maximum milliseconds per phase once a second (`?perf=overlay` also shows them on the page). Without the flag each call is a single boolean check. Add a `perfLap(PHASE_X)` call when you add a new phase to the frame.

**Keep the import graph acyclic.** The old `warrior.ts` ↔ `scripting.ts` cycle was removed by moving shared code into `clock.ts` and `player.ts`. Lower modules must not import `warrior.ts`; put anything shared in one of the modules above.

**Performance beats readability in the game loop.** Allocate objects, rects and arrays once at module level and reuse them (scratch `Rect`/`Coord`, the shared `InputState`, `beamCoords`, the typed-array particle pool) rather than creating them per frame.

**`src/scripting.ts`** is the opponent AI, a small ATTACK/EVADE state machine. `runGameScript(player, computer, timeScale)` mutates the opponent `Player_t` directly and fires through `canPlayerFire`/`firePhasers` from `player.ts`.

**`src/weapon.ts`** draws phaser beams as lines (`drawLine32`, clipped to the screen) and does line-based hit detection in `checkPhaserHit`. Bresenham line code is in `bresline.ts`.

**HUD and display:** `status.ts` draws the LED-style HUD (scores, shields, charge) with the bitmap font in `font5x5.ts`. `radar.ts` draws the minimap. `background.ts` draws the background plus the two parallax star layers. `resources.ts` holds the loaded image surfaces as module-level `let` exports, populated by `loadGameData()`.

**Mobile input:** `touch-controls.ts` builds an on-screen joystick and fire button. The joystick publishes an angle (0–360, 0 = right, counter-clockwise positive) and a distance through `getJoystickAngle`/`getJoystickDistance`. `input.ts` steers toward that angle, handling the 0/360 wraparound. The fire button and keyboard feed the same `keys.ts` map, so keyboard and touch share one path.

## Workflow

Full spec is in `workflow_guide.md`; follow it for issue, branch, commit and PR work. Commits before the guide was introduced don't follow it; new work must.

- **Project board:** https://github.com/users/zz-james/projects/3/
- **Issues:** labelled `type:bug|feature|tech-debt`, `priority:*`, `size:*` and a `status:*` that moves `raw-intake → refining → sprint-worthy → todo → in-progress → in-review → in-testing → done`. When starting an assigned `status:todo` issue, switch it to `status:in-progress` immediately.
- **Branches:** `bugfix/<issue#>-<slug>` (bug), `feature/<issue#>-<slug>` (feature), `chore/<issue#>-<slug>` (tech-debt).
- **Commits:** Conventional Commits (`fix:` bug, `feat:` feature, `chore:`/`refactor:` tech-debt, plus `docs:`, `style:`, `test:`). Breaking changes use `!` or a `BREAKING CHANGE:` footer. Put `Closes #N` / `Fixes #N` in the footer.
- **PRs:** description footer must contain `Closes #N`; copy the issue's `type:*` and `priority:*` labels and set `status:in-review`.
- **Refinement:** an issue is `sprint-worthy` only if it is small/atomic, testable (explicit steps or assertions) and clearly scoped.

## Notes

- `todo.md` is the author's informal task list (sound, particle positions, enemy difficulty).
- Sound and music are stubbed out (commented `initAudio`/`initMusic` calls in `main`).
