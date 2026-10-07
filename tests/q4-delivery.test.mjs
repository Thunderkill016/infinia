// Test Q4: quest "Bánh ít cho Ông Đồ" kiểu ĐƯA ĐỒ (backlog P6, học Stardew delivery)
// Chạy: node tests/q4-delivery.test.mjs  (exit 0 = pass)
//
// L1 (thế nào là xong):
//  - Máy trạng thái thuần 'none'→'active' (có bánh)→'delivered' (đã trao)→'done':
//    nhận quest 2 lần không reset; trao bánh khi chưa nhận không đổi; trả quest khi
//    chưa trao không được; đủ bước → 'done' + thưởng +30 XP +50∞ (ngang quest 2/3);
//    save cũ không có S.q4 được migrate an toàn, không crash.
//  - Schell (cozy, không fail-state): bánh nằm trong trạng thái quest, không có đường
//    nào làm mất bánh — bỏ đi đâu cũng không mất.
//  - Tích hợp (kiểm tra tĩnh trên code): mở shop Bà Tám Xén (seq 3) móc quest;
//    nói chuyện Ông Đồ Nho (seq 2, dialog) móc trao bánh; tracker riêng quest4-tracker.
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/actors.js', import.meta.url), 'utf-8');
const m = src.match(/\/\/ \[Q4-TESTABLE-START\]([\s\S]*?)\/\/ \[Q4-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [Q4-TESTABLE-*] trong js/actors.js'); process.exit(1); }

// Block viết cho ES module (dùng `export`) → lột `export ` ở đầu dòng để eval được trong vm thường
const code = m[1].replace(/^export\s+/gm, '');
const sandbox = {};
runInNewContext(
  code + '\n;globalThis.__q4 = { Q4_BA_TAM_SEQ, Q4_ONG_DO_SEQ, Q4_ITEM_NAME, ' +
  'Q4_REWARD_XP, Q4_REWARD_INF, ' +
  'q4New, q4Accept, q4Deliver, q4TurnIn, q4CanDeliver, q4CanTurnIn, q4Reward, ' +
  'q4TrackerText, q4Migrate };',
  sandbox);
const q4 = sandbox.__q4;

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

// --- A. Hằng số (người giao/trả + thưởng ngang quest 2/3) ---
eq('Q4_BA_TAM_SEQ = 3 (Bà Tám Xén)', q4.Q4_BA_TAM_SEQ, 3);
eq('Q4_ONG_DO_SEQ = 2 (Ông Đồ Nho)', q4.Q4_ONG_DO_SEQ, 2);
eq('Q4_ITEM_NAME = Gói bánh ít', q4.Q4_ITEM_NAME, 'Gói bánh ít');
eq('Q4_REWARD_XP = 30 (ngang quest 2/3)', q4.Q4_REWARD_XP, 30);
eq('Q4_REWARD_INF = 50 (ngang quest 2/3)', q4.Q4_REWARD_INF, 50);

// --- B. Nhận quest: 'none' → 'active' (có bánh); nhận lại không reset ---
let a = q4.q4New();
eq('mới: state none', a.state, 'none');
a = q4.q4Accept(a);
eq('nhận: state active', a.state, 'active');
eq('nhận lại: vẫn active', q4.q4Accept(a).state, 'active');
ok('nhận lại: cùng object nội dung (không reset)', JSON.stringify(q4.q4Accept(a)) === JSON.stringify(a));
eq('q4Accept(null) không crash', q4.q4Accept(null), null);
eq('q4Accept khi delivered: giữ nguyên', q4.q4Accept({ state: 'delivered' }).state, 'delivered');
eq('q4Accept khi done: giữ nguyên', q4.q4Accept({ state: 'done' }).state, 'done');
ok('q4Accept thuần (không sửa object gốc)', (() => { const o = q4.q4New(); q4.q4Accept(o); return o.state === 'none'; })());

// --- C. Trao bánh: chỉ 'active' → 'delivered' (Schell: không mất bánh ở mốc khác) ---
eq('trao khi none: giữ none', q4.q4Deliver(q4.q4New()).state, 'none');
eq('trao khi active: thành delivered', q4.q4Deliver(q4.q4Accept(q4.q4New())).state, 'delivered');
eq('trao 2 lần: vẫn delivered', q4.q4Deliver(q4.q4Deliver(q4.q4Accept(q4.q4New()))).state, 'delivered');
eq('trao khi done: giữ done', q4.q4Deliver({ state: 'done' }).state, 'done');
eq('q4Deliver(null) không crash', q4.q4Deliver(null), null);
ok('q4CanDeliver: active mới được trao', q4.q4CanDeliver({ state: 'active' }) === true);
ok('q4CanDeliver: none/delivered/done không trao', q4.q4CanDeliver(q4.q4New()) === false && q4.q4CanDeliver({ state: 'delivered' }) === false && q4.q4CanDeliver({ state: 'done' }) === false);

// --- D. Trả quest: chỉ 'delivered' → 'done' (chưa trao không trả được) ---
eq('trả khi none: giữ none', q4.q4TurnIn(q4.q4New()).state, 'none');
eq('trả khi active (chưa trao): giữ active', q4.q4TurnIn(q4.q4Accept(q4.q4New())).state, 'active');
{
  const d = q4.q4Deliver(q4.q4Accept(q4.q4New()));
  eq('trả khi delivered: thành done', q4.q4TurnIn(d).state, 'done');
}
eq('trả 2 lần: vẫn done', q4.q4TurnIn({ state: 'done' }).state, 'done');
eq('q4TurnIn(null) không crash', q4.q4TurnIn(null), null);
ok('q4CanTurnIn: delivered mới được trả', q4.q4CanTurnIn({ state: 'delivered' }) === true);
ok('q4CanTurnIn: active không trả', q4.q4CanTurnIn({ state: 'active' }) === false);
eq('thưởng = {xp:30, inf:50}', q4.q4Reward(), { xp: 30, inf: 50 });
eq('thưởng khớp hằng số', [q4.q4Reward().xp, q4.q4Reward().inf], [q4.Q4_REWARD_XP, q4.Q4_REWARD_INF]);

// --- E. Luồng đủ bước none→active→delivered→done (Stardew delivery) ---
{
  let q = q4.q4New();
  q = q4.q4Accept(q);
  eq('b1 nhận quest: active', q.state, 'active');
  q = q4.q4Deliver(q);
  eq('b2 trao bánh: delivered', q.state, 'delivered');
  q = q4.q4TurnIn(q);
  eq('b3 trả quest: done', q.state, 'done');
}

// --- F. Tracker HUD: có dòng "Mang bánh cho Ông Đồ" ---
eq('none → chuỗi rỗng', q4.q4TrackerText(q4.q4New()), '');
ok('active nhắc "Mang bánh cho Ông Đồ"', q4.q4TrackerText(q4.q4Accept(q4.q4New())).includes('Mang bánh cho Ông Đồ'));
ok('active nhắc tên bánh', q4.q4TrackerText(q4.q4Accept(q4.q4New())).includes('Gói bánh ít'));
ok('delivered nhắc quay về Bà Tám', q4.q4TrackerText({ state: 'delivered' }).includes('Bà Tám'));
eq('done → hoàn thành', q4.q4TrackerText({ state: 'done' }), '🍡 Bánh ít cho Ông Đồ: ✓ hoàn thành!');

// --- G. Migrate save cũ (không có S.q4) không crash ---
eq('raw null → mặc định', q4.q4Migrate(null), { state: 'none' });
eq('raw undefined → mặc định', q4.q4Migrate(undefined), { state: 'none' });
eq('raw chuỗi → mặc định', q4.q4Migrate('rác'), { state: 'none' });
eq('raw {} → none', q4.q4Migrate({}).state, 'none');
eq('active giữ nguyên', q4.q4Migrate({ state: 'active' }).state, 'active');
eq('delivered giữ nguyên', q4.q4Migrate({ state: 'delivered' }).state, 'delivered');
eq('done giữ nguyên', q4.q4Migrate({ state: 'done' }).state, 'done');
eq('state lạ → none', q4.q4Migrate({ state: 'weird' }).state, 'none');

// --- H. Tích hợp quest (đọc code, không cần browser) ---
ok('openDialog móc trao bánh Ông Đồ', src.includes('q4OngDoQuest(n); // Q4:'));
ok('trao bánh chỉ chạy với Ông Đồ (seq 2)', src.includes('n.seq !== Q4_ONG_DO_SEQ'));
ok('openShop móc quest Bà Tám (nhận/trả Q4)', src.includes('q4BaTamQuest(); // Q4:'));
ok('quest 2 cũ vẫn được móc (không gãy P1)', src.includes('p1BaTamQuest();'));
ok('nhận quest khi none (idempotent)', src.includes("S.q4.state === 'none'"));
ok('trả quest khi đã trao bánh', src.includes('q4CanTurnIn(S.q4)'));
ok('trao bánh khi đang giữ bánh', src.includes('q4CanDeliver(S.q4)'));
ok('nhận quest nhắc Gói bánh ít', src.includes('Q4_ITEM_NAME'));
ok('tracker q4 có div riêng quest4-tracker', src.includes("q4QuestEl.id = 'quest4-tracker'"));
ok('tracker vẽ lại sau mỗi mốc (q4RenderTracker)', src.includes('q4RenderTracker();'));
ok('thưởng ngang quest 2/3 qua addInf/addXP', src.includes('addInf(r.inf); addXP(r.xp); // addXP tự updateHUD + saveGame') || src.includes('addInf(Q4'));
ok('S.q4 được migrate lúc khởi tạo (pattern như p1InitQ2/q3InitQ3)', src.includes('S.q4 = q4Migrate(raw);'));
ok('đọc q4 từ save cũ trong store', /d\.q4 && typeof d\.q4 === 'object'/.test(src));
ok('không đụng túi đồ/shop (bánh nằm trong state)', !/S\.bag|inventory.*q4|q4.*inventory/i.test(src));
const core = readFileSync(new URL('../js/core.js', import.meta.url), 'utf-8');
ok('saveGame lưu nguyên S (giữ field q4)', /JSON\.stringify\(S\)/.test(core));
const config = readFileSync(new URL('../js/config.js', import.meta.url), 'utf-8');
ok('NAMED seq 3 là Bà Tám Xén', config.includes("Bà Tám Xén"));
ok('NAMED seq 2 là Ông Đồ Nho', config.includes("Ông Đồ Nho"));

console.log(`Q4 banh-it-cho-ong-do: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
