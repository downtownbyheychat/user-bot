import { getVendorByName, getVendorById, searchItemAcrossVendors, getVendorCatalogue, validateOrderItem, getAllVendors, hasMixedTypes } from './vendor.js';

async function testVendorFunctions() {
  console.log('🧪 Testing Vendor Functions...\n');

  // Test 1: Get vendor by name
  console.log('1️⃣ Testing getVendorByName("alpha")...');
  const vendor = await getVendorByName('alpha');
  console.log(vendor ? `✅ Found: ${vendor.name}` : '❌ Not found');
  console.log('');

  // Test 2: Get vendor by ID
  console.log('2️⃣ Testing getVendorById...');
  if (vendor) {
    const vendorById = await getVendorById(vendor.id);
    console.log(vendorById ? `✅ Found: ${vendorById.name}` : '❌ Not found');
  }
  console.log('');

  // Test 3: Search item across vendors
  console.log('3️⃣ Testing searchItemAcrossVendors("jollof rice")...');
  const items = await searchItemAcrossVendors('jollof rice');
  console.log(`✅ Found ${items.length} vendors selling jollof rice:`);
  items.forEach(item => console.log(`   - ${item.vendor_name}: ${item.food_name} ₦${item.price}`));
  console.log('');

  // Test 4: Get vendor catalogue
  console.log('4️⃣ Testing getVendorCatalogue...');
  if (vendor) {
    const catalogue = await getVendorCatalogue(vendor.id);
    console.log(catalogue ? `✅ Catalogue:\n${catalogue}` : '❌ Failed');
  }
  console.log('');

  // Test 5: Validate order item
  console.log('5️⃣ Testing validateOrderItem...');
  if (vendor) {
    const validation = await validateOrderItem(vendor.id, 'Fried Chicken', 'per_piece', null);
    console.log(validation.valid ? '✅ Valid order' : `❌ ${validation.error}`);
  }
  console.log('');

  // Test 6: Get all vendors
  console.log('6️⃣ Testing getAllVendors...');
  const allVendors = await getAllVendors();
  console.log(`✅ Found ${allVendors.length} active vendors:`);
  allVendors.forEach(v => console.log(`   - ${v.name}`));

  // Test 7: has mixed types
    console.log('\n7️⃣ Testing mixed quantity types detection...');
    const mixedItems = [
      { name: 'Jollof Rice', quantity_type: 'per_price', price: 800 },
      { name: 'Fried Chicken', quantity_type: 'per_piece'},
      { name: 'Boiled Yam & Egg Sauce', quantity_type: 'full_pack', price: 1500 }
    ];

    const mixedTypesResult = await hasMixedTypes(vendor.id, mixedItems);

    console.log(mixedTypesResult ? '✅ Mixed quantity types detected' : '❌ No mixed quantity types');
    console.log('');

  process.exit(0);
}

testVendorFunctions();
