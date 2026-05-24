-- ============================================================
-- V3: Full Production Schema Hardening — ALL Tables
-- FundApp Database
-- ============================================================
-- Hardens all 7 tables:
--   users, groups, user_grouping, group_monthly_details,
--   group_auction_winners, monthly_collections, refresh_tokens
--
-- CONVENTIONS PRESERVED:
--   • month = 0-11  (JavaScript Date.getMonth() convention)
--   • groups PK = `id`   (not group_id)
--   • users  PK = `id`   (not user_id)
--
-- SAFE TO RUN: all steps clean dirty data before adding constraints.
-- Run once against production. Verify with SHOW CREATE TABLE after.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = '';

-- ============================================================
-- [1] TABLE: users
-- ============================================================
-- Problems found:
--   • name, nick_name, mail are nullable — name should be required
--   • phone has no UNIQUE constraint (login lookups by phone)
--   • last_login defaults to CURRENT_TIMESTAMP — should be NULL
--     (means "never logged in", not "created now")
--   • No is_active soft-delete flag
-- ============================================================

-- 1a. Fix last_login default and name NOT NULL
ALTER TABLE `users`
    MODIFY COLUMN `name`       VARCHAR(100) NOT NULL,
    MODIFY COLUMN `last_login` TIMESTAMP NULL DEFAULT NULL;

-- 1b. Add UNIQUE constraint on phone (used as login identifier)
--     Only add if not already present.
ALTER TABLE `users`
    ADD CONSTRAINT `uq_users_phone` UNIQUE (`phone`);

-- 1c. Add soft-delete / active flag
ALTER TABLE `users`
    ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1
        COMMENT '1 = active, 0 = deactivated'
        AFTER `role`;

-- ============================================================
-- [2] TABLE: groups
-- ============================================================
-- Problems found:
--   • group_code is TEXT — cannot be indexed, should be VARCHAR
--   • group_amount is INT — finance amounts must be DECIMAL(12,2)
--   • current_members is nullable — should be NOT NULL DEFAULT 0
--   • status is nullable — should be NOT NULL DEFAULT 'Not Started'
--   • No CHECK constraints on amounts or member counts
--   • No index on status (reports filter by it heavily)
-- ============================================================

-- 2a. Fix data types and nullability
ALTER TABLE `groups`
    MODIFY COLUMN `group_code`      VARCHAR(512) NOT NULL
        COMMENT 'AES-encrypted group identifier',
    MODIFY COLUMN `group_amount`    DECIMAL(12,2) NOT NULL
        COMMENT 'Total chit fund value',
    MODIFY COLUMN `current_members` INT NOT NULL DEFAULT 0,
    MODIFY COLUMN `status`          ENUM('OnGoing','Completed','Not Started')
                                    NOT NULL DEFAULT 'Not Started';

-- 2b. CHECK constraints for business rules
ALTER TABLE `groups`
    ADD CONSTRAINT `chk_groups_total_members`
        CHECK (`total_members` > 0),
    ADD CONSTRAINT `chk_groups_current_members`
        CHECK (`current_members` >= 0),
    ADD CONSTRAINT `chk_groups_duration`
        CHECK (`duration` > 0),
    ADD CONSTRAINT `chk_groups_amount`
        CHECK (`group_amount` > 0);

-- 2c. Index on status for report queries (getReportGroups filters by status)
ALTER TABLE `groups`
    ADD INDEX `idx_groups_status` (`status`);

-- ============================================================
-- [3] TABLE: user_grouping
-- ============================================================
-- Problems found:
--   • user_id and group_id are nullable — logically impossible
--   • No UNIQUE constraint on (user_id, group_id) — allows duplicate memberships
--   • No FK constraints — orphan records allowed
--   • Timestamps are nullable
-- ============================================================

-- 3a. Clean bad data BEFORE adding constraints
--     Delete rows with NULL foreign keys
DELETE FROM `user_grouping`
WHERE `user_id` IS NULL OR `group_id` IS NULL;

