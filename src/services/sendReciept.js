import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";
dotenv.config();

const baseUrl = process.env.baseUrl;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

export async function sendReceiptPDF(customerId, filePath, orderId) {
  try {
    // Upload PDF to WhatsApp Media API
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('type', 'application/pdf');
    formData.append('messaging_product', 'whatsapp');

    const uploadResponse = await axios.post(
      `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/media`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          ...formData.getHeaders()
        }
      }
    );

    const mediaId = uploadResponse.data.id;

    // Send PDF document
    await axios.post(
      `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: customerId,
        type: "document",
        document: {
          id: mediaId,
          caption: `📄 Your Order Receipt - ${orderId}`,
          filename: `receipt_${orderId}.pdf`
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error sending receipt PDF:', error);
    throw error;
  }
}


export async function sendPassImage(customerId, vendor, amount) {
  await axios({
    url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
    method: "post",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      messaging_product: "whatsapp",
      to: customerId,
      type: "image",
      image: {
        link: "https://ik.imagekit.io/ytipnete2/SAVE_20251215_021207.jpg",
        caption: `🎉Your payment of ₦${amount} to ${vendor} has been confirmed`
      }
    }),
  });
}