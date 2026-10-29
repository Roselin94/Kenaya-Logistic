import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import Alert from '../components/common/Alert';
import { formatFCFA, formatDate, getPaymentStatusBadge } from '../utils/formatters';
import { FileText, Printer, Eye, DollarSign, ExternalLink } from 'lucide-react';

export default function InvoicesList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [notification, setNotification] = useState(null);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/invoices', { status: filterStatus });
      if (res.success) {
        setInvoices(res.data);
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [filterStatus]);

  const columns = [
    {
      header: 'N° Facture',
      render: (row) => (
        <div>
          <Link
            to={`/invoices/${row.id}`}
            className="font-mono font-bold text-navy-950 hover:text-gold-600 text-sm flex items-center gap-1.5"
          >
            <FileText size={14} className="text-gold-600 shrink-0" />
            <span>{row.invoice_number}</span>
          </Link>
          <div className="text-[11px] text-slate-400">Émise le {formatDate(row.issue_date)}</div>
        </div>
      )
    },
    {
      header: 'Client',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{row.client_name}</div>
          <div className="text-slate-400 text-[11px]">{row.client_city} • {row.client_phone}</div>
        </div>
      )
    },
    {
      header: 'Expédition & Trajet',
      render: (row) => (
        <div className="text-xs">
          <Link to={`/shipments/${row.shipment_id}`} className="font-mono font-bold text-blue-600 hover:underline">
            {row.tracking_number}
          </Link>
          <div className="text-slate-500 text-[11px]">
            {row.origin} → {row.destination}
          </div>
        </div>
      )
    },
    {
      header: 'Total Facturé',
      render: (row) => (
        <span className="font-bold text-navy-950 text-xs">
          {formatFCFA(row.total_amount)}
        </span>
      )
    },
    {
      header: 'Montant Réglé',
      render: (row) => (
        <span className="font-bold text-emerald-700 text-xs">
          {formatFCFA(row.paid_amount)}
        </span>
      )
    },
    {
      header: 'Statut Règlement',
      render: (row) => {
        const badge = getPaymentStatusBadge(row.status);
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}>
            {badge.label}
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
            to={`/invoices/${row.id}`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-navy-950 hover:bg-navy-800 text-white text-xs font-bold shadow-sm transition-all"
            title="Consulter et Imprimer"
          >
            <Printer size={13} className="text-gold-400" />
            <span>Imprimer</span>
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
            Factures & Reçus Imprimables
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Édition des factures de fret, reçus de paiement et bordereaux d'acheminement certifiés.
          </p>
        </div>
      </div>

      {notification && (
        <Alert
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Tableau des factures */}
      <DataTable
        columns={columns}
        data={invoices}
        loading={loading}
        searchPlaceholder="Rechercher par n° de facture, n° de suivi, client..."
        filterOptions={[
          { label: 'Tous les statuts', value: '' },
          { label: 'Payée intégralement', value: 'paid' },
          { label: 'Partiellement réglée', value: 'partially_paid' },
          { label: 'Non payée / En attente', value: 'unpaid' }
        ]}
        currentFilter={filterStatus}
        onFilterChange={setFilterStatus}
        emptyMessage="Aucune facture enregistrée."
      />
    </div>
  );
}

