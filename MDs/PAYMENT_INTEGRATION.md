# Payment Integration with Paystack Webhooks

## Current Problem
The bot uses a manual "Payment Sent" button instead of automatic payment verification through Paystack webhooks.

## Required Changes

### 1. Backend Webhook Endpoint
**Endpoint:** `POST /webhook/paystack`
- Already exists in backend
- Receives `charge.success` events
- Verifies payment and updates wallet balance

### 2. Bot Integration Steps

#### Step 1: Generate Transaction Reference
When user proceeds to payment, create a unique reference:

```javascript
const transactionRef = `ORD_${customerId}_${Date.now()}`;
```

#### Step 2: Send Payment Details with Reference
```javascript
message: `💳 Payment Details

Your Order: ${orderDetails}
Grand Total: ₦${grandTotal}

Account Name: Downtown Wallet
Account Number: 9082 XXXX 372
Bank: Moniepoint

⚠️ IMPORTANT: Use this reference when paying:
Reference: ${transactionRef}

We'll automatically confirm your payment once received.`
```

#### Step 3: Poll for Payment Status
Instead of "Payment Sent" button, poll the backend:

```javascript
// Check payment status every 10 seconds
const checkPayment = setInterval(async () => {
  const response = await fetch(`${BASE_URL}/transactions/${transactionRef}`);
  const data = await response.json();
  
  if (data.status === 'Completed') {
    clearInterval(checkPayment);
    // Send confirmation message
    await sendMessage(customerId, '✅ Payment Confirmed! Processing your order...');
  }
}, 10000);
```

### 3. Alternative: Webhook Notification
Backend can notify bot when payment is received:

**Backend sends webhook to bot:**
```
POST https://your-bot-url/payment-confirmed
{
  "transaction_ref": "ORD_123_1234567890",
  "customer_id": "15714326056",
  "amount": 2500,
  "status": "Completed"
}
```

**Bot receives and notifies user:**
```javascript
app.post('/payment-confirmed', async (req, res) => {
  const { customer_id, transaction_ref, amount } = req.body;
  
  await sendMessage(customer_id, 
    `✅ Payment Confirmed!
    
    Order ID: ${transaction_ref}
    Amount: ₦${amount}
    
    Your order is being processed!`
  );
  
  res.status(200).send('OK');
});
```

## Recommended Flow

### Current (Manual):
```
1. User clicks "Payment Sent" button
2. Bot generates receipt immediately
3. No actual payment verification
```

### Recommended (Automatic):
```
1. Bot generates transaction reference
2. User transfers money with reference
3. Paystack webhook notifies backend
4. Backend updates transaction status
5. Backend notifies bot OR bot polls status
6. Bot confirms payment to user
7. Bot generates receipt
```

## Implementation Priority

### Option 1: Polling (Easier)
- Bot polls backend every 10 seconds
- Checks transaction status
- Confirms when status = "Completed"

### Option 2: Webhook (Better)
- Backend calls bot webhook when payment received
- Instant notification
- More reliable

## Required Backend Endpoints

1. **GET /transactions/{reference}**
   - Returns transaction status
   - Bot uses for polling

2. **POST /bot/payment-notification** (New)
   - Backend calls this when payment confirmed
   - Bot receives instant notification

## Security Considerations

1. **Validate webhook signatures** from backend
2. **Store transaction references** in database
3. **Prevent duplicate confirmations**
4. **Set payment timeout** (e.g., 30 minutes)

## Next Steps

1. Add transaction reference generation
2. Implement polling OR webhook receiver
3. Remove manual "Payment Sent" button
4. Add payment timeout handling
5. Test with real Paystack transactions
