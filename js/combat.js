// js/combat.js — quái, combat, né, hạt juice, đom đóm, glow (tách từ app.js, giữ nguyên logic)
import * as THREE from 'three';
import { S, P, DN, Q, atkOf, defOf, maxHpOf, saveGame } from './core.js';
import { scene, camera, sun, skyU } from './engine.js';
import { groundHeight, slopeAt, obstacles, canvasTex, lanterns } from './world.js';
import { updateHUD, toast, addInf, addXP } from './ui.js';
import { player, tGlobal, isTouch, dlgNPC, shopOpen } from './actors.js';
import { DAY_LEN, PMAX, FFN, POND } from './config.js'; // POND: ổ boss Vũng Thiu Mẹ ở ao đông
import { P2_KINDS, isNightAt, timeUntilNight, crabFrontFactor, batHittable, glowTextureSpec, ffGlowCount, BLOOM, bloomAllowed, glowIntensity, statBoss, q5Kill, q5CanTurnIn, Q5_AO_R } from './utils.js';
import { vnVayQuatTex, vnDaTrauTex, vnLaSenTex } from './vn.js'; // VN: vảy quái + da sần + lá sen cho boss (canvas 0 byte)
// ---------- 7g. Combat tối giản (v3) — đúng CO_CHE_GAME 5.1 ----------
// Quái "con của vũng thiu": blob xanh đen, lang thang rìa làng, đuổi khi player lại gần
export function dmgCalc(atk, def) { // công thức sát thương chuẩn của INFINIA
  return atk * (100 / (100 + def)) * (0.9 + Math.random() * 0.2);
}
export const monsters = [];
// P2: mỗi loại quái một ngoại hình riêng (D6 Koster — mỗi quái là 1 mẫu hình mới để học,
// không copy đổi màu tăng máu). Quái Vẩn cũ giữ nguyên y hệt.
export function makeMonster(kind) {
  const cfg = P2_KINDS[kind];
  const g = new THREE.Group();
  let body, blobMat, wingL = null, wingR = null, clawL = null, clawR = null;
  if (kind === 'doi') { // Dơi Sương Đêm: thân tím đêm, cánh dơi đập liên tục, mắt cam — bay lơ lửng
    blobMat = new THREE.MeshStandardMaterial({ color: 0x2e2542, roughness: 0.7, metalness: 0.05 });
    body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), blobMat);
    body.scale.set(1, 0.9, 1.25); body.position.y = 2.3; body.castShadow = true;
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x241d36, roughness: 0.9, side: THREE.DoubleSide });
    const wgeo = new THREE.PlaneGeometry(1.15, 0.55);
    wingL = new THREE.Mesh(wgeo, wingMat); wingL.position.set(-0.75, 2.45, -0.05);
    wingR = new THREE.Mesh(wgeo, wingMat); wingR.position.set(0.75, 2.45, -0.05);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffa63d }); // mắt cam — khác hẳn mắt trắng quái Vẩn
    const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), eyeMat);
    e1.position.set(-0.12, 2.42, 0.34);
    const e2 = e1.clone(); e2.position.x = 0.12;
    g.add(body, wingL, wingR, e1, e2);
  } else if (kind === 'cua') { // Cua Đá Già: mai đỏ gạch dẹt, càng to, mắt trên cuống — nhìn là biết "giáp dày"
    blobMat = new THREE.MeshStandardMaterial({ color: 0x8a4a2f, roughness: 0.6, metalness: 0.1 });
    body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 12), blobMat);
    body.scale.set(1.15, 0.55, 1); body.position.y = 0.42; body.castShadow = true;
    const clawMat = new THREE.MeshStandardMaterial({ color: 0xa85a38, roughness: 0.55 });
    clawL = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), clawMat);
    clawL.scale.set(1, 1.25, 1.1); clawL.position.set(-0.5, 0.35, 0.5); clawL.castShadow = true;
    clawR = clawL.clone(); clawR.position.x = 0.5;
    const stalkMat = new THREE.MeshStandardMaterial({ color: 0x6e3a26, roughness: 0.7 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfff6e8 });
    const s1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 6), stalkMat);
    s1.position.set(-0.14, 0.78, 0.32);
    const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), eyeMat);
    e1.position.set(-0.14, 0.92, 0.32);
    const s2 = s1.clone(); s2.position.x = 0.14;
    const e2 = e1.clone(); e2.position.x = 0.14;
    g.add(body, clawL, clawR, s1, s2, e1, e2);
  } else { // Quái Vẩn — BẢN VIỆT: blob vảy sần + sừng tre + răng (nhìn "có hồn" hơn)
    blobMat = new THREE.MeshStandardMaterial({ map: vnVayQuatTex(), roughness: 0.6, metalness: 0.1 });
    body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 12), blobMat);
    body.scale.y = 0.75; body.position.y = 0.45; body.castShadow = true;
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xe8f4ff }); // mắt trắng cho có hồn
    const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), eyeMat);
    e1.position.set(-0.18, 0.62, 0.42);
    const e2 = e1.clone(); e2.position.x = 0.18;
    // VN: 2 sừng tre nhỏ + răng nanh (quái rừng tre)
    const sungM = new THREE.MeshStandardMaterial({ color: 0xd9c9a0, roughness: 0.8 });
    const s1 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 6), sungM);
    s1.position.set(-0.3, 0.95, 0); s1.rotation.z = 0.4;
    const s2 = s1.clone(); s2.position.x = 0.3; s2.rotation.z = -0.4;
    const rangM = new THREE.MeshBasicMaterial({ color: 0xfff3d6 });
    const r1 = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 5), rangM);
    r1.position.set(-0.12, 0.38, 0.48); r1.rotation.x = Math.PI;
    const r2 = r1.clone(); r2.position.x = 0.12;
    g.add(body, e1, e2, s1, s2, r1, r2);
  }
  const c = document.createElement('canvas'); c.width = 128; c.height = 16; // thanh HP trên đầu
  const tex = new THREE.CanvasTexture(c);
  const bar = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  bar.scale.set(1.6, 0.2, 1);
  bar.position.y = kind === 'doi' ? 3.5 : 1.3; // dơi bay cao → thanh HP đặt cao hơn
  bar.renderOrder = 6;
  g.add(bar);
  scene.add(g);
  // J12: tỉ lệ gốc của thân (để squash không làm lệch dáng từng loại quái)
  const bs = body.scale;
  return { g, body, blobMat, wingL, wingR, clawL, clawR, canvas: c, tex, bar,
           kind, cfg, x: 0, z: 0, hp: cfg.hp, maxHp: cfg.hp, alive: true,
           state: 'idle', timer: Math.random() * 2, tx: 0, tz: 0, atkCd: 0, respawnT: 0,
           flash: 0, diveT: 0, phase: Math.random() * 6.28, kengCd: 0,
           squashT: 0, tele: false, sx0: bs.x, sy0: bs.y, sz0: bs.z };
}
export function drawMonsterHP(m) {
  const g = m.canvas.getContext('2d');
  g.clearRect(0, 0, 128, 16);
  g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 0, 128, 16);
  g.fillStyle = '#e0393e';
  g.fillRect(2, 2, 124 * Math.max(0, Math.min(1, m.hp / m.maxHp)), 12); // kẹp 0–1: tránh tràn khi hp vượt max (vd ?shot=combat ghim hp cao)
  m.tex.needsUpdate = true;
}
export function monsterSpot() { // điểm spawn quanh rìa làng, tránh dốc và tránh nhà
  for (let t = 0; t < 30; t++) {
    const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 18;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (slopeAt(x, z) > 0.5) continue;
    let ok = true;
    for (const o of obstacles) if (Math.hypot(x - o.x, z - o.z) < o.r + 1.5) { ok = false; break; }
    if (ok) return [x, z];
  }
  return [38, 0];
}
export function spawnMonster(m) {
  if (m.kind === 'doi' && !isNightAt(DN.t)) {
    // P2: dơi chỉ ra khi đêm — ban ngày thì nằm im, hẹn respawn tới đầu đêm
    m.alive = false; m.g.visible = false;
    m.respawnT = Math.max(1, timeUntilNight(DN.t, DAY_LEN) + 2);
    return;
  }
  const [x, z] = monsterSpot();
  m.x = x; m.z = z; m.hp = m.cfg.hp; m.maxHp = m.cfg.hp; m.alive = true; m.state = 'idle'; m.timer = 1;
  m.diveT = 0; m.kengCd = 0;
  m.g.visible = true;
  m.g.position.set(x, groundHeight(x, z) + (m.kind === 'doi' ? 2.3 : 0), z);
  drawMonsterHP(m);
}
// P2: 4 Quái Vẩn + 2 Dơi Sương Đêm + 2 Cua Đá Già — quái cũ giữ nguyên số lượng/vị trí
for (const kind of ['vun', 'doi', 'cua'])
  for (let i = 0; i < P2_KINDS[kind].count; i++) { const m = makeMonster(kind); spawnMonster(m); monsters.push(m); }

