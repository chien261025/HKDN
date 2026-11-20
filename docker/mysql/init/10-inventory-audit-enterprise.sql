-- ==============================================================================
-- 10-inventory-audit-enterprise.sql
-- Nâng cấp Phân hệ Kiểm kê Kho (Cycle Counting & Audit Reconciliation)
-- Hỗ trợ: Phạm vi (Zone/Bin/SKU/Empty Bins), Blind Count, SoD, Bút toán điều chỉnh
-- ==============================================================================

USE `wms_db`;

-- 1. Chuẩn hóa tên kho tiếng Việt UTF-8
UPDATE `wms_warehouse` SET `name` = 'Kho Tổng Tân Bình - TP.HCM' WHERE `id` = 1;
UPDATE `wms_warehouse` SET `name` = 'Kho Phân Phối VSIP Bắc Ninh' WHERE `id` = 2;
UPDATE `wms_warehouse` SET `name` = 'Kho Vận Miền Trung - Đà Nẵng' WHERE `id` = 3;
UPDATE `wms_warehouse` SET `name` = 'Kho Trung Chuyển Sóng Thần - Bình Dương' WHERE `id` = 4;

-- 2. Bổ sung trường cấu hình cho bảng wms_inventory_audit
ALTER TABLE `wms_inventory_audit`
    ADD COLUMN `title` VARCHAR(255) NULL AFTER `audit_code`,
    ADD COLUMN `scope_type` VARCHAR(50) NOT NULL DEFAULT 'ALL' AFTER `audit_type`,
    ADD COLUMN `scope_value` VARCHAR(255) NULL AFTER `scope_type`,
    ADD COLUMN `is_blind_count` BOOLEAN NOT NULL DEFAULT TRUE AFTER `scope_value`,
    ADD COLUMN `is_independent_verification_required` BOOLEAN NOT NULL DEFAULT TRUE AFTER `is_blind_count`,
    ADD COLUMN `include_empty_bins` BOOLEAN NOT NULL DEFAULT FALSE AFTER `is_independent_verification_required`,
    ADD COLUMN `assigned_operator_id` BIGINT NULL AFTER `created_by`,
    ADD COLUMN `adjustment_code` VARCHAR(50) NULL AFTER `approved_by`;

-- 3. Bổ sung trường kiểm đếm nhiều vòng & xác minh cho wms_inventory_audit_item
ALTER TABLE `wms_inventory_audit_item`
    ADD COLUMN `first_count_qty` INT NULL AFTER `counted_qty`,
    ADD COLUMN `second_count_qty` INT NULL AFTER `first_count_qty`,
    ADD COLUMN `is_verified` BOOLEAN NOT NULL DEFAULT FALSE AFTER `second_count_qty`,
    ADD COLUMN `recounted_by` BIGINT NULL AFTER `is_verified`;

-- 4. Cập nhật dữ liệu mặc định cho các đợt kiểm kê hiện có (nếu có)
UPDATE `wms_inventory_audit`
SET `title` = CONCAT('Đợt kiểm kê ', audit_code)
WHERE `title` IS NULL OR `title` = '';

UPDATE `wms_inventory_audit`
SET `scope_type` = 'ALL'
WHERE `scope_type` IS NULL;

UPDATE `wms_inventory_audit_item`
SET `first_count_qty` = `counted_qty`
WHERE `counted_qty` IS NOT NULL AND `first_count_qty` IS NULL;

-- 5. Cho phép ghi nhận vị trí ô kệ trống hoặc hàng ngoài danh mục (Unexpected Stock)
ALTER TABLE `wms_inventory_audit_item` DROP FOREIGN KEY `fk_audit_item_inventory`;
