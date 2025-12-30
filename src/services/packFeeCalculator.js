import pool from "../db/database.js";

/**
 * Calculate pack fee for a single pack's items
 * Returns 200 if ALL items have pack=true, otherwise 0
 */
export async function calculatePackFeeForItems(items) {
  let PACK_FEE = 200;

  for (const item of items) {
    const menuResult = await pool.query(
      `SELECT pack FROM menus WHERE product_id = $1`,
      [item.productId]
    );
    const menu = menuResult.rows[0];
    if (!menu || menu.pack !== true) {
      PACK_FEE = 0;
      break;
    }
  }

  return PACK_FEE;
}
