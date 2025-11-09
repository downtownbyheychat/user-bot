import { getUserName } from "../db/Utils/users.js";
import { getVendorByName, searchItemAcrossVendors, getVendorCatalogue, validateOrderItem, hasMixedTypes, hasOnlyAddOns } from "../db/Utils/vendor.js";


export const intentHandlers = {
  "Greeting": async (customerId, message) => {
    try {
        // Fetch the user's name from the database
        const userName = await getUserName(customerId);
        console.log(`[Greeting] Fetched userName: ${userName}`);

        // Generate the response
        return {
        status: "success",
        response_type: "greeting",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: `Sup ${userName || "{name}"}! 👋\nWelcome back to Downtown, where you chat, order, and eat. Fast.`,
        };
    } catch (error) {
        console.error('Error handling Greeting intent:', error);
        return {
        status: "error",
        response_type: "greeting",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: "Oops! Something went wrong. Please try again later.",
        };
    }
    },

  "Information About Company": async (customerId, message) => ({
    status: "success",
    response_type: "text",
    customer_id: customerId,
    timestamp: new Date().toISOString(),
    message: "😎 Can't say much about that one right now, But you can vibe with us on downtown.ng or join The Hashtag WhatsApp Channel, we drop daily updates there!\n\n👉 Link to join: https://whatsapp.com/channel/0029Vb73OpaLtOjL2pM98O34"
}),



  "Customer Service": async (customerId, message) => ({
    status: "success",
    response_type: "customer_service",
    customer_id: customerId,
    timestamp: new Date().toISOString(),
    message: "Oops 😅 sounds like you need a hand!\nOur support team's got you, just send a quick mail to help@downtown.ng and someone will get back to you fast ⚡"
  }),


  "Food Ordering": async (customerId, message, orderSummary) => {
  if (!orderSummary) {
    return {
      status: "success",
      response_type: "order_format",
      customer_id: customerId,
      timestamp: new Date().toISOString(),
      message: "Got an order? Say less 😌\nFormat:\n\n₦800 jollof rice, 2 chicken from African Kitchen delivered to my hostel"
    };
  }

  const { vendor, items, delivery_location } = orderSummary;

  // Case 1: Vendor only, no items
  if (vendor && items.length === 0) {
    const vendorData = await getVendorByName(vendor);
    if (!vendorData) {
      return {
        status: "error",
        response_type: "vendor_not_found",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: `Sorry, I couldn't find "${vendor}".`
      };
    }
    
    const catalogue = await getVendorCatalogue(vendorData.id);
    return {
      status: "success",
      response_type: "vendor_catalogue",
      customer_id: customerId,
      timestamp: new Date().toISOString(),
      message: catalogue
    };
  }

//   // Case 2: Items without vendor
//   if (!vendor && items.length > 0) {
//     const firstItem = items[0].name;
//     const vendors = await searchItemAcrossVendors(firstItem);
    
//     if (vendors.length === 0) {
//       return {
//         status: "error",
//         response_type: "item_not_found",
//         customer_id: customerId,
//         timestamp: new Date().toISOString(),
//         message: `Sorry, I couldn't find "${firstItem}".`
//       };
//     }
    
//     const vendorList = vendors.map((v, i) => `${i + 1}. ${v.vendor_name}`).join('\n');
//     return {
//       status: "success",
//       response_type: "vendor_selection",
//       customer_id: customerId,
//       timestamp: new Date().toISOString(),
//       message: `Found "${firstItem}" at:\n\n${vendorList}\n\nWhich vendor you wan order from?`
//     };
//   }

// Case 2: Items without vendor
if (!vendor && items.length > 0) {
  // Find vendors that have ALL items
  const vendorItemMap = new Map(); // vendorId -> Set of available items
  
  for (const item of items) {
    if (!item.name) continue;
    
    const vendors = await searchItemAcrossVendors(item.name);
    
    if (vendors.length === 0) {
      return {
        status: "error",
        response_type: "item_not_found",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: `Sorry, I couldn't find "${item.name}" at any vendor.`
      };
    }
    
    // Track which vendors have this item
    for (const v of vendors) {
      if (!vendorItemMap.has(v.vendor_id)) {
        vendorItemMap.set(v.vendor_id, { name: v.vendor_name, items: new Set() });
      }
      vendorItemMap.get(v.vendor_id).items.add(item.name);
    }
  }

  
  // Find vendors that have all requested items
  const itemCount = items.filter(i => i.name).length;
  const validVendors = Array.from(vendorItemMap.entries())
    .filter(([_, data]) => data.items.size === itemCount)
    .map(([id, data]) => data.name);
  
  if (validVendors.length === 0) {
    const itemNames = items.map(i => i.name).join(', ');
    return {
      status: "error",
      response_type: "item_not_found",
      customer_id: customerId,
      timestamp: new Date().toISOString(),
      message: `Sorry, no single vendor has all items: ${itemNames}.\nPlease order from one vendor at a time.`
    };
  }
  
  const vendorList = validVendors.map((v, i) => `${i + 1}. ${v}`).join('\n');
  const itemNames = items.map(i => i.name).join(', ');
  
  return {
    status: "success",
    response_type: "vendor_selection",
    customer_id: customerId,
    timestamp: new Date().toISOString(),
    message: `Found "${itemNames}" at:\n\n${vendorList}\n\nWhich vendor you wan order from?`
  };
}

  // Case 3: Complete order - validate
  if (vendor && items.length > 0) {
    const vendorData = await getVendorByName(vendor);
    if (!vendorData) {
      return {
        status: "error",
        response_type: "vendor_not_found",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: `Sorry, "${vendor}" not found.`
      };
    }

    // Check if order has only add-ons
      const onlyAddOns = await hasOnlyAddOns(vendorData.id, items);
      if (onlyAddOns) {
        return {
          status: "error",
          response_type: "validation_error",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message: "❌ You can't order only add-ons (egg, sausage, etc).\nPlease add a main item to your order."
        };
      }

    // Check for mixed types
    const mixedTypes = await hasMixedTypes(vendorData.id, items);
    if (mixedTypes) {
      return {
        status: "error",
        response_type: "validation_error",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: "❌ You can't mix pack items with per-price/per-piece items.\nPlease place separate orders."
      };
    }

    // Validate each item
    const validationErrors = [];
    for (const item of items) {
      const validation = await validateOrderItem(
        vendorData.id,
        item.name,
        item.quantity_type,
        item.price
      );
      if (!validation.valid) {
        validationErrors.push(validation.error);
      }
    }

    if (validationErrors.length > 0) {
      return {
        status: "error",
        response_type: "validation_error",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: `❌ Order validation failed:\n\n${validationErrors.join('\n')}`
      };
    }


      // Ask for delivery/pickup if not specified
      if (!delivery_location) {
        const itemsList = items.map(i => 
          `${i.quantity_type === 'per_price' ? '₦' + i.price : i.quantity + 'x'} ${i.name}`
        ).join(', ');
        
        return {
          status: "pending",
          response_type: "delivery_prompt",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message: `Order: ${itemsList} from ${vendorData.name}\n\n📍 Pickup or Delivery?`,
          data: {
            pending_order: orderSummary,
            buttons: [
              { id: "pickup", title: "🏃 Pickup" },
              { id: "delivery", title: "🚴 Delivery" }
            ]
          }
        };
      }

      // Complete order confirmation
      const itemsList = items.map(i => 
        `${i.quantity_type === 'per_price' ? '₦' + i.price : i.quantity + 'x'} ${i.name}`
      ).join(', ');
      
      return {
        status: "success",
        response_type: "order_confirmation",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: `🟡 Order Placed\nGot it! Your order has been received 🧾\n\nItems: ${itemsList}\nVendor: ${vendorData.name}\nDelivery: ${delivery_location}\n\nWe'll confirm with the restaurant shortly.`,
        data: {
          order_summary: orderSummary,
          vendor_id: vendorData.id,
          payment_required: true
        }
      };
    }

    // Fallback
    return {
      status: "success",
      response_type: "order_format",
      customer_id: customerId,
      timestamp: new Date().toISOString(),
      message: "Got an order? Say less 😌\nFormat:\n\n₦800 jollof rice from African Kitchen delivered to my hostel"
    };
  },

  "Re-ordering": async (customerId, message) => ({
    status: "success",
    response_type: "reorder",
    customer_id: customerId,
    timestamp: new Date().toISOString(),
    message: "You wan run it back? 😋\nNo wahala — you fit reorder your last meal in one tap.\nTap 'Reorder' below to bring back your previous order 👇🏾",
    data: {
      buttons: [{ id: "reorder_last", title: "🔁 Reorder" }]
    }
  }),

  "Find Restaurant": async (customerId, message) => ({
    status: "success",
    response_type: "menu",
    customer_id: customerId,
    timestamp: new Date().toISOString(),
    message: "🍽️ Here are the available restaurants on campus:\n\n1️⃣ Campus Café - Nigerian & Continental\n2️⃣ Mama's Kitchen - Local dishes\n3️⃣ Quick Bites - Fast food & snacks\n\nWhich one catches your eye? 👀"
  }),

  "Track Order": async (customerId, message) => ({
    status: "success",
    response_type: "order_tracking",
    customer_id: customerId,
    timestamp: new Date().toISOString(),
    message: "🔵 Out for Delivery\nYour order is on its way! 🚴♂️💨\nRider just picked it up — you can expect delivery in about 7-10 mins."
  }),

  "Cancel Order": async (customerId, message) => ({
    status: "success",
    response_type: "order_management",
    customer_id: customerId,
    timestamp: new Date().toISOString(),
    message: "🕒 Got it! You're still within the 2 min 30 sec grace window, so your order can be canceled 👌🏽\nWant me to go ahead and cancel it?",
    data: {
      buttons: [
        { id: "confirm_cancel", title: "Yes, Cancel" },
        { id: "keep_order", title: "Keep Order" }
      ]
    }
  }),

  "Modify Order": async (customerId, message) => ({
    status: "success",
    response_type: "order_management",
    customer_id: customerId,
    timestamp: new Date().toISOString(),
    message: "✏️ Sure thing! You're still within your 2 min 30 sec grace window, so we can make changes to your order\nJust tell me what you'd like to update, maybe the meal, how much, or delivery spot?"
  }),

  "View Order History": async (customerId, message) => ({
    status: "success",
    response_type: "order_history",
    customer_id: customerId,
    timestamp: new Date().toISOString(),
    message: "🧾 Reorder (For Multiple Past Orders)\nYou get a few past orders 👀\nWhich one you wan run back?\nPick from your last orders below 👇🏾\n\n1️⃣ 2 packs jollof rice - ₦1,400\n2️⃣ Shawarma + Coke - ₦2,000\n3️⃣ Meat pie + juice - ₦1,200\n\nType the number or name of the order you wan repeat (e.g., '1' or 'jollof rice') 🍽️"
  }),



  "Manage Account": async (customerId, message) => ({
    status: "success",
    response_type: "wallet_info",
    customer_id: customerId,
    timestamp: new Date().toISOString(),
    message: "💳 Here are your wallet details 👇\nAccount Name: Downtown Wallet\nAccount Number: 9082 XXXX 372\nBank: Moniepoint\n\n💡 You can send money directly here to top up your Downtown balance.",
    data: {
      buttons: [{ id: "copy_account", title: "Copy Account Number" }]
    }
  }),

  "View Balance": async (customerId, message) => ({
    status: "success",
    response_type: "wallet_balance",
    customer_id: customerId,
    timestamp: new Date().toISOString(),
    message: "💰 Your Downtown wallet balance is ₦2,500\nYou can use it for orders, tips, or quick re-ups — anytime."
  }),

  "Update Name": async (customerId, message) => ({
    status: "success",
    response_type: "account_management",
    customer_id: customerId,
    timestamp: new Date().toISOString(),
    message: "✏️ To update your name, please provide your new name.",
    data: {
      required_info: ["new_name"]
    }
  }),

  "View Account Details": async (customerId, message) => ({
    status: "success",
    response_type: "account_management",
    customer_id: customerId,
    timestamp: new Date().toISOString(),
    message: "📋 Here are your account details:\n\nAccount Name: Downtown Wallet\nAccount Number: 9082 XXXX 372\nBank: Moniepoint"
  }),

  

  "Fund Wallet": async (customerId, message) => ({
    status: "success",
    response_type: "wallet_funding",
    customer_id: customerId,
    timestamp: new Date().toISOString(),
    message: "💸 To fund your Downtown wallet, simply transfer money to the account below:\n\nAccount Name: Downtown Wallet\nAccount Number: 9082 XXXX 372\nBank: Moniepoint\n\nOnce done, just send me a quick message with the amount funded and I'll update your balance right away!"
  }),

  "Unknown": async (customerId, message) => {
    // Check if it looks like a food order attempt
    const foodKeywords = ['order', 'food', 'rice', 'chicken', 'from', 'delivered', 'buy'];
    const hasOrderKeywords = foodKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
    
    if (hasOrderKeywords) {
      return {
        status: "success",
        response_type: "order_format",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: "Got an order? Say less 😌\nJust drop it in this format so we can process it fast 👇🏾\n\n*Example:*\njollof rice - ₦1,400, 1 meat 1 egg from African Kitchen delivered to my hostel(location)\n\nMake sure to include the 👇🏾\n• Item name + quantity you want\n• Specify the vendor you're buying from\n• Specify the location the food is delivered to"
      };
    }
    
    return {
      status: "error",
      response_type: "fallback",
      customer_id: customerId,
      timestamp: new Date().toISOString(),
      message: "I'm here to help with food orders, and account management. Could you please rephrase your request or let me know which service you need? 🤔"
    };
  }
};

export async function handleIntent(intent, customerId, message, orderSummary = null) {
  const handler = intentHandlers[intent];
  if (handler) {
    return await handler(customerId, message, orderSummary);
  } else {
    return await intentHandlers["Unknown"](customerId, message);
  }
}