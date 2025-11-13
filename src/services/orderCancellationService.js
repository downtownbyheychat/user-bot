// In-memory storage for tracking order timestamps
// In production, this should be stored in a database
const orderTimestamps = new Map();

// Function to track when an order was placed
export function trackOrderPlacement(customerId, orderId) {
  const timestamp = Date.now();
  orderTimestamps.set(orderId, {
    customerId: customerId,
    placedAt: timestamp
  });
  console.log(`Order ${orderId} placed by ${customerId} at ${new Date(timestamp)}`);
}

// Function to check if an order can be cancelled (within 2 minutes)
export function canCancelOrder(orderId) {
  const orderData = orderTimestamps.get(orderId);
  if (!orderData) {
    return { canCancel: false, reason: "Order not found" };
  }
  
  const now = Date.now();
  const timeElapsed = now - orderData.placedAt;
  const twoMinutes = 2 * 60 * 1000; // 2 minutes in milliseconds
  
  if (timeElapsed <= twoMinutes) {
    const timeLeft = twoMinutes - timeElapsed;
    return { 
      canCancel: true, 
      timeLeft: timeLeft,
      timeLeftSeconds: Math.floor(timeLeft / 1000)
    };
  } else {
    return { canCancel: false, reason: "Order is older than 2 minutes" };
  }
}

// Function to cancel an order
export function cancelOrder(orderId) {
  const orderData = orderTimestamps.get(orderId);
  if (!orderData) {
    return { success: false, reason: "Order not found" };
  }
  
  // Remove the order from tracking
  orderTimestamps.delete(orderId);
  
  return { 
    success: true, 
    message: "Order has been successfully cancelled",
    orderId: orderId
  };
}

// Function to get order information
export function getOrderInfo(orderId) {
  return orderTimestamps.get(orderId) || null;
}