import pool from "../db/database.js";

/**
 * Calculate pack fee for a single pack's items
 * Returns 200 if ALL items have pack=true, otherwise 0
 */
export async function calculatePackFeeForItems(items) {
  let PACK_FEE = 200;

  for (const item of items) {
    if (!item.productId) {
      console.log("⚠️ Item missing productId:", item);
      PACK_FEE = 0;
      break;
    }

    const menuResult = await pool.query(
      `SELECT pack FROM menus WHERE product_id = $1`,
      [item.productId]
    );
    const menu = menuResult.rows[0];
    
    console.log(`Checking pack fee for ${item.name}:`, menu?.pack);
    
    if (!menu || menu.pack !== true) {
      PACK_FEE = 0;
      console.log(`❌ No pack fee - ${item.name} has pack=${menu?.pack}`);
      break;
    }
  }

  console.log("Final pack fee:", PACK_FEE);
  return PACK_FEE;
}
