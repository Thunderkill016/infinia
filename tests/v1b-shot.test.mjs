// Test V1b: góc camera tool ?shot= — dọn cây chắn đoạn camera→player (hành lang V1B_CLEAR_R)
// Chạy: node tests/v1b-shot.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../app.js', import.meta.url), 'utf-8');

// 1) Đoạn testable V1b (hàm thuần, không dùng THREE/browser)
const m = src.match(/\/\/ \[V1b-TESTABLE-START\]([\s\S]*?)\/\/ \[V1b-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [V1b-TESTABLE-*] trong app.js'); process.exit(1); }
const sandbox = {};
runInNewContext(
  m[1].slice(m[1].indexOf('\n') + 1) + '\n;globalThis.__v1b = { V1B_CLEAR_R, segDist2, shotBlocksView };',
  sandbox);
const { V1B_CLEAR_R, segDist2, shotBlocksView } = sandbox.__v1b;

let pass = 0, fail = 0;
function eq(name, got, want) {
  if (got === want) { pass++; }
  else { fail++; console.error(`FAIL ${name}: got ${got}, want ${want}`); }
}
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error(`FAIL ${name}`); }
}

// --- A. Hằng số hành lang dọn cây = 6m ---
eq('V1B_CLEAR_R = 6', V1B_CLEAR_R, 6);

// --- B. segDist2: bình phương khoảng cách điểm→đoạn thẳng ---
eq('điểm trên đoạn → 0', segDist2(5, 0, 0, 0, 10, 0), 0);
eq('vuông góc 3m → 9', segDist2(5, 3, 0, 0, 10, 0), 9);
eq('vượt quá đầu A → khoảng cách tới A (16)', segDist2(-4, 0, 0, 0, 10, 0), 16);
eq('vượt quá đầu B → khoảng cách tới B (9)', segDist2(13, 0, 0, 0, 10, 0), 9);
eq('chéo (1,1) tới đoạn (0,0)-(2,0) → 1', segDist2(1, 1, 0, 0, 2, 0), 1);

// --- C. shotBlocksView: cây chắn / không chắn tầm nhìn camera→player ---
ok('cây ngay giữa camera-player → chắn', shotBlocksView(5, 0, 0, 0, 10, 0, 6));
ok('cây lệch 3m (< 6) → chắn', shotBlocksView(5, 3, 0, 0, 10, 0, 6));
ok('cây lệch 10m (> 6) → không chắn', !shotBlocksView(5, 10, 0, 0, 10, 0, 6));
ok('cây sau lưng camera 10m → không chắn', !shotBlocksView(-10, 0, 0, 0, 10, 0, 6));
ok('cây ngay sau lưng player 3m, r=2 → không chắn (ngoài đoạn)', !shotBlocksView(13, 0, 0, 0, 10, 0, 2));
ok('ranh giới: lệch đúng 6m với r=6 → không chắn (<, không <=)', !shotBlocksView(5, 6, 0, 0, 10, 0, 6));

// --- D. Hook ?shot= có gọi dọn hành lang, không đụng gameplay ---
const i = src.indexOf("indexOf('shot=')");
ok('có hook ?shot= trong app.js', i >= 0);
const hookSrc = src.slice(i, src.indexOf('applyQuality', i));
ok('hook gọi shotBlocksView để dọn cây', hookSrc.indexOf('shotBlocksView') >= 0);
ok('hook gọi refreshTreeLOD sau khi dọn', hookSrc.indexOf('refreshTreeLOD') >= 0);
ok('hook không đổi vị trí spawn mặc định (giữ gameplay)', hookSrc.indexOf('P.x = 9; P.z = 14') >= 0);
ok('combat: quái bất tử trong phiên chụp (luôn thấy quái lúc SHOT_READY)', hookSrc.indexOf('m.hp = 9999') >= 0);
ok('combat: ghim quái đứng yên bên cạnh player (shotPin)', hookSrc.indexOf('shotPin') >= 0);
ok('combat: ghim vệt chém hiện tĩnh trước khi chụp (không phụ thuộc may rủi)', hookSrc.indexOf('atkArcG.visible = true') >= 0);
ok('comment ghi rõ CHỈ chạy trong ?shot=', /CHỈ chạy trong \?shot=/.test(hookSrc));

console.log(`v1b-shot: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
