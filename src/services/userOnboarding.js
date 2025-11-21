import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const BASE_URL = 'https://downtownbyhai-api.onrender.com/';

// OTP session storage
const otpSessions = new Map(); // { phoneNumber: { otp, expiresAt, email } }

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
            text: 'Welcome to Downtown! 🎉\nLet\'s get you set up in seconds.'
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

    console.log('✅ User onboarding flow sent');
  } catch (error) {
    console.error('❌ Error sending onboarding flow:', error.response?.data || error.message);
  }
}

// Send OTP verification flow
export async function sendOTPVerificationFlow(phoneNumber, email) {
  try {
    // Generate OTP via backend
    const otpResponse = await axios.post(`${BASE_URL}auth/send-otp`, { email });
    
    // Store OTP session with 15 min expiry
    otpSessions.set(phoneNumber, {
      email,
      expiresAt: Date.now() + 15 * 60 * 1000 // 15 minutes
    });

    console.log('✅ OTP sent to email');
  } catch (error) {
    console.error('❌ Error sending OTP:', error.response?.data || error.message);
  }
}

// Verify OTP
export async function verifyOTP(otp) {
  try {
    const response = await axios.post(`${BASE_URL}auth/verify-email`, { otp });
    
    if (response.status === 200) {
      return { success: true };
    }
    
    return { success: false, error: 'Invalid OTP' };
  } catch (error) {
    console.error('❌ OTP verification failed:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || 'Verification failed' };
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
    await sendOTPVerificationFlow(phoneNumber, session.email);
    
    return {
      expired: true,
      message: '⏰ Your OTP has expired.\n\n✅ A new OTP has been sent to your email.\nPlease verify to continue.'
    };
  }
  
  return { expired: false };
}

// Handle user onboarding flow submission
export async function handleUserOnboardingSubmission(phoneNumber, flowData) {
  try {
    // Parse hostel from Label field (format: "2_Male_Silver_3")
    const hostelData = flowData.screen_1_Label_1 || '';
    const hostelParts = hostelData.split('_');
    const hostel = hostelParts.length >= 3 ? `${hostelParts[2]} ${hostelParts[3] || ''}`.trim() : null;

    const payload = {
      name: flowData.screen_1_Full_name_0.trim(),
      phone_number: phoneNumber,
      email: flowData.screen_1_Email_2,
      hostel: hostelData || 'Silver 2',
      university: 'Bells Tech'
    };

    const response = await axios.post(`${BASE_URL}users`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('✅ User created:', response.data);
    
    // Send OTP to email
    await sendOTPVerificationFlow(phoneNumber, payload.email);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error creating user:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || 'Registration failed' };
  }
}

// Send invalid OTP message with resend option
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
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: '❌ Invalid OTP\n\nThe code you entered is incorrect. Please try again.'
          },
          action: {
            buttons: [
              {
                type: 'reply',
                reply: {
                  id: 'resend_otp',
                  title: '🔄 Resend OTP'
                }
              }
            ]
          }
        }
      }
    });

    console.log('✅ Invalid OTP message sent');
  } catch (error) {
    console.error('❌ Error sending invalid OTP message:', error.response?.data || error.message);
  }
}

// Cleanup expired OTP sessions (run periodically)
setInterval(() => {
  const now = Date.now();
  for (const [phoneNumber, session] of otpSessions.entries()) {
    if (now > session.expiresAt) {
      otpSessions.delete(phoneNumber);
      console.log(`🧹 Cleaned up expired OTP session for ${phoneNumber}`);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes
