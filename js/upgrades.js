// ============ 肉鸽强化 ============
window.G = window.G || {};

// rarity: 0 白 / 1 金 / 2 紫
G.UPGRADES = [
  // ---- 轨迹 ----
  { id: 'thread', kanji: '絲', name: '长引之丝', rar: 0, max: 5, desc: '轨迹最大长度 +25%', apply: s => s.trailLen *= 1.25 },
  { id: 'width', kanji: '幅', name: '宽幅朱线', rar: 0, max: 5, desc: '祓除判定宽度 +30%', apply: s => s.lockR *= 1.3 },
  { id: 'magnet', kanji: '磁', name: '引灵之磁', rar: 0, max: 4, desc: '自动吸附范围 +35%', apply: s => s.magnet *= 1.35 },
  { id: 'lock', kanji: '鎖', name: '千结锁', rar: 0, max: 5, desc: '最大锁定数量 +3', apply: s => s.maxLock += 3 },
  { id: 'retrace', kanji: '返', name: '返祓・重巡', rar: 1, max: 3,
    desc: '每阶依次使重复锁定与最大锁定数 +1 / +2 / +3；满阶同一敌人最多斩击 7 次',
    apply: s => {
      s.retraceLevel += 1;
      s.repeatHits += s.retraceLevel;
      s.maxLock += s.retraceLevel;
    } },
  { id: 'cost', kanji: '印', name: '省神之印', rar: 0, max: 3, desc: '祓除神力消耗 -10%', apply: s => s.cost *= 0.9 },
  { id: 'spring', kanji: '泉', name: '涌泉之心', rar: 0, max: 3, desc: '移动时神力恢复速度 +25%', apply: s => s.regen *= 1.25 },

  // ---- 伤害 ----
  { id: 'edge', kanji: '鋒', name: '祓秽之锋', rar: 0, max: 6, desc: '基础伤害 +25%', apply: s => s.dmg *= 1.25 },
  { id: 'breaker', kanji: '破', name: '破邪重击', rar: 1, max: 4, desc: '对精英与 Boss 伤害 +35%', apply: s => s.eliteDmg *= 1.35 },
  { id: 'combo', kanji: '連', name: '连势', rar: 0, max: 4, desc: '连击每递进一段，伤害 +7%', apply: s => s.comboStep += 0.07 },
  { id: 'longdrive', kanji: '駆', name: '长驱', rar: 0, max: 4, desc: '轨迹利用率越高伤害越高，至多 +30%', apply: s => s.lengthDmg += 0.3 },
  { id: 'first', kanji: '勢', name: '破势', rar: 0, max: 3, desc: '对满生命敌人伤害 +50%', apply: s => s.fullHp += 0.5 },
  { id: 'execution', kanji: '斬', name: '灭魂之刃', rar: 1, max: 3, desc: '对生命低于 35% 的敌人伤害 +25%', apply: s => s.execute += 0.25 },
  { id: 'crowdEdge', kanji: '群', name: '百祟锋', rar: 0, max: 4, desc: '一笔中每连接 5 次，伤害提高 10%，最多提高 40%', apply: s => s.crowdDmg += 0.1 },
  { id: 'lastStand', kanji: '逆', name: '背水祝词', rar: 1, max: 3, desc: '自身生命低于 40% 时，伤害 +30%', apply: s => s.lowHpDmg += 0.3 },
  { id: 'body', kanji: '軀', name: '神佑之躯', rar: 0, max: 5, desc: '生命上限 +25，并恢复 25', apply: s => { s.maxHp += 25; s.healOnPick = 25; } },
  { id: 'wind', kanji: '風', name: '疾风步', rar: 0, max: 4, desc: '移动速度 +12%', apply: s => s.speed *= 1.12 },
  { id: 'reservoir', kanji: '器', name: '神气之器', rar: 0, max: 4, desc: '神力上限 +20', apply: s => s.maxMana += 20 },
  { id: 'comboGuard', kanji: '守', name: '连祓护印', rar: 1, max: 3, desc: '一笔命中 10 次以上时获得 4 点护印，可叠加至 36', apply: s => s.comboShield += 4 },
  { id: 'soulStudy', kanji: '悟', name: '识魂录', rar: 0, max: 4, desc: '获得的经验 +20%', apply: s => s.xpMul *= 1.2 },

  // ---- 符札 ----
  { id: 'ofuda', kanji: '札', name: '符札・留', rar: 1, max: 1, desc: '被祓除穿过的敌人留下符札，收招后爆炸造成 35% 伤害', apply: s => s.ofuda = true },
  { id: 'ofudaSpread', kanji: '渡', name: '符札・渡', rar: 1, max: 1, req: 'ofuda', desc: '符札爆炸向附近敌人传递 30% 伤害', apply: s => s.ofudaSpread = true },
  { id: 'ofudaVuln', kanji: '蝕', name: '符札・蝕', rar: 1, max: 1, req: 'ofuda', desc: '被符札波及的敌人受到伤害 +25%，持续 5 秒', apply: s => s.ofudaVuln = true },

  // ---- 狐火 ----
  { id: 'fox', kanji: '狐', name: '狐火・诞', rar: 1, max: 3, desc: '每次祓除每命中 5 个敌人，诞生一团追击狐火', apply: s => s.foxEvery += 0 },
  { id: 'foxTrail', kanji: '循', name: '狐火・循', rar: 1, max: 1, req: 'fox', desc: '狐火先沿祓除轨迹飞行，灼烧沿途敌人', apply: s => s.foxTrail = true },
  { id: 'foxBurst', kanji: '集', name: '狐火・集', rar: 1, max: 1, req: 'fox', desc: '狐火在轨迹终点汇聚爆炸，造成范围伤害', apply: s => s.foxBurst = true },

  // ---- 回响 ----
  { id: 'echo', kanji: '響', name: '回响・贰', rar: 1, max: 2, desc: '收招后残影沿原轨迹再袭一次，造成 45% 伤害', apply: s => s.echo += 1 },
  { id: 'zone', kanji: '域', name: '回响・域', rar: 1, max: 2, desc: '轨迹留下净化区域，持续灼烧 3 秒', apply: s => s.zone += 1 },
  { id: 'shock', kanji: '震', name: '回响・震', rar: 1, max: 2, desc: '收招时在终点爆发冲击波，击退并伤害周围敌人', apply: s => s.shock += 1 },
  { id: 'purge', kanji: '淨', name: '回响・净', rar: 2, max: 1, desc: '单次祓除命中 12 个以上时，触发全屏净化', apply: s => s.purge = true },
];

