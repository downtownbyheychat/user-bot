import { formatForWhatsAppAPI } from './messageFormatter.js';
import axios from 'axios';

export async function sendMessage(response, recipientPhoneNumber) {
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