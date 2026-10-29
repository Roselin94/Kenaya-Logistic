const db = require('../db');

async function getFinancialOverview(req, res, next) {
  try {
    // 1. Total recettes (paiements encaissés)
    const revRow = await db.get('SELECT COALESCE(SUM(amount), 0) as total FROM payments');
    const totalRevenue = parseFloat(revRow?.total || 0);

    // 2. Total dépenses
    const expRow = await db.get('SELECT COALESCE(SUM(amount), 0) as total FROM expenses');
    const totalExpenses = parseFloat(expRow?.total || 0);

    // 3. Bénéfice net
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

    // 4. Dettes clients (reste à payer sur les expéditions non soldées)
    const debtRow = await db.get(`
      SELECT COALESCE(SUM(total_cost - paid_amount), 0) as total_debt 
      FROM shipments 
      WHERE payment_status != 'paid' AND status != 'annulée'
    `);
    const totalDebts = parseFloat(debtRow?.total_debt || 0);

    // 5. Répartition des dépenses par catégorie
    const expensesByCategory = await db.query(`
      SELECT category, SUM(amount) as total, COUNT(*) as count
      FROM expenses
      GROUP BY category
      ORDER BY total DESC
    `);

    // 6. Répartition des paiements par mode
    const paymentsByMethod = await db.query(`
      SELECT payment_method, SUM(amount) as total, COUNT(*) as count
      FROM payments
      GROUP BY payment_method
      ORDER BY total DESC
    `);

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: parseFloat(profitMargin),
        totalDebts,
        expensesByCategory,
        paymentsByMethod
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getAllPayments(req, res, next) {
  try {
    const { clientId, shipmentId, method, startDate, endDate } = req.query;

    let queryStr = `
      SELECT 
        p.*,
        c.name as client_name,
        c.phone as client_phone,
        s.tracking_number,
        s.origin,
        s.destination,
        s.total_cost as shipment_total,
        u.name as recorded_by_name
      FROM payments p
      JOIN clients c ON p.client_id = c.id
      LEFT JOIN shipments s ON p.shipment_id = s.id
      LEFT JOIN users u ON p.recorded_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (clientId) {
      queryStr += ' AND p.client_id = ?';
      params.push(clientId);
    }

    if (shipmentId) {
      queryStr += ' AND p.shipment_id = ?';
      params.push(shipmentId);
    }

    if (method) {
      queryStr += ' AND p.payment_method = ?';
      params.push(method);
    }

    if (startDate) {
      queryStr += ' AND p.payment_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      queryStr += ' AND p.payment_date <= ?';
      params.push(endDate);
    }

    queryStr += ' ORDER BY p.id DESC';

    const payments = await db.query(queryStr, params);

    res.json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (err) {
    next(err);
  }
}

async function createPayment(req, res, next) {
  try {
    const { shipment_id, client_id, amount, payment_method, reference, notes } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Le montant du paiement doit être supérieur à zéro.'
      });
    }

    let finalClientId = client_id;
    let shipment = null;

    if (shipment_id) {
      shipment = await db.get('SELECT * FROM shipments WHERE id = ?', [shipment_id]);
      if (shipment) {
        finalClientId = shipment.client_id;
      }
    }

    if (!finalClientId) {
      return res.status(400).json({
        success: false,
        message: 'Le client associé au paiement est requis.'
      });
    }

    const payAmount = parseFloat(amount);
    const payRef = reference || `PAY-REC-${Date.now().toString().slice(-6)}`;

    // 1. Enregistrer le paiement
    const result = await db.execute(`
      INSERT INTO payments (
        shipment_id, client_id, amount, payment_method, reference,
        payment_date, recorded_by, notes
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
    `, [
      shipment_id || null,
      finalClientId,
      payAmount,
      payment_method || 'Espèces',
      payRef,
      req.user ? req.user.id : null,
      notes || ''
    ]);

    // 2. Mettre à jour l'expédition si liée
    if (shipment) {
      const newPaid = parseFloat(shipment.paid_amount || 0) + payAmount;
      const totalCost = parseFloat(shipment.total_cost || 0);
      let newPaymentStatus = 'partial';
      if (newPaid >= totalCost) {
        newPaymentStatus = 'paid';
      } else if (newPaid <= 0) {
        newPaymentStatus = 'pending';
      }

      await db.execute(
        'UPDATE shipments SET paid_amount = ?, payment_status = ? WHERE id = ?',
        [newPaid, newPaymentStatus, shipment.id]
      );

      // Mettre à jour la facture liée
      const invStatus = newPaid >= totalCost ? 'paid' : (newPaid > 0 ? 'partially_paid' : 'unpaid');
      await db.execute(
        'UPDATE invoices SET paid_amount = ?, status = ? WHERE shipment_id = ?',
        [newPaid, invStatus, shipment.id]
      );
    }

    const createdPayment = await db.get('SELECT * FROM payments WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: `Paiement de ${payAmount.toLocaleString('fr-FR')} FCFA enregistré avec succès.`,
      data: createdPayment
    });
  } catch (err) {
    next(err);
  }
}

async function getAllExpenses(req, res, next) {
  try {
    const { category, shipmentId, startDate, endDate } = req.query;

    let queryStr = `
      SELECT 
        e.*,
        s.tracking_number,
        s.origin as shipment_origin,
        s.destination as shipment_destination,
        u.name as recorded_by_name
      FROM expenses e
      LEFT JOIN shipments s ON e.shipment_id = s.id
      LEFT JOIN users u ON e.recorded_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      queryStr += ' AND e.category = ?';
      params.push(category);
    }

    if (shipmentId) {
      queryStr += ' AND e.shipment_id = ?';
      params.push(shipmentId);
    }

    if (startDate) {
      queryStr += ' AND e.expense_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      queryStr += ' AND e.expense_date <= ?';
      params.push(endDate);
    }

    queryStr += ' ORDER BY e.expense_date DESC, e.id DESC';

    const expenses = await db.query(queryStr, params);

    res.json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (err) {
    next(err);
  }
}

async function createExpense(req, res, next) {
  try {
    const { shipment_id, title, category, amount, expense_date, paid_to, payment_method, notes } = req.body;

    if (!title || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'L\'intitulé de la dépense et un montant valide sont obligatoires.'
      });
    }

    const result = await db.execute(`
      INSERT INTO expenses (
        shipment_id, title, category, amount, expense_date,
        paid_to, payment_method, recorded_by, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      shipment_id || null,
      title.trim(),
      category || 'Carburant',
      parseFloat(amount),
      expense_date || new Date().toISOString().split('T')[0],
      paid_to ? paid_to.trim() : null,
      payment_method || 'Espèces',
      req.user ? req.user.id : null,
      notes || null
    ]);

    const created = await db.get('SELECT * FROM expenses WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Dépense d\'exploitation enregistrée avec succès.',
      data: created
    });
  } catch (err) {
    next(err);
  }
}

async function deleteExpense(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await db.get('SELECT * FROM expenses WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Dépense introuvable.' });
    }

    await db.execute('DELETE FROM expenses WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Dépense supprimée avec succès.'
    });
  } catch (err) {
    next(err);
  }
}

async function getClientDebts(req, res, next) {
  try {
    const debts = await db.query(`
      SELECT 
        c.id as client_id,
        c.name as client_name,
        c.phone as client_phone,
        c.city as client_city,
        COUNT(s.id) as unpaid_shipments_count,
        SUM(s.total_cost) as total_invoiced,
        SUM(s.paid_amount) as total_paid,
        SUM(s.total_cost - s.paid_amount) as total_debt
      FROM shipments s
      JOIN clients c ON s.client_id = c.id
      WHERE s.payment_status != 'paid' AND s.status != 'annulée'
      GROUP BY c.id
      HAVING total_debt > 0
      ORDER BY total_debt DESC
    `);

    res.json({
      success: true,
      count: debts.length,
      data: debts
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getFinancialOverview,
  getAllPayments,
  createPayment,
  getAllExpenses,
  createExpense,
  deleteExpense,
  getClientDebts
};

