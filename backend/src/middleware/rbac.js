/**
 * Contrôle d'accès basé sur les rôles et permissions granulaires pour KENAYA LOGISTIC
 * Rôles :
 * - admin: Directrice Générale (Super-administrateur, accès total)
 * - manager: Responsable d'exploitation / Gestionnaire logistique
 * - accountant: Comptable / Responsable financier
 * - secretary: Secrétaire (Dossiers marchandises, clients, expéditions, réservations)
 * - agent: Agent logistique de quai / Opérateur
 * - tech_admin: Administrateur Technique (Maintenance, véhicules, traceurs)
 * 
 * Actions granulaires par module :
 * - view, create, edit, delete, validate, export
 * Règle d'or : Refus par défaut de toute action non explicitement autorisée.
 */

const db = require('../db');

/**
 * Middleware vérifiant si l'utilisateur possède l'un des rôles autorisés (legacy/macro)
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non identifié.'
      });
    }

    const userRole = req.user.role.toLowerCase();

    // La Directrice Générale a accès absolu
    if (userRole === 'admin') {
      return next();
    }

    if (allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Action non autorisée pour le profil [${userRole}]. Rôles requis : ${allowedRoles.join(', ')}.`
    });
  };
}

/**
 * Middleware granulaire vérifiant les permissions par module et action
 * @param {string} module - Nom du module (ex: 'shipments', 'finances', 'clients', 'rentals', 'users')
 * @param {string} action - 'view' | 'create' | 'edit' | 'delete' | 'validate' | 'export'
 */
function checkPermission(module, action = 'view') {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Session expirée ou utilisateur non authentifié.'
        });
      }

      const userRole = (req.user.role || '').toLowerCase();

      // Directrice Générale (admin) a TOUTES les autorisations
      if (userRole === 'admin') {
        return next();
      }

      // Si l'utilisateur a ses permissions déjà en cache dans la requête
      let userPerms = req.user.permissionsMap;
      if (!userPerms) {
        const rows = await db.query(
          'SELECT module, can_view, can_create, can_edit, can_delete, can_validate, can_export FROM permissions WHERE user_id = ?',
          [req.user.id]
        );
        userPerms = {};
        for (const r of rows) {
          userPerms[r.module] = {
            view: !!r.can_view,
            create: !!r.can_create,
            edit: !!r.can_edit,
            delete: !!r.can_delete,
            validate: !!r.can_validate,
            export: !!r.can_export
          };
        }
        req.user.permissionsMap = userPerms;
      }

      const modPerms = userPerms[module];
      // Refus par défaut (Default Deny)
      if (!modPerms) {
        return res.status(403).json({
          success: false,
          message: `Accès refusé au module [${module}]. Vous ne possédez aucun droit configuré.`
        });
      }

      const actionKey = action.toLowerCase();
      const isAllowed = modPerms[actionKey];

      if (!isAllowed) {
        const actionLabels = {
          view: 'consulter',
          create: 'créer',
          edit: 'modifier',
          delete: 'supprimer',
          validate: 'valider',
          export: 'exporter'
        };
        const actionFr = actionLabels[actionKey] || actionKey;
        return res.status(403).json({
          success: false,
          message: `Droit insuffisant : Vous n'êtes pas autorisé à ${actionFr} dans le module [${module}].`
        });
      }

      next();
    } catch (err) {
      console.error('[RBAC checkPermission error]:', err);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des permissions de sécurité.'
      });
    }
  };
}

module.exports = {
  authorizeRoles,
  checkPermission
};
