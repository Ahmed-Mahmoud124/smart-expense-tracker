'use strict';

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// ── Pool configuration ────────────────────────────────────────────────────────
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'expense_tracker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: '+00:00',          // store all datetimes in UTC
  decimalNumbers: true,        // return DECIMAL columns as JS numbers
  dateStrings: false,
});

// ── Connectivity test (called once at startup) ────────────────────────────────
const testConnection = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.ping();
    console.log(`✅  MySQL connected  →  ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  } catch (err) {
    console.error('❌  MySQL connection failed:', err.message);
    process.exit(1);           // fatal — cannot run without a database
  } finally {
    if (conn) conn.release();
  }
};

// ── Convenience query wrapper ─────────────────────────────────────────────────
/**
 * Execute a parameterised query and return [rows, fields].
 * Callers should destructure: const [rows] = await query(sql, params);
 */
const query = async (sql, params = []) => {
  try {
    return await pool.execute(sql, params);
  } catch (err) {
    // Re-throw with additional context for the error middleware
    err.query = sql;
    throw err;
  }
};

module.exports = { pool, query, testConnection };