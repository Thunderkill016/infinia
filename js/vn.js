// js/vn.js — BỘ ĐỒ HỌA VIỆT NAM của INFINIA (hướng B: chi tiết + bản sắc Việt)
// File MỚI hoàn toàn — không đụng gameplay cũ, chỉ cấp texture + mẫu dựng sẵn.
// Tất cả texture vẽ bằng canvas lúc chạy (runtime) nên:
//  - 0 byte asset ngoài, file build vẫn <8MB
//  - Không dính bản quyền (tự vẽ, không tải model ngoài)
//  - Chạy offline, không CDN ngoài three.js
// Các module khác (world/actors/combat) import từ đây.
import * as THREE from 'three';

// ---------- 0. Hàm vẽ canvas dùng chung ----------
// Vẽ lên canvas rồi trả về CanvasTexture (tile lặp được).
function vnCanvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Nhiễu mịn chống bề mặt phẳng (deterministic theo seed cho ổn định mọi lần tải)
function vnRand(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- 1. Tường gạch nung Việt Nam ----------
// Gạch thẻ đỏ nâu xếp so le, mạch vữa xám — tường nhà quê Bắc Bộ.
export function vnGachTex() {
  return vnCanvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#b9a68e'; g.fillRect(0, 0, w, h); // vữa
    const rnd = vnRand(7101);
    const bw = 30, bh = 14;
    for (let y = 0, row = 0; y < h; y += bh + 3, row++) {
      const off = (row % 2) * (bw / 2);
      for (let x = -bw; x < w + bw; x += bw + 3) {
        const v = (rnd() - 0.5) * 22;
        g.fillStyle = `rgb(${158 + v | 0},${74 + v * 0.6 | 0},${46 + v * 0.4 | 0})`;
        g.fillRect(x + off, y, bw, bh);
        g.fillStyle = 'rgba(255,220,180,0.18)'; // sáng mép trên viên gạch
        g.fillRect(x + off, y, bw, 3);
        g.fillStyle = 'rgba(0,0,0,0.22)';
        g.fillRect(x + off, y + bh - 3, bw, 3);
      }
    }
  });
}

// ---------- 2. Mái ngói đỏ cong ----------
// Hàng ngói mũi hài úp nối nhau, bóng đổ từng viên — nhìn xa vẫn thấy sóng ngói.
export function vnNgoiTex() {
  return vnCanvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#7e2a1e'; g.fillRect(0, 0, w, h);
    const rnd = vnRand(7202);
    const tw = 16;
    for (let x = 0; x < w; x += tw) {
      const v = (rnd() - 0.5) * 26;
      const grd = g.createLinearGradient(x, 0, x + tw, 0);
      grd.addColorStop(0, `rgb(${140 + v | 0},${52 + v * 0.5 | 0},${36 + v * 0.3 | 0})`);
      grd.addColorStop(0.5, `rgb(${196 + v | 0},${84 + v * 0.5 | 0},${58 + v * 0.3 | 0})`);
      grd.addColorStop(1, `rgb(${120 + v | 0},${42 + v * 0.5 | 0},${30 + v * 0.3 | 0})`);
      g.fillStyle = grd;
      g.fillRect(x + 1, 0, tw - 2, h);
      g.fillStyle = 'rgba(0,0,0,0.35)'; // rãnh giữa 2 viên ngói
      g.fillRect(x, 0, 2, h);
    }
    // Gạch nối ngang từng hàng ngói
    g.fillStyle = 'rgba(0,0,0,0.28)';
    for (let y = 0; y < h; y += 32) g.fillRect(0, y, w, 3);
    g.fillStyle = 'rgba(255,200,150,0.15)';
    for (let y = 3; y < h; y += 32) g.fillRect(0, y, w, 2);
  });
}

