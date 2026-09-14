#!/bin/bash
# Double-click this on your Mac to run Pitchside on your home Wi-Fi so your phone can open it.
cd "$(dirname "$0")"
echo "=== Pitchside — local test server ==="
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Get it from https://nodejs.org (LTS), then double-click this again."
  read -n 1 -s -r -p "Press any key to close."; exit 1
fi
if [ ! -d node_modules ]; then
  echo "First run: installing (about a minute)..."
  npm install
fi
if [ ! -f .env.local ]; then
  echo ""
  echo "No .env.local yet — running with the FREE data key (one game per club)."
  echo "For full data: copy .env.example to .env.local and paste your API-Football key."
  echo ""
fi
echo ""
echo "Starting. In a moment you'll see a line like:"
echo "   Network: http://192.168.1.23:5173/"
echo "Open that address in Safari on your phone (same Wi-Fi). Add to Home Screen for the full effect."
echo "Close this window to stop."
echo ""
npm run dev
