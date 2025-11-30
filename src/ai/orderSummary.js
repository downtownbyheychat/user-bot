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
const model = gemini.getGenerativeModel({model: "gemini-2.0-flash-lite"});

export async function generateOrderSummary(message, customerId = null) {
  const prompt = `You are an information extraction system. Analyze the customer message and return a structured JSON order summary.

 OBJECTIVE
Extract:
1. **vendor** – restaurant/vendor name if mentioned
2. **items** – each food item with quantity and price
3. **quantity_type** – ONLY:
   - "per_price" → when the user gives a price directly tied to that item (e.g., "₦800 jollof rice", "stir fry ₦1200")
   - null → when no price implies a unit quantity
4. **delivery_location** – extract location OR return "USER_HOSTEL" if user mentions:
   "my hostel", "my room", "my block", "my place", "my hall", "my apartment", etc.

 EXTRACTION RULES
- If no quantity is stated, use \`1\`.
- If price is present for an item, set \`price\` to that value.
- If multiple items are mentioned, extract each separately.
- Normalize item names (no emojis, no slang).
- Detect vendor from phrases like:
  - "from *VendorName*"
  - "*VendorName* restaurant"
  - "order from *VendorName*"
- Ignore text unrelated to the order.
- CRITICAL EXCEPTION: These exact phrases are SINGLE items - NEVER split them:
  1. "yam and egg" → ONE item, not "yam" + "egg"
  2. "bread and egg" → ONE item, not "bread" + "egg"
  3. "rice and beans" → ONE item, not "rice" + "beans"
  4. "plantain and egg" → ONE item, not "plantain" + "egg"
  5. "cake and cream" → ONE item
  6. "chicken and chips" → ONE item
  7. "big bread and egg" → ONE item
  8. "yam and egg with sauce" → ONE item
  9. "coconut rice with shrimps" → ONE item
  10. "potatoes and egg with sauce" → ONE item
  11. "plantain and egg with sauce" → ONE item
  12. "hot chocolate with whipped cream" → ONE item
- For ALL other cases, treat "with" or "and" as delimiters between separate items
- Example: "I want bread and egg" → items: [{name: "bread and egg", quantity: 1}]
- Example: "I want jollof rice and chicken" → items: [{name: "jollof rice", quantity: 1}, {name: "chicken", quantity: 1}]
- If no vendor is mentioned, set \`vendor\` to null.
- If no delivery location is mentioned, set \`delivery_location\` to null.

 OUTPUT FORMAT (STRICT)
Return ONLY valid JSON in this exact structure:

{
  "vendor": string | null,
  "items": [
    {
      "name": string,
      "quantity": number,
      "quantity_type": "per_price" | null,
      "price": number | null
    }
  ],
  "delivery_location": string | "USER_HOSTEL" | null
}



 USER MESSAGE:  "${message}"

Return ONLY JSON. No explanations.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    
    let cleanResponse = response.replace(/```json\s*/, '').replace(/```\s*$/, '');
    const summary = JSON.parse(cleanResponse);

    console.log('Generated order summary:', summary);
    
    // Keep USER_HOSTEL as placeholder since hostel is no longer in database
    if (summary.delivery_location === 'USER_HOSTEL') {
      summary.delivery_location = 'my hostel';
    }
    
    return summary;
  } catch (error) {
    console.error('Order summary error:', error);
    return { vendor: null, items: [], delivery_location: null, has_mixed_types: false };
  }
}

export const ORDER_SUMMARY_INTENTS = ["Food Ordering", "Modify Order", "Re-ordering"];
