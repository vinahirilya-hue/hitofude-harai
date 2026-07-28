// ============ 外部素材加载（全部带程序化兜底，缺图也能玩） ============
window.G = window.G || {};

G.Assets = {
  imgs: {},
  // 素材清单：键名 → 路径
  MANIFEST: {
    bg: 'assets/bg.png',          // 夜晚神社背景
    miko: 'assets/miko.png',      // Q版巫女玩家精灵（静态回退）
    mikoRigBow: 'assets/miko-rig/bow.png',
    mikoRigHairLeft: 'assets/miko-rig/hair-left.png',
    mikoRigHairRight: 'assets/miko-rig/hair-right.png',
    mikoRigHead: 'assets/miko-rig/head.png',
    mikoRigTorso: 'assets/miko-rig/torso.png',
    mikoRigSleeveLeft: 'assets/miko-rig/sleeve-left.png',
    mikoRigSleeveRight: 'assets/miko-rig/sleeve-right.png',
    mikoRigSkirt: 'assets/miko-rig/skirt.png',
    mikoRigFootLeft: 'assets/miko-rig/foot-left.png',
    mikoRigFootRight: 'assets/miko-rig/foot-right.png',
    mikoRigSword: 'assets/miko-rig/sword.png',
    mikoDirectBow: 'assets/miko-direct-rig/bow.png',
    mikoDirectHairLeft: 'assets/miko-direct-rig/hair-left.png',
    mikoDirectHairRight: 'assets/miko-direct-rig/hair-right.png',
    mikoDirectHead: 'assets/miko-direct-rig/head.png',
    mikoDirectBody: 'assets/miko-direct-rig/body.png',
    mikoDirectArmLeft: 'assets/miko-direct-rig/arm-left.png',
    mikoDirectArmRightSword: 'assets/miko-direct-rig/arm-right-sword.png',
    mikoDirectFootLeft: 'assets/miko-direct-rig/foot-left.png',
    mikoDirectFootRight: 'assets/miko-direct-rig/foot-right.png',
    foxfire: 'assets/foxfire.png',    // 狐火火焰
    wisp: 'assets/wisp.png',        // 灵力光球
    circle: 'assets/circle.png',      // 规划法阵
    slash: 'assets/slash.png'        // 刀光弧
  },
  load() {
    for (const k in this.MANIFEST) {
      const im = new Image();
      im.src = this.MANIFEST[k];
      this.imgs[k] = im;
    }
  },
  ok(k) {
    const im = this.imgs[k];
    return !!(im && im.complete && im.naturalWidth > 0);
  },
  get(k) { return this.imgs[k]; }
};
