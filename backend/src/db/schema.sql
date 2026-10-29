-- =====================================================================
-- KENAYA LOGISTIC - Base de données MySQL
-- Plateforme SaaS de gestion d'importation et d'acheminement de fret
-- Brazzaville - Pointe-Noire - République du Congo
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `kenaya_logistics` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `kenaya_logistics`;

-- 1. Table des utilisateurs & Rôles (RBAC)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'manager', 'accountant', 'agent') NOT NULL DEFAULT 'agent',
  `phone` VARCHAR(50) DEFAULT NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table des clients
CREATE TABLE IF NOT EXISTS `clients` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `address` VARCHAR(255) DEFAULT NULL,
  `city` VARCHAR(100) NOT NULL DEFAULT 'Brazzaville',
  `id_number` VARCHAR(50) DEFAULT NULL, -- N° CNI, Passeport ou RCCM
  `notes` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table des expéditions
CREATE TABLE IF NOT EXISTS `shipments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tracking_number` VARCHAR(50) NOT NULL UNIQUE,
  `client_id` INT NOT NULL,
  `origin` VARCHAR(100) NOT NULL DEFAULT 'Brazzaville',
  `destination` VARCHAR(100) NOT NULL DEFAULT 'Pointe-Noire',
  `sender_name` VARCHAR(150) NOT NULL,
  `sender_phone` VARCHAR(50) NOT NULL,
  `receiver_name` VARCHAR(150) NOT NULL,
  `receiver_phone` VARCHAR(50) NOT NULL,
  `receiver_address` VARCHAR(255) DEFAULT NULL,
  `carrier_name` VARCHAR(100) DEFAULT NULL,
  `carrier_phone` VARCHAR(50) DEFAULT NULL,
  `vehicle_plate` VARCHAR(50) DEFAULT NULL,
  `departure_date` DATE DEFAULT NULL,
  `estimated_arrival` DATE DEFAULT NULL,
  `actual_arrival` DATE DEFAULT NULL,
  `shipping_cost` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `insurance_cost` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `other_fees` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_cost` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `paid_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `payment_status` ENUM('pending', 'partial', 'paid') NOT NULL DEFAULT 'pending',
  `status` ENUM('en attente', 'en transit', 'arrivée à destination', 'livrée', 'annulée') NOT NULL DEFAULT 'en attente',
  `notes` TEXT DEFAULT NULL,
  `created_by` INT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table des marchandises
CREATE TABLE IF NOT EXISTS `cargo_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `shipment_id` INT DEFAULT NULL,
  `client_id` INT NOT NULL,
  `designation` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL DEFAULT 'Marchandises Générales',
  `quantity` INT NOT NULL DEFAULT 1,
  `unit` VARCHAR(50) NOT NULL DEFAULT 'Colis', -- Colis, Cartons, Sacs, Fûts, Palettes, Pièces
  `weight_kg` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `volume_cbm` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `declared_value` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('enregistrée', 'en attente d''expédition', 'en transit', 'au dépôt', 'livrée', 'endommagée', 'annulée') NOT NULL DEFAULT 'enregistrée',
  `barcode` VARCHAR(100) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`shipment_id`) REFERENCES `shipments`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table des événements de suivi (Timeline Tracking)
CREATE TABLE IF NOT EXISTS `tracking_events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `shipment_id` INT NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `location` VARCHAR(150) NOT NULL,
  `description` TEXT NOT NULL,
  `updated_by` INT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`shipment_id`) REFERENCES `shipments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Table des paiements & encaissements (Finances - Recettes)
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `shipment_id` INT DEFAULT NULL,
  `client_id` INT NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `payment_method` ENUM('Espèces', 'Airtel Money', 'MTN Mobile Money', 'Virement bancaire', 'Chèque') NOT NULL DEFAULT 'Espèces',
  `reference` VARCHAR(100) DEFAULT NULL,
  `payment_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `recorded_by` INT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`shipment_id`) REFERENCES `shipments`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Table des dépenses d'exploitation
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `shipment_id` INT DEFAULT NULL,
  `title` VARCHAR(200) NOT NULL,
  `category` ENUM('Carburant', 'Péage RN1', 'Maintenance camion', 'Manutention', 'Frais de douane / contrôle', 'Salaires / Chauffeurs', 'Loyer entrepôt', 'Autre') NOT NULL DEFAULT 'Carburant',
  `amount` DECIMAL(12,2) NOT NULL,
  `expense_date` DATE NOT NULL,
  `paid_to` VARCHAR(150) DEFAULT NULL,
  `payment_method` ENUM('Espèces', 'Airtel Money', 'MTN Mobile Money', 'Virement bancaire', 'Chèque') NOT NULL DEFAULT 'Espèces',
  `recorded_by` INT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`shipment_id`) REFERENCES `shipments`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Table des factures & reçus
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_number` VARCHAR(50) NOT NULL UNIQUE,
  `shipment_id` INT NOT NULL,
  `client_id` INT NOT NULL,
  `issue_date` DATE NOT NULL,
  `due_date` DATE DEFAULT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `tax_rate` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `paid_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('unpaid', 'partially_paid', 'paid', 'cancelled') NOT NULL DEFAULT 'unpaid',
  `notes` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`shipment_id`) REFERENCES `shipments`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index utiles pour les performances
CREATE INDEX `idx_shipments_tracking` ON `shipments`(`tracking_number`);
CREATE INDEX `idx_shipments_status` ON `shipments`(`status`);
CREATE INDEX `idx_cargo_status` ON `cargo_items`(`status`);
CREATE INDEX `idx_payments_date` ON `payments`(`payment_date`);
CREATE INDEX `idx_expenses_date` ON `expenses`(`expense_date`);

