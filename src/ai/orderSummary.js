import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = gemini.getGenerativeModel({model: "gemini-2.5-pro"});

export async function generateOrderSummary(message) {
  const prompt = `Extract order details from this message and return a structured summary.

RULES:
- Extract items, quantities, special requests, and modifications
- If no specific items mentioned, return empty items array
- Handle order modifications (add, remove, change)
- Return valid JSON only

OUTPUT FORMAT:
{
  "items": [
    {
      "name": "item name",
      "quantity": number,
      "special_requests": "any modifications or notes"
    }
  ],
  "modifications": {
    "type": "add|remove|change|new_order",
    "details": "description of changes"
  },
  "total_estimated": "estimated price if calculable",
  "delivery_location": "if mentioned"
}

Now extract from: "${message}"

Return ONLY the JSON response.`;

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
    console.error('Order summary generation error:', error);
    return {
      items: [],
      modifications: { type: "new_order", details: "" },
      total_estimated: "",
      delivery_location: ""
    };
  }
}

export const ORDER_SUMMARY_INTENTS = [
  "Food Ordering", 
  "Modify Order", 
  "Re-ordering"
];