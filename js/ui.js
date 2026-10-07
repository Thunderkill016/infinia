// js/ui.js — HUD/điều khiển/camera/preset chất lượng của INFINIA
// Tách từ work/app.js (giữ nguyên logic, comment tiếng Việt, tên biến/hàm).
// Wiring cross-module (.onclick → hàm actors.js/combat.js, phím tắt) đã chuyển sang main.js.
import { QUALITY_LEVELS, QUALITY_ORDER, SAVE_KEY } from './config.js';
import { BLOOM, toggleBloom, bloomAllowed } from './utils.js'; // G1: bloom giả
import { M6A_LOW_FPS, m6aLevelBelow, m6aShouldDrop } from './utils.js'; // M6A (v12): tự hạ đồ họa
import { statLine } from './utils.js'; // STAT (v17): sổ kỷ lục làng
import { S, P, Q, fxHooks, maxHpOf, maxMpOf, atkOf, defOf, xpNeed, saveGame, store } from './core.js';
import { renderer, camera, sun } from './engine.js';
import { groundHeight, obstacles, refreshTreeLOD, refreshGrassLOD, refreshFlowerLOD,
         grassMesh, stemMesh, headMesh, wireMats } from './world.js';

// ---------- Preset chất lượng (app.js:257-281) ----------
export function applyQuality(level) {
  const q = QUALITY_LEVELS[level];
  if (!q) return;
  Q.level = level;
  sun.shadow.mapSize.set(q.shadow, q.shadow);
  if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } // ép vẽ lại shadow map cỡ mới
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, q.dpr));
  if (grassMesh) grassMesh.visible = q.grass; // Thấp: tắt cỏ/hoa cho máy yếu
  if (stemMesh) stemMesh.visible = q.grass;
  if (headMesh) headMesh.visible = q.grass;
  const dbg = document.getElementById('dbg-q');
  if (dbg) dbg.textContent = 'chất lượng: ' + q.label + ' (Q để đổi)';
  for (const id of ['q-low', 'q-med', 'q-high']) {
    const b = document.getElementById(id);
    if (b) b.classList.toggle('on', id === 'q-' + level);
  }
  refreshTreeLOD(camera.position.x, camera.position.z); // G2: đổi preset → tính lại LOD ngay
  refreshGrassLOD(camera.position.x, camera.position.z);
  refreshFlowerLOD(camera.position.x, camera.position.z);
}
export function cycleQuality() {
  const i = QUALITY_ORDER.indexOf(Q.level);
  applyQuality(QUALITY_ORDER[(i + 1) % QUALITY_ORDER.length]);
  m6aManualLock(); // người chơi chỉnh tay → khóa auto 30s (không giành quyền điều khiển)
  toast('Chất lượng đồ họa: ' + QUALITY_LEVELS[Q.level].label);
}

// ---------- M6A. Tự hạ đồ họa khi máy yếu (v12, học three.js forum K6) ----------
// Chỉ hạ dần high→med→low, không tự tăng; toast báo 1 lần mỗi lần hạ.
// Người chơi bấm Q (tăng/giảm tay) → khóa auto 30s để không giật qua lại.
export const m6aState = { below: 0, sinceDrop: 99, manualLock: 0 };
export function m6aManualLock() { m6aState.manualLock = 30; }
export function updateAutoQuality(dt, fpsAvg) {
  if (m6aState.manualLock > 0) { m6aState.manualLock -= dt; m6aState.sinceDrop += dt; return; }
  if (fpsAvg < M6A_LOW_FPS) m6aState.below += dt; // đuối → tích lũy
  else m6aState.below = 0; // fps hồi → reset đếm (phải đuối LIÊN TỤC 3s)
  m6aState.sinceDrop += dt;
  if (m6aShouldDrop(fpsAvg, m6aState.below, Q.level, m6aState.sinceDrop)) {
    const next = m6aLevelBelow(Q.level);
    applyQuality(next);
    m6aState.sinceDrop = 0; m6aState.below = 0;
    toast('Máy hơi đuối, game tự hạ đồ họa xuống ' + QUALITY_LEVELS[next].label + ' (bấm Q để chỉnh lại)');
  }
}

// ---------- Bloom giả (app.js:340-347; BLOOM/toggleBloom/bloomAllowed đã ở utils.js) ----------
export function cycleBloom() { // phím B / nút HUD: bật-tắt bloom
  BLOOM.on = toggleBloom(BLOOM.on);
  const b = document.getElementById('btn-bloom');
  if (b) b.classList.toggle('on', BLOOM.on);
  const active = bloomAllowed(Q.level, BLOOM.on);
  toast(active ? '✨ Bloom: bật'
    : 'Bloom: tắt' + (Q.level === 'low' ? ' (preset Thấp tắt bloom để giữ FPS)' : ''));
}

