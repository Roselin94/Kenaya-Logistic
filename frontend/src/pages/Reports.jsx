import React, { useState, useEffect } from 'react';
import api from '../services/api';
import KPICard from '../components/common/KPICard';
import { formatFCFA, formatDate, getShipmentStatusBadge } from '../utils/formatters';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  CreditCard,
  DollarSign,
  MapPin,
  Users,
  Truck,
  Filter
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function Reports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('destinations'); // 'destinations', 'clients', 'profitability'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/advanced', { startDate, endDate });
      if (res.success && res.data) {
        setReports(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [startDate, endDate]);

  const handlePreset = (type) => {
    const today = new Date();
    if (type === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (type === 'year') {
      const firstDay = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(today.toISOString().split('T')[0]);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const { summary, byDestination = [], byClient = [], shipmentProfitability = [] } = reports || {};

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight">
            Rapports d'Activité & Rentabilité
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Analyses multidimensionnelles par période, localité de destination, client et rentabilité de voyage.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-navy-950 hover:bg-navy-800 text-white font-bold text-xs shadow-md transition-all"
          >
            <Printer size={15} className="text-gold-400" />
            <span>Imprimer le Rapport d'Activité</span>
          </button>
        </div>
      </div>

      {/* Filtres de Période */}
      <div className="no-print bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Calendar size={15} className="text-navy-800" />
            <span>Du :</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span>Au :</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50"
            />
          </div>
        </div>

        {/* Boutons pré-réglages rapides */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => handlePreset('month')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
          >
            Ce Mois
          </button>
          <button
            onClick={() => handlePreset('year')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
          >
            Cette Année
          </button>
          <button
            onClick={() => handlePreset('all')}
            className="px-3 py-1.5 rounded-xl bg-navy-950 text-white font-semibold transition-colors"
          >
            Tout l'historique
          </button>
        </div>
      </div>

      {/* Cartes KPI Période */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <KPICard
          title="Recettes de la Période"
          value={formatFCFA(summary?.periodRevenue)}
          subtitle="Paiements réels encaissés"
          icon={TrendingUp}
          color="navy"
          badge="FCFA"
        />

        <KPICard
          title="Dépenses d'Exploitation"
          value={formatFCFA(summary?.periodExpenses)}
          subtitle="Charges directes et flotte"
          icon={CreditCard}
          color="white"
          badge="Charges"
        />

        <KPICard
          title="Bénéfice Net Période"
          value={formatFCFA(summary?.periodNetProfit)}
          subtitle="Résultat d'exploitation calculé"
          icon={DollarSign}
          color="emerald"
          badge="Net"
        />
      </div>

      {/* Onglets des rapports */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="no-print flex items-center gap-2 border-b border-slate-200 px-6 pt-3 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('destinations')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative ${
              activeTab === 'destinations'
                ? 'text-navy-950 border-b-2 border-gold-500'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Rapport par Destination ({byDestination.length})
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative ${
              activeTab === 'clients'
                ? 'text-navy-950 border-b-2 border-gold-500'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Top Clients & Chiffre d'Affaires ({byClient.length})
          </button>
          <button
            onClick={() => setActiveTab('profitability')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative ${
              activeTab === 'profitability'
                ? 'text-navy-950 border-b-2 border-gold-500'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Marge & Rentabilité par Voyage ({shipmentProfitability.length})
          </button>
        </div>

        <div className="p-6">
          {/* 1. Par Destination */}
          {activeTab === 'destinations' && (
            <div className="space-y-6">
              {/* Graphique des recettes par destination */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byDestination}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="destination" stroke="#94A3B8" fontSize={12} tickLine={false} />
                    <YAxis
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val) => [formatFCFA(val), 'Chiffre d\'Affaires']}
                      contentStyle={{ backgroundColor: '#0B192C', borderRadius: '10px', color: '#fff', border: 'none', fontSize: '12px' }}
                    />
                    <Bar dataKey="total_revenue" name="Total Facturé (FCFA)" fill="#0B192C" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400">
                    <tr>
                      <th className="px-4 py-2.5">Destination Finale</th>
                      <th className="px-4 py-2.5">Expéditions Totales</th>
                      <th className="px-4 py-2.5">Livrées</th>
                      <th className="px-4 py-2.5">Chiffre d'Affaires</th>
                      <th className="px-4 py-2.5">Total Encaissé</th>
                      <th className="px-4 py-2.5">Créances Restantes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {byDestination.map((d, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-navy-950 text-xs flex items-center gap-1.5">
                          <MapPin size={13} className="text-gold-600 shrink-0" />
                          <span>{d.destination}</span>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold">{d.total_shipments} convois</td>
                        <td className="px-4 py-3 text-xs text-emerald-700 font-bold">{d.delivered_count} livrées</td>
                        <td className="px-4 py-3 font-black text-navy-950 text-xs">{formatFCFA(d.total_revenue)}</td>
                        <td className="px-4 py-3 text-xs font-bold text-emerald-700">{formatFCFA(d.total_paid)}</td>
                        <td className="px-4 py-3 text-xs font-bold text-rose-700">{formatFCFA(d.total_unpaid)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Top Clients */}
          {activeTab === 'clients' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">Rang</th>
                    <th className="px-4 py-2.5">Client / Raison Sociale</th>
                    <th className="px-4 py-2.5">Ville</th>
                    <th className="px-4 py-2.5">Nombre d'Expéditions</th>
                    <th className="px-4 py-2.5">Chiffre d'Affaires Total</th>
                    <th className="px-4 py-2.5">Règlements Effectués</th>
                    <th className="px-4 py-2.5">Solde Dû</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {byClient.map((c, i) => (
                    <tr key={c.client_id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-400">
                        #{i + 1}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 text-xs">
                        {c.client_name}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{c.client_city}</td>
                      <td className="px-4 py-3 text-xs font-semibold">{c.total_shipments} voyages</td>
                      <td className="px-4 py-3 font-black text-navy-950 text-xs">{formatFCFA(c.total_invoiced)}</td>
                      <td className="px-4 py-3 font-bold text-emerald-700 text-xs">{formatFCFA(c.total_paid)}</td>
                      <td className={`px-4 py-3 font-bold text-xs ${c.total_debt > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                        {formatFCFA(c.total_debt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. Rentabilité par expédition */}
          {activeTab === 'profitability' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">N° Suivi</th>
                    <th className="px-4 py-2.5">Trajet RN1</th>
                    <th className="px-4 py-2.5">Client</th>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Chiffre d'Affaires (FCFA)</th>
                    <th className="px-4 py-2.5">Dépenses Directes (FCFA)</th>
                    <th className="px-4 py-2.5">Marge Brute Réalisée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shipmentProfitability.map((s) => {
                    const profit = parseFloat(s.gross_profit || 0);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono font-bold text-navy-950 text-xs">
                          {s.tracking_number}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                          {s.origin} → {s.destination}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-800">{s.client_name}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{formatDate(s.departure_date)}</td>
                        <td className="px-4 py-3 font-bold text-navy-950 text-xs">{formatFCFA(s.revenue)}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-rose-700">{formatFCFA(s.total_direct_expenses)}</td>
                        <td className={`px-4 py-3 font-black text-xs ${profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {formatFCFA(profit)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

