import { Surface } from "./surfaces";
import * as g from "../globals";

/*
 * Particles are stored as a structure of arrays in typed arrays that are
 * allocated once, up front. Nothing in the per-frame update/draw path (or when
 * creating an explosion) allocates, so the garbage collector stays quiet even
 * with MAX_PARTICLES live. Index i across all arrays describes one particle.
 */
/* captured here because createParticleExplosion has a parameter named g */
const MAX_PARTICLES = g.MAX_PARTICLES;

const px = new Int32Array(MAX_PARTICLES); // world coordinates of the particle
const py = new Int32Array(MAX_PARTICLES);
const energy = new Int32Array(MAX_PARTICLES); // velocity of the particle
const angle = new Int16Array(MAX_PARTICLES); // direction in degrees, 0..359
const red = new Uint8Array(MAX_PARTICLES); // colour, faded towards 0
const green = new Uint8Array(MAX_PARTICLES);
const blue = new Uint8Array(MAX_PARTICLES);

let activeParticles: number = 0;

const deleteParticle = (index: number) => {
  /* replace the particle with the one at the end of the list and shorten the list */
  const last = activeParticles - 1;
  px[index] = px[last];
  py[index] = py[last];
  energy[index] = energy[last];
  angle[index] = angle[last];
  red[index] = red[last];
  green[index] = green[last];
  blue[index] = blue[last];
  activeParticles--;
};

export const drawParticles = (
  dest: Surface,
  cameraX: number,
  cameraY: number
): void => {
  const pixels = dest.pixels; // each pixel is 4 * 8 bit unsigned integer (32 bits)
  const rowBytes = dest.w * 4;

  for (let i = 0; i < activeParticles; i++) {
    const x = px[i] - cameraX;
    const y = py[i] - cameraY;

    if (x < 0 || x >= g.SCREEN_WIDTH) continue;
    if (y < 0 || y >= g.SCREEN_HEIGHT) continue;

    /* write the particle's colour straight into the frame buffer */
    const offset = y * rowBytes + x * 4;
    pixels[offset + 0] = red[i];
    pixels[offset + 1] = green[i];
    pixels[offset + 2] = blue[i];
    pixels[offset + 3] = 255;
  }
};

export const updateParticles = (): void => {
  for (let i = 0; i < activeParticles; i++) {
    const a = angle[i];
    px[i] += (energy[i] * Math.cos(a * (Math.PI / 180))) | 0;
    py[i] += (energy[i] * -Math.sin(a * (Math.PI / 180))) | 0;

    /* fade the particles color */
    if (red[i] > 0) red[i]--;
    if (green[i] > 0) green[i]--;
    if (blue[i] > 0) blue[i]--;

    if (red[i] + green[i] + blue[i] === 0) {
      deleteParticle(i);
      // deleted particle replaces the current particle with the one at the end of the list
      // so we need to take a step back
      i--;
    }
  }
};

export const createParticleExplosion = (
  x: number,
  y: number,
  r: number,
  g: number,
  b: number,
  maxEnergy: number,
  density: number
): void => {
  const energyRange = ((maxEnergy * 1000) / 1000) | 0;

  for (let i = 0; i < density; i++) {
    /* if there are too many particles, forget it */
    if (activeParticles >= MAX_PARTICLES) return;

    const n = activeParticles;
    px[n] = x;
    py[n] = y;
    angle[n] = ((Math.random() * 1028) | 0) % 360;
    energy[n] = ((Math.random() * 1028) | 0) % energyRange;
    red[n] = r;
    green[n] = g;
    blue[n] = b;
    activeParticles++;
  }
};
