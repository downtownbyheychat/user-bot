// Simple in-memory session storage for pending orders
const sessions = new Map();

export function setPendingOrder(customerId, orderData) {
  sessions.set(customerId, {
    ...orderData,
    timestamp: Date.now()
  });
}

export function getPendingOrder(customerId) {
  return sessions.get(customerId) || null;
}

export function clearPendingOrder(customerId) {
  sessions.delete(customerId);
}

// Clean up old sessions (older than 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [customerId, session] of sessions.entries()) {
    if (now - session.timestamp > 600000) {
      sessions.delete(customerId);
    }
  }
}, 60000);
