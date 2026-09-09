-- ==========================================================
-- V2__seed_demo_data.sql: NẠP DỮ LIỆU GIẢ LẬP DEMO ĐỒ ÁN
-- ==========================================================

-- 1. Nạp Quyền & Tài khoản mặc định (Mật khẩu demo: 123456)
INSERT INTO wms_role (id, name, description) VALUES
(1, 'ROLE_ADMIN', 'Quản trị viên toàn hệ thống'),
(2, 'ROLE_WAREHOUSE_MANAGER', 'Quản lý trưởng kho'),
(3, 'ROLE_OPERATOR', 'Nhân viên vận hành kho')
ON CONFLICT (id) DO NOTHING;

INSERT INTO wms_user (username, password_hash, full_name, email, role_id) VALUES
('admin', '$2a$10$w8T0MhD17kP25y2oW7p1xe4V0zP5Nq8T9aV7X6Z1G4H2J3K5L6M7O', 'Nguyễn Quản Trị', 'admin@smartwms.vn', 1),
('manager01', '$2a$10$w8T0MhD17kP25y2oW7p1xe4V0zP5Nq8T9aV7X6Z1G4H2J3K5L6M7O', 'Trần Trưởng Kho', 'manager@smartwms.vn', 2),
('operator01', '$2a$10$w8T0MhD17kP25y2oW7p1xe4V0zP5Nq8T9aV7X6Z1G4H2J3K5L6M7O', 'Lê Thủ Kho', 'operator@smartwms.vn', 3)
ON CONFLICT (username) DO NOTHING;

-- 2. Nạp Sơ đồ Kho Vật lý (Zone A: Hàng Khô, Zone B: Hàng Mát)
INSERT INTO wms_location (id, zone_code, aisle, rack, shelf, bin_barcode, max_weight_kg) VALUES
(1, 'ZONE_A', 'A01', 'R01', 'S01', 'ZA-A01-R01-S01-B01', 500.0),
(2, 'ZONE_A', 'A01', 'R01', 'S02', 'ZA-A01-R01-S02-B02', 300.0),
(3, 'ZONE_A', 'A01', 'R02', 'S01', 'ZA-A01-R02-S01-B03', 500.0),
(4, 'ZONE_A', 'A02', 'R01', 'S01', 'ZA-A02-R01-S01-B04', 500.0),
(5, 'ZONE_B', 'B01', 'R01', 'S01', 'ZB-B01-R01-S01-B05', 200.0),
(6, 'ZONE_B', 'B01', 'R01', 'S02', 'ZB-B01-R01-S02-B06', 200.0)
ON CONFLICT (id) DO NOTHING;

-- 3. Nạp Nhà cung cấp
INSERT INTO wms_supplier (id, code, name, contact_phone) VALUES
(1, 'SUP-VINAMILK', 'Công ty Cổ phần Sữa Việt Nam', '02854155555'),
(2, 'SUP-SAMSUNG', 'Công ty TNHH Điện tử Samsung Vina', '02839157310'),
(3, 'SUP-UNILEVER', 'Công ty TNHH Quốc tế Unilever Việt Nam', '02854135686')
ON CONFLICT (id) DO NOTHING;

-- 4. Nạp Danh mục Sản phẩm
INSERT INTO wms_product (id, sku, barcode, name, category, unit, safety_stock, reorder_point) VALUES
(1, 'SKU-MILK-100', '8934673123456', 'Sữa tươi tiệt trùng Vinamilk 100% 1L', 'Thực phẩm mát', 'Hộp', 20, 50),
(2, 'SKU-SAMS-S24', '8806091234567', 'Điện thoại Samsung Galaxy S24 Ultra 256GB', 'Điện tử', 'Chiếc', 5, 10),
(3, 'SKU-OMO-MATIC', '8934868765432', 'Nước giặt OMO Matic Cửa Trên 3.6kg', 'Hóa mỹ phẩm', 'Túi', 15, 30)
ON CONFLICT (id) DO NOTHING;

-- 5. Nạp Lô hàng (Batch) - Có lô cận date trong tháng 9/2026 để test AI & FEFO!
INSERT INTO wms_product_batch (id, product_id, batch_number, manufacture_date, expiry_date, supplier_id) VALUES
(1, 1, 'BATCH-MILK-26A', '2026-06-01', '2026-09-25', 1), -- CẬN DATE (dưới 20 ngày)
(2, 1, 'BATCH-MILK-26B', '2026-07-01', '2026-11-30', 1), -- Hạn dài
(3, 2, 'BATCH-S24-01',   '2026-01-10', '2028-01-10', 2),
(4, 3, 'BATCH-OMO-01',   '2026-03-01', '2027-03-01', 3)
ON CONFLICT (id) DO NOTHING;

-- 6. Nạp Tồn kho thực tế (Inventory)
INSERT INTO wms_inventory (location_id, product_id, batch_id, on_hand_qty, reserved_qty) VALUES
(5, 1, 1, 80, 0),   -- 80 hộp sữa cận date ở ô B05 (Zone B)
(6, 1, 2, 200, 0),  -- 200 hộp sữa hạn dài ở ô B06 (Zone B)
(1, 2, 3, 25, 0),   -- 25 điện thoại ở ô B01 (Zone A)
(3, 3, 4, 60, 0)    -- 60 túi nước giặt ở ô B03 (Zone A)
ON CONFLICT (location_id, product_id, batch_id) DO NOTHING;

-- 7. Ghi nhận Sổ cái mở kho ban đầu (Stock Ledger)
INSERT INTO wms_stock_ledger (transaction_type, reference_code, location_id, product_id, batch_id, qty_change, balance_after, performed_by, notes) VALUES
('INITIAL_IMPORT', 'INIT-2026', 5, 1, 1, 80, 80, 'admin', 'Khởi tạo số dư đầu kỳ'),
('INITIAL_IMPORT', 'INIT-2026', 6, 1, 2, 200, 200, 'admin', 'Khởi tạo số dư đầu kỳ'),
('INITIAL_IMPORT', 'INIT-2026', 1, 2, 3, 25, 25, 'admin', 'Khởi tạo số dư đầu kỳ'),
('INITIAL_IMPORT', 'INIT-2026', 3, 3, 4, 60, 60, 'admin', 'Khởi tạo số dư đầu kỳ');