// [V5-TESTABLE-START]
// V5: hằng số vệt chém — vòng cung mảnh, trong suốt dần về rìa. Toàn hàm/hằng thuần
// túy (không phụ thuộc THREE hay browser) để test được bằng node.
// radiusFrac: 0 = rìa trong, 1 = rìa ngoài; timeFrac: 0 = mới chém, 1 = hết thời gian hiện.
const V5_ARC_THETA = 100 * Math.PI / 180; // góc cung ~100° — cung mảnh (luôn < 180°)
const V5_INNER_R = 1.75; // bán kính rìa trong của vành (đơn vị game, m)
const V5_OUTER_R = 2.15; // bán kính rìa ngoài — vành mảnh: outer/inner ≈ 1.23
function v5AlphaAt(radiusFrac, timeFrac) { // alpha 0–1: cao ở rìa trong, mờ dần về rìa ngoài + theo thời gian
  if (timeFrac >= 1) return 0; // hết thời gian → tắt hẳn
  if (timeFrac <= 0 || radiusFrac <= 0 || radiusFrac >= 1) return 0;
  const edgeFade = Math.pow(1 - radiusFrac, 1.5); // trong suốt dần từ rìa trong ra rìa ngoài
  const timeFade = 1 - timeFrac; // mờ dần trong 0.15s hiện vệt
  return Math.max(0, Math.min(1, edgeFade * timeFade));
}
// [V5-TESTABLE-END]

// [M11-TESTABLE-START]
// M11 (học Balatro): combo counter — đánh trúng liên tiếp tăng combo; mốc 10/25/50
// có hiệu ứng riêng + thưởng ∞ nhỏ. Block thuần túy (không đụng THREE/DOM) để test bằng node.
const M11_COMBO_TIMEOUT = 3; // 3s không đánh trúng → combo reset
const M11_MILESTONES = [10, 25, 50]; // các mốc combo có hiệu ứng riêng
const M11_BONUS = { 10: 5, 25: 15, 50: 40 }; // thưởng ∞ nhỏ ở mỗi mốc — không phá cân bằng cũ
function m11NextCombo(combo) { // combo kế tiếp khi 1 đòn trúng (chặn số âm/lẻ)
  return Math.max(0, Math.floor(combo)) + 1;
}
function m11IsMilestone(combo) { // có phải mốc hiệu ứng 10/25/50?
  return M11_MILESTONES.includes(combo);
}
function m11MilestoneBonus(combo) { // thưởng ∞ ở mốc; 0 nếu không phải mốc
  return M11_BONUS[combo] || 0;
}
function m11ShouldReset(lastHitT, nowT) { // hết 3s kể từ đòn trúng cuối → reset
  return (nowT - lastHitT) > M11_COMBO_TIMEOUT;
}
function m11ScaleFor(combo) { // số combo to dần theo combo; kẹp tối đa để không che màn hình
  return Math.min(1 + combo / 20, 2.2); // combo ≥ 24 → to gấp 2.2 lần
}
// [M11-TESTABLE-END]

// [R111-TESTABLE-START]
// R11-1 (học Vampire Survivors): đánh tự động mặc định + đồ tự hút — đúng chất cozy:
// player không phải bấm đánh liên tục (chơi 1 tay trên mobile vẫn vui), đồ rơi tự
// bay về tay. DPS tự đánh BẰNG HỆT đánh tay vì runtime gọi đúng playerAttack().
// Toàn hàm/hằng thuần túy (không phụ thuộc THREE/DOM) để test được bằng node.
const R111_AUTO_RANGE = 2.5;    // tầm tự đánh: quái trong 2.5m thì tự vung đòn
const R111_MAGNET_RANGE = 2.5;   // tầm hút đồ: vật rơi trong 2.5m tự bay về player
const R111_MAGNET_SPEED = 7;     // tốc độ vật bay về (m/s) — nhanh gọn, không chờ lâu
const R111_MAGNET_COLLECT = 0.6; // vật tới gần 0.6m thì coi như nhặt xong
const R111_AUTO_STATE = { on: true }; // toggle đánh tự động — MẶC ĐỊNH BẬT (R11-1)
function r111Toggle() { // đảo bật/tắt đánh tự động; trả về trạng thái mới
  R111_AUTO_STATE.on = !R111_AUTO_STATE.on;
  return R111_AUTO_STATE.on;
}
function r111Dist(ax, az, bx, bz) { return Math.hypot(ax - bx, az - bz); } // khoảng cách 2D
function r111InRange(px, pz, ix, iz, range) { // vật/quái có nằm trong tầm không?
  return r111Dist(px, pz, ix, iz) <= range;
}
function r111NearestInRange(list, px, pz, range) { // mục tiêu GẦN NHẤT còn sống trong tầm; null nếu không có
  let best = null, bestD = range;
  for (const it of list) {
    if (it.alive === false || it.shotPin) continue; // bỏ quái đã chết + quái ghim chụp ảnh (?shot=)
    const d = r111Dist(px, pz, it.x, it.z);
    if (d <= bestD) { bestD = d; best = it; }
  }
  return best;
}
function r111AimAngle(dx, dz) { // góc rotation.y để quay mặt về hướng (dx,dz) — khớp player.rotation.y trong game
  return Math.atan2(dx, dz);
}
function r111HitsIn(seconds, cooldown) { // số đòn đánh được trong X giây với cooldown cho trước
  if (cooldown <= 0 || seconds <= 0) return 0;
  return Math.floor(seconds / cooldown);
}
function r111HitsToKill(hp, dmgPerHit) { // cần mấy đòn để hạ quái (dmgPerHit > 0)
  if (dmgPerHit <= 0 || hp <= 0) return Infinity;
  return Math.ceil(hp / dmgPerHit);
}
function r111MagnetStep(it, px, py, pz, dt) { // 1 bước: vật bay về phía player; true = đã tới tay
  const ty = py + 1; // vật bay về ngang ngực player cho đẹp mắt
  const dx = px - it.x, dy = ty - (it.y || 0), dz = pz - it.z;
  const d = Math.hypot(dx, dy, dz);
  if (d <= R111_MAGNET_COLLECT) return true; // đã ở trong tay
  const step = Math.min(d, R111_MAGNET_SPEED * dt);
  it.x += (dx / d) * step;
  it.y = (it.y || 0) + (dy / d) * step;
  it.z += (dz / d) * step;
  return (d - step) <= R111_MAGNET_COLLECT;
}
// [R111-TESTABLE-END]

// ---------- R11-1. Đánh tự động + hút đồ (runtime: THREE/DOM) ----------
// Đánh tự động gọi ĐÚNG playerAttack() → DPS bằng hệt đánh tay, giữ nguyên
// cooldown 0.5s / tầm 2.4m / hình quạt 120° / combo M11 / juice cũ. Không máu me.
// Toggle cho menu Debug (mặc định BẬT): wiring nút đặt ở main.js/ui.js theo rule
// "DOM wiring cross-module về main" — combat.js chỉ giữ state + API này.
export function isAutoFightOn() { return R111_AUTO_STATE.on; }
export function setAutoFight(v) { R111_AUTO_STATE.on = !!v; return R111_AUTO_STATE.on; }
// Kho vật rơi chờ hút — hệ thống hút đồ độc lập, module khác push vật vào qua
// magnetSpawn(x, y, z, onCollect). LƯU Ý: hiện tại killMonster cấp ∞/XP TRỰC TIẾP
// (không sinh vật rơi), rau P1 có flow nhặt riêng trong actors.js → mảng thường
// trống, nhưng logic hút đã sẵn sàng cho mọi vật rơi sau này (đúng giới hạn task
// "chỉ chạm combat.js").
export const magnetItems = [];
export function magnetSpawn(x, y, z, onCollect) {
  const it = { x, y, z, onCollect, alive: true };
  magnetItems.push(it);
  return it;
}
function r111ShotMode() { // phiên ?shot= của tool chụp ảnh: tắt đánh tự động + hút đồ để ảnh ổn định
  return typeof location !== 'undefined' && location.search.indexOf('shot=') >= 0;
}
export function updateAutoFight() { // mỗi frame: có quái trong 2.5m → quay mặt + tự vung đòn
  if (!R111_AUTO_STATE.on || r111ShotMode()) return;
  if (S.hp <= 0 || atkState.cd > 0) return; // player đã gục, hoặc đòn đang hồi
  const m = r111NearestInRange(monsters, P.x, P.z, R111_AUTO_RANGE);
  if (!m) return;
  player.rotation.y = r111AimAngle(m.x - P.x, m.z - P.z); // quay mặt về quái gần nhất
  playerAttack(); // đòn đánh tay thật — nút Đánh tay giữ nguyên, DPS bằng hệt
}
export function updateMagnet(dt) { // mỗi frame: vật rơi trong 2.5m bay về, tới 0.6m thì nhặt
  if (r111ShotMode()) return;
  for (let i = magnetItems.length - 1; i >= 0; i--) {
    const it = magnetItems[i];
    if (r111Dist(P.x, P.z, it.x, it.z) > R111_MAGNET_RANGE) continue; // ngoài tầm thì nằm yên
    if (r111MagnetStep(it, P.x, P.y, P.z, dt)) {
      magnetItems.splice(i, 1);
      try { if (it.onCollect) it.onCollect(it); } catch (e) { /* nhặt lỗi thì bỏ, không kẹt game */ }
    }
  }
}

// [J12-TESTABLE-START]
// J12 (v12, học Vlambeer + Koster): juice combat rẻ bằng scale (không thêm mesh).
//  - Squash khi trúng đòn: thân dẹp 35% rồi nảy lại trong 0.18s (chỉ đổi scale).
//  - Telegraph trước khi cắn: quái trong tầm + hồi đòn còn ≤0.4s thì chớp đỏ
//    (mắt thường thấy được, kịp bấm Né) — dạy pattern thay vì tăng máu (Koster).
// Toàn hàm/hằng thuần túy (không THREE/DOM) để test bằng node.
const J12_SQUASH_T = 0.18; // (s) thời gian nảy khi trúng đòn
const J12_TELE_S = 0.4;    // (s) báo đỏ trước khi cắn
function j12SquashK(t) { // hệ số dẹp dọc: 1 bình thường → 0.65 giữa nhịp → 1
  if (t <= 0) return 1;
  const k = Math.max(0, Math.min(1, t / J12_SQUASH_T));
  return 1 - 0.35 * Math.sin(k * Math.PI);
}
function j12TelegraphOn(dp, atkCd, range, pinned) { // có hiện báo đỏ không?
  if (pinned) return false; // quái ghim chụp ảnh (?shot=) không báo
  return dp < range && atkCd > 0 && atkCd <= J12_TELE_S;
}
// [J12-TESTABLE-END]

