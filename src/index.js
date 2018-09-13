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
// will be referenced directly by id
const canvas = document.getElementById('gamearea');

// # GLOBALS ----------------------------------------------------------
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
          
          if (cell.prop.color !== undefined) {
            context.fillStyle = cell.prop.color;
            if (cell.prop.oY == 195) {
              context.fillRect(cell.x * cell.size + 45, cell.y * cell.size + 65, 10, 10);
            } else if (cell.prop.oY == 235) {
              context.fillRect(cell.x * cell.size + 45, cell.y * cell.size + 63, 10, 10);
            }
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

    if (store.cables.length !== 0) {
      store.cables.forEach(cable => {
        cable.render();
      });
    }

    if (store.game.blackout) {
      context.fillStyle = 'rgba(0, 0, 0, 0.95)';
      context.fillRect(0, 0, canvasHeight, canvasWidth);
    }
  }
}

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 5;
    this.zIndex = 0;
    this.cable = undefined;
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
      if (this.cable !== undefined && this.cable.disabledAxis == 0) {
        console.log('up');
        return;
      }

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
      if (this.cable !== undefined && this.cable.disabledAxis == 0) {
        console.log('down');
        return;
      }

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
      if (this.cable !== undefined && this.cable.disabledAxis == 1) {
        console.log('left');

        return;
      }

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
      if (this.cable !== undefined && this.cable.disabledAxis == 1) {
        console.log('right');
        return;
      }

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
    // 0 - x, 1 - y
    this.disabledAxis = 0;
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
    duration: 4,
    sequence: [14, 0, 28, 0],
    tick: 0,
  }
}

let gameProps = {
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
    oY: 276,
    isCompound: false,
    zIndex: -1,
    alpha: 1,
    defaultAlpha: 1,
    type: 'hook',
    connected: false,
  },
  powerSwitch: {
    oX: 20,
    oY: 276,
    boundingBox: [0, 10, 20, 20],
    isCompound: false,
    zIndex: -1,
    alpha: 1,
    defaultAlpha: 1,
    type: 'switch',
  },
  wallPlugIn0: {
    oX: 0,
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
  wallPlugOut0: {
    oX: 20,
    oY: 195,
    boundingBox: [0, 12, 20, 20],
    isCompound: false,
    zIndex: -1,
    alpha: 1,
    defaultAlpha: 1,
    color: '#ae3030',
    type: 'plugOut',
    orientation: 0,
  },
  wallSocketOut0: {
    oX: 40,
    oY: 195,
    boundingBox: [0, 12, 20, 20],
    isCompound: false,
    zIndex: -1,
    alpha: 1,
    defaultAlpha: 1,
    color: '#ae3030',
    type: 'socketOut',
    orientation: 0,
  },
  wallSocketIn0: {
    oX: 60,
    oY: 195,
    boundingBox: [0, 12, 20, 20],
    isCompound: false,
    zIndex: -1,
    alpha: 1,
    defaultAlpha: 1,
    color: '#ae3030',
    type: 'socketIn',
    orientation: 0,
  },
}

// DOWN
gameProps.wallPlugIn1 = Object.assign({}, gameProps.wallPlugIn0, {
  oY: 235,
  boundingBox: [0, 0, 20, 8],
  orientation: 1,
});

gameProps.wallPlugOut1 = Object.assign({}, gameProps.wallPlugOut0, {
  oY: 235,
  boundingBox: [0, 0, 20, 8],
  orientation: 1,
});

gameProps.wallSocketOut1 = Object.assign({}, gameProps.wallSocketOut0, {
  oY: 235,
  boundingBox: [0, 0, 20, 8],
  orientation: 1,
});

gameProps.wallSocketIn1 = Object.assign({}, gameProps.wallSocketIn0, {
  oY: 235,
  boundingBox: [0, 0, 20, 8],
  orientation: 1,
});

// LEFT
gameProps.wallPlugIn2 = Object.assign({}, gameProps.wallPlugIn0, {
  oY: 215,
  boundingBox: [0, 0, 8, 20],
  orientation: 1,
});

gameProps.wallPlugOut2 = Object.assign({}, gameProps.wallPlugOut0, {
  oY: 215,
  boundingBox: [0, 0, 8, 20],
  orientation: 1,
});

gameProps.wallSocketOut2 = Object.assign({}, gameProps.wallSocketOut0, {
  oY: 215,
  boundingBox: [0, 0, 8, 20],
  orientation: 1,
});

gameProps.wallSocketIn2 = Object.assign({}, gameProps.wallSocketIn0, {
  oY: 215,
  boundingBox: [0, 0, 8, 20],
  orientation: 1,
});

// RIGHT
gameProps.wallPlugIn3 = Object.assign({}, gameProps.wallPlugIn0, {
  oY: 245,
  boundingBox: [8, 0, 20, 20],
  orientation: 1,
});

