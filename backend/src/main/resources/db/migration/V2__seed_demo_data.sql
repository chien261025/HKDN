-- ==========================================================
-- V2__seed_demo_data.sql: NẠP DỮ LIỆU DEMO DOANH NGHIỆP ENTERPRISE (MYSQL 8)
-- ==========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Nạp Quyền (Roles) & Tài khoản mặc định
INSERT INTO wms_role (id, name, description) VALUES
(1, 'ROLE_ADMIN', 'Quản trị viên toàn hệ thống'),
(2, 'ROLE_WAREHOUSE_MANAGER', 'Quản lý trưởng kho'),
(3, 'ROLE_OPERATOR', 'Nhân viên vận hành kho')
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description);

-- Nạp Tài khoản mặc định (Mật khẩu demo: 123456)
INSERT INTO wms_user (id, username, password_hash, full_name, email, is_active, must_change_password) VALUES
(1, 'admin', '$2a$10$w8T0MhD17kP25y2oW7p1xe4V0zP5Nq8T9aV7X6Z1G4H2J3K5L6M7O', 'Nguyễn Quản Trị', 'admin@smartwms.vn', TRUE, FALSE),
(2, 'manager01', '$2a$10$w8T0MhD17kP25y2oW7p1xe4V0zP5Nq8T9aV7X6Z1G4H2J3K5L6M7O', 'Trần Trưởng Kho', 'manager@smartwms.vn', TRUE, FALSE),
(3, 'operator01', '$2a$10$w8T0MhD17kP25y2oW7p1xe4V0zP5Nq8T9aV7X6Z1G4H2J3K5L6M7O', 'Lê Thủ Kho', 'operator@smartwms.vn', TRUE, FALSE)
ON DUPLICATE KEY UPDATE username=VALUES(username), password_hash=VALUES(password_hash), full_name=VALUES(full_name), email=VALUES(email);

INSERT INTO wms_user_role (user_id, role_id) VALUES
(1, 1),
(2, 2),
(3, 3)
ON DUPLICATE KEY UPDATE user_id=VALUES(user_id), role_id=VALUES(role_id);

-- 2. Nạp Master Data Kho Tổng (Warehouse)
INSERT INTO wms_warehouse (id, code, name, address, contact_phone, is_active) VALUES
(1, 'WH01', 'Kho Tổng Tân Bình - TP.HCM', '102 Trường Chinh, P.12, Q.Tân Bình, TP.HCM', '02838112233', TRUE),
(2, 'WH02', 'Kho Phân Phối VSIP Bắc Ninh', 'KCN VSIP, Phù Chẩn, Từ Sơn, Bắc Ninh', '02223889900', TRUE)
ON DUPLICATE KEY UPDATE code=VALUES(code), name=VALUES(name), address=VALUES(address), contact_phone=VALUES(contact_phone);

-- 3. Nạp Sơ đồ Kho Vật lý Chuẩn Hóa theo warehouse_id
INSERT INTO wms_location (id, warehouse_id, zone_code, aisle, rack, shelf, bin, bin_barcode, max_weight_kg, is_active) VALUES
(1, 1, 'ZONE_A', 'A01', 'R01', 'S01', 'B01', 'WH01-ZA-A01-R01-S01-B01', 500.0, TRUE),
(2, 1, 'ZONE_A', 'A01', 'R01', 'S02', 'B02', 'WH01-ZA-A01-R01-S02-B02', 300.0, TRUE),
(3, 1, 'ZONE_A', 'A01', 'R02', 'S01', 'B03', 'WH01-ZA-A01-R02-S01-B03', 500.0, TRUE),
(4, 1, 'ZONE_A', 'A02', 'R01', 'S01', 'B04', 'WH01-ZA-A02-R01-S01-B04', 500.0, TRUE),
(5, 1, 'ZONE_B', 'B01', 'R01', 'S01', 'B05', 'WH01-ZB-B01-R01-S01-B05', 200.0, TRUE),
(6, 1, 'ZONE_B', 'B01', 'R01', 'S02', 'B06', 'WH01-ZB-B01-R01-S02-B06', 200.0, TRUE)
ON DUPLICATE KEY UPDATE bin_barcode=VALUES(bin_barcode), max_weight_kg=VALUES(max_weight_kg);

