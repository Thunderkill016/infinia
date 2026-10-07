#!/usr/bin/env python3
"""Nhúng model 3D (.glb) vào game INFINIA dưới dạng base64 (backlog G9).

Đọc:   mọi file .glb trong thư mục assets/ (mặc định ~/workspace/infinia/assets/)
Ghi:   file JS chứa dict {tên_file: data_url} (mặc định ~/workspace/infinia/assets-embedded.js)
       Game dùng GLTFLoader().load(dataURL) để tải model — không cần file rời,
       đúng chuẩn single-file của bản public.

Kiểm tra ngân sách: tổng dung lượng file game cuối (standalone hiện tại +
file JS sinh ra) phải < 2MB (ngân sách portal theo MODEL-PLAN.md §4.3).
Vượt ngân sách -> vẫn ghi file nhưng thoát mã 2 để vòng auto-dev bắt được.

Chạy:  python3 ~/workspace/infinia/tools/embed-models.py [--input DIR] [--output FILE]
"""
import argparse
import base64
import json
import os
import sys

BASE = os.path.expanduser("~/workspace/infinia")
DEFAULT_INPUT = os.path.join(BASE, "assets")
DEFAULT_OUTPUT = os.path.join(BASE, "assets-embedded.js")
DEFAULT_STANDALONE = os.path.expanduser("~/workspace/infinia-standalone-v2/index.html")
BUDGET_TOTAL = 2 * 1024 * 1024  # 2MB — ngân sách portal (MODEL-PLAN.md §4.3)
DATA_URL_PREFIX = "data:model/gltf-binary;base64,"


def glb_to_data_url(path):
    """Đọc file .glb -> data URL base64. GLTFLoader r186 đọc được trực tiếp."""
    with open(path, "rb") as f:
        raw = f.read()
    if raw[:4] != b"glTF":
        raise ValueError("không phải file GLB hợp lệ (thiếu magic 'glTF'): %s" % path)
    return DATA_URL_PREFIX + base64.b64encode(raw).decode("ascii"), len(raw)


def build_embedded_js(items, total_raw):
    """items: list[(tên_file, data_url)] đã sắp xếp. Trả về nội dung file JS."""
    lines = [
        "// TỰ SINH bởi tools/embed-models.py — KHÔNG sửa tay.",
        "// Chạy lại: python3 tools/embed-models.py",
        "// Tổng: %d file, %d bytes GLB gốc." % (len(items), total_raw),
        "const INFINIA_MODELS = {",
    ]
    for name, url in items:
        lines.append("  %s: %s," % (json.dumps(name), json.dumps(url)))
    lines.append("};")
    lines.append('if (typeof module !== "undefined" && module.exports) { module.exports = INFINIA_MODELS; }')
    return "\n".join(lines) + "\n"


def check_budget(embedded_bytes, standalone_path):
    """Trả về (vượt_ngân_sách: bool, bản_in: str)."""
    standalone_bytes = os.path.getsize(standalone_path) if os.path.exists(standalone_path) else 0
    projected = standalone_bytes + embedded_bytes
    over = projected > BUDGET_TOTAL
    report = (
        "ngân sách: standalone hiện tại %d bytes + models %d bytes = %d bytes dự kiến\n"
        "ngân sách: %d bytes -> %s"
        % (standalone_bytes, embedded_bytes, projected, BUDGET_TOTAL,
           "VƯỢT NGÂN SÁCH ❌" if over else "OK ✅ (còn dư %d bytes)" % (BUDGET_TOTAL - projected))
    )
    return over, report


def main():
    ap = argparse.ArgumentParser(description="Nhúng .glb thành base64 cho INFINIA (G9).")
    ap.add_argument("--input", default=DEFAULT_INPUT, help="thư mục chứa .glb")
    ap.add_argument("--output", default=DEFAULT_OUTPUT, help="file JS đầu ra")
    ap.add_argument("--standalone", default=DEFAULT_STANDALONE,
                    help="file standalone hiện tại để tính ngân sách")
    ap.add_argument("--budget-mb", type=float, default=2.0, help="ngân sách MB (mặc định 2)")
    args = ap.parse_args()

    global BUDGET_TOTAL
    BUDGET_TOTAL = int(args.budget_mb * 1024 * 1024)

    if not os.path.isdir(args.input):
        print("LỖI: không tìm thấy thư mục input: %s" % args.input)
        return 1

    files = sorted(f for f in os.listdir(args.input) if f.lower().endswith(".glb"))
    if not files:
        print("chú ý: không có file .glb nào trong %s — ghi dict rỗng." % args.input)

    items, total_raw = [], 0
    print("%-32s %12s %12s" % ("file", "GLB gốc", "base64"))
    for name in files:
        path = os.path.join(args.input, name)
        url, raw_len = glb_to_data_url(path)
        items.append((name, url))
        total_raw += raw_len
        print("%-32s %12d %12d" % (name, raw_len, len(url.encode("ascii"))))

    js = build_embedded_js(items, total_raw)
    with open(args.output, "w", encoding="utf-8") as f:
        f.write(js)
    embedded_bytes = len(js.encode("utf-8"))
    print("ghi: %s (%d bytes)" % (args.output, embedded_bytes))

    over, report = check_budget(embedded_bytes, args.standalone)
    print(report)
    return 2 if over else 0


if __name__ == "__main__":
    sys.exit(main())
