# CỐT TRUYỆN & CHIẾN LƯỢC CHƠI LÂU DÀI — INFINIA

*Tài liệu thiết kế "hồn" của game: truyện để người chơi thương, chiến lược để người chơi ở lại.*
*Viết ngày 2026-10-06. Đối tượng: Hoàng (ra quyết định) + AI coding agent (thực thi).*
*Đi kèm: [CO_CHE_GAME.md](CO_CHE_GAME.md) (cơ chế), [00-INDEX.md](../../research/game-vo-han/00-INDEX.md) (bối cảnh nghiên cứu).*

**Nguyên tắc vàng của tài liệu này:** INFINIA không được là game "chơi 10 giờ rồi xóa".
Mọi quyết định truyện và nội dung đều phải trả lời: *"vì sao người chơi còn mở game vào tháng thứ 6?"*

---

## Tóm tắt điều hành

| Hạng mục | Chốt |
|---|---|
| Tên thế giới | **Xứ Vĩnh Lưu** (xứ của dòng chảy vĩnh cửu) |
| Nguồn gốc ∞ | **Mạch Vô Hạn** — lời hẹn ước "máu một dòng, không bao giờ cạn" của Lạc Long Quân – Âu Cơ hóa thành sông ngầm chảy vòng tròn (tròn như bánh dầy) |
| Nhân vật chính | **An** — người trẻ trở về làng quê, không siêu năng lực |
| Xung đột chính | **Hư Vô** — thực thể của sự đứng yên tuyệt đối, đánh làng bằng sự nản lòng |
| Phản diện "người" | **Thầy Ba Hò — Kẻ Gieo Bóng** (bi kịch cá nhân, tay sai của Hư Vô ở Chương 1–2) |
| 3 chương | "Giếng Cạn" (làng) → "Sông Ngầm Nghẹt Thở" (rừng + hang) → "Đỉnh Trời Tròn" (núi tuyết) |
| Tone | Ấm áp, trầm lắng, hài nhẹ kiểu Ghibli làng quê Việt; sử thi chỉ bùng ở cao trào |
| Chiến lược sống lâu | Update mùa 3–4 tháng/lần + lễ hội lịch thật + sưu tầm + player expression + ∞ vĩnh viễn |
| Luật sắt | ∞ không bao giờ mua bằng tiền; không reset tiến trình; offline 100% |

---

## 1. CỐT TRUYỆN CHÍNH

### 1.1. Nguồn gốc thế giới — "Mạch Vô Hạn"

Ngày xửa ngày xưa, Lạc Long Quân đưa năm mươi người con xuống biển, Âu Cơ đưa năm mươi người con lên non. Hai ngả chia ly, nhưng lời hẹn ước thì ở lại:

> *"Dù non dù biển, máu vẫn một dòng — không bao giờ cạn."*

Lời hẹn ấy thấm xuống đất, hóa thành **Mạch Vô Hạn** — dòng sông ngầm linh thiêng chảy **vòng tròn** quanh đất trời: từ đỉnh núi cao xuống biển sâu, rồi lại ngược về nguồn. Tròn như chiếc **bánh dầy** ngày Tết — tượng trưng cho **trời tròn** — không đầu, không cuối, không bao giờ dứt.

Nơi Mạch trồi lên mặt đất: nước ngọt phun thành **giếng làng**, rễ Mạch nuôi lớn **cây đa nghìn năm**, người dân quây quần dựng **đình làng**, lập nên xóm ấp.

Quy luật của Mạch rất "nhà quê", rất thật: **Mạch chỉ chảy mạnh khi làng còn sống.** Còn tiếng cười trẻ con, còn khói bếp, còn người gánh nước, buộc lụa đỏ lên cây đa — thì Mạch còn chảy, mùa màng còn tốt tươi.

**Vì sao ∞ tồn tại?** Khi con người sống hết mình — dựng một mái nhà, kết bạn với một người dân, đứng ra bảo vệ làng — họ khơi cho Mạch chảy qua mình. Một phần dòng chảy đọng lại thành những **giọt sáng hình ∞**, gọi là **Năng lượng Vô Hạn**. ∞ không bao giờ mất vì nó là *dòng đã chảy qua bạn*, như phù sa đã bồi vào ruộng. Khi "tiêu" ∞ để mở vùng đất mới, đó không phải trả tiền mà là **đổ dòng chảy vào Đài Đá Đánh Thức** — trả năng lượng về cho Mạch để đánh thức đoạn mạch đang ngủ.

**Vì sao quái xuất hiện?** Nước chảy thì trong, nước đọng thì thiu. Chỗ nào Mạch ứ đọng, năng lượng "thiu" thành **VẨN** — chất đục ngầu đặc quánh. Từ Vẩn, quái vật sinh ra — dân gian gọi là *"con của vũng thiu"*. Đánh quái = vớt Vẩn, khơi dòng.

### 1.2. Nhân vật chính — AN

An lớn lên ở làng, theo gia đình lên thành phố từ nhỏ. Một ngày nhận được thư của bà: *"Giếng làng cạn rồi, con về đi."* An trở về với hai bàn tay trắng, không sức mạnh đặc biệt — chỉ có đôi chân chịu đi, đôi tay chịu làm, và trái tim còn nhớ quê.

**Vì sao chọn phương án này** (đã loại "người được Mạch chọn" — dễ thành mô-típ tiên hiệp; và "mất trí nhớ" — cliché mòn):
1. "Về quê" là câu chuyện của hàng triệu người Việt trẻ — không cần giải thích.
2. Sức mạnh của An đến từ *việc làm* — khớp hoàn hảo với cơ chế: ∞ kiếm bằng hành động.
3. Tên "An" nghĩa là *bình an* — đúng điều cả game hướng tới. Tên trung tính, dễ đổi.

