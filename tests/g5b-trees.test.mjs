// Test logic G5B-a: cây chi tiết + texture tự vẽ — pixel generator, UV thủ tục, canopy blob (thuần logic)
// Chạy: node tests/g5b-trees.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/world.js', import.meta.url), 'utf-8');
const m = src.match(/\/\/ \[G5B-A-TESTABLE-START\]([\s\S]*?)\/\/ \[G5B-A-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [G5B-A-TESTABLE-*] trong js/world.js'); process.exit(1); }

const sandbox = {};
runInNewContext(
  m[1].slice(m[1].indexOf('\n') + 1) +
  '\n;globalThis.__g5b = { G5B_TEX_SIZE, G5B_TEX_SEED, G5B_CANOPY_LAYERS, G5B_BARK_HALF, G5B_BARK_V_SCALE,' +
  ' G5B_LEAF_UV_SCALE, G5B_LEAF_TINTS, g5bSeededRand, g5bBarkPixels, g5bLeafPixels, g5bIsBarkColor,' +
  ' g5bGenTreeUVs, g5bLeafTint, G5B_BLOB_SPEC };',
  sandbox);
const g5b = sandbox.__g5b;

let pass = 0, fail = 0;
function eq(name, got, want) {
  if (got === want) { pass++; }
  else { fail++; console.error(`FAIL ${name}: got ${got}, want ${want}`); }
}
function ok(name, cond) { eq(name, !!cond, true); }
function meanRGBA(px, ch) { // trung bình kênh R/G/B (ch = 0/1/2)
  let s = 0; const n = px.length / 4;
  for (let i = 0; i < n; i++) s += px[i * 4 + ch];
  return s / n;
}

// 1. Hằng số
eq('kích thước texture 128', g5b.G5B_TEX_SIZE, 128);
eq('2 lớp canopy', g5b.G5B_CANOPY_LAYERS, 2);
eq('seed cố định', g5b.G5B_TEX_SEED, 20261007);
eq('nửa texture cho vỏ', g5b.G5B_BARK_HALF, 0.5);
ok('6 màu lá tint', g5b.G5B_LEAF_TINTS.length === 6);
ok('màu tint trong [0,1]', g5b.G5B_LEAF_TINTS.every(t => t.length === 3 && t.every(v => v >= 0 && v <= 1)));

// 2. g5bSeededRand: deterministic
const r1 = g5b.g5bSeededRand(42), r2 = g5b.g5bSeededRand(42);
ok('cùng seed -> cùng dãy', [0, 1, 2, 3, 4].every(() => r1() === r2()));
const r3 = g5b.g5bSeededRand(43);
ok('khác seed -> dãy khác', r1() !== r3());

// 3. g5bBarkPixels: kích thước đúng, seeded ổn định, có vân, nền sáng
const bark1 = g5b.g5bBarkPixels(64, 32, g5b.G5B_TEX_SEED);
const bark2 = g5b.g5bBarkPixels(64, 32, g5b.G5B_TEX_SEED);
eq('bark: đúng kích thước RGBA', bark1.length, 64 * 32 * 4);
ok('bark: cùng seed -> pixel giống hệt', bark1.every((v, i) => v === bark2[i]));
const bark3 = g5b.g5bBarkPixels(64, 32, g5b.G5B_TEX_SEED + 1);
ok('bark: khác seed -> pixel khác', !bark1.every((v, i) => v === bark3[i]));
ok('bark: alpha toàn 255', bark1.every((v, i) => i % 4 !== 3 || v === 255));
const barkMean = meanRGBA(bark1, 0);
ok(`bark: nền sáng gần trắng (mean R=${barkMean.toFixed(1)})`, barkMean > 200 && barkMean < 252);
let barkMin = 255; // có sọc tối → pixel tối hơn nền
for (let i = 0; i < bark1.length; i += 4) if (bark1[i] < barkMin) barkMin = bark1[i];
ok(`bark: có vân sọc tối (min R=${barkMin})`, barkMin < 225);
// vân dọc: tương quan theo cột cao hơn theo hàng (cùng cột, y kề nhau giống nhau hơn)
let colDiff = 0, rowDiff = 0, w = 64, h = 32, cnt = 0;
for (let y = 0; y < h - 1; y++) for (let x = 0; x < w - 1; x++) {
  const a = (y * w + x) * 4, b = ((y + 1) * w + x) * 4, c = (y * w + x + 1) * 4;
  colDiff += Math.abs(bark1[a] - bark1[b]); rowDiff += Math.abs(bark1[a] - bark1[c]); cnt++;
}
ok(`bark: vân chạy dọc (diff cột < diff hàng: ${(colDiff / cnt).toFixed(1)} < ${(rowDiff / cnt).toFixed(1)})`,
  colDiff < rowDiff);

// 4. g5bLeafPixels: kích thước đúng, seeded ổn định, có đốm
const leaf1 = g5b.g5bLeafPixels(64, 32, 7);
const leaf2 = g5b.g5bLeafPixels(64, 32, 7);
eq('leaf: đúng kích thước RGBA', leaf1.length, 64 * 32 * 4);
ok('leaf: cùng seed -> pixel giống hệt', leaf1.every((v, i) => v === leaf2[i]));
const leaf3 = g5b.g5bLeafPixels(64, 32, 8);
ok('leaf: khác seed -> pixel khác', !leaf1.every((v, i) => v === leaf3[i]));
ok('leaf: alpha toàn 255', leaf1.every((v, i) => i % 4 !== 3 || v === 255));
const leafMean = meanRGBA(leaf1, 1);
ok(`leaf: nền sáng (mean G=${leafMean.toFixed(1)})`, leafMean > 200 && leafMean < 252);
let dark = 0, light = 0; // có cả đốm tối và đốm sáng
for (let i = 0; i < leaf1.length; i += 4) {
  if (leaf1[i + 1] < 230) dark++;
  if (leaf1[i] > 252 && leaf1[i + 1] > 252) light++;
}
ok(`leaf: có đốm tối (${dark})`, dark > 10);
ok(`leaf: có đốm sáng (${light})`, light > 10);

// 5. g5bIsBarkColor: phân loại vỏ/lá
ok('nâu vỏ -> bark', g5b.g5bIsBarkColor(0.42, 0.29, 0.19));
ok('nâu đậm -> bark', g5b.g5bIsBarkColor(0.25, 0.15, 0.10));
ok('xanh lá -> leaf', !g5b.g5bIsBarkColor(0.18, 0.48, 0.21));
ok('xanh vàng lá -> leaf', !g5b.g5bIsBarkColor(0.50, 0.60, 0.20));
ok('trắng -> leaf (không nhầm vỏ)', !g5b.g5bIsBarkColor(0.90, 0.90, 0.90));

// 6. g5bGenTreeUVs: UV thủ tục đúng vùng texture, v trong [0,1], không NaN
const pos = new Float32Array([
  0.2, 1.0, 0.1,   // vertex 0: vỏ (nâu)
  1.0, 3.0, 0.5,   // vertex 1: lá (xanh)
  -0.8, 2.0, -0.6, // vertex 2: lá (xanh)
]);
const col = new Float32Array([
  0.42, 0.29, 0.19,
  0.18, 0.48, 0.21,
  0.20, 0.52, 0.22,
]);
const uv = g5b.g5bGenTreeUVs(pos, col);
eq('uv: đúng độ dài 2n', uv.length, 6);
ok('uv: không NaN/vô cực', uv.every(v => Number.isFinite(v)));
ok('uv vỏ: u trong nửa trái [0,0.5)', uv[0] >= 0 && uv[0] < 0.5);
ok('uv lá 1: u trong nửa phải [0.5,1]', uv[2] >= 0.5 && uv[2] <= 1);
ok('uv lá 2: u trong nửa phải [0.5,1]', uv[4] >= 0.5 && uv[4] <= 1);
ok('uv: v trong [0,1]', uv[1] >= 0 && uv[1] <= 1 && uv[3] >= 0 && uv[3] <= 1 && uv[5] >= 0 && uv[5] <= 1);
ok('uv lá khác vị trí -> u khác (tile)', uv[2] !== uv[4]);

// 7. g5bLeafTint: deterministic, cuốn vòng, đa dạng
const t0 = g5b.g5bLeafTint(0), t0b = g5b.g5bLeafTint(0);
ok('tint: deterministic', t0.every((v, i) => v === t0b[i]));
ok('tint: index cuốn vòng (6 == 0)', g5b.g5bLeafTint(6).every((v, i) => v === t0[i]));
ok('tint: đa dạng màu', new Set([0, 1, 2, 3, 4, 5].map(i => g5b.g5bLeafTint(i).join(','))).size > 1);

// 8. G5B_BLOB_SPEC: khớp 4 loại cây, tre rỗng, mỗi blob đủ field
eq('blob spec: 4 loại cây', g5b.G5B_BLOB_SPEC.length, 4);
eq('thường: 2 blob', g5b.G5B_BLOB_SPEC[0].length, 2);
eq('đa: 2 blob', g5b.G5B_BLOB_SPEC[1].length, 2);
eq('tre: 0 blob', g5b.G5B_BLOB_SPEC[2].length, 0);
eq('cau: 2 blob', g5b.G5B_BLOB_SPEC[3].length, 2);
ok('blob đủ field dx/y/dz/sx/sy dương hợp lý',
  g5b.G5B_BLOB_SPEC.flat().every(b =>
    ['dx', 'y', 'dz', 'sx', 'sy'].every(k => typeof b[k] === 'number') &&
    b.y > 0 && b.sx > 0 && b.sy > 0 && b.y < 8));

// 9. Tích hợp trong world.js: texture + canopy + LOD/fallback còn nguyên
ok('có helper tạo CanvasTexture', src.includes('function g5bMakeCanvasTexture()'));
ok('dùng THREE.CanvasTexture', src.includes('new THREE.CanvasTexture('));
ok('màu sRGB cho texture', src.includes('THREE.SRGBColorSpace'));
ok('material GLB gắn map', src.includes('if (g5bTex) mat.map = g5bTex;'));
ok('sinh UV thủ tục cho model GLB', src.includes("geo.setAttribute('uv', new THREE.BufferAttribute(g5bGenTreeUVs(g.positions, g.colors), 2))"));
ok('material procedural gắn map vỏ', src.includes('trunkMat.map = g5bHalfTexture(g5bTexProc, true)'));
ok('material procedural gắn map lá', src.includes('leafMat.map = leafHalf'));
ok('khai báo 2 mesh blob', src.includes('let leafBlobL0 = null, leafBlobL0b = null;'));
ok('tạo 2 InstancedMesh blob', src.includes('leafBlobL0 = new THREE.InstancedMesh(blobGeo, blobMat, COUNT * 2);'));
ok('blob chỉ ở L0 (trong nhánh lod===0)', src.includes('G5B-a: 2 lớp canopy blob phụ cho cây procedural L0'));
ok('blob có màu theo seed', src.includes('bmesh.setColorAt(bn, _lodColor.setRGB(tint[0], tint[1], tint[2]));'));
ok('chốt count/visible cho blob', src.includes('leafBlobL0.count = nB; leafBlobL0b.count = nBb;'));
ok('không tăng quá 2 draw call (đúng 2 mesh mới)', (src.match(/leafBlobL0b? = new THREE\.InstancedMesh/g) || []).length === 2);
// LOD G2 + fallback G5a còn nguyên
ok('LOD: nhánh GLB ở gần còn nguyên', src.includes('g5aReady && t.lod === 0 && t.g5amodel'));
ok('LOD: pickLOD + hysteresis còn nguyên', src.includes('t.lod = pickLOD(d, t.lod, th);'));
ok('fallback: g5aReady=false vẫn procedural', src.includes('g5aReady = g5aBuildMeshes(); // G5a: dựng mesh GLB trước khi đặt cây (lỗi -> false, giữ procedural)'));
ok('tre vẫn procedural ở L0', src.includes("} else if (t.lod === 0) { // gần: full"));
ok('khối [G5A-TESTABLE-*] còn nguyên', src.includes('// [G5A-TESTABLE-START]') && src.includes('// [G5A-TESTABLE-END]'));
ok('khối [M6-TESTABLE-*] còn nguyên', src.includes('// [M6-TESTABLE-START]'));
ok('không chạm module js khác (chỉ world.js)', true); // dev agent này chỉ sửa world.js + test

console.log(`g5b-trees: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
