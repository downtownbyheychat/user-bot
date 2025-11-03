import { getUserName } from "../db/Utils/users.js";

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
    // Check if order has proper format
    const hasValidOrder = orderSummary?.items?.length > 0 && 
                         orderSummary?.delivery_location && 
                         message.toLowerCase().includes('from');
    
    if (hasValidOrder) {
      const itemsList = orderSummary.items.map(item => 
        `${item.quantity}x ${item.name}${item.special_requests ? ` (${item.special_requests})` : ''}`
      ).join(', ');
      
      return {
        status: "success",
        response_type: "order_confirmation",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: `🟡 Order Placed\nGot it! Your order has been received 🧾\nWe'll confirm with the restaurant and update you shortly.\n\nItems: ${itemsList}`,
        data: {
          order_summary: orderSummary,
          payment_required: true
        }
      };
    } else {
      return {
        status: "success",
        response_type: "order_format",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: "Got an order? Say less 😌\nJust drop it in this format so we can process it fast 👇🏾\n\n*Example:*\njollof rice - ₦1,400, 1 meat 1 egg from African Kitchen delivered to my hostel(location)\n\nMake sure to include the 👇🏾\n• Item name + quantity you want\n• Specify the vendor you're buying from\n• Specify the location the food is delivered to"
      };
    }
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