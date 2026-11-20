import * as g from "./globals";
import { PlayerType, PlayerState, Player_t } from "./globals";
import { timeScale } from "./clock";

/* initializes the given player */
export const initPlayer = (p: Player_t, type: PlayerType): void => {
  p.state = PlayerState.EVADE;
  p.type = type;
  p.worldX = (Math.random() * g.WORLD_WIDTH) | 0;
  p.worldY = (Math.random() * g.WORLD_HEIGHT) | 0;
  p.accel = 0;
  p.velocity = 0;
  p.angle = 0;
  p.charge = 0;
  p.firing = 0;
  p.shields = g.PLAYER_MAX_SHIELDS;
  updatePlayer(p);
};

/* calculates the player's new world coordinates based on the camera
   and player's velocity. Adds acceleration to velocity. Uses simple
   trigonometry to update the world's coordinates */
export const updatePlayer = (p: Player_t) => {
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

  if (p.type === PlayerType.WARRIOR) {
    // play player fire sound
  } else {
    // play opponent sound
  }
};

/* Charge phasers by one increment. */
export const chargePhasers = (p: Player_t): void => {
  p.charge += (timeScale / 30) * g.PHASER_CHARGE_RATE;
  if (p.charge > g.PHASER_CHARGE_MAX) p.charge = g.PHASER_CHARGE_MAX;
};
