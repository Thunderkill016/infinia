# KẾ HOẠCH A→Z — INFINIA (bản tổng từ 3 agent chuyên môn)

*Ngày: 2026-10-07. Nguồn: agent Sản phẩm (Schell/Koster/Supercell/HoYoverse/Stardew),
agent Kỹ thuật (Riot/Nintendo/Nystrom/three.js forum), agent Phát hành (Supercell/itch.io/VNG,
NĐ 147/2024, NĐ 13/2023). Đây là bản duy nhất để tra cứu — chi tiết nằm ở các docs gốc.*

## 0. Một câu
**Stardew Valley Việt Nam chạy ngay trên browser điện thoại — không tải, không nạp vẫn vui.**

## 1. Ba trụ cột (Schell + Koster)
1. **Chill trước, thách sau:** 90% cozy (trồng, câu cá, NPC), 10% thử thách (boss mini, quest đêm).
2. **Mọi thứ <3 chạm:** mở game → chơi <3s; nhận quest <3 tap; mobile chơi 1 tay.
3. **Việt là gameplay, không phải skin:** ao làng khác biển, Tết có lì xì ∞, boss là Ma Đầm/Cọp Rừng.

## 2. Lộ trình 4 phase + kill criteria (kiểu Supercell)
| Phase | Mục tiêu | Qua ải (không đạt → kill/pivot, không cố) |
|---|---|---|
| Alpha (+2 tuần) | Core loop 10 phút không chán; load <3s 4G; 30fps máy 3GB | D1 ≥30%, session ≥10', 60% xong 2/4 quest đầu |
| Beta (tháng 2–3) | 30 NPC + 10 quest, 1 quest/tuần từ template, PWA install | D7 ≥12%, PWA install ≥15% |
| Launch (tháng 4) | 1.000 players organic (itch.io + TikTok + FB), bản <5MB | D1 ≥35%, D7 ≥15%, D30 ≥7%, crash <1% |
| Liveops (từ tháng 5) | Event 2 tuần/lần, pass mùa lễ, 4h/tuần duy trì | Event tham gia ≥30% DAU; KPI đỏ 2 tuần → cắt feature |

## 3. Kinh tế ∞/XP (faucet–sink, chống lạm phát)
- 2 tiền tệ: **∞ (Lúa Vàng)** tiêu xài + **XP (Tình Làng)** tiến trình vĩnh viễn, không mua được bằng ∞.
- Faucet có trần: quest chính 1 lần; daily 3/ngày; cá thường diminishing sau 20 con/ngày; boss/tuần.
- Sink bắt buộc: nâng cần câu, mở ruộng, skin, thuế chợ, hồi sinh boss. Mục tiêu: kiếm ~150 ∞/tiêu ~130 ∞ mỗi 30 phút chơi.
- Không gacha ∞; cosmetic free vé event, rate công khai, pity rõ ràng.

## 4. Ngân sách kỹ thuật cố định (vượt = fail build)
- File: `standalone/index.html` ≤3.0MB raw (hiện 2.7MB); GLB embed ≤800KB; cấm embed PNG/JPG.
- Render Tier 2 (máy VN phổ thông): ≤80 draw calls, ≤150k tris, DPR ≤1.5, shadow 1024, 1% low ≥30fps.
- Logic thuần lấy được (không import THREE) để test + tái dùng cho server verify sau này.
- Mọi nâng cấp có fallback procedural; `Math.random` chỉ từ 1 seed duy nhất (`?seed=` tái hiện 100%).

## 5. Chất lượng: test pyramid + CI gate
- Unit TESTABLE 70% (mục tiêu 50+ file test), integration 20% (draw call, InstancedMesh, fallback khi xóa GLB), screenshot regression 10% (diff ≤0.5%), playtest tay 10 mục/release.
- CI chặn merge khi: build vượt size, test đỏ, còn `Math.random` trong logic, bench Tier 2 rớt, ảnh diff quá ngưỡng.

