import * as SURF from "./surfaces";
import { Surface, Rect, Coord } from "./surfaces"; // types
import * as IMG from "./image";
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

    oppIconState: 0,
  };
};

export const cleanUpRadarDisplay = () => {
  if (radar.radarSurface !== null) {
    // radar.radarSurface.freesurface();
  }
};

const distance = (x: number, y: number, v: number, w: number) => {
  return Math.sqrt((Math.abs(x - v) ^ 2) + (Math.abs(y - w) ^ 2));
};

export const updateRadarDisplay = (
  screen: Surface,
  playerX: number,
  playerY: number,
  oppX: number,
  oppY: number
) => {
  // first draw radar background on screen
  let src: Rect = {
    x: 0,
    y: 0,
    w: radar.physicW,
    h: radar.physicH,
  };

  let dest: Rect = {
    x: radar.physicX,
    y: radar.physicY,
    w: radar.physicW,
    h: radar.physicH,
  };

  SURF.blitSurface(radar.radarSurface, src, screen, dest);

  // now do player 'dot' on the screen on top of the radar (why don't we blit onto the radar surface then blit at the end?)

  // start with player dot
  let playerBlobSrcRect: Rect = {
    w: radar.playerIcon.w,
    h: radar.playerIcon.h,
    x: 0,
    y: 0,
  };

  // figure the x, y by scaling the player x, y
  let destCoord: Coord = {
    x: ((playerX / (g.WORLD_WIDTH / 100)) | 0) + radar.physicX,
    y: ((playerY / (g.WORLD_HEIGHT / 100)) | 0) + radar.physicY,
  };

  if (
    distance(
      playerX / (g.WORLD_WIDTH / 100),
      playerY / (g.WORLD_HEIGHT / 100),
      50,
      50
    ) < 8
  ) {
    // draw player icon
    SURF.blitSurface(radar.playerIcon, playerBlobSrcRect, screen, destCoord);
  }

  //now do the opponent blob

  // start with player dot
  let oppenentBlobSrcRect: Rect = {
    w: radar.oppIconOn.w,
    h: radar.oppIconOn.h,
    x: 0,
    y: 0,
  };

  // figure the x and y of the blob by scaling the x and y of opponent
  destCoord.x = ((oppX / (g.WORLD_WIDTH / 100)) | 0) + radar.physicX;
  destCoord.y = ((oppY / (g.WORLD_HEIGHT / 100)) | 0) + radar.physicY;

  if (
    distance(
      oppX / (g.WORLD_WIDTH / 100),
      oppY / (g.WORLD_HEIGHT / 100),
      50,
      50
    ) < 8
  ) {
    if (radar.oppIconState < 10) {
      // draw opposition icon
      SURF.blitSurface(radar.oppIconOn, oppenentBlobSrcRect, screen, destCoord);
      radar.oppIconState++;
    } else if (radar.oppIconState <= 20) {
      SURF.blitSurface(
        radar.oppIconOff,
        oppenentBlobSrcRect,
        screen,
        destCoord
      );
      radar.oppIconState++;
      if (radar.oppIconState === 20) {
        radar.oppIconState = 0;
      }
    }
  }
};
