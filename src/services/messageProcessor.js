import { classifyIntent } from "../ai/intentClassifier.js";
import { handleIntent } from "../ai/intentHandlers.js";
import {
  generateOrderSummary,
  ORDER_SUMMARY_INTENTS,
} from "../ai/orderSummary.js";
import { clearOrderStack } from "./orderStack.js";
import { orderStatusMessages, paymentMessages } from "./orderStatusManager.js";

export async function processMessage(customerId, message) {
  try {
    // Check for dummy test command
    if (message.toLowerCase().trim() === "dummy") {
      return {
        status: "success",
        response_type: "test_list",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: "Here's a test list with 5 sections and 45 items:",
        data: {
          list: {
            header: "Test Multi-Section List",
            body: "This is a dummy list with 5 sections to test the format",
            button: "View Items",
            sections: [
              {
                title: "Section 1 - Fruits",
                rows: [
                  { id: "item_1", title: "Apple", description: "Fresh red apple" },
                  { id: "item_2", title: "Banana", description: "Yellow banana" },
                  { id: "item_3", title: "Orange", description: "Juicy orange" },
                  { id: "item_4", title: "Mango", description: "Sweet mango" },
                  { id: "item_5", title: "Pineapple", description: "Tropical pineapple" },
                  { id: "item_6", title: "Grapes", description: "Purple grapes" },
                  { id: "item_7", title: "Watermelon", description: "Fresh watermelon" },
                  { id: "item_8", title: "Strawberry", description: "Red strawberry" },
                  { id: "item_9", title: "Peach", description: "Soft peach" }
                ]
              },
              {
                title: "Section 2 - Vegetables",
                rows: [
                  { id: "item_10", title: "Carrot", description: "Crunchy carrot" },
                  { id: "item_11", title: "Tomato", description: "Red tomato" },
                  { id: "item_12", title: "Lettuce", description: "Green lettuce" },
                  { id: "item_13", title: "Cucumber", description: "Fresh cucumber" },
                  { id: "item_14", title: "Broccoli", description: "Green broccoli" },
                  { id: "item_15", title: "Spinach", description: "Leafy spinach" },
                  { id: "item_16", title: "Pepper", description: "Bell pepper" },
                  { id: "item_17", title: "Onion", description: "White onion" },
                  { id: "item_18", title: "Potato", description: "Brown potato" }
                ]
              },
              {
                title: "Section 3 - Drinks",
                rows: [
                  { id: "item_19", title: "Water", description: "Bottled water" },
                  { id: "item_20", title: "Juice", description: "Orange juice" },
                  { id: "item_21", title: "Soda", description: "Cola soda" },
                  { id: "item_22", title: "Coffee", description: "Hot coffee" },
                  { id: "item_23", title: "Tea", description: "Green tea" },
                  { id: "item_24", title: "Milk", description: "Fresh milk" },
                  { id: "item_25", title: "Smoothie", description: "Berry smoothie" },
                  { id: "item_26", title: "Lemonade", description: "Fresh lemonade" },
                  { id: "item_27", title: "Energy Drink", description: "Red bull" }
                ]
              },
              {
                title: "Section 4 - Snacks",
                rows: [
                  { id: "item_28", title: "Chips", description: "Potato chips" },
                  { id: "item_29", title: "Cookies", description: "Chocolate cookies" },
                  { id: "item_30", title: "Popcorn", description: "Butter popcorn" },
                  { id: "item_31", title: "Nuts", description: "Mixed nuts" },
                  { id: "item_32", title: "Crackers", description: "Wheat crackers" },
                  { id: "item_33", title: "Pretzels", description: "Salted pretzels" },
                  { id: "item_34", title: "Candy", description: "Gummy bears" },
                  { id: "item_35", title: "Chocolate", description: "Dark chocolate" },
                  { id: "item_36", title: "Granola Bar", description: "Oat granola bar" }
                ]
              },
              {
                title: "Section 5 - Meals",
                rows: [
                  { id: "item_37", title: "Pizza", description: "Pepperoni pizza" },
                  { id: "item_38", title: "Burger", description: "Beef burger" },
                  { id: "item_39", title: "Pasta", description: "Spaghetti pasta" },
                  { id: "item_40", title: "Rice", description: "Fried rice" },
                  { id: "item_41", title: "Sandwich", description: "Club sandwich" },
                  { id: "item_42", title: "Salad", description: "Caesar salad" },
                  { id: "item_43", title: "Soup", description: "Tomato soup" },
                  { id: "item_44", title: "Tacos", description: "Chicken tacos" },
                  { id: "item_45", title: "Sushi", description: "Salmon sushi" }
                ]
              }
            ]
          }
        }
      };
    }

    // Check for cancel command
    if (message.toLowerCase().trim() === "cancel") {
      const { clearPendingOrder, clearFailedOrder } = await import(
        "./sessionManager.js"
      );
      clearPendingOrder(customerId);
      clearFailedOrder(customerId);
      clearOrderStack(customerId)
      return {
        status: "success",
        response_type: "order_cancelled",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: "Order cancelled. Start fresh whenever you're ready! 😊",
      };
    }

    // Check if user is correcting a failed order
    const { getFailedOrder, clearFailedOrder, getAwaitingInput } = await import(
      "./sessionManager.js"
    );
    const failedOrder = getFailedOrder(customerId);
    const awaitingInput = getAwaitingInput(customerId);

    if (failedOrder) {
      // If user specifies a new vendor, clear the old failed order and process as new
      const hasNewVendor = /\b(from|at)\s+\w+/i.test(message);
      if (hasNewVendor && failedOrder.errorType === 'disambiguation') {
        clearFailedOrder(customerId);
        // Fall through to normal processing below
      } else if (awaitingInput) {
        // If awaiting direct input (soup/swallow), parse message directly without AI
        const correctionSummary = {
          vendor: failedOrder.vendor,
          items: [
            { name: message.trim(), quantity: 1, quantity_type: "per_piece" },
          ],
          delivery_location: failedOrder.delivery_location,
        };

        // Merge with original items
        const baseItems =
          failedOrder.errorType === "swallow_without_soup" ||
          failedOrder.errorType === "only_free_soup"
            ? failedOrder.originalItems || []
            : failedOrder.validatedItems || [];
        const mergedItems = [...baseItems, ...correctionSummary.items];
        const mergedSummary = {
          vendor: failedOrder.vendor,
          items: mergedItems,
          delivery_location: failedOrder.delivery_location,
        };

        clearFailedOrder(customerId);
        const response = await handleIntent(
          "Food Ordering",
          customerId,
          message,
          mergedSummary
        );
        return {
          ...response,
          classification: { intent: "Food Ordering", confidence: 1.0 },
          data: { ...response.data },
        };
      } else {
        // Otherwise use AI to parse correction
      // Don't prepend vendor if user is specifying a new vendor
      const hasVendorKeywords = /\b(from|at)\s+\w+/i.test(message);
      const messageWithVendor = failedOrder.vendor && !hasVendorKeywords
        ? `${message} from ${failedOrder.vendor}`
        : message;
      const correctionSummary = await generateOrderSummary(
        messageWithVendor,
        customerId
      );

      // Handle vendor selection for items without vendor
      if (correctionSummary?.vendor && failedOrder.errorType === "no_vendor") {
        const mergedSummary = {
          vendor: correctionSummary.vendor,
          items: failedOrder.items || [],
          delivery_location:
            correctionSummary.delivery_location ||
            failedOrder.delivery_location,
        };
        clearFailedOrder(customerId);
        const response = await handleIntent(
          "Food Ordering",
          customerId,
          message,
          mergedSummary
        );
        return {
          ...response,
          classification: { intent: "Food Ordering", confidence: 1.0 },
          data: { ...response.data },
        };
      }

      if (correctionSummary?.items?.length > 0) {
        // Merge original items with new corrections for swallow/soup errors, otherwise use validated items
        const baseItems =
          failedOrder.errorType === "swallow_without_soup" ||
          failedOrder.errorType === "only_free_soup"
            ? failedOrder.originalItems || []
            : failedOrder.validatedItems || [];
        const mergedItems = [...baseItems, ...correctionSummary.items];
        const mergedSummary = {
          vendor: failedOrder.vendor,
          items: mergedItems,
          delivery_location:
            correctionSummary.delivery_location ||
            failedOrder.delivery_location,
        };

        clearFailedOrder(customerId);
        const response = await handleIntent(
          "Food Ordering",
          customerId,
          message,
          mergedSummary
        );
        return {
          ...response,
          classification: { intent: "Food Ordering", confidence: 1.0 },
          data: { ...response.data },
        };
      }
      }
    }

    // Check if user is providing delivery address
    const { getPendingOrder, clearPendingOrder } = await import(
      "./sessionManager.js"
    );
    const pendingOrder = getPendingOrder(customerId);

    if (pendingOrder?.awaitingAddress) {
      const { pushOrderPack, getStackSummary } = await import(
        "./orderStack.js"
      );
      const { getAllVendors } = await import("../db/Utils/vendor.js");
      const { getUserHostel } = await import("../db/Utils/users.js");
      const vendors = await getAllVendors();
      const vendor = vendors.find((v) => v.id === pendingOrder.vendorId);

      // Replace 'my hostel' with actual hostel
      let deliveryLocation = message;
      const hostelKeywords = /\b(my hostel|my room)\b/i;
      if (hostelKeywords.test(message)) {
        const userHostel = await getUserHostel(customerId);
        if (userHostel) {
          deliveryLocation = message.replace(hostelKeywords, userHostel);
        }
      }

      const packTotal = pendingOrder.orderSummary.items.reduce(
          (sum, item) => {
            // if total exists, trust it
            if (typeof item.total === "number") {
              return sum + item.total;
            }

            // otherwise calculate it
            const price = Number(item.price) || 0;
            const quantity = Number(item.quantity) || 0;

            return sum + price;
          },
          0
        );

      pushOrderPack(customerId, {
        items: pendingOrder.orderSummary.items,
        vendor: vendor?.name || "Unknown",
        vendorId: pendingOrder.vendorId,
        delivery_location: deliveryLocation,
        total: packTotal,
      });

      // get pack summary
      let stackSummary = getStackSummary(customerId) || { packCount: 1 };
      console.log(stackSummary);

      // PACK FEE = packCount * 200
      const packFee = Number(stackSummary.packCount) * 200;

      // final total
      const finalTotal = packTotal + packFee;

      clearPendingOrder(customerId);

      const itemsList = pendingOrder.orderSummary.items
        .map((i) => {
          if (i.quantity_type === "per_price") {
            return `${i.dbName || i.name} -- ₦${i.price}`;
          } else {
            return `${i.dbName || i.name} (x${i.quantity}) -- ₦${i.price}`;
          }
        })
        .join("\n");

      return {
        status: "success",
        response_type: "order_summary",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: `📦 Pack Added to Cart
        Items:
        ${itemsList}
        Pack Fee: ₦${packFee}
        Pack Total: ₦${finalTotal}
        Vendor: ${vendor?.name}
        Delivery: ${deliveryLocation}
        Total Packs: ${stackSummary.packCount}

        What would you like to do next?`,

        data: {
          buttons: [
            { id: "proceed_payment", title: "Proceed to Payment" },
            { id: "add_new_pack", title: "Add New Pack" },
            { id: "cancel_order", title: "Cancel Order" },
          ],
        },
      };
    }

    const classification = await classifyIntent(message);
    console.log(
      `[processMessage] Classified intent: ${classification.intent} (Confidence: ${classification.confidence})`
    );
    let orderSummary = null;

    if (ORDER_SUMMARY_INTENTS.includes(classification.intent)) {
      orderSummary = await generateOrderSummary(message, customerId);
    }

    const response = await handleIntent(
      classification.intent,
      customerId,
      message,
      orderSummary
    );

    // Add payment handling ONLY for successful orders
    if (
      orderSummary?.items?.length > 0 &&
      classification.intent === "Food Ordering" &&
      response.status === "success" &&
      response.response_type === "order_confirmation"
    ) {
      const paymentInfo = paymentMessages.firstTimePayment(
        orderSummary.total_estimated || "2500",
        "9182 XXXX 645"
      );
      response.data = { ...response.data, ...paymentInfo.data };
    }

    return {
      ...response,
      classification: classification,
      data: {
        ...response.data,
        ...(orderSummary && { order_summary: orderSummary }),
      },
    };
  } catch (error) {
    console.error("Message processing error:", error);
    return {
      status: "error",
      response_type: "fallback",
      customer_id: customerId,
      timestamp: new Date().toISOString(),
      message:
        "Sorry, I'm currently experiencing technical difficulties. Please try again shortly.",
    };
  }
}

