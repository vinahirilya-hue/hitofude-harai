// ============ 关卡、掉落与商店配置（保持数据驱动，便于迁移 Unity） ============
window.G = window.G || {};

G.TOTAL_WAVES = 20;

// 敌人解锁表与基础权重。生成导演只依赖这里的数据，后续增加新怪时无需重写分支。
G.ENEMY_ROSTER = [
  { type: 'chaser', unlock: 1, weight: 34 },
  { type: 'dasher', unlock: 3, weight: 18 },
  { type: 'moth', unlock: 4, weight: 16 },
  { type: 'splitter', unlock: 5, weight: 11 },
  { type: 'ranged', unlock: 6, weight: 14 },
  { type: 'siphon', unlock: 8, weight: 9 },
  { type: 'guardian', unlock: 9, weight: 12 },
  { type: 'binder', unlock: 11, weight: 9 },
  { type: 'chanter', unlock: 12, weight: 8 },
];

G.ELITE_ROSTER = [
  { type: 'elite', unlock: 3, weight: 42 },
  { type: 'wardenElite', unlock: 8, weight: 25 },
  { type: 'summonerElite', unlock: 10, weight: 18 },
  { type: 'reaperElite', unlock: 13, weight: 22 },
  { type: 'sealerElite', unlock: 16, weight: 16 },
];

// 每五关构成一章。章节不仅改变数值，也会改变敌群构成、队形、共生线密度和战场事件。
G.WAVE_CHAPTERS = [
  {
    id: 'shadowHunt', kanji: '影', name: '影狩之夜', color: '#d9c6ff',
    desc: '追猎妖群从战场边缘结成锋矢压境，考验短线截击和快速换位。',
    formation: 'wedge', event: 'rush', eventEvery: 15.5,
    enemyBias: { chaser: 1.45, dasher: 1.5, moth: 1.2, splitter: 0.75 },
    eliteBias: { elite: 1.45, wardenElite: 0.7 },
    linkChance: 0, linkCap: 0,
  },
  {
    id: 'curseRain', kanji: '雨', name: '咒雨之庭', color: '#8fdcff',
    desc: '远射妖与噬灵妖呈弧阵包围，周期性咒雨迫使巫女用轨迹断弹。',
    formation: 'arc', event: 'rain', eventEvery: 13.5,
    enemyBias: { ranged: 2.15, moth: 1.45, siphon: 1.45, chaser: 0.72 },
    eliteBias: { wardenElite: 1.55, summonerElite: 1.2 },
    linkChance: 0.1, linkCap: 1,
  },
  {
    id: 'bindingGrove', kanji: '縛', name: '缚阵之森', color: '#ff9b8d',
    desc: '守阵妖、缚足妖与吟咒妖沿阵列同行，共生赤线会令相连目标免伤。',
    formation: 'line', event: 'bind', eventEvery: 12,
    enemyBias: { guardian: 1.85, binder: 2, chanter: 1.5, ranged: 0.8 },
    eliteBias: { summonerElite: 1.45, reaperElite: 1.5 },
    linkChance: 0.5, linkCap: 4,
  },
  {
    id: 'evernight', kanji: '闇', name: '百鬼常暗', color: '#ff72c3',
    desc: '全部妖类组成旋阵，妖潮会混入高阶异种，所有划线技巧都将受到检验。',
    formation: 'spiral', event: 'nightTide', eventEvery: 10.8,
    enemyBias: { splitter: 1.5, siphon: 1.3, guardian: 1.25, binder: 1.4, chanter: 1.75 },
    eliteBias: { reaperElite: 1.45, sealerElite: 1.8, summonerElite: 1.2 },
    linkChance: 0.32, linkCap: 4,
  },
];

G.WAVE_TRIALS = [
  { id: 'opening', kanji: '序', name: '序阵', desc: '辨认本章敌群与阵型。', eventMul: 1.2 },
  { id: 'horde', kanji: '群', name: '群集', desc: '每支妖群额外增加一名敌人。', squadBonus: 1 },
  { id: 'assault', kanji: '袭', name: '急袭', desc: '更多妖群会在玩家附近压境。', assaultBonus: 0.16, eventMul: 0.88 },
  { id: 'elite', kanji: '荒', name: '荒魂', desc: '精英更早、更频繁地出现。', eliteDelayMul: 0.7, eliteIntervalMul: 0.8 },
  { id: 'boss', kanji: '主', name: '祟主', desc: '本章祟主现世，击破其专属权能。', eventMul: 1 },
];

G.getWaveChapter = function (wave) {
  return G.WAVE_CHAPTERS[G.util.clamp(Math.floor((wave - 1) / 5), 0, G.WAVE_CHAPTERS.length - 1)];
};

G.getWaveTrial = function (wave) {
  return G.WAVE_TRIALS[G.util.clamp((wave - 1) % 5, 0, G.WAVE_TRIALS.length - 1)];
};

