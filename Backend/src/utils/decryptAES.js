const crypto = require('crypto');

const SECRET_KEY = Buffer.from('00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff', 'hex'); // 32 bytes
const IV = Buffer.from('0102030405060708090a0b0c0d0e0f10', 'hex'); // 16 bytes

function decryptAES(encrypted) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', SECRET_KEY, IV);
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = { decryptAES };