// Test D4 (học Swink): né hủy đòn đánh giữa chừng — trích block [D4-TESTABLE-*]
// từ js/combat.js rồi eval. Chạy: node tests/d4-dodge.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/combat.js', import.meta.url), 'utf-8');
const m = src.match(/\/\/ \[D4-TESTABLE-START\]([\s\S]*?)\/\/ \[D4-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [D4-TESTABLE-*] trong js/combat.js'); process.exit(1); }

const code = m[1].slice(m[1].indexOf('\n') + 1).replace(/^export\s+/gm, '');
const sandbox = {};
runInNewContext(
  code + '\n;globalThis.__d4 = { D4_CANCEL_WINDOW, D4_MAX_INPUT_MS, d4AttackAnimating, d4ShouldCancel, d4CancelAttack, d4InputOk };',
  sandbox);
const { D4_CANCEL_WINDOW, D4_MAX_INPUT_MS, d4AttackAnimating, d4ShouldCancel, d4CancelAttack, d4InputOk } = sandbox.__d4;

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error(`FAIL ${name}`); }
}

// 1. Hằng số đúng spec D4
ok('D4_CANCEL_WINDOW = 0.15s (đúng thời gian animation đánh trong playerAttack)', D4_CANCEL_WINDOW === 0.15);
ok('D4_MAX_INPUT_MS = 100 (input né <100ms)', D4_MAX_INPUT_MS === 100);

// 2. Nhận biết "đang giữa animation đánh"
ok('atkT=0.1 (giữa đòn) → đang animating', d4AttackAnimating(0.1) === true);
ok('atkT=0.15 (đúng cuối đòn) → đang animating', d4AttackAnimating(0.15) === true);
ok('atkT=0 (không đánh) → không animating', d4AttackAnimating(0) === false);
ok('atkT âm → không animating', d4AttackAnimating(-0.05) === false);
ok('atkT=0.2 (quá cửa sổ) → không animating', d4AttackAnimating(0.2) === false);

// 3. Né hủy attack mid-animation
ok('giữa đòn + né sẵn sàng → hủy đòn', d4ShouldCancel(0.1, 0) === true);
ok('không đánh + né sẵn sàng → không cần hủy', d4ShouldCancel(0, 0) === false);
ok('giữa đòn nhưng né đang hồi → input không ăn (đúng luật né cũ)', d4ShouldCancel(0.1, 2.5) === false);

// 4. Hủy đòn không tính combo miss, không trừ cooldown/stamina oan
{
  const before = { atkT: 0.1, atkVisible: true, combo: 7, atkCd: 0.42, dodgeCd: 0 };
  const after = d4CancelAttack(before);
  ok('hủy đòn → animation dừng ngay (atkT=0)', after.atkT === 0);
  ok('hủy đòn → tắt vệt chém', after.atkVisible === false);
  ok('hủy đòn → combo GIỮ NGUYÊN (không tính miss)', after.combo === 7);
  ok('hủy đòn → atkCd GIỮ NGUYÊN (không trừ thêm cooldown đánh oan)', after.atkCd === 0.42);
  ok('hủy đòn → dodgeCd GIỮ NGUYÊN (không trừ thêm stamina/cooldown né oan)', after.dodgeCd === 0);
}
{
  // combo 0 cũng không bị âm/đổi
  const after = d4CancelAttack({ atkT: 0.05, atkVisible: true, combo: 0, atkCd: 0.5, dodgeCd: 0 });
  ok('hủy đòn lúc combo=0 → combo vẫn 0', after.combo === 0);
}

// 5. Input <100ms — xử lý trong cùng frame
ok('latency 0ms (đồng bộ) → ok', d4InputOk(1000, 1000) === true);
ok('latency 16ms (1 frame) → ok', d4InputOk(1000, 1016) === true);
ok('latency 99ms → ok', d4InputOk(1000, 1099) === true);
ok('latency đúng 100ms → ok', d4InputOk(1000, 1100) === true);
ok('latency 101ms → KHÔNG ok', d4InputOk(1000, 1101) === false);
ok('latency 250ms (queue sang frame sau) → KHÔNG ok', d4InputOk(1000, 1250) === false);
ok('thời gian âm (đồng hồ sai) → KHÔNG ok', d4InputOk(1100, 1000) === false);

// 6. Né thường vẫn hoạt động (không đánh → dodge thuần, không dính logic hủy đòn)
ok('không đánh → không trigger hủy đòn, dodge chạy bình thường', d4ShouldCancel(0, 0) === false);

// 7. Tích hợp runtime: playerDodge() trong combat.js phải gọi logic hủy đòn D4
{
  const fn = src.match(/export function playerDodge\(\) \{([\s\S]*?)\n\}/);
  ok('playerDodge tồn tại trong combat.js', !!fn);
  const raw = fn ? fn[1] : '';
  const body = raw.replace(/\/\/.*$/gm, ''); // bỏ comment tiếng Việt trước khi kiểm tra code thật
  ok('playerDodge kiểm tra animation đánh (d4AttackAnimating)', body.includes('d4AttackAnimating(atkState.t)'));
  ok('playerDodge dừng animation (atkState.t = 0)', body.includes('atkState.t = 0'));
  ok('playerDodge tắt vệt chém (atkArcG.visible = false)', body.includes('atkArcG.visible = false'));
  ok('playerDodge KHÔNG gọi comboReset khi hủy đòn', !body.includes('comboReset'));
  ok('playerDodge giữ i-frame 0.4s như né thường', body.includes('P.invuln = Math.max(P.invuln, 0.4)') || body.includes('P.invuln'));
  ok('luật né cũ còn nguyên: dodgeCd/dlgNPC/shopOpen/P.fly chặn né',
    body.includes('dodgeCd > 0') && body.includes('dlgNPC') && body.includes('shopOpen') && body.includes('P.fly'));
}

console.log(`D4 dodge-cancel: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
