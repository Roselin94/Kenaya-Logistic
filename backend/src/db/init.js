require('dotenv').config();
const { initDatabase } = require('./index');

async function main() {
  try {
    console.log('--- Initialisation de la base de données KENAYA LOGISTIC ---');
    await initDatabase();
    console.log('--- Base de données initialisée avec succès ! ---');
    process.exit(0);
  } catch (err) {
    console.error('Erreur lors de l\'initialisation :', err);
    process.exit(1);
  }
}

main();

