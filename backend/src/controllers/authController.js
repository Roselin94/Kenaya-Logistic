const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez saisir votre adresse email et votre mot de passe.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects. Aucun compte associé à cette adresse.'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Votre compte a été suspendu ou désactivé par la Directrice Générale.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects. Mot de passe invalide.'
      });
    }

    // Mettre à jour la date de dernière connexion
    const now = new Date();
    await db.execute('UPDATE users SET last_login = ? WHERE id = ?', [now, user.id]);

    // Récupérer les permissions granulaires de l'utilisateur
    const permissionsRows = await db.query(
      'SELECT module, can_view, can_create, can_edit, can_delete, can_validate, can_export FROM permissions WHERE user_id = ?',
      [user.id]
    );

    const permissionsMap = {};
    for (const r of permissionsRows) {
      permissionsMap[r.module] = {
        view: Boolean(r.can_view),
        create: Boolean(r.can_create),
        edit: Boolean(r.can_edit),
        delete: Boolean(r.can_delete),
        validate: Boolean(r.can_validate),
        export: Boolean(r.can_export)
      };
    }

    // Journaliser la connexion dans audit_logs
    try {
      await db.execute(`
        INSERT INTO audit_logs (user_id, user_name, user_role, action, module, details, ip_address)
        VALUES (?, ?, ?, 'USER_LOGIN', 'auth', ?, ?)
      `, [
        user.id,
        user.name,
        user.role,
        JSON.stringify({ userAgent: req.headers['user-agent'] || 'Unknown' }),
        req.ip || req.connection?.remoteAddress || '127.0.0.1'
      ]);
    } catch (auditErr) {
      console.error('Audit log login error:', auditErr.message);
    }

    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Connexion réussie. Bienvenue sur KENAYA LOGISTIC !',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status,
        last_login: now
      },
      permissions: permissionsMap
    });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await db.get(
      'SELECT id, name, email, role, phone, status, last_login, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable.'
      });
    }

    const permissionsRows = await db.query(
      'SELECT module, can_view, can_create, can_edit, can_delete, can_validate, can_export FROM permissions WHERE user_id = ?',
      [user.id]
    );

    const permissionsMap = {};
    for (const r of permissionsRows) {
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
      user,
      permissions: permissionsMap
    });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, phone, password } = req.body;
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    let finalPassword = user.password;
    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe doit comporter au moins 6 caractères.'
        });
      }
      const salt = await bcrypt.genSalt(10);
      finalPassword = await bcrypt.hash(password.trim(), salt);
    }

    await db.execute(`
      UPDATE users SET
        name = ?,
        phone = ?,
        password = ?
      WHERE id = ?
    `, [
      name ? name.trim() : user.name,
      phone !== undefined ? (phone ? phone.trim() : null) : user.phone,
      finalPassword,
      user.id
    ]);

    const updatedUser = await db.get(
      'SELECT id, name, email, role, phone, status, last_login, created_at FROM users WHERE id = ?',
      [user.id]
    );

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès.',
      data: updatedUser
    });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez saisir votre mot de passe actuel et le nouveau mot de passe.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit comporter au moins 6 caractères.'
      });
    }

    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable.'
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Votre mot de passe actuel est incorrect.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);

    try {
      await db.execute(`
        INSERT INTO audit_logs (user_id, user_name, user_role, action, module, details)
        VALUES (?, ?, ?, 'USER_CHANGE_PASSWORD', 'auth', ?)
      `, [user.id, user.name, user.role, JSON.stringify({ message: 'Mot de passe modifié par l\'utilisateur.' })]);
    } catch (_) {}

    res.json({
      success: true,
      message: 'Votre mot de passe a été modifié avec succès.'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  getMe,
  updateProfile,
  changePassword
};
