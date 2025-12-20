import pool from '../database.js';

// Enable pg_trgm extension for similarity search (run once)
async function enableSimilarity() {
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
  } catch (error) {
    console.error('Extension already exists or error:', error.message);
  }
}

export async function getVendorByName(vendorName) { 
  await enableSimilarity();
  try {
    const result = await pool.query(
      `SELECT * FROM vendors 
       WHERE similarity(LOWER(name), LOWER($1)) > 0.5 
       AND status = $2 
       ORDER BY similarity(LOWER(name), LOWER($1)) DESC 
       LIMIT 1`,
      [vendorName, 'open']
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return null;
  }
}

export async function getVendorId(vendorName) { 
  await enableSimilarity();
  try {
    const result = await pool.query(
      `SELECT id FROM vendors 
       WHERE similarity(LOWER(name), LOWER($1)) > 0.5 
       AND status = $2 
       ORDER BY similarity(LOWER(name), LOWER($1)) DESC 
       LIMIT 1`,
      [vendorName, 'open']
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return null;
  }
}

export async function getVendorById(vendorId) {
  try {
    const result = await pool.query(
      'SELECT * FROM vendors WHERE id = $1 AND status = $2',
      [vendorId, 'open']
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching vendor by ID:', error);
    return null;
  }
}

export async function searchItemAcrossVendors(itemName) {
  await enableSimilarity();
  try {
    const result = await pool.query(
      `SELECT m.*, v.name as vendor_name, v.id as vendor_id 
       FROM menus m 
       JOIN vendors v ON m.vendor_id = v.id 
       WHERE similarity(LOWER(m.food_name), LOWER($1)) > 0.5 
       AND v.status = $2
       ORDER BY similarity(LOWER(m.food_name), LOWER($1)) DESC`,
      [itemName, 'open']
    );
    return result.rows;
  } catch (error) {
    console.error('Error searching items:', error);
    return [];
  }
}

export async function getVendorMenuItems(vendorId) {
  try {
    const result = await pool.query(
      'SELECT * FROM menus WHERE vendor_id = $1 ORDER BY food_type, food_name',
      [vendorId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting menu items:', error);
    return [];
  }
}

export async function getVendorCatalogue(vendorId) {
  try {
    const vendor = await getVendorById(vendorId);
    if (!vendor) return null;

    const result = await pool.query(
      'SELECT * FROM menus WHERE vendor_id = $1 ORDER BY food_type, food_name',
      [vendorId]
    );

    let catalogue = `🍽️ ${vendor.name} Menu:\n\n`;
    result.rows.forEach((item, idx) => {
      catalogue += `${idx + 1}. ${item.food_name}`;
      if (item.sale_quantity === 'per_price') {
        catalogue += ` - from ₦${item.price}\n`;
      } else if (item.sale_quantity === 'per_piece') {
        catalogue += ` - ₦${item.price} each\n`;
      } else if (item.sale_quantity === 'full_pack') {
        catalogue += ` - ₦${item.price} (Full Pack)\n`;
      } else if (item.sale_quantity === 'half_pack') {
        catalogue += ` - ₦${item.price} (Half Pack)\n`;
      } else {
        catalogue += ` - ₦${item.price}\n`;
      }
    });
    return catalogue;
  } catch (error) {
    console.error('Error getting catalogue:', error);
    return null;
  }
}

export async function validateOrderItem(vendorId, itemName, quantityType, price, quantity=1) {
  await enableSimilarity();
  try {
    const result = await pool.query(
      `SELECT * FROM menus 
       WHERE vendor_id = $1 
       AND similarity(LOWER(food_name), LOWER($2)) > 0.5
       ORDER BY similarity(LOWER(food_name), LOWER($2)) DESC
       LIMIT 1`,
      [vendorId, itemName]
    );

    if (result.rows.length === 0) {
      return { valid: false, error: `${itemName} not available at this vendor` };
    }

    const item = result.rows[0];

    // Override quantity_type with database value unless AI detected per_price
    if (quantityType !== 'per_price') {
      quantityType = item.sale_quantity;
    }

    // if we have the quantity as per price wrongly specified
    if (quantityType === 'per_price' && item.sale_quantity !== 'per_price') {
      return { 
        valid: false, 
        error: `${item.food_name} is sold as ${item.sale_quantity}, not per price` 
      };
    }
    
    // if (item.sale_quantity !== quantityType && quantityType !== 'unknown') {
    //   return { 
    //     valid: false, 
    //     error: `${itemName} is sold as ${item.sale_quantity}, not ${quantityType}` 
    //   };
    // }

    if (item.sale_quantity === 'per_price') {
      const minPrice = parseFloat(item.price);
      
      // Check if price is not provided or is null/undefined
      if (!price || price === null || price === undefined) {
        return { 
          valid: false, 
          error: `How much of ${item.food_name} do you want? Minimum price is ₦${minPrice}` 
        };
      }
      
      if (price < minPrice) {
        return { 
          valid: false, 
          error: `Minimum price for ${item.food_name} is ₦${minPrice}` 
        };
      }

      const maxPrice = 1500;
      if (price > maxPrice) {
        return { 
          valid: false, 
          error: `Maximum price that fits into one pack for ${item.food_name} is ₦${maxPrice}` 
        };
      }

      if ((price - minPrice) % 100 !== 0) {
        if ((price - minPrice) % 50 !== 0 && minPrice % 50 === 0) {

            return { 
            valid: false, 
            error: `${item.food_name} must be in multiples of ₦100 from ₦${minPrice}` 
            };
        }
      }
    }

    // For per_price items, use the validated user price
    if (item.sale_quantity === 'per_price') {
      result.rows[0].price = price;
    }
    // For other types, calculate price based on quantity
    else {
      quantityType = item.sale_quantity;
      price = item.price * quantity;
      result.rows[0].price = price;
    }

    return { valid: true, item: result.rows[0] };
  } catch (error) {
    console.error('Error validating item:', error);
    return { valid: false, error: 'Validation error occurred', notFoundAnywhere: false };
  }
}



export async function getAllVendors() {
  try {
    const result = await pool.query(
      `SELECT * FROM vendors 
       WHERE status = $1 
       AND EXISTS (SELECT 1 FROM menus WHERE menus.vendor_id = vendors.id)
       ORDER BY name`,
      ['open']
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return [];
  }
}

export async function checkVendorStatus(vendorName) {
  await enableSimilarity();
  try {
    const result = await pool.query(
      `SELECT id, name, status FROM vendors 
       WHERE similarity(LOWER(name), LOWER($1)) > 0.5 
       ORDER BY similarity(LOWER(name), LOWER($1)) DESC 
       LIMIT 1`,
      [vendorName]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error checking vendor status:', error);
    return null;
  }
}

// checks if the food items have mixed quantity types (per price/per piece with full pack/half pack)
export async function hasMixedTypes(vendorId, items) {
  const quantityTypes = new Set();
  
  for (const item of items) {
    const validation = await validateOrderItem(
      vendorId,
      item.name,
      item.quantity_type,
      item.price
    );
    
    if (!validation.valid) {
      console.error(`Validation failed for ${item.name}: ${validation.error}`);
      continue;
    }
    
    quantityTypes.add(validation.item.sale_quantity);
  }
  
  // Check if per_price OR per_piece exists WITH full_pack OR half_pack
  const hasPerPriceOrPiece = quantityTypes.has('per_price') || quantityTypes.has('per_piece');
  const hasPack = quantityTypes.has('full_pack') || quantityTypes.has('half_pack');
  
  return hasPerPriceOrPiece && hasPack;
}

// checks if swallow is ordered without soup
export async function hasSwallowWithoutSoup(vendorId, items) {
  const foodTypes = new Set();
  
  for (const item of items) {
    const validation = await validateOrderItem(
      vendorId,
      item.name,
      item.quantity_type,
      item.price
    );
    
    if (!validation.valid) continue;
    
    if (validation.item.food_type) {
      foodTypes.add(validation.item.food_type.toLowerCase());
    }
  }
  
  return foodTypes.has('swallow') && !foodTypes.has('soup');
}

// checks if order has only free soup (price = 0)
export async function hasOnlyFreeSoup(vendorId, items) {
  let hasSoup = false;
//   let hasNonSoup = false;
  let hasSwallow = false;
  let allSoupsAreFree = true;
  
  for (const item of items) {
    const validation = await validateOrderItem(
      vendorId,
      item.name,
      item.quantity_type,
      item.price
    );
    
    if (!validation.valid) continue;
    
    const foodType = validation.item.food_type?.toLowerCase();
    const itemPrice = parseFloat(validation.item.price) || 0;
    
    if (foodType === 'soup') {
      hasSoup = true;
      if (itemPrice > 0) {
        allSoupsAreFree = false;
      }
    } else if (foodType === 'swallow') {
        hasSwallow = true;
    }
    // else {
    //   hasNonSoup = true;
    // }
  }
  
  // Return true if order has only soup AND all soups are free (price = 0)
  return hasSoup && !hasSwallow && allSoupsAreFree; //&& !hasNonSoup 
}

// Get available soups at a vendor
export async function getAvailableSoups(vendorId) {
  try {
    const result = await pool.query(
      `SELECT food_name, price, sale_quantity FROM menus 
       WHERE vendor_id = $1 AND LOWER(food_type) = 'soup'
       ORDER BY food_name`,
      [vendorId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching soups:', error);
    return [];
  }
}

// Get available swallows at a vendor
export async function getAvailableSwallows(vendorId) {
  try {
    const result = await pool.query(
      `SELECT food_name, price, sale_quantity FROM menus 
       WHERE vendor_id = $1 AND LOWER(food_type) = 'swallow'
       ORDER BY food_name`,
      [vendorId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching swallows:', error);
    return [];
  }
}