// [BOSS-TESTABLE-START]
// BOSS MINI "Vũng Thiu Mẹ" ở ao đông (P3, tone ấm áp không máu me).
// Lore COT_TRUYEN_VA_LAU_DAI: không giết mà hóa giải — đánh tan Vẩn để mẹ tỉnh lại.
// Pattern: fight 4s luân phiên vỗ sóng (telegraph vòng đỏ 0.7s → AoE 4.2m né được)
//   / gọi 2 Vẩn con → ngủ 3s chịu x1.5 dmg → lặp. Xa 26m hoặc player gục → leash.
// Toàn hằng/hàm thuần túy (không THREE/DOM) để test được bằng node.
// st: { mode: 'fight'|'tele'|'rest', t: giây còn lại trong pha, alt: 0|1 }.
//   alt = 0 là lượt vỗ sóng, alt = 1 là lượt gọi con (đảo sau mỗi lần ngủ dậy).
// dp: khoảng cách 2D boss→player (m). playerDown: true khi player đã gục.
// Trả { st, ev } với ev trong none/slam/summon/rest/fight/leash.
const BOSS_RESPAWN = 300; // (s) boss hồi lại sau 5 phút
const BOSS_LEASH_R = 26; // (m) xa hơn thì boss lặn về ổ
const BOSS_SLAM_R = 4.2; // (m) bán kính AoE vỗ sóng — chạy ra ngoài là né được
const BOSS_SLAM_TELE = 0.7; // (s) telegraph vòng đỏ trước khi vỗ
const BOSS_FIGHT_T = 4; // (s) đánh nhau trước mỗi lần ra đòn / ngủ
const BOSS_REST_T = 3; // (s) ngủ 3s sau mỗi lần ra đòn
const BOSS_VULN_K = 1.5; // ngủ thì chịu x1.5 sát thương
const BOSS_REWARD_XP = 100; // thưởng hóa giải
const BOSS_REWARD_INF = 80;
const BOSS_REWARD = { xp: 100, inf: 80 }; // bí danh cho code cũ đọc object
function bossNew() { // trạng thái đầu: đánh 4s, lượt đầu là vỗ sóng
  return { mode: 'fight', t: BOSS_FIGHT_T, alt: 0 };
}
function bossDmgK(mode) { // hệ số sát thương theo pha: ngủ thì x1.5, còn lại x1
  return mode === 'rest' ? BOSS_VULN_K : 1;
}
function bossTick(st, dt, dp, playerDown) { // 1 nhịp logic boss, thuần túy
  const cur = (st && typeof st.mode === 'string') ? st : bossNew();
  const alt = cur.alt ? 1 : 0; // chuẩn hóa alt về 0|1
  const mode = (cur.mode === 'fight' || cur.mode === 'tele' || cur.mode === 'rest') ? cur.mode : 'fight';
  const t0 = (typeof cur.t === 'number' && isFinite(cur.t)) ? cur.t : BOSS_FIGHT_T;
  const d = (typeof dp === 'number' && isFinite(dp)) ? dp : 0;
  if (d > BOSS_LEASH_R || !!playerDown) { // xa ổ hoặc player gục → leash về ổ
    return { st: { mode: 'fight', t: BOSS_FIGHT_T, alt: 0 }, ev: 'leash' };
  }
  const step = (typeof dt === 'number' && dt > 0) ? dt : 0;
  const nt = t0 - step;
  if (nt > 0) return { st: { mode, t: nt, alt }, ev: 'none' }; // chưa hết pha
  if (mode === 'fight') { // hết 4s đánh → luân phiên ra đòn
    if (alt === 0) return { st: { mode: 'tele', t: BOSS_SLAM_TELE, alt }, ev: 'slam' };
    return { st: { mode: 'rest', t: BOSS_REST_T, alt }, ev: 'summon' };
  }
  if (mode === 'tele') { // hết 0.7s telegraph → vỗ sóng xong, lăn ra ngủ
    return { st: { mode: 'rest', t: BOSS_REST_T, alt }, ev: 'rest' };
  }
  return { st: { mode: 'fight', t: BOSS_FIGHT_T, alt: alt ? 0 : 1 }, ev: 'fight' }; // ngủ đủ 3s → dậy, đảo lượt
}
// [BOSS-TESTABLE-END]

