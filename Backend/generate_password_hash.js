require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Get keys from .env
const SECRET_KEY_PASSWORD = Buffer.from(process.env.AES_SECRET_KEY_PASSWORD, 'hex');
const IV_PASSWORD = Buffer.from(process.env.AES_IV_PASSWORD, 'hex');

function passwordEncryptAES(plain) {
  const cipher = crypto.createCipheriv('aes-256-cbc', SECRET_KEY_PASSWORD, IV_PASSWORD);
  let enc = cipher.update(String(plain), 'utf8', 'base64');
  enc += cipher.final('base64');
  return enc;
}

// Password to hash
const plainPassword = '2000';

// Encrypt with AES
const encryptedPassword = passwordEncryptAES(plainPassword);
console.log('Plain Password:', plainPassword);
console.log('AES Encrypted:', encryptedPassword);

// Hash with bcrypt
bcrypt.hash(encryptedPassword, 12, (err, hashedPassword) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  
  console.log('Bcrypt Hashed:', hashedPassword);
  console.log('\nRun this SQL:');
  console.log(`UPDATE users SET password = '${hashedPassword}' WHERE phone = '1234567890';`);
  
  process.exit(0);
});
