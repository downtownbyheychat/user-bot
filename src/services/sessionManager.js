// Simple in-memory session storage for pending orders
const sessions = new Map();
const failedOrders = new Map();

export function setPendingOrder(customerId, orderData) {
  return sessions.set(customerId, {
    ...orderData,
    timestamp: Date.now()
  });
}

export const paymentSessions = new Map();

export function startRefundTimer(customerId, onFinalize) {
  const session = paymentSessions.get(customerId);
  if (!session) return;

  // prevent duplicate timers
  if (session.refundTimer) return;

  const remaining =
    session.refundDeadline - Date.now();

  if (remaining <= 0) {
    onFinalize(session);
    return;
  }

  session.refundTimer = setTimeout(() => {
    const latest = paymentSessions.get(customerId);

    if (!latest) return;

    // Only finalize if NOT refunded
    if (latest.status === "CONFIRMED") {
      onFinalize(latest);
    }
  }, remaining);

  paymentSessions.set(customerId, session);
}

/**
 * Check if refund window is still open
 */
export function canRefund(customerId) {
  const session = paymentSessions.get(customerId);
  if (!session) return false;

  return (
    session.status === "CONFIRMED" &&
    Date.now() < session.refundDeadline
  );
}


export function getPendingOrder(customerId) {
  return sessions.get(customerId) || null;
}

export function clearPendingOrder(customerId) {
  sessions.delete(customerId);
}

export function setFailedOrder(customerId, orderData) {
  failedOrders.set(customerId, {
    ...orderData,
    timestamp: Date.now()
  });
}

export function setAwaitingInput(customerId, inputType) {
  const existing = failedOrders.get(customerId) || {};
  failedOrders.set(customerId, {
    ...existing,
    awaitingInput: inputType,
    timestamp: Date.now()
  });
}

export function getAwaitingInput(customerId) {
  const order = failedOrders.get(customerId);
  return order?.awaitingInput || null;
}

export function getFailedOrder(customerId) {
  return failedOrders.get(customerId) || null;
}

export function clearFailedOrder(customerId) {
  failedOrders.delete(customerId);
}

// Clean up old sessions (older than 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [customerId, session] of sessions.entries()) {
    if (now - session.timestamp > 600000) {
      sessions.delete(customerId);
    }
  }
  for (const [customerId, session] of failedOrders.entries()) {
    if (now - session.timestamp > 600000) {
      failedOrders.delete(customerId);
    }
  }
}, 60000);
