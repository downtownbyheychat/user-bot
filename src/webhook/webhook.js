import express from 'express';
import dotenv from 'dotenv';
import { saveMessage, checkMessageExists, saveChatMessage } from '../db/mongodb.js';
import { processMessage } from '../services/messageProcessor.js';
import { formatForWhatsAppAPI } from '../services/messageFormatter.js';
import { checkUserExists } from '../db/Utils/users.js';
import { 
  sendUserOnboardingFlow, 
  sendOTPVerificationFlow, 
  verifyOTP, 
  checkAndResendOTP,
  handleUserOnboardingSubmission,
  sendInvalidOTPMessage
} from '../services/userOnboarding.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;


console.log('Environment check:');
console.log('VERIFY_TOKEN loaded:', !!VERIFY_TOKEN);
console.log('ACCESS_TOKEN loaded:', !!ACCESS_TOKEN);
console.log('PHONE_NUMBER_ID loaded:', !!PHONE_NUMBER_ID);


app.use(express.json());
app.use('/assests', express.static('assests'));
app.use('/codec-pro-cufonfonts', express.static('codec-pro-cufonfonts'));

app.get('/', (req, res) => {
  res.send('Campus AI Bot - WhatsApp Webhook');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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


                    // Fix: Prevent responding to messages not intended for the user
                    // If the receiving number is not (2349023168568), return early
                    const toNumber = change.value.metadata?.display_phone_number || '';
                    if (toNumber !== '2349023168568') {
                        // console.log('Message intended for vendor bot, ignoring...');
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

                        // Check if user exists
                        let userCheck = await checkUserExists(customerId);
                        
                        if (!userCheck.exists) {
                            // User not registered, trigger onboarding
                            await sendUserOnboardingFlow(customerId);
                            continue;
                        }
                        
                        if (!userCheck.verified) {
                            // User registered but not verified, check if message is OTP
                            const otpPattern = /^\d{4,6}$/;
                            if (otpPattern.test(userMessage.trim())) {
                                const result = await verifyOTP(userMessage.trim(), customerId);
                                
                                if (result.success) {
                                    console.log('✅ OTP verified, sending welcome message');
                                    await sendMessage(customerId, '✅ Email verified successfully!');
                                    continue;
                                } else{
                                    await sendInvalidOTPMessage(customerId);
                                }
                                continue;
                            }
                            
                            // Check OTP expiry
                            const otpCheck = await checkAndResendOTP(customerId);
                            if (otpCheck.expired) {
                                await sendMessage(customerId, otpCheck.message);
                            } else {
                                await sendMessage(customerId, {
                                    message: '🔒 Please verify your email first.\n\nReply with the OTP code sent to your email.',
                                    data: {
                                        buttons: [
                                            { id: 'resend_otp', title: '🔄 Resend OTP' }
                                        ]
                                    }
                                });
                            }
                            continue;
                        }

                        // Save the user message to the chat log
                        await saveChatMessage(customerId, userMessage, false);

                        try {
                            // Process the message and get the response
                            const responseData = await processMessage(customerId, userMessage);

                            // Save the bot's response to the chat log
                            await saveChatMessage(customerId, responseData.message, true);

                            // Send the response to the user
                            await sendMessage(customerId, responseData);
                        } catch (error) {
                            console.error('Error processing message:', error);
                            const fallbackMessage = "Sorry, I'm currently overloaded. Please try again shortly.";
                            await saveChatMessage(customerId, fallbackMessage, true);
                            await sendMessage(customerId, fallbackMessage);
                        }
                    }

                    // Handle button interactions
                    if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
                        const buttonId = message.interactive.button_reply.id;

                        // Handle resend OTP button
                        if (buttonId === 'resend_otp') {
                            const userCheck = await checkUserExists(customerId);
                            if (userCheck.exists && !userCheck.verified) {
                                await sendOTPVerificationFlow(customerId, userCheck.user.email, userCheck.user.name);
                                await sendMessage(customerId, '📧 A new OTP has been sent to your email.\n\nPlease reply with the OTP code to verify your account.');
                            }
                            continue;
                        }

                        try {
                            // Process the button click
                            const { handleButtonClick } = await import('../services/buttonHandler.js');
                            const buttonResponse = await handleButtonClick(buttonId, customerId);

                            // Save the button interaction to the chat log
                            await saveChatMessage(customerId, `[Button: ${buttonId}]`, false);
                            await saveChatMessage(customerId, buttonResponse.message, true);

                            // Send the button response to the user
                            await sendMessage(customerId, buttonResponse);
                            
                            // Send receipt if available
                            if (buttonResponse.data?.receipt_path) {
                                await sendDocument(customerId, buttonResponse.data.receipt_path, 'receipt.pdf');
                            }
                        } catch (error) {
                            console.error('Button handling error:', error);
                            await sendMessage(customerId, "Sorry, that action isn't working right now. Please try again.");
                        }
                    }

                    // Handle flow submissions (user onboarding & OTP)
                    if (message.type === 'interactive' && message.interactive.type === 'nfm_reply') {
                        const flowData = message.interactive.nfm_reply;
                        const userInput = JSON.parse(flowData.response_json);

                        console.log('📥 Flow Data:', userInput);

                        // Handle user onboarding flow submission
                        if (userInput.screen_1_Full_name_0 && userInput.screen_1_Email_2) {
                            const result = await handleUserOnboardingSubmission(customerId, userInput);
                            if (!result.success) {
                                await sendMessage(customerId, `❌ Registration failed: ${result.error}`);
                            }
                            continue;
                        }
                        
                        // Handle OTP flow submission
                        if (userInput.otp) {
                            const result = await verifyOTP(userInput.otp, customerId);
                            if (!result.success) {
                                await sendInvalidOTPMessage(customerId);
                            }
                            continue;
                        }
                    }

                    // Handle list interactions
                    if (message.type === 'interactive' && message.interactive.type === 'list_reply') {
                        const listItemId = message.interactive.list_reply.id;
                        console.log('📋 List item selected:', listItemId);

                        try {
                            // Process the list selection
                            const { handleButtonClick } = await import('../services/buttonHandler.js');
                            const listResponse = await handleButtonClick(listItemId, customerId);
                            console.log('✅ List response generated:', listResponse.message?.substring(0, 50));

                            // Save the list interaction to the chat log
                            await saveChatMessage(customerId, `[List: ${listItemId}]`, false);
                            await saveChatMessage(customerId, listResponse.message, true);

                            // Send the list response to the user
                            await sendMessage(customerId, listResponse);
                            
                            // Send receipt if available
                            if (listResponse.data?.receipt_path) {
                                await sendDocument(customerId, listResponse.data.receipt_path, 'receipt.pdf');
                            }
                        } catch (error) {
                            console.error('List handling error:', error);
                            await sendMessage(customerId, "Sorry, that action isn't working right now. Please try again.");
                        }
                    }
                }
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

async function sendMessage(recipientPhoneNumber, responseData) {
    // Handle both old format (text string) and new format (response object)
    const response = typeof responseData === 'string' 
        ? { message: responseData }
        : responseData;

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

async function sendDocument(recipientPhoneNumber, filePath, filename) {
    try {
        const fs = await import('fs');
        const FormData = (await import('form-data')).default;
        
        const formData = new FormData();
        formData.append('messaging_product', 'whatsapp');
        formData.append('to', recipientPhoneNumber);
        formData.append('type', 'document');
        formData.append('document', fs.createReadStream(filePath), { filename });
        
        const apiResponse = await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                ...formData.getHeaders()
            },
            body: formData
        });

        if (!apiResponse.ok) {
            console.error('WhatsApp Document Send Error:', apiResponse.status, await apiResponse.text());
        }
    } catch (error) {
        console.error('Error sending document:', error.message);
    }
}




app.listen(PORT, () => {
  console.log(`🚀 Campus AI Bot running on port ${PORT}`);
});