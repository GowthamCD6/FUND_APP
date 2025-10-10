// Node script to encrypt a password using AES-256-CBC with hex key/iv
// Matches the logic in src/utils/encryptPassword.jsx (CryptoJS)

const crypto = require('crypto');

const HEX_KEY = '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff'; // 32 bytes
const HEX_IV = '0102030405060708090a0b0c0d0e0f10'; // 16 bytes

const key = Buffer.from(HEX_KEY, 'hex');
const iv = Buffer.from(HEX_IV, 'hex');

const pwd = process.argv[2] || 'Abc';

const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
let encrypted = cipher.update(pwd, 'utf8', 'base64');
encrypted += cipher.final('base64');

console.log(encrypted);
