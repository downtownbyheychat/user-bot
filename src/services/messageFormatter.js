export function formatForWhatsAppAPI(response, recipientPhoneNumber) {
    if (response.data && response.data.buttons) {
        const hasUrlButton = response.data.buttons.some(b => b.type === "url");

        if (hasUrlButton) {
            // Handle CTA message for the first URL button
            const urlButton = response.data.buttons.find(b => b.type === "url");
            return {
                messaging_product: "whatsapp",
                to: recipientPhoneNumber,
                type: "interactive",
                interactive: {
                    type: "button",
                    body: { text: response.message },
                    action: {
                        buttons: [
                            {
                                type: "url",
                                url: urlButton.url,
                                title: urlButton.title
                            }
                        ]
                    }
                }
            };
        }

        // Default (reply) button logic
        return {
            messaging_product: "whatsapp",
            to: recipientPhoneNumber,
            type: "interactive",
            interactive: {
                type: "button",
                body: { text: response.message },
                action: {
                    buttons: response.data.buttons.map(button => ({
                        type: "reply",
                        reply: { id: button.id, title: button.title }
                    }))
                }
            }
        };
    } else if (response.message) {
        // Format for simple text messages
        return {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: recipientPhoneNumber,
            type: "text",
            text: {
                body: response.message
            }
        };
    }

    // Return null if the response is invalid or missing required fields
    return null;
}