G.WAVES = [];
for (let i = 1; i <= G.TOTAL_WAVES; i++) {
  const bossTier = i % 5 === 0 ? i / 5 : 0;
  const duration = bossTier ? 90 : i < 5 ? 30 : i < 10 ? 40 : i < 15 ? 50 : 60;
  const dangerTier = i <= 4 ? 0 : i <= 9 ? 1 : i <= 14 ? 2 : 3;
  const chapter = G.getWaveChapter(i);
  const trial = G.getWaveTrial(i);
  G.WAVES.push({
    id: i,
    duration,
    boss: bossTier > 0,
    bossTier,
    chapterId: chapter.id,
    chapterName: chapter.name,
    trialId: trial.id,
    trialName: trial.name,
    stageLabel: chapter.kanji + '・' + trial.kanji,
    dangerTier,
    dangerLabel: ['清净', '警戒', '凶险', '大祸'][dangerTier],
    // 小队刷新回调至中等密度：仍高于旧版，但给玩家留出组织轨迹的间隙。
    spawnInterval: Math.max(0.72, 1.25 - (i - 1) * 0.028),
    squadMin: Math.min(5, 3 + Math.floor((i - 1) / 8)),
    squadMax: Math.min(7, 5 + Math.floor((i - 1) / 6)),
    maxEnemies: Math.round(42 + (i - 1) * 4 + Math.max(0, i - 10) * 1.2),
    // 第 9 波后进入非线性生命成长，避免后期伤害成型后所有杂兵仍被同一刀清空。
    hpMul: 1 + (i - 1) * 0.12 + Math.pow(Math.max(0, i - 8), 2) * 0.012,
    // 生存压力分段成长：前五关保持教学余裕，之后伤害、追击与弹速逐步拉开。
    enemyDamageMul: 1 + (i - 1) * 0.045 +
      Math.max(0, i - 5) * 0.035 + Math.max(0, i - 12) * 0.045,
    enemySpeedMul: 1 + (i - 1) * 0.01 + Math.max(0, i - 8) * 0.012,
    projectileSpeedMul: 1 + (i - 1) * 0.012 + Math.max(0, i - 10) * 0.018,
    enemyAttackRate: 1 + Math.max(0, i - 5) * 0.018 + Math.max(0, i - 12) * 0.014,
    // 后期有部分小队在玩家周围的安全环外压境，其余仍可刷新在全战场任意位置。
    assaultChance: i <= 5 ? 0 : Math.min(0.48, (i - 5) * 0.032),
    hurtGrace: Math.max(0.58, 0.92 - (i - 1) * 0.018),
    postAttackGrace: Math.max(0.10, 0.32 - (i - 1) * 0.012),
    eliteDelay: i < 3 ? 0 : Math.max(11, 19 - Math.floor(i / 3)),
    eliteInterval: i < 3 ? 0 : Math.max(15, 30 - Math.floor(i * 0.7)),
    eliteCap: i < 8 ? 1 : i < 15 ? 2 : 3,
    // 高怪量下按单怪约 0.35%～0.6% 控制技能产出；精英仍为 5 倍，Boss 仍必掉。
    skillDrop: 0.0035 + i * 0.00012,
    bossHpMul: bossTier ? 1 + (bossTier - 1) * 0.72 + Math.pow(bossTier - 1, 2) * 0.16 : 1,
    bossDamageMul: bossTier ? 1 + (bossTier - 1) * 0.4 : 1,
  });
}

G.getWave = function (wave) {
  return G.WAVES[G.util.clamp(wave, 1, G.TOTAL_WAVES) - 1];
};

// 灵脉连祷会在每个非 Boss 祟章生成一次。点数越多，奖励倍率越高；
// 奖励种类在生成时便确定，并用节点颜色提示玩家。
G.SPIRIT_REWARDS = {
  power: { id: 'power', kanji: '威', name: '神威祝祷', color: '#ffe2a0',
    desc: '大幅强化完成连祷的这一击，并恢复少量神力。' },
  mana: { id: 'mana', kanji: '泉', name: '灵泉祝祷', color: '#9fffe0',
    desc: '恢复大量神力，并小幅强化完成连祷的这一击。' },
  jade: { id: 'jade', kanji: '玉', name: '玉脉祝祷', color: '#ffd36f',
    desc: '立即获得灵玉；连祷点数越高，所得灵玉越多。' },
  ward: { id: 'ward', kanji: '护', name: '护生祝祷', color: '#9fd7ff',
    desc: '恢复生命并获得可叠加的护印。' },
  haste: { id: 'haste', kanji: '迅', name: '时祷祝祷', color: '#e1b5ff',
    desc: '缩短主动术式剩余冷却，并强化完成连祷的这一击。' }
};
G.SPIRIT_REWARD_ORDER = ['power', 'mana', 'jade', 'ward', 'haste'];

// 商店分为免费补给、固定基础商品、随机珍品三套独立数据。
// 字段保持简单，迁移 Unity 时可以逐项映射到 ScriptableObject。
G.SHOP_FREE_ITEMS = [
  { id: 'freeHeal', kanji: '癒', name: '御神水', desc: '立即恢复 35 点生命。', effect: { type: 'heal', value: 35 } },
  { id: 'freeMana', kanji: '澄', name: '澄心露', desc: '立即恢复全部神力。', effect: { type: 'mana' } },
  { id: 'freePaper', kanji: '替', name: '替身纸人', desc: '下一关抵挡一次伤害。', effect: { type: 'paper' } },
  { id: 'freeJade', kanji: '財', name: '奉纳小判', desc: '立即获得 8 枚灵玉。', effect: { type: 'jade', value: 8 } },
];

G.SHOP_BASE_ITEMS = [
  { id: 'baseEdge', kanji: '鋒', name: '祓魔砥石', rar: 0, baseCost: 24, desc: '基础伤害提高 25%。', effect: { type: 'upgrade', id: 'edge' } },
  { id: 'baseThread', kanji: '絲', name: '朱丝一束', rar: 0, baseCost: 20, desc: '最大轨迹长度提高 25%。', effect: { type: 'upgrade', id: 'thread' } },
  { id: 'baseLock', kanji: '鎖', name: '千结神铃', rar: 0, baseCost: 22, desc: '最大锁定数量增加 3。', effect: { type: 'upgrade', id: 'lock' } },
  { id: 'baseSpring', kanji: '泉', name: '灵泉勾玉', rar: 0, baseCost: 22, desc: '移动时神力恢复速度提高 25%。', effect: { type: 'upgrade', id: 'spring' } },
  { id: 'baseBody', kanji: '守', name: '守心御札', rar: 0, baseCost: 26, desc: '生命上限增加 25，并恢复生命。', effect: { type: 'upgrade', id: 'body' } },
  { id: 'baseWind', kanji: '風', name: '风行足袋', rar: 0, baseCost: 20, desc: '普通移动速度提高 12%。', effect: { type: 'upgrade', id: 'wind' } },
];

