# NGUỒN + LICENSE — Model 3D CC0 cho INFINIA (đợt sau)

Ngày kiểm tra: 2026-10-07. Kiểm tra bằng văn bản trích từ `License.txt` đi kèm từng pack.

## 1. Kenney Fantasy Town Kit v2.0 — CC0 ✓ (đã tải + kiểm tra)

- Trang pack: https://kenney.nl/assets/fantasy-town-kit
- File tải (trực tiếp, curl): `https://kenney.nl/media/pages/assets/fantasy-town-kit/efe948d309-1754222374/kenney_fantasy-town-kit_2.0.zip` (~3,9 MB)
- Giải nén tại: `assets-sample-kenney/fantasy-town-kit/` (167 file GLB + FBX + OBJ + texture)
- Câu license (nguyên văn `License.txt`):
  > `License: (Creative Commons Zero, CC0)`
  > `http://creativecommons.org/publicdomain/zero/1.0/`
  >
  > `You can use this content for personal, educational, and commercial purposes.`
  >
  > `Support by crediting 'Kenney' or 'www.kenney.nl' (this is not a requirement)`
- Kết luận: **CC0 — dùng tự do cho mục đích cá nhân, giáo dục và thương mại.**
  Ghi công `Kenney`/`www.kenney.nl` được khuyến khích nhưng KHÔNG bắt buộc.

## 2. Kenney Nature Kit v2.1 — CC0 ✓ (đã tải + kiểm tra)

- Trang pack: https://kenney.nl/assets/nature-kit
- File tải (trực tiếp, curl): `https://kenney.nl/media/pages/assets/nature-kit/37ac38a37b-1677698939/kenney_nature-kit.zip` (~10,5 MB)
- Giải nén tại: `assets-sample-kenney/nature-kit/` (329 file GLB trong `Models/GLTF format/` + DAE/FBX/OBJ/STL)
- Câu license (nguyên văn `License.txt`):
  > `License: (Creative Commons Zero, CC0)`
  > `http://creativecommons.org/publicdomain/zero/1.0/`
  >
  > `This content is free to use in personal, educational and commercial projects.`
  > `Support us by crediting Kenney or www.kenney.nl (this is not mandatory)`
- Kết luận: **CC0 — dùng tự do cho project cá nhân, giáo dục và thương mại.**
  Ghi công được khuyến khích nhưng KHÔNG bắt buộc.

## 3. Quaternius Cute / Animated Monsters — CC0 ✓ (license) NHƯNG KHÔNG TẢI ĐƯỢC

- Trang pack: https://quaternius.itch.io/lowpoly-animated-monsters
  (trang tổng: https://quaternius.itch.io/ ; mô tả pack: https://quaternius.com/packs/cutemonsters.html)
- Câu license (xác nhận trên cả 2 trang):
  > Trang itch.io hiển thị: `CC0 License`
  > Trang quaternius.com/packs/cutemonsters.html hiển thị: `CC0` kèm link
  > `https://creativecommons.org/publicdomain/zero/1.0/`
- Kết luận license: **CC0 — public domain, dùng tự do.**
- Kết quả tải: **THẤT BẠI — 0 byte.** Các cách đã thử ngày 2026-10-07:
  1. `curl` trang itch.io: trang chỉ chứa widget "Name your own price" — nút
     Download dẫn tới checkout `…/purchase` đòi **chọn payment method qua trình
     duyệt** (đã thử POST price=0 + CSRF token hợp lệ → server trả
     `{"errors":["Please select a valid payment method"]}`). Không có URL zip
     trực tiếp nào để `curl`/`wget`.
  2. Google Drive chính chủ (`drive.google.com/drive/folders/1zLLO_7ZoWgUsS4uooYnVSErQYRu1VdS0`,
     folder "Cute Animated Monsters - Aug 2020" link từ nút Download của
     quaternius.com): `gdown --folder` tạo được cây thư mục nhưng **timeout >120s
     mà chưa xong file nào** (mạng tới Drive quá chậm/chập chờn trong môi trường này).
  3. GitHub `Quaternius/Cute-Monsters`: **404 — repo không tồn tại** (tác giả chỉ
     host pack trên itch.io + Drive, không có mirror GitHub).
- **FALLBACK CHÍNH THỨC: giữ quái procedural hiện tại của game.**
  Game hiện vẽ mọi actor bằng THREE geometry + canvas texture (0 byte asset —
  xem rig player/nón lá trong `js/actors.js`, cây blob procedural trong
  `js/world.js`). "Vũng Thiu Mẹ" (boss) dựng từ blob/mẹ-con phóng to của hệ
  procedural này; "Vẩn con" dùng quái nhỏ hiện có. Đợt sau (mạng ổn định / làm
  tay trên máy dev): mở trang itch.io trên trình duyệt → chọn Download $0 →
  lấy zip → bỏ vào `assets-sample-kenney/quaternius/` → ghi license vào đây.

## 4. Ghi chú tuân thủ

- Tổng download đợt này: **~14,4 MB < 100 MB** (2 file zip Kenney, đã xóa sau giải nén).
- `License.txt` gốc của cả 2 kit Kenney được giữ nguyên trong thư mục kit, đồng thời
  copy vào `assets-kenney/` (`License-kenney-fantasy-town-kit.txt`,
  `License-kenney-nature-kit.txt`) để tiện đối chiếu.
- Không bake model, không sửa `js/` / `tests/` / `index.html` / build — đúng phạm vi
  "chỉ tải + liệt kê".
