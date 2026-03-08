#!/bin/bash
set -e

echo "Starting YieldStark..."

# Check if already running
if pm2 list | grep -q "yieldstark"; then
    echo "Restarting..."
    pm2 restart yieldstark
else
    echo "Starting with PM2..."
    pm2 start npm --name "yieldstark" -- start
    pm2 save
fi

echo "✅ Application started!"
pm2 status yieldstark
