import pool from "../db/database.js";
import express from "express";
import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

import {
  initializeProductIds,
  arenaProductIds,
  bestmanProductIds,
  famotProductIds,
  reneesProductIds,
  rukamatProductIds,
  yomiceProductIds,
  afkProductIds,
  alphaProductIds,
  mayoProductIds,
  excProductIds,
} from "./catalogRegistry.js";


const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;


// Helper function to find which vendor array a product_id belongs to

function findVendorArray(productId) {
  initializeProductIds();
  const vendors = {
    arenaProductIds,
    bestmanProductIds,
    famotProductIds,
    reneesProductIds,
    rukamatProductIds,
    yomiceProductIds,
    afkProductIds,
    alphaProductIds,
    mayoProductIds,
    excProductIds,
  };

  for (const [vendorName, productArray] of Object.entries(vendors)) {
    if (productArray.includes(productId)) {
      return { vendorName, productArray };
    }
  }

  return null;
}

export async function processCart(cart, to) {
  console.log(`cart from: ${cart.from}`);

  const itemsList = [];
  let vendorName = "";
  let vendorId = "";
  let grandTotal = 0;
  let firstVendorInfo = null;

  for (let i = 0; i < cart.order.product_items.length; i++) {
    const product = cart.order.product_items[i];
    const product_id = product.product_retailer_id;
    console.log("product id", product_id);

    // Find which vendor array this product belongs to
    const currentVendorInfo = findVendorArray(product_id);

    if (!currentVendorInfo) {
      console.log(`Product ${product_id} not found in any vendor array`);
      continue;
    }

    // First product - save the vendor info
    if (i === 0) {
      firstVendorInfo = currentVendorInfo;
      console.log(`First product vendor: ${firstVendorInfo.vendorName}`);
    } else {
      // Check if subsequent products are from the same vendor
      if (currentVendorInfo.vendorName !== firstVendorInfo.vendorName) {
        console.log(
          `ERROR: Cannot order from multiple vendors! First vendor: ${firstVendorInfo.vendorName}, Current product vendor: ${currentVendorInfo.vendorName}`
        );

        // Send a message to the user
        await sendMultiVendorError(
          to,
          firstVendorInfo.vendorName,
          currentVendorInfo.vendorName
        );

        return; // Stop the function
      }
    }

    // Fetch menu item
    const menuResult = await pool.query(
      `SELECT * FROM menus WHERE product_id = $1`,
      [product.product_retailer_id]
    );

    if (menuResult.rows.length === 0) continue;
    const menu = menuResult.rows[0];

    // Fetch vendor (only once)
    if (!vendorName) {
      const vendorResult = await pool.query(
        `SELECT id, name FROM vendors WHERE id = $1`,
        [menu.vendor_id]
      );
      if (vendorResult.rows.length > 0) {
        vendorName = vendorResult.rows[0].name;
        vendorId = vendorResult.rows[0].id;
      }
    }

    const quantity = product.quantity;
    const price = product.item_price;
    const total = quantity * price;
    grandTotal += total;
    console.log('total', total)

    // Store item with correct structure
    itemsList.push({
      name: menu.food_name,
      price,
      quantity,
      total,
      saleQuantity: menu.sale_quantity,
      startingPrice: menu.price,
      productId: menu.product_id,
    });
  }
  console.log("Items List:", itemsList);

  // Check for per_price items with prices below starting price
  for (const item of itemsList) {
    if (item.saleQuantity === "per_price") {
      if (item.total < item.startingPrice) {
        console.log(
          `ERROR: Item "${item.name}" price (₦${item.total}) is below minimum starting price (₦${item.startingPrice})`
        );

        await sendMinimumPriceError(to, item.name, item.startingPrice);

        return; // Stop the function
      }
    }
  }

  // Create consistent session data format
  const orderSummary = {
    vendorId,
    vendorName,
    items: itemsList,
    total: grandTotal,
  };

  console.log("ORDER SUMMARY:", orderSummary);

  // Save session
  const { setPendingOrder, getPendingOrder } = await import(
    "./sessionManager.js"
  );
  const customerId = to.replace(/\D/g, "");
  setPendingOrder(customerId, { orderSummary });

  console.log("Saved pending order:", getPendingOrder(customerId));

  function buildItemsList(orderSummary) {
    const itemLines = orderSummary.items
      .map((i) => `${i.name} (x${i.quantity}) — ₦${i.total}`)
      .join("\n");

    return (
      `*Order:*\n${itemLines} from` +
      `${orderSummary.vendorName}\n`
    );
  }

  await sendOrderSummary(to, vendorId, orderSummary);

  async function sendOrderSummary(to, vendorId, orderSummary) {
    const displayList = buildItemsList(orderSummary);
    try {
      await axios({
        url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
        method: "post",
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        data: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "interactive",
          interactive: {
            type: "button",
            body: {
              text: `${displayList}\n\nPickup or Delivery?\n\nPickup - ₦50\nDelivery - ₦100`,
            },
            action: {
              buttons: [
                {
                  type: "reply",
                  reply: {
                    id: `pickup_${vendorId}`,
                    title: "Pickup",
                  },
                },
                {
                  type: "reply",
                  reply: {
                    id: `delivery_${vendorId}`,
                    title: "Delivery",
                  },
                },
              ],
            },
          },
        }),
      });

      console.log(`Sent order summary with buttons to ${to}`);
    } catch (error) {
      console.error(
        "Failed to send order summary",
        error.response?.data || error.message
      );
    }
  }
}

// Function to notify user about multi-vendor error
async function sendMultiVendorError(to, firstVendor, secondVendor) {
  try {
    await axios({
      url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      method: "post",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: {
          body: `Sorry, you cannot order from multiple vendors in one cart.`,
        },
      }),
    });
  } catch (error) {
    console.error("Failed to send multi-vendor error message", error);
  }
}

// Function to notify user about minimum price error
async function sendMinimumPriceError(to, itemName, startingPrice) {
  try {
    await axios({
      url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      method: "post",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: {
          body: `Sorry, "${itemName}" cannot be ordered below the minimum starting price of ₦${startingPrice}. Please adjust your order and try again.`,
        },
      }),
    });
  } catch (error) {
    console.error("Failed to send minimum price error message", error);
  }
}
