// Test logic v5: hàm thuần ngày–đêm (lerpHex, dayNightAt) trích từ app.js
// Chạy: node tests/v5-daynight.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../app.js', import.meta.url), 'utf-8');
const m = src.match(/\/\/ \[V5-TESTABLE-START\]([\s\S]*?)\/\/ \[V5-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [V5-TESTABLE-*] trong app.js'); process.exit(1); }

const sandbox = {};
// Bỏ dòng đầu (" — hàm thuần..." còn sót sau marker) rồi eval phần code thuần;
// const/function trong vm không tự gắn vào sandbox → export tường minh qua globalThis
runInNewContext(
  m[1].slice(m[1].indexOf('\n') + 1) + '\n;globalThis.__dn = { lerpHex, dayNightAt, DN_KEYS };',
  sandbox);
const { lerpHex, dayNightAt, DN_KEYS } = sandbox.__dn;

let pass = 0, fail = 0;
function eq(name, got, want) {
  if (got === want) { pass++; }
  else { fail++; console.error(`FAIL ${name}: got ${got}, want ${want}`); }
}
function near(name, got, want, eps = 1e-9) {
  if (Math.abs(got - want) <= eps) { pass++; }
  else { fail++; console.error(`FAIL ${name}: got ${got}, want ~${want}`); }
}

// 1. lerpHex cơ bản
eq('lerp đen→trắng 50%', lerpHex(0x000000, 0xffffff, 0.5), 0x808080);
eq('lerp đỏ→xanh 50%', lerpHex(0xff0000, 0x0000ff, 0.5), 0x800080);
eq('lerp k=0', lerpHex(0x123456, 0xabcdef, 0), 0x123456);
eq('lerp k=1', lerpHex(0x123456, 0xabcdef, 1), 0xabcdef);

// 2. đúng keyframe
eq('bình minh sunI', dayNightAt(0).sunI, 1.6);
// G3 vòng này: cập nhật kỳ vọng theo fix V3/V3b đã chốt (Hoàng yêu cầu giảm chói:
// nắng trưa sunI 2.6→1.6, key 0.10 sunI→1.5) — test cũ giữ số cũ nên fail, không phải regression
eq('trưa sunI', dayNightAt(0.25).sunI, 1.6);
eq('nửa đêm star', dayNightAt(0.75).star, 1);
eq('nửa đêm top', dayNightAt(0.75).top, 0x060a1a);
eq('hoàng hôn sunC', dayNightAt(0.5).sunC, 0xff8a4d);

// 3. nội suy giữa 2 key: 0.05 nằm giữa 0.00 (sunI 1.6) và 0.10 (sunI 1.5 sau fix V3b)
near('giữa sáng sunI', dayNightAt(0.05).sunI, 1.55);

// 4. wrap quanh 1→0: 0.96 nằm giữa 0.92 (star 0.4) và 1.00=key0 (star 0), k=0.5
near('wrap star', dayNightAt(0.96).star, 0.2);

// 5. wrap biên
eq('t=1 bằng t=0 (sunI)', dayNightAt(1).sunI, dayNightAt(0).sunI);
near('t âm hợp lệ', dayNightAt(-0.1).star, dayNightAt(0.9).star);

// 6. đủ field, kiểu số
const d = dayNightAt(0.33);
for (const f of ['top','mid','bot','sunC','sunI','hemiS','hemiG','hemiI','fog','star','water']) {
  if (typeof d[f] !== 'number' || Number.isNaN(d[f])) { fail++; console.error(`FAIL field ${f}`); }
  else pass++;
}
if (d.star < 0 || d.star > 1) { fail++; console.error('FAIL star ngoài [0,1]'); } else pass++;

// 7. keyframe sắp xếp tăng dần theo t
let sorted = true;
for (let i = 1; i < DN_KEYS.length; i++) if (DN_KEYS[i].t <= DN_KEYS[i-1].t) sorted = false;
eq('DN_KEYS tăng dần', sorted, true);

console.log(`v5-daynight: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
