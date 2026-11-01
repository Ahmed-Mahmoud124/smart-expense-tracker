'use strict';

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// ── Pool configuration ────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl: {
    ca: fs.readFileSync(process.env.DB_CA_PATH || path.join(__dirname, '..', 'ca.pem')),
    rejectUnauthorized: true,
  },

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: '+00:00',
  decimalNumbers: true,
  dateStrings: false,
});

// Connectivity test
const testConnection = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.ping();
    console.log(`✅ MySQL connected → ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) conn.release();
  }
};

// Convenience query wrapper
const query = async (sql, params = []) => {
  try {
    return await pool.execute(sql, params);
  } catch (err) {
    err.query = sql;
    throw err;
  }
};

module.exports = { pool, query, testConnection };