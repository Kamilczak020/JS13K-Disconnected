// ############## INFO ###############
// Canvas is 600x600

// Css required only for hot-reload support
const css = require('../style.css');

const canvas = document.getElementById('gamearea');
const context = canvas.getContext('2d');

// #############  STORE  #############
const store = {

}

// #############  MENU  ##############
function drawMenu() {
  canvas.width = 2000;
  canvas.height = 2000;

  context.fillStyle = '#54b3a4';
  context.fillRect(0, 0, 2000, 2000);

  context.fillStyle = 'black';
  context.font = '70px Arial';
  context.fillText("Multiplayer", 800, 1000)
}

drawMenu();