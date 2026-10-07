import * as THREE from 'three';
import { POND, WORLD, QUALITY_LEVELS } from './config.js';
import { smoothstep, TREE_TYPES, pickTreeType, lodThresholds, pickLOD, grassVisibleAt, hash01 } from './utils.js';
import { DN, P, Q } from './core.js';
import { scene, camera } from './engine.js';
import { vnGachTex, vnNgoiTex, vnGoTex, vnDenLongTex, vnLaSenTex, vnRuongTex, vnDaTrauTex, vnLongGaTex,
         buildNhaNgoi, buildCongLang, buildTrau, buildGa } from './vn.js'; // VN: bộ đồ họa Việt Nam

// ---------- 3. Địa hình procedural ----------
// Hàm chiều cao dùng chung cho terrain, cây, nhà, player, NPC
export function groundHeight(x, z) {
  return baseHeight(x, z);
}
export let pondBaseY = null;
export function baseHeight(x, z) {
  // Ghép nhiều sóng sin/cos tạo đồi núi tự nhiên
  let h = 0;
  h += Math.sin(x * 0.045) * Math.cos(z * 0.050) * 4.0;
  h += Math.sin(x * 0.110 + 1.7) * Math.cos(z * 0.090 + 0.6) * 1.6;
  h += Math.sin(x * 0.230 + 4.2) * 0.5;
  // Làm phẳng khu trung tâm để dựng làng
  const d = Math.hypot(x, z);
  h *= smoothstep(12, 34, d);
  // v4: lõm đất làm ao — bờ dốc mềm, đáy phẳng để đặt mặt nước
  if (pondBaseY === null) pondBaseY = baseHeightNoPond(POND.x, POND.z);
  const pdd = Math.hypot(x - POND.x, z - POND.z);
  if (pdd < 10.5) {
    const t = smoothstep(10.5, 8, pdd); // 0 ngoài bờ → 1 trong ao
    const target = pondBaseY - 0.5 - 1.6;
    h = h * (1 - t) + Math.min(h, target) * t;
  }
  return h;
}
export function baseHeightNoPond(x, z) { // chiều cao gốc chưa lõm ao (để tính mực nước)
  let h = 0;
  h += Math.sin(x * 0.045) * Math.cos(z * 0.050) * 4.0;
  h += Math.sin(x * 0.110 + 1.7) * Math.cos(z * 0.090 + 0.6) * 1.6;
  h += Math.sin(x * 0.230 + 4.2) * 0.5;
  const d = Math.hypot(x, z);
  return h * smoothstep(12, 34, d);
}
export function slopeAt(x, z) { // độ dốc (dùng để tránh chỗ dốc khi đặt cây/NPC)
  const e = 1.5;
  const dx = (groundHeight(x + e, z) - groundHeight(x - e, z)) / (2 * e);
  const dz = (groundHeight(x, z + e) - groundHeight(x, z - e)) / (2 * e);
  return Math.hypot(dx, dz);
}

export let terrain;
{
  const geo = new THREE.PlaneGeometry(WORLD, WORLD, 130, 130);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cLow = new THREE.Color(0x3d7a30);  // cỏ thấp: xanh đậm (fix chói: đậm hơn)
  const cHigh = new THREE.Color(0x74a047); // đỉnh đồi: xanh vàng (fix chói: đậm hơn)
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = groundHeight(x, z);
    pos.setY(i, h);
    // Pha màu theo độ cao + nhiễu nhẹ cho tự nhiên
    const t = Math.min(1, Math.max(0, (h + 3) / 9)) + Math.sin(x * 0.8) * Math.cos(z * 0.7) * 0.05;
    tmp.copy(cLow).lerp(cHigh, Math.min(1, Math.max(0, t)));
    colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
  terrain = new THREE.Mesh(geo, mat);
  terrain.receiveShadow = true;
  scene.add(terrain);
}

// ---------- 3b. Ao nước shader gợn sóng + phản chiếu màu trời fake (v5) ----------
export const waterU = { // uniforms ao — updateDayNight() đổi màu theo giờ
  uTime: { value: 0 },
  skyC: { value: new THREE.Color(0x4d9bd6) },
  sunC: { value: new THREE.Color(0xffffff) },
  sunDirW: { value: new THREE.Vector3(0, 1, 0) },
};
export const pathSamples = []; // điểm mẫu dọc đường — để cỏ/hoa tránh mọc lên đường
{
  const waterY = pondBaseY - 1.15;
  const waterMat = new THREE.ShaderMaterial({
    transparent: true, fog: false,
    uniforms: waterU,
    vertexShader: [
      'varying vec2 vUv;',
      'void main(){ vUv = uv;',
      '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    ].join('\n'),
    fragmentShader: [
      'varying vec2 vUv;',
      'uniform float uTime; uniform vec3 skyC, sunC;',
      'void main(){',
      '  vec2 p = vUv * 14.0;',
      '  float w1 = sin(p.x * 1.7 + uTime * 1.6) * sin(p.y * 1.3 - uTime * 1.1);',
      '  float w2 = sin((p.x + p.y) * 2.3 + uTime * 2.2);',
      '  float rip = (w1 + w2) * 0.25 + 0.5;',            // 0..1 gợn sóng
      '  vec3 deep = skyC * 0.45;',                        // đáy sâu tối hơn
      '  vec3 c = mix(deep, skyC, 0.35 + rip * 0.45);',    // "phản chiếu" màu trời
      '  float glint = pow(max(0.0, sin(p.x * 3.1 + uTime * 2.6) * sin(p.y * 2.7 - uTime * 2.1)), 8.0);',
      '  c += sunC * glint * 0.55;',                       // lấp lánh theo nắng
      '  float edge = smoothstep(0.5, 0.40, length(vUv - 0.5));', // mờ viền hòa vào bờ
      '  gl_FragColor = vec4(c, 0.90 * edge + 0.10);',
      '}',
    ].join('\n'),
  });
  const water = new THREE.Mesh(new THREE.CircleGeometry(6.2, 28), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(POND.x, waterY, POND.z);
  scene.add(water);

  // Đường đất: dải ribbon uốn theo CatmullRom, ôm sát địa hình
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-40, 0, 46), new THREE.Vector3(-20, 0, 24),
    new THREE.Vector3(-8, 0, 12), new THREE.Vector3(4, 0, 2),
    new THREE.Vector3(16, 0, -10), new THREE.Vector3(30, 0, -20),
    new THREE.Vector3(50, 0, -28),
  ]);
  const SEG = 90, W = 1.35;
  const vp = new Float32Array((SEG + 1) * 2 * 3);
  const vc = new Float32Array((SEG + 1) * 2 * 3);
  const idx = [];
  const cDirt = new THREE.Color(0x9a7b4f), cDirt2 = new THREE.Color(0x7d6240), tc = new THREE.Color();
  const pt = new THREE.Vector3(), tan = new THREE.Vector3();
  for (let i = 0; i <= SEG; i++) {
    const u = i / SEG;
    curve.getPoint(u, pt); curve.getTangent(u, tan);
    const nx = -tan.z, nz = tan.x; // pháp tuyến ngang
    const l = Math.hypot(nx, nz) || 1;
    const ox = (nx / l) * W, oz = (nz / l) * W;
    const lx = pt.x - ox, lz = pt.z - oz, rx = pt.x + ox, rz = pt.z + oz;
    vp.set([lx, groundHeight(lx, lz) + 0.07, lz], i * 6);
    vp.set([rx, groundHeight(rx, rz) + 0.07, rz], i * 6 + 3);
    const j = 0.9 + Math.random() * 0.2; // vân đất không đều
    tc.copy(cDirt).lerp(cDirt2, Math.random() * 0.7).multiplyScalar(j);
    vc.set([tc.r, tc.g, tc.b], i * 6);
    tc.multiplyScalar(0.92 + Math.random() * 0.08);
    vc.set([tc.r, tc.g, tc.b], i * 6 + 3);
    if (i % 6 === 0) pathSamples.push([pt.x, pt.z]); // mẫu thưa để kiểm tra va chạm cỏ
    if (i < SEG) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(vp, 3));
  pg.setAttribute('color', new THREE.BufferAttribute(vc, 3));
  pg.setIndex(idx);
  pg.computeVertexNormals();
  const path = new THREE.Mesh(pg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  path.receiveShadow = true;
  scene.add(path);
}
export function nearPath(x, z, r) { // cỏ/hoa có nằm trên đường không?
  for (const s of pathSamples) if (Math.hypot(x - s[0], z - s[1]) < r) return true;
  return false;
}

