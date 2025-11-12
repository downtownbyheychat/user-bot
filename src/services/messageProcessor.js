import { classifyIntent } from '../ai/intentClassifier.js';
import { handleIntent } from '../ai/intentHandlers.js';
import { generateOrderSummary, ORDER_SUMMARY_INTENTS } from '../ai/orderSummary.js';
import { orderStatusMessages, paymentMessages } from './orderStatusManager.js';
import { getPendingOrder, removePendingOrder } from './pendingOrders.js';

export async function processMessage(customerId, message) {
  try {
    const classification = await classifyIntent(message);
    let orderSummary = null;
    
    // Check if this is a delivery address input
    const pendingOrder = getPendingOrder(customerId);
    const deliveryKeywords = ['hostel', 'room', 'address', 'deliver', 'to'];
    const hasDeliveryKeywords = deliveryKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
    
    if (pendingOrder && hasDeliveryKeywords) {
      // This is a delivery address for a pending order
      const { vendor, items, vendorData } = pendingOrder;
      
      // Remove the pending order
      removePendingOrder(customerId);
      
      // Create a new order summary with the delivery address
      orderSummary = {
        vendor: vendor,
        items: items,
        delivery_location: message
      };
      
      // Process as a Food Ordering intent with delivery location
      const response = await handleIntent("Food Ordering", customerId, message, orderSummary);
      
      // Add payment handling for orders
      if (orderSummary?.items?.length > 0 && response.status === "success") {
        // Use the total cost from the response if available, otherwise fallback to estimated total
        const totalCost = response.data?.total_cost || "2500";
        const paymentInfo = paymentMessages.firstTimePayment(
          totalCost,
          "9182 XXXX 645"
        );
        response.data = { ...response.data, ...paymentInfo.data };
      }
      
      return {
        ...response,
        classification: { intent: "Food Ordering", confidence: "High" },
        data: { 
          ...response.data, 
          ...(orderSummary && { order_summary: orderSummary })
        }
      };
    }
    
    if (ORDER_SUMMARY_INTENTS.includes(classification.intent)) {
      orderSummary = await generateOrderSummary(message);
    }
    
    const response = await handleIntent(classification.intent, customerId, message, orderSummary);
    
    // Add payment handling for orders
    if (orderSummary?.items?.length > 0 && classification.intent === "Food Ordering" && response.status === "success") {
      // Use the total cost from the response if available, otherwise fallback to estimated total
      const totalCost = response.data?.total_cost || orderSummary.total_estimated || "2500";
      const paymentInfo = paymentMessages.firstTimePayment(
        totalCost,
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