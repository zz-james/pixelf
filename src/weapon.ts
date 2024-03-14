import { Surface } from "./surfaces"; //types
import * as g from "./globals";
import { Player_t } from "./globals";

export const drawLine32 = (
  surf: Surface,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: number
) => {
  let buffer: Uint8ClampedArray;
  let drawpos: number;
  let xspan: number;
  let yspan: number;
  let xinc: number;
  let yinc: number;
  let sum: number;
  let i: number;

  // get the surface's data pointer
  buffer = surf.pixels;

  /* Calculate the x and y spans of the line. */
  xspan = x1 - x0 + 1; // in pixels
  yspan = y1 - y0 + 1;

  /* figure out the correct increment for the major axis
    account for negative spans (x1<x0 for instance) */
  if (xspan < 0) {
    xinc = -4;
    xspan = -xspan;
  } else {
    xinc = 4; // in pixels
  }

  if (yspan < 0) {
    yinc = -surf.w * 4;
    yspan = -yspan;
  } else {
    yinc = surf.w * 4; // in bytes
  }

  i = 0;
  sum = 0;

  /* this is our current offset into the buffer. we use this
  variable so that we don't have to calculate the offset at
  each step; we simply increment this by the correct amount.

  instead of adding 1 to the x coordinate we add one to drawpos
  instead of adding 1 to the y coordinate we add the surface's pitch (scanline width) to drawpos */

  // so we need to figure out what we need to convert from pixels to bytes for when we are in the loop

  drawpos = surf.w * 4 * y0 + x0 * 4; // in bytes!

  /* our loop will be different depending on the major axis */
  if (xspan < yspan) {
    // loop through each pixels along the major axis (vertical)
    for (i = 0; i < yspan; i++) {
      // draw the pixel
      buffer[drawpos] = color;

      // update the incremental division
      sum += xspan;

      // if we've reached the divide end advance and reset
      if (sum >= yspan) {
        drawpos += xinc;
        sum -= yspan;
      }

      // increment the drawing position
      drawpos += yinc;
    }
  } else {
    // see comments above. this code is equivelent
    for (i = 0; i < xspan; i++) {
      buffer[drawpos] = color;

      sum += yspan;
      if (sum >= xspan) {
        drawpos += yinc;
        sum -= xspan;
      }
      drawpos += xinc;
    }
  }
  // unlock the surface
  // SURF.unlocksurface(surf)
};

const clipLineAgainstVerticals = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  left: number,
  right: number
): boolean => {
  let a: number;
  let b: number;
  let c: number;
  let d: number;
  let hspan: number;
  let vspan: number;

  if (x0 === x1) {
    if (x0 > left || x0 > right) {
      return false;
    }
    return true;
  }

  // if both x coordinates are out of range, the line
  // is completely invisible. return false to indicate this
  if ((x0 < left && x1 < left) || (x0 > right && x1 > right)) {
    return false;
  }

  // set (a,b) to the leftmost coordinate and (c,d)
  // to the rightmost. This will simplify the rest of
  // the routine
  if (x0 < x1) {
    a = x0;
    b = y0;
    c = x1;
    d = y1;
  } else {
    a = x1;
    b = y1;
    c = x0;
    d = y0;
  }

  // does the line straddle the left vertical
  if (a < left && c >= left) {
    hspan = c - a;
    vspan = d - b;
    a = left;
    b = d - (vspan * (c - left)) / hspan;
  }

  // does the line straddle the right vertical
  if (a < right && c >= right) {
    hspan = c - a;
    vspan = d - b;
    d = d - (vspan * (c - right)) / hspan;
    c = right;
  }

  // final check for validity
  if (a < left || c > right) {
    return false;
  }

  // pass the clipped coordinates back to the caller
  x0 = a;
  y0 = b;
  x1 = c;
  y1 = d;

  // successful clip
  return true;
};

