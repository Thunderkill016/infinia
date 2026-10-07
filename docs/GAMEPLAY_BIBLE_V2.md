# INFINIA — GAMEPLAY BIBLE V2

**Trạng thái:** Canonical gameplay direction cho Infinia V2  
**Ngày:** 2026-10-07  
**Mục tiêu:** biến Infinia thành game web/mobile 3D nhỏ, có bản sắc Việt, dễ chơi 5–15 phút/session và đủ sâu để người chơi muốn quay lại.

---

## 1. Một câu định nghĩa

**INFINIA là game action-cozy về việc trở về và hồi sinh một ngôi làng Việt; mỗi chuyến đi ngắn giải quyết một vấn đề của dân làng và tạo ra thay đổi nhìn thấy được trong chính ngôi làng.**

Không phải open-world RPG.
Không phải Stardew 3D.
Không phải game grind level.
Không phải combat game có thêm làng.

---

## 2. Ba trụ cột bắt buộc

### 2.1. Làng sống lại
Mỗi session phải tạo ra ít nhất một thay đổi hữu hình:
- giếng trong lại;
- cầu được sửa;
- ruộng xanh hơn;
- ao sạch;
- lò rèn hoạt động;
- đình có người tụ tập;
- chợ có thêm quầy;
- NPC đổi lịch sinh hoạt.

Reward quan trọng nhất là **thế giới thay đổi vì người chơi**.

### 2.2. Người làng nhớ người chơi
NPC chính phải:
- nhớ việc người chơi vừa làm;
- có dialogue mới;
- thay đổi hoạt động;
- mở gameplay mới;
- phản ứng với trạng thái làng.

Relationship progression quan trọng hơn level progression.

### 2.3. Ra ngoài luôn có chuyện
Mỗi lần rời làng phải có:
- mục tiêu rõ;
- đường đi ngắn;
- một discovery;
- một interaction/combat/problem;
- một payoff.

Không đi bộ vô nghĩa quá 30–45 giây.

---

## 3. Core loop canonical

```
LÀNG
↓
NPC / environment cho biết một vấn đề
↓
CHỌN 1 VIỆC LÀNG
↓
ĐI RA NGOÀI 2–6 PHÚT
↓
KHÁM PHÁ / TƯƠNG TÁC / COMBAT
↓
GIẢI QUYẾT VẤN ĐỀ
↓
TRỞ VỀ
↓
LÀNG BIẾN ĐỔI
↓
NPC PHẢN ỨNG
↓
NHẬN MẠCH LÀNG ∞
↓
CHỌN VIỆC TIẾP HOẶC THOÁT
```

Một session chuẩn: **8–12 phút**.

---

## 4. Cấu trúc một session

### 0:00–1:00 — Trở về
- thấy thay đổi từ session trước;
- NPC phản ứng;
- game cho tối đa 2–3 việc có thể làm.

### 1:00–2:00 — Chọn việc
Không quest board dài.
Không checklist 10 nhiệm vụ.

### 2:00–7:00 — Ra ngoài
Một khu vực gần làng.
Tối đa một gameplay idea chính.

### 7:00–9:00 — Cao trào
Combat, puzzle nhẹ, interaction hoặc khám phá chính.

### 9:00–10:00 — Trở về
- environment đổi;
- NPC đổi;
- gameplay option mới xuất hiện;
- người chơi có lý do tự nhiên để làm thêm một việc.

---

## 5. Vertical slice V2 đầu tiên

Tên nội bộ: **GIẾNG LÀNG**

### Flow

1. An trở về làng.
2. Bà Lụa nói nước giếng có mùi lạ.
3. Người chơi đi qua cây đa → đình → ruộng → ao sen.
4. Trên đường gặp một dấu hiệu bất thường.
5. Tại ao có 2 encounter ngắn.
6. Người chơi tìm ra nguồn Mạch bị vẩn đục.
7. ACTION để xử lý nguồn nước.
8. Trở về làng.
9. Giếng đổi từ đục → trong.
10. Cây/hoa quanh giếng xuất hiện.
11. NPC bắt đầu ra lấy nước.
12. Bà Lụa + 2 NPC có dialogue mới.
13. Người chơi nhận **3∞ Mạch Làng**.
14. Mở 2 lựa chọn tiếp:
   - sửa cầu;
   - giúp ruộng.

### Definition of Done
- người mới hiểu mục tiêu trong <60 giây;
- hoàn thành trong 8–12 phút;
- không cần đọc tutorial dài;
- có ít nhất 1 khoảnh khắc combat/tương tác vui;
- quay về thấy làng thay đổi rõ;
- người chơi hiểu vì sao muốn chơi tiếp.

---

## 6. Control model

Core chỉ có 4 input gameplay:

```
MOVE
LOOK
ACTION
DODGE
```

### ACTION
Context priority:

```
NÓI / MUA
> ĐÁNH
> NHẶT
> DẮT
> GIẬT CÂU
> DÙNG
> CÂU
```

Không thêm nút gameplay mới nếu có thể giải quyết bằng ACTION.

