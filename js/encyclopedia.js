// ============ 主菜单・万象图鉴 ============
window.G = window.G || {};

G.ENCYCLOPEDIA_ENEMIES = {
  normal: [
    { kanji: '影', name: '影妖', unlock: '第 1 祓起', stat: '生命 30・接触伤害 8',
      desc: '最常见的追踪妖怪，会摇摆着持续靠近巫女，适合作为一笔连线的基础目标。' },
    { kanji: '貫', name: '突贯妖', unlock: '第 3 祓起', stat: '生命 46・接触伤害 13',
      desc: '短暂显露红色预警线后高速冲刺；冲刺结束时会有一段恢复空隙。' },
    { kanji: '蛾', name: '灯蛾', unlock: '第 4 祓起', stat: '生命 24・接触伤害 7',
      desc: '生命很低但移动极快，会以大幅摆动路线切入战场，容易扰乱长轨迹的规划。' },
    { kanji: '裂', name: '裂面', unlock: '第 5 祓起', stat: '生命 64・接触伤害 12',
      desc: '面具破碎后会裂生两只高速碎面。长轨迹若只覆盖本体，分裂体会立刻从缺口追上。' },
    { kanji: '呪', name: '呪面', unlock: '第 6 祓起', stat: '生命 36・弹幕伤害 12',
      desc: '保持中距离环绕巫女，并周期性发射咒弹；靠近时会主动后退。' },
    { kanji: '蝕', name: '蚀灵', unlock: '第 8 祓起', stat: '生命 44・吸取神力 10+',
      desc: '近距离蓄力后展开紫色吸灵圈。蓄力期间离开范围，即可完全避开神力损失。' },
    { kanji: '灯', name: '石灯守', unlock: '第 9 祓起', stat: '生命 82・接触伤害 15',
      desc: '缓慢的重甲妖怪。护壳上的箭纹标出破势方向，沿该方向落下一文字可造成重击；错向只会刮掉护壳。' },
    { kanji: '阵', name: '阵妖', unlock: '第 11 祓起', stat: '生命 58・咒阵伤害 10',
      desc: '锁定巫女当时的位置展开收缩咒阵，短暂预警后由阵心向外射出七枚咒弹。' },
    { kanji: '祷', name: '祷面', unlock: '第 12 祓起', stat: '生命 48・接触伤害 9',
      desc: '保持远距离施术，每隔一段时间为附近最多六名受伤妖怪恢复生命。' }
  ],
  elite: [
    { kanji: '荒', name: '荒魂', unlock: '第 3 祓起', stat: '生命 300・接触伤害 16',
      desc: '基础精英怪，生命、体型和压迫力远高于普通妖怪，击杀后会掉落额外奖励。' },
    { kanji: '界', name: '结界荒魂', unlock: '第 8 祓起', stat: '生命 430・接触伤害 17',
      desc: '周期性为附近妖怪施加护界，使其承受的伤害降低；应优先从怪群中祓除。' },
    { kanji: '召', name: '招魂荒魂', unlock: '第 10 祓起', stat: '生命 390・接触伤害 15',
      desc: '蓄力召来影妖、灯蛾与突贯妖护卫。召唤物不掉落奖励，拖延只会让敌阵逐渐膨胀。' },
    { kanji: '狩', name: '狩面荒魂', unlock: '第 13 祓起', stat: '生命 365・接触伤害 20',
      desc: '锁定巫女后显示追猎预警线，随后发动距离很长的高速连续追杀。' },
    { kanji: '封', name: '封脉荒魂', unlock: '第 16 祓起', stat: '生命 455・接触伤害 18',
      desc: '以大范围红色法圈预告封脉。及时移出法圈可躲避，否则会损失神力并暂停自然回灵。' }
  ],
  boss: [
    { kanji: '天', name: '祟面ノ大天狗', wave: 5, weak: 5,
      desc: '操纵环形弹幕、扇形连射与直线俯冲。专属“风切双门”会同时写下两道赤裂，必须用轨迹截断；半血后进入暴风二阶。' },
    { kanji: '鬼', name: '青焰ノ酒吞童子', wave: 10, weak: 4,
      desc: '体型与正面压迫最强，擅长连续地震波与俯冲。“鬼宴地鸣”会锁定脚下并延迟震爆，必须及时走出预兆圈；半血后攻势加剧。' },
    { kanji: '狐', name: '九尾ノ玉藻', wave: 15, weak: 6,
      desc: '以瞬移改变弹幕角度，连续释放扇形妖火。“四狐连契”召来两组无敌狐阵，先横切共生赤线方可祓除；半血后显现九尾。' },
    { kanji: '冥', name: '常暗ノ黄泉主', wave: 20, weak: 8,
      desc: '最终祟主，混合所有弹幕与轨迹咒式。“万象双咒”会同时布下截线与闭环/覆轨题目；半血后降下常暗。' }
  ]
};

