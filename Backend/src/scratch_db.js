const db = require('./config/db');

async function test() {
  try {
    const [tables] = await db.promise().query('SHOW TABLES');
    console.log('--- TABLES IN DATABASE ---');
    console.log(tables.map(t => Object.values(t)[0]));

    for (let tableObj of tables) {
      const tableName = Object.values(tableObj)[0];
      const [columns] = await db.promise().query(`DESCRIBE \`${tableName}\``);
      console.log(`\nColumns in ${tableName}:`);
      console.log(columns.map(c => `${c.Field} (${c.Type})`));
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
