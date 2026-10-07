# CO_CHE_GAME — Thiết kế cơ chế game INFINIA

*Tài liệu thiết kế cơ chế chi tiết, hướng tới phát triển lâu dài ổn định.*
*Viết ngày 2026-10-06. Đối tượng: Hoàng (ra quyết định) + AI coding agent (thực thi).*

**Nguyên tắc vàng của tài liệu này:** mọi con số đều phải có lý do, mọi cơ chế đều phải trả lời được câu hỏi *"người chơi làm gì tiếp theo và vì sao họ muốn làm"*. Cơ chế nào không trả lời được → cắt.

---

## 1. Phân tích cơ chế nhìn thấy từ game Vô Hạn gốc

### 1.1. Những gì quan sát được (bằng chứng)

Từ ảnh livestream và bài nghiên cứu:

| Quan sát | Suy ra |
|---|---|
| HUD có ký hiệu **∞ + số 123** tăng dần | Có một loại tài nguyên/tiền tệ tăng theo thời gian, gắn với tên game |
| **LV.25**, thanh HP (đỏ) / MP (xanh) | Hệ thống level + chỉ số kiểu RPG truyền thống |
| **2 cặp** thanh HP/MP | Người chơi điều khiển **2 nhân vật cùng lúc** (main + companion, hoặc đổi nhân vật) |
| NPC "người dân" có nhãn `ID(x,y,z,n)` | NPC là trung tâm gameplay; hệ tọa độ debug cho thấy dev quản lý từng NPC riêng lẻ |
| Nút **Fly**, **Debug**, panel debug hàng chục nút | Dev đầu tư rất mạnh vào **công cụ** (tooling) |
| Dev note: NPC đánh player, NPC đuổi theo, kẹt góc tường | Đã có **combat NPC vs player** ở mức cơ bản |
| 3 nút Inventory / Status / Control | Có túi đồ, bảng chỉ số, cài đặt (mức độ hoàn thiện chưa rõ) |
| Treo thưởng 10 triệu tìm game có tính năng giống mình | Dev tin tính năng của mình là độc nhất |

### 1.2. Core loop của game gốc (suy đoán từ bằng chứng)

Ghép các mảnh lại, vòng lặp chơi của Vô Hạn gốc có lẽ là:

> Đi lang thang trong thế giới → gặp NPC/quái → đánh nhau → lên cấp (LV.25) → số ∞ tăng → ... ?

**Vấn đề lớn nhất nhìn thấy được:** vòng lặp này **không có điểm đến**. Không thấy dấu hiệu của:
- Mục tiêu ngắn hạn rõ ràng (quest, nhiệm vụ)
- Mục tiêu dài hạn (cốt truyện, boss cuối, xây dựng gì đó)
- Lý do để số ∞ tăng ngoài việc "cho đẹp"

Đây chính là **lời giải thích cho "9 năm chưa xong"**: khi game không có core loop khép kín (làm → được thưởng → mạnh lên → thử thách mới → lặp lại), dev sẽ mãi thêm tính năng mà không bao giờ "xong", vì không có định nghĩa nào về "xong". Panel debug có hàng chục nút nhưng không thấy nút nào phục vụ **mục tiêu của người chơi**.

### 1.3. Bài học rút ra cho INFINIA

1. **Công cụ không phải gameplay.** Debug panel xịn không giữ chân người chơi. Mỗi giờ dev phải phục vụ câu hỏi "người chơi vui hơn chỗ nào".
2. **∞ phải có ý nghĩa, không chỉ là số đẹp.** Nếu số ∞ chỉ tăng cho vui, người chơi sẽ chán sau 10 phút.
3. **2 nhân vật cùng lúc = gấp đôi công sức.** Đây là quyết định scope nguy hiểm của game gốc. INFINIA sẽ **không** làm vậy ở bản đầu (xem mục 8).
4. **NPC đông nhưng vô hồn = lãng phí.** Hàng chục NPC đi lang thang mà không tương tác được thì chỉ là phông nền đắt tiền.

---

## 2. Core loop của INFINIA

### 2.1. Định nghĩa một câu

> **INFINIA = game 3D thế giới mở nơi bạn xây dựng một ngôi làng, kết bạn với người dân, đánh quái bảo vệ làng, và tích lũy Năng lượng Vô Hạn (∞) — tài nguyên không bao giờ mất, dùng để mở khóa thế giới ngày càng rộng.**

Ba trụ cột: **Khám phá → Chiến đấu → Xây dựng**, tất cả đổ về ∞.

### 2.2. Vòng lặp 3 tầng

**Vòng ngắn (30 giây – 1 phút): "đi và được thưởng"**
Đi tới chỗ NPC/quái → bấm tương tác/đánh → nhận ngay XP + ∞ + vật phẩm rơi ra.
*Yêu cầu: không bao giờ để người chơi đi quá 30 giây mà không có gì xảy ra.*

