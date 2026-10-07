# INFINIA — Nghiên cứu Web-First Gameplay & Graphics 2026-10-07

> Mục tiêu: xác định cơ chế chơi và art/technical direction phù hợp với một game 3D làng Việt chạy tốt trên desktop, mobile và tablet qua trình duyệt.
>
> Tài liệu này là **research + đề xuất kỹ thuật**, chưa tự động thay đổi product decisions trong AUTO_DEV.

## 0. Kết luận ngắn

INFINIA không nên được phát triển như "một RPG PC thu nhỏ rồi ép chạy trên web".

Hướng phù hợp hơn là:

> **3D village-action game nhỏ, landscape-first, map đặc nhưng không lớn, session 5–15 phút, input tối giản, và mỗi vòng chơi làm ngôi làng thay đổi thấy được.**

Điểm cần tối ưu không phải số lượng feature mà là:
1. time-to-play;
2. clarity của input;
3. frame-time trên mobile;
4. network payload ban đầu;
5. world density;
6. village transformation;
7. bản sắc Việt có silhouette rõ.

---

# 1. Bằng chứng từ nền tảng web game hiện tại

## CrazyGames

Tài liệu gameplay/technical hiện tại nêu:
- game phải đọc được trên các viewport desktop, mobile và tablet;
- physics phải nhất quán trên các màn 60/144/165Hz;
- nếu hỗ trợ mobile thì cần mouse/keyboard/touch phù hợp;
- game nên đưa người mới vào gameplay ngay, nếu không thì tối đa 1 click;
- để đủ điều kiện mobile homepage, initial download <= 20MB;
- landscape là format chuẩn được hỗ trợ rõ ràng cho 3D game.

Nguồn:
- https://docs.crazygames.com/requirements/gameplay/
- https://docs.crazygames.com/requirements/technical/

## Poki

Poki yêu cầu:
- desktop + mobile + tablet;
- responsive 16:9;
- mobile control scheme phải được dùng trên tablet;
- incognito phải chơi được;
- bundle dependencies/assets phù hợp policy;
- gameplayStart chỉ sau input đầu tiên;
- gameplayStop khi pause/menu/cutscene/level end;
- onboarding nên rất ngắn.

Nguồn:
- https://developers.poki.com/guide/requirements-quality

## Web platform

Browser không vận hành giống native app:
- requestAnimationFrame chạy theo refresh rate và thường bị pause khi tab hidden;
- Pointer Events cung cấp một model chung cho mouse/touch/pen;
- Page Visibility cho phép pause simulation khi tab ẩn;
- WebAudio thường phải được create/resume từ user gesture.

Nguồn:
- https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
- https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
- https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices

---

# 2. Benchmark game web 3D đa nền tảng

## 2.1 Island Expander — 2026

Browser desktop/mobile/tablet, landscape.

Desktop:
- WASD / arrows
- mouse look
- 1–4 tools
- LMB use
- E interact

Mobile:
- joystick trái
- swipe nhìn
- nút bên phải để jump/use/interact

Điểm đáng học:
- world nhỏ, mở rộng từng phần;
- visual stylized đơn giản;
- transform world là phần thưởng nhìn thấy được;
- mobile không cố mirror toàn bộ phím PC.

Nguồn:
https://www.crazygames.com/game/island-expander

## 2.2 Island Cleanup — 2026

Browser desktop/mobile/tablet, landscape.

Desktop:
- WASD
- LMB collect/interact

Mobile:
- joystick trái
- swipe camera
- tap interact

Điểm đáng học:
- một interaction chính;
- world restoration làm progression;
- biến đổi môi trường thay cho UI progression nặng.

Nguồn:
https://www.crazygames.com/game/island-cleanup

## 2.3 Gold Rush: Gold Simulator 3D — 2026

Desktop:
- WASD
- LMB action
- tool slots
- jump

Mobile:
- left joystick
- swipe camera
- one action button
- tool icon

Điểm đáng học:
- đồ nghề nhiều nhưng interaction vẫn quy về "move + look + action";
- mobile button count thấp.

Nguồn:
https://www.crazygames.com/game/gold-rush-gold-simulator-3d

## 2.4 He is Here — 2026

Desktop nhiều phím hơn, nhưng mobile rút thành:
- joystick/drag movement;
- swipe camera;
- tap interaction.

Điểm đáng học:
- mobile không cần giữ 1:1 PC control map.

Nguồn:
https://www.crazygames.com/game/he-is-here

## 2.5 Project Gatherwood — 2026

