#!/bin/bash
set -e

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$APP_DIR/logs"
LOG_FILE="$LOG_DIR/app.log"
ERROR_LOG="$LOG_DIR/error.log"
ENV_FILE="$APP_DIR/.env"

mkdir -p "$LOG_DIR"

# Load .env into the current shell so PM2 inherits the variables
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
    echo "Loaded env from: $ENV_FILE"
else
    echo "⚠️  No .env file found at $ENV_FILE"
fi

echo "Starting YieldStark..."
echo "Logs: $LOG_FILE"
echo "Errors: $ERROR_LOG"

if pm2 list | grep -q "yieldstark"; then
    echo "Restarting..."
    pm2 restart yieldstark --update-env
else
    echo "Starting with PM2..."
    pm2 start npm --name "yieldstark" \
        --cwd "$APP_DIR" \
        --output "$LOG_FILE" \
        --error "$ERROR_LOG" \
        --log-date-format "YYYY-MM-DD HH:mm:ss" \
        --merge-logs \
        -- start
    pm2 save
fi

echo "✅ Application started!"
pm2 status yieldstark
echo ""
echo "View logs:    pm2 logs yieldstark"
echo "Tail log:     tail -f $LOG_FILE"
