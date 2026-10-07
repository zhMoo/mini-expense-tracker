// A quick way to see exactly what's in the database — no need to open
// MAMP's phpMyAdmin just to check what's stored.
//
// Run it with: npm run db:inspect
require("dotenv").config({ path: ".env.local" });
const mysql = require("mysql2/promise");

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "nextjs_expense_tracker",
    ...(process.env.MYSQL_SSL === "true" ? { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } } : {}),
  });

  const [rows] = await conn.query("SELECT * FROM expenses ORDER BY user_id, id");
  console.log("expenses");
  console.table(rows);

  // The same kind of stats as the dashboard widget, but calculated by MySQL itself.
  const [stats] = await conn.query(`
    SELECT user_id, category, COUNT(*) AS count, SUM(amount) AS total, ROUND(AVG(amount), 2) AS average
    FROM expenses
    GROUP BY user_id, category
    ORDER BY user_id, total DESC
  `);
  console.log("stats by user and category");
  console.table(stats);

  await conn.end();
}

main().catch((err) => {
  console.error("Could not inspect the database:", err.message);
  process.exit(1);
});