// 通用珍品改变构筑方向；流派珍品只有拥有对应前置时才进入随机池。
G.SHOP_RELICS = [
  { id: 'iaidoStone', kanji: '居', name: '纳刀砥石', rar: 1, baseCost: 32, max: 2, weight: 24,
    desc: '一笔命中 1～3 个目标时，主祓除伤害每阶提高 35%。' },
  { id: 'hordeScroll', kanji: '群', name: '百鬼绘卷', rar: 1, baseCost: 30, max: 2, weight: 24,
    desc: '一笔命中 8 个以上目标时，主祓除伤害每阶提高 20%。' },
  { id: 'returnBell', kanji: '返', name: '回灵神铃', rar: 1, baseCost: 28, max: 1, weight: 22,
    desc: '一笔命中 6 个以上目标时，返还 20% 神力消耗。' },
  { id: 'wealthCoin', kanji: '財', name: '招财御币', rar: 1, baseCost: 34, max: 3, weight: 18,
    desc: '妖怪掉落的灵玉每阶增加 25%。' },
  { id: 'guardMirror', kanji: '鏡', name: '护身神镜', rar: 2, baseCost: 48, max: 1, weight: 8,
    desc: '完成一次命中祓除后获得护盾，冷却 8 秒。' },
  { id: 'bloodContract', kanji: '契', name: '血契勾玉', rar: 2, baseCost: 42, max: 2, weight: 9,
    desc: '每阶基础伤害提高 30%，生命上限降低 20。' },
  { id: 'prayerBranch', kanji: '祈', name: '祈愿玉串', rar: 0, baseCost: 26, max: 10, weight: 18,
    desc: '本局基础伤害永久提高 8%。' },
  { id: 'superPurgeSeal', kanji: '超', name: '越祓勾玉', rar: 2, baseCost: 58, max: 1, weight: 7, mechanic: true,
    desc: '主祓除造成显著伤害溢出时触发“超祓”，将多余伤害扩散给附近敌人，并可连续引爆。' },

  { id: 'foxFang', kanji: '牙', name: '焦尾狐牙', rar: 1, baseCost: 34, max: 3, weight: 26, flow: '狐火', reqOwned: 'fox',
    desc: '狐火造成的所有伤害每阶提高 25%。' },
  { id: 'foxTwin', kanji: '双', name: '双尾残面', rar: 2, baseCost: 52, max: 1, weight: 9, flow: '狐火', reqOwned: 'fox',
    desc: '每次触发狐火时，额外诞生一团狐火。' },
  { id: 'ofudaInk', kanji: '墨', name: '蚀灵朱墨', rar: 1, baseCost: 34, max: 3, weight: 26, flow: '符札', reqOwned: 'ofuda',
    desc: '符札爆炸与传递伤害每阶提高 25%。' },
  { id: 'ofudaWide', kanji: '界', name: '广渡结界', rar: 1, baseCost: 30, max: 2, weight: 22, flow: '符札', reqOwned: 'ofudaSpread',
    desc: '符札传递范围每阶扩大 30。' },
  { id: 'echoMirror', kanji: '影', name: '残照古镜', rar: 1, baseCost: 36, max: 3, weight: 26, flow: '回响', reqOwned: 'echo',
    desc: '回响残影伤害每阶提高 25%。' },
  { id: 'zoneIncense', kanji: '香', name: '净域沉香', rar: 1, baseCost: 32, max: 2, weight: 22, flow: '回响', reqOwned: 'zone',
    desc: '净化区域每阶扩大 12，持续时间增加 0.5 秒。' },
  { id: 'shockBell', kanji: '震', name: '鸣震神铃', rar: 1, baseCost: 36, max: 2, weight: 22, flow: '回响', reqOwned: 'shock',
    desc: '终点冲击波每阶扩大 20，伤害提高 25%。' },
  { id: 'purgeSeal', kanji: '淨', name: '大祓秘印', rar: 2, baseCost: 56, max: 2, weight: 8, flow: '回响', reqOwned: 'purge',
    desc: '全屏净化所需命中数每阶降低 1。' },
  { id: 'thunderDrum', kanji: '鼓', name: '鸣雷残鼓', rar: 1, baseCost: 38, max: 2, weight: 24, flow: '落雷', reqSkill: 'thunder',
    desc: '落雷最大轰击目标每阶增加 2。' },
  { id: 'thunderNeedle', kanji: '針', name: '引雷神针', rar: 1, baseCost: 38, max: 3, weight: 24, flow: '落雷', reqSkill: 'thunder',
    desc: '落雷伤害每阶提高 20%。' },
  { id: 'flameChalice', kanji: '盃', name: '迦具土酒盏', rar: 1, baseCost: 38, max: 3, weight: 22, flow: '天火', reqSkill: 'flame',
    desc: '天火伤害每阶提高 15%，爆心与焦土范围每阶扩大 12%。' },
  { id: 'frostHairpin', kanji: '花', name: '六花冰簪', rar: 1, baseCost: 36, max: 3, weight: 22, flow: '霜华', reqSkill: 'frost',
    desc: '冻结时间每阶延长 0.3 秒；冰葬范围每阶扩大 12。' },
  { id: 'galeFeather', kanji: '羽', name: '镰鼬尾羽', rar: 1, baseCost: 36, max: 3, weight: 22, flow: '风刃', reqSkill: 'gale',
    desc: '风刃伤害每阶提高 18%，触发所需轨迹利用率每阶降低 4%。' },
  { id: 'moonMirror', kanji: '朧', name: '月读残镜', rar: 2, baseCost: 54, max: 2, weight: 9, flow: '月华', reqSkill: 'moon',
    desc: '月华每阶对另一名高生命目标追加一次 55% 伤害的半月斩。' },
  { id: 'renewalRosary', kanji: '珠', name: '常世念珠', rar: 1, baseCost: 38, max: 3, weight: 22, flow: '生玉', reqSkill: 'renewal',
    desc: '生玉恢复量每阶提高 18%；轮回护盾上限每阶增加 10。' },
  { id: 'starBell', kanji: '星', name: '天津星铃', rar: 1, baseCost: 38, max: 3, weight: 22, flow: '星坠', reqSkill: 'starfall',
    desc: '星坠每阶增加 1 颗星，伤害提高 15%。' },
  { id: 'severanceInk', kanji: '岸', name: '彼岸朱墨', rar: 2, baseCost: 52, max: 2, weight: 10, flow: '断魂', reqSkill: 'severance',
    desc: '断魂每阶增加 1 个目标，伤害提高 20%。' },
  { id: 'tidePearl', kanji: '潮', name: '归海灵珠', rar: 1, baseCost: 38, max: 3, weight: 22, flow: '灵潮', reqSkill: 'tide',
    desc: '灵潮每阶扩大 25 范围，伤害提高 15%。' },

  // 神兵专属珍品：只有对应武器在携行栏中时才会进入商店。
  { id: 'ritualScabbard', kanji: '祝', name: '祝词白鞘', rar: 1, baseCost: 34, max: 2, weight: 20, flow: '御神刀', reqWeapon: 'ritualBlade',
    desc: '御神刀一笔中的第一斩与最后一斩每阶提高 25% 伤害。' },
  { id: 'naginataPennant', kanji: '幡', name: '破阵赤幡', rar: 1, baseCost: 38, max: 3, weight: 20, flow: '薙刀', reqWeapon: 'naginata',
    desc: '薙刀伤害每阶提高 15%，直线索敌宽度每阶扩大 12%。' },
  { id: 'bowQuiver', kanji: '箙', name: '追星神箙', rar: 1, baseCost: 38, max: 3, weight: 20, flow: '梓弓', reqWeapon: 'bow',
    desc: '破魔箭末端爆炸每阶扩大 25，伤害每阶提高 20%。' },
  { id: 'chainWeight', kanji: '錘', name: '缚魂陨铁', rar: 1, baseCost: 38, max: 3, weight: 20, flow: '锁镰', reqWeapon: 'kusarigama',
    desc: '闭合判定距离每阶放宽 14，收界伤害每阶提高 20%。' },
  { id: 'odachiSheath', kanji: '黑', name: '断界黑鞘', rar: 1, baseCost: 40, max: 3, weight: 20, flow: '大太刀', reqWeapon: 'odachi',
    desc: '大太刀索敌宽度每阶扩大 10%，最长距离增伤上限每阶增加 15%。' },
  { id: 'goheiTassel', kanji: '招', name: '招魂纸垂', rar: 1, baseCost: 38, max: 3, weight: 20, flow: '御币', reqWeapon: 'gohei',
    desc: '招魂阵每阶扩大 30 范围，伤害提高 20%。' },
  { id: 'fanRibs', kanji: '舞', name: '回天扇骨', rar: 1, baseCost: 38, max: 3, weight: 20, flow: '双扇', reqWeapon: 'fans',
    desc: '双扇主祓除伤害每阶提高 15%。' },

  { id: 'wardBreaker', kanji: '穿', name: '碎界鹿角', rar: 1, baseCost: 36, max: 2, weight: 18,
    desc: '攻击处于护界或甲壳状态的敌人时，每阶提高 35% 伤害。' },
  { id: 'hunterEye', kanji: '狩', name: '狩魂邪眼', rar: 2, baseCost: 50, max: 2, weight: 9, flow: '斩杀', reqOwned: 'execution',
    desc: '对生命低于 35% 的敌人，每阶额外提高 20% 伤害。' },

  // 通用连段珍品：强化一笔中的位置与收尾，而非单纯堆叠基础攻击。
  { id: 'firstSeal', kanji: '壱', name: '一番御札', rar: 1, baseCost: 34, max: 2, weight: 20, mechanic: 'order',
    desc: '一笔中的第一次主祓除伤害每阶提高 30%。' },
  { id: 'lastOrb', kanji: '末', name: '终祓鸣玉', rar: 2, baseCost: 50, max: 2, weight: 9, mechanic: 'order',
    desc: '最后一次主祓除在目标处引爆鸣玉；每阶提高爆炸范围与伤害。' },

  // 轨迹珍品：直接读取玩家画出的几何形状，形成区别于数值强化的构筑。
  { id: 'turnCrane', kanji: '折', name: '折锋纸鹤', rar: 1, baseCost: 36, max: 3, weight: 24, mechanic: 'turn',
    desc: '轨迹出现明显转折时释放风刃；每阶提高风刃伤害，每笔最多触发 5 次。' },
  { id: 'crossMirror', kanji: '交', name: '交错古镜', rar: 2, baseCost: 54, max: 2, weight: 9, mechanic: 'cross',
    desc: '轨迹自相交时在交点爆炸；每阶提高爆炸伤害与每笔触发上限。' },
  { id: 'closedRope', kanji: '結', name: '封界注连绳', rar: 2, baseCost: 56, max: 1, weight: 8, mechanic: 'closed',
    desc: '闭合轨迹完成时收束结界，牵引并伤害圈内的全部敌人。' },
  { id: 'startBell', kanji: '始', name: '起笔神铃', rar: 1, baseCost: 32, max: 3, weight: 22, mechanic: 'start',
    desc: '发动时在轨迹起点敲响冲击波；每阶提高伤害与作用范围。' },
  { id: 'endSeal', kanji: '終', name: '收笔朱印', rar: 1, baseCost: 34, max: 3, weight: 22, mechanic: 'end',
    desc: '抵达轨迹终点时引爆朱印；每阶提高伤害与作用范围。' },
  { id: 'shortTalisman', kanji: '寸', name: '寸祓短册', rar: 1, baseCost: 34, max: 2, weight: 20, mechanic: 'short',
    desc: '轨迹长度不超过 260 时，主祓除伤害每阶提高 35%。' },

  // 重巡与群攻珍品：让返祓和大量连接形成新的触发链。
  { id: 'sevenMagatama', kanji: '七', name: '七返勾玉', rar: 2, baseCost: 52, max: 2, weight: 9, mechanic: 'repeat',
    desc: '同一目标每累计受到 3 次主祓除，追加一次延迟斩击。' },
  { id: 'armorAwl', kanji: '穿', name: '破甲神锥', rar: 1, baseCost: 38, max: 3, weight: 22, mechanic: 'repeat',
    desc: '对同一目标的每次重复攻击，伤害每阶递增 12%。' },
  { id: 'spiritShuttle', kanji: '梭', name: '回灵飞梭', rar: 1, baseCost: 32, max: 2, weight: 22, mechanic: 'repeat',
    desc: '每次重复命中返还神力；每阶返还 1 点，单次最多返还本次消耗的 30%。' },
  { id: 'hundredLamp', kanji: '灯', name: '百鬼行灯', rar: 2, baseCost: 50, max: 2, weight: 10, mechanic: 'crowd',
    desc: '一笔每连接 8 个不同目标，便释放追踪敌人的行灯魂火。' },
  { id: 'soulGourd', kanji: '葫', name: '收魂葫芦', rar: 1, baseCost: 38, max: 2, weight: 18, mechanic: 'kill',
    desc: '单次主祓除每击杀 3 个敌人，在终点引发一次聚魂爆炸。' },

  // 连祷异珍：强化三至九点交叉星轨的收益，也为失败路线提供有限止损。
  { id: 'nineStarChart', kanji: '曜', name: '九曜星图', rar: 2, baseCost: 58, max: 2, weight: 8, mechanic: 'prayer',
    desc: '灵脉连祷的数值奖励每阶提高 20%；八、九连祷显现技能卷轴的概率每阶增加 15%。' },
  { id: 'prayerCoin', kanji: '巡', name: '星巡小判', rar: 1, baseCost: 38, max: 2, weight: 19, mechanic: 'prayer',
    desc: '完成五点以上连祷时，按超过四点的节点数额外获得灵玉。' },
  { id: 'brokenRosary', kanji: '断', name: '断祷残珠', rar: 1, baseCost: 32, max: 2, weight: 20, mechanic: 'prayer',
    desc: '连祷失败时，按本次正确连接的节点数返还神力；事件仍会立即消失。' },

  // 术式与换装异珍：鼓励改变每一笔的形状和在两把神兵之间主动轮转。
  { id: 'sixPathWheel', kanji: '六', name: '六道轮印', rar: 2, baseCost: 54, max: 2, weight: 9, mechanic: 'form',
    desc: '连续发动不同轨迹术式时，本次主祓除每阶提高 18% 伤害，并恢复 2 点神力。' },
  { id: 'twinScabbard', kanji: '双', name: '比翼双鞘', rar: 2, baseCost: 60, max: 1, weight: 7, mechanic: 'swap', reqTwoWeapons: true,
    desc: '切换神兵后，使下一次有效祓除不消耗神力且伤害提高 35%；冷却 10 秒。' },

  // 主动术式与连斩异珍：让右键技能和高连斩之间形成循环。
  { id: 'spellReturnGem', kanji: '术', name: '术返勾玉', rar: 1, baseCost: 40, max: 2, weight: 18, mechanic: 'active',
    desc: '发动主动术式后，下一次有效祓除每阶提高 20% 伤害，并降低 15% 神力消耗。' },
  { id: 'eightEchoBell', kanji: '八', name: '八响神铃', rar: 1, baseCost: 38, max: 3, weight: 20, mechanic: 'active',
    desc: '一笔命中至少 8 次时，主动术式剩余冷却每阶缩短 1.5 秒。' },
  { id: 'stillHourglass', kanji: '止', name: '止界砂漏', rar: 2, baseCost: 52, max: 2, weight: 9, mechanic: 'combo',
    desc: '一笔命中至少 12 次时，短暂停止场上所有普通与精英妖怪；每阶延长停止时间。' },

  // 狩猎与生存异珍：提供经济节奏、补给循环和两种不同的保命方式。
  { id: 'eliteBounty', kanji: '赏', name: '荒魂赏札', rar: 1, baseCost: 36, max: 3, weight: 19, mechanic: 'kill',
    desc: '击杀精英荒魂时，每阶立即获得 2 枚灵玉并恢复 3 点神力。' },
  { id: 'hundredLedger', kanji: '录', name: '百鬼奉行录', rar: 1, baseCost: 36, max: 2, weight: 18, mechanic: 'kill',
    desc: '累计击杀一定数量的有掉落妖怪后，获得生命、神力或灵玉补给；升阶会缩短间隔。' },
  { id: 'scarletUmbrella', kanji: '伞', name: '退魔朱伞', rar: 1, baseCost: 42, max: 2, weight: 16, mechanic: 'defense',
    desc: '生命受到伤害时撑开朱伞，斩灭附近弹幕并弹开妖怪；升阶扩大范围并缩短冷却。' },
  { id: 'returnSoulRope', kanji: '返', name: '返魂结绳', rar: 2, baseCost: 62, max: 1, weight: 6, mechanic: 'defense',
    desc: '每关一次，受到致命伤害时保留 1 点生命、清除全部敌弹并获得短暂无敌。' },

  { id: 'shuraMask', kanji: '修', name: '修罗鬼面', rar: 2, baseCost: 46, max: 1, weight: 8, mechanic: 'cursed', cursed: true,
    desc: '生命上限降低 25；重复锁定次数 +1，最大锁定数 +2。' },
];

