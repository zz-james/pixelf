import * as g from "./globals";
import { Surface, Rect } from "./surfaces"; // import types
import * as SURF from "./surfaces";
import * as IMG from "./image";

import { Font5x5 } from "./font5x5";

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

/* initialise the LED display. the parameters are:
cols, rows = physical size of the LED display in LEDs
vCols, vRows = size of the LEDs display buffer in LEDs the visible area of the display can be scrolled
on, off = filenames of the bitmaps to use for the 'on' LED and 'off' LED
returns 0 on success and -1 on error */
/* not a pure function mutates disp in place */
const LED_CreateDisplay = async (
  disp: LED_Display, // this is the block
  cols: number,
  rows: number,
  vcols: number,
  vrows: number,
  on: string /* path to image */,
  off: string /* path to image */
): Promise<boolean> => {
  let c: Uint8ClampedArray = new Uint8ClampedArray([0, 0, 0, 0]);
  let i: number;

  disp.led_surface = SURF.createSurface(vcols, vrows);
  disp.virt_w = vcols;
  disp.virt_h = vrows;
  disp.phys_w = cols;
  disp.phys_h = rows;
  disp.virt_x = 0;
  disp.virt_y = 0;

  for (i = 0; i < 256; i++) {
    c[0] = i;
    c[1] = i;
    c[2] = i;
    c[3] = 255;
  }

  const imageQueue: HTMLImageElement[] = IMG.queueImages([on, off]); // this goes into a loading list

  let imageSurfaces: Surface[];

  try {
    imageSurfaces = await IMG.loadImages(imageQueue);
  } catch (e) {
    throw new Error(e as string);
  }

  disp.on_image = imageSurfaces[0];
  disp.off_image = imageSurfaces[1];

  return true;
};

const LED_FreeDisplay = (disp: LED_Display): void => {
  // don't implement this for now.
  console.log(disp);
};

/* renders an LED display to a surface, starting at (x,y) on the destination */
const LED_DrawDisplay = (
  disp: LED_Display,
  dest: Surface,
  x: number,
  y: number
): void => {
  let row: number;
  let col: number;

  let srcRect: Rect = {
    w: disp.on_image.w,
    h: disp.on_image.h,
    x: 0,
    y: 0,
  };

  let destRect: Rect = srcRect;

  let leds: Uint8ClampedArray = disp.led_surface.pixels; // get pointer to pixels

  for (row = 0; row < disp.phys_h; row++) {
    for (col = 0; col < disp.phys_w; col++) {
      let led: number;
      destRect.x = col * disp.on_image.w + x;
      destRect.y = row * disp.on_image.h + y;
      led = leds[row + disp.virt_y * disp.led_surface.w + col + disp.virt_x];
      if (led) {
        SURF.blitSurface(disp.on_image, srcRect, dest, destRect);
      } else {
        SURF.blitSurface(disp.off_image, srcRect, dest, destRect);
      }
    }
  }

  // unlock surface
};

//  // color => new Uint8ClampedArray([red, green, blue, 255])
const drawChar5x5 = (
  dest: Surface,
  ch: number, // see the definition of Font5x5
  color: number,
  x: number,
  y: number
) => {
  let pixels: Uint8ClampedArray;
  let sx: number;
  let sy: number;

  let data = Font5x5[ch];

  pixels = dest.pixels;

  for (sy = 0; sy < 5; sy++) {
    for (sx = 0; sx < 5; sx++) {
      if (data[5 * sy + sx] !== " ") {
        pixels[dest.w * (y + sy) + x + sx] = color;
      } else {
        pixels[y + sy + x + sx] = 0;
      }
    }
  }

  // unlock surface
};

/**
 * status.ts is divided into two parts. The first part implements the LED simulator
 * described earlier, and the second part uses the simulator to create game status
 * displays for Penguin Warrior.
 */

const SCROLLER_BUF_SIZE = 10;
const scroller_buf: number[] = []; // char scroller_buf[SCROLLER_BUF_SIZE];

/* message to scroll. this can be changed */
let scrollerMsg: string = "Welcome to Penguin Warrior";
let scrollerPos = 0;
let scrollerTicks = 0;

/* various LED displays that appear on the penguin warrior screen */
let playerScore: LED_Display;
let playerShields: LED_Display;
let playerCharge: LED_Display;

let opponentScore: LED_Display;
let opponentShields: LED_Display;
let statusMsg: LED_Display;

