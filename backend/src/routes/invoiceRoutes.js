const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', checkPermission('invoices', 'view'), invoiceController.getAllInvoices);
router.get('/:id', checkPermission('invoices', 'view'), invoiceController.getInvoiceById);
router.patch('/:id/status', checkPermission('invoices', 'edit'), invoiceController.updateInvoiceStatus);

module.exports = router;
