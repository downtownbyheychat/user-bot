export function formatForWhatsAppAPI(response, recipientPhoneNumber) {
    // Handle list messages
    if (response.data?.list) {
        const { header, body, button, sections, footer } = response.data.list;
        
        // WhatsApp limits: max 10 sections, max 10 rows per section
        const limitedSections = sections.slice(0, 10).map(section => ({
            ...section,
            rows: section.rows.slice(0, 10)
        }));
        
        console.log(`📋 Sending list with ${limitedSections.length} sections, total rows: ${limitedSections.reduce((sum, s) => sum + s.rows.length, 0)}`);
        
        const payload = {
            messaging_product: "whatsapp",
            to: recipientPhoneNumber,
            type: "interactive",
            interactive: {
                type: "list",
                header: { type: "text", text: header },
                body: { text: body },
                ...(footer && { footer: { text: footer } }),
                action: {
                    button,
                    sections: limitedSections
                }
            }
        };
        
        console.log('📤 WhatsApp List Payload:', JSON.stringify(payload, null, 2));
        return payload;
    }

    // Handle button messages
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