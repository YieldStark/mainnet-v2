#!/bin/bash
set -e

echo "Installing YieldStark..."
echo ""

# Check if swap exists, if not create it
if ! swapon --show | grep -q '/swapfile'; then
    echo "💾 Creating swap file (2GB) for build process..."
    sudo dd if=/dev/zero of=/swapfile bs=1M count=2048 status=progress
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo "✅ Swap enabled"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Run database migration
echo "🗄️  Running database migrations..."
npm run db:migrate

# Build application with increased memory
echo "🔨 Building application..."
NODE_OPTIONS="--max-old-space-size=4096" npm run build

echo ""
echo "✅ Installation complete!"
echo "Run: ./scripts/start.sh"
