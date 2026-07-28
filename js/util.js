// ============ 工具 ============
window.G = window.G || {};
G.W = 1280; G.H = 720;
// 画布仍是 1280×720；战斗发生在更大的世界中，由镜头负责取景。
G.WORLD_W = 2304; G.WORLD_H = 1296;
G.WORLD_ZOOM = 0.78;
G.WORLD_UNIT = 1 / G.WORLD_ZOOM;

// 背景石沿围出的庭院才是实际战场。天空、神社与外围树林保留为远景，
// 所有可移动战斗单位都通过同一椭圆边界约束。
G.FIELD = {
  cx: G.WORLD_W * 0.5,
  cy: G.WORLD_H * 0.6,
  rx: G.WORLD_W * 0.455,
  ry: G.WORLD_H * 0.268
};

G.util = {
  clamp(v, a, b) { return v < a ? a : v > b ? b : v; },
  lerp(a, b, t) { return a + (b - a) * t; },
  rand(a, b) { return a + Math.random() * (b - a); },
  randi(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  chance(p) { return Math.random() < p; },
  dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); },
  dist2(x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1; return dx * dx + dy * dy; },
  angTo(x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1); },
  angLerp(a, b, t) {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a + d * t;
  },
  easeO(t) { return 1 - Math.pow(1 - t, 3); },
  easeO2(t) { return 1 - (1 - t) * (1 - t); },
  easeI(t) { return t * t * t; },
  easeBack(t) { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  // 点到线段最近距离与参数
  dSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const l2 = dx * dx + dy * dy;
    let t = l2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
    t = G.util.clamp(t, 0, 1);
    const cx = ax + dx * t, cy = ay + dy * t;
    return { d: Math.hypot(px - cx, py - cy), t, cx, cy };
  },
  fmtTime(s) {
    s = Math.floor(s);
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  },
  fieldContains(x, y, padding) {
    const f = G.FIELD, pad = Math.max(0, padding || 0);
    const rx = Math.max(1, f.rx - pad), ry = Math.max(1, f.ry - pad);
    const nx = (x - f.cx) / rx, ny = (y - f.cy) / ry;
    return nx * nx + ny * ny <= 1.000001;
  },
  fieldClamp(x, y, padding) {
    const f = G.FIELD, pad = Math.max(0, padding || 0);
    const rx = Math.max(1, f.rx - pad), ry = Math.max(1, f.ry - pad);
    const nx = (x - f.cx) / rx, ny = (y - f.cy) / ry;
    const q = nx * nx + ny * ny;
    if (q <= 1) return { x, y };
    const k = 1 / Math.sqrt(q);
    return { x: f.cx + nx * k * rx, y: f.cy + ny * k * ry };
  },
  fieldRandom(padding) {
    const f = G.FIELD, pad = Math.max(0, padding || 0);
    const ang = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random());
    return {
      x: f.cx + Math.cos(ang) * radius * Math.max(1, f.rx - pad),
      y: f.cy + Math.sin(ang) * radius * Math.max(1, f.ry - pad)
    };
  }
};

// 简单对象池
G.Pool = class {
  constructor(create, size) {
    this.create = create;
    this.items = [];
    for (let i = 0; i < size; i++) { const o = create(); o._live = false; this.items.push(o); }
  }
  get() {
    for (let i = 0; i < this.items.length; i++) if (!this.items[i]._live) { this.items[i]._live = true; return this.items[i]; }
    const o = this.create(); o._live = true; this.items.push(o); return o;
  }
  each(fn) { for (let i = 0; i < this.items.length; i++) if (this.items[i]._live) fn(this.items[i]); }
  clear() { for (const o of this.items) o._live = false; }
};
