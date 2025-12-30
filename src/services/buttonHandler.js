import {
  sendAfricanKitchenCatalog,
  sendAlphaCatalog,
  sendArenaCatalog,
  sendBestmanCatalog,
  sendChefMayoCatalog,
  sendExceedingGraceCatalog,
  sendFamotCatalog,
  sendReneesCatalog,
  sendRukamatCatalog,
  sendYomiceCatalog,
  sendTestvendor,
} from "../services/sendVendorCatalog.js";
import dotenv from "dotenv";
dotenv.config();
import pool from "../db/database.js";
import { sendPassImage } from "./sendReciept.js";
import { paymentSessions } from "./sessionManager.js";

import { getAccount, confirmPayment } from "./paymentHandler.js";
import { createOrder } from "./orderHandler.js";

const baseUrl = process.env.baseUrl;
let grandTotal = 0;
let vendorTotal = 0;
let account_details = null;
let packFee = null;

export async function handleButtonClick(buttonId, customerId) {
  switch (buttonId) {
    // case "visit_website":
    //   return {
    //     status: "success",
    //     message: " Redirecting you to downtown.ng...",
    //     action: "open_url",
    //     url: "https://downtown.ng",
    //   };

    // case "join_channel":
    //   return {
    //     status: "success",
    //     message: " Opening WhatsApp channel...",
    //     action: "open_url",
    //     url: "https://whatsapp.com/channel/0029Vb73OpaLtOjL2pM98O34",
    //   };

    // case "chat_rep":
    //   return {
    //     status: "success",
    //     message:
    //       "‍ Connecting you to a live representative...\nPlease hold while we find someone to assist you.",
    //     action: "transfer_to_human",
    //   };

    case "view_restaurants":
      const { getAllVendors } = await import("../db/Utils/vendor.js");
      const vendors = await getAllVendors();

      if (vendors.length === 0) {
        return {
          status: "error",
          message: "Sorry, no restaurants are available at the moment.",
        };
      }

      if (vendors.length > 10) {
        const vendorList = vendors
          .map((v, i) => `${i + 1}. ${v.name}`)
          .join("\n");
        return {
          status: "success",
          message: ` Available Restaurants:\n\n${vendorList}\n\nJust mention the restaurant name to view their menu!`,
        };
      }

      return {
        status: "success",
        message: "Select a restaurant to view their menu:",
        data: {
          list: {
            header: "Campus Restaurants",
            body: "Here are the available restaurants on campus:",
            button: "View Restaurants",
            sections: [
              {
                title: "Restaurants",
                rows: vendors.map((v) => ({
                  id: `vendor_${v.id}`,
                  title: v.name.substring(0, 24),
                  description: (v.description || "View menu").substring(0, 72),
                })),
              },
            ],
          },
        },
      };

    case "start_ordering":
      return {
        status: "success",
        message:
          "Got an order? Say less \nJust drop it in this format so we can process it fast \n\n*Example:*\njollof rice - ₦1,400, 1 beef 1 egg from African Kitchen delivered to my hostel(location)\n\nMake sure to include the \n• Item name + quantity you want\n• Specify the vendor you're buying from\n• Specify the location the food is delivered to",
      };

    // case "reorder_last":
    //   return {
    //     status: "success",
    //     message:
    //       " Reordering your last meal:\n2x Jollof Rice + Chicken - ₦2,800\nDelivery to: Your usual spot\n\nConfirm this order?",
    //     data: {
    //       buttons: [
    //         { id: "confirm_reorder", title: " Confirm" },
    //         { id: "cancel_reorder", title: " Cancel" },
    //       ],
    //     },
    //   };

    case "confirm_cancel":
      const cancelSession = paymentSessions.get(customerId);

      if (cancelSession && cancelSession.status === "CONFIRMED") {
        return {
          status: "success",
          message:
            " Order Cancelled\n\nYour order has been cancelled. Would you like to request a refund?",
          data: {
            buttons: [
              { id: "refund_order", title: " Request Refund" },
              { id: "start_ordering", title: " New Order" },
            ],
          },
        };
      }

      return {
        status: "success",
        message:
          " Done! Your order's been canceled successfully.\nRefund (if paid online) will be processed within 24 hours \nWanna try placing a new one?",
      };

    case "keep_order":
      return {
        status: "success",
        message:
          " Great! Your order is still active.\nWe'll keep you updated on the progress.",
      };

    case "refund_order":
      const session = paymentSessions.get(customerId);

      if (!session) {
        return {
          status: "error",
          message: "No payment session found. Cannot process refund.",
        };
      }

      if (session.status !== "CONFIRMED") {
        return {
          status: "error",
          message: "Payment not confirmed yet. Cannot process refund.",
        };
      }

      const { requestRefund } = await import("./refundHandler.js");
      const refundResult = await requestRefund(
        session.external_reference,
        session.amount
      );

      if (refundResult.success) {
        paymentSessions.delete(customerId);
        return {
          status: "success",
          message: ` Refund Processed\n\nYour refund of ₦${session.amount} has been initiated.\nIt will be processed within 24 hours.\n\nReference: ${session.external_reference}`,
        };
      } else {
        return {
          status: "error",
          message: ` Refund Failed\n\n${refundResult.error}\n\nPlease contact support if you need assistance.`,
        };
      }

    case "proceed_payment":
      const { getOrderStack } = await import("./orderStack.js");
      const orderStack = getOrderStack(customerId);
      console.log("order stack:", orderStack);

      if (orderStack.length === 0) {
        return {
          status: "error",
          message: "No orders in your cart. Please add items first.",
        };
      }

      let orderDetails = "";
      grandTotal = 0;

      const { pushOrderPack, getStackSummary } = await import(
        "./orderStack.js"
      );
      let stackSummary = getStackSummary(customerId);
      console.log("stack summary", stackSummary);

      let vendorName = null;
      let totalPackFee = 0;

      orderStack.forEach((pack, i) => {
        const packItems = pack.items
          .map((item) => {
            if (item.quantity_type === "per_price") {
              return `  ${item.name} -- ₦${item.price}`;
            } else {
              return `  ${item.name} (x${item.quantity}) -- ₦${item.price}`;
            }
          })
          .join("\n");

        vendorName = pack.vendor;

        // Items-only total
        const itemsTotal = pack.total;

        // Pack fee (vendor receives this)
        const requiresPackFee = pack.items.some((item) => item.pack === true);
        const packFeeForThisPack = requiresPackFee ? 200 : 0;

        // Delivery / pickup fee (platform-only)
        const deliveryFee = pack.delivery_location !== "Pickup" ? 100 : 50;
        const feeLabel =
          pack.delivery_location !== "Pickup" ? "Delivery Fee" : "Pickup Fee";

        // Vendor gets items + pack fee
        const vendorPackTotal = itemsTotal + packFeeForThisPack;
        vendorTotal += vendorPackTotal;

        // Customer pays everything
        const customerPackTotal = itemsTotal + packFeeForThisPack + deliveryFee;

        grandTotal += customerPackTotal;

        orderDetails += `Pack ${i + 1} from ${pack.vendor}:\n`;
        orderDetails += `${packItems}\n`;
        orderDetails += `Items Total: ₦${itemsTotal}\n`;

        if (packFeeForThisPack > 0) {
          orderDetails += `Pack Fee: ₦${packFeeForThisPack}\n`;
        }

        orderDetails += `${feeLabel}: ₦${deliveryFee}\n`;
        orderDetails += `Pack Subtotal: ₦${customerPackTotal}\n\n`;
      });
      console.log("vendor Total:", vendorTotal);

      const vendorResult = await pool.query(
        `SELECT phone_number FROM vendors WHERE name = $1`,
        [vendorName]
      );
      let vendorNumber = null;

      console.log("account initialised");
      if (vendorResult.rows.length > 0) {
        vendorNumber = vendorResult.rows[0].phone_number;
        console.log("vendor number :", vendorNumber);

        const hasDelivery = orderStack.some(
          (pack) => pack.delivery_location !== "Pickup"
        );
        const deliveryType = hasDelivery ? "Delivery" : "Pickup";

        account_details = await getAccount(
          vendorNumber,
          grandTotal,
          customerId,
          deliveryType
        );
        console.log("account assigned", account_details);
      }

      // await CopyAccNum(customerId, account_details.account_number, account_details.account_name);

      return {
        status: "success",
        response_type: "payment",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: `Payment Details\nYour Order:\n${orderDetails}===================\n*Total: ₦${grandTotal}*\n===================\n\nAccount Number: ${account_details.account_number}\nBank: ${account_details.bank_name}\n\n`,
        data: {
          buttons: [{ id: "payment_sent", title: "Payment Sent" }],
        },
      };

    case "add_new_pack":
      return {
        status: "success",
        response_type: "order_format",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message:
          "Got an order? Say less \nJust drop it in this format so we can process it fast \n\n*Example:*\njollof rice - ₦1,400, 1 beef 1 egg from African Kitchen delivered to my hostel(location)\n\nMake sure to include the \n• Item name + quantity you want\n• Specify the vendor you're buying from\n• Specify the location the food is delivered to",
      };

    case "proceed_without_invalid":
      const {
        getFailedOrder: getFailedForProceed,
        clearFailedOrder: clearFailedForProceed,
      } = await import("./sessionManager.js");
      const failedOrderProceed = getFailedForProceed(customerId);

      if (
        !failedOrderProceed ||
        failedOrderProceed.validatedItems.length === 0
      ) {
        return {
          status: "error",
          message: "No valid items to proceed with.",
        };
      }

      const { handleIntent } = await import("../ai/intentHandlers.js");
      const orderSummary = {
        vendor: failedOrderProceed.vendor,
        items: failedOrderProceed.validatedItems,
        delivery_location: failedOrderProceed.delivery_location,
      };

      clearFailedForProceed(customerId);
      return await handleIntent("Food Ordering", customerId, "", orderSummary);

    case "modify_order":
      const { getFailedOrder: getFailedForModify } = await import(
        "./sessionManager.js"
      );
      const failedOrderModify = getFailedForModify(customerId);

      if (!failedOrderModify) {
        return {
          status: "error",
          message: "No order to modify.",
        };
      }

      const validItemsList = failedOrderModify.validatedItems
        .map((i) => i.dbName)
        .join(", ");
      return {
        status: "success",
        message: `Current valid items: ${validItemsList}\n\nWhat would you like to add to your order?`,
      };

    case "show_corrections":
      const { getFailedOrder: getFailedForCorrections } = await import(
        "./sessionManager.js"
      );
      const failedOrderCorrections = getFailedForCorrections(customerId);

      if (!failedOrderCorrections) {
        return {
          status: "error",
          message: "No order found to correct.",
        };
      }

      const { validateOrderItem } = await import("../db/Utils/vendor.js");
      const corrections = [];

      for (const item of failedOrderCorrections.originalItems || []) {
        const validation = await validateOrderItem(
          failedOrderCorrections.vendorId,
          item.name,
          item.quantity_type,
          item.price,
          item.quantity
        );

        if (!validation.valid) {
          corrections.push(`• ${validation.error}`);
        }
      }

      return {
        status: "success",
        message: `Here's what needs to be corrected:\n\n${corrections.join(
          "\n"
        )}\n\n Reply with the corrected items.`,
      };

    case "cancel_order":
      const { clearOrderStack } = await import("./orderStack.js");
      const { clearFailedOrder } = await import("./sessionManager.js");
      clearOrderStack(customerId);
      clearFailedOrder(customerId);
      const { clearPendingOrder } = await import("./sessionManager.js");
      clearPendingOrder(customerId);

      return {
        status: "success",
        response_type: "order_cancelled",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message:
          " Order Cancelled\nYour order has been cancelled successfully.\n\nReady to order again? Just drop your order in this format:\n\n*Example:*\njollof rice - ₦1,400, 1 beef 1 egg from African Kitchen delivered to my hostel(location)",
      };

    case "payment_sent": {
      const { getOrderStack: getStack, clearOrderStack: clearStack } =
        await import("./orderStack.js");
      const stack = getStack(customerId);
      console.log(stack);
      const paysession = paymentSessions.get(customerId);

      const confirm_payment = await confirmPayment(
        paysession.amount,
        customerId
      );
      console.log(confirm_payment);

      // If NO payment received
      if (confirm_payment.success !== true) {
        return {
          status: "failed",
          response_type: "payment_not_received",
          message:
            "We have not yet received your payment. Please confirm if you've made the transfer.",
          data: {
            buttons: [{ id: "payment_sent", title: "Recheck" }],
          },
        };
      }

      // Now payment is confirmed ✔️
      if (stack.length === 0) {
        return {
          status: "error",
          message: "No orders found. Please place an order first.",
        };
      }

      let total = 0;
      const packs = stack.map((pack, index) => {
        total += pack.total;
        return {
          packNumber: index + 1,
          vendor: pack.vendor,
          deliveryLocation: pack.delivery_location,
          items: pack.items.map((item) => ({
            name: item.name,
            quantity: item.quantity || 1,
            price: item.quantity_type === "per_price" ? item.price : item.price,
          })),
          total: pack.total,
        };
      });

      const receiptData = {
        orderId: `ORD${Date.now()}`,
        packs: packs,
        amount: total,
        customerName: "Customer",
      };

      // Generate receipt
      const { generateReceipt } = await import("./receiptGenerator.js");
      let receiptPath = null;
      try {
        const result = await generateReceipt(receiptData);
        receiptPath = result.filePath;
      } catch (err) {
        console.error("Receipt generation failed:", err);
      }
      const order_details = getStack(customerId);
      clearStack(customerId);

      //get data
      const userName = await pool.query(
        `SELECT first_name FROM users WHERE phone_number = $1`,
        [customerId]
      );
      const user_id = await pool.query(
        `SELECT id FROM users WHERE phone_number = $1`,
        [customerId]
      );
      let user =
        userName.rows[0].first_name || userName.rows[0].last_name || " ";
      let userPhone = await pool.query(
        `SELECT phone_number FROM users WHERE phone_number = $1`,
        [customerId]
      );
      userPhone = userPhone.phone_number || " ";
      let vendorName = await pool.query(
        `SELECT name FROM vendors WHERE id = $1`,
        [order_details[0].vendorId]
      );
      const vendor_phone = await pool.query(
        `SELECT phone_number FROM vendors WHERE id = $1`,
        [order_details[0].vendorId]
      );
      const items = order_details[0].items;

      const food_name = items
        .map(
          (item) =>
            `name: ${item.name}\nquantity: ${item.quantity}\nprice: ${item.price}\ntotal: ${item.total}`
        )
        .join("\n");

      const finalPrice = Number(order_details[0].total) + packFee;

      let order_type = null;

      if (order_details[0].delivery_location !== "Pickup") {
        order_type = "delivery";
      } else {
        order_type = "pick_up";
      }
      await createOrder(
        user_id.rows[0].id,
        order_details[0].vendorId,
        user,
        order_details[0].vendor,
        food_name,
        finalPrice,
        order_type,
        order_details[0].delivery_location,
        customerId,
        vendor_phone.rows[0].phone_number
      );

      await sendPassImage(customerId, order_details[0].vendor, finalPrice);
      const session = paymentSessions.get(customerId);
      session.status = "CONFIRMED";

      paymentSessions.set(customerId, session);

      return {
        status: "success",
        response_type: "payment_confirmed",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: `Payment Confirmed Successfully!\n\nYour order has been forwarded to the vendor.\n\nOrder ID: ${receiptData.orderId}\nTotal: ₦${total}\n\nNeed to cancel? Use the button below.`,
        data: {
          receipt_path: receiptPath,
          buttons: [{ id: "refund_order", title: "🔄 Cancel & Refund" }],
        },
      };
    }

    default:
      // Handle pickup button
      if (buttonId.startsWith("pickup_")) {
        const vendorId = buttonId.substring(7);
        const { getPendingOrder, clearPendingOrder } = await import(
          "./sessionManager.js"
        );
        const pendingOrder = getPendingOrder(customerId);
        console.log("pending order: ", pendingOrder);

        if (!pendingOrder?.orderSummary) {
          return {
            status: "error",
            message: "No pending order found. Please place a new order.",
          };
        }

        const {
          pushOrderPack,
          getStackSummary,
          clearOrderStack,
          getOrderStack,
        } = await import("./orderStack.js");
        console.log("pending order summary: ", pendingOrder.orderSummary);
        const { getAllVendors } = await import("../db/Utils/vendor.js");
        const vendors = await getAllVendors();
        const vendor = vendors.find((v) => v.id === vendorId);

        const packSubTotal = pendingOrder.orderSummary.items.reduce(
          (sum, item) => {
            // item.price is already multiplied by quantity in validation
            return sum + (Number(item.price) || 0);
          },
          0
        );

        pushOrderPack(customerId, {
          items: pendingOrder.orderSummary.items,
          vendor: vendor?.name,
          vendorId,
          delivery_location: "Pickup",
          total: packSubTotal, // add pack fee
        });

        const stackSummary = getStackSummary(customerId);

        // checking if food items require pack fee
        const itemsToCheck = getOrderStack(customerId);
        console.log("items to check:", itemsToCheck);

        let PACK_FEE = 200; // assume true until proven otherwise

        for (const pack of itemsToCheck) {
          for (const item of pack.items) {
            const menuResult = await pool.query(
              `SELECT pack FROM menus WHERE product_id = $1`,
              [item.productId]
            );

            const menu = menuResult.rows[0];

            // if item not found OR pack is false → cancel pack fee
            if (!menu || menu.pack !== true) {
              PACK_FEE = 0;
              console.log("❌ no pack fee because of:", item.name);
              break; // stop checking items
            }

            console.log("✅ pack allowed for:", item.name);
          }

          // stop checking other packs if already false
          if (PACK_FEE === 0) break;
        }

        console.log("FINAL PACK FEE:", PACK_FEE);

        const packCount = stackSummary.packCount;

        const packFeeTotal = packCount * PACK_FEE;

        const finalPackTotal = packSubTotal + packFeeTotal; // Pickup fee
        clearOrderStack(customerId);

        pushOrderPack(customerId, {
          items: pendingOrder.orderSummary.items,
          vendor: vendor?.name,
          vendorId,
          delivery_location: "Pickup",
          total: finalPackTotal, // add pack fee
        });

        console.log(getOrderStack(customerId));

        // clearPendingOrder(customerId);

        const itemsList = pendingOrder.orderSummary.items
          .map((i) => {
            if (i.quantity_type === "per_price") {
              return `${i.name} -- ₦${i.price}`;
            } else {
              return `${i.name} (x${i.quantity}) -- ₦${i.price}`;
            }
          })
          .join("\n");

        return {
          status: "success",
          response_type: "order_summary",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message: ` Pack Added to Cart\n\nItems:\n${itemsList}\n\nPack subtotal: ₦${finalPackTotal}\nPack Fee: ₦${packFeeTotal}\nVendor: ${vendor?.name}\nPickup: You'll collect from vendor\n\nTotal Packs: ${stackSummary.packCount}\n\nWhat would you like to do next?`,
          data: {
            buttons: [
              { id: "proceed_payment", title: " Proceed to Payment" },
              { id: "add_new_pack", title: " Add New Pack" },
              { id: "cancel_order", title: " Cancel Order" },
            ],
          },
        };
      }

      // Handle delivery button
      if (buttonId.startsWith("delivery_")) {
        const vendorId = buttonId.substring(9);
        const { getPendingOrder, setPendingOrder } = await import(
          "./sessionManager.js"
        );
        const pendingOrder = getPendingOrder(customerId);

        if (!pendingOrder?.orderSummary) {
          return {
            status: "error",
            message: "No pending order found. Please place a new order.",
          };
        }

        setPendingOrder(customerId, {
          ...pendingOrder,
          vendorId,
          awaitingAddress: true,
        });

        return {
          status: "pending",
          response_type: "address_prompt",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message:
            " Where should we deliver your order?\n\nPlease provide your delivery address:",
        };
      }

      // Handle pagination for restaurants list
      if (buttonId.startsWith("restaurants_next_")) {
        console.log(" Handling restaurants pagination:", buttonId);
        const page = parseInt(buttonId.split("_").pop());
        const { getAllVendors } = await import("../db/Utils/vendor.js");
        const vendors = await getAllVendors();

        const totalItems = vendors.length;
        const pageSize = totalItems > 10 ? 9 : 10;
        const totalPages = Math.ceil(totalItems / pageSize);
        const startIdx = (page - 1) * pageSize;
        const endIdx = startIdx + pageSize;
        const currentItems = vendors.slice(startIdx, endIdx);

        const rows = currentItems.map((v) => ({
          id: `vendor_${v.id}`,
          title: v.name.substring(0, 24),
          description: (v.description || "View menu").substring(0, 72),
        }));

        if (page < totalPages) {
          rows.push({
            id: `restaurants_next_${page + 1}`,
            title: "Next Page →",
            description: `View page ${page + 1} of ${totalPages}`,
          });
        }

        return {
          status: "success",
          response_type: "menu",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message: `Campus Restaurants (Page ${page}/${totalPages}):`,
          data: {
            list: {
              header: "Campus Restaurants",
              body: `Showing ${startIdx + 1}-${Math.min(
                endIdx,
                totalItems
              )} of ${totalItems} restaurants`,
              button: "View Restaurants",
              sections: [{ title: "Restaurants", rows }],
            },
          },
        };
      }

      // Handle pagination for vendor menu
      if (buttonId.startsWith("menu_next_")) {
        console.log(" Handling menu pagination:", buttonId);
        const parts = buttonId.split("_");
        const vendorId = parts.slice(2, -1).join("_");
        const page = parseInt(parts[parts.length - 1]);
        console.log("Parsed vendorId:", vendorId, "page:", page);

        const { getVendorMenuItems, getVendorByName } = await import(
          "../db/Utils/vendor.js"
        );
        const menuItems = await getVendorMenuItems(vendorId);

        const totalItems = menuItems.length;
        const pageSize = totalItems > 10 ? 9 : 10;
        const totalPages = Math.ceil(totalItems / pageSize);
        const startIdx = (page - 1) * pageSize;
        const endIdx = startIdx + pageSize;
        const currentItems = menuItems.slice(startIdx, endIdx);

        const rows = currentItems.map((item) => {
          let priceDesc = "";
          if (item.sale_quantity === "per_price") {
            priceDesc = `from ₦${item.price}`;
          } else if (item.sale_quantity === "per_piece") {
            priceDesc = `₦${item.price} each`;
          } else if (item.sale_quantity === "full_pack") {
            priceDesc = `₦${item.price} (Full Pack)`;
          } else if (item.sale_quantity === "half_pack") {
            priceDesc = `₦${item.price} (Half Pack)`;
          } else {
            priceDesc = `₦${item.price}`;
          }
          return {
            id: `menu_${item.id}`,
            title: item.food_name.substring(0, 24),
            description: priceDesc.substring(0, 72),
          };
        });

        if (page < totalPages) {
          rows.push({
            id: `menu_next_${vendorId}_${page + 1}`,
            title: "Next Page →",
            description: `View page ${page + 1} of ${totalPages}`,
          });
        }

        // Get vendor name for the message
        const allVendors = await import("../db/Utils/vendor.js").then((m) =>
          m.getAllVendors()
        );
        const vendor = allVendors.find((v) => v.id === vendorId);
        const vendorName = vendor ? vendor.name : "Vendor";

        return {
          status: "success",
          response_type: "vendor_catalogue",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message: `Here's the menu for ${vendorName} (Page ${page}/${totalPages}):`,
          data: {
            list: {
              header: `${vendorName} Menu`.substring(0, 60),
              body: `Showing ${startIdx + 1}-${Math.min(
                endIdx,
                totalItems
              )} of ${totalItems} items`,
              button: "View Items",
              sections: [{ title: "Menu Items", rows }],
            },
          },
        };
      }

      // Handle pagination for vendor selection
      if (buttonId.startsWith("vendor_select_next_")) {
        const page = parseInt(buttonId.split("_").pop());
        return {
          status: "success",
          message:
            "Please search for the items again to continue browsing vendors.",
        };
      }

      // Handle disambiguation selection
      if (buttonId.startsWith("disambiguate_")) {
        const menuItemId = buttonId.substring(13);
        const { getFailedOrder, clearFailedOrder } = await import(
          "./sessionManager.js"
        );
        const failedOrder = getFailedOrder(customerId);

        if (!failedOrder || failedOrder.errorType !== "disambiguation") {
          return {
            status: "error",
            message:
              "No pending disambiguation found. Please place a new order.",
          };
        }

        // Get the selected item details
        const result = await pool.query("SELECT * FROM menus WHERE id = $1", [
          menuItemId,
        ]);

        if (result.rows.length === 0) {
          return {
            status: "error",
            message: "Sorry, I couldn't find that item.",
          };
        }

        const selectedItem = result.rows[0];
        const disambiguationItem = failedOrder.disambiguationItem;

        // Rebuild order with selected item
        const updatedItems = failedOrder.originalItems.map((item) => {
          if (item.name === disambiguationItem.originalName) {
            return {
              name: selectedItem.food_name,
              quantity: disambiguationItem.quantity,
              quantity_type: disambiguationItem.quantityType,
              price: disambiguationItem.price, // Carry over user's price if specified
            };
          }
          return item;
        });

        clearFailedOrder(customerId);

        // Re-process order with selected item
        const { handleIntent } = await import("../ai/intentHandlers.js");
        return await handleIntent("Food Ordering", customerId, "", {
          vendor: failedOrder.vendor,
          items: updatedItems,
          delivery_location: failedOrder.delivery_location,
        });
      }

      // Handle menu item selection
      if (buttonId.startsWith("menu_") && !buttonId.includes("_next_")) {
        console.log(" Handling menu item selection:", buttonId);
        const menuItemId = buttonId.substring(5);

        const pool = (await import("../db/database.js")).default;
        const result = await pool.query(
          "SELECT m.*, v.name as vendor_name FROM menus m JOIN vendors v ON m.vendor_id = v.id WHERE m.id = $1",
          [menuItemId]
        );

        if (result.rows.length === 0) {
          return {
            status: "error",
            message: "Sorry, I couldn't find that menu item.",
          };
        }

        const item = result.rows[0];
        let priceInfo = "";

        if (item.sale_quantity === "per_price") {
          priceInfo = `from ₦${item.price}`;
        } else if (item.sale_quantity === "per_piece") {
          priceInfo = `₦${item.price} each`;
        } else if (item.sale_quantity === "full_pack") {
          priceInfo = `₦${item.price} (Full Pack)`;
        } else if (item.sale_quantity === "half_pack") {
          priceInfo = `₦${item.price} (Half Pack)`;
        } else {
          priceInfo = `₦${item.price}`;
        }

        return {
          status: "success",
          message: `Great choice! \n\n${item.food_name} - ${priceInfo}\nFrom: ${item.vendor_name}\n\nTo order, just say:\n"${item.food_name} from ${item.vendor_name} delivered to [your location]"`,
        };
      }

      // Handle resend OTP button
      if (buttonId === "resend_otp") {
        const { checkAndResendOTP } = await import("./userOnboarding.js");
        const result = await checkAndResendOTP(customerId);
        return {
          status: "success",
          message: result.message || " A new OTP has been sent to your email.",
        };
      }

      // Handle soup selection from swallow error
      if (buttonId.startsWith("add_soup_")) {
        const soupName = buttonId.substring(9).replace(/_/g, " ");
        const { getFailedOrder, clearFailedOrder } = await import(
          "./sessionManager.js"
        );
        const failedOrder = getFailedOrder(customerId);

        if (!failedOrder || failedOrder.errorType !== "swallow_without_soup") {
          return {
            status: "error",
            message: "No pending order found. Please place a new order.",
          };
        }

        const { handleIntent } = await import("../ai/intentHandlers.js");
        const mergedSummary = {
          vendor: failedOrder.vendor,
          items: [
            ...failedOrder.originalItems,
            { name: soupName, quantity: 1, quantity_type: null },
          ],
          delivery_location: failedOrder.delivery_location,
        };

        clearFailedOrder(customerId);
        return await handleIntent(
          "Food Ordering",
          customerId,
          "",
          mergedSummary
        );
      }

      // Handle swallow selection from free soup error
      if (buttonId.startsWith("add_swallow_")) {
        const swallowName = buttonId.substring(12).replace(/_/g, " ");
        const { getFailedOrder, clearFailedOrder } = await import(
          "./sessionManager.js"
        );
        const failedOrder = getFailedOrder(customerId);

        if (!failedOrder || failedOrder.errorType !== "only_free_soup") {
          return {
            status: "error",
            message: "No pending order found. Please place a new order.",
          };
        }

        const { handleIntent } = await import("../ai/intentHandlers.js");
        const mergedSummary = {
          vendor: failedOrder.vendor,
          items: [
            ...failedOrder.originalItems,
            { name: swallowName, quantity: 1, quantity_type: null },
          ],
          delivery_location: failedOrder.delivery_location,
        };

        clearFailedOrder(customerId);
        return await handleIntent(
          "Food Ordering",
          customerId,
          "",
          mergedSummary
        );
      }

      // Handle vendor selection from restaurant list
      if (buttonId.startsWith("vendor_")) {
        console.log(" Handling vendor selection:", buttonId);
        // Extract vendor ID (everything after 'vendor_')
        const vendorId = buttonId.substring(7);

        const { getVendorMenuItems, getAllVendors } = await import(
          "../db/Utils/vendor.js"
        );
        const allVendors = await getAllVendors();
        console.log("All vendors fetched:", allVendors.length);
        console.log("Vendor ID parsed:", vendorId);
        console.log(
          "Vendor found:",
          allVendors.find((v) => v.id === vendorId)
        );
        const vendor = allVendors.find((v) => v.id === vendorId);
        if (vendor) {
          console.log("Vendor name:", vendor.name);
        } else {
          console.log("Vendor not found");
        }

        if (!vendor) {
          return {
            status: "error",
            message: "Sorry, I couldn't find that restaurant.",
          };
        }

        // Check if user has failed order waiting for vendor selection
        const { getFailedOrder, clearFailedOrder } = await import(
          "./sessionManager.js"
        );
        const failedOrder = getFailedOrder(customerId);

        if (failedOrder?.errorType === "no_vendor") {
          // User selected vendor for order without vendor specified
          const { handleIntent } = await import("../ai/intentHandlers.js");
          const mergedSummary = {
            vendor: vendor.name,
            items: failedOrder.items,
            delivery_location: failedOrder.delivery_location,
          };

          clearFailedOrder(customerId);
          return await handleIntent(
            "Food Ordering",
            customerId,
            "",
            mergedSummary
          );
        }

        if (failedOrder?.errorType === "item_at_other_vendor") {
          // User selected vendor for item that wasn't available at original vendor
          const { handleIntent } = await import("../ai/intentHandlers.js");
          const mergedSummary = {
            vendor: vendor.name,
            items: [
              ...failedOrder.validatedItems,
              ...failedOrder.originalItems.filter((i) =>
                failedOrder.failedItems.includes(i.name)
              ),
            ],
            delivery_location: failedOrder.delivery_location,
          };

          clearFailedOrder(customerId);
          return await handleIntent(
            "Food Ordering",
            customerId,
            "",
            mergedSummary
          );
        }

        // Normal vendor menu display
        const menuItems = await getVendorMenuItems(vendorId);

        if (menuItems.length === 0) {
          return {
            status: "error",
            message: `${vendor.name} has no menu items available at the moment.`,
          };
        }

        if (menuItems.length) {
          console.log("sending from button handler");
          if (vendor.name === "AFRICAN KITCHEN") {
            await sendAfricanKitchenCatalog(customerId);
          } else if (vendor.name === "ARENA") {
            await sendArenaCatalog(customerId);
          } else if (vendor.name === "BESTMAN") {
            await sendBestmanCatalog(customerId);
          } else if (vendor.name === "RUKAMAT") {
            await sendRukamatCatalog(customerId);
          } else if (vendor.name === "FAMOT") {
            await sendFamotCatalog(customerId);
          } else if (vendor.name === "RENEES CAFE") {
            await sendReneesCatalog(customerId);
          } else if (vendor.name === "ALPHA'S PLACE") {
            await sendAlphaCatalog(customerId);
          } else if (vendor.name === "YOMICE CAFE") {
            await sendYomiceCatalog(customerId);
          } else if (vendor.name === "CHEF MAYO") {
            await sendChefMayoCatalog(customerId);
          } else if (vendor.name === "EXCEEDING GRACE") {
            await sendExceedingGraceCatalog(customerId);
          }
          //remove test vendor from all instances when done
          else if (vendor.name === "Test vendor") {
            await sendTestvendor(customerId);
          }

          return {
            status: "success",
            response_type: "vendor_catalogue",
            customer_id: customerId,
            timestamp: new Date().toISOString(),
            message: ``,
          };

          // const menuList = menuItems.map((item, i) => {
          //   let priceDesc = '';
          //   if (item.sale_quantity === 'per_price') {
          //     priceDesc = `from ₦${item.price}`;
          //   } else if (item.sale_quantity === 'per_piece') {
          //     priceDesc = `₦${item.price} each`;
          //   } else if (item.sale_quantity === 'full_pack') {
          //     priceDesc = `₦${item.price} (Full Pack)`;
          //   } else if (item.sale_quantity === 'half_pack') {
          //     priceDesc = `₦${item.price} (Half Pack)`;
          //   } else {
          //     priceDesc = `₦${item.price}`;
          //   }
          //   return `${i + 1}. ${item.food_name} - ${priceDesc}`;
          // }).join('\n');

          // return {
          //   status: "success",
          //   response_type: "vendor_catalogue",
          //   customer_id: customerId,
          //   timestamp: new Date().toISOString(),
          //   message: ` ${vendor.name} Menu:\n\n${menuList}\n\nJust tell me what you'd like to order!`
          // };
        }

        // return {
        //   status: "success",
        //   response_type: "vendor_catalogue",
        //   customer_id: customerId,
        //   timestamp: new Date().toISOString(),
        //   message: `Here's the menu for ${vendor.name}:`,
        //   data: {
        //     list: {
        //       header: `${vendor.name} Menu`.substring(0, 60),
        //       body: "Select an item to add to your order:",
        //       button: "View Items",
        //       sections: [{
        //         title: "Menu Items",
        //         rows: menuItems.map(item => {
        //           let priceDesc = '';
        //           if (item.sale_quantity === 'per_price') {
        //             priceDesc = `from ₦${item.price}`;
        //           } else if (item.sale_quantity === 'per_piece') {
        //             priceDesc = `₦${item.price} each`;
        //           } else if (item.sale_quantity === 'full_pack') {
        //             priceDesc = `₦${item.price} (Full Pack)`;
        //           } else if (item.sale_quantity === 'half_pack') {
        //             priceDesc = `₦${item.price} (Half Pack)`;
        //           } else {
        //             priceDesc = `₦${item.price}`;
        //           }
        //           return {
        //             id: `menu_${item.id}`,
        //             title: item.food_name.substring(0, 24),
        //             description: priceDesc.substring(0, 72)
        //           };
        //         })
        //       }]
        //     }
        //   }
        // };
      }

      return {
        status: "error",
        message: " I didn't understand that action. Please try again.",
      };
  }
}
