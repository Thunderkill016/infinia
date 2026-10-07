// js/actors.js — player rig, NPC (spawn/anim/nhãn), hội thoại, shop (tách từ app.js, giữ nguyên logic)
import * as THREE from 'three';
import { S, P, DN, Q, fxHooks, saveGame, store } from './core.js';
import { scene } from './engine.js';
import { groundHeight, slopeAt, pondBaseY, obstacles, vnTrau, g5aParseGLB, g5aB64ToBytes, vilSites, vilShow } from './world.js'; // Q3: obstacles + trâu (không cycle); v14: parser GLB; VIL: công trình làng
import { updateHUD, toast, addInf, addXP } from './ui.js';
import { ROBES, NPCN, HAT_COLORS, HAIR_COLORS, NAMED, GENERIC_LINES, SHOP_ITEMS, SAVE_KEY, POND } from './config.js';
import { npcLook, hash01, npcLabelText, npcLabelVisible, labelDrawSpec, T1_LABEL_W, T1_LABEL_H, statFish, q5New, q5Accept, q5TurnIn, q5CanTurnIn, q5TrackerText, q5Migrate, Q5_REWARD_XP, Q5_REWARD_INF } from './utils.js';
import { vnVaiTex, vnNanTreTex, buildNonLa } from './vn.js'; // VN: texture vải + nón lá chi tiết
// ---------- 6. Player: rig người có tay/chân, animation đi bộ procedural (v4) ----------
// buildHumanoid trả về {group, legL, legR, armL, armR, torso, head} — pivot tay/chân đặt ở khớp
// BẢN VIỆT (v11): giữ nguyên khung xương + tên trả về (gameplay/animation không đổi),
// chỉ thêm chi tiết: mặt mũi, áo bà ba có vân vải + cúc, tay áo xắn, quần ống rộng,
// dép rơm, nón lá nan tre có quai. Tất cả texture tự vẽ canvas (0 byte asset).
export function limbMat(color) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
  // VN: áo dùng texture vải để không phẳng lì (quần/da giữ màu trơn cho nhẹ)
  return m;
}
function vnAoBaBaMat(hexColor) { // áo bà ba: texture vân vải theo màu áo
  const c = new THREE.Color(hexColor);
  const base = '#' + c.getHexString();
  const tex = vnVaiTex(base);
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
}
export function makeLimb(r, len, mat) { // capsule treo: pivot ở đầu trên, thân hướng xuống
  const g = new THREE.CapsuleGeometry(r, len, 4, 10);
  g.translate(0, -(len / 2 + r * 0.6), 0);
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true;
  const pivot = new THREE.Group();
  pivot.add(m);
  return pivot;
}
export function buildHumanoidMesh(o) { // o: {shirt, pants, skin, hat}
  const g = new THREE.Group();
  // VN: thân = áo bà ba có vân vải + cổ áo + hàng cúc
  const aoMat = vnAoBaBaMat(o.shirt);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.5, 6, 12), aoMat);
  torso.position.y = 1.3; torso.castShadow = true;
  g.add(torso);
  // VN: cổ áo bà ba (viền đứng) + hàng cúc giữa ngực
  const coAo = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.12, 10),
    limbMat(new THREE.Color(o.shirtD || o.shirt).multiplyScalar(0.8).getHex()));
  coAo.position.y = 1.68;
  g.add(coAo);
  const cucMat = new THREE.MeshBasicMaterial({ color: 0xfff3d0 });
  for (let i = 0; i < 3; i++) {
    const cuc = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 6), cucMat);
    cuc.position.set(0, 1.52 - i * 0.13, 0.335);
    g.add(cuc);
  }
  // VN: đầu có mặt mũi (mắt/mày/miệng vẽ bằng mesh nhỏ — rẻ, rõ trên mobile)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 14, 12), limbMat(o.skin));
  head.position.y = 1.82; head.castShadow = true;
  g.add(head);
  const matDen = new THREE.MeshBasicMaterial({ color: 0x1a1210 });
  const matTrang = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [-1, 1].forEach((s) => { // tròng trắng + con ngươi
    const tr = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), matTrang);
    tr.position.set(s * 0.105, 1.86, 0.235); tr.scale.set(1, 1.15, 0.5);
    g.add(tr);
    const con = new THREE.Mesh(new THREE.SphereGeometry(0.024, 6, 6), matDen);
    con.position.set(s * 0.105, 1.86, 0.275);
    g.add(con);
    const may = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.02, 0.02), matDen);
    may.position.set(s * 0.11, 1.97, 0.245); may.rotation.z = s * -0.12;
    g.add(may);
  });
  const mieng = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.018, 0.02),
    new THREE.MeshBasicMaterial({ color: 0x8a3a30 }));
  mieng.position.set(0, 1.72, 0.25);
  g.add(mieng);
  // VN: tay áo xắn (cổ tay da) + quần ống rộng + dép rơm
  const tayAoMat = vnAoBaBaMat(o.shirtD || o.shirt);
  const legL = makeLimb(0.13, 0.7, limbMat(o.pants)); legL.position.set(-0.17, 0.95, 0);
  const legR = makeLimb(0.13, 0.7, limbMat(o.pants)); legR.position.set(0.17, 0.95, 0);
  const armL = makeLimb(0.11, 0.45, tayAoMat); armL.position.set(-0.44, 1.52, 0);
  const armR = makeLimb(0.11, 0.45, tayAoMat); armR.position.set(0.44, 1.52, 0);
  g.add(legL, legR, armL, armR);
  [-1, 1].forEach((s) => { // bàn tay da + dép rơm (gắn vào chân để đi theo animation)
    const tay = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), limbMat(o.skin));
    tay.position.set(s * 0.44, 0.82, 0);
    tay.castShadow = true;
    g.add(tay);
    const dep = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.3),
      new THREE.MeshStandardMaterial({ map: vnNanTreTex(), roughness: 0.9 }));
    dep.position.set(s * 0.17, 0.05, 0.05);
    g.add(dep);
  });
  // VN: khăn rằn quàng cổ cho player (dấu ấn nông dân Nam Bộ)
  const khan = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.05, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0x7a2e2e, roughness: 0.9 }));
  khan.position.y = 1.62; khan.rotation.x = Math.PI / 2;
  g.add(khan);
  if (o.hat) { // VN: nón lá nan tre chi tiết (thay nón trơn cũ) — giữ nón lá + nhãn tên
    const non = buildNonLa();
    non.position.y = 2.06;
    g.add(non);
    // Quai nón 2 dây xuống cằm
    const quaiMat = new THREE.MeshBasicMaterial({ color: 0x3a2c18 });
    [-1, 1].forEach((s) => {
      const quai = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.3, 0.02), quaiMat);
      quai.position.set(s * 0.2, 1.9, 0.12); quai.rotation.z = s * 0.25;
      g.add(quai);
    });
  }
  return { group: g, legL, legR, armL, armR, torso, head };
}
export const player = new THREE.Group();
export const prig = buildHumanoidMesh({ shirt: 0x2f6fed, shirtD: 0x2456c4, pants: 0x2b3550, skin: 0xf2c89b, hat: true });
player.add(prig.group);
player.position.set(S.x, groundHeight(S.x, S.z), S.z); // phía nam làng, hoặc vị trí từ save
scene.add(player);

// ---------- v14. Model nhân vật 3D THẬT (Kenney Blocky CC0, thay hình khối) ----------
// 4 mẫu (nam/nữ/già/trẻ) × 3 pose (đứng/bước trái/bước phải), đã nướng 1 mesh +
// COLOR_0 (assets/char-*.glb → assets-embedded.js). Đi bộ = đổi pose theo nhịp
// (pose-swap, rẻ hơn skeleton, hợp mobile). Lỗi load → charReady=false → giữ
// đường procedural cũ (prig + instanced parts) nên game không bao giờ trắng hình.
export const CHAR_VARIANTS = ['nam', 'nu', 'ong', 'tre'];
export const CHAR_POSES = 3;
export const CHAR_S = 0.74; // model cao 2.7m → 2.0m vừa khung gameplay cũ
export let charReady = false;
export const charGeos = {}; // "nam-0" → BufferGeometry
function charBuildGeos() {
  try {
    if (typeof INFINIA_MODELS === 'undefined' || !INFINIA_MODELS) return false;
    for (const v of CHAR_VARIANTS) {
      for (let p = 0; p < CHAR_POSES; p++) {
        const key = `char-${v}-${p}.glb`;
        const url = INFINIA_MODELS[key];
        if (typeof url !== 'string' || url.indexOf(',') < 0) return false;
        const g = g5aParseGLB(g5aB64ToBytes(url.slice(url.indexOf(',') + 1)));
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(g.positions, 3));
        geo.setAttribute('normal', new THREE.BufferAttribute(g.normals, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(g.colors, 3));
        geo.setIndex(new THREE.BufferAttribute(g.indices, 1));
        charGeos[`${v}-${p}`] = geo;
      }
    }
    return true;
  } catch (e) {
    console.warn('[CHAR] model nhân vật lỗi, giữ procedural:', e && e.message);
    return false;
  }
}
charReady = charBuildGeos();
if (typeof window !== 'undefined') window.__charReady = charReady;
export const charMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
// Player model thật: 3 pose + nón lá (giữ nón lá — dấu ấn riêng)
export const charPlayer = { group: new THREE.Group(), meshes: [], hat: null };
if (charReady) {
  for (let p = 0; p < CHAR_POSES; p++) {
    const m = new THREE.Mesh(charGeos[`nam-${p}`], charMat);
    m.castShadow = true; m.visible = p === 0;
    charPlayer.meshes.push(m); charPlayer.group.add(m);
  }
  charPlayer.group.scale.setScalar(CHAR_S);
  const non = buildNonLa(); // nón lá nan tre đội trên model thật
  non.position.y = 2.62; non.scale.setScalar(1.15);
  charPlayer.group.add(non); charPlayer.hat = non;
  player.add(charPlayer.group);
  prig.group.visible = false; // ẩn rig procedural cũ
}
export function animateCharPlayer(phase, amp, t, flying) {
  // Đứng yên → pose 0 (+ thở); đi → đảo pose 1/2 theo nhịp bước; bay → pose 1
  if (!charReady) { animateHumanoid(prig, phase, amp, t, flying); return; }
  const pose = amp < 0.12 ? 0 : (flying ? 1 : (Math.floor(phase / Math.PI) % 2 === 0 ? 1 : 2));
  charPlayer.meshes.forEach((m, i) => { m.visible = i === pose; });
  const breathe = amp < 0.12 ? Math.sin(t * 2.1) * 0.03 : Math.abs(Math.cos(phase)) * 0.05 * amp;
  charPlayer.group.position.y = breathe;
  charPlayer.group.rotation.x = flying ? -0.15 : 0;
}
export let tGlobal = 0; // đồng hồ animation chung — main.js ghi qua advanceTGlobal, các module khác chỉ đọc
export function advanceTGlobal(dt) { tGlobal += dt; }
export function animateHumanoid(rig, phase, amp, t, flying) {
  // amp: 0 đứng yên → 1 chạy hết tốc; t: thời gian để thở khi đứng yên
  const s = Math.sin(phase), breathe = Math.sin(t * 2.1) * 0.018;
  rig.legL.rotation.x = s * 0.62 * amp + (flying ? 0.35 : 0);
  rig.legR.rotation.x = -s * 0.62 * amp + (flying ? 0.35 : 0);
  rig.armL.rotation.x = -s * 0.52 * amp + breathe;
  rig.armR.rotation.x = s * 0.52 * amp - breathe;
  rig.armL.rotation.z = flying ? 0.55 : 0.06; // bay: dang tay
  rig.armR.rotation.z = flying ? -0.55 : -0.06;
  rig.torso.position.y = 1.3 + Math.abs(Math.cos(phase)) * 0.045 * amp + breathe;
  rig.head.position.y = 1.82 + Math.abs(Math.cos(phase)) * 0.03 * amp + breathe * 1.4;
}

