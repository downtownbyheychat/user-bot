import { classifyIntent } from "../ai/intentClassifier.js";
import { handleIntent } from "../ai/intentHandlers.js";
import {  generateOrderSummary, ORDER_SUMMARY_INTENTS} from "../ai/orderSummary.js";

export async function processMessage(customerId, message) {
  try {
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
        // Handle swallow quantity input
        if (awaitingInput.type === "swallow_quantity") {
          const quantity = parseInt(message.trim());
          if (isNaN(quantity) || quantity < 1) {
            return {
              status: "error",
              message: "Please enter a valid number (e.g., 1, 2, 3)"
            };
          }
          
          const correctionSummary = {
            vendor: failedOrder.vendor,
            items: [
              { name: awaitingInput.selectedSwallow, quantity: quantity, quantity_type: "per_piece" },
            ],
            delivery_location: failedOrder.delivery_location,
          };
          
          // Merge with original items
          const baseItems = failedOrder.originalItems || [];
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
            classification: { intent: "Food Ordering" },
            data: { ...response.data },
          };
        }
        // If awaiting direct input (soup), parse message directly without AI
        else {
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
            classification: { intent: "Food Ordering" },
            data: { ...response.data },
          };
        }
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
            classification: { intent: "Food Ordering" },
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
            classification: { intent: "Food Ordering" },
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
      const { pushOrderPack } = await import("./orderStack.js");
      const { getAllVendors } = await import("../db/Utils/vendor.js");
      const { getUserHostel } = await import("../db/Utils/users.js");
      const { calculatePackFeeForItems } = await import("./packFeeCalculator.js");
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
      // TODO: price for direct order and total for catalogue
      const packSubTotal = pendingOrder.orderSummary.items.reduce(
        (sum, item) => sum + (Number(item.price) || 0),
        0
      );

      const packFee = await calculatePackFeeForItems(pendingOrder.orderSummary.items);
      const deliveryFee = 100; // Delivery fee
      const packTotal = packSubTotal + packFee + deliveryFee;

      pushOrderPack(customerId, {
        items: pendingOrder.orderSummary.items,
        vendor: vendor?.name || "Unknown",
        vendorId: pendingOrder.vendorId,
        delivery_location: deliveryLocation,
        itemsTotal: packSubTotal,
        packFee: packFee,
        deliveryFee: deliveryFee,
        total: packTotal,
      });
      
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
        message: `Pack Added to Cart\n\nItems:\n${itemsList}\n\nItems Total: ₦${packSubTotal}${packFee > 0 ? `\nPack Fee: ₦${packFee}` : ''}\nDelivery Fee: ₦${deliveryFee}\n---\nPack Total: ₦${packTotal}\nVendor: ${vendor?.name}\nDelivery: ${deliveryLocation}\n\nWhat would you like to do next?`,
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
      `[processMessage] Classified intent: ${classification.intent}`
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