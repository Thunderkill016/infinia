// js/utils.js — hàm thuần + hằng số testable của INFINIA
// 9 TESTABLE blocks trích NGUYÊN VĂN từ app.js (giữ marker để tools/gen-test-appjs.py tạo app.js cho tests).
// Các module khác import { tên } từ đây. File này KHÔNG import gì (self-contained).

// [T1-TESTABLE-START] — T1 tối ưu tốc độ: logic thuần đo hiệu năng + hằng số tinh chỉnh
// (hàm thuần, test đọc đoạn này — không dùng THREE/browser, không đụng gameplay)
const T1_LOAD_BUDGET_MS = 10000; // L1: mục tiêu load <10s (mạng 3G)
const T1_FPS_WINDOW_S = 5;       // cửa sổ trung bình lăn cho FPS sustained
const T1_SHADOW_HALF = 40;       // F1: shadow camera bám player ±40 (thu từ ±70)
const T1_LABEL_W = 128, T1_LABEL_H = 32; // F2: canvas nhãn NPC 128×32 (từ 256×64; tỉ lệ 4:1 giữ nguyên)
function ffGlowCount(level) { return level === 'med' ? 4 : 8; } // F3: preset Vừa giảm glow đom đóm 8→4
function measureLoadMs(navStartMs, firstFrameMs) { // thời gian load thật (ms, không âm)
  return Math.max(0, Math.round(firstFrameMs - navStartMs));
}
function fmtFps(fps) { // HUD FPS: luôn hiện số, không bao giờ "--"
  return 'fps: ' + (Number.isFinite(fps) ? Math.round(fps) : 0);
}
function sustainedFps(dts) { // FPS sustained: tổng frame / tổng thời gian trong cửa sổ 5s lăn
  let n = 0, sum = 0; // duyệt từ mới nhất về cũ, dừng khi đủ 5s
  for (let i = dts.length - 1; i >= 0 && sum < T1_FPS_WINDOW_S; i--) { n++; sum += dts[i]; }
  if (n < 2 || sum <= 0) return 0;
  return n / sum;
}
function labelDrawSpec(text, measurePx) { // thuần: spec vẽ nhãn 128×32 (test được với measurePx giả)
  // tỉ lệ font so với bản 256×64: 30→15, giới hạn rộng 224→112, min 18→9, tâm (64,17)
  let size = 15;
  const font = (s) => `bold ${s}px "DejaVu Sans", "Segoe UI", system-ui, sans-serif`;
  while (measurePx(font(size)) > T1_LABEL_W - 16 && size > 9) size -= 1;
  return {
    size, font: font(size),
    pill: [4, 3, T1_LABEL_W - 8, T1_LABEL_H - 6, 13], // nền pill mờ: x,y,w,h,r
    cx: T1_LABEL_W / 2, cy: T1_LABEL_H / 2 + 1,       // tâm chữ
  };
}
// [T1-TESTABLE-END]
export { T1_LOAD_BUDGET_MS, T1_FPS_WINDOW_S, T1_SHADOW_HALF, T1_LABEL_W, T1_LABEL_H, ffGlowCount, measureLoadMs, fmtFps, sustainedFps, labelDrawSpec };