// ---------- HUD: HP/XP/∞/quest (app.js:1411-1439) ----------
export const hpBarEl = document.getElementById('hp-bar');
export let mp = maxMpOf(); // STAT (v17): mp PHẢI khởi tạo trước dòng updateHUD() ~301 (TDZ)
export function updateHUD() {
  document.getElementById('inf-count').textContent = S.inf;
  document.getElementById('lv').textContent = 'LV.' + S.lv;
  hpBarEl.style.width = Math.max(0, (S.hp / maxHpOf()) * 100) + '%'; // v3: HP thật
  const need = xpNeed(S.lv);
  document.getElementById('xp-bar').style.width = Math.min(100, (S.xp / need) * 100) + '%';
  document.getElementById('quest').textContent = S.questDone
    ? '🎯 Làm quen làng: ✓ hoàn thành!'
    : `🎯 Làm quen làng: ${S.talked.length}/3`;
  const st = document.querySelector('#panel-status p'); // STAT: sổ kỷ lục vào panel Status
  if (st) st.innerHTML = `LV.${S.lv} — Dân làng mới<br>HP ${Math.max(0, Math.round(S.hp))}/${maxHpOf()} · MP ${Math.round(mp)}/${maxMpOf()}<br>${statLine(S.stats)}`;
}
export function addInf(n) { S.inf += n; updateHUD(); }
export function addXP(n) {
  S.xp += n;
  let need = xpNeed(S.lv);
  while (S.xp >= need) { S.xp -= need; S.lv++; need = xpNeed(S.lv); onLevelUp(); }
  updateHUD(); saveGame();
}
export function onLevelUp() { // hiệu ứng lên cấp: chớp vàng + chữ lớn + vòng sáng + hồi đầy HP/MP (doc 3.3)
  S.hp = maxHpOf(); mp = maxMpOf();
  fxHooks.resetLvlT(); // v4: kích hoạt vòng sáng lan ra
  fxHooks.burst(P.x, P.y + 1, P.z, 0xffd34d, 22, 3.5, 4); // v4: chùm tia vàng
  fxHooks.flashGlow(P.x, P.y + 1, P.z, 0xffd34d, 4.5, 0.7); // G1: flash lên cấp
  const f = document.getElementById('lvup-flash'), t = document.getElementById('lvup-text');
  t.textContent = 'LÊN CẤP ' + S.lv + '!';
  f.style.opacity = '1'; t.classList.add('show');
  setTimeout(() => { f.style.opacity = '0'; t.classList.remove('show'); }, 900);
}


export let toastTimer = null;
export function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.style.display = 'none', 2600);
}

// ---------- 8. Camera thứ 3 bám theo ---------- (app.js:2116-2127)
export let camYaw = Math.PI, camPitch = 0.32, camDist = 10; // nhìn về phía bắc: thấy làng
export function updateCamera() {
  const px = P.x, py = P.y + 1.6, pz = P.z;
  const cx = px - Math.sin(camYaw) * Math.cos(camPitch) * camDist;
  const cz = pz - Math.cos(camYaw) * Math.cos(camPitch) * camDist;
  let cy = py + Math.sin(camPitch) * camDist;
  cy = Math.max(cy, groundHeight(cx, cz) + 0.6); // camera không chui xuống đất
  camera.position.set(cx, cy, cz);
  camera.lookAt(px, py, pz);
}


// ---------- M2: nút chạm mobile — mọi thao tác chơi được bằng ngón tay cái (2026-10-07) ----------
// L1 (thế nào là xong): mọi nút chạm ≥48×48px cách nhau ≥8px; Đánh 68px (to nhất, góc phải-dưới),
//   Né 56px (trên-trái nút Đánh, cách 16px); joystick floating Ø120–140px (chạm đâu trong vùng
//   trái-dưới thì hiện ở đó); nút phản hồi chạm <100ms (scale 0.92 trong 80ms).
// Ràng buộc: CHỈ chạy trên thiết bị chạm — desktop giữ nguyên CSS/layout cũ.
// [M2-TESTABLE-START]
// M2: hằng + logic thuần tính layout nút chạm (không DOM, không import) — test node trích block này qua regex rồi eval.
// Nguồn số: research 07-mobile-ux.md K1/K2 (Material 48dp, khoảng cách ≥8px, Đánh 68px, Né 56px, joystick Ø120–140).
export const M2_BTN_MIN = 48;        // nút chạm tối thiểu 48×48px
export const M2_BTN_GAP = 8;         // khoảng cách tối thiểu giữa 2 nút kề nhau
export const M2_ATTACK_SIZE = 68;    // nút Đánh: to nhất, góc phải-dưới
export const M2_DODGE_SIZE = 56;     // nút Né: phía trên-trái nút Đánh
export const M2_TALK_SIZE = 56;      // nút Nói (thu từ 72px cũ xuống — Đánh 68px phải là nút to nhất)
export const M2_JOY_MIN = 120;       // joystick floating Ø 120–140px
export const M2_JOY_MAX = 140;
export const M2_JOY_SIZE = 120;      // cỡ joystick đang dùng (nằm trong 120–140)
export const M2_EDGE = 16;           // cụm nút cách mép màn hình 16px
export const M2_AD_GAP = 16;         // Né cách Đánh 16px (trượt ngón cái lên là né — đúng reflex combat)
export const M2_PRESS_SCALE = 0.92;  // phản hồi chạm: scale 0.92 trong 80ms (<100ms, K7)
export const M2_PRESS_MS = 80;

