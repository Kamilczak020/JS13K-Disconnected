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
  const width = canvas.width = 2000;
  const height = canvas.height = 2000;

  context.fillStyle = '#54b3a4';
  context.fillRect(0, 0, width, height);

  context.fillStyle = 'black';
  context.font = '70px Arial';
  context.fillText("Multiplayer", 800, 1000)
}

drawMenu();