-- =====================================================================
-- KENAYA LOGISTIC - EXPORT BASE DE DONNÉES CLOUD DE PRODUCTION
-- Compatible MySQL 8.0, TiDB Cloud, Aiven, Clever Cloud, PlanetScale
-- Date d'export : 2026-10-29T15:12:44.218Z
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Structure de la table `audit_logs`
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `user_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_role` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` int DEFAULT NULL,
  `details` json DEFAULT NULL,
  `ip_address` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_module` (`module`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_created` (`created_at`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Données de la table `audit_logs` (5 lignes)
INSERT INTO `audit_logs` (`id`, `user_id`, `user_name`, `user_role`, `action`, `module`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES (1, NULL, 'Système Migration', 'admin', 'INITIALIZE_RBAC_PERMISSIONS', 'users', NULL, NULL, '{"message":"Initialisation de la table permissions et des comptes secrétaires."}', NULL, '2026-10-29 14:21:55');
INSERT INTO `audit_logs` (`id`, `user_id`, `user_name`, `user_role`, `action`, `module`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES (2, 5, 'Grace Ondaye (Secrétaire Principale)', 'secretary', 'USER_LOGIN', 'auth', NULL, NULL, '{"userAgent":"Unknown"}', '::1', '2026-10-29 14:26:30');
INSERT INTO `audit_logs` (`id`, `user_id`, `user_name`, `user_role`, `action`, `module`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES (3, 1, 'Dieudonné Massamba (DG)', 'admin', 'USER_LOGIN', 'auth', NULL, NULL, '{"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0"}', '::1', '2026-10-29 14:40:55');
INSERT INTO `audit_logs` (`id`, `user_id`, `user_name`, `user_role`, `action`, `module`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES (4, 1, 'Dieudonné Massamba (DG)', 'admin', 'USER_LOGIN', 'auth', NULL, NULL, '{"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0"}', '::1', '2026-10-29 14:56:10');
INSERT INTO `audit_logs` (`id`, `user_id`, `user_name`, `user_role`, `action`, `module`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES (5, NULL, 'Système Nettoyage', 'admin', 'PURGE_TEST_DATA', 'system', NULL, NULL, '{"message":"Vidage des données de test avant livraison client."}', NULL, '2026-10-29 15:12:32');

-- Structure de la table `cargo_items`
DROP TABLE IF EXISTS `cargo_items`;
CREATE TABLE `cargo_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `shipment_id` int DEFAULT NULL,
  `client_id` int NOT NULL,
  `designation` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'Marchandises Générales',
  `quantity` int NOT NULL DEFAULT '1',
  `unit` varchar(50) NOT NULL DEFAULT 'Colis',
  `weight_kg` decimal(10,2) NOT NULL DEFAULT '0.00',
  `volume_cbm` decimal(10,2) NOT NULL DEFAULT '0.00',
  `declared_value` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` varchar(50) NOT NULL DEFAULT 'enregistrée',
  `barcode` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `shipment_id` (`shipment_id`),
  KEY `client_id` (`client_id`),
  CONSTRAINT `cargo_items_ibfk_1` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `cargo_items_ibfk_2` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Structure de la table `clients`
DROP TABLE IF EXISTS `clients`;
CREATE TABLE `clients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(100) NOT NULL DEFAULT 'Brazzaville',
  `id_number` varchar(50) DEFAULT NULL,
  `notes` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Structure de la table `expenses`
DROP TABLE IF EXISTS `expenses`;
CREATE TABLE `expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `shipment_id` int DEFAULT NULL,
  `vehicle_id` int DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'Carburant',
  `amount` decimal(12,2) NOT NULL,
  `expense_date` date NOT NULL,
  `paid_to` varchar(150) DEFAULT NULL,
  `payment_method` varchar(50) NOT NULL DEFAULT 'Espèces',
  `recorded_by` int DEFAULT NULL,
  `notes` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `shipment_id` (`shipment_id`),
  KEY `fk_expense_vehicle` (`vehicle_id`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_expense_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Structure de la table `invoices`
DROP TABLE IF EXISTS `invoices`;
CREATE TABLE `invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(50) NOT NULL,
  `shipment_id` int DEFAULT NULL,
  `rental_id` int DEFAULT NULL,
  `client_id` int NOT NULL,
  `issue_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `tax_rate` decimal(5,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `paid_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` varchar(30) NOT NULL DEFAULT 'unpaid',
  `notes` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `shipment_id` (`shipment_id`),
  KEY `client_id` (`client_id`),
  KEY `fk_invoice_rental` (`rental_id`),
  CONSTRAINT `fk_invoice_rental` FOREIGN KEY (`rental_id`) REFERENCES `rentals` (`id`) ON DELETE SET NULL,
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Structure de la table `payments`
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `shipment_id` int DEFAULT NULL,
  `rental_id` int DEFAULT NULL,
  `client_id` int NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` varchar(50) NOT NULL DEFAULT 'Espèces',
  `reference` varchar(100) DEFAULT NULL,
  `payment_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `recorded_by` int DEFAULT NULL,
  `notes` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `shipment_id` (`shipment_id`),
  KEY `client_id` (`client_id`),
  KEY `fk_payment_rental` (`rental_id`),
  CONSTRAINT `fk_payment_rental` FOREIGN KEY (`rental_id`) REFERENCES `rentals` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Structure de la table `permissions`
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `module` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `can_view` tinyint(1) DEFAULT '0',
  `can_create` tinyint(1) DEFAULT '0',
  `can_edit` tinyint(1) DEFAULT '0',
  `can_delete` tinyint(1) DEFAULT '0',
  `can_validate` tinyint(1) DEFAULT '0',
  `can_export` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_module` (`user_id`,`module`),
  CONSTRAINT `permissions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=85 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Données de la table `permissions` (84 lignes)
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (1, 1, 'dashboard', 1, 1, 1, 1, 1, 1, '2026-10-29 14:21:43', '2026-10-29 14:21:43');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (2, 1, 'cargo', 1, 1, 1, 1, 1, 1, '2026-10-29 14:21:44', '2026-10-29 14:21:44');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (3, 1, 'clients', 1, 1, 1, 1, 1, 1, '2026-10-29 14:21:44', '2026-10-29 14:21:44');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (4, 1, 'shipments', 1, 1, 1, 1, 1, 1, '2026-10-29 14:21:44', '2026-10-29 14:21:44');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (5, 1, 'tracking', 1, 1, 1, 1, 1, 1, '2026-10-29 14:21:44', '2026-10-29 14:21:44');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (6, 1, 'finances', 1, 1, 1, 1, 1, 1, '2026-10-29 14:21:45', '2026-10-29 14:21:45');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (7, 1, 'invoices', 1, 1, 1, 1, 1, 1, '2026-10-29 14:21:45', '2026-10-29 14:21:45');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (8, 1, 'reports', 1, 1, 1, 1, 1, 1, '2026-10-29 14:21:45', '2026-10-29 14:21:45');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (9, 1, 'users', 1, 1, 1, 1, 1, 1, '2026-10-29 14:21:45', '2026-10-29 14:21:45');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (10, 1, 'rentals', 1, 1, 1, 1, 1, 1, '2026-10-29 14:21:45', '2026-10-29 14:21:45');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (11, 1, 'vehicles', 1, 1, 1, 1, 1, 1, '2026-10-29 14:21:45', '2026-10-29 14:21:45');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (12, 1, 'maintenances', 1, 1, 1, 1, 1, 1, '2026-10-29 14:21:46', '2026-10-29 14:21:46');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (13, 2, 'dashboard', 1, 1, 1, 0, 1, 1, '2026-10-29 14:21:46', '2026-10-29 14:21:46');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (14, 2, 'cargo', 1, 1, 1, 0, 1, 1, '2026-10-29 14:21:46', '2026-10-29 14:21:46');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (15, 2, 'clients', 1, 1, 1, 0, 1, 1, '2026-10-29 14:21:46', '2026-10-29 14:21:46');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (16, 2, 'shipments', 1, 1, 1, 0, 1, 1, '2026-10-29 14:21:46', '2026-10-29 14:21:46');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (17, 2, 'tracking', 1, 1, 1, 0, 1, 1, '2026-10-29 14:21:46', '2026-10-29 14:21:46');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (18, 2, 'finances', 1, 0, 0, 0, 0, 0, '2026-10-29 14:21:46', '2026-10-29 14:21:46');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (19, 2, 'invoices', 1, 1, 1, 0, 1, 1, '2026-10-29 14:21:46', '2026-10-29 14:21:46');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (20, 2, 'reports', 1, 0, 0, 0, 0, 1, '2026-10-29 14:21:47', '2026-10-29 14:21:47');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (21, 2, 'users', 0, 0, 0, 0, 0, 0, '2026-10-29 14:21:47', '2026-10-29 14:21:47');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (22, 2, 'rentals', 1, 1, 1, 0, 1, 1, '2026-10-29 14:21:47', '2026-10-29 14:21:47');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (23, 2, 'vehicles', 1, 1, 1, 0, 1, 1, '2026-10-29 14:21:47', '2026-10-29 14:21:47');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (24, 2, 'maintenances', 1, 1, 1, 0, 1, 1, '2026-10-29 14:21:47', '2026-10-29 14:21:47');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (25, 3, 'dashboard', 1, 1, 1, 0, 1, 1, '2026-10-29 14:21:47', '2026-10-29 14:21:47');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (26, 3, 'cargo', 1, 0, 0, 0, 0, 1, '2026-10-29 14:21:47', '2026-10-29 14:21:47');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (27, 3, 'clients', 1, 0, 0, 0, 0, 1, '2026-10-29 14:21:47', '2026-10-29 14:21:47');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (28, 3, 'shipments', 1, 0, 0, 0, 0, 1, '2026-10-29 14:21:47', '2026-10-29 14:21:47');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (29, 3, 'tracking', 0, 0, 0, 0, 0, 0, '2026-10-29 14:21:47', '2026-10-29 14:21:47');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (30, 3, 'finances', 1, 1, 1, 0, 1, 1, '2026-10-29 14:21:47', '2026-10-29 14:21:47');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (31, 3, 'invoices', 1, 1, 1, 0, 1, 1, '2026-10-29 14:21:47', '2026-10-29 14:21:47');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (32, 3, 'reports', 1, 1, 1, 0, 1, 1, '2026-10-29 14:21:48', '2026-10-29 14:21:48');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (33, 3, 'users', 0, 0, 0, 0, 0, 0, '2026-10-29 14:21:48', '2026-10-29 14:21:48');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (34, 3, 'rentals', 1, 0, 0, 0, 0, 1, '2026-10-29 14:21:48', '2026-10-29 14:21:48');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (35, 3, 'vehicles', 1, 0, 0, 0, 0, 0, '2026-10-29 14:21:48', '2026-10-29 14:21:48');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (36, 3, 'maintenances', 0, 0, 0, 0, 0, 0, '2026-10-29 14:21:48', '2026-10-29 14:21:48');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (37, 4, 'dashboard', 1, 0, 0, 0, 0, 0, '2026-10-29 14:21:48', '2026-10-29 14:21:48');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (38, 4, 'cargo', 1, 1, 1, 0, 0, 1, '2026-10-29 14:21:48', '2026-10-29 14:21:48');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (39, 4, 'clients', 1, 1, 1, 0, 0, 1, '2026-10-29 14:21:48', '2026-10-29 14:21:48');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (40, 4, 'shipments', 1, 1, 1, 0, 0, 1, '2026-10-29 14:21:48', '2026-10-29 14:21:48');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (41, 4, 'tracking', 1, 1, 1, 0, 0, 1, '2026-10-29 14:21:49', '2026-10-29 14:21:49');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (42, 4, 'finances', 0, 0, 0, 0, 0, 0, '2026-10-29 14:21:49', '2026-10-29 14:21:49');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (43, 4, 'invoices', 0, 0, 0, 0, 0, 0, '2026-10-29 14:21:49', '2026-10-29 14:21:49');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (44, 4, 'reports', 0, 0, 0, 0, 0, 0, '2026-10-29 14:21:49', '2026-10-29 14:21:49');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (45, 4, 'users', 0, 0, 0, 0, 0, 0, '2026-10-29 14:21:49', '2026-10-29 14:21:49');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (46, 4, 'rentals', 1, 1, 1, 0, 0, 1, '2026-10-29 14:21:49', '2026-10-29 14:21:49');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (47, 4, 'vehicles', 1, 0, 0, 0, 0, 0, '2026-10-29 14:21:49', '2026-10-29 14:21:49');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (48, 4, 'maintenances', 0, 0, 0, 0, 0, 0, '2026-10-29 14:21:49', '2026-10-29 14:21:49');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (49, 5, 'dashboard', 1, 0, 0, 0, 0, 0, '2026-10-29 14:21:49', '2026-10-29 14:21:49');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (50, 5, 'cargo', 1, 1, 1, 0, 0, 1, '2026-10-29 14:21:49', '2026-10-29 14:21:49');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (51, 5, 'clients', 1, 1, 1, 0, 0, 1, '2026-10-29 14:21:49', '2026-10-29 14:21:49');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (52, 5, 'shipments', 1, 1, 1, 0, 0, 1, '2026-10-29 14:21:49', '2026-10-29 14:21:49');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (53, 5, 'tracking', 1, 1, 1, 0, 0, 1, '2026-10-29 14:21:50', '2026-10-29 14:21:50');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (54, 5, 'finances', 0, 0, 0, 0, 0, 0, '2026-10-29 14:21:50', '2026-10-29 14:21:50');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (55, 5, 'invoices', 0, 0, 0, 0, 0, 0, '2026-10-29 14:21:50', '2026-10-29 14:21:50');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (56, 5, 'reports', 0, 0, 0, 0, 0, 0, '2026-10-29 14:21:50', '2026-10-29 14:21:50');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (57, 5, 'users', 0, 0, 0, 0, 0, 0, '2026-10-29 14:21:50', '2026-10-29 14:21:50');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (58, 5, 'rentals', 1, 1, 1, 0, 0, 1, '2026-10-29 14:21:50', '2026-10-29 14:21:50');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (59, 5, 'vehicles', 1, 0, 0, 0, 0, 0, '2026-10-29 14:21:50', '2026-10-29 14:21:50');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (60, 5, 'maintenances', 0, 0, 0, 0, 0, 0, '2026-10-29 14:21:50', '2026-10-29 14:21:50');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (61, 6, 'dashboard', 1, 0, 0, 0, 0, 0, '2026-10-29 14:21:51', '2026-10-29 14:21:51');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (62, 6, 'cargo', 1, 1, 1, 0, 0, 1, '2026-10-29 14:21:51', '2026-10-29 14:21:51');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (63, 6, 'clients', 1, 1, 1, 0, 0, 1, '2026-10-29 14:21:51', '2026-10-29 14:21:51');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (64, 6, 'shipments', 1, 1, 1, 0, 0, 1, '2026-10-29 14:21:51', '2026-10-29 14:21:51');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (65, 6, 'tracking', 1, 1, 1, 0, 0, 1, '2026-10-29 14:21:52', '2026-10-29 14:21:52');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (66, 6, 'finances', 0, 0, 0, 0, 0, 0, '2026-10-29 14:21:52', '2026-10-29 14:21:52');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (67, 6, 'invoices', 0, 0, 0, 0, 0, 0, '2026-10-29 14:21:52', '2026-10-29 14:21:52');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (68, 6, 'reports', 0, 0, 0, 0, 0, 0, '2026-10-29 14:21:52', '2026-10-29 14:21:52');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (69, 6, 'users', 0, 0, 0, 0, 0, 0, '2026-10-29 14:21:52', '2026-10-29 14:21:52');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (70, 6, 'rentals', 1, 1, 1, 0, 0, 1, '2026-10-29 14:21:52', '2026-10-29 14:21:52');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (71, 6, 'vehicles', 1, 0, 0, 0, 0, 0, '2026-10-29 14:21:53', '2026-10-29 14:21:53');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (72, 6, 'maintenances', 0, 0, 0, 0, 0, 0, '2026-10-29 14:21:53', '2026-10-29 14:21:53');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (73, 7, 'dashboard', 1, 0, 0, 0, 0, 0, '2026-10-29 14:21:53', '2026-10-29 14:21:53');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (74, 7, 'cargo', 0, 0, 0, 0, 0, 0, '2026-10-29 14:21:53', '2026-10-29 14:21:53');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (75, 7, 'clients', 0, 0, 0, 0, 0, 0, '2026-10-29 14:21:53', '2026-10-29 14:21:53');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (76, 7, 'shipments', 0, 0, 0, 0, 0, 0, '2026-10-29 14:21:54', '2026-10-29 14:21:54');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (77, 7, 'tracking', 1, 1, 1, 1, 1, 1, '2026-10-29 14:21:54', '2026-10-29 14:21:54');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (78, 7, 'finances', 0, 0, 0, 0, 0, 0, '2026-10-29 14:21:54', '2026-10-29 14:21:54');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (79, 7, 'invoices', 0, 0, 0, 0, 0, 0, '2026-10-29 14:21:54', '2026-10-29 14:21:54');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (80, 7, 'reports', 0, 0, 0, 0, 0, 0, '2026-10-29 14:21:55', '2026-10-29 14:21:55');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (81, 7, 'users', 0, 0, 0, 0, 0, 0, '2026-10-29 14:21:55', '2026-10-29 14:21:55');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (82, 7, 'rentals', 1, 0, 0, 0, 0, 0, '2026-10-29 14:21:55', '2026-10-29 14:21:55');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (83, 7, 'vehicles', 1, 1, 1, 1, 1, 1, '2026-10-29 14:21:55', '2026-10-29 14:21:55');
INSERT INTO `permissions` (`id`, `user_id`, `module`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_validate`, `can_export`, `created_at`, `updated_at`) VALUES (84, 7, 'maintenances', 1, 1, 1, 1, 1, 1, '2026-10-29 14:21:55', '2026-10-29 14:21:55');

