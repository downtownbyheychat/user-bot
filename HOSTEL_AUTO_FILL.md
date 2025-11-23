# Hostel Auto-Fill Feature

## Overview
When users mention "my hostel", "hostel", or "my room" as their delivery location, the system automatically replaces it with their actual hostel from their onboarding profile.

## How It Works

### User Flow Example:
```
User: "jollof rice from African Kitchen delivered to my hostel"

System Processing:
1. AI detects "my hostel" → returns "USER_HOSTEL" placeholder
2. System fetches user's hostel from database (e.g., "Silver 2")
3. Replaces placeholder with actual hostel
4. Processes order with "Silver 2" as delivery location

Bot: ✅ Pack Added to Cart
     Items:
     Jollof Rice (x1) -- ₦1,400
     
     Delivery: Silver 2
```

## Supported Phrases

The AI detects these phrases and triggers hostel replacement:
- "my hostel"
- "hostel"
- "my room"
- "to hostel"
- "deliver to my hostel"
- "at my hostel"

## Technical Implementation

### 1. Database Schema
```sql
-- users table includes hostel field
SELECT id, name, email, email_verified, hostel 
FROM users 
WHERE phone_number = $1
```

### 2. Order Summary Generation (orderSummary.js)
```javascript
// AI prompt includes hostel detection rule
"For delivery_location: if user says 'my hostel', 'hostel', 'my room', 
 return 'USER_HOSTEL' as placeholder"

// After AI response, replace placeholder
if (summary.delivery_location === 'USER_HOSTEL' && customerId) {
  const hostel = await getUserHostel(customerId);
  summary.delivery_location = hostel || 'my hostel';
}
```

### 3. User Utilities (users.js)
```javascript
// New function to fetch user's hostel
export async function getUserHostel(phoneNumber) {
  const result = await pool.query(
    'SELECT hostel FROM users WHERE phone_number = $1',
    [String(phoneNumber)]
  );
  return result.rows[0]?.hostel || null;
}
```

### 4. Message Processing (messageProcessor.js)
```javascript
// Pass customerId to generateOrderSummary
orderSummary = await generateOrderSummary(message, customerId);
```

## Fallback Behavior

If hostel cannot be retrieved:
- Falls back to "my hostel" as literal text
- Order still processes successfully
- User can manually specify location in next message

## Benefits

1. **Convenience**: Users don't need to type full hostel name
2. **Accuracy**: Uses verified hostel from onboarding
3. **Speed**: Faster order placement
4. **Consistency**: Same hostel format across all orders

## Example Scenarios

### Scenario 1: Complete Order with Hostel
```
User: "2 jollof rice from African Kitchen to my hostel"
Bot: ✅ Order confirmed - Delivery: Silver 2
```

### Scenario 2: Hostel Added Later
```
User: "jollof rice from African Kitchen"
Bot: 📍 Pickup or Delivery?
User: [Clicks Delivery]
Bot: 📍 Where should we deliver?
User: "my hostel"
Bot: ✅ Order confirmed - Delivery: Silver 2
```

### Scenario 3: Specific Location Override
```
User: "jollof rice from African Kitchen to Gold 4"
Bot: ✅ Order confirmed - Delivery: Gold 4
(User's specific location overrides default hostel)
```

## Files Modified

1. **src/db/Utils/users.js**
   - Added `hostel` field to `checkUserExists()` query
   - Created `getUserHostel()` function

2. **src/ai/orderSummary.js**
   - Updated AI prompt to detect hostel references
   - Added placeholder replacement logic
   - Added `customerId` parameter

3. **src/services/messageProcessor.js**
   - Pass `customerId` to `generateOrderSummary()`
   - Applies to both new orders and corrections

## Testing

### Test Case 1: Direct Hostel Reference
```
Input: "jollof rice from African Kitchen to my hostel"
Expected: Order with user's actual hostel (e.g., "Silver 2")
```

### Test Case 2: Hostel Keyword Only
```
Input: "jollof rice from African Kitchen to hostel"
Expected: Order with user's actual hostel
```

### Test Case 3: No Hostel in Profile
```
Input: "jollof rice from African Kitchen to my hostel"
Expected: Order with "my hostel" as literal text (fallback)
```

### Test Case 4: Specific Location
```
Input: "jollof rice from African Kitchen to Gold 4"
Expected: Order with "Gold 4" (no replacement)
```

## Future Enhancements

1. **Multiple Addresses**: Allow users to save multiple delivery addresses
2. **Address Shortcuts**: Support "home", "class", "library" etc.
3. **Address Management**: Commands to view/update saved addresses
4. **Smart Suggestions**: Suggest recent delivery locations
