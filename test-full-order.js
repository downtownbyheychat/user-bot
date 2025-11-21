import { processMessage } from './src/services/messageProcessor.js';

const testMessage = "I want #800 ofada rice, 1 small chicken, and ofada sause from exceeding grace";
const customerId = "test_user_123";

console.log('Testing full order flow...\n');
console.log('Input:', testMessage);
console.log('\n---\n');

processMessage(customerId, testMessage)
  .then(result => {
    console.log('Response Status:', result.status);
    console.log('Response Type:', result.response_type);
    console.log('\nMessage to User:');
    console.log(result.message);
    
    if (result.data?.order_summary) {
      console.log('\n--- Order Summary (from AI) ---');
      console.log('Vendor:', result.data.order_summary.vendor);
      result.data.order_summary.items.forEach((item, i) => {
        console.log(`\nItem ${i + 1}:`);
        console.log('  Name:', item.name);
        console.log('  Quantity:', item.quantity);
        console.log('  Type:', item.quantity_type);
        console.log('  Price (from AI):', item.price);
      });
    }
  })
  .catch(err => {
    console.error('Error:', err);
  });
