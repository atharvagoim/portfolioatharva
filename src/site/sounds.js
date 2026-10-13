// Key sounds: plays /sounds/key-0.mp3 .. key-8.mp3 when present, otherwise a synthesized fallback (Web Audio).
// Context is created lazily on the first user gesture.
let ctx = null;
let noiseBuf = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// oscillator with an optional pitch glide and a fast decay envelope
function tone(c, { type = 'sine', f0, f1 = f0, dur = 0.15, vol = 0.25, at = 0 }) {
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(c, { filter = 'highpass', freq = 3000, q = 1, dur = 0.05, vol = 0.3, at = 0 }) {
  const t = c.currentTime + at;
  const s = c.createBufferSource();
  const f = c.createBiquadFilter();
  const g = c.createGain();
  s.buffer = noiseBuf;
  f.type = filter;
  f.frequency.value = freq;
  f.Q.value = q;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(c.destination);
  s.start(t);
  s.stop(t + dur + 0.02);
}

const SOUNDS = [
  (c) => { noise(c, { freq: 4000, dur: 0.03, vol: 0.35 }); tone(c, { type: 'square', f0: 1800, f1: 900, dur: 0.04, vol: 0.08 }); }, // 0 clicky
  (c) => { tone(c, { f0: 523, dur: 0.5, vol: 0.28 }); tone(c, { f0: 1046, dur: 0.25, vol: 0.08 }); },                               // 1 marimba
  (c) => tone(c, { f0: 700, f1: 160, dur: 0.12, vol: 0.4 }),                                                                         // 2 pop
  (c) => { tone(c, { type: 'square', f0: 988, dur: 0.07, vol: 0.12 }); tone(c, { type: 'square', f0: 1319, dur: 0.18, vol: 0.12, at: 0.07 }); }, // 3 coin
  (c) => { tone(c, { f0: 150, f1: 70, dur: 0.14, vol: 0.55 }); noise(c, { filter: 'lowpass', freq: 900, dur: 0.06, vol: 0.3 }); },  // 4 thock
  (c) => tone(c, { f0: 300, f1: 900, dur: 0.14, vol: 0.3 }),                                                                         // 5 bubble
  (c) => { noise(c, { filter: 'bandpass', freq: 1800, q: 0.8, dur: 0.12, vol: 0.5 }); tone(c, { f0: 220, f1: 120, dur: 0.08, vol: 0.2 }); }, // 6 snare tap
  (c) => { tone(c, { f0: 784, dur: 0.6, vol: 0.2 }); tone(c, { f0: 1175, dur: 0.6, vol: 0.14, at: 0.06 }); },                        // 7 chime
  (c) => tone(c, { type: 'sawtooth', f0: 1600, f1: 120, dur: 0.22, vol: 0.14 }),                                                     // 8 zap
];

const buffers = []; // decoded mp3s, index = key; null = missing -> synth fallback
const loading = new Set();

function load(c, i) {
  if (loading.has(i)) return;
  loading.add(i);
  fetch(`/sounds/key-${i}.mp3`)
    .then((r) => (r.ok && /audio|mpeg|octet/.test(r.headers.get('content-type') || '') ? r.arrayBuffer() : Promise.reject()))
    .then((ab) => c.decodeAudioData(ab))
    .then((b) => { buffers[i] = b; })
    .catch(() => { buffers[i] = null; });
}

export function playKey(i) {
  const c = audio();
  if (!c) return;
  const b = buffers[i];
  if (b) {
    const src = c.createBufferSource();
    src.buffer = b;
    src.connect(c.destination);
    src.start();
    return;
  }
  if (b === undefined) load(c, i); // first press: fetch the mp3 for next time
  SOUNDS[i]?.(c);
}

// warm all mp3s on the first gesture so the very first presses are already instant
export function preloadKeySounds() {
  const c = audio();
  if (c) for (let i = 0; i < SOUNDS.length; i++) load(c, i);
}
