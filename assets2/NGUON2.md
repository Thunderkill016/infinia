# NGUỒN MODEL NHÂN VẬT TRÒN MƯỢT (ĐỢT 2) — INFINIA (CC0)

12 file `assets2/char2-{nam,nu,ong,tre}-{0,1,2}.glb` — thay thế phong cách
hộp Blocky (`assets/` cũ GIỮ NGUYÊN, không đè) bằng model chibi KayKit
thân tròn, đầu cầu, tay chân capsule.

## 1. Nguồn đã dùng: KayKit — Adventurers Character Pack 1.0 (CC0)

- Trang pack (itch): https://kaylousberg.itch.io/kaykit-adventurers
  (ghi công khai: Asset license **Creative Commons Zero v1.0 Universal**,
  “Free for personal and commercial use, no attribution required. (CC0 Licensed)”).
- File tải THỰC TẾ: **không tải từ itch** — trang itch chỉ có nút
  `.../kaykit-adventurers/purchase` (checkout trình duyệt, không có link file
  trực tiếp; đã kiểm tra HTML trang pack, không checkout theo đúng yêu cầu).
  Thay vào đó dùng **GitHub chính chủ cùng tác giả** (tổ chức
  `KayKit-Game-Assets`), nội dung pack FREE tier identical:
  https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0
  (`git clone --depth 1`, thư mục
  `addons/kaykit_character_pack_adventures/Characters/gltf/`).
- Vì pack Adventurers FREE chỉ có đúng 4 nhân vật (không có pack “Peasants”
  riêng — KayKit không phát hành pack peasants; các Farmers nằm ở Series 6
  tier trả phí nên không dùng), 4 mẫu là toàn bộ cast có thể dùng.
- Poly Pizza / Kenney “Animated Characters” (phương án dự phòng trong task)
  **không cần dùng tới** vì KayKit đã đạt (dừng ở ưu tiên 1 theo thứ tự).

### Câu license TRONG pack (trích nguyên văn `LICENSE.txt`, kèm trong cả 2 nơi)

> License: (Creative Commons Zero, CC0)
> http://creativecommons.org/publicdomain/zero/1.0/
>
> This content is free to use in personal, educational and commercial projects.
>
> Support me by crediting Kay Lousberg, www.kaylousberg.com (this is not mandatory)

=> Xác nhận CC0 bằng văn bản: dùng thương mại/không cần ghi nguồn đều được
(không bán lại nguyên pack — không liên quan vì chỉ bake ra model game).

## 2. Ánh xạ 4 mẫu (toàn bộ nhân vật FREE của pack)

| Nhóm game | File nguồn | Vai / đặc điểm nhận dạng |
|---|---|---|
| nam (nông dân) | `Characters/gltf/Barbarian.glb` + `barbarian_texture.png` | râu xám, áo xanh + dây đeo vai nâu, thắt lưng (hợp lực điền) |
| nu (phụ nữ) | `Characters/gltf/Rogue.glb` + `rogue_texture.png` | tóc dài nâu ôm mặt, áo xanh lá + khăn, thắt lưng |
| ong (già) | `Characters/gltf/Mage.glb` + `mage_texture.png` | áo choàng dài tím (như áo ông đồ), tóc đen búi sau |
| tre (trẻ con) | `Characters/gltf/Rogue.glb` scale 0.72 (giống mẫu nu) | nhỏ con, tóc nâu, áo xanh lá |

- Chỉ giữ 6 mesh SKINNED thân người
  (`*_Body/_Head/_ArmLeft/_ArmRight/_LegLeft/_LegRight`); **loại toàn bộ**
  vũ khí (rìu/kiếm/nỏ/gậy/sách), khiên, mũ (gấu/phù thủy), choàng fantasy —
  không hợp làng quê VN và tốn verts.
- `Knight.glb` không dùng: mũ giáp trùm kín mặt, giáp sắt nặng, kém hợp làng
  nhất trong 4 mẫu.
- Tay T-pose gốc được hạ xuống (xoay ±75° quanh Z tại khớp vai) nên cả 3 pose
  đều đứng tay xuôi tự nhiên, không còn dang ngang.

## 3. Cách bake ra 12 file (offline, numpy+Pillow, không Blender)

1. LBS bind pose: `jointWorld(rest) × inverseBind` (MAT4 column-major phải
   transpose — sai bước này model méo, đã kiểm bằng `J×IBM≈I` cho cả 41 joints).
2. Nướng màu texture atlas vào `COLOR_0` (UV trực tiếp không flip, sRGB→linear —
   giống `tools/prepare-tree-assets.py`).
