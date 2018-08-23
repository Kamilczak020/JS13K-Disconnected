// ############## INFO ###############
// Canvas is 600x600

// Css required only for hot-reload support
const css = require('../style.css');

const canvas = document.getElementById('gamearea');
const context = canvas.getContext('2d');

canvas.addEventListener('click', (event) => {
  const mousePos = getMousePos(event);
  if (store.isMenu) {
    console.log(mousePos);
    if (isMouseInside(mousePos, { x: 550, y: 900, width: 900, height: 150 })) {
      startCutscene();
    }
  }
});

// #############  STORE  #############
const store = {
  isMenu: true,
  canvasWidth: 0,
  canvasHeight: 0,
}

// #######  FUNCTIONS N STUFF  #######
function getMousePos(event) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / 800 * store.canvasWidth,
    y: (event.clientY - rect.top) / 800 * store.canvasHeight
  };
}

function isMouseInside(pos, rect) {
  return pos.x > rect.x && pos.x < rect.x + rect.width &&
         pos.y < rect.y + rect.height && pos.y > rect.y;
}

// #############  MENU  ##############
function start() {
  // For dummies: that's resolution, not DOM element size.
  store.canvasWidth = canvas.width = 2000;
  store.canvasHeight = canvas.height = 2000;

  context.fillStyle = '#54b3a4';
  context.fillRect(0, 0, store.canvasWidth, store.canvasHeight);

  context.fillStyle = '#06614b';
  context.fillRect(550, 900, 900, 150);

  context.fillStyle = 'black';
  context.font = '90px Arial';
  context.fillText("Multiplayer", 780, 1000);

}

// ###########  CUTSCENE  ############
function startCutscene() {
  store.isMenu = false;
  context.clearRect(0, 0, store.canvasWidth, store.canvasHeight);
}

// ###########  LAUNCH!  #############
start();