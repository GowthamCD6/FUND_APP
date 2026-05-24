-- ============================================================
-- V4: Enterprise Database Schema Hardening
-- FundApp Database
-- ============================================================
-- Implements:
--   1. ID upgrades to BIGINT UNSIGNED for scalability.
--   2. month (0-11) + year (YYYY) replacement with collection_period DATE.
--   3. Audit columns: created_by, updated_by, locked_by, deleted_at, version.
--   4. New Tables: group_settings, payment_transactions, audit_logs.
--   5. Splitting/renaming notes -> customer_notes + internal_notes.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = '';

-- ============================================================
-- [1] DROP PREVIOUS CONSTRAINTS (Foreign Keys & Checks)
-- ============================================================

ALTER TABLE `user_grouping` DROP FOREIGN KEY `fk_ug_user`;
ALTER TABLE `user_grouping` DROP FOREIGN KEY `fk_ug_group`;
ALTER TABLE `group_monthly_details` DROP FOREIGN KEY `fk_gmd_group`;
ALTER TABLE `group_auction_winners` DROP FOREIGN KEY `fk_gaw_group`;
ALTER TABLE `group_auction_winners` DROP FOREIGN KEY `fk_gaw_winner_user`;
ALTER TABLE `monthly_collections` DROP FOREIGN KEY `fk_mc_group`;
ALTER TABLE `monthly_collections` DROP FOREIGN KEY `fk_mc_user`;
ALTER TABLE `refresh_tokens` DROP FOREIGN KEY `fk_rt_user`;

ALTER TABLE `group_auction_winners` DROP CHECK `chk_gaw_valid_month`;
ALTER TABLE `group_auction_winners` DROP CHECK `chk_gaw_valid_year`;
ALTER TABLE `group_auction_winners` DROP CHECK `chk_gaw_amount_taken`;

ALTER TABLE `monthly_collections` DROP CHECK `chk_mc_valid_month`;
ALTER TABLE `monthly_collections` DROP CHECK `chk_mc_valid_year`;
ALTER TABLE `monthly_collections` DROP CHECK `chk_mc_amount`;

ALTER TABLE `group_monthly_details` DROP CHECK `chk_gmd_valid_month`;
ALTER TABLE `group_monthly_details` DROP CHECK `chk_gmd_valid_year`;
ALTER TABLE `group_monthly_details` DROP CHECK `chk_gmd_monthly_amount`;
ALTER TABLE `group_monthly_details` DROP CHECK `chk_gmd_discount_amount`;
ALTER TABLE `group_monthly_details` DROP CHECK `chk_gmd_commission_amount`;

-- ============================================================
-- [2] DROP PREVIOUS INDEXES & UNIQUE KEYS
-- ============================================================

ALTER TABLE `group_auction_winners` DROP INDEX `uq_group_winner_period`;
ALTER TABLE `group_monthly_details` DROP INDEX `uq_group_month_period`;
ALTER TABLE `monthly_collections` DROP INDEX `uq_group_user_month`;
ALTER TABLE `user_grouping` DROP INDEX `uq_user_grouping`;

ALTER TABLE `group_auction_winners` DROP INDEX `idx_group_winner_period`;
ALTER TABLE `group_monthly_details` DROP INDEX `idx_group_month_period`;
ALTER TABLE `monthly_collections` DROP INDEX `idx_group_period`;
ALTER TABLE `monthly_collections` DROP INDEX `idx_user_period`;

-- ============================================================
-- [3] UPGRADE ID COLUMNS TO BIGINT UNSIGNED
-- ============================================================

ALTER TABLE `users` MODIFY COLUMN `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `groups` MODIFY COLUMN `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `user_grouping` 
    MODIFY COLUMN `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    MODIFY COLUMN `user_id` BIGINT UNSIGNED NOT NULL,
    MODIFY COLUMN `group_id` BIGINT UNSIGNED NOT NULL;

ALTER TABLE `group_monthly_details` 
    MODIFY COLUMN `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    MODIFY COLUMN `group_id` BIGINT UNSIGNED NOT NULL;