-- Structure de la table `rental_audit_logs`
DROP TABLE IF EXISTS `rental_audit_logs`;
CREATE TABLE `rental_audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` int NOT NULL,
  `details` json DEFAULT NULL,
  `ip_address` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `rental_audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure de la table `rental_inspections`
DROP TABLE IF EXISTS `rental_inspections`;
CREATE TABLE `rental_inspections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rental_id` int NOT NULL,
  `type` enum('departure','return') COLLATE utf8mb4_unicode_ci NOT NULL,
  `inspection_date` datetime NOT NULL,
  `mileage` int NOT NULL,
  `fuel_level` enum('Empty','1/4','1/2','3/4','Full') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Full',
  `cleanliness` enum('clean','acceptable','dirty') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'clean',
  `existing_damages` text COLLATE utf8mb4_unicode_ci,
  `new_damages` text COLLATE utf8mb4_unicode_ci,
  `damage_cost` decimal(12,2) NOT NULL DEFAULT '0.00',
  `photos` json DEFAULT NULL,
  `inspector_id` int DEFAULT NULL,
  `client_signed` tinyint(1) NOT NULL DEFAULT '0',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `rental_id` (`rental_id`),
  KEY `inspector_id` (`inspector_id`),
  CONSTRAINT `rental_inspections_ibfk_1` FOREIGN KEY (`rental_id`) REFERENCES `rentals` (`id`) ON DELETE CASCADE,
  CONSTRAINT `rental_inspections_ibfk_2` FOREIGN KEY (`inspector_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure de la table `rentals`
