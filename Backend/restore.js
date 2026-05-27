const db = require('./src/config/db');

const GowthamHash = '$2b$12$U1nafzXrTK0rY/WGRXCctONgYV5X7g4TrTIp4dn.AuAMgFFmCI9nm';
const AdminHash = '$2b$10$90dRTn.SynETjpoXgir7oOZMGugqFnuNIgEKmaw6p.QfsoY4cETGi';

db.query('UPDATE users SET password = ? WHERE phone = ?', [GowthamHash, '0987654321']);
db.query('UPDATE users SET password = ? WHERE phone = ?', [AdminHash, '1234567890'], () => {
    console.log('Restored DB successfully.');
    process.exit(0);
});