**Vòng trung (5 – 15 phút): "việc làng"**
Nhận việc từ bảng tin làng (quest board) → làm xong (đánh 5 con quái / thu 10 thảo dược / nói chuyện với 3 người dân) → nhận thưởng lớn → lên cấp.
*Đây là đơn vị "một lần chơi" (session) trên mobile.*

**Vòng dài (giờ – ngày – tuần): "làng lớn lên"**
Tích ∞ → nâng cấp làng (nhà mới, chợ, tường thành) → mở vùng đất mới → quái mạnh hơn → cần ∞ nhiều hơn → lặp lại ở quy mô lớn hơn.
*Đây là lý do người chơi quay lại sau 1 tháng.*

### 2.3. Kịch bản cụ thể

**5 phút đầu (quyết định người chơi ở lại hay xóa game):**

| Phút | Chuyện gì xảy ra | Người chơi học được gì |
|---|---|---|
| 0:00–0:30 | Spawn ở cổng làng, camera quay về phía làng. NPC trưởng làng đứng gần, có dấu "!" trên đầu | Đây là thế giới 3D đi được |
| 0:30–1:30 | Đi tới trưởng làng (đi 10 giây), bấm nói chuyện → nhận việc đầu tiên: "Đánh 3 con Cỏ Dại Quái ngoài cổng" | Cách di chuyển + cách tương tác |
| 1:30–3:00 | Ra cổng làng, thấy 3 con quái nhỏ. Bấm nút đánh (auto-attack hỗ trợ) → quái chết, rơi XP + 5∞ mỗi con | Cách chiến đấu, cảm giác "mạnh" |
| 3:00–4:00 | **Lên LV.2** (đủ XP) — màn hình sáng lên, HP/MP tăng, học được nút né | Cảm giác tiến bộ ngay |
| 4:00–5:00 | Về trả việc → nhận 60∞ + thuốc hồi máu. Trưởng làng chỉ tay về phía khu rừng: "vùng đó có hang quái, nhưng cần 500∞ để mở cổng" | Mục tiêu tiếp theo rõ ràng |

*Tiêu chí đạt: người chơi mới phải lên LV.2 và hiểu "∞ để làm gì" trong 5 phút đầu.*

**1 giờ đầu:**
- Làm 5–8 việc làng, đạt **LV.5–6**
- Mở thử chế độ bay 30 giây (quest thưởng, tạo "wow moment")
- Gặp 3 NPC có tên riêng (không phải "người dân" vô danh) — bắt đầu có tình cảm với làng
- Tích được ~400–500∞ — **gần đủ mở cổng rừng (500∞)**, tạo cảm giác "chỉ cần chơi thêm chút nữa"

**10 giờ chơi:**
- Đạt **LV.10–12**, mở được vùng Rừng (vùng 2/3)
- Làng lên cấp 2 (thêm 2 nhà mới mọc lên — người chơi thấy công sức mình có hình hài)
- Đánh boss đầu tiên: **Cây Cổ Thụ Giận Dữ** (boss đơn giản, né đòn + đánh)
- Hiểu rõ vòng dài: ∞ → nâng làng → mở đất mới → quái mạnh hơn

---

## 3. Hệ thống progression (tiến bộ)

### 3.1. Triết lý số liệu

- **Nhanh đầu, chậm sau:** 5 phút lên LV.2, 1 giờ lên LV.6, 10 giờ lên LV.12, 100 giờ lên LV.30. Người chơi mới sướng ngay, người chơi lâu vẫn còn đích.
- **Mọi con số nằm trong 1 file config** (`BALANCE.js`), không hardcode trong code gameplay. Đổi số không cần đụng code.
- **Không có "tường" đột ngột:** quái vùng mới mạnh hơn khoảng 40–60% so với vùng cũ, không gấp 10 lần.

### 3.2. Công thức XP

```
XP cần để từ LV.L lên L+1 = floor(50 × L^1.6)
```

**Bảng XP (đã tính sẵn):**

| Level | XP cần cho cấp tiếp | Tổng XP tích lũy | Thời gian chơi ước tính (tích lũy) |
|---|---|---|---|
| 1 → 2 | 50 | 0 | 5 phút |
| 2 → 3 | 151 | 50 | 15 phút |
| 3 → 4 | 290 | 201 | 30 phút |
| 4 → 5 | 460 | 491 | 50 phút |
| 5 → 6 | 656 | 951 | ~1.2 giờ |
| 6 → 7 | 879 | 1,607 | ~1.8 giờ |
| 7 → 8 | 1,125 | 2,486 | ~2.5 giờ |
| 8 → 9 | 1,393 | 3,611 | ~3.5 giờ |
| 9 → 10 | 1,681 | 5,004 | ~5 giờ |
| 10 → 11 | 1,990 | 6,685 | ~7 giờ |
| 15 → 16 | 3,810 | ~25,000 | ~25 giờ |
| 20 → 21 | 6,035 | ~55,000 | ~55 giờ |
| 25 → 26 | 8,625 | ~105,000 | ~100 giờ |
| 30 → 31 | 11,550 | ~175,000 | ~170 giờ |
| 40 → 41 | 18,330 | ~400,000 | — |
| 50 (max) | 26,100 | ~750,000 | — |

