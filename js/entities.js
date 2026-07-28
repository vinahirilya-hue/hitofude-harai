// ============ 实体：巫女 / 妖怪 / Boss / 弹幕 / 掉落物 / 狐火 ============
window.G = window.G || {};

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const MIKO_RIG_KEYS = [
  'mikoRigBow', 'mikoRigHairLeft', 'mikoRigHairRight', 'mikoRigHead',
  'mikoRigTorso', 'mikoRigSleeveLeft', 'mikoRigSleeveRight', 'mikoRigSkirt',
  'mikoRigFootLeft', 'mikoRigFootRight', 'mikoRigSword'
];

const MIKO_DIRECT_RIG_KEYS = [
  'mikoDirectBow', 'mikoDirectHairLeft', 'mikoDirectHairRight', 'mikoDirectHead',
  'mikoDirectBody', 'mikoDirectArmLeft', 'mikoDirectArmRightSword',
  'mikoDirectFootLeft', 'mikoDirectFootRight'
];

// ---------- 巫女绘制（参考立绘压缩为程序化 Q 版，玩家/残影/落点幽灵共用） ----------
G.drawMiko = function (ctx, x, y, o) {
  o = o || {};
  const t = o.t || 0, pose = o.pose || 'move';
  const tint = o.ghost ? G.FX.COLORS[o.ghost] : null;
  const C = c => tint || c;
  const dirA = o.dir != null ? o.dir : Math.PI / 2;
  const mv = o.moving || 0;
  const movePose = pose === 'move';
  const walkK = movePose ? mv : 0;
  const idleK = movePose ? 1 - mv : 0;
  const stepWave = Math.sin(o.walkT != null ? o.walkT : t * 8.4);
  const bob = pose === 'plan' ? 0 :
    -Math.abs(stepWave) * 0.58 * walkK + Math.sin(t * 2.25) * 0.72 * idleK;
  const lev = pose === 'plan' ? -3 + Math.sin(t * 2.4) * 2 : 0;
  const dashK = pose === 'dash' ? 1 : 0;
  const finK = pose === 'fin' ? 1 : 0;
  const sway = Math.sin(t * 8.5) * mv;
  const hairX = Math.cos(dirA + Math.PI) * (3.2 * mv + 7.5 * dashK);
  const hairY = Math.sin(dirA + Math.PI) * (2 * mv + 2.5 * dashK);

  // 图片拆件骨骼：保留原画质感，同时让头发、袖子、脚和刀独立运动。
  const directRigReady = G.Assets && MIKO_DIRECT_RIG_KEYS.every(k => G.Assets.ok(k));
  if (directRigReady && !o.staticSprite) {
    const baseScale = (o.scale || 1.3) / 1.3;
    const faceLeft = Math.cos(dirA) < -0.08;
    const poseScale = pose === 'plan' ? 1.035 : pose === 'fin' ? 1.055 : 1;
    const rigScale = 88 * baseScale / 1536;
    const walk = stepWave * walkK;
    const breathe = Math.sin(t * 2.25);
    const idleAccent = Math.pow(Math.max(0, Math.sin(t * 0.72 - 0.8)), 7) * idleK;
    const loose = 0.28 + walkK * 0.95 + dashK * 1.7 + idleAccent * 0.55;
    const bowA = Math.sin(t * 3.7 + 0.8) * 0.016 * loose + dashK * 0.032 + idleAccent * 0.012;
    const hairLeftA = Math.sin(t * 3.25 + 0.4) * 0.018 * loose + walk * 0.012 + dashK * 0.04;
    const hairRightA = -Math.sin(t * 3.5 + 1.1) * 0.016 * loose - walk * 0.01 - dashK * 0.034;
    const armLeftA = -walk * 0.034 + breathe * 0.004 * idleK - dashK * 0.025 + finK * 0.016;
    const armRightA = walk * 0.03 - breathe * 0.003 * idleK + dashK * 0.028 - finK * 0.035;
    const headA = Math.sin(t * 2.15) * 0.009 * idleK + idleAccent * 0.018 -
      walk * 0.006 - dashK * 0.014 + finK * 0.012;
    const leftLift = Math.max(0, walk) * 17;
    const rightLift = Math.max(0, -walk) * 17;

    ctx.save();
    ctx.translate(x, y + lev + bob);
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    if (!tint && !o.noShadow) {
      ctx.fillStyle = 'rgba(0,0,0,.4)';
      ctx.beginPath(); ctx.ellipse(0, 22 - lev, 17 * baseScale, 5.5 * baseScale, 0, 0, 6.2832); ctx.fill();
    }
    ctx.rotate(Math.cos(dirA) * (0.038 * walkK + 0.13 * dashK) +
      walk * 0.008 - finK * 0.04 + breathe * 0.004 * idleK);
    ctx.scale((faceLeft ? -1 : 1) * poseScale * (1 + dashK * 0.065), poseScale * (1 - dashK * 0.055));
    if (tint) {
      ctx.globalAlpha *= 0.58;
      ctx.globalCompositeOperation = 'lighter';
      ctx.filter = o.ghost === 'gold' ? 'sepia(1) saturate(2.4) brightness(1.35)' :
        o.ghost === 'pink' ? 'hue-rotate(285deg) saturate(1.5) brightness(1.45)' :
          'hue-rotate(145deg) saturate(.75) brightness(1.55)';
    }

    ctx.translate(0, 18);
    ctx.scale(rigScale, rigScale);
    ctx.translate(-512, -1368);
    const part = (key, px, py) => ctx.drawImage(G.Assets.get(key), px, py);
    const pivot = (px, py, angle, draw) => {
      ctx.save(); ctx.translate(px, py); ctx.rotate(angle); ctx.translate(-px, -py); draw(); ctx.restore();
    };

    // 所有坐标都来自原始 1024x1536 角色图；零姿态会逐像素重建原图。
    pivot(365, 300, bowA, () => part('mikoDirectBow', 176 - dashK * 10 - walk * 3, 157 + breathe * 3));
    pivot(425, 345, hairLeftA, () => part('mikoDirectHairLeft', 145 - dashK * 13 - walk * 5, 324 + breathe * 5));
    pivot(700, 600, hairRightA, () => part('mikoDirectHairRight', 568 - dashK * 8 - walk * 4, 547 + breathe * 5));
    pivot(390, 1230, walk * 0.038, () =>
      part('mikoDirectFootLeft', 294 - walk * 19, 1222 - leftLift));
    pivot(635, 1225, -walk * 0.038, () =>
      part('mikoDirectFootRight', 588 + walk * 19, 1216 - rightLift));
    part('mikoDirectBody', 222 + walk * 8, 546 + breathe * 4 - Math.abs(walk) * 1.2);
    pivot(430, 610, armLeftA, () => part('mikoDirectArmLeft', 222, 607));
    pivot(635, 640, armRightA, () => part('mikoDirectArmRightSword', 528, 632));
    pivot(535, 590, headA, () =>
      part('mikoDirectHead', 357 + idleAccent * 2, 182 + breathe * 7 - dashK * 5 - idleAccent * 4));

    ctx.restore();
    return;
  }

  const rigReady = false && G.Assets && MIKO_RIG_KEYS.every(k => G.Assets.ok(k));
  if (rigReady) {
    const baseScale = (o.scale || 1.3) / 1.3;
    const faceLeft = Math.cos(dirA) < -0.08;
    const poseScale = pose === 'plan' ? 1.035 : pose === 'fin' ? 1.055 : 1;
    const rigScale = 82 * baseScale / 1120;
    const walk = Math.sin(t * 10) * mv;
    const breathe = Math.sin(t * 3.15);
    const loose = 0.3 + mv * 0.7 + dashK * 1.8;
    const hairA = Math.sin(t * 4.4 + 0.7) * 0.018 * loose + dashK * 0.055;
    const bowA = Math.sin(t * 5.2 + 1.2) * 0.026 * loose + dashK * 0.07;
    const skirtA = Math.sin(t * 6.2) * 0.008 * mv + dashK * 0.018 + finK * 0.012;
    const armLeftA = walk * -0.028 - dashK * 0.045 + finK * 0.025;
    const armRightA = walk * 0.024 + dashK * 0.055 - finK * 0.055;
    const headA = Math.sin(t * 2.6) * 0.009 - dashK * 0.028 + finK * 0.018;

    ctx.save();
    ctx.translate(x, y + lev + bob * 0.35);
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    if (!tint && !o.noShadow) {
      ctx.fillStyle = 'rgba(0,0,0,.4)';
      ctx.beginPath(); ctx.ellipse(0, 22 - lev, 17 * baseScale, 5.5 * baseScale, 0, 0, 6.2832); ctx.fill();
    }
    ctx.rotate(Math.cos(dirA) * (0.04 * mv + 0.13 * dashK) - finK * 0.04);
    ctx.scale((faceLeft ? -1 : 1) * poseScale * (1 + dashK * 0.065), poseScale * (1 - dashK * 0.055));
    if (tint) {
      ctx.globalAlpha *= 0.58;
      ctx.globalCompositeOperation = 'lighter';
      ctx.filter = o.ghost === 'gold' ? 'sepia(1) saturate(2.4) brightness(1.35)' :
        o.ghost === 'pink' ? 'hue-rotate(285deg) saturate(1.5) brightness(1.45)' :
          'hue-rotate(145deg) saturate(.75) brightness(1.55)';
    }

    ctx.scale(rigScale, rigScale);
    ctx.translate(-360, -1080);
    const part = (key, px, py, w, h) => {
      const im = G.Assets.get(key);
      if (w && h) ctx.drawImage(im, px, py, w, h);
      else ctx.drawImage(im, px, py);
    };
    const pivot = (px, py, angle, draw) => {
      ctx.save(); ctx.translate(px, py); ctx.rotate(angle); ctx.translate(-px, -py); draw(); ctx.restore();
    };

    // 后层：脚、蝴蝶结与两束长发。
    pivot(305, 930, walk * 0.027, () => part('mikoRigFootLeft', 220 - walk * 5, 915 - Math.abs(walk) * 5));
    pivot(445, 925, -walk * 0.027, () => part('mikoRigFootRight', 400 + walk * 5, 895 - Math.abs(walk) * 5));
    pivot(220, 175, bowA, () => part('mikoRigBow', 62 - dashK * 13, 77, 255, 290));
    pivot(258, 145, hairA, () => part('mikoRigHairLeft', 130 - dashK * 18, 105 + breathe * 2));
    pivot(445, 145, -hairA * 0.72, () => part('mikoRigHairRight', 355 - dashK * 10, 110 + breathe * 2));

    // 袖子的关节延伸片先画在身体后面，由躯干遮住接缝；刀随持刀手共同旋转。
    pivot(475, 410, armRightA, () => {
      pivot(510, 650, -0.29 - walk * 0.012 - finK * 0.09, () => part('mikoRigSword', 442, 550));
      part('mikoRigSleeveRight', 415, 405);
    });
    pivot(245, 410, armLeftA, () => part('mikoRigSleeveLeft', 115, 400));
    part('mikoRigTorso', 235, 390 + breathe * 2);
    pivot(360, 555, skirtA, () => part('mikoRigSkirt', 170 + walk * 2, 545 + breathe * 2));

    // 头部最后绘制以遮住颈部接缝；轻微呼吸和转动避免整张贴图的僵硬感。
    pivot(360, 410, headA, () => part('mikoRigHead', 205, 104 + breathe * 5 - dashK * 4));
    ctx.restore();
    return;
  }

  // 正式玩家外观使用参考立绘生成的透明 Q 版精灵；下方程序化造型仅作缺图兜底。
  if (G.Assets && G.Assets.ok('miko')) {
    const im = G.Assets.get('miko');
    const baseScale = (o.scale || 1.3) / 1.3;
    const size = 88 * baseScale;
    const faceLeft = Math.cos(dirA) < -0.08;
    const poseScale = pose === 'plan' ? 1.035 : pose === 'fin' ? 1.055 : 1;
    ctx.save();
    ctx.translate(x, y + lev + bob * 0.45);
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    if (!tint && !o.noShadow) {
      ctx.fillStyle = 'rgba(0,0,0,.4)';
      ctx.beginPath(); ctx.ellipse(0, 22 - lev, 17 * baseScale, 5.5 * baseScale, 0, 0, 6.2832); ctx.fill();
    }
    ctx.rotate(Math.cos(dirA) * (0.045 * mv + 0.14 * dashK) - finK * 0.045);
    ctx.scale((faceLeft ? -1 : 1) * poseScale * (1 + dashK * 0.07), poseScale * (1 - dashK * 0.06));
    if (tint) {
      ctx.globalAlpha *= 0.58;
      ctx.globalCompositeOperation = 'lighter';
      ctx.filter = o.ghost === 'gold' ? 'sepia(1) saturate(2.4) brightness(1.35)' :
        o.ghost === 'pink' ? 'hue-rotate(285deg) saturate(1.5) brightness(1.45)' :
          'hue-rotate(145deg) saturate(.75) brightness(1.55)';
    }
    ctx.drawImage(im, -size / 2, -size + 22, size, size);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(x, y + lev);
  const S = o.scale || 1.3;
  ctx.scale(S, S);
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  if (!tint && !o.noShadow) {
    ctx.fillStyle = 'rgba(0,0,0,.38)';
    ctx.beginPath(); ctx.ellipse(0, 21 - lev, 16, 5.5, 0, 0, 6.2832); ctx.fill();
  }
  ctx.rotate(Math.cos(dirA) * 0.075 * mv + Math.cos(dirA) * 0.19 * dashK);

  // 大红后蝴蝶结：保留参考图最醒目的识别点。
  ctx.save();
  ctx.translate(-5 + hairX * 0.2, -19 + bob + hairY * 0.15);
  ctx.rotate(-0.1 - sway * 0.04);
  ctx.fillStyle = C('#bd352b'); ctx.strokeStyle = C('#76221f'); ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(-1, 0); ctx.quadraticCurveTo(-9, -8, -12, -2); ctx.quadraticCurveTo(-11, 4, -1, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1, 0); ctx.quadraticCurveTo(9, -7, 12, -1); ctx.quadraticCurveTo(9, 5, 1, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-2, 2); ctx.lineTo(-10 + hairX * 0.5, 13 + hairY * 0.4); ctx.lineTo(-3 + hairX * 0.3, 10 + hairY * 0.3); ctx.lineTo(1, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(2, 2); ctx.lineTo(6 + hairX * 0.55, 13 + hairY * 0.4); ctx.lineTo(10 + hairX * 0.65, 8 + hairY * 0.25); ctx.lineTo(1, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C('#8f2722'); ctx.beginPath(); ctx.arc(0, 1, 2.5, 0, 6.2832); ctx.fill();
  ctx.restore();

  // 深蓝长发，移动与冲刺时向反方向拖曳。
  ctx.fillStyle = C('#172139'); ctx.strokeStyle = C('#0d1325'); ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-8.5, -20 + bob);
  ctx.quadraticCurveTo(-15 + hairX * 0.45, -7 + bob, -15 + hairX, 9 + bob + hairY);
  ctx.lineTo(-10 + hairX * 1.15, 18 + bob + hairY);
  ctx.lineTo(-3 + hairX * 0.82, 11 + bob + hairY * 0.7);
  ctx.lineTo(3 + hairX * 1.05, 18 + bob + hairY);
  ctx.lineTo(10 + hairX * 0.7, 9 + bob + hairY * 0.8);
  ctx.quadraticCurveTo(15 + hairX * 0.45, -7 + bob, 8.5, -20 + bob);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  if (!tint) {
    ctx.strokeStyle = 'rgba(83,103,145,.55)'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(-5.5, -15 + bob); ctx.quadraticCurveTo(-7 + hairX * 0.4, 0, -5 + hairX * 0.7, 10 + hairY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, -15 + bob); ctx.quadraticCurveTo(7 + hairX * 0.35, 0, 4 + hairX * 0.72, 11 + hairY); ctx.stroke();
  }

  // 草履与白足袋。
  const stepK = Math.sin(t * 10) * 1.5 * mv;
  for (let side = -1; side <= 1; side += 2) {
    ctx.fillStyle = C('#efe7d7'); ctx.strokeStyle = C('#6d5140'); ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.ellipse(side * 5 + side * stepK, 19 - Math.abs(stepK) * 0.25, 4.2, 2.2, 0, 0, 6.2832); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = C('#a93b31'); ctx.beginPath(); ctx.moveTo(side * 5 + side * stepK, 17.8); ctx.lineTo(side * 7 + side * stepK, 20); ctx.stroke();
  }

  // 红袴：加宽下摆并以明暗线表现褶皱。
  const skirtSway = sway * 0.75 + dashK * 3.8 + finK * 2.2;
  ctx.fillStyle = C('#b8342b'); ctx.strokeStyle = C('#70221f'); ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-7.8, -1 + bob); ctx.lineTo(7.8, -1 + bob);
  ctx.lineTo(12 + skirtSway, 17.5); ctx.quadraticCurveTo(skirtSway, 20.5, -12 + skirtSway, 17.5);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C('#d04738');
  ctx.beginPath(); ctx.moveTo(-1, 0 + bob); ctx.lineTo(3 + skirtSway * 0.45, 18.7); ctx.lineTo(-3 + skirtSway * 0.35, 18.7); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = C('#7e2722'); ctx.lineWidth = 0.75;
  for (const px of [-6, 0, 6]) {
    ctx.beginPath(); ctx.moveTo(px, 1 + bob); ctx.lineTo(px + skirtSway * 0.55, 17.7); ctx.stroke();
  }

  // 后侧宽袖。
  const backArmA = Math.PI + Math.sin(t * 4.5) * 0.13 - mv * 0.25 - finK * 0.25;
  ctx.save(); ctx.translate(-5.8, -7 + bob); ctx.rotate(backArmA);
  ctx.fillStyle = C('#e9e1d2'); ctx.strokeStyle = C('#9e9487'); ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(0, -3.8); ctx.lineTo(9, -5.5); ctx.lineTo(15, -2.8); ctx.lineTo(13, 6); ctx.lineTo(5, 7.5); ctx.lineTo(0, 3.4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C('#9e302a'); ctx.beginPath(); ctx.moveTo(10, 3.2); ctx.lineTo(13.5, 4.2); ctx.lineTo(12.5, 6); ctx.lineTo(8.5, 6.3); ctx.closePath(); ctx.fill();
  ctx.restore();

  // 白小袖本体、红襟与腰带。
  ctx.fillStyle = C('#f1eadc'); ctx.strokeStyle = C('#9e9487'); ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(-7.5, -10 + bob); ctx.quadraticCurveTo(0, -13 + bob, 7.5, -10 + bob);
  ctx.lineTo(8.5, 0.5 + bob); ctx.lineTo(-8.5, 0.5 + bob); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = C('#b53a31'); ctx.lineWidth = 1.45;
  ctx.beginPath(); ctx.moveTo(-4.8, -10 + bob); ctx.lineTo(0.6, -3.2 + bob); ctx.lineTo(5, -9.5 + bob); ctx.stroke();
  ctx.fillStyle = C('#9f2c27'); rr(ctx, -8, -1.2 + bob, 16, 3.4, 1); ctx.fill();

  // 前侧宽袖与持刀手，方向跟随鼠标/移动朝向。
  const armA = dirA + (pose === 'fin' ? -0.16 : 0);
  const shx = Math.cos(armA), shy = Math.sin(armA);
  ctx.save(); ctx.translate(5.8, -7 + bob); ctx.rotate(armA);
  ctx.fillStyle = C('#f1eadc'); ctx.strokeStyle = C('#9e9487'); ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(0, -3.8); ctx.lineTo(8, -5.4); ctx.lineTo(14, -3); ctx.lineTo(13, 5.8); ctx.lineTo(5, 7); ctx.lineTo(0, 3.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C('#a42f29'); ctx.beginPath(); ctx.moveTo(9, 3); ctx.lineTo(13.2, 3.8); ctx.lineTo(12.4, 5.7); ctx.lineTo(8.3, 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C('#f0c6aa'); ctx.beginPath(); ctx.arc(14, 0, 2.2, 0, 6.2832); ctx.fill();
  // 刀柄、鍔与深色刀身。
  ctx.fillStyle = C('#242536'); rr(ctx, 12.5, -2.1, 8.5, 4.2, 1.5); ctx.fill();
  ctx.strokeStyle = C('#b7924d'); ctx.lineWidth = 0.8;
  for (let k = 15; k < 20; k += 2.2) { ctx.beginPath(); ctx.moveTo(k, -2); ctx.lineTo(k + 1.2, 2); ctx.stroke(); }
  ctx.fillStyle = C('#c9a55b'); ctx.fillRect(20.5, -3.2, 1.8, 6.4);
  ctx.fillStyle = C('#343846'); ctx.beginPath(); ctx.moveTo(22, -1.8); ctx.lineTo(37, -1.1); ctx.lineTo(37, 1.1); ctx.lineTo(22, 1.8); ctx.closePath(); ctx.fill();
  if (!tint) { ctx.strokeStyle = 'rgba(235,239,245,.7)'; ctx.lineWidth = 0.65; ctx.beginPath(); ctx.moveTo(23, -1.1); ctx.lineTo(36, -0.6); ctx.stroke(); }
  ctx.restore();

  // 颈部与偏大的 Q 版头部。
  ctx.fillStyle = C('#efc7ac'); rr(ctx, -2.2, -13 + bob, 4.4, 4.8, 1.4); ctx.fill();
  ctx.fillStyle = C('#f3ceb3'); ctx.strokeStyle = C('#9c725f'); ctx.lineWidth = 0.75;
  ctx.beginPath(); ctx.arc(0, -19 + bob, 8.1, 0, 6.2832); ctx.fill(); ctx.stroke();

  // 齐刘海与姬发式侧鬓。
  ctx.fillStyle = C('#172139'); ctx.strokeStyle = C('#0d1325'); ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.arc(0, -20.4 + bob, 8.4, Math.PI * 0.9, Math.PI * 2.1); ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-7.6, -21.5 + bob); ctx.lineTo(-7, -10 + bob); ctx.lineTo(-3.8, -12 + bob); ctx.lineTo(-3.2, -21.8 + bob);
  ctx.lineTo(-1.4, -15.2 + bob); ctx.lineTo(0, -22 + bob); ctx.lineTo(1.8, -15.1 + bob); ctx.lineTo(3.4, -21.7 + bob);
  ctx.lineTo(4.1, -12 + bob); ctx.lineTo(7, -10.5 + bob); ctx.lineTo(7.6, -21.5 + bob); ctx.closePath(); ctx.fill();
  if (!tint) {
    // 朝向变化只作用于眼神，保持Q版正面辨识度。
    const lookX = Math.cos(dirA) * 0.75, lookY = Math.sin(dirA) * 0.28;
    ctx.fillStyle = '#f8f2e8';
    ctx.beginPath(); ctx.ellipse(-2.65, -18.2 + bob, 1.45, 1.1, 0, 0, 6.2832); ctx.ellipse(2.65, -18.2 + bob, 1.45, 1.1, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#202437';
    ctx.beginPath(); ctx.arc(-2.65 + lookX, -18.1 + bob + lookY, 0.75, 0, 6.2832); ctx.arc(2.65 + lookX, -18.1 + bob + lookY, 0.75, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = '#a46f68'; ctx.lineWidth = 0.55;
    ctx.beginPath(); ctx.moveTo(-0.9, -14.9 + bob); ctx.quadraticCurveTo(0, -14.4 + bob, 0.9, -14.9 + bob); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.36)'; ctx.beginPath(); ctx.arc(-2, -23, 3, 3.4, 5.2); ctx.stroke();
  }
  ctx.restore();
};

// ---------- 玩家 ----------
G.Player = class {
  constructor() {
    this.x = G.WORLD_W / 2; this.y = G.WORLD_H / 2; this.r = 13;
    this.maxHp = 100; this.hp = 100;
    this.maxMana = 100; this.mana = 100;
    this.level = 1; this.xp = 0; this.xpNext = 8;
    this.state = 'move';
    this.dir = 0; this.moveK = 0; this.animT = 0; this.walkT = 0;
    this.iTime = 0;
    this.stats = null; // 由 game 重算
  }
  update(dt, game) {
    this.animT += dt;
    if (this.iTime > 0) this.iTime -= dt;
    // 规划、冲刺与收招期间不进行自然回灵，必须真正回到走位阶段才能恢复。
    if (this.state === 'move' && (!game || game.manaSealT <= 0) &&
      (!game || !game.canNaturalManaRegen || game.canNaturalManaRegen()))
      this.mana = Math.min(this.maxMana, this.mana + this.stats.regen * dt);
    if (this.state !== 'move') { this.moveK = Math.max(0, this.moveK - dt * 6); return; }
    const ax = G.Input.axis();
    const sp = this.stats.speed;
    const oldX = this.x, oldY = this.y;
    const next = G.util.fieldClamp(this.x + ax.x * sp * dt,
      this.y + ax.y * sp * dt, this.r + 18);
    this.x = next.x;
    this.y = next.y;
    const traveled = G.util.dist(oldX, oldY, this.x, this.y);
    const moving = traveled > 0.05 ? 1 : 0;
    if (moving) this.walkT += traveled * 0.027;
    this.moveK = G.util.lerp(this.moveK, moving, 1 - Math.pow(0.001, dt));
    if (moving) this.dir = Math.atan2(ax.y, ax.x);
  }
  drawLocator(ctx, game) {
    let nearby = 0;
    const radius2 = 185 * 185;
    for (const e of game.enemies) {
      if (!e.dead && G.util.dist2(this.x, this.y, e.x, e.y) < radius2) nearby++;
      if (nearby >= 12) break;
    }
    if (nearby < 12) {
      for (const b of game.bullets) {
        if (!b.dead && G.util.dist2(this.x, this.y, b.x, b.y) < radius2) nearby++;
        if (nearby >= 12) break;
      }
    }
    const pressure = G.util.clamp(nearby / 10, 0, 1);
    const size = 160, half = size / 2;
    if (!this._locatorMask) {
      this._locatorMask = document.createElement('canvas');
      this._locatorRing = document.createElement('canvas');
      this._locatorMask.width = this._locatorMask.height = size;
      this._locatorRing.width = this._locatorRing.height = size;
    }
    const mask = this._locatorMask, ring = this._locatorRing;
    const mctx = mask.getContext('2d'), rctx = ring.getContext('2d');
    let dir = this.dir;
    if (this.state === 'plan') {
      const aim = game.pointerWorld();
      dir = G.util.angTo(this.x, this.y, aim.x, aim.y);
    }
    const pose = this.state === 'plan' ? 'plan' :
      (this.state === 'dash' ? 'dash' : (this.state === 'fin' ? 'fin' : 'move'));

    // 先把当前骨骼姿势合成为一张完整剪影，拆件之间不会各自出现描边。
    mctx.setTransform(1, 0, 0, 1, 0, 0);
    mctx.globalCompositeOperation = 'source-over';
    mctx.globalAlpha = 1;
    mctx.clearRect(0, 0, size, size);
    mctx.save();
    mctx.translate(half - this.x, half - this.y);
    G.drawMiko(mctx, this.x, this.y, {
      dir, t: this.animT, walkT: this.walkT, moving: this.moveK,
      pose, noShadow: true
    });
    mctx.restore();
    mctx.globalCompositeOperation = 'source-in';
    mctx.fillStyle = '#ffffff';
    mctx.fillRect(0, 0, size, size);
    mctx.globalCompositeOperation = 'source-over';

    // 膨胀剪影后减去本体，只留下头发、袖子、裙摆与武器的真实外轮廓。
    rctx.setTransform(1, 0, 0, 1, 0, 0);
    rctx.globalCompositeOperation = 'source-over';
    rctx.globalAlpha = 1;
    rctx.clearRect(0, 0, size, size);
    const width = 2.35 + pressure * 0.65;
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      rctx.drawImage(mask, Math.cos(a) * width, Math.sin(a) * width);
    }
    rctx.globalCompositeOperation = 'destination-out';
    rctx.drawImage(mask, 0, 0);
    rctx.globalCompositeOperation = 'source-in';
    rctx.fillStyle = '#b8fff1';
    rctx.fillRect(0, 0, size, size);
    rctx.globalCompositeOperation = 'source-over';

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.48 + pressure * 0.22;
    ctx.shadowColor = '#65f4df';
    ctx.shadowBlur = 6 + pressure * 6;
    ctx.drawImage(ring, this.x - half, this.y - half);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.78 + pressure * 0.18;
    ctx.drawImage(ring, this.x - half, this.y - half);
    ctx.restore();
  }
  draw(ctx, game) {
    // 规划时法阵
    if (this.state === 'plan') {
      const t = this.animT;
      ctx.save();
      ctx.translate(this.x, this.y + 16);
      ctx.globalCompositeOperation = 'lighter';
      if (G.Assets.ok('circle')) {
        const img = G.Assets.get('circle');
        ctx.globalAlpha = 0.85;
        ctx.save(); ctx.scale(1, 0.62); ctx.rotate(t * 0.9);
        ctx.drawImage(img, -52, -52, 104, 104);
        ctx.restore();
        ctx.globalAlpha = 0.5;
        ctx.save(); ctx.scale(1, 0.62); ctx.rotate(-t * 0.6);
        ctx.drawImage(img, -34, -34, 68, 68);
        ctx.restore();
      } else {
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = '#9fe8ff'; ctx.lineWidth = 1.6;
        ctx.save(); ctx.rotate(t * 1.2);
        ctx.setLineDash([10, 7]); ctx.beginPath(); ctx.arc(0, 0, 30, 0, 6.2832); ctx.stroke();
        ctx.restore();
        ctx.save(); ctx.rotate(-t * 0.8);
        ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.arc(0, 0, 22, 0, 6.2832); ctx.stroke();
        ctx.restore();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.25 + Math.sin(t * 4) * 0.1;
        const spr = G.FX.sprites.cyan;
        ctx.drawImage(spr, -40, -40, 80, 80);
      }
      ctx.restore();
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    let alpha = 1;
    if (this.iTime > 0 && this.state === 'move') alpha = 0.5 + Math.sin(this.animT * 40) * 0.3;
    let dir = this.dir;
    if (this.state === 'plan') {
      const aim = game.pointerWorld();
      dir = G.util.angTo(this.x, this.y, aim.x, aim.y);
    }
    G.drawMiko(ctx, this.x, this.y, {
      dir, t: this.animT, walkT: this.walkT, moving: this.moveK,
      pose: this.state === 'plan' ? 'plan' : (this.state === 'dash' ? 'dash' : (this.state === 'fin' ? 'fin' : 'move')),
      alpha
    });
  }
};

// ---------- 敌人基类 ----------
class EnemyBase {
  constructor(x, y, hpMul) {
    this.x = x; this.y = y;
    this.kx = 0; this.ky = 0;
    this.hpMul = hpMul;
    this.dead = false; this.pinned = false;
    this.seal = -1; this.sealCount = 0; this.flashT = 0; this.vulnT = 0; this.freezeT = 0; this.wardT = 0;
    this.spawnT = 0.55; this.animT = G.util.rand(0, 10);
    this.ofuda = 0; // 符札层数
    this.woundAng = null; this.woundT = 0; // 居合斩击伤
  }
  get lockable() { return this.spawnT <= 0.2 && !this.dead; }
  hurt(dmg, game, opt) {
    if (this.dead) return false;
    if (this.soulLink && this.soulLink.active) {
      this.flashT = 0.14;
      this.soulLink.pulse = 0.32;
      if (game && (!this.soulLink.lastBlockT || game.time - this.soulLink.lastBlockT > 0.28)) {
        this.soulLink.lastBlockT = game.time;
        G.FX.text(this.x, this.y - this.r - 10, '共 生 ・ 无 效', {
          size: 14, color: '#ff7b82', crit: true
        });
      }
      return false;
    }
    if (this.vulnT > 0) dmg *= 1.25;
    if (this.wardT > 0) dmg *= 0.7;
    this.hp -= dmg;
    this.flashT = 0.14;
    if (opt && opt.kb) { this.kx += opt.kb.x; this.ky += opt.kb.y; }
    if (this.hp <= 0) { this.dead = true; return true; }
    return false;
  }
  baseUpdate(dt) {
    this.animT += dt;
    if (this.flashT > 0) this.flashT -= dt;
    if (this.vulnT > 0) this.vulnT -= dt;
    if (this.freezeT > 0) this.freezeT -= dt;
    if (this.wardT > 0) this.wardT -= dt;
    if (this.spawnT > 0) this.spawnT -= dt;
    if (this.woundAng != null) this.woundT += dt;
    this.x += this.kx * dt; this.y += this.ky * dt;
    this.kx *= Math.pow(0.02, dt); this.ky *= Math.pow(0.02, dt);
    const bounded = G.util.fieldClamp(this.x, this.y, (this.r || 20) + 10);
    this.x = bounded.x;
    this.y = bounded.y;
  }
  // 斩击伤：沿轨迹切线的发光切痕，闪烁后淡出
  drawWound(ctx) {
    if (this.woundAng == null) return;
    const age = this.woundT;
    const fade = age < 1.2 ? 1 : Math.max(0, 1 - (age - 1.2) / 0.6);
    if (fade <= 0) { this.woundAng = null; return; }
    const L = this.r * 2.8;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.woundAng);
    ctx.globalCompositeOperation = 'lighter';
    const flick = 0.7 + Math.sin(age * 28) * 0.3;
    ctx.globalAlpha = fade * flick * 0.55;
    const spr = G.FX.sprites.cyan;
    ctx.drawImage(spr, -L * 0.7, -L * 0.28, L * 1.4, L * 0.56);
    ctx.globalAlpha = fade * flick;
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.lineTo(L / 2, 0); ctx.stroke();
    ctx.globalAlpha = fade * flick * 0.8;
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#bff0ff';
    ctx.beginPath(); ctx.moveTo(-L * 0.38, -2.5); ctx.lineTo(L * 0.3, -2.5); ctx.stroke();
    ctx.restore();
  }
  drawFrozen(ctx) {
    if (this.freezeT <= 0) return;
    const pulse = 0.7 + Math.sin(this.animT * 11) * 0.2;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = '#bff8ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.r * 1.25, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + this.animT * 0.35;
      const r0 = this.r * 0.88, r1 = this.r * 1.45;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.stroke();
    }
    ctx.restore();
  }
  drawWard(ctx) {
    if (this.wardT <= 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.45 + Math.sin(this.animT * 9) * 0.16;
    ctx.strokeStyle = '#ffe39a';
    ctx.lineWidth = 2.4;
    ctx.setLineDash([7, 6]);
    ctx.beginPath(); ctx.arc(0, 0, this.r * 1.45, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  drawSeal(ctx) {
    if (this.seal < 0) return;
    const t = this.animT;
    const y = this.y - this.r - 14 + Math.sin(t * 5) * 2;
    ctx.save();
    ctx.translate(this.x, y);
    ctx.rotate(Math.sin(t * 3) * 0.16);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.7;
    const spr = G.FX.sprites.gold;
    ctx.drawImage(spr, -16, -16, 32, 32);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f7f1de';
    ctx.fillRect(-4.5, -9, 9, 18);
    ctx.strokeStyle = '#c03a30'; ctx.lineWidth = 1.4;
    ctx.strokeRect(-4.5, -9, 9, 18);
    ctx.beginPath(); ctx.moveTo(-2.4, -5); ctx.lineTo(2.4, -5); ctx.moveTo(0, -5) ; ctx.lineTo(0, 5);
    ctx.moveTo(-2.4, 2); ctx.lineTo(2.4, 2);
    ctx.stroke();
    if (this.sealCount > 1) {
      ctx.font = 'bold 11px "Noto Serif SC", KaiTi, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,6,14,.9)';
      ctx.strokeText('×' + this.sealCount, 0, 11);
      ctx.fillStyle = '#ffe9a8';
      ctx.fillText('×' + this.sealCount, 0, 11);
    }
    ctx.restore();
  }
  drawFlash(ctx) {
    if (this.flashT <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, this.flashT * 9);
    const spr = G.FX.sprites.white;
    const s = this.r * 3;
    ctx.drawImage(spr, this.x - s, this.y - s, s * 2, s * 2);
    ctx.restore();
  }
  // 出生烟雾
  drawSpawn(ctx) {
    if (this.spawnT <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, this.spawnT * 2.4);
    ctx.fillStyle = '#171233';
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r * (1 + this.spawnT * 2), 0, 6.2832); ctx.fill();
    ctx.restore();
  }
  drawEliteMarker(ctx, glyph, color) {
    const y = this.y - this.r - 17 + Math.sin(this.animT * 4) * 2;
    ctx.save();
    ctx.translate(this.x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = 'rgba(10,8,24,.88)';
    ctx.strokeStyle = color || '#f2c979';
    ctx.lineWidth = 1.8;
    ctx.fillRect(-9, -9, 18, 18);
    ctx.strokeRect(-9, -9, 18, 18);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = color || '#ffe2a0';
    ctx.font = 'bold 12px "Noto Serif SC", KaiTi, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(glyph || '荒', 0, 1);
    ctx.restore();
  }
}

// ---------- 追踪妖怪：影妖 ----------
G.Chaser = class extends EnemyBase {
  constructor(x, y, hpMul) {
    super(x, y, hpMul);
    this.type = 'chaser'; this.r = 16;
    this.maxHp = this.hp = Math.round(30 * hpMul);
    this.speed = G.util.rand(66, 102);
    this.dmg = 8; this.xp = 2;
    this.wob = G.util.rand(0, 6.28);
  }
  update(dt, game) {
    this.baseUpdate(dt);
    if (this.pinned || this.spawnT > 0 || this.freezeT > 0) return;
    const p = game.player;
    const a = G.util.angTo(this.x, this.y, p.x, p.y) + Math.sin(this.animT * 2.2 + this.wob) * 0.5;
    this.x += Math.cos(a) * this.speed * dt;
    this.y += Math.sin(a) * this.speed * dt;
  }
  draw(ctx) {
    const t = this.animT, r = this.r;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = this.spawnT > 0 ? 0.4 : 1;
    // 体
    ctx.fillStyle = this.pinned ? '#3a2a6a' : '#241a3f';
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const a = i / 10 * 6.2832;
      const rr2 = r * (1 + Math.sin(t * 4 + i * 2.4) * 0.14);
      const px = Math.cos(a) * rr2, py = Math.sin(a) * rr2 * 0.92;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(150,110,255,.35)'; ctx.lineWidth = 1.5; ctx.stroke();
    // 尾
    ctx.strokeStyle = 'rgba(80,55,140,.5)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 5, r * 0.4);
      ctx.quadraticCurveTo(i * 8 + Math.sin(t * 5 + i) * 4, r + 8, i * 10 + Math.sin(t * 6 + i * 2) * 5, r + 15);
      ctx.stroke();
    }
    // 眼
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.ellipse(-4.5, -2, 2.2, 3, 0.2, 0, 6.2832);
    ctx.ellipse(4.5, -2, 2.2, 3, -0.2, 0, 6.2832);
    ctx.fill();
    ctx.restore();
    this.drawWound(ctx); this.drawFrozen(ctx); this.drawWard(ctx); this.drawSeal(ctx); this.drawFlash(ctx); this.drawSpawn(ctx);
  }
};

// ---------- 冲刺妖怪：突貫妖 ----------
G.Dasher = class extends EnemyBase {
  constructor(x, y, hpMul) {
    super(x, y, hpMul);
    this.type = 'dasher'; this.r = 18;
    this.maxHp = this.hp = Math.round(46 * hpMul);
    this.speed = 56; this.dmg = 13; this.xp = 3;
    this.st = 'roam'; this.stT = G.util.rand(1, 2.4);
    this.aimA = 0; this.dvx = 0; this.dvy = 0;
  }
  update(dt, game) {
    this.baseUpdate(dt);
    if (this.pinned || this.spawnT > 0 || this.freezeT > 0) return;
    const p = game.player;
    this.stT -= dt;
    if (this.st === 'roam') {
      const a = G.util.angTo(this.x, this.y, p.x, p.y);
      this.x += Math.cos(a) * this.speed * dt;
      this.y += Math.sin(a) * this.speed * dt;
      this.aimA = a;
      if (this.stT <= 0 && G.util.dist2(this.x, this.y, p.x, p.y) < 340 * 340) { this.st = 'aim'; this.stT = 0.68; }
    } else if (this.st === 'aim') {
      this.aimA = G.util.angLerp(this.aimA, G.util.angTo(this.x, this.y, p.x, p.y), 1 - Math.pow(0.01, dt));
      this.x += G.util.rand(-1, 1) * 30 * dt; this.y += G.util.rand(-1, 1) * 30 * dt;
      if (this.stT <= 0) {
        this.st = 'dash'; this.stT = 0.4;
        this.dvx = Math.cos(this.aimA) * 540; this.dvy = Math.sin(this.aimA) * 540;
        G.Audio.noise({ dur: 0.2, vol: 0.1, fFrom: 600, fTo: 2400, q: 2 });
      }
    } else if (this.st === 'dash') {
      this.x += this.dvx * dt; this.y += this.dvy * dt;
      if (this.stT <= 0) { this.st = 'rest'; this.stT = 0.7; }
    } else if (this.st === 'rest') {
      if (this.stT <= 0) { this.st = 'roam'; this.stT = G.util.rand(1.4, 2.6); }
    }
  }
  draw(ctx, game) {
    const t = this.animT, r = this.r;
    // 瞄准预警线
    if (this.st === 'aim') {
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(t * 26) * 0.2;
      ctx.strokeStyle = '#ff6a55'; ctx.lineWidth = 2.5;
      ctx.setLineDash([12, 9]);
      ctx.beginPath(); ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + Math.cos(this.aimA) * 460, this.y + Math.sin(this.aimA) * 460);
      ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
    }
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.aimA);
    ctx.globalAlpha = this.spawnT > 0 ? 0.4 : 1;
    if (this.st === 'dash') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.4; ctx.fillStyle = '#ff7a5a';
      ctx.beginPath(); ctx.ellipse(-r * 1.6, 0, r * 1.6, r * 0.6, 0, 0, 6.2832); ctx.fill();
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
    // 刺
    ctx.fillStyle = '#4a1c26';
    for (let i = -2; i <= 2; i++) {
      const a = i * 0.5;
      ctx.save(); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(r * 0.5, -4); ctx.lineTo(r + 8, 0); ctx.lineTo(r * 0.5, 4); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    // 体
    ctx.fillStyle = this.st === 'aim' ? '#6e2430' : '#571d29';
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.8, 0, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = 'rgba(255,110,90,.4)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.8, 0, 0, 6.2832); ctx.stroke();
    // 眼
    ctx.fillStyle = '#ff5a48';
    ctx.beginPath(); ctx.arc(r * 0.45, -4, 2.4, 0, 6.2832); ctx.arc(r * 0.45, 4, 2.4, 0, 6.2832); ctx.fill();
    ctx.restore();
    this.drawWound(ctx); this.drawFrozen(ctx); this.drawWard(ctx); this.drawSeal(ctx); this.drawFlash(ctx); this.drawSpawn(ctx);
  }
};

// ---------- 远程妖怪：呪面 ----------
G.Ranged = class extends EnemyBase {
  constructor(x, y, hpMul) {
    super(x, y, hpMul);
    this.type = 'ranged'; this.r = 17;
    this.maxHp = this.hp = Math.round(36 * hpMul);
    this.speed = 72; this.dmg = 8; this.xp = 3;
    this.projectileDmg = 12;
    this.castT = G.util.rand(1.2, 2.6);
    this.strafe = G.util.chance(0.5) ? 1 : -1;
  }
  update(dt, game) {
    this.baseUpdate(dt);
    if (this.pinned || this.spawnT > 0 || this.freezeT > 0) return;
    const p = game.player;
    const d = G.util.dist(this.x, this.y, p.x, p.y);
    const a = G.util.angTo(this.x, this.y, p.x, p.y);
    let mvA = null;
    if (d < 215) mvA = a + Math.PI;
    else if (d > 320) mvA = a;
    if (mvA != null) { this.x += Math.cos(mvA) * this.speed * dt; this.y += Math.sin(mvA) * this.speed * dt; }
    // 环绕
    this.x += Math.cos(a + Math.PI / 2) * this.strafe * 34 * dt;
    this.y += Math.sin(a + Math.PI / 2) * this.strafe * 34 * dt;
    if (G.util.chance(dt * 0.15)) this.strafe *= -1;
    this.castT -= dt;
    if (this.castT <= 0) {
      this.castT = 0.55 + (2.7 - 0.55) / (this.attackRate || 1);
      game.spawnBullet(this.x, this.y, a, 150, this.projectileDmg);
      G.Audio.shoot();
    }
  }
  draw(ctx) {
    const t = this.animT, r = this.r;
    ctx.save();
    ctx.translate(this.x, this.y + Math.sin(t * 2.6) * 3);
    ctx.rotate(Math.sin(t * 1.8) * 0.1);
    ctx.globalAlpha = this.spawnT > 0 ? 0.4 : 1;
    // 咒光蓄力
    if (this.castT < 0.55) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = (0.55 - this.castT) * 1.6;
      const spr = G.FX.sprites.purple;
      ctx.drawImage(spr, -r * 2, -r * 2, r * 4, r * 4);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
    // 下摆影
    ctx.fillStyle = 'rgba(60,40,110,.55)';
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, 4); ctx.lineTo(r * 0.8, 4);
    ctx.lineTo(r * 0.4 + Math.sin(t * 4) * 3, r + 10); ctx.lineTo(-r * 0.4 + Math.sin(t * 4 + 2) * 3, r + 10);
    ctx.closePath(); ctx.fill();
    // 面具
    ctx.fillStyle = '#e8e2d2';
    ctx.beginPath(); ctx.ellipse(0, -2, r * 0.72, r * 0.9, 0, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = 'rgba(120,90,60,.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, -2, r * 0.72, r * 0.9, 0, 0, 6.2832); ctx.stroke();
    // 五官
    ctx.fillStyle = '#1a1424';
    ctx.beginPath(); ctx.ellipse(-4, -5, 2, 3.2, 0.3, 0, 6.2832); ctx.ellipse(4, -5, 2, 3.2, -0.3, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#3048a8'; ctx.fillRect(-1.5, -r * 0.9 - 2, 3, 4);
    ctx.strokeStyle = '#a03028'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-3, 3); ctx.quadraticCurveTo(0, 5.5, 3, 3); ctx.stroke();
    ctx.restore();
    this.drawWound(ctx); this.drawFrozen(ctx); this.drawWard(ctx); this.drawSeal(ctx); this.drawFlash(ctx); this.drawSpawn(ctx);
  }
};

// ---------- 灯蛾：高速低血量，围绕巫女切入 ----------
G.Moth = class extends EnemyBase {
  constructor(x, y, hpMul) {
    super(x, y, hpMul);
    this.type = 'moth'; this.r = 13;
    this.maxHp = this.hp = Math.round(24 * hpMul);
    this.speed = G.util.rand(118, 146); this.dmg = 7; this.xp = 2;
    this.phase = G.util.rand(0, Math.PI * 2);
  }
  update(dt, game) {
    this.baseUpdate(dt);
    if (this.pinned || this.spawnT > 0 || this.freezeT > 0) return;
    const p = game.player;
    const a = G.util.angTo(this.x, this.y, p.x, p.y) +
      Math.sin(this.animT * 5.5 + this.phase) * 0.82;
    this.x += Math.cos(a) * this.speed * dt;
    this.y += Math.sin(a) * this.speed * dt;
  }
  draw(ctx) {
    const flap = 0.55 + Math.abs(Math.sin(this.animT * 10)) * 0.55;
    ctx.save(); ctx.translate(this.x, this.y);
    ctx.globalAlpha = this.spawnT > 0 ? 0.4 : 1;
    ctx.fillStyle = 'rgba(132,106,220,.78)';
    ctx.beginPath(); ctx.ellipse(-8, 0, 9 * flap, 5, -0.55, 0, Math.PI * 2);
    ctx.ellipse(8, 0, 9 * flap, 5, 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#231936'; ctx.beginPath(); ctx.ellipse(0, 1, 4.5, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff0a8'; ctx.beginPath(); ctx.arc(0, -4, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    this.drawWound(ctx); this.drawFrozen(ctx); this.drawWard(ctx); this.drawSeal(ctx); this.drawFlash(ctx); this.drawSpawn(ctx);
  }
};

// ---------- 石灯守：缓慢重甲，护壳会周期性恢复 ----------
G.Guardian = class extends EnemyBase {
  constructor(x, y, hpMul) {
    super(x, y, hpMul);
    this.type = 'guardian'; this.r = 24;
    this.maxHp = this.hp = Math.round(82 * hpMul);
    this.speed = 43; this.dmg = 15; this.xp = 5;
    this.shell = 1; this.shellT = 6;
    this.guardAng = G.util.rand(0, Math.PI);
  }
  hurt(dmg, game, opt) {
    if (this.soulLink && this.soulLink.active) return super.hurt(dmg, game, opt);
    if (this.shell > 0) {
      this.shell = 0; this.shellT = 6;
      let aligned = false;
      if (opt && opt.ang != null) {
        let da = Math.abs(opt.ang - this.guardAng) % Math.PI;
        da = Math.min(da, Math.PI - da);
        aligned = da <= 0.34;
      }
      dmg *= aligned ? 1.35 : 0.42;
      G.FX.ring(this.x, this.y, this.r * 1.8, 'gold', 4, 0.35);
      G.FX.text(this.x, this.y - 38, aligned ? '破 势' : '甲 破', {
        size: aligned ? 18 : 14, color: aligned ? '#ffffff' : '#ffe2a0', crit: aligned
      });
      if (aligned) {
        G.FX.slash(this.x, this.y, this.guardAng, this.r * 5, 'cyan');
        G.FX.shake(5, 0.18);
      }
    }
    return super.hurt(dmg, game, opt);
  }
  update(dt, game) {
    this.baseUpdate(dt);
    if (!this.shell) {
      this.shellT -= dt;
      if (this.shellT <= 0) { this.shell = 1; G.FX.ring(this.x, this.y, 42, 'gold', 2, 0.3); }
    }
    if (this.pinned || this.spawnT > 0 || this.freezeT > 0) return;
    const a = G.util.angTo(this.x, this.y, game.player.x, game.player.y);
    this.x += Math.cos(a) * this.speed * dt;
    this.y += Math.sin(a) * this.speed * dt;
  }
  draw(ctx) {
    ctx.save(); ctx.translate(this.x, this.y);
    ctx.globalAlpha = this.spawnT > 0 ? 0.4 : 1;
    ctx.fillStyle = '#353044'; ctx.strokeStyle = this.shell ? '#d8b66a' : '#6b6072'; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2 + Math.PI / 8;
      const px = Math.cos(a) * this.r, py = Math.sin(a) * this.r;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffb85c'; ctx.fillRect(-7, -5, 14, 10);
    ctx.fillStyle = '#251819'; ctx.fillRect(-3, -3, 6, 6);
    if (this.shell) {
      ctx.save(); ctx.rotate(this.guardAng);
      ctx.strokeStyle = '#fff0b0'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(20, 0); ctx.stroke();
      ctx.fillStyle = '#fff0b0';
      ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(14, -5); ctx.lineTo(14, 5); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    this.drawWound(ctx); this.drawFrozen(ctx); this.drawWard(ctx); this.drawSeal(ctx); this.drawFlash(ctx); this.drawSpawn(ctx);
  }
};

// ---------- 祷面：保持距离并周期性治愈附近妖怪 ----------
G.Chanter = class extends EnemyBase {
  constructor(x, y, hpMul) {
    super(x, y, hpMul);
    this.type = 'chanter'; this.r = 18;
    this.maxHp = this.hp = Math.round(48 * hpMul);
    this.speed = 62; this.dmg = 9; this.xp = 5;
    this.prayerT = G.util.rand(2.4, 4);
  }
  update(dt, game) {
    this.baseUpdate(dt);
    if (this.pinned || this.spawnT > 0 || this.freezeT > 0) return;
    const p = game.player;
    const d = G.util.dist(this.x, this.y, p.x, p.y);
    const a = G.util.angTo(this.x, this.y, p.x, p.y);
    if (d < 300) { this.x -= Math.cos(a) * this.speed * dt; this.y -= Math.sin(a) * this.speed * dt; }
    else if (d > 430) { this.x += Math.cos(a) * this.speed * dt; this.y += Math.sin(a) * this.speed * dt; }
    this.prayerT -= dt;
    if (this.prayerT <= 0) {
      this.prayerT = 4.2;
      let healed = 0;
      for (const e of game.enemies) {
        if (e.dead || e === this || e.hp >= e.maxHp) continue;
        if (G.util.dist2(this.x, this.y, e.x, e.y) > 210 * 210) continue;
        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.1);
        G.FX.glow(e.x, e.y, 'teal', 16, 0.35);
        if (++healed >= 6) break;
      }
      G.FX.ring(this.x, this.y, 210, 'teal', 3, 0.48);
      G.FX.text(this.x, this.y - 38, '祷', { size: 18, color: '#a8ffdb', crit: true });
    }
  }
  draw(ctx) {
    ctx.save(); ctx.translate(this.x, this.y + Math.sin(this.animT * 3) * 3);
    ctx.globalAlpha = this.spawnT > 0 ? 0.4 : 1;
    ctx.fillStyle = '#203b39'; ctx.beginPath(); ctx.ellipse(0, 4, 14, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e9e3cf'; ctx.beginPath(); ctx.ellipse(0, -4, 11, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a9d86'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -4, 5, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    this.drawWound(ctx); this.drawFrozen(ctx); this.drawWard(ctx); this.drawSeal(ctx); this.drawFlash(ctx); this.drawSpawn(ctx);
  }
};

// ---------- 裂面：死亡后裂成两只高速碎面 ----------
G.Splitter = class extends EnemyBase {
  constructor(x, y, hpMul, small) {
    super(x, y, hpMul);
    this.type = small ? 'splinter' : 'splitter';
    this.splitStage = small ? 0 : 1;
    this.r = small ? 10 : 21;
    this.maxHp = this.hp = Math.round((small ? 19 : 64) * hpMul);
    this.speed = small ? 148 : 68;
    this.dmg = small ? 6 : 12;
    this.xp = small ? 1 : 4;
    this.noLoot = !!small;
    this.phase = G.util.rand(0, Math.PI * 2);
  }
  update(dt, game) {
    this.baseUpdate(dt);
    if (this.pinned || this.spawnT > 0 || this.freezeT > 0) return;
    const a = G.util.angTo(this.x, this.y, game.player.x, game.player.y) +
      Math.sin(this.animT * (this.splitStage ? 2.8 : 7) + this.phase) * (this.splitStage ? 0.28 : 0.62);
    this.x += Math.cos(a) * this.speed * dt;
    this.y += Math.sin(a) * this.speed * dt;
  }
  draw(ctx) {
    const r = this.r, t = this.animT;
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(Math.sin(t * 3 + this.phase) * 0.18);
    ctx.globalAlpha = this.spawnT > 0 ? 0.4 : 1;
    ctx.fillStyle = this.splitStage ? '#3f274e' : '#572b45';
    ctx.strokeStyle = this.splitStage ? '#d982b0' : '#ff8cad';
    ctx.lineWidth = this.splitStage ? 2 : 1.3;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2, rr = r * (i % 2 ? 0.76 : 1.08);
      i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#ffe0ee'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.55); ctx.lineTo(0, 0);
    ctx.lineTo(r * 0.55, -r * 0.25); ctx.moveTo(0, 0); ctx.lineTo(-r * 0.2, r * 0.7); ctx.stroke();
    ctx.fillStyle = '#ffcf70'; ctx.beginPath(); ctx.arc(r * 0.2, -r * 0.24, Math.max(1.8, r * 0.13), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    this.drawWound(ctx); this.drawFrozen(ctx); this.drawWard(ctx); this.drawSeal(ctx); this.drawFlash(ctx); this.drawSpawn(ctx);
  }
};

// ---------- 蚀灵：可躲避的近距吸灵脉冲 ----------
G.Siphon = class extends EnemyBase {
  constructor(x, y, hpMul) {
    super(x, y, hpMul);
    this.type = 'siphon'; this.r = 17;
    this.maxHp = this.hp = Math.round(44 * hpMul);
    this.speed = 78; this.dmg = 9; this.xp = 4;
    this.pulseT = G.util.rand(2.2, 3.4);
    this.chargeT = 0; this.drain = 10;
  }
  update(dt, game) {
    this.baseUpdate(dt);
    if (this.pinned || this.spawnT > 0 || this.freezeT > 0) return;
    const p = game.player;
    const d = G.util.dist(this.x, this.y, p.x, p.y);
    const a = G.util.angTo(this.x, this.y, p.x, p.y);
    if (this.chargeT > 0) {
      this.chargeT -= dt;
      if (this.chargeT <= 0) {
        if (G.util.dist2(this.x, this.y, p.x, p.y) <= 185 * 185)
          game.drainPlayerMana(this.drain, this.x, this.y, '蚀 灵');
        G.FX.ring(this.x, this.y, 185, 'purple', 5, 0.48);
        G.Audio.orb();
        this.pulseT = 3.8;
      }
      return;
    }
    if (d < 135) { this.x -= Math.cos(a) * this.speed * dt; this.y -= Math.sin(a) * this.speed * dt; }
    else if (d > 220) { this.x += Math.cos(a) * this.speed * dt; this.y += Math.sin(a) * this.speed * dt; }
    this.pulseT -= dt;
    if (this.pulseT <= 0 && d < 270) { this.chargeT = 0.82; G.Audio.warn(); }
  }
  draw(ctx) {
    const t = this.animT;
    if (this.chargeT > 0) {
      const k = 1 - this.chargeT / 0.82;
      ctx.save(); ctx.globalAlpha = 0.3 + k * 0.45; ctx.strokeStyle = '#c48aff'; ctx.lineWidth = 2 + k * 2;
      ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.arc(this.x, this.y, 185, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
    }
    ctx.save(); ctx.translate(this.x, this.y + Math.sin(t * 4) * 2);
    ctx.globalAlpha = this.spawnT > 0 ? 0.4 : 1;
    ctx.fillStyle = '#221633'; ctx.strokeStyle = '#aa72dc'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.rotate(-t * 1.8); ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.arc(0, 0, 21, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#e2c2ff'; ctx.font = 'bold 15px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('蝕', 0, 1); ctx.restore();
    this.drawWound(ctx); this.drawFrozen(ctx); this.drawWard(ctx); this.drawSeal(ctx); this.drawFlash(ctx); this.drawSpawn(ctx);
  }
};

// ---------- 阵妖：预告玩家脚下的咒阵，逼迫持续走位 ----------
G.Binder = class extends EnemyBase {
  constructor(x, y, hpMul) {
    super(x, y, hpMul);
    this.type = 'binder'; this.r = 19;
    this.maxHp = this.hp = Math.round(58 * hpMul);
    this.speed = 54; this.dmg = 10; this.xp = 5;
    this.projectileDmg = 10;
    this.castT = G.util.rand(2.4, 3.8);
    this.aim = null;
  }
  update(dt, game) {
    this.baseUpdate(dt);
    if (this.pinned || this.spawnT > 0 || this.freezeT > 0) return;
    const p = game.player, d = G.util.dist(this.x, this.y, p.x, p.y);
    const a = G.util.angTo(this.x, this.y, p.x, p.y);
    if (!this.aim) {
      if (d < 260) { this.x -= Math.cos(a) * this.speed * dt; this.y -= Math.sin(a) * this.speed * dt; }
      else if (d > 390) { this.x += Math.cos(a) * this.speed * dt; this.y += Math.sin(a) * this.speed * dt; }
    }
    this.castT -= dt;
    if (this.castT <= 0.82 && !this.aim) {
      this.aim = { x: p.x, y: p.y };
      G.FX.ring(this.aim.x, this.aim.y, 76, 'red', 3, 0.82);
      G.Audio.warn();
    }
    if (this.castT <= 0 && this.aim) {
      const tx = this.aim.x, ty = this.aim.y, spellDmg = this.projectileDmg;
      for (let i = 0; i < 7; i++) game.spawnBullet(tx, ty, i / 7 * Math.PI * 2, 118, spellDmg);
      if (G.util.dist2(tx, ty, p.x, p.y) < 72 * 72) game.hurtPlayer(spellDmg, tx - 1, ty);
      G.FX.burst(tx, ty, 'red', 13, 180, 12, 0.45);
      G.FX.ring(tx, ty, 82, 'red', 6, 0.42);
      G.Audio.finisher();
      this.aim = null;
      this.castT = 0.82 + (4.7 - 0.82) / (this.attackRate || 1);
    }
  }
  draw(ctx) {
    if (this.aim) {
      const k = G.util.clamp(1 - this.castT / 0.82, 0, 1);
      ctx.save(); ctx.globalAlpha = 0.35 + k * 0.4; ctx.strokeStyle = '#ff756d'; ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 7]); ctx.beginPath(); ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.aim.x, this.aim.y); ctx.stroke();
      ctx.beginPath(); ctx.arc(this.aim.x, this.aim.y, 72 - k * 22, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
    }
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(Math.sin(this.animT * 2) * 0.12);
    ctx.globalAlpha = this.spawnT > 0 ? 0.4 : 1;
    ctx.fillStyle = '#2d1828'; ctx.strokeStyle = '#d65e66'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -21); ctx.lineTo(16, -5); ctx.lineTo(11, 20);
    ctx.lineTo(-11, 20); ctx.lineTo(-16, -5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f3dfca'; ctx.beginPath(); ctx.ellipse(0, -4, 9, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9b2636'; ctx.fillRect(-1.5, -10, 3, 16); ctx.restore();
    this.drawWound(ctx); this.drawFrozen(ctx); this.drawWard(ctx); this.drawSeal(ctx); this.drawFlash(ctx); this.drawSpawn(ctx);
  }
};

// ---------- 精英：荒魂 ----------
G.Elite = class extends EnemyBase {
  constructor(x, y, hpMul) {
    super(x, y, hpMul);
    this.type = 'elite'; this.r = 34;
    this.maxHp = this.hp = Math.round(300 * hpMul);
    this.speed = 76; this.dmg = 16; this.xp = 16;
    this.wob = G.util.rand(0, 6.28);
  }
  update(dt, game) {
    this.baseUpdate(dt);
    if (this.pinned || this.spawnT > 0 || this.freezeT > 0) return;
    const p = game.player;
    const a = G.util.angTo(this.x, this.y, p.x, p.y) + Math.sin(this.animT * 1.6 + this.wob) * 0.35;
    this.x += Math.cos(a) * this.speed * dt;
    this.y += Math.sin(a) * this.speed * dt;
  }
  draw(ctx) {
    const t = this.animT, r = this.r;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = this.spawnT > 0 ? 0.4 : 1;
    // 外圈符文环
    ctx.save();
    ctx.rotate(t * 0.9);
    ctx.strokeStyle = 'rgba(255,170,80,.4)'; ctx.lineWidth = 2;
    ctx.setLineDash([8, 10]);
    ctx.beginPath(); ctx.arc(0, 0, r + 12, 0, 6.2832); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    // 角
    ctx.fillStyle = '#d8ccb0';
    ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.6); ctx.quadraticCurveTo(-r * 1.1, -r * 1.3, -r * 0.9, -r * 0.1); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(r * 0.5, -r * 0.6); ctx.quadraticCurveTo(r * 1.1, -r * 1.3, r * 0.9, -r * 0.1); ctx.closePath(); ctx.fill();
    // 体
    ctx.fillStyle = this.pinned ? '#3c2a68' : '#2c1e50';
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const a = i / 12 * 6.2832;
      const rr2 = r * (1 + Math.sin(t * 3.4 + i * 2.1) * 0.1);
      const px = Math.cos(a) * rr2, py = Math.sin(a) * rr2 * 0.94;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,150,80,.45)'; ctx.lineWidth = 2; ctx.stroke();
    // 眼
    ctx.fillStyle = '#ffab3d';
    ctx.beginPath();
    ctx.ellipse(-9, -4, 4.4, 6, 0.2, 0, 6.2832);
    ctx.ellipse(9, -4, 4.4, 6, -0.2, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = '#3a1808';
    ctx.beginPath(); ctx.ellipse(-9, -3, 1.6, 3, 0, 0, 6.2832); ctx.ellipse(9, -3, 1.6, 3, 0, 0, 6.2832); ctx.fill();
    ctx.restore();
    this.drawWound(ctx); this.drawFrozen(ctx); this.drawWard(ctx); this.drawSeal(ctx); this.drawFlash(ctx); this.drawSpawn(ctx);
    this.drawEliteMarker(ctx, '荒', '#ffc06a');
  }
};

// ---------- 精英：结界荒魂，为周围妖怪施加减伤 ----------
G.WardenElite = class extends EnemyBase {
  constructor(x, y, hpMul) {
    super(x, y, hpMul);
    this.type = 'elite'; this.eliteKind = 'warden'; this.r = 37;
    this.maxHp = this.hp = Math.round(430 * hpMul);
    this.speed = 52; this.dmg = 17; this.xp = 20; this.auraT = 1.2;
  }
  update(dt, game) {
    this.baseUpdate(dt);
    if (this.pinned || this.spawnT > 0 || this.freezeT > 0) return;
    const p = game.player, d = G.util.dist(this.x, this.y, p.x, p.y);
    const a = G.util.angTo(this.x, this.y, p.x, p.y);
    if (d > 260) { this.x += Math.cos(a) * this.speed * dt; this.y += Math.sin(a) * this.speed * dt; }
    this.auraT -= dt;
    if (this.auraT <= 0) {
      this.auraT = 3.1;
      let n = 0;
      for (const e of game.enemies) {
        if (e.dead || e === this || G.util.dist2(this.x, this.y, e.x, e.y) > 230 * 230) continue;
        e.wardT = Math.max(e.wardT || 0, 2.6);
        if (++n >= 8) break;
      }
      G.FX.ring(this.x, this.y, 230, 'gold', 4, 0.55);
    }
  }
  draw(ctx) {
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.animT * 0.18);
    ctx.globalAlpha = this.spawnT > 0 ? 0.4 : 1;
    ctx.strokeStyle = '#ffe09a'; ctx.fillStyle = '#292341'; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2, r = i % 2 ? 28 : 38;
      i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff2c4'; ctx.font = 'bold 24px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('界', 0, 1); ctx.restore();
    this.drawWound(ctx); this.drawFrozen(ctx); this.drawWard(ctx); this.drawSeal(ctx); this.drawFlash(ctx); this.drawSpawn(ctx);
    this.drawEliteMarker(ctx, '界', '#ffe09a');
  }
};

// ---------- 精英：狩面荒魂，连续预警后高速追猎 ----------
G.ReaperElite = class extends EnemyBase {
  constructor(x, y, hpMul) {
    super(x, y, hpMul);
    this.type = 'elite'; this.eliteKind = 'reaper'; this.r = 32;
    this.maxHp = this.hp = Math.round(365 * hpMul);
    this.speed = 82; this.dmg = 20; this.xp = 21;
    this.st = 'roam'; this.stT = 1.6; this.aimA = 0; this.dvx = 0; this.dvy = 0;
  }
  update(dt, game) {
    this.baseUpdate(dt);
    if (this.pinned || this.spawnT > 0 || this.freezeT > 0) return;
    const p = game.player;
    this.stT -= dt;
    if (this.st === 'roam') {
      const a = G.util.angTo(this.x, this.y, p.x, p.y);
      this.x += Math.cos(a) * this.speed * dt; this.y += Math.sin(a) * this.speed * dt;
      if (this.stT <= 0) { this.st = 'aim'; this.stT = 0.9; this.aimA = a; }
    } else if (this.st === 'aim') {
      this.aimA = G.util.angLerp(this.aimA, G.util.angTo(this.x, this.y, p.x, p.y), 1 - Math.pow(0.01, dt));
      if (this.stT <= 0) {
        this.st = 'dash'; this.stT = 0.6;
        this.dvx = Math.cos(this.aimA) * 620; this.dvy = Math.sin(this.aimA) * 620;
        G.Audio.warn();
      }
    } else if (this.st === 'dash') {
      this.x += this.dvx * dt; this.y += this.dvy * dt;
      if (this.stT <= 0) { this.st = 'roam'; this.stT = 2.4; }
    }
  }
  draw(ctx) {
    if (this.st === 'aim') {
      ctx.save(); ctx.globalAlpha = 0.55; ctx.strokeStyle = '#ff6a8d'; ctx.lineWidth = 3;
      ctx.setLineDash([14, 9]); ctx.beginPath(); ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + Math.cos(this.aimA) * 620, this.y + Math.sin(this.aimA) * 620); ctx.stroke(); ctx.restore();
    }
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.aimA);
    ctx.globalAlpha = this.spawnT > 0 ? 0.4 : 1;
    ctx.fillStyle = '#4a1835'; ctx.beginPath(); ctx.ellipse(0, 0, 32, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff79a0'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-38, -26); ctx.quadraticCurveTo(0, 0, 42, 24); ctx.stroke();
    ctx.fillStyle = '#fff0dc'; ctx.beginPath(); ctx.ellipse(8, -3, 12, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9d244e'; ctx.fillRect(8, -9, 3, 15); ctx.restore();
    this.drawWound(ctx); this.drawFrozen(ctx); this.drawWard(ctx); this.drawSeal(ctx); this.drawFlash(ctx); this.drawSpawn(ctx);
    this.drawEliteMarker(ctx, '狩', '#ff79a0');
  }
};

// ---------- 精英：招魂荒魂，周期召来无掉落护卫 ----------
G.SummonerElite = class extends EnemyBase {
  constructor(x, y, hpMul) {
    super(x, y, hpMul);
    this.type = 'elite'; this.eliteKind = 'summoner'; this.r = 35;
    this.maxHp = this.hp = Math.round(390 * hpMul);
    this.speed = 48; this.dmg = 15; this.xp = 22;
    this.summonT = 3.4; this.chargeT = 0;
  }
  update(dt, game) {
    this.baseUpdate(dt);
    if (this.pinned || this.spawnT > 0 || this.freezeT > 0) return;
    const p = game.player, d = G.util.dist(this.x, this.y, p.x, p.y);
    const a = G.util.angTo(this.x, this.y, p.x, p.y);
    if (this.chargeT > 0) {
      this.chargeT -= dt;
      if (this.chargeT <= 0) {
        const alive = game.enemies.filter(e => !e.dead && e.summoner === this).length;
        const n = Math.max(0, Math.min(3, 5 - alive));
        const types = ['chaser', 'moth', 'dasher'];
        for (let i = 0; i < n; i++) {
          const aa = i / Math.max(1, n) * Math.PI * 2 + this.animT;
          const minion = game.spawnEnemy(types[i % types.length],
            this.x + Math.cos(aa) * 68, this.y + Math.sin(aa) * 58);
          minion.summoner = this; minion.noLoot = true; minion.spawnT = 0.35;
        }
        G.FX.burst(this.x, this.y, 'purple', 18, 210, 13, 0.55);
        G.FX.ring(this.x, this.y, 105, 'purple', 5, 0.55);
        G.Audio.fox();
        this.summonT = 6.2;
      }
      return;
    }
    if (d < 270) { this.x -= Math.cos(a) * this.speed * dt; this.y -= Math.sin(a) * this.speed * dt; }
    else if (d > 430) { this.x += Math.cos(a) * this.speed * dt; this.y += Math.sin(a) * this.speed * dt; }
    this.summonT -= dt;
    if (this.summonT <= 0 && game.enemies.length < G.getWave(game.wave).maxEnemies + 8) {
      this.chargeT = 1.05; G.Audio.warn();
    }
  }
  draw(ctx) {
    if (this.chargeT > 0) {
      const k = 1 - this.chargeT / 1.05;
      ctx.save(); ctx.globalAlpha = 0.3 + k * 0.5; ctx.strokeStyle = '#c78cff'; ctx.lineWidth = 3;
      ctx.setLineDash([12, 7]); ctx.beginPath(); ctx.arc(this.x, this.y, 55 + k * 48, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
    }
    ctx.save(); ctx.translate(this.x, this.y);
    ctx.globalAlpha = this.spawnT > 0 ? 0.4 : 1;
    ctx.fillStyle = '#251a3f'; ctx.strokeStyle = '#bd82ef'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 31, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2 + this.animT * 0.5;
      ctx.fillStyle = '#e9d5ff'; ctx.fillRect(Math.cos(a) * 43 - 4, Math.sin(a) * 35 - 8, 8, 16);
    }
    ctx.fillStyle = '#f1e6d3'; ctx.font = 'bold 24px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('召', 0, 2); ctx.restore();
    this.drawWound(ctx); this.drawFrozen(ctx); this.drawWard(ctx); this.drawSeal(ctx); this.drawFlash(ctx); this.drawSpawn(ctx);
    this.drawEliteMarker(ctx, '召', '#d7a0ff');
  }
};

// ---------- 精英：封脉荒魂，以大范围预警封锁自然回灵 ----------
G.SealerElite = class extends EnemyBase {
  constructor(x, y, hpMul) {
    super(x, y, hpMul);
    this.type = 'elite'; this.eliteKind = 'sealer'; this.r = 36;
    this.maxHp = this.hp = Math.round(455 * hpMul);
    this.speed = 58; this.dmg = 18; this.xp = 24;
    this.sealT = 4.2; this.chargeT = 0;
  }
  update(dt, game) {
    this.baseUpdate(dt);
    if (this.pinned || this.spawnT > 0 || this.freezeT > 0) return;
    const p = game.player, d = G.util.dist(this.x, this.y, p.x, p.y);
    const a = G.util.angTo(this.x, this.y, p.x, p.y);
    if (this.chargeT > 0) {
      this.chargeT -= dt;
      if (this.chargeT <= 0) {
        if (G.util.dist2(this.x, this.y, p.x, p.y) <= 320 * 320) {
          game.manaSealT = Math.max(game.manaSealT, 3.5);
          game.drainPlayerMana(12, this.x, this.y, '封 脉');
        }
        G.FX.ring(this.x, this.y, 320, 'red', 6, 0.55);
        G.Audio.finisher();
        this.sealT = 5.8;
      }
      return;
    }
    if (d < 210) { this.x -= Math.cos(a) * this.speed * dt; this.y -= Math.sin(a) * this.speed * dt; }
    else if (d > 330) { this.x += Math.cos(a) * this.speed * dt; this.y += Math.sin(a) * this.speed * dt; }
    this.sealT -= dt;
    if (this.sealT <= 0) { this.chargeT = 1.15; G.Audio.warn(); }
  }
  draw(ctx) {
    if (this.chargeT > 0) {
      const k = 1 - this.chargeT / 1.15;
      ctx.save(); ctx.globalAlpha = 0.25 + k * 0.5; ctx.strokeStyle = '#ff7894'; ctx.lineWidth = 3 + k * 2;
      ctx.setLineDash([16, 11]); ctx.beginPath(); ctx.arc(this.x, this.y, 320, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
    }
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(-this.animT * 0.12);
    ctx.globalAlpha = this.spawnT > 0 ? 0.4 : 1;
    ctx.fillStyle = '#34192f'; ctx.strokeStyle = '#f06c8f'; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2, r = i % 2 ? 25 : 36;
      i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.rotate(this.animT * 0.12);
    ctx.fillStyle = '#ffe5e8'; ctx.font = 'bold 23px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('封', 0, 1); ctx.restore();
    this.drawWound(ctx); this.drawFrozen(ctx); this.drawWard(ctx); this.drawSeal(ctx); this.drawFlash(ctx); this.drawSpawn(ctx);
    this.drawEliteMarker(ctx, '封', '#ff8aaa');
  }
};

// ---------- Boss：祟面ノ大天狗 ----------
G.Boss = class {
  constructor(hpMul, damageMul, tier) {
    hpMul = hpMul || 1; damageMul = damageMul || 1; tier = tier || 1;
    this.isBoss = true; this.type = 'boss';
    this.tier = tier;
    this.variant = ['tengu', 'oni', 'fox', 'void'][Math.min(3, tier - 1)];
    this.attackPool = this.variant === 'oni'
      ? ['slam', 'quake', 'curse', 'summon']
      : this.variant === 'fox'
        ? ['fan', 'blink', 'ring', 'curse', 'summon']
        : this.variant === 'void'
          ? ['spiral', 'quake', 'ring', 'slam', 'curse', 'summon']
          : ['ring', 'fan', 'slam', 'curse', 'summon'];
    this.r = this.variant === 'oni' ? 66 : this.variant === 'fox' ? 54 : this.variant === 'void' ? 64 : 58;
    const entrance = G.util.fieldClamp(G.FIELD.cx, G.FIELD.cy - G.FIELD.ry,
      this.r + 22);
    this.x = entrance.x; this.y = entrance.y;
    this.maxHp = this.hp = Math.round(2600 * hpMul);
    this.dead = false; this.pinned = false; this.seal = -1; this.sealCount = 0;
    this.flashT = 0; this.vulnT = 0; this.spawnT = 1.2;
    this.animT = 0; this.dmg = Math.round(22 * damageMul);
    this.projectileDmg = Math.round(12 * damageMul);
    this.xp = 90 + (tier - 1) * 35;
    this.rotT = 0;
    this.woundAng = null; this.woundT = 0;
    this.orbs = [];
    const orbN = this.variant === 'oni' ? 4 : this.variant === 'fox' ? 6 : this.variant === 'void' ? 8 : 5;
    for (let i = 0; i < orbN; i++) {
      const ang = i / orbN * 6.2832;
      this.orbs.push({ isOrb: true, ang, r: 15, x: this.x + Math.cos(ang) * 96, y: this.y + Math.sin(ang) * 80, broken: false, respawnT: 0, boss: this, spawnT: 0, seal: -1, sealCount: 0, growT: 0 });
    }
    this.atkT = 3.2 * (1 - (tier - 1) * 0.08); this.atk = null; this.atkPhase = 0; this.atkT2 = 0;
    this.hoverA = G.util.rand(0, 6.28);
    this.staggerT = 0;
    this.signatureT = this.variant === 'void' ? 7.8 : this.variant === 'oni' ? 9.5 : 8.8;
    this.signatureCount = 0;
    this.enraged = false;
    this.vx = 0; this.vy = 0;
  }
  orbCount() { let n = 0; for (const o of this.orbs) if (!o.broken) n++; return n; }
  hurt(dmg, game) {
    if (this.dead) return false;
    if (this.vulnT > 0) dmg *= 1.25;
    this.hp -= dmg; this.flashT = 0.14;
    if (this.hp <= 0) { this.hp = 0; this.dead = true; return true; }
    return false;
  }
  update(dt, game) {
    this.animT += dt;
    if (this.flashT > 0) this.flashT -= dt;
    if (this.vulnT > 0) this.vulnT -= dt;
    if (this.woundAng != null) this.woundT += dt;
    if (this.spawnT > 0) { this.spawnT -= dt; return; }
    if (this.staggerT > 0) { this.staggerT -= dt; return; }
    const p = game.player;
    if (!this.enraged && this.hp <= this.maxHp * 0.5) {
      this.enraged = true;
      this.atk = null;
      this.atkT = 0.55;
      this.signatureT = Math.min(this.signatureT, 0.75);
      for (const o of this.orbs) if (o.broken) o.respawnT = Math.min(o.respawnT, 5.5);
      const phaseNames = {
        tengu: '天 狗 ・ 暴 风',
        oni: '酒 吞 ・ 鬼 宴',
        fox: '玉 藻 ・ 九 尾',
        void: '黄 泉 ・ 常 暗'
      };
      G.FX.banner(phaseNames[this.variant] + ' ・ 二 阶');
      G.FX.flash(0.3, '#ff8a78');
      G.FX.shake(14, 0.5);
      G.FX.ring(this.x, this.y, 250, 'red', 8, 0.8);
      G.Audio.warn();
    }
    // 弱点环绕
    this.rotT += dt * 0.5;
    for (const o of this.orbs) {
      if (o.broken) {
        o.respawnT -= dt;
        if (o.respawnT <= 0) { o.broken = false; o.growT = 0.4; G.FX.burst(o.x, o.y, 'teal', 8, 120, 10, 0.4); }
      } else {
        const a = o.ang + this.rotT;
        o.x = this.x + Math.cos(a) * 96; o.y = this.y + Math.sin(a) * 80;
        if (o.growT > 0) o.growT -= dt;
      }
    }
    // 每只祟主的专属权能独立于常规攻击循环，二阶段会显著加快。
    this.signatureT -= dt;
    if (this.signatureT <= 0) {
      this.signatureCount++;
      game.triggerBossSignature(this);
      const base = this.variant === 'void' ? 9.2 : this.variant === 'oni' ? 11.2 : 10.4;
      this.signatureT = base * (this.enraged ? 0.72 : 1);
    }
    // 攻击循环
    this.atkT -= dt;
    if (!this.atk && this.atkT <= 0) {
      let opts = this.attackPool.slice();
      if (game.enemies.length >= 16) opts = opts.filter(x => x !== 'summon');
      this.atk = G.util.pick(opts); this.atkPhase = 0; this.atkT2 = 0;
      if (this.atk === 'ring') this.atkT2 = 0.85;
      else if (this.atk === 'fan') this.atkT2 = 0.5;
      else if (this.atk === 'slam') { this.atkT2 = 0.75; this.aimA = G.util.angTo(this.x, this.y, p.x, p.y); }
      else if (this.atk === 'quake') this.atkT2 = 0.55;
      else if (this.atk === 'blink') this.atkT2 = 0.42;
      else if (this.atk === 'spiral') this.atkT2 = 0.3;
      else if (this.atk === 'curse') this.atkT2 = 0.72;
      else this.atkT2 = 0.6;
    }
    if (this.atk) {
      this.atkT2 -= dt;
      if (this.atk === 'slam') {
        if (this.atkPhase === 0) {
          this.aimA = G.util.angLerp(this.aimA, G.util.angTo(this.x, this.y, p.x, p.y), 1 - Math.pow(0.02, dt));
          if (this.atkT2 <= 0) {
            this.atkPhase = 1; this.atkT2 = 0.55;
            this.vx = Math.cos(this.aimA) * 460; this.vy = Math.sin(this.aimA) * 460;
            G.Audio.noise({ dur: 0.3, vol: 0.2, fFrom: 300, fTo: 1800, q: 1.5 });
          }
        } else if (this.atkPhase === 1) {
          this.x += this.vx * dt; this.y += this.vy * dt;
          if (this.atkT2 <= 0) {
            this.atkPhase = 2; this.atkT2 = 0.5;
            G.FX.ring(this.x, this.y, 190, 'red', 6, 0.5);
            G.FX.shake(10, 0.35);
            G.Audio.finisher();
            const count = this.enraged ? 14 : 10;
            for (let i = 0; i < count; i++)
              game.spawnBullet(this.x, this.y, i / count * 6.2832, this.enraged ? 155 : 135, this.projectileDmg);
          }
        } else if (this.atkT2 <= 0) this.endAtk(3.4);
      } else if (this.atk === 'ring') {
        if (this.atkT2 <= 0) {
          const count = this.enraged ? 22 : 16;
          for (let i = 0; i < count; i++)
            game.spawnBullet(this.x, this.y, i / count * 6.2832 + this.animT, this.enraged ? 145 : 128, this.projectileDmg);
          G.Audio.shoot(); G.FX.ring(this.x, this.y, 120, 'purple', 4, 0.4);
          this.endAtk(3.8);
        }
      } else if (this.atk === 'fan') {
        if (this.atkT2 <= 0) {
          const a0 = G.util.angTo(this.x, this.y, p.x, p.y);
          for (let i = -2; i <= 2; i++)
            game.spawnBullet(this.x, this.y, a0 + i * 0.16, 175, this.projectileDmg);
          G.Audio.shoot();
          this.atkPhase++;
          this.atkT2 = 0.4;
          if (this.atkPhase >= (this.enraged ? 4 : 3)) this.endAtk(3.2);
        }
      } else if (this.atk === 'quake') {
        if (this.atkT2 <= 0) {
          const count = 10 + this.atkPhase * 2;
          const offset = this.atkPhase * 0.19;
          for (let i = 0; i < count; i++)
            game.spawnBullet(this.x, this.y, i / count * 6.2832 + offset,
              105 + this.atkPhase * 30, this.projectileDmg + this.tier);
          G.FX.ring(this.x, this.y, 110 + this.atkPhase * 60, 'red', 5, 0.45);
          G.FX.shake(5 + this.atkPhase * 2, 0.22);
          G.Audio.finisher();
          this.atkPhase++;
          this.atkT2 = 0.48;
          if (this.atkPhase >= (this.enraged ? 4 : 3)) this.endAtk(3.5);
        }
      } else if (this.atk === 'blink') {
        if (this.atkT2 <= 0) {
          G.FX.burst(this.x, this.y, 'gold', 18, 240, 13, 0.42);
          const a = G.util.rand(0, Math.PI * 2), dist = G.util.rand(190, 280);
          const blink = G.util.fieldClamp(p.x + Math.cos(a) * dist,
            p.y + Math.sin(a) * dist, this.r + 22);
          this.x = blink.x;
          this.y = blink.y;
          const aim = G.util.angTo(this.x, this.y, p.x, p.y);
          for (let i = -3; i <= 3; i++)
            game.spawnBullet(this.x, this.y, aim + i * 0.14, 190, Math.round(this.projectileDmg * 1.08));
          G.FX.ring(this.x, this.y, 105, 'gold', 4, 0.4);
          G.Audio.shoot();
          this.atkPhase++;
          this.atkT2 = 0.55;
          if (this.atkPhase >= (this.enraged ? 3 : 2)) this.endAtk(3.1);
        }
      } else if (this.atk === 'spiral') {
        if (this.atkT2 <= 0) {
          const count = 9;
          for (let i = 0; i < count; i++)
            game.spawnBullet(this.x, this.y, i / count * 6.2832 + this.atkPhase * 0.24,
              145 + this.atkPhase * 7, Math.round(this.projectileDmg * 1.16));
          G.FX.ring(this.x, this.y, 80 + this.atkPhase * 10, 'purple', 3, 0.3);
          G.Audio.shoot();
          this.atkPhase++;
          this.atkT2 = 0.26;
          if (this.atkPhase >= (this.enraged ? 8 : 6)) this.endAtk(3.4);
        }
      } else if (this.atk === 'curse') {
        if (this.atkT2 <= 0) {
          game.spawnBossCurse(this);
          this.endAtk(4.5);
        }
      } else if (this.atk === 'summon') {
        if (this.atkT2 <= 0) {
          const summonType = this.variant === 'oni' ? 'guardian' :
            this.variant === 'fox' ? 'moth' : this.variant === 'void' ? 'chanter' : 'chaser';
          const summonN = (this.variant === 'fox' ? 5 : 3) + (this.enraged ? 2 : 0);
          for (let i = 0; i < summonN; i++) {
            const a = G.util.rand(0, 6.2832);
            game.spawnEnemy(summonType, this.x + Math.cos(a) * 120, this.y + Math.sin(a) * 100);
          }
          G.FX.burst(this.x, this.y, 'purple', 16, 200, 14, 0.6);
          this.endAtk(4.2);
        }
      }
      const bounded = G.util.fieldClamp(this.x, this.y, this.r + 22);
      this.x = bounded.x;
      this.y = bounded.y;
      return;
    }
    // 常态漂浮：保持中距
    this.hoverA += dt * 0.4;
    const d = G.util.dist(this.x, this.y, p.x, p.y);
    const a = G.util.angTo(this.x, this.y, p.x, p.y);
    let sp = 0;
    if (d > 300) sp = 52; else if (d < 170) sp = -46;
    this.x += Math.cos(a) * sp * dt + Math.cos(this.hoverA) * 14 * dt;
    this.y += Math.sin(a) * sp * dt + Math.sin(this.hoverA * 0.8) * 12 * dt;
    const bounded = G.util.fieldClamp(this.x, this.y, this.r + 22);
    this.x = bounded.x;
    this.y = bounded.y;
  }
  endAtk(cd) {
    this.atk = null;
    this.atkT = cd * (this.enraged ? 0.74 : 1) * (1 - (this.tier - 1) * 0.08);
  }
  draw(ctx) {
    const t = this.animT, r = this.r;
    const palette = this.variant === 'oni'
      ? { body: '#35151a', edge: 'rgba(255,125,65,.7)', mask: '#7d241c', eye: '#ffcf70', glyph: '鬼' }
      : this.variant === 'fox'
        ? { body: '#33281c', edge: 'rgba(255,205,95,.7)', mask: '#e3d4b2', eye: '#ff6a55', glyph: '狐' }
        : this.variant === 'void'
          ? { body: '#161329', edge: 'rgba(175,100,255,.75)', mask: '#45306f', eye: '#d7b4ff', glyph: '冥' }
          : { body: '#1d1830', edge: 'rgba(200,80,70,.5)', mask: '#b03428', eye: '#ffe9b0', glyph: '天' };
    const fade = this.spawnT > 0 ? 1 - this.spawnT / 1.2 : 1;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = fade;
    // 威压光环
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.2 * fade + Math.sin(t * 2) * 0.04;
    const spr = G.FX.sprites.purple;
    ctx.drawImage(spr, -r * 2.6, -r * 2.6, r * 5.2, r * 5.2);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = fade;
    if (this.enraged) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = (0.2 + Math.sin(t * 8) * 0.08) * fade;
      ctx.strokeStyle = '#ff665a'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(0, 0, r * 1.52, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    //  slam 预警
    if (this.atk === 'slam' && this.atkPhase === 0) {
      ctx.save();
      ctx.globalAlpha = 0.4 + Math.sin(t * 24) * 0.2;
      ctx.strokeStyle = '#ff6a55'; ctx.lineWidth = 4; ctx.setLineDash([16, 12]);
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(this.aimA) * 620, Math.sin(this.aimA) * 620);
      ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
    }
    // 羽翼披风（锯齿）
    ctx.fillStyle = '#131022';
    ctx.beginPath();
    ctx.moveTo(-r * 1.5, -r * 0.4);
    for (let i = 0; i <= 12; i++) {
      const px = -r * 1.5 + i / 12 * r * 3;
      const py = r * 0.9 + (i % 2 ? r * 0.35 : 0) + Math.sin(t * 3 + i) * 3;
      ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    // 体
    ctx.fillStyle = palette.body;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.15, r, 0, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = palette.edge; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.15, r, 0, 0, 6.2832); ctx.stroke();
    // 发光裂纹
    ctx.strokeStyle = 'rgba(255,90,70,' + (0.35 + Math.sin(t * 3) * 0.18) + ')'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, -r * 0.3); ctx.lineTo(-r * 0.3, r * 0.1); ctx.lineTo(-r * 0.5, r * 0.5);
    ctx.moveTo(r * 0.6, -r * 0.4); ctx.lineTo(r * 0.35, 0); ctx.lineTo(r * 0.65, r * 0.4);
    ctx.stroke();
    // 天狗面
    ctx.fillStyle = palette.mask;
    ctx.beginPath(); ctx.ellipse(0, -r * 0.15, r * 0.42, r * 0.5, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#8e241c';
    ctx.beginPath(); ctx.ellipse(0, r * 0.28, r * 0.13, r * 0.3, 0, 0, 6.2832); ctx.fill(); // 长鼻
    ctx.fillStyle = palette.eye;
    ctx.beginPath(); ctx.ellipse(-r * 0.16, -r * 0.28, 5, 7, 0.25, 0, 6.2832); ctx.ellipse(r * 0.16, -r * 0.28, 5, 7, -0.25, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#401008';
    ctx.beginPath(); ctx.arc(-r * 0.16, -r * 0.26, 2.2, 0, 6.2832); ctx.arc(r * 0.16, -r * 0.26, 2.2, 0, 6.2832); ctx.fill();
    if (this.variant !== 'tengu') {
      ctx.font = 'bold ' + Math.round(r * 0.38) + 'px "Noto Serif SC", KaiTi, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = palette.eye; ctx.globalAlpha = fade * 0.9;
      ctx.fillText(palette.glyph, 0, r * 0.12);
      ctx.globalAlpha = fade;
    }
    // 白眉
    ctx.strokeStyle = '#e8e0cc'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-r * 0.3, -r * 0.44); ctx.lineTo(-r * 0.08, -r * 0.38);
    ctx.moveTo(r * 0.3, -r * 0.44); ctx.lineTo(r * 0.08, -r * 0.38); ctx.stroke();
    ctx.restore();

    // 弱点勾玉
    for (const o of this.orbs) {
      if (o.broken) {
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = '#5a5570'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(o.x, o.y, 8, 0, 6.2832); ctx.stroke();
        ctx.restore();
        continue;
      }
      const grow = o.growT > 0 ? 1 - o.growT / 0.4 : 1;
      const pulse = 1 + Math.sin(t * 5 + o.ang * 3) * 0.12;
      const R = o.r * pulse * grow * fade;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.75;
      const spr2 = G.FX.sprites.teal;
      ctx.drawImage(spr2, o.x - R * 2, o.y - R * 2, R * 4, R * 4);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      // 勾玉形
      ctx.fillStyle = '#8affd8';
      ctx.beginPath(); ctx.arc(o.x, o.y, R * 0.62, 0, 6.2832); ctx.fill();
      ctx.fillStyle = '#0c2a24';
      ctx.beginPath(); ctx.arc(o.x + R * 0.2, o.y - R * 0.2, R * 0.3, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = 'rgba(200,255,240,.9)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(o.x, o.y, R * 0.62, 0, 6.2832); ctx.stroke();
      // 封印符
      if (o.seal >= 0) {
        ctx.fillStyle = '#f7f1de';
        ctx.fillRect(o.x - 4, o.y - R - 16, 8, 14);
        ctx.strokeStyle = '#c03a30'; ctx.lineWidth = 1.2;
        ctx.strokeRect(o.x - 4, o.y - R - 16, 8, 14);
        if (o.sealCount > 1) {
          ctx.font = 'bold 10px "Noto Serif SC", KaiTi, serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.fillStyle = '#ffe9a8';
          ctx.fillText('×' + o.sealCount, o.x, o.y - R - 1);
        }
      }
      ctx.restore();
    }
    // 本体斩击伤
    if (this.woundAng != null) {
      const age = this.woundT;
      const fade = age < 1.4 ? 1 : Math.max(0, 1 - (age - 1.4) / 0.6);
      if (fade <= 0) this.woundAng = null;
      else {
        const L = this.r * 2.4;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.woundAng);
        ctx.globalCompositeOperation = 'lighter';
        const flick = 0.7 + Math.sin(age * 26) * 0.3;
        ctx.globalAlpha = fade * flick * 0.6;
        const sprw = G.FX.sprites.cyan;
        ctx.drawImage(sprw, -L * 0.7, -L * 0.3, L * 1.4, L * 0.6);
        ctx.globalAlpha = fade * flick;
        ctx.strokeStyle = '#ffffff'; ctx.lineCap = 'round'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.lineTo(L / 2, 0); ctx.stroke();
        ctx.restore();
      }
    }
    // 本体封印符
    if (this.seal >= 0) {
      ctx.save();
      ctx.translate(this.x, this.y - this.r - 26 + Math.sin(t * 5) * 2);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.7;
      const sp4 = G.FX.sprites.gold;
      ctx.drawImage(sp4, -18, -18, 36, 36);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#f7f1de';
      ctx.fillRect(-5, -10, 10, 20);
      ctx.strokeStyle = '#c03a30'; ctx.lineWidth = 1.4;
      ctx.strokeRect(-5, -10, 10, 20);
      if (this.sealCount > 1) {
        ctx.font = 'bold 12px "Noto Serif SC", KaiTi, serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillStyle = '#ffe9a8';
        ctx.fillText('×' + this.sealCount, 0, 12);
      }
      ctx.restore();
    }
    if (this.flashT > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(1, this.flashT * 9);
      const s3 = G.FX.sprites.white;
      ctx.drawImage(s3, this.x - r * 2.4, this.y - r * 2.4, r * 4.8, r * 4.8);
      ctx.restore();
    }
  }
};

// ---------- 敌方弹幕 ----------
G.Bullet = class {
  constructor(x, y, ang, sp, dmg) {
    this.x = x; this.y = y;
    this.vx = Math.cos(ang) * sp; this.vy = Math.sin(ang) * sp;
    this.r = 7; this.dmg = dmg; this.life = 7; this.dead = false;
    this.animT = G.util.rand(0, 6);
  }
  update(dt) {
    this.animT += dt;
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0 || this.x < -30 || this.x > G.WORLD_W + 30 || this.y < -30 || this.y > G.WORLD_H + 30) this.dead = true;
  }
  draw(ctx) {
    const t = this.animT;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.85;
    const spr = G.FX.sprites.purple;
    const s = this.r * (2.4 + Math.sin(t * 8) * 0.3);
    ctx.drawImage(spr, this.x - s, this.y - s, s * 2, s * 2);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#2a0a3a';
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r * 0.62, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = '#e0a0ff'; ctx.lineWidth = 1.6;
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(t * 5);
    ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(0, 0, this.r + 2.5, 0, 6.2832); ctx.stroke();
    ctx.restore();
    ctx.restore();
  }
};

// ---------- 经验勾玉 ----------
G.Gem = class {
  constructor(x, y, val) {
    this.x = x + G.util.rand(-14, 14); this.y = y + G.util.rand(-14, 14);
    this.val = val; this.r = 6; this.dead = false;
    this.animT = G.util.rand(0, 6); this.vx = G.util.rand(-40, 40); this.vy = G.util.rand(-60, -20);
  }
  update(dt, game) {
    this.animT += dt;
    const p = game.player;
    const d2 = G.util.dist2(this.x, this.y, p.x, p.y);
    if (d2 < 110 * 110) {
      const a = G.util.angTo(this.x, this.y, p.x, p.y);
      const sp = 260 + (110 * 110 - d2) * 0.004;
      this.vx = G.util.lerp(this.vx, Math.cos(a) * sp, 0.2);
      this.vy = G.util.lerp(this.vy, Math.sin(a) * sp, 0.2);
    } else { this.vx *= 0.9; this.vy *= 0.9; }
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (d2 < 20 * 20) this.collect(game, false);
  }
  collect(game, silent) {
    if (this.dead) return;
    this.dead = true;
    game.gainXp(this.val);
    if (!silent) G.Audio.gem();
  }
  draw(ctx) {
    const t = this.animT, bob = Math.sin(t * 4) * 2;
    ctx.save();
    ctx.translate(this.x, this.y + bob);
    ctx.rotate(Math.sin(t * 3) * 0.3);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5;
    const spr = G.FX.sprites.teal;
    ctx.drawImage(spr, -12, -12, 24, 24);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    // 勾玉
    ctx.fillStyle = '#7fe8cc';
    ctx.beginPath(); ctx.arc(0, 0, 4.6, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#0d2f28';
    ctx.beginPath(); ctx.arc(1.6, -1.6, 2.2, 0, 6.2832); ctx.fill();
    ctx.restore();
  }
};

// ---------- 回复/神力拾取 ----------
G.Pickup = class {
  constructor(x, y, kind, value) {
    this.x = x; this.y = y; this.kind = kind; // 'mana' | 'hp' | 'skill' | 'jade'
    this.value = value || 1;
    this.r = kind === 'skill' ? 11 : kind === 'jade' ? 7 : 8;
    this.dead = false; this.animT = 0;
  }
  update(dt, game) {
    this.animT += dt;
    const p = game.player;
    const d2 = G.util.dist2(this.x, this.y, p.x, p.y);
    if (d2 < 120 * 120) {
      const a = G.util.angTo(this.x, this.y, p.x, p.y);
      this.x += Math.cos(a) * 220 * dt; this.y += Math.sin(a) * 220 * dt;
    }
    if (d2 < 22 * 22) this.collect(game, false);
  }
  collect(game, silent) {
    if (this.dead) return;
    this.dead = true;
    const p = game.player;
    if (this.kind === 'mana') {
      p.mana = Math.min(p.maxMana, p.mana + 30);
      if (!silent) { G.Audio.orb(); G.FX.text(p.x, p.y - 24, '+30 神力', { size: 14, color: '#ffd98a' }); }
    } else if (this.kind === 'hp') {
      p.hp = Math.min(p.maxHp, p.hp + 22);
      if (!silent) { G.Audio.heal(); G.FX.text(p.x, p.y - 24, '+22 生命', { size: 14, color: '#ff9a9a' }); }
    } else if (this.kind === 'jade') {
      game.jade += this.value;
      if (!silent && this.value > 1) G.FX.text(p.x, p.y - 24, '+' + this.value + ' 灵玉', { size: 13, color: '#ffe2a0' });
      if (!silent) G.Audio.gem();
    } else if (this.kind === 'skill') game.collectSkillDrop();
  }
  draw(ctx) {
    const bob = Math.sin(this.animT * 4) * 3;
    ctx.save();
    if (this.kind === 'skill') {
      // 技能卷轴：紫金光晕 + 符纸，拾取时随机开出尚未满级的技能。
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.8 + Math.sin(this.animT * 6) * 0.2;
      const spr = G.FX.sprites.purple;
      ctx.drawImage(spr, this.x - 22, this.y - 22 + bob, 44, 44);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.translate(this.x, this.y + bob);
      ctx.rotate(Math.sin(this.animT * 2.5) * 0.12);
      ctx.fillStyle = '#f5efdd';
      ctx.fillRect(-6, -11, 12, 22);
      ctx.strokeStyle = '#8a5adf'; ctx.lineWidth = 1.6;
      ctx.strokeRect(-6, -11, 12, 22);
      ctx.fillStyle = '#8a5adf';
      ctx.font = 'bold 11px "Noto Serif SC", KaiTi, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('技', 0, 0);
    } else if (this.kind === 'jade') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.72;
      const spr = G.FX.sprites.gold;
      ctx.drawImage(spr, this.x - 15, this.y - 15 + bob, 30, 30);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.save(); ctx.translate(this.x, this.y + bob); ctx.rotate(Math.PI / 4 + this.animT * 0.5);
      ctx.fillStyle = '#e6c37a'; ctx.fillRect(-4.5, -4.5, 9, 9);
      ctx.strokeStyle = '#fff0bd'; ctx.lineWidth = 1; ctx.strokeRect(-4.5, -4.5, 9, 9);
      ctx.restore();
    } else {
      const key = this.kind === 'mana' ? 'gold' : 'pink';
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.7;
      const spr = G.FX.sprites[key];
      ctx.drawImage(spr, this.x - 16, this.y - 16 + bob, 32, 32);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.fillStyle = this.kind === 'mana' ? '#ffd98a' : '#ff9ab0';
      ctx.beginPath(); ctx.arc(this.x, this.y + bob, 4.6, 0, 6.2832); ctx.fill();
    }
    ctx.restore();
  }
};

// ---------- 狐火 ----------
G.Foxfire = class {
  constructor(x, y, dmg, opt) {
    this.x = x; this.y = y; this.dmg = dmg;
    this.r = 9; this.dead = false; this.animT = 0;
    this.life = 4;
    this.vx = G.util.rand(-160, 160); this.vy = G.util.rand(-220, -80);
    this.opt = opt || {}; // {trail, burst, endX, endY, trailPts}
    this.phase = this.opt.trail ? 'trail' : (this.opt.burst ? 'converge' : 'home');
    this.trailIdx = 0;
    this.trailSp = 900;
  }
  update(dt, game) {
    this.animT += dt; this.life -= dt;
    if (this.life <= 0) { this.explode(game, 40); return; }
    if (this.phase === 'trail') {
      const pts = this.opt.trailPts;
      if (!pts || this.trailIdx >= pts.length) { this.phase = this.opt.burst ? 'converge' : 'home'; return; }
      const tp = pts[this.trailIdx];
      const a = G.util.angTo(this.x, this.y, tp.x, tp.y);
      this.vx = Math.cos(a) * this.trailSp; this.vy = Math.sin(a) * this.trailSp;
      this.x += this.vx * dt; this.y += this.vy * dt;
      if (G.util.dist2(this.x, this.y, tp.x, tp.y) < 30 * 30) this.trailIdx++;
      // 沿途伤害
      for (const e of game.enemies) {
        if (e.dead || e.hitByFox === this) continue;
        if (G.util.dist2(this.x, this.y, e.x, e.y) < (this.r + e.r) * (this.r + e.r)) {
          e.hitByFox = this;
          game.dealFox(this, e, 0.5);
        }
      }
      return;
    }
    if (this.phase === 'converge') {
      const a = G.util.angTo(this.x, this.y, this.opt.endX, this.opt.endY);
      this.vx = G.util.lerp(this.vx, Math.cos(a) * 640, 0.14);
      this.vy = G.util.lerp(this.vy, Math.sin(a) * 640, 0.14);
      this.x += this.vx * dt; this.y += this.vy * dt;
      if (G.util.dist2(this.x, this.y, this.opt.endX, this.opt.endY) < 26 * 26) this.explode(game, 95);
      return;
    }
    // home：追踪最近敌人
    let best = null, bd = 1e12;
    for (const e of game.enemies) {
      if (e.dead) continue;
      const d2 = G.util.dist2(this.x, this.y, e.x, e.y);
      if (d2 < bd) { bd = d2; best = e; }
    }
    if (game.boss && !game.boss.dead) {
      const d2 = G.util.dist2(this.x, this.y, game.boss.x, game.boss.y);
      if (d2 < bd) { bd = d2; best = game.boss; }
    }
    if (best) {
      const a = G.util.angTo(this.x, this.y, best.x, best.y);
      this.vx = G.util.lerp(this.vx, Math.cos(a) * 560, 0.12);
      this.vy = G.util.lerp(this.vy, Math.sin(a) * 560, 0.12);
    }
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (best && bd < (this.r + best.r) * (this.r + best.r)) {
      game.dealFox(this, best, 0.8);
      this.explode(game, 46);
    }
  }
  explode(game, aoe) {
    if (this.dead) return;
    this.dead = true;
    G.FX.burst(this.x, this.y, 'blue', 10, 180, 12, 0.4);
    G.FX.ring(this.x, this.y, aoe, 'blue', 3, 0.35);
    G.Audio.fox();
    if (aoe > 60) {
      for (const e of game.enemies) {
        if (e.dead) continue;
        if (G.util.dist2(this.x, this.y, e.x, e.y) < aoe * aoe) game.dealFox(this, e, 0.6);
      }
      if (game.boss && !game.boss.dead && G.util.dist2(this.x, this.y, game.boss.x, game.boss.y) < (aoe + game.boss.r) * (aoe + game.boss.r))
        game.dealFox(this, game.boss, 0.6);
    }
  }
  draw(ctx) {
    const t = this.animT;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const fl = 1 + Math.sin(t * 16) * 0.2;
    ctx.globalAlpha = 0.85;
    if (G.Assets.ok('foxfire')) {
      const s = this.r * 3.4 * fl;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(Math.atan2(this.vy, this.vx) + G.FX.FOX_ROT);
      ctx.drawImage(G.Assets.get('foxfire'), -s, -s, s * 2, s * 2);
      ctx.restore();
    } else {
      const spr = G.FX.sprites.blue;
      const s = this.r * 2.4 * fl;
      ctx.drawImage(spr, this.x - s, this.y - s, s * 2, s * 2);
      ctx.fillStyle = '#dff2ff';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, 4 * fl, 6.5 * fl, Math.atan2(this.vy, this.vx) + Math.PI / 2, 0, 6.2832);
      ctx.fill();
    }
    ctx.restore();
  }
};

// ---------- 净化区域 ----------
G.Zone = class {
  constructor(x, y, dps, opt) {
    opt = opt || {};
    this.x = x; this.y = y; this.r = opt.r || 52; this.dps = dps;
    this.life = opt.life || 3; this.dead = false; this.animT = G.util.rand(0, 6);
    this.kind = opt.kind || 'purify';
    this.tick = 0;
  }
  update(dt, game) {
    this.animT += dt; this.life -= dt;
    if (this.life <= 0) { this.dead = true; return; }
    this.tick -= dt;
    if (this.tick <= 0) {
      this.tick = 0.25;
      for (const e of game.enemies) {
        if (e.dead || e.isBoss) continue;
        if (G.util.dist2(this.x, this.y, e.x, e.y) < this.r * this.r)
          game.hurtEnemy(e, this.dps * 0.25, { silent: true });
      }
      if (game.boss && !game.boss.dead && G.util.dist2(this.x, this.y, game.boss.x, game.boss.y) < (this.r + game.boss.r * 0.6) * (this.r + game.boss.r * 0.6))
        game.hurtBoss(this.dps * 0.25, { silent: true });
    }
  }
  draw(ctx) {
    const t = this.animT;
    const a = Math.min(1, this.life) * 0.3;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a + Math.sin(t * 6) * 0.05;
    const flame = this.kind === 'flame';
    ctx.fillStyle = flame ? 'rgba(255,92,38,.2)' : 'rgba(140,230,255,.16)';
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = flame ? '#ffb04f' : '#9fe8ff'; ctx.lineWidth = flame ? 2.4 : 1.5;
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(t * 0.8);
    ctx.setLineDash([7, 9]); ctx.beginPath(); ctx.arc(0, 0, this.r - 3, 0, 6.2832); ctx.stroke();
    if (flame) {
      ctx.setLineDash([]);
      for (let i = 0; i < 8; i++) {
        const ang = i / 8 * Math.PI * 2;
        const r0 = this.r * 0.35, r1 = this.r * (0.72 + Math.sin(t * 5 + i) * 0.08);
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0);
        ctx.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
        ctx.stroke();
      }
    }
    ctx.restore();
    ctx.restore();
  }
};
