# INFINIA — Chế độ tự phát triển 24/24 (AUTO_DEV)

Hoàng duyệt ngày 2026-10-06: Thunder tự chạy vòng lặp phát triển liên tục, mỗi vòng
làm 1 nâng cấp → kiểm chứng → đưa lên link chơi thử. Không cần Hoàng bấm gì.

## Luật sắt (không bao giờ phá)

1. Mọi việc nằm trong 20 quyết định Phase 0 đã chốt + decision log
   (`docs/KE_HOACH_PHAT_TRIEN.md`). Đổi hướng sản phẩm → phải có chữ của Hoàng.
2. Không đụng: tiền thật, dữ liệu thật, multiplayer, port Unity/mobile
   (chỉ sau khi 10 người chơi thử web xác nhận "vui"), asset có bản quyền.
3. Mỗi vòng: `node --check` + tests phải xanh mới được build link.
   Fail 2 vòng liên tiếp → dừng vòng lặp, báo Hoàng, không tự sửa vòng 3.
4. Bản public luôn build bằng `python3 ~/workspace/infinia/build-standalone.py`
   (single-file, không CDN, không module, store trong phiên).
5. Cập nhật artifact `infinia` qua `artifact.edit` + `artifact.send_input`
   trỏ đúng file `~/workspace/infinia-standalone-v2/index.html`.
6. Ghi changelog bên dưới sau mỗi vòng. Nhắn Hoàng ngắn gọn khi có version
   mới đáng kể; gộp nhiều vòng nhỏ thành một tin, đừng spam.

## Cách một vòng chạy (cron `infinia-auto-dev`, mỗi giờ chạy một phiên ~50 phút làm nhiều vòng nối nhau)

1. Đọc file này (backlog + changelog + scorecard) và docs:
   `docs/CO_CHE_GAME.md`, `docs/KE_HOACH_PHAT_TRIEN.md` (decision log),
   `~/workspace/research/game-dev-library/05-do-hoa-web-game.md`.
2. Lấy item backlog đầu tiên chưa xong → spawn 1 dev agent làm trong
   `~/workspace/infinia/` (module version), comment tiếng Việt, giữ gameplay cũ.
3. Kiểm chứng: `node --check app.js`, chạy tests, serve HTTP 200.
4. Build standalone bằng script, `artifact.edit` + `artifact.send_input`,
   chờ build xong, present card khi có version đáng kể.
5. Tự chụp ảnh kiểm tra visual (bắt buộc mỗi vòng, như Emberfall/Bruno Simon vẫn làm):
   `node tools/screenshot.js` → 3 ảnh day/night/combat trong `review/auto-<giờ>/`.
   MỞ ẢNH RA XEM THẬT (dùng muse.read): so với ảnh vòng trước, có regression không
   (màn đen, mất NPC/quái, vỡ hình, chữ xấu...). Có regression → fix ngay trong vòng này,
   không publish bản lỗi. Ghi 2-3 dòng nhận xét vào changelog.
6. Cập nhật: backlog (đánh dấu xong), changelog, bảng so sánh.

## Backlog (làm từ trên xuống; mỗi vòng 1 item)

> ✅ **GỠ CHẶN PUBLISH 2026-10-07: V1 (nhãn tên NPC) + V1b (góc camera tool) đã xong — các vòng sau được publish bình thường.**
> (Chặn cũ 2026-10-06: không đẩy bản mới lên link cho tới khi V1 + V1b xong — điều kiện đã đủ.)

### Đồ họa — CHỈ ĐẠO MỚI CỦA Hoàng 2026-10-07: nâng ĐỒ HỌA lên ĐẸP NHẤT + TỐI ƯU TỐC ĐỘ
> Lưu ý: chỉ đạo này nới lỏng quyết định Phase 0 số 4 ("giữ procedural đến hết Alpha") — Hoàng duyệt bằng lời 2026-10-07. Ràng buộc còn giữ: ngân sách portal B1 (file <2MB, load <10s), bản quyền (chỉ dùng asset free CC0 hoặc tự tạo).
> ⚠️ ƯU TIÊN SỐ 1 (Hoàng 2026-10-07 ~10:25): nâng cấp đồ họa CHI TIẾT bằng model 3D thật — G5a→G5f làm theo thứ tự, mỗi bước đo file size + FPS, giữ <2MB.
- [x] G5a: **Cây CC0** — **xong 2026-10-07 (vòng 12:11, publish v9)**: tải Kenney Nature Kit (CC0), "nướng" 6 model GLB về 1 mesh/primitive (tools/prepare-tree-assets.py), embed base64 qua tools/embed-models.py → assets-embedded.js (128KB), build-standalone.py inline vào single-file; js/world.js: L0 gần vẽ bằng 6 InstancedMesh GLB (vertexColors, đổ bóng), L1/L2 giữ cơ chế G2, tre giữ procedural + fallback g5aReady=false; build 1114656 bytes <2MB ✅; draw calls day 153→163 (+10); 85/85 tests g5a-trees pass, tổng 986/986 xanh; ảnh day/night không regression (cây đa dạng rõ: tròn/thông/cau)
- [ ] G5b: **Nhân vật Quaternius** — Ultimate Animated Character Pack (CC0, animation đi/đứng sẵn có): thay player + 25 NPC (giữ nón lá + nhãn tên tiếng Việt); đo file size sau khi thêm
- [ ] G5c: **Nón lá + props tự làm** — nón lá, đèn lồng, giỏ tre, chum nước (Blender hoặc procedural nâng cao); thay props hộp cơ bản hiện tại
- [ ] G5d: **Nhà Kenney Town Kit** (CC0) — thay 6 nhà procedural bằng nhà có chi tiết (mái ngói, cửa, hiên); giữ vị trí 6 nhà theo MAP-DESIGN
- [ ] G5e: **Quái Quaternius monsters** (CC0) — thay 6 quái hiện tại (4 cũ + Dơi Sương Đêm + Cua Đá Già) bằng model có hồn hơn
- [x] G5B-a: **Cây chi tiết + texture** — **xong 2026-10-07 (vòng 12:45, publish v10)**: texture vỏ/lá tự vẽ bằng canvas 128×128 (vân vỏ dọc + đốm lá, seeded deterministic — 0 byte asset, không bản quyền), UV thủ tục cho model GLB nướng (gán map lên material GLB nhân với vertexColors), tán lá thêm 2 lớp canopy blob phụ ở L0 (màu lá đa dạng theo seed, tre bỏ qua); giữ LOD G2 + tre procedural + fallback g5aReady=false; block [G5B-A-TESTABLE-*] trong js/world.js; 63/63 tests g5b-trees pass, tổng 1165/1165 xanh; build 1139333 bytes (<8MB ngân sách hướng B ✅, +24KB so với v9); draw call +2 tối đa; ảnh day/night/combat không regression (thân cây có vân, tán đầy hơn)
- [ ] G5B-b: **Nhân vật chi tiết** — thay Quaternius low-poly bằng model chi tiết hơn (Poly Pizza / Sketchfab CC-BY / tự làm Blender): mặt mũi, quần áo có texture, giữ nón lá + nhãn tên
- [ ] G5B-c: **Nhà chi tiết — PHẢI là nhà ngói đỏ Việt Nam** (Hoàng 2026-10-07: bối cảnh hiện tại không phải của VN) — mái ngói có texture, tường gạch, cửa gỗ chi tiết; thay 6 nhà hiện tại
- [ ] G5B-d: **Quái chi tiết** — 6 quái có texture, nhìn "có hồn" hơn khối hiện tại
- [ ] G5B-e: **Props + môi trường** — đèn lồng giấy có họa tiết, giỏ tre đan, chum sành, hàng rào tre chi tiết
- [ ] G5B-f: **Kiểm tổng hướng B** — file <8MB, có màn hình loading đẹp, 30fps+ trên Android tầm trung (mục tiêu mới, nới từ 60fps); điện thoại yếu chấp nhận lag nhẹ; screenshot so sánh v9→mới

