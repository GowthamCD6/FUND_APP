require('dotenv').config({ path: './.env' });
const db = require('./src/config/db');

async function test() {
  const [groups] = await db.promise().query('SELECT * FROM `groups`');
  console.log('--- GROUPS ---');
  console.log(groups);

  const [cols] = await db.promise().query('SELECT * FROM monthly_collections');
  console.log('--- MONTHLY COLS ---');
  console.log(cols);

  const [auctions] = await db.promise().query('SELECT * FROM group_auction_winners');
  console.log('--- AUCTIONS ---');
  console.log(auctions);

  const [details] = await db.promise().query('SELECT * FROM group_monthly_details');
  console.log('--- MONTHLY DETAILS ---');
  console.log(details);
  
  process.exit(0);
}
test().catch(console.error);