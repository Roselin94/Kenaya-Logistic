require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'kenaya_logistics'
  });
  console.log('[MIGRATION] Connecté à MySQL...');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      brand VARCHAR(100) NOT NULL,
      model VARCHAR(100) NOT NULL,
      plate_number VARCHAR(50) NOT NULL UNIQUE,
      year INT NOT NULL,
      category ENUM('Citadine', 'Berline', 'SUV / 4x4', 'Pick-up', 'Minibus', 'Utilitaire / Fourgon', 'Luxe / VIP') NOT NULL DEFAULT 'SUV / 4x4',
      transmission ENUM('Automatique', 'Manuelle') NOT NULL DEFAULT 'Automatique',
      fuel_type ENUM('Essence', 'Diesel', 'Hybride') NOT NULL DEFAULT 'Diesel',
      seats INT NOT NULL DEFAULT 5,
      mileage INT NOT NULL DEFAULT 0,
      color VARCHAR(50) DEFAULT NULL,
      rate_hourly DECIMAL(12,2) NOT NULL DEFAULT 5000.00,
      rate_daily DECIMAL(12,2) NOT NULL DEFAULT 35000.00,
      rate_weekly DECIMAL(12,2) NOT NULL DEFAULT 210000.00,
      rate_monthly DECIMAL(12,2) NOT NULL DEFAULT 750000.00,
      deposit_amount DECIMAL(12,2) NOT NULL DEFAULT 150000.00,
      status ENUM('available', 'reserved', 'rented', 'maintenance', 'immobilized') NOT NULL DEFAULT 'available',
      photos JSON DEFAULT NULL,
      documents JSON DEFAULT NULL,
      insurance_company VARCHAR(100) DEFAULT NULL,
      insurance_policy_number VARCHAR(100) DEFAULT NULL,
      insurance_expiry DATE DEFAULT NULL,
      technical_inspection_date DATE DEFAULT NULL,
      technical_inspection_expiry DATE DEFAULT NULL,
      gps_tracker_id VARCHAR(100) DEFAULT NULL,
      gps_last_location VARCHAR(255) DEFAULT NULL,
      gps_last_update DATETIME DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS rentals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      rental_number VARCHAR(50) NOT NULL UNIQUE,
      vehicle_id INT NOT NULL,
      client_id INT NOT NULL,
      start_datetime DATETIME NOT NULL,
      end_datetime DATETIME NOT NULL,
      actual_return_datetime DATETIME DEFAULT NULL,
      rate_type ENUM('hourly', 'daily', 'weekly', 'monthly') NOT NULL DEFAULT 'daily',
      unit_rate DECIMAL(12,2) NOT NULL,
      duration_units DECIMAL(8,2) NOT NULL DEFAULT 1.00,
      subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      deposit_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      deposit_status ENUM('pending', 'paid', 'partially_refunded', 'refunded', 'retained') NOT NULL DEFAULT 'pending',
      deposit_retained_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      driver_included BOOLEAN NOT NULL DEFAULT FALSE,
      driver_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      fuel_charge DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      late_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      damage_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      other_fees DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      payment_status ENUM('pending', 'partial', 'paid') NOT NULL DEFAULT 'pending',
      status ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled') NOT NULL DEFAULT 'confirmed',
      destination_usage VARCHAR(255) DEFAULT 'Brazzaville & Environs',
      cancellation_reason TEXT DEFAULT NULL,
      cancellation_date DATETIME DEFAULT NULL,
      created_by INT DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS rental_inspections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      rental_id INT NOT NULL,
      type ENUM('departure', 'return') NOT NULL,
      inspection_date DATETIME NOT NULL,
      mileage INT NOT NULL,
      fuel_level ENUM('Empty', '1/4', '1/2', '3/4', 'Full') NOT NULL DEFAULT 'Full',
      cleanliness ENUM('clean', 'acceptable', 'dirty') NOT NULL DEFAULT 'clean',
      existing_damages TEXT DEFAULT NULL,
      new_damages TEXT DEFAULT NULL,
      damage_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      photos JSON DEFAULT NULL,
      inspector_id INT DEFAULT NULL,
      client_signed BOOLEAN NOT NULL DEFAULT FALSE,
      notes TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE CASCADE,
      FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS vehicle_maintenances (
      id INT AUTO_INCREMENT PRIMARY KEY,
      vehicle_id INT NOT NULL,
      title VARCHAR(200) NOT NULL,
      type ENUM('Vidange', 'Freins & Pneus', 'Visite technique', 'Assurance', 'Révision moteur', 'Climatisation', 'Carrosserie', 'Autre') NOT NULL DEFAULT 'Vidange',
      status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
      scheduled_date DATE NOT NULL,
      completed_date DATE DEFAULT NULL,
      mileage_at_service INT DEFAULT NULL,
      next_service_mileage INT DEFAULT NULL,
      next_service_date DATE DEFAULT NULL,
      cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      garage_name VARCHAR(150) DEFAULT NULL,
      invoice_ref VARCHAR(100) DEFAULT NULL,
      performed_by INT DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
      FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS rental_audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT DEFAULT NULL,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id INT NOT NULL,
      details JSON DEFAULT NULL,
      ip_address VARCHAR(50) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  try {
    await conn.query(`ALTER TABLE payments ADD COLUMN rental_id INT DEFAULT NULL AFTER shipment_id`);
  } catch (e) {}
  try {
    await conn.query(`ALTER TABLE payments ADD CONSTRAINT fk_payment_rental FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE SET NULL`);
  } catch (e) {}

  try {
    await conn.query(`ALTER TABLE invoices ADD COLUMN rental_id INT DEFAULT NULL AFTER shipment_id`);
    await conn.query(`ALTER TABLE invoices MODIFY COLUMN shipment_id INT NULL`);
  } catch (e) {}
  try {
    await conn.query(`ALTER TABLE invoices ADD CONSTRAINT fk_invoice_rental FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE SET NULL`);
  } catch (e) {}

  try {
    await conn.query(`ALTER TABLE expenses ADD COLUMN vehicle_id INT DEFAULT NULL AFTER shipment_id`);
  } catch (e) {}
  try {
    await conn.query(`ALTER TABLE expenses ADD CONSTRAINT fk_expense_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL`);
  } catch (e) {}

  // Ajout des rôles 'secretary' (secrétaire) et 'tech_admin' (administrateur technique)
  try {
    await conn.query(`ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'manager', 'accountant', 'agent', 'secretary', 'tech_admin') NOT NULL DEFAULT 'agent'`);
  } catch (e) {}

  console.log('[MIGRATION] Migration des tables terminée avec succès !');
  await conn.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

