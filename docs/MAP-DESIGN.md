# THIẾT KẾ MAP LÀNG — INFINIA

*Tài liệu thiết kế layout làng An Bình. Viết ngày 2026-10-07. Đối tượng: AI coding agent (thực thi).*
*Đi kèm: [COT_TRUYEN_VA_LAU_DAI.md](COT_TRUYEN_VA_LAU_DAI.md) (lore), [MODEL-PLAN.md](MODEL-PLAN.md) (model).*

**Vấn đề hiện tại:** làng có 6 nhà, ~150 cây, 1 ao, địa hình đồi — nhưng đặt còn ngẫu nhiên, thiếu chủ ý. Người chơi mới vào không biết đi đâu, không nhớ được chỗ nào với chỗ nào.

**Mục tiêu:** làng có "hồn" — đi một lần là nhớ đường, mỗi khu có việc riêng, nhìn là biết làng quê Việt Nam.

**Ràng buộc kỹ thuật:** world 220×220 (đơn vị = mét), giữ nguyên số lượng object hiện tại (~150 cây, 6 nhà) chỉ sắp xếp lại — không tăng tải cho portal. Mọi tọa độ dưới đây là (x, z), tâm làng (0, 0).

---

## 1. Học từ 3 game

### Stardew Valley — phân khu theo chức năng, đường dẫn người chơi
Pelican Town là hub xã hội, mỗi lối ra dẫn tới một khu gameplay riêng: tây-bắc ra nông trại, tây-nam vào rừng Cindersap (ranch, nhà phù thủy), nam xuống biển, bắc lên núi (mỏ, thợ mộc). Cửa hàng, phòng khám, quán rượu quây quanh trung tâm thị trấn. Người chơi học map bằng cách "muốn câu cá thì đi hướng nam" — mỗi hướng gắn với một việc.
*(Nguồn: Stardew Valley Wiki — Pelican Town.)*

### A Short Hike — dẫn dắt bằng sightline, không cần bản đồ
Đỉnh Hawk Peak nhìn thấy được từ gần như mọi nơi trên đảo — mục tiêu luôn trong tầm mắt. Biển chỉ dẫn rải khắp nơi hướng người chơi về đỉnh. Các biome (biển, rừng, núi tuyết) chuyển tiếp tự nhiên theo địa hình. Người chơi không bao giờ lạc vì luôn có cột mốc thị giác.
*(Nguồn: Wikipedia — A Short Hike.)*

### Animal Crossing — quảng trường làm hub bất biến, ranh giới tự nhiên
Quảng trường (Resident Services) là điểm neo không đổi của đảo — mọi hoạt động daily xoay quanh nó. Sông, biển, vách đá làm ranh giới tự nhiên thay vì tường. Người chơi tự đặt nhà/cửa hàng nhưng luôn tương đối với quảng trường.

---

## 2. Bảy nguyên tắc bố trí map cho INFINIA

1. **Một hub, đường tỏa ra** (Animal Crossing) — giếng làng là (0,0); mọi đường đều bắt đầu hoặc kết thúc ở giếng. Người chơi lạc thì cứ đi về giếng.
2. **Mỗi hướng một việc** (Stardew Valley) — đông = ao/câu cá, tây = ruộng/nông, bắc = rừng/phiêu lưu, nam = đồng cỏ/chăn trâu. Muốn làm gì thì nhớ hướng đó.
3. **Nhìn thấy trước khi đi tới** (A Short Hike) — từ giếng phải thấy được cây đa, mái đình, Đài Đá cổng rừng. Không landmark nào bị nhà/cây che khuất hoàn toàn.
4. **Nhà gắn với nghề của NPC** (Stardew Valley) — thợ rèn ở rìa làng (ồn, khói), ngư dân cạnh ao, nông dân cạnh ruộng, ông Đồ cạnh đình. Vị trí nhà kể chuyện về người ở.
5. **Ranh giới bằng thiên nhiên, không bằng tường** (Animal Crossing) — hàng tre, bờ ao, dốc đồi ngăn các khu. Làng quê không có tường rào bao quanh.
6. **Đông dần về trung tâm** — quanh giếng nhà san sát, càng ra xa càng thưa, rừng thì hoang. Mật độ kể chuyện: văn minh → hoang dã.
7. **Để trống có chủ ý** — chừa 2–3 lô đất trống đẹp cho content tương lai (trường học, chợ phiên). Làng "thở" được, không lấp kín.

---

## 3. Sơ đồ phân khu

