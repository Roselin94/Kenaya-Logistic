const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipmentController');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', checkPermission('shipments', 'view'), shipmentController.getAllShipments);
router.get('/:id', checkPermission('shipments', 'view'), shipmentController.getShipmentById);
router.post('/', checkPermission('shipments', 'create'), shipmentController.createShipment);
router.put('/:id', checkPermission('shipments', 'edit'), shipmentController.updateShipment);
router.patch('/:id/status', checkPermission('shipments', 'validate'), shipmentController.updateShipmentStatus);
router.delete('/:id', checkPermission('shipments', 'delete'), shipmentController.deleteShipment);

module.exports = router;
