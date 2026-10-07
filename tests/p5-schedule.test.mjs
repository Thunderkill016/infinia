// Test P5: NPC có lịch sinh hoạt theo giờ ngày/đêm (học Stardew Valley)
// Trích block [P5-TESTABLE-*] từ js/actors.js rồi eval (cùng quy ước như P1/R112/F4).
// Chạy: node tests/p5-schedule.test.mjs  (exit 0 = pass)
//
// L1 (thế nào là xong):
//  - 9 NPC có tên mỗi người có đủ 2 vị trí: nhà (NAMED[seq].home) + chỗ làm (P5_SPOTS)
//  - Đổi ca đúng giờ: 6h–18h → 'work', 18h–6h → 'home' (DN.t=0 bình minh≈6h, 0.5 hoàng hôn≈18h)
//  - Không teleport khi gần: bước đi mỗi nhịp ≤ speed*dt; chỉ >60m mới đi nhanh ×3
//  - NPC vô danh (seq không trong P5_SPOTS) không bị ảnh hưởng; Bà Tám Xén (shop) đứng yên
//  - Tích hợp: updateNPCs tính lại điểm đến theo DN.t mỗi nhịp (tương thích F4 10Hz)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/actors.js', import.meta.url), 'utf-8');
const cfg = readFileSync(new URL('../js/config.js', import.meta.url), 'utf-8');
const m = src.match(/\/\/ \[P5-TESTABLE-START\]([\s\S]*?)\/\/ \[P5-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [P5-TESTABLE-*] trong js/actors.js'); process.exit(1); }

// Block viết cho ES module (dùng `export`) → lột `export ` ở đầu dòng để eval được trong vm thường
const code = m[1].replace(/^export\s+/gm, '');
const sandbox = {};
runInNewContext(
  code + '\n;globalThis.__p5 = { P5_MORNING_HOUR, P5_EVENING_HOUR, P5_LOITER_R, ' +
  'P5_FAST_DIST, P5_FAST_K, P5_SPOTS, p5HourOfDay, p5ShiftAt, p5DestFor, p5NeedsFast, p5StepDist };',
  sandbox);
const p5 = sandbox.__p5;

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error(`FAIL ${name}`); }
}
function eq(name, got, want) { ok(`${name} (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`, JSON.stringify(got) === JSON.stringify(want)); }

// --- A. Hằng số đúng spec ---
ok('P5_MORNING_HOUR = 6 (sáng ra chỗ làm)', p5.P5_MORNING_HOUR === 6);
ok('P5_EVENING_HOUR = 18 (tối về nhà)', p5.P5_EVENING_HOUR === 18);
ok('P5_FAST_DIST = 60 (mét)', p5.P5_FAST_DIST === 60);
ok('P5_FAST_K = 3 (đi nhanh gấp 3)', p5.P5_FAST_K === 3);
ok('P5_LOITER_R = 4 (mét)', p5.P5_LOITER_R === 4);

// --- B. p5HourOfDay: DN.t → giờ trong ngày (t=0 bình minh≈6h, 0.25 trưa, 0.5 hoàng hôn≈18h, 0.75 nửa đêm) ---
eq('t=0 (bình minh) → 6h', p5.p5HourOfDay(0), 6);
eq('t=0.25 (trưa) → 12h', p5.p5HourOfDay(0.25), 12);
eq('t=0.5 (hoàng hôn) → 18h', p5.p5HourOfDay(0.5), 18);
eq('t=0.75 (nửa đêm) → 0h', p5.p5HourOfDay(0.75), 0);
ok('t=0.30 (giờ vào game mặc định) → ~13.2h ban ngày', Math.abs(p5.p5HourOfDay(0.30) - 13.2) < 1e-9);

// --- C. p5ShiftAt: đổi ca đúng 6h/18h ---
eq('6h → work (bắt đầu ca sáng)', p5.p5ShiftAt(6), 'work');
eq('12h → work', p5.p5ShiftAt(12), 'work');
eq('17.99h → work (sát giờ đổi ca)', p5.p5ShiftAt(17.99), 'work');
eq('18h → home (bắt đầu ca tối)', p5.p5ShiftAt(18), 'home');
eq('0h → home', p5.p5ShiftAt(0), 'home');
eq('5.99h → home (sát giờ đổi ca)', p5.p5ShiftAt(5.99), 'home');

// --- D. 9 NPC có tên đều có đủ 2 vị trí (nhà từ NAMED + chỗ làm từ P5_SPOTS) ---
const spotKeys = Object.keys(p5.P5_SPOTS).map(Number).sort((a, b) => a - b);
eq('P5_SPOTS có đủ 9 NPC (seq 0–8)', spotKeys, [0, 1, 2, 3, 4, 5, 6, 7, 8]);
for (const seq of spotKeys) {
  const s = p5.P5_SPOTS[seq];
  ok(`seq ${seq}: có work [x,z] + tên chỗ làm`, Array.isArray(s.work) && s.work.length === 2 &&
    typeof s.work[0] === 'number' && typeof s.place === 'string' && s.place.length > 0);
}
// Nhà của 9 NPC có trong config.js (NAMED[seq].home) — P5 lấy nhà từ đó, không hardcode lại
const namedHomes = [...cfg.matchAll(/^\s*(\d+):\s*\{[^}]*?home:\s*\[([^\]]+)\]/gm)]
  .map(x => [+x[1], x[2]]);
