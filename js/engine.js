// js/engine.js — renderer/scene/camera/bầu trời/ánh sáng của INFINIA
// Tách từ work/app.js dòng 84-164 (giữ nguyên logic, comment tiếng Việt).
import * as THREE from 'three';
import { T1_SHADOW_HALF } from './utils.js'; // F1: shadow camera bám player ±40

// ---------- 1. Renderer / Scene / Camera ----------
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;                 // bóng đổ cho có chiều sâu
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; // v5: màu điện ảnh (research kỹ thuật #1)
renderer.toneMappingExposure = 0.8; // fix chói 2026-10-06 v2: giảm tiếp
renderer.outputColorSpace = THREE.SRGBColorSpace; // G4 (r186): outputEncoding/sRGBEncoding đã bị xóa từ r152 — mặc định r186 đã là SRGB, dòng này giữ tường minh
// G4 (r186): tắt ColorManagement để giữ nguyên pipeline màu của r149 (màu setHex dùng raw,
// không convert linear). Bật CM sẽ làm toàn bộ cảnh tối/đậm hơn hẳn ảnh chuẩn review/shot-*.png
// (Hoàng đã duyệt look r149 qua 2 lần fix chói V3/V3b) — tắt là cách giữ visual gần như cũ nhất.
THREE.ColorManagement.enabled = false;
document.getElementById('game').appendChild(renderer.domElement);

export const scene = new THREE.Scene();
scene.background = null; // v4: dùng sky dome gradient thay vì màu phẳng
scene.fog = new THREE.Fog(0xf3d9a8, 60, 260);       // sương mù ấm buổi chiều

export const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 600);

// ---------- 1b. D5: Screenshake theo công thức trauma (Vlambeer — "Juice It or Lose It") ----------
// Logic thuần nằm trong block testable bên dưới; phần hook bọc renderer.render để mỗi frame
// đều decay trauma + rung camera, không cần sửa main.js/ui.js (vùng code của agent khác).

// [D5-TESTABLE-START] — hàm thuần, không THREE/DOM; test trích block này qua regex
// Công thức Vlambeer: độ rung = trauma² × biên độ tối đa. Bình phương để rung nhỏ gần như
// biến mất (trauma 0.2 → chỉ 4% biên độ) nhưng cú nặng vẫn đủ mạnh (trauma 1 → 100%).
export const D5_HIT = 0.2;    // đánh trúng quái
export const D5_HURT = 0.4;   // player bị đánh
export const D5_BOSS = 0.7;   // hạ boss / quái to
export const D5_MAX = 0.35;   // biên độ rung tối đa (m)
export const D5_DECAY = 1.0;  // trauma tụt về 0 mỗi giây
export function d5AddShake(trauma, amount) { // cộng dồn, kẹp 0..1
  const t = trauma + amount;
  return t > 1 ? 1 : (t < 0 ? 0 : t);
}
export function d5Decay(trauma, dt) { // trauma giảm dần về 0 theo thời gian, không bao giờ âm
  return Math.max(0, trauma - D5_DECAY * dt);
}
export function d5Offset(trauma, enabled) { // độ rung (m); tắt cờ → 0
  if (!enabled) return 0;
  const t = Math.min(Math.max(trauma, 0), 1);
  return t * t * D5_MAX;
}
// [D5-TESTABLE-END]

// Trạng thái rung của engine. combat.js sẽ gọi d5Shake() ở các điểm đánh trúng/bị đánh/hạ boss
// (worker chính nối hook sau) — dùng hằng D5_HIT / D5_HURT / D5_BOSS đã export ở trên.
let d5Trauma = 0;
export let d5Enabled = true; // công tắc độc lập (D9): gắn vào menu Debug sau, mặc định BẬT
export function d5Shake(amount) { d5Trauma = d5AddShake(d5Trauma, amount); }
export function d5SetEnabled(on) { d5Enabled = !!on; return d5Enabled; }

