-- Thêm các vị trí bãi sàn lưu tạm / xả tải (Floor Buffer) cho các kho khi khối lượng nhập vượt tải trọng giá kệ
INSERT INTO wms_location (warehouse_id, zone_code, aisle, rack, shelf, bin, bin_barcode, max_weight_kg, is_active, created_at, updated_at)
VALUES
(1, 'ZONE_B', 'FL', '01', 'S01', 'B01', 'WH01-ZB-BUFFER-FLOOR', 50000.00, 1, NOW(), NOW()),
(1, 'ZONE_A', 'FL', '01', 'S01', 'B01', 'WH01-ZA-BUFFER-FLOOR', 100000.00, 1, NOW(), NOW()),
(2, 'ZONE_B', 'FL', '01', 'S01', 'B01', 'WH02-ZB-BUFFER-FLOOR', 50000.00, 1, NOW(), NOW()),
(2, 'ZONE_A', 'FL', '01', 'S01', 'B01', 'WH02-ZA-BUFFER-FLOOR', 100000.00, 1, NOW(), NOW()),
(3, 'ZONE_B', 'FL', '01', 'S01', 'B01', 'WH03-ZB-BUFFER-FLOOR', 50000.00, 1, NOW(), NOW()),
(3, 'ZONE_A', 'FL', '01', 'S01', 'B01', 'WH03-ZA-BUFFER-FLOOR', 100000.00, 1, NOW(), NOW()),
(4, 'ZONE_B', 'FL', '01', 'S01', 'B01', 'WH04-ZB-BUFFER-FLOOR', 50000.00, 1, NOW(), NOW()),
(4, 'ZONE_A', 'FL', '01', 'S01', 'B01', 'WH04-ZA-BUFFER-FLOOR', 100000.00, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE max_weight_kg = VALUES(max_weight_kg), is_active = 1;

