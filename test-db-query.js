import pool from './src/db/database.js';

async function testSimilaritySearch() {
  try {
    // Enable pg_trgm extension
    await pool.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    
    // Test 1: Find vendor "exceeding grace"
    console.log('Test 1: Finding vendor "exceeding grace"...\n');
    const vendorResult = await pool.query(
      `SELECT id, name FROM vendors 
       WHERE similarity(LOWER(name), LOWER($1)) > 0.3 
       AND status = $2 
       ORDER BY similarity(LOWER(name), LOWER($1)) DESC 
       LIMIT 1`,
      ['exceeding grace', 'active']
    );
    
    if (vendorResult.rows.length > 0) {
      const vendor = vendorResult.rows[0];
      console.log('✓ Vendor found:', vendor.name);
      console.log('  ID:', vendor.id);
      
      // Test 2: Search for items with typos
      const testItems = [
        'ofada rice',
        'small chicken', 
        'ofada sause'  // typo: should match "ofada sauce"
      ];
      
      console.log('\nTest 2: Searching menu items...\n');
      
      for (const itemName of testItems) {
        const itemResult = await pool.query(
          `SELECT food_name, price, sale_quantity, 
                  similarity(LOWER(food_name), LOWER($2)) as score
           FROM menus 
           WHERE vendor_id = $1 
           AND similarity(LOWER(food_name), LOWER($2)) > 0.4
           ORDER BY similarity(LOWER(food_name), LOWER($2)) DESC
           LIMIT 1`,
          [vendor.id, itemName]
        );
        
        if (itemResult.rows.length > 0) {
          const item = itemResult.rows[0];
          console.log(`✓ "${itemName}" matched:`, item.food_name);
          console.log(`  Price: ₦${item.price}`);
          console.log(`  Type: ${item.sale_quantity}`);
          console.log(`  Similarity: ${(item.score * 100).toFixed(1)}%`);
        } else {
          console.log(`✗ "${itemName}" - NO MATCH FOUND`);
        }
        console.log('');
      }
    } else {
      console.log('✗ Vendor not found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

testSimilaritySearch();
