const crypto = require('crypto');

const SECRET_KEY = Buffer.from(process.env.AES_SECRET_KEY_PASSWORD, 'hex');
const IV = Buffer.from(process.env.AES_IV_PASSWORD, 'hex');

function passwordEncryptAES(plain) {
  const cipher = crypto.createCipheriv('aes-256-cbc', SECRET_KEY, IV);
  let enc = cipher.update(plain, 'utf8', 'base64');
  enc += cipher.final('base64');
  return enc;
}

function passwordDecryptAES(encrypted) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', SECRET_KEY, IV);
  let dec = decipher.update(encrypted, 'base64', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}

module.exports = { passwordEncryptAES, passwordDecryptAES };