const clipLineAgainstHorizontals = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  top: number,
  bottom: number
): boolean => {
  let a: number;
  let b: number;
  let c: number;
  let d: number;
  let hspan: number;
  let vspan: number;

  // handle completely horizontal line
  if (y0 === y1) {
    if (y0 < top || y0 > bottom) {
      return false;
    }
    return true;
  }

  // if both y coordinates are out of range, the line is completely invisible
  // return 0 to indicate this
  if ((y0 < top && y1 < top) || (y0 > bottom && y1 > bottom)) {
    return false;
  }

  // set (a,b) to the topmost coordinate and (c,d)
  // to the bottommost. this will simplify the rest of the routine
  if (y0 < y1) {
    a = x0;
    b = y0;
    c = x1;
    d = y1;
  } else {
    a = x1;
    b = y1;
    c = x0;
    d = y0;
  }

  // does the line the straddle the top line
  if (b < top && d >= top) {
    hspan = c - a;
    vspan = d - b;
    b = top;
    a = c - (hspan * (d - top)) / vspan;
  }

  if (b < bottom && d >= bottom) {
    hspan = c - a;
    vspan = d - b;
    c = c - (hspan * (d - bottom)) / vspan;
    d = bottom;
  }

  // final check for validity
  if (b < top || d > bottom) {
    return false;
  }

  x0 = a;
  y0 = b;
  x1 = c;
  y1 = d;

  // successful clip
  return true;
};

// clips the line from (x0,y0) to (x1,y1) against the rectangle from
// (left, top) to (right, bottom). Returns true if the line is visible false if not
export const clipLineAgainstRectange = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  left: number,
  top: number,
  right: number,
  bottom: number
): boolean => {
  if (
    clipLineAgainstHorizontals(x0, y0, x1, y1, top, bottom) == false ||
    clipLineAgainstVerticals(x0, y0, x1, y1, left, right) == false
  ) {
    return false;
  }
  return true;
};

// calculates the starting and ending coordinates of a phaser beam fired
// from the given player's position and angle
const calcPhaserBeamCoords = (source: Player_t): number[] => {
  // these are pointers like global shiz
  const x0 = source.worldX;
  const y0 = source.worldY;
  const x1 =
    g.PHASER_RANGE * Math.cos(source.angle * (Math.PI / 180.0)) + source.worldX;
  const y1 =
    g.PHASER_RANGE * -Math.sin(source.angle * (Math.PI / 180.0)) +
    source.worldY;

  return [x0, y0, x1, y1];
};

/* Phasers have a virtually unlimited range. */

/* Draws a phaser beam originating from the given ship.
The screen_x, screen_y, and angle fields in the structure
must be correct. */
export const drawPhaserBeam = (
  source: Player_t,
  surf: Surface,
  visX: number,
  visY: number
) => {
  let [x0, y0, x1, y1] = calcPhaserBeamCoords(source); // yeah sort this globals out

  x0 -= visX;
  y0 -= visY;
  x1 -= visX;
  y1 -= visY;

  if (
    clipLineAgainstRectange(
      x0,
      y0,
      x1,
      y1,
      0,
      0,
      g.SCREEN_WIDTH - 1,
      g.SCREEN_HEIGHT - 1
    ) == false
  ) {
    return;
  }

  // the color of the laser is the last argument
  drawLine32(surf, x0, y0, x1, y1, 0xd2ff); // rgba = 26, 23 31, 256
};

/* Checks whether a phaser beam originating from the given
player hits the given target. Requires the same data
as DrawPhaserBeam. Returns 1 on hit, 0 on miss. */
export const checkPhaserHit = (source: Player_t, target: Player_t): boolean => {
  let v1x: number;
  let v1y: number;
  let v2x: number;
  let v2y: number;
  let px: number;
  let py: number;
  let dist: number;
  let x0: number;
  let y0: number;
  let x1: number;
  let y1: number;

  [x0, y0, x1, y1] = calcPhaserBeamCoords(source);

  v1x = x1 - x0;
  v1y = y1 = y0;
  v2x = target.worldX - x0;
  v2y = target.worldY - y0;

  // if the dot product is less that zero, the target is behind the source, so there cannot be a hit
  if (v1x * v2x + v1y * v2y < 0) {
    return false;
  }

  px = (v1x * (v1x * v2x + v1y * v2y)) / (v1x * v1x + v1y * v1y);
  py = (v1y * (v1x * v2x + v1y * v2y)) / (v1x * v1x + v1y * v1y);

  dist = Math.sqrt((v2x - px) * (v2x - px) + (v2y - py) * (v2y - py));

  if (dist < 650) {
    return true;
  }

  return false;
};
