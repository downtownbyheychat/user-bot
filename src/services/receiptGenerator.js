import htmlPdf from 'html-pdf-node';
import fs from 'fs';
import path from 'path';

export async function generateReceipt(orderData) {
  const { orderId, packs, amount, customerName } = orderData;

  // Convert assets to base64 data URLs
  const rootDir = process.cwd();
  const fontBase64 = fs.readFileSync(path.join(rootDir, 'codec-pro-cufonfonts/CodecPro-Regular.ttf')).toString('base64');
  const bgBase64 = fs.readFileSync(path.join(rootDir, 'assests/background.png')).toString('base64');
  const logoSvg = fs.readFileSync(path.join(rootDir, 'assests/downtown.svg'), 'utf8');
  const jesusPng = fs.readFileSync(path.join(rootDir, 'assests/jesus_loves_you.png')).toString('base64');
  const eatPng = fs.readFileSync(path.join(rootDir, 'assests/eat_print_repeat.png')).toString('base64');
  
  const fontPath = `data:font/truetype;base64,${fontBase64}`;
  const bgPath = `data:image/png;base64,${bgBase64}`;
  const logoPath = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`;
  const jesusPath = `data:image/png;base64,${jesusPng}`;
  const eatPath = `data:image/png;base64,${eatPng}`;

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
    @font-face {
      font-family: 'Codec Pro';
      src: url('${fontPath}') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    body {
      font-family: 'Codec Pro', 'Courier New', monospace;
      background: url('${bgPath}') no-repeat center center;
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
      font-family: 'Codec Pro', 'Courier New', monospace;
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
      <img src="${jesusPath}" alt="Jesus Loves You" style="width: 100px; height: auto; transform: scale(0.5); transform-origin: center;">
      <div class="circle">
        <img src="${eatPath}" alt="Eat Print Repeat" style="width: 100px; height: auto; transform: scale(0.5); transform-origin: center;">
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
    
    const options = { 
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      path: filePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    };
    
    const file = { content: html };
    
    await htmlPdf.generatePdf(file, options);
    
    return { filePath };
  } catch (error) {
    console.error('Receipt generation error:', error);
    throw error;
  }
}