// 主动术契约与珍品共用随机四件的商店货架，但购买后替换右键主动槽，
// 不进入珍品行囊，也不会出现在 Boss 珍品奉纳中。
G.ACTIVE_SKILL_ITEMS = G.ACTIVE_SKILL_ORDER.map(id => {
  const skill = G.ACTIVE_SKILLS[id];
  return {
    id: 'active_' + id, kanji: skill.kanji, name: skill.name + '・术契',
    rar: skill.rar, baseCost: skill.baseCost, max: 1,
    weight: skill.rar === 2 ? 10 : 18, activeSkill: id,
    desc: skill.desc + '　装备后由鼠标右键发动。'
  };
});
G.SHOP_RELICS.push(...G.ACTIVE_SKILL_ITEMS);

G.SHOP_RELIC_MAP = {};
for (const item of G.SHOP_RELICS) G.SHOP_RELIC_MAP[item.id] = item;

G.RELIC_MECHANIC_LABELS = {
  prayer: '连祷异珍', form: '术式异珍', swap: '换装异珍',
  active: '主动异珍', combo: '连斩异珍', kill: '狩猎异珍',
  defense: '护命异珍', repeat: '重巡异珍', crowd: '群祓异珍',
  order: '连段异珍', turn: '轨迹异珍', cross: '轨迹异珍',
  closed: '轨迹异珍', start: '轨迹异珍', end: '轨迹异珍',
  short: '轨迹异珍', cursed: '禁忌咒物'
};
G.relicMechanicLabel = function (item) {
  return item && G.RELIC_MECHANIC_LABELS[item.mechanic] || '机制异珍';
};

