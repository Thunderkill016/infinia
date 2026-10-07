// Test R112: món quà yêu thích + mốc thân thiết của 9 NPC có tên (học Spiritfarer)
// Trích block [R112-TESTABLE-*] từ js/actors.js rồi eval (cùng quy ước như P1/F4/V1).
// Chạy: node tests/r112-gifts.test.mjs  (exit 0 = pass)
//
// L1 (thế nào là xong):
//  - 9 NPC có tên mỗi người 1 món quà yêu thích (data trong actors.js, giọng làng quê)
//  - Tặng đúng món cho 9/9 NPC → thân thiết +1; tặng sai món → không tăng, chỉ cảm ơn xã giao
//  - Mốc 3 và 6 mở câu thoại mới riêng từng NPC (giọng COT_TRUYEN)
//  - Đấu nối: npcLines() thêm thoại mốc; nút Tặng quà trong dialog + shop Bà Tám;
//    tặng đúng nổ tim hồng + lưu save; tặng sai không tăng.
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/actors.js', import.meta.url), 'utf-8');
const m = src.match(/\/\/ \[R112-TESTABLE-START\]([\s\S]*?)\/\/ \[R112-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [R112-TESTABLE-*] trong js/actors.js'); process.exit(1); }

// Block viết cho ES module (dùng `export`) → lột `export ` ở đầu dòng để eval được trong vm thường
const code = m[1].replace(/^export\s+/gm, '');
const sandbox = {};
runInNewContext(
  code + '\n;globalThis.__r = { R112_GIFTS, R112_FAV, R112_MILESTONES, R112_RESP_OK, ' +
  'R112_RESP_POLITE, R112_MILESTONE_LINES, r112GiftById, r112AffGet, r112Give, ' +
  'r112MilestoneLines, r112Migrate };',
  sandbox);
const r = sandbox.__r;

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

const SEQS = [0, 1, 2, 3, 4, 5, 6, 7, 8]; // 9 NPC có tên (theo NAMED trong config.js)

// --- A. Danh mục 9 món quà: đủ 9, id duy nhất, tên/desc tiếng Việt không rỗng ---
eq('đủ 9 món quà', r.R112_GIFTS.length, 9);
eq('id quà duy nhất', new Set(r.R112_GIFTS.map(g => g.id)).size, 9);
ok('mỗi quà có tên tiếng Việt', r.R112_GIFTS.every(g => typeof g.name === 'string' && g.name.length >= 2));
ok('mỗi quà có desc', r.R112_GIFTS.every(g => typeof g.desc === 'string' && g.desc.length >= 2));
ok('r112GiftById tìm đúng', r.r112GiftById('trau-cau').name === 'Trầu cau');
eq('r112GiftById lạ → null', r.r112GiftById('khong-co'), null);

// --- B. 9 NPC mỗi người 1 món yêu thích: đủ 9, quà có thật, món khác nhau, có gợi ý ---
eq('đủ 9 NPC có món yêu thích', Object.keys(r.R112_FAV).length, 9);
ok('đủ seq 0–8', SEQS.every(s => r.R112_FAV[s] !== undefined));
ok('món yêu thích đều có trong danh mục', SEQS.every(s => r.r112GiftById(r.R112_FAV[s].gift) !== null));
eq('9 món yêu thích khác nhau (mỗi NPC 1 món riêng)',
  new Set(SEQS.map(s => r.R112_FAV[s].gift)).size, 9);
ok('mỗi NPC có câu gợi ý đúng giọng', SEQS.every(s =>
  typeof r.R112_FAV[s].hint === 'string' && r.R112_FAV[s].hint.length >= 10));
ok('câu đáp đúng món đủ 9', SEQS.every(s => typeof r.R112_RESP_OK[s] === 'string' && r.R112_RESP_OK[s].length >= 5));
ok('câu xã giao đủ 9', SEQS.every(s => typeof r.R112_RESP_POLITE[s] === 'string' && r.R112_RESP_POLITE[s].length >= 2));
ok('thoại mốc 3+6 đủ 9 NPC', SEQS.every(s =>
  r.R112_MILESTONE_LINES[s] && typeof r.R112_MILESTONE_LINES[s][3] === 'string' &&
  typeof r.R112_MILESTONE_LINES[s][6] === 'string' &&
  r.R112_MILESTONE_LINES[s][3].length >= 10 && r.R112_MILESTONE_LINES[s][6].length >= 10));

// --- C. Tặng ĐÚNG món cho 9/9 NPC → thân thiết +1 ---
let allCorrect = true;
for (const s of SEQS) {
  const res = r.r112Give({}, s, r.R112_FAV[s].gift);
  if (!res.correct || res.aff[s] !== 1) { allCorrect = false; console.error(`FAIL tặng đúng seq=${s}`); }
}
ok('tặng đúng món: 9/9 NPC đều +1 thân thiết', allCorrect);
eq('tặng đúng: unlocked = 0 khi từ 0→1', r.r112Give({}, 0, 'trau-cau').unlocked, 0);

// --- D. Tặng SAI món → không tăng thân thiết, chỉ xã giao ---
let allWrong = true;
for (const s of SEQS) {
  const wrongId = r.R112_GIFTS.find(g => g.id !== r.R112_FAV[s].gift).id; // món của người khác
  const before = { 0: 2, 1: 5, 2: 0, 3: 3, 4: 1, 5: 6, 6: 0, 7: 4, 8: 2 };
  const res = r.r112Give(before, s, wrongId);
  if (res.correct || JSON.stringify(res.aff) !== JSON.stringify(before)) {
    allWrong = false; console.error(`FAIL tặng sai seq=${s}`);
  }
}
ok('tặng sai món: 9/9 NPC đều KHÔNG tăng thân thiết', allWrong);
eq('tặng sai: unlocked luôn 0', r.r112Give({ 0: 5 }, 0, 'keo-dua').unlocked, 0);
eq('tặng cho seq lạ (99) → correct false', r.r112Give({}, 99, 'trau-cau').correct, false);
eq('tặng quà id lạ → correct false', r.r112Give({}, 0, 'khong-co').correct, false);
ok('r112Give không sửa object gốc (pure)', (() => { const a = { 0: 1 }; r.r112Give(a, 0, 'trau-cau'); return a[0] === 1; })());
ok('tặng đúng nhiều lần cộng dồn', (() => {
  let a = {}; for (let i = 0; i < 6; i++) a = r.r112Give(a, 2, 'che-xanh').aff;
  return r.r112AffGet(a, 2) === 6;
})());

// --- E. Mốc thân thiết: vượt 3 → unlocked 3, vượt 6 → unlocked 6 ---
eq('2→3: mở mốc 3', r.r112Give({ 4: 2 }, 4, 'thuoc-lao').unlocked, 3);
eq('5→6: mở mốc 6', r.r112Give({ 5: 5 }, 5, 'ruou-nep').unlocked, 6);
eq('0→1: chưa mở mốc', r.r112Give({}, 6, 'banh-da').unlocked, 0);
eq('3→4: không mở lại mốc 3', r.r112Give({ 7: 3 }, 7, 'mam-tep').unlocked, 0);
eq('6→7: không mở lại mốc 6', r.r112Give({ 8: 6 }, 8, 'xoi-nep').unlocked, 0);
eq('R112_MILESTONES = [3,6]', r.R112_MILESTONES, [3, 6]);

// --- F. Thoại mốc theo thân thiết: <3 rỗng, 3–5 có mốc 3, ≥6 có cả 2 ---
eq('aff 0 → chưa mở thoại', r.r112MilestoneLines(0, 0), []);
eq('aff 2 → chưa mở thoại', r.r112MilestoneLines(0, 2), []);
eq('aff 3 → mở đúng thoại mốc 3', r.r112MilestoneLines(0, 3), [r.R112_MILESTONE_LINES[0][3]]);
eq('aff 5 → vẫn chỉ mốc 3', r.r112MilestoneLines(1, 5), [r.R112_MILESTONE_LINES[1][3]]);
eq('aff 6 → mở cả 2 thoại', r.r112MilestoneLines(2, 6),
  [r.R112_MILESTONE_LINES[2][3], r.R112_MILESTONE_LINES[2][6]]);
eq('aff 9 → vẫn 2 thoại', r.r112MilestoneLines(3, 9).length, 2);
eq('seq lạ → []', r.r112MilestoneLines(99, 10), []);
ok('9/9 NPC: thoại mốc mở đúng ở aff 6', SEQS.every(s => r.r112MilestoneLines(s, 6).length === 2));

// --- G. r112AffGet + r112Migrate ---
eq('aff thiếu → 0', r.r112AffGet(null, 0), 0);
eq('aff {} → 0', r.r112AffGet({}, 1), 0);
eq('aff có giá trị → giá trị', r.r112AffGet({ 2: 4 }, 2), 4);
eq('aff giá trị rác → 0', r.r112AffGet({ 3: 'nhiều' }, 3), 0);
eq('aff âm → 0', r.r112AffGet({ 4: -1 }, 4), 0);
eq('migrate null → {}', r.r112Migrate(null), {});
eq('migrate rác → {}', r.r112Migrate('rác'), {});
const mg = r.r112Migrate({ 0: 3, 1: 'x', 2: -1, 5: 6, 9: 10, 99: 1 });
eq('migrate giữ seq hợp lệ', mg, { 0: 3, 5: 6 });
ok('migrate lọc seq lạ (9/99) và giá trị rác', mg[9] === undefined && mg[99] === undefined);

// --- H. Đấu nối (đọc code, không cần browser) ---
ok('npcLines() thêm thoại mốc theo thân thiết', src.includes('r112MilestoneLines(n.seq, r112AffGet(S.aff, n.seq))'));
ok('npcLines() copy lines gốc (không sửa NAMED)', src.includes('.lines.slice()'));
ok('openDialog hiện nút Tặng quà cho NPC có tên', /btnGift\.style\.display = NAMED\[n\.seq\] \? 'block' : 'none'/.test(src));
ok('closeDialog ẩn nút + đóng menu quà', src.includes("btnGift.style.display = 'none'; closeGiftMenu();"));
ok('openShop hiện nút Tặng quà cho Bà Tám Xén', src.includes("btnGiftShop.style.display = 'block';"));
ok('closeShop ẩn nút + đóng menu quà', src.includes("btnGiftShop.style.display = 'none'; closeGiftMenu();"));
ok('menu quà dựng động (không chạm index.html)', src.includes("r112Menu.id = 'gift-menu'"));
ok('menu quà hiện gợi ý món yêu thích', src.includes('R112_FAV[seq].hint'));
ok('menu quà đủ 9 nút (duyệt R112_GIFTS)', src.includes('for (const g of R112_GIFTS)'));
ok('nút quà ≥48px (mobile-first)', src.includes('min-height:48px'));
ok('tặng đúng nổ tim hồng (juice có sẵn)', src.includes('fxHooks.burst(n.x, 2.0, n.z, 0xff6b9d'));
ok('tặng đúng toast ❤️ +1 thân thiết', src.includes("rất thích ${gname}! (thân thiết +1)"));
ok('mở mốc toast 💗', src.includes('Mốc thân thiết ${res.unlocked}'));
ok('tặng sai toast xã giao, không +thân thiết', src.includes('R112_RESP_POLITE[seq]}"'));
ok('câu đáp hiện ngay trong hộp thoại', src.includes("document.getElementById('dlg-text').textContent = line;"));
ok('lưu save ngay sau khi tặng', /S\.aff = res\.aff;[\s\S]{0,80}saveGame\(\);/.test(src));
ok('S.aff được migrate lúc khởi tạo (pattern như p1InitQ2)', src.includes('S.aff = r112Migrate(raw);'));
ok('saveGame lưu nguyên S (giữ field aff)',
  /JSON\.stringify\(S\)/.test(readFileSync(new URL('../js/core.js', import.meta.url), 'utf-8')));

console.log(`R112 gifts: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
