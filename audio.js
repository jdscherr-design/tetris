'use strict';

// Every sound is synthesized live with Web Audio, so there are no audio files to license.
const Sfx = (() => {
  let ctx = null;
  let master = null;
  let noiseBuffer = null;
  let driveCurve = null;
  let volume = 0.6;
  let muted = false;
  let alarmTimer = null;

  // Browsers only allow audio to start from a user gesture, so this runs on the first click or key.
  function unlock() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      ctx = new AudioCtx();
      master = ctx.createGain();
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -10;
      limiter.ratio.value = 12;
      master.connect(limiter);
      limiter.connect(ctx.destination);
      applyVolume();

      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const samples = noiseBuffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;

      driveCurve = new Float32Array(1024);
      for (let i = 0; i < 1024; i++) {
        const x = (i / 511.5) - 1;
        driveCurve[i] = Math.tanh(x * 5);
      }
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function applyVolume() {
    if (master) master.gain.value = muted ? 0 : volume;
  }

  const ready = () => ctx && ctx.state === 'running' && !muted && volume > 0;

  function envelope(t, dur, gain, attack = 0.005) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    return g;
  }

  function tone({ type = 'sine', from, to = from, t = ctx.currentTime, dur = 0.2, gain = 0.2, attack, dest = master, detune = 0 }) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.detune.value = detune;
    osc.frequency.setValueAtTime(from, t);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = envelope(t, dur, gain, attack);
    osc.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    return osc;
  }

  function noise({ t = ctx.currentTime, dur = 0.1, gain = 0.2, type = 'bandpass', freq = 1800, q = 1, dest = master }) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = envelope(t, dur, gain, 0.002);
    src.connect(filter);
    filter.connect(g);
    g.connect(dest);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  function distortion(dest = master) {
    const shaper = ctx.createWaveShaper();
    shaper.curve = driveCurve;
    shaper.connect(dest);
    return shaper;
  }

  const clap = (t, gain = 0.3) => noise({ t, dur: 0.05, gain, freq: 1500 + Math.random() * 900, q: 0.9 });

  // Goofy boing, with an occasional squeak so it doesn't get stale.
  function rotate() {
    if (!ready()) return;
    const t = ctx.currentTime;
    const p = 0.85 + Math.random() * 0.4;
    if (Math.random() < 0.18) {
      tone({ type: 'triangle', from: 1100 * p, to: 1900 * p, t, dur: 0.07, gain: 0.1 });
      return;
    }
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220 * p, t);
    osc.frequency.exponentialRampToValueAtTime(620 * p, t + 0.04);
    osc.frequency.exponentialRampToValueAtTime(300 * p, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(430 * p, t + 0.13);
    const g = envelope(t, 0.15, 0.17);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  function move() {
    if (ready()) tone({ type: 'square', from: 240, t: ctx.currentTime, dur: 0.025, gain: 0.025 });
  }

  function softLock() {
    if (ready()) tone({ type: 'triangle', from: 170, to: 90, t: ctx.currentTime, dur: 0.07, gain: 0.14 });
  }

  // Slide whistle up.
  function hold() {
    if (ready()) tone({ type: 'sine', from: 400, to: 1400, t: ctx.currentTime, dur: 0.16, gain: 0.1 });
  }

  function denied() {
    if (!ready()) return;
    const t = ctx.currentTime;
    tone({ type: 'square', from: 180, t, dur: 0.08, gain: 0.07 });
    tone({ type: 'square', from: 140, t: t + 0.09, dur: 0.12, gain: 0.07 });
  }

  // Bass-boosted impact, heavier the further the piece fell.
  function hardDrop(cells = 10) {
    if (!ready()) return;
    const t = ctx.currentTime;
    const weight = 0.65 + Math.min(cells, 20) * 0.025;
    const drive = distortion();
    tone({ type: 'sine', from: 170, to: 34, t, dur: 0.28, gain: 0.8 * weight, dest: drive });
    tone({ type: 'sine', from: 90, to: 30, t, dur: 0.34, gain: 0.6 * weight });
    noise({ t, dur: 0.05, gain: 0.45 * weight, type: 'lowpass', freq: 1400, q: 0.5 });
  }

  // A few people clap, then one person keeps going a little too long.
  function single() {
    if (!ready()) return;
    const t = ctx.currentTime;
    [0, 0.13, 0.22, 0.38, 0.5, 0.74].forEach((d) => clap(t + d, 0.26));
    clap(t + 1.15, 0.17);
  }

  // Formant synthesis of a low, disappointed "bruh".
  function bruh() {
    if (!ready()) return;
    const t = ctx.currentTime;
    const dur = 0.62;
    const voice = ctx.createOscillator();
    voice.type = 'sawtooth';
    voice.frequency.setValueAtTime(118, t);
    voice.frequency.linearRampToValueAtTime(104, t + 0.12);
    voice.frequency.exponentialRampToValueAtTime(72, t + dur);

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(1, t + 0.05);
    amp.gain.setValueAtTime(1, t + dur - 0.18);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    voice.connect(amp);

    const out = ctx.createGain();
    out.gain.value = 1.5;
    out.connect(distortion());

    // Formants slide from an "r" shape into "uh".
    [[420, 690, 1, 9], [1050, 1200, 0.65, 11], [1500, 2400, 0.3, 12]].forEach(([start, end, level, q]) => {
      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.Q.value = q;
      band.frequency.setValueAtTime(start, t);
      band.frequency.setValueAtTime(start, t + 0.05);
      band.frequency.exponentialRampToValueAtTime(end, t + 0.17);
      const g = ctx.createGain();
      g.gain.value = level;
      amp.connect(band);
      band.connect(g);
      g.connect(out);
    });

    tone({ type: 'sine', from: 110, to: 60, t, dur: 0.07, gain: 0.5 }); // the "b"
    tone({ type: 'sine', from: 75, to: 52, t, dur: dur, gain: 0.3, attack: 0.05 }); // bass boost
    voice.start(t);
    voice.stop(t + dur + 0.02);
  }

  function triple() {
    if (!ready()) return;
    const t = ctx.currentTime;
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => {
      tone({ type: 'square', from: f, t: t + i * 0.075, dur: 0.16, gain: 0.1 });
    });
    tone({ type: 'sawtooth', from: 392, t: t + 0.46, dur: 0.5, gain: 0.1 });
    tone({ type: 'sawtooth', from: 523, t: t + 0.46, dur: 0.5, gain: 0.1 });
    tone({ type: 'sawtooth', from: 784, t: t + 0.46, dur: 0.5, gain: 0.1 });
    for (let i = 0; i < 12; i++) clap(t + 0.4 + Math.random() * 0.6, 0.18);
  }

  // Way too much orchestra for clearing four rows of blocks.
  function tetris() {
    if (!ready()) return;
    const t = ctx.currentTime;
    const brass = (at, dur, gain, freqs) => freqs.forEach((f) => {
      tone({ type: 'sawtooth', from: f, t: at, dur, gain, attack: 0.012 });
      tone({ type: 'sawtooth', from: f, t: at, dur, gain: gain * 0.7, attack: 0.012, detune: 14 });
    });
    const chord = [131, 196, 262, 330, 392];
    brass(t, 0.13, 0.075, chord);
    brass(t + 0.17, 0.13, 0.075, chord);
    brass(t + 0.34, 0.13, 0.075, chord);
    brass(t + 0.52, 1.5, 0.09, [175, 262, 349, 440, 523, 698]);

    const drive = distortion();
    tone({ type: 'sine', from: 140, to: 28, t: t + 0.52, dur: 1.1, gain: 0.9, dest: drive });
    noise({ t: t + 0.52, dur: 1.4, gain: 0.3, type: 'highpass', freq: 3500, q: 0.4 });

    // A choir that nobody asked for.
    const choir = ctx.createBiquadFilter();
    choir.type = 'bandpass';
    choir.frequency.value = 900;
    choir.Q.value = 3;
    choir.connect(master);
    [262, 349, 440, 523].forEach((f) => {
      tone({ type: 'sawtooth', from: f, t: t + 0.52, dur: 1.55, gain: 0.34, attack: 0.1, dest: choir });
    });

    [1047, 1319, 1568, 2093, 2637].forEach((f, i) => {
      tone({ type: 'triangle', from: f, t: t + 0.9 + i * 0.07, dur: 0.5, gain: 0.08 });
    });
  }

  function siren() {
    if (!ready()) return;
    const t = ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      tone({ type: 'square', from: i % 2 ? 620 : 930, t: t + i * 0.14, dur: 0.13, gain: 0.075, attack: 0.004 });
    }
    tone({ type: 'sawtooth', from: 130, to: 65, t: t + 0.84, dur: 0.22, gain: 0.08 });
  }

  function alarmOn() {
    if (alarmTimer !== null) return;
    siren();
    alarmTimer = setInterval(siren, 3200);
  }

  function alarmOff() {
    clearInterval(alarmTimer);
    alarmTimer = null;
  }

  // Wah, wah, wah, waaaaah, and then it falls apart.
  function gameOver() {
    alarmOff();
    if (!ready()) return;
    const t = ctx.currentTime;
    const notes = [[294, 0, 0.3], [277, 0.34, 0.3], [262, 0.68, 0.3], [247, 1.02, 1.25]];
    const drive = distortion();
    for (const [f, at, dur] of notes) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t + at);
      const wah = ctx.createBiquadFilter();
      wah.type = 'lowpass';
      wah.Q.value = 7;
      wah.frequency.setValueAtTime(350, t + at);
      wah.frequency.linearRampToValueAtTime(1300, t + at + 0.08);
      wah.frequency.linearRampToValueAtTime(420, t + at + dur);
      const g = envelope(t + at, dur, 0.22, 0.02);
      osc.connect(wah);
      wah.connect(g);
      g.connect(master);
      if (dur > 1) {
        const lfo = ctx.createOscillator();
        const depth = ctx.createGain();
        lfo.frequency.value = 5.5;
        depth.gain.value = 9;
        lfo.connect(depth);
        depth.connect(osc.frequency);
        lfo.start(t + at);
        lfo.stop(t + at + dur);
        osc.frequency.setValueAtTime(f, t + at + 0.7);
        osc.frequency.exponentialRampToValueAtTime(f * 0.45, t + at + dur);
        g.connect(drive);
      }
      osc.start(t + at);
      osc.stop(t + at + dur + 0.02);
    }
  }

  function levelUp() {
    if (!ready()) return;
    const t = ctx.currentTime;
    [392, 494, 587, 784].forEach((f, i) => tone({ type: 'square', from: f, t: t + i * 0.06, dur: 0.11, gain: 0.08 }));
  }

  function combo(n) {
    if (!ready()) return;
    tone({ type: 'triangle', from: 500 + Math.min(n, 12) * 90, t: ctx.currentTime, dur: 0.14, gain: 0.12 });
  }

  function chaChing() {
    if (!ready()) return;
    const t = ctx.currentTime;
    tone({ type: 'square', from: 1568, t, dur: 0.08, gain: 0.08 });
    tone({ type: 'square', from: 2093, t: t + 0.08, dur: 0.32, gain: 0.08 });
    noise({ t: t + 0.08, dur: 0.22, gain: 0.08, type: 'highpass', freq: 6000 });
  }

  function ohio() {
    if (!ready()) return;
    const t = ctx.currentTime;
    tone({ type: 'sawtooth', from: 620, to: 62, t, dur: 1.4, gain: 0.09, attack: 0.05 });
    tone({ type: 'sawtooth', from: 648, to: 58, t, dur: 1.4, gain: 0.09, attack: 0.05 });
    tone({ type: 'sine', from: 1800, to: 2600, t: t + 0.5, dur: 0.8, gain: 0.03, attack: 0.3 });
  }

  function warn() {
    if (!ready()) return;
    const t = ctx.currentTime;
    tone({ type: 'square', from: 523, t, dur: 0.09, gain: 0.06 });
    tone({ type: 'square', from: 392, t: t + 0.1, dur: 0.16, gain: 0.06 });
  }

  function click() {
    if (ready()) tone({ type: 'triangle', from: 880, to: 1320, t: ctx.currentTime, dur: 0.05, gain: 0.08 });
  }

  return {
    unlock,
    setVolume(v) { volume = v; applyVolume(); },
    setMuted(m) { muted = m; applyVolume(); },
    rotate, move, softLock, hold, denied, hardDrop,
    single, bruh, triple, tetris,
    alarmOn, alarmOff, gameOver, levelUp, combo, chaChing, ohio, warn, click,
    get alarming() { return alarmTimer !== null; },
  };
})();