// ============ 技能（怪物掉落，自动触发） ============
G.SKILLS = {
  thunder: {
    id: 'thunder', name: '落雷・紫电', kanji: '落', max: 3,
    triggerAt: [6, 5, 4],      // 各等级的触发命中数
    maxTargets: [6, 8, 10],    // 各等级最多轰击目标数
    dmgMul: [0.5, 0.7, 0.9],   // 各等级天雷伤害倍率
    trigger: '单次祓除命中次数 ≥ 6 / 5 / 4（对应 Lv.1 / 2 / 3）',
    desc: '单次祓除命中 6/5/4 个以上敌人时（随等级降低），所有紫电同时自天而降，轰击被锁定的目标',
    ascension: '神通・天罚：短暂蓄势后对存活目标再降一次天雷；轰击冻结目标时引发雷霜爆。'
  },
  chainLightning: {
    id: 'chainLightning', name: '链雷・鸣渡', kanji: '鏈', max: 3,
    triggerAt: [4, 3, 2],
    range: [200, 260, 320],
    maxLinks: [3, 5, 7],
    dmgMul: [0.35, 0.5, 0.7],
    trigger: '单次祓除命中次数 ≥ 4 / 3 / 2（对应 Lv.1 / 2 / 3）',
    desc: '祓除后从最后一个目标向本次未锁定的敌人传播；升级提高伤害、链接范围与最大链接数',
    ascension: '神通・雷网：最后一段链雷炸开雷网，伤害附近尚未被链雷命中的敌人。'
  },
  pursuit: {
    id: 'pursuit', name: '追符・千鸟', kanji: '追', max: 3,
    triggerAt: [5, 4, 3],
    shots: [2, 4, 6],
    dmgMul: [0.42, 0.56, 0.7],
    trigger: '单次祓除命中次数 ≥ 5 / 4 / 3（对应 Lv.1 / 2 / 3）',
    desc: '祓除后从轨迹终点放出追符，自动追击本次未锁定的敌人；升级增加追符数量与伤害',
    ascension: '神通・百羽：最后一枚追符命中后绽开符羽，对周围敌人造成一次范围伤害。'
  },
  scatter: {
    id: 'scatter', name: '散华・樱狱', kanji: '華', max: 3,
    triggerAt: [6, 5, 4],
    radius: [105, 135, 165],
    dmgMul: [0.5, 0.7, 0.9],
    trigger: '单次祓除命中次数 ≥ 6 / 5 / 4（对应 Lv.1 / 2 / 3）',
    desc: '祓除后在本次未锁定敌人最密集的位置绽放散华，对范围内所有敌人造成伤害',
    ascension: '神通・万华：散华收束后再次爆开内层花狱，对核心区域追加伤害。'
  },
  starfall: {
    id: 'starfall', name: '星坠・天津', kanji: '星', max: 3,
    triggerAt: [5, 4, 3],
    count: [3, 5, 7],
    dmgMul: [0.38, 0.52, 0.68],
    trigger: '单次祓除命中次数 ≥ 5 / 4 / 3（对应 Lv.1 / 2 / 3）',
    desc: '祓除后在本次未锁定的敌人头顶降下星光；升级增加星数与伤害',
    ascension: '神通・天穹：最后一颗星坠化为天穹爆发，对落点周围敌人造成范围伤害。'
  },
  severance: {
    id: 'severance', name: '断魂・彼岸', kanji: '断', max: 3,
    killsAt: [4, 3, 2],
    targets: [1, 2, 3],
    dmgMul: [0.85, 1.1, 1.4],
    trigger: '单次祓除击杀数 ≥ 4 / 3 / 2（对应 Lv.1 / 2 / 3）',
    desc: '祓除击杀足够敌人后，斩击本次未锁定敌人中生命最高的目标',
    ascension: '神通・彼岸路：断魂目标之间生成彼岸斩线，切开沿线的其他敌人。'
  },
  tide: {
    id: 'tide', name: '灵潮・千引', kanji: '潮', max: 3,
    triggerAt: [7, 6, 5],
    radius: [190, 250, 315],
    dmgMul: [0.3, 0.44, 0.58],
    trigger: '单次祓除命中次数 ≥ 7 / 6 / 5（对应 Lv.1 / 2 / 3）',
    desc: '大量命中后从轨迹终点扩散灵潮，牵引并伤害附近未锁定敌人',
    ascension: '神通・归海：首轮灵潮收束后反向爆发，对聚拢的敌人追加一次伤害。'
  },
  flame: {
    id: 'flame', name: '天火・迦具土', kanji: '炎', max: 3,
    triggerAt: [6, 5, 4],
    radius: [120, 145, 170],
    dmgMul: [0.65, 0.9, 1.15],
    trigger: '单次祓除命中次数 ≥ 6 / 5 / 4（对应 Lv.1 / 2 / 3）',
    desc: '大量命中后在轨迹终点降下天火，对范围内所有敌人造成伤害',
    ascension: '神通・焦土：天火落点化为持续 4 秒的灼烧神域，聚怪效果可将敌人拖入其中。'
  },
  frost: {
    id: 'frost', name: '霜华・雪月', kanji: '霜', max: 3,
    triggerAt: [5, 4, 3],
    duration: [1.0, 1.5, 2.0],
    dmgMul: [0.25, 0.35, 0.45],
    trigger: '单次祓除命中次数 ≥ 5 / 4 / 3（对应 Lv.1 / 2 / 3）',
    desc: '命中足够目标后冻结被锁定的敌人，并追加一次霜华伤害',
    ascension: '神通・冰葬：冻结目标同时陷入易伤，冻结结束时碎冰并波及周围敌人。'
  },
  gale: {
    id: 'gale', name: '风刃・镰鼬', kanji: '風', max: 3,
    lengthAt: [0.75, 0.65, 0.55],
    dmgMul: [0.4, 0.6, 0.8],
    trigger: '至少命中 1 次，且划线用量 ≥ 上限的 75% / 65% / 55%',
    desc: '轨迹利用率达到要求时，风刃沿整条轨迹再次切过所有目标',
    ascension: '神通・返岚：风刃抵达终点后沿轨迹逆行再斩；轨迹转折越多，返岚伤害越高。'
  },
  moon: {
    id: 'moon', name: '月华・断空', kanji: '月', max: 3,
    maxHits: [2, 3, 4],
    dmgMul: [1.2, 1.6, 2.0],
    trigger: '单次祓除命中 1–2 / 1–3 / 1–4 次（对应 Lv.1 / 2 / 3）',
    desc: '单次命中目标较少时，对其中生命最高的目标追加高额月华斩',
    ascension: '神通・满月：月华贯穿目标形成断界斩线；对重复锁定的目标进一步增幅。'
  },
  renewal: {
    id: 'renewal', name: '生玉・返魂', kanji: '生', max: 3,
    killsAt: [3, 2, 1],
    healPerKill: [2, 2.5, 3],
    healCap: [8, 12, 16],
    manaPerKill: [0.35, 0.5, 0.65],
    manaCap: [1.5, 2.5, 3.5],
    cooldown: [7, 6, 5],
    trigger: '单次祓除击杀数 ≥ 3 / 2 / 1（对应 Lv.1 / 2 / 3）・内置冷却 7 / 6 / 5 秒',
    desc: '单次祓除击杀足够敌人时，根据击杀数恢复生命与少量神力；触发后需要短暂蓄养',
    ascension: '神通・轮回：回复溢出与本次击杀会转化为可吸收伤害的生玉护盾。'
  }
};

