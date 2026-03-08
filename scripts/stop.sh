#!/bin/bash
set -e

echo "Stopping YieldStark..."

if pm2 list | grep -q "yieldstark"; then
    pm2 stop yieldstark
    pm2 delete yieldstark
    pm2 save
    echo "✅ Application stopped"
else
    echo "⚠️  Not running"
fi
