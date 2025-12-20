import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

const baseUrl = 'https://app.downtown.ng/'
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

import { paymentSessions, canRefund } from "./sessionManager.js";

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

  if (!session) return null;
  if (session.amount !== total) return null;
  if (Date.now() > session.expiresAt) {
    paymentSessions.delete(customer_id);
    return null;
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



export async function finalizePayment(external_reference) {
  const response = await axios.post(`${baseUrl}transactions/${external_reference}/finalize`)
  console.log(response)
}

export function activateRefund(customerId) {
  if (!canRefund(customerId)) {
    console.log("❌ Refund window closed");
    return;
  }

  const session = paymentSessions.get(customerId);

  clearTimeout(session.refundTimer);

  session.status = "REFUNDED";
  paymentSessions.set(customerId, session);

  console.log("✅ Refund activated");
}