// Vòng cung đòn đánh của player (hiện 0.15s) — V5: vành mảnh ~100°, gradient alpha
// trong suốt dần về rìa (texture canvas radial), thay mảng trắng tròn cũ.
// Chỉ đổi PHẦN NHÌN: atkState/cooldown/sát thương/hook ?shot= giữ nguyên.
export const atkArcG = new THREE.Group();
{
  const geo = new THREE.RingGeometry(V5_INNER_R, V5_OUTER_R, 48, 1,
    -Math.PI / 2 - V5_ARC_THETA / 2, V5_ARC_THETA); // cung đối xứng quanh +Z sau khi xoay ngang
  // Texture gradient: alpha 1 ở rìa trong → 0 ở rìa ngoài.
  // RingGeometry map uv theo vòng tròn nội tiếp nên gradient radial canvas khớp đúng rìa vành.
  const slashTex = canvasTex(256, 256, (g, w, h) => {
    const r = w / 2;
    const grd = g.createRadialGradient(r, r, 0, r, r, r);
    const innerFrac = V5_INNER_R / V5_OUTER_R; // vị trí rìa trong trên texture
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(innerFrac, 'rgba(255,255,255,1)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
  });
  const mat = new THREE.MeshBasicMaterial({ color: 0xffe9a8, map: slashTex, transparent: true,
    opacity: 0.65, side: THREE.DoubleSide, depthWrite: false,
    blending: THREE.AdditiveBlending }); // giữ additive + depthWrite false như cũ
  const ring = new THREE.Mesh(geo, mat);
  ring.rotation.x = -Math.PI / 2; // nằm ngang
  atkArcG.add(ring);
  atkArcG.visible = false; atkArcG.renderOrder = 4;
  scene.add(atkArcG);
}
export const atkState = { cd: 0, t: 0 }; // gộp cooldown đòn đánh (atkState.cd) + thời gian hiện vệt chém (atkState.t): main.js hook ?shot= ghi trực tiếp atkState.cd/atkState.t

// ---------- M11. Combo counter (học Balatro) ----------
// Đánh trúng liên tiếp → số combo hiện to dần giữa màn hình. Mốc 10/25/50: hiệu ứng
// riêng (scale/flash/toast tiếng Việt) + thưởng ∞ nhỏ. Reset khi đánh hụt hoặc sau
// 3s không đánh trúng. Chỉ thêm juice — không đụng sát thương/cân bằng cũ.
export const comboState = { n: 0, lastT: -99, el: null };
function m11EnsureEl() { // tự tạo DOM số combo (combat.js tự lo, không đụng index.html)
  if (comboState.el) return comboState.el;
  const st = document.createElement('style');
  st.textContent =
    '#combo-count{position:fixed;left:50%;top:11%;transform:translateX(-50%);z-index:999;' +
    'pointer-events:none;display:none;font-weight:900;color:#ffe9a8;' +
    'text-shadow:0 2px 10px rgba(0,0,0,.75);font-size:clamp(30px,10vw,58px);' +
    'line-height:1;white-space:nowrap}' + // clamp 30–58px: đủ to đọc trên màn 360px, không che tầm nhìn
    '#combo-count.milestone{animation:combo-pop .55s ease-out}' +
    '@keyframes combo-pop{0%{transform:translateX(-50%) scale(1.6);color:#ffd34d}' +
    '40%{transform:translateX(-50%) scale(1.9)}100%{transform:translateX(-50%) scale(1);color:#ffe9a8}}';
  document.head.appendChild(st);
  const el = document.createElement('div');
  el.id = 'combo-count';
  document.body.appendChild(el);
  comboState.el = el;
  return el;
}
function m11Show() { // hiện số combo (to dần theo combo); ẩn khi combo < 2 cho đỡ rối
  const el = m11EnsureEl();
  if (comboState.n < 2) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.textContent = `COMBO x${comboState.n}`;
  el.style.transform = `translateX(-50%) scale(${m11ScaleFor(comboState.n)})`;
}
function m11MilestoneFlash() { // flash vàng + scale nảy ở mốc 10/25/50
  const el = m11EnsureEl();
  el.classList.remove('milestone');
  void el.offsetWidth; // ép reflow để animation chạy lại
  el.classList.add('milestone');
}
export function comboHit() { // 1 đòn TRÚNG quái → combo+1, mốc 10/25/50: hiệu ứng + thưởng ∞ nhỏ
  comboState.n = m11NextCombo(comboState.n);
  comboState.lastT = perfNow();
  m11Show();
  if (m11IsMilestone(comboState.n)) {
    const bonus = m11MilestoneBonus(comboState.n);
    if (bonus > 0) addInf(bonus); // thưởng nhỏ, không phá cân bằng
    toast(`COMBO ${comboState.n}! Đánh liên tiếp chuẩn xác — thưởng +${bonus}∞`);
    m11MilestoneFlash();
  }
}
export function comboReset() { // đánh HỤT hoặc hết 3s → combo về 0, ẩn số
  comboState.n = 0;
  if (comboState.el) comboState.el.style.display = 'none';
}
export function updateCombo(dt) { // 3s không đánh trúng → tự reset (gọi mỗi frame từ updateMonsters)
  if (comboState.n > 0 && m11ShouldReset(comboState.lastT, perfNow())) comboReset();
}

export function playerAttack() {
  if (atkState.cd > 0 || dlgNPC || shopOpen || P.fly) return;
  atkState.cd = 0.5;
  atkState.t = 0.15;
  atkArcG.position.set(P.x, P.y + 1.0, P.z);
  atkArcG.rotation.y = player.rotation.y;
  atkArcG.visible = true;
  flashGlow(atkArcG.position.x, atkArcG.position.y + 0.3, atkArcG.position.z, 0xffe9a8, 3.2, 0.25); // G1: flash chém
  let hitAny = false; // M11: đòn này có trúng quái nào không
  for (const m of monsters) {
    if (!m.alive) continue;
    const dx = m.x - P.x, dz = m.z - P.z;
    if (Math.hypot(dx, dz) > 2.4) continue; // tầm đánh
    let da = Math.atan2(dx, dz) - player.rotation.y; // chỉ trúng quái trước mặt (120°)
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    if (Math.abs(da) > Math.PI / 3) continue;
    if (!batHittable(m.kind, m.g.position.y, P.y + 1)) continue; // P2: dơi bay cao quá thì chém không tới — chờ nó lao xuống mà đánh
    let dmg = dmgCalc(atkOf(), m.cfg.def);
    const f = crabFrontFactor(m.kind, P.x, P.z, m.x, m.z, m.g.rotation.y);
    if (f < 1) { // P2: đánh trúng mai trước của cua → giảm damage + dạy người chơi vòng ra sau lưng
      dmg *= f;
      burst(m.x, 0.9, m.z, 0xffd34d, 8, 2, 2.5); // tia lửa "keng" khi chém vào mai
      if (m.kengCd <= 0) { m.kengCd = 3; toast('Keng! Mai cua cứng quá — dùng Né (K) vòng ra SAU LƯNG nó mà đánh!'); }
    }
    m.hp -= dmg; m.flash = 0.12; m.squashT = J12_SQUASH_T; // J12: trúng đòn → nảy squash
    hitAny = true; // M11: 1 đòn trúng → combo+1 (cả chém vào mai cũng tính, vì đã trúng)
    comboHit();
    drawMonsterHP(m);
    if (m.hp <= 0) killMonster(m);
  }
  // BOSS: đòn tay đánh được Vũng Thiu Mẹ (tái dùng dmgCalc/comboHit/J12 squash như quái thường)
  for (const b of bosses) {
    if (!b.alive) continue; // boss đang chờ hồi thì chém không trúng
    const dx = b.x - P.x, dz = b.z - P.z;
    if (Math.hypot(dx, dz) > 2.4) continue; // tầm đánh như quái thường
    let da = Math.atan2(dx, dz) - player.rotation.y; // chỉ trúng boss trước mặt (120°)
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    if (Math.abs(da) > Math.PI / 3) continue;
    // BOSS: boss to mặt đất nên không check batHittable/cua — chỉ có ngủ thì chịu x1.5 dmg
    let dmg = dmgCalc(atkOf(), b.cfg.def);
    if (b.st && b.st.mode === 'rest') dmg *= BOSS_VULN_K; // ngủ 3s chịu x1.5 dmg — tranh thủ đánh
    b.hp -= dmg; b.flash = 0.12; b.squashT = J12_SQUASH_T; // J12: trúng đòn → nảy squash như quái thường
    hitAny = true;
    comboHit();
    drawBossHP(b);
    if (b.hp <= 0) killBoss(b);
  }
  if (!hitAny) comboReset(); // M11: đánh hụt hoàn toàn → reset combo
  else vib(10); // đòn trúng quái → rung nhẹ 10ms cho có cảm giác chạm
}
export function killMonster(m) {
  m.alive = false; m.g.visible = false; m.respawnT = m.cfg.respawn;
  let infGain = 3 + Math.floor(Math.random() * 8); // +3–10∞ theo CO_CHE_GAME 5.3
  if (S.shop.charm) infGain = Math.floor(infGain * 1.25); // Bùa Mạch: +25% ∞ rơi (tiện ích, không phải sức mạnh)
  if (S.vil && S.vil.den && DN.night > 0.5) infGain = Math.floor(infGain * 1.5); // VIL: đèn đình soi sáng, quái đêm rớt gấp rưỡi
  const lv0 = S.lv; // nhớ LV trước khi cộng XP để biết có lên cấp không
  addInf(infGain); addXP(m.cfg.xp);
  if (S.lv > lv0) vib([20, 50, 20]); // lên cấp → rung pattern chúc mừng
  const by = m.kind === 'doi' ? m.g.position.y : 0.8; // P2: dơi rớt từ trên trời, tan hạt tại độ cao nó bay
  burst(m.x, by, m.z, 0x7fe8d0, 14, 3, 3.2); // v4: quái tan thành hạt bay lên
  burst(P.x, P.y + 1.2, P.z, 0xffd34d, 6, 1.2, 4); // v4: tia ∞ bay lên khi nhặt
  flashGlow(m.x, by, m.z, 0x7fe8d0, 2.6, 0.5); // G1: flash hạ quái
  toast(`Hạ ${m.cfg.name}! +${m.cfg.xp} XP · +${infGain}∞`);
  // Q5 (R4 slice): hạ quái quanh ao khi đang làm quest "Giếng bẩn" → đếm vào quest
  if (S.q5 && S.q5.state === 'active' && Math.hypot(m.x - POND.x, m.z - POND.z) < Q5_AO_R) {
    S.q5 = q5Kill(S.q5, true); saveGame();
    if (q5CanTurnIn(S.q5)) toast('💧 Đủ 3 con rồi! Về giếng gặp Bà Lụa nhé!');
    else toast(`💧 Dọn vũng thiu quanh ao (${S.q5.kills}/${3})`);
  }
}
export function retreatMonster(m) { // P2: trời sáng → dơi bay về hang (không rớt đồ), hẹn đêm sau ra lại
  m.alive = false; m.g.visible = false; m.diveT = 0;
  m.respawnT = Math.max(1, timeUntilNight(DN.t, DAY_LEN) + 2);
  burst(m.x, m.g.position.y, m.z, 0x9a8fd0, 10, 2, 3); // vệt sương tím khi dơi rút đi
}

// [D4-TESTABLE-START]
// D4 (học Swink): né hủy đòn đánh giữa chừng — bấm Né (K) trong lúc animation
// đánh đang chạy → hủy đòn NGAY để né, input xử lý <100ms. Hủy đòn không tính
// combo miss, không trừ thêm cooldown/stamina oan.
// Toàn hàm/hằng thuần túy (không phụ thuộc THREE/DOM) để test được bằng node.
// Animation đánh của INFINIA = thời gian vệt chém hiện (atkState.t = 0.15s trong
// playerAttack). Bấm Né trong cửa sổ này → hủy đòn, chuyển sang dodge.
const D4_CANCEL_WINDOW = 0.15; // (s) cửa sổ hủy đòn = thời gian animation đánh
const D4_MAX_INPUT_MS = 100;   // (ms) input né phải được xử lý trong giới hạn này
function d4AttackAnimating(atkT) { // animation đánh còn đang chạy? (đang giữa đòn)
  return atkT > 0 && atkT <= D4_CANCEL_WINDOW;
}
function d4ShouldCancel(atkT, dodgeCd) { // bấm Né lúc này có hủy đòn không?
  return dodgeCd <= 0 && d4AttackAnimating(atkT); // né phải sẵn sàng + đang giữa đòn
}
function d4CancelAttack(state) { // trạng thái sau khi hủy đòn để né (thuần túy)
  // state: { atkT, atkVisible, combo, atkCd, dodgeCd }
  return {
    atkT: 0,               // dừng animation đánh ngay
    atkVisible: false,     // tắt vệt chém
    combo: state.combo,    // KHÔNG tính miss → combo giữ nguyên
    atkCd: state.atkCd,    // KHÔNG trừ thêm cooldown đánh (giữ cooldown cũ của đòn)
    dodgeCd: state.dodgeCd // KHÔNG trừ thêm stamina/cooldown né oan
  };
}
function d4InputOk(inputMs, processMs) { // input được xử lý trong cùng frame (<100ms)?
  return (processMs - inputMs) >= 0 && (processMs - inputMs) <= D4_MAX_INPUT_MS;
}
// [D4-TESTABLE-END]

// Né: dash nhanh + 0.4s bất tử, cooldown 3s (đúng CO_CHE_GAME 5.1)
export let dodgeCd = 0, dodgeT = 0;
export const dodgeDir = { x: 0, z: 1 };
export let lastIx = 0, lastIz = 1;
// setter cho main.js (tick) — binding import là read-only nên không gán trực tiếp cross-module được
export function setDodgeT(v) { dodgeT = v; }
export function setLastInput(ix, iz) { lastIx = ix; lastIz = iz; }
export function playerDodge() {
  if (dodgeCd > 0 || dlgNPC || shopOpen || P.fly) return;
  // D4 (Swink): đang giữa animation đánh → HỦY ĐÒN NGAY để né, không chờ
  // animation kết thúc, không queue sang frame sau. Input được xử lý đồng bộ
  // trong cùng frame (<100ms): wiring ở main.js gọi playerDodge() trực tiếp
  // từ keydown K / onclick nút Né mobile.
  if (d4AttackAnimating(atkState.t)) {
    atkState.t = 0;          // dừng animation đánh ngay
    atkArcG.visible = false; // tắt vệt chém
    // KHÔNG comboReset(): hủy đòn không tính là đánh hụt — combo đã được tính
    // lúc đòn trúng trong playerAttack(). KHÔNG trừ thêm cooldown/stamina oan.
  }
  let dx = lastIx, dz = lastIz;
  if (Math.hypot(dx, dz) < 0.1) { dx = Math.sin(player.rotation.y); dz = Math.cos(player.rotation.y); }
  const l = Math.hypot(dx, dz);
  dodgeDir.x = dx / l; dodgeDir.z = dz / l;
  dodgeT = 0.25; dodgeCd = 3;
  P.invuln = Math.max(P.invuln, 0.4);
}

// Player bị đánh / chết / hồi HP
export let lastHurtT = -99;
export function perfNow() { return performance.now() / 1000; }
// Rung phản hồi trên mobile (juice 0đ): guard môi trường — desktop/node không có
// navigator.vibrate thì bỏ qua, không crash game. KHÔNG test phần rung, chỉ node --check.
function vib(p) { // p: số ms hoặc mảng pattern rung
  try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {}
}
export function hurtPlayer(dmg) {
  if (P.invuln > 0 || P.fly || S.hp <= 0) return;
  S.hp -= dmg; lastHurtT = perfNow();
  // M11 (quyết định 2026-10-07, học Balatro): bị quái đánh trúng KHÔNG reset combo —
  // combo theo đòn đánh RA của player (đánh trúng liên tiếp), chỉ đánh hụt hoặc
  // hết 3s không trúng mới reset. Giữ combo đơn giản, không gây bực.
  flashGlow(P.x, P.y + 1.2, P.z, 0xff5a5a, 2.4, 0.3); // G1: flash trúng đòn
  vib(30); // bị quái đánh trúng → rung 30ms cho thấy đau
  updateHUD();
  if (S.hp <= 0) playerDie();
}
export function playerDie() { // gục ngã: hồi sinh ở giữa làng, mất 10% ∞ (làm tròn xuống)
  const lost = Math.floor(S.inf * 0.1);
  S.inf -= lost;
  S.hp = maxHpOf();
  P.x = 0; P.z = 0; P.y = groundHeight(0, 0);
  player.position.set(P.x, P.y, P.z);
  updateHUD(); saveGame();
  toast(`Bạn đã gục ngã... mất ${lost}∞ (hồi sinh ở giữa làng)`);
}

// ---------- BOSS MINI "Vũng Thiu Mẹ" ở ao đông (runtime: THREE/DOM) ----------
// Lore: mẹ Vũng Thiu không bị giết mà được hóa giải — đánh tan Vẩn để mẹ tỉnh lại.
// Tone ấm áp, không máu me: hạt sen xanh + toast dịu dàng. KHÔNG sửa P2_KINDS.
export const bosses = []; // ổ boss mini (hiện tại chỉ 1 mẹ ở ao đông)
export function drawBossHP(b) { // vẽ thanh HP to trên đầu boss
  const g = b.canvas.getContext('2d');
  g.clearRect(0, 0, 256, 24);
  g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 0, 256, 24);
  g.fillStyle = '#e0393e';
  g.fillRect(3, 3, 250 * Math.max(0, Math.min(1, b.hp / b.maxHp)), 18); // kẹp 0–1 như quái thường
  b.tex.needsUpdate = true;
}
export function makeBoss() { // dựng blob khổng lồ vảy vnVayQuatTex + sen trên đầu, thanh HP to
  const g = new THREE.Group();
  // VN: thân blob khổng lồ vảy thiu (tái dùng texture vảy quái Vẩn cho cùng họ)
  const blobMat = new THREE.MeshStandardMaterial({ map: vnVayQuatTex(), roughness: 0.65, metalness: 0.05 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.6, 20, 16), blobMat);
  body.scale.set(1, 0.8, 1); body.position.y = 1.1; body.castShadow = true; // mẹ to gấp ~3 lần Vẩn con
  // VN: mắt hiền to (mẹ hiền, không dữ — ấm áp)
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xe8f4ff });
  const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), eyeMat);
  e1.position.set(-0.5, 1.5, 1.25);
  const e2 = e1.clone(); e2.position.x = 0.5;
  // VN: sen trên đầu — lá sen + búp sen hồng (hóa giải thì sen nở, không máu me)
  const laSenMat = new THREE.MeshStandardMaterial({ map: vnLaSenTex(), roughness: 0.9, side: THREE.DoubleSide });
  const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.65, 14), laSenMat);
  leaf.rotation.x = -Math.PI / 2; leaf.position.y = 2.45; // đội lá sen như nón
  const bud = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 8),
    new THREE.MeshStandardMaterial({ color: 0xff9db0, roughness: 0.7 }));
  bud.position.y = 2.85; bud.castShadow = true; // búp sen hồng
  g.add(body, e1, e2, leaf, bud);
  // VN: thanh HP to trên đầu (gấp đôi quái thường cho xứng boss mini)
  const c = document.createElement('canvas'); c.width = 256; c.height = 24;
  const tex = new THREE.CanvasTexture(c);
  const bar = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  bar.scale.set(3.6, 0.34, 1);
  bar.position.y = 3.6;
  bar.renderOrder = 6;
  g.add(bar);
  // VN: vòng telegraph đỏ cho vỗ sóng (ẩn mặc định, hiện 0.7s trước AoE)
  const ring = new THREE.Mesh(new THREE.RingGeometry(BOSS_SLAM_R - 0.5, BOSS_SLAM_R, 40),
    new THREE.MeshBasicMaterial({ color: 0xff4d4d, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.15; ring.visible = false; ring.renderOrder = 3;
  g.add(ring);
  scene.add(g);
  // J12: giữ tỉ lệ gốc + trạng thái squash/tele như quái thường để tái dùng juice
  const bs = body.scale;
  const b = { g, body, blobMat, wingL: null, wingR: null, clawL: null, clawR: null,
    canvas: c, tex, bar, ring,
    kind: 'boss', cfg: { name: 'Vũng Thiu Mẹ', hp: 220, atk: 10, def: 1, speed: 1.3, xp: BOSS_REWARD_XP },
    x: POND.x, z: POND.z, homeX: POND.x, homeZ: POND.z, // ổ ở ao đông
    hp: 220, maxHp: 220, alive: true,
    state: 'idle', timer: 0, tx: 0, tz: 0, atkCd: 0, respawnT: 0,
    flash: 0, diveT: 0, phase: Math.random() * 6.28, kengCd: 0,
    squashT: 0, tele: false, sx0: bs.x, sy0: bs.y, sz0: bs.z,
    st: bossNew() }; // máy trạng thái thuần fight/tele/rest
  return b;
}
export function spawnBoss(b) { // hồi boss ở ổ ao đông (đầy máu, tỉnh táo)
  b.x = b.homeX; b.z = b.homeZ; b.hp = b.cfg.hp; b.maxHp = b.cfg.hp;
  b.alive = true; b.st = bossNew(); b.flash = 0; b.squashT = 0; b.tele = false;
  b.engaged = false; // chưa ai tới gần: leash lúc này là im lặng (không toast giữa làng)
  b.ring.visible = false;
  b.g.visible = true;
  b.g.position.set(b.x, groundHeight(b.x, b.z), b.z);
  drawBossHP(b);
}
export function bossLeash(b) { // xa 26m hoặc player gục → hồi đầy, về ổ, toast ấm áp
  b.hp = b.maxHp; b.x = b.homeX; b.z = b.homeZ; b.st = bossNew();
  b.flash = 0; b.squashT = 0; b.tele = false; b.ring.visible = false;
  b.g.position.set(b.x, groundHeight(b.x, b.z), b.z);
  drawBossHP(b);
  toast('Vũng Thiu Mẹ lặn về ổ sen... Hẹn bạn quay lại hóa giải nhé!');
}
export function bossSummonAdds(b) { // gọi 2 Vẩn con ra chơi cùng (tái dùng quái Vẩn có sẵn)
  let got = 0;
  for (const m of monsters) {
    if (m.kind !== 'vun' || got >= 2) continue; // chỉ gọi họ Vẩn, đúng 2 con
    // VN: Vẩn con từ vũng mẹ sủi lên — đặt cạnh mẹ, đầy máu, hiện hình
    m.x = b.x + (got === 0 ? -1.8 : 1.8); m.z = b.z + 1.2;
    m.hp = m.cfg.hp; m.maxHp = m.cfg.hp; m.alive = true; m.state = 'idle'; m.timer = 1;
    m.g.visible = true;
    m.g.position.set(m.x, groundHeight(m.x, m.z), m.z);
    drawMonsterHP(m);
    burst(m.x, 0.8, m.z, 0x7fe8d0, 8, 2, 2.5); // bọt sen xanh khi con trồi lên
    got++;
  }
  if (got > 0) toast('Vũng Thiu Mẹ sủi bọt gọi Vẩn con ra chơi cùng...');
}
export function killBoss(b) { // hóa giải (không giết): thưởng xp100/inf80 + toast ấm áp + respawn 300s
  b.alive = false; b.g.visible = false; b.ring.visible = false; b.respawnT = BOSS_RESPAWN;
  const lv0b = S.lv; // nhớ LV trước khi cộng XP để biết có lên cấp không
  addInf(BOSS_REWARD_INF); addXP(BOSS_REWARD_XP);
  if (S.vil && S.vil.den && DN.night > 0.5) addInf(40); // VIL: đèn đình soi sáng, boss đêm rớt thêm
  if (S.lv > lv0b) vib([20, 50, 20]); // lên cấp → rung pattern chúc mừng
  burst(b.x, 1.5, b.z, 0x9dffb0, 18, 3, 3.5); // hạt sen xanh bay lên — hóa giải nhẹ nhàng
  burst(P.x, P.y + 1.2, P.z, 0xffd34d, 6, 1.2, 4); // tia ∞ bay lên khi nhận thưởng
  flashGlow(b.x, 1.5, b.z, 0x9dffb0, 3.2, 0.6); // G1: flash sen khi hóa giải
  toast(`Vũng Thiu Mẹ tan thành sen thơm... Cảm ơn bạn đã hóa giải! +${BOSS_REWARD_XP} XP · +${BOSS_REWARD_INF}∞`);
  const bs = statBoss(S.stats); S.stats = bs.stats; saveGame(); // STAT: sổ kỷ lục làng
  if (bs.milestone) toast(`🏆 Kỷ lục làng: hóa giải boss lần thứ ${bs.milestone}!`);
}
export function updateBosses(dt) { // mỗi frame: máy trạng thái thuần + di chuyển + juice
  for (const b of bosses) {
    if (!b.alive) { // chờ hồi 300s
      b.respawnT -= dt;
      if (b.respawnT <= 0) { spawnBoss(b); toast('Ao đông lại sủi bọt... Vũng Thiu Mẹ đã tỉnh lại!'); }
      continue;
    }
    if (b.flash > 0) { // v4: nhấp nháy TRẮNG khi trúng đòn (ưu tiên hơn báo đỏ)
      b.flash -= dt;
      b.blobMat.emissive.setHex(b.flash > 0 ? 0xffffff : 0x000000);
    }
    if (b.squashT > 0) b.squashT -= dt; // J12: đồng hồ nảy squash
    const dx = P.x - b.x, dz = P.z - b.z;
    const dp = Math.hypot(dx, dz);
    const down = S.hp <= 0; // player đã gục (hiếm — thường đã hồi sinh xa ổ nên leash theo khoảng cách)
    if (dp < BOSS_LEASH_R) b.engaged = true; // player đã tới gần: từ giờ leash mới báo
    const r = bossTick(b.st, dt, dp, down); // máy trạng thái thuần quyết định pha
    b.st = r.st;
    // Chưa ai tới gần mà xa ổ (vd lúc mới vào game): reset im lặng, không toast giữa làng
    if (r.ev === 'leash') { if (b.engaged) bossLeash(b); else b.st = bossNew(); continue; }
    if (r.ev === 'slam') { // bắt đầu telegraph vòng đỏ 0.7s
      b.ring.visible = true;
    } else if (r.ev === 'summon') { // gọi 2 Vẩn con rồi lăn ra ngủ
      bossSummonAdds(b);
    } else if (r.ev === 'rest') { // hết telegraph → vỗ sóng AoE 4.2m (né được) rồi ngủ
      b.ring.visible = false;
      const hitR = Math.hypot(P.x - b.x, P.z - b.z);
      if (!P.fly && hitR <= BOSS_SLAM_R) hurtPlayer(dmgCalc(b.cfg.atk, defOf())); // đứng ngoài vòng hoặc Né đúng lúc thì thoát
      burst(b.x, 0.6, b.z, 0x7fd4ff, 16, 4, 3); // sóng sen lan ra
      flashGlow(b.x, 0.8, b.z, 0x7fd4ff, 3.0, 0.4);
    } else if (r.ev === 'fight') { // ngủ đủ 3s → dậy đánh tiếp
      b.ring.visible = false;
    }
    // J12: tele vòng đỏ — boss rung đỏ khi sắp vỗ (giống quái thường chớp đỏ)
    b.tele = (b.st.mode === 'tele');
    if (b.flash <= 0) b.blobMat.emissive.setHex(b.tele && Math.floor(tGlobal * 12) % 2 ? 0x7a1a08 : 0x000000);
    if (b.ring.visible) b.ring.material.opacity = 0.4 + 0.25 * Math.sin(tGlobal * 12); // vòng đỏ nhấp nháy
    if (b.st.mode !== 'rest' && dp < BOSS_LEASH_R && dp > 2.2 && !P.fly) { // thức thì lừ đừ tiến về player
      const step = Math.min(dp - 2.2, b.cfg.speed * dt);
      b.x += (dx / dp) * step; b.z += (dz / dp) * step;
      b.g.rotation.y = Math.atan2(dx, dz);
    }
    // VN: đặt blob ở mặt đất + J12 nảy squash khi trúng đòn + nhún khi ngủ
    b.g.position.set(b.x, groundHeight(b.x, b.z), b.z);
    const sq = j12SquashK(b.squashT);
    const sleepK = b.st.mode === 'rest' ? 0.92 : 1; // ngủ thì xẹp nhẹ cho thấy đang nghỉ
    const wob = Math.sin(tGlobal * 3 + b.x * 0.5);
    b.body.scale.set(b.sx0 * (1 + (1 - sq)) * sleepK, b.sy0 * sq * sleepK * (1 + wob * 0.03), b.sz0 * (1 + (1 - sq)) * sleepK);
  }
}
// P3: dựng 1 mẹ ở ao đông lúc tải game
for (let _bi = 0; _bi < 1; _bi++) { const _b = makeBoss(); spawnBoss(_b); bosses.push(_b); }

export function updateMonsters(dt) {
  updateCombo(dt); // M11: 3s không đánh trúng → combo tự reset
  updateAutoFight(); // R11-1: quái trong 2.5m → tự vung đòn (DPS bằng đánh tay)
  updateMagnet(dt); // R11-1: vật rơi trong 2.5m tự bay về player
  updateWisps(dt); // WISP (v17): ma trơi ao đêm
  for (const m of monsters) {
    if (!m.alive) { // chờ respawn
      m.respawnT -= dt;
      if (m.respawnT <= 0) spawnMonster(m);
      continue;
    }
    if (m.kind === 'doi' && !isNightAt(DN.t)) { retreatMonster(m); continue; } // P2: trời sáng → dơi bay về hang
    if (m.kengCd > 0) m.kengCd -= dt;
    if (m.flash > 0) { // v4: nhấp nháy TRẮNG khi trúng đòn (ưu tiên hơn báo đỏ)
      m.flash -= dt;
      m.blobMat.emissive.setHex(m.flash > 0 ? 0xffffff : 0x000000);
    }
    if (m.squashT > 0) m.squashT -= dt; // J12: đồng hồ nảy squash
    const dx = P.x - m.x, dz = P.z - m.z;
    const dp = Math.hypot(dx, dz);
    // J12: telegraph — quái sắp cắn (hồi đòn còn ≤0.4s, trong tầm) thì chớp ĐỎ cho kịp né
    m.tele = j12TelegraphOn(dp, m.atkCd, m.kind === 'doi' ? 1.8 : 1.5, !!m.shotPin);
    if (m.flash <= 0) m.blobMat.emissive.setHex(m.tele && Math.floor(tGlobal * 12) % 2 ? 0x7a1a08 : 0x000000);
    const chaseR = m.kind === 'doi' ? 9 : 7; // P2: dơi thính hơn, đuổi từ xa
    if (m.shotPin) { /* V1b: quái bị ghim trong phiên ?shot=combat — đứng yên cho ảnh ổn định */ }
    else if (dp < chaseR && dp > 0.01 && !P.fly) { // đuổi theo player
      const step = Math.min(dp, m.cfg.speed * 1.4 * dt);
      m.x += (dx / dp) * step; m.z += (dz / dp) * step;
      m.g.rotation.y = Math.atan2(dx, dz);
      if (m.kind === 'doi') { // P2: dơi đủ gần thì LAO XUỐNG cắn (né được bằng nút Né)
        if (dp < 1.8 && m.diveT <= 0) {
          m.atkCd -= dt;
          if (m.atkCd <= 0) { m.atkCd = 1.4; m.diveT = 0.55; }
        }
      } else if (dp < 1.5) { // quái bộ: cắn player
        m.atkCd -= dt;
        if (m.atkCd <= 0) { m.atkCd = 1.2; hurtPlayer(dmgCalc(m.cfg.atk, defOf())); }
      }
    } else if (m.state === 'idle') { // lang thang
      m.timer -= dt;
      if (m.timer <= 0) {
        const a = Math.random() * Math.PI * 2, r = 6 + Math.random() * 14;
        const tx = m.x + Math.cos(a) * r, tz = m.z + Math.sin(a) * r;
        let ok = Math.abs(tx) < 100 && Math.abs(tz) < 100 && slopeAt(tx, tz) < 0.55;
        if (ok) for (const o of obstacles) // không chui vào nhà/cây
          if (Math.hypot(tx - o.x, tz - o.z) < o.r + 1.2) { ok = false; break; }
        if (ok) { m.tx = tx; m.tz = tz; m.state = 'walk'; } else m.timer = 1.5;
      }
    } else {
      const wx = m.tx - m.x, wz = m.tz - m.z, wd = Math.hypot(wx, wz);
      if (wd < 0.5) { m.state = 'idle'; m.timer = 1 + Math.random() * 3; }
      else {
        const st = Math.min(wd, m.cfg.speed * dt);
        m.x += (wx / wd) * st; m.z += (wz / wd) * st;
        m.g.rotation.y = Math.atan2(wx, wz);
      }
    }
    const ground = groundHeight(m.x, m.z);
    if (m.kind === 'doi') { // ===== P2: dơi bay lơ lửng, đập cánh, lao xuống khi tấn công =====
      m.phase += dt * 7; // tốc độ đập cánh
      const flap = Math.sin(m.phase) * 0.75;
      m.wingL.rotation.z = 0.3 + flap; m.wingR.rotation.z = -0.3 - flap;
      let y = ground + 2.3 + Math.sin(tGlobal * 2.2 + m.phase * 0.35) * 0.35; // lơ lửng đung đưa
      if (m.diveT > 0) { // đang lao xuống cắn
        m.diveT -= dt;
        const k = Math.max(0, m.diveT / 0.55); // 1 → 0
        y = ground + 0.6 + (2.3 - 0.6) * k; // lao xuống thấp rồi vọt lên — lúc này chém mới tới
        m.wingL.rotation.z = 1.1; m.wingR.rotation.z = -1.1; // cụp cánh khi lao xuống
        if (m.diveT <= 0 && Math.hypot(P.x - m.x, P.z - m.z) < 2.2)
          hurtPlayer(dmgCalc(m.cfg.atk, defOf())); // cắn khi chạm thấp nhất (né kịp thì thoát)
      }
      m.g.position.set(m.x, y, m.z);
    } else { // ===== quái đi bộ: Quái Vẩn + Cua Đá Già =====
      if (m.kind === 'cua' && m.clawL) { // P2: càng cua khua khi đang đuổi/cắn
        const snap = (dp < 7 && dp > 0.01 && !P.fly) ? Math.sin(tGlobal * 9) * 0.25 : 0;
        m.clawL.rotation.z = 0.3 + snap; m.clawR.rotation.z = -0.3 - snap;
      }
      m.g.position.set(m.x, ground, m.z);
      const sq = j12SquashK(m.squashT); // J12: 1 bình thường, <1 lúc vừa trúng đòn
      if (m.kind === 'vun') { // v4: quái nhún nhảy (squash & stretch) + J12 nảy khi trúng đòn
        const wob = Math.sin(tGlobal * 7 + m.x * 0.8 + m.z);
        m.body.scale.y = (0.75 + wob * 0.06) * sq; // dẹp dọc
        m.body.scale.x = m.body.scale.z = (1 - wob * 0.03) * (1 + (1 - sq) * 1.2); // phình ngang
      } else if (sq < 1) { // J12: dơi/cua cũng nảy theo tỉ lệ gốc của mình
        m.body.scale.set(m.sx0 * (1 + (1 - sq)), m.sy0 * sq, m.sz0 * (1 + (1 - sq)));
      } else { // hết nảy → trả đúng dáng gốc (tránh lệch dần theo thời gian)
        m.body.scale.set(m.sx0, m.sy0, m.sz0);
      }
    }
  }
  updateBosses(dt); // P3: boss mini Vũng Thiu Mẹ ở ao đông (máy trạng thái thuần + AoE + leash)
  if (atkState.t > 0) { // v4: vệt chém sáng dần + nở ra rồi tắt (additive)
    atkState.t -= dt;
    const k = Math.max(0, atkState.t / 0.15);
    atkArcG.visible = atkState.t > 0;
    atkArcG.children[0].material.opacity = 0.8 * k;
    atkArcG.scale.setScalar(1 + (1 - k) * 0.9);
  }
  if (atkState.cd > 0) atkState.cd -= dt;
  if (dodgeCd > 0) dodgeCd -= dt;
  if (P.invuln > 0) P.invuln -= dt;
}

// ---------- 7h. Hiệu ứng hạt (juice) + vòng sáng lên cấp (v4) ----------
// Pool hạt dùng chung: 1 InstancedMesh cho mọi vụ nổ/tia sáng — rẻ
export const pMesh = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.09, 6, 5),
  new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.95, depthWrite: false }), PMAX);
pMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
pMesh.frustumCulled = false;
scene.add(pMesh);
export const parts = [];
export const _pd = new THREE.Object3D();
export function burst(x, y, z, color, n, spd, up) { // tung n hạt màu color tại (x,y,z)
  for (let i = 0; i < n; i++) {
    if (parts.length >= PMAX) parts.shift();
    const a = Math.random() * Math.PI * 2, s = spd * (0.4 + Math.random() * 0.8);
    parts.push({ x, y: y + Math.random() * 0.3, z,
      vx: Math.cos(a) * s, vy: up * (0.6 + Math.random()), vz: Math.sin(a) * s,
      life: 0, max: 0.6 + Math.random() * 0.5,
      size: 0.7 + Math.random() * 0.8, c: new THREE.Color(color) });
  }
}
export function updateParts(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life += dt;
    if (p.life >= p.max) { parts.splice(i, 1); continue; }
    p.vy -= 4 * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
  }
  for (let i = 0; i < PMAX; i++) {
    if (i < parts.length) {
      const p = parts[i], k = 1 - p.life / p.max;
      _pd.position.set(p.x, p.y, p.z);
      _pd.scale.setScalar(Math.max(0.001, p.size * k));
      _pd.rotation.set(0, 0, 0);
      _pd.updateMatrix();
      pMesh.setMatrixAt(i, _pd.matrix);
      pMesh.setColorAt(i, p.c);
    } else {
      _pd.position.set(0, -99, 0); _pd.scale.setScalar(0.001); _pd.updateMatrix();
      pMesh.setMatrixAt(i, _pd.matrix);
    }
  }
  pMesh.instanceMatrix.needsUpdate = true;
  if (pMesh.instanceColor) pMesh.instanceColor.needsUpdate = true;
}
// Vòng sáng lan ra khi lên cấp
export const lvlRing = new THREE.Mesh(
  new THREE.RingGeometry(0.9, 1.1, 40),
  new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0,
    side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
lvlRing.rotation.x = -Math.PI / 2;
lvlRing.visible = false;
scene.add(lvlRing);
export let lvlT = 1e9;
export function resetLvlT() { lvlT = 0; } // setter cho ui.js (onLevelUp) — binding import read-only
export function updateLvlRing(dt) {
  if (lvlT >= 0.9) return;
  lvlT += dt;
  const k = Math.min(1, lvlT / 0.9);
  lvlRing.visible = true;
  lvlRing.position.set(P.x, P.y + 0.15, P.z);
  lvlRing.scale.setScalar(1 + k * 5);
  lvlRing.material.opacity = 0.85 * (1 - k);
  if (k >= 1) lvlRing.visible = false;
}

// ---------- 7i. Đom đóm ban đêm (v5): 1 InstancedMesh, chỉ hiện khi trời tối ----------
export const ffMesh = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.06, 6, 5),
  new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.95, depthWrite: false }), FFN);
