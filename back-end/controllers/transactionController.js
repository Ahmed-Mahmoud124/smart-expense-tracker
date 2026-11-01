'use strict';

const { query } = require('../config/db');
const {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendNoContent,
} = require('../utils/responseHelper');

// ── Helper: verify category belongs to user and matches type ──────────────────
const verifyCategory = async (categoryId, userId, type) => {
  const [rows] = await query(
    `SELECT id, type FROM categories
     WHERE id = ? AND (user_id = ? OR user_id IS NULL) AND is_active = 1`,
    [categoryId, userId]
  );
  if (!rows.length) return { valid: false, reason: 'Category not found.' };
  if (type && rows[0].type !== type) {
    return { valid: false, reason: `Category type mismatch — expected "${type}".` };
  }
  return { valid: true, category: rows[0] };
};

// ── CREATE ────────────────────────────────────────────────────────────────────
const createTransaction = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, amount, category_id, description = '', transaction_date, notes = '' } = req.body;

    const { valid, reason } = await verifyCategory(category_id, userId, type);
    if (!valid) return res.status(400).json({ success: false, message: reason });

    const [result] = await query(
      `INSERT INTO transactions
         (user_id, type, amount, category_id, description, transaction_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, type, amount, category_id, description.trim(), transaction_date, notes.trim()]
    );

    const [rows] = await query(
      `SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      [result.insertId]
    );

    return sendCreated(res, { transaction: rows[0] }, 'Transaction created successfully.');
  } catch (err) {
    next(err);
  }
};

// ── GET ALL (paginated + filtered) ────────────────────────────────────────────
const getTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      page        = 1,
      limit       = 20,
      type,
      category_id,
      start_date,
      end_date,
      search,
      sort_by     = 'transaction_date',
      sort_order  = 'DESC',
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;
    const conditions = ['t.user_id = ?'];
    const params     = [userId];

    if (type)        { conditions.push('t.type = ?');                   params.push(type); }
    if (category_id) { conditions.push('t.category_id = ?');            params.push(category_id); }
    if (start_date)  { conditions.push('t.transaction_date >= ?');       params.push(start_date); }
    if (end_date)    { conditions.push('t.transaction_date <= ?');       params.push(end_date); }
    if (search) {
      conditions.push('(t.description LIKE ? OR t.notes LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.join(' AND ');

    // Whitelist sort columns to prevent SQL injection
    const safeSortBy    = ['transaction_date', 'amount', 'created_at'].includes(sort_by)
      ? `t.${sort_by}` : 't.transaction_date';
    const safeSortOrder = ['ASC', 'DESC'].includes(sort_order.toUpperCase())
      ? sort_order.toUpperCase() : 'DESC';

    const countSql = `SELECT COUNT(*) AS total FROM transactions t WHERE ${where}`;
    const [countRows] = await query(countSql, params);
    const total = countRows[0].total;

    const dataSql = `
      SELECT
        t.id, t.type, t.amount, t.description, t.transaction_date, t.notes, t.created_at,
        c.id   AS category_id,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE ${where}
      ORDER BY ${safeSortBy} ${safeSortOrder}, t.id DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;

console.log('SQL Query:');
console.log(dataSql);

console.log('Parameters:');
console.log([...params, limit, offset]);

console.log('Parameter Types:');
console.log([...params, limit, offset].map(v => typeof v));

const [rows] = await query(dataSql, params);

    return sendPaginated(res, rows, total, pageNum, limitNum, 'Transactions retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

// ── GET ONE ───────────────────────────────────────────────────────────────────
const getTransactionById = async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT
         t.id, t.type, t.amount, t.description, t.transaction_date, t.notes,
         t.created_at, t.updated_at,
         c.id   AS category_id,
         c.name AS category_name,
         c.icon AS category_icon,
         c.color AS category_color
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.id = ? AND t.user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    return sendSuccess(res, { transaction: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── UPDATE ────────────────────────────────────────────────────────────────────
const updateTransaction = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const txId   = req.params.id;

    // Fetch existing record
    const [existing] = await query(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [txId, userId]
    );
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    const tx = existing[0];

    const type             = req.body.type             ?? tx.type;
    const amount           = req.body.amount           ?? tx.amount;
    const category_id      = req.body.category_id      ?? tx.category_id;
    const description      = req.body.description      ?? tx.description;
    const transaction_date = req.body.transaction_date ?? tx.transaction_date;
    const notes            = req.body.notes            ?? tx.notes;

    // Verify new category if changed
    if (req.body.category_id || req.body.type) {
      const { valid, reason } = await verifyCategory(category_id, userId, type);
      if (!valid) return res.status(400).json({ success: false, message: reason });
    }

    await query(
      `UPDATE transactions
       SET type = ?, amount = ?, category_id = ?, description = ?,
           transaction_date = ?, notes = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [type, amount, category_id, description, transaction_date, notes, txId, userId]
    );

    const [updated] = await query(
      `SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      [txId]
    );

    return sendSuccess(res, { transaction: updated[0] }, 'Transaction updated successfully.');
  } catch (err) {
    next(err);
  }
};

// ── DELETE ────────────────────────────────────────────────────────────────────
const deleteTransaction = async (req, res, next) => {
  try {
    const [result] = await query(
      'DELETE FROM transactions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    return sendNoContent(res);
  } catch (err) {
    next(err);
  }
};

// ── SUMMARY (total income / expense / balance for a period) ───────────────────
const getTransactionSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date } = req.query;

    const conditions = ['user_id = ?'];
    const params     = [userId];

    if (start_date) { conditions.push('transaction_date >= ?'); params.push(start_date); }
    if (end_date)   { conditions.push('transaction_date <= ?'); params.push(end_date); }

    const where = conditions.join(' AND ');

    const [rows] = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS total_income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense,
         COALESCE(SUM(CASE WHEN type = 'income'  THEN amount
                          WHEN type = 'expense' THEN -amount END), 0)        AS net_balance,
         COUNT(*)                                                             AS transaction_count
       FROM transactions
       WHERE ${where}`,
      params
    );

    return sendSuccess(res, { summary: rows[0] }, 'Summary retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary,
};