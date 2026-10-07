#!/usr/bin/env python3
"""Bundler đơn giản: nối 10 ES modules thành 1 file app.js (chỉ dùng cho tests).

Tests (work/tests/*.test.mjs, copy nguyên văn từ ~/workspace/infinia/tests/)
làm 2 việc: (1) trích `// [X-TESTABLE-START]...END` bằng regex rồi eval trong vm,
(2) grep cả file để kiểm tra các điểm tích hợp (const NAMED, THREE.AdditiveBlending...).
Vì vậy app.js phải chứa TOÀN BỘ code (đã strip import/export), không chỉ TESTABLE blocks.

Bản chạy game thật là js/main.js (qua index.html) — file này KHÔNG dùng để chạy.
Bản single-file cho file:// do build-standalone.py sinh (logic tương tự + bọc three.js).
"""
import re, pathlib

WORK = pathlib.Path(__file__).resolve().parent.parent
JS = WORK / 'js'

# Thứ tự topo (không cycle): config, utils trước; main cuối
# VN (v11): thêm vn.js (trước world) + audio.js (trước main) cho đủ 12 modules
ORDER = ['config.js', 'utils.js', 'core.js', 'engine.js', 'vn.js', 'world.js',
         'daynight.js', 'ui.js', 'actors.js', 'combat.js', 'audio.js', 'main.js']

def strip_module(src: str) -> str:
    # Xóa import (kể cả nhiều dòng, kể cả comment cuối dòng)
    src = re.sub(r"^import\b[\s\S]*?from\s*['\"][^'\"]+['\"];.*$", '', src, flags=re.M)
    # Xóa dòng export { a, b };
    src = re.sub(r"^export\s*\{[^}]*\};\s*$", '', src, flags=re.M)
    # Bỏ tiền tố 'export ' trên khai báo
    src = re.sub(r"^export (?=(?:const|let|var|function)\s)", '', src, flags=re.M)
    return src

out = ['// File sinh tự động bởi tools/gen-test-appjs.py — CHỈ DÙNG CHO TESTS.',
       '// Bản chạy game thật là js/main.js (index.html trỏ vào đó).', '']
for name in ORDER:
    src = (JS / name).read_text(encoding='utf-8')
    stripped = strip_module(src).strip()
    assert 'import ' not in stripped.split('\n')[0:3].__str__() or True
    # kiểm tra không còn import/export sót
    assert not re.search(r"^import\s", stripped, flags=re.M), f'còn import trong {name}'
    assert not re.search(r"^export\s", stripped, flags=re.M), f'còn export trong {name}'
    out.append(f'// ===== module: js/{name} =====')
    out.append(stripped)
    out.append('')

(WORK / 'app.js').write_text('\n'.join(out), encoding='utf-8')

# kiểm tra 9 TESTABLE markers còn nguyên
appjs = (WORK / 'app.js').read_text(encoding='utf-8')
tags = re.findall(r'// \[([A-Za-z0-9]+)-TESTABLE-START\]', appjs)
print(f'đã sinh app.js ({len(appjs)} ký tự) từ {len(ORDER)} modules; TESTABLE blocks: {", ".join(tags)}')
assert len(tags) >= 9, f'mất TESTABLE block (chỉ còn {len(tags)}/9 tối thiểu)'
