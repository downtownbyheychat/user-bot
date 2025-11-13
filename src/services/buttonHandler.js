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
      // Get all available vendors
      const { getAllVendors } = await import('../db/Utils/vendor.js');
      const vendors = await getAllVendors();
      
      // Create list template data
      const vendorList = vendors.map((vendor, index) => ({
        id: `vendor_${vendor.id}`,
        title: vendor.name,
        description: vendor.description || 'Popular local vendor'
      }));
      
      return {
        status: "success",
        message: "🍽️ Available Restaurants:",
        data: {
          list: {
            header: "Available Restaurants",
            button: "View Restaurants",
            sections: [
              {
                title: "Campus Vendors",
                rows: vendorList
              }
            ]
          }
        }
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
      // For demonstration, we'll use a dummy order ID
      // In a real implementation, you would extract the order ID from the context
      const orderId = `ORD${Date.now()}`;
      
      const { cancelOrder } = await import('./orderCancellationService.js');
      const cancellationResult = cancelOrder(orderId);
      
      if (cancellationResult.success) {
        return {
          status: "success",
          message: "✅ Done! Your order's been canceled successfully.\nRefund (if paid online) will be processed within 24 hours 💸\nWanna try placing a new one?",
          data: {
            order_cancelled: true
          }
        };
      } else {
        return {
          status: "error",
          message: `❌ Failed to cancel order: ${cancellationResult.reason}`
        };
      }

    case 'keep_order':
      return {
        status: "success",
        message: "👍 Great! Your order is still active.\nWe'll keep you updated on the progress."
      };

    case 'pickup':
      return {
        status: "success",
        message: "🏃 You've selected pickup.\nPlease proceed to the vendor to collect your order.\n\nYour order will be prepared shortly!",
        data: {
          delivery_location: "pickup"
        }
      };

    case 'delivery':
      return {
        status: "success",
        message: "🚴 You've selected delivery.\nDelivery fee of ₦200 will be added to your order.\n\nPlease provide your delivery address:",
        data: {
          awaiting_delivery_address: true
        }
      };

    case 'payment_sent':
      return {
        status: "success",
        message: "✅ Payment confirmed!\nYour order is now being processed.\nWe'll update you when it's ready."
      };

    case 'top_up_wallet':
      return {
        status: "success",
        message: "💸 To fund your Downtown wallet, simply transfer money to the account below:\n\nAccount Name: Downtown Wallet\nAccount Number: 9082 XXXX 372\nBank: Moniepoint\n\nOnce done, just send me a quick message with the amount funded and I'll update your balance right away!",
        data: {
          buttons: [
            { id: "copy_account", title: "Copy Account Number" }
          ]
        }
      };

    case 'retry_payment':
      return {
        status: "success",
        message: "🔄 Let's try the payment again.\nPlease follow the payment instructions.",
        data: {
          buttons: [
            { id: "copy_account", title: "Copy Account Number" },
            { id: "payment_sent", title: "Sent" }
          ]
        }
      };

    default:
      // Handle list selections (vendor selections)
      if (buttonId.startsWith('vendor_')) {
        const vendorId = buttonId.replace('vendor_', '');
        const { getVendorById } = await import('../db/Utils/vendor.js');
        const vendor = await getVendorById(vendorId);
        
        if (vendor) {
          const { getVendorCatalogue } = await import('../db/Utils/vendor.js');
          const catalogue = await getVendorCatalogue(vendorId);
          if (catalogue && catalogue.data && catalogue.data.list) {
            // Return list template
            return {
              status: "success",
              message: catalogue.message,
              data: {
                list: catalogue.data.list
              }
            };
          } else {
            // Return simple text message
            return {
              status: "success",
              message: catalogue || `🍽️ ${vendor.name} Menu is currently unavailable.`
            };
          }
        }
      }
      
      return {
        status: "error",
        message: "🤔 I didn't understand that action. Please try again."
      };
  }
}