// ---------- 3. Gỗ nâu (cột, cửa, bàn ghế) ----------
export function vnGoTex(base = [110, 72, 40]) {
  return vnCanvasTex(128, 128, (g, w, h) => {
    const rnd = vnRand(7303 + base[0]);
    g.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w;) { // vân dọc lượn
      const sw = 1 + Math.floor(rnd() * 3);
      const dark = 0.12 + rnd() * 0.18;
      const wob = rnd() * 6.28, amp = 0.5 + rnd() * 2;
      for (let y = 0; y < h; y++) {
        const xx = Math.round(x + Math.sin(y * 0.12 + wob) * amp);
        if (xx < 0 || xx >= w) continue;
        const i = sw;
        g.fillStyle = `rgba(40,22,8,${dark})`;
        g.fillRect(xx, y, i, 1);
      }
      x += sw + 2 + Math.floor(rnd() * 7);
    }
  });
}

// ---------- 4. Vải áo bà ba ----------
// base: màu áo (nâu đất / xanh chàm / ...). Vân vải chéo mịn + cúc áo.
export function vnVaiTex(base = '#5a6e8a') {
  return vnCanvasTex(128, 128, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const rnd = vnRand(7404);
    g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 1;
    for (let i = -h; i < w + h; i += 4) { // sợi chéo
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke();
    }
    for (let i = 0; i < w * h / 90; i++) { // xơ vải
      g.fillStyle = `rgba(255,255,255,${0.03 + rnd() * 0.05})`;
      g.fillRect(rnd() * w, rnd() * h, 2, 1);
    }
    // Hàng cúc áo giữa ngực (vẽ trang trí — model thật có nút riêng)
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(w / 2 - 2, 0, 4, h);
  });
}

// ---------- 5. Nan tre đan (nón lá, giỏ, hàng rào) ----------
// Nền vàng rơm + nan ngang dọc đan nhau.
export function vnNanTreTex() {
  return vnCanvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#d9b95c'; g.fillRect(0, 0, w, h);
    const rnd = vnRand(7505);
    for (let y = 0; y < h; y += 8) {
      g.fillStyle = (y / 8) % 2 ? '#c9a94e' : '#e2c668';
      g.fillRect(0, y, w, 8);
      g.fillStyle = 'rgba(90,60,20,0.35)'; g.fillRect(0, y, w, 1);
    }
    g.fillStyle = 'rgba(120,85,30,0.25)';
    for (let x = 0; x < w; x += 16) g.fillRect(x, 0, 2, h); // nan đứng
    for (let i = 0; i < 200; i++) { // xơ tre
      g.fillStyle = `rgba(120,90,40,${0.08 + rnd() * 0.1})`;
      g.fillRect(rnd() * w, rnd() * h, 3, 1);
    }
  });
}

// ---------- 6. Giấy đèn lồng đỏ (chữ Phúc vàng) ----------
export function vnDenLongTex(chu = 'Phúc') {
  return vnCanvasTex(128, 128, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h / 2, 6, w / 2, h / 2, w / 2);
    grd.addColorStop(0, '#ff7a5c'); grd.addColorStop(0.6, '#d63a2e'); grd.addColorStop(1, '#8e1f16');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(90,15,10,0.5)'; g.lineWidth = 2; // gân đèn dọc
    for (let x = 8; x < w; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    g.font = 'bold 56px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 5; g.strokeStyle = '#5c1508'; g.strokeText(chu, w / 2, h / 2 + 2);
    g.fillStyle = '#ffd34d'; g.fillText(chu, w / 2, h / 2 + 2);
  });
}

// ---------- 7. Lá sen (gân tỏa tròn) ----------
export function vnLaSenTex() {
  return vnCanvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#3f8a3c'; g.fillRect(0, 0, w, h);
    const rnd = vnRand(7606);
    g.strokeStyle = 'rgba(220,255,210,0.35)'; g.lineWidth = 2;
    for (let a = 0; a < 12; a++) { // gân tỏa từ tâm
      g.beginPath(); g.moveTo(w / 2, h / 2);
      g.lineTo(w / 2 + Math.cos(a / 12 * 6.283) * w / 2, h / 2 + Math.sin(a / 12 * 6.283) * h / 2);
      g.stroke();
    }
    for (let i = 0; i < 300; i++) {
      g.fillStyle = `rgba(${20 + rnd() * 40 | 0},${120 + rnd() * 60 | 0},${40 + rnd() * 30 | 0},0.5)`;
      g.fillRect(rnd() * w, rnd() * h, 2, 2);
    }
  });
}