// m2Layout(w, h, safe): tính vị trí/kích thước cụm nút theo viewport (CSS px).
// w,h: innerWidth/innerHeight; safe: {l,r,b} safe-area inset (0 nếu không biết).
// Trả về rect dạng {x, y, size} — x,y là góc TRÁI-TRÊN, size là cạnh (nút vuông).
export function m2Layout(w, h, safe) {
  safe = safe || { l: 0, r: 0, b: 0 };
  const e = M2_EDGE;
  // Đánh: góc phải-dưới, to nhất
  const attack = { x: w - (safe.r || 0) - e - M2_ATTACK_SIZE, y: h - (safe.b || 0) - e - M2_ATTACK_SIZE, size: M2_ATTACK_SIZE };
  // Né: phía trên nút Đánh, canh giữa theo phương ngang, cách 16px
  const dodge = { x: attack.x + (M2_ATTACK_SIZE - M2_DODGE_SIZE) / 2, y: attack.y - M2_AD_GAP - M2_DODGE_SIZE, size: M2_DODGE_SIZE };
  // Nói: phía trên nút Né, canh giữa theo cụm, cách 16px
  const talk = { x: attack.x + (M2_ATTACK_SIZE - M2_TALK_SIZE) / 2, y: dodge.y - M2_AD_GAP - M2_TALK_SIZE, size: M2_TALK_SIZE };
  return { attack, dodge, talk, joySize: M2_JOY_SIZE };
}

// m2HitOK(r): hit-area có đủ 48×48 không
export function m2HitOK(r) { return r.size >= M2_BTN_MIN; }
// m2Overlap(a, b): 2 rect có đè nhau không
export function m2Overlap(a, b) {
  return a.x < b.x + b.size && b.x < a.x + a.size && a.y < b.y + b.size && b.y < a.y + a.size;
}
// m2GapOK(a, b): khoảng cách cạnh-kề ≥ 8px (chỉ gọi khi 2 rect không đè nhau)
export function m2GapOK(a, b) {
  const dx = Math.max(b.x - (a.x + a.size), a.x - (b.x + b.size), 0);
  const dy = Math.max(b.y - (a.y + a.size), a.y - (b.y + b.size), 0);
  return Math.hypot(dx, dy) >= M2_BTN_GAP;
}
// m2Inside(r, w, h): rect nằm gọn trong viewport
export function m2Inside(r, w, h) { return r.x >= 0 && r.y >= 0 && r.x + r.size <= w && r.y + r.size <= h; }
// m2JoyZoneHit(x, y, w, h): điểm chạm có thuộc vùng joystick floating (nửa trái-dưới) không
export function m2JoyZoneHit(x, y, w, h) { return x < w * 0.45 && y > h * 0.45; }
// m2ClampJoy(cx, cy, size, w, h, safe): kẹp tâm joystick để vòng tròn nằm gọn trong màn hình
export function m2ClampJoy(cx, cy, size, w, h, safe) {
  safe = safe || { l: 0, r: 0, b: 0 };
  const half = size / 2;
  const minX = (safe.l || 0) + half, maxX = w - (safe.r || 0) - half;
  const minY = half, maxY = h - (safe.b || 0) - half;
  return {
    x: Math.min(Math.max(cx, minX), Math.max(maxX, minX)),
    y: Math.min(Math.max(cy, minY), Math.max(maxY, minY)),
  };
}
// [M2-TESTABLE-END]

// Phát hiện thiết bị chạm — mọi hiệu ứng M2 bên dưới chỉ chạy khi true, desktop không đổi gì.
export const M2_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