DROP TABLE IF EXISTS `rentals`;
CREATE TABLE `rentals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rental_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicle_id` int NOT NULL,
  `client_id` int NOT NULL,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `actual_return_datetime` datetime DEFAULT NULL,
  `rate_type` enum('hourly','daily','weekly','monthly') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'daily',
  `unit_rate` decimal(12,2) NOT NULL,
  `duration_units` decimal(8,2) NOT NULL DEFAULT '1.00',
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `deposit_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `deposit_status` enum('pending','paid','partially_refunded','refunded','retained') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `deposit_retained_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `driver_included` tinyint(1) NOT NULL DEFAULT '0',
  `driver_fee` decimal(12,2) NOT NULL DEFAULT '0.00',
  `fuel_charge` decimal(12,2) NOT NULL DEFAULT '0.00',
  `late_fee` decimal(12,2) NOT NULL DEFAULT '0.00',
  `damage_fee` decimal(12,2) NOT NULL DEFAULT '0.00',
  `other_fees` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `paid_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `payment_status` enum('pending','partial','paid') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `status` enum('pending','confirmed','active','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'confirmed',
  `destination_usage` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Brazzaville & Environs',
  `cancellation_reason` text COLLATE utf8mb4_unicode_ci,
  `cancellation_date` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rental_number` (`rental_number`),
  KEY `vehicle_id` (`vehicle_id`),
  KEY `client_id` (`client_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `rentals_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `rentals_ibfk_2` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `rentals_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure de la table `shipments`
DROP TABLE IF EXISTS `shipments`;
CREATE TABLE `shipments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tracking_number` varchar(50) NOT NULL,
  `client_id` int NOT NULL,
  `origin` varchar(100) NOT NULL DEFAULT 'Brazzaville',
  `destination` varchar(100) NOT NULL DEFAULT 'Pointe-Noire',
  `sender_name` varchar(150) NOT NULL,
  `sender_phone` varchar(50) NOT NULL,
  `receiver_name` varchar(150) NOT NULL,
  `receiver_phone` varchar(50) NOT NULL,
  `receiver_address` varchar(255) DEFAULT NULL,
  `carrier_name` varchar(100) DEFAULT NULL,
  `carrier_phone` varchar(50) DEFAULT NULL,
  `vehicle_plate` varchar(50) DEFAULT NULL,
  `departure_date` date DEFAULT NULL,
  `estimated_arrival` date DEFAULT NULL,
  `actual_arrival` date DEFAULT NULL,
  `shipping_cost` decimal(12,2) NOT NULL DEFAULT '0.00',
  `insurance_cost` decimal(12,2) NOT NULL DEFAULT '0.00',
  `other_fees` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_cost` decimal(12,2) NOT NULL DEFAULT '0.00',
  `paid_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `payment_status` varchar(30) NOT NULL DEFAULT 'pending',
  `status` varchar(50) NOT NULL DEFAULT 'en attente',
  `notes` text,
  `created_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tracking_number` (`tracking_number`),
  KEY `client_id` (`client_id`),
  CONSTRAINT `shipments_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Structure de la table `tracking_events`
DROP TABLE IF EXISTS `tracking_events`;
CREATE TABLE `tracking_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `shipment_id` int NOT NULL,
  `status` varchar(50) NOT NULL,
  `location` varchar(150) NOT NULL,
  `description` text NOT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `shipment_id` (`shipment_id`),
  CONSTRAINT `tracking_events_ibfk_1` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Structure de la table `users`
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','manager','accountant','agent','secretary','tech_admin') NOT NULL DEFAULT 'agent',
  `phone` varchar(50) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Données de la table `users` (7 lignes)
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`, `status`, `created_at`, `updated_at`, `last_login`) VALUES (1, 'Dieudonné Massamba (DG)', 'admin@kenayalogistic.cg', '$2a$10$zwSNbpOFB7IK.G/C0G2Ow.exBuUpQt1H7HwgP0ou7fRKKn2kHt1Yu', 'admin', '+242 06 654 32 10', 'active', '2026-10-29 09:38:31', '2026-10-29 14:56:09', '2026-10-29 14:56:10');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`, `status`, `created_at`, `updated_at`, `last_login`) VALUES (2, 'Grace Loubaki', 'gestion@kenayalogistic.cg', '$2a$10$zwSNbpOFB7IK.G/C0G2Ow.cnX2oEtbgyWxMSFDQiK2t2kyKX3vUy6', 'manager', '+242 05 521 88 44', 'active', '2026-10-29 09:38:31', '2026-10-29 12:49:42', NULL);
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`, `status`, `created_at`, `updated_at`, `last_login`) VALUES (3, 'Bertrand Ngoma', 'compta@kenayalogistic.cg', '$2a$10$zwSNbpOFB7IK.G/C0G2Ow.Gsx0PuXmjsxz4M99f4mYLJOWo1sVcTG', 'accountant', '+242 06 912 34 56', 'active', '2026-10-29 09:38:31', '2026-10-29 12:49:42', NULL);
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`, `status`, `created_at`, `updated_at`, `last_login`) VALUES (4, 'Arsène Moukassa', 'agent@kenayalogistic.cg', '$2a$10$zwSNbpOFB7IK.G/C0G2Ow.4psRV4VM/fJcQZRXD5Soj4s9qzqKn1u', 'agent', '+242 04 430 11 22', 'active', '2026-10-29 09:38:31', '2026-10-29 12:49:43', NULL);
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`, `status`, `created_at`, `updated_at`, `last_login`) VALUES (5, 'Grace Ondaye (Secrétaire Principale)', 'secretaire1@kenayalogistic.cg', '$2a$10$z.vnRhZMFy4Mwyt6OZuo4O62cCmwVyaLXh6DdpKg8tHUl9QiwFfge', 'secretary', '+242 06 444 11 22', 'active', '2026-10-29 14:21:42', '2026-10-29 14:26:30', '2026-10-29 14:26:30');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`, `status`, `created_at`, `updated_at`, `last_login`) VALUES (6, 'Nathalie Mabiala (Secrétaire Quai / Agence)', 'secretaire2@kenayalogistic.cg', '$2a$10$z.vnRhZMFy4Mwyt6OZuo4O62cCmwVyaLXh6DdpKg8tHUl9QiwFfge', 'secretary', '+242 05 555 33 44', 'active', '2026-10-29 14:21:43', '2026-10-29 14:21:43', NULL);
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`, `status`, `created_at`, `updated_at`, `last_login`) VALUES (7, 'Arsène Loubaki (Administrateur Technique)', 'tech@kenayalogistic.cg', '$2a$10$4zk40XQGWvzVzJ2HDOVlMeBGfFvlPPEhJYPkARYnJ4HM3h61Dvrle', 'tech_admin', '+242 06 999 88 77', 'active', '2026-10-29 14:21:43', '2026-10-29 14:21:43', NULL);

