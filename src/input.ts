import * as g from "./globals";
import { Player_t } from "./globals";
import { timeScale } from "./clock";
import { getKeyState } from "./pixelf/keys";
import { getJoystickAngle, getJoystickDistance } from "./touch-controls";

/**
 * What the player is asking for this frame, from the keyboard and the touch
 * joystick together. readInput fills one shared object every frame, so the
 * game loop doesn't allocate.
 */
export type InputState = {
  quit: boolean;
  fire: boolean;
  forward: boolean; // arrow up
  reverse: boolean; // arrow down
  turn: number; // keyboard turn in degrees per tick: positive is anticlockwise
  joystickAngle: number | undefined; // 0..359, 0 = right, anticlockwise
  joystickDistance: number | undefined; // undefined until the joystick is first touched
};

const input: InputState = {
  quit: false,
  fire: false,
  forward: false,
  reverse: false,
  turn: 0,
  joystickAngle: undefined,
  joystickDistance: undefined,
};

/* Reads the keyboard and joystick. The returned object is reused each call. */
export const readInput = (): InputState => {
  const keystate = getKeyState();

  input.quit = !!keystate["q"];
  input.fire = !!keystate[" "]; // spacebar fires phasers
  input.forward = !!keystate["ArrowUp"];
  input.reverse = !!keystate["ArrowDown"];

  input.turn = 0;
  if (keystate["ArrowLeft"]) input.turn += 10;
  if (keystate["ArrowRight"]) input.turn -= 10;

  input.joystickAngle = getJoystickAngle();
  input.joystickDistance = getJoystickDistance();

  return input;
};

/* Points the ship towards the joystick and sets its thrust. */
export const applySteeringAndThrust = (p: Player_t, i: InputState): void => {
  if (i.joystickDistance) {
    if (i.joystickAngle !== undefined) {
      // turn the short way round, a tenth of the remaining angle per frame
      const diff = ((i.joystickAngle - p.angle + 540) % 360) - 180;
      p.angle = (((p.angle + diff / 10) % 360) + 360) % 360;
    }
  }

  p.accel = 0;

  if (i.joystickDistance) {
    p.accel = g.PLAYER_FORWARD_THRUST;
  } else if (i.joystickDistance !== undefined && !i.reverse && !i.forward) {
    // joystick released and no key held: stop dead
    p.velocity = 0;
  }

  if (i.forward) p.accel = g.PLAYER_FORWARD_THRUST;
  if (i.reverse) p.accel = g.PLAYER_REVERSE_THRUST;
};

/* Applies the keyboard turn. The game loop does this after firing, so a shot
   leaves along the heading from before this frame's keyboard turn. */
export const applyTurn = (p: Player_t, i: InputState): void => {
  p.angle += (i.turn * timeScale) | 0;
  if (p.angle < 0) p.angle += 360;
  if (p.angle >= 360) p.angle -= 360;
};
