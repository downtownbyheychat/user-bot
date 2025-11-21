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
      clearPendingOrder(customerId);
      return {
        status: "success",
        response_type: "order_confirmation",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: `🟡 Order Placed\nGot it! Your order has been received 🧾\n\nDelivery: ${message}\n\nWe'll confirm with the restaurant shortly.`,
        data: {
          vendor_id: pendingOrder.vendorId,
          delivery_location: message,
          delivery_type: "delivery",
          payment_required: true
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