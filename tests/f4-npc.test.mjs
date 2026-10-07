// Test logic F4: NPC xa update AI thưa (10Hz thay vì 60Hz)
// Chạy: node tests/f4-npc.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/actors.js', import.meta.url), 'utf-8');

// 1) Đoạn testable F4 (hằng + helper thuần, không dùng THREE/browser)
const m = src.match(/\/\/ \[F4-TESTABLE-START\]([\s\S]*?)\/\/ \[F4-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [F4-TESTABLE-*] trong js/actors.js'); process.exit(1); }
const sandbox = {};
runInNewContext(
  m[1] + '\n;globalThis.__f4 = { F4_FAR_DIST, F4_HZ, F4_INTERVAL, f4ShouldSkip };',
  sandbox);
const { F4_FAR_DIST, F4_HZ, F4_INTERVAL, f4ShouldSkip } = sandbox.__f4;

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error(`FAIL ${name}`); }
}

// --- A. Hằng số đúng spec ---
ok('F4_FAR_DIST = 30 (mét)', F4_FAR_DIST === 30);
ok('F4_HZ = 10 (Hz)', F4_HZ === 10);
ok('F4_INTERVAL = 0.1s (1/10Hz)', Math.abs(F4_INTERVAL - 0.1) < 1e-9);

// --- B. f4ShouldSkip: NPC xa + timer chưa đủ → skip ---
ok('xa (50m) + timer 0.0 → skip=true', f4ShouldSkip(50, 0) === true);
ok('xa (50m) + timer 0.05 → skip=true', f4ShouldSkip(50, 0.05) === true);
ok('xa (31m, vừa qua ngưỡng) + timer 0.05 → skip=true', f4ShouldSkip(31, 0.05) === true);

// --- C. f4ShouldSkip: NPC xa + timer đủ → chạy AI ---
ok('xa (50m) + timer 0.1 → skip=false (đủ interval)', f4ShouldSkip(50, 0.1) === false);
ok('xa (50m) + timer 0.2 → skip=false', f4ShouldSkip(50, 0.2) === false);

// --- D. f4ShouldSkip: NPC gần → không bao giờ skip ---
ok('gần (10m) + timer 0.0 → skip=false (AI mỗi frame)', f4ShouldSkip(10, 0) === false);
ok('gần (29.9m) + timer 0.0 → skip=false', f4ShouldSkip(29.9, 0) === false);
ok('đúng ngưỡng 30m + timer 0.05 → skip=false (<=30 là gần)', f4ShouldSkip(30, 0.05) === false);
ok('ngay cạnh player (0m) → skip=false', f4ShouldSkip(0, 0) === false);

// --- E. updateNPCs có dùng f4ShouldSkip + reset timer (tích hợp vào code thật) ---
ok('updateNPCs gọi f4ShouldSkip',
  /export function updateNPCs[\s\S]*?if \(f4ShouldSkip\(distP, n\._aiHz\)\) continue;/.test(src));
ok('updateNPCs tích lũy n._aiHz += dt khi NPC xa',
  /n\._aiHz = \(n\._aiHz \|\| 0\) \+ dt;/.test(src));
ok('updateNPCs reset timer sau nhịp AI và khi NPC gần',
  /n\._aiHz = 0;/.test(src));
ok('updateNPCAnim vẫn chạy riêng, không bị gộp vào skip F4',
  /export function updateNPCAnim\(dt\)/.test(src));

console.log(`F4: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
