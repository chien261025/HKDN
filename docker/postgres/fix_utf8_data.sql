-- SET CLIENT ENCODING TO UTF8
SET client_encoding = 'UTF8';

-- 1. Cập nhật bảng Danh mục (Category)
UPDATE wms_category SET name = 'Thực phẩm & Đồ uống' WHERE id = 1;
UPDATE wms_category SET name = 'Thực phẩm mát & Sữa tươi' WHERE id = 2;
UPDATE wms_category SET name = 'Thiết bị điện tử' WHERE id = 3;
UPDATE wms_category SET name = 'Điện thoại thông minh' WHERE id = 4;
UPDATE wms_category SET name = 'Hóa mỹ phẩm & Tẩy rửa' WHERE id = 5;

-- 2. Cập nhật bảng Nhà Cung Cấp (Supplier)
UPDATE wms_supplier SET name = 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)' WHERE id = 1;
UPDATE wms_supplier SET name = 'Công ty TNHH Điện tử Samsung Vina' WHERE id = 2;
UPDATE wms_supplier SET name = 'Công ty TNHH Quốc tế Unilever Việt Nam' WHERE id = 3;

-- 3. Cập nhật bảng Sản Phẩm (Product)
UPDATE wms_product SET name = 'Sữa tươi tiệt trùng Vinamilk 100% 1L', unit = 'Hộp' WHERE id = 1;
UPDATE wms_product SET name = 'Điện thoại Samsung Galaxy S24 Ultra 256GB', unit = 'Chiếc' WHERE id = 2;
UPDATE wms_product SET name = 'Nước giặt OMO Matic Cửa Trên 3.6kg', unit = 'Túi' WHERE id = 3;

-- 4. Cập nhật bảng Kho (Warehouse)
UPDATE wms_warehouse SET name = 'Kho Tổng Tân Bình - TP.HCM', address = '102 Trường Chinh, P.12, Q.Tân Bình, TP.HCM' WHERE id = 1;
UPDATE wms_warehouse SET name = 'Kho Phân Phối VSIP Bắc Ninh', address = 'KCN VSIP, Phù Chẩn, Từ Sơn, Bắc Ninh' WHERE id = 2;

-- 5. Cập nhật Đơn Nhập Kho (Inbound Order)
UPDATE wms_inbound_order SET notes = 'Đơn nhập sữa tươi từ Vinamilk giao tại Cửa nhận Dock 01' WHERE id = 1;
UPDATE wms_inbound_order SET notes = 'Kế hoạch nhập Samsung Galaxy S24 đợt 2 kèm niêm phong seal' WHERE id = 2;

-- 6. Cập nhật Đơn Xuất Kho (Outbound Order)
UPDATE wms_outbound_order SET customer_name = 'Hệ Thống Siêu Thị Co.opmart Cống Quỳnh', notes = 'Xuất hàng sữa mát trong ngày theo chuẩn FEFO' WHERE id = 1;
UPDATE wms_outbound_order SET customer_name = 'Chuỗi Bán Lẻ FPT Shop', notes = 'Xuất lô điện thoại cao cấp có hạn bảo hành' WHERE id = 2;

-- 7. Cập nhật Sổ Cái (Stock Ledger)
UPDATE wms_stock_ledger SET notes = 'Khởi tạo số dư đầu kỳ vào ô kệ' WHERE transaction_type = 'INITIAL_IMPORT';

-- 8. Cập nhật Kiểm Kê Kho (Inventory Audit)
UPDATE wms_inventory_audit SET notes = 'Kiểm kê định kỳ đầu tháng 9/2026 toàn bộ phân khu' WHERE id = 1;