gameProps.wallPlugOut3 = Object.assign({}, gameProps.wallPlugOut0, {
  oY: 245,
  boundingBox: [8, 0, 20, 20],
  orientation: 1,
});

gameProps.wallSocketOut3 = Object.assign({}, gameProps.wallSocketOut0, {
  oY: 245,
  boundingBox: [8, 0, 20, 20],
  orientation: 1,
});

gameProps.wallSocketIn3 = Object.assign({}, gameProps.wallSocketIn0, {
  oY: 245,
  boundingBox: [8, 0, 20, 20],
  orientation: 1,
});

// Currently just for the menu, will gonna do something with it later, I don't like it.
const playerStore = {
  menu: {
    x: 0,
    y: 410,
    stopX: canvasWidth - 200,
    speed: 3,
    animations: {
      walking: {
        width: 34,
        height: 40,
        scale: 5,
        ticksPerAnimationFrame: 8,
        sequence: [2, 3, 4, 3],
      },
      standing: {
       width: 34, 
       height: 40,
       scale: 5,
       ticksPerAnimationFrame: 12,
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
  end: {
    x: 200,
    y: 400,
    boxWidth: 50,
    duration: 0,
    holdTime: 0,
    elapsed: 0,
    scale: 13,
    value: 'Thanks for playing!',
  },
  menu: [{
    x: 260,
    y: 50,
    boxWidth: 50,
    duration: 50,
    holdTime: 0,
    elapsed: 0,
    scale: 7,
    value: 'Misconnected',
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
      duration: 500,
      scale: 2,
      value: `Welcome to Misconnected!\n\nYou can use arrows to\nmove around.\nPress spacebar to interact with\nthings you encounter.\n\nSee those wireframey things?\n
Those are ceiling hooks.\nYou can use them to turn your\ncable 90 degrees!\n\nUse them to get the plugs to\nthe sockets.\nBut remember!\nThey are color coded, so you
need to plan them accordingly!\n\n\nJust a tip: cables cannot cross\nand you can only use\nthe same hook once!\n\nWhen you are finished placing\ncables: pull the power switch.\n\n\nGood luck and have fun!\n
\n\n\n\nMute music with M.`,
    }]
};

const store = {
  lastTime: Date.now(),
  keys: {},
  grid: new Grid(10, 100),
  player: new Player(500, 300),
  cables: [],
  audio: null,
  music: true,
  game: {
    phase: '',
    tick: 0,
    fpsInterval: getFps(60),
    blackout: false,
    level: 2,
  },
  transition: {
    active: false,
    tick: 0,
    type: 'fadeIn',
    fade: false,
  },
}

// The pure magic of key bindings, will most likely stay as is.
const keyset = {
  // Spacebar
  32: {
    press: () => {
      if (store.game.phase == 'menu') {
        nextLevel(() => {
          store.grid = new Grid(10, 100);

          store.grid.cells[5][3].prop = Object.assign({}, gameProps.serverMachineTop1);
          store.grid.cells[5][4].prop = Object.assign({}, gameProps.serverMachineBottom1);
          store.grid.cells[6][3].prop = Object.assign({}, gameProps.serverMachineTop1);
          store.grid.cells[6][4].prop = Object.assign({}, gameProps.serverMachineBottom1);
          store.grid.cells[7][3].prop = Object.assign({}, gameProps.serverMachineTop1);
          store.grid.cells[7][4].prop = Object.assign({}, gameProps.serverMachineBottom1);
          store.grid.cells[8][3].prop = Object.assign({}, gameProps.serverMachineTop1);
          store.grid.cells[8][4].prop = Object.assign({}, gameProps.serverMachineBottom1);
          store.grid.cells[5][6].prop = Object.assign({}, gameProps.cableHook);
          store.grid.cells[9][6].prop = Object.assign({}, gameProps.cableHook);
          store.grid.cells[5][9].prop = Object.assign({}, gameProps.wallPlugIn0);
          store.grid.cells[9][0].prop = Object.assign({}, gameProps.wallSocketOut1);
          store.grid.cells[7][9].prop = Object.assign({}, gameProps.powerSwitch);
          store.grid.collidableCells.push(store.grid.cells[5][4]);
          store.grid.collidableCells.push(store.grid.cells[6][4]);
          store.grid.collidableCells.push(store.grid.cells[7][4]);
          store.grid.collidableCells.push(store.grid.cells[8][4]);
          store.grid.collidableCells.push(store.grid.cells[5][9]);
          store.grid.collidableCells.push(store.grid.cells[9][0]);
          store.grid.collidableCells.push(store.grid.cells[7][9]);

          store.game.phase = 'game';
          store.game.level = 0;
        });
      }

      if (store.game.phase == 'game') {
        const cell = store.grid.cells[((store.player.x + store.player.boundingBox[2] / 2) / store.grid.cellSize) | 0][((store.player.y + store.player.boundingBox[3] / 2) / store.grid.cellSize) | 0];

        if (cell !== undefined && cell.prop) {
          if (cell.prop.type == 'plugIn' && store.player.cable == undefined) {
            cell.prop = Object.assign({}, gameProps.wallPlugOut0, { color: cell.prop.color });
            const cable = new Cable([cell.x * cell.size + 50, cell.y * cell.size + 80], cell.prop.color);
            cable.isPickedUp = true;
            cable.disabledAxis = cell.prop.orientation = 0 || 1 ? 1 : 0;

            store.player.cable = cable;
          }

          if (cell.prop.type == 'hook' && store.player.cable !== undefined) {
            if (!cell.prop.connected) {
              store.player.cable.points.push([cell.x * cell.size + 50, cell.y * cell.size + 45]);
              store.player.cable.disabledAxis = store.player.cable.disabledAxis == 0 ? 1 : 0;
              cell.prop.connected = true;
            } else {
              store.player.cable.points.splice(store.player.cable.points.indexOf([cell.x * cell.size + 50, cell.y * cell.size + 45]), 1);
              store.player.cable.disabledAxis = store.player.cable.disabledAxis == 0 ? 1 : 0;
              cell.prop.connected = false;
            }
          }
          
          if (cell.prop.type == 'socketOut' && store.player.cable !== undefined) {
            if (cell.prop.color == store.player.cable.color) {
              cell.prop = Object.assign({}, Object.values(gameProps).find(x => x.oY == cell.prop.oY && x.oX !== cell.prop.oX), {color: cell.prop.color });
            
              if (cell.prop.orientation == 1) {
                store.player.cable.points.push([cell.x * cell.size + 50, cell.y * cell.size + 70]);
              } else {
                store.player.cable.points.push([cell.x * cell.size + 50, cell.y * cell.size + 45]);
              }
              
              store.player.cable.isPickedUp = false;
              store.cables.push(store.player.cable);
              store.player.cable = undefined;
            }
          }

          if (cell.prop.type == 'switch') {
            let isComplete = true;
            store.grid.cells.forEach(column => {
              column.forEach(cell => {
                if (cell.prop && cell.prop.type == 'socketOut') {

                  isComplete = false;
                } 
              });
            });

            if (isComplete) {
              store.game.blackout = false;
              
              if (store.game.level == 0) {
                nextLevel(() => {
                  store.grid = new Grid(10, 100);
                  store.player = new Player(200, 800);

                  for (let i = 2; i < 8; i++) {
                    store.grid.cells[i][2].prop = Object.assign({}, gameProps.serverMachineTop1);
                    store.grid.cells[i][3].prop = Object.assign({}, gameProps.serverMachineBottom1);
                    store.grid.cells[i][5].prop = Object.assign({}, gameProps.serverMachineTop1);
                    store.grid.cells[i][6].prop = Object.assign({}, gameProps.serverMachineBottom1);

                    store.grid.collidableCells.push(store.grid.cells[i][3]);
                    store.grid.collidableCells.push(store.grid.cells[i][6]);
                  }

                  store.grid.cells[0][4].prop = Object.assign({}, gameProps.cableHook);
                  store.grid.cells[9][4].prop = Object.assign({}, gameProps.cableHook);
                  store.grid.cells[9][8].prop = Object.assign({}, gameProps.cableHook);
                  store.grid.cells[5][8].prop = Object.assign({}, gameProps.cableHook);
                  store.grid.cells[0][9].prop = Object.assign({}, gameProps.wallPlugIn0, { color: '#264cc4'});
                  store.grid.cells[5][9].prop = Object.assign({}, gameProps.wallSocketOut0, { color: '#264cc4'});
                  store.grid.cells[7][9].prop = Object.assign({}, gameProps.powerSwitch);

                  store.grid.collidableCells.push(store.grid.cells[0][9]);
                  store.grid.collidableCells.push(store.grid.cells[5][9]);
                  store.grid.collidableCells.push(store.grid.cells[7][9]);

                  store.game.level = 1;
                });
              }

              if (store.game.level == 1) {
                nextLevel(() => {
                  store.grid = new Grid(10, 100);
                  store.player = new Player(200, 800);

                  for (let i = 0; i < 10; i++) {
                    if (i % 2) {
                      store.grid.cells[i][3].prop = Object.assign({}, gameProps.serverMachineTop1);
                      store.grid.cells[i][4].prop = Object.assign({}, gameProps.serverMachineBottom1);

                      store.grid.cells[i][6].prop = Object.assign({}, gameProps.serverMachineTop1);
                      store.grid.cells[i][7].prop = Object.assign({}, gameProps.serverMachineBottom1);

                      store.grid.collidableCells.push(store.grid.cells[i][4]);
                      store.grid.collidableCells.push(store.grid.cells[i][7]);                      
                    }                    
                  }

                  store.grid.cells[0][9].prop = Object.assign({}, gameProps.wallPlugIn0);
                  store.grid.cells[4][9].prop = Object.assign({}, gameProps.wallPlugIn0, { color: '#264cc4'});
                  store.grid.cells[8][9].prop = Object.assign({}, gameProps.wallPlugIn0, { color: '#0ea821'});
                  
                  store.grid.cells[0][0].prop = Object.assign({}, gameProps.wallSocketOut1);
                  store.grid.cells[4][0].prop = Object.assign({}, gameProps.wallSocketOut1, { color: '#264cc4'});
                  store.grid.cells[6][0].prop = Object.assign({}, gameProps.powerSwitch);
                  store.grid.cells[8][0].prop = Object.assign({}, gameProps.wallSocketOut1, { color: '#0ea821'});
                  store.grid.collidableCells.push(store.grid.cells[0][9]);
                  store.grid.collidableCells.push(store.grid.cells[4][9]);
                  store.grid.collidableCells.push(store.grid.cells[8][9]);

                  store.game.level = 2;
                });
              }
            } else {
              store.game.blackout = true;
            }

            if (store.game.level == 2) {
              nextLevel(() => {
                store.grid = new Grid(10, 100);
                store.player = new Player(200, 800);

                for (let i = 0; i <= 9; i++) {
                  store.grid.cells[i][3].prop = Object.assign({}, gameProps.serverMachineTop1);
                  store.grid.cells[i][4].prop = Object.assign({}, gameProps.serverMachineBottom1);
                  store.grid.collidableCells.push(store.grid.cells[i][4]);
                }

                  store.grid.cells[1][9].prop = Object.assign({}, gameProps.wallPlugIn0, { color: '#264cc4'});
                  store.grid.cells[3][9].prop = Object.assign({}, gameProps.wallPlugIn0, { color: '#0ea821'});
                  store.grid.collidableCells.push(store.grid.cells[1][9]);
                  store.grid.collidableCells.push(store.grid.cells[3][9]);

                  store.grid.cells[6][9].prop = Object.assign({}, gameProps.wallSocketOut0, { color: '#0ea821'});
                  store.grid.cells[8][9].prop = Object.assign({}, gameProps.wallSocketOut0, { color: '#264cc4'});
                  store.grid.collidableCells.push(store.grid.cells[6][9]);
                  store.grid.collidableCells.push(store.grid.cells[8][9]);

                  store.grid.cells[3][7].prop = Object.assign({}, gameProps.cableHook);
                  store.grid.cells[6][7].prop = Object.assign({}, gameProps.cableHook);

                  store.grid.cells[1][5].prop = Object.assign({}, gameProps.cableHook);
                  store.grid.cells[8][5].prop = Object.assign({}, gameProps.cableHook);

                  store.grid.cells[5][9].prop = Object.assign({}, gameProps.powerSwitch);

                  store.game.level = 3;
              });
            }

            if (store.game.level == 3) {
              nextLevel(() => {
                store.game.phase = 'end';
              });
            }
          }
        }
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
      store.player.move(2);
      if (!(store.keys[38] || store.keys[40])) {
        store.player.orientation = 2; 
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
      store.player.move(0);
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
      store.player.move(3);
      if (!(store.keys[38] || store.keys[40])) {
        store.player.orientation = 3; 
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
      store.player.move(1);
    },
    release: () => {
      store.player.activeAnimation = playerAnimations.standing;
    },
  },

  77: {
    press: () => {
      if (store.music) {
        store.audio.pause();
      } else {
        store.audio.play();
      }
    },
    hold: () => {},
    release: () => {},
  }
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
store.game.phase = 'menu';

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
    if (store.game.phase == 'menu') {
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

      store.game.tick++;
    }

    // # TUTORIAL ----------------------------------------------------------
    if (store.game.phase == 'end') {
      context.fillStyle = '#2b75a0';
      context.fillRect(0, 0, canvasWidth, canvasHeight);

    }

    if (store.game.phase == 'game') {

      store.grid.render(); 

      if (store.game.level == 0) {
        // Draw tutorial textbox
        context.strokeStyle = '#0f4666';
        context.lineWidth = 8;
        context.fillStyle = '#2b75a0';
        context.fillRect(20, 20, 400, canvasHeight - 40);
        context.strokeRect(20, 20, 400, canvasHeight - 40);

        writeText(text.tutorial[0], true);             
      }
    }

    if (store.transition.active && store.transition.type == 'fadeIn') {
      const transitionAlpha = 0.02 * store.transition.tick;
      context.fillStyle = `rgba(200, 200, 200, ${transitionAlpha})`;
      context.fillRect(0, 0, canvasWidth, canvasHeight);

      store.transition.tick++;

      if (transitionAlpha == 1) {
        store.transition.tick = 0;
        store.transition.fade = true;
        store.transition.type = 'fadeOut';
      }
    }

    if (store.transition.active && store.transition.type == 'fadeOut') {
      const transitionAlpha = 1 - 0.02 * store.transition.tick;
      context.fillStyle = `rgba(200, 200, 200, ${transitionAlpha})`;
      context.fillRect(0, 0, canvasWidth, canvasHeight);

      store.transition.tick++;

      if (transitionAlpha == 0) {
        store.transition.tick = 0;
        store.transition.fade = false;
        store.transition.active = false;
        store.transition.type = 'fadeIn';
      }
    }
  }
}

function nextLevel(load) {
  store.transition.active = true;
  setTimeout(() => {
    store.cables = [];
    load();
  }, 850);
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

  context.drawImage(sprites, spriteOx, spriteOy, 5, 9, x, y, 5 * scale, 9 * scale);
}

/* -*- mode: javascript; tab-width: 4; indent-tabs-mode: nil; -*-
*
* Copyright (c) 2011-2013 Marcus Geelnard
*
* This software is provided 'as-is', without any express or implied
* warranty. In no event will the authors be held liable for any damages
* arising from the use of this software.
*
* Permission is granted to anyone to use this software for any purpose,
* including commercial applications, and to alter it and redistribute it
* freely, subject to the following restrictions:
*
* 1. The origin of this software must not be misrepresented; you must not
*    claim that you wrote the original software. If you use this software
*    in a product, an acknowledgment in the product documentation would be
*    appreciated but is not required.
*
* 2. Altered source versions must be plainly marked as such, and must not be
*    misrepresented as being the original software.
*
* 3. This notice may not be removed or altered from any source
*    distribution.
*
*/

var CPlayer = function() {

  //--------------------------------------------------------------------------
  // Private methods
  //--------------------------------------------------------------------------

  // Oscillators
  var osc_sin = function (value) {
      return Math.sin(value * 6.283184);
  };

  var osc_saw = function (value) {
      return 2 * (value % 1) - 1;
  };

  var osc_square = function (value) {
      return (value % 1) < 0.5 ? 1 : -1;
  };

  var osc_tri = function (value) {
      var v2 = (value % 1) * 4;
      if(v2 < 2) return v2 - 1;
      return 3 - v2;
  };

  var getnotefreq = function (n) {
      // 174.61.. / 44100 = 0.003959503758 (F3)
      return 0.003959503758 * Math.pow(2, (n - 128) / 12);
  };

  var createNote = function (instr, n, rowLen) {
      var osc1 = mOscillators[instr.i[0]],
          o1vol = instr.i[1],
          o1xenv = instr.i[3],
          osc2 = mOscillators[instr.i[4]],
          o2vol = instr.i[5],
          o2xenv = instr.i[8],
          noiseVol = instr.i[9],
          attack = instr.i[10] * instr.i[10] * 4,
          sustain = instr.i[11] * instr.i[11] * 4,
          release = instr.i[12] * instr.i[12] * 4,
          releaseInv = 1 / release,
          arp = instr.i[13],
          arpInterval = rowLen * Math.pow(2, 2 - instr.i[14]);

      var noteBuf = new Int32Array(attack + sustain + release);

      // Re-trig oscillators
      var c1 = 0, c2 = 0;

      // Local variables.
      var j, j2, e, t, rsample, o1t, o2t;

      // Generate one note (attack + sustain + release)
      for (j = 0, j2 = 0; j < attack + sustain + release; j++, j2++) {
          if (j2 >= 0) {
              // Switch arpeggio note.
              arp = (arp >> 8) | ((arp & 255) << 4);
              j2 -= arpInterval;

              // Calculate note frequencies for the oscillators
              o1t = getnotefreq(n + (arp & 15) + instr.i[2] - 128);
              o2t = getnotefreq(n + (arp & 15) + instr.i[6] - 128) * (1 + 0.0008 * instr.i[7]);
          }

          // Envelope
          e = 1;
          if (j < attack) {
              e = j / attack;
          } else if (j >= attack + sustain) {
              e -= (j - attack - sustain) * releaseInv;
          }

          // Oscillator 1
          t = o1t;
          if (o1xenv) {
              t *= e * e;
          }
          c1 += t;
          rsample = osc1(c1) * o1vol;

          // Oscillator 2
          t = o2t;
          if (o2xenv) {
              t *= e * e;
          }
          c2 += t;
          rsample += osc2(c2) * o2vol;

          // Noise oscillator
          if (noiseVol) {
              rsample += (2 * Math.random() - 1) * noiseVol;
          }

          // Add to (mono) channel buffer
          noteBuf[j] = (80 * rsample * e) | 0;
      }

      return noteBuf;
  };


  //--------------------------------------------------------------------------
  // Private members
  //--------------------------------------------------------------------------

  // Array of oscillator functions
  var mOscillators = [
      osc_sin,
      osc_square,
      osc_saw,
      osc_tri
  ];

  // Private variables set up by init()
  var mSong, mLastRow, mCurrentCol, mNumWords, mMixBuf;


  //--------------------------------------------------------------------------
  // Initialization
  //--------------------------------------------------------------------------

  this.init = function (song) {
      // Define the song
      mSong = song;

      // Init iteration state variables
      mLastRow = song.endPattern;
      mCurrentCol = 0;

      // Prepare song info
      mNumWords =  song.rowLen * song.patternLen * (mLastRow + 1) * 2;

      // Create work buffer (initially cleared)
      mMixBuf = new Int32Array(mNumWords);
  };


  //--------------------------------------------------------------------------
  // Public methods
  //--------------------------------------------------------------------------

  // Generate audio data for a single track
  this.generate = function () {
      // Local variables
      var i, j, b, p, row, col, n, cp,
          k, t, lfor, e, x, rsample, rowStartSample, f, da;

      // Put performance critical items in local variables
      var chnBuf = new Int32Array(mNumWords),
          instr = mSong.songData[mCurrentCol],
          rowLen = mSong.rowLen,
          patternLen = mSong.patternLen;

      // Clear effect state
      var low = 0, band = 0, high;
      var lsample, filterActive = false;

      // Clear note cache.
      var noteCache = [];

       // Patterns
       for (p = 0; p <= mLastRow; ++p) {
          cp = instr.p[p];

          // Pattern rows
          for (row = 0; row < patternLen; ++row) {
              // Execute effect command.
              var cmdNo = cp ? instr.c[cp - 1].f[row] : 0;
              if (cmdNo) {
                  instr.i[cmdNo - 1] = instr.c[cp - 1].f[row + patternLen] || 0;

                  // Clear the note cache since the instrument has changed.
                  if (cmdNo < 16) {
                      noteCache = [];
                  }
              }

              // Put performance critical instrument properties in local variables
              var oscLFO = mOscillators[instr.i[15]],
                  lfoAmt = instr.i[16] / 512,
                  lfoFreq = Math.pow(2, instr.i[17] - 9) / rowLen,
                  fxLFO = instr.i[18],
                  fxFilter = instr.i[19],
                  fxFreq = instr.i[20] * 43.23529 * 3.141592 / 44100,
                  q = 1 - instr.i[21] / 255,
                  dist = instr.i[22] * 1e-5,
                  drive = instr.i[23] / 32,
                  panAmt = instr.i[24] / 512,
                  panFreq = 6.283184 * Math.pow(2, instr.i[25] - 9) / rowLen,
                  dlyAmt = instr.i[26] / 255,
                  dly = instr.i[27] * rowLen & ~1;  // Must be an even number

              // Calculate start sample number for this row in the pattern
              rowStartSample = (p * patternLen + row) * rowLen;

              // Generate notes for this pattern row
              for (col = 0; col < 4; ++col) {
                  n = cp ? instr.c[cp - 1].n[row + col * patternLen] : 0;
                  if (n) {
                      if (!noteCache[n]) {
                          noteCache[n] = createNote(instr, n, rowLen);
                      }

                      // Copy note from the note cache
                      var noteBuf = noteCache[n];
                      for (j = 0, i = rowStartSample * 2; j < noteBuf.length; j++, i += 2) {
                        chnBuf[i] += noteBuf[j];
                      }
                  }
              }

              // Perform effects for this pattern row
              for (j = 0; j < rowLen; j++) {
                  // Dry mono-sample
                  k = (rowStartSample + j) * 2;
                  rsample = chnBuf[k];

                  // We only do effects if we have some sound input
                  if (rsample || filterActive) {
                      // State variable filter
                      f = fxFreq;
                      if (fxLFO) {
                          f *= oscLFO(lfoFreq * k) * lfoAmt + 0.5;
                      }
                      f = 1.5 * Math.sin(f);
                      low += f * band;
                      high = q * (rsample - band) - low;
                      band += f * high;
                      rsample = fxFilter == 3 ? band : fxFilter == 1 ? high : low;

                      // Distortion
                      if (dist) {
                          rsample *= dist;
                          rsample = rsample < 1 ? rsample > -1 ? osc_sin(rsample*.25) : -1 : 1;
                          rsample /= dist;
                      }

                      // Drive
                      rsample *= drive;

                      // Is the filter active (i.e. still audiable)?
                      filterActive = rsample * rsample > 1e-5;

                      // Panning
                      t = Math.sin(panFreq * k) * panAmt + 0.5;
                      lsample = rsample * (1 - t);
                      rsample *= t;
                  } else {
                      lsample = 0;
                  }

                  // Delay is always done, since it does not need sound input
                  if (k >= dly) {
                      // Left channel = left + right[-p] * t
                      lsample += chnBuf[k-dly+1] * dlyAmt;

                      // Right channel = right + left[-p] * t
                      rsample += chnBuf[k-dly] * dlyAmt;
                  }

                  // Store in stereo channel buffer (needed for the delay effect)
                  chnBuf[k] = lsample | 0;
                  chnBuf[k+1] = rsample | 0;

                  // ...and add to stereo mix buffer
                  mMixBuf[k] += lsample | 0;
                  mMixBuf[k+1] += rsample | 0;
              }
          }
      }

      // Next iteration. Return progress (1.0 == done!).
      mCurrentCol++;
      return mCurrentCol / mSong.numChannels;
  };

  // Create a WAVE formatted Uint8Array from the generated audio data
  this.createWave = function() {
      // Create WAVE header
      var headerLen = 44;
      var l1 = headerLen + mNumWords * 2 - 8;
      var l2 = l1 - 36;
      var wave = new Uint8Array(headerLen + mNumWords * 2);
      wave.set(
          [82,73,70,70,
           l1 & 255,(l1 >> 8) & 255,(l1 >> 16) & 255,(l1 >> 24) & 255,
           87,65,86,69,102,109,116,32,16,0,0,0,1,0,2,0,
           68,172,0,0,16,177,2,0,4,0,16,0,100,97,116,97,
           l2 & 255,(l2 >> 8) & 255,(l2 >> 16) & 255,(l2 >> 24) & 255]
      );

      // Append actual wave data
      for (var i = 0, idx = headerLen; i < mNumWords; ++i) {
          // Note: We clamp here
          var y = mMixBuf[i];
          y = y < -32767 ? -32767 : (y > 32767 ? 32767 : y);
          wave[idx++] = y & 255;
          wave[idx++] = (y >> 8) & 255;
      }

      // Return the WAVE formatted typed array
      return wave;
  };

  // Get n samples of wave data at time t [s]. Wave data in range [-2,2].
  this.getData = function(t, n) {
      var i = 2 * Math.floor(t * 44100);
      var d = new Array(n);
      for (var j = 0; j < 2*n; j += 1) {
          var k = i + j;
          d[j] = t > 0 && k < mMixBuf.length ? mMixBuf[k] / 32768 : 0;
      }
      return d;
  };
};

// This music has been exported by SoundBox. You can use it with
// http://sb.bitsnbites.eu/player-small.js in your own product.

// See http://sb.bitsnbites.eu/demo.html for an example of how to
// use it in a demo.

// Song data
var song = {
  songData: [
    { // Instrument 0
      i: [
      3, // OSC1_WAVEFORM
      194, // OSC1_VOL
      128, // OSC1_SEMI
      0, // OSC1_XENV
      2, // OSC2_WAVEFORM
      198, // OSC2_VOL
      128, // OSC2_SEMI
      6, // OSC2_DETUNE
      0, // OSC2_XENV
      0, // NOISE_VOL
      12, // ENV_ATTACK
      100, // ENV_SUSTAIN
      33, // ENV_RELEASE
      0, // ARP_CHORD
      0, // ARP_SPEED
      0, // LFO_WAVEFORM
      93, // LFO_AMT
      4, // LFO_FREQ
      1, // LFO_FX_FREQ
      2, // FX_FILTER
      109, // FX_FREQ
      86, // FX_RESONANCE
      0, // FX_DIST
      32, // FX_DRIVE
      112, // FX_PAN_AMT
      3, // FX_PAN_FREQ
      61, // FX_DELAY_AMT
      2 // FX_DELAY_TIME
      ],
      // Patterns
      p: [2,2,2,2,2,2,2,2,6,6,6,6,6,6,6,6,6,2,2,2,2],
      // Columns
      c: [
        {n: [],
          f: []},
        {n: [,125,,,,149,,,147,,,,149,,,,142,,,,144,,142,,144,,147],
          f: [,12,,,12,,,12,,,,12,,,,,,,,,12,,,,,,,,,,,,,48,,,39,,,41,,,,39,,,,,,,,,33]},
        {n: [],
          f: []},
        {n: [],
          f: []},
        {n: [],
          f: []},
        {n: [,125,,125,,149,149,,147,147,,,149,149,,,142,,142,,144,144,142,142,144,144,147,147],
          f: []}
      ]
    },
    { // Instrument 1
      i: [
      0, // OSC1_WAVEFORM
      255, // OSC1_VOL
      138, // OSC1_SEMI
      1, // OSC1_XENV
      0, // OSC2_WAVEFORM
      255, // OSC2_VOL
      92, // OSC2_SEMI
      0, // OSC2_DETUNE
      1, // OSC2_XENV
      14, // NOISE_VOL
      4, // ENV_ATTACK
      6, // ENV_SUSTAIN
      45, // ENV_RELEASE
      0, // ARP_CHORD
      0, // ARP_SPEED
      0, // LFO_WAVEFORM
      0, // LFO_AMT
      0, // LFO_FREQ
      0, // LFO_FX_FREQ
      2, // FX_FILTER
      9, // FX_FREQ
      81, // FX_RESONANCE
      0, // FX_DIST
      45, // FX_DRIVE
      88, // FX_PAN_AMT
      0, // FX_PAN_FREQ
      31, // FX_DELAY_AMT
      1 // FX_DELAY_TIME
      ],
      // Patterns
      p: [,,,,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
      // Columns
      c: [
        {n: [],
          f: []},
        {n: [],
          f: []},
        {n: [,125,,,,,,,,135,,,,,,,,125,,,,,,,,135],
          f: []}
      ]
    },
    { // Instrument 2
      i: [
      3, // OSC1_WAVEFORM
      100, // OSC1_VOL
      128, // OSC1_SEMI
      0, // OSC1_XENV
      3, // OSC2_WAVEFORM
      201, // OSC2_VOL
      128, // OSC2_SEMI
      2, // OSC2_DETUNE
      0, // OSC2_XENV
      0, // NOISE_VOL
      0, // ENV_ATTACK
      6, // ENV_SUSTAIN
      49, // ENV_RELEASE
      0, // ARP_CHORD
      0, // ARP_SPEED
      0, // LFO_WAVEFORM
      139, // LFO_AMT
      4, // LFO_FREQ
      1, // LFO_FX_FREQ
      3, // FX_FILTER
      30, // FX_FREQ
      184, // FX_RESONANCE
      119, // FX_DIST
      27, // FX_DRIVE
      147, // FX_PAN_AMT
      6, // FX_PAN_FREQ
      0, // FX_DELAY_AMT
      6 // FX_DELAY_TIME
      ],
      // Patterns
      p: [,,,,,,,,4,4,4,4,4,4,4,4,4],
      // Columns
      c: [
        {n: [],
          f: []},
        {n: [],
          f: []},
        {n: [],
          f: []},
        {n: [,149,,,,149,,,,149,,,,149,,,,149,,,,149,,,,149,,,,149],
          f: []}
      ]
    },
    { // Instrument 3
      i: [
      2, // OSC1_WAVEFORM
      100, // OSC1_VOL
      128, // OSC1_SEMI
      0, // OSC1_XENV
      3, // OSC2_WAVEFORM
      201, // OSC2_VOL
      128, // OSC2_SEMI
      0, // OSC2_DETUNE
      0, // OSC2_XENV
      0, // NOISE_VOL
      76, // ENV_ATTACK
      6, // ENV_SUSTAIN
      58, // ENV_RELEASE
      0, // ARP_CHORD
      0, // ARP_SPEED
      0, // LFO_WAVEFORM
      195, // LFO_AMT
      6, // LFO_FREQ
      1, // LFO_FX_FREQ
      3, // FX_FILTER
      1, // FX_FREQ
      141, // FX_RESONANCE
      34, // FX_DIST
      95, // FX_DRIVE
      43, // FX_PAN_AMT
      2, // FX_PAN_FREQ
      121, // FX_DELAY_AMT
      6 // FX_DELAY_TIME
      ],
      // Patterns
      p: [,,,,,,,,5,5,5,5,5,5,5,5,5],
      // Columns
      c: [
        {n: [],
          f: []},
        {n: [],
          f: []},
        {n: [],
          f: []},
        {n: [],
          f: []},
        {n: [,152,,152,,152,,152,,152,,152,,152,,152,,152,,152,,152,,152,,152,,152,,152,,152],
          f: []}
      ]
    },
  ],
  rowLen: 4410,   // In sample lengths
  patternLen: 32,  // Rows per pattern
  endPattern: 20,  // End pattern
  numChannels: 4  // Number of channels
};

// Run after resources have loaded
sprites.onload = () => {
  const player = new CPlayer();
  player.init(song);
  var done = false;
  player.generate();

  setTimeout(() => {
      var wave = player.createWave();
      store.audio = document.createElement("audio");
      store.audio.src = URL.createObjectURL(new Blob([wave], {type: "audio/wav"}));
      store.audio.play();
      animate();
  }, 1000);
}