// ============ 开局命格 ============
// 命格与武器、技能、共鸣正交：它改变整局规则，而不是指定某一种轨迹形状。
G.FATES = {
  attendant: {
    id: 'attendant', kanji: '百', name: '百鬼侍从', color: '#ffe0a0',
    style: '多秘法・式神共行',
    desc: '开局修得一项随机自动秘法，自动技能槽由四个增加至六个。',
    boon: '自动技能槽 6・开局随机秘法',
    bane: '每次祓除神力消耗 +15%',
    skillSlots: 6, costMul: 1.15
  },
  dancer: {
    id: 'dancer', kanji: '舞', name: '神乐舞姬', color: '#ffb5df',
    style: '主动术・祓除节拍',
    desc: '主动术调息显著缩短，高评级祓除还会继续削减当前冷却。',
    boon: '主动术冷却 -35%・评级祓除缩短调息',
    bane: '主祓除伤害 -15%',
    activeCdMul: 0.65, damageMul: 0.85
  },
  shura: {
    id: 'shura', kanji: '修', name: '修罗命格', color: '#ff776f',
    style: '残命・高伤・重巡',
    desc: '舍弃大半生命上限换取高额伤害、移动速度与额外重复锁定。',
    boon: '伤害 +35%・移速 +10%・重复锁定 +1',
    bane: '生命上限 -45%',
    damageMul: 1.35, speedMul: 1.1, maxHpMul: 0.55, repeatBonus: 1, lockBonus: 2
  },
  offering: {
    id: 'offering', kanji: '奉', name: '奉纳命格', color: '#e6c37a',
    style: '灵玉・商店经营',
    desc: '以较弱的直接战力换取更多灵玉和更低的商店、换签价格。',
    boon: '灵玉获取 +25%・商店与换签 -25%',
    bane: '主祓除伤害 -12%',
    damageMul: 0.88, jadeMul: 1.25, priceMul: 0.75
  },
  bladeless: {
    id: 'bladeless', kanji: '無', name: '无刀命格', color: '#d6ecff',
    style: '唯一神兵・极致专精',
    desc: '整局只能携行开局神兵；每位祟主被祓除后，唯一神兵都会继续开眼。',
    boon: '唯一神兵获得伤害、长度与宽度强化',
    bane: '无法获得或替换第二把武器',
    weaponLimit: 1
  },
  omagatoki: {
    id: 'omagatoki', kanji: '逢', name: '逢魔命格', color: '#d29cff',
    style: '高密妖潮・高速成长',
    desc: '主动引来更密集的妖潮与精英，以危险换取更高经验和灵玉收益。',
    boon: '经验与灵玉 +25%',
    bane: '敌势上限 +25%・精英更频繁',
    densityMul: 1.25, eliteIntervalMul: 0.72, xpMul: 1.25, jadeMul: 1.25
  },
  moonTide: {
    id: 'moonTide', kanji: '潮', name: '月潮命格', color: '#85ddff',
    style: '周期回灵・爆发绘制',
    desc: '神力不再自然恢复，每八秒降下一次月潮；潮涌期间祓除消耗减半、轨迹延长。',
    boon: '月潮恢复 45% 神力・潮涌 2.2 秒',
    bane: '无法自然恢复神力',
    noRegen: true
  },
  mirror: {
    id: 'mirror', kanji: '鏡', name: '镜心命格', color: '#a8ffe8',
    style: '断弹・返照结界',
    desc: '轨迹每切开五枚咒弹，便反射破魔光并生成一次抵伤神镜。',
    boon: '每断 5 弹反击附近敌人并获得神镜',
    bane: '主祓除伤害 -12%',
    damageMul: 0.88
  }
};
G.FATE_ORDER = ['attendant', 'dancer', 'shura', 'offering', 'bladeless', 'omagatoki', 'moonTide', 'mirror'];