```
                        BẮC (rừng)
                           ▲
                    ┌──────┴──────┐
                    │  RỪNG TRE  │  z -45 → -90
                    │ Đài Đá     │  (0,-48): cổng rừng
                    │ Bìa rừng   │  (0,-60): quest QC1
                    └──────┬──────┘
                           │ đường đất
  TÂY (ruộng) ◄────────────┼────────────► ĐÔNG (ao)
  ┌─────────┐      ┌────────┴────────┐      ┌─────────┐
  │ ĐỒNG    │      │  TRUNG TÂM LÀNG │      │   AO    │
  │ RUỘNG   │      │  giếng (0,0)    │      │ (55,-5) │
  │ x -45→  │      │  đình (0,-18)   │      │ Bến Phúc│
  │  -90    │      │  cây đa (-14,8) │      │ (66,-5) │
  └─────────┘      └────────┬────────┘      └─────────┘
                           │ đường đất
                    ┌──────┴──────┐
                    │  ĐỒNG CỎ   │  z +30 → +80
                    │  bãi chăn  │  (trâu Cà Phê, Cu Tít)
                    └─────────────┘
                        NAM
```

### 3.1. Trung tâm làng — hub (bán kính ~25m quanh giếng)
- **Giếng làng (0, 0):** điểm spawn player, nơi Mạch trồi lên mặt đất. Xây thành giếng đá tròn + mái che + gáo múc nước. Đây là (0,0) của mọi con đường.
- **Sân đình (0, -18):** đình làng mái cong, sân gạch rộng ~12×10m. Bảng tin daily quest đặt ở sân đình (theo lore QD1–QD3). Ông Đồ Nho "giữ" đình.
- **Cây đa cổ thụ (-14, 8):** cây to nhất map (tán rộng ~10m), phía tây-bắc giếng. Dưới gốc có bàn đá + dải lụa đỏ (lore: dân làng buộc lụa). Sau này là vị trí boss Chương 1.

### 3.2. Khu nhà dân — vòng cung quanh hub
Nhà quay mặt ra đường, sân trước 3–4m, vườn sau trồng rau/cây ăn quả:

| # | Nhà của | Tọa độ | Lý do vị trí |
|---|---|---|---|
| 1 | Bà Lụa (+ nhà An) | (18, -6) | Đông hub, gần giếng nhất — bà nội, An mới về ở gần trung tâm |
| 2 | Bà Tám Xén (hàng xén/shop) | (14, 14) | Mặt đường chính đông-bắc, ai đi qua cũng thấy — đúng chất hàng xén |
| 3 | Cụ Chánh Tín (trưởng làng) | (-16, -14) | Tây-nam, gần đình — trưởng làng ở gần nơi họp làng |
| 4 | Ông Đồ Nho | (-6, -30) | Sát đình — người giữ đình ở cạnh đình |
| 5 | Chú Sáu Búa (thợ rèn) | (-30, 4) | Rìa tây — lò rèn ồn/khói, để xa khu dân nhưng vẫn trong làng |
| 6 | Cô Lan Thảo (cô lang) | (28, 8) | Đông, cạnh vườn thuốc (xem 3.5) — thầy thuốc gần thảo dược |
| — | *Lô trống A* | (30, -12) | Đông-nam — để dành trường học (Cô Giáo Huệ) |
| — | *Lô trống B* | (-28, -24) | Tây-nam — để dành quán bánh (Chị Ba Bánh) / chợ phiên |

### 3.3. Đồng ruộng — phía tây (x từ -45 đến -90, z từ -20 đến 20)
- Ruộng lúa chia ô vuông 8×8m, có bờ ruộng đi được, mương nước dọc theo.
- **Nhà Anh Hai Ruộng (-52, 0):** rìa đông của khu ruộng — nông dân ở sát ruộng mình cày.
- Vài ụ rơm + chòi canh ruộng rải rác.

### 3.4. Ao + Bến Phúc — phía đông
- **Ao (55, -5):** mặt nước tròn bán kính ~12m. Lau sậy mọc cụm ở bờ bắc.
- **Nhà Chú Tư Lưới (42, -14):** bờ tây-nam ao — ngư dân ở cạnh ao.
- **Bến Phúc (66, -5):** cầu gỗ nhô ra bờ đông ao + 2 đèn lồng. Lore: NPC bí ẩn xuất hiện đêm rằm ở đây (Nguyên tắc 7 trong COT_TRUYEN).

### 3.5. Rừng tre — phía bắc (z từ -45 đến -90)
- **Cổng rừng + Đài Đá (0, -48):** hai cột đá + Đài Đá ở giữa — nơi đổ ∞ mở Chương 2 (500∞). Đài phát sáng nhẹ khi đủ ∞.
- **Bìa rừng (0, -60):** khu vực quest QC1 "Tiếng gọi từ bìa rừng" — 3 dấu vết, quái xuất hiện.
- Càng đi sâu (z < -70) cây càng dày, ánh sáng càng tối — báo hiệu nguy hiểm.

