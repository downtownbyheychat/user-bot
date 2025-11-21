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
        const vendorId = parseInt(parts[2]);
        const page = parseInt(parts[3]);
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
        const menuItemId = parseInt(buttonId.split('_')[1]);
        
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

      // Handle vendor selection from restaurant list
      if (buttonId.startsWith('vendor_')) {
        console.log('🏪 Handling vendor selection:', buttonId);
        const vendorId = parseInt(buttonId.split('_')[1]);
        
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