-- 4. Nạp Danh mục Phân cấp (Category Tree)
INSERT INTO wms_category (id, code, name, parent_id, is_active) VALUES
(1, 'CAT-FOOD',  'Thực phẩm & Đồ uống', NULL, TRUE),
(2, 'CAT-COOL',  'Thực phẩm mát & Sữa tươi', 1, TRUE),
(3, 'CAT-ELEC',  'Thiết bị điện tử', NULL, TRUE),
(4, 'CAT-PHONE', 'Điện thoại thông minh', 3, TRUE),
(5, 'CAT-CHEM',  'Hóa mỹ phẩm & Tẩy rửa', NULL, TRUE)
ON DUPLICATE KEY UPDATE code=VALUES(code), name=VALUES(name), parent_id=VALUES(parent_id);

-- 5. Nạp Nhà cung cấp
INSERT INTO wms_supplier (id, code, name, contact_phone) VALUES
(1, 'SUP-VINAMILK', 'Công ty Cổ phần Sữa Việt Nam', '02854155555'),
(2, 'SUP-SAMSUNG',  'Công ty TNHH Điện tử Samsung Vina', '02839157310'),
(3, 'SUP-UNILEVER', 'Công ty TNHH Quốc tế Unilever Việt Nam', '02854135686')
ON DUPLICATE KEY UPDATE code=VALUES(code), name=VALUES(contact_phone);

-- 6. Nạp Danh mục Sản phẩm
INSERT INTO wms_product (id, sku, barcode, name, category_id, unit, safety_stock, reorder_point) VALUES
(1, 'SKU-MILK-100', '8934673123456', 'Sữa tươi tiệt trùng Vinamilk 100% 1L', 2, 'Hộp', 20, 50),
(2, 'SKU-SAMS-S24', '8806091234567', 'Điện thoại Samsung Galaxy S24 Ultra 256GB', 4, 'Chiếc', 5, 10),
(3, 'SKU-OMO-MATIC', '8934868765432', 'Nước giặt OMO Matic Cửa Trên 3.6kg', 5, 'Túi', 15, 30)
ON DUPLICATE KEY UPDATE sku=VALUES(sku), barcode=VALUES(barcode), name=VALUES(name), category_id=VALUES(category_id);

-- 7. Nạp Lô hàng (Batch)
INSERT INTO wms_product_batch (id, product_id, batch_number, manufacture_date, expiry_date, status, supplier_id) VALUES
(1, 1, 'BATCH-MILK-26A', '2026-06-01', '2026-09-25', 'ACTIVE',     1),
(2, 1, 'BATCH-MILK-26B', '2026-07-01', '2026-11-30', 'ACTIVE',     1),
(3, 2, 'BATCH-S24-01',   '2026-01-10', '2028-01-10', 'ACTIVE',     2),
(4, 3, 'BATCH-OMO-01',   '2026-03-01', '2027-03-01', 'ACTIVE',     3),
(5, 2, 'BATCH-S24-NOEXP', '2026-02-01', NULL,         'ACTIVE',     2),
(6, 1, 'BATCH-MILK-QUAR', '2026-08-01', '2026-10-15', 'QUARANTINE', 1)
ON DUPLICATE KEY UPDATE batch_number=VALUES(batch_number), status=VALUES(status);

-- 8. Nạp Tồn kho thực tế (Inventory)
INSERT INTO wms_inventory (id, location_id, product_id, batch_id, on_hand_qty, reserved_qty, version) VALUES
(1, 5, 1, 1, 80, 0, 0),
(2, 6, 1, 2, 200, 0, 0),
(3, 1, 2, 3, 25, 5, 0),
(4, 3, 3, 4, 60, 0, 0)
ON DUPLICATE KEY UPDATE on_hand_qty=VALUES(on_hand_qty), reserved_qty=VALUES(reserved_qty);

