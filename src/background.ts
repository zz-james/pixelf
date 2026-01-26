import * as SURF from "./pixelf/surfaces";
import { Surface, Rect } from "./pixelf/surfaces"; // import types
import { backStarTiles, frontStarTiles, numStarTiles } from "./resources";
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
      frontTiles[x][y] = ((Math.random() * 1028) | 0) % numStarTiles;
      backTiles[x][y] = ((Math.random() * 1028) | 0) % numStarTiles;
    }
  }
};

/* draws a tile layer on the screen, with respect to the global 'camera' position
  the camera marks the 640x480 section of the world that we can see at any given time
  this is usually in the vicinity of the players ship */
const drawTileLayer = (
  dest: Surface,
  cameraX: number,
  cameraY: number,
  parallaxFactor: number,
  tileGrid: number[][],
  tileSurface: Surface
) => {
  let drawX: number, drawY: number; /* drawing position on screen */
  let startDrawX: number, startDrawY: number;
  let tileX: number, tileY: number; /* indices in the tile array */
  let startTileX: number, startTileY: number;

  /* map the camera position into the tile indices */
  startTileX =
    (cameraX / parallaxFactor / TILE_WIDTH) % PARALLAX_GRID_WIDTH | 0;
  startTileY =
    (cameraY / parallaxFactor / TILE_HEIGHT) % PARALLAX_GRID_HEIGHT | 0;

  startDrawX = -((cameraX / parallaxFactor) % TILE_WIDTH) | 0;
  startDrawY = -((cameraY / parallaxFactor) % TILE_HEIGHT) | 0;

  tileY = startTileY;
  drawY = startDrawY;

  while (drawY < g.SCREEN_HEIGHT) {
    tileX = startTileX;
    drawX = startDrawX;
    while (drawX < g.SCREEN_WIDTH) {
      const srcRect: Rect = {
        x: TILE_WIDTH * tileGrid[tileX][tileY],
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
      SURF.blitSurface(tileSurface, srcRect, dest, destRect);
      tileX++;
      tileX %= PARALLAX_GRID_WIDTH;
      drawX += TILE_WIDTH;
    }
    tileY++;
    tileY %= PARALLAX_GRID_HEIGHT;
    drawY += TILE_HEIGHT;
  }
};

export const drawBackground = (
  dest: Surface,
  cameraX: number,
  cameraY: number
) => {
  drawTileLayer(dest, cameraX, cameraY, PARALLAX_BACK_FACTOR, backTiles, backStarTiles);
};

export const drawParallax = (
  dest: Surface,
  cameraX: number,
  cameraY: number
): void => {
  drawTileLayer(dest, cameraX, cameraY, PARALLAX_FRONT_FACTOR, frontTiles, frontStarTiles);
};
