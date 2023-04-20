import "./style.css";

import * as SURF from "./surfaces";
import { Surface, Rect, Coord } from "./surfaces"; // import types
import * as IMG from "./image";

const SCREEN_WIDTH = 640;
const SCREEN_HEIGHT = 480;

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <div class="card">
      <canvas id="canvas" width="${SCREEN_WIDTH}" height="${SCREEN_HEIGHT}"></canvas>
    </div>
`;

// setupCounter(document.querySelector<HTMLButtonElement>("#counter")!);

// PIXELF uses structures called surfaces for manipulating graphical data.
// A surface is simply a block of memory for storing a rectangular region of pixels
// you can think of a surface as a generic chunk of screen data. Surfaces have widths,
// heights and specific pixel formats, just as framebuffers do.

// in face, PIXELF represents the browser's frramebuffer as a special surface. The rectangular
// regions of data stored in surfaces are Uint8ClampedArray bitmaps

// the most important property of surfaces is that they can be copied onto each other very quickly
// one surfaces pixels can be transferred to an identically sized rectangular area of another surface.

// This operation is called a blit, or block image transfer. Blits are a fundamental part of game programming
// because they allow complete images to be composed out of pre-drawn graphics (usually created by artists with image-processing software).

// Since the framebuffer is a surface, entire images can be sent to the screen with a single blitting operation. PIXELF provides a function for performing
// fast blits between surfaces

// most game rely almost exclusively on surface blits for their drawing (as opposed to drawing with individual pixels).

// we will now examime a series of SDL graphical programming examples.

if (
  SURF.init(
    document.getElementById("canvas")! as HTMLCanvasElement,
    SCREEN_WIDTH,
    SCREEN_HEIGHT
  ) !== true
) {
  throw "Unable to initialize Pixelf" + SURF.getError();
}

// this program includes SURF from the /surfaces.ts file. This is the master file for PIXELF and needs to be included in all PIXELF applications
// we begin by calling SURF.init to initialise PIXELF. This function takes a canvas element and a width and height.If this is not possible, for example
// if there is no canvas element to pass, we throw an error.
const screen: Surface = SURF.getMainSurface();

// now we use getMainSurface to get a pointer to the surface that represents the frame buffer.

// for (let i = 0; i < screen.pixels.length; i += 4) {
//   let x = ((i % 400) / 400) * 255;
//   let y = (Math.ceil(i / 400) / 100) * 255;
//   screen.pixels[i + 0] = x;
//   screen.pixels[i + 1] = y;
//   screen.pixels[i + 2] = 255 - x;
//   screen.pixels[i + 3] = 255;
// }

// SURF.blitToCanvas();

IMG.queueImages(["smallpenguin.png", "background.png"]); // this goes into a loading list

let images: Surface[];
try {
  images = await IMG.loadImages(); // returns an array of Surfaces with the queued image data in.
} catch (e) {
  throw new Error(e as string);
}

const [penguin, background] = images;

// SURF.blitSurface(stars, { x: 10, y: 10, w: 40, h: 40 }, fighter, {
//   x: 20,
//   y: 20,
// });

// SURF.blitSurface(fighter, { x: 0, y: 0, w: 100, h: 98 }, screen, {
//   x: 200,
//   y: 200,
// });

// SURF.blitToCanvas();

const NUM_PENGUINS = 100;
const MAX_SPEED = 6;

// this type stores the information for one on-screen penguin
type penguin_t = {
  x: number;
  y: number;
  dx: number;
  dy: number;
};

let penguins: penguin_t[] = []; // array of penguins (NUM_PENGUINS in length)

/* loop through the array of penguins and set each to a random starting position and direction */
const initPenguins = () => {
  for (let i = 0; i < NUM_PENGUINS; i++) {
    penguins[i] = {
      x: (Math.random() * SCREEN_WIDTH) << 0,
      y: (Math.random() * SCREEN_HEIGHT) << 0,
      dx: (Math.random() * 256) % MAX_SPEED << 0,
      dy: (Math.random() * 256) % MAX_SPEED << 0,
    };
  }
};

/* move each penguin by its motion vector */
const movePenguins = () => {
  for (let i = 0; i < NUM_PENGUINS; i++) {
    // move penguin by it's motion vector
    penguins[i].x += penguins[i].dx;
    penguins[i].y += penguins[i].dy;
    /* turn the penguin if it hits the edge of the screen */
    if (penguins[i].x < 0 || penguins[i].x > SCREEN_WIDTH - 1) {
      penguins[i].dx = -penguins[i].dx;
    }
    if (penguins[i].y < 0 || penguins[i].y > SCREEN_HEIGHT - 1) {
      penguins[i].dy = -penguins[i].dy;
    }
  }
};

/* this routing draws each penguin to the screen surface */
const drawPenguins = () => {
  for (let i = 0; i < NUM_PENGUINS; i++) {
    const src: Rect = { x: 0, y: 0, w: penguin.w, h: penguin.h };
    const dest: Coord = {
      x: penguins[i].x - penguin.w / 2,
      y: penguins[i].y - penguin.h / 2,
    };
    SURF.blitSurface(penguin, src, screen, dest);
  }
};

const main = () => {
  let frames: number = 300;

  initPenguins();

  const createFrame = () => {
    if (frames) {
      SURF.blitSurface(
        background,
        { x: 0, y: 0, w: background.w, h: background.h },
        screen,
        { x: 0, y: 0 }
      );

      drawPenguins();
      SURF.blitToCanvas();

      movePenguins();
      frames--;
      window.requestAnimationFrame(createFrame);
    } else {
      console.log("end");
    }
  };

  window.requestAnimationFrame(createFrame);
};

main();
