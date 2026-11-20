import * as SURF from "./pixelf/surfaces";
import { Rect, Surface } from "./pixelf/surfaces"; // types
import { drawParticles } from "./pixelf/particle";
import * as g from "./globals";
import { Player_t } from "./globals";
import { shipStrip } from "./resources";
import { drawBackground, drawParallax } from "./background";
import { updateStatusDisplay } from "./status";
import { drawPhaserBeam } from "./weapon";
import { updateRadarDisplay } from "./radar";
import { timeScale } from "./clock";
import { cameraX, cameraY } from "./camera";
import { isRespawning } from "./combat";

/* scratch rects reused by every drawPlayer call so nothing is allocated per frame */
const shipSrc: Rect = { x: 0, y: 0, w: g.PLAYER_WIDTH, h: g.PLAYER_HEIGHT };
const shipDest: Rect = { x: 0, y: 0, w: g.PLAYER_WIDTH, h: g.PLAYER_HEIGHT };

const drawPlayer = (screen: Surface, p: Player_t): void => {
  // calculate the player's new screen coordinates
  p.screenX = p.worldX - cameraX;
  p.screenY = p.worldY - cameraY;

  // if player is not on screen, don't draw anything
  if (
    p.screenX < -g.PLAYER_WIDTH / 2 ||
    p.screenX >= g.SCREEN_WIDTH + g.PLAYER_WIDTH / 2
  ) {
    return;
  }

  if (
    p.screenY < -g.PLAYER_HEIGHT / 2 ||
    p.screenY >= g.SCREEN_HEIGHT + g.PLAYER_HEIGHT / 2
  ) {
    return;
  }

  // calculate drawing coordinates
  let angle = p.angle;
  if (angle < 0) angle += 360;

  shipSrc.x = g.PLAYER_WIDTH * ((angle / 4) | 0); // lines up with px value in strip fighter.png
  shipDest.x = p.screenX - g.PLAYER_WIDTH / 2;
  shipDest.y = p.screenY - g.PLAYER_HEIGHT / 2;

  /* draw the sprite */
  SURF.blitSurface(shipStrip, shipSrc, screen, shipDest);
};

/* Draws everything to the screen buffer and flips to canvas. */
export const renderFrame = (
  screen: Surface,
  player: Player_t,
  opponent: Player_t
): void => {
  drawBackground(screen, cameraX, cameraY);
  drawParallax(screen, cameraX, cameraY);
  drawParticles(screen, cameraX, cameraY);

  if (opponent.firing) drawPhaserBeam(opponent, screen, cameraX, cameraY);
  if (player.firing) drawPhaserBeam(player, screen, cameraX, cameraY);

  if (!isRespawning()) drawPlayer(screen, player);
  drawPlayer(screen, opponent);

  updateStatusDisplay(screen);
  updateRadarDisplay(
    screen,
    player.worldX,
    player.worldY,
    opponent.worldX,
    opponent.worldY,
    timeScale
  );

  SURF.blitToCanvas();
};