// ---------- 7. NPC "người dân": state machine đứng yên / đi lang thang ----------
export function makeLabel() { // nhãn tên NPC kiểu game Vô Hạn, vẽ bằng canvas
  // T1/F2: canvas 128×32 (giảm 4× fill cost so với 256×64); tỉ lệ 4:1 giữ nguyên nên sprite scale không đổi
  const c = document.createElement('canvas'); c.width = T1_LABEL_W; c.height = T1_LABEL_H;
  const tex = new THREE.CanvasTexture(c);
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  spr.scale.set(3.6, 0.9, 1); spr.renderOrder = 5;
  return { canvas: c, tex, spr };
}
export function drawLabel(L, text) { // V1: nền pill mờ (đọc được trên nền sáng), chữ sans-serif đủ dấu tiếng Việt
  const g = L.canvas.getContext('2d');
  g.clearRect(0, 0, T1_LABEL_W, T1_LABEL_H);
  const spec = labelDrawSpec(text, (f) => { g.font = f; return g.measureText(text).width; }); // T1/F2: cỡ chữ thuần, test được
  const [px, py, pw, ph, pr] = spec.pill;
  g.fillStyle = 'rgba(10, 8, 6, 0.62)';
  if (g.roundRect) { g.beginPath(); g.roundRect(px, py, pw, ph, pr); g.fill(); }
  else g.fillRect(px, py, pw, ph);
  // Chữ tiếng Việt: sans-serif để đầy đủ dấu trên mọi máy; tự thu nhỏ nếu tên dài (đọc được trên mobile)
  g.font = spec.font;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#ffe9b0'; // vàng nhạt ấm — hợp tone làng quê
  g.fillText(text, spec.cx, spec.cy);
  L.tex.needsUpdate = true;
}
export const npcs = [];
// v4: NPC dùng chung 6 InstancedMesh (thân/đầu/tay/chân) — 25 NPC chỉ tốn 6 draw calls.
// G3: thêm 3 InstancedMesh mũ/tóc (nón lá+mũ rơm / khăn đóng / tóc) — NPC đa dạng, tổng +3 draw calls.
// Mỗi NPC có rig Object3D ẩn (không add vào scene); mỗi frame copy matrixWorld vào instance.
export const rigTorsoGeo = new THREE.CapsuleGeometry(0.34, 0.5, 6, 10);
export const rigHeadGeo = new THREE.SphereGeometry(0.27, 12, 10);
export const rigArmGeo = new THREE.CapsuleGeometry(0.11, 0.45, 4, 8); rigArmGeo.translate(0, -0.32, 0);
export const rigLegGeo = new THREE.CapsuleGeometry(0.13, 0.7, 4, 8); rigLegGeo.translate(0, -0.48, 0);
// VN (v11): áo NPC có vân vải (texture trắng nhân với màu instance nên vẫn giữ màu ROBES cũ)
const vnNpcVaiTex = vnVaiTex('#ffffff');
export const iTorso = new THREE.InstancedMesh(rigTorsoGeo, new THREE.MeshStandardMaterial({ map: vnNpcVaiTex, roughness: 0.9 }), NPCN);
export const iHead  = new THREE.InstancedMesh(rigHeadGeo,  new THREE.MeshStandardMaterial({ roughness: 0.8 }), NPCN);
export const iArmL  = new THREE.InstancedMesh(rigArmGeo,   new THREE.MeshStandardMaterial({ map: vnNpcVaiTex, roughness: 0.9 }), NPCN);
export const iArmR  = new THREE.InstancedMesh(rigArmGeo,   new THREE.MeshStandardMaterial({ map: vnNpcVaiTex, roughness: 0.9 }), NPCN);
export const iLegL  = new THREE.InstancedMesh(rigLegGeo,   new THREE.MeshStandardMaterial({ roughness: 0.9 }), NPCN);
export const iLegR  = new THREE.InstancedMesh(rigLegGeo,   new THREE.MeshStandardMaterial({ roughness: 0.9 }), NPCN);
export const npcParts = [iTorso, iHead, iArmL, iArmR, iLegL, iLegR];
// VN (v11): mắt NPC — 1 InstancedMesh (2 mắt/NPC), bay theo đầu, +1 draw call cho cả 25 NPC
export const eyeGeo = new THREE.SphereGeometry(0.035, 6, 6);
export const iEye = new THREE.InstancedMesh(eyeGeo, new THREE.MeshBasicMaterial({ color: 0x1a1210 }), NPCN * 2);
// G3: mũ + tóc — 3 InstancedMesh dùng chung geometry, per-instance khác màu/scale để đa dạng
export const hatConeGeo = new THREE.ConeGeometry(0.5, 0.34, 10); // nón lá / mũ rơm (đổi màu + scale vành)
export const iHat = new THREE.InstancedMesh(hatConeGeo, new THREE.MeshStandardMaterial({ roughness: 0.9 }), NPCN);
export const hatWrapGeo = new THREE.TorusGeometry(0.23, 0.11, 8, 14); hatWrapGeo.rotateX(Math.PI / 2); // khăn đóng
export const iHatWrap = new THREE.InstancedMesh(hatWrapGeo, new THREE.MeshStandardMaterial({ roughness: 0.9 }), NPCN);
export const hairGeo = new THREE.SphereGeometry(0.285, 10, 6, 0, Math.PI * 2, 0, 1.45); // mũ tóc úp lên đầu
export const iHair = new THREE.InstancedMesh(hairGeo, new THREE.MeshStandardMaterial({ roughness: 0.95 }), NPCN);
export const npcExtra = [iHat, iHatWrap, iHair]; // +3 draw calls cho cả 25 NPC
for (const m of npcExtra) {
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  m.castShadow = true;
  m.frustumCulled = false; // instance rải khắp map — tắt culling sai
  scene.add(m);
}
export const ZERO_M = new THREE.Matrix4().makeScale(0, 0, 0); // ma trận ẩn instance (không đội mũ / hói)
export const _hm = new THREE.Matrix4(), _hv = new THREE.Vector3();
for (const m of npcParts) {
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  m.castShadow = true;
  m.frustumCulled = false; // instance rải khắp map — tắt culling sai
  scene.add(m);
}
// VN: mắt NPC — không đổ bóng (nhỏ), tắt culling như các part khác
iEye.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
iEye.frustumCulled = false;
scene.add(iEye);
export function makeRigRoot() { // khung xương ẩn: pivot tay/chân ở khớp để đu đưa
  const root = new THREE.Object3D();
  const mk = (x, y) => { const o = new THREE.Object3D(); o.position.set(x, y, 0); root.add(o); return o; };
  const head = mk(0, 1.82);
  const hatA = new THREE.Object3D(); hatA.position.set(0, 0.3, 0); head.add(hatA); // neo mũ — bay theo đầu
  const hairA = new THREE.Object3D(); hairA.position.set(0, 0.04, -0.01); head.add(hairA); // neo tóc
  return { root,
    legL: mk(-0.17, 0.95), legR: mk(0.17, 0.95),
    armL: mk(-0.44, 1.52), armR: mk(0.44, 1.52),
    torso: mk(0, 1.3), head, hatA, hairA };
}
{
  const _nc = new THREE.Color();
  for (let i = 0; i < NPCN; i++) {
    const rig = makeRigRoot();
    const g = rig.root; // giữ tên g để code position/rotation cũ không đổi
    const L = makeLabel();
    scene.add(L.spr); // nhãn bay theo, cập nhật vị trí mỗi frame
    // Spawn quanh làng, tránh dốc cao
    let x = 0, z = 0, tries = 0;
    do {
      const a = Math.random() * Math.PI * 2, r = 10 + Math.random() * 55;
      x = Math.cos(a) * r; z = Math.sin(a) * r; tries++;
    } while (slopeAt(x, z) > 0.6 && tries < 40);
    g.position.set(x, groundHeight(x, z), z);
    const npc = { g, L, ...rig, x, z, state: 'idle', timer: 1 + Math.random() * 3,
                  tx: x, tz: z, speed: 1.4 + Math.random() * 1.2, seq: i,
                  phase: Math.random() * 6.28, moving: false };
    // G3: ngoại hình deterministic theo seq — mũ/tóc/dáng/màu áo, ổn định qua mọi lần tải
    const look = npcLook(i);
    // G3: chỉnh tay 2 NPC có tên cho hợp nhân vật (vẫn deterministic, không random)
    if (i === 1) { look.hat = 3; look.hairStyle = 0; look.hairColor = 0; look.hScale = 0.9; } // Cu Tít: trẻ con tóc ngắn, không đội mũ
    if (i === 5) { look.wScale = 1.15; } // Chú Sáu Búa: thợ rèn vạm vỡ
    npc.look = look;
    g.scale.set(look.wScale, look.hScale, look.wScale); // dáng cao/thấp/gầy/mập
    // Màu áo phân biệt từng NPC (giữ đúng ROBES của v3)
    _nc.setHex(ROBES[look.robeIdx]);
    iTorso.setColorAt(i, _nc);
    _nc.multiplyScalar(0.7);
    iArmL.setColorAt(i, _nc); iArmR.setColorAt(i, _nc);
    _nc.setHex(0x2e2a33);
    iLegL.setColorAt(i, _nc); iLegR.setColorAt(i, _nc);
    _nc.setHex(0xf2c89b).offsetHSL(0, 0, (hash01(i, 66) - 0.5) * 0.06); // da — deterministic
    iHead.setColorAt(i, _nc);
    // Màu mũ/tóc theo loại đã băm
    if (look.hat === 1) { _nc.setHex(HAT_COLORS[1]); iHatWrap.setColorAt(i, _nc); }
    else if (look.hat === 0 || look.hat === 2) { _nc.setHex(HAT_COLORS[look.hat]); iHat.setColorAt(i, _nc); }
    _nc.setHex(HAIR_COLORS[look.hairColor]); iHair.setColorAt(i, _nc);
    // V1: không vẽ ID debug nữa — nhãn tên được updateLabels() gán khi NPC đủ gần (<8m); ban đầu ẩn
    L.spr.visible = false;
    npcs.push(npc);
  }
  for (const m of npcParts) if (m.instanceColor) m.instanceColor.needsUpdate = true;
  for (const m of npcExtra) if (m.instanceColor) m.instanceColor.needsUpdate = true;
}
// ---------- v14. NPC model thật: 4 mẫu × 3 pose = 12 InstancedMesh ----------
// Mỗi NPC 1 instance duy nhất (thay 6 part rời). Pose theo trạng thái đi/đứng.
// Mẫu theo nhân vật (NPC có tên khớp tuổi/giới, vô danh xoay vòng deterministic).
export const charMeshes = {}; // "nam-0" → InstancedMesh
const CHAR_NAMED = { 0: 'nu', 1: 'tre', 2: 'ong', 3: 'nu', 4: 'ong', 5: 'nam', 6: 'nu', 7: 'nam', 8: 'nam' };
if (charReady) {
  for (const v of CHAR_VARIANTS) {
    for (let p = 0; p < CHAR_POSES; p++) {
      const im = new THREE.InstancedMesh(charGeos[`${v}-${p}`], charMat, NPCN);
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      im.castShadow = true; im.frustumCulled = false;
      im.count = 0; im.visible = false;
      scene.add(im);
      charMeshes[`${v}-${p}`] = im;
    }
  }
  for (const m of npcParts) { m.count = 0; m.visible = false; } // ẩn rig procedural cũ
  iEye.count = 0; iEye.visible = false; // model thật đã có mắt vẽ sẵn
}
for (const n of npcs) n.charV = CHAR_NAMED[n.seq] || CHAR_VARIANTS[n.seq % CHAR_VARIANTS.length];
// Animation NPC: đi thì tay chân đu đưa, đứng thì thở nhẹ; copy matrix vào instance
export function updateNPCAnim(dt) {
  for (const n of npcs) {
    if (n.moving) n.phase += dt * (2.5 + n.speed * 1.6);
    const sw = n.moving ? Math.sin(n.phase) * 0.55 : 0;
    const br = Math.sin(tGlobal * 2.1 + n.seq * 1.7) * 0.018; // thở
    n.legL.rotation.x = sw; n.legR.rotation.x = -sw;
    n.armL.rotation.x = -sw * 0.8 + br; n.armR.rotation.x = sw * 0.8 - br;
    n.torso.position.y = 1.3 + Math.abs(Math.cos(n.phase)) * 0.04 * (n.moving ? 1 : 0) + br;
    n.head.position.y = 1.82 + br * 1.4;
    n.g.updateMatrixWorld(true);
    const lk = n.look;
    if (charReady) {
      // v14: model thật — 1 matrix/người vào mesh mẫu+pose (đứng=0, đi đảo 1/2 theo nhịp)
      const pose = n.moving ? (Math.floor(n.phase / Math.PI) % 2 === 0 ? 1 : 2) : 0;
      const im = charMeshes[`${n.charV}-${pose}`];
      im._n = (im._n || 0);
      _hm.makeRotationY(n.g.rotation.y);
      _hm.scale(_hv.set(CHAR_S * n.g.scale.x, CHAR_S * n.g.scale.y, CHAR_S * n.g.scale.z));
      _hm.setPosition(n.x, n.g.position.y, n.z);
      im.setMatrixAt(im._n++, _hm);
    } else {
      iTorso.setMatrixAt(n.seq, n.torso.matrixWorld);
      iHead.setMatrixAt(n.seq, n.head.matrixWorld);
      iArmL.setMatrixAt(n.seq, n.armL.matrixWorld);
      iArmR.setMatrixAt(n.seq, n.armR.matrixWorld);
      iLegL.setMatrixAt(n.seq, n.legL.matrixWorld);
      iLegR.setMatrixAt(n.seq, n.legR.matrixWorld);
    }
    // G3: mũ/tóc bay theo đầu qua neo hatA/hairA — instance nào không dùng thì ẩn (scale 0)
    if (lk.hat === 0 || lk.hat === 2) { // nón lá / mũ rơm: cone
      _hm.copy(n.hatA.matrixWorld);
      if (lk.hat === 2) _hm.scale(_hv.set(1.35, 0.55, 1.35)); // mũ rơm vành rộng, thấp hơn
      iHat.setMatrixAt(n.seq, _hm);
      iHatWrap.setMatrixAt(n.seq, ZERO_M);
    } else if (lk.hat === 1) { // khăn đóng: torus
      iHatWrap.setMatrixAt(n.seq, n.hatA.matrixWorld);
      iHat.setMatrixAt(n.seq, ZERO_M);
    } else { // không đội mũ
      iHat.setMatrixAt(n.seq, ZERO_M);
      iHatWrap.setMatrixAt(n.seq, ZERO_M);
    }
    if (lk.hairStyle === 2) { // hói: ẩn tóc
      iHair.setMatrixAt(n.seq, ZERO_M);
    } else {
      _hm.copy(n.hairA.matrixWorld);
      if (lk.hairStyle === 1) _hm.scale(_hv.set(1, 1.4, 1)); // tóc dài phủ xuống
      iHair.setMatrixAt(n.seq, _hm);
    }
    // VN: 2 mắt bám theo đầu (rig procedural cũ; model thật đã có mắt nên bỏ qua)
    if (charReady) { n.L.spr.position.set(n.x, n.g.position.y + 2.6 * lk.hScale, n.z); continue; }
    n.head.getWorldPosition(_hv);
    const ry = n.g.rotation.y, cw = Math.cos(ry), sw2 = Math.sin(ry);
    const ox = 0.105 * lk.wScale, oy = 0.04 * lk.hScale, oz = 0.235 * lk.wScale;
    for (let e = 0; e < 2; e++) {
      const sx = e === 0 ? -ox : ox;
      const wx = _hv.x + sx * cw + oz * sw2;
      const wz = _hv.z - sx * sw2 + oz * cw;
      const wy = _hv.y + oy;
      _hm.makeTranslation(wx, wy, wz);
      iEye.setMatrixAt(n.seq * 2 + e, _hm);
    }
    n.L.spr.position.set(n.x, n.g.position.y + 2.6 * lk.hScale, n.z);
  }
  p1TickVeggieMarkers(); // P1: marker rau bay bổng khi quest đang active (trước đây comment nói gọi mà chưa gọi)
  q3Tick(dt); // Q3: marker trâu + dắt theo player + cờ đêm rằm (mỗi frame, cùng chỗ với P1)
  if (charReady) { // v14: chốt count/visible cho 12 mesh mẫu-pose
    for (const k of Object.keys(charMeshes)) {
      const im = charMeshes[k], n = im._n || 0;
      im.count = n; im.visible = n > 0; im._n = 0;
      im.instanceMatrix.needsUpdate = true;
    }
  } else {
    for (const m of npcParts) m.instanceMatrix.needsUpdate = true;
    iEye.instanceMatrix.needsUpdate = true;
  }
  for (const m of npcExtra) m.instanceMatrix.needsUpdate = true;
}
export function npcPickTarget(n) { // chọn điểm đến mới, tránh dốc cao (như bug "NPC kẹt" của game gốc)
  for (let t = 0; t < 8; t++) {
    const a = Math.random() * Math.PI * 2, r = 8 + Math.random() * 26;
    const tx = n.x + Math.cos(a) * r, tz = n.z + Math.sin(a) * r;
    if (Math.abs(tx) > 100 || Math.abs(tz) > 100) continue;
    const dh = Math.abs(groundHeight(tx, tz) - groundHeight(n.x, n.z));
    if (dh / Math.max(r, 1) > 0.55) continue; // dốc quá -> bỏ
    n.tx = tx; n.tz = tz; return;
  }
  n.state = 'idle'; n.timer = 2; // không tìm được đường: đứng yên
}
// P5: chọn điểm đến cho NPC — NPC có tên loanh quanh gần điểm đến theo lịch (trong vòng
// P5_LOITER_R của nhà/chỗ làm, không bỏ đi xa); NPC vô danh giữ hành vi cũ (npcPickTarget).
// Không thuần (dùng groundHeight + Math.random) nên nằm NGOÀI block testable —
// test kiểm tra tích hợp qua regex (updateNPCs gọi p5PickTarget).
export function p5PickTarget(n) {
  if (n._p5 && n._p5At) {
    for (let t = 0; t < 8; t++) {
      const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * (P5_LOITER_R - 1);
      const tx = n._p5At[0] + Math.cos(a) * r, tz = n._p5At[1] + Math.sin(a) * r;
      if (Math.abs(tx) > 100 || Math.abs(tz) > 100) continue;
      const dh = Math.abs(groundHeight(tx, tz) - groundHeight(n.x, n.z));
      if (dh / Math.max(r, 1) > 0.55) continue; // dốc quá → bỏ (cùng luật với npcPickTarget)
      n.tx = tx; n.tz = tz; n.state = 'walk'; return;
    }
    n.state = 'idle'; n.timer = 2; // không tìm được chỗ loanh quanh: đứng yên
    return;
  }
  npcPickTarget(n); // NPC vô danh: hành vi cũ
}
// [F4-TESTABLE-START]
// F4 — NPC xa update AI thưa: NPC cách player > F4_FAR_DIST chỉ chạy logic AI ở F4_HZ Hz
// thay vì 60Hz (cắt ~70% CPU hàm updateNPCs). Animation (updateNPCAnim) và nhãn tên
// (updateLabels 0.5s) chạy riêng, không bị ảnh hưởng.
const F4_FAR_DIST = 30;   // mét — ngưỡng khoảng cách 2D player→NPC để giảm tần số AI
const F4_HZ = 10;         // Hz — tần số AI cho NPC xa
const F4_INTERVAL = 1 / F4_HZ; // 0.1s — khoảng thời gian giữa 2 lần chạy AI của NPC xa
// Helper thuần: dist = khoảng cách 2D tới player (m), timer = thời gian tích lũy (s)
// từ lần AI trước. Trả true → bỏ qua phần AI nhịp này; false → chạy AI.
function f4ShouldSkip(dist, timer) {
  if (dist <= F4_FAR_DIST) return false; // NPC gần: update AI mỗi frame như cũ
  return timer < F4_INTERVAL;             // NPC xa: skip nếu chưa đủ 0.1s
}
// [F4-TESTABLE-END]