ffMesh.frustumCulled = false;
ffMesh.visible = false;
scene.add(ffMesh);
export const ffSeeds = [];
{
  const _fc = new THREE.Color();
  for (let i = 0; i < FFN; i++) {
    const a = Math.random() * Math.PI * 2, r = 6 + Math.random() * 34;
    ffSeeds.push({ x: Math.cos(a) * r, z: Math.sin(a) * r,
      ph: Math.random() * 6.28, sp: 0.4 + Math.random() * 0.8, amp: 1 + Math.random() * 2 });
    _fc.setHSL(0.22 + Math.random() * 0.06, 1, 0.62); // vàng-xanh đặc trưng đom đóm
    ffMesh.setColorAt(i, _fc);
  }
  if (ffMesh.instanceColor) ffMesh.instanceColor.needsUpdate = true;
}
export const _fd = new THREE.Object3D();
export function updateFireflies() { // bay lượn + nhấp nháy, mờ dần theo độ đêm
  const n = DN.night;
  if (n < 0.05) { ffMesh.visible = false; return; }
  ffMesh.visible = true;
  for (let i = 0; i < FFN; i++) {
    const s = ffSeeds[i];
    const x = s.x + Math.sin(tGlobal * s.sp + s.ph) * s.amp;
    const z = s.z + Math.cos(tGlobal * s.sp * 0.8 + s.ph * 1.3) * s.amp;
    const y = groundHeight(x, z) + 0.8 + Math.sin(tGlobal * 1.7 + s.ph * 2.1) * 0.5;
    const blink = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(tGlobal * 2.6 + s.ph * 3.7));
    _fd.position.set(x, y, z);
    _fd.scale.setScalar(Math.max(0.001, blink * n));
    _fd.updateMatrix();
    ffMesh.setMatrixAt(i, _fd.matrix);
  }
  ffMesh.instanceMatrix.needsUpdate = true;
}

