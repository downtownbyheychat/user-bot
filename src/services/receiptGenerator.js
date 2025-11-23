import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import fs from 'fs';
import path from 'path';

export async function generateReceipt(orderData) {
  const { orderId, packs, amount, customerName } = orderData;

  // Use deployed app URLs (replace YOUR_APP_URL with your Render URL)
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  const logoPath = `${baseUrl}/assests/downtown.svg`;
  const jesusPath = `${baseUrl}/assests/jesus_loves_you.png`;
  const eatPath = `${baseUrl}/assests/eat_print_repeat.png`;

  const packsHtml = packs.map(pack => `
    <div style="margin: 15px 0; padding: 10px; background: #f9f9f9; border-radius: 8px;">
      <div style="font-weight: bold; color: #ff4c00; margin-bottom: 8px;">Pack ${pack.packNumber} - ${pack.vendor}</div>
      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th class="qty">Qty</th>
            <th class="price">Price</th>
          </tr>
        </thead>
        <tbody>
          ${pack.items.map(item => {
            const itemTotal = item.quantity * item.price;
            return `
              <tr>
                <td>${item.name}</td>
                <td class="qty">${item.quantity}</td>
                <td class="price">₦${itemTotal.toLocaleString()}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      <div style="text-align: right; font-size: 12px; margin-top: 5px;">
        <strong>Pack Total: ₦${pack.total.toLocaleString()}</strong><br>
        <span style="color: #666;">${pack.deliveryLocation === 'Pickup' ? 'Pickup' : 'Delivery: ' + pack.deliveryLocation}</span>
      </div>
    </div>
  `).join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Order Ticket</title>
  <link href="https://fonts.googleapis.com/css2?family=League+Spartan:wght@400;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Courier New', monospace;
      background: #f0f0f0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
    }
    .ticket {
      width: 350px;
      background: white;
      border-radius: 20px;
      padding: 20px;
      position: relative;
      box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    }
    img {
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
      image-rendering: pixelated;
    }
    .ticket h2 {
      color: #ff4c00;
      font-family: 'League Spartan', sans-serif;
      font-weight: bold;
      font-size: 20px;
      margin-bottom: 5px;
    }
    .ticket .divider {
      border-top: 3px dotted #999;
      margin: 30px 0 20px 0;
    }
    .ticket .field {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 8px 0;
      font-size: 15px;
    }
    .ticket .field-label {
      color: #000;
      font-family: 'Courier New', monospace;
      font-weight: normal;
    }
    .ticket .field-value {
      min-width: 150px;
      text-align: right;
      font-weight: bold;
    }
    .items-table {
      width: 100%;
      margin: 10px 0;
      border-collapse: collapse;
    }
    .items-table th {
      text-align: left;
      padding: 5px 0;
      border-bottom: 1px solid #ddd;
      font-weight: bold;
      font-size: 12px;
    }
    .items-table td {
      padding: 3px 0;
      font-size: 12px;
    }
    .items-table .qty {
      text-align: center;
      width: 30px;
    }
    .items-table .price {
      text-align: right;
      width: 60px;
    }
    .highlight .field-label {
      color: #ff4c00;
      font-family: 'League Spartan', sans-serif;
      font-weight: bold;
    }
    .footer {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 30px;
      margin-top: 40px;
    }
    .top-right {
      position: absolute;
      top: 15px;
      right: 20px;
      text-align: right;
      font-size: 12px;
      color: #444;
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="top-right">
      <div style="color: #999; font-size: 10px; margin-bottom: 2px;">downtown.ng</div>
      <img src="${logoPath}" alt="Downtown" style="width: 40px; height: auto;">
    </div>
    
    <h2>Order Ticket</h2>
    <div class="divider"></div>
    
    <div class="field">
      <span class="field-label">Order Id:</span>
      <span class="field-value">${orderId}</span>
    </div>
    <div class="field">
      <span class="field-label">Customer:</span>
      <span class="field-value">${customerName}</span>
    </div>
    
    <div style="margin: 15px 0;">
      ${packsHtml}
    </div>
    
    <div class="field highlight" style="margin-top: 20px;">
      <span class="field-label">Total:</span>
      <span class="field-value">₦${amount.toLocaleString()}</span>
    </div>
    
    <div class="footer">
      <img src="${jesusPath}" alt="Jesus Loves You" style="width: 80px; height: auto;">
      <div class="circle">
        <img src="${eatPath}" alt="Eat Print Repeat" style="width: 60px; height: auto;">
      </div>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const receiptsDir = path.join(process.cwd(), 'receipts');
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }
    
    const filePath = path.join(receiptsDir, `${orderId}.pdf`);
    
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });
    
    await browser.close();
    
    return { filePath };
  } catch (error) {
    console.error('Receipt generation error:', error);
    throw error;
  }
}