// [G5A-TESTABLE-START] — cây GLB Kenney CC0 (G5a): parser GLB tối giản + bảng model, thuần logic.
// 6 model đã "nướng" offline bằng tools/prepare-tree-assets.py: mỗi cây đúng
// 1 mesh / 1 primitive, thuộc tính POSITION + NORMAL + COLOR_0 (VEC3 float),
// indices uint16/uint32 — runtime không cần GLTFLoader, không texture.
// type cây (TREE_TYPES trong utils.js): 0 thường, 1 đa, 2 tre, 3 cau.
// Type 2 (bụi tre) GIỮ procedural — không có model tre CC0 phù hợp trong kho.
// Model GLB thay procedural ở L0 (gần); L1 (giữa) + L2 (cull) giữ nguyên cơ chế G2.
const G5A_TREE_MODELS = [
  // key: tên file trong assets-embedded.js; sxz/sy: tỉ lệ bù kích thước model gốc
  // (~2.4–3m) về tầm cây cũ (~5–7m) — xem tools/prepare-tree-assets.py
  { key: 'tree-thuong-a.glb', type: 0, sxz: 2.2, sy: 2.2 }, // thường: tán tròn thấp
  { key: 'tree-thuong-b.glb', type: 0, sxz: 2.2, sy: 2.2 }, // thường: cao
  { key: 'tree-cothu.glb',    type: 0, sxz: 2.2, sy: 2.2 }, // thường: thân cong (cổ thụ)
  { key: 'tree-thong.glb',    type: 0, sxz: 2.0, sy: 2.4 }, // thông: cao, khẳng khiu
  { key: 'tree-da.glb',       type: 1, sxz: 2.6, sy: 1.7 }, // đa: tán tròn -> kéo rộng, dẹt
  { key: 'tree-cau.glb',      type: 3, sxz: 2.6, sy: 2.8 }, // cau/dừa: thân mảnh, tàu lá xòe
];
function g5aModelsForType(type) { // chỉ số model trong G5A_TREE_MODELS thuộc type
  const out = [];
  for (let i = 0; i < G5A_TREE_MODELS.length; i++)
    if (G5A_TREE_MODELS[i].type === type) out.push(i);
  return out;
}
function g5aPickModel(type, h01) { // chọn model deterministic theo hash vị trí; tre (-1) = procedural
  const c = g5aModelsForType(type);
  if (!c.length) return -1;
  const h = h01 < 0 ? 0 : h01 >= 1 ? 0.999999 : h01;
  return c[Math.floor(h * c.length)];
}
export function g5aB64ToBytes(b64) { // base64 (chuẩn, có thể kèm padding =) -> Uint8Array, thuần logic
  // VN (v14): export để actors.js tái dùng parser cho model nhân vật (không duplicate code)
  const T = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = String(b64).replace(/[^A-Za-z0-9+/=]/g, '');
  const out = [];
  let bits = 0, nbits = 0;
  for (const ch of clean) {
    if (ch === '=') break;
    bits = (bits << 6) | T.indexOf(ch);
    nbits += 6;
    if (nbits >= 8) { nbits -= 8; out.push((bits >> nbits) & 0xFF); bits &= (1 << nbits) - 1; }
  }
  return new Uint8Array(out);
}
function g5aReadU32(b, o) { return b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24); }
export function g5aParseGLB(bytes) { // parser GLB tối giản cho model đã nướng (G5a) -> geometry data
  // VN (v14): export để actors.js tái dùng cho model nhân vật Kenney (cùng format nướng)
  // Trả về {positions, normals, colors, indices, vertCount, triCount}.
  // Ném Error khi: sai magic/version, thiếu chunk JSON, mesh/primitive rỗng,
  // thiếu POSITION, componentType lạ, index vượt số vertex.
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length < 20) throw new Error('G5a: file quá ngắn, không phải GLB');
  if (g5aReadU32(b, 0) !== 0x46546C67) throw new Error('G5a: sai magic, không phải GLB');
  if (g5aReadU32(b, 4) !== 2) throw new Error('G5a: chỉ hỗ trợ glTF 2.0');
  let jdoc = null, bin = null;
  let off = 12;
  while (off + 8 <= b.length) {
    const len = g5aReadU32(b, off), typ = g5aReadU32(b, off + 4);
    const data = b.slice(off + 8, off + 8 + len);
    if (typ === 0x4E4F534A) jdoc = data;       // 'JSON'
    else if (typ === 0x004E4942) bin = data;  // 'BIN\0'
    off += 8 + len;
  }
  if (!jdoc) throw new Error('G5a: thiếu chunk JSON');
  if (!bin) throw new Error('G5a: thiếu chunk BIN');
  const j = JSON.parse(new TextDecoder().decode(jdoc));
  const views = j.bufferViews || [], accs = j.accessors || [];
  function attrBytes(prim, name, ncomp, ctypeWant) {
    const ai = prim.attributes[name];
    if (ai === undefined) return null;
    const a = accs[ai], v = views[a.bufferView];
    if (a.componentType !== ctypeWant) throw new Error('G5a: componentType lạ ở ' + name);
    const n = a.count, itemSz = { 5121: 1, 5123: 2, 5125: 4, 5126: 4 }[a.componentType] * ncomp;
    const stride = v.byteStride || itemSz;
    const base = (v.byteOffset || 0) + (a.byteOffset || 0);
    const out = new Float32Array(n * ncomp);
    const dv = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
    for (let i = 0; i < n; i++)
      for (let k = 0; k < ncomp; k++)
        out[i * ncomp + k] = dv.getFloat32(base + i * stride + k * 4, true);
    return out;
  }
  const P = [], N = [], C = [], I = [];
  let voff = 0;
  for (const mesh of (j.meshes || [])) {
    for (const prim of (mesh.primitives || [])) {
      const pos = attrBytes(prim, 'POSITION', 3, 5126);
      if (!pos) throw new Error('G5a: primitive thiếu POSITION');
      const nor = attrBytes(prim, 'NORMAL', 3, 5126) || new Float32Array(pos.length);
      let col = attrBytes(prim, 'COLOR_0', 3, 5126);
      if (!col) { col = new Float32Array(pos.length); col.fill(1); } // không màu -> trắng
      const ai = prim.indices;
      if (ai === undefined) throw new Error('G5a: primitive thiếu indices');
      const a = accs[ai], v = views[a.bufferView];
      const base = (v.byteOffset || 0) + (a.byteOffset || 0);
      const dv = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
      const idx = new Array(a.count);
      for (let i = 0; i < a.count; i++) {
        const o = base + i * { 5121: 1, 5123: 2, 5125: 4 }[a.componentType];
        idx[i] = a.componentType === 5121 ? dv.getUint8(o)
          : a.componentType === 5123 ? dv.getUint16(o, true) : dv.getUint32(o, true);
        if (idx[i] >= pos.length / 3) throw new Error('G5a: index vượt số vertex');
      }
      P.push(pos); N.push(nor); C.push(col);
      for (const x of idx) I.push(x + voff);
      voff += pos.length / 3;
    }
  }
  if (!P.length) throw new Error('G5a: không có primitive nào');
  const cat = (arrs, n) => { const o = new Float32Array(voff * n); let p = 0; for (const a of arrs) { o.set(a, p); p += a.length; } return o; };
  const positions = cat(P, 3), normals = cat(N, 3), colors = cat(C, 3);
  const indices = voff > 65535 ? new Uint32Array(I) : new Uint16Array(I);
  return { positions, normals, colors, indices, vertCount: voff, triCount: I.length / 3 };
}
// [G5A-TESTABLE-END]

// [G5B-A-TESTABLE-START] — cây chi tiết + texture tự vẽ (G5B-a, hướng đồ họa B), thuần logic.
// Model GLB đã nướng (G5a) KHÔNG có TEXCOORD_0 nên không gắn map trực tiếp được —
// block này cấp: (1) hàm sinh pixel texture chi tiết bằng canvas runtime
// (vân vỏ dọc / đốm lá), deterministic theo seed → 0 byte file build, không dính
// bản quyền; (2) phân loại vertex vỏ/lá theo màu COLOR_0 + sinh UV thủ tục
// (vỏ: chiếu trụ, lá: chiếu phẳng) để map texture lên model GLB ở runtime;
// (3) spec 2 lớp canopy blob phụ cho cây procedural L0 + bảng màu lá theo seed.
// Không đụng block G5A-TESTABLE, LOD G2, tre procedural, đường lui g5aReady=false.
const G5B_TEX_SIZE = 128;      // canvas 128×128, tile lặp — đủ cho texture chi tiết nền trắng
const G5B_TEX_SEED = 20261007; // seed cố định → texture giống hệt mọi lần tải
const G5B_CANOPY_LAYERS = 2;   // số lớp canopy blob phụ ở L0 (mỗi lớp 1 InstancedMesh)
const G5B_BARK_HALF = 0.5;     // texture gộp: nửa trái (u<0.5) = vân vỏ, nửa phải (u>=0.5) = đốm lá
const G5B_BARK_V_SCALE = 0.55; // vỏ: 1 tile texture / ~1.8m chiều cao thân
const G5B_LEAF_UV_SCALE = 0.35;// lá: mật độ tile đốm lá
const G5B_LEAF_TINTS = [       // bảng màu lá (RGB 0..1) — đa dạng theo seed, nhân với texture
  [0.72, 0.88, 0.62], [0.62, 0.82, 0.55], [0.80, 0.92, 0.70],
  [0.58, 0.78, 0.50], [0.76, 0.86, 0.58], [0.66, 0.84, 0.60],
];
function g5bSeededRand(seed) { // PRNG mulberry32 — ổn định mọi lần chạy
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function g5bBarkPixels(w, h, seed) { // pixel vân vỏ cây: nền trắng ngà + sọc dọc lượn + nhiễu mịn
  const rnd = g5bSeededRand(seed);
  const out = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    out[i * 4] = 246; out[i * 4 + 1] = 241; out[i * 4 + 2] = 232; out[i * 4 + 3] = 255;
  }
  let x = 0;
  while (x < w) { // các sọc vỏ chạy suốt chiều cao, x lượn nhẹ cho tự nhiên
    const sw = 1 + Math.floor(rnd() * 2);
    const dark = 0.10 + rnd() * 0.14;
    const wob = rnd() * Math.PI * 2, amp = 0.5 + rnd() * 1.5;
    for (let y = 0; y < h; y++) {
      const xx = Math.round(x + Math.sin(y * 0.35 + wob) * amp);
      for (let k = 0; k < sw; k++) {
        const px = xx + k;
        if (px < 0 || px >= w) continue;
        const i = (y * w + px) * 4;
        out[i]     = out[i]     * (1 - dark) + 148 * dark;
        out[i + 1] = out[i + 1] * (1 - dark) + 122 * dark;
        out[i + 2] = out[i + 2] * (1 - dark) + 92 * dark;
      }
    }
    x += sw + 2 + Math.floor(rnd() * 6);
  }
  for (let i = 0; i < w * h; i++) { // nhiễu mịn chống phẳng
    const n = (rnd() - 0.5) * 10;
    out[i * 4] += n; out[i * 4 + 1] += n; out[i * 4 + 2] += n;
  }
  return out;
}
function g5bLeafPixels(w, h, seed) { // pixel đốm lá: nền trắng xanh nhạt + chấm đậm/nhạt + nhiễu mịn
  const rnd = g5bSeededRand(seed);
  const out = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    out[i * 4] = 248; out[i * 4 + 1] = 250; out[i * 4 + 2] = 243; out[i * 4 + 3] = 255;
  }
  const dots = Math.floor(w * h / 36);
  for (let d = 0; d < dots; d++) {
    const cx = rnd() * w, cy = rnd() * h;
    const rad = 1 + rnd() * 2.2;
    const darkSpot = rnd() < 0.6; // 60% đốm tối, 40% đốm sáng
    const a = 0.10 + rnd() * 0.16;
    const cr = darkSpot ? 118 : 255, cg = darkSpot ? 148 : 255, cb = darkSpot ? 104 : 255;
    for (let yy = Math.floor(cy - rad); yy <= cy + rad; yy++) {
      for (let xx = Math.floor(cx - rad); xx <= cx + rad; xx++) {
        if (xx < 0 || xx >= w || yy < 0 || yy >= h) continue;
        if (Math.hypot(xx - cx, yy - cy) > rad) continue;
        const i = (yy * w + xx) * 4;
        out[i] = out[i] * (1 - a) + cr * a;
        out[i + 1] = out[i + 1] * (1 - a) + cg * a;
        out[i + 2] = out[i + 2] * (1 - a) + cb * a;
      }
    }
  }
  for (let i = 0; i < w * h; i++) {
    const n = (rnd() - 0.5) * 8;
    out[i * 4] += n; out[i * 4 + 1] += n; out[i * 4 + 2] += n;
  }
  return out;
}
function g5bIsBarkColor(r, g, b) { // vỏ Kenney: nâu (r trội hơn g); lá: xanh (g trội); trắng → lá
  return r > 0.15 && (r - g) > 0.03 && r > b;
}
function g5bGenTreeUVs(positions, colors) { // UV thủ tục cho model GLB (vỏ: chiếu trụ, lá: chiếu phẳng)
  const n = positions.length / 3;
  const uv = new Float32Array(n * 2);
  const wrap = (v) => ((v % 1) + 1) % 1; // về [0,1), xử lý cả số âm
  for (let i = 0; i < n; i++) {
    const x = positions[i * 3], y = positions[i * 3 + 1], z = positions[i * 3 + 2];
    if (g5bIsBarkColor(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2])) {
      const u = Math.atan2(x, z) / (2 * Math.PI) + 0.5; // góc quanh thân → 0..1
      uv[i * 2] = G5B_BARK_HALF * u;                    // nửa trái texture = vân vỏ
      uv[i * 2 + 1] = wrap(y * G5B_BARK_V_SCALE);
    } else {
      uv[i * 2] = G5B_BARK_HALF + G5B_BARK_HALF * wrap((x + z) * G5B_LEAF_UV_SCALE); // nửa phải = đốm lá
      uv[i * 2 + 1] = wrap((x - z) * G5B_LEAF_UV_SCALE);
    }
  }
  return uv;
}
function g5bLeafTint(i) { // màu lá theo seed — index vượt bảng thì cuốn vòng
  return G5B_LEAF_TINTS[((i % G5B_LEAF_TINTS.length) + G5B_LEAF_TINTS.length) % G5B_LEAF_TINTS.length];
}
// Spec 2 lớp canopy blob phụ cho cây procedural L0 (thứ tự khớp TREE_TYPES trong utils.js).
// {dx,y,dz}: tâm blob (đơn vị tỉ lệ cây), {sx,sy}: tỉ lệ ngang/dọc của khối cầu.
// type 2 (tre) rỗng — tre đã có chùm lá riêng, không cần blob.
const G5B_BLOB_SPEC = [
  [ // 0 thường: phồng 2 tầng nón
    { dx: 0, y: 3.10, dz: 0, sx: 1.05, sy: 0.75 },
    { dx: 0.35, y: 4.60, dz: -0.20, sx: 0.70, sy: 0.60 },
  ],
  [ // 1 đa: phồng tán dẹt rộng
    { dx: 0, y: 2.50, dz: 0, sx: 1.30, sy: 0.60 },
    { dx: -0.40, y: 3.40, dz: 0.30, sx: 0.85, sy: 0.55 },
  ],
  [], // 2 tre: không blob
  [ // 3 cau: cụm lá quanh ngọn
    { dx: 0.50, y: 4.60, dz: 0, sx: 0.70, sy: 0.45 },
    { dx: -0.45, y: 4.90, dz: 0.25, sx: 0.60, sy: 0.40 },
  ],
];
// [G5B-A-TESTABLE-END]

