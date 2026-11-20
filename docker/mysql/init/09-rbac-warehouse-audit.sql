USE wms_db;

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

-- Seed dữ liệu quyền chi tiết (Permissions)
INSERT INTO wms_permission (id, code, name, module, description) VALUES
(1, 'PO_VIEW', 'Xem đơn nhập kho', 'INBOUND', 'Tra cứu danh sách và chi tiết đơn mua hàng PO'),
(2, 'PO_CREATE', 'Tạo đơn nhập kho', 'INBOUND', 'Khởi tạo đơn PO và chỉ định nhà cung cấp'),
(3, 'PO_RECEIVE', 'Tiếp nhận & QC', 'INBOUND', 'Quét nhận hàng tại Staging và nghiệm thu QC'),
(4, 'PO_PUTAWAY', 'Cất hàng vào ô kệ', 'INBOUND', 'Chỉ định và hoàn tất lưu kho Putaway vào ô kệ'),
(5, 'SO_VIEW', 'Xem đơn xuất kho', 'OUTBOUND', 'Tra cứu danh sách và trạng thái đơn xuất hàng SO'),
(6, 'SO_CREATE', 'Tạo đơn xuất hàng', 'OUTBOUND', 'Khởi tạo đơn SO và thực hiện giữ tồn kho FEFO'),
(7, 'SO_PICK', 'Nhặt hàng Picking', 'OUTBOUND', 'Xuất danh sách nhặt hàng và quét gom hàng'),
(8, 'SO_DISPATCH', 'Duyệt xuất kho', 'OUTBOUND', 'Xuất hàng khỏi kho và cập nhật sổ cái tồn kho'),
(9, 'INVENTORY_VIEW', 'Tra cứu tồn kho', 'INVENTORY', 'Xem tồn theo SKU, lô hàng và vị trí ô kệ'),
(10, 'INVENTORY_TRANSFER', 'Điều chuyển nội bộ', 'INVENTORY', 'Lập lệnh chuyển hàng giữa các vị trí ô kệ'),
(11, 'STOCK_LEDGER_VIEW', 'Xem sổ cái thẻ kho', 'INVENTORY', 'Truy vấn sổ cái bất biến Immutable Stock Ledger'),
(12, 'AUDIT_VIEW', 'Xem đợt kiểm kê', 'AUDIT', 'Tra cứu lịch sử và tiến độ các đợt kiểm kê'),
(13, 'AUDIT_CREATE', 'Tạo đợt kiểm kê', 'AUDIT', 'Tạo đợt kiểm kê định kỳ, đột xuất hoặc đếm mù'),
(14, 'AUDIT_COUNT', 'Quét kiểm đếm PDA', 'AUDIT', 'Nhập số lượng thực đếm tại hiện trường'),
(15, 'AUDIT_APPROVE', 'Duyệt cân đối kho', 'AUDIT', 'Duyệt sai lệch kiểm kê và ghi bút toán sổ cái'),
(16, 'REPORT_VIEW', 'Xem báo cáo thống kê', 'REPORT', 'Báo cáo xuất nhập tồn, phân tích FEFO và KPI'),
(17, 'USER_VIEW', 'Xem danh sách tài khoản', 'IDENTITY', 'Tra cứu thông tin nhân sự và vai trò hệ thống'),
(18, 'USER_MANAGE', 'Quản lý tài khoản', 'IDENTITY', 'Tạo, sửa, khóa tài khoản và phân quyền vai trò'),
(19, 'SECURITY_AUDIT', 'Kiểm toán an ninh', 'IDENTITY', 'Xem nhật ký bảo mật, thiết bị và thu hồi phiên')
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description);

-- Gán quyền cho vai trò (Role Permissions)
-- ROLE_ADMIN: Toàn quyền 19 permissions
INSERT IGNORE INTO wms_role_permission (role_id, permission_id)
SELECT 1, id FROM wms_permission;

