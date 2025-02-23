import { Surface } from "./pixelf/surfaces"; // import types
import * as IMG from "./pixelf/image";

export let shipStrip: Surface;
export let backStarTiles: Surface;
export let frontStarTiles: Surface;
export let numStarTiles: number = 4;

export const loadGameData = async () => {
  const imageQueue: HTMLImageElement[] = IMG.queueImages([
    "fighter.png",
    "back-stars.png",
    "front-stars.png",
  ]); // this goes into a loading list

  let imageSurfaces: Surface[];
  try {
    imageSurfaces = await IMG.loadImages(imageQueue); // returns an array of Surfaces with the queued image data in.
  } catch (e) {
    throw new Error(e as string);
  }

  [shipStrip, backStarTiles, frontStarTiles] = imageSurfaces;
};
