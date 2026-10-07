// Test logic STAT: sổ kỷ lục làng — đếm cá/boss + mốc khoe 10/25/50 (v17)
// Chạy: node tests/s1-record.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/utils.js', import.meta.url), 'utf-8');

// 1) Đoạn testable STAT (thuần, không THREE/DOM/import)
const m = src.match(/\/\/ \[STAT-TESTABLE-START\]([\s\S]*?)\/\/ \[STAT-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [STAT-TESTABLE-*] trong js/utils.js'); process.exit(1); }
const sandbox = {};
runInNewContext(
  m[1].slice(m[1].indexOf('\n') + 1) +
  '\n;globalThis.__stat = { STAT_MILESTONES, statNew, statNum, statNormalize, statFish, statBoss, statLine };',
  sandbox);
const { STAT_MILESTONES, statNew, statNum, statNormalize, statFish, statBoss, statLine } = sandbox.__stat;

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error(`FAIL ${name}`); }
}

// --- A. Chuẩn hoá: save cũ/thiếu không crash ---
ok('mốc khoe 10/25/50', JSON.stringify(STAT_MILESTONES) === JSON.stringify([10, 25, 50]));
ok('mới tinh 0/0', statNew().fish === 0 && statNew().boss === 0);
ok('null → 0/0', statNormalize(null).fish === 0 && statNormalize(undefined).boss === 0);
ok('số âm/chữ → 0', statNum(-3) === 0 && statNum('x') === 0 && statNum(5) === 5);

// --- B. Đếm + mốc ---
let r = statFish(statNew());
ok('câu 1 → fish=1, chưa mốc', r.stats.fish === 1 && r.milestone === 0);
r = statFish({ fish: 9, boss: 0 });
ok('con thứ 10 → mốc 10', r.stats.fish === 10 && r.milestone === 10);
r = statBoss({ fish: 0, boss: 24 });
ok('boss lần 25 → mốc 25', r.stats.boss === 25 && r.milestone === 25);
ok('dòng khoe có số', statLine({ fish: 7, boss: 2 }).includes('7') && statLine({ fish: 7, boss: 2 }).includes('2'));

// --- C. Đấu nối runtime ---
ok('câu cá ghi kỷ lục + save', /const fs = statFish\(S\.stats\); S\.stats = fs\.stats; saveGame\(\);/.test(
  readFileSync(new URL('../js/actors.js', import.meta.url), 'utf-8')));
ok('hạ boss ghi kỷ lục + save', /const bs = statBoss\(S\.stats\); S\.stats = bs\.stats; saveGame\(\);/.test(
  readFileSync(new URL('../js/combat.js', import.meta.url), 'utf-8')));
ok('panel Status hiện kỷ lục', /statLine\(S\.stats\)/.test(
  readFileSync(new URL('../js/ui.js', import.meta.url), 'utf-8')));
ok('save cũ được vá S.stats', readFileSync(new URL('../js/core.js', import.meta.url), 'utf-8').includes('S.stats = { fish:0, boss:0 }'));

console.log(`STAT: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
