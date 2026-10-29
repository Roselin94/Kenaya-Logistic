import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Alert from '../components/common/Alert';
import { formatFCFA } from '../utils/formatters';
import { Users, Plus, Phone, Mail, MapPin, Eye, Edit2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ClientsList() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Brazzaville',
    id_number: '',
    notes: ''
  });

  const loadClients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clients');
      if (res.success) {
        setClients(res.data);
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const openCreateModal = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      city: 'Brazzaville',
      id_number: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone,
      email: client.email || '',
      address: client.address || '',
      city: client.city || 'Brazzaville',
      id_number: client.id_number || '',
      notes: client.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await api.put(`/clients/${editingClient.id}`, formData);
        setNotification({ type: 'success', message: 'Client mis à jour avec succès.' });
      } else {
        await api.post('/clients', formData);
        setNotification({ type: 'success', message: 'Nouveau client enregistré avec succès.' });
      }
      setIsModalOpen(false);
      loadClients();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce client ?')) return;
    try {
      await api.delete(`/clients/${id}`);
      setNotification({ type: 'success', message: 'Client supprimé avec succès.' });
      loadClients();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const columns = [
    {
      header: 'Client / Entreprise',
      render: (row) => (
        <div>
          <Link
            to={`/clients/${row.id}`}
            className="font-bold text-slate-900 hover:text-navy-800 text-sm flex items-center gap-1.5"
          >
            <span>{row.name}</span>
          </Link>
          <div className="text-xs text-slate-400 font-mono">
            {row.id_number ? `Réf: ${row.id_number}` : 'Client Particulier'}
          </div>
        </div>
      )
    },
    {
      header: 'Contacts',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1.5 text-slate-800 font-medium">
            <Phone size={13} className="text-slate-400 shrink-0" />
            <span>{row.phone}</span>
          </div>
          {row.email && (
            <div className="flex items-center gap-1.5 text-slate-500">
              <Mail size={13} className="text-slate-400 shrink-0" />
              <span>{row.email}</span>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Localisation',
      render: (row) => (
        <div className="text-xs">
          <div className="font-semibold text-navy-950 flex items-center gap-1">
            <MapPin size={13} className="text-gold-600 shrink-0" />
            <span>{row.city}</span>
          </div>
          <div className="text-slate-400 truncate max-w-[180px]">{row.address || 'Non spécifiée'}</div>
        </div>
      )
    },
    {
      header: 'Expéditions',
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-navy-50 text-navy-900 border border-navy-100">
          {row.total_shipments || 0} expéditions
        </span>
      )
    },
    {
      header: 'Total Facturé',
      render: (row) => (
        <span className="font-bold text-slate-800 text-xs">
          {formatFCFA(row.total_spent)}
        </span>
      )
    },
    {
      header: 'Solde Dû / Dette',
      render: (row) => {
        const debt = parseFloat(row.total_debt || 0);
        return (
          <span
            className={`text-xs font-extrabold px-2 py-0.5 rounded-full border ${
              debt > 0
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {debt > 0 ? formatFCFA(debt) : 'À jour (0 FCFA)'}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            to={`/clients/${row.id}`}
            className="p-1.5 rounded-lg text-navy-800 hover:bg-slate-100 transition-colors"
            title="Consulter l'historique complet"
          >
            <Eye size={16} />
          </Link>
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-navy-900 transition-colors"
            title="Modifier"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
            title="Supprimer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight">
            Répertoire des Clients & Comptes
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Fiches clients, suivi de l'encours financier, solde débiteur et historique de fret.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-navy-950 font-bold text-xs shadow-md shadow-gold-500/20 transition-all duration-200"
        >
          <Plus size={16} />
          <span>Nouveau Client</span>
        </button>
      </div>

      {notification && (
        <Alert
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Tableau des clients */}
      <DataTable
        columns={columns}
        data={clients}
        loading={loading}
        searchPlaceholder="Rechercher par nom, téléphone, RCCM, ville..."
        emptyMessage="Aucun client enregistré."
      />

      {/* Modal Création / Édition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? 'Modifier le Client' : 'Ajouter un Nouveau Client'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Nom complet ou Raison Sociale *
              </label>
              <input
                type="text"
                required
                placeholder="ex: SARL Congo Import-Export"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Numéro de Téléphone *
              </label>
              <input
                type="text"
                required
                placeholder="ex: +242 06 600 11 22"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Adresse Email
              </label>
              <input
                type="email"
                placeholder="ex: contact@congo-import.cg"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Ville Principale
              </label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
              >
                <option value="Brazzaville">Brazzaville</option>
                <option value="Pointe-Noire">Pointe-Noire</option>
                <option value="Dolisie">Dolisie</option>
                <option value="Nkayi">Nkayi</option>
                <option value="Oyo">Oyo</option>
                <option value="Ouesso">Ouesso</option>
                <option value="Impfondo">Impfondo</option>
                <option value="Mossendjo">Mossendjo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                N° CNI / Passeport / RCCM
              </label>
              <input
                type="text"
                placeholder="ex: RCCM-BZV-2022-B-1102"
                value={formData.id_number}
                onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Adresse physique (Quartier, Rue, Repère)
              </label>
              <input
                type="text"
                placeholder="ex: 45 Avenue de la Paix, Bacongo"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Notes ou particularités logistiques
              </label>
              <textarea
                rows="2"
                placeholder="Conditions particulières de livraison, horaires d'ouverture de l'entrepôt..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-navy-950 text-white font-bold text-xs hover:bg-navy-800 shadow-md transition-all"
            >
              {editingClient ? 'Enregistrer les modifications' : 'Créer le client'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

