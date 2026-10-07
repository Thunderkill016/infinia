// Test V1: nhãn NPC hiện TÊN tiếng Việt, chỉ khi cách player < 8m; NPC vô danh không nhãn
// Chạy: node tests/v1-labels.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../app.js', import.meta.url), 'utf-8');

// 1) Đoạn testable V1 (hàm thuần, không dùng THREE/browser)
const m = src.match(/\/\/ \[V1-TESTABLE-START\]([\s\S]*?)\/\/ \[V1-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [V1-TESTABLE-*] trong app.js'); process.exit(1); }
const sandbox = {};
runInNewContext(
  m[1].slice(m[1].indexOf('\n') + 1) + '\n;globalThis.__v1 = { V1_LABEL_DIST, npcLabelText, npcLabelVisible };',
  sandbox);
const { V1_LABEL_DIST, npcLabelText, npcLabelVisible } = sandbox.__v1;

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

// --- A. Hằng số khoảng cách = 8m ---
eq('V1_LABEL_DIST = 8', V1_LABEL_DIST, 8);

// --- B. 9 NPC có tên → nhãn đúng tên tiếng Việt trong docs (không bịa) ---
eq('seq 0 → Bà Lụa', npcLabelText(0, NAMED), 'Bà Lụa');
eq('seq 1 → Cu Tít', npcLabelText(1, NAMED), 'Cu Tít');
eq('seq 2 → Ông Đồ Nho', npcLabelText(2, NAMED), 'Ông Đồ Nho');
eq('seq 3 → Bà Tám Xén', npcLabelText(3, NAMED), 'Bà Tám Xén');
eq('seq 4 → Cụ Chánh Tín', npcLabelText(4, NAMED), 'Cụ Chánh Tín');
eq('seq 5 → Chú Sáu Búa', npcLabelText(5, NAMED), 'Chú Sáu Búa');
eq('seq 6 → Cô Lan Thảo', npcLabelText(6, NAMED), 'Cô Lan Thảo');
eq('seq 7 → Chú Tư Lưới', npcLabelText(7, NAMED), 'Chú Tư Lưới');
eq('seq 8 → Anh Hai Ruộng', npcLabelText(8, NAMED), 'Anh Hai Ruộng');

// --- C. NPC vô danh (seq ≥ 9) → null, không nhãn (màn hình sạch, đúng CO_CHE_GAME) ---
for (const s of [9, 10, 15, 24]) eq(`seq ${s} vô danh → null`, npcLabelText(s, NAMED), null);

// --- D. Logic hiện/ẩn theo khoảng cách ---
ok('gần 3.6m có tên → hiện', npcLabelVisible(3.6, 'Bà Lụa'));
ok('7.99m → hiện', npcLabelVisible(7.99, 'Bà Tám Xén'));
ok('đúng 8m → ẩn', !npcLabelVisible(8, 'Bà Lụa'));
ok('12.5m → ẩn', !npcLabelVisible(12.5, 'Cụ Chánh Tín'));
ok('NPC vô danh gần 1m → vẫn ẩn', !npcLabelVisible(1, null));
ok('xa 20m có tên → ẩn', !npcLabelVisible(20, 'Bà Lụa'));

// --- E. Code nhãn: không còn ID(...) debug, updateLabels dùng logic V1 ---
ok('không còn ID( trong app.js', !/ID\(/.test(src));
ok('updateLabels dùng npcLabelVisible', /npcLabelVisible\(Math\.hypot\(n\.x - P\.x, n\.z - P\.z\)/.test(src));
ok('spawn ẩn nhãn ban đầu', /L\.spr\.visible = false/.test(src));
ok('drawLabel vẽ nền pill (roundRect)', src.includes('roundRect'));

console.log(`V1 labels: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
