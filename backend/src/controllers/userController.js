const bcrypt = require('bcryptjs');
const db = require('../db');

const ALL_MODULES = [
  'dashboard', 'cargo', 'clients', 'shipments', 'tracking',
  'finances', 'invoices', 'reports', 'users', 'rentals',
  'vehicles', 'maintenances'
];

/**
 * Génère un template de permissions par défaut en fonction du rôle
 */
function getDefaultPermissionsForRole(role) {
  const result = {};
  for (const mod of ALL_MODULES) {
    let perms = { view: false, create: false, edit: false, delete: false, validate: false, export: false };

    if (role === 'admin') {
      perms = { view: true, create: true, edit: true, delete: true, validate: true, export: true };
    } else if (role === 'manager') {
      if (['dashboard', 'cargo', 'clients', 'shipments', 'tracking', 'rentals', 'vehicles', 'maintenances', 'invoices'].includes(mod)) {
        perms = { view: true, create: true, edit: true, delete: false, validate: true, export: true };
      } else if (mod === 'reports') {
        perms = { view: true, create: false, edit: false, delete: false, validate: false, export: true };
      } else if (mod === 'finances') {
        perms = { view: true, create: false, edit: false, delete: false, validate: false, export: false };
      }
    } else if (role === 'accountant') {
      if (['finances', 'invoices', 'reports', 'dashboard'].includes(mod)) {
        perms = { view: true, create: true, edit: true, delete: false, validate: true, export: true };
      } else if (['clients', 'shipments', 'cargo', 'rentals'].includes(mod)) {
        perms = { view: true, create: false, edit: false, delete: false, validate: false, export: true };
      } else if (mod === 'vehicles') {
        perms = { view: true, create: false, edit: false, delete: false, validate: false, export: false };
      }
    } else if (role === 'secretary' || role === 'agent') {
      if (['clients', 'cargo', 'shipments', 'tracking', 'rentals'].includes(mod)) {
        perms = { view: true, create: true, edit: true, delete: false, validate: false, export: true };
      } else if (['dashboard', 'vehicles'].includes(mod)) {
        perms = { view: true, create: false, edit: false, delete: false, validate: false, export: false };
      }
    } else if (role === 'tech_admin') {
      if (['vehicles', 'maintenances', 'tracking'].includes(mod)) {
        perms = { view: true, create: true, edit: true, delete: true, validate: true, export: true };
      } else if (['dashboard', 'rentals'].includes(mod)) {
        perms = { view: true, create: false, edit: false, delete: false, validate: false, export: false };
      }
    }
    result[mod] = perms;
  }
  return result;
}

/**
 * Journalise une action d'administration dans audit_logs
 */
