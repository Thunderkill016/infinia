#!/usr/bin/env python3
"""Chuẩn bị asset cây GLB cho INFINIA (backlog G5a).

Việc làm (offline, chạy 1 lần khi đổi asset):
1. Lấy 5 cây Kenney Nature Kit (CC0) + 1 cây cau/dừa (sample-tree-palm.glb, CC0).
2. "Nướng" màu vào vertex (COLOR_0, linear):
   - 5 cây Kenney: UV -> sample colormap.png (lấy từ kenney_fantasy-town-kit.zip,
     cùng họ palette; GLB nature-kit không kèm texture) -> sRGB→linear.
   - palm: màu phẳng baseColorFactor của từng material -> sRGB→linear.
3. Nướng transform của node (palm có node scale lá 1.35) vào vertex.
4. Gộp mỗi cây về ĐÚNG 1 mesh / 1 primitive: POSITION + NORMAL + COLOR_0 + indices.
   Không texture, không material ngoài, không node lồng nhau -> runtime chỉ cần
   parser GLB tối giản (xem [G5A-TESTABLE-*] trong js/world.js).
5. Ghi ra thư mục assets/: tree-thuong-a.glb, tree-thuong-b.glb, tree-da.glb,
   tree-cothu.glb, tree-thong.glb, tree-cau.glb
   Rồi chạy tools/embed-models.py để sinh assets-embedded.js.

Chạy: python3 ~/workspace/infinia/tools/prepare-tree-assets.py
"""
import json
import os
import struct
import sys
import zipfile
import zlib

import numpy as np

BASE = os.path.expanduser("~/workspace/infinia")
RAW = os.path.join(BASE, "assets-sample/raw/Models/GLB format")
SAMPLES = os.path.join(BASE, "assets-sample/samples")
OUT = os.path.join(BASE, "assets")

# ánh xạ: (file nguồn, tên đích, vai trò trong game)
TREES = [
    ("tree.glb", "tree-thuong-a.glb", "thuong"),        # cây thường, tán tròn thấp
    ("tree-high.glb", "tree-thuong-b.glb", "thuong"),   # cây thường, cao
    ("tree-high-round.glb", "tree-da.glb", "da"),       # cây đa: tán tròn -> phóng rộng
    ("tree-crooked.glb", "tree-cothu.glb", "thuong"),   # cây cổ thụ, thân cong
    ("tree-high-crooked.glb", "tree-thong.glb", "thong"),  # cây thông: cao, khẳng khiu
]
PALM_SRC = os.path.join(SAMPLES, "sample-tree-palm.glb")
PALM_DST = "tree-cau.glb"  # cây cau/dừa: tàu lá xòe


def read_glb(path):
    d = open(path, "rb").read()
    if d[:4] != b"glTF":
        raise ValueError("không phải GLB: %s" % path)
    jlen = struct.unpack("<I", d[12:16])[0]
    j = json.loads(d[20:20 + jlen])
    boff = 20 + jlen + ((4 - jlen % 4) % 4)
    binlen = struct.unpack("<I", d[boff:boff + 4])[0]
    return j, d[boff + 8:boff + 8 + binlen]


def decode_png(png):
    """Giải mã PNG 8-bit không interlace -> mảng (h, w, ch) uint8."""
    pos, w, h, ctype, idat = 8, 0, 0, 0, b""
    while pos < len(png):
        ln = struct.unpack(">I", png[pos:pos + 4])[0]
        typ, dat = png[pos + 4:pos + 8], png[pos + 8:pos + 8 + ln]
        if typ == b"IHDR":
            w, h, bd, ctype, comp, filt, inter = struct.unpack(">IIBBBBB", dat)
            assert bd == 8 and inter == 0, "chỉ hỗ trợ PNG 8-bit không interlace"
        elif typ == b"IDAT":
            idat += dat
        pos += 12 + ln
    raw = zlib.decompress(idat)
    ch = {0: 1, 2: 3, 6: 4}[ctype]
    stride = w * ch
    out = np.zeros((h, stride), dtype=np.uint8)
    prev = np.zeros(stride, dtype=np.int32)
    for y in range(h):
        f = raw[y * (stride + 1)]
        line = np.frombuffer(raw, dtype=np.uint8, count=stride,
                             offset=y * (stride + 1) + 1).astype(np.int32)
        cur = np.zeros(stride, dtype=np.int32)
        for i in range(stride):
            a = cur[i - ch] if i >= ch else 0
            b = prev[i]
            c = prev[i - ch] if i >= ch else 0
            if f == 1:
                v = line[i] + a
            elif f == 2:
                v = line[i] + b
            elif f == 3:
                v = line[i] + (a + b) // 2
            elif f == 4:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                v = line[i] + pr
            else:
                v = line[i]
            cur[i] = v & 0xFF
        out[y] = cur
        prev = cur
    return out.reshape(h, w, ch)


def srgb_to_linear(c):
    """c: mảng float [0,1] sRGB -> linear (chuẩn glTF COLOR_0)."""
    c = np.asarray(c, dtype=np.float64)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def get_accessor(j, bindata, idx, ncomp):
    a = j["accessors"][idx]
    bv = j["bufferViews"][a["bufferView"]]
    off = bv.get("byteOffset", 0) + a.get("byteOffset", 0)
    stride = bv.get("byteStride", 0)
    comp = a["componentType"]
    dt = {5121: np.uint8, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}[comp]
    if not stride or stride == ncomp * np.dtype(dt).itemsize:
        return np.frombuffer(bindata, dtype=dt, count=a["count"] * ncomp,
                             offset=off).reshape(-1, ncomp).astype(np.float64)
    # stride rỗng: đọc từng vertex
    out = np.zeros((a["count"], ncomp), dtype=np.float64)
    raw = np.frombuffer(bindata, dtype=np.uint8)
    for i in range(a["count"]):
        out[i] = np.frombuffer(raw, dtype=dt, count=ncomp,
                               offset=off + i * stride).astype(np.float64)
    return out


def get_indices(j, bindata, prim):
    a = j["accessors"][prim["indices"]]
    bv = j["bufferViews"][a["bufferView"]]
    off = bv.get("byteOffset", 0) + a.get("byteOffset", 0)
    comp = a["componentType"]
    dt = {5121: np.uint8, 5123: np.uint16, 5125: np.uint32}[comp]
    return np.frombuffer(bindata, dtype=dt, count=a["count"], offset=off).astype(np.int64)