// [V5-TESTABLE-START] — hàm thuần ngày–đêm, test đọc đoạn này (không dùng THREE/browser)
// t: 0=bình minh 6h · 0.25=trưa · 0.5=hoàng hôn 18h · 0.75=nửa đêm
const DN_KEYS = [
  { t: 0.00, top: 0x4a6fa5, mid: 0xf2a56b, bot: 0xffc27a, sunC: 0xffb36b, sunI: 1.6, hemiS: 0xb8a8e8, hemiG: 0x7a6a55, hemiI: 0.4, fog: 0xf0cfa0, star: 0,   water: 0x7fb2d9 },
  { t: 0.10, top: 0x3a7bd5, mid: 0x9ecfee, bot: 0xd8ecf5, sunC: 0xfff3d0, sunI: 1.5, hemiS: 0xb8d4f0, hemiG: 0x8a7a5a, hemiI: 0.32, fog: 0xd8e8ee, star: 0,   water: 0x4d9bd6 },
  { t: 0.25, top: 0x2f7fd1, mid: 0x8ec8ee, bot: 0xcfe8f5, sunC: 0xffffff, sunI: 1.6, hemiS: 0xa8c8f0, hemiG: 0x9a8a5a, hemiI: 0.35,  fog: 0xcfe4ee, star: 0,   water: 0x3d9bd6 },
  { t: 0.40, top: 0x3a7bd5, mid: 0x9ecfee, bot: 0xffd9a8, sunC: 0xffdca8, sunI: 1.45, hemiS: 0xc0b8e8, hemiG: 0x8a7a5a, hemiI: 0.32, fog: 0xf3d9a8, star: 0,   water: 0x4d9bd6 },
  { t: 0.50, top: 0x5a4a9e, mid: 0xf27a5b, bot: 0xff9a5b, sunC: 0xff8a4d, sunI: 1.4, hemiS: 0xc898e8, hemiG: 0x6a5a4a, hemiI: 0.38,  fog: 0xe8a06b, star: 0,   water: 0xb06a7a },
  { t: 0.58, top: 0x1a2440, mid: 0x3a4a7a, bot: 0x5a5a8a, sunC: 0x8a9fc9, sunI: 0.35, hemiS: 0x3a4a6a, hemiG: 0x1a1a2a, hemiI: 0.3,  fog: 0x2a3450, star: 1,   water: 0x1a2a4a },
  { t: 0.75, top: 0x060a1a, mid: 0x0d1830, bot: 0x14203a, sunC: 0x7a8fc9, sunI: 0.25, hemiS: 0x2a3a5a, hemiG: 0x101018, hemiI: 0.22, fog: 0x1a2236, star: 1,   water: 0x0d1830 },
  { t: 0.92, top: 0x1a2440, mid: 0x3a4a7a, bot: 0x8a6a8a, sunC: 0xd8a0a0, sunI: 0.6, hemiS: 0x6a5a8a, hemiG: 0x3a3232, hemiI: 0.35, fog: 0x4a4458, star: 0.4, water: 0x2a3a5a },
];
function lerpHex(a, b, k) { // nội suy màu hex từng kênh RGB — hàm thuần
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * k), g = Math.round(ag + (bg - ag) * k), bl = Math.round(ab + (bb - ab) * k);
  return (r << 16) | (g << 8) | bl;
}
function dayNightAt(t) { // t∈[0,1) → màu/cường độ đã nội suy — hàm thuần, wrap quanh 1→0
  t = ((t % 1) + 1) % 1;
  const K = DN_KEYS;
  let i = K.length - 1;
  for (let k = 0; k < K.length; k++) {
    const t0 = K[k].t, t1 = (k + 1 < K.length) ? K[k + 1].t : 1;
    if (t >= t0 && t < t1) { i = k; break; }
  }
  const a = K[i], b = K[(i + 1) % K.length];
  const t0 = a.t, t1 = (i + 1 < K.length) ? b.t : 1;
  const k = (t1 > t0) ? (t - t0) / (t1 - t0) : 0;
  const out = {};
  for (const f of ['top', 'mid', 'bot', 'sunC', 'hemiS', 'hemiG', 'fog', 'water'])
    out[f] = lerpHex(a[f], b[f], k);
  for (const f of ['sunI', 'hemiI', 'star'])
    out[f] = a[f] + (b[f] - a[f]) * k;
  return out;
}
// [V5-TESTABLE-END]
export { DN_KEYS, lerpHex, dayNightAt };

// [G1-TESTABLE-START] — hàm thuần bloom giả, test đọc đoạn này (không dùng THREE/browser)
// (dòng chú thích này bị test bỏ qua như mẫu v5)
const BLOOM = { on: true }; // mặc định BẬT; preset Thấp vẫn ép tắt (xem bloomAllowed)
function glowIntensity(night, base) { // night∈[0,1] từ DN.night: ban ngày mờ, ban đêm rõ
  const n = Math.min(1, Math.max(0, night));
  return base * (0.18 + 0.82 * n);
}
function bloomAllowed(qualityLevel, bloomOn) { // preset Thấp tắt bloom luôn để giữ FPS
  return !!bloomOn && qualityLevel !== 'low';
}
function toggleBloom(current) { return !current; } // phím B đổi trạng thái
function glowTextureSpec() { // spec texture glow: tâm đặc → viền trong suốt, vẽ bằng canvas
  return {
    size: 128,
    stops: [
      { o: 0.00, a: 1.00 },
      { o: 0.25, a: 0.85 },
      { o: 0.60, a: 0.32 },
      { o: 1.00, a: 0.00 },
    ],
  };
}
// [G1-TESTABLE-END]
export { BLOOM, glowIntensity, bloomAllowed, toggleBloom, glowTextureSpec };