## V — Bản sắc Việt (ưu tiên cao, Hoàng yêu cầu 2026-10-07 ~13:07: "bối cảnh hiện tại ko phải của VN")
- [ ] V1: **Lũy tre bao quanh làng** — hàng tre dày đặc, biểu tượng làng quê VN không thể thiếu
- [ ] V2: **Ruộng lúa + ao sen** — ruộng bậc nước có phản chiếu, ao làng hoa sen
- [ ] V3: **Cổng làng + đình làng** — cổng tam quan, nhà đình mái cong
- [ ] V4: **Nhà ngói đỏ + sân gạch + giếng nước** — thay toàn bộ nhà chóp generic
- [ ] V5: **Trâu, gà, chó** — con vật làng quê (trâu đứng ruộng, gà chạy sân)
- [ ] V6: **Cây chủ đạo VN** — tre, cau, đa, dừa làm cây chính quanh làng; bỏ cây thông khỏi khu làng
- [ ] V7: Research agent — sưu tầm ảnh/video làng quê VN thật (làm reference art direction), ghi vào docs/
 — file <8MB, có màn hình loading đẹp, 30fps+ trên Android tầm trung (mục tiêu mới, nới từ 60fps); điện thoại yếu chấp nhận lag nhẹ; screenshot so sánh v9→mới
- [ ] G5f: **Kiểm tổng đồ họa** — file <2MB, load <10s, 60fps Android tầm trung; chụp ảnh so sánh trước/sau từng bước; regression → rollback bước đó
- [ ] G5: đánh giá + adopt model free CC0 (Quaternius / Kenney) hoặc tự tạo bằng Blender cho NPC/quái/cây — từng bước, đo kích thước file mỗi lần thêm
- [ ] G6: so sánh đồ họa định kỳ với game khác để biết vị trí (mở rộng bảng so sánh, có ảnh chụp cạnh nhau)
- [ ] T1: tối ưu tốc độ — đo thời gian load thật + FPS preset Vừa, mục tiêu load <10s mạng 3G, 60fps Android tầm trung
- [ ] P-SONGSONG: từ nay mỗi vòng chạy 2–3 dev agent + 1 research agent song song, chia vùng code không giẫm chân nhau (theo chỉ đạo 2026-10-07)
- [x] G1: bloom giả (sprite glow) có toggle, vì r149 UMD không có UnrealBloomPass — **xong 2026-10-06**: 18 sprite glow additive (6 đèn lồng, mặt trời/mặt trăng, 8 đom đóm, 3 flash pool cho chém/trúng đòn/lên cấp/nhặt), texture gradient dùng chung, phím B + nút ✨ Bloom bật/tắt (mặc định bật), preset Thấp tắt bloom; tests 24/24
- [x] G2: LOD cho cây/cỏ theo khoảng cách camera — **xong 2026-10-06**: cây 3 bucket (full/đơn giản/cull, hysteresis ±5m, ngưỡng theo preset 30/60 Thấp – 50/100 Cao), cỏ/hoa chỉ hiện trong tầm gần, refresh throttle 0.4s; cây ~7800→4300 tris ở góc làng điển hình, cỏ 26000→4600 tris, giảm shadow pass; tests 60/60
- [x] G3: NPC đa dạng hơn (mũ/tóc/dáng, thêm 5 NPC mới có tên theo COT_TRUYEN) — **xong 2026-10-06 (v6c)**: 25 NPC (20+5 mới: Cụ Chánh Tín, Chú Sáu Búa, Cô Lan Thảo, Chú Tư Lưới, Anh Hai Ruộng — vị trí nhà cố định, 2 câu thoại đúng tính cách COT_TRUYEN); ngoại hình deterministic theo seq: 4 loại mũ (nón lá/khăn đóng/mũ rơm/không đội), 4 màu tóc (đen/hoa râm/bạc/nâu), 3 kiểu tóc (ngắn/dài/hói), dáng cao-thấp-gầy-mập qua scale per-instance; 3 InstancedMesh mới (iHat/iHatWrap/iHair) → +3 draw calls; NPC trông khác nhau rõ, tay chân vẫn animation; tests 301/301 (mới tests/g3-npc.test.mjs), node --check xanh, serve HTTP 200; screenshot 3 cảnh day/night/combat không regression (cây che nửa khung ảnh day/combat là vị trí camera tool, không phải lỗi game)
- [x] V1: nhãn NPC hiện TÊN (Bà Lụa, Bà Tám Xén...) thay vì "ID(x,x,x,x)"; chỉ hiện khi gần <8m — **xong 2026-10-07 (chưa publish — còn chặn tới khi V1b xong)**: block testable [V1-TESTABLE-*] (npcLabelText/npcLabelVisible, V1_LABEL_DIST=8); drawLabel nền pill mờ + chữ sans-serif đủ dấu tiếng Việt, tự thu nhỏ nếu tên dài; updateLabels() mỗi 0.5s chỉ vẽ lại khi tên đổi, NPC vô danh (seq≥9) không nhãn; hook ?shot=day dời player về gần Bà Lụa (6,12) để kiểm chứng; 24/24 tests V1 pass, tổng 325/325 tests xanh; build OK 858757 bytes; screenshot ?shot=day: "Bà Lụa" + "Bà Tám Xén" hiện rõ tên, không còn ID(...) — nhãn "Bà Lụa" hơi bị tán cây che (thuộc phạm vi V1b)
- [x] V1b: sửa góc camera tool screenshot (?shot=day/combat) — đang bị cây che nửa khung hình — **xong 2026-10-07 (chưa publish)**: block testable [V1b-TESTABLE-*] (segDist2/shotBlocksView, V1B_CLEAR_R=6); hook ?shot= dọn mọi cây trong hành lang rộng 6m quanh đoạn camera→player (dời ra +10000 rồi refreshTreeLOD — chỉ trong phiên chụp, layout làng + spawn chơi thật giữ nguyên); combat: quái bất tử (hp=9999) + ghim đứng yên 2.2m bên cạnh player (shotPin bỏ qua đuổi/cắn) + đòn cuối ghim vệt chém hiện tĩnh trước SHOT_READY 0.1s → ảnh luôn thấy quái + vệt chém, không còn may rủi thời điểm; kẹp thanh HP quái 0–1 trong drawMonsterHP; 20/20 tests V1b pass, tổng 345/345 tests xanh; build OK 867233 bytes; screenshot 3 cảnh: day (nhãn "Bà Lụa"/"Bà Tám Xén" đọc rõ, không cây che), night (đèn lồng + sao + đom đóm, không cây che), combat (quái + thanh HP đỏ + vệt chém trắng, không cây che) — không regression
- [ ] G10: bố trí lại map làng theo docs/MAP-DESIGN.md — BẢN VẼ ĐÃ XONG 2026-10-07: hub giếng làng (0,0) + sân đình + cây đa; 6 nhà gắn NPC theo nghề; 4 khu (tây ruộng, đông ao, bắc rừng tre, nam đồng cỏ); cây theo cụm 5–12; 5 landmark chống lạc; giữ ~150 cây + đường texture 0 draw call (chuẩn portal nhẹ)
- [x] G9: pipeline embed model GLB — **xong 2026-10-07**: tools/embed-models.py + test (17/17 pass); thử với 4 file mẫu: 154KB → 206KB sau base64 (+33.7%); tổng game + models ~1.07MB < 2MB ngân sách ✅; bước tiếp: sửa build-standalone.py inline assets-embedded.js rồi thay model theo thứ tự cây → nhân vật → nón lá → nhà → quái
- [x] G8: art direction môi trường — **xong 2026-10-07 (vòng 07:56, publish v8, procedural — chưa dùng model CC0)**: 4 kiểu cây silhouette (thường/cau/cây đa tán rộng/thông, tỉ lệ 50/20/15/15, deterministic theo vị trí), decor quanh nhà (hàng rào tre, chậu hoa, dây phơi có vải đung đưa); tái dùng InstancedMesh, trong ngân sách draw call; block testable [G8-TESTABLE-*], 58/58 tests pass; ảnh day/night xác nhận cây đa dạng, không regression
- [x] G4: upgrade Three r149 → r186 (ES modules + importmap; sửa cả build script) — **xong 2026-10-07 (v6d)**: vendor/three.module.r186.js mới (three.r149.min.js giữ backup), index.html dùng importmap; điều chỉnh lại sun/hemi ×π và đèn lồng cho khớp ánh sáng bản r149; tests 301/301, node --check xanh, build standalone 857KB OK; screenshot review/auto-g4/ không regression; đã publish lên link chơi thử theo yêu cầu trực tiếp của Hoàng ("link mo") lúc 00:05