// ---------- 4. Cây cối: InstancedMesh + LOD theo khoảng cách camera (G2) ----------
// G8: 4 kiểu cây silhouette khác nhau:
//  0 cây thường (2 tầng nón — giữ nguyên v4), 1 cây đa (tán rộng dẹt 2 tầng),
//  2 bụi tre (3 thân mảnh cao + chùm lá), 3 cây cau (thân mảnh cao + tàu lá xòe).
// G5a: type 0/1/3 ở L0 (gần) vẽ bằng model GLB Kenney CC0 đã nướng (1 instance/cây);
//  type 2 (tre) giữ procedural (không có GLB tre CC0). L0 (gần) vẽ full theo spec
//  từng loại; L1 (giữa) gộp về thân + 1 tầng lá rẻ (vẫn giữ dáng riêng nhờ thân
//  cao/thấp khác nhau); L2 (xa) cull như cũ.
//  Vẽ GLB: 6 InstancedMesh (1/model). Cây procedural cũ giữ nguyên để tre dùng +
//  làm đường lui nếu model GLB tải lỗi (g5aReady=false).
export const obstacles = []; // {x, z, r} — vật cản để player không đi xuyên
export const treeData = []; // {x, y, z, s, ry, type, lod} — type: 0..3 (TREE_TYPES); lod: mức hiện tại (−1 = chưa tính)
let trunkL0 = null, leafL0 = null, leafTopL0 = null, leafDaL0 = null, trunkL1 = null, leafL1 = null; // 6 mesh LOD (G8: +leafDaL0)
let leafBlobL0 = null, leafBlobL0b = null; // G5B-a: 2 lớp canopy blob phụ cho cây procedural L0
// NOTE: TREE_TYPES / pickTreeType / G8_DRAW_CALL_BUDGET / G8_NEW_MESHES là TESTABLE (dòng 553-616 gốc)
// → đã import từ './utils.js', không định nghĩa lại ở đây.
// NOTE: grassMesh/stemMesh/headMesh (gốc dòng 256) khai báo tại đây để world.js làm chủ việc tạo/gán.
export let grassMesh = null, stemMesh = null, headMesh = null; // gán sau khi tạo cỏ/hoa (mục 4b)
const _lodDummy = new THREE.Object3D(); // dùng chung cho mọi lần ghi LOD (cây/cỏ/hoa)
const _lodColor = new THREE.Color();
export function writeTreePart8(mesh, idx, t, p) { // G8: ghi 1 part cây theo spec loại cây
  _lodDummy.position.set(t.x + (p.dx || 0) * t.s, t.y + p.y * t.s, t.z + (p.dz || 0) * t.s);
  _lodDummy.scale.set(t.s * (p.sx || 1), t.s * (p.sy || 1), t.s * (p.sx || 1));
  _lodDummy.rotation.y = t.ry;
  _lodDummy.updateMatrix();
  mesh.setMatrixAt(idx, _lodDummy.matrix);
}
// G5a: trạng thái cây GLB — g5aReady=false → toàn bộ cây vẽ procedural như cũ (đường lui)
const g5aMeshes = []; // [{mesh, def}] — 1 InstancedMesh cho mỗi model trong G5A_TREE_MODELS
let g5aReady = false;
function g5aBuildMeshes() { // dựng InstancedMesh từ INFINIA_MODELS (global, do assets-embedded.js cấp)
  try {
    if (typeof INFINIA_MODELS === 'undefined' || !INFINIA_MODELS) return false;
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, side: THREE.DoubleSide });
    const g5bTex = g5bMakeCanvasTexture(); // G5B-a: texture chi tiết tự vẽ (canvas runtime, 0 byte)
    if (g5bTex) mat.map = g5bTex; // nhân với vertexColors → vân vỏ + đốm lá trên model GLB
    for (const def of G5A_TREE_MODELS) {
      const url = INFINIA_MODELS[def.key];
      if (typeof url !== 'string' || url.indexOf(',') < 0) return false;
      const bytes = g5aB64ToBytes(url.slice(url.indexOf(',') + 1));
      const g = g5aParseGLB(bytes);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(g.positions, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(g.normals, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(g.colors, 3));
      // G5B-a: UV thủ tục (model nướng không có TEXCOORD_0) → map texture chi tiết
      geo.setAttribute('uv', new THREE.BufferAttribute(g5bGenTreeUVs(g.positions, g.colors), 2));
      geo.setIndex(new THREE.BufferAttribute(g.indices, 1));
      const mesh = new THREE.InstancedMesh(geo, mat, 150); // sức chứa = COUNT cây
      mesh.castShadow = true; mesh.frustumCulled = false; // instance rải khắp map
      mesh.count = 0; mesh.visible = false;
      scene.add(mesh);
      g5aMeshes.push({ mesh, def });
    }
    return true;
  } catch (e) {
    console.warn('[G5a] model GLB lỗi, giữ cây procedural:', e && e.message);
    return false;
  }
}
// G5B-a: texture chi tiết tự vẽ bằng canvas (runtime → 0 byte file build, không bản quyền).
// Texture gộp 128×128: nửa trái = vân vỏ, nửa phải = đốm lá (khớp G5B_BARK_HALF).
let g5bDetailTex = null;
function g5bMakeCanvasTexture() {
  if (typeof document === 'undefined') return null; // chạy test trên node → bỏ qua
  if (g5bDetailTex) return g5bDetailTex;
  const S = G5B_TEX_SIZE, H = S / 2;
  const cv = document.createElement('canvas');
  cv.width = S; cv.height = S;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(S, S);
  const bark = g5bBarkPixels(H, S, G5B_TEX_SEED);      // nửa trái: vân vỏ
  const leaf = g5bLeafPixels(H, S, G5B_TEX_SEED + 1);  // nửa phải: đốm lá
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const left = x < H;
      const src = left ? bark : leaf;
      const si = (y * H + (left ? x : x - H)) * 4, di = (y * S + x) * 4;
      img.data[di] = src[si]; img.data[di + 1] = src[si + 1];
      img.data[di + 2] = src[si + 2]; img.data[di + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  g5bDetailTex = tex;
  return tex;
}
function g5bHalfTexture(tex, left) { // clone texture chỉ lấy nửa trái (vỏ) hoặc nửa phải (lá)
  const t = tex.clone(); // clone dùng chung image canvas → không tốn thêm bộ nhớ ảnh
  t.repeat.set(0.5, 1);
  t.offset.set(left ? 0 : 0.5, 0);
  t.needsUpdate = true;
  return t;
}
function writeTreeGLB(gm, idx, t) { // G5a: ghi 1 cây GLB (1 instance) vào mesh của model
  _lodDummy.position.set(t.x, t.y, t.z);
  _lodDummy.scale.set(t.s * gm.def.sxz, t.s * gm.def.sy, t.s * gm.def.sxz);
  _lodDummy.rotation.set(0, t.ry, 0);
  _lodDummy.updateMatrix();
  gm.mesh.setMatrixAt(idx, _lodDummy.matrix);
}
export function refreshTreeLOD(cx, cz) { // G2+G8+G5a: phân cây vào bucket LOD, mỗi loại cây vẽ theo spec riêng
  if (!trunkL0) return; // chưa tạo xong (applyQuality gọi sớm) → bỏ qua
  const th = lodThresholds(Q.level);
  let nT = 0, nL = 0, nTp = 0, nD = 0, nT1 = 0, nL1 = 0, nB = 0, nBb = 0; // bộ đếm từng mesh (G5B-a: +nB/nBb)
  const nG = g5aMeshes.map(() => 0); // G5a: bộ đếm instance cho từng model GLB
  for (const t of treeData) {
    const d = Math.hypot(t.x - cx, t.z - cz);
    t.lod = pickLOD(d, t.lod, th); // cơ chế G2 giữ nguyên: 3 mức + hysteresis
    const spec = TREE_TYPES[t.type] || TREE_TYPES[0]; // type lạ → cây thường cho an toàn
    if (g5aReady && t.lod === 0 && t.g5amodel >= 0 && t.g5amodel < g5aMeshes.length) {
      // G5a: cây GLB ở gần — 1 instance duy nhất vào mesh của model đã chọn
      writeTreeGLB(g5aMeshes[t.g5amodel], nG[t.g5amodel]++, t);
    } else if (t.lod === 0) { // gần: full — vẽ mọi part của loại cây (tre + đường lui GLB lỗi)
      for (const p of spec.parts) {
        if (p.m === 'trunk') writeTreePart8(trunkL0, nT++, t, p);
        else if (p.m === 'leaf') writeTreePart8(leafL0, nL++, t, p);
        else if (p.m === 'leaftop') writeTreePart8(leafTopL0, nTp++, t, p);
        else writeTreePart8(leafDaL0, nD++, t, p); // 'leafda': tán dẹt (đa/cau)
      }
      // G5B-a: 2 lớp canopy blob phụ cho cây procedural L0 (tre có chùm lá riêng → bỏ qua)
      const blobIdx = TREE_TYPES.indexOf(spec);
      const blobs = G5B_BLOB_SPEC[blobIdx] || G5B_BLOB_SPEC[0];
      for (let bi = 0; bi < blobs.length && bi < G5B_CANOPY_LAYERS; bi++) {
        const b = blobs[bi];
        _lodDummy.position.set(t.x + (b.dx || 0) * t.s, t.y + b.y * t.s, t.z + (b.dz || 0) * t.s);
        _lodDummy.scale.set(t.s * b.sx, t.s * b.sy, t.s * b.sx);
        _lodDummy.rotation.y = t.ry;
        _lodDummy.updateMatrix();
        const bmesh = bi === 0 ? leafBlobL0 : leafBlobL0b;
        const bn = bi === 0 ? nB++ : nBb++;
        bmesh.setMatrixAt(bn, _lodDummy.matrix);
        // màu lá đa dạng theo seed vị trí cây (ổn định mọi lần tải)
        const tint = g5bLeafTint(Math.floor(hash01(((t.x * 131 + t.z * 137) | 0) >>> 0, 913) * G5B_LEAF_TINTS.length));
        bmesh.setColorAt(bn, _lodColor.setRGB(tint[0], tint[1], tint[2]));
      }
    } else if (t.lod === 1) { // giữa: đơn giản — thân + 1 tầng lá rẻ (vẫn giữ dáng riêng)
      for (const p of spec.simple) {
        if (p.m === 'trunk') writeTreePart8(trunkL1, nT1++, t, p);
        else writeTreePart8(leafL1, nL1++, t, p);
      }
    } // xa (L2): cull — không ghi vào mesh nào
  }
  trunkL0.count = nT; leafL0.count = nL; leafTopL0.count = nTp; leafDaL0.count = nD;
  trunkL1.count = nT1; leafL1.count = nL1;
  leafBlobL0.count = nB; leafBlobL0b.count = nBb; // G5B-a: chốt canopy blob
  trunkL0.visible = nT > 0; leafL0.visible = nL > 0; leafTopL0.visible = nTp > 0; leafDaL0.visible = nD > 0;
  trunkL1.visible = nT1 > 0; leafL1.visible = nL1 > 0;
  leafBlobL0.visible = nB > 0; leafBlobL0b.visible = nBb > 0; // G5B-a
  for (const m of [trunkL0, leafL0, leafTopL0, leafDaL0, trunkL1, leafL1, leafBlobL0, leafBlobL0b])
    m.instanceMatrix.needsUpdate = true;
  for (const m of [leafBlobL0, leafBlobL0b]) // G5B-a: màu lá theo seed đổi theo LOD
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  for (let i = 0; i < g5aMeshes.length; i++) { // G5a: chốt count/visible cho mesh GLB
    g5aMeshes[i].mesh.count = nG[i];
    g5aMeshes[i].mesh.visible = nG[i] > 0;
    g5aMeshes[i].mesh.instanceMatrix.needsUpdate = true;
  }
}
{
  const COUNT = 150;
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.34, 2.4, 6);
  const leafGeo = new THREE.ConeGeometry(1.7, 3.6, 7);
  // v4: tầng lá thứ hai — ngọn nhỏ màu sáng hơn, cây có chiều sâu
  const leafTopGeo = new THREE.ConeGeometry(1.15, 2.4, 7);
  // G2: tầng lá đơn giản cho mức giữa — ít cạnh hơn, nhìn từ xa không phân biệt được
  const leafSimpGeo = new THREE.ConeGeometry(1.7, 3.6, 5);
  // G8: tán lá dẹt rộng cho cây đa / tàu lá cau — đĩa nón 8 cạnh, rẻ
  const leafDaGeo = new THREE.CylinderGeometry(2.4, 1.3, 1.2, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f7a35, roughness: 1 });
  const leafTopMat = new THREE.MeshStandardMaterial({ color: 0x3f9a44, roughness: 1 });
  const leafDaMat = new THREE.MeshStandardMaterial({ color: 0x2a6e2e, roughness: 1 }); // đa: xanh đậm
  // G5B-a: cây procedural (tre + đường lui GLB lỗi) cũng có texture chi tiết tự vẽ
  const g5bTexProc = g5bMakeCanvasTexture();
  if (g5bTexProc) {
    trunkMat.map = g5bHalfTexture(g5bTexProc, true);              // nửa trái: vân vỏ
    const leafHalf = g5bHalfTexture(g5bTexProc, false);           // nửa phải: đốm lá
    leafMat.map = leafHalf; leafTopMat.map = leafHalf; leafDaMat.map = leafHalf;
  }
  // Sức chứa: bụi tre ghi 3 thân + 3 chùm lá / cây, cây đa 2 tán → nhân hệ số cho đủ
  trunkL0 = new THREE.InstancedMesh(trunkGeo, trunkMat, COUNT * 3);
  leafL0 = new THREE.InstancedMesh(leafGeo, leafMat, COUNT);
  leafTopL0 = new THREE.InstancedMesh(leafTopGeo, leafTopMat, COUNT * 3);
  leafDaL0 = new THREE.InstancedMesh(leafDaGeo, leafDaMat, COUNT * 2);
  trunkL1 = new THREE.InstancedMesh(trunkGeo, trunkMat, COUNT);
  leafL1 = new THREE.InstancedMesh(leafSimpGeo, leafMat, COUNT);
  for (const m of [trunkL0, leafL0, leafTopL0, leafDaL0, trunkL1, leafL1]) {
    m.castShadow = true; m.frustumCulled = false; // instance rải khắp map
    scene.add(m);
  }
  // G5B-a: 2 lớp canopy blob phụ cho L0 — mỗi lớp 1 InstancedMesh (+2 draw call tối đa)
  const blobGeo = new THREE.IcosahedronGeometry(1, 1);
  const blobMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 });
  if (g5bTexProc) blobMat.map = g5bHalfTexture(g5bTexProc, false); // đốm lá (nửa phải)
  leafBlobL0 = new THREE.InstancedMesh(blobGeo, blobMat, COUNT * 2);
  leafBlobL0b = new THREE.InstancedMesh(blobGeo, blobMat, COUNT * 2);
  for (const m of [leafBlobL0, leafBlobL0b]) {
    m.castShadow = true; m.frustumCulled = false;
    m.count = 0; m.visible = false;
    scene.add(m);
  }
  g5aReady = g5aBuildMeshes(); // G5a: dựng mesh GLB trước khi đặt cây (lỗi -> false, giữ procedural)
  if (typeof window !== 'undefined') window.__g5aReady = g5aReady; // debug: worker kiểm chứng GLB có active không
  let placed = 0, guard = 0;
  while (placed < COUNT && guard++ < 4000) {
    const x = (Math.random() - 0.5) * 200;
    const z = (Math.random() - 0.5) * 200;
    if (Math.hypot(x, z) < 28) continue;   // tránh khu làng
    if (slopeAt(x, z) > 0.55) continue;    // tránh dốc cao
    const s = 0.8 + Math.random() * 0.9;   // kích thước ngẫu nhiên
    let type = pickTreeType(Math.random()); // G8: loại cây theo tỉ lệ 50/20/15/15 (GIỮ nguyên hàm thuần cho test)
    // VN (v11): quanh làng (<48m) chỉ tre/cau/đa — cây thông (GLB tree-thong) cấm vào làng.
    // Xa làng giữ phân bố cũ. Không sửa pickTreeType (test g8-art khóa tỉ lệ), chỉ lọc sau khi bốc.
    const ganLang = Math.hypot(x, z) < 48;
    if (ganLang && type === 0) type = [1, 2, 3][Math.floor(Math.random() * 3)]; // thường → đa/tre/cau
    // G5a: chọn model GLB deterministic theo vị trí (ổn định qua mọi lần tải); tre -> -1
    let g5amodel = g5aReady ? g5aPickModel(type, hash01(((x * 131 + z * 137) | 0) >>> 0, 77)) : -1;
    if (ganLang && g5amodel >= 0 && G5A_TREE_MODELS[g5amodel].key.indexOf('thong') >= 0) {
      g5amodel = -1; // thông lọt vào làng (do model type 0) → vẽ procedural thay vì GLB thông
    }
    treeData.push({ x, y: groundHeight(x, z), z, s, ry: Math.random() * Math.PI * 2, type, lod: -1, g5amodel });
    obstacles.push({ x, z, r: 0.55 * s });
    if (type === 2) obstacles.push({ x: x + 0.5 * s, z: z + 0.3 * s, r: 0.4 * s }); // bụi tre: cụm rộng hơn
    placed++;
  }
  refreshTreeLOD(camera.position.x, camera.position.z); // tính LOD lần đầu ngay khi tạo
}