### 1.3. Xung đột chính — HƯ VÔ

Hư Vô không phải ma vương muốn thống trị thế giới. Nó là **sự đứng yên tuyệt đối** — thực thể ghét dòng chảy, ghét thay đổi, ghét cả niềm vui lẫn nỗi buồn.

Khi người trẻ bỏ làng lên phố — giếng không ai gánh, đình không ai quét, cây đa không ai buộc lụa — Mạch yếu dần, nhiều đoạn **khô hẳn**. Từ những đoạn khô, Hư Vô len vào, thì thầm:

> *"Đứng yên mới là bình yên. Đừng cố nữa. Quê này hết thời rồi."*

Hư Vô không đánh bằng gươm giáo — nó đánh bằng **sự nản lòng**. Quái vật chỉ là *triệu chứng*; Hư Vô là *căn bệnh*: nỗi tin rằng "mọi thứ rồi cũng cạn, cố làm gì".

∞ là **bằng chứng sống** chống lại Hư Vô: mỗi giọt ∞ là một khoảnh khắc *dòng đời còn chảy*.

**Thầy Ba Hò — Kẻ Gieo Bóng** (giữ từ bản thảo nhân vật, định vị lại cho khớp lore): thầy lang cũ của làng, con gái mất trong năm đói vì làng từ chối phá khế ước để cứu. Hư Vô thì thầm vào nỗi đau ấy; thầy gieo hạt giống bóng tối (∞ ô nhiễm) để phá khế ước. Hắn là **con người đầu tiên bị Hư Vô lợi dụng** — bi kịch cấp người của căn bệnh Hư Vô — hoạt động ở Chương 1–2, còn trùm cuối Chương 3 vẫn là hiện thân của Hư Vô.

### 1.4. Ba chương truyện

**CHƯƠNG 1 — "GIẾNG CẠN"** (Làng An Bình)
An trở về làng vắng hoe: giếng trơ đáy, sân đình đầy lá. Học cơ chế cơ bản, kết bạn dân làng, gom ∞ đầu tiên. Cao trào: boss **CÂY CỔ THỤ GIẬN DỮ** — cây đa 300 năm bị Vẩn làm điên vì bị bỏ rơi ("Ba trăm năm ta che nắng cho làng... mà chẳng một ai quay lại!"). An không giết cụ — trận đánh là **chặt đứt từng rễ Vẩn** để cụ tỉnh lại. Kết chương: cụ Đa tỉnh, nhả **bản đồ khắc trên lá đa** chỉ đường Mạch; Đài Đá ở cổng rừng sáng lên — cần **500∞**.

**CHƯƠNG 2 — "SÔNG NGẦM NGHẸT THỞ"** (Rừng Mưa 500∞ → Hang Động Đá Vôi 5.000∞)
Rừng Mưa nơi Mạch từng chảy lộ thiên thành suối nay cạn trơ đá. Dân làng theo An dựng trạm gác — làng mở rộng. Trong hang, An phá 3 Hạt Giống Bóng Tối rồi **chạm mặt Thầy Ba Hò** — hắn không đánh mà hỏi: *"Nếu là cháu, cháu chọn con mình hay chọn làng?"* Cao trào: boss **THUỒNG LUỒNG ĐEN** — linh vật giữ sông ngủ quên trong Vẩn, tưởng "giữ" là "chặn". Kết chương: đập Vẩn vỡ, sông ngầm tuôn chảy; Thuồng Luồng tình nguyện trông sông. Dòng sông chỉ về phía Bắc — **Núi Tuyết**, cần **25.000∞**.

**CHƯƠNG 3 — "ĐỈNH TRỜI TRÒN"** (Núi Tuyết 25.000∞)
Đỉnh núi nơi Mạch bắt nguồn, bị băng đen của Hư Vô bao phủ. Đường lên núi chỉ mở khi **cả làng đồng lòng** — mỗi NPC thân thiết trao An một **kỷ vật**. LV.50 trong lore là **"Bậc Năm Mươi"** — 50 người con của Lạc Long Quân – Âu Cơ. Cao trào 2 pha: final boss **KẺ NUỐT DÒNG** — pha 1 chiến đấu cổ điển; pha 2 nó hiện nguyên hình là **vòng tròn khuyết** và An phải **dùng ∞ để "gọi tên" từng kỷ vật, từng người dân** — thắng bằng ký ức và tình thân, không phải sát thương. Kết game: vòng tròn khép kín, Mạch tuôn từ đỉnh xuống biển; bà Lụa múc gáo nước giếng đầu tiên: *"Uống đi con. Nước của lời hứa."* Dòng chữ hiện lên: **∞ — Dòng chảy không bao giờ cạn.**

### 1.5. Bảng gắn lore ↔ cơ chế

| Cơ chế game | Lý do trong truyện |
|---|---|
| Tích lũy ∞ | Mỗi việc làm làng sống lại đều khơi Mạch chảy qua An; HUD ∞ tăng = *nhịp tim của Mạch* |
| ∞ không bao giờ mất/reset | ∞ là dòng đã chảy qua bạn — như phù sa đã bồi vào ruộng |
| Mở vùng đất (500 / 5.000 / 25.000∞) | **Lễ đánh thức**: đổ ∞ vào Đài Đá để đánh thức đoạn Mạch đang ngủ |
| Xây & nâng cấp làng | Làng là **"trạm bơm" của Mạch**: làng càng đông vui, Mạch chảy càng mạnh |
| Kết bạn NPC | Mỗi người dân là một **"nhịp đập"** giữ Mạch sống — vũ khí thật sự chống Hư Vô ở Chương 3 |
| Đánh quái | Quái là "con của vũng thiu" — đánh tan = vớt Vẩn, khơi dòng |
| Max LV.50 | "Bậc Năm Mươi" — 50 người con Lạc Long – Âu Cơ |
| Nút Bay (Fly) | Mượn **"gió nguồn"** từ Mạch để bay ngắm thành quả — phần thưởng ngắm cảnh |

