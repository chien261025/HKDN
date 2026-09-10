-- ==========================================================
-- 01-init-schema.sql: KHỞI TẠO BẢNG DỮ LIỆU SMART WMS CHUẨN ENTERPRISE PRODUCTION-READY
-- ==========================================================

-- 1. BẢNG PHÂN QUYỀN & NGƯỜI DÙNG (IDENTITY & ACCESS MANAGEMENT - RBAC)
CREATE TABLE IF NOT EXISTS wms_role (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS wms_permission (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,                   -- VD: 'INVENTORY:READ', 'ORDER:APPROVE'
    name VARCHAR(255) NOT NULL,
    module VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS wms_role_permission (
    role_id INT NOT NULL REFERENCES wms_role(id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES wms_permission(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS wms_user (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role_id INT REFERENCES wms_role(id),                 -- Primary Role để tương thích nhanh JWT
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wms_user_role (
    user_id BIGINT NOT NULL REFERENCES wms_user(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES wms_role(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 2. BẢNG MASTER DATA: KHO TỔNG (WAREHOUSE) & VỊ TRÍ KHO VẬT LÝ (LOCATION TOPOLOGY)
CREATE TABLE IF NOT EXISTS wms_warehouse (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,                    -- Business Key (VD: WH01, WH02)
    name VARCHAR(255) NOT NULL,                          -- Tên kho (VD: Kho Tổng Tân Bình)
    address TEXT,                                        -- Địa chỉ thực tế
    contact_phone VARCHAR(20),                           -- Số hotline kho
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wms_location (
    id BIGSERIAL PRIMARY KEY,
    warehouse_id BIGINT NOT NULL REFERENCES wms_warehouse(id) ON DELETE RESTRICT,
    zone_code VARCHAR(20) NOT NULL,                      -- Khu A (Khô), Khu B (Mát/Lạnh)
    aisle VARCHAR(20) NOT NULL,                          -- Dãy kệ
    rack VARCHAR(20) NOT NULL,                           -- Kệ chứa
    shelf VARCHAR(20) NOT NULL,                          -- Tầng kệ
    bin VARCHAR(20) NOT NULL,                            -- Mã định danh ô cụ thể (VD: B01, B02)
    bin_barcode VARCHAR(50) UNIQUE NOT NULL,             -- Mã vạch quét nhanh (Tự sinh Unique Index)
    max_weight_kg NUMERIC(10,2) DEFAULT 500.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_location_coords UNIQUE (warehouse_id, zone_code, aisle, rack, shelf, bin)
);

-- 3. BẢNG MASTER DATA: DANH MỤC PHÂN CẤP (CATEGORY), SẢN PHẨM & NHÀ CUNG CẤP
CREATE TABLE IF NOT EXISTS wms_category (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,                    -- Business Key (VD: CAT-ELEC, CAT-PHONE)
    name VARCHAR(100) NOT NULL,
    parent_id BIGINT REFERENCES wms_category(id) ON DELETE RESTRICT, -- Hỗ trợ cây phân cấp cha - con
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wms_supplier (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wms_product (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category_id BIGINT REFERENCES wms_category(id) ON DELETE SET NULL,
    unit VARCHAR(20) NOT NULL,
    safety_stock INT DEFAULT 10,
    reorder_point INT DEFAULT 20,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Bảng liên kết N-N: Danh mục cung ứng (Supplier Product Catalog)
CREATE TABLE IF NOT EXISTS wms_supplier_product (
    supplier_id BIGINT NOT NULL REFERENCES wms_supplier(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES wms_product(id) ON DELETE CASCADE,
    supplier_sku VARCHAR(100),
    purchase_price NUMERIC(15,2) DEFAULT 0.00,
    lead_time_days INT DEFAULT 3,
    min_order_qty INT DEFAULT 1,
    is_preferred BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (supplier_id, product_id)
);

-- 4. BẢNG LÔ HÀNG (BATCH) & HẠN SỬ DỤNG
CREATE TABLE IF NOT EXISTS wms_product_batch (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES wms_product(id) ON DELETE RESTRICT,
    batch_number VARCHAR(100) NOT NULL,
    manufacture_date DATE,
    expiry_date DATE,                                    -- Hỗ trợ cả hàng tiêu dùng lẫn hàng phi date
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' 
        CHECK (status IN ('ACTIVE', 'QUARANTINE', 'RECALLED', 'EXPIRED')),
    supplier_id BIGINT REFERENCES wms_supplier(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_product_batch UNIQUE (product_id, batch_number),
    CONSTRAINT uq_product_batch_id_product UNIQUE (id, product_id) -- Dùng cho Composite FK chống lệch dữ liệu
);

-- 5. BẢNG LÕI TỒN KHO THEO Ô KỆ (INVENTORY)
CREATE TABLE IF NOT EXISTS wms_inventory (
    id BIGSERIAL PRIMARY KEY,
    location_id BIGINT NOT NULL REFERENCES wms_location(id) ON DELETE RESTRICT,
    product_id BIGINT NOT NULL REFERENCES wms_product(id) ON DELETE RESTRICT,
    batch_id BIGINT NOT NULL REFERENCES wms_product_batch(id) ON DELETE RESTRICT,
    on_hand_qty INT NOT NULL DEFAULT 0,
    reserved_qty INT NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,                   -- Optimistic Locking Version
    last_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_inventory_loc_batch UNIQUE (location_id, product_id, batch_id),
    CONSTRAINT chk_inventory_qty CHECK (on_hand_qty >= reserved_qty AND reserved_qty >= 0),
    -- Khóa toàn vẹn: Đảm bảo product_id không lệch với lô hàng batch_id
    CONSTRAINT fk_inventory_batch_product FOREIGN KEY (batch_id, product_id) 
        REFERENCES wms_product_batch(id, product_id) ON DELETE RESTRICT
);

-- 6. BẢNG SỔ CÁI BẤT BIẾN (STOCK LEDGER)
CREATE TABLE IF NOT EXISTS wms_stock_ledger (
    id BIGSERIAL PRIMARY KEY,
    transaction_type VARCHAR(30) NOT NULL 
        CHECK (transaction_type IN ('INBOUND', 'OUTBOUND', 'ADJUSTMENT', 'TRANSFER', 'INITIAL_IMPORT')),
    reference_code VARCHAR(100) NOT NULL,                -- Mã phiếu nhập/xuất/kiểm kê/chuyển vị trí
    location_id BIGINT NOT NULL REFERENCES wms_location(id) ON DELETE RESTRICT,
    product_id BIGINT NOT NULL REFERENCES wms_product(id) ON DELETE RESTRICT,
    batch_id BIGINT NOT NULL REFERENCES wms_product_batch(id) ON DELETE RESTRICT,
    qty_change INT NOT NULL,
    balance_after INT NOT NULL,
    performed_by BIGINT NOT NULL REFERENCES wms_user(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ledger_batch_product FOREIGN KEY (batch_id, product_id) 
        REFERENCES wms_product_batch(id, product_id) ON DELETE RESTRICT
);

-- 7. BẢNG QUẢN LÝ ĐƠN HÀNG NHẬP KHO (INBOUND DOMAIN)
CREATE TABLE IF NOT EXISTS wms_inbound_order (
    id BIGSERIAL PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    warehouse_id BIGINT NOT NULL REFERENCES wms_warehouse(id) ON DELETE RESTRICT,
    supplier_id BIGINT REFERENCES wms_supplier(id),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'RECEIVED', 'STOCKED', 'CANCELLED')),
    created_by BIGINT NOT NULL REFERENCES wms_user(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wms_inbound_order_item (
    id BIGSERIAL PRIMARY KEY,
    inbound_order_id BIGINT NOT NULL REFERENCES wms_inbound_order(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES wms_product(id) ON DELETE RESTRICT,
    product_batch_id BIGINT REFERENCES wms_product_batch(id) ON DELETE SET NULL, -- Liên kết lô hàng khi nghiệm thu
    batch_number VARCHAR(100),                           -- Số lô do NCC bàn giao
    manufacture_date DATE,
    expiry_date DATE,
    expected_qty INT NOT NULL CHECK (expected_qty > 0),
    received_qty INT NOT NULL DEFAULT 0 CHECK (received_qty >= 0),
    over_delivery_tolerance_pct NUMERIC(5,2) DEFAULT 10.00, -- Giới hạn dung sai giao thừa (mặc định 10%)
    unit_price NUMERIC(15,2) DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'PARTIAL', 'COMPLETED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    -- Bảo vệ chặn nhập sai vượt trần dung sai over-delivery
    CONSTRAINT chk_inbound_item_over_delivery 
        CHECK (received_qty <= expected_qty * (1 + (over_delivery_tolerance_pct / 100.0)))
);

-- 8. BẢNG QUẢN LÝ ĐƠN HÀNG XUẤT KHO & PHÂN BỔ NHẶT HÀNG (OUTBOUND DOMAIN)
CREATE TABLE IF NOT EXISTS wms_outbound_order (
    id BIGSERIAL PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    warehouse_id BIGINT NOT NULL REFERENCES wms_warehouse(id) ON DELETE RESTRICT,
    customer_name VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'ALLOCATED', 'PICKED', 'DISPATCHED', 'CANCELLED')),
    created_by BIGINT NOT NULL REFERENCES wms_user(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wms_outbound_order_item (
    id BIGSERIAL PRIMARY KEY,
    outbound_order_id BIGINT NOT NULL REFERENCES wms_outbound_order(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES wms_product(id) ON DELETE RESTRICT,
    requested_qty INT NOT NULL CHECK (requested_qty > 0),
    allocated_qty INT NOT NULL DEFAULT 0 CHECK (allocated_qty >= 0),
    picked_qty INT NOT NULL DEFAULT 0 CHECK (picked_qty >= 0),
    unit_price NUMERIC(15,2) DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'ALLOCATED', 'PICKED', 'SHIPPED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_outbound_item_qty CHECK (requested_qty >= allocated_qty AND allocated_qty >= picked_qty),
    CONSTRAINT uq_outbound_item_id_product UNIQUE (id, product_id) -- Dùng cho Composite FK với Pick Allocation
);

-- Bảng phân bổ nhặt hàng (Pick Allocation): Khóa toàn vẹn 3 chiều (Order Item + Batch + Inventory)
CREATE TABLE IF NOT EXISTS wms_pick_allocation (
    id BIGSERIAL PRIMARY KEY,
    outbound_order_item_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    location_id BIGINT NOT NULL,
    batch_id BIGINT NOT NULL,
    allocated_qty INT NOT NULL CHECK (allocated_qty > 0),
    picked_qty INT NOT NULL DEFAULT 0 CHECK (picked_qty >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'ALLOCATED' 
        CHECK (status IN ('ALLOCATED', 'PICKED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    picked_at TIMESTAMPTZ,
    CONSTRAINT chk_pick_allocation_qty CHECK (allocated_qty >= picked_qty),
    -- 1. BẢO VỆ CHÍ MẠNG: Ngăn chặn 100% nhặt sai sản phẩm của dòng đơn hàng
    CONSTRAINT fk_pick_alloc_order_item_product FOREIGN KEY (outbound_order_item_id, product_id) 
        REFERENCES wms_outbound_order_item(id, product_id) ON DELETE CASCADE,
    -- 2. BẢO VỆ CHÍ MẠNG: Bắt buộc batch_id phải thuộc về đúng sản phẩm product_id
    CONSTRAINT fk_pick_alloc_batch_product FOREIGN KEY (batch_id, product_id) 
        REFERENCES wms_product_batch(id, product_id) ON DELETE RESTRICT,
    -- 3. BẢO VỆ CHÍ MẠNG: Bắt buộc (location_id, product_id, batch_id) phải thực sự tồn tại trong kho wms_inventory
    CONSTRAINT fk_pick_alloc_inventory FOREIGN KEY (location_id, product_id, batch_id) 
        REFERENCES wms_inventory(location_id, product_id, batch_id) ON DELETE RESTRICT
);

-- 9. BẢNG QUẢN LÝ ĐIỀU CHUYỂN VỊ TRÍ / CHUYỂN KHO (STOCK TRANSFER DOMAIN)
CREATE TABLE IF NOT EXISTS wms_stock_transfer (
    id BIGSERIAL PRIMARY KEY,
    transfer_code VARCHAR(50) UNIQUE NOT NULL,
    warehouse_id BIGINT NOT NULL REFERENCES wms_warehouse(id) ON DELETE RESTRICT,
    from_location_id BIGINT NOT NULL REFERENCES wms_location(id) ON DELETE RESTRICT,
    to_location_id BIGINT NOT NULL REFERENCES wms_location(id) ON DELETE RESTRICT,
    product_id BIGINT NOT NULL REFERENCES wms_product(id) ON DELETE RESTRICT,
    batch_id BIGINT NOT NULL REFERENCES wms_product_batch(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')),
    created_by BIGINT NOT NULL REFERENCES wms_user(id) ON DELETE RESTRICT,
    completed_by BIGINT REFERENCES wms_user(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    CONSTRAINT chk_transfer_diff_loc CHECK (from_location_id <> to_location_id),
    CONSTRAINT fk_transfer_batch_product FOREIGN KEY (batch_id, product_id) 
        REFERENCES wms_product_batch(id, product_id) ON DELETE RESTRICT
);

-- 10. BẢNG QUẢN LÝ KIỂM KÊ KHO (STOCK AUDIT / CYCLE COUNT)
CREATE TABLE IF NOT EXISTS wms_inventory_audit (
    id BIGSERIAL PRIMARY KEY,
    audit_code VARCHAR(50) UNIQUE NOT NULL,
    warehouse_id BIGINT NOT NULL REFERENCES wms_warehouse(id) ON DELETE RESTRICT,
    audit_type VARCHAR(30) NOT NULL DEFAULT 'CYCLE_COUNT' 
        CHECK (audit_type IN ('CYCLE_COUNT', 'FULL_AUDIT', 'SPOT_CHECK')),
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS' 
        CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'APPROVED', 'REJECTED', 'CANCELLED')),
    created_by BIGINT NOT NULL REFERENCES wms_user(id) ON DELETE RESTRICT,
    approved_by BIGINT REFERENCES wms_user(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS wms_inventory_audit_item (
    id BIGSERIAL PRIMARY KEY,
    audit_id BIGINT NOT NULL REFERENCES wms_inventory_audit(id) ON DELETE CASCADE,
    location_id BIGINT NOT NULL REFERENCES wms_location(id) ON DELETE RESTRICT,
    product_id BIGINT NOT NULL REFERENCES wms_product(id) ON DELETE RESTRICT,
    batch_id BIGINT NOT NULL REFERENCES wms_product_batch(id) ON DELETE RESTRICT,
    system_qty INT NOT NULL,                             -- Tồn hệ thống tại thời điểm chốt sổ
    counted_qty INT,                                     -- Đếm mù, NULL khi mới tạo phiếu
    difference_qty INT GENERATED ALWAYS AS (
        CASE WHEN counted_qty IS NULL THEN NULL ELSE counted_qty - system_qty END
    ) STORED,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'MATCHED', 'DISCREPANCY', 'ADJUSTED')),
    counter_notes TEXT,
    counted_at TIMESTAMPTZ,
    CONSTRAINT fk_audit_item_batch_product FOREIGN KEY (batch_id, product_id) 
        REFERENCES wms_product_batch(id, product_id) ON DELETE RESTRICT
);

-- 11. BẢNG THEO DÕI JOB BÁO CÁO NẶNG (REPORT JOBS)
CREATE TABLE IF NOT EXISTS wms_report_job (
    id UUID PRIMARY KEY,
    report_name VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    download_url TEXT,
    error_message TEXT,
    created_by BIGINT REFERENCES wms_user(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

-- 12. BẢNG TRANSACTIONAL OUTBOX & PROCESSED EVENTS (RABBITMQ RELIABILITY & IDEMPOTENCY)
CREATE TABLE IF NOT EXISTS wms_outbox_event (
    id UUID PRIMARY KEY,
    aggregate_type VARCHAR(50) NOT NULL,                 -- REPORT_JOB, INVENTORY, ORDER, TRANSFER
    aggregate_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'PUBLISHED', 'FAILED')),
    retry_count INT DEFAULT 0,
    locked_at TIMESTAMPTZ,                               -- Chống cạnh tranh giữa các instance Outbox Worker
    locked_by VARCHAR(100),
    next_retry_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Exponential Backoff cho retry
    last_error TEXT,                                     -- Lưu vết stacktrace lỗi khi publish thất bại
    idempotency_key VARCHAR(100) UNIQUE,                 -- Khóa chống sinh trùng lặp sự kiện
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMPTZ
);

-- Bảng lưu vết sự kiện đã xử lý thành công ở Consumer (Inbox Pattern / Exactly-Once processing)
CREATE TABLE IF NOT EXISTS wms_processed_event (
    event_id UUID PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- 13. POSTGRESQL TRIGGERS & FUNCTIONS BẢO VỆ TÍNH TOÀN VẸN
-- ==========================================================

-- Trigger Function: Tự động cập nhật cột updated_at trước mỗi lệnh UPDATE
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_updated_at BEFORE UPDATE ON wms_user FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_warehouse_updated_at BEFORE UPDATE ON wms_warehouse FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_location_updated_at BEFORE UPDATE ON wms_location FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_category_updated_at BEFORE UPDATE ON wms_category FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_supplier_updated_at BEFORE UPDATE ON wms_supplier FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_product_updated_at BEFORE UPDATE ON wms_product FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_product_batch_updated_at BEFORE UPDATE ON wms_product_batch FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_supplier_product_updated_at BEFORE UPDATE ON wms_supplier_product FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_inbound_order_updated_at BEFORE UPDATE ON wms_inbound_order FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_outbound_order_updated_at BEFORE UPDATE ON wms_outbound_order FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- Trigger Function: Bảo vệ Sổ cái Bất biến (Immutable Ledger) - Cấm UPDATE và DELETE
CREATE OR REPLACE FUNCTION trg_stock_ledger_prevent_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'BẢO VỆ TOÀN VẸN: wms_stock_ledger là Sổ Cái Bất Biến (Immutable Ledger), nghiêm cấm thao tác UPDATE hoặc DELETE!';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_wms_stock_ledger_immutable ON wms_stock_ledger;
CREATE TRIGGER trg_wms_stock_ledger_immutable
BEFORE UPDATE OR DELETE ON wms_stock_ledger
FOR EACH ROW EXECUTE FUNCTION trg_stock_ledger_prevent_modification();

-- Trigger Function: Bảo vệ toàn vẹn số dư Sổ cái (Ledger balance_after) khớp với wms_inventory
CREATE OR REPLACE FUNCTION trg_validate_stock_ledger_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_current_stock INT;
BEGIN
    SELECT on_hand_qty INTO v_current_stock
    FROM wms_inventory
    WHERE location_id = NEW.location_id 
      AND product_id = NEW.product_id 
      AND batch_id = NEW.batch_id;

    IF v_current_stock IS NULL THEN
        v_current_stock := 0;
    END IF;

    IF NEW.balance_after <> v_current_stock THEN
        RAISE EXCEPTION 'TOÀN VẸN SỔ CÁI BỊ VI PHẠM: balance_after (%) không khớp với số dư tồn kho thực tế (%) tại vị trí %!',
            NEW.balance_after, v_current_stock, NEW.location_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_wms_stock_ledger_balance_check ON wms_stock_ledger;
CREATE TRIGGER trg_wms_stock_ledger_balance_check
BEFORE INSERT ON wms_stock_ledger
FOR EACH ROW EXECUTE FUNCTION trg_validate_stock_ledger_balance();

-- Trigger Function: Đồng bộ tự động allocated_qty trên dòng đơn xuất khi có thay đổi ở Pick Allocation
CREATE OR REPLACE FUNCTION trg_sync_outbound_allocated_qty()
RETURNS TRIGGER AS $$
DECLARE
    v_item_id BIGINT;
BEGIN
    v_item_id := COALESCE(NEW.outbound_order_item_id, OLD.outbound_order_item_id);
    
    UPDATE wms_outbound_order_item
    SET allocated_qty = (
        SELECT COALESCE(SUM(allocated_qty), 0)
        FROM wms_pick_allocation
        WHERE outbound_order_item_id = v_item_id
          AND status IN ('ALLOCATED', 'PICKED')
    )
    WHERE id = v_item_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_wms_pick_alloc_sync_allocated_qty ON wms_pick_allocation;
CREATE TRIGGER trg_wms_pick_alloc_sync_allocated_qty
AFTER INSERT OR UPDATE OR DELETE ON wms_pick_allocation
FOR EACH ROW EXECUTE FUNCTION trg_sync_outbound_allocated_qty();

-- Trigger Function: Bảo vệ toàn vẹn kho chéo (Cross-Warehouse Integrity) cho Kiểm kê
CREATE OR REPLACE FUNCTION trg_check_audit_item_warehouse()
RETURNS TRIGGER AS $$
DECLARE
    v_audit_wh BIGINT;
    v_loc_wh   BIGINT;
BEGIN
    SELECT warehouse_id INTO v_audit_wh FROM wms_inventory_audit WHERE id = NEW.audit_id;
    SELECT warehouse_id INTO v_loc_wh   FROM wms_location WHERE id = NEW.location_id;
    
    IF v_audit_wh <> v_loc_wh THEN
        RAISE EXCEPTION 'VI PHẠM TOÀN VẸN KHO: Vị trí (id: %) thuộc Kho ID %, không thuộc Kho ID % của Phiếu kiểm kê (id: %)!',
            NEW.location_id, v_loc_wh, v_audit_wh, NEW.audit_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_wms_audit_item_warehouse_check ON wms_inventory_audit_item;
CREATE TRIGGER trg_wms_audit_item_warehouse_check
BEFORE INSERT OR UPDATE ON wms_inventory_audit_item
FOR EACH ROW EXECUTE FUNCTION trg_check_audit_item_warehouse();

-- ==========================================================
-- 14. TỐI ƯU CHỈ MỤC TRUY VẤN (INDEXING STRATEGY)
-- ==========================================================

-- Index hỗ trợ tìm kiếm tồn kho theo mặt hàng và vị trí
CREATE INDEX IF NOT EXISTS idx_inv_product_loc ON wms_inventory(product_id, location_id);

-- Partial Index hỗ trợ thuật toán FEFO: Lọc trước các lô hàng ACTIVE sắp xếp theo hạn sử dụng,
-- giúp truy vấn tìm kiếm lô xuất kho đạt độ phức tạp O(log N) và tránh quét toàn bộ bảng (Table Scan).
CREATE INDEX IF NOT EXISTS idx_batch_fefo_active 
ON wms_product_batch(product_id, expiry_date ASC NULLS LAST) 
WHERE status = 'ACTIVE';

-- Index Sổ cái Bất biến (Stock Ledger)
CREATE INDEX IF NOT EXISTS idx_ledger_product_loc ON wms_stock_ledger(product_id, location_id);
CREATE INDEX IF NOT EXISTS idx_ledger_ref_code ON wms_stock_ledger(reference_code);
CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON wms_stock_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_batch ON wms_stock_ledger(batch_id);

-- Index chi tiết đơn hàng & phân bổ nhặt hàng
CREATE INDEX IF NOT EXISTS idx_inbound_item_order ON wms_inbound_order_item(inbound_order_id);
CREATE INDEX IF NOT EXISTS idx_inbound_item_product ON wms_inbound_order_item(product_id);
CREATE INDEX IF NOT EXISTS idx_outbound_item_order ON wms_outbound_order_item(outbound_order_id);
CREATE INDEX IF NOT EXISTS idx_outbound_item_product ON wms_outbound_order_item(product_id);

CREATE INDEX IF NOT EXISTS idx_pick_alloc_item ON wms_pick_allocation(outbound_order_item_id);
CREATE INDEX IF NOT EXISTS idx_pick_alloc_loc_batch ON wms_pick_allocation(location_id, batch_id);
CREATE INDEX IF NOT EXISTS idx_pick_alloc_prod_batch ON wms_pick_allocation(product_id, batch_id);

-- Index điều chuyển kho & kiểm kê
CREATE INDEX IF NOT EXISTS idx_transfer_wh_status ON wms_stock_transfer(warehouse_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_item_audit ON wms_inventory_audit_item(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_item_loc_prod ON wms_inventory_audit_item(location_id, product_id);

-- Index cho Transactional Outbox Worker polling
CREATE INDEX IF NOT EXISTS idx_outbox_status_retry ON wms_outbox_event(status, next_retry_at) 
WHERE status IN ('PENDING', 'FAILED');
