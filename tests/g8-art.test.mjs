// Test logic G8: art direction môi trường — 4 kiểu cây + decor quanh nhà
// Chạy: node tests/g8-art.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../app.js', import.meta.url), 'utf-8');
const m = src.match(/\/\/ \[G8-TESTABLE-START\]([\s\S]*?)\/\/ \[G8-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [G8-TESTABLE-*] trong app.js'); process.exit(1); }

const sandbox = {};
runInNewContext(
  m[1].slice(m[1].indexOf('\n') + 1) + '\n;globalThis.__g8 = { TREE_TYPES, pickTreeType, G8_DRAW_CALL_BUDGET, G8_NEW_MESHES };',
  sandbox);
const { TREE_TYPES, pickTreeType, G8_DRAW_CALL_BUDGET, G8_NEW_MESHES } = sandbox.__g8;

let pass = 0, fail = 0;
function eq(name, got, want) {
  if (got === want) { pass++; }
  else { fail++; console.error(`FAIL ${name}: got ${got}, want ${want}`); }
}
function ok(name, cond) { eq(name, !!cond, true); }

// 1. Số loại cây ≥ 3 (thực tế 4)
eq('số loại cây = 4 (≥3)', TREE_TYPES.length, 4);

// 2. Mỗi loại có tên tiếng Việt riêng
const names = TREE_TYPES.map(t => t.vn);
eq('đủ 4 tên Việt', names.join('|'), 'Cây thường|Cây đa|Bụi tre|Cây cau');
eq('tên không trùng', new Set(names).size, 4);

// 3. Silhouette khác nhau rõ: danh sách part của mỗi loại đều khác nhau
const sigs = TREE_TYPES.map(t => JSON.stringify(t.parts));
eq('4 spec part khác nhau hoàn toàn', new Set(sigs).size, 4);
// và dùng geometry lá khác nhau giữa các loại (không phải copy đổi màu)
const leafKinds = TREE_TYPES.map(t => new Set(t.parts.map(p => p.m)).has('leafda') ? 'da' : 'non');
ok('có loại dùng tán dẹt leafda (đa/cau)', leafKinds.includes('da') && leafKinds.includes('non'));
// bụi tre có nhiều thân (cụm), các loại khác 1 thân
const trunkCounts = TREE_TYPES.map(t => t.parts.filter(p => p.m === 'trunk').length);
eq('tre có 3 thân, các loại khác 1 thân', trunkCounts.join(','), '1,1,3,1');

// 4. Mỗi loại đều có bản đơn giản L1 (thân + 1 tầng lá)
for (const t of TREE_TYPES) {
  ok(`${t.vn}: có simple L1`, Array.isArray(t.simple) && t.simple.length >= 2);
  ok(`${t.vn}: simple có thân`, t.simple.some(p => p.m === 'trunk'));
  ok(`${t.vn}: simple có 1 tầng lá`, t.simple.filter(p => p.m === 'leafsimp').length === 1);
}
// thân các loại khác nhau rõ: tre/cau cao mảnh, đa mập lùn
const trunkOf = i => TREE_TYPES[i].simple.find(p => p.m === 'trunk');
ok('tre cao hơn thường (sy)', trunkOf(2).sy > trunkOf(0).sy);
ok('cau cao hơn thường (sy)', trunkOf(3).sy > trunkOf(0).sy);
ok('đa mập hơn thường (sx)', trunkOf(1).sx > trunkOf(0).sx);
ok('đa lùn hơn thường (sy)', trunkOf(1).sy < trunkOf(0).sy);

// 5. pickTreeType: phân bố 50/20/15/15, không bao giờ ra ngoài 0..3
eq('r=0.0 → thường', pickTreeType(0.0), 0);
eq('r=0.49 → thường', pickTreeType(0.49), 0);
eq('r=0.5 → đa', pickTreeType(0.5), 1);
eq('r=0.69 → đa', pickTreeType(0.69), 1);
eq('r=0.7 → tre', pickTreeType(0.7), 2);
eq('r=0.84 → tre', pickTreeType(0.84), 2);
eq('r=0.85 → cau', pickTreeType(0.85), 3);
eq('r=0.99 → cau', pickTreeType(0.99), 3);
{
  const cnt = [0, 0, 0, 0];
  for (let i = 0; i < 20000; i++) cnt[pickTreeType(Math.random())]++;
  ok('thường ~50% (±3)', Math.abs(cnt[0] / 200 - 50) < 3);
  ok('đa ~20% (±2)', Math.abs(cnt[1] / 200 - 20) < 2);
  ok('tre ~15% (±2)', Math.abs(cnt[2] / 200 - 15) < 2);
  ok('cau ~15% (±2)', Math.abs(cnt[3] / 200 - 15) < 2);
}

// 6. Ngân sách draw call: mesh mới ≤ 6
eq('G8_NEW_MESHES = 5 mesh (+1 cây, +4 decor)', G8_NEW_MESHES.join(','), 'leafDaL0,fenceMesh,clothMesh,potMesh,potFlowerMesh');
ok('mesh mới trong ngân sách', G8_NEW_MESHES.length <= G8_DRAW_CALL_BUDGET);
eq('ngân sách = 6', G8_DRAW_CALL_BUDGET, 6);
for (const nm of G8_NEW_MESHES)
  ok(`mesh ${nm} được tạo bằng InstancedMesh`, src.includes(`${nm} = new THREE.InstancedMesh`));

// 7. Tương thích cơ chế LOD G2 (không phá)
ok('refreshTreeLOD giữ chữ ký', src.includes('function refreshTreeLOD(cx, cz)'));
ok('vẫn dùng pickLOD + hysteresis', src.includes('t.lod = pickLOD(d, t.lod, th)'));
ok('lookup loại cây theo type, fallback an toàn', src.includes('TREE_TYPES[t.type] || TREE_TYPES[0]'));
ok('gán type khi đặt cây', src.includes('pickTreeType(Math.random())'));
ok('L1 vẫn dùng lá đơn giản', src.includes('leafSimpGeo') && src.includes('trunkL1') && src.includes('leafL1'));
ok('cây vẫn đổ bóng', src.includes('m.castShadow = true; m.frustumCulled = false;'));
ok('va chạm cây giữ nguyên', src.includes('obstacles.push({ x, z, r: 0.55 * s })'));

// 8. Decor quanh nhà tồn tại, đủ 3 món, cho cả 6 nhà
ok('block decor 5c tồn tại', src.includes('5c. Đồ trang trí quanh nhà'));
ok('hàng rào tre (cột + thanh ngang)', src.includes('cột rào') && src.includes('thanh ngang'));
ok('chậu hoa 2 bên cửa', src.includes('Chậu hoa'));
ok('dây phơi + quần áo', src.includes('Dây phơi quần áo') && src.includes('mảnh vải'));
ok('decor duyệt qua mọi nhà', /houses\.forEach\(\(h, hi\)/.test(src));
ok('quần áo đung đưa bằng shader', src.includes('sway-hang'));
ok('hàng rào có va chạm', src.includes('không đi xuyên hàng rào'));

// 9. Không đụng vùng cấm: renderer/shadow/preset, HUD/label, quái, NPC, hook ?shot=
ok('không thêm PointLight mới', (src.match(/new THREE\.PointLight/g) || []).length <= 4);
ok('hook ?shot= còn nguyên', src.includes('?shot='));

console.log(`g8-art: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