// ---------- 4b. Thảm cỏ + hoa dại: InstancedMesh, cỏ đung đưa theo gió (v4) + LOD (G2) ----------
export const uTime = { value: 0 }; // thời gian cho shader cỏ
export function swayify(mat, amp) { // gắn hiệu ứng đung đưa vào material của InstancedMesh
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uTime;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec4 ip = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float swy = sin(uTime * 2.2 + ip.x * 0.6 + ip.z * 0.45);
        transformed.x += swy * max(position.y, 0.0) * ${amp};
        transformed.z += swy * max(position.y, 0.0) * ${amp * 0.6};
      #endif`
    );
  };
  mat.customProgramCacheKey = () => 'sway' + amp; // mỗi amp một program riêng, tránh cache nhầm
}
export const grassData = []; // {x, y, z, ry, sx, sy, sz, c} — c: màu hex, để ghi lại khi LOD đổi
export const flowerData = []; // {x, y, z, ry, s, c}
export function refreshGrassLOD(cx, cz) { // G2: cỏ xa hơn tầm "gần" thì cull; instance gần gom về đầu mesh
  if (!grassMesh) return;
  const q = QUALITY_LEVELS[Q.level] || QUALITY_LEVELS.med;
  if (!q.grass) { grassMesh.visible = false; return; } // preset Thấp: tắt hẳn như cũ (v5)
  const th = lodThresholds(Q.level);
  let n = 0;
  for (const g of grassData) {
    if (!grassVisibleAt(Math.hypot(g.x - cx, g.z - cz), th)) continue; // xa → ẩn
    _lodDummy.position.set(g.x, g.y, g.z);
    _lodDummy.rotation.y = g.ry;
    _lodDummy.scale.set(g.sx, g.sy, g.sz);
    _lodDummy.updateMatrix();
    grassMesh.setMatrixAt(n, _lodDummy.matrix);
    grassMesh.setColorAt(n, _lodColor.setHex(g.c));
    n++;
  }
  grassMesh.count = n;
  grassMesh.visible = n > 0; // cull hết → 0 draw call
  grassMesh.instanceMatrix.needsUpdate = true;
  if (grassMesh.instanceColor) grassMesh.instanceColor.needsUpdate = true;
}
export function refreshFlowerLOD(cx, cz) { // G2: hoa là "cỏ chi tiết" → ẩn cùng ngưỡng với cỏ
  if (!stemMesh || !headMesh) return;
  const q = QUALITY_LEVELS[Q.level] || QUALITY_LEVELS.med;
  if (!q.grass) { stemMesh.visible = headMesh.visible = false; return; }
  const th = lodThresholds(Q.level);
  let n = 0;
  for (const f of flowerData) {
    if (!grassVisibleAt(Math.hypot(f.x - cx, f.z - cz), th)) continue;
    _lodDummy.position.set(f.x, f.y, f.z);
    _lodDummy.rotation.y = f.ry;
    _lodDummy.scale.setScalar(f.s);
    _lodDummy.updateMatrix();
    stemMesh.setMatrixAt(n, _lodDummy.matrix);
    headMesh.setMatrixAt(n, _lodDummy.matrix);
    headMesh.setColorAt(n, _lodColor.setHex(f.c));
    n++;
  }
  stemMesh.count = headMesh.count = n;
  stemMesh.visible = headMesh.visible = n > 0;
  stemMesh.instanceMatrix.needsUpdate = true;
  headMesh.instanceMatrix.needsUpdate = true;
  if (headMesh.instanceColor) headMesh.instanceColor.needsUpdate = true;
}
{
  const col = new THREE.Color(); // G2: dummy ghi ma trận chuyển sang _lodDummy dùng chung
  // Cỏ: 2600 cọng nón nhỏ, màu xanh biến thiên
  const GC = 2600;
  const gGeo = new THREE.ConeGeometry(0.07, 0.55, 5);
  gGeo.translate(0, 0.27, 0);
  const gMat = new THREE.MeshStandardMaterial({ roughness: 1 });
  swayify(gMat, '0.35');
  const grass = new THREE.InstancedMesh(gGeo, gMat, GC);
  grass.receiveShadow = true;
  let gp = 0, gg = 0;
  while (gp < GC && gg++ < 20000) {
    const x = (Math.random() - 0.5) * 190, z = (Math.random() - 0.5) * 190;
    if (Math.hypot(x - POND.x, z - POND.z) < 10.5) continue; // tránh ao
    if (nearPath(x, z, 1.6)) continue;                        // tránh đường đất
    if (slopeAt(x, z) > 0.6) continue;
    let bad = false;
    for (const o of obstacles) if (Math.hypot(x - o.x, z - o.z) < o.r + 0.6) { bad = true; break; }
    if (bad) continue;
    col.setHSL(0.29 + Math.random() * 0.06, 0.55, 0.32 + Math.random() * 0.14);
    grassData.push({ // G2: lưu thông số, ma trận ghi sau trong refreshGrassLOD
      x, y: groundHeight(x, z), z, ry: Math.random() * Math.PI * 2,
      sx: 0.8 + Math.random() * 0.7, sy: 0.7 + Math.random() * 0.9, sz: 0.8 + Math.random() * 0.7,
      c: col.getHex(),
    });
    gp++;
  }
  grass.frustumCulled = false;
  scene.add(grass);
  grassMesh = grass; // v5: preset chất lượng bật/tắt
  refreshGrassLOD(camera.position.x, camera.position.z); // G2: ghi instance lần đầu theo LOD
  // Hoa dại: thân mảnh + đầu hoa nhiều màu (2 InstancedMesh)
  const FC = 260;
  const stemGeo = new THREE.CylinderGeometry(0.02, 0.03, 0.5, 5);
  stemGeo.translate(0, 0.25, 0);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x3d7a34, roughness: 1 });
  swayify(stemMat, '0.3'); // đung đưa cùng nhịp với đầu hoa để không rời nhau
  const stems = new THREE.InstancedMesh(stemGeo, stemMat, FC);
  const headGeo = new THREE.IcosahedronGeometry(0.11, 0);
  headGeo.translate(0, 0.55, 0);
  const headMat = new THREE.MeshStandardMaterial({ roughness: 0.8 });
  swayify(headMat, '0.3');
  const heads = new THREE.InstancedMesh(headGeo, headMat, FC);
  const FCOLORS = [0xff6b9d, 0xffd34d, 0xffffff, 0xc77dff, 0xff8c42];
  let fp = 0, fg = 0;
  while (fp < FC && fg++ < 6000) {
    const x = (Math.random() - 0.5) * 170, z = (Math.random() - 0.5) * 170;
    if (Math.hypot(x, z) < 24) continue; // hoa ngoài rìa làng cho tự nhiên
    if (Math.hypot(x - POND.x, z - POND.z) < 10.5) continue;
    if (nearPath(x, z, 1.4)) continue;
    if (slopeAt(x, z) > 0.55) continue;
    col.setHex(FCOLORS[(Math.random() * FCOLORS.length) | 0]);
    flowerData.push({ // G2: lưu thông số, ma trận ghi sau trong refreshFlowerLOD
      x, y: groundHeight(x, z), z, ry: Math.random() * Math.PI * 2,
      s: 0.8 + Math.random() * 0.8, c: col.getHex(),
    });
    fp++;
  }
  stems.frustumCulled = heads.frustumCulled = false;
  scene.add(stems, heads);
  stemMesh = stems; headMesh = heads; // v5: preset chất lượng bật/tắt
  refreshFlowerLOD(camera.position.x, camera.position.z); // G2: ghi instance lần đầu theo LOD
}

