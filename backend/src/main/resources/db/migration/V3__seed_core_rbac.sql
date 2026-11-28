-- =============================================================================
-- V3__seed_core_rbac.sql
-- Enterprise RBAC Matrix, System Users, Multi-Warehouse Topology & Physical Bins
-- =============================================================================

SET NAMES utf8mb4;

-- 1. Vai trò hệ thống (Roles)
INSERT INTO `wms_role` (`id`, `name`, `description`) VALUES
('1', 'ROLE_ADMIN', 'Quản trị viên toàn hệ thống'),
('2', 'ROLE_WAREHOUSE_MANAGER', 'Quản lý trưởng kho'),
('3', 'ROLE_OPERATOR', 'Nhân viên vận hành kho')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `description` = VALUES(`description`);

-- 2. Ma trận quyền chi tiết (20 Enterprise Permissions)
INSERT INTO `wms_permission` (`id`, `code`, `name`, `module`, `description`) VALUES
('1', 'PO_VIEW', 'Xem đơn nhập kho', 'INBOUND', 'Tra cứu danh sách và chi tiết đơn mua hàng PO'),
('2', 'PO_CREATE', 'Tạo đơn nhập kho', 'INBOUND', 'Khởi tạo đơn PO và chỉ định nhà cung cấp'),
('3', 'PO_RECEIVE', 'Tiếp nhận & QC', 'INBOUND', 'Quét nhận hàng tại Staging và nghiệm thu QC'),
('4', 'PO_PUTAWAY', 'Cất hàng vào ô kệ', 'INBOUND', 'Chỉ định và hoàn tất lưu kho Putaway vào ô kệ'),
('5', 'SO_VIEW', 'Xem đơn xuất kho', 'OUTBOUND', 'Tra cứu danh sách và trạng thái đơn xuất hàng SO'),
('6', 'SO_CREATE', 'Tạo đơn xuất hàng', 'OUTBOUND', 'Khởi tạo đơn SO và thực hiện giữ tồn kho FEFO'),
('7', 'SO_PICK', 'Nhặt hàng Picking', 'OUTBOUND', 'Xuất danh sách nhặt hàng và quét gom hàng'),
('8', 'SO_DISPATCH', 'Duyệt xuất kho', 'OUTBOUND', 'Xuất hàng khỏi kho và cập nhật sổ cái tồn kho'),
('9', 'INVENTORY_VIEW', 'Tra cứu tồn kho', 'INVENTORY', 'Xem tồn theo SKU, lô hàng và vị trí ô kệ'),
('10', 'INVENTORY_TRANSFER', 'Điều chuyển nội bộ', 'INVENTORY', 'Lập lệnh chuyển hàng giữa các vị trí ô kệ'),
('11', 'STOCK_LEDGER_VIEW', 'Xem sổ cái thẻ kho', 'INVENTORY', 'Truy vấn sổ cái bất biến Immutable Stock Ledger'),
('12', 'AUDIT_VIEW', 'Xem đợt kiểm kê', 'AUDIT', 'Tra cứu lịch sử và tiến độ các đợt kiểm kê'),
('13', 'AUDIT_CREATE', 'Tạo đợt kiểm kê', 'AUDIT', 'Tạo đợt kiểm kê định kỳ, đột xuất hoặc đếm mù'),
('14', 'AUDIT_COUNT', 'Quét kiểm đếm PDA', 'AUDIT', 'Nhập số lượng thực đếm tại hiện trường'),
('15', 'AUDIT_APPROVE', 'Duyệt cân đối kho', 'AUDIT', 'Duyệt sai lệch kiểm kê và ghi bút toán sổ cái'),
('16', 'REPORT_VIEW', 'Xem báo cáo thống kê', 'REPORT', 'Báo cáo xuất nhập tồn, phân tích FEFO và KPI'),
('17', 'USER_VIEW', 'Xem danh sách tài khoản', 'IDENTITY', 'Tra cứu thông tin nhân sự và vai trò hệ thống'),
('18', 'USER_MANAGE', 'Quản lý tài khoản', 'IDENTITY', 'Tạo, sửa, khóa tài khoản và phân quyền vai trò'),
('19', 'SECURITY_AUDIT', 'Kiểm toán an ninh', 'IDENTITY', 'Xem nhật ký bảo mật, thiết bị và thu hồi phiên'),
('20', 'PRICE_VIEW', 'Xem giá vốn & giá bán', 'MASTER_DATA', 'Cho phép xem thông tin giá nhập, giá bán và giá trị hàng tồn kho')
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`), `name` = VALUES(`name`), `module` = VALUES(`module`), `description` = VALUES(`description`);

-- 3. Liên kết Vai trò - Quyền hạn (Strict Separation of Duties)
INSERT INTO `wms_role_permission` (`role_id`, `permission_id`) VALUES
(1, 17),
(1, 18),
(1, 19),
(1, 20),
(2, 1),
(2, 2),
(2, 3),
(2, 4),
(2, 5),
(2, 6),
(2, 7),
(2, 8),
(2, 9),
(2, 10),
(2, 11),
(2, 12),
(2, 13),
(2, 15),
(2, 16),
(2, 17),
(2, 20),
(3, 3),
(3, 7),
(3, 9),
(3, 14)
ON DUPLICATE KEY UPDATE `permission_id` = VALUES(`permission_id`);

-- 4. Tài khoản người dùng mặc định (admin/operator01: 123456 | manager01/admin1: 1234567)
INSERT INTO `wms_user` (`id`, `username`, `password_hash`, `full_name`, `email`, `is_active`, `must_change_password`) VALUES
(1, 'admin', '$2a$10$j.sA7hkbGlKNm8HhzTdRNuUgXzf0LRTN1Tyx5sbzo.6m/uIu9oHkm', 'Nguyễn Quản Trị', 'admin@smartwms.vn', TRUE, FALSE),
(2, 'manager01', '$2a$10$7u/yAooOdTN402Jt3wVmeu8akcAsGmIZCMVy4URmUdwablnBEVKYy', 'Trần Trưởng Kho', 'manager@smartwms.vn', TRUE, FALSE),
(3, 'operator01', '$2a$10$j.sA7hkbGlKNm8HhzTdRNuUgXzf0LRTN1Tyx5sbzo.6m/uIu9oHkm', 'Lê Thủ Kho', 'operator@smartwms.vn', TRUE, FALSE),
(4, 'admin1', '$2a$10$7u/yAooOdTN402Jt3wVmeu8akcAsGmIZCMVy4URmUdwablnBEVKYy', 'Quản Trị Viên 1', 'admin1@smartwms.vn', TRUE, FALSE)
ON DUPLICATE KEY UPDATE `username` = VALUES(`username`), `password_hash` = VALUES(`password_hash`), `full_name` = VALUES(`full_name`), `email` = VALUES(`email`), `is_active` = VALUES(`is_active`), `must_change_password` = VALUES(`must_change_password`);

-- 5. Phân vai trò cho tài khoản mặc định
INSERT INTO `wms_user_role` (`user_id`, `role_id`) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 1)
ON DUPLICATE KEY UPDATE `role_id` = VALUES(`role_id`);

-- 6. Hệ thống chi nhánh kho hàng (Warehouses WH01 - WH04)
INSERT INTO `wms_warehouse` (`id`, `code`, `name`, `address`, `contact_phone`, `is_active`, `trusted_ips`) VALUES
(1, 'WH01', 'Kho Tổng Tân Bình - TP.HCM', '102 Trường Chinh, P.12, Q.Tân Bình, TP.HCM', '0900000004', TRUE, '192.168.1.0/24, 10.0.0.1, 172.16.20.0/24'),
(2, 'WH02', 'Kho Phân Phối VSIP Bắc Ninh', 'Đại lộ Hữu Nghị, KCN VSIP, Từ Sơn, Bắc Ninh', '0222 388 9900', TRUE, 'NULL'),
(3, 'WH03', 'Kho Vận Miền Trung - Đà Nẵng', 'Đường số 3, KCN Hòa Khánh, Liên Chiểu, TP. Đà Nẵng', '0236 377 6688', TRUE, 'NULL'),
(4, 'WH04', 'Kho Trung Chuyển Sóng Thần - Bình Dương', 'KCN Sóng Thần 1, Dĩ An, Bình Dương', '0274 379 1234', TRUE, 'NULL')
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`), `name` = VALUES(`name`), `address` = VALUES(`address`), `contact_phone` = VALUES(`contact_phone`), `is_active` = VALUES(`is_active`), `trusted_ips` = VALUES(`trusted_ips`);

