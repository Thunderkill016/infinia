// Test T1: tối ưu tốc độ — đo load time thật + FPS sustained, F1/F2/F3, fix V4 (FPS "--")
// Chạy: node tests/t1-perf.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../app.js', import.meta.url), 'utf-8');
const m = src.match(/\/\/ \[T1-TESTABLE-START\]([\s\S]*?)\/\/ \[T1-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [T1-TESTABLE-*] trong app.js'); process.exit(1); }

const sandbox = {};
runInNewContext(
  m[1].slice(m[1].indexOf('\n') + 1) +
  '\n;globalThis.__t1 = { T1_LOAD_BUDGET_MS, T1_FPS_WINDOW_S, T1_SHADOW_HALF, T1_LABEL_W, T1_LABEL_H,' +
  ' ffGlowCount, measureLoadMs, fmtFps, sustainedFps, labelDrawSpec };',
  sandbox);
const { T1_LOAD_BUDGET_MS, T1_FPS_WINDOW_S, T1_SHADOW_HALF, T1_LABEL_W, T1_LABEL_H,
        ffGlowCount, measureLoadMs, fmtFps, sustainedFps, labelDrawSpec } = sandbox.__t1;

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
eq('mục tiêu load <10s', T1_LOAD_BUDGET_MS, 10000);
eq('cửa sổ FPS 5s', T1_FPS_WINDOW_S, 5);
eq('F1: shadow ±40', T1_SHADOW_HALF, 40);
eq('F2: label w 128', T1_LABEL_W, 128);
eq('F2: label h 32', T1_LABEL_H, 32);
eq('F2: tỉ lệ 4:1 giữ nguyên', T1_LABEL_W / T1_LABEL_H, 4);

// 2. F3: glow đom đóm theo preset
eq('F3: preset Vừa → 4 glow', ffGlowCount('med'), 4);
eq('F3: preset Cao → 8 glow', ffGlowCount('high'), 8);
eq('F3: preset Thấp → 8 glow', ffGlowCount('low'), 8);
eq('F3: preset lạ → 8 glow', ffGlowCount('xxx'), 8);

// 3. đo load time thật
eq('load 1346ms', measureLoadMs(1000, 2346), 1346);
eq('load làm tròn', measureLoadMs(1000, 2345.6), 1346);
eq('load không âm', measureLoadMs(5000, 1000), 0);
eq('load 0 khi cùng mốc', measureLoadMs(1234, 1234), 0);

// 4. V4: fmtFps không bao giờ "--"
eq('fps 59.6 → 60', fmtFps(59.6), 'fps: 60');
eq('fps 0 → hiện số', fmtFps(0), 'fps: 0');
eq('fps NaN → fps: 0', fmtFps(NaN), 'fps: 0');
eq('fps Infinity → fps: 0', fmtFps(Infinity), 'fps: 0');
ok('fmtFps không chứa --', !/--/.test(fmtFps(60)));

// 5. FPS sustained (trung bình 5s lăn)
near('300 frame 1/60s → ~60fps', sustainedFps(new Array(300).fill(1 / 60)), 60, 0.01);
eq('mảng rỗng → 0', sustainedFps([]), 0);
eq('1 frame → 0 (chưa đủ dữ liệu)', sustainedFps([1 / 60]), 0);
near('10 frame 0.5s → 2fps', sustainedFps(new Array(10).fill(0.5)), 2, 1e-9);
near('cửa sổ cắt 5s: 600 frame → ~60', sustainedFps(new Array(600).fill(1 / 60)), 60, 0.01);
near('ổn định hơn tức thời: frame nhanh/chậm xen kẽ',
  sustainedFps([1 / 120, 1 / 30, 1 / 120, 1 / 30]), 48, 0.01);

// 6. labelDrawSpec (F2): spec vẽ nhãn 128×32
const small = labelDrawSpec('Bà Lụa', () => 50);
eq('tên ngắn: cỡ 15', small.size, 15);
eq('pill [4,3,120,26,13]', JSON.stringify(small.pill), JSON.stringify([4, 3, 120, 26, 13]));
eq('tâm x = 64', small.cx, 64);
eq('tâm y = 17', small.cy, 17);
const longSpec = labelDrawSpec('Tên Rất Dài Của Một NPC Nào Đó', () => 9999);
ok('tên dài: tự thu nhỏ', longSpec.size < 15);
ok('tên dài: không nhỏ hơn 9', longSpec.size >= 9);

// 7. kiểm tra source app.js: F1/F2/V4/?shot= đã đấu nối đúng
ok('shadow camera dùng T1_SHADOW_HALF', /sun\.shadow\.camera\.left = -T1_SHADOW_HALF/.test(src));
ok('shadow camera bám player', /sun\.target\.position\.copy\(player\.position\)/.test(src));
ok('sun.target đã add vào scene', /scene\.add\(sun\.target\)/.test(src));
ok('chimney tắt castShadow', /chimney\.castShadow = false/.test(src));
ok('post1 tắt castShadow', /post1\.castShadow = false/.test(src));
ok('post2 tắt castShadow', /post2\.castShadow = false/.test(src));
ok('makeLabel dùng T1_LABEL_W/H', /c\.width = T1_LABEL_W; c\.height = T1_LABEL_H/.test(src));
ok('drawLabel dùng labelDrawSpec', /labelDrawSpec\(text,/.test(src));
ok('F3: updateGlows giới hạn theo ffGlowCount', /const nFfGlow = ffGlowCount\(Q\.level\)/.test(src));
ok('FPS dùng fmtFps + sustainedFps', /fmtFps\(sustainedFps\(t1Dts\)/.test(src));
ok('log load time ra console', /console\.log\('\[T1\] load time/.test(src));
ok('HUD dbg-load được cập nhật', /getElementById\('dbg-load'\)/.test(src));
ok('?shot= in số đo trước SHOT_READY', /console\.log\('\[T1\] \?shot='/.test(src));

// 8. index.html: panel Debug có ô load
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf-8');
ok('index.html có #dbg-load', html.includes('id="dbg-load"'));

console.log(`t1-perf: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
