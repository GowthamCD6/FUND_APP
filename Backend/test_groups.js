const db = require('./src/config/db');

db.promise().query("SELECT id, group_name, status FROM `groups` WHERE deleted_at IS NULL")
  .then(([rows]) => {
    console.log('Groups in DB:', rows);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
