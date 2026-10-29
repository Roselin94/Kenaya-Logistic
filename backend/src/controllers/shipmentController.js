const db = require('../db');

// Générateur de numéro de suivi unique pour KENAYA LOGISTIC : KN-YYYY-XXXX
async function generateTrackingNumber() {
  const currentYear = new Date().getFullYear();
  const lastShipment = await db.get(`
    SELECT tracking_number FROM shipments 
    WHERE tracking_number LIKE 'KN-${currentYear}-%' 
    ORDER BY id DESC LIMIT 1
  `);

  let nextSequence = 101;
  if (lastShipment && lastShipment.tracking_number) {
    const parts = lastShipment.tracking_number.split('-');
    if (parts.length === 3) {
      const num = parseInt(parts[2], 10);
      if (!isNaN(num)) {
        nextSequence = num + 1;
      }
    }
  }

  return `KN-${currentYear}-${String(nextSequence).padStart(4, '0')}`;
}

async function getAllShipments(req, res, next) {
  try {
    const { status, origin, destination, clientId, search, startDate, endDate } = req.query;

    let queryStr = `
      SELECT 
        s.*,
        c.name as client_name,
        c.phone as client_phone,
        c.city as client_city,
        (SELECT COUNT(*) FROM cargo_items WHERE shipment_id = s.id) as cargo_count,
        (SELECT COALESCE(SUM(weight_kg), 0) FROM cargo_items WHERE shipment_id = s.id) as total_weight,
        (SELECT COALESCE(SUM(volume_cbm), 0) FROM cargo_items WHERE shipment_id = s.id) as total_volume
      FROM shipments s
      JOIN clients c ON s.client_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      queryStr += ' AND s.status = ?';
      params.push(status);
    }

    if (origin) {
      queryStr += ' AND s.origin = ?';
      params.push(origin);
    }

    if (destination) {
      queryStr += ' AND s.destination = ?';
      params.push(destination);
    }

    if (clientId) {
      queryStr += ' AND s.client_id = ?';
      params.push(clientId);
    }

    if (startDate) {
      queryStr += ' AND s.departure_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      queryStr += ' AND s.departure_date <= ?';
      params.push(endDate);
    }

    if (search) {
      queryStr += ` AND (
        s.tracking_number LIKE ? OR 
        s.sender_name LIKE ? OR 
        s.receiver_name LIKE ? OR 
        s.carrier_name LIKE ? OR
        s.vehicle_plate LIKE ? OR
        c.name LIKE ?
      )`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term, term);
    }

    queryStr += ' ORDER BY s.id DESC';

    const shipments = await db.query(queryStr, params);

    res.json({
      success: true,
      count: shipments.length,
      data: shipments
    });
  } catch (err) {
    next(err);
  }
}

async function getShipmentById(req, res, next) {
  try {
    const { id } = req.params;

    const shipment = await db.get(`
      SELECT 
        s.*,
        c.name as client_name,
        c.phone as client_phone,
        c.email as client_email,
        c.address as client_address,
        u.name as creator_name
      FROM shipments s
      JOIN clients c ON s.client_id = c.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = ?
    `, [id]);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Expédition introuvable.'
      });
    }

    // Marchandises contenues
    const cargo = await db.query('SELECT * FROM cargo_items WHERE shipment_id = ?', [id]);

    // Timeline des événements de suivi
    const trackingEvents = await db.query(`
      SELECT te.*, u.name as agent_name
      FROM tracking_events te
      LEFT JOIN users u ON te.updated_by = u.id
      WHERE te.shipment_id = ?
      ORDER BY te.id ASC
    `, [id]);

    // Paiements associés
    const payments = await db.query('SELECT * FROM payments WHERE shipment_id = ? ORDER BY id DESC', [id]);

    // Dépenses associées à ce voyage
    const expenses = await db.query('SELECT * FROM expenses WHERE shipment_id = ? ORDER BY id DESC', [id]);

    // Facture associée
    const invoice = await db.get('SELECT * FROM invoices WHERE shipment_id = ?', [id]);

    res.json({
      success: true,
      data: {
        ...shipment,
        cargo,
        trackingEvents,
        payments,
        expenses,
        invoice
      }
    });
  } catch (err) {
    next(err);
  }
}

async function createShipment(req, res, next) {
  try {
    const {
      client_id,
      origin,
      destination,
      sender_name,
      sender_phone,
      receiver_name,
      receiver_phone,
      receiver_address,
      carrier_name,
      carrier_phone,
      vehicle_plate,
      departure_date,
      estimated_arrival,
      shipping_cost,
      insurance_cost,
      other_fees,
      notes,
      cargo_ids // ID des marchandises à associer
    } = req.body;

    if (!client_id || !sender_name || !receiver_name || !receiver_phone) {
      return res.status(400).json({
        success: false,
        message: 'Le client, l\'expéditeur et le destinataire sont obligatoires.'
      });
    }

    const tracking_number = await generateTrackingNumber();

    const costShipping = parseFloat(shipping_cost || 0);
    const costInsurance = parseFloat(insurance_cost || 0);
    const costOther = parseFloat(other_fees || 0);
    const total_cost = costShipping + costInsurance + costOther;

    const result = await db.execute(`
      INSERT INTO shipments (
        tracking_number, client_id, origin, destination,
        sender_name, sender_phone, receiver_name, receiver_phone, receiver_address,
        carrier_name, carrier_phone, vehicle_plate,
        departure_date, estimated_arrival,
        shipping_cost, insurance_cost, other_fees, total_cost, paid_amount,
        payment_status, status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'pending', 'en attente', ?, ?)
    `, [
      tracking_number,
      client_id,
      origin || 'Brazzaville',
      destination || 'Pointe-Noire',
      sender_name.trim(),
      sender_phone || '',
      receiver_name.trim(),
      receiver_phone.trim(),
      receiver_address || '',
      carrier_name || 'Flotte Kenaya',
      carrier_phone || '',
      vehicle_plate || '',
      departure_date || new Date().toISOString().split('T')[0],
      estimated_arrival || null,
      costShipping,
      costInsurance,
      costOther,
      total_cost,
      notes || '',
      req.user ? req.user.id : null
    ]);

    const shipmentId = result.insertId;

    // Lier les marchandises sélectionnées à cette expédition
    if (cargo_ids && Array.isArray(cargo_ids) && cargo_ids.length > 0) {
      for (const cId of cargo_ids) {
        await db.execute(
          'UPDATE cargo_items SET shipment_id = ?, status = ? WHERE id = ?',
          [shipmentId, 'en attente d\'expédition', cId]
        );
      }
    }

    // Événement initial de suivi (Timeline)
    await db.execute(`
      INSERT INTO tracking_events (shipment_id, status, location, description, updated_by)
      VALUES (?, 'en attente', ?, 'Création de l\'expédition et prise en charge des marchandises au dépôt Kenaya Logistic.', ?)
    `, [
      shipmentId,
      origin || 'Brazzaville (Dépôt Principal)',
      req.user ? req.user.id : null
    ]);

    // Génération automatique de la facture correspondante
    const invoiceNumber = `FAC-${tracking_number.replace('KN-', '')}`;
    await db.execute(`
      INSERT INTO invoices (
        invoice_number, shipment_id, client_id, issue_date, due_date,
        subtotal, tax_rate, tax_amount, discount, total_amount, paid_amount, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?, 0, 'unpaid', 'Facture émise lors de la création de l\'expédition.')
    `, [
      invoiceNumber,
      shipmentId,
      client_id,
      new Date().toISOString().split('T')[0],
      estimated_arrival || null,
      total_cost,
      total_cost
    ]);

    const created = await db.get('SELECT * FROM shipments WHERE id = ?', [shipmentId]);

    res.status(201).json({
      success: true,
      message: `Expédition ${tracking_number} enregistrée avec succès.`,
      data: created
    });
  } catch (err) {
    next(err);
  }
}

async function updateShipment(req, res, next) {
  try {
    const { id } = req.params;
    const {
      origin,
      destination,
      sender_name,
      sender_phone,
      receiver_name,
      receiver_phone,
      receiver_address,
      carrier_name,
      carrier_phone,
      vehicle_plate,
      departure_date,
      estimated_arrival,
      shipping_cost,
      insurance_cost,
      other_fees,
      notes
    } = req.body;

    const existing = await db.get('SELECT * FROM shipments WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Expédition introuvable.' });
    }

    const costShipping = shipping_cost !== undefined ? parseFloat(shipping_cost) : parseFloat(existing.shipping_cost);
    const costInsurance = insurance_cost !== undefined ? parseFloat(insurance_cost) : parseFloat(existing.insurance_cost);
    const costOther = other_fees !== undefined ? parseFloat(other_fees) : parseFloat(existing.other_fees);
    const total_cost = costShipping + costInsurance + costOther;

    await db.execute(`
      UPDATE shipments SET
        origin = ?,
        destination = ?,
        sender_name = ?,
        sender_phone = ?,
        receiver_name = ?,
        receiver_phone = ?,
        receiver_address = ?,
        carrier_name = ?,
        carrier_phone = ?,
        vehicle_plate = ?,
        departure_date = ?,
        estimated_arrival = ?,
        shipping_cost = ?,
        insurance_cost = ?,
        other_fees = ?,
        total_cost = ?,
        notes = ?
      WHERE id = ?
    `, [
      origin || existing.origin,
      destination || existing.destination,
      sender_name || existing.sender_name,
      sender_phone || existing.sender_phone,
      receiver_name || existing.receiver_name,
      receiver_phone || existing.receiver_phone,
      receiver_address !== undefined ? receiver_address : existing.receiver_address,
      carrier_name !== undefined ? carrier_name : existing.carrier_name,
      carrier_phone !== undefined ? carrier_phone : existing.carrier_phone,
      vehicle_plate !== undefined ? vehicle_plate : existing.vehicle_plate,
      departure_date || existing.departure_date,
      estimated_arrival || existing.estimated_arrival,
      costShipping,
      costInsurance,
      costOther,
      total_cost,
      notes !== undefined ? notes : existing.notes,
      id
    ]);

    // Mettre à jour le montant de la facture si le total a changé
    await db.execute(
      'UPDATE invoices SET subtotal = ?, total_amount = ? WHERE shipment_id = ?',
      [total_cost, total_cost, id]
    );

    const updated = await db.get('SELECT * FROM shipments WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Expédition mise à jour avec succès.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

async function updateShipmentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, location, description } = req.body;

    const allowedStatuses = ['en attente', 'en transit', 'arrivée à destination', 'livrée', 'annulée'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Statut invalide. Statuts autorisés : ${allowedStatuses.join(', ')}.`
      });
    }

    const shipment = await db.get('SELECT * FROM shipments WHERE id = ?', [id]);
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Expédition introuvable.' });
    }

    let actualArrival = shipment.actual_arrival;
    if (status === 'livrée' || status === 'arrivée à destination') {
      actualArrival = new Date().toISOString().split('T')[0];
    }

    // 1. Mettre à jour le statut de l'expédition
    await db.execute(
      'UPDATE shipments SET status = ?, actual_arrival = ? WHERE id = ?',
      [status, actualArrival, id]
    );

    // 2. Mettre à jour le statut des marchandises liées
    let cargoStatus = 'en attente d\'expédition';
    if (status === 'en transit') cargoStatus = 'en transit';
    else if (status === 'arrivée à destination') cargoStatus = 'au dépôt';
    else if (status === 'livrée') cargoStatus = 'livrée';
    else if (status === 'annulée') cargoStatus = 'annulée';

    await db.execute('UPDATE cargo_items SET status = ? WHERE shipment_id = ?', [cargoStatus, id]);

    // 3. Ajouter l'événement dans le journal de suivi (Timeline)
    const eventLocation = location || (status === 'livrée' ? shipment.destination : (status === 'en transit' ? 'En route RN1' : shipment.origin));
    const eventDesc = description || `Statut mis à jour : expédition ${status}.`;

    await db.execute(`
      INSERT INTO tracking_events (shipment_id, status, location, description, updated_by)
      VALUES (?, ?, ?, ?, ?)
    `, [
      id,
      status,
      eventLocation,
      eventDesc,
      req.user ? req.user.id : null
    ]);

    const updatedShipment = await db.get('SELECT * FROM shipments WHERE id = ?', [id]);

    res.json({
      success: true,
      message: `Statut de l'expédition mis à jour : "${status}".`,
      data: updatedShipment
    });
  } catch (err) {
    next(err);
  }
}

async function deleteShipment(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await db.get('SELECT * FROM shipments WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Expédition introuvable.' });
    }

    // Dissocier les marchandises
    await db.execute('UPDATE cargo_items SET shipment_id = NULL, status = "enregistrée" WHERE shipment_id = ?', [id]);

    // Supprimer les événements de suivi et la facture
    await db.execute('DELETE FROM tracking_events WHERE shipment_id = ?', [id]);
    await db.execute('DELETE FROM invoices WHERE shipment_id = ?', [id]);
    await db.execute('DELETE FROM payments WHERE shipment_id = ?', [id]);
    await db.execute('DELETE FROM expenses WHERE shipment_id = ?', [id]);

    await db.execute('DELETE FROM shipments WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Expédition supprimée avec succès.'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllShipments,
  getShipmentById,
  createShipment,
  updateShipment,
  updateShipmentStatus,
  deleteShipment
};

