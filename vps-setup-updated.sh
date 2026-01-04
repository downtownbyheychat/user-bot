#!/bin/bash
echo "🚀 Setting up VPS for Campus AI Bot..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js dependencies for Puppeteer
echo "🎭 Installing Puppeteer dependencies..."
sudo apt install -y \
  chromium-browser \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libxss1 \
  libnss3

# Install GraphicsMagick for PDF to PNG conversion
echo "📄 Installing PDF conversion tools..."
sudo apt install -y graphicsmagick

# Install Node.js and npm if not present
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Set Puppeteer to use system Chromium
echo "⚙️ Configuring Puppeteer..."
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

echo "✅ VPS setup complete!"
echo "💡 Run 'npm install pdf2pic' in your project directory"
echo "💡 Make sure to set environment variables in .env file"