Browser desktop/mobile/tablet, cả landscape/portrait.
Core là cozy community + mission, không yêu cầu high precision.

Điểm đáng học:
- community progress;
- short mission loop;
- cooperative/world-state fantasy rõ.

Nguồn:
https://www.crazygames.com/game/project-gatherwood-gou

---

# 3. Benchmark game ngoài web — chỉ học product design

## A Short Hike

Điểm đáng học:
- map nhỏ nhưng có nhiều đường;
- exploration tự do;
- hầu như hướng nào cũng có thứ để gặp;
- không cần open-world lớn để tạo cảm giác tự do;
- stylized graphics tạo identity mạnh với geometry đơn giản.

Nguồn:
https://store.steampowered.com/app/1055540/

## Dinkum

Core fantasy rất rõ:
- gather/hunt/fish/mine/farm
- tất cả cuối cùng giúp town phát triển.

Đây là bài học quan trọng hơn từng mechanic riêng lẻ.

Nguồn:
https://store.steampowered.com/app/1062520/Dinkum/

## Palia

NPC:
- có lịch sinh hoạt;
- questline cá nhân;
- không gian riêng;
- nghề gắn với skill;
- quest dùng để dạy mechanic trong context truyện;
- ưu tiên NPC sâu thay vì nhiều NPC vô danh.

Nguồn:
https://support.palia.com/hc/en-us/articles/7474617601428-NPCs-Relationships

## Rune Factory 5

Town life và combat được nối bằng fantasy bảo vệ cộng đồng.
Combat không tồn tại như mode riêng.

Nguồn:
https://store.steampowered.com/app/1702330/Rune_Factory_5/

## Coral Island

Nhiều hoạt động khác nhau cùng đổ về "restore island/community".
Town rank/community project giúp hành động cá nhân tạo biến đổi tập thể nhìn thấy được.

Nguồn:
https://store.steampowered.com/app/1158160/coral_island/

---

# 4. Kết luận về gameplay cho INFINIA

## 4.1 Input contract đề xuất

### Desktop

- WASD / arrows: move
- mouse drag / pointer lock: camera
- LMB hoặc E: context action
- Space: dodge
- Esc: pause

### Mobile / tablet

- left joystick: move
- swipe vùng phải: camera
- ACTION: context action
- DODGE: né

### Context Action

Không nên tách 4 nút:
- đánh
- nói
- nhặt
- dùng

Một nút ACTION thay đổi theo context:

- gần NPC: NÓI
- gần vật phẩm: NHẶT
- gần quái: ĐÁNH
- gần công trình: DÙNG
- gần điểm quest: TƯƠNG TÁC

Đây là thay đổi phù hợp nhất cho cross-platform.

## 4.2 Camera

Game hiện tại không nên bắt mobile player liên tục điều khiển cả move + camera + nhiều action.

Đề xuất:
- camera auto-follow mềm khi di chuyển;
- player swipe để override;
- POI/quest/NPC có camera assist nhẹ;
- combat ưu tiên giữ mục tiêu trong frame;
- không lock-on cứng nếu chưa thật sự cần.

## 4.3 Combat

Phù hợp web/mobile:

> READ TELEGRAPH -> MOVE/DODGE -> ACTION -> RECOVERY

Quái thường:
1. acquire;
2. wind-up rõ;
3. attack;
4. recovery.

Boss:
1. big readable cue;
2. danger area;
3. dodge window;
4. punish window.

Tránh:
- precision aiming;
- parry 100–150ms;
- 6 skill buttons;
- combo 20 hit;
- animation cancel phức tạp;
- camera shake nặng.

## 4.4 Exploration

Không mở map to hơn trước khi tăng density.

Internal rule đề xuất:

> Trong khu gameplay chính, người chơi không nên chạy 20–30 giây mà hoàn toàn không thấy POI, NPC, resource, environmental story hoặc decision.

Map nên là hub + spokes:

- cổng làng
- đình/sân đình
- giếng/cây đa
- ruộng tây
- ao đông
- rừng tre bắc
- đồng cỏ nam

Các vùng nhỏ kết nối trực tiếp với hub.

## 4.5 Session loop

Loop phù hợp web:

LÀNG
-> NPC / VẤN ĐỀ
-> RA VÙNG NHỎ
-> ACTION / COMBAT / MINIGAME
-> GIẢI QUYẾT
-> QUAY VỀ
-> LÀNG THAY ĐỔI
-> SAVE / NEXT HOOK

Target session:
- micro activity: 30–90 giây
- quest: 4–8 phút
- full session: 8–15 phút

