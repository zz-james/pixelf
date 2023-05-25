import "./style.css";

import "./globals";

// import { shipStrip, backStarTiles, frontStarTiles } from "./resources";
import * as SURF from "./surfaces";
// import * as KEY from "./keys";
// import { createParticleExplosion, updateParticles } from './particle';

import { Surface } from "./surfaces"; // import types
import { drawLine } from "./bresline";

// import "./background";
// import { drawBackground, drawParallax, initBackground } from "./background";

const SCREEN_WIDTH = 640;
const SCREEN_HEIGHT = 480;

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <div class="card">
      <canvas id="canvas" width="${SCREEN_WIDTH}" height="${SCREEN_HEIGHT}"></canvas>
    </div>
`;

// const timer = new Date();

// let screen: Surface

/* Fire up PIX. */
if (
  SURF.init(
    document.getElementById("canvas")! as HTMLCanvasElement,
    640,
    480
  ) !== true
) {
  throw "Unable to initialize Pixelf" + SURF.getError();
}

/* create a surface */

const surface: Surface = SURF.getMainSurface();

drawLine(
  surface,
  40,
  80,
  100,
  100,
  new Uint8ClampedArray([255, 255, 255, 255])
);

SURF.blitToCanvas();

// let player: Player_t; // the player at the computer
// let opponent: Player_t; // scripted or network opponent

// let cameraX: number; // position of the 640x480 viewport within the world
// let cameraY: number;

// // these need to be copied into player structures...  // this needs attention
// let localPlayerHit: number = 0;
// let localPlayerDead: number = 0;
// let networkOpponentRespawn: number = 0;

// let timeScale: number = 0;

// const drawPlayer = (p: Player_t) => {
//   let angle: number;

//   p.screenX = p.worldX - cameraX;
//   p.screenY = p.worldY - cameraY;

//   // if player is not on screen, don't draw anything
//   if (
//     p.screenX < -PLAYER_WIDTH / 2 ||
//     p.screenX >= SCREEN_WIDTH + PLAYER_WIDTH / 2
//   ) {
//     return;
//   }

//   if (
//     p.screenY < -PLAYER_HEIGHT / 2 ||
//     p.screenY >= SCREEN_HEIGHT + PLAYER_HEIGHT / 2
//   ) {
//     return;
//   }

//   angle = p.angle;
//   if (angle < 0) angle += 360;

//   const src: Rect = {
//     x: PLAYER_WIDTH * (angle / 4), // lines up with px value in strip fighter.png
//     y: 0,
//     w: PLAYER_WIDTH,
//     h: PLAYER_HEIGHT,
//   };

//   const dest: Coord = {
//     x: p.screenX - PLAYER_WIDTH / 2,
//     y: p.screenY - PLAYER_HEIGHT / 2,
//   };

//   SURF.blitSurface(shipStrip, src, screen, dest);
// };

// /* calculates the player's new world coordinates based on the camera
//    and player's velocity. Adds acceleration to velocity. Uses simple
//    trigonometry to update the world's coordinates */
// const updatePlayer = (p: Player_t) => {
//   const angle: number = p.angle;

//   p.velocity += p.accel * timeScale;
//   if (p.type === PlayerType.WARRIOR) {
//     if (p.velocity > PLAYER_MAX_VELOCITY) p.velocity = PLAYER_MAX_VELOCITY;
//     if (p.velocity < PLAYER_MIN_VELOCITY) p.velocity = PLAYER_MIN_VELOCITY;
//   } else if (p.type === PlayerType.DEVIL) {
//     if (p.velocity > DEVIL_MAX_VELOCITY) p.velocity = DEVIL_MAX_VELOCITY;
//     if (p.velocity < DEVIL_MIN_VELOCITY) p.velocity = DEVIL_MIN_VELOCITY;
//   }

//   p.worldX += p.velocity * Math.cos((angle * Math.PI) / 180) * timeScale;
//   p.worldY += p.velocity * Math.sin((angle * Math.PI) / 180) * timeScale;

//   /* make sure the player doesn't slide off the edge of the world */
//   if (p.worldX < 0) p.worldX = 0;
//   if (p.worldX >= WORLD_WIDTH) p.worldX = WORLD_WIDTH - 1;
//   if (p.worldY < 0) p.worldY = 0;
//   if (p.worldY >= WORLD_HEIGHT) p.worldY = WORLD_HEIGHT - 1;
// };

// const initPlayer = (p: Player_t, type: PlayerType): void => {
//   p.state = PlayerState.EVADE;
//   p.type = type;
//   p.worldX = (Math.random() * 1024) % WORLD_WIDTH;
//   p.worldY = (Math.random() * 1024) % WORLD_HEIGHT;
//   p.accel = 0;
//   p.velocity = 0;
//   p.angle = 0;
//   p.charge = 0;
//   p.firing = 0;
//   p.sheilds = 100;
//   updatePlayer(p);
// };

// const canPlayerFire = (p: Player_t): boolean => {
//   if (p.charge >= PHASER_CHARGE_FIRE && p.firing == 0) return true;
//   return false;
// };

// /* Turns on a phaser beam. Test CanPlayerFire first. */
// const firePhasers = (p: Player_t): void => {
//   p.charge -= PHASER_CHARGE_FIRE;
//   if (p.charge < 0) p.charge = 0;

//   if (p === player) {
//     // play player fire sound
//   } else {
//     // play opponent sound
//   }
// };

// /* Charge phasers by one increment. */
// const chargePhasers = (p: Player_t): void => {
//   p.charge += (timeScale / 30) * PHASER_CHARGE_RATE;
//   if (p.charge > PHASER_CHARGE_MAX) p.charge = PHASER_CHARGE_MAX;
// };

// /* Show a small explosion due to phaser damage. */
// const showPhaserHit = (p: Player_t): void => {
//   createParticleExplosion(p.worldX, p.worldY, 255, 255, 255, 10, 300);
//   createParticleExplosion(-p.worldX, p.worldY, 255, 0, 0, 5, 100);
//   createParticleExplosion(p.worldX, p.worldY, 255, 255, 0, 2, 50);
// };

// /* Show a large ship explosion. */
// const showShipExplosion = (p: Player_t): void => {
//   createParticleExplosion(p.worldX, p.worldY, 255, 255, 255, 15, 3000);
//   createParticleExplosion(p.worldX, p.worldY, 255, 0, 0, 10, 1000);
//   createParticleExplosion(p.worldX, p.worldY, 255, 255, 0, 5, 500);
// };

// const killOpponent = (): void => {
//   player.score++;
//   showShipExplosion(opponent);
//   initPlayer(opponent, PlayerType.DEVIL);
// };

// const killPlayer = (): void => {
//   showShipExplosion(player);
//   player.velocity = 0;
//   player.accel = 0;
//   player.state = PlayerState.DEAD;
//   opponent.score++;
// };

// const damageOpponent = (): void => {
//   opponent.sheilds -= PHASER_DAMAGE;
//   if (opponent.sheilds <= 0) {
//     killOpponent();
//   }
// };

// const playGame = (): void => {
//   let keystate: any; // fig this out later
//   let mouseX: number;
//   let mouseY: number;
//   let quit: boolean = false;
//   let turn: number;
//   let prevTicks: number = 0;
//   let curTicks: number = 0;
//   let awaitingRespawn: boolean = false;

//   /* framerate counter variables */
//   let startTime: number;
//   let endTime: number;

//   let framesDrawn: number = 0;

//   /* respawn times */
//   let respawnTimer: number = -1;

//   let invincibleTimer: number = -1;

//   prevTicks = timer.getTime();
//   startTime = timer.getTime();

//   /* reset the score timers */
//   player.score = 0;
//   opponent.score = 0;

//   let goOn: number = 0;

//   while (quit == false) {
//     /* determine how many milliseconds have passed since the last frame, and update our motion scaling */
//     prevTicks = curTicks;
//     curTicks = timer.getTime();

//     if (goOn != 4) {
//       timeScale = (curTicks - prevTicks) / 30;
//     }
//     goOn = 0;

//     /* grab a snapshot of keyboard */
//     keystate = KEY.getKeyState();

//     /* Update phasers. */
//     player.firing -= timeScale;
//     if (player.firing < 0) player.firing = 0;
//     opponent.firing -= timeScale;
//     if (opponent.firing < 0) opponent.firing = 0;
//     chargePhasers(player);

//     /* If the local player is destroyed, the respawn timer will
//            start counting. During this time the controls are disabled
//            and explosion sequence occurs. */
//     if (respawnTimer >= 0) {
//       respawnTimer++;

//       if (respawnTimer >= RESPAWN_TIME / timeScale) {
//         respawnTimer = -1;
//         initPlayer(player, PlayerType.WARRIOR);

//         /* Set the local_player_respawn flag so the
// 				   network thread will notify the opponent
// 				   of the respawn. */
//         // local_player_respawn = 1;

//         setStatusMessage("GOOD LUCK, WARRIOR!!");

//         /* Go to invincible state */
//         player.state = PlayerState.INVINCIBLE;
//         invincibleTimer++;
//       }
//     }

// /* Respond to input and network events, but not if we're in a respawn. */
//         if (respawnTimer == -1) {

//             /* Small period of time invincible */
//             if (invincibleTimer >= 0){
//                 invincibleTimer++;
//                 if (invincibleTimer >= ((NVINCIBLE_TIME / timeScale)) {
//                     invincibleTimer = -1;
//                     /* Back to normal */
//                     player.state = PlayerState.EVADE;
//                 }
//             }

//             if (keystate[SDLK_q] || keystate[SDLK_ESCAPE]) quit = 1;

//             turn = 0;

//             }
//             /// Add screenshot
//             if (keystate['SDLK_q'])
//             {
//                 // SDL_SaveBMP(screen, "screen.bmp");
//             }
//             /* Spacebar fires phasers. */
//             if (keystate['SDLK_j']) {

//                 if (canPlayerFire(player)) {

//                     firePhasers(player);

//                     /* If it's a hit, either notify the opponent
//                        or exact the damage. Create a satisfying particle
//                        burst. */
//                     if (!awaitingRespawn &&
//                         checkPhaserHit(player,opponent)) {

//                         showPhaserHit(opponent);
//                         damageOpponent();

//                     }
//                 }
//             }

//             /* Turn. */
//             player.angle += turn * timeScale;
//             if (player.angle < 0) player.angle += 360;
//             if (player.angle >= 360) player.angle -= 360;

//             /* If this is a network game, the remote player will
//                tell us if we've died. Otherwise we have to check
//                for failed shields. */
//             if (player.shields <= 0)
//             {
//                 console.log("Local player has been destroyed.\n");
//                 localPlayerDead = 0;

//                 /* Kaboom! */
//                 killPlayer();

//                 /* Respawn. */
//                 respawnTimer = 0;
//             }
//         }

//         /* If this is a player vs. computer game, give the computer a chance. */
//         if (opponentType == OPP_COMPUTER) {
//             runGameScript()

//             /* Check for phaser hits against the player. */
//             if (opponent.firing) {
//                 if (CheckPhaserHit(opponent,player)) {
// 					if (player.state != INVINCIBLE){
//                         showPhaserHit(&player);
//                         player.shields -= PHASER_DAMAGE_DEVIL;

//                         /* Did that destroy the player? */
//                         if (respawnTimer < 0 && player.shields <= 0) {
//                             killPlayer();
//                             respawnTimer = 0;
//                         }
//                     }
//                 }
//             }

//             chargePhasers(opponent);
//             updatePlayer(opponent);
//         }

//         /* Update the player's position. */
//     updatePlayer(player);

//     setPlayerStatusInfo(player.score, player.shields, player.charge);
//     setOpponentStatusInfo(opponent.score, opponent.sheilds);

//     /* make the camera follow the player (but impose limits) */
//     cameraX = player.worldX - SCREEN_WIDTH / 2;
//     cameraY = player.worldY - SCREEN_HEIGHT / 2;

//     if (cameraX < 0) cameraX = 0;
//     if (cameraX >= WORLD_WIDTH - SCREEN_WIDTH)
//       cameraX = WORLD_WIDTH - SCREEN_WIDTH - 1;
//     if (cameraY < 0) cameraY = 0;
//     if (cameraY >= WORLD_HEIGHT - SCREEN_HEIGHT)
//       cameraY = WORLD_HEIGHT - SCREEN_HEIGHT - 1;

//     updateParticles();

//     // redraw everything
//     drawBackground(screen, cameraX, cameraY);
//     drawParallax(screen, cameraX, cameraY);
//     drawParticles(screen, cameraX, cameraY);

//     if (opponent.firing) {
//       drawPhaserBeam(opponent, screen, cameraX, cameraY);
//     }
//     if (player.firing) {
//       drawPhaserBeam(player, screen, cameraX, cameraY);
//     }

//     if (respawnTimer < 0) {
//       drawPlayer(player);
//     }

//     if (!awaitingRespawn) {
//       drawPlayer(opponent);
//     }

//     updateStatusDisplay(screen);

//     updateRadarDisplay(
//       screen,
//       player.worldX,
//       player.worldY,
//       opponent.worldX,
//       opponent.worldY
//     );

//     // do we flip to canvas here?

//     framesDrawn++;
//   }

//   endTime = new Date().getTime();

//   if (startTime == endTime) endTime++;

//   console.log(
//     `Drew ${framesDrawn} frames in ${
//       endTime - startTime
//     } seconds, for a framerate of ${framesDrawn / (endTime - startTime)} fps`
//   );

//   // end here
// };

// const main = (): number => {

//   // enum gameType {
//   //   COMPUTER,
//   //   UNKNOWN
//   // };

//   const gameType = 'COMPUTER'

//   opponentType = OPP_COMPUTER;

//   console.log('playing against the computer');

//   initScripting()

// if (
//   SURF.init(
//     document.getElementById("canvas")! as HTMLCanvasElement,
//     SCREEN_WIDTH,
//     SCREEN_HEIGHT
//   ) !== true
// ) {
//   throw "Unable to initialize Pixelf" + SURF.getError();
// }

//   /* Save the screen pointer for later use. */
// screen = SURF.getMainSurface(); // global reference to screen for blitting

// // todo: set window title to Penguin Warriot

// initStatusDisplay();

// initRaderDisplay();

// initAudio();

// initMusic();

// loadMusic(); // files and shit

// loadGameData();

// initBackground()

// initPlayer(player, PlayerType.WARRIOR)
// initPlayer(player, PlayerType.WARRIOR);
// playGame();

// cleanupStatusDisplay();

// cleanupRadarDisplay()

// unloadGameData();

// cleanupScripting();

// cleanupMusic();

// cleanupAudio()

// return 0;

// };
