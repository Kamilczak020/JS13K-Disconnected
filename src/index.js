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
const ctx = canvas.getContext('2d');
// game state (not including player)
const store = {
  phase: '',
}

// # EVENT_HOOKS
canvas.addEventListener('click', (event) => {

});

// # GAME_INIT
// For dummies - those props set the canvas virtual resolution, not the DOM element size!
const h = canvas.height = 600;
const w = canvas.width = 600;
store.phase = 'start';

ctx.fillStyle = '#53e0bd';
ctx.fillRect(0, 0, w, h);
