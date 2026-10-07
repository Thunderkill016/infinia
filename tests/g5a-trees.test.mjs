// Test logic G5a: cây GLB Kenney CC0 — parser GLB tối giản + bảng model (thuần logic)
// Chạy: node tests/g5a-trees.test.mjs  (exit 0 = pass)
import { readFileSync, existsSync, statSync } from 'fs';
import { runInNewContext } from 'vm';
import { TextDecoder } from 'util';

const src = readFileSync(new URL('../js/world.js', import.meta.url), 'utf-8');
const m = src.match(/\/\/ \[G5A-TESTABLE-START\]([\s\S]*?)\/\/ \[G5A-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [G5A-TESTABLE-*] trong js/world.js'); process.exit(1); }

const sandbox = { TextDecoder }; // TextDecoder không có sẵn trong vm trần -> inject
runInNewContext(
  m[1].slice(m[1].indexOf('\n') + 1) +
  '\n;globalThis.__g5a = { G5A_TREE_MODELS, g5aModelsForType, g5aPickModel, g5aB64ToBytes, g5aParseGLB };',
  sandbox);
const { G5A_TREE_MODELS, g5aModelsForType, g5aPickModel, g5aB64ToBytes, g5aParseGLB } = sandbox.__g5a;

let pass = 0, fail = 0;
function eq(name, got, want) {
  if (got === want) { pass++; }
  else { fail++; console.error(`FAIL ${name}: got ${got}, want ${want}`); }
}
function ok(name, cond) { eq(name, !!cond, true); }

// 1. Bảng model: 6 model, type 0/1/3 có model, type 2 (tre) giữ procedural
eq('6 model GLB', G5A_TREE_MODELS.length, 6);
eq('type 0 (thường) có 4 biến thể', g5aModelsForType(0).length, 4);
eq('type 1 (đa) có 1 model', g5aModelsForType(1).length, 1);
eq('type 2 (tre) không có model GLB', g5aModelsForType(2).length, 0);
eq('type 3 (cau) có 1 model', g5aModelsForType(3).length, 1);
ok('mọi key kết thúc .glb', G5A_TREE_MODELS.every(x => x.key.endsWith('.glb')));
ok('key không trùng', new Set(G5A_TREE_MODELS.map(x => x.key)).size === 6);
ok('scale dương hợp lý (1..4)', G5A_TREE_MODELS.every(x => x.sxz >= 1 && x.sxz <= 4 && x.sy >= 1 && x.sy <= 4));

// 2. g5aPickModel: deterministic, tre -> -1, type lạ -> -1
eq('tre -> -1 (procedural)', g5aPickModel(2, 0.5), -1);
eq('type lạ -> -1', g5aPickModel(9, 0.5), -1);
eq('type 1 luôn model đa', g5aPickModel(1, 0.0), g5aPickModel(1, 0.99));
eq('type 3 luôn model cau', g5aPickModel(3, 0.0), g5aPickModel(3, 0.99));
ok('deterministic theo hash', g5aPickModel(0, 0.123456) === g5aPickModel(0, 0.123456));
ok('hash khác có thể ra model khác (đa dạng)', new Set([0.05, 0.3, 0.55, 0.8].map(h => g5aPickModel(0, h))).size > 1);
ok('mọi kết quả nằm trong bảng', [0, 1, 3].every(t =>
  [0, 0.25, 0.5, 0.75, 0.999].every(h => { const i = g5aPickModel(t, h); return i >= 0 && i < 6 && G5A_TREE_MODELS[i].type === t; })));

// 3. g5aB64ToBytes: vector chuẩn
eq('base64 "TWFu" -> Man', Buffer.from(g5aB64ToBytes('TWFu')).toString(), 'Man');
eq('base64 có padding', Buffer.from(g5aB64ToBytes('TWE=')).toString(), 'Ma');
eq('rỗng -> rỗng', g5aB64ToBytes('').length, 0);

// 4. Parse model THẬT từ assets-embedded.js
const embSrc = readFileSync(new URL('../assets-embedded.js', import.meta.url), 'utf-8');
const emb = {};
runInNewContext(embSrc + '\n;globalThis.__M = INFINIA_MODELS;', emb);
const MODELS = emb.__M;
eq('đủ 6 model embedded', Object.keys(MODELS).length, 6);
for (const def of G5A_TREE_MODELS)
  ok(`embedded có ${def.key}`, typeof MODELS[def.key] === 'string' && MODELS[def.key].startsWith('data:model/gltf-binary;base64,'));

const stats = [];
for (const def of G5A_TREE_MODELS) {
  const b64 = MODELS[def.key].slice(MODELS[def.key].indexOf(',') + 1);
  const bytes = g5aB64ToBytes(b64);
  ok(`${def.key}: base64 giải mã được`, bytes.length > 1000);
  const g = g5aParseGLB(bytes);
  ok(`${def.key}: có vertex`, g.vertCount > 50);
  ok(`${def.key}: có tam giác`, g.triCount > 50);
  eq(`${def.key}: position.length = 3*vert`, g.positions.length, g.vertCount * 3);
  eq(`${def.key}: indices.length = 3*tri`, g.indices.length, g.triCount * 3);
  let cMin = 2, cMax = -1, yMin = 1e9;
  for (let i = 0; i < g.colors.length; i++) { if (g.colors[i] < cMin) cMin = g.colors[i]; if (g.colors[i] > cMax) cMax = g.colors[i]; }
  for (let i = 1; i < g.positions.length; i += 3) if (g.positions[i] < yMin) yMin = g.positions[i];
  ok(`${def.key}: màu vertex trong [0,1]`, cMin >= 0 && cMax <= 1);
  ok(`${def.key}: gốc cây ở y≈0 (không lơ lửng/chìm)`, yMin > -0.05 && yMin < 0.05);
  let idxMax = 0;
  for (let i = 0; i < g.indices.length; i++) if (g.indices[i] > idxMax) idxMax = g.indices[i];
  ok(`${def.key}: index < vertCount`, idxMax < g.vertCount);
  stats.push(`${def.key}: ${g.vertCount}v/${g.triCount}t`);
}
console.log('  model stats: ' + stats.join(' | '));

// 5. Parser từ chối input hỏng
function throws(name, fn) {
  try { fn(); fail++; console.error(`FAIL ${name}: không ném lỗi`); }
  catch (e) { pass++; }
}
throws('rỗng -> lỗi', () => g5aParseGLB(new Uint8Array(0)));
throws('sai magic -> lỗi', () => g5aParseGLB(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20])));
throws('cụt chunk -> lỗi', () => {
  const b64 = MODELS['tree-thuong-a.glb'].slice(MODELS['tree-thuong-a.glb'].indexOf(',') + 1);
  g5aParseGLB(g5aB64ToBytes(b64).slice(0, 100));
});

