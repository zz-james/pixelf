export const SCREEN_WIDTH = 640;
export const SCREEN_HEIGHT = 480;

/* Dimensions of the player's ship. The graphics data must correspond to this. */
export const PLAYER_WIDTH = 96;
export const PLAYER_HEIGHT = 96;

/* Limits on the player. */
export const PLAYER_MAX_VELOCITY = 15.0;
export const PLAYER_MIN_VELOCITY = -10.0;

/* Limits on the devil. */
export const DEVIL_MAX_VELOCITY = 13.0;
export const DEVIL_MIN_VELOCITY = -10.0;

/* Charge level required to fire. */
export const PHASER_CHARGE_FIRE = 10;

/* Maximum charge the phasers can hold. */
export const PHASER_CHARGE_MAX = 30;

/* Roughly the number of charge units per second. */
export const PHASER_CHARGE_RATE = 30;

/* Duration of each phaser shot, in ticks. (30 ticks/second) */
export const PHASER_FIRE_TIME = 5;

/* Difficulty balance. Both ships start with PLAYER_MAX_SHIELDS shields.
   The warrior's shot does PHASER_DAMAGE once, when fired, so it takes 7 hits
   to destroy the devil. The devil's beam stays on for PHASER_FIRE_TIME ticks
   and does PHASER_DAMAGE_DEVIL per tick (scaled by the frame time, so it is
   the same at any frame rate) while it overlaps the warrior. A full devil shot
   therefore costs the warrior about PHASER_DAMAGE_DEVIL * PHASER_FIRE_TIME
   shield points, 5 with the current values. */
export const PHASER_DAMAGE = 16;
export const PHASER_DAMAGE_DEVIL = 1;

/* Shields a ship starts with, and the value the shield bars are scaled to. */
export const PLAYER_MAX_SHIELDS = 100;

/* Total size (in pixels) of the complete playing field */
export const WORLD_WIDTH = 2000;
export const WORLD_HEIGHT = 2000;

export const SHIP_LIMIT_WIDTH = WORLD_WIDTH - 40;

/* Number of particles allowed in the particle system. */
export const MAX_PARTICLES = 30000;

/* Time to delay before respawning, in ticks. */
export const RESPAWN_TIME = 60;

/* Invincibility after respawning, in ticks (a tick is 30ms, so 300 ticks = 9 seconds). */
export const INVINCIBLE_TIME = 300;

/* Upper bound on the per-frame time scale (1 = one 30fps tick, so 3 is ~90ms).
   Stops a long frame (background tab, breakpoint) from teleporting ships. */
export const MAX_TIME_SCALE = 3;

/* How fast the scripted opponent turns, in degrees per 30fps tick. */
export const AI_TURN_RATE = 3;

/* Length of the radar's opponent blink cycle, in 30fps ticks (half on, half off). */
export const RADAR_BLINK_PERIOD = 20;

export const PLAYER_FORWARD_THRUST = 3;
export const PLAYER_REVERSE_THRUST = -1;

export const PHASER_RANGE = WORLD_WIDTH / 10;

/* A phaser beam hits a ship when it passes within this distance of the ship's
   centre: half the sprite width, so the beam has to touch the ship. */
export const PHASER_HIT_RADIUS = PLAYER_WIDTH / 2;

/* Distances (in world pixels) the scripted opponent's behaviour is based on. */
/* Closer than this to the warrior, the devil breaks off and evades. */
export const AI_TOO_CLOSE_DISTANCE = 25;
/* Farther than this from the warrior, the devil flies at full thrust. */
export const AI_FULL_THRUST_DISTANCE = 100;
/* Between this and AI_FULL_THRUST_DISTANCE it uses a third of the thrust; closer, none. */
export const AI_REDUCED_THRUST_DISTANCE = 50;
/* The devil fires whenever the warrior is inside its beam's range. */
export const AI_FIRE_DISTANCE = PHASER_RANGE;
/* While evading, the devil has reached its target within this distance on each axis. */
export const AI_ARRIVAL_DISTANCE = 25;

/* Status display (HUD) layout. LEDs are square images, so every size below is
   in LEDs and is multiplied by HUD_LED_SIZE to get pixels. */
export const HUD_LED_SIZE = 8;
/* Width in pixels of the score/shield panels on each side of the screen. */
export const HUD_PANEL_WIDTH = 12 * HUD_LED_SIZE;
/* Vertical position of the shield bar, just below the 5 LED high score. */
export const HUD_SHIELD_BAR_Y = 6 * HUD_LED_SIZE;
export const HUD_SCORE_COLS = 12;
export const HUD_SCORE_ROWS = 5;
export const HUD_SHIELD_LEDS = 12;
export const HUD_CHARGE_LEDS = 80;
/* The scrolling message: visible width, and the width of its off-screen buffer. */
export const HUD_MESSAGE_COLS = 56;
export const HUD_MESSAGE_BUFFER_COLS = 66;
export const HUD_MESSAGE_ROWS = 5;

export enum PlayerType {
  WARRIOR,
  DEVIL,
}

export enum PlayerState {
  EVADE,
  ATTACK,
  UNDER_ATTACK,
  INVINCIBLE,
  DEAD,
  DEADING,
}

export type Player_t = {
  type: PlayerType;
  state: PlayerState;
  angle: number;
  worldX: number;
  worldY: number;
  screenX: number;
  screenY: number;
  velocity: number;
  accel: number;
  shields: number;
  firing: number;
  charge: number;
  score: number;
  hit: number;
};