// [P5-TESTABLE-START]
// P5 — lịch sinh hoạt NPC có tên theo giờ ngày/đêm (học Stardew Valley):
// sáng (6h–18h) NPC đi BỘ tới chỗ làm (đồng/ruộng/ao/chợ), tối (18h–6h) đi bộ về nhà.
// Không teleport: chỉ khi NPC cách điểm đến >60m (hiếm — vd sau debug) mới "đi nhanh"
// gấp 3 lần. NPC vô danh giữ hành vi cũ. Tương thích F4: điểm đến được tính lại mỗi
// nhịp AI (kể cả nhịp 10Hz của NPC xa) nên đổi ca không bao giờ trôi; tương thích G3
// (chỉ đổi vị trí, không đụng ngoại hình).

// Giờ đổi ca trong ngày (0–24)
export const P5_MORNING_HOUR = 6;   // 6h sáng: rời nhà → chỗ làm
export const P5_EVENING_HOUR = 18;  // 18h tối: rời chỗ làm → về nhà
// Sau khi tới nơi, NPC loanh quanh trong vòng này quanh điểm đến (vẫn sống động, không bỏ đi xa)
export const P5_LOITER_R = 4;       // mét
// Ngưỡng "quá xa" → đi nhanh thay vì đi bộ thường (giữ nguyên tắc không teleport)
export const P5_FAST_DIST = 60;     // mét
export const P5_FAST_K = 3;         // hệ số tốc độ khi quá xa

// Chỗ làm của 9 NPC có tên theo nghề (COT_TRUYEN) — tọa độ đọc từ layout làng hiện tại:
// hub giếng (0,0), sân đình quanh (0,0), ao đông POND(48,40) (config.js), ruộng phía tây
// (x<0), rừng tre phía bắc (z<0), đồng cỏ phía nam (z>0). "Nhà" lấy từ NAMED[seq].home.
// Bà Tám Xén (seq 3): nhà == hàng xén → 2 vị trí trùng nhau, giữ nguyên hành vi NPC shop
// đứng yên (không gán _p5 ở runtime).
export const P5_SPOTS = {
  0: { work: [0, 0],      place: 'giếng làng' },          // Bà Lụa — bà lão ra giếng sinh hoạt
  1: { work: [-6, 30],    place: 'đồng cỏ chăn trâu' },   // Cu Tít — chăn trâu Cà Phê
  2: { work: [5, -7],     place: 'sân đình' },            // Ông Đồ Nho — dạy học ngoài sân đình
  3: { work: [14, 8],     place: 'hàng xén' },            // Bà Tám Xén — nhà == shop, đứng yên bán hàng
  4: { work: [-3, -5],    place: 'đình làng' },           // Cụ Chánh Tín — trưởng làng ở đình
  5: { work: [11, -15],   place: 'lò rèn' },              // Chú Sáu Búa — lò rèn sau nhà
  6: { work: [-22, -34],  place: 'vườn thuốc rừng tre' },// Cô Lan Thảo — hái thuốc phía bắc
  7: { work: [44, 51],    place: 'bến Phúc' },           // Chú Tư Lưới — đánh cá bờ ao đông
  8: { work: [-44, -8],   place: 'ruộng lúa' },          // Anh Hai Ruộng — cày ruộng phía tây
};

// Đổi DN.t (0–1) ra giờ trong ngày (0–24). daynight.js: t=0 bình minh (~6h), 0.25 trưa
// (~12h), 0.5 hoàng hôn (~18h), 0.75 nửa đêm (~0h) → giờ = (t*24 + 6) % 24.
export function p5HourOfDay(t) { return (t * 24 + 6) % 24; }

// Ca theo giờ: 'work' (6h–18h) hoặc 'home' (18h–6h). Thuần — test được độc lập.
export function p5ShiftAt(hour) {
  return (hour >= P5_MORNING_HOUR && hour < P5_EVENING_HOUR) ? 'work' : 'home';
}

// Điểm đến của NPC theo ca: home = NAMED[seq].home (truyền vào để hàm thuần, không import),
// work = P5_SPOTS[seq].work. Trả null → NPC giữ hành vi cũ (NPC vô danh: seq không có trong
// P5_SPOTS; Bà Tám Xén: runtime không gán _p5 nên hàm này không bao giờ được gọi cho bà).
export function p5DestFor(seq, home, t) {
  const spot = P5_SPOTS[seq];
  if (!spot || !spot.work) return null;
  return p5ShiftAt(p5HourOfDay(t)) === 'work' ? spot.work : home;
}

// NPC có cần "đi nhanh" không: chỉ khi cách điểm đến > 60m (hiếm — vd sau debug dịch chuyển).
export function p5NeedsFast(dist) { return dist > P5_FAST_DIST; }

// Một bước di chuyển thuần: gần → đi bộ thường (speed*dt), xa >60m → nhanh gấp 3.
// Không bao giờ nhảy cóc: bước đi luôn ≤ speed*P5_FAST_K*dt (không teleport).
export function p5StepDist(dist, speed, dt) {
  return Math.min(dist, speed * (p5NeedsFast(dist) ? P5_FAST_K : 1) * dt);
}
// [P5-TESTABLE-END]
export function updateNPCs(dt) {
  for (const n of npcs) {
    if (n.state === 'shop') { // v3: NPC bán hàng đứng yên tại chỗ
      n.g.position.set(n.x, groundHeight(n.x, n.z), n.z);
      continue;
    }
    // F4: NPC xa (>30m) chỉ chạy AI 10Hz — tích lũy timer, đủ 0.1s mới chạy 1 nhịp
    const distP = Math.hypot(n.x - P.x, n.z - P.z); // khoảng cách 2D tới player
    if (distP > F4_FAR_DIST) {
      n._aiHz = (n._aiHz || 0) + dt; // cộng dồn thời gian từ nhịp AI trước
      if (f4ShouldSkip(distP, n._aiHz)) continue; // chưa đủ 0.1s → bỏ qua phần AI
      n._aiHz = 0; // đủ 0.1s → chạy AI rồi reset timer
    } else {
      n._aiHz = 0; // NPC gần: reset timer, AI chạy mỗi frame như cũ
    }
    n.moving = false; // v4: reset, walk sẽ bật lại
    // P5: NPC có tên theo lịch sinh hoạt — mỗi nhịp AI tính lại điểm đến theo ca hiện tại
    // (DN.t → giờ → 'work'/'home'). Tính lại mỗi nhịp nên NPC xa (F4 chỉ update 10Hz) vẫn
    // đổi ca đúng giờ, không trôi trạng thái. Đổi ca → đi BỘ tới điểm mới (không teleport).
    if (n._p5) {
      const dest = p5DestFor(n.seq, NAMED[n.seq].home, DN.t);
      if (dest && (!n._p5At || n._p5At[0] !== dest[0] || n._p5At[1] !== dest[1])) {
        n._p5At = [dest[0], dest[1]]; // copy — không giữ tham chiếu mảng dùng chung trong P5_SPOTS
        n.tx = dest[0]; n.tz = dest[1];
        n.state = 'walk';
      }
    }
    if (n.state === 'idle') {
      n.timer -= dt;
      if (n.timer <= 0) { p5PickTarget(n); if (n.state !== 'idle') n.state = 'walk'; }
    } else { // walk
      const dx = n.tx - n.x, dz = n.tz - n.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.6) { n.state = 'idle'; n.timer = 2 + Math.random() * 4; continue; }
      // P5: NPC theo lịch đi bộ thường; chỉ khi cách điểm đến >60m (hiếm) mới đi nhanh ×3.
      // NPC vô danh: giữ nguyên Math.min(d, speed*dt) như cũ.
      const step = n._p5 ? p5StepDist(d, n.speed, dt) : Math.min(d, n.speed * dt);
      n.x += (dx / d) * step; n.z += (dz / d) * step;
      n.g.rotation.y = Math.atan2(dx, dz); // quay mặt theo hướng đi
      n.moving = true; // v4: đang đi → animation đu tay chân
    }
    // NPC đẩy nhau nhẹ để không chồng lấn
    for (const m of npcs) {
      if (m === n) continue;
      const dx = n.x - m.x, dz = n.z - m.z, d2 = dx * dx + dz * dz;
      if (d2 < 1.1 && d2 > 0.0001) {
        const d = Math.sqrt(d2), push = (1.05 - d) * 0.5;
        n.x += (dx / d) * push; n.z += (dz / d) * push;
      }
    }
    n.g.position.set(n.x, groundHeight(n.x, n.z), n.z);
  }
}
// V1: cập nhật nhãn tên NPC mỗi ~0.5s (không vẽ lại mỗi frame cho đỡ tốn) —
// chỉ NPC có tên VÀ cách player <8m mới hiện nhãn; NPC vô danh không có nhãn (màn hình sạch)
export let labelTick = 0;
export function updateLabels(dt) {
  if (!window.__lblCall) { window.__lblCall = 1; console.log('[T1] dbg3: updateLabels ĐƯỢC GỌI, dt=' + dt); }
  labelTick += dt;
  if (labelTick < 0.5) return;
  if (!window.__lblLoop) { window.__lblLoop = 1; console.log('[T1] dbg4: updateLabels VÀO VÒNG LẶP'); }
  labelTick = 0;
  for (const n of npcs) {
    const name = npcLabelText(n.seq, NAMED);
    const show = npcLabelVisible(Math.hypot(n.x - P.x, n.z - P.z), name);
    n.L.spr.visible = show;
    if (n.seq === 0 && !window.__lblDbg) { window.__lblDbg = 1;
      console.log('[T1] dbg2: set visible=' + show + ' L=' + !!n.L + ' spr=' + !!n.L.spr
        + ' now=' + n.L.spr.visible + ' dist=' + Math.hypot(n.x - P.x, n.z - P.z).toFixed(1)); }
    if (show) {
      if (n._labelText !== name) { drawLabel(n.L, name); n._labelText = name; } // vẽ lại chỉ khi tên đổi
    } else n._labelText = null;
  }
}

// ---------- 7b. NPC có tên (quest "Làm quen làng", theo COT_TRUYEN_VA_LAU_DAI) ----------
// Đặt 9 NPC có tên ở vị trí cố định quanh làng để dễ tìm
for (const seq of Object.keys(NAMED)) {
  const n = npcs[+seq], cfg = NAMED[seq];
  n.x = cfg.home[0]; n.z = cfg.home[1];
  n.g.position.set(n.x, groundHeight(n.x, n.z), n.z);
}
// v3: Bà Tám Xén (seq 3) đứng yên bán hàng, không lang thang
npcs[3].isShop = true;
npcs[3].state = 'shop';
npcs[3].g.rotation.y = Math.PI; // quay mặt ra đường làng
// P5: 8 NPC có tên (trừ Bà Tám Xén đứng shop) đi theo lịch sinh hoạt ngày/đêm.
// Bà Tám giữ nguyên hành vi NPC shop; NPC vô danh (seq ≥ 9) không có _p5 → hành vi cũ.
for (const seq of Object.keys(NAMED)) {
  if (+seq === 3) continue; // Bà Tám Xén: nhà == hàng xén, đứng yên bán hàng như cũ
  npcs[+seq]._p5 = true;
}
export function npcName(n) { return NAMED[n.seq] ? NAMED[n.seq].name : 'Người dân'; }
export function npcLines(n) {
  if (NAMED[n.seq]) {
    const lines = NAMED[n.seq].lines.slice(); // copy — không sửa data gốc trong config.js
    // R112: mốc thân thiết 3/6 mở câu thoại mới riêng từng NPC (đúng giọng COT_TRUYEN).
    // aff = 0 → giữ nguyên đúng 2 câu cũ (tương thích ngược).
    for (const l of r112MilestoneLines(n.seq, r112AffGet(S.aff, n.seq))) lines.push(l);
    return lines;
  }
  return [GENERIC_LINES[n.seq % GENERIC_LINES.length]];
}

// ---------- 7d. Tương tác NPC: lại gần trong 2.5m → E / nút Nói → hội thoại ----------
export const isTouch = 'ontouchstart' in window;
export let nearNPC = null, dlgNPC = null, dlgLine = 0;
export const talkPrompt = document.getElementById('talk-prompt');
export const btnTalk = document.getElementById('btn-talk');

export function openDialog(n) {
  dlgNPC = n; dlgLine = 0;
  q3CuTitQuest(n); // Q3: nói chuyện Cu Tít để nhận/trả quest "Trâu Cà Phê đi lạc" (idempotent như p1BaTamQuest)
  q4OngDoQuest(n); // Q4: nói chuyện Ông Đồ Nho để trao "Gói bánh ít" (idempotent, chỉ chạy khi đang giữ bánh)
  q5BaLuaQuest(n); // Q5 (R4 slice): nói chuyện Bà Lụa để nhận/trả quest "Giếng bẩn" (idempotent)
  const first = !S.talked.includes(n.seq);
  // Thưởng: lần đầu nói chuyện +12 XP +8∞; nói lại +2 XP +1∞
  const r = first ? { xp: 12, inf: 8 } : { xp: 2, inf: 1 };
  let questDoneNow = false;
  if (first) {
    S.talked.push(n.seq);
    if (S.talked.length >= 3 && !S.questDone) { // hoàn thành quest "Làm quen làng"
      S.questDone = true; questDoneNow = true;
      r.xp += 20; r.inf += 40; // thưởng hoàn thành quest
    }
  }
  const lines = npcLines(n);
  // Q3 (lễ hội Trăng Rằm): đêm rằm NPC có tên tặng thêm câu thoại rằm (+2 XP, mỗi người 1 lần/đêm)
  if (q3IsFullMoon(DN.t) && NAMED[n.seq] && q3RamCanGreet(q3RamMet, n.seq)) {
    q3RamMet = q3RamGreet(q3RamMet, n.seq);
    lines.push(q3RamLine(npcName(n)));
    r.xp += Q3_RAM_XP;
  }
  document.getElementById('dlg-name').textContent = npcName(n);
  document.getElementById('dlg-text').textContent = lines[0];
  document.getElementById('dlg-reward').textContent =
    `+${r.xp} XP · +${r.inf}∞` + (questDoneNow ? ' · 🎯 Hoàn thành: Làm quen làng!' : '');
  document.getElementById('dlg-next').textContent = lines.length > 1 ? 'Tiếp tục →' : 'Đóng';
  document.getElementById('dialog').style.display = 'block';
  // R112: nút "Tặng quà" chỉ hiện với 9 NPC có tên (NPC vô danh không nhận quà)
  btnGift.style.display = NAMED[n.seq] ? 'block' : 'none';
  addInf(r.inf); addXP(r.xp); // addXP tự updateHUD + saveGame
  fxHooks.burst(n.x, 1.8, n.z, 0xffd34d, 8, 1.6, 3.5); // v4: tia sáng khi nhận thưởng hội thoại
  fxHooks.flashGlow(n.x, 2.0, n.z, 0xffd34d, 1.8, 0.5); // G1: flash nhận thưởng hội thoại
}
export function closeDialog() { document.getElementById('dialog').style.display = 'none'; dlgNPC = null; btnGift.style.display = 'none'; closeGiftMenu(); }
document.getElementById('dlg-next').onclick = () => {
  if (!dlgNPC) return;
  const lines = npcLines(dlgNPC);
  dlgLine++;
  if (dlgLine >= lines.length) closeDialog();
  else {
    document.getElementById('dlg-text').textContent = lines[dlgLine];
    document.getElementById('dlg-next').textContent = 'Đóng';
  }
};
btnTalk.onclick = () => { // v3: NPC shop → mở shop, NPC thường → hội thoại
  if (!nearNPC) return;
  if (nearNPC.isShop) openShop(); else openDialog(nearNPC);
};

