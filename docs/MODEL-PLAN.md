# MODEL-PLAN — Kế hoạch nâng đồ họa INFINIA bằng model 3D miễn phí

Ngày: 2026-10-07 | Người research: Thunder (subagent) | Trạng thái: research + mẫu đã tải, CHƯA sửa code

## 1. Nguồn model đã kiểm chứng license

| Nguồn | License | Cách kiểm chứng | Ghi chú |
|---|---|---|---|
| **Kenney.nl** (kenney.nl/assets) | **CC0 toàn site** — public domain, dùng thương mại không cần ghi nguồn | Đọc License.txt trong pack tải về: "License: (Creative Commons Zero, CC0)"; nhiều nguồn độc lập xác nhận | Hàng trăm pack, style low-poly đồng nhất, có sẵn GLB |
| **Quaternius** (quaternius.com) | **CC0 từng pack** | Trang pack có link creativecommons.org/publicdomain/zero/1.0 | Nhân vật có rig + animation, quái, nature; tải qua Google Drive (hay bị quota) hoặc itch.io |
| **KayKit** (kaylousberg.itch.io) | CC0 | Ghi trên trang pack | Đồ họa đẹp, ít pack hơn |
| Poly Pizza | CC0/CC-BY **từng model** — phải đọc từng trang | — | Chỉ dùng khi cần model lẻ, nhớ ghi nguồn nếu CC-BY |

> ⚠️ Quy tắc: chỉ dùng model CC0 (không cần ghi nguồn) để khỏi rắc rối pháp lý khi lên portal. Không dùng model "free nhưng cấm redistribute".

## 2. Đề xuất pack/model cụ thể cho từng loại cần

| Loại cần trong game | Pack đề xuất | Link | License | Vì sao chọn |
|---|---|---|---|---|
| Nhân vật chính (nông dân) + 9 NPC | **Quaternius Ultimate Animated Character Pack** — 52 nhân vật chunky có animation (đi bộ, idle) | https://quaternius.com/packs/ultimatedanimatedcharacter.html → tải qua Google Drive/itch.io https://quaternius.itch.io/ | CC0 | Có sẵn animation đi bộ — thay được animation procedural hiện tại; chọn 3–4 biến thể (nam/nữ/già/trẻ) cho 9 NPC |
| Nón lá (đội cho nhân vật) | **Tự làm bằng Blender** (hình nón + vành, ~200 tris) | — | Tự tạo = CC0 | Không pack free nào có nón lá VN; làm 5 phút trong Blender |
| Nhà tranh/vách đất (6 nhà làng) | **Kenney Fantasy Town Kit** — tường + mái modular | https://kenney.nl/assets/fantasy-town-kit (tải: `kenney_fantasy-town-kit_2.0.zip`) | CC0 | Mảnh tường/mái nhỏ (5–8KB/mảnh); **recolor mái sang màu rơm** cho ra nhà tranh VN |
| Cây nhiệt đới (~150 cây) | **Kenney Nature Kit** — `tree_palm*.glb` (cọ nhiệt đới) | https://kenney.nl/assets/nature-kit (tải: `kenney_nature-kit.zip`) | CC0 | Cọ hợp khí hậu VN hơn cây thông; file nhỏ (~28KB/cây) |
| Quái "vũng thiu" (blob) | **Quaternius Cute Animated Monsters Pack** — chọn con blob | https://quaternius.com/packs/cutemonsters.html | CC0 | Blob có sẵn mắt/miệng — fix luôn lỗi V2 "quái như quả bóng xanh" |
| Quái dơi đêm | **Quaternius Ultimate Animated Animal Pack** (12 con vật, kiểm tra có bat) | https://quaternius.com/packs/ultimateanimatedanimal.html | CC0 | Có animation bay |
| Quái cua | Cùng pack animal trên (kiểm tra có crab) hoặc **Kenney** | — | CC0 | Nếu không có → nặn cua đơn giản bằng Blender (mai + càng) |
| Lu nước, gánh hàng, bàn ghế | **Kenney Furniture Kit** / **Quaternius Fantasy Props MegaKit** | https://kenney.nl/assets/furniture-kit ; https://quaternius.com/packs/fantasypropsmegakit.html | CC0 | Đồ nội thất/prop chung |
| Đèn lồng | **Tự làm** (khối cầu + sprite glow đã có sẵn G1) | — | — | Game đã có đèn lồng đẹp, không cần thay |
| Rau dại (quest Bà Tám Xén) | **Quaternius Ultimate Crops Pack** | https://quaternius.com/packs/ultimatecrops.html | CC0 | Rau/cây trồng đúng quest nhặt rau |

