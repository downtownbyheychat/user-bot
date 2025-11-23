import { generateReceipt } from './src/services/receiptGenerator.js';

// Test data with multiple packs
const testOrderData = {
  orderId: 'ORD1234567890',
  customerName: 'John Doe',
  packs: [
    {
      packNumber: 1,
      vendor: 'BESTMAN RESTAURANT',
      deliveryLocation: 'Block A, Room 205',
      items: [
        { name: 'Jollof Rice', quantity: 2, price: 1500 },
        { name: 'Chicken', quantity: 1, price: 2000 }
      ],
      total: 5000
    },
    {
      packNumber: 2,
      vendor: 'CHEF MAYO',
      deliveryLocation: 'Pickup',
      items: [
        { name: 'Shawarma', quantity: 1, price: 1800 },
        { name: 'Zobo Drink', quantity: 2, price: 500 }
      ],
      total: 2800
    }
  ],
  amount: 7800
};

console.log('🎫 Generating Downtown receipt...\n');
console.log('Order Details:');
console.log(`- Order ID: ${testOrderData.orderId}`);
console.log(`- Customer: ${testOrderData.customerName}`);
console.log(`- Packs: ${testOrderData.packs.length}`);
testOrderData.packs.forEach(pack => {
  console.log(`  Pack ${pack.packNumber}: ${pack.vendor} (${pack.items.length} items) - ₦${pack.total.toLocaleString()}`);
});
console.log(`- Grand Total: ₦${testOrderData.amount.toLocaleString()}\n`);

generateReceipt(testOrderData)
  .then(({ filePath }) => {
    console.log('✅ Receipt generated successfully!');
    console.log(`📄 File saved to: ${filePath}`);
    console.log('\nReceipt includes:');
    console.log('- Multiple packs grouped by vendor');
    console.log('- Pack-specific delivery/pickup info');
    console.log('- Individual pack totals');
    console.log('- Grand total across all packs');
    console.log('- Downtown branding and footer');
  })
  .catch(error => {
    console.error('❌ Receipt generation failed:', error);
  });
