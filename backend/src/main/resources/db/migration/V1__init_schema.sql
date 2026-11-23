-- ==========================================================
-- V1__init_schema.sql: KHỞI TẠO BẢNG DỮ LIỆU SMART WMS (MYSQL 8)
-- ==========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. BẢNG PHÂN QUYỀN & NGƯỜI DÙNG (IDENTITY & ACCESS MANAGEMENT - RBAC)
CREATE TABLE IF NOT EXISTS wms_role (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wms_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at DATETIME(6),
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wms_user_role (
    user_id BIGINT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_role_user FOREIGN KEY (user_id) REFERENCES wms_user(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_role_role FOREIGN KEY (role_id) REFERENCES wms_role(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wms_user_session (
    id VARCHAR(36) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    device_name VARCHAR(100) NOT NULL,
    device_type VARCHAR(30) NOT NULL,
    ip_address VARCHAR(50) NOT NULL,
    location_name VARCHAR(150) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    last_active_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    revoked_reason VARCHAR(100),
    CONSTRAINT fk_user_session_user FOREIGN KEY (user_id) REFERENCES wms_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_user_session_user_id ON wms_user_session(user_id);
CREATE INDEX idx_user_session_active ON wms_user_session(user_id, is_active);
CREATE INDEX idx_user_session_token ON wms_user_session(token_hash);

-- 2. BẢNG MASTER DATA: KHO TỔNG (WAREHOUSE) & VỊ TRÍ KHO VẬT LÝ (LOCATION TOPOLOGY)
CREATE TABLE IF NOT EXISTS wms_warehouse (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    contact_phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    trusted_ips VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wms_location (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    warehouse_id BIGINT NOT NULL,
    zone_code VARCHAR(20) NOT NULL,
    aisle VARCHAR(20) NOT NULL,
    rack VARCHAR(20) NOT NULL,
    shelf VARCHAR(20) NOT NULL,
    bin VARCHAR(20) NOT NULL,
    bin_barcode VARCHAR(50) UNIQUE NOT NULL,
    max_weight_kg DECIMAL(10,2) DEFAULT 500.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_location_coords UNIQUE (warehouse_id, zone_code, aisle, rack, shelf, bin),
    CONSTRAINT fk_location_warehouse FOREIGN KEY (warehouse_id) REFERENCES wms_warehouse(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BẢNG MASTER DATA: DANH MỤC PHÂN CẤP (CATEGORY), SẢN PHẨM & NHÀ CUNG CẤP
CREATE TABLE IF NOT EXISTS wms_category (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    parent_id BIGINT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_category_parent FOREIGN KEY (parent_id) REFERENCES wms_category(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wms_supplier (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wms_product (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category_id BIGINT,
    supplier_id BIGINT,
    unit VARCHAR(20) NOT NULL,
    safety_stock INT DEFAULT 10,
    reorder_point INT DEFAULT 20,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at DATETIME(6),
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES wms_category(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. BẢNG LÔ HÀNG (BATCH) & HẠN SỬ DỤNG
CREATE TABLE IF NOT EXISTS wms_product_batch (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    manufacture_date DATE,
    expiry_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    supplier_id BIGINT,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_product_batch UNIQUE (product_id, batch_number),
    CONSTRAINT uq_product_batch_id_product UNIQUE (id, product_id),
    CONSTRAINT fk_batch_product FOREIGN KEY (product_id) REFERENCES wms_product(id) ON DELETE RESTRICT,
    CONSTRAINT fk_batch_supplier FOREIGN KEY (supplier_id) REFERENCES wms_supplier(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. BẢNG LÕI TỒN KHO THEO Ô KỆ (INVENTORY)
CREATE TABLE IF NOT EXISTS wms_inventory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    location_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    batch_id BIGINT NOT NULL,
    on_hand_qty INT NOT NULL DEFAULT 0,
    reserved_qty INT NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    last_updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_inventory_loc_batch UNIQUE (location_id, product_id, batch_id),
    CONSTRAINT chk_inventory_qty CHECK (on_hand_qty >= reserved_qty AND reserved_qty >= 0),
    CONSTRAINT fk_inventory_location FOREIGN KEY (location_id) REFERENCES wms_location(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inventory_product FOREIGN KEY (product_id) REFERENCES wms_product(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inventory_batch FOREIGN KEY (batch_id) REFERENCES wms_product_batch(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inventory_batch_product FOREIGN KEY (batch_id, product_id) REFERENCES wms_product_batch(id, product_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. BẢNG SỔ CÁI BẤT BIẾN (STOCK LEDGER)
CREATE TABLE IF NOT EXISTS wms_stock_ledger (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_type VARCHAR(30) NOT NULL,
    reference_code VARCHAR(100) NOT NULL,
    location_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    batch_id BIGINT NOT NULL,
    qty_change INT NOT NULL,
    balance_after INT NOT NULL,
    performed_by BIGINT NOT NULL,
    notes TEXT,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_ledger_location FOREIGN KEY (location_id) REFERENCES wms_location(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ledger_product FOREIGN KEY (product_id) REFERENCES wms_product(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ledger_batch FOREIGN KEY (batch_id) REFERENCES wms_product_batch(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ledger_user FOREIGN KEY (performed_by) REFERENCES wms_user(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ledger_batch_product FOREIGN KEY (batch_id, product_id) REFERENCES wms_product_batch(id, product_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. BẢNG QUẢN LÝ ĐƠN HÀNG NHẬP KHO (INBOUND DOMAIN)
CREATE TABLE IF NOT EXISTS wms_inbound_order (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    warehouse_id BIGINT NOT NULL,
    supplier_id BIGINT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_by BIGINT NOT NULL,
    notes TEXT,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_inbound_warehouse FOREIGN KEY (warehouse_id) REFERENCES wms_warehouse(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inbound_supplier FOREIGN KEY (supplier_id) REFERENCES wms_supplier(id),
    CONSTRAINT fk_inbound_user FOREIGN KEY (created_by) REFERENCES wms_user(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wms_inbound_order_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    inbound_order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_batch_id BIGINT,
    batch_number VARCHAR(100),
    manufacture_date DATE,
    expiry_date DATE,
    expected_qty INT NOT NULL CHECK (expected_qty > 0),
    received_qty INT NOT NULL DEFAULT 0 CHECK (received_qty >= 0),
    over_delivery_tolerance_pct DECIMAL(5,2) DEFAULT 10.00,
    unit_price DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_inbound_item_order FOREIGN KEY (inbound_order_id) REFERENCES wms_inbound_order(id) ON DELETE CASCADE,
    CONSTRAINT fk_inbound_item_product FOREIGN KEY (product_id) REFERENCES wms_product(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inbound_item_batch FOREIGN KEY (product_batch_id) REFERENCES wms_product_batch(id) ON DELETE SET NULL,
    CONSTRAINT chk_inbound_item_over_delivery CHECK ((received_qty - rejected_qty) <= expected_qty * (1 + (over_delivery_tolerance_pct / 100.0)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. BẢNG QUẢN LÝ ĐƠN HÀNG XUẤT KHO, PHÂN BỔ FEFO & GIỮ CHỖ TỒN KHO (OUTBOUND DOMAIN)
CREATE TABLE IF NOT EXISTS wms_outbound_order (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    warehouse_id BIGINT NOT NULL,
    customer_name VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_by BIGINT NOT NULL,
    notes TEXT,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_outbound_warehouse FOREIGN KEY (warehouse_id) REFERENCES wms_warehouse(id) ON DELETE RESTRICT,
    CONSTRAINT fk_outbound_user FOREIGN KEY (created_by) REFERENCES wms_user(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wms_outbound_order_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    outbound_order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    requested_qty INT NOT NULL CHECK (requested_qty > 0),
    allocated_qty INT NOT NULL DEFAULT 0 CHECK (allocated_qty >= 0),
    picked_qty INT NOT NULL DEFAULT 0 CHECK (picked_qty >= 0),
    unit_price DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_outbound_item_id_product UNIQUE (id, product_id),
    CONSTRAINT fk_outbound_item_order FOREIGN KEY (outbound_order_id) REFERENCES wms_outbound_order(id) ON DELETE CASCADE,
    CONSTRAINT fk_outbound_item_product FOREIGN KEY (product_id) REFERENCES wms_product(id) ON DELETE RESTRICT,
    CONSTRAINT chk_outbound_item_qty CHECK (requested_qty >= allocated_qty AND allocated_qty >= picked_qty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wms_pick_allocation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    outbound_order_item_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    location_id BIGINT NOT NULL,
    batch_id BIGINT NOT NULL,
    allocated_qty INT NOT NULL CHECK (allocated_qty > 0),
    picked_qty INT NOT NULL DEFAULT 0 CHECK (picked_qty >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'ALLOCATED',
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    picked_at DATETIME(6),
    CONSTRAINT chk_pick_allocation_qty CHECK (allocated_qty >= picked_qty),
    CONSTRAINT fk_pick_alloc_order_item_product FOREIGN KEY (outbound_order_item_id, product_id) REFERENCES wms_outbound_order_item(id, product_id) ON DELETE CASCADE,
    CONSTRAINT fk_pick_alloc_batch_product FOREIGN KEY (batch_id, product_id) REFERENCES wms_product_batch(id, product_id) ON DELETE RESTRICT,
    CONSTRAINT fk_pick_alloc_inventory FOREIGN KEY (location_id, product_id, batch_id) REFERENCES wms_inventory(location_id, product_id, batch_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wms_stock_reservation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    outbound_order_id BIGINT NOT NULL,
    outbound_order_item_id BIGINT NOT NULL,
    location_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    batch_id BIGINT NOT NULL,
    reserved_qty INT NOT NULL CHECK (reserved_qty > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'RESERVED',
    expires_at DATETIME(6),
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_reservation_order FOREIGN KEY (outbound_order_id) REFERENCES wms_outbound_order(id) ON DELETE CASCADE,
    CONSTRAINT fk_reservation_item FOREIGN KEY (outbound_order_item_id) REFERENCES wms_outbound_order_item(id) ON DELETE CASCADE,
    CONSTRAINT fk_reservation_inventory FOREIGN KEY (location_id, product_id, batch_id) REFERENCES wms_inventory(location_id, product_id, batch_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. BẢNG QUẢN LÝ ĐIỀU CHUYỂN VỊ TRÍ / CHUYỂN KHO (STOCK TRANSFER DOMAIN)
CREATE TABLE IF NOT EXISTS wms_stock_transfer (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transfer_code VARCHAR(50) UNIQUE NOT NULL,
    warehouse_id BIGINT NOT NULL,
    from_location_id BIGINT NOT NULL,
    to_location_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    batch_id BIGINT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_by BIGINT NOT NULL,
    completed_by BIGINT,
    notes TEXT,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    completed_at DATETIME(6),
    CONSTRAINT chk_transfer_diff_loc CHECK (from_location_id <> to_location_id),
    CONSTRAINT fk_transfer_warehouse FOREIGN KEY (warehouse_id) REFERENCES wms_warehouse(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transfer_from_loc FOREIGN KEY (from_location_id) REFERENCES wms_location(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transfer_to_loc FOREIGN KEY (to_location_id) REFERENCES wms_location(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transfer_product FOREIGN KEY (product_id) REFERENCES wms_product(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transfer_batch FOREIGN KEY (batch_id) REFERENCES wms_product_batch(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transfer_batch_product FOREIGN KEY (batch_id, product_id) REFERENCES wms_product_batch(id, product_id) ON DELETE RESTRICT,
    CONSTRAINT fk_transfer_creator FOREIGN KEY (created_by) REFERENCES wms_user(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transfer_completer FOREIGN KEY (completed_by) REFERENCES wms_user(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. BẢNG QUẢN LÝ KIỂM KÊ KHO & CÂN ĐỐI TỒN KHO (STOCK AUDIT & ADJUSTMENT DOMAIN)
CREATE TABLE IF NOT EXISTS wms_inventory_audit (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    audit_code VARCHAR(50) UNIQUE NOT NULL,
    warehouse_id BIGINT NOT NULL,
    audit_type VARCHAR(30) NOT NULL DEFAULT 'CYCLE_COUNT',
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
    created_by BIGINT NOT NULL,
    approved_by BIGINT,
    notes TEXT,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    completed_at DATETIME(6),
    CONSTRAINT fk_audit_warehouse FOREIGN KEY (warehouse_id) REFERENCES wms_warehouse(id) ON DELETE RESTRICT,
    CONSTRAINT fk_audit_creator FOREIGN KEY (created_by) REFERENCES wms_user(id) ON DELETE RESTRICT,
    CONSTRAINT fk_audit_approver FOREIGN KEY (approved_by) REFERENCES wms_user(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wms_inventory_audit_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    audit_id BIGINT NOT NULL,
    location_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    batch_id BIGINT NOT NULL,
    system_qty INT NOT NULL,
    counted_qty INT,
    difference_qty INT GENERATED ALWAYS AS (CASE WHEN counted_qty IS NULL THEN NULL ELSE counted_qty - system_qty END) STORED,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    counter_notes TEXT,
    counted_at DATETIME(6),
    CONSTRAINT fk_audit_item_audit FOREIGN KEY (audit_id) REFERENCES wms_inventory_audit(id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_item_location FOREIGN KEY (location_id) REFERENCES wms_location(id) ON DELETE RESTRICT,
    CONSTRAINT fk_audit_item_product FOREIGN KEY (product_id) REFERENCES wms_product(id) ON DELETE RESTRICT,
    CONSTRAINT fk_audit_item_batch FOREIGN KEY (batch_id) REFERENCES wms_product_batch(id) ON DELETE RESTRICT,
    CONSTRAINT fk_audit_item_batch_product FOREIGN KEY (batch_id, product_id) REFERENCES wms_product_batch(id, product_id) ON DELETE RESTRICT,
    CONSTRAINT fk_audit_item_inventory FOREIGN KEY (location_id, product_id, batch_id) REFERENCES wms_inventory(location_id, product_id, batch_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wms_stock_adjustment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    adjustment_code VARCHAR(50) UNIQUE NOT NULL,
    audit_id BIGINT,
    warehouse_id BIGINT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_by BIGINT NOT NULL,
    approved_by BIGINT,
    approved_at DATETIME(6),
    notes TEXT,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_adj_audit FOREIGN KEY (audit_id) REFERENCES wms_inventory_audit(id) ON DELETE SET NULL,
    CONSTRAINT fk_adj_warehouse FOREIGN KEY (warehouse_id) REFERENCES wms_warehouse(id) ON DELETE RESTRICT,
    CONSTRAINT fk_adj_creator FOREIGN KEY (created_by) REFERENCES wms_user(id) ON DELETE RESTRICT,
    CONSTRAINT fk_adj_approver FOREIGN KEY (approved_by) REFERENCES wms_user(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wms_stock_adjustment_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    adjustment_id BIGINT NOT NULL,
    location_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    batch_id BIGINT NOT NULL,
    system_qty INT NOT NULL,
    actual_qty INT NOT NULL,
    adjusted_qty INT GENERATED ALWAYS AS (actual_qty - system_qty) STORED,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_adj_item_adjustment FOREIGN KEY (adjustment_id) REFERENCES wms_stock_adjustment(id) ON DELETE CASCADE,
    CONSTRAINT fk_adj_item_inventory FOREIGN KEY (location_id, product_id, batch_id) REFERENCES wms_inventory(location_id, product_id, batch_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. BẢNG THEO DÕI JOB BÁO CÁO NẶNG (REPORT JOBS)
CREATE TABLE IF NOT EXISTS wms_report_job (
    id VARCHAR(36) PRIMARY KEY,
    report_name VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    download_url TEXT,
    error_message TEXT,
    created_by BIGINT,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    completed_at DATETIME(6),
    CONSTRAINT fk_report_job_user FOREIGN KEY (created_by) REFERENCES wms_user(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. BẢNG TRANSACTIONAL OUTBOX & PROCESSED EVENTS
CREATE TABLE IF NOT EXISTS wms_outbox_event (
    id VARCHAR(36) PRIMARY KEY,
    aggregate_type VARCHAR(50) NOT NULL,
    aggregate_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSON NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    retry_count INT DEFAULT 0,
    locked_at DATETIME(6),
    locked_by VARCHAR(100),
    next_retry_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    last_error TEXT,
    idempotency_key VARCHAR(100) UNIQUE,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    published_at DATETIME(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wms_processed_event (
    event_id VARCHAR(36) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    processed_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- INDEXES
CREATE INDEX idx_inv_product_loc ON wms_inventory(product_id, location_id);
CREATE INDEX idx_batch_fefo_active ON wms_product_batch(product_id, expiry_date, status);
CREATE INDEX idx_ledger_product_loc ON wms_stock_ledger(product_id, location_id);
CREATE INDEX idx_ledger_ref_code ON wms_stock_ledger(reference_code);
CREATE INDEX idx_ledger_created_at ON wms_stock_ledger(created_at DESC);
CREATE INDEX idx_ledger_batch ON wms_stock_ledger(batch_id);

CREATE INDEX idx_inbound_item_order ON wms_inbound_order_item(inbound_order_id);
CREATE INDEX idx_inbound_item_product ON wms_inbound_order_item(product_id);
CREATE INDEX idx_outbound_item_order ON wms_outbound_order_item(outbound_order_id);
CREATE INDEX idx_outbound_item_product ON wms_outbound_order_item(product_id);

CREATE INDEX idx_pick_alloc_item ON wms_pick_allocation(outbound_order_item_id);
CREATE INDEX idx_pick_alloc_loc_batch ON wms_pick_allocation(location_id, batch_id);
CREATE INDEX idx_pick_alloc_prod_batch ON wms_pick_allocation(product_id, batch_id);

CREATE INDEX idx_transfer_wh_status ON wms_stock_transfer(warehouse_id, status);
CREATE INDEX idx_audit_item_audit ON wms_inventory_audit_item(audit_id);
CREATE INDEX idx_audit_item_loc_prod ON wms_inventory_audit_item(location_id, product_id);

CREATE INDEX idx_outbox_status_retry ON wms_outbox_event(status, next_retry_at);
CREATE INDEX idx_reservation_order ON wms_stock_reservation(outbound_order_id);
CREATE INDEX idx_reservation_loc_batch ON wms_stock_reservation(location_id, batch_id);

CREATE INDEX idx_adj_audit ON wms_stock_adjustment(audit_id);
CREATE INDEX idx_adj_item_adj ON wms_stock_adjustment_item(adjustment_id);

SET FOREIGN_KEY_CHECKS = 1;
