import * as SURF from "./pixelf/surfaces";
import { Surface, Rect, Coord } from "./pixelf/surfaces"; // types
import * as IMG from "./pixelf/image";
import * as g from "./globals";

// enum IconState {
//   ON,
//   OFF,
// }

type RadarDisplay = {
  radarSurface: Surface;
  physicW: number;
  physicH: number;
  physicX: number;
  physicY: number;
  playerIcon: Surface;
  oppIconTimer: number; // ticks into the blink cycle, advanced by timeScale
  oppIconOn: Surface;
  oppIconOff: Surface;
};

let radar: RadarDisplay;

/* scratch rects reused every frame by updateRadarDisplay so nothing is allocated in the game loop */
const radarSrc: Rect = { x: 0, y: 0, w: 0, h: 0 };
const radarDest: Rect = { x: 0, y: 0, w: 0, h: 0 };
const iconSrc: Rect = { x: 0, y: 0, w: 0, h: 0 };
const iconDest: Coord = { x: 0, y: 0 };

export const initRadarDisplay = async () => {
  // filter the black ground

  // ** figure this out **
  //    Uint32 colorkey = SDL_MapRGB((radar.radar_surface)->format, 0, 0, 0);
  // SDL_SetColorKey(radar.radar_surface, SDL_SRCCOLORKEY, colorkey);
  // SDL_SetAlpha(radar.radar_surface, SDL_SRCALPHA, 128);

  const imageQueue: HTMLImageElement[] = IMG.queueImages([
    "led-green-on.png",
    "led-red-on.png",
    "led-red-off.png",
    "radar.png",
  ]);

  let imageSurfaces: Surface[];

  try {
    imageSurfaces = await IMG.loadImages(imageQueue);
  } catch (e) {
    throw new Error(e as string);
  }

  console.log(imageSurfaces);

  radar = {
    physicW: 100,
    physicH: 100,

    physicX: 0,
    physicY: g.SCREEN_HEIGHT - 100,
    radarSurface: imageSurfaces[3],
    playerIcon: imageSurfaces[0],
    oppIconOn: imageSurfaces[1],
    oppIconOff: imageSurfaces[2],

    oppIconTimer: 0,
  };
};

export const cleanUpRadarDisplay = () => {
  if (radar.radarSurface !== null) {
    // radar.radarSurface.freesurface();
  }
};

export const updateRadarDisplay = (
  screen: Surface,
  playerX: number,
  playerY: number,
  oppX: number,
  oppY: number,
  timeScale: number
) => {
  // first draw radar background on screen
  radarSrc.w = radar.physicW;
  radarSrc.h = radar.physicH;

  radarDest.x = radar.physicX;
  radarDest.y = radar.physicY;
  radarDest.w = radar.physicW;
  radarDest.h = radar.physicH;

  SURF.blitSurface(radar.radarSurface, radarSrc, screen, radarDest);

  // now do player 'dot' on the screen on top of the radar (why don't we blit onto the radar surface then blit at the end?)

  // start with player dot
  iconSrc.w = radar.playerIcon.w;
  iconSrc.h = radar.playerIcon.h;

  // figure the x, y by scaling the player x, y
  const scaledPlayerX = (playerX / (g.WORLD_WIDTH / 100)) | 0;
  const scaledPlayerY = (playerY / (g.WORLD_HEIGHT / 100)) | 0;

  iconDest.x = scaledPlayerX + radar.physicX;
  iconDest.y = scaledPlayerY + radar.physicY;

  if (
    scaledPlayerX >= 0 && scaledPlayerX < radar.physicW &&
    scaledPlayerY >= 0 && scaledPlayerY < radar.physicH
  ) {
    // draw player icon
    SURF.blitSurface(radar.playerIcon, iconSrc, screen, iconDest);
  }

  //now do the opponent blob

  // start with player dot
  iconSrc.w = radar.oppIconOn.w;
  iconSrc.h = radar.oppIconOn.h;

  // figure the x and y of the blob by scaling the x and y of opponent
  const scaledOppX = (oppX / (g.WORLD_WIDTH / 100)) | 0;
  const scaledOppY = (oppY / (g.WORLD_HEIGHT / 100)) | 0;

  iconDest.x = scaledOppX + radar.physicX;
  iconDest.y = scaledOppY + radar.physicY;

  // blink is time based so it runs at the same speed at any frame rate
  radar.oppIconTimer = (radar.oppIconTimer + timeScale) % g.RADAR_BLINK_PERIOD;

  if (
    scaledOppX >= 0 && scaledOppX < radar.physicW &&
    scaledOppY >= 0 && scaledOppY < radar.physicH
  ) {
    if (radar.oppIconTimer < g.RADAR_BLINK_PERIOD / 2) {
      // draw opposition icon
      SURF.blitSurface(radar.oppIconOn, iconSrc, screen, iconDest);
    } else {
      SURF.blitSurface(radar.oppIconOff, iconSrc, screen, iconDest);
    }
  }
};
