-- ============================================================
--  Web-Based Personal Expense Tracker
--  Seed Data  —  MySQL 8.x
--  Passwords (both users): Test@1234
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ── Clean slate ──────────────────────────────────────────────
TRUNCATE TABLE budget_alerts;
TRUNCATE TABLE budgets;
TRUNCATE TABLE transactions;
TRUNCATE TABLE categories;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
--  USERS
--  password_hash = bcrypt(Test@1234, rounds=12)
-- ============================================================
INSERT INTO users
  (id, name, email, password_hash, currency, timezone,
   monthly_income_goal, monthly_expense_limit, is_active, last_login)
VALUES
(1,
 'Ahmed Hassan',
 'ahmed@example.com',
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i',
 'EGP', 'Africa/Cairo', 25000.00, 18000.00, 1, NOW()),
(2,
 'Sara Mohamed',
 'sara@example.com',
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i',
 'USD', 'America/New_York', 5000.00, 3500.00, 1, NOW());

-- ============================================================
--  CATEGORIES — User 1 (Ahmed)
-- ============================================================
INSERT INTO categories (id, user_id, name, type, icon, color, is_default, is_active) VALUES
-- Expense categories
(1,  1, 'Food & Dining',    'expense', '🍔', '#FF6B6B', 1, 1),
(2,  1, 'Transportation',   'expense', '🚗', '#4ECDC4', 1, 1),
(3,  1, 'Shopping',         'expense', '🛍️', '#45B7D1', 1, 1),
(4,  1, 'Entertainment',    'expense', '🎬', '#96CEB4', 1, 1),
(5,  1, 'Healthcare',       'expense', '🏥', '#FFEAA7', 1, 1),
(6,  1, 'Utilities',        'expense', '💡', '#DDA0DD', 1, 1),
(7,  1, 'Housing',          'expense', '🏠', '#98D8C8', 1, 1),
(8,  1, 'Education',        'expense', '📚', '#F7DC6F', 1, 1),
(9,  1, 'Personal Care',    'expense', '💄', '#BB8FCE', 1, 1),
(10, 1, 'Travel',           'expense', '✈️', '#85C1E9', 1, 1),
(11, 1, 'Other Expense',    'expense', '💸', '#AED6F1', 1, 1),
-- Income categories
(12, 1, 'Salary',           'income',  '💼', '#2ECC71', 1, 1),
(13, 1, 'Freelance',        'income',  '💻', '#27AE60', 1, 1),
(14, 1, 'Investment',       'income',  '📈', '#1ABC9C', 1, 1),
(15, 1, 'Business',         'income',  '🏢', '#16A085', 1, 1),
(16, 1, 'Gift',             'income',  '🎁', '#58D68D', 1, 1),
(17, 1, 'Other Income',     'income',  '💰', '#A9DFBF', 1, 1);

-- ============================================================
--  CATEGORIES — User 2 (Sara)
-- ============================================================
INSERT INTO categories (id, user_id, name, type, icon, color, is_default, is_active) VALUES
(18, 2, 'Food & Dining',    'expense', '🍔', '#FF6B6B', 1, 1),
(19, 2, 'Transportation',   'expense', '🚗', '#4ECDC4', 1, 1),
(20, 2, 'Shopping',         'expense', '🛍️', '#45B7D1', 1, 1),
(21, 2, 'Entertainment',    'expense', '🎬', '#96CEB4', 1, 1),
(22, 2, 'Healthcare',       'expense', '🏥', '#FFEAA7', 1, 1),
(23, 2, 'Utilities',        'expense', '💡', '#DDA0DD', 1, 1),
(24, 2, 'Housing',          'expense', '🏠', '#98D8C8', 1, 1),
(25, 2, 'Education',        'expense', '📚', '#F7DC6F', 1, 1),
(26, 2, 'Personal Care',    'expense', '💄', '#BB8FCE', 1, 1),
(27, 2, 'Travel',           'expense', '✈️', '#85C1E9', 1, 1),
(28, 2, 'Other Expense',    'expense', '💸', '#AED6F1', 1, 1),
(29, 2, 'Salary',           'income',  '💼', '#2ECC71', 1, 1),
(30, 2, 'Freelance',        'income',  '💻', '#27AE60', 1, 1),
(31, 2, 'Investment',       'income',  '📈', '#1ABC9C', 1, 1),
(32, 2, 'Gift',             'income',  '🎁', '#58D68D', 1, 1),
(33, 2, 'Other Income',     'income',  '💰', '#A9DFBF', 1, 1);

