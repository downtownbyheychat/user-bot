# User Onboarding & OTP Flow Implementation

## Overview
Implemented complete user onboarding flow with OTP verification for new users who are not registered in the database.

## Flow Structure

### 1. User Registration Check
When a user sends any message:
- Check if `phone_number` exists in `users` table
- Check if `email_verified` is true
- If not registered → Trigger onboarding flow
- If registered but not verified → Send OTP verification flow

### 2. Onboarding Flow
**Flow ID**: `834210229023164`  
**Link**: https://business.facebook.com/latest/whatsapp_manager/flows?business_id=1277035620803934&asset_id=1946309999247919

**Collected Data**:
- `name`: User's full name
- `email`: User's email address
- `hostel`: User's hostel/location (optional)

**Process**:
1. User fills onboarding form in WhatsApp Flow
2. Data submitted via `nfm_reply` webhook event
3. Backend creates user record via `POST /users`
4. Automatically triggers OTP verification flow

### 3. OTP Verification Flow
**Flow ID**: `1206250401558114`

**Process**:
1. Backend sends OTP to user's email via `POST /auth/send-otp`
2. OTP stored in session with 15-minute expiry
3. User enters OTP in WhatsApp Flow
4. OTP verified via `POST /auth/verify-email`
5. User's `email_verified` set to `true`

### 4. OTP Expiry Logic
**Expiry Time**: 15 minutes

**Behavior**:
- If user sends any message after OTP expires:
  - Automatically generate new OTP
  - Send new OTP to email
  - Resend verification flow
  - Notify user: "⏰ Your OTP has expired. A new OTP has been sent to your email."

### 5. Invalid OTP Handling
**When user enters wrong OTP**:
- Show error message: "❌ Invalid OTP. The code you entered is incorrect."
- Provide "🔄 Resend OTP" button
- Clicking button triggers new OTP generation and flow

## Files Modified/Created

### New Files
1. **src/services/userOnboarding.js**
   - `sendUserOnboardingFlow()` - Sends registration flow
   - `sendOTPVerificationFlow()` - Sends OTP verification flow
   - `verifyOTP()` - Verifies OTP with backend
   - `checkAndResendOTP()` - Checks expiry and resends if needed
   - `handleUserOnboardingSubmission()` - Creates user in database
   - `sendInvalidOTPMessage()` - Sends error message with resend button
   - OTP session management with auto-cleanup

### Modified Files
1. **src/webhook/webhook.js**
   - Added user existence check before processing messages
   - Added onboarding flow trigger for unregistered users
   - Added OTP verification flow trigger for unverified users
   - Added `nfm_reply` handler for flow submissions
   - Added `resend_otp` button handler

2. **src/db/Utils/users.js**
   - Added `checkUserExists()` function
   - Returns: `{ exists, verified, user }`

3. **.env.example**
   - Added `BASE_URL` for backend API

## API Endpoints Used

### User Management
- `POST /users` - Create new user
  ```json
  {
    "name": "string",
    "phone_number": "string",
    "email": "string",
    "hostel": "string"
  }
  ```

### Authentication
- `POST /auth/send-otp` - Send OTP to email
  ```json
  {
    "email": "string"
  }
  ```

- `POST /auth/verify-email` - Verify OTP
  ```json
  {
    "otp": "string"
  }
  ```

- `POST /auth/update-email` - Update user email (if needed)

## Database Schema

### users table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  hostel VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Testing Flow

### Test Case 1: New User Registration
1. Send message from unregistered number
2. Receive onboarding flow
3. Fill form with name, email, hostel
4. Submit form
5. Receive OTP verification flow
6. Enter OTP
7. Get success message

### Test Case 2: OTP Expiry
1. Register user but don't verify OTP
2. Wait 15+ minutes
3. Send any message
4. Receive: "OTP expired" + new OTP sent
5. Verify with new OTP

### Test Case 3: Invalid OTP
1. Register user
2. Enter wrong OTP
3. Receive error message with "Resend OTP" button
4. Click button
5. Receive new OTP
6. Verify successfully

## Environment Variables Required

```env
WHATSAPP_ACCESS_TOKEN=your_token
PHONE_NUMBER_ID=your_phone_id
DATABASE_URL=postgresql://...
```

**Note**: BASE_URL is hardcoded to `https://downtownbyhai-api.onrender.com/`

## Session Management
- OTP sessions stored in-memory Map
- Auto-cleanup every 5 minutes
- Session structure:
  ```javascript
  {
    phoneNumber: {
      email: "user@example.com",
      expiresAt: timestamp
    }
  }
  ```

## Error Handling
- Network errors logged but don't crash bot
- Invalid OTP shows user-friendly message
- Expired OTP automatically resends
- Database errors return fallback messages

## Security Considerations
- OTP expires after 15 minutes
- OTP sessions cleaned up automatically
- Phone numbers validated as strings
- Email verification required before bot access
