#!/usr/bin/env python3
"""Vẽ icon PWA 192/512 cho INFINIA (nón lá vàng trên nền đêm) — 0 designer, 0 asset ngoài."""
from PIL import Image, ImageDraw

for size, name in ((192, 'product/icon-192.png'), (512, 'product/icon-512.png')):
    img = Image.new('RGB', (size, size), (11, 14, 20))
    g = ImageDraw.Draw(img)
    # Hào quang làng quê
    for r, c in ((0.48, (42, 58, 90)), (0.40, (58, 74, 110)), (0.32, (255, 211, 77))):
        rr = int(size * r)
        g.ellipse([size // 2 - rr, size // 2 - rr, size // 2 + rr, size // 2 + rr], fill=c)
    # Nón lá: tam giác vàng rơm + quai
    w = size * 0.30
    cx, cy = size // 2, int(size * 0.46)
    g.polygon([(cx - w, cy + w * 0.35), (cx + w, cy + w * 0.35), (cx, cy - w * 0.55)], fill=(217, 185, 92))
    g.line([(cx - w, cy + w * 0.35), (cx, cy - w * 0.55), (cx + w, cy + w * 0.35)], fill=(140, 106, 58), width=max(2, size // 128))
    g.ellipse([cx - 4, cy - w * 0.55 - 4, cx + 4, cy - w * 0.55 + 4], fill=(140, 106, 58))
    img.save(name)
    print('ghi', name, img.size)