// ---------- 5. Ngôi làng: 6 NHÀ NGÓI ĐỎ Việt Nam (v11, thay nhà chóp generic) ----------
// GIỮ NGUYÊN: vị trí 6 nhà (vòng tròn r=15), hướng cửa vào làng, obstacle r=3.4,
// mảng houses cho đèn lồng, canvasTex/winTex/doorTex cho combat.js dùng.
// ĐỔI: tường gạch nung + mái ngói đỏ cong đầu đao + sân gạch + hiên cột gỗ.
export const wireMats = [terrain.material]; // vật liệu cho toggle wireframe debug
export const houses = []; // vị trí + group 6 nhà — dùng cho đèn lồng (v5)
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  return t;
}
// VN: giữ tên export cũ để combat.js/ui.js không phải sửa (nội dung đã là texture Việt)
export const winTex = vnDenLongTex('Phúc'); // đèn lồng giấy đỏ chữ Phúc (thay cửa sổ generic)
export const doorTex = vnGoTex([96, 60, 32]); // cửa gỗ vân (thay cửa phẳng cũ)
const vnTexCache = { gach: vnGachTex(), ngoi: vnNgoiTex(), go: vnGoTex([110, 72, 40]) };
wireMats.push(
  new THREE.MeshStandardMaterial({ map: vnTexCache.gach }),
  new THREE.MeshStandardMaterial({ map: vnTexCache.ngoi }),
);
{
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.35;
    const hx = Math.cos(a) * 15, hz = Math.sin(a) * 15;
    const house = buildNhaNgoi(vnTexCache); // nhà ngói đỏ 3 gian (js/vn.js)
    house.position.set(hx, groundHeight(hx, hz), hz);
    house.rotation.y = -a + Math.PI / 2; // cửa quay vào trung tâm làng
    scene.add(house);
    houses.push({ group: house, x: hx, z: hz }); // v5: cho đèn lồng
    obstacles.push({ x: hx, z: hz, r: 3.4 }); // player/NPC không đi xuyên nhà
  }
}

