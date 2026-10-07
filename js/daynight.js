import * as THREE from 'three';
import { DAY_LEN } from './config.js';
import { dayNightAt } from './utils.js';
import { DN } from './core.js';
import { scene, sun, hemi, skyU, skyTime } from './engine.js';
import { waterU } from './world.js';
import { player, tGlobal } from './actors.js';

export function updateDayNight(dt) {
  DN.t = (DN.t + dt / DAY_LEN) % 1;
  const d = dayNightAt(DN.t);
  const a = DN.t * Math.PI * 2; // 0=bình minh đông → 0.25=trưa đỉnh → 0.5=hoàng hôn tây
  DN.sunDir.set(Math.cos(a), Math.sin(a), 0.35).normalize();
  DN.moonDir.set(-Math.cos(a), -Math.sin(a), -0.35).normalize();
  const L = (DN.sunDir.y > -0.06) ? DN.sunDir : DN.moonDir; // đèn chính: ngày=mặt trời, đêm=mặt trăng
  // T1/F1: shadow camera bám player — hướng nắng L giữ nguyên, chỉ dời tâm camera theo người chơi
  sun.position.copy(L).multiplyScalar(120).add(player.position);
  sun.target.position.copy(player.position);
  sun.target.updateMatrixWorld();
  sun.color.setHex(d.sunC);
  // G4 (r186): từ r155 three dùng physical lighting — đo thực nghiệm cùng 1 scene:
  // r149 legacy cho pixel đất (158,194,146), r186 cho (71,112,66) — tối hơn đúng π lần.
  // Nhân π ở đây (thay vì sửa DN_KEYS) để DN_KEYS giữ nguyên giá trị mà tests assert.
  sun.intensity = d.sunI * Math.PI;
  hemi.color.setHex(d.hemiS); hemi.groundColor.setHex(d.hemiG); hemi.intensity = d.hemiI * Math.PI;
  scene.fog.color.setHex(d.fog);
  skyU.top.value.setHex(d.top); skyU.mid.value.setHex(d.mid); skyU.bot.value.setHex(d.bot);
  skyU.sunDir.value.copy(DN.sunDir); skyU.moonDir.value.copy(DN.moonDir);
  skyU.sunTint.value.setHex(d.sunC); skyU.starA.value = d.star;
  skyTime.value = tGlobal;
  DN.night = d.star;
  waterU.skyC.value.setHex(d.water); // ao đổi màu theo trời
  waterU.sunC.value.setHex(d.sunC);
  waterU.sunDirW.value.copy(L);
  waterU.uTime.value = tGlobal;
  updateDayClock();
}
export let lastClockLabel = '';
export function updateDayClock() { // icon giờ trong HUD — chỉ chạm DOM khi nhãn đổi
  const t = DN.t;
  const label = t < 0.04 ? '🌅 Bình minh' : t < 0.18 ? '🌤️ Sáng' : t < 0.35 ? '☀️ Trưa'
    : t < 0.46 ? '🌤️ Chiều' : t < 0.55 ? '🌇 Hoàng hôn' : t < 0.62 ? '🌆 Chạng vạng'
    : t < 0.88 ? '🌙 Đêm' : '🌌 Rạng sáng';
  if (label !== lastClockLabel) {
    lastClockLabel = label;
    document.getElementById('dayclock').textContent = label;
  }
}

// Mây: 1 InstancedMesh (40 cụm), trôi nhẹ — rẻ hơn 12 mesh rời của v3
export const clouds = [];
export let cloudMesh;
{
  cloudMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.82, roughness: 1 }),
    40);
  cloudMesh.castShadow = false;
  cloudMesh.frustumCulled = false;
  for (let i = 0; i < 10; i++) {
    const c = { x: (Math.random() - 0.5) * 340, y: 52 + Math.random() * 26, z: (Math.random() - 0.5) * 340,
                sp: 0.6 + Math.random() * 0.9, puffs: [] };
    for (let k = 0; k < 4; k++)
      c.puffs.push({ dx: (k - 1.5) * 7 + Math.random() * 3, dy: Math.random() * 2.5, dz: (Math.random() - 0.5) * 6,
                     s: 7 + Math.random() * 6 });
    clouds.push(c);
  }
  scene.add(cloudMesh);
}
const _cd = new THREE.Object3D();
export function updateClouds(dt) {
  let idx = 0;
  for (const c of clouds) {
    c.x += c.sp * dt;
    if (c.x > 195) c.x = -195;
    for (const p of c.puffs) {
      _cd.position.set(c.x + p.dx, c.y + p.dy, c.z + p.dz);
      _cd.scale.set(p.s * 1.6, p.s * 0.55, p.s);
      _cd.rotation.y = 0;
      _cd.updateMatrix();
      cloudMesh.setMatrixAt(idx++, _cd.matrix);
    }
  }
  cloudMesh.instanceMatrix.needsUpdate = true;
}