-- ============================================================
--  TRANSACTIONS — User 1 (Ahmed, currency: EGP)
--  6 months of data: Jan–Jun current year
-- ============================================================
SET @Y = YEAR(CURDATE());

INSERT INTO transactions
  (user_id, category_id, type, amount, description, transaction_date, notes)
VALUES
-- ── January ──────────────────────────────────────────────────
(1, 12, 'income',  22000.00, 'Monthly Salary - January',      DATE(CONCAT(@Y,'-01-01')), 'Net salary after tax'),
(1, 13, 'income',   3500.00, 'Freelance Web Project',         DATE(CONCAT(@Y,'-01-10')), 'E-commerce website redesign'),
(1,  7, 'expense',  8000.00, 'Monthly Rent',                  DATE(CONCAT(@Y,'-01-02')), 'Apartment rent'),
(1,  6, 'expense',   850.00, 'Electricity Bill',              DATE(CONCAT(@Y,'-01-05')), NULL),
(1,  6, 'expense',   320.00, 'Internet Bill',                 DATE(CONCAT(@Y,'-01-05')), NULL),
(1,  1, 'expense',  2400.00, 'Groceries & Supermarket',       DATE(CONCAT(@Y,'-01-08')), NULL),
(1,  1, 'expense',   650.00, 'Restaurant - Family Dinner',    DATE(CONCAT(@Y,'-01-15')), 'Birthday celebration'),
(1,  2, 'expense',   900.00, 'Monthly Metro Card',            DATE(CONCAT(@Y,'-01-03')), NULL),
(1,  2, 'expense',   450.00, 'Uber Rides',                    DATE(CONCAT(@Y,'-01-20')), NULL),
(1,  3, 'expense',  1200.00, 'Clothing & Accessories',        DATE(CONCAT(@Y,'-01-22')), NULL),
(1,  8, 'expense',   500.00, 'Online Course Subscription',    DATE(CONCAT(@Y,'-01-12')), 'Udemy annual plan'),
(1,  4, 'expense',   350.00, 'Cinema & Entertainment',        DATE(CONCAT(@Y,'-01-25')), NULL),

-- ── February ─────────────────────────────────────────────────
(1, 12, 'income',  22000.00, 'Monthly Salary - February',     DATE(CONCAT(@Y,'-02-01')), 'Net salary after tax'),
(1, 14, 'income',   1200.00, 'Stock Dividends',               DATE(CONCAT(@Y,'-02-14')), 'Q4 dividends'),
(1,  7, 'expense',  8000.00, 'Monthly Rent',                  DATE(CONCAT(@Y,'-02-02')), NULL),
(1,  6, 'expense',   780.00, 'Electricity Bill',              DATE(CONCAT(@Y,'-02-05')), NULL),
(1,  6, 'expense',   320.00, 'Internet Bill',                 DATE(CONCAT(@Y,'-02-05')), NULL),
(1,  1, 'expense',  2100.00, 'Groceries & Supermarket',       DATE(CONCAT(@Y,'-02-10')), NULL),
(1,  1, 'expense',   480.00, 'Lunch Deliveries',              DATE(CONCAT(@Y,'-02-18')), NULL),
(1,  2, 'expense',   900.00, 'Monthly Metro Card',            DATE(CONCAT(@Y,'-02-03')), NULL),
(1,  5, 'expense',   750.00, 'Dentist Visit',                 DATE(CONCAT(@Y,'-02-20')), NULL),
(1,  9, 'expense',   300.00, 'Haircut & Grooming',            DATE(CONCAT(@Y,'-02-22')), NULL),
(1,  4, 'expense',   420.00, 'Gaming Subscription',           DATE(CONCAT(@Y,'-02-25')), NULL),

