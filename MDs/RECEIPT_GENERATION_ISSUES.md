
# Receipt Generation Issues

## Problem 1: Receipt Generated Before Payment

### Current Behavior
Receipt generation is triggered in `webhook.js` line 237 whenever an `order_summary` exists:

```javascript
// If there's an order summary, generate and send a receipt
if (responseData.data?.order_summary?.items?.length > 0) {
    await generateAndSendReceipt(customerId, responseData.data.order_summary);
}
```

This happens during:
- Initial order validation ("I want suyawama")
- Vendor selection
- Order corrections
- ANY time order_summary is present in the response

### Why This Is Wrong
- Receipt should only be generated AFTER payment is confirmed
- Currently generates 3+ times per order (every validation step)
- Wastes resources and causes confusion
- Payment happens when user clicks "Payment Sent" button

### Solution
**Remove lines 236-238 from webhook.js** - Delete this block entirely:

```javascript
// DELETE THIS BLOCK
if (responseData.data?.order_summary?.items?.length > 0) {
    await generateAndSendReceipt(customerId, responseData.data.order_summary);
}
```

Receipt generation already exists in the correct place: `buttonHandler.js` line 127 in the `payment_sent` case.

---

## Problem 2: Puppeteer Chrome Not Found

### Error Message
```
Error: Could not find Chrome (ver. 142.0.7444.59). This can occur if either
 1. you did not perform an installation before running the script (e.g. `npx puppeteer browsers install chrome`) or
 2. your cache path is incorrectly configured (which is: /opt/render/.cache/puppeteer).
```

### Root Cause
The Render server doesn't have Chrome/Chromium installed. Puppeteer needs a browser to generate PDFs.

### Solutions

#### Option 1: Install Chrome on Render (Recommended)
Add to your `render.yaml` or build script:

```yaml
services:
  - type: web
    name: campus-ai-bot
    env: node
    buildCommand: |
      npm install
      npx puppeteer browsers install chrome
    startCommand: npm start
```

Or add a `build.sh` script:
```bash
#!/bin/bash
npm install
npx puppeteer browsers install chrome
```

#### Option 2: Use Puppeteer with Bundled Chromium
Change `package.json` to use full `puppeteer` instead of `puppeteer-core`:

```json
{
  "dependencies": {
    "puppeteer": "^21.0.0"  // Instead of puppeteer-core
  }
}
```

Then update `receiptGenerator.js`:
```javascript
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ 
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']  // Required for Render
});
```

#### Option 3: Use Alternative PDF Library (Fastest Fix)
Replace Puppeteer with a lighter library like `pdfkit`:

```bash
npm install pdfkit
```

Update `receiptGenerator.js`:
```javascript
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export async function generateReceipt(orderData) {
  const { orderId, items, amount, vendor, customerName, deliveryAddress } = orderData;
  
  const receiptsDir = path.join(process.cwd(), 'receipts');
  if (!fs.existsSync(receiptsDir)) {
    fs.mkdirSync(receiptsDir, { recursive: true });
  }
  
  const filePath = path.join(receiptsDir, `${orderId}.pdf`);
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  
  doc.pipe(fs.createWriteStream(filePath));
  
  // Header
  doc.fontSize(20).text(vendor, { align: 'center' });
  doc.moveDown();
  
  // Order details
  doc.fontSize(12);
  doc.text(`Order ID: ${orderId}`);
  doc.text(`Customer: ${customerName}`);
  doc.text(`Address: ${deliveryAddress}`);
  doc.moveDown();
  
  // Items
  doc.text('Items:');
  items.forEach(item => {
    doc.text(`• ${item.quantity}x ${item.name} - ₦${item.price}`);
  });
  doc.moveDown();
  
  // Total
  doc.fontSize(14).text(`Total: ₦${amount}`, { align: 'right' });
  
  doc.end();
  
  return { filePath };
}
```

---

## Recommended Fix Order

1. **Immediate**: Remove receipt generation from webhook.js (lines 236-238)
2. **Deploy Fix**: Choose one of the Puppeteer solutions above
3. **Test**: Verify receipt only generates after "Payment Sent" button click

---

## Current Flow (Broken)
```
User: "I want suyawama"
→ AI validates order
→ ❌ Receipt generated (WRONG!)
→ Shows vendor list

User: Selects vendor
→ Order validated
→ ❌ Receipt generated (WRONG!)
→ Shows pickup/delivery

User: Clicks "Payment Sent"
→ ✅ Receipt generated (CORRECT!)
```

## Fixed Flow
```
User: "I want suyawama"
→ AI validates order
→ Shows vendor list

User: Selects vendor
→ Order validated
→ Shows pickup/delivery

User: Clicks "Payment Sent"
→ ✅ Receipt generated (ONLY TIME!)
```
