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

    case 'view_restaurants':
      const { getAllVendors } = await import('../db/Utils/vendor.js');
      const vendors = await getAllVendors();
      
      if (vendors.length === 0) {
        return {
          status: "error",
          message: "Sorry, no restaurants are available at the moment."
        };
      }

      if (vendors.length > 10) {
        const vendorList = vendors.map((v, i) => `${i + 1}. ${v.name}`).join('\n');
        return {
          status: "success",
          message: `🍽️ Available Restaurants:\n\n${vendorList}\n\nJust mention the restaurant name to view their menu!`
        };
      }

      return {
        status: "success",
        message: "Select a restaurant to view their menu:",
        data: {
          list: {
            header: "Campus Restaurants",
            body: "Here are the available restaurants on campus:",
            button: "View Restaurants",
            sections: [{
              title: "Restaurants",
              rows: vendors.map(v => ({
                id: `vendor_${v.id}`,
                title: v.name.substring(0, 24),
                description: (v.description || "View menu").substring(0, 72)
              }))
            }]
          }
        }
      };

    case 'start_ordering':
      return {
        status: "success",
        message: "Got an order? Say less 😌\nJust drop it in this format so we can process it fast 👇🏾\n\n*Example:*\njollof rice - ₦1,400, 1 meat 1 egg from African Kitchen delivered to my hostel(location)\n\nMake sure to include the 👇🏾\n• Item name + quantity you want\n• Specify the vendor you're buying from\n• Specify the location the food is delivered to"
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

    case 'proceed_payment':
      const { getOrderStack } = await import('./orderStack.js');
      const orderStack = getOrderStack(customerId);
      
      if (orderStack.length === 0) {
        return {
          status: "error",
          message: "No orders in your cart. Please add items first."
        };
      }
      
      let orderDetails = '';
      let grandTotal = 0;
      
      orderStack.forEach((pack, i) => {
        const packItems = pack.items.map(item => {
          if (item.quantity_type === 'per_price') {
            return `  ${item.name} -- ₦${item.price}`;
          } else {
            return `  ${item.name} (x${item.quantity}) -- ₦${item.price * item.quantity}`;
          }
        }).join('\n');
        orderDetails += `\n\nPack ${i + 1} from ${pack.vendor}:\n${packItems}\nPack Total: ₦${pack.total}`;
        grandTotal += pack.total;
      });
      
      return {
        status: "success",
        response_type: "payment",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: `💳 Payment Details\n\nYour Order:${orderDetails}\n\n===================\nGrand Total: ₦${grandTotal}\n===================\n\nAccount Name: Downtown Wallet\nAccount Number: 9082 XXXX 372\nBank: Moniepoint\n\nClick below after payment:`,
        data: {
          buttons: [
            { id: "payment_sent", title: "✅ Payment Sent" }
          ]
        }
      };

    case 'add_new_pack':
      return {
        status: "success",
        response_type: "order_format",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: "Got an order? Say less 😌\nJust drop it in this format so we can process it fast 👇🏾\n\n*Example:*\njollof rice - ₦1,400, 1 meat 1 egg from African Kitchen delivered to my hostel(location)\n\nMake sure to include the 👇🏾\n• Item name + quantity you want\n• Specify the vendor you're buying from\n• Specify the location the food is delivered to"
      };

    case 'cancel_order':
      const { clearOrderStack: clearStack } = await import('./orderStack.js');
      clearStack(customerId);
      
      return {
        status: "success",
        response_type: "order_cancelled",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: "✅ Order Cancelled\nYour order has been cancelled successfully.\n\nReady to order again? Just drop your order in this format:\n\n*Example:*\njollof rice - ₦1,400, 1 meat 1 egg from African Kitchen delivered to my hostel(location)"
      };

    case 'payment_sent':
      const { getOrderStack: getStack, clearOrderStack } = await import('./orderStack.js');
      const stack = getStack(customerId);
      
      if (stack.length === 0) {
        return {
          status: "error",
          message: "No orders found. Please place an order first."
        };
      }
      
      let total = 0;
      const packs = stack.map((pack, index) => {
        total += pack.total;
        return {
          packNumber: index + 1,
          vendor: pack.vendor,
          deliveryLocation: pack.delivery_location,
          items: pack.items.map(item => ({
            name: item.name,
            quantity: item.quantity || 1,
            price: item.quantity_type === 'per_price' ? item.price : item.price
          })),
          total: pack.total
        };
      });
      
      const receiptData = {
        orderId: `ORD${Date.now()}`,
        packs: packs,
        amount: total,
        customerName: 'Customer'
      };
      
      // Generate receipt
      const { generateReceipt } = await import('./receiptGenerator.js');
      let receiptPath = null;
      try {
        const result = await generateReceipt(receiptData);
        receiptPath = result.filePath;
      } catch (err) {
        console.error('Receipt generation failed:', err);
      }
      
      clearOrderStack(customerId);
      
      return {
        status: "success",
        response_type: "payment_confirmed",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: `✅ Payment Confirmed!\n\nOrder ID: ${receiptData.orderId}\nTotal: ₦${total}\n\nWe'll confirm with the restaurant shortly!`,
        data: { receipt_path: receiptPath }
      };

    default:
      // Handle pickup button
      if (buttonId.startsWith('pickup_')) {
        const vendorId = buttonId.substring(7);
        const { getPendingOrder, clearPendingOrder } = await import('./sessionManager.js');
        const pendingOrder = getPendingOrder(customerId);
        
        if (!pendingOrder?.orderSummary) {
          return {
            status: "error",
            message: "No pending order found. Please place a new order."
          };
        }
        
        const { pushOrderPack, getStackSummary } = await import('./orderStack.js');
        const { getAllVendors } = await import('../db/Utils/vendor.js');
        const vendors = await getAllVendors();
        const vendor = vendors.find(v => v.id === vendorId);
        
        const packTotal = pendingOrder.orderSummary.items.reduce((sum, item) => {
          if (item.quantity_type === 'per_price') {
            return sum + parseFloat(item.price);
          } else {
            return sum + (parseFloat(item.price) * item.quantity);
          }
        }, 0);
        
        pushOrderPack(customerId, {
          items: pendingOrder.orderSummary.items,
          vendor: vendor?.name || 'Unknown',
          vendorId,
          delivery_location: 'Pickup',
          total: packTotal
        });
        
        clearPendingOrder(customerId);
        const stackSummary = getStackSummary(customerId);
        const itemsList = pendingOrder.orderSummary.items.map(i => {
          if (i.quantity_type === 'per_price') {
            return `${i.name} -- ₦${i.price}`;
          } else {
            return `${i.name} (x${i.quantity}) -- ₦${i.price * i.quantity}`;
          }
        }).join('\n');
        
        return {
          status: "success",
          response_type: "order_summary",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message: `📦 Pack Added to Cart\n\nItems:\n${itemsList}\n\nPack Total: ₦${packTotal}\nVendor: ${vendor?.name}\nPickup: You'll collect from restaurant\n\nTotal Packs: ${stackSummary.packCount}\n\nWhat would you like to do next?`,
          data: {
            buttons: [
              { id: "proceed_payment", title: "💳 Proceed to Payment" },
              { id: "add_new_pack", title: "➕ Add New Pack" },
              { id: "cancel_order", title: "❌ Cancel Order" }
            ]
          }
        };
      }

      // Handle delivery button
      if (buttonId.startsWith('delivery_')) {
        const vendorId = buttonId.substring(9);
        const { getPendingOrder, setPendingOrder } = await import('./sessionManager.js');
        const pendingOrder = getPendingOrder(customerId);
        
        if (!pendingOrder?.orderSummary) {
          return {
            status: "error",
            message: "No pending order found. Please place a new order."
          };
        }
        
        setPendingOrder(customerId, { 
          ...pendingOrder,
          vendorId, 
          awaitingAddress: true 
        });
        
        return {
          status: "pending",
          response_type: "address_prompt",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message: "📍 Where should we deliver your order?\n\nPlease provide your delivery address:"
        };
      }

      // Handle pagination for restaurants list
      if (buttonId.startsWith('restaurants_next_')) {
        console.log('🍴 Handling restaurants pagination:', buttonId);
        const page = parseInt(buttonId.split('_').pop());
        const { getAllVendors } = await import('../db/Utils/vendor.js');
        const vendors = await getAllVendors();
        
        const totalItems = vendors.length;
        const pageSize = totalItems > 10 ? 9 : 10;
        const totalPages = Math.ceil(totalItems / pageSize);
        const startIdx = (page - 1) * pageSize;
        const endIdx = startIdx + pageSize;
        const currentItems = vendors.slice(startIdx, endIdx);

        const rows = currentItems.map(v => ({
          id: `vendor_${v.id}`,
          title: v.name.substring(0, 24),
          description: (v.description || "View menu").substring(0, 72)
        }));

        if (page < totalPages) {
          rows.push({
            id: `restaurants_next_${page + 1}`,
            title: "Next Page →",
            description: `View page ${page + 1} of ${totalPages}`
          });
        }

        return {
          status: "success",
          response_type: "menu",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message: `Campus Restaurants (Page ${page}/${totalPages}):`,
          data: {
            list: {
              header: "Campus Restaurants",
              body: `Showing ${startIdx + 1}-${Math.min(endIdx, totalItems)} of ${totalItems} restaurants`,
              button: "View Restaurants",
              sections: [{ title: "Restaurants", rows }]
            }
          }
        };
      }

      // Handle pagination for vendor menu
      if (buttonId.startsWith('menu_next_')) {
        console.log('📝 Handling menu pagination:', buttonId);
        const parts = buttonId.split('_');
        const vendorId = parts.slice(2, -1).join('_');
        const page = parseInt(parts[parts.length - 1]);
        console.log('Parsed vendorId:', vendorId, 'page:', page);
        
        const { getVendorMenuItems, getVendorByName } = await import('../db/Utils/vendor.js');
        const menuItems = await getVendorMenuItems(vendorId);
        
        const totalItems = menuItems.length;
        const pageSize = totalItems > 10 ? 9 : 10;
        const totalPages = Math.ceil(totalItems / pageSize);
        const startIdx = (page - 1) * pageSize;
        const endIdx = startIdx + pageSize;
        const currentItems = menuItems.slice(startIdx, endIdx);

        const rows = currentItems.map(item => {
          let priceDesc = '';
          if (item.sale_quantity === 'per_price') {
            priceDesc = `from ₦${item.price}`;
          } else if (item.sale_quantity === 'per_piece') {
            priceDesc = `₦${item.price} each`;
          } else if (item.sale_quantity === 'full_pack') {
            priceDesc = `₦${item.price} (Full Pack)`;
          } else if (item.sale_quantity === 'half_pack') {
            priceDesc = `₦${item.price} (Half Pack)`;
          } else {
            priceDesc = `₦${item.price}`;
          }
          return {
            id: `menu_${item.id}`,
            title: item.food_name.substring(0, 24),
            description: priceDesc.substring(0, 72)
          };
        });

        if (page < totalPages) {
          rows.push({
            id: `menu_next_${vendorId}_${page + 1}`,
            title: "Next Page →",
            description: `View page ${page + 1} of ${totalPages}`
          });
        }

        // Get vendor name for the message
        const allVendors = await import('../db/Utils/vendor.js').then(m => m.getAllVendors());
        const vendor = allVendors.find(v => v.id === vendorId);
        const vendorName = vendor ? vendor.name : 'Vendor';

        return {
          status: "success",
          response_type: "vendor_catalogue",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message: `Here's the menu for ${vendorName} (Page ${page}/${totalPages}):`,
          data: {
            list: {
              header: `${vendorName} Menu`.substring(0, 60),
              body: `Showing ${startIdx + 1}-${Math.min(endIdx, totalItems)} of ${totalItems} items`,
              button: "View Items",
              sections: [{ title: "Menu Items", rows }]
            }
          }
        };
      }

      // Handle pagination for vendor selection
      if (buttonId.startsWith('vendor_select_next_')) {
        const page = parseInt(buttonId.split('_').pop());
        return {
          status: "success",
          message: "Please search for the items again to continue browsing vendors."
        };
      }

      // Handle menu item selection
      if (buttonId.startsWith('menu_') && !buttonId.includes('_next_')) {
        console.log('🍽️ Handling menu item selection:', buttonId);
        const menuItemId = buttonId.substring(5);
        
        const pool = (await import('../db/database.js')).default;
        const result = await pool.query(
          'SELECT m.*, v.name as vendor_name FROM menus m JOIN vendors v ON m.vendor_id = v.id WHERE m.id = $1',
          [menuItemId]
        );
        
        if (result.rows.length === 0) {
          return {
            status: "error",
            message: "Sorry, I couldn't find that menu item."
          };
        }
        
        const item = result.rows[0];
        let priceInfo = '';
        
        if (item.sale_quantity === 'per_price') {
          priceInfo = `from ₦${item.price}`;
        } else if (item.sale_quantity === 'per_piece') {
          priceInfo = `₦${item.price} each`;
        } else if (item.sale_quantity === 'full_pack') {
          priceInfo = `₦${item.price} (Full Pack)`;
        } else if (item.sale_quantity === 'half_pack') {
          priceInfo = `₦${item.price} (Half Pack)`;
        } else {
          priceInfo = `₦${item.price}`;
        }
        
        return {
          status: "success",
          message: `Great choice! 🍽️\n\n${item.food_name} - ${priceInfo}\nFrom: ${item.vendor_name}\n\nTo order, just say:\n"${item.food_name} from ${item.vendor_name} delivered to [your location]"`
        };
      }

      // Handle resend OTP button
      if (buttonId === 'resend_otp') {
        const { checkAndResendOTP } = await import('./userOnboarding.js');
        const result = await checkAndResendOTP(customerId);
        return {
          status: "success",
          message: result.message || '✅ A new OTP has been sent to your email.'
        };
      }

      // Handle vendor selection from restaurant list
      if (buttonId.startsWith('vendor_')) {
        console.log('🏪 Handling vendor selection:', buttonId);
        const vendorId = buttonId.substring(7);
        
        const { getVendorMenuItems, getAllVendors } = await import('../db/Utils/vendor.js');
        const allVendors = await getAllVendors();
        console.log('All vendors fetched:', allVendors.length);
        console.log('Vendor ID parsed:', vendorId);
        console.log('Vendor found:', allVendors.find(v => v.id === vendorId));
        const vendor = allVendors.find(v => v.id === vendorId);
        
        if (!vendor) {
          return {
            status: "error",
            message: "Sorry, I couldn't find that restaurant."
          };
        }
        
        // Check if user has failed order waiting for vendor selection
        const { getFailedOrder, clearFailedOrder } = await import('./sessionManager.js');
        const failedOrder = getFailedOrder(customerId);
        
        if (failedOrder?.errorType === 'no_vendor') {
          // User selected vendor for order without vendor specified
          const { handleIntent } = await import('../ai/intentHandlers.js');
          const mergedSummary = {
            vendor: vendor.name,
            items: failedOrder.items,
            delivery_location: failedOrder.delivery_location
          };
          
          clearFailedOrder(customerId);
          return await handleIntent('Food Ordering', customerId, '', mergedSummary);
        }
        
        // Normal vendor menu display
        const menuItems = await getVendorMenuItems(vendorId);
        
        if (menuItems.length === 0) {
          return {
            status: "error",
            message: `${vendor.name} has no menu items available at the moment.`
          };
        }

        if (menuItems.length > 10) {
          const menuList = menuItems.map((item, i) => {
            let priceDesc = '';
            if (item.sale_quantity === 'per_price') {
              priceDesc = `from ₦${item.price}`;
            } else if (item.sale_quantity === 'per_piece') {
              priceDesc = `₦${item.price} each`;
            } else if (item.sale_quantity === 'full_pack') {
              priceDesc = `₦${item.price} (Full Pack)`;
            } else if (item.sale_quantity === 'half_pack') {
              priceDesc = `₦${item.price} (Half Pack)`;
            } else {
              priceDesc = `₦${item.price}`;
            }
            return `${i + 1}. ${item.food_name} - ${priceDesc}`;
          }).join('\n');
          
          return {
            status: "success",
            response_type: "vendor_catalogue",
            customer_id: customerId,
            timestamp: new Date().toISOString(),
            message: `📋 ${vendor.name} Menu:\n\n${menuList}\n\nJust tell me what you'd like to order!`
          };
        }

        return {
          status: "success",
          response_type: "vendor_catalogue",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message: `Here's the menu for ${vendor.name}:`,
          data: {
            list: {
              header: `${vendor.name} Menu`.substring(0, 60),
              body: "Select an item to add to your order:",
              button: "View Items",
              sections: [{
                title: "Menu Items",
                rows: menuItems.map(item => {
                  let priceDesc = '';
                  if (item.sale_quantity === 'per_price') {
                    priceDesc = `from ₦${item.price}`;
                  } else if (item.sale_quantity === 'per_piece') {
                    priceDesc = `₦${item.price} each`;
                  } else if (item.sale_quantity === 'full_pack') {
                    priceDesc = `₦${item.price} (Full Pack)`;
                  } else if (item.sale_quantity === 'half_pack') {
                    priceDesc = `₦${item.price} (Half Pack)`;
                  } else {
                    priceDesc = `₦${item.price}`;
                  }
                  return {
                    id: `menu_${item.id}`,
                    title: item.food_name.substring(0, 24),
                    description: priceDesc.substring(0, 72)
                  };
                })
              }]
            }
          }
        };
      }
      
      return {
        status: "error",
        message: "🤔 I didn't understand that action. Please try again."
      };
  }
}