if (M2_TOUCH) {
  // Áp layout nút chạm theo viewport (K1/K2): chỉ đè inline style, CSS gốc giữ cho desktop.
  // safe-area cộng qua env() trong calc để không mất vùng tai thỏ (M4).
  const m2ApplyLayout = () => {
    const w = innerWidth, h = innerHeight;
    const L = m2Layout(w, h, { l: 0, r: 0, b: 0 });
    const place = (el, r) => {
      if (!el) return;
      el.style.width = r.size + 'px';
      el.style.height = r.size + 'px';
      el.style.left = 'auto'; el.style.top = 'auto';
      el.style.right = 'calc(' + (w - r.x - r.size) + 'px + env(safe-area-inset-right, 0px))';
      el.style.bottom = 'calc(' + (h - r.y - r.size) + 'px + env(safe-area-inset-bottom, 0px))';
    };
    place(document.getElementById('btn-attack'), L.attack);
    place(document.getElementById('btn-dodge'), L.dodge);
    place(document.getElementById('btn-talk'), L.talk);
  };
  m2ApplyLayout();
  addEventListener('resize', m2ApplyLayout);
  addEventListener('orientationchange', () => setTimeout(m2ApplyLayout, 150)); // đợi viewport ổn định sau xoay máy

  // Phản hồi chạm <100ms (K7): chạm là scale 0.92 ngay trong touchstart, giữ 80ms rồi nhả.
  // Nhanh hơn :active của CSS trên trình duyệt cũ (có thể trễ ~300ms chờ double-tap).
  const m2Press = [document.getElementById('btn-attack'), document.getElementById('btn-dodge'), document.getElementById('btn-talk')]
    .filter(Boolean);
  for (const b of m2Press) {
    b.addEventListener('touchstart', () => {
      b.style.transform = 'scale(' + M2_PRESS_SCALE + ')';
      clearTimeout(b._m2t);
      b._m2t = setTimeout(() => { b.style.transform = ''; }, M2_PRESS_MS);
    }, { passive: true });
    const m2Release = () => { clearTimeout(b._m2t); b.style.transform = ''; };
    b.addEventListener('touchend', m2Release, { passive: true });
    b.addEventListener('touchcancel', m2Release, { passive: true });
  }

  // Joystick FLOATING (K2): chạm đâu trong vùng trái-dưới thì tâm joystick hiện ở đó.
  // Nút bấm thật (closest('button')) được ưu tiên — không cướp tap của Fly/Debug trên màn ngang.
  addEventListener('touchstart', e => {
    if (joy.active) return; // đã có 1 ngón giữ joystick
    const t = e.changedTouches[0];
    if (!t) return;
    if (e.target && e.target.closest && e.target.closest('button')) return; // bấm nút → để nút xử lý
    if (!m2JoyZoneHit(t.clientX, t.clientY, innerWidth, innerHeight)) return;
    e.preventDefault(); e.stopPropagation(); // chặn cuộn trang + handler joystick cố định cũ
    joy.active = true; joy.id = t.identifier; joy.dx = joy.dy = 0;
    const c = m2ClampJoy(t.clientX, t.clientY, M2_JOY_SIZE, innerWidth, innerHeight, { l: 0, r: 0, b: 0 });
    const half = M2_JOY_SIZE / 2;
    joyEl.style.left = (c.x - half) + 'px';
    joyEl.style.top = (c.y - half) + 'px';
    joyEl.style.bottom = 'auto'; joyEl.style.right = 'auto'; // bỏ vị trí cố định cũ
    joyEl.style.display = 'block';
    stickEl.style.left = '35px'; stickEl.style.top = '35px'; // núm về giữa
  }, { passive: false, capture: true });
}

// ---------- 9. Điều khiển: phím + joystick ảo ---------- (app.js:2128-2186)
// Kéo chuột (desktop) / vuốt nửa phải (mobile): xoay camera
export let dragging = false, lx = 0, ly = 0;
export const cvs = renderer.domElement;
cvs.addEventListener('pointerdown', e => {
  // M2: chạm bắt đầu trong vùng joystick floating (trái-dưới) → không xoay camera
  if (M2_TOUCH && m2JoyZoneHit(e.clientX, e.clientY, innerWidth, innerHeight)) return;
  dragging = true; lx = e.clientX; ly = e.clientY;
});
addEventListener('pointermove', e => {
  if (!dragging) return;
  camYaw -= (e.clientX - lx) * 0.005;
  camPitch = Math.min(1.2, Math.max(0.05, camPitch + (e.clientY - ly) * 0.004));
  lx = e.clientX; ly = e.clientY;
});
addEventListener('pointerup', () => dragging = false);
cvs.addEventListener('contextmenu', e => e.preventDefault());
export const keys = {};

// Joystick ảo (M2: floating — chỉ hiện khi chạm trong vùng trái-dưới, logic ở block M2 phía trên;
// không tự hiện cố định nữa để đúng chuẩn "chạm đâu hiện đó")
export const joyEl = document.getElementById('joystick');
export const stickEl = document.getElementById('stick');
export const joy = { active: false, id: null, dx: 0, dy: 0 };
joyEl.addEventListener('touchstart', e => {
  e.preventDefault(); e.stopPropagation();
  const t = e.changedTouches[0];
  joy.active = true; joy.id = t.identifier; joy.dx = joy.dy = 0;
}, { passive: false });
addEventListener('touchmove', e => {
  for (const t of e.changedTouches) {
    if (joy.active && t.identifier === joy.id) {
      const r = joyEl.getBoundingClientRect();
      let dx = t.clientX - (r.left + r.width / 2);
      let dy = t.clientY - (r.top + r.height / 2);
      const m = Math.hypot(dx, dy), max = 42;
      if (m > max) { dx *= max / m; dy *= max / m; }
      joy.dx = dx / max; joy.dy = dy / max;
      stickEl.style.left = (35 + dx) + 'px'; stickEl.style.top = (35 + dy) + 'px';
    }
  }
}, { passive: true });
addEventListener('touchend', e => {
  for (const t of e.changedTouches)
    if (joy.active && t.identifier === joy.id) {
      joy.active = false; joy.dx = joy.dy = 0;
      stickEl.style.left = '35px'; stickEl.style.top = '35px';
      if (M2_TOUCH) joyEl.style.display = 'none'; // M2 floating: nhấc ngón là joystick biến mất
    }
});

