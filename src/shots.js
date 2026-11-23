// Deterministic screenshot staging selected with ?shot=start|play|alarm|end.
export function applyShot(world, name) {
  if (!name) return;
  world.phase = 'play';
  if (name === 'start') {
    world.player.x = 120; world.player.y = 372; world.player.facing = 0;
    world.elapsed = 2;
  } else if (name === 'play') {
    world.player.x = 436; world.player.y = 295; world.player.facing = 0;
    world.elapsed = 9;
    world.guards[0].x = 125; world.guards[0].y = 350;
    world.guards[2].x = 700; world.guards[2].y = 540;
  } else if (name === 'alarm') {
    world.player.x = 600; world.player.y = 190; world.player.facing = -0.64;
    world.elapsed = 26; world.hasDisk = true; world.level.sunDisk.taken = true;
    world.alarm.value = 50; world.lootCount = 3;
    world.level.loots[0].taken = true; world.level.loots[1].taken = true; world.level.loots[2].taken = true;
    world.guards[2].x = 640; world.guards[2].y = 430;
    world.guards[2].mood = 'suspicious'; world.guards[2].suspicion = 40;
  } else if (name === 'end') {
    world.phase = 'won'; world.hasDisk = true; world.level.sunDisk.taken = true;
    world.elapsed = 96; world.winTime = 96; world.lootCount = 4;
    world.nearMissCount = 1; world.grade = 'SHADOW'; world.alarm.value = 22;
  }
}
export function readShotRequest() {
  const params = new URLSearchParams(window.location.search);
  return params.get('shot');
}
