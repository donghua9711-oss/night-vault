// Canvas rendering: museum, cones, lasers, actors, HUD and end screens.
import { VIEW_W, VIEW_H, HUD_H, COLORS, GUARD_VIEW_DIST, GUARD_VIEW_HALF, CAM_VIEW_DIST, CAM_VIEW_HALF } from './config.js';
import { alarmSegments } from './alarm.js';
import { laserIsOn } from './cameras.js';
function cone(ctx, x, y, facing, dist, half, fill) {
  // Soft radial falloff: bright at the source, fading at the rim like real light.
  const grad = ctx.createRadialGradient(x, y, 8, x, y, dist);
  grad.addColorStop(0, fill);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.moveTo(x, y);
  ctx.arc(x, y, dist, facing - half, facing + half);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = fill;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(facing - half) * dist, y + Math.sin(facing - half) * dist);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(facing + half) * dist, y + Math.sin(facing + half) * dist);
  ctx.stroke();
}
function drawLootIcon(ctx, loot) {
  const { x, y } = loot;
  ctx.save(); ctx.translate(x, y - 4); ctx.scale(1.9, 1.9);
  if (loot.id === 'mask') {
    ctx.fillStyle = '#3fae7c';
    ctx.beginPath(); ctx.ellipse(0, 0, 8, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0b0d12';
    ctx.beginPath(); ctx.ellipse(-3, -2, 2, 1.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(3, -2, 2, 1.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#0b0d12'; ctx.beginPath(); ctx.arc(0, 3, 3.4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  } else if (loot.id === 'vase') {
    ctx.fillStyle = '#7ab5e8';
    ctx.beginPath();
    ctx.moveTo(-3, -10); ctx.lineTo(3, -10); ctx.lineTo(5, -4); ctx.lineTo(8, 3);
    ctx.quadraticCurveTo(8, 10, 0, 10); ctx.quadraticCurveTo(-8, 10, -8, 3);
    ctx.lineTo(-5, -4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#dcefff'; ctx.fillRect(-3, -6, 6, 2);
  } else if (loot.id === 'gem') {
    ctx.fillStyle = '#e86ab0';
    ctx.beginPath();
    ctx.moveTo(-9, -3); ctx.lineTo(-4, -9); ctx.lineTo(4, -9); ctx.lineTo(9, -3); ctx.lineTo(0, 10);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffd7ef'; ctx.beginPath(); ctx.moveTo(-9, -3); ctx.lineTo(9, -3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-4, -9); ctx.lineTo(0, -3); ctx.lineTo(4, -9); ctx.stroke();
  } else if (loot.id === 'scroll') {
    ctx.fillStyle = '#e8dcc0';
    ctx.fillRect(-10, -5, 18, 10);
    ctx.beginPath(); ctx.ellipse(8, 0, 3.4, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-10, 0, 3.4, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#a33b2e'; ctx.beginPath(); ctx.moveTo(1, -5); ctx.lineTo(1, 5); ctx.stroke();
  } else {
    ctx.fillStyle = '#f5c542';
    ctx.beginPath();
    ctx.moveTo(-10, 8); ctx.lineTo(-10, -6); ctx.lineTo(-5, 0); ctx.lineTo(0, -9);
    ctx.lineTo(5, 0); ctx.lineTo(10, -6); ctx.lineTo(10, 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c22f4a';
    ctx.beginPath(); ctx.arc(0, 3, 2.4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
function drawObjective(ctx, world, t) {
  const pulse = 1 + Math.sin(t * 5) * 0.12;
  if (!world.hasDisk) {
    const d = world.level.sunDisk;
    ctx.strokeStyle = COLORS.gold; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(d.x, d.y, 31 * pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(d.x, d.y, 41 * pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.moveTo(d.x - 8, d.y - 56); ctx.lineTo(d.x + 8, d.y - 56); ctx.lineTo(d.x, d.y - 45);
    ctx.closePath(); ctx.fill();
    // Dark pill behind the label so it stays readable on a shrunk contact sheet.
    ctx.fillStyle = 'rgba(5,6,10,0.82)';
    ctx.fillRect(d.x - 46, d.y - 82, 92, 22);
    ctx.strokeStyle = COLORS.gold; ctx.lineWidth = 1; ctx.strokeRect(d.x - 46, d.y - 82, 92, 22);
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 15px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('SUN DISK', d.x, d.y - 66);
  } else {
    const e = world.level.exitDoor;
    const cx = e.x + 30; const cy = e.y + e.h / 2;
    ctx.strokeStyle = COLORS.safe; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, 34 * pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = COLORS.safe;
    ctx.font = 'bold 16px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('▼ EXIT', cx + 18, cy - 44);
  }
}
function drawHud(ctx, world) {
  ctx.fillStyle = '#0b0d12'; ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = '#f2f3f5'; ctx.font = 'bold 19px system-ui, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('THE NIGHT VAULT', 18, 36);
  ctx.font = '13px system-ui, sans-serif'; ctx.fillStyle = '#aeb6c2';
  ctx.fillText('ALARM', 300, 36);
  const segs = alarmSegments(world.alarm.value);
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = i < segs ? (i < 5 ? COLORS.warn : COLORS.danger) : '#2c3342';
    ctx.fillRect(356 + i * 30, 18, 24, 20);
  }
  ctx.fillStyle = '#f2f3f5'; ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(Math.round(world.alarm.value) + '%', 668, 36);
  ctx.fillText('LOOT ' + world.lootCount + '/5' + (world.hasDisk ? ' + SUN DISK' : ''), 740, 36);
  ctx.fillText('COINS ' + world.coins, 960, 36);
  ctx.fillText('TIME ' + Math.floor(world.elapsed) + 's', 1080, 36);
  if (world.paused) { ctx.fillStyle = COLORS.warn; ctx.fillText('PAUSED', 1180, 36); }
}
export function renderGame(ctx, world) {
  const t = world.elapsed;
  ctx.fillStyle = COLORS.floorA; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Chequered marble tiles across the whole museum floor.
  for (let tx = 44; tx < 1236; tx += 40) {
    for (let ty = 86; ty < 664; ty += 40) {
      if (((tx / 40) + (ty / 40)) % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.045)'; ctx.fillRect(tx, ty, 40, 40);
      }
    }
  }
  ctx.fillStyle = COLORS.floorB; ctx.fillRect(50, 92, 1180, 566);
  ctx.fillStyle = COLORS.vaultFloor; ctx.fillRect(522, 92, 236, 148);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let x = 60; x < 1240; x += 40) ctx.fillRect(x, 86, 1, 578);
  for (let y = 110; y < 660; y += 40) ctx.fillRect(44, y, 1192, 1);
  ctx.font = 'bold 13px system-ui, sans-serif'; ctx.textAlign = 'center';
  for (const label of world.level.roomLabels) { ctx.fillStyle = '#8b95a7'; ctx.fillText(label.text, label.x, label.y); }
  // No filler decoration: every drawn element is part of the game itself.
  // (Rugs, paintings, plants, chandeliers and statues were removed at the
  // owner's call — they read as clutter, not as a museum.)
  // Shadow alcoves: dark cover where a faint sighting is swallowed.
  for (const z of world.level.shadowZones) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(z.x, z.y, z.w, z.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.strokeRect(z.x, z.y, z.w, z.h);
    ctx.fillStyle = '#6b7688'; ctx.font = 'bold 10px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('SHADOW', z.x + z.w / 2, z.y + 16);
  }
  for (const c of world.level.cases) {
    // Exhibit plinth: an oval stone pedestal under a glass dome, not a box.
    const ccx = c.x + c.w / 2; const ccy = c.y + c.h / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(ccx + 3, ccy + 16, 34, 10, 0, 0, Math.PI * 2); ctx.fill();
    const plinth = ctx.createLinearGradient(ccx, ccy + 4, ccx, ccy + 18);
    plinth.addColorStop(0, '#4a5265'); plinth.addColorStop(1, '#232833');
    ctx.fillStyle = plinth;
    ctx.beginPath(); ctx.ellipse(ccx, ccy + 12, 32, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(ccx, ccy + 12, 32, 9, 0, 0, Math.PI * 2); ctx.stroke();
    // Glass dome over the exhibit, with one curved shine streak.
    ctx.fillStyle = 'rgba(160,210,255,0.07)';
    ctx.beginPath(); ctx.arc(ccx, ccy + 10, 28, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(190,225,255,0.55)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(ccx, ccy + 10, 28, Math.PI, 0); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(ccx, ccy + 10, 22, Math.PI * 1.25, Math.PI * 1.55); ctx.stroke();
    // A plinth with no stealable loot holds a decoy exhibit: a grey bust.
    const holdsLoot = world.level.loots.some((l) => Math.abs(l.x - ccx) < 6 && Math.abs(l.y - ccy) < 6);
    if (!holdsLoot) {
      ctx.fillStyle = '#9aa5b5';
      ctx.beginPath(); ctx.arc(ccx, ccy - 8, 6.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(ccx - 10, ccy + 10); ctx.lineTo(ccx - 5, ccy - 2); ctx.lineTo(ccx + 5, ccy - 2); ctx.lineTo(ccx + 10, ccy + 10);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c9a227'; ctx.beginPath(); ctx.arc(ccx, ccy + 3, 2, 0, Math.PI * 2); ctx.fill();
    }
  }
  for (const pl of world.level.pillars) {
    // Structural column in the same panelled style as the walls: a square
    // pier with trim and a gold pinstripe, so it belongs to the building.
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(pl.x + 3, pl.y + 5, pl.w, pl.h);
    ctx.fillStyle = COLORS.wall; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
    ctx.fillStyle = '#2c3345'; ctx.fillRect(pl.x, pl.y, pl.w, 5); ctx.fillRect(pl.x, pl.y + pl.h - 5, pl.w, 5);
    ctx.fillStyle = 'rgba(201,162,39,0.55)'; ctx.fillRect(pl.x, pl.y + pl.h - 8, pl.w, 2);
    ctx.strokeStyle = COLORS.wallEdge; ctx.lineWidth = 1; ctx.strokeRect(pl.x, pl.y, pl.w, pl.h);
    ctx.strokeStyle = 'rgba(201,162,39,0.7)';
    ctx.strokeRect(pl.x + 7, pl.y + 7, pl.w - 14, pl.h - 14);
  }
  // Tripwire stretched across both vault-mouth openings (the centre spine
  // splits the mouth in two), post to post, label on the wider left span.
  const wire = world.level.tripwire;
  ctx.strokeStyle = 'rgba(255,81,71,0.85)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(wire.x, wire.y); ctx.lineTo(625, wire.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(655, wire.y); ctx.lineTo(wire.x2, wire.y); ctx.stroke();
  ctx.fillStyle = '#3a3f4c';
  ctx.fillRect(wire.x - 4, wire.y - 7, 8, 14); ctx.fillRect(wire.x2 - 4, wire.y - 7, 8, 14);
  ctx.fillStyle = COLORS.danger; ctx.font = 'bold 10px system-ui, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('TRIPWIRE', 577, wire.y + 22);
  for (const loot of world.level.loots) {
    if (loot.taken) continue;
    // Each artefact floats over its plinth in a soft glow, with sparkles.
    const glow = ctx.createRadialGradient(loot.x, loot.y - 4, 2, loot.x, loot.y - 4, 27);
    glow.addColorStop(0, 'rgba(120,255,215,0.32)'); glow.addColorStop(1, 'rgba(120,255,215,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(loot.x, loot.y - 4, 27, 0, Math.PI * 2); ctx.fill();
    drawLootIcon(ctx, loot);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.4;
    for (const [sx, sy, ss] of [[-24, -18, 4], [23, -12, 3], [19, 12, 3.4]]) {
      ctx.beginPath();
      ctx.moveTo(loot.x + sx - ss, loot.y + sy); ctx.lineTo(loot.x + sx + ss, loot.y + sy);
      ctx.moveTo(loot.x + sx, loot.y + sy - ss); ctx.lineTo(loot.x + sx, loot.y + sy + ss);
      ctx.stroke();
    }
    // Gold plaque on the plinth front carrying the artefact's name.
    ctx.font = 'bold 10px system-ui, sans-serif'; ctx.textAlign = 'center';
    const label = loot.name.toUpperCase();
    const labelW = ctx.measureText(label).width + 14;
    ctx.fillStyle = '#141007';
    ctx.beginPath(); ctx.roundRect(loot.x - labelW / 2, loot.y + 20, labelW, 15, 4); ctx.fill();
    ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(loot.x - labelW / 2, loot.y + 20, labelW, 15, 4); ctx.stroke();
    ctx.fillStyle = '#ffd873';
    ctx.fillText(label, loot.x, loot.y + 31);
  }
  const gate = world.level.laserGate;
  const gate2 = world.level.laserGate2;
  if (laserIsOn(t + 1.1, world.hasDisk)) {
    ctx.strokeStyle = COLORS.danger; ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const y = gate2.y + i * ((gate2.y2 - gate2.y) / 4);
      ctx.beginPath(); ctx.moveTo(gate2.x - 8, y); ctx.lineTo(gate2.x + 16, y); ctx.stroke();
    }
  }
  if (laserIsOn(t)) {
    ctx.strokeStyle = COLORS.danger; ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const y = gate.y + i * ((gate.y2 - gate.y) / 4);
      ctx.beginPath(); ctx.moveTo(gate.x - 8, y); ctx.lineTo(gate.x + 16, y); ctx.stroke();
    }
    ctx.fillStyle = COLORS.danger; ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText('LASERS', gate.x + 4, gate.y - 10);
  }
  for (const cam of world.cameras) cone(ctx, cam.x, cam.y, cam.facing, CAM_VIEW_DIST, CAM_VIEW_HALF, COLORS.coneCam);
  for (const g of world.guards) {
    const fill = g.mood === 'hunt' ? 'rgba(255,81,71,0.32)' : COLORS.coneGuard;
    cone(ctx, g.x, g.y, g.facing, GUARD_VIEW_DIST, GUARD_VIEW_HALF, fill);
  }
  for (const w of world.level.walls) {
    // Panelled wall: deep body, a pale top trim and a gold pinstripe.
    ctx.fillStyle = COLORS.wall; ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#2c3345';
    if (w.w >= w.h) ctx.fillRect(w.x, w.y, w.w, 4); else ctx.fillRect(w.x, w.y, 4, w.h);
    ctx.fillStyle = 'rgba(201,162,39,0.55)';
    if (w.w >= w.h) ctx.fillRect(w.x, w.y + w.h - 3, w.w, 2); else ctx.fillRect(w.x + w.w - 3, w.y, 2, w.h);
    ctx.strokeStyle = COLORS.wallEdge; ctx.lineWidth = 1; ctx.strokeRect(w.x, w.y, w.w, w.h);
  }
  const disk = world.level.sunDisk;
  // Vault pedestal and ring frame stay visible even after the disk is lifted.
  ctx.fillStyle = '#171208'; ctx.fillRect(disk.x - 38, disk.y - 38, 76, 76);
  ctx.strokeStyle = COLORS.gold; ctx.lineWidth = 2; ctx.strokeRect(disk.x - 38, disk.y - 38, 76, 76);
  ctx.fillStyle = '#241c0c'; ctx.fillRect(disk.x - 16, disk.y + 30, 32, 12);
  if (!disk.taken) {
    // Sun Disk: triangular rays, a radial gold gradient and an engraved face.
    ctx.fillStyle = '#d9a92c';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(disk.x + Math.cos(a - 0.09) * 22, disk.y + Math.sin(a - 0.09) * 22);
      ctx.lineTo(disk.x + Math.cos(a) * 31, disk.y + Math.sin(a) * 31);
      ctx.lineTo(disk.x + Math.cos(a + 0.09) * 22, disk.y + Math.sin(a + 0.09) * 22);
      ctx.closePath(); ctx.fill();
    }
    const diskGrad = ctx.createRadialGradient(disk.x - 6, disk.y - 6, 4, disk.x, disk.y, disk.r);
    diskGrad.addColorStop(0, '#fff0b3'); diskGrad.addColorStop(0.55, COLORS.gold); diskGrad.addColorStop(1, '#c8912a');
    ctx.fillStyle = diskGrad; ctx.beginPath(); ctx.arc(disk.x, disk.y, disk.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a6410'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(disk.x, disk.y, 17, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#8a6410';
    ctx.beginPath(); ctx.arc(disk.x - 5, disk.y - 3, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(disk.x + 5, disk.y - 3, 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a6410'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(disk.x, disk.y + 2, 6, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
  }
  const exit = world.level.exitDoor;
  // Service door in the bottom wall: twin panels, handles, lit EXIT sign above.
  ctx.fillStyle = world.hasDisk ? COLORS.safe : '#39404e';
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 2;
  ctx.strokeRect(exit.x + 5, exit.y + 4, 24, 14); ctx.strokeRect(exit.x + 39, exit.y + 4, 24, 14);
  ctx.fillStyle = '#0b0d12';
  ctx.beginPath(); ctx.arc(exit.x + 30, exit.y + 11, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(exit.x + 38, exit.y + 11, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = world.hasDisk ? COLORS.safe : '#5a2020';
  ctx.fillRect(exit.x + 8, exit.y - 24, 52, 17);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 11px system-ui, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('EXIT', exit.x + 34, exit.y - 11);
  ctx.fillStyle = '#aeb6c2'; ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.fillText('SERVICE DOOR', exit.x + 34, exit.y - 30);
  // Laser emitters at both ends of the vault gate.
  ctx.fillStyle = '#3a3f4c';
  ctx.fillRect(gate.x - 12, gate.y - 12, 32, 14); ctx.fillRect(gate.x - 12, gate.y2 - 2, 32, 14);
  ctx.fillStyle = laserIsOn(t) ? COLORS.danger : '#5a2020';
  ctx.beginPath(); ctx.arc(gate.x + 4, gate.y - 5, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(gate.x + 4, gate.y2 + 5, 4, 0, Math.PI * 2); ctx.fill();
  for (const cam of world.cameras) {
    // Wall-mounted camera: bracket arm, swivelling body, lens and record LED.
    ctx.strokeStyle = '#59637a'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(cam.x, cam.y - 16); ctx.lineTo(cam.x, cam.y - 4); ctx.stroke();
    ctx.fillStyle = '#59637a'; ctx.fillRect(cam.x - 10, cam.y - 20, 20, 6);
    ctx.save(); ctx.translate(cam.x, cam.y); ctx.rotate(cam.facing - Math.PI / 2);
    ctx.fillStyle = '#2a3040'; ctx.fillRect(-11, -8, 22, 24);
    ctx.strokeStyle = '#50aaff'; ctx.lineWidth = 2; ctx.strokeRect(-11, -8, 22, 24);
    ctx.fillStyle = '#39415a'; ctx.fillRect(-11, 8, 22, 8);
    const lensGrad = ctx.createRadialGradient(0, 18, 1, 0, 18, 7);
    lensGrad.addColorStop(0, '#cfe8ff'); lensGrad.addColorStop(0.5, '#50aaff'); lensGrad.addColorStop(1, '#0d2c4a');
    ctx.fillStyle = lensGrad; ctx.beginPath(); ctx.arc(0, 18, 6.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-2, 16, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = Math.sin(t * 4) > 0 ? '#ff5147' : '#5a2020';
    ctx.beginPath(); ctx.arc(cam.x + 14, cam.y - 12, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9fd0ff'; ctx.font = 'bold 10px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('CAMERA', cam.x, cam.y + 42);
  }
  if (world.coin) {
    ctx.fillStyle = COLORS.gold; ctx.beginPath(); ctx.arc(world.coin.x, world.coin.y, 7, 0, Math.PI * 2); ctx.fill();
  }
  for (const g of world.guards) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(g.x + 3, g.y + 5, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
    // A proper little character, drawn facing his heading: shoulders and arms,
    // a belted navy uniform, head with a peaked cap, and a torch in his hand.
    ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.facing);
    ctx.fillStyle = g.mood === 'hunt' ? '#a3271f' : '#27406e';
    ctx.beginPath(); ctx.ellipse(0, 0, 15, 12.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#101623'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = g.mood === 'hunt' ? '#7e1d16' : '#1d3050';
    ctx.beginPath(); ctx.arc(-3, -11, 5.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-3, 11, 5.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8c39a';
    ctx.beginPath(); ctx.arc(6, -11.5, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(13, 10, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#14161c'; ctx.fillRect(11, 6.5, 7, 4.5);
    ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.arc(18.5, 8.7, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-6, -8); ctx.quadraticCurveTo(2, 0, -6, 8); ctx.stroke();
    ctx.fillStyle = '#f5c542'; ctx.beginPath(); ctx.arc(1, -6, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8c39a'; ctx.beginPath(); ctx.arc(2, 0, 7.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1b2a4a';
    ctx.beginPath(); ctx.arc(2, 0, 7.9, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
    ctx.fillRect(6, -2.2, 7.5, 4.4);
    ctx.fillStyle = '#f5c542'; ctx.fillRect(6, 1.6, 7.5, 1.6);
    ctx.fillStyle = '#101018';
    ctx.beginPath(); ctx.arc(5.4, -2.4, 1.25, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5.4, 2.4, 1.25, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#f2f3f5'; ctx.font = 'bold 9px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('GUARD', g.x, g.y + 28);
    if (g.mood === 'suspicious') {
      ctx.fillStyle = COLORS.warn; ctx.font = 'bold 24px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('?', g.x, g.y - 22);
    }
    if (g.mood === 'hunt') {
      ctx.strokeStyle = COLORS.danger; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(g.x, g.y, 20 + Math.sin(t * 8) * 3, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = COLORS.danger; ctx.font = 'bold 24px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 24);
    }
  }
  const p = world.player;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(p.x + 3, p.y + 5, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
  // Hooded thief: dark suit, backpack, pale face under a hood, eye mask stripe.
  ctx.fillStyle = '#191c26'; ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#f2f3f5'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#3d2b12'; ctx.fillRect(p.x - 13, p.y + 4, 10, 9);
  ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 1; ctx.strokeRect(p.x - 13, p.y + 4, 10, 9);
  ctx.fillStyle = '#e8c39a'; ctx.beginPath(); ctx.arc(p.x, p.y, 7.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#101018';
  ctx.beginPath(); ctx.arc(p.x, p.y, 8.2, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.facing);
  ctx.fillStyle = '#101018'; ctx.fillRect(-2, -3.4, 10, 6.8);
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(4.5, -1.6, 1.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(4.5, 1.6, 1.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.font = 'bold 11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('THIEF', p.x, p.y - 20);
  drawObjective(ctx, world, t);
  if (!world.hasDisk && world.diskProgress > 0) {
    ctx.fillStyle = COLORS.gold; ctx.fillRect(disk.x - 40, disk.y + 36, 80 * (world.diskProgress / 1.5), 7);
  }
  drawHud(ctx, world);
  // Objective strip along the bottom: the current job, readable in a thumbnail.
  if (world.phase === 'play') {
    ctx.fillStyle = 'rgba(5,6,10,0.85)'; ctx.fillRect(360, 682, 560, 30);
    ctx.strokeStyle = world.hasDisk ? COLORS.safe : COLORS.gold; ctx.lineWidth = 1;
    ctx.strokeRect(360, 682, 560, 30);
    ctx.fillStyle = world.hasDisk ? COLORS.safe : COLORS.goldSoft;
    ctx.font = 'bold 14px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(world.hasDisk ? 'OBJECTIVE: ESCAPE VIA THE SERVICE DOOR →' : 'OBJECTIVE: STEAL THE SUN DISK FROM THE VAULT →', 640, 702);
  }
  if (world.phase === 'title') {
    ctx.fillStyle = 'rgba(5,6,10,0.72)'; ctx.fillRect(340, 230, 600, 210);
    ctx.strokeStyle = COLORS.gold; ctx.strokeRect(340, 230, 600, 210);
    ctx.fillStyle = COLORS.gold; ctx.font = 'bold 38px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('THE NIGHT VAULT', 640, 292);
    ctx.fillStyle = '#f2f3f5'; ctx.font = '17px system-ui, sans-serif';
    ctx.fillText('Steal the Sun Disk. Slip out the service door.', 640, 332);
    ctx.fillText('WASD move · Shift sneak · Click: throw coin · P pause', 640, 362);
    ctx.fillStyle = COLORS.warn; ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('Press SPACE to start', 640, 402);
  }
  if (world.phase === 'won') {
    ctx.fillStyle = 'rgba(5,10,7,0.86)'; ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
    ctx.fillStyle = COLORS.safe; ctx.font = 'bold 44px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('CLEAN GETAWAY!', 640, 250);
    ctx.fillStyle = '#f2f3f5'; ctx.font = '22px system-ui, sans-serif';
    ctx.fillText('Time: ' + Math.floor(world.winTime) + 's', 640, 320);
    ctx.fillText('Loot: ' + world.lootCount + '/5 + Sun Disk', 640, 360);
    ctx.fillText('Near misses: ' + world.nearMissCount, 640, 400);
    ctx.fillText('Coins left: ' + world.coins + ' · Alarm at escape: ' + Math.round(world.alarm.value) + '%', 640, 432);
    ctx.fillStyle = COLORS.gold; ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText('GRADE: ' + world.grade, 640, 460);
    ctx.fillStyle = '#aeb6c2'; ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Press SPACE to play again', 640, 520);
  }
  if (world.phase === 'caught') {
    ctx.fillStyle = 'rgba(20,4,4,0.86)'; ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
    ctx.fillStyle = COLORS.danger; ctx.font = 'bold 46px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('CAUGHT!', 640, 300);
    ctx.fillStyle = '#f2f3f5'; ctx.font = '19px system-ui, sans-serif';
    ctx.fillText('The alarm hit 100%. Press SPACE to try again.', 640, 350);
  }
  if (world.paused && world.phase === 'play') {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 34px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('PAUSED', 640, 370);
  }
}