// 6. Ngân sách portal B1: embedded < 512KB; + standalone hiện tại < 2MB
const embBytes = statSync(new URL('../assets-embedded.js', import.meta.url)).size;
ok(`assets-embedded.js ${embBytes} bytes < 512KB`, embBytes < 512 * 1024);
const standalone = new URL('../standalone/index.html', import.meta.url);
if (existsSync(standalone)) {
  const total = statSync(standalone).size + embBytes;
  ok(`tổng standalone + models ${total} bytes < 2MB`, total < 2 * 1024 * 1024);
} else {
  console.log('  (chưa có bản build standalone — bỏ qua check tổng 2MB)');
}

// 7. Tích hợp trong world.js: GLB branch + đường lui procedural còn nguyên
ok('có g5aBuildMeshes', src.includes('function g5aBuildMeshes()'));
ok('có writeTreeGLB', src.includes('function writeTreeGLB(gm, idx, t)'));
ok('refreshTreeLOD có nhánh GLB', src.includes('g5aReady && t.lod === 0 && t.g5amodel'));
ok('tre vẫn procedural ở L0 (đường lui)', src.includes("} else if (t.lod === 0) { // gần: full"));
ok('gán g5amodel khi đặt cây', src.includes('g5amodel'));
ok('mesh GLB đổ bóng + không cull nhầm', src.includes('mesh.castShadow = true; mesh.frustumCulled = false;'));
ok('material dùng vertexColors', src.includes('vertexColors: true'));

console.log(`g5a-trees: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