ALTER TABLE `group_auction_winners` 
    MODIFY COLUMN `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    MODIFY COLUMN `group_id` BIGINT UNSIGNED NOT NULL,
    MODIFY COLUMN `winner_user_id` BIGINT UNSIGNED NULL;

ALTER TABLE `monthly_collections` 
    MODIFY COLUMN `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    MODIFY COLUMN `group_id` BIGINT UNSIGNED NOT NULL,
    MODIFY COLUMN `user_id` BIGINT UNSIGNED NOT NULL;

ALTER TABLE `refresh_tokens` 
    MODIFY COLUMN `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    MODIFY COLUMN `user_id` BIGINT UNSIGNED NOT NULL;

-- ============================================================
-- [4] RESTORE PRIMARY RELATIONSHIPS (FOREIGN KEYS)
-- ============================================================

ALTER TABLE `user_grouping` 
    ADD CONSTRAINT `fk_ug_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `fk_ug_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `group_monthly_details` 
    ADD CONSTRAINT `fk_gmd_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `group_auction_winners` 
    ADD CONSTRAINT `fk_gaw_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `fk_gaw_winner_user` FOREIGN KEY (`winner_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `monthly_collections` 
    ADD CONSTRAINT `fk_mc_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `fk_mc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `refresh_tokens` 
    ADD CONSTRAINT `fk_rt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- [5] INTRODUCE `collection_period` DATE & MIGRATE EXISTING DATA
-- ============================================================

ALTER TABLE `group_monthly_details` ADD COLUMN `collection_period` DATE NULL AFTER `year`;
ALTER TABLE `group_auction_winners` ADD COLUMN `collection_period` DATE NULL AFTER `year`;
ALTER TABLE `monthly_collections` ADD COLUMN `collection_period` DATE NULL AFTER `year`;

-- Populate collection_period using month and year. In DB, month is 0-indexed (0=Jan, 11=Dec), so we do month + 1.
UPDATE `group_monthly_details` SET `collection_period` = STR_TO_DATE(CONCAT(`year`, '-', `month` + 1, '-01'), '%Y-%m-%d');
UPDATE `group_auction_winners` SET `collection_period` = STR_TO_DATE(CONCAT(`year`, '-', `month` + 1, '-01'), '%Y-%m-%d');
UPDATE `monthly_collections` SET `collection_period` = STR_TO_DATE(CONCAT(`year`, '-', `month` + 1, '-01'), '%Y-%m-%d');

-- Enforce NOT NULL constraints
ALTER TABLE `group_monthly_details` MODIFY COLUMN `collection_period` DATE NOT NULL;
ALTER TABLE `group_auction_winners` MODIFY COLUMN `collection_period` DATE NOT NULL;
ALTER TABLE `monthly_collections` MODIFY COLUMN `collection_period` DATE NOT NULL;

-- Enforce that collection_period MUST be the 1st of the month
ALTER TABLE `group_monthly_details` ADD CONSTRAINT `chk_gmd_period_day` CHECK (DAYOFMONTH(`collection_period`) = 1);
ALTER TABLE `group_auction_winners` ADD CONSTRAINT `chk_gaw_period_day` CHECK (DAYOFMONTH(`collection_period`) = 1);
ALTER TABLE `monthly_collections` ADD CONSTRAINT `chk_mc_period_day` CHECK (DAYOFMONTH(`collection_period`) = 1);

-- Drop legacy month and year columns
ALTER TABLE `group_monthly_details` DROP COLUMN `month`, DROP COLUMN `year`;
ALTER TABLE `group_auction_winners` DROP COLUMN `month`, DROP COLUMN `year`;
ALTER TABLE `monthly_collections` DROP COLUMN `month`, DROP COLUMN `year`;

-- ============================================================
-- [6] RECREATE UNIQUE CONSTRAINTS AND INDEXES ON collection_period
-- ============================================================

ALTER TABLE `group_monthly_details` ADD CONSTRAINT `uq_group_month_period` UNIQUE (`group_id`, `collection_period`);
ALTER TABLE `group_auction_winners` ADD CONSTRAINT `uq_group_winner_period` UNIQUE (`group_id`, `collection_period`);
ALTER TABLE `monthly_collections` ADD CONSTRAINT `uq_group_user_month` UNIQUE (`group_id`, `user_id`, `collection_period`);
ALTER TABLE `user_grouping` ADD CONSTRAINT `uq_user_grouping` UNIQUE (`user_id`, `group_id`);

ALTER TABLE `group_monthly_details` ADD INDEX `idx_group_month_period` (`group_id`, `collection_period`);
ALTER TABLE `group_auction_winners` ADD INDEX `idx_group_winner_period` (`group_id`, `collection_period`);
ALTER TABLE `monthly_collections` ADD INDEX `idx_group_period` (`group_id`, `collection_period`);
ALTER TABLE `monthly_collections` ADD INDEX `idx_user_period` (`user_id`, `collection_period`);

-- Restore numeric financial checks
ALTER TABLE `group_monthly_details` 
    ADD CONSTRAINT `chk_gmd_monthly_amount` CHECK (`monthly_amount` >= 0),
    ADD CONSTRAINT `chk_gmd_discount_amount` CHECK (`discount_amount` >= 0),
    ADD CONSTRAINT `chk_gmd_commission_amount` CHECK (`commission_amount` >= 0);

ALTER TABLE `group_auction_winners` ADD CONSTRAINT `chk_gaw_amount_taken` CHECK (`amount_taken` >= 0);
ALTER TABLE `monthly_collections` ADD CONSTRAINT `chk_mc_amount` CHECK (`amount` >= 0);

-- ============================================================
-- [7] NOTE RENAMINGS & EXTRA COLUMNS (customer_notes, internal_notes)
-- ============================================================

ALTER TABLE `group_monthly_details` CHANGE COLUMN `notes` `customer_notes` VARCHAR(255) NULL;
ALTER TABLE `group_monthly_details` ADD COLUMN `internal_notes` VARCHAR(255) NULL AFTER `customer_notes`;

ALTER TABLE `monthly_collections` CHANGE COLUMN `notes` `customer_notes` VARCHAR(255) NULL;
ALTER TABLE `monthly_collections` ADD COLUMN `internal_notes` VARCHAR(255) NULL AFTER `customer_notes`;

-- ============================================================
-- [8] ADD AUDIT & SYSTEM COLUMNS TO PRIMARY TABLES
-- ============================================================

ALTER TABLE `users` 
    ADD COLUMN `created_by` BIGINT UNSIGNED NULL,
    ADD COLUMN `updated_by` BIGINT UNSIGNED NULL,
    ADD COLUMN `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN `version` INT NOT NULL DEFAULT 1,
    ADD CONSTRAINT `fk_users_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    ADD CONSTRAINT `fk_users_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

