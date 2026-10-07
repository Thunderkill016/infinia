// Test logic G2: LOD cây/cỏ theo khoảng cách camera — hàm thuần trích từ app.js
// Chạy: node tests/g2-lod.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../app.js', import.meta.url), 'utf-8');
const m = src.match(/\/\/ \[G2-TESTABLE-START\]([\s\S]*?)\/\/ \[G2-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [G2-TESTABLE-*] trong app.js'); process.exit(1); }

const sandbox = {};
// Bỏ dòng chú thích đầu sau marker rồi eval phần code thuần;
// const/function trong vm không tự gắn vào sandbox → export tường minh qua globalThis
runInNewContext(
  m[1].slice(m[1].indexOf('\n') + 1) + '\n;globalThis.__g2 = { LOD_HYST, LOD_THRESH, lodThresholds, pickLOD, grassVisibleAt };',
  sandbox);
const { LOD_HYST, LOD_THRESH, lodThresholds, pickLOD, grassVisibleAt } = sandbox.__g2;

let pass = 0, fail = 0;
function eq(name, got, want) {
  if (got === want) { pass++; }
  else { fail++; console.error(`FAIL ${name}: got ${got}, want ${want}`); }
}
const MED = LOD_THRESH.med, LOW = LOD_THRESH.low, HIGH = LOD_THRESH.high;

// 1. Hằng số hysteresis đúng ±5m
eq('LOD_HYST = 5', LOD_HYST, 5);

// 2. Ngưỡng theo preset: Thấp hung hăng nhất, Cao thoáng nhất
eq('low.near = 30', LOW.near, 30);
eq('low.far = 60', LOW.far, 60);
eq('med.near = 40', MED.near, 40);
eq('med.far = 80', MED.far, 80);
eq('high.near = 50', HIGH.near, 50);
eq('high.far = 100', HIGH.far, 100);
eq('low hung hăng hơn med (near nhỏ hơn)', LOW.near < MED.near, true);
eq('med hung hăng hơn high (near nhỏ hơn)', MED.near < HIGH.near, true);

// 3. lodThresholds: preset lạ/chưa set → fallback Vừa
eq('fallback preset lạ → med', lodThresholds('weird'), MED);
eq('fallback null → med', lodThresholds(null), MED);
eq('low giữ nguyên', lodThresholds('low'), LOW);

// 4. pickLOD lần đầu (prev=-1): chọn thẳng theo ngưỡng, không hysteresis
eq('lần đầu d=10 → 0 (gần)', pickLOD(10, -1, MED), 0);
eq('lần đầu d=40 → 0 (đúng biên near)', pickLOD(40, -1, MED), 0);
eq('lần đầu d=41 → 1 (giữa)', pickLOD(41, -1, MED), 1);
eq('lần đầu d=80 → 1 (đúng biên far)', pickLOD(80, -1, MED), 1);
eq('lần đầu d=81 → 2 (xa, cull)', pickLOD(81, -1, MED), 2);
eq('lần đầu d=200 → 2', pickLOD(200, -1, MED), 2);

// 5. Hysteresis: đang ở mức gần (0) — phải vượt near+5 mới hạ, không pop ở biên
eq('prev=0 d=44 → 0 (chưa vượt 45)', pickLOD(44, 0, MED), 0);
eq('prev=0 d=45 → 0 (đúng biên +hyst)', pickLOD(45, 0, MED), 0);
eq('prev=0 d=46 → 1 (vượt 45)', pickLOD(46, 0, MED), 1);

// 6. Hysteresis: đang ở mức giữa (1) — 2 biên
eq('prev=1 d=36 → 1 (chưa lùi qua 35)', pickLOD(36, 1, MED), 1);
eq('prev=1 d=35 → 1 (đúng biên −hyst)', pickLOD(35, 1, MED), 1);
eq('prev=1 d=34 → 0 (lùi qua 35)', pickLOD(34, 1, MED), 0);
eq('prev=1 d=84 → 1 (chưa vượt 85)', pickLOD(84, 1, MED), 1);
eq('prev=1 d=85 → 1 (đúng biên +hyst)', pickLOD(85, 1, MED), 1);
eq('prev=1 d=86 → 2 (vượt 85)', pickLOD(86, 1, MED), 2);

// 7. Hysteresis: đang ở mức xa (2) — phải lại gần qua far−5 mới hiện
eq('prev=2 d=76 → 2 (chưa qua 75)', pickLOD(76, 2, MED), 2);
eq('prev=2 d=75 → 2 (đúng biên −hyst)', pickLOD(75, 2, MED), 2);
eq('prev=2 d=74 → 1 (qua 75)', pickLOD(74, 2, MED), 1);

// 8. Không pop giật: camera đung đưa quanh ngưỡng near=40 chỉ đổi mức đúng 1 lần
{
  let lvl = 0; const seq = [38, 42, 38, 42, 44, 46]; let changes = 0;
  for (const d of seq) { const nl = pickLOD(d, lvl, MED); if (nl !== lvl) changes++; lvl = nl; }
  eq('đung đưa quanh near: chỉ 1 lần đổi mức', changes, 1);
  eq('kết thúc ở mức 1', lvl, 1);
}
{
  let lvl = 1; const seq = [82, 78, 82, 78, 76, 74]; let changes = 0;
  for (const d of seq) { const nl = pickLOD(d, lvl, MED); if (nl !== lvl) changes++; lvl = nl; }
  eq('đung đưa quanh far (từ mức 1): 0 lần đổi mức', changes, 0);
  eq('giữ nguyên mức 1 (74 vẫn trong [35, 85])', lvl, 1);
}
{
  // Từ mức xa (2) lại gần: chỉ hiện lại khi qua far−hyst
  let lvl = 2; const seq = [82, 78, 82, 78, 76, 74]; let changes = 0;
  for (const d of seq) { const nl = pickLOD(d, lvl, MED); if (nl !== lvl) changes++; lvl = nl; }
  eq('đung đưa quanh far (từ mức 2): chỉ 1 lần đổi mức', changes, 1);
  eq('kết thúc ở mức 1 (74 < 75 → hiện lại)', lvl, 1);
}

// 9. Preset Thấp vs Cao: cùng khoảng cách, Thấp hạ LOD sớm hơn
eq('d=35 lần đầu: low→1, med→0', [pickLOD(35, -1, LOW), pickLOD(35, -1, MED)].join(','), '1,0');
eq('d=35 lần đầu: high→0', pickLOD(35, -1, HIGH), 0);
eq('d=70 lần đầu: low→2, med→1', [pickLOD(70, -1, LOW), pickLOD(70, -1, MED)].join(','), '2,1');
eq('d=70 lần đầu: high→1', pickLOD(70, -1, HIGH), 1);
eq('d=95 lần đầu: med→2, high→1', [pickLOD(95, -1, MED), pickLOD(95, -1, HIGH)].join(','), '2,1');

// 10. Mức LOD tăng đơn điệu theo khoảng cách (không nhảy cóc ngược)
for (const [nm, th] of [['low', LOW], ['med', MED], ['high', HIGH]]) {
  let ok = true, prev = -1;
  for (let d = 0; d <= 150; d += 1) { // prev=-1 mỗi bước = chọn thẳng, phải đơn điệu
    const l = pickLOD(d, -1, th);
    if (l < prev) ok = false;
    prev = l;
  }
  eq(`đơn điệu theo khoảng cách (${nm})`, ok, true);
}

// 11. grassVisibleAt: cỏ/hoa chỉ hiện trong tầm gần (+hyst chống nhấp nháy)
eq('med d=0 → hiện', grassVisibleAt(0, MED), true);
eq('med d=45 → hiện (biên +hyst)', grassVisibleAt(45, MED), true);
eq('med d=46 → ẩn', grassVisibleAt(46, MED), false);
eq('low d=35 → hiện (biên +hyst)', grassVisibleAt(35, LOW), true);
eq('low d=36 → ẩn (cỏ xa ẩn sớm)', grassVisibleAt(36, LOW), false);
eq('high d=55 → hiện', grassVisibleAt(55, HIGH), true);
eq('high d=56 → ẩn', grassVisibleAt(56, HIGH), false);
eq('low ẩn cỏ sớm hơn med (cùng d=40)', [grassVisibleAt(40, LOW), grassVisibleAt(40, MED)].join(','), 'false,true');

// 12. Kiểm tra mức source: render dùng đúng logic LOD
const nRefresh = (src.match(/refreshTreeLOD\(/g) || []).length;
eq('refreshTreeLOD được gọi ≥3 nơi (tạo + Q + tick)', nRefresh >= 3, true);
eq('có 5 mesh LOD cây (trunkL1/leafL1)', src.includes('trunkL1') && src.includes('leafL1'), true);
eq('lá đơn giản ít cạnh hơn (5)', src.includes('leafSimpGeo'), true);
eq('bucket rỗng thì ẩn (0 draw call)', src.includes('trunkL0.visible = nT > 0') && src.includes('leafL1.visible = nL1 > 0'), true);
eq('LOD chạy trong tick (throttle lodTick)', src.includes('lodTick') && src.includes('refreshGrassLOD(camera.position.x'), true);
eq('đổi preset Q tính lại LOD ngay', src.includes('refreshTreeLOD(camera.position.x, camera.position.z); // G2: đổi preset'), true);
eq('obstacles vẫn giữ cho va chạm', src.includes('obstacles.push({ x, z, r: 0.55 * s })'), true);
eq('cây LOD vẫn đổ bóng', (src.match(/m\.castShadow = true; m\.frustumCulled = false;/g) || []).length >= 1, true);

console.log(`g2-lod: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
