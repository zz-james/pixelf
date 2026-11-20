import * as g from "./globals";
import { Surface, Rect, Coord } from "./pixelf/surfaces"; // import types
import * as SURF from "./pixelf/surfaces";
import * as IMG from "./pixelf/image";

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
  const imageQueue: HTMLImageElement[] = IMG.queueImages([on, off]); // this goes into a loading list

  const imageSurfaces: Surface[] = await IMG.loadImages(imageQueue);

  const disp: LED_Display = {
    led_surface: SURF.createSurface(vcols, vrows),
    phys_w: cols,
    phys_h: rows,
    virt_w: vcols,
    virt_h: vrows,
    virt_x: 0,
    virt_y: 0,
    on_image: imageSurfaces[0],
    off_image: imageSurfaces[1],
  };

  return disp;
};

/* scratch values reused by every LED_DrawDisplay call so nothing is allocated per frame */
const ledSrcRect: Rect = { x: 0, y: 0, w: 0, h: 0 };
const ledDestCoord: Coord = { x: 0, y: 0 };

/* renders an LED display to a surface, starting at (x,y) on the destination */
const LED_DrawDisplay = (
  disp: LED_Display,
  dest: Surface,
  x: number,
  y: number
): void => {
  let row: number;
  let col: number;
  const srcRect = ledSrcRect;
  const destCoord = ledDestCoord;
  srcRect.w = disp.on_image.w;
  srcRect.h = disp.on_image.h;
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

const SCROLLER_BUF_SIZE = 10; // the number of characters in the scolling message display
const scroller_buf: number[] = []; // array of char codes that are used to load the status screen letters using font5x5;

/* message to scroll. this can be changed */
let scrollerMsg: string = "Welcome to Penguin Warrior";
let scrollerPos = 0; // cursor along the scrolling message
let scrollerTicks = 0; // used to control timing so scrolling display updates every 6 frames

/* various LED displays that appear on the penguin warrior screen */
let playerScore: LED_Display;
let playerShields: LED_Display;
let playerCharge: LED_Display;

let opponentScore: LED_Display;
let opponentShields: LED_Display;
let statusMsg: LED_Display;

export const initStatusDisplay = async (): Promise<boolean> => {
  playerScore = await LED_CreateDisplay(
    g.HUD_SCORE_COLS,
    g.HUD_SCORE_ROWS,
    g.HUD_SCORE_COLS,
    g.HUD_SCORE_ROWS,
    "led-red-on.png",
    "led-red-off.png"
  );

  playerShields = await LED_CreateDisplay(
    g.HUD_SHIELD_LEDS,
    1,
    g.HUD_SHIELD_LEDS,
    1,
    "led-red-on.png",
    "led-red-off.png"
  );

  playerCharge = await LED_CreateDisplay(
    g.HUD_CHARGE_LEDS,
    1,
    g.HUD_CHARGE_LEDS,
    1,
    "led-red-on.png",
    "led-red-off.png"
  );

  opponentScore = await LED_CreateDisplay(
    g.HUD_SCORE_COLS,
    g.HUD_SCORE_ROWS,
    g.HUD_SCORE_COLS,
    g.HUD_SCORE_ROWS,
    "led-red-on.png",
    "led-red-off.png"
  );

  opponentShields = await LED_CreateDisplay(
    g.HUD_SHIELD_LEDS,
    1,
    g.HUD_SHIELD_LEDS,
    1,
    "led-red-on.png",
    "led-red-off.png"
  );

  statusMsg = await LED_CreateDisplay(
    g.HUD_MESSAGE_COLS,
    g.HUD_MESSAGE_ROWS,
    g.HUD_MESSAGE_BUFFER_COLS,
    g.HUD_MESSAGE_ROWS,
    "led-green-on.png",
    "led-green-off.png"
  );
  return true;
};

/* Sets the scrolling status message at the top
of the display. The message will scroll by once,
then disappear. */
export const setStatusMessage = (msg: string) => {
  scrollerPos = 0;
  scrollerMsg = msg;
};

/* Sets a shield bar on an LED display based on shield percentage (0-100). */
const setShieldBar = (display: LED_Display, shields: number): void => {
  const pixels = display.led_surface.pixels;
  for (let i = 0; i < g.HUD_SHIELD_LEDS; i++) {
    pixels[i] =
      i < (shields * g.HUD_SHIELD_LEDS) / g.PLAYER_MAX_SHIELDS ? 1 : 0;
  }
};

/* Sets a score display using two 5x5 font digits. */
const setScoreDisplay = (
  display: LED_Display,
  score: number,
  x0: number,
  x1: number
): void => {
  const buf = score.toString().padStart(2, "0");
  drawChar5x5(display.led_surface, buf.charCodeAt(0), 1, x0, 0);
  drawChar5x5(display.led_surface, buf.charCodeAt(1), 1, x1, 0);
};

export const setPlayerStatusInfo = (
  score: number = 0,
  shields: number = 0,
  charge: number = 0
) => {
  setScoreDisplay(playerScore, score, 0, 6);
  setShieldBar(playerShields, shields);

  /* set the phaser charge bar */
  const pixels = playerCharge.led_surface.pixels;
  for (let i = 0; i < g.HUD_CHARGE_LEDS; i++) {
    pixels[i] = i < (charge * g.HUD_CHARGE_LEDS) / g.PHASER_CHARGE_MAX ? 1 : 0;
  }
};

/* Sets the opponent's on-screen status information. */
export const setOpponentStatusInfo = (score: number, shields: number) => {
  setScoreDisplay(opponentScore, score, 1, 7);
  setShieldBar(opponentShields, shields);
};

/* where the opponent's panel starts, and the scrolling message (centred between the panels) */
const OPPONENT_PANEL_X = g.SCREEN_WIDTH - g.HUD_PANEL_WIDTH;
const MESSAGE_X =
  g.HUD_PANEL_WIDTH +
  (g.SCREEN_WIDTH -
    2 * g.HUD_PANEL_WIDTH -
    g.HUD_MESSAGE_COLS * g.HUD_LED_SIZE) /
    2;

/* Updates and redraws the status display. */
export const updateStatusDisplay = (screen: Surface) => {
  let i: number;

  /**
   * update the scroller
   * called once per frame
   */
  if (scrollerTicks % 6 == 0) {
    scrollerTicks = 0; // no need to let scrollerTicks grow big
    let ch: number;

    for (i = 0; i < SCROLLER_BUF_SIZE - 1; i++) {
      scroller_buf[i] = scroller_buf[i + 1]; // move everything along by one. initially all undefined
    }

    // here we determing what char to add to the scroller_buf on line 337
    if (scrollerPos === scrollerMsg.length) {
      // if we are at the end of the msg
      ch = " ".charCodeAt(0); // add a space at the end
      scrollerPos--; // step back one (because length is 1 longer than highest array index?)
    } else {
      // if we are not at the end of the msg
      ch = scrollerMsg[scrollerPos].charCodeAt(0);
    }

    scrollerPos++; // move cursor along the scrolling message

    scroller_buf[i] = ch; // add the charcode to the scrollerMsg array

    // statusMsg.virt_x = 0; // make the virt_x to zero but why?

    // draw the characters onto the display by looping over scroller_buf
    for (let j = 0; j < SCROLLER_BUF_SIZE; j++) {
      drawChar5x5(statusMsg.led_surface, scroller_buf[j] || 32, 1, 6 * j, 0); // move along x 6 at a time
    }
  }
  // else {
  //  statusMsg.virt_x++;
  // }

  scrollerTicks++;
  LED_DrawDisplay(playerScore, screen, 0, 0);
  LED_DrawDisplay(playerShields, screen, 0, g.HUD_SHIELD_BAR_Y);
  LED_DrawDisplay(statusMsg, screen, MESSAGE_X, 0);
  LED_DrawDisplay(opponentScore, screen, OPPONENT_PANEL_X, 0);
  LED_DrawDisplay(opponentShields, screen, OPPONENT_PANEL_X, g.HUD_SHIELD_BAR_Y);
};
