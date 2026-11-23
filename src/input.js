// Keyboard and mouse state: movement keys, sneak, pause, coin clicks.
export function createInput(canvas, onCoin, onAnyKey) {
  const keys = new Set();
  const input = { keys, sneak: false };
  window.addEventListener('keydown', (event) => {
    keys.add(event.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
    onAnyKey(event.code);
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    onCoin(x, y);
  });
  return input;
}
export function inputVector(keys) {
  let x = 0; let y = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len, moving: x !== 0 || y !== 0 };
}
