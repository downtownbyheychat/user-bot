# Order Correction Flow Documentation

## Overview
The system now supports intelligent order correction, allowing users to fix specific issues without restarting their entire order from scratch.

## Supported Correction Scenarios

### 1. **Item Validation Errors**
When specific items fail validation (not found, typos, etc.):

```
User: "jollof rice, coleslaw from African Kitchen"

Bot: ❌ Order validation failed:
     • "coleslaw" not found at African Kitchen
     
     ✅ Valid items:
     • Jollof Rice
     
     💡 Reply with corrected items only, or type 'cancel' to start over.

User: "plantain"

Bot: ✅ Pack Added to Cart
     Items:
     Jollof Rice (x1) -- ₦1,400
     Plantain (x1) -- ₦300
```

**How it works:**
- Valid items are saved to `failedOrders` session
- User provides only the corrected/replacement items
- System merges new items with saved valid items
- Re-validates complete order

---

### 2. **Only Add-ons Error**
When user orders only add-ons without main items:

```
User: "2 eggs, 1 sausage from African Kitchen"

Bot: ❌ You can't order only add-ons (egg, sausage, etc).
     
     💡 Reply with a main item to add, or type 'cancel' to start over.

User: "jollof rice"

Bot: ✅ Pack Added to Cart
     Items:
     Jollof Rice (x1) -- ₦1,400
     Egg (x2) -- ₦200
     Sausage (x1) -- ₦150
```

**How it works:**
- Add-on items saved with `errorType: 'only_addons'`
- User provides main item
- System merges main item with saved add-ons
- Validates complete order

---

### 3. **Mixed Pack Types Error**
When user mixes incompatible item types:

```
User: "full pack jollof, 2 bottles coke from African Kitchen"

Bot: ❌ You can't mix pack items with per-piece items.
     
     💡 Reply with items of the same type, or type 'cancel' to start over.

User: "half pack fried rice"

Bot: ✅ Pack Added to Cart
     Items:
     Full Pack Jollof (x1) -- ₦2,500
     Half Pack Fried Rice (x1) -- ₦1,500
```

**How it works:**
- Failed items saved with `errorType: 'mixed_types'`
- User provides compatible items
- System validates item type compatibility
- Processes corrected order

---

### 4. **Missing Vendor**
When items are provided without specifying vendor:

```
User: "jollof rice, chicken"

Bot: Select a vendor to order "jollof rice, chicken" from:
     [Interactive List]
     1. African Kitchen
     2. Mama Put
     3. Campus Café

User: [Clicks "African Kitchen"]

Bot: ✅ Pack Added to Cart
     Items:
     Jollof Rice (x1) -- ₦1,400
     Chicken (x1) -- ₦500
```

**How it works:**
- Items saved with `errorType: 'no_vendor'`
- System shows interactive list or text list of vendors
- User selects vendor (via list click or text reply)
- System merges vendor with saved items
- Validates complete order

**Supports both:**
- **Interactive lists** (≤10 vendors): User clicks from WhatsApp list
- **Text lists** (>10 vendors): User types vendor name

---

### 5. **Missing Delivery Location**
When order is valid but delivery location not specified:

```
User: "jollof rice from African Kitchen"

Bot: Order: Jollof Rice (x1) -- ₦1,400 from African Kitchen
     
     📍 Pickup or Delivery?
     [Buttons: 🏃 Pickup | 🚴 Delivery]

User: [Clicks "Delivery"]

Bot: 📍 Where should we deliver your order?
     Please provide your delivery address:

User: "Silver 2 hostel"

Bot: ✅ Pack Added to Cart
     Items:
     Jollof Rice (x1) -- ₦1,400
     
     Delivery: Silver 2 hostel
```

**How it works:**
- Order saved to `pendingOrders` session
- System prompts for pickup/delivery
- If delivery, prompts for address
- Completes order with location

---

## Technical Implementation

### Session Storage
```javascript
// sessionManager.js
const failedOrders = new Map(); // Stores partial orders with errors

setFailedOrder(customerId, {
  validatedItems: [],      // Items that passed validation
  failedItems: [],         // Items that failed validation
  vendor: 'Vendor Name',   // Vendor name (if known)
  vendorId: 'vendor_id',   // Vendor ID (if known)
  delivery_location: null, // Delivery location (if provided)
  errorType: 'item_validation' | 'only_addons' | 'mixed_types' | 'no_vendor',
  items: []                // Original items (for vendor selection)
});
```

