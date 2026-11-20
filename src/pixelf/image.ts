import * as SURF from "./surfaces";
import { Surface } from "./surfaces";

// takes a url and returns an empty html image element with their id
// set to the url they will load
// image to surface function actually loads the image
// by setting the src from the id
export const createImagePlaceholder = (url: string): HTMLImageElement => {
  const img = new Image();

  img.id = url; // when we load we'll set src = id

  return img;
};

// takes a list of urls and returns a list of
// placeholder HTML image elements
export const queueImages = (urls: string[]): HTMLImageElement[] => {
  return urls.map((url) => {
    return createImagePlaceholder(url);
  });
};

/**
 * itterate over list of image elements converting
 * each to a surface object
 */
export const loadImages = async (
  images: HTMLImageElement[]
): Promise<SURF.Surface[]> => {
  const finalResults: Surface[] = await Promise.all(
    images.map(
      async (image): Promise<Surface> => await loadImageToSurface(image) // loader function that retuns a promise
    ) // this will return an array of promises
  ).then((results) => {
    return results;
  });
  return finalResults;
};

// converts the html image element into a surface
// by loading the image and copying the image data
const loadImageToSurface = async (
  image: HTMLImageElement
): Promise<Surface> => {
  return new Promise((resolve, reject) => {
    image.onload = () => {
      resolve(SURF.createSurfaceWithImage(image));
    };
    image.onerror = () => {
      reject(new Error(`failed to load image "${image.id}"`));
    };

    image.src = image.id; // trigger the actual loading of the image
  });
};