// ---------- 5c. Đồ trang trí quanh nhà (G8): hàng rào tre, chậu hoa, dây phơi quần áo ----------
// Rẻ draw call: 4 InstancedMesh cho cả 6 nhà — fence dùng chung box đơn vị cho cột/
// thanh ngang/cột phơi/dây (scale per-instance), quần áo đung đưa bằng shader riêng.
let fenceMesh = null, clothMesh = null, potMesh = null, potFlowerMesh = null;
{
  const _d = new THREE.Object3D();
  const boxGeo = new THREE.BoxGeometry(1, 1, 1); // hộp đơn vị — mọi kích thước qua scale
  // VN: hàng rào tre có vân tre (texture nhân với màu nên vẫn giữ tone gỗ cũ)
  const woodMat = new THREE.MeshStandardMaterial({ map: vnTexCache.go, color: 0xc9a86a, roughness: 0.95 });
  const clothMat = new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide });
  // G8: vải treo đung đưa theo gió — mép trên cố định vào dây, mép dưới tự do vẫy mạnh nhất
  clothMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uTime;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec4 ip = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float swy = sin(uTime * 2.2 + ip.x * 0.6 + ip.z * 0.45);
        float hang = max(-position.y, 0.0); // 0 ở dây → 0.75 ở mép dưới
        transformed.x += swy * hang * 0.5;
        transformed.z += swy * hang * 0.3;
      #endif`
    );
  };
  clothMat.customProgramCacheKey = () => 'sway-hang';
  const potMat = new THREE.MeshStandardMaterial({ color: 0xa85f3d, roughness: 0.9 });
  const potFlowerMat = new THREE.MeshStandardMaterial({ roughness: 0.8 });
  const potGeo = new THREE.CylinderGeometry(0.28, 0.22, 0.45, 8);
  const potHeadGeo = new THREE.SphereGeometry(0.22, 8, 6);
  const clothGeo = new THREE.PlaneGeometry(0.55, 0.75);
  clothGeo.translate(0, -0.375, 0); // mép trên tại gốc → treo từ dây xuống
  const FLOWER_COLORS = [0xe85d75, 0xffd166, 0xef8354, 0xf8f7ff]; // đỏ/vàng/cam/trắng
  const CLOTH_COLORS = [0x4d96ff, 0xff6b6b, 0x6bcb77]; // xanh/đỏ/lá
  const boxes = [];    // {x,y,z,ry,sx,sy,sz} — cột rào, thanh ngang, cột + dây phơi
  const cloths = [];   // {x,y,z,ry,c} — mảnh vải treo
  const pots = [];     // {x,y,z}
  const potHeads = []; // {x,y,z,c}
  function putBox(x, y, z, ry, sx, sy, sz) { boxes.push({ x, y, z, ry, sx, sy, sz }); }
  houses.forEach((h, hi) => {
    const a = (hi / 6) * Math.PI * 2 + 0.35;
    const hry = -a + Math.PI / 2; // cùng góc xoay với group nhà (cửa quay vào làng)
    const cy = Math.cos(hry), sn = Math.sin(hry);
    const L2W = (lx, lz) => [h.x + lx * cy + lz * sn, h.z - lx * sn + lz * cy]; // local → world
    const gy = (wx, wz) => groundHeight(wx, wz);
    // Hàng rào tre: 2 đoạn hai bên sân hiên — cột mỗi 0.9m + 2 thanh ngang
    for (const side of [-1, 1]) {
      for (let k = 0; k < 5; k++) {
        const [wx, wz] = L2W(side * 2.8, 2.2 + k * 0.9);
        putBox(wx, gy(wx, wz) + 0.55, wz, 0, 0.12, 1.1, 0.12); // cột rào
      }
      for (const rh of [0.85, 0.45]) {
        const [wx, wz] = L2W(side * 2.8, 4.0);
        putBox(wx, gy(wx, wz) + rh, wz, hry, 0.08, 0.08, 3.9); // thanh ngang dọc local z
      }
      const [fx, fz] = L2W(side * 2.8, 4.0);
      obstacles.push({ x: fx, z: fz, r: 1.9 }); // không đi xuyên hàng rào
    }
    // Chậu hoa: 2 chậu hai bên cửa
    for (const side of [-1, 1]) {
      const [wx, wz] = L2W(side * 1.3, 2.3);
      const g = gy(wx, wz);
      pots.push({ x: wx, y: g + 0.225, z: wz });
      potHeads.push({ x: wx, y: g + 0.55, z: wz, c: FLOWER_COLORS[(hi * 2 + (side + 1) / 2) % 4] });
    }
    // Dây phơi quần áo bên phải nhà: 2 cột + dây + 3 mảnh vải
    const [p1x, p1z] = L2W(3.6, 0.8), [p2x, p2z] = L2W(3.6, 3.2);
    const g1 = gy(p1x, p1z), g2 = gy(p2x, p2z);
    putBox(p1x, g1 + 0.95, p1z, 0, 0.1, 1.9, 0.1); // cột phơi 1
    putBox(p2x, g2 + 0.95, p2z, 0, 0.1, 1.9, 0.1); // cột phơi 2
    const [lx, lz] = L2W(3.6, 2.0);
    const lineY = (g1 + g2) / 2 + 1.8;
    putBox(lx, lineY, lz, hry, 0.05, 0.05, 2.4); // dây phơi
    for (let k = 0; k < 3; k++) {
      const [cx2, cz2] = L2W(3.6, 1.2 + k * 0.7);
      cloths.push({ x: cx2, y: lineY, z: cz2, ry: hry + Math.PI / 2, c: CLOTH_COLORS[k] });
    }
  });
  fenceMesh = new THREE.InstancedMesh(boxGeo, woodMat, boxes.length);
  boxes.forEach((b, i) => {
    _d.position.set(b.x, b.y, b.z); _d.rotation.set(0, b.ry, 0); _d.scale.set(b.sx, b.sy, b.sz);
    _d.updateMatrix(); fenceMesh.setMatrixAt(i, _d.matrix);
  });
  clothMesh = new THREE.InstancedMesh(clothGeo, clothMat, cloths.length);
  cloths.forEach((c, i) => {
    _d.position.set(c.x, c.y, c.z); _d.rotation.set(0, c.ry, 0); _d.scale.set(1, 1, 1);
    _d.updateMatrix(); clothMesh.setMatrixAt(i, _d.matrix);
    clothMesh.setColorAt(i, _lodColor.setHex(c.c));
  });
  potMesh = new THREE.InstancedMesh(potGeo, potMat, pots.length);
  pots.forEach((p, i) => {
    _d.position.set(p.x, p.y, p.z); _d.rotation.set(0, 0, 0); _d.scale.set(1, 1, 1);
    _d.updateMatrix(); potMesh.setMatrixAt(i, _d.matrix);
  });
  potFlowerMesh = new THREE.InstancedMesh(potHeadGeo, potFlowerMat, potHeads.length);
  potHeads.forEach((p, i) => {
    _d.position.set(p.x, p.y, p.z); _d.rotation.set(0, 0, 0); _d.scale.set(1, 1, 1);
    _d.updateMatrix(); potFlowerMesh.setMatrixAt(i, _d.matrix);
    potFlowerMesh.setColorAt(i, _lodColor.setHex(p.c));
  });
  fenceMesh.castShadow = true; potMesh.castShadow = true; // rào + chậu đổ bóng
  fenceMesh.frustumCulled = clothMesh.frustumCulled = potMesh.frustumCulled = potFlowerMesh.frustumCulled = false;
  for (const m of [fenceMesh, clothMesh, potMesh, potFlowerMesh]) {
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    scene.add(m);
  }
}

// ---------- 5b. Đèn lồng làng (v5): point light, tối đa 4 cái gần player nhất, chỉ sáng ban đêm ----------
// Đèn lồng vẽ gộp 1 InstancedMesh (1 draw call); PointLight bật/tắt theo khoảng cách
export const lanterns = [];
export let lanMesh = null;
{
  // VN: đèn lồng giấy đỏ chữ Phúc (texture nhân với màu instance — sáng vẫn giữ tone)
  lanMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.16, 10, 8),
    new THREE.MeshBasicMaterial({ map: vnDenLongTex('Phúc') }), 6);
  lanMesh.frustumCulled = false;
  const up = new THREE.Vector3(0, 1, 0);
  const off = new THREE.Vector3(), col = new THREE.Color();
  for (let i = 0; i < houses.length; i++) {
    const h = houses[i];
    off.set(0, 2.45, 3.1).applyAxisAngle(up, h.group.rotation.y); // treo dưới mái hiên
    const x = h.x + off.x, y = h.group.position.y + off.y, z = h.z + off.z;
    const dummy = new THREE.Object3D();
    dummy.position.set(x, y, z); dummy.updateMatrix();
    lanMesh.setMatrixAt(i, dummy.matrix);
    col.setHex(0x554433); lanMesh.setColorAt(i, col);
    const light = new THREE.PointLight(0xffb35c, 0, 17, 2); // sáng ấm, không đổ bóng
    light.position.set(x, y, z); light.visible = false;
    scene.add(light);
    lanterns.push({ light, x, z, idx: i });
  }
  lanMesh.instanceMatrix.needsUpdate = true;
  if (lanMesh.instanceColor) lanMesh.instanceColor.needsUpdate = true;
  scene.add(lanMesh);
}
const _lc = new THREE.Color(), _ld = [];
export function updateLanterns() { // mỗi frame: chọn ≤4 đèn trong 25m gần player nhất, sáng theo độ đêm
  const n = DN.night;
  const on = n > 0.12;
  _ld.length = 0;
  for (const L of lanterns) {
    const d = Math.hypot(L.x - P.x, L.z - P.z);
    if (d < 25) _ld.push([d, L]);
  }
  _ld.sort((a, b) => a[0] - b[0]);
  const lit = new Set();
  for (let i = 0; i < Math.min(4, _ld.length); i++) lit.add(_ld[i][1]);
  for (const L of lanterns) {
    const isLit = on && lit.has(L);
    L.light.visible = isLit; // visible=false → renderer bỏ hẳn khỏi shader, không tốn
    // G4 (r186): PointLight physical tính theo candela, suy hao 1/d² — đo thực nghiệm
    // vũng sáng dưới đèn lồng: r149 legacy @2.4 cho (174,193,118), r186 cần @44 để khớp
    if (isLit) L.light.intensity = 44 * n * (globalThis.__q3Ram ? 2 : 1); // Q3 lễ hội Trăng Rằm: đêm rằm đèn sáng gấp đôi (cờ do actors.js bật mỗi frame)
    _lc.setHex(isLit ? 0xffdca8 : (on ? 0x6a5a44 : 0x554433));
    lanMesh.setColorAt(L.idx, _lc);
  }
  lanMesh.instanceColor.needsUpdate = true;
}

// [M6-TESTABLE-START] — M6 (học Terraria): bảng "Lời hứa làng" ở sân làng.
// Block thuần túy (không đụng THREE/DOM) để test bằng node.
const M6_BOARD_POS = { x: -6, z: -6 }; // sân làng gần trung tâm: cách đường đất 12.5m,
  // cách nhà gần nhất 8.1m, đất phẳng (dốc 0) — không chôn trong nhà/cây/đường
const M6_READ_DIST = 4; // player lại gần <4m thì hiện gợi ý đọc
const M6_BOARD_TITLE = 'LỜI HỨA LÀNG';
const M6_BOARD_LINES = [ // đúng 2 dòng nội dung trên mặt bảng
  '∞ chỉ đổi đồ trang trí',
  'không bao giờ bán sức mạnh',
];
function m6BoardShouldHint(dist) { // có hiện gợi ý "Đọc bảng" ở khoảng cách dist không?
  return dist < M6_READ_DIST;
}
// [M6-TESTABLE-END]

// ---------- M6. Bảng "Lời hứa làng" ở sân làng (học Terraria) ----------
// Terraria treo "bảng luật" trong game để cam kết với người chơi; INFINIA làm
// tương tự: tấm bảng gỗ ở sân làng ghi rõ ∞ chỉ đổi đồ trang trí, không bán sức mạnh.
// Tốn đúng 1 draw call cho tấm bảng (1 Mesh + 1 material); 2 cột gỗ gộp 1 InstancedMesh.
const m6BoardTex = canvasTex(512, 256, (g, w, h) => { // mặt bảng: ván gỗ tone ấm + chữ tiếng Việt to rõ
  const shades = ['#8a5a30', '#7f5228', '#8a5a30', '#845630']; // 4 tấm ván ngang
  for (let i = 0; i < 4; i++) {
    g.fillStyle = shades[i]; g.fillRect(0, i * 64, w, 64);
    g.fillStyle = 'rgba(58,36,16,0.9)'; g.fillRect(0, i * 64, w, 3); // khe ván
    g.strokeStyle = 'rgba(58,36,16,0.35)'; g.lineWidth = 2; // vân gỗ nhẹ
    for (let k = 0; k < 3; k++) {
      const y = i * 64 + 16 + k * 18;
      g.beginPath(); g.moveTo(8, y);
      g.bezierCurveTo(w * 0.3, y - 6, w * 0.6, y + 6, w - 8, y - 3);
      g.stroke();
    }
  }
  g.strokeStyle = '#3a2410'; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16); // khung khắc chìm
  g.strokeStyle = 'rgba(255,233,176,0.25)'; g.lineWidth = 2; g.strokeRect(17, 17, w - 34, h - 34);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const ink = (txt, y, font, color) => { // chữ có viền tối — đọc rõ trên nền gỗ
    g.font = font;
    g.lineWidth = 6; g.strokeStyle = '#3a2410'; g.strokeText(txt, w / 2, y);
    g.fillStyle = color; g.fillText(txt, w / 2, y);
  };
  ink(M6_BOARD_TITLE, 60, 'bold 54px sans-serif', '#ffe9b0'); // vàng nhạt ấm — hợp tone làng quê
  g.fillStyle = '#3a2410'; g.fillRect(w / 2 - 120, 98, 240, 3); // đường phân cách
  ink(M6_BOARD_LINES[0], 146, 'bold 34px sans-serif', '#fff3d6');
  ink(M6_BOARD_LINES[1], 194, 'bold 34px sans-serif', '#fff3d6');
});
{
  const bx = M6_BOARD_POS.x, bz = M6_BOARD_POS.z;
  const gy = groundHeight(bx, bz);
  const sign = new THREE.Group();
  sign.position.set(bx, gy, bz);
  sign.rotation.y = Math.atan2(0 - bx, 0 - bz); // mặt chữ hướng về trung tâm làng
  // 2 cột gỗ — gộp 1 InstancedMesh (1 draw call)
  const posts = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.16, 2.0, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x6e4a2a, roughness: 0.95 }), 2);
  const _d = new THREE.Object3D();
  for (let i = 0; i < 2; i++) {
    _d.position.set(i === 0 ? -0.85 : 0.85, 1.0, 0);
    _d.rotation.set(0, 0, 0); _d.scale.set(1, 1, 1); _d.updateMatrix();
    posts.setMatrixAt(i, _d.matrix);
  }
  posts.castShadow = true; posts.frustumCulled = false;
  posts.instanceMatrix.needsUpdate = true;
  sign.add(posts);
  // Tấm bảng — 1 Mesh + 1 material (MeshBasicMaterial: chữ luôn rõ cả ngày lẫn đêm) = đúng 1 draw call
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 1.3, 0.1),
    new THREE.MeshBasicMaterial({ map: m6BoardTex }));
  board.position.set(0, 1.75, 0);
  board.castShadow = true;
  sign.add(board);
  scene.add(sign);
  obstacles.push({ x: bx, z: bz, r: 1.2 }); // player/NPC không đi xuyên bảng
}
// Gợi ý "Đọc bảng" khi player lại gần (<4m) — overlay DOM tự tạo trong world.js
// (không sửa ui.js; không import makeLabel/drawLabel từ actors.js để tránh vòng lặp module).
const m6HintEl = document.createElement('div');
m6HintEl.textContent = '📖 Đọc bảng — Lời hứa làng';
m6HintEl.style.cssText = [
  'position:fixed', 'left:50%', 'bottom:20%', 'transform:translateX(-50%)',
  'padding:10px 20px', 'border-radius:999px', 'background:rgba(20,14,8,0.80)',
  'color:#ffe9b0', 'border:1px solid #a4763a', 'font:15px sans-serif',
  'z-index:60', 'pointer-events:none', 'display:none', 'white-space:nowrap',
].join(';');
document.body.appendChild(m6HintEl);
let m6HintShown = false;
setInterval(() => { // kiểm tra 4 lần/giây — đủ mượt, không tốn frame render
  const show = m6BoardShouldHint(Math.hypot(P.x - M6_BOARD_POS.x, P.z - M6_BOARD_POS.z));
  if (show !== m6HintShown) { m6HintShown = show; m6HintEl.style.display = show ? 'block' : 'none'; }
}, 250);

