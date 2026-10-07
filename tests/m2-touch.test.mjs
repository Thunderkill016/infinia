// Test M2: nút chạm mobile — trích block [M2-TESTABLE-*] từ js/ui.js rồi eval
// Chạy: node tests/m2-touch.test.mjs  (exit 0 = pass)
// Chuẩn: research 07-mobile-ux.md K1/K2 — nút ≥48×48px cách nhau ≥8px; Đánh 68px (to nhất,
// góc phải-dưới); Né 56px (trên-trái nút Đánh, cách 16px); joystick floating Ø120–140px.
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf-8');
const m = src.match(/\/\/ \[M2-TESTABLE-START\]([\s\S]*?)\/\/ \[M2-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [M2-TESTABLE-*] trong js/ui.js'); process.exit(1); }

// Block viết cho ES module (dùng `export`) → lột `export ` ở đầu dòng để eval được trong vm thường
const code = m[1].replace(/^export\s+/gm, '');
const sandbox = {};
runInNewContext(
  code + '\n;globalThis.__m2 = { M2_BTN_MIN, M2_BTN_GAP, M2_ATTACK_SIZE, M2_DODGE_SIZE, ' +
  'M2_TALK_SIZE, M2_JOY_MIN, M2_JOY_MAX, M2_JOY_SIZE, M2_EDGE, M2_AD_GAP, M2_PRESS_SCALE, ' +
  'M2_PRESS_MS, m2Layout, m2HitOK, m2Overlap, m2GapOK, m2Inside, m2JoyZoneHit, m2ClampJoy };',
  sandbox);
const { M2_BTN_MIN, M2_BTN_GAP, M2_ATTACK_SIZE, M2_DODGE_SIZE, M2_TALK_SIZE,
  M2_JOY_MIN, M2_JOY_MAX, M2_JOY_SIZE, M2_EDGE, M2_AD_GAP, M2_PRESS_SCALE,
  M2_PRESS_MS, m2Layout, m2HitOK, m2Overlap, m2GapOK, m2Inside,
  m2JoyZoneHit, m2ClampJoy } = sandbox.__m2;

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error(`FAIL ${name}`); }
}

// ---- 1. Hằng số đúng chuẩn K1/K2 ----
ok('M2_BTN_MIN = 48 (Material/Apple HIG)', M2_BTN_MIN === 48);
ok('M2_BTN_GAP = 8 (khoảng cách tối thiểu)', M2_BTN_GAP === 8);
ok('M2_ATTACK_SIZE = 68 (nút Đánh to nhất)', M2_ATTACK_SIZE === 68);
ok('M2_DODGE_SIZE = 56 (nút Né)', M2_DODGE_SIZE === 56);
ok('M2_JOY trong khoảng 120–140px', M2_JOY_SIZE >= M2_JOY_MIN && M2_JOY_SIZE <= M2_JOY_MAX);
ok('M2_PRESS_SCALE = 0.92', M2_PRESS_SCALE === 0.92);
ok('M2_PRESS_MS = 80 (<100ms, K7)', M2_PRESS_MS === 80 && M2_PRESS_MS < 100);
ok('M2_AD_GAP = 16 (Né cách Đánh 16px)', M2_AD_GAP === 16);

// ---- 2. Layout màn hình tham chiếu 360×640 (Android tầm trung VN) ----
const L = m2Layout(360, 640, { l: 0, r: 0, b: 0 });
const { attack, dodge, talk } = L;

// Đánh ở góc phải-dưới, sát mép (trừ M2_EDGE)
ok('Đánh: sát cạnh phải (x+size = w-edge)', attack.x + attack.size === 360 - M2_EDGE);
ok('Đánh: sát cạnh dưới (y+size = h-edge)', attack.y + attack.size === 640 - M2_EDGE);
ok('Đánh: là nút to nhất cụm', attack.size >= dodge.size && attack.size >= talk.size);

// Né: phía trên nút Đánh, canh giữa ngang, cách đúng 16px
ok('Né: cách Đánh đúng 16px theo dọc', dodge.y + dodge.size + M2_AD_GAP === attack.y);
const atkCx = attack.x + attack.size / 2, dodCx = dodge.x + dodge.size / 2;
ok('Né: canh giữa theo phương ngang với Đánh', Math.abs(atkCx - dodCx) < 1);

// Nói: phía trên nút Né, cách đúng 16px
ok('Nói: cách Né đúng 16px theo dọc', talk.y + talk.size + M2_AD_GAP === dodge.y);
const talkCx = talk.x + talk.size / 2;
ok('Nói: canh giữa theo cụm Đánh', Math.abs(atkCx - talkCx) < 1);

