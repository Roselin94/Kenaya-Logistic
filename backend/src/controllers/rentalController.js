const { query, get, execute } = require('../db');

/**
 * Journalisation sécurisée des actions sensibles (Audit Log)
 */
async function logAudit(userId, action, entityType, entityId, details, ipAddress = null) {
  try {
    await execute(
      'INSERT INTO rental_audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [userId || null, action, entityType, entityId, JSON.stringify(details || {}), ipAddress]
    );
  } catch (err) {
    console.error('[AUDIT_LOG_ERROR]', err.message);
  }
}

/**
 * 1. Statistiques du Tableau de bord Location
 */
exports.getRentalDashboard = async (req, res, next) => {
  try {
    const totalVehiclesRow = await get('SELECT COUNT(*) as count FROM vehicles');
    const availableVehiclesRow = await get("SELECT COUNT(*) as count FROM vehicles WHERE status = 'available'");
    const rentedVehiclesRow = await get("SELECT COUNT(*) as count FROM vehicles WHERE status = 'rented'");
    const reservedVehiclesRow = await get("SELECT COUNT(*) as count FROM vehicles WHERE status = 'reserved'");
    const maintenanceVehiclesRow = await get("SELECT COUNT(*) as count FROM vehicles WHERE status IN ('maintenance', 'immobilized')");

    const activeRentalsRow = await get("SELECT COUNT(*) as count FROM rentals WHERE status = 'active'");
    const confirmedReservationsRow = await get("SELECT COUNT(*) as count FROM rentals WHERE status = 'confirmed'");

    // Retours attendus aujourd'hui
    const returnsTodayRow = await get(`
      SELECT COUNT(*) as count FROM rentals 
      WHERE status = 'active' AND DATE(end_datetime) = CURRENT_DATE()
    `);

    // Retours en retard (date de fin dépassée et statut toujours actif)
    const lateReturnsRow = await get(`
      SELECT COUNT(*) as count FROM rentals 
      WHERE status = 'active' AND end_datetime < NOW()
    `);

    // Total des cautions en cours (locations actives ou confirmées dont la caution a été encaissée et non encore restituée)
    const activeDepositsRow = await get(`
      SELECT COALESCE(SUM(deposit_amount), 0) as total FROM rentals 
      WHERE status IN ('active', 'confirmed') AND deposit_status = 'paid'
    `);

    // Chiffre d'affaires de la location (revenus des locations payées/terminées ou actives)
    const rentalRevenueRow = await get(`
      SELECT COALESCE(SUM(paid_amount), 0) as total FROM rentals
    `);

    // Dépenses de maintenance flotte
    const maintenanceExpensesRow = await get(`
      SELECT COALESCE(SUM(cost), 0) as total FROM vehicle_maintenances WHERE status = 'completed'
    `);

    // Dernières locations actives ou réservées
    const recentRentals = await query(`
      SELECT r.*, v.brand, v.model, v.plate_number, v.category as vehicle_category,
             c.name as client_name, c.phone as client_phone
      FROM rentals r
      JOIN vehicles v ON r.vehicle_id = v.id
      JOIN clients c ON r.client_id = c.id
      ORDER BY r.created_at DESC
      LIMIT 6
    `);

    // Alertes d'assurance et de contrôle technique expirant sous 30 jours
    const alertVehicles = await query(`
      SELECT id, brand, model, plate_number, insurance_expiry, technical_inspection_expiry, status
      FROM vehicles
      WHERE (insurance_expiry IS NOT NULL AND insurance_expiry <= DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY))
         OR (technical_inspection_expiry IS NOT NULL AND technical_inspection_expiry <= DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY))
      ORDER BY insurance_expiry ASC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        fleet: {
          total: totalVehiclesRow?.count || 0,
          available: availableVehiclesRow?.count || 0,
          rented: rentedVehiclesRow?.count || 0,
          reserved: reservedVehiclesRow?.count || 0,
          maintenance: maintenanceVehiclesRow?.count || 0
        },
        rentals: {
          active: activeRentalsRow?.count || 0,
          confirmed: confirmedReservationsRow?.count || 0,
          returns_today: returnsTodayRow?.count || 0,
          late_returns: lateReturnsRow?.count || 0
        },
        finances: {
          revenue_fcfa: parseFloat(rentalRevenueRow?.total || 0),
          active_deposits_fcfa: parseFloat(activeDepositsRow?.total || 0),
          maintenance_cost_fcfa: parseFloat(maintenanceExpensesRow?.total || 0)
        },
        recentRentals,
        alertVehicles
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. Gestion de la Flotte Automobile (Vehicles CRUD)
 */
exports.getVehicles = async (req, res, next) => {
  try {
    const { status, category, transmission, search } = req.query;
    let sql = 'SELECT * FROM vehicles WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (transmission) {
      sql += ' AND transmission = ?';
      params.push(transmission);
    }
    if (search) {
      sql += ' AND (brand LIKE ? OR model LIKE ? OR plate_number LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    sql += ' ORDER BY brand ASC, model ASC';
    const vehicles = await query(sql, params);

    res.json({ success: true, count: vehicles.length, data: vehicles });
  } catch (err) {
    next(err);
  }
};

exports.getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await get('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Véhicule introuvable.' });
    }

    // Historique des locations de ce véhicule
    const rentals = await query(`
      SELECT r.*, c.name as client_name, c.phone as client_phone
      FROM rentals r
      JOIN clients c ON r.client_id = c.id
      WHERE r.vehicle_id = ?
      ORDER BY r.start_datetime DESC
      LIMIT 10
    `, [vehicle.id]);

    // Historique des maintenances
    const maintenances = await query(`
      SELECT * FROM vehicle_maintenances WHERE vehicle_id = ? ORDER BY scheduled_date DESC
    `, [vehicle.id]);

    res.json({
      success: true,
      data: {
        ...vehicle,
        rentals,
        maintenances
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.createVehicle = async (req, res, next) => {
  try {
    const {
      brand, model, plate_number, year, category, transmission, fuel_type, seats,
      mileage, color, rate_hourly, rate_daily, rate_weekly, rate_monthly, deposit_amount,
      status, insurance_company, insurance_policy_number, insurance_expiry,
      technical_inspection_date, technical_inspection_expiry, gps_tracker_id, notes
    } = req.body;

    if (!brand || !model || !plate_number || !year) {
      return res.status(400).json({ success: false, message: 'Veuillez renseigner la marque, le modèle, l\'immatriculation et l\'année.' });
    }

    // Vérifier immatriculation unique
    const existing = await get('SELECT id FROM vehicles WHERE plate_number = ?', [plate_number.trim()]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Un véhicule possède déjà cette plaque d\'immatriculation.' });
    }

    const result = await execute(`
      INSERT INTO vehicles (
        brand, model, plate_number, year, category, transmission, fuel_type, seats,
        mileage, color, rate_hourly, rate_daily, rate_weekly, rate_monthly, deposit_amount,
        status, insurance_company, insurance_policy_number, insurance_expiry,
        technical_inspection_date, technical_inspection_expiry, gps_tracker_id, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      brand, model, plate_number.trim().toUpperCase(), year, category || 'SUV / 4x4',
      transmission || 'Automatique', fuel_type || 'Diesel', seats || 5, mileage || 0,
      color, rate_hourly || 5000, rate_daily || 35000, rate_weekly || 210000, rate_monthly || 750000,
      deposit_amount || 150000, status || 'available', insurance_company, insurance_policy_number,
      insurance_expiry || null, technical_inspection_date || null, technical_inspection_expiry || null,
      gps_tracker_id, notes
    ]);

    await logAudit(req.user?.id, 'CREATE_VEHICLE', 'vehicle', result.insertId, { brand, model, plate_number });

    res.status(201).json({
      success: true,
      message: 'Véhicule enregistré avec succès dans le parc automobile.',
      vehicleId: result.insertId
    });
  } catch (err) {
    next(err);
  }
};

exports.updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vehicle = await get('SELECT * FROM vehicles WHERE id = ?', [id]);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Véhicule introuvable.' });
    }

    const {
      brand, model, plate_number, year, category, transmission, fuel_type, seats,
      mileage, color, rate_hourly, rate_daily, rate_weekly, rate_monthly, deposit_amount,
      status, insurance_company, insurance_policy_number, insurance_expiry,
      technical_inspection_date, technical_inspection_expiry, gps_tracker_id, gps_last_location, notes
    } = req.body;

    if (plate_number && plate_number !== vehicle.plate_number) {
      const duplicate = await get('SELECT id FROM vehicles WHERE plate_number = ? AND id != ?', [plate_number, id]);
      if (duplicate) {
        return res.status(400).json({ success: false, message: 'Cette immatriculation est déjà attribuée à un autre véhicule.' });
      }
    }

    await execute(`
      UPDATE vehicles SET
        brand = ?, model = ?, plate_number = ?, year = ?, category = ?, transmission = ?,
        fuel_type = ?, seats = ?, mileage = ?, color = ?, rate_hourly = ?, rate_daily = ?,
        rate_weekly = ?, rate_monthly = ?, deposit_amount = ?, status = ?, insurance_company = ?,
        insurance_policy_number = ?, insurance_expiry = ?, technical_inspection_date = ?,
        technical_inspection_expiry = ?, gps_tracker_id = ?, gps_last_location = ?, notes = ?
      WHERE id = ?
    `, [
      brand || vehicle.brand, model || vehicle.model, (plate_number || vehicle.plate_number).toUpperCase(),
      year || vehicle.year, category || vehicle.category, transmission || vehicle.transmission,
      fuel_type || vehicle.fuel_type, seats || vehicle.seats, mileage !== undefined ? mileage : vehicle.mileage,
      color || vehicle.color, rate_hourly || vehicle.rate_hourly, rate_daily || vehicle.rate_daily,
      rate_weekly || vehicle.rate_weekly, rate_monthly || vehicle.rate_monthly,
      deposit_amount !== undefined ? deposit_amount : vehicle.deposit_amount,
      status || vehicle.status, insurance_company || vehicle.insurance_company,
      insurance_policy_number || vehicle.insurance_policy_number, insurance_expiry || vehicle.insurance_expiry,
      technical_inspection_date || vehicle.technical_inspection_date, technical_inspection_expiry || vehicle.technical_inspection_expiry,
      gps_tracker_id || vehicle.gps_tracker_id, gps_last_location || vehicle.gps_last_location,
      notes !== undefined ? notes : vehicle.notes, id
    ]);

    await logAudit(req.user?.id, 'UPDATE_VEHICLE', 'vehicle', id, { brand, model, status });

    res.json({ success: true, message: 'Fiche véhicule mise à jour avec succès.' });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. Vérification de Disponibilité & Prévention des Doubles Réservations
 */
