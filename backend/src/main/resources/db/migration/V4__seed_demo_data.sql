-- =============================================================================
-- V4__seed_demo_data.sql
-- Enterprise Master Data (11 Categories, 19 Partners, 15 Enriched SKUs) & Demo Stock
-- =============================================================================

SET NAMES utf8mb4;

-- 1. Danh mục sản phẩm chuẩn UTF-8 (11 Categories)
INSERT INTO `wms_category` (`id`, `code`, `name`, `parent_id`, `is_active`) VALUES
(1, 'CAT-FOOD', 'Thực phẩm & Đồ uống', NULL, TRUE),
(2, 'CAT-COOL', 'Thực phẩm mát & Sữa tươi', 1, TRUE),
(3, 'CAT-ELEC', 'Thiết bị điện tử', NULL, TRUE),
(4, 'CAT-PHONE', 'Điện thoại thông minh', 3, TRUE),
(5, 'CAT-CHEM', 'Hóa mỹ phẩm & Tẩy rửa', NULL, TRUE),
(6, 'CAT-BEV', 'Nước giải khát & Đồ uống có cồn', 1, TRUE),
(7, 'CAT-COND', 'Gia vị & Đồ khô đóng chai', 1, TRUE),
(8, 'CAT-FURN', 'Nội thất & Bàn ghế gia dụng', NULL, TRUE),
(9, 'CAT-MED', 'Dược phẩm & Y tế', NULL, FALSE),
(10, 'CAT-FASH', 'Thời trang & May mặc', NULL, TRUE),
(11, 'CAT-GEN', 'Hàng tiêu dùng tổng hợp', NULL, TRUE)
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`), `name` = VALUES(`name`), `parent_id` = VALUES(`parent_id`), `is_active` = VALUES(`is_active`);

-- 2. Nhà cung cấp & Đối tác thương mại (Suppliers & Partners)
INSERT INTO `wms_supplier` (`id`, `code`, `name`, `contact_phone`, `email`, `address`, `is_active`) VALUES
(1, 'SUP-VINAMILK', 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)', '02854155555', 'supplychain@vinamilk.com.vn', 'Số 10 Tân Trào, Phường Tân Phú, Quận 7, TP.HCM', TRUE),
(2, 'SUP-SAMSUNG', 'Công ty TNHH Điện tử Samsung Vina', '02839157310', 'b2b.logistics@samsung.com', 'Khu Công Nghệ Cao, P. Tăng Nhơn Phú B, TP. Thủ Đức, TP.HCM', TRUE),
(3, 'SUP-UNILEVER', 'Công ty TNHH Quốc tế Unilever Việt Nam', '02854135686', 'order.vietnam@unilever.com', 'A2-3 KCN Tây Bắc Củ Chi, Xã Tân An Hội, Củ Chi, TP.HCM', TRUE),
(4, 'SUP-MASAN', 'Công ty Cổ phần Hàng tiêu dùng Masan Consumer', '02862555666', 'distribution@masangroup.com', 'Tầng 12 Central Plaza, 17 Lê Duẩn, P. Bến Nghé, Quận 1, TP.HCM', TRUE),
(5, 'SUP-HEINEKEN', 'Công ty TNHH Nhà máy Bia Heineken Việt Nam', '02838222755', 'order.desk@heineken.com', 'Tầng 18-19 Tòa nhà Vietcombank, Công trường Mê Linh, Bến Nghé, Q1, TP.HCM', TRUE),
(6, 'SUP-NESTLE', 'Công ty TNHH Nestlé Việt Nam (Lavie)', '02839113737', 'corporate.sales@vn.nestle.com', 'Lầu 5 Empress Tower, 138-142 Hai Bà Trưng, P. Đa Kao, Quận 1, TP.HCM', TRUE),
(7, 'SUP-TRUNGNGUYEN', 'Tập đoàn Trung Nguyên Legend Coffee', '02839251845', 'b2b@trungnguyenlegend.com', '82-84 Bùi Thị Xuân, Phường Bến Thành, Quận 1, TP.HCM', TRUE),
(100, 'SUP-COCACOLA', 'Công ty TNHH Nước Giải Khát Coca-Cola Việt Nam', '02838961000', 'customerservice@coca-cola.com.vn', 'Xa lộ Hà Nội, P. Linh Trung, TP. Thủ Đức, TP.HCM', TRUE),
(101, 'SUP-TH', 'Công ty Cổ phần Chuỗi Thực phẩm TH (TH True Milk)', '1800545440', 'sales@thmilk.vn', 'Nghĩa Đàn, Nghệ An (Chi nhánh kho: KCN Sóng Thần 1, Bình Dương)', TRUE),
(102, 'SUP-APPLE', 'Công ty TNHH Apple Việt Nam', '18001127', 'channel_sales_vn@apple.com', 'Tòa nhà Deutsches Haus, 33 Lê Duẩn, Quận 1, TP.HCM', TRUE),
(103, 'CUST-WINMART', 'Hệ thống Siêu thị WinMart Thảo Điền', '02871081368', 'NULL', 'NULL', TRUE),
(104, 'CUST-COOPMART', 'Siêu thị Co.opmart Cống Quỳnh', '02838325238', 'NULL', 'NULL', TRUE),
(105, 'CUST-FPTSHOP', 'Chuỗi bán lẻ FPT Shop TP.HCM', '18006601', 'NULL', 'NULL', TRUE),
(106, 'CUST-LOTTEMART', 'Đại siêu thị Lotte Mart Quận 7', '02837753232', 'NULL', 'NULL', TRUE),
(107, 'CUST-BACHHOAXANH', 'Hệ thống Siêu thị Bách Hóa Xanh', '19001908', 'NULL', 'NULL', TRUE),
(108, 'CUST-DIENMAYXANH', 'Chuỗi Điện Máy Xanh Miền Đông', '18001061', 'NULL', 'NULL', TRUE),
(109, 'SUP-HOAPHAT', 'Công ty Cổ phần Nội Thất Hòa Phát', '02435558888', 'sales@hoaphat.com.vn', 'KCN Phố Nối A, Văn Lâm, Hưng Yên (Tổng kho Nam: Dĩ An, Bình Dương)', TRUE),
(110, 'SUP-PHARMA', 'Công ty Cổ phần Dược phẩm TV.Pharm', '02838351234', 'info@tvpharm.com.vn', '27 Điện Biên Phủ, P. 15, Quận Bình Thạnh, TP.HCM', TRUE),
(111, 'SUP-VIETTIEN', 'Tổng Công ty May Việt Tiến', '02838640800', 'viettien@viettien.com.vn', '7 Lê Minh Xuân, P. 7, Q. Tân Bình, TP.HCM', TRUE)
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`), `name` = VALUES(`name`), `contact_phone` = VALUES(`contact_phone`), `email` = VALUES(`email`), `address` = VALUES(`address`), `is_active` = VALUES(`is_active`);

