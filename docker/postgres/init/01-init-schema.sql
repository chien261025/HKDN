-- ==========================================================
-- 01-init-schema.sql: KHỞI TẠO BẢNG DỮ LIỆU SMART WMS
-- ==========================================================

-- 1. BẢNG PHÂN QUYỀN & NGƯỜI DÙNG (IDENTITY)
CREATE TABLE IF NOT EXISTS wms_role (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255)
);

INSERT INTO wms_role (name, description) VALUES
('ROLE_ADMIN', 'Quản trị viên toàn hệ thống'),
('ROLE_WAREHOUSE_MANAGER', 'Quản lý trưởng kho'),
('ROLE_OPERATOR', 'Nhân viên vận hành kho')
ON CONFLICT (name) DO NOTHING;

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

-- 2. BẢNG MASTER DATA: VỊ TRÍ KHO VẬT LÝ (LOCATION TOPOLOGY)
CREATE TABLE IF NOT EXISTS wms_location (
    id BIGSERIAL PRIMARY KEY,
    zone_code VARCHAR(20) NOT NULL,      -- Khu A, B (Lạnh, Khô)
    aisle VARCHAR(20) NOT NULL,          -- Dãy
    rack VARCHAR(20) NOT NULL,           -- Kệ
    shelf VARCHAR(20) NOT NULL,          -- Tầng
    bin_barcode VARCHAR(50) UNIQUE NOT NULL, -- Mã vạch dán trên ô (VD: Z1-A01-R01-S01-B01)
    max_weight_kg NUMERIC(10,2) DEFAULT 500.0,
    is_active BOOLEAN DEFAULT TRUE
);

-- 3. BẢNG MASTER DATA: SẢN PHẨM & NHÀ CUNG CẤP
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
    category_id INT,
    unit VARCHAR(20) NOT NULL DEFAULT 'Cái',
    safety_stock INT DEFAULT 10,
    reorder_point INT DEFAULT 20,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. BẢNG LÔ HÀNG (BATCH) & HẠN SỬ DỤNG (HỖ TRỢ FEFO)
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

-- 5. BẢNG LÕI TỒN KHO THEO Ô KỆ (INVENTORY)
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

-- 6. BẢNG SỔ CÁI BẤT BIẾN (STOCK LEDGER)
CREATE TABLE IF NOT EXISTS wms_stock_ledger (
    id BIGSERIAL PRIMARY KEY,
    transaction_type VARCHAR(30) NOT NULL, -- INBOUND, OUTBOUND, ADJUSTMENT, TRANSFER
    reference_code VARCHAR(100) NOT NULL,  -- Mã phiếu nhập/xuất
    location_id BIGINT REFERENCES wms_location(id),
    product_id BIGINT REFERENCES wms_product(id),
    batch_id BIGINT REFERENCES wms_product_batch(id),
    qty_change INT NOT NULL,
    balance_after INT NOT NULL,
    performed_by VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. BẢNG ĐƠN HÀNG XUẤT/NHẬP
CREATE TABLE IF NOT EXISTS wms_inbound_order (
    id BIGSERIAL PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    supplier_id BIGINT REFERENCES wms_supplier(id),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, RECEIVED, STOCKED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wms_outbound_order (
    id BIGSERIAL PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, RESERVED, PICKED, DISPATCHED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. BẢNG THEO DÕI JOB BÁO CÁO NẶNG (REPORT JOBS)
CREATE TABLE IF NOT EXISTS wms_report_job (
    id UUID PRIMARY KEY,
    report_name VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
    download_url TEXT,
    error_message TEXT,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Tạo Index tăng tốc truy vấn Barcode và Hạn sử dụng
CREATE INDEX IF NOT EXISTS idx_inv_product_loc ON wms_inventory(product_id, location_id);
CREATE INDEX IF NOT EXISTS idx_batch_expiry ON wms_product_batch(expiry_date ASC);
CREATE INDEX IF NOT EXISTS idx_location_barcode ON wms_location(bin_barcode);
