'use strict';

const bcrypt = require('bcryptjs');
const { query }      = require('../config/db');
const { sendSuccess, sendNoContent } = require('../utils/responseHelper');

// ── GET PROFILE ───────────────────────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [rows] = await query(
      `SELECT
         id, name, email, currency, timezone,
         monthly_income_goal, monthly_expense_limit,
         created_at, updated_at, last_login
       FROM users
       WHERE id = ? AND is_active = 1`,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Account statistics
    const [[stats]] = await query(
      `SELECT
         COUNT(*)                                                                     AS total_transactions,
         COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0)        AS total_income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)        AS total_expense,
         MIN(transaction_date)                                                        AS first_transaction_date,
         MAX(transaction_date)                                                        AS last_transaction_date
       FROM transactions
       WHERE user_id = ?`,
      [userId]
    );

    const [[budgetStats]] = await query(
      `SELECT
         COUNT(*)                                             AS total_budgets,
         SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END)     AS active_budgets
       FROM budgets
       WHERE user_id = ?`,
      [userId]
    );

    const [[categoryStats]] = await query(
      `SELECT COUNT(*) AS custom_categories
       FROM categories
       WHERE user_id = ? AND is_active = 1`,
      [userId]
    );

    return sendSuccess(res, {
      profile: rows[0],
      statistics: {
        total_transactions   : stats.total_transactions,
        total_income         : parseFloat(stats.total_income),
        total_expense        : parseFloat(stats.total_expense),
        net_balance          : parseFloat(stats.total_income) - parseFloat(stats.total_expense),
        first_transaction    : stats.first_transaction_date,
        last_transaction     : stats.last_transaction_date,
        total_budgets        : budgetStats.total_budgets,
        active_budgets       : budgetStats.active_budgets,
        custom_categories    : categoryStats.custom_categories,
      },
    }, 'Profile retrieved successfully.');

  } catch (err) {
    next(err);
  }
};

// ── UPDATE PROFILE ────────────────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      name,
      email,
      currency,
      timezone,
      monthly_income_goal,
      monthly_expense_limit,
    } = req.body;

    // Fetch current values
    const [existing] = await query(
      'SELECT * FROM users WHERE id = ? AND is_active = 1',
      [userId]
    );
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = existing[0];

    // Email uniqueness check (only if email is being changed)
    if (email && email !== user.email) {
      const [dup] = await query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );
      if (dup.length) {
        return res.status(409).json({
          success: false,
          message: 'That email address is already in use by another account.',
        });
      }
    }

    const updatedName                = name                 !== undefined ? name.trim()            : user.name;
    const updatedEmail               = email                !== undefined ? email                  : user.email;
    const updatedCurrency            = currency             !== undefined ? currency               : user.currency;
    const updatedTimezone            = timezone             !== undefined ? timezone.trim()         : user.timezone;
    const updatedMonthlyIncomeGoal   = monthly_income_goal  !== undefined ? monthly_income_goal    : user.monthly_income_goal;
    const updatedMonthlyExpenseLimit = monthly_expense_limit !== undefined ? monthly_expense_limit : user.monthly_expense_limit;

    await query(
      `UPDATE users
       SET name = ?, email = ?, currency = ?, timezone = ?,
           monthly_income_goal = ?, monthly_expense_limit = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [
        updatedName, updatedEmail, updatedCurrency, updatedTimezone,
        updatedMonthlyIncomeGoal, updatedMonthlyExpenseLimit,
        userId,
      ]
    );

    const [updated] = await query(
      `SELECT id, name, email, currency, timezone,
              monthly_income_goal, monthly_expense_limit,
              created_at, updated_at, last_login
       FROM users WHERE id = ?`,
      [userId]
    );

    return sendSuccess(res, { profile: updated[0] }, 'Profile updated successfully.');
  } catch (err) {
    next(err);
  }
};

// ── DELETE ACCOUNT (soft delete) ──────────────────────────────────────────────
const deleteAccount = async (req, res, next) => {
  try {
    const userId   = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required to delete account.' });
    }

    const [rows] = await query(
      'SELECT password_hash FROM users WHERE id = ? AND is_active = 1',
      [userId]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(password, rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    // Soft delete — preserve data for audit/recovery
    await query(
      "UPDATE users SET is_active = 0, email = CONCAT(email, '_deleted_', id), updated_at = NOW() WHERE id = ?",
      [userId]
    );

    return sendNoContent(res);
  } catch (err) {
    next(err);
  }
};

// ── GET FINANCIAL GOALS PROGRESS ─────────────────────────────────────────────
const getGoalsProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now    = new Date();
    const year   = now.getFullYear();
    const month  = String(now.getMonth() + 1).padStart(2, '0');

    const monthStart = `${year}-${month}-01`;
    const monthEnd   = new Date(year, now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [[user]] = await query(
      'SELECT monthly_income_goal, monthly_expense_limit, currency FROM users WHERE id = ?',
      [userId]
    );

    const [[totals]] = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) AS month_income,
         COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) AS month_expense
       FROM transactions
       WHERE user_id = ? AND transaction_date BETWEEN ? AND ?`,
      [userId, monthStart, monthEnd]
    );

    const monthIncome  = parseFloat(totals.month_income);
    const monthExpense = parseFloat(totals.month_expense);

    const incomeGoal   = user.monthly_income_goal   ? parseFloat(user.monthly_income_goal)   : null;
    const expenseLimit = user.monthly_expense_limit ? parseFloat(user.monthly_expense_limit) : null;

    return sendSuccess(res, {
      currency: user.currency,
      period  : { start: monthStart, end: monthEnd },
      income_goal: incomeGoal ? {
        goal      : incomeGoal,
        actual    : monthIncome,
        remaining : Math.max(incomeGoal - monthIncome, 0),
        percentage: parseFloat(((monthIncome / incomeGoal) * 100).toFixed(2)),
        achieved  : monthIncome >= incomeGoal,
      } : null,
      expense_limit: expenseLimit ? {
        limit     : expenseLimit,
        actual    : monthExpense,
        remaining : Math.max(expenseLimit - monthExpense, 0),
        percentage: parseFloat(((monthExpense / expenseLimit) * 100).toFixed(2)),
        exceeded  : monthExpense > expenseLimit,
      } : null,
    }, 'Goals progress retrieved successfully.');

  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, deleteAccount, getGoalsProgress };