// Wall cameras that sweep a narrow sector on a sine rhythm.
import { CAM_VIEW_DIST, CAM_VIEW_HALF } from './config.js';
import { coneVisibility } from './vision.js';
export function createCamera(spot) {
  return { x: spot.x, y: spot.y, base: spot.base, sweep: spot.sweep, phase: spot.phase, facing: spot.base, radius: 10 };
}
export function stepCamera(camera, elapsed) {
  camera.facing = camera.base + Math.sin(elapsed * 0.65 + camera.phase) * camera.sweep;
  return camera.facing;
}
export function cameraSees(camera, player, blockers) {
  return coneVisibility(camera, player, CAM_VIEW_DIST, CAM_VIEW_HALF, blockers);
}
export function laserIsOn(elapsed, fast) {
  const period = fast ? 1.7 : 2.4;
  const onTime = fast ? 1.05 : 1.5;
  return (elapsed % period) < onTime;
}