def node_matrix(n):
    if "matrix" in n:
        return np.array(n["matrix"], dtype=np.float64).reshape(4, 4).T
    t = n.get("translation", [0, 0, 0])
    x, y, z, w = n.get("rotation", [0, 0, 0, 1])
    s = n.get("scale", [1, 1, 1])
    R = np.array([
        [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
        [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
        [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
    ])
    M = np.eye(4)
    M[:3, :3] = R * np.array(s)
    M[:3, 3] = t
    return M


def bake_kenney(src_path, colormap):
    """5 cây Kenney: 1 mesh/1 primitive, UV -> màu palette nướng vào COLOR_0."""
    j, bindata = read_glb(src_path)
    prim = j["meshes"][0]["primitives"][0]
    pos = get_accessor(j, bindata, prim["attributes"]["POSITION"], 3)
    nor = get_accessor(j, bindata, prim["attributes"]["NORMAL"], 3)
    uv = get_accessor(j, bindata, prim["attributes"]["TEXCOORD_0"], 2)
    idx = get_indices(j, bindata, prim)
    h, w = colormap.shape[:2]
    # glTF: v=0 là mép TRÊN ảnh -> sample trực tiếp, không flip
    xi = np.clip((uv[:, 0] * w).astype(int), 0, w - 1)
    yi = np.clip((uv[:, 1] * h).astype(int), 0, h - 1)
    col = srgb_to_linear(colormap[yi, xi][:, :3].astype(np.float64) / 255.0)
    return pos.astype(np.float32), nor.astype(np.float32), col.astype(np.float32), idx


def bake_palm(src_path):
    """Palm: gộp 3 mesh + nướng transform node + màu phẳng material vào COLOR_0."""
    j, bindata = read_glb(src_path)
    nodes = j["nodes"]
    mats = j["materials"]

    def base_color(mi):
        bc = (mats[mi].get("pbrMetallicRoughness") or {}).get("baseColorFactor",
                                                              [1, 1, 1, 1])
        return srgb_to_linear(np.array(bc[:3], dtype=np.float64))

    P, N, C, I = [], [], [], []
    voff = 0

    def walk(ni, PM):
        nonlocal voff
        n = nodes[ni]
        M = PM @ node_matrix(n)
        if "mesh" in n:
            for prim in j["meshes"][n["mesh"]]["primitives"]:
                pos = get_accessor(j, bindata, prim["attributes"]["POSITION"], 3)
                nor = get_accessor(j, bindata, prim["attributes"]["NORMAL"], 3)
                idx = get_indices(j, bindata, prim)
                v4 = np.hstack([pos, np.ones((len(pos), 1))]) @ M.T
                # normal: dùng ma trận nghịch đảo chuyển vị (đúng với scale không đều)
                NM = np.linalg.inv(M[:3, :3]).T
                n3 = nor @ NM
                n3 /= np.linalg.norm(n3, axis=1, keepdims=True) + 1e-12
                col = np.tile(base_color(prim.get("material", 0)), (len(pos), 1))
                P.append(v4[:, :3].astype(np.float32))
                N.append(n3.astype(np.float32))
                C.append(col.astype(np.float32))
                I.append((idx + voff).astype(np.int64))
                voff += len(pos)
        for c in n.get("children", []):
            walk(c, M)

    for s in j.get("scenes", [{"nodes": [0]}]):
        for ni in s["nodes"]:
            walk(ni, np.eye(4))
    P = np.concatenate(P)
    P[:, 1] -= P[:, 1].min()  # đặt gốc cây đúng y=0 (model gốc chìm -0.05)
    return (P, np.concatenate(N), np.concatenate(C), np.concatenate(I))


def write_glb(path, pos, nor, col, idx):
    """Ghi GLB tối giản: 1 mesh/1 primitive, POSITION+NORMAL+COLOR_0+indices."""
    assert pos.dtype == np.float32 and nor.dtype == np.float32
    assert col.dtype == np.float32 and col.shape == pos.shape
    use32 = len(pos) > 65535 or idx.max() > 65535
    idt = np.uint32 if use32 else np.uint16
    idx = idx.astype(idt)
    blob = pos.tobytes() + nor.tobytes() + col.tobytes() + idx.tobytes()
    blob += b"\x00" * ((4 - len(blob) % 4) % 4)
    offs = [0, pos.nbytes, pos.nbytes + nor.nbytes,
            pos.nbytes + nor.nbytes + col.nbytes]
    # 1 bufferView duy nhất ôm cả blob; accessor.byteOffset là tuyệt đối từ đầu buffer
    pmin = [float(x) for x in pos.min(axis=0)]
    pmax = [float(x) for x in pos.max(axis=0)]
    accessors = [
        {"bufferView": 0, "byteOffset": offs[0], "componentType": 5126,
         "count": len(pos), "type": "VEC3", "min": pmin, "max": pmax},
        {"bufferView": 0, "byteOffset": offs[1], "componentType": 5126,
         "count": len(nor), "type": "VEC3"},
        {"bufferView": 0, "byteOffset": offs[2], "componentType": 5126,
         "count": len(col), "type": "VEC3"},
        {"bufferView": 0, "byteOffset": offs[3],
         "componentType": 5125 if use32 else 5123,
         "count": len(idx), "type": "SCALAR"},
    ]
    j = {
        "asset": {"version": "2.0", "generator": "infinia prepare-tree-assets.py (G5a)"},
        "buffers": [{"byteLength": len(blob)}],
        "bufferViews": [{"buffer": 0, "byteOffset": 0, "byteLength": len(blob)}],
        "accessors": accessors,
        "materials": [{"name": "baked",
                       "pbrMetallicRoughness": {"metallicFactor": 0.0,
                                                "roughnessFactor": 1.0},
                       "doubleSided": True}],
        "meshes": [{"name": "tree", "primitives": [{
            "attributes": {"POSITION": 0, "NORMAL": 1, "COLOR_0": 2},
            "indices": 3, "material": 0}]}],
        "nodes": [{"mesh": 0, "name": "tree"}],
        "scenes": [{"nodes": [0]}],
        "scene": 0,
    }
    # NOTE: 4 bufferView trỏ cùng buffer 0 nhưng byteOffset tuyệt đối từ đầu buffer
    # -> gộp thành 1 bufferView duy nhất cho gọn cũng được; giữ 4 cho rõ ràng.
    # Sửa: byteOffset của bufferView là tuyệt đối -> offs đã tuyệt đối. OK.
    jdoc = json.dumps(j, separators=(",", ":")).encode("utf-8")
    jdoc += b" " * ((4 - len(jdoc) % 4) % 4)
    glb = (b"glTF" + struct.pack("<II", 2, 12 + 8 + len(jdoc) + 8 + len(blob))
           + struct.pack("<I", len(jdoc)) + b"JSON" + jdoc
           + struct.pack("<I", len(blob)) + b"BIN\x00" + blob)
    open(path, "wb").write(glb)


def main():
    os.makedirs(OUT, exist_ok=True)
    z = zipfile.ZipFile(os.path.join(BASE, "assets-sample/kenney_fantasy-town-kit.zip"))
    colormap = decode_png(z.read("Models/GLB format/Textures/colormap.png"))
    print("colormap: %dx%d" % (colormap.shape[1], colormap.shape[0]))

    total = 0
    for src_name, dst_name, role in TREES:
        pos, nor, col, idx = bake_kenney(os.path.join(RAW, src_name), colormap)
        dst = os.path.join(OUT, dst_name)
        write_glb(dst, pos, nor, col, idx)
        sz = os.path.getsize(dst)
        total += sz
        print("%-18s -> %-18s verts %4d tris %4d %6d bytes (%s)"
              % (src_name, dst_name, len(pos), len(idx) // 3, sz, role))
    pos, nor, col, idx = bake_palm(PALM_SRC)
    dst = os.path.join(OUT, PALM_DST)
    write_glb(dst, pos, nor, col, idx)
    sz = os.path.getsize(dst)
    total += sz
    print("%-18s -> %-18s verts %4d tris %4d %6d bytes (cau)"
          % ("sample-tree-palm.glb", PALM_DST, len(pos), len(idx) // 3, sz))
    print("tổng GLB thô: %d bytes -> base64 ~%d bytes"
          % (total, int(total * 4 / 3)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
