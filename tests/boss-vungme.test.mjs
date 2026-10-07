// Test BOSS MINI "Vũng Thiu Mẹ" ở ao đông (P3, tone ấm áp không máu me)
// Chạy: node tests/boss-vungme.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/combat.js', import.meta.url), 'utf-8');

// 1) Đoạn testable BOSS (hằng + hàm thuần, không dùng THREE/browser)
const m = src.match(/\/\/ \[BOSS-TESTABLE-START\]([\s\S]*?)\/\/ \[BOSS-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [BOSS-TESTABLE-*] trong js/combat.js'); process.exit(1); }
const sandbox = {};
runInNewContext(
  m[1].slice(m[1].indexOf('\n') + 1) +
  '\n;globalThis.__boss = { BOSS_RESPAWN, BOSS_LEASH_R, BOSS_SLAM_R, BOSS_SLAM_TELE,' +
  ' BOSS_FIGHT_T, BOSS_REST_T, BOSS_VULN_K, BOSS_REWARD_XP, BOSS_REWARD_INF, BOSS_REWARD,' +
  ' bossNew, bossDmgK, bossTick };',
  sandbox);
const b = sandbox.__boss;

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error(`FAIL ${name}`); }
}
function eq(name, got, want) {
  if (got === want) { pass++; }
  else { fail++; console.error(`FAIL ${name}: got ${got}, want ${want}`); }
}
function near(name, got, want, eps = 1e-9) {
  if (Math.abs(got - want) <= eps) { pass++; }
  else { fail++; console.error(`FAIL ${name}: got ${got}, want ~${want}`); }
}

// --- A. Hằng số đúng spec ---
eq('BOSS_RESPAWN = 300s', b.BOSS_RESPAWN, 300);
eq('BOSS_LEASH_R = 26m', b.BOSS_LEASH_R, 26);
near('BOSS_SLAM_R = 4.2m', b.BOSS_SLAM_R, 4.2);
near('BOSS_SLAM_TELE = 0.7s', b.BOSS_SLAM_TELE, 0.7);
eq('BOSS_REST_T = 3s', b.BOSS_REST_T, 3);
eq('BOSS_FIGHT_T = 4s', b.BOSS_FIGHT_T, 4);
eq('BOSS_VULN_K = 1.5', b.BOSS_VULN_K, 1.5);
eq('BOSS_REWARD xp = 100', b.BOSS_REWARD_XP, 100);
eq('BOSS_REWARD inf = 80', b.BOSS_REWARD_INF, 80);
ok('BOSS_REWARD object xp100/inf80',
  b.BOSS_REWARD && b.BOSS_REWARD.xp === 100 && b.BOSS_REWARD.inf === 80);

// --- B. bossNew: trạng thái đầu ---
{
  const s0 = b.bossNew();
  eq('bossNew mode fight', s0.mode, 'fight');
  eq('bossNew t = 4s', s0.t, 4);
  eq('bossNew alt = 0 (lượt vỗ sóng trước)', s0.alt, 0);
}

// --- C. fight 4s → slam (telegraph 0.7s) ---
{
  const s0 = b.bossNew();
  let r = b.bossTick(s0, 3.9, 5, false);
  eq('fight chưa hết 4s → none', r.ev, 'none');
  eq('fight còn lại ~0.1s', Math.round(r.st.t * 10) / 10, 0.1);
  r = b.bossTick(s0, 4, 5, false);
  eq('fight đủ 4s (alt 0) → slam', r.ev, 'slam');
  eq('slam → mode tele', r.st.mode, 'tele');
  near('tele t = 0.7s', r.st.t, 0.7);
  // tele chưa hết → none
  const r2 = b.bossTick(r.st, 0.6, 5, false);
  eq('tele chưa hết 0.7s → none', r2.ev, 'none');
  // tele hết → rest (vỗ xong, lăn ra ngủ)
  const r3 = b.bossTick(r.st, 0.7, 5, false);
  eq('tele đủ 0.7s → rest', r3.ev, 'rest');
  eq('rest mode', r3.st.mode, 'rest');
  eq('rest t = 3s', r3.st.t, 3);
}

// --- D. rest 3s → fight (đảo lượt) ---
{
  const rest = { mode: 'rest', t: 3, alt: 0 };
  let r = b.bossTick(rest, 2.9, 5, false);
  eq('rest chưa đủ 3s → none', r.ev, 'none');
  r = b.bossTick(rest, 3, 5, false);
  eq('rest đủ 3s → fight', r.ev, 'fight');
  eq('dậy → mode fight', r.st.mode, 'fight');
  eq('dậy → t 4s', r.st.t, 4);
  eq('dậy → đảo alt 0→1', r.st.alt, 1);
}

// --- E. Luân phiên: lượt 2 gọi con (summon) rồi ngủ ---
{
  const fight1 = { mode: 'fight', t: 4, alt: 1 };
  const r = b.bossTick(fight1, 4, 5, false);
  eq('fight alt 1 → summon', r.ev, 'summon');
  eq('summon → mode rest', r.st.mode, 'rest');
  eq('summon rest t = 3s', r.st.t, 3);
  // ngủ dậy lại đảo về 0
  const r2 = b.bossTick(r.st, 3, 5, false);
  eq('ngủ sau summon → fight', r2.ev, 'fight');
  eq('đảo alt 1→0', r2.st.alt, 0);
}

