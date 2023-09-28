import "./globals";
import { Surface } from "./surfaces"; // import types
import * as SURF from "./surfaces";

type LED_Display = {
  led_surface: Surface;
  phys_w: number;
  phys_h: number;
  virt_w: number;
  virt_h: number;
  virt_x: number;
  virt_y: number;
  on_image: Surface;
  off_image: Surface;
};

//  // color => new Uint8ClampedArray([red, green, blue, 255])
const drawChar5x5 = (
  dest: Surface,
  ch: string,
  color: Uint8ClampedArray,
  x: number,
  y: number
) => {};

/* initialise the LED display. the parameters are:
cols, rows = physical size of the LED display in LEDs
vCols, vRows = size of the LEDs display buffer in LEDs the visible area of the display can be scrolled
on, off = filenames of the bitmaps to use for the 'on' LED and 'off' LED
returns 0 on success and -1 on error */
/* not a pure function mutates disp in place */
const LED_CreateDisplay = (
  disp: LED_Display, // this is the block
  cols: number,
  rows: number,
  vcols: number,
  vrows: number,
  on: string,
  off: string
): void => {
  let c: Uint8ClampedArray = new Uint8ClampedArray([0, 0, 0, 0]);
  let i: number;

  disp.led_surface = SURF.createSurface(vcols, vrows);
  disp.virt_w = vcols;
  disp.virt_h = vrows;
  disp.phys_w = cols;
  disp.phys_h = rows;
  disp.virt_x = 0;
  disp.virt_y = 0;

  // for(i=0; i<256; i++) {
  //   c[0] = i;
  //   c[1] = i;
  //   c[2] = i;
  //   c[3] = 255;

  // }
};

const LED_FreeDisplay = (disp: LED_Display) => {
  // don't implement this for now.
};

const LED_DrawDisplay = (
  disp: LED_Display,
  dest: Surface,
  x: number,
  y: number
) => {
  let row: number;
  let col: number;
};

export const InitStatusDisplay = () => {};
/* Initializes the status display system.
   Returns 0 on success, -1 on failure.
   Must be called after setting a video mode. */

export const CleanupStatusDisplay = () => {};
/* Shuts down the status display system. */

export const SetStatusMessage = (msg: string) => {};
/* Sets the scrolling status message at the top
   of the display. The message will scroll by once,
   then disappear. */

export const SetPlayerStatusInfo = (
  score: number,
  shields: number,
  charge: number
) => {};

export const SetOpponentStatusInfo = (score: number, shields: number) => {};
/* Sets the player or opponent's on-screen status
   information. */

export const UpdateStatusDisplay = (screen: Surface) => {};
/* Updates and redraws the status display. */
