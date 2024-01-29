import "./style.css";

import * as g from "./globals";

// import { shipStrip, backStarTiles, frontStarTiles } from "./resources";
import * as SURF from "./surfaces";

import { main } from "./main2";

// import * as KEY from "./keys";
// import { createParticleExplosion, updateParticles } from './particle';

// import { Surface } from "./surfaces"; // import types
// import { drawLine } from "./bresline";
// import { Font5x5 } from "./font5x5";

// import "./background";
// import { drawBackground, drawParallax, initBackground } from "./background";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <div class="card">
      <canvas id="canvas" width="${g.SCREEN_WIDTH}" height="${g.SCREEN_HEIGHT}"></canvas>
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

main();

/* create a surface */

// const surface: Surface = SURF.getMainSurface();

// remember to come back and write cliplineagainstrectange
// drawLine(surface, 0, 0, 639, 479, new Uint8ClampedArray([255, 255, 255, 255]));

// SURF.blitToCanvas();

// var charCode = "A".charCodeAt(0);

// console.log(Font5x5[charCode]);