// ---------- 8. Ruộng lúa (hàng lúa xanh + nước) ----------
export function vnRuongTex() {
  return vnCanvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#7fae4e'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) { // luống
      g.fillStyle = '#8fbf58'; g.fillRect(0, y, w, 10);
      g.fillStyle = '#5d8a34'; g.fillRect(0, y + 10, w, 6);
    }
    g.fillStyle = 'rgba(180,220,255,0.35)'; // vệt nước
    for (let y = 10; y < h; y += 32) g.fillRect(0, y, w, 3);
  });
}

// ---------- 9. Da trâu / lông gà / vảy quái ----------
// Da trâu xám sần, lông gà đốm, vảy quái xanh thiu — 1 hàm, khác seed + bảng màu.
function vnDaNoi(ch1, ch2, seed) {
  return vnCanvasTex(128, 128, (g, w, h) => {
    g.fillStyle = ch1; g.fillRect(0, 0, w, h);
    const rnd = vnRand(seed);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = rnd() < 0.5 ? ch1 : ch2;
      g.globalAlpha = 0.25 + rnd() * 0.4;
      const r = 1 + rnd() * 3;
      g.beginPath(); g.arc(rnd() * w, rnd() * h, r, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
  });
}
export function vnDaTrauTex() { return vnDaNoi('#4a4a52', '#33333a', 7707); }
export function vnLongGaTex() { return vnDaNoi('#f2ede2', '#c9a86a', 7808); }
export function vnVayQuatTex() { return vnDaNoi('#1d3f45', '#0f262b', 7909); }

// ---------- 10. NHÀ NGÓI ĐỎ VIỆT NAM ----------
// buildNhaNgoi(): dựng 1 căn nhà ngói 3 gian rút gọn.
//  - Gốc tại mặt đất, cửa quay về +Z local (GIỮ nguyên quy ước nhà cũ
//    nên dòng house.rotation.y = -a + PI/2 trong world.js không phải sửa).
//  - Kích thước phủ bì ~5.2m (rộng) × 4m (sâu) — khớp obstacle r=3.4 cũ.
// cacheTex: object chứa texture đã tạo 1 lần (world.js truyền vào để không vẽ lại 6 lần)
export function buildNhaNgoi(cacheTex) {
  const g = new THREE.Group();
  const gach = cacheTex.gach, ngoi = cacheTex.ngoi, go = cacheTex.go;
  // Nền sân gạch trước nhà
  const san = new THREE.Mesh(
    new THREE.BoxGeometry(6.4, 0.18, 5.2),
    new THREE.MeshStandardMaterial({ map: gach, roughness: 0.95 }));
  san.material.map.repeat.set(3, 2.5);
  san.position.set(0, 0.09, 1.2);
  san.receiveShadow = true;
  g.add(san);
  // Thân nhà tường gạch
  const tuong = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, 2.7, 3.6),
    new THREE.MeshStandardMaterial({ map: gach, roughness: 0.95 }));
  tuong.position.y = 1.35 + 0.18;
  tuong.castShadow = tuong.receiveShadow = true;
  g.add(tuong);
  // Chân tường đá ong (chống ẩm) — dải đá xám dưới chân
  const chan = new THREE.Mesh(
    new THREE.BoxGeometry(4.7, 0.5, 3.7),
    new THREE.MeshStandardMaterial({ color: 0x6e6a63, roughness: 1 }));
  chan.position.y = 0.43;
  chan.receiveShadow = true;
  g.add(chan);
  // Mái ngói 2 dốc + diềm cong (đầu đao vểnh)
  const maiMat = new THREE.MeshStandardMaterial({ map: ngoi, roughness: 0.85 });
  const docTrai = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.14, 2.6), maiMat);
  docTrai.position.set(0, 3.85, -1.05); docTrai.rotation.x = 0.62;
  const docPhai = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.14, 2.6), maiMat);
  docPhai.position.set(0, 3.85, 1.05); docPhai.rotation.x = -0.62;
  docTrai.castShadow = docPhai.castShadow = true;
  g.add(docTrai, docPhai);
  // Nóc nhà (sống nóc) + 2 đầu hồi bịt gạch
  const noc = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 5.6, 8), maiMat);
  noc.rotation.z = Math.PI / 2; noc.position.set(0, 4.62, 0);
  noc.castShadow = true;
  g.add(noc);
  const hoiGeo = new THREE.CylinderGeometry(1.55, 1.55, 4.6, 3, 1);
  const hoi = new THREE.Mesh(hoiGeo, new THREE.MeshStandardMaterial({ map: gach, roughness: 0.95 }));
  hoi.rotation.set(0, 0, Math.PI / 2); hoi.rotation.y = Math.PI / 2;
  hoi.scale.set(1, 1, 0.5); hoi.position.set(0, 3.05, 0);
  g.add(hoi);
  // Ống khói bếp củi sau nhà (nhà quê nào cũng có bếp củi riêng)
  // T1/F1: ống khói nhỏ — tắt bóng cho nhẹ shadow pass (như nhà cũ)
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.4, 0.45),
    new THREE.MeshStandardMaterial({ map: gach, roughness: 0.95 }));
  chimney.position.set(1.5, 4.6, -1.0); chimney.castShadow = false;
  g.add(chimney);
  // 4 đầu đao vểnh ở góc mái (đặc trưng đình/chùa Việt)
  // T1/F1: đầu đao nhỏ — tắt bóng cho nhẹ shadow pass
  const daoGeo = new THREE.ConeGeometry(0.14, 0.7, 6);
  const daoMat = new THREE.MeshStandardMaterial({ map: ngoi, roughness: 0.85 });
  [[-2.7, 2.0], [2.7, 2.0], [-2.7, -2.0], [2.7, -2.0]].forEach(([x, z]) => {
    const d = new THREE.Mesh(daoGeo, daoMat);
    d.position.set(x, 4.35, z);
    d.rotation.set(z > 0 ? -0.7 : 0.7, 0, x > 0 ? 0.7 : -0.7);
    d.castShadow = false;
    g.add(d);
  });
  // Cửa gỗ 2 cánh + 2 cửa sổ song gỗ (mặt trước +Z)
  const cuaMat = new THREE.MeshStandardMaterial({ map: go, roughness: 0.8 });
  const canhTrai = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.8, 0.08), cuaMat);
  canhTrai.position.set(-0.3, 1.35, 1.82);
  const canhPhai = canhTrai.clone(); canhPhai.position.x = 0.3;
  g.add(canhTrai, canhPhai);
  // Khung + ngưỡng cửa
  const khung = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.0, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x3a2412, roughness: 0.9 }));
  khung.position.set(0, 1.35, 1.78);
  g.add(khung);
  canhTrai.position.z = canhPhai.position.z = 1.85; // nổi lên trên khung
  const songMat = new THREE.MeshStandardMaterial({ color: 0x2e1c0e, roughness: 0.9 });
  [-1.55, 1.55].forEach((x) => { // 2 cửa sổ song dọc
    const nen = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9),
      new THREE.MeshStandardMaterial({ color: 0xffe9b0, emissive: 0xffc46b, emissiveIntensity: 0.55 }));
    nen.position.set(x, 1.9, 1.82);
    g.add(nen);
    for (let k = -1; k <= 1; k++) {
      const song = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.04), songMat);
      song.position.set(x + k * 0.28, 1.9, 1.85);
      g.add(song);
    }
    const khungS = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.06), cuaMat);
    khungS.position.set(x, 1.9, 1.80);
    g.add(khungS);
    nen.position.z = 1.84;
  });
  // Hiên: mái ngói nhỏ + 2 cột gỗ tròn
  const hien = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 1.6), maiMat);
  hien.position.set(0, 2.75, 2.6); hien.rotation.x = -0.18;
  hien.castShadow = true;
  g.add(hien);
  // 2 cột gỗ hiên — T1/F1: cột nhỏ, tắt bóng cho nhẹ shadow pass (như nhà cũ)
  const cotGeo = new THREE.CylinderGeometry(0.11, 0.13, 2.4, 8);
  const cotMat = new THREE.MeshStandardMaterial({ map: go, roughness: 0.8 });
  const post1 = new THREE.Mesh(cotGeo, cotMat);
  post1.position.set(-1.4, 1.5, 3.25); post1.castShadow = false;
  const post2 = new THREE.Mesh(cotGeo, cotMat);
  post2.position.set(1.4, 1.5, 3.25); post2.castShadow = false;
  g.add(post1, post2);
  // Bậc thềm đá 2 cấp
  const bacMat = new THREE.MeshStandardMaterial({ color: 0x8a8a86, roughness: 1 });
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.18, 0.7), bacMat);
  b1.position.set(0, 0.27, 2.2); b1.receiveShadow = true;
  g.add(b1);
  return g;
}

