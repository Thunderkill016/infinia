// Test logic VIL: Hồi sinh làng — góp ∞ xây giếng/cầu/đèn + buff (v16, vòng lặp chính)
// Chạy: node tests/vil-lang.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/actors.js', import.meta.url), 'utf-8');

// 1) Đoạn testable VIL (thuần, không THREE/DOM/import)
const m = src.match(/\/\/ \[VIL-TESTABLE-START\]([\s\S]*?)\/\/ \[VIL-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [VIL-TESTABLE-*] trong js/actors.js'); process.exit(1); }
const sandbox = {};
runInNewContext(
  m[1].slice(m[1].indexOf('\n') + 1) +
  '\n;globalThis.__vil = { VIL_COST, VIL_NAME, VIL_BUFF, VIL_IDS, VIL_FIND_DIST,' +
  ' vilBuiltCount, vilCanBuy, vilBuy, vilTrackerText, vilNearSite };',
  sandbox);
const { VIL_COST, VIL_NAME, VIL_BUFF, VIL_IDS, VIL_FIND_DIST,
        vilBuiltCount, vilCanBuy, vilBuy, vilTrackerText, vilNearSite } = sandbox.__vil;

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error(`FAIL ${name}`); }
}

// --- A. Hằng số đúng spec ---
ok('3 công trình đúng thứ tự', JSON.stringify(VIL_IDS) === JSON.stringify(['gieng', 'cau', 'den']));
ok('giá tăng dần 120/250/400', VIL_COST.gieng === 120 && VIL_COST.cau === 250 && VIL_COST.den === 400);
ok('đủ tên + buff tiếng Việt', VIL_IDS.every((id) => VIL_NAME[id] && VIL_BUFF[id]));
ok('tầm góp 3m', VIL_FIND_DIST === 3);

// --- B. vilBuiltCount: đếm chắc, hỏng không crash ---
ok('chưa xây → 0', vilBuiltCount({ gieng: false, cau: false, den: false }) === 0);
ok('xây 2 → 2', vilBuiltCount({ gieng: true, cau: false, den: true }) === 2);
ok('vil thiếu → 0 (không crash)', vilBuiltCount(null) === 0 && vilBuiltCount(undefined) === 0);
ok('vil hỏng (số) → 0', vilBuiltCount(42) === 0);

// --- C. vilCanBuy: đủ tiền + chưa xây + đúng id ---
ok('đủ tiền giếng → mua được', vilCanBuy(120, { gieng: false }, 'gieng') === true);
ok('thiếu 1∞ → không', vilCanBuy(119, {}, 'gieng') === false);
ok('đã xây → không mua lại', vilCanBuy(9999, { gieng: true }, 'gieng') === false);
ok('id lạ → không', vilCanBuy(9999, {}, 'nha') === false);

// --- D. vilBuy: trừ đúng tiền, không đủ thì giữ nguyên ---
const b1 = vilBuy(500, { gieng: false, cau: false, den: false }, 'cau');
ok('mua cầu 500→250 + đánh dấu', b1.inf === 250 && b1.vil.cau === true);
const b2 = vilBuy(100, {}, 'gieng');
ok('không đủ → giữ nguyên', b2.inf === 100 && !b2.vil.gieng);

// --- E. Tracker ---
ok('0/3 đúng format', vilTrackerText({}) === '🏡 Hồi sinh làng: 0/3 công trình');
ok('3/3 chúc mừng', vilTrackerText({ gieng: 1, cau: 1, den: 1 }).includes('hồi sinh hoàn toàn'));

// --- F. vilNearSite ---
const sites = [{ id: 'gieng', x: 0, z: 0 }, { id: 'cau', x: 41, z: 40 }];
ok('đứng cạnh giếng → gieng', vilNearSite(1, 1, sites) === 'gieng');
ok('đứng giữa đồng → null', vilNearSite(-50, -50, sites) === null);

// --- G. Đấu nối runtime ---
ok('world.js có 3 sites + vilShow', (() => {
  const w = readFileSync(new URL('../js/world.js', import.meta.url), 'utf-8');
  return w.includes("id: 'gieng'") && w.includes("id: 'cau'") && w.includes("id: 'den'") &&
    /export function vilShow\(id\)/.test(w);
})());
ok('E ưu tiên rau → làng → cá', /if \(!pickVeggie\(\) && !vilAction\(\)\) fishAction\(\);/.test(src));
ok('buff giếng vào regen main.js', readFileSync(new URL('../js/main.js', import.meta.url), 'utf-8').includes('S.vil.gieng ? 2 : 1'));
ok('buff cầu vào cá (giữ dòng thưởng gốc P4)', /addInf\(P4_REWARD_INF\); addXP\(P4_REWARD_XP\);\n.*S\.vil && S\.vil\.cau/.test(src));
ok('buff đèn đêm vào quái + boss', (() => {
  const c = readFileSync(new URL('../js/combat.js', import.meta.url), 'utf-8');
  return c.includes('S.vil.den') && (c.match(/S\.vil\.den/g) || []).length >= 2;
})());
ok('save cũ được vá S.vil', readFileSync(new URL('../js/core.js', import.meta.url), 'utf-8').includes('S.vil = { gieng:false, cau:false, den:false }'));

console.log(`VIL: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
