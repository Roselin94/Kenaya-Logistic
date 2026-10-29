require('dotenv').config();
const mysql = require('mysql2/promise');

async function seedData() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'kenaya_logistics'
  });

  const [existing] = await conn.query('SELECT COUNT(*) as c FROM vehicles');
  if (existing && existing[0].c > 0) {
    console.log('Véhicules déjà présents :', existing[0].c);
    await conn.end();
    return;
  }

  // Insertion des véhicules
  await conn.query(`
    INSERT INTO vehicles (brand, model, plate_number, year, category, transmission, fuel_type, seats, mileage, color, rate_hourly, rate_daily, rate_weekly, rate_monthly, deposit_amount, status, insurance_company, gps_tracker_id, gps_last_location, notes)
    VALUES
    ('Toyota', 'Prado TXL V6 4x4', '124-KL-02', 2023, 'SUV / 4x4', 'Automatique', 'Diesel', 7, 34200, 'Blanc Nacré', 7500, 55000, 330000, 1200000, 250000, 'available', 'AGC Assurances', 'TK-PRADO-01', 'Bd Sassou Nguesso, Brazzaville', 'Véhicule VIP climatisé parfait pour missions officielles et trajets Brazza-Pointe Noire.'),
    ('Toyota', 'Hilux Double Cabine 4x4', '487-MN-02', 2022, 'Pick-up', 'Manuelle', 'Diesel', 5, 58400, 'Gris Métallisé', 6000, 45000, 270000, 950000, 200000, 'rented', 'NSIA Assurances', 'TK-HILUX-02', 'Zone Industrielle Mpila, Brazzaville', 'Idéal pour chantiers RN1 et transport de matériel lourd.'),
    ('Hyundai', 'Santa Fe AWD', '812-PN-01', 2023, 'SUV / 4x4', 'Automatique', 'Essence', 7, 21500, 'Noir Ébène', 5500, 40000, 240000, 850000, 200000, 'reserved', 'ARC Assurances', 'TK-SANTAFE-03', 'Aéroport Antonio-Agostinho-Neto, Pointe-Noire', 'Excellent confort familial et professionnel.'),
    ('Toyota', 'Corolla Berline', '350-KL-02', 2021, 'Berline', 'Automatique', 'Essence', 5, 49200, 'Argent', 4000, 25000, 150000, 500000, 100000, 'available', 'AGC Assurances', 'TK-COROLLA-04', 'Plateau des 15 Ans, Brazzaville', 'Berline sobre et très économique en consommation.'),
    ('Toyota', 'HiAce Minibus 15 Places', '614-KL-02', 2022, 'Minibus', 'Manuelle', 'Diesel', 15, 67800, 'Blanc', 8000, 60000, 360000, 1300000, 300000, 'maintenance', 'NSIA Assurances', 'TK-HIACE-05', 'Garage Central KENAYA, Ouenzé Brazzaville', 'Transport de délégations, navettes aéroport et sorties de groupe.');
  `);

  // Insertion des locations
  await conn.query(`
    INSERT INTO rentals (rental_number, vehicle_id, client_id, start_datetime, end_datetime, rate_type, unit_rate, duration_units, subtotal, deposit_amount, deposit_status, driver_included, driver_fee, total_amount, paid_amount, payment_status, status, destination_usage, created_by, notes)
    VALUES
    ('LOC-2026-0001', 2, 1, '2026-10-27 08:00:00', '2026-10-31 18:00:00', 'daily', 45000, 5, 225000, 200000, 'paid', 1, 50000, 275000, 275000, 'paid', 'active', 'Supervision des travaux sur la RN1', 1, 'Caution de 200 000 FCFA reçue en espèces. Chauffeur KENAYA affecté.'),
    ('LOC-2026-0002', 3, 2, '2026-11-01 09:00:00', '2026-11-05 18:00:00', 'daily', 40000, 5, 200000, 200000, 'pending', 0, 0, 200000, 100000, 'partial', 'confirmed', 'Déplacements d affaires Pointe-Noire', 1, 'Acompte de 100 000 FCFA reçu via MTN MoMo. Solde et caution au départ.'),
    ('LOC-2026-0003', 1, 3, '2026-10-20 08:00:00', '2026-10-25 18:00:00', 'daily', 55000, 6, 330000, 250000, 'refunded', 1, 60000, 390000, 390000, 'paid', 'completed', 'Mission diplomatique et visite officielle Oyo', 1, 'Location clôturée avec succès. Caution de 250 000 FCFA restituée au client.');
  `);

  // États des lieux
  await conn.query(`
    INSERT INTO rental_inspections (rental_id, type, inspection_date, mileage, fuel_level, cleanliness, existing_damages, damage_cost, inspector_id, client_signed, notes)
    VALUES
    (1, 'departure', '2026-10-27 07:45:00', 58000, 'Full', 'clean', 'Légère rayure sur pare-chocs arrière droit', 0, 1, 1, 'Roue de secours et cric vérifiés.'),
    (3, 'departure', '2026-10-20 07:30:00', 33100, 'Full', 'clean', 'Aucun dommage.', 0, 1, 1, 'Départ conforme.'),
    (3, 'return', '2026-10-25 17:30:00', 34200, 'Full', 'clean', 'Aucun nouveau dommage constaté.', 0, 1, 1, 'Retour impeccable, véhicule lavé.');
  `);

  // Maintenance
  await conn.query(`
    INSERT INTO vehicle_maintenances (vehicle_id, title, type, status, scheduled_date, cost, garage_name, invoice_ref, performed_by, notes)
    VALUES
    (5, 'Révision périodique 70 000 km & Freins', 'Vidange', 'in_progress', '2026-10-28', 145000, 'Garage CFAO Motors Congo', 'FACT-CFAO-2026-109', 1, 'Remplacement plaquettes de frein avant et vidange complète.');
  `);

  console.log('[SEED] Base de données enrichie avec succès pour le module Location de Voitures !');
  await conn.end();
}

seedData().catch(err => {
  console.error(err);
  process.exit(1);
});

