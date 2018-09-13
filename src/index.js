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

// # GLOBALS ----------------------------------------------------------
const context = canvas.getContext('2d');
const canvasHeight = canvas.height = 1000;
const canvasWidth = canvas.width = 1000;
context.imageSmoothingEnabled = false;

class Viewport {
  constructor(size, panThreshold = 200) {
    this.size = size;
    this.x = 0;
    this.y = 0;
    this.panThreshold = panThreshold;
  }

  pan(direction) {
    if(direction === 0) {
      this.y += 10;
    } else if(direction === 1) {
      this.y -= 10;
    } else if(direction === 2) {
      this.x -= 10;
    } else if(direction === 3) {
      this.x += 10;
    }
  }
}

class Cell {
  constructor(x, y, size, type) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.type = type;
    this.prop = null;
  }

  renderBackground(viewport) {
    const [spriteOx, spriteOy] = this.type == 'floor' ? [0, 71]
      : [20, 71];

    context.drawImage(sprites, spriteOx, spriteOy, 20, 20, (this.x * this.size) - viewport.x, (this.y * this.size) - viewport.y, this.size, this.size);
  }

  render(viewport) {
    if (!!this.prop) {
      context.globalAlpha = this.prop.alpha;
      context.drawImage(sprites, this.prop.oX, this.prop.oY, 20, 20, (this.x * this.size) - viewport.x, (this.y * this.size) - viewport.y, this.size, this.size);
      context.globalAlpha = 1;
    }
  }
}

class Grid {
  constructor(gridSize, cellSize) {
    this.gridSize = gridSize;
    this.cellSize = cellSize;
    this.cells = [];
    this.collidableCells = [];
    this.objectRenderStack = [];
    this.viewport = new Viewport(1000);

    for (let column = 0; column < this.gridSize; column++) {
      this.cells[column] = [];
      
      for(let row = 0; row < this.gridSize; row++) {
        if (row == 0) {
          this.cells[column][row] = new Cell(column, row, cellSize, 'wall');
        } else {
          this.cells[column][row] = new Cell(column, row, cellSize, 'floor');
        }
      }
    }

    this.cells[5][3].prop = Object.assign({}, gameProps.serverMachineTop1);
    this.cells[5][4].prop = Object.assign({}, gameProps.serverMachineBottom1);
    this.cells[6][3].prop = Object.assign({}, gameProps.serverMachineTop1);
    this.cells[6][4].prop = Object.assign({}, gameProps.serverMachineBottom1);
    this.cells[7][3].prop = Object.assign({}, gameProps.serverMachineTop1);
    this.cells[7][4].prop = Object.assign({}, gameProps.serverMachineBottom1);
    this.cells[5][1].prop = Object.assign({}, gameProps.cableHook);
    this.cells[5][9].prop = Object.assign({}, gameProps.wallPlugIn);
    this.collidableCells.push(this.cells[5][4]);
    this.collidableCells.push(this.cells[6][4]);
    this.collidableCells.push(this.cells[7][4]);
    this.collidableCells.push(this.cells[5][9]);
  }

  getCellAtPosition(x, y) {
    return this.cells[((x / this.cellSize) | 0)][((y / this.cellSize) | 0)];
  }

  // Currently works for corners only, might be renamed in the future if I wont need actual functionality of range.
  getCellsInRange(x1, y1, x2, y2) {
    const cells = [
      this.getCellAtPosition(x1, y1),
      this.getCellAtPosition(x1, y2),
      this.getCellAtPosition(x2, y1),
      this.getCellAtPosition(x2, y2)
    ];

    return cells.filter((a, i, c) => c.indexOf(a, i + 1) < 0);
  }