// Tìm NPC gần nhất trong 2.5m (mỗi 0.15s, không cần mỗi frame)
export let nearTick = 0;
export function updateNearNPC(dt) {
  nearTick += dt;
  if (nearTick < 0.15) return;
  nearTick = 0;
  nearNPC = null;
  let best = 2.5;
  for (const n of npcs) {
    const d = Math.hypot(n.x - P.x, n.z - P.z);
    if (d < best) { best = d; nearNPC = n; }
  }
  const show = !!nearNPC && !dlgNPC && !shopOpen;
  talkPrompt.style.display = (show && !isTouch) ? 'block' : 'none';
  btnTalk.style.display = (show && isTouch) ? 'block' : 'none';
  if (show) { // v3: đổi nhãn theo loại NPC
    const shopMode = nearNPC.isShop;
    talkPrompt.textContent = shopMode ? 'E: mua đồ' : 'E: nói chuyện';
    btnTalk.textContent = shopMode ? 'Mua' : 'Nói';
  }
  // P1: tìm bó rau gần nhất để nhặt — trước đây p1NearestVeggie() định nghĩa mà không ai gọi
  // nên nearVeggie luôn null, phím E không nhặt được, nút Nhặt (mobile) cũng luôn ẩn
  nearVeggie = p1NearestVeggie();
  btnPick.style.display = (nearVeggie && isTouch && !dlgNPC && !shopOpen) ? 'block' : 'none';
  // Q3: đứng gần trâu đi lạc thì hiện nút Dắt (mobile) — phím E xử lý ở listener KeyE bên dưới
  nearTrau = q3NearTrau();
  btnLead.style.display = (nearTrau && isTouch && !dlgNPC && !shopOpen) ? 'block' : 'none';
}

// ---------- 7f. Shop Bà Tám Xén — khép vòng lặp kiếm ∞ → tiêu ∞ (v3) ----------
export let shopOpen = false;
export function openShop() {
  // P1: Bà Tám Xén là NPC shop duy nhất trong game → mọi đường mở shop (phím E, nút "Mua"
  // trên mobile, hook ?shoptest của main.js) đều chạy quest "Giúp Bà Tám Xén" trước.
  // (Trước đây openShopP1() được viết ra nhưng không nơi nào gọi → quest chết.)
  p1BaTamQuest();
  q4BaTamQuest(); // Q4: mở shop Bà Tám cũng nhận/trả quest "Bánh ít cho Ông Đồ" (idempotent, gọi kép vô hại)
  shopOpen = true; closeDialog();
  renderShop();
  document.getElementById('shop').style.display = 'block';
  btnGiftShop.style.display = 'block'; // R112: Bà Tám Xén (NPC shop) cũng nhận quà qua shop
}
export function closeShop() { shopOpen = false; document.getElementById('shop').style.display = 'none'; btnGiftShop.style.display = 'none'; closeGiftMenu(); }
export function renderShop() {
  const box = document.getElementById('shop-items');
  box.innerHTML = '';
  for (const it of SHOP_ITEMS) {
    const owned = S.shop[it.id];
    const div = document.createElement('div');
    div.className = 'shop-item';
    const info = document.createElement('div');
    info.innerHTML = `<b>${it.name}</b><span>${it.desc}</span>`;
    const b = document.createElement('button');
    b.className = 'btn' + (owned ? ' owned' : '');
    b.textContent = owned ? 'Đã có ✓' : it.price + '∞';
    b.disabled = owned;
    if (!owned) b.onclick = () => buyItem(it);
    div.appendChild(info); div.appendChild(b);
    box.appendChild(div);
  }
  document.getElementById('shop-inf').textContent = `Bạn có: ${S.inf}∞`;
}
export function buyItem(it) {
  if (S.shop[it.id]) return;
  if (S.inf < it.price) { toast(`Chưa đủ ∞! Cần ${it.price}∞, bạn có ${S.inf}∞`); return; }
  S.inf -= it.price;
  S.shop[it.id] = true;
  updateHUD(); saveGame(); renderShop();
  toast(`Đã mua ${it.name}! ${it.desc}`);
}
document.getElementById('shop-close').onclick = closeShop;

// ---------- 7g. Quest 2 "Giúp Bà Tám Xén" (P1): nhặt 5 bó rau dại quanh làng ----------
// L1 (thế nào là xong): nói chuyện với Bà Tám Xén → nhận quest (tracker "Giúp Bà Tám Xén:
// rau dại 0/5"); 7 bó rau spawn quanh làng (nhìn thấy được, có marker nhẹ); đi gần + E
// (hoặc nút Nhặt trên mobile) → tracker đếm 1/5...5/5; đủ 5 → trả quest cho Bà Tám →
// +30 XP +50∞ + toast tiếng Việt; quest lưu vào save như quest 1.

// [P1-TESTABLE-START]
// P1 — máy trạng thái thuần của quest 2 (không THREE, không DOM, không import).
// Test trích block này qua regex rồi eval — giữ nguyên quy ước như các block *-TESTABLE-* cũ.
// state: 'none' (chưa nhận) → 'active' (đang nhặt) → 'done' (đã trả quest).
export const P1_VEG_NEED = 5;    // số bó rau cần nhặt để trả quest
export const P1_VEG_COUNT = 7;   // số bó rau spawn quanh làng (dư 2 để dễ tìm, đỡ bí)
export const P1_REWARD_XP = 30;  // thưởng khi trả quest — nhỉnh hơn quest 1 (20 XP) vì tốn công đi nhặt
export const P1_REWARD_INF = 50; // ∞ thưởng — đúng luật sắt "∞ kiếm từ tương tác", không mua sức mạnh
export const P1_PICK_XP = 2;     // XP nhỏ mỗi lần nhặt cho đã tay (5 lần = 10 XP, không phá cân bằng)
// Layout rau dại quanh làng: {a: góc radian, r: bán kính mét} — runtime đổi ra x/z,
// né dốc cao và né nhà NPC. Góc rải đều vòng tròn để người chơi phải đi khám phá làng.
export const P1_VEG_LAYOUT = [
  { a: 0.42, r: 16 }, { a: 1.35, r: 26 }, { a: 2.20, r: 14 }, { a: 3.02, r: 30 },
  { a: 3.95, r: 20 }, { a: 4.90, r: 34 }, { a: 5.75, r: 22 },
];
export function q2New() { return { state: 'none', picked: 0, spots: [], removed: [] }; }
// Nhận quest: chỉ từ 'none' → 'active'; nhận lại không reset tiến độ cũ
export function q2Accept(q) {
  if (!q || q.state !== 'none') return q;
  return { ...q, state: 'active', picked: 0, removed: [] };
}
// Nhặt bó rau thứ idx: mỗi bó chỉ đếm 1 lần; nhặt khi chưa nhận quest thì không đếm
export function q2Pick(q, idx) {
  if (!q || q.state !== 'active') return q;
  if (!Number.isInteger(idx) || idx < 0) return q;
  if (q.removed.includes(idx)) return q; // đã nhặt bó này rồi
  const removed = [...q.removed, idx];
  return { ...q, removed, picked: removed.length };
}
// Đủ 5 bó mới được trả quest
export function q2CanTurnIn(q) { return !!q && q.state === 'active' && q.picked >= P1_VEG_NEED; }
// Trả quest: 'active' + đủ rau → 'done'; chưa đủ thì giữ nguyên (không mất tiến độ)
export function q2TurnIn(q) {
  if (!q2CanTurnIn(q)) return q;
  return { ...q, state: 'done' };
}
export function q2Reward() { return { xp: P1_REWARD_XP, inf: P1_REWARD_INF }; }
// Dòng tracker cho HUD (ui.js vẽ lại theo cùng format — không import chéo để tránh cycle)
export function q2TrackerText(q) {
  if (!q || q.state === 'none') return '';
  if (q.state === 'done') return '🌿 Giúp Bà Tám Xén: ✓ hoàn thành!';
  return `🌿 Giúp Bà Tám Xén: rau dại ${Math.min(q.picked, P1_VEG_NEED)}/${P1_VEG_NEED}`;
}
// Chuẩn hoá q2 từ save (thuần — test được): save cũ không có q2 / q2 hỏng → mặc định an toàn.
// Tách riêng khỏi p1InitQ2 để logic chuẩn hoá có 1 nguồn sự thật duy nhất (không 2 bản).
export function q2Migrate(raw) {
  const q = (raw && typeof raw === 'object') ? raw : null;
  const okState = q && (q.state === 'active' || q.state === 'done');
  const removed = (q && Array.isArray(q.removed))
    ? q.removed.filter(i => Number.isInteger(i) && i >= 0) : [];
  const spots = (q && Array.isArray(q.spots))
    ? q.spots.filter(s => s && typeof s.x === 'number' && typeof s.z === 'number') : [];
  return {
    state: okState ? q.state : 'none',
    // picked luôn suy ra từ removed — không lưu 2 nguồn sự thật
    picked: removed.length,
    spots, removed,
  };
}
// [P1-TESTABLE-END]

// ----- Runtime (THREE/DOM): lưu save, spawn rau, nhặt, nút mobile, móc vào shop -----

// P1: tracker quest 2 trên HUD — tạo động (không chạm index.html/ui.js, cùng pattern với btnPick).
// ui.js chỉ vẽ quest 1 ("Làm quen làng") nên dòng "rau dại x/5" do module này tự quản;
// mọi chỗ đổi S.q2 đều phải gọi p1RenderTracker() ngay sau đó.
const p1QuestEl = document.createElement('div');
p1QuestEl.id = 'quest2-tracker';
p1QuestEl.style.cssText = 'font-size:13px;font-weight:600;color:#bff0c2;margin-top:2px;display:none;';
document.getElementById('quest').after(p1QuestEl);
function p1RenderTracker() {
  const t = q2TrackerText(S.q2);
  p1QuestEl.style.display = t ? 'block' : 'none';
  p1QuestEl.textContent = t;
}

// P1: vá trạng thái quest 2 vào S (không được chạm core.js nên migrate ở đây).
// loadSave() của core chạy trước module này nên save cũ đã đọc xong — đọc lại raw
// để lấy q2 nếu có, không thì dùng mặc định. Logic chuẩn hoá nằm trong q2Migrate()
// (block testable ở trên) để test được.
(function p1InitQ2() {
  let raw = (S.q2 && typeof S.q2 === 'object') ? S.q2 : null;
  if (!raw) {
    try {
      const d = JSON.parse(store.get(SAVE_KEY) || '{}');
      if (d && d.q2 && typeof d.q2 === 'object') raw = d.q2;
    } catch (e) { /* save hỏng: dùng mặc định */ }
  }
  S.q2 = q2Migrate(raw);
})();

// P1: cụm rau dại — 3 nón lá xanh chụm lại (rẻ: 3 draw call/nhóm, 7 nhóm = 21 mesh)
const p1VegGeo = new THREE.ConeGeometry(0.28, 0.75, 6);
const p1VegMat = new THREE.MeshStandardMaterial({ color: 0x3fa34d, roughness: 0.9 });
const p1VegMatD = new THREE.MeshStandardMaterial({ color: 0x2c7a38, roughness: 0.9 });
function p1MakeMarker() { // marker nhẹ: quầng sáng xanh lá bay bổng trên bụi rau
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  grd.addColorStop(0, 'rgba(170,255,180,0.95)');
  grd.addColorStop(1, 'rgba(120,220,120,0)');
  g.fillStyle = grd; g.beginPath(); g.arc(32, 32, 30, 0, 7); g.fill();
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false }));
  spr.scale.set(1.1, 1.1, 1); spr.renderOrder = 6;
  return spr;
}
export const veggies = []; // [{x, z, y, group, marker, idx, picked}]
function p1ClearVeggies() {
  for (const v of veggies) scene.remove(v.group);
  veggies.length = 0;
}
// Đổi layout góc/bán kính ra x/z, né dốc cao + né nhà NPC có tên (kẻo rau mọc trong nhà)
function p1MakeSpots() {
  const homes = Object.values(NAMED).map(c => c.home);
  const spots = [];
  for (const L of P1_VEG_LAYOUT) {
    let a = L.a, r = L.r, x = 0, z = 0, ok = false;
    for (let t = 0; t < 12 && !ok; t++) { // thử nới bán kính / xoay góc tới khi đất đẹp
      x = Math.cos(a) * r; z = Math.sin(a) * r;
      ok = slopeAt(x, z) <= 0.6 && homes.every(h => Math.hypot(x - h[0], z - h[1]) > 3.5);
      if (!ok) { r += 3; a += 0.35; }
    }
    spots.push({ x: +x.toFixed(2), z: +z.toFixed(2) });
  }
  return spots;
}
export function spawnVeggies() { // dựng lại toàn bộ rau từ S.q2.spots (gọi khi nhận quest / tải save)
  p1ClearVeggies();
  if (!S.q2.spots.length) S.q2.spots = p1MakeSpots();
  S.q2.spots.forEach((sp, i) => {
    const y = groundHeight(sp.x, sp.z);
    const grp = new THREE.Group();
    const c0 = new THREE.Mesh(p1VegGeo, p1VegMat); c0.position.y = 0.36; c0.castShadow = true;
    const c1 = new THREE.Mesh(p1VegGeo, p1VegMatD); c1.position.set(0.22, 0.28, 0.1); c1.rotation.z = -0.3;
    const c2 = new THREE.Mesh(p1VegGeo, p1VegMat); c2.position.set(-0.2, 0.28, -0.08); c2.rotation.z = 0.3;
    const marker = p1MakeMarker(); marker.position.y = 1.6;
    grp.add(c0, c1, c2, marker);
    grp.position.set(sp.x, y, sp.z);
    const picked = S.q2.removed.includes(i);
    grp.visible = !picked;
    marker.visible = S.q2.state === 'active' && !picked;
    scene.add(grp);
    veggies.push({ x: sp.x, z: sp.z, y, group: grp, marker, idx: i, picked });
  });
}
if (S.q2.state === 'active') spawnVeggies(); // tải lại save đang làm dở quest → rau hiện lại

