import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

const baseUrl = "https://downtownbyhai-api.onrender.com/";
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
export const SEND_ACC_DELAY = 3000;
export const FINALIZE_DELAY = 150000;

export function schedule(fn, delay) {
  return setTimeout(fn, delay);
}

import { paymentSessions } from "./sessionManager.js";

export async function getAccount(
  vendor_phone,
  total,
  customer_id,
  delivery_type
) {
  try {
    // Calculate service fee based on delivery type
    const service_fee = delivery_type === "Pickup" ? 50 : 100;

    const response = await axios.post(
      `${baseUrl}transactions/${customer_id}/one-time-payment`,
      {
        amount: total,
        recipient_phone_number: vendor_phone,
        description: "one time payment",
        service_fee: service_fee,
      }
    );

    const external_reference = response.data.data.external_reference;

    // CREATE PAYMENT SESSION
    paymentSessions.set(customer_id, {
      external_reference,
      amount: total,
      vendor_phone,
      status: "PENDING",
      createdAt: Date.now(),
    });
    setTimeout(() => {
      sendAccNum(customer_id, response.data.data.account_number).catch((err) =>
        console.log("sendAccNum failed:", err)
      );
    }, 3000);
    return response.data.data;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function sendAccNum(to, account_number) {
  try {
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
          body: `${account_number}`,
        },
      }),
    });

  } catch (error) {
    console.log(
      "Failed to send order summary",
      error.response?.data || error.message
    );
  }
}

export async function confirmPayment(total, customer_id) {
  const session = paymentSessions.get(customer_id);
  console.log("Payment session:", session);

  if (!session) {
    console.log("No active payment session");
    return;
  }

  if (session.status === "CONFIRMED") {
    console.log("Payment already confirmed");
    return;
  }

  if (session.amount !== total) {
    console.log("Amount mismatch");
    return;
  }
  console.log(
    "Confirming payment...",
    session.amount,
    session.external_reference
  );
  // Confirm payment
  try {
    const response = await axios.post(`${baseUrl}transactions/confirm`, {
      amount: session.amount,
      external_reference: session.external_reference,
    });

    //check if the payment was successful
    if (response.data.data.success === true) {
      // Mark as confirmed
      session.status = "CONFIRMED";
      session.confirmedAt = Date.now();

      paymentSessions.set(customer_id, session);

      console.log("Payment confirmed. Finalizing in 2 minutes 30 seconds...");

      //2 mins 30 secs timer to finalize
      setTimeout(async () => {
        try {
          // Double-check session still exists & confirmed
          const latestSession = paymentSessions.get(customer_id);

          if (!latestSession || latestSession.status !== "CONFIRMED") {
            console.log("Finalization aborted: session invalid");
            return;
          }

          await finalizePayment(latestSession.external_reference);

          latestSession.status = "FINALIZED";
          paymentSessions.set(customer_id, latestSession);

          console.log("Payment finalized successfully");
        } catch (err) {
          console.log("Finalization failed:", err);
        }
      }, 150000); // 2 mins 30 secs
    }
    return response.data.data;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function finalizePayment(external_reference, maxRetries = 3) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.post(
        `${baseUrl}transactions/${external_reference}/finalize`
      );

      return response.data.data;
    } catch (err) {
      lastError = err;

      // Check if it's a network error or server error worth retrying
      const isRetryable = 
        !err.response || // Network error (no response from server)
        err.code === 'ECONNABORTED' || // Timeout
        err.code === 'ENOTFOUND' || // DNS lookup failed
        err.code === 'ECONNREFUSED' || // Connection refused
        (err.response && err.response.status >= 500) || // Server errors
        err.response?.status === 429; // Rate limiting

      if (!isRetryable || attempt === maxRetries - 1) {
        // Don't retry for client errors (4xx) or if we've exhausted retries
        console.error(`Payment finalization failed after ${attempt + 1} attempt(s):`, err);
        throw err;
      }

      // Exponential backoff: wait 1s, 2s, 4s, etc.
      const delayMs = Math.pow(2, attempt) * 1000;
      console.log(`Retrying payment finalization in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})...`);
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

export async function refundPayment(external_reference) {
  try {
    const response = await axios.post(
      `${baseUrl}transactions/${external_reference}/refund`
    );

    return response.data.data;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
