# KẾ HOẠCH PHÁT TRIỂN DỰ ÁN INFINIA

*Kế hoạch chi tiết, khoa học, hợp lý — viết ngày 2026-10-06.*
*Đối tượng: Hoàng (ra quyết định sản phẩm) + Devin (AI coding agent) + Thunder (AI trợ lý).*

**Đọc cùng:** [CO_CHE_GAME.md](CO_CHE_GAME.md) (cơ chế — "hiến pháp cơ chế") ·
[COT_TRUYEN_VA_LAU_DAI.md](COT_TRUYEN_VA_LAU_DAI.md) (cốt truyện — "linh hồn") ·
[research/game-vo-han](../../research/game-vo-han/00-INDEX.md) (bài học tránh "9 năm") ·
[research/game-dev-library](../../research/game-dev-library/00-INDEX.md) (thư viện làm game).

**Quy ước trong tài liệu này:** mọi con số thời gian/chi phí đều là **ước tính** (ghi rõ), trừ khi ghi "đã kiểm chứng". Mọi mốc thời gian đều có cơ sở tham khảo ở mục 4.6.

---

## 1. Tầm nhìn & mục tiêu SMART

### Tầm nhìn (1 câu)
> INFINIA là game 3D thế giới mở bối cảnh làng quê Việt Nam, nơi người chơi xây làng — kết bạn dân làng — đánh quái bảo vệ làng — tích lũy Năng lượng Vô Hạn (∞), một game **chơi 10 phút vẫn vui, chơi 1 năm vẫn còn việc làm**, do team 1 người + AI phát triển và phát hành.

### Mục tiêu SMART theo horizon

| Horizon | Mục tiêu (Specific + Measurable) | Achievable? | Relevant? | Time-bound |
|---|---|---|---|---|
| **3 tháng** (đến ~06/01/2027) | MVP web chơi được: **10 người lạ** chơi thử, **≥70% lên LV.2 trong 5 phút**, **≥70% trả lời đúng "∞ để làm gì"**, 0 crash mất save | Có — prototype đã chạy, chỉ thêm ~6 tính năng | Khóa core loop trước khi đổ thêm công | 06/01/2027 |
| **6 tháng** (đến ~06/04/2027) | Alpha: 30–50 tester, **thời gian chơi trung bình mỗi session ≥15 phút**, D7 ≥20% (cohort ≥20 người), đủ 3 trụ cột Khám phá→Chiến đấu→Xây dựng | Có — nếu MVP pass gate | Mở rộng từ cái đã chứng minh vui | 06/04/2027 |
| **12 tháng** (đến ~06/10/2027) | Beta public trên web (itch.io): **500+ lượt chơi**, D7 ≥15%, D30 ≥5%, 0 bug mất save, quyết định GO/NO-GO lên mobile store | Có — nếu Alpha pass gate | Ra mắt thật, có số liệu thật | 06/10/2027 |

*Ghi chú: các ngưỡng retention (D7 ≥15–20%) là ước tính mục tiêu nội bộ cho cohort nhỏ, không phải benchmark ngành — với game mới chưa marketing, con số tuyệt đối ít ý nghĩa bằng **xu hướng cải thiện qua các bản**.*

---

## 2. Baseline hiện tại — prototype v1 có gì, còn thiếu gì

Đối chiếu prototype (`~/workspace/infinia/`, Three.js, đã kiểm chứng render thật ngày 06/10/2026) với CO_CHE_GAME:

### 2.1. Đã có (điểm xuất phát)

| Hạng mục | Tình trạng v1 |
|---|---|
| Địa hình đồi núi procedural + màu theo độ cao | ✅ Chạy tốt |
| ~150 cây (InstancedMesh), 6 nhà làng, mây, sương mù, bóng đổ | ✅ Chạy tốt |
| Player capsule + camera thứ 3 + WASD/mũi tên + kéo chuột xoay cam | ✅ Chạy tốt |
| Joystick ảo mobile (hiện trên thiết bị cảm ứng) | ✅ Có, chưa test tay trên điện thoại thật |
| 20 NPC "người dân" state machine idle/walk, tránh dốc, nhãn `ID(x,0,z,n)` | ✅ Chạy tốt (đúng bug game gốc đã tránh) |
| Va chạm tròn (nhà/cây/biên map) | ✅ Có |
| HUD: ∞ đếm mỗi giây, LV.1, thanh HP/MP, FPS, nút Inventory/Status/Control (placeholder), Fly, Debug | ✅ Chạy tốt |
| Chế độ bay (Space lên / C xuống) | ✅ Có |

### 2.2. Còn thiếu (theo thứ tự ưu tiên MVP)

| # | Thiếu | Thuộc phase | Ghi chú |
|---|---|---|---|
| 1 | NPC có tên + hội thoại + giao quest | MVP | Trưởng làng Cụ Chánh Tín (theo COT_TRUYEN) |
| 2 | Quái + combat (nút Đánh, auto-attack, quái chết rơi XP/∞) | MVP | 3 con Cỏ Dại Quái đứng yên gần cổng làng |
| 3 | Thanh EXP + lên cấp (công thức `floor(50×L^1.6)`) | MVP | LV.2 trong 5 phút đầu |
| 4 | Save/load localStorage (2 slot luân phiên) + autosave 60s | MVP | Ưu tiên #1 chống mất dữ liệu |
| 5 | ∞ có ý nghĩa: cổng Rừng 500∞ hiện tiến trình | MVP | Tạo "khát khao", chưa mở được |
| 6 | Dấu "!" trên đầu NPC, flow 5 phút đầu theo kịch bản | MVP | Tutorial không lời dài dòng |
| 7 | Tách module + `BALANCE.js` (Luật 1, 2 của CO_CHE_GAME) | Phase 0 | Nợ kỹ thuật phải trả trước khi thêm code |
| 8 | Test tự động cho 6 cơ chế (Luật 5) | MVP→Alpha | Devin viết, Thunder kiểm chứng mẫu |

**Kết luận baseline:** v1 là "thế giới đẹp nhưng chưa có game" — đúng như phân tích về Vô Hạn gốc (công cụ/world tốt, core loop chưa có). Mọi việc từ nay phải phục vụ câu hỏi: *"người chơi làm gì trong 5 phút đầu và vì sao họ muốn chơi tiếp?"*

---

## 3. Nguyên tắc khoa học của kế hoạch

### 3.1. Chống scope creep — 3 lớp phòng thủ (bài học Vô Hạn 9 năm)

