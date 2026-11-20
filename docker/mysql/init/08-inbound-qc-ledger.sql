USE wms_db;

-- Also safe to run on an existing demo volume before upgrading the application.
DROP PROCEDURE IF EXISTS migrate_inbound_qc;
DELIMITER //
CREATE PROCEDURE migrate_inbound_qc()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE()
        AND table_name='wms_inbound_order_item' AND column_name='rejected_qty') THEN
        ALTER TABLE wms_inbound_order_item ADD rejected_qty INT NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE()
        AND table_name='wms_inbound_order_item' AND column_name='stocked_qty') THEN
        ALTER TABLE wms_inbound_order_item ADD stocked_qty INT NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE()
        AND table_name='wms_inbound_order_item' AND constraint_name='chk_inbound_qc') THEN
        -- Legacy completed lines had no separate putaway counter. Preserve their closed status.
        UPDATE wms_inbound_order_item SET stocked_qty=received_qty-rejected_qty
        WHERE status='COMPLETED' AND stocked_qty=0;
        ALTER TABLE wms_inbound_order_item ADD CONSTRAINT chk_inbound_qc
            CHECK (rejected_qty >= 0 AND stocked_qty >= 0 AND stocked_qty <= received_qty-rejected_qty);
    END IF;
END//
DELIMITER ;
CALL migrate_inbound_qc();
DROP PROCEDURE migrate_inbound_qc;

CREATE TRIGGER IF NOT EXISTS trg_ledger_no_update BEFORE UPDATE ON wms_stock_ledger
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Stock ledger is append-only';
CREATE TRIGGER IF NOT EXISTS trg_ledger_no_delete BEFORE DELETE ON wms_stock_ledger
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Stock ledger is append-only';
