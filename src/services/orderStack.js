// Stack-based order management
const orderStacks = new Map();

export function pushOrderPack(customerId, orderPack) {
  if (!orderStacks.has(customerId)) {
    orderStacks.set(customerId, []);
  }
  orderStacks.get(customerId).push({
    ...orderPack,
    timestamp: Date.now()
  });
}

export function getOrderStack(customerId) {
  return orderStacks.get(customerId) || [];
}

export function clearOrderStack(customerId) {
  orderStacks.delete(customerId);
}

export function getStackSummary(customerId) {
  const stack = getOrderStack(customerId);
  if (stack.length === 0) return null;
  
  let totalItems = 0;
  const vendors = new Set();
  
  stack.forEach(pack => {
    totalItems += pack.items.length;
    vendors.add(pack.vendor);
  });
  
  return {
    packCount: stack.length,
    totalItems,
    vendors: Array.from(vendors)
  };
}
