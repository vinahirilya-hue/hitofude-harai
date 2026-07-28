// ============ 启动 ============
window.addEventListener('load', () => {
  const cv = document.getElementById('cv');
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  cv.width = G.W * dpr; cv.height = G.H * dpr;
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);

  G.Assets.load();
  G.FX.init();
  G.Scene.build();
  G.Input.init(cv);
  G.game = new G.Game();
  G.game.showBest();
  if (G.Encyclopedia) {
    G.Encyclopedia.init();
    const codexPreview = new URLSearchParams(location.search).get('codex');
    if (codexPreview) G.Encyclopedia.open(codexPreview);
  }

  // ---- 设置持久化 ----
  let settings = { vol: 70, quality: 1 };
  try { Object.assign(settings, JSON.parse(localStorage.getItem('hitofude_set') || '{}')); } catch (e) {}
  const saveSet = () => { try { localStorage.setItem('hitofude_set', JSON.stringify(settings)); } catch (e) {} };
  const volA = document.getElementById('volSlider'), volB = document.getElementById('volSlider2');
  const qual = document.getElementById('qualitySel');
  volA.value = volB.value = settings.vol;
  qual.value = String(settings.quality);
  G.Audio.volume = settings.vol / 100;
  G.FX.setQuality(parseFloat(settings.quality));
  const onVol = v => { settings.vol = +v; volA.value = volB.value = v; G.Audio.setVolume(settings.vol / 100); saveSet(); };
  volA.oninput = e => onVol(e.target.value);
  volB.oninput = e => onVol(e.target.value);
  qual.onchange = e => { settings.quality = e.target.value; G.FX.setQuality(parseFloat(e.target.value)); saveSet(); };

  // ---- 按钮 ----
  const game = G.game;
  document.getElementById('btnStart').onclick = () => { G.Audio.ensure(); G.Audio.select(); game.openFateSelect(); };
  document.getElementById('btnRetry').onclick = () => { G.Audio.ensure(); game.openFateSelect(); };
  document.getElementById('btnAgain').onclick = () => { G.Audio.ensure(); game.openFateSelect(); };
  document.getElementById('btnFateBack').onclick = () => game.closeFateSelect();
  document.getElementById('btnResume').onclick = () => game.resume();
  document.getElementById('btnQuit').onclick = () => game.quitToTitle();
  document.getElementById('btnReroll').onclick = () => game.rerollShop();
  document.getElementById('btnNextWave').onclick = () => game.leaveShop();
  document.getElementById('itemHudHead').onclick = () => document.getElementById('itemHud').classList.toggle('open');
  window.addEventListener('keydown', e => {
    if (e.code === 'Escape' && game.state === 'fate') {
      game.closeFateSelect();
      G.Audio.select();
      return;
    }
    if (e.code === 'Escape' && G.Encyclopedia && G.Encyclopedia.isOpen()) {
      G.Encyclopedia.close();
      G.Audio.select();
      return;
    }
    if (e.code === 'Enter') {
      if (game.state === 'title' && !(G.Encyclopedia && G.Encyclopedia.isOpen())) {
        G.Audio.ensure(); game.openFateSelect();
      }
      else if (game.state === 'over' || game.state === 'win') game.openFateSelect();
    }
    if (e.code === 'KeyR' && (game.state === 'over' || game.state === 'win')) game.openFateSelect();
  });

  // ---- 自适应缩放 ----
  const stage = document.getElementById('stage');
  const fit = () => {
    const s = Math.min(window.innerWidth / G.W, window.innerHeight / G.H);
    cv.style.width = G.W * s + 'px';
    cv.style.height = G.H * s + 'px';
    stage.style.width = G.W * s + 'px';
    stage.style.height = G.H * s + 'px';
  };
  fit();
  window.addEventListener('resize', fit);

  // 切后台自动暂停
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.state === 'play') game.togglePause();
  });

  // ---- 主循环 ----
  let last = performance.now();
  const loop = now => {
    const rdt = Math.min(0.05, (now - last) / 1000);
    last = now;
    game.update(rdt);
    if (game.state !== 'paused') game.draw(ctx);
    G.Input.endFrame();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});
