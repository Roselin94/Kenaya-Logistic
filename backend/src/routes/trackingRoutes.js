const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');

// Route publique pour consultation client sans compte (accessible à tous)
router.get('/public/:trackingNumber', trackingController.trackPublic);

// Routes sécurisées pour les agents logistiques avec contrôle RBAC granulaire
router.post('/events', authenticateToken, checkPermission('tracking', 'create'), trackingController.addTrackingEvent);

module.exports = router;
