require('dotenv').config();
const mysql = require('mysql2/promise');

async function clearTestData() {
  console.log('[CLEAR] Connexion à MySQL...');
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'kenaya_logistics'
  });

  console.log('[CLEAR] Vidage des données opérationnelles de test...');

  await conn.query('SET FOREIGN_KEY_CHECKS = 0');

  const tablesToClear = [
    'tracking_events',
    'cargo_items',
    'payments',
    'invoices',
    'expenses',
    'shipments',
    'rental_inspections',
    'rentals',
    'vehicle_maintenances',
    'vehicles',
    'clients',
    'rental_audit_logs'
  ];

  for (const table of tablesToClear) {
    try {
      await conn.query(`TRUNCATE TABLE \`${table}\``);
      console.log(`✅ Table vidée : ${table}`);
    } catch (err) {
      console.error(`Erreur sur ${table}:`, err.message);
    }
  }

  await conn.query('SET FOREIGN_KEY_CHECKS = 1');

  // Enregistrer une trace d'audit propre
  await conn.query(`
    INSERT INTO audit_logs (user_name, user_role, action, module, details)
    VALUES (?, ?, ?, ?, ?)
  `, [
    'Système Nettoyage',
    'admin',
    'PURGE_TEST_DATA',
    'system',
    JSON.stringify({ message: 'Vidage des données de test avant livraison client.' })
  ]);

  // Vérifier le nombre d'utilisateurs restants
  const [users] = await conn.query('SELECT id, name, email, role, status FROM users');
  console.log(`👤 Comptes utilisateurs préservés (${users.length}) :`);
  users.forEach(u => console.log(`   - [${u.role}] ${u.name} (${u.email})`));

  await conn.end();
  console.log('🎉 Données de test vidées avec succès !');
}

clearTestData().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});