## 3. Mẫu đã tải về kiểm tra

Thư mục: `~/workspace/infinia/assets-sample/` (4 file GLB, đã verify magic bytes `glTF`)

| File | Nguồn | Dung lượng | Dùng để kiểm tra |
|---|---|---|---|
| `samples/sample-character.glb` | Kenney fantasy-town-kit (`character-a.glb`) | 113 KB | Nhân vật thay capsule hiện tại |
| `samples/sample-tree-palm.glb` | Kenney nature-kit (`tree_palmDetailedTall.glb`) | 28 KB | Cây cọ thay cây nón procedural |
| `samples/sample-house-roof.glb` | Kenney fantasy-town-kit (`roof-gable.glb`) | 7.6 KB | Mái nhà modular |
| `samples/sample-house-wall.glb` | Kenney fantasy-town-kit (`wall-wood.glb`) | 4.8 KB | Tường nhà modular |

(Zip gốc 3 pack nằm cùng thư mục `assets-sample/` để tham khảo thêm; thư mục `raw/` chứa file giải nén.)

## 4. Kế hoạch tích hợp vào Three.js r186

### 4.1. Pipeline đề xuất

```
[1] Chọn model GLB từ pack → [2] Blender: xóa bớt poly không cần, gộp material,
    xuất lại GLB (không nén Draco) → [3] Script build: đọc GLB → base64 → nhúng
    vào standalone HTML dưới dạng data URI → [4] Game: GLTFLoader().load(dataURI)
    → cache 1 lần → clone/instance cho các vị trí (InstancedMesh nếu cùng model)
```

- **GLTFLoader r186** đọc được data URI (`data:model/gltf-binary;base64,...`) — đã có sẵn trong three r186, không cần thêm lib.
- **Không dùng Draco**: decoder WASM ~300KB, nuốt gần hết ngân sách — GLB thường + base64 đơn giản hơn và đủ nhẹ với model low-poly.
- **Giữ nguyên hệ LOD/culling G2**: model thay thế mesh procedural nhưng vẫn đi qua cùng hệ LOD theo khoảng cách.
- **Animation**: model Quaternius có sẵn clip (Idle/Walk) — dùng `THREE.AnimationMixer`, thay animation code tay hiện tại cho nhân vật.

### 4.2. Xử lý bài toán single-file (bản public 1 file HTML)

| Phương án | Cách làm | Ưu/nhược |
|---|---|---|
| **A. Embed base64 (khuyến nghị)** | Build script đọc từng GLB → base64 → nhúng vào `<script>` dưới dạng `const MODELS = {tree: "data:..."}` | + 1 file duy nhất, chạy offline, đúng chuẩn portal hiện tại. − tăng ~33% dung lượng so với GLB gốc |
| B. File rời + lazy load | Để GLB cạnh index.html, `GLTFLoader.load("models/tree.glb")` | + nhẹ file chính. − bản public hiện tại là 1 file (artifact), không đảm bảo host file rời → **loại** |
| C. Procedural giữ nguyên | Không dùng model ngoài | + 0KB. − đồ họa không bứt phá → **không đạt mục tiêu của Hoàng** |

→ **Chốt phương án A.**

### 4.3. Ước tính dung lượng (ngân sách portal <2MB)

Hiện tại standalone ~857KB (đã gồm three r186 747KB inline). Ngân sách còn lại: **~1.150KB**.

