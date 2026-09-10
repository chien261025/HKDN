-- ==========================================================
-- V2__seed_demo_data.sql: NẠP DỮ LIỆU GIẢ LẬP DEMO ĐỒ ÁN CHUẨN DOANH NGHIỆP ENTERPRISE
-- ==========================================================

-- 1. Nạp Quyền (Roles) & Danh mục quyền chi tiết (Permissions) & RBAC
INSERT INTO wms_role (id, name, description) VALUES
(1, 'ROLE_ADMIN', 'Quản trị viên toàn hệ thống'),
(2, 'ROLE_WAREHOUSE_MANAGER', 'Quản lý trưởng kho'),
(3, 'ROLE_OPERATOR', 'Nhân viên vận hành kho')
ON CONFLICT (id) DO NOTHING;

INSERT INTO wms_permission (id, code, name, module) VALUES
(1, 'INVENTORY:READ', 'Xem tồn kho theo thời gian thực', 'INVENTORY'),
(2, 'INVENTORY:ADJUST', 'Điều chỉnh cân bằng tồn kho', 'INVENTORY'),
(3, 'ORDER:CREATE', 'Tạo đơn đặt hàng nhập/xuất', 'ORDER'),
(4, 'ORDER:APPROVE', 'Phê duyệt xuất nhập kho', 'ORDER'),
(5, 'REPORT:EXPORT', 'Xuất báo cáo Streaming Excel dung lượng lớn', 'REPORT')
ON CONFLICT (id) DO NOTHING;

