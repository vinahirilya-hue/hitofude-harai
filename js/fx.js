// ============ 特效：粒子/残影/震屏/飘字/全屏闪光 ============
window.G = window.G || {};

G.FX = {
  quality: 1,
  sprites: {},
  SLASH_ROT: -Math.PI / 2,  // 刀光贴图长轴在本地 +y，补偿到前进方向
  FOX_ROT: -Math.PI / 2,    // 狐火贴图狐首朝下，转到前进方向
  WISP_ROT: Math.PI * 4 / 3, // 灵球贴图尾在右上，转到拖尾向后
  parts: null, texts: null, rings: null, afters: null, slashes: null, gashes: null, bolts: null, skillFx: null,
  _shakeMag: 0, _shakeDur: 0, _shakeT: 0, shakeX: 0, shakeY: 0,
  _flashEl: null, _hurtEl: null, _ratingEl: null, _bannerEl: null,

  COLORS: {
    white: '#ffffff', cyan: '#9fe8ff', pink: '#ffb7d5', gold: '#ffd98a',
    red: '#ff7a6a', purple: '#c99aff', teal: '#8affd8', blue: '#7db8ff',
    spirit: '#c8f4ff', vermil: '#ff8a70'
  },

  init() {
    // 预渲染辉光贴图
    for (const k in this.COLORS) {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const x = c.getContext('2d');
      const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, this.COLORS[k]);
      g.addColorStop(0.28, this.COLORS[k] + 'cc');
      g.addColorStop(1, this.COLORS[k] + '00');
      x.fillStyle = g; x.fillRect(0, 0, 64, 64);
      this.sprites[k] = c;
    }
    this.parts = new G.Pool(() => ({}), 700);
    this.texts = new G.Pool(() => ({}), 60);
    this.rings = new G.Pool(() => ({}), 60);
    this.afters = new G.Pool(() => ({}), 70);
    this.slashes = new G.Pool(() => ({}), 60);
    this.gashes = new G.Pool(() => ({}), 40);
    this.bolts = new G.Pool(() => ({}), 30);
    this.skillFx = new G.Pool(() => ({}), 80);
    this._flashEl = document.getElementById('flash');
    this._hurtEl = document.getElementById('hurtVig');
    this._ratingEl = document.getElementById('rating');
    this._bannerEl = document.getElementById('banner');
  },
  setQuality(q) { this.quality = q; },
  clear() {
    this.parts.clear(); this.texts.clear(); this.rings.clear(); this.afters.clear(); this.slashes.clear(); this.gashes.clear(); this.bolts.clear(); this.skillFx.clear();
    this._shakeMag = 0; this.shakeX = this.shakeY = 0;
  },

  // ---- 生成 ----
  glow(x, y, color, size, life, vx, vy) {
    const p = this.parts.get();
    p.type = 'glow'; p.x = x; p.y = y; p.vx = vx || 0; p.vy = vy || 0;
    p.life = p.maxLife = life; p.size = size; p.color = color; p.drag = 0.9; p.grav = 0; p.grow = 0;
    return p;
  },
  burst(x, y, color, n, sp, size, life) {
    n = Math.round(n * this.quality);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = sp * (0.3 + Math.random() * 0.9);
      const p = this.parts.get();
      p.type = 'glow'; p.x = x; p.y = y;
      p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s;
      p.life = p.maxLife = life * (0.6 + Math.random() * 0.7);
      p.size = size * (0.6 + Math.random() * 0.8); p.color = color;
      p.drag = 0.86; p.grav = 0; p.grow = -0.5;
    }
  },
  petals(x, y, n, spread, dir) {
    n = Math.round(n * this.quality);
    for (let i = 0; i < n; i++) {
      const p = this.parts.get();
      let a;
      if (dir == null) a = Math.random() * Math.PI * 2;
      else a = dir + (G.util.chance(0.5) ? 0 : Math.PI) + G.util.rand(-0.55, 0.55);
      const s = (spread || 120) * (0.3 + Math.random());
      p.type = 'petal'; p.x = x; p.y = y;
      p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s - 40;
      p.life = p.maxLife = 0.9 + Math.random() * 0.8;
      p.rot = Math.random() * 6.28; p.vr = G.util.rand(-9, 9);
      p.size = 3 + Math.random() * 3.4; p.drag = 0.92; p.grav = 60;
      p.ph = Math.random() * 6.28;
    }
  },
  papers(x, y, n, dir) {
    n = Math.round(n * this.quality);
    for (let i = 0; i < n; i++) {
      const p = this.parts.get();
      let a;
      if (dir == null) a = Math.random() * Math.PI * 2;
      else a = dir + (G.util.chance(0.5) ? 0 : Math.PI) + G.util.rand(-0.5, 0.5);
      const s = 90 * (0.4 + Math.random());
      p.type = 'paper'; p.x = x; p.y = y;
      p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s - 70;
      p.life = p.maxLife = 1.1 + Math.random() * 0.7;
      p.rot = Math.random() * 6.28; p.vr = G.util.rand(-12, 12);
      p.size = 5 + Math.random() * 3; p.drag = 0.9; p.grav = 90;
      p.ph = Math.random() * 6.28;
    }
  },
  // 闪电：中点位移折线 + 三层描边 + 频闪
  bolt(x1, y1, x2, y2, o) {
    const b = this.bolts.get();
    b.x1 = x1; b.y1 = y1; b.x2 = x2; b.y2 = y2;
    b.w = (o && o.w) || 4;
    b.life = b.maxLife = (o && o.life) || 0.22;
    b.disp = Math.hypot(x2 - x1, y2 - y1) * 0.28;
    b.regenT = 0;
    this._boltGen(b);
  },
  _boltGen(b) {
    const pts = [[b.x1, b.y1]];
    const seg = (x1, y1, x2, y2, d) => {
      if (d < 6) { pts.push([x2, y2]); return; }
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const nx = -(y2 - y1), ny = (x2 - x1);
      const l = Math.hypot(nx, ny) || 1;
      const off = (Math.random() - 0.5) * d;
      const px = mx + nx / l * off, py = my + ny / l * off;
      seg(x1, y1, px, py, d / 2);
      seg(px, py, x2, y2, d / 2);
    };
    seg(b.x1, b.y1, b.x2, b.y2, b.disp);
    b.pts = pts;
  },
  // 直刃刀光：纺锤形三层 + 端点星芒（调用前 ctx 已平移旋转到位）
  _blade(ctx, len, t, key) {
    const col = key === 'pink' ? '#ffd7ec' : key === 'gold' ? '#ffe9b0' : '#b8ecff';
    const L = len * (0.72 + (1 - t) * 0.45); // 出现即伸长
    const wK = 0.55 + 0.45 * t;              // 越新鲜越粗，衰减中收细
    const w1 = len * 0.075 * wK, w2 = len * 0.03 * wK;
    // 外层光刃
    ctx.globalAlpha = Math.min(1, t * 1.6) * 0.55;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(-L / 2, 0);
    ctx.quadraticCurveTo(0, -w1, L / 2, 0);
    ctx.quadraticCurveTo(0, w1, -L / 2, 0);
    ctx.closePath(); ctx.fill();
    // 白热内芯
    ctx.globalAlpha = Math.min(1, t * 1.8) * 0.95;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-L * 0.46, 0);
    ctx.quadraticCurveTo(0, -w2, L * 0.46, 0);
    ctx.quadraticCurveTo(0, w2, -L * 0.46, 0);
    ctx.closePath(); ctx.fill();
  },
  // 定向辉光迸发
  burstDir(x, y, ang, color, n, sp, size, life) {
    n = Math.round(n * this.quality);
    for (let i = 0; i < n; i++) {
      const a = ang + (G.util.chance(0.5) ? 0 : Math.PI) + G.util.rand(-0.4, 0.4);
      const s = sp * (0.4 + Math.random() * 0.9);
      const p = this.parts.get();
      p.type = 'glow'; p.x = x; p.y = y;
      p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s;
      p.life = p.maxLife = life * (0.6 + Math.random() * 0.7);
      p.size = size * (0.6 + Math.random() * 0.8); p.color = color;
      p.drag = 0.85; p.grav = 0; p.grow = -0.5;
    }
  },
  // 居合斩击伤迸开：沿切线拉长的炽光裂口
  gash(x, y, ang, r, color) {
    const g = this.gashes.get();
    g.x = x; g.y = y; g.ang = ang;
    g.len = r * 4 + 90; g.color = color || 'slash';
    g.life = g.maxLife = 0.42;
  },
  // 飞向玩家的灵力光球
  spiritOrb(x, y, cb, color) {
    const p = this.parts.get();
    p.type = 'orb'; p.x = x; p.y = y; p.vx = G.util.rand(-60, 60); p.vy = G.util.rand(-90, -30);
    p.life = p.maxLife = 2.2; p.size = 9; p.color = color || 'spirit';
    p.cb = cb; p.drag = 1; p.grav = 0;
  },
  ring(x, y, r1, color, w, life, r0) {
    const r = this.rings.get();
    r.x = x; r.y = y; r.r0 = r0 || 4; r.r1 = r1; r.color = color; r.w = w || 3;
    r.life = r.maxLife = life || 0.4;
  },
  slash(x, y, ang, len, color) {
    const s = this.slashes.get();
    s.x = x; s.y = y; s.ang = ang; s.len = len || 60; s.color = color || 'white';
    s.life = s.maxLife = 0.22;
  },
  // 技能专属图形层。使用少量矢量图形代替大量粒子，百怪同屏时也能保持清晰。
  skillVisual(kind, x, y, opt) {
    opt = opt || {};
    const v = this.skillFx.get();
    v.kind = kind; v.x = x || 0; v.y = y || 0;
    v.size = opt.size || 80; v.lv = opt.lv || 1;
    v.rot = opt.rot == null ? G.util.rand(-0.3, 0.3) : opt.rot;
    v.life = v.maxLife = opt.life || 0.6;
    v.pts = null;
    if (opt.pts && opt.pts.length) {
      const stride = Math.max(1, Math.ceil(opt.pts.length / 90));
      v.pts = opt.pts.filter((_, i) => i % stride === 0 || i === opt.pts.length - 1)
        .map(p => ({ x: p.x, y: p.y }));
    }
    return v;
  },
  flamePillar(x, y, radius, lv) {
    return this.skillVisual('flame', x, y, { size: radius, lv, life: 0.62 });
  },
  frostBind(points, lv) {
    if (!points || !points.length) return null;
    let x = 0, y = 0;
    for (const p of points) { x += p.x; y += p.y; }
    return this.skillVisual('frost', x / points.length, y / points.length, {
      size: 34 + lv * 4, lv, life: 0.72, pts: points
    });
  },
  windTrail(points, lv) {
    if (!points || points.length < 2) return null;
    return this.skillVisual('gale', points[0].x, points[0].y, {
      size: 18 + lv * 3, lv, life: 0.58, pts: points
    });
  },
  moonBreak(x, y, radius, lv) {
    return this.skillVisual('moon', x, y, { size: Math.max(86, radius * 3.4), lv, life: 0.68, rot: -0.72 });
  },
  renewalBloom(x, y, radius, lv) {
    return this.skillVisual('renewal', x, y, { size: radius || 92, lv, life: 0.82 });
  },
  after(x, y, ang, pose, tint, life) {
    const a = this.afters.get();
    a.x = x; a.y = y; a.ang = ang; a.pose = pose; a.tint = tint || 'cyan';
    a.life = a.maxLife = life || 0.34;
  },
  text(x, y, str, opt) {
    opt = opt || {};
    const t = this.texts.get();
    t.x = x + G.util.rand(-6, 6); t.y = y; t.str = str;
    t.size = opt.size || 16; t.color = opt.color || '#fff';
    t.life = t.maxLife = opt.life || 0.8; t.vy = opt.vy || -55;
    t.crit = opt.crit || false;
  },

  // ---- 屏幕反馈 ----
  shake(mag, dur) {
    if (mag > this._shakeMag) { this._shakeMag = mag; this._shakeDur = this._shakeT = dur || 0.3; }
  },
  flash(alpha, color) {
    const el = this._flashEl;
    el.style.transition = 'none';
    el.style.background = color || '#fff';
    el.style.opacity = alpha;
    requestAnimationFrame(() => {
      el.style.transition = 'opacity .5s ease-out';
      el.style.opacity = 0;
    });
  },
  hurtPulse() {
    const el = this._hurtEl;
    el.style.transition = 'none'; el.style.opacity = 1;
    requestAnimationFrame(() => { el.style.transition = 'opacity .7s ease-out'; el.style.opacity = 0; });
  },
  rating(tierName, n, color) {
    const el = this._ratingEl;
    el.innerHTML = tierName + '<br><small>' + n + ' 連浄化</small>';
    el.style.color = color; el.style.textShadow = '0 0 30px ' + color + ', 0 0 8px rgba(255,255,255,.6)';
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  },
  banner(text) {
    const el = this._bannerEl;
    el.textContent = text;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  },

  // ---- 更新/绘制 ----
  update(dtW, dtR, player) {
    // 震屏
    if (this._shakeT > 0) {
      this._shakeT -= dtR;
      const k = this._shakeMag * (this._shakeT / this._shakeDur);
      this.shakeX = G.util.rand(-1, 1) * k; this.shakeY = G.util.rand(-1, 1) * k;
      if (this._shakeT <= 0) { this._shakeMag = 0; this.shakeX = this.shakeY = 0; }
    }
    this.parts.each(p => {
      p.life -= (p.type === 'orb' ? dtR : dtW);
      if (p.life <= 0) { p._live = false; return; }
      if (p.type === 'orb' && player) {
        // 追踪玩家
        const a = G.util.angTo(p.x, p.y, player.x, player.y);
        const sp = 340 + (p.maxLife - p.life) * 700;
        p.vx = G.util.lerp(p.vx, Math.cos(a) * sp, 0.18);
        p.vy = G.util.lerp(p.vy, Math.sin(a) * sp, 0.18);
        p.x += p.vx * dtR; p.y += p.vy * dtR;
        if (G.util.dist2(p.x, p.y, player.x, player.y) < 400) {
          p._live = false;
          if (p.cb) p.cb();
          this.burst(player.x, player.y - 8, p.color, 3, 60, 8, 0.3);
        }
        return;
      }
      p.vx *= Math.pow(p.drag, dtW * 60); p.vy *= Math.pow(p.drag, dtW * 60);
      p.vy += (p.grav || 0) * dtW;
      p.x += p.vx * dtW; p.y += p.vy * dtW;
      if (p.type === 'petal' || p.type === 'paper') {
        p.rot += p.vr * dtW;
        p.x += Math.sin(p.life * 7 + p.ph) * 26 * dtW;
      }
    });
    this.gashes.each(g => { g.life -= dtW; if (g.life <= 0) g._live = false; });
    this.bolts.each(b => {
      b.life -= dtW;
      if (b.life <= 0) { b._live = false; return; }
      b.regenT -= dtW;
      if (b.regenT <= 0) { b.regenT = 0.045; this._boltGen(b); }
    });
    this.skillFx.each(v => {
      v.life -= dtW;
      if (v.life <= 0) { v._live = false; return; }
      v.rot += dtW * (v.kind === 'renewal' ? 0.8 : 0.35);
    });
    this.rings.each(r => { r.life -= dtW; if (r.life <= 0) r._live = false; });
    this.slashes.each(s => { s.life -= dtW; if (s.life <= 0) s._live = false; });
    this.afters.each(a => { a.life -= dtR; if (a.life <= 0) a._live = false; });
    this.texts.each(t => {
      t.life -= dtR;
      if (t.life <= 0) { t._live = false; return; }
      t.y += t.vy * dtR; t.vy *= 0.94;
    });
  },

  draw(ctx) {
    // 加性发光层
    ctx.globalCompositeOperation = 'lighter';
    this.parts.each(p => {
      if (p.type !== 'glow' && p.type !== 'orb') return;
      const t = p.life / p.maxLife;
      ctx.globalAlpha = Math.min(1, t * 1.6);
      if (p.type === 'orb' && G.Assets.ok('wisp')) {
        const sz = p.size * 2.6;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.vy, p.vx) + this.WISP_ROT);
        ctx.drawImage(G.Assets.get('wisp'), -sz, -sz, sz * 2, sz * 2);
        ctx.restore();
        return;
      }
      const spr = this.sprites[p.color];
      const sz = p.size * (p.grow ? (1 + (1 - t) * p.grow) : 1) * (0.4 + t * 0.6);
      ctx.drawImage(spr, p.x - sz, p.y - sz, sz * 2, sz * 2);
    });
    this.rings.each(r => {
      const t = 1 - r.life / r.maxLife;
      const rad = G.util.lerp(r.r0, r.r1, G.util.easeO(t));
      ctx.globalAlpha = (1 - t) * 0.9;
      ctx.strokeStyle = this.COLORS[r.color];
      ctx.lineWidth = r.w * (1 - t * 0.6);
      ctx.beginPath(); ctx.arc(r.x, r.y, rad, 0, 6.2832); ctx.stroke();
    });
    // 居合裂口：直刃刀光
    this.gashes.each(g => {
      const t = g.life / g.maxLife;
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.ang);
      // 背光
      ctx.globalAlpha = t * 0.4;
      const spr = this.sprites.cyan;
      ctx.drawImage(spr, -g.len * 0.55, -g.len * 0.14, g.len * 1.1, g.len * 0.28);
      this._blade(ctx, g.len, t, 'cyan');
      // 裂口处空气被撑开的横向冲击
      const sp = 1 - t;
      ctx.globalAlpha = t * 0.5;
      ctx.strokeStyle = '#bfeaff';
      ctx.lineWidth = 2.5 * t + 0.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, g.len * 0.1 + sp * g.len * 0.22, g.len * 0.04 + sp * g.len * 0.38, 0, 0, 6.2832);
      ctx.stroke();
      ctx.restore();
    });
    this.slashes.each(s => {
      const t = s.life / s.maxLife;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.ang);
      this._blade(ctx, s.len, t, s.color === 'pink' ? 'pink' : 'cyan');
      ctx.restore();
    });
    // 闪电
    this.bolts.each(b => {
      const t = b.life / b.maxLife;
      const fl = Math.sin(b.life * 90) > -0.3 ? 1 : 0.3;
      ctx.globalAlpha = t * fl;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      for (let layer = 0; layer < 3; layer++) {
        if (layer === 0) { ctx.strokeStyle = 'rgba(150,80,255,.35)'; ctx.lineWidth = b.w * 3; }
        else if (layer === 1) { ctx.strokeStyle = 'rgba(197,140,255,.75)'; ctx.lineWidth = b.w * 1.5; }
        else { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, b.w * 0.55); }
        ctx.beginPath();
        ctx.moveTo(b.pts[0][0], b.pts[0][1]);
        for (let i = 1; i < b.pts.length; i++) ctx.lineTo(b.pts[i][0], b.pts[i][1]);
        ctx.stroke();
      }
    });
    // 五种非雷击技能的主识别层。
    this.skillFx.each(v => {
      const t = v.life / v.maxLife;
      const age = 1 - t;
      const appear = Math.min(1, age * 8);
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (v.kind === 'flame') {
        const r = v.size * (0.72 + age * 0.28);
        const beamH = 330 + v.lv * 35;
        const grad = ctx.createLinearGradient(v.x, v.y - beamH, v.x, v.y + 24);
        grad.addColorStop(0, 'rgba(255,235,160,0)');
        grad.addColorStop(0.34, 'rgba(255,178,70,.45)');
        grad.addColorStop(1, 'rgba(255,70,30,.95)');
        ctx.globalAlpha = t * appear;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(v.x - r * 0.12, v.y - beamH);
        ctx.lineTo(v.x + r * 0.12, v.y - beamH);
        ctx.lineTo(v.x + r * (0.72 + t * 0.18), v.y + 12);
        ctx.lineTo(v.x - r * (0.72 + t * 0.18), v.y + 12);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#fff0b0'; ctx.lineWidth = 5 + v.lv * 1.5;
        ctx.beginPath(); ctx.moveTo(v.x, v.y - beamH * 0.78); ctx.lineTo(v.x, v.y + 10); ctx.stroke();
        ctx.translate(v.x, v.y); ctx.rotate(v.rot - age * 1.8);
        ctx.strokeStyle = '#ffb04f'; ctx.lineWidth = 3.5;
        ctx.globalAlpha = t * 0.95;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
          const a = i / 12 * Math.PI * 2;
          ctx.moveTo(Math.cos(a) * r * 0.34, Math.sin(a) * r * 0.34);
          ctx.lineTo(Math.cos(a) * r * (0.95 + age * 0.35), Math.sin(a) * r * (0.95 + age * 0.35));
        }
        ctx.stroke();
      } else if (v.kind === 'frost') {
        const pts = v.pts || [];
        ctx.globalAlpha = t * appear * 0.72;
        ctx.strokeStyle = '#a8f5ff'; ctx.lineWidth = 2 + v.lv * 0.45;
        if (pts.length > 1) {
          ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
          ctx.stroke();
        }
        for (const p of pts) {
          const r = v.size * (0.45 + age * 0.75);
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(v.rot + age * 0.9);
          ctx.strokeStyle = '#d9ffff'; ctx.lineWidth = 2.4;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = i / 6 * Math.PI * 2;
            ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            const bx = Math.cos(a) * r * 0.62, by = Math.sin(a) * r * 0.62;
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + Math.cos(a + 2.35) * r * 0.22, by + Math.sin(a + 2.35) * r * 0.22);
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + Math.cos(a - 2.35) * r * 0.22, by + Math.sin(a - 2.35) * r * 0.22);
          }
          ctx.stroke();
          ctx.strokeStyle = '#71d9ff'; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(0, 0, r * 1.15, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
        }
      } else if (v.kind === 'gale' && v.pts && v.pts.length > 1) {
        const pts = v.pts;
        const drawPath = () => {
          ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
          ctx.stroke();
        };
        ctx.globalAlpha = t * appear * 0.28;
        ctx.strokeStyle = '#55ffd0'; ctx.lineWidth = v.size * 1.4; drawPath();
        ctx.globalAlpha = t * appear * 0.82;
        ctx.strokeStyle = '#baffea'; ctx.lineWidth = 3 + v.lv;
        ctx.setLineDash([40 + v.lv * 8, 24]); ctx.lineDashOffset = -age * 520;
        drawPath();
        ctx.globalAlpha = t * appear;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.4;
        ctx.setLineDash([16, 54]); ctx.lineDashOffset = -age * 720;
        drawPath(); ctx.setLineDash([]);
      } else if (v.kind === 'moon') {
        const r = v.size * (0.62 + age * 0.38);
        ctx.translate(v.x, v.y); ctx.rotate(v.rot);
        ctx.globalAlpha = t * appear * 0.32;
        ctx.fillStyle = '#d8d5ff';
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = t * appear * 0.95;
        ctx.strokeStyle = '#fffaff'; ctx.lineWidth = 5 + v.lv;
        ctx.beginPath(); ctx.arc(0, 0, r, -1.25, 1.25); ctx.stroke();
        ctx.strokeStyle = '#c99aff'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(-r * 1.25, 0); ctx.lineTo(r * 1.25, 0); ctx.stroke();
        ctx.globalAlpha = t * appear * 0.62;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.ellipse(0, 0, r * (1 + age * 0.45), r * 0.28, 0, 0, Math.PI * 2); ctx.stroke();
      } else if (v.kind === 'renewal') {
        const r = v.size * (0.68 + age * 0.34);
        ctx.translate(v.x, v.y); ctx.rotate(v.rot);
        ctx.globalAlpha = t * appear * 0.86;
        ctx.strokeStyle = '#8affd8'; ctx.lineWidth = 3.2;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#fff0b8'; ctx.lineWidth = 1.7;
        ctx.beginPath(); ctx.arc(0, 0, r * 0.58, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * Math.PI * 2;
          ctx.save(); ctx.rotate(a); ctx.translate(r * 0.52, 0);
          ctx.fillStyle = i % 2 ? '#86eac9' : '#dfffcf';
          ctx.globalAlpha = t * appear * 0.52;
          ctx.beginPath(); ctx.ellipse(r * 0.18, 0, r * 0.28, r * 0.11, 0, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      }
      ctx.restore();
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // 花瓣与符纸（非加性）
    this.parts.each(p => {
      const t = p.life / p.maxLife;
      if (p.type === 'petal') {
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = Math.min(1, t * 2);
        ctx.fillStyle = '#ffc2da';
        ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, 6.2832); ctx.fill();
        ctx.fillStyle = 'rgba(255,235,245,.7)';
        ctx.beginPath(); ctx.ellipse(-p.size * 0.25, 0, p.size * 0.5, p.size * 0.3, 0, 0, 6.2832); ctx.fill();
        ctx.restore();
      } else if (p.type === 'paper') {
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = Math.min(1, t * 2);
        ctx.fillStyle = '#f5efdd';
        ctx.fillRect(-p.size * 0.5, -p.size * 0.9, p.size, p.size * 1.8);
        ctx.fillStyle = '#c03a30';
        ctx.fillRect(-p.size * 0.5, -p.size * 0.9, p.size, p.size * 0.34);
        ctx.restore();
      }
    });
    ctx.globalAlpha = 1;

    // 飘字
    this.texts.each(t => {
      const lt = t.life / t.maxLife;
      const pop = t.life > t.maxLife - 0.12 ? G.util.easeBack((t.maxLife - t.life) / 0.12) : 1;
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.scale(pop * (t.crit ? 1.35 : 1), pop * (t.crit ? 1.35 : 1));
      ctx.globalAlpha = Math.min(1, lt * 2.2);
      ctx.font = 'bold ' + t.size + 'px Georgia, "Noto Serif SC", serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,8,20,.85)';
      ctx.strokeText(t.str, 0, 0);
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, 0, 0);
      ctx.restore();
    });
    ctx.globalAlpha = 1;
  },

  // 残影在玩家层绘制（需要 drawMiko）
  drawAfters(ctx) {
    this.afters.each(a => {
      const t = a.life / a.maxLife;
      ctx.save();
      ctx.globalAlpha = t * 0.42;
      ctx.globalCompositeOperation = 'lighter';
      if (G.drawMiko) G.drawMiko(ctx, a.x, a.y, {
        dir: a.ang, pose: a.pose, ghost: a.tint, staticSprite: true
      });
      ctx.restore();
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
};
