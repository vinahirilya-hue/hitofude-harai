// ============ 音频：全部 WebAudio 合成，无外部素材 ============
window.G = window.G || {};

G.Audio = {
  ctx: null, master: null, ambGain: null,
  muted: false, volume: 0.7,
  _gemT: 0, _ambT: 0, _noiseBuf: null,

  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return true; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const c = this.ctx;
      this.master = c.createGain();
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 5;
      this.master.connect(comp); comp.connect(c.destination);
      this.master.gain.value = this.muted ? 0 : this.volume;
      // 预生成噪声缓冲
      const len = c.sampleRate * 1.2, buf = c.createBuffer(1, len, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this._noiseBuf = buf;
      return true;
    } catch (e) { return false; }
  },
  setVolume(v) { this.volume = v; if (this.master && !this.muted) this.master.gain.value = v; },
  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : this.volume;
    return this.muted;
  },

  // ---- 基础合成原语 ----
  tone(o) {
    // {f, f2, dur, type, vol, att, curve, detune}
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime + (o.delay || 0);
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + o.dur);
    if (o.detune) osc.detune.value = o.detune;
    const att = o.att || 0.004;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.2, t + att);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    osc.connect(g); g.connect(o.out || this.master);
    osc.start(t); osc.stop(t + o.dur + 0.05);
  },
  noise(o) {
    // {dur, vol, fFrom, fTo, q, type, delay}
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime + (o.delay || 0);
    const src = c.createBufferSource(); src.buffer = this._noiseBuf; src.loop = true;
    const flt = c.createBiquadFilter();
    flt.type = o.type || 'bandpass'; flt.Q.value = o.q || 1;
    flt.frequency.setValueAtTime(o.fFrom || 800, t);
    if (o.fTo) flt.frequency.exponentialRampToValueAtTime(o.fTo, t + o.dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.2, t + (o.att || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    src.connect(flt); flt.connect(g); g.connect(o.out || this.master);
    src.start(t); src.stop(t + o.dur + 0.05);
  },

  // ---- 具名音效 ----
  // 连击命中：五声音阶爬升，越连越亮
  hit(i) {
    const scale = [523.3, 587.3, 659.3, 784.0, 880.0, 1046.5, 1174.7, 1318.5, 1568.0, 1760.0];
    const f = scale[Math.min(i, scale.length - 1)];
    this.tone({ f, f2: f * 0.99, dur: 0.14, type: 'triangle', vol: 0.22 });
    this.tone({ f: f * 2, dur: 0.08, type: 'sine', vol: 0.1 });
    this.noise({ dur: 0.06, vol: 0.14, fFrom: 3200, fTo: 1600, q: 2 });
  },
  dash() {
    this.noise({ dur: 0.32, vol: 0.3, fFrom: 400, fTo: 5200, q: 1.4, att: 0.02 });
    this.tone({ f: 180, f2: 720, dur: 0.25, type: 'sawtooth', vol: 0.05 });
  },
  finisher() {
    this.tone({ f: 130, f2: 55, dur: 0.3, type: 'sine', vol: 0.5 });
    this.noise({ dur: 0.18, vol: 0.2, fFrom: 900, fTo: 200, q: 1 });
    this.tone({ f: 1568, dur: 0.5, type: 'sine', vol: 0.12, delay: 0.03 });
  },
  purify(n) {
    const k = Math.min(n, 16);
    this.noise({ dur: 0.5 + k * 0.02, vol: 0.34, fFrom: 2400, fTo: 300, q: 0.8, type: 'lowpass' });
    this.tone({ f: 95, f2: 42, dur: 0.5, type: 'sine', vol: 0.45 });
    // 铃光闪烁
    const notes = [1046.5, 1174.7, 1318.5, 1568.0, 1760.0, 2093.0];
    for (let i = 0; i < Math.min(3 + k, 9); i++)
      this.tone({ f: notes[i % notes.length] * (1 + Math.random() * 0.01), dur: 0.7, type: 'sine', vol: 0.06, delay: 0.04 + i * 0.045 });
  },
  fox() { this.tone({ f: 880, f2: 1400, dur: 0.16, type: 'sine', vol: 0.12 }); this.noise({ dur: 0.12, vol: 0.06, fFrom: 3000, fTo: 5000, q: 3 }); },
  echo() { this.tone({ f: 660, f2: 1320, dur: 0.3, type: 'triangle', vol: 0.14 }); },
  level() {
    const seq = [523.3, 659.3, 784.0, 1046.5];
    seq.forEach((f, i) => this.tone({ f, dur: 0.34, type: 'triangle', vol: 0.16, delay: i * 0.09 }));
  },
  select() {
    this.tone({ f: 784, f2: 780, dur: 0.5, type: 'triangle', vol: 0.22 });
    this.tone({ f: 1568, dur: 0.3, type: 'sine', vol: 0.07 });
  },
  fizzle() { this.tone({ f: 220, f2: 130, dur: 0.16, type: 'square', vol: 0.08 }); },
  hurt() {
    this.tone({ f: 160, f2: 60, dur: 0.25, type: 'sawtooth', vol: 0.24 });
    this.noise({ dur: 0.2, vol: 0.2, fFrom: 500, fTo: 150, q: 1 });
  },
  gem() {
    const now = performance.now();
    if (now - this._gemT < 60) return;
    this._gemT = now;
    this.tone({ f: 1320 + Math.random() * 300, dur: 0.09, type: 'sine', vol: 0.05 });
  },
  orb() { this.tone({ f: 660, f2: 990, dur: 0.18, type: 'triangle', vol: 0.14 }); },
  heal() { this.tone({ f: 523, f2: 784, dur: 0.3, type: 'sine', vol: 0.16 }); },
  boss() {
    this.tone({ f: 70, f2: 45, dur: 1.2, type: 'sawtooth', vol: 0.4 });
    this.tone({ f: 110, f2: 55, dur: 1.0, type: 'square', vol: 0.14, detune: 12 });
    this.noise({ dur: 1.0, vol: 0.2, fFrom: 200, fTo: 90, q: 0.7, type: 'lowpass' });
  },
  warn() {
    this.tone({ f: 1046, f2: 1040, dur: 1.4, type: 'sine', vol: 0.16 });
    this.tone({ f: 523, dur: 1.6, type: 'sine', vol: 0.1, delay: 0.05 });
  },
  shoot() { this.tone({ f: 420, f2: 260, dur: 0.14, type: 'square', vol: 0.05 }); },
  die() {
    this.tone({ f: 220, f2: 40, dur: 1.6, type: 'sawtooth', vol: 0.3 });
    this.noise({ dur: 1.2, vol: 0.24, fFrom: 800, fTo: 100, q: 1, type: 'lowpass' });
  },
  thunder() {
    this.noise({ dur: 0.1, vol: 0.26, fFrom: 5200, fTo: 1400, q: 1.2 });
    this.noise({ dur: 0.5, vol: 0.2, fFrom: 280, fTo: 55, q: 0.8, type: 'lowpass', delay: 0.05 });
    this.tone({ f: 85, f2: 38, dur: 0.5, type: 'sine', vol: 0.28, delay: 0.04 });
  },
  tension() { this.tone({ f: 380, f2: 1250, dur: 0.3, type: 'sine', vol: 0.05 }); },
  skillGet() {
    const seq = [659.3, 784.0, 1046.5, 1318.5];
    seq.forEach((f, i) => this.tone({ f, dur: 0.4, type: 'triangle', vol: 0.15, delay: i * 0.08 }));
    this.noise({ dur: 0.3, vol: 0.06, fFrom: 3000, fTo: 6000, q: 3, delay: 0.2 });
  },
  victory() {
    const seq = [523.3, 587.3, 784.0, 1046.5, 1174.7, 1568.0];
    seq.forEach((f, i) => this.tone({ f, dur: 0.6, type: 'triangle', vol: 0.14, delay: i * 0.14 }));
  },

  // ---- 环境音：风 + 随机水滴琴音 ----
  startAmbient() {
    if (!this.ctx || this._amb) return;
    const c = this.ctx;
    this.ambGain = c.createGain(); this.ambGain.gain.value = 0.05;
    const src = c.createBufferSource(); src.buffer = this._noiseBuf; src.loop = true;
    const flt = c.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 320; flt.Q.value = 0.4;
    // 风的起伏
    const lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = 0.09; lg.gain.value = 120;
    lfo.connect(lg); lg.connect(flt.frequency);
    src.connect(flt); flt.connect(this.ambGain); this.ambGain.connect(this.master);
    src.start(); lfo.start();
    this._amb = src;
  },
  update(dt) {
    // 随机水滴/远铃
    if (!this.ctx || !this._amb) return;
    this._ambT -= dt;
    if (this._ambT <= 0) {
      this._ambT = 3 + Math.random() * 6;
      const notes = [523.3, 587.3, 698.5, 784.0, 880.0];
      this.tone({ f: G.util.pick(notes) * (Math.random() < 0.3 ? 2 : 1), dur: 1.8, type: 'sine', vol: 0.035, att: 0.02, out: this.ambGain });
    }
  }
};
