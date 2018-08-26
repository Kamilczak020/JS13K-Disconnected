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
let fpsInterval = 120;

const store = {
  phase: '',
  tick: 0,
  then: Date.now(),
}

// # EVENT_HOOKS
canvas.addEventListener('click', (event) => {

});

// # GAME_INIT
// For dummies - those props set the canvas virtual resolution, not the DOM element size!
const canvasHeight = canvas.height = 1000;
const canvasWidth = canvas.width = 1000;
context.imageSmoothingEnabled = false;

store.phase = 'start';

context.fillStyle = '#b8b8b8';
context.fillRect(0, 0, canvasWidth, canvasHeight);

const sprites = new Image();
sprites.src = '../images/sprites.png';

function animate() {
  requestAnimationFrame(animate);
  
  const now = Date.now();
  const elapsed = Date.now() - store.then;
  
  if (elapsed > fpsInterval) {
    store.then = now - (elapsed % fpsInterval);

    if (store.phase == 'start') {
      context.fillStyle = '#b8b8b8';
      context.fillRect(0, 0, canvasWidth, canvasHeight);
      
      const speed = 8;
      const stopPositionX = canvasWidth - 200;

      const characterPositionX = Math.min(store.tick * speed, stopPositionX);
      const characterPositionY = 430;

      const characterSpriteWidth = 34;
      const characterSpriteHeight = 40;

      const characterSpriteOx = characterPositionX == stopPositionX
        ? !((store.tick % 4) % 2)
          ? (store.tick % 4) * characterSpriteWidth
          : characterSpriteWidth
        : !((store.tick % 4) % 2)
          ? (store.tick % 4 + 2) * characterSpriteWidth
          : characterSpriteWidth * 3;

      const cableSpriteWidth = 15;
      const cableSpriteHeight = 4;

      // Draw cable
      for (let i = 0; i < characterPositionX; i+= speed) {
        const cableSpriteOx = (i % 16) / 8 * cableSpriteWidth;
        context.drawImage(sprites, cableSpriteOx, 40, cableSpriteWidth, cableSpriteHeight, characterPositionX - (i * 7), 518, cableSpriteWidth * 4, cableSpriteHeight * 4);
      }

      // Draw character
      context.drawImage(sprites, characterSpriteOx, 0, characterSpriteWidth, characterSpriteHeight, characterPositionX, characterPositionY, characterSpriteWidth * 4, characterSpriteHeight * 4);

      if (characterPositionX == stopPositionX) {
        fpsInterval = 300;
      }

      store.tick++;
    }
  }
}

animate();
