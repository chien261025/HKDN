-- Seed Comprehensive Test Data for Smart WMS Operator PDA (MySQL 8)
-- Clean up any test records with these codes if they already exist
DELETE FROM wms_outbound_order WHERE order_code IN ('SO-WINMART-TB01', 'SO-TGDD-TANBINH', 'SO-COOPMART-TP', 'SO-BACHHOAXANH-05');
DELETE FROM wms_inbound_order WHERE order_code IN ('PO-VINAMILK-001', 'PO-UNILEVER-002', 'PO-TECH-APPLE-003', 'PO-BEVERAGE-004', 'PO-STAGING-PUTAWAY-01', 'PO-STAGING-PUTAWAY-02');
DELETE FROM wms_inventory_audit WHERE audit_code = 'AUD-KIEMKE-THANG10';

-- 1. TAB 1: NHẬN PO TẠI KHU ĐỆM (4 đơn PENDING đang trên xe tải chở đến)
-- Đơn 1: Vinamilk giao sữa tươi & sữa chua
INSERT INTO wms_inbound_order (order_code, warehouse_id, supplier_id, status, created_by, notes)
VALUES ('PO-VINAMILK-001', 1, 1, 'PENDING', 1, 'Xe tải lạnh giao sữa tươi & sữa chua tại Cửa Nhận 1');
SET @po_vnm_1 = LAST_INSERT_ID();

INSERT INTO wms_inbound_order_item (inbound_order_id, product_id, batch_number, manufacture_date, expiry_date, expected_qty, received_qty, status)
VALUES 
(@po_vnm_1, 1, 'BATCH-VNM-MILK-01', '2026-10-15', '2027-04-15', 60, 0, 'PENDING'),
(@po_vnm_1, 4, 'BATCH-VNM-YOG-01', '2026-10-20', '2027-01-20', 120, 0, 'PENDING');

-- Đơn 2: Unilever giao OMO Matic & Comfort
INSERT INTO wms_inbound_order (order_code, warehouse_id, supplier_id, status, created_by, notes)
VALUES ('PO-UNILEVER-002', 1, 3, 'PENDING', 1, 'Xe tải thùng giao nước giặt OMO & xả vải Comfort tại Cửa Nhận 2');
SET @po_uni_2 = LAST_INSERT_ID();

INSERT INTO wms_inbound_order_item (inbound_order_id, product_id, batch_number, manufacture_date, expiry_date, expected_qty, received_qty, status)
VALUES 
(@po_uni_2, 3, 'BATCH-OMO-2026', '2026-09-01', '2027-11-30', 80, 0, 'PENDING'),
(@po_uni_2, 12, 'BATCH-COMF-2026', '2026-09-10', '2027-12-15', 50, 0, 'PENDING');

-- Đơn 3: Apple VN giao iPhone 16 & AirPods
INSERT INTO wms_inbound_order (order_code, warehouse_id, supplier_id, status, created_by, notes)
VALUES ('PO-TECH-APPLE-003', 1, 2, 'PENDING', 1, 'Hàng công nghệ giá trị cao - Giao xe chuyên dụng bảo mật');
SET @po_app_3 = LAST_INSERT_ID();

INSERT INTO wms_inbound_order_item (inbound_order_id, product_id, batch_number, manufacture_date, expiry_date, expected_qty, received_qty, status)
VALUES 
(@po_app_3, 10, 'BATCH-IP16-VN', '2026-09-20', '2028-12-31', 25, 0, 'PENDING'),
(@po_app_3, 11, 'BATCH-AIRP-VN', '2026-09-20', '2028-12-31', 40, 0, 'PENDING');

-- Đơn 4: Nước giải khát Heineken, Coca-Cola & Lavie
INSERT INTO wms_inbound_order (order_code, warehouse_id, supplier_id, status, created_by, notes)
VALUES ('PO-BEVERAGE-004', 1, 1, 'PENDING', 1, 'Lô đồ uống giải khát số lượng lớn 300 kiện tại Cửa Nhận 3');
SET @po_bev_4 = LAST_INSERT_ID();

INSERT INTO wms_inbound_order_item (inbound_order_id, product_id, batch_number, manufacture_date, expiry_date, expected_qty, received_qty, status)
VALUES 
(@po_bev_4, 5, 'BATCH-HEIN-2026', '2026-08-01', '2027-06-30', 150, 0, 'PENDING'),
(@po_bev_4, 6, 'BATCH-COCA-2026', '2026-08-15', '2027-08-31', 180, 0, 'PENDING'),
(@po_bev_4, 7, 'BATCH-LAVIE-2026', '2026-08-20', '2028-01-31', 250, 0, 'PENDING');

-- 2. TAB 2: CẤT KỆ (PUTAWAY) - Đã nhận hàng vào Staging, đang nằm chờ cất lên ô kệ
INSERT INTO wms_inbound_order (order_code, warehouse_id, supplier_id, status, created_by, notes)
VALUES ('PO-STAGING-PUTAWAY-01', 1, 1, 'RECEIVED', 1, 'Đã hạ tải vào Khu Đệm Staging - Chờ điều xe nâng cất kệ ZONE B');
SET @po_stg_1 = LAST_INSERT_ID();

