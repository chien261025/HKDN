-- V9: Nạp đầy đủ các ngành hàng còn thiếu (Nội thất, Dược phẩm, Thời trang, Tiêu dùng tổng hợp)
SET NAMES utf8mb4;
INSERT INTO wms_category (id, code, name, parent_id, is_active) VALUES
(8,  'CAT-FURN', 'Nội thất & Bàn ghế gia dụng', NULL, TRUE),
(9,  'CAT-MED',  'Dược phẩm & Y tế', NULL, TRUE),
(10, 'CAT-FASH', 'Thời trang & May mặc', NULL, TRUE),
(11, 'CAT-GEN',  'Hàng tiêu dùng tổng hợp', NULL, TRUE)
ON DUPLICATE KEY UPDATE code=VALUES(code), name=VALUES(name);
