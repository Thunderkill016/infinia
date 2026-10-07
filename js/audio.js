// js/audio.js — âm thanh procedural bằng WebAudio cho INFINIA (item C3, AUTO_DEV.md)
// Không file ngoài, không CDN: mọi tiếng chém/trúng/chết/nhặt/lên cấp/click + nhạc nền
// đều tổng hợp trực tiếp bằng OscillatorNode + GainNode.
// Cách móc sự kiện (không chạm file js/ khác):
//  - main.js gọi audioTick(S, monsters) mỗi frame → tự nhận diện: ∞ tăng (nhặt đồ),
//    LV tăng (lên cấp), quái alive true→false (quái chết), hp quái giảm (chém trúng).
//  - main.js gọi playSwing() ở nút Đánh/phím J (chỉ khi đòn thật sự tung ra: atkState.cd<=0).
//  - Tiếng click nút UI: audio.js tự gắn listener 'click' toàn cục (capture) → mọi <button>
//    đều kêu, không cần sửa ui.js/actors.js.
//  - Nút 🔊/🔇: tự tạo bằng document.createElement, không sửa index.html.

// [C3-TESTABLE-START]
// ----- Logic thuần (không phụ thuộc WebAudio/browser) — test bằng node -----
// Giai điệu quê: thang ngũ cung (pentatonic) Đô trưởng — C D E G A.
// Ngũ cung không có nửa cung (mi-fa, si-đô) nên nghe êm, khó "chói tai" dù lặp lâu.
const C3_SCALE = [0, 2, 4, 7, 9]; // quãng nửa cung của 5 bậc
const C3_MUTE_KEY = 'infinia_audio_muted'; // key lưu lựa chọn tắt/mở vào store (trong phiên)
const C3_MASTER_VOL = 0.5; // âm lượng tổng vừa phải
const C3_BEAT = 0.45; // 1 nhịp nhạc nền (giây) — chậm rãi kiểu quê

// midi → tần số Hz (A4 = midi 69 = 440Hz)
function c3NoteFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}
// Bậc trong thang ngũ cung (âm/dương đều được, tự lên/xuống octave) → midi.
// baseMidi mặc định 72 = C5 (quãng trung, không chói).
function c3ScaleNote(degree, baseMidi) {
  const base = baseMidi === undefined ? 72 : baseMidi;
  const n = C3_SCALE.length;
  const oct = Math.floor(degree / n);
  const idx = ((degree % n) + n) % n;
  return base + oct * 12 + C3_SCALE[idx];
}
// Envelope ADSR thuần → gain 0..1 tại thời điểm t (giây), tổng dài dur.
// a: attack, d: decay, s: sustain (0..1), r: release.
function c3Env(t, a, d, s, r, dur) {
  if (t < 0 || t >= dur || dur <= 0) return 0;
  if (a <= 0 || d < 0 || r < 0 || s < 0 || s > 1) return 0; // tham số bậy → im luôn cho an toàn
  if (t < a) return t / a;
  if (t < a + d) return 1 - (1 - s) * ((t - a) / d);
  if (t < dur - r) return s;
  return Math.max(0, s * (1 - (t - (dur - r)) / r));
}
// Giai điệu nền 16 nhịp, vòng lặp: lên xuống quanh nốt chủ, kết bằng nốt thấp
// rồi về chủ — kiểu ru con/hát ví, không "dồn dập" như nhạc game hành động.
const C3_MELODY = [
  [0, 1], [2, 1], [4, 1], [3, 1], [2, 2], [1, 1], [0, 1], [2, 2],
  [4, 1], [3, 1], [2, 1], [1, 1], [0, 2], [-1, 1], [-2, 1], [0, 2],
];
// Đảo trạng thái tắt tiếng (thuần — test được; bản browser dùng setMuted bên dưới)
function c3ToggleMuted(m) { return !m; }
// [C3-TESTABLE-END]

import { store } from './core.js';