// P1: marker rau bay bổng nhẹ — gọi trong updateNPCAnim (hàm per-frame của actors.js)
function p1TickVeggieMarkers() {
  const active = S.q2 && S.q2.state === 'active';
  for (const v of veggies) {
    if (v.picked) continue;
    v.marker.visible = active;
    if (active) v.marker.position.y = 1.6 + Math.sin(tGlobal * 3 + v.idx * 1.3) * 0.18;
  }
}

// ---------- P1: nhặt rau — đi gần (<2.2m) + phím E / nút Nhặt (mobile) ----------
export let nearVeggie = null;
const P1_PICK_DIST = 2.2; // ngang tầm nói chuyện NPC (2.5m) — quen tay người chơi cũ
function p1NearestVeggie() {
  if (!S.q2 || S.q2.state !== 'active') return null;
  let best = null, bd = P1_PICK_DIST;
  for (const v of veggies) {
    if (v.picked) continue;
    const d = Math.hypot(v.x - P.x, v.z - P.z);
    if (d < bd) { bd = d; best = v; }
  }
  return best;
}
export function pickVeggie() { // nhặt bó rau đang đứng gần — trả true nếu nhặt được
  const v = nearVeggie;
  if (!v || v.picked || !S.q2 || S.q2.state !== 'active' || dlgNPC || shopOpen) return false;
  S.q2 = q2Pick(S.q2, v.idx);
  v.picked = true; v.group.visible = false;
  p1RenderTracker(); // cập nhật "rau dại x/5" ngay sau khi nhặt
  fxHooks.burst(v.x, v.y + 0.8, v.z, 0x9dff9d, 8, 1.2, 3); // tia xanh lá khi nhặt rau
  if (q2CanTurnIn(S.q2)) {
    toast('Đủ 5 bó rau rồi! Mang về cho Bà Tám Xén nhé 🌿');
  } else {
    const left = P1_VEG_NEED - S.q2.picked;
    toast(`Nhặt được rau dại! (${S.q2.picked}/${P1_VEG_NEED}) — còn ${left} bó nữa`);
  }
  addXP(P1_PICK_XP); // addXP tự updateHUD + saveGame
  return true;
}
// Nút "Nhặt" cho mobile — tạo động (không chạm index.html), to ≥76px theo mobile-first
export const btnPick = document.createElement('button');
btnPick.id = 'btn-pick';
btnPick.textContent = '🌿 Nhặt';
btnPick.setAttribute('aria-label', 'Nhặt rau dại');
btnPick.style.cssText = 'display:none;position:fixed;right:110px;bottom:120px;z-index:40;' +
  'min-width:76px;min-height:76px;border-radius:50%;font-size:18px;font-weight:700;' +
  'background:rgba(47,122,61,.95);color:#fff;border:3px solid #bff0c2;' +
  'box-shadow:0 2px 10px rgba(0,0,0,.4);';
btnPick.onclick = () => pickVeggie();
document.body.appendChild(btnPick);
// Phím E nhặt rau / câu cá — listener riêng, chỉ chạy khi KHÔNG đứng gần NPC
// (ưu tiên hành vi cũ: gần NPC thì E = nói chuyện/mua đồ, xử lý bởi main.js;
// rau trước, cá sau — 2 chỗ không bao giờ gần nhau nên không tranh nút)
addEventListener('keydown', e => {
  if (e.code === 'KeyE' && !nearNPC && !dlgNPC && !shopOpen) {
    q3Lead(); // Q3: dắt trâu (tự guard điều kiện bên trong, không tranh nút rau/cá)
    if (!pickVeggie() && !vilAction()) fishAction(); // rau → xây làng → câu cá (cầu với ao gần nhau nên làng trước)
  }
});

// P1: móc quest vào lần gặp Bà Tám Xén (bà là NPC shop nên E mở shop, không mở dialog)
function p1BaTamQuest() {
  if (!S.q2) return; // S.q2 luôn được p1InitQ2 dựng — guard phòng save lạ
  const n = npcs[3]; // Bà Tám Xén — seq 3, theo NAMED trong config.js
  if (S.q2.state === 'none') { // nhận quest lần đầu gặp
    S.q2 = q2Accept(S.q2);
    spawnVeggies();
    toast('Bà Tám Xén: "Cháu giúp bà nhặt 5 bó rau dại quanh làng nhé, bà thưởng hậu!" 🌿');
    fxHooks.burst(n.x, 1.8, n.z, 0x9dff9d, 10, 1.6, 3.5);
    updateHUD(); p1RenderTracker(); saveGame();
  } else if (q2CanTurnIn(S.q2)) { // đủ 5 bó → trả quest, nhận thưởng
    S.q2 = q2TurnIn(S.q2);
    const r = q2Reward();
    addInf(r.inf); addXP(r.xp); // addXP tự updateHUD + saveGame
    toast(`🎯 Hoàn thành: Giúp Bà Tám Xén! +${r.xp} XP · +${r.inf}∞ — "Bà cảm ơn cháu nhiều lắm!"`);
    fxHooks.burst(n.x, 1.8, n.z, 0xffd34d, 16, 2.2, 4);
    updateHUD(); p1RenderTracker(); saveGame();
  }
}
// Wrapper tường minh cho test/dev gọi trực tiếp; quest đã được móc trong openShop()
// nên ở đây chỉ cần gọi openShop() (p1BaTamQuest là idempotent, gọi kép cũng vô hại).
export function openShopP1() { openShop(); }
updateHUD(); p1RenderTracker(); // vẽ HUD + tracker q2 sau khi S.q2 đã khởi tạo

// ---------- P4. Câu cá ở ao sen (học Koster + Schell) ----------
// L1 (thế nào là xong): ra bờ ao đông (trong 10m tâm ao) + E → phao nổi trên mặt
// nước; chờ 2–5s cá cắn (phao thụt + toast) → E trong 0.9s thì dính cá
// (+15 XP +10∞); giật hụt/trễ → KHÔNG phạt, phao tự thả lại (Schell: cozy không
// fail-state). Chỉ 1 phao, 0 asset ngoài (sphere + cylinder có sẵn).

// [P4-TESTABLE-START]
// P4 — máy trạng thái thuần của minigame câu cá (không THREE/DOM/import).
// phase: 'idle' (chưa thả) → 'wait' (chờ cắn) → 'bite' (cá cắn, chờ giật).
const P4_FISH_DIST = 10;   // đứng trong 10m tâm ao mới câu được (tính cả bờ)
const P4_WAIT_MIN = 2;     // chờ ít nhất 2s cá mới cắn
const P4_WAIT_MAX = 5;     // chờ nhiều nhất 5s
const P4_BITE_WINDOW = 0.9;// giật trong 0.9s kể từ khi cắn mới dính
const P4_REWARD_XP = 15;   // thưởng ngang 1 con Quái Vẩn (không phá cân bằng)
const P4_REWARD_INF = 10;
const P4_FISH_NAMES = ['cá rô phi', 'cá diếc', 'cá quả', 'cá trê đồng'];
function p4NearPond(px, pz, pondX, pondZ) { // đủ gần ao để câu không?
  return Math.hypot(px - pondX, pz - pondZ) < P4_FISH_DIST;
}
function fishNew() { return { phase: 'idle', t: 0, biteAt: 0 }; }
function fishCast(st, rand01) { // thả câu: hẹn giờ cá cắn (rand01 ∈ [0,1))
  const r = Math.max(0, Math.min(0.999999, rand01 || 0));
  return { phase: 'wait', t: 0, biteAt: P4_WAIT_MIN + r * (P4_WAIT_MAX - P4_WAIT_MIN) };
}
function fishTick(st, dt, rand01) { // tiến 1 nhịp game; hụt nhịp cắn → tự thả lại, không phạt
  if (!st || st.phase === 'idle') return st;
  if (st.phase === 'wait') {
    const t = st.t + dt;
    if (t >= st.biteAt) return { phase: 'bite', t: 0, biteAt: st.biteAt };
    return { ...st, t };
  }
  if (st.phase === 'bite') { // quá 0.9s không giật → cá nhả, tự thả câu mới
    const t = st.t + dt;
    if (t > P4_BITE_WINDOW) return fishCast(fishNew(), rand01);
    return { ...st, t };
  }
  return st;
}
function fishStrike(st) { // giật cần: dính nếu đang trong nhịp cắn; giật sớm không mất gì
  if (st && st.phase === 'bite') return { caught: true, state: fishNew() };
  return { caught: false, state: st };
}
// [P4-TESTABLE-END]
export { P4_FISH_DIST, P4_WAIT_MIN, P4_WAIT_MAX, P4_BITE_WINDOW,
         P4_REWARD_XP, P4_REWARD_INF, P4_FISH_NAMES };

// ----- P4 runtime (THREE/DOM): phao câu, nút mobile, móc phím E -----
export let fishSt = fishNew();
let fishFx = 0, fishFz = 0; // điểm phao nổi trên mặt ao
const fishFloat = new THREE.Group(); // phao đỏ-trắng + que (dựng 1 lần, ẩn/hiện)
{
  const doo = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xd63a2e, roughness: 0.6 }));
  doo.scale.y = 1.4;
  const trang = new THREE.Mesh(new THREE.SphereGeometry(0.115, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xfdf3ec, roughness: 0.6 }));
  trang.scale.y = 0.7; trang.position.y = -0.08;
  const que = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 5),
    new THREE.MeshStandardMaterial({ color: 0x3a2c18 }));
  que.position.y = 0.4;
  fishFloat.add(doo, trang, que);
  fishFloat.visible = false;
  scene.add(fishFloat);
}
function fishWaterY() { return (pondBaseY === null ? groundHeight(POND.x, POND.z) : pondBaseY) - 1.05; }
export function fishAction() { // E khi không vướng NPC/rau: thả câu hoặc giật cần
  if (dlgNPC || shopOpen) return false;
  if (fishSt.phase === 'bite') { // đang cắn → giật
    const r = fishStrike(fishSt);
    if (r.caught) {
      fishSt = r.state; fishFloat.visible = false;
      const ten = P4_FISH_NAMES[Math.floor(Math.random() * P4_FISH_NAMES.length)];
      addInf(P4_REWARD_INF); addXP(P4_REWARD_XP);
      if (S.vil && S.vil.cau) { addInf(P4_REWARD_INF); toast('🌉 Cầu mới chắc chắn — cá cắn mạnh gấp đôi!'); } // VIL: buff cầu ao
      const fs = statFish(S.stats); S.stats = fs.stats; saveGame(); // STAT: sổ kỷ lục làng
      if (fs.milestone) toast(`🏆 Kỷ lục làng: câu được con cá thứ ${fs.milestone}!`);
      fxHooks.burst(fishFx, fishWaterY() + 0.4, fishFz, 0x7fd4ff, 10, 1.5, 3);
      toast(`🎣 Dính ${ten} rồi! +${P4_REWARD_XP} XP · +${P4_REWARD_INF}∞`);
      updateFishBtn();
      return true;
    }
    return false;
  }
  if (fishSt.phase === 'wait') return true; // đang chờ: E không làm gì (tránh giật sớm vô tình)
  if (!p4NearPond(P.x, P.z, POND.x, POND.z)) return false; // xa ao: im lặng (không spam toast)
  fishSt = fishCast(fishSt, Math.random()); // thả câu từ bờ về phía tâm ao
  const dx = POND.x - P.x, dz = POND.z - P.z, d = Math.hypot(dx, dz) || 1;
  const drop = Math.max(0.5, d - 4); // phao rơi cách bờ 4m về phía tâm ao
  fishFx = P.x + (dx / d) * drop; fishFz = P.z + (dz / d) * drop;
  fishFloat.visible = true;
  toast('🎣 Đã thả câu... chờ cá cắn (đừng đi xa nhé)');
  updateFishBtn();
  return true;
}
// Nút "Câu/Giật" cho mobile — tạo động như btnPick (to ≥76px)
export const btnFish = document.createElement('button');
btnFish.id = 'btn-fish';
btnFish.textContent = '🎣 Câu';
btnFish.setAttribute('aria-label', 'Câu cá ở ao làng');
btnFish.style.cssText = 'display:none;position:fixed;right:196px;bottom:120px;z-index:40;' +
  'min-width:76px;min-height:76px;border-radius:50%;font-size:18px;font-weight:700;' +
  'background:rgba(47,111,237,.95);color:#fff;border:3px solid #bcd6ff;' +
  'box-shadow:0 2px 10px rgba(0,0,0,.4);';
btnFish.onclick = () => fishAction();
document.body.appendChild(btnFish);
function updateFishBtn() {
  const show = isTouch && !dlgNPC && !shopOpen &&
    (fishSt.phase !== 'idle' || p4NearPond(P.x, P.z, POND.x, POND.z));
  btnFish.style.display = show ? 'block' : 'none';
  if (show) btnFish.textContent = fishSt.phase === 'bite' ? 'Giật!' : (fishSt.phase === 'wait' ? '...' : '🎣 Câu');
}
export function updateFishing(dt) { // main.js gọi mỗi frame (phao nhấp nhô + nhịp cắn)
  if (fishSt.phase === 'idle') { updateFishBtn(); return; }
  const was = fishSt.phase;
  fishSt = fishTick(fishSt, dt, Math.random());
  if (fishSt.phase === 'bite' && was !== 'bite') { // vừa cắn: báo + phao thụt
    toast('🐟 Cắn câu rồi! Giật ngay (E)!');
    fxHooks.burst(fishFx, fishWaterY() + 0.3, fishFz, 0xffffff, 6, 1, 2);
  }
  if (fishFloat.visible) { // phao nhấp nhô theo sóng; lúc cắn thì thụt xuống
    const bite = fishSt.phase === 'bite';
    fishFloat.position.set(fishFx, fishWaterY() + (bite ? -0.08 : Math.sin(tGlobal * 3) * 0.05), fishFz);
    fishFloat.rotation.y += dt * 0.8;
  }
  if (fishSt.phase === 'idle') fishFloat.visible = false; // (không xảy ra, guard an toàn)
  updateFishBtn();
}

// ---------- VIL. Hồi sinh làng: góp ∞ xây giếng–cầu–đèn (vòng lặp chính v16) ----------
// L1 (thế nào là xong): đứng gần công trình (<3m) + E → đủ ∞ thì trừ tiền, công
// trình mọc phần mới ngay, buff có hiệu lực ngay, tracker 🏡 tăng; thiếu ∞ thì
// báo còn thiếu bao nhiêu. Xây xong cả 3 → toast hoàn thành + bonus 100∞.

