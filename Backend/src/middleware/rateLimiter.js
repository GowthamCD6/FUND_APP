const rateLimit = require('express-rate-limit');

// Helper to check if rate limiting should be skipped during local development testing
const isDev = process.env.NODE_ENV !== 'production' && process.env.ENABLE_RATE_LIMIT !== 'true';

// Rate limiter for OTP sending (Prevent SMS/OTP flooding)
const otpRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 OTP requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
  message: {
    success: false,
    message: 'Too many OTP requests from this IP. Please try again after 5 minutes.',
  },
});

// Rate limiter for OTP verification & Login attempts (Prevent brute-force)
const authAttemptRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 verification/login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
  message: {
    success: false,
    message: 'Too many verification attempts. Please try again after 15 minutes.',
  },
});

// General API rate limiter (Higher limit to support local mobile polling endpoints)
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3000, // Limit each IP to 3000 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
  message: {
    success: false,
    message: 'Rate limit exceeded. Please try again later.',
  },
});

module.exports = {
  otpRateLimiter,
  authAttemptRateLimiter,
  apiRateLimiter,
};
