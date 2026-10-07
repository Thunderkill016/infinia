// Test logic M6A: tự hạ đồ họa khi máy yếu (v12, học three.js forum K6)
// Chạy: node tests/m6a-auto.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/utils.js', import.meta.url), 'utf-8');

// 1) Đoạn testable M6A (hằng + helper thuần, không dùng THREE/browser)
const m = src.match(/\/\/ \[M6A-TESTABLE-START\]([\s\S]*?)\/\/ \[M6A-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [M6A-TESTABLE-*] trong js/utils.js'); process.exit(1); }
const sandbox = {};
runInNewContext(
  m[1].slice(m[1].indexOf('\n') + 1) +
  '\n;globalThis.__m6a = { M6A_LOW_FPS, M6A_HOLD_S, M6A_COOLDOWN_S, m6aLevelBelow, m6aShouldDrop };',
  sandbox);
const { M6A_LOW_FPS, M6A_HOLD_S, M6A_COOLDOWN_S, m6aLevelBelow, m6aShouldDrop } = sandbox.__m6a;

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error(`FAIL ${name}`); }
}

// --- A. Hằng số đúng spec ---
ok('ngưỡng fps yếu = 40', M6A_LOW_FPS === 40);
ok('giữ liên tục 3s mới hạ', M6A_HOLD_S === 3);
ok('cooldown 6s sau mỗi lần hạ', M6A_COOLDOWN_S === 6);

// --- B. m6aLevelBelow: chỉ hạ dần, không bao giờ tăng ---
ok('high → med', m6aLevelBelow('high') === 'med');
ok('med → low', m6aLevelBelow('med') === 'low');
ok('low → low (đã thấp nhất)', m6aLevelBelow('low') === 'low');
ok('level lạ → low (an toàn)', m6aLevelBelow('xxx') === 'low');

// --- C. m6aShouldDrop: đủ 4 điều kiện mới hạ ---
ok('đuối 3s + high + hết cooldown → hạ', m6aShouldDrop(25, 3, 'high', 99) === true);
ok('đuối 5s + med + hết cooldown → hạ', m6aShouldDrop(30, 5, 'med', 10) === true);
ok('fps ổn (60) → không hạ', m6aShouldDrop(60, 99, 'high', 99) === false);
ok('fps đúng ngưỡng 40 → không hạ (phải DƯỚI 40)', m6aShouldDrop(40, 99, 'high', 99) === false);
ok('mới đuối 2.9s → chưa hạ', m6aShouldDrop(25, 2.9, 'high', 99) === false);
ok('đang cooldown (5s) → chưa hạ', m6aShouldDrop(25, 99, 'high', 5) === false);
ok('đã low → không hạ nữa', m6aShouldDrop(10, 99, 'low', 99) === false);
ok('level lạ → không hạ bừa', m6aShouldDrop(10, 99, 'xxx', 99) === false);

// --- D. ui.js đấu nối đúng (không hạ nhầm, có khóa tay) ---
const ui = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf-8');
ok('ui.js có updateAutoQuality', /export function updateAutoQuality\(dt, fpsAvg\)/.test(ui));
ok('fps hồi thì reset đếm below (phải đuối LIÊN TỤC)', /m6aState\.below = 0;/.test(ui));
ok('người chơi chỉnh tay (Q) thì khóa auto', /m6aManualLock\(\)/.test(ui) && /manualLock = 30/.test(ui));
ok('có toast báo khi tự hạ (không hạ lén)', /tự hạ đồ họa/.test(ui));

// --- E. main.js gọi mỗi frame, trừ phiên chụp ảnh ---
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf-8');
ok('main.js gọi updateAutoQuality với sustainedFps',
  /updateAutoQuality\(dt, sustainedFps\(t1Dts\)/.test(main));
ok('tool ?shot= không bị auto đổi preset', /indexOf\('shot='\) < 0\) updateAutoQuality/.test(main));

console.log(`M6A: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
