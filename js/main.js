// js/main.js — boot + vòng lặp game + hooks kiểm thử của INFINIA (entry point)
// Tách từ work/app.js (giữ nguyên logic, comment tiếng Việt, tên biến/hàm).
// Thứ tự import: config → utils → core → engine → world → daynight → ui → actors → combat
import * as THREE from 'three';
import { SAVE_KEY, SHOP_ITEMS, NAMED } from './config.js';
import { fmtFps, sustainedFps, measureLoadMs, T1_LOAD_BUDGET_MS,
         shotBlocksView, V1B_CLEAR_R, V1_LABEL_DIST, npcLabelText, npcLabelVisible } from './utils.js';
import { S, P, DN, Q, fxHooks, maxHpOf, maxMpOf, moveSpeed, saveGame, store } from './core.js';
import { renderer, scene, camera } from './engine.js';
import { uTime, groundHeight, refreshTreeLOD, refreshGrassLOD, refreshFlowerLOD, treeData, updateLanterns, updateVNAnimals, luyTreMesh, luyLaMesh } from './world.js';
import { updateDayNight, updateClouds } from './daynight.js';
import { keys, joy, camYaw, camPitch, camDist, mp, mpBar, setMp, toast,
         updateHUD, updateCamera, collide, applyQuality, cycleQuality, cycleBloom,
         updateAutoQuality } from './ui.js';
import { player, prig, tGlobal, advanceTGlobal, animateHumanoid, animateCharPlayer,
         updateNPCs, updateNPCAnim, updateLabels, updateNearNPC, npcs,
         nearNPC, dlgNPC, shopOpen, isTouch, labelTick,
         openDialog, closeDialog, openShop, closeShop, buyItem, updateFishing } from './actors.js';
import { monsters, updateMonsters, updateParts, updateLvlRing, updateFireflies, updateGlows,
         playerAttack, playerDodge, atkState, atkArcG,
         dodgeT, dodgeDir, dodgeCd, lastIx, lastIz, lastHurtT, perfNow,
         setDodgeT, setLastInput, burst, flashGlow, resetLvlT,
         isAutoFightOn, setAutoFight } from './combat.js';
import { initAudio, audioTick, playSwing } from './audio.js'; // C3: âm thanh procedural WebAudio
// Registry hiệu ứng cho ui.js/actors.js (tránh cycle import → combat)
fxHooks.burst = burst; fxHooks.flashGlow = flashGlow; fxHooks.resetLvlT = resetLvlT;

// ---------- 12. Vòng lặp game ----------
let walkPhase = 0; // nhịp bước player — chỉ tick() dùng nên để local ở main.js
const clock = new THREE.Clock();
let fpsFrames = 0, fpsTime = 0, hudTick = 0; // v3: hudTick cập nhật HUD định kỳ
let t1Dts = []; // T1: mảng dt (giây) gần nhất để tính FPS sustained (cửa sổ 5s lăn)
let t1LoadMs = null, t1FirstFrameDone = false; // T1: load time đo được thật (navigationStart → frame đầu)
let lodTick = 0; // G2: nhịp tính lại LOD cây/cỏ (0.4s/lần — đủ mượt, rẻ CPU)

// ---------- Wiring cross-module (chuyển từ ui.js app.js:2110-2114, 2143-2155) ----------
// Nút đánh/né (mobile) + phím tắt: gọi hàm actors.js/combat.js → wiring đặt ở main.js
const btnAttack = document.getElementById('btn-attack');
const btnDodge = document.getElementById('btn-dodge');
if (isTouch) { btnAttack.style.display = 'block'; btnDodge.style.display = 'block'; }
btnAttack.onclick = () => { if (atkState.cd <= 0) playSwing(); playerAttack(); }; // C3: tiếng chém khi đòn thật sự tung ra
btnDodge.onclick = () => playerDodge();

addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'KeyE' && nearNPC && !dlgNPC && !shopOpen) { // v3: shop vs hội thoại
    if (nearNPC.isShop) openShop(); else openDialog(nearNPC);
  }
  if (e.code === 'KeyJ' && !dlgNPC && !shopOpen) { if (atkState.cd <= 0) playSwing(); playerAttack(); } // v3: đánh (C3: tiếng chém)
  if (e.code === 'KeyK' && !dlgNPC && !shopOpen) playerDodge();  // v3: né
  if (e.code === 'KeyQ' && !dlgNPC && !shopOpen) cycleQuality(); // v5: đổi preset đồ họa
  if (e.code === 'KeyB' && !dlgNPC && !shopOpen) cycleBloom(); // G1: bật/tắt bloom giả
  if (e.code === 'Escape') { if (dlgNPC) closeDialog(); if (shopOpen) closeShop(); }
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', e => keys[e.code] = false);

