import pool from "../db/database.js";
import express from "express";
import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

export async function processCart(cart, to) {
  console.log(`cart from: ${cart.from}`);

  const itemsList = [];
  let vendorName = "";
  let vendorId = "";
  let grandTotal = 0;

  for (let i = 0; i < cart.order.product_items.length; i++) {
    const product = cart.order.product_items[i];

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

    // Store item with correct structure
    itemsList.push({
      name: menu.food_name,
      price,
      quantity,
      total,
    });
  }

  // Create consistent session data format
  const orderSummary = {
    vendorId,
    vendorName,
    items: itemsList, // <– now objects, not strings
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
      `*Vendor:* ${orderSummary.vendorName}\n` +
      `*Items:*\n${itemLines}\n\n` +
      `*Total:* ₦${orderSummary.total}`
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