-- 9. Ghi nhận Sổ cái mở kho ban đầu (Stock Ledger)
INSERT INTO wms_stock_ledger (id, transaction_type, reference_code, location_id, product_id, batch_id, qty_change, balance_after, performed_by, notes) VALUES
(1, 'INITIAL_IMPORT', 'INIT-2026', 5, 1, 1, 80, 80, 1, 'Khởi tạo số dư đầu kỳ'),
(2, 'INITIAL_IMPORT', 'INIT-2026', 6, 1, 2, 200, 200, 1, 'Khởi tạo số dư đầu kỳ'),
(3, 'INITIAL_IMPORT', 'INIT-2026', 1, 2, 3, 25, 25, 1, 'Khởi tạo số dư đầu kỳ'),
(4, 'INITIAL_IMPORT', 'INIT-2026', 3, 3, 4, 60, 60, 1, 'Khởi tạo số dư đầu kỳ')
ON DUPLICATE KEY UPDATE transaction_type=VALUES(transaction_type), reference_code=VALUES(reference_code);

-- 10. Nạp Đơn hàng Nhập Kho & Chi Tiết
INSERT INTO wms_inbound_order (id, order_code, warehouse_id, supplier_id, status, created_by, notes) VALUES
(1, 'INB-2026-001', 1, 1, 'RECEIVED', 1, 'Đơn nhập sữa tươi từ Vinamilk'),
(2, 'INB-2026-002', 1, 2, 'PENDING',  2, 'Kế hoạch nhập Samsung Galaxy S24 đợt 2')
ON DUPLICATE KEY UPDATE order_code=VALUES(order_code), status=VALUES(status);

INSERT INTO wms_inbound_order_item (id, inbound_order_id, product_id, product_batch_id, batch_number, manufacture_date, expiry_date, expected_qty, received_qty, over_delivery_tolerance_pct, unit_price, status) VALUES
(1, 1, 1, 1, 'BATCH-MILK-26A', '2026-06-01', '2026-09-25', 280, 285, 10.00, 32000.00, 'COMPLETED'),
(2, 2, 2, NULL, 'BATCH-S24-02', '2026-02-15', '2028-02-15', 50,  0,   10.00, 25000000.00, 'PENDING')
ON DUPLICATE KEY UPDATE status=VALUES(status), received_qty=VALUES(received_qty);

-- 11. Nạp Đơn hàng Xuất Kho & Chi Tiết Dòng Đơn
INSERT INTO wms_outbound_order (id, order_code, warehouse_id, customer_name, status, created_by, notes) VALUES
(1, 'OUT-2026-001', 1, 'Siêu thị Co.opmart Cống Quỳnh', 'PENDING', 3, 'Xuất hàng sữa mát trong ngày'),
(2, 'OUT-2026-002', 1, 'Chuỗi bán lẻ FPT Shop',         'ALLOCATED', 3, 'Xuất lô điện thoại cao cấp')
ON DUPLICATE KEY UPDATE order_code=VALUES(order_code), status=VALUES(status);

INSERT INTO wms_outbound_order_item (id, outbound_order_id, product_id, requested_qty, allocated_qty, picked_qty, unit_price, status) VALUES
(1, 1, 1, 20, 0, 0, 35000.00, 'PENDING'),
(2, 2, 2, 5, 5, 0, 27990000.00, 'ALLOCATED')
ON DUPLICATE KEY UPDATE requested_qty=VALUES(requested_qty), allocated_qty=VALUES(allocated_qty);

INSERT INTO wms_pick_allocation (id, outbound_order_item_id, product_id, location_id, batch_id, allocated_qty, picked_qty, status) VALUES
(1, 2, 2, 1, 3, 5, 0, 'ALLOCATED')
ON DUPLICATE KEY UPDATE allocated_qty=VALUES(allocated_qty), status=VALUES(status);

