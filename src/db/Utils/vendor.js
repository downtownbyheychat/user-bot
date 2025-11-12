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
       WHERE similarity(LOWER(name), LOWER($1)) > 0.3 
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
       WHERE similarity(LOWER(name), LOWER($1)) > 0.3 
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
       WHERE similarity(LOWER(m.food_name), LOWER($1)) > 0.3 
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

export async function getVendorCatalogue(vendorId) {
  try {
    const vendor = await getVendorById(vendorId);
    if (!vendor) return null;

    const result = await pool.query(
      'SELECT * FROM menus WHERE vendor_id = $1 ORDER BY food_type, food_name',
      [vendorId]
    );

    // Create list template for menu items
    const menuItems = result.rows.map((item, idx) => {
      let priceInfo = '';
      if (item.sale_quantity === 'per_price') {
        priceInfo = `from ₦${item.price}`;
      } else if (item.sale_quantity === 'per_piece') {
        priceInfo = `₦${item.price} each`;
      } else if (item.sale_quantity === 'full_pack') {
        priceInfo = `₦${item.price} (Full Pack)`;
      } else if (item.sale_quantity === 'half_pack') {
        priceInfo = `₦${item.price} (Half Pack)`;
      } else {
        priceInfo = `₦${item.price}`;
      }
      
      return {
        id: `item_${item.id}`,
        title: item.food_name,
        description: priceInfo
      };
    });
    
    return {
      message: `🍽️ ${vendor.name} Menu:`,
      data: {
        list: {
          header: `${vendor.name} Menu`,
          button: "View Items",
          sections: [
            {
              title: "Menu Items",
              rows: menuItems
            }
          ]
        }
      }
    };
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
       AND similarity(LOWER(food_name), LOWER($2)) > 0.4
       ORDER BY similarity(LOWER(food_name), LOWER($2)) DESC
       LIMIT 1`,
      [vendorId, itemName]
    );

    if (result.rows.length === 0) {
        const vendors = await searchItemAcrossVendors(itemName);
        const vendorList = vendors.map(v => `${v.vendor_name} (${v.food_name})`).join(', ');
      return { valid: false, error: `${itemName} not available at this vendor, you can find it at: ${vendorList}` };
    }

    const item = result.rows[0];

    // if we have the quantity as per price wrongly specified
    if (quantityType === 'per_price' && item.sale_quantity !== 'per_price') {
      return { 
        valid: false, 
        error: `${itemName} is sold as ${item.sale_quantity}, not per price` 
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
      if (price < minPrice) {
        return { 
          valid: false, 
          error: `Minimum price for ${itemName} is ₦${minPrice}` 
        };
      }

      const maxPrice = 1500;
      if (price > maxPrice) {
        return { 
          valid: false, 
          error: `Maximum price that fits into one pack for ${itemName} is ₦${maxPrice}` 
        };
      }

      if ((price - minPrice) % 100 !== 0) {
        return { 
          valid: false, 
          error: `${itemName} must be in multiples of ₦100 from ₦${minPrice}` 
        };
      }
    }

    // set the quantity type and price manually for others
    else{
        quantityType = item.sale_quantity;
        price = item.price * quantity;
        result.rows[0].price = price;
    }

    // // if per piece, the price must match exactly or be a multiple of the item price
    // if (item.sale_quantity === 'per_piece') {
    //   const unitPrice = parseFloat(item.price);
    //     if (price < unitPrice) {
    //         return {
    //             valid: false,
    //             error: `Minimum price for ${itemName} is ₦${unitPrice}`
    //         };
    //     }
    //     if ((price - unitPrice) % unitPrice !== 0) {
    //         return {
    //             valid: false,
    //             error: `${itemName} must be in multiples of ₦${unitPrice} from ₦${unitPrice}`
    //         };
    //     }
    // }

    return { valid: true, item: result.rows[0] };
  } catch (error) {
    console.error('Error validating item:', error);
    return { valid: false, error: 'Validation error occurred' };
  }
}



export async function getAllVendors() {
  try {
    const result = await pool.query(
      'SELECT * FROM vendors WHERE status = $1 ORDER BY name',
      ['open']
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return [];
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

// checks for if an order has only add on items
export async function hasOnlyAddOns(vendorId, items) {
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
  
  if (quantityTypes.size === 1 && quantityTypes.has('add_on')) {
    return true;
  }

    return false;

}