-- ── March ────────────────────────────────────────────────────
(1, 12, 'income',  22000.00, 'Monthly Salary - March',        DATE(CONCAT(@Y,'-03-01')), NULL),
(1, 13, 'income',   5000.00, 'Freelance Mobile App',          DATE(CONCAT(@Y,'-03-15')), 'React Native project'),
(1,  7, 'expense',  8000.00, 'Monthly Rent',                  DATE(CONCAT(@Y,'-03-02')), NULL),
(1,  6, 'expense',   900.00, 'Electricity Bill',              DATE(CONCAT(@Y,'-03-05')), 'Higher due to AC'),
(1,  6, 'expense',   320.00, 'Internet Bill',                 DATE(CONCAT(@Y,'-03-05')), NULL),
(1,  1, 'expense',  2600.00, 'Groceries & Supermarket',       DATE(CONCAT(@Y,'-03-09')), NULL),
(1,  2, 'expense',   900.00, 'Monthly Metro Card',            DATE(CONCAT(@Y,'-03-03')), NULL),
(1,  2, 'expense',   600.00, 'Car Maintenance',               DATE(CONCAT(@Y,'-03-18')), 'Oil change & tyres'),
(1, 10, 'expense',  3500.00, 'Weekend Trip to Alexandria',    DATE(CONCAT(@Y,'-03-22')), 'Hotel + transport'),
(1,  3, 'expense',  1800.00, 'Electronics - Keyboard',        DATE(CONCAT(@Y,'-03-28')), 'Mechanical keyboard'),
(1,  4, 'expense',   250.00, 'Streaming Services',            DATE(CONCAT(@Y,'-03-10')), NULL),

-- ── April ────────────────────────────────────────────────────
(1, 12, 'income',  22000.00, 'Monthly Salary - April',        DATE(CONCAT(@Y,'-04-01')), NULL),
(1, 16, 'income',   2000.00, 'Eid Gift Money',                DATE(CONCAT(@Y,'-04-10')), NULL),
(1,  7, 'expense',  8000.00, 'Monthly Rent',                  DATE(CONCAT(@Y,'-04-02')), NULL),
(1,  6, 'expense',   860.00, 'Electricity Bill',              DATE(CONCAT(@Y,'-04-05')), NULL),
(1,  6, 'expense',   320.00, 'Internet Bill',                 DATE(CONCAT(@Y,'-04-05')), NULL),
(1,  1, 'expense',  3200.00, 'Ramadan Groceries',             DATE(CONCAT(@Y,'-04-08')), 'Extra groceries for Ramadan'),
(1,  1, 'expense',   900.00, 'Iftar Gatherings',              DATE(CONCAT(@Y,'-04-15')), NULL),
(1,  2, 'expense',   900.00, 'Monthly Metro Card',            DATE(CONCAT(@Y,'-04-03')), NULL),
(1,  3, 'expense',  2500.00, 'Eid Clothes Shopping',          DATE(CONCAT(@Y,'-04-18')), NULL),
(1,  5, 'expense',   400.00, 'Pharmacy & Vitamins',           DATE(CONCAT(@Y,'-04-22')), NULL),
(1,  8, 'expense',   600.00, 'Books & Study Materials',       DATE(CONCAT(@Y,'-04-25')), NULL),

-- ── May ──────────────────────────────────────────────────────
(1, 12, 'income',  22000.00, 'Monthly Salary - May',          DATE(CONCAT(@Y,'-05-01')), NULL),
(1, 13, 'income',   4200.00, 'Freelance Dashboard Project',   DATE(CONCAT(@Y,'-05-20')), 'Analytics dashboard'),
(1,  7, 'expense',  8000.00, 'Monthly Rent',                  DATE(CONCAT(@Y,'-05-02')), NULL),
(1,  6, 'expense',  1100.00, 'Electricity Bill',              DATE(CONCAT(@Y,'-05-05')), 'Summer starts'),
(1,  6, 'expense',   320.00, 'Internet Bill',                 DATE(CONCAT(@Y,'-05-05')), NULL),
(1,  1, 'expense',  2300.00, 'Groceries & Supermarket',       DATE(CONCAT(@Y,'-05-10')), NULL),
(1,  2, 'expense',   900.00, 'Monthly Metro Card',            DATE(CONCAT(@Y,'-05-03')), NULL),
(1,  2, 'expense',   750.00, 'Uber Rides',                    DATE(CONCAT(@Y,'-05-18')), NULL),
(1,  4, 'expense',   800.00, 'Concert Tickets',               DATE(CONCAT(@Y,'-05-25')), NULL),
(1,  9, 'expense',   450.00, 'Gym Membership',                DATE(CONCAT(@Y,'-05-01')), 'Monthly gym fee'),
(1,  3, 'expense',   950.00, 'Home Accessories',              DATE(CONCAT(@Y,'-05-28')), NULL),

