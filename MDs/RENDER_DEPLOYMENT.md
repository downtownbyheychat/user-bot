# Render Deployment Guide for Receipt Generation

## Issue
Puppeteer needs Chrome/Chromium installed on the server to generate PDFs from HTML.

## Solution for Render

### Option 1: Add Build Command (Recommended)

In your Render dashboard or `render.yaml`:

```yaml
services:
  - type: web
    name: campus-ai-bot
    env: node
    buildCommand: npm install && npx puppeteer browsers install chrome
    startCommand: npm start
```

### Option 2: Use Dockerfile

Create `Dockerfile`:

```dockerfile
FROM node:18

# Install Chrome dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 3000
CMD ["npm", "start"]
```

### Option 3: Environment Variable

Set in Render dashboard:

```
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

Then update build command:
```bash
npm install && apt-get update && apt-get install -y chromium
```

## Test Locally First

```bash
npm install
node test-receipt.js
```

Check `receipts/ORD1234567890.pdf` - should have:
- Downtown logo and branding
- Background image
- Orange header
- All order details
- Footer with SVG images

## Assets Required

Ensure these files exist in your repo:
- `assests/background.png`
- `assests/downtown.svg`
- `assests/jesus_loves_you.svg`
- `assests/eat_print_repeat.svg`
- `codec-pro-cufonfonts/CodecPro-Regular.ttf`

## Troubleshooting

If receipt generation fails on Render:
1. Check build logs for Chrome installation
2. Verify assets are committed to git
3. Check file paths are correct
4. Ensure `receipts/` folder has write permissions
