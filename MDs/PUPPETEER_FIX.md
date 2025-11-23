# Quick Fix: Replace Puppeteer with PDFKit

## Why?
Puppeteer requires Chrome/Chromium to be installed on the server, which adds complexity and deployment issues on Render.

## Solution: Use PDFKit (Lightweight, No Browser Required)

### Step 1: Install PDFKit
```bash
npm install pdfkit
npm uninstall puppeteer puppeteer-core
```

### Step 2: Replace receiptGenerator.js

Replace the entire contents of `src/services/receiptGenerator.js` with:

```javascript
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export async function generateReceipt(orderData) {
  const { orderId, items, amount, vendor, customerName, deliveryAddress } = orderData;
  
  return new Promise((resolve, reject) => {
    try {
      const receiptsDir = path.join(process.cwd(), 'receipts');
      if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
      }
      
      const filePath = path.join(receiptsDir, `${orderId}.pdf`);
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(filePath);
      
      doc.pipe(stream);
      
      // Header
      doc.fontSize(24).text(vendor, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).text('Order Receipt', { align: 'center' });
      doc.moveDown(1.5);
      
      // Order details
      doc.fontSize(12);
      doc.text(`Order ID: ${orderId}`, { continued: false });
      doc.text(`Customer: ${customerName}`);
      doc.text(`Delivery: ${deliveryAddress}`);
      doc.moveDown();
      
      // Divider
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
      
      // Items header
      doc.fontSize(14).text('Items:', { underline: true });
      doc.moveDown(0.5);
      
      // Items list
      doc.fontSize(11);
      items.forEach(item => {
        const itemTotal = item.quantity * item.price;
        doc.text(`${item.quantity}x ${item.name}`, { continued: true });
        doc.text(`₦${itemTotal.toLocaleString()}`, { align: 'right' });
      });
      
      doc.moveDown();
      
      // Divider
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
      
      // Total
      doc.fontSize(16).text('Total:', { continued: true, bold: true });
      doc.text(`₦${amount.toLocaleString()}`, { align: 'right' });
      
      // Footer
      doc.moveDown(2);
      doc.fontSize(10).text('Thank you for ordering with Downtown!', { align: 'center' });
      doc.text('downtown.ng', { align: 'center', link: 'https://downtown.ng' });
      
      doc.end();
      
      stream.on('finish', () => {
        resolve({ filePath });
      });
      
      stream.on('error', reject);
      
    } catch (error) {
      reject(error);
    }
  });
}
```

### Step 3: Update package.json
Remove puppeteer dependencies:
```json
{
  "dependencies": {
    "pdfkit": "^0.15.0"
    // Remove: "puppeteer" or "puppeteer-core"
  }
}
```

### Step 4: Deploy
```bash
git add .
git commit -m "fix: Replace Puppeteer with PDFKit for receipt generation"
git push
```

## Benefits
- ✅ No browser installation required
- ✅ Faster PDF generation
- ✅ Smaller deployment size
- ✅ Works on any server (Render, Heroku, AWS, etc.)
- ✅ Lower memory usage

## Test Locally
```bash
npm install
npm start
# Complete an order and click "Payment Sent"
# Receipt should generate without errors
```