### Gameplay (theo CO_CHE_GAME, không vượt scope MVP)
- [x] P1: quest 2 "Giúp Bà Tám Xén" (nhặt 5 bó rau dại quanh làng) — **xong từ vòng trước, kiểm chứng + tick 2026-10-07 (vòng 12:11)**: openShop() → p1BaTamQuest() idempotent; máy trạng thái none→active→done; tracker "rau dại x/5"; save migrate an toàn; tests p1-quest2 pass
- [x] P2: 2 loại quái mới — **xong 2026-10-07 (vòng 07:56, publish v8)**: "Dơi Sương Đêm" (bay lơ lửng, chỉ ra ban đêm 0.55–0.95, trời sáng bay về hang không rớt đồ, lao xuống cắn — né được) và "Cua Đá Già" (mai đỏ gạch, đánh mặt trước chỉ còn 40% dmg, toast dạy vòng ra sau lưng); mỗi loại 1 mẫu hình riêng (D6 Koster); spawn 4 Quái Vẩn + 2 dơi + 2 cua; block testable [P2-TESTABLE-*] trong js/utils.js + logic trong js/combat.js, 43/43 tests pass
- [ ] P3: boss mini đầu tiên "Vũng Thiu Mẹ" ở ao đông (theo tone ấm áp, không máu me)
- [ ] P4: câu cá ở ao (minigame đơn giản, đúng chất làng quê)
- [x] P5: NPC có lịch sinh hoạt theo giờ ngày/đêm (tối về nhà, sáng ra đồng) — **xong 2026-10-07 (vòng 12:45, publish v10)**: 9 NPC có tên mỗi người có vị trí "nhà" + "chỗ làm" theo nghề COT_TRUYEN (Bà Lụa→giếng làng, Cu Tít→đồng cỏ, Ông Đồ Nho→sân đình, Cụ Chánh Tín→đình, Chú Sáu Búa→lò rèn, Cô Lan Thảo→vườn thuốc, Chú Tư Lưới→bến Phúc, Anh Hai Ruộng→ruộng tây; Bà Tám Xén đứng hàng xén); 6h đi bộ ra chỗ làm, 18h đi bộ về nhà (không teleport, xa >60m đi nhanh ×3); tương thích F4 (NPC xa 10Hz vẫn đổi ca đúng); block [P5-TESTABLE-*] trong js/actors.js; 53/53 tests p5-schedule pass, F4/P1/R112/V1/G3 không regression
- [ ] P6: 10 quest làng theo docs COT_TRUYEN (làm dần, mỗi vòng 1-2 quest)

### So sánh & polish
- [x] C1: cập nhật bảng so sánh sau mỗi 2 vòng (xem dưới) — đã cập nhật 2026-10-06 cùng v6c (NPC đa dạng, draw calls ~126)
- [x] C2: màn hình title/help tiếng Việt khi mới vào game — **xong 2026-10-07 (vòng 07:56, publish v8)**: title screen với tagline L4 ("Game làng Việt 3D — kết bạn, đánh quái, xây làng"), 4 dòng help có icon (di chuyển/đánh/né/nói chuyện), nút "▶ Chơi ngay" ≥48px, dòng việc đầu tiên L5 ("nói chuyện với trưởng làng"); block testable [C2-TESTABLE-*] trong js/ui.js, 36/36 tests pass
- [x] C3: âm thanh procedural (WebAudio, không file ngoài): chém, nhặt, nhạc nền đơn giản — **xong từ vòng trước, kiểm chứng + tick 2026-10-07 (vòng 12:11)**: js/audio.js block [C3-TESTABLE-*] (map nốt ngũ cung, envelope ADSR, giai điệu, toggle 🔊/🔇); initAudio() ở main.js, audioTick trong game loop; tests c3-audio pass

