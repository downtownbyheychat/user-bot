// import { GoogleGenerativeAI } from "@google/generative-ai";
// import dotenv from 'dotenv';

// dotenv.config();

// const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = gemini.getGenerativeModel({model: "gemini-2.0-flash-lite"});

// export async function generateOrderSummary(message) {
//   const prompt = `Extract order details from this message and return a structured summary.

// RULES:
// - Extract items, quantities, special requests, and modifications
// - If no specific items mentioned, return empty items array
// - Handle order modifications (add, remove, change)
// - Return valid JSON only

// OUTPUT FORMAT:
// {
//   "items": [
//     {
//       "name": "item name",
//       "quantity": number,
//       "special_requests": "any modifications or notes"
//     }
//   ],
//   "modifications": {
//     "type": "add|remove|change|new_order",
//     "details": "description of changes"
//   },
//   "total_estimated": "estimated price if calculable",
//   "delivery_location": "if mentioned"
// }

// Now extract from: "${message}"

// Return ONLY the JSON response.`;

//   try {
//     const result = await model.generateContent(prompt);
//     const response = result.response.text().trim();
    
//     let cleanResponse = response;
//     if (cleanResponse.startsWith('```json')) {
//       cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
//     }
//     if (cleanResponse.startsWith('```')) {
//       cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
//     }
    
//     return JSON.parse(cleanResponse);
//   } catch (error) {
//     console.error('Order summary generation error:', error);
//     return {
//       items: [],
//       modifications: { type: "new_order", details: "" },
//       total_estimated: "",
//       delivery_location: ""
//     };
//   }
// }

// export const ORDER_SUMMARY_INTENTS = [
//   "Food Ordering", 
//   "Modify Order", 
//   "Re-ordering"
// ];

import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = gemini.getGenerativeModel({model: "gemini-2.5-flash-lite"});

export async function generateOrderSummary(message) {
  const prompt = `Extract order details and return structured JSON.

EXTRACT:
- vendor: vendor/restaurant name
- items: array of food items with quantity and price
- quantity_types: detect per_price, per_piece, full_pack, or half_pack

RULES:
- per_price: items sold by price (e.g., "₦800 jollof rice")
- per_piece: items sold by count (e.g., "2 bottles of coke")
- full_pack/half_pack: combo meals
- Extract vendor from phrases like "from [vendor]"

OUTPUT FORMAT:
{
  "vendor": "vendor name or null",
  "items": [
    {
      "name": "item name",
      "quantity": number,
      "quantity_type": "per_price|per_piece|full_pack|half_pack",
      "price": price_if_mentioned
    }
  ],
  "delivery_location": "location or null",
}

Message: "${message}"

Return ONLY valid JSON.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    
    let cleanResponse = response.replace(/```json\s*/, '').replace(/```\s*$/, '');
    return JSON.parse(cleanResponse);
  } catch (error) {
    console.error('Order summary error:', error);
    return { vendor: null, items: [], delivery_location: null, has_mixed_types: false };
  }
}

export const ORDER_SUMMARY_INTENTS = ["Food Ordering", "Modify Order", "Re-ordering"];
