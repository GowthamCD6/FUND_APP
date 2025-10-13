const crypto = require('crypto');

const SECRET_KEY = Buffer.from(process.env.AES_SECRET_KEY_PASSWORD, 'hex');
const IV = Buffer.from(process.env.AES_IV_PASSWORD, 'hex');

function passwordDecryptAES(encrypted) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', SECRET_KEY, IV);
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// function passwordDecryptAES(encrypted) {
//     const decipher = crypto.createDecipheriv('aes-256-cbc', SECRET_KEY, IV);
//     let decrypted = decipher.update(encrypted, 'base64', 'utf8');
//     decrypted += decipher.final('utf8');
//     return decrypted;
// }

module.exports = { passwordDecryptAES };