### Mobile — CHỈ ĐẠO CỦA HOÀNG 2026-10-07: "phải thiết kế làm sao để chơi được trên đt"
Nguyên tắc: mobile là nền tảng chính (70% traffic game web từ mobile), mọi tính năng mới phải chơi được bằng ngón tay cái trước.
- [x] M1: fix mờ trên đt — preset Vừa dpr 1.5→2 (2026-10-07, theo báo lỗi trực tiếp của Hoàng)
- [x] M2: nút chạm mobile (theo research 07-mobile-ux.md K1/K2): mọi nút ≥48×48px cách nhau ≥8px; nút Đánh 68px, Né 56px; joystick floating Ø120–140px góc trái-dưới; Đánh to nhất góc phải-dưới — **xong 2026-10-07 (vòng 12:11, publish v9)**: block [M2-TESTABLE-*] trong js/ui.js (m2Layout/hit/gap/clamp); layout chỉ thiết bị chạm (desktop giữ nguyên); joystick floating hiện tại điểm chạm vùng trái-dưới, tap lên nút thật không bị cướp; phản hồi chạm scale 0.92 trong 80ms; 47/47 tests m2-touch pass; nút Nói 72→56px để giữ "Đánh to nhất"
- [x] M3: HUD gọn cho màn 360px (K3) — **xong 2026-10-07 (vòng 12:45, publish v10)**: 5 nút top (Inventory/Status/Control/Fly/Debug) gom vào 1 nút ☰ ≥48px mở panel trượt (đóng khi tap ngoài), quest tracker 1 dòng tự ẩn sau 5s (tap hiện lại), chữ ≥12px; chỉ áp màn ≤480px/thiết bị chạm, desktop giữ nguyên; block [M3-TESTABLE-*] trong js/ui.js; 32/32 tests m3-hud pass, M2/M7/C2 không regression
- [x] M4: dọc + ngang đều chơi được — **xong 2026-10-07 (phần CSS)**: viewport-fit=cover, safe-area cho toàn bộ HUD (iPhone tai thỏ), màn dọc dialog nhích lên khỏi cụm nút, màn ngang thấp HUD thu gọn + panel cuộn trong, ẩn gợi ý phím WASD trên mobile; camera zoom +15% khi dọc (phần app.js) để vòng sau
- [ ] M5: hiệu năng máy thật (K5): ≤80 draw calls, ≥30fps sustained 5 phút ở preset Vừa trên Android tầm trung, ≤250k tris
- [ ] M6: auto-quality + phản hồi chạm (K6/K7): tự hạ dpr khi <45fps/3s, hồi khi >55fps/10s (cooldown 6s); nút phản hồi <100ms (scale 0.92/80ms) + vibrate(10); touch-action:none; multi-touch theo pointerId

### Kiến trúc (chỉ đạo Hoàng 2026-10-07: tách file để nhiều agent song song)
- [x] K1: tách app.js thành js/ modules (config, state, world, npcs, monsters, combat, daynight, ui, save, main) (config, state, world, npcs, monsters, combat, daynight, ui, save, main) — mỗi module 1 vùng trách nhiệm, import/export rõ ràng; cập nhật build-standalone.py để bản single-file vẫn chạy; verify: node --check từng module + tests xanh + screenshot không regression — XONG 2026-10-07 ~03:10 +07: 10 modules (config/utils/core/engine/world/daynight/ui/actors/combat/main), 491/491 assertions xanh, standalone file:// chạy được, 3 ảnh day/night/combat thấy nhãn NPC + FPS số (fix regression dt-clamp bằng rawDt). app.js gốc giữ tại app.js.bak.

### Hiệu năng (theo báo cáo PERF-PLAN.md 2026-10-07 — đo thực tế: 20-24fps SwiftShader, 159-166 draw calls)
- [x] F1: nhẹ shadow pass — **xong 2026-10-07 (vòng T1)**: shadow camera ±70→±40 bám player, giảm ~30–40% chi phí shadow; T1_SHADOW_HALF=40 testable, tests xanh
- [x] F2: nhãn NPC nhẹ — **xong 2026-10-07 (vòng T1)**: canvas nhãn 256×64→128×32, giảm 4× fill cost, tỉ lệ 4:1 giữ nguyên
- [x] F3: glow vừa phải — **xong 2026-10-07 (vòng T1)**: preset Vừa giảm glow đom đóm 8→4 (mắt thường không phân biệt được), Cao/Thấp giữ 8
- [x] F4: NPC xa update thưa — **xong 2026-10-07 (vòng 07:56, publish v8)**: NPC cách player >30m chỉ chạy AI 10Hz (F4_FAR_DIST=30, F4_HZ=10), NPC gần giữ 60Hz; block testable [F4-TESTABLE-*] trong js/actors.js, 16/16 tests pass
- [ ] F5: gộp nhà tĩnh (rủi ro trung bình): merge geometry 6 nhà theo 4 material — 66→4 draw calls, làm cuối + test visual kỹ

### Định vị đã chốt 2026-10-06: kịch bản B "Cozy Việt Nam đầu tiên trên portal"
- [ ] B1: ngân sách portal — file standalone <2MB, load <10s mạng 3G, 60fps máy tầm trung
- [ ] B2: mobile-first check mỗi vòng — nút đủ to, joystick mượt, HUD không che tầm nhìn
- [ ] B3: clip gameplay 15–30s/tuần (W3) — chuẩn bị từ giờ
- [ ] B4: battle pass mùa lễ Việt (thiết kế khi gameplay đã vui — sau Alpha)

### Từ đánh giá visual 2026-10-06 (có ảnh chụp thật trong `review/`, xem `review/DANH_GIA-2026-10-06.md`)
- [ ] V2: quái "con của vũng thiu" thêm mắt to/miệng/chi tiết rêu — hiện tại như quả bóng xanh
- [x] V3: mặt đất ban ngày bị trắng nhợt — **xong 2026-10-06 (fix theo yêu cầu trực tiếp của Hoàng)**:
  nắng trưa sunI 2.6→1.6, hemisphere 1.0→0.55, exposure 1.05→0.8, đất đậm màu hơn
  (cLow 0x4d8a3f→0x3d7a30, cHigh 0x8fae5a→0x74a047); đo sáng vùng đất trung tâm
  222→184; đã chụp ảnh verify + lên link.
  V3b (fix lần 2 theo phản hồi "vẫn chói" của Hoàng): vấn đề thật là THIẾU TƯƠNG PHẢN
  chứ không phải sáng tổng — hemisphere quá mạnh làm bẹt bóng đổ. Giảm hemisphere sâu
  (trưa 0.55→0.35, sáng/chiều 0.5→0.32), giữ nắng directional để tạo khối; bóng đổ
  ánh xanh lạnh vs nắng ấm. Ảnh verify: review/shot-day-contrast-fix.png