-- 3. Phân nhóm mặt hàng cung cấp (Supplier - Category Scope)
INSERT INTO `wms_supplier_category` (`supplier_id`, `category_id`) VALUES
(1, 1),
(1, 2),
(2, 3),
(2, 4),
(3, 5),
(3, 11),
(4, 1),
(4, 7),
(5, 6),
(6, 1),
(6, 6),
(7, 1),
(100, 6),
(101, 1),
(101, 2),
(102, 3),
(102, 4),
(109, 8),
(110, 9),
(111, 10)
ON DUPLICATE KEY UPDATE `category_id` = VALUES(`category_id`);

-- 4. Danh mục Sản phẩm chuẩn Enterprise (15 Enriched SKUs)
INSERT INTO `wms_product` (`id`, `sku`, `barcode`, `name`, `description`, `category_id`, `supplier_id`, `unit`, `length_cm`, `width_cm`, `height_cm`, `weight_kg`, `storage_condition`, `safety_stock`, `reorder_point`, `image_url`, `is_active`) VALUES
(1, 'SKU-MILK-100', '8934673123456', 'Sữa tươi tiệt trùng Vinamilk 100% 1L', 'Sữa tươi tiệt trùng nguyên chất 100% từ sữa bò tươi tự nhiên, đóng hộp tiện lợi 1 lít.', 2, 1, 'Hộp', 10.00, 8.00, 20.00, 1.05, 'COOL', 20, 50, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=80', TRUE),
(2, 'SKU-SAMS-S24', '8806091234567', 'Điện thoại Samsung Galaxy S24 Ultra 256GB', 'Flagship smartphone Snapdragon 8 Gen 3, Camera 200MP, Màn hình Dynamic AMOLED 2X, Kèm bút S-Pen.', 4, 2, 'Chiếc', 16.30, 7.90, 0.86, 0.35, 'SECURE', 5, 10, 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300&auto=format&fit=crop&q=80', TRUE),
(3, 'SKU-OMO-MATIC', '8934868765432', 'Nước giặt OMO Matic Cửa Trên 3.6kg', 'Nước giặt chuyên dụng cho máy giặt cửa trên, công nghệ xoáy sâu đánh bật vết bẩn cứng đầu.', 5, 3, 'Túi', 25.00, 12.00, 35.00, 3.65, 'AMBIENT', 15, 30, 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&auto=format&fit=crop&q=80', TRUE),
(4, 'SKU-YOGURT-04', '8934673234567', 'Sữa chua Vinamilk có đường Lốc 4 hộp', 'Sữa chua lên men tự nhiên giàu canxi và lợi khuẩn, lốc 4 hộp x 100g.', 2, 1, 'Lốc', 14.00, 14.00, 7.00, 0.45, 'COOL', 40, 80, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&auto=format&fit=crop&q=80', TRUE),
(5, 'SKU-BEER-330', '8934822001122', 'Bia Heineken Sleek lon 330ml', 'Bia cao cấp thùng 24 lon sleek 330ml hương vị sảng khoái đậm đà tinh khiết.', 1, 5, 'Thùng', 40.00, 27.00, 15.00, 8.50, 'AMBIENT', 50, 120, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=300&auto=format&fit=crop&q=80', TRUE),
(6, 'SKU-COCA-330', '8934588012345', 'Nước giải khát Coca-Cola lon 330ml', 'Nước ngọt có gas truyền thống sảng khoái, quy cách thùng 24 lon x 330ml.', 6, 100, 'Thùng', 40.00, 27.00, 15.00, 8.40, 'AMBIENT', 40, 100, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=80', TRUE),
(7, 'SKU-WATER-500', '8934565005001', 'Nước khoáng thiên nhiên Lavie chai 500ml', 'Nước khoáng thiên nhiên đóng chai từ nguồn khoáng ngầm, thùng 24 chai x 500ml.', 6, 6, 'Thùng', 38.00, 26.00, 22.00, 12.50, 'AMBIENT', 60, 150, 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300&auto=format&fit=crop&q=80', TRUE),
(8, 'SKU-COF-G7', '8935024118018', 'Cà phê hòa tan G7 3in1 Trung Nguyên Hộp 18 gói', 'Cà phê hòa tan G7 3in1 công nghệ sấy lạnh nano hương thơm lôi cuốn, hộp 18 gói x 16g.', 1, 7, 'Hộp', 18.00, 10.00, 8.00, 0.35, 'AMBIENT', 35, 70, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop&q=80', TRUE),
(9, 'SKU-TEA-TH', '8936077080011', 'Trà xanh TH True TEA Ô Long tự nhiên chai 350ml', 'Trà ô long tự nhiên thanh mát chuẩn vị trà nguyên bản, thùng 24 chai x 350ml.', 6, 101, 'Thùng', 36.00, 24.00, 18.00, 9.00, 'AMBIENT', 30, 80, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&auto=format&fit=crop&q=80', TRUE),
(10, 'SKU-APPL-IP16', '8806091998877', 'Điện thoại Apple iPhone 16 Pro Max 256GB', 'Flagship Apple iPhone 16 Pro Max chip Apple A18 Pro, Khung Titanium siêu bền, Cụm 3 camera 48MP.', 4, 102, 'Chiếc', 16.30, 7.70, 0.82, 0.38, 'SECURE', 8, 20, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&auto=format&fit=crop&q=80', TRUE),
(11, 'SKU-APPL-AIRP', '8806091665544', 'Tai nghe không dây Apple AirPods Pro 2', 'Tai nghe chống ồn chủ động ANC thế hệ 2 chip H2, Hộp sạc MagSafe cổng Type-C.', 4, 102, 'Chiếc', 10.00, 10.00, 4.00, 0.15, 'SECURE', 15, 30, 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=300&auto=format&fit=crop&q=80', TRUE),
(12, 'SKU-COMFORT-3', '8934868112233', 'Nước xả vải Comfort Tinh Dầu Thơm 3.2L', 'Nước xả vải đậm đặc hương hoa quyến rũ, lưu hương thơm ngát suốt ngày dài, can 3.2L.', 5, 3, 'Túi', 20.00, 12.00, 32.00, 3.30, 'AMBIENT', 25, 50, 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=300&auto=format&fit=crop&q=80', TRUE),
(13, 'SKU-SUNSILK-6', '8934868445566', 'Dầu gội Sunsilk Óng Mượt Rạng Ngời 650g', 'Dầu gội bổ sung tinh dầu bồ kết và mica óng ánh giúp mái tóc óng mượt rạng ngời, chai vòi 650g.', 5, 3, 'Chai', 8.00, 6.00, 24.00, 0.75, 'AMBIENT', 20, 45, 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=300&auto=format&fit=crop&q=80', TRUE),
(14, 'SKU-MAGGI-700', '8936035007001', 'Nước tương Maggi Đậm Đặc chai 700ml', 'Nước tương Maggi đậm đặc công nghệ lên men tự nhiên từ hạt đậu nành chọn lọc, chai 700ml.', 7, 4, 'Chai', 7.50, 7.50, 28.00, 0.85, 'AMBIENT', 30, 60, 'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=300&auto=format&fit=crop&q=80', FALSE),
(15, 'SKU-CHINSU-500', '8935001701234', 'Nước mắm Chinsu Cá Hồi chai 500ml', 'Nước mắm Chinsu Cá Hồi hương thơm lừng vị đậm đà truyền thống, chai thủy tinh 500ml.', 7, 4, 'Chai', 7.00, 7.00, 26.00, 0.70, 'AMBIENT', 35, 75, 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=300&auto=format&fit=crop&q=80', TRUE)
ON DUPLICATE KEY UPDATE `sku` = VALUES(`sku`), `barcode` = VALUES(`barcode`), `name` = VALUES(`name`), `description` = VALUES(`description`), `category_id` = VALUES(`category_id`), `supplier_id` = VALUES(`supplier_id`), `unit` = VALUES(`unit`), `length_cm` = VALUES(`length_cm`), `width_cm` = VALUES(`width_cm`), `height_cm` = VALUES(`height_cm`), `weight_kg` = VALUES(`weight_kg`), `storage_condition` = VALUES(`storage_condition`), `safety_stock` = VALUES(`safety_stock`), `reorder_point` = VALUES(`reorder_point`), `image_url` = VALUES(`image_url`), `is_active` = VALUES(`is_active`);

-- 5. Lô hàng (Product Batches với đầy đủ Active, Near-Expiry FEFO & Quarantine)
INSERT INTO `wms_product_batch` (`id`, `product_id`, `batch_number`, `manufacture_date`, `expiry_date`, `status`, `supplier_id`) VALUES
(1,  1,  'BATCH-MILK-26A',  '2026-06-01', '2027-09-25', 'ACTIVE',     1),
(2,  1,  'BATCH-MILK-26B',  '2026-07-01', '2026-12-25', 'ACTIVE',     1),
(3,  2,  'BATCH-S24-01',    '2026-01-10', '2028-01-10', 'ACTIVE',     2),
(4,  3,  'BATCH-OMO-01',    '2026-03-01', '2027-03-01', 'ACTIVE',     3),
(5,  2,  'BATCH-S24-NOEXP', '2026-02-01', NULL,         'ACTIVE',     2),
(6,  1,  'BATCH-MILK-QUAR', '2026-08-01', '2026-10-15', 'QUARANTINE', 1),
(7,  4,  'BATCH-YOG-26A',   '2026-10-01', '2026-12-15', 'ACTIVE',     1),
(8,  4,  'BATCH-YOG-26B',   '2026-10-15', '2027-02-25', 'ACTIVE',     1),
(9,  5,  'BATCH-HEIN-26A',  '2026-05-10', '2027-05-10', 'ACTIVE',     5),
(10, 6,  'BATCH-COCA-26A',  '2026-06-01', '2027-06-01', 'ACTIVE',     100),
(11, 7,  'BATCH-LAV-26A',   '2026-07-01', '2028-07-01', 'ACTIVE',     6),
(12, 8,  'BATCH-G7-26A',    '2026-08-01', '2028-02-01', 'ACTIVE',     7),
(13, 9,  'BATCH-TEA-26A',   '2026-09-01', '2027-09-01', 'ACTIVE',     101),
(14, 10, 'BATCH-IP16-01',   '2026-09-20', '2028-09-20', 'ACTIVE',     102),
(15, 11, 'BATCH-AIRP-01',   '2026-08-10', '2028-08-10', 'ACTIVE',     102),
(16, 12, 'BATCH-COMF-26A',  '2026-07-15', '2028-07-15', 'ACTIVE',     3),
(17, 13, 'BATCH-SUN-26A',   '2026-08-01', '2029-08-01', 'ACTIVE',     3),
(18, 14, 'BATCH-MAG-26A',   '2026-06-20', '2027-12-20', 'ACTIVE',     4),
(19, 15, 'BATCH-CHIN-26A',  '2026-07-10', '2027-07-10', 'ACTIVE',     4)
ON DUPLICATE KEY UPDATE `expiry_date` = VALUES(`expiry_date`), `status` = VALUES(`status`), `supplier_id` = VALUES(`supplier_id`);

-- 6. Tồn kho theo Bin & Batch (Inventory — reserved_qty khớp 100% với Stock Reservation)
INSERT INTO `wms_inventory` (`id`, `location_id`, `product_id`, `batch_id`, `on_hand_qty`, `reserved_qty`, `version`) VALUES
(1,  5,  1,  1,  80,  0, 0),
(2,  6,  1,  2,  200, 0, 0),
(3,  1,  2,  3,  25,  5, 0),
(4,  3,  3,  4,  60,  0, 0),
(5,  2,  4,  7,  45,  0, 0),
(6,  7,  4,  8,  60,  0, 0),
(7,  9,  5,  9,  250, 0, 0),
(8,  10, 6,  10, 180, 0, 0),
(9,  11, 7,  11, 320, 0, 0),
(10, 8,  8,  12, 110, 0, 0),
(11, 12, 9,  13, 140, 0, 0),
(12, 13, 10, 14, 15,  0, 0),
(13, 14, 11, 15, 28,  0, 0),
(14, 3,  12, 16, 85,  0, 0),
(15, 4,  13, 17, 90,  0, 0),
(16, 8,  14, 18, 120, 0, 0),
(17, 8,  15, 19, 160, 0, 0)
ON DUPLICATE KEY UPDATE `on_hand_qty` = VALUES(`on_hand_qty`), `reserved_qty` = VALUES(`reserved_qty`);

-- 7. Sổ cái Thẻ kho Bất biến (Initial Import Ledger)
INSERT INTO `wms_stock_ledger` (`id`, `transaction_type`, `reference_code`, `location_id`, `product_id`, `batch_id`, `qty_change`, `balance_after`, `performed_by`, `notes`) VALUES
(1, 'INITIAL_IMPORT', 'INIT-2026', 5, 1, 1, 80,  80,  1, 'Khởi tạo số dư đầu kỳ'),
(2, 'INITIAL_IMPORT', 'INIT-2026', 6, 1, 2, 200, 200, 1, 'Khởi tạo số dư đầu kỳ'),
(3, 'INITIAL_IMPORT', 'INIT-2026', 1, 2, 3, 25,  25,  1, 'Khởi tạo số dư đầu kỳ'),
(4, 'INITIAL_IMPORT', 'INIT-2026', 3, 3, 4, 60,  60,  1, 'Khởi tạo số dư đầu kỳ')
ON DUPLICATE KEY UPDATE `reference_code` = VALUES(`reference_code`);

-- 8. Đơn Nhập Kho & Nghiệm Thu QC (Inbound Orders)
INSERT INTO `wms_inbound_order` (`id`, `order_code`, `warehouse_id`, `supplier_id`, `status`, `created_by`, `notes`) VALUES
(1, 'INB-2026-001',   1, 1, 'STOCKED',  1, 'Đơn nhập sữa tươi từ Vinamilk đã hoàn tất lưu kho'),
(2, 'INB-2026-002',   1, 2, 'PENDING',  2, 'Kế hoạch nhập Samsung Galaxy S24 đợt 2'),
(3, 'PO-202610-088',  1, 5, 'RECEIVED', 1, 'Đã nhận & QC 500 thùng Bia Heineken — chờ Putaway vào ô kệ'),
(4, 'PO-202610-089',  1, 1, 'PENDING',  2, 'Đơn đặt hàng bù tồn an toàn Sữa chua Vinamilk')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

INSERT INTO `wms_inbound_order_item` (`id`, `inbound_order_id`, `product_id`, `product_batch_id`, `batch_number`, `manufacture_date`, `expiry_date`, `expected_qty`, `received_qty`, `rejected_qty`, `stocked_qty`, `over_delivery_tolerance_pct`, `unit_price`, `status`) VALUES
(1, 1, 1, 1,    'BATCH-MILK-26A',   '2026-06-01', '2027-09-25', 280, 285, 0, 285, 10.00, 32000.00,    'COMPLETED'),
(2, 2, 2, NULL, 'BATCH-S24-02',     '2026-02-15', '2028-02-15', 50,  0,   0, 0,   10.00, 25000000.00, 'PENDING'),
(3, 3, 5, 9,    'BATCH-HEIN-26A',   '2026-05-10', '2027-05-10', 500, 500, 0, 0,   10.00, 385000.00,   'RECEIVED'),
(4, 4, 4, NULL, 'BATCH-YOGURT-26C', '2026-11-01', '2027-05-17', 200, 0,   0, 0,   10.00, 22000.00,    'PENDING')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`), `received_qty` = VALUES(`received_qty`);

-- 9. Đơn Xuất Kho, Phân bổ FEFO & Giữ chỗ (Outbound Orders)
INSERT INTO `wms_outbound_order` (`id`, `order_code`, `warehouse_id`, `customer_name`, `status`, `created_by`, `notes`) VALUES
(1, 'OUT-2026-001',   1, 'Siêu thị Co.opmart Cống Quỳnh',      'PENDING',    2, 'Xuất hàng sữa mát trong ngày'),
(2, 'OUT-2026-002',   1, 'Chuỗi bán lẻ FPT Shop TP.HCM',       'ALLOCATED',  2, 'Xuất lô điện thoại Samsung S24 đã giữ chỗ FEFO'),
(3, 'SO-202610-003',  1, 'Hệ thống Siêu thị WinMart Thảo Điền','PENDING',    1, 'Đơn xuất khẩn cấp nước giải khát & sữa'),
(4, 'SO-202610-004',  1, 'Đại siêu thị Lotte Mart Quận 7',     'PENDING',    2, 'Xuất lô hàng tiêu dùng & hóa mỹ phẩm'),
(5, 'SO-202610-005',  1, 'Chuỗi Điện Máy Xanh Miền Đông',      'DISPATCHED', 1, 'Giao lô thiết bị công nghệ đợt 1')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

INSERT INTO `wms_outbound_order_item` (`id`, `outbound_order_id`, `product_id`, `requested_qty`, `allocated_qty`, `picked_qty`, `unit_price`, `status`) VALUES
(1, 1, 1,  20, 0, 0, 35000.00,    'PENDING'),
(2, 2, 2,  5,  5, 0, 27990000.00, 'ALLOCATED'),
(3, 3, 4,  10, 0, 0, 32000.00,    'PENDING'),
(4, 3, 5,  20, 0, 0, 430000.00,   'PENDING'),
(5, 4, 3,  15, 0, 0, 150000.00,   'PENDING'),
(6, 4, 12, 10, 0, 0, 185000.00,   'PENDING'),
(7, 5, 2,  5,  5, 5, 24500000.00, 'SHIPPED')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

INSERT INTO `wms_pick_allocation` (`id`, `outbound_order_item_id`, `product_id`, `location_id`, `batch_id`, `allocated_qty`, `picked_qty`, `status`) VALUES
(1, 2, 2, 1, 3, 5, 0, 'ALLOCATED')
ON DUPLICATE KEY UPDATE `allocated_qty` = VALUES(`allocated_qty`), `status` = VALUES(`status`);

INSERT INTO `wms_stock_reservation` (`id`, `outbound_order_id`, `outbound_order_item_id`, `location_id`, `product_id`, `batch_id`, `reserved_qty`, `status`, `expires_at`) VALUES
(1, 2, 2, 1, 2, 3, 5, 'RESERVED', DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL 24 HOUR))
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

-- 10. Điều chuyển nội bộ, Kiểm kê Đếm mù & Cân chỉnh tồn kho
INSERT INTO `wms_stock_transfer` (`id`, `transfer_code`, `warehouse_id`, `from_location_id`, `to_location_id`, `product_id`, `batch_id`, `quantity`, `status`, `created_by`, `completed_by`, `notes`, `completed_at`) VALUES
(1, 'TRF-2026-001', 1, 1, 2, 2, 3, 2, 'COMPLETED', 1, 2, 'Điều chuyển 2 chiếc S24 từ ô B01 sang ô B02 cùng kệ để cân tải', CURRENT_TIMESTAMP(6))
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

INSERT INTO `wms_inventory_audit` (`id`, `audit_code`, `title`, `warehouse_id`, `audit_type`, `scope_type`, `is_blind_count`, `is_independent_verification_required`, `include_empty_bins`, `status`, `created_by`, `notes`) VALUES
(1, 'AUD-2026-09-01', 'Kiểm kê định kỳ Khu A & Khu B - WH01', 1, 'CYCLE_COUNT', 'ALL', TRUE, TRUE, FALSE, 'IN_PROGRESS', 2, 'Kiểm kê định kỳ kho Tổng Tân Bình')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

INSERT INTO `wms_inventory_audit_item` (`id`, `audit_id`, `location_id`, `product_id`, `batch_id`, `system_qty`, `counted_qty`, `first_count_qty`, `is_verified`, `status`, `counter_notes`, `counted_at`) VALUES
(1, 1, 5, 1, 1, 80, 78, 78, FALSE, 'DISCREPANCY', 'Hụt 2 hộp do bao bì rách trong lúc xếp hàng', CURRENT_TIMESTAMP(6)),
(2, 1, 1, 2, 3, 25, 25, 25, TRUE,  'MATCHED',     'Số lượng khớp 100% so với hệ thống', CURRENT_TIMESTAMP(6))
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`), `counted_qty` = VALUES(`counted_qty`);

INSERT INTO `wms_stock_adjustment` (`id`, `adjustment_code`, `audit_id`, `warehouse_id`, `reason`, `status`, `created_by`, `notes`) VALUES
(1, 'ADJ-2026-001', 1, 1, 'Hao hụt kiểm kê định kỳ WH01', 'PENDING', 2, 'Chờ duyệt trừ 2 hộp sữa rách bao bì')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

INSERT INTO `wms_stock_adjustment_item` (`id`, `adjustment_id`, `location_id`, `product_id`, `batch_id`, `system_qty`, `actual_qty`) VALUES
(1, 1, 5, 1, 1, 80, 78)
ON DUPLICATE KEY UPDATE `actual_qty` = VALUES(`actual_qty`);

-- Nâng AUTO_INCREMENT vượt ngưỡng ID seed để tránh xung đột khi phát sinh dữ liệu mới
ALTER TABLE `wms_category` AUTO_INCREMENT = 200;
ALTER TABLE `wms_supplier` AUTO_INCREMENT = 200;
ALTER TABLE `wms_product` AUTO_INCREMENT = 200;
ALTER TABLE `wms_product_batch` AUTO_INCREMENT = 200;
ALTER TABLE `wms_inventory` AUTO_INCREMENT = 200;
ALTER TABLE `wms_stock_ledger` AUTO_INCREMENT = 200;
ALTER TABLE `wms_inbound_order` AUTO_INCREMENT = 200;
ALTER TABLE `wms_inbound_order_item` AUTO_INCREMENT = 200;
ALTER TABLE `wms_outbound_order` AUTO_INCREMENT = 200;
ALTER TABLE `wms_outbound_order_item` AUTO_INCREMENT = 200;
ALTER TABLE `wms_pick_allocation` AUTO_INCREMENT = 200;
ALTER TABLE `wms_stock_reservation` AUTO_INCREMENT = 200;
ALTER TABLE `wms_stock_transfer` AUTO_INCREMENT = 200;
ALTER TABLE `wms_inventory_audit` AUTO_INCREMENT = 200;
ALTER TABLE `wms_inventory_audit_item` AUTO_INCREMENT = 200;
ALTER TABLE `wms_stock_adjustment` AUTO_INCREMENT = 200;
ALTER TABLE `wms_stock_adjustment_item` AUTO_INCREMENT = 200;