// --- F. Mô phỏng full vòng: fight→slam→rest→fight→summon→rest→fight ---
{
  let st = b.bossNew();
  const evs = [];
  // bước 1s, dp gần, mô phỏng 15s
  for (let i = 0; i < 15; i++) {
    const r = b.bossTick(st, 1, 5, false);
    st = r.st;
    if (r.ev !== 'none') evs.push(r.ev);
  }
  ok('vòng đầu có slam', evs.includes('slam'));
  ok('có rest (ngủ sau vỗ)', evs.includes('rest'));
  ok('có fight (tỉnh dậy)', evs.includes('fight'));
  ok('luân phiên có summon', evs.includes('summon'));
  // thứ tự: slam trước summon (alt 0 trước)
  ok('slam trước summon', evs.indexOf('slam') < evs.indexOf('summon'));
}

// --- G. Leash: xa 26m hoặc player gục ---
{
  const s0 = b.bossNew();
  let r = b.bossTick(s0, 1, 30, false);
  eq('xa 30m → leash', r.ev, 'leash');
  eq('leash → về fight', r.st.mode, 'fight');
  eq('leash → t 4s', r.st.t, 4);
  r = b.bossTick(s0, 1, 26, false);
  ok('đúng 26m → chưa leash', r.ev !== 'leash');
  r = b.bossTick(s0, 1, 26.1, false);
  eq('26.1m → leash', r.ev, 'leash');
  r = b.bossTick(s0, 1, 5, true);
  eq('player gục (gần vẫn leash)', r.ev, 'leash');
  // leash giữa tele/rest cũng về
  r = b.bossTick({ mode: 'tele', t: 0.5, alt: 0 }, 0.1, 30, false);
  eq('tele mà xa → leash', r.ev, 'leash');
  r = b.bossTick({ mode: 'rest', t: 2, alt: 1 }, 0.1, 30, false);
  eq('rest mà xa → leash', r.ev, 'leash');
  r = b.bossTick({ mode: 'rest', t: 2, alt: 1 }, 0.1, 5, true);
  eq('rest mà player gục → leash', r.ev, 'leash');
}

// --- H. Hệ số ngủ x1.5 ---
{
  eq('ngủ (rest) → x1.5', b.bossDmgK('rest'), 1.5);
  eq('fight → x1', b.bossDmgK('fight'), 1);
  eq('tele → x1', b.bossDmgK('tele'), 1);
}

// --- I. Runtime đấu nối trong js/combat.js ---
ok('có block BOSS-TESTABLE', /\/\/ \[BOSS-TESTABLE-START\]/.test(src));
ok('makeBoss tồn tại', /export function makeBoss\(\)/.test(src));
ok('makeBoss dùng vảy vnVayQuatTex', /vnVayQuatTex\(\)/.test(src));
ok('makeBoss có sen trên đầu (lá sen/búp sen)', /vnLaSenTex\(\)/.test(src));
ok('thanh HP to (canvas 256 + scale 3.6)', src.includes('c.width = 256') && /bar\.scale\.set\(3\.6/.test(src));
ok('vòng telegraph đỏ (ring)', /ring\.visible/.test(src) && /0xff4d4d/.test(src));
ok('mảng bosses[]', /export const bosses = \[\]/.test(src));
ok('updateBosses tồn tại', /export function updateBosses\(dt\)/.test(src));
ok('updateMonsters gọi updateBosses(dt)',
  /export function updateMonsters[\s\S]*?updateBosses\(dt\)/.test(src));
ok('playerAttack đánh được boss (vòng bosses)', /for \(const b of bosses\)/.test(src));
ok('boss tái dùng dmgCalc', /dmgCalc\(atkOf\(\), b\.cfg\.def\)/.test(src));
ok('boss tái dùng comboHit', /drawBossHP\(b\)/.test(src));
ok('boss ngủ chịu x1.5 (BOSS_VULN_K)', /b\.st && b\.st\.mode === 'rest'/.test(src) && src.includes('BOSS_VULN_K'));
ok('boss trúng đòn nảy squash J12', /b\.squashT = J12_SQUASH_T/.test(src));
ok('boss có trường squashT/tele/sx0 như quái thường', /squashT: 0, tele: false, sx0:/.test(src));
ok('boss chết → killBoss', /killBoss\(b\)/.test(src));
ok('killBoss thưởng xp100/inf80', src.includes('BOSS_REWARD_INF') && src.includes('BOSS_REWARD_XP'));
ok('boss respawn 300s (BOSS_RESPAWN)', /b\.respawnT = BOSS_RESPAWN/.test(src));
ok('boss leash hồi đầy về ổ', /export function bossLeash\(b\)/.test(src) && src.includes('BOSS_LEASH_R'));
ok('boss gọi 2 Vẩn con', /bossSummonAdds/.test(src) && /m\.kind !== 'vun'/.test(src));
ok('slam AoE 4.2m né được (hurtPlayer theo BOSS_SLAM_R)', /BOSS_SLAM_R/.test(src) && /hurtPlayer\(dmgCalc\(b\.cfg\.atk/.test(src));
ok('toast ấm áp hóa giải (không máu me)', /hóa giải/.test(src));
ok('toast leash ấm áp', /lặn về ổ/.test(src));
ok('KHÔNG sửa P2_KINDS (chỉ import, không định nghĩa lại)', !/P2_KINDS\s*=\s*\{/.test(src));
ok('lore Vũng Thiu Mẹ', src.includes('Vũng Thiu Mẹ'));
ok('comment tiếng Việt (mẹ/ổ/sen/ngủ)', src.includes('ngủ') && src.includes('sen'));

console.log(`BOSS Vũng Thiu Mẹ: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