| Model | GLB gốc | Sau base64 (+33%) | Số lượng dùng | Ghi chú |
|---|---|---|---|---|
| Cọ nhiệt đới (1 mẫu) | 28 KB | 37 KB | instance ×150 | 1 file duy nhất, nhân bản |
| Nhân vật (3 biến thể) | 113 KB × 3 | 450 KB | clone ×10 | Chọn 3 mẫu nam/nữ/già |
| Mái + tường nhà (4 mảnh) | ~25 KB | 33 KB | instance ×6 nhà | Modular |
| Quái blob (1 mẫu) | ~60 KB | 80 KB | clone ×4 | Ước tính theo pack |
| Nón lá tự làm | ~5 KB | 7 KB | instance | Blender |
| Props (lu, gánh, rau: 5 mẫu) | ~100 KB | 133 KB | — | Ước tính |
| **Tổng cộng** | | **~740 KB** | | |
| **Tổng file cuối** | | **~1.600 KB** | | ✅ Dưới 2MB, còn dư ~400KB |

> Lưu ý: số liệu quái/props là ước tính từ pack tương tự — đo thực tế khi chọn model và cập nhật bảng này.

### 4.4. Thứ tự ưu tiên (đẹp nhất / KB cao nhất trước)

1. **Cây cọ nhiệt đới** (37KB) — phủ khắp map, đập vào mắt đầu tiên khi mở game. Thay toàn bộ cây nón procedural.
2. **Nhân vật chính + NPC** (450KB) — người chơi nhìn nhân vật 100% thời gian; animation đi bộ có sẵn trông thật hơn code tay.
3. **Nón lá** (7KB) — bản sắc Việt, rẻ nhất, đội lên nhân vật chính + vài NPC.
4. **Nhà (mái rơm recolor)** (33KB) — 6 nhà làng là trung tâm khung hình.
5. **Quái blob có mặt** (80KB) — fix lỗi V2, quái nhìn "sống" hơn.
6. **Props làng** (133KB) — lu nước, gánh hàng, rau dại: chi tiết gần khi đi bộ quanh làng.

### 4.5. So sánh vị trí đồ họa (để Hoàng biết mình đang ở đâu)

| Game | Đồ họa | Ngân sách file | Vị trí của INFINIA |
|---|---|---|---|
| **INFINIA hiện tại** | Procedural thuần (hình nón, hộp, capsule) | ~857KB | — |
| **INFINIA sau model plan** | Low-poly có model thật + animation | ~1.6MB | ✅ Ngang **Vampire Survivors web** / **Shell Shockers** về độ "có hình có dạng" |
| Stardew Valley | Pixel art vẽ tay | ~1.5GB (PC) | Không so trực tiếp (khác nền tảng) — mục tiêu "cảm giác ấm" tương đương |
| Brutal Age / game H5 VN | Model 3D low-poly + texture | 50–200MB (app) | INFINIA nhẹ hơn 30–100 lần, hợp portal hơn |
| Vô Hạn (dev Bình Châu, concept) | Chưa có bản chơi công khai để so | — | INFINIA đã có game chơi được thật |

Kết luận: với model CC0, INFINIA lên được **ngang tầm game web top** về mặt hình ảnh trong khi vẫn giữ file <2MB — đây chính là lợi thế cạnh tranh của kịch bản B ("Cozy Việt Nam đầu tiên trên portal").

## 5. Việc tiếp theo (cho vòng auto-dev, KHÔNG làm trong task này)

- [ ] Viết `tools/embed-models.py`: đọc GLB → base64 → sinh `models-data.js`
- [ ] Sửa `build-standalone.py`: nhúng `models-data.js` vào HTML
- [ ] Thay cây → nhân vật → nón lá → nhà → quái → props theo thứ tự §4.4, mỗi bước chụp ảnh so sánh
- [ ] Đo lại dung lượng file cuối sau mỗi bước, đảm bảo <2MB
- [ ] Giữ fallback procedural nếu model load lỗi (đúng luật L2: luôn có bản chơi được)

---
*Nguồn kiểm chứng trong phiên research 2026-10-07: License.txt pack Kenney (CC0), trang pack quaternius.com (link CC0), test tải thực tế 3 pack Kenney thành công; Quaternius Google Drive bị quota nên mẫu nhân vật tạm dùng Kenney.*
