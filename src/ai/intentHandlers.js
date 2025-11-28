import { getUserName } from "../db/Utils/users.js";
import { getVendorByName, searchItemAcrossVendors, getVendorCatalogue, getVendorMenuItems, validateOrderItem, hasSwallowWithoutSoup, hasOnlyFreeSoup, getAllVendors, checkVendorStatus } from "../db/Utils/vendor.js";


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
        message: `Sup ${userName || "{name}"}! \nWelcome back to Downtown, where you chat, order, and eat. Fast.`,
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
    message: " Can't say much about that one right now, But you can vibe with us on downtown.ng or join The Hashtag WhatsApp Channel, we drop daily updates there!\n\n Link to join: https://whatsapp.com/channel/0029Vb73OpaLtOjL2pM98O34"
}),



  "Customer Service": async (customerId, message) => ({
    status: "success",
    response_type: "customer_service",
    customer_id: customerId,
    timestamp: new Date().toISOString(),
    message: "Oops  sounds like you need a hand!\nOur support team's got you, just send a quick mail to help@downtown.ng and someone will get back to you fast "
  }),


  "Food Ordering": async (customerId, message, orderSummary) => {
  if (!orderSummary) {
    return {
      status: "success",
      response_type: "order_format",
      customer_id: customerId,
      timestamp: new Date().toISOString(),
      message: "Got an order? Say less \nJust drop it in this format so we can process it fast \n\n*Example:*\njollof rice - ₦1,400, 1 meat 1 egg from African Kitchen delivered to my hostel(location)\n\nMake sure to include the \n• Item name + quantity you want\n• Specify the vendor you're buying from\n• Specify the location the food is delivered to"
    };
  }

  const { vendor, items, delivery_location } = orderSummary;

  // Case 1: Vendor only, no items
  if (vendor && items.length === 0) {
    const vendorStatus = await checkVendorStatus(vendor);
    
    if (!vendorStatus) {
      const alternatives = await getAllVendors();
      
      if (alternatives.length > 10) {
        const altList = alternatives.map((v, i) => `${i + 1}. ${v.name}`).join('\n');
        return {
          status: "error",
          response_type: "vendor_not_found",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message: `Sorry, "${vendor}" is not in our system.\n\n Available Restaurants:\n\n${altList}`
        };
      }
      
      return {
        status: "error",
        response_type: "vendor_not_found",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: `Sorry, "${vendor}" is not in our system. Try these instead:`,
        data: {
          list: {
            header: "Available Restaurants",
            body: "Select a restaurant to view their menu:",
            button: "View Restaurants",
            sections: [{
              title: "Restaurants",
              rows: alternatives.map(v => ({
                id: `vendor_${v.id}`,
                title: v.name.substring(0, 24),
                description: (v.description || "View menu").substring(0, 72)
              }))
            }]
          }
        }
      };
    }
    
    if (vendorStatus.status !== 'active') {
      const alternatives = await getAllVendors();
      
      if (alternatives.length > 10) {
        const altList = alternatives.map((v, i) => `${i + 1}. ${v.name}`).join('\n');
        return {
          status: "error",
          response_type: "vendor_closed",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message: `Sorry, ${vendorStatus.name} is currently closed.\n\n Available Now:\n\n${altList}`
        };
      }
      
      return {
        status: "error",
        response_type: "vendor_closed",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: `Sorry, ${vendorStatus.name} is currently closed. Try these instead:`,
        data: {
          list: {
            header: "Available Now",
            body: `Sorry, ${vendorStatus.name} is currently closed. Try these instead:`,
            button: "View Restaurants",
            sections: [{
              title: "Open Restaurants",
              rows: alternatives.map(v => ({
                id: `vendor_${v.id}`,
                title: v.name.substring(0, 24),
                description: (v.description || "View menu").substring(0, 72)
              }))
            }]
          }
        }
      };
    }
    
    const vendorData = await getVendorByName(vendor);
    
    const menuItems = await getVendorMenuItems(vendorData.id);
    
    if (menuItems.length === 0) {
        const alternatives = await getAllVendors();
        if (alternatives.length > 10) {
            const altList = alternatives.map((v, i) => `${i + 1}. ${v.name}`).join('\n');
            return {
                status: "error",
                response_type: "vendor_catalogue",
                customer_id: customerId,
                timestamp: new Date().toISOString(),
                message: `${vendorData.name} has no menu items available at the moment.\n\n Available Restaurants:\n\n${altList}`
            };
        }
        return {
            status: "error",
            response_type: "vendor_catalogue",
            customer_id: customerId,
            timestamp: new Date().toISOString(),
            message: `${vendorData.name} has no menu items available at the moment. Try these instead:`,
            data: {
                list: {
                    header: "Available Restaurants",
                    body: "Select a restaurant to view their menu:",
                    button: "View Restaurants",
                    sections: [{
                        title: "Restaurants",
                        rows: alternatives.map(v => ({
                            id: `vendor_${v.id}`,
                            title: v.name.substring(0, 24),
                            description: (v.description || "View menu").substring(0, 72)
                        }))
                    }]
                }
            }
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
        message: ` ${vendorData.name} Menu:\n\n${menuList}\n\nJust tell me what you'd like to order!`
      };
    }

    return {
      status: "success",
      response_type: "vendor_catalogue",
      customer_id: customerId,
      timestamp: new Date().toISOString(),
      message: `Here's the menu for ${vendorData.name}:`,
      data: {
        list: {
          header: `${vendorData.name} Menu`.substring(0, 60),
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
    .map(([id, data]) => ({ id, name: data.name }));
  
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
  
  const itemNames = items.map(i => i.name).join(', ');
  
  // Save items to failed order so vendor selection can process them
  const { setFailedOrder } = await import('../services/sessionManager.js');
  setFailedOrder(customerId, {
    items,
    delivery_location,
    errorType: 'no_vendor'
  });

  if (validVendors.length <= 10) {
    return {
      status: "success",
      response_type: "vendor_selection",
      customer_id: customerId,
      timestamp: new Date().toISOString(),
      message: `Select a vendor to order "${itemNames}" from:`,
      data: {
        list: {
          header: "Available Vendors",
          body: `Found "${itemNames}" at these vendors:`,
          button: "Select Vendor",
          sections: [{
            title: "Vendors",
            rows: validVendors.map(v => ({
              id: `vendor_${v.id}`,
              title: v.name.substring(0, 24),
              description: `Order from ${v.name}`.substring(0, 72)
            }))
          }]
        }
      }
    };
  }

  const vendorList = validVendors.map((v, i) => `${i + 1}. ${v.name}`).join('\n');
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
    const vendorStatus = await checkVendorStatus(vendor);
    
    if (!vendorStatus) {
      const alternatives = await getAllVendors();
      
      if (alternatives.length > 10) {
        const altList = alternatives.map((v, i) => `${i + 1}. ${v.name}`).join('\n');
        return {
          status: "error",
          response_type: "vendor_not_found",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message: `Sorry, "${vendor}" is not in our system.\n\n Available Restaurants:\n\n${altList}`
        };
      }
      
      return {
        status: "error",
        response_type: "vendor_not_found",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: `Sorry, "${vendor}" is not in our system. Try these instead:`,
        data: {
          list: {
            header: "Available Restaurants",
            body: "Select a restaurant to view their menu:",
            button: "View Restaurants",
            sections: [{
              title: "Restaurants",
              rows: alternatives.map(v => ({
                id: `vendor_${v.id}`,
                title: v.name.substring(0, 24),
                description: (v.description || "View menu").substring(0, 72)
              }))
            }]
          }
        }
      };
    }
    
    if (vendorStatus.status !== 'active') {
      const alternatives = await getAllVendors();
      
      if (alternatives.length > 10) {
        const altList = alternatives.map((v, i) => `${i + 1}. ${v.name}`).join('\n');
        return {
          status: "error",
          response_type: "vendor_closed",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message: `Sorry, ${vendorStatus.name} is currently closed.\n\n Available Now:\n\n${altList}`
        };
      }
      
      return {
        status: "error",
        response_type: "vendor_closed",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: `Sorry, ${vendorStatus.name} is currently closed. Try these instead:`,
        data: {
          list: {
            header: "Available Now",
            body: "Select a restaurant to order from:",
            button: "View Restaurants",
            sections: [{
              title: "Open Restaurants",
              rows: alternatives.map(v => ({
                id: `vendor_${v.id}`,
                title: v.name.substring(0, 24),
                description: (v.description || "View menu").substring(0, 72)
              }))
            }]
          }
        }
      };
    }
    
    const vendorData = await getVendorByName(vendor);

    // Check if swallow is ordered without soup
    const swallowWithoutSoup = await hasSwallowWithoutSoup(vendorData.id, items);
    if (swallowWithoutSoup) {
      const { setFailedOrder } = await import('../services/sessionManager.js');
      setFailedOrder(customerId, {
        validatedItems: [],
        failedItems: items.map(i => i.name),
        vendor: vendorData.name,
        vendorId: vendorData.id,
        delivery_location,
        errorType: 'swallow_without_soup',
        originalItems: items
      });
      return {
        status: "error",
        response_type: "validation_error",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: " You can't order swallow without soup.\n\n Reply with a soup to add, or type 'cancel' to start over."
      };
    }

    // Check if order has only free soup
    const onlyFreeSoup = await hasOnlyFreeSoup(vendorData.id, items);
    if (onlyFreeSoup) {
      const { setFailedOrder } = await import('../services/sessionManager.js');
      setFailedOrder(customerId, {
        validatedItems: [],
        failedItems: items.map(i => i.name),
        vendor: vendorData.name,
        vendorId: vendorData.id,
        delivery_location,
        errorType: 'only_free_soup',
        originalItems: items
      });
      return {
        status: "error",
        response_type: "validation_error",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: " You can't order only free soup. Please add swallow to your order.\n\n Reply with items to add, or type 'cancel' to start over."
      };
    }

    // Validate each item and update prices from database
    const validationErrors = [];
    const validatedItems = [];
    const failedItems = [];
    let hasItemNotFoundAnywhere = false;
    
    for (const item of items) {
      const validation = await validateOrderItem(
        vendorData.id,
        item.name,
        item.quantity_type,
        item.price,
        item.quantity
      );
      
      if (!validation.valid) {
        validationErrors.push(validation.error);
        failedItems.push(item.name);
        if (validation.notFoundAnywhere) {
          hasItemNotFoundAnywhere = true;
        }
      } else {
        // Store validated item with database price
        validatedItems.push({
          ...item,
          price: validation.item.price,
          dbName: validation.item.food_name
        });
      }
    }

    if (validationErrors.length > 0 && hasItemNotFoundAnywhere) {
      const menuItems = await getVendorMenuItems(vendorData.id);
      
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
          status: "error",
          response_type: "validation_error",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message: ` ${validationErrors.join('\n')}\n\n ${vendorData.name} Menu:\n\n${menuList}\n\nJust tell me what you'd like to order!`
        };
      }
      
      return {
        status: "error",
        response_type: "validation_error",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: ` ${validationErrors.join('\n')}\n\nHere's what ${vendorData.name} has:`,
        data: {
          list: {
            header: `${vendorData.name} Menu`.substring(0, 60),
            body: "Select an item to order:",
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
    
    if (validationErrors.length > 0) {
      const { setFailedOrder } = await import('../services/sessionManager.js');
      
      // Check if any validation has alternative vendors
      let alternativeVendors = [];
      for (const item of items) {
        const validation = await validateOrderItem(
          vendorData.id,
          item.name,
          item.quantity_type,
          item.price,
          item.quantity
        );
        if (validation.alternativeVendors) {
          alternativeVendors = validation.alternativeVendors;
          break;
        }
      }
      
      setFailedOrder(customerId, {
        validatedItems,
        failedItems,
        vendor: vendorData.name,
        vendorId: vendorData.id,
        delivery_location,
        errorType: alternativeVendors.length > 0 ? 'item_at_other_vendor' : 'validation_failed',
        originalItems: items
      });
      
      // If alternative vendors exist and <= 10, use list format
      if (alternativeVendors.length > 0 && alternativeVendors.length <= 10) {
        setFailedOrder(customerId, {
          validatedItems,
          failedItems,
          vendor: vendorData.name,
          vendorId: vendorData.id,
          delivery_location,
          errorType: 'item_at_other_vendor',
          originalItems: items
        });
        
        return {
          status: "error",
          response_type: "validation_error",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message: ` ${validationErrors.join('\n')}\n\nSelect a vendor to order from:`,
          data: {
            list: {
              header: "Available Vendors",
              body: "These vendors have the item:",
              button: "Select Vendor",
              sections: [{
                title: "Vendors",
                rows: alternativeVendors.map((v, idx) => ({
                  id: `vendor_${v.vendor_id}_${idx}`,
                  title: v.vendor_name.substring(0, 24),
                  description: v.food_name.substring(0, 72)
                }))
              }]
            }
          }
        };
      }
      
      // If > 10, use text format
      if (alternativeVendors.length > 10) {
        const vendorList = alternativeVendors.map((v, i) => `${i + 1}. ${v.vendor_name} (${v.food_name})`).join('\n');
        return {
          status: "error",
          response_type: "validation_error",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message: ` ${validationErrors.join('\n')}\n\nYou can find it at:\n\n${vendorList}\n\n Reply with corrected items only, or type 'cancel' to start over.`
        };
      }
      
      // Show 3 action buttons for partial validation
      if (validatedItems.length > 0) {
        return {
          status: "error",
          response_type: "validation_error",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message: ` Order validation failed:\n\n${validationErrors.join('\n')}\n\nWhat would you like to do?`,
          data: {
            buttons: [
              { id: "proceed_without_invalid", title: " Proceed Without" },
              { id: "modify_order", title: " Modify Order" },
              { id: "cancel_order", title: " Cancel" }
            ]
          }
        };
      }
      
      return {
        status: "error",
        response_type: "validation_error",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: ` Order validation failed:\n\n${validationErrors.join('\n')}\n\nWhat would you like to do?`,
        data: {
          buttons: [
            { id: "show_corrections", title: "Show What to Correct" },
            { id: "cancel_order", title: "Cancel" }
          ]
        }
      };
    }

      // Clear any failed order state on success
      const { clearFailedOrder } = await import('../services/sessionManager.js');
      clearFailedOrder(customerId);
      
      const itemsList = validatedItems.map(i => {
        if (i.quantity_type === 'per_price') {
          return `${i.dbName || i.name} -- ₦${i.price}`;
        } else {
          return `${i.dbName || i.name} (x${i.quantity}) -- ₦${i.price}`;
        }
      }).join('\n');

      // Ask for delivery/pickup if not specified
      if (!delivery_location) {
        const { setPendingOrder } = await import('../services/sessionManager.js');
        setPendingOrder(customerId, { orderSummary: { ...orderSummary, items: validatedItems } });
        
        return {
          status: "pending",
          response_type: "delivery_prompt",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message: `Order: ${itemsList} from ${vendorData.name}\n\n Pickup or Delivery?`,
          data: {
            buttons: [
              { id: `pickup_${vendorData.id}`, title: " Pickup" },
              { id: `delivery_${vendorData.id}`, title: " Delivery" }
            ]
          }
        };
      }

      // Push validated order to stack
      const { pushOrderPack, getStackSummary } = await import('../services/orderStack.js');
      
      const packTotal = validatedItems.reduce((sum, item) => {
        return sum + parseFloat(item.price);
      }, 0);
      
      // Update items to use database names
      const itemsWithDbNames = validatedItems.map(i => ({
        ...i,
        name: i.dbName || i.name
      }));
      
      pushOrderPack(customerId, {
        items: itemsWithDbNames,
        vendor: vendorData.name,
        vendorId: vendorData.id,
        delivery_location,
        total: packTotal
      });
      
      const stackSummary = getStackSummary(customerId);

      return {
        status: "success",
        response_type: "order_summary",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: ` Pack Added to Cart\n\nItems:\n${itemsList}\n\nPack Total: ₦${packTotal}\nVendor: ${vendorData.name}\nDelivery: ${delivery_location}\n\nTotal Packs: ${stackSummary.packCount}\n\nWhat would you like to do next?`,
        data: {
          buttons: [
            { id: "proceed_payment", title: " Proceed to Payment" },
            { id: "add_new_pack", title: " Add New Pack" },
            { id: "cancel_order", title: " Cancel Order" }
          ]
        }
      };
    }

    // Fallback
    return {
      status: "success",
      response_type: "order_format",
      customer_id: customerId,
      timestamp: new Date().toISOString(),
      message: "Got an order? Say less \nJust drop it in this format so we can process it fast \n\n*Example:*\njollof rice - ₦1,400, 1 meat 1 egg from African Kitchen delivered to my hostel(location)\n\nMake sure to include the \n• Item name + quantity you want\n• Specify the vendor you're buying from\n• Specify the location the food is delivered to"
    };
  },

  "Re-ordering": async (customerId, message) => ({
    status: "success",
    response_type: "reorder",
    customer_id: customerId,
    timestamp: new Date().toISOString(),
    message: "You wan run it back? \nNo wahala — you fit reorder your last meal in one tap.\nTap 'Reorder' below to bring back your previous order ",
    data: {
      buttons: [{ id: "reorder_last", title: " Reorder" }]
    }
  }),

  "Find Restaurant": async (customerId, message) => {
    const vendors = await getAllVendors();
    
    if (vendors.length === 0) {
      return {
        status: "error",
        response_type: "menu",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: "Sorry, no restaurants are available at the moment."
      };
    }

    if (vendors.length > 10) {
      const vendorList = vendors.map((v, i) => `${i + 1}. ${v.name}`).join('\n');
      return {
        status: "success",
        response_type: "menu",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: ` Available Restaurants:\n\n${vendorList}\n\nJust mention the restaurant name to view their menu!`
      };
    }

    return {
      status: "success",
      response_type: "menu",
      customer_id: customerId,
      timestamp: new Date().toISOString(),
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
  },

  "Track Order": async (customerId, message) => ({
    status: "success",
    response_type: "order_tracking",
    customer_id: customerId,
    timestamp: new Date().toISOString(),
    message: " Out for Delivery\nYour order is on its way! \nRider just picked it up — you can expect delivery in about 7-10 mins."
  }),

  "Cancel Order": async (customerId, message) => ({
    status: "success",
    response_type: "order_management",
    customer_id: customerId,
    timestamp: new Date().toISOString(),
    message: " Got it! You're still within the 2 min 30 sec grace window, so your order can be canceled \nWant me to go ahead and cancel it?",
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
    message: " Sure thing! You're still within your 2 min 30 sec grace window, so we can make changes to your order\nJust tell me what you'd like to update, maybe the meal, how much, or delivery spot?"
  }),

  "View Order History": async (customerId, message) => ({
    status: "success",
    response_type: "order_history",
    customer_id: customerId,
    timestamp: new Date().toISOString(),
    message: " Reorder (For Multiple Past Orders)\nYou get a few past orders \nWhich one you wan run back?\nPick from your last orders below \n\n1⃣ 2 packs jollof rice - ₦1,400\n2⃣ Shawarma + Coke - ₦2,000\n3⃣ Meat pie + juice - ₦1,200\n\nType the number or name of the order you wan repeat (e.g., '1' or 'jollof rice') "
  }),



  "Manage Account": async (customerId, message) => ({
    status: "success",
    response_type: "wallet_info",
    customer_id: customerId,
    timestamp: new Date().toISOString(),
    message: " Here are your wallet details \nAccount Name: Downtown Wallet\nAccount Number: 9082 XXXX 372\nBank: Moniepoint\n\n You can send money directly here to top up your Downtown balance."
  }),

  "View Balance": async (customerId, message) => ({
    status: "success",
    response_type: "wallet_balance",
    customer_id: customerId,
    timestamp: new Date().toISOString(),
    message: " Your Downtown wallet balance is ₦2,500\nYou can use it for orders, tips, or quick re-ups — anytime."
  }),

  "Update Name": async (customerId, message) => ({
    status: "success",
    response_type: "account_management",
    customer_id: customerId,
    timestamp: new Date().toISOString(),
    message: " To update your name, please provide your new name.",
    data: {
      required_info: ["new_name"]
    }
  }),

  "View Account Details": async (customerId, message) => ({
    status: "success",
    response_type: "account_management",
    customer_id: customerId,
    timestamp: new Date().toISOString(),
    message: " Here are your account details:\n\nAccount Name: Downtown Wallet\nAccount Number: 9082 XXXX 372\nBank: Moniepoint"
  }),

  

  "Fund Wallet": async (customerId, message) => ({
    status: "success",
    response_type: "wallet_funding",
    customer_id: customerId,
    timestamp: new Date().toISOString(),
    message: " To fund your Downtown wallet, simply transfer money to the account below:\n\nAccount Name: Downtown Wallet\nAccount Number: 9082 XXXX 372\nBank: Moniepoint\n\nOnce done, just send me a quick message with the amount funded and I'll update your balance right away!"
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
        message: "Got an order? Say less \nJust drop it in this format so we can process it fast \n\n*Example:*\njollof rice - ₦1,400, 1 meat 1 egg from African Kitchen delivered to my hostel(location)\n\nMake sure to include the \n• Item name + quantity you want\n• Specify the vendor you're buying from\n• Specify the location the food is delivered to"
      };
    }
    
    return {
      status: "error",
      response_type: "fallback",
      customer_id: customerId,
      timestamp: new Date().toISOString(),
      message: "I'm here to help with food orders, and account management. Could you please rephrase your request or let me know which service you need? "
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