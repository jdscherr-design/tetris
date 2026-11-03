# Brainrot Tetris

Tetris, narrated by your last brain cell. Plain HTML, CSS and JavaScript, with nothing to build or install. All sound is synthesized live and all art is drawn in code.

Play it at https://jdscherr-design.github.io/tetris/

## Controls

| Key | Action |
| --- | --- |
| ← → | Move |
| ↓ | Soft drop |
| Space | Hard drop |
| ↑ / X | Rotate right |
| Z | Rotate left |
| C / Shift | Hold |
| P / Esc | Pause |
| R | Restart (while paused or after game over) |
| M | Mute |

Phones and tablets get on-screen buttons.

## Chaos modes

**Normal Brainrot**, **Terminally Online** and **Ohio Final Boss** change the presentation only. The rules and scoring are the same in all three, so jokes like the Fanum Tax never touch your real aura.

## Files

- `game.js`: rules, scoring, rendering, input and settings
- `brainrot.js`: narrator, fake chat, events, background effects and the game-over report
- `audio.js`: synthesized sound effects

## Deploy

GitHub Pages serves the root of the `main` branch, so pushing to `main` publishes the game. Bump the `?v=` numbers in `index.html` when changing the CSS or scripts, so browsers fetch the new files.