// [G2-TESTABLE-START] — hàm thuần LOD, test đọc đoạn này (không dùng THREE/browser)
// (dòng chú thích này bị test bỏ qua như mẫu v5/G1)
const LOD_HYST = 5; // hysteresis ±5m
const LOD_THRESH = { // ngưỡng {near, far} theo preset chất lượng
  low:  { near: 30, far: 60 },  // Thấp: hung hăng — hạ LOD sớm để giữ FPS
  med:  { near: 40, far: 80 },  // Vừa (mặc định mobile)
  high: { near: 50, far: 100 }, // Cao: thoáng hơn, giữ chi tiết xa
};
function lodThresholds(qualityLevel) { // preset lạ/chưa set → dùng Vừa cho an toàn
  return LOD_THRESH[qualityLevel] || LOD_THRESH.med;
}
function pickLOD(dist, prevLevel, th) {
  // dist: khoảng cách tới camera; prevLevel: mức hiện tại (−1 khi chưa tính lần nào).
  const near = th.near, far = th.far;
  if (prevLevel === 0) return dist > near + LOD_HYST ? 1 : 0; // gần: vượt near+5 mới hạ
  if (prevLevel === 1) {                                     // giữa: 2 biên
    if (dist < near - LOD_HYST) return 0;                     // lùi < near−5 → về full
    if (dist > far + LOD_HYST) return 2;                      // vượt far+5 → cull
    return 1;
  }
  if (prevLevel === 2) return dist < far - LOD_HYST ? 1 : 2;  // xa: lại < far−5 mới hiện
  return dist > far ? 2 : dist > near ? 1 : 0;                // lần đầu: chọn thẳng, không hyst
}
function grassVisibleAt(dist, th) { // cỏ/hoa là "chi tiết" → chỉ hiện trong tầm gần (+hyst)
  return dist <= th.near + LOD_HYST;
}
// [G2-TESTABLE-END]
export { LOD_HYST, LOD_THRESH, lodThresholds, pickLOD, grassVisibleAt };

// [G8-TESTABLE-START] — cấu hình thuần G8, test đọc đoạn này (không dùng THREE/browser)
// (dòng chú thích này bị test bỏ qua như mẫu v5/G1/G2)
// Mỗi part: m = mesh đích ('trunk'|'leaf'|'leaftop'|'leafda' ở L0; 'trunk'|'leafsimp' ở L1),
// dx/dz = lệch ngang (× s), y = độ cao tâm (× s), sx/sy = tỉ lệ so với cây thường.
const TREE_TYPES = [
  { // 0: cây thường — 2 tầng nón, công thức gốc v4 giữ nguyên
    name: 'thuong', vn: 'Cây thường',
    parts: [
      { m: 'trunk',   y: 1.20, sx: 1,   sy: 1 },
      { m: 'leaf',    y: 3.44, sx: 1,   sy: 1 },
      { m: 'leaftop', y: 5.25, sx: 1,   sy: 1 },
    ],
    simple: [
      { m: 'trunk',    y: 1.20, sx: 1, sy: 1 },
      { m: 'leafsimp', y: 3.44, sx: 1, sy: 1 },
    ],
  },
  { // 1: cây đa — thân mập lùn, tán rộng dẹt 2 tầng
    name: 'da', vn: 'Cây đa',
    parts: [
      { m: 'trunk',  y: 0.84, sx: 1.7, sy: 0.70 },
      { m: 'leafda', y: 2.00, sx: 1.5, sy: 1    }, // tán dưới rộng
      { m: 'leafda', y: 3.10, sx: 1.0, sy: 0.85 }, // tán trên nhỏ hơn
    ],
    simple: [
      { m: 'trunk',    y: 0.84, sx: 1.7, sy: 0.70 },
      { m: 'leafsimp', y: 2.40, sx: 1.7, sy: 0.75 },
    ],
  },
  { // 2: bụi tre — 3 thân mảnh cao, chùm lá nhỏ trên mỗi ngọn
    name: 'tre', vn: 'Bụi tre',
    parts: [
      { m: 'trunk',   dx: 0.35, dz: 0.10,  y: 2.00, sx: 0.50, sy: 1.70 },
      { m: 'trunk',   dx: -0.30, dz: 0.25, y: 1.90, sx: 0.45, sy: 1.60 },
      { m: 'trunk',   dx: 0.05, dz: -0.35, y: 2.10, sx: 0.55, sy: 1.75 },
      { m: 'leaftop', dx: 0.35, dz: 0.10,  y: 4.35, sx: 0.80, sy: 0.70 },
      { m: 'leaftop', dx: -0.30, dz: 0.25, y: 4.15, sx: 0.70, sy: 0.65 },
      { m: 'leaftop', dx: 0.05, dz: -0.35, y: 4.55, sx: 0.85, sy: 0.75 },
    ],
    simple: [
      { m: 'trunk',    y: 2.00, sx: 0.60, sy: 1.70 },
      { m: 'leafsimp', y: 4.30, sx: 0.85, sy: 0.60 },
    ],
  },
  { // 3: cây cau — thân mảnh cao, tàu lá xòe ngang trên ngọn
    name: 'cau', vn: 'Cây cau',
    parts: [
      { m: 'trunk',  y: 1.85, sx: 0.55, sy: 1.55 },
      { m: 'leafda', y: 4.15, sx: 1.10, sy: 0.60 }, // tàu lá dẹt xòe
    ],
    simple: [
      { m: 'trunk',    y: 1.85, sx: 0.55, sy: 1.55 },
      { m: 'leafsimp', y: 4.10, sx: 0.95, sy: 0.50 },
    ],
  },
];
function pickTreeType(r) { // r ∈ [0,1): 50% thường, 20% đa, 15% tre, 15% cau
  return r < 0.5 ? 0 : r < 0.7 ? 1 : r < 0.85 ? 2 : 3;
}
// Ngân sách hiệu năng G8: mesh mới = draw call mới (mỗi InstancedMesh = 1 draw call
// khi visible). Cây +1 (leafDaL0), decor +4 (fence/cloth/pot/potFlower) = +5 ≤ 6.
const G8_DRAW_CALL_BUDGET = 6;
const G8_NEW_MESHES = ['leafDaL0', 'fenceMesh', 'clothMesh', 'potMesh', 'potFlowerMesh'];
// [G8-TESTABLE-END]
export { TREE_TYPES, pickTreeType, G8_DRAW_CALL_BUDGET, G8_NEW_MESHES };

