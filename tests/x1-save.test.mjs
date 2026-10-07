// Test X1: xuất/nhập save JSON — trích block [X1-TESTABLE-*] từ js/ui.js rồi eval
// Chạy: node tests/x1-save.test.mjs  (exit 0 = pass)
// Chuẩn: 2 nút ⬇ Xuất save + ⬆ Nhập save trong panel Control (mỗi nút ≥44px);
// savExportPayload(raw) trả raw khi save hợp lệ, null khi chưa có/hỏng;
// savImportCheck(obj) chỉ nhận object có .v===1; exportSave/importSave đấu nối
// đúng store + toast + tải file infinia-save.json, không đụng localStorage trực tiếp.
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const uiSrc = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf-8');
const m = uiSrc.match(/\/\/ \[X1-TESTABLE-START\]([\s\S]*?)\/\/ \[X1-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [X1-TESTABLE-*] trong js/ui.js'); process.exit(1); }

// Block viết cho ES module (dùng `export`) → lột `export ` ở đầu dòng để eval được trong vm thường
const code = m[1].replace(/^export\s+/gm, '');
const sandbox = {};
runInNewContext(
  code + '\n;globalThis.__x1 = { X1_SAVE_FILE, savExportPayload, savImportCheck };',
  sandbox);
const { X1_SAVE_FILE, savExportPayload, savImportCheck } = sandbox.__x1;

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error(`FAIL ${name}`); }
}

// ---- 1. Hằng tên file ----
ok('file xuất tên infinia-save.json', X1_SAVE_FILE === 'infinia-save.json');

// ---- 2. savImportCheck: chỉ nhận object có .v===1 ----
ok('save v1 hợp lệ', savImportCheck({ v: 1, x: 0 }) === true);
ok('save v2 → từ chối', savImportCheck({ v: 2 }) === false);
ok('thiếu v → từ chối', savImportCheck({ x: 1 }) === false);
ok('null → từ chối', savImportCheck(null) === false);
ok('undefined → từ chối', savImportCheck(undefined) === false);
ok('chuỗi JSON (chưa parse) → từ chối', savImportCheck('{"v":1}') === false);
ok('số → từ chối', savImportCheck(1) === false);
ok('mảng → từ chối', savImportCheck([{ v: 1 }]) === false);

// ---- 3. savExportPayload: có save hợp lệ thì trả raw, không thì null ----
const good = '{"v":1,"x":5,"lv":3}';
ok('raw save v1 → trả đúng raw', savExportPayload(good) === good);
ok('chưa có save (null) → null', savExportPayload(null) === null);
ok('chuỗi rỗng → null', savExportPayload('') === null);
ok('không phải chuỗi → null', savExportPayload(undefined) === null);
ok('JSON hỏng → null', savExportPayload('{v:1') === null);
ok('save version lạ → null', savExportPayload('{"v":2}') === null);
ok('JSON mảng → null', savExportPayload('[1,2]') === null);

// ---- 4. index.html: 2 nút trong panel Control, mỗi nút ≥44px ----
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf-8');
ok('panel Control có nút ⬇ Xuất save', html.includes('id="btn-export-save"') && html.includes('Xuất save'));
ok('panel Control có nút ⬆ Nhập save', html.includes('id="btn-import-save"') && html.includes('Nhập save'));
ok('2 nút dùng class .btn (kế thừa min 44px như nút Chơi mới)',
  /id="btn-export-save"[^>]*class="btn"|class="btn"[^>]*id="btn-export-save"/.test(html) &&
  /id="btn-import-save"[^>]*class="btn"|class="btn"[^>]*id="btn-import-save"/.test(html));
ok('CSS .btn giữ min 44px cho nút mới', /\.btn\s*\{[^}]*min-height:\s*44px[^}]*min-width:\s*44px/.test(html));

// ---- 5. js/ui.js: exportSave/importSave đấu nối đúng store + toast ----
ok('có export function exportSave', /export function exportSave\(\)/.test(uiSrc));
ok('có export function importSave', /export function importSave\(file\)/.test(uiSrc));
ok('exportSave đọc store.get(SAVE_KEY)', /store\.get\(SAVE_KEY\)/.test(uiSrc));
ok('chưa có save → toast "Chưa có tiến trình để xuất"',
  uiSrc.includes("toast('Chưa có tiến trình để xuất')"));
ok('exportSave tải file qua Blob + thẻ a tạm', /new Blob\(/.test(uiSrc) && /createElement\('a'\)/.test(uiSrc));
ok('tên file tải dùng X1_SAVE_FILE', /a\.download = X1_SAVE_FILE/.test(uiSrc));
ok('importSave kiểm tra savImportCheck', /savImportCheck\(obj\)/.test(uiSrc));
ok('importSave ghi store + reload', /store\.set\(SAVE_KEY/.test(uiSrc) && /location\.reload\(\)/.test(uiSrc));
ok('file lạ → toast "File save không hợp lệ"', uiSrc.includes("toast('File save không hợp lệ')"));
ok('KHÔNG đụng localStorage trực tiếp (chỉ qua store)', !/localStorage\s*\./.test(uiSrc));
ok('2 nút được wiring onclick', /getElementById\('btn-export-save'\)/.test(uiSrc) &&
  /getElementById\('btn-import-save'\)/.test(uiSrc));

console.log(`X1: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
