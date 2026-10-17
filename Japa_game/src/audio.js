// @ts-check
// Sound for the slice, synthesised with Web Audio (no files to download):
// the Lagos street hum, a neighbour's generator, danfo horns, and small
// interface sounds. On by default at low volume, always one tap from mute
// (PRD Q30). Starts only after the player's first tap, as browsers require.

const MUTE_KEY = 'japa-muted';

export function createAudio() {
  /** @type {AudioContext | null} */
  let ctx = null;
  /** @type {GainNode | null} */
  let master = null;
  /** @type {GainNode | null} */
  let ambience = null;
  /** @type {GainNode | null} */
  let generator = null;
  let muted = false;
  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch { /* private mode */ }
  /** @type {ReturnType<typeof setTimeout> | null} */
  let hornTimer = null;

  /** A second of brown noise, looped: the base of street hum and engines. */
  function noiseBuffer(/** @type {AudioContext} */ c) {
    const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.5;
    }
    return buf;
  }

  /** @param {number} freq @param {number} dur @param {OscillatorType} type @param {number} vol @param {number} [when] */
  function tone(freq, dur, type, vol, when = 0) {
    if (!ctx || !master) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  /** A danfo horn somewhere down the street, every few seconds. */
  function scheduleHorn() {
    hornTimer = setTimeout(() => {
      if (ctx && ctx.state === 'running') {
        const base = 380 + Math.random() * 90;
        const n = Math.random() < 0.6 ? 2 : 1;
        for (let i = 0; i < n; i++) {
          tone(base, 0.16, 'square', 0.025, i * 0.22);
          tone(base * 1.26, 0.16, 'square', 0.02, i * 0.22);
        }
      }
      scheduleHorn();
    }, 6000 + Math.random() * 9000);
  }

  return {
    get muted() { return muted; },

    /** Call from the first tap (the Start button). */
    start() {
      if (ctx) return;
      const AC = window.AudioContext ?? /** @type {any} */ (window).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.6;
      master.connect(ctx.destination);
      // street hum: low, filtered noise
      const hum = ctx.createBufferSource();
      hum.buffer = noiseBuffer(ctx);
      hum.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 420;
      ambience = ctx.createGain();
      ambience.gain.value = 0.18;
      hum.connect(lp).connect(ambience).connect(master);
      hum.start();
      scheduleHorn();
    },

    /** The neighbour's generator coughs to life and keeps running. */
    startGenerator() {
      if (!ctx || !master || generator) return;
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = 52;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 260;
      const wobble = ctx.createOscillator();
      wobble.frequency.value = 6.5;
      const depth = ctx.createGain();
      depth.gain.value = 0.012;
      generator = ctx.createGain();
      generator.gain.setValueAtTime(0, ctx.currentTime);
      generator.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1.2);
      wobble.connect(depth).connect(generator.gain);
      o.connect(lp).connect(generator).connect(master);
      o.start();
      wobble.start();
    },

    /** Quieter outside sounds indoors (Dr. Bayo's office). @param {boolean} inside */
    setIndoors(inside) {
      if (!ctx || !ambience) return;
      ambience.gain.linearRampToValueAtTime(inside ? 0.06 : 0.18, ctx.currentTime + 0.4);
      generator?.gain.linearRampToValueAtTime(inside ? 0.015 : 0.05, ctx.currentTime + 0.4);
    },

    tap() { tone(660, 0.07, 'sine', 0.08); },
    buzz() { for (let i = 0; i < 3; i++) tone(170, 0.12, 'square', 0.04, i * 0.2); },
    cash() { tone(1320, 0.1, 'triangle', 0.07); tone(1760, 0.18, 'triangle', 0.06, 0.08); },
    stamp() { tone(90, 0.25, 'sine', 0.2); tone(180, 0.08, 'square', 0.05); },
    receipt() { for (let i = 0; i < 10; i++) tone(2200 + (i % 2) * 300, 0.03, 'square', 0.015, i * 0.06); },

    /** @returns {boolean} The new muted state. */
    toggleMute() {
      muted = !muted;
      try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch { /* private mode */ }
      if (ctx && master) master.gain.linearRampToValueAtTime(muted ? 0 : 0.6, ctx.currentTime + 0.15);
      return muted;
    },

    stop() { if (hornTimer) clearTimeout(hornTimer); },
  };
}
