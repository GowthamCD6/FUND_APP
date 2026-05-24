-- Reports module schema (V4 Enterprise Standard)
-- Run this manually if you want explicit SQL setup outside auto-initialization.

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  nick_name VARCHAR(255) NULL,
  mail VARCHAR(200) NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role ENUM('Admin','User') NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login TIMESTAMP NULL DEFAULT NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  version INT NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `groups` (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_code VARCHAR(512) NOT NULL,
  group_name VARCHAR(100) NOT NULL,
  total_members INT NOT NULL DEFAULT 20,
  current_members INT NOT NULL DEFAULT 0,
  duration INT NOT NULL DEFAULT 20,
  group_amount DECIMAL(12,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('OnGoing','Completed','Not Started') NOT NULL DEFAULT 'Not Started',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  version INT NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS group_settings (
  group_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  late_fee_enabled TINYINT(1) NOT NULL DEFAULT 0,
  late_fee_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  grace_days INT NOT NULL DEFAULT 0,
  max_members INT NOT NULL DEFAULT 20,
  auction_enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  version INT NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS group_monthly_details (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_id BIGINT UNSIGNED NOT NULL,
  collection_period DATE NOT NULL,
  monthly_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  commission_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  customer_notes VARCHAR(255) NULL,
  internal_notes VARCHAR(255) NULL,
  status ENUM('pending', 'paid', 'overdue', 'closed') NOT NULL DEFAULT 'pending',
  payment_due_date DATE DEFAULT NULL,
  is_locked TINYINT(1) NOT NULL DEFAULT 0,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  locked_by BIGINT UNSIGNED NULL,
  approved_by BIGINT UNSIGNED NULL,
  approved_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  version INT NOT NULL DEFAULT 1,
  UNIQUE KEY uq_group_collection_period (group_id, collection_period),
  INDEX idx_group_collection_period (group_id, collection_period)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS group_auction_winners (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_id BIGINT UNSIGNED NOT NULL,
  collection_period DATE NOT NULL,
  winner_user_id BIGINT UNSIGNED NULL,
  winner_name VARCHAR(120) NOT NULL,
  winner_member_phone VARCHAR(20) NULL,
  amount_taken DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  auction_date DATE NOT NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  version INT NOT NULL DEFAULT 1,
  UNIQUE KEY uq_group_winner_period (group_id, collection_period),
  INDEX idx_group_winner_period (group_id, collection_period)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS monthly_collections (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  collection_period DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  payment_method ENUM('cash', 'upi', 'bank_transfer', 'card') NULL,
  transaction_reference VARCHAR(128) NULL,
  penalty_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount_reason VARCHAR(255) NULL,
  source_platform ENUM('web', 'android', 'ios', 'admin_panel') NULL,
  ip_address VARCHAR(45) NULL,
  device_info VARCHAR(255) NULL,
  payment_gateway_response JSON NULL,
  collection_batch_id BIGINT UNSIGNED NULL,
  status ENUM('paid', 'pending', 'overdue') NOT NULL DEFAULT 'pending',
  due_date DATE NULL,
  paid_date DATETIME NULL,
  receipt_number VARCHAR(64) NULL UNIQUE,
  customer_notes VARCHAR(255) NULL,
  internal_notes VARCHAR(255) NULL,
  is_locked TINYINT(1) NOT NULL DEFAULT 0,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  locked_by BIGINT UNSIGNED NULL,
  approved_by BIGINT UNSIGNED NULL,
  approved_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  version INT NOT NULL DEFAULT 1,
  UNIQUE KEY uq_group_user_period (group_id, user_id, collection_period),
  INDEX idx_group_period (group_id, collection_period),
  INDEX idx_user_period (user_id, collection_period)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  collection_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method ENUM('cash', 'upi', 'bank_transfer', 'card') NOT NULL,
  transaction_reference VARCHAR(128) NULL,
  receipt_number VARCHAR(64) NULL UNIQUE,
  status ENUM('pending', 'success', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  gateway_response JSON NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  paid_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  version INT NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  action_type VARCHAR(50) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id BIGINT UNSIGNED NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  ip_address VARCHAR(45) NULL,
  device_info VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;