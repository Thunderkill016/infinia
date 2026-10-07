// Test M11: combo counter (học Balatro) — logic đếm combo, mốc 10/25/50, timeout 3s
// Chạy: node tests/m11-combo.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/combat.js', import.meta.url), 'utf-8');
const m = src.match(/\/\/ \[M11-TESTABLE-START\]([\s\S]*?)\/\/ \[M11-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [M11-TESTABLE-*] trong js/combat.js'); process.exit(1); }

const sandbox = {};
runInNewContext(
  m[1].slice(m[1].indexOf('\n') + 1) +
  '\n;globalThis.__m11 = { M11_COMBO_TIMEOUT, M11_MILESTONES, M11_BONUS,' +
  ' m11NextCombo, m11IsMilestone, m11MilestoneBonus, m11ShouldReset, m11ScaleFor };',
  sandbox);
const { M11_COMBO_TIMEOUT, M11_MILESTONES, M11_BONUS,
        m11NextCombo, m11IsMilestone, m11MilestoneBonus, m11ShouldReset, m11ScaleFor } = sandbox.__m11;

let pass = 0, fail = 0;
function eq(name, got, want) {
  if (got === want) { pass++; }
  else { fail++; console.error(`FAIL ${name}: got ${got}, want ${want}`); }
}
function near(name, got, want, eps = 1e-9) {
  if (Math.abs(got - want) <= eps) { pass++; }
  else { fail++; console.error(`FAIL ${name}: got ${got}, want ~${want}`); }
}
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error(`FAIL ${name}`); }
}

// 1. hằng số
eq('timeout reset 3s', M11_COMBO_TIMEOUT, 3);
eq('mốc = [10,25,50]', JSON.stringify(M11_MILESTONES), JSON.stringify([10, 25, 50]));
eq('thưởng mốc 10 = +5∞', M11_BONUS[10], 5);
eq('thưởng mốc 25 = +15∞', M11_BONUS[25], 15);
eq('thưởng mốc 50 = +40∞', M11_BONUS[50], 40);

// 2. m11NextCombo: 1 đòn trúng → combo+1
eq('0 → 1', m11NextCombo(0), 1);
eq('9 → 10 (chạm mốc)', m11NextCombo(9), 10);
eq('49 → 50 (chạm mốc)', m11NextCombo(49), 50);
eq('số âm → 1', m11NextCombo(-5), 1);
eq('số lẻ → làm tròn xuống rồi +1', m11NextCombo(3.7), 4);

// 3. m11IsMilestone
ok('10 là mốc', m11IsMilestone(10));
ok('25 là mốc', m11IsMilestone(25));
ok('50 là mốc', m11IsMilestone(50));
ok('9 không là mốc', !m11IsMilestone(9));
ok('11 không là mốc', !m11IsMilestone(11));
ok('100 không là mốc', !m11IsMilestone(100));

// 4. m11MilestoneBonus
eq('mốc 10 → +5∞', m11MilestoneBonus(10), 5);
eq('mốc 25 → +15∞', m11MilestoneBonus(25), 15);
eq('mốc 50 → +40∞', m11MilestoneBonus(50), 40);
eq('không mốc → 0', m11MilestoneBonus(11), 0);

// 5. m11ShouldReset: 3s không đánh trúng → reset
ok('2.9s → chưa reset', !m11ShouldReset(100, 102.9));
ok('đúng 3.0s → chưa reset (ngưỡng >)', !m11ShouldReset(100, 103));
ok('3.01s → reset', m11ShouldReset(100, 103.01));
ok('đòn vừa trúng → chưa reset', !m11ShouldReset(100, 100));

// 6. m11ScaleFor: số combo to dần, kẹp tối đa
eq('combo 0 → scale 1', m11ScaleFor(0), 1);
near('combo 10 → 1.5', m11ScaleFor(10), 1.5);
near('combo 20 → 2.0', m11ScaleFor(20), 2.0);
eq('combo 24 → kẹp 2.2', m11ScaleFor(24), 2.2);
eq('combo 100 → vẫn 2.2 (không che màn hình)', m11ScaleFor(100), 2.2);
ok('scale tăng dần theo combo', m11ScaleFor(15) > m11ScaleFor(5));

// 7. đấu nối trong js/combat.js: hook đúng chỗ, không phá logic cũ
ok('playerAttack gọi comboHit() khi trúng', /comboHit\(\);[\s\S]{0,60}drawMonsterHP\(m\)/.test(src));
ok('đánh hụt hoàn toàn → comboReset()', /if \(!hitAny\) comboReset\(\);/.test(src));
ok('updateMonsters gọi updateCombo(dt)', /updateCombo\(dt\);[\s\S]{0,300}for \(const m of monsters\)/.test(src)); // nới 200→300 vì WISP chèn updateWisps hợp lệ
ok('mốc có toast tiếng Việt', /COMBO \$\{comboState\.n\}! Đánh liên tiếp chuẩn xác/.test(src));
ok('thưởng mốc gọi addInf', /m11MilestoneBonus\(comboState\.n\)[\s\S]{0,60}addInf\(bonus\)/.test(src));
ok('DOM số combo tạo tự động trong combat.js (không đụng index.html)', src.includes("el.id = 'combo-count'"));
ok('combo counter đủ to trên màn 360px (clamp 30px)', src.includes('clamp(30px,10vw,58px)'));
ok('không đụng sát thương cũ (dmgCalc giữ nguyên)', src.includes('export function dmgCalc(atk, def)'));

console.log(`m11-combo: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
