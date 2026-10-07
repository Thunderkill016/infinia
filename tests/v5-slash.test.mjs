// Test V5: vệt chém vòng cung mảnh, trong suốt dần về rìa
// Chạy: node tests/v5-slash.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/combat.js', import.meta.url), 'utf-8');

// 1) Đoạn testable V5 (hằng số + hàm thuần, không dùng THREE/browser)
const m = src.match(/\/\/ \[V5-TESTABLE-START\]([\s\S]*?)\/\/ \[V5-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [V5-TESTABLE-*] trong js/combat.js'); process.exit(1); }
const sandbox = {};
runInNewContext(
  m[1].slice(m[1].indexOf('\n') + 1) + '\n;globalThis.__v5 = { V5_ARC_THETA, V5_INNER_R, V5_OUTER_R, v5AlphaAt };',
  sandbox);
const { V5_ARC_THETA, V5_INNER_R, V5_OUTER_R, v5AlphaAt } = sandbox.__v5;

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error(`FAIL ${name}`); }
}

// --- A. Hằng số: cung mảnh ~100°, vành mỏng ---
const deg100 = 100 * Math.PI / 180;
ok('V5_ARC_THETA ≈ 100°', Math.abs(V5_ARC_THETA - deg100) < 0.01);
ok('V5_ARC_THETA < π (cung mảnh, không phải nửa vòng)', V5_ARC_THETA < Math.PI);
ok('V5_ARC_THETA > 0', V5_ARC_THETA > 0);
ok('V5_INNER_R > 0', V5_INNER_R > 0);
ok('V5_OUTER_R > V5_INNER_R', V5_OUTER_R > V5_INNER_R);
const ratio = V5_OUTER_R / V5_INNER_R;
ok(`vành mỏng: outer/inner = ${ratio.toFixed(2)} < 1.5`, ratio < 1.5);

// --- B. v5AlphaAt: alpha giảm dần từ rìa trong ra rìa ngoài ---
const t0 = 0.1; // đang hiện vệt
ok('alpha > 0 lúc mới chém (rìa trong)', v5AlphaAt(0.05, t0) > 0);
let mono = true;
let prev = Infinity;
for (let r = 0.05; r <= 0.95; r += 0.05) {
  const a = v5AlphaAt(r, t0);
  if (a > prev + 1e-9) mono = false;
  prev = a;
}
ok('alpha giảm đơn điệu khi radiusFrac tăng', mono);
ok('alpha ở rìa ngoài ≈ 0', v5AlphaAt(0.99, t0) < 0.05);

// --- C. v5AlphaAt: mờ dần theo thời gian, hết giờ thì tắt hẳn ---
ok('alpha = 0 khi hết thời gian (timeFrac = 1)', v5AlphaAt(0.2, 1) === 0);
ok('alpha = 0 khi quá thời gian', v5AlphaAt(0.2, 1.5) === 0);
let timeMono = true;
prev = Infinity;
for (let t = 0.05; t <= 0.95; t += 0.05) {
  const a = v5AlphaAt(0.3, t);
  if (a > prev + 1e-9) timeMono = false;
  prev = a;
}
ok('alpha giảm đơn điệu khi timeFrac tăng', timeMono);
ok('alpha luôn trong 0–1', (() => {
  for (let r = 0; r <= 1.01; r += 0.1) for (let t = 0; t <= 1.01; t += 0.1) {
    const a = v5AlphaAt(r, t);
    if (!(a >= 0 && a <= 1)) return false;
  }
  return true;
})());

// --- D. combat.js dùng hằng V5 cho geometry + giữ additive/depthWrite ---
ok('RingGeometry dùng V5_INNER_R/V5_OUTER_R/V5_ARC_THETA',
  /RingGeometry\(\s*V5_INNER_R,\s*V5_OUTER_R,[\s\S]*?V5_ARC_THETA/.test(src));
ok('giữ AdditiveBlending', /atkArcG[\s\S]{0,1500}AdditiveBlending/.test(src));
ok('giữ depthWrite: false', /atkArcG[\s\S]{0,1500}depthWrite:\s*false/.test(src));
ok('gameplay giữ nguyên: atkState.cd/atkState.t không đổi logic',
  /atkState\.cd = 0\.5/.test(src) && /atkState\.t = 0\.15/.test(src));

console.log(`v5-slash: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
