'use strict';

const { query } = require('../config/db');
const { sendSuccess, sendCreated, sendNoContent } = require('../utils/responseHelper');

const VALID_TYPES = ['income', 'expense'];

// ── GET ALL (scoped to user + system defaults) ────────────────────────────────
const getCategories = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    const conditions = ['(c.user_id = ? OR c.user_id IS NULL)', 'c.is_active = 1'];
    const params     = [userId];

    if (type && VALID_TYPES.includes(type)) {
      conditions.push('c.type = ?');
      params.push(type);
    }

    const [rows] = await query(
      `SELECT
         c.id, c.name, c.type, c.icon, c.color, c.is_default,
         c.user_id,
         COUNT(t.id) AS transaction_count
       FROM categories c
       LEFT JOIN transactions t ON t.category_id = c.id AND t.user_id = ?
       WHERE ${conditions.join(' AND ')}
       GROUP BY c.id
       ORDER BY c.type ASC, c.name ASC`,
      [userId, ...params]
    );

    return sendSuccess(res, { categories: rows }, 'Categories retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

// ── GET ONE ───────────────────────────────────────────────────────────────────
const getCategoryById = async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT c.*, COUNT(t.id) AS transaction_count
       FROM categories c
       LEFT JOIN transactions t ON t.category_id = c.id AND t.user_id = ?
       WHERE c.id = ? AND (c.user_id = ? OR c.user_id IS NULL) AND c.is_active = 1
       GROUP BY c.id`,
      [req.user.id, req.params.id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    return sendSuccess(res, { category: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── CREATE ────────────────────────────────────────────────────────────────────
const createCategory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, type, icon = '📦', color = '#95A5A6' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: 'Type must be "income" or "expense".' });
    }

    // Duplicate name check within user scope
    const [dup] = await query(
      `SELECT id FROM categories
       WHERE name = ? AND type = ? AND user_id = ? AND is_active = 1`,
      [name.trim(), type, userId]
    );
    if (dup.length) {
      return res.status(409).json({
        success: false,
        message: 'You already have a category with that name and type.',
      });
    }

    const [result] = await query(
      'INSERT INTO categories (user_id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)',
      [userId, name.trim(), type, icon, color]
    );

    const [rows] = await query('SELECT * FROM categories WHERE id = ?', [result.insertId]);

    return sendCreated(res, { category: rows[0] }, 'Category created successfully.');
  } catch (err) {
    next(err);
  }
};

// ── UPDATE ────────────────────────────────────────────────────────────────────
const updateCategory = async (req, res, next) => {
  try {
    const userId     = req.user.id;
    const categoryId = req.params.id;

    const [existing] = await query(
      'SELECT * FROM categories WHERE id = ? AND user_id = ? AND is_active = 1',
      [categoryId, userId]
    );

    if (!existing.length) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or cannot be modified (system default).',
      });
    }

    const cat   = existing[0];
    const name  = req.body.name  !== undefined ? req.body.name.trim() : cat.name;
    const icon  = req.body.icon  !== undefined ? req.body.icon        : cat.icon;
    const color = req.body.color !== undefined ? req.body.color       : cat.color;

    // Validate color format
    if (req.body.color && !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color)) {
      return res.status(400).json({ success: false, message: 'Color must be a valid hex code (e.g. #FF6B6B).' });
    }

    await query(
      'UPDATE categories SET name = ?, icon = ?, color = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [name, icon, color, categoryId, userId]
    );

    const [updated] = await query('SELECT * FROM categories WHERE id = ?', [categoryId]);

    return sendSuccess(res, { category: updated[0] }, 'Category updated successfully.');
  } catch (err) {
    next(err);
  }
};

// ── DELETE (soft delete) ──────────────────────────────────────────────────────
const deleteCategory = async (req, res, next) => {
  try {
    const userId     = req.user.id;
    const categoryId = req.params.id;

    // Only allow deleting user-owned categories
    const [existing] = await query(
      'SELECT * FROM categories WHERE id = ? AND user_id = ? AND is_active = 1',
      [categoryId, userId]
    );
    if (!existing.length) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or cannot be deleted (system default).',
      });
    }

    // Guard: block deletion if transactions reference this category
    const [[{ txCount }]] = await query(
      'SELECT COUNT(*) AS txCount FROM transactions WHERE category_id = ? AND user_id = ?',
      [categoryId, userId]
    );
    if (txCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete — ${txCount} transaction(s) use this category. Reassign them first.`,
      });
    }

    // Soft delete
    await query(
      'UPDATE categories SET is_active = 0, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [categoryId, userId]
    );

    return sendNoContent(res);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};