### Mobile
- joystick trái;
- ACTION lớn bên phải;
- DODGE nhỏ hơn;
- swipe camera;
- menu tách khỏi gameplay.

### Desktop
- WASD;
- mouse;
- E / click = ACTION;
- Space/Shift = DODGE.

### Gamepad
- left stick;
- right stick;
- A = ACTION;
- B = DODGE.

---

## 7. Combat V2

Combat phục vụ nhịp phiêu lưu, không phải build RPG.

### Loop

```
ENEMY TELEGRAPH
↓
PLAYER READ
↓
DODGE / MOVE
↓
ENEMY RECOVERY
↓
ACTION
↓
FEEDBACK
```

### Quái thường
- 20–40 giây;
- 1 pattern chính;
- 1 biến thể;
- không sponge HP.

### Elite
- 60–90 giây;
- 2 pattern.

### Boss
- 2–3 phút;
- tối đa 3 pattern;
- không phase dài dòng.

### Ví dụ

**Cua Đá**
- giơ càng đỏ 0.7s;
- lao thẳng;
- nếu hụt → mắc lại 1.2s;
- player ACTION phản công.

**Dơi Sương**
- bay vòng;
- audio cue;
- lao xuống;
- dodge ngang;
- recovery ngắn.

### Bỏ
- combo dài;
- skill tree;
- elemental counter;
- gear score;
- crit build;
- auto-fight mặc định.

Auto-fight chỉ có thể tồn tại dưới dạng accessibility assist.

---

## 8. Progression V2

### Progression chính = Village State

Ví dụ:

```
GIẾNG
0: bẩn
1: sạch
2: có mái + chum nước
3: NPC tụ họp + buff hồi phục
```

```
RUỘNG
0: hoang
1: làm đất
2: xanh
3: thu hoạch
```

```
LÒ RÈN
0: tắt
1: sửa
2: hoạt động
3: mở tool mới
```

Người chơi phải nhìn thấy progression bằng mắt.

### Character progression
Giữ nhẹ:
- HP cơ bản;
- dodge;
- ACTION mạnh hơn theo milestone;
- tool mới qua NPC;
- không LV 1–50 làm trung tâm.

Nếu vẫn giữ level kỹ thuật, level không được là driver chính của content.

---

## 9. Mạch Làng ∞

∞ giữ lại vì là identity của Infinia.

Nhưng đổi ý nghĩa:

**∞ = Mạch Làng, thước đo những thay đổi có ý nghĩa mà người chơi tạo ra.**

Không còn:
- +1∞ mỗi 10 giây online;
- số hàng chục nghìn;
- grind vô hạn.

Ví dụ reward:

- giúp một NPC: +1∞;
- sửa giếng: +3∞;
- cứu ruộng: +3∞;
- phục hồi ao: +5∞;
- giải quyết quest chapter: +5–8∞.

Chi:

- 3∞: sửa cầu;
- 5∞: mở lại chợ;
- 5∞: nâng giếng;
- 8∞: phục hồi đình.

Mỗi lần tiêu phải tạo thay đổi trực quan.

---

## 10. NPC canonical cast

Chỉ 8 NPC chính được đầu tư sâu ở V2.

### Bà Lụa
Vai trò: ký ức, gia đình, giếng làng.

### Cụ Chánh Tín
Vai trò: trưởng làng, quyết định chung, chapter progression.

### Cu Tít
Vai trò: khám phá, trâu, vui nhộn, dẫn người chơi đi tới nơi mới.

### Bà Tám Xén
Vai trò: chợ, gossip, economy nhẹ.

### Chú Sáu Búa
Vai trò: sửa chữa, tool progression.

### Cô Lan Thảo
Vai trò: cây thuốc, heal, thiên nhiên.

### Chú Tư Lưới
Vai trò: ao, câu cá, chuyện nguồn nước.

### Anh Hai Ruộng
Vai trò: ruộng, mùa vụ, lao động.

NPC còn lại:
- ambience;
- routine;
- không cần quest chain riêng ở V2 đầu.

---

## 11. Việc Làng thay quest MMO

Không hiển thị:

- Giết 5 quái;
- Nhặt 10 rau;
- Nói chuyện với 3 người.

Thay bằng fiction:

> “Mấy đêm nay có thứ gì phá ruộng của Anh Hai.”

Implementation bên dưới có thể vẫn là:
- investigate 2 dấu;
- defeat 3 creature;
- interact 1 source.

Nhưng người chơi phải trải nghiệm một câu chuyện nhỏ, không phải checklist.

---

## 12. Khu vực gameplay

Map phải nhỏ và đặc.

```
                RỪNG TRE
                   │
                   │
RUỘNG ───────── LÀNG ───────── AO SEN
                   │
                   │
               ĐỒNG CỎ
```

Từ làng tới khu gameplay: 30–60 giây.

### Ruộng
- dẫn trâu;
- theo dấu;
- đuổi sinh vật phá ruộng;
- nước/bùn;
- thu hoạch milestone.

### Ao sen
- fishing;
- quái nước;
- tìm vật;
- nguồn nước;
- sen/đường bờ.