G.SKILL_ORDER = [
  'thunder', 'chainLightning', 'pursuit', 'scatter', 'starfall', 'severance', 'tide',
  'flame', 'frost', 'gale', 'moon', 'renewal'
];

// 右键主动术：同一时间只装备一种。开局默认为神隐步，其余通过商店替换。
G.ACTIVE_SKILLS = {
  dodge: {
    id: 'dodge', kanji: '隐', name: '神隐步', cooldown: 5, baseCost: 30, rar: 1,
    desc: '向鼠标方向闪身，获得短暂无敌，并切开闪避路线上的咒弹。',
    effect: '位移约 310・无敌 0.28 秒・沿途断弹'
  },
  shockwave: {
    id: 'shockwave', kanji: '震', name: '退魔震', cooldown: 9, baseCost: 34, rar: 1,
    desc: '释放环形退魔冲击，弹开贴近的敌人并震碎周围咒弹。',
    effect: '近身解围・低伤害・强击退'
  },
  vacuum: {
    id: 'vacuum', kanji: '吸', name: '引魂风穴', cooldown: 11, baseCost: 38, rar: 1,
    desc: '在鼠标方向展开短暂风穴，把前方扇形区域内的敌人吸向同一处。',
    effect: '持续聚怪 1.1 秒・为下一笔创造密集目标'
  },
  aftertrail: {
    id: 'aftertrail', kanji: '返', name: '返迹・残光', cooldown: 11, baseCost: 46, rar: 2,
    desc: '逆向重放上一笔完整轨迹，斩击沿线目标，并追斩上一笔命中后仍存活的敌人。',
    effect: '沿线 80% 基础伤害・追斩残存目标・再次断弹、破契与解咒'
  },
  empower: {
    id: 'empower', kanji: '神', name: '一笔入神', cooldown: 18, baseCost: 48, rar: 2,
    desc: '强化五秒内开始绘制的下一笔，让轨迹更长、更宽且只消耗一半神力。',
    effect: '长度 +40%・索敌宽度 +25%・消耗 -50%'
  }
};

