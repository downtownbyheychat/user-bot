import express from 'express';
import dotenv from 'dotenv';
import { saveMessage, checkMessageExists, saveChatMessage } from '../db/mongodb.js';
import { processMessage } from '../services/messageProcessor.js';
import { generateReceipt } from '../services/receiptGenerator.js';
import { formatForWhatsAppAPI } from '../services/messageFormatter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;


console.log('Environment check:');
console.log('VERIFY_TOKEN loaded:', !!VERIFY_TOKEN);
console.log('ACCESS_TOKEN loaded:', !!ACCESS_TOKEN);
console.log('PHONE_NUMBER_ID loaded:', !!PHONE_NUMBER_ID);
console.log('GEMINI_API_KEY loaded:', !!GEMINI_API_KEY);


app.use(express.json());

app.get('/', (req, res) => {
  res.send('Campus AI Bot - WhatsApp Webhook');
});

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    return res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed');
    return res.status(403).send('Forbidden');
  }
});

app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      processMessagesAsync(body).catch(error => {
        console.error('Async processing error:', error);
      });
      return res.status(200).json({ status: 'EVENT_RECEIVED' });
    } else {
      return res.status(404).json({ error: 'Not a WhatsApp event' });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// async function processMessagesAsync(body) {
//   for (const entry of body.entry || []) {
//     for (const change of entry.changes || []) {
//       if (change.field === 'messages') {
//         const messages = change.value.messages;
//         for (const message of messages || []) {
          
//           const existing = await checkMessageExists(message.id);
//           if (existing) {
//             continue;
//           }
          
//           await saveMessage({
//             messageId: message.id,
//             from: message.from,
//             type: message.type,
//             text: message.text?.body || null,
//             timestamp: new Date(parseInt(message.timestamp) * 1000),
//             phoneNumberId: change.value.metadata.phone_number_id
//           });

//           if (message.type === 'text') {
//             const customerId = message.from;
//             const userMessage = message.text.body;

//             await saveChatMessage(customerId, userMessage, false);

//             try {
//               const responseData = await processMessage(customerId, userMessage);
              
//               await saveChatMessage(customerId, responseData.message, true);
//               const buttons = responseData.data?.buttons || null;
//               await sendMessage(customerId, responseData.message, buttons);
              
//               if (responseData.data?.order_summary?.items?.length > 0) {
//                 await generateAndSendReceipt(customerId, responseData.data.order_summary);
//               }
//             } catch (error) {
//               console.error('Error processing message:', error);
//               const fallbackMessage = "Sorry, I'm currently overloaded. Please try again shortly.";
//               await saveChatMessage(customerId, fallbackMessage, true);
//               await sendMessage(customerId, fallbackMessage);
//             }
//           }

//           // Handle button interactions
//           if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
//             const buttonId = message.interactive.button_reply.id;
//             const customerId = message.from;
            
//             try {
//               const { handleButtonClick } = await import('../services/buttonHandler.js');
//               const buttonResponse = await handleButtonClick(buttonId, customerId);
              
//               await saveChatMessage(customerId, `[Button: ${buttonId}]`, false);
//               await saveChatMessage(customerId, buttonResponse.message, true);
//               const buttonButtons = buttonResponse.data?.buttons || null;
//               await sendMessage(customerId, buttonResponse.message, buttonButtons);
              
//             } catch (error) {
//               console.error('Button handling error:', error);
//               await sendMessage(customerId, "Sorry, that action isn't working right now. Please try again.");
//             }
//           }
//         }
//       }
//     }
//   }
// }

async function processMessagesAsync(body) {
    for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
            if (change.field === 'messages') {
                


                const messages = change.value.messages;

                for (const message of messages || []) {
                    const customerId = message.from; // WhatsApp phone number of the user
                    
                    // Check if user is registered
                    const { getUserName } = await import('../db/Utils/users.js');
                    const userName = await getUserName(customerId);

                    if (!userName) {
                        // User is not registered, trigger onboarding flow
                        const flowData = {
                            header: "Welcome to Downtown",
                            footer: "Powered by Downtown",
                            parameters: {
                                flow_message_version: "3",
                                flow_token: `onboarding_${Date.now()}`, // Unique token for the flow
                                flow_id: "834210229023164",
                                flow_cta: "Register",
                                flow_action: "navigate",
                                flow_action_payload: {
                                    screen: "SIGN_UP"
                                }
                            }
                        };

                        await sendMessage(customerId, "Please register to continue.", null, null, flowData);
                        return; // Stop further processing for this message
                    }

                    // Check for expired OTP
                    const { getOtp, generateOtp, saveOtp } = await import('../services/pendingOtps.js');
                    const pendingOtp = getOtp(customerId);

                    if (pendingOtp && Date.now() > pendingOtp.expiry && message.type !== 'interactive' && message.interactive?.type !== 'nfm_reply') {
                        // OTP has expired, and the user sent a message that is not a flow submission
                        const newOtp = generateOtp();
                        saveOtp(customerId, newOtp);

                        const flowData = {
                            header: "Verify OTP",
                            footer: "Powered by Downtown",
                            parameters: {
                                flow_message_version: "3",
                                flow_token: `otp_${Date.now()}`,
                                flow_id: "1206250401558114",
                                flow_cta: "Verify",
                                flow_action: "navigate",
                                flow_action_payload: {
                                    screen: "VERIFY_OTP"
                                }
                            }
                        };
                        await sendMessage(customerId, `Your previous OTP has expired. Your new OTP is ${newOtp}`, null, null, flowData);
                        return; // Stop further processing
                    }

                    // Fix: Prevent responding to messages not intended for the user
                    // If the receiving number is not (2349023168568), return early
                    const toNumber = change.value.metadata?.display_phone_number || '';
                    if (toNumber !== '2349023168568') {
                        console.log('Message intended for vendor bot, ignoring...');
                        return;
                    }

                    // Check if the message already exists in the database
                    const existing = await checkMessageExists(message.id);
                    if (existing) {
                        continue;
                    }

                    // Save the incoming message to the database
                    await saveMessage({
                        messageId: message.id,
                        from: message.from,
                        type: message.type,
                        text: message.text?.body || null,
                        timestamp: new Date(parseInt(message.timestamp) * 1000),
                        phoneNumberId: change.value.metadata.phone_number_id
                    });

                    // Handle text messages
                    if (message.type === 'text') {
                        const userMessage = message.text.body;

                        // Save the user message to the chat log
                        await saveChatMessage(customerId, userMessage, false);

                        try {
                            // Process the message and get the response
                            const responseData = await processMessage(customerId, userMessage);

                            // Save the bot's response to the chat log
                            await saveChatMessage(customerId, responseData.message, true);

                            // Send the response to the user
                            const buttons = responseData.data?.buttons || null;
                            await sendMessage(customerId, responseData.message, buttons, null, null);

                            // If there's an order summary, generate and send a receipt
                            if (responseData.data?.order_summary?.items?.length > 0) {
                                await generateAndSendReceipt(customerId, responseData.data.order_summary);
                            }
                        } catch (error) {
                            console.error('Error processing message:', error);
                            const fallbackMessage = "Sorry, I'm currently overloaded. Please try again shortly.";
                            await saveChatMessage(customerId, fallbackMessage, true);
                            await sendMessage(customerId, fallbackMessage, null, null, null);
                        }
                    }

                    // Handle button interactions
                    if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
                        const buttonId = message.interactive.button_reply.id;

                        try {
                            // Handle resend OTP button
                            if (buttonId === 'resend_otp') {
                                const { generateOtp, saveOtp } = await import('../services/pendingOtps.js');
                                const newOtp = generateOtp();
                                saveOtp(customerId, newOtp);

                                const flowData = {
                                    header: "Verify OTP",
                                    footer: "Powered by Downtown",
                                    parameters: {
                                        flow_message_version: "3",
                                        flow_token: `otp_${Date.now()}`,
                                        flow_id: "1206250401558114",
                                        flow_cta: "Verify",
                                        flow_action: "navigate",
                                        flow_action_payload: {
                                            screen: "VERIFY_OTP"
                                        }
                                    }
                                };
                                await sendMessage(customerId, `Your new OTP is ${newOtp}`, null, null, flowData);
                                return; // Stop further processing
                            }

                            // Process the button click
                            const { handleButtonClick } = await import('../services/buttonHandler.js');
                            const buttonResponse = await handleButtonClick(buttonId, customerId);

                            // Save the button interaction to the chat log
                            await saveChatMessage(customerId, `[Button: ${buttonId}]`, false);
                            await saveChatMessage(customerId, buttonResponse.message, true);

                            // Send the button response to the user
                            const buttonButtons = buttonResponse.data?.buttons || null;
                            const listData = buttonResponse.data?.list || null;
                            await sendMessage(customerId, buttonResponse.message, buttonButtons, listData, null);
                            
                            // If this is a delivery/pickup selection, process the order
                            if (buttonId === 'pickup' || buttonId === 'delivery') {
                                // Get the pending order
                                const { getPendingOrder, removePendingOrder } = await import('../services/pendingOrders.js');
                                const pendingOrder = getPendingOrder(customerId);
                                
                                if (pendingOrder) {
                                    const { vendor, items, vendorData } = pendingOrder;
                                    
                                    // Remove the pending order
                                    removePendingOrder(customerId);
                                    
                                    // Create order summary
                                    const orderSummary = {
                                        vendor: vendor,
                                        items: items,
                                        delivery_location: buttonId === 'pickup' ? 'pickup' : 'delivery'
                                    };
                                    
                                    // Process the order
                                    const { handleIntent } = await import('../ai/intentHandlers.js');
                                    const orderResponse = await handleIntent('Food Ordering', customerId, '', orderSummary);
                                    
                                    // Save and send the order response
                                    await saveChatMessage(customerId, orderResponse.message, true);
                                    const orderButtons = orderResponse.data?.buttons || null;
                                    const orderList = orderResponse.data?.list || null;
                                    await sendMessage(customerId, orderResponse.message, orderButtons, orderList, null);
                                }
                            }
                        } catch (error) {
                            console.error('Button handling error:', error);
                            await sendMessage(customerId, "Sorry, that action isn't working right now. Please try again.", null, null, null);
                        }
                    }

                    // Handle list interactions
                    if (message.type === 'interactive' && message.interactive.type === 'list_reply') {
                        const listId = message.interactive.list_reply.id;

                        try {
                            // Process the list selection
                            const { handleButtonClick } = await import('../services/buttonHandler.js');
                            const listResponse = await handleButtonClick(listId, customerId);

                            // Save the list interaction to the chat log
                            await saveChatMessage(customerId, `[List: ${listId}]`, false);
                            await saveChatMessage(customerId, listResponse.message, true);

                            // Send the list response to the user
                            const listButtons = listResponse.data?.buttons || null;
                            const listData = listResponse.data?.list || null;
                            await sendMessage(customerId, listResponse.message, listButtons, listData, null);
                        } catch (error) {
                            console.error('List handling error:', error);
                            await sendMessage(customerId, "Sorry, that action isn't working right now. Please try again.", null, null, null);
                        }
                    }

                    // Handle flow submissions
                    if (message.type === 'interactive' && message.interactive.type === 'nfm_reply') {
                        await handleFlowSubmission(customerId, message.interactive.nfm_reply);
                    }
                }
            }
        }
    }
}

