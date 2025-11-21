import { classifyIntent } from '../ai/intentClassifier.js';
import { handleIntent } from '../ai/intentHandlers.js';
import { generateOrderSummary, ORDER_SUMMARY_INTENTS } from '../ai/orderSummary.js';
import { orderStatusMessages, paymentMessages } from './orderStatusManager.js';

export async function processMessage(customerId, message) {
  try {
    // Check if user is providing delivery address
    const { getPendingOrder, clearPendingOrder } = await import('./sessionManager.js');
    const pendingOrder = getPendingOrder(customerId);
    
    if (pendingOrder?.awaitingAddress) {
      const { pushOrderPack, getStackSummary } = await import('./orderStack.js');
      const { getAllVendors } = await import('../db/Utils/vendor.js');
      const vendors = await getAllVendors();
      const vendor = vendors.find(v => v.id === pendingOrder.vendorId);
      
      const packTotal = pendingOrder.orderSummary.items.reduce((sum, item) => {
        if (item.quantity_type === 'per_price') {
          return sum + parseFloat(item.price);
        } else {
          return sum + (parseFloat(item.price) * item.quantity);
        }
      }, 0);
      
      pushOrderPack(customerId, {
        items: pendingOrder.orderSummary.items,
        vendor: vendor?.name || 'Unknown',
        vendorId: pendingOrder.vendorId,
        delivery_location: message,
        total: packTotal
      });
      
      clearPendingOrder(customerId);
      const stackSummary = getStackSummary(customerId);
      const itemsList = pendingOrder.orderSummary.items.map(i => {
        if (i.quantity_type === 'per_price') {
          return `${i.name} -- ₦${i.price}`;
        } else {
          return `${i.name} (x${i.quantity}) -- ₦${i.price * i.quantity}`;
        }
      }).join('\n');
      
      return {
        status: "success",
        response_type: "order_summary",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: `📦 Pack Added to Cart\n\nItems:\n${itemsList}\n\nPack Total: ₦${packTotal}\nVendor: ${vendor?.name}\nDelivery: ${message}\n\nTotal Packs: ${stackSummary.packCount}\n\nWhat would you like to do next?`,
        data: {
          buttons: [
            { id: "proceed_payment", title: "💳 Proceed to Payment" },
            { id: "add_new_pack", title: "➕ Add New Pack" },
            { id: "cancel_order", title: "❌ Cancel Order" }
          ]
        }
      };
    }
    
    const classification = await classifyIntent(message);
    console.log(`[processMessage] Classified intent: ${classification.intent} (Confidence: ${classification.confidence})`);
    let orderSummary = null;
    
    if (ORDER_SUMMARY_INTENTS.includes(classification.intent)) {
      orderSummary = await generateOrderSummary(message);
    }
    
    const response = await handleIntent(classification.intent, customerId, message, orderSummary);
    
    // Add payment handling ONLY for successful orders
    if (orderSummary?.items?.length > 0 && 
        classification.intent === "Food Ordering" && 
        response.status === "success" &&
        response.response_type === "order_confirmation") {
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
        ...(orderSummary && { order_summary: orderSummary })
      }
    };
  } catch (error) {
    console.error('Message processing error:', error);
    return {
      status: "error",
      response_type: "fallback",
      customer_id: customerId,
      timestamp: new Date().toISOString(),
      message: "Sorry, I'm currently experiencing technical difficulties. Please try again shortly."
    };
  }
}