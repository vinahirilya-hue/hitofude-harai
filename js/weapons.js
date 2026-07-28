// ============ 轨迹武器 ============
window.G = window.G || {};

G.TRAJECTORY_FORMS = {
  line: {
    id: 'line', kanji: '一', name: '一文字', color: '#bdefff',
    hint: '长直轨迹・破甲贯穿', desc: '轨迹越直、越长，斩击增幅越高，并可按正确角度击破重甲。'
  },
  loop: {
    id: 'loop', kanji: '環', name: '镇封环', color: '#ffe0a0',
    hint: '首尾闭合・圈敌镇封', desc: '封印闭合轨迹中的敌人，随后在环内发动一次镇封爆破。'
  },
  knot: {
    id: 'knot', kanji: '結', name: '天之结', color: '#d9adff',
    hint: '轨迹自交・交点雷印', desc: '每个自交点生成雷印，祓除结束时同时爆发。'
  },
  retrace: {
    id: 'retrace', kanji: '返', name: '返祓纹', color: '#ffb6d7',
    hint: '沿路折返・追加重巡', desc: '折返轨迹额外增加一次可锁定攻击，并压缩整段连斩用时。'
  },
  spiral: {
    id: 'spiral', kanji: '螺', name: '引魂螺', color: '#a8ffe2',
    hint: '绕心旋行・聚怪引魂', desc: '在轨迹旋心形成引魂场，将周围敌人牵向中心并附加易伤。'
  },
  zigzag: {
    id: 'zigzag', kanji: '折', name: '折雷式', color: '#fff0a8',
    hint: '连续转折・折点落雷', desc: '连续明显转折会在每个折点落雷，清扫分散的敌群。'
  }
};

G.WEAPONS = {
  ritualBlade: {
    id: 'ritualBlade', kanji: '祓', name: '御神刀・祓',
    desc: '保留当前战斗方式，巫女沿完整轨迹逐一斩过锁定目标。',
    perk: '全术式均衡增幅',
    path: 'full', movePlayer: true, lockWidthMul: 1, trailMul: 1, speedMul: 1, costMul: 1,
    formFocus: { all: 1.16 }
  },
  naginata: {
    id: 'naginata', kanji: '薙', name: '破阵薙刀',
    desc: '只读取起点与终点，巫女沿直线高速破阵；绘制越笔直，冲锋伤害越高。',
    perk: '宽幅冲阵・笔直时主祓除最高 +30%・消耗 +15%',
    path: 'line', movePlayer: true, lockWidthMul: 1.45, trailMul: 1, speedMul: 1.28, costMul: 1.15,
    formFocus: { line: 1.72 }
  },
  bow: {
    id: 'bow', kanji: '弓', name: '梓弓・追星',
    desc: '巫女留在原地，破魔箭沿完整轨迹贯穿沿途未锁定敌人，并在末端爆炸。',
    perk: '沿线贯穿・末端爆破・锁定主伤害较低',
    path: 'full', movePlayer: false, lockWidthMul: 1, trailMul: 1, speedMul: 1.16,
    damageMul: 0.78, costMul: 1.05, pierceDmg: 0.34,
    burstRadius: 145, burstDmg: 0.8, formFocus: { zigzag: 1.65 }
  },
  kusarigama: {
    id: 'kusarigama', kanji: '鎌', name: '锁镰・缚魂',
    desc: '开放轨迹沿线割魂，闭合轨迹则放弃扫线、收紧并拖拽圈内敌人。',
    perk: '开放割魂 / 闭环缚杀・长度 +40%・消耗 +15%',
    path: 'full', movePlayer: false, lockWidthMul: 1.05, trailMul: 1.4, speedMul: 1, costMul: 1.15,
    closeDistance: 92, closeMinLength: 260, bindDmg: 1.25, formFocus: { loop: 1.78 }
  },
  odachi: {
    id: 'odachi', kanji: '断', name: '大太刀・断界',
    desc: '巫女留在原地，起点与终点之间的整条斩线同时断裂。',
    perk: '整线同步断裂・距离增伤・神力消耗 +55%',
    path: 'line', movePlayer: false, lockWidthMul: 0.72, trailMul: 1, speedMul: 0, costMul: 1.55,
    maxDistanceDmg: 0.78, formFocus: { knot: 1.72 }
  },
  gohei: {
    id: 'gohei', kanji: '幣', name: '御币・招魂',
    desc: '御币沿完整轨迹巡礼，直接伤害较低；终点招魂阵会大范围聚怪并施加易伤。',
    perk: '低耗聚怪・消耗 -20%・终点招魂阵强化',
    path: 'full', movePlayer: false, lockWidthMul: 1.18, trailMul: 1.2, speedMul: 1.08,
    damageMul: 0.55, costMul: 0.8, pullRadius: 310, pullDmg: 0.5, formFocus: { spiral: 1.7 }
  },
  fans: {
    id: 'fans', kanji: '扇', name: '双扇・回天',
    desc: '短距离贴身疾舞，每个锁定印记先轻斩、再由另一把扇子追加更强返扫。',
    perk: '短轨双击・消耗 -28%・第二击伤害提高',
    path: 'full', movePlayer: true, lockWidthMul: 0.92, trailMul: 0.78, speedMul: 1.38,
    damageMul: 0.58, costMul: 0.72, fanEchoMul: 1.45, dualHit: true, formFocus: { retrace: 1.68 }
  }
};

// Boss 神兵池只包含额外武器；当前御神刀作为开局默认武器保留。
G.WEAPON_ORDER = ['naginata', 'bow', 'kusarigama', 'odachi', 'gohei', 'fans'];
