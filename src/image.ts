import * as SURF from "./surfaces";
import { Surface } from "./surfaces";

// type BufferData = { buffer: Surface; image: HTMLImageElement };

// let bufferDataContainer: BufferData[] = []; // array [{surface object, image object},...]
let images: HTMLImageElement[] = []; // array of image objects

let numImgs: number;
// let numLoadedImgs: number = 0;
// let callback;
// let tmpImg: HTMLImageElement = new Image(); // just have this image pointer in heap

export const queueImage = (url: string) => {
  const img = new Image();

  img.id = url; // when we load we'll set src = id
  images.push(img);
  numImgs = images.length;
  console.log("queueing image " + numImgs); // debug
};

export const queueImages = (urls: string[]) => {
  urls.map((url) => {
    queueImage(url);
  });
};

/**
 * itterate over list of buffer objects setting the src
 * property of the image objects which will trigger the download
 * @param callback ; the function to call when all the images are loaded
 */
export const loadImages = async () => {
  const finalResults: Surface[] = await Promise.all(
    images.map(
      async (image): Promise<Surface> => await loadImage(image) // loader function that retuns a promise
    ) // this will return an array of promises
  ).then((results) => {
    return results;
  });
  return finalResults;
};

const loadImage = async (image: HTMLImageElement): Promise<Surface> => {
  return new Promise((resolve, reject) => {
    image.onload = () => {
      console.log("completed loading image " + image.id);
      resolve(SURF.createSurfaceWithImage(image));
    };
    image.onerror = function (event: Event | string) {
      if (typeof event === "string") reject(`there was an error ${event}`);
      reject("there was an error loading " + (event as Event).currentTarget);
    };

    image.src = image.id; // trigger the actual loading of the image
    console.log("started loading image " + image.id);
  });
};