-- 7. Phân quyền truy cập kho (User - Warehouse Access Scope)
INSERT INTO `wms_user_warehouse_access` (`id`, `user_id`, `warehouse_id`, `is_primary`) VALUES
(5, 2, 1, TRUE),
(6, 2, 4, FALSE),
(7, 3, 1, TRUE),
(8, 4, 1, TRUE),
(9, 4, 2, FALSE),
(39, 1, 1, TRUE),
(40, 1, 2, FALSE)
ON DUPLICATE KEY UPDATE `user_id` = VALUES(`user_id`), `warehouse_id` = VALUES(`warehouse_id`), `is_primary` = VALUES(`is_primary`);

-- 8. Sơ đồ ô kệ vật lý đa kho (Physical Bin Locations)
INSERT INTO `wms_location` (`id`, `warehouse_id`, `zone_code`, `aisle`, `rack`, `shelf`, `bin`, `bin_barcode`, `max_weight_kg`, `is_active`) VALUES
(1, 1, 'ZONE_A', 'A01', 'R01', 'S01', 'B01', 'WH01-ZA-A01-R01-S01-B01', 500.00, TRUE),
(2, 1, 'ZONE_A', 'A01', 'R01', 'S02', 'B02', 'WH01-ZA-A01-R01-S02-B02', 300.00, TRUE),
(3, 1, 'ZONE_A', 'A01', 'R02', 'S01', 'B03', 'WH01-ZA-A01-R02-S01-B03', 500.00, TRUE),
(4, 1, 'ZONE_A', 'A02', 'R01', 'S01', 'B04', 'WH01-ZA-A02-R01-S01-B04', 500.00, TRUE),
(5, 1, 'ZONE_B', 'B01', 'R01', 'S01', 'B05', 'WH01-ZB-B01-R01-S01-B05', 200.00, TRUE),
(6, 1, 'ZONE_B', 'B01', 'R01', 'S02', 'B06', 'WH01-ZB-B01-R01-S02-B06', 200.00, TRUE),
(7, 1, 'ZONE_A', 'A02', 'R01', 'S02', 'B07', 'WH01-ZA-A02-R01-S02-B07', 500.00, TRUE),
(8, 1, 'ZONE_A', 'A02', 'R02', 'S01', 'B08', 'WH01-ZA-A02-R02-S01-B08', 500.00, TRUE),
(9, 1, 'ZONE_B', 'B02', 'R01', 'S01', 'B09', 'WH01-ZB-B02-R01-S01-B09', 400.00, TRUE),
(10, 1, 'ZONE_B', 'B02', 'R01', 'S02', 'B10', 'WH01-ZB-B02-R01-S02-B10', 400.00, TRUE),
(11, 1, 'ZONE_B', 'B02', 'R02', 'S01', 'B11', 'WH01-ZB-B02-R02-S01-B11', 400.00, TRUE),
(12, 1, 'ZONE_B', 'B02', 'R02', 'S02', 'B12', 'WH01-ZB-B02-R02-S02-B12', 400.00, TRUE),
(13, 1, 'ZONE_C', 'C01', 'R01', 'S01', 'B13', 'WH01-ZC-C01-R01-S01-B13', 300.00, TRUE),
(14, 1, 'ZONE_C', 'C01', 'R01', 'S02', 'B14', 'WH01-ZC-C01-R01-S02-B14', 300.00, TRUE),
(15, 1, 'ZONE_C', 'C01', 'R02', 'S01', 'B15', 'WH01-ZC-C01-R02-S01-B15', 300.00, TRUE),
(16, 1, 'ZONE_C', 'C02', 'R01', 'S01', 'B16', 'WH01-ZC-C02-R01-S01-B16', 300.00, TRUE),
(21, 2, 'ZONE_A', 'A01', 'R01', 'S01', 'B01', 'WH02-ZA-A01-R01-S01-B01', 1000.00, TRUE),
(22, 2, 'ZONE_A', 'A01', 'R01', 'S02', 'B02', 'WH02-ZA-A01-R01-S02-B02', 1000.00, TRUE),
(23, 2, 'ZONE_A', 'A02', 'R01', 'S01', 'B03', 'WH02-ZA-A02-R01-S01-B03', 1000.00, TRUE),
(24, 2, 'ZONE_B', 'B01', 'R01', 'S01', 'B04', 'WH02-ZB-B01-R01-S01-B04', 3000.00, TRUE),
(25, 2, 'ZONE_B', 'B01', 'R01', 'S02', 'B05', 'WH02-ZB-B01-R01-S02-B05', 3000.00, TRUE),
(26, 2, 'ZONE_C', 'C01', 'R01', 'S01', 'B06', 'WH02-ZC-C01-R01-S01-B06', 2000.00, TRUE),
(31, 3, 'ZONE_A', 'A01', 'R01', 'S01', 'B01', 'WH03-ZA-A01-R01-S01-B01', 1000.00, TRUE),
(32, 3, 'ZONE_A', 'A01', 'R01', 'S02', 'B02', 'WH03-ZA-A01-R01-S02-B02', 1000.00, TRUE),
(33, 3, 'ZONE_B', 'B01', 'R01', 'S01', 'B03', 'WH03-ZB-B01-R01-S01-B03', 1500.00, TRUE),
(34, 3, 'ZONE_B', 'B01', 'R01', 'S02', 'B04', 'WH03-ZB-B01-R01-S02-B04', 1500.00, TRUE),
(35, 3, 'ZONE_C', 'C01', 'R01', 'S01', 'B05', 'WH03-ZC-C01-R01-S01-B05', 2000.00, TRUE),
(41, 4, 'ZONE_A', 'A01', 'R01', 'S01', 'B01', 'WH04-ZA-A01-R01-S01-B01', 1000.00, TRUE),
(42, 4, 'ZONE_A', 'A01', 'R01', 'S02', 'B02', 'WH04-ZA-A01-R01-S02-B02', 1000.00, TRUE),
(43, 4, 'ZONE_B', 'B01', 'R01', 'S01', 'B03', 'WH04-ZB-B01-R01-S01-B03', 1500.00, TRUE),
(44, 4, 'ZONE_C', 'C01', 'R01', 'S01', 'B04', 'WH04-ZC-C01-R01-S01-B04', 2000.00, TRUE)
ON DUPLICATE KEY UPDATE `warehouse_id` = VALUES(`warehouse_id`), `zone_code` = VALUES(`zone_code`), `aisle` = VALUES(`aisle`), `rack` = VALUES(`rack`), `shelf` = VALUES(`shelf`), `bin` = VALUES(`bin`), `bin_barcode` = VALUES(`bin_barcode`), `max_weight_kg` = VALUES(`max_weight_kg`), `is_active` = VALUES(`is_active`);

-- 9. Bản ghi kiểm toán an ninh khởi tạo
INSERT INTO `wms_audit_log` (`id`, `action`, `actor_username`, `target_type`, `target_id`, `target_name`, `details`, `ip_address`, `user_agent`)
VALUES (1, 'SYSTEM_BOOTSTRAP', 'system', 'RBAC', '1', 'RBAC Permission Matrix', 'Khởi tạo ma trận phân quyền RBAC và kiểm soát kho mặc định', '127.0.0.1', 'Flyway-Migration')
ON DUPLICATE KEY UPDATE `details` = VALUES(`details`);

ALTER TABLE `wms_role` AUTO_INCREMENT = 100;
ALTER TABLE `wms_permission` AUTO_INCREMENT = 100;
ALTER TABLE `wms_user` AUTO_INCREMENT = 100;
ALTER TABLE `wms_warehouse` AUTO_INCREMENT = 100;
ALTER TABLE `wms_user_warehouse_access` AUTO_INCREMENT = 100;
ALTER TABLE `wms_location` AUTO_INCREMENT = 100;
ALTER TABLE `wms_audit_log` AUTO_INCREMENT = 100;
