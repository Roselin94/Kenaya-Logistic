import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Alert from '../components/common/Alert';
import { getRoleDetails, formatDate } from '../utils/formatters';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Key,
  Phone,
  Mail,
  UserCheck,
  UserX,
  Lock,
  Sliders,
  History,
  Check,
  X,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MODULES_CONFIG = [
  { id: 'dashboard', name: 'Tableau de bord', desc: 'KPIs, métriques globales & activités' },
  { id: 'cargo', name: 'Marchandises', desc: 'Fret, colis, lots, désignations et poids' },
  { id: 'clients', name: 'Clients & Fiches', desc: 'Répertoire expéditeurs et destinataires' },
  { id: 'shipments', name: 'Expéditions (RN1)', desc: 'Ordres de transport, départs Brazza/Pointe-Noire' },
  { id: 'tracking', name: 'Suivi des colis', desc: 'Points de contrôle, statuts et alertes' },
  { id: 'rentals', name: 'Location Voitures', desc: 'Réservations, contrats, états des lieux' },
  { id: 'vehicles', name: 'Parc Automobile', desc: 'Flotte 4x4, Berlines, entretiens et documents' },
  { id: 'maintenances', name: 'Maintenance Flotte', desc: 'Visites techniques, vidanges, réparations' },
  { id: 'finances', name: 'Finances & Recettes', desc: 'Recettes, dépenses d’exploitation, dettes' },
  { id: 'invoices', name: 'Factures & Reçus', desc: 'Documents comptables et états des soldes' },
  { id: 'reports', name: 'Rapports & Audit', desc: 'Statistiques analytiques et exportations' },
  { id: 'users', name: 'Utilisateurs & Sécurité', desc: 'Administration des comptes et permissions' }
];

const ACTIONS = [
  { key: 'view', label: 'Consulter' },
  { key: 'create', label: 'Créer' },
  { key: 'edit', label: 'Modifier' },
  { key: 'delete', label: 'Supprimer' },
  { key: 'validate', label: 'Valider' },
  { key: 'export', label: 'Exporter' }
];

