import { handleIntent } from './intentHandlers.js';
import { generateOrderSummary } from './orderSummary.js';

async function testFoodOrdering() {
  console.log('🧪 Testing Food Ordering Intent...\n');

  const testCases = [
    // {
    //     name: "Vendor only",
    //     message: "I want to order from Alpha",
    //     customerId: "test_customer_123"
    // },
    {
      name: "Food Item(s) only",
      message: "I want sausage and breadwarma",
      customerId: "test_customer_123"
    },
    // {
    //   name: "Invalid Price (Maximum)",
    //   message: "I want ₦2500 Jollof Spaghetti, 2 Moi Moi and one big Chicken wings from exceeding grace delivered to my hostel ",
    //   customerId: "test_customer_123"
    // },
    // {
    //   name: "Invalid Price (Below Minimum)",
    //   message: "I want ₦100 native rice from Alpha delivered to hostel",
    //   customerId: "test_customer_123"
    // },

//     {
//     name: "Only Add-ons",
//     message: "I want 2 eggs and 1 sausage from RUKAMAR T",
//     customerId: "test_customer_123"
//   },
    
    // {
    //   name: "Mixed Types",
    //   message: "I want a pack of Boiled Yam & Egg Sauce, Ofada Rice ₦800 from exceeding grace delivered to my hostel",
    //   customerId: "test_customer_123"
    // },
    // {
    //     name: "complete order",
    //     message: "I want ₦800 jollof rice, 2 fried chicken and a ice chocolate from Alpha delivered to my hostel",
    //     customerId: "test_customer_123"
    // },
//     {
//     name: "Vague Food Request (No Order Summary)",
//     message: "I want to order food",
//     customerId: "test_customer_123"
//   },
//     {
//     name: "Vendor not found",
//     message: "I want to order food from Ozeba",
//     customerId: "test_customer_123"
//   },
  ];

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TEST: ${testCase.name}`);
    console.log(`MESSAGE: "${testCase.message}"`);
    console.log('='.repeat(60));

    try {
      // Generate order summary
      const orderSummary = await generateOrderSummary(testCase.message);
      console.log('\n📦 Order Summary:', JSON.stringify(orderSummary, null, 2));

      // Handle intent
      const response = await handleIntent(
        "Food Ordering",
        testCase.customerId,
        testCase.message,
        orderSummary
      );

      console.log('\n✅ Response:');
      console.log(`Status: ${response.status}`);
      console.log(`Type: ${response.response_type}`);
      console.log(`\nMessage:\n${response.message}`);
      
      if (response.data) {
        console.log('\n📊 Data:', JSON.stringify(response.data, null, 2));
      }
    } catch (error) {
      console.error('\n❌ Error:', error.message);
      console.error(error.stack);
    }
  }

  console.log('\n\n✅ All tests completed!');
  process.exit(0);
}

testFoodOrdering();
