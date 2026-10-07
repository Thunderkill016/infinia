#!/usr/bin/env bash
# Deploy INFINIA (product/dist) lên Cloudflare Pages.
# Xác thực: KHÔNG dán token vào chat/log. Lưu token vào file riêng rồi trỏ tới:
#   echo 'xxx' > ~/.config/cloudflare-token && chmod 600 ~/.config/cloudflare-token
#   CF_TOKEN_FILE=~/.config/cloudflare-token bash product/deploy-pages.sh
# Token cần quyền: Account / Cloudflare Pages / Edit (tạo tại dash.cloudflare.com/profile/api-tokens).
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT="${PAGES_PROJECT:-infinia}"
TOKEN_FILE="${CF_TOKEN_FILE:-$HOME/.config/cloudflare-token}"
if [ ! -f "$TOKEN_FILE" ]; then
  echo "Thiếu token: lưu API token vào $TOKEN_FILE rồi chạy lại." >&2
  exit 1
fi

export CLOUDFLARE_API_TOKEN
CLOUDFLARE_API_TOKEN="$(cat "$TOKEN_FILE")"

echo "Deploy product/dist (${PROJECT}) ..."
npx -y wrangler@4 pages deploy product/dist --project-name="$PROJECT"