G.ACTIVE_SKILL_ORDER = ['dodge', 'shockwave', 'vacuum', 'aftertrail', 'empower'];

G.rollSkill = function (ownedSkills, game) {
  const pool = G.SKILL_ORDER.filter(id => (ownedSkills[id] || 0) < G.SKILLS[id].max);
  if (!pool.length) return null;
  // 未修得技能仍有基础优先级；已有构筑只提高同流派技能的权重，不锁死其他选择。
  const buildState = game && G.getBuildState ? G.getBuildState(game) : null;
  const weights = pool.map(id => {
    let weight = ownedSkills[id] ? 1 : 2.4;
    if (buildState && G.buildsFor) {
      const affinity = G.buildsFor('skills', id);
      let best = 0;
      for (const buildId of affinity) best = Math.max(best, buildState[buildId].score);
      weight *= 1 + Math.min(1.25, best * 0.16);
    }
    return weight;
  });
  let total = 0;
  for (const w of weights) total += w;
  let roll = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return pool[i];
  }
  return pool[pool.length - 1];
};

G.UPG_MAP = {};
for (const u of G.UPGRADES) G.UPG_MAP[u.id] = u;

// 基础数值 + 应用所有已购强化 → stats
G.computeStats = function (owned) {
  const s = {
    trailLen: 540 * G.WORLD_UNIT, lockR: 42 * G.WORLD_UNIT, magnet: 1, maxLock: 7, retraceLevel: 0, repeatHits: 0, cost: 26, regen: 5,
    dmg: 34, eliteDmg: 1, comboStep: 0, lengthDmg: 0, fullHp: 0,
    execute: 0, crowdDmg: 0, lowHpDmg: 0,
    maxHp: 100, maxMana: 100, speed: 265 * G.WORLD_UNIT, healOnPick: 0,
    comboShield: 0, xpMul: 1,
    ofuda: false, ofudaSpread: false, ofudaVuln: false,
    fox: 0, foxEvery: 5, foxTrail: false, foxBurst: false,
    echo: 0, zone: 0, shock: 0, purge: false
  };
  for (const id in owned) {
    const u = G.UPG_MAP[id];
    for (let i = 0; i < owned[id]; i++) {
      if (id === 'fox') { s.fox++; continue; }
      u.apply(s);
    }
  }
  return s;
};