eq('config.js NAMED có đủ 9 NPC có home', namedHomes.map(x => x[0]).sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7, 8]);
// Bà Tám Xén (seq 3): nhà == hàng xén → 2 vị trí trùng nhau, đứng yên (giữ hành vi shop)
eq('Bà Tám Xén (seq 3): work trùng home [14,8]', p5.P5_SPOTS[3].work, [14, 8]);

// --- E. p5DestFor: điểm đến theo ca ---
const home0 = [6, 12]; // nhà Bà Lụa theo NAMED
eq('Bà Lụa ban ngày (t=0.3≈13h) → chỗ làm giếng làng [0,0]', p5.p5DestFor(0, home0, 0.3), [0, 0]);
eq('Bà Lụa ban đêm (t=0.8≈1h) → về nhà [6,12]', p5.p5DestFor(0, home0, 0.8), [6, 12]);
eq('Anh Hai Ruộng ban ngày → ruộng lúa [-44,-8]', p5.p5DestFor(8, [-18, -2], 0.3), [-44, -8]);
eq('Chú Tư Lưới ban ngày → bến Phúc [44,51]', p5.p5DestFor(7, [38, 33], 0.3), [44, 51]);
eq('Cô Lan Thảo ban đêm → về nhà [-8,6]', p5.p5DestFor(6, [-8, 6], 0.8), [-8, 6]);

// --- F. NPC vô danh không bị ảnh hưởng ---
ok('NPC vô danh (seq 9) → p5DestFor null', p5.p5DestFor(9, [0, 0], 0.3) === null);
ok('NPC vô danh (seq 24) → p5DestFor null', p5.p5DestFor(24, [0, 0], 0.8) === null);

// --- G. Không teleport: đi bộ thường khi gần, chỉ đi nhanh khi >60m ---
ok('cách 10m → không cần đi nhanh', p5.p5NeedsFast(10) === false);
ok('cách 59m → không cần đi nhanh', p5.p5NeedsFast(59) === false);
ok('cách 61m → đi nhanh', p5.p5NeedsFast(61) === true);
eq('gần (còn 5m, speed 2, dt 1s) → bước 2m, không nhảy cóc', p5.p5StepDist(5, 2, 1), 2);
eq('sắp tới (còn 1m) → bước đúng 1m, không nhảy quá', p5.p5StepDist(1, 2, 1), 1);
eq('quá xa (70m) → đi nhanh ×3 (6m/s), vẫn không teleport', p5.p5StepDist(70, 2, 1), 6);
// Mô phỏng đi bộ 10m: không bước nào vượt quá speed*dt (không nhảy cóc), cuối cùng tới nơi
{
  let x = 0; const speed = 2, dt = 1 / 60; let jumped = false, i = 0;
  for (; i < 2000; i++) {
    const d = 10 - x;
    if (d < 0.6) break;
    const step = p5.p5StepDist(d, speed, dt);
    if (d <= 60 && step > speed * dt * 1.0001) jumped = true;
    x += step;
  }
  ok('mô phỏng đi bộ 10m: không bước nào nhảy cóc', !jumped);
  ok('mô phỏng đi bộ 10m: tới nơi (<0.6m)', Math.abs(x - 10) < 0.6);
}

// --- H. Tích hợp vào updateNPCs (kiểm tra tĩnh trên code thật) ---
ok('updateNPCs tính lại điểm đến theo DN.t mỗi nhịp AI',
  /export function updateNPCs[\s\S]*?p5DestFor\(n\.seq, NAMED\[n\.seq\]\.home, DN\.t\)/.test(src));
ok('đổi ca → gán tx/tz mới + state walk (đi bộ, không teleport)',
  /n\.tx = dest\[0\]; n\.tz = dest\[1\];\s*\n\s*n\.state = 'walk';/.test(src));
ok('updateNPCs gọi p5PickTarget khi NPC hết timer idle',
  /p5PickTarget\(n\)/.test(src));
ok('nhánh walk dùng p5StepDist cho NPC theo lịch',
  /const step = n\._p5 \? p5StepDist\(d, n\.speed, dt\) : Math\.min\(d, n\.speed \* dt\);/.test(src));
ok('8 NPC có tên (trừ Bà Tám seq 3) được gán _p5',
  /for \(const seq of Object\.keys\(NAMED\)\) \{\s*\n\s*if \(\+seq === 3\) continue;[\s\S]*?npcs\[\+seq\]\._p5 = true;/.test(src));
ok('Bà Tám Xén vẫn giữ state shop (không bị lịch P5 lôi đi)',
  /npcs\[3\]\.isShop = true;\s*\n\s*npcs\[3\]\.state = 'shop';/.test(src));
ok('NPC vô danh không có _p5 → nhánh walk giữ Math.min cũ',
  /: Math\.min\(d, n\.speed \* dt\);/.test(src));
// F4 vẫn còn nguyên trước P5 (NPC xa update 10Hz, đổi ca vẫn đúng vì tính lại mỗi nhịp)
ok('F4 throttle vẫn chạy trước logic P5 trong updateNPCs',
  /export function updateNPCs[\s\S]*?if \(f4ShouldSkip\(distP, n\._aiHz\)\) continue;[\s\S]*?\/\/ P5:/.test(src));
ok('p5PickTarget: NPC có tên loanh quanh trong P5_LOITER_R quanh điểm đến',
  /export function p5PickTarget\(n\)[\s\S]*?P5_LOITER_R - 1\)/.test(src));
ok('p5PickTarget: NPC vô danh gọi npcPickTarget cũ',
  /export function p5PickTarget\(n\)[\s\S]*?npcPickTarget\(n\); \/\/ NPC vô danh: hành vi cũ/.test(src));

console.log(`P5: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
