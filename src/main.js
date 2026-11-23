// Entry point: wires input, simulation and rendering into the game loop.
import { createWorld, stepWorld, throwCoin } from './world.js';
import { createInput } from './input.js';
import { renderGame } from './render.js';
import { applyShot, readShotRequest } from './shots.js';
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let world = createWorld();
const shotName = readShotRequest();
if (shotName) applyShot(world, shotName);
function restart() {
  world = createWorld();
  world.phase = 'play';
}
const input = createInput(canvas, (x, y) => throwCoin(world, x, y), (code) => {
  if (code === 'KeyP' && world.phase === 'play') world.paused = !world.paused;
  if ((code === 'Space' || code === 'Enter')) {
    if (world.phase === 'title') world.phase = 'play';
    else if (world.phase === 'won' || world.phase === 'caught') restart();
  }
});
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!shotName) stepWorld(world, input, dt);
  else if (shotName === 'alarm') { world.cameras[1].facing = Math.atan2(world.player.y - world.cameras[1].y, world.player.x - world.cameras[1].x); }
  renderGame(ctx, world);
  const status = document.getElementById('status');
  if (status) status.textContent = world.phase + ' alarm ' + Math.round(world.alarm.value);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