// [G3-TESTABLE-START] — logic ngoại hình NPC G3, hàm thuần, test đọc đoạn này (không dùng THREE/browser)
const G3_HAT_COUNT = 4;   // 0 nón lá, 1 khăn đóng, 2 mũ rơm, 3 không đội
const G3_HAIR_COLOR_COUNT = 4; // 0 đen, 1 hoa râm, 2 bạc, 3 nâu
const G3_HAIR_STYLE_COUNT = 3; // 0 tóc ngắn, 1 tóc dài, 2 hói
const G3_ROBE_COUNT = 7;  // khớp mảng ROBES ở trên
function hash01(seq, salt) { // băm số nguyên → [0,1), ổn định qua mọi lần tải (không dùng Math.random)
  let h = Math.imul(seq + 1, 2654435761) ^ Math.imul(salt + 1, 40503);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}
function npcLook(seq) { // ngoại hình đầy đủ của 1 NPC, deterministic theo seq — gọi bao nhiêu lần cũng giống nhau
  return {
    hat: Math.floor(hash01(seq, 11) * G3_HAT_COUNT),
    hairColor: Math.floor(hash01(seq, 22) * G3_HAIR_COLOR_COUNT),
    hairStyle: Math.floor(hash01(seq, 33) * G3_HAIR_STYLE_COUNT),
    hScale: 0.9 + hash01(seq, 44) * 0.2,   // chiều cao 0.9–1.1
    wScale: 0.85 + hash01(seq, 55) * 0.35, // độ mập 0.85–1.2
    robeIdx: seq % G3_ROBE_COUNT,          // màu áo — giữ đúng ROBES của v3
  };
}
// [G3-TESTABLE-END]
export { G3_HAT_COUNT, G3_HAIR_COLOR_COUNT, G3_HAIR_STYLE_COUNT, G3_ROBE_COUNT, hash01, npcLook };

