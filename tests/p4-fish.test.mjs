// Test logic P4: minigame câu cá ở ao sen (v12, học Koster + Schell)
// Chạy: node tests/p4-fish.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/actors.js', import.meta.url), 'utf-8');

// 1) Đoạn testable P4 (máy trạng thái thuần, không dùng THREE/browser)
const m = src.match(/\/\/ \[P4-TESTABLE-START\]([\s\S]*?)\/\/ \[P4-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [P4-TESTABLE-*] trong js/actors.js'); process.exit(1); }
const sandbox = {};
runInNewContext(
  m[1].slice(m[1].indexOf('\n') + 1) +
  '\n;globalThis.__p4 = { P4_FISH_DIST, P4_WAIT_MIN, P4_WAIT_MAX, P4_BITE_WINDOW,' +
  ' P4_REWARD_XP, P4_REWARD_INF, P4_FISH_NAMES, p4NearPond, fishNew, fishCast, fishTick, fishStrike };',
  sandbox);
const { P4_FISH_DIST, P4_WAIT_MIN, P4_WAIT_MAX, P4_BITE_WINDOW,
        P4_REWARD_XP, P4_REWARD_INF, P4_FISH_NAMES,
        p4NearPond, fishNew, fishCast, fishTick, fishStrike } = sandbox.__p4;

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error(`FAIL ${name}`); }
}

// --- A. Hằng số đúng spec ---
ok('câu trong 10m tâm ao', P4_FISH_DIST === 10);
ok('chờ cắn 2–5s', P4_WAIT_MIN === 2 && P4_WAIT_MAX === 5);
ok('cửa sổ giật 0.9s', P4_BITE_WINDOW === 0.9);
ok('thưởng ngang Quái Vẩn (15 XP)', P4_REWARD_XP === 15);
ok('thưởng 10∞', P4_REWARD_INF === 10);
ok('4 loại cá đồng', P4_FISH_NAMES.length === 4);

// --- B. p4NearPond ---
ok('đứng cạnh ao (5m) → câu được', p4NearPond(48 + 5, 40, 48, 40) === true);
ok('đứng xa (50m) → không', p4NearPond(0, 0, 48, 40) === false);

// --- C. fishCast: hẹn giờ cắn trong 2–5s ---
const c0 = fishCast(fishNew(), 0);
ok('rand=0 → biteAt=2s', c0.biteAt === 2 && c0.phase === 'wait' && c0.t === 0);
const c1 = fishCast(fishNew(), 0.999999);
ok('rand~1 → biteAt~5s', c1.biteAt > 4.99 && c1.biteAt <= 5);

// --- D. fishTick: wait → bite đúng hẹn ---
let st = fishCast(fishNew(), 0.5); // biteAt = 3.5
st = fishTick(st, 3.0, 0.5);
ok('chưa tới hẹn → vẫn wait', st.phase === 'wait');
st = fishTick(st, 0.6, 0.5);
ok('tới hẹn → bite + reset t', st.phase === 'bite' && st.t === 0);

// --- E. fishTick: quá 0.9s không giật → tự thả lại, KHÔNG phạt ---
st = fishTick(st, 0.5, 0.5);
ok('trong cửa sổ → vẫn bite', st.phase === 'bite');
st = fishTick(st, 0.5, 0.2); // t=1.0 > 0.9 → nhả
ok('quá cửa sổ → tự thả câu mới (wait)', st.phase === 'wait' && st.t === 0);
ok('câu mới hẹn lại 2–5s', st.biteAt >= 2 && st.biteAt <= 5);

// --- F. fishStrike: dính khi bite, giật sớm không mất gì ---
const bite = { phase: 'bite', t: 0.3, biteAt: 3 };
const r1 = fishStrike(bite);
ok('giật trong nhịp → dính + về idle', r1.caught === true && r1.state.phase === 'idle');
const r2 = fishStrike({ phase: 'wait', t: 1, biteAt: 3 });
ok('giật sớm → không dính, giữ nguyên state', r2.caught === false && r2.state.phase === 'wait');
const r3 = fishStrike(fishNew());
ok('giật khi chưa thả → không dính', r3.caught === false);

// --- G. actors.js đấu nối đúng ---
ok('E ưu tiên rau → làng → cá (VIL)', /if \(!pickVeggie\(\) && !vilAction\(\)\) fishAction\(\);/.test(src));
ok('main.js gọi updateFishing mỗi frame', readFileSync(new URL('../js/main.js', import.meta.url), 'utf-8').includes('updateFishing(dt);'));
ok('nút Câu mobile ≥76px', /btn-fish[\s\S]*?min-width:76px/.test(src));
ok('thưởng cá qua addInf/addXP chuẩn', /addInf\(P4_REWARD_INF\); addXP\(P4_REWARD_XP\)/.test(src));

console.log(`P4: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
