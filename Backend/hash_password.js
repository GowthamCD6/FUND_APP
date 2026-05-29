const bcrypt = require('bcryptjs');
const { passwordEncryptAES } = require('./src/utils/decryptAES');

// Your password
const plainPassword = '2000';

// Step 1: Encrypt with AES
const encryptedPassword = passwordEncryptAES(plainPassword);

// Step 2: Hash with bcrypt
bcrypt.hash(encryptedPassword, 12, (err, hashedPassword) => {
  if (err) {
    console.error('Error hashing password:', err);
    return;
  }
  
  console.log('Password: 2000');
  console.log('Hashed Password:', hashedPassword);
  console.log('\nUse this in SQL:');
  console.log(`UPDATE users SET password = '${hashedPassword}' WHERE phone = '1234567890';`);
});