*Cách đọc: cột "thời gian" giả định người chơi casual kiếm ~700–1.000 XP/giờ (quest + đánh quái). Level tối đa 50 — đủ cho 6–12 tháng chơi.*

**Nguồn XP:**
| Nguồn | XP mỗi lần | Ghi chú |
|---|---|---|
| Quái thường vùng 1 | 8–12 | Đánh ~5 giây/con |
| Quái thường vùng 2 | 25–40 | |
| Quái thường vùng  | 60–100 | |
| Boss | 500–2,000 | Một lần/tuần hồi lại |
| Việc làng nhỏ | 40–80 | 5–10 phút/việc |
| Việc làng lớn | 150–300 | Mở theo cấp làng |
| Khám phá địa điểm mới | 100 | Một lần duy nhất/địa điểm |

### 3.3. Chỉ số nhân vật

Công thức tuyến tính đơn giản (dễ cân bằng, dễ hiểu):

| Chỉ số | Công thức theo level L | LV.1 | LV.10 | LV.25 | LV.50 |
|---|---|---|---|---|---|
| HP (máu) | 100 + 12×(L−1) | 100 | 208 | 388 | 688 |
| MP (năng lượng) | 50 + 6×(L−1) | 50 | 104 | 194 | 344 |
| ATK (tấn công) | 8 + 2.2×(L−1) | 8 | 27.8 | 60.8 | 115.8 |
| DEF (phòng thủ) | 2 + 0.8×(L−1) | 2 | 9.2 | 21.2 | 41.2 |
| Tốc độ chạy | 6.5 (không đổi) | 6.5 | 6.5 | 6.5 | 6.5 |

*Không tăng tốc độ chạy theo level — tốc độ là "cảm giác" của game, đổi là người chơi thấy lạ.*

**Lên cấp được gì:** HP/MP hồi đầy + tự động cộng chỉ số theo công thức + **1 điểm kỹ năng** (từ LV.5 trở đi, người chơi tự cộng vào ATK/DEF/HP theo ý thích — đây là "build" đơn giản nhất).

### 3.4. Mốc unlock (mở khóa)

| Level | Mở khóa | Vì sao đặt ở đây |
|---|---|---|
| LV.2 | Nút né (dodge) | Đã quen đánh thường |
| LV.3 | Bay thử 30 giây (quest) | "Wow moment" sớm, gây nghiện |
| LV.5 | Điểm kỹ năng + túi đồ 20 ô | Bắt đầu "build" nhân vật |
| LV.8 | Vùng Rừng (cần 500∞) | Đủ cứng để đánh quái mới |
| LV.10 | Nâng làng cấp 2 | Thấy làng thay đổi |
| LV.15 | Vùng Hang Động (cần 5,000∞) | |
| LV.20 | Boss Cây Cổ Thụ | Thử thách lớn đầu tiên |
| LV.25 | Bay tự do (không giới hạn 30s) | Phần thưởng dài hạn, gợi nhớ nút Fly của game gốc |
| LV.30 | Vùng Núi Tuyết (cần 25,000∞) | |
| LV.40 | Danh hiệu "Huyền Thoại Làng" + skin đặc biệt | Vinh danh người chơi gắn bó |

---

## 4. Hệ thống NPC

### 4.1. Phân loại NPC (không phải NPC nào cũng như nhau)

| Loại | Số lượng mục tiêu | AI cần | Ví dụ |
|---|---|---|---|
| **Dân làng thường** | 20 (MVP) → 40 (Alpha) → 60 (Beta) | Đi dạo, tránh vật cản, phản ứng khi bị đánh | Người dân đi chợ |
| **NPC có tên (quest giver)** | 5 → 10 → 15 | Đứng yên tại chỗ + hội thoại + giao/nhận việc | Trưởng làng, thợ rèn, thầy thuốc |
| **Quái thường** | 15 → 30 → 50 | Đuổi theo, đánh, bỏ cuộc khi mất dấu | Cỏ Dại Quái, Sói Rừng |
| **Boss** | 0 → 1 → 3 | Đánh theo "bài" (pattern): đánh thường → skill → nghỉ | Cây Cổ Thụ Giận Dữ |

*Tổng số thực thể AI cùng lúc: MVP ~35, Alpha ~80, Beta ~125. Con số này quyết định performance budget (mục 7).*

### 4.2. State machine chi tiết

**Dân làng thường** (kế thừa từ prototype, mở rộng):

| Trạng thái | Hành vi | Chuyển khi |
|---|---|---|
| `idle` | Đứng yên 2–5 giây, nhìn quanh | Hết giờ → `walk` |
| `walk` | Đi tới điểm ngẫu nhiên trong làng, tốc độ 1.5–2.5 | Tới nơi → `idle`; bị đánh → `scared` |
| `scared` | Chạy xa khỏi nguồn nguy hiểm 3 giây | Hết 3 giây → `idle` |
| `talk` | Đứng yên, quay mặt về player | Player rời xa 5m → `idle` |
| `sleep` | **Tắt AI hoàn toàn** (tiết kiệm máy) | Player lại gần 50m → `idle` |

