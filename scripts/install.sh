#!/bin/bash
set -e

echo "Installing YieldStark..."

# Install dependencies
npm install

# Run database migration
npm run db:migrate

# Build application
npm run build

echo "✅ Installation complete!"
echo "Run: ./scripts/start.sh"