// ---------- 10. HUD: ∞ counter, panel, nút ----------
// v2: ∞ là số kiếm được từ tương tác (không còn tự đếm mỗi giây như v1)
updateHUD(); // vẽ HUD lần đầu từ save đã load
export function togglePanel(id) { // bấm nút Inventory/Status/Control
  const p = document.getElementById(id);
  const open = p.style.display === 'block';
  document.querySelectorAll('.panel').forEach(x => x.style.display = 'none');
  p.style.display = open ? 'none' : 'block';
  if (!open && id === 'panel-status') { // v3: chỉ số thật thay vì tĩnh
    p.querySelector('p').innerHTML =
      `LV.${S.lv} — An, người làng<br>` +
      `HP ${Math.ceil(S.hp)}/${maxHpOf()} · MP ${Math.ceil(mp)}/${maxMpOf()}<br>` +
      `ATK ${atkOf().toFixed(1)} · DEF ${defOf().toFixed(1)}<br>` +
      `∞ ${S.inf} · Đồ: ${S.shop.shoes ? 'Giày cỏ ✓' : '—'} ${S.shop.charm ? 'Bùa Mạch ✓' : ''}`;
  }
}
document.getElementById('btn-inv').onclick = () => togglePanel('panel-inv');
document.getElementById('btn-status').onclick = () => togglePanel('panel-status');
document.getElementById('btn-control').onclick = () => togglePanel('panel-control');
document.getElementById('q-low').onclick = () => applyQuality('low'); // v5: preset đồ họa
document.getElementById('q-med').onclick = () => applyQuality('med');
document.getElementById('q-high').onclick = () => applyQuality('high');
document.getElementById('btn-bloom').onclick = cycleBloom; // G1: nút toggle bloom
document.querySelectorAll('.panel .close').forEach(b =>
  b.onclick = () => document.getElementById(b.dataset.p).style.display = 'none');

// Nút Fly + Debug
export function setFly(on) {
  P.fly = on;
  document.getElementById('btn-fly').classList.toggle('on', on);
  document.getElementById('dbg-fly').checked = on;
  document.getElementById('hint').textContent = on
    ? 'Chế độ BAY: WASD di chuyển · Space lên · C xuống'
    : 'WASD di chuyển · E: nói chuyện · J/K: đánh/né · Q: đồ họa · Kéo chuột xoay camera · Nút Fly để bay thử';
}
document.getElementById('btn-fly').onclick = () => setFly(!P.fly);
document.getElementById('dbg-fly').onchange = e => setFly(e.target.checked);
document.getElementById('btn-debug').onclick = () => {
  const p = document.getElementById('debug-panel');
  p.style.display = p.style.display === 'block' ? 'none' : 'block';
};
document.getElementById('dbg-wire').onchange = e => // bật/tắt wireframe địa hình
  wireMats.forEach(m => m.wireframe = e.target.checked);

// ---------- 11. Va chạm đơn giản: đẩy player khỏi vật cản ----------
export function collide() {
  for (const o of obstacles) {
    const dx = P.x - o.x, dz = P.z - o.z;
    const d = Math.hypot(dx, dz), min = o.r + 0.4;
    if (d < min && d > 0.0001) { P.x = o.x + (dx / d) * min; P.z = o.z + (dz / d) * min; }
  }
  P.x = Math.max(-105, Math.min(105, P.x));
  P.z = Math.max(-105, Math.min(105, P.z));
}

// ---------- MP (app.js:2250-2251) ----------
export const mpBar = document.getElementById('mp-bar');
// (export let mp đã dời lên trên updateHUD() để tránh TDZ — xem chú thích ở đó)
// setter cho main.js (tick) — binding import là read-only nên không gán trực tiếp cross-module được
export function setMp(v) { mp = v; }

// ---------- C2: màn hình title/help tiếng Việt (2026-10-07) ----------
// L1 (thế nào là xong): người mới mở game thấy ngay tên INFINIA + nút "Chơi ngay" +
//   4 dòng help tiếng Việt ngắn (kèm việc đầu tiên theo L5); bấm nút → ẩn overlay, vào chơi.