-- ── June (current month — partial) ───────────────────────────
(1, 12, 'income',  22000.00, 'Monthly Salary - June',         DATE(CONCAT(@Y,'-06-01')), NULL),
(1,  7, 'expense',  8000.00, 'Monthly Rent',                  DATE(CONCAT(@Y,'-06-02')), NULL),
(1,  6, 'expense',  1250.00, 'Electricity Bill',              DATE(CONCAT(@Y,'-06-05')), 'Peak summer'),
(1,  6, 'expense',   320.00, 'Internet Bill',                 DATE(CONCAT(@Y,'-06-05')), NULL),
(1,  1, 'expense',  2200.00, 'Groceries & Supermarket',       DATE(CONCAT(@Y,'-06-07')), NULL),
(1,  2, 'expense',   900.00, 'Monthly Metro Card',            DATE(CONCAT(@Y,'-06-03')), NULL),
(1,  9, 'expense',   450.00, 'Gym Membership',                DATE(CONCAT(@Y,'-06-01')), NULL);

-- ============================================================
--  TRANSACTIONS — User 2 (Sara, currency: USD)
-- ============================================================
INSERT INTO transactions
  (user_id, category_id, type, amount, description, transaction_date, notes)
VALUES
-- ── January ──────────────────────────────────────────────────
(2, 29, 'income',  4800.00, 'Monthly Salary - January',       DATE(CONCAT(@Y,'-01-01')), NULL),
(2, 30, 'income',   650.00, 'Freelance Writing',              DATE(CONCAT(@Y,'-01-14')), NULL),
(2, 24, 'expense', 1500.00, 'Rent',                           DATE(CONCAT(@Y,'-01-01')), NULL),
(2, 23, 'expense',  120.00, 'Electric & Gas',                 DATE(CONCAT(@Y,'-01-05')), NULL),
(2, 23, 'expense',   60.00, 'Internet',                       DATE(CONCAT(@Y,'-01-05')), NULL),
(2, 18, 'expense',  380.00, 'Groceries',                      DATE(CONCAT(@Y,'-01-08')), NULL),
(2, 19, 'expense',  110.00, 'Monthly Transit Pass',           DATE(CONCAT(@Y,'-01-03')), NULL),
(2, 20, 'expense',  240.00, 'Clothing',                       DATE(CONCAT(@Y,'-01-20')), NULL),
(2, 21, 'expense',   45.00, 'Netflix & Spotify',              DATE(CONCAT(@Y,'-01-12')), NULL),
(2, 25, 'expense',   89.00, 'Coursera Subscription',          DATE(CONCAT(@Y,'-01-15')), NULL),

-- ── February ─────────────────────────────────────────────────
(2, 29, 'income',  4800.00, 'Monthly Salary - February',      DATE(CONCAT(@Y,'-02-01')), NULL),
(2, 31, 'income',   320.00, 'Stock Dividends',                DATE(CONCAT(@Y,'-02-14')), NULL),
(2, 24, 'expense', 1500.00, 'Rent',                           DATE(CONCAT(@Y,'-02-01')), NULL),
(2, 23, 'expense',  110.00, 'Electric & Gas',                 DATE(CONCAT(@Y,'-02-05')), NULL),
(2, 23, 'expense',   60.00, 'Internet',                       DATE(CONCAT(@Y,'-02-05')), NULL),
(2, 18, 'expense',  350.00, 'Groceries',                      DATE(CONCAT(@Y,'-02-10')), NULL),
(2, 18, 'expense',   95.00, 'Valentine Restaurant',           DATE(CONCAT(@Y,'-02-14')), NULL),
(2, 19, 'expense',  110.00, 'Monthly Transit Pass',           DATE(CONCAT(@Y,'-02-03')), NULL),
(2, 22, 'expense',  200.00, 'Medical Checkup',                DATE(CONCAT(@Y,'-02-20')), NULL),
(2, 21, 'expense',   60.00, 'Movie Night & Bowling',          DATE(CONCAT(@Y,'-02-22')), NULL),

