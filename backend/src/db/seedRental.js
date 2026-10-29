require('dotenv').config();
const mysql = require('mysql2/promise');

async function seedVehiclesAndRentals() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'kenaya_logistics'
  });
  console.log('[SEED RENTAL] Connexion MySQL...');

  const [existingVehicles] = await conn.query('SELECT COUNT(*) as count FROM vehicles');
  if (existingVehicles[0].count > 0) {
    console.log('[SEED RENTAL] Véhicules déjà amorcés (' + existingVehicles[0].count + ')');
    await conn.end();
    return;
  }

  // 1. Insertion de véhicules représentatifs du marché congolais
  const vehicles = [
    [
      'Toyota', 'Prado TXL V6 4x4', '124-KL-02', 2023, 'SUV / 4x4', 'Automatique', 'Diesel', 7, 34200, 'Blanc Nacré',
      7500, 55000, 330000, 1200000, 250000, 'available',
      JSON.stringify(['https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=800&q=80']),
      JSON.stringify({ carte_grise: 'CG-BZV-2023-4589', assurance_num: 'AGP-BZV-2025-0987' }),
      'Assurances Générales du Congo (AGC)', 'POL-AGC-88412', '2026-11-15', '2026-03-10', '2027-03-10',
      'TK-PRADO-01', 'Boulevard Denis Sassou Nguesso, Brazzaville', 'Véhicule VIP climatisé parfait pour missions officielles et trajets Brazza-Pointe Noire.'
    ],
    [
      'Toyota', 'Hilux Double Cabine 4x4', '487-MN-02', 2022, 'Pick-up', 'Manuelle', 'Diesel', 5, 58400, 'Gris Métallisé',
      6000, 45000, 270000, 950000, 200000, 'rented',
      JSON.stringify(['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80']),
      JSON.stringify({ carte_grise: 'CG-BZV-2022-7712', assurance_num: 'NSIA-CG-2026-0412' }),
      'NSIA Assurances Congo', 'NSIA-AUT-4451', '2026-10-30', '2026-02-14', '2027-02-14',
      'TK-HILUX-02', 'Zone Industrielle de Mpila, Brazzaville', 'Idéal pour chantiers, transport de matériel lourd et piste.'
    ],
    [
      'Hyundai', 'Santa Fe AWD', '812-PN-01', 2023, 'SUV / 4x4', 'Automatique', 'Essence', 7, 21500, 'Noir Ébène',
      5500, 40000, 240000, 850000, 200000, 'reserved',
      JSON.stringify(['https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80']),
      JSON.stringify({ carte_grise: 'CG-PNR-2023-1123', assurance_num: 'ARC-2026-554' }),
      'ARC Assurances', 'ARC-AUT-99120', '2026-12-01', '2026-04-05', '2027-04-05',
      'TK-SANTAFE-03', 'Aéroport Antonio-Agostinho-Neto, Pointe-Noire', 'Excellent confort urbain et familial.'
    ],
    [
      'Toyota', 'Corolla Berline', '350-KL-02', 2021, 'Berline', 'Automatique', 'Essence', 5, 49200, 'Argent',
      4000, 25000, 150000, 500000, 100000, 'available',
      JSON.stringify(['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80']),
      JSON.stringify({ carte_grise: 'CG-BZV-2021-9921', assurance_num: 'AGC-2026-118' }),
      'Assurances Générales du Congo (AGC)', 'POL-AGC-33214', '2026-09-20', '2026-01-18', '2027-01-18',
      'TK-COROLLA-04', 'Centre-ville Plateau des 15 Ans, Brazzaville', 'Très économique, parfaite pour déplacements professionnels en ville.'
    ],
    [
      'Toyota', 'HiAce Minibus 15 Places', '614-KL-02', 2022, 'Minibus', 'Manuelle', 'Diesel', 15, 67800, 'Blanc',
      8000, 60000, 360000, 1300000, 300000, 'maintenance',
      JSON.stringify(['https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80']),
      JSON.stringify({ carte_grise: 'CG-BZV-2022-3004', assurance_num: 'NSIA-CG-2026-788' }),
      'NSIA Assurances Congo', 'NSIA-AUT-7882', '2026-08-15', '2025-12-10', '2026-12-10',
      'TK-HIACE-05', 'Garage Central KENAYA, Ouenzé Brazzaville', 'Transport de délégations, équipes et navettes aéroport.'
    ]
  ];

  for (const v of vehicles) {
    await conn.query(`
      INSERT INTO vehicles (
        brand, model, plate_number, year, category, transmission, fuel_type, seats, mileage, color,
        rate_hourly, rate_daily, rate_weekly, rate_monthly, deposit_amount, status,
        photos, documents, insurance_company, insurance_policy_number, insurance_expiry,
        technical_inspection_date, technical_inspection_expiry, gps_tracker_id, gps_last_location, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, v);
  }

  // 2. Création de réservations et locations réelles
  // Location 1 : En cours (Hilux loué par SARL Congo Import-Export)
  await conn.query(`
    INSERT INTO rentals (
      rental_number, vehicle_id, client_id, start_datetime, end_datetime, rate_type, unit_rate, duration_units,
      subtotal, deposit_amount, deposit_status, driver_included, driver_fee, total_amount, paid_amount,
      payment_status, status, destination_usage, created_by, notes
    ) VALUES (
      'LOC-2026-0001', 2, 1, '2026-10-27 08:00:00', '2026-10-31 18:00:00', 'daily', 45000, 5,
      225000, 200000, 'paid', 1, 50000, 275000, 275000,
      'paid', 'active', 'Acheminement matériel et supervision chantiers RN1', 1,
      'Caution de 200 000 FCFA reçue en espèces. Chauffeur KENAYA affecté.'
    )
  `);

  // État des lieux de départ pour la location 1
  await conn.query(`
    INSERT INTO rental_inspections (
      rental_id, type, inspection_date, mileage, fuel_level, cleanliness, existing_damages,
      damage_cost, inspector_id, client_signed, notes
    ) VALUES (
      1, 'departure', '2026-10-27 07:45:00', 58000, 'Full', 'clean', 'Légère rayure pare-chocs arrière droit (signalée)',
      0, 1, 1, 'Véhicule en parfait état de fonctionnement, roue de secours et cric vérifiés.'
    )
  `);

  // Location 2 : Réservation confirmée pour Santa Fe (Global Transit Pointe-Noire)
  await conn.query(`
    INSERT INTO rentals (
      rental_number, vehicle_id, client_id, start_datetime, end_datetime, rate_type, unit_rate, duration_units,
      subtotal, deposit_amount, deposit_status, driver_included, driver_fee, total_amount, paid_amount,
      payment_status, status, destination_usage, created_by, notes
    ) VALUES (
      'LOC-2026-0002', 3, 2, '2026-11-01 09:00:00', '2026-11-05 18:00:00', 'daily', 40000, 5,
      200000, 200000, 'pending', 0, 0, 200000, 100000,
      'partial', 'confirmed', 'Déplacement d\\'affaires Pointe-Noire et environs', 1,
      'Acompte de 100 000 FCFA versé par MTN Mobile Money. Solde et caution à régler à la prise du véhicule.'
    )
  `);

  // Location 3 : Terminée avec succès (Prado TXL)
  await conn.query(`
    INSERT INTO rentals (
      rental_number, vehicle_id, client_id, start_datetime, end_datetime, actual_return_datetime, rate_type, unit_rate, duration_units,
      subtotal, deposit_amount, deposit_status, driver_included, driver_fee, total_amount, paid_amount,
      payment_status, status, destination_usage, created_by, notes
    ) VALUES (
      'LOC-2026-0003', 1, 3, '2026-10-20 08:00:00', '2026-10-25 18:00:00', '2026-10-25 17:30:00', 'daily', 55000, 6,
      330000, 250000, 'refunded', 1, 60000, 390000, 390000,
      'paid', 'completed', 'Mission diplomatique et visite officielle à Oyo', 1,
      'Location clôturée avec succès. Caution de 250 000 FCFA restituée au client après état des lieux.'
    )
  `);

  // États des lieux pour location 3 (départ et retour)
  await conn.query(`
    INSERT INTO rental_inspections (rental_id, type, inspection_date, mileage, fuel_level, cleanliness, existing_damages, damage_cost, inspector_id, client_signed, notes)
    VALUES (3, 'departure', '2026-10-20 07:30:00', 33100, 'Full', 'clean', 'Aucun dommage.', 0, 1, 1, 'Départ conforme.')
  `);
  await conn.query(`
    INSERT INTO rental_inspections (rental_id, type, inspection_date, mileage, fuel_level, cleanliness, existing_damages, damage_cost, inspector_id, client_signed, notes)
    VALUES (3, 'return', '2026-10-25 17:30:00', 34200, 'Full', 'clean', 'Aucun nouveau dommage constaté.', 0, 1, 1, 'Retour impeccable, véhicule lavé.')
  `);

  // 3. Maintenance en cours pour le HiAce
  await conn.query(`
    INSERT INTO vehicle_maintenances (
      vehicle_id, title, type, status, scheduled_date, cost, garage_name, invoice_ref, performed_by, notes
    ) VALUES (
      5, 'Révision périodique 70 000 km & Freins', 'Vidange', 'in_progress', '2026-10-28', 145000, 'Garage CFAO Motors Congo', 'FACT-CFAO-2026-109', 1,
      'Remplacement plaquettes de frein avant, filtres gasoil et vidange moteur complète.'
    )
  `);

  // 4. Écritures financières dans payments & expenses
  // Paiement acompte location 2
  await conn.query(`
    INSERT INTO payments (
      shipment_id, rental_id, client_id, amount, payment_method, reference, payment_date, recorded_by, notes
    ) VALUES (
      NULL, 2, 2, 100000, 'MTN Mobile Money', 'MTN-LOC-002-DEP', '2026-10-28 11:20:00', 1, 'Acompte réservation véhicule Santa Fe (LOC-2026-0002)'
    )
  `);

  // Paiement solde location 1
  await conn.query(`
    INSERT INTO payments (
      shipment_id, rental_id, client_id, amount, payment_method, reference, payment_date, recorded_by, notes
    ) VALUES (
      NULL, 1, 1, 275000, 'Espèces', 'REC-LOC-001', '2026-10-27 08:30:00', 1, 'Règlement total location Hilux (LOC-2026-0001)'
    )
  `);

  // Dépense de maintenance HiAce
  await conn.query(`
    INSERT INTO expenses (
      shipment_id, vehicle_id, title, category, amount, expense_date, paid_to, payment_method, recorded_by, notes
    ) VALUES (
      NULL, 5, 'Maintenance préventive HiAce CFAO', 'Maintenance camion', 145000, '2026-10-28', 'CFAO Motors Brazzaville', 'Chèque', 1, 'Entretien périodique flotte location'
    )
  `);

  console.log('[SEED RENTAL] Données de démonstration Véhicules & Locations insérées avec succès !');
  await conn.end();
}

seedVehiclesAndRentals().catch(err => {
  console.error(err);
  process.exit(1);
});