ALTER TABLE `groups` 
    ADD COLUMN `created_by` BIGINT UNSIGNED NULL,
    ADD COLUMN `updated_by` BIGINT UNSIGNED NULL,
    ADD COLUMN `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN `version` INT NOT NULL DEFAULT 1,
    ADD CONSTRAINT `fk_groups_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    ADD CONSTRAINT `fk_groups_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

ALTER TABLE `group_monthly_details` 
    ADD COLUMN `created_by` BIGINT UNSIGNED NULL,
    ADD COLUMN `updated_by` BIGINT UNSIGNED NULL,
    ADD COLUMN `locked_by` BIGINT UNSIGNED NULL,
    ADD COLUMN `approved_by` BIGINT UNSIGNED NULL,
    ADD COLUMN `approved_at` TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN `version` INT NOT NULL DEFAULT 1,
    ADD CONSTRAINT `fk_gmd_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    ADD CONSTRAINT `fk_gmd_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    ADD CONSTRAINT `fk_gmd_locked_by` FOREIGN KEY (`locked_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    ADD CONSTRAINT `fk_gmd_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

ALTER TABLE `group_auction_winners` 
    ADD COLUMN `created_by` BIGINT UNSIGNED NULL,
    ADD COLUMN `updated_by` BIGINT UNSIGNED NULL,
    ADD COLUMN `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN `version` INT NOT NULL DEFAULT 1,
    ADD CONSTRAINT `fk_gaw_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    ADD CONSTRAINT `fk_gaw_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