### Rừng tre
- dấu vết;
- âm thanh;
- đường hẹp;
- enemy telegraph rõ;
- tìm người/vật.

### Đồng cỏ
- trâu/gà;
- chase nhẹ;
- race/escort;
- không gian thoáng.

**Bản sắc Việt phải xuất hiện trong gameplay, không chỉ texture.**

---

## 13. Fishing

Giữ cực nhỏ:

```
ACTION thả
↓
visual/audio cue
↓
ACTION đúng lúc
↓
kéo 2–5 giây
↓
reward
```

Một lượt 15–30 giây.

Không durability.
Không 40 loại mồi.
Không fishing skill tree ở V2.

---

## 14. Farming

Không làm farming simulator.

Người chơi:
- giải quyết vấn đề của ruộng;
- cung cấp thứ cần thiết;
- giúp người dân.

Dân làng tự vận hành ruộng.

Environment thay đổi theo thời gian/session.

---

## 15. Village memory

Sau mỗi milestone, tối thiểu 2 NPC phải có phản ứng mới.

Ví dụ sau khi xử lý Cua Đá:

**Bà Tám**
> “Nghe nói ngoài ao có con cua to bằng cái nia hả?”

**Cu Tít**
> “Mai cho em đi coi với!”

**Chú Tư**
> “Nó xuất hiện từ lúc nước đổi màu…”

Không cần cutscene.
Dialogue ngắn, contextual và có trạng thái.

---

## 16. Day/Night

Giữ.

Nhưng phải tác động gameplay nhẹ:

### Ngày
- NPC làm việc;
- fishing bình thường;
- đường an toàn hơn.

### Chiều
- NPC về làng;
- lighting đẹp;
- transition session.

### Đêm
- một số creature mới;
- NPC ở nhà/đình;
- ambience khác;
- nhiệm vụ đặc biệt sau này.

Không biến thành survival system.

---

## 17. Failure model

Cozy-first.

Nếu HP = 0:
- trở về làng;
- không mất Mạch Làng;
- không mất item quan trọng;
- NPC có thể phản ứng;
- encounter reset.

Không corpse run.
Không durability punishment.
Không mất currency.

---

## 18. Reward hierarchy

Theo thứ tự:

1. **World changes**
2. NPC reacts
3. New interaction/activity
4. Story discovery
5. Cosmetic
6. Mạch Làng ∞
7. Numeric XP

Nếu reward chỉ là số → design chưa đủ tốt.

---

## 19. Feature freeze

Không làm trong V2 vertical slice:

- open world lớn;
- multiplayer;
- crafting;
- skill tree;
- pet system;
- 20+ quest song song;
- 50 monster;
- loot rarity treadmill;
- gear score;
- procedural infinite world;
- farming simulator;
- cooking tree;
- housing decoration system;
- companion combat;
- gacha;
- daily grind;
- battle pass;
- PvP;
- mount;
- flying;
- complex inventory;
- multiple currencies.

Feature nào muốn thêm phải chứng minh nó làm mạnh ít nhất một trong 3 pillars.

---

## 20. Development order

### P0 — Foundation
- input abstraction;
- ACTION system;
- fixed game-state contracts;
- session state;
- village state.

### P1 — Giếng vertical slice
Làm end-to-end trước.

### P2 — Combat readability
Chỉ polish hai enemy của vertical slice.

### P3 — Village reaction
Environment + NPC memory.

### P4 — Mobile
Đảm bảo 8–12 phút chơi tốt trên touch.

### P5 — Visual redesign
Vietnamese Storybook Diorama phục vụ đúng vertical slice.

### P6 — Playtest
5–10 người chưa biết game.

Chỉ khi vertical slice pass mới thêm việc làng thứ hai.

---

## 21. Playtest gate

Vertical slice chỉ PASS nếu:

- ≥80% người test hiểu việc cần làm trong 60 giây;
- ≥70% hoàn thành session;
- ≥70% nhận ra làng đã thay đổi sau khi trở về;
- ≥60% tự nói họ muốn làm việc tiếp theo;
- mobile không có input blocker;
- FPS ≥30 trên target Android tầm trung;
- không cần giải thích bằng miệng để chơi.

Fail → sửa loop hiện tại.
Không thêm content.

---

## 22. Luật cho AI coding agents

Khi làm Infinia V2:

1. Không tự thêm feature.
2. Không dùng roadmap V1 để override Bible này.
3. Mọi task phải map vào một pillar.
4. Một iteration chỉ giải quyết một player-facing deficiency.
5. Targeted test trước, full suite sau.
6. Gameplay evidence quan trọng hơn số test.
7. Không refactor ngoài scope.
8. Không mở rộng map trước khi Giếng vertical slice pass.
9. Không tăng complexity để “cho giống RPG”.
10. Nếu xung đột tài liệu: **GAMEPLAY_BIBLE_V2.md thắng cho gameplay V2**.

---

# North Star

Khi người chơi đóng game sau 10 phút, cảm giác cần đạt là:

> “Mình vừa giúp ngôi làng này tốt lên một chút. Mình muốn xem lần sau nơi này sẽ thay đổi thành gì.”
