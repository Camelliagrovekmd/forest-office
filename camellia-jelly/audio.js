// 소리: WebAudio 합성만 (파일 없음)
let ctx = null, master = null, on = true;

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  ctx = new AC(); master = ctx.createGain(); master.gain.value = on ? 0.55 : 0; master.connect(ctx.destination);
}
export function setSound(v) { on = v; if (master) master.gain.setTargetAtTime(v ? 0.55 : 0, ctx.currentTime, 0.05); }
export function soundOn() { return on; }

function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
function osc(type, f, t, dur, peak, a = 0.01) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); o.connect(g); g.connect(master); env(g, t, a, peak, dur); o.start(t); o.stop(t + a + dur + 0.05); return o; }
function noise(t, dur, peak, fType = 'bandpass', f = 1200, q = 1) {
  const n = Math.max(1, Math.floor(ctx.sampleRate * (dur + 0.05))), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = ctx.createBufferSource(); s.buffer = b; const fl = ctx.createBiquadFilter(); fl.type = fType; fl.frequency.value = f; fl.Q.value = q; const g = ctx.createGain();
  s.connect(fl); fl.connect(g); g.connect(master); env(g, t, 0.01, peak, dur); s.start(t); s.stop(t + dur + 0.05); return fl;
}
const ok = () => ctx && on;

// 꺄르르: 짧은 고음 웃음 4~6번
export function giggle(pitch = 1) { if (!ok()) return; const t0 = ctx.currentTime; const n = 4 + (Math.random() * 3 | 0);
  for (let i = 0; i < n; i++) { const t = t0 + i * 0.085, f = (720 + Math.random() * 160) * pitch * (1 - i * 0.03); const o = osc('triangle', f, t, 0.06, 0.18, 0.008); o.frequency.exponentialRampToValueAtTime(f * 1.35, t + 0.03); o.frequency.exponentialRampToValueAtTime(f * 0.9, t + 0.07); } }
// 첨벙
export function splash(k = 1) { if (!ok()) return; const t = ctx.currentTime; const f = noise(t, 0.35 * k, 0.35 * k, 'lowpass', 1800, 0.7); f.frequency.exponentialRampToValueAtTime(300, t + 0.3);
  osc('sine', 260, t, 0.12, 0.12).frequency.exponentialRampToValueAtTime(90, t + 0.12); }
// 퐁
export function pop(p = 1) { if (!ok()) return; const t = ctx.currentTime; const o = osc('sine', 520 * p, t, 0.12, 0.3, 0.004); o.frequency.exponentialRampToValueAtTime(1100 * p, t + 0.05); }
// 젤리 흔들림: 낮게 출렁이는 소리
export function wobble(k = 1) { if (!ok()) return; const t = ctx.currentTime; const o = ctx.createOscillator(), g = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain();
  o.type = 'sine'; o.frequency.value = 150; l.frequency.value = 9; lg.gain.value = 40; l.connect(lg); lg.connect(o.frequency); o.connect(g); g.connect(master); env(g, t, 0.02, 0.22 * k, 0.45); o.start(t); l.start(t); o.stop(t + 0.55); l.stop(t + 0.55); }
// 부엉
export function hoot() { if (!ok()) return; const t = ctx.currentTime; for (const [d, f] of [[0, 410], [0.32, 380]]) { const o = osc('sine', f, t + d, 0.24, 0.25, 0.04); o.frequency.exponentialRampToValueAtTime(f * 0.86, t + d + 0.26); } }
// 냐옹
export function meow() { if (!ok()) return; const t = ctx.currentTime; const o = osc('sawtooth', 600, t, 0.42, 0.08, 0.04); o.frequency.linearRampToValueAtTime(900, t + 0.12); o.frequency.linearRampToValueAtTime(520, t + 0.45);
  const o2 = osc('sine', 600, t, 0.42, 0.12, 0.04); o2.frequency.linearRampToValueAtTime(900, t + 0.12); o2.frequency.linearRampToValueAtTime(520, t + 0.45); }
// 찰칵 (셀카)
export function shutter() { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.05, 0.4, 'highpass', 3000, 0.5); noise(t + 0.07, 0.05, 0.3, 'highpass', 2500, 0.5); }
// 반짝 (트리 장식)
export function chime(i = 0) { if (!ok()) return; const t = ctx.currentTime, base = [784, 880, 988, 1175, 1319][i % 5]; osc('sine', base, t, 0.5, 0.15, 0.005); osc('sine', base * 2, t, 0.3, 0.05, 0.005); }
// 놀람
export function gasp() { if (!ok()) return; const t = ctx.currentTime; const o = osc('triangle', 500, t, 0.18, 0.2, 0.01); o.frequency.exponentialRampToValueAtTime(1200, t + 0.15); }
// 타자 다다다
export function tick() { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.02, 0.08, 'highpass', 4000, 0.8); }
// 쿨쿨
export function snore() { if (!ok()) return; const t = ctx.currentTime; noise(t, 0.6, 0.06, 'lowpass', 400, 1); }
