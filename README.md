# JS13K-Disconnected
A JS13K Competition Entry Game. Absolute Work-in-progress.

## TODO, or in other words, the gameplan.
 - [ ] Do story / dialogues
 - [ ] Develop game board / grid, plan out movement (fluid / rigid to grid)
 - [ ] Create game phase sprites
 - [ ] Implement base game mechanics
 - [ ] Create tutorial
 - [ ] Create level builder 
 - [ ] Implement score, scoreboard, timer?
 - [ ] Golf it! (into separate file plz)

## Storytime!
You know that feeling, when you are sitting in front of your PC (ok, just for the sake of peace of mind) or console,
mindlessly clicking around, opening and closing applications while popping in and out of reddit? 

That feeling, when you just can't decide what exactly you want to do / play?

Yeah. Annoying. I know.

But then, out of the corner of your eye, you spot that one game.

Yes. The one game, whose sight instantly rejoices you, as you already know that this is the thing you've been looking for the whole time.

You eagerly click the icon twice. (I know, it's not 1990, y'all don't have icons and use search. I like my icons, m'kay? anyways...)

The loading screen!

As soon as you see the menu, you start the game...

No.. No... NO! NO INTERNET? SERIOUSLY?

The rage pretty much enveloped you right there. But fear not! We are here to save the net. Literally.

The goal of this game is for you to fix the thing that frustrates us the most. You will fix the internet!

## Changes after dev phase

### .html
no html/head/body, just:
 - meta favicon tag
 - inline style tag
 - canvas
 - possible additional visual html
 - script for JS

### .js
 - the canvas will be referenced directly by id, no need to define it

## Why webpack, why seperate stylesheet, why import css into the js? It doesn't make sense!
All of that has been done solely to ease the development experience by as much as possible.
If you are like me, you do not like to have to refresh things everytime you make changes to your code.

Hence, everything (but the images) refreshes by itself as long as webpack dev server is running, making the process smooth and painless.
Compression and minification is there to give you a preview of what is the approximate zip size as of now. In reality, it will get smaller than that by a notch.

Do note, however, that this is absolutely not the final state of things.
In the end, everything will be manually put through appropriate minifiers and compressors (Closure, tinypng, JSCrush / Packer) , to reduce the size to the minimum.
