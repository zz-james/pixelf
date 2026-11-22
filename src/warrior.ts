import * as SURF from "./pixelf/surfaces";
import { updateParticles } from "./pixelf/particle";

import { loadGameData } from "./resources";
import { initBackground } from "./background";
import {
  initStatusDisplay,
  setPlayerStatusInfo,
  setOpponentStatusInfo,
} from "./status";
import { initRadarDisplay } from "./radar";

import { runGameScript } from "./scripting";
import { timeScale, updateTimeScale } from "./clock";
import {
  initPlayer,
  updatePlayer,
  chargePhasers,
  canPlayerFire,
  firePhasers,
} from "./player";

import { Surface } from "./pixelf/surfaces"; //types

import { PlayerType, PlayerState, Player_t } from "./globals";
import {
  resetCombat,
  isRespawning,
  resolvePlayerShot,
  checkPlayerDeath,
  checkOpponentCombat,
  updateTimers,
} from "./combat";

import { updateCamera } from "./camera";
import { renderFrame } from "./render";
import { readInput, applySteeringAndThrust, applyTurn } from "./input";
import { perfFrameStart, perfLap, perfFrameEnd, PHASE_UPDATE } from "./perf";

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

let screen: Surface; /* global for convenience */

/* Game state - used across update functions */
let quit: boolean = false;

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
    perfFrameStart();
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

    updateCamera(player);
    updateParticles();
    perfLap(PHASE_UPDATE);
    renderFrame(screen, player, opponent);
    perfFrameEnd();

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