// [C2-TESTABLE-START]
// C2: hằng thuần (không DOM, không import) — test node trích block này qua regex rồi eval.
// Quy ước: mọi text UI 100% tiếng Việt (ngoài tên game INFINIA), cấm "Click"/"Start"/"Help".
// Mỗi dòng help phải có ít nhất 1 ký tự tiếng Việt có dấu hoặc icon emoji.
export const C2_PLAY_TEXT = 'Chơi ngay'; // text nút vào game
export const C2_TAGLINE = 'Game làng Việt 3D — kết bạn, đánh quái, xây làng'; // L4: 1 câu định vị duy nhất
export const C2_FIRST_TASK = 'Việc đầu tiên: nói chuyện với trưởng làng (dấu !)'; // L5: việc đầu tiên trong 60 giây
export const C2_TITLE_LINES = [ // 4 dòng help kèm icon: di chuyển / đánh / né / nói chuyện
  { icon: '🚶', text: 'Di chuyển: phím WASD / mũi tên, hoặc kéo joystick (điện thoại)' },
  { icon: '⚔️', text: 'Đánh: phím J, hoặc bấm nút Đánh' },
  { icon: '💨', text: 'Né: phím K, hoặc bấm nút Né' },
  { icon: '💬', text: 'Nói chuyện: phím E, hoặc bấm nút Nói khi đứng gần dân làng' },
];
export const C2_HELP_TEXTS = { // tra text help theo key (key nội bộ, value 100% tiếng Việt)
  'choi-ngay': 'Chơi ngay',
  'dinh-vi': 'Game làng Việt 3D — kết bạn, đánh quái, xây làng',
  'viec-dau-tien': 'Việc đầu tiên: nói chuyện với trưởng làng (dấu !)',
  'di-chuyen': 'Di chuyển: phím WASD / mũi tên, hoặc kéo joystick (điện thoại)',
  'danh': 'Đánh: phím J, hoặc bấm nút Đánh',
  'ne': 'Né: phím K, hoặc bấm nút Né',
  'noi-chuyen': 'Nói chuyện: phím E, hoặc bấm nút Nói khi đứng gần dân làng',
};
export function c2HelpText(key) { return C2_HELP_TEXTS[key] || ''; }
// [C2-TESTABLE-END]

// Dựng màn hình title từ hằng C2 (1 nguồn sự thật duy nhất) + gắn nút (DOM — chạy khi module load)
(function c2TitleScreen() {
  const scr = document.getElementById('title-screen');
  if (!scr) return; // HTML chưa có overlay → bỏ qua, không vỡ game
  const tag = document.getElementById('title-tagline');
  if (tag) tag.textContent = C2_TAGLINE;
  const first = document.getElementById('title-first');
  if (first) first.textContent = C2_FIRST_TASK;
  const ul = document.getElementById('title-help');
  if (ul) ul.innerHTML = C2_TITLE_LINES
    .map(l => '<li><span class="ticon">' + l.icon + '</span><span>' + l.text + '</span></li>').join('');
  const play = document.getElementById('btn-play');
  if (play) {
    play.textContent = '▶ ' + C2_PLAY_TEXT; // nút to ≥48px (CSS), mobile-first
    // Bấm Chơi ngay → ẩn overlay, vào game (game vẫn chạy nền, không chặn hệ thống khác)
    play.onclick = () => { scr.style.display = 'none'; };
  }
  const help = document.getElementById('btn-help');
  // Nút "?" trong HUD → mở lại help bất cứ lúc nào
  if (help) help.onclick = () => { scr.style.display = 'flex'; };
})();

// ---------- M7: 3 dòng "Có gì mới" trên màn hình title (học Terraria, 2026-10-07) ----------
// L1 (thế nào là xong): title hiện mục ✨ CÓ GÌ MỚI gồm đúng 3 dòng tiếng Việt ngắn
//   (mỗi dòng ≤ 40 ký tự), nội dung lấy từ mảng M7_NEWS — vòng sau chỉ sửa mảng là đổi
//   text, không cần đụng code render; layout C2 cũ giữ nguyên (nút "▶ Chơi ngay"
//   vẫn ≥48px, thấy rõ trên mobile 360px).

// [M7-TESTABLE-START]
// M7: hằng thuần (không DOM, không import) — test node trích block này qua regex rồi eval.
// Mỗi dòng: đúng 3 dòng, mỗi dòng ≤40 ký tự (đếm theo code point, emoji = 1 ký tự),
//   tiếng Việt 100% (có dấu hoặc icon emoji), không dòng trống.
export const M7_NEWS = [
  '🎵 Có tiếng chém, nhặt đồ, nhạc quê', // C3: âm thanh (chém/nhặt/nhạc nền làng)
  '🔥 Combo liên tiếp, mốc 10/25/50 thưởng ∞', // M11: combo counter + thưởng mốc
  '🌿 Nhiệm vụ mới: Bà Tám cần 5 bó rau', // P1: quest "Giúp Bà Tám Xén" nhặt 5 bó rau dại
];
export function m7FormatNews(lines) { // chuẩn hóa: lọc dòng trống + cắt đúng 3 dòng đầu
  if (!Array.isArray(lines)) return [];
  return lines.filter(s => typeof s === 'string' && s.trim().length > 0).slice(0, 3);
}
// [M7-TESTABLE-END]

