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
 * # MENU
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
  lastTime: Date.now(),
  game: {
    phase: '',
    tick: 0,
    fpsInterval: 120,
  },
  transition: {
    active: false,
    tick: 0,
  }
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
    if (store.game.phase == 'start') {
      store.transition.active = true;
      store.game.fpsInterval = 120;
      player.menu.stopX = canvasWidth + 200;    
    }
  }
});

// # GAME_INIT
// For dummies - those props set the canvas virtual resolution, not the DOM element size.
store.game.phase = 'start';

context.fillStyle = '#b8b8b8';
context.fillRect(0, 0, canvasWidth, canvasHeight);

const sprites = new Image();
sprites.src = '../images/sprites.png';

function animate() {
  requestAnimationFrame(animate);
  
  const now = Date.now();
  const elapsed = Date.now() - store.lastTime;
  
  if (elapsed > store.game.fpsInterval) {
    store.lastTime = now - (elapsed % store.game.fpsInterval);

    // # MENU
    if (store.game.phase == 'start') {
      context.fillStyle = '#b8b8b8';
      context.fillRect(0, 0, canvasWidth, canvasHeight);

      if (player.menu.x < player.menu.stopX) {
        player.menu.x += player.menu.speed;
      }

      const characterSpriteWidth = 34;
      const characterSpriteHeight = 40;

      const cableSpriteWidth = 15;
      const cableSpriteHeight = 4;

      const characterSpriteOx = player.menu.x == player.menu.stopX
        ? !((store.game.tick % 4) % 2)
          ? (store.game.tick % 4) * characterSpriteWidth
          : characterSpriteWidth
        : !((store.game.tick % 4) % 2)
          ? (store.game.tick % 4 + 2) * characterSpriteWidth
          : characterSpriteWidth * 3;

      // Draw cable
      for (let i = 0; i < player.menu.x; i+= player.menu.speed) {
        const cableSpriteOx = (i % 16) / 8 * cableSpriteWidth;
        context.drawImage(sprites, cableSpriteOx, 40, cableSpriteWidth, cableSpriteHeight, player.menu.x - 15 * 5 - (i * 8), player.menu.y + 104, cableSpriteWidth * 5, cableSpriteHeight * 5);
      }

      // Draw character
      context.drawImage(sprites, characterSpriteOx, 0, characterSpriteWidth, characterSpriteHeight, player.menu.x, player.menu.y, characterSpriteWidth * 5, characterSpriteHeight * 5);

      if (player.menu.x == player.menu.stopX) {
        store.game.fpsInterval = 300;
      }

      // Draw text n stuff
      context.font = "60px Verdana";
      context.fillStyle = '#2e2e2e';
      context.fillText('Reconnected', 300, 110);
      
      context.font = '20px Verdana';
      context.fillText('Press spacebar to start..', 370, 160);
      
      context.fillText('A game by: Kamil Solecki & Matei Copot', 280, 960);

      if (store.transition.active) {
        const transitionAlpha = 0.05 * store.transition.tick;
        context.fillStyle = `rgba(200, 200, 200, ${transitionAlpha})`;
        context.fillRect(0, 0, canvasWidth, canvasHeight);

        store.transition.tick++;

        if (transitionAlpha == 1) {
          store.game.phase = 'tutorial';
        }
      }

      store.game.tick++;
    }

    if (store.game.phase == 'tutorial') {

    }
  }
}

animate();
