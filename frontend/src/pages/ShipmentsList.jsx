import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import Alert from '../components/common/Alert';
import { formatFCFA, formatDate, getShipmentStatusBadge, getPaymentStatusBadge } from '../utils/formatters';
import { Truck, Plus, Eye, Navigation, FileText, ArrowRight, Filter } from 'lucide-react';

export default function ShipmentsList() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDestination, setFilterDestination] = useState('');
  const [notification, setNotification] = useState(null);

  const loadShipments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/shipments', {
        status: filterStatus,
        destination: filterDestination
      });
      if (res.success) {
        setShipments(res.data);
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipments();
  }, [filterStatus, filterDestination]);

  const columns = [
    {
      header: 'N° de Suivi',
      render: (row) => (
        <div>
          <Link
            to={`/shipments/${row.id}`}
            className="font-mono font-bold text-navy-950 hover:text-gold-600 text-sm flex items-center gap-1"
          >
            <span>{row.tracking_number}</span>
          </Link>
          <div className="text-[11px] text-slate-400 font-medium">
            Créé le {formatDate(row.created_at)}
          </div>
        </div>
      )
    },
    {
      header: 'Trajet & Axe Routier',
      render: (row) => (
        <div className="text-xs">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <span className="text-slate-600">{row.origin}</span>
            <span className="text-gold-600 font-black">→</span>
            <span className="text-navy-900">{row.destination}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {row.vehicle_plate ? `Véhicule: ${row.vehicle_plate}` : 'Flotte Kenaya'}
          </div>
        </div>
      )
    },
    {
      header: 'Client & Destinataire',
      render: (row) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-900">{row.client_name}</div>
          <div className="text-slate-500 flex items-center gap-1">
            <span>Destinataire: {row.receiver_name}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Dates d\'acheminement',
      render: (row) => (
        <div className="text-xs text-slate-600">
          <div>
            <span className="text-slate-400 font-medium">Départ:</span> {formatDate(row.departure_date)}
          </div>
          <div>
            <span className="text-slate-400 font-medium">Arrivée:</span>{' '}
            {row.actual_arrival ? (
              <span className="text-emerald-700 font-semibold">{formatDate(row.actual_arrival)}</span>
            ) : (
              formatDate(row.estimated_arrival)
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Fret (Colis / Poids)',
      render: (row) => (
        <div className="text-xs font-medium text-slate-700">
          <div>{row.cargo_count || 0} colis lié(s)</div>
          <div className="text-slate-400 font-mono text-[11px]">
            {row.total_weight ? `${row.total_weight} kg` : '-'}
          </div>
        </div>
      )
    },
    {
      header: 'Frais & Règlements',
      render: (row) => {
        const paymentBadge = getPaymentStatusBadge(row.payment_status);
        return (
          <div className="text-xs">
            <div className="font-extrabold text-navy-950">
              {formatFCFA(row.total_cost)}
            </div>
            <div className="mt-0.5">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${paymentBadge.bg}`}>
                {paymentBadge.label}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Statut du Voyage',
      render: (row) => {
        const statusBadge = getShipmentStatusBadge(row.status);
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadge.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
            {statusBadge.label}
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
            to={`/shipments/${row.id}`}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-navy-950 transition-colors"
            title="Consulter l'expédition"
          >
            <Eye size={16} />
          </Link>
          <Link
            to={`/tracking`}
            className="p-1.5 rounded-lg text-gold-600 hover:bg-gold-50 transition-colors"
            title="Mettre à jour le suivi"
          >
            <Navigation size={15} />
          </Link>
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
            Gestion des Expéditions de Fret
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Convois routiers sur la RN1, statut d'acheminement, gestion des transporteurs et tarification.
          </p>
        </div>

        <Link
          to="/shipments/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-navy-950 font-bold text-xs shadow-md shadow-gold-500/20 transition-all duration-200"
        >
          <Plus size={16} />
          <span>Nouvelle Expédition</span>
        </Link>
      </div>

      {notification && (
        <Alert
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Filtres par Destination */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-xs">
        <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider px-2">
          Destination :
        </span>
        {['', 'Pointe-Noire', 'Brazzaville', 'Dolisie', 'Oyo', 'Ouesso'].map((dest) => (
          <button
            key={dest}
            onClick={() => setFilterDestination(dest)}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              filterDestination === dest
                ? 'bg-navy-950 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {dest || 'Toutes les localités'}
          </button>
        ))}
      </div>

      {/* Tableau des expéditions */}
      <DataTable
        columns={columns}
        data={shipments}
        loading={loading}
        searchPlaceholder="Rechercher par n° de suivi (KN-...), expéditeur, chauffeur, plaque..."
        filterOptions={[
          { label: 'Tous les statuts', value: '' },
          { label: 'En attente', value: 'en attente' },
          { label: 'En transit sur RN1', value: 'en transit' },
          { label: 'Arrivée à destination', value: 'arrivée à destination' },
          { label: 'Livrée au client', value: 'livrée' },
          { label: 'Annulée', value: 'annulée' }
        ]}
        currentFilter={filterStatus}
        onFilterChange={setFilterStatus}
        emptyMessage="Aucune expédition trouvée pour ces critères."
      />
    </div>
  );
}

