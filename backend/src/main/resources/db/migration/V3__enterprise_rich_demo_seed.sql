-- ==========================================================
-- V3__enterprise_rich_demo_seed.sql: NẠP BỔ SUNG DỮ LIỆU ĐA DẠNG CHO SMART WMS (MYSQL 8)
-- ==========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Thêm Nhà cung cấp thực tế
INSERT INTO wms_supplier (id, code, name, contact_phone) VALUES
(4, 'SUP-MASAN',       'Công ty Cổ phần Hàng tiêu dùng Masan Consumer', '02862555666'),
(5, 'SUP-HEINEKEN',    'Công ty TNHH Nhà máy Bia Heineken Việt Nam',     '02838222755'),
(6, 'SUP-NESTLE',      'Công ty TNHH Nestlé Việt Nam (Lavie)',           '02839113737'),
(7, 'SUP-TRUNGNGUYEN', 'Tập đoàn Trung Nguyên Legend Coffee',           '02839251845')
ON DUPLICATE KEY UPDATE name = VALUES(name), contact_phone = VALUES(contact_phone);

-- 2. Thêm Danh mục hàng hóa
INSERT INTO wms_category (id, code, name, parent_id) VALUES
(6, 'CAT-BEV',  'Nước giải khát & Đồ uống có cồn', 1),
(7, 'CAT-COND', 'Gia vị & Đồ khô đóng chai', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id);

-- 3. Thêm Sản phẩm thực tế
INSERT INTO wms_product (id, sku, barcode, name, category_id, unit, safety_stock, reorder_point) VALUES
(4,  'SKU-YOGURT-04', '8934673234567', 'Sữa chua Vinamilk có đường Lốc 4 hộp',        2, 'Lốc',   40, 80),
(5,  'SKU-BEER-330',  '8934822001122', 'Bia Heineken Sleek lon 330ml',                 6, 'Thùng', 50, 120),
(6,  'SKU-COCA-330',  '8934588012345', 'Nước giải khát Coca-Cola lon 330ml',           6, 'Thùng', 40, 100),
(7,  'SKU-WATER-500', '8934565005001', 'Nước khoáng thiên nhiên Lavie chai 500ml',    6, 'Thùng', 60, 150),
(8,  'SKU-COF-G7',    '8935024118018', 'Cà phê hòa tan G7 3in1 Trung Nguyên Hộp 18 gói',1, 'Hộp',   35, 70),
(9,  'SKU-TEA-TH',    '8936077080011', 'Trà xanh TH True TEA Ô Long tự nhiên chai 350ml',6, 'Thùng', 30, 80),
(10, 'SKU-APPL-IP16', '8806091998877', 'Điện thoại Apple iPhone 16 Pro Max 256GB',     4, 'Chiếc', 8,  20),
(11, 'SKU-APPL-AIRP', '8806091665544', 'Tai nghe không dây Apple AirPods Pro 2',       4, 'Chiếc', 15, 30),
(12, 'SKU-COMFORT-3', '8934868112233', 'Nước xả vải Comfort Tinh Dầu Thơm 3.2L',       5, 'Túi',   25, 50),
(13, 'SKU-SUNSILK-6', '8934868445566', 'Dầu gội Sunsilk Óng Mượt Rạng Ngời 650g',      5, 'Chai',  20, 45),
(14, 'SKU-MAGGI-700', '8936035007001', 'Nước tương Maggi Đậm Đặc chai 700ml',          7, 'Chai',  30, 60),
(15, 'SKU-CHINSU-500','8935001701234', 'Nước mắm Chinsu Cá Hồi chai 500ml',           7, 'Chai',  35, 75)
ON DUPLICATE KEY UPDATE 
    sku = VALUES(sku),
    name = VALUES(name),
    unit = VALUES(unit),
    safety_stock = VALUES(safety_stock),
    reorder_point = VALUES(reorder_point);

