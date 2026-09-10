-- ==========================================================
-- 02-create-views.sql: TẠO CÁC VIEW DÀNH RIÊNG CHO BÁO CÁO & AI
-- ==========================================================

-- View 1: Tổng hợp tồn kho theo ô kệ chi tiết (Hỗ trợ truy vấn nhanh và hiển thị giao diện)
CREATE OR REPLACE VIEW v_stock_summary AS
SELECT 
    w.code AS warehouse_code,
    w.name AS warehouse_name,
    l.zone_code,
    l.aisle,
    l.rack,
    l.shelf,
    l.bin,
    l.bin_barcode,
    p.sku,
    p.name AS product_name,
    c.name AS category_name,
    p.unit,
    b.batch_number,
    b.expiry_date,
    b.status AS batch_status,
    i.on_hand_qty,
    i.reserved_qty,
    (i.on_hand_qty - i.reserved_qty) AS available_qty
FROM wms_inventory i
JOIN wms_location l ON i.location_id = l.id
JOIN wms_warehouse w ON l.warehouse_id = w.id
JOIN wms_product p ON i.product_id = p.id
LEFT JOIN wms_category c ON p.category_id = c.id
LEFT JOIN wms_product_batch b ON i.batch_id = b.id;

-- View 2: Danh sách các lô hàng cận date cần xử lý khẩn (Chỉ lọc các lô có quản lý HSD)
CREATE OR REPLACE VIEW v_expiring_batches AS
SELECT 
    p.sku,
    p.name AS product_name,
    c.name AS category_name,
    b.batch_number,
    b.expiry_date,
    (b.expiry_date - CURRENT_DATE) AS days_until_expiry,
    SUM(i.on_hand_qty) AS total_on_hand,
    SUM(i.reserved_qty) AS total_reserved,
    SUM(i.on_hand_qty - i.reserved_qty) AS total_available
FROM wms_product_batch b
JOIN wms_product p ON b.product_id = p.id
LEFT JOIN wms_category c ON p.category_id = c.id
JOIN wms_inventory i ON b.id = i.batch_id
WHERE b.expiry_date IS NOT NULL 
  AND b.expiry_date <= (CURRENT_DATE + INTERVAL '30 days')
GROUP BY p.sku, p.name, c.name, b.batch_number, b.expiry_date;