async function logAudit(req, action, entityId, details) {
  try {
    await db.execute(`
      INSERT INTO audit_logs (user_id, user_name, user_role, action, module, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, 'users', 'user', ?, ?, ?)
    `, [
      req.user ? req.user.id : null,
      req.user ? req.user.name : 'Directrice Générale',
      req.user ? req.user.role : 'admin',
      action,
      entityId,
      JSON.stringify(details || {}),
      req.ip || '127.0.0.1'
    ]);
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

/**
 * Liste complète des utilisateurs avec métriques de permissions
 */
async function getAllUsers(req, res, next) {
  try {
    const users = await db.query(`
      SELECT 
        u.id, u.name, u.email, u.role, u.phone, u.status, u.last_login, u.created_at, u.updated_at,
        COUNT(p.id) as permissions_count
      FROM users u
      LEFT JOIN permissions p ON u.id = p.user_id AND (
        p.can_view = 1 OR p.can_create = 1 OR p.can_edit = 1 OR 
        p.can_delete = 1 OR p.can_validate = 1 OR p.can_export = 1
      )
      GROUP BY u.id
      ORDER BY u.id ASC
    `);

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Détail d'un utilisateur spécifique avec sa matrice complète de permissions
 */
async function getUserById(req, res, next) {
  try {
    const { id } = req.params;
    const user = await db.get(
      'SELECT id, name, email, role, phone, status, last_login, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    const permsRows = await db.query(
      'SELECT module, can_view, can_create, can_edit, can_delete, can_validate, can_export FROM permissions WHERE user_id = ?',
      [id]
    );

    const permissionsMap = {};
    for (const r of permsRows) {
      permissionsMap[r.module] = {
        view: Boolean(r.can_view),
        create: Boolean(r.can_create),
        edit: Boolean(r.can_edit),
        delete: Boolean(r.can_delete),
        validate: Boolean(r.can_validate),
        export: Boolean(r.can_export)
      };
    }

    res.json({
      success: true,
      data: {
        ...user,
        permissions: permissionsMap
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Création d'un nouvel utilisateur par la Directrice Générale
 */
async function createUser(req, res, next) {
  try {
    const { name, email, password, role, phone, permissions } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Le nom, l\'adresse email et le mot de passe sont obligatoires.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Un utilisateur existe déjà avec cette adresse email.'
      });
    }

    const validRoles = ['admin', 'manager', 'accountant', 'agent', 'secretary', 'tech_admin'];
    const assignedRole = validRoles.includes(role) ? role : 'agent';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password.trim(), salt);

    const result = await db.execute(`
      INSERT INTO users (name, email, password, role, phone, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `, [
      name.trim(),
      cleanEmail,
      hashedPassword,
      assignedRole,
      phone ? phone.trim() : null
    ]);

    const newUserId = result.insertId;

    // Définir les permissions : soit personnalisées, soit dérivées du template du rôle
    const roleDefaultPerms = getDefaultPermissionsForRole(assignedRole);
    const finalPerms = permissions || roleDefaultPerms;

    for (const mod of ALL_MODULES) {
      const p = finalPerms[mod] || { view: false, create: false, edit: false, delete: false, validate: false, export: false };
      await db.execute(`
        INSERT INTO permissions (user_id, module, can_view, can_create, can_edit, can_delete, can_validate, can_export)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          can_view = VALUES(can_view),
          can_create = VALUES(can_create),
          can_edit = VALUES(can_edit),
          can_delete = VALUES(can_delete),
          can_validate = VALUES(can_validate),
          can_export = VALUES(can_export)
      `, [
        newUserId,
        mod,
        p.view ? 1 : 0,
        p.create ? 1 : 0,
        p.edit ? 1 : 0,
        p.delete ? 1 : 0,
        p.validate ? 1 : 0,
        p.export ? 1 : 0
      ]);
    }

    await logAudit(req, 'USER_CREATED', newUserId, {
      name: name.trim(),
      email: cleanEmail,
      role: assignedRole
    });

    const createdUser = await db.get(
      'SELECT id, name, email, role, phone, status, created_at FROM users WHERE id = ?',
      [newUserId]
    );

    res.status(201).json({
      success: true,
      message: `Compte utilisateur créé avec succès pour ${name} (${assignedRole}).`,
      data: createdUser
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Mise à jour du profil d'un utilisateur
 */
async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, role, phone, status, password } = req.body;

    const existing = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    }

    if (req.user.id === parseInt(id, 10) && status === 'inactive') {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas suspendre votre propre compte d\'administration actif.'
      });
    }

    let finalPassword = existing.password;
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      finalPassword = await bcrypt.hash(password.trim(), salt);
    }

    const validRoles = ['admin', 'manager', 'accountant', 'agent', 'secretary', 'tech_admin'];
    const updatedRole = role && validRoles.includes(role) ? role : existing.role;

    await db.execute(`
      UPDATE users SET
        name = ?,
        email = ?,
        role = ?,
        phone = ?,
        status = ?,
        password = ?
      WHERE id = ?
    `, [
      name ? name.trim() : existing.name,
      email ? email.trim().toLowerCase() : existing.email,
      updatedRole,
      phone !== undefined ? (phone ? phone.trim() : null) : existing.phone,
      status || existing.status,
      finalPassword,
      id
    ]);

    // Si le rôle a changé, mettre à jour les permissions par défaut si demandé ou adapter
    if (role && role !== existing.role) {
      const newDefaults = getDefaultPermissionsForRole(role);
      for (const mod of ALL_MODULES) {
        const p = newDefaults[mod];
        await db.execute(`
          INSERT INTO permissions (user_id, module, can_view, can_create, can_edit, can_delete, can_validate, can_export)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            can_view = VALUES(can_view),
            can_create = VALUES(can_create),
            can_edit = VALUES(can_edit),
            can_delete = VALUES(can_delete),
            can_validate = VALUES(can_validate),
            can_export = VALUES(can_export)
        `, [id, mod, p.view ? 1 : 0, p.create ? 1 : 0, p.edit ? 1 : 0, p.delete ? 1 : 0, p.validate ? 1 : 0, p.export ? 1 : 0]);
      }
    }

    await logAudit(req, 'USER_UPDATED', id, {
      name: name || existing.name,
      role: updatedRole,
      status: status || existing.status
    });

    const updatedUser = await db.get(
      'SELECT id, name, email, role, phone, status, last_login, updated_at FROM users WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès.',
      data: updatedUser
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Mise à jour des permissions granulaires d'un utilisateur spécifique
 */
async function updateUserPermissions(req, res, next) {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    const user = await db.get('SELECT id, name, role FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    }

    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Format de permissions invalide.'
      });
    }

    for (const mod of ALL_MODULES) {
      const p = permissions[mod] || { view: false, create: false, edit: false, delete: false, validate: false, export: false };
      await db.execute(`
        INSERT INTO permissions (user_id, module, can_view, can_create, can_edit, can_delete, can_validate, can_export)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          can_view = VALUES(can_view),
          can_create = VALUES(can_create),
          can_edit = VALUES(can_edit),
          can_delete = VALUES(can_delete),
          can_validate = VALUES(can_validate),
          can_export = VALUES(can_export)
      `, [
        id,
        mod,
        p.view ? 1 : 0,
        p.create ? 1 : 0,
        p.edit ? 1 : 0,
        p.delete ? 1 : 0,
        p.validate ? 1 : 0,
        p.export ? 1 : 0
      ]);
    }

    await logAudit(req, 'PERMISSIONS_CUSTOMIZED', id, {
      userName: user.name,
      modulesUpdated: Object.keys(permissions)
    });

    // Retourner la matrice actualisée
    const permsRows = await db.query(
      'SELECT module, can_view, can_create, can_edit, can_delete, can_validate, can_export FROM permissions WHERE user_id = ?',
      [id]
    );

    const permissionsMap = {};
    for (const r of permsRows) {
      permissionsMap[r.module] = {
        view: Boolean(r.can_view),
        create: Boolean(r.can_create),
        edit: Boolean(r.can_edit),
        delete: Boolean(r.can_delete),
        validate: Boolean(r.can_validate),
        export: Boolean(r.can_export)
      };
    }

    res.json({
      success: true,
      message: `Permissions granulaires mises à jour pour ${user.name}.`,
      data: permissionsMap
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Réinitialisation du mot de passe par la Directrice Générale
 */
async function resetPassword(req, res, next) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const user = await db.get('SELECT id, name, email FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    }

    const tempPassword = newPassword && newPassword.trim() !== '' ? newPassword.trim() : 'Kenaya@' + Math.floor(1000 + Math.random() * 9000);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);

    await logAudit(req, 'PASSWORD_RESET_BY_ADMIN', id, {
      targetUser: user.name,
      targetEmail: user.email
    });

    res.json({
      success: true,
      message: `Mot de passe réinitialisé avec succès pour ${user.name}.`,
      temporaryPassword: tempPassword
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Suspendre ou Activer un compte utilisateur
 */
async function toggleStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' ou 'inactive'

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Statut invalide (active ou inactive requis).' });
    }

    if (req.user.id === parseInt(id, 10)) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas modifier le statut de votre propre compte d\'administration.'
      });
    }

    const user = await db.get('SELECT id, name, email, status FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    await db.execute('UPDATE users SET status = ? WHERE id = ?', [status, id]);

    await logAudit(req, status === 'active' ? 'USER_ACTIVATED' : 'USER_SUSPENDED', id, {
      userName: user.name,
      previousStatus: user.status,
      newStatus: status
    });

    res.json({
      success: true,
      message: `Compte ${user.name} passé à l'état : ${status === 'active' ? 'ACTIF' : 'SUSPENDU'}.`,
      status
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Suppression d'un utilisateur
 */
async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    if (req.user.id === parseInt(id, 10)) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte administrateur.'
      });
    }

    const user = await db.get('SELECT id, name, email FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    }

    await db.execute('DELETE FROM users WHERE id = ?', [id]);

    await logAudit(req, 'USER_DELETED', id, {
      userName: user.name,
      userEmail: user.email
    });

    res.json({
      success: true,
      message: `Utilisateur ${user.name} supprimé avec succès.`
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Consultation des journaux d'audit de sécurité
 */
async function getAuditLogs(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const module = req.query.module || null;

    let query = `
      SELECT id, user_id, user_name, user_role, action, module, entity_type, entity_id, details, ip_address, created_at
      FROM audit_logs
    `;
    const params = [];

    if (module) {
      query += ' WHERE module = ?';
      params.push(module);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const logs = await db.query(query, params);

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserPermissions,
  resetPassword,
  toggleStatus,
  deleteUser,
  getAuditLogs
};
