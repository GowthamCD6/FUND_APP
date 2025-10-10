// encryptPassword.js

import CryptoJS from 'crypto-js';

// Use HEX parsing instead of Utf8!
const SECRET_KEY = CryptoJS.enc.Hex.parse('00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff'); // 32 bytes
const IV = CryptoJS.enc.Hex.parse('0102030405060708090a0b0c0d0e0f10'); // 16 bytes

export const encryptPassword = (plainPassword) => {
  const encrypted = CryptoJS.AES.encrypt(plainPassword, SECRET_KEY, {
    iv: IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return encrypted.toString(); // Base64 string
};
