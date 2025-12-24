import { formatForWhatsAppAPI } from '../services/messageFormatter.js';
import dotenv from 'dotenv';

dotenv.config();


const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;


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

export async function markAsRead(messageId) {
    try {
        await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId
            })
        });
    } catch (error) {
        console.error('Error marking message as read:', error.message);
    }
}

export async function sendTypingIndicator(recipientPhoneNumber, messageId) {
    try {
        await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId,
                typing_indicator: {
                    type: 'text'
                }
            })
        });
    } catch (error) {
        console.error('Error sending typing indicator:', error.message);
    }
}

export async function sendMessage(recipientPhoneNumber, responseData) {
    // Handle both old format (text string) and new format (response object)
    const response = typeof responseData === 'string' 
        ? { message: responseData }
        : responseData;

    console.log('📨 sendMessage called for:', recipientPhoneNumber);
    console.log('📨 Response type:', response.response_type);
    console.log('📨 Has list data:', !!response.data?.list);

    // Format the message for WhatsApp API
    const formattedMessage = formatForWhatsAppAPI(response, recipientPhoneNumber);

    if (formattedMessage) {
        console.log('✅ Message formatted successfully, type:', formattedMessage.type);
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
                const errorText = await apiResponse.text();
                console.error('❌ WhatsApp API Error:', apiResponse.status, errorText);
            } else {
                console.log('✅ Message sent successfully to WhatsApp');
            }
        } catch (error) {
            console.error('❌ Error sending message:', error.message);
        }
    } else {
        console.error('❌ Failed to format message for WhatsApp API.');
    }
}

export async function sendDocument(recipientPhoneNumber, filePath, filename) {
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


