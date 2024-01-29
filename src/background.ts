import * as SURF from "./surfaces";
import { Surface, Rect, Coord } from "./surfaces"; // import types
import { backStarTiles, frontStarTiles } from "./resources";
import { createMultiArray } from "./utils/multiArray";
import * as g from "./globals";

/* These define the sizes of the backgrond tile grids. We don't really need a one to one
   mapping between the size of the playing field and the size of the tile grids;
   we can wrap around at some point, and nobody will notice a difference. */
const PARALLAX_GRID_WIDTH = 100;
const PARALLAX_GRID_HEIGHT = 100;

/* These define the scrolling speeds of the front and back background
   layers, relative to the movement of the camera. */
const PARALLAX_BACK_FACTOR = 4;
const PARALLAX_FRONT_FACTOR = 2;

/* Dimensions of the map tiles. */
const TILE_WIDTH = 64;
const TILE_HEIGHT = 64;

/* two dimensional arrays for storing the world's tiles (by index) */
let numStarTiles: number; // an int

const frontTiles: any[] = createMultiArray(
  PARALLAX_GRID_WIDTH,
  PARALLAX_GRID_WIDTH
);
const backTiles: number[][] = createMultiArray(
  PARALLAX_GRID_WIDTH,
  PARALLAX_GRID_HEIGHT
);

/* sets up the starry background by assigning random tiles 
  this should be called after loadGameData() */
export const initBackground = (): void => {
  let x: number;
  let y: number;

  for (x = 0; x < PARALLAX_GRID_WIDTH; x++) {
    for (y = 0; y < PARALLAX_GRID_WIDTH; y++) {
      frontTiles[x][y] = (Math.random() * 1028) % numStarTiles;
      backTiles[x][y] = (Math.random() * 1028) % numStarTiles;
    }
  }
};

/* draws the background on the screen, with respect to the global 'camera' position
  the camera marks the 640x480 section of the world that we can see at any given time
  this is usually in the vicinity of the players ship */
export const drawBackground = (
  dest: Surface,
  cameraX: number,
  cameraY: number
) => {
  let drawX: number, drawY: number; /* drawing position on screen */
  let startDrawX: number, startDrawY: number;
  let tileX: number, tileY: number; /* indices in the backTiles array */
  let startTileX: number, startTileY: number;

  /* map the camera position into the tile indices */
  startTileX =
    (cameraX / PARALLAX_BACK_FACTOR / TILE_WIDTH) % PARALLAX_GRID_WIDTH;
  startTileY =
    (cameraY / PARALLAX_BACK_FACTOR / TILE_HEIGHT) % PARALLAX_GRID_HEIGHT;

  startDrawX = -((cameraX / PARALLAX_BACK_FACTOR) % TILE_WIDTH);
  startDrawY = -((cameraY / PARALLAX_BACK_FACTOR) % TILE_HEIGHT);

  tileY = startTileY;
  drawY = startDrawY;

  while (drawY < g.SCREEN_HEIGHT) {
    tileX = startTileX;
    drawX = startDrawX;
    while (drawX < g.SCREEN_WIDTH) {
      const srcRect: Rect = {
        x: TILE_WIDTH * backTiles[tileX][tileY],
        y: 0,
        w: TILE_WIDTH,
        h: TILE_HEIGHT,
      };
      const destRect: Rect = {
        x: drawX,
        y: drawY,
        w: TILE_WIDTH,
        h: TILE_HEIGHT,
      };

      SURF.blitSurface(backStarTiles, srcRect, dest, destRect); // what this needs attention!!!
      tileX++;
      tileX %= PARALLAX_GRID_WIDTH;
      drawX += TILE_WIDTH;
    }
    tileY++;
    tileY %= PARALLAX_GRID_HEIGHT;
    drawX += TILE_HEIGHT;
  }
};

export const drawParallax = (
  dest: Surface,
  cameraX: number,
  cameraY: number
): void => {
  let drawX: number, drawY: number; /* drawing position on screen */
  let startDrawX: number, startDrawY: number;
  let tileX: number, tileY: number; /* indices in the backTiles array */
  let startTileX: number, startTileY: number;

  /* map the camera position into the tile indices */
  startTileX =
    (cameraX / PARALLAX_FRONT_FACTOR / TILE_WIDTH) % PARALLAX_GRID_WIDTH;
  startTileY =
    (cameraY / PARALLAX_FRONT_FACTOR / TILE_HEIGHT) % PARALLAX_GRID_HEIGHT;

  startDrawX = -((cameraX / PARALLAX_FRONT_FACTOR) % TILE_WIDTH);
  startDrawY = -((cameraY / PARALLAX_FRONT_FACTOR) % TILE_HEIGHT);

  tileY = startTileY;
  drawY = startDrawY;

  while (drawY < g.SCREEN_HEIGHT) {
    tileX = startTileX;
    drawX = startDrawX;
    while (drawX < g.SCREEN_WIDTH) {
      const srcRect: Rect = {
        x: TILE_WIDTH * frontTiles[tileX][tileY],
        y: 0,
        w: TILE_WIDTH,
        h: TILE_HEIGHT,
      };
      const destRect: Rect = {
        x: drawX,
        y: drawY,
        w: TILE_WIDTH,
        h: TILE_HEIGHT,
      };

      SURF.blitSurface(frontStarTiles, srcRect, dest, destRect); // what this needs attention!!!
      tileX++;
      tileX %= PARALLAX_GRID_WIDTH;
      drawX += TILE_WIDTH;
    }
    tileY++;
    tileY %= PARALLAX_GRID_HEIGHT;
    drawX += TILE_HEIGHT;
  }
};
