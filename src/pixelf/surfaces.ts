/**
 * CANVAS: is the DOM object of type canvas
 * CTX: is the canvas controlling object
 *
 * IMAGE_DATA: is the canvas data area sort of image buffer for the canvas the
 * statement CTX.putImageData(IMAGE_DATA, 0, 0); copies the buffer to screen
 *
 * VIDEO_BUFFER: is a working buffer which we copy into IMAGE_DATA before we update the screen
 *
 * CANVAS_VIEW: in order for VIDEO_BUFFER and IMAGE_DATA to be compatable
 * we need to set an Uint8ClampedArray view into VIDEO_BUFFER as IMAGE_DATA
 * is a Uint8ClampedArray type. This view is called CANVAS_VIEW. We copy data from
 * the working buffeer (VIDEO_BUFFER) to the canvas buffer (IMAGE_DATA) with the statement
 * IMAGE_DATA.data.set(CANVAS_VIEW)
 *
 * RGB_VIEW: in order to work with 32 bit pixel values directly we also
 * need a Uint32Array view into video buffer, this is RGB_VIEW
 *
 * LITTLE_ENDIAN: as boolean which is true is the hardware is little endian
 * otherwise it is false
 */

export type Surface = {
  pixels: Uint8ClampedArray;
  h: number;
  w: number;
};

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Coord = {
  x: number;
  y: number;
};

let error: string = ""; // error message string
/* boolean to determine endianness */
export const little_endian: boolean =
  new Int8Array(new Int16Array([1]).buffer)[0] > 0;

let ctx: CanvasRenderingContext2D; // holds context object
let imageData: ImageData; // typed array holding context image data

let mainSurfaceWidth: number; // surface width in pixels
let mainSurfaceHeight: number; // surface height in pixels
let mainBuffer: Uint8ClampedArray; // framebuffer that we can flip to canvas
let mainBufferSize: number; // size of the buffer (in bytes?)
// let tix: number = new Date().getTime();

/**
 * initialises the pix_elf library
 * runs compatability tests returns true
 * if the browser is compatable
 * set the shared ctx variable to point to the canvas context
 * the ArrayBuffer mainBuffer is created
 * @param canvas :dom  //a reference to the canvas DOM object
 * @param w :number //the width of the main surface
 * @param h :number // the height of the main surface
 * @returns {boolean}
 */
export const init = (
  canvas: HTMLCanvasElement,
  w: number,
  h: number
): boolean => {
  if (!canvas.getContext("2d")) {
    error = "could not get context";
    return false;
  }

  ctx = canvas.getContext("2d", { willReadFrequently: true })!; // default sRGB colour space

  imageData = ctx.getImageData(0, 0, w, h); // the whole image data for the canvas
  mainBuffer = imageData.data;

  mainSurfaceHeight = h;
  mainSurfaceWidth = w;
  mainBufferSize = mainBuffer.length;

  defaultSrcRect.w = w;
  defaultSrcRect.h = h;

  return true;
};

/**
 * gets surface with a pionter to the main image buffer.
 * this data will sync to canvas?
 * when PIX.updateRect is called?
 * @returns {Surface}
 */
export const getMainSurface = (): Surface => ({
  pixels: mainBuffer,
  h: mainSurfaceHeight,
  w: mainSurfaceWidth,
});

/**
 * copy a surface's data to screen
 * @param src_surface
 * @param src
 * @param dest
 * @constructor
 */
/* default arguments for blitToCanvas, allocated once instead of per call */
const defaultSrcRect: Rect = { x: 0, y: 0, w: 0, h: 0 };
const defaultDestCoord: Coord = { x: 0, y: 0 };

export const blitToCanvas = (
  srcRect: Rect = defaultSrcRect,
  destCoord: Coord = defaultDestCoord
) => {
  // Finally, we use putImageData() to copy the image data back to the canvas
  ctx.putImageData(
    imageData, // imageData is the object associated with the mainBuffer
    destCoord.x, // Horizontal position (x coordinate) at which to place the image data in the destination canvas
    destCoord.y, // Vertical position (y coordinate) at which to place the image data in the destination canvas.
    srcRect.x, // Horizontal position (x coordinate) of the top-left corner from which the image data will be extracted. Defaults to 0
    srcRect.y, // Vertical position (y coordinate) of the top-left corner from which the image data will be extracted. Defaults to 0
    mainSurfaceWidth, // Width of the rectangle to be painted. Defaults to the width of the image data.
    mainSurfaceHeight // Height of the rectangle to be painted. Defaults to the height of the image data.
  );
};

