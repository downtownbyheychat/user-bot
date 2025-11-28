import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const BASE_URL = 'https://downtownbyhai-api.onrender.com/';

// OTP session storage
const otpSessions = new Map(); // { phoneNumber: { otp, expiresAt, email } }
const awaitingEmailChange = new Set(); // Track users awaiting email change

// Send user onboarding flow
export async function sendUserOnboardingFlow(phoneNumber) {
  try {
    await axios({
      url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      method: 'post',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        recipient_type: 'individual',
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'interactive',
        interactive: {
          type: 'flow',
          header: {
            type: 'text',
            text: 'Downtown'
          },
          body: {
            text: "Let's get you onboarded"
          },
          action: {
            name: 'flow',
            parameters: {
              flow_message_version: '3',
              flow_token: 'unused',
              flow_id: '834210229023164',
              flow_cta: 'Get Started',
              flow_action: 'navigate',
              flow_action_payload: {
                screen: 'privacy_policy_terms_of_use',
                data: {
                  type: 'dynamic_object',
                  value: {}
                }
              }
            }
          }
        }
      }
    });

    console.log('User onboarding flow sent');
  } catch (error) {
    console.error('Error sending onboarding flow:', error.response?.data || error.message);
  }
}

// Handle user onboarding flow submission
export async function handleUserOnboardingSubmission(phoneNumber, flowData) {
  try {
    const hostelData = flowData.screen_1_Label_1 || '';

    const payload = {
      name: flowData.screen_1_Full_name_0.trim(),
      phone_number: phoneNumber,
      email: flowData.screen_1_Email_2,
      hostel: hostelData || 'Silver 2',
      university: 'Bells Tech'
    };

    if (!isValidEmail(payload.email)) {
      await axios({
        url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
        method: 'post',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        data: {
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: {
            body: 'The OTP was not delivered to the email because it was invalid.'
          }
        }
      });
      
      await sendUserOnboardingFlow(phoneNumber);
      return { success: false, error: 'Invalid email' };
    }

    const response = await axios.post(`${BASE_URL}users`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('User created:', response.data);
    
    otpSessions.set(phoneNumber, {
      email: payload.email,
      name: payload.name,
      expiresAt: Date.now() + 15 * 60 * 1000
    });
    
    await axios({
      url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      method: 'post',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: 'An OTP has been sent to your email. Please reply with the OTP to verify your account.'
        }
      }
    });
    
    console.log('OTP sent by backend during user creation');
    
    return { success: true };
  } catch (error) {
    console.error('Error creating user:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || 'Registration failed' };
  }
}

// Send OTP verification flow
export async function sendOTPVerificationFlow(phoneNumber, email, name) {
  try {
    // Generate OTP via backend
    const otpResponse = await axios.post(`${BASE_URL}auth/send-otp/${phoneNumber}`, { 
      email, 
      name,
      recipient_type: 'user'
    });
    
    // Store OTP session with 15 min expiry
    otpSessions.set(phoneNumber, {
      email,
      name,
      expiresAt: Date.now() + 15 * 60 * 1000 // 15 minutes
    });

    console.log(' OTP sent to email');
  } catch (error) {
    console.error(' Error sending OTP:', error.response?.data || error.message);
    throw error;
  }
}

// Send OTP text message
export async function sendOTPFlowMessage(phoneNumber) {
  try {
    await axios({
      url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      method: 'post',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: 'A new OTP has been sent to your email. Please reply with the OTP to verify your account.'
        }
      }
    });
    console.log(' OTP text message sent');
  } catch (error) {
    console.error(' Error sending OTP message:', error.response?.data || error.message);
  }
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

// Verify OTP
export async function verifyOTP(otp, phoneNumber) {
  try {
    console.log(' Verifying OTP:', otp);
    const response = await axios.post(`${BASE_URL}auth/verify-email`, { otp: otp.toString() });
    
    if (response.status === 200) {
      console.log(' OTP verified successfully');
      
      // Manually update email_verified in database
      try {
        const pool = (await import('../db/database.js')).default;
        await pool.query(
          'UPDATE users SET email_verified = true WHERE phone_number = $1',
          [phoneNumber]
        );
        console.log(' Database updated: email_verified = true');
      } catch (dbError) {
        console.error(' Failed to update database:', dbError.message);
      }
      
      // Send success message
      await axios({
        url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
        method: 'post',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        data: {
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: {
            body: ' Email successfully verified!'
          }
        }
      });
      
      // Send template format message with 3 second delay
      setTimeout(() => {
        sendOrderTemplateMessage(phoneNumber);
      }, 3000);
      
      return { success: true };
    }
    
    return { success: false, error: 'Invalid OTP' };
  } catch (error) {
    console.error(' OTP verification failed:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || 'Verification failed' };
  }
}

// Send order template format message
async function sendOrderTemplateMessage(phoneNumber) {
  try {
    await axios({
      url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      method: 'post',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: ' Welcome to Downtown!\n\nWhat would you like to do?'
          },
          action: {
            buttons: [
              {
                type: 'reply',
                reply: {
                  id: 'view_restaurants',
                  title: ' View Restaurants'
                }
              },
              {
                type: 'reply',
                reply: {
                  id: 'start_ordering',
                  title: ' Start Ordering'
                }
              }
            ]
          }
        }
      }
    });
    console.log(' Template message sent');
  } catch (error) {
    console.error(' Error sending template message:', error.response?.data || error.message);
  }
}