| Lớp | Quy tắc | Ai thực thi |
|---|---|---|
| **1. Định nghĩa "xong"** | Mỗi phase/milestone có checklist nghiệm thu viết TRƯỚC khi code; "xong" = tick hết checklist, không phải "thấy ổn" | Hoàng viết, Devin thực thi |
| **2. Ba câu hỏi cắt** (từ research) | Thêm tính năng mới phải qua: (1) Không có nó game có chơi được không? → được thì cắt. (2) Nó có làm 30 phút đầu vui hơn không? → không thì để phase sau. (3) Có game thành công nào sống khỏe mà không có nó? → có thì cắt. | Hoàng hỏi, Devin trả lời |
| **3. Quy tắc 2 vòng** | Tính năng sau 2 vòng sửa vẫn chưa đạt → dừng/cắt/đơn giản hóa, không vòng 3 (vấn đề nằm ở thiết kế, không phải code) | Hoàng quyết |

### 3.2. Decision gate giữa các phase — không tự động đi tiếp

Mỗi phase kết thúc bằng một **cổng quyết định** với tiêu chí PASS/FAIL đo được (chi tiết ở mục 4). Nguyên tắc:

- **Không đạt gate → không sang phase tiếp theo.** Không có "làm song song cho nhanh".
- Gate fail lần 1 → được 1 vòng sửa duy nhất (tối đa 2 tuần).
- Gate fail lần 2 → **dừng hoặc pivot**, không đổ thêm công. Dừng sớm là thắng (xem mục 4.5).

### 3.3. Đo lường trung thực — không tự lừa mình

Lấy từ nguyên tắc lesson flow của Hoàng (đo lường trung thực, cấm XP/streak/điểm % làm thước đo tiến bộ) và áp vào dự án:

| Được dùng | Không được dùng |
|---|---|
| % người chơi lạ hoàn thành 5 phút đầu | "Devin báo xong 90%" (chỉ tin checklist nghiệm thu) |
| Thời gian chơi trung bình/session (đo thật) | Số giờ Devin đã code (không liên quan đến vui) |
| Số bug/100 phút chơi | Số tính năng đã thêm (nhiều ≠ tốt) |
| Retention D1/D7 trên cohort thật | Lượt tải/view (ảo, không nói lên game có vui không) |
| Câu trả lời của người chơi ("∞ để làm gì?") | Cảm giác chủ quan của người làm ra game |

**Luật:** mọi con số báo cáo phải ghi rõ **đo trên bao nhiêu người, đo khi nào, đo bằng công cụ gì**. Số không ghi 3 yếu tố này = số bịa.

### 3.4. Nguyên tắc làm việc với AI agent (từ research)

- Devin là "dev không biết mệt nhưng không biết điểm dừng" → mọi task phải có checklist nghiệm thu + deadline.
- **Cấm refactor khi code đang chạy tốt** ("chạy được thì không đụng").
- Mọi tính năng ngoài milestone phải được Hoàng duyệt **bằng văn bản** (ghi vào decision log).
- 5 luật kiến trúc từ CO_CHE_GAME (data-driven, module tách rời, performance budget, content pipeline, test tự động) là **luật bắt buộc**, không phải gợi ý.

---
## 4. Roadmap chi tiết theo phase

### 4.1. Tổng quan 5 phase

```
Phase 0 (1–2 tuần) → MVP (6 tuần) → Alpha (10–12 tuần) → Beta (12–16 tuần) → Launch
   │                    │               │                   │                  │
   Chốt quyết      5 phút chơi    10 giờ chơi      100 giờ giữ chân    Public itch.io
   định + setup    được           được             được                + GO/NO-GO mobile
```

*Tổng ước tính đến Beta: 7–9 tháng (ước tính, xem cơ sở ở mục 4.6). Ngắn hơn Stardew (4,5 năm) vì: (a) scope nhỏ hơn nhiều, (b) AI code nhanh hơn người ở khâu tay chân, (c) prototype đã có sẵn.*

### 4.2. Phase 0 — Chốt quyết định + setup nền (1–2 tuần, ước tính)

**Mục tiêu:** không còn quyết định treo nào; nền kỹ thuật sạch để Devin code tiếp không phải đập đi.

**Scope IN:**
1. Hoàng chốt 10 quyết định trong CO_CHE_GAME mục 9 (ghi vào decision log, mục 10) — **bắt buộc xong trong tuần 1**
2. Hoàng chốt 10 quyết định trong COT_TRUYEN_VA_LAU_DAI mục 7 (tone truyện, tên An, Thầy Ba Hò...) — **bắt buộc xong trong tuần 1**
3. Setup: Git repo riêng `infinia` (GitHub), cấu trúc thư mục theo Luật 2 (CO_CHE_GAME 7.2), file `src/config/BALANCE.js` với số liệu MVP
4. Tách `app.js` hiện tại thành module (world/terrain.js, entities/npc.js, entities/player.js, ui/hud.js...) — refactor duy nhất được phép
5. Viết test tự động đầu tiên: NPC không kẹt (thả 30 NPC 5 phút, assert 0 kẹt)

**Scope OUT:** mọi tính năng gameplay mới; art mới; âm thanh.

**Deliverable:** repo có cấu trúc module + BALANCE.js + 1 test xanh + file DECISIONS.md có 20 quyết định đã chốt.

**Gate 0 (PASS/FAIL):**
- [ ] 20/20 quyết định đã chốt bằng văn bản
- [ ] Game chạy lại sau refactor, không regression (so với screenshot v1)
- [ ] Test NPC-không-kẹt pass

### 4.3. MVP — "vòng lặp 5 phút chạy được" (6 tuần, ước tính)

**Mục tiêu:** người lạ mở game → 5 phút → lên LV.2 → hiểu "∞ để làm gì" → tắt/mở lại còn nguyên.

**Scope IN** (đúng CO_CHE_GAME 8.1, thứ tự ưu tiên):
1. Save/load localStorage 2 slot + autosave 60s (làm TRƯỚC — chống mất dữ liệu)
2. NPC Cụ Chánh Tín (trưởng làng): đứng ở cổng làng, dấu "!" trên đầu, hội thoại 3 câu (lời thoại từ COT_TRUYEN cutscene mở đầu), giao quest "đánh 3 Cỏ Dại Quái"
3. 3 con Cỏ Dại Quái gần cổng làng: HP 60, đứng yên/loanh quanh, đánh lại yếu (ATK 3)
4. Nút "Đánh" + auto-attack hỗ trợ; quái chết → rơi XP + 5∞ + hiệu ứng ngã đơn giản
5. Thanh EXP + lên LV.2 (công thức `floor(50×L^1.6)`): màn hình sáng, HP/MP hồi đầy
6. Cổng Rừng: hiện "500∞" + thanh tiến trình (chưa mở được — tạo khát khao)
7. Flow 5 phút đầu đúng kịch bản CO_CHE_GAME 2.3 (spawn → "!" → đánh quái → LV.2 → trả quest)
8. Test tự động cho 6 cơ chế (CO_CHE_GAME 7.5): NPC, quái, combat, XP, save, performance