async function handleFlowSubmission(customerId, nfmReply) {
    const flowResponse = JSON.parse(nfmReply.response_json);

    // Check if this is an OTP submission
    const { getOtp, removeOtp, generateOtp, saveOtp } = await import('../services/pendingOtps.js');
    const pendingOtp = getOtp(customerId);

    if (pendingOtp) {
        // This is an OTP submission
        const submittedOtp = flowResponse.otp;

        if (Date.now() > pendingOtp.expiry) {
            // OTP has expired
            const newOtp = generateOtp();
            saveOtp(customerId, newOtp);

            const flowData = {
                header: "Verify OTP",
                footer: "Powered by Downtown",
                parameters: {
                    flow_message_version: "3",
                    flow_token: `otp_${Date.now()}`,
                    flow_id: "1206250401558114",
                    flow_cta: "Verify",
                    flow_action: "navigate",
                    flow_action_payload: {
                        screen: "VERIFY_OTP"
                    }
                }
            };
            await sendMessage(customerId, `Your previous OTP has expired. Your new OTP is ${newOtp}`, null, null, flowData);
        } else if (submittedOtp === pendingOtp.otp) {
            // OTP is correct
            removeOtp(customerId);
            await sendMessage(customerId, "✅ Verification successful! You are now registered.", null, null, null);
        } else {
            // Invalid OTP
            await sendMessage(customerId, "❌ Invalid OTP. Please try again.", null, [
                { id: "resend_otp", title: "Resend OTP" }
            ], null);
        }
    } else {
        // This is an onboarding flow submission
        const { name, phone_number } = flowResponse;

        if (name && phone_number) {
            try {
                // Create the user
                const { createUser } = await import('../db/Utils/users.js');
                await createUser(name, phone_number);

                // Generate and save OTP
                const newOtp = generateOtp();
                saveOtp(customerId, newOtp);

                // Send OTP flow
                const flowData = {
                    header: "Verify OTP",
                    footer: "Powered by Downtown",
                    parameters: {
                        flow_message_version: "3",
                        flow_token: `otp_${Date.now()}`,
                        flow_id: "1206250401558114",
                        flow_cta: "Verify",
                        flow_action: "navigate",
                        flow_action_payload: {
                            screen: "VERIFY_OTP"
                        }
                    }
                };
                await sendMessage(customerId, `Your OTP is ${newOtp}`, null, null, flowData);

            } catch (error) {
                console.error('Error handling flow submission:', error);
                await sendMessage(customerId, "Sorry, there was an error processing your registration. Please try again.", null, null, null);
            }
        }
    }
}





