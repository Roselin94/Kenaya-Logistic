const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');

router.use(authenticateToken);

// Vue d'ensemble financière (vérification permission granulaire 'finances', 'view')
router.get('/overview', checkPermission('finances', 'view'), financeController.getFinancialOverview);

// Paiements (Recettes)
router.get('/payments', checkPermission('finances', 'view'), financeController.getAllPayments);
router.post('/payments', checkPermission('finances', 'create'), financeController.createPayment);

// Dépenses d'exploitation
router.get('/expenses', checkPermission('finances', 'view'), financeController.getAllExpenses);
router.post('/expenses', checkPermission('finances', 'create'), financeController.createExpense);
router.delete('/expenses/:id', checkPermission('finances', 'delete'), financeController.deleteExpense);

// Dettes & Créances clients
router.get('/debts', checkPermission('finances', 'view'), financeController.getClientDebts);

module.exports = router;
