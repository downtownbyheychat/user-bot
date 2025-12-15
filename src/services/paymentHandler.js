import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

const baseUrl = 'https://downtownbyhai-api.onrender.com/'
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

import { paymentSessions } from "./sessionManager.js";

export async function getAccount(vendor_phone, total, customer_id) {
  try {
    const response = await axios.post(
      `${baseUrl}transactions/${customer_id}/one-time-payment`,
      {
        amount: total,
        recipient_phone_number: vendor_phone,
        description: "one time payment",
      }
    );

    const external_reference =
      response.data.data.external_reference;

    // ✅ CREATE PAYMENT SESSION
    paymentSessions.set(customer_id, {
      external_reference,
      amount: total,
      vendor_phone,
      status: "PENDING",
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 mins
    });

    return response.data.data;
  } catch (err) {
    console.log(err);
    throw err;
  }
}



export async function confirmPayment(total, customer_id) {
  const session = paymentSessions.get(customer_id);

  if (!session) {
    console.log("No active payment session");
    return
  }

  if (session.status === "CONFIRMED") {
    console.log("Payment already confirmed" );
    return
  }

  if (session.amount !== total) {
    console.log("Amount mismatch");
    return
  }

  // Optional: expiry check
  if (Date.now() > session.expiresAt) {
    paymentSessions.delete(customer_id);
    console.log("Payment session expired");
  }

  const response = await axios.post(
    `${baseUrl}transactions/confirm`,
    {
      amount: session.amount,
      external_reference: session.external_reference,
    }
  );


  return response.data.data;
}
