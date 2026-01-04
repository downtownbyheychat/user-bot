import fs from 'fs';
import path from 'path';

async function testPdfToImage() {
  try {
    // Find first PDF in receipts folder
    const receiptsDir = path.join(process.cwd(), 'receipts');
    const files = fs.readdirSync(receiptsDir).filter(f => f.endsWith('.pdf'));
    
    if (files.length === 0) {
      console.log('No PDF files found in receipts folder');
      return;
    }
    
    const pdfFile = files[0];
    const pdfPath = path.join(receiptsDir, pdfFile);
    const orderId = pdfFile.replace('.pdf', '');
    
    console.log(`Testing conversion of: ${pdfFile}`);
    
    const pdf = await import('pdf-poppler');
    const options = {
      format: 'png',
      out_dir: receiptsDir,
      out_prefix: `test_${orderId}`,
      page: 1
    };
    
    await pdf.convert(pdfPath, options);
    const imagePath = path.join(receiptsDir, `test_${orderId}-1.png`);
    
    if (fs.existsSync(imagePath)) {
      console.log(`✅ Success! Image created: ${imagePath}`);
    } else {
      console.log('❌ Image file not created');
    }
    
  } catch (error) {
    console.error('❌ Conversion failed:', error.message);
  }
}

testPdfToImage();