require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('[MIGRATION RBAC] Connexion à MySQL...');
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'kenaya_logistics'
  });

  console.log('[MIGRATION RBAC] Connecté avec succès.');

  // 1. Ajouter last_login dans users s'il n'existe pas
  try {
    await conn.query(`ALTER TABLE users ADD COLUMN last_login DATETIME DEFAULT NULL;`);
    console.log('✅ Colonne last_login ajoutée à users.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️ Colonne last_login existe déjà.');
    } else {
      console.error('Erreur last_login:', err.message);
    }
  }

  // 2. Mettre à jour l'ENUM des rôles dans users
  try {
    await conn.query(`
      ALTER TABLE users MODIFY COLUMN role 
      ENUM('admin', 'manager', 'accountant', 'agent', 'secretary', 'tech_admin') 
      NOT NULL DEFAULT 'agent';
    `);
    console.log('✅ ENUM des rôles mis à jour dans users.');
  } catch (err) {
    console.error('Erreur ENUM role:', err.message);
  }

  // 3. Créer la table permissions
  await conn.query(`
    CREATE TABLE IF NOT EXISTS permissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      module VARCHAR(50) NOT NULL,
      can_view BOOLEAN DEFAULT FALSE,
      can_create BOOLEAN DEFAULT FALSE,
      can_edit BOOLEAN DEFAULT FALSE,
      can_delete BOOLEAN DEFAULT FALSE,
      can_validate BOOLEAN DEFAULT FALSE,
      can_export BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_module (user_id, module),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✅ Table permissions prête.');

  // 4. Créer la table audit_logs générale
  await conn.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT DEFAULT NULL,
      user_name VARCHAR(100) DEFAULT NULL,
      user_role VARCHAR(50) DEFAULT NULL,
      action VARCHAR(100) NOT NULL,
      module VARCHAR(50) NOT NULL,
      entity_type VARCHAR(50) DEFAULT NULL,
      entity_id INT DEFAULT NULL,
      details JSON DEFAULT NULL,
      ip_address VARCHAR(50) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_audit_module (module),
      INDEX idx_audit_user (user_id),
      INDEX idx_audit_created (created_at),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✅ Table audit_logs prête.');

  // 5. Créer les comptes Secrétaires et Administrateur Technique s'ils n'existent pas
  const hashSecretary = await bcrypt.hash('Secretaire2026!', 10);
  const hashTech = await bcrypt.hash('Tech2026!', 10);

  const defaultUsers = [
    {
      name: 'Grace Ondaye (Secrétaire Principale)',
      email: 'secretaire1@kenayalogistic.cg',
      password: hashSecretary,
      role: 'secretary',
      phone: '+242 06 444 11 22'
    },
    {
      name: 'Nathalie Mabiala (Secrétaire Quai / Agence)',
      email: 'secretaire2@kenayalogistic.cg',
      password: hashSecretary,
      role: 'secretary',
      phone: '+242 05 555 33 44'
    },
    {
      name: 'Arsène Loubaki (Administrateur Technique)',
      email: 'tech@kenayalogistic.cg',
      password: hashTech,
      role: 'tech_admin',
      phone: '+242 06 999 88 77'
    }
  ];

  for (const u of defaultUsers) {
    const [rows] = await conn.query('SELECT id FROM users WHERE email = ?', [u.email]);
    if (rows.length === 0) {
      await conn.query(`
        INSERT INTO users (name, email, password, role, phone, status)
        VALUES (?, ?, ?, ?, ?, 'active')
      `, [u.name, u.email, u.password, u.role, u.phone]);
      console.log(`👤 Utilisateur créé: ${u.name} (${u.email})`);
    } else {
      console.log(`ℹ️ Utilisateur existe déjà: ${u.email}`);
    }
  }

  // 6. Configurer la matrice de permissions par défaut pour chaque utilisateur
  // Modules: dashboard, cargo, clients, shipments, tracking, finances, invoices, reports, users, rentals, vehicles, maintenances
  const allModules = [
    'dashboard', 'cargo', 'clients', 'shipments', 'tracking',
    'finances', 'invoices', 'reports', 'users', 'rentals',
    'vehicles', 'maintenances'
  ];

  const [allUsers] = await conn.query('SELECT id, role, email FROM users');

  for (const user of allUsers) {
    for (const mod of allModules) {
      let perms = { view: false, create: false, edit: false, delete: false, validate: false, export: false };

      if (user.role === 'admin') {
        // Directrice Générale : TOUT est accordé
        perms = { view: true, create: true, edit: true, delete: true, validate: true, export: true };
      } else if (user.role === 'manager') {
        // Responsable Logistique / Opérations
        if (['dashboard', 'cargo', 'clients', 'shipments', 'tracking', 'rentals', 'vehicles', 'maintenances', 'invoices'].includes(mod)) {
          perms = { view: true, create: true, edit: true, delete: false, validate: true, export: true };
        } else if (mod === 'reports') {
          perms = { view: true, create: false, edit: false, delete: false, validate: false, export: true };
        } else if (mod === 'finances') {
          // Lecture seule simple des finances opérationnelles, pas de delete/validate/export sensible
          perms = { view: true, create: false, edit: false, delete: false, validate: false, export: false };
        }
      } else if (user.role === 'accountant') {
        // Comptable : Finances, factures, rapports financiers, consultations clients/expéditions
        if (['finances', 'invoices', 'reports', 'dashboard'].includes(mod)) {
          perms = { view: true, create: true, edit: true, delete: false, validate: true, export: true };
        } else if (['clients', 'shipments', 'cargo', 'rentals'].includes(mod)) {
          perms = { view: true, create: false, edit: false, delete: false, validate: false, export: true };
        }
        // users, vehicles, maintenances, tracking: view or false
        if (['vehicles'].includes(mod)) {
          perms = { view: true, create: false, edit: false, delete: false, validate: false, export: false };
        }
      } else if (user.role === 'secretary' || user.role === 'agent') {
        // Secrétaires : gestion des clients, dossiers marchandises, expéditions, suivi des livraisons, contrats de location
        // STRICTEMENT AUCUN ACCÈS aux bénéfices, finances, rapports financiers, users
        if (['clients', 'cargo', 'shipments', 'tracking', 'rentals'].includes(mod)) {
          perms = { view: true, create: true, edit: true, delete: false, validate: false, export: true };
        } else if (['dashboard', 'vehicles'].includes(mod)) {
          perms = { view: true, create: false, edit: false, delete: false, validate: false, export: false };
        }
      } else if (user.role === 'tech_admin') {
        // Administrateur Technique : maintenance technique, véhicules, traceurs GPS, statut systèmes
        // Pas de finances ni de validation financière
        if (['vehicles', 'maintenances', 'tracking'].includes(mod)) {
          perms = { view: true, create: true, edit: true, delete: true, validate: true, export: true };
        } else if (['dashboard', 'rentals'].includes(mod)) {
          perms = { view: true, create: false, edit: false, delete: false, validate: false, export: false };
        }
      }

      await conn.query(`
        INSERT INTO permissions (user_id, module, can_view, can_create, can_edit, can_delete, can_validate, can_export)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          can_view = VALUES(can_view),
          can_create = VALUES(can_create),
          can_edit = VALUES(can_edit),
          can_delete = VALUES(can_delete),
          can_validate = VALUES(can_validate),
          can_export = VALUES(can_export);
      `, [
        user.id,
        mod,
        perms.view,
        perms.create,
        perms.edit,
        perms.delete,
        perms.validate,
        perms.export
      ]);
    }
  }

  console.log(`✅ Permissions matricielles configurées pour ${allUsers.length} utilisateurs.`);

  // 7. Enregistrer un premier log d'audit
  await conn.query(`
    INSERT INTO audit_logs (user_name, user_role, action, module, details)
    VALUES (?, ?, ?, ?, ?)
  `, [
    'Système Migration',
    'admin',
    'INITIALIZE_RBAC_PERMISSIONS',
    'users',
    JSON.stringify({ message: 'Initialisation de la table permissions et des comptes secrétaires.' })
  ]);

  await conn.end();
  console.log('🎉 Migration RBAC terminée avec succès !');
}

main().catch(err => {
  console.error('❌ Échec de la migration RBAC:', err);
  process.exit(1);
});

