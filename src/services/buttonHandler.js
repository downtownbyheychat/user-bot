export async function handleButtonClick(buttonId, customerId) {
  switch (buttonId) {
    case 'visit_website':
      return {
        status: "success",
        message: "🌐 Redirecting you to downtown.ng...",
        action: "open_url",
        url: "https://downtown.ng"
      };

    case 'join_channel':
      return {
        status: "success", 
        message: "📱 Opening WhatsApp channel...",
        action: "open_url",
        url: "https://whatsapp.com/channel/0029Vb73OpaLtOjL2pM98O34"
      };

    case 'chat_rep':
      return {
        status: "success",
        message: "👨‍💼 Connecting you to a live representative...\nPlease hold while we find someone to assist you.",
        action: "transfer_to_human"
      };

    case 'show_restaurants':
      return {
        status: "success",
        message: "🍽️ Available Restaurants:\n\n🏪 African Kitchen - Jollof, Rice & Stew\n🏪 Campus Café - Burgers & Snacks  \n🏪 Mama's Place - Local dishes\n🏪 Quick Bites - Fast food\n\nJust mention the restaurant name in your order!"
      };

    case 'reorder_last':
      return {
        status: "success",
        message: "🔁 Reordering your last meal:\n2x Jollof Rice + Chicken - ₦2,800\nDelivery to: Your usual spot\n\nConfirm this order?",
        data: {
          buttons: [
            { id: "confirm_reorder", title: "✅ Confirm" },
            { id: "cancel_reorder", title: "❌ Cancel" }
          ]
        }
      };

    case 'copy_account':
      return {
        status: "success",
        message: "📋 Account number copied!\n9082 XXXX 372\n\nYou can now paste it in your banking app to make payment."
      };

    case 'confirm_cancel':
      return {
        status: "success",
        message: "✅ Done! Your order's been canceled successfully.\nRefund (if paid online) will be processed within 24 hours 💸\nWanna try placing a new one?"
      };

    case 'keep_order':
      return {
        status: "success",
        message: "👍 Great! Your order is still active.\nWe'll keep you updated on the progress."
      };

    default:
      return {
        status: "error",
        message: "🤔 I didn't understand that action. Please try again."
      };
  }
}