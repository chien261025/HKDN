-- =============================================================================
-- 01-init-db.sql
-- Minimal MySQL 8 container bootstrap.
-- All schema DDL, views, triggers, AI user & seeds are managed by Flyway
-- in backend/src/main/resources/db/migration (V1..V4).
-- =============================================================================

CREATE DATABASE IF NOT EXISTS wms_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

