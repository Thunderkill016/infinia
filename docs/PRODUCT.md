# INFINIA — Blueprint sản phẩm hoàn chỉnh A→Z

*Bản v13. Đọc 10 phút để thấy toàn bộ đường đi từ code tới người chơi.*

## 1. Sản phẩm là gì
- Game web 3D cozy làng quê Việt Nam, mobile-first, single-file `<8MB`, chơi ngay không cài.
- Không tiền thật, không đổi thưởng → rủi ro pháp lý thấp, doanh thu tương lai từ ads + portal.

## 2. Kiến trúc (hiện tại)
```
infinia-vn/
├── index.html + js/ (12 modules) + vendor/three r186
│   └── build-standalone.py → standalone/index.html (2.4MB, 0 CDN)
├── tools/make-product.sh → product/dist/ (PWA: + manifest + sw + icons)
├── product/ (Dockerfile, nginx, _headers, schema.sql, remote-config mẫu)
├── .github/workflows/deploy.yml (test → build → Pages)
└── docs/ (PRODUCT này + lore + kế hoạch)
```
- Gameplay thuần client + localStorage; cloud-save/leaderboard là lớp sau (schema sẵn).

## 3. Hạ tầng khuyến nghị (đã research)
| Lớp | Chọn | Vì sao |
|---|---|---|
| Host chính | Cloudflare Pages + domain `.com` | Free, unlimited bandwidth, edge HN/HCM ~30ms, PWA full |
| Kênh phụ | itch.io (beta) → Poki/CrazyGames sau | Discovery trước, tiền sau |
| Backend | Supabase Singapore (Auth ẩn danh + RLS) | 1 người làm được save + leaderboard, ~0đ |
| Đo lường | Cloudflare Web Analytics + Sentry free | Không cookie, hợp PWA |
| Uptime | UptimeRobot/Better Stack free | Ping + check từ khóa |

## 4. Phát hành (checklist)
1. `bash tools/make-product.sh` → `product/dist/` (<8MB).
2. Deploy Pages (CI tự làm khi push main).
3. Bật HTTPS enforce + www redirect + HSTS.
4. Dán Privacy Policy (NĐ 13/2023: dữ liệu gì, ở Singapore, quyền xóa) + Terms + trang liên hệ + nút xóa tài khoản.
5. Gắn độ tuổi 12+; tắt ads cá nhân hóa cho <16.
6. Theo dõi: time-to-playable <2.5s (4G), fps ≥30, JS error <1%/session.

## 5. Chống gian lận (client coi như public)
- Server quyết định thưởng/roll/leaderboard; client chỉ gửi intent + nonce + timestamp.
- Validate: nonce unique, timestamp ±5p, plausibility (điểm/giờ bất thường → `is_suspect` + ẩn khỏi top, review tay).
- Rate-limit 1 submit/30–60s; leaderboard chỉ nhận điểm cao nhất.

## 6. Liveops tối thiểu
- `remote_config` (tỉ lệ rớt, lịch lễ hội, maintenance, min version) — đổi không cần deploy.
- Event theo mùa (bảng `events` + `event_progress`); A/B bằng `user_id % 100`.
- Backup: PITR Supabase 7 ngày + nút Export JSON trong game (làm sau).

## 7. Lộ trình
- Ngắn: quest làng, chợ phiên, boss tiếp theo, Export JSON.
- Giữa: Supabase save + leaderboard + event Rằm tự động.
- Dài: portal (Poki/CrazyGames), .vn + ĐK khi có doanh thu, pháp nhân khi cần G2/G3.

## 8. Ngân sách
~0đ/tháng tới vài nghìn DAU (Pages free + Supabase free + Analytics free). Điểm vỡ: vượt free tier → tách leaderboard sang Workers + cache.
