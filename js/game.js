// ============ 核心循环：画线锁敌 → 一笔祓除 → 延迟净化 ============
window.G = window.G || {};

const RATING = [
  { n: 20, tier: 4, name: '神 祓', color: '#ff9adf', dmg: 1.42, slash: 1.42, haste: 0.55 },
  { n: 15, tier: 3, name: '大 祓', color: '#ff8a70', dmg: 1.28, slash: 1.28, haste: 0.68 },
  { n: 10, tier: 2, name: '中 祓', color: '#ffd98a', dmg: 1.16, slash: 1.16, haste: 0.80 },
  { n: 6, tier: 1, name: '小 祓', color: '#cfd8ea', dmg: 1.08, slash: 1.08, haste: 0.90 },
];
const NO_RATING = { n: 0, tier: 0, name: '', color: '#ffffff', dmg: 1, slash: 1, haste: 1 };

G.Game = class {
  constructor() {
    this.state = 'title';
    this.player = new G.Player();
    this.camera = { x: 0, y: 0, zoom: G.WORLD_ZOOM };
    this.updateCamera(0, true);
    this.enemies = []; this.bullets = []; this.gems = []; this.pickups = [];
    this.foxfires = []; this.zones = []; this.echoRunners = []; this.ofudaList = [];
    this.soulLinks = []; this.spiritNodes = []; this.spiritTrial = null; this.bossCurses = [];
    this.boss = null;
    this.time = 0; this.timeScale = 1; this.timeTarget = 1; this.hitstop = 0;
    this.wave = 1; this.waveTime = 0; this.waveDuration = 30; this.waveClearT = 0;
    this.waveOvertime = false; this.bossDefeated = false; this.waveFinishPending = false; this.jade = 0;
    this.shopStock = []; this.shopRerolls = 0; this.shopPending = false;
    this.shopFreeClaimed = false; this.shopFreeChoice = null; this.shopRelics = {};
    this.nextWavePaper = 0; this.paperShield = 0; this.mirrorShield = 0; this.mirrorCd = 0; this.renewalShield = 0; this.comboShield = 0;
    this.manaSealT = 0;
    this.renewalCd = 0;
    this.jadeBonusCarry = 0;
    this.kills = 0; this.bestCombo = 0; this.bestRating = '—'; this._bestRatingN = 0;
    this.owned = {}; this.permDmg = 1;
    this.planning = false; this.trail = []; this.trailCum = []; this.trailLen = 0; this.locks = [];
    this.currentForm = null;
    this.lockRecalcT = 0;
    this.trailFade = null;
    this.dash = null; this.finT = 0; this.pendingPurify = -1; this.pendingEchoT = -1;
    this.pendingLevels = 0; this.cardChoices = [];
    this.spawnT = 0.5; this.eliteT = 999; this.bossSpawned = false;
    this.stageEventT = 999; this.stageEventCount = 0;
    this.surgeWarned = false;
    this.dashCount = 0; this.combo = 0; this.comboFadeT = 0; this.foxAcc = 0;
    this.lastHeatTier = 0; this.lastSuperPurge = 0;
    this.overT = -1; this.winT = -1;
    this.skills = {}; this.delayed = []; this.ribbon = []; this._skBadge = '';
    this.weapons = ['ritualBlade']; this.activeWeaponIndex = 0; this._weaponHud = '';
    this.activeSkillId = 'dodge'; this.activeCooldown = 0; this.activeEmpowerT = 0;
    this.planEmpowered = false; this.activeVacuum = null; this.lastAttackPath = null; this._activeHud = '';
    this.weaponPending = false; this.weaponOffers = []; this.weaponReplaceIndex = 0;
    this.itemRewardPending = false; this.itemOffers = []; this._itemHud = null;
    this.chainPull = null; this.weaponTelegraph = null;
    this.buildState = {}; this._buildHud = '';
    this._buildAnnounceReady = false; this._pendingBuildNotices = [];
    this.fateId = 'attendant'; this.bladeMastery = 1;
    this.moonTideT = 8; this.moonTideWindow = 0; this.mirrorCutCount = 0; this._fateHud = '';
    this.swapRelicCd = 0; this.swapEmpower = false; this.activeRelicCharge = 0;
    this.lastRelicForm = null; this.umbrellaCd = 0; this.lastLifeUsed = false; this.ledgerKills = 0;
    this.$ = id => document.getElementById(id);
  }

  // ============ 流程 ============
  start(fateId) {
    this.fateId = G.FATES[fateId] ? fateId :
      (G.FATES[this.fateId] ? this.fateId : G.FATE_ORDER[0]);
    this.player = new G.Player();
    this.owned = {}; this.shopRelics = {};
    this.player.stats = G.computeStats(this.owned);
    this.permDmg = 1;
    this.enemies = []; this.bullets = []; this.gems = []; this.pickups = [];
    this.foxfires = []; this.zones = []; this.echoRunners = []; this.ofudaList = [];
    this.soulLinks = []; this.spiritNodes = []; this.spiritTrial = null; this.bossCurses = [];
    this.boss = null;
    this.time = 0; this.timeScale = this.timeTarget = 1; this.hitstop = 0;
    this.wave = 1; this.waveTime = 0; this.waveDuration = G.getWave(1).duration; this.waveClearT = 0;
    this.waveOvertime = false; this.bossDefeated = false; this.waveFinishPending = false; this.jade = 0;
    this.shopStock = []; this.shopRerolls = 0; this.shopPending = false;
    this.shopFreeClaimed = false; this.shopFreeChoice = null;
    this.nextWavePaper = 0; this.paperShield = 0; this.mirrorShield = 0; this.mirrorCd = 0; this.renewalShield = 0; this.comboShield = 0;
    this.manaSealT = 0;
    this.renewalCd = 0;
    this.jadeBonusCarry = 0;
    this.kills = 0; this.bestCombo = 0; this.bestRating = '—'; this._bestRatingN = 0;
    this.planning = false; this.trail = []; this.trailLen = 0; this.locks = [];
    this.currentForm = null;
    this.dash = null; this.pendingPurify = -1; this.pendingEchoT = -1; this.trailFade = null;
    this.pendingLevels = 0; this.spawnT = 0.5; this.eliteT = 999;
    this.stageEventT = 999; this.stageEventCount = 0;
    this.surgeWarned = false;
    this.bossSpawned = false;
    this.dashCount = 0; this.combo = 0; this.foxAcc = 0;
    this.lastHeatTier = 0; this.lastSuperPurge = 0;
    this.overT = -1; this.winT = -1;
    this.skills = {}; this.delayed = []; this.ribbon = []; this._skBadge = '';
    this.weapons = ['ritualBlade']; this.activeWeaponIndex = 0; this._weaponHud = '';
    this.activeSkillId = 'dodge'; this.activeCooldown = 0; this.activeEmpowerT = 0;
    this.planEmpowered = false; this.activeVacuum = null; this.lastAttackPath = null; this._activeHud = '';
    this.weaponPending = false; this.weaponOffers = []; this.weaponReplaceIndex = 0;
    this.itemRewardPending = false; this.itemOffers = []; this._itemHud = null;
    this.chainPull = null; this.weaponTelegraph = null;
    this.buildState = {}; this._buildHud = '';
    this._buildAnnounceReady = false; this._pendingBuildNotices = [];
    this.bladeMastery = 1;
    this.moonTideT = 8; this.moonTideWindow = 0; this.mirrorCutCount = 0; this._fateHud = '';
    this.swapRelicCd = 0; this.swapEmpower = false; this.activeRelicCharge = 0;
    this.lastRelicForm = null; this.umbrellaCd = 0; this.lastLifeUsed = false; this.ledgerKills = 0;
    if (this.fateId === 'attendant') {
      const firstSkill = G.util.pick(G.SKILL_ORDER);
      if (firstSkill) this.skills[firstSkill] = 1;
    }
    this.rebuildStats();
    G.FX.clear();
    this._buildAnnounceReady = true;
    this.state = 'play';
    this.$('title').classList.add('hidden');
    this.$('fateSelect').classList.add('hidden');
    this.$('gameover').classList.add('hidden');
    this.$('victory').classList.add('hidden');
    this.$('levelup').classList.add('hidden');
    this.$('shop').classList.add('hidden');
    this.$('weaponSelect').classList.add('hidden');
    this.$('itemReward').classList.add('hidden');
    this.$('pause').classList.add('hidden');
    this.$('hud').classList.remove('hidden');
    this.$('bossWrap').classList.add('hidden');
    this.$('hint').style.opacity = 1;
    this.$('planVig').style.opacity = 0;
    G.Audio.ensure(); G.Audio.startAmbient();
    this.beginWave(1, true);
  }

  fate() {
    return G.FATES[this.fateId] || G.FATES.attendant;
  }

  openFateSelect() {
    this.state = 'fate';
    this.$('title').classList.add('hidden');
    this.$('fateSelect').classList.remove('hidden');
    const wrap = this.$('fateChoices');
    if (!wrap) return;
    wrap.innerHTML = G.FATE_ORDER.map(id => {
      const fate = G.FATES[id];
      return '<button type="button" class="fateCard" data-fate="' + id +
        '" style="--fate:' + fate.color + '">' +
        '<span class="fateKanji">' + fate.kanji + '</span>' +
        '<span class="fateCopy"><b>' + fate.name + '</b><i>' + fate.style + '</i>' +
        '<em>' + fate.desc + '</em><strong>' + fate.boon + '</strong>' +
        '<small>' + fate.bane + '</small></span></button>';
    }).join('');
    for (const el of wrap.querySelectorAll('[data-fate]'))
      el.onclick = () => this.chooseFate(el.dataset.fate);
  }

  closeFateSelect() {
    if (this.state !== 'fate') return;
    this.state = 'title';
    this.$('fateSelect').classList.add('hidden');
    this.$('title').classList.remove('hidden');
  }

  chooseFate(id) {
    if (this.state !== 'fate' || !G.FATES[id]) return false;
    G.Audio.ensure();
    G.Audio.skillGet();
    this.start(id);
    return true;
  }

  quitToTitle() {
    this.state = 'title';
    G.FX.clear();
    this.$('fateSelect').classList.add('hidden');
    this.$('pause').classList.add('hidden');
    this.$('shop').classList.add('hidden');
    this.$('levelup').classList.add('hidden');
    this.$('itemReward').classList.add('hidden');
    this.$('hud').classList.add('hidden');
    this.$('title').classList.remove('hidden');
    this.$('planVig').style.opacity = 0;
    this.showBest();
  }
  showBest() {
    try {
      const b = JSON.parse(localStorage.getItem('hitofude_best') || 'null');
      this.$('bestLine').textContent = b ?
        '最佳战绩 ・ 第 ' + (b.wave || 1) + ' 祓 ・ 祓除 ' + b.kills + ' ・ 最大连击 ' + b.combo : '初次参拜，愿神明庇佑';
    } catch (e) { this.$('bestLine').textContent = ''; }
  }
  saveBest(win) {
    let b = null;
    try { b = JSON.parse(localStorage.getItem('hitofude_best') || 'null'); } catch (e) {}
    const cur = { wave: this.wave, time: Math.floor(this.time), kills: this.kills, combo: this.bestCombo, win: !!win };
    const oldWave = b ? (b.wave || 1) : 0;
    const better = !b || cur.wave > oldWave || (cur.wave === oldWave && cur.kills > (b.kills || 0)) || (win && !b.win);
    if (better) { try { localStorage.setItem('hitofude_best', JSON.stringify(cur)); } catch (e) {} }
  }

  togglePause() {
    if (this.state === 'play') { this.state = 'paused'; this.$('pause').classList.remove('hidden'); }
    else if (this.state === 'paused') this.resume();
  }
  resume() { if (this.state === 'paused') { this.state = 'play'; this.$('pause').classList.add('hidden'); } }

  stats() { return this.player.stats; }

  pointerWorld() {
    return {
      x: this.camera.x + G.Input.mouse.x / this.camera.zoom,
      y: this.camera.y + G.Input.mouse.y / this.camera.zoom
    };
  }

  worldToScreen(x, y) {
    return {
      x: (x - this.camera.x) * this.camera.zoom,
      y: (y - this.camera.y) * this.camera.zoom
    };
  }

  updateCamera(dt, snap) {
    const c = this.camera;
    const viewW = G.W / c.zoom, viewH = G.H / c.zoom;
    const maxX = Math.max(0, G.WORLD_W - viewW);
    const maxY = Math.max(0, G.WORLD_H - viewH);
    const tx = G.util.clamp(this.player.x - viewW * 0.5, 0, maxX);
    const ty = G.util.clamp(this.player.y - viewH * 0.5, 0, maxY);
    if (snap || dt <= 0) {
      c.x = tx; c.y = ty;
      return;
    }
    const follow = 1 - Math.pow(0.0008, dt);
    c.x = G.util.lerp(c.x, tx, follow);
    c.y = G.util.lerp(c.y, ty, follow);
  }

  rebuildStats() {
    const s = G.computeStats(this.owned);
    const previousBuildState = this.buildState || {};
    const oldMaxMana = this.player.maxMana || 100;
    const blood = this.shopRelics.bloodContract || 0;
    const prayer = this.shopRelics.prayerBranch || 0;
    const shura = this.shopRelics.shuraMask || 0;
    s.dmg *= (1 + blood * 0.3) * (1 + prayer * 0.08);
    s.maxHp = Math.max(25, s.maxHp - blood * 20 - shura * 25);
    s.repeatHits += shura;
    s.maxLock += shura * 2;
    const fate = this.fate();
    s.dmg *= fate.damageMul || 1;
    s.speed *= fate.speedMul || 1;
    s.cost *= fate.costMul || 1;
    s.maxHp = Math.max(25, Math.round(s.maxHp * (fate.maxHpMul || 1)));
    s.repeatHits += fate.repeatBonus || 0;
    s.maxLock += fate.lockBonus || 0;
    if (this.fateId === 'bladeless') {
      s.dmg *= 1.18 + this.bladeMastery * 0.1;
      s.trailLen *= 1.06 + this.bladeMastery * 0.06;
      s.lockR *= 1.05 + this.bladeMastery * 0.05;
    }
    this.buildState = G.getBuildState ? G.getBuildState(this) : {};
    this.queueBuildTierNotices(previousBuildState, this.buildState);
    const repeatTier = this.buildState.repeat ? this.buildState.repeat.tier : 0;
    // 共鸣只增加返祓的总锁定容量，不突破“返祓・重巡”满阶七斩的单体上限。
    s.maxLock += repeatTier * 2;
    s.buildTiers = {};
    for (const id of (G.BUILD_ORDER || []))
      s.buildTiers[id] = this.buildState[id] ? this.buildState[id].tier : 0;
    this.player.stats = s;
    this.player.maxHp = s.maxHp;
    this.player.hp = Math.min(this.player.hp, this.player.maxHp);
    this.player.maxMana = s.maxMana;
    if (s.maxMana > oldMaxMana) this.player.mana += s.maxMana - oldMaxMana;
    this.player.mana = Math.min(this.player.mana, this.player.maxMana);
    return s;
  }

  buildTier(id) {
    return this.buildState && this.buildState[id] ? this.buildState[id].tier : 0;
  }

  queueBuildTierNotices(previous, next) {
    if (!this._buildAnnounceReady || !G.BUILD_ORDER) return;
    for (const id of G.BUILD_ORDER) {
      const before = previous[id] ? previous[id].tier : 0;
      const after = next[id] ? next[id].tier : 0;
      if (after <= before) continue;
      this._pendingBuildNotices.push({
        id, tier: after, def: G.BUILD_ARCHETYPES[id]
      });
    }
  }

  consumeBuildNotice() {
    if (!this._pendingBuildNotices.length) return '';
    const notices = this._pendingBuildNotices.splice(0);
    const text = notices.map(notice =>
      notice.def.name + '・' + (notice.tier >= 2 ? '大 成' : '初 成')).join(' / ');
    G.FX.flash(0.18, notices.some(notice => notice.tier >= 2) ? '#f0ccff' : '#fff0bd');
    G.FX.ring(this.player.x, this.player.y,
      notices.some(notice => notice.tier >= 2) ? 164 : 124, 'gold', 7, 0.65, 24);
    G.FX.papers(this.player.x, this.player.y, notices.length * 6 + 6);
    G.Audio.level();
    this._buildHud = '';
    return '共 鸣 ・ ' + text;
  }

  showPendingBuildNotice() {
    const notice = this.consumeBuildNotice();
    if (notice) G.FX.banner(notice);
    return notice;
  }

  skillSlotLimit() {
    return this.fate().skillSlots || 4;
  }

  skillSlotCount() {
    return G.SKILL_ORDER.filter(id => (this.skills[id] || 0) > 0).length;
  }

  fatePriceMul() {
    return this.fate().priceMul || 1;
  }

  fateJadeMul() {
    return this.fate().jadeMul || 1;
  }

  fateXpMul() {
    return this.fate().xpMul || 1;
  }

  fateActiveCooldownMul() {
    return this.fate().activeCdMul || 1;
  }

  canNaturalManaRegen() {
    return !this.fate().noRegen;
  }

  updateFate(rdt) {
    if (this.fateId !== 'moonTide') return;
    if (this.moonTideWindow > 0)
      this.moonTideWindow = Math.max(0, this.moonTideWindow - rdt);
    this.moonTideT -= rdt;
    if (this.moonTideT > 0) return;
    this.moonTideT += 8;
    this.moonTideWindow = 2.2;
    const gain = this.player.maxMana * 0.45;
    this.player.mana = Math.min(this.player.maxMana, this.player.mana + gain);
    G.FX.ring(this.player.x, this.player.y, 132, 'cyan', 7, 0.72, 28);
    G.FX.burst(this.player.x, this.player.y, 'teal', 18, 250, 13, 0.52);
    G.FX.banner('月 潮 涌 现 ・ 神 力 回 归');
    G.Audio.level();
  }

  onTrajectoryBulletCut(x, y) {
    if (this.fateId !== 'mirror') return;
    this.mirrorCutCount++;
    if (this.mirrorCutCount < 5) return;
    this.mirrorCutCount -= 5;
    this.mirrorShield = Math.max(this.mirrorShield, 1);
    const targets = this.enemies.filter(e => !e.dead)
      .sort((a, b) => G.util.dist2(x, y, a.x, a.y) - G.util.dist2(x, y, b.x, b.y))
      .slice(0, 3);
    if (this.boss && !this.boss.dead) targets.push(this.boss);
    const dmg = this.player.stats.dmg * this.permDmg * 0.48;
    for (const target of targets.slice(0, 3)) {
      G.FX.bolt(x, y, target.x, target.y, { w: 3.5, life: 0.22 });
      this.hurtEnemy(target, target.isBoss ? dmg * 0.65 : dmg, {});
    }
    G.FX.ring(this.player.x, this.player.y, 78, 'teal', 5, 0.45);
    G.FX.text(this.player.x, this.player.y - 42, '镜 心・返 照', {
      size: 16, color: '#baffef', crit: true
    });
    G.Audio.echo();
  }

  // ============ 关卡流程 ============
  beginWave(wave, first) {
    const wd = G.getWave(wave);
    const chapter = G.getWaveChapter(wave);
    const trial = G.getWaveTrial(wave);
    this.wave = wd.id;
    this.waveTime = 0;
    this.waveDuration = wd.duration;
    this.waveClearT = 0;
    this.waveOvertime = false;
    this.bossDefeated = false;
    this.waveFinishPending = false;
    this.bossSpawned = false;
    this.lastLifeUsed = false;
    this.lastRelicForm = null;
    this.spawnT = first ? 0.8 : 0.45;
    this.eliteT = (wd.eliteDelay || 999) * (trial.eliteDelayMul || 1) *
      (this.fate().eliteIntervalMul || 1);
    this.stageEventT = wd.boss ? 999 : Math.min(9.5, chapter.eventEvery * 0.62) *
      (trial.eventMul || 1);
    this.stageEventCount = 0;
    this.surgeWarned = false;
    this.manaSealT = 0;
    this.renewalCd = 0;
    this.state = 'play';
    this.timeScale = this.timeTarget = 1;
    this.hitstop = 0;
    this.enemies = []; this.bullets = []; this.gems = []; this.pickups = [];
    this.foxfires = []; this.zones = []; this.echoRunners = []; this.ofudaList = [];
    this.soulLinks = []; this.spiritNodes = []; this.spiritTrial = null; this.bossCurses = [];
    this.delayed = []; this.ribbon = []; this.boss = null;
    this.chainPull = null; this.weaponTelegraph = null;
    this.dash = null; this.pendingPurify = -1; this.pendingEchoT = -1; this.trailFade = null;
    this.activeCooldown = 0; this.activeEmpowerT = 0; this.planEmpowered = false;
    this.activeVacuum = null; this.lastAttackPath = null;
    this.cancelPlanning();
    this.player.x = G.WORLD_W / 2; this.player.y = G.WORLD_H / 2;
    this.updateCamera(0, true);
    this.createSpiritNodes(wd);
    this.player.state = 'move'; this.player.iTime = 1;
    if (first) this.player.mana = this.player.maxMana;
    this.paperShield = this.nextWavePaper;
    this.nextWavePaper = 0;
    this.$('shop').classList.add('hidden');
    this.$('bossWrap').classList.add('hidden');
    this.$('hud').classList.remove('hidden');
    G.FX.banner('第 ' + String(this.wave).padStart(2, '0') + ' 祓 ・ ' +
      wd.stageLabel + ' ・ ' + (wd.boss ? '祟 主 現 世' : trial.name));
    this.delayed.push({
      t: 1.05, real: true,
      fn: () => G.FX.banner(chapter.name + ' ・ ' + trial.name)
    });
    if (this.paperShield > 0) G.FX.text(this.player.x, this.player.y - 42, '替身结界', { size: 15, color: '#ffe2a0' });
    if (wd.boss) G.Audio.warn();
    this.refreshHud();
  }

  cancelPlanning() {
    this.planning = false;
    this.planEmpowered = false;
    this.$('planVig').style.opacity = 0;
    const formHud = this.$('formHud');
    if (formHud) formHud.classList.remove('active');
    this.currentForm = null;
    this.$('manaPreview').style.width = '0';
    for (const t of this.getLockables()) { t.seal = -1; t.sealCount = 0; }
    this.trail = []; this.trailCum = []; this.trailLen = 0; this.locks = [];
  }

  finishWave() {
    if (this.state !== 'play') return;
    this.waveFinishPending = false;
    this.cancelPlanning();
    this.player.state = 'move';
    this.state = 'waveclear';
    this.waveClearT = 1.35;
    this.timeTarget = 0.2;
    for (const e of this.enemies) {
      if (!e.dead && G.util.chance(0.28)) G.FX.petals(e.x, e.y, 2);
    }
    this.enemies = []; this.bullets = []; this.foxfires = []; this.zones = [];
    this.soulLinks = []; this.spiritNodes = []; this.spiritTrial = null; this.bossCurses = [];
    this.echoRunners = []; this.ofudaList = []; this.delayed = [];
    this.chainPull = null; this.weaponTelegraph = null;
    this.dash = null; this.pendingPurify = -1; this.pendingEchoT = -1; this.trailFade = null;
    this.activeVacuum = null; this.activeEmpowerT = 0; this.planEmpowered = false;
    this.combo = 0; this.$('comboText').textContent = '';
    this.boss = null;
    this.$('bossWrap').classList.add('hidden');
    G.FX.banner('第 ' + String(this.wave).padStart(2, '0') + ' 祓 ・ 完 了');
    G.Audio.level();
  }

  collectWaveLoot() {
    for (const g of this.gems) if (!g.dead) g.collect(this, true);
    for (const p of this.pickups) if (!p.dead) p.collect(this, true);
    this.gems = []; this.pickups = [];
  }

  completeWaveTransition() {
    if (this.state !== 'waveclear') return;
    this.collectWaveLoot();
    this.timeScale = this.timeTarget = 1;
    if (this.wave >= G.TOTAL_WAVES) {
      this.saveBest(true);
      this.showVictory();
      return;
    }
    this.shopPending = true;
    this.weaponPending = this.wave % 5 === 0 && this.wave < G.TOTAL_WAVES;
    this.itemRewardPending = this.wave % 5 === 0 && this.wave < G.TOTAL_WAVES;
    if (this.pendingLevels > 0) this.openLevelUp();
    else this.continuePostWaveRewards();
  }

  continuePostWaveRewards() {
    if (this.itemRewardPending) {
      this.openItemReward();
    } else if (this.weaponPending) {
      this.openWeaponSelect();
    } else if (this.shopPending) {
      this.shopPending = false;
      this.openShop();
    } else {
      this.state = 'play';
    }
  }

  activeWeapon() {
    return G.WEAPONS[this.weapons[this.activeWeaponIndex]] || G.WEAPONS.ritualBlade;
  }

  switchWeapon(index) {
    if (this.state !== 'play' || this.planning || this.player.state !== 'move') return false;
    if (index < 0 || index >= this.weapons.length || index === this.activeWeaponIndex) return false;
    this.activeWeaponIndex = index;
    const weapon = this.activeWeapon();
    if (this.shopRelics.twinScabbard && this.swapRelicCd <= 0) {
      this.swapRelicCd = 10;
      this.swapEmpower = true;
      G.FX.ring(this.player.x, this.player.y, 92, 'gold', 5, 0.48);
      G.FX.text(this.player.x, this.player.y - 44, '比 翼・无 耗 待 发', {
        size: 15, color: '#ffe2a0', crit: true
      });
    }
    this._weaponHud = '';
    this.refreshHud();
    G.FX.banner(weapon.name + ' ・ 换 装' + (this.swapEmpower ? ' ・ 比 翼 双 鞘' : ''));
    G.Audio.select();
    return true;
  }

  activeSkill() {
    return G.ACTIVE_SKILLS[this.activeSkillId] || G.ACTIVE_SKILLS.dodge;
  }

  equipActiveSkill(id) {
    const skill = G.ACTIVE_SKILLS[id];
    if (!skill) return false;
    this.activeSkillId = id;
    this.activeCooldown = 0;
    this.activeEmpowerT = 0;
    this.planEmpowered = false;
    this.activeVacuum = null;
    this._activeHud = '';
    this.rebuildStats();
    this.refreshHud();
    const buildNotice = this.consumeBuildNotice();
    G.FX.banner(skill.name + ' ・ 装 着' + (buildNotice ? ' ・ ' + buildNotice : ''));
    G.Audio.skillGet();
    return true;
  }

  attackCost() {
    const empowered = this.planEmpowered || this.activeEmpowerT > 0;
    const tide = this.fateId === 'moonTide' && this.moonTideWindow > 0;
    const weaponCost = (this.activeWeapon() && this.activeWeapon().costMul) || 1;
    if (this.swapEmpower) return 0;
    const spellMul = Math.max(0.5, 1 - this.activeRelicCharge * 0.15);
    return Math.max(1, Math.ceil(this.player.stats.cost *
      weaponCost * spellMul * (empowered ? 0.5 : 1) * (tide ? 0.5 : 1)));
  }

  useActiveSkill() {
    if (this.state !== 'play' || this.planning || this.player.state !== 'move') return false;
    const skill = this.activeSkill();
    if (!skill || this.activeCooldown > 0) {
      if (this.activeCooldown > 0) G.Audio.fizzle();
      return false;
    }
    let used = false;
    if (skill.id === 'dodge') used = this.useActiveDodge();
    else if (skill.id === 'shockwave') used = this.useActiveShockwave();
    else if (skill.id === 'vacuum') used = this.useActiveVacuum();
    else if (skill.id === 'aftertrail') used = this.useActiveAftertrail();
    else if (skill.id === 'empower') used = this.useActiveEmpower();
    if (!used) return false;
    this.activeCooldown = skill.cooldown * this.fateActiveCooldownMul();
    const spellReturn = this.shopRelics.spellReturnGem || 0;
    if (spellReturn > 0) {
      this.activeRelicCharge = Math.max(this.activeRelicCharge, spellReturn);
      G.FX.ring(this.player.x, this.player.y, 76, 'purple', 4, 0.4);
      G.FX.text(this.player.x, this.player.y - 42, '术 返・待 发', {
        size: 14, color: '#e4bcff', crit: true
      });
    }
    this._activeHud = '';
    this.refreshHud();
    return true;
  }

  useActiveDodge() {
    const p = this.player;
    const pointer = this.pointerWorld();
    let ang = G.util.angTo(p.x, p.y, pointer.x, pointer.y);
    if (G.util.dist2(p.x, p.y, pointer.x, pointer.y) < 16) ang = p.dir || 0;
    const ax = p.x, ay = p.y;
    const distance = 245 * (G.WORLD_UNIT || 1);
    const landing = G.util.fieldClamp(ax + Math.cos(ang) * distance,
      ay + Math.sin(ang) * distance, p.r + 18);
    p.x = landing.x;
    p.y = landing.y;
    p.dir = ang;
    p.iTime = Math.max(p.iTime, 0.28);
    for (const b of this.bullets) {
      if (b.dead) continue;
      if (G.util.dSeg(b.x, b.y, ax, ay, p.x, p.y).d <= b.r + 34) {
        b.dead = true;
        G.FX.burst(b.x, b.y, 'cyan', 3, 100, 7, 0.2);
      }
    }
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      G.FX.after(G.util.lerp(ax, p.x, t), G.util.lerp(ay, p.y, t), ang, 'dash', 'cyan', 0.25);
    }
    G.FX.slash((ax + p.x) * 0.5, (ay + p.y) * 0.5, ang, G.util.dist(ax, ay, p.x, p.y) + 70, 'cyan');
    G.FX.ring(p.x, p.y, 62, 'cyan', 4, 0.32);
    G.FX.shake(4, 0.16);
    G.Audio.dash();
    return true;
  }

  useActiveShockwave() {
    const p = this.player;
    const radius = 205;
    const dmg = p.stats.dmg * this.permDmg * 0.25;
    for (const e of this.enemies) {
      if (e.dead || G.util.dist2(e.x, e.y, p.x, p.y) > (radius + e.r) * (radius + e.r)) continue;
      const ang = G.util.angTo(p.x, p.y, e.x, e.y);
      e.kx += Math.cos(ang) * 760;
      e.ky += Math.sin(ang) * 760;
      this.hurtEnemy(e, dmg, {});
    }
    if (this.boss && !this.boss.dead &&
      G.util.dist2(this.boss.x, this.boss.y, p.x, p.y) <= (radius + this.boss.r) * (radius + this.boss.r)) {
      this.hurtBoss(dmg * 0.45, {});
    }
    for (const b of this.bullets) {
      if (!b.dead && G.util.dist2(b.x, b.y, p.x, p.y) <= (radius + b.r + 20) * (radius + b.r + 20)) b.dead = true;
    }
    G.FX.ring(p.x, p.y, radius, 'gold', 9, 0.46, 24);
    G.FX.ring(p.x, p.y, radius * 0.62, 'white', 4, 0.36, 18);
    G.FX.burst(p.x, p.y, 'gold', 24, 330, 15, 0.48);
    G.FX.flash(0.12, '#fff0c5');
    G.FX.shake(9, 0.24);
    G.Audio.purify(5);
    return true;
  }

  useActiveVacuum() {
    const p = this.player;
    const pointer = this.pointerWorld();
    const ang = G.util.angTo(p.x, p.y, pointer.x, pointer.y);
    const distance = G.util.clamp(G.util.dist(p.x, p.y, pointer.x, pointer.y), 150, 330);
    this.activeVacuum = {
      x: p.x, y: p.y, ang,
      focusX: G.util.clamp(p.x + Math.cos(ang) * distance, 30, G.WORLD_W - 30),
      focusY: G.util.clamp(p.y + Math.sin(ang) * distance, 66, G.WORLD_H - 26),
      t: 1.1, maxT: 1.1, r: 420, pulseT: 0
    };
    G.FX.ring(this.activeVacuum.focusX, this.activeVacuum.focusY, 96, 'teal', 5, 0.5, 18);
    G.FX.banner('引 魂 风 穴');
    G.Audio.orb();
    return true;
  }

  updateActiveVacuum(dt) {
    const v = this.activeVacuum;
    if (!v) return;
    v.t -= dt;
    v.pulseT -= dt;
    const pull = target => {
      if (!target || target.dead) return;
      const d = G.util.dist(v.x, v.y, target.x, target.y);
      if (d > v.r + target.r) return;
      let da = Math.abs(G.util.angTo(v.x, v.y, target.x, target.y) - v.ang);
      while (da > Math.PI) da = Math.abs(da - Math.PI * 2);
      if (da > 0.72) return;
      const a = G.util.angTo(target.x, target.y, v.focusX, v.focusY);
      const force = target.isBoss ? 180 : 1050;
      target.kx += Math.cos(a) * force * dt;
      target.ky += Math.sin(a) * force * dt;
    };
    for (const e of this.enemies) pull(e);
    pull(this.boss);
    if (v.pulseT <= 0) {
      v.pulseT = 0.16;
      G.FX.ring(v.focusX, v.focusY, 38 + 72 * (v.t / v.maxT), 'teal', 2, 0.2, 12);
    }
    if (v.t <= 0) {
      G.FX.burst(v.focusX, v.focusY, 'teal', 13, 180, 11, 0.34);
      this.activeVacuum = null;
    }
  }

  useActiveAftertrail() {
    const previous = this.lastAttackPath;
    if (!previous || !previous.pts || previous.pts.length < 2 || previous.L < 30) {
      G.FX.text(this.player.x, this.player.y - 34, '尚 无 可 返 轨 迹', { size: 14, color: '#a8dfff' });
      G.Audio.fizzle();
      return false;
    }
    const pts = previous.pts.slice().reverse().map(p => ({ x: p.x, y: p.y }));
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + G.util.dist(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y));
    const path = { pts, cum, L: cum[cum.length - 1], weapon: previous.weapon };
    const repeatTier = this.buildTier('repeat');
    const base = this.player.stats.dmg * this.permDmg;
    const dmg = base * (0.8 + repeatTier * 0.1);
    const width = 58 + repeatTier * 8;
    let cutBullets = 0, cutLinks = 0, solvedCurses = 0;

    // 返迹重放的是一条真正的攻击轨迹：断弹、共生赤契和祟主咒式都会再次响应。
    for (const bullet of this.bullets) {
      if (bullet.dead || !this.pathTouchesPoint(path, bullet.x, bullet.y, bullet.r + width * 0.55)) continue;
      bullet.dead = true; cutBullets++;
      G.FX.burst(bullet.x, bullet.y, 'cyan', 4, 130, 8, 0.25);
      this.onTrajectoryBulletCut(bullet.x, bullet.y);
    }
    for (const link of this.soulLinks) {
      if (!link.active || !this.pathCrossesLine(path, link.a, link.b, 16)) continue;
      link.active = false;
      if (link.a.soulLink === link) link.a.soulLink = null;
      if (link.b.soulLink === link) link.b.soulLink = null;
      link.a.vulnT = Math.max(link.a.vulnT || 0, 2.2);
      link.b.vulnT = Math.max(link.b.vulnT || 0, 2.2);
      G.FX.bolt(link.a.x, link.a.y, link.b.x, link.b.y, { w: 7, life: 0.24 });
      G.FX.burst((link.a.x + link.b.x) * 0.5, (link.a.y + link.b.y) * 0.5,
        'cyan', 15, 250, 12, 0.44);
      cutLinks++;
    }
    const replayForm = previous.formId ? { ready: true, id: previous.formId } : null;
    for (const curse of this.bossCurses) {
      if (curse.dead || !this.trajectorySolvesCurse(path, replayForm, curse)) continue;
      curse.dead = true; solvedCurses++;
      if (this.boss) {
        this.boss.staggerT = Math.max(this.boss.staggerT, 1.05);
        this.boss.vulnT = Math.max(this.boss.vulnT || 0, 2.6);
      }
      const x = curse.x == null ? (curse.a.x + curse.b.x) * 0.5 : curse.x;
      const y = curse.y == null ? (curse.a.y + curse.b.y) * 0.5 : curse.y;
      G.FX.ring(x, y, 126, 'cyan', 7, 0.5);
      G.FX.burst(x, y, 'gold', 18, 260, 13, 0.46);
    }

    G.FX.windTrail(pts, 3);
    G.FX.flash(0.18, '#e8faff');
    for (let s = 0; s <= path.L; s += 72) {
      const point = this.pathPointAt(path, Math.min(s, path.L));
      G.FX.slash(point.x, point.y, point.ang + Math.PI * 0.5, 132, 'cyan');
    }
    for (const e of this.enemies) {
      if (e.dead || !this.pathTouchesPoint(path, e.x, e.y, e.r + width)) continue;
      this.hurtEnemy(e, dmg, {});
    }
    if (this.boss && !this.boss.dead &&
      this.pathTouchesPoint(path, this.boss.x, this.boss.y, this.boss.r + width)) {
      this.hurtBoss(dmg * 0.65, {});
    }

    // 上一笔的幸存目标会被“返印”锁住。即使它已经移动出旧轨迹，
    // 片刻后仍会受到追斩并进入短暂易伤，解决旧版经常空放的问题。
    const marked = [...new Set(previous.targets || [])]
      .filter(target => target && !target.dead && !target.broken);
    if (marked.length) {
      const markDmg = base * (0.42 + repeatTier * 0.08);
      this.delayed.push({
        t: 0.16, real: true,
        fn: () => {
          let hits = 0;
          for (const target of marked) {
            if (!target || target.dead || target.broken) continue;
            if (target.isBoss) {
              if (target !== this.boss || target.dead) continue;
              this.hurtBoss(markDmg * 0.72, {});
              target.vulnT = Math.max(target.vulnT || 0, 2.2 + repeatTier * 0.35);
            } else {
              if (!this.enemies.includes(target)) continue;
              this.hurtEnemy(target, markDmg, {});
              if (!target.dead) target.vulnT = Math.max(target.vulnT || 0, 2.2 + repeatTier * 0.35);
            }
            G.FX.gash(target.x, target.y, G.util.rand(0, Math.PI * 2), target.r * 1.2);
            G.FX.ring(target.x, target.y, target.r * 2.6, 'cyan', 3, 0.34);
            hits++;
          }
          if (hits) {
            G.FX.banner('返 印 追 斩 ・ ' + hits);
            G.FX.shake(6 + Math.min(5, hits), 0.24);
            G.Audio.echo();
          }
        }
      });
    }
    const end = pts[pts.length - 1];
    G.FX.ring(end.x, end.y, 92, 'cyan', 6, 0.44);
    G.FX.text(end.x, end.y - 34, '返 迹', { size: 19, color: '#bcecff', crit: true });
    G.FX.shake(7, 0.24);
    if (cutBullets || cutLinks || solvedCurses)
      G.FX.banner('返 迹 逆 解 ・ 弹 ' + cutBullets + '・契 ' + cutLinks + '・咒 ' + solvedCurses);
    G.Audio.echo();
    return true;
  }

  useActiveEmpower() {
    const p = this.player;
    this.activeEmpowerT = 5;
    G.FX.ring(p.x, p.y, 92, 'purple', 5, 0.55, 24);
    G.FX.ring(p.x, p.y, 58, 'gold', 3, 0.46, 16);
    G.FX.papers(p.x, p.y, 8);
    G.FX.banner('一 笔 入 神 ・ 待 发');
    G.Audio.skillGet();
    return true;
  }

  openWeaponSelect() {
    if (this.fateId === 'bladeless') {
      this.bladeMastery = Math.min(4, this.bladeMastery + 1);
      this.weaponPending = false;
      this._weaponHud = '';
      this.rebuildStats();
      const buildNotice = this.consumeBuildNotice();
      G.FX.banner('无 刀・唯 一 神 兵 开 眼 ' + this.bladeMastery +
        (buildNotice ? ' ・ ' + buildNotice : ''));
      G.FX.ring(this.player.x, this.player.y, 118, 'white', 7, 0.65, 24);
      G.Audio.skillGet();
      this.continuePostWaveRewards();
      return;
    }
    const pool = G.WEAPON_ORDER.filter(id => !this.weapons.includes(id));
    if (!pool.length) {
      this.weaponPending = false;
      this.continuePostWaveRewards();
      return;
    }
    this.state = 'weapon';
    const dominant = G.getDominantBuild ? G.getDominantBuild(this, 2) : null;
    const aligned = dominant
      ? pool.filter(id => dominant.def.weapons.includes(id)).sort(() => Math.random() - 0.5)
      : [];
    const rest = pool.filter(id => !aligned.includes(id)).sort(() => Math.random() - 0.5);
    this.weaponOffers = aligned.slice(0, 1)
      .concat(rest.concat(aligned.slice(1)).sort(() => Math.random() - 0.5))
      .slice(0, 3);
    this.weaponReplaceIndex = Math.min(this.activeWeaponIndex, this.weapons.length - 1);
    this.$('weaponSelect').classList.remove('hidden');
    this.renderWeaponSelect();
    G.Audio.level();
  }

  renderWeaponSelect() {
    const slots = this.$('weaponCurrentSlots');
    slots.innerHTML = '';
    for (let i = 0; i < 2; i++) {
      const id = this.weapons[i];
      const weapon = id && G.WEAPONS[id];
      const el = document.createElement('div');
      el.className = 'weaponCurrent' + (this.weapons.length >= 2 && i === this.weaponReplaceIndex ? ' replace' : '');
      el.innerHTML = weapon
        ? '<b>' + (i + 1) + '・' + weapon.name + '</b><span>' + (this.weapons.length >= 2 ? (i === this.weaponReplaceIndex ? '将被替换' : '点击改为替换此栏') : '当前神兵') + '</span>'
        : '<b>' + (i + 1) + '・空 位</b><span>新神兵将置入此栏</span>';
      if (weapon && this.weapons.length >= 2) el.onclick = () => {
        this.weaponReplaceIndex = i;
        this.renderWeaponSelect();
      };
      slots.appendChild(el);
    }

    const wrap = this.$('weaponChoices');
    wrap.innerHTML = '';
    this.weaponOffers.forEach(id => {
      const weapon = G.WEAPONS[id];
      const buildHint = G.buildChoiceLabel ? G.buildChoiceLabel(this, 'weapons', id) : '';
      const buildTag = buildHint ? '　共鸣・' + buildHint : '';
      const el = document.createElement('div');
      el.className = 'weaponChoice';
      el.innerHTML =
        '<div class="weaponKanji">' + weapon.kanji + '</div>' +
        '<div class="weaponName">' + weapon.name + '</div>' +
        '<div class="weaponDesc">' + weapon.desc + '</div>' +
        '<div class="weaponPerk">' + weapon.perk + buildTag + '</div>';
      el.onclick = () => this.chooseWeapon(id);
      wrap.appendChild(el);
    });
    this.$('weaponSelectTip').textContent = this.weapons.length < 2
      ? '尚有空位：选择后加入第二武器栏'
      : '武器栏已满：选择后替换上方标记的武器';
  }

  chooseWeapon(id) {
    if (this.state !== 'weapon' || !this.weaponOffers.includes(id)) return;
    if (this.weapons.length < 2) {
      this.weapons.push(id);
      this.activeWeaponIndex = this.weapons.length - 1;
    } else {
      this.weapons[this.weaponReplaceIndex] = id;
      this.activeWeaponIndex = this.weaponReplaceIndex;
    }
    const weapon = G.WEAPONS[id];
    this.weaponPending = false;
    this.weaponOffers = [];
    this._weaponHud = '';
    this.rebuildStats();
    this.$('weaponSelect').classList.add('hidden');
    const buildNotice = this.consumeBuildNotice();
    G.FX.banner(weapon.name + ' ・ 奉 纳' + (buildNotice ? ' ・ ' + buildNotice : ''));
    G.Audio.skillGet();
    this.continuePostWaveRewards();
  }

  // ============ Boss 珍品奉纳 ============
  openItemReward() {
    this.itemOffers = G.rollBossRelics(this, 3);
    if (!this.itemOffers.length) {
      this.itemRewardPending = false;
      this.continuePostWaveRewards();
      return;
    }
    this.state = 'itemreward';
    const wrap = this.$('itemRewardChoices');
    wrap.innerHTML = '';
    const rarStyle = [
      { c: '#9fb4d8', tag: '常物' },
      { c: '#e6c37a', tag: '秘藏' },
      { c: '#c77dff', tag: '神珍' },
    ];
    this.itemOffers.forEach(item => {
      const r = rarStyle[item.rar || 0];
      const buildKind = item.activeSkill ? 'actives' : 'relics';
      const buildId = item.activeSkill || item.id;
      const buildHint = G.buildChoiceLabel ? G.buildChoiceLabel(this, buildKind, buildId) : '';
      const buildTag = buildHint ? '・' + buildHint : '';
      const el = document.createElement('div');
      el.className = 'itemRewardCard' + (item.cursed ? ' cursed' : '');
      el.style.setProperty('--rar', r.c);
      el.innerHTML =
        '<div class="itemRewardKanji">' + item.kanji + '</div>' +
        '<div class="itemRewardSeal">' + item.kanji + '</div>' +
        '<div class="itemRewardName">' + item.name + '</div>' +
        '<div class="itemRewardDesc">' + item.desc + '</div>' +
        '<div class="itemRewardTag">' +
        (item.cursed ? '禁忌・咒物' : r.tag + '・Boss 奉纳' + buildTag) + '</div>';
      el.onclick = () => this.chooseItemReward(item.id);
      wrap.appendChild(el);
    });
    this.$('itemReward').classList.remove('hidden');
    G.Audio.level();
  }

  chooseItemReward(id) {
    if (this.state !== 'itemreward') return;
    const item = this.itemOffers.find(x => x.id === id);
    if (!item || !G.shopRelicEligible(this, item)) return;
    this.shopRelics[id] = (this.shopRelics[id] || 0) + 1;
    this.itemOffers = [];
    this.itemRewardPending = false;
    this._itemHud = null;
    this.rebuildStats();
    this.$('itemReward').classList.add('hidden');
    const buildNotice = this.consumeBuildNotice();
    G.FX.banner(item.name + ' ・ 奉 纳' + (buildNotice ? ' ・ ' + buildNotice : ''));
    G.FX.burst(this.player.x, this.player.y, item.cursed ? 'red' : 'gold', 18, 230, 14, 0.55);
    G.Audio.skillGet();
    this.continuePostWaveRewards();
  }

  // ============ 夜诣商店 ============
  openShop() {
    this.state = 'shop';
    this.shopRerolls = 0;
    this.shopFreeClaimed = false;
    this.shopFreeChoice = null;
    this.shopStock = G.rollShop(this, 4);
    this.$('shop').classList.remove('hidden');
    this.renderShop();
    G.Audio.select();
  }

  rerollCost() {
    const n = this.shopRerolls;
    return Math.max(1, Math.round((5 + n * 3 + Math.floor(n * (n - 1) / 2)) *
      this.fatePriceMul()));
  }

  rerollShop() {
    if (this.state !== 'shop') return;
    const cost = this.rerollCost();
    if (this.jade < cost) { G.Audio.fizzle(); return; }
    this.jade -= cost;
    this.shopRerolls++;
    this.shopStock = G.rollShop(this, 4);
    this.renderShop();
    G.Audio.select();
  }

  renderShop() {
    const rarStyle = [
      { c: '#9fb4d8', g: 'rgba(159,180,216,.28)' },
      { c: '#e6c37a', g: 'rgba(230,195,122,.34)' },
      { c: '#c77dff', g: 'rgba(199,125,255,.4)' },
    ];
    this.renderShopBag();

    const freeWrap = this.$('shopFreeItems');
    freeWrap.innerHTML = '';
    G.SHOP_FREE_ITEMS.forEach((item, i) => {
      const chosen = this.shopFreeChoice === item.id;
      const locked = this.shopFreeClaimed && !chosen;
      const el = document.createElement('div');
      el.className = 'supplyCard' + (chosen ? ' chosen' : '') + (locked ? ' locked' : '');
      el.innerHTML =
        '<div class="supplyKanji">' + item.kanji + '</div>' +
        '<div class="supplyCopy"><b>' + item.name + '</b><span>' + item.desc + '</span></div>' +
        '<div class="supplyPrice">' + (chosen ? '已 领 取' : (locked ? '缘 分 已 定' : '无 偿')) + '</div>';
      if (!this.shopFreeClaimed) el.onclick = () => this.claimShopFree(i);
      freeWrap.appendChild(el);
    });

    const baseWrap = this.$('shopBaseItems');
    baseWrap.innerHTML = '';
    G.SHOP_BASE_ITEMS.forEach((item, i) => {
      const up = G.UPG_MAP[item.effect.id];
      const baseBuildHint = G.buildChoiceLabel
        ? G.buildChoiceLabel(this, 'upgrades', item.effect.id) : '';
      const level = this.owned[item.effect.id] || 0;
      const maxed = !up || level >= up.max;
      const price = maxed ? 0 : G.shopBasePrice(this, item);
      const el = document.createElement('div');
      el.className = 'baseShopCard' + (maxed ? ' maxed' : (this.jade < price ? ' poor' : ''));
      el.innerHTML =
        '<div class="baseKanji">' + item.kanji + '</div>' +
        '<div class="baseName">' + item.name + '</div>' +
        '<div class="baseDesc">' + item.desc +
        (baseBuildHint ? '<br><span style="color:#c7ad76">共鸣・' +
          baseBuildHint + '</span>' : '') + '</div>' +
        '<div class="baseMeta"><span>阶 ' + level + ' / ' + (up ? up.max : 0) + '</span><b>' +
        (maxed ? '已 臻 圆 满' : '灵玉 ・ ' + price) + '</b></div>';
      if (!maxed) el.onclick = () => this.buyShopBase(i);
      baseWrap.appendChild(el);
    });

    const wrap = this.$('shopItems');
    wrap.innerHTML = '';
    this.shopStock.forEach((offer, i) => {
      const item = offer.item, r = rarStyle[item.rar || 0];
      const buildKind = item.activeSkill ? 'actives' : 'relics';
      const buildId = item.activeSkill || item.id;
      const buildHint = G.buildChoiceLabel ? G.buildChoiceLabel(this, buildKind, buildId) : '';
      const buildTag = buildHint ? '・共鸣 ' + buildHint : '';
      const level = item.activeSkill ? (this.activeSkillId === item.activeSkill ? 1 : 0) : (this.shopRelics[item.id] || 0);
      const relicTag = item.activeSkill ? '主动术式・右键' :
        item.cursed ? '禁忌・咒物' :
        item.reqWeapon ? item.flow + '・神兵专属' :
        item.reqTwoWeapons ? '双神兵・换装专属' :
        item.reqSkill ? item.flow + '・秘法专属' :
        item.flow ? item.flow + '・专属' :
        item.mechanic ? G.relicMechanicLabel(item) : '夜市・秘藏';
      const el = document.createElement('div');
      el.className = 'shopCard' + (offer.sold ? ' sold' : (this.jade < offer.price ? ' poor' : ''));
      el.style.setProperty('--rar', r.c);
      el.style.setProperty('--rarGlow', r.g);
      el.innerHTML =
        '<div class="shopKanji">' + item.kanji + '</div>' +
        '<div class="shopSeal">' + item.kanji + '</div>' +
        '<div class="shopName">' + item.name + '</div>' +
        '<div class="shopDesc">' + item.desc + '</div>' +
        '<div class="shopTag">' + relicTag + buildTag + '　' +
        (item.activeSkill ? '替换当前主动・冷却 ' + G.ACTIVE_SKILLS[item.activeSkill].cooldown + ' 秒' : '阶 ' + level + ' / ' + item.max) +
        '</div>' +
        '<div class="shopPrice">' + (offer.sold ? (item.activeSkill ? '已 装 着' : '已 购 入') : '灵玉 ・ ' + offer.price) + '</div>';
      if (!offer.sold) el.onclick = () => this.buyShopItem(i);
      wrap.appendChild(el);
    });
    this.$('shopWaveText').textContent = '第 ' + String(this.wave).padStart(2, '0') + ' 祓 ・ 清祓完了';
    this.$('shopJade').textContent = '灵玉 ・ ' + this.jade;
    this.$('rerollCost').textContent = '・ ' + this.rerollCost();
    this.$('btnReroll').classList.toggle('poor', this.jade < this.rerollCost());
    const dominant = G.getDominantBuild ? G.getDominantBuild(this, 1) : null;
    const shopTip = this.$('shopTip');
    if (shopTip) shopTip.textContent = dominant
      ? '当前倾向・' + dominant.def.name + '　共鸣 ' + dominant.score + ' / ' + dominant.next +
        (dominant.tier === 2 ? '・大成效果已激活' : dominant.tier === 1 ? '・初成效果已激活' : '・再取同流派内容即可初成')
      : '尚无流派倾向・首件武器、技能或强化将开始引导构筑';
    this.refreshHud();
  }

  renderShopBag() {
    const wrap = this.$('shopBag');
    wrap.innerHTML = '';
    const held = G.SHOP_RELICS.filter(item => (this.shopRelics[item.id] || 0) > 0);
    if (!held.length) {
      wrap.innerHTML = '<span class="shopBagEmpty">尚无珍品</span>';
      return;
    }
    for (const item of held) {
      const count = this.shopRelics[item.id] || 0;
      const refund = G.shopRelicSellPrice(this, item);
      const el = document.createElement('div');
      el.className = 'shopBagItem r' + (item.rar || 0) + (item.cursed ? ' cursed' : '');
      el.innerHTML = '<b>' + item.kanji + '</b>' + (count > 1 ? '<i>×' + count + '</i>' : '');
      el.title = item.name + ' ×' + count + '\n' + item.desc + '\n右键出售一阶：灵玉 ' + refund;
      el.oncontextmenu = e => {
        e.preventDefault();
        this.sellShopItem(item.id);
      };
      wrap.appendChild(el);
    }
  }

  sellShopItem(id) {
    if (this.state !== 'shop') return false;
    const item = G.SHOP_RELIC_MAP[id];
    const count = this.shopRelics[id] || 0;
    if (!item || count <= 0) return false;
    const refund = G.shopRelicSellPrice(this, item);
    if (count === 1) delete this.shopRelics[id];
    else this.shopRelics[id] = count - 1;
    this.jade += refund;
    this._itemHud = null;
    this.rebuildStats();
    G.FX.banner(item.name + ' ・ 返 奉');
    G.Audio.gem();
    this.renderShop();
    return true;
  }

  applyShopEffect(item) {
    const effect = item.effect;
    if (effect.type === 'heal') {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + effect.value);
      G.Audio.heal();
    } else if (effect.type === 'mana') {
      this.player.mana = this.player.maxMana;
      G.Audio.orb();
    } else if (effect.type === 'paper') {
      this.nextWavePaper = 1;
      G.Audio.select();
    } else if (effect.type === 'jade') {
      this.jade += effect.value;
      G.Audio.gem();
    }
  }

  claimShopFree(i) {
    const item = G.SHOP_FREE_ITEMS[i];
    if (this.state !== 'shop' || this.shopFreeClaimed || !item) return;
    this.shopFreeClaimed = true;
    this.shopFreeChoice = item.id;
    this.applyShopEffect(item);
    G.FX.burst(this.player.x, this.player.y, 'gold', 9, 140, 10, 0.35);
    this.renderShop();
  }

  buyShopBase(i) {
    const item = G.SHOP_BASE_ITEMS[i];
    if (this.state !== 'shop' || !item) return;
    const up = G.UPG_MAP[item.effect.id];
    if (!up || (this.owned[up.id] || 0) >= up.max) return;
    const price = G.shopBasePrice(this, item);
    if (this.jade < price) { G.Audio.fizzle(); return; }
    this.jade -= price;
    this.applyUpgrade(up.id);
    G.Audio.select();
    this.renderShop();
  }

  buyShopItem(i) {
    const offer = this.shopStock[i];
    if (this.state !== 'shop' || !offer || offer.sold) return;
    if (this.jade < offer.price) { G.Audio.fizzle(); return; }
    this.jade -= offer.price;
    offer.sold = true;
    if (offer.item.activeSkill) {
      this.equipActiveSkill(offer.item.activeSkill);
    } else {
      const id = offer.item.id;
      this.shopRelics[id] = (this.shopRelics[id] || 0) + 1;
      this._itemHud = null;
      this.rebuildStats();
      this.showPendingBuildNotice();
      G.Audio.select();
    }
    this.renderShop();
  }

  leaveShop() {
    if (this.state !== 'shop') return;
    this.$('shop').classList.add('hidden');
    this.beginWave(this.wave + 1, false);
  }

  applyUpgrade(id) {
    const up = G.UPG_MAP[id];
    if (!up || (this.owned[id] || 0) >= up.max) return false;
    this.owned[id] = (this.owned[id] || 0) + 1;
    const p = this.player, oldMax = p.maxHp;
    this.rebuildStats();
    this.showPendingBuildNotice();
    if (p.maxHp > oldMax) p.hp += p.maxHp - oldMax;
    if (id === 'body') p.hp = Math.min(p.maxHp, p.hp + 25);
    return true;
  }

  collectSkillDrop(forcedId) {
    const known = G.SKILL_ORDER.filter(id => (this.skills[id] || 0) > 0);
    const upgradableKnown = known.filter(id => this.skills[id] < G.SKILLS[id].max);
    const slotsFull = known.length >= this.skillSlotLimit();
    let candidate = forcedId || null;
    if (candidate && !this.skills[candidate] && slotsFull)
      candidate = G.util.pick(upgradableKnown);
    if (!candidate)
      candidate = slotsFull ? G.util.pick(upgradableKnown) : G.rollSkill(this.skills, this);
    const candidateDef = candidate && G.SKILLS[candidate];
    const canLearn = candidateDef && ((this.skills[candidate] || 0) > 0 ||
      this.skillSlotCount() < this.skillSlotLimit());
    const id = canLearn && (this.skills[candidate] || 0) < candidateDef.max ? candidate : null;
    const def = id && candidateDef;
    if (def) {
      const lv = (this.skills[id] || 0) + 1;
      this.skills[id] = lv;
      this.rebuildStats();
      const buildNotice = this.consumeBuildNotice();
      G.FX.banner((lv === def.max ? def.name + ' ・ 神 通 开 眼' :
        (lv === 1 ? def.name + ' ・ 修得' : def.name + ' ・ Lv.' + lv)) +
        (buildNotice ? ' ・ ' + buildNotice : ''));
      if (lv === def.max) {
        G.FX.flash(0.2, '#fff1b8');
        G.FX.ring(this.player.x, this.player.y, 128, 'gold', 7, 0.65, 24);
        G.FX.papers(this.player.x, this.player.y, 12);
      }
    } else {
      this.jade += 20;
      G.FX.banner('秘 印 盈 满 ・ 化 灵 玉 二 十');
    }
    G.Audio.skillGet();
    G.FX.burst(this.player.x, this.player.y, 'purple', 16, 220, 14, 0.5);
    G.FX.ring(this.player.x, this.player.y, 90, 'purple', 4, 0.5);
    this.refreshHud();
  }

  // ============ 主更新 ============
  update(rdt) {
    const In = G.Input;
    if (In.pressed('KeyM')) { const m = G.Audio.toggleMute(); G.FX.banner(m ? '静音' : '声音开启'); }
    if (this.state === 'play' && In.pressed('Escape')) this.togglePause();
    else if (this.state === 'paused' && In.pressed('Escape')) this.resume();

    if (this.state === 'paused') { G.Audio.update(rdt); return; }

    if (this.state === 'waveclear') {
      this.waveClearT -= rdt;
      this.updateCamera(rdt);
      G.Scene.update(rdt * 0.35);
      G.FX.update(rdt * 0.35, rdt, this.player);
      G.Audio.update(rdt);
      if (this.waveClearT <= 0) this.completeWaveTransition();
      return;
    }

    if (this.state === 'levelup' || this.state === 'shop' || this.state === 'weapon' ||
      this.state === 'itemreward' || this.state === 'fate' || this.state === 'title' ||
      this.state === 'over' || this.state === 'win') {
      this.updateCamera(rdt);
      G.Scene.update(rdt * 0.5);
      G.FX.update(rdt * 0.5, rdt, this.player);
      G.Audio.update(rdt);
      return;
    }
    if (this.state !== 'play') return;

    if (In.pressed('Digit1')) this.switchWeapon(0);
    if (In.pressed('Digit2')) this.switchWeapon(1);

    if (this.mirrorCd > 0) this.mirrorCd = Math.max(0, this.mirrorCd - rdt);
    if (this.swapRelicCd > 0) this.swapRelicCd = Math.max(0, this.swapRelicCd - rdt);
    if (this.umbrellaCd > 0) this.umbrellaCd = Math.max(0, this.umbrellaCd - rdt);
    if (this.manaSealT > 0) this.manaSealT = Math.max(0, this.manaSealT - rdt);
    if (this.renewalCd > 0) this.renewalCd = Math.max(0, this.renewalCd - rdt);
    if (this.activeCooldown > 0) this.activeCooldown = Math.max(0, this.activeCooldown - rdt);
    if (this.activeEmpowerT > 0 && !this.planEmpowered) this.activeEmpowerT = Math.max(0, this.activeEmpowerT - rdt);
    this.updateFate(rdt);

    // 顿帧
    if (this.hitstop > 0) {
      this.hitstop -= rdt;
      G.FX.update(0, rdt, this.player);
      G.Input.endFrame();
      return;
    }
    // 时间缩放趋近
    this.timeScale = G.util.lerp(this.timeScale, this.timeTarget, 1 - Math.pow(0.00005, rdt));
    const dt = rdt * this.timeScale;
    this.time += dt;
    this.waveTime += dt;

    const p = this.player;

    // ---- 主动术式 ----
    if (In.mouse.rD) this.useActiveSkill();

    // ---- 画线输入 ----
    if (In.mouse.jD && p.state === 'move' && !this.planning) {
      if (p.mana >= this.attackCost()) this.beginPlan();
      else {
        G.Audio.fizzle();
        G.FX.text(p.x, p.y - 30, '神力不足', { size: 15, color: '#ff9a8a' });
        this.$('manaFill').style.filter = 'brightness(2)';
        setTimeout(() => this.$('manaFill').style.filter = '', 180);
      }
    }
    if (this.planning) {
      if (In.mouse.down) {
        const pointer = this.pointerWorld();
        this.addTrailPoint(pointer.x, pointer.y);
      }
      else this.releasePlan();
    }
    if (this.planning) {
      this.lockRecalcT -= rdt;
      if (this.lockRecalcT <= 0) {
        this.recomputeLocks();
        this.lockRecalcT = 1 / 30;
      }
    }

    // ---- 实体更新 ----
    p.update(dt, this);
    if (p.state === 'dash') this.updateDash(rdt);
    else if (p.state === 'fin') this.updateFin(rdt);

    for (const e of this.enemies) e.update(dt, this);
    if (this.boss) this.boss.update(dt, this);
    this.updateActiveVacuum(dt);
    this.updateBossCurses(dt);
    for (const link of this.soulLinks) {
      if (link.pulse > 0) link.pulse = Math.max(0, link.pulse - dt);
      if (!link.active || link.a.dead || link.b.dead) {
        link.active = false;
        if (link.a.soulLink === link) link.a.soulLink = null;
        if (link.b.soulLink === link) link.b.soulLink = null;
      }
    }
    for (const b of this.bullets) b.update(dt);
    for (const g of this.gems) g.update(dt, this);
    for (const pk of this.pickups) pk.update(dt, this);
    for (const f of this.foxfires) f.update(dt, this);
    for (const z of this.zones) z.update(dt, this);
    if (this.chainPull) this.updateChainPull(rdt);

    // 符札引爆
    for (const o of this.ofudaList) {
      o.t -= dt;
      if (o.t <= 0) this.explodeOfuda(o.e);
    }
    this.ofudaList = this.ofudaList.filter(o => o.t > 0 && !o.e.dead);

    // 回响残影
    for (const r of this.echoRunners) this.updateEcho(r, rdt);
    this.echoRunners = this.echoRunners.filter(r => !r.done);

    // 简易分离
    const es = this.enemies;
    for (let i = 0; i < es.length; i++) {
      const a = es[i];
      if (a.dead || a.pinned) continue;
      for (let j = i + 1; j < es.length; j++) {
        const b = es[j];
        if (b.dead || b.pinned) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const d2 = dx * dx + dy * dy, md = (a.r + b.r) * 0.8;
        if (d2 < md * md && d2 > 0.01) {
          const d = Math.sqrt(d2), push = (md - d) / d * 26 * dt;
          a.x -= dx * push; a.y -= dy * push;
          b.x += dx * push; b.y += dy * push;
        }
      }
    }
    // 所有位移、冲撞和分离结算后统一收回庭院，避免单位被击退到天空或树林。
    for (const e of es) {
      if (e.dead) continue;
      const bounded = G.util.fieldClamp(e.x, e.y, (e.r || 20) + 10);
      e.x = bounded.x;
      e.y = bounded.y;
    }
    if (this.boss && !this.boss.dead) {
      const bounded = G.util.fieldClamp(this.boss.x, this.boss.y, this.boss.r + 22);
      this.boss.x = bounded.x;
      this.boss.y = bounded.y;
    }

    // ---- 碰撞：玩家受伤 ----
    if (p.iTime <= 0 && (p.state === 'move' || p.state === 'plan')) {
      for (const e of es) {
        if (e.dead || e.spawnT > 0.2) continue;
        const rr = e.r + p.r - 3;
        if (G.util.dist2(e.x, e.y, p.x, p.y) < rr * rr) { this.hurtPlayer(e.dmg, e.x, e.y); e.kx -= (p.x - e.x) * 4; e.ky -= (p.y - e.y) * 4; break; }
      }
      if (p.iTime <= 0 && this.boss && !this.boss.dead && this.boss.spawnT <= 0) {
        const rr = this.boss.r * 0.8 + p.r;
        if (G.util.dist2(this.boss.x, this.boss.y, p.x, p.y) < rr * rr) this.hurtPlayer(this.boss.dmg, this.boss.x, this.boss.y);
      }
      if (p.iTime <= 0) {
        for (const b of this.bullets) {
          if (b.dead) continue;
          const rr = b.r + p.r - 2;
          if (G.util.dist2(b.x, b.y, p.x, p.y) < rr * rr) { b.dead = true; this.hurtPlayer(b.dmg, b.x, b.y); break; }
        }
      }
    }

    // ---- 延时队列（链雷等） ----
    for (const dl of this.delayed) {
      dl.t -= dl.real ? rdt : dt;
      if (dl.t <= 0) dl.fn();
    }
    this.delayed = this.delayed.filter(dl => dl.t > 0);

    // ---- 清理 ----
    this.enemies = es.filter(e => !e.dead);
    this.bullets = this.bullets.filter(b => !b.dead);
    this.gems = this.gems.filter(g => !g.dead);
    this.pickups = this.pickups.filter(k => !k.dead);
    this.foxfires = this.foxfires.filter(f => !f.dead);
    this.zones = this.zones.filter(z => !z.dead);
    this.soulLinks = this.soulLinks.filter(link => link.active);

    // ---- 生成导演 ----
    this.director(dt);

    // ---- 关卡结算：所有关卡均严格按时结束；Boss 未击杀也不再进入无限加时 ----
    if (this.state === 'play' && this.waveTime >= this.waveDuration) {
      const resolvingAttack = this.planning || p.state === 'dash' || p.state === 'fin' ||
        !!this.dash || this.pendingPurify > 0 || !!this.chainPull;
      if (resolvingAttack) this.waveFinishPending = true;
      else this.finishWave();
    }

    // ---- 升级 ----
    if (this.state === 'play' && this.pendingLevels > 0 && p.state === 'move' && !this.planning && this.overT <= 0 && this.winT <= 0) this.openLevelUp();

    // ---- 死亡/胜利延时 ----
    if (this.overT > 0) {
      this.overT -= rdt;
      if (this.overT <= 0) this.showGameOver();
    }
    if (this.winT > 0) {
      this.winT -= rdt;
      if (this.winT <= 0) this.showVictory();
    }

    // 轨迹淡出
    if (this.trailFade) {
      this.trailFade.t -= rdt * 2.2;
      if (this.trailFade.t <= 0) this.trailFade = null;
    }
    if (this.comboFadeT > 0) {
      this.comboFadeT -= rdt;
      if (this.comboFadeT <= 0) this.$('comboText').textContent = '';
    }

    this.updateCamera(rdt);
    G.Scene.update(dt);
    G.FX.update(dt, rdt, p);
    G.Audio.update(rdt);
    this.refreshHud();
  }

  // ============ 规划 ============
  beginPlan() {
    const p = this.player;
    this.planEmpowered = this.activeEmpowerT > 0;
    if (this.planEmpowered) this.activeEmpowerT = 0;
    this.planning = true;
    p.state = 'plan';
    this.trail = [{ x: p.x, y: p.y }];
    this.trailCum = [0]; this.trailLen = 0;
    this.locks = [];
    this.currentForm = null;
    this.lockRecalcT = 0;
    this.timeTarget = 0.12;
    this.$('planVig').style.opacity = 1;
    const formHud = this.$('formHud');
    if (formHud) formHud.classList.add('active');
    G.FX.ring(p.x, p.y + 14, 46, 'cyan', 2.5, 0.4);
    G.Audio.tone({ f: 880, f2: 1180, dur: 0.22, type: 'sine', vol: 0.08 });
  }
  trailLimit() {
    const tide = this.fateId === 'moonTide' && this.moonTideWindow > 0;
    // 高连祷的交叉星轨天然更长。事件存在时临时放宽绘制上限，
    // 使九点连祷在零轨迹强化的开局也能由一笔完成。
    const spiritMul = this.spiritTrial && this.spiritNodes.length
      ? this.spiritTrial.trailBonus : 1;
    return this.player.stats.trailLen * (this.activeWeapon().trailMul || 1) *
      (this.planEmpowered ? 1.4 : 1) * (tide ? 1.25 : 1) * spiritMul;
  }
  weaponPathData() {
    const weapon = this.activeWeapon();
    const src = this.trail;
    if (!src.length) return { pts: [], cum: [], L: 0, weapon: weapon.id };
    if (weapon.path === 'line') {
      const a = src[0], b = src[src.length - 1];
      const L = G.util.dist(a.x, a.y, b.x, b.y);
      return {
        pts: [{ x: a.x, y: a.y }, { x: b.x, y: b.y }],
        cum: [0, L], L, weapon: weapon.id
      };
    }
    return {
      pts: src.map(p => ({ x: p.x, y: p.y })),
      cum: this.trailCum.slice(),
      L: this.trailLen,
      weapon: weapon.id
    };
  }

  pathPointAt(pathData, s) {
    const tr = pathData.pts, cum = pathData.cum;
    if (!tr.length) return { x: this.player.x, y: this.player.y, ang: 0, s: 0 };
    if (tr.length === 1) return { x: tr[0].x, y: tr[0].y, ang: 0, s: 0 };
    s = G.util.clamp(s, 0, pathData.L);
    let i = 1;
    while (i < cum.length - 1 && cum[i] < s) i++;
    const segLen = cum[i] - cum[i - 1] || 1;
    const t = G.util.clamp((s - cum[i - 1]) / segLen, 0, 1);
    const a = tr[i - 1], b = tr[i];
    return {
      x: G.util.lerp(a.x, b.x, t),
      y: G.util.lerp(a.y, b.y, t),
      ang: Math.atan2(b.y - a.y, b.x - a.x),
      s
    };
  }

  segmentIntersection(a, b, c, d, edgeEpsilon) {
    const abx = b.x - a.x, aby = b.y - a.y;
    const cdx = d.x - c.x, cdy = d.y - c.y;
    const den = abx * cdy - aby * cdx;
    if (Math.abs(den) < 0.0001) return null;
    const acx = c.x - a.x, acy = c.y - a.y;
    const t = (acx * cdy - acy * cdx) / den;
    const u = (acx * aby - acy * abx) / den;
    const edge = edgeEpsilon == null ? 0.06 : edgeEpsilon;
    if (t <= edge || t >= 1 - edge || u <= edge || u >= 1 - edge) return null;
    return { x: a.x + abx * t, y: a.y + aby * t, t, u };
  }

  gesturePathData() {
    const pts = this.trail.map(p => ({ x: p.x, y: p.y }));
    const cum = [];
    let L = 0;
    for (let i = 0; i < pts.length; i++) {
      if (i) L += G.util.dist(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
      cum.push(L);
    }
    return { pts, cum, L, weapon: this.activeWeapon().id, gesture: true };
  }

  samplePath(pathData, step) {
    const out = [];
    if (!pathData || !pathData.pts.length) return out;
    step = step || 34;
    for (let s = 0; s < pathData.L; s += step) out.push(this.pathPointAt(pathData, s));
    out.push(this.pathPointAt(pathData, pathData.L));
    return out;
  }

  trajectoryFormPower(weaponId, formId) {
    const weapon = G.WEAPONS[weaponId] || this.activeWeapon();
    const focus = weapon.formFocus || {};
    let power = focus[formId] || focus.all || 1;
    for (const id of (G.BUILD_ORDER || [])) {
      const state = this.buildState[id];
      if (state && state.tier && state.def.forms.includes(formId))
        power += state.tier * 0.14;
    }
    return power;
  }

  analyzeTrajectory(pathData) {
    const empty = {
      id: 'line', ready: false, progress: 0, score: 0, straightness: 0,
      turns: [], crosses: [], retraceRatio: 0, winding: 0, center: null
    };
    if (!pathData || pathData.pts.length < 2 || pathData.L < 20) return empty;
    const sample = this.samplePath(pathData, 32);
    const first = pathData.pts[0], last = pathData.pts[pathData.pts.length - 1];
    const direct = G.util.dist(first.x, first.y, last.x, last.y);
    const straightness = direct / Math.max(1, pathData.L);
    const item = this.pathItemAnalysis(pathData);
    let cx = 0, cy = 0;
    for (const p of sample) { cx += p.x; cy += p.y; }
    cx /= sample.length; cy /= sample.length;
    let winding = 0, minR = Infinity, maxR = 0;
    for (let i = 0; i < sample.length; i++) {
      const r = G.util.dist(cx, cy, sample[i].x, sample[i].y);
      minR = Math.min(minR, r); maxR = Math.max(maxR, r);
      if (!i) continue;
      let da = Math.atan2(sample[i].y - cy, sample[i].x - cx) -
        Math.atan2(sample[i - 1].y - cy, sample[i - 1].x - cx);
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      winding += da;
    }
    winding /= Math.PI * 2;

    let retraceMatches = 0;
    const retracePoints = [];
    for (let i = 4; i < sample.length; i++) {
      for (let j = 0; j <= i - 4; j++) {
        if (sample[i].s - sample[j].s < 125) continue;
        let da = Math.abs(sample[i].ang - sample[j].ang);
        if (da > Math.PI) da = Math.PI * 2 - da;
        if (G.util.dist2(sample[i].x, sample[i].y, sample[j].x, sample[j].y) <= 34 * 34 &&
          da >= 1.95) {
          retraceMatches++;
          retracePoints.push({ x: sample[i].x, y: sample[i].y, s: sample[i].s });
          break;
        }
      }
    }
    const retraceRatio = retraceMatches / Math.max(1, sample.length - 4);
    let area = 0;
    for (let i = 0, j = pathData.pts.length - 1; i < pathData.pts.length; j = i++)
      area += pathData.pts[j].x * pathData.pts[i].y - pathData.pts[i].x * pathData.pts[j].y;
    area = Math.abs(area) * 0.5;
    const closeDist = direct;
    const radialSpan = maxR - minR;
    const L = pathData.L;
    const candidates = [
      {
        id: 'loop', ready: L >= 300 && closeDist <= 110 && area >= 7000,
        progress: Math.min(1, L / 300) * G.util.clamp(1 - closeDist / 155, 0, 1),
        score: 1.22 + Math.min(0.35, area / 80000)
      },
      {
        id: 'knot', ready: L >= 300 && item.crosses.length > 0,
        progress: Math.min(1, L / 300) * Math.min(1, item.crosses.length),
        score: 1.18 + Math.min(0.32, item.crosses.length * 0.12)
      },
      {
        id: 'retrace', ready: L >= 300 && retraceRatio >= 0.18,
        progress: Math.min(1, L / 300) * G.util.clamp(retraceRatio / 0.18, 0, 1),
        score: 1.14 + Math.min(0.3, retraceRatio)
      },
      {
        id: 'spiral', ready: L >= 420 && Math.abs(winding) >= 0.72 && radialSpan >= 55 &&
          !(closeDist <= 110 && area >= 7000),
        progress: Math.min(1, L / 420) * G.util.clamp(Math.abs(winding) / 0.72, 0, 1) *
          G.util.clamp(radialSpan / 55, 0, 1),
        score: 1.1 + Math.min(0.3, Math.abs(winding) * 0.12)
      },
      {
        id: 'zigzag', ready: L >= 300 && item.turns.length >= 3,
        progress: Math.min(1, L / 300) * G.util.clamp(item.turns.length / 3, 0, 1),
        score: 1.04 + Math.min(0.3, item.turns.length * 0.06)
      },
      {
        id: 'line', ready: L >= 230 && straightness >= 0.87,
        progress: Math.min(1, L / 230) * G.util.clamp((straightness - 0.68) / 0.19, 0, 1),
        score: 1 + Math.min(0.28, (straightness - 0.87) + L / 2400)
      }
    ];
    const ready = candidates.filter(c => c.ready).sort((a, b) => b.score - a.score);
    const best = ready[0] || candidates.slice().sort((a, b) => b.progress - a.progress)[0];
    return Object.assign({}, best, {
      straightness, direct, closeDist, area, turns: item.turns, crosses: item.crosses,
      retraceRatio, retracePoints, winding, center: { x: cx, y: cy }, radialSpan,
      def: G.TRAJECTORY_FORMS[best.id]
    });
  }

  trajectoryNodeProgress(pathData) {
    const nodes = this.spiritNodes.filter(n => !n.completed);
    if (!nodes.length || !pathData || pathData.pts.length < 2)
      return { count: 0, total: nodes.length, complete: false, wrong: false, hits: [] };
    const hits = [];
    for (const node of nodes) {
      let nearest = { d: Infinity, s: 0 };
      for (let i = 0; i < pathData.pts.length - 1; i++) {
        const near = G.util.dSeg(node.x, node.y,
          pathData.pts[i].x, pathData.pts[i].y, pathData.pts[i + 1].x, pathData.pts[i + 1].y);
        if (near.d < nearest.d)
          nearest = { d: near.d, s: pathData.cum[i] + near.t * (pathData.cum[i + 1] - pathData.cum[i]) };
      }
      if (nearest.d <= node.r + (node.hitPad == null ? 10 : node.hitPad))
        hits.push({ node, s: nearest.s });
    }
    hits.sort((a, b) => a.s - b.s);
    let next = 1, wrong = false;
    for (const hit of hits) {
      if (hit.node.order === next) next++;
      else if (hit.node.order >= next) { wrong = true; break; }
    }
    return {
      count: next - 1, total: nodes.length,
      complete: !wrong && next - 1 === nodes.length,
      wrong, hits
    };
  }

  updateFormPreview(pathData, form) {
    const root = this.$('formHud');
    if (!root) return;
    const def = G.TRAJECTORY_FORMS[form.id];
    const power = this.trajectoryFormPower(this.activeWeapon().id, form.id);
    const nodes = this.trajectoryNodeProgress(pathData);
    root.classList.toggle('ready', !!form.ready);
    root.classList.toggle('focused', power > 1.25);
    root.style.setProperty('--form-color', def.color);
    this.$('formKanji').textContent = def.kanji;
    this.$('formName').textContent = form.ready ? def.name : '寻式・' + def.name;
    const pieces = [
      def.hint,
      Math.round(form.progress * 100) + '%',
      power > 1.25 ? this.activeWeapon().name + ' 专精 ×' + power.toFixed(2) : ''
    ];
    if (nodes.total) {
      const reward = this.spiritTrial && G.SPIRIT_REWARDS[this.spiritTrial.reward];
      pieces.push('连祷 ' + nodes.count + ' / ' + nodes.total +
        (reward ? '・' + reward.name : '') + (nodes.wrong ? '・次序错误' : '・一笔限定'));
    }
    this.$('formDetail').textContent = pieces.filter(Boolean).join(' ・ ');
    this.$('formProgress').style.width = Math.round(form.progress * 100) + '%';
  }

  pathCrossesLine(pathData, a, b, width) {
    width = width || 12;
    for (let i = 0; i < pathData.pts.length - 1; i++) {
      const p = pathData.pts[i], q = pathData.pts[i + 1];
      if (this.segmentIntersection(p, q, a, b)) return true;
      if (G.util.dSeg(a.x, a.y, p.x, p.y, q.x, q.y).d <= width ||
        G.util.dSeg(b.x, b.y, p.x, p.y, q.x, q.y).d <= width) return true;
    }
    return false;
  }

  pathTouchesPoint(pathData, x, y, radius) {
    for (let i = 0; i < pathData.pts.length - 1; i++)
      if (G.util.dSeg(x, y, pathData.pts[i].x, pathData.pts[i].y,
        pathData.pts[i + 1].x, pathData.pts[i + 1].y).d <= radius) return true;
    return false;
  }

  createSpiritNodes(wd) {
    this.spiritNodes = [];
    this.spiritTrial = null;
    if (!wd || wd.boss || wd.id < 3) return;
    const count = this.rollSpiritNodeCount(wd.id);
    const reward = G.util.pick(G.SPIRIT_REWARD_ORDER);
    const radius = 58 + count * 2;
    const centerAng = G.util.rand(0, Math.PI * 2);
    const center = G.util.fieldClamp(
      this.player.x + Math.cos(centerAng) * 86,
      this.player.y + Math.sin(centerAng) * 68,
      radius + 64
    );
    this.spiritNodes = this.buildSpiritNodePattern(
      count, center.x, center.y, radius, G.util.rand(0, Math.PI * 2));
    this.spiritTrial = {
      count, reward,
      trailBonus: 1.2 + Math.max(0, count - 3) * 0.22,
      skillChance: count === 8 ? 0.3 : count >= 9 ? 0.58 : 0
    };
  }

  rollSpiritNodeCount(wave) {
    const maxCount = G.util.clamp(4 + Math.floor(wave / 3), 5, 9);
    const baseWeight = { 3: 32, 4: 27, 5: 20, 6: 14, 7: 9, 8: 5, 9: 3 };
    const entries = [];
    let total = 0;
    for (let count = 3; count <= maxCount; count++) {
      const lateBoost = 1 + Math.max(0, wave - 5) * 0.035 * (count - 3);
      const weight = baseWeight[count] * lateBoost;
      entries.push({ count, weight });
      total += weight;
    }
    let roll = Math.random() * total;
    for (const entry of entries) {
      roll -= entry.weight;
      if (roll <= 0) return entry.count;
    }
    return entries[entries.length - 1].count;
  }

  buildSpiritNodePattern(count, cx, cy, radius, rotation) {
    const base = [];
    const yScale = G.util.rand(0.78, 0.94);
    for (let i = 0; i < count; i++) {
      const ang = rotation + i / count * Math.PI * 2;
      base.push({
        x: G.util.clamp(cx + Math.cos(ang) * radius, 70, G.WORLD_W - 70),
        y: G.util.clamp(cy + Math.sin(ang) * radius * yScale, 90, G.WORLD_H - 60)
      });
    }
    // 交替连接圆周的两半：四点以上会自然形成交叉星轨，
    // 又不会重复节点，仍可按清晰的 1→N 顺序一笔完成。
    const ordered = [];
    const split = Math.ceil(count / 2);
    for (let i = 0; i < split; i++) {
      ordered.push(base[i]);
      if (i + split < count) ordered.push(base[i + split]);
    }
    return ordered.map((point, i) => {
      const bounded = G.util.fieldClamp(point.x, point.y, 26);
      return {
        x: bounded.x, y: bounded.y, r: 14, hitPad: 8,
        order: i + 1, completed: false, pulse: G.util.rand(0, 6.28)
      };
    });
  }

  grantSpiritReward(trial, nodes, pathData) {
    const count = trial.count || nodes.length;
    const rewardId = trial.reward || 'power';
    const reward = G.SPIRIT_REWARDS[rewardId] || G.SPIRIT_REWARDS.power;
    const starChart = this.shopRelics.nineStarChart || 0;
    const rewardMul = 1 + starChart * 0.2;
    const amplifyBlessing = value => 1 + (value - 1) * rewardMul;
    let blessing = 1;
    let detail = '';
    if (rewardId === 'power') {
      blessing = amplifyBlessing(1.12 + count * 0.035);
      const gain = Math.round((4 + count) * rewardMul);
      this.player.mana = Math.min(this.player.maxMana, this.player.mana + gain);
      detail = '本刀 ×' + blessing.toFixed(2) + '・神力 +' + gain;
    } else if (rewardId === 'mana') {
      blessing = amplifyBlessing(1.04 + count * 0.02);
      const gain = Math.round((8 + count * 4) * rewardMul);
      this.player.mana = Math.min(this.player.maxMana, this.player.mana + gain);
      detail = '神力 +' + gain;
    } else if (rewardId === 'jade') {
      blessing = amplifyBlessing(1.03 + count * 0.012);
      const gain = this.scaledJade(Math.round((2 + count * 1.35) * rewardMul));
      this.jade += gain;
      detail = '灵玉 +' + gain;
    } else if (rewardId === 'ward') {
      blessing = amplifyBlessing(1.05 + count * 0.015);
      const heal = Math.round((5 + count * 2.5) * rewardMul);
      const shield = Math.round((3 + count * 1.6) * rewardMul);
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
      this.comboShield = Math.min(36, this.comboShield + shield);
      detail = '生命 +' + heal + '・护印 +' + shield;
    } else {
      blessing = amplifyBlessing(1.08 + count * 0.022);
      const cut = +((2 + count * 1.25) * rewardMul).toFixed(1);
      this.activeCooldown = Math.max(0, this.activeCooldown - cut);
      detail = '主动冷却 -' + cut + ' 秒';
    }
    const prayerCoin = this.shopRelics.prayerCoin || 0;
    if (count >= 5 && prayerCoin > 0) {
      const bonusJade = this.scaledJade((count - 4) * prayerCoin);
      this.jade += bonusJade;
      detail += '・星巡灵玉 +' + bonusJade;
    }
    let skillDropped = false;
    const skillChance = Math.min(1, (trial.skillChance || 0) + starChart * 0.15);
    if (count >= 8 && G.util.chance(skillChance)) {
      const last = nodes[nodes.length - 1];
      this.pickups.push(new G.Pickup(last.x, last.y - 28, 'skill'));
      skillDropped = true;
      detail += '・技能卷轴';
    }
    pathData.nodeBlessing = blessing;
    G.FX.banner(count + ' 连 祷 ・ ' + reward.name + ' ・ ' + detail);
    G.Audio.level();
    return { blessing, reward: rewardId, skillDropped, detail };
  }

  resolveSpiritSequence(pathData) {
    if (pathData._spiritResolved)
      return {
        attempted: true, complete: !!pathData._spiritComplete,
        blessing: pathData.nodeBlessing || 1
      };
    const nodes = this.spiritNodes.filter(node => !node.completed);
    if (!nodes.length) return { attempted: false, complete: false, blessing: 1 };
    const progress = this.trajectoryNodeProgress(pathData);
    const trial = this.spiritTrial || {
      count: nodes.length, reward: 'power', trailBonus: 1,
      skillChance: nodes.length === 8 ? 0.3 : nodes.length >= 9 ? 0.58 : 0
    };
    pathData._spiritResolved = true;
    if (progress.complete) {
      for (const node of nodes) {
        node.completed = true;
        G.FX.ring(node.x, node.y, 54 + nodes.length * 2, 'gold', 5, 0.55);
        G.FX.burst(node.x, node.y, 'teal', 8, 170, 11, 0.4);
      }
      const result = this.grantSpiritReward(trial, nodes, pathData);
      pathData._spiritComplete = true;
      this.spiritNodes = [];
      this.spiritTrial = null;
      return Object.assign({ attempted: true, complete: true, progress }, result);
    }
    const at = progress.hits.length ? progress.hits[0].node : nodes[0];
    for (const node of nodes) {
      G.FX.ring(node.x, node.y, 38, 'red', 2, 0.28);
      G.FX.burst(node.x, node.y, 'purple', 4, 90, 8, 0.24);
    }
    const brokenRosary = this.shopRelics.brokenRosary || 0;
    if (brokenRosary > 0 && progress.count > 0) {
      const gain = Math.min(24, Math.round(progress.count * brokenRosary * 1.5));
      this.player.mana = Math.min(this.player.maxMana, this.player.mana + gain);
      G.FX.text(this.player.x, this.player.y - 42, '断 祷 回 灵 +' + gain, {
        size: 14, color: '#d9b7ff', crit: true
      });
    }
    G.FX.text(at.x, at.y - 32,
      '连 祷 断 绝 ・ ' + progress.count + ' / ' + nodes.length,
      { size: 15, color: '#ff9a8a', crit: true });
    G.Audio.fizzle();
    this.spiritNodes = [];
    this.spiritTrial = null;
    pathData.nodeBlessing = 1;
    return { attempted: true, complete: false, blessing: 1, progress };
  }

  createSoulLink(a, b) {
    const isElite = e => e && (e.type === 'elite' || /Elite$/.test(e.type || ''));
    if (!a || !b || a === b || isElite(a) || isElite(b)) return null;
    const link = { a, b, active: true, pulse: 0, born: this.time };
    a.soulLink = link; b.soulLink = link;
    this.soulLinks.push(link);
    return link;
  }

  trajectoryHasInteraction(pathData, form) {
    if (form && form.ready) return true;
    if (pathData && pathData._spiritComplete) return true;
    if (this.trajectoryNodeProgress(pathData).complete) return true;
    if (this.soulLinks.some(link => link.active &&
      this.pathCrossesLine(pathData, link.a, link.b, 14))) return true;
    if (this.bullets.some(b => !b.dead && this.pathTouchesPoint(pathData, b.x, b.y, b.r + 10))) return true;
    return this.bossCurses.some(c => !c.dead && this.trajectorySolvesCurse(pathData, form, c));
  }

  trajectorySolvesCurse(pathData, form, curse) {
    if (curse.kind === 'cut') return this.pathCrossesLine(pathData, curse.a, curse.b, 15);
    if (curse.kind === 'seal') return !!(form && form.ready && form.id === 'loop' &&
      this.pointInTrail(curse.x, curse.y, pathData.pts));
    return this.pathTouchesPoint(pathData, curse.x, curse.y, curse.r);
  }

  resolveTrajectoryInteractions(pathData, form) {
    let cutLinks = 0;
    for (const link of this.soulLinks) {
      if (!link.active || !this.pathCrossesLine(pathData, link.a, link.b, 14)) continue;
      link.active = false;
      link.a.soulLink = null; link.b.soulLink = null;
      link.a.vulnT = Math.max(link.a.vulnT || 0, 2);
      link.b.vulnT = Math.max(link.b.vulnT || 0, 2);
      G.FX.burst((link.a.x + link.b.x) / 2, (link.a.y + link.b.y) / 2, 'red', 18, 260, 13, 0.48);
      G.FX.bolt(link.a.x, link.a.y, link.b.x, link.b.y, { w: 6, life: 0.22 });
      cutLinks++;
    }
    if (cutLinks) {
      G.FX.banner('共 生 祟 线 ・ 斩 断 ×' + cutLinks);
      G.Audio.finisher();
    }

    let cutBullets = 0;
    for (const bullet of this.bullets) {
      if (bullet.dead || !this.pathTouchesPoint(pathData, bullet.x, bullet.y, bullet.r + 10)) continue;
      bullet.dead = true; cutBullets++;
      G.FX.burst(bullet.x, bullet.y, 'cyan', 5, 130, 9, 0.28);
      this.onTrajectoryBulletCut(bullet.x, bullet.y);
    }
    if (cutBullets) {
      const gain = Math.min(4, cutBullets * 0.35);
      this.player.mana = Math.min(this.player.maxMana, this.player.mana + gain);
      G.FX.text(this.player.x, this.player.y - 38, '断 弹 ×' + cutBullets + '  +' +
        gain.toFixed(1) + ' 神', { size: 14, color: '#aeeeff' });
    }

    const nodeResult = this.resolveSpiritSequence(pathData);
    const blessing = nodeResult.blessing || pathData.nodeBlessing || 1;

    for (const curse of this.bossCurses) {
      if (curse.dead || !this.trajectorySolvesCurse(pathData, form, curse)) continue;
      curse.dead = true;
      if (this.boss) {
        this.boss.staggerT = Math.max(this.boss.staggerT, 0.9);
        this.boss.vulnT = Math.max(this.boss.vulnT || 0, 2.4);
      }
      const x = curse.x == null ? (curse.a.x + curse.b.x) / 2 : curse.x;
      const y = curse.y == null ? (curse.a.y + curse.b.y) / 2 : curse.y;
      G.FX.ring(x, y, 120, 'gold', 7, 0.55);
      G.FX.burst(x, y, 'gold', 22, 280, 14, 0.5);
      G.FX.banner('祟 纹 逆 解 ・ 祟 主 失 衡');
      G.Audio.finisher();
    }
    pathData.nodeBlessing = blessing;
    return { cutLinks, cutBullets, blessing };
  }

  triggerBossSignature(boss) {
    if (!boss || boss.dead || this.state !== 'play') return;
    if (boss.variant === 'tengu') {
      const a = this.spawnBossCurse(boss, 'cut', true);
      const b = this.spawnBossCurse(boss, 'cut', true);
      if (a || b) {
        G.FX.banner('大 天 狗 权 能 ・ 风 切 双 门');
        G.FX.shake(7, 0.3);
        G.Audio.warn();
      }
      return;
    }
    if (boss.variant === 'oni') {
      const mark = { x: this.player.x, y: this.player.y };
      const delay = boss.enraged ? 0.62 : 0.82;
      G.FX.ring(mark.x, mark.y, 155, 'red', 8, delay);
      G.FX.banner('酒 吞 权 能 ・ 鬼 宴 地 鸣');
      G.Audio.warn();
      this.delayed.push({
        t: delay, real: true,
        fn: () => {
          if (this.state !== 'play' || this.boss !== boss || boss.dead) return;
          if (G.util.dist(this.player.x, this.player.y, mark.x, mark.y) < 150)
            this.hurtPlayer(Math.round(boss.dmg * 0.82), mark.x, mark.y);
          const count = boss.enraged ? 18 : 14;
          for (let i = 0; i < count; i++)
            this.spawnBullet(mark.x, mark.y, i / count * Math.PI * 2,
              boss.enraged ? 178 : 158, boss.projectileDmg);
          G.FX.ring(mark.x, mark.y, 205, 'red', 8, 0.5);
          G.FX.burst(mark.x, mark.y, 'red', 28, 320, 16, 0.55);
          G.FX.shake(13, 0.42);
          G.Audio.finisher();
        }
      });
      return;
    }
    if (boss.variant === 'fox') {
      const summons = [];
      for (let i = 0; i < 4; i++) {
        const ang = i / 4 * Math.PI * 2 + boss.animT * 0.2;
        summons.push(this.spawnEnemy('moth',
          G.util.clamp(boss.x + Math.cos(ang) * 150, 54, G.WORLD_W - 54),
          G.util.clamp(boss.y + Math.sin(ang) * 125, 76, G.WORLD_H - 48)));
      }
      this.createSoulLink(summons[0], summons[2]);
      this.createSoulLink(summons[1], summons[3]);
      G.FX.ring(boss.x, boss.y, 185, 'gold', 6, 0.7);
      G.FX.banner('玉 藻 权 能 ・ 四 狐 连 契');
      G.Audio.warn();
      return;
    }
    const secondKind = boss.signatureCount % 2 ? 'seal' : 'cover';
    const a = this.spawnBossCurse(boss, 'cut', true);
    const b = this.spawnBossCurse(boss, secondKind, true);
    if (a || b) {
      G.FX.banner('黄 泉 权 能 ・ 万 象 双 咒');
      G.FX.flash(0.18, '#ba72ff');
      G.Audio.warn();
    }
  }

  spawnBossCurse(boss, forcedKind, silent) {
    if (!boss || boss.dead || this.bossCurses.filter(c => !c.dead).length >= 2) return null;
    let kind = forcedKind || (boss.variant === 'tengu' ? 'cut' :
      boss.variant === 'oni' ? 'cover' :
        boss.variant === 'fox' ? 'seal' : G.util.pick(['cut', 'seal', 'cover']));
    const px = G.util.clamp(this.player.x + G.util.rand(-130, 130), 180, G.WORLD_W - 180);
    const py = G.util.clamp(this.player.y + G.util.rand(-100, 100), 180, G.WORLD_H - 140);
    const curse = { kind, x: px, y: py, r: kind === 'cover' ? 48 : 58, t: 6, maxT: 6, dead: false };
    if (kind === 'cut') {
      const ang = G.util.rand(0, Math.PI), len = 330;
      curse.a = { x: px - Math.cos(ang) * len / 2, y: py - Math.sin(ang) * len / 2 };
      curse.b = { x: px + Math.cos(ang) * len / 2, y: py + Math.sin(ang) * len / 2 };
    }
    this.bossCurses.push(curse);
    const labels = { cut: '截 断 赤 裂', seal: '闭 环 镇 核', cover: '覆 轨 祟 眼' };
    if (!silent) {
      G.FX.banner('祟 纹 显 现 ・ ' + labels[kind]);
      G.Audio.warn();
    }
    return curse;
  }

  updateBossCurses(dt) {
    for (const curse of this.bossCurses) {
      if (curse.dead) continue;
      curse.t -= dt;
      if (curse.t > 0) continue;
      curse.dead = true;
      const count = curse.kind === 'seal' ? 14 : 10;
      for (let i = 0; i < count; i++)
        this.spawnBullet(curse.x, curse.y, i / count * Math.PI * 2 + this.time * 0.2,
          curse.kind === 'cover' ? 175 : 145,
          Math.round((this.boss ? this.boss.projectileDmg : 12) * 1.08));
      if (curse.kind === 'cover') this.manaSealT = Math.max(this.manaSealT, 2.4);
      G.FX.ring(curse.x, curse.y, 150, 'red', 7, 0.55);
      G.FX.burst(curse.x, curse.y, 'red', 24, 300, 15, 0.52);
      G.FX.shake(8, 0.28);
      G.Audio.finisher();
    }
    this.bossCurses = this.bossCurses.filter(c => !c.dead);
  }

  pathItemAnalysis(pathData) {
    if (pathData._itemAnalysis) return pathData._itemAnalysis;
    const sample = [];
    const step = 42;
    for (let s = 0; s < pathData.L; s += step) sample.push(this.pathPointAt(pathData, s));
    sample.push(this.pathPointAt(pathData, pathData.L));

    const turns = [];
    let lastTurnS = -999;
    for (let i = 1; i < sample.length - 1; i++) {
      const a0 = G.util.angTo(sample[i - 1].x, sample[i - 1].y, sample[i].x, sample[i].y);
      const a1 = G.util.angTo(sample[i].x, sample[i].y, sample[i + 1].x, sample[i + 1].y);
      let da = Math.abs(a1 - a0);
      if (da > Math.PI) da = Math.PI * 2 - da;
      if (da >= 0.96 && sample[i].s - lastTurnS >= 72) {
        turns.push({ type: 'turn', x: sample[i].x, y: sample[i].y, s: sample[i].s, ang: a1 });
        lastTurnS = sample[i].s;
      }
    }

    const crosses = [];
    for (let i = 0; i < sample.length - 1; i++) {
      for (let j = i + 2; j < sample.length - 1; j++) {
        if (i === 0 && j === sample.length - 2) continue;
        // 自交点恰好落在采样点上也属于有效的“结”；相邻线段已在上方跳过，
        // 因此这里可以接受非相邻线段的端点相交。
        const hit = this.segmentIntersection(sample[i], sample[i + 1], sample[j], sample[j + 1], -0.001);
        if (!hit || crosses.some(p => G.util.dist2(p.x, p.y, hit.x, hit.y) < 58 * 58)) continue;
        crosses.push({
          type: 'cross', x: hit.x, y: hit.y,
          s: G.util.lerp(sample[j].s, sample[j + 1].s, hit.u),
          ang: G.util.angTo(sample[j].x, sample[j].y, sample[j + 1].x, sample[j + 1].y)
        });
      }
    }

    const first = pathData.pts[0], last = pathData.pts[pathData.pts.length - 1];
    const closed = pathData.L >= 280 && G.util.dist(first.x, first.y, last.x, last.y) <= 92;
    pathData._itemAnalysis = { turns, crosses, closed };
    return pathData._itemAnalysis;
  }

  preparePathItemEvents(pathData) {
    const held = this.shopRelics;
    const analysis = this.pathItemAnalysis(pathData);
    const events = [];
    if (held.startBell) {
      const p = this.pathPointAt(pathData, 0);
      events.push({ type: 'start', x: p.x, y: p.y, s: 0, ang: p.ang });
    }
    if (held.turnCrane) events.push(...analysis.turns.slice(0, 5));
    if (held.crossMirror) events.push(...analysis.crosses.slice(0, 1 + held.crossMirror));
    if (held.endSeal) {
      const p = this.pathPointAt(pathData, pathData.L);
      events.push({ type: 'end', x: p.x, y: p.y, s: pathData.L, ang: p.ang });
    }
    events.sort((a, b) => a.s - b.s);
    return events;
  }

  pathItemsCanAttack(pathData) {
    const analysis = this.pathItemAnalysis(pathData);
    return !!(
      this.shopRelics.startBell ||
      this.shopRelics.endSeal ||
      (this.shopRelics.turnCrane && analysis.turns.length) ||
      (this.shopRelics.crossMirror && analysis.crosses.length) ||
      (this.shopRelics.closedRope && analysis.closed)
    );
  }

  itemBurst(x, y, radius, dmg, color, label) {
    color = color || 'gold';
    G.FX.ring(x, y, radius, color, 4, 0.38);
    G.FX.burst(x, y, color, 12, 240, 12, 0.42);
    if (label) G.FX.text(x, y - 28, label, { size: 18, color: '#ffe2a0', crit: true });
    for (const e of this.enemies.slice()) {
      if (!e.dead && G.util.dist2(x, y, e.x, e.y) <= (radius + e.r) * (radius + e.r))
        this.hurtEnemy(e, dmg, {});
    }
    if (this.boss && !this.boss.dead &&
      G.util.dist2(x, y, this.boss.x, this.boss.y) <= (radius + this.boss.r) * (radius + this.boss.r))
      this.hurtBoss(dmg * 0.65, {});
  }

  activatePathItemEvent(ev) {
    const s = this.player.stats, held = this.shopRelics;
    if (ev.type === 'turn' && held.turnCrane) {
      const lv = held.turnCrane;
      this.itemBurst(ev.x, ev.y, 58 + lv * 5, s.dmg * this.permDmg * 0.32 * lv, 'teal', '折');
      G.FX.slash(ev.x, ev.y, ev.ang, 110 + lv * 14, 'teal');
    } else if (ev.type === 'cross' && held.crossMirror) {
      const lv = held.crossMirror;
      this.itemBurst(ev.x, ev.y, 82 + lv * 10, s.dmg * this.permDmg * 0.62 * lv, 'purple', '交');
      G.FX.shake(4 + lv, 0.16);
    } else if (ev.type === 'start' && held.startBell) {
      const lv = held.startBell;
      this.itemBurst(ev.x, ev.y, 68 + lv * 9, s.dmg * this.permDmg * 0.3 * lv, 'gold', '始');
      G.Audio.tone({ f: 720, f2: 1040, dur: 0.12, type: 'sine', vol: 0.05 });
    } else if (ev.type === 'end' && held.endSeal) {
      const lv = held.endSeal;
      this.itemBurst(ev.x, ev.y, 76 + lv * 10, s.dmg * this.permDmg * 0.42 * lv, 'red', '終');
      G.FX.shake(3 + lv, 0.14);
    }
  }

  triggerClosedPathItem(pathData) {
    const lv = this.shopRelics.closedRope || 0;
    const analysis = this.pathItemAnalysis(pathData);
    if (!lv || !analysis.closed) return;
    let cx = 0, cy = 0;
    for (const p of pathData.pts) { cx += p.x; cy += p.y; }
    cx /= pathData.pts.length; cy /= pathData.pts.length;
    const targets = this.enemies.filter(e => !e.dead && this.pointInTrail(e.x, e.y, pathData.pts));
    for (const e of targets) {
      const a = G.util.angTo(e.x, e.y, cx, cy);
      e.kx += Math.cos(a) * 430; e.ky += Math.sin(a) * 430;
      e.freezeT = Math.max(e.freezeT, 0.38);
      this.hurtEnemy(e, this.player.stats.dmg * this.permDmg * 0.42, {});
    }
    if (this.boss && !this.boss.dead && this.pointInTrail(this.boss.x, this.boss.y, pathData.pts))
      this.hurtBoss(this.player.stats.dmg * this.permDmg * 0.28, {});
    G.FX.ring(cx, cy, 150, 'gold', 7, 0.5);
    G.FX.burst(cx, cy, 'purple', 24, 330, 15, 0.55);
    G.FX.text(cx, cy - 46, '封 界', { size: 22, color: '#ffe2a0', crit: true });
    if (targets.length) G.FX.shake(8, 0.25);
  }

  addTrailPoint(mx, my) {
    const p = this.player, s = p.stats;
    const limit = this.trailLimit();
    const bounded = G.util.fieldClamp(mx, my, p.r + 18);
    mx = bounded.x;
    my = bounded.y;
    const last = this.trail[this.trail.length - 1];
    let dx = mx - last.x, dy = my - last.y;
    let d = Math.hypot(dx, dy);
    if (d < 7) return;
    if (this.trailLen + d > limit) {
      const k = (limit - this.trailLen) / d;
      mx = last.x + dx * k; my = last.y + dy * k;
      d = limit - this.trailLen;
      if (d <= 0.5) return;
      G.FX.glow(mx, my, 'cyan', 14, 0.3);
    }
    this.trail.push({ x: mx, y: my });
    this.trailLen += d;
    this.trailCum.push(this.trailLen);
  }
  // 轨迹最近点
  trailNearest(x, y) {
    let best = { d: 1e9, s: 0 };
    const tr = this.trail, cum = this.trailCum;
    for (let i = 0; i < tr.length - 1; i++) {
      const r = G.util.dSeg(x, y, tr[i].x, tr[i].y, tr[i + 1].x, tr[i + 1].y);
      if (r.d < best.d) {
        const seg = cum[i + 1] - cum[i];
        best = { d: r.d, s: cum[i] + r.t * seg, cx: r.cx, cy: r.cy };
      }
    }
    return best;
  }
  // 将轨迹每次独立穿过目标索敌圈的过程记录为一次命中。
  // 必须先离开索敌圈并沿轨迹前进足够距离，才允许再次锁定，避免边缘抖动刷次数。
  trailPasses(x, y, radius, maxPasses, pathData) {
    const tr = pathData ? pathData.pts : this.trail;
    const cum = pathData ? pathData.cum : this.trailCum;
    const raw = [];
    for (let i = 0; i < tr.length - 1; i++) {
      const near = G.util.dSeg(x, y, tr[i].x, tr[i].y, tr[i + 1].x, tr[i + 1].y);
      const seg = cum[i + 1] - cum[i];
      if (near.d < radius) {
        raw.push({ d: near.d, s: cum[i] + near.t * seg, cx: near.cx, cy: near.cy });
      }
    }

    const passes = [];
    const minGap = Math.max(44, radius * 1.35);
    for (const pass of raw) {
      const prev = passes[passes.length - 1];
      if (prev && pass.s - prev.s < minGap) {
        if (pass.d < prev.d) passes[passes.length - 1] = pass;
      } else {
        passes.push(pass);
      }
    }
    return passes.slice(0, maxPasses);
  }
  trailPointAt(s) {
    const tr = this.trail, cum = this.trailCum;
    if (s <= 0 || tr.length < 2) return { x: tr[0].x, y: tr[0].y, ang: 0 };
    let i = 1;
    while (i < cum.length - 1 && cum[i] < s) i++;
    const segLen = cum[i] - cum[i - 1] || 1;
    const t = G.util.clamp((s - cum[i - 1]) / segLen, 0, 1);
    const a = tr[i - 1], b = tr[i];
    return { x: G.util.lerp(a.x, b.x, t), y: G.util.lerp(a.y, b.y, t), ang: Math.atan2(b.y - a.y, b.x - a.x) };
  }
  getLockables() {
    const out = [];
    for (const e of this.enemies) if (e.lockable) out.push(e);
    if (this.boss && !this.boss.dead && this.boss.spawnT <= 0) {
      out.push(this.boss);
      for (const o of this.boss.orbs) if (!o.broken) out.push(o);
    }
    return out;
  }
  recomputeLocks() {
    const s = this.player.stats;
    const weapon = this.activeWeapon();
    const pathData = this.weaponPathData();
    const gestureData = this.gesturePathData();
    const form = this.analyzeTrajectory(gestureData);
    this.currentForm = form;
    this.updateFormPreview(gestureData, form);
    const cands = [];
    for (const t of this.getLockables()) {
      t.seal = -1; t.sealCount = 0;
      let weaponWidth = weapon.lockWidthMul || 1;
      if (weapon.id === 'naginata') weaponWidth *= 1 + (this.shopRelics.naginataPennant || 0) * 0.12;
      if (weapon.id === 'odachi') weaponWidth *= 1 + (this.shopRelics.odachiSheath || 0) * 0.1;
      if (this.planEmpowered) weaponWidth *= 1.25;
      const effR = s.lockR * s.magnet * weaponWidth + (t.isOrb ? t.r : t.r * 0.5);
      const formPass = form.ready && form.id === 'retrace' ? 1 : 0;
      const passes = this.trailPasses(t.x, t.y, effR, 1 + s.repeatHits + formPass, pathData);
      passes.forEach((pass, repeat) => cands.push({
        t, s: pass.s, cx: pass.cx, cy: pass.cy, repeat
      }));
    }
    cands.sort((a, b) => a.s - b.s);
    const formLocks = form.ready && form.id === 'retrace'
      ? Math.max(1, Math.round(this.trajectoryFormPower(weapon.id, form.id)))
      : 0;
    this.locks = cands.slice(0, s.maxLock + formLocks);
    this.locks.forEach((l, i) => {
      l.t.seal = i;
      l.t.sealCount = (l.t.sealCount || 0) + 1;
    });
  }

  // ============ 发动 ============
  releasePlan() {
    const p = this.player;
    this.planning = false;
    this.$('planVig').style.opacity = 0;
    const formHud = this.$('formHud');
    if (formHud) formHud.classList.remove('active');
    for (const t of this.getLockables()) { t.seal = -1; t.sealCount = 0; }
    this.$('manaPreview').style.width = '0';
    const pathData = this.weaponPathData();
    const gestureData = this.gesturePathData();
    const form = this.analyzeTrajectory(gestureData);
    pathData.gestureData = gestureData;
    pathData.form = form;
    pathData.formPower = form.ready ? this.trajectoryFormPower(this.activeWeapon().id, form.id) : 1;
    if (gestureData.L < 30) {
      p.state = 'move'; this.timeTarget = 1; this.trail = []; this.planEmpowered = false;
      return;
    }
    // 连祷只接受这一笔完整输入。无论碰到几个节点，松开鼠标后事件都会结算并消失。
    const spiritResult = this.resolveSpiritSequence(gestureData);
    pathData._spiritResolved = gestureData._spiritResolved;
    pathData._spiritComplete = gestureData._spiritComplete;
    pathData.nodeBlessing = gestureData.nodeBlessing || 1;
    // 留存轨迹残影
    this.trailFade = { pts: pathData.pts.slice(), t: 1, weapon: pathData.weapon };
    const cost = this.attackCost();
    const weapon = this.activeWeapon();
    const hasInteraction = spiritResult.complete || this.trajectoryHasInteraction(gestureData, form);
    const attacksWithoutLocks = weapon.id === 'bow' || weapon.id === 'gohei' ||
      weapon.id === 'kusarigama' ||
      this.pathItemsCanAttack(pathData) || (form.ready && gestureData.L >= 120) || hasInteraction;
    const needsCost = this.locks.length > 0 || attacksWithoutLocks;
    if (!needsCost) {
      // 自由位移冲刺（无消耗无伤害）
      this.executeWeapon([], pathData);
    } else if (p.mana >= cost) {
      p.mana -= cost;
      const swapEmpowered = !!this.swapEmpower;
      const spellCharge = this.activeRelicCharge || 0;
      pathData.relicAttackMul = (swapEmpowered ? 1.35 : 1) * (1 + spellCharge * 0.2);
      pathData.swapEmpowered = swapEmpowered;
      pathData.spellReturnCharge = spellCharge;
      this.swapEmpower = false;
      this.activeRelicCharge = 0;
      this.lastAttackPath = {
        pts: pathData.pts.map(point => ({ x: point.x, y: point.y })),
        cum: pathData.cum.slice(),
        L: pathData.L,
        weapon: pathData.weapon,
        formId: form.ready ? form.id : null,
        // 保留上一笔锁定过的实体。返迹可追斩已经离开旧轨迹的幸存目标，
        // 因此它在清杂、精英与 Boss 战中都有稳定价值。
        targets: [...new Set(this.locks.map(lock => lock.t)
          .filter(target => target && !target.isOrb))]
      };
      this.resolveTrajectoryInteractions(gestureData, form);
      pathData.nodeBlessing = gestureData.nodeBlessing || 1;
      if (form.ready) {
        const focused = pathData.formPower > 1.25 ? ' ・ 神 兵 专 精' : '';
        G.FX.banner('轨 迹 术 式 ・ ' + form.def.name + focused);
      }
      this.executeWeapon(this.locks, pathData);
    } else {
      G.Audio.fizzle();
      G.FX.text(p.x, p.y - 30, '神力不足', { size: 15, color: '#ff9a8a' });
      p.state = 'move'; this.timeTarget = 1;
    }
    this.trail = []; this.locks = [];
    this.planEmpowered = false;
  }

  executeWeapon(locks, pathData) {
    const weapon = this.activeWeapon();
    if (weapon.id === 'fans' && locks.length) {
      const paired = [];
      for (const lock of locks) {
        paired.push(lock);
        paired.push(Object.assign({}, lock, {
          s: Math.min(pathData.L, lock.s + 22),
          repeat: (lock.repeat || 0) + 1,
          fanEcho: true
        }));
      }
      locks = paired.sort((a, b) => a.s - b.s);
    }
    if (weapon.id === 'odachi') this.executeOdachi(locks, pathData, weapon);
    else this.executeDash(locks, pathData, weapon);
  }

  executeDash(locks, pathData, weapon) {
    const p = this.player;
    weapon = weapon || this.activeWeapon();
    pathData = pathData || {
      pts: this.trailFade.pts,
      cum: this.trailCum.slice(),
      L: this.trailLen,
      weapon: weapon.id
    };
    // 高命中构筑会自动压缩演出时长：8 次以内保持原节奏，之后逐步加速，最多 2.2 倍。
    const hitSpeedMul = G.util.clamp(1 + Math.max(0, locks.length - 8) * 0.06, 1, 2.2);
    const formHaste = pathData.form && pathData.form.ready && pathData.form.id === 'retrace'
      ? 1 + 0.3 * (pathData.formPower || 1)
      : 1;
    const dashSpeed = G.util.clamp(760 + pathData.L * 0.45, 900, 1500) * 2 *
      hitSpeedMul * (weapon.speedMul || 1) * formHaste;
    const closed = weapon.id === 'kusarigama' && this.isClosedPath(pathData, weapon);
    let weaponDmgMul = weapon.damageMul || 1;
    if (weapon.id === 'naginata') {
      const drawnLength = Math.max(pathData.L, (pathData.gestureData && pathData.gestureData.L) || pathData.L);
      const straightness = G.util.clamp(pathData.L / Math.max(1, drawnLength), 0, 1);
      weaponDmgMul *= 0.7 + straightness * 0.6;
      pathData.weaponStraightness = straightness;
    } else if (weapon.id === 'kusarigama') {
      weaponDmgMul *= closed ? 1.05 : 0.72;
    }
    p.state = 'dash';
    this.dash = {
      pts: pathData.pts, cum: pathData.cum, L: pathData.L, weapon: weapon.id,
      movePlayer: !!weapon.movePlayer, closed,
      s: 0, speed: dashSpeed, hitSpeedMul, locks, idx: 0, hits: [], nextAfterS: 0, batched: 0,
      weaponDmgMul,
      lockedTargets: new Set(locks.map(lock => lock.t)),
      runnerHitSet: new Set(),
      itemEvents: this.preparePathItemEvents(pathData), itemEventIndex: 0,
      pathData
    };
    this.ribbon = [];
    this.combo = 0;
    this.timeTarget = locks.length ? 0.3 : 0.5;
    // A free movement dash has no impact, so shaking the whole scene here only
    // makes an otherwise continuous route look jittery.
    if (locks.length) G.FX.shake(1.5, 0.08);
    const a0 = this.dashPointAt(1);
    p.dir = a0.ang;
    G.Audio.dash();
    this.dashCount++;
    if (this.dashCount >= 3) this.$('hint').style.opacity = 0;
  }

  executeOdachi(locks, pathData, weapon) {
    const p = this.player;
    const a = pathData.pts[0], b = pathData.pts[pathData.pts.length - 1];
    const ang = G.util.angTo(a.x, a.y, b.x, b.y);
    const distanceCap = weapon.maxDistanceDmg + (this.shopRelics.odachiSheath || 0) * 0.15;
    const distanceDmg = 1 + distanceCap * G.util.clamp(pathData.L / 720, 0, 1);
    p.state = 'fin';
    p.dir = ang;
    this.finT = 0;
    this.combo = 0;
    this.ribbon = [];
    this.timeTarget = locks.length ? 0.14 : 0.55;
    this.dash = {
      pts: pathData.pts, cum: pathData.cum, L: pathData.L, weapon: weapon.id,
      movePlayer: false, closed: false, s: 0, speed: 0, hitSpeedMul: 1,
      locks, idx: 0, hits: [], nextAfterS: 0, batched: 0, weaponDmgMul: distanceDmg,
      itemEvents: this.preparePathItemEvents(pathData), itemEventIndex: 0,
      pathData
    };
    this.weaponTelegraph = { a, b, t: 0.13, maxT: 0.13 };
    this.delayed.push({
      t: 0.13, real: true, fn: () => {
        if (!this.dash || this.dash.weapon !== 'odachi') return;
        this.weaponTelegraph = null;
        const midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2;
        for (const ev of this.dash.itemEvents) this.activatePathItemEvent(ev);
        this.dash.itemEventIndex = this.dash.itemEvents.length;
        this.triggerClosedPathItem(pathData);
        for (const lock of locks) this.hitLock(lock, ang);
        this.triggerTrajectoryForm(this.dash);
        G.FX.slash(midX, midY, ang, pathData.L + 90, 'white');
        G.FX.burstDir(midX, midY, ang, 'cyan', 20, 420, 13, 0.42);
        G.FX.flash(0.32, '#effcff');
        G.FX.shake(Math.min(15, 6 + locks.length * 0.8), 0.32);
        this.hitstop = Math.max(this.hitstop, 0.09);
        G.Audio.finisher();
        G.Audio.tension();
        this.finT = 0;
        this.pendingPurify = locks.length ? 0.2 : -1;
      }
    });
    G.Audio.tension();
    this.dashCount++;
  }

  isClosedPath(pathData, weapon) {
    if (!pathData || pathData.pts.length < 4 || pathData.L < weapon.closeMinLength) return false;
    const a = pathData.pts[0], b = pathData.pts[pathData.pts.length - 1];
    const closeBonus = weapon.id === 'kusarigama' ? (this.shopRelics.chainWeight || 0) * 14 : 0;
    return G.util.dist(a.x, a.y, b.x, b.y) <= weapon.closeDistance + closeBonus;
  }

  updateDash(rdt) {
    const p = this.player, d = this.dash;
    d.s += d.speed * rdt;
    const pos = this.dashPointAt(d.s);
    d.runner = pos;
    if (d.movePlayer) {
      const bounded = G.util.fieldClamp(pos.x, pos.y, p.r + 18);
      p.x = bounded.x;
      p.y = bounded.y;
      p.dir = pos.ang;
      // 速度光带
      this.ribbon.push({ x: p.x, y: p.y });
      if (this.ribbon.length > 12) this.ribbon.shift();
    } else {
      p.dir = G.util.angTo(p.x, p.y, pos.x, pos.y);
    }
    // Emit ghosts by travelled distance instead of every render frame. The
    // assembled miko uses several large source images, so frame-rate emission
    // could leave 20+ filtered full-character draws alive at once.
    if (d.movePlayer && d.s >= d.nextAfterS) {
      G.FX.after(p.x, p.y, p.dir, 'dash', this.combo > 5 ? 'pink' : 'cyan', 0.2);
      d.nextAfterS = d.s + 42;
    } else if (!d.movePlayer && d.s >= d.nextAfterS) {
      G.FX.glow(pos.x, pos.y, d.weapon === 'bow' ? 'gold' : 'purple', 13, 0.18);
      d.nextAfterS = d.s + 30;
    }
    // 梓弓的箭头本身是一枚沿轨迹飞行的弹体：锁定目标仍在祓除结算，
    // 沿线没有被锁定的敌人则会被箭矢贯穿一次。
    if (d.weapon === 'bow') {
      const weapon = G.WEAPONS.bow;
      const pierceDmg = this.player.stats.dmg * this.permDmg * weapon.pierceDmg;
      for (const e of this.enemies.slice()) {
        if (e.dead || d.lockedTargets.has(e) || d.runnerHitSet.has(e) ||
          G.util.dist2(e.x, e.y, pos.x, pos.y) > (e.r + 30) * (e.r + 30)) continue;
        d.runnerHitSet.add(e);
        this.hurtEnemy(e, pierceDmg, {});
        G.FX.slash(e.x, e.y, pos.ang, e.r * 2.2 + 28, 'gold');
        G.FX.burstDir(e.x, e.y, pos.ang, 'gold', 5, 180, 8, 0.25);
      }
      if (this.boss && !this.boss.dead && !d.lockedTargets.has(this.boss) &&
        !d.runnerHitSet.has(this.boss) &&
        G.util.dist2(this.boss.x, this.boss.y, pos.x, pos.y) <=
          (this.boss.r + 30) * (this.boss.r + 30)) {
        d.runnerHitSet.add(this.boss);
        this.hurtBoss(pierceDmg * 0.65, {});
      }
    }
    // 切碎沿途敌弹
    if (d.movePlayer) {
      for (const b of this.bullets) {
        if (b.dead) continue;
        if (G.util.dist2(b.x, b.y, p.x, p.y) < 66 * 66) {
          b.dead = true;
          G.FX.burst(b.x, b.y, 'purple', 5, 130, 9, 0.3);
          p.mana = Math.min(p.maxMana, p.mana + 1);
        }
      }
    }
    while (d.itemEventIndex < d.itemEvents.length && d.itemEvents[d.itemEventIndex].s <= d.s) {
      this.activatePathItemEvent(d.itemEvents[d.itemEventIndex]);
      d.itemEventIndex++;
    }
    // 命中锁定的目标
    let batchN = 0;
    while (d.idx < d.locks.length && d.locks[d.idx].s <= d.s) {
      this.hitLock(d.locks[d.idx], pos.ang);
      d.idx++; batchN++;
    }
    // One-frame impact for ordinary targets; clustered hits can add only a
    // very small extra pause. Large thunder/finisher hitstops are separate.
    if (batchN) {
      const impactScale = 1 / Math.sqrt(d.hitSpeedMul);
      this.hitstop = Math.max(this.hitstop, Math.min(0.02, (0.01 + batchN * 0.003) * impactScale));
    }
    if (d.s >= d.L) this.finisher();
  }
  dashPointAt(s) {
    const d = this.dash, tr = d.pts, cum = d.cum;
    if (tr.length < 2) return { x: tr[0].x, y: tr[0].y, ang: 0 };
    let i = 1;
    while (i < cum.length - 1 && cum[i] < s) i++;
    const segLen = cum[i] - cum[i - 1] || 1;
    const t = G.util.clamp((s - cum[i - 1]) / segLen, 0, 1);
    const a = tr[i - 1], b = tr[i];
    return { x: G.util.lerp(a.x, b.x, t), y: G.util.lerp(a.y, b.y, t), ang: Math.atan2(b.y - a.y, b.x - a.x) };
  }

  hitLock(lock, ang) {
    const t = lock.t;
    this.combo++;
    const ct = this.$('comboText');
    ct.textContent = 'x' + this.combo;
    ct.classList.remove('pop'); void ct.offsetWidth; ct.classList.add('pop');
    G.Audio.hit(this.combo - 1);
    if (!t.isOrb && !t.isBoss) t.pinned = true;
    t.flashT = 0.14;
    t.woundAng = ang; t.woundT = 0; // 挂上斩击伤（切线方向）
    G.FX.slash(t.x, t.y, ang + G.util.rand(-0.4, 0.4), t.r * 3 + 30, this.combo > 8 ? 'pink' : 'white');
    G.FX.burst(t.x, t.y, 'white', 4, 160, 10, 0.25);
    G.FX.shake(1.6, 0.08);
    this.dash.hits.push(lock);
  }

  triggerTrajectoryForm(dash) {
    if (!dash || dash.formTriggered || !dash.pathData || !dash.pathData.form ||
      !dash.pathData.form.ready) return;
    dash.formTriggered = true;
    const form = dash.pathData.form;
    const gesture = dash.pathData.gestureData || dash.pathData;
    const power = (dash.pathData.formPower || 1) * (dash.pathData.nodeBlessing || 1);
    const base = this.player.stats.dmg * this.permDmg;
    const wheel = this.shopRelics.sixPathWheel || 0;
    if (wheel > 0 && this.lastRelicForm && this.lastRelicForm !== form.id) {
      dash.pathData.itemFormBlessing = 1 + wheel * 0.18;
      const mana = wheel * 2;
      this.player.mana = Math.min(this.player.maxMana, this.player.mana + mana);
      G.FX.ring(form.center.x, form.center.y, 88 + wheel * 12, 'purple', 5, 0.45);
      G.FX.text(form.center.x, form.center.y - 60, '六 道 轮 转 ×' +
        dash.pathData.itemFormBlessing.toFixed(2), {
        size: 16, color: '#e5c1ff', crit: true
      });
    }
    if (wheel > 0) this.lastRelicForm = form.id;
    if (form.id === 'line') {
      const a = gesture.pts[0], b = gesture.pts[gesture.pts.length - 1];
      const ang = G.util.angTo(a.x, a.y, b.x, b.y);
      G.FX.slash((a.x + b.x) / 2, (a.y + b.y) / 2, ang, form.direct + 80, 'cyan');
      G.FX.burstDir((a.x + b.x) / 2, (a.y + b.y) / 2, ang, 'cyan', 12, 320, 10, 0.35);
    } else if (form.id === 'loop') {
      const targets = this.enemies.filter(e => !e.dead &&
        this.pointInTrail(e.x, e.y, gesture.pts));
      for (const e of targets) {
        e.freezeT = Math.max(e.freezeT || 0, 1 + power * 0.18);
        this.hurtEnemy(e, base * 0.42 * power, {});
      }
      if (this.boss && !this.boss.dead && this.pointInTrail(this.boss.x, this.boss.y, gesture.pts))
        this.hurtBoss(base * 0.3 * power, {});
      G.FX.ring(form.center.x, form.center.y,
        Math.min(250, Math.max(100, Math.sqrt(form.area / Math.PI))), 'gold', 7, 0.62);
      G.FX.burst(form.center.x, form.center.y, 'purple', 24, 300, 14, 0.55);
      G.FX.text(form.center.x, form.center.y - 44, '镇 封', { size: 22, color: '#ffe5a8', crit: true });
    } else if (form.id === 'knot') {
      for (const cross of form.crosses.slice(0, 3)) {
        G.FX.bolt(cross.x, cross.y - 260, cross.x, cross.y, { w: 6 + power, life: 0.3 });
        this.itemBurst(cross.x, cross.y, 82 + power * 10, base * 0.48 * power, 'purple', '天 結');
      }
      G.FX.flash(0.16, '#e7c8ff');
    } else if (form.id === 'retrace') {
      for (const point of form.retracePoints.slice(0, 5))
        G.FX.slash(point.x, point.y, G.util.rand(-0.5, 0.5), 110 + power * 16, 'pink');
      G.FX.text(form.center.x, form.center.y - 42, '返 祓 重 巡', {
        size: 20, color: '#ffcae4', crit: true
      });
    } else if (form.id === 'spiral') {
      const radius = 220 + power * 24;
      for (const e of this.enemies.slice()) {
        if (e.dead || G.util.dist2(e.x, e.y, form.center.x, form.center.y) > (radius + e.r) * (radius + e.r)) continue;
        const ang = G.util.angTo(e.x, e.y, form.center.x, form.center.y);
        e.kx += Math.cos(ang) * (380 + power * 60);
        e.ky += Math.sin(ang) * (380 + power * 60);
        e.vulnT = Math.max(e.vulnT || 0, 1.8 + power * 0.25);
        this.hurtEnemy(e, base * 0.3 * power, {});
      }
      G.FX.ring(form.center.x, form.center.y, radius, 'teal', 7, 0.62, radius * 0.18);
      G.FX.burst(form.center.x, form.center.y, 'teal', 26, 320, 15, 0.58);
      G.FX.text(form.center.x, form.center.y - 46, '引 魂', { size: 22, color: '#a8ffe2', crit: true });
    } else if (form.id === 'zigzag') {
      for (const turn of form.turns.slice(0, 6)) {
        G.FX.bolt(turn.x, turn.y - 240, turn.x, turn.y, { w: 5 + power, life: 0.28 });
        this.itemBurst(turn.x, turn.y, 64 + power * 7, base * 0.3 * power, 'gold', '折 雷');
      }
      G.FX.shake(5 + power * 2, 0.22);
    }
  }

  finisher() {
    const p = this.player, d = this.dash;
    p.state = 'fin';
    this.finT = 0;
    const hasHits = d.hits.length > 0;
    const end = this.dashPointAt(d.L);
    const fxX = d.movePlayer ? p.x : end.x;
    const fxY = d.movePlayer ? p.y : end.y;
    this.timeTarget = hasHits ? 0.06 : 0.7;
    G.FX.ring(fxX, fxY, 80, 'white', 4, 0.35);
    G.FX.burst(fxX, fxY, 'cyan', 8, 200, 12, 0.35);
    this.triggerTrajectoryForm(d);
    if (d.pathData) this.triggerClosedPathItem(d.pathData);
    if (d.weapon === 'bow') this.explodeBowEnd(fxX, fxY);
    if (d.weapon === 'kusarigama') {
      if (d.closed) this.startChainPull(d);
      else this.slashOpenChain(d);
    }
    if (d.weapon === 'gohei') this.invokeGohei(fxX, fxY);
    if (hasHits) {
      G.Audio.finisher();
      G.Audio.tension();
      G.FX.shake(3.5, 0.18);
      this.pendingPurify = 0.3;
      // 回响・震
      const s = p.stats;
      if (s.shock > 0) {
        const shockRelic = this.shopRelics.shockBell || 0;
        const R = 150 + s.shock * 25 + shockRelic * 20;
        const shockDmg = s.dmg * 0.6 * s.shock * (1 + shockRelic * 0.25);
        G.FX.ring(fxX, fxY, R, 'gold', 6, 0.45);
        for (const e of this.enemies) {
          if (e.dead) continue;
          if (G.util.dist2(e.x, e.y, fxX, fxY) < R * R) {
            const a = G.util.angTo(fxX, fxY, e.x, e.y);
            e.kx += Math.cos(a) * 420; e.ky += Math.sin(a) * 420;
            this.hurtEnemy(e, shockDmg, {});
          }
        }
        if (this.boss && !this.boss.dead && G.util.dist2(this.boss.x, this.boss.y, fxX, fxY) < (R + 40) * (R + 40))
          this.hurtBoss(shockDmg, {});
      }
      // 回响・域
      if (s.zone > 0) {
        const zoneRelic = this.shopRelics.zoneIncense || 0;
        for (let zs = 50; zs < d.L; zs += 95)
          this.zones.push(new G.Zone(
            this.dashPointAt(zs).x,
            this.dashPointAt(zs).y,
            s.dmg * 0.35 * s.zone,
            { r: 52 + zoneRelic * 12, life: 3 + zoneRelic * 0.5 }
          ));
      }
      // 回响・贰
      if (s.echo > 0) this.pendingEchoT = 0.3;
    }
  }

  explodeBowEnd(x, y) {
    const weapon = G.WEAPONS.bow;
    const quiver = this.shopRelics.bowQuiver || 0;
    const R = weapon.burstRadius + quiver * 25;
    const dmg = this.player.stats.dmg * this.permDmg * weapon.burstDmg * (1 + quiver * 0.2);
    G.FX.ring(x, y, R, 'gold', 6, 0.42, 18);
    G.FX.burst(x, y, 'gold', 20, 300, 14, 0.45);
    G.FX.papers(x, y, 6);
    G.Audio.fox();
    for (const e of this.enemies.slice()) {
      if (!e.dead && G.util.dist2(e.x, e.y, x, y) <= (R + e.r) * (R + e.r)) this.hurtEnemy(e, dmg, {});
    }
    if (this.boss && !this.boss.dead &&
      G.util.dist2(this.boss.x, this.boss.y, x, y) <= (R + this.boss.r) * (R + this.boss.r)) {
      this.hurtBoss(dmg, {});
    }
  }

  invokeGohei(x, y) {
    const weapon = G.WEAPONS.gohei;
    const tassel = this.shopRelics.goheiTassel || 0;
    const radius = weapon.pullRadius + tassel * 30;
    const dmg = this.player.stats.dmg * this.permDmg * weapon.pullDmg * (1 + tassel * 0.2);
    G.FX.ring(x, y, radius, 'gold', 6, 0.56, radius * 0.18);
    G.FX.ring(x, y, radius * 0.58, 'purple', 3, 0.48, 12);
    G.FX.papers(x, y, 14);
    G.FX.text(x, y - 58, '招 魂', { size: 20, color: '#ffe5a8', crit: true });
    for (const e of this.enemies.slice()) {
      if (e.dead || G.util.dist2(e.x, e.y, x, y) > (radius + e.r) * (radius + e.r)) continue;
      const a = G.util.angTo(e.x, e.y, x, y);
      e.kx += Math.cos(a) * 430;
      e.ky += Math.sin(a) * 430;
      this.hurtEnemy(e, dmg, {});
      if (!e.dead) e.vulnT = Math.max(e.vulnT || 0, 2.1 + tassel * 0.25);
    }
    if (this.boss && !this.boss.dead &&
      G.util.dist2(this.boss.x, this.boss.y, x, y) <= (radius + this.boss.r) * (radius + this.boss.r)) {
      this.hurtBoss(dmg * 0.55, {});
    }
    G.Audio.tone({ f: 420, f2: 1180, dur: 0.3, type: 'sine', vol: 0.06 });
  }

  pointInTrail(x, y, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i], b = pts[j];
      const cross = ((a.y > y) !== (b.y > y)) &&
        (x < (b.x - a.x) * (y - a.y) / ((b.y - a.y) || 0.0001) + a.x);
      if (cross) inside = !inside;
    }
    return inside;
  }

  slashOpenChain(dash) {
    const weapon = G.WEAPONS.kusarigama;
    const selected = dash.lockedTargets || new Set((dash.locks || []).map(lock => lock.t));
    const dmg = this.player.stats.dmg * this.permDmg * 0.42;
    let hitN = 0;
    for (const e of this.enemies.slice()) {
      if (e.dead || selected.has(e) ||
        !this.pathTouchesPoint(dash, e.x, e.y, e.r + 42)) continue;
      const near = dash.pts.reduce((best, point) => {
        const d2 = G.util.dist2(point.x, point.y, e.x, e.y);
        return d2 < best.d2 ? { x: point.x, y: point.y, d2 } : best;
      }, { x: dash.pts[0].x, y: dash.pts[0].y, d2: Infinity });
      const a = G.util.angTo(e.x, e.y, near.x, near.y);
      e.kx += Math.cos(a) * 150;
      e.ky += Math.sin(a) * 150;
      e.freezeT = Math.max(e.freezeT || 0, 0.24);
      this.hurtEnemy(e, dmg, {});
      G.FX.slash(e.x, e.y, a + Math.PI / 2, e.r * 2.5 + 34, 'purple');
      hitN++;
    }
    if (this.boss && !this.boss.dead && !selected.has(this.boss) &&
      this.pathTouchesPoint(dash, this.boss.x, this.boss.y, this.boss.r + 42)) {
      this.hurtBoss(dmg * 0.6, {});
      hitN++;
    }
    if (!hitN) return;
    const mid = dash.pts[Math.floor(dash.pts.length / 2)];
    G.FX.text(mid.x, mid.y - 34, '割 魂', { size: 18, color: '#ddafff', crit: true });
    G.FX.burst(mid.x, mid.y, 'purple', Math.min(18, 5 + hitN * 2), 230, 12, 0.36);
    G.Audio.tone({ f: 720, f2: 230, dur: 0.2, type: 'sawtooth', vol: 0.04 });
  }

  startChainPull(dash) {
    const pts = dash.pts;
    const targets = this.enemies.filter(e => !e.dead && this.pointInTrail(e.x, e.y, pts));
    const bossInside = !!(this.boss && !this.boss.dead && this.pointInTrail(this.boss.x, this.boss.y, pts));
    if (!targets.length && !bossInside) return;
    let cx = 0, cy = 0;
    for (const p of pts) { cx += p.x; cy += p.y; }
    cx /= pts.length; cy /= pts.length;
    for (const e of targets) e.pinned = true;
    this.chainPull = {
      pts: pts.slice(), targets, bossInside, x: cx, y: cy,
      t: 0, dur: 0.38, fxT: 0,
      dmg: this.player.stats.dmg * this.permDmg * G.WEAPONS.kusarigama.bindDmg *
        (1 + (this.shopRelics.chainWeight || 0) * 0.2)
    };
    G.FX.banner('缚 魂 ・ 收 界');
    G.Audio.tension();
  }

  updateChainPull(rdt) {
    const pull = this.chainPull;
    pull.t += rdt;
    pull.fxT -= rdt;
    const q = G.util.clamp(pull.t / pull.dur, 0, 1);
    const ease = 1 - Math.pow(1 - q, 3);
    for (const e of pull.targets) {
      if (e.dead) continue;
      e.x = G.util.lerp(e.x, pull.x, 0.08 + ease * 0.18);
      e.y = G.util.lerp(e.y, pull.y, 0.08 + ease * 0.18);
    }
    if (pull.fxT <= 0) {
      pull.fxT = 0.05;
      G.FX.ring(pull.x, pull.y, Math.max(28, 170 * (1 - ease)), 'purple', 2, 0.13);
      for (const e of pull.targets.slice(0, 8)) {
        if (!e.dead) G.FX.bolt(e.x, e.y, pull.x, pull.y, { w: 2, life: 0.1 });
      }
    }
    if (q < 1) return;
    for (const e of pull.targets) {
      if (e.dead) continue;
      e.pinned = false;
      this.hurtEnemy(e, pull.dmg, {});
    }
    if (pull.bossInside && this.boss && !this.boss.dead) this.hurtBoss(pull.dmg * 0.7, {});
    G.FX.burst(pull.x, pull.y, 'purple', 30, 360, 16, 0.5);
    G.FX.ring(pull.x, pull.y, 120, 'white', 7, 0.4);
    G.FX.shake(12, 0.35);
    G.Audio.finisher();
    this.chainPull = null;
  }

  updateFin(rdt) {
    this.finT += rdt;
    const p = this.player;
    if (this.pendingPurify > 0) {
      this.pendingPurify -= rdt;
      if (this.pendingPurify <= 0) this.purify();
    }
    if (this.pendingEchoT > 0) {
      this.pendingEchoT -= rdt;
      if (this.pendingEchoT <= 0) this.startEcho();
    }
    if (this.finT > 0.34 && this.pendingPurify <= 0) {
      p.state = 'move';
      p.iTime = Math.max(p.iTime, G.getWave(this.wave).postAttackGrace);
      if (this.winT <= 0) this.timeTarget = 1;
      this.dash = null;
    }
  }

  // ============ 净化结算 ============
  purgeHeat(hitN) {
    for (const rating of RATING) if (hitN >= rating.n) return rating;
    return NO_RATING;
  }

  manaReturnForHits(hitN) {
    // 高连斩会返灵，但基础返还永远封顶，避免最大锁定数成长后自动进入永动。
    return Math.min(9, Math.max(0, hitN) * 0.7);
  }

  calcDmg(t, i, hit) {
    const s = this.player.stats;
    let d = s.dmg * this.permDmg;
    const hitN = this.dash ? this.dash.hits.length : 0;
    d *= this.purgeHeat(hitN).dmg;
    const weaponId = this.dash && this.dash.weapon ? this.dash.weapon : this.activeWeapon().id;
    if (this.dash) d *= this.dash.weaponDmgMul || 1;
    if (weaponId === 'fans' && hit && hit.fanEcho) d *= G.WEAPONS.fans.fanEchoMul || 1;
    d *= 1 + s.comboStep * i;
    if (s.lengthDmg) {
      const routeRatio = this.dash
        ? this.dash.L / (s.trailLen * (this.activeWeapon().trailMul || 1))
        : this.trailLen / s.trailLen;
      d *= 1 + s.lengthDmg * (routeRatio || 1);
    }
    if (t.maxHp && t.hp >= t.maxHp) d *= 1 + s.fullHp;
    if (t.maxHp && t.hp / t.maxHp <= 0.35)
      d *= (1 + s.execute) * (1 + (this.shopRelics.hunterEye || 0) * 0.2);
    if (this.player.hp / this.player.maxHp <= 0.4) d *= 1 + s.lowHpDmg;
    d *= 1 + Math.min(s.crowdDmg, Math.floor(hitN / 5) * 0.1);
    if (t.isBoss || t.isOrb || t.type === 'elite') d *= s.eliteDmg;
    if ((t.wardT || 0) > 0 || t.shell > 0)
      d *= 1 + (this.shopRelics.wardBreaker || 0) * 0.35;
    if (hitN >= 1 && hitN <= 3) d *= 1 + (this.shopRelics.iaidoStone || 0) * 0.35;
    if (hitN >= 8) d *= 1 + (this.shopRelics.hordeScroll || 0) * 0.2;
    if (this.dash && this.dash.L <= 260) d *= 1 + (this.shopRelics.shortTalisman || 0) * 0.35;
    if (hit && hit.repeat > 0) d *= 1 + (this.shopRelics.armorAwl || 0) * 0.12 * hit.repeat;
    if (i === 0) d *= 1 + (this.shopRelics.firstSeal || 0) * 0.3;
    if (weaponId === 'ritualBlade' && hitN > 0 && (i === 0 || i === hitN - 1))
      d *= 1 + (this.shopRelics.ritualScabbard || 0) * 0.25;
    if (weaponId === 'naginata') d *= 1 + (this.shopRelics.naginataPennant || 0) * 0.15;
    if (weaponId === 'fans') d *= 1 + (this.shopRelics.fanRibs || 0) * 0.15;
    const pathData = this.dash && this.dash.pathData;
    if (pathData) {
      d *= pathData.nodeBlessing || 1;
      d *= pathData.relicAttackMul || 1;
      d *= pathData.itemFormBlessing || 1;
      const form = pathData.form;
      if (form && form.ready) {
        const power = pathData.formPower || 1;
        d *= 1 + Math.max(0, power - 1) * 0.08;
        if (form.id === 'line') d *= 1 + 0.16 * power * form.straightness;
        if (form.id === 'retrace' && hit && hit.repeat > 0) d *= 1 + 0.1 * power;
        const severTier = this.buildTier('sever');
        const repeatTier = this.buildTier('repeat');
        const wardTier = this.buildTier('ward');
        if (severTier && G.BUILD_ARCHETYPES.sever.forms.includes(form.id))
          d *= 1 + severTier * 0.1;
        if (repeatTier && form.id === 'retrace' && hit && hit.repeat > 0)
          d *= 1 + Math.min(3, hit.repeat) * repeatTier * 0.06;
        if (wardTier && G.BUILD_ARCHETYPES.ward.forms.includes(form.id))
          d *= 1 + wardTier * 0.07;
      }
    }
    return d;
  }

  purify() {
    const p = this.player, d = this.dash;
    const hits = d.hits, n = hits.length;
    if (!n) return;
    const s = p.stats;
    const heat = this.purgeHeat(n);
    if (this.fateId === 'dancer' && heat.tier > 0)
      this.activeCooldown = Math.max(0, this.activeCooldown - heat.tier * 0.8);
    let orbManaLeft = this.manaReturnForHits(n);
    this.lastHeatTier = heat.tier;
    this.lastSuperPurge = 0;
    let killsNow = 0, orbN = 0;
    const overkills = [];
    const emitManaOrb = target => {
      const gain = Math.min(0.7, orbManaLeft);
      orbManaLeft -= gain;
      G.FX.spiritOrb(target.x, target.y, gain > 0
        ? () => { p.mana = Math.min(p.maxMana, p.mana + gain); }
        : null);
    };

    hits.forEach((h, i) => {
      const t = h.t;
      if (!t.isOrb && !t.isBoss && t.dead) return;
      const base = this.calcDmg(t, i, h);
      if (t.isOrb) {
        // 击穿弱点
        t.broken = true; t.respawnT = 12;
        if (this.boss) this.boss.staggerT = Math.max(this.boss.staggerT, 0.5);
        G.FX.burst(t.x, t.y, 'teal', 14, 240, 14, 0.5);
        G.FX.ring(t.x, t.y, 70, 'teal', 4, 0.4);
        G.FX.text(t.x, t.y - 20, Math.round(base * 1.2) + '', { size: 24, color: '#8affd8', crit: true });
        this.hurtBoss(base * 1.2, {});
        orbN++;
        emitManaOrb(t);
        return;
      }
      if (t.isBoss) {
        const bwa = (t.woundAng != null) ? t.woundAng : G.util.rand(0, 6.28);
        t.woundAng = null;
        G.FX.gash(t.x, t.y, bwa, t.r);
        G.FX.burstDir(t.x, t.y, bwa, 'gold', 12, 340, 14, 0.45);
        G.FX.text(t.x, t.y - 60, Math.round(base * 0.35) + '', { size: 18, color: '#ffd0a0' });
        this.hurtBoss(base * 0.35, {});
        emitManaOrb(t);
        return;
      }
      t.pinned = false;
      if (t.soulLink && t.soulLink.active) {
        t.soulLink.pulse = 0.34;
        G.FX.ring(t.x, t.y, t.r * 2.4, 'red', 3, 0.3);
        G.FX.text(t.x, t.y - t.r - 10, '共 生 ・ 无 效', {
          size: 15, color: '#ff7b82', crit: true
        });
        return;
      }
      const wa = (t.woundAng != null) ? t.woundAng : G.util.rand(0, 6.28);
      t.woundAng = null;
      // 斩击伤沿切线方向迸开
      G.FX.gash(t.x, t.y, wa, t.r * heat.slash);
      G.FX.burstDir(t.x, t.y, wa, 'white', 7, 300, 12, 0.35);
      G.FX.petals(t.x, t.y, 7, 150, wa);
      G.FX.papers(t.x, t.y, 3, wa);
      G.FX.ring(t.x, t.y, t.r * 2.2, 'spirit', 2, 0.3);
      G.FX.text(t.x, t.y - t.r - 8, Math.round(base) + '', { size: 16 + Math.min(i, 8), color: i > 6 ? '#ffb7d5' : '#ffffff', crit: t.type === 'elite' });
      const hpBefore = t.hp;
      const effectiveDmg = base * ((t.vulnT || 0) > 0 ? 1.25 : 1);
      const died = t.hurt(base, this, { ang: wa, trajectory: true });
      if (died) {
        this.deathFX(t); this.onKill(t); killsNow++;
        const excess = effectiveDmg - hpBefore;
        if (this.shopRelics.superPurgeSeal &&
          excess >= Math.max(6, t.maxHp * 0.22)) overkills.push({ source: t, excess });
      }
      else if (s.ofuda) { t.ofuda = 1; this.ofudaList.push({ e: t, t: 0.7 }); G.FX.papers(t.x, t.y, 2); }
      // 灵力光球回馈
      emitManaOrb(t);
    });

    if (overkills.length) this.startSuperPurge(overkills, heat);

    const lastOrb = this.shopRelics.lastOrb || 0;
    const lastHit = lastOrb ? [...hits].reverse().find(h => !h.t.isOrb) : null;
    if (lastHit) {
      const radius = 74 + lastOrb * 16;
      this.itemBurst(lastHit.t.x, lastHit.t.y, radius,
        s.dmg * this.permDmg * 0.32 * lastOrb, 'gold', '终 祓');
      G.Audio.tone({ f: 980, f2: 420, dur: 0.13, type: 'triangle', vol: 0.055 });
    }

    // 珍品联动：返祓、不同目标数量与击杀数各自形成独立触发链。
    const repeatN = hits.reduce((sum, h) => sum + (h.repeat > 0 ? 1 : 0), 0);
    const shuttle = this.shopRelics.spiritShuttle || 0;
    if (repeatN && shuttle) {
      const gain = Math.min(s.cost * 0.3, repeatN * shuttle);
      p.mana = Math.min(p.maxMana, p.mana + gain);
      G.FX.text(p.x, p.y - 38, '回灵 +' + Math.round(gain), { size: 14, color: '#9fe8ff' });
    }

    const seven = this.shopRelics.sevenMagatama || 0;
    if (seven) {
      const hitCounts = new Map();
      for (const h of hits) if (!h.t.isOrb) hitCounts.set(h.t, (hitCounts.get(h.t) || 0) + 1);
      for (const [target, count] of hitCounts) {
        const extraN = Math.floor(count / 3);
        for (let i = 0; i < extraN; i++) {
          if (target.dead) break;
          const dmg = s.dmg * this.permDmg * 0.45 * seven;
          G.FX.slash(target.x, target.y, -0.8 + i * 0.22, target.r * 4 + 24, 'purple');
          G.FX.text(target.x, target.y - target.r - 20, '七 返', { size: 15, color: '#e6c2ff', crit: true });
          const wasDead = target.dead;
          if (target.isBoss) this.hurtBoss(dmg * 0.7, {});
          else this.hurtEnemy(target, dmg, {});
          if (!wasDead && target.dead && !target.isBoss) killsNow++;
        }
      }
    }

    const uniqueTargets = new Set(hits.map(h => h.t).filter(t => !t.isOrb));
    const lamp = this.shopRelics.hundredLamp || 0;
    const lampN = Math.floor(uniqueTargets.size / 8) * lamp;
    if (lampN > 0) {
      const end = this.dashPointAt(d.L);
      for (let i = 0; i < lampN; i++) {
        this.foxfires.push(new G.Foxfire(
          end.x + G.util.rand(-18, 18), end.y + G.util.rand(-16, 8),
          s.dmg * 0.72,
          { itemSoul: true }
        ));
      }
      G.FX.text(end.x, end.y - 42, '百 鬼 行 灯 ×' + lampN, { size: 18, color: '#aeeaff', crit: true });
      G.Audio.fox();
    }

    const gourd = this.shopRelics.soulGourd || 0;
    const gourdN = Math.floor(killsNow / 3);
    if (gourd && gourdN > 0) {
      const end = this.dashPointAt(d.L);
      const radius = 82 + gourdN * 8 + gourd * 8;
      for (const e of this.enemies) {
        if (e.dead) continue;
        const a = G.util.angTo(e.x, e.y, end.x, end.y);
        e.kx += Math.cos(a) * 260; e.ky += Math.sin(a) * 260;
      }
      this.itemBurst(end.x, end.y, radius, s.dmg * this.permDmg * 0.38 * gourd * gourdN, 'purple', '收 魂');
    }

    if (n >= 6 && this.shopRelics.returnBell) {
      p.mana = Math.min(p.maxMana, p.mana + s.cost * 0.2);
      G.FX.text(p.x, p.y - 36, '神力返还', { size: 14, color: '#ffd98a' });
    }
    if (this.shopRelics.guardMirror && this.mirrorCd <= 0 && this.mirrorShield <= 0) {
      this.mirrorShield = 1;
      this.mirrorCd = 8;
      G.FX.ring(p.x, p.y, 72, 'gold', 4, 0.4);
      G.FX.text(p.x, p.y - 36, '神镜结界', { size: 14, color: '#ffe2a0' });
    }
    if (n >= 10 && s.comboShield > 0) {
      const gained = Math.min(s.comboShield, 36 - this.comboShield);
      this.comboShield += gained;
      if (gained > 0) {
        G.FX.ring(p.x, p.y, 86, 'teal', 3, 0.42);
        G.FX.text(p.x, p.y - 56, '连祓护印 +' + gained, { size: 15, color: '#b8ffe8' });
      }
    }
    const echoBell = this.shopRelics.eightEchoBell || 0;
    if (n >= 8 && echoBell > 0 && this.activeCooldown > 0) {
      const before = this.activeCooldown;
      this.activeCooldown = Math.max(0, this.activeCooldown - echoBell * 1.5);
      const cut = before - this.activeCooldown;
      if (cut > 0) G.FX.text(p.x, p.y - 70, '八 响 ・ 冷却 -' + cut.toFixed(1) + '秒', {
        size: 14, color: '#e2c3ff', crit: true
      });
    }
    const hourglass = this.shopRelics.stillHourglass || 0;
    if (n >= 12 && hourglass > 0) {
      const stop = 0.28 + hourglass * 0.24;
      for (const enemy of this.enemies)
        if (!enemy.dead) enemy.freezeT = Math.max(enemy.freezeT || 0, stop);
      const end = this.dashPointAt(d.L);
      G.FX.ring(end.x, end.y, 210 + hourglass * 35, 'cyan', 7, 0.58, 34);
      G.FX.text(end.x, end.y - 56, '止 界 ・ ' + stop.toFixed(2) + '秒', {
        size: 17, color: '#c7f2ff', crit: true
      });
    }
    this.bestCombo = Math.max(this.bestCombo, n);

    // 评级
    if (heat.tier) {
      G.FX.rating(heat.name, n, heat.color);
      if (n > this._bestRatingN) { this._bestRatingN = n; this.bestRating = heat.name.replace(/\s/g, ''); }
    }

    // 全屏反馈
    G.FX.shake(Math.min(16, 4 + n * 0.9), 0.35);
    if (n >= 6) G.FX.flash(Math.min(0.34, 0.08 + n * 0.016), '#dff4ff');
    // 居合一拍：全体伤口同时迸开的金属鸣响 + 全体顿帧
    G.Audio.tone({ f: 2600, f2: 820, dur: 0.12, type: 'square', vol: 0.07 });
    G.Audio.noise({ dur: 0.09, vol: 0.1, fFrom: 6500, fTo: 2600, q: 3 });
    G.Audio.purify(n);
    this.hitstop = Math.max(this.hitstop, n >= 6 ? 0.1 : 0.07);

    // 怪物掉落技能：根据本次祓除的命中、轨迹与击杀情况自动触发。
    const skillQueueStart = this.delayed.length;
    this.triggerSkills(hits, n, killsNow);
    this.triggerBuildResonances(hits, n, killsNow);
    // 连斩热度越高，自动技能越快进入画面；只压缩技能前摇，不叠加更多顿帧。
    for (let i = skillQueueStart; i < this.delayed.length; i++) this.delayed[i].t *= heat.haste;

    // 神祓：整条轨迹化为一次同步斩光，补切路径上未被锁定的敌人。
    if (heat.tier >= 4) this.castDivineTrail(d, heat);

    // 狐火
    if (s.fox > 0) {
      const need = Math.max(2, 6 - Math.min(s.fox, 3) - this.buildTier('familiar'));
      this.foxAcc += n;
      const end = this.dashPointAt(d.L);
      while (this.foxAcc >= need) {
        this.foxAcc -= need;
        this.foxfires.push(new G.Foxfire(p.x, p.y - 10, s.dmg, {
          trail: s.foxTrail, burst: s.foxBurst,
          endX: end.x, endY: end.y,
          trailPts: s.foxTrail ? d.pts.filter((_, idx) => idx % 4 === 0) : null
        }));
        if (this.shopRelics.foxTwin) {
          this.foxfires.push(new G.Foxfire(p.x + 10, p.y - 14, s.dmg, {
            trail: s.foxTrail, burst: s.foxBurst,
            endX: end.x, endY: end.y,
            trailPts: s.foxTrail ? d.pts.filter((_, idx) => idx % 4 === 0) : null
          }));
        }
        G.Audio.fox();
      }
    }

    // 全屏净化
    if (s.purge && n >= Math.max(9, 12 - (this.shopRelics.purgeSeal || 0))) {
      G.FX.flash(0.55, '#fff0f8');
      G.FX.shake(22, 0.55);
      G.FX.banner('神 威 ・ 全 祓');
      G.Audio.purify(16);
      for (const e of this.enemies.slice()) {
        if (e.dead) continue;
        G.FX.petals(e.x, e.y, 4);
        if (e.hurt(s.dmg * 0.8, this, {})) { this.deathFX(e); this.onKill(e); }
      }
      if (this.boss && !this.boss.dead) this.hurtBoss(s.dmg * 0.8, {});
    }
    this.comboFadeT = 1.1;
  }

  startSuperPurge(seeds, heat) {
    const baseDmg = this.player.stats.dmg * this.permDmg;
    const processed = new Set(seeds.map(seed => seed.source));
    const maxBursts = 12 + heat.tier * 4;
    let burstCount = 0;

    const queueBurst = (seed, generation, delay) => {
      if (burstCount >= maxBursts) return;
      // 预占名额，避免同一帧的多个初始超祓突破总上限。
      burstCount++;
      this.delayed.push({
        t: delay, fn: () => {
          const radius = 84 + heat.tier * 8 + Math.min(28, seed.excess * 0.35);
          const dmg = G.util.clamp(
            seed.excess * 0.55,
            baseDmg * 0.5,
            baseDmg * (1.25 + heat.tier * 0.2)
          );
          this.lastSuperPurge++;
          G.FX.ring(seed.source.x, seed.source.y, radius, 'spirit', 3.5, 0.34, 12);
          G.FX.burst(seed.source.x, seed.source.y, 'purple', 9, 220, 11, 0.34);
          G.FX.text(seed.source.x, seed.source.y - 34, generation ? '超 祓・連' : '超 祓', {
            size: generation ? 14 : 17, color: '#f0c8ff', crit: !generation
          });
          if (this.lastSuperPurge === 1) {
            G.Audio.tone({ f: 620, f2: 1380, dur: 0.16, type: 'triangle', vol: 0.055 });
          }

          for (const enemy of this.enemies.slice()) {
            if (enemy.dead || processed.has(enemy)) continue;
            if (G.util.dist2(seed.source.x, seed.source.y, enemy.x, enemy.y) >
              (radius + enemy.r) * (radius + enemy.r)) continue;
            processed.add(enemy);
            const hpBefore = enemy.hp;
            const effectiveDmg = dmg * ((enemy.vulnT || 0) > 0 ? 1.25 : 1);
            this.hurtEnemy(enemy, dmg, {});
            const excess = effectiveDmg - hpBefore;
            if (enemy.dead && generation < 2 && excess >= Math.max(6, enemy.maxHp * 0.22)) {
              queueBurst({ source: enemy, excess }, generation + 1, 0.065);
            }
          }
          if (this.boss && !this.boss.dead &&
            G.util.dist2(seed.source.x, seed.source.y, this.boss.x, this.boss.y) <=
            (radius + this.boss.r) * (radius + this.boss.r)) {
            this.hurtBoss(dmg * 0.42, {});
          }
        }
      });
    };

    const starters = seeds
      .slice()
      .sort((a, b) => b.excess - a.excess)
      .slice(0, Math.min(seeds.length, 6 + heat.tier * 2));
    starters.forEach((seed, i) => queueBurst(seed, 0, 0.035 + i * 0.018));
  }

  castDivineTrail(dash, heat) {
    const path = {
      pts: dash.pts.map(p => ({ x: p.x, y: p.y })),
      cum: dash.cum.slice(),
      L: dash.L
    };
    const dmg = this.player.stats.dmg * this.permDmg * 0.82;
    this.delayed.push({
      t: 0.08 * heat.haste, fn: () => {
        G.FX.windTrail(path.pts, 3);
        G.FX.flash(0.14, '#fff0fb');
        G.FX.shake(8, 0.24);
        for (let distance = 36; distance < path.L; distance += 82) {
          const point = this.pathPointAt(path, distance);
          G.FX.slash(point.x, point.y, point.ang + Math.PI * 0.5, 145, 'pink');
        }
        const width = 48;
        for (const enemy of this.enemies.slice()) {
          if (enemy.dead) continue;
          let near = false;
          for (let i = 0; i < path.pts.length - 1; i++) {
            if (G.util.dSeg(enemy.x, enemy.y,
              path.pts[i].x, path.pts[i].y, path.pts[i + 1].x, path.pts[i + 1].y).d <= width + enemy.r) {
              near = true; break;
            }
          }
          if (near) this.hurtEnemy(enemy, dmg, {});
        }
        if (this.boss && !this.boss.dead) {
          for (let i = 0; i < path.pts.length - 1; i++) {
            if (G.util.dSeg(this.boss.x, this.boss.y,
              path.pts[i].x, path.pts[i].y, path.pts[i + 1].x, path.pts[i + 1].y).d <= width + this.boss.r) {
              this.hurtBoss(dmg * 0.55, {});
              break;
            }
          }
        }
        const mid = this.pathPointAt(path, path.L * 0.5);
        G.FX.text(mid.x, mid.y - 44, '神 祓・一 闪', { size: 22, color: '#ffc8ea', crit: true });
        G.Audio.tone({ f: 1900, f2: 340, dur: 0.18, type: 'square', vol: 0.07 });
      }
    });
  }

  triggerBuildResonances(hits, n, killsNow) {
    const d = this.dash;
    if (!d || !d.pathData) return;
    const form = d.pathData.form;
    const base = this.player.stats.dmg * this.permDmg;

    // 断界大成：合格的直线或交错轨迹在主祓除之后整线再断一次。
    if (this.buildTier('sever') >= 2 && form && form.ready &&
      G.BUILD_ARCHETYPES.sever.forms.includes(form.id)) {
      const path = {
        pts: d.pts.map(p => ({ x: p.x, y: p.y })),
        cum: d.cum.slice(), L: d.L
      };
      this.delayed.push({
        t: 0.13, fn: () => {
          G.FX.windTrail(path.pts, 2);
          G.FX.flash(0.1, '#e9fbff');
          const mid = this.pathPointAt(path, path.L * 0.5);
          G.FX.text(mid.x, mid.y - 38, '断 界・余 斩', {
            size: 19, color: '#d8f8ff', crit: true
          });
          for (const enemy of this.enemies.slice()) {
            if (enemy.dead) continue;
            let near = false;
            for (let i = 0; i < path.pts.length - 1; i++) {
              if (G.util.dSeg(enemy.x, enemy.y, path.pts[i].x, path.pts[i].y,
                path.pts[i + 1].x, path.pts[i + 1].y).d <= 38 + enemy.r) {
                near = true; break;
              }
            }
            if (near) this.hurtEnemy(enemy, base * 0.42, {});
          }
          if (this.boss && !this.boss.dead) {
            for (let i = 0; i < path.pts.length - 1; i++) {
              if (G.util.dSeg(this.boss.x, this.boss.y, path.pts[i].x, path.pts[i].y,
                path.pts[i + 1].x, path.pts[i + 1].y).d <= 38 + this.boss.r) {
                this.hurtBoss(base * 0.28, {}); break;
              }
            }
          }
          G.Audio.tone({ f: 1760, f2: 330, dur: 0.16, type: 'square', vol: 0.055 });
        }
      });
    }

    // 重巡大成：三次主祓除形成一枚返刃，单一目标每笔至多追加两枚。
    if (this.buildTier('repeat') >= 2) {
      const counts = new Map();
      for (const hit of hits)
        if (!hit.t.isOrb) counts.set(hit.t, (counts.get(hit.t) || 0) + 1);
      for (const [target, count] of counts) {
        const extra = Math.min(2, Math.floor(count / 3));
        for (let i = 0; i < extra; i++) {
          this.delayed.push({
            t: 0.1 + i * 0.07, fn: () => {
              if (target.dead || (target.isBoss && this.boss !== target)) return;
              G.FX.slash(target.x, target.y, 2.35 - i * 0.7, target.r * 4 + 34, 'pink');
              G.FX.gash(target.x, target.y, 2.35 - i * 0.7, target.r);
              if (!i) G.FX.text(target.x, target.y - target.r - 24, '返 祓・残 刃', {
                size: 16, color: '#ffbddb', crit: true
              });
              this.hurtEnemy(target, base * 0.34, {});
            }
          });
        }
      }
    }

    // 封界大成：闭环或螺旋会在几何中心留下短暂净域并持续聚拢。
    if (this.buildTier('ward') >= 2 && form && form.ready &&
      G.BUILD_ARCHETYPES.ward.forms.includes(form.id)) {
      const center = form.center || this.pathPointAt(d, d.L);
      this.zones.push(new G.Zone(center.x, center.y, base * 0.2, {
        r: 96, life: 3.2, kind: 'ward'
      }));
      for (const enemy of this.enemies) {
        if (enemy.dead || G.util.dist2(center.x, center.y, enemy.x, enemy.y) > 280 * 280) continue;
        const ang = G.util.angTo(enemy.x, enemy.y, center.x, center.y);
        enemy.kx += Math.cos(ang) * 330;
        enemy.ky += Math.sin(ang) * 330;
      }
      G.FX.ring(center.x, center.y, 112, 'teal', 5, 0.5, 28);
      G.FX.text(center.x, center.y - 56, '封 界・聚 灵', {
        size: 18, color: '#baffea', crit: true
      });
    }

    // 御札大成：连接三名不同目标便放出一枚不触发二次秘法的追命式神。
    const uniqueTargets = new Set(hits.map(hit => hit.t).filter(t => !t.isOrb));
    if (this.buildTier('familiar') >= 2 && uniqueTargets.size >= 3) {
      const end = this.dashPointAt(d.L);
      this.foxfires.push(new G.Foxfire(this.player.x, this.player.y - 12, base * 0.52, {
        itemSoul: true, endX: end.x, endY: end.y
      }));
      G.FX.papers(this.player.x, this.player.y, 5);
      G.FX.text(this.player.x, this.player.y - 46, '追 命・式 神', {
        size: 16, color: '#ffe6a8', crit: true
      });
    }
  }

  triggerSkills(hits, n, killsNow) {
    const stormCut = this.buildTier('storm') > 0 ? 1 : 0;
    const wardCut = this.buildTier('ward') > 0 ? 1 : 0;
    const familiarCut = this.buildTier('familiar') > 0 ? 1 : 0;
    const severCut = this.buildTier('sever') > 0 ? 1 : 0;
    const repeatTier = this.buildTier('repeat');
    let lv = this.skills.thunder || 0;
    if (lv && n >= Math.max(2, G.SKILLS.thunder.triggerAt[lv - 1] - stormCut)) this.castThunder(hits, lv);

    lv = this.skills.chainLightning || 0;
    if (lv && n >= Math.max(2, G.SKILLS.chainLightning.triggerAt[lv - 1] - stormCut)) this.castChainLightning(hits, lv);

    lv = this.skills.pursuit || 0;
    if (lv && n >= Math.max(2, G.SKILLS.pursuit.triggerAt[lv - 1] - familiarCut)) this.castPursuit(hits, lv);

    lv = this.skills.scatter || 0;
    if (lv && n >= Math.max(2, G.SKILLS.scatter.triggerAt[lv - 1] - wardCut)) this.castScatter(hits, lv);

    lv = this.skills.starfall || 0;
    if (lv && n >= Math.max(2, G.SKILLS.starfall.triggerAt[lv - 1] - stormCut)) this.castStarfall(hits, lv);

    lv = this.skills.severance || 0;
    if (lv && killsNow >= Math.max(1, G.SKILLS.severance.killsAt[lv - 1] - severCut)) this.castSeverance(hits, lv);

    lv = this.skills.tide || 0;
    if (lv && n >= Math.max(2, G.SKILLS.tide.triggerAt[lv - 1] - wardCut)) this.castTide(hits, lv);

    lv = this.skills.flame || 0;
    if (lv && n >= Math.max(2, G.SKILLS.flame.triggerAt[lv - 1] - wardCut)) this.castFlame(lv);

    lv = this.skills.frost || 0;
    if (lv && n >= Math.max(2, G.SKILLS.frost.triggerAt[lv - 1] - wardCut)) this.castFrost(hits, lv);

    lv = this.skills.gale || 0;
    const routeUse = this.player.stats.trailLen > 0 ? this.trailLen / this.player.stats.trailLen : 0;
    const galeNeed = lv ? Math.max(0.35,
      G.SKILLS.gale.lengthAt[lv - 1] - (this.shopRelics.galeFeather || 0) * 0.04 - severCut * 0.08) : 1;
    if (lv && n > 0 && routeUse >= galeNeed) this.castGale(hits, lv);

    lv = this.skills.moon || 0;
    if (lv && n > 0 && n <= G.SKILLS.moon.maxHits[lv - 1] + repeatTier) this.castMoon(hits, lv);

    lv = this.skills.renewal || 0;
    if (lv && this.renewalCd <= 0 &&
      killsNow >= Math.max(1, G.SKILLS.renewal.killsAt[lv - 1] - familiarCut))
      this.castRenewal(hits, killsNow, lv);
  }

  // 落雷：所有天雷在同一帧落下，强调同步轰击而非目标间传播。
  castThunder(hits, lv) {
    const def = G.SKILLS.thunder;
    const s = this.player.stats;
    const thunderDrum = this.shopRelics.thunderDrum || 0;
    const thunderNeedle = this.shopRelics.thunderNeedle || 0;
    const stormTier = this.buildTier('storm');
    const targets = hits.map(h => h.t).filter(t => !t.isOrb)
      .slice(0, def.maxTargets[lv - 1] + thunderDrum * 2 + stormTier * 2);
    if (!targets.length) return;
    const dmg = s.dmg * this.permDmg * def.dmgMul[lv - 1] *
      (1 + thunderNeedle * 0.2) * (1 + stormTier * 0.1);
    this.delayed.push({
      t: 0.06, fn: () => {
        this.hitstop = Math.max(this.hitstop, 0.085);
        G.FX.shake(9.5, 0.25);
        G.FX.flash(0.22, '#eee8ff');
        G.Audio.thunder();
        const uniqueTargets = [...new Set(targets)];
        const frozenCenters = lv >= 3 && this.skills.frost
          ? uniqueTargets.filter(t => (t.freezeT || 0) > 0).slice(0, 3)
          : [];
        targets.forEach((t, i) => {
          G.FX.bolt(t.x, t.y - 400, t.x, t.y, { w: 5, life: 0.24 });
          G.FX.glow(t.x, t.y, 'white', 26, 0.18);
          G.FX.burst(t.x, t.y, 'purple', 8, 220, 12, 0.3);
          G.FX.ring(t.x, t.y, 60, 'purple', 3, 0.3);
          if (i > 0) {
            const prev = targets[i - 1];
            G.FX.bolt(prev.x, prev.y, t.x, t.y, { w: 3, life: 0.2 });
          }
          if (t.isBoss) {
            G.FX.text(t.x + G.util.rand(-30, 30), t.y - 70, Math.round(dmg) + '', { size: 16, color: '#c99aff' });
            this.hurtBoss(dmg, {});
          } else if (!t.dead) {
            G.FX.text(t.x, t.y - t.r - 14, Math.round(dmg) + '', { size: 15, color: '#c99aff' });
            if (t.hurt(dmg, this, {})) { this.deathFX(t); this.onKill(t); }
          }
        });
        // 神通・天罚：仍只惩戒本次锁定目标，与向场外传播的链雷分工明确。
        if (lv >= 3) {
          // 紫电与霜华联动：轰击冻结目标时，引爆小范围雷霜。
          for (const center of frozenCenters) {
            this.itemBurst(center.x, center.y, 74, dmg * 0.34, 'teal', '雷 霜');
          }
          this.delayed.push({
            t: 0.12, fn: () => {
              const survivors = uniqueTargets.filter(t => t.isBoss ? this.boss === t : !t.dead);
              if (!survivors.length) return;
              G.Audio.thunder();
              G.FX.flash(0.13, '#f4efff');
              G.FX.shake(6.5, 0.18);
              for (const t of survivors) {
                G.FX.bolt(t.x + 18, t.y - 380, t.x, t.y, { w: 3.8, life: 0.2 });
                G.FX.ring(t.x, t.y, 48, 'white', 2.5, 0.24);
                this.hurtEnemy(t, dmg * 0.4, {});
              }
              G.FX.text(survivors[0].x, survivors[0].y - 64, '天 罚', {
                size: 17, color: '#eee8ff', crit: true
              });
            }
          });
        }
      }
    });
    G.FX.flash(0.12, '#e8d8ff');
  }

  // 链雷：以最后一个已锁定目标为起点，只向本次没有锁定的敌人传播。
  castChainLightning(hits, lv) {
    const def = G.SKILLS.chainLightning;
    const locked = new Set(hits.map(h => h.t));
    const sources = [...new Set(hits.map(h => h.t).filter(t => t && !t.isOrb))];
    const first = sources[sources.length - 1];
    if (!first) return;

    const pool = this.enemies.filter(e => !e.dead && !locked.has(e));
    if (this.boss && !this.boss.dead && !locked.has(this.boss)) pool.push(this.boss);
    const stormTier = this.buildTier('storm');
    const range = def.range[lv - 1] * (1 + stormTier * 0.14);
    const range2 = range * range;
    const maxLinks = def.maxLinks[lv - 1] + stormTier * 2;
    const visited = new Set();
    const route = [];
    let from = first;

    while (route.length < maxLinks) {
      let next = null, best = range2;
      for (const target of pool) {
        if (visited.has(target) || target.dead) continue;
        const d2 = G.util.dist2(from.x, from.y, target.x, target.y);
        if (d2 <= best) { best = d2; next = target; }
      }
      if (!next) break;
      route.push({ from, target: next });
      visited.add(next);
      from = next;
    }
    if (!route.length) return;

    const dmg = this.player.stats.dmg * this.permDmg * def.dmgMul[lv - 1] *
      (1 + stormTier * 0.1);
    route.forEach((link, i) => {
      this.delayed.push({
        t: 0.06 + i * 0.075, fn: () => {
          const target = link.target;
          if (target.dead || (target.isBoss && this.boss !== target)) return;
          G.FX.bolt(link.from.x, link.from.y, target.x, target.y, {
            w: 5.2 + lv * 1.05, life: 0.42
          });
          // 内层白色电芯让粗电弧仍保持锐利，不会只剩一条模糊紫带。
          G.FX.bolt(link.from.x, link.from.y, target.x, target.y, {
            w: 1.8 + lv * 0.35, life: 0.36
          });
          G.FX.glow(target.x, target.y, 'purple', 22 + lv * 4, 0.34);
          G.FX.ring(target.x, target.y, 42 + lv * 5, 'purple', 2.8, 0.38);
          G.FX.text(target.x, target.y - target.r - 18, '链 ' + (i + 1), {
            size: 14, color: '#d8b8ff'
          });
          if (i === 0) {
            G.Audio.tone({ f: 1550, f2: 820, dur: 0.18, type: 'square', vol: 0.055 });
            G.FX.text(link.from.x, link.from.y - 56, '链 雷', {
              size: 18, color: '#d8b8ff', crit: true
            });
          }
          this.hurtEnemy(target, dmg, {});
          if (lv >= 3 && i === route.length - 1) {
            this.itemBurst(target.x, target.y, 88, dmg * 0.45, 'purple', '雷 网');
          }
        }
      });
    });
  }

  // 追符：从轨迹终点飞向距离最近的场外目标，一枚符只追一个敌人。
  castPursuit(hits, lv) {
    const def = G.SKILLS.pursuit;
    const locked = new Set(hits.map(h => h.t));
    const origin = this.dash
      ? this.dashPointAt(this.dash.L)
      : { x: this.player.x, y: this.player.y };
    const targets = this.enemies
      .filter(e => !e.dead && !locked.has(e))
      .sort((a, b) =>
        G.util.dist2(origin.x, origin.y, a.x, a.y) -
        G.util.dist2(origin.x, origin.y, b.x, b.y));
    if (this.boss && !this.boss.dead && !locked.has(this.boss)) targets.push(this.boss);
    const familiarTier = this.buildTier('familiar');
    const chosen = targets.slice(0, def.shots[lv - 1] + familiarTier);
    if (!chosen.length) return;
    const dmg = this.player.stats.dmg * this.permDmg * def.dmgMul[lv - 1] *
      (1 + familiarTier * 0.12);

    G.FX.papers(origin.x, origin.y, 3 + lv * 2);
    G.FX.text(origin.x, origin.y - 42, '追 符', { size: 18, color: '#ffe7a8', crit: true });
    chosen.forEach((target, i) => {
      this.delayed.push({
        t: 0.07 + i * 0.045, fn: () => {
          if (target.dead || (target.isBoss && this.boss !== target)) return;
          G.FX.bolt(origin.x, origin.y, target.x, target.y, { w: 1.6, life: 0.16 });
          G.FX.papers(target.x, target.y, 2, G.util.angTo(origin.x, origin.y, target.x, target.y));
          G.FX.slash(target.x, target.y, -0.7, target.r * 3.1 + 24, 'gold');
          G.FX.burst(target.x, target.y, 'gold', 5, 170, 9, 0.26);
          this.hurtEnemy(target, dmg, {});
          if (lv >= 3 && i === chosen.length - 1) {
            this.itemBurst(target.x, target.y, 92, dmg * 0.55, 'gold', '百 羽');
          }
        }
      });
    });
    G.Audio.tone({ f: 1280, f2: 1960, dur: 0.16, type: 'triangle', vol: 0.055 });
  }

  // 散华：把未锁定敌人作为落点候选，自动寻找最密集的一簇。
  castScatter(hits, lv) {
    const def = G.SKILLS.scatter;
    const locked = new Set(hits.map(h => h.t));
    const candidates = this.enemies.filter(e => !e.dead && !locked.has(e));
    if (!candidates.length) return;
    const wardTier = this.buildTier('ward');
    const radius = def.radius[lv - 1] + wardTier * 12;
    let center = candidates[0], bestCount = -1;
    for (const candidate of candidates) {
      let count = 0;
      for (const e of this.enemies) {
        if (!e.dead && G.util.dist2(candidate.x, candidate.y, e.x, e.y) <= radius * radius) count++;
      }
      if (count > bestCount) { bestCount = count; center = candidate; }
    }
    const x = center.x, y = center.y;
    const dmg = this.player.stats.dmg * this.permDmg * def.dmgMul[lv - 1] *
      (1 + wardTier * 0.08);
    G.FX.ring(x, y, radius * 0.72, 'pink', 2, 0.16, radius);
    this.delayed.push({
      t: 0.12, fn: () => {
        G.FX.petals(x, y, 18 + lv * 7, radius * 0.9);
        G.FX.ring(x, y, radius, 'pink', 6, 0.42, 20);
        G.FX.burst(x, y, 'purple', 18, 290, 13, 0.42);
        G.FX.glow(x, y, 'pink', radius * 0.6, 0.34);
        G.FX.text(x, y - radius * 0.55, '散 华', { size: 20, color: '#ffc7e5', crit: true });
        G.FX.shake(5 + lv, 0.22);
        G.Audio.tone({ f: 760, f2: 1640, dur: 0.2, type: 'sine', vol: 0.065 });
        this.itemBurst(x, y, radius, dmg, 'pink');
        if (lv >= 3) {
          this.delayed.push({
            t: 0.13, fn: () => {
              G.FX.ring(x, y, radius * 0.58, 'white', 5, 0.32, 14);
              G.FX.petals(x, y, 24, radius * 0.55);
              this.itemBurst(x, y, radius * 0.58, dmg * 0.55, 'purple', '万 华');
            }
          });
        }
      }
    });
  }

  // 星坠：逐颗锁定本次轨迹之外的目标，较厚敌人优先承受星光。
  castStarfall(hits, lv) {
    const def = G.SKILLS.starfall;
    const locked = new Set(hits.map(h => h.t));
    const bell = this.shopRelics.starBell || 0;
    const stormTier = this.buildTier('storm');
    const count = def.count[lv - 1] + bell + stormTier;
    const targets = this.enemies
      .filter(e => !e.dead && !locked.has(e))
      .sort((a, b) => (b.hp || 0) - (a.hp || 0))
      .slice(0, count);
    if (!targets.length) return;
    const dmg = this.player.stats.dmg * this.permDmg * def.dmgMul[lv - 1] *
      (1 + bell * 0.15) * (1 + stormTier * 0.1);
    targets.forEach((target, i) => {
      this.delayed.push({
        t: 0.07 + i * 0.055, fn: () => {
          if (target.dead) return;
          G.FX.bolt(target.x + G.util.rand(-80, 80), target.y - 360, target.x, target.y, {
            w: 3.6 + lv * 0.5, life: 0.3
          });
          G.FX.ring(target.x, target.y, 42 + lv * 5, 'gold', 3, 0.3);
          G.FX.burst(target.x, target.y, 'gold', 7, 190, 10, 0.32);
          if (i === 0) G.FX.text(target.x, target.y - 54, '星 坠', {
            size: 18, color: '#fff0a8', crit: true
          });
          this.hurtEnemy(target, dmg, {});
          if (lv >= 3 && i === targets.length - 1)
            this.itemBurst(target.x, target.y, 105 + bell * 12, dmg * 0.58, 'gold', '天 穹');
        }
      });
    });
    G.Audio.tone({ f: 1260, f2: 2240, dur: 0.2, type: 'sine', vol: 0.055 });
  }

  // 断魂：选择场外高生命目标，形成针对后期重甲怪与精英的追斩。
  castSeverance(hits, lv) {
    const def = G.SKILLS.severance;
    const locked = new Set(hits.map(h => h.t));
    const ink = this.shopRelics.severanceInk || 0;
    const targets = this.enemies
      .filter(e => !e.dead && !locked.has(e))
      .sort((a, b) => (b.hp || 0) - (a.hp || 0))
      .slice(0, def.targets[lv - 1] + ink);
    if (this.boss && !this.boss.dead && !locked.has(this.boss)) targets.unshift(this.boss);
    if (!targets.length) return;
    const chosen = targets.slice(0, def.targets[lv - 1] + ink);
    const dmg = this.player.stats.dmg * this.permDmg * def.dmgMul[lv - 1] *
      (1 + ink * 0.2) * (1 + this.buildTier('sever') * 0.1);
    this.delayed.push({
      t: 0.1, fn: () => {
        for (let i = 0; i < chosen.length; i++) {
          const target = chosen[i];
          if (target.dead || (target.isBoss && this.boss !== target)) continue;
          const ang = -0.82 + i * 0.24;
          G.FX.moonBreak(target.x, target.y, target.r, Math.max(1, lv));
          G.FX.slash(target.x, target.y, ang, target.r * 5 + 80, 'pink');
          G.FX.gash(target.x, target.y, ang, target.r * 1.15);
          G.FX.text(target.x, target.y - target.r - 28, i ? '彼 岸' : '断 魂', {
            size: 18, color: '#ffb5d4', crit: true
          });
          this.hurtEnemy(target, target.isBoss ? dmg * 0.55 : dmg, {});
        }
        G.FX.shake(6 + lv, 0.22);
        G.Audio.tone({ f: 1580, f2: 260, dur: 0.18, type: 'square', vol: 0.065 });
        if (lv >= 3 && chosen.length >= 2) {
          const affected = new Set();
          for (let i = 0; i < chosen.length - 1; i++) {
            const a = chosen[i], b = chosen[i + 1];
            G.FX.bolt(a.x, a.y, b.x, b.y, { w: 3.2, life: 0.32 });
            for (const e of this.enemies) {
              if (!e.dead && !chosen.includes(e) &&
                G.util.dSeg(e.x, e.y, a.x, a.y, b.x, b.y).d <= 34 + e.r) affected.add(e);
            }
          }
          for (const e of affected) this.hurtEnemy(e, dmg * 0.48, {});
        }
      }
    });
  }

  // 灵潮：将终点附近未锁定敌人拉向潮心，为下一笔制造密集目标。
  castTide(hits, lv) {
    const def = G.SKILLS.tide;
    const locked = new Set(hits.map(h => h.t));
    const pearl = this.shopRelics.tidePearl || 0;
    const end = this.dash ? this.dashPointAt(this.dash.L) : { x: this.player.x, y: this.player.y };
    const wardTier = this.buildTier('ward');
    const radius = def.radius[lv - 1] + pearl * 25 + wardTier * 18;
    const dmg = this.player.stats.dmg * this.permDmg * def.dmgMul[lv - 1] *
      (1 + pearl * 0.15) * (1 + wardTier * 0.08);
    const affected = this.enemies.filter(e =>
      !e.dead && !locked.has(e) &&
      G.util.dist2(end.x, end.y, e.x, e.y) <= (radius + e.r) * (radius + e.r));
    if (!affected.length) return;
    this.delayed.push({
      t: 0.08, fn: () => {
        G.FX.ring(end.x, end.y, radius, 'teal', 6, 0.5, radius * 0.25);
        G.FX.burst(end.x, end.y, 'teal', 20, 260, 13, 0.48);
        G.FX.text(end.x, end.y - 52, '灵 潮', { size: 20, color: '#a8ffe8', crit: true });
        for (const e of affected) {
          if (e.dead) continue;
          const a = G.util.angTo(e.x, e.y, end.x, end.y);
          e.kx += Math.cos(a) * 380; e.ky += Math.sin(a) * 380;
          this.hurtEnemy(e, dmg, {});
        }
        G.Audio.tone({ f: 380, f2: 1040, dur: 0.28, type: 'sine', vol: 0.065 });
        if (lv >= 3) {
          this.delayed.push({
            t: 0.18, fn: () => {
              G.FX.ring(end.x, end.y, radius * 0.68, 'white', 5, 0.38, radius * 0.1);
              this.itemBurst(end.x, end.y, radius * 0.68, dmg * 0.55, 'teal', '归 海');
            }
          });
        }
      }
    });
  }

  // 天火：长连击后在轨迹终点制造范围爆发。
  castFlame(lv) {
    const def = G.SKILLS.flame;
    const s = this.player.stats;
    const chalice = this.shopRelics.flameChalice || 0;
    const end = this.dash ? this.dashPointAt(this.dash.L) : { x: this.player.x, y: this.player.y };
    const wardTier = this.buildTier('ward');
    const radius = def.radius[lv - 1] + chalice * 12 + wardTier * 10;
    const dmg = s.dmg * this.permDmg * def.dmgMul[lv - 1] *
      (1 + chalice * 0.15) * (1 + wardTier * 0.08);
    // 先显现收束的火轮，随后火柱贯下，给玩家一个极短但可辨识的预兆。
    G.FX.ring(end.x, end.y, radius * 0.72, 'red', 2.5, 0.16, radius);
    this.delayed.push({
      t: 0.08, fn: () => {
        G.FX.flamePillar(end.x, end.y, radius, lv);
        G.FX.ring(end.x, end.y, radius, 'gold', 7, 0.45, 20);
        G.FX.burst(end.x, end.y, 'red', 24, 320, 18, 0.5);
        G.FX.glow(end.x, end.y, 'gold', radius * 0.72, 0.36);
        G.FX.text(end.x, end.y - radius * 0.45, '天 火', { size: 22, color: '#ffb26b', crit: true });
        G.FX.shake(8 + lv, 0.26);
        G.FX.flash(0.1 + lv * 0.02, '#ffb06a');
        G.Audio.tone({ f: 180, f2: 72, dur: 0.22, type: 'sawtooth', vol: 0.055 });
        G.Audio.noise({ dur: 0.18, vol: 0.08, fFrom: 1800, fTo: 380, q: 2 });
        for (const e of this.enemies.slice()) {
          if (!e.dead && G.util.dist2(e.x, e.y, end.x, end.y) <= (radius + e.r) * (radius + e.r)) {
            this.hurtEnemy(e, dmg, {});
          }
        }
        if (this.boss && !this.boss.dead &&
          G.util.dist2(this.boss.x, this.boss.y, end.x, end.y) <= (radius + this.boss.r) * (radius + this.boss.r)) {
          this.hurtBoss(dmg, {});
        }
        // 神通・焦土：让终点爆发转化为可被聚怪构筑利用的持续火域。
        if (lv >= 3) {
          this.zones.push(new G.Zone(end.x, end.y, s.dmg * this.permDmg * 0.42, {
            r: radius * 0.68, life: 4, kind: 'flame'
          }));
          G.FX.text(end.x, end.y + radius * 0.46, '焦 土', { size: 17, color: '#ffc06f', crit: true });
        }
      }
    });
  }

  // 霜华：追加伤害并暂时冻结所有本次锁定的普通敌人。
  castFrost(hits, lv) {
    const def = G.SKILLS.frost;
    const s = this.player.stats;
    const hairpin = this.shopRelics.frostHairpin || 0;
    const targets = [...new Set(hits.map(h => h.t).filter(t => !t.isOrb))];
    const wardTier = this.buildTier('ward');
    const duration = def.duration[lv - 1] + hairpin * 0.3 + wardTier * 0.12;
    const dmg = s.dmg * this.permDmg * def.dmgMul[lv - 1] * (1 + wardTier * 0.08);
    if (!targets.length) return;
    this.delayed.push({
      t: 0.06, fn: () => {
        G.Audio.tone({ f: 1100, f2: 1700, dur: 0.18, type: 'triangle', vol: 0.09 });
        G.Audio.noise({ dur: 0.12, vol: 0.035, fFrom: 5200, fTo: 2200, q: 6 });
        G.FX.frostBind(targets.map(t => ({ x: t.x, y: t.y })), lv);
        let fx = 0, fy = 0;
        for (const t of targets) { fx += t.x; fy += t.y; }
        G.FX.text(fx / targets.length, fy / targets.length - 42, '霜 华', {
          size: 20, color: '#c8fbff', crit: true
        });
        for (const t of targets) {
          if (t.isBoss) {
            if (this.boss && !this.boss.dead) {
              this.boss.staggerT = Math.max(this.boss.staggerT, duration * 0.6);
              G.FX.ring(t.x, t.y, t.r * 1.5, 'teal', 3, 0.35);
              this.hurtBoss(dmg, {});
            }
          } else if (!t.dead) {
            t.freezeT = Math.max(t.freezeT || 0, duration);
            G.FX.burst(t.x, t.y, 'teal', 6, 100, 9, 0.36);
            G.FX.ring(t.x, t.y, t.r * 1.8, 'teal', 2, 0.35);
            this.hurtEnemy(t, dmg, {});
          }
        }
        G.FX.flash(0.09, '#d8ffff');
        G.FX.shake(2.5 + lv * 0.7, 0.16);
        if (lv >= 3) {
          for (const t of targets) {
            if (!t.isBoss && !t.dead) t.vulnT = Math.max(t.vulnT || 0, duration + 0.2);
          }
          // 神通・冰葬：冰封结束时统一碎裂，重叠冰晶只对同一敌人结算一次。
          this.delayed.push({
            t: duration, fn: () => {
              const centers = targets.filter(t => !t.dead).slice(0, 8);
              const shatterR = 72 + hairpin * 12;
              const affected = new Set();
              for (const c of centers) {
                G.FX.ring(c.x, c.y, shatterR, 'teal', 3, 0.34, 18);
                G.FX.burst(c.x, c.y, 'teal', 7, 180, 10, 0.34);
                for (const e of this.enemies) {
                  if (!e.dead && G.util.dist2(c.x, c.y, e.x, e.y) <= (shatterR + e.r) * (shatterR + e.r)) affected.add(e);
                }
              }
              const shatterDmg = s.dmg * this.permDmg * 0.42;
              for (const e of affected) this.hurtEnemy(e, shatterDmg, {});
              if (this.boss && !this.boss.dead && centers.some(c =>
                G.util.dist2(c.x, c.y, this.boss.x, this.boss.y) <= (shatterR + this.boss.r) * (shatterR + this.boss.r))) {
                this.hurtBoss(shatterDmg * 0.7, {});
              }
              if (centers.length) {
                G.FX.text(centers[0].x, centers[0].y - 46, '冰 葬', { size: 18, color: '#d8ffff', crit: true });
                G.Audio.noise({ dur: 0.14, vol: 0.05, fFrom: 4600, fTo: 1300, q: 5 });
              }
            }
          });
        }
      }
    });
  }

  // 风刃：轨迹画得足够长时，再切过本次所有锁定目标。
  castGale(hits, lv) {
    const def = G.SKILLS.gale;
    const s = this.player.stats;
    const feather = this.shopRelics.galeFeather || 0;
    const targets = [...new Set(hits.map(h => h.t).filter(t => !t.isOrb))];
    const dmg = s.dmg * this.permDmg * def.dmgMul[lv - 1] *
      (1 + feather * 0.18) * (1 + this.buildTier('sever') * 0.1);
    const windPts = this.dash && this.dash.pts && this.dash.pts.length > 1
      ? this.dash.pts.map(p => ({ x: p.x, y: p.y }))
      : targets.map(t => ({ x: t.x, y: t.y }));
    const turnCount = lv >= 3 && this.dash ? this.pathItemAnalysis(this.dash).turns.length : 0;
    if (!targets.length) return;
    this.delayed.push({
      t: 0.1, fn: () => {
        G.Audio.tone({ f: 900, f2: 2100, dur: 0.13, type: 'sawtooth', vol: 0.07 });
        G.Audio.noise({ dur: 0.16, vol: 0.055, fFrom: 900, fTo: 4200, q: 2 });
        G.FX.windTrail(windPts, lv);
        const mid = windPts[Math.floor(windPts.length / 2)] || windPts[0];
        if (mid) G.FX.text(mid.x, mid.y - 34, '风 刃', { size: 19, color: '#baffea', crit: true });
        G.FX.shake(3.5 + lv * 0.6, 0.18);
        targets.forEach((t, i) => {
          if (t.dead) return;
          const ang = this.dash && this.dash.hits[i] ? this.dash.hits[i].ang + 0.55 : -0.55;
          G.FX.slash(t.x, t.y, ang, t.r * 3.8, 'teal');
          G.FX.slash(t.x, t.y, ang - 1.1, t.r * 3.2, 'gold');
          G.FX.burstDir(t.x, t.y, ang, 'teal', 6, 260, 10, 0.32);
          this.hurtEnemy(t, dmg, {});
        });
        // 神通・返岚：沿反向轨迹再切一次，明显转折会蓄积返岚威力。
        if (lv >= 3) {
          this.delayed.push({
            t: 0.16, fn: () => {
              const reverseMul = 0.55 + Math.min(4, turnCount) * 0.1;
              G.FX.windTrail(windPts.slice().reverse(), lv);
              for (const t of targets) {
                if (t.dead) continue;
                G.FX.slash(t.x, t.y, 2.4, t.r * 4.2, 'gold');
                this.hurtEnemy(t, dmg * reverseMul, {});
              }
              const end = windPts[0];
              if (end) G.FX.text(end.x, end.y - 34, '返 岚' + (turnCount ? ' +' + turnCount : ''), {
                size: 18, color: '#e6ffe1', crit: true
              });
            }
          });
        }
      }
    });
  }

  // 月华：短轨迹精准祓除时，重斩其中生命最高的目标。
  castMoon(hits, lv) {
    const def = G.SKILLS.moon;
    const s = this.player.stats;
    const targets = [...new Set(hits.map(h => h.t).filter(t => !t.isOrb && !t.dead))];
    if (!targets.length) return;
    targets.sort((a, b) => ((b.maxHp || b.hp || 0) - (a.maxHp || a.hp || 0)));
    const target = targets[0];
    const mirrorTargets = targets.slice(1, 1 + (this.shopRelics.moonMirror || 0));
    const repeatCount = Math.max(0, hits.filter(h => h.t === target).length - 1);
    const dmg = s.dmg * this.permDmg * def.dmgMul[lv - 1] *
      (1 + this.buildTier('repeat') * 0.1);
    this.delayed.push({
      t: 0.11, fn: () => {
        if (target.dead) return;
        const ang = -0.72;
        this.hitstop = Math.max(this.hitstop, 0.075);
        G.FX.moonBreak(target.x, target.y, target.r, lv);
        G.FX.gash(target.x, target.y, ang, target.r * 1.35);
        G.FX.slash(target.x, target.y, ang, target.r * 5, 'purple');
        G.FX.ring(target.x, target.y, target.r * 2.4, 'white', 4, 0.36);
        G.FX.text(target.x, target.y - target.r - 26, '月 华', { size: 20, color: '#eee8ff', crit: true });
        G.FX.shake(7 + lv, 0.23);
        G.FX.flash(0.08 + lv * 0.018, '#ddd8ff');
        G.Audio.tone({ f: 1450, f2: 420, dur: 0.16, type: 'square', vol: 0.08 });
        this.hurtEnemy(target, dmg, {});
        for (let i = 0; i < mirrorTargets.length; i++) {
          const echo = mirrorTargets[i];
          if (echo.dead) continue;
          const echoAng = ang + (i % 2 ? 0.42 : -0.42);
          G.FX.moonBreak(echo.x, echo.y, echo.r * 0.82, Math.max(1, lv - 1));
          G.FX.slash(echo.x, echo.y, echoAng, echo.r * 4.2, 'purple');
          G.FX.text(echo.x, echo.y - echo.r - 20, '半 月', { size: 15, color: '#ddd8ff' });
          this.hurtEnemy(echo, dmg * 0.55, {});
        }
        // 神通・满月：斩击贯穿目标形成断界线，返祓次数会扩大斩线。
        if (lv >= 3) {
          const lineLen = 470 + repeatCount * 70;
          const lineWidth = 38 + repeatCount * 12;
          const ax = target.x - Math.cos(ang) * lineLen * 0.5;
          const ay = target.y - Math.sin(ang) * lineLen * 0.5;
          const bx = target.x + Math.cos(ang) * lineLen * 0.5;
          const by = target.y + Math.sin(ang) * lineLen * 0.5;
          const lineDmg = s.dmg * this.permDmg * 0.65 * (1 + repeatCount * 0.25);
          G.FX.gash(target.x, target.y, ang, lineLen * 0.22);
          for (const e of this.enemies.slice()) {
            if (e.dead || e === target) continue;
            if (G.util.dSeg(e.x, e.y, ax, ay, bx, by).d <= lineWidth + e.r) this.hurtEnemy(e, lineDmg, {});
          }
          if (this.boss && !this.boss.dead && this.boss !== target &&
            G.util.dSeg(this.boss.x, this.boss.y, ax, ay, bx, by).d <= lineWidth + this.boss.r) {
            this.hurtBoss(lineDmg * 0.7, {});
          }
          G.FX.text(target.x, target.y + target.r + 34, '满 月' + (repeatCount ? ' ×' + (repeatCount + 1) : ''), {
            size: 17, color: '#fff4d8', crit: true
          });
        }
      }
    });
  }

  // 生玉：本次祓除击杀越多，返还的生命与神力越多。
  castRenewal(hits, killsNow, lv) {
    const def = G.SKILLS.renewal;
    const p = this.player;
    const rosary = this.shopRelics.renewalRosary || 0;
    const renewalMul = 1 + rosary * 0.18;
    this.renewalCd = def.cooldown[lv - 1];
    const heal = Math.min(def.healCap[lv - 1], killsNow * def.healPerKill[lv - 1]) * renewalMul;
    const mana = Math.min(def.manaCap[lv - 1],
      killsNow * def.manaPerKill[lv - 1]) * renewalMul;
    const missingHp = Math.max(0, p.maxHp - p.hp);
    const overflow = Math.max(0, heal - missingHp);
    const healed = Math.min(heal, p.maxHp - p.hp);
    p.hp = Math.min(p.maxHp, p.hp + heal);
    p.mana = Math.min(p.maxMana, p.mana + mana);
    G.FX.renewalBloom(p.x, p.y, 88 + lv * 10, lv);
    G.FX.ring(p.x, p.y, 86 + lv * 8, 'teal', 4, 0.52, 24);
    G.FX.glow(p.x, p.y, 'teal', 44, 0.4);
    const souls = [...new Set((hits || []).map(h => h.t).filter(t => t && !t.isOrb && t.dead))].slice(0, 6 + lv * 2);
    for (const t of souls) G.FX.spiritOrb(t.x, t.y, null, 'teal');
    G.FX.petals(p.x, p.y, 5 + lv * 2, 100);
    G.FX.text(p.x, p.y - 70, '生 玉', { size: 20, color: '#b8ffd6', crit: true });
    G.FX.text(p.x, p.y - 46, '+' + Math.round(healed) + ' 生  +' + Math.round(mana) + ' 神', { size: 16, color: '#8affd8' });
    if (lv >= 3) {
      const shieldGain = Math.round(6 + killsNow * 1.25 + overflow * 0.5);
      this.renewalShield = Math.min(40 + rosary * 8, this.renewalShield + shieldGain);
      G.FX.ring(p.x, p.y, 112, 'gold', 3.5, 0.62, 42);
      G.FX.text(p.x, p.y - 94, '轮 回 护 生 +' + shieldGain, { size: 17, color: '#fff0b8', crit: true });
    }
    G.FX.shake(1.5 + lv * 0.5, 0.18);
    G.Audio.heal();
  }

  explodeOfuda(e) {
    const s = this.player.stats;
    const inkMul = (1 + (this.shopRelics.ofudaInk || 0) * 0.25) *
      (1 + this.buildTier('familiar') * 0.12);
    const spreadR = 100 + (this.shopRelics.ofudaWide || 0) * 30;
    G.FX.burst(e.x, e.y, 'gold', 10, 200, 12, 0.4);
    G.FX.ring(e.x, e.y, 60, 'gold', 3, 0.35);
    G.FX.papers(e.x, e.y, 3);
    G.Audio.fox();
    if (s.ofudaVuln) e.vulnT = 5;
    if (e.hurt(s.dmg * 0.35 * inkMul, this, {})) { this.deathFX(e); this.onKill(e); return; }
    if (s.ofudaSpread) {
      for (const o of this.enemies) {
        if (o.dead || o === e) continue;
        if (G.util.dist2(o.x, o.y, e.x, e.y) < spreadR * spreadR) {
          if (s.ofudaVuln) o.vulnT = 5;
          G.FX.burst(o.x, o.y, 'gold', 5, 140, 9, 0.3);
          if (o.hurt(s.dmg * 0.3 * inkMul, this, {})) { this.deathFX(o); this.onKill(o); }
        }
      }
    }
  }

  startEcho() {
    const d = this.dash;
    if (!d) return;
    this.echoRunners.push({ pts: d.pts, cum: d.cum, L: d.L, s: 0, speed: 2600, hitSet: new Set(), done: false, afterT: 0 });
    G.Audio.echo();
  }
  updateEcho(r, rdt) {
    r.s += r.speed * rdt;
    if (r.s >= r.L) { r.done = true; return; }
    // 位置
    const tr = r.pts, cum = r.cum;
    let i = 1;
    while (i < cum.length - 1 && cum[i] < r.s) i++;
    const t = G.util.clamp((r.s - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1), 0, 1);
    const x = G.util.lerp(tr[i - 1].x, tr[i].x, t), y = G.util.lerp(tr[i - 1].y, tr[i].y, t);
    r.afterT -= rdt;
    if (r.afterT <= 0) { r.afterT = 0.02; G.FX.after(x, y, Math.atan2(tr[i].y - tr[i - 1].y, tr[i].x - tr[i - 1].x), 'dash', 'gold'); }
    const s = this.player.stats;
    const echoMul = 1 + (this.shopRelics.echoMirror || 0) * 0.25;
    for (const e of this.enemies) {
      if (e.dead || r.hitSet.has(e)) continue;
      if (G.util.dist2(e.x, e.y, x, y) < (e.r + 42) * (e.r + 42)) {
        r.hitSet.add(e);
        G.FX.slash(e.x, e.y, G.util.rand(0, 3), e.r * 3, 'gold');
        if (e.hurt(s.dmg * 0.45 * s.echo * echoMul, this, {})) { this.deathFX(e); this.onKill(e); }
      }
    }
    if (this.boss && !this.boss.dead && !r.hitSet.has(this.boss) &&
      G.util.dist2(this.boss.x, this.boss.y, x, y) < (this.boss.r + 42) * (this.boss.r + 42)) {
      r.hitSet.add(this.boss);
      this.hurtBoss(s.dmg * 0.45 * s.echo * echoMul, {});
    }
  }

  // ============ 伤害统一入口 ============
  hurtEnemy(e, dmg, opt) {
    if (e.dead) return;
    if (e.isBoss) { this.hurtBoss(dmg, opt); return; }
    if (e.soulLink && e.soulLink.active) {
      e.soulLink.pulse = 0.32;
      if (!e.soulLink.lastBlockT || this.time - e.soulLink.lastBlockT > 0.28) {
        e.soulLink.lastBlockT = this.time;
        G.FX.text(e.x, e.y - e.r - 8, '共 生 ・ 无 效', {
          size: 14, color: '#ff7b82', crit: true
        });
      }
      return;
    }
    if (!(opt && opt.silent)) G.FX.text(e.x, e.y - e.r - 6, Math.round(dmg) + '', { size: 13, color: '#e8e2f2' });
    if (e.hurt(dmg, this, opt)) { this.deathFX(e); this.onKill(e); }
  }
  hurtBoss(dmg, opt) {
    if (!this.boss || this.boss.dead) return;
    if (!(opt && opt.silent)) G.FX.text(this.boss.x + G.util.rand(-30, 30), this.boss.y - 50, Math.round(dmg) + '', { size: 15, color: '#ffd0a0' });
    if (this.boss.hurt(dmg, this)) this.onBossDead();
  }
  dealFox(fox, e, mul) {
    const itemSoul = fox.opt && fox.opt.itemSoul;
    const base = itemSoul ? fox.dmg : this.player.stats.dmg;
    const flowMul = itemSoul ? 1 : (1 + (this.shopRelics.foxFang || 0) * 0.25) *
      (1 + this.buildTier('familiar') * 0.12);
    const dmg = base * this.permDmg * mul * flowMul;
    this.hurtEnemy(e, dmg, {});
  }

  scaledJade(base) {
    // 灵玉掉落量整体翻倍；招财御币继续在翻倍后的基础值上乘算。
    const raw = base * 2 * this.fateJadeMul() *
      (1 + (this.shopRelics.wealthCoin || 0) * 0.25) + this.jadeBonusCarry;
    const value = Math.max(1, Math.floor(raw));
    this.jadeBonusCarry = raw - value;
    return value;
  }

  deathFX(e) {
    G.FX.burst(e.x, e.y, 'purple', e.type === 'elite' ? 22 : 10, 240, 14, 0.5);
    G.FX.petals(e.x, e.y, e.type === 'elite' ? 14 : 5);
    G.FX.ring(e.x, e.y, e.r * 3, 'purple', 3, 0.4);
    if (e.type === 'elite') { G.FX.shake(7, 0.3); G.FX.papers(e.x, e.y, 8); G.FX.flash(0.12, '#e8d8ff'); }
  }
  onKill(e) {
    this.kills++;
    if (e.splitStage > 0 && this.state === 'play') {
      for (let i = -1; i <= 1; i += 2) {
        const child = this.spawnEnemy('splinter',
          G.util.clamp(e.x + i * 18, 30, G.WORLD_W - 30),
          G.util.clamp(e.y + G.util.rand(-10, 10), 70, G.WORLD_H - 30));
        child.kx = i * 150;
        child.ky = G.util.rand(-80, 80);
      }
      G.FX.ring(e.x, e.y, 72, 'red', 4, 0.4);
      G.FX.text(e.x, e.y - 34, '裂 生', { size: 15, color: '#ff9fbd', crit: true });
    }
    if (e.noLoot) return;
    const isElite = e.type === 'elite' || /Elite$/.test(e.type || '');
    const bounty = this.shopRelics.eliteBounty || 0;
    if (isElite && bounty > 0) {
      const jade = this.scaledJade(2 * bounty);
      const mana = 3 * bounty;
      this.jade += jade;
      this.player.mana = Math.min(this.player.maxMana, this.player.mana + mana);
      G.FX.text(e.x, e.y - e.r - 28, '赏 札 ・ +' + jade + '玉 +' + mana + '神', {
        size: 14, color: '#ffe0a0', crit: true
      });
    }
    const ledger = this.shopRelics.hundredLedger || 0;
    if (ledger > 0) {
      this.ledgerKills++;
      const interval = ledger >= 2 ? 30 : 40;
      if (this.ledgerKills >= interval) {
        this.ledgerKills -= interval;
        const kind = G.util.pick(['hp', 'mana', 'jade']);
        const value = kind === 'jade' ? this.scaledJade(3 + ledger * 2) : 0;
        this.pickups.push(new G.Pickup(e.x, e.y - 18, kind, value));
        G.FX.text(e.x, e.y - 44, '奉 行 录 ・ 补 给', {
          size: 14, color: '#bfe8ff', crit: true
        });
      }
    }
    const gemN = e.type === 'elite' ? 4 : 1;
    const xpMul = (this.player.stats && this.player.stats.xpMul) || 1;
    for (let i = 0; i < gemN; i++) this.gems.push(new G.Gem(e.x, e.y, e.xp * xpMul / gemN));
    // 灵玉是关后商店货币；普通怪多数掉 1 枚，精英固定掉一小簇。
    if (e.type === 'elite') this.pickups.push(new G.Pickup(e.x + 12, e.y + 8, 'jade', this.scaledJade(4)));
    else if (G.util.chance(0.68)) this.pickups.push(new G.Pickup(e.x, e.y, 'jade', this.scaledJade(1)));

    const wd = G.getWave(this.wave);
    const skillChance = wd.skillDrop * (e.type === 'elite' ? 5 : 1);
    if (G.util.chance(skillChance)) this.pickups.push(new G.Pickup(e.x, e.y - 24, 'skill'));
    if (e.type === 'elite') {
      this.pickups.push(new G.Pickup(e.x + 20, e.y, 'mana'));
      const eliteHealChance = Math.max(0.14, 0.36 - this.wave * 0.011);
      if (G.util.chance(eliteHealChance)) this.pickups.push(new G.Pickup(e.x - 20, e.y, 'hp'));
    } else {
      const healChance = Math.max(0.006, 0.02 - (this.wave - 1) * 0.00075);
      if (G.util.chance(healChance)) this.pickups.push(new G.Pickup(e.x, e.y, 'hp'));
    }
  }

  drainPlayerMana(amount, sx, sy, label) {
    const p = this.player;
    const drained = Math.min(p.mana, Math.max(0, amount));
    if (drained <= 0) return 0;
    p.mana -= drained;
    G.FX.spiritOrb(sx, sy, null, 'purple');
    G.FX.text(p.x, p.y - 42, (label || '蚀 灵') + '  -' + Math.round(drained) + ' 神', {
      size: 15, color: '#d7a0ff', crit: true
    });
    G.FX.shake(3, 0.18);
    this.refreshHud();
    return drained;
  }

  triggerScarletUmbrella() {
    const level = this.shopRelics.scarletUmbrella || 0;
    if (!level || this.umbrellaCd > 0) return false;
    const p = this.player;
    const radius = 175 + level * 35;
    let cut = 0;
    for (const bullet of this.bullets) {
      if (bullet.dead || G.util.dist2(p.x, p.y, bullet.x, bullet.y) > radius * radius) continue;
      bullet.dead = true;
      cut++;
      G.FX.burst(bullet.x, bullet.y, 'cyan', 4, 110, 8, 0.25);
    }
    for (const enemy of this.enemies) {
      if (enemy.dead || G.util.dist2(p.x, p.y, enemy.x, enemy.y) >
        (radius + enemy.r) * (radius + enemy.r)) continue;
      const ang = G.util.angTo(p.x, p.y, enemy.x, enemy.y);
      enemy.kx += Math.cos(ang) * (360 + level * 80);
      enemy.ky += Math.sin(ang) * (360 + level * 80);
    }
    this.umbrellaCd = 10 - level * 2;
    G.FX.ring(p.x, p.y, radius, 'red', 7, 0.48, radius * 0.22);
    G.FX.papers(p.x, p.y, 8 + cut);
    G.FX.text(p.x, p.y - 52, '退 魔 朱 伞' + (cut ? ' ・ 断 弹 ×' + cut : ''), {
      size: 16, color: '#ffb4ad', crit: true
    });
    G.Audio.tension();
    return true;
  }

  hurtPlayer(dmg, sx, sy) {
    const p = this.player;
    if (p.iTime > 0 || p.state === 'dash' || p.state === 'fin' || this.overT > 0 || this.winT > 0) return;
    const wd = G.getWave(this.wave);
    const progress = G.util.clamp(this.waveTime / Math.max(1, this.waveDuration), 0, 1);
    // 残刻妖潮会逐步提高实际威胁，避免一关后半段只剩清理耐久怪。
    const surgePressure = 1 + Math.max(0, progress - 0.65) / 0.35 * 0.35;
    dmg *= surgePressure;
    if (this.paperShield > 0 || this.mirrorShield > 0) {
      if (this.paperShield > 0) this.paperShield--;
      else this.mirrorShield--;
      p.iTime = 0.35;
      G.FX.ring(p.x, p.y, 78, 'gold', 5, 0.4);
      G.FX.burst(p.x, p.y, 'gold', 12, 180, 12, 0.4);
      G.FX.text(p.x, p.y - 34, '守', { size: 24, color: '#ffe2a0', crit: true });
      G.Audio.select();
      this.refreshHud();
      return;
    }
    if (this.renewalShield > 0) {
      const absorbed = Math.min(this.renewalShield, dmg);
      this.renewalShield = Math.max(0, this.renewalShield - absorbed);
      dmg -= absorbed;
      G.FX.ring(p.x, p.y, 72, 'teal', 4, 0.38);
      G.FX.burst(p.x, p.y, 'teal', 8, 150, 10, 0.34);
      G.FX.text(p.x, p.y - 38, '生玉承伤 ' + Math.round(absorbed), {
        size: 15, color: '#b8ffd6', crit: true
      });
      if (dmg <= 0) {
        p.iTime = 0.35;
        G.Audio.select();
        this.refreshHud();
        return;
      }
    }
    if (this.comboShield > 0) {
      const absorbed = Math.min(this.comboShield, dmg);
      this.comboShield = Math.max(0, this.comboShield - absorbed);
      dmg -= absorbed;
      G.FX.ring(p.x, p.y, 66, 'teal', 3, 0.3);
      G.FX.text(p.x, p.y - 34, '护印承伤 ' + Math.round(absorbed), {
        size: 14, color: '#a8ffe8'
      });
      if (dmg <= 0) {
        p.iTime = 0.35;
        G.Audio.select();
        this.refreshHud();
        return;
      }
    }
    if (this.shopRelics.returnSoulRope && !this.lastLifeUsed && dmg >= p.hp) {
      this.lastLifeUsed = true;
      p.hp = 1;
      p.iTime = 1.25;
      for (const bullet of this.bullets) bullet.dead = true;
      if (this.planning) this.cancelPlanning();
      G.FX.flash(0.5, '#fff4da');
      G.FX.ring(p.x, p.y, 230, 'gold', 9, 0.8, 44);
      G.FX.burst(p.x, p.y, 'gold', 30, 310, 16, 0.65);
      G.FX.text(p.x, p.y - 58, '返 魂 ・ 一 命 留', {
        size: 20, color: '#fff0bd', crit: true
      });
      G.Audio.level();
      this.refreshHud();
      return;
    }
    p.hp -= dmg;
    p.iTime = wd.hurtGrace;
    if (p.hp > 0) this.triggerScarletUmbrella();
    // 受击打断规划
    if (this.planning) {
      this.planning = false;
      this.$('planVig').style.opacity = 0;
      this.$('manaPreview').style.width = '0';
      for (const t of this.getLockables()) { t.seal = -1; t.sealCount = 0; }
      this.trail = []; this.locks = [];
      p.state = 'move';
      this.timeTarget = 1;
    }
    const a = G.util.angTo(sx, sy, p.x, p.y);
    const knocked = G.util.fieldClamp(p.x + Math.cos(a) * 26,
      p.y + Math.sin(a) * 26, p.r + 18);
    p.x = knocked.x;
    p.y = knocked.y;
    G.FX.hurtPulse();
    G.FX.shake(7, 0.3);
    G.FX.burst(p.x, p.y, 'red', 10, 200, 12, 0.4);
    G.Audio.hurt();
    if (p.hp <= 0) {
      p.hp = 0;
      this.overT = 1.3;
      this.timeTarget = 0.15;
      this.planning = false;
      this.$('planVig').style.opacity = 0;
      G.Audio.die();
      G.FX.petals(p.x, p.y, 20);
    }
  }

  // ============ 生成导演 ============
  hpMul() { return G.getWave(this.wave).hpMul; }
  randomSpawnPoint(type, extraSafe) {
    // 在石沿围出的庭院内均匀刷新，不再依附当前镜头四边，也不会落进天空远景。
    // 小队锚点额外远离玩家，避免队形外沿直接压在巫女身上。
    const isElite = type === 'elite' || /Elite$/.test(type || '');
    const padding = (isElite ? 48 : 30) + (extraSafe || 0) * 0.08;
    const safeR = (isElite ? 280 : 190) +
      (extraSafe || 0);
    const wd = G.getWave(this.wave);
    const trial = G.getWaveTrial(this.wave);
    const assaultChance = Math.min(0.7, wd.assaultChance + (trial.assaultBonus || 0));
    if (assaultChance > 0 && G.util.chance(assaultChance)) {
      const ang = G.util.rand(0, Math.PI * 2);
      const minR = (isElite ? 390 : 300) + (extraSafe || 0) * 0.25;
      const maxR = (isElite ? 620 : 510) + (extraSafe || 0) * 0.35;
      const radius = G.util.rand(minR, maxR);
      return G.util.fieldClamp(
        this.player.x + Math.cos(ang) * radius,
        this.player.y + Math.sin(ang) * radius,
        padding
      );
    }
    let best = null, bestD2 = -1;
    for (let i = 0; i < 12; i++) {
      const point = G.util.fieldRandom(padding);
      const d2 = G.util.dist2(point.x, point.y, this.player.x, this.player.y);
      if (d2 > bestD2) { best = point; bestD2 = d2; }
      if (d2 >= safeR * safeR) return point;
    }
    return best;
  }

  spawnEnemy(type, x, y) {
    if (x == null) {
      const point = this.randomSpawnPoint(type, 0);
      x = point.x;
      y = point.y;
    }
    const m = this.hpMul();
    let e;
    if (type === 'chaser') e = new G.Chaser(x, y, m);
    else if (type === 'dasher') e = new G.Dasher(x, y, m);
    else if (type === 'ranged') e = new G.Ranged(x, y, m);
    else if (type === 'moth') e = new G.Moth(x, y, m);
    else if (type === 'splitter') e = new G.Splitter(x, y, m, false);
    else if (type === 'splinter') e = new G.Splitter(x, y, m, true);
    else if (type === 'siphon') e = new G.Siphon(x, y, m);
    else if (type === 'binder') e = new G.Binder(x, y, m);
    else if (type === 'guardian') e = new G.Guardian(x, y, m);
    else if (type === 'chanter') e = new G.Chanter(x, y, m);
    else if (type === 'wardenElite') e = new G.WardenElite(x, y, m);
    else if (type === 'reaperElite') e = new G.ReaperElite(x, y, m);
    else if (type === 'summonerElite') e = new G.SummonerElite(x, y, m);
    else if (type === 'sealerElite') e = new G.SealerElite(x, y, m);
    else e = new G.Elite(x, y, m);
    const bounded = G.util.fieldClamp(e.x, e.y, (e.r || 20) + 10);
    e.x = bounded.x;
    e.y = bounded.y;
    const wd = G.getWave(this.wave);
    e.dmg = Math.max(1, Math.round(e.dmg * wd.enemyDamageMul));
    if (e.projectileDmg) e.projectileDmg = Math.max(1, Math.round(e.projectileDmg * wd.enemyDamageMul));
    if (e.speed) e.speed *= wd.enemySpeedMul;
    e.attackRate = wd.enemyAttackRate;
    if (typeof e.castT === 'number') {
      const warning = e.type === 'binder' ? 0.82 : e.type === 'ranged' ? 0.55 : 0;
      e.castT = warning + Math.max(0, e.castT - warning) / e.attackRate;
    }
    if (e.type === 'siphon') e.drain = 8 + Math.floor(this.wave / 3);
    e.wave = this.wave;
    this.enemies.push(e);
    G.FX.burst(e.x, e.y, 'purple', 6, 120, 11, 0.4);
    return e;
  }

  rollRoster(roster, bias) {
    const available = roster.filter(entry => this.wave >= entry.unlock);
    const weighted = entry => entry.weight * ((bias && bias[entry.type]) || 1);
    let roll = Math.random() * available.reduce((sum, entry) => sum + weighted(entry), 0);
    for (const entry of available) {
      roll -= weighted(entry);
      if (roll <= 0) return entry.type;
    }
    return available.length ? available[available.length - 1].type : 'chaser';
  }

  rollEnemyType() {
    return this.rollRoster(G.ENEMY_ROSTER, G.getWaveChapter(this.wave).enemyBias);
  }

  rollEliteType() {
    return this.rollRoster(G.ELITE_ROSTER, G.getWaveChapter(this.wave).eliteBias);
  }

  spawnSquad(count, eliteLead) {
    if (count <= 0) return [];
    const chapter = G.getWaveChapter(this.wave);
    const anchor = this.randomSpawnPoint(eliteLead ? 'elite' : 'chaser', 115);
    const phase = chapter.formation === 'wedge'
      ? G.util.angTo(anchor.x, anchor.y, this.player.x, this.player.y)
      : G.util.rand(0, Math.PI * 2);
    const spawned = [];
    for (let i = 0; i < count; i++) {
      let ox = 0, oy = 0;
      if (i > 0 && chapter.formation === 'wedge') {
        const rank = Math.ceil(i / 2), side = i % 2 ? 1 : -1;
        ox = Math.cos(phase + Math.PI) * rank * 36 +
          Math.cos(phase + Math.PI / 2) * side * rank * 31;
        oy = Math.sin(phase + Math.PI) * rank * 36 +
          Math.sin(phase + Math.PI / 2) * side * rank * 31;
      } else if (chapter.formation === 'arc') {
        const centered = i - (count - 1) / 2;
        const ang = phase + centered * 0.29;
        const radius = 58 + Math.abs(centered) * 7;
        ox = Math.cos(ang) * radius; oy = Math.sin(ang) * radius;
      } else if (chapter.formation === 'line') {
        const centered = i - (count - 1) / 2;
        ox = Math.cos(phase + Math.PI / 2) * centered * 47;
        oy = Math.sin(phase + Math.PI / 2) * centered * 47;
      } else {
        const ang = phase + i * 2.39996 + G.util.rand(-0.18, 0.18);
        const radius = i === 0 ? 0 : 34 + i * 13;
        ox = Math.cos(ang) * radius; oy = Math.sin(ang) * radius;
      }
      const x = G.util.clamp(anchor.x + ox, 54, G.WORLD_W - 54);
      const y = G.util.clamp(anchor.y + oy, 76, G.WORLD_H - 48);
      const type = eliteLead && i === 0 ? this.rollEliteType() : this.rollEnemyType();
      const enemy = this.spawnEnemy(type, x, y);
      enemy.squadId = this.time + ':' + phase;
      spawned.push(enemy);
    }
    if (!eliteLead && chapter.linkChance > 0) {
      const activeLinks = this.soulLinks.filter(link => link.active).length;
      const candidates = spawned.filter(e => e.type !== 'elite' && !/Elite$/.test(e.type || '') && !e.soulLink);
      if (activeLinks < chapter.linkCap && candidates.length >= 2 &&
        G.util.chance(chapter.linkChance)) {
        const first = G.util.pick(candidates);
        const second = G.util.pick(candidates.filter(e => e !== first));
        this.createSoulLink(first, second);
        G.FX.banner('共 生 祟 线 ・ 划 线 斩 断');
      }
    }
    G.FX.ring(anchor.x, anchor.y, 72 + count * 7, eliteLead ? 'gold' : 'purple', 2, 0.42);
    return spawned;
  }

  spawnBullet(x, y, ang, sp, dmg) {
    const wd = G.getWave(this.wave);
    this.bullets.push(new G.Bullet(x, y, ang, sp * wd.projectileSpeedMul, dmg));
  }

  updateStageEvent(dt, wd, desired) {
    if (wd.boss) return;
    this.stageEventT -= dt;
    if (this.stageEventT > 0) return;
    const chapter = G.getWaveChapter(this.wave);
    const trial = G.getWaveTrial(this.wave);
    this.stageEventCount++;
    this.stageEventT = chapter.eventEvery * (trial.eventMul || 1) * G.util.rand(0.9, 1.1);

    if (chapter.event === 'rush') {
      const room = Math.max(0, desired + 3 - this.enemies.length);
      if (!room) return;
      const rushers = this.spawnSquad(Math.min(room, 3 + (this.wave >= 3 ? 1 : 0)), false);
      for (const enemy of rushers) {
        if (enemy.speed) enemy.speed *= 1.13;
        enemy.chapterRush = true;
      }
      G.FX.banner('影 狩 急 袭 ・ 短 线 截 阵');
      G.Audio.warn();
      return;
    }

    if (chapter.event === 'rain') {
      const tx = this.player.x, ty = this.player.y;
      const count = 6 + Math.min(3, Math.floor((this.wave - 6) / 2));
      const phase = G.util.rand(0, Math.PI * 2);
      G.FX.ring(tx, ty, 116, 'cyan', 3, 0.7);
      for (let i = 0; i < count; i++) {
        const ang = phase + i / count * Math.PI * 2;
        const radius = 390 + (i % 2) * 70;
        const x = G.util.clamp(tx + Math.cos(ang) * radius, 35, G.WORLD_W - 35);
        const y = G.util.clamp(ty + Math.sin(ang) * radius, 65, G.WORLD_H - 35);
        this.spawnBullet(x, y, G.util.angTo(x, y, tx, ty), 132, Math.round(7 * wd.enemyDamageMul));
        G.FX.burst(x, y, 'cyan', 3, 55, 7, 0.28);
      }
      G.FX.banner('咒 雨 落 庭 ・ 以 线 断 弹');
      G.Audio.warn();
      return;
    }

    if (chapter.event === 'bind') {
      const candidates = this.enemies.filter(e => !e.dead && !e.soulLink &&
        e.type !== 'elite' && !/Elite$/.test(e.type || ''));
      let made = 0;
      while (candidates.length >= 2 && made < 2 &&
        this.soulLinks.filter(link => link.active).length < chapter.linkCap) {
        const a = candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0];
        const b = candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0];
        if (this.createSoulLink(a, b)) made++;
      }
      if (made) {
        G.FX.banner('缚 阵 结 契 ・ 横 线 破 阵');
        G.Audio.warn();
      }
      return;
    }

    if (chapter.event === 'nightTide') {
      const room = Math.max(0, desired + 4 - this.enemies.length);
      if (!room) return;
      const types = ['splitter', 'siphon', 'guardian', 'binder', 'chanter'];
      const anchor = this.randomSpawnPoint('chaser', 135);
      const count = Math.min(room, 4 + (this.stageEventCount % 2));
      for (let i = 0; i < count; i++) {
        const ang = i / count * Math.PI * 2 + this.stageEventCount * 0.7;
        const type = types[(i + this.stageEventCount) % types.length];
        const e = this.spawnEnemy(type,
          G.util.clamp(anchor.x + Math.cos(ang) * 82, 54, G.WORLD_W - 54),
          G.util.clamp(anchor.y + Math.sin(ang) * 82, 76, G.WORLD_H - 48));
        e.squadId = 'night:' + this.stageEventCount;
      }
      G.FX.ring(anchor.x, anchor.y, 145, 'red', 5, 0.55);
      G.FX.banner('百 鬼 夜 潮 ・ 异 种 混 成');
      G.Audio.warn();
    }
  }

  director(dt) {
    if (this.state !== 'play') return;
    const wd = G.getWave(this.wave);
    const trial = G.getWaveTrial(this.wave);
    if (wd.boss && !this.bossSpawned) this.spawnBoss();

    const surge = !wd.boss && this.waveTime >= this.waveDuration * 0.72;
    if (surge && !this.surgeWarned) {
      this.surgeWarned = true;
      G.FX.banner('妖 潮 高 涨 ・ 残 刻');
      G.Audio.warn();
    }
    const densityMul = this.fate().densityMul || 1;
    const interval = wd.spawnInterval * (surge ? 0.84 : 1) *
      (wd.boss && !this.bossDefeated ? 1.35 : 1) * (densityMul > 1 ? 0.9 : 1);
    const normalDesired = wd.boss && !this.bossDefeated
      ? Math.round((8 + wd.bossTier * 2) * 2.5)
      : wd.maxEnemies;
    const baseDesired = Math.round(normalDesired * densityMul);
    const desired = surge ? Math.round(baseDesired * 1.08) : baseDesired;
    this.updateStageEvent(dt, wd, desired);
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.enemies.length < desired) {
      this.spawnT = interval;
      const count = Math.min(desired - this.enemies.length,
        G.util.randi(wd.squadMin, wd.squadMax) + (trial.squadBonus || 0));
      this.spawnSquad(count, false);
    }
    // 精英
    if (!wd.boss && wd.eliteInterval) this.eliteT -= dt;
    if (!wd.boss && wd.eliteInterval && this.eliteT <= 0) {
      const eliteAlive = this.enemies.filter(e => !e.dead &&
        (e.type === 'elite' || /Elite$/.test(e.type || ''))).length;
      if (eliteAlive >= wd.eliteCap) {
        this.eliteT = 2.2;
      } else {
        this.eliteT = wd.eliteInterval * (trial.eliteIntervalMul || 1) *
          (this.fate().eliteIntervalMul || 1);
        const escortN = Math.min(Math.max(0, desired - this.enemies.length), G.util.randi(2, 4));
        this.spawnSquad(Math.max(1, escortN), true);
        G.FX.banner('荒 魂 现 身 ・ 优 先 祓 除');
        G.Audio.warn();
      }
    }
  }

  spawnBoss() {
    const wd = G.getWave(this.wave);
    this.bossSpawned = true;
    this.boss = new G.Boss(wd.bossHpMul, wd.bossDamageMul, wd.bossTier);
    this.$('bossWrap').classList.remove('hidden');
    const bossNames = [
      '祟面ノ大天狗',
      '青焰ノ酒吞童子',
      '九尾ノ玉藻',
      '常暗ノ黄泉主'
    ];
    const bossName = bossNames[Math.max(0, wd.bossTier - 1)] || bossNames[0];
    this.$('bossName').textContent = bossName + ' ・ ' + ['壱', '弐', '参', '終'][Math.max(0, wd.bossTier - 1)];
    G.FX.banner(bossName + ' ・ 現');
    G.FX.flash(0.3, '#ffd0c0');
    G.FX.shake(13, 0.7);
    G.Audio.boss();
    const bossHints = [
      '风切双门・划线截断两道赤裂',
      '鬼宴地鸣・离开脚下预兆范围',
      '四狐连契・先横切共生赤线',
      '万象双咒・直线与闭环交替破式'
    ];
    this.delayed.push({
      t: 1.05, real: true,
      fn: () => G.FX.banner('祟 主 权 能 ・ ' + bossHints[Math.max(0, wd.bossTier - 1)])
    });
  }
  onBossDead() {
    const b = this.boss;
    if (!b || this.bossDefeated) return;
    this.bossCurses = [];
    G.FX.flash(0.7, '#ffffff');
    G.FX.shake(24, 0.8);
    G.FX.ring(b.x, b.y, 400, 'white', 8, 0.9);
    G.FX.petals(b.x, b.y, 60, 300);
    G.FX.papers(b.x, b.y, 30);
    G.FX.burst(b.x, b.y, 'gold', 40, 380, 18, 1);
    G.Audio.victory();
    for (let i = 0; i < 8; i++) this.gems.push(new G.Gem(b.x + G.util.rand(-60, 60), b.y + G.util.rand(-40, 40), 11));
    this.pickups.push(new G.Pickup(b.x, b.y, 'hp'));
    this.pickups.push(new G.Pickup(b.x, b.y - 32, 'skill'));
    this.pickups.push(new G.Pickup(b.x + 34, b.y, 'jade', this.scaledJade(14 + this.wave)));
    this.boss = null;
    this.bossDefeated = true;
    this.$('bossWrap').classList.add('hidden');
    // Boss 可能在小祓/中祓的多目标结算途中死亡。这里不能同步清空
    // dash 与 delayed，否则 purify() 后半段仍读取轨迹时会中断结算。
    if (this.waveTime >= this.waveDuration) this.waveFinishPending = true;
    else G.FX.banner('祟 主 祓 除 ・ 残 刻 を 清 め よ');
  }

  // ============ 经验/升级 ============
  gainXp(v) {
    const p = this.player;
    p.xp += v * this.fateXpMul();
    while (p.xp >= p.xpNext) {
      p.xp -= p.xpNext;
      p.level++;
      this.pendingLevels++;
      p.xpNext = Math.round(8 * Math.pow(1.29, p.level - 1) + (p.level - 1) * 3);
    }
  }
  openLevelUp() {
    this.state = 'levelup';
    this.cardChoices = G.rollUpgrades(this.owned, this);
    const wrap = this.$('cards');
    wrap.innerHTML = '';
    const rarStyle = [
      { c: '#9fb4d8', g: 'rgba(159,180,216,.32)', tag: '加 护' },
      { c: '#e6c37a', g: 'rgba(230,195,122,.38)', tag: '秘 传' },
      { c: '#c77dff', g: 'rgba(199,125,255,.45)', tag: '奥 义' },
    ];
    this.cardChoices.forEach((u, i) => {
      const r = rarStyle[u.rar];
        const buildHint = G.buildChoiceLabel && u.id[0] !== '_'
          ? G.buildChoiceLabel(this, 'upgrades', u.id) : '';
      const el = document.createElement('div');
      el.className = 'card';
      el.style.setProperty('--rar', r.c);
      el.style.setProperty('--rarGlow', r.g);
      const n = this.owned[u.id] || 0;
      el.innerHTML =
        '<div class="kanji">' + u.kanji + '</div>' +
        '<div class="seal">' + u.kanji + '</div>' +
        '<div class="name">' + u.name + '</div>' +
        '<div class="rarLine"></div>' +
        '<div class="desc">' + u.desc + '</div>' +
        '<div class="rarTag">' + r.tag +
        (buildHint ? '・共鸣 ' + buildHint : '') + '</div>' +
        (n ? '<div class="stack">已持有 ×' + n + '</div>' : '<div class="stack"></div>');
      el.onclick = () => this.chooseCard(i);
      wrap.appendChild(el);
    });
    this.$('levelup').classList.remove('hidden');
    G.Audio.level();
  }
  chooseCard(i) {
    const u = this.cardChoices[i];
    const p = this.player;
    if (u.id === '_heal') { p.hp = Math.min(p.maxHp, p.hp + 40); G.Audio.heal(); }
    else if (u.id === '_mana') { p.mana = p.maxMana; this.permDmg *= 1.08; G.Audio.orb(); }
    else {
      this.applyUpgrade(u.id);
      G.Audio.select();
    }
    G.FX.burst(p.x, p.y, 'gold', 14, 200, 13, 0.5);
    G.FX.ring(p.x, p.y, 90, 'gold', 4, 0.5);
    this.pendingLevels--;
    if (this.pendingLevels > 0) { this.openLevelUp(); return; }
    this.$('levelup').classList.add('hidden');
    this.continuePostWaveRewards();
  }

  // ============ 结算 ============
  statHtml(win) {
    return '抵达关卡 <b>第 ' + this.wave + ' / ' + G.TOTAL_WAVES + ' 祓</b><br>' +
      '战斗时间 <b>' + G.util.fmtTime(this.time) + '</b><br>' +
      '祓除妖怪 <b>' + this.kills + '</b><br>' +
      '持有灵玉 <b>' + this.jade + '</b><br>' +
      '携行武器 <b>' + this.weapons.map(id => G.WEAPONS[id].name).join(' / ') + '</b><br>' +
      '最大单次命中 <b>' + this.bestCombo + '</b><br>' +
      '最高祓除评级 <b>' + this.bestRating + '</b><br>' +
      '巫女等级 <b>Lv.' + this.player.level + '</b>';
  }
  showGameOver() {
    this.state = 'over';
    this.saveBest(false);
    this.$('overStats').innerHTML = this.statHtml(false);
    this.$('gameover').classList.remove('hidden');
    this.$('hud').classList.add('hidden');
    this.timeTarget = 1; this.timeScale = 1;
  }
  showVictory() {
    this.state = 'win';
    this.$('winStats').innerHTML = this.statHtml(true);
    this.$('victory').classList.remove('hidden');
    this.$('hud').classList.add('hidden');
    this.timeTarget = 1; this.timeScale = 1;
  }

  // ============ HUD ============
  renderItemHud() {
    const held = G.SHOP_RELICS
      .filter(item => (this.shopRelics[item.id] || 0) > 0)
      .map(item => ({ item, count: this.shopRelics[item.id] || 0 }));
    const signature = held.map(x => x.item.id + ':' + x.count).join('|');
    if (signature === this._itemHud) return;
    this._itemHud = signature;
    const total = held.reduce((sum, x) => sum + x.count, 0);
    this.$('itemHudCount').textContent = total ? total + ' 件・' + held.length + ' 种' : '尚无珍品';
    const grid = this.$('itemHudGrid');
    const detail = this.$('itemHudDetail');
    grid.innerHTML = '';
    detail.textContent = held.length ? '悬停珍品查看效果' : '夜诣商店与 Boss 奉纳可获得珍品';
    for (const entry of held) {
      const item = entry.item;
      const el = document.createElement('div');
      el.className = 'itemHudIcon r' + (item.rar || 0) + (item.cursed ? ' cursed' : '');
      el.innerHTML = '<b>' + item.kanji + '</b>' + (entry.count > 1 ? '<i>×' + entry.count + '</i>' : '');
      el.title = item.name + ' ×' + entry.count + '\n' + item.desc;
      el.onmouseenter = () => {
        detail.innerHTML = '<b>' + item.name + (entry.count > 1 ? ' ×' + entry.count : '') + '</b><span>' + item.desc + '</span>';
      };
      grid.appendChild(el);
    }
  }

  renderBuildHud() {
    const wrap = this.$('buildHud');
    if (!wrap || !G.BUILD_ORDER) return;
    const state = this.buildState || G.getBuildState(this);
    const visible = G.BUILD_ORDER.map(id => state[id])
      .filter(x => x && x.score > 0)
      .sort((a, b) => b.score - a.score || G.BUILD_ORDER.indexOf(a.id) - G.BUILD_ORDER.indexOf(b.id))
      .slice(0, 3);
    const signature = visible.map(x => x.id + ':' + x.score + ':' + x.tier).join('|');
    if (signature === this._buildHud) return;
    this._buildHud = signature;
    if (!visible.length) {
      wrap.innerHTML = '<span class="buildEmpty">流派尚未成形</span>';
      return;
    }
    wrap.innerHTML = visible.map(x => {
      const status = x.tier >= 2 ? '大成' : x.tier === 1 ? x.score + '/8' : x.score + '/4';
      const title = x.def.style + '\n初成：' + x.def.tier1 + '\n大成：' + x.def.tier2;
      return '<span class="buildBadge t' + x.tier + '" style="--build:' + x.def.color +
        '" title="' + title.replace(/"/g, '&quot;') + '"><b>' + x.def.kanji + '・' +
        x.def.name.split('・')[1] + '</b><i>' + status + '</i></span>';
    }).join('');
  }

  renderFateHud() {
    const wrap = this.$('fateHud');
    if (!wrap) return;
    const fate = this.fate();
    let status = '';
    if (this.fateId === 'attendant')
      status = '秘法 ' + this.skillSlotCount() + ' / ' + this.skillSlotLimit();
    else if (this.fateId === 'dancer')
      status = '主动调息 ×' + this.fateActiveCooldownMul().toFixed(2);
    else if (this.fateId === 'shura')
      status = '修罗生命 ' + Math.ceil(this.player.hp / this.player.maxHp * 100) + '%';
    else if (this.fateId === 'offering')
      status = '商价 75%・灵玉 125%';
    else if (this.fateId === 'bladeless')
      status = '唯一神兵・开眼 ' + this.bladeMastery;
    else if (this.fateId === 'omagatoki')
      status = '敌势 125%・收益 125%';
    else if (this.fateId === 'moonTide')
      status = this.moonTideWindow > 0
        ? '潮涌 ' + this.moonTideWindow.toFixed(1) + 's'
        : '月潮 ' + Math.max(0, this.moonTideT).toFixed(1) + 's';
    else if (this.fateId === 'mirror')
      status = '断弹 ' + this.mirrorCutCount + ' / 5' + (this.mirrorShield ? '・神镜' : '');
    const signature = this.fateId + '|' + status;
    if (signature === this._fateHud) return;
    this._fateHud = signature;
    wrap.style.setProperty('--fate', fate.color);
    wrap.innerHTML = '<b>' + fate.kanji + '</b><span><strong>' + fate.name +
      '</strong><i>' + status + '</i></span>';
    wrap.title = fate.desc + '\n' + fate.boon + '\n代价：' + fate.bane;
  }

  refreshHud() {
    const p = this.player;
    this.$('hpFill').style.width = (p.hp / p.maxHp * 100) + '%';
    this.$('hpText').textContent = Math.ceil(p.hp) + ' / ' + p.maxHp;
    this.$('manaFill').style.width = (p.mana / p.maxMana * 100) + '%';
    this.$('manaText').textContent = Math.floor(p.mana) + ' / ' + p.maxMana;
    if (this.planning) {
      const c = this.attackCost();
      this.$('manaPreview').style.left = ((p.mana - c) / p.maxMana * 100) + '%';
      this.$('manaPreview').style.width = (c / p.maxMana * 100) + '%';
    }
    this.$('lvlBadge').textContent = 'Lv.' + p.level;
    this.$('xpFill').style.width = (p.xp / p.xpNext * 100) + '%';
    const remain = Math.max(0, Math.ceil(this.waveDuration - this.waveTime));
    this.$('waveText').textContent = '第 ' + String(this.wave).padStart(2, '0') + ' / ' + G.TOTAL_WAVES + ' 祓';
    this.$('timeText').textContent = this.waveOvertime ? '祟 战' : G.util.fmtTime(remain);
    const wd = G.getWave(this.wave);
    const threat = this.$('threatText');
    if (threat) {
      const seal = this.manaSealT > 0 ? ' ・ 神力封锁 ' + this.manaSealT.toFixed(1) + 's' : '';
      const enemyCap = wd.boss && !this.bossDefeated
        ? Math.round((8 + wd.bossTier * 2) * 2.5)
        : wd.maxEnemies;
      const fateEnemyCap = Math.round(enemyCap * (this.fate().densityMul || 1));
      threat.className = 'danger' + wd.dangerTier + (this.manaSealT > 0 ? ' sealed' : '');
      threat.textContent = wd.stageLabel + ' ' + wd.chapterName + ' ・ ' + wd.dangerLabel +
        ' ・ 敌势 ' + this.enemies.length + ' / ' + fateEnemyCap + seal;
    }
    this.$('killText').textContent = '祓除 ' + this.kills;
    this.$('jadeText').textContent = '灵玉 ' + this.jade;
    const weaponHud = this.weapons.map((id, i) => {
      const weapon = G.WEAPONS[id];
      return '<div class="weaponHudSlot' + (i === this.activeWeaponIndex ? ' active' : '') +
        '" data-weapon-slot="' + i + '"><b>' + (i + 1) + '</b>' + weapon.name + '</div>';
    }).join('');
    if (weaponHud !== this._weaponHud) {
      this._weaponHud = weaponHud;
      const wrap = this.$('weaponWrap');
      wrap.innerHTML = weaponHud;
      for (const el of wrap.querySelectorAll('[data-weapon-slot]')) {
        el.onclick = () => this.switchWeapon(+el.dataset.weaponSlot);
      }
    }
    const active = this.activeSkill();
    const activeHud = this.$('activeHud');
    if (activeHud) {
      if (this._activeHud !== active.id) {
        this._activeHud = active.id;
        this.$('activeSeal').textContent = active.kanji;
        this.$('activeName').textContent = active.name;
      }
      const cooling = this.activeCooldown > 0;
      const empowered = active.id === 'empower' && (this.activeEmpowerT > 0 || this.planEmpowered);
      activeHud.classList.toggle('cooling', cooling);
      activeHud.classList.toggle('empowered', empowered);
      const activeCdMax = active.cooldown * this.fateActiveCooldownMul();
      this.$('activeFill').style.width = (cooling ? (1 - this.activeCooldown / activeCdMax) * 100 : 100) + '%';
      this.$('activeStatus').textContent = empowered
        ? (this.planEmpowered ? '本次绘制・入神' : '待发 ' + this.activeEmpowerT.toFixed(1) + ' 秒')
        : this.activeVacuum
          ? '引魂中 ' + Math.max(0, this.activeVacuum.t).toFixed(1) + ' 秒'
          : cooling ? '调息 ' + this.activeCooldown.toFixed(1) + ' 秒' : '可 发 动';
    }
    const skillBadges = G.SKILL_ORDER
      .filter(id => (this.skills[id] || 0) > 0)
      .map(id => {
        const def = G.SKILLS[id], lv = this.skills[id];
        const ascended = lv >= def.max;
        const cooling = id === 'renewal' && this.renewalCd > 0;
        const title = (def.desc + (def.ascension ? '\n' + def.ascension : '')).replace(/"/g, '&quot;');
        return '<span class="skBadge' + (ascended ? ' ascended' : '') + (cooling ? ' cooling' : '') +
          '" title="' + title + '">' + def.kanji +
          (cooling ? ' ' + this.renewalCd.toFixed(1) + 's' : (ascended ? ' 神' : ' Lv.' + lv)) + '</span>';
      })
      .join('');
    const badge =
      '<span class="skillCapacity">秘 ' + this.skillSlotCount() + '/' + this.skillSlotLimit() + '</span>' +
      skillBadges +
      (this.paperShield > 0 ? '<span class="skBadge shield">替身</span>' : '') +
      (this.mirrorShield > 0 ? '<span class="skBadge shield">神镜</span>' : '') +
      (this.renewalShield > 0 ? '<span class="skBadge shield renewal">生盾 ' + Math.ceil(this.renewalShield) + '</span>' : '') +
      (this.comboShield > 0 ? '<span class="skBadge shield">护印 ' + Math.ceil(this.comboShield) + '</span>' : '');
    if (badge !== this._skBadge) { this._skBadge = badge; this.$('skillWrap').innerHTML = badge; }
    this.renderFateHud();
    this.renderBuildHud();
    this.renderItemHud();
    if (this.boss) this.$('bossFill').style.width = (this.boss.hp / this.boss.maxHp * 100) + '%';
  }

  drawWorldMechanics(ctx) {
    const time = performance.now() / 1000;
    if (this.activeVacuum) {
      const v = this.activeVacuum;
      const q = Math.max(0, v.t / v.maxT);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.2 + q * 0.18;
      const grad = ctx.createRadialGradient(v.x, v.y, 20, v.x, v.y, v.r);
      grad.addColorStop(0, 'rgba(130,255,230,.05)');
      grad.addColorStop(0.72, 'rgba(90,225,215,.18)');
      grad.addColorStop(1, 'rgba(65,170,185,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(v.x, v.y);
      ctx.arc(v.x, v.y, v.r, v.ang - 0.72, v.ang + 0.72);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(155,255,235,.62)';
      ctx.lineWidth = 2;
      ctx.setLineDash([16, 13]);
      ctx.lineDashOffset = -time * 90;
      for (const side of [-0.72, 0.72]) {
        ctx.beginPath();
        ctx.moveTo(v.x, v.y);
        ctx.lineTo(v.x + Math.cos(v.ang + side) * v.r, v.y + Math.sin(v.ang + side) * v.r);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(210,255,246,.82)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(v.focusX, v.focusY, 30 + Math.sin(time * 18) * 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    const nodes = this.spiritNodes.filter(n => !n.completed);
    if (nodes.length) {
      const trial = this.spiritTrial;
      const reward = trial && G.SPIRIT_REWARDS[trial.reward];
      const spiritColor = reward ? reward.color : '#ffe2a0';
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.32;
      ctx.strokeStyle = spiritColor; ctx.lineWidth = 1.5;
      ctx.setLineDash([7, 9]); ctx.beginPath();
      ctx.moveTo(nodes[0].x, nodes[0].y);
      for (let i = 1; i < nodes.length; i++) ctx.lineTo(nodes[i].x, nodes[i].y);
      ctx.stroke(); ctx.setLineDash([]);
      for (const node of nodes) {
        const pulse = 1 + Math.sin(time * 3 + node.pulse) * 0.12;
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(9,22,27,.88)'; ctx.strokeStyle = spiritColor; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.arc(node.x, node.y, node.r * pulse, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.globalAlpha = 0.68; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(node.x, node.y, (node.r + 8) * pulse, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff0bd'; ctx.font = 'bold 14px "Noto Serif SC", KaiTi, serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(node.order, node.x, node.y + 1);
      }
      if (trial && reward) {
        const cx = nodes.reduce((sum, node) => sum + node.x, 0) / nodes.length;
        const top = Math.min(...nodes.map(node => node.y));
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = spiritColor;
        ctx.font = 'bold 13px "Noto Serif SC", KaiTi, serif';
        ctx.textAlign = 'center';
        ctx.fillText(reward.name + ' ・ ' + trial.count + ' 连祷 ・ 一笔限定', cx, top - 26);
        if (trial.count >= 8) {
          ctx.fillStyle = '#f0ccff';
          ctx.font = '11px "Noto Serif SC", KaiTi, serif';
          ctx.fillText('高连祷可能显现技能卷轴', cx, top - 10);
        }
      }
      ctx.restore();
    }

    for (const link of this.soulLinks) {
      if (!link.active) continue;
      const pulse = link.pulse > 0 ? 1 : 0.62 + Math.sin(time * 7 + link.born) * 0.15;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = '#ff394d'; ctx.lineWidth = link.pulse > 0 ? 9 : 6;
      ctx.beginPath(); ctx.moveTo(link.a.x, link.a.y); ctx.lineTo(link.b.x, link.b.y); ctx.stroke();
      ctx.strokeStyle = '#ffd0c8'; ctx.lineWidth = 1.4; ctx.setLineDash([11, 8]);
      ctx.lineDashOffset = -time * 55;
      ctx.beginPath(); ctx.moveTo(link.a.x, link.a.y); ctx.lineTo(link.b.x, link.b.y); ctx.stroke();
      for (const end of [link.a, link.b]) {
        ctx.strokeStyle = '#ff6270'; ctx.lineWidth = link.pulse > 0 ? 4 : 2.2;
        ctx.beginPath(); ctx.arc(end.x, end.y, end.r + 9, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.setLineDash([]); ctx.restore();
    }

    for (const curse of this.bossCurses) {
      if (curse.dead) continue;
      const q = curse.t / curse.maxT, flash = 0.55 + Math.sin(time * 12) * 0.18;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = flash;
      ctx.strokeStyle = q < 0.3 ? '#ffffff' : '#ff5368'; ctx.fillStyle = 'rgba(120,10,35,.18)';
      ctx.lineWidth = q < 0.3 ? 5 : 3; ctx.setLineDash([14, 9]);
      if (curse.kind === 'cut') {
        ctx.beginPath(); ctx.moveTo(curse.a.x, curse.a.y); ctx.lineTo(curse.b.x, curse.b.y); ctx.stroke();
        ctx.font = 'bold 17px serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffb0b8';
        ctx.fillText('截', curse.x, curse.y - 14);
      } else {
        ctx.beginPath(); ctx.arc(curse.x, curse.y, curse.r + (1 - q) * 18, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.font = 'bold 22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = curse.kind === 'seal' ? '#ffd0d8' : '#d9b0ff';
        ctx.fillText(curse.kind === 'seal' ? '環' : '覆', curse.x, curse.y + 1);
      }
      ctx.setLineDash([]); ctx.restore();
    }
  }

  drawFormGuide(ctx, pathData, form) {
    if (!form || !pathData || pathData.pts.length < 2) return;
    const def = G.TRAJECTORY_FORMS[form.id];
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = form.ready ? 0.68 : 0.28;
    ctx.strokeStyle = def.color; ctx.lineWidth = form.ready ? 5 : 2;
    ctx.setLineDash(form.ready ? [12, 7] : [5, 8]);
    ctx.beginPath(); ctx.moveTo(pathData.pts[0].x, pathData.pts[0].y);
    for (let i = 1; i < pathData.pts.length; i++) ctx.lineTo(pathData.pts[i].x, pathData.pts[i].y);
    ctx.stroke(); ctx.setLineDash([]);
    const markers = form.id === 'knot' ? form.crosses :
      form.id === 'zigzag' ? form.turns :
        form.id === 'retrace' ? form.retracePoints.slice(0, 5) : [];
    for (const point of markers) {
      ctx.fillStyle = def.color;
      ctx.beginPath(); ctx.arc(point.x, point.y, form.ready ? 8 : 5, 0, Math.PI * 2); ctx.fill();
    }
    if (form.id === 'spiral' && form.center) {
      ctx.strokeStyle = def.color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(form.center.x, form.center.y, 17, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  // ============ 绘制 ============
  draw(ctx) {
    ctx.save();
    ctx.translate(G.FX.shakeX, G.FX.shakeY);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    G.Scene.drawUnder(ctx);
    this.drawWorldMechanics(ctx);
    for (const z of this.zones) z.draw(ctx);
    for (const g of this.gems) g.draw(ctx);
    for (const k of this.pickups) k.draw(ctx);

    // 敌人按 y 排序绘制
    const list = this.enemies.slice().sort((a, b) => a.y - b.y);
    for (const e of list) e.draw(ctx, this);
    if (this.boss) this.boss.draw(ctx);
    for (const f of this.foxfires) f.draw(ctx);
    for (const b of this.bullets) b.draw(ctx);
    if (this.chainPull) this.drawChainPull(ctx);
    if (this.dash && this.player.state === 'dash' && !this.dash.movePlayer) this.drawWeaponRunner(ctx);

    // 冲刺速度光带
    if (this.player.state === 'dash' && this.ribbon.length > 1) {
      const rb = this.ribbon;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      for (let i = 1; i < rb.length; i++) {
        const t = i / rb.length;
        ctx.strokeStyle = 'rgba(180,240,255,' + (t * 0.5).toFixed(3) + ')';
        ctx.lineWidth = 1 + t * 11;
        ctx.beginPath();
        ctx.moveTo(rb[i - 1].x, rb[i - 1].y);
        ctx.lineTo(rb[i].x, rb[i].y);
        ctx.stroke();
      }
      ctx.restore();
    }
    G.FX.drawAfters(ctx);
    if (this.state !== 'over') this.player.draw(ctx, this);
    if (this.dash && this.player.state === 'dash' && this.dash.weapon === 'naginata') this.drawNaginata(ctx);
    if (this.dash && this.player.state === 'dash' && this.dash.weapon === 'fans') this.drawFans(ctx);
    if (this.weaponTelegraph) this.drawWeaponTelegraph(ctx);

    // 轨迹
    if (this.planning && this.trail.length > 1) {
      const gesture = this.gesturePathData();
      this.drawFormGuide(ctx, gesture, this.currentForm || this.analyzeTrajectory(gesture));
      const preview = this.weaponPathData();
      this.drawTrail(ctx, preview.pts, 1, true, preview.weapon);
    } else if (this.trailFade) {
      this.drawTrail(ctx, this.trailFade.pts, this.trailFade.t, false, this.trailFade.weapon);
    }

    G.FX.draw(ctx);
    G.Scene.drawOver(ctx);
    if (this.state !== 'over') this.player.drawLocator(ctx, this, true);
    ctx.restore();
    G.Scene.drawVignette(ctx);
  }

  drawWeaponRunner(ctx) {
    const d = this.dash, pos = d.runner || this.dashPointAt(d.s);
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(pos.ang);
    ctx.globalCompositeOperation = 'lighter';
    if (d.weapon === 'bow') {
      ctx.strokeStyle = '#ffe2a0'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-19, 0); ctx.lineTo(18, 0); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(9, -6); ctx.lineTo(11, 0); ctx.lineTo(9, 6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,220,130,.45)'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(-8, 0); ctx.stroke();
    } else if (d.weapon === 'gohei') {
      ctx.strokeStyle = '#f1d7a0'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(22, 0); ctx.stroke();
      ctx.strokeStyle = '#f8f2df'; ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(7, 0); ctx.lineTo(12, -12); ctx.lineTo(17, 3); ctx.lineTo(23, -10);
      ctx.moveTo(7, 0); ctx.lineTo(12, 12); ctx.lineTo(17, -3); ctx.lineTo(23, 10);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,225,150,.5)'; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.moveTo(-38, 0); ctx.lineTo(-10, 0); ctx.stroke();
    } else {
      ctx.strokeStyle = '#d3a0ff'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0, 15, -1.15, 1.15); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, 15, -1.15, 1.15); ctx.stroke();
      ctx.fillStyle = '#ffe2a0';
      ctx.beginPath(); ctx.moveTo(7, -14); ctx.lineTo(22, -5); ctx.lineTo(10, -2); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  drawFans(ctx) {
    const p = this.player;
    ctx.save();
    ctx.translate(p.x, p.y - 5);
    ctx.rotate(p.dir);
    ctx.globalCompositeOperation = 'lighter';
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(5, side * 13);
      ctx.rotate(side * 0.55);
      ctx.fillStyle = 'rgba(255,125,185,.62)';
      ctx.strokeStyle = '#ffe7f2';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.arc(-3, 0, 27, -0.72, 0.72);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    ctx.strokeStyle = 'rgba(255,150,215,.38)';
    ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, 48, -1.15, 1.15); ctx.stroke();
    ctx.restore();
  }

  drawNaginata(ctx) {
    const p = this.player;
    ctx.save();
    ctx.translate(p.x, p.y - 5);
    ctx.rotate(p.dir);
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = '#d6a65f'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-36, 0); ctx.lineTo(42, 0); ctx.stroke();
    ctx.fillStyle = '#f4fbff';
    ctx.beginPath();
    ctx.moveTo(38, -4); ctx.lineTo(72, 0); ctx.lineTo(42, 7); ctx.lineTo(31, 2);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(170,235,255,.5)'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(82, 0); ctx.stroke();
    ctx.restore();
  }

  drawChainPull(ctx) {
    const pull = this.chainPull, q = G.util.clamp(pull.t / pull.dur, 0, 1);
    const scale = 1 - q * 0.72;
    ctx.save();
    ctx.translate(pull.x, pull.y);
    ctx.scale(scale, scale);
    ctx.translate(-pull.x, -pull.y);
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(210,145,255,.75)';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.moveTo(pull.pts[0].x, pull.pts[0].y);
    for (let i = 1; i < pull.pts.length; i++) ctx.lineTo(pull.pts[i].x, pull.pts[i].y);
    ctx.closePath(); ctx.stroke();
    ctx.restore();
  }

  drawWeaponTelegraph(ctx) {
    const line = this.weaponTelegraph;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 28) * 0.28;
    ctx.strokeStyle = '#f4ffff';
    ctx.lineWidth = 0.75;
    ctx.beginPath(); ctx.moveTo(line.a.x, line.a.y); ctx.lineTo(line.b.x, line.b.y); ctx.stroke();
    ctx.restore();
  }

  drawTrail(ctx, pts, alpha, live, weaponId) {
    const p = this.player;
    const weapon = G.WEAPONS[weaponId] || this.activeWeapon();
    const thin = weapon.id === 'odachi';
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      if (pts.length === 2) ctx.lineTo(pts[1].x, pts[1].y);
      else {
        for (let i = 1; i < pts.length - 1; i++) {
          const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      }
    };
    ctx.globalCompositeOperation = 'lighter';
    // 外辉
    path();
    ctx.strokeStyle = thin ? 'rgba(220,250,255,.12)' : 'rgba(110,200,255,.16)';
    ctx.lineWidth = thin ? 4 : 11; ctx.stroke();
    // 流动能量
    path();
    ctx.strokeStyle = 'rgba(150,230,255,.5)'; ctx.lineWidth = thin ? 1.2 : 4.5;
    ctx.setLineDash([16, 12]); ctx.lineDashOffset = -performance.now() / 18;
    ctx.stroke(); ctx.setLineDash([]);
    // 亮芯
    path();
    ctx.strokeStyle = '#ecfdff'; ctx.lineWidth = thin ? 0.65 : 1.8; ctx.stroke();

    if (live) {
      const end = pts[pts.length - 1];
      const pulse = 1 + Math.sin(performance.now() / 130) * 0.15;
      // 落点
      ctx.strokeStyle = 'rgba(180,240,255,.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(end.x, end.y, 12 * pulse, 0, 6.2832); ctx.stroke();
      ctx.beginPath(); ctx.arc(end.x, end.y, 4, 0, 6.2832); ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      // 只有会移动巫女的武器显示落点分身；远程武器显示自身印记。
      if (weapon.movePlayer) {
        G.drawMiko(ctx, end.x, end.y, {
          dir: G.util.angTo(p.x, p.y, end.x, end.y),
          pose: 'fin', ghost: 'cyan', alpha: 0.55, staticSprite: true
        });
      } else {
        ctx.font = 'bold 22px "Noto Serif SC", KaiTi, serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffe9a8';
        ctx.fillText(weapon.kanji, end.x, end.y);
      }
      // 锁定数
      if (this.locks.length) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.font = 'bold 15px "Noto Serif SC", KaiTi, serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffe9a8';
        ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineWidth = 3;
        const txt = '鎖 ' + this.locks.length + ' / ' + p.stats.maxLock;
        ctx.strokeText(txt, end.x, end.y - 26);
        ctx.fillText(txt, end.x, end.y - 26);
      }
    }
    ctx.restore();
  }
};