- [x] V4: FPS counter hiện "--" — **xong 2026-10-07 (vòng T1)**: fmtFps() đảm bảo luôn hiện số (NaN/Infinity→0), FPS sustained = trung bình 5s lăn ổn định
- [ ] V5: vệt chém làm vòng cung mảnh, trong suốt dần về rìa (hiện tại là mảng trắng tròn)

### Từ research thị trường 2026-10-06 (file `research/game-dev-library/06-hoc-tu-thi-truong.md` — KHÔNG xóa, KHÔNG đổi thứ tự các mục trên)
**Cơ chế học từ game thành công (mỗi item ~1 vòng):**
- [ ] M1 (học Stardew Valley): NPC/quái theo khung giờ — Bà Tám chỉ mở shop ban ngày, quái vũng thiu chỉ spawn ban đêm
- [ ] M2 (học Stardew Valley): chết phạt nhẹ — hồi sinh tại làng, mất 10% ∞ mang theo, giữ nguyên quest/XP
- [ ] M3 (học Animal Crossing): NPC nhớ người chơi — câu chào đổi theo số lần đã nói chuyện (lần 1/5/20 khác nhau)
- [ ] M4 (học Minecraft): 3 cấp cuốc/kiếm — mỗi cấp mở 1 loại tài nguyên mới đào/đánh được
- [ ] M5 (học Minecraft): quái đêm spawn gấp đôi, rơi "tinh thể đêm" chỉ dùng đổi đồ cosmetic
- [x] M6 (học Terraria): bảng "Lời hứa làng" ở đình — **code+test đã có từ vòng trước, kiểm chứng + tick 2026-10-07 (vòng 12:45)**: ghi rõ ∞ chỉ đổi trang trí, không bao giờ bán sức mạnh; block [M6-TESTABLE-*] trong js/world.js; tests m6-board pass
- [x] M7 (học Terraria): mỗi lần lên link artifact mới — hiện 3 dòng "có gì mới" bằng tiếng Việt trong game — **code+test đã có từ vòng trước, kiểm chứng + tick 2026-10-07 (vòng 12:45)**: đúng 3 dòng, mỗi dòng ≤40 ký tự, tiếng Việt 100%; block [M7-TESTABLE-*] trong js/ui.js; tests m7-news pass
- [ ] M8 (học Vampire Survivors): level-up dừng game, hiện 3 thẻ bùa ngẫu nhiên để chọn
- [ ] M9 (học Dave the Diver): phân vai ngày/đêm — ban ngày quest + trồng trọt, ban đêm quái mạnh + đồ hiếm
- [ ] M10 (học Dave the Diver): đuốc giới hạn khi vào vũng thiu ban đêm — hết đuốc quái mạnh gấp đôi
- [x] M11 (học Balatro): combo counter — **code+test đã có từ vòng trước, kiểm chứng + tick 2026-10-07 (vòng 12:45)**: đánh trúng liên tiếp hiện số combo to dần + hiệu ứng mốc 10/25/50, reset sau 3s; block [M11-TESTABLE-*] trong js/combat.js; tests m11-combo pass
- [ ] M12 (học Flappy Bird): minigame chặt tre tính giờ ở sân đình — top 5 điểm cao khắc lên bảng gỗ
**Game feel & juice (từ sách/talk chuyên sâu):**
- [ ] D1 (Schell): cân bằng 5 quái đầu theo quy tắc "3 con đầu chỉ cần 1 nút đánh, con 4–5 mới cần né"
- [ ] D2 (Schell): quest tracker luôn chỉ việc tiếp theo ngay khi xong quest — không đứng yên quá 60s
- [ ] D3 (Schell): soát các hành động còn "khô" thiếu juice (mở shop, nhận quest, nói chuyện NPC)
- [x] D4 (Swink): nút né (K) ăn ngay giữa animation đánh (hủy đòn để né), input <100ms — **xong 2026-10-07 (vòng 12:45, publish v10)**: playerDodge() hủy animation đánh ngay (atkState.t=0, tắt vệt chém), i-frame 0.4s giữ nguyên, không reset combo oan, không trừ cooldown; wiring sẵn có gọi đồng bộ từ keydown/onclick (latency ≈0ms); block [D4-TESTABLE-*] trong js/combat.js; 31/31 tests d4-dodge pass, M11/R11-1 không regression
- [x] D5 (Vlambeer/Eiserloh): screenshake theo công thức trauma — **code+test đã có từ vòng trước, kiểm chứng + tick 2026-10-07 (vòng 12:45)**: đánh trúng +0.2, bị đánh +0.4, hạ boss +0.7, có nút tắt; block [D5-TESTABLE-*] trong js/engine.js; tests d5-shake pass
- [ ] D6 (Koster): quy tắc thiết kế quái mới — mỗi loại là 1 mẫu hình mới để học, không copy đổi màu tăng máu
- [ ] D7 (Koster): màn hình hồi sinh nói rõ "học được gì" theo loại quái đã giết mình
- [ ] D8 (Nintendo): tutorial thầm lặng 5 phút đầu — đặt quái ngay đường đi bắt buộc, không bảng chữ dài
- [ ] D9 (Juice It or Lose It): mọi hiệu ứng mới code dạng công tắc bật/tắt độc lập trong menu Debug
- [ ] D10 (Juice It or Lose It): soát cặp "hình + tiếng" — mọi juice hình ảnh phải có âm thanh đi kèm
**Web & phát hành:**
- [ ] W1: rà soát tiêu chuẩn portal (file nhẹ, load <10s, chơi tốt trên mobile browser)
- [ ] W2: quy trình xuất clip gameplay 15–30s mỗi tuần từ tool screenshot (đăng TikTok/Shorts)
- [ ] W3: nút chụp màn hình trong game để người chơi khoe
**Từ research 2026-10-07 (file `research/game-dev-library/09-a-short-hike-powerwash.md` — học A Short Hike + PowerWash Simulator):**
- [ ] R9-1 (học A Short Hike): hệ "Cánh diều" mở khóa di chuyển — nhặt diều giấy/lông ngỗng rải quanh làng để mở nhảy cao hơn + lướt ngắn; khám phá được thưởng bằng khả năng đi lại. Thế nào là xong: nhặt 5 diều mở nhảy cao + lướt 3s, leo được lên đồi bắc rừng tre, có test + screenshot trước/sau
- [ ] R9-2 (học A Short Hike): NPC cho "mẹo làng" hữu ích — lần đầu bắt chuyện, mỗi NPC có tên cho 1 mẹo thật (chỗ rau hiếm, giờ quái ra, điểm câu cá tốt), lưu vào "Sổ tay làng" xem lại được. Thế nào là xong: 9 NPC có tên mỗi người 1 mẹo duy nhất, mở sổ tay xem lại được, test đủ 9 mẹo
- [ ] R9-3 (học PowerWash Simulator): quest "Rửa sạch ao làng" — chạm/giữ rửa từng mảng vũng thiu ở ao đông, mỗi mảng hiện % sạch + kêu "ting" khi 100%, nước chuyển đục→trong dần; ao sạch >50% thì quái vũng thiu yếu đi. Thế nào là xong: 6 mảng ao có % + ting riêng, nước trong dần thấy rõ trên screenshot, quái yếu đi đúng ngưỡng 50%
**Từ research 2026-10-07 (file `research/game-dev-library/11-vampire-survivors-spiritfarer.md` — học Vampire Survivors + Spiritfarer):**
- [x] R11-1 (học Vampire Survivors): **đánh tự động mặc định + đồ tự hút** — **xong 2026-10-07 (vòng 12:11, publish v9)**: quái trong 2.5m → tự vung đòn qua đúng playerAttack() (DPS bằng đánh tay, giữ cooldown/quạt 120°/combo M11); vật rơi trong 2.5m bay về 7m/s, tới 0.6m thì nhặt (kho magnetItems sẵn sàng, game hiện chưa sinh vật rơi vật lý); toggle mặc định BẬT ở panel Debug (checkbox "Tự đánh khi gần quái", có toast); tắt hẳn trong phiên ?shot= để không phá ảnh tool; 28/28 tests pass
- [x] R11-2 (học Spiritfarer): **món quà yêu thích + mốc thân thiết của 9 NPC có tên** — **xong 2026-10-07 (vòng 12:11, publish v9)**: 9 NPC có tên mỗi người 1 món quà riêng (Trầu cau/Kẹo dừa/Chè xanh/Bánh ít lá gai/Thuốc lào/Rượu nếp/Bánh đa vừng/Mắm tép/Xôi nếp); nút "🎁 Tặng quà" trong dialog NPC + shop Bà Tám Xén (menu nút ≥48px); tặng đúng → +1 thân thiết + tim hồng + câu đáp; tặng sai → câu xã giao; mốc 3/6 mở thoại mới đúng giọng COT_TRUYEN; S.aff lưu cùng save; 63/63 tests pass
- [ ] R11-3 (học Vampire Survivors): **sự kiện "Đêm quái tràn về làng" 60 giây** — mỗi đêm (chu kỳ ngày-đêm 6 phút) có đúng 1 đợt: còi báo + banner "Quái tràn về làng!" → 10 quái spawn từ rìa làng đổ về trong 60s; diệt ≥8 con thưởng 100∞ + toast; hết 60s quái còn sống tự rút (không phạt — đúng chất cozy). Thế nào là xong: trigger bằng debug → đếm đủ 10 quái, hết giờ tự rút, thưởng đúng ngưỡng, test pass + screenshot đêm không regression
**Từ research 2026-10-07 (file `research/game-dev-library/13-coral-island.md` + `14-potion-permit.md` — học Coral Island + Potion Permit, game cozy Đông Nam Á / team nhỏ):**
- [ ] R13-1 (học Coral Island): **"Điểm Làng" — một con số duy nhất của cả làng.** Thanh "Điểm Làng" trên HUD (cạnh ∞), tăng khi: xong quest (+50), dọn 1 mảng vũng thiu (+20), quyên góp 1 mẫu vật (+30). 3 bậc: Làng Yên → Làng Vui → Làng Rộn; lên bậc làng đẹp lên thấy được (thêm đèn lồng/hoa/bảng gỗ ở sân đình) + toast "Làng lên bậc!", shop Bà Tám Xén giảm giá 5%/bậc. Thế nào là xong: 1 quest + 1 mảng + 1 mẫu → điểm tăng đúng 100, lên bậc Làng Vui thấy decor mới trên screenshot, giá shop giảm đúng 5%, test pass
- [ ] R13-2 (học Coral Island): **"Hội Làng đêm rằm" — sự kiện có lịch.** Mỗi đêm rằm (ngày 15 chu kỳ ngày-đêm, debug set được): banner "🏮 Hội Làng đêm rằm!", 9 NPC có tên tụ về sân đình, mở minigame thi 1 vòng (tái dùng minigame chặt tre M12 hoặc ném lon timing), top 5 khắc bảng gỗ, thưởng ∞; hết hội NPC về vị trí cũ. Thế nào là xong: set ngày rằm → banner hiện, đủ 9 NPC ở sân đình, chơi xong 1 vòng minigame có điểm vào top 5, test pass + screenshot đêm hội không regression
- [ ] R14-1 (học Potion Permit): quest **"Thầy Thuốc Làng" — khám, bốc thuốc, chữa khỏi.** Dân làng nhờ chữa 3 ca bệnh (mất ngủ, đau bụng, cảm nắng — tên dân gian, tone ấm áp): NPC kể triệu chứng → mở UI "Bốc thuốc" chọn 2–3 nguyên liệu từ túi (rau dại/thảo dược từ P1); chọn đúng → khỏi bệnh +1 thân thiết (móc R11-2) +20 Điểm Làng (móc R13-1); chọn sai → NPC cười "hơi đắng, thầy bốc lại đi" — không phạt, không mất nguyên liệu; ca đã chữa khỏi lần sau cho qua nhanh (tránh minigame lặp). Thế nào là xong: 3 ca chữa khỏi bằng cách chọn đúng nguyên liệu, ca sai không mất gì và được gợi ý lại, thân thiết +1 đúng NPC, test pass
  (Ghi chú: làm R13-1 trước vì R13-2/R14-1 móc vào Điểm Làng; R14-1 chỉ ở mức quest, không xây hệ crafting — đã cắt ở quyết định Phase 0)