// ============ 构筑流派 ============
// 武器提供 2 点倾向，技能、强化、珍品与主动术各提供流派点数。
// 4 点激活初成共鸣，8 点激活大成共鸣；它们不是互斥职业，允许一局双修。
G.BUILD_ARCHETYPES = {
  sever: {
    id: 'sever', kanji: '断', name: '断界・一闪', color: '#bdefff',
    style: '长直线、少目标、起收笔与斩杀',
    desc: '用长直线和交错斩线处理高价值目标，强调起笔、收笔与一击越过战场。',
    tier1: '线、结术式专精提高；长轨迹的主祓除伤害提高。',
    tier2: '线或结术式完成后，整条轨迹追加一次“断界余斩”。',
    forms: ['line', 'knot'],
    weapons: ['naginata', 'odachi'],
    skills: ['gale', 'severance'],
    upgrades: ['longdrive', 'first', 'execution', 'breaker'],
    relics: ['iaidoStone', 'firstSeal', 'lastOrb', 'shortTalisman', 'wardBreaker',
      'hunterEye', 'naginataPennant', 'odachiSheath', 'superPurgeSeal'],
    actives: ['empower']
  },
  repeat: {
    id: 'repeat', kanji: '返', name: '返祓・重巡', color: '#ffb6d7',
    style: '折返轨迹、同一目标多段锁定',
    desc: '沿同一段轨迹往返切割，把有限的锁定数集中到精英与 Boss 身上。',
    tier1: '返祓术式额外增加锁定容量；重复斩击逐次增伤。',
    tier2: '同一目标每累计三次主祓除，自动追加“返祓残刃”。',
    forms: ['retrace'],
    weapons: ['fans'],
    skills: ['moon'],
    upgrades: ['retrace', 'combo', 'cost'],
    relics: ['sevenMagatama', 'armorAwl', 'spiritShuttle', 'returnBell',
      'fanRibs', 'ritualScabbard', 'shuraMask'],
    actives: ['aftertrail']
  },
  storm: {
    id: 'storm', kanji: '雷', name: '鸣雷・天引', color: '#d9adff',
    style: '大量连接、落雷与跨目标传播',
    desc: '先连接一群敌人，再让雷与星光越过锁定目标向场外继续传播。',
    tier1: '雷系秘法所需命中数降低，落雷目标与链雷范围增加。',
    tier2: '雷系秘法伤害、链雷数量和雷网范围进一步提高。',
    forms: ['zigzag', 'spiral'],
    weapons: [],
    skills: ['thunder', 'chainLightning', 'starfall'],
    upgrades: ['lock', 'crowdEdge'],
    relics: ['thunderDrum', 'thunderNeedle', 'starBell', 'hordeScroll',
      'hundredLamp'],
    actives: ['shockwave']
  },
  ward: {
    id: 'ward', kanji: '界', name: '封界・聚灵', color: '#a8ffe2',
    style: '闭环、螺旋、聚怪与持续区域',
    desc: '把敌人圈进闭合轨迹，在终点或圈心牵引聚拢，再用范围术式持续清场。',
    tier1: '环、螺术式专精提高；范围秘法所需命中数降低。',
    tier2: '环或螺术式生成持续净域，并将附近敌人拖向术式中心。',
    forms: ['loop', 'spiral'],
    weapons: ['kusarigama', 'gohei'],
    skills: ['scatter', 'tide', 'flame', 'frost'],
    upgrades: ['thread', 'width', 'magnet', 'zone', 'shock', 'purge'],
    relics: ['closedRope', 'crossMirror', 'chainWeight', 'goheiTassel',
      'tidePearl', 'flameChalice', 'frostHairpin', 'zoneIncense', 'shockBell', 'purgeSeal'],
    actives: ['vacuum']
  },
  familiar: {
    id: 'familiar', kanji: '札', name: '御札・追猎', color: '#ffe0a0',
    style: '符札、狐火与自动追击',
    desc: '主祓除负责留下印记，追符、狐火和式神负责追杀轨迹之外的敌人。',
    tier1: '符札、狐火与追击类秘法伤害提高，狐火更快诞生。',
    tier2: '一笔连接三名不同敌人后，额外放出一枚“追命式神”。',
    forms: ['zigzag'],
    weapons: ['bow'],
    skills: ['pursuit', 'renewal'],
    upgrades: ['ofuda', 'ofudaSpread', 'ofudaVuln', 'fox', 'foxTrail', 'foxBurst', 'echo'],
    relics: ['ofudaInk', 'ofudaWide', 'foxFang', 'foxTwin', 'bowQuiver',
      'echoMirror', 'soulGourd'],
    actives: []
  }
};
G.BUILD_ORDER = ['sever', 'repeat', 'storm', 'ward', 'familiar'];

