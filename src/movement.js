// Circle versus rectangle movement with axis separation for clean sliding.
export function circleHitsRect(cx, cy, radius, r) {
  const nx = Math.max(r.x, Math.min(cx, r.x + r.w));
  const ny = Math.max(r.y, Math.min(cy, r.y + r.h));
  return Math.hypot(cx - nx, cy - ny) < radius;
}
export function moveCircle(entity, dx, dy, radius, blockers) {
  entity.x += dx;
  for (const b of blockers) {
    if (circleHitsRect(entity.x, entity.y, radius, b)) {
      entity.x = dx > 0 ? b.x - radius : b.x + b.w + radius;
    }
  }
  entity.y += dy;
  for (const b of blockers) {
    if (circleHitsRect(entity.x, entity.y, radius, b)) {
      entity.y = dy > 0 ? b.y - radius : b.y + b.h + radius;
    }
  }
  return entity;
}
export function moveToward(entity, tx, ty, speed, dt, blockers, radius) {
  const dx = tx - entity.x;
  const dy = ty - entity.y;
  const d = Math.hypot(dx, dy);
  if (d < 3) return true;
  const step = Math.min(d, speed * dt);
  moveCircle(entity, (dx / d) * step, (dy / d) * step, radius, blockers);
  entity.facing = Math.atan2(dy, dx);
  return d <= step + 2;
}
