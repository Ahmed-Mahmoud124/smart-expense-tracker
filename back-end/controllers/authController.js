'use strict';

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { query }       = require('../config/db');
const { sendSuccess, sendCreated } = require('../utils/responseHelper');

// ── Token factory ─────────────────────────────────────────────────────────────
const signAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const signRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });

// ── Register ──────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, currency = 'USD' } = req.body;

    // Uniqueness check
    const [existing] = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({
        success: false,
        message: 'An account with that email address already exists.',
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const [result] = await query(
      `INSERT INTO users (name, email, password_hash, currency)
       VALUES (?, ?, ?, ?)`,
      [name.trim(), email, passwordHash, currency]
    );

    const userId = result.insertId;

    // Seed default categories for the new user
    await seedDefaultCategories(userId);

    // Issue tokens
    const accessToken  = signAccessToken(userId);
    const refreshToken = signRefreshToken(userId);

    return sendCreated(res, {
      user: { id: userId, name: name.trim(), email, currency },
      accessToken,
      refreshToken,
    }, 'Account created successfully.');

  } catch (err) {
    next(err);
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Fetch user (include hash)
    const [rows] = await query(
      'SELECT id, name, email, password_hash, currency, is_active FROM users WHERE email = ?',
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Update last_login timestamp
    await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    const accessToken  = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    return sendSuccess(res, {
      user: {
        id      : user.id,
        name    : user.name,
        email   : user.email,
        currency: user.currency,
      },
      accessToken,
      refreshToken,
    }, 'Login successful.');

  } catch (err) {
    next(err);
  }
};

// ── Refresh Token ─────────────────────────────────────────────────────────────
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token is required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    // Confirm user still active
    const [rows] = await query(
      'SELECT id FROM users WHERE id = ? AND is_active = 1', [decoded.id]
    );
    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    const newAccessToken  = signAccessToken(decoded.id);
    const newRefreshToken = signRefreshToken(decoded.id);

    return sendSuccess(res, { accessToken: newAccessToken, refreshToken: newRefreshToken },
      'Token refreshed successfully.');

  } catch (err) {
    next(err);
  }
};

// ── Get current authenticated user ───────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const [rows] = await query(
      'SELECT id, name, email, currency, created_at, last_login FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return sendSuccess(res, { user: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── Change Password ───────────────────────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const [rows] = await query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const saltRounds   = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
    const newHash      = await bcrypt.hash(newPassword, saltRounds);

    await query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [newHash, userId]);

    return sendSuccess(res, null, 'Password changed successfully.');

  } catch (err) {
    next(err);
  }
};

// ── Helper: seed default categories for a brand-new user ─────────────────────
const seedDefaultCategories = async (userId) => {
  const defaults = [
    // Expenses
    { name: 'Food & Dining',      type: 'expense', icon: '🍔', color: '#FF6B6B' },
    { name: 'Transportation',     type: 'expense', icon: '🚗', color: '#4ECDC4' },
    { name: 'Shopping',           type: 'expense', icon: '🛍️', color: '#45B7D1' },
    { name: 'Entertainment',      type: 'expense', icon: '🎬', color: '#96CEB4' },
    { name: 'Healthcare',         type: 'expense', icon: '🏥', color: '#FFEAA7' },
    { name: 'Utilities',          type: 'expense', icon: '💡', color: '#DDA0DD' },
    { name: 'Housing',            type: 'expense', icon: '🏠', color: '#98D8C8' },
    { name: 'Education',          type: 'expense', icon: '📚', color: '#F7DC6F' },
    { name: 'Personal Care',      type: 'expense', icon: '💄', color: '#BB8FCE' },
    { name: 'Travel',             type: 'expense', icon: '✈️', color: '#85C1E9' },
    { name: 'Other Expense',      type: 'expense', icon: '💸', color: '#AED6F1' },
    // Income
    { name: 'Salary',             type: 'income',  icon: '💼', color: '#2ECC71' },
    { name: 'Freelance',          type: 'income',  icon: '💻', color: '#27AE60' },
    { name: 'Investment',         type: 'income',  icon: '📈', color: '#1ABC9C' },
    { name: 'Business',           type: 'income',  icon: '🏢', color: '#16A085' },
    { name: 'Gift',               type: 'income',  icon: '🎁', color: '#58D68D' },
    { name: 'Other Income',       type: 'income',  icon: '💰', color: '#A9DFBF' },
  ];

for (const c of defaults) {
  await query(
    `INSERT INTO categories (user_id, name, type, icon, color, is_default)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, c.name, c.type, c.icon, c.color, true]
  );
}
};

module.exports = { register, login, refreshToken, getMe, changePassword };