// [WISP-TESTABLE-START]
// WISP (v17) — ma trơi ao đêm: đêm khuya (night > 0.7) có 3 đốm lửa xanh bay quanh
// ao sen; chạm vào (< 2.2m) được +15∞ +10XP rồi đốm tắt 60s. Thuần túy.
// (Tone làng quê: ma trơi hiền, cho quà chứ không hại — đúng chất cozy.)
const WISP_N = 3;          // số đốm ma trơi
const WISP_R = 2.2;        // chạm trong 2.2m thì nhặt được
const WISP_NIGHT = 0.7;    // chỉ hiện khi đêm sâu (DN.night > 0.7)
const WISP_RESPAWN = 60;   // nhặt rồi chờ 60s mới hiện lại
const WISP_REWARD_INF = 15, WISP_REWARD_XP = 10;
const WISP_LINES = [ // câu hù yêu mỗi lần nhặt (đúng giọng quê, không máu me)
  'Ma trơi cho quà nè... đừng sợ, nó hiền lắm!',
  'Đốm lửa xanh bay vào tay bạn — ấm quá!',
  'Nghe nói ai nhặt được ma trơi sẽ gặp may cả tuần!',
];
function wispActive(night) { return night > WISP_NIGHT; } // đêm đủ sâu mới có
function wispCatchable(dist, waitT) { // chạm được khi: đủ gần + đốm đang hiện (waitT<=0)
  return dist < WISP_R && waitT <= 0;
}
// [WISP-TESTABLE-END]

