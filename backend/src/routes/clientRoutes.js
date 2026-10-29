const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', checkPermission('clients', 'view'), clientController.getAllClients);
router.get('/:id', checkPermission('clients', 'view'), clientController.getClientById);
router.post('/', checkPermission('clients', 'create'), clientController.createClient);
router.put('/:id', checkPermission('clients', 'edit'), clientController.updateClient);
router.delete('/:id', checkPermission('clients', 'delete'), clientController.deleteClient);

module.exports = router;