*Trạng thái `sleep` là quan trọng nhất về hiệu năng: NPC cách xa 50m thì "ngủ", không tìm đường, không vẽ nhãn.*

**Quái thường:**

| Trạng thái | Hành vi | Chuyển khi |
|---|---|---|
| `idle` | Đứng/loanh quanh bãi quái | Player vào tầm nhìn 12m → `chase` |
| `chase` | Chạy về phía player, tốc độ 4 | Mất dấu 10 giây (player chạy xa 25m) → `return`; tới gần 2m → `attack` |
| `attack` | Đánh mỗi 1.2 giây | Player chạy xa 3m → `chase`; HP quái hết → `die` |
| `stunned` | Khựng 1 giây sau khi bị đánh trúng | Hết 1 giây → `chase` |
| `return` | Đi bộ về vị trí ban đầu, hồi đầy HP | Về tới nơi → `idle` |
| `die` | Ngã xuống, rơi vật phẩm, biến mất sau 3 giây | Hồi sinh sau 60 giây tại bãi cũ |

**Quy tắc chống kẹt (rút từ bug game gốc):**
- Mọi trạng thái `chase`/`attack` đều có **bộ đếm thời gian tối đa**: đuổi quá 10 giây không đánh trúng → bỏ cuộc về `return`.
- NPC không di chuyển được quá 3 giây (kẹt tường) → tự lùi 2m rồi chọn hướng mới.
- Đây là **luật bắt buộc**, Devin phải viết thành test tự động (thả NPC vào góc tường, assert tự thoát trong 5 giây).

### 4.3. Lịch sinh hoạt (để Beta, KHÔNG làm ở MVP/Alpha)

Dân làng có ngày/đêm đơn giản: sáng ra đồng/chợ, tối về nhà (đèn nhà sáng). Chỉ là **đi từ điểm A tới điểm B theo giờ**, không cần AI phức tạp. Lý do để sau: tốn công mà người chơi ít để ý trong 10 giờ đầu.

### 4.4. Tương tác với player

| Tương tác | Cách thực hiện (mobile) | Kết quả |
|---|---|---|
| Nói chuyện | Đi gần NPC có dấu "!" → hiện nút "Nói" → bấm | Hội thoại 2–3 câu, có thể nhận việc |
| Nhận/trả việc | Qua NPC hoặc bảng tin làng | XP + ∞ + vật phẩm |
| Đánh quái | Nút "Đánh" to ở góc phải | Quái mất HP, rơi đồ |
| Né | Nút "Né" nhỏ cạnh nút đánh (mở ở LV.2) | Lướt nhanh 3m, miễn sát thương 0.4 giây |
| Bay | Nút "Fly" (mở dần theo level) | Tự do di chuyển 3D |

*Nguyên tắc mobile: không quá 3 nút hành động trên màn hình cùng lúc (Đánh / Né / Tương tác). Mọi thứ khác vào menu.*

---

## 5. Combat, vật phẩm, kinh tế

### 5.1. Combat: CÓ, nhưng đơn giản (quyết định đã chốt ở mục 9)

**Triết lý:** combat của INFINIA phục vụ cảm giác "mạnh lên", không phải thử thách kỹ năng hardcore. Người chơi mobile chơi 10 phút trên xe buýt phải đánh được.

**Cơ chế:**
- **Đánh thường:** bấm nút (hoặc tự đánh khi đứng gần — "auto-attack hỗ trợ", bật/tắt trong cài đặt). Mỗi đòn = 1 animation vung tay, sát thương theo công thức dưới.
- **Né:** lướt nhanh, có 0.4 giây miễn sát thương. Dùng để tránh đòn mạnh của boss.
- **Kỹ năng:** tối đa 2 kỹ năng (mở ở LV.8 và LV.15), mỗi kỹ năng 1 nút, hồi chiêu 8–15 giây. Ví dụ: "Chém Xoay" (sát thương xung quanh), "Hồi Máu" (tốn MP).
- **Không có:** combo đếm số, đỡ đòn (parry) theo thời gian, hệ nguyên tố khắc chế (để bản mở rộng).

**Công thức sát thương:**
```
sát thương = ATK_người_đánh × (100 / (100 + DEF_người_chịu)) × ngẫu_nhiên(0.9 – 1.1)
```
Ví dụ: player LV.10 (ATK 27.8) đánh quái DEF 5 → 27.8 × (100/105) ≈ 26.5 sát thương/đòn. Quái vùng 1 HP 60 → 3 đòn chết (~4 giây). Nhịp độ chuẩn: quái thường chết trong 3–5 đòn.

**Boss "Cây Cổ Thụ Giận Dữ" (mẫu cho mọi boss sau):**
- HP 2,000, 3 đòn đánh theo "bài" lặp lại: (1) quật cành trước mặt (né được), (2) gọi 3 quái con, (3) nghỉ 5 giây (cơ hội đánh trả)
- Người chơi LV.18–20 đánh ~3–4 phút thì thắng. Thua thì hồi sinh ở làng, boss hồi đầy HP (không phạt nặng).

