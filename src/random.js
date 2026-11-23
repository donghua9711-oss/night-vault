// Deterministic seeded random so screenshot staging never drifts.
export function makeRandom(seed) {
  let state = (seed >>> 0) || 1;
  return function nextRandom() {
    state ^= state << 13; state >>>= 0;
    state ^= state >> 17;
    state ^= state << 5; state >>>= 0;
    return state / 4294967296;
  };
}
export function pickSeeded(rand, list) {
  return list[Math.floor(rand() * list.length) % list.length];
}