function tick() {
  requestAnimationFrame(tick);
  const rawDt = clock.getDelta(); // wall-clock thật (không clamp) — dùng cho HUD/FPS/labels để chịu được fps thấp
  const dt = Math.min(rawDt, 0.05); // dt logic game (clamp để không nhảy cóc khi lag)
  advanceTGlobal(dt); uTime.value = tGlobal; // v4: đồng hồ chung cho animation + shader cỏ

  // --- Input di chuyển (tương đối theo hướng camera) ---
  let ix = 0, iz = 0;
  if (keys.KeyW || keys.ArrowUp) iz += 1;
  if (keys.KeyS || keys.ArrowDown) iz -= 1;
  if (keys.KeyA || keys.ArrowLeft) ix -= 1;
  if (keys.KeyD || keys.ArrowRight) ix += 1;
  if (joy.active) { ix += joy.dx; iz -= joy.dy; }
  const il = Math.hypot(ix, iz);
  if (il > 1) { ix /= il; iz /= il; }
  setLastInput(ix, iz); // v3: nhớ hướng input cho né

  const fx = Math.sin(camYaw), fz = Math.cos(camYaw); // hướng tiến (xa camera)
  const rx = -fz, rz = fx;                            // hướng phải
  if (dodgeT > 0) { // v3: đang né → dash nhanh theo hướng đã chọn
    setDodgeT(dodgeT - dt);
    P.x += dodgeDir.x * 6.5 * 3.5 * dt;
    P.z += dodgeDir.z * 6.5 * 3.5 * dt;
  } else {
    const speed = P.fly ? 11 : moveSpeed(); // v3: Giày cỏ +15%
    P.x += (fx * iz + rx * ix) * speed * dt;
    P.z += (fz * iz + rz * ix) * speed * dt;
  }
  collide();

  // --- Độ cao: đi bộ bám đất / bay giữ độ cao ---
  const gy = groundHeight(P.x, P.z);
  if (P.fly) {
    const target = gy + 9;
    if (keys.Space) P.y += 8 * dt;
    if (keys.KeyC) P.y -= 8 * dt;
    P.y += (target - P.y) * Math.min(1, dt * 2); // giữ độ cao mềm
    P.y = Math.max(P.y, gy + 1.5);
  } else {
    P.y = gy;
  }
  player.position.set(P.x, P.y, P.z);
  if (il > 0.1) { // quay mặt theo hướng di chuyển
    const ta = Math.atan2(fx * iz + rx * ix, fz * iz + rz * ix);
    let da = ta - player.rotation.y;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    player.rotation.y += da * Math.min(1, dt * 10);
  }
  // v4: animation đi bộ procedural cho player (tay chân đu theo nhịp bước)
  {
    const spd = Math.hypot((fx * iz + rx * ix), (fz * iz + rz * ix)) * (P.fly ? 11 : moveSpeed()) * (dodgeT > 0 ? 2.2 : 1);
    walkPhase += dt * (2.5 + spd * 1.15);
    animateCharPlayer(walkPhase, Math.min(1, spd / 6), tGlobal, P.fly); // v14: model thật pose-swap (rớt về rig cũ nếu load lỗi)
  }

  updateNPCs(dt);
  updateNPCAnim(dt); // v4: tay chân NPC + nhãn bay theo
  updateLabels(rawDt); // wall-clock: nhãn NPC hiện đúng hẹn dù fps thấp
  updateNearNPC(dt);
  updateFishing(dt); // P4 (v12): phao câu + nhịp cá cắn ở ao sen
  updateMonsters(dt); // v3: quái + combat
  audioTick(S, monsters); // C3: nhận diện sự kiện (trúng/chết/nhặt/lên cấp) → phát tiếng
  updateParts(dt);    // v4: hạt hiệu ứng
  updateLvlRing(dt);  // v4: vòng sáng lên cấp
  updateClouds(dt);   // v4: mây trôi
  updateDayNight(dt); // v5: chu kỳ ngày–đêm (trời, nắng, sương, ao)
  updateLanterns();   // v5: đèn lồng làng (≤4 cái gần nhất, ban đêm)
  updateVNAnimals(dt, tGlobal); // VN (v11): trâu vẫy đuôi, gà đi vòng, sen đung đưa (chỉ visual)
  updateFireflies();  // v5: đom đóm ban đêm
  updateGlows(dt);    // G1: bloom giả (sprite glow)
  lodTick += dt; // G2: LOD cây/cỏ theo khoảng cách camera, 0.4s/lần (+hysteresis chống pop)
  if (lodTick > 0.4) {
    lodTick = 0;
    refreshTreeLOD(camera.position.x, camera.position.z);
    refreshGrassLOD(camera.position.x, camera.position.z);
    refreshFlowerLOD(camera.position.x, camera.position.z);
  }
  updateCamera();

  // --- HUD: HP hồi dần khi 5s không đánh nhau, MP hồi dần, FPS ---
  if (perfNow() - lastHurtT > 5 && S.hp > 0 && S.hp < maxHpOf())
    S.hp = Math.min(maxHpOf(), S.hp + 8 * (S.vil && S.vil.gieng ? 2 : 1) * dt); // VIL: nước giếng mát hồi HP gấp đôi
  setMp(Math.min(maxMpOf(), mp + dt * 4));
  mpBar.style.width = (mp / maxMpOf() * 100) + '%';
  hudTick += dt; // v3: cập nhật HUD định kỳ (HP regen, cooldown né)
  if (hudTick > 0.2) {
    hudTick = 0;
    updateHUD();
    btnDodge.classList.toggle('cd', dodgeCd > 0);
  }
  t1Dts.push(rawDt); if (t1Dts.length > 600) t1Dts.shift(); // T1: giữ đủ dt cho cửa sổ 5s lăn (rawDt = fps thật)
  // M6A (v12): máy yếu (<40fps liên tục 3s) → tự hạ 1 bậc đồ họa; tool ?shot= thì không (giữ preset ổn định để chụp)
  if (location.search.indexOf('shot=') < 0) updateAutoQuality(dt, sustainedFps(t1Dts) || 0);
  fpsFrames++; fpsTime += rawDt; // wall-clock: HUD cập nhật đúng 0.5s dù fps thấp
  if (fpsTime >= 0.5) {
    // T1/V4: FPS sustained = trung bình 5s lăn (ổn định, không nhảy số); fmtFps đảm bảo luôn hiện số
    const fpsTxt = fmtFps(sustainedFps(t1Dts) || (fpsTime > 0 ? fpsFrames / fpsTime : 0));
    document.getElementById('fps').textContent = fpsTxt;
    document.getElementById('dbg-fps').textContent = fpsTxt;
    document.getElementById('dbg-mon').textContent =
      `quái: ${monsters.filter(m => m.alive).length}/${monsters.length} sống`;
    document.getElementById('dbg-draw').textContent =
      `draw calls: ${renderer.info.render.calls}`;
    fpsFrames = 0; fpsTime = 0;
  }

  renderer.render(scene, camera);
  if (!t1FirstFrameDone) { // T1: frame đầu đã render → đo load time thật, log console + hiện HUD Debug
    // VN (v11): frame đầu xong → đầy thanh loading rồi mờ dần (game đã vào được)
    const _ld = document.getElementById('loading'), _lb = document.getElementById('load-bar');
    if (_lb) _lb.style.width = '100%';
    if (_ld) setTimeout(() => _ld.classList.add('hide'), 350);
    t1FirstFrameDone = true;
    t1LoadMs = measureLoadMs(performance.timeOrigin || 0, performance.now());
    console.log('[T1] load time (navigationStart → frame đầu render): ' + t1LoadMs + 'ms'
      + (t1LoadMs <= T1_LOAD_BUDGET_MS ? ' (đạt mục tiêu <' + (T1_LOAD_BUDGET_MS / 1000) + 's)' : ' (VƯỢT mục tiêu <' + (T1_LOAD_BUDGET_MS / 1000) + 's)'));
    const dl = document.getElementById('dbg-load');
    if (dl) dl.textContent = 'load: ' + t1LoadMs + ' ms' + (t1LoadMs <= T1_LOAD_BUDGET_MS ? ' ✓' : ' ⚠');
  }
}