G.ENCYCLOPEDIA_RULES = [
  { kanji: '契', name: '共生赤契', desc: '两只妖怪之间出现红线时，双方完全无敌。让本次绘制的轨迹与红线相交，才能斩断契约并使双方短暂易伤。' },
  { kanji: '脉', name: '灵脉连祷', desc: '第三祓起，非 Boss 战会出现三至九枚有序灵脉，较长的连祷会形成交叉星轨。必须用同一笔依序连接全部节点，漏点或错序都会令整组消失。奖励可能是神威、回灵、灵玉、护生或主动术加速，点数越多效果越强；八、九连祷还可能显现技能卷轴。' },
  { kanji: '断', name: '咒弹断灭', desc: '任何有效攻击轨迹都能直接切开沿途咒弹，并返还少量神力。观察弹幕缝隙，画线也能成为防御。' },
  { kanji: '式', name: '祟主咒式', desc: 'Boss 会写下截线、覆盖或封环咒式。倒计时结束前画出对应答案，可破咒并令祟主硬直；失败会引发弹幕或封脉。' }
];

G.Encyclopedia = (() => {
  const categories = [
    { id: 'fates', name: '命 格' },
    { id: 'builds', name: '流派共鸣' },
    { id: 'stages', name: '关卡・祟章' },
    { id: 'weapons', name: '神兵・术式' },
    { id: 'skills', name: '秘 法' },
    { id: 'upgrades', name: '加 护' },
    { id: 'items', name: '道 具' },
    { id: 'enemies', name: '妖怪・法则' }
  ];
  let active = 'weapons';

  const escape = value => String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const rarityName = rar => ['常物', '稀物', '秘藏'][rar || 0] || '异珍';

  const card = (entry, opt) => {
    opt = opt || {};
    const rar = opt.rar == null ? (entry.rar || 0) : opt.rar;
    const tag = opt.tag || '';
    const trigger = opt.trigger || '';
    const meta = opt.meta || '';
    return '<article class="codexCard r' + rar + (opt.cursed ? ' cursed' : '') + '">' +
      '<div class="codexSeal">' + escape(entry.kanji || '録') + '</div>' +
      '<div class="codexCopy"><div class="codexName">' + escape(entry.name) + '</div>' +
      (tag ? '<div class="codexTag">' + escape(tag) + '</div>' : '') +
      (trigger ? '<div class="codexTrigger"><span>触 发</span>' + escape(trigger) + '</div>' : '') +
      '<div class="codexDesc">' + escape(entry.desc || '') + '</div>' +
      (meta ? '<div class="codexMeta">' + escape(meta) + '</div>' : '') +
      '</div></article>';
  };

  const group = (name, note, entries, renderer) => {
    if (!entries.length) return '';
    return '<section class="codexGroup"><div class="codexGroupHead"><h3>' + escape(name) +
      '</h3><span>' + escape(note || '') + '・' + entries.length + ' 项</span></div>' +
      '<div class="codexGrid">' + entries.map(renderer).join('') + '</div></section>';
  };

  const renderWeapons = () => {
    const all = Object.values(G.WEAPONS);
    const defaultWeapon = all.filter(x => x.id === 'ritualBlade');
    const bossWeapons = all.filter(x => x.id !== 'ritualBlade');
    const draw = w => card(w, {
      rar: w.id === 'ritualBlade' ? 0 : 1,
      tag: w.id === 'ritualBlade' ? '开局御神刀' : 'Boss 神兵',
      meta: w.perk
    });
    const forms = Object.values(G.TRAJECTORY_FORMS);
    return group('御神刀', '开局默认', defaultWeapon, draw) +
      group('额外神兵', '一局最多携行两把武器', bossWeapons, draw) +
      group('轨迹术式', '所有武器通用・特定神兵具有专精', forms, form => card(form, {
        rar: 1, tag: form.hint, meta: '绘制成式后随攻击一并发动'
      }));
  };

  const renderBuilds = () => {
    const builds = G.BUILD_ORDER.map(id => G.BUILD_ARCHETYPES[id]);
    return group('五系副流派', '局内自然形成・可并行累积・4 点初成・8 点大成', builds, build => {
      const weaponNames = build.weapons.map(id => G.WEAPONS[id] && G.WEAPONS[id].name).filter(Boolean);
      const skillNames = build.skills.map(id => G.SKILLS[id] && G.SKILLS[id].name).filter(Boolean);
      const meta = '初成：' + build.tier1 + '　大成：' + build.tier2 +
        (weaponNames.length ? '　神兵：' + weaponNames.join(' / ') : '') +
        (skillNames.length ? '　秘法：' + skillNames.join(' / ') : '');
      return card(build, {
        rar: 2,
        tag: build.style,
        trigger: '同流派内容累计 4 / 8 点',
        meta
      });
    });
  };

  const renderFates = () => {
    const fates = G.FATE_ORDER.map(id => G.FATES[id]);
    return group('开局命格', '开局择一・整局固定・与武器和共鸣相互独立', fates, fate => card(fate, {
      rar: 2,
      tag: fate.style,
      trigger: '开局“命格择定”选择',
      meta: '加护：' + fate.boon + '　代价：' + fate.bane
    }));
  };

  const renderStages = () => {
    const chapters = G.WAVE_CHAPTERS.map((chapter, i) => Object.assign({
      from: i * 5 + 1, to: i * 5 + 5
    }, chapter));
    return group('四卷祟章', '每五关更换敌群、阵型与战场事件', chapters, chapter => card(chapter, {
      rar: 1
    })) + group('章内节奏', '每章依序重复・第五关固定为 Boss', G.WAVE_TRIALS,
      trial => card(trial, {
        rar: trial.id === 'boss' ? 2 : 0,
        tag: '章内第 ' + (G.WAVE_TRIALS.indexOf(trial) + 1) + ' 祓',
        meta: trial.id === 'boss' ? '限时 90 秒・到时无论是否击破均结算' : ''
      }));
  };

  const renderSkills = () => {
    const skills = G.SKILL_ORDER.map(id => G.SKILLS[id]);
    const activeSkills = G.ACTIVE_SKILL_ORDER.map(id => G.ACTIVE_SKILLS[id]);
    return group('自动秘法', '击败妖怪时有概率掉落・最高三阶', skills, skill => card(skill, {
      rar: 1,
      tag: '自动触发・最高 ' + skill.max + ' 阶',
      trigger: skill.trigger,
      meta: skill.ascension || ''
    })) + group('主动术式', '同时只能装着一种・鼠标右键发动', activeSkills, skill => card(skill, {
      rar: skill.rar,
      tag: skill.id === 'dodge' ? '开局默认' : '夜诣商店・术契',
      trigger: '鼠标右键・冷却 ' + skill.cooldown + ' 秒',
      meta: skill.effect
    }));
  };

  const upgradeGroups = [
    ['轨迹与神力', '调整画线、锁定和神力循环',
      ['thread','width','magnet','lock','retrace','cost','spring','reservoir']],
    ['祓除与生存', '基础伤害、条件增幅和防御成长',
      ['edge','breaker','combo','longdrive','first','execution','crowdEdge','lastStand',
        'body','wind','comboGuard','soulStudy']],
    ['符札流派', '留符、传播与易伤', ['ofuda','ofudaSpread','ofudaVuln']],
    ['狐火流派', '自动追击与轨迹爆发', ['fox','foxTrail','foxBurst']],
    ['回响流派', '残影、净域、冲击与全祓', ['echo','zone','shock','purge']]
  ];

  const EMERGENCY_UPGRADES = [
    { kanji: '饌', name: '神饌补给', rar: 0, max: 1, desc: '立即恢复 40 点生命；强化池接近耗尽时作为应急选择出现。' },
    { kanji: '霊', name: '灵力灌注', rar: 0, max: 1, desc: '神力完全恢复，并使本局伤害永久提高 8%；强化池接近耗尽时出现。' }
  ];

  const renderUpgrades = () => upgradeGroups.map(([name, note, ids]) => {
    const entries = ids.map(id => G.UPG_MAP[id]).filter(Boolean);
    return group(name, note, entries, up => card(up, {
      rar: up.rar,
      tag: rarityName(up.rar) + '・最高 ' + up.max + ' 阶',
      meta: up.req && G.UPG_MAP[up.req] ? '前置：' + G.UPG_MAP[up.req].name : ''
    }));
  }).join('') + group('应急加护', '常规加护接近圆满后出现', EMERGENCY_UPGRADES,
    up => card(up, { rar: up.rar, tag: '即时补给' }));

  const FIELD_DROPS = [
    { kanji: '魂', name: '经验勾玉', desc: '击败妖怪后掉落，靠近即可吸收并提升等级。' },
    { kanji: '霊', name: '神力玉', desc: '立即恢复 30 点神力，精英怪必定掉落一枚。' },
    { kanji: '癒', name: '生命灵珠', desc: '立即恢复 22 点生命，普通妖怪与精英均有机会掉落。' },
    { kanji: '技', name: '技能卷轴', desc: '随机获得或提升一项尚未满阶的自动技能；Boss 必定掉落。' },
    { kanji: '玉', name: '灵玉', desc: '夜诣商店使用的货币，普通妖怪、精英和 Boss 均可掉落。' }
  ];

  const relicTag = item => item.cursed ? '禁忌咒物' :
    item.reqWeapon ? (item.flow || '神兵') + '专属' :
    item.reqTwoWeapons ? '双神兵专属' :
      item.reqSkill ? (item.flow || '秘法') + '专属' :
      item.reqOwned ? (item.flow || '流派') + '专属' :
          item.mechanic ? G.relicMechanicLabel(item) : item.flow ? item.flow + '流派' : '通用珍品';

  const renderItems = () => {
    const relics = G.SHOP_RELICS.filter(x => !x.activeSkill);
    const skill = relics.filter(x => x.reqSkill);
    const weapon = relics.filter(x => x.reqWeapon);
    const build = relics.filter(x => x.reqOwned || (x.flow && !x.reqSkill && !x.reqWeapon));
    const mechanic = relics.filter(x => x.mechanic && !x.reqOwned && !x.reqSkill && !x.reqWeapon);
    const used = new Set([...skill, ...weapon, ...build, ...mechanic]);
    const common = relics.filter(x => !used.has(x));
    const relicCard = item => card(item, {
      rar: item.rar,
      cursed: item.cursed,
      tag: relicTag(item) + '・最高 ' + item.max + ' 阶',
      meta: '基础价格 ' + item.baseCost + ' 灵玉'
    });
    return group('战场掉落', '战斗中直接拾取', FIELD_DROPS, x => card(x, { tag: '战场拾取' })) +
      group('无偿补给', '每次商店四选一', G.SHOP_FREE_ITEMS,
        x => card(x, { tag: '免费消耗品' })) +
      group('固定商品', '可重复购买・逐阶涨价', G.SHOP_BASE_ITEMS,
        x => card(x, { tag: '固定商品', meta: '基础价格 ' + x.baseCost + ' 灵玉' })) +
      group('通用珍品', '所有构筑均可使用', common, relicCard) +
      group('流派珍品', '拥有对应强化后进入商店', build, relicCard) +
      group('技能专属珍品', '拥有对应秘法后进入商店', skill, relicCard) +
      group('神兵专属珍品', '携行对应武器后进入商店', weapon, relicCard) +
      group('机制异珍', '连祷、术式、换装、主动、狩猎与护命', mechanic, relicCard);
  };

  const renderEnemies = () => {
    const data = G.ENCYCLOPEDIA_ENEMIES;
    const enemyCard = e => card(e, { rar: 0 });
    const bossCard = e => card(e, { rar: 2 });
    return group('普通妖怪', '随关卡逐步加入刷新池', data.normal, enemyCard) +
      group('精英荒魂', '高生命・高掉落・独立能力', data.elite,
        e => card(e, { rar: 1 })) +
      group('祟主', '每五关现世一位', data.boss, bossCard) +
      group('战场法则', '以画线回应战场机关', G.ENCYCLOPEDIA_RULES,
        rule => card(rule, { rar: 1 }));
  };

  const renderers = {
    fates: renderFates,
    builds: renderBuilds,
    stages: renderStages,
    weapons: renderWeapons,
    skills: renderSkills,
    upgrades: renderUpgrades,
    items: renderItems,
    enemies: renderEnemies
  };

  const counts = () => ({
    fates: G.FATE_ORDER.length,
    builds: G.BUILD_ORDER.length,
    stages: G.WAVE_CHAPTERS.length + G.WAVE_TRIALS.length,
    weapons: Object.keys(G.WEAPONS).length + Object.keys(G.TRAJECTORY_FORMS).length,
    skills: G.SKILL_ORDER.length + G.ACTIVE_SKILL_ORDER.length,
    upgrades: G.UPGRADES.length + EMERGENCY_UPGRADES.length,
    items: FIELD_DROPS.length + G.SHOP_FREE_ITEMS.length +
      G.SHOP_BASE_ITEMS.length + G.SHOP_RELICS.filter(x => !x.activeSkill).length,
    enemies: G.ENCYCLOPEDIA_ENEMIES.normal.length +
      G.ENCYCLOPEDIA_ENEMIES.elite.length + G.ENCYCLOPEDIA_ENEMIES.boss.length +
      G.ENCYCLOPEDIA_RULES.length
  });

  const render = id => {
    active = renderers[id] ? id : 'weapons';
    const body = document.getElementById('codexBody');
    if (!body) return;
    body.innerHTML = renderers[active]();
    body.scrollTop = 0;
    const c = counts();
    document.querySelectorAll('[data-codex-tab]').forEach(el => {
      const selected = el.dataset.codexTab === active;
      el.classList.toggle('active', selected);
      el.setAttribute('aria-selected', selected ? 'true' : 'false');
      const count = c[el.dataset.codexTab];
      const badge = el.querySelector('i');
      if (badge) badge.textContent = count;
    });
  };

  const isOpen = () => {
    const el = document.getElementById('encyclopedia');
    return !!el && !el.classList.contains('hidden');
  };

  const open = id => {
    const title = document.getElementById('title');
    const codex = document.getElementById('encyclopedia');
    if (!codex) return;
    if (title) title.classList.add('hidden');
    codex.classList.remove('hidden');
    render(id || active);
  };

  const close = () => {
    const title = document.getElementById('title');
    const codex = document.getElementById('encyclopedia');
    if (codex) codex.classList.add('hidden');
    if (title) title.classList.remove('hidden');
  };

  const init = () => {
    const tabs = document.getElementById('codexTabs');
    if (!tabs) return;
    const c = counts();
    tabs.innerHTML = categories.map(cat =>
      '<button type="button" data-codex-tab="' + cat.id + '" aria-selected="false">' +
      cat.name + '<i>' + c[cat.id] + '</i></button>').join('');
    tabs.querySelectorAll('[data-codex-tab]').forEach(el => {
      el.onclick = () => render(el.dataset.codexTab);
    });
    const openButton = document.getElementById('btnCodex');
    const closeButton = document.getElementById('btnCodexClose');
    if (openButton) openButton.onclick = () => open('fates');
    if (closeButton) closeButton.onclick = close;
    render('weapons');
  };

  return { init, open, close, render, counts, isOpen };
})();