// async function sendMessage(to, text, buttons = null) {
//   try {
//     let messageData = {
//       messaging_product: 'whatsapp',
//       to: to
//     };

//     if (buttons && buttons.length > 0) {
//       messageData.type = 'interactive';
//       messageData.interactive = {
//         type: 'button',
//         body: { text: text },
//         action: {
//           buttons: buttons.map(btn => {
//             if (btn.type === 'url') {
//               return {
//                 type: 'url',
//                 url: btn.url,
//                 title: btn.title
//               };
//             } else if (btn.type === 'reply') {
//               return {
//                 type: 'reply',
//                 reply: {
//                   id: btn.id,
//                   title: btn.title
//                 }
//               };
//             }
//           })
//         }
//       };
//     } else {
//       messageData.type = 'text';
//       messageData.text = { body: text };
//     }

//     const response = await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${ACCESS_TOKEN}`,
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify(messageData)
//     });

//     if (!response.ok) {
//       console.error('WhatsApp API Error:', response.status, await response.text());
//     }
//   } catch (error) {
//     console.error('Error sending message:', error.message);
//   }
// }



// async function sendMessage(to, text, buttons = null) {
//     const response = {
//         message: text,
//         data: { buttons }
//     };

//     const formattedMessage = formatForWhatsAppAPI(response, to);

