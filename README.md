# Campus AI Bot

AI-powered university campus chatbot with intent classification, order processing, and receipt generation.

## Features

- **Intent Classification**: AI-powered message understanding using Google Gemini
- **Order Processing**: Smart order summary generation and processing
- **Receipt Generation**: Automated PDF receipt creation
- **MongoDB Integration**: Persistent storage for messages and chat history
- **WhatsApp Integration**: Full WhatsApp Business API support

## Project Structure

```
src/
├── ai/                     # AI services
│   ├── intentClassifier.js # Intent classification using Gemini
│   ├── intentHandlers.js   # Intent-specific response handlers
│   └── orderSummary.js     # Order extraction and processing
├── database/               # Database layer
│   └── mongodb.js          # MongoDB connection and operations
├── services/               # Business logic services
│   ├── messageProcessor.js # Main message processing orchestrator
│   └── receiptGenerator.js # PDF receipt generation
└── webhook/                # API layer
    └── webhook.js          # Express server and WhatsApp webhook
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. Start MongoDB locally or use MongoDB Atlas

4. Run the bot:
   ```bash
   npm run dev
   ```

## Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `GEMINI_API_KEY`: Google Gemini API key
- `WHATSAPP_ACCESS_TOKEN`: WhatsApp Business API token
- `WHATSAPP_VERIFY_TOKEN`: Webhook verification token
- `PHONE_NUMBER_ID`: WhatsApp phone number ID

## Supported Intents

- Food ordering and delivery management
- Print services
- Account management
- General customer service