INSERT INTO wms_role_permission (role_id, permission_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5),
(3, 1), (3, 3)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Nạp Tài khoản mặc định (Mật khẩu demo: 123456)
INSERT INTO wms_user (id, username, password_hash, full_name, email, role_id) VALUES
(1, 'admin', '$2a$10$w8T0MhD17kP25y2oW7p1xe4V0zP5Nq8T9aV7X6Z1G4H2J3K5L6M7O', 'Nguyễn Quản Trị', 'admin@smartwms.vn', 1),
(2, 'manager01', '$2a$10$w8T0MhD17kP25y2oW7p1xe4V0zP5Nq8T9aV7X6Z1G4H2J3K5L6M7O', 'Trần Trưởng Kho', 'manager@smartwms.vn', 2),
(3, 'operator01', '$2a$10$w8T0MhD17kP25y2oW7p1xe4V0zP5Nq8T9aV7X6Z1G4H2J3K5L6M7O', 'Lê Thủ Kho', 'operator@smartwms.vn', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO wms_user_role (user_id, role_id) VALUES
(1, 1),
(2, 2),
(3, 3)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 2. Nạp Master Data Kho Tổng (Warehouse)
INSERT INTO wms_warehouse (id, code, name, address, contact_phone) VALUES
(1, 'WH01', 'Kho Tổng Tân Bình - TP.HCM', '102 Trường Chinh, P.12, Q.Tân Bình, TP.HCM', '02838112233'),
(2, 'WH02', 'Kho Phân Phối VSIP Bắc Ninh', 'KCN VSIP, Phù Chẩn, Từ Sơn, Bắc Ninh', '02223889900')
ON CONFLICT (id) DO NOTHING;

-- 3. Nạp Sơ đồ Kho Vật lý Chuẩn Hóa theo warehouse_id
INSERT INTO wms_location (id, warehouse_id, zone_code, aisle, rack, shelf, bin, bin_barcode, max_weight_kg) VALUES
(1, 1, 'ZONE_A', 'A01', 'R01', 'S01', 'B01', 'WH01-ZA-A01-R01-S01-B01', 500.0),
(2, 1, 'ZONE_A', 'A01', 'R01', 'S02', 'B02', 'WH01-ZA-A01-R01-S02-B02', 300.0),
(3, 1, 'ZONE_A', 'A01', 'R02', 'S01', 'B03', 'WH01-ZA-A01-R02-S01-B03', 500.0),
(4, 1, 'ZONE_A', 'A02', 'R01', 'S01', 'B04', 'WH01-ZA-A02-R01-S01-B04', 500.0),
(5, 1, 'ZONE_B', 'B01', 'R01', 'S01', 'B05', 'WH01-ZB-B01-R01-S01-B05', 200.0),
(6, 1, 'ZONE_B', 'B01', 'R01', 'S02', 'B06', 'WH01-ZB-B01-R01-S02-B06', 200.0)
ON CONFLICT (id) DO NOTHING;

-- 4. Nạp Danh mục Phân cấp (Category Tree)
INSERT INTO wms_category (id, code, name, parent_id) VALUES
(1, 'CAT-FOOD',  'Thực phẩm & Đồ uống', NULL),
(2, 'CAT-COOL',  'Thực phẩm mát & Sữa tươi', 1),
(3, 'CAT-ELEC',  'Thiết bị điện tử', NULL),
(4, 'CAT-PHONE', 'Điện thoại thông minh', 3),
(5, 'CAT-CHEM',  'Hóa mỹ phẩm & Tẩy rửa', NULL)
ON CONFLICT (id) DO NOTHING;

-- 5. Nạp Nhà cung cấp
INSERT INTO wms_supplier (id, code, name, contact_phone) VALUES
(1, 'SUP-VINAMILK', 'Công ty Cổ phần Sữa Việt Nam', '02854155555'),
(2, 'SUP-SAMSUNG',  'Công ty TNHH Điện tử Samsung Vina', '02839157310'),
(3, 'SUP-UNILEVER', 'Công ty TNHH Quốc tế Unilever Việt Nam', '02854135686')
ON CONFLICT (id) DO NOTHING;

-- 6. Nạp Danh mục Sản phẩm (Gắn category_id chuẩn)
INSERT INTO wms_product (id, sku, barcode, name, category_id, unit, safety_stock, reorder_point) VALUES
(1, 'SKU-MILK-100', '8934673123456', 'Sữa tươi tiệt trùng Vinamilk 100% 1L', 2, 'Hộp', 20, 50),
(2, 'SKU-SAMS-S24', '8806091234567', 'Điện thoại Samsung Galaxy S24 Ultra 256GB', 4, 'Chiếc', 5, 10),
(3, 'SKU-OMO-MATIC', '8934868765432', 'Nước giặt OMO Matic Cửa Trên 3.6kg', 5, 'Túi', 15, 30)
ON CONFLICT (id) DO NOTHING;

-- Nạp Danh mục Cung ứng N-N (Supplier Product Catalog)
INSERT INTO wms_supplier_product (supplier_id, product_id, supplier_sku, purchase_price, lead_time_days, min_order_qty, is_preferred) VALUES
(1, 1, 'VNM-MILK-1L', 28000.00, 2, 50, TRUE),
(2, 2, 'SS-S24U-256', 24500000.00, 5, 5, TRUE),
(3, 3, 'UNI-OMO-36', 150000.00, 3, 20, TRUE)
ON CONFLICT (supplier_id, product_id) DO NOTHING;

-- 7. Nạp Lô hàng (Batch) - Có quản lý Trạng thái Lô & Hạn sử dụng
INSERT INTO wms_product_batch (id, product_id, batch_number, manufacture_date, expiry_date, status, supplier_id) VALUES
(1, 1, 'BATCH-MILK-26A', '2026-06-01', '2026-09-25', 'ACTIVE',     1), -- CẬN DATE (< 20 ngày)
(2, 1, 'BATCH-MILK-26B', '2026-07-01', '2026-11-30', 'ACTIVE',     1), -- Hạn dài
(3, 2, 'BATCH-S24-01',   '2026-01-10', '2028-01-10', 'ACTIVE',     2), -- Có hạn bảo hành
(4, 3, 'BATCH-OMO-01',   '2026-03-01', '2027-03-01', 'ACTIVE',     3),
(5, 2, 'BATCH-S24-NOEXP', '2026-02-01', NULL,         'ACTIVE',     2), -- Không hạn dùng (NULLS LAST)
(6, 1, 'BATCH-MILK-QUAR', '2026-08-01', '2026-10-15', 'QUARANTINE', 1)  -- ĐANG CÁCH LY CHỜ KIỂM ĐỊNH (Không được xuất!)
ON CONFLICT (id) DO NOTHING;

-- 8. Nạp Tồn kho thực tế (Inventory) thỏa mãn on_hand_qty >= reserved_qty
INSERT INTO wms_inventory (location_id, product_id, batch_id, on_hand_qty, reserved_qty) VALUES
(5, 1, 1, 80, 0),   -- 80 hộp sữa cận date ở ô B05 (Zone B)
(6, 1, 2, 200, 0),  -- 200 hộp sữa hạn dài ở ô B06 (Zone B)
(1, 2, 3, 25, 5),   -- 25 điện thoại ở ô B01 (Zone A), 5 cái đang giữ cho đơn OUT-2026-002
(3, 3, 4, 60, 0)    -- 60 túi nước giặt ở ô B03 (Zone A)
ON CONFLICT (location_id, product_id, batch_id) DO NOTHING;

-- 9. Ghi nhận Sổ cái mở kho ban đầu (Stock Ledger) - performed_by = 1 (User admin)
INSERT INTO wms_stock_ledger (id, transaction_type, reference_code, location_id, product_id, batch_id, qty_change, balance_after, performed_by, notes) VALUES
(1, 'INITIAL_IMPORT', 'INIT-2026', 5, 1, 1, 80, 80, 1, 'Khởi tạo số dư đầu kỳ'),
(2, 'INITIAL_IMPORT', 'INIT-2026', 6, 1, 2, 200, 200, 1, 'Khởi tạo số dư đầu kỳ'),
(3, 'INITIAL_IMPORT', 'INIT-2026', 1, 2, 3, 25, 25, 1, 'Khởi tạo số dư đầu kỳ'),
(4, 'INITIAL_IMPORT', 'INIT-2026', 3, 3, 4, 60, 60, 1, 'Khởi tạo số dư đầu kỳ')
ON CONFLICT (id) DO NOTHING;

-- 10. Nạp Đơn hàng Nhập Kho & Chi Tiết Mặt Hàng
INSERT INTO wms_inbound_order (id, order_code, warehouse_id, supplier_id, status, created_by, notes) VALUES
(1, 'INB-2026-001', 1, 1, 'RECEIVED', 1, 'Đơn nhập sữa tươi từ Vinamilk'),
(2, 'INB-2026-002', 1, 2, 'PENDING',  2, 'Kế hoạch nhập Samsung Galaxy S24 đợt 2')
ON CONFLICT (id) DO NOTHING;

INSERT INTO wms_inbound_order_item (id, inbound_order_id, product_id, product_batch_id, batch_number, manufacture_date, expiry_date, expected_qty, received_qty, over_delivery_tolerance_pct, unit_price, status) VALUES
(1, 1, 1, 1, 'BATCH-MILK-26A', '2026-06-01', '2026-09-25', 280, 285, 10.00, 32000.00, 'COMPLETED'), -- Giao dôi 5 hộp (Over-delivery 285/280 <= 10%)
(2, 2, 2, NULL, 'BATCH-S24-02', '2026-02-15', '2028-02-15', 50,  0,   10.00, 25000000.00, 'PENDING')
ON CONFLICT (id) DO NOTHING;

-- 11. Nạp Đơn hàng Xuất Kho & Chi Tiết Dòng Đơn
INSERT INTO wms_outbound_order (id, order_code, warehouse_id, customer_name, status, created_by, notes) VALUES
(1, 'OUT-2026-001', 1, 'Siêu thị Co.opmart Cống Quỳnh', 'PENDING', 3, 'Xuất hàng sữa mát trong ngày'),
(2, 'OUT-2026-002', 1, 'Chuỗi bán lẻ FPT Shop',         'ALLOCATED', 3, 'Xuất lô điện thoại cao cấp')
ON CONFLICT (id) DO NOTHING;

INSERT INTO wms_outbound_order_item (id, outbound_order_id, product_id, requested_qty, allocated_qty, picked_qty, unit_price, status) VALUES
(1, 1, 1, 20, 0, 0, 35000.00, 'PENDING'),
(2, 2, 2, 5, 5, 0, 27990000.00, 'ALLOCATED')
ON CONFLICT (id) DO NOTHING;

-- Phân bổ nhặt hàng (Pick Allocation): Có đầy đủ product_id = 2, khớp với Outbound Item, Batch, và Inventory
INSERT INTO wms_pick_allocation (id, outbound_order_item_id, product_id, location_id, batch_id, allocated_qty, picked_qty, status) VALUES
(1, 2, 2, 1, 3, 5, 0, 'ALLOCATED')
ON CONFLICT (id) DO NOTHING;

-- 12. Nạp Phiếu Điều Chuyển Vị Trí Hàng (Stock Transfer)
INSERT INTO wms_stock_transfer (id, transfer_code, warehouse_id, from_location_id, to_location_id, product_id, batch_id, quantity, status, created_by, completed_by, notes, completed_at) VALUES
(1, 'TRF-2026-001', 1, 1, 2, 2, 3, 2, 'COMPLETED', 1, 2, 'Điều chuyển 2 chiếc S24 từ ô B01 sang ô B02 cùng kệ để cân tải', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 13. Nạp Phiếu Kiểm Kê Kho Thực Tế
INSERT INTO wms_inventory_audit (id, audit_code, warehouse_id, audit_type, status, created_by, notes) VALUES
(1, 'AUD-2026-09-01', 1, 'CYCLE_COUNT', 'IN_PROGRESS', 2, 'Kiểm kê định kỳ đầu tháng 9/2026')
ON CONFLICT (id) DO NOTHING;

INSERT INTO wms_inventory_audit_item (id, audit_id, location_id, product_id, batch_id, system_qty, counted_qty, status, counter_notes, counted_at) VALUES
(1, 1, 5, 1, 1, 80, 78, 'DISCREPANCY', 'Hụt 2 hộp do bao bì rách trong lúc xếp hàng', CURRENT_TIMESTAMP),
(2, 1, 1, 2, 3, 25, 25, 'MATCHED',     'Số lượng khớp 100% so với hệ thống', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- ==========================================================
-- 14. ĐỒNG BỘ LẠI TẤT CẢ SEQUENCES POSTGRESQL (CHUẨN ENTERPRISE)
-- ==========================================================
SELECT setval(pg_get_serial_sequence('wms_role', 'id'), COALESCE((SELECT MAX(id) FROM wms_role), 1));
SELECT setval(pg_get_serial_sequence('wms_permission', 'id'), COALESCE((SELECT MAX(id) FROM wms_permission), 1));
SELECT setval(pg_get_serial_sequence('wms_user', 'id'), COALESCE((SELECT MAX(id) FROM wms_user), 1));
SELECT setval(pg_get_serial_sequence('wms_warehouse', 'id'), COALESCE((SELECT MAX(id) FROM wms_warehouse), 1));
SELECT setval(pg_get_serial_sequence('wms_location', 'id'), COALESCE((SELECT MAX(id) FROM wms_location), 1));
SELECT setval(pg_get_serial_sequence('wms_category', 'id'), COALESCE((SELECT MAX(id) FROM wms_category), 1));
SELECT setval(pg_get_serial_sequence('wms_supplier', 'id'), COALESCE((SELECT MAX(id) FROM wms_supplier), 1));
SELECT setval(pg_get_serial_sequence('wms_product', 'id'), COALESCE((SELECT MAX(id) FROM wms_product), 1));
SELECT setval(pg_get_serial_sequence('wms_product_batch', 'id'), COALESCE((SELECT MAX(id) FROM wms_product_batch), 1));
SELECT setval(pg_get_serial_sequence('wms_inventory', 'id'), COALESCE((SELECT MAX(id) FROM wms_inventory), 1));
SELECT setval(pg_get_serial_sequence('wms_stock_ledger', 'id'), COALESCE((SELECT MAX(id) FROM wms_stock_ledger), 1));
SELECT setval(pg_get_serial_sequence('wms_inbound_order', 'id'), COALESCE((SELECT MAX(id) FROM wms_inbound_order), 1));
SELECT setval(pg_get_serial_sequence('wms_inbound_order_item', 'id'), COALESCE((SELECT MAX(id) FROM wms_inbound_order_item), 1));
SELECT setval(pg_get_serial_sequence('wms_outbound_order', 'id'), COALESCE((SELECT MAX(id) FROM wms_outbound_order), 1));
SELECT setval(pg_get_serial_sequence('wms_outbound_order_item', 'id'), COALESCE((SELECT MAX(id) FROM wms_outbound_order_item), 1));
SELECT setval(pg_get_serial_sequence('wms_pick_allocation', 'id'), COALESCE((SELECT MAX(id) FROM wms_pick_allocation), 1));
SELECT setval(pg_get_serial_sequence('wms_stock_transfer', 'id'), COALESCE((SELECT MAX(id) FROM wms_stock_transfer), 1));
SELECT setval(pg_get_serial_sequence('wms_inventory_audit', 'id'), COALESCE((SELECT MAX(id) FROM wms_inventory_audit), 1));
SELECT setval(pg_get_serial_sequence('wms_inventory_audit_item', 'id'), COALESCE((SELECT MAX(id) FROM wms_inventory_audit_item), 1));