//     if (formattedMessage) {
//         try {
//             const apiResponse = await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
//                 method: 'POST',
//                 headers: {
//                     'Authorization': `Bearer ${ACCESS_TOKEN}`,
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify(formattedMessage)
//             });

//             if (!apiResponse.ok) {
//                 console.error('WhatsApp API Error:', apiResponse.status, await apiResponse.text());
//             }
//         } catch (error) {
//             console.error('Error sending message:', error.message);
//         }
//     }
// }

async function sendMessage(recipientPhoneNumber, text, buttons = null, list = null, flow = null) {
    // Create the response object
    const response = {
        message: text,
        data: { buttons, list, flow }
    };

    // Format the message for WhatsApp API
    const formattedMessage = formatForWhatsAppAPI(response, recipientPhoneNumber);

    if (formattedMessage) {
        try {
            // Send the message to the WhatsApp API
            const apiResponse = await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formattedMessage)
            });

            // Check for errors in the API response
            if (!apiResponse.ok) {
                console.error('WhatsApp API Error:', apiResponse.status, await apiResponse.text());
            }
        } catch (error) {
            console.error('Error sending message:', error.message);
        }
    } else {
        console.error('Failed to format message for WhatsApp API.');
    }
}


async function generateAndSendReceipt(customerId, orderSummary) {
  try {
    const receiptData = {
      orderId: `ORD${Date.now()}`,
      items: orderSummary.items,
      amount: orderSummary.total_estimated || '2500',
      vendor: 'Campus Café',
      customerName: 'Student',
      deliveryAddress: orderSummary.delivery_location || 'Campus'
    };

    await generateReceipt(receiptData);
    await sendMessage(customerId, `✅ Receipt generated! Order ID: ${receiptData.orderId}`, null, null, null);
  } catch (error) {
    console.error('Receipt generation failed:', error);
  }
}

app.post('/order-status', async (req, res) => {
    try {
        const { orderId, status, details } = req.body;

        if (!orderId || !status) {
            return res.status(400).json({ error: 'orderId and status are required' });
        }

        const { getOrderStatus, setOrderStatus } = await import('../services/orderStatusManager.js');
        const order = getOrderStatus(orderId);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        setOrderStatus(orderId, order.customerId, status, details);

        let message;
        switch (status) {
            case 'delayed':
                message = `⏳ Your order #${orderId} has been delayed. Reason: ${details || 'No reason provided.'}`;
                break;
            case 'picked_up':
                message = `🚴 Your order #${orderId} has been picked up and is on its way!`;
                break;
            case 'delivered':
                message = `✅ Your order #${orderId} has been delivered. Enjoy your meal!`;
                break;
            default:
                // Don't send a notification for other statuses
                return res.status(200).json({ status: 'Status updated' });
        }

        await sendMessage(order.customerId, message, null, null, null);

        res.status(200).json({ status: 'Notification sent' });

    } catch (error) {
        console.error('Error handling order status update:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
  console.log(`🚀 Campus AI Bot running on port ${PORT}`);
});