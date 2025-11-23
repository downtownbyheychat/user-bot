# Test Receipt Generator

## Run the Test

```bash
node test-receipt.js
```

This will generate a sample receipt in the `receipts/` folder.

## What to Expect

The test will create a PDF receipt with:
- **Order ID**: ORD1234567890
- **Vendor**: BESTMAN RESTAURANT (with gray background header)
- **Customer**: John Doe
- **Delivery**: Block A, Room 205, Campus Hostel
- **Items**:
  - 2x Jollof Rice - ₦3,000
  - 1x Chicken - ₦2,000
  - 3x Zobo Drink - ₦1,500
- **Total**: ₦6,500 (with gray background)

## Design Features

✅ Gray background (#f5f5f5) for header  
✅ Black border around entire receipt  
✅ 300px width (receipt-style)  
✅ Horizontal divider lines  
✅ Bullet points for items  
✅ Bold fonts for vendor name and total  
✅ Gray background for total section  

## Note

PDFKit generates PDFs **programmatically** (not from HTML templates). The design is created using:
- `doc.rect()` for backgrounds and borders
- `doc.text()` for text content
- `doc.moveTo().lineTo().stroke()` for lines
- `doc.fontSize()` and `doc.font()` for styling

This approach is **faster** and **doesn't require a browser** like Puppeteer's HTML-to-PDF conversion.
