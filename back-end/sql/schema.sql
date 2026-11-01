-- ============================================================
--  Web-Based Personal Expense Tracker
--  Database Schema  —  MySQL 8.x
--  Bachelor's Thesis Project
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ── Drop tables in reverse dependency order ──────────────────
DROP TABLE IF EXISTS budget_alerts;
DROP TABLE IF EXISTS budgets;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- ============================================================
--  TABLE: users
-- ============================================================
CREATE TABLE users (
  id                    INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name                  VARCHAR(100)    NOT NULL,
  email                 VARCHAR(255)    NOT NULL,
  password_hash         VARCHAR(255)    NOT NULL,
  currency              CHAR(3)         NOT NULL DEFAULT 'USD',
  timezone              VARCHAR(100)    NOT NULL DEFAULT 'UTC',
  monthly_income_goal   DECIMAL(15, 2)  NULL     DEFAULT NULL,
  monthly_expense_limit DECIMAL(15, 2)  NULL     DEFAULT NULL,
  is_active             TINYINT(1)      NOT NULL DEFAULT 1,
  last_login            DATETIME        NULL     DEFAULT NULL,
  created_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE  KEY uq_users_email (email),
  INDEX       idx_users_is_active (is_active),
  INDEX       idx_users_created_at (created_at),

  CONSTRAINT chk_users_currency
    CHECK (currency REGEXP '^[A-Z]{3}$'),
  CONSTRAINT chk_users_income_goal
    CHECK (monthly_income_goal IS NULL OR monthly_income_goal >= 0),
  CONSTRAINT chk_users_expense_limit
    CHECK (monthly_expense_limit IS NULL OR monthly_expense_limit >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Registered application users';

-- ============================================================
--  TABLE: categories
-- ============================================================
CREATE TABLE categories (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED  NULL     DEFAULT NULL,   -- NULL = system default
  name        VARCHAR(100)  NOT NULL,
  type        ENUM('income','expense') NOT NULL,
  icon        VARCHAR(10)   NOT NULL DEFAULT '📦',
  color       CHAR(7)       NOT NULL DEFAULT '#95A5A6',
  is_default  TINYINT(1)    NOT NULL DEFAULT 0,
  is_active   TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_categories_user_id   (user_id),
  INDEX idx_categories_type      (type),
  INDEX idx_categories_is_active (is_active),

  CONSTRAINT fk_categories_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT chk_categories_color
    CHECK (color REGEXP '^#[0-9A-Fa-f]{6}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Transaction categories (system defaults have user_id = NULL)';

-- ============================================================
--  TABLE: transactions
-- ============================================================
CREATE TABLE transactions (
  id               INT UNSIGNED            NOT NULL AUTO_INCREMENT,
  user_id          INT UNSIGNED            NOT NULL,
  category_id      INT UNSIGNED            NOT NULL,
  type             ENUM('income','expense') NOT NULL,
  amount           DECIMAL(15, 2)          NOT NULL,
  description      VARCHAR(500)            NOT NULL DEFAULT '',
  notes            TEXT                    NULL     DEFAULT NULL,
  transaction_date DATE                    NOT NULL,
  created_at       DATETIME                NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME                NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_transactions_user_id          (user_id),
  INDEX idx_transactions_category_id      (category_id),
  INDEX idx_transactions_type             (type),
  INDEX idx_transactions_transaction_date (transaction_date),
  INDEX idx_transactions_user_date        (user_id, transaction_date),
  INDEX idx_transactions_user_type        (user_id, type),
  INDEX idx_transactions_user_type_date   (user_id, type, transaction_date),

  CONSTRAINT fk_transactions_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_transactions_category
    FOREIGN KEY (category_id) REFERENCES categories (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT chk_transactions_amount
    CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='All financial transactions (income and expense)';

-- ============================================================
--  TABLE: budgets
-- ============================================================
CREATE TABLE budgets (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id         INT UNSIGNED  NOT NULL,
  category_id     INT UNSIGNED  NULL     DEFAULT NULL,
  name            VARCHAR(100)  NOT NULL,
  amount          DECIMAL(15,2) NOT NULL,
  period          ENUM('weekly','monthly','quarterly','yearly','custom') NOT NULL DEFAULT 'monthly',
  start_date      DATE          NOT NULL,
  end_date        DATE          NOT NULL,
  alert_threshold DECIMAL(5,2)  NOT NULL DEFAULT 80.00,
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  notes           VARCHAR(500)  NOT NULL DEFAULT '',
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_budgets_user_id    (user_id),
  INDEX idx_budgets_category   (category_id),
  INDEX idx_budgets_is_active  (is_active),
  INDEX idx_budgets_dates      (start_date, end_date),
  INDEX idx_budgets_user_active(user_id, is_active),

  CONSTRAINT fk_budgets_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_budgets_category
    FOREIGN KEY (category_id) REFERENCES categories (id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT chk_budgets_amount
    CHECK (amount > 0),
  CONSTRAINT chk_budgets_dates
    CHECK (end_date > start_date),
  CONSTRAINT chk_budgets_threshold
    CHECK (alert_threshold BETWEEN 1 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='User-defined spending budgets with configurable alert thresholds';

-- ============================================================
--  TABLE: budget_alerts  (audit log of fired alerts)
-- ============================================================
CREATE TABLE budget_alerts (
  id           INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  budget_id    INT UNSIGNED   NOT NULL,
  user_id      INT UNSIGNED   NOT NULL,
  alert_type   ENUM('threshold_reached','budget_exceeded') NOT NULL,
  percentage   DECIMAL(6, 2)  NOT NULL,
  amount_spent DECIMAL(15, 2) NOT NULL,
  fired_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_budget_alerts_budget  (budget_id),
  INDEX idx_budget_alerts_user    (user_id),
  INDEX idx_budget_alerts_fired   (fired_at),

  CONSTRAINT fk_budget_alerts_budget
    FOREIGN KEY (budget_id) REFERENCES budgets (id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_budget_alerts_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Audit log of budget threshold and exceeded alerts';

-- ============================================================
--  TRIGGERS
-- ============================================================

-- Prevent transactions from being assigned to inactive categories
DELIMITER $$
CREATE TRIGGER trg_transactions_before_insert
BEFORE INSERT ON transactions
FOR EACH ROW
BEGIN
  DECLARE cat_active TINYINT(1);
  SELECT is_active INTO cat_active FROM categories WHERE id = NEW.category_id;
  IF cat_active = 0 OR cat_active IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cannot assign transaction to an inactive category.';
  END IF;
END$$

CREATE TRIGGER trg_transactions_before_update
BEFORE UPDATE ON transactions
FOR EACH ROW
BEGIN
  DECLARE cat_active TINYINT(1);
  IF NEW.category_id != OLD.category_id THEN
    SELECT is_active INTO cat_active FROM categories WHERE id = NEW.category_id;
    IF cat_active = 0 OR cat_active IS NULL THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot assign transaction to an inactive category.';
    END IF;
  END IF;
END$$
DELIMITER ;

-- ============================================================
--  VIEWS  (convenience — used by analytics queries)
-- ============================================================

CREATE OR REPLACE VIEW vw_monthly_summary AS
SELECT
  user_id,
  DATE_FORMAT(transaction_date, '%Y-%m')                                      AS month,
  COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0)         AS total_income,
  COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)         AS total_expense,
  COALESCE(SUM(CASE WHEN type = 'income'  THEN amount
                    WHEN type = 'expense' THEN -amount END), 0)               AS net_balance,
  COUNT(*)                                                                     AS transaction_count
FROM transactions
GROUP BY user_id, DATE_FORMAT(transaction_date, '%Y-%m');

CREATE OR REPLACE VIEW vw_category_monthly AS
SELECT
  t.user_id,
  t.category_id,
  c.name  AS category_name,
  c.type  AS category_type,
  c.icon  AS category_icon,
  c.color AS category_color,
  DATE_FORMAT(t.transaction_date, '%Y-%m')  AS month,
  SUM(t.amount)                              AS total_amount,
  COUNT(t.id)                                AS transaction_count
FROM transactions t
JOIN categories c ON t.category_id = c.id
GROUP BY t.user_id, t.category_id, c.name, c.type, c.icon, c.color,
         DATE_FORMAT(t.transaction_date, '%Y-%m');

SET FOREIGN_KEY_CHECKS = 1;