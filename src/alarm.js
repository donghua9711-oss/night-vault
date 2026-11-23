// Alarm meter logic, kept pure so it can be probed from Node directly.
import { ALARM_MAX, ALARM_GUARD_CLEAR, ALARM_GUARD_FAINT, ALARM_CAMERA, ALARM_DECAY, CAMERA_CALM_SECONDS } from './config.js';
export function createAlarm() {
  return { value: 0, seenByGuard: null, seenByCamera: false, laserCooldown: 0 };
}
export function cameraRate(elapsedSeconds) {
  const calm = elapsedSeconds < CAMERA_CALM_SECONDS ? 0.5 : 1;
  return ALARM_CAMERA * calm;
}
export function stepAlarm(alarm, dt, elapsedSeconds) {
  let delta = 0;
  if (alarm.seenByGuard === 'clear') delta += ALARM_GUARD_CLEAR * dt;
  else if (alarm.seenByGuard === 'faint') delta += ALARM_GUARD_FAINT * dt;
  if (alarm.seenByCamera) delta += cameraRate(elapsedSeconds) * dt;
  if (!alarm.seenByGuard && !alarm.seenByCamera) delta -= ALARM_DECAY * dt;
  alarm.value = Math.max(0, Math.min(ALARM_MAX, alarm.value + delta));
  alarm.laserCooldown = Math.max(0, alarm.laserCooldown - dt);
  return alarm.value >= ALARM_MAX;
}
export function tripLaser(alarm, amount) {
  if (alarm.laserCooldown > 0) return false;
  alarm.value = Math.min(ALARM_MAX, alarm.value + amount);
  alarm.laserCooldown = 1.2;
  return true;
}
export function alarmSegments(value) {
  return Math.round((value / ALARM_MAX) * 10);
}