// ----- State engine (browser) -----
let ctx = null; // AudioContext — chỉ tạo sau cử chỉ người dùng (luật trình duyệt)
let master = null; // gain tổng (fade khi tắt/mở ở đây)
let sfxBus = null, musicBus = null; // 2 bus riêng: tiếng hiệu ứng + nhạc nền
let muted = false;
let muteBtn = null;
let musicTimer = null, musicNextT = 0, musicStep = 0;

function ensureCtx() {
  // Trả về true nếu engine sẵn sàng (đã có ctx, kể cả đang suspended chờ gesture).
  try {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false; // trình duyệt cổ: im lặng, game vẫn chạy
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : C3_MASTER_VOL;
    master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 1; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.8; musicBus.connect(master);
    startMusic();
    return true;
  } catch (e) { ctx = null; return false; }
}

// 1 nốt hiệu ứng: oscillator quét tần số + envelope mũ (tắt mượt, không "tạch" loa)
function tone(freq, freqEnd, type, dur, vol, when) {
  if (!ctx || muted) return;
  try {
    const t0 = ctx.currentTime + (when || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(Math.max(1, freq), t0);
    if (freqEnd && freqEnd !== freq)
      o.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol), t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(sfxBus);
    o.start(t0); o.stop(t0 + dur + 0.05);
  } catch (e) { /* driver audio lỗi: bỏ qua, không crash game */ }
}

// ----- Các tiếng hiệu ứng (export để main.js gọi) -----
export function playSwing() { // vung kiếm: "vút" quét xuống
  tone(700, 180, 'triangle', 0.13, 0.10, 0);
}
export function playHit() { // chém trúng: "cốp" trầm ngắn
  tone(190, 70, 'square', 0.12, 0.14, 0);
}
export function playDie() { // quái chết: 3 nốt rơi dần
  tone(c3NoteFreq(67), 0, 'triangle', 0.16, 0.16, 0);
  tone(c3NoteFreq(64), 0, 'triangle', 0.16, 0.16, 0.09);
  tone(c3NoteFreq(60), 0, 'triangle', 0.28, 0.16, 0.18);
}
export function playPickup() { // nhặt ∞: "ting-ting" cao, vui tai
  tone(c3NoteFreq(88), 0, 'sine', 0.22, 0.09, 0);
  tone(c3NoteFreq(93), 0, 'sine', 0.28, 0.09, 0.07);
}
export function playLevelUp() { // lên cấp: arpeggio đi lên, ăn mừng nhẹ
  const ns = [72, 76, 79, 84];
  for (let i = 0; i < ns.length; i++)
    tone(c3NoteFreq(ns[i]), 0, 'triangle', 0.32, 0.14, i * 0.09);
}
export function playClick() { // bấm nút UI: "tách" rất ngắn, nhỏ
  tone(880, 0, 'sine', 0.05, 0.05, 0);
}

// ----- Nhạc nền: scheduler nhìn trước 0.4s, lặp giai điệu ngũ cung -----
function musicNote(midi, t, dur, vol) {
  const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
  o.type = 'triangle';
  o.frequency.value = c3NoteFreq(midi);
  f.type = 'lowpass'; f.frequency.value = 1200; // cắt chói
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol), t + 0.06);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.07, dur * 0.95));
  o.connect(f); f.connect(g); g.connect(musicBus);
  o.start(t); o.stop(t + dur);
}
function scheduleMusic() {
  if (!ctx) return;
  try {
    while (musicNextT < ctx.currentTime + 0.4) {
      const step = C3_MELODY[musicStep % C3_MELODY.length];
      const dur = step[1] * C3_BEAT;
      if (!muted) {
        musicNote(c3ScaleNote(step[0]), musicNextT, dur, 0.07); // lead nhỏ nhẹ
        if (musicStep % 4 === 0)
          musicNote(c3ScaleNote(0, 48), musicNextT, C3_BEAT * 3, 0.045); // bass đệm thưa
      }
      musicNextT += dur;
      musicStep++;
    }
  } catch (e) { /* bỏ qua tick lỗi */ }
}
function startMusic() {
  if (musicTimer || !ctx) return;
  musicNextT = ctx.currentTime + 0.15;
  musicStep = 0;
  musicTimer = setInterval(scheduleMusic, 150);
}

