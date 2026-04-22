const db = require('./db');

const initializeReportsTables = async () => {
  try {
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS group_monthly_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        month TINYINT NOT NULL,
        year SMALLINT NOT NULL,
        monthly_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        commission_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        notes VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_group_month_period (group_id, month, year),
        INDEX idx_group_month_period (group_id, year, month)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS group_auction_winners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        month TINYINT NOT NULL,
        year SMALLINT NOT NULL,
        winner_user_id INT NULL,
        winner_name VARCHAR(120) NOT NULL,
        winner_member_phone VARCHAR(20) NULL,
        amount_taken DECIMAL(12,2) NOT NULL DEFAULT 0,
        auction_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_group_winner_period (group_id, month, year),
        INDEX idx_group_winner_period (group_id, year, month),
        INDEX idx_winner_phone (winner_member_phone)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS monthly_collections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        user_id INT NOT NULL,
        month TINYINT NOT NULL,
        year SMALLINT NOT NULL,
        amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        status ENUM('paid', 'pending', 'overdue') NOT NULL DEFAULT 'pending',
        due_date DATE NULL,
        paid_date DATETIME NULL,
        receipt_number VARCHAR(64) NULL,
        notes VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_group_user_month (group_id, user_id, month, year),
        INDEX idx_group_period (group_id, year, month),
        INDEX idx_user_period (user_id, year, month)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('Reports tables are ready');
  } catch (error) {
    console.error('Failed to initialize reports tables:', error);
  }
};

module.exports = { initializeReportsTables };