export default function UsersList() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // 'users' ou 'audit'
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [notification, setNotification] = useState(null);

  // Modale Utilisateur (Création / Edition)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'secretary',
    phone: '',
    status: 'active'
  });

  // Modale Matrice des Permissions Granulaires
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [selectedUserForPerms, setSelectedUserForPerms] = useState(null);
  const [permissionMatrix, setPermissionMatrix] = useState({});
  const [savingPerms, setSavingPerms] = useState(false);

  // Modale Réinitialisation Mot de passe
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [userToReset, setUserToReset] = useState(null);
  const [customPassword, setCustomPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setLoadingAudit(true);
      const res = await api.get('/users/audit-logs?limit=100');
      if (res.success) {
        setAuditLogs(res.data);
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'audit') {
      loadAuditLogs();
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'secretary',
      phone: '',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      phone: u.phone || '',
      status: u.status
    });
    setIsModalOpen(true);
  };

  const openPermissionsModal = async (u) => {
    setSelectedUserForPerms(u);
    try {
      const res = await api.get(`/users/${u.id}`);
      if (res.success && res.data) {
        const matrix = {};
        for (const mod of MODULES_CONFIG) {
          matrix[mod.id] = res.data.permissions?.[mod.id] || {
            view: false,
            create: false,
            edit: false,
            delete: false,
            validate: false,
            export: false
          };
        }
        setPermissionMatrix(matrix);
        setIsPermModalOpen(true);
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const openResetModal = (u) => {
    setUserToReset(u);
    setCustomPassword('');
    setGeneratedPassword('');
    setIsResetModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, formData);
        setNotification({ type: 'success', message: 'Profil utilisateur mis à jour avec succès.' });
      } else {
        await api.post('/users', formData);
        setNotification({ type: 'success', message: 'Nouveau compte créé et permissions assignées.' });
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleTogglePerm = (moduleId, actionKey) => {
    setPermissionMatrix((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [actionKey]: !prev[moduleId]?.[actionKey]
      }
    }));
  };

  const handleToggleAllModule = (moduleId, enable) => {
    setPermissionMatrix((prev) => ({
      ...prev,
      [moduleId]: {
        view: enable,
        create: enable,
        edit: enable,
        delete: enable,
        validate: enable,
        export: enable
      }
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedUserForPerms) return;
    try {
      setSavingPerms(true);
      await api.put(`/users/${selectedUserForPerms.id}/permissions`, {
        permissions: permissionMatrix
      });
      setNotification({
        type: 'success',
        message: `Permissions granulaires enregistrées pour ${selectedUserForPerms.name}.`
      });
      setIsPermModalOpen(false);
      loadUsers();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setSavingPerms(false);
    }
  };

  const handleExecuteResetPassword = async () => {
    if (!userToReset) return;
    try {
      const res = await api.post(`/users/${userToReset.id}/reset-password`, {
        newPassword: customPassword
      });
      if (res.success) {
        setGeneratedPassword(res.temporaryPassword);
        setNotification({
          type: 'success',
          message: `Mot de passe réinitialisé pour ${userToReset.name}.`
        });
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleToggleStatus = async (u) => {
    const newStatus = u.status === 'active' ? 'inactive' : 'active';
    const actionFr = newStatus === 'active' ? 'activer' : 'suspendre';
    if (!window.confirm(`Confirmez-vous vouloir ${actionFr} le compte de ${u.name} ?`)) {
      return;
    }
    try {
      await api.post(`/users/${u.id}/status`, { status: newStatus });
      setNotification({
        type: 'success',
        message: `Le compte de ${u.name} a été ${newStatus === 'active' ? 'activé' : 'suspendu'}.`
      });
      loadUsers();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Action irréversible : Supprimer définitivement le compte de ${u.name} ?`)) {
      return;
    }
    try {
      await api.delete(`/users/${u.id}`);
      setNotification({ type: 'success', message: `Utilisateur ${u.name} supprimé.` });
      loadUsers();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const columns = [
    {
      header: 'Collaborateur',
      accessor: 'name',
      render: (u) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-navy-800 text-gold-400 font-bold text-xs flex items-center justify-center border border-navy-700">
            {u.name?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
              {u.name}
              {u.id === currentUser?.id && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-gold-100 text-gold-800 font-medium">
                  Vous
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Mail size={11} className="text-slate-400" />
              {u.email}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Rôle & Fonctions',
      accessor: 'role',
      render: (u) => {
        const roleInfo = getRoleDetails(u.role);
        return (
          <div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${roleInfo.badge}`}>
              {roleInfo.label}
            </span>
            <div className="text-[10px] text-slate-400 mt-0.5">{roleInfo.desc}</div>
          </div>
        );
      }
    },
    {
      header: 'Téléphone',
      accessor: 'phone',
      render: (u) =>
        u.phone ? (
          <span className="text-slate-600 text-xs flex items-center gap-1">
            <Phone size={11} className="text-slate-400" />
            {u.phone}
          </span>
        ) : (
          <span className="text-slate-400 italic text-[11px]">Non renseigné</span>
        )
    },
    {
      header: 'Statut du Compte',
      accessor: 'status',
      render: (u) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
            u.status === 'active'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}
          />
          {u.status === 'active' ? 'Actif' : 'Suspendu'}
        </span>
      )
    },
    {
      header: 'Dernière Connexion',
      accessor: 'last_login',
      render: (u) =>
        u.last_login ? (
          <span className="text-slate-600 text-[11px]">
            {formatDate(u.last_login)}
          </span>
        ) : (
          <span className="text-slate-400 italic text-[11px]">Jamais connecté</span>
        )
    },
    {
      header: 'Actions & Droits',
      align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1">
          {/* Matrice des permissions */}
          <button
            onClick={() => openPermissionsModal(u)}
            title="Personnaliser les permissions granulaires"
            className="p-1 rounded text-gold-600 hover:bg-gold-50 border border-gold-200 transition-colors"
          >
            <Sliders size={13} />
          </button>

          {/* Réinitialiser mot de passe */}
          <button
            onClick={() => openResetModal(u)}
            title="Réinitialiser le mot de passe"
            className="p-1 rounded text-amber-600 hover:bg-amber-50 border border-amber-200 transition-colors"
          >
            <Key size={13} />
          </button>

          {/* Éditer profil */}
          <button
            onClick={() => openEditModal(u)}
            title="Modifier le compte"
            className="p-1 rounded text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors"
          >
            <Edit2 size={13} />
          </button>

          {/* Suspendre / Activer */}
          {u.id !== currentUser?.id && (
            <button
              onClick={() => handleToggleStatus(u)}
              title={u.status === 'active' ? 'Suspendre l\'accès' : 'Réactiver l\'accès'}
              className={`p-1 rounded border transition-colors ${
                u.status === 'active'
                  ? 'text-rose-600 hover:bg-rose-50 border-rose-200'
                  : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
              }`}
            >
              {u.status === 'active' ? <UserX size={13} /> : <UserCheck size={13} />}
            </button>
          )}

          {/* Supprimer */}
          {u.id !== currentUser?.id && (
            <button
              onClick={() => handleDelete(u)}
              title="Supprimer définitivement"
              className="p-1 rounded text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-navy-900 text-gold-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-none">
                Contrôle d'Accès & Gestion des Utilisateurs
              </h1>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Gouvernance RBAC sécurisée, permissions granulaires et journalisation des audits pour KENAYA LOGISTIC
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Boutons d'onglets */}
          <div className="bg-slate-100 p-0.5 rounded-lg flex items-center border border-slate-200">
            <button
              onClick={() => handleTabChange('users')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                activeTab === 'users'
                  ? 'bg-white text-navy-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Comptes & Permissions
            </button>
            <button
              onClick={() => handleTabChange('audit')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${
                activeTab === 'audit'
                  ? 'bg-white text-navy-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History size={12} />
              Journal d'Audit
            </button>
          </div>

          {activeTab === 'users' && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-navy-900 to-navy-800 text-white hover:from-navy-800 hover:to-navy-700 shadow-sm transition-all"
            >
              <Plus size={14} className="text-gold-400" />
              <span>Nouveau Collaborateur</span>
            </button>
          )}

          {activeTab === 'audit' && (
            <button
              onClick={loadAuditLogs}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={12} className={loadingAudit ? 'animate-spin' : ''} />
              Actualiser
            </button>
          )}
        </div>
      </div>

      {notification && (
        <Alert
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Onglet 1 : Utilisateurs & Permissions */}
      {activeTab === 'users' && (
        <div className="space-y-3">
          {/* Bannière d'information politique de sécurité */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-900">
            <Lock size={16} className="text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Politique de Sécurité KENAYA LOGISTIC (Default Deny) :</span> Toute action non explicitement autorisée est bloquée tant au niveau de l'interface que par les contrôles stricts de l'API REST. Les secrétaires gèrent les clients, le fret et les expéditions mais n'ont aucun accès aux marges financières ou aux utilisateurs.
            </div>
          </div>

          <DataTable
            columns={columns}
            data={users}
            loading={loading}
            searchable={true}
            searchPlaceholder="Rechercher par collaborateur, email ou rôle..."
          />
        </div>
      )}

      {/* Onglet 2 : Journal d'Audit de Sécurité */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Traçabilité & Événements Sensibles (Dernières Opérations)
              </h2>
              <p className="text-[11px] text-slate-500">
                Chaque connexion, création, modification de droits ou réinitialisation de mot de passe est consignée.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {auditLogs.length} événements enregistrés
            </span>
          </div>

          {loadingAudit ? (
            <div className="p-8 text-center text-xs text-slate-500">Chargement des journaux d'audit...</div>
          ) : auditLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">Aucun journal d'audit pour le moment.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Horodatage</th>
                    <th className="py-2 px-3">Auteur / Profil</th>
                    <th className="py-2 px-3">Action Système</th>
                    <th className="py-2 px-3">Module</th>
                    <th className="py-2 px-3">Détails de l'Opération</th>
                    <th className="py-2 px-3">Adresse IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => {
                    let parsedDetails = null;
                    try {
                      parsedDetails = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
                    } catch {
                      parsedDetails = log.details;
                    }

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-900 whitespace-nowrap">
                          <div>{log.user_name || 'Système'}</div>
                          <span className="text-[10px] text-slate-400">{log.user_role || 'Auto'}</span>
                        </td>
                        <td className="py-2 px-3 font-semibold text-navy-900">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px]">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-700 capitalize font-medium">
                          {log.module}
                        </td>
                        <td className="py-2 px-3 text-slate-600 max-w-xs truncate">
                          {parsedDetails ? JSON.stringify(parsedDetails) : '—'}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap">
                          {log.ip_address || '127.0.0.1'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1 : Création / Édition Utilisateur */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `Modifier le collaborateur: ${editingUser.name}` : 'Nouveau Collaborateur'}
      >
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nom complet & Titre <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Grace Ondaye (Secrétaire de Direction)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-navy-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Adresse email professionnelle <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="secretaire@kenayalogistic.cg"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-navy-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {editingUser ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe initial *'}
            </label>
            <input
              type="password"
              required={!editingUser}
              placeholder="Au moins 6 caractères sécurisés"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-navy-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Rôle attribué <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-navy-900 bg-white"
              >
                <option value="secretary">Secrétaire (Clients, fret, expéditions, contrats)</option>
                <option value="agent">Agent logistique de quai / Opérateur</option>
                <option value="accountant">Comptable / Responsable Financier</option>
                <option value="tech_admin">Administrateur Technique (Flotte / GPS)</option>
                <option value="manager">Responsable d'exploitation / Manager</option>
                <option value="admin">Directrice Générale (Accès Total)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Téléphone de contact</label>
              <input
                type="text"
                placeholder="+242 06 123 45 67"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-navy-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Statut initial du compte</label>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={formData.status === 'active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                />
                Actif (Accès autorisé)
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={formData.status === 'inactive'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                />
                Suspendu (Accès bloqué)
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-navy-900 text-white hover:bg-navy-800 text-xs font-semibold shadow-sm"
            >
              {editingUser ? 'Enregistrer les modifications' : 'Créer le collaborateur'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2 : Matrice des Permissions Granulaires */}
      <Modal
        isOpen={isPermModalOpen}
        onClose={() => setIsPermModalOpen(false)}
        title={`Matrice des Droits & Permissions : ${selectedUserForPerms?.name}`}
      >
        <div className="space-y-3 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-900">Rôle attribué :</span>{' '}
              <span className="text-navy-900 font-bold">{selectedUserForPerms?.role}</span>
              <p className="text-[10px] text-slate-500">
                Cochez ou décochez les droits spécifiques (Consulter, Créer, Modifier, Supprimer, Valider, Exporter)
              </p>
            </div>
            {selectedUserForPerms?.role === 'admin' && (
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Accès Total Super-Admin
              </span>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-navy-950 text-white text-[10px] uppercase font-bold sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-3">Module Système</th>
                  {ACTIONS.map((a) => (
                    <th key={a.key} className="py-2 px-2 text-center">
                      {a.label}
                    </th>
                  ))}
                  <th className="py-2 px-2 text-center">Tous</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MODULES_CONFIG.map((mod) => {
                  const mPerms = permissionMatrix[mod.id] || {};
                  const allChecked = ACTIONS.every((a) => !!mPerms[a.key]);

                  return (
                    <tr key={mod.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3">
                        <div className="font-semibold text-slate-900">{mod.name}</div>
                        <div className="text-[10px] text-slate-500">{mod.desc}</div>
                      </td>

                      {ACTIONS.map((a) => {
                        const checked = !!mPerms[a.key];
                        return (
                          <td key={a.key} className="py-2 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={selectedUserForPerms?.role === 'admin'}
                              onChange={() => handleTogglePerm(mod.id, a.key)}
                              className="rounded border-slate-300 text-navy-900 focus:ring-navy-900 cursor-pointer disabled:opacity-50"
                            />
                          </td>
                        );
                      })}

                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          disabled={selectedUserForPerms?.role === 'admin'}
                          onClick={() => handleToggleAllModule(mod.id, !allChecked)}
                          className="text-[10px] px-1.5 py-0.5 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-50 font-medium text-slate-600"
                        >
                          {allChecked ? 'Aucun' : 'Tous'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsPermModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium"
            >
              Fermer
            </button>
            <button
              type="button"
              disabled={savingPerms || selectedUserForPerms?.role === 'admin'}
              onClick={handleSavePermissions}
              className="px-4 py-1.5 rounded-lg bg-navy-900 text-white hover:bg-navy-800 text-xs font-semibold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check size={13} className="text-gold-400" />
              <span>{savingPerms ? 'Enregistrement...' : 'Appliquer les Permissions'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3 : Réinitialisation Mot de passe */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title={`Réinitialiser le mot de passe : ${userToReset?.name}`}
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-600">
            Vous pouvez définir un mot de passe spécifique ou laisser le système en générer un automatiquement et de manière sécurisée pour ce collaborateur.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nouveau mot de passe personnalisé (optionnel)
            </label>
            <input
              type="text"
              placeholder="Laisser vide pour génération automatique (ex: Kenaya@8492)"
              value={customPassword}
              onChange={(e) => setCustomPassword(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:ring-1 focus:ring-navy-900"
            />
          </div>

          {generatedPassword && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
              <span className="font-bold text-xs block">Mot de passe temporaire généré :</span>
              <div className="mt-1 font-mono font-bold text-sm bg-white p-2 rounded border border-emerald-300 select-all text-emerald-800">
                {generatedPassword}
              </div>
              <p className="text-[10px] mt-1 text-emerald-700">
                Transmettez ce code confidentiel au collaborateur avec instruction de le modifier dès sa première connexion.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={handleExecuteResetPassword}
              className="px-4 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 text-xs font-semibold shadow-sm flex items-center gap-1.5"
            >
              <Key size={13} />
              <span>Réinitialiser Maintenant</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
