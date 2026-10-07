// Test Q3: quest "Trâu Cà Phê đi lạc" + lễ hội Trăng Rằm — trích block [Q3-TESTABLE-*] từ js/actors.js rồi eval
// Chạy: node tests/q3-trau.test.mjs  (exit 0 = pass)
//
// L1 (thế nào là xong):
//  - Máy trạng thái thuần 'none'→'active'→'found'→'done': nhận quest 2 lần không reset;
//    tìm trâu khi chưa nhận không đổi; trả quest khi chưa dắt không được; đủ dắt → 'done'
//    + thưởng +30 XP +50∞ (ngang quest 2); save cũ không có S.q3 được migrate an toàn.
//  - Đêm rằm thuần: DN.t trong [0.72,0.78] là rằm (bao cả biên); ngoài cửa sổ không phải;
//    câu thoại rằm có tên NPC + chữ "rằm"; mỗi NPC chào 1 lần/đêm (thuần, không sửa mảng gốc).
//  - Tích hợp (kiểm tra tĩnh trên code): nói chuyện Cu Tít (seq 1) móc quest; E dắt trâu
//    (giữ nguyên dòng rau→cá của P4); marker + tracker riêng; tải save dở vẫn dắt tiếp;
//    world.js xuất tay nắm trâu + đèn rằm sáng gấp đôi.
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/actors.js', import.meta.url), 'utf-8');
const m = src.match(/\/\/ \[Q3-TESTABLE-START\]([\s\S]*?)\/\/ \[Q3-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [Q3-TESTABLE-*] trong js/actors.js'); process.exit(1); }

// Block viết cho ES module (dùng `export`) → lột `export ` ở đầu dòng để eval được trong vm thường
const code = m[1].replace(/^export\s+/gm, '');
const sandbox = {};
runInNewContext(
  code + '\n;globalThis.__q3 = { Q3_HOME, Q3_LOST, Q3_FIND_DIST, Q3_FOLLOW_TIME, ' +
  'Q3_REWARD_XP, Q3_REWARD_INF, Q3_CU_TIT_SEQ, Q3_RAM_T0, Q3_RAM_T1, Q3_RAM_XP, ' +
  'q3New, q3Accept, q3Found, q3TurnIn, q3TrackerText, q3Migrate, ' +
  'q3IsFullMoon, q3RamLine, q3RamCanGreet, q3RamGreet };',
  sandbox);
const q3 = sandbox.__q3;

let pass = 0, fail = 0;
function eq(name, got, want) {
  const gs = JSON.stringify(got), ws = JSON.stringify(want);
  if (gs === ws) { pass++; }
  else { fail++; console.error(`FAIL ${name}: got ${gs}, want ${ws}`); }
}
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error(`FAIL ${name}`); }
}

// --- A. Hằng số (bãi cũ trùng world.js VN-5; đồng cỏ xa; thưởng ngang quest 2) ---
eq('Q3_HOME = bãi cũ [-6,30]', q3.Q3_HOME, [-6, 30]);
eq('Q3_FIND_DIST = 3', q3.Q3_FIND_DIST, 3);
eq('Q3_FOLLOW_TIME = 8s', q3.Q3_FOLLOW_TIME, 8);
eq('Q3_REWARD_XP = 30 (ngang quest 2)', q3.Q3_REWARD_XP, 30);
eq('Q3_REWARD_INF = 50 (ngang quest 2)', q3.Q3_REWARD_INF, 50);
eq('Q3_CU_TIT_SEQ = 1', q3.Q3_CU_TIT_SEQ, 1);
eq('cửa sổ rằm [0.72,0.78]', [q3.Q3_RAM_T0, q3.Q3_RAM_T1], [0.72, 0.78]);
eq('Q3_RAM_XP = 2', q3.Q3_RAM_XP, 2);
{
  const d = Math.hypot(q3.Q3_LOST[0] - q3.Q3_HOME[0], q3.Q3_LOST[1] - q3.Q3_HOME[1]);
  ok(`đồng cỏ xa cách bãi cũ >20m (được ${d.toFixed(1)}m)`, d > 20);
  ok('đồng cỏ xa trong map 220 (±110)', Math.abs(q3.Q3_LOST[0]) < 110 && Math.abs(q3.Q3_LOST[1]) < 110);
  ok('đồng cỏ xa phía nam (z > 30)', q3.Q3_LOST[1] > 30);
}

