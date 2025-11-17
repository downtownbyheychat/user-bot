const orderStatuses = new Map();

export function setOrderStatus(orderId, customerId, status, details = null) {
  orderStatuses.set(orderId, { customerId, status, details, timestamp: Date.now() });
}

export function getOrderStatus(orderId) {
  return orderStatuses.get(orderId);
}

export function removeOrder(orderId) {
  orderStatuses.delete(orderId);
}