**Scope OUT (cấm đụng):** Né (LV.2 mới mở nhưng MVP chỉ cần nút Đánh — né để Alpha), inventory, boss, vùng Rừng mở được, nhạc, nhiều loại quái, multiplayer, crafting, pet (xem danh sách cắt bỏ CO_CHE_GAME 8.4).

**Deliverable:** bản web public (link như prototype hiện tại) + video 2 phút quay 5 phút đầu.

**Gate MVP (PASS/FAIL) — đo trên ≥10 người lạ, chưa từng thấy game:**
- [ ] ≥70% lên LV.2 trong 5 phút (đo bằng log)
- [ ] ≥70% trả lời đúng "∞ để làm gì" (hỏi sau khi chơi)
- [ ] ≥70% nói "muốn chơi tiếp" (1 câu hỏi duy nhất, không hỏi dài)
- [ ] 0 crash, 0 mất save trong 10 session
- [ ] FPS ≥30 trên điện thoại tầm trung (test trên 1 máy thật)

*Gate fail lần 1 → 1 vòng sửa tối đa 2 tuần. Fail lần 2 → DỪNG hoặc pivot concept (xem 4.5).*

### 4.4. Alpha — "game chơi được 10 giờ" (10–12 tuần, ước tính)

**Mục tiêu:** 3 trụ cột Khám phá → Chiến đấu → Xây dựng đều chạy; người chơi có lý do quay lại ngày hôm sau.

**Scope IN** (CO_CHE_GAME 8.2):
1. Combat đầy đủ: nút Né (LV.2), 1 kỹ năng (LV.8), 3 loại quái vùng Làng, quái có chase/attack/return + quy tắc chống kẹt
2. Inventory 20 ô: nhặt/mặc/dùng/bán (4 loại vật phẩm: vũ khí/giáp/thuốc/nguyên liệu)
3. Bảng việc làng (đình làng): 10 việc nhỏ + 3 việc lớn, 5 NPC có tên (Cụ Chánh Tín, Bà Lụa, Ông Đồ Nho, Chú Sáu Búa, Cô Lan Thảo — theo COT_TRUYEN)
4. Vùng Rừng mở được (500∞): quái mới, 2 địa điểm khám phá, Thuồng Luồng xuất hiện (chưa đánh — theo truyện C2)
5. Nâng làng cấp 2 (2.000∞): 2 nhà mới mọc lên
6. Boss Cây Cổ Thụ Giận Dữ (bản đơn giản: 3 đòn theo bài — quật cành / gọi 3 quái con / nghỉ 5s)
7. Điểm kỹ năng từ LV.5 + hệ quà tặng NPC bản tối giản (3 mốc thân thiết)
8. Offline earnings idle: mở game sau 8 tiếng nhận ∞ tích lũy (trần 8 tiếng)

**Scope OUT:** vùng Hang Động/Núi Tuyết, nâng làng cấp 3, bay tự do, lịch sinh hoạt NPC, lễ hội, tower defense, multiplayer.

**Deliverable:** bản Alpha cho 30–50 tester (link web + form feedback).

**Gate Alpha:**
- [ ] Thời gian chơi trung bình/session ≥15 phút (cohort ≥20 người)
- [ ] D1 ≥40%, D7 ≥20% (cohort ≥20 người, đo 2 tuần)
- [ ] ≥60% tester đánh boss Cây Cổ Thụ ít nhất 1 lần
- [ ] 0 bug mất save; <5 bug/100 giờ chơi
- [ ] Performance: draw calls ≤80, FPS ≥30 trên máy tầm trung

### 4.5. Beta — "game giữ chân 100 giờ" (12–16 tuần, ước tính)

**Mục tiêu:** đủ nội dung cho 100 giờ; sẵn sàng public.

**Scope IN** (CO_CHE_GAME 8.3):
1. Vùng Hang Động (5.000∞) + Núi Tuyết (25.000∞), tổng 3 boss (Cây Cổ Thụ, Thuồng Luồng Đen, Kẻ Nuốt Dòng — theo COT_TRUYEN 3 chương)
2. Nâng làng cấp 3, NPC lịch ngày/đêm đơn giản (đèn sáng/tắt), lễ hội Tết + Trung Thu (mỗi lễ 1 quest + 1 trang trí)
3. Bay tự do (LV.25), túi 40 ô, độ hiếm Tím, hệ danh hiệu + skin ∞
4. "Sổ làng" (sưu tầm 4 bộ), relationship 5 mốc (theo COT_TRUYEN 2.3)
5. Polish mobile-web: cài đặt đồ họa 3 mức, Việt hóa 100%, tối ưu pin
6. Chừa sẵn vị trí cổng/tường làng cho tower defense tương lai (không làm chế độ)

**Scope OUT:** multiplayer, Kiếp mới (prestige — để sau launch), modding, lồng tiếng.

**Deliverable:** bản Beta public trên itch.io + trang giới thiệu tiếng Việt.