Browser user có thể rời tab bất cứ lúc nào nên quest cần checkpoint tự nhiên.

## 4.6 Page lifecycle

Bắt buộc:
- visibilitychange hidden -> pause simulation + pause audio;
- pagehide -> save;
- visible -> show "tap to resume" nếu session bị pause lâu;
- không cho NPC/quái tiếp tục gây sát thương khi tab hidden.

## 4.7 Fixed timestep

Simulation không được dựa trực tiếp vào số frame.

Recommended:
- fixed update 30/60/120Hz tùy engine budget;
- render interpolation;
- cap accumulated catch-up;
- không simulation hàng phút khi tab quay lại.

---

# 5. Art direction phù hợp nhất

Tên working direction:

# VIETNAMESE STORYBOOK DIORAMA

Không photoreal.
Không generic low-poly pack.
Không voxel.
Không anime-fantasy generic.

Mục tiêu:

> Nhìn screenshot 2 giây phải nhận ra "làng Việt", ngay cả khi không có chữ.

## 5.1 Visual pillars

### Silhouette

Landmark:
- cổng làng;
- cây đa;
- đình mái ngói;
- giếng;
- lũy tre;
- hàng cau;
- ao sen;
- ruộng lúa;
- nhà 3 gian / 5 gian.

### Palette

Day:
- vàng đất / vôi cũ;
- đỏ ngói;
- xanh lúa;
- xanh tre;
- nâu gỗ;
- xanh nước ao;
- trời cyan nhẹ.

Night:
- xanh indigo dịu;
- lantern amber;
- window warm;
- không neon.

### Material

Stylized:
- màu phẳng + gradient nhẹ;
- baked AO;
- painted roughness;
- texture atlas nhỏ;
- vertex colors;
- detail bằng normal/roughness chỉ ở asset quan trọng.

Không cần shader realism nặng.

---

# 6. Reference thật về làng Việt

Nguồn VOV/Vietnam Tourism cho thấy các thành phần lặp lại:

- village gate;
- banyan tree;
- communal house;
- village well;
- ponds;
- bamboo boundary;
- brick alleys;
- houses + yards + gardens;
- tiled roofs;
- temple/pagoda/clan houses.

Đường Lâm:
- nhà 3/5 gian;
- mái ngói phủ rêu;
- sân gạch;
- giếng;
- tường đá ong;
- hệ đình/chùa/cổng/đền/đường làng hài hòa.

Nguồn:
- https://vovworld.vn/village-life/the-structure-of-a-traditional-viet-village-1450379.vov5
- https://vovworld.vn/colorful-vietnam-vietnams-54-ethnic-groups/structure-of-traditional-viet-village-1122285.vov5
- https://nongthon.vietnamtourism.gov.vn/lang-co-duong-lam-khong-gian-di-san-giua-long-vung-que-bac-bo/

## Map implication

Không rải asset ngẫu nhiên.

Proposed spatial grammar:
- main gate -> main road -> communal house;
- well/pond/banyan near social center;
- connected brick/earth alleys;
- houses grouped with yards/gardens;
- bamboo edge creates boundary;
- fields outside settlement core.

Game navigation và cultural authenticity có thể dùng cùng một layout.

---

# 7. WebGL graphics research

## 7.1 WebGL2 là baseline chính

WebGPU hiện vẫn được MDN đánh dấu Limited availability.
Do đó không nên dùng WebGPU làm hard dependency nếu muốn Chrome Android + Safari + Firefox + portal compatibility.

WebGPU có thể:
- experiment sau;
- optional backend;
- không block release.

Nguồn:
https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API

## 7.2 Draw calls

Three.js InstancedMesh được thiết kế để giảm draw calls khi nhiều object dùng cùng geometry/material.

WebGL best practices cũng khuyến nghị batch draw calls.

Áp dụng:
- grass: instanced
- rice: instanced clusters
- bamboo: instanced by species/LOD
- lantern: instanced
- fence: merged/instanced
- roof tiles: không model từng viên; texture/normal hoặc baked geometry group

Nguồn:
- https://threejs.org/docs/pages/InstancedMesh.html
- https://threejs.org/manual/pages/optimize-lots-of-objects.html
- https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices

## 7.3 Texture

KTX2Loader/Basis:
- transcode sang compressed GPU texture phù hợp thiết bị;
- giảm GPU memory bandwidth;
- phù hợp mobile.

Three.js GLTFLoader hỗ trợ KHR_texture_basisu và EXT_meshopt_compression.