### 1.6. Cutscene mẫu (giữ nguyên văn để thấy tone)

**Mở đầu — "Về làng"** (hoàng hôn, bên giếng cạn):
> **Bà Lụa:** An đấy à? Về rồi đấy à...
> **An:** Bà ơi, con về rồi. Giếng... cạn từ bao giờ thế bà?
> **Bà Lụa:** *(cười móm mém)* Từ độ con đi. Không phải giếng cạn nước đâu con ạ — là **Mạch cạn**. Cái dòng nuôi làng mình bao đời... nó ngừng chảy rồi.
> **Bà Lụa:** Làng này chỉ sống khi còn người ở lại. Con về... là Mạch bắt đầu thở lại rồi đấy.

**Ông Đồ Nho kể truyền thuyết** (đêm, sân đình):
> **Ông Đồ Nho:** ...Lời hẹn ấy chui xuống đất, thành dòng sông ngầm chảy **vòng tròn** quanh trời đất — tròn như cái **bánh dầy** ngày Tết, không đầu không cuối. Dân mình gọi nó là **Mạch Vô Hạn**.
> **Bé Mận:** Thế sao giờ nó cạn, ông?
> **Ông Đồ Nho:** Vì Mạch cũng như con người — **không ai ngó ngàng thì cũng tủi**. Mạch tủi, Mạch ngừng chảy. Chỗ nào ngừng chảy, chỗ ấy sinh ra **Vẩn**.
> **An:** Vậy... làm sao cho Mạch chảy lại?
> **Ông Đồ Nho:** *(nhìn An)* Ở lại. Dựng nhà. Kết bạn. Bảo vệ làng.

**Trước boss Chương 1 — "Cụ Đa giận"**:
> **Cụ Đa:** *(ồm ồm)* ĐI ĐI... Ba trăm năm ta che nắng cho làng... mà khi giếng cạn, chẳng một ai quay lại buộc cho ta **dải lụa đỏ**...
> **An:** Con không đánh cụ đâu — con **chặt đứt Vẩn** cho cụ tỉnh lại. Cụ ráng chịu đau một chút nhé!

**Đối mặt Thầy Ba Hò** (Hang Động):
> **Thầy Ba Hò:** Cháu cũng là con của làng này. Vậy trả lời ta — năm đói ấy, nếu đứa bé sốt rét là người thân của cháu... cháu có chịu ngồi nhìn nó chết vì hai chữ 'cả làng' không?

**Cao trào Chương 3 — đối mặt Hư Vô**:
> **Hư Vô:** (mang khuôn mặt chính An) Ngươi cũng sẽ bỏ đi như tất cả. **Mọi dòng chảy rồi cũng cạn. Đứng yên — mới là vĩnh cửu.**
> **An:** *(giơ từng kỷ vật)* Ngươi sai rồi. Vĩnh cửu không phải đứng yên. **Vĩnh cửu là chảy mãi** — như lời hứa của cha ông ta: máu một dòng, không bao giờ cạn!
> **Hư Vô:** *(tan dần)* ...Thì ra... bị nhớ đến... cũng là một cách chảy...
> **An:** Ừ. **Không ai bị bỏ lại — thì không có Hư Vô.**

---

## 2. HỆ THỐNG NHÂN VẬT

> Ghi chú thống nhất tên (từ 2 bản thảo): Ông Đồ Nho = "ông Đồ" trong cutscene (tên thật: Kính);
> Bà Lụa là bà nội của An (thêm vào đội hình); Bé Mận (8 tuổi, trong cutscene) và Cu Tít (chăn trâu)
> là hai đứa trẻ trong làng — cả hai đều có quest.

### 2.1. NPC có tên trong làng (11 người)

| # | Tên | Vai trò | Backstory (2–3 nét) | Tính cách qua lời thoại |
|---|---|---|---|---|
| 1 | **Cụ Chánh Tín** | Trưởng làng, giao quest chính C1 | Từng là Người Gác Vô Hạn tập sự nhưng bỏ dở; vợ mất năm đói; giữ con dấu khế ước | Nói chậm, gọi player là "cháu": *"Làng mình... còn nhờ vào cháu."* |
| 2 | **Bà Lụa** | Bà nội của An | Người giữ lửa; là người đầu tiên đón An về | Hiền, nói ít, câu nào cũng thấm |
| 3 | **Ông Đồ Nho** | Giữ đình, kho lore sống | Người cuối cùng đọc được chữ Nôm trên bia đá; biết sự thật khế ước nhưng thề giữ kín | *"Xưa kia..."*, *"Sách có câu..."* |
| 4 | **Chú Sáu Búa** | Thợ rèn | Tay tật vì tai nạn lò rèn, thề chỉ rèn nông cụ — quái đến khiến chú phá lời thề; con gái lấy chồng xa | Cộc cằn (*"Ừ."*, *"Để đó."*) nhưng ấm áp |
| 5 | **Cô Lan Thảo** | Cô lang (thầy thuốc) | Học trò cuối của thầy lang già; mẹ từng được cứu trong năm đói; đang giấu đứa trẻ bị "bóng" bám | Dịu dàng: *"Cháu có đau ở đâu không?"* |
| 6 | **Bà Tám Xén** | Hàng xén, "bộ nhớ sống" của làng | Góa chồng nuôi 3 con ăn học; nhớ tên và món ưa thích của từng người; từng thấy bóng lạ đêm rằm | Lanh chanh: *"Mua nắm xôi, bà kể cho nghe chuyện này..."* |
| 7 | **Chú Tư Lưới** | Ngư dân | Từng cứu trẻ đuối nước ở Bến Phúc; giữ lưới rách của cha 20 năm; cá bỏ đi hết, chỉ còn Cá Bóng mắt đỏ | Phóng khoáng: *"Trời đất ơi!"* |
| 8 | **Cô Giáo Huệ** | Cô giáo | Người duy nhất học đại học rồi quay về; đang biên soạn "Sách làng" | Nhiệt huyết, lạc quan |
| 9 | **Chị Ba Bánh** | Bán bánh | Chồng đi làm ăn xa biệt tích 5 năm, vẫn để phần bánh mỗi chiều; công thức bánh ít lá gai của mẹ chồng | Đảm đang: *"Ăn miếng bánh đã rồi đi!"* |
| 10 | **Anh Hai Ruộng** | Nông dân | Lực điền cày 5 sào nuôi mẹ già; ruộng lúa chết hàng loạt vì "đất có mùi lạ"; bạn thân thời trẻ của Thầy Ba Hò | Chất phác: *"Để tôi."* |
| 11 | **Bé Mận & Cu Tít** | Trẻ con | Mận lém lỉnh hay đi theo An lén; Cu Tít mồ côi cha, bạn thân là trâu Cà Phê, từng thấy "chú râu dài nói chuyện với cây" | Nguồn gây cười + manh mối qua mắt trẻ con |

