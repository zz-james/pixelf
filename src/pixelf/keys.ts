"use strict";

const pressed: Record<string, boolean> = {};

/* Single characters are stored lowercase so "q" and "Q" (Caps Lock/Shift) are
   the same key. Named keys such as "ArrowLeft" are left alone. A key pressed
   with Shift held and released after Shift is let go would otherwise report a
   different case on keyup and stay stuck. */
const normaliseKey = (key: string): string =>
  key.length === 1 ? key.toLowerCase() : key;

const clearAllKeys = (): void => {
  for (const key in pressed) {
    delete pressed[key];
  }
};

document.addEventListener("keydown", (e: KeyboardEvent) => {
  pressed[normaliseKey(e.key)] = true;
});

document.addEventListener("keyup", (e: KeyboardEvent) => {
  delete pressed[normaliseKey(e.key)];
});

/* The browser doesn't send keyup if focus leaves the page while a key is held
   (Alt-Tab, switching tabs), so drop everything when we lose focus. */
window.addEventListener("blur", clearAllKeys);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) clearAllKeys();
});

export const getKeyState = (): Record<string, boolean> => {
  return pressed;
};

export const setKeyPressed = (key: string): void => {
  pressed[normaliseKey(key)] = true;
};

export const clearKeyPressed = (key: string): void => {
  delete pressed[normaliseKey(key)];
};
