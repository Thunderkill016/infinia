#!/usr/bin/env python3
"""Build bản public single-file của INFINIA từ ES modules (K1: tách file).

Đọc:  work/index.html + work/js/*.js (11 modules) + work/vendor/three.module.r186.js
Ghi:  work/standalone/index.html
      (three.js r186 ESM + game code gộp trong MỘT <script type="module"> inline duy nhất;
       không CDN, không module ngoài, store chỉ trong phiên — đúng policy artifact static;
       mở trực tiếp bằng file:// vẫn chạy)

Cách gộp modules: nối 11 module theo thứ tự topo (config → utils → core → engine →
world → daynight → ui → actors → combat → audio → main), xóa dòng import, xóa dòng
`export { ... };`, bỏ tiền tố `export ` trên khai báo. Không cycle nên an toàn.

Cách gộp three (G4): file three.module r186 là ESM bundle tự chứa, chỉ có đúng 1 khối
`export{...};` ở cuối. Bọc toàn bộ trong IIFE (tránh va chạm tên biến minify
với game code), đổi khối export cuối thành `return {...}` (alias `X as Y` → `Y:X`),
gán vào `const THREE`; các dòng `import * as THREE from 'three';` đã bị xóa ở bước
gộp modules, rồi nối: three-đã-xử-lý + game-code vào cùng một module script.

Chạy: python3 work/build-standalone.py  (từ thư mục chứa work/)
"""
import os
import re
import sys

WORK = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(WORK, "standalone")
# VN (v11): three r186 trên unpkg tách làm 2 file (three.module.js chỉ re-export từ
# three.core.js). Bản single-file nhúng thẳng three.core.js (tự chứa, 1 khối export).
THREE_JS = os.path.join(WORK, "vendor", "three.core.js")

# VN (v11): thêm vn.js (bộ đồ họa Việt) vào giữa engine → world (world/actors/combat import từ vn)
MODULE_ORDER = ['config.js', 'utils.js', 'core.js', 'engine.js', 'vn.js', 'world.js',
                'daynight.js', 'ui.js', 'actors.js', 'combat.js', 'audio.js', 'main.js']

html = open(os.path.join(WORK, "index.html"), encoding="utf-8").read()

# 0. Gộp 10 modules thành 1 khối game code (không import/export)
def strip_module(src: str) -> str:
    src = re.sub(r"^import\b[\s\S]*?from\s*['\"][^'\"]+['\"];.*$", '', src, flags=re.M)
    src = re.sub(r"^export\s*\{[^}]*\};\s*$", '', src, flags=re.M)
    src = re.sub(r"^export (?=(?:const|let|var|function)\s)", '', src, flags=re.M)
    return src

parts = []
for name in MODULE_ORDER:
    src = open(os.path.join(WORK, "js", name), encoding="utf-8").read()
    stripped = strip_module(src).strip()
    assert not re.search(r"^import\s", stripped, flags=re.M), f"còn import trong {name}"
    assert not re.search(r"^export\s", stripped, flags=re.M), f"còn export trong {name}"
    parts.append(f"/* ===== module js/{name} ===== */\n" + stripped)
js = "\n\n".join(parts)

# 1. Gỡ importmap (bản dev) — bản public không cần vì three đã inline
if '<script type="importmap">' in html:
    start = html.index('<script type="importmap">')
    end = html.index("</script>", start) + len("</script>")
    html = html[:start] + html[end:]
assert 'type="importmap"' not in html, "vẫn còn importmap"

# 1b. Gỡ thẻ <script src="assets-embedded.js"> (bản dev) — bản public đã inline ở bước 3b
html = re.sub(r'<script\s+src="assets-embedded\.js"\s*></script>\n?', '', html)
assert 'assets-embedded.js' not in html, "vẫn còn tham chiếu assets-embedded.js ngoài"

# 2. Xử lý three r186 (VN v11: bản unpkg tách 2 file — three.core.js tự chứa +
#    three.module.r186.js import core + định nghĩa WebGLRenderer... + export cuối).
#    Gộp đúng ngữ nghĩa ESM: core bọc IIFE riêng (__CORE), module destructure
#    các tên nó import (dòng import ... from './three.core.js'), bỏ dòng re-export,
#    khối export cuối module -> return {...}. Tất cả nằm trong 1 IIFE gán vào THREE.
def _to_obj_list(lst: str) -> str:  # "A, B as C" -> "A, C:B" (object shorthand/destructuring)
    return re.sub(r"([A-Za-z0-9_$]+)\s+as\s+([A-Za-z0-9_$]+)", r"\2:\1", lst)
THREE_MOD = os.path.join(WORK, "vendor", "three.module.r186.js")
core = open(THREE_JS, encoding="utf-8").read()
core = re.sub(r"/\/# sourceMappingURL=.*$", "", core).strip()
def _last_block(src: str, kind: str):
    # Khối export cuối file (list export của three nằm gọn 1 dòng, không chứa
    # ngoặc nhọn lồng nhau): [^{}]* không bao giờ ăn lố sang khối khác.
    # (Dùng [\s\S]*? + neo $ trước đây đã ăn từ khối ĐẦU TIÊN khi file có 2 khối.)
    ms = list(re.finditer(kind + r"\s*\{([^{}]*)\}\s*;?\s*$", src))
    assert ms, f"không tìm thấy khối export cuối ({kind})"
    return ms[-1]