// --- B. Nhận quest: 'none' → 'active'; nhận lại không reset ---
let a = q3.q3New();
eq('mới: state none', a.state, 'none');
a = q3.q3Accept(a);
eq('nhận: state active', a.state, 'active');
eq('nhận lại: vẫn active', q3.q3Accept(a).state, 'active');
eq('q3Accept(null) không crash', q3.q3Accept(null), null);
eq('q3Accept khi found: giữ nguyên', q3.q3Accept({ state: 'found' }).state, 'found');
eq('q3Accept khi done: giữ nguyên', q3.q3Accept({ state: 'done' }).state, 'done');
ok('q3Accept thuần (không sửa object gốc)', (() => { const o = q3.q3New(); q3.q3Accept(o); return o.state === 'none'; })());

// --- C. Dắt trâu: chỉ 'active' → 'found' ---
eq('found khi none: giữ none', q3.q3Found(q3.q3New()).state, 'none');
eq('found khi active: thành found', q3.q3Found(q3.q3Accept(q3.q3New())).state, 'found');
eq('found 2 lần: vẫn found', q3.q3Found(q3.q3Found(q3.q3Accept(q3.q3New()))).state, 'found');
eq('found khi done: giữ done', q3.q3Found({ state: 'done' }).state, 'done');
eq('q3Found(null) không crash', q3.q3Found(null), null);

// --- D. Trả quest: chỉ 'found' → 'done' ---
eq('trả khi none: giữ none', q3.q3TurnIn(q3.q3New()).state, 'none');
eq('trả khi active (chưa dắt): giữ active', q3.q3TurnIn(q3.q3Accept(q3.q3New())).state, 'active');
{
  const f = q3.q3Found(q3.q3Accept(q3.q3New()));
  eq('trả khi found: thành done', q3.q3TurnIn(f).state, 'done');
}
eq('trả 2 lần: vẫn done', q3.q3TurnIn({ state: 'done' }).state, 'done');

// --- E. Tracker HUD ---
eq('none → chuỗi rỗng', q3.q3TrackerText(q3.q3New()), '');
ok('active nhắc "Tìm trâu Cà Phê"', q3.q3TrackerText(q3.q3Accept(q3.q3New())).includes('Tìm trâu Cà Phê'));
ok('found nhắc trả quest cho Cu Tít', q3.q3TrackerText({ state: 'found' }).includes('Cu Tít'));
eq('done → hoàn thành', q3.q3TrackerText({ state: 'done' }), '🐃 Trâu Cà Phê đi lạc: ✓ hoàn thành!');

// --- F. Migrate save cũ ---
eq('raw null → mặc định', q3.q3Migrate(null), { state: 'none' });
eq('raw undefined → mặc định', q3.q3Migrate(undefined), { state: 'none' });
eq('raw chuỗi → mặc định', q3.q3Migrate('rác'), { state: 'none' });
eq('raw {} → none', q3.q3Migrate({}).state, 'none');
eq('active giữ nguyên', q3.q3Migrate({ state: 'active' }).state, 'active');
eq('found giữ nguyên', q3.q3Migrate({ state: 'found' }).state, 'found');
eq('done giữ nguyên', q3.q3Migrate({ state: 'done' }).state, 'done');
eq('state lạ → none', q3.q3Migrate({ state: 'weird' }).state, 'none');

// --- G. Đêm rằm thuần ---
ok('0.75 (nửa đêm) là rằm', q3.q3IsFullMoon(0.75) === true);
ok('biên dưới 0.72 là rằm', q3.q3IsFullMoon(0.72) === true);
ok('biên trên 0.78 là rằm', q3.q3IsFullMoon(0.78) === true);
ok('0.71 chưa rằm', q3.q3IsFullMoon(0.71) === false);
ok('0.79 hết rằm', q3.q3IsFullMoon(0.79) === false);
ok('ban ngày 0.3 không rằm', q3.q3IsFullMoon(0.3) === false);
ok('hoàng hôn 0.5 không rằm', q3.q3IsFullMoon(0.5) === false);
ok('đầu đêm 0.65 không rằm', q3.q3IsFullMoon(0.65) === false);
ok('rạng sáng 0.95 không rằm', q3.q3IsFullMoon(0.95) === false);
ok('NaN/không số không rằm', q3.q3IsFullMoon('0.75') === false && q3.q3IsFullMoon(undefined) === false);

// --- H. Câu thoại + chào rằm 1 lần/đêm ---
{
  const line = q3.q3RamLine('Bà Lụa');
  ok('câu rằm có tên NPC', line.includes('Bà Lụa'));
  ok('câu rằm có chữ "rằm"', line.includes('rằm'));
  ok('câu rằm ấm áp (sum họp/gia đình)', /sum họp|gia đình/.test(line));
}
ok('chưa chào → được chào', q3.q3RamCanGreet([], 0) === true);
ok('đã chào → không chào lại', q3.q3RamCanGreet([0, 1], 0) === false);
ok('người khác vẫn được chào', q3.q3RamCanGreet([0], 1) === true);
ok('met hỏng → không chào (an toàn)', q3.q3RamCanGreet(null, 0) === false);
eq('greet thêm seq vào mảng mới', q3.q3RamGreet([0], 2), [0, 2]);
eq('greet trùng giữ nguyên', q3.q3RamGreet([0], 0), [0]);
ok('greet thuần (không sửa mảng gốc)', (() => { const o = [0]; q3.q3RamGreet(o, 1); return o.length === 1; })());

