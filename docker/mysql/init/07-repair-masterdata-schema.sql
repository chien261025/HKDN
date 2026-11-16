-- Bổ sung các cột backend sử dụng cho database được tạo từ schema cũ.
ALTER TABLE wms_product
    ADD COLUMN supplier_id BIGINT NULL,
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN deleted_at DATETIME(6) NULL;

ALTER TABLE wms_supplier
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE wms_product
    ADD CONSTRAINT fk_product_supplier
    FOREIGN KEY (supplier_id) REFERENCES wms_supplier(id) ON DELETE SET NULL;
