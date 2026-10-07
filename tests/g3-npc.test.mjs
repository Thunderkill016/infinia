// Test logic G3: NPC đa dạng ngoại hình + 5 NPC mới có tên
// Chạy: node tests/g3-npc.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../app.js', import.meta.url), 'utf-8');

// 1) Đoạn testable G3 (hàm thuần, không dùng THREE/browser)
const m = src.match(/\/\/ \[G3-TESTABLE-START\]([\s\S]*?)\/\/ \[G3-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [G3-TESTABLE-*] trong app.js'); process.exit(1); }
const sandbox = {};
runInNewContext(
  m[1].slice(m[1].indexOf('\n') + 1) + '\n;globalThis.__g3 = { npcLook, hash01, G3_HAT_COUNT, G3_HAIR_COLOR_COUNT, G3_HAIR_STYLE_COUNT, G3_ROBE_COUNT };',
  sandbox);
const { npcLook, hash01, G3_HAT_COUNT, G3_HAIR_COLOR_COUNT, G3_HAIR_STYLE_COUNT, G3_ROBE_COUNT } = sandbox.__g3;

// 2) Bảng NAMED là object thuần (không dùng THREE) → eval trực tiếp để kiểm tra
const mn = src.match(/const NAMED = (\{[\s\S]*?\n\});/);
if (!mn) { console.error('FAIL: không tìm thấy const NAMED trong app.js'); process.exit(1); }
const sb2 = {};
runInNewContext('const NAMED = (' + mn[1] + ');\n;globalThis.__named = NAMED;', sb2);
const NAMED = sb2.__named;

let pass = 0, fail = 0;
function eq(name, got, want) {
  if (got === want) { pass++; }
  else { fail++; console.error(`FAIL ${name}: got ${got}, want ${want}`); }
}
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error(`FAIL ${name}`); }
}

// --- A. NPCN = 25 (20 cũ + 5 mới) ---
eq('NPCN = 25', (src.match(/const NPCN = (\d+);/) || [])[1], '25');

// --- B. hash01: deterministic, nằm trong [0,1) ---
eq('hash01 deterministic', hash01(7, 11), hash01(7, 11));
ok('hash01 trong [0,1)', hash01(3, 99) >= 0 && hash01(3, 99) < 1);
ok('hash01 phân tán (2 seq khác nhau ra khác nhau)', hash01(0, 11) !== hash01(1, 11));

// --- C. npcLook: deterministic theo seq ---
const a = JSON.stringify(npcLook(12)), b = JSON.stringify(npcLook(12));
eq('npcLook(12) gọi 2 lần giống nhau', a, b);
eq('npcLook khác seq ra khác nhau', JSON.stringify(npcLook(5)) === JSON.stringify(npcLook(6)), false);

// --- D. Giá trị trong khoảng hợp lệ ---
for (let s = 0; s < 25; s++) {
  const L = npcLook(s);
  ok(`seq ${s}: hat 0..3`, L.hat >= 0 && L.hat < G3_HAT_COUNT);
  ok(`seq ${s}: hairColor 0..3`, L.hairColor >= 0 && L.hairColor < G3_HAIR_COLOR_COUNT);
  ok(`seq ${s}: hairStyle 0..2`, L.hairStyle >= 0 && L.hairStyle < G3_HAIR_STYLE_COUNT);
  ok(`seq ${s}: hScale 0.9–1.1`, L.hScale >= 0.9 && L.hScale <= 1.1);
  ok(`seq ${s}: wScale 0.85–1.2`, L.wScale >= 0.85 && L.wScale <= 1.2);
  ok(`seq ${s}: robeIdx 0..6`, L.robeIdx >= 0 && L.robeIdx < G3_ROBE_COUNT);
}

// --- E. Đa dạng: ≥3 loại mũ xuất hiện trong 25 NPC ---
const hats = new Set(), hairs = new Set();
for (let s = 0; s < 25; s++) { const L = npcLook(s); hats.add(L.hat); hairs.add(L.hairColor); }
ok(`≥3 loại mũ xuất hiện (thấy ${hats.size}: ${[...hats].sort()})`, hats.size >= 3);
ok(`≥3 màu tóc xuất hiện (thấy ${hairs.size})`, hairs.size >= 3);

// --- F. NAMED: 9 NPC có tên, đủ trường name/home/lines ---
eq('NAMED có 9 mục', Object.keys(NAMED).length, 9);
const wantNames = ['Bà Lụa', 'Cu Tít', 'Ông Đồ Nho', 'Bà Tám Xén',
  'Cụ Chánh Tín', 'Chú Sáu Búa', 'Cô Lan Thảo', 'Chú Tư Lưới', 'Anh Hai Ruộng'];
for (const seq of Object.keys(NAMED)) {
  const c = NAMED[seq];
  ok(`NAMED[${seq}]: có name`, typeof c.name === 'string' && c.name.length > 0);
  ok(`NAMED[${seq}]: home là [x,z] số`, Array.isArray(c.home) && c.home.length === 2
    && typeof c.home[0] === 'number' && typeof c.home[1] === 'number');
  ok(`NAMED[${seq}]: lines ≥1 câu thoại`, Array.isArray(c.lines) && c.lines.length >= 1
    && c.lines.every(t => typeof t === 'string' && t.length > 0));
}
const gotNames = Object.values(NAMED).map(c => c.name).sort();
eq('đủ 9 tên đúng COT_TRUYEN', JSON.stringify(gotNames), JSON.stringify([...wantNames].sort()));

// --- G. 3 InstancedMesh mũ/tóc mới tồn tại, NPCN instance mỗi cái ---
for (const n of ['iHat', 'iHatWrap', 'iHair']) {
  ok(`${n} là InstancedMesh với NPCN instance`,
    new RegExp(`const ${n} = new THREE\\.InstancedMesh\\([^,]+,[^,]+, NPCN\\)`).test(src));
}
ok('ZERO_M để ẩn instance không dùng', /const ZERO_M = new THREE\.Matrix4\(\)\.makeScale\(0, 0, 0\)/.test(src));

console.log(`G3: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