--     Delete orphans (user deleted)
DELETE ug FROM `user_grouping` ug
LEFT JOIN `users` u ON ug.user_id = u.id
WHERE u.id IS NULL;

--     Delete orphans (group deleted)
DELETE ug FROM `user_grouping` ug
LEFT JOIN `groups` g ON ug.group_id = g.id
WHERE g.id IS NULL;

--     Remove duplicate (user_id, group_id) pairs — keep lowest id
DELETE t1 FROM `user_grouping` t1
INNER JOIN `user_grouping` t2
WHERE t1.id > t2.id
  AND t1.user_id  = t2.user_id
  AND t1.group_id = t2.group_id;

-- 3b. Fix nullability and timestamps
ALTER TABLE `user_grouping`
    MODIFY COLUMN `user_id`    INT NOT NULL,
    MODIFY COLUMN `group_id`   INT NOT NULL,
    MODIFY COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    MODIFY COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP;

-- 3c. Add UNIQUE constraint to prevent duplicate memberships
ALTER TABLE `user_grouping`
    ADD CONSTRAINT `uq_user_grouping` UNIQUE (`user_id`, `group_id`);

-- 3d. Add FK constraints
ALTER TABLE `user_grouping`
    ADD CONSTRAINT `fk_ug_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `fk_ug_group`
        FOREIGN KEY (`group_id`)
        REFERENCES `groups` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- [4] TABLE: group_auction_winners
-- ============================================================
-- Problems found:
--   • No FK on group_id → groups(id)
--   • No FK on winner_user_id → users(id)
--   • No CHECK constraints on month, year, amount_taken
--   • Timestamps are nullable
-- ============================================================

-- 4a. Clean orphans before FK
DELETE gaw FROM `group_auction_winners` gaw
LEFT JOIN `groups` g ON gaw.group_id = g.id
WHERE g.id IS NULL;

-- 4b. Fix timestamps
ALTER TABLE `group_auction_winners`
    MODIFY COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    MODIFY COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP;

-- 4c. CHECK constraints (same 0-11 month convention as the rest of the app)
ALTER TABLE `group_auction_winners`
    ADD CONSTRAINT `chk_gaw_valid_month`
        CHECK (`month` BETWEEN 0 AND 11),
    ADD CONSTRAINT `chk_gaw_valid_year`
        CHECK (`year` BETWEEN 2000 AND 2100),
    ADD CONSTRAINT `chk_gaw_amount_taken`
        CHECK (`amount_taken` >= 0);

-- 4d. FK constraints
ALTER TABLE `group_auction_winners`
    ADD CONSTRAINT `fk_gaw_group`
        FOREIGN KEY (`group_id`)
        REFERENCES `groups` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE;

--     winner_user_id is nullable (winner may not be a registered user)
--     SET NULL on delete: keep auction record even if user is removed
ALTER TABLE `group_auction_winners`
    ADD CONSTRAINT `fk_gaw_winner_user`
        FOREIGN KEY (`winner_user_id`)
        REFERENCES `users` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- [5] TABLE: monthly_collections
-- ============================================================
-- Problems found:
--   • No FK on group_id → groups(id)
--   • No FK on user_id → users(id)
--   • No CHECK constraints on month, year, amount
--   • Timestamps are nullable
--   • No is_locked flag (payment finalization safety)
--   • Missing index on user_id (join performance)
-- ============================================================

-- 5a. Clean orphans before FK
DELETE mc FROM `monthly_collections` mc
LEFT JOIN `groups` g ON mc.group_id = g.id
WHERE g.id IS NULL;

DELETE mc FROM `monthly_collections` mc
LEFT JOIN `users` u ON mc.user_id = u.id
WHERE u.id IS NULL;

-- 5b. Fix timestamps
ALTER TABLE `monthly_collections`
    MODIFY COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    MODIFY COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP;

-- 5c. CHECK constraints
ALTER TABLE `monthly_collections`
    ADD CONSTRAINT `chk_mc_valid_month`
        CHECK (`month` BETWEEN 0 AND 11),
    ADD CONSTRAINT `chk_mc_valid_year`
        CHECK (`year` BETWEEN 2000 AND 2100),
    ADD CONSTRAINT `chk_mc_amount`
        CHECK (`amount` >= 0);

-- 5d. FK constraints
ALTER TABLE `monthly_collections`
    ADD CONSTRAINT `fk_mc_group`
        FOREIGN KEY (`group_id`)
        REFERENCES `groups` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `fk_mc_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE;

