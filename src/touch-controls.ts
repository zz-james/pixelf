import { setKeyPressed, clearKeyPressed } from "./pixelf/keys";

const JOYSTICK_RADIUS = 60;
const THUMB_RADIUS = 25;
// const DEAD_ZONE = 15;

let joystickTouchId: number | null = null;
let fireTouchId: number | null = null;

let joystickBase: HTMLElement;
let joystickThumb: HTMLElement;
let fireButton: HTMLElement;

let baseCenterX = 0;
let baseCenterY = 0;

let angle: number | undefined = undefined;
let speed: number | undefined = undefined;

const updateKeysFromJoystick = (dx: number, dy: number): void => {
  angle = (Math.atan2(-dy, dx) * (180 / Math.PI)) | 0;
  if (angle < 0) angle += 360;
  speed = Math.sqrt(dx * dx + dy * dy);
};

const clearJoystickKeys = (): void => {
  angle = 0;
  speed = 0;
  clearKeyPressed("ArrowLeft");
  clearKeyPressed("ArrowRight");
  clearKeyPressed("ArrowUp");
  clearKeyPressed("ArrowDown");
};

const clampAndPosition = (dx: number, dy: number): void => {
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxDist = JOYSTICK_RADIUS - THUMB_RADIUS;

  if (dist > maxDist) {
    dx = (dx / dist) * maxDist;
    dy = (dy / dist) * maxDist;
  }

  joystickThumb.style.left = `${JOYSTICK_RADIUS + dx - THUMB_RADIUS}px`;
  joystickThumb.style.top = `${JOYSTICK_RADIUS + dy - THUMB_RADIUS}px`;
};

export const getJoystickAngle = (): number | undefined => {
  return angle;
};

export const getJoystickDistance = (): number | undefined => {
  return speed;
};

const resetThumb = (): void => {
  joystickThumb.style.left = `${JOYSTICK_RADIUS - THUMB_RADIUS}px`;
  joystickThumb.style.top = `${JOYSTICK_RADIUS - THUMB_RADIUS}px`;
};

const onJoystickTouchStart = (e: TouchEvent): void => {
  e.preventDefault();
  if (joystickTouchId !== null) return;

  const touch = e.changedTouches[0];
  joystickTouchId = touch.identifier;

  const rect = joystickBase.getBoundingClientRect();
  baseCenterX = rect.left + JOYSTICK_RADIUS;
  baseCenterY = rect.top + JOYSTICK_RADIUS;

  const dx = touch.clientX - baseCenterX;
  const dy = touch.clientY - baseCenterY;

  clampAndPosition(dx, dy);
  updateKeysFromJoystick(dx, dy);
};

const onJoystickTouchMove = (e: TouchEvent): void => {
  e.preventDefault();
  if (joystickTouchId === null) return;

  for (let i = 0; i < e.changedTouches.length; i++) {
    const touch = e.changedTouches[i];
    if (touch.identifier !== joystickTouchId) continue;

    const dx = touch.clientX - baseCenterX;
    const dy = touch.clientY - baseCenterY;

    clampAndPosition(dx, dy);
    updateKeysFromJoystick(dx, dy);
    return;
  }
};

const onJoystickTouchEnd = (e: TouchEvent): void => {
  e.preventDefault();
  for (let i = 0; i < e.changedTouches.length; i++) {
    if (e.changedTouches[i].identifier === joystickTouchId) {
      joystickTouchId = null;
      resetThumb();
      clearJoystickKeys();
      return;
    }
  }
};

const onFireTouchStart = (e: TouchEvent): void => {
  e.preventDefault();
  if (fireTouchId !== null) return;

  fireTouchId = e.changedTouches[0].identifier;
  setKeyPressed(" ");
  fireButton.classList.add("pressed");
};

const onFireTouchEnd = (e: TouchEvent): void => {
  e.preventDefault();
  for (let i = 0; i < e.changedTouches.length; i++) {
    if (e.changedTouches[i].identifier === fireTouchId) {
      fireTouchId = null;
      clearKeyPressed(" ");
      fireButton.classList.remove("pressed");
      return;
    }
  }
};

const createDOM = (container: HTMLElement): void => {
  const touchControls = document.createElement("div");
  touchControls.id = "touch-controls";

  // Joystick
  const joystickZone = document.createElement("div");
  joystickZone.id = "joystick-zone";

  joystickBase = document.createElement("div");
  joystickBase.id = "joystick-base";

  joystickThumb = document.createElement("div");
  joystickThumb.id = "joystick-thumb";

  resetThumb();
  joystickBase.appendChild(joystickThumb);
  joystickZone.appendChild(joystickBase);

  // Fire button
  const fireZone = document.createElement("div");
  fireZone.id = "fire-zone";

  fireButton = document.createElement("div");
  fireButton.id = "fire-button";
  fireButton.textContent = "FIRE";

  fireZone.appendChild(fireButton);

  touchControls.appendChild(joystickZone);
  touchControls.appendChild(fireZone);
  container.appendChild(touchControls);

  // Attach event listeners
  joystickZone.addEventListener("touchstart", onJoystickTouchStart, {
    passive: false,
  });
  joystickZone.addEventListener("touchmove", onJoystickTouchMove, {
    passive: false,
  });
  joystickZone.addEventListener("touchend", onJoystickTouchEnd, {
    passive: false,
  });
  joystickZone.addEventListener("touchcancel", onJoystickTouchEnd, {
    passive: false,
  });

  fireZone.addEventListener("touchstart", onFireTouchStart, { passive: false });
  fireZone.addEventListener("touchend", onFireTouchEnd, { passive: false });
  fireZone.addEventListener("touchcancel", onFireTouchEnd, { passive: false });
};

export const initTouchControls = (container: HTMLElement): void => {
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;
  if (!isTouchDevice) return;

  createDOM(container);
};
