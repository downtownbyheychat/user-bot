# Campus AI Bot - User Flow

## Message Processing Flow

```
1. User sends WhatsApp message
   ↓
2. WhatsApp → webhook.js (/webhook POST)
   ↓
3. Check if message already processed (MongoDB)
   ↓
4. Save message to database
   ↓
5. messageProcessor.js orchestrates:
   ├── intentClassifier.js (Gemini AI)
   ├── orderSummary.js (if food order)
   └── intentHandlers.js (generate response)
   ↓
6. Send response to WhatsApp
   ↓
7. Generate PDF receipt (if order confirmed)
```

## Supported User Commands

### Food Ordering
- "Order pizza"
- "I want 2 burgers and a coke"
- "Cancel my order"
- "Track my delivery"

### Print Services  
- "Print my document"
- "How much does printing cost?"
- "Cancel print job"

### Account Management
- "Check my balance"
- "Update my profile"
- "View transaction history"

### General
- "Hello" / "Hi"
- "Help"
- "What can you do?"

## Response Types

- **Greeting**: Welcome messages
- **Menu**: Food options and pricing
- **Order Confirmation**: Order details and receipt
- **Information**: Service details and pricing
- **Error Handling**: Fallback responses

## AI Features

- **Intent Classification**: Understands user intent from natural language
- **Order Extraction**: Automatically extracts items, quantities, and preferences
- **Context Awareness**: Maintains conversation history
- **Smart Responses**: Contextual and helpful replies