3. Giảm verts bằng voxel-clustering RIÊNG từng part (Body~150/Head~140/
   tay~42/chân~42) rồi gộp 6 part → **1 mesh / 1 primitive**:
   `POSITION` + `NORMAL` + `COLOR_0` (VEC3 float) + `indices` — đúng format
   `tools/prepare-tree-assets.py`, runtime `g5aParseGLB` (`js/world.js`) đọc được
   (đã kiểm bằng **code parser thật trích từ repo**, không phải copy tay:
   12/12 PARSER-OK).
4. `NORMAL` tính lại theo trung bình face-normal (smooth, chuẩn hóa |n|=1 —
   kiểm 100% verts lệch <0.02), **không giữ flat** gốc.
5. Pose 0 = đứng. Pose 1/2 = chân xoay cứng ±20° quanh khớp hông, tay đánh ngược
   ∓12° quanh khớp vai (chân trước chạm gót + chân sau kiễng — snapshot bước đi,
   không cong gối như animation thật). Chân đặt y=0. Trẻ scale đều 0.72.

## 4. Danh sách file + dung lượng + poly (đo từ file bake xong)

| File | Dung lượng | Verts | Tris | Cao |
|---|---|---|---|---|
| char2-nam-0.glb (đứng) | 25144 | 499 | 1032 | 2.15 m |
| char2-nam-1.glb (bước trái) | 25140 | 499 | 1032 | 2.18 m |
| char2-nam-2.glb (bước phải) | 25140 | 499 | 1032 | 2.18 m |
| char2-nu-0.glb (đứng) | 22460 | 443 | 921 | 2.16 m |
| char2-nu-1.glb (bước trái) | 22464 | 443 | 921 | 2.20 m |
| char2-nu-2.glb (bước phải) | 22464 | 443 | 921 | 2.20 m |
| char2-ong-0.glb (đứng) | 25848 | 515 | 1054 | 2.17 m |
| char2-ong-1.glb (bước trái) | 25848 | 515 | 1054 | 2.20 m |
| char2-ong-2.glb (bước phải) | 25848 | 515 | 1054 | 2.20 m |
| char2-tre-0.glb (đứng) | 22464 | 443 | 921 | 1.55 m |
| char2-tre-1.glb (bước trái) | 22464 | 443 | 921 | 1.58 m |
| char2-tre-2.glb (bước phải) | 22464 | 443 | 921 | 1.58 m |

- Mỗi file < 30 KB (max 25848). Tổng 12 file = **287748 bytes (~281 KB) < 300 KB.**
- 3 pose mỗi mẫu khác nhau thật (đo đỉnh-đỉnh: TB 4–6 cm, 26–98% verts dịch
  >3 cm, tay/chân xa nhất 15–21 cm; pose 1/2 đảo pha nhau).
- Pose bước cao hơn đứng ~3–5 cm vì xoay cứng chân làm mũi chân trước lún
  dưới đất rồi dồn cả người lên khi đặt chân y=0 lại — nhìn xa trong game
  giống bước đi, zoom gần sẽ thấy chân sau hơi bay.

## 5. Nhận xét trung thực từng mẫu (không overclaim)

- **nam: TRÒN MƯỢT so với Blocky.** Đầu cầu lớn + râu xám, thân tunic bo tròn,
  tay chân capsule, normals mượt — silhouette hết hộp. Nhưng vẫn là low-poly
  (~500 verts): zoom gần thấy facets tam giác, không phải mịn high-poly.
- **nu: TRÒN MƯỢT.** Đầu cầu + tóc dài ôm mặt (đọc được là nữ), áo xanh lá;
  facets nhẹ như trên. Mắt mờ (vài verts tối, không sắc như mắt vẽ 8×8 của Blocky).
- **ong: TRÒN về khối nhưng GIÀ CHƯA TỚI.** Áo choàng dài + đầu cầu thì mượt,
  nhưng mặt trẻ tóc đen, không râu bạc — chỉ “đóng vai” già bằng trang phục.
  Muốn già thật cần pack có mẫu lão (không có trong FREE tier).
- **tre: TRÒN MƯỢT, NHƯNG KHÔNG PHẢI MODEL TRẺ EM.** Là mẫu Rogue scale 0.72
  nên nhỏ con đúng, mặt/mũi/tóc giống hệt mẫu nu — soi kỹ sẽ nhận ra.
- Chung: pack vốn fantasy (tunic/dây lưng/thắt lưng) nên dù đã bỏ vũ khí/mũ thì
  vẫn hơi “lính dungeon đóng giả nông dân”, chưa thuần áo bà ba/khăn rằn.
  Bù lại: CC0 rõ ràng, tròn hơn Blocky một bậc, đủ nhẹ cho mobile (~1k tris/người).

## 6. Cam kết phạm vi

Chỉ thêm thư mục `assets2/` (12 file `.glb` + file này). KHÔNG đè `assets/` cũ,
KHÔNG sửa `js/`, `tests/`, `index.html`, build script hay bất kỳ code game nào
(game muốn dùng phải tự đấu dây `char2-*` vào runtime ở task khác).