Mỗi NPC có 2–3 món **quà yêu thích** (gợi ý qua lời thoại) và 1 **quest riêng** mở ở mốc thân thiết "Thân quen".

### 2.2. Thầy Ba Hò — "Kẻ Gieo Bóng" (phản diện người)

Thầy lang cũ của làng. 20 năm trước, con gái thầy (bé Na, 8 tuổi) sốt rét trong năm đói; thuốc duy nhất là nhựa tim Cây Cổ Thụ — lấy là phạm khế ước. Dân làng từ chối. Bé Na mất. Thầy không hận từng người — thầy hận **cái khế ước** bắt cha phải chọn giữa con mình và làng. Hư Vô thì thầm vào nỗi đau ấy; thầy học lễ cấm, gieo hạt giống bóng tối (∞ ô nhiễm) để phá khế ước, "gieo lại làng mới".

**Xuất hiện dần:** C1 chỉ là lời đồn (bà Tám, Cu Tít) + vết khắc bàn tay trên thân Cây Cổ Thụ → C2 túp lều bỏ hoang + nhật ký rách → C2 cuối chạm mặt đối thoại trong Hang Động → C3 trùm cuối 2 lựa chọn: **đưa kẹp tóc của bé Na** (cảm hóa — kết đẹp) hoặc **kết liễu** (kết buồn).

> Ghi chú dev: C1–2 phản diện chỉ cần **bóng đen (silhouette) + chữ** — tiết kiệm công, hiệu quả bí ẩn cao.

### 2.3. Relationship system (solo dev làm được — chỉ là số + bảng tra)

Điểm thân thiết mỗi NPC: **0 → 1000**, 5 mốc:

| Mốc | Điểm | Mở khóa |
|---|---|---|
| Người lạ | 0–199 | Lời thoại mặc định |
| Quen mặt | 200–399 | Giảm giá 5% (NPC bán hàng) |
| Thân quen | 400–599 | **Mở quest riêng** + giảm giá 10% + quà nhỏ |
| Bạn thân | 600–799 | Giảm giá 15% + **buff đặc biệt** (ví dụ: Cu Tít đánh dấu đồ hiếm trên bản đồ; Chú Sáu rèn rẻ hơn 20%) |
| Tri kỷ | 800–1000 | **Quà tri kỷ độc nhất** (ví dụ: Búa Lò Cũ khắc tên; con diều giấy — gắn với nút Fly!) |

**Cách tăng điểm:** nói chuyện +5/ngày · quà thường +10 · đúng món yêu thích +30 (tối đa 2 món/ngày) · xong quest riêng +120 · quest daily +10 · dự lễ hội +20. Giảm nhẹ nếu 14 ngày không tương tác (tắt được trong cài đặt).

---

## 3. HỆ THỐNG QUEST

### 3.1. Ba loại quest

| | Quest chính (!) | Quest phụ (!) | Quest hàng ngày (bảng tin đình làng) |
|---|---|---|---|
| Mục đích | Đẩy cốt truyện 4 chương | Chuyện làng, manh mối phản diện | Thói quen đăng nhập mỗi ngày |
| Thời lượng | 10–15 phút | 5–10 phút | 3–5 phút |
| Thưởng ∞ | 400–1.000 | 150–400 | 60–120 |
| Số lượng | 12–15 (toàn game) | ~20–25 | ~10 (xoay vòng, reset 5h sáng) |
| Đặc biệt | Không hết hạn | 30% chứa manh mối về Thầy Ba Hò | Streak 7 ngày thưởng thêm 200∞ |

### 3.2. Quest mẫu dùng được ngay (10 quest)

**QC1 — "Tiếng gọi từ bìa rừng"** (chính, mở đầu): Cụ Chánh Tín nhờ ra bìa rừng xem 3 dấu vết → đánh **Cây Cổ Thụ Giận Dữ** → nhặt "Mảnh vỏ cây khắc tay người" mang về. Thưởng: 500∞ + lên LV.2 + Gậy Gỗ Lim + mở bảng tin đình làng.
> Cụ Chánh Tín (tay run khi thấy mảnh vỏ): *"...Vết khắc này... cụ tưởng cả đời không phải thấy lại."*

