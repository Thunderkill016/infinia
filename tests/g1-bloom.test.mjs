// Test logic G1: bloom giả (sprite glow) — hàm thuần trích từ app.js
// Chạy: node tests/g1-bloom.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../app.js', import.meta.url), 'utf-8');
const m = src.match(/\/\/ \[G1-TESTABLE-START\]([\s\S]*?)\/\/ \[G1-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [G1-TESTABLE-*] trong app.js'); process.exit(1); }

const sandbox = {};
// Bỏ dòng chú thích đầu sau marker rồi eval phần code thuần;
// const/function trong vm không tự gắn vào sandbox → export tường minh qua globalThis
runInNewContext(
  m[1].slice(m[1].indexOf('\n') + 1) + '\n;globalThis.__g1 = { glowIntensity, bloomAllowed, toggleBloom, glowTextureSpec };',
  sandbox);
const { glowIntensity, bloomAllowed, toggleBloom, glowTextureSpec } = sandbox.__g1;

let pass = 0, fail = 0;
function eq(name, got, want) {
  if (got === want) { pass++; }
  else { fail++; console.error(`FAIL ${name}: got ${got}, want ${want}`); }
}
function near(name, got, want, eps = 1e-9) {
  if (Math.abs(got - want) <= eps) { pass++; }
  else { fail++; console.error(`FAIL ${name}: got ${got}, want ~${want}`); }
}

// 1. toggle B đổi trạng thái
eq('toggle true→false', toggleBloom(true), false);
eq('toggle false→true', toggleBloom(false), true);

// 2. preset Thấp tắt bloom luôn (để giữ FPS), các preset khác giữ trạng thái
eq('low tắt bloom dù đang bật', bloomAllowed('low', true), false);
eq('low tắt bloom dù đang tắt', bloomAllowed('low', false), false);
eq('med giữ bloom khi bật', bloomAllowed('med', true), true);
eq('high giữ bloom khi bật', bloomAllowed('high', true), true);
eq('high tắt khi bloom off', bloomAllowed('high', false), false);

// 3. glow scale theo cường độ đêm: ban đêm rõ, ban ngày mờ
near('đêm rõ (night=1)', glowIntensity(1, 2.0), 2.0);
near('ngày mờ (night=0)', glowIntensity(0, 2.0), 0.36);
near('giữa đêm (night=0.5)', glowIntensity(0.5, 1.0), 0.59);
near('night>1 bị kẹp', glowIntensity(1.5, 1.0), 1.0);
near('night<0 bị kẹp', glowIntensity(-0.3, 1.0), 0.18);
let mono = true;
for (let n = 0; n < 1; n += 0.05)
  if (glowIntensity(n + 0.05, 1) < glowIntensity(n, 1)) mono = false;
eq('cường độ tăng đơn điệu theo night', mono, true);

// 4. glow texture tồn tại: spec hợp lệ (tâm đặc → viền trong suốt)
const spec = glowTextureSpec();
eq('spec.size = 128', spec.size, 128);
eq('có ≥3 stops', spec.stops.length >= 3, true);
eq('stop đầu alpha 1 (tâm đặc)', spec.stops[0].a, 1);
eq('stop cuối alpha 0 (viền trong suốt)', spec.stops[spec.stops.length - 1].a, 0);
let ordered = true, fading = true;
for (let i = 1; i < spec.stops.length; i++) {
  if (spec.stops[i].o <= spec.stops[i - 1].o) ordered = false;
  if (spec.stops[i].a > spec.stops[i - 1].a) fading = false;
}
eq('stops tăng dần theo bán kính', ordered, true);
eq('alpha giảm dần ra viền', fading, true);

// 5. code render dùng đúng spec + có handler phím B (kiểm tra mức source)
eq('tạo glowTex từ glowTextureSpec', src.includes('glowTextureSpec()') && src.includes('createRadialGradient'), true);
eq('có handler KeyB', src.includes("'KeyB'"), true);
eq('có nút btn-bloom', src.includes('btn-bloom'), true);
eq('dùng AdditiveBlending', src.includes('THREE.AdditiveBlending'), true);
eq('updateGlows chạy trong tick', src.includes('updateGlows(dt)'), true);

console.log(`g1-bloom: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
