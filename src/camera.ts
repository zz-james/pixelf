import * as g from "./globals";
import { Player_t } from "./globals";

/* Position of the 640x480 viewport within the world. Exported as live
   bindings so readers see updates without any per-frame allocation. */
export let cameraX: number = 0;
export let cameraY: number = 0;

/* Updates camera position to follow the player, clamped to world bounds. */
export const updateCamera = (player: Player_t): void => {
  cameraX = (player.worldX - g.SCREEN_WIDTH / 2) | 0;
  cameraY = (player.worldY - g.SCREEN_HEIGHT / 2) | 0;

  if (cameraX < 0) cameraX = 0;
  if (cameraX >= g.WORLD_WIDTH - g.SCREEN_WIDTH)
    cameraX = g.WORLD_WIDTH - g.SCREEN_WIDTH - 1;
  if (cameraY < 0) cameraY = 0;
  if (cameraY >= g.WORLD_HEIGHT - g.SCREEN_HEIGHT)
    cameraY = g.WORLD_HEIGHT - g.SCREEN_HEIGHT - 1;
};
