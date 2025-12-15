import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

const baseUrl = process.env.baseUrl;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;


export async function sendPassImage(customerId) {
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
        caption: "Your payment has been confirmed"
      }
    }),
  });
}