// Mọi nút ≥48×48, nằm gọn trong màn hình, không đè nhau, cách nhau ≥8px
for (const [name, r] of [['Đánh', attack], ['Né', dodge], ['Nói', talk]]) {
  ok(`${name}: hit-area ≥48×48`, m2HitOK(r));
  ok(`${name}: nằm gọn trong viewport 360×640`, m2Inside(r, 360, 640));
}
const pairs = [['Đánh', 'Né', attack, dodge], ['Đánh', 'Nói', attack, talk], ['Né', 'Nói', dodge, talk]];
for (const [n1, n2, a, b] of pairs) {
  ok(`${n1}–${n2}: không đè nhau`, !m2Overlap(a, b));
  ok(`${n1}–${n2}: cách nhau ≥8px`, m2GapOK(a, b));
}

// ---- 3. Layout màn ngang 844×390 (đt xoay ngang) — cụm nút vẫn vừa, không tràn ----
const LL = m2Layout(844, 390, { l: 0, r: 0, b: 0 });
for (const [name, r] of [['Đánh', LL.attack], ['Né', LL.dodge], ['Nói', LL.talk]]) {
  ok(`ngang 844×390 — ${name}: nằm gọn trong viewport`, m2Inside(r, 844, 390));
}
ok('ngang 844×390 — cụm phải không lấn vùng joystick trái',
  LL.attack.x > 844 * 0.45 && LL.dodge.x > 844 * 0.45 && LL.talk.x > 844 * 0.45);

// ---- 4. m2HitOK / m2GapOK / m2Overlap — kiểm tra hàm phụ trợ ----
ok('m2HitOK(48×48) → true', m2HitOK({ x: 0, y: 0, size: 48 }));
ok('m2HitOK(47×47) → false', !m2HitOK({ x: 0, y: 0, size: 47 }));
ok('m2GapOK: cách 8px → true',
  m2GapOK({ x: 0, y: 0, size: 48 }, { x: 56, y: 0, size: 48 }));
ok('m2GapOK: cách 7px → false',
  !m2GapOK({ x: 0, y: 0, size: 48 }, { x: 55, y: 0, size: 48 }));
ok('m2Overlap: đè nhau → true',
  m2Overlap({ x: 0, y: 0, size: 48 }, { x: 40, y: 40, size: 48 }));
ok('m2Overlap: rời nhau → false',
  !m2Overlap({ x: 0, y: 0, size: 48 }, { x: 60, y: 0, size: 48 }));

// ---- 5. Vùng joystick floating: nửa trái-dưới, không cướp cụm nút phải ----
ok('joy zone: (50,600) trên 360×640 → true', m2JoyZoneHit(50, 600, 360, 640));
ok('joy zone: cụm nút phải (320,600) → false', !m2JoyZoneHit(320, 600, 360, 640));
ok('joy zone: nửa trên (50,100) → false', !m2JoyZoneHit(50, 100, 360, 640));
ok('joy zone: tâm joystick cũ (86,554) vẫn trong vùng', m2JoyZoneHit(86, 554, 360, 640));

// ---- 6. m2ClampJoy: kẹp tâm để vòng tròn nằm gọn trong màn hình ----
const c1 = m2ClampJoy(5, 5, 120, 360, 640, { l: 0, r: 0, b: 0 }); // chạm sát góc
ok('clamp: tâm sát góc trái-trên bị kẹp vào (60,60)', c1.x === 60 && c1.y === 60);
const c2 = m2ClampJoy(355, 635, 120, 360, 640, { l: 0, r: 0, b: 0 }); // chạm sát góc phải-dưới
ok('clamp: tâm sát góc phải-dưới bị kẹp vào (300,580)', c2.x === 300 && c2.y === 580);
const c3 = m2ClampJoy(100, 500, 120, 360, 640, { l: 0, r: 0, b: 0 }); // chạm giữa vùng
ok('clamp: tâm trong vùng giữ nguyên', c3.x === 100 && c3.y === 500);
// Vòng tròn sau clamp nằm gọn trong viewport
for (const [nm, c] of [['c1', c1], ['c2', c2], ['c3', c3]]) {
  ok(`clamp ${nm}: vòng tròn nằm gọn trong 360×640`,
    c.x - 60 >= 0 && c.x + 60 <= 360 && c.y - 60 >= 0 && c.y + 60 <= 640);
}

console.log(`M2: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