INSERT INTO wms_inbound_order_item (inbound_order_id, product_id, batch_number, manufacture_date, expiry_date, expected_qty, received_qty, status)
VALUES 
(@po_stg_1, 1, 'BATCH-VNM-26STG', '2026-10-01', '2027-05-15', 40, 40, 'COMPLETED'),
(@po_stg_1, 4, 'BATCH-YOG-26STG', '2026-10-05', '2027-02-15', 35, 35, 'COMPLETED');

INSERT INTO wms_inbound_order (order_code, warehouse_id, supplier_id, status, created_by, notes)
VALUES ('PO-STAGING-PUTAWAY-02', 1, 3, 'RECEIVED', 1, 'Đã tiếp nhận vào Khu Đệm - Chờ cất hàng nặng vào tầng 1 ZONE A');
SET @po_stg_2 = LAST_INSERT_ID();

INSERT INTO wms_inbound_order_item (inbound_order_id, product_id, batch_number, manufacture_date, expiry_date, expected_qty, received_qty, status)
VALUES 
(@po_stg_2, 3, 'BATCH-OMO-26STG', '2026-09-15', '2027-11-20', 45, 45, 'COMPLETED'),
(@po_stg_2, 13, 'BATCH-SUN-26STG', '2026-09-20', '2028-08-01', 60, 60, 'COMPLETED');

-- 3. TAB 3: NHẶT SO (PICKING FEFO) - Các đơn bán hàng xuất kho đang chờ nhân viên lấy hàng
INSERT INTO wms_outbound_order (order_code, warehouse_id, customer_name, status, created_by, notes)
VALUES ('SO-WINMART-TB01', 1, 'Siêu Thị WinMart Cộng Hòa', 'PENDING', 1, 'Đơn xuất gấp trong ngày - Ưu tiên date cũ FEFO');
SET @so_win_1 = LAST_INSERT_ID();

INSERT INTO wms_outbound_order_item (outbound_order_id, product_id, requested_qty, allocated_qty, picked_qty, status)
VALUES (@so_win_1, 1, 20, 0, 0, 'PENDING');

INSERT INTO wms_outbound_order (order_code, warehouse_id, customer_name, status, created_by, notes)
VALUES ('SO-TGDD-TANBINH', 1, 'Thế Giới Di Động Hoàng Hoa Thám', 'PENDING', 1, 'Đơn xuất điện thoại Samsung Galaxy S24 Ultra');
SET @so_tgdd_2 = LAST_INSERT_ID();

INSERT INTO wms_outbound_order_item (outbound_order_id, product_id, requested_qty, allocated_qty, picked_qty, status)
VALUES (@so_tgdd_2, 2, 4, 0, 0, 'PENDING');

INSERT INTO wms_outbound_order (order_code, warehouse_id, customer_name, status, created_by, notes)
VALUES ('SO-COOPMART-TP', 1, 'Đại Siêu Thị Co.opmart Tân Phú', 'PENDING', 1, 'Đơn xuất nước giặt OMO Matic và xả vải Comfort');
SET @so_coop_3 = LAST_INSERT_ID();

INSERT INTO wms_outbound_order_item (outbound_order_id, product_id, requested_qty, allocated_qty, picked_qty, status)
VALUES 
(@so_coop_3, 3, 15, 0, 0, 'PENDING'),
(@so_coop_3, 12, 10, 0, 0, 'PENDING');

INSERT INTO wms_outbound_order (order_code, warehouse_id, customer_name, status, created_by, notes)
VALUES ('SO-BACHHOAXANH-05', 1, 'Bách Hóa Xanh Trường Chinh', 'PENDING', 1, 'Đơn xuất bia Heineken Sleek lon 330ml');
SET @so_bhx_4 = LAST_INSERT_ID();

INSERT INTO wms_outbound_order_item (outbound_order_id, product_id, requested_qty, allocated_qty, picked_qty, status)
VALUES (@so_bhx_4, 5, 25, 0, 0, 'PENDING');

-- 4. TAB 5: KIỂM KÊ (BLIND COUNT AUDIT) - Phiên kiểm kê đang mở để thủ kho đếm thực tế
INSERT INTO wms_inventory_audit (audit_code, warehouse_id, audit_type, status, created_by, notes)
VALUES ('AUD-KIEMKE-THANG10', 1, 'CYCLE_COUNT', 'IN_PROGRESS', 1, 'Đợt kiểm kê định kỳ Khu A và Khu B Tân Bình');
SET @audit_id = LAST_INSERT_ID();

INSERT INTO wms_inventory_audit_item (audit_id, location_id, product_id, batch_id, system_qty, counted_qty, status, counter_notes)
VALUES 
(@audit_id, 1, 2, 3, 25, NULL, 'PENDING', 'Kiểm đếm điện thoại Samsung Galaxy S24 tầng 1 ZONE A'),
(@audit_id, 2, 4, 7, 8, NULL, 'PENDING', 'Kiểm đếm ô kệ sữa chua Vinamilk ZONE A'),
(@audit_id, 3, 3, 4, 60, NULL, 'PENDING', 'Kiểm đếm nước giặt OMO Matic ZONE A'),
(@audit_id, 9, 5, 9, 250, NULL, 'PENDING', 'Kiểm đếm kho bia Heineken ZONE B');
