const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rentalController');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// 1. Tableau de bord & KPIs location
router.get(
  '/dashboard',
  checkPermission('rentals', 'view'),
  rentalController.getRentalDashboard
);

// 2. Vérification de disponibilité
router.get(
  '/availability',
  checkPermission('rentals', 'view'),
  rentalController.checkAvailability
);

// 3. Gestion de la flotte (Véhicules)
router.get(
  '/vehicles',
  checkPermission('vehicles', 'view'),
  rentalController.getVehicles
);

router.get(
  '/vehicles/:id',
  checkPermission('vehicles', 'view'),
  rentalController.getVehicleById
);

router.post(
  '/vehicles',
  checkPermission('vehicles', 'create'),
  rentalController.createVehicle
);

router.put(
  '/vehicles/:id',
  checkPermission('vehicles', 'edit'),
  rentalController.updateVehicle
);

// 4. Gestion des locations & réservations
router.get(
  '/rentals',
  checkPermission('rentals', 'view'),
  rentalController.getRentals
);

router.get(
  '/rentals/:id',
  checkPermission('rentals', 'view'),
  rentalController.getRentalById
);

router.post(
  '/rentals',
  checkPermission('rentals', 'create'),
  rentalController.createRental
);

router.post(
  '/rentals/:id/start',
  checkPermission('rentals', 'edit'),
  rentalController.startRental
);

router.post(
  '/rentals/:id/complete',
  checkPermission('rentals', 'validate'),
  rentalController.completeRental
);

router.post(
  '/rentals/:id/cancel',
  checkPermission('rentals', 'delete'),
  rentalController.cancelRental
);

// 5. Gestion de la maintenance
router.get(
  '/maintenances',
  checkPermission('maintenances', 'view'),
  rentalController.getMaintenances
);

router.post(
  '/maintenances',
  checkPermission('maintenances', 'create'),
  rentalController.createMaintenance
);

module.exports = router;
