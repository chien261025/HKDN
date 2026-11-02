-- ==========================================================
-- 03-create-readonly-ai-user.sql: TẠO USER AI_READONLY AN TOÀN (MYSQL)
-- ==========================================================

CREATE USER IF NOT EXISTS 'ai_readonly'@'%' IDENTIFIED BY 'ai_safe_password_2026';

-- Cấp quyền chỉ SELECT trên 2 View nghiệp vụ, KHÔNG cấp quyền trên các bảng gốc
GRANT SELECT ON wms_db.v_stock_summary TO 'ai_readonly'@'%';
GRANT SELECT ON wms_db.v_expiring_batches TO 'ai_readonly'@'%';

FLUSH PRIVILEGES;
