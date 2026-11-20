import { Surface } from "./pixelf/surfaces"; //types
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

  /* Calculate the x and y spans of the line, in pixels. The span is the
    distance plus one (both end pixels are drawn) in either direction, so work
    out the direction first and only then add one to the magnitude.
    Account for negative spans (x1<x0 for instance) in the increments. */
  xspan = x1 - x0;
  if (xspan < 0) {
    xinc = -4;
    xspan = -xspan + 1;
  } else {
    xinc = 4; // in bytes
    xspan = xspan + 1;
  }

  yspan = y1 - y0;
  if (yspan < 0) {
    yinc = -surf.w * 4;
    yspan = -yspan + 1;
  } else {
    yinc = surf.w * 4; // in bytes
    yspan = yspan + 1;
  }

  i = 0;
  sum = 0;

  /* this is our current offset into the buffer. we use this
  variable so that we don't have to calculate the offset at
  each step; we simply increment this by the correct amount.

  instead of adding 1 to the x coordinate we add one to drawpos
  instead of adding 1 to the y coordinate we add the surface's pitch (scanline width) to drawpos */

  // so we need to figure out what we need to convert from pixels to bytes for when we are in the loop

  drawpos = surf.w * (4 * y0) + 4 * x0; // in bytes!

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

/* The clip functions work in place on a line stored as [x0, y0, x1, y1] in a
   Float64Array, so the clipped endpoints reach the caller and nothing is
   allocated per call. They return false if no part of the line is visible,
   in which case the array contents are undefined. */

const clipLineAgainstVerticals = (
  line: Float64Array,
  left: number,
  right: number
): boolean => {
  const x0 = line[0];
  const y0 = line[1];
  const x1 = line[2];
  const y1 = line[3];

  let a: number;
  let b: number;
  let c: number;
  let d: number;
  let hspan: number;
  let vspan: number;

  // handle completely vertical line
  if (x0 === x1) {
    if (x0 < left || x0 > right) {
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

  // pass the clipped coordinates back to the caller, keeping the original
  // endpoint order so that (x0, y0) stays the end the line started from
  if (x0 < x1) {
    line[0] = a;
    line[1] = b;
    line[2] = c;
    line[3] = d;
  } else {
    line[0] = c;
    line[1] = d;
    line[2] = a;
    line[3] = b;
  }

  // successful clip
  return true;
};

const clipLineAgainstHorizontals = (
  line: Float64Array,
  top: number,
  bottom: number
): boolean => {
  const x0 = line[0];
  const y0 = line[1];
  const x1 = line[2];
  const y1 = line[3];

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
  // return false to indicate this
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

  // pass the clipped coordinates back to the caller, keeping the original
  // endpoint order so that (x0, y0) stays the end the line started from
  if (y0 < y1) {
    line[0] = a;
    line[1] = b;
    line[2] = c;
    line[3] = d;
  } else {
    line[0] = c;
    line[1] = d;
    line[2] = a;
    line[3] = b;
  }

  // successful clip
  return true;
};

// clips the line in place against the rectangle from (left, top) to
// (right, bottom). Returns true if the line is visible, false if not.
// The horizontal clip runs first and the vertical clip works on its result.
export const clipLineAgainstRectange = (
  line: Float64Array,
  left: number,
  top: number,
  right: number,
  bottom: number
): boolean => {
  if (
    clipLineAgainstHorizontals(line, top, bottom) == false ||
    clipLineAgainstVerticals(line, left, right) == false
  ) {
    return false;
  }
  return true;
};

// calculates the starting and ending coordinates of a phaser beam fired
// from the given player's position and angle
// Results are written into the shared beamCoords buffer as [x0, y0, x1, y1]
// so no array is allocated per call (hot path, called every frame).
const beamCoords = new Float64Array(4);

const calcPhaserBeamCoords = (source: Player_t): void => {
  beamCoords[0] = source.worldX;
  beamCoords[1] = source.worldY;
  beamCoords[2] =
    g.PHASER_RANGE * Math.cos(source.angle * (Math.PI / 180.0)) + source.worldX;
  beamCoords[3] =
    g.PHASER_RANGE * -Math.sin(source.angle * (Math.PI / 180.0)) +
    source.worldY;
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
  calcPhaserBeamCoords(source);

  // convert to screen coordinates, in place
  beamCoords[0] -= visX;
  beamCoords[1] -= visY;
  beamCoords[2] -= visX;
  beamCoords[3] -= visY;

  // clip the beam to the screen; beamCoords then holds the visible part
  if (
    clipLineAgainstRectange(
      beamCoords,
      0,
      0,
      g.SCREEN_WIDTH - 1,
      g.SCREEN_HEIGHT - 1
    ) == false
  ) {
    return;
  }

  // drawLine32 indexes the buffer from its start point, so that must be a
  // whole pixel. Clipping can move it off the grid; the far end can stay as is.
  const x0 = Math.round(beamCoords[0]);
  const y0 = Math.round(beamCoords[1]);
  const x1 = beamCoords[2];
  const y1 = beamCoords[3];

  // the color of the laser is the last argument
  drawLine32(surf, x0, y0, x1, y1, 0xd2ff); // rgba = 26, 23 31, 256
};

/* Checks whether a phaser beam originating from the given
player hits the given target. Requires the same data
as DrawPhaserBeam. Returns true on hit, false on miss. */
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

  calcPhaserBeamCoords(source);
  x0 = beamCoords[0];
  y0 = beamCoords[1];
  x1 = beamCoords[2];
  y1 = beamCoords[3];

  v1x = x1 - x0;
  v1y = y1 - y0;
  v2x = target.worldX - x0;
  v2y = target.worldY - y0;

  // if the dot product is less that zero, the target is behind the source, so there cannot be a hit
  if (v1x * v2x + v1y * v2y < 0) {
    return false;
  }

  px = (v1x * (v1x * v2x + v1y * v2y)) / (v1x * v1x + v1y * v1y);
  py = (v1y * (v1x * v2x + v1y * v2y)) / (v1x * v1x + v1y * v1y);

  dist = Math.sqrt((v2x - px) * (v2x - px) + (v2y - py) * (v2y - py));

  if (dist < 200) {
    return true;
  }

  return false;
};
