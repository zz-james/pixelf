import * as g from "./globals";
import * as SURF from "./pixelf/surfaces";
import { main } from "./warrior";
import { initTouchControls } from "./touch-controls";

import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div id="game-container">
    <canvas id="canvas" width="${g.SCREEN_WIDTH}" height="${g.SCREEN_HEIGHT}"></canvas>
  </div>
`;

const container = document.getElementById("game-container")!;

/* Shows a fatal error over the canvas so a failure isn't just a blank screen. */
const showFatalError = (message: string): void => {
  const el = document.createElement("div");
  el.id = "fatal-error";
  el.textContent = message;
  container.appendChild(el);
};

/* Fire up PIX. */
if (
  SURF.init(
    document.getElementById("canvas")! as HTMLCanvasElement,
    g.SCREEN_WIDTH,
    g.SCREEN_HEIGHT
  ) !== true
) {
  const error = new Error("Unable to initialize Pixelf: " + SURF.getError());
  console.error(error);
  showFatalError(error.message);
} else {
  const screen = SURF.getMainSurface(); // global reference to screen for blitting

  initTouchControls(container);

  main(screen).catch((e: unknown) => {
    console.error(e);
    showFatalError(
      e instanceof Error ? e.message : "The game failed to start."
    );
  });
}