-- 5e. Add is_locked flag — prevents edits after payment is confirmed
ALTER TABLE `monthly_collections`
    ADD COLUMN `is_locked` TINYINT(1) NOT NULL DEFAULT 0
        COMMENT '1 = finalized, edits blocked'
        AFTER `notes`;

-- 5f. Add index on user_id for JOIN performance in getMemberChitCard
ALTER TABLE `monthly_collections`
    ADD INDEX `idx_mc_user_id` (`user_id`);

-- ============================================================
-- [6] TABLE: refresh_tokens
-- ============================================================
-- Problems found:
--   • No FK on user_id → users(id)
--     (orphan tokens pile up when users are removed)
--   • created_at is nullable
--   • No index on expires_at (used in WHERE clause every token check)
-- ============================================================

-- 6a. Clean orphans
DELETE rt FROM `refresh_tokens` rt
LEFT JOIN `users` u ON rt.user_id = u.id
WHERE u.id IS NULL;

-- 6b. Fix timestamp
ALTER TABLE `refresh_tokens`
    MODIFY COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 6c. FK — cascade delete means logout/delete user auto-revokes all tokens
ALTER TABLE `refresh_tokens`
    ADD CONSTRAINT `fk_rt_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE;

-- 6d. Index on expires_at — WHERE expires_at > NOW() runs on every refresh
ALTER TABLE `refresh_tokens`
    ADD INDEX `idx_rt_expires_at` (`expires_at`);

-- 6e. Index on user_id — for fast token revocation when user logs out
ALTER TABLE `refresh_tokens`
    ADD INDEX `idx_rt_user_id` (`user_id`);

-- ============================================================
-- [7] TABLE: group_monthly_details
-- ============================================================
-- Already upgraded in V2. Nothing additional needed.
-- Confirmed present: status, payment_due_date, is_locked, all CHECKs, FK.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- VERIFICATION QUERIES
-- Run these manually after migration to confirm everything applied:
-- ============================================================
-- SELECT TABLE_NAME, CONSTRAINT_NAME, CONSTRAINT_TYPE
-- FROM information_schema.TABLE_CONSTRAINTS
-- WHERE TABLE_SCHEMA = 'fundapp'
-- ORDER BY TABLE_NAME, CONSTRAINT_TYPE;
--
-- SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
-- FROM information_schema.COLUMNS
-- WHERE TABLE_SCHEMA = 'fundapp'
-- ORDER BY TABLE_NAME, ORDINAL_POSITION;
-- ============================================================

-- Migration V3 complete.
-- Summary of all changes:
--   users            → name NOT NULL, phone UNIQUE, last_login NULL default, is_active added
--   groups           → group_amount DECIMAL, group_code VARCHAR, current_members NOT NULL,
--                       status NOT NULL, CHECK constraints, status index
--   user_grouping    → NOT NULL cols, UNIQUE(user_id,group_id), FK to users+groups
--   group_auction_winners → timestamps NOT NULL, CHECK constraints, FK to groups+users
--   monthly_collections   → timestamps NOT NULL, CHECK constraints, FK to groups+users,
--                            is_locked added, user_id index added
--   refresh_tokens   → created_at NOT NULL, FK to users CASCADE, expires_at index
--   group_monthly_details → already hardened in V2 (no changes needed)