**QC2 — "Gốc rễ của bóng tối"** (chính, C3): Ông Đồ Nho giải mã bia đá → vào Hang Động phá 3 Hạt Giống Bóng Tối → **Thầy Ba Hò xuất hiện đối thoại** (lựa chọn ghi nhận, ảnh hưởng kết game). Thưởng: 1.000∞ + Đèn Dầu Rừng + mở đường Núi Tuyết.

**QP1 — "Trâu ơi, mày đâu rồi?"** (Cu Tít): tìm trâu Cà Phê lạc ở bìa rừng, bị 3 Sói Bóng vây; dắt trâu về. Thưởng: 200∞ + 120 thân thiết.
> Cu Tít (mếu): *"Cà Phê nó sợ tối lắm. Anh/chị tìm nó giúp em..."*

**QP2 — "Cáo trộm gà"** (Chị Ba Bánh): đặt bẫy, rình đến tối, bắt Cáo Bóng → lựa chọn: **đuổi đi** (+thân thiết) hoặc **giao nộp** (+∞ nhiều hơn). Thưởng: 180–250∞ + Bánh Ít Lá Gai ×3.

**QP3 — "Lọ thuốc của cô Lang"** (Cô Lan Thảo): hái 5 loại thuốc nam (lá lốt, ngải cứu, tía tô, sả, gừng dại) — *"chỉ hái lá, đừng nhổ rễ. Rừng đau, mình cũng đau."* Hé lộ: đứa trẻ mê sảng nói *"chú râu dài... gieo hạt đen..."* Thưởng: 220∞ + Thuốc Nam ×5.

**QP4 — "Mái đình dột nát"** (Cụ Chánh Tín): thu 20 lá cọ + 5 khúc gỗ, minigame leo thang lợp mái đúng nhịp 8 lần, thắp 3 nén nhang — mưa đổ xuống đúng lúc lợp xong. Thưởng: 300∞ + Nón Lá Đình Làng.
> Cụ Chánh Tín: *"Đình là hồn làng. Mái dột... như lòng người dột."*

**QP5 — "Bia đá vỡ"** (Ông Đồ Nho, quest lore): tìm 3 mảnh bia (giếng làng, bờ ruộng, mái đình cũ) → ghép lại đọc khế ước: *"Ai gieo bóng xuống đất, đất sẽ nuốt lại người ấy."* → mở QC2. Thưởng: 350∞ + flag "Hiểu Chữ Xưa".

**QD1 — "Gánh nước giếng làng"** (daily): gánh 6 thùng nước về quán bánh. 80∞ + Bánh Ít ×2.

**QD2 — "Tuần tra bờ ruộng"** (daily): diệt 10 Chuột Bóng. 100∞ + Lúa Nếp ×5.

**QD3 — "Chợ phiên buổi sớm"** (daily): giao 3 gói hàng trước 10h sáng + nghe lỏm 1 tin đồn (tỉ lệ nhỏ là manh mối Thầy Ba Hò). 120∞.

> Ghi chú dev: quest = dữ liệu (1 bản ghi gồm id/tên/loại/người giao/các bước/điều kiện mở/phần thưởng), không phải code. Trạng thái: chưa nhận → đang làm → chờ trả → xong.

---

## 4. CHIẾN LƯỢC CHƠI LÂU DÀI — 10 NGUYÊN TẮC GIỮ CHÂN

*Rút từ research 8 game thật (số liệu đã kiểm chứng qua web search, 2026). Mỗi nguyên tắc: vì sao đúng + ví dụ thật + áp dụng vào INFINIA + độ khó với solo dev.*

### Nguyên tắc 1 — Update "hiếm nhưng nặng", không đua cadence
**Vì sao:** 1 người không thể update 6 tuần/lần như Genshin (hàng trăm nhân sự). Mô hình đã chứng minh: im lặng vài tháng rồi thả update lớn → cộng đồng bùng nổ quay lại.
**Ví dụ:** Stardew Valley (solo dev Eric Barone): update lớn cách nhau tính bằng **năm** (1.5→2020, 1.6→3/2024), nhưng 1.6 miễn phí khiến người chơi PlayStation **tăng 184,5%**; Terraria sau 2 lần tuyên bố "final" doanh số **tăng gấp đôi từ 35tr (2021) lên 70tr (2026)**.
**Áp dụng:** INFINIA chốt **update theo mùa, 3–4 tháng/lần** — mỗi mùa 1 chủ đề rõ ràng. Không hứa ngày cụ thể.
**Độ khó:** Trung bình — khó ở kỷ luật scope, không phải code.

### Nguyên tắc 2 — Lễ hội theo lịch thật: content "tự chạy"
**Vì sao:** Event gắn lịch thật (Tết, Trung Thu) tự lặp mỗi năm, mỗi năm chỉ cần thêm 1–2 món mới — retention gần như miễn phí.
**Ví dụ:** Animal Crossing: New Horizons **ngừng update từ 11/2021** nhưng Bunny Day, Halloween, Toy Day, Tết... **tự chạy lại mỗi năm** theo đồng hồ máy; Genshin tổ chức **Lantern Rite hằng năm từ 2021**, bản 2025 tặng nhân vật + skin miễn phí.
**Áp dụng:** Lịch lễ hội Việt chạy bằng ngày hệ thống — **Tết** (gói bánh chưng, lì xì ∞, múa lân), **Trung Thu** (rước đèn, phá cỗ), **hội làng** (đập niêu, kéo co). Mỗi năm thêm 1 món trang trí + 1 danh hiệu giới hạn ("Tết 2027").
**Độ khó:** Dễ — dùng lại NPC/map có sẵn.

