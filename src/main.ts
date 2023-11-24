import "./style.css";

import "./globals";

// import { shipStrip, backStarTiles, frontStarTiles } from "./resources";
import * as SURF from "./surfaces";
// import * as KEY from "./keys";
// import { createParticleExplosion, updateParticles } from './particle';

import { Surface } from "./surfaces"; // import types
import { drawLine } from "./bresline";

// import "./background";
// import { drawBackground, drawParallax, initBackground } from "./background";

const SCREEN_WIDTH = 640;
const SCREEN_HEIGHT = 480;

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <div class="card">
      <canvas id="canvas" width="${SCREEN_WIDTH}" height="${SCREEN_HEIGHT}"></canvas>
    </div>
`;

// const timer = new Date();

// let screen: Surface

/* Fire up PIX. */
if (
  SURF.init(
    document.getElementById("canvas")! as HTMLCanvasElement,
    640,
    480
  ) !== true
) {
  throw "Unable to initialize Pixelf" + SURF.getError();
}

/* create a surface */

const surface: Surface = SURF.getMainSurface();

// remember to come back and write cliplineagainstrectange
drawLine(surface, 0, 0, 639, 479, new Uint8ClampedArray([255, 255, 255, 255]));

SURF.blitToCanvas();
