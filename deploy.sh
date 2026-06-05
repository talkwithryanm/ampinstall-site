#!/bin/bash
# deploy.sh — Rebuild + deploy ampinstall.com
# Run from workspace root: cd evchargerinstallernearme.com && bash deploy.sh

set -e

BUILD_DIR="$(cd "$(dirname "$0")" && pwd)"
SITE_DIR="/tmp/out3"
PID_FILE="/tmp/ampinstall-server.pid"

echo "=== Building site ==="
cd "$BUILD_DIR"
python3 build_site.py

echo ""
echo "=== Deploying to $SITE_DIR ==="
rm -rf "$SITE_DIR/evcharger"
cp -r "$BUILD_DIR" "$SITE_DIR/evcharger"
cp "$BUILD_DIR/build_site.py" "$SITE_DIR/build_site.py"

echo ""
echo "=== Restarting server ==="
fuser -k 9877/tcp 2>/dev/null || true
sleep 1
cd "$SITE_DIR/evcharger"
nohup /usr/bin/python3 /home/openclaw/.openclaw/ampinstall-server.py > /tmp/ampinstall-server.out 2>&1 &
sleep 2

# Verify
if ss -tlnp | grep -q ":9877 "; then
    echo "✅ Server running on port 9877"
    echo "✅ Site deployed"
else
    echo "❌ Server failed to start"
    exit 1
fi
