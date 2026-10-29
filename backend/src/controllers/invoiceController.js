const db = require('../db');

async function getAllInvoices(req, res, next) {
  try {
    const { status, clientId, startDate, endDate, search } = req.query;

    let queryStr = `
      SELECT 
        inv.*,
        c.name as client_name,
        c.phone as client_phone,
        c.city as client_city,
        s.tracking_number,
        s.origin,
        s.destination,
        s.status as shipment_status
      FROM invoices inv
      JOIN clients c ON inv.client_id = c.id
      JOIN shipments s ON inv.shipment_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      queryStr += ' AND inv.status = ?';
      params.push(status);
    }

    if (clientId) {
      queryStr += ' AND inv.client_id = ?';
      params.push(clientId);
    }

    if (startDate) {
      queryStr += ' AND inv.issue_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      queryStr += ' AND inv.issue_date <= ?';
      params.push(endDate);
    }

    if (search) {
      queryStr += ' AND (inv.invoice_number LIKE ? OR s.tracking_number LIKE ? OR c.name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    queryStr += ' ORDER BY inv.id DESC';

    const invoices = await db.query(queryStr, params);

    res.json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (err) {
    next(err);
  }
}

async function getInvoiceById(req, res, next) {
  try {
    const { id } = req.params;

    const invoice = await db.get(`
      SELECT 
        inv.*,
        c.name as client_name,
        c.phone as client_phone,
        c.email as client_email,
        c.address as client_address,
        c.city as client_city,
        c.id_number as client_id_number,
        s.tracking_number,
        s.origin,
        s.destination,
        s.sender_name,
        s.sender_phone,
        s.receiver_name,
        s.receiver_phone,
        s.receiver_address,
        s.carrier_name,
        s.vehicle_plate,
        s.departure_date,
        s.estimated_arrival,
        s.actual_arrival,
        s.shipping_cost,
        s.insurance_cost,
        s.other_fees,
        s.status as shipment_status
      FROM invoices inv
      JOIN clients c ON inv.client_id = c.id
      JOIN shipments s ON inv.shipment_id = s.id
      WHERE inv.id = ?
    `, [id]);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée.'
      });
    }

    // Marchandises incluses dans cette expédition / facture
    const cargo = await db.query('SELECT * FROM cargo_items WHERE shipment_id = ?', [invoice.shipment_id]);

    // Historique des paiements versés sur cette facture
    const payments = await db.query('SELECT * FROM payments WHERE shipment_id = ? ORDER BY id ASC', [invoice.shipment_id]);

    res.json({
      success: true,
      data: {
        ...invoice,
        cargo,
        payments
      }
    });
  } catch (err) {
    next(err);
  }
}

async function updateInvoiceStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const existing = await db.get('SELECT * FROM invoices WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Facture non trouvée.' });
    }

    await db.execute(`
      UPDATE invoices SET
        status = ?,
        notes = ?
      WHERE id = ?
    `, [
      status || existing.status,
      notes !== undefined ? notes : existing.notes,
      id
    ]);

    const updated = await db.get('SELECT * FROM invoices WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Statut de la facture mis à jour avec succès.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllInvoices,
  getInvoiceById,
  updateInvoiceStatus
};

