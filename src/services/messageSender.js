import { formatForWhatsAppAPI } from './messageFormatter.js';
import axios from 'axios';

export async function sendMessage(response, recipientPhoneNumber) {
    // Handle multiple chunks for restaurant lists
    if (response.chunks && Array.isArray(response.chunks)) {
        console.log(`[sendMessage] Sending ${response.chunks.length} chunks to ${recipientPhoneNumber}`);
        const url = `https://graph.facebook.com/v15.0/{{Phone-Number-ID}}/messages`;
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer {{Your-Access-Token}}`
        };

        try {
            // Send initial message
            if (response.message) {
                const textMessage = {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: recipientPhoneNumber,
                    type: "text",
                    text: { body: response.message }
                };
                console.log('[sendMessage] Sending initial text message');
                await axios.post(url, textMessage, { headers });
            }

            // Send each chunk as a separate list
            for (let i = 0; i < response.chunks.length; i++) {
                const chunk = response.chunks[i];
                console.log(`[sendMessage] Sending chunk ${i + 1}/${response.chunks.length}`);
                const chunkResponse = { ...response, ...chunk };
                const formattedMessage = formatForWhatsAppAPI(chunkResponse, recipientPhoneNumber);
                if (formattedMessage) {
                    console.log(`[sendMessage] Formatted chunk ${i + 1}:`, JSON.stringify(formattedMessage, null, 2));
                    await axios.post(url, formattedMessage, { headers });
                    // Small delay between messages to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            console.log('[sendMessage] All chunks sent successfully');
            return { success: true };
        } catch (error) {
            console.error("Error sending chunked messages:", error.response?.data || error.message);
            throw error;
        }
    }

    const formattedMessage = formatForWhatsAppAPI(response, recipientPhoneNumber);

    if (formattedMessage) {
        const url = `https://graph.facebook.com/v15.0/{{Phone-Number-ID}}/messages`;
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer {{Your-Access-Token}}`
        };

        try {
            const result = await axios.post(url, formattedMessage, { headers });
            return result.data;
        } catch (error) {
            console.error("Error sending message:", error.response.data);
            throw error;
        }
    }
}