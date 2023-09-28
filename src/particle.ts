import { Surface } from "./surfaces";
import "./globals";

type Particle_t = {
  x: number;
  y: number /* coordinates of the particle */;
  energy: number /* velocity of the particle */;
  angle: number /* angle of the particle */;
  r: number;
  g: number;
  b: number /* color */;
};

const particles: Particle_t[] = []; // up to MAX_PARTICLES items

let activeParticles: number = 0;

const addParticle = (particle: Particle_t) => {
  /* if there are too many particles, forget it */
  if (activeParticles >= MAX_PARTICLES) return;
  particles[activeParticles] = particle;
  activeParticles++;
};

const deleteParticle = (index: number) => {
  /* replace the particle with the one at the end of the list and shorten the list */
  particles[index] = particles[activeParticles - 1];
  activeParticles--;
};

const drawParticles = (
  dest: Surface,
  cameraX: number,
  cameraY: number
): void => {
  let pixels: Uint8ClampedArray; // each pixel is 4 * 8 bit unsigned integer (32 bits)

  pixels = dest.pixels;

  for (let i = 0; i < activeParticles; i++) {
    let x: number;
    let y: number;
    let color: Uint8ClampedArray; // a 4 item Uint8ClapedArray representing one 32 bit pixel

    x = particles[i].x - cameraX;
    y = particles[i].y - cameraY;

    if (x < 0 || x >= SCREEN_WIDTH) continue;
    if (y < 0 || y >= SCREEN_HEIGHT) continue;

    /* find the color of this particle */
    color = createPixel(particles[i].r, particles[i].g, particles[i].b);

    pixels[(dest.w / 2) * y + x + 0] = color[0];
    pixels[(dest.w / 2) * y + x + 1] = color[1];
    pixels[(dest.w / 2) * y + x + 2] = color[2];
    pixels[(dest.w / 2) * y + x + 3] = color[3];
  }
};

export const updateParticles = (): void => {
  for (let i = 0; i < activeParticles; i++) {
    particles[i].x +=
      particles[i].energy *
      Math.cos((particles[i].angle * Math.PI) / 180) *
      timeScale;
    particles[i].y +=
      particles[i].energy *
      -Math.sin((particles[i].angle * Math.PI) / 180) *
      timeScale;

    /* fade the particles color */
    particles[i].r--;
    particles[i].g--;
    particles[i].b--;

    if (particles[i].r < 0) particles[i].r = 0;
    if (particles[i].g < 0) particles[i].g = 0;
    if (particles[i].b < 0) particles[i].b = 0;

    if (particles[i].r + particles[i].g + particles[i].b === 0) {
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
  energy: number,
  density: number
): void => {
  let particle: Particle_t;

  for (let i = 0; i < density; i++) {
    particle = {
      x,
      y,
      angle: (Math.random() * 1028) % 360,
      energy: ((Math.random() * 1028) % (energy * 1000)) / 1000,
      r,
      g,
      b,
    };
    addParticle(particle);
  }
};

const createPixel = (
  red: number,
  green: number,
  blue: number
): Uint8ClampedArray => {
  return new Uint8ClampedArray([red, green, blue, 255]);
};
