-- Migration V8: RBAC Permission Matrix, User Warehouse Access & Audit Logging
-- Tuân thủ kiến trúc Enterprise WMS & OWASP Security Standard

-- 1. Bảng quyền chi tiết (Permissions)
CREATE TABLE IF NOT EXISTS wms_permission (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    description VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng liên kết Vai trò - Quyền hạn (Role - Permission)
CREATE TABLE IF NOT EXISTS wms_role_permission (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES wms_role(id) ON DELETE CASCADE,
    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES wms_permission(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng liên kết Người dùng - Kho hàng phụ trách (User - Warehouse Access)
CREATE TABLE IF NOT EXISTS wms_user_warehouse_access (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    UNIQUE KEY uk_user_warehouse (user_id, warehouse_id),
    CONSTRAINT fk_uwa_user FOREIGN KEY (user_id) REFERENCES wms_user(id) ON DELETE CASCADE,
    CONSTRAINT fk_uwa_warehouse FOREIGN KEY (warehouse_id) REFERENCES wms_warehouse(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng Nhật ký kiểm toán an ninh & biến động người dùng (Audit Log)
CREATE TABLE IF NOT EXISTS wms_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    actor_username VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL DEFAULT 'USER',
    target_id VARCHAR(50),
    target_name VARCHAR(100),
    details TEXT,
    ip_address VARCHAR(50),
    user_agent VARCHAR(255),
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

