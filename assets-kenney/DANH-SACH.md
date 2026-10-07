# DANH SÁCH ỨNG VIÊN — Model 3D thật (CC0) cho INFINIA đợt sau

> Chỉ tải + liệt kê. KHÔNG bake, KHÔNG chạm `js/` / `tests/` / `index.html` / build.
> Vị trí kit: `assets-sample-kenney/fantasy-town-kit/` (v2.0) và `assets-sample-kenney/nature-kit/` (v2.1).
> Poly đếm bằng parser GLB (POSITION count = verts, indices/3 = tris). Tất cả GLB parse OK.

## 1. NHÀ NGÓI Việt Nam — từ Fantasy Town Kit v2.0

Kiểu mái ngói VN cần = **mái dốc 2 phía (gable)** + tường gạch + cửa/cửa sổ.
Kit Kenney là phong cách Âu-trung-cổ nên **mái gable + tường đá** là mảnh dùng được;
đợt sau cần retexture ngói đỏ / vôi vàng (việc của đợt bake, không làm ở đây).

### 1a. Mái dốc 2 phía (gable) — ƯU TIÊN

| File (`Models/GLB format/`) | Dung lượng | Verts | Tris | Ghi chú dùng cho nhà ngói VN |
|---|---|---|---|---|
| `roof-gable.glb` | 7.452 B | 118 | 72 | **Mái dốc 2 phía chuẩn** — mảnh chính |
| `roof-gable-end.glb` | 6.056 B | 86 | 50 | Đầu hồi mái — khép 2 đầu nhà |
| `roof-gable-top.glb` | 6.572 B | 98 | 56 | Sống mái / nóc |
| `roof-gable-detail.glb` | 12.028 B | 206 | 128 | Chi tiết diềm mái |
| `roof-high-gable.glb` | 7.456 B | 114 | 72 | Mái dốc cao — nhà chính/đình |
| `roof-high-gable-end.glb` | 6.268 B | 90 | 52 | Đầu hồi mái cao |
| `roof-high-gable-top.glb` | 6.568 B | 98 | 56 | Nóc mái cao |
| `roof-high-gable-detail.glb` | 12.840 B | 222 | 140 | Diềm mái cao |
| `roof.glb` | 9.324 B | 155 | 64 | Đế mái — lót dưới ngói |
| `roof-high.glb` | 8.088 B | 129 | 64 | Đế mái cao |
| `roof-left.glb` / `roof-right.glb` | ~13.000 B | ~230 | 84 | Mái xéo trái/phải — nhà chữ L |
| `roof-point.glb` | 6.180 B | 88 | 44 | Chóp — chòi/cổng |
| `roof-window.glb` | 15.524 B | 266 | 176 | Mái có cửa sổ — gác mái |
| `chimney.glb` + `chimney-base.glb` + `chimney-top.glb` | 4,6–8,4 KB | 60–134 | 32–78 | Ống khói — VN ít dùng, tùy chọn (bếp củi) |

### 1b. Tường gạch + cửa — ƯU TIÊN

| File | Dung lượng | Verts | Tris | Ghi chú |
|---|---|---|---|---|
| `wall.glb` | 4.792 B | 64 | 32 | **Tường gạch chuẩn** (đá xám → retexture gạch) |
| `wall-half.glb` | 4.808 B | 64 | 32 | Tường lửng — hiên/quầy |
| `wall-side.glb` | 3.852 B | 44 | 22 | Tường biên mỏng |
| `wall-corner.glb` | 6.788 B | 104 | 52 | Góc tường |
| `wall-block.glb` | 8.532 B | 136 | 76 | Tường khối dày — chân móng |
| `wall-slope.glb` | 4.812 B | 64 | 32 | Tường vát — giáp mái |
| `wall-door.glb` | 29.276 B | 516 | 376 | **Tường + cửa gỗ** — cửa chính |
| `wall-doorway-square.glb` | 7.844 B | 124 | 70 | Khung cửa vuông (không cánh) |
| `wall-doorway-square-wide.glb` | 5.864 B | 84 | 46 | Cửa rộng — cổng/cửa hàng |
| `wall-doorway-round.glb` | 13.332 B | 232 | 172 | Cửa vòm — cổng làng/đình |
| `wall-window-glass.glb` | 15.708 B | 270 | 178 | Tường + cửa sổ kính |
| `wall-window-shutters.glb` | 23.892 B | 426 | 286 | **Tường + cửa chớp gỗ** — hợp nhà VN nhất |
| `wall-window-small.glb` | 9.376 B | 154 | 102 | Cửa sổ nhỏ — buồng/kho |
| `wall-window-stone.glb` | 12.484 B | 216 | 140 | Cửa sổ khung đá |
| `wall-window-round.glb` | 22.356 B | 396 | 278 | Cửa sổ tròn — đình/chùa |
| `wall-arch.glb` | 4.840 B | 64 | 32 | Vòm — hiên |
| `wall-broken.glb` | 16.904 B | 296 | 166 | Tường đổ — cảnh làng hoang/phế tích |

