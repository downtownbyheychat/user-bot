// Simple in-memory storage for pending orders
const pendingOrders = new Map();

export function savePendingOrder(customerId, orderData) {
  pendingOrders.set(customerId, {
    ...orderData,
    createdAt: new Date()
  });
}

export function getPendingOrder(customerId) {
  return pendingOrders.get(customerId) || null;
}

export function removePendingOrder(customerId) {
  return pendingOrders.delete(customerId);
}

// Clean up old pending orders (older than 1 hour)
export function cleanupPendingOrders() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  for (const [customerId, orderData] of pendingOrders.entries()) {
    if (orderData.createdAt < oneHourAgo) {
      pendingOrders.delete(customerId);
    }
  }
}

// Run cleanup every 30 minutes
setInterval(cleanupPendingOrders, 30 * 60 * 1000);