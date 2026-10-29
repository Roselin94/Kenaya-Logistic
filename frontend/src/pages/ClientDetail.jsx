import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { formatFCFA, formatDate, getShipmentStatusBadge, getPaymentStatusBadge, getCargoStatusBadge } from '../utils/formatters';
import {
  Users,
  Phone,
  Mail,
  MapPin,
  Truck,
  Package,
  CreditCard,
  FileText,
  ArrowLeft,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('shipments'); // 'shipments', 'cargo', 'invoices', 'payments'

  useEffect(() => {
    async function loadClient() {
      try {
        setLoading(true);
        const res = await api.get(`/clients/${id}`);
        if (res.success && res.data) {
          setClient(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadClient();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-gold-500 rounded-full animate-spin mb-3" />
        <div className="text-sm font-semibold text-navy-950">Chargement de la fiche client...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <AlertCircle size={36} className="mx-auto text-rose-500 mb-2" />
        <h3 className="text-base font-bold text-navy-950">Client introuvable</h3>
        <Link to="/clients" className="mt-3 inline-block text-xs font-bold text-navy-800 underline">
          Retour au répertoire des clients
        </Link>
      </div>
    );
  }

  const { stats, shipments = [], cargo = [], invoices = [], payments = [] } = client;

  return (
    <div className="space-y-6">
      {/* Retour */}
      <div>
        <Link
          to="/clients"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy-950 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Retour à la liste des clients</span>
        </Link>
      </div>

      {/* Carte Résumé Client */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-navy-950 to-navy-800 text-gold-400 font-black text-2xl flex items-center justify-center shadow-md">
              {client.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight">
                  {client.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-navy-50 text-navy-900 border border-navy-100">
                  {client.city}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                {client.id_number ? `Réf légale: ${client.id_number}` : 'Compte Standard'}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Phone size={13} className="text-slate-400" />
                  <span className="font-semibold">{client.phone}</span>
                </span>
                {client.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail size={13} className="text-slate-400" />
                    <span>{client.email}</span>
                  </span>
                )}
                {client.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400" />
                    <span>{client.address}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Synthèse financière du compte */}
          <div className="grid grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 text-center">
            <div className="bg-slate-50 p-3 rounded-xl">
              <div className="text-[10px] font-bold uppercase text-slate-400">Total Fret</div>
              <div className="text-sm font-black text-navy-950 mt-0.5">
                {formatFCFA(stats?.totalSpent)}
              </div>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl">
              <div className="text-[10px] font-bold uppercase text-emerald-700">Total Réglé</div>
              <div className="text-sm font-black text-emerald-700 mt-0.5">
                {formatFCFA(stats?.totalPaid)}
              </div>
            </div>
            <div className={`p-3 rounded-xl ${stats?.currentDebt > 0 ? 'bg-rose-50' : 'bg-slate-50'}`}>
              <div className={`text-[10px] font-bold uppercase ${stats?.currentDebt > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                Solde Dû
              </div>
              <div className={`text-sm font-black mt-0.5 ${stats?.currentDebt > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                {formatFCFA(stats?.currentDebt)}
              </div>
            </div>
          </div>
        </div>

        {client.notes && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 italic">
            Note interne : {client.notes}
          </div>
        )}
      </div>

      {/* Onglets d'historique */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-200 px-6 pt-3 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('shipments')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative ${
              activeTab === 'shipments'
                ? 'text-navy-950 border-b-2 border-gold-500'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Expéditions ({shipments.length})
          </button>
          <button
            onClick={() => setActiveTab('cargo')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative ${
              activeTab === 'cargo'
                ? 'text-navy-950 border-b-2 border-gold-500'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Marchandises ({cargo.length})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative ${
              activeTab === 'invoices'
                ? 'text-navy-950 border-b-2 border-gold-500'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Factures & Reçus ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative ${
              activeTab === 'payments'
                ? 'text-navy-950 border-b-2 border-gold-500'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Paiements Reçus ({payments.length})
          </button>
        </div>

        <div className="p-6">
          {/* 1. Tab Expéditions */}
          {activeTab === 'shipments' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">N° Suivi</th>
                    <th className="px-4 py-2.5">Trajet</th>
                    <th className="px-4 py-2.5">Destinataire</th>
                    <th className="px-4 py-2.5">Date Départ</th>
                    <th className="px-4 py-2.5">Montant Total</th>
                    <th className="px-4 py-2.5">Statut Voyage</th>
                    <th className="px-4 py-2.5 text-right">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shipments.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-xs text-slate-400">
                        Aucune expédition passée pour ce client.
                      </td>
                    </tr>
                  ) : (
                    shipments.map((s) => {
                      const badge = getShipmentStatusBadge(s.status);
                      return (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono font-bold text-navy-950">
                            {s.tracking_number}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <span className="font-semibold">{s.origin}</span> → <span className="font-semibold text-navy-800">{s.destination}</span>
                          </td>
                          <td className="px-4 py-3 text-xs font-medium text-slate-800">
                            {s.receiver_name} ({s.receiver_phone})
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {formatDate(s.departure_date)}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-navy-950">
                            {formatFCFA(s.total_cost)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              to={`/shipments/${s.id}`}
                              className="text-xs font-bold text-blue-600 hover:text-navy-950 underline"
                            >
                              Consulter
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. Tab Marchandises */}
          {activeTab === 'cargo' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">Réf Fret</th>
                    <th className="px-4 py-2.5">Désignation</th>
                    <th className="px-4 py-2.5">Catégorie</th>
                    <th className="px-4 py-2.5">Quantité</th>
                    <th className="px-4 py-2.5">Poids (kg)</th>
                    <th className="px-4 py-2.5">Valeur Déclarée</th>
                    <th className="px-4 py-2.5">Statut Colis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cargo.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-xs text-slate-400">
                        Aucune marchandise répertoriée pour ce client.
                      </td>
                    </tr>
                  ) : (
                    cargo.map((item) => {
                      const badge = getCargoStatusBadge(item.status);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono text-xs font-bold text-navy-950">
                            {item.barcode || `CARGO-${item.id}`}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900 text-xs">
                            {item.designation}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {item.category}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {item.weight_kg} kg
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-navy-950">
                            {formatFCFA(item.declared_value)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. Tab Factures */}
          {activeTab === 'invoices' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">N° Facture</th>
                    <th className="px-4 py-2.5">Expédition Liée</th>
                    <th className="px-4 py-2.5">Date d'émission</th>
                    <th className="px-4 py-2.5">Montant Total</th>
                    <th className="px-4 py-2.5">Montant Réglé</th>
                    <th className="px-4 py-2.5">Statut</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-xs text-slate-400">
                        Aucune facture enregistrée pour ce compte.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => {
                      const badge = getPaymentStatusBadge(inv.status);
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono font-bold text-navy-950">
                            {inv.invoice_number}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-slate-700">
                            {inv.tracking_number}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {formatDate(inv.issue_date)}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-navy-950">
                            {formatFCFA(inv.total_amount)}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-emerald-700">
                            {formatFCFA(inv.paid_amount)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              to={`/invoices/${inv.id}`}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-navy-950 text-white hover:bg-navy-800 transition-colors"
                            >
                              Imprimer
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. Tab Paiements */}
          {activeTab === 'payments' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">Date Encaissé</th>
                    <th className="px-4 py-2.5">Réf Transaction</th>
                    <th className="px-4 py-2.5">Expédition</th>
                    <th className="px-4 py-2.5">Mode de règlement</th>
                    <th className="px-4 py-2.5">Montant Versé</th>
                    <th className="px-4 py-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-xs text-slate-400">
                        Aucun paiement enregistré pour l'instant.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {formatDate(p.payment_date, true)}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-bold text-slate-800">
                          {p.reference || '-'}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-navy-800">
                          {p.tracking_number || '-'}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {p.payment_method}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-black text-emerald-700">
                          {formatFCFA(p.amount)}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 italic">
                          {p.notes || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

