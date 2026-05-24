-- This migration script refactors the `user_grouping` table to a production-ready standard.
-- It cleans existing data, creates a new optimized table, migrates the data, and replaces the old table.
-- Run this script once to upgrade your schema.

-- STEP 1: Clean orphaned records from `user_grouping`.
-- This deletes memberships where the referenced user or group no longer exists.

-- Delete memberships where the user does not exist in the `users` table.
DELETE ug
FROM user_grouping ug
LEFT JOIN users u ON ug.user_id = u.user_id
WHERE u.user_id IS NULL;

-- Delete memberships where the group does not exist in the `groups` table.
DELETE ug
FROM user_grouping ug
LEFT JOIN `groups` g ON ug.group_id = g.group_id
WHERE g.group_id IS NULL;


-- STEP 2: Clean records with NULL foreign keys.
-- These records are invalid as they don't represent a complete relationship.
DELETE FROM user_grouping
WHERE user_id IS NULL OR group_id IS NULL;


-- STEP 3: Remove duplicate memberships.
-- This keeps the first instance of a user-group pair (by lowest id) and deletes subsequent duplicates.
DELETE t1
FROM user_grouping t1
INNER JOIN user_grouping t2
WHERE
    t1.id > t2.id AND
    t1.user_id = t2.user_id AND
    t1.group_id = t2.group_id;


-- STEP 4: Create the new, optimized table with the name `group_members`.
-- This schema enforces integrity with a composite primary key and foreign key constraints.
CREATE TABLE `group_members` (
    `user_id` INT UNSIGNED NOT NULL,
    `group_id` INT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Composite primary key enforces uniqueness and serves as the clustered index.
    PRIMARY KEY (`user_id`, `group_id`),

    -- Foreign key to the `users` table.
    CONSTRAINT `fk_group_members_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users` (`user_id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- Foreign key to the `groups` table.
    CONSTRAINT `fk_group_members_group`
        FOREIGN KEY (`group_id`)
        REFERENCES `groups` (`group_id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- STEP 5: Copy the cleaned data from the old table to the new `group_members` table.
INSERT INTO `group_members` (user_id, group_id, created_at, updated_at)
SELECT user_id, group_id, created_at, updated_at
FROM user_grouping;


-- STEP 6: Atomically swap the tables.
-- The old table is kept as a backup, and the new table takes the original name.
RENAME TABLE `user_grouping` TO `user_grouping_old_backup`,
             `group_members` TO `user_grouping`;


-- STEP 7: Add the performance-enhancing index for looking up members by group.
CREATE INDEX `idx_user_grouping_group` ON `user_grouping` (`group_id`);


-- The migration is complete. The `user_grouping` table is now using the optimized schema.
-- You can safely delete the `user_grouping_old_backup` table after verifying the migration was successful.
-- DROP TABLE `user_grouping_old_backup`;
