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
    fpsInterval: 60,
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
    animations: {
      walking: {
        width: 34,
        height: 40,
        scale: 5,
        ticksPerAnimationFrame: 2,
        sequence: [2, 3, 4, 3],
      },
      standing: {
       width: 34, 
       height: 40,
       scale: 5,
       ticksPerAnimationFrame: 4,
       sequence: [0, 1, 2, 1],
      }
    }
  }
}

const cable = {
  menu: {
    sprite: {
      width: 15,
      height: 4,
      scale: 5,
      count: 2,
    }
  }
}

// # EVENT_HOOKS
document.addEventListener('keyup', (event) => {
  if (event.keyCode == 32) {
    if (store.game.phase == 'start') {
      store.transition.active = true;
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
  
  function selectAnimationFrame(animation) {
    if (!animation.ticksPerAnimationFrame) {
      return animation.sequence[store.game.tick % animation.sequence.length];
    } else {
      return animation.sequence[((store.game.tick / animation.ticksPerAnimationFrame) % animation.sequence.length) | 0];
    }
  }

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
      
      // Draw ground
      context.fillStyle = '#757575';
      context.fillRect(0, 580, canvasWidth, canvasHeight - 580);

      // Draw character
      const playerAnim = player.menu.x < player.menu.stopX ? player.menu.animations.walking : player.menu.animations.standing;
      context.drawImage(sprites, 
        selectAnimationFrame(playerAnim) * playerAnim.width,
        0,
        playerAnim.width,
        playerAnim.height,
        player.menu.x, 
        player.menu.y, 
        playerAnim.width * playerAnim.scale, 
        playerAnim.height * playerAnim.scale);

      // Draw cable
      for (let i = 0; i < player.menu.x - cable.menu.sprite.width; i+= cable.menu.sprite.width) {
        context.drawImage(sprites, 
          i % cable.menu.sprite.count * 15,
          40,
          cable.menu.sprite.width,
          cable.menu.sprite.height, 
          player.menu.x - cable.menu.sprite.width * cable.menu.sprite.scale * i / cable.menu.sprite.width, 
          player.menu.y + 104, 
          cable.menu.sprite.width * cable.menu.sprite.scale, 
          cable.menu.sprite.height * cable.menu.sprite.scale);
      }

      // Draw text n stuff
      writeText('Reconnected', 270, 50, 7);
      
      writeText('A game by: Kamil Solecki and Matei Copot', 250, 950, 2);

      if (store.transition.active) {
        context.font = '20px Verdana';
        context.fillText('Good Luck!', 430, 160);

        const transitionAlpha = 0.05 * store.transition.tick;
        context.fillStyle = `rgba(200, 200, 200, ${transitionAlpha})`;
        context.fillRect(0, 0, canvasWidth, canvasHeight);

        store.transition.tick++;

        if (transitionAlpha == 1) {
          store.transition.tick = 0;
          store.game.phase = 'tutorial';
        }
      } else {
        writeText('Press spacebar to start', 360, 120, 2);
      }

      store.game.tick++;
    }

    if (store.game.phase == 'tutorial') {
      // Background
      context.fillStyle = 'purple';
      context.fillRect(0, 0, canvasWidth, canvasHeight);

      if (store.transition.active) {
        const transitionAlpha = 1 - 0.05 * store.transition.tick;
        context.fillStyle = `rgba(200, 200, 200, ${transitionAlpha})`;
        context.fillRect(0, 0, canvasWidth, canvasHeight);

        store.transition.tick++;

        if (transitionAlpha == 0) {
          store.transition.active = false;
        }
      }
    }
  }
}

const textCanvas = document.createElement('canvas');
const textCtx = textCanvas.getContext('2d');
const textColorCanvas = document.createElement('canvas');
const textColorCtx = textColorCanvas.getContext('2d');
function writeText(text, x, y, scale, color = 'black') {
  const tw = textCanvas.width = textColorCanvas.width = 6 * scale * text.length;
  const th = textCanvas.height = textColorCanvas.height = 9 * scale;
  textColorCtx.imageSmoothingEnabled = false;
  textCtx.imageSmoothingEnabled = false;
  textColorCtx.fillStyle = color;
  textColorCtx.fillRect(0, 0, tw, th);
  textColorCtx.globalCompositeOperation = 'destination-in';

  for (let i = 0; i < text.length; i++) {
    const charcode = text.charCodeAt(i);
    
    const [spriteOx, spriteOy] =
        charcode === 33 ? [50, 62]
      : charcode === 35 ? [55, 62]
      : charcode === 63 ? [60, 62]
      : charcode === 46 ? [65, 62]
      : charcode === 58 ? [70, 62]
      : charcode > 47 && charcode < 58 ? [(charcode - 48) * 5, 61]
      : charcode > 64 && charcode < 91 ? [(charcode - 65) * 5 + 1, 53]
      : charcode > 96 && charcode < 123 ? [(charcode - 97) * 5 + 1, 44]
      : [0, 0];

    textCtx.drawImage(
      sprites,
      spriteOx, spriteOy,
      5, 9,
      scale * i * 6, 0,
      5 * scale, 9 * scale,
    );
  }

  textColorCtx.drawImage(textCanvas, 0, 0);

  context.drawImage(textColorCanvas, x, y);
}

sprites.onload = () => animate();