mc = _last_block(core, "export")
assert re.search(r"^export\s*\{", core, flags=re.M), "three.core.js thiếu export"
mod = open(THREE_MOD, encoding="utf-8").read()
mod = re.sub(r"/\/# sourceMappingURL=.*$", "", mod).strip()
mi = re.search(r"^import\s*\{([\s\S]*?)\}\s*from\s*['\"]\./three\.core\.js['\"];.*$", mod, flags=re.M)
assert mi, "không tìm thấy dòng import three.core.js trong three.module"
mm = _last_block(mod, "export")
mod_body = mod[:mm.start()]
mod_body = re.sub(r"^import\s*\{[\s\S]*?\}\s*from\s*['\"]\./three\.core\.js['\"];.*$", "", mod_body, flags=re.M)
me7 = re.search(r"^export\s*\{([^{}]*)\}\s*from\s*['\"]\./three\.core\.js['\"];.*$", mod_body, flags=re.M)
assert me7, "không tìm thấy dòng re-export three.core.js trong three.module"
mod_body = mod_body[:me7.start()] + mod_body[me7.end():]
assert "from './three.core.js'" not in mod_body and 'from "./three.core.js"' not in mod_body, "còn tham chiếu three.core.js ngoài"
def _reexport_map(lst: str) -> str:  # "A, B as C" -> "A: __CORE.A, C: __CORE.B"
    out = []
    for part in lst.split(","):
        part = part.strip()
        if not part:
            continue
        m2 = re.match(r"([A-Za-z0-9_$]+)\s+as\s+([A-Za-z0-9_$]+)$", part)
        if m2:
            out.append(f"{m2.group(2)}: __CORE.{m2.group(1)}")
        else:
            out.append(f"{part}: __CORE.{part}")
    return ", ".join(out)
three_inline = ("const THREE = (() => {\n"
                + "const __CORE = (() => {\n" + core[:mc.start()]
                + "\nreturn {" + _to_obj_list(mc.group(1)) + "};\n})();\n"
                + "const {" + _to_obj_list(mi.group(1)) + "} = __CORE;\n"
                + mod_body
                + "\nreturn {" + _to_obj_list(mm.group(1)) + ", " + _reexport_map(me7.group(1)) + "};\n})();")
assert "</script" not in three_inline.lower(), "three r186 chứa thẻ script"

# 3. Kiểm tra game code sạch
assert "</script" not in js.lower(), "game code chứa thẻ script"

# 3b. Inline assets-embedded.js (G5a/G9): model GLB base64 cho cây.
# File do tools/embed-models.py sinh: `const INFINIA_MODELS = {...}`.
# Đặt TRƯỚC game code để world.js đọc được khi khởi tạo (g5aBuildMeshes).
emb_path = os.path.join(WORK, "assets-embedded.js")
emb_inline = ""
if os.path.exists(emb_path):
    emb_inline = open(emb_path, encoding="utf-8").read().strip()
    assert "</script" not in emb_inline.lower(), "assets-embedded.js chứa thẻ script"
    print("inline models:", emb_path, os.path.getsize(emb_path), "bytes")
else:
    print("chú ý: không có assets-embedded.js — bản public dùng cây procedural")

# 4. Gộp vào một <script type="module"> duy nhất
old_tag = '<script type="module" src="js/main.js"></script>'
assert old_tag in html, "không tìm thấy thẻ script js/main.js trong index.html"
html = html.replace(old_tag,
                    "<script type=\"module\">\n/* three.js r186 ESM inline (vendor/three.module.r186.js) */\n"
                    + three_inline
                    + ("\n/* INFINIA embedded models (assets-embedded.js) */\n" + emb_inline if emb_inline else "")
                    + "\n/* INFINIA game code (11 modules gộp) */\n" + js + "\n</script>")

# 5. bản public: session-only store (không browser storage theo policy).
# Trong bản modules, SAVE_KEY nằm ở config.js, store nằm ở core.js → chỉ thay store, giữ SAVE_KEY.
# Bắt đầu từ "// Lưu:" để gỡ luôn comment nhắc localStorage (check policy soi cả comment).
store_marker = "// Lưu:"
assert store_marker in html, "không tìm thấy // Lưu:"
start = html.index(store_marker)
end = html.index("})();", start) + len("})();")
session_store = """// Bản public static: chỉ lưu trong phiên chơi (không dùng browser storage theo policy).
const store = (() => {
  const mem = {};
  return {
    get: (k) => (k in mem ? mem[k] : null),
    set: (k, v) => { mem[k] = v; },
    del: (k) => { delete mem[k]; },
  };
})();"""
html = html[:start] + session_store + html[end:]

os.makedirs(OUT_DIR, exist_ok=True)
out = os.path.join(OUT_DIR, "index.html")
open(out, "w", encoding="utf-8").write(html)

checks = {
    "localStorage": "localStorage" in html,
    "CDN ngoài": "unpkg.com" in html or "cdn.jsdelivr" in html,
    "import ngoài": 'type="importmap"' in html,
    "module script ngoài": re.search(r'<script[^>]*type="module"[^>]*src=', html) is not None,
    "import three còn sót": "from 'three'" in html,
}
print("ghi:", out, os.path.getsize(out), "bytes")
bad = [k for k, v in checks.items() if v]
if bad:
    print("LỖI:", ", ".join(bad))
    sys.exit(1)
print("OK: single-file, không CDN, không module ngoài, không browser storage")