-- ── March ────────────────────────────────────────────────────
(2, 29, 'income',  4800.00, 'Monthly Salary - March',         DATE(CONCAT(@Y,'-03-01')), NULL),
(2, 30, 'income',  1100.00, 'Freelance Content Writing',      DATE(CONCAT(@Y,'-03-18')), NULL),
(2, 24, 'expense', 1500.00, 'Rent',                           DATE(CONCAT(@Y,'-03-01')), NULL),
(2, 23, 'expense',  130.00, 'Electric & Gas',                 DATE(CONCAT(@Y,'-03-05')), NULL),
(2, 23, 'expense',   60.00, 'Internet',                       DATE(CONCAT(@Y,'-03-05')), NULL),
(2, 18, 'expense',  400.00, 'Groceries',                      DATE(CONCAT(@Y,'-03-09')), NULL),
(2, 19, 'expense',  110.00, 'Monthly Transit Pass',           DATE(CONCAT(@Y,'-03-03')), NULL),
(2, 27, 'expense',  850.00, 'Spring Break Trip',              DATE(CONCAT(@Y,'-03-22')), 'Weekend getaway'),
(2, 20, 'expense',  320.00, 'Spring Clothing',                DATE(CONCAT(@Y,'-03-28')), NULL),

-- ── April ────────────────────────────────────────────────────
(2, 29, 'income',  4800.00, 'Monthly Salary - April',         DATE(CONCAT(@Y,'-04-01')), NULL),
(2, 24, 'expense', 1500.00, 'Rent',                           DATE(CONCAT(@Y,'-04-01')), NULL),
(2, 23, 'expense',  115.00, 'Electric & Gas',                 DATE(CONCAT(@Y,'-04-05')), NULL),
(2, 23, 'expense',   60.00, 'Internet',                       DATE(CONCAT(@Y,'-04-05')), NULL),
(2, 18, 'expense',  370.00, 'Groceries',                      DATE(CONCAT(@Y,'-04-08')), NULL),
(2, 19, 'expense',  110.00, 'Monthly Transit Pass',           DATE(CONCAT(@Y,'-04-03')), NULL),
(2, 22, 'expense',  150.00, 'Pharmacy',                       DATE(CONCAT(@Y,'-04-15')), NULL),
(2, 21, 'expense',   80.00, 'Concert',                        DATE(CONCAT(@Y,'-04-22')), NULL),

-- ── May ──────────────────────────────────────────────────────
(2, 29, 'income',  5200.00, 'Monthly Salary - May (Bonus)',   DATE(CONCAT(@Y,'-05-01')), 'Performance bonus included'),
(2, 30, 'income',   900.00, 'Freelance Social Media',         DATE(CONCAT(@Y,'-05-22')), NULL),
(2, 24, 'expense', 1500.00, 'Rent',                           DATE(CONCAT(@Y,'-05-01')), NULL),
(2, 23, 'expense',  125.00, 'Electric & Gas',                 DATE(CONCAT(@Y,'-05-05')), NULL),
(2, 23, 'expense',   60.00, 'Internet',                       DATE(CONCAT(@Y,'-05-05')), NULL),
(2, 18, 'expense',  420.00, 'Groceries',                      DATE(CONCAT(@Y,'-05-10')), NULL),
(2, 19, 'expense',  110.00, 'Monthly Transit Pass',           DATE(CONCAT(@Y,'-05-03')), NULL),
(2, 20, 'expense',  480.00, 'Summer Shopping',                DATE(CONCAT(@Y,'-05-25')), NULL),
(2, 26, 'expense',   75.00, 'Haircut & Beauty',               DATE(CONCAT(@Y,'-05-18')), NULL),