// [V1-TESTABLE-START] — logic nhãn tên NPC V1, hàm thuần, test đọc đoạn này (không dùng THREE/browser)
const V1_LABEL_DIST = 8; // nhãn chỉ hiện khi NPC cách player < 8m
function npcLabelText(seq, namedMap) { // seq → tên tiếng Việt, hoặc null nếu NPC vô danh (giữ màn hình sạch)
  return namedMap[seq] ? namedMap[seq].name : null;
}
function npcLabelVisible(dist, name) { // hiện nhãn khi: có tên VÀ khoảng cách < 8m
  return name !== null && dist < V1_LABEL_DIST;
}
// [V1-TESTABLE-END]
export { V1_LABEL_DIST, npcLabelText, npcLabelVisible };

// [P2-TESTABLE-START]
// Logic thuần P2 (không dùng THREE/DOM) — test đọc đoạn này.
// Cửa sổ đêm của game theo DN_KEYS: sao (star) bắt đầu lên từ t≈0.5, =1 từ t=0.58, mờ dần ở t=0.92.
const P2_NIGHT_START = 0.55, P2_NIGHT_END = 0.95;
function isNightAt(t) { // t∈[0,1): true nếu đang trong đêm game
  t = ((t % 1) + 1) % 1;
  return t >= P2_NIGHT_START && t < P2_NIGHT_END;
}
function timeUntilNight(t, dayLen) { // giây tới đầu đêm tiếp theo (0 nếu đang đêm) — dùng để hẹn respawn dơi
  t = ((t % 1) + 1) % 1;
  if (isNightAt(t)) return 0;
  const dt = (t < P2_NIGHT_START) ? (P2_NIGHT_START - t) : (1 - t + P2_NIGHT_START);
  return dt * dayLen;
}
// Số liệu cân bằng P2 (D1 Schell: 4 quái đầu chỉ cần 1 nút đánh; dơi/cua là thử thách cho người đã biết né).
// Quái Vẩn cũ giữ nguyên (hp 60 / atk 6 / xp 15). Dơi: máu ít, đánh hơi đau, nhanh — CHỈ ra ban đêm.
// Cua: máu nhiều, giáp mặt trước, chậm — dạy người chơi né-vòng-ra-sau lưng.
const P2_KINDS = {
  vun: { kind: 'vun', name: 'Quái Vẩn',     hp: 60, atk: 6, def: 0, speed: 1.6, xp: 15, respawn: 20, count: 4 },
  doi: { kind: 'doi', name: 'Dơi Sương Đêm', hp: 45, atk: 8, def: 0, speed: 2.6, xp: 20, respawn: 30, count: 2 },
  cua: { kind: 'cua', name: 'Cua Đá Già',    hp: 80, atk: 7, def: 0, speed: 1.1, xp: 20, respawn: 30, count: 2 },
};
const P2_CRAB_ARMOR = 0.4;               // đánh trúng mặt trước cua → chỉ còn 40% sát thương
const P2_CRAB_FRONT_ARC = Math.PI / 2.4; // ~75°: nửa góc "mặt trước" tính từ hướng nhìn của cua
function angDiff(a, b) { // hiệu góc tuyệt đối đã chuẩn hoá về [0,π] — hàm thuần
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}
function crabFrontFactor(kind, px, pz, mx, mz, mFacing) {
  // Hệ số sát thương khi đánh quái: 0.4 nếu đánh trúng MẶT TRƯỚC cua, 1 nếu đánh sau lưng hoặc quái khác.
  // mFacing: hướng cua đang nhìn (radian, quy ước atan2(dx,dz) như rotation.y của game).
  if (kind !== 'cua') return 1;
  const toPlayer = Math.atan2(px - mx, pz - mz); // hướng từ cua → player
  return angDiff(toPlayer, mFacing) <= P2_CRAB_FRONT_ARC ? P2_CRAB_ARMOR : 1;
}
const P2_BAT_REACH = 1.2; // chênh lệch độ cao tối đa (m) để đòn chém trúng dơi đang bay
function batHittable(kind, my, py) { // my: độ cao dơi, py: độ cao tay player (≈P.y+1) — hàm thuần
  if (kind !== 'doi') return true;
  return Math.abs(my - py) <= P2_BAT_REACH;
}
// [P2-TESTABLE-END]
export { P2_NIGHT_START, P2_NIGHT_END, isNightAt, timeUntilNight, P2_KINDS, P2_CRAB_ARMOR, P2_CRAB_FRONT_ARC, angDiff, crabFrontFactor, P2_BAT_REACH, batHittable };