**Gate Beta → Launch:**
- [ ] 500+ lượt chơi trong tháng đầu
- [ ] D7 ≥15%, D30 ≥5%
- [ ] ≥50% người chơi mở được vùng Rừng (đi qua được "khúc cua" 500∞)
- [ ] 0 bug mất save trên 500 session
- [ ] Quyết định GO/NO-GO mobile: chỉ GO nếu Beta đạt gate (quyết định #9 của Hoàng)

### 4.6. Cơ sở ước tính timeline (đã kiểm chứng)

| Case tham khảo | Team | Scope | Thời gian | Nguồn |
|---|---|---|---|---|
| Vampire Survivors | 1 người (Luca Galante) | 2D, 1 cơ chế cốt lõi, asset mua sẵn (£1.100) | ~1 năm đến Early Access (12/2021) | Wikipedia; PC Gamer 2022 (phỏng vấn) |
| A Short Hike | 1 người (Adam Robinson-Yu) | **3D low-poly**, khám phá, 2–3 giờ chơi | ~8–9 tháng (bản Humble 4 tháng + Steam 4–5 tháng) | MCV/Develop (phỏng vấn tác giả); Wikipedia; IGF 2020 Grand Prize |
| Undertale | ~1 người (Toby Fox; thuê artist) | 2D RPG, GameMaker: Studio | ~2,7 năm (32 tháng): Kickstarter 6/2013 → release 15/9/2015 | Wikipedia; Wikiversity (Toby Fox) |
| Cave Story | 1 người (Daisuke Amaya), part-time | 2D platform-adventure, engine tự viết | ~5 năm (ước tính 1999/2000 → release freeware 20/12/2004) | Wikipedia (Daisuke Amaya); Cave Story Wiki |
| Stardew Valley | 1 người (Eric Barone) | 2D pixel-art, nông trại RPG | ~4,5 năm, 10–12h/ngày (2012→26/2/2016) | Wikipedia (Eric Barone) |
| Hollow Knight | 3 người (Team Cherry) | 2D hand-drawn, Unity (đổi từ Stencyl giữa chừng) | ~3 năm (giữa 2014 → 24/2/2017) | Wikipedia; VintageIsTheNewOld |
| Tunic | Bắt đầu solo (Andrew Shouldice) → có cộng sự + publisher | **3D isometric low-poly**, Unity | ~7 năm (2015 → 16/3/2022) — cảnh báo iteration vô định | Wikipedia; MobileSyrup 2022 (phỏng vấn); Stuff.tv |
| Vô Hạn (anti-pattern) | 1 người | 3D open-world, tự code engine trên GameMaker | **9+ năm, chưa release** | Bài đăng Facebook của dev, 12/2025 |

*Bài học tổng hợp từ 7 case: (1) 3D solo khả thi nhưng CHỈ khi scope nhỏ cố ý — A Short Hike (8–9 tháng, game 2–3 giờ) là proof tốt nhất; Tunic (7 năm, bắt đầu solo) là cảnh báo về iteration "xây-đập-xây lại" vô định. (2) Không ai làm 3D open-world solo trong thời gian ngắn mà thành công — mọi case 3D thành công đều gọn nhẹ. (3) AI agent thay được "code tay" nhưng KHÔNG thay được iteration thiết kế — đây mới là phần ngốn thời gian thật (Stardew redo nhiều lần; Tunic xây-đập-xây lại). (4) Đổi engine giữa chừng là rủi ro lớn (Hollow Knight: Stencyl→Unity) — chốt engine từ đầu.*

*Suy ra cho INFINIA: prototype v1 (thế giới + NPC + HUD) đã tương đương "tháng 0–2" của các case trên. MVP 6 tuần là ước tính dựa trên: (a) chỉ thêm 8 hạng mục vào nền có sẵn, (b) AI code nhanh khâu tay chân nhưng iteration thiết kế vẫn tốn thời gian thật (bài học Tunic/Stardew: redo nhiều lần). Alpha/Beta dài hơn vì nội dung (quest, hội thoại tiếng Việt, boss) là việc "người" không AI hóa hết được.*

### 4.7. Điểm DỪNG an toàn — phase nào dừng cũng không phí công

| Dừng sau phase | Cái giữ lại được | Tổn thất |
|---|---|---|
| **Phase 0** | 20 quyết định đã chốt + repo sạch + BALANCE.js | ~2 tuần — rẻ nhất |
| **MVP** (gate fail 2 lần) | Prototype + core loop đã test + bài học "concept này không vui" | ~2 tháng — chấp nhận được, pivot concept khác vẫn dùng được engine/NPC |
| **Alpha** (gate fail) | Game 10 giờ + 50 tester + data retention | ~5 tháng — dừng để làm game khác, hoặc thu hẹp thành game web nhỏ |
| **Beta** (gate fail / NO-GO mobile) | Game public hoàn chỉnh trên web, 500+ người chơi | ~8 tháng — vẫn là portfolio/sản phẩm thật, không phải "9 năm chưa xong" |

*Nguyên tắc: càng dừng sớm càng rẻ. Gate tồn tại để bảo vệ Hoàng khỏi việc đổ thêm 5 tháng vào thứ đã chứng minh không vui.*

---
## 5. Kế hoạch tuần cho MVP (6 tuần)

*Giả định: Devin làm việc theo task, Hoàng dành ~30–45 phút/ngày để test + quyết định (ước tính). Mỗi tuần kết thúc bằng bản chơi được + checklist nghiệm thu.*

### Tuần 1 — Phase 0: chốt quyết định + dọn nền kỹ thuật

| Việc | Ai làm | Xong thì kiểm chứng thế nào |
|---|---|---|
| Hoàng đọc và chốt 10 quyết định (CO_CHE_GAME §9) + 10 quyết định truyện (COT_TRUYEN §7) | Hoàng | File DECISIONS.md có 20 dòng "đã chốt", mỗi dòng có lý do |
| Devin: tạo repo `infinia`, tách `app.js` thành module theo Luật 2, tạo `src/config/BALANCE.js` với số MVP | Devin | Game chạy lại sau refactor, Thunder so screenshot với v1: không regression |
| Devin: viết test NPC-không-kẹt đầu tiên (thả 30 NPC 5 phút) | Devin | Test xanh |
| Thunder: rà soát BALANCE.js — mọi con số MVP có mặt, không số nào còn hardcode | Thunder | Checklist số liệu MVP |

**Nghiệm thu tuần 1:** 20 quyết định đã chốt + game chạy + test xanh. *Chưa chốt quyết định → chưa sang tuần 2.*

### Tuần 2 — NPC trưởng làng + quest đầu tiên

| Việc | Ai làm | Kiểm chứng |
|---|---|---|
| Devin: NPC Cụ Chánh Tín (đứng cổng làng, dấu "!" trên đầu) + hội thoại 3 câu (lời thoại Hoàng duyệt từ COT_TRUYEN cutscene mở đầu) + hệ nhận/trả quest (dạng data, theo COT_TRUYEN ghi chú dev) | Devin | Hoàng bấm nói chuyện được, nhận quest "đánh 3 Cỏ Dại Quái", UI hiện tiến trình 0/3 |
| Devin: 3 con Cỏ Dại Quái gần cổng làng (HP 60, đứng yên/loanh quanh, đánh lại ATK 3) | Devin | Quái hiện đúng chỗ, không kẹt trong cây/nhà |
| Hoàng: viết/duyệt lời thoại tiếng Việt cho Cụ Chánh Tín (tối đa 5 câu) | Hoàng | Đọc to lên thấy tự nhiên, đúng chất "ông trưởng làng" |
| Thunder: test quái không kẹt tường (lùa vào góc 5 lần) | Thunder | 5/5 tự thoát trong 5 giây |

**Nghiệm thu tuần 2:** đi tới Cụ Chánh Tín → nhận quest → thấy 3 con quái → quest đếm 0/3.

### Tuần 3 — Combat

| Việc | Ai làm | Kiểm chứng |
|---|---|---|
| Devin: nút "Đánh" (góc phải, to) + auto-attack hỗ trợ (bật/tắt trong Control) + công thức sát thương `ATK×(100/(100+DEF))×rand(0.9–1.1)` đọc từ BALANCE.js | Devin | Player LV.1 (ATK 8) đánh quái HP 60 chết trong 7–8 đòn (đúng công thức) |
| Devin: quái chết → ngã + rơi XP/∞ bay vào người + quái `stunned` 1s khi trúng đòn | Devin | Nhìn thấy rõ quái chết, số XP/∞ tăng |
| Devin: quái đánh lại (mỗi 1.5s khi gần 2m), player mất HP, HP về 0 → hồi sinh ở làng (không mất gì — luật cozy) | Devin | Chết thử 3 lần: luôn hồi sinh ở làng, ∞ còn nguyên |
| Hoàng: chơi thử 10 phút, chỉnh "cảm giác" (đòn đánh có đã không) | Hoàng | Ghi 3 điều thích + 3 điều khó chịu |

**Nghiệm thu tuần 3:** đánh chết 3 con quái bằng nút Đánh, không crash, chết hồi sinh đúng luật.

### Tuần 4 — EXP, lên cấp, save/load

| Việc | Ai làm | Kiểm chứng |
|---|---|---|
| Devin: thanh EXP + lên LV.2 (`floor(50×L^1.6)`), hiệu ứng sáng + HP/MP hồi đầy + thông báo "Lên cấp 2!" | Devin | Đánh 3 quái (XP ~30) + trả quest (XP ~40) → đủ 50 XP lên LV.2 trong ~4 phút |
| Devin: save/load localStorage 2 slot luân phiên + autosave 60s + migration version | Devin | Test 20 lần tắt/mở: 20/20 còn nguyên (theo CO_CHE_GAME 7.5) |
| Devin: ∞ có ý nghĩa đầu tiên — cổng Rừng hiện "500∞" + thanh tiến trình theo số ∞ hiện có | Devin | Đứng trước cổng thấy tiến trình tăng khi nhặt ∞ |
| Thunder: kiểm tra công thức XP ở LV.1→5 bằng giả lập nhanh | Thunder | Số liệu khớp bảng CO_CHE_GAME 3.2 |

**Nghiệm thu tuần 4:** chơi 5 phút → LV.2 → tắt tab mở lại → còn LV.2 + ∞.

### Tuần 5 — Flow 5 phút đầu + polish tutorial

| Việc | Ai làm | Kiểm chứng |
|---|---|---|
| Devin: dựng flow đúng kịch bản CO_CHE_GAME 2.3 (spawn ở cổng làng, camera quay về làng, Cụ Chánh Tín có "!" trong tầm nhìn) | Devin | Người mới không cần hướng dẫn vẫn đi đúng |
| Devin: bảng gợi ý điều khiển 10 giây đầu (tự ẩn), nút Đánh nhấp nháy khi gần quái lần đầu | Devin | Không có chữ hướng dẫn dài dòng |
| Hoàng: chơi thử toàn bộ 5 phút, ghi lại chỗ nào khựng/khó hiểu | Hoàng | Danh sách ≤5 điểm cần sửa |
| Devin: sửa theo feedback Hoàng (vòng 1) | Devin | Chơi lại, điểm khó chịu giảm |

**Nghiệm thu tuần 5:** Hoàng chơi từ đầu đến LV.2 mà không cần hỏi ai, dưới 6 phút.

### Tuần 6 — Playtest người lạ + gate MVP

| Việc | Ai làm | Kiểm chứng |
|---|---|---|
| Hoàng: mời 10 người lạ (bạn bè/người quen chưa từng thấy game), mỗi người chơi 5–10 phút | Hoàng | Ghi lại: có lên LV.2 không, trả lời "∞ để làm gì", có muốn chơi tiếp không |
| Thunder: tổng hợp kết quả vào bảng gate MVP (mục 4.3) | Thunder | Tính % cho 3 tiêu chí |
| Devin: fix bug phát hiện trong playtest (tối đa 1 vòng) | Devin | Bug list đóng hết |
| Hoàng + Thunder: họp gate — PASS sang Alpha, hay 1 vòng sửa 2 tuần, hay DỪNG | Hoàng quyết | Ghi quyết định vào decision log |

**Nghiệm thu tuần 6:** bảng gate MVP đã điền đủ số liệu + quyết định văn bản.

---

## 6. Phân công RACI

*R = Responsible (làm), A = Accountable (chịu trách nhiệm cuối), C = Consulted (hỏi ý kiến), I = Informed (được báo).*

| Công việc | Hoàng | Devin | Thunder |
|---|---|---|---|
| Chốt quyết định sản phẩm/scope (20 quyết định) | **A/R** | I | C |
| Viết/duyệt nội dung tiếng Việt (hội thoại, quest, tên) | **A/R** | I | C |
| Code tính năng theo milestone | A | **R** | I |
| Viết test tự động cho cơ chế | A | **R** | C |
| Kiểm chứng checklist nghiệm thu (chơi thử, đo số) | **A/R** | I | **R** (hỗ trợ đo) |
| Tuyển người chơi thử + thu thập feedback | **A/R** | — | C (thiết kế form) |
| Quyết định PASS/FAIL gate, DỪNG/pivot | **A/R** | I | C (trình số liệu) |
| Ghi decision log | **A** | R (ghi nháp) | C |
| Research kỹ thuật/thị trường | I | C | **A/R** |
| Quản lý repo, backup source | A | **R** | C |
| Quyết định thêm tính năng mới ngoài scope | **A/R** | — (đề xuất) | C |

**Nguyên tắc đọc bảng:** chỉ có Hoàng được ra quyết định sản phẩm; Devin không tự thêm tính năng; Thunder không quyết thay Hoàng — chỉ trình số liệu và khuyến nghị.

---

## 7. Risk register — rủi ro + giảm thiểu + dấu hiệu cảnh báo sớm

| # | Rủi ro | Mức độ | Giảm thiểu | Dấu hiệu cảnh báo sớm |
|---|---|---|---|---|
| R1 | **Scope creep** — Hoàng/Devin thêm tính năng ngoài milestone | 🔴 Cao | 3 lớp phòng thủ (mục 3.1); tính năng mới phải qua 3 câu hỏi + ghi decision log | Devin báo "làm thêm cái này cho hay"; milestone phình quá 20% thời gian |
| R2 | **Devin code chạy nhưng không vui** — đúng spec, sai cảm giác | 🔴 Cao | Playtest người lạ mỗi 4–6 tuần (không tin cảm giác người làm ra); Hoàng chơi thử mỗi tuần | Hoàng thấy "chơi được nhưng chán" 2 tuần liên tiếp |
| R3 | **Mất động lực** — Hoàng chán sau 2–3 tháng chưa có người chơi | 🟡 Trung bình | Milestone ngắn (thấy tiến triển mỗi tuần); playtest sớm để có phản hồi tích cực; lễ kỷ niệm mỗi gate pass | 2 tuần không muốn test/chơi thử game của mình |
| R4 | **Nợ kỹ thuật** — code Devin rối dần, sửa 1 chỗ vỡ 3 chỗ | 🟡 Trung bình | 5 luật kiến trúc (mục 3.4); cấm refactor vô cớ NHƯNG bắt refactor khi thêm nội dung mới phải sửa file logic (Luật 4) | Thêm 1 con quái mà phải sửa >1 file logic |
| R5 | **Mất source code / mất save người chơi** | 🟡 Trung bình | Git + push sau mỗi milestone (ít nhất 2 nơi: GitHub + 1 bản local); save 2 slot luân phiên (đã thiết kế) | Devin làm việc mà chưa push quá 3 ngày |
| R6 | **Hiệu năng mobile** — 3D nặng, máy yếu chơi không nổi | 🟡 Trung bình | Performance budget từ MVP (draw calls ≤60, FPS ≥30); test trên 1 máy tầm trung thật từ tuần 1 | FPS <25 trên máy test 2 tuần liên tiếp |
| R7 | **Chi phí phát sinh** — cần mua asset/thuê việc vượt ngân sách 0đ | 🟢 Thấp | Mọi chi tiêu >500k VND phải được Hoàng duyệt trước; ưu tiên asset miễn phí/MIT (đã có danh sách 13 repo) | Devin đề xuất mua asset chưa có trong danh sách duyệt |
| R8 | **Pháp lý bản quyền** — dùng nhầm asset/nhạc không rõ license | 🟢 Thấp | Chỉ dùng asset có license rõ (MIT/CC0/public domain); ghi credit đầy đủ; tên INFINIA tra cứu trademark trước khi launch mobile | Asset nào không ghi được nguồn → không dùng |
| R9 | **Devin "ảo tưởng tiến độ"** — báo 90% nhưng test crash | 🟡 Trung bình | Chỉ tin checklist nghiệm thu, không tin % tự báo (bệnh đã ghi trong research) | 2 lần liên tiếp Devin báo xong nhưng Hoàng test fail |
| R10 | **Phụ thuộc 1 AI agent** — Devin đổi policy/giá, mất context dài hạn | 🟢 Thấp | Decision log + tài liệu (3 file docs) là "bộ nhớ ngoài" — agent nào đọc cũng tiếp tục được; milestone ngắn nên context không quá dài | Decision log không được cập nhật quá 2 tuần |

---

## 8. Metrics & đo lường theo phase

### 8.1. Chỉ số theo phase (ngưỡng mục tiêu = ước tính nội bộ)

| Chỉ số | Cách đo | MVP (n=10) | Alpha (n=30–50) | Beta (public) |
|---|---|---|---|---|
| Hoàn thành 5 phút đầu (lên LV.2) | Log game | ≥70% | ≥80% | ≥80% |
| Hiểu "∞ để làm gì" | Hỏi 1 câu sau chơi | ≥70% | ≥80% | — (thay bằng mở cổng Rừng ≥50%) |
| "Muốn chơi tiếp" | Hỏi 1 câu | ≥70% | — | — |
| Thời gian/session trung bình | Log game | — | ≥15 phút | ≥20 phút |
| Retention D1 / D7 / D30 | Log (user id ẩn danh) | — | D1≥40%, D7≥20% | D7≥15%, D30≥5% |
| Crash / 100 session | Log lỗi | 0 | <2 | <1 |
| Mất save / 100 session | Log + báo cáo | 0 | 0 | 0 |
| Bug gameplay / 100 giờ chơi | Form báo lỗi | — | <5 | <2 |
| FPS tối thiểu (máy tầm trung) | Debug HUD | ≥30 | ≥30 | ≥30 |

### 8.2. Công cụ đo (giữ đơn giản theo phase)

| Phase | Công cụ | Chi phí (ước tính) |
|---|---|---|
| MVP | Google Form 3 câu + Devin ghi log đơn giản vào localStorage (Hoàng đọc tay) | 0đ |
| Alpha | Form + log có timestamp, Thunder tổng hợp bảng tuần | 0đ |
| Beta | Thêm analytics nhẹ tự viết (event: mở game, lên cấp, mở vùng, crash) gửi về endpoint miễn phí — KHÔNG dùng SDK nặng, KHÔNG thu thập thông tin cá nhân | 0đ (tự host hoặc dùng tier miễn phí) |

*Nguyên tắc privacy: chỉ log hành vi trong game (đã làm gì), không log thông tin cá nhân; ghi rõ trong game cho người chơi biết.*

### 8.3. Nghi thức đo lường

- **Cuối mỗi tuần:** Devin báo 3 số (tính năng xong checklist / bug mở / FPS-drawcalls-triangles trước-sau).
- **Cuối mỗi milestone:** Thunder tổng hợp 1 bảng metrics + so với ngưỡng gate.
- **Sau mỗi playtest:** form 3–5 câu, tối đa 2 phút điền — tôn trọng thời gian người test.

---

## 9. Ngân sách theo phase (ước tính, đã kiểm chứng mục có *)

| Hạng mục | Phase 0–Alpha | Beta | Launch mobile | Ghi chú |
|---|---|---|---|---|
| Engine Three.js / tooling | 0đ | 0đ | 0đ | Open source |
| Hosting bản web (itch.io) | 0đ | 0đ | 0đ | itch.io miễn phí |
| Tên miền (tùy chọn) | 0đ | ~300k VND/năm | ~300k VND/năm | Không bắt buộc |
| Tài khoản CH Play | — | — | **$25 một lần** * | Đã kiểm chứng (research file 09) |
| Tài khoản App Store | — | — | **$99/năm** * | Đã kiểm chứng; chỉ làm nếu Beta đạt gate |
| Asset pack (nếu cần) | 0đ (dùng repo MIT/CC0 đã liệt kê) | 0đ | Dự phòng ~1–3 triệu VND | Tham khảo Vampire Survivors: £1.100 (~35tr VND) cho full asset — INFINIA procedural nên rẻ hơn nhiều |
| Nhạc/âm thanh | 0đ (dùng CC0) | 0đ | Dự phòng ~1 triệu VND | |
| **Tổng tối thiểu** | **0đ** | **~0–300k VND** | **~600k–1,5tr VND** | Chưa tính công sức thời gian |

*Nguyên tắc: không chi tiền cho thứ chưa chứng minh cần thiết. Mọi khoản >500k VND cần Hoàng duyệt trước (R7).*

---

## 10. Decision log — nhật ký quyết định

*Ghi mọi quyết định sản phẩm/scope từ nay về sau. Devin ghi nháp, Hoàng duyệt. Khi Devin đề xuất trái với dòng đã ghi, Hoàng chỉ cần chỉ vào dòng đó.*

| Ngày | Quyết định | Lý do | Ai chốt | Trạng thái |
|---|---|---|---|---|
| 2026-10-06 | Đặt tên tiếng Anh: **INFINIA** | Ngắn, giữ chất "vô hạn" (∞), dễ làm thương hiệu | Hoàng (qua Thunder) | ✅ Đã chốt |
| 2026-10-06 | Prototype v1 = Three.js web, procedural 100% | Chơi được ngay, 0đ chi phí, kiểm chứng render thật | Hoàng (qua Thunder) | ✅ Đã chốt |
| 2026-10-06 | ∞ là tài nguyên meta vĩnh viễn, không pay-to-win | Luật sắt từ CO_CHE_GAME 5.3 | Hoàng | ✅ Đã chốt |
| 2026-10-06 | Cắt: 2 nhân vật cùng lúc, multiplayer, crafting, pet... | Danh sách cắt bỏ CO_CHE_GAME 8.4 | Hoàng | ✅ Đã chốt |
| 2026-10-06 | [Cơ chế #1] Combat: CÓ, bản đơn giản (1 nút đánh + 1 nút né) | Không combat thì 5 phút đầu không có gì làm | Hoàng | ✅ Đã chốt |
| 2026-10-06 | [Cơ chế #2] ∞ là tài nguyên meta vĩnh viễn, kiếm dần để mở khóa | ∞ trang trí → mất hook dài hạn | Hoàng | ✅ Đã chốt |
| 2026-10-06 | [Cơ chế #3] Không làm 2 nhân vật cùng lúc | Gấp đôi công sức, nguy cơ "vô hạn" thật | Hoàng | ✅ Đã chốt |
| 2026-10-06 | [Cơ chế #4] Giữ đồ họa procedural đến hết Alpha | Gameplay trước, đẹp sau; chưa thuê art sớm | Hoàng | ✅ Đã chốt |
| 2026-10-06 | [Cơ chế #5] Chống hack save: mã hóa nhẹ | Chống crack nặng đốt thời gian, làm game chậm | Hoàng | ✅ Đã chốt |
| 2026-10-06 | [Cơ chế #6] Tiền thật: sau Beta, chỉ bán cosmetic/∞ (không bán sức mạnh) | Bán sức mạnh = pay-to-win, mất uy tín | Hoàng | ✅ Đã chốt |
| 2026-10-06 | [Cơ chế #7] Ngôn ngữ: tiếng Việt 100% từ MVP | Game gốc để tiếng Anh lổn nhổn là điểm trừ | Hoàng | ✅ Đã chốt |
| 2026-10-06 | [Cơ chế #8] Level tối đa: 50 | Đủ cho 6–12 tháng; không giới hạn thì số liệu vỡ | Hoàng | ✅ Đã chốt |
| 2026-10-06 | [Cơ chế #9] Chuyển sang Unity/mobile thật sau khi MVP web được 10 người chơi thử xác nhận "vui" | Chuyển sớm = đốt công cho game chưa chắc vui | Hoàng | ✅ Đã chốt |
| 2026-10-06 | [Cơ chế #10] Chỉ Hoàng quyết định thêm tính năng mới, bằng văn bản | Ai cũng thêm → scope creep → 9 năm như game gốc | Hoàng | ✅ Đã chốt |
| 2026-10-06 | [Truyện #1] Tone: ấm áp làng quê, sử thi chỉ ở cao trào | "Tình làng nghĩa xóm" là fantasy cốt lõi | Hoàng | ✅ Đã chốt |
| 2026-10-06 | [Truyện #2] Giữ tên mặc định "An", cho người chơi tự đặt tên | Tăng gắn bó, code rẻ | Hoàng | ✅ Đã chốt |
| 2026-10-06 | [Truyện #3] Giữ chủ đề "người trẻ bỏ làng lên phố" | Chất liệu độc quyền của game Việt | Hoàng | ✅ Đã chốt |
| 2026-10-06 | [Truyện #4] Boss cuối: pha 1 đánh đã tay + pha 2 cảm xúc | Chỉ đánh thì mất khoảnh khắc đáng nhớ; chỉ cảm xúc thì bị chê nhạt | Hoàng | ✅ Đã chốt |
| 2026-10-06 | [Truyện #5] Giữ Thầy Ba Hò làm phản diện người (tay sai của Hư Vô) | Phản diện có mặt người khiến truyện sâu hơn | Hoàng | ✅ Đã chốt |
| 2026-10-06 | [Truyện #6] Giữ cả 2 lựa chọn kết cục (cảm hóa/kết liễu) | Tăng giá trị chơi lại | Hoàng | ✅ Đã chốt |
| 2026-10-06 | [Truyện #7] Tâm linh ở mức văn hóa dân gian nhẹ | Không mê tín nặng, không xúc phạm; giữ chất làng quê | Hoàng | ✅ Đã chốt |
| 2026-10-06 | [Truyện #8] Tiền thật: chỉ cosmetic + battle-pass mùa, không bán ∞/sức mạnh | Luật sắt chống pay-to-win | Hoàng | ✅ Đã chốt |
| 2026-10-06 | [Truyện #9] Tên "Xứ Vĩnh Lưu" chỉ dùng trong tài liệu/truyền thông, dân làng gọi "quê mình" | Không ép người chơi nhớ tên | Hoàng | ✅ Đã chốt |
| 2026-10-06 | [Truyện #10] Không multiplayer trước năm 2 (nếu có: chỉ thăm làng bạn bất đồng bộ) | Làm sớm = scope creep | Hoàng | ✅ Đã chốt |
| 2026-10-06 | Shop v3: đổi "Bùa gỗ +25 HP" thành "Bùa Mạch +25% ∞ rơi" | Thực thi luật sắt đã chốt "∞ không mua sức mạnh trực tiếp" (quyết định cơ chế #6) | Thunder (thực thi quyết định đã chốt của Hoàng) | ✅ Đã chốt |
| 2026-10-06 | ĐỔI quyết định cơ chế #4: ưu tiên nâng cấp đồ họa ngay từ prototype (thay vì chờ hết Alpha) | Hoàng muốn tập trung đồ họa; vẫn giữ procedural (không thuê art), chỉ nâng chất lượng procedural | Hoàng | ✅ Đã chốt |
| 2026-10-06 | CHỐT định vị 6–12 tháng: kịch bản B "Cozy Việt Nam đầu tiên trên portal" | Vừa làm vui vừa chuẩn tiêu chuẩn CrazyGames/Poki (file nhẹ, load <10s, mobile tốt); bản sắc Việt + battle pass mùa lễ làm vũ khí cạnh tranh | Hoàng | ✅ Đã chốt |
| 2026-10-06 | DUYỆT 8 luật từ bài học thất bại (L1–L8): 1 câu "xong" trước khi code; luôn có bản chơi được; mốc thời gian Alpha; 1 câu định vị; chơi được trong 60s; cấm loot box vĩnh viễn; giá cosmetic minh bạch; né sự kiện game lớn khi ra mắt | Rút từ Star Citizen/Vô Hạn/LawBreakers/Battlefront II/Titanfall 2 | Hoàng | ✅ Đã chốt |
| 2026-10-06 | CHỐT: vòng auto research + dev KHÔNG BAO GIỜ DỪNG | Xong việc là làm việc mới ngay (tự nối run, không chờ giờ hẹn); hết backlog thì tự research tạo backlog mới trong phạm vi kịch bản B; chỉ ngưng khi thật sự không còn việc gì làm được | Hoàng | ✅ Đã chốt |
| 2026-10-07 | CHỐT nguyên tắc mobile-first: game PHẢI chơi được trên điện thoại | Mobile là nền tảng chính (70% traffic game web); mọi tính năng mới phải chơi được bằng ngón tay cái trước; backlog mục Mobile M1–M5 | Hoàng | ✅ Đã chốt |
| 2026-10-07 | **PIVOT định hướng**: bỏ "cozy open-world trên portal", chuyển sang phương án C **"game Việt viral TikTok"** — game web tiếng Việt siêu nhẹ cho điện thoại phổ thông, nội dung làng quê làm meme TikTok/Facebook, kiếm tiền bằng quảng cáo + donate | Research sâu 2026-10-07 (3 mũi): portal thắng bằng game session ngắn không có cozy open-world nào trong top; open-world 3D là scope nguy hiểm nhất cho solo dev; Steam bão hòa (median $249/năm). Hoàng thấy hướng cũ "ko ổn" | Hoàng | ✅ Đã chốt |
| 2026-10-07 | **TẠM NGƯNG** hiệu lực các quyết định sản phẩm Phase 0 (cơ chế #1–#10, truyện #1–#10, định vị kịch bản B) — chờ định nghĩa lại theo core loop mới. GIỮ NGUYÊN: 8 luật L1–L8, 4 ủy quyền đứng, "chỉ Hoàng quyết thêm tính năng", cấm pay-to-win/cấm loot box | Pivot đổi sản phẩm; quyết định cũ gắn với game open-world cũ | Hoàng | ✅ Đã chốt |
| 2026-10-07 | **CHỐT core loop game mới: "Câu Cá Ao Làng"** — thả câu → chờ cá cắn → giật đúng lúc → dòng cá (đừng đứt dây) → săn cá khủng, bộ sưu tập + màn khoe. 2D canvas siêu nhẹ (<300KB), mobile-first màn dọc, tiếng Việt 100%. Dự án mới: `~/workspace/cau-ca-ao-lang/` (GAME.md). 5 loại cá slice: rô đồng, chép, trê, quả, Cụ Rùa Hồ (~2% cực hiếm, meme). NPC ông lão câu cá bình luận hài dân gian | Hoàng làm game designer chọn 1 trong 3 concept (Chợ Quê / Lùa Trâu / Câu Cá) | Hoàng | ✅ Đã chốt |
| 2026-10-07 | **HỦY pivot C, QUAY LẠI 1 game duy nhất: INFINIA làng 3D** — Hoàng: "nghiên cứu phát triển 1 game duy nhất", chọn game cũ. Dự án Câu Cá Ao Làng đã dọn vào trash. Kích hoạt LẠI toàn bộ quyết định Phase 0 + định vị kịch bản B "Cozy Việt Nam đầu tiên trên portal" (đã chốt 2026-10-06). Vòng auto-dev chạy lại cho game cũ | Hoàng thấy tách 2 game gây lẫn lộn | Hoàng | ✅ Đã chốt |
| 2026-10-07 | **CHỐT hướng đồ họa B: chịu file to để hết "khối"** — dùng model chi tiết + texture thật (thay vì low-poly). Chấp nhận file phình (~5–10MB), load chậm hơn, điện thoại yếu có thể lag. Nới lỏng ngân sách portal <2MB → mục tiêu mới <8MB + màn hình loading | Hoàng xem v9 thấy cây GLB low-poly vẫn như khối; vấn đề là art direction chứ không phải thiếu model | Hoàng | ✅ Đã chốt |
| 2026-10-07 | **Bối cảnh phải ra chất Việt Nam** — Hoàng: "bối cảnh hiện tại ko phải của VN". Làng hiện tại generic (cây thông, nhà chóp); thiếu lũy tre, ruộng lúa, ao sen, cổng làng, nhà ngói, trâu. Thêm backlog V1–V7 ưu tiên cao | G5B-c sửa thành "nhà ngói đỏ Việt Nam" bắt buộc | Hoàng | ✅ Đã chốt |
| _ghi tiếp..._ | | | | |

### Quy tắc dùng decision log
1. Quyết định chỉ có hiệu lực khi có đủ 4 cột (ngày/quyết định/lý do/ai chốt).
2. Muốn đổi quyết định đã chốt → ghi dòng mới nêu rõ "đổi quyết định ngày X", kèm lý do — không xóa dòng cũ.
3. Trước mỗi milestone, Devin đọc lại toàn bộ log và xác nhận không vi phạm dòng nào.

---

## Phụ lục A — Checklist khởi động Phase 0 (làm ngay tuần tới)

- [x] Hoàng đọc CO_CHE_GAME mục 9 và COT_TRUYEN_VA_LAU_DAI mục 7, chốt 20 quyết định (xong 2026-10-06, theo khuyến nghị)
- [ ] Tạo repo GitHub `infinia`, push code prototype hiện tại
- [ ] Tạo file DECISIONS.md (copy bảng mục 10) trong repo
- [ ] Devin tách module + tạo BALANCE.js (theo mục 5 tuần 1)
- [ ] Đặt lịch cố định: mỗi tuần 1 buổi Hoàng test 30 phút (ví dụ: tối Chủ nhật)
- [ ] Mời trước 3 người cho playtest tuần 6 (đừng để đến tuần 6 mới tìm)

## Phụ lục B — Từ điển rút gọn (thuật ngữ dùng trong kế hoạch)

| Thuật ngữ | Nghĩa nôm na |
|---|---|
| Milestone | Cột mốc: một chặng có đầu ra kiểm chứng được |
| Gate (PASS/FAIL) | Cổng quyết định: đạt tiêu chí mới được sang phase tiếp |
| Vertical slice | Một "lát cắt dọc": 5–15 phút gameplay hoàn chỉnh từ đầu đến cuối |
| Scope creep | Bệnh thêm tính năng mãi không dừng — nguyên nhân số 1 khiến game solo chết |
| RACI | Bảng phân công: ai làm (R), ai chịu trách nhiệm (A), hỏi ai (C), báo ai (I) |
| D1/D7/D30 | % người chơi quay lại sau 1/7/30 ngày |
| Pivot | Đổi hướng concept khi concept hiện tại đã chứng minh không vui |

---

*Hết kế hoạch. File này sống cùng dự án — mỗi gate review cập nhật một lần. Sửa đổi ghi vào decision log.*