-- Structure de la table `vehicle_maintenances`
DROP TABLE IF EXISTS `vehicle_maintenances`;
CREATE TABLE `vehicle_maintenances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vehicle_id` int NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('Vidange','Freins & Pneus','Visite technique','Assurance','Révision moteur','Climatisation','Carrosserie','Autre') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Vidange',
  `status` enum('scheduled','in_progress','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled',
  `scheduled_date` date NOT NULL,
  `completed_date` date DEFAULT NULL,
  `mileage_at_service` int DEFAULT NULL,
  `next_service_mileage` int DEFAULT NULL,
  `next_service_date` date DEFAULT NULL,
  `cost` decimal(12,2) NOT NULL DEFAULT '0.00',
  `garage_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_ref` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `performed_by` int DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `vehicle_id` (`vehicle_id`),
  KEY `performed_by` (`performed_by`),
  CONSTRAINT `vehicle_maintenances_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `vehicle_maintenances_ibfk_2` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure de la table `vehicles`
DROP TABLE IF EXISTS `vehicles`;
CREATE TABLE `vehicles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `brand` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `plate_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` int NOT NULL,
  `category` enum('Citadine','Berline','SUV / 4x4','Pick-up','Minibus','Utilitaire / Fourgon','Luxe / VIP') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SUV / 4x4',
  `transmission` enum('Automatique','Manuelle') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Automatique',
  `fuel_type` enum('Essence','Diesel','Hybride') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Diesel',
  `seats` int NOT NULL DEFAULT '5',
  `mileage` int NOT NULL DEFAULT '0',
  `color` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rate_hourly` decimal(12,2) NOT NULL DEFAULT '5000.00',
  `rate_daily` decimal(12,2) NOT NULL DEFAULT '35000.00',
  `rate_weekly` decimal(12,2) NOT NULL DEFAULT '210000.00',
  `rate_monthly` decimal(12,2) NOT NULL DEFAULT '750000.00',
  `deposit_amount` decimal(12,2) NOT NULL DEFAULT '150000.00',
  `status` enum('available','reserved','rented','maintenance','immobilized') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'available',
  `photos` json DEFAULT NULL,
  `documents` json DEFAULT NULL,
  `insurance_company` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `insurance_policy_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `insurance_expiry` date DEFAULT NULL,
  `technical_inspection_date` date DEFAULT NULL,
  `technical_inspection_expiry` date DEFAULT NULL,
  `gps_tracker_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gps_last_location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gps_last_update` datetime DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `plate_number` (`plate_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