-- 12. Nạp Phiếu Điều Chuyển Vị Trí Hàng (Stock Transfer)
INSERT INTO wms_stock_transfer (id, transfer_code, warehouse_id, from_location_id, to_location_id, product_id, batch_id, quantity, status, created_by, completed_by, notes, completed_at) VALUES
(1, 'TRF-2026-001', 1, 1, 2, 2, 3, 2, 'COMPLETED', 1, 2, 'Điều chuyển 2 chiếc S24 từ ô B01 sang ô B02 cùng kệ để cân tải', CURRENT_TIMESTAMP(6))
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 13. Nạp Phiếu Kiểm Kê Kho Thực Tế
INSERT INTO wms_inventory_audit (id, audit_code, warehouse_id, audit_type, status, created_by, notes) VALUES
(1, 'AUD-2026-09-01', 1, 'CYCLE_COUNT', 'IN_PROGRESS', 2, 'Kiểm kê định kỳ đầu tháng 9/2026')
ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT INTO wms_inventory_audit_item (id, audit_id, location_id, product_id, batch_id, system_qty, counted_qty, status, counter_notes, counted_at) VALUES
(1, 1, 5, 1, 1, 80, 78, 'DISCREPANCY', 'Hụt 2 hộp do bao bì rách trong lúc xếp hàng', CURRENT_TIMESTAMP(6)),
(2, 1, 1, 2, 3, 25, 25, 'MATCHED',     'Số lượng khớp 100% so với hệ thống', CURRENT_TIMESTAMP(6))
ON DUPLICATE KEY UPDATE status=VALUES(status), counted_qty=VALUES(counted_qty);

-- 14. Nạp Phiếu Giữ Chỗ Tồn Kho (Stock Reservation)
INSERT INTO wms_stock_reservation (id, outbound_order_id, outbound_order_item_id, location_id, product_id, batch_id, reserved_qty, status, expires_at) VALUES
(1, 2, 2, 1, 2, 3, 5, 'RESERVED', DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL 24 HOUR))
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 15. Nạp Phiếu Cân Chỉnh Tồn Kho Sau Kiểm Kê (Stock Adjustment)
INSERT INTO wms_stock_adjustment (id, adjustment_code, audit_id, warehouse_id, reason, status, created_by, notes) VALUES
(1, 'ADJ-2026-001', 1, 1, 'Hao hụt kiểm kê đầu tháng 9/2026', 'PENDING', 2, 'Chờ duyệt trừ 2 hộp sữa rách bao bì')
ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT INTO wms_stock_adjustment_item (id, adjustment_id, location_id, product_id, batch_id, system_qty, actual_qty) VALUES
(1, 1, 5, 1, 1, 80, 78)
ON DUPLICATE KEY UPDATE actual_qty=VALUES(actual_qty);

ALTER TABLE wms_role AUTO_INCREMENT = 100;
ALTER TABLE wms_user AUTO_INCREMENT = 100;
ALTER TABLE wms_warehouse AUTO_INCREMENT = 100;
ALTER TABLE wms_location AUTO_INCREMENT = 100;
ALTER TABLE wms_category AUTO_INCREMENT = 100;
ALTER TABLE wms_supplier AUTO_INCREMENT = 100;
ALTER TABLE wms_product AUTO_INCREMENT = 100;
ALTER TABLE wms_product_batch AUTO_INCREMENT = 100;
ALTER TABLE wms_inventory AUTO_INCREMENT = 100;
ALTER TABLE wms_stock_ledger AUTO_INCREMENT = 100;
ALTER TABLE wms_inbound_order AUTO_INCREMENT = 100;
ALTER TABLE wms_inbound_order_item AUTO_INCREMENT = 100;
ALTER TABLE wms_outbound_order AUTO_INCREMENT = 100;
ALTER TABLE wms_outbound_order_item AUTO_INCREMENT = 100;
ALTER TABLE wms_pick_allocation AUTO_INCREMENT = 100;
ALTER TABLE wms_stock_transfer AUTO_INCREMENT = 100;
ALTER TABLE wms_inventory_audit AUTO_INCREMENT = 100;
ALTER TABLE wms_inventory_audit_item AUTO_INCREMENT = 100;
ALTER TABLE wms_stock_reservation AUTO_INCREMENT = 100;
ALTER TABLE wms_stock_adjustment AUTO_INCREMENT = 100;
ALTER TABLE wms_stock_adjustment_item AUTO_INCREMENT = 100;

SET FOREIGN_KEY_CHECKS = 1;
