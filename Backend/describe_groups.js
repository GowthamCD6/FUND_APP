const db = require('./src/config/db');

db.promise().query("DESCRIBE `groups`")
  .then(([rows]) => {
    console.log('Columns in groups:', rows.map(r => `${r.Field}: ${r.Type}`));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