-- ── June (partial) ────────────────────────────────────────────
(2, 29, 'income',  4800.00, 'Monthly Salary - June',          DATE(CONCAT(@Y,'-06-01')), NULL),
(2, 24, 'expense', 1500.00, 'Rent',                           DATE(CONCAT(@Y,'-06-01')), NULL),
(2, 23, 'expense',  130.00, 'Electric & Gas',                 DATE(CONCAT(@Y,'-06-05')), NULL),
(2, 23, 'expense',   60.00, 'Internet',                       DATE(CONCAT(@Y,'-06-05')), NULL),
(2, 18, 'expense',  360.00, 'Groceries',                      DATE(CONCAT(@Y,'-06-07')), NULL),
(2, 19, 'expense',  110.00, 'Monthly Transit Pass',           DATE(CONCAT(@Y,'-06-03')), NULL);

-- ============================================================
--  BUDGETS — User 1 (Ahmed)
-- ============================================================
INSERT INTO budgets
  (user_id, category_id, name, amount, period, start_date, end_date, alert_threshold, is_active, notes)
VALUES
(1, NULL, 'Monthly Overall Budget',  18000.00, 'monthly',
  DATE(CONCAT(@Y,'-06-01')), DATE(CONCAT(@Y,'-06-30')), 80.00, 1, 'Total monthly spending cap'),

(1, 1,   'Food & Dining Budget',      3500.00, 'monthly',
  DATE(CONCAT(@Y,'-06-01')), DATE(CONCAT(@Y,'-06-30')), 75.00, 1, 'Groceries + restaurants'),

(1, 7,   'Housing Budget',            8500.00, 'monthly',
  DATE(CONCAT(@Y,'-06-01')), DATE(CONCAT(@Y,'-06-30')), 90.00, 1, 'Rent + utilities'),

(1, 2,   'Transportation Budget',     1800.00, 'monthly',
  DATE(CONCAT(@Y,'-06-01')), DATE(CONCAT(@Y,'-06-30')), 80.00, 1, NULL),

(1, 10,  'Annual Travel Budget',     15000.00, 'yearly',
  DATE(CONCAT(@Y,'-01-01')), DATE(CONCAT(@Y,'-12-31')), 70.00, 1, 'Holidays and trips'),

(1, 3,   'Shopping Budget',           3000.00, 'monthly',
  DATE(CONCAT(@Y,'-06-01')), DATE(CONCAT(@Y,'-06-30')), 80.00, 1, NULL);

-- ============================================================
--  BUDGETS — User 2 (Sara)
-- ============================================================
INSERT INTO budgets
  (user_id, category_id, name, amount, period, start_date, end_date, alert_threshold, is_active, notes)
VALUES
(2, NULL, 'Monthly Overall Budget',   3500.00, 'monthly',
  DATE(CONCAT(@Y,'-06-01')), DATE(CONCAT(@Y,'-06-30')), 80.00, 1, NULL),

(2, 18,  'Food Budget',                500.00, 'monthly',
  DATE(CONCAT(@Y,'-06-01')), DATE(CONCAT(@Y,'-06-30')), 80.00, 1, NULL),

(2, 24,  'Housing Budget',            1700.00, 'monthly',
  DATE(CONCAT(@Y,'-06-01')), DATE(CONCAT(@Y,'-06-30')), 90.00, 1, 'Rent + utilities'),

(2, 27,  'Annual Travel Budget',      4000.00, 'yearly',
  DATE(CONCAT(@Y,'-01-01')), DATE(CONCAT(@Y,'-12-31')), 70.00, 1, NULL),

(2, 20,  'Shopping Budget',            600.00, 'monthly',
  DATE(CONCAT(@Y,'-06-01')), DATE(CONCAT(@Y,'-06-30')), 75.00, 1, NULL);

-- ============================================================
--  BUDGET ALERTS (sample historical alerts)
-- ============================================================
INSERT INTO budget_alerts (budget_id, user_id, alert_type, percentage, amount_spent, fired_at)
VALUES
(1, 1, 'threshold_reached', 82.50, 14850.00, DATE(CONCAT(@Y,'-05-25 10:30:00'))),
(2, 1, 'budget_exceeded',  105.20,  3682.00, DATE(CONCAT(@Y,'-04-28 14:15:00'))),
(7, 2, 'threshold_reached', 83.00,  2905.00, DATE(CONCAT(@Y,'-05-27 09:45:00')));