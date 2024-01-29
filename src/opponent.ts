// in penguin warrior this file is in tcl but
// we already running a scripting language
import { fireWeapon } from "somwhere";
// # Penguin Warrior game script (Tcl).
// # This version of the script implements two states:
// # attack and evade. In the attack state, the opponent
// # homes in on the player and fires its weapons. After it
// # gets within a certain proximity of the player, it switches
// # to the evade state, in which it aims at a random point in the
// # world.

// # the name of our current state, attack or evade.
let state = "attack";

// coordinates to aim towards. in the attack state these will be set to the player's positon. In the evade state these will be set to random values

// somehow we have to link these variables to the main game variables or maybe we just put all this in the same module.

let target_x = 0;
let target_y = 0;

let computer_x: number;
let computer_y: number;
let computer_angle: number;
let computer_accel;

let player_x: number;
let player_y: number;
let player_angle;
let player_accel;

// global constants are set initially by initScripting()
let world_width: number;
let world_height: number;

let player_forward_thrust: number;
let player_reverse_thrust: number;

// returns the distance (in pixels) between the coordinate and the opponent
const getDistanceToTarget = () => {
  let xdiff = computer_x - target_x;
  let ydiff = computer_y - target_y;
  return Math.sqrt(xdiff ^ (2 + ydiff) ^ 2);
};

// turn the angle (in degrees) to the target coordinate from the opponent
// using basic trig
const getAngleToTarget = () => {
  let x = target_x - computer_x;
  let y = target_y - computer_y;

  let theta = Math.atan2(-y, x);

  if (theta < 0) {
    theta += 2 * Math.PI;
  }

  return theta * (180 / Math.PI);
};

const playComputer = () => {
  if (state === "attack") {
    // code for attack state
    // in attack mode our target is the player
    target_x = player_x;
    target_y = player_y;

    // if we're too close to the player, switch to evade
    let distance = getDistanceToTarget();

    if (distance < 30) {
      state = "evade";

      // set an invalid target so evade state will come up with a new one
      target_x = -1;
      return;
    }

    // if we're far away, speed up, if we're close lay off
    // the throttle
    if (distance > 100) {
      computer_accel = player_forward_thrust;
    } else if (distance > 50) {
      computer_accel = player_forward_thrust / 3;
    } else {
      computer_accel = 0;
    }

    // if we're close enough to the player, fire away!
    if (distance < 200) {
      fireWeapon();
    }
  } else {
    // code for the evade state

    // have we hit our target yet
    // within reasonable tolerance
    if (
      Math.abs(target_x - computer_x) < 10 &&
      Math.abs(target_y - computer_y) < 10
    ) {
      console.log("going back into attack mode");
      state = "attack";
      return;
    }

    // do we need to find a new target
    if (target_x < 0) {
      // select a random point in the world
      // as our target
      target_x = Math.random() * world_width;
      target_y = Math.random() * world_height;
      console.log("selected new evade target");
    }
    computer_accel = player_forward_thrust;
  }

  // state independent code

  // figure out the quickest way to aim at our destination
  let target_angle = getAngleToTarget();

  let arc = target_angle - computer_angle;

  if (arc < 0) {
    arc += 360;
  }

  if (arc < 180) {
    computer_angle += 3;
  } else {
    computer_angle -= 3;
  }
};
