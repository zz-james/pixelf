const SCREEN_WIDTH = 640;
const SCREEN_HEIGHT = 480;

/* Dimensions of the player's ship. The graphics data must correspond to this. */
const PLAYER_WIDTH = 96;
const PLAYER_HEIGHT = 96;

/* Limits on the player. */
const PLAYER_MAX_VELOCITY = 15.0;
const PLAYER_MIN_VELOCITY = -10.0;

/* Limits on the devil. */
const DEVIL_MAX_VELOCITY = 13.0;
const DEVIL_MIN_VELOCITY = -10.0;

/* Charge level required to fire. */
const PHASER_CHARGE_FIRE = 10;

/* Maximum charge the phasers can hold. */
const PHASER_CHARGE_MAX = 30;

/* Roughly the number of charge units per second. */
const PHASER_CHARGE_RATE = 30;

/* Duration of each phaser shot, in ticks. (30 ticks/second) */
const PHASER_FIRE_TIME = 5;

/* Amount of damage a single shot does.  warrior*/
const PHASER_DAMAGE = 16;

/* Amount of damage a single shot does. devil*/
const PHASER_DAMAGE_DEVIL = 1;

/* Total size (in pixels) of the complete playing field */
const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 2000;

/* Number of particles allowed in the particle system. */
const MAX_PARTICLES = 30000;

/* Time to delay before respawning, in ticks. */
const RESPAWN_TIME = 60;

const INVINCIBLE_TIME = 300;

const PLAYER_FORWARD_THRUST = 3;
const PLAYER_REVERSE_THRUST = -1;

const PHASER_RANGE = WORLD_WIDTH * 2;

enum PlayerType {
  WARRIOR,
  DEVIL,
}

enum PlayerState {
  EVADE,
  ATTACK,
  UNDER_ATTACK,
  INVINCIBLE,
  DEAD,
  DEADING,
}

type Player_t = {
  type: PlayerType;
  state: PlayerState;
  angle: number;
  worldX: number;
  worldY: number;
  screenX: number;
  screenY: number;
  velocity: number;
  accel: number;
  sheilds: number;
  firing: number;
  charge: number;
  score: number;
  hit: number;
};