### 5.2. Vật phẩm / Inventory

**Giữ tối giản — 4 loại vật phẩm duy nhất:**

| Loại | Ví dụ | Dùng để làm gì |
|---|---|---|
| Vũ khí | Gậy Gỗ → Kiếm Sắt → Kiếm Làng Rèn | Tăng ATK (chỉ số duy nhất, không có dòng phụ ở bản đầu) |
| Giáp | Áo Vải → Áo Da → Giáp Sắt | Tăng DEF + HP |
| Thuốc | Thuốc Đỏ (hồi 50 HP), Thuốc Xanh (hồi 30 MP) | Bấm để dùng ngay trong combat |
| Nguyên liệu / Việc | Thảo Dược, Đá Lạ, Thư của trưởng làng | Nộp cho quest hoặc bán lấy ∞ |

**Quy tắc chống phình to:**
- Túi đồ 20 ô (mở rộng lên 40 ô bằng ∞ ở Beta).
- Mỗi loại vũ khí/giáp chỉ có **1 chỉ số** (ATK hoặc DEF) + tên + độ hiếm. KHÔNG có dòng phụ (chí mạng, hút máu...) ở bản đầu — đó là mồi scope creep kinh điển.
- Độ hiếm 3 bậc: Thường (trắng) → Tốt (xanh) → Hiếm (tím). Không có bậc "huyền thoại" ở bản đầu.
- Đồ rơi từ quái theo bảng tỷ lệ cố định trong config (ví dụ: Kiếm Sắt rơi 5% từ Sói Rừng).

### 5.3. Kinh tế: ∞ (Năng lượng Vô Hạn) là gì và dùng để làm gì

**Định nghĩa chốt:** ∞ là **tài nguyên meta vĩnh viễn** — không bao giờ mất khi chết, không bao giờ reset, không có giới hạn trần. Đúng như tên game: vô hạn.

**Kiếm ∞ ở đâu:**
| Nguồn | Lượng | Ghi chú |
|---|---|---|
| Tự sinh theo thời gian online | +1 mỗi 10 giây (+360/giờ) | Kể cả đứng yên — "chỉ cần ở trong thế giới là lớn lên" |
| Đánh quái | +3–10/con | |
| Làm việc làng | +50–300/việc | Nguồn chính |
| Khám phá địa điểm mới | +200/lần | Một lần duy nhất |
| Bán vật phẩm thừa | +5–50/món | |

**Tiêu ∞ vào đâu (bẫy chi tiêu tăng dần — chống lạm phát):**

| Khoản chi | Giá | Mở khi |
|---|---|---|
| Mở cổng Rừng (vùng 2) | 500∞ | ~1 giờ chơi |
| Nâng làng cấp 2 | 2,000∞ | ~5 giờ chơi |
| Mở rộng túi đồ lên 40 ô | 1,500∞ | Bất kỳ lúc nào |
| Mở Hang Động (vùng 3) | 5,000∞ | ~15 giờ chơi |
| Nâng làng cấp 3 | 10,000∞ | ~40 giờ chơi |
| Mở Núi Tuyết (vùng 4) | 25,000∞ | ~100 giờ chơi |
| Skin "Áo Choàng Vô Hạn" | 50,000∞ | Vinh danh, không tăng sức mạnh |

*Thiết kế này tạo ra "đường cong khát": người chơi luôn thấy thứ tiếp theo mình muốn mua, giá luôn cao hơn khả năng hiện tại một chút — động lực quay lại mỗi ngày.*

**Nguyên tắc kinh tế sắt:**
1. ∞ **không mua được sức mạnh trực tiếp** (không bán ATK/DEF bằng ∞). ∞ chỉ mở khóa *cơ hội* (vùng đất, làng) — sức mạnh vẫn phải tự đánh mà lên. Như vậy game không bao giờ thành "pay-to-win" kể cả sau này có nạp tiền.
2. Không có loại tiền thứ hai ở bản đầu. Một loại tiền = một nửa công cân bằng.
3. Mọi con số giá nằm trong `BALANCE.js`.

---

## 6. Save/Load và chống gian lận

### 6.1. Lưu cái gì, khi nào

**Dữ liệu save (ước tính < 100KB — nhẹ):**
- Nhân vật: level, XP, ∞, HP/MP, vị trí, điểm kỹ năng
- Túi đồ: danh sách vật phẩm (id + số lượng)
- Tiến trình: việc đã làm, vùng đã mở, cấp làng, boss đã đánh
- Cài đặt: âm lượng, chất lượng đồ họa, vị trí nút

**Khi nào lưu:**
- Tự động mỗi **60 giây** + mỗi khi lên cấp / nhận việc / mở vùng mới (sự kiện quan trọng)
- Lưu vào **2 slot luân phiên** (slot A, slot B): đang ghi slot A mà crash thì còn slot B nguyên vẹn — chống mất save là ưu tiên số 1, trên cả chống hack.

