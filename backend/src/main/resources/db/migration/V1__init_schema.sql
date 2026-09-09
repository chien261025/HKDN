-- ==========================================================
-- V1__init_schema.sql: KHỞI TẠO CẤU TRÚC BẢNG CHO FLYWAY
-- ==========================================================

CREATE TABLE IF NOT EXISTS wms_role (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS wms_user (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role_id INT REFERENCES wms_role(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wms_location (
    id BIGSERIAL PRIMARY KEY,
    zone_code VARCHAR(20) NOT NULL,
    aisle VARCHAR(20) NOT NULL,
    rack VARCHAR(20) NOT NULL,
    shelf VARCHAR(20) NOT NULL,
    bin_barcode VARCHAR(50) UNIQUE NOT NULL,
    max_weight_kg NUMERIC(10,2) DEFAULT 500.0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS wms_supplier (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wms_product (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    unit VARCHAR(20) NOT NULL DEFAULT 'Cái',
    safety_stock INT DEFAULT 10,
    reorder_point INT DEFAULT 20,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wms_product_batch (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES wms_product(id),
    batch_number VARCHAR(100) NOT NULL,
    manufacture_date DATE,
    expiry_date DATE NOT NULL,
    supplier_id BIGINT REFERENCES wms_supplier(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_product_batch UNIQUE (product_id, batch_number)
);

CREATE TABLE IF NOT EXISTS wms_inventory (
    id BIGSERIAL PRIMARY KEY,
    location_id BIGINT REFERENCES wms_location(id),
    product_id BIGINT REFERENCES wms_product(id),
    batch_id BIGINT REFERENCES wms_product_batch(id),
    on_hand_qty INT NOT NULL DEFAULT 0 CHECK (on_hand_qty >= 0),
    reserved_qty INT NOT NULL DEFAULT 0 CHECK (reserved_qty >= 0),
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_inventory_loc_batch UNIQUE (location_id, product_id, batch_id)
);

CREATE TABLE IF NOT EXISTS wms_stock_ledger (
    id BIGSERIAL PRIMARY KEY,
    transaction_type VARCHAR(30) NOT NULL,
    reference_code VARCHAR(100) NOT NULL,
    location_id BIGINT REFERENCES wms_location(id),
    product_id BIGINT REFERENCES wms_product(id),
    batch_id BIGINT REFERENCES wms_product_batch(id),
    qty_change INT NOT NULL,
    balance_after INT NOT NULL,
    performed_by VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wms_inbound_order (
    id BIGSERIAL PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    supplier_id BIGINT REFERENCES wms_supplier(id),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wms_outbound_order (
    id BIGSERIAL PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wms_report_job (
    id UUID PRIMARY KEY,
    report_name VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    download_url TEXT,
    error_message TEXT,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