// [VIL-TESTABLE-START]
// VIL — logic thuần (không THREE/DOM/import): giá, mua, tiến độ, tracker.
const VIL_COST = { gieng: 120, cau: 250, den: 400 }; // giá tăng dần theo giá trị buff
const VIL_NAME = { gieng: 'Giếng làng', cau: 'Cầu ao sen', den: 'Đèn đình' };
const VIL_BUFF = {
  gieng: 'uống nước giếng mát — hồi HP nhanh gấp đôi',
  cau: 'câu từ cầu mới — mỗi con cá gấp đôi ∞',
  den: 'đèn đình soi sáng — quái ban đêm rớt gấp rưỡi ∞',
};
const VIL_IDS = ['gieng', 'cau', 'den'];
const VIL_FIND_DIST = 3; // đứng trong 3m công trình mới góp được
function vilBuiltCount(vil) { // đã xây mấy/3 (vil thiếu/hỏng → 0, không crash)
  if (!vil || typeof vil !== 'object') return 0;
  return VIL_IDS.filter((id) => !!vil[id]).length;
}
function vilCanBuy(inf, vil, id) { // đủ tiền + chưa xây + đúng id mới mua được
  if (!VIL_COST[id]) return false;
  if (vil && vil[id]) return false;
  return inf >= VIL_COST[id];
}
function vilBuy(inf, vil, id) { // trừ tiền + đánh dấu đã xây; không đủ/không đúng → giữ nguyên
  if (!vilCanBuy(inf, vil, id)) return { inf, vil };
  return { inf: inf - VIL_COST[id], vil: { ...vil, [id]: true } };
}
function vilTrackerText(vil) { // dòng tracker 🏡 cho HUD
  const n = vilBuiltCount(vil);
  if (n >= 3) return '🏡 Làng An Bình: ✓ hồi sinh hoàn toàn!';
  return `🏡 Hồi sinh làng: ${n}/3 công trình`;
}
function vilNearSite(px, pz, sites) { // công trình nào trong tầm góp? null nếu không có
  for (const s of sites) {
    if (Math.hypot(px - s.x, pz - s.z) < VIL_FIND_DIST) return s.id;
  }
  return null;
}
// [VIL-TESTABLE-END]

// ----- VIL runtime: tracker, góp tiền, móc phím E -----
const vilTrackerEl = document.createElement('div');
vilTrackerEl.id = 'village-tracker';
vilTrackerEl.style.cssText = 'font-size:13px;font-weight:600;color:#ffd9a0;margin-top:2px;display:none;';
document.getElementById('quest').after(vilTrackerEl);
export function vilRenderTracker() {
  const t = vilTrackerText(S.vil);
  vilTrackerEl.style.display = 'block';
  vilTrackerEl.textContent = t;
}
export function vilAction() { // E gần công trình: góp ∞ xây; trả true nếu đã xử lý (chặn câu cá)
  if (dlgNPC || shopOpen) return false;
  const id = vilNearSite(P.x, P.z, vilSites);
  if (!id) return false;
  // Đã xây xong → nhường E cho việc khác (câu cá cạnh cầu) — buff đã báo lúc xây
  if (S.vil && S.vil[id]) return false;
  if (!vilCanBuy(S.inf, S.vil, id)) {
    toast(`🏡 ${VIL_NAME[id]} cần ${VIL_COST[id]}∞ (bạn có ${S.inf}∞) — đi đánh quái/câu cá kiếm thêm nhé!`);
    return true;
  }
  const r = vilBuy(S.inf, S.vil, id);
  S.inf = r.inf; S.vil = r.vil;
  vilShow(id); updateHUD(); vilRenderTracker(); saveGame();
  fxHooks.burst(P.x, P.y + 1.5, P.z, 0xffd34d, 16, 2.2, 4);
  if (vilBuiltCount(S.vil) >= 3) {
    addInf(100);
    toast('🎉 LÀNG HỒI SINH! Cả 3 công trình đã xong — thưởng +100∞! Cảm ơn bạn!');
  } else {
    toast(`🏡 Đã xây ${VIL_NAME[id]}! ${VIL_BUFF[id]}. (${vilTrackerText(S.vil)})`);
  }
  return true;
}
vilRenderTracker(); // vẽ tracker ngay khi load
for (const id of VIL_IDS) if (S.vil && S.vil[id]) vilShow(id); // save đã xây → hiện phần mới


// ---------- 7h. R112 — món quà yêu thích + mốc thân thiết của 9 NPC có tên (học Spiritfarer) ----------
// L1 (thế nào là xong): mỗi NPC có tên trong 9 NPC có 1 món quà yêu thích (data dưới đây,
// đúng giọng làng quê); tặng đúng món qua menu tương tác → +1 thân thiết + hiện tim;
// mốc 3 và 6 mở câu thoại mới riêng từng NPC (giọng COT_TRUYEN_VA_LAU_DAI); tặng sai món
// chỉ nhận câu cảm ơn xã giao, không tăng thân thiết.

// [R112-TESTABLE-START]
// R112 — logic thuần (không DOM, không THREE, không import): bảng quà, tính thân thiết,
// chọn thoại theo mốc. Test trích block này qua regex rồi eval — giữ nguyên quy ước
// như các block *-TESTABLE-* cũ (P1, F4, V1...).
//
// Quà tặng: tái dùng mô hình dữ liệu item có sẵn của game (SHOP_ITEMS: {id, name, desc}),
// không thêm hệ item/inventory mới — menu tặng quà chỉ là bảng chọn thuần,
// không tiêu hao vật phẩm, không đụng túi đồ hay shop.

// Danh mục 9 món quà quê (mỗi NPC thích đúng 1 món trong danh mục này)
export const R112_GIFTS = [
  { id: 'trau-cau',  name: 'Trầu cau',       desc: 'Miếng trầu têm cánh phượng' },
  { id: 'keo-dua',   name: 'Kẹo dừa',        desc: 'Kẹo dừa dẻo thơm Bến Tre' },
  { id: 'che-xanh',  name: 'Chè xanh',       desc: 'Ấm chè xanh pha nước giếng làng' },
  { id: 'banh-it',   name: 'Bánh ít lá gai', desc: 'Bánh ít nhân đậu xanh' },
  { id: 'thuoc-lao', name: 'Thuốc lào',      desc: 'Điếu thuốc lào Tiên Lãng' },
  { id: 'ruou-nep',  name: 'Rượu nếp',       desc: 'Chén rượu nếp ủ men lá' },
  { id: 'banh-da',   name: 'Bánh đa vừng',   desc: 'Bánh đa nướng giòn rụm' },
  { id: 'mam-tep',   name: 'Mắm tép',        desc: 'Mắm tép chua chấm rau luộc' },
  { id: 'xoi-nep',   name: 'Xôi nếp',        desc: 'Gói xôi nếp dẻo thơm' },
];
// Món quà yêu thích của từng NPC (seq → gift id) + câu gợi ý đúng giọng nhân vật.
// Người chơi đoán qua gợi ý trong menu tặng quà (học Spiritfarer: đoán đúng mới +thân thiết).
export const R112_FAV = {
  0: { gift: 'trau-cau',  hint: 'Bà già rồi... chỉ thèm miếng trầu têm cánh phượng, như ngày xưa ông nội cháu hay têm cho bà.' },
  1: { gift: 'keo-dua',   hint: 'Em thích đồ ngọt lắm! Kẹo gì dẻo dẻo, thơm thơm mùi dừa ấy — anh biết không?' },
  2: { gift: 'che-xanh',  hint: 'Chiều chiều, ông hay pha ấm chè xanh ngồi đọc sách ngoài hiên đình.' },
  3: { gift: 'banh-it',   hint: 'Ai mua cho bà gói bánh ít lá gai, bà kể cho nghe hết chuyện làng này, thề luôn!' },
  4: { gift: 'thuoc-lao', hint: 'Lâu rồi... không ai mời cụ điếu thuốc lào. Thuốc lào Tiên Lãng mới đượm.' },
  5: { gift: 'ruou-nep',  hint: 'Rèn xong một ngày... chỉ thèm chén rượu nếp cho ấm bụng.' },
  6: { gift: 'banh-da',   hint: 'Cô cũng thích ăn vặt lắm — bánh đa vừng nướng giòn rụm là cô mê nhất.' },
  7: { gift: 'mam-tep',   hint: 'Đi biển về, chỉ thèm bát cơm trắng với mắm tép chấm rau luộc.' },
  8: { gift: 'xoi-nep',   hint: 'Cày từ sáng tới trưa... chỉ mong có gói xôi nếp dẻo ăn cho chắc bụng.' },
};
export const R112_MILESTONES = [3, 6]; // mốc thân thiết mở thoại mới
// Câu đáp khi tặng ĐÚNG món — vui mừng, đúng tính cách từng NPC
export const R112_RESP_OK = {
  0: 'Trầu cau! Con tinh ý quá... Bà nhớ ngày xưa quá, con ạ.',
  1: 'Kẹo dừa!! Anh biết em thích hả? Tuyệt vời luôn!',
  2: 'Chè xanh thơm quá... Cháu pha khéo như người làng mình vậy.',
  3: 'Bánh ít lá gai! Cháu nhớ lời bà nói hả? Thương cháu quá!',
  4: 'Thuốc lào... Cháu hiểu cụ. Cảm ơn cháu.',
  5: 'Rượu nếp. ...Được. Ngồi xuống uống cùng tôi một chén.',
  6: 'Bánh đa vừng! Cháu nhớ lời cô nói sao? Cô vui lắm.',
  7: 'Mắm tép! Đúng món chú thèm! Cháu hiểu chú ghê!',
  8: 'Xôi nếp dẻo thơm... Cháu biết tôi thích hả? Cảm ơn cháu nhiều!',
};
// Câu cảm ơn XÃ GIAO khi tặng SAI món — lịch sự, không tăng thân thiết
export const R112_RESP_POLITE = {
  0: 'Con có lòng là bà vui rồi. Để đây, bà dùng dần nhé.',
  1: 'Cảm ơn anh! Em... ừm, để dành ăn sau vậy!',
  2: 'Cháu có lòng, ông nhận. Để ông đặt lên bàn thờ tổ tiên.',
  3: 'Ối giời, cháu khách sáo quá! Bà nhận cho cháu vui nhé!',
  4: 'Cháu... có lòng. Cụ nhận.',
  5: 'Ừ. Để đó.',
  6: 'Cháu chu đáo quá... Cô cảm ơn cháu nhé.',
  7: 'Trời đất ơi, cháu tặng chú à? Chú nhận, chú nhận!',
  8: 'Cháu tốt bụng quá... Để tôi cất đi đã.',
};
// Câu thoại mở ở mốc thân thiết 3 và 6 — giọng COT_TRUYEN_VA_LAU_DAI, đúng tính cách
export const R112_MILESTONE_LINES = {
  0: { 3: 'Con ngoan... Hồi con còn bé tí, bà cũng têm trầu cho ông nội con như thế này đây.',
       6: 'Có con ở đây, giếng làng như đầy thêm một gáo nước. Bà yên lòng rồi, con ạ.' },
  1: { 3: 'Kẹo dừa ngon quá anh ơi! Em để dành một cái cho trâu Cà Phê... ừm, chắc nó không ăn được đâu ha!',
       6: 'Anh An là người tốt nhất làng! Sau này em lớn lên, em cũng về làng như anh!' },
  2: { 3: 'Chè ngon phải uống chậm. Xưa kia... cụ thân sinh của ông cũng pha chè mời khách bằng ấm đất này.',
       6: "Sách có câu: 'uống nước nhớ nguồn'. Cháu về làng... là nhớ nguồn rồi đấy." },
  3: { 3: 'Trời ơi, cháu khéo chọn ghê! Hồi xưa mẹ bà cũng gói bánh ít lá gai bán chợ phiên đấy!',
       6: 'Từ nay cháu mua gì bà cũng bớt cho! Người đâu mà tinh ý thế không biết!' },
  4: { 3: 'Cháu... biết cụ thích thuốc lào à. Điếu này... đượm như điếu cụ hút ngày còn làm Người Gác.',
       6: 'Làng mình... còn nhờ vào cháu. Cụ tin... cháu giữ được Mạch.' },
  5: { 3: 'Ừ. Rượu nếp ngon. ...Cảm ơn.',
       6: 'Để đó... à không. Ý tôi là — cần rèn gì, cứ mang qua. Tôi rèn cho, không lấy công.' },
  6: { 3: 'Bánh đa vừng giòn quá... Cháu ăn cùng cô nhé? Thuốc đắng dã tật, nhưng bánh ngọt thì ai cũng thích.',
       6: 'Cháu có đau ở đâu, cứ qua cô. Người nhà với nhau, cô không lấy tiền thuốc đâu.' },
  7: { 3: 'Trời đất ơi, mắm tép ngon! Chấm với rau dại luộc thì... chà, tối nay chú có mồi rồi!',
       6: 'Bến Phúc này, chú coi cháu như con cháu trong nhà. Cá đánh được mẻ nào ngon, chú để phần cháu mẻ ấy!' },
  8: { 3: 'Xôi nếp dẻo quá... Để tôi cày xong sào này, tôi mời cháu bữa cơm cá kho tộ!',
       6: 'Ruộng này... nhờ cháu mà tôi thấy có hy vọng lại rồi. Việc nặng cứ để tôi lo, cháu đừng ngại!' },
};
// Tra cứu món quà theo id (không có → null)
export function r112GiftById(id) {
  for (const g of R112_GIFTS) if (g.id === id) return g;
  return null;
}
// Thân thiết hiện tại của NPC (aff thiếu/hỏng → 0)
export function r112AffGet(aff, seq) {
  const v = aff && typeof aff === 'object' ? aff[seq] : undefined;
  return (Number.isInteger(v) && v >= 0) ? v : 0;
}
// Tặng quà: đúng món yêu thích → +1 thân thiết (thuần, không sửa object gốc).
// Trả {aff, correct, unlocked}: unlocked = mốc 3/6 vừa vượt qua (0 nếu không).
export function r112Give(aff, seq, giftId) {
  const base = (aff && typeof aff === 'object') ? aff : {};
  const fav = R112_FAV[seq];
  if (!fav || fav.gift !== giftId) return { aff: { ...base }, correct: false, unlocked: 0 };
  const old = r112AffGet(base, seq), nw = old + 1;
  const next = { ...base, [seq]: nw };
  let unlocked = 0;
  for (const m of R112_MILESTONES) if (old < m && nw >= m) unlocked = m;
  return { aff: next, correct: true, unlocked };
}
// Các câu thoại mốc đã mở theo thân thiết hiện tại (aff < 3 → [], 3–5 → [mốc 3], ≥6 → [mốc 3, mốc 6])
export function r112MilestoneLines(seq, aff) {
  const ml = R112_MILESTONE_LINES[seq];
  if (!ml) return [];
  const out = [];
  for (const m of R112_MILESTONES) if (aff >= m) out.push(ml[m]);
  return out;
}
// Chuẩn hoá S.aff từ save (thuần — test được): save cũ không có aff / aff hỏng → {}.
export function r112Migrate(raw) {
  const out = {};
  if (raw && typeof raw === 'object') {
    for (const k of Object.keys(R112_FAV)) { // chỉ giữ seq 0–8 của 9 NPC có tên
      const v = raw[k];
      if (Number.isInteger(v) && v >= 0) out[k] = v;
    }
  }
  return out;
}
// [R112-TESTABLE-END]

// ----- R112 runtime (THREE/DOM): lưu save, menu tặng quà, nút trong dialog/shop -----

// R112: vá S.aff (thân thiết từng NPC) vào S — cùng pattern p1InitQ2: loadSave() của core.js
// chạy trước module này nên đọc lại raw save để lấy aff nếu có. saveGame() stringify cả S
// nên aff được lưu/tải cùng save như q2.
(function r112InitAff() {
  let raw = (S.aff && typeof S.aff === 'object') ? S.aff : null;
  if (!raw) {
    try {
      const d = JSON.parse(store.get(SAVE_KEY) || '{}');
      if (d && d.aff && typeof d.aff === 'object') raw = d.aff;
    } catch (e) { /* save hỏng: thân thiết bắt đầu từ 0 */ }
  }
  S.aff = r112Migrate(raw);
})();

