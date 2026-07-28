// ============ 输入 ============
window.G = window.G || {};

G.Input = {
  keys: new Set(),
  just: new Set(),
  mouse: { x: G.W / 2, y: G.H / 2, down: false, jD: false, jU: false, rD: false },
  _cv: null,

  init(canvas) {
    this._cv = canvas;
    window.addEventListener('keydown', e => {
      if (e.repeat) return;
      this.keys.add(e.code);
      this.just.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    window.addEventListener('blur', () => { this.keys.clear(); this.mouse.down = false; this.mouse.rD = false; });

    const toLogic = (cx, cy) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (cx - r.left) * (G.W / r.width);
      this.mouse.y = (cy - r.top) * (G.H / r.height);
    };
    canvas.addEventListener('mousemove', e => toLogic(e.clientX, e.clientY));
    canvas.addEventListener('mousedown', e => {
      toLogic(e.clientX, e.clientY);
      if (e.button === 0) {
        this.mouse.down = true; this.mouse.jD = true;
      } else if (e.button === 2) {
        this.mouse.rD = true;
        e.preventDefault();
      }
    });
    window.addEventListener('mouseup', e => {
      if (e.button !== 0) return;
      if (this.mouse.down) { this.mouse.down = false; this.mouse.jU = true; }
    });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
  },

  pressed(code) { return this.just.has(code); },
  axis() {
    let x = 0, y = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
    if (x && y) { x *= 0.7071; y *= 0.7071; }
    return { x, y };
  },
  endFrame() { this.just.clear(); this.mouse.jD = false; this.mouse.jU = false; this.mouse.rD = false; }
};