-- 4. Bổ sung các ô kệ vật lý (Zone A, B, C)
INSERT INTO wms_location (id, warehouse_id, zone_code, aisle, rack, shelf, bin, bin_barcode, max_weight_kg) VALUES
(7,  1, 'ZONE_A', 'A02', 'R01', 'S02', 'B07', 'WH01-ZA-A02-R01-S02-B07', 500.0),
(8,  1, 'ZONE_A', 'A02', 'R02', 'S01', 'B08', 'WH01-ZA-A02-R02-S01-B08', 500.0),
(9,  1, 'ZONE_B', 'B02', 'R01', 'S01', 'B09', 'WH01-ZB-B02-R01-S01-B09', 400.0),
(10, 1, 'ZONE_B', 'B02', 'R01', 'S02', 'B10', 'WH01-ZB-B02-R01-S02-B10', 400.0),
(11, 1, 'ZONE_B', 'B02', 'R02', 'S01', 'B11', 'WH01-ZB-B02-R02-S01-B11', 400.0),
(12, 1, 'ZONE_B', 'B02', 'R02', 'S02', 'B12', 'WH01-ZB-B02-R02-S02-B12', 400.0),
(13, 1, 'ZONE_C', 'C01', 'R01', 'S01', 'B13', 'WH01-ZC-C01-R01-S01-B13', 300.0),
(14, 1, 'ZONE_C', 'C01', 'R01', 'S02', 'B14', 'WH01-ZC-C01-R01-S02-B14', 300.0),
(15, 1, 'ZONE_C', 'C01', 'R02', 'S01', 'B15', 'WH01-ZC-C01-R02-S01-B15', 300.0),
(16, 1, 'ZONE_C', 'C02', 'R01', 'S01', 'B16', 'WH01-ZC-C02-R01-S01-B16', 300.0)
ON DUPLICATE KEY UPDATE bin_barcode = VALUES(bin_barcode), max_weight_kg = VALUES(max_weight_kg);

-- 5. Bổ sung các Lô hàng
INSERT INTO wms_product_batch (id, product_id, batch_number, manufacture_date, expiry_date, status, supplier_id) VALUES
(7,  4,  'BATCH-YOG-26A',  '2026-10-01', '2026-11-15', 'ACTIVE', 1),
(8,  4,  'BATCH-YOG-26B',  '2026-10-15', '2026-12-25', 'ACTIVE', 1),
(9,  5,  'BATCH-HEIN-26A', '2026-05-10', '2027-05-10', 'ACTIVE', 5),
(10, 6,  'BATCH-COCA-26A', '2026-06-01', '2027-06-01', 'ACTIVE', 5),
(11, 7,  'BATCH-LAV-26A',  '2026-07-01', '2028-07-01', 'ACTIVE', 6),
(12, 8,  'BATCH-G7-26A',   '2026-08-01', '2028-02-01', 'ACTIVE', 7),
(13, 9,  'BATCH-TEA-26A',  '2026-09-01', '2027-09-01', 'ACTIVE', 1),
(14, 10, 'BATCH-IP16-01',  '2026-09-20', '2028-09-20', 'ACTIVE', 2),
(15, 11, 'BATCH-AIRP-01',  '2026-08-10', '2028-08-10', 'ACTIVE', 2),
(16, 12, 'BATCH-COMF-26A', '2026-07-15', '2028-07-15', 'ACTIVE', 3),
(17, 13, 'BATCH-SUN-26A',  '2026-08-01', '2029-08-01', 'ACTIVE', 3),
(18, 14, 'BATCH-MAG-26A',  '2026-06-20', '2027-12-20', 'ACTIVE', 4),
(19, 15, 'BATCH-CHIN-26A', '2026-07-10', '2027-07-10', 'ACTIVE', 4)
ON DUPLICATE KEY UPDATE 
    expiry_date = VALUES(expiry_date), 
    status = VALUES(status);

