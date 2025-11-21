import { generateOrderSummary } from './src/ai/orderSummary.js';

const testMessage = "I want #800 ofada rice, 1 small chicken, and ofada sause from exceeding grace";

console.log('Testing order parsing...\n');
console.log('Input:', testMessage);
console.log('\n---\n');

generateOrderSummary(testMessage)
  .then(result => {
    console.log('Parsed Output:');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n--- Analysis ---');
    console.log('Vendor:', result.vendor);
    console.log('Items count:', result.items?.length || 0);
    
    if (result.items) {
      result.items.forEach((item, i) => {
        console.log(`\nItem ${i + 1}:`);
        console.log('  Name:', item.name);
        console.log('  Quantity:', item.quantity);
        console.log('  Type:', item.quantity_type);
        console.log('  Price:', item.price);
      });
    }
  })
  .catch(err => {
    console.error('Error:', err);
  });