// ---------- 11. CỔNG LÀNG tam quan ----------
// Cổng gạch 2 trụ + mái ngói + bảng chữ. Đặt 1 cái ở lối vào phía nam.
export function buildCongLang(cacheTex) {
  const g = new THREE.Group();
  const gach = cacheTex.gach, ngoi = cacheTex.ngoi, go = cacheTex.go;
  const truMat = new THREE.MeshStandardMaterial({ map: gach, roughness: 0.95 });
  [-1.8, 1.8].forEach((x) => { // 2 trụ gạch
    const tru = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.6, 0.9), truMat);
    tru.position.set(x, 1.8, 0); tru.castShadow = tru.receiveShadow = true;
    g.add(tru);
    const dem = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.3, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x6e6a63, roughness: 1 }));
    dem.position.set(x, 0.15, 0);
    g.add(dem);
    const chop = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.5, 4),
      new THREE.MeshStandardMaterial({ map: ngoi, roughness: 0.85 }));
    chop.position.set(x, 3.85, 0); chop.rotation.y = Math.PI / 4;
    g.add(chop);
  });
  // Mái chính 2 dốc
  const maiMat = new THREE.MeshStandardMaterial({ map: ngoi, roughness: 0.85 });
  const m1 = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.14, 1.7), maiMat);
  m1.position.set(0, 4.35, -0.55); m1.rotation.x = 0.55;
  const m2 = m1.clone(); m2.position.z = 0.55; m2.rotation.x = -0.55;
  m1.castShadow = m2.castShadow = true;
  g.add(m1, m2);
  // Bảng tên làng (canvas chữ vàng trên nền gỗ)
  const bangTex = vnCanvasTex(256, 96, (c2, w, h) => {
    c2.fillStyle = '#3a2412'; c2.fillRect(0, 0, w, h);
    c2.strokeStyle = '#c9a227'; c2.lineWidth = 6; c2.strokeRect(6, 6, w - 12, h - 12);
    c2.font = 'bold 44px serif'; c2.textAlign = 'center'; c2.textBaseline = 'middle';
    c2.fillStyle = '#ffd34d'; c2.fillText('LÀNG AN BÌNH', w / 2, h / 2 + 2);
  });
  const bang = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 0.12),
    new THREE.MeshStandardMaterial({ map: bangTex, roughness: 0.8 }));
  bang.position.set(0, 3.6, 0);
  g.add(bang);
  // Cột gỗ 2 bên cửa (giữ mái)
  const cotMat = new THREE.MeshStandardMaterial({ map: go, roughness: 0.8 });
  [-1.1, 1.1].forEach((x) => {
    const cot = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.4, 8), cotMat);
    cot.position.set(x, 1.7, 0); cot.castShadow = true;
    g.add(cot);
  });
  return g;
}

