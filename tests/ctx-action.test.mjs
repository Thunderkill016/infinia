// Test logic CTX: 1 nút ACTION theo ngữ cảnh (web-first, thay 4 nút Đánh/Nói/Nhặt/Dùng)
// Chạy: node tests/ctx-action.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/utils.js', import.meta.url), 'utf-8');

// 1) Đoạn testable CTX (thuần, không THREE/DOM/import)
const m = src.match(/\/\/ \[CTX-TESTABLE-START\]([\s\S]*?)\/\/ \[CTX-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [CTX-TESTABLE-*] trong js/utils.js'); process.exit(1); }
const sandbox = {};
runInNewContext(
  m[1].slice(m[1].indexOf('\n') + 1) + '\n;globalThis.__ctx = { ctxResolve };',
  sandbox);
const { ctxResolve } = sandbox.__ctx;

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error(`FAIL ${name}`); }
}

// --- A. Thứ tự ưu tiên: Nói > Đánh > Nhặt > Dắt > Giật > Dùng > Câu ---
ok('gần NPC → Nói', ctxResolve({ npc: 1 }).label === 'Nói');
ok('NPC shop → Mua', ctxResolve({ npc: 1, shop: 1 }).label === 'Mua');
ok('NPC + quái → Nói trước (tránh chém nhầm trong làng)', ctxResolve({ npc: 1, enemy: 1 }).kind === 'talk');
ok('quái → Đánh', ctxResolve({ enemy: 1 }).label === 'Đánh');
ok('quái + rau → Đánh trước', ctxResolve({ enemy: 1, veggie: 1 }).kind === 'attack');
ok('rau → Nhặt', ctxResolve({ veggie: 1 }).label === 'Nhặt');
ok('trâu → Dắt', ctxResolve({ lead: 1 }).label === 'Dắt');
ok('cắn câu → Giật!', ctxResolve({ bite: 1 }).label === 'Giật!');
ok('cắn câu + công trình → Giật trước', ctxResolve({ bite: 1, vil: 1 }).kind === 'fish');
ok('công trình → Dùng', ctxResolve({ vil: 1 }).label === 'Dùng');
ok('bờ ao → Câu', ctxResolve({ cast: 1 }).label === 'Câu');
ok('không gì gần → null (ẩn nút)', ctxResolve({}) === null);
ok('trống → null', ctxResolve() === null);

// --- B. Đấu nối runtime (không cycle import) ---
const actors = readFileSync(new URL('../js/actors.js', import.meta.url), 'utf-8');
const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf-8');
const core = readFileSync(new URL('../js/core.js', import.meta.url), 'utf-8');
ok('nút ACTION ≥84px (to nhất mobile)', /btn-action[\s\S]*?min-width:84px/.test(actors));
ok('ctxRun dispatch đủ 6 kind', ['talk', 'attack', 'pick', 'lead', 'fish', 'vil'].every((k) => actors.includes(`kind === '${k}'`)));
ok('đánh qua combatHooks (không import combat)', core.includes('combatHooks') && /combatHooks\.attack\(\)/.test(actors));
ok('main gán đòn thật + tiếng chém', /combatHooks\.attack = \(\) => \{ if \(atkState\.cd <= 0\) playSwing\(\); playerAttack\(\); \};/.test(main));
ok('mobile đè ẩn nút legacy', /document\.getElementById\('btn-attack'\)/.test(actors));
ok('main gom ngữ cảnh mỗi 0.15s', /ctxTick > 0\.15/.test(main) && /updateActionBtn\(ctxResolve\(\{/.test(main));
ok('desktop giữ E/J cũ (không đụng)', /cycleQuality|playerDodge\(\)/.test(main));

console.log(`CTX: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