// ---------- VN. Bản sắc Việt (v11): cổng làng, lũy tre, ruộng lúa, ao sen, trâu/gà, dừa ----------
// Học Stardew/A Short Hike (research 2026-10-07): tam giác landmark Đình–Ao–Tre để
// không bao giờ lạc; ranh giới bằng thiên nhiên (tre) thay vì tường; nước fake bằng
// plane + canvas (không reflection pass — rẻ trên mobile); NPC/vật procedural.
// GIỮ gameplay: chỉ thêm cảnh + obstacle, không đụng quest/combat/NPC logic.
export const vnAnimals = []; // {update(dt)} — main.js gọi mỗi frame qua updateVNAnimals()
export let luyTreMesh = null, luyLaMesh = null; // lũy tre — tool ?shot= ẩn khi chụp
export let vnTrau = null; // Q3: tay nắm trâu Cà Phê cho quest "Trâu ơi" (actors.js dắt đi/về)
{
  // VN-1. Cổng làng tam quan ở lối vào phía nam (gần điểm spawn 0,34)
  const cong = buildCongLang(vnTexCache);
  const cgx = 0, cgz = 30;
  cong.position.set(cgx, groundHeight(cgx, cgz), cgz);
  cong.rotation.y = Math.PI; // mặt chữ hướng ra ngoài làng (vào làng đọc được)
  scene.add(cong);
  obstacles.push({ x: cgx - 1.8, z: cgz, r: 1.0 }, { x: cgx + 1.8, z: cgz, r: 1.0 }); // 2 trụ chắn

  // VN-2. Lũy tre bao quanh làng (r=34, chừa 4 lối đường N/S/E/W rộng ~6m)
  // Tre = "tường mềm" làng quê (MAP-DESIGN nguyên tắc 5). 1 InstancedMesh duy nhất.
  const treGeo = new THREE.CylinderGeometry(0.09, 0.12, 7, 6);
  const treMat = new THREE.MeshStandardMaterial({ color: 0x4a7a3a, roughness: 0.9 });
  const treLaGeo = new THREE.ConeGeometry(1.1, 2.2, 6);
  const treLaMat = new THREE.MeshStandardMaterial({ color: 0x2f7a35, roughness: 1 });
  const spots = [];
  for (let a = 0; a < Math.PI * 2; a += 0.055) { // ~114 bụi quanh vòng
    const deg = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    // Chừa lối: 0°=đông, 90°=nam, 180°=tây, 270°=bắc (rộng ±0.09 rad ≈ 3m mỗi bên)
    const ganLoi = [0, Math.PI / 2, Math.PI, Math.PI * 1.5].some((loi) => {
      let d = Math.abs(deg - loi); if (d > Math.PI) d = Math.PI * 2 - d;
      return d < 0.10;
    });
    if (ganLoi) continue;
    const r = 34 + Math.sin(a * 7) * 1.5; // lượn nhẹ tự nhiên
    spots.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  // VN: export để tool ?shot= ẩn khi chụp (chỉ phiên chụp, gameplay giữ nguyên)
  luyTreMesh = new THREE.InstancedMesh(treGeo, treMat, spots.length * 3);
  luyLaMesh = new THREE.InstancedMesh(treLaGeo, treLaMat, spots.length);
  const luyTre = luyTreMesh, luyLa = luyLaMesh;
  const _v = new THREE.Object3D();
  let ti = 0, li = 0;
  spots.forEach(([x, z], si) => {
    const gy = groundHeight(x, z);
    for (let k = 0; k < 3; k++) { // mỗi bụi 3 thân chụm
      _v.position.set(x + (k - 1) * 0.35, gy + 3.2, z + ((si + k) % 3 - 1) * 0.3);
      _v.rotation.set((k - 1) * 0.06, 0, (k % 2 ? 0.05 : -0.05));
      _v.scale.set(1, 0.9 + ((si + k) % 3) * 0.15, 1);
      _v.updateMatrix(); luyTre.setMatrixAt(ti++, _v.matrix);
    }
    _v.position.set(x, gy + 6.2, z); _v.rotation.set(0, 0, 0); _v.scale.set(1.2, 1, 1.2);
    _v.updateMatrix(); luyLa.setMatrixAt(li++, _v.matrix);
    if (si % 8 === 0) obstacles.push({ x, z, r: 1.6 }); // chắn thưa — không lọt qua tre
  });
  luyTre.count = ti; luyLa.count = li;
  luyTre.castShadow = true; luyTre.frustumCulled = luyLa.frustumCulled = false;
  luyTre.instanceMatrix.needsUpdate = luyLa.instanceMatrix.needsUpdate = true;
  scene.add(luyTre, luyLa);

  // VN-3. Ruộng lúa phía tây (x -52→-30, 4 ô 8×8m, bờ đất đi được)
  // Fake nước: plane xanh phản chiếu màu trời (không RT pass — học repo cozy-isle).
  const ruongTex = vnRuongTex();
  const luaGeo = new THREE.ConeGeometry(0.09, 0.7, 5);
  const luaMat = new THREE.MeshStandardMaterial({ color: 0x6fa03c, roughness: 1 });
  const luaMoc = [];
  [[-46, -6], [-46, 4], [-36, -6], [-36, 4]].forEach(([rx, rz]) => {
    const ruong = new THREE.Mesh(new THREE.BoxGeometry(8, 0.3, 8),
      new THREE.MeshStandardMaterial({ map: ruongTex, roughness: 1 }));
    ruong.position.set(rx, groundHeight(rx, rz) + 0.05, rz);
    ruong.receiveShadow = true;
    scene.add(ruong);
    for (let ix = -3; ix <= 3; ix++) for (let iz = -3; iz <= 3; iz++) { // 49 khóm/ô
      if ((ix + iz) % 2) continue;
      luaMoc.push([rx + ix * 1.0, rz + iz * 1.0]);
    }
  });
  const luaMesh = new THREE.InstancedMesh(luaGeo, luaMat, luaMoc.length);
  luaMoc.forEach(([x, z], i) => {
    _v.position.set(x, groundHeight(x, z) + 0.45, z);
    _v.rotation.set(0, (i * 1.7) % 3.14, 0); _v.scale.set(1, 0.8 + (i % 5) * 0.12, 1);
    _v.updateMatrix(); luaMesh.setMatrixAt(i, _v.matrix);
  });
  luaMesh.instanceMatrix.needsUpdate = true;
  luaMesh.frustumCulled = false;
  scene.add(luaMesh);

  // VN-4. Ao sen: lá sen + hoa sen trên mặt ao đông (POND 48,40)
  // Lá: tròn có khía (CircleGeometry thetaLength), hoa: 2 tầng cánh hồng.
  const laSenMat = new THREE.MeshStandardMaterial({ map: vnLaSenTex(), roughness: 0.9, side: THREE.DoubleSide });
  const laGeo = new THREE.CircleGeometry(0.55, 10, 0.3, 5.6);
  const laSen = new THREE.InstancedMesh(laGeo, laSenMat, 16);
  const hoaHong = new THREE.MeshStandardMaterial({ color: 0xf2a0b5, roughness: 0.7, side: THREE.DoubleSide });
  const hoaTrang = new THREE.MeshStandardMaterial({ color: 0xfdf3ec, roughness: 0.7, side: THREE.DoubleSide });
  const hoaMesh = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.4, r = 1 + (i % 5) * 0.9;
    const x = POND.x + Math.cos(a) * r, z = POND.z + Math.sin(a) * r;
    const y = pondBaseY - 1.05; // mặt nước (world.js: waterY = pondBaseY - 1.15, lá nổi +0.1)
    _v.position.set(x, y, z); _v.rotation.set(-Math.PI / 2, 0, (i * 2.3) % 3.14);
    _v.scale.setScalar(0.7 + (i % 4) * 0.25);
    _v.updateMatrix(); laSen.setMatrixAt(i, _v.matrix);
    if (i % 3 === 0) { // 6 hoa sen (cánh nón úp 2 tầng)
      const hoa = new THREE.Group();
      const t1 = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.4, 8), i % 2 ? hoaTrang : hoaHong);
      t1.position.y = 0.25;
      const t2 = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.3, 8), i % 2 ? hoaHong : hoaTrang);
      t2.position.y = 0.45;
      const dai = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 5),
        new THREE.MeshStandardMaterial({ color: 0x3f8a3c }));
      dai.position.y = 0;
      hoa.add(t1, t2, dai);
      hoa.position.set(x, y, z);
      scene.add(hoa);
      hoaMesh.push(hoa);
    }
  }
  laSen.instanceMatrix.needsUpdate = true;
  laSen.frustumCulled = false;
  scene.add(laSen);
  vnAnimals.push({ update(dt, t) { // hoa sen đung đưa theo sóng
    hoaMesh.forEach((h, i) => { h.rotation.y = Math.sin(t * 0.8 + i * 1.3) * 0.3; });
  } });

  // VN-5. Trâu + gà: trâu đứng ruộng phía nam, gà chạy quanh sân nhà
  const trau = buildTrau();
  trau.group.position.set(-6, groundHeight(-6, 30), 30);
  trau.group.rotation.y = 0.8;
  scene.add(trau.group);
  vnAnimals.push(trau);
  vnTrau = trau; // Q3: giữ tay nắm để quest dắt trâu đi lạc / dắt về (actors.js)
  obstacles.push({ x: -6, z: 30, r: 1.4, trau: true }); // không đi xuyên trâu (Q3: chắn này dời theo trâu)
  const gaDan = [];
  [[3, 18, 0], [12, -8, 1], [-12, -14, 0]].forEach(([gx, gz, mau], gi) => {
    const ga = buildGa(mau);
    ga.group.position.set(gx, groundHeight(gx, gz), gz);
    scene.add(ga.group);
    gaDan.push({ ga, cx: gx, cz: gz, a: gi * 2.1, r: 2 + gi });
  });
  vnAnimals.push({ update(dt) { // gà đi vòng tròn quanh sân, mổ thóc
    gaDan.forEach((gd) => {
      gd.a += dt * 0.35;
      const nx = gd.cx + Math.cos(gd.a) * gd.r, nz = gd.cz + Math.sin(gd.a) * gd.r;
      gd.ga.group.position.set(nx, groundHeight(nx, nz), nz);
      gd.ga.group.rotation.y = Math.atan2(-Math.sin(gd.a), Math.cos(gd.a)) + Math.PI / 2;
      gd.ga.update(dt, true);
    });
  } });

  // VN-6. Dừa trên cây cau gần ao (type 3 trong 60m quanh ao): 3 quả/cây, 1 InstancedMesh
  const duaSpots = [];
  for (const t of treeData) {
    if (t.type !== 3) continue;
    if (Math.hypot(t.x - POND.x, t.z - POND.z) > 60) continue;
    for (let k = 0; k < 3; k++) duaSpots.push([t, k]);
  }
  if (duaSpots.length) {
    const duaMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.18, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x6e5a2e, roughness: 0.9 }), duaSpots.length);
    duaSpots.forEach(([t, k], i) => {
      const a = (k / 3) * Math.PI * 2 + t.ry;
      _v.position.set(t.x + Math.cos(a) * 0.4 * t.s, t.y + 4.0 * t.s, t.z + Math.sin(a) * 0.4 * t.s);
      _v.rotation.set(0, 0, 0); _v.scale.setScalar(t.s);
      _v.updateMatrix(); duaMesh.setMatrixAt(i, _v.matrix);
    });
    duaMesh.instanceMatrix.needsUpdate = true;
    duaMesh.frustumCulled = false;
    scene.add(duaMesh);
  }
}
// VN: vòng update trâu/gà/sen — main.js gọi mỗi frame (chỉ visual, không đụng gameplay)
export function updateVNAnimals(dt, t) {
  for (const a of vnAnimals) a.update(dt, t);
}

