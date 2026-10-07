// Test P1: quest 2 "Giúp Bà Tám Xén" — trích block [P1-TESTABLE-*] từ js/actors.js rồi eval
// Chạy: node tests/p1-quest2.test.mjs  (exit 0 = pass)
//
// L1 (thế nào là xong):
//  - Máy trạng thái thuần 'none'→'active'→'done': nhặt khi chưa nhận không đếm; nhận 2 lần
//    không reset tiến độ; mỗi bó rau chỉ đếm 1 lần; chưa đủ 5 không trả được; đủ 5 → 'done'
//    + thưởng +30 XP +50∞; save cũ không có S.q2 được migrate an toàn, không crash.
//  - Tích hợp (kiểm tra tĩnh trên code): mở shop Bà Tám Xén luôn chạy quest trước
//    (openShop móc p1BaTamQuest); đứng gần rau thì nearVeggie được cập nhật + nút Nhặt
//    hiện trên mobile; tracker "rau dại x/5" có div riêng; marker rau được tick mỗi frame;
//    saveGame lưu nguyên S (giữ q2); load save đang làm dở thì spawn lại rau.
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/actors.js', import.meta.url), 'utf-8');
const m = src.match(/\/\/ \[P1-TESTABLE-START\]([\s\S]*?)\/\/ \[P1-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [P1-TESTABLE-*] trong js/actors.js'); process.exit(1); }

// Block viết cho ES module (dùng `export`) → lột `export ` ở đầu dòng để eval được trong vm thường
const code = m[1].replace(/^export\s+/gm, '');
const sandbox = {};
runInNewContext(
  code + '\n;globalThis.__p1 = { P1_VEG_NEED, P1_VEG_COUNT, P1_REWARD_XP, P1_REWARD_INF, ' +
  'P1_PICK_XP, P1_VEG_LAYOUT, q2New, q2Accept, q2Pick, q2CanTurnIn, q2TurnIn, q2Reward, ' +
  'q2TrackerText, q2Migrate };',
  sandbox);
const p1 = sandbox.__p1;

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

// --- A. Hằng số cân bằng (theo L1/AUTO_DEV: 5 bó cần, 7 bó spawn, thưởng 30 XP + 50∞) ---
eq('P1_VEG_NEED = 5', p1.P1_VEG_NEED, 5);
eq('P1_VEG_COUNT = 7 (dư 2 cho dễ tìm)', p1.P1_VEG_COUNT, 7);
eq('P1_REWARD_XP = 30', p1.P1_REWARD_XP, 30);
eq('P1_REWARD_INF = 50', p1.P1_REWARD_INF, 50);
eq('P1_PICK_XP = 2', p1.P1_PICK_XP, 2);
eq('P1_VEG_LAYOUT đủ 7 vị trí', p1.P1_VEG_LAYOUT.length, 7);
ok('layout: góc/bán kính là số', p1.P1_VEG_LAYOUT.every(L => typeof L.a === 'number' && typeof L.r === 'number'));

// --- B. Nhận quest: 'none' → 'active'; nhận lại không reset ---
let q = p1.q2New();
eq('mới: state none', q.state, 'none');
eq('mới: picked 0', q.picked, 0);
q = p1.q2Accept(q);
eq('nhận: state active', q.state, 'active');
let q2 = p1.q2Pick(p1.q2Pick(q, 0), 1); // nhặt 2 bó
eq('nhặt 2 bó: picked 2', q2.picked, 2);
const q3 = p1.q2Accept(q2); // nhận lại lần 2
eq('nhận lại: vẫn active', q3.state, 'active');
eq('nhận lại: picked không reset', q3.picked, 2);
eq('nhận lại: removed giữ nguyên', q3.removed, [0, 1]);
eq('q2Accept(null) không crash', p1.q2Accept(null), null);
ok('q2Accept không sửa object gốc (pure)', q2.picked === 2 && q2.state === 'active');

// --- C. Nhặt rau: chưa nhận không đếm; mỗi bó chỉ đếm 1 lần ---
eq('nhặt khi none: picked 0', p1.q2Pick(p1.q2New(), 0).picked, 0);
eq('nhặt khi none: state vẫn none', p1.q2Pick(p1.q2New(), 0).state, 'none');
let a = p1.q2Accept(p1.q2New());
a = p1.q2Pick(a, 3);
eq('nhặt bó 3: picked 1', a.picked, 1);
a = p1.q2Pick(a, 3); // nhặt lại bó đã nhặt
eq('nhặt lại bó 3: vẫn 1', a.picked, 1);
a = p1.q2Pick(a, -1);
eq('idx âm: không đổi', a.picked, 1);
a = p1.q2Pick(a, 1.5);
eq('idx không nguyên: không đổi', a.picked, 1);
a = p1.q2Pick(a, 4);
eq('nhặt bó 4: picked 2', a.picked, 2);
eq('removed = [3,4]', a.removed, [3, 4]);
const doneQ = p1.q2TurnIn(p1.q2Pick(p1.q2Pick(p1.q2Pick(p1.q2Pick(p1.q2Pick(p1.q2Accept(p1.q2New()), 0), 1), 2), 3), 4));
eq('nhặt khi done: picked giữ 5', p1.q2Pick(doneQ, 5).picked, 5);
eq('nhặt khi done: state vẫn done', p1.q2Pick(doneQ, 5).state, 'done');

// --- D. Trả quest: chưa đủ 5 không được; đủ 5 → done + thưởng ---
let b = p1.q2Accept(p1.q2New());
for (const i of [0, 1, 2, 3]) b = p1.q2Pick(b, i);
eq('4 bó: chưa đủ trả', p1.q2CanTurnIn(b), false);
const b2 = p1.q2TurnIn(b);
eq('4 bó: trả không đổi state', b2.state, 'active');
eq('4 bó: picked giữ nguyên', b2.picked, 4);
b = p1.q2Pick(b, 4);
eq('5 bó: đủ trả', p1.q2CanTurnIn(b), true);
const c = p1.q2TurnIn(b);
eq('trả: state done', c.state, 'done');
eq('trả: picked giữ 5', c.picked, 5);
eq('thưởng = {xp:30, inf:50}', p1.q2Reward(), { xp: 30, inf: 50 });
eq('thưởng khớp hằng số', [p1.q2Reward().xp, p1.q2Reward().inf], [p1.P1_REWARD_XP, p1.P1_REWARD_INF]);
eq('trả khi none: không đổi', p1.q2TurnIn(p1.q2New()).state, 'none');

// --- E. Tracker HUD: format "rau dại x/5" ---
eq('none → chuỗi rỗng', p1.q2TrackerText(p1.q2New()), '');
eq('active 0/5', p1.q2TrackerText(p1.q2Accept(p1.q2New())), '🌿 Giúp Bà Tám Xén: rau dại 0/5');
let t = p1.q2Accept(p1.q2New());
t = p1.q2Pick(p1.q2Pick(p1.q2Pick(t, 0), 1), 2);
eq('active 3/5', p1.q2TrackerText(t), '🌿 Giúp Bà Tám Xén: rau dại 3/5');
eq('nhặt thừa vẫn kẹp 5/5', p1.q2TrackerText({ state: 'active', picked: 7, removed: [0,1,2,3,4,5,6], spots: [] }),
  '🌿 Giúp Bà Tám Xén: rau dại 5/5');
eq('done → hoàn thành', p1.q2TrackerText({ state: 'done', picked: 5, removed: [], spots: [] }),
  '🌿 Giúp Bà Tám Xén: ✓ hoàn thành!');

// --- F. Migrate save cũ (không có S.q2) không crash ---
eq('raw null → mặc định', p1.q2Migrate(null), { state: 'none', picked: 0, spots: [], removed: [] });
eq('raw undefined → mặc định', p1.q2Migrate(undefined), { state: 'none', picked: 0, spots: [], removed: [] });
eq('raw chuỗi → mặc định', p1.q2Migrate('rác'), { state: 'none', picked: 0, spots: [], removed: [] });
eq('raw {} → none', p1.q2Migrate({}).state, 'none');
const mg = p1.q2Migrate({ state: 'active', removed: [0, 2], spots: [{ x: 1, z: 2 }] });
eq('active giữ nguyên', mg.state, 'active');
eq('picked suy từ removed', mg.picked, 2);
eq('spots giữ nguyên', mg.spots, [{ x: 1, z: 2 }]);
const mg2 = p1.q2Migrate({ state: 'active', removed: [0, 'a', -1, 2.5, 3], spots: [{ x: 1 }, { x: 1, z: 'z' }, null] });
eq('removed rác bị lọc', mg2.removed, [0, 3]);
eq('picked sau lọc = 2', mg2.picked, 2);
eq('spots rác bị lọc', mg2.spots, []);
eq('state lạ → none', p1.q2Migrate({ state: 'weird', removed: [1] }).state, 'none');
eq('done giữ nguyên', p1.q2Migrate({ state: 'done', removed: [0, 1, 2, 3, 4] }).state, 'done');
eq('done: picked 5', p1.q2Migrate({ state: 'done', removed: [0, 1, 2, 3, 4] }).picked, 5);

// --- G. Tích hợp (đọc code, không cần browser) ---
const mShop = src.match(/export function openShop\(\) \{([\s\S]*?)\nexport function closeShop/);
ok('openShop móc p1BaTamQuest (mở shop Bà Tám → chạy quest trước)', !!mShop && mShop[1].includes('p1BaTamQuest()'));
ok('updateNearNPC cập nhật nearVeggie (E mới nhặt được rau)', src.includes('nearVeggie = p1NearestVeggie();'));
ok('nút Nhặt hiện khi đứng gần rau (mobile)', src.includes('btnPick.style.display = (nearVeggie'));
ok('updateNPCAnim tick marker rau mỗi frame', src.includes('p1TickVeggieMarkers();'));
ok('tracker q2 có div riêng quest2-tracker', src.includes("p1QuestEl.id = 'quest2-tracker'"));
ok('tracker vẽ lại sau khi nhặt (pickVeggie)', src.includes('p1RenderTracker(); // cập nhật "rau dại x/5"'));
ok('không còn wiring chết _shopWiring/_openShopOrig', !src.includes('_shopWiring') && !src.includes('_openShopOrig'));
ok('load save đang làm dở → spawn lại rau', src.includes("if (S.q2.state === 'active') spawnVeggies();"));
const core = readFileSync(new URL('../js/core.js', import.meta.url), 'utf-8');
ok('saveGame lưu nguyên S (giữ field q2)', /JSON\.stringify\(S\)/.test(core));

console.log(`P1 quest2: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
