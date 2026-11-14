ALTER TABLE wms_product
    ADD COLUMN IF NOT EXISTS supplier_id BIGINT;

ALTER TABLE wms_product
    ADD CONSTRAINT fk_product_supplier FOREIGN KEY (supplier_id)
    REFERENCES wms_supplier(id) ON DELETE SET NULL;