// ---------- 7j. Bloom giả (G1): sprite glow additive, 1 texture dùng chung ----------
// Mô phỏng hào quang quanh điểm sáng (đèn lồng, mặt trời/mặt trăng, đom đóm, flash hiệu ứng).
// Mỗi sprite ~1 draw call; tổng 6+1+8+3=18 sprite → draw calls tăng tối đa ~18.
export const glowSpec = glowTextureSpec();
export const glowTex = canvasTex(glowSpec.size, glowSpec.size, (g, w, h) => {
  const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  for (const s of glowSpec.stops) grd.addColorStop(s.o, `rgba(255,255,255,${s.a})`);
  g.fillStyle = grd;
  g.fillRect(0, 0, w, h);
});
export function glowMaterial(color, opacity) { // material dùng chung theo nhóm màu (texture chung)
  return new THREE.SpriteMaterial({ map: glowTex, color, transparent: true,
    opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
}
export const lanternGlowMat = glowMaterial(0xffb35c, 0.6); // đèn lồng: vàng ấm
export const sunGlowMat = glowMaterial(0xffdca8, 0.3);     // mặt trời/mặt trăng: đổi màu theo giờ
export const ffGlowMat = glowMaterial(0xd8ff7a, 0.85);     // đom đóm: vàng-xanh
export const lanternGlows = [], ffGlows = [], flashes = [];
export let sunGlow = null;
{
  // 6 đèn lồng: glow neo đúng vị trí đèn thật (light.position)
  for (let i = 0; i < lanterns.length; i++) {
    const spr = new THREE.Sprite(lanternGlowMat);
    spr.position.copy(lanterns[i].light.position);
    spr.visible = false;
    scene.add(spr);
    lanternGlows.push(spr);
  }
  // 1 sprite mặt trời/mặt trăng: neo theo camera, đổi màu theo giờ game
  sunGlow = new THREE.Sprite(sunGlowMat);
  sunGlow.visible = false;
  scene.add(sunGlow);
  // 8 đom đóm (cứ 8 con 1 sprite glow): bay + nhấp nháy đồng bộ với ffSeeds
  for (let i = 0; i < 8; i++) {
    const spr = new THREE.Sprite(ffGlowMat);
    spr.visible = false;
    scene.add(spr);
    ffGlows.push(spr);
  }
  // 3 flash cho hiệu ứng chém/trúng đòn/lên cấp: mỗi cái material riêng (màu khác nhau)
  for (let i = 0; i < 3; i++) {
    const mat = glowMaterial(0xffffff, 0);
    const spr = new THREE.Sprite(mat);
    spr.visible = false;
    scene.add(spr);
    flashes.push({ spr, mat, life: 0, max: 1, size: 2 });
  }
}
export function flashGlow(x, y, z, color, size, life) { // bật 1 flash tại điểm sáng (hiệu ứng ngắn)
  const f = flashes.find(f => f.life <= 0);
  if (!f) return;
  f.spr.position.set(x, y, z);
  f.mat.color.setHex(color);
  f.life = f.max = life; f.size = size;
  f.spr.visible = bloomAllowed(Q.level, BLOOM.on);
}
export function updateGlows(dt) { // mỗi frame: scale glow theo cường độ (ban ngày mờ, ban đêm rõ)
  const on = bloomAllowed(Q.level, BLOOM.on);
  // Đèn lồng: sáng theo light.visible của updateLanterns, cường độ theo DN.night
  lanternGlowMat.opacity = glowIntensity(DN.night, 0.65);
  for (let i = 0; i < lanternGlows.length; i++) {
    const spr = lanternGlows[i];
    const lit = lanterns[i].light.visible;
    spr.visible = on && lit;
    if (!spr.visible) continue;
    const pulse = 1 + Math.sin(tGlobal * 3 + i * 1.7) * 0.06; // nhấp nháy nhẹ cho có hồn
    const s = 1.7 * pulse;
    spr.scale.set(s, s, 1);
  }
  // Mặt trời/mặt trăng: neo trước camera 380 đơn vị (trong sky dome bán kính 420)
  {
    const useSun = DN.sunDir.y > -0.06; // cùng luật chọn đèn chính với updateDayNight
    const dir = useSun ? DN.sunDir : DN.moonDir;
    sunGlow.position.copy(camera.position).addScaledVector(dir, 380);
    sunGlow.material.color.setHex(useSun ? skyU.sunTint.value.getHex() : 0xcfd8ff);
    const base = useSun ? 0.10 + 0.30 * (sun.intensity / 2.6) : 0.55;
    const inten = glowIntensity(useSun ? 0 : DN.night, base);
    sunGlow.visible = on && inten > 0.02;
    sunGlow.material.opacity = inten;
    const sc = useSun ? 150 : 95;
    sunGlow.scale.set(sc, sc, 1);
  }
  // Đom đóm: chỉ hiện khi trời tối, bay + nhấp nháy đồng bộ seed gốc
  const nFfGlow = ffGlowCount(Q.level); // T1/F3: preset Vừa chỉ 4 sprite glow (mắt thường không phân biệt được)
  for (let i = 0; i < ffGlows.length; i++) {
    const spr = ffGlows[i], s = ffSeeds[i * 8];
    const vis = on && DN.night > 0.05 && i < nFfGlow;
    spr.visible = vis;
    if (!vis) continue;
    const x = s.x + Math.sin(tGlobal * s.sp + s.ph) * s.amp;
    const z = s.z + Math.cos(tGlobal * s.sp * 0.8 + s.ph * 1.3) * s.amp;
    const y = groundHeight(x, z) + 0.8 + Math.sin(tGlobal * 1.7 + s.ph * 2.1) * 0.5;
    const blink = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(tGlobal * 2.6 + s.ph * 3.7));
    spr.position.set(x, y, z);
    const sc = Math.max(0.01, 0.55 * blink * DN.night);
    spr.scale.set(sc, sc, 1);
  }
  // Flash hiệu ứng: nở ra rồi tàn
  for (const f of flashes) {
    if (f.life <= 0) { f.spr.visible = false; continue; }
    f.life -= dt;
    const k = Math.max(0, f.life / f.max);
    f.spr.visible = on && f.life > 0;
    f.mat.opacity = 0.9 * k;
    const s = f.size * (1 + (1 - k) * 1.6);
    f.spr.scale.set(s, s, 1);
  }
}

// ---------- WISP. Ma trơi ao đêm (v17): đêm khuya bay quanh ao, chạm là được quà ----------
// 3 sprite xanh (tái dùng glowTex, +3 draw calls nhiều nhất), bay lượn quanh ao sen.
// Không cần E — chạm vào (<2.2m) tự nhặt, đúng chất "ma trơi hiền cho quà".
export const wispMat = glowMaterial(0x7fe8d0, 0.9); // xanh sen
export const wisps = []; // {spr, ax, az, ph, sp, waitT}
for (let i = 0; i < WISP_N; i++) {
  const spr = new THREE.Sprite(wispMat);
  spr.visible = false;
  scene.add(spr);
  const a = (i / WISP_N) * Math.PI * 2;
  wisps.push({ spr, ax: POND.x + Math.cos(a) * 4, az: POND.z + Math.sin(a) * 4,
               ph: i * 2.1, sp: 0.5 + i * 0.15, waitT: 0 });
}
export function updateWisps(dt) {
  const on = wispActive(DN.night);
  for (let i = 0; i < wisps.length; i++) {
    const w = wisps[i];
    if (!on) { w.spr.visible = false; continue; } // ngày → tắt hết
    if (w.waitT > 0) { w.waitT -= dt; w.spr.visible = false; continue; } // vừa nhặt → chờ hồi
    const x = w.ax + Math.sin(tGlobal * w.sp + w.ph) * 2.5;
    const z = w.az + Math.cos(tGlobal * w.sp * 0.7 + w.ph) * 2.5;
    const y = groundHeight(x, z) + 1.2 + Math.sin(tGlobal * 1.9 + w.ph) * 0.35;
    w.spr.position.set(x, y, z);
    const blink = 0.6 + 0.4 * Math.sin(tGlobal * 5 + w.ph * 3);
    w.spr.scale.set(blink, blink, 1);
    w.spr.visible = bloomAllowed(Q.level, BLOOM.on);
    if (wispCatchable(Math.hypot(P.x - x, P.z - z), w.waitT)) { // chạm → nhặt quà
      w.waitT = WISP_RESPAWN; w.spr.visible = false;
      addInf(WISP_REWARD_INF); addXP(WISP_REWARD_XP);
      burst(x, y, z, 0x7fe8d0, 12, 2, 3);
      flashGlow(x, y, z, 0x7fe8d0, 2.4, 0.5);
      toast(`👻 ${WISP_LINES[Math.floor(Math.random() * WISP_LINES.length)]} (+${WISP_REWARD_XP} XP · +${WISP_REWARD_INF}∞)`);
    }
  }
}

// Nút Đánh / Né trên mobile: wiring đặt ở main.js (rule: DOM wiring cross-module về main)