-- 6. Bổ sung Tồn kho thực tế (Inventory)
INSERT INTO wms_inventory (id, location_id, product_id, batch_id, on_hand_qty, reserved_qty, version) VALUES
(5,  2,  4,  7,   8,   0, 0),
(6,  7,  4,  8,   4,   0, 0),
(7,  9,  5,  9,   250, 20, 0),
(8,  10, 6,  10,  180, 0, 0),
(9,  11, 7,  11,  320, 0, 0),
(10, 8,  8,  12,  110, 10, 0),
(11, 12, 9,  13,  140, 0, 0),
(12, 13, 10, 14,  3,   0, 0),
(13, 14, 11, 15,  28,  0, 0),
(14, 3,  12, 16,  85,  0, 0),
(15, 4,  13, 17,  90,  0, 0),
(16, 8,  14, 18,  120, 0, 0),
(17, 8,  15, 19,  160, 0, 0)
ON DUPLICATE KEY UPDATE 
    on_hand_qty = VALUES(on_hand_qty), 
    reserved_qty = VALUES(reserved_qty);

-- 7. Thêm Đơn xuất kho
INSERT INTO wms_outbound_order (id, order_code, warehouse_id, customer_name, status, created_by, notes) VALUES
(3, 'SO-202610-003', 1, 'Hệ thống Siêu thị WinMart Thảo Điền', 'PENDING',    1, 'Đơn xuất khẩn cấp nước giải khát & sữa'),
(4, 'SO-202610-004', 1, 'Đại siêu thị Lotte Mart Quận 7',       'ALLOCATED',  2, 'Xuất lô hàng tiêu dùng & hóa mỹ phẩm'),
(5, 'SO-202610-005', 1, 'Chuỗi Điện Máy Xanh Miền Đông',         'DISPATCHED', 1, 'Giao lô thiết bị công nghệ đợt 1')
ON DUPLICATE KEY UPDATE status = VALUES(status), customer_name = VALUES(customer_name);

INSERT INTO wms_outbound_order_item (id, outbound_order_id, product_id, requested_qty, allocated_qty, picked_qty, unit_price, status) VALUES
(3, 3, 4, 10, 0,  0, 32000.00,   'PENDING'),
(4, 3, 5, 20, 0,  0, 430000.00,  'PENDING'),
(5, 4, 3, 15, 15, 0, 150000.00,  'ALLOCATED'),
(6, 4, 12, 10, 10, 0, 185000.00, 'ALLOCATED'),
(7, 5, 2, 5,  5,  5, 24500000.00,'SHIPPED')
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- 8. Thêm Đơn nhập kho
INSERT INTO wms_inbound_order (id, order_code, warehouse_id, supplier_id, status, created_by, notes) VALUES
(3, 'PO-202610-088', 1, 5, 'RECEIVED', 1, 'Nhập bổ sung 500 thùng Bia Heineken'),
(4, 'PO-202610-089', 1, 1, 'PENDING',  2, 'Đơn đặt hàng bù tồn an toàn Sữa chua Vinamilk')
ON DUPLICATE KEY UPDATE status = VALUES(status);

ALTER TABLE wms_supplier AUTO_INCREMENT = 100;
ALTER TABLE wms_category AUTO_INCREMENT = 100;
ALTER TABLE wms_product AUTO_INCREMENT = 100;
ALTER TABLE wms_location AUTO_INCREMENT = 100;
ALTER TABLE wms_product_batch AUTO_INCREMENT = 100;
ALTER TABLE wms_inventory AUTO_INCREMENT = 100;
ALTER TABLE wms_outbound_order AUTO_INCREMENT = 100;
ALTER TABLE wms_outbound_order_item AUTO_INCREMENT = 100;
ALTER TABLE wms_inbound_order AUTO_INCREMENT = 100;

SET FOREIGN_KEY_CHECKS = 1;
