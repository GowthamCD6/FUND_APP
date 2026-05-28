const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

// These are bcrypt hashes for test passwords
// admin123: used for Admin and Gowtham
// user123: used for Kavitha and Devaraj
async function restoreDB() {
  try {
    const AdminHash = '$2b$10$vpy1eY0Xu5OpPrdWIf5ojuqUVHvD/c8/B01IsaUsV21FQrNspDChO'; // admin123
    const GowthamHash = '$2b$10$vpy1eY0Xu5OpPrdWIf5ojuqUVHvD/c8/B01IsaUsV21FQrNspDChO'; // admin123
    const KavithaHash = '$2b$10$eN8KLXUAwWfenpuHCQuYMuFZ17HC9NAfiWPpYD.fbZfQ9SskMNjHi'; // user123
    const DevarajHash = '$2b$10$eN8KLXUAwWfenpuHCQuYMuFZ17HC9NAfiWPpYD.fbZfQ9SskMNjHi'; // user123

    db.query('UPDATE users SET password = ? WHERE phone = ?', [AdminHash, '1234567890'], (err) => {
      if (err) console.error('Error updating Admin:', err);
      else console.log('✓ Updated Admin password');
    });

    db.query('UPDATE users SET password = ? WHERE phone = ?', [GowthamHash, '0987654321'], (err) => {
      if (err) console.error('Error updating Gowtham:', err);
      else console.log('✓ Updated Gowtham password');
    });

    db.query('UPDATE users SET password = ? WHERE phone = ?', [KavithaHash, '9003366669'], (err) => {
      if (err) console.error('Error updating Kavitha:', err);
      else console.log('✓ Updated Kavitha password');
    });

    db.query('UPDATE users SET password = ? WHERE phone = ?', [DevarajHash, '9976688860'], (err) => {
      if (err) console.error('Error updating Devaraj:', err);
      else {
        console.log('✓ Updated Devaraj password');
        console.log('\n=== Database Restored Successfully ===');
        console.log('\nTest Credentials:');
        console.log('Admin: Phone: 1234567890, Password: admin123');
        console.log('Gowtham: Phone: 0987654321, Password: admin123');
        console.log('Kavitha: Phone: 9003366669, Password: user123');
        console.log('Devaraj: Phone: 9976688860, Password: user123');
        db.end();
        process.exit(0);
      }
    });
  } catch (error) {
    console.error('Fatal error:', error);
    db.end();
    process.exit(1);
  }
}

restoreDB();
