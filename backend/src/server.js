require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { initDatabase, getDriver } = require('./db');
const errorHandler = require('./middleware/errorHandler');

// Import des routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const cargoRoutes = require('./routes/cargoRoutes');
const clientRoutes = require('./routes/clientRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
const financeRoutes = require('./routes/financeRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const rentalRoutes = require('./routes/rentalRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globaux
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Route de santé (Healthcheck)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'KENAYA LOGISTIC SaaS API',
    databaseDriver: getDriver(),
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Enregistrement des routes API
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/cargo', cargoRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/finances', financeRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rentals', rentalRoutes);

// Gestionnaire d'erreurs 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Point de terminaison introuvable : [${req.method}] ${req.url}`
  });
});

// Gestionnaire d'erreurs centralisé
app.use(errorHandler);

// Démarrage du serveur et initialisation de la base de données
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log('====================================================');
      console.log(`🚀 KENAYA LOGISTIC API opérationnelle sur le port ${PORT}`);
      console.log(`📊 Mode Base de Données : ${getDriver().toUpperCase()}`);
      console.log(`🌐 URL : http://localhost:${PORT}`);
      console.log('====================================================');
    });
  } catch (err) {
    console.error('Erreur critique au démarrage du serveur :', err);
    process.exit(1);
  }
}

startServer();

