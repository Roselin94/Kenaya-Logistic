import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import { formatFCFA, formatDate, getRentalStatusBadge, getDepositStatusBadge } from '../utils/formatters';
import {
  KeyRound,
  Plus,
  Car,
  User,
  Calendar,
  Eye,
  FileText,
  AlertCircle,
  Clock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function RentalsList() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadRentals();
  }, [statusFilter]);

  const loadRentals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/rentals/rentals', { status: statusFilter });
      if (res.success && res.data) {
        setRentals(res.data);
      }
    } catch (err) {
      setError(err.message || 'Impossible de récupérer la liste des locations.');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: 'N° Contrat & Date',
      render: (r) => (
        <div>
          <div className="font-bold text-navy-950 text-xs flex items-center gap-1.5">
            <KeyRound size={12} className="text-gold-500" />
            {r.rental_number}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Créé le {formatDate(r.created_at)}
          </div>
        </div>
      )
    },
    {
      header: 'Véhicule',
      render: (r) => (
        <div>
          <div className="font-semibold text-navy-900 text-xs">
            {r.brand} {r.model}
          </div>
          <div className="text-[10.5px] text-slate-500 flex items-center gap-1 mt-0.5">
            <span className="font-bold bg-slate-100 text-slate-700 px-1 py-0.2 rounded border border-slate-200">
              {r.plate_number}
            </span>
            <span>•</span>
            <span>{r.category}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Client & Contact',
      render: (r) => (
        <div>
          <div className="font-semibold text-navy-950 text-xs">
            {r.client_name}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {r.client_phone}
          </div>
        </div>
      )
    },
    {
      header: 'Période de Location',
      render: (r) => (
        <div className="text-[11px] text-slate-600">
          <div>Du <strong className="text-navy-900">{formatDate(r.start_datetime, true)}</strong></div>
          <div>Au <strong className="text-navy-900">{formatDate(r.end_datetime, true)}</strong></div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Durée : {r.duration_units} {r.rate_type === 'daily' ? 'jour(s)' : r.rate_type}
          </div>
        </div>
      )
    },
    {
      header: 'Montant & Caution (FCFA)',
      render: (r) => {
        const dBadge = getDepositStatusBadge(r.deposit_status);
        return (
          <div className="text-[11px]">
            <div className="font-bold text-navy-950">
              {formatFCFA(r.total_amount)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
              <span>Payé : {formatFCFA(r.paid_amount)}</span>
            </div>
            <div className="mt-1">
              <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-semibold border ${dBadge.bg}`}>
                {dBadge.label} ({formatFCFA(r.deposit_amount)})
              </span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Statut',
      render: (r) => {
        const badge = getRentalStatusBadge(r.status);
        return (
          <span className={`inline-block text-[10.5px] px-2 py-0.5 rounded-full font-semibold border ${badge.bg}`}>
            {badge.label}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            to={`/rentals/${r.id}`}
            className="px-2 py-1 rounded bg-slate-100 hover:bg-navy-950 hover:text-white text-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors"
          >
            <Eye size={12} />
            <span>Détails & Contrat</span>
          </Link>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-3.5">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 rounded-xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-navy-950 flex items-center gap-1.5">
            <KeyRound size={16} className="text-gold-500" />
            Contrats de Location & Réservations
          </h2>
          <p className="text-[11px] text-slate-500">
            Suivi des dossiers, encaissements, cautions et états des lieux
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/rentals/new"
            className="px-3 py-1.5 rounded-lg bg-navy-950 hover:bg-navy-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus size={14} className="text-gold-400" />
            Créer une Réservation
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
          {error}
        </div>
      )}

      {/* Tableau interactif */}
      <DataTable
        columns={columns}
        data={rentals}
        loading={loading}
        searchPlaceholder="Rechercher par n° contrat, client ou véhicule..."
        filterOptions={[
          { label: 'Tous les statuts', value: '' },
          { label: 'En cours (Active)', value: 'active' },
          { label: 'Confirmées', value: 'confirmed' },
          { label: 'Clôturées (Terminées)', value: 'completed' },
          { label: 'Annulées', value: 'cancelled' }
        ]}
        currentFilter={statusFilter}
        onFilterChange={setStatusFilter}
        emptyMessage="Aucun contrat de location enregistré."
      />
    </div>
  );
}