ALTER TABLE `monthly_collections` 
    ADD COLUMN `created_by` BIGINT UNSIGNED NULL,
    ADD COLUMN `updated_by` BIGINT UNSIGNED NULL,
    ADD COLUMN `locked_by` BIGINT UNSIGNED NULL,
    ADD COLUMN `approved_by` BIGINT UNSIGNED NULL,
    ADD COLUMN `approved_at` TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN `version` INT NOT NULL DEFAULT 1,
    ADD COLUMN `payment_method` ENUM('cash', 'upi', 'bank_transfer', 'card') NULL AFTER `amount`,
    ADD COLUMN `transaction_reference` VARCHAR(128) NULL AFTER `payment_method`,
    ADD COLUMN `penalty_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `transaction_reference`,
    ADD COLUMN `discount_reason` VARCHAR(255) NULL AFTER `penalty_amount`,
    ADD COLUMN `source_platform` ENUM('web', 'android', 'ios', 'admin_panel') NULL AFTER `discount_reason`,
    ADD COLUMN `ip_address` VARCHAR(45) NULL AFTER `source_platform`,
    ADD COLUMN `device_info` VARCHAR(255) NULL AFTER `ip_address`,
    ADD COLUMN `payment_gateway_response` JSON NULL AFTER `device_info`,
    ADD COLUMN `collection_batch_id` BIGINT UNSIGNED NULL AFTER `payment_gateway_response`,
    ADD CONSTRAINT `fk_mc_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    ADD CONSTRAINT `fk_mc_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    ADD CONSTRAINT `fk_mc_locked_by` FOREIGN KEY (`locked_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    ADD CONSTRAINT `fk_mc_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- Initialize payment method on existing paid items
UPDATE `monthly_collections` SET `payment_method` = 'cash' WHERE `status` = 'paid';

-- ============================================================
-- [9] NEW ENTERPRISE TABLE: group_settings
-- ============================================================

CREATE TABLE `group_settings` (
    `group_id` BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    `late_fee_enabled` TINYINT(1) NOT NULL DEFAULT 0,
    `late_fee_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `grace_days` INT NOT NULL DEFAULT 0,
    `max_members` INT NOT NULL DEFAULT 20,
    `auction_enabled` TINYINT(1) NOT NULL DEFAULT 1,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    `version` INT NOT NULL DEFAULT 1,
    CONSTRAINT `fk_gs_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_gs_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_gs_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default settings for existing groups
INSERT INTO `group_settings` (group_id, max_members)
SELECT id, total_members FROM `groups`;

-- ============================================================
-- [10] NEW ENTERPRISE TABLE: payment_transactions
-- ============================================================

CREATE TABLE `payment_transactions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `collection_id` BIGINT UNSIGNED NOT NULL,
    `amount` DECIMAL(12,2) NOT NULL,
    `payment_method` ENUM('cash', 'upi', 'bank_transfer', 'card') NOT NULL,
    `transaction_reference` VARCHAR(128) NULL,
    `receipt_number` VARCHAR(64) NULL,
    `status` ENUM('pending', 'success', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    `gateway_response` JSON NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `paid_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    `version` INT NOT NULL DEFAULT 1,
    UNIQUE KEY `uq_tx_receipt_number` (`receipt_number`),
    CONSTRAINT `fk_tx_collection` FOREIGN KEY (`collection_id`) REFERENCES `monthly_collections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_tx_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_tx_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrate existing paid records into transaction log
INSERT INTO `payment_transactions` (collection_id, amount, payment_method, receipt_number, status, paid_at, created_at, updated_at)
SELECT id, amount, 'cash', receipt_number, 'success', paid_date, created_at, updated_at
FROM `monthly_collections`
WHERE status = 'paid';

-- Establish unique key constraint on monthly_collections.receipt_number now that duplicates are cleaned and it matches transaction integrity
ALTER TABLE `monthly_collections` ADD CONSTRAINT `uq_mc_receipt_number` UNIQUE (`receipt_number`);

-- ============================================================
-- [11] NEW ENTERPRISE TABLE: audit_logs
-- ============================================================

CREATE TABLE `audit_logs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NULL,
    `action_type` VARCHAR(50) NOT NULL,
    `table_name` VARCHAR(50) NOT NULL,
    `record_id` BIGINT UNSIGNED NULL,
    `old_values` JSON NULL,
    `new_values` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `device_info` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;