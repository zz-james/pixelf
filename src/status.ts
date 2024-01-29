import * as g from "./globals";
import { Surface, Rect, Coord } from "./surfaces"; // import types
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
  cols: number,
  rows: number,
  vcols: number,
  vrows: number,
  on: string /* path to image */,
  off: string /* path to image */
): Promise<LED_Display> => {
  let c: Uint8ClampedArray = new Uint8ClampedArray([0, 0, 0, 0]);
  let i: number;

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

  const disp: LED_Display = {
    led_surface: SURF.createSurface(vcols, vrows),
    virt_w: vcols,
    virt_h: vrows,
    phys_w: cols,
    phys_h: rows,
    virt_x: 0,
    virt_y: 0,
    on_image: imageSurfaces[0],
    off_image: imageSurfaces[1],
  };

  return disp;
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

  let destCoord: Coord = { x: 0, y: 0 };

  let leds: Uint8ClampedArray = disp.led_surface.pixels; // get pointer to pixels

  for (row = 0; row < disp.phys_h; row++) {
    for (col = 0; col < disp.phys_w; col++) {
      let led: number;
      destCoord.x = col * disp.on_image.w + x;
      destCoord.y = row * disp.on_image.h + y;

      led = leds[row * disp.led_surface.w + col];

      if (led) {
        SURF.blitSurface(disp.on_image, srcRect, dest, destCoord);
      } else {
        SURF.blitSurface(disp.off_image, srcRect, dest, destCoord);
      }
      SURF.blitToCanvas();
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
  const fontWidth = 5;
  pixels = dest.pixels;

  for (sy = 0; sy < 5; sy++) {
    for (sx = 0; sx < 5; sx++) {
      if (data[fontWidth * sy + sx] !== " ") {
        pixels[dest.w * (y + sy) + (x + sx)] = color;
      } else {
        pixels[dest.w * (y + sy) + (x + sx)] = 0;
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

export const initStatusDisplay = async (): Promise<boolean> => {
  playerScore = await LED_CreateDisplay(
    12,
    5,
    12,
    5,
    "led-red-on.png",
    "led-red-off.png"
  );

  playerShields = await LED_CreateDisplay(
    12,
    1,
    12,
    1,
    "led-red-on.png",
    "led-red-off.png"
  );

  playerCharge = await LED_CreateDisplay(
    80,
    1,
    80,
    1,
    "led-red-on.png",
    "led-red-off.png"
  );

  opponentScore = await LED_CreateDisplay(
    12,
    5,
    12,
    5,
    "led-red-on.png",
    "led-red-off.png"
  );

  opponentShields = await LED_CreateDisplay(
    12,
    1,
    12,
    1,
    "led-red-on.png",
    "led-red-off.png"
  );

  statusMsg = await LED_CreateDisplay(
    56,
    5,
    66,
    5,
    "led-green-on.png",
    "led-green-off.png"
  );
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
  score: number = 0,
  shields: number = 0,
  charge: number = 0
) => {
  const buf: number[] = [0, 0, 0];
  let pixels: Uint8ClampedArray;
  let i: number;

  // set the score counter
  // sprintf(buf, "%2i", score);
  // console.log(score);

  // drawChar5x5(playerScore.led_surface, buf[0], 1, 0, 0);
  // drawChar5x5(playerScore.led_surface, buf[1], 1, 6, 0);

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
  // drawChar5x5(opponentScore.led_surface, buf[0], 1, 0, 0);
  // drawChar5x5(opponentScore.led_surface, buf[1], 1, 6, 0);

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

    if (scrollerPos === scrollerMsg.length - 1) {
      ch = " ".charCodeAt(0);
      scrollerPos--;
    } else {
      ch = scrollerMsg[scrollerPos].charCodeAt(0);
    }
    scrollerPos++;

    scroller_buf[i] = ch;

    statusMsg.virt_x = 0;

    console.log(scroller_buf);

    for (let j = 0; j < SCROLLER_BUF_SIZE; j++) {
      drawChar5x5(statusMsg.led_surface, scroller_buf[j] || 32, 1, 6 * j, 0); // move along x 6 at a time
    }
  } else {
    statusMsg.virt_x++;
  }

  scrollerTicks++;
  // LED_DrawDisplay(playerScore, screen, 0, 0);
  // LED_DrawDisplay(playerShields, screen, 0, 48);
  LED_DrawDisplay(
    statusMsg,
    screen,
    0, //96 + (g.SCREEN_WIDTH - 2 * 96 - 448) / 2,
    0
  );
  // LED_DrawDisplay(opponentScore, screen, g.SCREEN_WIDTH - 96, 0);
  // LED_DrawDisplay(opponentShields, screen, g.SCREEN_WIDTH - 96, 48);
};
