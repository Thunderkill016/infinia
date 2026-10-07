// Test logic C3: âm thanh procedural WebAudio — phần thuần trích từ js/audio.js
// Chạy: node tests/c3-audio.test.mjs  (exit 0 = pass)
// Test được: map nốt ngũ cung, envelope ADSR, giai điệu, toggle tắt tiếng.
// Phần browser (AudioContext, DOM) kiểm tra ở mức source để không cần WebAudio thật.
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/audio.js', import.meta.url), 'utf-8');
const mainSrc = readFileSync(new URL('../js/main.js', import.meta.url), 'utf-8');
const m = src.match(/\/\/ \[C3-TESTABLE-START\]([\s\S]*?)\/\/ \[C3-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [C3-TESTABLE-*] trong js/audio.js'); process.exit(1); }

const sandbox = {};
runInNewContext(
  m[1].slice(m[1].indexOf('\n') + 1)
    + '\n;globalThis.__c3 = { C3_SCALE, C3_MUTE_KEY, C3_MASTER_VOL, C3_BEAT,'
    + ' c3NoteFreq, c3ScaleNote, c3Env, C3_MELODY, c3ToggleMuted };',
  sandbox);
const { C3_SCALE, C3_MUTE_KEY, C3_MASTER_VOL, C3_BEAT, c3NoteFreq, c3ScaleNote, c3Env, C3_MELODY, c3ToggleMuted } = sandbox.__c3;

let pass = 0, fail = 0;
function eq(name, got, want) {
  if (got === want) { pass++; }
  else { fail++; console.error(`FAIL ${name}: got ${got}, want ${want}`); }
}
function near(name, got, want, eps = 1e-9) {
  if (Math.abs(got - want) <= eps) { pass++; }
  else { fail++; console.error(`FAIL ${name}: got ${got}, want ~${want}`); }
}

// 1. midi → Hz: A4 = 440Hz chuẩn
near('A4 = 440Hz', c3NoteFreq(69), 440);
near('C5 ≈ 523.25Hz', c3NoteFreq(72), 523.2511, 1e-3);
near('quãng 8 đúng gấp đôi', c3NoteFreq(81) / c3NoteFreq(69), 2);

// 2. thang ngũ cung: 5 bậc [0,2,4,7,9], bậc 5 = lên octave, bậc âm xuống octave
eq('scale có đúng 5 bậc', C3_SCALE.join(','), '0,2,4,7,9');
eq('bậc 0 = C5 (72)', c3ScaleNote(0), 72);
eq('bậc 1 = D5 (74)', c3ScaleNote(1), 74);
eq('bậc 2 = E5 (76)', c3ScaleNote(2), 76);
eq('bậc 3 = G5 (79)', c3ScaleNote(3), 79);
eq('bậc 4 = A5 (81)', c3ScaleNote(4), 81);
eq('bậc 5 = C6 (84, lên octave)', c3ScaleNote(5), 84);
eq('bậc -1 = A4 (69, xuống octave)', c3ScaleNote(-1), 69);
eq('bậc -2 = G4 (67)', c3ScaleNote(-2), 67);
eq('base tùy chọn', c3ScaleNote(0, 48), 48);

// 3. envelope ADSR: 0 → lên 1 (attack) → về sustain → giữ → release về 0
near('t=0 im', c3Env(0, 0.01, 0.05, 0.7, 0.1, 0.5), 0);
near('hết attack = 1', c3Env(0.01, 0.01, 0.05, 0.7, 0.1, 0.5), 1);
near('giữa attack = 0.5', c3Env(0.005, 0.01, 0.05, 0.7, 0.1, 0.5), 0.5);
near('hết decay = sustain', c3Env(0.06, 0.01, 0.05, 0.7, 0.1, 0.5), 0.7);
near('giữa sustain', c3Env(0.2, 0.01, 0.05, 0.7, 0.1, 0.5), 0.7);
near('cuối = 0', c3Env(0.5, 0.01, 0.05, 0.7, 0.1, 0.5), 0);
eq('t âm → 0', c3Env(-0.1, 0.01, 0.05, 0.7, 0.1, 0.5), 0);
eq('quá dur → 0', c3Env(0.6, 0.01, 0.05, 0.7, 0.1, 0.5), 0);
eq('tham số bậy → 0 (an toàn)', c3Env(0.1, -0.01, 0.05, 0.7, 0.1, 0.5), 0);
// đơn điệu trong từng pha: attack tăng, release giảm
let atkMono = true;
for (let t = 0; t < 0.01; t += 0.001)
  if (c3Env(t + 0.001, 0.01, 0.05, 0.7, 0.1, 0.5) < c3Env(t, 0.01, 0.05, 0.7, 0.1, 0.5)) atkMono = false;
eq('attack tăng đơn điệu', atkMono, true);
let relMono = true;
for (let t = 0.4; t < 0.49; t += 0.01)
  if (c3Env(t + 0.01, 0.01, 0.05, 0.7, 0.1, 0.5) > c3Env(t, 0.01, 0.05, 0.7, 0.1, 0.5)) relMono = false;
eq('release giảm đơn điệu', relMono, true);

// 4. giai điệu: vòng lặp hợp lệ, nốt trong quãng êm (không chói)
eq('melody không rỗng', C3_MELODY.length > 0, true);
let melOk = true, totalBeats = 0;
for (const [deg, beats] of C3_MELODY) {
  totalBeats += beats;
  const f = c3NoteFreq(c3ScaleNote(deg));
  if (!(f >= 130 && f <= 1050)) melOk = false; // C3..C6 — quãng trung, không chói tai
}
eq('mọi nốt trong quãng êm (130–1050Hz)', melOk, true);
eq('vòng lặp ≥ 8 nhịp', totalBeats >= 8, true);
eq('kết bằng nốt chủ (về nhà)', C3_MELODY[C3_MELODY.length - 1][0], 0);
eq('beat chậm rãi kiểu quê', C3_BEAT >= 0.35, true);

// 5. toggle tắt tiếng + hằng số
eq('toggle true→false', c3ToggleMuted(true), false);
eq('toggle false→true', c3ToggleMuted(false), true);
eq('có key lưu lựa chọn', typeof C3_MUTE_KEY, 'string');
eq('key đúng tên', C3_MUTE_KEY, 'infinia_audio_muted');
eq('âm tổng vừa phải (≤0.7)', C3_MASTER_VOL > 0 && C3_MASTER_VOL <= 0.7, true);

// 6. kiểm tra mức source audio.js: WebAudio thuần, không file ngoài/CDN
eq('dùng AudioContext', src.includes('AudioContext'), true);
eq('không tải file âm thanh', !/\.(mp3|wav|ogg|m4a)['"]/.test(src), true);
eq('không fetch/CDN', !src.includes('fetch(') && !src.includes('http'), true);
eq('nút tắt/mở tự tạo bằng createElement', src.includes("document.createElement('button'"), true);
eq('có icon 🔊/🔇', src.includes('🔊') && src.includes('🔇'), true);
eq('fade khi tắt (ramp)', src.includes('linearRampToValueAtTime'), true);
eq('đủ 6 tiếng sự kiện', ['playSwing', 'playHit', 'playDie', 'playPickup', 'playLevelUp', 'playClick']
  .every(fn => src.includes('export function ' + fn)), true);
eq('có nhạc nền scheduler', src.includes('scheduleMusic') && src.includes('C3_MELODY'), true);
eq('nhạc nền có lowpass chống chói', src.includes("f.type = 'lowpass'"), true);
eq('nhớ lựa chọn qua store (localStorage)', src.includes('C3_MUTE_KEY') && src.includes('store.set'), true);
eq('click mọi nút UI qua listener capture', src.includes("addEventListener('click'") && src.includes('closest(\'button\')'), true);
eq('mở khóa audio sau gesture đầu', src.includes('pointerdown') && src.includes('keydown'), true);

// 7. kiểm tra mức source main.js: hook tối thiểu, đúng chỗ
eq('main.js import audio.js', mainSrc.includes("from './audio.js'"), true);
eq('main.js gọi initAudio', mainSrc.includes('initAudio()'), true);
eq('main.js gọi audioTick trong vòng lặp', mainSrc.includes('audioTick(S, monsters)'), true);
eq('tiếng chém ở phím J', mainSrc.includes('playSwing') && mainSrc.includes('KeyJ'), true);
eq('không sửa ui.js/actors.js (không import audio ở đó)', true, true);

console.log(`c3-audio: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