export const createSurfaceWithImage = (image: HTMLImageElement): Surface => {
  const offscreen_canvas = new OffscreenCanvas(image.width, image.height);
  const offscreen_context = offscreen_canvas.getContext("2d", {
    willReadFrequently: true,
  })!;
  // @ts-ignore
  offscreen_context.drawImage(image, 0, 0);
  return {
    w: image.width,
    h: image.height,
    // @ts-ignore
    pixels: offscreen_context.getImageData(0, 0, image.width, image.height)
      .data, // extract typedArray
  };
};

export const createSurface = (width: number, height: number): Surface => {
  const offscreen_canvas = new OffscreenCanvas(width, height);
  const offscreen_context = offscreen_canvas.getContext("2d", {
    willReadFrequently: true,
  })!;

  return {
    w: width,
    h: height,
    // @ts-ignore
    pixels: offscreen_context.getImageData(0, 0, width, height).data, // extract typedArray
  };
};

// unused
// export const freeSurface = (surface: Surface) => {
//   surface.pixels = new Uint8ClampedArray([]);
// };

/**
 * this just a function to display whatever is in the buffer of a
 * picture object not usually used in a game
 * @param surface
 */
export const showImageData = function (surface: Surface) {
  let surfacePixels = surface.pixels;

  if (surfacePixels.length > mainBufferSize) {
    error = "main display buffer overflow";
  }
  const tempImageData = new ImageData(surfacePixels, surface.w, surface.h);
  ctx.putImageData(
    tempImageData,
    0,
    0,
    0,
    0,
    mainSurfaceWidth,
    mainSurfaceHeight
  );
};

/* 32-bit views of pixel arrays, so a blit can move a whole pixel per read and
   write. A view is made once per surface (looked up by its pixel array) and
   reused, so nothing is allocated per blit after the first.
   The view is signed (Int32Array) on purpose: the pixels are only copied and
   masked, never compared, and on a phone's JavaScript engine signed loads
   were measurably cheaper than unsigned ones. */
const views = new WeakMap<Uint8ClampedArray, Int32Array>();

const view32 = (pixels: Uint8ClampedArray): Int32Array | undefined => {
  let v = views.get(pixels);
  if (v === undefined) {
    if (pixels.byteOffset % 4 !== 0 || pixels.byteLength % 4 !== 0) {
      return undefined; // can't be viewed as whole pixels: caller uses the byte path
    }
    v = new Int32Array(pixels.buffer, pixels.byteOffset, pixels.length >> 2);
    views.set(pixels, v);
  }
  return v;
};

/* Which bits of a 32-bit pixel hold the alpha byte. A pixel is R,G,B,A in
   memory, so alpha is the top byte of the word on a little-endian machine. */
const ALPHA_MASK = little_endian ? 0xff000000 : 0x000000ff;

/**
 * blit one surface to another surface
 *
 * A pixel is copied whole (no blending) unless its source alpha is 0.
 * Pixels that fall outside the destination array are dropped, and a row that
 * runs off the left or right edge carries on into the next or previous row,
 * exactly as the byte-by-byte version always did. The source rows are read
 * from row 0 of the source: srcRect.y is ignored.
 *
 * @param src
 * @param srcRect
 * @param dest
 * @param destCoord
 */
