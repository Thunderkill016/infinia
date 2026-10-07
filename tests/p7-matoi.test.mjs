// Test logic WISP: ma trơi ao đêm — hiện đêm khuya, chạm là được quà (v17)
// Chạy: node tests/p7-matoi.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/combat.js', import.meta.url), 'utf-8');

// 1) Đoạn testable WISP (thuần, không THREE/DOM)
const m = src.match(/\/\/ \[WISP-TESTABLE-START\]([\s\S]*?)\/\/ \[WISP-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [WISP-TESTABLE-*] trong js/combat.js'); process.exit(1); }
const sandbox = {};
runInNewContext(
  m[1].slice(m[1].indexOf('\n') + 1) +
  '\n;globalThis.__wisp = { WISP_N, WISP_R, WISP_NIGHT, WISP_RESPAWN, WISP_REWARD_INF, WISP_REWARD_XP, WISP_LINES, wispActive, wispCatchable };',
  sandbox);
const { WISP_N, WISP_R, WISP_NIGHT, WISP_RESPAWN, WISP_REWARD_INF, WISP_REWARD_XP,
        WISP_LINES, wispActive, wispCatchable } = sandbox.__wisp;

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error(`FAIL ${name}`); }
}

// --- A. Hằng số đúng spec ---
ok('3 đốm ma trơi', WISP_N === 3);
ok('tầm chạm 2.2m', WISP_R === 2.2);
ok('đêm sâu >0.7 mới hiện', WISP_NIGHT === 0.7);
ok('nhặt rồi chờ 60s', WISP_RESPAWN === 60);
ok('thưởng 15∞ + 10XP', WISP_REWARD_INF === 15 && WISP_REWARD_XP === 10);
ok('3 câu hù yêu tiếng Việt', WISP_LINES.length === 3);

// --- B. Hiện/chạm ---
ok('nửa đêm (0.9) → hiện', wispActive(0.9) === true);
ok('chập tối (0.5) → ẩn', wispActive(0.5) === false);
ok('ban ngày (0) → ẩn', wispActive(0) === false);
ok('chạm gần (1m) → nhặt được', wispCatchable(1, 0) === true);
ok('đứng xa (5m) → không', wispCatchable(5, 0) === false);
ok('vừa nhặt (chờ 30s) → chưa', wispCatchable(1, 30) === false);

// --- C. Đấu nối runtime ---
ok('3 sprite tái dùng glowTex', /for \(let i = 0; i < WISP_N; i\+\+\)/.test(src) && /new THREE\.Sprite\(wispMat\)/.test(src));
ok('updateMonsters gọi updateWisps', /updateWisps\(dt\);/.test(src));
ok('ngày thì tắt hết sprite', /if \(!on\) \{ w\.spr\.visible = false; continue; \}/.test(src));

console.log(`WISP: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
