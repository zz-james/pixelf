import "./globals";
import { Surface, Rect } from "./surfaces"; // import types
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
): boolean => {
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

  return true;
};

const LED_FreeDisplay = (disp: LED_Display): void => {
  // don't implement this for now.
};

const LED_DrawDisplay = (
  disp: LED_Display,
  dest: Surface,
  x: number,
  y: number
): void => {
  let row: number;
  let col: number;
  let srcRect: Rect;
  let destRect: Rect;

  let leds: disp.led_surface.pixels;

  for (row = 0; row < disp.phys_h; row++) {
    for (col = 0; col < disp.phys_w; col++) {
      let led: number;
      destRect.x = col * disp.on_image.w + x;
      destRect.y = row * disp.on_image.h + y;
      led =
        leds[row + disp.virt_y * disp.led_surface.pitch + col + disp.virt_x];
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
  ch: string,
  color: Uint8ClampedArray,
  x: number,
  y: number
) => {
  let data: number;
  let pixels: number;
  let sx: number;
  let sy: number;

  data = Font5x5[ch];

  pixels = dest.pixels;

  for (sy = 0; sy < 5; sy++) {
    for (sx = 0; sx < 5; sx++) {
      if (data[5 * sy + sx] !== " ") {
        pixels[y + sy + x + sx] = color;
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
const scroller_buf = number[]; // char scroller_buf[SCROLLER_BUF_SIZE]; 

/* Initializes the status display system.
Returns 0 on success, -1 on failure.
Must be called after setting a video mode. */
export const InitStatusDisplay = ():boolean => {
  if(LED_CreateDisplay(player_score, 12, 5, 12, 5, "led-red-on.png", "led-red-off.png") === false) {
    return false;
  }
  if(LED_CreateDisplay(player_shields, 12, 1, 12, 1, "led-red-on.png", "led-red-off.png") === false) {
    return false;
  }
  if(LED_CreateDisplay(player_charge, 80,1,80,1,"led-red-on.png", "led-red-off.png") ===false) {
    return false;
  }
  if(LED_CreateDisplay(opponent_score, 12,5,12,5,"led-red-on.png", "led-red-off.png") ===false) {
    return false;
  }
  if(LED_CreateDisplay(opponent_shields, 12,1,12,1,"led-red-on.png", "led-red-off.png") ===false) {
    return false;
  }
  if(LED_CreateDisplay(status_msg, 56,5,66,5,"led-green-on.png", "led-green-off.png") ===false) {
    return false;
  }
  return true;
};

/* Shuts down the status display system. */
export const CleanupStatusDisplay = () => {
  LED_FreeDisplay(player_score);
  LED_FreeDisplay(player_shields);
  LED_FreeDisplay(player_charge);
  LED_FreeDisplay(opponent_score);
  LED_FreeDisplay(opponent_sheilds);
  LED_FreeDisplay(status_msg);
};

/* Sets the scrolling status message at the top
of the display. The message will scroll by once,
then disappear. */
export const setStatusMessage = (msg: string) => {
  scroller_pos = 0;
  scroller_msg = msg;
};


export const SetPlayerStatusInfo = (
  score: number,
  shields: number,
  charge: number
) => {
  const buf:number[];
  const pixels: number;
  let i: number;

  // set the score counter
  sprintf(buf, "%2i", score);
  drawChar5x5(player_score.led_surface, buf[0], 1, 0, 0);
  drawChar5x5(player_score.led_surface, buf[1], 1, 6, 0);

  // set the shield bar
  // SDL_LockSurface(player_shields.led_surface)
  pixels = player_shields.led_surface.pixels;

  for(i=0; i<12; i++) {
    if(i < shields * 12 / 100) {
      pixels[i] = 1;
    } else {
      pixels[i] = 0;
    }
  }
  // SURF.unlockSurface(player_sheilds.led_surface);

  /* set the phaser charge bar */
  // SURF.lockSurface(player_charge.led_surface);

  pixels = player_charge.led_surface;
  for(i=0; i<80; i++) {
    if(i<charge * 80 / PHASER_CHARGE_MAX) {
      pixels[i] = 1;
    } else {
      pixels[i] = 0;
    }
  }

  // SURF.unlocksurface(player_charge.led_surface)
};

/* Sets the player or opponent's on-screen status
information. */
export const SetOpponentStatusInfo = (score: number, shields: number) => {
  const buf:number[];
  const pixels: number;
  let i:number;

  /* set the score counter */
  // sprintf(buf, "%2i", score);
  drawChar5x5(opponent_score.led_surface, buf[0], 1, 0, 0);
  drawChar5x5(opponent_score.led_surface, buf[1], 1, 6,0);

  /* set shield as bar */
  // SURF.locksurface(opponent_sheilds.ledsurface)
  pixels = opponent_shields.led_surface.pixels;
  for(i = 0; i<12; i++) {
    if(i < shields * 12 / 100) {
      pixels[i] = 1;
    } else {
      pixels[i] = 0;
    }
  }
  // SURF.unlocksuface(opponent_sheilds.ledsurface)
};

/* Updates and redraws the status display. */
export const UpdateStatusDisplay = (screen: Surface) => {
  let i:number;

  /**
   * update the scroller
   * this is not linked to the global time_scale since speed
   * doesn't really matter. the only effect of a high framerate
   * would be that the scrolling message would move faster
   */
  if((scroller_ticks % 6) == 0) {
    let ch: number;
    for(i=0; i < SCROLLER_BUF_SIZE-1; i++) {
      scroller_buf[i] = scroller_buf[i+1];
    } 
    if(scroller_msg[scroller_pos] == '\0') {  // end of string so maybe use length
      ch = ' ';
      scroller_pos--;
    } else {
      ch = scroller_msg[scroller_pos];
    }
    scroller_pos++;
    scroller_buf[i] = ch;
    status_msg.virt_x = 0;
    for(i=0; i< SCROLLER_BUF_SIZE; i++) {
      drawChar5x5(status_msg.led_surface, scroller_buf[i], 1, 6*i, 0);
    }
  } else {
    status_msg.virt_x++
  }


  scroller_ticks++;
  LED_DrawDisplay(player_score, screen, 0,0);
  LED_DrawDisplay(player_sheilds, screen, 0, 48);
  LED_DrawDisplay(status_msg, screen, 96 + (SCREEN_WIDTH -2 * 96 - 448) /2, 0);
  LED_DrawDisplay(opponent_score, screen, SCREEN_WIDTH, - 96, 0);
  LED_DrawDisplay(opponent_sheild, screen, SCREEN_WIDTH - 96, 48);


};
