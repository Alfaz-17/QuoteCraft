const { Pool } = require("pg");
require("dotenv").config({ path: ".env" });

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    const { rows } = await db.query('SELECT id, email, "geminiApiKey" FROM "User"');
    console.log("Users:", rows);
  } catch (err) {
    console.error(err);
  } finally {
    db.end();
  }
}
run();