// Bọc renderer.render: mỗi frame decay trauma theo giờ thật rồi cộng offset rung ngẫu nhiên
// vào camera ngay trước khi vẽ. updateCamera() (js/ui.js) set lại vị trí gốc mỗi frame
// nên rung không bao giờ tích lũy; trauma = 0 thì không chạm vào camera.
let d5LastT = 0;
const d5RenderGoc = renderer.render.bind(renderer);
renderer.render = function (sceneArg, cameraArg) {
  const now = performance.now();
  const dt = d5LastT ? Math.min((now - d5LastT) / 1000, 0.25) : 0.016; // kẹp dt tránh nhảy frame
  d5LastT = now;
  d5Trauma = d5Decay(d5Trauma, dt);
  const cam = cameraArg || camera;
  const mag = d5Offset(d5Trauma, d5Enabled);
  if (mag > 0.001) {
    cam.position.x += (Math.random() * 2 - 1) * mag;
    cam.position.y += (Math.random() * 2 - 1) * mag;
    cam.position.z += (Math.random() * 2 - 1) * mag;
  }
  return d5RenderGoc(sceneArg, cameraArg);
};

// ---------- 2. Bầu trời gradient + ánh sáng ấm buổi chiều (v4) ----------
// v5: Sky dome — gradient + mặt trời/mặt trăng/sao theo giờ game (chu kỳ ngày–đêm)
export const skyTime = { value: 0 }; // đồng hồ riêng cho shader trời (tránh TDZ với uTime khai báo sau)
export let skyU = null;              // uniforms trời — updateDayNight() chỉnh mỗi frame
{
  skyU = {
    top: { value: new THREE.Color(0x3a7bd5) },
    mid: { value: new THREE.Color(0x9ecfee) },
    bot: { value: new THREE.Color(0xffd9a8) },
    sunDir: { value: new THREE.Vector3(0, 1, 0) },
    moonDir: { value: new THREE.Vector3(0, -1, 0) },
    sunTint: { value: new THREE.Color(0xffdca8) },
    moonTint: { value: new THREE.Color(0xcfd8ff) },
    starA: { value: 0 }, // độ hiện sao đêm: 0 ngày → 1 nửa đêm
    uTime: skyTime,
  };
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: skyU,
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: [
      'varying vec3 vP;',
      'uniform vec3 top, mid, bot, sunTint, moonTint;',
      'uniform vec3 sunDir, moonDir;',
      'uniform float starA, uTime;',
      'float hash3(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }',
      'void main(){',
      '  vec3 d = normalize(vP);',
      '  float h = d.y;',
      '  vec3 c = h > 0.0 ? mix(mid, top, pow(h, 0.55)) : mix(mid, bot, pow(-h, 0.6));',
      '  float sd = dot(d, normalize(sunDir));',          // đĩa mặt trời + hào quang
      '  c += sunTint * smoothstep(0.99935, 0.99965, sd);',
      '  c += sunTint * pow(max(sd, 0.0), 32.0) * 0.28;',
      '  float md = dot(d, normalize(moonDir));',          // đĩa mặt trăng
      '  c += moonTint * smoothstep(0.99955, 0.99985, md) * 0.9;',
      '  if (starA > 0.003 && h > 0.02) {',               // sao đêm lấp lánh
      '    float s = hash3(floor(d * 260.0));',
      '    float tw = 0.55 + 0.45 * sin(uTime * 2.5 + s * 44.0);',
      '    c += vec3(0.95, 0.97, 1.0) * step(0.9985, s) * tw * starA;',
      '  }',
      '  gl_FragColor = vec4(c, 1.0);',
      '}',
    ].join('\n'),
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(420, 24, 16), skyMat);
  sky.frustumCulled = false;
  scene.add(sky);
}
export const sun = new THREE.DirectionalLight(0xffdca8, 2.0 * Math.PI); // nắng chiều ấm (G4: ×π — xem chú thích ở updateDayNight)
sun.position.set(70, 55, 25);
sun.castShadow = true;
sun.shadow.mapSize.set(1536, 1536); // M5: khớp preset Cao mới (2048→1536) — applyQuality() đè lại theo preset lúc boot nên đây chỉ là cỡ khung hình đầu
// T1/F1: shadow camera hẹp ±40 bám player — vùng bóng luôn quanh người chơi, giảm ~30–40% chi phí shadow
sun.shadow.camera.left = -T1_SHADOW_HALF; sun.shadow.camera.right = T1_SHADOW_HALF;
sun.shadow.camera.top = T1_SHADOW_HALF;   sun.shadow.camera.bottom = -T1_SHADOW_HALF;
sun.shadow.camera.far = 260;
scene.add(sun);
scene.add(sun.target); // T1/F1: cần add target để shadow camera bám player (dòng updateDayNight)
export const hemi = new THREE.HemisphereLight(0xcfe5ff, 0x8a7a5a, 0.85 * Math.PI); // trời xanh + đất ấm (G4: ×π)
scene.add(hemi);

