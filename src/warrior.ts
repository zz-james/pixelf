import * as SURF from "./pixelf/surfaces";
import { updateParticles, drawParticles } from "./pixelf/particle";

import { shipStrip, loadGameData } from "./resources";
import { initBackground, drawBackground, drawParallax } from "./background";
import {
  initStatusDisplay,
  setPlayerStatusInfo,
  setOpponentStatusInfo,
  updateStatusDisplay,
} from "./status";
import { drawPhaserBeam } from "./weapon";
import { initRadarDisplay, updateRadarDisplay } from "./radar";

import { runGameScript } from "./scripting";
import { timeScale, updateTimeScale } from "./clock";
import {
  initPlayer,
  updatePlayer,
  chargePhasers,
  canPlayerFire,
  firePhasers,
} from "./player";

import { Rect, Surface } from "./pixelf/surfaces"; //types

import * as g from "./globals";
import { PlayerType, PlayerState, Player_t } from "./globals";
import {
  resetCombat,
  isRespawning,
  resolvePlayerShot,
  checkPlayerDeath,
  checkOpponentCombat,
  updateTimers,
} from "./combat";

import { readInput, applySteeringAndThrust, applyTurn } from "./input";

const player: Player_t = {
  type: PlayerType.WARRIOR,
  state: PlayerState.ATTACK,
  angle: 0,
  worldX: 0,
  worldY: 0,
  screenX: 0,
  screenY: 0,
  velocity: 0,
  accel: 0,
  shields: 0,
  firing: 0,
  charge: 100,
  score: 0,
  hit: 0,
}; // the player at the computer
const opponent: Player_t = {
  type: PlayerType.DEVIL,
  state: PlayerState.EVADE,
  angle: 0,
  worldX: 500,
  worldY: 500,
  screenX: 0,
  screenY: 0,
  velocity: 0,
  accel: 0,
  shields: 0,
  firing: 0,
  charge: 100,
  score: 0,
  hit: 0,
};

let cameraX: number; // position of the 640x480 viewport within the world
let cameraY: number;

let screen: Surface; /* global for convenience */

/* Game state - used across update functions */
let quit: boolean = false;

/**
 * Drawing
 */
const drawPlayer = (p: Player_t) => {
  let angle: number;

  // calculate the player's new screen coordinates
  p.screenX = p.worldX - cameraX;
  p.screenY = p.worldY - cameraY;

  // if player is not on screen, don't draw anything
  if (
    p.screenX < -g.PLAYER_WIDTH / 2 ||
    p.screenX >= g.SCREEN_WIDTH + g.PLAYER_WIDTH / 2
  ) {
    return;
  }

  if (
    p.screenY < -g.PLAYER_HEIGHT / 2 ||
    p.screenY >= g.SCREEN_HEIGHT + g.PLAYER_HEIGHT / 2
  ) {
    return;
  }

  // calculate drawing coordinates
  angle = p.angle;
  if (angle < 0) angle += 360;

  const src: Rect = {
    x: g.PLAYER_WIDTH * ((angle / 4) | 0), // lines up with px value in strip fighter.png
    y: 0,
    w: g.PLAYER_WIDTH,
    h: g.PLAYER_HEIGHT,
  };

  const dest: Rect = {
    x: p.screenX - g.PLAYER_WIDTH / 2,
    y: p.screenY - g.PLAYER_HEIGHT / 2,
    w: g.PLAYER_WIDTH,
    h: g.PLAYER_HEIGHT,
  };

  /* draw the sprite */
  SURF.blitSurface(shipStrip, src, screen, dest);
};

/* Reads the player's input and applies it: steering and thrust, firing and
   the resulting hit, the turn, then the death check. Disabled during respawn. */
const handleInput = (): void => {
  if (isRespawning()) return;

  const input = readInput();

  if (input.quit) {
    quit = true;
  }

  applySteeringAndThrust(player, input);

  if (input.fire && canPlayerFire(player)) {
    firePhasers(player);
    resolvePlayerShot(player, opponent);
  }

  applyTurn(player, input);

  /* Check for player death. */
  checkPlayerDeath(player, opponent);
};

/* Updates camera position to follow the player, clamped to world bounds. */
const updateCamera = (): void => {
  cameraX = (player.worldX - g.SCREEN_WIDTH / 2) | 0;
  cameraY = (player.worldY - g.SCREEN_HEIGHT / 2) | 0;

  if (cameraX < 0) cameraX = 0;
  if (cameraX >= g.WORLD_WIDTH - g.SCREEN_WIDTH)
    cameraX = g.WORLD_WIDTH - g.SCREEN_WIDTH - 1;
  if (cameraY < 0) cameraY = 0;
  if (cameraY >= g.WORLD_HEIGHT - g.SCREEN_HEIGHT)
    cameraY = g.WORLD_HEIGHT - g.SCREEN_HEIGHT - 1;
};

/* Draws everything to the screen buffer and flips to canvas. */
const renderFrame = (): void => {
  drawBackground(screen, cameraX, cameraY);
  drawParallax(screen, cameraX, cameraY);
  drawParticles(screen, cameraX, cameraY);

  if (opponent.firing) drawPhaserBeam(opponent, screen, cameraX, cameraY);
  if (player.firing) drawPhaserBeam(player, screen, cameraX, cameraY);

  if (!isRespawning()) drawPlayer(player);
  drawPlayer(opponent);

  updateStatusDisplay(screen);
  updateRadarDisplay(
    screen,
    player.worldX,
    player.worldY,
    opponent.worldX,
    opponent.worldY,
    timeScale
  );

  SURF.blitToCanvas();
};

/**
 * !! main game loop !!
 */
const playGame = (): void => {
  let prevTicks: number = 0;
  let curTicks: number = 0;

  quit = false;
  resetCombat(player, opponent);

  curTicks = Date.now();
  prevTicks = curTicks;

  const whileLoop = () => {
    prevTicks = curTicks;
    curTicks = Date.now();
    updateTimeScale(curTicks - prevTicks);

    /* Update phaser firing timers */
    player.firing -= timeScale;
    if (player.firing < 0) player.firing = 0;
    opponent.firing -= timeScale;
    if (opponent.firing < 0) opponent.firing = 0;

    chargePhasers(player);
    updateTimers(player);
    handleInput();

    runGameScript(player, opponent, timeScale);
    checkOpponentCombat(player, opponent);

    chargePhasers(opponent);
    updatePlayer(opponent);
    updatePlayer(player);

    setPlayerStatusInfo(player.score, player.shields, player.charge);
    setOpponentStatusInfo(opponent.score, opponent.shields);

    updateCamera();
    updateParticles();
    renderFrame();

    if (!quit) window.requestAnimationFrame(whileLoop);
  };

  whileLoop();
};

export const main = async (scrn: SURF.Surface) => {
  /* Save the screen pointer for later use. */
  screen = scrn;

  await initStatusDisplay();

  await initRadarDisplay();

  // initAudio();

  // initMusic();

  // loadMusic(); // files and shit

  await loadGameData();

  initBackground();

  initPlayer(player, PlayerType.WARRIOR);
  initPlayer(opponent, PlayerType.DEVIL);

  playGame();

  // unloadGameData();

  // cleanupScripting();

  // cleanupMusic();

  // cleanupAudio()
};
