// Test M7: 3 dòng "Có gì mới" trên màn hình title — trích block [M7-TESTABLE-*] từ js/ui.js rồi eval
// Chạy: node tests/m7-news.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf-8');
const m = src.match(/\/\/ \[M7-TESTABLE-START\]([\s\S]*?)\/\/ \[M7-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [M7-TESTABLE-*] trong js/ui.js'); process.exit(1); }

// Block viết cho ES module (dùng `export`) → lột `export ` ở đầu dòng để eval được trong vm thường
const code = m[1].replace(/^export\s+/gm, '');
const sandbox = {};
runInNewContext(
  code + '\n;globalThis.__m7 = { M7_NEWS, m7FormatNews };',
  sandbox);
const { M7_NEWS, m7FormatNews } = sandbox.__m7;

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error(`FAIL ${name}`); }
}
// "Tiếng Việt" = có ít nhất 1 ký tự có dấu, hoặc icon emoji
const VN_DIACRITIC = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;
const hasVn = s => VN_DIACRITIC.test(s) || /\p{Extended_Pictographic}/u.test(s);
const cpLen = s => [...s].length; // đếm theo code point, emoji = 1 ký tự

// 1. Đúng 3 dòng
ok('M7_NEWS có đúng 3 dòng', Array.isArray(M7_NEWS) && M7_NEWS.length === 3);

// 2. Mỗi dòng: là chuỗi, không trống, ≤ 40 ký tự, tiếng Việt
for (const [i, s] of M7_NEWS.entries()) {
  ok(`dòng ${i}: là chuỗi không trống`, typeof s === 'string' && s.trim().length > 0);
  ok(`dòng ${i}: ≤ 40 ký tự (đang ${cpLen(String(s))})`, typeof s === 'string' && cpLen(s) <= 40);
  ok(`dòng ${i}: tiếng Việt (dấu hoặc emoji)`, typeof s === 'string' && hasVn(s));
}

// 3. m7FormatNews: lọc dòng trống + cắt đúng 3 dòng đầu
ok('m7FormatNews lọc dòng trống', m7FormatNews(['a', '  ', '', 'b']).length === 2);
ok('m7FormatNews cắt ở 3 dòng', m7FormatNews(['a', 'b', 'c', 'd']).length === 3);
ok('m7FormatNews([]) → []', m7FormatNews([]).length === 0);
ok('m7FormatNews(non-array) → []', m7FormatNews(null).length === 0);
ok('m7FormatNews giữ nội dung mảng gốc', m7FormatNews(M7_NEWS).join('|') === M7_NEWS.join('|'));

console.log(`M7: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