// Check if OTP expired and resend
export async function checkAndResendOTP(phoneNumber) {
  const session = otpSessions.get(phoneNumber);
  
  if (!session) {
    return { expired: false, message: 'No active OTP session' };
  }
  
  if (Date.now() > session.expiresAt) {
    // OTP expired, resend
    await sendOTPVerificationFlow(phoneNumber, session.email, session.name);
    
    return {
      expired: true,
      message: ' Your OTP has expired.\n\n A new OTP has been sent to your email.\nPlease verify to continue.'
    };
  }
  
  return { expired: false, session };
}

// // Handle user onboarding flow submission
// export async function handleUserOnboardingSubmission(phoneNumber, flowData) {
//   try {
//     // Parse hostel from Label field (format: "2_Male_Silver_3")
//     const hostelData = flowData.screen_1_Label_1 || '';

//     const payload = {
//       name: flowData.screen_1_Full_name_0.trim(),
//       phone_number: phoneNumber,
//       email: flowData.screen_1_Email_2,
//       hostel: hostelData || 'Silver 2',
//       university: 'Bells Tech'
//     };

//     // Validate email
//     if (!isValidEmail(payload.email)) {
//       await axios({
//         url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
//         method: 'post',
//         headers: {
//           'Authorization': `Bearer ${ACCESS_TOKEN}`,
//           'Content-Type': 'application/json'
//         },
//         data: {
//           messaging_product: 'whatsapp',
//           to: phoneNumber,
//           type: 'text',
//           text: {
//             body: 'The OTP was not delivered to the email because it was invalid.'
//           }
//         }
//       });
      
//       // Send onboarding flow again
//       await sendUserOnboardingFlow(phoneNumber);
//       return { success: false, error: 'Invalid email' };
//     }

//     const response = await axios.post(`${BASE_URL}users`, payload, {
//       headers: { 'Content-Type': 'application/json' }
//     });

//     console.log(' User created:', response.data);
    
//     // Store OTP session (backend already sent OTP)
//     otpSessions.set(phoneNumber, {
//       email: payload.email,
//       name: payload.name,
//       expiresAt: Date.now() + 15 * 60 * 1000
//     });
    
//     // Send OTP flow message
//     await sendOTPFlowMessage(phoneNumber);
//     console.log(' OTP sent by backend during user creation');
    
//     return { success: true };
//   } catch (error) {
//     console.error(' Error creating user:', error.response?.data || error.message);
//     return { success: false, error: error.response?.data?.message || 'Registration failed' };
//   }
// }

// Send invalid OTP message
export async function sendInvalidOTPMessage(phoneNumber) {
  try {
    await axios({
      url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      method: 'post',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: 'Invalid OTP. Please check your email and reply with the correct OTP code.'
        }
      }
    });

    console.log(' Invalid OTP message sent');
  } catch (error) {
    console.error(' Error sending invalid OTP message:', error.response?.data || error.message);
  }
}

// Send change email flow
export async function sendChangeEmailFlow(phoneNumber) {
  try {
    awaitingEmailChange.add(phoneNumber);
    await axios({
      url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      method: 'post',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: 'Please reply with your new email address:'
        }
      }
    });
    console.log('Change email prompt sent');
  } catch (error) {
    console.error('Error sending change email prompt:', error.response?.data || error.message);
  }
}

export function isAwaitingEmailChange(phoneNumber) {
  return awaitingEmailChange.has(phoneNumber);
}

export function clearEmailChangeState(phoneNumber) {
  awaitingEmailChange.delete(phoneNumber);
}

// Handle email change
export async function handleEmailChange(phoneNumber, newEmail) {
  try {
    if (!isValidEmail(newEmail)) {
      await axios({
        url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
        method: 'post',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        data: {
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: {
            body: 'Invalid email format. Please provide a valid email address.'
          }
        }
      });
      return { success: false, error: 'Invalid email' };
    }

    const response = await axios.put(`${BASE_URL}users/update-email/${phoneNumber}`, {
      email: newEmail
    });

    console.log('Email updated:', response.data);
    
    otpSessions.set(phoneNumber, {
      email: newEmail,
      name: otpSessions.get(phoneNumber)?.name || 'User',
      expiresAt: Date.now() + 15 * 60 * 1000
    });
    
    await sendOTPFlowMessage(phoneNumber);
    console.log('OTP sent to new email');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating email:', error.response?.data || error.message);
    await axios({
      url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      method: 'post',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: 'Failed to update email. Please try again.'
        }
      }
    });
    return { success: false, error: error.response?.data?.message || 'Update failed' };
  }
}

// Cleanup expired OTP sessions (run periodically)
setInterval(() => {
  const now = Date.now();
  for (const [phoneNumber, session] of otpSessions.entries()) {
    if (now > session.expiresAt) {
      otpSessions.delete(phoneNumber);
      console.log(` Cleaned up expired OTP session for ${phoneNumber}`);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes
