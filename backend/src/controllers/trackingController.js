const db = require('../db');

// Recherche publique par numéro de suivi (accès client sans authentification)
async function trackPublic(req, res, next) {
  try {
    const { trackingNumber } = req.params;

    if (!trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez saisir un numéro de suivi valide.'
      });
    }

    const cleanCode = trackingNumber.trim().toUpperCase();

    const shipment = await db.get(`
      SELECT 
        s.id, s.tracking_number, s.origin, s.destination, 
        s.sender_name, s.receiver_name, s.carrier_name, s.vehicle_plate,
        s.departure_date, s.estimated_arrival, s.actual_arrival,
        s.status, s.payment_status, s.created_at,
        (SELECT COUNT(*) FROM cargo_items WHERE shipment_id = s.id) as cargo_count,
        (SELECT COALESCE(SUM(weight_kg), 0) FROM cargo_items WHERE shipment_id = s.id) as total_weight
      FROM shipments s
      WHERE UPPER(s.tracking_number) = ?
    `, [cleanCode]);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: `Aucune expédition trouvée pour le numéro de suivi "${cleanCode}". Vérifiez votre référence.`
      });
    }

    // Récupération de la chronologie des événements
    const events = await db.query(`
      SELECT id, status, location, description, created_at
      FROM tracking_events
      WHERE shipment_id = ?
      ORDER BY id ASC
    `, [shipment.id]);

    // Marchandises sommaires
    const cargo = await db.query(`
      SELECT designation, category, quantity, unit, weight_kg, status
      FROM cargo_items
      WHERE shipment_id = ?
    `, [shipment.id]);

    res.json({
      success: true,
      data: {
        shipment,
        events,
        cargo
      }
    });
  } catch (err) {
    next(err);
  }
}

// Ajout d'une étape manuelle dans la timeline (gestionnaire / agent)
async function addTrackingEvent(req, res, next) {
  try {
    const { shipment_id, status, location, description } = req.body;

    if (!shipment_id || !status || !location || !description) {
      return res.status(400).json({
        success: false,
        message: 'L\'ID de l\'expédition, le statut, le lieu et la description sont obligatoires.'
      });
    }

    const shipment = await db.get('SELECT * FROM shipments WHERE id = ?', [shipment_id]);
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Expédition introuvable.' });
    }

    // Mettre à jour le statut du colis
    let actualArrival = shipment.actual_arrival;
    if (status === 'livrée' || status === 'arrivée à destination') {
      actualArrival = new Date().toISOString().split('T')[0];
    }

    await db.execute(
      'UPDATE shipments SET status = ?, actual_arrival = ? WHERE id = ?',
      [status, actualArrival, shipment_id]
    );

    // Mettre à jour les marchandises
    let cargoStatus = 'en transit';
    if (status === 'arrivée à destination') cargoStatus = 'au dépôt';
    if (status === 'livrée') cargoStatus = 'livrée';
    if (status === 'annulée') cargoStatus = 'annulée';

    await db.execute('UPDATE cargo_items SET status = ? WHERE shipment_id = ?', [cargoStatus, shipment_id]);

    // Insérer l'événement
    const result = await db.execute(`
      INSERT INTO tracking_events (shipment_id, status, location, description, updated_by)
      VALUES (?, ?, ?, ?, ?)
    `, [
      shipment_id,
      status,
      location.trim(),
      description.trim(),
      req.user ? req.user.id : null
    ]);

    const createdEvent = await db.get('SELECT * FROM tracking_events WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Événement de suivi ajouté avec succès à la timeline.',
      data: createdEvent
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  trackPublic,
  addTrackingEvent
};

