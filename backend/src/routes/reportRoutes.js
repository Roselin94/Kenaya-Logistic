const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/advanced', checkPermission('reports', 'view'), reportController.getAdvancedReports);

module.exports = router;