G.buildsFor = function (kind, id) {
  if (!id) return [];
  return G.BUILD_ORDER.filter(buildId => {
    const list = G.BUILD_ARCHETYPES[buildId][kind] || [];
    return list.includes(id);
  });
};

G.getItemBuildIds = function (item) {
  if (!item) return [];
  return item.activeSkill
    ? G.buildsFor('actives', item.activeSkill)
    : G.buildsFor('relics', item.id);
};

G.getBuildState = function (game) {
  const state = {};
  for (const id of G.BUILD_ORDER) {
    const def = G.BUILD_ARCHETYPES[id];
    let score = 0;
    for (const weaponId of (game.weapons || []))
      if (def.weapons.includes(weaponId)) score += 2;
    for (const skillId of def.skills)
      score += Math.min(2, (game.skills && game.skills[skillId]) || 0);
    for (const upgradeId of def.upgrades)
      score += Math.min(2, (game.owned && game.owned[upgradeId]) || 0);
    for (const relicId of def.relics)
      score += Math.min(2, (game.shopRelics && game.shopRelics[relicId]) || 0);
    if (game.activeSkillId && def.actives.includes(game.activeSkillId)) score += 1;
    state[id] = {
      id, score, tier: score >= 8 ? 2 : score >= 4 ? 1 : 0,
      next: score >= 8 ? 8 : score >= 4 ? 8 : 4,
      def
    };
  }
  return state;
};