Nguồn:
- https://threejs.org/docs/pages/KTX2Loader.html
- https://threejs.org/docs/pages/GLTFLoader.html

## 7.4 GPU memory

Không được đánh giá texture chỉ bằng file PNG/JPG trên network.

Three.js manual lưu ý texture 1024x1024 có thể tốn khoảng nhiều MB khi uncompressed trong GPU memory.

Cần:
- texture atlas;
- KTX2;
- dispose zone cũ;
- theo dõi renderer.info;
- không giữ mọi vùng/boss/model trong RAM cùng lúc.

Nguồn:
- https://threejs.org/manual/pages/cleanup.html
- https://threejs.org/manual/pages/how-to-dispose-of-objects.html

## 7.5 Dynamic resolution

MDN WebGL best practices đề xuất render vào back buffer nhỏ hơn rồi upscale khi cần speed.

Auto Quality nên giảm theo thứ tự:

1. internal render scale
2. shadow resolution
3. shadow casters
4. foliage distance/density
5. particle count
6. decorative lights
7. far-detail geometry

Không nên đầu tiên giảm gameplay entities.

---

# 8. Lighting budget

Recommended default:

## Mobile Medium
- 1 DirectionalLight sun
- 1 Hemisphere/Ambient
- sun shadow only
- lantern fake emissive/glow
- blob/contact shadow cho entity xa

## Low
- no dynamic character shadow
- sun shadow rất nhỏ hoặc off
- baked/AO + blob shadow
- no postprocess

## High
- sun shadow cao hơn
- một số local light có giới hạn
- vẫn không xây world bằng nhiều realtime PointLight

---

# 9. Foliage

Không dùng foliage kiểu mỗi lá là alpha card dày đặc.

Mobile cost lớn vì:
- overdraw;
- texture sampling;
- sorting/blending.

Preferred:
- opaque canopy blob;
- leaf cluster geometry;
- instanced grass clusters;
- alpha-cutout có giới hạn chỉ cho asset cần thiết.

Cây đa/tre/cau phải khác nhau bằng silhouette trước, texture sau.

---

# 10. Model & asset pipeline

Proposed pipeline:

Blender / asset source
-> clean mesh
-> atlas
-> baked AO
-> GLB
-> mesh optimization
-> KTX2 textures
-> zone packs

Không base64 mọi asset vào standalone forever.

Single-file vẫn hữu ích cho:
- prototype;
- demo;
- offline artifact.

Production web nên hỗ trợ:
- browser cache;
- progressive load;
- lazy zone assets.

---

# 11. Network budget đề xuất cho INFINIA

Platform hard reference:
- CrazyGames mobile homepage: initial <=20MB.

Internal target nên nghiêm hơn:

## Boot pack
Target <= 8MB compressed network.

Chứa:
- shell;
- engine;
- player;
- village hub LOD;
- 3–5 NPC đầu;
- audio core;
- quest đầu.

## Secondary preload
<= 4–6MB sau khi gameplay đã bắt đầu:
- additional NPC;
- combat asset;
- outer village areas.

## Lazy zone
load khi gần transition:
- forest;
- cave;
- future region;
- boss-specific assets.

Goal:
player không chờ vùng mà họ chưa nhìn thấy.

---

# 12. Frame-time budget

Dùng frame-time, không chỉ FPS.

## Mobile baseline
30 FPS stable:
- total frame <= 33.3ms

## Desired
60 FPS:
- total frame <= 16.7ms

Test bằng p95/p99 thay vì chỉ average.

Proposed targets:

### Mobile Low
- p95 <= 33ms
- DPR/internal scale khoảng 1.0
- minimal shadows

### Mobile Medium
- p95 <= 33ms
- internal scale 1.0–1.5
- sun shadow
- medium foliage

### Desktop
- 60 FPS target nếu device đủ;
- dynamic quality vẫn có.

Không hardcode DPR=2 cho mọi mobile.

---

# 13. Quality Auto

AUTO nên là default.

Startup:
1. render representative scene trong 3–5 giây;
2. đo moving p95 frame time;
3. giảm/tăng tier có hysteresis;
4. không đổi tier liên tục.

Runtime:
- nếu p95 xấu kéo dài: giảm render scale;
- nếu vẫn xấu: shadows;
- rồi foliage;
- rồi particles.

Quality setting:
AUTO / LOW / MEDIUM / HIGH.

---

# 14. UI / orientation

## Canonical mode

Landscape là gameplay canonical cho third-person 3D.

