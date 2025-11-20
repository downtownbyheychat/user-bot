import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = gemini.getGenerativeModel({model: "gemini-2.0-flash-lite"});

export async function classifyIntent(message) {
  const prompt = `You are an Intent Classification Model for a University Campus Chatbot.
Your task is to analyze a user message and classify it into the single most appropriate intent from the list below.

RULES:
- Always select exactly one intent
- Never invent intents that are not listed
- If the message includes multiple requests, select the primary or most dominant intent
- If no intent matches, classify as "Unknown"
- Output must be valid JSON following the schema below

INTENTS:
General Interaction:
- Greeting
- Information About Company
- Customer Service

Food Ordering & Delivery:
- Food Ordering
- Re-ordering
- Find Restaurant
- Track Order
- Delivery Time
- Cancel Order
- Modify Order
- View Order History
- Order Issue & File Complaint
- Daily Specials & Promotions
- Recommendations

Account & Payment:
- Manage Account
- Fund Wallet
- View Balance
- Update Name
- View Account Details

OUTPUT FORMAT:
{
  "intent": "<One of the intents above OR 'Unknown'>",
  "confidence": "<High | Medium | Low>"
}

Now classify this message: "${message}"

Return ONLY the JSON response, no additional text or formatting.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    
    let cleanResponse = response;
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
    }
    if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
    }
    
    return JSON.parse(cleanResponse);
  } catch (error) {
    console.error('Intent classification error:', error);
    return {
      intent: "Unknown",
      confidence: "Low"
    };
  }
}