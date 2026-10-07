# QA bằng ảnh chụp — INFINIA, 2026-10-06 (tối)

**Cách chụp:** Chromium headless (SwiftShader) mở bản dev qua `?shot=day|night|combat`
(hook trong `app.js`, tự đặt camera + giờ + chờ ổn định rồi chụp).
Ảnh: `qa-shots/2026-10-06-{day,night,combat}.png`.
Lưu ý: ảnh headless có thể tối/hơi khác màn hình thật ở vài điểm (ghi rõ bên dưới).

## Điểm tốt (giữ nguyên)
- Ban ngày: làng, đường đất, nhà có cửa sổ sáng, cỏ/hoa đung đưa, cây 2 tầng lá, bóng đổ — lên hình ổn, đúng chất low-poly ấm áp.
- Ban đêm: trời sao, cửa sổ nhà sáng đèn ấm — đúng tone "làng quê".
- Combat: vệt chém hiện rõ, quái có thanh HP, player đội nón lá.
- Nút **✨ Bloom** đã có trên HUD (vòng lặp vừa code xong G1 — nhưng `AUTO_DEV.md` vẫn để G1 chưa check, cần đánh dấu lại).

## Vấn đề phát hiện (xếp theo độ ưu tiên)

### 1. [CAO] Nhãn `ID(x,0,z,n)` hiện luôn trên đầu NPC — kể cả ban đêm
- Chữ trắng, cỡ không đổi theo khoảng cách → đứng gần thì chữ to che cả nhân vật (ảnh night: `ID(2,0,1,5)` to đùng giữa màn hình).
- Ban đêm nhãn là vật sáng nhất khung hình, các nhãn chồng lên nhau không đọc được (`ID(2,0,1,5)` đè `ID(2,0,1,14)`).
- Code: `app.js:798` (`makeLabel` — comment ghi "nhãn ID(...) kiểu game Vô Hạn"), `:868`, `:943`; không có công tắc tắt.
- Đề xuất: hiện **tên NPC** (theo `docs/COT_TRUYEN_VA_LAU_DAI.md`, 11 NPC có tên sẵn) thay vì ID thô; chỉ hiện khi đứng gần (vd. < 8m) hoặc khi bật Debug; ban đêm giảm độ sáng nhãn.

### 2. [TRUNG BÌNH] Ban đêm quá tối để chơi
- NPC và quái gần như chỉ còn silhouette; đom đóm thưa, khó thấy; đèn lồng chưa nổi bật.
- Chưa rõ bao nhiêu phần do headless render tối hơn thực tế → **cần Hoàng mở link chơi thử lúc trong game là đêm để xác nhận**, rồi mới chỉnh (tăng ambient nhẹ / thêm đèn lồng / đom đóm dày hơn).

### 3. [TRUNG BÌNH] Thanh HP quái nhỏ, khó đọc (ảnh combat)
- Thanh máu trên đầu quái "vũng thiu" mảnh, nhìn xa không thấy. Đề xuất: to hơn + viền tối.

### 4. [THẤP] Polish đồ họa
- Hoa trông như kẹo mút (quả cầu trên que) — thay bằng cụm cánh hoa nhỏ.
- Quái "vũng thiu" là blob trắng trơn, chưa có mặt/miệng — thêm 2 mắt đơn giản cho có hồn (đúng tone ấm áp, không máu me).
- Nhãn NPC bị cắt ở mép màn hình (ảnh day, góc trái) — ẩn nhãn khi ra ngoài khung hình.

### 5. [CHƯA XÁC MINH] HUD hiện `fps: --` trong môi trường headless
- Các bản trước chụp thật hiện `fps: 20` bình thường → nhiều khả năng do headless bóp rAF, không phải bug game. Ghi nhận để vòng lặp kiểm tra trên browser thật nếu tiện.

## Đề xuất đưa vào backlog (cho vòng lặp tự động)
- [ ] Q1: nhãn NPC → tên + chỉ hiện khi gần/Debug + mờ dần theo khoảng cách + tối đi ban đêm
- [ ] Q2: (sau khi Hoàng xác nhận trên máy thật) cân sáng ban đêm: ambient + đèn lồng + đom đóm
- [ ] Q3: thanh HP quái to hơn, có viền
- [ ] Q4: polish hoa + mặt quái vũng thiu + ẩn nhãn ngoài khung hình
- [ ] Dọn drift: đánh dấu G1 (bloom giả) đã xong trong `AUTO_DEV.md` + changelog