exports.checkAvailability = async (req, res, next) => {
  try {
    const { vehicle_id, start_datetime, end_datetime, exclude_rental_id } = req.query;

    if (!vehicle_id || !start_datetime || !end_datetime) {
      return res.status(400).json({ success: false, message: 'Paramètres manquants (véhicule, début et fin requis).' });
    }

    const vehicle = await get('SELECT id, brand, model, plate_number, status, rate_daily, deposit_amount FROM vehicles WHERE id = ?', [vehicle_id]);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Véhicule introuvable.' });
    }

    if (vehicle.status === 'immobilized' || vehicle.status === 'maintenance') {
      return res.json({
        available: false,
        message: `Le véhicule est actuellement ${vehicle.status === 'maintenance' ? 'en maintenance' : 'immobilisé'}.`
      });
    }

    let sql = `
      SELECT id, rental_number, start_datetime, end_datetime, status
      FROM rentals
      WHERE vehicle_id = ?
        AND status IN ('confirmed', 'active')
        AND (
          (start_datetime <= ? AND end_datetime >= ?) OR
          (start_datetime <= ? AND end_datetime >= ?) OR
          (start_datetime >= ? AND end_datetime <= ?)
        )
    `;
    const params = [vehicle_id, start_datetime, start_datetime, end_datetime, end_datetime, start_datetime, end_datetime];

    if (exclude_rental_id) {
      sql += ' AND id != ?';
      params.push(exclude_rental_id);
    }

    const conflicts = await query(sql, params);

    if (conflicts && conflicts.length > 0) {
      return res.json({
        available: false,
        message: 'Ce véhicule fait déjà l\'objet d\'une réservation confirmée ou en cours sur ce créneau.',
        conflicts
      });
    }

    res.json({
      available: true,
      message: 'Véhicule parfaitement disponible pour ces dates.',
      vehicle
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 4. Gestion des Réservations & Locations (Rentals CRUD)
 */
exports.getRentals = async (req, res, next) => {
  try {
    const { status, client_id, vehicle_id, search } = req.query;
    let sql = `
      SELECT r.*, v.brand, v.model, v.plate_number, v.category,
             c.name as client_name, c.phone as client_phone, c.email as client_email,
             u.name as creator_name
      FROM rentals r
      JOIN vehicles v ON r.vehicle_id = v.id
      JOIN clients c ON r.client_id = c.id
      LEFT JOIN users u ON r.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND r.status = ?';
      params.push(status);
    }
    if (client_id) {
      sql += ' AND r.client_id = ?';
      params.push(client_id);
    }
    if (vehicle_id) {
      sql += ' AND r.vehicle_id = ?';
      params.push(vehicle_id);
    }
    if (search) {
      sql += ' AND (r.rental_number LIKE ? OR c.name LIKE ? OR v.plate_number LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    sql += ' ORDER BY r.created_at DESC';
    const rentals = await query(sql, params);

    res.json({ success: true, count: rentals.length, data: rentals });
  } catch (err) {
    next(err);
  }
};

exports.getRentalById = async (req, res, next) => {
  try {
    const rental = await get(`
      SELECT r.*, v.brand, v.model, v.plate_number, v.category, v.mileage as vehicle_mileage,
             v.transmission, v.fuel_type, v.color, v.photos as vehicle_photos,
             c.name as client_name, c.phone as client_phone, c.email as client_email,
             c.address as client_address, c.id_number as client_id_number,
             u.name as creator_name
      FROM rentals r
      JOIN vehicles v ON r.vehicle_id = v.id
      JOIN clients c ON r.client_id = c.id
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.id = ?
    `, [req.params.id]);

    if (!rental) {
      return res.status(404).json({ success: false, message: 'Dossier de location introuvable.' });
    }

    // États des lieux (départ et retour)
    const inspections = await query(`
      SELECT ri.*, u.name as inspector_name
      FROM rental_inspections ri
      LEFT JOIN users u ON ri.inspector_id = u.id
      WHERE ri.rental_id = ?
      ORDER BY ri.type ASC
    `, [rental.id]);

    // Paiements liés à cette location
    const payments = await query(`
      SELECT p.*, u.name as recorded_by_name
      FROM payments p
      LEFT JOIN users u ON p.recorded_by = u.id
      WHERE p.rental_id = ?
      ORDER BY p.payment_date DESC
    `, [rental.id]);

    // Facture associée
    const invoice = await get('SELECT * FROM invoices WHERE rental_id = ?', [rental.id]);

    res.json({
      success: true,
      data: {
        ...rental,
        inspections,
        payments,
        invoice
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.createRental = async (req, res, next) => {
  try {
    const {
      vehicle_id, client_id, start_datetime, end_datetime, rate_type = 'daily',
      driver_included = false, driver_fee = 0, destination_usage = 'Brazzaville & Environs',
      discount = 0, initial_payment = 0, payment_method = 'Espèces', notes
    } = req.body;

    if (!vehicle_id || !client_id || !start_datetime || !end_datetime) {
      return res.status(400).json({ success: false, message: 'Véhicule, client, date de début et fin requis.' });
    }

    const vehicle = await get('SELECT * FROM vehicles WHERE id = ?', [vehicle_id]);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Véhicule introuvable.' });
    }

    // 1. Contrôle anti double-réservation
    const conflicts = await query(`
      SELECT id, rental_number FROM rentals
      WHERE vehicle_id = ?
        AND status IN ('confirmed', 'active')
        AND (
          (start_datetime <= ? AND end_datetime >= ?) OR
          (start_datetime <= ? AND end_datetime >= ?) OR
          (start_datetime >= ? AND end_datetime <= ?)
        )
    `, [vehicle_id, start_datetime, start_datetime, end_datetime, end_datetime, start_datetime, end_datetime]);

    if (conflicts && conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ce véhicule n\'est pas disponible pour ce créneau (conflit de réservation).'
      });
    }

    // 2. Calcul automatique de durée et coût selon le type de tarif
    const start = new Date(start_datetime);
    const end = new Date(end_datetime);
    const diffHours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)));
    const diffDays = Math.max(1, Math.ceil(diffHours / 24));

    let unitRate = parseFloat(vehicle.rate_daily);
    let durationUnits = diffDays;

    if (rate_type === 'hourly') {
      unitRate = parseFloat(vehicle.rate_hourly);
      durationUnits = diffHours;
    } else if (rate_type === 'weekly') {
      unitRate = parseFloat(vehicle.rate_weekly);
      durationUnits = Math.max(1, Math.ceil(diffDays / 7));
    } else if (rate_type === 'monthly') {
      unitRate = parseFloat(vehicle.rate_monthly);
      durationUnits = Math.max(1, Math.ceil(diffDays / 30));
    }

    const subtotal = unitRate * durationUnits;
    const totalAmount = Math.max(0, subtotal + parseFloat(driver_fee || 0) - parseFloat(discount || 0));
    const depositAmount = parseFloat(vehicle.deposit_amount || 150000);
    const paidAmount = parseFloat(initial_payment || 0);

    let paymentStatus = 'pending';
    if (paidAmount >= totalAmount) paymentStatus = 'paid';
    else if (paidAmount > 0) paymentStatus = 'partial';

    // 3. Génération du numéro de contrat de location normalisé LOC-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const countRow = await get('SELECT COUNT(*) as count FROM rentals');
    const seq = (countRow?.count || 0) + 1;
    const rentalNumber = `LOC-${currentYear}-${String(seq).padStart(4, '0')}`;

    const rentalResult = await execute(`
      INSERT INTO rentals (
        rental_number, vehicle_id, client_id, start_datetime, end_datetime, rate_type,
        unit_rate, duration_units, subtotal, deposit_amount, deposit_status, driver_included,
        driver_fee, discount, total_amount, paid_amount, payment_status, status,
        destination_usage, created_by, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      rentalNumber, vehicle_id, client_id, start_datetime, end_datetime, rate_type,
      unitRate, durationUnits, subtotal, depositAmount, 'pending', driver_included ? 1 : 0,
      driver_fee || 0, discount || 0, totalAmount, paidAmount, paymentStatus, 'confirmed',
      destination_usage, req.user?.id || 1, notes
    ]);

    const rentalId = rentalResult.insertId;

    // 4. Mettre à jour le statut du véhicule
    await execute("UPDATE vehicles SET status = 'reserved' WHERE id = ?", [vehicle_id]);

    // 5. Si acompte versé, enregistrer dans payments
    if (paidAmount > 0) {
      await execute(`
        INSERT INTO payments (shipment_id, rental_id, client_id, amount, payment_method, reference, payment_date, recorded_by, notes)
        VALUES (NULL, ?, ?, ?, ?, ?, NOW(), ?, ?)
      `, [rentalId, client_id, paidAmount, payment_method, `Acompte contrat ${rentalNumber}`, req.user?.id || 1, 'Encaissement initial location']);
    }

    // 6. Génération automatique de la facture correspondante
    const invCount = await get('SELECT COUNT(*) as count FROM invoices');
    const invoiceNumber = `FACT-LOC-${currentYear}-${String((invCount?.count || 0) + 1).padStart(4, '0')}`;

    await execute(`
      INSERT INTO invoices (invoice_number, shipment_id, rental_id, client_id, issue_date, due_date, subtotal, total_amount, paid_amount, status, notes)
      VALUES (?, NULL, ?, ?, CURRENT_DATE(), DATE(DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY)), ?, ?, ?, ?, ?)
    `, [
      invoiceNumber, rentalId, client_id, subtotal, totalAmount, paidAmount,
      paymentStatus === 'paid' ? 'paid' : (paymentStatus === 'partial' ? 'partially_paid' : 'unpaid'),
      `Facturation contrat de location ${rentalNumber}`
    ]);

    await logAudit(req.user?.id, 'CREATE_RENTAL', 'rental', rentalId, { rentalNumber, totalAmount, vehicle_id, client_id });

    res.status(201).json({
      success: true,
      message: 'Contrat de location créé avec succès.',
      rentalId,
      rentalNumber,
      totalAmount
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 5. Actions sur la location : Activation (Départ), Clôture (Retour), Prolongation, Annulation
 */
exports.startRental = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { mileage, fuel_level, cleanliness, existing_damages, deposit_received } = req.body;

    const rental = await get('SELECT * FROM rentals WHERE id = ?', [id]);
    if (!rental) return res.status(404).json({ success: false, message: 'Location introuvable.' });

    // Enregistrer état des lieux de départ
    await execute(`
      INSERT INTO rental_inspections (rental_id, type, inspection_date, mileage, fuel_level, cleanliness, existing_damages, inspector_id, client_signed)
      VALUES (?, 'departure', NOW(), ?, ?, ?, ?, ?, 1)
    `, [id, mileage || 0, fuel_level || 'Full', cleanliness || 'clean', existing_damages || 'Véhicule conforme.', req.user?.id || 1]);

    // Mettre à jour la location et le statut du véhicule
    await execute("UPDATE rentals SET status = 'active', deposit_status = ? WHERE id = ?", [
      deposit_received ? 'paid' : rental.deposit_status, id
    ]);
    await execute("UPDATE vehicles SET status = 'rented', mileage = ? WHERE id = ?", [mileage || 0, rental.vehicle_id]);

    await logAudit(req.user?.id, 'START_RENTAL', 'rental', id, { mileage, deposit_received });

    res.json({ success: true, message: 'Véhicule remis au client. Location désormais active.' });
  } catch (err) {
    next(err);
  }
};

exports.completeRental = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      mileage, fuel_level, cleanliness, new_damages, damage_fee = 0, late_fee = 0,
      fuel_charge = 0, refund_deposit = true
    } = req.body;

    const rental = await get('SELECT * FROM rentals WHERE id = ?', [id]);
    if (!rental) return res.status(404).json({ success: false, message: 'Location introuvable.' });

    // Enregistrer l'état des lieux de retour
    await execute(`
      INSERT INTO rental_inspections (rental_id, type, inspection_date, mileage, fuel_level, cleanliness, new_damages, damage_cost, inspector_id, client_signed)
      VALUES (?, 'return', NOW(), ?, ?, ?, ?, ?, ?, 1)
    `, [id, mileage || 0, fuel_level || 'Full', cleanliness || 'clean', new_damages || 'Aucun nouveau dommage.', damage_fee || 0, req.user?.id || 1]);

    const addFees = parseFloat(damage_fee || 0) + parseFloat(late_fee || 0) + parseFloat(fuel_charge || 0);
    const newTotal = parseFloat(rental.total_amount) + addFees;

    let depositStatus = rental.deposit_status;
    let retainedAmount = 0;
    if (addFees > 0 && rental.deposit_status === 'paid') {
      retainedAmount = Math.min(addFees, parseFloat(rental.deposit_amount));
      depositStatus = retainedAmount === parseFloat(rental.deposit_amount) ? 'retained' : 'partially_refunded';
    } else if (refund_deposit) {
      depositStatus = 'refunded';
    }

    await execute(`
      UPDATE rentals SET
        status = 'completed',
        actual_return_datetime = NOW(),
        late_fee = ?,
        damage_fee = ?,
        fuel_charge = ?,
        total_amount = ?,
        deposit_status = ?,
        deposit_retained_amount = ?
      WHERE id = ?
    `, [late_fee || 0, damage_fee || 0, fuel_charge || 0, newTotal, depositStatus, retainedAmount, id]);

    // Remettre le véhicule en statut disponible avec son nouveau kilométrage
    await execute("UPDATE vehicles SET status = 'available', mileage = ? WHERE id = ?", [mileage || 0, rental.vehicle_id]);

    await logAudit(req.user?.id, 'COMPLETE_RENTAL', 'rental', id, { mileage, addFees, depositStatus });

    res.json({
      success: true,
      message: 'Location clôturée avec succès. État des lieux de retour validé et caution actualisée.'
    });
  } catch (err) {
    next(err);
  }
};

exports.cancelRental = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    const rental = await get('SELECT * FROM rentals WHERE id = ?', [id]);
    if (!rental) return res.status(404).json({ success: false, message: 'Location introuvable.' });

    if (rental.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Impossible d\'annuler une location déjà terminée.' });
    }

    await execute(`
      UPDATE rentals SET status = 'cancelled', cancellation_reason = ?, cancellation_date = NOW() WHERE id = ?
    `, [cancellation_reason || 'Annulation demandée par le client', id]);

    // Libérer le véhicule
    await execute("UPDATE vehicles SET status = 'available' WHERE id = ?", [rental.vehicle_id]);

    await logAudit(req.user?.id, 'CANCEL_RENTAL', 'rental', id, { cancellation_reason });

    res.json({ success: true, message: 'Réservation annulée. Le véhicule est de nouveau disponible.' });
  } catch (err) {
    next(err);
  }
};

