import * as SURF from "./pixelf/surfaces";
import {
  createParticleExplosion,
  updateParticles,
  drawParticles,
} from "./pixelf/particle";

import { shipStrip, loadGameData } from "./resources";
import { initBackground, drawBackground, drawParallax } from "./background";
import {
  setStatusMessage,
  initStatusDisplay,
  setPlayerStatusInfo,
  setOpponentStatusInfo,
  updateStatusDisplay,
} from "./status";
import { checkPhaserHit, drawPhaserBeam } from "./weapon";
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
import {
  PlayerType,
  PlayerState,
  Player_t,
  PHASER_DAMAGE_DEVIL,
} from "./globals";

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
let respawnTimer: number = -1;
let invincibleTimer: number = -1;

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

/* Show a particle explosion at the player's position.
   Small values for a phaser hit, large values for a ship destruction. */
const showExplosion = (
  p: Player_t,
  whiteCount: number,
  whiteSpread: number,
  redCount: number,
  redSpread: number,
  yellowCount: number,
  yellowSpread: number
): void => {
  createParticleExplosion(
    p.worldX,
    p.worldY,
    255,
    255,
    255,
    whiteCount,
    whiteSpread
  );
  createParticleExplosion(p.worldX, p.worldY, 255, 0, 0, redCount, redSpread);
  createParticleExplosion(
    p.worldX,
    p.worldY,
    255,
    255,
    0,
    yellowCount,
    yellowSpread
  );
};

/* destroy the opponent */
const killOpponent = (): void => {
  player.score++;
  showExplosion(opponent, 15, 300, 10, 100, 5, 50);
  initPlayer(opponent, PlayerType.DEVIL);
};

/* destory the local player */
const killPlayer = (): void => {
  showExplosion(player, 15, 300, 10, 100, 5, 50);
  player.velocity = 0;
  player.accel = 0;
  player.state = PlayerState.DEAD;
  opponent.score++;
};

/* cause damage to the opponent */
const damageOpponent = (): void => {
  opponent.shields -= g.PHASER_DAMAGE;
  if (opponent.shields <= 0) {
    killOpponent();
  }
};

/* Updates respawn and invincibility timers. */
const updateTimers = (): void => {
  if (respawnTimer >= 0) {
    respawnTimer += timeScale;

    if (respawnTimer >= g.RESPAWN_TIME) {
      respawnTimer = -1;
      initPlayer(player, PlayerType.WARRIOR);
      setStatusMessage("GOOD LUCK, WARRIOR!!");
      player.state = PlayerState.INVINCIBLE;
      invincibleTimer += timeScale;
    }
  }

  if (respawnTimer == -1 && invincibleTimer >= 0) {
    invincibleTimer += timeScale;
    if (invincibleTimer >= g.INVINCIBLE_TIME) {
      invincibleTimer = -1;
      player.state = PlayerState.EVADE;
    }
  }
};

/* Reads the player's input and applies it: steering and thrust, firing and
   the resulting hit, the turn, then the death check. Disabled during respawn. */
const handleInput = (): void => {
  if (respawnTimer !== -1) return;

  const input = readInput();

  if (input.quit) {
    quit = true;
  }

  applySteeringAndThrust(player, input);

  if (input.fire && canPlayerFire(player)) {
    firePhasers(player);

    if (checkPhaserHit(player, opponent)) {
      showExplosion(opponent, 10, 30, 5, 10, 2, 5);
      damageOpponent();
    }
  }

  applyTurn(player, input);

  /* Check for player death. */
  if (player.shields <= 0) {
    killPlayer();
    respawnTimer = 0;
  }
};

/* Time (in 30fps ticks) built up towards the next hit explosion on the player. */
let opponentHitExplosionTimer: number = 0;

/* Checks opponent phaser hits against the player. The beam is on for a fixed
   time, not a fixed number of frames, so damage and explosions are scaled by
   timeScale to keep a shot's total effect the same at any frame rate. */
const checkOpponentCombat = (): void => {
  if (opponent.firing) {
    if (checkPhaserHit(opponent, player)) {
      if (player.state !== PlayerState.INVINCIBLE) {
        /* one explosion per tick, not per frame */
        opponentHitExplosionTimer += timeScale;
        if (opponentHitExplosionTimer >= 1) {
          opponentHitExplosionTimer -= 1;
          showExplosion(player, 10, 30, 5, 10, 2, 5);
        }
        player.shields -= PHASER_DAMAGE_DEVIL * timeScale;

        if (respawnTimer < 0 && player.shields <= 0) {
          killPlayer();
          respawnTimer = 0;
        }
      }
    }
  }
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

  if (respawnTimer < 0) drawPlayer(player);
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
  respawnTimer = -1;
  invincibleTimer = -1;
  player.score = 0;
  opponent.score = 0;

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
    updateTimers();
    handleInput();

    runGameScript(player, opponent, timeScale);
    checkOpponentCombat();

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
