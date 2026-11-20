-- Existing partners remain suppliers; no user/authorization roles are modified.
ALTER TABLE wms_supplier ADD COLUMN partner_role VARCHAR(20) NOT NULL DEFAULT 'SUPPLIER';
ALTER TABLE wms_supplier ADD COLUMN contact_person VARCHAR(255) NULL;
ALTER TABLE wms_supplier ADD COLUMN email VARCHAR(255) NULL;
ALTER TABLE wms_supplier ADD COLUMN address VARCHAR(1000) NULL;
ALTER TABLE wms_supplier ADD COLUMN supplied_categories VARCHAR(1000) NULL;
ALTER TABLE wms_outbound_order ADD COLUMN partner_id BIGINT NULL;
ALTER TABLE wms_outbound_order MODIFY COLUMN customer_name VARCHAR(255) NULL;