Lý do:
- camera + movement;
- left joystick;
- 2 action buttons;
- dialogue;
- world visibility.

Portrait:
- support như fallback;
- hoặc yêu cầu rotate trên portal hỗ trợ orientation;
- không cần cố đạt feature parity bằng UI nhồi chật.

## Touch targets

Giữ vùng chạm lớn, không dựa vào icon nhỏ.
Pointer Events cho phép cùng input architecture cho mouse/touch/pen.

---

# 15. Cái nên KEEP / REWORK / STOP trong Infinia

## KEEP

- NPC có tên;
- NPC schedule;
- day/night;
- friendship;
- quest;
- fishing;
- delivery;
- boss pattern;
- dodge;
- contextual exploration;
- village board;
- save;
- InstancedMesh/LOD;
- mobile joystick;
- Vietnamese setting.

## REWORK

### Combat
Từ RPG button-heavy -> telegraph + action + dodge.

### UI
Từ nhiều nút chức năng -> context action.

### Progression
Từ XP/number-centric -> visible village change + relationship/story.

### Map
Từ "open world sẽ mở rộng" -> compact dense village + zones.

### Art
Từ "asset càng chi tiết càng tốt" -> stylized cultural silhouette trong performance budget.

### Asset delivery
Từ single-file production -> boot pack + deferred packs.

## STOP FOR NOW

- thêm skill bar;
- nhiều quái chỉ để tăng variety;
- vùng mới trước khi hub đủ dense;
- model high detail không có budget;
- shader/postprocess nặng;
- nhiều point lights;
- texture 2K/4K đại trà;
- realtime reflection;
- simulation background khi tab hidden;
- feature mới chỉ vì game khác có.

---

# 16. Vertical Slice phù hợp nhất để kiểm research

Không nên build thêm 20 system.

Build một slice 8 phút:

1. spawn gần cổng làng;
2. gặp Bà Lụa / Cụ Chánh Tín;
3. thấy một vấn đề của làng;
4. đi từ đình/giếng ra ao/ruộng;
5. 1 gathering interaction;
6. 1 combat encounter có telegraph;
7. 1 context interaction;
8. quay về;
9. một landmark của làng thay đổi rõ;
10. NPC đổi thoại.

Slice phải chạy:
- desktop keyboard/mouse;
- Android touch;
- tablet touch;
- landscape;
- browser pause/resume.

Nếu slice này không vui, không mở rộng content.

---

# 17. Test matrix đề xuất

## Desktop
- Chrome 1920x1080
- Chrome 1366x768
- Firefox
- Edge

## Mobile
- Android Chrome 800x450-ish landscape
- Android medium-tier physical device
- Android low tier nếu có
- iPhone Safari landscape

## Tablet
- touch scheme bắt buộc
- 1080x607-ish

## Test cases
- cold load
- second cached load
- incognito
- rotate
- background/foreground tab
- memory after 20 minutes
- dialogue
- combat
- boss
- day/night transition
- repeated zone enter/exit

---

# 18. Metrics mới nên đo

Technical:
- initial bytes;
- time to first playable;
- p50/p95/p99 frame time;
- draw calls;
- triangles;
- texture count;
- geometry count;
- shader/program count;
- JS heap trend;
- WebGL resource trend;
- input-to-visible-response;
- long tasks.

Gameplay:
- seconds to first action;
- quest completion time;
- idle/travel-with-nothing time;
- combat fail cause;
- retry/resume;
- interaction count/session;
- percentage player seeing village transformation.

---

# 19. Quy tắc phát triển mới đề xuất

Một feature chỉ nên vào production khi trả lời được ít nhất một:

1. Nó làm village fantasy rõ hơn?
2. Nó làm 5–15 phút chơi thú vị hơn?
3. Nó làm ngôi làng thay đổi rõ hơn?
4. Nó tăng depth của NPC hiện có?
5. Nó làm input cross-platform tốt hơn?
6. Nó tăng visual identity trong cùng performance budget?

Nếu không:
LATER hoặc CUT.

---

# 20. Kết luận

Research không ủng hộ hướng "càng nhiều RPG system + càng nhiều asset chi tiết = game web tốt hơn".

Nó ủng hộ:

> **compact, dense, stylized, landscape-first, contextual controls, short meaningful loops, visible world transformation, Vietnamese silhouette, aggressive performance budgeting.**

Đây là hướng phù hợp nhất để INFINIA có thể vừa:
- có bản sắc;
- chạy web;
- chạy mobile;
- đủ nhẹ cho portal;
- và vẫn có khả năng phát triển lâu dài.
