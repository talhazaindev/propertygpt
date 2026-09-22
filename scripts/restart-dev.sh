#!/bin/bash
# Restart PropertyGPT dev server cleanly on 127.0.0.1:3000
set -e
cd "$(dirname "$0")/.."

echo "Stopping anything on port 3000..."
if lsof -tiTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
  lsof -tiTCP:3000 -sTCP:LISTEN | xargs kill -9
  sleep 1
fi

echo "Clearing .next cache..."
rm -rf .next

echo "Starting Next.js on http://127.0.0.1:3000 ..."
exec npm run dev
