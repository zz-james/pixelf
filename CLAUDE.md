# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server
- `npm run typecheck` — `tsc` (noEmit; strict, `noUnusedLocals`/`noUnusedParameters` are on, so unused vars fail the build)
- `npm run build` — `tsc && vite build`
- `npm run preview` — serve the production build

There is no test runner or linter configured.

## What this is

A browser port (TypeScript + Vite) of the C/SDL game Penguin Warrior. The player's ship fights a scripted AI opponent (the "devil") in a 2000x2000 world seen through a 640x480 camera. Sprites and images live in `public/`.

## Architecture

**`src/pixelf/` is a custom SDL-style software renderer, not a canvas-drawing-API wrapper.** `surfaces.ts` keeps a pixel buffer (`Surface = {pixels, w, h}`) and exposes blit/fill operations. Everything draws into the main surface, and `blitToCanvas()` copies the buffer to the `<canvas>` once per frame. Draw by writing pixels or blitting surfaces, never with `ctx.fillRect` and similar. Endianness matters because the buffer is also viewed as a `Uint32Array`. `keys.ts` holds a global pressed-keys map, and `particle.ts` is the particle system.

**`src/warrior.ts` is the game core.** `main()` loads assets and initialises the status display, radar, background and both players. `playGame()` then runs the `requestAnimationFrame` loop, in this order each frame: timers → `handleInput` → `runGameScript` (the AI) → `checkOpponentCombat` → `updatePlayer` for both ships → status → camera → particles → `renderFrame`. Movement and charging scale by `timeScale` (frame delta / 30ms), so the original 30 ticks/second constants still apply. Both ships are `Player_t` objects (see `globals.ts`), which are mutated in place. `PlayerType` and `PlayerState` enums are in `globals.ts`, along with all tuning constants (velocities, phaser charge/damage, world size).

**`src/scripting.ts`** is the opponent AI, a small ATTACK/EVADE state machine. It mutates the opponent `Player_t` directly and calls `canPlayerFire`/`firePhasers` from `warrior.ts`. That creates a circular import between the two files, so keep the usage inside functions, not at module top level.

**`src/weapon.ts`** draws phaser beams as lines (`drawLine32`, clipped to the screen) and does line-based hit detection in `checkPhaserHit`. Bresenham line code is in `bresline.ts`.

**HUD and display:** `status.ts` draws the LED-style HUD (scores, shields, charge) with the bitmap font in `font5x5.ts`. `radar.ts` draws the minimap. `background.ts` draws the background plus the two parallax star layers. `resources.ts` holds the loaded image surfaces as module-level `let` exports, populated by `loadGameData()`.

**Mobile input:** `touch-controls.ts` builds an on-screen joystick and fire button. The joystick publishes an angle (0–360, 0 = right, counter-clockwise positive) and a distance through `getJoystickAngle`/`getJoystickDistance`. `handleInput` in `warrior.ts` steers toward that angle, handling the 0/360 wraparound. The fire button and keyboard feed the same `keys.ts` map, so keyboard and touch share one path.

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
