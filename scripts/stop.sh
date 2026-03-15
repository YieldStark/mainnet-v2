#!/bin/bash
set -e

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$APP_DIR/logs"

echo "Stopping YieldStark..."

if pm2 list | grep -q "yieldstark"; then
    pm2 stop yieldstark
    pm2 delete yieldstark
    pm2 save
    echo "✅ Application stopped"
else
    echo "⚠️  Not running"
fi

if [ -d "$LOG_DIR" ]; then
    echo ""
    echo "Logs preserved in: $LOG_DIR"
    echo "  app.log:   $(wc -l < "$LOG_DIR/app.log" 2>/dev/null || echo 0) lines"
    echo "  error.log: $(wc -l < "$LOG_DIR/error.log" 2>/dev/null || echo 0) lines"
fi
