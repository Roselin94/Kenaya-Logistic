const db = require('../db');

async function getAllCargo(req, res, next) {
  try {
    const { status, clientId, shipmentId, search } = req.query;

    let queryStr = `
      SELECT 
        ci.*,
        c.name as client_name,
        c.phone as client_phone,
        c.city as client_city,
        s.tracking_number,
        s.origin as shipment_origin,
        s.destination as shipment_destination,
        s.status as shipment_status
      FROM cargo_items ci
      JOIN clients c ON ci.client_id = c.id
      LEFT JOIN shipments s ON ci.shipment_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      queryStr += ' AND ci.status = ?';
      params.push(status);
    }

    if (clientId) {
      queryStr += ' AND ci.client_id = ?';
      params.push(clientId);
    }

    if (shipmentId) {
      queryStr += ' AND ci.shipment_id = ?';
      params.push(shipmentId);
    }

    if (search) {
      queryStr += ' AND (ci.designation LIKE ? OR ci.category LIKE ? OR ci.barcode LIKE ? OR c.name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    queryStr += ' ORDER BY ci.id DESC';

    const cargo = await db.query(queryStr, params);

    res.json({
      success: true,
      count: cargo.length,
      data: cargo
    });
  } catch (err) {
    next(err);
  }
}

async function getCargoById(req, res, next) {
  try {
    const { id } = req.params;

    const item = await db.get(`
      SELECT 
        ci.*,
        c.name as client_name,
        c.phone as client_phone,
        c.email as client_email,
        c.address as client_address,
        c.city as client_city,
        s.tracking_number,
        s.origin as shipment_origin,
        s.destination as shipment_destination,
        s.status as shipment_status,
        s.carrier_name,
        s.departure_date,
        s.estimated_arrival
      FROM cargo_items ci
      JOIN clients c ON ci.client_id = c.id
      LEFT JOIN shipments s ON ci.shipment_id = s.id
      WHERE ci.id = ?
    `, [id]);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Marchandise non trouvée.'
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (err) {
    next(err);
  }
}

async function createCargo(req, res, next) {
  try {
    const {
      client_id,
      shipment_id,
      designation,
      category,
      quantity,
      unit,
      weight_kg,
      volume_cbm,
      declared_value,
      status,
      barcode
    } = req.body;

    if (!client_id || !designation) {
      return res.status(400).json({
        success: false,
        message: 'Le propriétaire (client) et la désignation de la marchandise sont obligatoires.'
      });
    }

    // Génération automatique d'un code-barres / référence si non fourni
    const generatedBarcode = barcode || `KN-CARGO-${Date.now().toString().slice(-6)}`;

    const result = await db.execute(`
      INSERT INTO cargo_items (
        client_id, shipment_id, designation, category, quantity, unit,
        weight_kg, volume_cbm, declared_value, status, barcode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      client_id,
      shipment_id || null,
      designation.trim(),
      category || 'Marchandises Générales',
      parseInt(quantity || 1, 10),
      unit || 'Colis',
      parseFloat(weight_kg || 0),
      parseFloat(volume_cbm || 0),
      parseFloat(declared_value || 0),
      status || (shipment_id ? 'en attente d\'expédition' : 'enregistrée'),
      generatedBarcode
    ]);

    const newItem = await db.get('SELECT * FROM cargo_items WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Marchandise enregistrée avec succès dans le système.',
      data: newItem
    });
  } catch (err) {
    next(err);
  }
}

async function updateCargo(req, res, next) {
  try {
    const { id } = req.params;
    const {
      client_id,
      shipment_id,
      designation,
      category,
      quantity,
      unit,
      weight_kg,
      volume_cbm,
      declared_value,
      status,
      barcode
    } = req.body;

    const existing = await db.get('SELECT * FROM cargo_items WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Marchandise non trouvée.' });
    }

    await db.execute(`
      UPDATE cargo_items SET
        client_id = ?,
        shipment_id = ?,
        designation = ?,
        category = ?,
        quantity = ?,
        unit = ?,
        weight_kg = ?,
        volume_cbm = ?,
        declared_value = ?,
        status = ?,
        barcode = ?
      WHERE id = ?
    `, [
      client_id || existing.client_id,
      shipment_id !== undefined ? (shipment_id || null) : existing.shipment_id,
      designation ? designation.trim() : existing.designation,
      category || existing.category,
      quantity !== undefined ? parseInt(quantity, 10) : existing.quantity,
      unit || existing.unit,
      weight_kg !== undefined ? parseFloat(weight_kg) : existing.weight_kg,
      volume_cbm !== undefined ? parseFloat(volume_cbm) : existing.volume_cbm,
      declared_value !== undefined ? parseFloat(declared_value) : existing.declared_value,
      status || existing.status,
      barcode || existing.barcode,
      id
    ]);

    const updated = await db.get('SELECT * FROM cargo_items WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Marchandise mise à jour avec succès.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

async function deleteCargo(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await db.get('SELECT * FROM cargo_items WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Marchandise non trouvée.' });
    }

    await db.execute('DELETE FROM cargo_items WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Marchandise supprimée avec succès.'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllCargo,
  getCargoById,
  createCargo,
  updateCargo,
  deleteCargo
};

