import * as g from "./globals";
import * as SURF from "./pixelf/surfaces";
import { main } from "./warrior";

import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <div class="card">
      <canvas id="canvas" width="${g.SCREEN_WIDTH}" height="${g.SCREEN_HEIGHT}"></canvas>
    </div>
`;

/* Fire up PIX. */
if (
  SURF.init(
    document.getElementById("canvas")! as HTMLCanvasElement,
    g.SCREEN_WIDTH,
    g.SCREEN_HEIGHT
  ) !== true
) {
  throw "Unable to initialize Pixelf" + SURF.getError();
}

const screen = SURF.getMainSurface(); // global reference to screen for blitting

main(screen);
