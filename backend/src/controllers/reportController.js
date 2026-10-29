const db = require('../db');

async function getAdvancedReports(req, res, next) {
  try {
    const { startDate, endDate, destination, clientId } = req.query;

    let dateFilterShipments = '';
    let dateFilterPayments = '';
    let dateFilterExpenses = '';
    const paramsShipments = [];
    const paramsPayments = [];
    const paramsExpenses = [];

    if (startDate) {
      dateFilterShipments += ' AND departure_date >= ?';
      dateFilterPayments += ' AND payment_date >= ?';
      dateFilterExpenses += ' AND expense_date >= ?';
      paramsShipments.push(startDate);
      paramsPayments.push(startDate);
      paramsExpenses.push(startDate);
    }

    if (endDate) {
      dateFilterShipments += ' AND departure_date <= ?';
      dateFilterPayments += ' AND payment_date <= ?';
      dateFilterExpenses += ' AND expense_date <= ?';
      paramsShipments.push(endDate);
      paramsPayments.push(endDate);
      paramsExpenses.push(endDate);
    }

    // 1. Synthèse par Destination
    const byDestination = await db.query(`
      SELECT 
        destination,
        COUNT(*) as total_shipments,
        SUM(CASE WHEN status = 'livrée' THEN 1 ELSE 0 END) as delivered_count,
        COALESCE(SUM(total_cost), 0) as total_revenue,
        COALESCE(SUM(paid_amount), 0) as total_paid,
        COALESCE(SUM(total_cost - paid_amount), 0) as total_unpaid
      FROM shipments
      WHERE 1=1 ${dateFilterShipments}
      GROUP BY destination
      ORDER BY total_revenue DESC
    `, paramsShipments);

    // 2. Synthèse par Client
    const byClient = await db.query(`
      SELECT 
        c.id as client_id,
        c.name as client_name,
        c.city as client_city,
        c.phone as client_phone,
        COUNT(s.id) as total_shipments,
        COALESCE(SUM(s.total_cost), 0) as total_invoiced,
        COALESCE(SUM(s.paid_amount), 0) as total_paid,
        COALESCE(SUM(s.total_cost - s.paid_amount), 0) as total_debt
      FROM clients c
      LEFT JOIN shipments s ON c.id = s.client_id
      WHERE 1=1
      GROUP BY c.id
      ORDER BY total_invoiced DESC
      LIMIT 10
    `);

    // 3. Rentabilité détaillée par expédition (Recette - Dépenses directes)
    const shipmentProfitability = await db.query(`
      SELECT 
        s.id,
        s.tracking_number,
        s.origin,
        s.destination,
        s.departure_date,
        s.status,
        s.total_cost as revenue,
        COALESCE((SELECT SUM(amount) FROM expenses WHERE shipment_id = s.id), 0) as total_direct_expenses,
        (s.total_cost - COALESCE((SELECT SUM(amount) FROM expenses WHERE shipment_id = s.id), 0)) as gross_profit,
        c.name as client_name
      FROM shipments s
      JOIN clients c ON s.client_id = c.id
      WHERE 1=1 ${dateFilterShipments}
      ORDER BY s.id DESC
      LIMIT 15
    `, paramsShipments);

    // 4. Totaux de la période
    const totalRevenueRow = await db.get(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE 1=1 ${dateFilterPayments}
    `, paramsPayments);

    const totalExpensesRow = await db.get(`
      SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE 1=1 ${dateFilterExpenses}
    `, paramsExpenses);

    const periodRevenue = parseFloat(totalRevenueRow?.total || 0);
    const periodExpenses = parseFloat(totalExpensesRow?.total || 0);
    const periodNetProfit = periodRevenue - periodExpenses;

    res.json({
      success: true,
      data: {
        summary: {
          periodRevenue,
          periodExpenses,
          periodNetProfit
        },
        byDestination,
        byClient,
        shipmentProfitability
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAdvancedReports
};

