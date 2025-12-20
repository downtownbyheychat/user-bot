import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

const baseUrl = 'https://downtownbyhai-api.onrender.com/';

/**
 * Request a refund for a transaction
 * @param {string} external_reference - The transaction external reference
 * @param {number} refund_amount - Amount to refund
 * @returns {Promise<Object>} Refund response
 */
export async function requestRefund(external_reference, refund_amount) {
  try {
    const response = await axios.post(
      `${baseUrl}transactions/refund`,
      {
        external_reference,
        refund_amount
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: "Refund processed successfully"
    };
  } catch (err) {
    console.error("Refund error:", err.response?.data || err.message);
    
    const errorMessage = err.response?.data?.message || err.message;
    
    // Handle specific error cases
    if (errorMessage.includes("completed transaction")) {
      return {
        success: false,
        error: "Cannot refund completed transactions"
      };
    }
    
    if (errorMessage.includes("not been processed")) {
      return {
        success: false,
        error: "Transaction has not been processed yet"
      };
    }
    
    return {
      success: false,
      error: errorMessage || "Refund request failed"
    };
  }
}