  render() {
    this.objectRenderStack = [];

    this.cells.forEach(column => {
      column.forEach(cell => {
        cell.renderBackground(this.viewport);
        
        if (cell.prop) {
          if (cell.prop.zIndex == -1) {
            cell.render(this.viewport);
          } else {
            if (cell.prop.isCompound && !cell.prop.isCompoundBase) {
              cell.prop.zIndex = cell.y + cell.prop.compoundCellPosition[1];
            } else {
              cell.prop.zIndex = cell.y;
            }
            this.objectRenderStack.push(cell);
          }       
        }
      });
    });
    
    const playerCell = store.player.cellInGrid();
    store.player.zIndex = playerCell.y - 1;

    this.objectRenderStack.push(store.player);
    this.objectRenderStack.sort((a, b) => {
      if (a.zIndex !== undefined) {
        return a.zIndex - b.prop.zIndex;
      } else if(b.zIndex !== undefined){
        return a.prop.zIndex - b.zIndex;
      } else {
        return a.prop.zIndex - b.prop.zIndex;
      }
    });

    const offsets = [-1, 0, 1];
    this.objectRenderStack.forEach(object => {
      if(object.prop) {
        const objectY = object.prop.isCompound && !object.prop.isCompoundBase ? object.y + object.prop.compoundCellPosition[1] - playerCell.y : object.y - playerCell.y;
        if (offsets.includes(object.x - playerCell.x) && offsets.includes(objectY) && object.prop.zIndex > store.player.zIndex) {
          object.prop.alpha = 0.5;
        } else {
          object.prop.alpha = object.prop.defaultAlpha;
        }
      }
      object.render(this.viewport);
    });

    if (store.player.cable) {
      store.player.cable.render(); 
    }
  }
}

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 8;
    this.zIndex = 0;
    this.cable;
    this.activeAnimation = playerAnimations.standing;
    
    // 0 - UP, 1 - DOWN, 2 - LEFT, 3 - RIGHT
    this.orientation = 0;
    
    // Localized
    this.boundingBox = [0, 55, 70, 80];
  }

  cellInGrid() {
    return store.grid.getCellAtPosition(this.x + this.boundingBox[2], this.y + this.boundingBox[3]);
  }

  // 0 - UP, 1 - DOWN, 2 - LEFT, 3 - RIGHT
  move(direction) {
    const globalBoundingBox = [this.x, this.y, this.x, this.y].map((a, i) => a + this.boundingBox[i]);

    // UP
    if (direction == 0) {
      const cellsAbove = store.grid.collidableCells.filter(cell => {
        const cellGlobalBoundingBox = cell.prop.boundingBox.map((a, i) => a * 5 + [cell.x, cell.y][i % 2] * cell.size);
        return globalBoundingBox[0] < cellGlobalBoundingBox[2] && globalBoundingBox[2] > cellGlobalBoundingBox[0] && globalBoundingBox[1] > cellGlobalBoundingBox[3];
      });

      const cellsGlobalBoundingBoxes = cellsAbove.map(cell => {
        return  cell.prop.boundingBox.map((a, i) => a * 5 + [cell.x, cell.y][i % 2] * cell.size);
      });

      if (cellsAbove.length != 0) {
        const maxY = cellsGlobalBoundingBoxes.map(cell => cell[3]).reduce((prev, curr) => {
          return prev > curr ? prev : curr;
        });

        for (let i = 0; i < (this.boundingBox[1] + this.y - maxY - 1) && i < this.speed; i++) {
          if (this.y > 50) {
            this.y--;
          }
        }
      } else if (this.y > 50) {
        this.y -= this.speed;
      }
    }

    // DOWN
    if (direction == 1) {
      const cellsBelow = store.grid.collidableCells.filter(cell => {
        const cellGlobalBoundingBox = cell.prop.boundingBox.map((a, i) => a * 5 + [cell.x, cell.y][i % 2] * cell.size);
        return globalBoundingBox[0] < cellGlobalBoundingBox[2] && globalBoundingBox[2] > cellGlobalBoundingBox[0] && globalBoundingBox[3] < cellGlobalBoundingBox[1];
      });

      const cellsGlobalBoundingBoxes = cellsBelow.map(cell => {
        return  cell.prop.boundingBox.map((a, i) => a * 5 + [cell.x, cell.y][i % 2] * cell.size);
      });

      if (cellsBelow.length != 0) {
        const minY = cellsGlobalBoundingBoxes.map(cell => cell[1]).reduce((prev, curr) => {
          return prev < curr ? prev : curr;
        });

        for (let i = 0; i < (minY - globalBoundingBox[3] - 1) && i < this.speed; i++) {
          if (this.y < store.grid.gridSize * store.grid.cellSize) {
            this.y++;
          }
        }
      } else if (this.y < store.grid.gridSize * store.grid.cellSize - 90) {
        this.y += this.speed;
      }
    }
    
    // LEFT
    if (direction == 2) {
      const cellsLeft = store.grid.collidableCells.filter(cell => {
        const cellGlobalBoundingBox = cell.prop.boundingBox.map((a, i) => a * 5 + [cell.x, cell.y][i % 2] * cell.size);
        return globalBoundingBox[1] < cellGlobalBoundingBox[3] && globalBoundingBox[3] > cellGlobalBoundingBox[1] && globalBoundingBox[0] > cellGlobalBoundingBox[2];
      });

      const cellsGlobalBoundingBoxes = cellsLeft.map(cell => {
        return  cell.prop.boundingBox.map((a, i) => a * 5 + [cell.x, cell.y][i % 2] * cell.size);
      });

      if (cellsLeft.length != 0) {
        const minX = cellsGlobalBoundingBoxes.map(cell => cell[2]).reduce((prev, curr) => {
          return prev > curr ? prev : curr;
        });

        for (let i = 0; i < globalBoundingBox[0] - minX - 1 && i < this.speed; i++) {
          if (this.x > 0) {
            this.x--;
          }
        }
      } else if (this.x > this.speed) {
        this.x -= this.speed;
      }
    }

    // RIGHT
    if (direction == 3) {
      const cellsRight = store.grid.collidableCells.filter(cell => {
        const cellGlobalBoundingBox = cell.prop.boundingBox.map((a, i) => a * 5 + [cell.x, cell.y][i % 2] * cell.size);
        return globalBoundingBox[1] < cellGlobalBoundingBox[3] && globalBoundingBox[3] > cellGlobalBoundingBox[1] && globalBoundingBox[2] < cellGlobalBoundingBox[0];
      });

      const cellsGlobalBoundingBoxes = cellsRight.map(cell => {
        return  cell.prop.boundingBox.map((a, i) => a * 5 + [cell.x, cell.y][i % 2] * cell.size);
      });

      if (cellsRight.length != 0) {
        const minX = cellsGlobalBoundingBoxes.map(cell => cell[0]).reduce((prev, curr) => {
          return prev < curr ? prev : curr;
        });

        for (let i = 0; i < minX - globalBoundingBox[2] - 1 && i < this.speed; i++) {
          if (this.x < store.grid.gridSize * store.grid.cellSize) {
            this.x++;
          }
        }
      } else if (this.x < store.grid.gridSize * store.grid.cellSize - 76) {
        this.x += this.speed;
      }
    }
  }

  render() {
    context.drawImage(sprites, this.activeAnimation.sequence[this.activeAnimation.frame], 91 + 16 * this.orientation, 14, 16, this.x, this.y, 14 * 5, 16 * 5);
    this.activeAnimation.frame = ((this.activeAnimation.tick / this.activeAnimation.duration) | 0) % this.activeAnimation.sequence.length;
    this.activeAnimation.tick++;
  }
}

