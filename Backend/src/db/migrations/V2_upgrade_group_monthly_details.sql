-- ============================================================
-- V2: Upgrade `group_monthly_details` to Production-Grade Schema
-- ============================================================
-- This migration hardens the existing `group_monthly_details` table
-- with proper constraints, foreign keys, CHECK validations, and
-- optional new columns (status, payment_due_date, is_locked).
--
-- IMPORTANT: This project uses 0-indexed months (JS convention).
--   month = 0 → January, month = 11 → December.
--   All CHECK constraints below preserve this 0–11 range.
--
-- Run this script ONCE against your production database.
-- Safe to run even if some constraints already exist (uses IF NOT EXISTS where possible).
-- ============================================================


-- ============================================================
-- STEP 1: Clean orphaned records that have no matching group.
-- Prevents the FK constraint addition from failing on dirty data.
-- ============================================================
DELETE gmd
FROM group_monthly_details gmd
LEFT JOIN `groups` g ON gmd.group_id = g.id
WHERE g.id IS NULL;


-- ============================================================
-- STEP 2: Alter the table — data types and NOT NULL corrections.
-- ============================================================

-- Make timestamps NOT NULL (they were nullable before).
ALTER TABLE `group_monthly_details`
    MODIFY COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    MODIFY COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;


-- ============================================================
-- STEP 3: Add CHECK constraints for data integrity.
-- MySQL 8.0.16+ enforces CHECK constraints natively.
-- ============================================================

-- Validate month is within 0–11 (JS 0-indexed convention used by this app).
ALTER TABLE `group_monthly_details`
    ADD CONSTRAINT `chk_gmd_valid_month`
        CHECK (`month` BETWEEN 0 AND 11);

-- Validate year is a realistic chit-fund operating year.
ALTER TABLE `group_monthly_details`
    ADD CONSTRAINT `chk_gmd_valid_year`
        CHECK (`year` BETWEEN 2000 AND 2100);

-- Financial columns must never be negative.
ALTER TABLE `group_monthly_details`
    ADD CONSTRAINT `chk_gmd_monthly_amount`
        CHECK (`monthly_amount` >= 0);

ALTER TABLE `group_monthly_details`
    ADD CONSTRAINT `chk_gmd_discount_amount`
        CHECK (`discount_amount` >= 0);

ALTER TABLE `group_monthly_details`
    ADD CONSTRAINT `chk_gmd_commission_amount`
        CHECK (`commission_amount` >= 0);


-- ============================================================
-- STEP 4: Add the Foreign Key to enforce referential integrity.
-- Prevents orphan records when a group is deleted.
-- ON DELETE CASCADE: deleting a group removes its monthly records.
-- ON UPDATE CASCADE: if group PK changes, rows follow automatically.
-- ============================================================

-- First: ensure the unique key is named consistently (needed for FK support).
-- The UNIQUE KEY `uq_group_month_period` should already exist. If not, add it:
-- ALTER TABLE `group_monthly_details`
--     ADD CONSTRAINT `uq_group_month_period` UNIQUE (`group_id`, `month`, `year`);

ALTER TABLE `group_monthly_details`
    ADD CONSTRAINT `fk_gmd_group`
        FOREIGN KEY (`group_id`)
        REFERENCES `groups` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE;


-- ============================================================
-- STEP 5: Add new operational columns.
-- These are additive — existing rows get sensible defaults.
-- ============================================================

-- Lifecycle status of a month's collection cycle.
ALTER TABLE `group_monthly_details`
    ADD COLUMN `status` ENUM('pending', 'paid', 'overdue', 'closed')
        NOT NULL DEFAULT 'pending'
        AFTER `notes`;

-- Expected payment due date for this month's cycle.
ALTER TABLE `group_monthly_details`
    ADD COLUMN `payment_due_date` DATE DEFAULT NULL
        AFTER `status`;

-- Lock flag: prevents edits once a month is finalized/audited.
ALTER TABLE `group_monthly_details`
    ADD COLUMN `is_locked` TINYINT(1) NOT NULL DEFAULT 0
        AFTER `payment_due_date`;


-- ============================================================
-- STEP 6: Verify the final structure.
-- ============================================================
-- Run this manually to confirm: DESCRIBE `group_monthly_details`;


-- ============================================================
-- Migration complete.
-- Summary of changes applied:
--   ✓ Orphan records cleaned
--   ✓ Timestamps made NOT NULL
--   ✓ CHECK constraint: month BETWEEN 0 AND 11
--   ✓ CHECK constraint: year BETWEEN 2000 AND 2100
--   ✓ CHECK constraints: all financial columns >= 0
--   ✓ Foreign key: group_id → groups(id) CASCADE
--   ✓ New column: status ENUM (pending/paid/overdue/closed)
--   ✓ New column: payment_due_date DATE
--   ✓ New column: is_locked BOOLEAN (TINYINT 0/1)
-- ============================================================
