require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { apiRateLimiter } = require('./middleware/rateLimiter');

const app = express();

// 1. Security Headers via Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows static upload image access
  }),
);

// 2. CORS configuration
app.use(cors());

// 3. Request parsing with body size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 4. Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 5. Sanitized Request Logging (Scrub sensitive keys like password, otp, token)
const MASKED_KEYS = new Set(['password', 'otp', 'otp_code', 'token', 'secret', 'authorization']);

const scrubSensitiveData = (data) => {
  if (!data || typeof data !== 'object') return data;
  const cleaned = Array.isArray(data) ? [] : {};
  for (const [key, value] of Object.entries(data)) {
    if (MASKED_KEYS.has(key.toLowerCase())) {
      cleaned[key] = '***MASKED***';
    } else if (typeof value === 'object' && value !== null) {
      cleaned[key] = scrubSensitiveData(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

app.use((req, res, next) => {
  const sanitizedBody = scrubSensitiveData(req.body);
  console.log(`[${req.method}] ${req.url}`, Object.keys(sanitizedBody || {}).length ? sanitizedBody : '');
  next();
});

// 6. Global API Rate Limiter
app.use('/api/', apiRateLimiter);

// 7. Route Mounting
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/user', require('./routes/user'));
app.use('/api/chats', require('./routes/chat'));

module.exports = app;