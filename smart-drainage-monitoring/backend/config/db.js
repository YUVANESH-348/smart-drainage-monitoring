// backend/config/db.js
// Central MySQL connection pool. Every other module imports `pool`
// from here instead of creating its own connection.

require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_drainage',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: false
});

/**
 * Quick connectivity check used at startup and by /api/status.
 * Returns true/false instead of throwing, so callers can decide
 * how to react (log a warning, report DB as DISCONNECTED, etc.)
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (err) {
    console.error('MySQL connection failed:', err.message);
    return false;
  }
}

module.exports = { pool, testConnection };
