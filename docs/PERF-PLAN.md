# PERF-PLAN — Kế hoạch tối ưu tốc độ INFINIA

Ngày phân tích: 2026-10-07. Người phân tích: subagent perf (chỉ đọc code, không sửa).
Phạm vi: `app.js` 2112 dòng (Three.js r186) + `index.html`. Không đụng code theo yêu cầu.

## 1. Số liệu đo được (Chrome headless + SwiftShader, 1280×800, preset Cao DPR 2)

| Cảnh | FPS | Draw calls |
|---|---|---|
| Ngày (làng) | 20 | 159 |
| Đêm (làng) | 24 | 166 |
| Combat | 20 | 105 |

> Lưu ý: SwiftShader là rasterizer chạy bằng CPU nên số FPS tuyệt đối KHÔNG đại diện cho GPU thật
> (điện thoại/máy tính thật nhanh hơn nhiều). Nhưng **tỉ trọng chi phí giữa các thành phần là đúng** —
> cái nào nặng trên SwiftShader thì cũng nặng trên mobile GPU yếu.

## 2. Số liệu phân tích tĩnh

| Hạng mục | Số liệu |
|---|---|
| Tổng triangles (ước tính) | ~110.000 (địa hình 33.800 + cỏ 26.000 + hoa 10.400 + cây 7.800 + NPC 17.500 + còn lại) |
| Draw calls (đo thật) | 105–166 tùy cảnh |
| Đèn | 1 DirectionalLight (đổ bóng 2048, camera bóng 140×140) + 1 HemisphereLight + tối đa 4 PointLight (đèn lồng, không đổ bóng) |
| Shadow map | 2048 (Cao) / 1024 (Vừa) / 512 (Thấp) — đã theo preset |
| InstancedMesh | 21 cái (cây 5, cỏ/hoa 3, mây 1, đèn lồng 1, bộ phận NPC 9, hạt 1, đom đóm 1) |
| Mesh thường | ~50 cái |
| Sprite | ~43 cái (25 nhãn NPC + 18 glow bloom) |

**Phân bổ draw calls (cảnh làng, ước tính):** nhà 66 (~42%) · nhãn NPC ≤25 (~16%) · glow sprite ≤18 (~11%) ·
quái 16 (~10%) · bộ phận NPC 9 · cây LOD 5 · còn lại ~20.

## 3. 5 bottleneck lớn nhất (xếp theo độ ưu tiên: rủi ro thấp trước)

### B1. Shadow pass quá nặng — chi phí GPU lớn nhất
**Hiện trạng:** `sun.castShadow = true`, shadow map 2048 (dòng 122–123), camera bóng phủ **140×140 đơn vị**
(dòng 124–126) bao cả làng. Mỗi frame, shadow pass vẽ lại toàn bộ vật đổ bóng: ~66 mesh nhà + 5 InstancedMesh
cây (150 cây) + 9 InstancedMesh bộ phận NPC + 8 mesh player + 16 mesh quái ≈ **~104 draw calls vẽ 2 lần**.
Trên mobile GPU đây thường là bottleneck số 1.

**Giải pháp (rủi ro THẤP):**
1. Thu hẹp camera bóng và cho bám theo player — sửa dòng 124–126:
   `sun.shadow.camera.left/right/top/bottom = ±70` → `±40`, và trong `tick()` (gần dòng 1986) thêm:
   `sun.position.set(P.x + 40, 60, P.z + 20); sun.target.position.set(P.x, 0, P.z); sun.target.updateMatrixWorld();`
   → bóng vẫn đẹp quanh người chơi, độ nét bóng tăng ~3× (cùng 2048 map phủ diện tích nhỏ hơn).
2. Tắt `castShadow` cho chi tiết nhỏ không ai để ý bóng: cột hiên `post1/post2` (dòng 765–766),
   ống khói (dòng 758), tấm che `proof` (dòng 763): `castShadow = true` → `false`.
   Mắt thường không nhận ra thiếu bóng của cột hiên.

**Ước tính:** giảm ~30–40% chi phí shadow pass. Trên SwiftShader, tắt shadow hoàn toàn thường tăng
50–100% FPS → nên làm test A/B để chốt số (đề xuất ở mục 5).

### B2. 66 draw calls cho 6 cái nhà — chiếm ~42% tổng draw calls
**Hiện trạng:** mỗi nhà dựng từ 11 mesh riêng (tường, mái, cửa, 2 cửa sổ, ống khói, hiên, tấm che, 2 cột —
dòng ~746–770) × 6 nhà = 66 draw calls cho vật **tĩnh, không bao giờ cử động**.

**Giải pháp (rủi ro TRUNG BÌNH):**
- Nhà chỉ dùng 4 material (`wallMat, roofMat, doorMat, winMat` — dòng 738–741). Dùng
  `BufferGeometryUtils.mergeGeometries` (r186 có sẵn trong `three/addons/`) gộp tất cả mesh cùng material
  của cả 6 nhà thành **4 mesh duy nhất** → 66 → 4 draw calls (tiết kiệm ~60).
- Vị trí: viết trong khối build nhà (dòng ~746–772), sau khi đặt transform từng mesh thì
  `geo.applyMatrix4(mesh.matrixWorld)` rồi merge theo nhóm material.
- Rủi ro trung bình vì phải xử lý transform + UV đúng; bù lại vật tĩnh nên test visual 1 lần là xong
  (chụp 3 cảnh so sánh trước/sau).

