import { generateReceipt } from './src/services/receiptGenerator.js';

async function testReceiptGeneration() {
  const testOrderData = {
    orderId: `TEST${Date.now()}`,
    packs: [{
      packNumber: 1,
      vendor: 'EXCEEDING GRACE',
      deliveryLocation: 'Pickup',
      items: [{
        name: 'jollof rice',
        quantity: 1,
        price: 800
      }],
      total: 1050
    }],
    amount: 1050,
    customerName: 'Test Customer'
  };

  try {
    console.log('Generating test receipt...');
    const result = await generateReceipt(testOrderData);
    
    console.log(`✅ PDF created: ${result.filePath}`);
    
    if (result.imagePath) {
      console.log(`✅ Image created: ${result.imagePath}`);
    } else {
      console.log('❌ Image conversion failed');
    }
    
  } catch (error) {
    console.error('❌ Receipt generation failed:', error);
  }
}

testReceiptGeneration();