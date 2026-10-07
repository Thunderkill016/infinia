#!/usr/bin/env bash
# tools/make-product.sh — đóng gói product/dist/ từ bản standalone + PWA.
# Chạy từ thư mục infinia-vn:  bash tools/make-product.sh [version]
# (version mặc định đọc từ product/version.json)
set -euo pipefail
cd "$(dirname "$0")/.."
VER="${1:-$(python3 -c "import json; print(json.load(open('product/version.json'))['version'])")}"
echo "đóng gói INFINIA v$VER ..."
rm -rf product/dist && mkdir -p product/dist
cp standalone/index.html product/dist/index.html
cp product/manifest.webmanifest product/dist/
cp product/version.json product/dist/
[ -f product/icon-192.png ] || python3 tools/make-icons.py
cp product/icon-192.png product/icon-512.png product/dist/
sed "s/__VERSION__/$VER/g" product/sw.js > product/dist/sw.js
cp product/_headers product/dist/_headers 2>/dev/null || true
# Chèn link manifest + đăng ký SW vào <head> bản dist (bản dev/standalone giữ nguyên)
python3 - "$VER" <<'EOF'
import sys
ver = sys.argv[1]
p = 'product/dist/index.html'
s = open(p, encoding='utf-8').read()
pwa = ('<link rel="manifest" href="./manifest.webmanifest">\n'
       '<meta name="theme-color" content="#ffd34d">\n'
       '<script>if("serviceWorker" in navigator){addEventListener("load",function(){'
       'navigator.serviceWorker.register("./sw.js");});}</script>\n')
assert '<link rel="manifest"' not in s
s = s.replace('</head>', pwa + '</head>', 1)
open(p, 'w', encoding='utf-8').write(s)
print('đã chèn PWA vào dist (v%s)' % ver)
EOF
du -sh product/dist && ls -la product/dist
