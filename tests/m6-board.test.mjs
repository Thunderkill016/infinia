// Test M6: bảng "Lời hứa làng" (học Terraria) — hằng số vị trí + nội dung chữ + gợi ý đọc
// Chạy: node tests/m6-board.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/world.js', import.meta.url), 'utf-8');
const m = src.match(/\/\/ \[M6-TESTABLE-START\]([\s\S]*?)\/\/ \[M6-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [M6-TESTABLE-*] trong js/world.js'); process.exit(1); }

const sandbox = {};
runInNewContext(
  m[1].slice(m[1].indexOf('\n') + 1) +
  '\n;globalThis.__m6 = { M6_BOARD_POS, M6_READ_DIST, M6_BOARD_TITLE, M6_BOARD_LINES, m6BoardShouldHint };',
  sandbox);
const { M6_BOARD_POS, M6_READ_DIST, M6_BOARD_TITLE, M6_BOARD_LINES, m6BoardShouldHint } = sandbox.__m6;

let pass = 0, fail = 0;
function eq(name, got, want) {
  if (JSON.stringify(got) === JSON.stringify(want)) { pass++; }
  else { fail++; console.error(`FAIL ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); }
}
function ok(name, cond) { eq(name, !!cond, true); }

// 1. Hằng số khoảng cách đọc
eq('M6_READ_DIST = 4', M6_READ_DIST, 4);

// 2. Vị trí bảng: sân làng gần trung tâm, không chôn trong nhà/cây/đường
eq('vị trí bảng x', M6_BOARD_POS.x, -6);
eq('vị trí bảng z', M6_BOARD_POS.z, -6);
ok('bảng gần trung tâm làng (<15m)', Math.hypot(M6_BOARD_POS.x, M6_BOARD_POS.z) < 15);
ok('bảng cách đường đất >2.6m (không chắn đường)', (() => {
  // đường đất đi qua các điểm điều khiển này (copy từ world.js mục 3b)
  const path = [[-40, 46], [-20, 24], [-8, 12], [4, 2], [16, -10], [30, -20], [50, -28]];
  let minD = 1e9;
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, az] = path[i], [bx, bz] = path[i + 1];
    const dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((M6_BOARD_POS.x - ax) * dx + (M6_BOARD_POS.z - az) * dz) / (dx * dx + dz * dz)));
    minD = Math.min(minD, Math.hypot(M6_BOARD_POS.x - (ax + t * dx), M6_BOARD_POS.z - (az + t * dz)));
  }
  return minD > 2.6;
})());
ok('bảng cách nhà gần nhất >4.6m (nhà r=3.4)', (() => {
  let minD = 1e9;
  for (let i = 0; i < 6; i++) { // 6 nhà quanh vòng tròn bán kính 15 (copy công thức world.js mục 5)
    const a = (i / 6) * Math.PI * 2 + 0.35;
    minD = Math.min(minD, Math.hypot(M6_BOARD_POS.x - Math.cos(a) * 15, M6_BOARD_POS.z - Math.sin(a) * 15));
  }
  return minD > 4.6;
})());

// 3. Nội dung chữ trên bảng
eq('tiêu đề bảng', M6_BOARD_TITLE, 'LỜI HỨA LÀNG');
eq('đủ 2 dòng nội dung', M6_BOARD_LINES.length, 2);
ok('dòng 1 nhắc "đổi đồ trang trí"', M6_BOARD_LINES[0].includes('trang trí'));
ok('dòng 2 cam kết "không bao giờ bán sức mạnh"', M6_BOARD_LINES[1].includes('không bao giờ bán sức mạnh'));
ok('có ký hiệu ∞ (tiền game)', M6_BOARD_LINES.join(' ').includes('∞'));

// 4. Gợi ý đọc theo khoảng cách
ok('gần 3.9m → hiện gợi ý', m6BoardShouldHint(3.9) === true);
ok('đúng 4m → ẩn gợi ý (điều kiện <4m)', m6BoardShouldHint(4.0) === false);
ok('xa 10m → ẩn gợi ý', m6BoardShouldHint(10) === false);

console.log(`M6: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
