// ============ 场景：夜晚神社（静态预渲染 + 动态雾/萤火/花瓣） ============
window.G = window.G || {};

G.Scene = {
  bg: null, t: 0,
  fogs: [], flies: [], ambPetals: [],
  // 程序化兜底底图的灯笼位置
  PROC_LANTERNS: [{ x: 438, y: 208 }, { x: 842, y: 208 }, { x: 372, y: 528 }, { x: 908, y: 528 }],
  // 按 AI 背景图实测的灯火位置（canvas 坐标，s=光晕尺寸 a=透明度）
  lanterns: [
    { x: 217, y: 259, s: 0.9, a: 0.28 },  // 左后石灯
    { x: 1020, y: 259, s: 0.9, a: 0.28 }, // 右后石灯
    { x: 183, y: 501, s: 1.15, a: 0.34 }, // 左前石灯
    { x: 1059, y: 498, s: 1.15, a: 0.34 },// 右前石灯
  ],

  build() {
    const c = document.createElement('canvas'); c.width = G.W; c.height = G.H;
    const x = c.getContext('2d');
    const u = G.util;

    // 夜空地面渐变
    let g = x.createLinearGradient(0, 0, 0, G.H);
    g.addColorStop(0, '#141a38'); g.addColorStop(0.45, '#10142c'); g.addColorStop(1, '#0a0d20');
    x.fillStyle = g; x.fillRect(0, 0, G.W, G.H);

    // 月亮
    const mg = x.createRadialGradient(1118, 82, 6, 1118, 82, 130);
    mg.addColorStop(0, 'rgba(240,240,255,.9)'); mg.addColorStop(0.16, 'rgba(220,225,255,.35)');
    mg.addColorStop(1, 'rgba(200,210,255,0)');
    x.fillStyle = mg; x.fillRect(960, 0, 320, 240);
    x.fillStyle = '#e8ecff';
    x.beginPath(); x.arc(1118, 82, 30, 0, 6.2832); x.fill();
    x.fillStyle = 'rgba(190,200,240,.5)';
    x.beginPath(); x.arc(1108, 74, 6, 0, 6.2832); x.fill();
    x.beginPath(); x.arc(1128, 90, 4, 0, 6.2832); x.fill();

    // 远景树影
    x.fillStyle = '#0b0f22';
    for (let i = 0; i < 9; i++) {
      const tx = 30 + i * 150 + u.rand(-24, 24), th = u.rand(60, 120);
      x.beginPath(); x.ellipse(tx, 74, u.rand(46, 78), th * 0.62, 0, 0, 6.2832); x.fill();
    }

    // 神社本殿（顶部中央）
    x.save(); x.translate(640, 66);
    x.fillStyle = '#171126';
    x.fillRect(-150, -20, 300, 66); // 殿身
    x.fillStyle = '#100b1c';
    x.beginPath(); // 大屋顶
    x.moveTo(-178, -16); x.quadraticCurveTo(0, -78, 178, -16);
    x.lineTo(150, -20); x.quadraticCurveTo(0, -62, -150, -20); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(230,195,122,.28)'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(-178, -16); x.quadraticCurveTo(0, -78, 178, -16); x.stroke();
    // 暖窗
    for (let i = -2; i <= 2; i++) {
      x.fillStyle = 'rgba(255,190,110,.5)';
      x.fillRect(i * 52 - 14, 2, 28, 34);
      x.fillStyle = 'rgba(20,12,26,.9)';
      x.fillRect(i * 52 - 2, 2, 4, 34);
    }
    x.restore();

    // 大鸟居
    x.save(); x.translate(640, 168);
    x.fillStyle = '#8a2f24';
    x.fillRect(-128, -58, 16, 96); x.fillRect(112, -58, 16, 96); // 柱
    x.fillStyle = '#a83a2c';
    x.beginPath(); x.moveTo(-160, -66); x.quadraticCurveTo(0, -84, 160, -66);
    x.lineTo(160, -50); x.quadraticCurveTo(0, -66, -160, -50); x.closePath(); x.fill(); // 笠木
    x.fillStyle = '#933227';
    x.fillRect(-136, -34, 272, 10); // 贯
    x.fillStyle = 'rgba(255,150,110,.16)';
    x.fillRect(-128, -58, 16, 96); x.fillRect(112, -58, 16, 96);
    x.restore();

    // 参道石路
    x.save();
    const pg = x.createLinearGradient(0, 150, 0, G.H);
    pg.addColorStop(0, 'rgba(70,76,110,.34)'); pg.addColorStop(1, 'rgba(56,60,92,.16)');
    x.fillStyle = pg;
    x.beginPath();
    x.moveTo(560, 130); x.lineTo(720, 130); x.lineTo(830, G.H); x.lineTo(450, G.H); x.closePath(); x.fill();
    // 石板缝
    x.strokeStyle = 'rgba(20,24,46,.5)'; x.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      const py = 160 + i * 48, w = G.util.lerp(160, 380, (py - 130) / (G.H - 130));
      x.beginPath(); x.moveTo(640 - w / 2 + u.rand(-6, 6), py); x.lineTo(640 + w / 2 + u.rand(-6, 6), py); x.stroke();
    }
    x.restore();

    // 石灯笼（静态底座，光晕动态画）程序化底图专用布局
    for (const L of this.PROC_LANTERNS) {
      x.save(); x.translate(L.x, L.y);
      x.fillStyle = '#3a4062';
      x.fillRect(-7, -6, 14, 22);           // 柱
      x.beginPath(); x.moveTo(-13, -8); x.lineTo(13, -8); x.lineTo(8, -20); x.lineTo(-8, -20); x.closePath(); x.fill(); // 笠
      x.fillStyle = '#2c3252'; x.fillRect(-9, -24, 18, 6);
      x.fillStyle = 'rgba(255,200,120,.85)'; x.fillRect(-5, -18, 10, 8); // 火袋
      x.fillStyle = '#464e74'; x.beginPath(); x.arc(0, -27, 3.4, 0, 6.2832); x.fill(); // 宝珠
      x.fillStyle = 'rgba(0,0,0,.4)'; x.beginPath(); x.ellipse(0, 18, 14, 5, 0, 0, 6.2832); x.fill();
      x.restore();
    }

    // 地面杂点与苔斑
    for (let i = 0; i < 260; i++) {
      x.fillStyle = 'rgba(' + (u.chance(0.5) ? '90,110,150' : '60,90,80') + ',' + u.rand(0.04, 0.12) + ')';
      x.beginPath(); x.arc(u.rand(0, G.W), u.rand(60, G.H), u.rand(1, 3.2), 0, 6.2832); x.fill();
    }
    for (let i = 0; i < 26; i++) {
      x.fillStyle = 'rgba(50,80,70,' + u.rand(0.05, 0.13) + ')';
      x.beginPath(); x.ellipse(u.rand(0, G.W), u.rand(120, G.H), u.rand(20, 60), u.rand(10, 26), u.rand(0, 3), 0, 6.2832); x.fill();
    }
    // 散落的静态花瓣
    for (let i = 0; i < 90; i++) {
      x.save();
      x.translate(u.rand(0, G.W), u.rand(90, G.H)); x.rotate(u.rand(0, 6.28));
      x.fillStyle = 'rgba(255,180,210,' + u.rand(0.08, 0.22) + ')';
      x.beginPath(); x.ellipse(0, 0, u.rand(2.5, 4.5), u.rand(1.4, 2.4), 0, 0, 6.2832); x.fill();
      x.restore();
    }

    // 两侧近景树
    for (const tx of [36, 1244]) {
      x.save(); x.translate(tx, 300);
      x.fillStyle = '#080b1a';
      x.beginPath(); x.ellipse(0, 60, 90, 210, 0, 0, 6.2832); x.fill();
      x.beginPath(); x.ellipse(0, -160, 110, 90, 0, 0, 6.2832); x.fill();
      x.restore();
    }

    this.bg = c;

    // 动态元素初始化
    this.fogs = [];
    for (let i = 0; i < 12; i++)
      this.fogs.push({ x: u.rand(0, G.WORLD_W), y: u.rand(80, G.WORLD_H), r: u.rand(120, 240), vx: u.rand(6, 16) * (u.chance(0.5) ? 1 : -1), a: u.rand(0.04, 0.09), ph: u.rand(0, 6) });
    this.flies = [];
    for (let i = 0; i < 60; i++)
      this.flies.push({ x: u.rand(0, G.WORLD_W), y: u.rand(70, G.WORLD_H), ph: u.rand(0, 6.28), sp: u.rand(0.4, 1.2), r: u.rand(1, 2.2) });
    this.ambPetals = [];
    for (let i = 0; i < 46; i++)
      this.ambPetals.push({ x: u.rand(0, G.WORLD_W), y: u.rand(0, G.WORLD_H), vy: u.rand(14, 30), ph: u.rand(0, 6.28), sz: u.rand(2.4, 4.4), rot: u.rand(0, 6.28), vr: u.rand(-2, 2) });
  },

  update(dt) {
    this.t += dt;
    const u = G.util;
    for (const f of this.fogs) {
      f.x += f.vx * dt;
      if (f.x < -f.r) f.x = G.WORLD_W + f.r; if (f.x > G.WORLD_W + f.r) f.x = -f.r;
    }
    for (const fl of this.flies) {
      fl.ph += dt * fl.sp;
      fl.x += Math.sin(fl.ph * 0.9) * 12 * dt;
      fl.y += Math.cos(fl.ph * 0.7) * 9 * dt;
    }
    for (const p of this.ambPetals) {
      p.y += p.vy * dt; p.rot += p.vr * dt;
      p.x += Math.sin(this.t * 1.4 + p.ph) * 20 * dt;
      if (p.y > G.WORLD_H + 8) { p.y = -8; p.x = u.rand(0, G.WORLD_W); }
    }
  },

  drawUnder(ctx) {
    if (G.Assets.ok('bg')) {
      const im = G.Assets.get('bg');
      ctx.drawImage(im, 0, 0, im.naturalWidth, im.naturalHeight, 0, 0, G.WORLD_W, G.WORLD_H);
    } else ctx.drawImage(this.bg, 0, 0, G.WORLD_W, G.WORLD_H);
    // 灯笼光晕（闪烁）
    ctx.globalCompositeOperation = 'lighter';
    const spr = G.FX.sprites.gold;
    const lamps = G.Assets.ok('bg') ? this.lanterns : this.PROC_LANTERNS;
    const sx = G.WORLD_W / G.W, sy = G.WORLD_H / G.H;
    for (const L of lamps) {
      const fl = 0.75 + Math.sin(this.t * 7 + L.x) * 0.12 + Math.sin(this.t * 17 + L.y) * 0.07;
      const lx = L.x * sx, ly = L.y * sy;
      const sz = 46 * fl * (L.s || 1) * Math.sqrt(sx * sy);
      ctx.globalAlpha = (L.a || 0.34) * fl;
      ctx.drawImage(spr, lx - sz, ly - sz, sz * 2, sz * 2);
    }
    // 萤火
    const fs = G.FX.sprites.spirit;
    for (const fl of this.flies) {
      const tw = 0.4 + Math.sin(fl.ph * 3) * 0.35;
      ctx.globalAlpha = tw * 0.5;
      const sz = 5 + fl.r * 3;
      ctx.drawImage(fs, fl.x - sz, fl.y - sz, sz * 2, sz * 2);
    }
    // 雾（底层）
    for (const f of this.fogs) {
      const g2 = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      g2.addColorStop(0, 'rgba(150,160,220,' + f.a + ')');
      g2.addColorStop(1, 'rgba(150,160,220,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = g2;
      ctx.fillRect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  },

  drawOver(ctx) {
    // 飘落樱花
    for (const p of this.ambPetals) {
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#ffb9d4';
      ctx.beginPath(); ctx.ellipse(0, 0, p.sz, p.sz * 0.55, 0, 0, 6.2832); ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  },

  drawVignette(ctx) {
    // 暗角属于屏幕空间，不随镜头缩放或移动。
    const v = ctx.createRadialGradient(640, 380, 300, 640, 380, 780);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(2,3,10,.5)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, G.W, G.H);
  }
};
