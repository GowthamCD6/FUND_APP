# SMS OTP Integration Setup

## Overview
The OTP verification system now sends real SMS messages to members' phone numbers instead of showing demo OTPs.

## Setup Instructions

### Step 1: Choose Your SMS Provider

#### Option 1: **Twilio** (Recommended - Most Reliable)
1. Visit: https://www.twilio.com/console/sms/getting-started
2. Sign up and get your credentials:
   - Account SID
   - Auth Token  
   - Phone Number
3. Install Twilio SDK:
   ```bash
   npm install twilio
   ```
4. Add to `.env` file:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

#### Option 2: **AWS SNS**
1. Visit: https://aws.amazon.com/sns/
2. Get your AWS credentials
3. Install AWS SDK:
   ```bash
   npm install aws-sdk
   ```
4. Add to `.env`:
   ```
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_REGION=us-east-1
   ```

#### Option 3: **Custom HTTP API** (Fast2SMS, Vonage, etc.)
1. Choose provider and get API credentials
2. Add to `.env`:
   ```
   SMS_API_URL=https://your-provider.com/send
   SMS_API_KEY=your_api_key
   ```
3. Install axios or use Node 18+ built-in fetch

### Step 2: Configure `.env` File

Copy and configure the `.env` file with your chosen provider credentials (see `.env.example`).

### Step 3: Test the Integration

1. Start backend: `npm start`
2. In admin app, click "Send OTP" on chit card
3. Check server logs - should show: `[SMS Service] SMS sent successfully`
4. Member should receive SMS: `Your FUND-APP OTP is: 123456. Valid for 5 minutes.`

## How It Works

1. **User clicks "Send OTP"**
   - Sends request with member's phone number
   - Backend generates 6-digit OTP
   - SMS is sent to member's phone
   - Modal updates to "Enter OTP" step

2. **User enters OTP**
   - Member types OTP they received via SMS
   - Shows 6 visual dots as they type
   - Max 3 failed attempts before new OTP needed
   - 5-minute expiration

3. **Payment Confirmed**
   - Backend verifies OTP matches
   - Payment marked as "Paid"
   - Close modal and update UI

## Demo Mode

If no SMS provider is configured, the system runs in **DEMO MODE**:
- OTP is generated and logged to console
- SMS is NOT actually sent
- Useful for testing without payment

## Troubleshooting

| Issue | Solution |
|-------|----------|
| OTP not received | Check SMS provider credentials in `.env` |
| "SMS sending failed" | Verify phone number format (+country code needed) |
| Twilio Error 21211 | Invalid phone number format |
| AWS SNS Error | Check AWS credentials and region |

## Production Notes

- Replace demo credentials with real production keys
- Set `NODE_ENV=production`
- SMS costs will apply based on provider pricing
- Test with non-critical numbers first
- Monitor SMS delivery logs in provider dashboard

## Phone Number Format

Most SMS providers require E.164 format:
- Valid: `+919876543210` (India with +91 country code)
- Invalid: `9876543210` (without country code)

If your database stores phone numbers without country code, add it:
```javascript
const phoneWithCountry = `+91${memberPhone}`; // For India
```
