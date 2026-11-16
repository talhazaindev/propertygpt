#!/usr/bin/env bash
# Print the Mac Wi‑Fi LAN URL for EXPO_PUBLIC_API_BASE_URL (physical devices).
set -euo pipefail
IF=$(route get default 2>/dev/null | awk '/interface:/{print $2}')
IP=$(ipconfig getifaddr "${IF:-en0}" 2>/dev/null || true)
if [ -z "${IP:-}" ]; then
  echo "Could not detect LAN IP. Connect to Wi‑Fi and retry." >&2
  exit 1
fi
echo "http://${IP}:3000"
echo ""
echo "Add to propertygpt/mobile/.env:"
echo "EXPO_PUBLIC_API_BASE_URL=http://${IP}:3000"
echo "EXPO_PUBLIC_SERVER_ORIGIN=http://${IP}:3000"
echo ""
echo "Phone and Mac must be on the same Wi‑Fi. Restart Expo after changing .env."