### 1c. Bản gỗ — nhà sàn / nhà quê (tùy chọn)

| File | Dung lượng | Verts | Tris | Ghi chú |
|---|---|---|---|---|
| `wall-wood.glb` | 4.808 B | 64 | 32 | Vách gỗ — nhà sàn |
| `wall-wood-door.glb` | 30.744 B | 534 | 376 | Vách + cửa gỗ |
| `wall-wood-doorway-square.glb` | 8.664 B | 140 | 82 | Khung cửa gỗ |
| `wall-wood-window-small.glb` | 11.808 B | 202 | 134 | Vách + cửa sổ nhỏ |
| `wall-wood-window-shutters.glb` | 10.612 B | 178 | 122 | Vách + cửa chớp |

### 1d. Phụ trợ sân/vườn nhà

| File | Dung lượng | Verts | Tris | Ghi chú |
|---|---|---|---|---|
| `pillar-stone.glb` | 11.324 B | 192 | 124 | Cột đá — hiên/đình |
| `pillar-wood.glb` | 5.312 B | 72 | 44 | Cột gỗ — nhà sàn |
| `stairs-stone.glb` | 12.172 B | 210 | 136 | Bậc tam cấp |
| `fence.glb` | 7.672 B | 120 | 84 | Hàng rào |
| `fence-gate.glb` | 46.340 B | 842 | 560 | Cổng rào (nặng nhất nhóm — cân nhắc) |
| `overhang.glb` | 7.648 B | 120 | 68 | Mái hiên đua ra |
| `stall.glb` | 11.500 B | 198 | 106 | Sạp chợ quê (quầy Bà Tám Xén) |
| `lantern.glb` | 14.984 B | 256 | 158 | Đèn lồng đường làng |
| `cart.glb` | 52.920 B | 940 | 608 | Xe bò/xe kéo (nặng — cân nhắc) |

## 2. CÂY NHIỆT ĐỚI — từ Nature Kit v2.1 (`Models/GLTF format/`)

**KHÔNG lấy thông** — toàn bộ `tree_pine*.glb` (22 file) và `tree_cone*.glb` (3 file) bị LOẠI.

### 2a. Cau / dừa — ƯU TIÊN (cọ)

| File | Dung lượng | Verts | Tris | Ghi chú |
|---|---|---|---|---|
| `tree_palm.glb` | 13.616 B | 592 | 186 | **Cọ chuẩn — cau/dừa** |
| `tree_palmTall.glb` | 15.592 B | 712 | 190 | Cọ cao — dừa |
| `tree_palmShort.glb` | 15.596 B | 712 | 190 | Cọ lùn — cau kiểng |
| `tree_palmBend.glb` | 14.820 B | 656 | 200 | Cọ nghiêng — ven sông, đẹp |
| `tree_palmDetailedTall.glb` | 28.204 B | 640 | 336 | Cọ chi tiết cao (nặng hơn) |
| `tree_palmDetailedShort.glb` | 28.212 B | 640 | 336 | Cọ chi tiết lùn (nặng hơn) |

### 2b. Cây đa / cây ăn quả (tán rộng lá to) — ƯU TIÊN

| File | Dung lượng | Verts | Tris | Ghi chú |
|---|---|---|---|---|
| `tree_oak.glb` | 14.644 B | 648 | 196 | **Tán rộng — đa/xoài** (ứng viên số 1) |
| `tree_detailed.glb` | 31.412 B | 2.274 | 402 | Tán rậm chi tiết — đa cổ thụ đầu làng (nặng nhất nhóm cây) |
| `tree_blocks.glb` | 10.128 B | 416 | 132 | Tán khối — cây ăn quả tỉa (ổi/mận) |
| `tree_fat.glb` | 5.576 B | 192 | 50 | Thân mập tán tròn — **rẻ nhất**, cây ăn quả |
| `tree_simple.glb` / `tree_small.glb` | 6.500 B | 240 | 62 | Cây nhỏ — vườn nhà |
| `tree_default.glb` | 9.428 B | 384 | 114 | Cây thường — phủ nền |
| `tree_thin.glb` | 17.200 B | 784 | 228 | Thân mảnh cao — cau vua/xà cừ non |
| `tree_tall.glb` | 7.000 B | 264 | 72 | Cây cao — phủ xa |
| `tree_plateau.glb` | 16.304 B | 738 | 215 | Tán phẳng — me/phượng |
| Town kit: `tree-crooked.glb` | 19.252 B | 340 | 178 | **Cây cong — đa cổ thụ** (Fantasy Town Kit) |
| Town kit: `tree.glb` / `tree-high.glb` | 18–20 KB | 320–368 | 168–200 | Cây thường phong cách town-kit |
| Town kit: `tree-high-crooked.glb` | 21.744 B | 388 | 210 | Cây cong cao — đa cổ thụ |
| Town kit: `tree-high-round.glb` | 13.176 B | 228 | 126 | Tán tròn — ăn quả |

