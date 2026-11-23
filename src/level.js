// Museum layout: a dense, winding labyrinth of thick 22px walls, mirrored
// around x=640. Corridors run one bay wide; every spine and cross wall has
// its doorway at a different row, so no route runs straight. Loot sits at
// the end of dead ends, the vault pocket crowns the top centre, and the
// service door waits at the bottom centre.
// Grid: spines at x = 200/350/500/629/758/908/1058, cross walls at
// y = 220/348/476. A missing piece in the lists below is a doorway.
export function buildLevel() {
  const T = 22;
  const walls = [
    // Outer shell, thick on every side.
    { x: 28, y: 70, w: 1224, h: T },
    { x: 28, y: 658, w: 1224, h: T },
    { x: 28, y: 70, w: T, h: 610 },
    { x: 1230, y: 70, w: T, h: 610 },
  ];
  const V = (x, y, h) => walls.push({ x, y, w: T, h });
  const H = (y, x, w) => walls.push({ x, y, w, h: T });
  // Spines, west to east. Gaps: S1 row 3, S2 row 3 low, S3 pocket side full.
  V(200, 92, 150); V(200, 242, 128); V(200, 498, 160);            // gap at y 370-498
  V(350, 92, 150); V(350, 242, 128);                              // gaps at y 370-498 and y 498-658 (bottom run)
  V(500, 92, 150); V(500, 370, 128);                              // gap at y 242-370 (laser) and y 498-658; top piece is the vault wall
  V(629, 242, 128); V(629, 498, 160);                             // centre spine, gap at y 370-498
  V(758, 92, 150); V(758, 370, 128);                              // mirror of S3
  V(908, 92, 150); V(908, 242, 128);                              // mirror of S2
  V(1058, 92, 150); V(1058, 242, 128); V(1058, 498, 160);         // mirror of S1
  // Cross walls, top to bottom. H1 carries no segments at all: the top row
  // is an upper corridor ring, and the vault mouth stays open at the centre.
  H(348, 522, 236);                                               // gaps: far wings, bay 2 (feeds the loot dens), bay 3 both sides
  H(476, 222, 128); H(476, 930, 128);                             // gaps: far wings (loot dens), bay 3, centre run to the exit
  const cases = [
    { x: 250, y: 131, w: 72, h: 38 }, { x: 958, y: 131, w: 72, h: 38 },
    { x: 89, y: 561, w: 72, h: 38 }, { x: 1119, y: 561, w: 72, h: 38 },
    { x: 400, y: 511, w: 72, h: 38 },
    { x: 89, y: 131, w: 72, h: 38 }, { x: 1119, y: 131, w: 72, h: 38 },
  ];
  const shadowZones = [
    { x: 70, y: 600, w: 110, h: 44 }, { x: 1100, y: 600, w: 110, h: 44 },
  ];
  const loots = [
    { id: 'mask', name: 'Jade Mask', x: 286, y: 150, taken: false },
    { id: 'crown', name: 'Tiny Crown', x: 994, y: 150, taken: false },
    { id: 'vase', name: 'Moon Vase', x: 125, y: 580, taken: false },
    { id: 'scroll', name: 'Old Scroll', x: 1155, y: 580, taken: false },
    { id: 'gem', name: 'Star Gem', x: 436, y: 530, taken: false },
  ];
  return {
    walls, cases, pillars: [], shadowZones,
    blockers: [...walls, ...cases],
    loots,
    tripwire: { y: 244, x: 530, x2: 750 },
    laserGate2: { x: 769, y: 250, y2: 362 },
    sunDisk: { x: 640, y: 160, r: 24, taken: false },
    exitDoor: { x: 606, y: 658, w: 68, h: 22 },
    entrance: { x: 50, y: 423 },
    playerStart: { x: 86, y: 423 },
    laserGate: { x: 511, y: 250, y2: 362 },
    guardRoutes: [
      [{ x: 125, y: 300 }, { x: 125, y: 430 }],
      [{ x: 1155, y: 300 }, { x: 1155, y: 430 }],
      [{ x: 436, y: 580 }, { x: 575, y: 580 }],
    ],
    cameraSpots: [
      { x: 125, y: 104, base: 1.5, sweep: 0.6, phase: 0.4 },
      { x: 1155, y: 104, base: 1.64, sweep: 0.6, phase: 2.1 },
    ],
    roomLabels: [
      { x: 125, y: 250, text: 'WEST WING' },
      { x: 1155, y: 250, text: 'EAST WING' },
    ],
  };
}