**Định dạng:** JSON + version (ví dụ `"saveVersion": 3`). Mỗi bản cập nhật game phải có code **chuyển đổi save cũ → mới** (migration). Quy tắc: không bao giờ xóa field cũ, chỉ thêm field mới có giá trị mặc định.

### 6.2. Chống gian lận: mức độ vừa phải (nói thẳng)

Như bài nghiên cứu đã phân tích: game offline 1 người chơi thì **không chống hack tuyệt đối được**, và cũng **không cần**.

**Làm (rẻ, hiệu quả):**
- Mã hóa nhẹ file save (XOR + mã kiểm tra): sửa số bằng tay thì file hỏng → game báo "file save hỏng, dùng bản sao lưu" → nản chí hacker tay mơ.
- Không tin số ∞ từ client nếu sau này có bảng xếp hạng.

**Không làm (tốn công vô ích ở giai đoạn này):**
- Chống root/jailbreak, chống debug, kiểm tra chữ ký phức tạp.
- Mọi công nghệ chống crack nặng: làm game chậm đi mà crack vẫn bị crack.

**Thứ tự ưu tiên đúng:** sao lưu source code (Git + nhiều nơi) > đăng ký bản quyền > chống save bị sửa vô tình > (rất xa mới tới) chống crack.

---

## 7. Kiến trúc kỹ thuật cho phát triển lâu dài ổn định

*Mục này viết dưới dạng "luật" để chỉ đạo AI coding agent. Mỗi luật đều sinh ra từ một bài học cụ thể.*

### 7.1. Luật 1: Data-driven — số liệu không bao giờ nằm trong code logic

Mọi con số (XP, HP, giá ∞, tỷ lệ rơi đồ, tầm nhìn quái...) nằm trong **1 file duy nhất**: `src/config/BALANCE.js` (kế thừa ý tưởng từ prototype, nơi `WORLD`, `COUNT` đã là hằng số đầu file).

```js
// Ví dụ cấu trúc (Devin tự triển khai chi tiết)
BALANCE = {
  xp:      { base: 50, exp: 1.6, maxLevel: 50 },
  player:  { hpBase: 100, hpPerLevel: 12, /* ... */ },
  infinity:{ passivePerSec: 0.1, unlocks: { forestGate: 500, /* ... */ } },
  mobs:    { "grass_imp": { hp: 60, atk: 5, xp: 10, inf: 5 }, /* ... */ },
  drops:   { "grass_imp": [ { item: "iron_sword", rate: 0.05 } ] },
}
```

*Lợi ích: Hoàng muốn "cho quái vùng 2 nhiều XP hơn" thì chỉ sửa 1 con số, không cần Devin đọc cả code. Cân bằng game thành việc chỉnh số, không phải viết lại code.*

### 7.2. Luật 2: Module tách rời — mỗi hệ thống là 1 file, giao tiếp qua "hợp đồng" mỏng

```
src/
  config/BALANCE.js     ← mọi con số
  world/terrain.js      ← địa hình (đã có trong prototype)
  world/village.js      ← làng, nhà, nâng cấp làng
  entities/player.js    ← di chuyển, camera
  entities/npc.js       ← dân làng (state machine)
  entities/mobs.js     ← quái + boss
  systems/combat.js     ← công thức sát thương (đọc BALANCE, không tự chứa số)
  systems/quest.js      ← việc làng
  systems/inventory.js  ← túi đồ
  systems/save.js       ← save/load + migration
  ui/hud.js             ← HUD
```

*Luật: file `combat.js` không được biết NPC vẽ như thế nào; file `npc.js` không được biết công thức XP. Muốn thay hệ thống combat mới thì chỉ thay 1 file. Đây là cách tránh "đụng đâu vỡ đó" khi game lớn dần.*

### 7.3. Luật 3: Performance budget — con số trần không được vượt

Dựa trên số liệu thực tế cho mobile tầm trung (điện thoại người Việt phổ biến):

| Chỉ số | Trần MVP | Trần Alpha | Trần Beta | Cách đo |
|---|---|---|---|---|
| FPS tối thiểu | 30 | 30 | 30 | HUD debug (đã có) |
| Draw calls | ≤ 60 | ≤ 80 | ≤ 100 | `renderer.info.render.calls` (đã có) |
| Tam giác/frame | ≤ 100k | ≤ 150k | ≤ 200k | `renderer.info.render.triangles` |
| NPC AI cùng lúc | 35 | 80 | 125 | Đếm trong debug panel |
| Dung lượng tải | < 5MB | < 15MB | < 30MB | (bản web hiện tại < 1MB vì procedural) |

*Luật: mỗi lần Devin thêm tính năng mới phải báo cáo 3 con số (FPS/draw calls/triangles) trước và sau. Vượt trần → tối ưu hoặc cắt tính năng, không được "kệ".*

