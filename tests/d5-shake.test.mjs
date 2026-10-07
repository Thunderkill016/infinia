// Test D5: screenshake theo công thức trauma — trích block [D5-TESTABLE-*] từ js/engine.js rồi eval
// Chạy: node tests/d5-shake.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/engine.js', import.meta.url), 'utf-8');
const m = src.match(/\/\/ \[D5-TESTABLE-START\]([\s\S]*?)\/\/ \[D5-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [D5-TESTABLE-*] trong js/engine.js'); process.exit(1); }

// Block viết cho ES module (dùng `export`) → lột `export ` ở đầu dòng để eval được trong vm thường.
// Bỏ dòng đầu (phần text sau marker) theo convention của v1b-shot.test.mjs
const code = m[1].slice(m[1].indexOf('\n') + 1).replace(/^export\s+/gm, '');
const sandbox = {};
runInNewContext(
  code + '\n;globalThis.__d5 = { D5_HIT, D5_HURT, D5_BOSS, D5_MAX, D5_DECAY, d5AddShake, d5Decay, d5Offset };',
  sandbox);
const { D5_HIT, D5_HURT, D5_BOSS, D5_MAX, D5_DECAY, d5AddShake, d5Decay, d5Offset } = sandbox.__d5;

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error(`FAIL ${name}`); }
}
function approx(name, got, want, eps = 1e-9) {
  if (Math.abs(got - want) <= eps) { pass++; }
  else { fail++; console.error(`FAIL ${name}: got ${got}, want ${want}`); }
}

// 1. Hằng số đúng spec D5
ok('D5_HIT = 0.2 (đánh trúng quái)', D5_HIT === 0.2);
ok('D5_HURT = 0.4 (player bị đánh)', D5_HURT === 0.4);
ok('D5_BOSS = 0.7 (hạ boss/quái to)', D5_BOSS === 0.7);
ok('D5_MAX = 0.35 (biên độ tối đa)', D5_MAX === 0.35);
ok('D5_DECAY > 0 (decay về 0 theo thời gian)', D5_DECAY > 0);

// 2. Cộng dồn, kẹp 0..1
approx('cộng dồn 0.2 + 0.4 = 0.6', d5AddShake(d5AddShake(0, D5_HIT), D5_HURT), 0.6);
approx('cộng dồn boss: 0.6 + 0.7 kẹp 1', d5AddShake(d5AddShake(0.6, D5_BOSS), 0), 1);
ok('kẹp trần 1: 0.8 + 0.7 → 1', d5AddShake(0.8, D5_BOSS) === 1);
ok('kẹp sàn 0: 0.1 − 0.5 → 0', d5AddShake(0.1, -0.5) === 0);
ok('trauma 0 ban đầu', d5AddShake(0, 0) === 0);

// 3. Decay về 0 theo thời gian, không âm
approx('decay: 0.5 − 0.5×dt(1s) → 0', d5Decay(0.5, 0.5), 0);
approx('decay: 1.0 sau 0.5s → 0.5', d5Decay(1.0, 0.5), 1.0 - D5_DECAY * 0.5);
ok('decay hết → đúng 0', d5Decay(0.2, 10) === 0);
ok('decay từ 0 vẫn 0, không âm', d5Decay(0, 1) === 0);
ok('decay không bao giờ âm', d5Decay(0.01, 100) === 0);

// 4. Offset = trauma² × biên độ tối đa
approx('trauma 0.5 → 0.25 × max', d5Offset(0.5, true), 0.25 * D5_MAX);
approx('trauma 1 → đúng max', d5Offset(1, true), D5_MAX);
approx('trauma 0.2 → 0.04 × max (rung nhỏ gần như biến mất)', d5Offset(0.2, true), 0.04 * D5_MAX);
ok('trauma 0 → offset 0', d5Offset(0, true) === 0);
ok('trauma > 1 vẫn kẹp về max', d5Offset(1.5, true) === D5_MAX);
ok('trauma âm → offset 0', d5Offset(-0.3, true) === 0);

// 5. Cờ tắt/bật (D9: công tắc độc lập gắn menu Debug sau, mặc định BẬT)
ok('tắt cờ → offset 0 dù trauma đầy', d5Offset(1, false) === 0);
ok('bật cờ → offset bình thường', d5Offset(1, true) === D5_MAX);

console.log(`D5 screenshake: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
