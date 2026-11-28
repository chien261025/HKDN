-- =============================================================================
-- V1__init_schema.sql
-- Consolidated Enterprise Smart WMS Schema (MySQL 8.0 / InnoDB / utf8mb4)
-- 31 tables in strict FK topological order (zero circular dependency hacks).
-- Validated against JPA entities via spring.jpa.hibernate.ddl-auto=validate.
-- =============================================================================

SET NAMES utf8mb4;

-- -----------------------------------------------------------------------------
-- 1. CORE IDENTITY, RBAC & SESSIONS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `wms_role` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wms_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wms_role_permission` (
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `fk_rp_permission` (`permission_id`),
  CONSTRAINT `fk_rp_permission` FOREIGN KEY (`permission_id`) REFERENCES `wms_permission` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rp_role` FOREIGN KEY (`role_id`) REFERENCES `wms_role` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wms_user` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `expires_at` datetime(6) DEFAULT NULL,
  `must_change_password` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wms_user_role` (
  `user_id` bigint NOT NULL,
  `role_id` int NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `fk_user_role_role` (`role_id`),
  CONSTRAINT `fk_user_role_role` FOREIGN KEY (`role_id`) REFERENCES `wms_role` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_role_user` FOREIGN KEY (`user_id`) REFERENCES `wms_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wms_user_session` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL,
  `device_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `last_active_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `revoked_reason` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_session_user_id` (`user_id`),
  KEY `idx_user_session_active` (`user_id`,`is_active`),
  KEY `idx_user_session_token` (`token_hash`),
  CONSTRAINT `fk_user_session_user` FOREIGN KEY (`user_id`) REFERENCES `wms_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. WAREHOUSE TOPOLOGY, LOCATIONS & SECURITY AUDIT
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `wms_warehouse` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trusted_ips` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wms_user_warehouse_access` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `warehouse_id` bigint NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_warehouse` (`user_id`,`warehouse_id`),
  KEY `fk_uwa_warehouse` (`warehouse_id`),
  CONSTRAINT `fk_uwa_user` FOREIGN KEY (`user_id`) REFERENCES `wms_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_uwa_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `wms_warehouse` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wms_location` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `warehouse_id` bigint NOT NULL,
  `zone_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `aisle` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rack` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shelf` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bin` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bin_barcode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `max_weight_kg` decimal(38,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `bin_barcode` (`bin_barcode`),
  UNIQUE KEY `uq_location_coords` (`warehouse_id`,`zone_code`,`aisle`,`rack`,`shelf`,`bin`),
  CONSTRAINT `fk_location_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `wms_warehouse` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wms_audit_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER',
  `target_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. MASTER DATA (CATEGORIES, SUPPLIERS, PRODUCTS & BATCHES)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `wms_category` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` bigint DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deleted_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `fk_category_parent` (`parent_id`),
  CONSTRAINT `fk_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `wms_category` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wms_supplier` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `contact_person` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wms_supplier_category` (
  `supplier_id` bigint NOT NULL,
  `category_id` bigint NOT NULL,
  PRIMARY KEY (`supplier_id`,`category_id`),
  KEY `fk_supcat_category` (`category_id`),
  CONSTRAINT `fk_supcat_category` FOREIGN KEY (`category_id`) REFERENCES `wms_category` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_supcat_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `wms_supplier` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wms_product` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sku` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `barcode` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_id` bigint DEFAULT NULL,
  `unit` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `origin` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_url` longtext COLLATE utf8mb4_unicode_ci,
  `storage_condition` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'AMBIENT',
  `weight_kg` decimal(10,2) DEFAULT '1.00',
  `length_cm` decimal(10,2) DEFAULT '20.00',
  `width_cm` decimal(10,2) DEFAULT '15.00',
  `height_cm` decimal(10,2) DEFAULT '10.00',
  `safety_stock` int DEFAULT '10',
  `reorder_point` int DEFAULT '20',
  `max_stock` int DEFAULT '500',
  `purchase_price` decimal(15,2) DEFAULT '0.00',
  `selling_price` decimal(15,2) DEFAULT '0.00',
  `business_status` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE',
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `supplier_id` bigint DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `deleted_at` datetime(6) DEFAULT NULL,
  `is_batch_managed` tinyint(1) DEFAULT '1',
  `is_expiry_managed` tinyint(1) DEFAULT '1',
  `shelf_life_days` int DEFAULT '365',
  `outbound_strategy` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'FEFO',
  `packaging_unit` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT 'ThÃ¹ng',
  `conversion_rate` int DEFAULT '24',
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  UNIQUE KEY `barcode` (`barcode`),
  KEY `fk_product_category` (`category_id`),
  KEY `fk_product_supplier` (`supplier_id`),
  CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `wms_category` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_product_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `wms_supplier` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wms_product_batch` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_id` bigint NOT NULL,
  `batch_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `manufacture_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `supplier_id` bigint DEFAULT NULL,
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_product_batch` (`product_id`,`batch_number`),
  UNIQUE KEY `uq_product_batch_id_product` (`id`,`product_id`),
  KEY `fk_batch_supplier` (`supplier_id`),
  KEY `idx_batch_fefo_active` (`product_id`,`expiry_date`,`status`),
  CONSTRAINT `fk_batch_product` FOREIGN KEY (`product_id`) REFERENCES `wms_product` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_batch_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `wms_supplier` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. CORE INVENTORY & APPEND-ONLY STOCK LEDGER
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `wms_inventory` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `location_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `batch_id` bigint NOT NULL,
  `on_hand_qty` int NOT NULL DEFAULT '0',
  `reserved_qty` int NOT NULL DEFAULT '0',
  `version` bigint NOT NULL DEFAULT '0',
  `last_updated_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inventory_loc_batch` (`location_id`,`product_id`,`batch_id`),
  KEY `fk_inventory_batch_product` (`batch_id`,`product_id`),
  KEY `idx_inv_product_loc` (`product_id`,`location_id`),
  CONSTRAINT `fk_inventory_batch` FOREIGN KEY (`batch_id`) REFERENCES `wms_product_batch` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_inventory_batch_product` FOREIGN KEY (`batch_id`, `product_id`) REFERENCES `wms_product_batch` (`id`, `product_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_inventory_location` FOREIGN KEY (`location_id`) REFERENCES `wms_location` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_inventory_product` FOREIGN KEY (`product_id`) REFERENCES `wms_product` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_inventory_qty` CHECK (((`on_hand_qty` >= `reserved_qty`) and (`reserved_qty` >= 0)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wms_stock_ledger` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `transaction_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `batch_id` bigint NOT NULL,
  `qty_change` int NOT NULL,
  `balance_after` int NOT NULL,
  `performed_by` bigint NOT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `fk_ledger_location` (`location_id`),
  KEY `fk_ledger_user` (`performed_by`),
  KEY `fk_ledger_batch_product` (`batch_id`,`product_id`),
  KEY `idx_ledger_product_loc` (`product_id`,`location_id`),
  KEY `idx_ledger_ref_code` (`reference_code`),
  KEY `idx_ledger_created_at` (`created_at` DESC),
  KEY `idx_ledger_batch` (`batch_id`),
  CONSTRAINT `fk_ledger_batch` FOREIGN KEY (`batch_id`) REFERENCES `wms_product_batch` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ledger_batch_product` FOREIGN KEY (`batch_id`, `product_id`) REFERENCES `wms_product_batch` (`id`, `product_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ledger_location` FOREIGN KEY (`location_id`) REFERENCES `wms_location` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ledger_product` FOREIGN KEY (`product_id`) REFERENCES `wms_product` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ledger_user` FOREIGN KEY (`performed_by`) REFERENCES `wms_user` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. INBOUND RECEIVING, QC & PUTAWAY
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `wms_inbound_order` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `warehouse_id` bigint NOT NULL,
  `supplier_id` bigint DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `created_by` bigint NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_code` (`order_code`),
  KEY `fk_inbound_warehouse` (`warehouse_id`),
  KEY `fk_inbound_supplier` (`supplier_id`),
  KEY `fk_inbound_user` (`created_by`),
  CONSTRAINT `fk_inbound_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `wms_supplier` (`id`),
  CONSTRAINT `fk_inbound_user` FOREIGN KEY (`created_by`) REFERENCES `wms_user` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_inbound_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `wms_warehouse` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wms_inbound_order_item` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `inbound_order_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `product_batch_id` bigint DEFAULT NULL,
  `batch_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manufacture_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `expected_qty` int NOT NULL,
  `received_qty` int NOT NULL DEFAULT '0',
  `over_delivery_tolerance_pct` decimal(5,2) DEFAULT '10.00',
  `unit_price` decimal(15,2) DEFAULT '0.00',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `rejected_qty` int NOT NULL DEFAULT '0',
  `stocked_qty` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_inbound_item_batch` (`product_batch_id`),
  KEY `idx_inbound_item_order` (`inbound_order_id`),
  KEY `idx_inbound_item_product` (`product_id`),
  CONSTRAINT `fk_inbound_item_batch` FOREIGN KEY (`product_batch_id`) REFERENCES `wms_product_batch` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_inbound_item_order` FOREIGN KEY (`inbound_order_id`) REFERENCES `wms_inbound_order` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inbound_item_product` FOREIGN KEY (`product_id`) REFERENCES `wms_product` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_inbound_item_over_delivery` CHECK (((`received_qty` - `rejected_qty`) <= (`expected_qty` * (1 + (`over_delivery_tolerance_pct` / 100.0))))),
  CONSTRAINT `chk_inbound_qc` CHECK (((`rejected_qty` >= 0) and (`stocked_qty` >= 0) and (`stocked_qty` <= (`received_qty` - `rejected_qty`)))),
  CONSTRAINT `wms_inbound_order_item_chk_1` CHECK ((`expected_qty` > 0)),
  CONSTRAINT `wms_inbound_order_item_chk_2` CHECK ((`received_qty` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. OUTBOUND ORDERS, FEFO ALLOCATION & PICKING
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `wms_outbound_order` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `warehouse_id` bigint NOT NULL,
  `customer_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `created_by` bigint NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_code` (`order_code`),
  KEY `fk_outbound_warehouse` (`warehouse_id`),
  KEY `fk_outbound_user` (`created_by`),
  CONSTRAINT `fk_outbound_user` FOREIGN KEY (`created_by`) REFERENCES `wms_user` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_outbound_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `wms_warehouse` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wms_outbound_order_item` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `outbound_order_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `requested_qty` int NOT NULL,
  `allocated_qty` int NOT NULL DEFAULT '0',
  `picked_qty` int NOT NULL DEFAULT '0',
  `unit_price` decimal(15,2) DEFAULT '0.00',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_outbound_item_id_product` (`id`,`product_id`),
  KEY `idx_outbound_item_order` (`outbound_order_id`),
  KEY `idx_outbound_item_product` (`product_id`),
  CONSTRAINT `fk_outbound_item_order` FOREIGN KEY (`outbound_order_id`) REFERENCES `wms_outbound_order` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_outbound_item_product` FOREIGN KEY (`product_id`) REFERENCES `wms_product` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_outbound_item_qty` CHECK (((`requested_qty` >= `allocated_qty`) and (`allocated_qty` >= `picked_qty`))),
  CONSTRAINT `wms_outbound_order_item_chk_1` CHECK ((`requested_qty` > 0)),
  CONSTRAINT `wms_outbound_order_item_chk_2` CHECK ((`allocated_qty` >= 0)),
  CONSTRAINT `wms_outbound_order_item_chk_3` CHECK ((`picked_qty` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wms_pick_allocation` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `outbound_order_item_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `location_id` bigint NOT NULL,
  `batch_id` bigint NOT NULL,
  `allocated_qty` int NOT NULL,
  `picked_qty` int NOT NULL DEFAULT '0',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ALLOCATED',
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `picked_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_pick_alloc_order_item_product` (`outbound_order_item_id`,`product_id`),
  KEY `fk_pick_alloc_batch_product` (`batch_id`,`product_id`),
  KEY `fk_pick_alloc_inventory` (`location_id`,`product_id`,`batch_id`),
  KEY `idx_pick_alloc_item` (`outbound_order_item_id`),
  KEY `idx_pick_alloc_loc_batch` (`location_id`,`batch_id`),
  KEY `idx_pick_alloc_prod_batch` (`product_id`,`batch_id`),
  CONSTRAINT `fk_pick_alloc_batch_product` FOREIGN KEY (`batch_id`, `product_id`) REFERENCES `wms_product_batch` (`id`, `product_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_pick_alloc_inventory` FOREIGN KEY (`location_id`, `product_id`, `batch_id`) REFERENCES `wms_inventory` (`location_id`, `product_id`, `batch_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_pick_alloc_order_item_product` FOREIGN KEY (`outbound_order_item_id`, `product_id`) REFERENCES `wms_outbound_order_item` (`id`, `product_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_pick_allocation_qty` CHECK ((`allocated_qty` >= `picked_qty`)),
  CONSTRAINT `wms_pick_allocation_chk_1` CHECK ((`allocated_qty` > 0)),
  CONSTRAINT `wms_pick_allocation_chk_2` CHECK ((`picked_qty` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wms_stock_reservation` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `outbound_order_id` bigint NOT NULL,
  `outbound_order_item_id` bigint NOT NULL,
  `location_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `batch_id` bigint NOT NULL,
  `reserved_qty` int NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RESERVED',
  `expires_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `fk_reservation_item` (`outbound_order_item_id`),
  KEY `fk_reservation_inventory` (`location_id`,`product_id`,`batch_id`),
  KEY `idx_reservation_order` (`outbound_order_id`),
  KEY `idx_reservation_loc_batch` (`location_id`,`batch_id`),
  CONSTRAINT `fk_reservation_inventory` FOREIGN KEY (`location_id`, `product_id`, `batch_id`) REFERENCES `wms_inventory` (`location_id`, `product_id`, `batch_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_reservation_item` FOREIGN KEY (`outbound_order_item_id`) REFERENCES `wms_outbound_order_item` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reservation_order` FOREIGN KEY (`outbound_order_id`) REFERENCES `wms_outbound_order` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wms_stock_reservation_chk_1` CHECK ((`reserved_qty` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. INTERNAL TRANSFERS, CYCLE COUNTING & ADJUSTMENTS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `wms_stock_transfer` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `transfer_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `warehouse_id` bigint NOT NULL,
  `from_location_id` bigint NOT NULL,
  `to_location_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `batch_id` bigint NOT NULL,
  `quantity` int NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `created_by` bigint NOT NULL,
  `completed_by` bigint DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `completed_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transfer_code` (`transfer_code`),
  KEY `fk_transfer_from_loc` (`from_location_id`),
  KEY `fk_transfer_to_loc` (`to_location_id`),
  KEY `fk_transfer_product` (`product_id`),
  KEY `fk_transfer_batch_product` (`batch_id`,`product_id`),
  KEY `fk_transfer_creator` (`created_by`),
  KEY `fk_transfer_completer` (`completed_by`),
  KEY `idx_transfer_wh_status` (`warehouse_id`,`status`),
  CONSTRAINT `fk_transfer_batch` FOREIGN KEY (`batch_id`) REFERENCES `wms_product_batch` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_transfer_batch_product` FOREIGN KEY (`batch_id`, `product_id`) REFERENCES `wms_product_batch` (`id`, `product_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_transfer_completer` FOREIGN KEY (`completed_by`) REFERENCES `wms_user` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_transfer_creator` FOREIGN KEY (`created_by`) REFERENCES `wms_user` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_transfer_from_loc` FOREIGN KEY (`from_location_id`) REFERENCES `wms_location` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_transfer_product` FOREIGN KEY (`product_id`) REFERENCES `wms_product` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_transfer_to_loc` FOREIGN KEY (`to_location_id`) REFERENCES `wms_location` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_transfer_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `wms_warehouse` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_transfer_diff_loc` CHECK ((`from_location_id` <> `to_location_id`)),
  CONSTRAINT `wms_stock_transfer_chk_1` CHECK ((`quantity` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wms_inventory_audit` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `audit_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `warehouse_id` bigint NOT NULL,
  `audit_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CYCLE_COUNT',
  `scope_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ALL',
  `scope_value` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_blind_count` tinyint(1) NOT NULL DEFAULT '1',
  `is_independent_verification_required` tinyint(1) NOT NULL DEFAULT '1',
  `include_empty_bins` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'IN_PROGRESS',
  `created_by` bigint NOT NULL,
  `assigned_operator_id` bigint DEFAULT NULL,
  `approved_by` bigint DEFAULT NULL,
  `adjustment_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `completed_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `audit_code` (`audit_code`),
  KEY `fk_audit_warehouse` (`warehouse_id`),
  KEY `fk_audit_creator` (`created_by`),
  KEY `fk_audit_approver` (`approved_by`),
  CONSTRAINT `fk_audit_approver` FOREIGN KEY (`approved_by`) REFERENCES `wms_user` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_audit_creator` FOREIGN KEY (`created_by`) REFERENCES `wms_user` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_audit_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `wms_warehouse` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wms_inventory_audit_item` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `audit_id` bigint NOT NULL,
  `location_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `batch_id` bigint NOT NULL,
  `system_qty` int NOT NULL,
  `counted_qty` int DEFAULT NULL,
  `first_count_qty` int DEFAULT NULL,
  `second_count_qty` int DEFAULT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT '0',
  `recounted_by` bigint DEFAULT NULL,
  `difference_qty` int GENERATED ALWAYS AS ((case when (`counted_qty` is null) then NULL else (`counted_qty` - `system_qty`) end)) STORED,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `counter_notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `counted_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_audit_item_product` (`product_id`),
  KEY `fk_audit_item_batch_product` (`batch_id`,`product_id`),
  KEY `fk_audit_item_inventory` (`location_id`,`product_id`,`batch_id`),
  KEY `idx_audit_item_audit` (`audit_id`),
  KEY `idx_audit_item_loc_prod` (`location_id`,`product_id`),
  CONSTRAINT `fk_audit_item_audit` FOREIGN KEY (`audit_id`) REFERENCES `wms_inventory_audit` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_audit_item_batch` FOREIGN KEY (`batch_id`) REFERENCES `wms_product_batch` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_audit_item_batch_product` FOREIGN KEY (`batch_id`, `product_id`) REFERENCES `wms_product_batch` (`id`, `product_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_audit_item_location` FOREIGN KEY (`location_id`) REFERENCES `wms_location` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_audit_item_product` FOREIGN KEY (`product_id`) REFERENCES `wms_product` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wms_stock_adjustment` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `adjustment_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `audit_id` bigint DEFAULT NULL,
  `warehouse_id` bigint NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `created_by` bigint NOT NULL,
  `approved_by` bigint DEFAULT NULL,
  `approved_at` datetime(6) DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `adjustment_code` (`adjustment_code`),
  KEY `fk_adj_warehouse` (`warehouse_id`),
  KEY `fk_adj_creator` (`created_by`),
  KEY `fk_adj_approver` (`approved_by`),
  KEY `idx_adj_audit` (`audit_id`),
  CONSTRAINT `fk_adj_approver` FOREIGN KEY (`approved_by`) REFERENCES `wms_user` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_adj_audit` FOREIGN KEY (`audit_id`) REFERENCES `wms_inventory_audit` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_adj_creator` FOREIGN KEY (`created_by`) REFERENCES `wms_user` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_adj_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `wms_warehouse` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wms_stock_adjustment_item` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `adjustment_id` bigint NOT NULL,
  `location_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `batch_id` bigint NOT NULL,
  `system_qty` int NOT NULL,
  `actual_qty` int NOT NULL,
  `adjusted_qty` int GENERATED ALWAYS AS ((`actual_qty` - `system_qty`)) STORED,
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `fk_adj_item_inventory` (`location_id`,`product_id`,`batch_id`),
  KEY `idx_adj_item_adj` (`adjustment_id`),
  CONSTRAINT `fk_adj_item_adjustment` FOREIGN KEY (`adjustment_id`) REFERENCES `wms_stock_adjustment` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_adj_item_inventory` FOREIGN KEY (`location_id`, `product_id`, `batch_id`) REFERENCES `wms_inventory` (`location_id`, `product_id`, `batch_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wms_report_job` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `download_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `error_message` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `completed_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_report_job_user` (`created_by`),
  CONSTRAINT `fk_report_job_user` FOREIGN KEY (`created_by`) REFERENCES `wms_user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wms_outbox_event` (
  `id` binary(16) NOT NULL,
  `aggregate_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `aggregate_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` json NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `retry_count` int DEFAULT '0',
  `locked_at` datetime(6) DEFAULT NULL,
  `locked_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `next_retry_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `last_error` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `idempotency_key` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `published_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idempotency_key` (`idempotency_key`),
  KEY `idx_outbox_status_retry` (`status`,`next_retry_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wms_processed_event` (
  `event_id` binary(16) NOT NULL,
  `event_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `processed_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