// ---------- 12. TRÂU + GÀ (con vật làng quê) ----------
// Trâu: thân xám + sừng cong + mõm. Gà: thân trắng + mào đỏ + đuôi.
// Mỗi con trả về {group, update(t)} để world.js gọi mỗi frame (đi thong thả / mổ thóc).
export function buildTrau() {
  const g = new THREE.Group();
  const da = new THREE.MeshStandardMaterial({ map: vnDaTrauTex(), roughness: 0.95 });
  const than = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 10), da);
  than.scale.set(1, 0.95, 1.5); than.position.y = 1.15; than.castShadow = true;
  g.add(than);
  const dau = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), da);
  dau.position.set(0, 1.35, 1.35); dau.castShadow = true;
  g.add(dau);
  const sungMat = new THREE.MeshStandardMaterial({ color: 0xd8cfb8, roughness: 0.7 });
  [-1, 1].forEach((s) => { // sừng cong 2 đốt
    const s1 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.7, 6), sungMat);
    s1.position.set(s * 0.55, 1.7, 1.3); s1.rotation.z = s * 1.1;
    g.add(s1);
  });
  const mom = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x8a7a72, roughness: 0.9 }));
  mom.position.set(0, 1.15, 1.7);
  g.add(mom);
  const chanGeo = new THREE.CylinderGeometry(0.13, 0.15, 1.0, 6);
  const chans = [];
  [[-0.45, 0.6], [0.45, 0.6], [-0.45, -0.6], [0.45, -0.6]].forEach(([x, z]) => {
    const c = new THREE.Mesh(chanGeo, da);
    c.position.set(x, 0.5, z); c.castShadow = true;
    g.add(c); chans.push(c);
  });
  const duoi = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 1.0, 5), da);
  duoi.position.set(0, 1.3, -1.2); duoi.rotation.x = 0.4;
  g.add(duoi);
  let ph = Math.random() * 6;
  return { group: g, update(dt) { // vẫy đuôi + nhai cỏ (đầu gật nhẹ)
    ph += dt * 2;
    duoi.rotation.z = Math.sin(ph * 1.7) * 0.5;
    dau.position.y = 1.35 + Math.sin(ph * 0.9) * 0.06;
  } };
}

