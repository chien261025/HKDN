SET client_encoding = 'UTF8';

-- 1. Thêm Nhà cung cấp thực tế
INSERT INTO wms_supplier (id, code, name, contact_phone) VALUES
(4, 'SUP-MASAN',    'Công ty Cổ phần Hàng tiêu dùng Masan Consumer', '02862555666'),
(5, 'SUP-HEINEKEN', 'Công ty TNHH Nhà máy Bia Heineken Việt Nam',     '02838222755'),
(6, 'SUP-NESTLE',   'Công ty TNHH Nestlé Việt Nam (Lavie)',           '02839113737'),
(7, 'SUP-TRUNGNGUYEN', 'Tập đoàn Trung Nguyên Legend Coffee',         '02839251845')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, contact_phone = EXCLUDED.contact_phone;

-- 2. Thêm Danh mục hàng hóa
INSERT INTO wms_category (id, code, name, parent_id) VALUES
(6, 'CAT-BEV',  'Nước giải khát & Đồ uống có cồn', 1),
(7, 'CAT-COND', 'Gia vị & Đồ khô đóng chai', 1)
ON CONFLICT (id) DO NOTHING;

-- 3. Thêm Sản phẩm thực tế (Có gán safety_stock & reorder_point)
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
ON CONFLICT (id) DO UPDATE SET 
    sku = EXCLUDED.sku,
    name = EXCLUDED.name,
    unit = EXCLUDED.unit,
    safety_stock = EXCLUDED.safety_stock,
    reorder_point = EXCLUDED.reorder_point;

-- 4. Bổ sung các ô kệ vật lý (Vị trí lưu kho chuẩn Zone A, B, C)
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
ON CONFLICT (id) DO UPDATE SET bin_barcode = EXCLUDED.bin_barcode, max_weight_kg = EXCLUDED.max_weight_kg;

-- 5. Bổ sung các Lô hàng (Product Batches) theo (product_id, batch_number)
INSERT INTO wms_product_batch (product_id, batch_number, manufacture_date, expiry_date, status, supplier_id) VALUES
(4,  'BATCH-YOG-26A',  '2026-10-01', '2026-11-15', 'ACTIVE', 1), -- CẬN DATE (< 20 ngày)
(4,  'BATCH-YOG-26B',  '2026-10-15', '2026-12-25', 'ACTIVE', 1), -- Hạn 60 ngày
(5,  'BATCH-HEIN-26A', '2026-05-10', '2027-05-10', 'ACTIVE', 5), -- Bia Heineken
(6,  'BATCH-COCA-26A', '2026-06-01', '2027-06-01', 'ACTIVE', 5), -- Coca Cola
(7,  'BATCH-LAV-26A',  '2026-07-01', '2028-07-01', 'ACTIVE', 6), -- Nước Lavie
(8,  'BATCH-G7-26A',   '2026-08-01', '2028-02-01', 'ACTIVE', 7), -- Cà phê G7
(9,  'BATCH-TEA-26A',  '2026-09-01', '2027-09-01', 'ACTIVE', 1), -- Trà TH
(10, 'BATCH-IP16-01',  '2026-09-20', '2028-09-20', 'ACTIVE', 2), -- iPhone 16
(11, 'BATCH-AIRP-01',  '2026-08-10', '2028-08-10', 'ACTIVE', 2), -- AirPods Pro
(12, 'BATCH-COMF-26A', '2026-07-15', '2028-07-15', 'ACTIVE', 3), -- Comfort
(13, 'BATCH-SUN-26A',  '2026-08-01', '2029-08-01', 'ACTIVE', 3), -- Sunsilk
(14, 'BATCH-MAG-26A',  '2026-06-20', '2027-12-20', 'ACTIVE', 4), -- Maggi
(15, 'BATCH-CHIN-26A', '2026-07-10', '2027-07-10', 'ACTIVE', 4)  -- Chinsu
ON CONFLICT (product_id, batch_number) DO UPDATE SET 
    expiry_date = EXCLUDED.expiry_date, 
    status = EXCLUDED.status;

