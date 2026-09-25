-- Smart WMS Enterprise: Multi-Device Session Management (Shopee/Google Standard)
CREATE TABLE IF NOT EXISTS wms_user_session (
    id VARCHAR(36) PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES wms_user(id) ON DELETE CASCADE,
    device_name VARCHAR(100) NOT NULL,
    device_type VARCHAR(30) NOT NULL,
    ip_address VARCHAR(50) NOT NULL,
    location_name VARCHAR(150) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_reason VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_user_session_user_id ON wms_user_session(user_id);
CREATE INDEX IF NOT EXISTS idx_user_session_active ON wms_user_session(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_session_token ON wms_user_session(token_hash);
