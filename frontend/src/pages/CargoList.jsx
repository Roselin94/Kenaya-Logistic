import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Alert from '../components/common/Alert';
import { formatFCFA, getCargoStatusBadge } from '../utils/formatters';
import { Package, Plus, Edit2, Trash2, Check, ExternalLink, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CargoList() {
  const [cargo, setCargo] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [notification, setNotification] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    client_id: '',
    designation: '',
    category: 'Marchandises Générales',
    quantity: 1,
    unit: 'Colis',
    weight_kg: '',
    volume_cbm: '',
    declared_value: '',
    status: 'enregistrée',
    barcode: ''
  });

  const loadCargo = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cargo', { status: filterStatus });
      if (res.success) {
        setCargo(res.data);
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const res = await api.get('/clients');
      if (res.success) {
        setClients(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCargo();
  }, [filterStatus]);

  useEffect(() => {
    loadClients();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      client_id: clients[0]?.id || '',
      designation: '',
      category: 'Marchandises Générales',
      quantity: 1,
      unit: 'Colis',
      weight_kg: '',
      volume_cbm: '',
      declared_value: '',
      status: 'enregistrée',
      barcode: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      client_id: item.client_id,
      designation: item.designation,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      weight_kg: item.weight_kg,
      volume_cbm: item.volume_cbm,
      declared_value: item.declared_value,
      status: item.status,
      barcode: item.barcode || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/cargo/${editingItem.id}`, formData);
        setNotification({ type: 'success', message: 'Marchandise modifiée avec succès.' });
      } else {
        await api.post('/cargo', formData);
        setNotification({ type: 'success', message: 'Marchandise enregistrée dans le système.' });
      }
      setIsModalOpen(false);
      loadCargo();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet enregistrement de marchandise ?')) return;
    try {
      await api.delete(`/cargo/${id}`);
      setNotification({ type: 'success', message: 'Marchandise supprimée avec succès.' });
      loadCargo();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const columns = [
    {
      header: 'Code / Réf',
      render: (row) => (
        <div className="font-mono text-xs font-bold text-navy-950 flex items-center gap-1.5">
          <QrCode size={14} className="text-gold-600 shrink-0" />
          <span>{row.barcode || `CARGO-${row.id}`}</span>
        </div>
      )
    },
    {
      header: 'Désignation & Catégorie',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900 text-sm">{row.designation}</div>
          <div className="text-xs text-slate-400 font-medium">{row.category}</div>
        </div>
      )
    },
    {
      header: 'Propriétaire (Client)',
      render: (row) => (
        <div>
          <div className="font-medium text-navy-900">{row.client_name}</div>
          <div className="text-xs text-slate-400">{row.client_phone}</div>
        </div>
      )
    },
    {
      header: 'Quantité & Unité',
      render: (row) => (
        <span className="font-bold text-slate-800">
          {row.quantity} <span className="font-normal text-slate-500 text-xs">{row.unit}</span>
        </span>
      )
    },
    {
      header: 'Poids (Kg) / Vol (m³)',
      render: (row) => (
        <div className="text-xs">
          <div className="font-bold text-slate-800">{row.weight_kg} kg</div>
          <div className="text-slate-400">{row.volume_cbm} m³</div>
        </div>
      )
    },
    {
      header: 'Valeur Déclarée',
      render: (row) => (
        <span className="font-bold text-navy-950 text-xs">
          {formatFCFA(row.declared_value)}
        </span>
      )
    },
    {
      header: 'Statut',
      render: (row) => {
        const badge = getCargoStatusBadge(row.status);
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg}`}>
            {badge.label}
          </span>
        );
      }
    },
    {
      header: 'Expédition Liée',
      render: (row) =>
        row.tracking_number ? (
          <Link
            to={`/shipments/${row.shipment_id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-navy-900 font-mono"
          >
            <span>{row.tracking_number}</span>
            <ExternalLink size={12} />
          </Link>
        ) : (
          <span className="text-xs text-slate-400 italic">Non assignée</span>
        )
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
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
            Gestion du Fret & Marchandises
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Inventaire des colis reçus au quai, pesée, volume et rattachement aux expéditions RN1.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-navy-950 font-bold text-xs shadow-md shadow-gold-500/20 transition-all duration-200"
        >
          <Plus size={16} />
          <span>Enregistrer une Marchandise</span>
        </button>
      </div>

      {notification && (
        <Alert
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Tableau interactif */}
      <DataTable
        columns={columns}
        data={cargo}
        loading={loading}
        searchPlaceholder="Rechercher désignation, code-barres, client..."
        filterOptions={[
          { label: 'Tous les statuts', value: '' },
          { label: 'Enregistrée au quai', value: 'enregistrée' },
          { label: 'En attente d\'expédition', value: 'en attente d\'expédition' },
          { label: 'En transit sur RN1', value: 'en transit' },
          { label: 'Au dépôt d\'arrivée', value: 'au dépôt' },
          { label: 'Livrée au client', value: 'livrée' },
          { label: 'Endommagée', value: 'endommagée' }
        ]}
        currentFilter={filterStatus}
        onFilterChange={setFilterStatus}
        emptyMessage="Aucune marchandise trouvée."
      />

      {/* Modal Création / Édition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Modifier la Marchandise' : 'Enregistrer une Nouvelle Marchandise'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Propriétaire de la marchandise (Client) *
              </label>
              <select
                required
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
              >
                <option value="">-- Sélectionner un client --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city}) - {c.phone}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Désignation de la marchandise *
              </label>
              <input
                type="text"
                required
                placeholder="ex: Cartons d'écrans LED 43 pouces"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Catégorie
              </label>
              <input
                type="text"
                placeholder="ex: Électronique, Textile, Outillage..."
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Code-barres / N° Suivi Fret
              </label>
              <input
                type="text"
                placeholder="Auto-généré si vide (KN-CARGO-...)"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Quantité *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Unité de conditionnement
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
              >
                <option value="Colis">Colis</option>
                <option value="Cartons">Cartons</option>
                <option value="Balles">Balles (Friperie)</option>
                <option value="Sacs">Sacs</option>
                <option value="Fûts">Fûts</option>
                <option value="Palettes">Palettes</option>
                <option value="Pièces">Pièces</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Poids Total (Kg)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="ex: 125.50"
                value={formData.weight_kg}
                onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Volume Total (m³)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="ex: 1.45"
                value={formData.volume_cbm}
                onChange={(e) => setFormData({ ...formData, volume_cbm: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Valeur Marchande Déclarée (en FCFA)
              </label>
              <input
                type="number"
                step="1000"
                placeholder="ex: 2500000"
                value={formData.declared_value}
                onChange={(e) => setFormData({ ...formData, declared_value: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Statut Initial
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
              >
                <option value="enregistrée">Enregistrée (Au quai)</option>
                <option value="en attente d'expédition">En attente d'expédition</option>
                <option value="en transit">En transit sur RN1</option>
                <option value="au dépôt">Au dépôt destination</option>
                <option value="livrée">Livrée</option>
                <option value="endommagée">Endommagée</option>
              </select>
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
              {editingItem ? 'Enregistrer les modifications' : 'Créer la marchandise'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