// ---------- 12b. Nút "Chơi mới", autosave, hook kiểm thử ----------
document.getElementById('btn-newgame').onclick = () => {
  if (confirm('Xóa toàn bộ tiến trình và chơi lại từ đầu?')) {
    try { store.del(SAVE_KEY); } catch (e) {}
    location.reload();
  }
};
setInterval(saveGame, 60000); // autosave mỗi 60 giây (CO_CHE_GAME mục 6.1)
addEventListener('beforeunload', saveGame);

// Hook kiểm thử headless v3: ?v3test → đánh quái 0 đến chết, ghi kết quả vào title
if (location.search.indexOf('v3test') >= 0) {
  setTimeout(() => {
    const m = monsters[0];
    P.x = m.x + 1.0; P.z = m.z; // đứng cạnh quái, mặt về phía quái
    player.rotation.y = Math.atan2(m.x - P.x, m.z - P.z);
    const inf0 = S.inf, xp0 = S.xp;
    const iv = setInterval(() => {
      atkState.cd = 0; playerAttack();
      if (!m.alive) {
        clearInterval(iv);
        document.title = 'V3TEST ' + JSON.stringify({
          mdead: true, infGain: S.inf - inf0, xpGain: Math.round((S.xp - xp0) * 10) / 10,
          php: Math.round(S.hp), respawnIn: Math.round(m.respawnT)
        });
      }
    }, 600);
    setTimeout(() => { // hết 25s chưa xong → báo timeout để biết
      if (m.alive) { clearInterval(iv); document.title = 'V3TEST TIMEOUT mhp=' + Math.round(m.hp); }
    }, 25000);
  }, 2500);
}
// Hook kiểm thử shop v3: ?shoptest → mở shop, mua Giày cỏ (cho sẵn 500∞), ghi title
if (location.search.indexOf('shoptest') >= 0) {
  setTimeout(() => {
    S.inf = 500; updateHUD();
    const n = npcs[3]; // Bà Tám Xén
    P.x = n.x + 1.5; P.z = n.z;
    openShop();
    setTimeout(() => {
      buyItem(SHOP_ITEMS[0]); // mua Giày cỏ 150∞
      buyItem(SHOP_ITEMS[1]); // mua Bùa Mạch 200∞
      document.title = 'SHOPTEST ' + JSON.stringify({
        inf: S.inf, shoes: S.shop.shoes, charm: S.shop.charm,
        speed: moveSpeed().toFixed(2), maxhp: maxHpOf()
      });
      closeShop();
    }, 1200);
  }, 2500);
}
// Hook kiểm thử headless v2 (giữ lại): ?autotest → tự nói chuyện với NPC 0 rồi ghi kết quả vào title
if (location.search.indexOf('autotest') >= 0) {
  setTimeout(() => {
    const n = npcs[0];
    P.x = n.x + 1.5; P.z = n.z; // đứng cạnh NPC 0 (Bà Lụa)
    openDialog(n);
    setTimeout(() => {
      closeDialog();
      document.title = 'AUTOTEST ' + JSON.stringify({ inf: S.inf, xp: S.xp, lv: S.lv, talked: S.talked.length, quest: S.questDone });
    }, 1500);
  }, 2500);
}



