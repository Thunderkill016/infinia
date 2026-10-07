// Test M5: tối ưu hiệu năng mobile — shadow/DPR theo preset + presetBudget khớp QUALITY_LEVELS
// Chạy: python3 tools/gen-test-appjs.py && node tests/m5-perf.test.mjs  (exit 0 = pass)
// Chuẩn: med giữ shadow 1024, high 2048→1536, low 512 giữ; med dpr 2→1.75, high giữ 2,
//   low giữ 1 (chỉ đổi số, KHÔNG đụng logic M1 trong applyQuality); T1_SHADOW_HALF=40
//   và label 128x32 giữ nguyên (khóa T1). Ý (3) tick30/half-dt đã bỏ vì đụng main.js.
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../app.js', import.meta.url), 'utf-8');
const m = src.match(/\/\/ \[M5-TESTABLE-START\]([\s\S]*?)\/\/ \[M5-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [M5-TESTABLE-*] trong app.js'); process.exit(1); }

// Block viết cho ES module (dùng `export`) → lột `export ` ở đầu dòng để eval được trong vm thường
const code = m[1].replace(/^export\s+/gm, '');
const sandbox = {};
runInNewContext(
  code + '\n;globalThis.__m5 = { M5_BUDGET, presetBudget };',
  sandbox);
const { M5_BUDGET, presetBudget } = sandbox.__m5;

let pass = 0, fail = 0;
function eq(name, got, want) {
  if (got === want) { pass++; }
  else { fail++; console.error(`FAIL ${name}: got ${got}, want ${want}`); }
}
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error(`FAIL ${name}`); }
}

// 1. M5_BUDGET khóa số mới
eq('low.shadow = 512 (giữ)', M5_BUDGET.low.shadow, 512);
eq('low.dpr = 1 (giữ)', M5_BUDGET.low.dpr, 1);
eq('low.grass = false', M5_BUDGET.low.grass, false);
eq('med.shadow = 1024 (giữ)', M5_BUDGET.med.shadow, 1024);
eq('med.dpr = 1.75 (2→1.75, nhẹ fill-rate ~25%)', M5_BUDGET.med.dpr, 1.75);
eq('med.grass = true', M5_BUDGET.med.grass, true);
eq('high.shadow = 1536 (2048→1536, đủ mịn nhẹ hơn)', M5_BUDGET.high.shadow, 1536);
eq('high.dpr = 2 (giữ)', M5_BUDGET.high.dpr, 2);
eq('high.grass = true', M5_BUDGET.high.grass, true);

// 2. presetBudget trả đúng {shadow,dpr,grass} theo preset
eq('presetBudget low.shadow', presetBudget('low').shadow, 512);
eq('presetBudget low.dpr', presetBudget('low').dpr, 1);
eq('presetBudget low.grass', presetBudget('low').grass, false);
eq('presetBudget med.shadow', presetBudget('med').shadow, 1024);
eq('presetBudget med.dpr', presetBudget('med').dpr, 1.75);
eq('presetBudget med.grass', presetBudget('med').grass, true);
eq('presetBudget high.shadow', presetBudget('high').shadow, 1536);
eq('presetBudget high.dpr', presetBudget('high').dpr, 2);
eq('presetBudget high.grass', presetBudget('high').grass, true);

// 3. presetBudget: đúng 3 khóa, fallback an toàn, trả bản sao
eq('presetBudget chỉ có 3 khóa shadow/dpr/grass',
  JSON.stringify(Object.keys(presetBudget('med')).sort()), JSON.stringify(['dpr', 'grass', 'shadow']));
eq('preset lạ → Vừa (shadow)', presetBudget('xxx').shadow, 1024);
eq('preset lạ → Vừa (dpr)', presetBudget('xxx').dpr, 1.75);
eq('preset lạ → Vừa (grass)', presetBudget('xxx').grass, true);
eq('preset null → Vừa', presetBudget(null).shadow, 1024);
{
  const a = presetBudget('med');
  a.shadow = 1; // sửa kết quả trả về không được làm bẩn bảng gốc
  eq('trả bản sao (không sửa được bảng gốc)', presetBudget('med').shadow, 1024);
}

// 4. presetBudget khớp QUALITY_LEVELS trong app.js (1 nguồn sự thật)
function parseQuality(level) {
  const re = new RegExp(level + ':\\s*\\{\\s*shadow:\\s*(\\d+),\\s*dpr:\\s*([\\d.]+),\\s*grass:\\s*(true|false)');
  const mm = src.match(re);
  if (!mm) return null;
  return { shadow: Number(mm[1]), dpr: Number(mm[2]), grass: mm[3] === 'true' };
}
for (const lv of ['low', 'med', 'high']) {
  const q = parseQuality(lv), b = presetBudget(lv);
  ok(`QUALITY_LEVELS.${lv} tồn tại trong app.js`, !!q);
  if (q) {
    eq(`khớp ${lv}.shadow`, b.shadow, q.shadow);
    eq(`khớp ${lv}.dpr`, b.dpr, q.dpr);
    eq(`khớp ${lv}.grass`, b.grass, q.grass);
  }
}

// 5. kiểm tra source: số mới đã vào QUALITY_LEVELS, logic M1/T1 không bị đụng
ok('QUALITY_LEVELS med dpr 1.75', /med:\s*\{\s*shadow:\s*1024,\s*dpr:\s*1\.75/.test(src));
ok('QUALITY_LEVELS high shadow 1536', /high:\s*\{\s*shadow:\s*1536,\s*dpr:\s*2/.test(src));
ok('QUALITY_LEVELS low 512/dpr 1 giữ', /low:\s*\{\s*shadow:\s*512,\s*dpr:\s*1/.test(src));
const engSrc = readFileSync(new URL('../js/engine.js', import.meta.url), 'utf-8');
ok('engine.js cỡ shadow khởi tạo khớp preset Cao mới (1536)',
  /sun\.shadow\.mapSize\.set\(1536,\s*1536\)/.test(engSrc));
ok('engine.js không còn shadow 2048 cũ', !/mapSize\.set\(2048,\s*2048\)/.test(engSrc));
const uiSrc = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf-8');
ok('M1: applyQuality vẫn set shadow theo preset (không đụng logic)',
  /sun\.shadow\.mapSize\.set\(q\.shadow,\s*q\.shadow\)/.test(uiSrc));
ok('M1: applyQuality vẫn kẹp dpr theo preset (không đụng logic)',
  /renderer\.setPixelRatio\(Math\.min\(devicePixelRatio \|\| 1, q\.dpr\)\)/.test(uiSrc));
ok('T1: shadow ±40 giữ nguyên (khóa T1)', /T1_SHADOW_HALF = 40/.test(src));
ok('T1: label 128x32 giữ nguyên (khóa T1)', /T1_LABEL_W = 128/.test(src) && /T1_LABEL_H = 32/.test(src));

console.log(`m5-perf: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