**Từ research 2026-10-07 (file `research/game-dev-library/12-dinkum.md` — học Dinkum, solo dev James Bendon, 93% Very Positive):**
- [ ] R12-1 (học Dinkum): **"Nhà Trưng Bày Làng"** — gian trưng bày ở sân đình, quyên góp 1 mẫu mỗi loại (cá/quái/rau-bọ), kệ hiện bóng "?" cho ô trống, thưởng ∞ + toast "Mẫu vật mới!" mỗi mẫu mới. Thế nào là xong: 5 loại mẫu quyên góp được, quyên góp trùng loại bị từ chối đúng, kệ đầy đủ 5 ô khi đủ mẫu, test pass + screenshot gian trưng bày không regression
- [ ] R12-2 (học Dinkum): **"Sổ Thành Tích Làng"** — 6 cột mốc nhiều tầng (đánh quái 10/50/200, câu cá 10/50, nói chuyện NPC 10/30, đi bộ 2/10km, nhặt rau 10/50, dọn vũng thiu 6/18 mảng), mỗi tầng thưởng ∞ + toast, xem trong sổ tay HUD, ∞ chỉ mua đồ trang trí làng (đèn lồng/chậu hoa/bảng gỗ). Thế nào là xong: đếm đúng 6/6 mốc qua test, tầng 1 đạt được trong 15 phút chơi, thưởng ∞ đúng số, toast hiện đúng, test pass
  (Ghi chú: làm R12-2 trước — chỉ đếm sự kiện đã có sẵn; R12-1 sau — chờ P4 câu cá có data cá thật)
