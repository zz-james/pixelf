import { Surface } from "./surfaces";
import * as IMG from "./image";
import * as g from "./globals";

enum IconState {
  ON,
  OFF,
}

type RadarDisplay = {
  radarSurface: Surface;
  physicW: number;
  physicH: number;
  physicX: number;
  physicY: number;
  playerIcon: Surface;
  oppIconState: number;
  oppIconOn: Surface;
  oppIconOff: Surface;
};

let radar: RadarDisplay;

export const initRadarDisplay = async () => {
  // filter the black ground

  // ** figure this out **
  //    Uint32 colorkey = SDL_MapRGB((radar.radar_surface)->format, 0, 0, 0);
  // SDL_SetColorKey(radar.radar_surface, SDL_SRCCOLORKEY, colorkey);
  // SDL_SetAlpha(radar.radar_surface, SDL_SRCALPHA, 128);

  radar.physicW = 100;
  radar.physicH = 100;

  radar.physicX = 0;
  radar.physicY = g.SCREEN_HEIGHT - 100;

  const imageQueue: HTMLImageElement[] = IMG.queueImages([
    "led-green-on.bmp",
    "led-red-on.bmp",
    "led-red-off.bmp",
  ]);

  let imageSurfaces: Surface[];

  try {
    imageSurfaces = await IMG.loadImages(imageQueue);
  } catch (e) {
    throw new Error(e as string);
  }

  radar.playerIcon = imageSurfaces[0];
  radar.oppIconOn = imageSurfaces[1];
  radar.oppIconOff = imageSurfaces[2];

  radar.oppIconState = 0;
};

const cleanUpRadarDisplay = () => {
  if (radar.radarSurface !== null) {
    // radar.radarSurface.freesurface();
  }
};

const distance = (x: number, y: number, v: number, w: number) => {
  return Math.sqrt(((x - v) ^ 2) + ((y - w) ^ 2));
};

export const updateRadarDisplay = (
  screen: Surface,
  playerX: number,
  playerY: number,
  oppX: number,
  oppY: number
) => {};