// [V1b-TESTABLE-START] — hình học dọn hành lang camera cho tool ?shot= (hàm thuần, test được)
const V1B_CLEAR_R = 6; // nửa rộng hành lang dọn cây quanh đoạn camera→player (m)
function segDist2(px, pz, ax, az, bx, bz) { // bình phương khoảng cách từ điểm tới đoạn thẳng
  const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
  let t = l2 ? ((px - ax) * dx + (pz - az) * dz) / l2 : 0;
  t = t < 0 ? 0 : (t > 1 ? 1 : t);
  const qx = ax + dx * t - px, qz = az + dz * t - pz;
  return qx * qx + qz * qz;
}
function shotBlocksView(tx, tz, cx, cz, px, pz, r) { // cây (tx,tz) có chắn đoạn camera→player không
  return segDist2(tx, tz, cx, cz, px, pz) < r * r;
}
// [V1b-TESTABLE-END]
export { V1B_CLEAR_R, segDist2, shotBlocksView };

// smoothstep — hàm thuần nội suy mượt
export function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// [STAT-TESTABLE-START]
// STAT (v17) — sổ kỷ lục làng: đếm cá/boss đã hạ, mốc khoe 10/25/50 (học Balatro M11).
// Thuần túy (không THREE/DOM). stats: {fish, boss} — số thiếu/hỏng coi như 0.
const STAT_MILESTONES = [10, 25, 50];
function statNew() { return { fish: 0, boss: 0 }; }
function statNum(v) { return (Number.isInteger(v) && v >= 0) ? v : 0; }
function statNormalize(s) { // save cũ/thiếu → chuẩn hoá, không crash
  s = (s && typeof s === 'object') ? s : {};
  return { fish: statNum(s.fish), boss: statNum(s.boss) };
}
function statFish(s) { // câu dính 1 con → +1, trả {stats, milestone} (milestone 0 nếu không)
  const n = statNormalize(s);
  n.fish++;
  return { stats: n, milestone: STAT_MILESTONES.includes(n.fish) ? n.fish : 0 };
}
function statBoss(s) { // hạ boss 1 lần → +1, trả {stats, milestone}
  const n = statNormalize(s);
  n.boss++;
  return { stats: n, milestone: STAT_MILESTONES.includes(n.boss) ? n.boss : 0 };
}
function statLine(s) { // dòng khoe cho panel Status
  const n = statNormalize(s);
  return `🐟 Đã câu: ${n.fish} con · 👹 Đã hóa giải boss: ${n.boss} lần`;
}
// [STAT-TESTABLE-END]
export { STAT_MILESTONES, statNew, statNum, statNormalize, statFish, statBoss, statLine };

// [M6A-TESTABLE-START] — tự hạ đồ họa khi máy yếu (học three.js forum K6/K7, v12).
// Thuần túy (không DOM/THREE): ui.js gọi m6aShouldDrop mỗi frame với fps trung bình.
// Chỉ hạ dần (high→med→low), không tự tăng (tránh vòng lặp mờ-nét); người chơi
// tăng lại bằng tay (phím Q) bất cứ lúc nào.
const M6A_LOW_FPS = 40;   // fps trung bình trượt dưới 40 → máy đuối (mục tiêu 30fps+ có đệm)
const M6A_HOLD_S = 3;     // phải đuối LIÊN TỤC 3s mới hạ (tránh hạ nhầm vì lag 1 phát)
const M6A_COOLDOWN_S = 6; // sau mỗi lần hạ, nghỉ 6s mới được hạ tiếp
function m6aLevelBelow(level) { // bậc thấp hơn kế tiếp; đã thấp nhất thì giữ nguyên
  if (level === 'high') return 'med';
  if (level === 'med') return 'low';
  return 'low';
}
function m6aShouldDrop(fpsAvg, belowSecs, level, sinceDropSecs) {
  // level lạ/không có → không hạ (an toàn hơn là hạ bừa)
  if (level !== 'high' && level !== 'med' && level !== 'low') return false;
  if (level === 'low') return false; // đã thấp nhất: không còn gì để hạ
  if (!(fpsAvg < M6A_LOW_FPS)) return false; // fps ổn → giữ nguyên
  if (!(belowSecs >= M6A_HOLD_S)) return false; // chưa đủ 3s liên tục
  if (!(sinceDropSecs >= M6A_COOLDOWN_S)) return false; // đang cooldown sau lần hạ trước
  return true;
}
// [M6A-TESTABLE-END]
export { M6A_LOW_FPS, M6A_HOLD_S, M6A_COOLDOWN_S, m6aLevelBelow, m6aShouldDrop };
