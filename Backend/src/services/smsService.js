// SMS Service for sending OTPs
// Configure with your SMS provider credentials in .env file

const smsCache = new Map(); // Temporary in-memory storage for OTPs

// Format phone number to E.164 format (+country_code number)
const formatPhoneNumber = (phoneNumber) => {
  // Remove all non-digit characters except +
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // If already has country code (starts with 1-9 and is long enough)
  if (phoneNumber.includes('+')) {
    return phoneNumber.trim();
  }
  
  // For India (default): add +91 if 10 digits
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  
  // For other countries, try to detect based on length
  if (cleaned.length === 11) {
    return `+1${cleaned}`; // US/Canada
  }
  
  if (cleaned.length === 12) {
    return `+${cleaned.substring(0, 1)}${cleaned.substring(1)}`; // Generic
  }
  
  // Return as-is if already formatted or unknown
  return `+${cleaned}`.replace(/\+\+/g, '+');
};

const sendSMS = async (phoneNumber, message) => {
  try {
    // Format phone number to E.164 format
    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log(`[SMS Service] Sending SMS to ${formattedPhone} (original: ${phoneNumber})`);
    console.log(`[SMS Service] Message: ${message}`);
    
    // Method 1: Using Twilio (most reliable)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const twilio = require('twilio');
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        
        const result = await client.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: formattedPhone,
        });
        
        console.log(`[SMS Service] SMS sent successfully via Twilio with SID: ${result.sid}`);
        return { success: true, message: 'SMS sent successfully', sid: result.sid };
      } catch (twilioError) {
        console.error('[SMS Service] Twilio error:', twilioError.message);
        throw twilioError;
      }
    }
    
    // Method 2: Using AWS SNS
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      try {
        const AWS = require('aws-sdk');
        AWS.config.update({
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION || 'us-east-1',
        });
        
        const sns = new AWS.SNS();
        const params = {
          Message: message,
          PhoneNumber: formattedPhone,
        };
        
        const result = await sns.publish(params).promise();
        console.log(`[SMS Service] SMS sent via AWS SNS: ${result.MessageId}`);
        return { success: true, message: 'SMS sent successfully', messageId: result.MessageId };
      } catch (awsError) {
        console.error('[SMS Service] AWS SNS error:', awsError.message);
        throw awsError;
      }
    }
    
    // Method 3: Using generic HTTP SMS API (e.g., Fast2SMS, Vonage, etc.)
    if (process.env.SMS_API_URL && process.env.SMS_API_KEY) {
      try {
        const fetch = require('node-fetch');
        
        const response = await fetch(process.env.SMS_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SMS_API_KEY}`,
          },
          body: JSON.stringify({
            phone: formattedPhone,
            message: message,
          }),
        });
        
        const data = await response.json();
        
        if (data.success || response.ok) {
          console.log(`[SMS Service] SMS sent via HTTP API`);
          return { success: true, message: 'SMS sent successfully' };
        }
        
        throw new Error(data.message || 'SMS API error');
      } catch (apiError) {
        console.error('[SMS Service] SMS API error:', apiError.message);
        throw apiError;
      }
    }
    
    // Fallback: Demo mode (no SMS sent, for testing)
    console.log(`[SMS Service] ⚠️  DEMO MODE - No SMS provider configured`);
    console.log(`[SMS Service] Phone: ${formattedPhone}`);
    console.log(`[SMS Service] Message: ${message}`);
    console.log(`[SMS Service] To enable real SMS, configure one of: TWILIO_*, AWS_*, or SMS_API_* in .env`);
    
    return { 
      success: true, 
      message: 'Demo mode: SMS would be sent in production',
      isDemoMode: true,
      formattedPhone: formattedPhone,
    };
  } catch (error) {
    console.error('[SMS Service] Error sending SMS:', error);
    return { success: false, error: error.message };
  }
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const storeOTP = (phoneNumber, otp, expiryMinutes = 5) => {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  const expiryTime = Date.now() + expiryMinutes * 60 * 1000;
  smsCache.set(formattedPhone, { otp, expiryTime, attempts: 0 });
  return { otp, expiryTime };
};

const verifyOTP = (phoneNumber, enteredOtp) => {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  const otpData = smsCache.get(formattedPhone);
  
  if (!otpData) {
    return { success: false, message: 'OTP expired or not found' };
  }

  if (Date.now() > otpData.expiryTime) {
    smsCache.delete(formattedPhone);
    return { success: false, message: 'OTP has expired' };
  }

  if (otpData.attempts >= 3) {
    smsCache.delete(formattedPhone);
    return { success: false, message: 'Too many failed attempts. Request a new OTP.' };
  }

  if (otpData.otp !== enteredOtp) {
    otpData.attempts += 1;
    return { success: false, message: 'Incorrect OTP', attemptsLeft: 3 - otpData.attempts };
  }

  // OTP verified successfully
  smsCache.delete(formattedPhone);
  return { success: true, message: 'OTP verified' };
};

const clearOTP = (phoneNumber) => {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  smsCache.delete(formattedPhone);
};

module.exports = {
  sendSMS,
  generateOTP,
  storeOTP,
  verifyOTP,
  clearOTP,
  formatPhoneNumber,
};