class Cable {
  constructor(start, color) {
    this.start = start;
    this.color = color;
    this.isPickedUp = false;
    this.points = [];
  }

  render() {
    context.beginPath();
    context.moveTo(this.start[0], this.start[1]);
    
    this.points.forEach(point => {
      context.lineTo(point[0], point[1]);
    });

    if (this.isPickedUp) {
      context.lineTo(store.player.x + 10, store.player.y + 50);
    }

    context.strokeStyle = this.color;
    context.stroke();
  }
}

const playerAnimations = {
  standing: {
    frame: 0,
    duration: 1,
    sequence: [0],
    tick: 0,
  },
  walking: {
    frame: 0,
    duration: 2,
    sequence: [14, 0, 28, 0],
    tick: 0,
  }
}

const gameProps = {
  serverMachineBottom1: {
    oX: 0,
    oY: 175,
    boundingBox: [0, 10, 20, 20],
    isCompound: true,
    isCompoundBase: true,
    compoundCellPosition: [0, -1],
    zIndex: 0,
    alpha: 1,
    defaultAlpha: 1,
    type: 'static',
  },
  serverMachineTop1: {
    oX: 0,
    oY: 155,
    isCompound: true,
    isCompoundBase: false,
    compoundCellPosition: [0, 1],
    zIndex: 0,
    aplpha: 1,
    defaultAlpha: 1,
    type: 'static',
  },
  cableHook: {
    oX: 0,
    oY: 195,
    isCompound: false,
    zIndex: -1,
    alpha: 1,
    defaultAlpha: 1,
    type: 'hook',
  },
  wallPlugIn: {
    oX: 20,
    oY: 195,
    boundingBox: [0, 9, 20, 20],
    isCompound: false,
    zIndex: -1,
    alpha: 1,
    defaultAlpha: 1,
    color: '#ae3030',
    type: 'plugIn',
    orientation: 0,
  }, 
  wallPlugOut: {
    oX: 40,
    oY: 195,
    boundingBox: [0, 12, 20, 20],
    isCompound: false,
    zIndex: -1,
    alpha: 1,
    defaultAlpha: 1,
    color: '#ae3030',
    type: 'plugOut',
    orientation: 0,
  }
}