// Dựng mục "✨ CÓ GÌ MỚI" vào màn hình title từ mảng M7_NEWS (DOM — chạy khi module load)
// Không đụng HTML/CSS gốc: tự tạo block bằng style inline, chèn ngay trên nút Chơi ngay.
// Nút cũ giữ nguyên vị trí/kích thước (≥48px trong CSS), không phá layout C2.
(function m7NewsSection() {
  const lines = m7FormatNews(M7_NEWS);
  if (!lines.length) return;
  const scr = document.getElementById('title-screen');
  if (!scr) return; // HTML chưa có overlay → bỏ qua, không vỡ game
  const play = document.getElementById('btn-play');
  const wrap = document.createElement('div');
  wrap.id = 'm7-news';
  wrap.style.cssText = 'margin:0 0 10px;text-align:center;';
  const title = document.createElement('div');
  title.textContent = '✨ CÓ GÌ MỚI';
  title.style.cssText = 'font-weight:800;font-size:14px;color:#ffe9a8;margin-bottom:4px;';
  wrap.appendChild(title);
  const ul = document.createElement('ul');
  ul.style.cssText = 'list-style:none;margin:0 auto 12px;padding:0;max-width:360px;';
  for (const s of lines) {
    const li = document.createElement('li');
    li.textContent = s;
    li.style.cssText = 'font-size:13px;color:#e5e7eb;margin-bottom:4px;';
    ul.appendChild(li);
  }
  wrap.appendChild(ul);
  if (play && play.parentNode) play.parentNode.insertBefore(wrap, play);
  else scr.appendChild(wrap);
})();

// ---------- M3: HUD gọn cho màn hình 360px (2026-10-07) ----------
// L1 (thế nào là xong): 5 nút top (Inventory/Status/Control/Fly/Debug) gom vào 1 nút ☰
//   ≥48px mở panel trượt, tap ngoài panel thì đóng; quest tracker chỉ hiện 1 dòng, tự ẩn
//   sau 5s không tương tác (tap vào tracker để hiện lại); chữ HUD ≥12px trên màn nhỏ.
// Ràng buộc: CHỈ áp dụng layout gọn khi màn hình nhỏ (≤480px, khớp breakpoint CSS trong
//   index.html) / thiết bị chạm — desktop giữ nguyên. Không sửa index.html (markup menu
//   #menu-btn/#mobile-menu/#menu-toggle và CSS đã có sẵn), không đụng block M2.
// [M3-TESTABLE-START]
// M3: hằng + logic thuần quyết định layout gọn (không DOM, không import) —
// test node trích block này qua regex rồi eval (giống M2/C2/M7).
export const M3_SMALL_W = 480;   // ngưỡng màn nhỏ (px) — khớp @media (max-width:480px) trong index.html
export const M3_HIDE_S = 5;      // quest tracker tự ẩn sau 5 giây không tương tác
export const M3_MENU_MIN = 48;   // nút ☰ tối thiểu 48×48px (chuẩn chạm ngón tay, lớn hơn .btn gốc 44px)
export const M3_FONT_MIN = 12;   // chữ HUD tối thiểu 12px trên màn nhỏ
// 5 nút top được gom vào menu ☰ (đúng id nút gốc trong index.html)
export const M3_MENU_IDS = ['btn-inv', 'btn-status', 'btn-control', 'btn-fly', 'btn-debug'];

// m3CompactOn(w, isTouch): có áp layout gọn không — màn nhỏ (≤480px) HOẶC thiết bị chạm.
// Desktop rộng giữ nguyên (giống M2).
export function m3CompactOn(w, isTouch) { return (w <= M3_SMALL_W) || !!isTouch; }
// m3MenuBtnOK(size): nút ☰ có đủ 48px không
export function m3MenuBtnOK(size) { return size >= M3_MENU_MIN; }
// m3ShouldHide(lastMs, nowMs): đã qua ≥5s kể từ lần tương tác cuối → ẩn tracker
export function m3ShouldHide(lastMs, nowMs) { return (nowMs - lastMs) >= M3_HIDE_S * 1000; }
// m3FontOK(px): cỡ chữ HUD có ≥12px không
export function m3FontOK(px) { return px >= M3_FONT_MIN; }
// [M3-TESTABLE-END]