**Các kỹ thuật bắt buộc đã áp dụng/triển khai:**
- InstancedMesh cho vật lặp lại (cây đã làm trong prototype — mở rộng cho cỏ, đá, quái cùng loại)
- NPC xa > 50m thì `sleep` (mục 4.2)
- Nhãn ID chỉ vẽ lại mỗi 0.5 giây (đã làm trong prototype)
- Bóng đổ: 1 nguồn sáng, độ phân giải 1024 trên mobile (prototype đang 2048 — Devin phải giảm khi build mobile)

### 7.4. Luật 4: Content pipeline — thêm nội dung mới không được sửa code cũ

Thêm 1 con quái mới = thêm **1 dòng config**, không sửa file logic:

```js
// Thêm quái mới: chỉ thêm dòng này vào BALANCE.js, không đụng mobs.js
"frost_wolf": { hp: 400, atk: 35, xp: 80, inf: 12, zone: "snow" }
```

Thêm 1 việc làng mới = thêm 1 object quest. Thêm 1 NPC có tên = thêm 1 dòng spawn.

*Luật: nếu Devin phải sửa file logic để thêm nội dung mới → thiết kế sai, phải refactor trước khi thêm tiếp. Đây là "bảo hiểm" chống lại việc code càng ngày càng rối như game gốc (dev note mục 10: "tìm hiểu lại code di chuyển toàn bộ người dân" — tức là code đã rối đến mức chính dev phải đọc lại).*

### 7.5. Luật 5: Test tự động cho cơ chế — mỗi cơ chế có "bài kiểm tra" riêng

| Cơ chế | Bài test | Đạt khi |
|---|---|---|
| NPC đi dạo | Thả 30 NPC, chạy 5 phút | 0 con kẹt cứng, 0 con trong thân cây |
| Quái đuổi | Lùa quái vào góc tường 5 lần | Cả 5 lần tự thoát trong 5 giây |
| Combat | Player LV.10 đánh quái vùng 1 | Quái chết trong 3–5 đòn |
| XP/level | Giả lập 1 giờ chơi | Đạt LV.5–6 (±1) |
| Save/load | Lưu → tắt → mở lại 20 lần | 20/20 còn nguyên, không mất đồ |
| Performance | 60 NPC + combat cùng lúc | FPS ≥ 30 |

*Devin chạy bộ test này sau mỗi lần sửa code liên quan. Không có test = không được merge.*

---

## 8. Roadmap cơ chế theo phase

### 8.1. MVP — "vòng lặp 5 phút chạy được" (prototype hiện tại + 2–4 tuần)

**Đã có trong prototype:** di chuyển, camera, NPC đi dạo có ID, HUD ∞/LV/HP-MP, Fly, Debug, va chạm cơ bản.

**Thêm:**
1. NPC trưởng làng có tên + hội thoại + giao việc đầu tiên ("đánh 3 Cỏ Dại Quái")
2. 3 con quái Cỏ Dại (đứng yên gần cổng làng, HP 60, đánh lại yếu)
3. Nút Đánh + quái chết rơi XP/∞ + hiệu ứng đơn giản
4. Thanh EXP + lên LV.2 (công thức mục 3.2)
5. Save/load localStorage + autosave 60 giây
6. ∞ có ý nghĩa đầu tiên: tích đủ 500∞ hiện tiến trình mở cổng Rừng (chưa mở được — tạo khát khao)

**Tiêu chí xong MVP:** người lạ chơi 5 phút → lên LV.2 → hiểu ∞ để làm gì → tắt game mở lại còn nguyên.

### 8.2. Alpha — "game chơi được 10 giờ" (2–3 tháng sau MVP)

**Thêm:**
1. Combat đầy đủ: nút Né, 1 kỹ năng, 3 loại quái vùng 1, quái có `chase/attack/return`
2. Inventory 20 ô: nhặt/mặc/dùng/bán (4 loại vật phẩm như mục 5.2)
3. Bảng việc làng: 10 việc nhỏ + 3 việc lớn, NPC có tên (5 người)
4. Vùng Rừng mở được (500∞): quái mới, 2 địa điểm khám phá
5. Nâng làng cấp 2 (2,000∞): nhà mới mọc lên
6. Boss Cây Cổ Thụ (bản đơn giản: 2 đòn đánh)
7. Điểm kỹ năng từ LV.5

### 8.3. Beta — "game giữ chân 100 giờ" (3–4 tháng sau Alpha)

**Thêm:**
1. Vùng Hang Động + Núi Tuyết, tổng 3 boss
2. Nâng làng cấp 3, NPC lịch sinh hoạt ngày/đêm đơn giản
3. Bay tự do (LV.25), túi 40 ô, độ hiếm Tím
4. Hệ thống danh hiệu + skin ∞
5. Polish mobile: tối ưu pin, cài đặt đồ họa 3 mức, Việt hóa 100%

### 8.4. DANH SÁCH CẮT BỎ — để tránh thành "Vô Hạn 9 năm"

Những thứ **tuyệt đối không làm** trước khi Beta xong và có người chơi thật:

