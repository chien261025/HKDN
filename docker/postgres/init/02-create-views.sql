-- ==========================================================
-- 02-create-views.sql: TẠO CÁC VIEW DÀNH RIÊNG CHO BÁO CÁO & AI
-- ==========================================================

-- View 1: Tổng hợp tồn kho theo ô kệ (Ẩn thông tin nhạy cảm)
CREATE OR REPLACE VIEW v_stock_summary AS
SELECT 
    l.zone_code,
    l.aisle,
    l.rack,
    l.shelf,
    l.bin_barcode,
    p.sku,
    p.name AS product_name,
    p.unit,
    b.batch_number,
    b.expiry_date,
    i.on_hand_qty,
    i.reserved_qty,
    (i.on_hand_qty - i.reserved_qty) AS available_qty
FROM wms_inventory i
JOIN wms_location l ON i.location_id = l.id
JOIN wms_product p ON i.product_id = p.id
JOIN wms_product_batch b ON i.batch_id = b.id;

-- View 2: Danh sách các lô cận date cần xử lý
CREATE OR REPLACE VIEW v_expiring_batches AS
SELECT 
    p.sku,
    p.name AS product_name,
    b.batch_number,
    b.expiry_date,
    (b.expiry_date - CURRENT_DATE) AS days_until_expiry,
    SUM(i.on_hand_qty) AS total_on_hand
FROM wms_product_batch b
JOIN wms_product p ON b.product_id = p.id
JOIN wms_inventory i ON b.id = i.batch_id
WHERE b.expiry_date <= (CURRENT_DATE + INTERVAL '30 days')
GROUP BY p.sku, p.name, b.batch_number, b.expiry_date;
