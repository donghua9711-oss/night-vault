// Vision cones: distance, angle and a clear line of sight decide visibility.
export function angleDelta(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const steps = 14;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return true;
  }
  return false;
}
export function hasLineOfSight(x1, y1, x2, y2, blockers) {
  for (const b of blockers) {
    if (segmentHitsRect(x1, y1, x2, y2, b)) return false;
  }
  return true;
}
export function coneVisibility(watcher, target, dist, halfAngle, blockers) {
  const dx = target.x - watcher.x;
  const dy = target.y - watcher.y;
  const d = Math.hypot(dx, dy);
  if (d > dist) return null;
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDelta(ang, watcher.facing)) > halfAngle) return null;
  if (!hasLineOfSight(watcher.x, watcher.y, target.x, target.y, blockers)) return null;
  return d < dist * 0.62 ? 'clear' : 'faint';
}
