const express = require('express');
const router = express.Router();
const cargoController = require('../controllers/cargoController');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', checkPermission('cargo', 'view'), cargoController.getAllCargo);
router.get('/:id', checkPermission('cargo', 'view'), cargoController.getCargoById);
router.post('/', checkPermission('cargo', 'create'), cargoController.createCargo);
router.put('/:id', checkPermission('cargo', 'edit'), cargoController.updateCargo);
router.delete('/:id', checkPermission('cargo', 'delete'), cargoController.deleteCargo);

module.exports = router;