// R112: menu tặng quà — dựng động (không chạm index.html), mở đè lên hộp thoại/shop.
// Tái dùng panel hội thoại có sẵn: sau khi tặng, câu đáp của NPC hiện ngay trong dlg-text.
const r112Menu = document.createElement('div');
r112Menu.id = 'gift-menu';
r112Menu.style.cssText = 'display:none;position:fixed;bottom:110px;left:50%;transform:translateX(-50%);' +
  'z-index:30;width:min(430px,92vw);max-height:72vh;overflow-y:auto;background:rgba(12,15,22,.97);' +
  'border:1px solid #ff9db0;border-radius:12px;padding:14px;';
document.body.appendChild(r112Menu);
let r112MenuSeq = -1; // NPC đang mở menu tặng quà
export function openGiftMenu(seq) {
  if (!R112_FAV[seq]) return; // chỉ 9 NPC có tên mới nhận quà
  r112MenuSeq = seq;
  r112RenderGiftMenu();
  r112Menu.style.display = 'block';
}
export function closeGiftMenu() { r112Menu.style.display = 'none'; r112MenuSeq = -1; }
function r112RenderGiftMenu() {
  const seq = r112MenuSeq;
  const aff = r112AffGet(S.aff, seq);
  r112Menu.innerHTML = '';
  const head = document.createElement('div');
  head.innerHTML = `<b style="color:#ff9db0">🎁 Tặng quà cho ${npcName(npcs[seq])}</b>` +
    `<div style="font-size:13px;color:#ffd34d;margin:4px 0">Thân thiết: ❤${aff}</div>` +
    `<div style="font-size:13px;color:#eef0f4;font-style:italic;line-height:1.5">"${R112_FAV[seq].hint}"</div>`;
  r112Menu.appendChild(head);
  for (const g of R112_GIFTS) { // 9 nút quà — to ≥48px theo mobile-first
    const b = document.createElement('button');
    b.className = 'btn';
    b.style.cssText = 'width:100%;margin-top:8px;min-height:48px;text-align:left;';
    b.innerHTML = `<b>🎁 ${g.name}</b><br><span style="font-size:12px;opacity:.8">${g.desc}</span>`;
    b.onclick = () => giveGift(seq, g.id);
    r112Menu.appendChild(b);
  }
  const c = document.createElement('button');
  c.className = 'btn'; c.style.cssText = 'width:100%;margin-top:10px;';
  c.textContent = 'Thôi, để sau';
  c.onclick = closeGiftMenu;
  r112Menu.appendChild(c);
}
// R112: tặng quà cho NPC — đúng món +1 thân thiết + tim hồng, sai món chỉ cảm ơn xã giao.
// Trả true nếu tặng đúng món (test/dev dùng được).
export function giveGift(seq, giftId) {
  const n = npcs[seq];
  if (!n || !R112_FAV[seq]) return false;
  const res = r112Give(S.aff, seq, giftId);
  S.aff = res.aff;
  closeGiftMenu();
  saveGame(); // lưu thân thiết ngay (không chờ autosave)
  const gift = r112GiftById(giftId);
  const gname = gift ? gift.name : giftId;
  if (res.correct) {
    fxHooks.burst(n.x, 2.0, n.z, 0xff6b9d, 14, 1.8, 4); // tim hồng bay lên — juice có sẵn
    toast(`❤️ ${npcName(n)} rất thích ${gname}! (thân thiết +1)`);
    const line = R112_RESP_OK[seq] + (res.unlocked ? ' ' + R112_MILESTONE_LINES[seq][res.unlocked] : '');
    if (res.unlocked) toast(`💗 Mốc thân thiết ${res.unlocked}: mở câu thoại mới của ${npcName(n)}!`);
    if (dlgNPC === n) document.getElementById('dlg-text').textContent = line; // đáp ngay trong hộp thoại
  } else {
    toast(`🎁 Tặng ${gname} — ${npcName(n)}: "${R112_RESP_POLITE[seq]}"`);
    if (dlgNPC === n) document.getElementById('dlg-text').textContent = R112_RESP_POLITE[seq];
  }
  return res.correct;
}
// R112: nút "Tặng quà" trong hộp thoại NPC (hiện/ẩn theo openDialog/closeDialog ở trên)
export const btnGift = document.createElement('button');
btnGift.id = 'btn-gift';
btnGift.className = 'btn';
btnGift.textContent = '🎁 Tặng quà';
btnGift.style.cssText = 'width:100%;margin-top:8px;display:none;';
btnGift.onclick = () => { if (dlgNPC && R112_FAV[dlgNPC.seq] !== undefined) openGiftMenu(dlgNPC.seq); };
document.getElementById('dialog').appendChild(btnGift);
// R112: nút "Tặng quà" trong shop — Bà Tám Xén là NPC shop (E mở shop, không mở dialog)
// nên nút tặng quà đặt trong panel shop, trước nút Đóng.
export const btnGiftShop = document.createElement('button');
btnGiftShop.id = 'btn-gift-shop';
btnGiftShop.className = 'btn wide';
btnGiftShop.textContent = '🎁 Tặng quà cho bà Tám';
btnGiftShop.style.cssText = 'margin-top:8px;display:none;';
btnGiftShop.onclick = () => openGiftMenu(3);
document.getElementById('shop').insertBefore(btnGiftShop, document.getElementById('shop-close'));

// ---------- Q3. Quest "Trâu Cà Phê đi lạc" + lễ hội Trăng Rằm (tone ấm áp, học Stardew/Animal Crossing) ----------
// L1 (thế nào là xong): nói chuyện Cu Tít (seq 1) khi chưa nhận → nhận quest
// (tracker "Tìm trâu Cà Phê"); trâu dời ra đồng cỏ xa (Q3_LOST, có marker như rau P1);
// lại gần trâu + E → dắt về (trâu đi theo player 8s rồi tự về bãi cũ + toast);
// trả quest cho Cu Tít → +30 XP +50∞ (ngang quest 2), quest lưu vào save như quest 1/2.
// Lễ hội Trăng Rằm (nhẹ, 0 asset): DN.t trong [0.72,0.78] mỗi ngày là đêm rằm →
// đèn lồng sáng gấp đôi (world.js đọc cờ globalThis.__q3Ram) + toast 1 lần/đêm +
// NPC có tên tặng câu thoại rằm (+2 XP mỗi người, 1 lần/đêm).

// [Q3-TESTABLE-START]
// Q3 — máy trạng thái + lễ hội thuần (không THREE, không DOM, không import).
// Test trích block này qua regex rồi eval — giữ nguyên quy ước như các block *-TESTABLE-* cũ.
// state: 'none' (chưa nhận) → 'active' (đi tìm trâu) → 'found' (đang dắt về) → 'done' (đã trả quest).
export const Q3_HOME = [-6, 30];   // bãi chăn cũ — trùng chỗ trâu đứng trong world.js (VN-5)
export const Q3_LOST = [22, 62];   // đồng cỏ xa phía nam — trâu đi lạc ra đây khi nhận quest (cách bãi cũ ~42m)
export const Q3_FIND_DIST = 3;     // đứng trong 3m + E là dắt được (dây thừng dài hơn tầm tay 2.5m)
export const Q3_FOLLOW_TIME = 8;   // trâu đi theo player 8s rồi tự về bãi cũ (cozy: không fail-state)
export const Q3_REWARD_XP = 30;    // thưởng ngang quest 2 (P1: 30 XP vì tốn công đi tìm)
export const Q3_REWARD_INF = 50;   // ... + 50∞ (P1: 50∞ — đúng luật sắt "∞ kiếm từ tương tác")
export const Q3_CU_TIT_SEQ = 1;    // Cu Tít — người giao/trả quest (theo NAMED trong config.js)
export const Q3_RAM_T0 = 0.72;     // đầu đêm rằm (DN.t: 0.75 = nửa đêm, daynight.js)
export const Q3_RAM_T1 = 0.78;     // cuối đêm rằm — cửa sổ 0.06 ngày ≈ 21s thật (DAY_LEN 360s)
export const Q3_RAM_XP = 2;        // +2 XP mỗi NPC có tên khi chào đêm rằm (1 lần/đêm, quà tinh thần)
export function q3New() { return { state: 'none' }; }
// Nhận quest: chỉ từ 'none' → 'active'; nhận lại không reset tiến độ cũ
export function q3Accept(q) {
  if (!q || q.state !== 'none') return q;
  return { ...q, state: 'active' };
}
// Tìm thấy trâu (lại gần + E): 'active' → 'found' (bắt đầu dắt về)
export function q3Found(q) {
  if (!q || q.state !== 'active') return q;
  return { ...q, state: 'found' };
}
// Trả quest cho Cu Tít: chỉ khi đang dắt (found) → 'done'; chưa dắt thì giữ nguyên
export function q3TurnIn(q) {
  if (!q || q.state !== 'found') return q;
  return { ...q, state: 'done' };
}
// Dòng tracker cho HUD (cùng pattern q2TrackerText — div riêng quest3-tracker)
export function q3TrackerText(q) {
  if (!q || q.state === 'none') return '';
  if (q.state === 'done') return '🐃 Trâu Cà Phê đi lạc: ✓ hoàn thành!';
  if (q.state === 'found') return '🐃 Dắt trâu về rồi! Trả quest cho Cu Tít nhé';
  return '🐃 Tìm trâu Cà Phê: ra đồng cỏ phía nam tìm trâu';
}
// Chuẩn hoá q3 từ save (thuần — test được): save cũ không có q3 / q3 hỏng → mặc định an toàn
export function q3Migrate(raw) {
  const q = (raw && typeof raw === 'object') ? raw : null;
  const ok = q && (q.state === 'active' || q.state === 'found' || q.state === 'done');
  return { state: ok ? q.state : 'none' };
}
// Đêm rằm: DN.t trong cửa sổ [0.72,0.78] mỗi ngày (quanh nửa đêm 0.75)
export function q3IsFullMoon(t) {
  return typeof t === 'number' && t >= Q3_RAM_T0 && t <= Q3_RAM_T1;
}
// Câu thoại rằm ấm áp của NPC có tên (giọng sum họp, đúng tone VN cozy)
export function q3RamLine(name) {
  return `Trăng rằm sáng vằng vặc, ${name} cười: "Đêm rằm sum họp, cháu nhớ về ăn bánh với gia đình nhé!"`;
}
// Chào rằm chưa? mỗi NPC 1 lần/đêm — met là mảng seq đã chào (thuần, không sửa mảng gốc)
export function q3RamCanGreet(met, seq) {
  return Array.isArray(met) && !met.includes(seq);
}
export function q3RamGreet(met, seq) {
  if (!q3RamCanGreet(met, seq)) return Array.isArray(met) ? met : [];
  return [...met, seq];
}
// [Q3-TESTABLE-END]

// ----- Q3 runtime (THREE/DOM): tracker, marker, dắt trâu, móc hội thoại, cờ đêm rằm -----

// Q3: tracker quest 3 trên HUD — tạo động (không chạm index.html/ui.js, cùng pattern với p1QuestEl)
const q3QuestEl = document.createElement('div');
q3QuestEl.id = 'quest3-tracker';
q3QuestEl.style.cssText = 'font-size:13px;font-weight:600;color:#ffd9a0;margin-top:2px;display:none;';
document.getElementById('quest').after(q3QuestEl);
function q3RenderTracker() {
  const t = q3TrackerText(S.q3);
  q3QuestEl.style.display = t ? 'block' : 'none';
  q3QuestEl.textContent = t;
}

// Q3: vá trạng thái quest 3 vào S (không được chạm core.js nên migrate ở đây — cùng pattern p1InitQ2)
(function q3InitQ3() {
  let raw = (S.q3 && typeof S.q3 === 'object') ? S.q3 : null;
  if (!raw) {
    try {
      const d = JSON.parse(store.get(SAVE_KEY) || '{}');
      if (d && d.q3 && typeof d.q3 === 'object') raw = d.q3;
    } catch (e) { /* save hỏng: quest bắt đầu từ chưa nhận */ }
  }
  S.q3 = q3Migrate(raw);
})();

// Q3: đặt trâu + dời chắn va chạm theo (kẻo player kẹt vào "trâu vô hình" ở bãi cũ)
function q3PlaceTrau(x, z) {
  if (!vnTrau) return;
  vnTrau.group.position.set(x, groundHeight(x, z), z);
  const ob = obstacles.find(o => o.trau);
  if (ob) { ob.x = x; ob.z = z; }
}
// Tải save đang tìm trâu dở → trâu vẫn ở đồng cỏ xa; còn lại trâu ở bãi cũ
q3PlaceTrau(...(S.q3.state === 'active' ? Q3_LOST : Q3_HOME));

// Q3: marker ấm (vàng trăng rằm) trên đầu trâu đi lạc — cùng pattern p1MakeMarker
function q3MakeMarker() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  grd.addColorStop(0, 'rgba(255,225,150,0.95)');
  grd.addColorStop(1, 'rgba(255,190,90,0)');
  g.fillStyle = grd; g.beginPath(); g.arc(32, 32, 30, 0, 7); g.fill();
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false }));
  spr.scale.set(1.4, 1.4, 1); spr.renderOrder = 6;
  return spr;
}
export const q3Marker = q3MakeMarker();
scene.add(q3Marker);
q3Marker.visible = false;

// ---------- Q3: dắt trâu — lại gần (<3m) + phím E / nút Dắt (mobile) ----------
export let nearTrau = false;
function q3NearTrau() {
  if (!S.q3 || S.q3.state !== 'active' || !vnTrau) return false;
  const bp = vnTrau.group.position;
  return Math.hypot(bp.x - P.x, bp.z - P.z) < Q3_FIND_DIST;
}
let q3FollowT = 0; // >0: trâu đang đi theo player (giây còn lại)
export function q3Lead() { // dắt trâu về — trả true nếu dắt được
  if (!nearTrau || !S.q3 || S.q3.state !== 'active' || dlgNPC || shopOpen) return false;
  S.q3 = q3Found(S.q3);
  q3FollowT = Q3_FOLLOW_TIME;
  q3RenderTracker(); saveGame();
  toast('🐃 Tìm thấy trâu Cà Phê rồi! Cứ đi thong thả, em nó theo sau về bãi');
  fxHooks.burst(P.x, 1.8, P.z, 0xffd98a, 10, 1.6, 3.5);
  return true;
}
// Nút "Dắt" cho mobile — tạo động (không chạm index.html), to ≥76px theo mobile-first
export const btnLead = document.createElement('button');
btnLead.id = 'btn-lead';
btnLead.textContent = '🐃 Dắt';
btnLead.setAttribute('aria-label', 'Dắt trâu Cà Phê về');
btnLead.style.cssText = 'display:none;position:fixed;right:110px;bottom:210px;z-index:40;' +
  'min-width:76px;min-height:76px;border-radius:50%;font-size:18px;font-weight:700;' +
  'background:rgba(150,100,30,.95);color:#fff;border:3px solid #ffd98a;' +
  'box-shadow:0 2px 10px rgba(0,0,0,.4);';
btnLead.onclick = () => q3Lead();
document.body.appendChild(btnLead);

