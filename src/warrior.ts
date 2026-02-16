import * as SURF from "./pixelf/surfaces";
import * as KEY from "./pixelf/keys";
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

import { Rect, Surface } from "./pixelf/surfaces"; //types

import * as g from "./globals";
import {
  PlayerType,
  PlayerState,
  Player_t,
  PHASER_DAMAGE_DEVIL,
} from "./globals";

import { getJoystickAngle, getJoystickDistance } from "./touch-controls";

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
let timeScale: number = 0;

/* Game state - used across update functions */
let quit: boolean = false;
let awaitingRespawn: boolean = false;
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

/* initializes the given player */
const initPlayer = (p: Player_t, type: PlayerType): void => {
  p.state = PlayerState.EVADE;
  p.type = type;
  p.worldX = (Math.random() * g.WORLD_WIDTH) | 0;
  p.worldY = (Math.random() * g.WORLD_HEIGHT) | 0;
  p.accel = 0;
  p.velocity = 0;
  p.angle = 0;
  p.charge = 0;
  p.firing = 0;
  p.shields = 100;
  updatePlayer(p);
};

/* calculates the player's new world coordinates based on the camera
   and player's velocity. Adds acceleration to velocity. Uses simple
   trigonometry to update the world's coordinates */
const updatePlayer = (p: Player_t) => {
  const angle: number = p.angle;

  p.velocity += p.accel * timeScale;

  if (p.type === PlayerType.WARRIOR) {
    if (p.velocity > g.PLAYER_MAX_VELOCITY) p.velocity = g.PLAYER_MAX_VELOCITY;
    if (p.velocity < g.PLAYER_MIN_VELOCITY) p.velocity = g.PLAYER_MIN_VELOCITY;
  } else if (p.type === PlayerType.DEVIL) {
    if (p.velocity > g.DEVIL_MAX_VELOCITY) p.velocity = g.DEVIL_MAX_VELOCITY;
    if (p.velocity < g.DEVIL_MIN_VELOCITY) p.velocity = g.DEVIL_MIN_VELOCITY;
  }

  p.worldX += (p.velocity * Math.cos((angle * Math.PI) / 180) * timeScale) | 0;
  p.worldY += (p.velocity * -Math.sin((angle * Math.PI) / 180) * timeScale) | 0;

  /* make sure the player doesn't slide off the edge of the world */
  if (p.worldX < 40) p.worldX = 40;
  if (p.worldX >= g.SHIP_LIMIT_WIDTH) p.worldX = g.SHIP_LIMIT_WIDTH;
  if (p.worldY < 40) p.worldY = 40;
  if (p.worldY >= g.WORLD_HEIGHT) p.worldY = g.WORLD_HEIGHT - 1;
};

// ** phaser stuff ** //
export const canPlayerFire = (p: Player_t): boolean => {
  if (p.charge >= g.PHASER_CHARGE_FIRE && p.firing == 0) return true;
  return false;
};

/* Turns on a phaser beam. Test CanPlayerFire first. */
export const firePhasers = (p: Player_t): void => {
  p.charge -= g.PHASER_CHARGE_FIRE;
  if (p.charge < 0) p.charge = 0;

  p.firing = g.PHASER_FIRE_TIME;

  if (p === player) {
    // play player fire sound
  } else {
    // play opponent sound
  }
};