// Currently just for the menu, will gonna do something with it later, I don't like it.
const playerStore = {
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


// Also menu, also crap
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

// Will be inlined later on, but its nice to have em together when im still changing things
const text = {
  menu: [{
    x: 260,
    y: 50,
    boxWidth: 50,
    duration: 50,
    holdTime: 0,
    elapsed: 0,
    scale: 7,
    value: 'Reconnected',
  }, {
    x: 345,
    y: 120,
    boxWidth: 50,
    duration: 0,
    delay: 55,
    elapsed: 0,
    scale: 2,
    value: 'Press spacebar to start'
  }, {
    x: 260,
    y: 950,
    boxWidth: 50,
    elapsed: 0,
    delay: 55,
    duration: 0,
    scale: 2,
    value: 'A game by: Kamil Solecki and Matei Copot'
  }, {
    x: 420,
    y: 120,
    boxWidth: 50,
    elapsed: 0,
    duration: 0,
    scale: 2, 
    value: 'Good Luck!'
  }],
  tutorial: [{
      x: 30,
      y: 30,
      boxWidth: 30,
      elapsed: 0,
      duration: 200,
      scale: 2,
      value: 'Welcome to Reconnected!\n\nYou can use arrows to\nmove around.\nPress spacebar to interact with\nthings you encounter.\n\nGood luck!',
    }]
};

const store = {
  lastTime: Date.now(),
  keys: {},
  grid: new Grid(10, 100),
  player: new Player(500, 300),
  cables: [],
  game: {
    phase: '',
    tick: 0,
    fpsInterval: getFps(60),
  },
  transition: {
    active: false,
    tick: 0,
  },
}

// The pure magic of key bindings, will most likely stay as is.
const keyset = {
  // Spacebar
  32: {
    press: () => {
      if (store.game.phase == 'tutorial') {
        const playerCell = store.player.cellInGrid();
        const offsetsX = [-1, 0, 1];
        const offsetsY = [-1, 0, 1];

        const cell = {
          0: store.grid.cells[playerCell.x][playerCell.y - 1],
          1: store.grid.cells[playerCell.x][playerCell.y + 1],
          2: store.grid.cells[playerCell.x - 1][playerCell.y],
          3: store.grid.cells[playerCell.x + 1][playerCell.y]
        };

        const cells = [store.grid.cells[playerCell.x][playerCell.y], cell[store.player.orientation]];
        cells.forEach(cell => {
          if (cell !== undefined && cell.prop) {
            if (cell.prop.type == 'plugIn' && !store.player.hasPlug) {
              cell.prop = Object.assign({}, gameProps.wallPlugOut);
              const cable = new Cable([cell.x * cell.size + 50, cell.y * cell.size + 80], '#ae3030');
              cable.isPickedUp = true;
              
              store.player.cable = cable;
              store.cables.push(cable);
            }
          }
        });
        
      }
    },
    hold: () => {},
    release: () => {
      if (store.game.phase == 'start') {
        store.transition.active = true;
        playerStore.menu.stopX = canvasWidth + 200;
      }
    }
  },
  // Left Arrow
  37: {
    press: () => {},
    hold: () => {
      store.player.activeAnimation = playerAnimations.walking;
      if (!(store.keys[38] || store.keys[40])) {
        store.player.orientation = 2; 
      }
      if(store.player.x <= store.grid.viewport.panThreshold) {
        store.grid.viewport.pan(2);
      } else {
        store.player.move(2);
      }
    },
    release: () => {
      store.player.activeAnimation = playerAnimations.standing;
    },
  },
  // Up Arrow
  38: {
    press: () => {
      store.player.orientation = 0;
    },
    hold: () => {
      store.player.activeAnimation = playerAnimations.walking;
      if(store.player.y >= store.grid.viewport.size - store.grid.viewport.panThreshold) {
        store.grid.viewport.pan(0);
      } else {
        store.player.move(0);
      }
    },
    release: () => {
      store.player.activeAnimation = playerAnimations.standing;
    },
  },
  // Right Arrow
  39: {
    press: () => {},
    hold: () => {
      store.player.activeAnimation = playerAnimations.walking;
      if (!(store.keys[38] || store.keys[40])) {
        store.player.orientation = 3; 
      }
      if(store.player.x >= store.grid.viewport.size - store.grid.viewport.panThreshold) {
        store.grid.viewport.pan(3);
      } else {
        store.player.move(3);
      }
    },
    release: () => {
      store.player.activeAnimation = playerAnimations.standing;
    },
  },
  // Down Arrow
  40: {
    press: () => {
      store.player.orientation = 1;
    },
    hold: () => {
      store.player.activeAnimation = playerAnimations.walking;
      if(store.player.y <= store.grid.viewport.panThreshold) {
        store.grid.viewport.pan(1);
      } else {
        store.player.move(1);
      }
    },
    release: () => {
      store.player.activeAnimation = playerAnimations.standing;
    },
  },
}

// # EVENT_HOOKS ----------------------------------------------------------
window.onkeydown = event => {
  const key = (event || window.event).keyCode;
  if (!(key in keyset)) {
    return true;
  }
  if (!(key in store.keys)) {
    store.keys[key] = true;
    keyset[key].press();
    keyset[key].hold();
  }
  return false;
};

window.onkeyup = event => {
  const key = (event || window.event).keyCode;
  if (key in store.keys) {
    if (store.keys[key]) {
      keyset[key].release();
    }
    delete store.keys[key];
  }
};

window.onblur = () => store.keys = {};
document.onmouseup = e => e.which === 3 ? store.keys = {} : false;
// # GAME_INIT ----------------------------------------------------------
store.game.phase = 'tutorial';

context.fillStyle = '#b8b8b8';
context.fillRect(0, 0, canvasWidth, canvasHeight);

const sprites = new Image();
sprites.src = '../images/sprites.png';

function selectAnimationFrame(animation) {
  if (!animation.ticksPerAnimationFrame) {
    return animation.sequence[store.game.tick % animation.sequence.length];
  } else {
    return animation.sequence[((store.game.tick / animation.ticksPerAnimationFrame) % animation.sequence.length) | 0];
  }
}

function animate() {
  requestAnimationFrame(animate);

  const now = Date.now();
  const elapsed = Date.now() - store.lastTime;
  if (elapsed > store.game.fpsInterval) {
    store.lastTime = now - (elapsed % store.game.fpsInterval);

    // Run key handlers
    for (let key in store.keys) {
      keyset[key].hold();
    }

    // # MENU ----------------------------------------------------------
    if (store.game.phase == 'start') {
      context.fillStyle = '#b8b8b8';
      context.fillRect(0, 0, canvasWidth, canvasHeight);

      if (playerStore.menu.x < playerStore.menu.stopX) {
        playerStore.menu.x += playerStore.menu.speed;
      }
      
      // Draw ground
      context.fillStyle = '#757575';
      context.fillRect(0, 580, canvasWidth, canvasHeight - 580);

      // Draw character
      const playerAnim = playerStore.menu.x < playerStore.menu.stopX ? playerStore.menu.animations.walking : playerStore.menu.animations.standing;
      context.drawImage(sprites, 
        selectAnimationFrame(playerAnim) * playerAnim.width,
        0,
        playerAnim.width,
        playerAnim.height,
        playerStore.menu.x, 
        playerStore.menu.y, 
        playerAnim.width * playerAnim.scale, 
        playerAnim.height * playerAnim.scale);

      // Draw cable
      for (let i = 0; i < playerStore.menu.x - cable.menu.sprite.width; i+= cable.menu.sprite.width) {
        context.drawImage(sprites, 
          i % cable.menu.sprite.count * 15,
          40,
          cable.menu.sprite.width,
          cable.menu.sprite.height, 
          playerStore.menu.x - 40 - cable.menu.sprite.width * cable.menu.sprite.scale * i / (cable.menu.sprite.width + 2), 
          playerStore.menu.y + 104, 
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
          store.game.fpsInterval = getFps(20);
          store.game.phase = 'tutorial';
        }
      } else {
        writeText(text.menu[1], true);
      }

      store.game.tick++;
    }

    // # TUTORIAL ----------------------------------------------------------
    if (store.game.phase == 'tutorial') {
      // Background
      context.fillStyle = 'purple';
      context.fillRect(0, 0, canvasWidth, canvasHeight);

      store.grid.render();

      // Draw tutorial textbox
      context.strokeStyle = '#0f4666';
      context.lineWidth = 8;
      context.fillStyle = '#2b75a0';
      context.fillRect(20, 20, 400, canvasHeight - 40);
      context.strokeRect(20, 20, 400, canvasHeight - 40);

      writeText(text.tutorial[0], true);

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

function getFps(fps) {
  return 1000 / fps;
}

// # TEXT ----------------------------------------------------------
const textCanvas = document.createElement('canvas');
const textContext = textCanvas.getContext('2d');
const textColorCanvas = document.createElement('canvas');
const textColorContext = textColorCanvas.getContext('2d');

function writeText(text, persistent, color = 'black') {
  const characterCount = (text.duration) > 0 ? Math.min(text.value.length, (((text.elapsed) / (text.duration / text.value.length)) | 0))
    : text.value.length;

  let lineNumber = 0;  
  let lastNewline = 0;
  if (text.delay == 0 || !text.delay) {
    if (text.elapsed < text.duration + text.holdTime || persistent) {
      for (let i = 0; i < characterCount; i++) {
        if (text.value.charCodeAt(i) == 10) {
          lineNumber++;
          lastNewline = i + 1;
        }

        writeLetter(text.value[i], text.x + (i - lastNewline) * text.scale * 6, text.y + 9 * text.scale * lineNumber, text.scale, color);
      }
  
      text.elapsed++;
    }
  }

  if (text.delay > 0) {
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