// --- I. Tích hợp quest (đọc code, không cần browser) ---
ok('openDialog móc quest Cu Tít', src.includes('q3CuTitQuest(n); // Q3:'));
ok('quest chỉ chạy với Cu Tít (seq 1)', src.includes('n.seq !== Q3_CU_TIT_SEQ'));
ok('nhận quest dời trâu ra đồng cỏ xa', src.includes('q3PlaceTrau(Q3_LOST[0], Q3_LOST[1]);'));
ok('phím E dắt trâu (không tranh nút rau/cá)', src.includes('q3Lead(); // Q3:'));
ok('dòng E rau→làng→cá (VIL chèn giữa, Q3 giữ nguyên q3Lead)', /q3Lead\(\);[\s\S]*?if \(!pickVeggie\(\) && !vilAction\(\)\) fishAction\(\);/.test(src));
ok('updateNearNPC cập nhật nearTrau', src.includes('nearTrau = q3NearTrau();'));
ok('nút Dắt hiện khi đứng gần trâu (mobile)', src.includes('btnLead.style.display = (nearTrau'));
ok('nút Dắt ≥76px (mobile-first)', /btn-lead[\s\S]*?min-width:76px/.test(src));
ok('updateNPCAnim tick Q3 mỗi frame', src.includes('q3Tick(dt); // Q3:'));
ok('tracker q3 có div riêng quest3-tracker', src.includes("q3QuestEl.id = 'quest3-tracker'"));
ok('marker trâu add vào scene', src.includes('scene.add(q3Marker);'));
ok('marker chỉ hiện khi đang tìm (active)', src.includes("S.q3.state === 'active'"));
ok('dắt theo đúng 8s (Q3_FOLLOW_TIME)', src.includes('q3FollowT = Q3_FOLLOW_TIME;'));
ok('hết 8s trâu tự về bãi cũ + toast', src.includes('Trâu Cà Phê tự về bãi cũ rồi!'));
ok('thưởng ngang quest 2 qua addInf/addXP', src.includes('addInf(Q3_REWARD_INF); addXP(Q3_REWARD_XP);'));
ok('S.q3 được migrate lúc khởi tạo (pattern như p1InitQ2)', src.includes('S.q3 = q3Migrate(raw);'));
ok('đọc q3 từ save cũ trong store', /d\.q3 && typeof d\.q3 === 'object'/.test(src));
ok('tải save dở → trâu vẫn ở đồng cỏ xa', src.includes("S.q3.state === 'active' ? Q3_LOST : Q3_HOME"));

// --- J. Tích hợp lễ hội (actors.js + world.js) ---
ok('openDialog tặng câu rằm đêm rằm', src.includes('lines.push(q3RamLine(npcName(n)));'));
ok('chào rằm +2 XP mỗi người', src.includes('r.xp += Q3_RAM_XP;'));
ok('chào rằm 1 lần/đêm mỗi người', src.includes('q3RamCanGreet(q3RamMet, n.seq)'));
ok('toast đêm rằm 1 lần/đêm', src.includes('Đêm rằm! Đèn lồng sáng rực khắp làng'));
ok('cờ rằm reset khi hết rằm (đêm sau chào lại)', src.includes('q3RamToasted = false;'));
const world = readFileSync(new URL('../js/world.js', import.meta.url), 'utf-8');
ok('world.js xuất tay nắm trâu cho quest', /export let vnTrau = null;/.test(world));
ok('world.js gán tay nắm sau khi dựng trâu', world.includes('vnTrau = trau; // Q3:'));
ok('trâu world.js đứng đúng Q3_HOME [-6,30]', world.includes('trau.group.position.set(-6, groundHeight(-6, 30), 30);'));
ok('chắn trâu có tag để dời theo (Q3)', world.includes('r: 1.4, trau: true'));
ok('actors.js dời chắn theo trâu', src.includes('obstacles.find(o => o.trau)'));
ok('đêm rằm đèn lồng sáng gấp đôi', /44 \* n \* \(globalThis\.__q3Ram \? 2 : 1\)/.test(world));
const core = readFileSync(new URL('../js/core.js', import.meta.url), 'utf-8');
ok('saveGame lưu nguyên S (giữ field q3)', /JSON\.stringify\(S\)/.test(core));

console.log(`Q3 trau-oi + trang-ram: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