### Nguyên tắc 3 — Sưu tầm có checklist
**Vì sao:** Con người bị ám ảnh hoàn thành bộ sưu tập; checklist biến mọi hoạt động thành tiến độ hữu hình.
**Ví dụ:** Animal Crossing (Critterpedia + bảo tàng) — nhiều người chơi **hàng trăm giờ chỉ để full bảo tàng**; Terraria: thời gian chơi trung bình **101 giờ/người**.
**Áp dụng:** **"Sổ làng"** — 4 bộ: cá đồng & côn trùng (theo mùa), vũ khí & trang bị, công thức xây dựng, ký ức NPC. Treo thành tích ở đình làng.
**Độ khó:** Dễ — chủ yếu là data + UI danh sách.

### Nguyên tắc 4 — Cho người chơi "để lại dấu ấn"
**Vì sao:** Tự tay xây/trang trí tạo gắn bó cảm xúc — bỏ game = bỏ công sức của mình.
**Ví dụ:** Animal Crossing (48,62 triệu bản): Island Designer; Minecraft: creator kiếm **500+ triệu USD** từ Marketplace.
**Áp dụng:** Người chơi **chọn bố cục làng** (kéo-thả nhà/giếng/đình/vườn), đổi trang phục (áo dài, nón lá theo thành tích), **chụp ảnh làng** chia sẻ lên Facebook — marketing 0 đồng.
**Độ khó:** Trung bình — làm sau khi core loop ổn.

### Nguyên tắc 5 — Vòng lặp "vô hạn": hết content chính vẫn còn việc
**Vì sao:** Game sống lâu nhất đều có việc không bao giờ hết — hệ thống tự sinh mục tiêu mới.
**Ví dụ:** Minecraft: **300.000 người chơi mới mỗi ngày** sau 17 năm vì không có điểm kết thúc; Terraria thêm Master Mode cho người chơi cũ cày lại.
**Áp dụng:** ∞ vĩnh viễn là chìa khóa — **"Kiếp mới"** sau LV.50 (giữ ∞ + trang trí, reset level, quái mạnh hơn + đồ hiếm chỉ có ở kiếp cao); việc hằng ngày 10 phút; mùa vụ trồng–thu hoạch theo lịch thật.
**Độ khó:** Trung bình — daily quest AI code được; cân bằng "Kiếp mới" cần Hoàng test.

### Nguyên tắc 6 — Biến cộng đồng thành "đội content miễn phí"
**Vì sao:** Solo dev không sản xuất content bằng cộng đồng được.
**Ví dụ:** Stardew: **15.300 mods / 336 triệu lượt tải**; Barone thuê luôn tác giả tool mod về làm update 1.6.
**Áp dụng:** Giai đoạn 1: nút chụp & chia sẻ làng + **cuộc thi "làng đẹp nhất mùa"** (giải là danh hiệu + ∞). Giai đoạn 2: mở data JSON cho cộng đồng tự làm "bản làng" (làng miền Tây, làng miền núi...).
**Độ khó:** Dễ → Trung bình theo giai đoạn.

### Nguyên tắc 7 — Giấu bí mật
**Vì sao:** Bí mật là content rẻ nhất — tạo hàng giờ bàn tán, video khám phá.
**Ví dụ:** Vampire Survivors (solo dev Luca Galante, **27+ triệu người chơi**): hệ thống secrets là bản sắc game.
**Áp dụng:** NPC bí ẩn chỉ xuất hiện đêm rằm ở bến sông; **"∞ ẩn"** mỗi mùa giấu 3–5 điểm (gốc đa, giếng làng, nóc đình); mảnh truyền thuyết ma làng/kho báu rải rác. **Tuyệt đối không spoil trong patch note.**
**Độ khó:** Dễ — chỉ là đặt object + trigger + hội thoại.

### Nguyên tắc 8 — Giá rẻ + "fair": niềm tin là retention dài nhất
**Vì sao:** Người chơi ở lại nhiều năm với dev họ tin tưởng.
**Ví dụ:** Vampire Survivors: giá **$3→$5**, DLC **$1,99**, cam kết tính năng chính không bao giờ khóa sau paywall; Terraria: *"không tăng giá, không microtransaction"* suốt 15 năm → 70 triệu bản.
**Áp dụng:** Giữ luật sắt đã chốt — **∞ không mua bằng tiền thật**; nếu cần doanh thu chỉ bán cosmetic. Mỗi update ghi rõ "100% miễn phí".
**Độ khó:** Dễ — đây là quyết định, không phải code.

### Nguyên tắc 9 — Chống nhàm chán: độ khó tự chọn + chơi lại
**Vì sao:** Khi hết việc, đừng cho thêm quest — hãy cho chơi lại theo cách mới. Rẻ hơn làm map mới rất nhiều.
**Ví dụ:** Terraria Journey's End: Master Mode + Journey Mode → người chơi 9 năm vẫn cày lại.
**Áp dụng:** "Kiếp mới", thử thách làng có giới hạn (30 ngày đạt làng cấp 5) lên bảng xếp hạng, chọn "xuất thân" khác nhau khi tạo nhân vật mới (con nhà nông/thợ/đồ — buff nhỏ khác nhau).
**Độ khó:** Trung bình — dùng lại hệ thống cũ với tham số mới.

### Nguyên tắc 10 — Bài học Anthem: đừng hứa live-service nếu không có runway
**Vì sao:** Game chết vì hứa dịch vụ lâu dài nhưng không có nội dung nuôi; online-only thì tắt server = người chơi mất trắng.
**Ví dụ:** Anthem (BioWare/EA, 2019): endgame nông, bản "Anthem Next" bị **hủy 2021** → **tắt server 12/1/2026**, game không chơi được nữa.
**Áp dụng — 3 luật sắt:** (1) **Chơi offline 100%**, save ở máy người chơi. (2) Chỉ hứa "update theo mùa", hứa ít làm nhiều. (3) Mỗi update chơi độc lập, không bán "tập 1" bắt chờ "tập 2".
**Độ khó:** Dễ — quyết định kiến trúc từ ngày đầu.