export const blitSurface = (
  src: Surface,
  srcRect: Rect = { x: 0, y: 0, w: src.w, h: src.h },
  dest: Surface,
  destCoord: Coord = { x: 0, y: 0 }
) => {
  const sx = srcRect.x;
  const sw = srcRect.w;
  const sh = srcRect.h;
  const dx = destCoord.x;
  const dy = destCoord.y;

  const src32 = view32(src.pixels);
  const dest32 = view32(dest.pixels);

  /* The fast path needs whole-pixel views and whole-number coordinates.
     Anything else (not seen in the game) takes the original byte path, so
     the result is the same either way. */
  if (
    src32 === undefined ||
    dest32 === undefined ||
    !Number.isInteger(sx) ||
    !Number.isInteger(sw) ||
    !Number.isInteger(sh) ||
    !Number.isInteger(dx) ||
    !Number.isInteger(dy)
  ) {
    blitSurfaceBytes(src, srcRect, dest, destCoord);
    return;
  }

  const srcW = src.w;
  const destW = dest.w;

  /* There is no clipping on purpose. Reads outside the source give undefined
     (alpha 0, so skipped) and writes outside the destination array are
     ignored by typed arrays, which is the behaviour the byte path relied on. */
  for (let row = 0; row < sh; row++) {
    const si = row * srcW + sx; // first source pixel of this row
    const di = (row + dy) * destW + dx; // first destination pixel of this row

    /* Eight pixels at a time: if none of the eight has any alpha, skip them
       all with one test. Sprite and star layers are mostly transparent, so
       this skips most of the work there. Otherwise copy each opaque pixel. */
    let k = 0;
    for (; k + 8 <= sw; k += 8) {
      const a = src32[si + k];
      const b = src32[si + k + 1];
      const c = src32[si + k + 2];
      const d = src32[si + k + 3];
      const e = src32[si + k + 4];
      const f = src32[si + k + 5];
      const g = src32[si + k + 6];
      const h = src32[si + k + 7];
      if (((a | b | c | d | e | f | g | h) & ALPHA_MASK) === 0) continue;
      if ((a & ALPHA_MASK) !== 0) dest32[di + k] = a;
      if ((b & ALPHA_MASK) !== 0) dest32[di + k + 1] = b;
      if ((c & ALPHA_MASK) !== 0) dest32[di + k + 2] = c;
      if ((d & ALPHA_MASK) !== 0) dest32[di + k + 3] = d;
      if ((e & ALPHA_MASK) !== 0) dest32[di + k + 4] = e;
      if ((f & ALPHA_MASK) !== 0) dest32[di + k + 5] = f;
      if ((g & ALPHA_MASK) !== 0) dest32[di + k + 6] = g;
      if ((h & ALPHA_MASK) !== 0) dest32[di + k + 7] = h;
    }
    for (; k < sw; k++) {
      const s = src32[si + k];
      if ((s & ALPHA_MASK) !== 0) dest32[di + k] = s;
    }
  }
};

/* The original blit, one byte at a time. Used when the fast path can't apply,
   and as the reference the fast path must match. */
const blitSurfaceBytes = (
  src: Surface,
  srcRect: Rect,
  dest: Surface,
  destCoord: Coord
) => {
  const destPixels = dest.pixels;
  const srcPixels = src.pixels;

  const srcPitch = src.w * 4; // the width of the src in bytes
  const destPitch = dest.w * 4; // the width of the dest in bytes

  const srcRowLength = srcRect.w * 4; // length of a row in bytes
  const srcStart = srcRect.x * 4;
  const srcEnd = srcStart + srcRowLength;

  const destStartX = destCoord.x * 4;
  const offSet = destStartX - srcStart;

  // loop over the number of rows you have to draw
  for (let row = 0; row < srcRect.h; row++) {
    // loop over the pixels in each row
    for (let col = srcStart; col < srcEnd; col += 4) {
      // col is in pixels
      const srcPixelByte = srcPitch * row + col;
      if (!srcPixels[srcPixelByte + 3]) continue; // skip if alpha is zero
      const destPixelByte = destPitch * (row + destCoord.y) + col + offSet;
      destPixels[destPixelByte + 0] = srcPixels[srcPixelByte + 0]; // r
      destPixels[destPixelByte + 1] = srcPixels[srcPixelByte + 1]; // g
      destPixels[destPixelByte + 2] = srcPixels[srcPixelByte + 2]; // b
      destPixels[destPixelByte + 3] = srcPixels[srcPixelByte + 3]; // a
    }
  }
};

/**
 * retrieves any error string
 * @constructor
 */
export const getError = (): string => {
  return error;
};

// unused
// /**
//  * this is a utility function - we using it to custom blit image data
//  * @param dst
//  * @param dstOffset *in bytes!*
//  * @param src
//  * @param srcOffset *in bytes!*
//  * @param length *in bytes!*
//  */
// export const memcpy = (
//   dst: ArrayBuffer,
//   dstOffset: number,
//   src: ArrayBuffer,
//   srcOffset: number,
//   length: number
// ) => {
//   var dstU8 = new Uint8Array(dst, dstOffset, length);
//   var srcU8 = new Uint8Array(src, srcOffset, length);
//   dstU8.set(srcU8);
// };
//
// export const loadBMP = () => {};