### Correction Detection
```javascript
// messageProcessor.js
const failedOrder = getFailedOrder(customerId);

if (failedOrder) {
  const correctionSummary = await generateOrderSummary(message);
  
  // Merge corrections with saved data
  const mergedSummary = {
    vendor: correctionSummary.vendor || failedOrder.vendor,
    items: [...failedOrder.validatedItems, ...correctionSummary.items],
    delivery_location: correctionSummary.delivery_location || failedOrder.delivery_location
  };
  
  // Re-validate complete order
  return await handleIntent('Food Ordering', customerId, message, mergedSummary);
}
```

### Interactive List Handling
```javascript
// buttonHandler.js
if (buttonId.startsWith('vendor_')) {
  const failedOrder = getFailedOrder(customerId);
  
  if (failedOrder?.items) {
    // User selected vendor from list for failed order
    const mergedSummary = {
      vendor: vendor.name,
      items: failedOrder.items,
      delivery_location: failedOrder.delivery_location
    };
    
    clearFailedOrder(customerId);
    return await handleIntent('Food Ordering', customerId, '', mergedSummary);
  }
  
  // Normal vendor menu display
  // ...
}
```

---

## Cancel Command
Users can type `cancel` at any point to clear all saved state and start fresh:

```
User: "cancel"

Bot: Order cancelled. Start fresh whenever you're ready! 😊
```

---

## Session Expiry
- Failed orders auto-expire after **10 minutes**
- Pending orders auto-expire after **10 minutes**
- Cleanup runs every **1 minute**

---

## Error Messages Format

All error messages now include:
1. ❌ Clear description of what went wrong
2. ✅ List of valid items (if any)
3. 💡 Guidance on how to correct
4. Option to type 'cancel' to start over

Example:
```
❌ Order validation failed:
• "coleslaw" not found at African Kitchen

✅ Valid items:
• Jollof Rice
• Chicken

💡 Reply with corrected items only, or type 'cancel' to start over.
```

---

## Benefits

1. **Better UX**: Users don't lose progress on partial orders
2. **Reduced Friction**: Fix specific issues without re-typing everything
3. **Intelligent Merging**: System combines corrections with valid data
4. **Flexible Input**: Supports text replies and interactive list clicks
5. **Clear Guidance**: Users always know what to do next

---

## Files Modified

1. **src/services/sessionManager.js**
   - Added `failedOrders` Map
   - Added `setFailedOrder()`, `getFailedOrder()`, `clearFailedOrder()`

2. **src/ai/intentHandlers.js**
   - Save partial state on validation errors
   - Save partial state on add-ons/mixed types errors
   - Clear failed order state on success

3. **src/services/messageProcessor.js**
   - Detect correction attempts
   - Merge corrections with saved data
   - Handle cancel command
   - Support vendor selection corrections

4. **src/services/buttonHandler.js**
   - Handle vendor selection from interactive lists
   - Check for failed orders on vendor click
   - Merge vendor with saved items

5. **src/webhook/webhook.js**
   - Already handles list interactions (no changes needed)

---

## Testing Scenarios

### Test 1: Item Validation Error
1. Order: "jollof rice, invalid_item from African Kitchen"
2. Expect: Error with valid items listed
3. Reply: "plantain"
4. Expect: Success with all items

### Test 2: Only Add-ons
1. Order: "2 eggs from African Kitchen"
2. Expect: Error asking for main item
3. Reply: "jollof rice"
4. Expect: Success with rice + eggs

### Test 3: Missing Vendor (Interactive List)
1. Order: "jollof rice, chicken"
2. Expect: Interactive list of vendors
3. Click: "African Kitchen"
4. Expect: Success with items from African Kitchen

### Test 4: Missing Vendor (Text Reply)
1. Order: "jollof rice, chicken"
2. Expect: List of vendors (if >10)
3. Reply: "African Kitchen"
4. Expect: Success with items from African Kitchen

### Test 5: Cancel Command
1. Order: "jollof rice, invalid_item from African Kitchen"
2. Expect: Error with valid items
3. Reply: "cancel"
4. Expect: Order cancelled, state cleared

---

## Future Enhancements

1. **Price Correction**: Allow users to correct price for per_price items
2. **Quantity Adjustment**: Allow users to modify quantities without re-ordering
3. **Item Removal**: Allow users to remove specific items from saved order
4. **Multi-step Corrections**: Handle multiple correction rounds
5. **Suggestion System**: Suggest similar items when item not found
