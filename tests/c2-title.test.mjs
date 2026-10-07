// Test C2: màn hình title/help tiếng Việt — trích block [C2-TESTABLE-*] từ js/ui.js rồi eval
// Chạy: node tests/c2-title.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf-8');
const m = src.match(/\/\/ \[C2-TESTABLE-START\]([\s\S]*?)\/\/ \[C2-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [C2-TESTABLE-*] trong js/ui.js'); process.exit(1); }

// Block viết cho ES module (dùng `export`) → lột `export ` ở đầu dòng để eval được trong vm thường
const code = m[1].replace(/^export\s+/gm, '');
const sandbox = {};
runInNewContext(
  code + '\n;globalThis.__c2 = { C2_PLAY_TEXT, C2_TAGLINE, C2_FIRST_TASK, C2_TITLE_LINES, C2_HELP_TEXTS, c2HelpText };',
  sandbox);
const { C2_PLAY_TEXT, C2_TAGLINE, C2_FIRST_TASK, C2_TITLE_LINES, C2_HELP_TEXTS, c2HelpText } = sandbox.__c2;

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error(`FAIL ${name}`); }
}
// "Tiếng Việt" = có ít nhất 1 ký tự có dấu, hoặc icon emoji
const VN_DIACRITIC = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;
const hasVn = s => VN_DIACRITIC.test(s) || /\p{Extended_Pictographic}/u.test(s);
// Danh sách tiếng Anh bị cấm trong text UI (ngoài tên game INFINIA)
const BANNED_EN = ['Click', 'Start', 'Help'];
const noBanned = s => !BANNED_EN.some(w => String(s).includes(w));

// 1. Số dòng help ≥ 4
ok('số dòng help ≥ 4', Array.isArray(C2_TITLE_LINES) && C2_TITLE_LINES.length >= 4);

// 2. Nút chơi ngay có text "Chơi ngay"
ok('C2_PLAY_TEXT chứa "Chơi ngay"', typeof C2_PLAY_TEXT === 'string' && C2_PLAY_TEXT.includes('Chơi ngay'));
ok('c2HelpText("choi-ngay") = "Chơi ngay"', c2HelpText('choi-ngay') === 'Chơi ngay');
ok('C2_PLAY_TEXT không chứa tiếng Anh bị cấm', noBanned(C2_PLAY_TEXT));

// 3. Mọi dòng help: có icon + text, tiếng Việt 100%, không chữ tiếng Anh bị cấm
for (const [i, l] of C2_TITLE_LINES.entries()) {
  ok(`dòng ${i}: có icon + text`, l && typeof l.icon === 'string' && typeof l.text === 'string');
  ok(`dòng ${i}: có tiếng Việt có dấu hoặc emoji`, hasVn(l.icon + ' ' + l.text));
  ok(`dòng ${i}: không chứa tiếng Anh bị cấm`, noBanned(l.icon + ' ' + l.text));
}

// 4. Tagline L4 + việc đầu tiên L5: text tiếng Việt, không chữ cấm
for (const [name, s] of [['tagline', C2_TAGLINE], ['viec-dau-tien', C2_FIRST_TASK]]) {
  ok(`${name}: là text tiếng Việt`, typeof s === 'string' && hasVn(s));
  ok(`${name}: không chứa tiếng Anh bị cấm`, noBanned(s));
}
ok('viec-dau-tien chỉ rõ trưởng làng', C2_FIRST_TASK.includes('trưởng làng'));

// 5. c2HelpText: mọi value đều tiếng Việt + không chữ cấm; key lạ → chuỗi rỗng
for (const [k, v] of Object.entries(C2_HELP_TEXTS)) {
  ok(`help[${k}]: tiếng Việt`, hasVn(v));
  ok(`help[${k}]: không chứa tiếng Anh bị cấm`, noBanned(v));
}
ok('c2HelpText(key lạ) trả chuỗi rỗng', c2HelpText('khong-co-key-nay') === '');

console.log(`C2: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
