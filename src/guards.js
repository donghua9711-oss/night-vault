// Guard brains: patrol waypoints, stare, suspicion, investigation and chase.
import { GUARD_SPEED, GUARD_CHASE_SPEED, GUARD_VIEW_DIST, GUARD_VIEW_HALF } from './config.js';
import { coneVisibility } from './vision.js';
import { moveToward } from './movement.js';
export function createGuard(route, index) {
  const start = route[index % route.length];
  return {
    x: start.x, y: start.y, facing: index * 1.3, route,
    wp: (index + 1) % route.length, mood: 'patrol',
    suspicion: 0, stareTime: 0, investigate: null, investigateTime: 0,
    lastSeen: null, radius: 14,
  };
}
export function guardMoodFromSuspicion(suspicion, seeing) {
  if (seeing === 'clear' && suspicion >= 55) return 'hunt';
  if (suspicion >= 18) return 'suspicious';
  return 'patrol';
}
export function stepGuard(guard, world, dt) {
  const vis = coneVisibility(guard, world.player, GUARD_VIEW_DIST, GUARD_VIEW_HALF, world.level.blockers);
  if (vis === 'clear') guard.suspicion = Math.min(100, guard.suspicion + 62 * dt);
  else if (vis === 'faint') guard.suspicion = Math.min(100, guard.suspicion + 24 * dt);
  else guard.suspicion = Math.max(0, guard.suspicion - 16 * dt);
  if (vis) { guard.lastSeen = { x: world.player.x, y: world.player.y }; world.nearMissesTick = vis; }
  const wasSuspicious = guard.mood === 'suspicious' || guard.mood === 'hunt';
  guard.mood = guardMoodFromSuspicion(guard.suspicion, vis);
  if (guard.mood === 'suspicious' && !wasSuspicious) world.nearMissCount += 1;
  // A hot alarm makes every guard move faster: pressure rises with the meter.
  const boost = world.alarm && world.alarm.value >= 60 ? 1.35 : 1;
  if (guard.investigate) {
    guard.investigateTime -= dt;
    if (moveToward(guard, guard.investigate.x, guard.investigate.y, GUARD_SPEED * boost, dt, world.level.blockers, guard.radius) || guard.investigateTime <= 0) {
      guard.stareTime += dt;
      if (guard.stareTime > 1.4) { guard.investigate = null; guard.stareTime = 0; }
    }
    return vis;
  }
  if (guard.mood === 'hunt' && guard.lastSeen) {
    moveToward(guard, guard.lastSeen.x, guard.lastSeen.y, GUARD_CHASE_SPEED, dt, world.level.blockers, guard.radius);
    return vis;
  }
  if (guard.mood === 'suspicious' && guard.lastSeen) {
    guard.facing = Math.atan2(guard.lastSeen.y - guard.y, guard.lastSeen.x - guard.x);
    guard.stareTime += dt;
    return vis;
  }
  guard.stareTime = 0;
  const target = guard.route[guard.wp];
  if (moveToward(guard, target.x, target.y, GUARD_SPEED * boost, dt, world.level.blockers, guard.radius)) {
    guard.wp = (guard.wp + 1) % guard.route.length;
  }
  return vis;
}
export function distractGuards(guards, point) {
  for (const g of guards) {
    if (Math.hypot(g.x - point.x, g.y - point.y) < 360) {
      g.investigate = { x: point.x, y: point.y };
      g.investigateTime = 4;
      if (g.mood === 'patrol') g.mood = 'suspicious';
    }
  }
}