**8 luật từ bài học thất bại — Hoàng ĐÃ DUYỆT 2026-10-06 ("cứ làm sao phù hợp"), vòng auto-dev tuân thủ:**
- [ ] L1: mỗi tính năng mới phải có 1 câu "thế nào là xong" trước khi code (chống Star Citizen)
- [ ] L2: luôn có bản chơi được; hỏng quá 1 vòng thì rollback (chống alpha vĩnh viễn)
- [ ] L3: đặt mốc thời gian cụ thể cho bản "Alpha mời 10 người thử" (chống Vô Hạn 9 năm)
- [ ] L4: mọi mô tả với người ngoài chỉ dùng 1 câu định vị (chống LawBreakers)
- [ ] L5: người mới phải chơi được và hiểu việc đầu tiên trong 60 giây (chống onboarding tệ)
- [ ] L6: cấm vĩnh viễn loot box/hộp quà ngẫu nhiên bằng tiền thật (chống Battlefront II)
- [ ] L7: bán cosmetic sau Beta — giá niêm yết rõ, không giảm giá ảo
- [ ] L8: trước mỗi đợt public test/ra mắt kiểm tra và né sự kiện game lớn (chống Titanfall 2)

## Bảng so sánh (cập nhật mỗi 2 vòng)

| Tiêu chí | INFINIA (hiện tại) | Emberfall (Three.js ARPG) | Infinite World (Bruno Simon) | Shell Shockers | Vô Hạn (dev Bình Châu, concept) |
|---|---|---|---|---|---|
| Đồ họa | v9: Three **r186**, **cây CC0 Kenney Nature Kit** (6 model GLB nướng, L0 gần vẽ GLB + LOD G2 giữ nguyên, tre procedural) — thay cây procedural, ngân sách 1.11MB/2MB ✅; ngày-đêm, cỏ hoa, NPC animation, ACES, bloom giả sprite glow, LOD cây/cỏ, **25 NPC đa dạng + 9 NPC có TÊN tiếng Việt hiện khi <8m** (V1), **tool chụp ảnh góc sạch** (V1b). *Chỉ đạo mới 2026-10-07: nâng đồ họa lên đẹp nhất (model CC0 Quaternius/Kenney hoặc tự tạo Blender), so sánh định kỳ để biết vị trí* | bloom+ACES+fog, model chi tiết | terrain noise + màu theo cao độ | low-poly đơn giản, 200M+ lượt chơi | 3D (theo ảnh), 9 năm dev |
| Gameplay | combat 1 nút + né + **tự đánh mặc định (tắt được)**, 2 quest (làm quen làng + **nhặt 5 bó rau cho Bà Tám Xén**), shop, **tặng quà NPC + mốc thân thiết 3/6**, **nút mobile ≥48px (Đánh 68px) + joystick floating**, âm thanh procedural, combo mốc 10/25/50 | ARPG đầy đủ | khám phá | bắn súng multiplayer | tuyên bố "vô hạn", chưa thấy bản chơi được |
| Hiệu năng | draw calls ~126, LOD giảm tris ~50% ở xa, 60fps mục tiêu. *Chỉ đạo mới 2026-10-07: tối ưu tốc độ là ưu tiên (load <10s, 60fps máy thật), 2–3 dev + 1 research agent song song mỗi vòng* | _đo sau_ | _đo sau_ | _đo sau_ | — |
| Nền tảng | web một chạm (mobile là nền tảng chính) | web | web | web | chưa rõ |
| Điểm INFINIA cần đuổi | — | juice + boss | terrain đẹp | đơn giản mà vui | ra được bản chơi được sớm |

## Công cụ
- `python3 build-standalone.py` — build bản public 1 file từ source module.
- `node tools/screenshot.js [day|night|combat] [--out=dir]` — tự chụp ảnh game
  bằng Chrome + SwiftShader qua CDP (không cần server, dùng file standalone qua `file://`).
  Hook `?shot=` nằm trong `app.js` — giữ lại, đừng xóa.

## Changelog

