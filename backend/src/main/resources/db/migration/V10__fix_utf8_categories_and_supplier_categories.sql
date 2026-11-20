-- ====================================================================
-- V10: Sửa lỗi mã hóa UTF-8 tiếng Việt, Thiết lập Bảng liên kết Ngành hàng NCC
-- và Ràng buộc Tính toàn vẹn Master Data WMS Enterprise
-- ====================================================================

SET NAMES utf8mb4;
ALTER DATABASE wms_db CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 1. Đảm bảo cấu trúc cột mở rộng cho bảng wms_supplier
ALTER TABLE wms_supplier ADD COLUMN contact_person VARCHAR(100) NULL;
ALTER TABLE wms_supplier ADD COLUMN email VARCHAR(100) NULL;
ALTER TABLE wms_supplier ADD COLUMN address VARCHAR(255) NULL;

-- 2. Tạo bảng liên kết đa-đa giữa Nhà cung cấp và Danh mục ngành hàng (wms_supplier_category)
CREATE TABLE IF NOT EXISTS wms_supplier_category (
    supplier_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    PRIMARY KEY (supplier_id, category_id),
    CONSTRAINT fk_supcat_supplier FOREIGN KEY (supplier_id) REFERENCES wms_supplier(id) ON DELETE CASCADE,
    CONSTRAINT fk_supcat_category FOREIGN KEY (category_id) REFERENCES wms_category(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Chuẩn hóa 100% dữ liệu UTF-8 tiếng Việt cho toàn bộ Danh mục sản phẩm (wms_category)
UPDATE wms_category SET name = 'Thực phẩm & Đồ uống' WHERE id = 1;
UPDATE wms_category SET name = 'Thực phẩm mát & Sữa tươi' WHERE id = 2;
UPDATE wms_category SET name = 'Thiết bị điện tử' WHERE id = 3;
UPDATE wms_category SET name = 'Điện thoại thông minh' WHERE id = 4;
UPDATE wms_category SET name = 'Hóa mỹ phẩm & Tẩy rửa' WHERE id = 5;
UPDATE wms_category SET name = 'Nước giải khát & Đồ uống có cồn' WHERE id = 6;
UPDATE wms_category SET name = 'Gia vị & Đồ khô đóng chai' WHERE id = 7;
UPDATE wms_category SET name = 'Nội thất & Bàn ghế gia dụng' WHERE id = 8;
UPDATE wms_category SET name = 'Dược phẩm & Y tế' WHERE id = 9;
UPDATE wms_category SET name = 'Thời trang & May mặc' WHERE id = 10;
UPDATE wms_category SET name = 'Hàng tiêu dùng tổng hợp' WHERE id = 11;

-- 4. Chuẩn hóa dữ liệu Nhà cung cấp thực tế và thông tin liên hệ doanh nghiệp
UPDATE wms_supplier SET
    name = 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
    contact_person = 'Nguyễn Hoài Nam',
    contact_phone = '02854155555',
    email = 'supplychain@vinamilk.com.vn',
    address = 'Số 10 Tân Trào, Phường Tân Phú, Quận 7, TP.HCM'
WHERE id = 1;

UPDATE wms_supplier SET
    name = 'Công ty TNHH Điện tử Samsung Vina',
    contact_person = 'Trần Minh Quân',
    contact_phone = '02839157310',
    email = 'b2b.logistics@samsung.com',
    address = 'Khu Công Nghệ Cao, P. Tăng Nhơn Phú B, TP. Thủ Đức, TP.HCM'
WHERE id = 2;

UPDATE wms_supplier SET
    name = 'Công ty TNHH Quốc tế Unilever Việt Nam',
    contact_person = 'Lê Thu Hương',
    contact_phone = '02854135686',
    email = 'order.vietnam@unilever.com',
    address = 'A2-3 KCN Tây Bắc Củ Chi, Xã Tân An Hội, Củ Chi, TP.HCM'
WHERE id = 3;

UPDATE wms_supplier SET
    name = 'Công ty Cổ phần Hàng tiêu dùng Masan Consumer',
    contact_person = 'Vũ Quốc Thái',
    contact_phone = '02862555666',
    email = 'distribution@masangroup.com',
    address = 'Tầng 12 Central Plaza, 17 Lê Duẩn, P. Bến Nghé, Quận 1, TP.HCM'
WHERE id = 4;

UPDATE wms_supplier SET
    name = 'Công ty TNHH Nhà máy Bia Heineken Việt Nam',
    contact_person = 'Phạm Đức Long',
    contact_phone = '02838222755',
    email = 'order.desk@heineken.com',
    address = 'Tầng 18-19 Tòa nhà Vietcombank, Công trường Mê Linh, Bến Nghé, Q1, TP.HCM'
WHERE id = 5;

UPDATE wms_supplier SET
    name = 'Công ty TNHH Nestlé Việt Nam (Lavie)',
    contact_person = 'Hoàng Ánh Tuyết',
    contact_phone = '02839113737',
    email = 'corporate.sales@vn.nestle.com',
    address = 'Lầu 5 Empress Tower, 138-142 Hai Bà Trưng, P. Đa Kao, Quận 1, TP.HCM'
WHERE id = 6;

UPDATE wms_supplier SET
    name = 'Tập đoàn Trung Nguyên Legend Coffee',
    contact_person = 'Đặng Tuấn Kiệt',
    contact_phone = '02839251845',
    email = 'b2b@trungnguyenlegend.com',
    address = '82-84 Bùi Thị Xuân, Phường Bến Thành, Quận 1, TP.HCM'
WHERE id = 7;

UPDATE wms_supplier SET
    name = 'Công ty TNHH Nước Giải Khát Coca-Cola Việt Nam',
    contact_person = 'Lý Quốc Trung',
    contact_phone = '02838961000',
    email = 'customerservice@coca-cola.com.vn',
    address = 'Xa lộ Hà Nội, P. Linh Trung, TP. Thủ Đức, TP.HCM'
WHERE id = 100;

UPDATE wms_supplier SET
    name = 'Công ty Cổ phần Chuỗi Thực phẩm TH (TH True Milk)',
    contact_person = 'Nguyễn Thị Loan',
    contact_phone = '1800545440',
    email = 'sales@thmilk.vn',
    address = 'Nghĩa Đàn, Nghệ An (Chi nhánh kho: KCN Sóng Thần 1, Bình Dương)'
WHERE id = 101;

UPDATE wms_supplier SET
    name = 'Công ty TNHH Apple Việt Nam',
    contact_person = 'Trương Gia Bảo',
    contact_phone = '18001127',
    email = 'channel_sales_vn@apple.com',
    address = 'Tòa nhà Deutsches Haus, 33 Lê Duẩn, Quận 1, TP.HCM'
WHERE id = 102;

-- Thêm các nhà cung cấp ngành Nội Thất, Dược Phẩm, Thời Trang để hoàn thiện danh mục
INSERT INTO wms_supplier (id, code, name, contact_person, contact_phone, email, address, is_active)
VALUES
(109, 'SUP-HOAPHAT', 'Công ty Cổ phần Nội Thất Hòa Phát', 'Ngô Thanh Sơn', '02435558888', 'sales@hoaphat.com.vn', 'KCN Phố Nối A, Văn Lâm, Hưng Yên (Tổng kho Nam: Dĩ An, Bình Dương)', 1),
(110, 'SUP-PHARMA', 'Công ty Cổ phần Dược phẩm TV.Pharm', 'Dược sĩ Lê Minh Tâm', '02838351234', 'info@tvpharm.com.vn', '27 Điện Biên Phủ, P. 15, Quận Bình Thạnh, TP.HCM', 1),
(111, 'SUP-VIETTIEN', 'Tổng Công ty May Việt Tiến', 'Bùi Đình Tuấn', '02838640800', 'viettien@viettien.com.vn', '7 Lê Minh Xuân, P. 7, Q. Tân Bình, TP.HCM', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name), contact_person=VALUES(contact_person), contact_phone=VALUES(contact_phone), email=VALUES(email), address=VALUES(address);

-- Chuẩn hóa tên khách hàng chuỗi siêu thị/bán lẻ (CUST) tránh mojibake
UPDATE wms_supplier SET name = 'Hệ thống Siêu thị WinMart Thảo Điền' WHERE id = 103;
UPDATE wms_supplier SET name = 'Siêu thị Co.opmart Cống Quỳnh' WHERE id = 104;
UPDATE wms_supplier SET name = 'Chuỗi bán lẻ FPT Shop TP.HCM' WHERE id = 105;
UPDATE wms_supplier SET name = 'Đại siêu thị Lotte Mart Quận 7' WHERE id = 106;
UPDATE wms_supplier SET name = 'Hệ thống Siêu thị Bách Hóa Xanh' WHERE id = 107;
UPDATE wms_supplier SET name = 'Chuỗi Điện Máy Xanh Miền Đông' WHERE id = 108;

-- 5. Nạp bảng liên kết Ngành hàng cụ thể cho từng Nhà cung cấp (wms_supplier_category)
DELETE FROM wms_supplier_category WHERE supplier_id IN (1, 2, 3, 4, 5, 6, 7, 100, 101, 102, 109, 110, 111);

INSERT INTO wms_supplier_category (supplier_id, category_id) VALUES
-- Vinamilk: Thực phẩm & Đồ uống (1), Thực phẩm mát & Sữa tươi (2)
(1, 1),
(1, 2),
-- Samsung: Thiết bị điện tử (3), Điện thoại thông minh (4)
(2, 3),
(2, 4),
-- Unilever: Hóa mỹ phẩm & Tẩy rửa (5), Hàng tiêu dùng tổng hợp (11)
(3, 5),
(3, 11),
-- Masan: Thực phẩm & Đồ uống (1), Gia vị & Đồ khô đóng chai (7)
(4, 1),
(4, 7),
-- Heineken: Nước giải khát & Đồ uống có cồn (6)
(5, 6),
-- Nestlé: Thực phẩm & Đồ uống (1), Nước giải khát & Đồ uống có cồn (6)
(6, 1),
(6, 6),
-- Trung Nguyên: Thực phẩm & Đồ uống (1)
(7, 1),
-- Coca-Cola: Nước giải khát & Đồ uống có cồn (6)
(100, 6),
-- TH True Milk: Thực phẩm & Đồ uống (1), Thực phẩm mát & Sữa tươi (2)
(101, 1),
(101, 2),
-- Apple: Thiết bị điện tử (3), Điện thoại thông minh (4)
(102, 3),
(102, 4),
-- Hòa Phát: Nội thất & Bàn ghế gia dụng (8)
(109, 8),
-- TV.Pharm: Dược phẩm & Y tế (9)
(110, 9),
-- Việt Tiến: Thời trang & May mặc (10)
(111, 10);
