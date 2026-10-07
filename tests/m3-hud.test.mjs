// Test M3: HUD gọn màn 360px — trích block [M3-TESTABLE-*] từ js/ui.js rồi eval
// Chạy: node tests/m3-hud.test.mjs  (exit 0 = pass)
// Chuẩn: 5 nút top gom vào 1 nút ☰ ≥48px; quest tracker 1 dòng, tự ẩn sau 5s không
// tương tác (tap hiện lại); chữ HUD ≥12px; chỉ màn nhỏ (≤480px) / thiết bị chạm,
// desktop giữ nguyên.
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf-8');
const m = src.match(/\/\/ \[M3-TESTABLE-START\]([\s\S]*?)\/\/ \[M3-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [M3-TESTABLE-*] trong js/ui.js'); process.exit(1); }

// Block viết cho ES module (dùng `export`) → lột `export ` ở đầu dòng để eval được trong vm thường
const code = m[1].replace(/^export\s+/gm, '');
const sandbox = {};
runInNewContext(
  code + '\n;globalThis.__m3 = { M3_SMALL_W, M3_HIDE_S, M3_MENU_MIN, M3_FONT_MIN, M3_MENU_IDS, ' +
  'm3CompactOn, m3MenuBtnOK, m3ShouldHide, m3FontOK };',
  sandbox);
const { M3_SMALL_W, M3_HIDE_S, M3_MENU_MIN, M3_FONT_MIN, M3_MENU_IDS,
  m3CompactOn, m3MenuBtnOK, m3ShouldHide, m3FontOK } = sandbox.__m3;

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error(`FAIL ${name}`); }
}

// ---- 1. Hằng số đúng chuẩn ----
ok('M3_SMALL_W = 480 (khớp breakpoint CSS @media max-width:480px)', M3_SMALL_W === 480);
ok('M3_HIDE_S = 5 (tracker tự ẩn sau 5s)', M3_HIDE_S === 5);
ok('M3_MENU_MIN = 48 (nút ☰ ≥48px, lớn hơn .btn gốc 44px)', M3_MENU_MIN === 48 && M3_MENU_MIN > 44);
ok('M3_FONT_MIN = 12 (chữ HUD ≥12px)', M3_FONT_MIN === 12);

// ---- 2. Logic gom nút: đúng 5 nút top, đúng id gốc trong index.html ----
ok('M3_MENU_IDS có đúng 5 nút', M3_MENU_IDS.length === 5);
for (const id of ['btn-inv', 'btn-status', 'btn-control', 'btn-fly', 'btn-debug']) {
  ok(`gom nút ${id} vào menu ☰`, M3_MENU_IDS.includes(id));
}
// id nút gốc trong HTML phải khớp đúng thứ tự khai báo (không sai chính tả id)
ok('M3_MENU_IDS khớp thứ tự id gốc',
  JSON.stringify(M3_MENU_IDS) === JSON.stringify(['btn-inv', 'btn-status', 'btn-control', 'btn-fly', 'btn-debug']));

// ---- 3. m3CompactOn: chỉ màn nhỏ / thiết bị chạm, desktop giữ nguyên ----
ok('màn 360px (đt dọc) → gọn', m3CompactOn(360, false));
ok('màn 480px (ngưỡng) → gọn', m3CompactOn(480, false));
ok('màn 481px desktop → giữ nguyên', !m3CompactOn(481, false));
ok('desktop 1920px → giữ nguyên', !m3CompactOn(1920, false));
ok('màn 800px nhưng là thiết bị chạm → gọn', m3CompactOn(800, true));
ok('tablet 768px cảm ứng → gọn', m3CompactOn(768, true));
ok('laptop 1366px không chạm → giữ nguyên', !m3CompactOn(1366, false));

// ---- 4. m3MenuBtnOK: nút ☰ đủ 48px ----
ok('nút ☰ 48px → đạt', m3MenuBtnOK(48));
ok('nút ☰ 64px → đạt', m3MenuBtnOK(64));
ok('nút 44px (CSS .btn cũ) → KHÔNG đạt', !m3MenuBtnOK(44));
ok('nút 47px → KHÔNG đạt', !m3MenuBtnOK(47));

// ---- 5. m3ShouldHide: tracker tự ẩn sau đúng 5s không tương tác ----
ok('qua đúng 5s → ẩn', m3ShouldHide(0, 5000));
ok('qua 6.2s → ẩn', m3ShouldHide(1000, 7200));
ok('mới 4.999s → chưa ẩn', !m3ShouldHide(0, 4999));
ok('tương tác lại (lastMs mới) → đồng hồ đếm lại', !m3ShouldHide(9000, 12000));
ok('tương tác lại rồi qua đủ 5s → ẩn', m3ShouldHide(9000, 14000));

// ---- 6. m3FontOK: chữ HUD ≥12px ----
ok('chữ 12px → đạt', m3FontOK(12));
ok('chữ 13px (quest tracker) → đạt', m3FontOK(13));
ok('chữ 14px → đạt', m3FontOK(14));
ok('chữ 11px → KHÔNG đạt', !m3FontOK(11));
ok('chữ 11.9px → KHÔNG đạt', !m3FontOK(11.9));

console.log(`M3: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
