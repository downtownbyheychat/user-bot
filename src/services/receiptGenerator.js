import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export async function generateReceipt(orderData) {
  const { orderId, packs, amount, customerName } = orderData;

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
      doc.fontSize(10).fillColor('#999').text('downtown.ng', 450, 50, { align: 'right' });
      doc.fontSize(20).fillColor('#ff4c00').font('Helvetica-Bold').text('Order Ticket', 50, 80);
      
      // Dotted line
      doc.moveTo(50, 115).lineTo(550, 115).dash(5, { space: 5 }).stroke();
      doc.undash();
      
      // Order details
      let y = 135;
      doc.fontSize(12).fillColor('#000').font('Courier');
      doc.text('Order Id:', 50, y);
      doc.text(orderId, 300, y, { align: 'right' });
      
      y += 20;
      doc.text('Customer:', 50, y);
      doc.text(customerName, 300, y, { align: 'right' });
      
      // Packs
      y += 30;
      packs.forEach(pack => {
        doc.roundedRect(50, y, 500, 10, 5).fillAndStroke('#f9f9f9', '#ddd');
        y += 5;
        
        doc.fontSize(11).fillColor('#ff4c00').font('Helvetica-Bold');
        doc.text(`Pack ${pack.packNumber} - ${pack.vendor}`, 60, y);
        y += 20;
        
        // Table header
        doc.fontSize(9).fillColor('#000').font('Helvetica-Bold');
        doc.text('Item', 60, y);
        doc.text('Qty', 350, y, { width: 50, align: 'center' });
        doc.text('Price', 450, y, { width: 90, align: 'right' });
        y += 15;
        
        doc.moveTo(60, y).lineTo(540, y).stroke('#ddd');
        y += 5;
        
        // Items
        doc.fontSize(9).font('Courier');
        pack.items.forEach(item => {
          const itemTotal = item.quantity * item.price;
          doc.text(item.name, 60, y, { width: 280 });
          doc.text(item.quantity.toString(), 350, y, { width: 50, align: 'center' });
          doc.text(`₦${itemTotal.toLocaleString()}`, 450, y, { width: 90, align: 'right' });
          y += 15;
        });
        
        // Pack total
        y += 5;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(`Pack Total: ₦${pack.total.toLocaleString()}`, 450, y, { width: 90, align: 'right' });
        y += 12;
        doc.fontSize(8).fillColor('#666').font('Helvetica');
        const deliveryText = pack.deliveryLocation === 'Pickup' ? 'Pickup' : `Delivery: ${pack.deliveryLocation}`;
        doc.text(deliveryText, 450, y, { width: 90, align: 'right' });
        y += 25;
      });
      
      // Grand total
      y += 10;
      doc.fontSize(13).fillColor('#ff4c00').font('Helvetica-Bold');
      doc.text('Total:', 50, y);
      doc.text(`₦${amount.toLocaleString()}`, 300, y, { align: 'right' });
      
      // Footer text
      y += 50;
      doc.fontSize(9).fillColor('#666').font('Helvetica');
      doc.text('Jesus Loves You', 150, y, { align: 'center' });
      doc.text('Eat • Print • Repeat', 350, y, { align: 'center' });
      
      doc.end();
      
      stream.on('finish', () => resolve({ filePath }));
      stream.on('error', reject);
    } catch (error) {
      console.error('Receipt generation error:', error);
      reject(error);
    }
  });
}
