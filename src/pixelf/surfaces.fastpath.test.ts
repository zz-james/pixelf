import { describe, it, expect } from "vitest";
import { blitSurface, Surface, Rect, Coord } from "./surfaces";

/**
 * Checks the 32-bit fast path in blitSurface against the original
 * byte-by-byte version (copied here unchanged), including the awkward cases:
 * drawing off every edge of the destination, fractional coordinates, and
 * pixel arrays that cannot be viewed as whole pixels. If these pass, the fast
 * path is a drop-in replacement.
 */

/* The original blitSurface, verbatim. */
const legacyBlit = (
  src: Surface,
  srcRect: Rect,
  dest: Surface,
  destCoord: Coord
) => {
  const destPixels = dest.pixels;
  const srcPixels = src.pixels;
  const srcPitch = src.w * 4;
  const destPitch = dest.w * 4;
  const srcRowLength = srcRect.w * 4;
  const srcStart = srcRect.x * 4;
  const srcEnd = srcStart + srcRowLength;
  const destStartX = destCoord.x * 4;
  const offSet = destStartX - srcStart;
  for (let row = 0; row < srcRect.h; row++) {
    for (let col = srcStart; col < srcEnd; col += 4) {
      const srcPixelByte = srcPitch * row + col;
      if (!srcPixels[srcPixelByte + 3]) continue;
      const destPixelByte = destPitch * (row + destCoord.y) + col + offSet;
      destPixels[destPixelByte + 0] = srcPixels[srcPixelByte + 0];
      destPixels[destPixelByte + 1] = srcPixels[srcPixelByte + 1];
      destPixels[destPixelByte + 2] = srcPixels[srcPixelByte + 2];
      destPixels[destPixelByte + 3] = srcPixels[srcPixelByte + 3];
    }
  }
};

/* small seeded generator, so a failure is repeatable */
const makeRand = (start: number) => {
  let seed = start;
  return (n: number): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed % n;
  };
};

const randomSurface = (
  w: number,
  h: number,
  rand: (n: number) => number,
  transparentOneIn = 3
): Surface => {
  const pixels = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    pixels[i * 4] = rand(256);
    pixels[i * 4 + 1] = rand(256);
    pixels[i * 4 + 2] = rand(256);
    pixels[i * 4 + 3] = rand(transparentOneIn) === 0 ? 0 : 1 + rand(255);
  }
  return { w, h, pixels };
};

const copy = (s: Surface): Surface => ({
  w: s.w,
  h: s.h,
  pixels: new Uint8ClampedArray(s.pixels),
});

/* Reports the first differing byte. A plain toEqual on a 640x480 buffer makes
   Vitest spend minutes diffing over a million values when it fails. */
const expectSame = (a: Surface, b: Surface, label: string) => {
  expect(a.pixels.length, `${label}: length`).toBe(b.pixels.length);
  let first = -1;
  for (let i = 0; i < a.pixels.length; i++) {
    if (a.pixels[i] !== b.pixels[i]) {
      first = i;
      break;
    }
  }
  expect(
    first,
    first === -1
      ? label
      : `${label}: first difference at byte ${first} (pixel ${first >> 2}): got ${a.pixels[first]}, expected ${b.pixels[first]}`
  ).toBe(-1);
};

describe("blitSurface fast path matches the original byte-by-byte blit", () => {
  it("over random placements, including partly or wholly off the destination", () => {
    const rand = makeRand(2024);
    for (let i = 0; i < 400; i++) {
      const src = randomSurface(1 + rand(14), 1 + rand(14), rand);
      const dest = randomSurface(1 + rand(24), 1 + rand(24), rand, 1000);

      // rects that may overrun the source, placed anywhere around the destination
      const srcRect: Rect = {
        x: rand(src.w + 2) - 1,
        y: 0,
        w: rand(src.w + 3),
        h: rand(src.h + 3),
      };
      const destCoord: Coord = {
        x: rand(dest.w + 24) - 12,
        y: rand(dest.h + 24) - 12,
      };

      const viaLegacy = copy(dest);
      const viaFast = copy(dest);
      legacyBlit(src, srcRect, viaLegacy, destCoord);
      blitSurface(src, srcRect, viaFast, destCoord);
      expectSame(
        viaFast,
        viaLegacy,
        `case ${i}: rect ${JSON.stringify(srcRect)} at ${JSON.stringify(destCoord)}`
      );
    }
  });

  it("with fractional coordinates and sizes", () => {
    const rand = makeRand(99);
    for (let i = 0; i < 100; i++) {
      const src = randomSurface(2 + rand(10), 2 + rand(10), rand);
      const dest = randomSurface(4 + rand(20), 4 + rand(20), rand, 1000);
      const srcRect: Rect = {
        x: rand(src.w) + (rand(2) ? 0.5 : 0),
        y: 0,
        w: 1 + rand(src.w) + (rand(2) ? 0.25 : 0),
        h: 1 + rand(src.h) + (rand(2) ? 0.5 : 0),
      };
      const destCoord: Coord = {
        x: rand(dest.w) + (rand(2) ? 0.5 : 0),
        y: rand(dest.h) + (rand(2) ? 0.5 : 0),
      };
      const viaLegacy = copy(dest);
      const viaFast = copy(dest);
      legacyBlit(src, srcRect, viaLegacy, destCoord);
      blitSurface(src, srcRect, viaFast, destCoord);
      expectSame(viaFast, viaLegacy, `fractional case ${i}`);
    }
  });

  it("with pixel arrays that are not aligned to whole pixels", () => {
    const rand = makeRand(7);
    // views starting 2 bytes into a buffer cannot be read as 32-bit pixels
    const unaligned = (w: number, h: number): Surface => {
      const buf = new ArrayBuffer(w * h * 4 + 8);
      const pixels = new Uint8ClampedArray(buf, 2, w * h * 4);
      for (let i = 0; i < pixels.length; i++) pixels[i] = rand(256);
      for (let i = 3; i < pixels.length; i += 4) {
        pixels[i] = rand(3) === 0 ? 0 : 255;
      }
      return { w, h, pixels };
    };
    const src = unaligned(6, 5);
    const dest = unaligned(10, 8);
    const srcRect: Rect = { x: 1, y: 0, w: 4, h: 4 };
    const destCoord: Coord = { x: 3, y: 2 };

    const viaLegacy = copy(dest);
    const viaFast = copy(dest);
    legacyBlit(src, srcRect, viaLegacy, destCoord);
    blitSurface(src, srcRect, viaFast, destCoord);
    expectSame(viaFast, viaLegacy, "unaligned arrays");
  });

  it("for the game's own pattern: 64x64 tiles from a strip, drawn across a 640x480 screen from a negative start", () => {
    const rand = makeRand(31337);
    const strip = randomSurface(64 * 4, 64, rand, 8);
    const base = randomSurface(640, 480, rand, 1000);
    const viaLegacy = copy(base);
    const viaFast = copy(base);

    for (const [startX, startY] of [
      [0, 0],
      [-37, -11],
      [-63, -63],
    ]) {
      for (let y = startY; y < 480; y += 64) {
        for (let x = startX; x < 640; x += 64) {
          const srcRect: Rect = { x: 64 * rand(4), y: 0, w: 64, h: 64 };
          const destCoord: Coord = { x, y };
          legacyBlit(strip, srcRect, viaLegacy, destCoord);
          blitSurface(strip, srcRect, viaFast, destCoord);
        }
      }
    }
    expectSame(viaFast, viaLegacy, "tile layer pattern");
  });
});
