This is a browser-based retro space combat game — a TypeScript/Vite port of an old C/SDL game called [Penguin Warrior](https://github.com/louxiu/Penguin-warrior)

The player controls a warrior ship fighting an AI-controlled opponent (the "devil") in a 2000x2000 pixel world viewed through a 640x480 camera. It features parallax starfield backgrounds, phaser beam weapons with line-based collision detection, a particle explosion system, a radar minimap, and an LED-style HUD showing scores, shields, and charge levels.

The pixelf library is a custom low-level wrapper around the canvas element that works directly with canvas pixel buffers — essentially I hope it will reimplementing SDL-style surface blitting in the browser. 

The scripted opponent has attack/evade states, pursuing and firing when in range or fleeing to random coordinates when threatened.  

