-- =============================================================================
-- V2__views_triggers_and_security.sql
-- Analytical Views, Immutable Stock Ledger Triggers, and AI Read-Only Security
-- =============================================================================

SET NAMES utf8mb4;

-- 1. View tổng hợp tồn kho theo ô kệ (đồng bộ chuẩn Khả dụng = Active Bin + Active & Chưa Hết Hạn Batch)
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
    l.is_active AS location_active,
    p.sku,
    p.name AS product_name,
    c.name AS category_name,
    p.unit,
    b.batch_number,
    b.expiry_date,
    b.status AS batch_status,
    i.on_hand_qty,
    i.reserved_qty,
    CASE
        WHEN l.is_active = 1
         AND b.status = 'ACTIVE'
         AND (b.expiry_date IS NULL OR b.expiry_date >= CURRENT_DATE)
        THEN 0
        ELSE i.on_hand_qty
    END AS unavailable_qty,
    CASE
        WHEN l.is_active = 1
         AND b.status = 'ACTIVE'
         AND (b.expiry_date IS NULL OR b.expiry_date >= CURRENT_DATE)
        THEN GREATEST(0, i.on_hand_qty - i.reserved_qty)
        ELSE 0
    END AS available_qty
FROM wms_inventory i
JOIN wms_location l ON i.location_id = l.id
JOIN wms_warehouse w ON l.warehouse_id = w.id
JOIN wms_product p ON i.product_id = p.id
LEFT JOIN wms_category c ON p.category_id = c.id
LEFT JOIN wms_product_batch b ON i.batch_id = b.id
WHERE p.deleted_at IS NULL;

-- 2. View danh sách các lô hàng cận date / hết hạn trong 30 ngày cần xử lý FEFO
CREATE OR REPLACE VIEW v_expiring_batches AS
SELECT
    w.code AS warehouse_code,
    w.name AS warehouse_name,
    p.sku,
    p.name AS product_name,
    c.name AS category_name,
    b.batch_number,
    b.expiry_date,
    DATEDIFF(b.expiry_date, CURRENT_DATE) AS days_until_expiry,
    SUM(i.on_hand_qty) AS total_on_hand,
    SUM(i.reserved_qty) AS total_reserved,
    SUM(
        CASE
            WHEN l.is_active = 1
             AND b.status = 'ACTIVE'
             AND b.expiry_date >= CURRENT_DATE
            THEN GREATEST(0, i.on_hand_qty - i.reserved_qty)
            ELSE 0
        END
    ) AS total_available
FROM wms_product_batch b
JOIN wms_product p ON b.product_id = p.id
LEFT JOIN wms_category c ON p.category_id = c.id
JOIN wms_inventory i ON b.id = i.batch_id
JOIN wms_location l ON i.location_id = l.id
JOIN wms_warehouse w ON l.warehouse_id = w.id
WHERE p.deleted_at IS NULL
  AND i.on_hand_qty > 0
  AND b.expiry_date IS NOT NULL
  AND b.expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY)
GROUP BY w.code, w.name, p.sku, p.name, c.name, b.batch_number, b.expiry_date;

-- 3. Immutable Stock Ledger Triggers (Append-Only Financial Grade Protection)
DROP TRIGGER IF EXISTS trg_ledger_no_update;
CREATE TRIGGER trg_ledger_no_update
BEFORE UPDATE ON wms_stock_ledger
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock ledger is append-only';

DROP TRIGGER IF EXISTS trg_ledger_no_delete;
CREATE TRIGGER trg_ledger_no_delete
BEFORE DELETE ON wms_stock_ledger
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock ledger is append-only';

-- 4. Principle of Least Privilege for Kora AI SQL Analytics
CREATE USER IF NOT EXISTS 'ai_readonly'@'%' IDENTIFIED BY 'ai_safe_password_2026';
GRANT SELECT ON v_stock_summary TO 'ai_readonly'@'%';
GRANT SELECT ON v_expiring_batches TO 'ai_readonly'@'%';