- 2026-10-07 **v10 — G5B-a + M3 + D4 + P5 ĐÃ LÊN LINK** (vòng 12:45, 4 dev + 1 research song song): cây chi tiết + texture tự vẽ canvas (G5B-a — vân vỏ/đốm lá seeded, tán lá 2 lớp canopy phụ, 0 byte asset, build 1139333 bytes <8MB ngân sách hướng B ✅, +2 draw calls), HUD gọn màn 360px (M3 — 5 nút top gom vào ☰, quest tracker 1 dòng tự ẩn 5s, chữ ≥12px), né hủy đòn giữa animation + input <100ms (D4), 9 NPC có tên theo lịch sinh hoạt sáng ra đồng/tối về nhà (P5); tick kiểm chứng 4 item có code từ vòng trước (D5 screenshake, M11 combo, M6 bảng Lời hứa làng, M7 3 dòng "có gì mới"); 1165/1165 assertions xanh (26 file test), node --check 11/11 module, build OK, HTTP 200; ảnh review/auto-1245/ day/night/combat không regression (thân cây có vân, tán đầy hơn, quái + thanh HP + vệt chém + COMBO x5). Research: Coral Island + Potion Permit → R13-1 "Điểm Làng" + R13-2 "Hội Làng đêm rằm" + R14-1 "Thầy Thuốc Làng" đã bổ sung backlog (làm R13-1 trước).
- 2026-10-07 **v9 — G5a + R11-1 + R11-2 + M2 (+ P1/C3 tick) ĐÃ LÊN LINK** (vòng 12:11, 5 agent song song): cây CC0 Kenney (G5a — 6 model GLB nướng, build 1.11MB/2MB ✅), đánh tự động mặc định + hút đồ (R11-1 — toggle ở Debug), quà NPC + mốc thân thiết 3/6 cho 9 NPC (R11-2), nút mobile ≥48px + joystick floating (M2); tick P1 (quest Bà Tám Xén 5 bó rau) + C3 (âm thanh WebAudio) đã có code từ vòng trước; 986/986 assertions xanh (23 file test), node --check 10/10 module; ảnh review/auto-1211/ day/night/combat không regression (cây GLB đa dạng rõ, nhãn "Bà Lụa"/"Bà Tám Xén" rõ, đêm đèn lồng + sao, combat thấy quái + thanh HP + vệt chém + COMBO); fix tool ?shot= tự tắt màn hình title (trước đó ảnh chụp chỉ thấy title). Research: Dinkum → R12-1 "Nhà Trưng Bày Làng" + R12-2 "Sổ Thành Tích Làng" đã bổ sung backlog.
- 2026-10-07 **v8 — C2 + F4 + G8 + P2 ĐÃ LÊN LINK** (vòng 07:56 chết giữa chừng không dọn lock — vòng 09:11 phát hiện lock stale, pid đã chết, xóa lock và publish thay): màn hình title/help tiếng Việt (C2), NPC xa update AI 10Hz (F4), 4 kiểu cây + decor quanh nhà (G8), 2 quái mới Dơi Sương Đêm (chỉ ban đêm) + Cua Đá Già (giáp mặt trước) (P2); 560 assertions xanh (12 file test), node --check 10/10 module, build 909242 bytes OK; ảnh review/auto-0911/ day/night/combat không regression (nhãn "Bà Lụa"/"Bà Tám Xén" rõ, đêm đèn lồng + sao, combat thấy quái + thanh HP + vệt chém).
- 2026-10-07 **v7 — V1 + V1b ĐÃ LÊN LINK** (build success, xác nhận 2026-10-07): NPC có tên hiện TÊN tiếng Việt khi <8m, tool chụp ảnh hết cây che + cảnh combat luôn thấy quái/vệt chém; 345/345 tests xanh, build 867233 bytes. Nội dung builder báo trên link: HUD gọn, vùng bấm lớn, joystick + Đánh/Né theo ngón tay, dọc + ngang đều chơi được, 9 NPC có tên thay nhãn debug ID, dân thường không phủ kín màn hình, góc camera mở đầu nhìn thẳng vào làng.
- 2026-10-07 (chưa publish): **V1b góc camera tool screenshot** — hết cây che nửa khung hình: hook ?shot= dọn cây trong hành lang 6m quanh đoạn camera→player (chỉ phiên chụp); combat ghim quái bất tử đứng yên bên cạnh player + ghim vệt chém hiện tĩnh trước SHOT_READY → ảnh luôn thấy quái + hiệu ứng, không còn may rủi. 20/20 tests V1b pass, tổng 345/345 xanh, build OK. Nhận xét ảnh: day — nhãn "Bà Lụa"/"Bà Tám Xén" đọc rõ, làng đẹp; night — đèn lồng + sao + đom đóm, không cây che; combat — quái + thanh HP đỏ + vệt chém trắng rõ; không regression. (V1+V1b xong → đủ điều kiện gỡ chặn publish)
- 2026-10-07 (chưa publish): **V1 nhãn tên NPC** — NPC có tên hiện TÊN tiếng Việt thay vì ID debug, chỉ khi cách player <8m, NPC vô danh không nhãn; 24/24 tests V1 pass, tổng 325/325 tests xanh, build OK; screenshot ?shot=day không còn ID(...), "Bà Lụa" + "Bà Tám Xén" hiện rõ. (Chặn publish vẫn giữ tới khi V1b xong)
- 2026-10-06 v6c: **NPC đa dạng** (G3) — 25 NPC, 9 có tên (5 mới: Cụ Chánh Tín, Chú Sáu Búa, Cô Lan Thảo, Chú Tư Lưới, Anh Hai Ruộng — vị trí cố định, thoại theo COT_TRUYEN); mũ (nón lá/khăn đóng/mũ rơm)/tóc (4 màu, 3 kiểu)/dáng deterministic theo seq, ổn định qua mọi lần tải; +3 draw calls (3 InstancedMesh mũ-tóc mới); 301/301 tests pass; build 718231 bytes OK; screenshot 3 cảnh không regression. Lên link: artifact build đang chạy (đã >12 phút), sẽ xác nhận ở vòng sau.
- 2026-10-06 v6a: **bloom giả sprite glow** (G1) — 18 sprite glow additive cho đèn lồng/mặt trời-mặt trăng/đom đóm, flash glow cho chém/trúng đòn/lên cấp/nhặt; phím B + nút ✨ Bloom bật/tắt (mặc định bật), preset Thấp tắt bloom giữ FPS; tối đa +18 draw calls, tắt bloom → +0; 24/24 tests bloom pass; tổng 110/110 tests xanh
- 2026-10-06 v6b: **LOD cây/cỏ** (G2) — cây 3 bucket theo khoảng cách camera (hysteresis ±5m, ngưỡng theo preset Thấp 30/60m – Cao 50/100m), cỏ/hoa cull ngoài tầm gần; cây ~7800→4300 tris, cỏ 26000→4600 tris ở góc làng điển hình, cây cull không render shadow map; 60/60 tests LOD pass, không regression

- 2026-10-06 v5: ngày–đêm 6 phút (mặt trời/mặt trăng/sao, 8 keyframe, HUD icon giờ),
  đèn lồng làng (tối đa 4 point light gần player), đom đóm ban đêm, preset chất lượng
  phím Q (Thấp/Vừa/Cao), vignette CSS, nước ao shader gợn sóng + màu trời fake;
  26/26 tests ngày–đêm pass; ACES đưa vào source app.js (trước chỉ có ở bản build)
- 2026-10-06 v4: đồ họa procedural lớn — NPC tay chân + animation, cỏ/hoa đung đưa,
  đường đất, ao nước, nhà có hiên, sky gradient, juice combat, ACES
- 2026-10-06 v3: combat (Đánh/Né), 4 quái, shop Bà Tám Xén, 22/22 tests
- 2026-10-06 v2: save/load, nói chuyện NPC, XP/level, quest "Làm quen làng"
- 2026-10-06 v1: prototype đầu — terrain, cây, làng, NPC, HUD, mobile joystick