## 6. Backend sau này (Supabase Singapore) — offline-first giữ nguyên
- 3 bảng: `saves`, `leaderboard`, `events`; RLS + Edge Function validate + nonce chống replay.
- Client public = không bí mật được: mọi thưởng qua server, rate-limit, khóa tay khi bất thường.
- Mất mạng/backend sập → game vẫn chơi full, queue sync sau.

## 7. Phát hành 4 nấc
1. **Closed beta 10 người** (link Pages + password): crash-free >95%, 8/10 xong tutorial không hỏi.
2. **itch.io open beta**: 500 lượt/30 ngày, D1 >30%, rating >4.0/20 vote.
3. **Pages chính thức + domain**: 2.000 MAU, 40% mobile, Lighthouse Performance >70.
4. **Portal** (GameVui trước, Poki sau): session >8', chịu chia revenue; ARPU <30đ/ngày sau 14 ngày → rút.

## 8. Marketing 0đ + kiếm tiền
- 2h game + 2h clip/tuần: devlog itch.io, 2 clip TikTok/tuần (gameplay chill + meme làng quê), event đặt tên NPC, creator program 10 TikToker nhỏ.
- Tiền (chỉ khi MAU >10k + D7 >12%): rewarded ads tự nguyện (tối đa 3/ngày) → battle pass lễ Việt cosmetic → donation. Không P2W, không interstitial giữa phiên.

## 9. Pháp lý VN (không phải tư vấn luật — tự kiểm chứng)
- Giữ ở **G4** (offline thuần) hoặc **G2** (có BXH/cloud save): chỉ thông báo, đừng làm G1 (real-time multiplayer).
- NĐ 13/2023: privacy policy tiếng Việt, data tối thiểu, quyền xóa tài khoản.
- Nhãn 12+, footer chủ game + liên hệ, không nạp tiền thật khi chưa xong nghĩa vụ.

## 10. Việc làm ngay (7 ngày)
Ngày 1–2 khóa tutorial 3 phút · Ngày 3–4 mời 10 tester · Ngày 5 đăng itch.io ẩn ·
Ngày 6–7 quay 2 clip TikTok · Song song: hạ budget embed → 800KB + `?seed=&bench=1` + baseline 5 screenshot.

## 11. PIVOT WEB-FIRST (2026-10-07, quyết định kiến trúc)
Infinia KHÔNG làm "3D open-world RPG thu nhỏ" nữa. Chuẩn mới:
**game hành động làng quê 3D nhỏ, vòng chơi 5–15 phút, map đặc không lớn, 1 nút Action theo ngữ cảnh
(NÓI/NHẶT/ĐÁNH/DÙNG), landscape là layout chính, làng thay đổi thấy được sau mỗi session.**
- Combat: read→react (telegraph → né → phạt), không aim, không combo dài, không skill mới.
- Kỹ thuật: WebGL2 chính (không WebGPU), fixed timestep + render interpolation, Auto quality
đo frame-time 5–10s đầu, page lifecycle (ẩn tab → pause, thoát → save), WebAudio resume từ nút Chơi ngay.
- Đồ họa: VIETNAMESE STORYBOOK DIORAMA (shape + palette + composition, không đua polygon);
vật liệu đơn giản + vertex color + 1 atlas; foliage opaque, cấm transparency-heavy;
1 directional + 1 hemisphere + glow giả; shadow thật chỉ tier cao, còn lại blob shadow.
- Asset: first play ≤8MB, deferred sau gameplay ≤20–25MB (bỏ tư duy single-file cho mọi thứ);
pipeline Blender → GLB → gltf-transform optimize → Meshopt → KTX2.
- STOP: thêm loại quái/skill/item/crafting, map lớn, vùng mới, thêm NPC, nhiều boss,
nhiều shader, chạy theo asset quality vô hạn.
- TIẾP TỤC: bản sắc làng Việt, village transformation, NPC depth, loop 5–15 phút,
contextual controls, compact map, combat readability, progressive loading, Auto quality, mobile perf.
- Nghiên cứu tiếp: R1 benchmark cross-platform → R2 art bible → R3 perf budget →
R4 vertical slice 8 phút (NPC → vấn đề → đi ra → gameplay → về → làng đổi).
