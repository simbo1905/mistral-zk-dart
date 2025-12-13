#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "=== OPAQUE-TS Dev Server ==="
echo ""

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

if [ ! -f "client/dist/opaque-client.js" ]; then
  echo "Building client..."
  npm run build -w client
fi

echo ""
echo "Starting server on http://localhost:3456"
echo ""
echo "To load the extension:"
echo "  1. Open chrome://extensions"
echo "  2. Enable Developer Mode"
echo "  3. Click 'Load unpacked'"
echo "  4. Select: $(pwd)/extension"
echo ""

npm run dev
