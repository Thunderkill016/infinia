// Test logic Q5: quest "Giếng bẩn" — R4 vertical slice 8 phút
// Chạy: node tests/q5-slice.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/utils.js', import.meta.url), 'utf-8');

// 1) Đoạn testable Q5 (thuần, không THREE/DOM/import)
const m = src.match(/\/\/ \[Q5-TESTABLE-START\]([\s\S]*?)\/\/ \[Q5-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [Q5-TESTABLE-*] trong js/utils.js'); process.exit(1); }
const sandbox = {};
runInNewContext(
  m[1].slice(m[1].indexOf('\n') + 1) +
  '\n;globalThis.__q5 = { Q5_NEED, Q5_AO_R, Q5_REWARD_XP, Q5_REWARD_INF,' +
  ' q5New, q5Accept, q5Kill, q5CanTurnIn, q5TurnIn, q5TrackerText, q5Migrate };',
  sandbox);
const { Q5_NEED, Q5_AO_R, Q5_REWARD_XP, Q5_REWARD_INF,
        q5New, q5Accept, q5Kill, q5CanTurnIn, q5TurnIn, q5TrackerText, q5Migrate } = sandbox.__q5;

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error(`FAIL ${name}`); }
}

// --- A. Hằng số slice ---
ok('cần hạ 3 con', Q5_NEED === 3);
ok('quanh ao 25m', Q5_AO_R === 25);
ok('thưởng 40 XP + 60∞', Q5_REWARD_XP === 40 && Q5_REWARD_INF === 60);

// --- B. Máy trạng thái none→active→done ---
ok('mới → none', q5New().state === 'none');
const a = q5Accept(q5New());
ok('Bà Lụa nhờ → active 0 kill', a.state === 'active' && a.kills === 0);
ok('nhận lại không reset', q5Accept(a).kills === 0 && q5Accept(a).state === 'active');
ok('chưa đủ 3 → chưa trả được', q5CanTurnIn(q5Kill(q5Kill(a, true), true)) === false);

// --- C. Chỉ đếm quanh ao khi active ---
let s = q5Accept(q5New());
s = q5Kill(s, false); // hạ quái trong làng → không đếm (không fail, chỉ không đếm)
ok('ngoài ao không đếm', s.kills === 0);
s = q5Kill(q5Kill(q5Kill(s, true), true), true);
ok('3 con quanh ao → đủ', s.kills === 3 && q5CanTurnIn(s) === true);
ok('trả xong → done', q5TurnIn(s).state === 'done');
ok('chưa đủ mà trả → giữ nguyên', q5TurnIn(q5Accept(q5New())).state === 'active');

// --- D. Tracker + migrate ---
ok('chưa nhận → tracker trống', q5TrackerText(q5New()) === '');
ok('done → chúc mừng', q5TrackerText({ state: 'done', kills: 3 }).includes('hoàn thành'));
ok('save hỏng → none an toàn', q5Migrate(null).state === 'none' && q5Migrate('x').state === 'none');

// --- E. Đấu nối runtime (slice dùng toàn hệ cũ, không hệ mới) ---
const actors = readFileSync(new URL('../js/actors.js', import.meta.url), 'utf-8');
const combat = readFileSync(new URL('../js/combat.js', import.meta.url), 'utf-8');
ok('Bà Lụa (seq 0) nhận/trả qua dialog', /q5BaLuaQuest\(n\);/.test(actors) && /n\.seq !== 0/.test(actors));
ok('killMonster đếm kill quanh ao (tái dùng POND)', /q5Kill\(S\.q5, true\)/.test(combat) && /Q5_AO_R/.test(combat));
ok('trả quest xây giếng MIỄN PHÍ (payoff slice)', /S\.vil\.gieng = true; vilShow\('gieng'\)/.test(actors));
ok('tracker riêng quest5-tracker', /quest5-tracker/.test(actors));

console.log(`Q5: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
