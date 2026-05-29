-- ============================================================
-- Truncate all data from fundapp database
-- Preserves schema structure, deletes all records
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE audit_logs;
TRUNCATE TABLE payment_transactions;
TRUNCATE TABLE refresh_tokens;
TRUNCATE TABLE monthly_collections;
TRUNCATE TABLE group_auction_winners;
TRUNCATE TABLE group_monthly_details;
TRUNCATE TABLE group_settings;
TRUNCATE TABLE user_grouping;
TRUNCATE TABLE groups;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

-- Verify all data deleted
SELECT 'Data truncated successfully!' as status;
SELECT 
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM groups) as groups_count,
    (SELECT COUNT(*) FROM monthly_collections) as collections_count,
    (SELECT COUNT(*) FROM user_grouping) as user_grouping_count;
