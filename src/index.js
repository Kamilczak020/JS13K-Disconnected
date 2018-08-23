/**
 * Game developed by: Kamil Solecki (Sir Greenchill) & Matei Copot (towc)
 * Version: 0.0.2
 * Issued under: MIT LICENSE
 * Created for: JS13K games coding competition, http://js13kgames.com/
 * 
 * Because towc is a VIM madman, we need to give him something to navigate the file with.
 * Introducing - Filemap!
 * 
 * Note: Actual headings in the file are prefixed with an octothorpe "#".
 * ------------------------------------------
 * 
 * GLOBALS
 * 
 * EVENT_HOOKS
 * 
 * GAME_INIT
 * 
 * ------------------------------------------
 * 
 * Storytime!
 * You know that feeling, when you are sitting in front of your PC (ok, just for the sake of peace of mind) or console,
 * mindlessly clicking around, opening and closing applications while popping in and out of reddit? 
 * That feeling, when you just can't decide what exactly you want to do / play?
 * Yeah. Annoying. I know.
 * But then, out of the corner of your eye, you spot that one game.
 * Yes. The one game, whose sight instantly rejoices you, as you already know that this is the thing you've been looking for the whole time.
 * You eagerly click the icon twice. (I know, it's not 1990, y'all don't have icons and use search. I like my icons, m'kay? anyways...)
 * The loading screen!
 * As soon as you see the menu, you start the game...
 * No.. No... NO! NO INTERNET? SERIOUSLY?
 * The rage pretty much enveloped you right there. But fear not! We are here to save the net. Literally.
 * 
 * The goal of this game is for you to fix the thing that frustrates us the most. You will fix the internet!
 */

// Css required only for hot-reload support in the development phase.
const css = require('../style.css');

// #GLOBALS ------------------------------------------
const canvas = document.getElementById('gamearea');
const context = canvas.getContext('2d');
const appStore = {
  canvasHeight: 0,
  canvasWidth: 0,
  state: '',
}

// #EVENT_HOOKS ------------------------------------------
canvas.addEventListener('click', (event) => {

});

// #GAME_INIT ------------------------------------------
// For dummies - those props set the canvas virtual resolution, not the DOM element size!
appStore.canvasHeight = canvas.height = 2000;
appStore.canvasWidth = canvas.width = 2000;
appStore.state = 'menu';

context.fillStyle = '#53e0bd';
context.fillRect(0, 0, appStore.canvasWidth, appStore.canvasHeight);