| Cắt bỏ | Vì sao |
|---|---|
| Chơi 2 nhân vật cùng lúc (game gốc có) | Gấp đôi công UI + AI + cân bằng, giá trị chưa chứng minh |
| Multiplayer / online | Đòi server, đồng bộ, chống hack — biến solo dev thành công ty |
| Crafting (chế đồ từ nguyên liệu) | Hệ thống phức tạp, thay bằng "nâng cấp" đơn giản |
| Hệ nguyên tố khắc chế | Thêm vào combat sau nếu người chơi đòi |
| Ngày/đêm + thời tiết | Chỉ làm bản tối giản ở Beta (đèn sáng/tắt) |
| Mini-game (câu cá, đào mỏ...) | Mỗi mini-game = 1 game con, ngốn thời gian |
| Pet / thú cưỡi | = thêm 1 nhân vật AI nữa |
| Cốt truyện phân nhánh / nhiều kết thúc | 1 tuyến truyện thẳng là đủ |
| Lồng tiếng | Text là đủ cho bản đầu |
| Chống crack nâng cao | Như mục 6.2 đã phân tích |

*Quy tắc thêm tính năng mới: phải có ít nhất 5 người chơi thật yêu cầu, hoặc Hoàng quyết định bằng văn bản. Không thêm vì "thấy hay".*

---

## 9. Quyết định cần Hoàng chốt

| # | Quyết định | Khuyến nghị của Thunder | Nếu chọn ngược lại thì sao |
|---|---|---|---|
| 1 | Combat có hay không? | **Có, bản đơn giản** (1 nút đánh + 1 nút né) — không combat thì 5 phút đầu không có gì làm | Không combat → game thành "walking simulator", chỉ hợp nếu tập trung xây dựng thuần túy |
| 2 | ∞ là gì? | **Tài nguyên meta vĩnh viễn**, kiếm dần, dùng mở khóa — như mục 5.3 | ∞ chỉ để trang trí → mất hook dài hạn, game chết sau 10 giờ |
| 3 | Có làm 2 nhân vật như game gốc? | **Không** — cắt để giữ scope | Làm → gấp đôi công sức mọi hệ thống, nguy cơ "vô hạn" thật |
| 4 | Đồ họa: giữ procedural đơn giản hay thuê vẽ đẹp? | **Giữ procedural** đến hết Alpha — gameplay trước, đẹp sau | Thuê art sớm → tốn tiền vào thứ người chơi chưa chắc thấy nếu game chưa vui |
| 5 | Chống hack save mức nào? | **Mã hóa nhẹ** (mục 6.2) | Đầu tư chống crack nặng → đốt thời gian, game chậm đi |
| 6 | Tiền thật (nạp tiền) khi nào? | **Sau Beta**, và chỉ bán cosmetic/∞ (không bán sức mạnh) | Bán sức mạnh → pay-to-win → mất uy tín với người chơi Việt |
| 7 | Ngôn ngữ game? | **Tiếng Việt 100%** từ MVP (game gốc để tiếng Anh lổn nhổn là điểm trừ) | Tiếng Anh → mất điểm với người chơi phổ thông VN |
| 8 | Mục tiêu level tối đa? | **50** (bảng mục 3.2) — đủ cho 6–12 tháng | Không giới hạn → số liệu vỡ, cân bằng không kiểm soát được |
| 9 | Khi nào chuyển từ web prototype sang Unity/mobile thật? | **Sau khi MVP web được 10 người chơi thử và xác nhận "vui"** | Chuyển sớm → đốt công làm app cho game chưa chắc vui |
| 10 | Ai quyết định thêm tính năng mới? | **Hoàng, bằng văn bản** (quy tắc mục 8.4) | Ai cũng thêm → scope creep → 9 năm như game gốc |

---

## Phụ lục: Từ điển thuật ngữ (để Hoàng đọc tài liệu kỹ thuật sau này)

| Thuật ngữ | Nghĩa nôm na |
|---|---|
| Core loop | Vòng lặp việc chính người chơi làm đi làm lại mà vẫn vui |
| Session | Một lần mở game chơi (thường 5–15 phút trên mobile) |
| XP / EXP | Điểm kinh nghiệm — đủ thì lên cấp |
| DPS | Sát thương mỗi giây — thước đo "mạnh" trong combat |
| Scope creep | Bệnh "thêm tính năng mãi không dừng" — nguyên nhân số 1 khiến game solo chết |
| Data-driven | Mọi con số nằm trong file config, đổi số không cần sửa code |
| Draw call | Một lần GPU vẽ — càng ít càng mượt (trần mobile ~80–100) |
| Prestige | Cơ chế "chơi lại từ đầu nhưng mạnh hơn" — để sau Beta mới tính |
| Migration (save) | Code chuyển file save cũ sang định dạng mới khi update game |

---

*Hết tài liệu. File này là "hiến pháp cơ chế" của INFINIA — mọi quyết định cơ chế sau này đối chiếu vào đây. Sửa đổi phải ghi lý do và ngày sửa.*
