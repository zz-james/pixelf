import { MAX_TIME_SCALE } from "./globals";

/**
 * The time the current frame covers, measured in 30fps ticks (1 = 33ms).
 * Movement, charging and timers multiply by it so the game plays the same at
 * any frame rate. Importers see the live value; only updateTimeScale changes it.
 */
export let timeScale: number = 0;

/* Sets timeScale from the milliseconds since the previous frame. It is capped
   so one long frame (background tab, breakpoint) can't teleport ships. */
export const updateTimeScale = (elapsedMs: number): void => {
  timeScale = Math.min(elapsedMs / 30, MAX_TIME_SCALE);
};