**Một câu chốt:** game sống lâu không phải vì nhiều content, mà vì **người chơi luôn có lý do quay lại vào ngày mai** — lễ hội sắp tới, mùa vụ chưa thu hoạch, bộ sưu tập còn thiếu 1 món, ngôi làng còn dang dở.

---

## 5. LỘ TRÌNH NỘI DUNG 12 THÁNG SAU LAUNCH

*Team: 1 người + AI. Mỗi quý 1 update lớn (tháng 3/6/9/12). Tổng ~156 ngày công. Nguyên tắc anti power creep: trần LV.50 cố định, đồ mới là sidegrade, đồ cũ làm nguyên liệu cho đồ mới.*

| Tháng | Nội dung | Mục tiêu giữ chân | Công sức |
|---|---|---|---|
| 1 | **Tết — "Làng Đón Xuân"**: gói bánh chưng, trang trí làng, lì xì ∞ mỗi ngày, trang phục Tết | Thói quen đăng nhập 7 ngày | ~6 ngày |
| 2 | **"Chợ Quê"**: 15 việc làng mới, thương lái lang thang đổi nguyên liệu | Đổ đầy core loop hằng ngày | ~8 ngày |
| 3 | **UPDATE LỚN: "Rừng Xanh Mở Rộng"** — boss Hổ Chúa Sơn Lâm, 15 quest rừng | Mục tiêu trung hạn cho LV.30–40 | ~20 ngày |
| 4 | **"Vụ Mùa Vàng"**: mini-loop gieo–tưới–gặt, sự kiện gặt cộng đồng | Vòng quay theo chu kỳ tuần | ~10 ngày |
| 5 | **"Hội Làng Đầu Hạ"**: 3 mini-game (đập niêu, kéo co, thi nấu ăn) | Nội dung nhẹ cho người không thích combat | ~8 ngày |
| 6 | **UPDATE LỚN: "Hang Động & Làng Cấp 2"** — boss Rắn Chúa Hang Sâu, rèn kế thừa | ∞ tích lũy thành tiến trình hữu hình | ~25 ngày |
| 7 | **"Bí Kíp Võ Làng"**: kỹ năng thứ 3 + cây nâng cấp bằng ∞ | Chiều sâu build cho LV.40+ | ~12 ngày |
| 8 | **Trung Thu — "Đêm Trăng Rằm"**: rước đèn, phá cỗ, boss Ông Kẹ giới hạn | Kéo người chơi đã nghỉ quay lại | ~6 ngày |
| 9 | **UPDATE LỚN: "Núi Tuyết & Làng Cấp 3"** — boss tuần Bạch Hổ Tuyết Sơn (sync sức mạnh) | Đích đến cho hardcore | ~25 ngày |
| 10 | **"Sổ Tay Làng Quê"**: codex, 50 thành tựu, bảng vinh danh | Tôn vinh 12 tháng công sức cũ | ~10 ngày |
| 11 | **"Đêm Ma Làng Quê"**: quest ma da/ma trơi, boss Hồn Ma Giếng Cổ giới hạn | Giữ nhịp sự kiện hằng tháng | ~6 ngày |
| 12 | **UPDATE LỚN: "Chân Trời Mới"** — teaser vùng Biển/Đảo năm 2 + chế độ **"Kiếp Mới"** | Cầu nối sang năm 2 | ~20 ngày |

---

## 6. DANH SÁCH CẤM — 10 bẫy "sớm nở chóng tàn"

| # | Bẫy | Ví dụ thật (đã kiểm chứng) | INFINIA tránh bằng cách |
|---|---|---|---|
| 1 | **Pay-to-win** | Diablo Immortal — gem nâng cấp tốn $50.000+, F2P ~950k vs nạp ~9,5M điểm sức mạnh | ∞ không bao giờ mua bằng tiền thật; nạp chỉ mua cosmetic |
| 2 | **Content drought** | Destiny 2 xóa nội dung đã bán; Anthem/Babylon's Fall/Concord bị bỏ rơi | Lịch 12 tháng công khai; **không bao giờ xóa nội dung cũ** |
| 3 | **Power creep** | WoW: đồ quest expansion mới ủi đồ raid cũ; Destiny 2 nâng light level mỗi 3 tháng | Đồ mới là sidegrade; trần LV.50; đồ cũ làm nguyên liệu đồ mới; kiểm tra BALANCE.js mỗi update |
| 4 | **Update phá save/cân bằng** | Dauntless reset tiến trình 2 lần; ARC Raiders âm thầm đổi đồ được giữ | Không reset; migration + backup save; test save cũ trước mỗi update; chỉ buff, không nerf đồ người ta đã đầu tư |
| 5 | **Event ép nạp** | Diablo Immortal: Cycle of Strife + bundle giới hạn ép chi tiền | 100% nội dung event chơi miễn phí; tiền chỉ mua skin event |
| 6 | **Grind vô nghĩa** | Diablo Immortal: tường tiến trình endgame cho F2P | Mọi grind có đích đo được (500/5.000/25.000∞); việc daily có giới hạn hợp lý |
| 7 | **Hứa quá đà** | Cyberpunk 2077: Sony gỡ khỏi PS Store, kiện tập thể | Chỉ công bố tính năng đã có bản chơi được; trễ hẹn thì báo sớm |
| 8 | **Đốt sức dev** | ARC Raiders: update hằng tháng → team kiệt sức, phải chuyển 2 bản/năm | Nhịp 1 nhỏ/tháng + 1 lớn/quý; AI gánh code lặp; cắt scope chứ không cắt sức khỏe |
| 9 | **Cộng đồng độc hại bỏ mặc** | Marvel Rivals: mất hạng mục report hate speech, creator bỏ game | Nút báo cáo + lọc từ ngữ từ Beta; quy tắc cộng đồng tiếng Việt minh bạch |
| 10 | **Thay đổi gây fork** | Minecraft 1.19.1: #SaveMinecraft, mod No Chat Reports 200k+ tải | Thay đổi lớn về triết lý phải thông báo trước + khảo sát; không đụng thứ người chơi đã xây dựng |