/* Initializes the status display system.
Returns 0 on success, -1 on failure. 
quite messy and with side effects rather than returning 
*/
export const initStatusDisplay = async (): Promise<boolean> => {
  if (
    // make LED_CreateDislay return a LED_DISPLAY object
    // and assign it here ie.
    // playerScore = LED_CreateDisplay(... etc)

    (await LED_CreateDisplay(
      playerScore,
      12,
      5,
      12,
      5,
      "led-red-on.png",
      "led-red-off.png"
    )) === false
  ) {
    return false;
  }
  if (
    (await LED_CreateDisplay(
      playerShields,
      12,
      1,
      12,
      1,
      "led-red-on.png",
      "led-red-off.png"
    )) === false
  ) {
    return false;
  }
  if (
    (await LED_CreateDisplay(
      playerCharge,
      80,
      1,
      80,
      1,
      "led-red-on.png",
      "led-red-off.png"
    )) === false
  ) {
    return false;
  }
  if (
    (await LED_CreateDisplay(
      opponentScore,
      12,
      5,
      12,
      5,
      "led-red-on.png",
      "led-red-off.png"
    )) === false
  ) {
    return false;
  }
  if (
    (await LED_CreateDisplay(
      opponentShields,
      12,
      1,
      12,
      1,
      "led-red-on.png",
      "led-red-off.png"
    )) === false
  ) {
    return false;
  }
  if (
    (await LED_CreateDisplay(
      statusMsg,
      56,
      5,
      66,
      5,
      "led-green-on.png",
      "led-green-off.png"
    )) === false
  ) {
    return false;
  }
  return true;
};

/* Shuts down the status display system. */
export const CleanupStatusDisplay = () => {
  LED_FreeDisplay(playerScore);
  LED_FreeDisplay(playerShields);
  LED_FreeDisplay(playerCharge);
  LED_FreeDisplay(opponentScore);
  LED_FreeDisplay(opponentShields);
  LED_FreeDisplay(statusMsg);
};

/* Sets the scrolling status message at the top
of the display. The message will scroll by once,
then disappear. */
export const setStatusMessage = (msg: string) => {
  scrollerPos = 0;
  scrollerMsg = msg;
};

export const setPlayerStatusInfo = (
  score: number,
  shields: number,
  charge: number
) => {
  const buf: number[] = [0, 0, 0];
  let pixels: Uint8ClampedArray;
  let i: number;

  // set the score counter
  // sprintf(buf, "%2i", score);
  console.log(score);

  drawChar5x5(playerScore.led_surface, buf[0], 1, 0, 0);
  drawChar5x5(playerScore.led_surface, buf[1], 1, 6, 0);

  // set the shield bar
  // SDL_LockSurface(playerShields.led_surface)
  pixels = playerShields.led_surface.pixels;

  for (i = 0; i < 12; i++) {
    if (i < (shields * 12) / 100) {
      pixels[i] = 1;
    } else {
      pixels[i] = 0;
    }
  }
  // SURF.unlockSurface(playerShields.led_surface);

  /* set the phaser charge bar */
  // SURF.lockSurface(playerCharge.led_surface);

  pixels = playerCharge.led_surface.pixels;
  for (i = 0; i < 80; i++) {
    if (i < (charge * 80) / g.PHASER_CHARGE_MAX) {
      pixels[i] = 1;
    } else {
      pixels[i] = 0;
    }
  }

  // SURF.unlocksurface(playerCharge.led_surface)
};

/* Sets the player or opponent's on-screen status
information. */
export const setOpponentStatusInfo = (score: number, shields: number) => {
  const buf: number[] = [0, 0, 0];
  let pixels: Uint8ClampedArray;
  let i: number;

  /* set the score counter */
  // sprintf(buf, "%2i", score);
  console.log(score);
  drawChar5x5(opponentScore.led_surface, buf[0], 1, 0, 0);
  drawChar5x5(opponentScore.led_surface, buf[1], 1, 6, 0);

  /* set shield as bar */
  // SURF.locksurface(opponentShields.ledsurface)
  pixels = opponentShields.led_surface.pixels;
  for (i = 0; i < 12; i++) {
    if (i < (shields * 12) / 100) {
      pixels[i] = 1;
    } else {
      pixels[i] = 0;
    }
  }
  // SURF.unlocksuface(opponentShields.ledsurface)
};

/* Updates and redraws the status display. */
export const updateStatusDisplay = (screen: Surface) => {
  let i: number;

  /**
   * update the scroller
   * this is not linked to the global time_scale since speed
   * doesn't really matter. the only effect of a high framerate
   * would be that the scrolling message would move faster
   */
  if (scrollerTicks % 6 == 0) {
    let ch: number;
    for (i = 0; i < SCROLLER_BUF_SIZE - 1; i++) {
      scroller_buf[i] = scroller_buf[i + 1];
    }
    if (scrollerMsg[scrollerPos] == "\0") {
      // end of string so maybe use length
      ch = " ".charCodeAt(0);
      scrollerPos--;
    } else {
      ch = scrollerMsg[scrollerPos].charCodeAt(0);
    }
    scrollerPos++;
    scroller_buf[i] = ch;
    statusMsg.virt_x = 0;
    for (i = 0; i < SCROLLER_BUF_SIZE; i++) {
      drawChar5x5(statusMsg.led_surface, scroller_buf[i], 1, 6 * i, 0);
    }
  } else {
    statusMsg.virt_x++;
  }

  scrollerTicks++;
  LED_DrawDisplay(playerScore, screen, 0, 0);
  LED_DrawDisplay(playerShields, screen, 0, 48);
  LED_DrawDisplay(
    statusMsg,
    screen,
    96 + (g.SCREEN_WIDTH - 2 * 96 - 448) / 2,
    0
  );
  LED_DrawDisplay(opponentScore, screen, g.SCREEN_WIDTH - 96, 0);
  LED_DrawDisplay(opponentShields, screen, g.SCREEN_WIDTH - 96, 48);
};