// M3 — phần DOM: trượt panel, tap ngoài đóng, tap tracker hiện lại.
// Chạy 1 lần khi module load (DOM đã sẵn sàng vì script nằm cuối body).
// Không cần gate theo resize: style nạp thêm bọc trong @media (max-width:480px) nên
// desktop rộng tự không bị ảnh hưởng; listener tap-ngoài chỉ đóng khi menu đang mở
// (menu chỉ mở được khi #menu-btn hiện — tức ≤480px).
(function m3CompactHUD() {
  // CSS phụ trợ: nút ☰ ≥48px + hiệu ứng panel trượt khi mở (index.html giữ nguyên).
  var css = document.createElement('style');
  css.id = 'm3-js-style';
  css.textContent =
    '@media (max-width:480px){' +
    ' #menu-btn{ min-width:48px; min-height:48px; }' +            // M3: nút ☰ ≥48px (CSS gốc .btn chỉ 44px)
    ' #menu-toggle:checked ~ #mobile-menu{ animation:m3SlideIn .22s ease-out; }' + // panel trượt khi mở
    '}' +
    '@keyframes m3SlideIn{ from{ transform:translateX(24px); opacity:0; } to{ transform:none; opacity:1; } }';
  document.head.appendChild(css);

  var toggle = document.getElementById('menu-toggle');
  var menu = document.getElementById('mobile-menu');
  var menuBtn = document.getElementById('menu-btn');

  // Tap NGOÀI panel → đóng menu (checkbox #menu-toggle là công tắc CSS, bỏ check là đóng).
  // capture:true để chạy trước mọi handler click bên trong.
  if (toggle && menu && menuBtn) {
    document.addEventListener('pointerdown', function (e) {
      if (!toggle.checked) return;          // menu đang đóng → không làm gì
      if (menu.contains(e.target)) return;  // tap trong panel → để nút menu tự xử lý
      if (menuBtn.contains(e.target)) return; // tap lên nút ☰ → để label tự toggle
      toggle.checked = false;               // tap ngoài → đóng panel
    }, true);
  }

  // Quest tracker: tap vào thì hiện lại + hẹn ẩn sau M3_HIDE_S giây không tương tác.
  // (Script inline trong index.html cũng hẹn mờ 5s khi text đổi — cả hai cùng thêm/xóa
  //  class 'dim' nên không xung đột, class chỉ có 2 trạng thái.)
  var quest = document.getElementById('quest'), questT = null;
  function m3ShowQuest() {
    if (!quest) return;
    quest.classList.remove('dim');           // hiện lại tracker
    clearTimeout(questT);
    questT = setTimeout(function () { quest.classList.add('dim'); }, M3_HIDE_S * 1000);
  }
  if (quest) quest.addEventListener('pointerup', m3ShowQuest); // tap vào tracker → hiện lại
})();

// ---------- X1: xuất/nhập save JSON (backup theo docs/PRODUCT.md mục 6, 2026-10-07) ----------
// L1 (thế nào là xong): panel Control có 2 nút "⬇ Xuất save" + "⬆ Nhập save"
//   (mỗi nút ≥44px như nút Chơi mới); bấm Xuất → tải file infinia-save.json;
//   bấm Nhập → chọn file .json hợp lệ (v===1) thì nạp + reload, file lạ thì toast.
// Ràng buộc: KHÔNG đụng bộ nhớ trình duyệt trực tiếp — chỉ qua store (js/core.js).
// [X1-TESTABLE-START]
// X1: hằng + logic thuần kiểm tra save (không DOM, không import) —
// test node trích block này qua regex rồi eval (giống M2/M3/C2/M7).
export const X1_SAVE_FILE = 'infinia-save.json'; // tên file tải về khi xuất save
export function savImportCheck(obj) { // file nhập có phải save hợp lệ không (đúng version mới nhận)
  return !!obj && typeof obj === 'object' && obj.v === 1;
}
export function savExportPayload(raw) { // chuỗi raw trong store có xuất được không → trả raw, không thì null
  if (typeof raw !== 'string' || !raw) return null;
  try { return savImportCheck(JSON.parse(raw)) ? raw : null; }
  catch (e) { return null; }
}
// [X1-TESTABLE-END]

// X1 — phần DOM: xuất save ra file + nhập save từ file (chỉ qua store).
export function exportSave() { // đọc store → tải file infinia-save.json qua blob + thẻ a tạm
  const payload = savExportPayload(store.get(SAVE_KEY));
  if (!payload) { toast('Chưa có tiến trình để xuất'); return; }
  try {
    const blob = new Blob([payload], { type: 'application/json' });
    const a = document.createElement('a'); // thẻ a tạm thời: bấm xong gỡ ngay (momentary)
    a.href = URL.createObjectURL(blob);
    a.download = X1_SAVE_FILE;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 100);
  } catch (e) { toast('Chưa có tiến trình để xuất'); }
}
export function importSave(file) { // đọc file JSON → đúng v===1 thì ghi store + reload, sai thì toast
  if (!file) { toast('File save không hợp lệ'); return; }
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const obj = JSON.parse(rd.result);
      if (!savImportCheck(obj)) { toast('File save không hợp lệ'); return; }
      store.set(SAVE_KEY, JSON.stringify(obj));
      location.reload();
    } catch (e) { toast('File save không hợp lệ'); }
  };
  rd.onerror = () => toast('File save không hợp lệ');
  rd.readAsText(file);
}
// Wiring 2 nút trong panel Control (task X1 chỉ chạm index.html + ui.js nên wiring đặt ở đây,
// không đặt ở main.js như nút Chơi mới).
(function x1WireSaveButtons() {
  const exp = document.getElementById('btn-export-save');
  if (exp) exp.onclick = exportSave;
  const imp = document.getElementById('btn-import-save');
  if (imp) imp.onclick = () => {
    const inp = document.createElement('input'); // input file ẩn: tạo khi cần, dùng xong bỏ
    inp.type = 'file';
    inp.accept = '.json,application/json';
    inp.onchange = () => { if (inp.files && inp.files[0]) importSave(inp.files[0]); };
    inp.click();
  };
})();
