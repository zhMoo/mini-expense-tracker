import mysql from "mysql2/promise";

// OBJECTIVE: Connecting Next.js to a database (MySQL)
//
// Same setup as the module: a MySQL connection POOL, settings from
// .env.local, and the database + table created automatically on first use.
// Every function is async — MySQL is a separate server, so every query
// waits on real network I/O.

const DB_HOST = process.env.MYSQL_HOST || "127.0.0.1";
const DB_PORT = Number(process.env.MYSQL_PORT) || 3306;
const DB_USER = process.env.MYSQL_USER || "root";
const DB_PASSWORD = process.env.MYSQL_PASSWORD || "";
const DB_NAME = process.env.MYSQL_DATABASE || "nextjs_expense_tracker";

// Cloud MySQL (TiDB Cloud, PlanetScale, AWS RDS, ...) needs TLS; MAMP doesn't.
// Switched on with MYSQL_SSL=true in .env.local — no code change needed to deploy.
const USE_SSL = process.env.MYSQL_SSL === "true";
const sslOption = USE_SSL ? { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } } : {};

let pool;
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 5,
      ...sslOption,
    });
  }
  return pool;
}

let initPromise = null;
function ready() {
  if (!initPromise) {
    initPromise = init().catch((err) => {
      initPromise = null; // try again on the next request (e.g. after MAMP is started)
      throw err;
    });
  }
  return initPromise;
}

async function init() {
  // A fresh MAMP/MySQL install won't have this database yet: connect without
  // choosing one, and create it if it's missing.
  const bootstrap = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    ...sslOption,
  });
  await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  await bootstrap.end();

  const p = getPool();
  // amount is DECIMAL(10,2): exact money values (12.50), never floating-point
  // rounding errors like 0.1 + 0.2 = 0.30000000000000004.
  await p.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      user_id     VARCHAR(50)    NOT NULL,
      description VARCHAR(100)   NOT NULL,
      amount      DECIMAL(10, 2) NOT NULL,
      category    VARCHAR(30)    NOT NULL,
      created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed demo data once. GET_LOCK makes sure two requests arriving at the
  // same moment can't both see an empty table and seed it twice.
  const conn = await p.getConnection();
  try {
    await conn.query("SELECT GET_LOCK('expenses_seed', 10)");
    const [[{ count }]] = await conn.query("SELECT COUNT(*) AS count FROM expenses");
    if (count === 0) {
      await conn.query(
        `INSERT INTO expenses (user_id, description, amount, category) VALUES
          ('1', 'Nasi lemak breakfast', 8.50, 'Food'),
          ('1', 'Grab to office', 15.00, 'Transport'),
          ('1', 'TNB electricity bill', 120.35, 'Bills'),
          ('1', 'Lunch with team', 32.80, 'Food'),
          ('2', 'Kopi O and roti bakar', 6.90, 'Food'),
          ('2', 'Movie ticket', 18.00, 'Entertainment')`,
      );
    }
  } finally {
    await conn.query("SELECT RELEASE_LOCK('expenses_seed')");
    conn.release();
  }
}

function rowToExpense(row) {
  return {
    id: String(row.id),
    description: row.description,
    amount: Number(row.amount), // mysql2 returns DECIMAL as a string, e.g. "8.50"
    category: row.category,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

// Read — newest first. Only the signed-in user's rows.
export async function getAllExpenses(userId) {
  await ready();
  const [rows] = await getPool().query(
    "SELECT * FROM expenses WHERE user_id = ? ORDER BY created_at DESC, id DESC",
    [userId],
  );
  return rows.map(rowToExpense);
}

// Create
export async function createExpense(userId, { description, amount, category }) {
  await ready();
  const p = getPool();
  const [result] = await p.query(
    "INSERT INTO expenses (user_id, description, amount, category) VALUES (?, ?, ?, ?)",
    [userId, description, amount, category],
  );
  const [rows] = await p.query("SELECT * FROM expenses WHERE id = ?", [result.insertId]);
  return rowToExpense(rows[0]);
}

// Update — `AND user_id = ?` means you can only edit your own expenses.
// Returns the updated expense, or null if it doesn't exist / isn't yours.
export async function updateExpense(userId, id, { description, amount, category }) {
  await ready();
  const p = getPool();
  const [result] = await p.query(
    "UPDATE expenses SET description = ?, amount = ?, category = ? WHERE id = ? AND user_id = ?",
    [description, amount, category, Number(id), userId],
  );
  if (result.affectedRows === 0) return null;
  const [rows] = await p.query("SELECT * FROM expenses WHERE id = ?", [Number(id)]);
  return rowToExpense(rows[0]);
}

// Delete — `AND user_id = ?` means you can only delete your own expenses.
export async function deleteExpense(userId, id) {
  await ready();
  const [result] = await getPool().query("DELETE FROM expenses WHERE id = ? AND user_id = ?", [
    Number(id),
    userId,
  ]);
  return result.affectedRows > 0;
}

// Used by scripts to close the pool cleanly.
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