// 抽取三张卡
G.rollUpgrades = function (owned, game) {
  const avail = G.UPGRADES.filter(u => {
    const n = owned[u.id] || 0;
    if (n >= u.max) return false;
    if (u.req && !owned[u.req]) return false;
    return true;
  });
  const out = [];
  const pool = avail.slice();
  const rarityWeight = u => u.rar === 0 ? 66 : u.rar === 1 ? 28 : 6;
  const pickFrom = source => {
    if (!source.length) return null;
    const weights = source.map(rarityWeight);
    let sum = 0; for (const w of weights) sum += w;
    let r = Math.random() * sum, idx = 0;
    for (; idx < source.length; idx++) { r -= weights[idx]; if (r <= 0) break; }
    return source[Math.min(idx, source.length - 1)];
  };

  // 已有两点倾向后，三张升级中保底一张属于当前主流派。
  const dominant = game && G.getDominantBuild ? G.getDominantBuild(game, 2) : null;
  if (dominant) {
    const aligned = pool.filter(u => dominant.def.upgrades.includes(u.id));
    const picked = pickFrom(aligned);
    if (picked) {
      out.push(picked);
      pool.splice(pool.indexOf(picked), 1);
    }
  }

  while (out.length < 3 && pool.length) {
    // 稀有度权重
    const picked = pickFrom(pool);
    out.push(picked);
    pool.splice(pool.indexOf(picked), 1);
  }
  // 兜底：补给卡
  const fallbacks = [
    { id: '_heal', kanji: '饌', name: '神饌补给', rar: 0, desc: '立即恢复 40 点生命' },
    { id: '_mana', kanji: '霊', name: '灵力灌注', rar: 0, desc: '神力完全恢复，且本局伤害 +8%' },
  ];
  let fi = 0;
  while (out.length < 3) out.push(fallbacks[fi++ % 2]);
  return out;
};
