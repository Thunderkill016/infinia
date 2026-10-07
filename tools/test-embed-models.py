#!/usr/bin/env python3
"""Test round-trip cho tools/embed-models.py (backlog G9).

Kiểm tra: encode .glb -> base64 -> decode ra đúng bytes ban đầu,
dùng 4 file mẫu trong assets-sample/samples/.

Chạy: python3 ~/workspace/infinia/tools/test-embed-models.py
Thoát 0 nếu tất cả pass, 1 nếu có fail.
"""
import base64
import importlib.util
import os
import sys

BASE = os.path.expanduser("~/workspace/infinia")
SAMPLES = os.path.join(BASE, "assets-sample", "samples")
EMBED = os.path.join(BASE, "tools", "embed-models.py")

spec = importlib.util.spec_from_file_location("embed_models", EMBED)
embed_models = importlib.util.module_from_spec(spec)
spec.loader.exec_module(embed_models)

fails = []


def check(name, cond, detail=""):
    print(("PASS" if cond else "FAIL"), "-", name, detail)
    if not cond:
        fails.append(name)


def main():
    files = sorted(f for f in os.listdir(SAMPLES) if f.lower().endswith(".glb"))
    check("tìm thấy 4 file mẫu", len(files) == 4, "(thấy %d)" % len(files))

    items = []
    for name in files:
        path = os.path.join(SAMPLES, name)
        raw = open(path, "rb").read()

        # 1. round-trip: encode -> decode == bytes gốc
        url, raw_len = embed_models.glb_to_data_url(path)
        check("magic glTF giữ nguyên: %s" % name, raw_len == len(raw))
        check("prefix data URL đúng: %s" % name,
              url.startswith(embed_models.DATA_URL_PREFIX))
        decoded = base64.b64decode(url[len(embed_models.DATA_URL_PREFIX):])
        check("round-trip đúng bytes: %s" % name, decoded == raw,
              "(%d bytes)" % len(raw))
        items.append((name, url))

    # 2. file JS sinh ra chứa đủ key và khai báo đúng
    js = embed_models.build_embedded_js(items, sum(os.path.getsize(os.path.join(SAMPLES, n)) for n, _ in items))
    check("JS khai báo INFINIA_MODELS", "const INFINIA_MODELS = {" in js)
    for name, _ in items:
        check("JS chứa key %s" % name, ('"%s"' % name) in js)
    check("JS không chứa thẻ script (an toàn nhúng HTML)", "</script" not in js.lower())

    # 3. ngân sách: 4 file mẫu phải dưới 2MB
    over, _ = embed_models.check_budget(len(js.encode("utf-8")),
                                        os.path.expanduser("~/workspace/infinia-standalone-v2/index.html"))
    check("4 file mẫu dưới ngân sách 2MB", not over)

    print("---")
    if fails:
        print("THẤT BẠI: %d test (%s)" % (len(fails), ", ".join(fails)))
        return 1
    print("TẤT CẢ PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
