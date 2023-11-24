import { Surface } from "./surfaces"; // import types
import * as IMG from "./image";

export let shipStrip: Surface;
export let backStarTiles: Surface;
export let frontStarTiles: Surface;

const loadGameData = async () => {
  let tmp: Surface;

  IMG.queueImages(["fighter.png", "back-stars.png", "front-stars.png"]); // this goes into a loading list

  let images: Surface[];
  try {
    images = await IMG.loadImages(); // returns an array of Surfaces with the queued image data in.
  } catch (e) {
    throw new Error(e as string);
  }

  [shipStrip, backStarTiles, frontStarTiles] = images;
};