// ----- Tắt/mở tiếng: fade 0.35s khi tắt (không "cụp" đột ngột), nhớ lựa chọn -----
function applyMute(m, fade) {
  muted = m;
  try { store.set(C3_MUTE_KEY, m ? '1' : '0'); } catch (e) {}
  if (muteBtn) muteBtn.textContent = m ? '🔇' : '🔊';
  if (ctx && master) {
    try {
      const t = ctx.currentTime, dt = fade ? 0.35 : 0.01;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(m ? 0 : C3_MASTER_VOL, t + dt);
    } catch (e) {}
  }
}
export function toggleMute() { applyMute(!muted, true); }

// ----- Nhận diện sự kiện từ state game (main.js gọi mỗi frame) -----
// So snapshot: ∞ tăng → nhặt; LV tăng → lên cấp; quái alive 1→0 → chết; hp quái giảm → trúng đòn.
let prevSnap = null;
export function audioTick(S, monsters) {
  if (!prevSnap) { // frame đầu: chụp baseline, không kêu
    prevSnap = { inf: S.inf, lv: S.lv, m: monsters.map(m => ({ alive: m.alive, hp: m.hp })) };
    return;
  }
  if (S.inf > prevSnap.inf) playPickup();
  if (S.lv > prevSnap.lv) playLevelUp();
  prevSnap.inf = S.inf; prevSnap.lv = S.lv;
  for (let i = 0; i < monsters.length; i++) {
    const m = monsters[i];
    let p = prevSnap.m[i];
    if (!p) { prevSnap.m[i] = { alive: m.alive, hp: m.hp }; continue; }
    if (p.alive && !m.alive) playDie();
    else if (m.alive && !p.alive) { /* quái respawn: reset im lặng, không kêu */ }
    else if (m.alive && m.hp < p.hp - 1e-6) playHit();
    p.alive = m.alive; p.hp = m.hp;
  }
}

// ----- Khởi động: nút 🔊/🔇 + click UI + mở khóa audio sau gesture đầu -----
export function initAudio() {
  try { muted = store.get(C3_MUTE_KEY) === '1'; } catch (e) { muted = false; } // tôn trọng lần tắt trước; mặc định BẬT
  // Nút tắt/mở: tự tạo, góc phải-trên, ≥48px cho ngón tay (M2) — KHÔNG sửa index.html
  muteBtn = document.createElement('button');
  muteBtn.textContent = muted ? '🔇' : '🔊';
  muteBtn.title = 'Bật/tắt tiếng';
  muteBtn.style.cssText = 'position:fixed;top:calc(10px + env(safe-area-inset-top));right:10px;'
    + 'width:48px;height:48px;font-size:24px;background:rgba(20,16,10,.55);color:#fff;'
    + 'border:1px solid rgba(255,255,255,.25);border-radius:12px;z-index:9999;cursor:pointer;';
  muteBtn.addEventListener('click', (e) => { e.stopPropagation(); ensureCtx(); toggleMute(); });
  document.body.appendChild(muteBtn);
  // Mọi nút UI bấm đều "tách" một tiếng — gắn 1 lần ở capture, không đụng ui.js/actors.js
  document.addEventListener('click', (e) => {
    if (!e.target || e.target === muteBtn) return;
    if (e.target.closest && e.target.closest('button')) playClick();
  }, true);
  // WebAudio chỉ chạy sau cử chỉ người dùng: thử tạo ngay (có thể suspended),
  // đồng thời mở khóa ở lần chạm/phím đầu tiên.
  ensureCtx();
  const unlock = () => ensureCtx();
  addEventListener('pointerdown', unlock);
  addEventListener('keydown', unlock);
}