/**
 * 6. Gestion de la Maintenance de la Flotte
 */
exports.getMaintenances = async (req, res, next) => {
  try {
    const { vehicle_id, status } = req.query;
    let sql = `
      SELECT vm.*, v.brand, v.model, v.plate_number, u.name as performed_by_name
      FROM vehicle_maintenances vm
      JOIN vehicles v ON vm.vehicle_id = v.id
      LEFT JOIN users u ON vm.performed_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (vehicle_id) {
      sql += ' AND vm.vehicle_id = ?';
      params.push(vehicle_id);
    }
    if (status) {
      sql += ' AND vm.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY vm.scheduled_date DESC';
    const rows = await query(sql, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.createMaintenance = async (req, res, next) => {
  try {
    const {
      vehicle_id, title, type, scheduled_date, cost = 0, garage_name,
      invoice_ref, notes, set_vehicle_maintenance = true
    } = req.body;

    if (!vehicle_id || !title || !scheduled_date) {
      return res.status(400).json({ success: false, message: 'Véhicule, titre et date prévus requis.' });
    }

    const result = await execute(`
      INSERT INTO vehicle_maintenances (
        vehicle_id, title, type, status, scheduled_date, cost, garage_name, invoice_ref, performed_by, notes
      ) VALUES (?, ?, ?, 'scheduled', ?, ?, ?, ?, ?, ?)
    `, [vehicle_id, title, type || 'Vidange', scheduled_date, cost || 0, garage_name, invoice_ref, req.user?.id || 1, notes]);

    if (set_vehicle_maintenance) {
      await execute("UPDATE vehicles SET status = 'maintenance' WHERE id = ?", [vehicle_id]);
    }

    // Intégrer automatiquement aux dépenses existantes de la plateforme
    if (parseFloat(cost) > 0) {
      await execute(`
        INSERT INTO expenses (shipment_id, vehicle_id, title, category, amount, expense_date, paid_to, payment_method, recorded_by, notes)
        VALUES (NULL, ?, ?, 'Maintenance camion', ?, ?, 'Espèces', ?, ?)
      `, [vehicle_id, `Entretien flotte : ${title}`, cost, scheduled_date, garage_name || 'Garage partenaire', req.user?.id || 1, notes]);
    }

    res.status(201).json({ success: true, message: 'Entretien programmé avec succès.', maintenanceId: result.insertId });
  } catch (err) {
    next(err);
  }
};

