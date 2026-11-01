'use strict';

const { query } = require('../config/db');
const { sendSuccess } = require('../utils/responseHelper');

// ── MAIN DASHBOARD SUMMARY ────────────────────────────────────────────────────
const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now    = new Date();
    const year   = now.getFullYear();
    const month  = String(now.getMonth() + 1).padStart(2, '0');

    const currentMonthStart = `${year}-${month}-01`;
    const currentMonthEnd   = new Date(year, now.getMonth() + 1, 0)
      .toISOString().split('T')[0];

    // ── 1. Current month totals ────────────────────────────────────────────────
    const [[monthTotals]] = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS month_income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS month_expense,
         COUNT(*) AS transaction_count
       FROM transactions
       WHERE user_id = ?
         AND transaction_date BETWEEN ? AND ?`,
      [userId, currentMonthStart, currentMonthEnd]
    );

    // ── 2. All-time totals ─────────────────────────────────────────────────────
    const [[allTimeTotals]] = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS total_income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
       FROM transactions
       WHERE user_id = ?`,
      [userId]
    );

    // ── 3. Monthly trend — last 12 months ─────────────────────────────────────
    const [monthlyTrend] = await query(
      `SELECT
         DATE_FORMAT(transaction_date, '%Y-%m') AS month,
         COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
       FROM transactions
       WHERE user_id = ?
         AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
       ORDER BY month ASC`,
      [userId]
    );

    // ── 4. Top 5 expense categories this month ────────────────────────────────
    const [topCategories] = await query(
      `SELECT
         c.id, c.name, c.icon, c.color,
         SUM(t.amount) AS total,
         COUNT(t.id)   AS count
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ?
         AND t.type = 'expense'
         AND t.transaction_date BETWEEN ? AND ?
       GROUP BY c.id, c.name, c.icon, c.color
       ORDER BY total DESC
       LIMIT 5`,
      [userId, currentMonthStart, currentMonthEnd]
    );

    // ── 5. Recent 5 transactions ───────────────────────────────────────────────
    const [recentTransactions] = await query(
      `SELECT
         t.id, t.type, t.amount, t.description, t.transaction_date,
         c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ?
       ORDER BY t.transaction_date DESC, t.id DESC
       LIMIT 5`,
      [userId]
    );

    // ── 6. Active budgets with spending ───────────────────────────────────────
    const [activeBudgets] = await query(
      `SELECT b.*, c.name AS category_name, c.icon AS category_icon
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ? AND b.is_active = 1
         AND b.start_date <= CURDATE() AND b.end_date >= CURDATE()
       ORDER BY b.created_at DESC
       LIMIT 5`,
      [userId]
    );

    // Enrich budgets with spending
    const enrichedBudgets = await Promise.all(
      activeBudgets.map(async (budget) => {
        const conditions = [
          'user_id = ?', "type = 'expense'",
          'transaction_date >= ?', 'transaction_date <= ?',
        ];
        const params = [userId, budget.start_date, budget.end_date];

        if (budget.category_id) {
          conditions.push('category_id = ?');
          params.push(budget.category_id);
        }

        const [[{ spent }]] = await query(
          `SELECT COALESCE(SUM(amount), 0) AS spent
           FROM transactions WHERE ${conditions.join(' AND ')}`,
          params
        );

        const spentNum   = parseFloat(spent);
        const percentage = budget.amount > 0 ? (spentNum / budget.amount) * 100 : 0;

        return {
          ...budget,
          spent           : parseFloat(spentNum.toFixed(2)),
          remaining       : parseFloat((budget.amount - spentNum).toFixed(2)),
          percentage_used : parseFloat(percentage.toFixed(2)),
          is_exceeded     : spentNum > budget.amount,
          alert_triggered : percentage >= (budget.alert_threshold || 80),
        };
      })
    );

    const netBalance = parseFloat(allTimeTotals.total_income) - parseFloat(allTimeTotals.total_expense);

    return sendSuccess(res, {
      current_month: {
        income           : parseFloat(monthTotals.month_income),
        expense          : parseFloat(monthTotals.month_expense),
        net              : parseFloat(monthTotals.month_income) - parseFloat(monthTotals.month_expense),
        transaction_count: monthTotals.transaction_count,
        period_start     : currentMonthStart,
        period_end       : currentMonthEnd,
      },
      all_time: {
        total_income : parseFloat(allTimeTotals.total_income),
        total_expense: parseFloat(allTimeTotals.total_expense),
        net_balance  : parseFloat(netBalance.toFixed(2)),
      },
      monthly_trend      : monthlyTrend,
      top_categories     : topCategories,
      recent_transactions: recentTransactions,
      active_budgets     : enrichedBudgets,
    }, 'Dashboard data retrieved successfully.');

  } catch (err) {
    next(err);
  }
};