// ---------- VIL. 3 công trình Hồi sinh làng (v16): giếng–cầu–đèn ----------
// Mỗi công trình có PHẦN GỐC (đổ nát, luôn hiện) + PHẦN MỚI (ẩn, hiện khi dân
// làng góp ∞ xây xong qua vilShow). Vị trí né 6 nhà (r=15) và bảng M6 (-6,-6).
export const vilSites = [
  { id: 'gieng', x: 0, z: 0 },     // giếng giữa làng
  { id: 'cau', x: 41, z: 40 },     // cầu ra ao sen (từ bờ về phía tâm ao POND 48,40)
  { id: 'den', x: -4, z: -12 },    // đèn đình cạnh sân làng
];
export const vilUp = {}; // id → Group phần mới (vilShow(id) bật lên)
{
  const daMat = new THREE.MeshStandardMaterial({ color: 0x8a8a86, roughness: 1 });
  const goMat = new THREE.MeshStandardMaterial({ map: vnTexCache.go, roughness: 0.85 });
  const ngoiMat = new THREE.MeshStandardMaterial({ map: vnTexCache.ngoi, roughness: 0.85 });
  // 1) GIẾNG: vành đá + nước đen (gốc) / mái ngói + gáo (mới)
  {
    const g = new THREE.Group(); g.position.set(0, groundHeight(0, 0), 0);
    const vanh = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 0.7, 10, 1, true), daMat);
    vanh.position.y = 0.35; vanh.castShadow = vanh.receiveShadow = true;
    const nuoc = new THREE.Mesh(new THREE.CircleGeometry(0.85, 12),
      new THREE.MeshStandardMaterial({ color: 0x0d1a24, roughness: 0.3 }));
    nuoc.rotation.x = -Math.PI / 2; nuoc.position.y = 0.15;
    g.add(vanh, nuoc);
    const moi = new THREE.Group(); // mái + trục + gáo
    [-0.8, 0.8].forEach((x) => {
      const cot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 2.2, 6), goMat);
      cot.position.set(x, 1.1, 0); cot.castShadow = true; moi.add(cot);
    });
    const m1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 1.1), ngoiMat);
    m1.position.set(0, 2.35, -0.4); m1.rotation.x = 0.5; m1.castShadow = true;
    const m2 = m1.clone(); m2.position.z = 0.4; m2.rotation.x = -0.5;
    const truc = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), goMat);
    truc.rotation.z = Math.PI / 2; truc.position.y = 1.7;
    const gao = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.25), goMat);
    gao.position.set(0.3, 1.2, 0);
    moi.add(m1, m2, truc, gao);
    moi.visible = false;
    g.add(moi); scene.add(g);
    vilUp.gieng = moi;
    obstacles.push({ x: 0, z: 0, r: 1.5 });
  }
  // 2) CẦU AO: 2 cọc bờ (gốc) / sàn ván + lan can ra mặt nước (mới)
  {
    const wy = (pondBaseY === null ? groundHeight(POND.x, POND.z) : pondBaseY) - 1.05;
    [-0.7, 0.7].forEach((dz) => {
      const coc = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.2, 6), goMat);
      coc.position.set(41, wy + 0.3, 40 + dz); coc.castShadow = true;
      scene.add(coc);
    });
    const moi = new THREE.Group();
    for (let k = 0; k < 6; k++) { // 6 tấm ván từ bờ (x=41) ra ao (x=46)
      const van = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 1.7), goMat);
      van.position.set(41.4 + k * 0.85, wy + 0.35, 40);
      van.castShadow = van.receiveShadow = true;
      moi.add(van);
    }
    [-0.8, 0.8].forEach((dz) => { // lan can 1 bên
      const tay = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.07, 0.07), goMat);
      tay.position.set(43.7, wy + 1.1, 40 + dz);
      moi.add(tay);
      for (let k = 0; k < 3; k++) {
        const thanh = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.75, 0.07), goMat);
        thanh.position.set(41.8 + k * 1.9, wy + 0.7, 40 + dz);
        moi.add(thanh);
      }
    });
    moi.visible = false;
    scene.add(moi);
    vilUp.cau = moi;
  }
  // 3) ĐÈN ĐÌNH: cột trơ (gốc) / đèn lồng giấy đỏ phát sáng (mới, emissive — không thêm PointLight cho nhẹ)
  {
    const gy = groundHeight(-4, -12);
    const cot = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 2.6, 7), goMat);
    cot.position.set(-4, gy + 1.3, -12); cot.castShadow = true;
    scene.add(cot);
    const moi = new THREE.Group();
    const tay = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.2), goMat);
    tay.position.set(-4, gy + 2.5, -12);
    const long = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8),
      new THREE.MeshStandardMaterial({ map: vnDenLongTex('An'), emissive: 0xff9a3d, emissiveIntensity: 0.9 }));
    long.position.set(-4, gy + 2.15, -11.6);
    moi.add(tay, long);
    moi.visible = false;
    scene.add(moi);
    vilUp.den = moi;
    obstacles.push({ x: -4, z: -12, r: 0.6 });
  }
}
export function vilShow(id) { // bật phần mới của công trình (gọi khi góp đủ ∞, và khi load save đã xây)
  if (vilUp[id]) vilUp[id].visible = true;
}

// VN-7. Chum sành + giỏ tre trước mỗi nhà (học repo cozy-isle: decor kể chuyện)
// Chum: thân tròn nâu sành; giỏ: trụ nan tre. 2 InstancedMesh cho cả 6 nhà.
{
  const chumGeo = new THREE.SphereGeometry(0.42, 10, 8);
  const chumMat = new THREE.MeshStandardMaterial({ color: 0x7a4a30, roughness: 0.85 });
  const chum = new THREE.InstancedMesh(chumGeo, chumMat, 12);
  const gioGeo = new THREE.CylinderGeometry(0.32, 0.24, 0.4, 10);
  const gioMat = new THREE.MeshStandardMaterial({ map: vnTexCache.go, color: 0xd9b95c, roughness: 0.9 });
  const gio = new THREE.InstancedMesh(gioGeo, gioMat, 6);
  const _d = new THREE.Object3D();
  let ci = 0, gi = 0;
  houses.forEach((h, hi) => { // houses.forEach giữ đúng pattern test g8-art duyệt decor mọi nhà
    const a = (hi / 6) * Math.PI * 2 + 0.35;
    const hry = -a + Math.PI / 2;
    const cy = Math.cos(hry), sn = Math.sin(hry);
    const L2W = (lx, lz) => [h.x + lx * cy + lz * sn, h.z - lx * sn + lz * cy];
    [[-2.2, 1.2], [2.3, 0.6]].forEach(([lx, lz]) => { // 2 chum bên hiên
      const [wx, wz] = L2W(lx, lz);
      _d.position.set(wx, groundHeight(wx, wz) + 0.35, wz);
      _d.scale.set(1, 1.15, 1); _d.rotation.set(0, 0, 0); _d.updateMatrix();
      chum.setMatrixAt(ci++, _d.matrix);
    });
    const [gx, gz] = L2W(1.8, 2.8); // 1 giỏ tre cạnh chum
    _d.position.set(gx, groundHeight(gx, gz) + 0.2, gz);
    _d.scale.set(1, 1, 1); _d.rotation.set(0, 0, 0); _d.updateMatrix();
    gio.setMatrixAt(gi++, _d.matrix);
  });
  chum.count = ci; gio.count = gi;
  chum.castShadow = true;
  chum.frustumCulled = gio.frustumCulled = false;
  chum.instanceMatrix.needsUpdate = gio.instanceMatrix.needsUpdate = true;
  scene.add(chum, gio);
}