// Hook chụp ảnh đánh giá đồ họa: ?shot=day | night | combat
// Đặt player ở góc nhìn đẹp, chỉnh giờ ngày–đêm, ghi SHOT_READY vào title khi ổn định
if (location.search.indexOf('shot=') >= 0) {
  const mode = (location.search.match(/shot=([a-z]+)/) || [])[1] || 'day';
  // Tool chụp cần thấy game, không phải màn hình title (C2) — tắt overlay ngay trong phiên chụp
  const _ts = document.getElementById('title-screen');
  if (_ts) _ts.style.display = 'none';
  setTimeout(() => {
    if (mode === 'night') DN.t = 0.78;          // nửa đêm: đèn lồng + đom đóm + sao
    else if (mode === 'combat') DN.t = 0.30;    // sáng, đứng cạnh quái
    else DN.t = 0.32;                           // ban ngày, nắng đẹp
    if (mode === 'combat') {
      const m = monsters[0];
      m.hp = 9999; // V1b: quái "bất tử" trong phiên chụp — không bị chém chết trước khi SHOT_READY
      P.x = m.x; P.z = m.z; // đứng ngay cạnh quái
      // V1b: ghim quái đứng yên 2.2m BÊN CẠNH player (hướng đông, ngang tầm máy quay) —
      // đặt trước/sau lưng player đều có lúc bị chính người player che khuất tùy thời điểm;
      // đặt bên cạnh thì trong khung hình luôn tách bạch. shotPin khiến vòng update bỏ qua
      // đuổi/cắn — CHỈ trong ?shot=, không đụng gameplay.
      m.x = P.x + 2.2; m.z = P.z; m.shotPin = true;
      player.rotation.y = Math.atan2(m.x - P.x, m.z - P.z); // nhìn về phía quái
      const atkTimer = setInterval(() => { atkState.cd = 0; playerAttack(); }, 900); // chém liên tục
      // V1b: 0.1s trước SHOT_READY thì dừng chém tự động, đánh đòn cuối rồi GHIM vệt chém
      // hiện tĩnh (tắt decay arcT) — tool chụp rơi vào 0–1s sau SHOT_READY (poll mỗi 1s)
      // nên khung hình LUÔN thấy vệt chém + quái, không còn phụ thuộc may rủi thời điểm.
      setTimeout(() => {
        clearInterval(atkTimer);
        atkState.cd = 0; playerAttack();
        atkState.t = 0;
        atkArcG.visible = true;
        atkArcG.children[0].material.opacity = 0.65;
        atkArcG.scale.setScalar(1.2);
      }, 3900);
    } else {
      P.x = 9; P.z = 14; // V1: đứng gần Bà Lụa (6,12) + Bà Tám Xén (14,8) để kiểm tra nhãn tên NPC (<8m)
      player.rotation.y = Math.atan2(10 - P.x, 4 - P.z); // nhìn về giữa làng
    }
    // V1b: dọn cây chắn tầm nhìn của tool chụp — CHỈ chạy trong ?shot=, không đụng gameplay:
    // rừng đặt ngẫu nhiên (chỉ tránh bán kính 28m quanh làng) nên vẫn có cây mọc sát ngay
    // sau lưng camera bám (cách player 10m) → tán lá che nửa khung hình. Dời mọi cây nằm
    // trong hành lang rộng V1B_CLEAR_R quanh đoạn camera→player ra xa khỏi map, rồi tính
    // lại LOD. Layout làng, vị trí spawn và mọi logic chơi thật giữ nguyên.
    {
      const px = P.x, pz = P.z;
      const cx = px - Math.sin(camYaw) * Math.cos(camPitch) * camDist;
      const cz = pz - Math.cos(camYaw) * Math.cos(camPitch) * camDist;
      let don = 0;
      for (const t of treeData) {
        if (shotBlocksView(t.x, t.z, cx, cz, px, pz, V1B_CLEAR_R)) { t.x += 10000; t.z += 10000; don++; }
      }
      if (don) refreshTreeLOD(cx, cz);
      // VN: ẩn cả lũy tre khi chụp (tre không nằm trong treeData nên V1b không dọn được)
      if (luyTreMesh) luyTreMesh.visible = false;
      if (luyLaMesh) luyLaMesh.visible = false;
    }
    setTimeout(() => {
      // T1: tool ?shot= tự in số đo hiệu năng ra console trước SHOT_READY (để tools/screenshot.js đọc)
      const fpsNow = fmtFps(sustainedFps(t1Dts) || 0);
      console.log('[T1] ?shot=' + mode + ' perf: load=' + (t1LoadMs === null ? '?' : t1LoadMs + 'ms')
        + ', ' + fpsNow.replace('fps: ', 'fps_sustained: ')
        + ', draw=' + renderer.info.render.calls + ', preset=' + Q.level);
      // Chẩn đoán nhãn NPC cho tool chụp (chỉ chạy trong ?shot=): số nhãn đang hiện + độ dài dataURL canvas nhãn đầu
      // (canvas trống ~200 ký tự, đã vẽ chữ ~1-2KB) → phân biệt "không hiện" vs "hiện nhưng vẽ trống"
      try {
        const visN = npcs.filter(n => n.L.spr.visible).length;
        const pxLen = npcs[0].L.canvas.toDataURL().length;
        console.log('[T1] labels: visible=' + visN + '/' + npcs.length + ', label0px=' + pxLen
          + ', p0dist=' + Math.hypot(npcs[0].x - P.x, npcs[0].z - P.z).toFixed(1));
        const _nm = npcLabelText(npcs[0].seq, NAMED);
        const _sh = npcLabelVisible(Math.hypot(npcs[0].x - P.x, npcs[0].z - P.z), _nm);
        console.log('[T1] dbg: seq=' + npcs[0].seq + ' name=' + _nm + ' show=' + _sh
          + ' V1D=' + V1_LABEL_DIST + ' labelTick=' + labelTick.toFixed(2));
      } catch (e) { console.log('[T1] labels: probe lỗi ' + e.message); }
      document.title = 'SHOT_READY ' + mode;
    }, 4000);
  }, 2000);
}
applyQuality(('ontouchstart' in window) ? 'med' : 'high'); // v5: mobile mặc định Vừa
initAudio(); // C3: khởi động âm thanh — nút 🔊/🔇, nhạc nền, click UI
// R11-1: toggle đánh tự động trong panel Debug (mặc định BẬT)
const dbgAF = document.getElementById('dbg-autofight');
if (dbgAF) {
  dbgAF.checked = isAutoFightOn();
  dbgAF.onchange = e => {
    const on = setAutoFight(e.target.checked);
    toast('Tự đánh: ' + (on ? 'BẬT' : 'TẮT'));
  };
}
tick();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
