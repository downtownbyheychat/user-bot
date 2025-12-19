// import pool from '../database.js';

// // Function to get the user's name
// export async function getUserName(whatsappId) {
//   try {
//     // Ensure whatsappId is treated as a string
//     const phoneNumber = String(whatsappId);

//     // Query the database
//     const result = await pool.query(
//       'SELECT name FROM users WHERE phone_number = $1',
//       [phoneNumber]
//     );

//     // Check if a user was found
//     if (result.rows.length > 0) {
//       return result.rows[0].name; // Return the user's name
//     } else {
//       return null; // No user found
//     }
//   } catch (error) {
//     console.error('Error fetching user name:', error);
//     throw error;
//   }
// }

const baseUrl = 'https://app.downtown.ng/'

import pool from '../database.js';
import axios from 'axios';

// Function to get the user's name
export async function getUserName(whatsappId) {
  try {
    console.log(`[getUserName] Received whatsappId: ${whatsappId}`);

    const phoneNumber = String(whatsappId);
    console.log(`[getUserName] Converted phoneNumber: ${phoneNumber}`);

    const result = await pool.query(
      'SELECT first_name FROM users WHERE phone_number = $1',
      [phoneNumber]
    );

    console.log(`[getUserName] Query result: ${JSON.stringify(result.rows)}`);

    if (result.rows.length > 0) {
      const fullName = `${result.rows[0].first_name}`.trim();
      console.log(`[getUserName] User found: ${fullName}`);
      return fullName;
    } else {
      console.log(`[getUserName] No user found for phone number: ${phoneNumber}`);
      return null;
    }
  } catch (error) {
    console.error(`[getUserName] Error fetching user name: ${error.message}`);
    throw error;
  }
}

// Check if user exists and is verified
export async function checkUserExists(phoneNumber) {
  try {
    const result = await pool.query(
      'SELECT id, first_name, last_name, email, email_verified FROM users WHERE phone_number = $1',
      [String(phoneNumber)]
    );

    if (result.rows.length > 0) {
      return {
        exists: true,
        verified: result.rows[0].email_verified || false,
        user: result.rows[0]
      };
    }

    return { exists: false, verified: false, user: null };
  } catch (error) {
    console.error('Error checking user existence:', error);
    return { exists: false, verified: false, user: null };
  }
}

