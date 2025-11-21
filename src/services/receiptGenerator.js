import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

export async function generateReceipt(orderData) {
  const { orderId, items, amount, vendor, customerName, deliveryAddress } = orderData;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .receipt {
          width: 300px;
          padding: 20px;
          border: 1px solid #000;
          font-family: Arial, sans-serif;
        }
        .header { text-align: center; margin-bottom: 20px; }
        .field { margin: 5px 0; }
        .total { font-weight: bold; margin-top: 10px; }
        hr { margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <h2>${vendor}</h2>
        </div>
        <div class="field">Order ID: ${orderId}</div>
        <div class="field">Customer: ${customerName}</div>
        <div class="field">Address: ${deliveryAddress}</div>
        <hr>
        <div class="field">Items:</div>
        ${items.map(item => `<div>• ${item.quantity}x ${item.name} - ₦${item.price}</div>`).join('')}
        <hr>
        <div class="total">Total: ₦${amount}</div>
      </div>
    </body>
    </html>
  `;

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html);
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