G.getDominantBuild = function (game, requireScore) {
  const state = G.getBuildState(game);
  const min = requireScore == null ? 1 : requireScore;
  return G.BUILD_ORDER.map(id => state[id])
    .filter(x => x.score >= min)
    .sort((a, b) => b.score - a.score || G.BUILD_ORDER.indexOf(a.id) - G.BUILD_ORDER.indexOf(b.id))[0] || null;
};

G.buildAffinityLabel = function (ids) {
  return (ids || []).map(id => G.BUILD_ARCHETYPES[id].name).join(' / ');
};

G.getBuildChoiceForecast = function (game, kind, id) {
  const ids = G.buildsFor(kind, id);
  if (!ids.length || !game) return [];
  const state = G.getBuildState(game);
  let gain = 0;
  if (kind === 'weapons') gain = (game.weapons || []).includes(id) ? 0 : 2;
  else if (kind === 'actives') gain = game.activeSkillId === id ? 0 : 1;
  else {
    const source = kind === 'skills' ? game.skills :
      kind === 'upgrades' ? game.owned : game.shopRelics;
    const held = (source && source[id]) || 0;
    gain = Math.min(2, held + 1) - Math.min(2, held);
  }
  return ids.map(buildId => {
    const before = state[buildId].score;
    const after = before + gain;
    const beforeTier = before >= 8 ? 2 : before >= 4 ? 1 : 0;
    const afterTier = after >= 8 ? 2 : after >= 4 ? 1 : 0;
    return {
      id: buildId, def: G.BUILD_ARCHETYPES[buildId],
      before, after, gain, beforeTier, afterTier
    };
  });
};

G.buildChoiceLabel = function (game, kind, id) {
  return G.getBuildChoiceForecast(game, kind, id).map(x => {
    if (x.gain > 0 && x.afterTier > x.beforeTier)
      return x.def.name + ' +' + x.gain + ' → ' + (x.afterTier === 2 ? '大成' : '初成');
    if (x.afterTier >= 2) return x.def.name + '・大成';
    const next = x.afterTier >= 1 ? 8 : 4;
    return x.def.name + (x.gain ? ' +' + x.gain : '') + '（' + x.after + '/' + next + '）';
  }).join(' / ');
};

G.shopBuildWeight = function (game, item) {
  const ids = G.getItemBuildIds(item);
  if (!ids.length) return 1;
  const state = G.getBuildState(game);
  let best = 0;
  for (const id of ids) best = Math.max(best, state[id].score);
  return 1 + Math.min(1.55, best * 0.19);
};

G.shopBasePrice = function (game, item) {
  const level = game.owned[item.effect.id] || 0;
  const fateMul = game && game.fatePriceMul ? game.fatePriceMul() : 1;
  return Math.round(item.baseCost * (1 + level * 0.6) * fateMul);
};

G.shopRelicPrice = function (game, item) {
  const level = game.shopRelics[item.id] || 0;
  const fateMul = game && game.fatePriceMul ? game.fatePriceMul() : 1;
  return Math.round(item.baseCost * (1 + level * 0.55) * fateMul);
};

G.shopRelicSellPrice = function (game, item) {
  const level = Math.max(0, (game.shopRelics[item.id] || 1) - 1);
  const fateMul = game && game.fatePriceMul ? game.fatePriceMul() : 1;
  const paid = Math.round(item.baseCost * (1 + level * 0.55) * fateMul);
  return Math.max(1, Math.floor(paid * 0.5));
};

G.shopRelicEligible = function (game, item) {
  if (item.activeSkill) return game.activeSkillId !== item.activeSkill;
  if ((game.shopRelics[item.id] || 0) >= item.max) return false;
  if (item.reqOwned && !game.owned[item.reqOwned]) return false;
  if (item.reqSkill && !game.skills[item.reqSkill]) return false;
  if (item.reqWeapon && !game.weapons.includes(item.reqWeapon)) return false;
  if (item.reqTwoWeapons && game.weapons.length < 2) return false;
  return true;
};

G.pickWeightedShopItem = function (pool, game) {
  let total = 0;
  for (const item of pool)
    total += (item.weight || 10) * (game ? G.shopBuildWeight(game, item) : 1);
  let roll = Math.random() * total;
  for (const item of pool) {
    roll -= (item.weight || 10) * (game ? G.shopBuildWeight(game, item) : 1);
    if (roll <= 0) return item;
  }
  return pool[pool.length - 1];
};

G.rollShop = function (game, count) {
  const wanted = count || 4;
  const available = G.SHOP_RELICS.filter(item => G.shopRelicEligible(game, item));
  const out = [];

  // 已形成任意流派后，每次刷新至少出现一件可用的流派珍品。
  const flowPool = available.filter(item => item.flow);
  if (flowPool.length) {
    const item = G.pickWeightedShopItem(flowPool, game);
    out.push({ item, price: G.shopRelicPrice(game, item), sold: false });
    available.splice(available.indexOf(item), 1);
  }

  while (out.length < wanted && available.length) {
    const item = G.pickWeightedShopItem(available, game);
    out.push({ item, price: G.shopRelicPrice(game, item), sold: false });
    available.splice(available.indexOf(item), 1);
  }
  return out;
};

G.rollBossRelics = function (game, count) {
  const wanted = count || 3;
  const pool = G.SHOP_RELICS.filter(item =>
    !item.activeSkill && item.rar >= 1 && G.shopRelicEligible(game, item)
  );
  const out = [];
  while (out.length < wanted && pool.length) {
    // Boss 奉纳略偏向高稀有度与新机制道具。
    const weighted = pool.map(item => Object.assign({}, item, {
      weight: (item.weight || 10) * (item.rar === 2 ? 1.8 : 1) * (item.mechanic ? 1.45 : 1)
    }));
    const picked = G.pickWeightedShopItem(weighted, game);
    const item = pool.find(x => x.id === picked.id);
    out.push(item);
    pool.splice(pool.indexOf(item), 1);
  }
  return out;
};
