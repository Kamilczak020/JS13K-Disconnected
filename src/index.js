/**
 * Game developed by: Kamil Solecki (Sir Greenchill) & Matei Copot (towc)
 * Version: 0.0.2
 * Issued under: MIT LICENSE
 * Created for: JS13K games coding competition, http://js13kgames.com/
 *
 * # DEV_ONLY
 * # GLOBALS
 * # EVENT_HOOKS
 * # GAME_INIT
 *
 */

// # DEV_ONLY
// hot-reload
require('../style.css');
// will be referenced directly by id
const canvas = document.getElementById('gamearea');

// # GLOBALS
const context = canvas.getContext('2d');
const canvasHeight = canvas.height = 1000;
const canvasWidth = canvas.width = 1000;
context.imageSmoothingEnabled = false;

const store = {
  phase: '',
  tick: 0,
  fpsInterval: 120,
  lastTime: Date.now(),
  isTransition: false,
}

const player = {
  menu: {
    x: 0,
    y: 410,
    stopX: canvasWidth - 200,
    speed: 8,
  }
}

// # EVENT_HOOKS
document.addEventListener('keyup', (event) => {
  if (event.keyCode == 32) {
    store.fpsInterval = 120;
    player.menu.stopX = canvasWidth + 200;
  }
});

// # GAME_INIT
// For dummies - those props set the canvas virtual resolution, not the DOM element size.
store.phase = 'start';

context.fillStyle = '#b8b8b8';
context.fillRect(0, 0, canvasWidth, canvasHeight);

const sprites = new Image();
sprites.src = '../images/sprites.png';

function animate() {
  requestAnimationFrame(animate);
  
  const now = Date.now();
  const elapsed = Date.now() - store.lastTime;
  
  if (elapsed > store.fpsInterval) {
    store.lastTime = now - (elapsed % store.fpsInterval);

    if (store.phase == 'start') {
      context.fillStyle = '#b8b8b8';
      context.fillRect(0, 0, canvasWidth, canvasHeight);

      player.menu.x < player.menu.stopX ? player.menu.x += player.menu.speed : player.menu.x;

      const characterSpriteWidth = 34;
      const characterSpriteHeight = 40;

      const cableSpriteWidth = 15;
      const cableSpriteHeight = 4;

      const characterSpriteOx = player.menu.x == player.menu.stopX
        ? !((store.tick % 4) % 2)
          ? (store.tick % 4) * characterSpriteWidth
          : characterSpriteWidth
        : !((store.tick % 4) % 2)
          ? (store.tick % 4 + 2) * characterSpriteWidth
          : characterSpriteWidth * 3;

      // Draw cable
      for (let i = 0; i < player.menu.x; i+= player.menu.speed) {
        const cableSpriteOx = (i % 16) / 8 * cableSpriteWidth;
        context.drawImage(sprites, cableSpriteOx, 40, cableSpriteWidth, cableSpriteHeight, player.menu.x - (i * 7), player.menu.y + 88, cableSpriteWidth * 4, cableSpriteHeight * 4);
      }

      // Draw character
      context.drawImage(sprites, characterSpriteOx, 0, characterSpriteWidth, characterSpriteHeight, player.menu.x, player.menu.y, characterSpriteWidth * 4, characterSpriteHeight * 4);

      if (player.menu.x == player.menu.stopX) {
        store.fpsInterval = 300;
      }

      // Draw text n stuff
      context.font = "60px Verdana";
      context.fillStyle = "#2e2e2e";
      context.fillText("Reconnected", 300, 110);
      
      context.font = "20px Verdana";
      context.fillText("Press spacebar to start..", 370, 160);
      
      context.fillText("A game by: Kamil Solecki & Matei Copot", 280, 960);

      store.tick++;
    }
  }
}

animate();
