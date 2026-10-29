const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

// Toutes les routes de gestion des utilisateurs nécessitent d'être authentifié
router.use(authenticateToken);

// Seule la Directrice Générale (admin) a le pouvoir d'administrer les utilisateurs, les rôles et les permissions
router.get('/', authorizeRoles('admin'), userController.getAllUsers);
router.get('/audit-logs', authorizeRoles('admin'), userController.getAuditLogs);
router.get('/:id', authorizeRoles('admin'), userController.getUserById);
router.post('/', authorizeRoles('admin'), userController.createUser);
router.put('/:id', authorizeRoles('admin'), userController.updateUser);
router.put('/:id/permissions', authorizeRoles('admin'), userController.updateUserPermissions);
router.post('/:id/reset-password', authorizeRoles('admin'), userController.resetPassword);
router.post('/:id/status', authorizeRoles('admin'), userController.toggleStatus);
router.delete('/:id', authorizeRoles('admin'), userController.deleteUser);

module.exports = router;
