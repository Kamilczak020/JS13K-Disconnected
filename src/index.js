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
 * # TUTORIAL
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

class Viewport {
  constructor(size) {
    this.size = size;
    this.x = 0;
    this.y = 0;
  }
}

class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 100;
  }

  render(viewport) {
    context.drawImage(sprites, 0, 71, 20, 20, (this.x * this.size) - viewport.x, (this.y * this.size) - viewport.y, this.size, this.size);
  }
}

class Grid {
  constructor(size) {
    this.size = size;
    this.cells = [];
    this.viewport = new Viewport(1000);

    for (let column = 0; column < this.size; column++) {
      this.cells[column] = [];
      
      for(let row = 0; row < this.size; row++) {
        this.cells[column][row] = new Cell(column, row);
      }
    }
  }

  render() {
    this.cells.forEach(column => {
      column.forEach(cell => {
        cell.render(this.viewport);
      });
    });
  }
}


const store = {
  lastTime: Date.now(),
  grid: new Grid(25),
  game: {
    phase: '',
    tick: 0,
    fpsInterval: 60,
  },
  transition: {
    active: false,
    tick: 0,
  },
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

const text = {
  menu: [{
    x: 260,
    y: 50,
    duration: 50,
    holdTime: 0,
    elapsed: 0,
    scale: 7,
    value: 'Reconnected',
  }, {
    x: 345,
    y: 120,
    duration: 0,
    delay: 55,
    elapsed: 0,
    scale: 2,
    value: 'Press spacebar to start'
  }, {
    x: 260,
    y: 950,
    elapsed: 0,
    delay: 55,
    duration: 0,
    scale: 2,
    value: 'A game by: Kamil Solecki and Matei Copot'
  }, {
    x: 420,
    y: 120,
    elapsed: 0,
    duration: 0,
    scale: 2, 
    value: 'Good Luck!'
  }
  ],
  tutorial: [{
      x: 0,
      y: 0,
      elapsed: 0,
      scale: 3,
      value: 'Welcome to Reconnected!',
    }]
};

// # EVENT_HOOKS
document.addEventListener('keyup', (event) => {
  if (event.keyCode == 32) {
    if (store.game.phase == 'start') {
      store.transition.active = true;
      player.menu.stopX = canvasWidth + 200;    
    }
  }

  if (store.game.phase == 'tutorial') {
    if (event.keyCode == 40) {
      console.log(store.grid.viewport.y);
      store.grid.viewport.y += 2;
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
          player.menu.x - 40 - cable.menu.sprite.width * cable.menu.sprite.scale * i / (cable.menu.sprite.width + 2), 
          player.menu.y + 104, 
          cable.menu.sprite.width * cable.menu.sprite.scale, 
          cable.menu.sprite.height * cable.menu.sprite.scale);
      }

      // Draw text n stuff
      writeText(text.menu[0], true);
      
      writeText(text.menu[2], true);

      if (store.transition.active) {
        writeText(text.menu[3], true);

        const transitionAlpha = 0.05 * store.transition.tick;
        context.fillStyle = `rgba(200, 200, 200, ${transitionAlpha})`;
        context.fillRect(0, 0, canvasWidth, canvasHeight);

        store.transition.tick++;

        if (transitionAlpha == 1) {
          store.transition.tick = 0;
          store.game.phase = 'tutorial';
        }
      } else {
        writeText(text.menu[1], true);
      }

      store.game.tick++;
    }

    // # TUTORIAL
    if (store.game.phase == 'tutorial') {
      // Background
      context.fillStyle = 'purple';
      context.fillRect(0, 0, canvasWidth, canvasHeight);

      store.grid.render();

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
const textContext = textCanvas.getContext('2d');
const textColorCanvas = document.createElement('canvas');
const textColorContext = textColorCanvas.getContext('2d');

function writeText(text, persistent, color = 'black') {

  const characterCount = (text.duration) > 0 ? Math.min(text.value.length, (((text.elapsed) / (text.duration / text.value.length)) | 0))
    : text.value.length;

  if (text.delay == 0 || !text.delay) {
    if (text.elapsed < text.duration + text.holdTime || persistent) {
      for (let i = 0; i < characterCount; i++) {
        writeLetter(text.value[i], text.x + i * text.scale * 6, text.y, text.scale, color);
      }
  
      text.elapsed++;
    }
  }


  if (text.delay > 0) {
    console.log(text.delay);
    text.delay--;
  }
}

function writeLetter(letter, x, y, scale, color = 'black') {
  const textWidth = textCanvas.width = textColorCanvas.width = 6 * scale;
  const textHeight = textCanvas.height = textColorCanvas.height = 9 * scale;
  
  textColorContext.imageSmoothingEnabled = false;
  textContext.imageSmoothingEnabled = false;
  
  textColorContext.fillStyle = color;
  textColorContext.fillRect(0, 0, textWidth, textHeight);
  textColorContext.globalCompositeOperation = 'destination-in';

  const charcode = letter.charCodeAt(0);
  const [spriteOx, spriteOy] =
      charcode == 33 ? [50, 62]
    : charcode == 35 ? [55, 62]
    : charcode == 63 ? [60, 62]
    : charcode == 46 ? [65, 62]
    : charcode == 58 ? [70, 62]
    : charcode > 47 && charcode < 58 ? [(charcode - 48) * 5, 62]
    : charcode > 64 && charcode < 91 ? [(charcode - 65) * 5 + 1, 53]
    : charcode > 96 && charcode < 123 ? [(charcode - 97) * 5 + 1, 44]
    : [0, 0];

  textContext.drawImage(sprites, spriteOx, spriteOy, 5, 9, 0, 0, 5 * scale, 9 * scale);
  textColorContext.drawImage(textCanvas, 0, 0);
  context.drawImage(textColorCanvas, x, y);
}

// Run after resources have loaded
sprites.onload = () => animate();