**Ước tính:** tổng draw calls 159 → ~100 (−37%). Đây là nhát cắt lớn nhất vào draw calls.

### B3. 25 sprite nhãn NPC — draw call + overdraw khi đứng giữa làng
**Hiện trạng:** mỗi NPC 1 `THREE.Sprite` riêng (hàm `makeLabel`, dòng 893) = 1 draw call/sprite.
Đã cull theo khoảng cách <8m (`npcLabelVisible`, dòng 907) — tốt. Nhưng đứng giữa làng vẫn có
~10–15 nhãn hiện cùng lúc, mỗi cái `depthTest:false, renderOrder 5` → vẽ đè lên mọi thứ (overdraw).

**Giải pháp (rủi ro THẤP):**
- Giảm canvas nhãn `256×64` → `128×32` (dòng 912): ở khoảng cách <8m chữ vẫn đọc rõ, giảm 4× fill cost.
  Sửa: `c.width = 256; c.height = 64;` → `c.width = 128; c.height = 32;`
  (đồng thời kiểm tra `drawLabel` có scale font theo canvas không — nếu font cố định pixel thì giảm font tương ứng).

**Ước tính:** giảm fill-rate khi đông NPC; draw calls không đổi nhưng mỗi call rẻ hơn.

### B4. 18 sprite glow additive (bloom giả G1) — overdraw
**Hiện trạng:** 6 glow đèn lồng + 1 mặt trời/mặt trăng + 8 glow đom đóm + 3 flash (dòng 1640–1680).
Sprite additive trong suốt, kích thước lớn → tốn fill-rate, nhất là ban đêm (cả 15 cái cùng sáng).

**Giải pháp (rủi ro THẤP):**
- Preset Vừa: giảm `ffGlows` 8 → 4 (dòng 1671: `i < 8` → `i < 4`, mỗi sprite phụ trách 2 cụm đom đóm gần nhau).
  Ban đêm đom đóm nhấp nháy, mắt thường không đếm được 8 hay 4 quầng sáng.
- Giữ nguyên preset Cao. Preset Thấp đã tắt bloom hoàn toàn (`bloomAllowed`, dòng 255).

**Ước tính:** giảm ~4 draw calls + overdraw đáng kể ban đêm.

### B5. `updateNPCAnim`: 25 × `updateMatrixWorld(true)` mỗi frame — tốn CPU
**Hiện trạng:** dòng 1039: mỗi frame, mỗi NPC gọi `n.g.updateMatrixWorld(true)` → cập nhật ma trận cho cả
cây con (~9 object/NPC) ≈ **225 phép tính ma trận/frame**, rồi `setMatrixAt` 225 lần vào 9 InstancedMesh
+ 9 lần upload buffer GPU (`instanceMatrix.needsUpdate`).

**Giải pháp (rủi ro THẤP):**
- NPC đứng yên VÀ cách camera >30m: chỉ cập nhật animation 10Hz (mỗi 6 frame) thay vì 60Hz.
  Hơi thở (`br`) ở xa 30m mắt thường không phân biệt được 60Hz hay 10Hz.
  Sửa trong `updateNPCAnim` (dòng 1030): thêm biến đếm frame, `if (xa && !n.moving && (frame % 6)) continue;`
  (vẫn `setMatrixAt` giữ nguyên ma trận cũ — không cần).
- NPC gần (<30m) hoặc đang đi: giữ 60Hz như cũ.

**Ước tính:** cắt ~70% chi phí CPU của hàm này trong cảnh làng điển hình.

## 4. Các điểm đã tốt (không cần đụng)

- Nhãn NPC đã cull <8m; PointLight đèn lồng `visible=false` khi tắt → renderer bỏ hẳn khỏi shader.
- LOD cây/cỏ (G2) + throttle 0.4s; HUD DOM throttle 0.2s; label chỉ vẽ lại khi tên đổi.
- Cỏ 26.000 tris nhưng 1 draw call (InstancedMesh) — ổn.
- Vignette bằng CSS (`index.html` dòng 129) — miễn phí GPU.
- Đom đóm 70 × `groundHeight`/frame ≈ 560 phép sin/cos ≈ ~20μs — không đáng kể, bỏ qua.

## 5. Thứ tự làm đề xuất & cách kiểm chứng

1. **B1** (bóng) → 2. **B3** (nhãn nhỏ) → 3. **B4** (glow) → 4. **B5** (NPC xa 10Hz) → 5. **B2** (gộp nhà).
   B2 để cuối vì rủi ro trung bình dù lợi lớn nhất.
2. Mỗi bước: build standalone → chạy `node /tmp/fps2.js day night combat` (script đo FPS có sẵn,
   dùng CDP + SwiftShader) → so sánh FPS/draw calls trước–sau → chụp 3 ảnh review so visual.
3. Test A/B nên làm: đo FPS khi tắt shadow hoàn toàn 1 lần để biết trần lợi ích của B1
   (có thể toggle qua console CDP mà không cần sửa code).

## 6. Mục tiêu

- Draw calls cảnh làng: 159 → **≤100** (sau B1+B2+B4).
- FPS SwiftShader 1280×800: 20 → **≥30** (tham chiếu tương đối).
- Mục tiêu thực tế trên Android tầm trung (theo research 07-mobile-ux.md K5):
  ≥30fps sustained 5 phút ở preset Vừa, ≤80 draw calls, ≤250k tris — hiện tại ~110k tris đã đạt,
  draw calls cần B2 để về đích.
