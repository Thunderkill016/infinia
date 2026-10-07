# NGUỒN MODEL NHÂN VẬT 3D — INFINIA (CC0)

## 1. Nguồn đã dùng: Kenney — Blocky Characters 2.0 (CC0)

- Trang pack: https://kenney.nl/assets/blocky-characters
  (ghi rõ License: Creative Commons CC0, 20 assets, có animation)
- File tải: `kenney_blocky-characters_20.zip` (2 148 510 bytes),
  link trực tiếp:
  `https://kenney.nl/media/pages/assets/blocky-characters/8369c0cf30-1749547469/kenney_blocky-characters_20.zip`
- Zip gồm: `License.txt`, `Models/GLB-FBX-OBJ format/`, `Textures/`,
  `Previews/character-a..r.png`, `Preview.png`.

### Câu license trong pack (trích nguyên văn `License.txt`)

> License: (Creative Commons Zero, CC0)
> http://creativecommons.org/publicdomain/zero/1.0/
>
> You can use this content for personal, educational, and commercial purposes.
>
> Support by crediting 'Kenney' or 'www.kenney.nl' (this is not a requirement)

=> Xác nhận CC0 bằng văn bản: dùng thương mại/không cần ghi nguồn đều được.

### Vì sao không dùng Quaternius Ultimate Animated Character Pack

Đã thử đúng yêu cầu: trang pack https://quaternius.com/packs/ultimatedanimatedcharacter.html
quảng cáo CC0, nhưng trang license hiện tại https://quaternius.com/license.html
ghi "Quaternius Asset License (QAL) v1.0 — Last updated: 8/28/2026", trong đó
điều 3a CẤM "resell or redistribute the Assets themselves (in original or
modified form) as a standalone asset, asset pack…". Pack trên web không kèm
file license, Google Drive mirror tải nguyên pack rất chậm (kẹt ở ~75 MB).
Vì không xác nhận CC0 bằng văn bản được + rủi ro điều khoản tái phân phối,
chọn fallback Kenney (đúng điều khoản dự phòng của task): CC0 rõ ràng,
có `License.txt` trong zip.

## 2. Ánh xạ mẫu đã chọn (xem `Previews/` trong zip gốc)

| Nhóm trong game | File nguồn | Vai / đặc điểm nhận dạng |
|---|---|---|
| nam (nông dân) | `Models/GLB format/character-m.glb` + `Textures/texture-m.png` | áo xanh lá, dây đeo vai nâu, râu (preview m) |
| nu (nữ) | `character-n.glb` + `texture-n.png` | tóc đen, khăn đỏ, áo xanh + váy (preview n) |
| ong (già) | `character-i.glb` + `texture-i.png` | hói, kính trắng, áo xanh nhạt (preview i) |
| tre (trẻ con) | `character-c.glb` + `texture-c.png` | mặt trẻ, tóc vàng, scale 0.72 (preview c) |

## 3. Cách bake ra 12 file (offline, không cần Blender)

Model gốc: 6 mesh hộp (chân trái/phải, torso, tay trái/phải, đầu) dưới các
node riêng, animation `walk` (20 keyframes LINEAR, chu kỳ 0.667 s) xoay các
node — không skinning nên bake thuần numpy:

1. Đọc GLB + texture PNG ngoài (`Textures/texture-?.png`, palette 8-bit;
   UV wrap REPEAT theo sampler mặc định glTF).
2. Nướng màu texture vào `COLOR_0` (sRGB→linear, giống
   `tools/prepare-tree-assets.py`). Mặt box phẳng giữ 4 verts; mặt có biên
   màu (tay áo/bàn tay, giày/quần) chia 2×2; mặt trước/sau torso (dây đeo,
   khăn) chia 4×4; mặt trước đầu (mắt/mũi/miệng) chia 8×8.
3. Pose 0 = bind pose (đứng). Pose 1/2 = 2 pha đối nhau của `walk`
   (chân trái xoay +60°/−60°, t=0.500 s / t=0.167 s): bake world matrix node
   vào vertex (normal qua inverse-transpose + chuẩn hóa).
4. Gộp 6 part → 1 mesh / 1 primitive duy nhất:
   `POSITION` + `NORMAL` + `COLOR_0` (VEC3 float) + `indices` uint16 —
   đúng format `tools/prepare-tree-assets.py` đã làm cho cây, runtime parser
   `js/world.js` ([G5A-TESTABLE] `g5aParseGLB`) đọc được (đã kiểm chứng bằng
   script đọc lại: magic glTF 2.0, đủ chunk JSON+BIN, index trong tầm).
5. Chân đặt y=0. Trẻ con scale đều 0.72 (cao ~1.94 m; người lớn ~2.70 m;
   runtime game tự scale khi gắn NPC — chưa đụng code game).

## 4. Danh sách file + dung lượng + poly (đo từ file bake xong)

| File | Dung lượng | Verts | Tris | Cao |
|---|---|---|---|---|
| char-nam-0.glb (đứng) | 16952 | 378 | 396 | 2.70 m |
| char-nam-1.glb (bước trái) | 16952 | 378 | 396 | 2.37 m |
| char-nam-2.glb (bước phải) | 16952 | 378 | 396 | 2.37 m |
| char-nu-0.glb (đứng) | 16736 | 373 | 390 | 2.70 m |
| char-nu-1.glb (bước trái) | 16736 | 373 | 390 | 2.37 m |
| char-nu-2.glb (bước phải) | 16736 | 373 | 390 | 2.37 m |
| char-ong-0.glb (đứng) | 15872 | 353 | 366 | 2.70 m |
| char-ong-1.glb (bước trái) | 15872 | 353 | 366 | 2.37 m |
| char-ong-2.glb (bước phải) | 15872 | 353 | 366 | 2.37 m |
| char-tre-0.glb (đứng) | 16304 | 363 | 378 | 1.94 m |
| char-tre-1.glb (bước trái) | 16304 | 363 | 378 | 1.71 m |
| char-tre-2.glb (bước phải) | 16304 | 363 | 378 | 1.71 m |

- Mỗi file < 25 KB (max 16952). Tổng 12 file = 197592 bytes (~193 KB) < 250 KB.
- Đã render kiểm tra: mặt (mắt/mũi/miệng/kính/râu/khăn) đúng vị trí và màu
  khớp texture gốc; 3 pose mỗi mẫu khác nhau rõ (chân/tay đánh ngược pha).

## 5. Cam kết phạm vi

Chỉ thêm thư mục `assets/` (12 file `.glb` + file này). KHÔNG sửa `js/`,
`tests/`, `index.html`, build script hay bất kỳ code game nào.
