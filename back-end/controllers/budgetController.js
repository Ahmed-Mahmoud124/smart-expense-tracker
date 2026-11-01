'use strict';

const { query } = require('../config/db');
const {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendNoContent,
} = require('../utils/responseHelper');

// ── Helper: calculate spending against a budget ───────────────────────────────
const calculateBudgetSpending = async (budgetId, userId, categoryId, startDate, endDate) => {
  const conditions = [
    't.user_id = ?',
    "t.type = 'expense'",
    't.transaction_date >= ?',
    't.transaction_date <= ?',
  ];
  const params = [userId, startDate, endDate];

  if (categoryId) {
    conditions.push('t.category_id = ?');
    params.push(categoryId);
  }

  const [rows] = await query(
    `SELECT COALESCE(SUM(t.amount), 0) AS spent
     FROM transactions t
     WHERE ${conditions.join(' AND ')}`,
    params
  );

  return parseFloat(rows[0].spent);
};

// ── Helper: enrich a raw budget row with spending data ────────────────────────
const enrichBudget = async (budget, userId) => {
  const spent      = await calculateBudgetSpending(
    budget.id, userId, budget.category_id, budget.start_date, budget.end_date
  );
  const remaining  = parseFloat(budget.amount) - spent;
  const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  const threshold  = budget.alert_threshold || 80;

  return {
    ...budget,
    spent           : parseFloat(spent.toFixed(2)),
    remaining       : parseFloat(remaining.toFixed(2)),
    percentage_used : parseFloat(percentage.toFixed(2)),
    is_exceeded     : spent > budget.amount,
    alert_triggered : percentage >= threshold,
  };
};

// ── CREATE ────────────────────────────────────────────────────────────────────
const createBudget = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      name, amount, period, category_id = null,
      start_date, end_date, alert_threshold = 80, notes = '',
    } = req.body;

    // Verify category if provided
    if (category_id) {
      const [cat] = await query(
        `SELECT id FROM categories
         WHERE id = ? AND (user_id = ? OR user_id IS NULL) AND is_active = 1`,
        [category_id, userId]
      );
      if (!cat.length) {
        return res.status(400).json({ success: false, message: 'Category not found.' });
      }
    }

    const [result] = await query(
      `INSERT INTO budgets
         (user_id, name, amount, period, category_id, start_date, end_date, alert_threshold, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name.trim(), amount, period, category_id, start_date, end_date, alert_threshold, notes.trim()]
    );

    const [rows] = await query(
      `SELECT b.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.id = ?`,
      [result.insertId]
    );

    const enriched = await enrichBudget(rows[0], userId);

    return sendCreated(res, { budget: enriched }, 'Budget created successfully.');
  } catch (err) {
    next(err);
  }
};

// ── GET ALL ───────────────────────────────────────────────────────────────────
const getBudgets = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // ── Pagination (safe numbers) ─────────────────────────────
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // ── Filters ───────────────────────────────────────────────
    const conditions = ['b.user_id = ?'];
    const params = [userId];

    // is_active filter (optional)
    const isActive =
      req.query.is_active === undefined
        ? null
        : req.query.is_active === 'true'
        ? 1
        : 0;

    if (isActive !== null) {
      conditions.push('b.is_active = ?');
      params.push(isActive);
    }

    const where = conditions.join(' AND ');

    // ── Count query ───────────────────────────────────────────
    const [[{ total }]] = await query(
      `SELECT COUNT(*) AS total FROM budgets b WHERE ${where}`,
      params
    );

    // ── Data query ────────────────────────────────────────────
    const [rows] = await query(
  `SELECT 
      b.*, 
      c.name AS category_name, 
      c.icon AS category_icon, 
      c.color AS category_color
   FROM budgets b
   LEFT JOIN categories c ON b.category_id = c.id
   WHERE ${where}
   ORDER BY b.created_at DESC 
   LIMIT ${limit} OFFSET ${offset}`,
  params
);
    // ── Enrich data ───────────────────────────────────────────
    const enriched = await Promise.all(
      rows.map(b => enrichBudget(b, userId))
    );

    // ── Response ──────────────────────────────────────────────
    return sendPaginated(
      res,
      enriched,
      total,
      page,
      limit,
      'Budgets retrieved successfully.'
    );

  } catch (err) {
    next(err);
  }
};

// ── GET ONE ───────────────────────────────────────────────────────────────────
const getBudgetById = async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT b.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.id = ? AND b.user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Budget not found.' });
    }

    const enriched = await enrichBudget(rows[0], req.user.id);
    return sendSuccess(res, { budget: enriched });
  } catch (err) {
    next(err);
  }
};

// ── UPDATE ────────────────────────────────────────────────────────────────────
const updateBudget = async (req, res, next) => {
  try {
    const userId  = req.user.id;
    const budgetId = req.params.id;

    const [existing] = await query(
      'SELECT * FROM budgets WHERE id = ? AND user_id = ?',
      [budgetId, userId]
    );
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Budget not found.' });
    }

    const b = existing[0];

    const name            = req.body.name            !== undefined ? req.body.name.trim()   : b.name;
    const amount          = req.body.amount          !== undefined ? req.body.amount         : b.amount;
    const period          = req.body.period          !== undefined ? req.body.period         : b.period;
    const category_id     = req.body.category_id     !== undefined ? req.body.category_id    : b.category_id;
    const start_date      = req.body.start_date      !== undefined ? req.body.start_date     : b.start_date;
    const end_date        = req.body.end_date        !== undefined ? req.body.end_date       : b.end_date;
    const alert_threshold = req.body.alert_threshold !== undefined ? req.body.alert_threshold: b.alert_threshold;
    const is_active       = req.body.is_active       !== undefined ? req.body.is_active      : b.is_active;
    const notes           = req.body.notes           !== undefined ? req.body.notes.trim()   : b.notes;

    if (category_id) {
      const [cat] = await query(
        `SELECT id FROM categories
         WHERE id = ? AND (user_id = ? OR user_id IS NULL) AND is_active = 1`,
        [category_id, userId]
      );
      if (!cat.length) {
        return res.status(400).json({ success: false, message: 'Category not found.' });
      }
    }

    await query(
      `UPDATE budgets
       SET name = ?, amount = ?, period = ?, category_id = ?, start_date = ?,
           end_date = ?, alert_threshold = ?, is_active = ?, notes = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [name, amount, period, category_id, start_date, end_date, alert_threshold, is_active, notes, budgetId, userId]
    );

    const [updated] = await query(
      `SELECT b.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.id = ?`,
      [budgetId]
    );

    const enriched = await enrichBudget(updated[0], userId);
    return sendSuccess(res, { budget: enriched }, 'Budget updated successfully.');
  } catch (err) {
    next(err);
  }
};

// ── DELETE ────────────────────────────────────────────────────────────────────
const deleteBudget = async (req, res, next) => {
  try {
    const [result] = await query(
      'DELETE FROM budgets WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Budget not found.' });
    }

    return sendNoContent(res);
  } catch (err) {
    next(err);
  }
};

// ── GET BUDGET ALERTS (budgets that have crossed their threshold) ──────────────
const getBudgetAlerts = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [budgets] = await query(
      `SELECT b.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ? AND b.is_active = 1
         AND b.start_date <= CURDATE() AND b.end_date >= CURDATE()`,
      [userId]
    );

    const enriched = await Promise.all(budgets.map(b => enrichBudget(b, userId)));
    const alerts   = enriched.filter(b => b.alert_triggered || b.is_exceeded);

    return sendSuccess(res, { alerts, count: alerts.length }, 'Budget alerts retrieved.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
  getBudgetAlerts,
};