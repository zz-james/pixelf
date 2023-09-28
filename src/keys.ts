/**
 * Project: canvas_sprite_blitter
 * User: james
 * Date: 23/08/13
 * Time: 16:56
 */
"use strict";

var pressed: Record<string, boolean> = {};

document.onkeydown = function (e) {
  e = e || window.event;
  pressed[e.key || e.keyCode] = true;
};

document.onkeyup = function (e) {
  e = e || window.event;
  delete pressed[e.key || e.keyCode];
};

export const getKeyState = (): Record<string, boolean> => {
  return pressed;
};
/* usage eg if(pressed[37]) {} */
