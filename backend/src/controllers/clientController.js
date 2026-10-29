const db = require('../db');

async function getAllClients(req, res, next) {
  try {
    const { search, city } = req.query;

    let queryStr = `
      SELECT 
        c.*,
        COUNT(DISTINCT s.id) as total_shipments,
        COUNT(DISTINCT ci.id) as total_cargo,
        COALESCE(SUM(DISTINCT s.total_cost), 0) as total_spent,
        COALESCE(SUM(DISTINCT s.paid_amount), 0) as total_paid,
        COALESCE(SUM(DISTINCT (s.total_cost - s.paid_amount)), 0) as total_debt
      FROM clients c
      LEFT JOIN shipments s ON c.id = s.client_id
      LEFT JOIN cargo_items ci ON c.id = ci.client_id
      WHERE 1=1
    `;
    const params = [];

    if (city) {
      queryStr += ' AND c.city = ?';
      params.push(city);
    }

    if (search) {
      queryStr += ' AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ? OR c.id_number LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    queryStr += ' GROUP BY c.id ORDER BY c.name ASC';

    const clients = await db.query(queryStr, params);

    res.json({
      success: true,
      count: clients.length,
      data: clients
    });
  } catch (err) {
    next(err);
  }
}

async function getClientById(req, res, next) {
  try {
    const { id } = req.params;

    const client = await db.get('SELECT * FROM clients WHERE id = ?', [id]);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé.'
      });
    }

    // Récupération de l'historique des expéditions du client
    const shipments = await db.query(`
      SELECT * FROM shipments 
      WHERE client_id = ? 
      ORDER BY id DESC
    `, [id]);

    // Récupération de l'historique des marchandises du client
    const cargo = await db.query(`
      SELECT ci.*, s.tracking_number, s.status as shipment_status
      FROM cargo_items ci
      LEFT JOIN shipments s ON ci.shipment_id = s.id
      WHERE ci.client_id = ?
      ORDER BY ci.id DESC
    `, [id]);

    // Récupération des paiements effectués
    const payments = await db.query(`
      SELECT p.*, s.tracking_number
      FROM payments p
      LEFT JOIN shipments s ON p.shipment_id = s.id
      WHERE p.client_id = ?
      ORDER BY p.id DESC
    `, [id]);

    // Récupération des factures
    const invoices = await db.query(`
      SELECT inv.*, s.tracking_number
      FROM invoices inv
      JOIN shipments s ON inv.shipment_id = s.id
      WHERE inv.client_id = ?
      ORDER BY inv.id DESC
    `, [id]);

    // Calculs synthétiques
    const totalSpent = shipments.reduce((sum, s) => sum + parseFloat(s.total_cost || 0), 0);
    const totalPaid = shipments.reduce((sum, s) => sum + parseFloat(s.paid_amount || 0), 0);
    const currentDebt = totalSpent - totalPaid;

    res.json({
      success: true,
      data: {
        ...client,
        stats: {
          totalShipments: shipments.length,
          totalCargo: cargo.length,
          totalSpent,
          totalPaid,
          currentDebt
        },
        shipments,
        cargo,
        payments,
        invoices
      }
    });
  } catch (err) {
    next(err);
  }
}

async function createClient(req, res, next) {
  try {
    const { name, phone, email, address, city, id_number, notes } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du client et le numéro de téléphone sont requis.'
      });
    }

    const result = await db.execute(`
      INSERT INTO clients (name, phone, email, address, city, id_number, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      name.trim(),
      phone.trim(),
      email ? email.trim().toLowerCase() : null,
      address ? address.trim() : null,
      city || 'Brazzaville',
      id_number ? id_number.trim() : null,
      notes || null
    ]);

    const newClient = await db.get('SELECT * FROM clients WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Client créé avec succès.',
      data: newClient
    });
  } catch (err) {
    next(err);
  }
}

async function updateClient(req, res, next) {
  try {
    const { id } = req.params;
    const { name, phone, email, address, city, id_number, notes } = req.body;

    const existing = await db.get('SELECT * FROM clients WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Client non trouvé.' });
    }

    await db.execute(`
      UPDATE clients SET
        name = ?,
        phone = ?,
        email = ?,
        address = ?,
        city = ?,
        id_number = ?,
        notes = ?
      WHERE id = ?
    `, [
      name ? name.trim() : existing.name,
      phone ? phone.trim() : existing.phone,
      email !== undefined ? (email ? email.trim().toLowerCase() : null) : existing.email,
      address !== undefined ? address : existing.address,
      city || existing.city,
      id_number !== undefined ? id_number : existing.id_number,
      notes !== undefined ? notes : existing.notes,
      id
    ]);

    const updated = await db.get('SELECT * FROM clients WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Informations client mises à jour avec succès.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

async function deleteClient(req, res, next) {
  try {
    const { id } = req.params;

    // Vérifier si le client a des expéditions associées
    const linkedShipment = await db.get('SELECT id FROM shipments WHERE client_id = ? LIMIT 1', [id]);
    if (linkedShipment) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer ce client : des expéditions actives ou archivées lui sont associées.'
      });
    }

    await db.execute('DELETE FROM clients WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Client supprimé avec succès.'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
};