// ── ANALYTICS: monthly income vs expense (configurable range) ─────────────────
const getMonthlyAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const months = Math.min(parseInt(req.query.months, 10) || 12, 24);

    const [rows] = await query(
      `SELECT
         DATE_FORMAT(transaction_date, '%Y-%m')                                AS month,
         DATE_FORMAT(MIN(transaction_date), '%b %Y')                          AS label,
         COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0)    AS income,
         COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0)    AS expense,
         COALESCE(SUM(CASE WHEN type='income'  THEN amount
                          WHEN type='expense' THEN -amount END), 0)           AS net
       FROM transactions
       WHERE user_id = ?
         AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
       GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
       ORDER BY month ASC`,
      [userId, months]
    );

    return sendSuccess(res, { monthly_analytics: rows, months_requested: months });
  } catch (err) {
    next(err);
  }
};

// ── ANALYTICS: category breakdown for a period ────────────────────────────────
const getCategoryBreakdown = async (req, res, next) => {
  try {
    const userId     = req.user.id;
    const type       = req.query.type       || 'expense';
    const start_date = req.query.start_date || null;
    const end_date   = req.query.end_date   || null;

    const conditions = ['t.user_id = ?', 't.type = ?'];
    const params     = [userId, type];

    if (start_date) { conditions.push('t.transaction_date >= ?'); params.push(start_date); }
    if (end_date)   { conditions.push('t.transaction_date <= ?'); params.push(end_date); }

    const [rows] = await query(
      `SELECT
         c.id, c.name, c.icon, c.color,
         SUM(t.amount)                                   AS total,
         COUNT(t.id)                                     AS count,
         ROUND(SUM(t.amount) * 100.0 /
           SUM(SUM(t.amount)) OVER (), 2)                AS percentage
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY c.id, c.name, c.icon, c.color
       ORDER BY total DESC`,
      params
    );

    const grandTotal = rows.reduce((sum, r) => sum + parseFloat(r.total), 0);

    return sendSuccess(res, {
      breakdown  : rows,
      grand_total: parseFloat(grandTotal.toFixed(2)),
      type,
    });
  } catch (err) {
    next(err);
  }
};

// ── ANALYTICS: daily spending for current / specified month ───────────────────
const getDailySpending = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now    = new Date();
    const year   = parseInt(req.query.year,  10) || now.getFullYear();
    const month  = parseInt(req.query.month, 10) || (now.getMonth() + 1);

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate   = new Date(year, month, 0).toISOString().split('T')[0];

    const [rows] = await query(
      `SELECT
         DAY(transaction_date)                                                        AS day,
         DATE_FORMAT(transaction_date, '%Y-%m-%d')                                   AS date,
         COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0)           AS income,
         COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0)           AS expense
       FROM transactions
       WHERE user_id = ?
         AND transaction_date BETWEEN ? AND ?
       GROUP BY DAY(transaction_date), DATE_FORMAT(transaction_date, '%Y-%m-%d')
       ORDER BY date ASC`,
      [userId, startDate, endDate]
    );

    return sendSuccess(res, {
      daily_spending: rows,
      period        : { start: startDate, end: endDate, year, month },
    });
  } catch (err) {
    next(err);
  }
};

// ── ANALYTICS: year-over-year comparison ─────────────────────────────────────
const getYearlyComparison = async (req, res, next) => {
  try {
    const userId      = req.user.id;
    const currentYear = new Date().getFullYear();
    const years       = [currentYear - 1, currentYear];

    const [rows] = await query(
      `SELECT
         YEAR(transaction_date)                                                       AS year,
         COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0)           AS total_income,
         COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0)           AS total_expense,
         COUNT(*)                                                                     AS transaction_count
       FROM transactions
       WHERE user_id = ? AND YEAR(transaction_date) IN (?, ?)
       GROUP BY YEAR(transaction_date)
       ORDER BY year ASC`,
      [userId, ...years]
    );

    return sendSuccess(res, { yearly_comparison: rows, years });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardSummary,
  getMonthlyAnalytics,
  getCategoryBreakdown,
  getDailySpending,
  getYearlyComparison,
};