/* Charge phasers by one increment. */
const chargePhasers = (p: Player_t): void => {
  p.charge += (timeScale / 30) * g.PHASER_CHARGE_RATE;
  if (p.charge > g.PHASER_CHARGE_MAX) p.charge = g.PHASER_CHARGE_MAX;
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

/* Handles keyboard input for player movement and firing.
   Disabled during respawn. */
const handleInput = (keystate: Record<string, boolean>): void => {
  if (respawnTimer !== -1) return;

  if (keystate["q"]) {
    quit = true;
  }

  const joystickAngle = getJoystickAngle();

  const joystickDistance = getJoystickDistance() | 0;

  // if (joystickDistance) {
  //   keystate["ArrowUp"] = true;
  // if (joystickAngle !== undefined) {
  let angleDiff = 0; //= (joystickAngle - player.angle) | 0;
  //console.log({ joystickAngle, player: player.angle, angleDiff });
  // let turn = undefined;

  if (joystickAngle) {
    if (joystickAngle > player.angle) {
      if (joystickAngle - player.angle > 180) {
        // turn = "clockwise";
        player.angle--;
        angleDiff = 360 - joystickAngle + player.angle;
      } else {
        // turn = "anti-clockwise";
        player.angle++;
        angleDiff = joystickAngle - player.angle; // use size of anglediff to control speed of turn
      }
    } else {
      console.log("brah");
      if (player.angle - joystickAngle > 180) {
        player.angle++;
        angleDiff = 360 - player.angle + joystickAngle;
      } else {
        console.log("clockwise");
        player.angle--;
        angleDiff = player.angle - joystickAngle;
      }
    }
  }

  console.log(angleDiff);

  // if (angleDiff !== 0) {
  //   if (angleDiff < 180) {
  //     player.angle++;
  //   } else {
  //     player.angle--;
  //   }
  // }
  // calculate the difference between the joystick angle and the player angle
  // }
  // } else {
  //   keystate["ArrowUp"] = false;
  // }

  let turn = 0;
  if (keystate["ArrowLeft"]) turn += 10;
  if (keystate["ArrowRight"]) turn -= 10;

  player.accel = 0;
  if (keystate["ArrowUp"]) player.accel = g.PLAYER_FORWARD_THRUST;
  if (keystate["ArrowDown"]) player.accel = g.PLAYER_REVERSE_THRUST;

  /* Spacebar fires phasers. */
  if (keystate[" "]) {
    if (canPlayerFire(player)) {
      firePhasers(player);

      if (!awaitingRespawn && checkPhaserHit(player, opponent)) {
        showExplosion(opponent, 10, 30, 5, 10, 2, 5);
        damageOpponent();
        if (opponent.shields <= 0) {
          awaitingRespawn = true;
        }
      }
    }
  }

  /* Turn. */
  player.angle += (turn * timeScale) | 0;
  if (player.angle < 0) player.angle += 360;
  if (player.angle >= 360) player.angle -= 360;
  /* Check for player death. */
  if (player.shields <= 0) {
    console.log("Local player has been destroyed.\n");
    killPlayer();
    respawnTimer = 0;
  }
};

/* Checks opponent phaser hits against the player. */
const checkOpponentCombat = (): void => {
  if (opponent.firing) {
    if (checkPhaserHit(opponent, player)) {
      if (player.state !== PlayerState.INVINCIBLE) {
        showExplosion(player, 10, 30, 5, 10, 2, 5);
        // player.shields -= PHASER_DAMAGE_DEVIL;

        if (respawnTimer < 0 && player.shields <= 0) {
          console.log("kill player");
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
  if (!awaitingRespawn) drawPlayer(opponent);

  updateStatusDisplay(screen);
  updateRadarDisplay(
    screen,
    player.worldX,
    player.worldY,
    opponent.worldX,
    opponent.worldY
  );

  SURF.blitToCanvas();
};

/**
 * !! main game loop !!
 */
const playGame = (): void => {
  let prevTicks: number = 0;
  let curTicks: number = 0;
  let framesDrawn: number = 0;
  const startTime = Date.now();

  quit = false;
  awaitingRespawn = false;
  respawnTimer = -1;
  invincibleTimer = -1;
  player.score = 0;
  opponent.score = 0;

  curTicks = Date.now();
  prevTicks = curTicks;

  const whileLoop = () => {
    prevTicks = curTicks;
    curTicks = Date.now();
    timeScale = (curTicks - prevTicks) / 30;

    const keystate = KEY.getKeyState();

    /* Update phaser firing timers */
    player.firing -= timeScale;
    if (player.firing < 0) player.firing = 0;
    opponent.firing -= timeScale;
    if (opponent.firing < 0) opponent.firing = 0;

    chargePhasers(player);
    updateTimers();
    handleInput(keystate);

    runGameScript(player, opponent);
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
    framesDrawn++;
  };

  whileLoop();

  let endTime = new Date().getTime();
  if (startTime == endTime) endTime++;
  console.log(
    `Drew ${framesDrawn} frames in ${
      endTime - startTime
    } seconds, for a framerate of ${framesDrawn / (endTime - startTime)} fps`
  );
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

  // cleanupStatusDisplay();

  // cleanupRadarDisplay()

  // unloadGameData();

  // cleanupScripting();

  // cleanupMusic();

  // cleanupAudio()
};