// Q3: móc quest vào lần gặp Cu Tít (cùng pattern p1BaTamQuest — idempotent, gọi kép vô hại)
function q3CuTitQuest(n) {
  if (!n || n.seq !== Q3_CU_TIT_SEQ || !S.q3) return;
  if (S.q3.state === 'none') { // nhận quest lần đầu gặp — trâu đi lạc ra đồng cỏ xa
    S.q3 = q3Accept(S.q3);
    q3PlaceTrau(Q3_LOST[0], Q3_LOST[1]);
    toast('🐃 Cu Tít mếu máo: "Trâu Cà Phê đi lạc ra đồng cỏ phía nam rồi! Anh tìm giúp em với!"');
    fxHooks.burst(n.x, 1.8, n.z, 0xffd98a, 10, 1.6, 3.5);
    updateHUD(); q3RenderTracker(); saveGame();
  } else if (S.q3.state === 'found') { // dắt trâu về rồi → trả quest, thưởng ngang quest 2
    S.q3 = q3TurnIn(S.q3);
    addInf(Q3_REWARD_INF); addXP(Q3_REWARD_XP); // addXP tự updateHUD + saveGame
    toast(`🎯 Hoàn thành: Trâu Cà Phê đi lạc! +${Q3_REWARD_XP} XP · +${Q3_REWARD_INF}∞ — "Em cảm ơn anh An nhiều lắm!"`);
    fxHooks.burst(n.x, 1.8, n.z, 0xffd34d, 16, 2.2, 4);
    updateHUD(); q3RenderTracker(); saveGame();
  }
  // active (chưa tìm thấy trâu): không spam toast — câu thoại thường của Cu Tít đã đủ gợi ý
}

// Q3 (lễ hội Trăng Rằm): seq NPC đã chào rằm trong đêm nay + đã toast đêm nay chưa
// (reset khi hết cửa sổ rằm nên "1 lần/đêm" đúng cả khi chơi xuyên đêm, không cần lưu save)
let q3RamMet = [];
let q3RamToasted = false;
function q3Tick(dt) { // gọi mỗi frame từ updateNPCAnim (cùng chỗ p1TickVeggieMarkers)
  // Đêm rằm: bật cờ cho world.js (đèn lồng sáng gấp đôi) + toast chào rằm 1 lần/đêm
  const ram = q3IsFullMoon(DN.t);
  globalThis.__q3Ram = ram;
  if (ram && !q3RamToasted) {
    q3RamToasted = true;
    toast('🌕 Đêm rằm! Đèn lồng sáng rực khắp làng — ra chào bà con một câu nhé!');
  }
  if (!ram) { // hết rằm → reset để đêm sau lại chào/toast từ đầu
    q3RamToasted = false;
    if (q3RamMet.length) q3RamMet = [];
  }
  if (!vnTrau) return;
  const bp = vnTrau.group.position;
  if (q3FollowT > 0) { // trâu đi theo player 8s rồi tự về bãi cũ (cozy: không fail-state)
    q3FollowT -= dt;
    const dx = P.x - bp.x, dz = P.z - bp.z;
    const d = Math.hypot(dx, dz);
    if (d > 1.8) { // giữ khoảng cách 1.8m cho khỏi chồng lên player
      const step = Math.min(d - 1.5, 4.5 * dt);
      bp.x += (dx / d) * step; bp.z += (dz / d) * step;
      bp.y = groundHeight(bp.x, bp.z);
      vnTrau.group.rotation.y = Math.atan2(dx, dz);
    }
    if (q3FollowT <= 0) {
      q3PlaceTrau(Q3_HOME[0], Q3_HOME[1]);
      toast('🐃 Trâu Cà Phê tự về bãi cũ rồi! Ra báo cho Cu Tít một tiếng nhé');
    }
  }
  // Marker trăng rằm bay bổng trên đầu trâu — chỉ hiện khi đang đi tìm (active)
  const show = !!S.q3 && S.q3.state === 'active';
  q3Marker.visible = show;
  if (show) q3Marker.position.set(bp.x, bp.y + 2.8 + Math.sin(tGlobal * 3 + 0.7) * 0.18, bp.z);
}
updateHUD(); q3RenderTracker(); // vẽ tracker q3 sau khi S.q3 đã khởi tạo

// ---------- Q4. Quest "Bánh ít cho Ông Đồ" kiểu ĐƯA ĐỒ (backlog P6, học Stardew delivery) ----------
// L1 (thế nào là xong): mở shop Bà Tám Xén (seq 3) khi chưa nhận → nhận quest + nhận
// "Gói bánh ít" (tracker "Mang bánh cho Ông Đồ"); nói chuyện Ông Đồ Nho (seq 2, dialog)
// khi đang giữ bánh → trao bánh (delivered); quay lại mở shop Bà Tám → trả quest
// +30 XP +50∞ (ngang quest 2/3), quest lưu vào save như quest 1/2/3.
// Schell (cozy, không fail-state): bánh nằm trong trạng thái quest (active = đang giữ),
// không có chỗ nào làm mất/rơi bánh — bỏ đi đâu, thoát game giữa chừng cũng không mất.

// [Q4-TESTABLE-START]
// Q4 — máy trạng thái thuần (không THREE, không DOM, không import).
// Test trích block này qua regex rồi eval — giữ nguyên quy ước như các block *-TESTABLE-* cũ.
// state: 'none' (chưa nhận) → 'active' (đang giữ bánh) → 'delivered' (đã trao bánh) → 'done' (đã trả quest).
export const Q4_BA_TAM_SEQ = 3;    // Bà Tám Xén — người giao + nhận trả quest (theo NAMED trong config.js)
export const Q4_ONG_DO_SEQ = 2;    // Ông Đồ Nho — người nhận bánh (theo NAMED trong config.js)
export const Q4_ITEM_NAME = 'Gói bánh ít'; // vật phẩm quest (nằm trong trạng thái, không tốn túi đồ)
export const Q4_REWARD_XP = 30;    // thưởng ngang quest 2/3 (P1: 30 XP vì tốn công đi đưa)
export const Q4_REWARD_INF = 50;   // ... + 50∞ (đúng luật sắt "∞ kiếm từ tương tác")
export function q4New() { return { state: 'none' }; }
// Nhận quest: chỉ từ 'none' → 'active' (kèm nhận bánh); nhận lại không reset tiến độ cũ
export function q4Accept(q) {
  if (!q || q.state !== 'none') return q;
  return { ...q, state: 'active' };
}
// Trao bánh cho Ông Đồ: 'active' (đang giữ bánh) → 'delivered' (đã trao)
export function q4Deliver(q) {
  if (!q || q.state !== 'active') return q;
  return { ...q, state: 'delivered' };
}
// Trả quest cho Bà Tám: chỉ khi đã trao bánh (delivered) → 'done'; chưa trao giữ nguyên
export function q4TurnIn(q) {
  if (!q || q.state !== 'delivered') return q;
  return { ...q, state: 'done' };
}
// Đang giữ bánh thì được trao (dùng ở runtime + test cho rõ ý, không bắt buộc)
export function q4CanDeliver(q) { return !!q && q.state === 'active'; }
// Đã trao bánh thì được trả quest
export function q4CanTurnIn(q) { return !!q && q.state === 'delivered'; }
export function q4Reward() { return { xp: Q4_REWARD_XP, inf: Q4_REWARD_INF }; }
// Dòng tracker cho HUD (cùng pattern q2TrackerText/q3TrackerText — div riêng quest4-tracker)
export function q4TrackerText(q) {
  if (!q || q.state === 'none') return '';
  if (q.state === 'done') return '🍡 Bánh ít cho Ông Đồ: ✓ hoàn thành!';
  if (q.state === 'delivered') return '🍡 Đã trao bánh! Quay về báo cho Bà Tám Xén nhé';
  return `🍡 Mang bánh cho Ông Đồ: đem ${Q4_ITEM_NAME} tới Ông Đồ Nho`;
}
// Chuẩn hoá q4 từ save (thuần — test được): save cũ không có q4 / q4 hỏng → mặc định an toàn
export function q4Migrate(raw) {
  const q = (raw && typeof raw === 'object') ? raw : null;
  const ok = q && (q.state === 'active' || q.state === 'delivered' || q.state === 'done');
  return { state: ok ? q.state : 'none' };
}
// [Q4-TESTABLE-END]

// ----- Q4 runtime (THREE/DOM): tracker, móc hội thoại/shop, lưu save -----

// Q4: tracker quest 4 trên HUD — tạo động (không chạm index.html/ui.js, cùng pattern với p1QuestEl/q3QuestEl)
const q4QuestEl = document.createElement('div');
q4QuestEl.id = 'quest4-tracker';
q4QuestEl.style.cssText = 'font-size:13px;font-weight:600;color:#f5c8dd;margin-top:2px;display:none;';
document.getElementById('quest').after(q4QuestEl);
function q4RenderTracker() {
  const t = q4TrackerText(S.q4);
  q4QuestEl.style.display = t ? 'block' : 'none';
  q4QuestEl.textContent = t;
}

// Q4: vá trạng thái quest 4 vào S (không được chạm core.js nên migrate ở đây — cùng pattern p1InitQ2/q3InitQ3)
(function q4InitQ4() {
  let raw = (S.q4 && typeof S.q4 === 'object') ? S.q4 : null;
  if (!raw) {
    try {
      const d = JSON.parse(store.get(SAVE_KEY) || '{}');
      if (d && d.q4 && typeof d.q4 === 'object') raw = d.q4;
    } catch (e) { /* save hỏng: quest bắt đầu từ chưa nhận */ }
  }
  S.q4 = q4Migrate(raw);
})();

// Q4: móc quest vào lần mở shop Bà Tám Xén (cùng pattern p1BaTamQuest — idempotent, gọi kép vô hại).
// Bà là NPC shop nên E mở shop, không mở dialog — vì vậy cả nhận quest lẫn trả quest đều ở đây.
function q4BaTamQuest() {
  if (!S.q4) return; // S.q4 luôn được q4InitQ4 dựng — guard phòng save lạ
  const n = npcs[Q4_BA_TAM_SEQ]; // Bà Tám Xén — seq 3, theo NAMED trong config.js
  if (S.q4.state === 'none') { // nhận quest lần đầu mở shop + nhận bánh (bánh nằm trong state, không mất được)
    S.q4 = q4Accept(S.q4);
    toast(`Bà Tám Xén: "Cháu đem ${Q4_ITEM_NAME} này qua cho Ông Đồ Nho giúp bà nhé, ông đang mong đó!" 🍡`);
    fxHooks.burst(n.x, 1.8, n.z, 0xf5c8dd, 10, 1.6, 3.5);
    updateHUD(); q4RenderTracker(); saveGame();
  } else if (q4CanTurnIn(S.q4)) { // đã trao bánh cho Ông Đồ → trả quest, thưởng ngang quest 2/3
    S.q4 = q4TurnIn(S.q4);
    const r = q4Reward();
    addInf(r.inf); addXP(r.xp); // addXP tự updateHUD + saveGame
    toast(`🎯 Hoàn thành: Bánh ít cho Ông Đồ! +${r.xp} XP · +${r.inf}∞ — "Bà cảm ơn cháu nhiều lắm!"`);
    fxHooks.burst(n.x, 1.8, n.z, 0xffd34d, 16, 2.2, 4);
    updateHUD(); q4RenderTracker(); saveGame();
  }
  // active (đang giữ bánh, chưa trao) / done: không spam toast — tracker HUD đã đủ gợi ý
}

// Q4: móc quest vào lần nói chuyện Ông Đồ Nho (dialog, cùng pattern q3CuTitQuest — idempotent).
// Chỉ khi đang giữ bánh (active) mới trao; các mốc khác không làm gì (không fail-state:
// nói chuyện sớm/muộn, bỏ đi đâu cũng không mất bánh).
function q4OngDoQuest(n) {
  if (!n || n.seq !== Q4_ONG_DO_SEQ || !S.q4) return;
  if (q4CanDeliver(S.q4)) { // đang giữ bánh → trao bánh
    S.q4 = q4Deliver(S.q4);
    toast(`🍡 Ông Đồ Nho cười hiền: "Bánh ít của Bà Tám đây mà! Cháu thay ông cảm ơn bà ấy nhé!"`);
    fxHooks.burst(n.x, 1.8, n.z, 0xf5c8dd, 10, 1.6, 3.5);
    updateHUD(); q4RenderTracker(); saveGame();
  }
}
updateHUD(); q4RenderTracker(); // vẽ tracker q4 sau khi S.q4 đã khởi tạo

// ---------- Q5. Quest "Giếng bẩn" — R4 vertical slice 8 phút ----------
// Vòng slice: Bà Lụa (seq 0) nhờ → ra ao hạ 3 quái quanh ao → về gặp Bà Lụa →
// giếng xây MIỄN PHÍ (vilShow) + thưởng. Tái dùng toàn hệ cũ: dialog, killMonster,
// VIL visual/tracker. Không fail-state: đi đâu, đánh gì cũng không hỏng quest.
const q5QuestEl = document.createElement('div');
q5QuestEl.id = 'quest5-tracker';
q5QuestEl.style.cssText = 'font-size:13px;font-weight:600;color:#9adcff;margin-top:2px;display:none;';
document.getElementById('quest').after(q5QuestEl);
function q5RenderTracker() {
  const t = q5TrackerText(S.q5);
  q5QuestEl.style.display = t ? 'block' : 'none';
  q5QuestEl.textContent = t;
}
(function q5InitQ5() { // vá S.q5 từ save (cùng pattern q2/q3/q4)
  let raw = (S.q5 && typeof S.q5 === 'object') ? S.q5 : null;
  if (!raw) {
    try {
      const d = JSON.parse(store.get(SAVE_KEY) || '{}');
      if (d && d.q5 && typeof d.q5 === 'object') raw = d.q5;
    } catch (e) { /* save hỏng: quest bắt đầu từ chưa nhận */ }
  }
  S.q5 = q5Migrate(raw);
})();
function q5BaLuaQuest(n) { // móc vào openDialog, idempotent như q3/q4
  if (!n || n.seq !== 0 || !S.q5) return;
  if (S.q5.state === 'none') { // nhận quest: nghe chuyện giếng bẩn
    S.q5 = q5Accept(S.q5);
    toast('Bà Lụa: "Giếng làng có mùi lạ... chắc vũng thiu ngoài ao tràn vào. Cháu ra ao dọn 3 con giúp bà nhé!" 💧');
    fxHooks.burst(n.x, 1.8, n.z, 0x9adcff, 10, 1.6, 3.5);
    updateHUD(); q5RenderTracker(); saveGame();
  } else if (q5CanTurnIn(S.q5)) { // đủ 3 con → trả: giếng xây miễn phí + thưởng
    S.q5 = q5TurnIn(S.q5);
    addInf(Q5_REWARD_INF); addXP(Q5_REWARD_XP);
    if (S.vil && !S.vil.gieng) { // slice payoff: làng đổi ngay — giếng mọc mái miễn phí
      S.vil.gieng = true; vilShow('gieng'); vilRenderTracker();
      toast(`🎯 Hoàn thành: Giếng bẩn! Giếng làng đã sạch (miễn phí!) +${Q5_REWARD_XP} XP · +${Q5_REWARD_INF}∞ — "Nước mát quá, cả làng cảm ơn cháu!"`);
    } else { // giếng đã xây từ trước: thưởng thêm thay vì xây lại
      addInf(30);
      toast(`🎯 Hoàn thành: Giếng bẩn! +${Q5_REWARD_XP} XP · +${Q5_REWARD_INF + 30}∞ — "Giếng đã sạch rồi, bà thưởng thêm cho cháu!"`);
    }
    fxHooks.burst(n.x, 1.8, n.z, 0xffd34d, 16, 2.2, 4);
    updateHUD(); q5RenderTracker(); saveGame();
  }
  // active (chưa đủ 3) / done: không spam — tracker HUD đã đủ gợi ý
}
q5RenderTracker(); // vẽ tracker q5 sau khi S.q5 đã khởi tạo
