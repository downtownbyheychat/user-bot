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


import pool from '../database.js';

// Function to get the user's name
export async function getUserName(whatsappId) {
  try {
    console.log(`[getUserName] Received whatsappId: ${whatsappId}`); // Log the input

    // Ensure whatsappId is treated as a string
    const phoneNumber = String(whatsappId);
    console.log(`[getUserName] Converted phoneNumber: ${phoneNumber}`); // Log the converted phone number

    // Query the database
    console.log(`[getUserName] Executing query to fetch user name...`);
    const result = await pool.query(
      'SELECT name FROM users WHERE phone_number = $1',
      [phoneNumber]
    );

    console.log(`[getUserName] Query result: ${JSON.stringify(result.rows)}`); // Log the query result

    // Check if a user was found
    if (result.rows.length > 0) {
      console.log(`[getUserName] User found: ${result.rows[0].name}`); // Log the user's name
      return result.rows[0].name; // Return the user's name
    } else {
      console.log(`[getUserName] No user found for phone number: ${phoneNumber}`); // Log if no user is found
      return null; // No user found
    }
  } catch (error) {
    console.error(`[getUserName] Error fetching user name: ${error.message}`); // Log the error
    throw error;
  }
}

export async function createUser(name, phoneNumber) {
  try {
    const result = await pool.query(
      'INSERT INTO users (name, phone_number) VALUES ($1, $2) RETURNING *',
      [name, phoneNumber]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}