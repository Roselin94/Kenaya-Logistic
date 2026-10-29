import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import { formatFCFA, formatDate, getVehicleStatusBadge } from '../utils/formatters';
import {
  Car,
  Plus,
  Filter,
  Eye,
  Edit2,
  Calendar,
  Fuel,
  Gauge,
  Users,
  CheckCircle,
  Wrench,
  ShieldCheck,
  MapPin
} from 'lucide-react';

export default function VehiclesList() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Formulaire d'ajout / modification
  const [form, setForm] = useState({
    brand: '',
    model: '',
    plate_number: '',
    year: new Date().getFullYear(),
    category: 'SUV / 4x4',
    transmission: 'Automatique',
    fuel_type: 'Diesel',
    seats: 5,
    mileage: 0,
    color: '',
    rate_hourly: 5000,
    rate_daily: 35000,
    rate_weekly: 210000,
    rate_monthly: 750000,
    deposit_amount: 150000,
    status: 'available',
    insurance_company: '',
    insurance_policy_number: '',
    insurance_expiry: '',
    technical_inspection_date: '',
    technical_inspection_expiry: '',
    gps_tracker_id: '',
    notes: ''
  });

  useEffect(() => {
    loadVehicles();
  }, [statusFilter]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/rentals/vehicles', { status: statusFilter });
      if (res.success && res.data) {
        setVehicles(res.data);
      }
    } catch (err) {
      setError(err.message || 'Impossible de récupérer la flotte automobile.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setForm({
      brand: '',
      model: '',
      plate_number: '',
      year: new Date().getFullYear(),
      category: 'SUV / 4x4',
      transmission: 'Automatique',
      fuel_type: 'Diesel',
      seats: 5,
      mileage: 0,
      color: '',
      rate_hourly: 5000,
      rate_daily: 35000,
      rate_weekly: 210000,
      rate_monthly: 750000,
      deposit_amount: 150000,
      status: 'available',
      insurance_company: 'Assurances Générales du Congo (AGC)',
      insurance_policy_number: '',
      insurance_expiry: '',
      technical_inspection_date: '',
      technical_inspection_expiry: '',
      gps_tracker_id: '',
      notes: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (v) => {
    setEditingVehicle(v);
    setForm({
      brand: v.brand || '',
      model: v.model || '',
      plate_number: v.plate_number || '',
      year: v.year || new Date().getFullYear(),
      category: v.category || 'SUV / 4x4',
      transmission: v.transmission || 'Automatique',
      fuel_type: v.fuel_type || 'Diesel',
      seats: v.seats || 5,
      mileage: v.mileage || 0,
      color: v.color || '',
      rate_hourly: v.rate_hourly || 5000,
      rate_daily: v.rate_daily || 35000,
      rate_weekly: v.rate_weekly || 210000,
      rate_monthly: v.rate_monthly || 750000,
      deposit_amount: v.deposit_amount || 150000,
      status: v.status || 'available',
      insurance_company: v.insurance_company || '',
      insurance_policy_number: v.insurance_policy_number || '',
      insurance_expiry: v.insurance_expiry ? v.insurance_expiry.split('T')[0] : '',
      technical_inspection_date: v.technical_inspection_date ? v.technical_inspection_date.split('T')[0] : '',
      technical_inspection_expiry: v.technical_inspection_expiry ? v.technical_inspection_expiry.split('T')[0] : '',
      gps_tracker_id: v.gps_tracker_id || '',
      notes: v.notes || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingVehicle) {
        await api.put(`/rentals/vehicles/${editingVehicle.id}`, form);
      } else {
        await api.post('/rentals/vehicles', form);
      }
      setModalOpen(false);
      loadVehicles();
    } catch (err) {
      alert(err.message || 'Erreur lors de l\'enregistrement du véhicule.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Véhicule & Immat.',
      render: (v) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-900 flex items-center justify-center font-black text-xs shrink-0">
            {v.brand?.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-navy-950 text-xs">
              {v.brand} {v.model} ({v.year})
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span className="font-semibold text-slate-700 bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
                {v.plate_number}
              </span>
              <span>•</span>
              <span>{v.category}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Caractéristiques',
      render: (v) => (
        <div className="text-[11px] text-slate-600 space-y-0.5">
          <div className="flex items-center gap-1">
            <Gauge size={12} className="text-slate-400" />
            <span>{Number(v.mileage).toLocaleString('fr-FR')} km</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span>{v.transmission}</span>
            <span>•</span>
            <span>{v.fuel_type}</span>
            <span>•</span>
            <span>{v.seats} places</span>
          </div>
        </div>
      )
    },
    {
      header: 'Grille Tarifaire (FCFA)',
      render: (v) => (
        <div className="text-[11px]">
          <div className="font-bold text-navy-950">
            {formatFCFA(v.rate_daily)} <span className="text-[10px] text-slate-400 font-normal">/ jour</span>
          </div>
          <div className="text-[10px] text-slate-500">
            Caution : <strong className="text-amber-700">{formatFCFA(v.deposit_amount)}</strong>
          </div>
        </div>
      )
    },
    {
      header: 'Localisation GPS',
      render: (v) => (
        <div className="text-[10.5px]">
          {v.gps_last_location ? (
            <div className="flex items-center gap-1 text-slate-600 truncate max-w-[160px]" title={v.gps_last_location}>
              <MapPin size={11} className="text-emerald-500 shrink-0" />
              <span className="truncate">{v.gps_last_location}</span>
            </div>
          ) : (
            <span className="text-slate-400">Non localisé</span>
          )}
        </div>
      )
    },
    {
      header: 'Statut',
      render: (v) => {
        const badge = getVehicleStatusBadge(v.status);
        return (
          <span className={`inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-full font-semibold border ${badge.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
            {badge.label}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (v) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenEdit(v)}
            className="p-1 rounded text-slate-400 hover:text-navy-900 hover:bg-slate-100 transition-colors"
            title="Modifier le véhicule"
          >
            <Edit2 size={13} />
          </button>
          <Link
            to={`/rentals/new?vehicle_id=${v.id}`}
            className="px-2 py-1 rounded bg-navy-950 hover:bg-navy-900 text-white text-[10.5px] font-semibold transition-colors"
          >
            Louer
          </Link>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-3.5">
      {/* En-tête de page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 rounded-xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-navy-950 flex items-center gap-1.5">
            <Car size={16} className="text-gold-500" />
            Parc Automobile & Flotte de Véhicules
          </h2>
          <p className="text-[11px] text-slate-500">
            Gestion des fiches techniques, tarifs, assurances et géolocalisation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="px-3 py-1.5 rounded-lg bg-navy-950 hover:bg-navy-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus size={14} className="text-gold-400" />
            Ajouter un Véhicule
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
          {error}
        </div>
      )}

      {/* Tableau des véhicules */}
      <DataTable
        columns={columns}
        data={vehicles}
        loading={loading}
        searchPlaceholder="Rechercher par marque, modèle ou plaque..."
        filterOptions={[
          { label: 'Tous les statuts', value: '' },
          { label: 'Disponibles', value: 'available' },
          { label: 'En location', value: 'rented' },
          { label: 'Réservés', value: 'reserved' },
          { label: 'En maintenance', value: 'maintenance' }
        ]}
        currentFilter={statusFilter}
        onFilterChange={setStatusFilter}
        emptyMessage="Aucun véhicule trouvé dans le parc automobile."
      />

      {/* Modal d'ajout / modification de véhicule */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingVehicle ? `Modifier : ${editingVehicle.brand} ${editingVehicle.model}` : 'Ajouter un véhicule à la flotte'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Marque *</label>
              <input
                type="text"
                required
                placeholder="ex: Toyota"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Modèle *</label>
              <input
                type="text"
                required
                placeholder="ex: Prado TXL V6"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Immatriculation *</label>
              <input
                type="text"
                required
                placeholder="ex: 124-KL-02"
                value={form.plate_number}
                onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
                className="w-full uppercase font-bold text-navy-950"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Année *</label>
              <input
                type="number"
                required
                value={form.year}
                onChange={(e) => setForm({ ...form, year: parseInt(e.target.value, 10) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Catégorie</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full"
              >
                <option value="SUV / 4x4">SUV / 4x4</option>
                <option value="Berline">Berline</option>
                <option value="Pick-up">Pick-up</option>
                <option value="Minibus">Minibus</option>
                <option value="Citadine">Citadine</option>
                <option value="Utilitaire / Fourgon">Utilitaire</option>
                <option value="Luxe / VIP">Luxe / VIP</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Boîte de vitesse</label>
              <select
                value={form.transmission}
                onChange={(e) => setForm({ ...form, transmission: e.target.value })}
                className="w-full"
              >
                <option value="Automatique">Automatique</option>
                <option value="Manuelle">Manuelle</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Carburant</label>
              <select
                value={form.fuel_type}
                onChange={(e) => setForm({ ...form, fuel_type: e.target.value })}
                className="w-full"
              >
                <option value="Diesel">Diesel</option>
                <option value="Essence">Essence</option>
                <option value="Hybride">Hybride</option>
              </select>
            </div>
          </div>

          {/* Grille de tarification */}
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
            <div className="text-[11px] font-bold uppercase tracking-wider text-navy-950 mb-2">
              Grille Tarifaire & Caution (FCFA)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Tarif journalier (24h) *</label>
                <input
                  type="number"
                  required
                  value={form.rate_daily}
                  onChange={(e) => setForm({ ...form, rate_daily: parseFloat(e.target.value) })}
                  className="w-full font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Tarif hebdomadaire</label>
                <input
                  type="number"
                  value={form.rate_weekly}
                  onChange={(e) => setForm({ ...form, rate_weekly: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Tarif mensuel</label>
                <input
                  type="number"
                  value={form.rate_monthly}
                  onChange={(e) => setForm({ ...form, rate_monthly: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Montant Caution *</label>
                <input
                  type="number"
                  required
                  value={form.deposit_amount}
                  onChange={(e) => setForm({ ...form, deposit_amount: parseFloat(e.target.value) })}
                  className="w-full font-bold text-amber-700"
                />
              </div>
            </div>
          </div>

          {/* Documents & Suivi technique */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Compagnie d'assurance</label>
              <input
                type="text"
                placeholder="ex: AGC, NSIA, ARC"
                value={form.insurance_company}
                onChange={(e) => setForm({ ...form, insurance_company: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Échéance Assurance</label>
              <input
                type="date"
                value={form.insurance_expiry}
                onChange={(e) => setForm({ ...form, insurance_expiry: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Échéance Contrôle Tech.</label>
              <input
                type="date"
                value={form.technical_inspection_expiry}
                onChange={(e) => setForm({ ...form, technical_inspection_expiry: e.target.value })}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Identifiant Traceur GPS</label>
              <input
                type="text"
                placeholder="ex: TK-PRADO-01"
                value={form.gps_tracker_id}
                onChange={(e) => setForm({ ...form, gps_tracker_id: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Statut initial</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full font-semibold"
              >
                <option value="available">Disponible</option>
                <option value="reserved">Réservé</option>
                <option value="rented">En location</option>
                <option value="maintenance">En maintenance</option>
                <option value="immobilized">Immobilisé</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg bg-navy-950 hover:bg-navy-900 text-white text-xs font-semibold shadow-xs"
            >
              {submitting ? 'Enregistrement...' : editingVehicle ? 'Mettre à jour' : 'Enregistrer le véhicule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

