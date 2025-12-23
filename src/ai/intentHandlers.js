import { getUserName } from "../db/Utils/users.js";
import { getVendorByName, searchItemAcrossVendors, getVendorCatalogue, getVendorMenuItems, validateOrderItem, hasSwallowWithoutSoup, hasOnlyFreeSoup, getAllVendors, checkVendorStatus, getAvailableSoups } from "../db/Utils/vendor.js";
import { sendAfricanKitchenCatalog, sendAlphaCatalog, sendArenaCatalog, sendBestmanCatalog, sendChefMayoCatalog, sendExceedingGraceCatalog, sendFamotCatalog, sendReneesCatalog, sendRukamatCatalog, sendYomiceCatalog, sendTestvendor } from "../services/sendVendorCatalog.js";



export const intentHandlers = {
  "Greeting": async (customerId, message) => {
    try {
        const userName = await getUserName(customerId);
        const vendors = await getAllVendors();
        const greetingMessage = `Sup ${userName || ""}👋! \nDowntown is active. Select food shop`;
        
        // If more than 10 vendors, return multiple lists
        if (vendors.length > 10) {
          const lists = [];
          for (let i = 0; i < vendors.length; i += 10) {
            const chunk = vendors.slice(i, i + 10);
            const listNum = Math.floor(i / 10) + 1;
            lists.push({
              status: "success",
              response_type: "restaurant_list",
              customer_id: customerId,
              timestamp: new Date().toISOString(),
              message: listNum === 1 ? "Select a restaurant (Part 1):" : `More restaurants (Part ${listNum}):`,
              data: {
                list: {
                  header: `Restaurants ${listNum}`,
                  body: `Available restaurants on campus (${i + 1}-${i + chunk.length}):`,
                  button: "View Restaurants",
                  sections: [{
                    title: "Restaurants",
                    rows: chunk.map(v => ({
                      id: `vendor_${v.id}`,
                      title: v.name.substring(0, 24),
                      description: (v.description || "View menu").substring(0, 72)
                    }))
                  }]
                }
              }
            });
          }
          
          return {
            status: "success",
            response_type: "greeting",
            customer_id: customerId,
            timestamp: new Date().toISOString(),
            message: greetingMessage,
            multipleLists: lists
          };
        }
        
        // 10 or fewer vendors - single list
        const restaurantResponse = vendors.length > 0 ? {
          status: "success",
          response_type: "restaurant_list",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message: "Select a restaurant to get started:",
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
        } : null;
        
        return {
          status: "success",
          response_type: "greeting",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message: greetingMessage,
          additionalMessage: restaurantResponse
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
      message: "Got an order? Say less \nJust drop it in this format so we can process it fast \n\n*Example:*\njollof rice - ₦1,400, 1 beef 1 egg from African Kitchen delivered to my hostel(location)\n\nMake sure to include the \n• Item name + quantity you want\n• Specify the vendor you're buying from\n• Specify the location the food is delivered to"
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
    
    if (vendorStatus.status !== 'open') {
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

    if (menuItems.length) {

      console.log('sending from intent handler')
      if (vendorData.name==='AFRICAN KITCHEN'){
        await sendAfricanKitchenCatalog(customerId)
      } else if (vendorData.name==='ARENA'){
        await sendArenaCatalog(customerId)
      } else if (vendorData.name==='BESTMAN'){
        await sendBestmanCatalog(customerId)
      } else if (vendorData.name==='RUKAMAT'){
        await sendRukamatCatalog(customerId)
      } else if (vendorData.name==='FAMOT'){
        await sendFamotCatalog(customerId)
      } else if (vendorData.name==='RENEES CAFE'){
        await sendReneesCatalog(customerId)
      } else if (vendorData.name==="ALPHA'S PLACE"){
        await sendAlphaCatalog(customerId)
      } else if (vendorData.name==="YOMICE CAFE"){
        await sendYomiceCatalog(customerId)
      } else if (vendorData.name==="CHEF MAYO"){
        await sendChefMayoCatalog(customerId)
      } else if (vendorData.name==="EXCEEDING GRACE"){
        await sendExceedingGraceCatalog(customerId)
      } else if (vendorData.name === "Test vendor") {
        await sendTestvendor(customerId)
      }

      return {
        status: "success",
        response_type: "vendor_catalogue",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: ``
      };

      // const menuList = menuItems.map((item, i) => {
      //   let priceDesc = '';
      //   if (item.sale_quantity === 'per_price') {
      //     priceDesc = `from ₦${item.price}`;
      //   } else if (item.sale_quantity === 'per_piece') {
      //     priceDesc = `₦${item.price} each`;
      //   } else if (item.sale_quantity === 'full_pack') {
      //     priceDesc = `₦${item.price} (Full Pack)`;
      //   } else if (item.sale_quantity === 'half_pack') {
      //     priceDesc = `₦${item.price} (Half Pack)`;
      //   } else {
      //     priceDesc = `₦${item.price}`;
      //   }
      //   return `${i + 1}. ${item.food_name} - ${priceDesc}`;
      // }).join('\n');
      
      // return {
      //   status: "success",
      //   response_type: "vendor_catalogue",
      //   customer_id: customerId,
      //   timestamp: new Date().toISOString(),
      //   message: ` ${vendorData.name} Menu:\n\n${menuList}\n\nJust tell me what you'd like to order!`
      // };
    }

    // return {
    //   status: "success",
    //   response_type: "vendor_catalogue",
    //   customer_id: customerId,
    //   timestamp: new Date().toISOString(),
    //   message: `Here's the menu for ${vendorData.name}:`,
    //   data: {
    //     list: {
    //       header: `${vendorData.name} Menu`.substring(0, 60),
    //       body: "Select an item to add to your order:",
    //       button: "View Items",
    //       sections: [{
    //         title: "Menu Items",
    //         rows: menuItems.map(item => {
    //           let priceDesc = '';
    //           if (item.sale_quantity === 'per_price') {
    //             priceDesc = `from ₦${item.price}`;
    //           } else if (item.sale_quantity === 'per_piece') {
    //             priceDesc = `₦${item.price} each`;
    //           } else if (item.sale_quantity === 'full_pack') {
    //             priceDesc = `₦${item.price} (Full Pack)`;
    //           } else if (item.sale_quantity === 'half_pack') {
    //             priceDesc = `₦${item.price} (Half Pack)`;
    //           } else {
    //             priceDesc = `₦${item.price}`;
    //           }
    //           return {
    //             id: `menu_${item.id}`,
    //             title: item.food_name.substring(0, 24),
    //             description: priceDesc.substring(0, 72)
    //           };
    //         })
    //       }]
    //     }
    //   }
    // };
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
    
    if (vendorStatus.status !== 'open') {
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
      
      // Get available soups at this vendor
      const availableSoups = await getAvailableSoups(vendorData.id);
      
      if (availableSoups.length === 0) {
        return {
          status: "error",
          response_type: "validation_error",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message: `Swallow needs soup to go with it!\n\nUnfortunately, ${vendorData.name} has no soups available right now. Please add a soup from another vendor or cancel this order.`,
          data: {
            buttons: [
              { id: "cancel_order", title: "Cancel" }
            ]
          }
        };
      }
      
      // Show soups as interactive list if 10 or fewer
      if (availableSoups.length <= 10) {
        return {
          status: "error",
          response_type: "validation_error",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message: `Swallow needs soup to go with it!\n\nSelect a soup from ${vendorData.name} to complete your order:`,
          data: {
            list: {
              header: "Available Soups",
              body: `Swallow needs soup to go with it! Select a soup from ${vendorData.name}:`,
              button: "Select Soup",
              sections: [{
                title: "Soups",
                rows: availableSoups.map(soup => {
                  let priceDesc = '';
                  if (soup.sale_quantity === 'per_price') {
                    priceDesc = `from ₦${soup.price}`;
                  } else if (soup.sale_quantity === 'per_piece') {
                    priceDesc = `₦${soup.price} each`;
                  } else if (soup.sale_quantity === 'full_pack') {
                    priceDesc = `₦${soup.price} (Full Pack)`;
                  } else if (soup.sale_quantity === 'half_pack') {
                    priceDesc = `₦${soup.price} (Half Pack)`;
                  } else {
                    priceDesc = `₦${soup.price}`;
                  }
                  return {
                    id: `add_soup_${soup.food_name.toLowerCase().replace(/\s+/g, '_')}`,
                    title: soup.food_name.substring(0, 24),
                    description: priceDesc.substring(0, 72)
                  };
                })
              }]
            }
          }
        };
      }
      
      // Show as text list if more than 10
      const soupList = availableSoups.map((soup, i) => {
        let priceDesc = '';
        if (soup.sale_quantity === 'per_price') {
          priceDesc = `from ₦${soup.price}`;
        } else if (soup.sale_quantity === 'per_piece') {
          priceDesc = `₦${soup.price} each`;
        } else if (soup.sale_quantity === 'full_pack') {
          priceDesc = `₦${soup.price} (Full Pack)`;
        } else if (soup.sale_quantity === 'half_pack') {
          priceDesc = `₦${soup.price} (Half Pack)`;
        } else {
          priceDesc = `₦${soup.price}`;
        }
        return `${i + 1}. ${soup.food_name} - ${priceDesc}`;
      }).join('\n');
      
      return {
        status: "error",
        response_type: "validation_error",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: `Swallow needs soup to go with it!\n\nAvailable Soups at ${vendorData.name}:\n\n${soupList}\n\nReply with the soup name to add it to your order.`
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
      
      // Get available swallows at this vendor
      const { getAvailableSwallows } = await import('../db/Utils/vendor.js');
      const availableSwallows = await getAvailableSwallows(vendorData.id);
      
      if (availableSwallows.length === 0) {
        return {
          status: "error",
          response_type: "validation_error",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message: `You can't order only free soup.\n\nSorry, no swallows are available at ${vendorData.name} right now.`,
          data: {
            buttons: [
              { id: "cancel_order", title: "Cancel" }
            ]
          }
        };
      }
      
      // Show swallows as interactive list if 10 or fewer
      if (availableSwallows.length <= 10) {
        return {
          status: "error",
          response_type: "validation_error",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message: `You can't order only free soup.\n\nSelect a swallow to add to your order:`,
          data: {
            list: {
              header: "Available Swallows",
              body: `Select a swallow from ${vendorData.name}:`,
              button: "Select Swallow",
              sections: [{
                title: "Swallows",
                rows: availableSwallows.map(swallow => {
                  let priceDesc = '';
                  if (swallow.sale_quantity === 'per_price') {
                    priceDesc = `from ₦${swallow.price}`;
                  } else if (swallow.sale_quantity === 'per_piece') {
                    priceDesc = `₦${swallow.price} each`;
                  } else if (swallow.sale_quantity === 'full_pack') {
                    priceDesc = `₦${swallow.price} (Full Pack)`;
                  } else if (swallow.sale_quantity === 'half_pack') {
                    priceDesc = `₦${swallow.price} (Half Pack)`;
                  } else {
                    priceDesc = `₦${swallow.price}`;
                  }
                  return {
                    id: `add_swallow_${swallow.food_name.toLowerCase().replace(/\s+/g, '_')}`,
                    title: swallow.food_name.substring(0, 24),
                    description: priceDesc.substring(0, 72)
                  };
                })
              }]
            }
          }
        };
      }
      
      // Show as text list if more than 10
      const swallowList = availableSwallows.map((swallow, i) => {
        let priceDesc = '';
        if (swallow.sale_quantity === 'per_price') {
          priceDesc = `from ₦${swallow.price}`;
        } else if (swallow.sale_quantity === 'per_piece') {
          priceDesc = `₦${swallow.price} each`;
        } else if (swallow.sale_quantity === 'full_pack') {
          priceDesc = `₦${swallow.price} (Full Pack)`;
        } else if (swallow.sale_quantity === 'half_pack') {
          priceDesc = `₦${swallow.price} (Half Pack)`;
        } else {
          priceDesc = `₦${swallow.price}`;
        }
        return `${i + 1}. ${swallow.food_name} - ${priceDesc}`;
      }).join('\n');
      
      return {
        status: "error",
        response_type: "validation_error",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: `You can't order only free soup.\n\nAvailable Swallows at ${vendorData.name}:\n\n${swallowList}\n\nReply with the swallow name to add it to your order.`
      };
    }

    // Validate each item and update prices from database
    const validationErrors = [];
    const validatedItems = [];
    const failedItems = [];
    
    for (const item of items) {
      const validation = await validateOrderItem(
        vendorData.id,
        item.name,
        item.quantity_type,
        item.price,
        item.quantity
      );
      
      if (!validation.valid) {
        // Check if disambiguation is needed
        if (validation.needsDisambiguation && validation.suggestions) {
          // Store disambiguation state
          const { setFailedOrder } = await import('../services/sessionManager.js');
          setFailedOrder(customerId, {
            validatedItems,
            failedItems,
            vendor: vendorData.name,
            vendorId: vendorData.id,
            delivery_location,
            errorType: 'disambiguation',
            originalItems: items,
            disambiguationItem: {
              originalName: item.name,
              quantity: item.quantity,
              quantityType: item.quantity_type,
              price: item.price,
              suggestions: validation.suggestions
            }
          });
          
          // Return interactive list
          return {
            status: "error",
            response_type: "disambiguation",
            customer_id: customerId,
            timestamp: new Date().toISOString(),
            message: `Which "${item.name}" did you mean?`,
            data: {
              list: {
                header: "Select Item",
                body: `Multiple items match "${item.name}". Please select:`,
                button: "Select Item",
                sections: [{
                  title: "Available Items",
                  rows: validation.suggestions.map(s => {
                    let priceDesc = '';
                    if (s.sale_quantity === 'per_price') {
                      priceDesc = `from ₦${s.price}`;
                    } else if (s.sale_quantity === 'per_piece') {
                      priceDesc = `₦${s.price} each`;
                    } else if (s.sale_quantity === 'full_pack') {
                      priceDesc = `₦${s.price} (Full Pack)`;
                    } else if (s.sale_quantity === 'half_pack') {
                      priceDesc = `₦${s.price} (Half Pack)`;
                    } else {
                      priceDesc = `₦${s.price}`;
                    }
                    return {
                      id: `disambiguate_${s.id}`,
                      title: s.name.substring(0, 24),
                      description: priceDesc.substring(0, 72)
                    };
                  })
                }]
              }
            }
          };
        }
        
        validationErrors.push(validation.error);
        failedItems.push(item.name);
      } else {
        // Store validated item with database price
        validatedItems.push({
          ...item,
          price: validation.item.price,
          dbName: validation.item.food_name
        });
      }
    }

    if (validationErrors.length > 0) {
      const { setFailedOrder } = await import('../services/sessionManager.js');
      
      setFailedOrder(customerId, {
        validatedItems,
        failedItems,
        vendor: vendorData.name,
        vendorId: vendorData.id,
        delivery_location,
        errorType: 'validation_failed',
        originalItems: items
      });
      
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
        message: ` Order validation failed:\n\nWhat would you like to do?`,
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
          message: `Order: ${itemsList} from ${vendorData.name}\n\n Pickup or Delivery?\n\nPickup - ₦50\nDelivery - ₦100`,
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

      // ADD DELIVERY PRICE HERE → ₦100
      const deliveryFee = 100;

      // Final total = pack + delivery fee
      const finalPackTotal = packTotal + deliveryFee;

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
        total: finalPackTotal
      });

      
      const stackSummary = getStackSummary(customerId);

      return {
        status: "success",
        response_type: "order_summary",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: ` Pack Added to Cart\n\nItems:\n${itemsList}\n\nPack: ₦${packTotal}\nVendor: ${vendorData.name}\nDelivery: ${delivery_location}\n\nTotal Packs: ${stackSummary.packCount}\n\nWhat would you like to do next?`,
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
      message: "Got an order? Say less \nJust drop it in this format so we can process it fast \n\n*Example:*\njollof rice - ₦1,400, 1 beef 1 egg from African Kitchen delivered to my hostel(location)\n\nMake sure to include the \n• Item name + quantity you want\n• Specify the vendor you're buying from\n• Specify the location the food is delivered to"
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

    // If more than 10 vendors, return multiple lists
    if (vendors.length > 10) {
      const lists = [];
      for (let i = 0; i < vendors.length; i += 10) {
        const chunk = vendors.slice(i, i + 10);
        const listNum = Math.floor(i / 10) + 1;
        lists.push({
          status: "success",
          response_type: "menu",
          customer_id: customerId,
          timestamp: new Date().toISOString(),
          message: listNum === 1 ? "Select a restaurant (Part 1):" : `More restaurants (Part ${listNum}):`,
          data: {
            list: {
              header: `Restaurants ${listNum}`,
              body: `Available restaurants (${i + 1}-${i + chunk.length}):`,
              button: "View Restaurants",
              sections: [{
                title: "Restaurants",
                rows: chunk.map(v => ({
                  id: `vendor_${v.id}`,
                  title: v.name.substring(0, 24),
                  description: (v.description || "View menu").substring(0, 72)
                }))
              }]
            }
          }
        });
      }
      
      return {
        status: "success",
        response_type: "menu",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: "Here are all available restaurants:",
        multipleLists: lists
      };
    }

    // 10 or fewer vendors - single list
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

  "Cancel Order": async (customerId, message) => {
    const { getOrderStack } = await import("../services/orderStack.js");
    const { getPendingOrder } = await import("../services/sessionManager.js");
    
    const orderStack = getOrderStack(customerId);
    const pendingOrder = getPendingOrder(customerId);
    
    // Check if there's anything to cancel
    if (orderStack.length === 0 && !pendingOrder) {
      return {
        status: "error",
        response_type: "order_management",
        customer_id: customerId,
        timestamp: new Date().toISOString(),
        message: "You don't have any active orders to cancel."
      };
    }
    
    return {
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
    };
  },

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
        message: "Got an order? Say less \nJust drop it in this format so we can process it fast \n\n*Example:*\njollof rice - ₦1,400, 1 beef 1 egg from African Kitchen delivered to my hostel(location)\n\nMake sure to include the \n• Item name + quantity you want\n• Specify the vendor you're buying from\n• Specify the location the food is delivered to"
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