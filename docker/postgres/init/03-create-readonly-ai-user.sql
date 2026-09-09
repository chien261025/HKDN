-- ==========================================================
-- 03-create-readonly-ai-user.sql: TẠO USER AI_READONLY AN TOÀN
-- ==========================================================

-- Tạo user database riêng cho trợ lý AI
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'ai_readonly') THEN
        CREATE USER ai_readonly WITH PASSWORD 'ai_safe_password_2026';
    END IF;
END
$$;

-- Chỉ cấp quyền kết nối vào database
GRANT CONNECT ON DATABASE wms_db TO ai_readonly;
GRANT USAGE ON SCHEMA public TO ai_readonly;

-- Chỉ cấp quyền SELECT trên 2 View nghiệp vụ, KHÔNG cấp quyền trên các bảng gốc!
GRANT SELECT ON v_stock_summary TO ai_readonly;
GRANT SELECT ON v_expiring_batches TO ai_readonly;

-- Từ chối mọi quyền tạo/sửa/xóa bảng
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM ai_readonly;
GRANT SELECT ON v_stock_summary TO ai_readonly;
GRANT SELECT ON v_expiring_batches TO ai_readonly;