export function buildGa(mau = 0) {
  const g = new THREE.Group();
  const longTex = mau === 0 ? vnLongGaTex() : vnGoTex([150, 90, 50]);
  const long = new THREE.MeshStandardMaterial({ map: longTex, roughness: 0.9 });
  const than = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), long);
  than.scale.set(1, 0.95, 1.25); than.position.y = 0.35; than.castShadow = true;
  g.add(than);
  const dau = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), long);
  dau.position.set(0, 0.58, 0.2);
  g.add(dau);
  const mao = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xd63a2e, roughness: 0.7 }));
  mao.position.set(0, 0.7, 0.2);
  g.add(mao);
  const mo = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 6),
    new THREE.MeshStandardMaterial({ color: 0xe8a91c, roughness: 0.7 }));
  mo.position.set(0, 0.56, 0.32); mo.rotation.x = Math.PI / 2;
  g.add(mo);
  const duoi = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 6), long);
  duoi.position.set(0, 0.45, -0.28); duoi.rotation.x = -0.9;
  g.add(duoi);
  let ph = Math.random() * 6;
  const toc = 0.5 + Math.random() * 0.8; // mỗi con nhanh chậm khác nhau
  return { group: g, update(dt, diChuyen) { // mổ thóc: đầu gật; di chuyển do world.js đặt vị trí
    ph += dt * (4 + toc * 3);
    dau.position.y = 0.58 + Math.abs(Math.sin(ph)) * -0.12;
    mao.position.y = dau.position.y + 0.12;
    if (diChuyen) g.position.y += Math.abs(Math.sin(ph * 2)) * 0.008;
  } };
}

// ---------- 13. NÓN LÁ chi tiết (đội cho player + NPC) ----------
// Nón vành rộng có nan tre + quai + chóp — thay nón trơn cũ.
export function buildNonLa() {
  const g = new THREE.Group();
  const nan = new THREE.MeshStandardMaterial({ map: vnNanTreTex(), roughness: 0.85, side: THREE.DoubleSide });
  const vanh = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.3, 14, 1, true), nan);
  vanh.castShadow = true;
  g.add(vanh);
  const chop = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.8 }));
  chop.position.y = 0.16;
  g.add(chop);
  const vai = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.015, 6, 20),
    new THREE.MeshStandardMaterial({ color: 0x6e4f28, roughness: 0.9 }));
  vai.rotation.x = Math.PI / 2;
  g.add(vai);
  return g;
}