---

## 7. QUYẾT ĐỊNH CẦN HOÀNG CHỐT

| # | Quyết định | Khuyến nghị | Nếu chọn ngược lại |
|---|---|---|---|
| 1 | **Tone truyện** — giữ ấm áp/Ghibli làng quê hay muốn dark/sử thi hơn? | Giữ ấm áp, sử thi chỉ ở cao trào — hợp với "tình làng nghĩa xóm" làm fantasy cốt lõi | Dark hơn → phải viết lại động cơ Hư Vô và nhiều quest; tốn công, rủi ro mất chất riêng |
| 2 | **Tên nhân vật chính** — giữ "An" (bình an, trung tính) hay đổi? Cho người chơi tự đặt tên không? | Giữ "An" làm tên mặc định, **cho tự đặt tên** (tăng gắn bó, code rẻ) | Tên cố định khác — chỉ là đổi 1 chuỗi, không ảnh hưởng gì |
| 3 | **Chủ đề "người trẻ bỏ làng lên phố"** — giữ (thấm, hiện thực) hay giảm (thuần fantasy vui)? | **Giữ** — đây là chất liệu độc quyền của game Việt, không game ngoại nào có | Giảm → truyện an toàn hơn nhưng mất điểm nhấn cảm xúc mạnh nhất |
| 4 | **Boss cuối** — giữ kiểu thắng bằng cảm xúc (gọi tên kỷ vật) hay thêm pha đánh "đã tay" dài hơn? | **Cả hai**: pha 1 đánh đã tay 3–4 phút, pha 2 cảm xúc — đã thiết kế sẵn như vậy | Chỉ đánh → mất khoảnh khắc đáng nhớ nhất game; chỉ cảm xúc → người chơi hardcore chê "nhạt" |
| 5 | **Thầy Ba Hò** — giữ làm phản diện người (bi kịch) hay chỉ giữ Hư Vô trừu tượng? | **Giữ** — phản diện có mặt người khiến truyện sâu hơn hẳn; đã định vị là tay sai của Hư Vô, không xung đột lore | Bỏ → Chương 1–2 mất kẻ thù "có mặt", chỉ còn quái vô danh |
| 6 | **Kết cục** — có cho phép kết buồn không? (lựa chọn cảm hóa/kết liễu Thầy Ba Hò đã có) | **Giữ cả 2 lựa chọn** — người chơi quyết định, tăng giá trị chơi lại | Chỉ 1 kết → đơn giản hơn nhưng mất chiều sâu |
| 7 | **Mức độ tâm linh** — thờ cúng, ma chay, Thành hoàng đưa vào ở mức nào? | Mức **văn hóa dân gian nhẹ** (thắp nhang, lễ hội, ma trơi như chuyện kể) — không mê tín nặng, không xúc phạm | Đậm hơn → rủi ro nhạy cảm; nhạt hơn → mất chất liệu làng quê |
| 8 | **Tiền thật** — sau Beta có bán gì không? | Chỉ **cosmetic + battle-pass mùa** (trang trí), không bao giờ bán ∞/sức mạnh (luật sắt mục 4.8) | Bán sức mạnh → pay-to-win → vi phạm bẫy #1, mất uy tín |
| 9 | **Tên thế giới "Xứ Vĩnh Lưu"** — có cần người chơi nhớ không? | **Không** — trong game dân làng chỉ gọi "đất này", "quê mình"; tên đẹp để làm tài liệu/truyền thông | Ép người chơi nhớ → gánh nặng không cần thiết |
| 10 | **Multiplayer** — có bao giờ làm không? | **Không trước năm 2**, và chỉ dạng thăm làng bạn (bất đồng bộ) nếu làm | Làm sớm → gấp đôi công sức, đúng bẫy scope creep của CO_CHE_GAME |

---

## Phụ lục — Ghi chú nguồn & độ tin cậy

- Cốt truyện, NPC, quest: **sáng tác mới 100%** cho INFINIA, không copy tác phẩm có sẵn; chất liệu văn hóa dân gian (Lạc Long Quân–Âu Cơ, bánh dầy, Thuồng Luồng, ông Đồ, đình làng) là di sản chung.
- Số liệu game thật (Stardew 30M bản, Minecraft 425M+, Terraria 70M, ACNH 48,62M, Genshin ~10 tỷ USD, Vampire Survivors 27M+ người chơi, Anthem tắt server 12/1/2026): đã kiểm chứng qua web search trong quá trình biên soạn, kèm nguồn/năm trong bản research gốc.
- Các con số thiết kế INFINIA (thưởng ∞/quest, mốc thân thiết, công sức ngày công): **ước tính thiết kế**, cần Hoàng chơi thử và chốt khi triển khai — đã ghi rõ trong tài liệu.
- Mâu thuẫn giữa các bản thảo worker đã được điều phối viên thống nhất (xem ghi chú ở mục 2); lore chuẩn là mục 1.

*Hết tài liệu. Đây là "linh hồn" của INFINIA — đọc cùng [CO_CHE_GAME.md](CO_CHE_GAME.md) (cơ chế) để có bức tranh đầy đủ.*