### 2c. Tre / lúa / hoa màu VN

| File | Dung lượng | Verts | Tris | Ghi chú |
|---|---|---|---|---|
| `crops_bambooStageA.glb` | 22.092 B | 540 | 276 | **Tre non — bụi tre** |
| `crops_bambooStageB.glb` | 40.144 B | 996 | 564 | **Tre lớn** (nặng — dùng ít) |
| `crops_cornStageD.glb` | 29.316 B | 928 | 300 | Ngô — nương rẫy |
| `crops_wheatStageB.glb` | 30.040 B | 1.488 | 360 | Lúa/mạ — đồng ruộng |
| `crops_leafsStageB.glb` | 7.768 B | 164 | 84 | Rau màu — vườn |
| `crop_melon.glb` | 13.328 B | 765 | 236 | Dưa — vườn |
| `crop_pumpkin.glb` | 10.840 B | 468 | 120 | Bí — vườn |
| `crop_carrot.glb` | 12.664 B | 560 | 148 | Cà rốt — vườn |
| `crop_turnip.glb` | 14.308 B | 648 | 168 | Củ cải — vườn |

### 2d. Vũng Thiu (đầm/sình) — sen, rêu, nấm, gỗ mục

| File | Dung lượng | Verts | Tris | Ghi chú |
|---|---|---|---|---|
| `lily_large.glb` | 8.044 B | 438 | 86 | **Lá sen lớn — mặt đầm** |
| `lily_small.glb` | 5.664 B | 196 | 52 | Lá sen nhỏ |
| `hanging_moss.glb` | 4.776 B | 84 | 52 | **Rêu treo — cành đa ven đầm** |
| `mushroom_redGroup.glb` | 14.960 B | 708 | 144 | Nấm đỏ — chỗ ẩm độc |
| `mushroom_tanGroup.glb` | 14.956 B | 708 | 144 | Nấm nâu — gỗ mục |
| `log.glb` | 14.288 B | 624 | 200 | Gỗ mục — ven đầm |

### 2e. Bụi / cỏ / hoa / đá nền

| File | Dung lượng | Verts | Tris | Ghi chú |
|---|---|---|---|---|
| `plant_bush.glb` | 4.396 B | 80 | 32 | Bụi thường |
| `plant_bushLarge.glb` | 6.436 B | 132 | 60 | Bụi lớn |
| `plant_bushSmall.glb` | 3.212 B | 48 | 16 | Bụi nhỏ — rẻ nhất |
| `grass.glb` | 11.496 B | 264 | 132 | Cỏ |
| `grass_large.glb` | 18.504 B | 448 | 224 | Cỏ lớn — lau sậy ven đầm |
| `flower_redA.glb` / `flower_yellowA.glb` | ~7,1 KB | 268 | 76 | Hoa điểm xuyết |
| `rock_largeA.glb` | 7.552 B | 292 | 80 | Đá lớn |
| `rock_smallA.glb` | 3.044 B | 60 | 16 | Đá nhỏ |

## 3. QUÁI — Quaternius Cute Monsters Pack

**KHÔNG TẢI ĐƯỢC — áp dụng FALLBACK** (chi tiết ở `NGUON.md` mục 3).

- Nhu cầu: blob/mẹ-con hợp "Vũng Thiu Mẹ" (boss) + "Vẩn con" (quái nhỏ).
- Fallback chính thức: **giữ quái procedural hiện tại của game** (actors vẽ bằng
  THREE geometry + canvas texture, 0 byte asset — như rig player/nón lá trong
  `js/actors.js`). Đợt sau khi có mạng ổn định thì tải tay pack về rồi bake.

## 4. Tổng kết dung lượng

| Khoản | Dung lượng |
|---|---|
| Kenney Fantasy Town Kit v2.0 (zip tải về) | ~3,9 MB — **đã xóa sau giải nén** |
| Kenney Nature Kit v2.1 (zip tải về) | ~10,5 MB — **đã xóa sau giải nén** |
| Tổng download | **~14,4 MB < 100 MB ✓** |
| Giải nén giữ lại (`assets-sample-kenney/`) | Town 13 MB (167 GLB) + Nature 36 MB (329 GLB) |
| Quaternius | 0 B (không tải được) |

> `assets/` của agent khác không tồn tại trong repo — không có gì bị đè.
> `License.txt` của cả 2 kit được giữ nguyên trong thư mục kit + copy vào `assets-kenney/`.
