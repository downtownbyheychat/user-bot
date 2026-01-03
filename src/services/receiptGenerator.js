import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

export async function generateReceipt(orderData) {
  const { orderId, packs, amount, customerName } = orderData;

  const assetsPath = path.join(process.cwd(), 'assests');
  const logoSvg = fs.existsSync(path.join(assetsPath, 'downtown.svg')) ? fs.readFileSync(path.join(assetsPath, 'downtown.svg'), 'base64') : '';
  const jesusPng = fs.existsSync(path.join(assetsPath, 'jesus_loves_you.png')) ? fs.readFileSync(path.join(assetsPath, 'jesus_loves_you.png'), 'base64') : '';
  const eatPng = fs.existsSync(path.join(assetsPath, 'eat_print_repeat.png')) ? fs.readFileSync(path.join(assetsPath, 'eat_print_repeat.png'), 'base64') : '';
  const bgPng = fs.existsSync(path.join(assetsPath, 'background.png')) ? fs.readFileSync(path.join(assetsPath, 'background.png'), 'base64') : '';

  const packsHtml = packs.map(pack => `
    <div style="margin-bottom: 30px;">
      <div class="field highlight">
        <span class="field-label">Pack ${pack.packNumber} - <strong>${pack.vendor}</strong></span>
      </div>
      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th class="qty">Qty</th>
            <th class="price">Price</th>
          </tr>
        </thead>
        <tbody>
          ${pack.items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td class="qty"><strong>${item.quantity}</strong></td>
              <td class="price">N${(item.quantity * item.price).toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="field">
        <span class="field-label">Pack Total:</span>
        <span class="field-value">N${pack.total.toLocaleString()}</span>
      </div>
      <div class="field">
        <span class="field-label">${pack.deliveryLocation === 'Pickup' ? 'Pickup' : 'Delivery'}:</span>
        <span class="field-value"><strong>${pack.deliveryLocation === 'Pickup' ? 'Yes' : pack.deliveryLocation}</strong></span>
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
    @font-face {
      font-family: 'Codec Pro';
      src: url('codec-pro-cufonfonts/CodecPro-Regular.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }

    body {
      font-family: 'Codec Pro', 'Courier New', monospace;
      font-weight: normal;
      background: url('data:image/png;base64,${bgPng}') no-repeat center center;
      background-size: cover;
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
      font-family: 'Codec Pro', 'Courier New', monospace;
      font-weight: normal;
    }

    .ticket .field-value {
      min-width: 150px;
      height: 20px;
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

    .top-right strong {
      display: block;
      font-size: 16px;
      font-weight: bold;
      color: black;
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="top-right">
      <div style="color: #999; font-size: 10px; margin-bottom: 2px;">downtown.ng</div>
      <img src="data:image/svg+xml;base64,${logoSvg}" alt="Downtown" style="width: 40px; height: auto;">
    </div>
    
    <h2>Order Ticket</h2>
    <div class="divider"></div>
    
    <div class="field">
      <span class="field-label">Order Id:</span>
      <span class="field-value">${orderId}</span>
    </div>
    <div class="field">
      <span class="field-label">Customer Name:</span>
      <span class="field-value">${customerName}</span>
    </div>
    
    <div class="divider"></div>
    
    ${packsHtml}
    
    <div class="field highlight">
      <span class="field-label">Total Amount:</span>
      <span class="field-value">N${amount.toLocaleString()}</span>
    </div>
    
    <div class="footer">
      <img src="data:image/png;base64,${jesusPng}" alt="Jesus Loves You" style="width: 60px; height: auto;">
      <div class="circle">
        <img src="data:image/png;base64,${eatPng}" alt="Eat Print Repeat" style="width: 60px; height: auto;">
      </div>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    const receiptsDir = path.join(process.cwd(), 'receipts');
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }
    
    const filePath = path.join(receiptsDir, `${orderId}.pdf`);
    fs.writeFileSync(filePath, pdf);
    
    return { pdf, filePath };
  } catch (error) {
    console.error('Receipt generation error:', error);
    throw error;
  }
}