### 3.6. Đồng cỏ — phía nam (z từ +30 đến +80)
- Bãi cỏ rộng, vài gò đất thấp. **Trâu Cà Phê + Cu Tít** chăn trâu ở đây (quest QP1 "Trâu ơi, mày đâu rồi?").
- Hoa dại mọc cụm — khu hái thuốc nam (quest QP3 của Cô Lan Thảo: lá lốt, ngải cứu, tía tô, sả, gừng dại).

---

## 4. Quy tắc đặt cây (giữ nguyên ~150 cây, chỉ sắp xếp lại)

1. **Theo cụm, không rải đều:** cụm 5–12 cây cùng loại, cách nhau 40–60m. Rải đều = rừng nhân tạo, nhìn giả.
2. **Cây to làm cột mốc:** 3–4 cây cổ thụ (cao gấp đôi cây thường) đặt tại: ngã ba đường bắc (0,-35), ngã ba đường tây (-35,0), bờ ao nam (55,8). Người chơi định hướng bằng cây to.
3. **Hàng tre làm ranh giới:** 2 hàng tre dọc z=-45 (ngăn làng/rừng) và dọc bờ đông ao (x từ 62 đến 70, z từ -15 đến 5). Tre = "tường mềm" của làng quê.
4. **Cây ăn quả gần nhà:** mỗi nhà 1–2 cây xoài/mít trong vườn sau — vừa đẹp vừa hợp lý (người quê trồng cây ăn quả quanh nhà).
5. **Trống 8m quanh nhà và 2m hai bên đường:** không cây nào mọc giữa lối đi hoặc che cửa nhà.
6. **Rừng sâu = tối + dày:** z < -70 mật độ gấp đôi, tán che bớt nắng — tạo cảm giác "vào rừng thật".

## 5. Đường đi

- **Đường chính (đất nện):** giếng (0,0) → đông tới Bến Phúc (40,-5); giếng → tây tới ruộng (-45,0); giếng → bắc tới Đài Đá (0,-48); giếng → nam tới đồng cỏ (0,35). Rộng **3m**, màu đất đỏ nện khác với cỏ.
- **Đường nhánh:** từ đường chính rẽ vào từng nhà, rộng 1.5m.
- **Uốn lượn tự nhiên:** đường cong nhẹ theo địa hình, tránh cây to (đi vòng qua thay vì chặt) — đường làng không bao giờ thẳng tắp như kẻ thước.
- Implement: vẽ đường bằng decal/texture trên mặt đất (rẻ, 0 draw call thêm nếu gộp vào texture đất) hoặc dải plane mỏng.

## 6. Năm điểm nhấn (landmark) — để không bao giờ lạc

| # | Landmark | Tọa độ | Nhận diện từ xa |
|---|---|---|---|
| 1 | Cây đa cổ thụ | (-14, 8) | Cao nhất làng, tán rộng — thấy từ mọi nơi |
| 2 | Giếng làng | (0, 0) | Mái che + dây gáo, trung tâm mọi con đường |
| 3 | Đình làng | (0, -18) | Mái cong 2 tầng, sân gạch — kiến trúc duy nhất kiểu này |
| 4 | Đài Đá cổng rừng | (0, -48) | Phát sáng xanh khi đủ ∞ — "cột đèn" của hướng bắc |
| 5 | Bến Phúc | (66, -5) | Cầu gỗ + đèn lồng đỏ — điểm sáng duy nhất phía đông |

Quy tắc sightline: đứng ở giếng (0,0) phải nhìn thấy ít nhất 3/5 landmark (cây đa, đình, Đài Đá). Không nhà nào cao che mất cây đa từ giếng.

## 7. Ghi chú implement cho dev

1. **Thứ tự làm:** (1) dọn map hiện tại về 0 → (2) đặt hub (giếng/đình/cây đa) → (3) đặt 6 nhà theo bảng 3.2 → (4) vẽ đường → (5) cụm cây theo mục 4 → (6) landmarks còn lại → (7) chi tiết (luống rau, ụ rơm, đèn lồng).
2. **Dữ liệu hóa:** mọi vị trí trên là data (mảng JSON: {loai, x, z, xoay}), không hard-code trong logic — để sau này Hoàng tự kéo-thả bố cục (Nguyên tắc 4 trong COT_TRUYEN: player expression).
3. **Không tăng object:** tổng cây giữ ~150, nhà 6 (+2 lô trống chỉ là mặt đất đánh dấu). Đường = texture, không thêm draw call.
4. **Va chạm:** mỗi nhà 1 obstacle tròn r=3.4 (đã có); cây to r=1.2, cây thường r=0.6; giếng r=2; Đài Đá r=2.5.
5. **NPC gắn nhà:** NPC spawn/đi về đúng nhà theo bảng 3.2 (phục vụ P5: lịch sinh hoạt NPC).

*Hết tài liệu. Bản đồ này là "xương sống" không gian của INFINIA — mọi quest, NPC, sự kiện sau này đều cắm vào các tọa độ trên.*