-- ROLE_WAREHOUSE_MANAGER (role_id = 2): Điều hành kho + Duyệt kiểm kê + Báo cáo (16 permissions, trừ USER_MANAGE & SECURITY_AUDIT)
INSERT IGNORE INTO wms_role_permission (role_id, permission_id)
SELECT 2, id FROM wms_permission WHERE code IN (
    'PO_VIEW', 'PO_CREATE', 'PO_RECEIVE', 'PO_PUTAWAY',
    'SO_VIEW', 'SO_CREATE', 'SO_PICK', 'SO_DISPATCH',
    'INVENTORY_VIEW', 'INVENTORY_TRANSFER', 'STOCK_LEDGER_VIEW',
    'AUDIT_VIEW', 'AUDIT_CREATE', 'AUDIT_APPROVE',
    'REPORT_VIEW', 'USER_VIEW'
);

-- ROLE_OPERATOR (role_id = 3): Tác nghiệp thực địa (PO_RECEIVE, SO_PICK, INVENTORY_VIEW, AUDIT_COUNT)
INSERT IGNORE INTO wms_role_permission (role_id, permission_id)
SELECT 3, id FROM wms_permission WHERE code IN (
    'PO_RECEIVE', 'SO_PICK', 'INVENTORY_VIEW', 'AUDIT_COUNT'
);

-- Phân quyền kho hàng cho tài khoản (User Warehouse Access)
-- User 1 (admin): Toàn bộ kho (WH01, WH02, WH03, WH04) - Primary WH01
INSERT IGNORE INTO wms_user_warehouse_access (user_id, warehouse_id, is_primary) VALUES
(1, 1, TRUE),
(1, 2, FALSE),
(1, 3, FALSE),
(1, 4, FALSE);

-- User 2 (manager01): Quản lý WH01 (Tân Bình) và WH04 (Sóng Thần) - Primary WH01
INSERT IGNORE INTO wms_user_warehouse_access (user_id, warehouse_id, is_primary) VALUES
(2, 1, TRUE),
(2, 4, FALSE);

-- User 3 (operator01): Thủ kho WH01 (Tân Bình)
INSERT IGNORE INTO wms_user_warehouse_access (user_id, warehouse_id, is_primary) VALUES
(3, 1, TRUE);

-- User 4 (admin1): Quản trị viên 1 - WH01 & WH02
INSERT IGNORE INTO wms_user_warehouse_access (user_id, warehouse_id, is_primary) VALUES
(4, 1, TRUE),
(4, 2, FALSE);

-- Test Accounts (Victim Test): Gán mặc định WH01
INSERT IGNORE INTO wms_user_warehouse_access (user_id, warehouse_id, is_primary) VALUES
(100, 1, TRUE),
(101, 1, TRUE),
(102, 1, TRUE);

-- Seed nhật ký kiểm toán mẫu (Audit Logs)
INSERT INTO wms_audit_log (action, actor_username, target_type, target_id, target_name, details, ip_address, created_at) VALUES
('SYSTEM_INIT', 'admin', 'SYSTEM', '1', 'System Security', 'Khởi tạo ma trận phân quyền RBAC và chính sách an ninh đa lớp', '127.0.0.1', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('ROLE_ASSIGN', 'admin', 'USER', '2', 'manager01', 'Gán quyền ROLE_WAREHOUSE_MANAGER và ủy quyền quản lý kho Tân Bình & Sóng Thần', '192.168.1.100', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('WAREHOUSE_GRANT', 'admin', 'USER', '2', 'manager01', 'Cấp quyền truy cập 2 chi nhánh: WH01 (Kho Tổng Tân Bình) và WH04 (Kho Sóng Thần)', '192.168.1.100', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('USER_CREATE', 'admin', 'USER', '4', 'admin1', 'Khởi tạo tài khoản Quản Trị Viên phụ tá @admin1 với thời hạn vĩnh viễn', '192.168.1.100', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('SECURITY_LOCKOUT', 'SYSTEM', 'USER', '100', 'brute_force_victim', 'Tạm khóa tài khoản do phát hiện 5 lần nhập sai mật khẩu liên tiếp (Brute-force protection)', '113.161.42.18', DATE_SUB(NOW(), INTERVAL 5 HOUR)),
('PASSWORD_RESET', 'admin', 'USER', '3', 'operator01', 'Cấp lại mật khẩu mặc định (123456) theo yêu cầu đổi ca làm việc', '192.168.1.100', DATE_SUB(NOW(), INTERVAL 2 HOUR));

