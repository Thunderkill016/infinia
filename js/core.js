// js/core.js — state trung tâm + công thức thuần của INFINIA
// Tách từ work/app.js (giữ nguyên logic, comment tiếng Việt, tên biến/hàm).
import * as THREE from 'three'; // DN dùng THREE.Vector3
import { SAVE_KEY } from './config.js';

// ---------- 0. Save/load ----------
// Lưu: vị trí player, ∞, LV/XP, NPC đã nói chuyện, trạng thái quest "Làm quen làng"
// store: thử localStorage trước; môi trường chặn storage (vd. artifact static)
// thì tự rơi về bộ nhớ tạm trong phiên — game vẫn chạy, chỉ không giữ save
export const store = (() => {
  try {
    localStorage.setItem('__infinia_probe', '1');
    localStorage.removeItem('__infinia_probe');
    return {
      get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
      set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
      del: (k) => { try { localStorage.removeItem(k); } catch (e) {} },
    };
  } catch (e) {
    const mem = {};
    return {
      get: (k) => (k in mem ? mem[k] : null),
      set: (k, v) => { mem[k] = v; },
      del: (k) => { delete mem[k]; },
    };
  }
})();
export const S = { v:1, x:0, z:34, inf:0, lv:1, xp:0, talked:[], questDone:false, hp:100, shop:{ shoes:false, charm:false }, vil:{ gieng:false, cau:false, den:false }, stats:{ fish:0, boss:0 } };
export function loadSave() {
  try {
    const raw = store.get(SAVE_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (d && d.v === 1) { // đúng version mới nhận (migration save cũ viết ở đây khi update)
      for (const k of Object.keys(S)) if (k in d) S[k] = d[k];
    }
  } catch (e) { /* save hỏng: chơi mới, không crash game */ }
  // Save cũ (v1/v2) thiếu trường mới → vá mặc định để tương thích ngược
  if (!S.shop || typeof S.shop !== 'object') S.shop = { shoes:false, charm:false };
  if (typeof S.hp !== 'number') S.hp = 100;
  if (!S.vil || typeof S.vil !== 'object') S.vil = { gieng:false, cau:false, den:false }; // VIL: save cũ chưa có tiến độ làng
  if (!S.stats || typeof S.stats !== 'object') S.stats = { fish:0, boss:0 }; // STAT: save cũ chưa có kỷ lục
}
export function saveGame() {
  S.x = P.x; S.z = P.z;
  try { store.set(SAVE_KEY, JSON.stringify(S)); } catch (e) {}
}
loadSave();

// ---------- Chu kỳ ngày–đêm: DN (DAY_LEN đã ở config.js) ----------
export const DN = { t: 0.30, night: 0, // bắt đầu buổi sáng cho đẹp ngay khi vào game
             sunDir: new THREE.Vector3(0, 1, 0), moonDir: new THREE.Vector3(0, -1, 0) };

// ---------- Preset chất lượng: Q (QUALITY_LEVELS/QUALITY_ORDER đã ở config.js) ----------
export const Q = { level: null };

// ---------- Registry hiệu ứng cross-module (tránh cycle) ----------
// burst/flashGlow/lvlT sống ở combat.js, nhưng ui.js (onLevelUp) và actors.js
// (openDialog) cũng cần gọi → ui/actors không thể import combat (cycle).
// main.js gán các hàm thật vào đây lúc boot; các module khác gọi qua fxHooks.*
// (chỉ gọi lúc gameplay, sau khi main.js đã chạy nên luôn có hàm thật).
export const fxHooks = { burst: null, flashGlow: null, resetLvlT: null };

// P: vị trí/độ cao player — y=0 vì player.position.y lúc khởi tạo cũng là 0
export const P = { x: S.x, z: S.z, y: 0, vy: 0, fly: false };

// ---------- 7c. XP, level, ∞, quest (đúng CO_CHE_GAME) ----------
export function xpNeed(l) { return Math.floor(50 * Math.pow(l, 1.6)); } // XP từ LV.L lên L+1

// ---------- 7c2. Chỉ số player (đúng CO_CHE_GAME 3.3) ----------
export function atkOf() { return 8 + 2.2 * (S.lv - 1); }
export function defOf() { return 2 + 0.8 * (S.lv - 1); }
export function maxHpOf() { return 100 + 12 * (S.lv - 1); } // Bùa Mạch không cộng HP: giữ luật sắt "∞ không mua sức mạnh"
export function maxMpOf() { return 50 + 6 * (S.lv - 1); }
export function moveSpeed() { return 6.5 * (S.shop.shoes ? 1.15 : 1); } // Giày cỏ +15%
S.hp = Math.max(1, Math.min(S.hp, maxHpOf())); // kẹp HP trong giới hạn sau khi load
P.invuln = 0; // thời gian bất tử còn lại (giây) — dùng cho né

