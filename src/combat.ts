import * as g from "./globals";
import { Player_t, PlayerType, PlayerState } from "./globals";
import { timeScale } from "./clock";
import { createParticleExplosion } from "./pixelf/particle";
import { setStatusMessage } from "./status";
import { checkPhaserHit } from "./weapon";
import { initPlayer } from "./player";

/* Combat and lifecycle state. -1 means the timer is not running. */
let respawnTimer: number = -1;
let invincibleTimer: number = -1;

/* Time (in 30fps ticks) built up towards the next hit explosion on the player. */
let opponentHitExplosionTimer: number = 0;

/* Resets the timers and both scores for a new game. */
export const resetCombat = (player: Player_t, opponent: Player_t): void => {
  respawnTimer = -1;
  invincibleTimer = -1;
  opponentHitExplosionTimer = 0;
  player.score = 0;
  opponent.score = 0;
};

/* True while the player is dead and waiting to respawn. */
export const isRespawning = (): boolean => respawnTimer !== -1;

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
const killOpponent = (player: Player_t, opponent: Player_t): void => {
  player.score++;
  showExplosion(opponent, 15, 300, 10, 100, 5, 50);
  initPlayer(opponent, PlayerType.DEVIL);
};

/* destroy the local player and start the respawn timer */
const killPlayer = (player: Player_t, opponent: Player_t): void => {
  showExplosion(player, 15, 300, 10, 100, 5, 50);
  player.velocity = 0;
  player.accel = 0;
  player.state = PlayerState.DEAD;
  opponent.score++;
  respawnTimer = 0;
};

/* cause damage to the opponent */
const damageOpponent = (player: Player_t, opponent: Player_t): void => {
  opponent.shields -= g.PHASER_DAMAGE;
  if (opponent.shields <= 0) {
    killOpponent(player, opponent);
  }
};

/* Resolves the player's phaser shot: explosion and damage if it hits. */
export const resolvePlayerShot = (
  player: Player_t,
  opponent: Player_t
): void => {
  if (checkPhaserHit(player, opponent)) {
    showExplosion(opponent, 10, 30, 5, 10, 2, 5);
    damageOpponent(player, opponent);
  }
};

/* Kills the player if their shields have run out. */
export const checkPlayerDeath = (
  player: Player_t,
  opponent: Player_t
): void => {
  if (respawnTimer < 0 && player.shields <= 0) {
    killPlayer(player, opponent);
  }
};

/* Updates respawn and invincibility timers. */
export const updateTimers = (player: Player_t): void => {
  if (respawnTimer >= 0) {
    respawnTimer += timeScale;

    if (respawnTimer >= g.RESPAWN_TIME) {
      respawnTimer = -1;
      initPlayer(player, PlayerType.WARRIOR);
      setStatusMessage("GOOD LUCK, WARRIOR!!");
      player.state = PlayerState.INVINCIBLE;
      invincibleTimer = 0; // not += : -1 + timeScale stays negative above 30 fps
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

/* Checks opponent phaser hits against the player. The beam is on for a fixed
   time, not a fixed number of frames, so damage and explosions are scaled by
   timeScale to keep a shot's total effect the same at any frame rate. */
export const checkOpponentCombat = (
  player: Player_t,
  opponent: Player_t
): void => {
  if (opponent.firing) {
    if (checkPhaserHit(opponent, player)) {
      if (player.state !== PlayerState.INVINCIBLE) {
        /* one explosion per tick, not per frame */
        opponentHitExplosionTimer += timeScale;
        if (opponentHitExplosionTimer >= 1) {
          opponentHitExplosionTimer -= 1;
          showExplosion(player, 10, 30, 5, 10, 2, 5);
        }
        player.shields -= g.PHASER_DAMAGE_DEVIL * timeScale;

        checkPlayerDeath(player, opponent);
      }
    }
  }
};
