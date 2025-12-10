import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

const baseUrl = process.env.baseUrl;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

export async function getAccount(vendor_phone, total, customer_id) {
  const koboTotal = total * 100;
  try {
    const response = await axios.post(
      `${baseUrl}transactions/${vendor_phone}/one-time-payment`,
      { amount: koboTotal }
    );

    console.log(response.data.data);

    // Send WhatsApp messages
    await sendWarning(customer_id);
    await sendTransId(customer_id, response.data.data.id);

    return response.data.data;
  } catch (err) {
    console.log(err);
    return err;
  }
}


//confirm one time payment
export async function confirmPayment(total, trans_id) {
  const koboTotal = total * 100;
  try {
    const response = await axios.post(
      `${baseUrl}transactions/${vendor_phone}/one-time-payment`,
      { amount: koboTotal }
    );

    console.log(response.data.data);

    // Send WhatsApp messages
    await sendWarning(customer_id);
    await sendTransId(customer_id, response.data.data.id);

    return response.data.data;
  } catch (err) {
    console.log(err);
    return err;
  }
}

async function sendWarning(to) {
  await axios({
    url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
    method: "post",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body: "*‼️ Copy the transaction id below and paste it in the narration/remark in your bank app*",
      },
    }),
  });
}

async function sendTransId(to, id) {
  await axios({
    url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
    method: "post",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: id },
    }),
  });
}
