import { describe, it, expect } from "vitest";
import { blitSurface, Surface, Rect, Coord } from "./surfaces";

/**
 * Pins down what blitSurface does, byte for byte, so a faster version can be
 * checked against it (see issue #60). Everything here uses the public surface
 * types and functions only.
 *
 * Behaviour covered: a pixel is copied whole (all four bytes, no blending)
 * unless its source alpha is 0, in which case the destination is untouched.
 *
 * Not covered on purpose: srcRect.y (blitSurface reads source rows from 0 and
 * ignores it, and the game only ever uses 0) and drawing outside the
 * destination (there is no clipping). Tests keep to what is well defined.
 */

type Pixel = [number, number, number, number];

const makeSurface = (
  w: number,
  h: number,
  pixelAt: (x: number, y: number) => Pixel
): Surface => {
  const pixels = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      pixels.set(pixelAt(x, y), (y * w + x) * 4);
    }
  }
  return { w, h, pixels };
};

const getPixel = (s: Surface, x: number, y: number): Pixel => {
  const i = (y * s.w + x) * 4;
  return [s.pixels[i], s.pixels[i + 1], s.pixels[i + 2], s.pixels[i + 3]];
};

const SENTINEL: Pixel = [200, 201, 202, 203];

/* A readable, slow version of the same rules, used to compare against. */
const referenceBlit = (
  src: Surface,
  srcRect: Rect,
  dest: Surface,
  destCoord: Coord
): void => {
  for (let row = 0; row < srcRect.h; row++) {
    for (let col = 0; col < srcRect.w; col++) {
      const px = getPixel(src, srcRect.x + col, srcRect.y + row);
      if (px[3] === 0) continue;
      dest.pixels.set(
        px,
        ((destCoord.y + row) * dest.w + destCoord.x + col) * 4
      );
    }
  }
};

const clone = (s: Surface): Surface => ({
  w: s.w,
  h: s.h,
  pixels: new Uint8ClampedArray(s.pixels),
});

describe("blitSurface", () => {
  it("copies a fully opaque source over the whole destination", () => {
    const src = makeSurface(5, 4, (x, y) => [
      10 + x,
      20 + y,
      30 + x + y,
      255,
    ]);
    const dest = makeSurface(5, 4, () => SENTINEL);
    const srcBefore = clone(src);

    blitSurface(src, { x: 0, y: 0, w: 5, h: 4 }, dest, { x: 0, y: 0 });

    expect(Array.from(dest.pixels)).toEqual(Array.from(src.pixels));
    expect(Array.from(src.pixels)).toEqual(Array.from(srcBefore.pixels));
  });

  it("leaves the destination alone where the source alpha is 0, and copies other alphas unblended", () => {
    // checkerboard: transparent where (x + y) is even; alpha 128 elsewhere in row 1
    const src = makeSurface(4, 4, (x, y) => {
      if ((x + y) % 2 === 0) return [1, 2, 3, 0];
      return [50 + x, 60 + y, 70, y === 1 ? 128 : 255];
    });
    const dest = makeSurface(4, 4, () => SENTINEL);

    blitSurface(src, { x: 0, y: 0, w: 4, h: 4 }, dest, { x: 0, y: 0 });

    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        if ((x + y) % 2 === 0) {
          expect(getPixel(dest, x, y)).toEqual(SENTINEL);
        } else {
          expect(getPixel(dest, x, y)).toEqual(getPixel(src, x, y));
        }
      }
    }
    // half-transparent pixels are copied as they are, not mixed with the destination
    expect(getPixel(dest, 0, 1)).toEqual([50, 61, 70, 128]);
  });

  it("copies a sub-rectangle to an offset and touches nothing else", () => {
    const src = makeSurface(6, 4, (x, y) => [x * 10 + 1, y * 10 + 1, 5, 255]);
    const dest = makeSurface(10, 8, () => SENTINEL);
    const before = clone(dest);

    blitSurface(src, { x: 2, y: 0, w: 3, h: 3 }, dest, { x: 4, y: 2 });

    // the copied block: dest (4..6, 2..4) holds src (2..4, 0..2)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        expect(getPixel(dest, 4 + col, 2 + row)).toEqual(
          getPixel(src, 2 + col, row)
        );
      }
    }
    // everything outside the block is exactly as before
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 10; x++) {
        const inside = x >= 4 && x <= 6 && y >= 2 && y <= 4;
        if (!inside) {
          expect(getPixel(dest, x, y)).toEqual(getPixel(before, x, y));
        }
      }
    }
  });

  it("matches the reference over many random sizes, offsets and alphas", () => {
    // small seeded generator, so a failure is repeatable
    let seed = 12345;
    const rand = (n: number): number => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed % n;
    };

    for (let i = 0; i < 200; i++) {
      const sw = 1 + rand(12);
      const sh = 1 + rand(12);
      const dw = 1 + rand(20);
      const dh = 1 + rand(20);
      const src = makeSurface(sw, sh, () => [
        rand(256),
        rand(256),
        rand(256),
        rand(3) === 0 ? 0 : rand(255) + 1, // about a third fully transparent
      ]);
      const dest = makeSurface(dw, dh, () => [
        rand(256),
        rand(256),
        rand(256),
        rand(256),
      ]);

      // a rect that fits in the source, placed so it fits in the destination
      const rw = 1 + rand(Math.min(sw, dw));
      const rh = 1 + rand(Math.min(sh, dh));
      const srcRect: Rect = { x: rand(sw - rw + 1), y: 0, w: rw, h: rh };
      const destCoord: Coord = { x: rand(dw - rw + 1), y: rand(dh - rh + 1) };

      const expected = clone(dest);
      referenceBlit(src, srcRect, expected, destCoord);

      blitSurface(src, srcRect, dest, destCoord);

      expect(Array.from(dest.pixels), `case ${i}`).toEqual(
        Array.from(expected.pixels)
      );
    }
  });
});