-- 6. Bổ sung Tồn kho thực tế (Inventory)
-- Sản phẩm 4 (Sữa chua: total=12 <= safety_stock=40 -> CRITICAL)
-- Sản phẩm 10 (iPhone 16: total=3 <= safety_stock=8 -> CRITICAL)
INSERT INTO wms_inventory (location_id, product_id, batch_id, on_hand_qty, reserved_qty)
VALUES 
(2,  4,  (SELECT id FROM wms_product_batch WHERE product_id = 4 AND batch_number = 'BATCH-YOG-26A'), 8, 0),
(7,  4,  (SELECT id FROM wms_product_batch WHERE product_id = 4 AND batch_number = 'BATCH-YOG-26B'), 4, 0),
(9,  5,  (SELECT id FROM wms_product_batch WHERE product_id = 5 AND batch_number = 'BATCH-HEIN-26A'), 250, 20),
(10, 6,  (SELECT id FROM wms_product_batch WHERE product_id = 6 AND batch_number = 'BATCH-COCA-26A'), 180, 0),
(11, 7,  (SELECT id FROM wms_product_batch WHERE product_id = 7 AND batch_number = 'BATCH-LAV-26A'), 320, 0),
(8,  8,  (SELECT id FROM wms_product_batch WHERE product_id = 8 AND batch_number = 'BATCH-G7-26A'), 110, 10),
(12, 9,  (SELECT id FROM wms_product_batch WHERE product_id = 9 AND batch_number = 'BATCH-TEA-26A'), 140, 0),
(13, 10, (SELECT id FROM wms_product_batch WHERE product_id = 10 AND batch_number = 'BATCH-IP16-01'), 3, 0),
(14, 11, (SELECT id FROM wms_product_batch WHERE product_id = 11 AND batch_number = 'BATCH-AIRP-01'), 28, 0),
(3,  12, (SELECT id FROM wms_product_batch WHERE product_id = 12 AND batch_number = 'BATCH-COMF-26A'), 85, 0),
(4,  13, (SELECT id FROM wms_product_batch WHERE product_id = 13 AND batch_number = 'BATCH-SUN-26A'), 90, 0),
(8,  14, (SELECT id FROM wms_product_batch WHERE product_id = 14 AND batch_number = 'BATCH-MAG-26A'), 120, 0),
(8,  15, (SELECT id FROM wms_product_batch WHERE product_id = 15 AND batch_number = 'BATCH-CHIN-26A'), 160, 0)
ON CONFLICT (location_id, product_id, batch_id) DO UPDATE SET 
    on_hand_qty = EXCLUDED.on_hand_qty, 
    reserved_qty = EXCLUDED.reserved_qty;

-- 7. Thêm Đơn xuất kho đa dạng (Outbound Orders)
INSERT INTO wms_outbound_order (id, order_code, warehouse_id, customer_name, status, created_by, notes) VALUES
(3, 'SO-202610-003', 1, 'Hệ thống Siêu thị WinMart Thảo Điền', 'PENDING',   1, 'Đơn xuất khẩn cấp nước giải khát & sữa'),
(4, 'SO-202610-004', 1, 'Đại siêu thị Lotte Mart Quận 7',      'ALLOCATED', 2, 'Xuất lô hàng tiêu dùng & hóa mỹ phẩm'),
(5, 'SO-202610-005', 1, 'Chuỗi Điện Máy Xanh Miền Đông',        'DISPATCHED',1, 'Giao lô thiết bị công nghệ đợt 1')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, customer_name = EXCLUDED.customer_name;

INSERT INTO wms_outbound_order_item (id, outbound_order_id, product_id, requested_qty, allocated_qty, picked_qty, unit_price, status) VALUES
(3, 3, 4, 10, 0, 0, 32000.00,  'PENDING'),
(4, 3, 5, 20, 0, 0, 430000.00, 'PENDING'),
(5, 4, 3, 15, 15, 0, 150000.00, 'ALLOCATED'),
(6, 4, 12, 10, 10, 0, 185000.00,'ALLOCATED'),
(7, 5, 2, 5, 5, 5, 24500000.00, 'SHIPPED')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- 8. Thêm Đơn nhập kho (Inbound Orders)
INSERT INTO wms_inbound_order (id, order_code, warehouse_id, supplier_id, status, created_by, notes) VALUES
(3, 'PO-202610-088', 1, 5, 'RECEIVED', 1, 'Nhập bổ sung 500 thùng Bia Heineken'),
(4, 'PO-202610-089', 1, 1, 'PENDING',  2, 'Đơn đặt hàng bù tồn an toàn Sữa chua Vinamilk')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- Đồng bộ lại sequences PostgreSQL
SELECT setval(pg_get_serial_sequence('wms_supplier', 'id'), COALESCE((SELECT MAX(id) FROM wms_supplier), 1));
SELECT setval(pg_get_serial_sequence('wms_category', 'id'), COALESCE((SELECT MAX(id) FROM wms_category), 1));
SELECT setval(pg_get_serial_sequence('wms_product', 'id'), COALESCE((SELECT MAX(id) FROM wms_product), 1));
SELECT setval(pg_get_serial_sequence('wms_location', 'id'), COALESCE((SELECT MAX(id) FROM wms_location), 1));
SELECT setval(pg_get_serial_sequence('wms_product_batch', 'id'), COALESCE((SELECT MAX(id) FROM wms_product_batch), 1));
SELECT setval(pg_get_serial_sequence('wms_inventory', 'id'), COALESCE((SELECT MAX(id) FROM wms_inventory), 1));
SELECT setval(pg_get_serial_sequence('wms_outbound_order', 'id'), COALESCE((SELECT MAX(id) FROM wms_outbound_order), 1));
SELECT setval(pg_get_serial_sequence('wms_outbound_order_item', 'id'), COALESCE((SELECT MAX(id) FROM wms_outbound_order_item), 1));
SELECT setval(pg_get_serial_sequence('wms_inbound_order', 'id'), COALESCE((SELECT MAX(id) FROM wms_inbound_order), 1));
