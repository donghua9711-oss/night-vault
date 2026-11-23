// World state and the per-frame simulation step that ties every system together.
import { buildLevel } from './level.js';
import { createGuard, stepGuard, distractGuards } from './guards.js';
import { createCamera, stepCamera, cameraSees, laserIsOn } from './cameras.js';
import { createAlarm, stepAlarm, tripLaser } from './alarm.js';
import { moveCircle } from './movement.js';
import { inputVector } from './input.js';
import { PLAYER_RADIUS, PLAYER_SPEED, PLAYER_SNEAK_SPEED, DISK_HOLD_SECONDS, LASER_HIT, COIN_STOCK } from './config.js';
export function createWorld() {
  const level = buildLevel();
  return {
    level,
    player: { x: level.playerStart.x, y: level.playerStart.y, facing: 0 },
    guards: level.guardRoutes.map((route, i) => createGuard(route, i)),
    cameras: level.cameraSpots.map(createCamera),
    alarm: createAlarm(),
    phase: 'title', paused: false, elapsed: 0, coins: COIN_STOCK,
    coin: null, diskProgress: 0, hasDisk: false, lootCount: 0,
    nearMissCount: 0, nearMissesTick: null, winTime: 0, grade: '', wireCooldown: 0,
  };
}
export function playerInShadow(world) {
  return world.level.shadowZones.some((z) => world.player.x > z.x && world.player.x < z.x + z.w && world.player.y > z.y && world.player.y < z.y + z.h);
}
export function computeGrade(world) {
  if (world.nearMissCount === 0 && world.lootCount >= 3) return 'GHOST';
  if (world.nearMissCount <= 2) return 'SHADOW';
  if (world.nearMissCount <= 5) return 'PROWLER';
  return 'CAT BURGLAR';
}
export function throwCoin(world, x, y) {
  if (world.phase !== 'play' || world.coins <= 0) return false;
  world.coins -= 1;
  world.coin = { x, y, life: 3.2 };
  distractGuards(world.guards, world.coin);
  return true;
}
export function stepWorld(world, input, dt) {
  if (world.phase !== 'play' || world.paused) return;
  world.elapsed += dt;
  const vec = inputVector(input.keys);
  const sneak = input.keys.has('ShiftLeft') || input.keys.has('ShiftRight');
  const speed = sneak ? PLAYER_SNEAK_SPEED : PLAYER_SPEED;
  if (vec.moving) {
    moveCircle(world.player, vec.x * speed * dt, vec.y * speed * dt, PLAYER_RADIUS, world.level.blockers);
    world.player.facing = Math.atan2(vec.y, vec.x);
  }
  let guardVis = null;
  for (const guard of world.guards) {
    const vis = stepGuard(world, guard, dt);
    if (vis === 'clear') guardVis = 'clear';
    else if (vis === 'faint' && !guardVis) guardVis = 'faint';
  }
  let camVis = null;
  for (const cam of world.cameras) {
    stepCamera(cam, world.elapsed);
    const vis = cameraSees(cam, world.player, world.level.blockers);
    if (vis) camVis = vis;
  }
  // Deep shadow swallows a faint sighting: cover is a real tool, not decoration.
  if (guardVis === 'faint' && playerInShadow(world)) guardVis = null;
  if (camVis === 'faint' && playerInShadow(world)) camVis = null;
  world.alarm.seenByGuard = guardVis;
  world.alarm.seenByCamera = Boolean(camVis);
  world.wireCooldown = Math.max(0, world.wireCooldown - dt);
  const wire = world.level.tripwire;
  const onWire = Math.abs(world.player.y - wire.y) < 9 && world.player.x > wire.x && world.player.x < wire.x2;
  if (onWire && world.wireCooldown <= 0) {
    world.alarm.value = Math.min(100, world.alarm.value + 18);
    world.wireCooldown = 2.5; world.nearMissCount += 1;
  }
  const fastLasers = world.hasDisk;
  const gate = world.level.laserGate;
  const crossedLaser = Math.abs(world.player.x - gate.x) < 12 && world.player.y > gate.y && world.player.y < gate.y2;
  if (crossedLaser && laserIsOn(world.elapsed, fastLasers)) {
    if (tripLaser(world.alarm, LASER_HIT)) world.nearMissCount += 1;
  }
  const gate2 = world.level.laserGate2;
  const crossedLaser2 = Math.abs(world.player.x - gate2.x) < 12 && world.player.y > gate2.y && world.player.y < gate2.y2;
  if (crossedLaser2 && laserIsOn(world.elapsed + 1.1, fastLasers)) {
    if (tripLaser(world.alarm, LASER_HIT)) world.nearMissCount += 1;
  }
  if (stepAlarm(world.alarm, dt, world.elapsed)) { world.phase = 'caught'; return; }
  for (const loot of world.level.loots) {
    if (!loot.taken && Math.hypot(world.player.x - loot.x, world.player.y - loot.y) < 26) {
      loot.taken = true; world.lootCount += 1;
    }
  }
  const disk = world.level.sunDisk;
  if (!world.hasDisk && Math.hypot(world.player.x - disk.x, world.player.y - disk.y) < 52) {
    world.diskProgress += dt;
    if (world.diskProgress >= DISK_HOLD_SECONDS) {
      world.hasDisk = true; disk.taken = true;
    }
  } else {
    world.diskProgress = Math.max(0, world.diskProgress - dt * 2);
  }
  if (world.coin) {
    world.coin.life -= dt;
    if (world.coin.life <= 0) world.coin = null;
  }
  if (world.hasDisk) {
    const exit = world.level.exitDoor;
    const nearExit = world.player.x > exit.x - 24 && world.player.x < exit.x + exit.w + 24 && world.player.y > exit.y - 30 && world.player.y < exit.y + exit.h + 10;
    if (nearExit) {
      world.phase = 'won'; world.winTime = world.elapsed; world.grade = computeGrade(world);
    }
  }
}
