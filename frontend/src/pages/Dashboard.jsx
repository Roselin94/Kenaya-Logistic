import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import KPICard from '../components/common/KPICard';
import { formatFCFA, formatDate, getShipmentStatusBadge, getPaymentStatusBadge } from '../utils/formatters';
import {
  Truck,
  Package,
  TrendingUp,
  CreditCard,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Plus,
  Users,
  Navigation,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/stats');
        if (res.success && res.stats) {
          setStats(res.stats);
        }
      } catch (err) {
        setError(err.message || 'Impossible de charger les statistiques du tableau de bord.');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-gold-500 rounded-full animate-spin mb-4" />
        <div className="text-sm font-bold text-navy-950">Chargement du tableau de bord KENAYA LOGISTIC...</div>
        <div className="text-xs text-slate-400 mt-1">Calcul des indicateurs réels en cours</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800">
        <div className="flex items-center gap-2 font-bold mb-1">
          <AlertCircle size={20} />
          <span>Erreur de chargement</span>
        </div>
        <div className="text-sm">{error}</div>
      </div>
    );
  }

  const { shipments, cargo, finances, clients, destinationBreakdown, monthlyChart, recentShipments } = stats || {};

  const COLORS = ['#0B192C', '#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6'];

  return (
    <div className="space-y-8">
      {/* Barre d'accueil et statut opérationnel */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-navy-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gold-500/10 skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/20 text-gold-400 text-xs font-bold border border-gold-500/30 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Réseau Opérationnel Congo RN1 • Actif
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Supervision Générale des Opérations
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
              Gestion centralisée du fret entre Brazzaville, Pointe-Noire, Dolisie et d'autres ville ou localité du Congo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/shipments/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-navy-950 font-bold text-xs shadow-lg shadow-gold-500/20 transition-all duration-200"
            >
              <Plus size={16} />
              <span>Créer une Expédition</span>
            </Link>
            <Link
              to="/finances"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 backdrop-blur-sm transition-all"
            >
              <CreditCard size={15} />
              <span>Gérer les Paiements</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Cartes KPI Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          title="Recettes Encaissées"
          value={formatFCFA(finances?.totalRevenue)}
          subtitle="Paiements clients reçus"
          icon={TrendingUp}
          color="navy"
          badge="FCFA"
        />

        <KPICard
          title="Dépenses Exploitation"
          value={formatFCFA(finances?.totalExpenses)}
          subtitle="Carburant, péage RN1, entretien"
          icon={CreditCard}
          color="white"
          badge="Coûts"
        />

        <KPICard
          title="Bénéfice Net"
          value={formatFCFA(finances?.netProfit)}
          subtitle={`Marge opérationnelle: ${finances?.profitMargin}%`}
          icon={DollarSign}
          color="emerald"
          badge="Rentabilité"
        />

        <KPICard
          title="Créances / Dettes"
          value={formatFCFA(finances?.totalDebts)}
          subtitle="Impayés clients à recouvrer"
          icon={AlertCircle}
          color="gold"
          badge="En attente"
        />
      </div>

      {/* Deuxième rangée KPI : Flux et Marchandises */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Expéditions Actives</span>
            <Truck size={17} className="text-navy-800" />
          </div>
          <div className="text-2xl font-black text-navy-950 mt-1">
            {(shipments?.in_transit || 0) + (shipments?.pending || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-blue-600 font-bold">{shipments?.in_transit || 0} en transit</span> • {shipments?.pending || 0} en attente
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Livrées avec succès</span>
            <CheckCircle size={17} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {shipments?.delivered || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Sur un total de {shipments?.total || 0} voyages
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Poids Total Fret</span>
            <Package size={17} className="text-gold-600" />
          </div>
          <div className="text-2xl font-black text-navy-950 mt-1">
            {((cargo?.totalWeightKg || 0) / 1000).toFixed(1)} <span className="text-sm font-bold text-slate-500">Tonnes</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {cargo?.totalQuantity || 0} colis enregistrés
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Valeur Marchande Déclarée</span>
            <Users size={17} className="text-purple-600" />
          </div>
          <div className="text-xl font-black text-navy-950 mt-1 truncate">
            {formatFCFA(cargo?.totalDeclaredValue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {clients?.total || 0} clients enregistrés
          </div>
        </div>
      </div>

      {/* Graphiques Interactifs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique Recettes vs Dépenses */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-navy-950">
                Évolution Financière Réelle
              </h3>
              <p className="text-xs text-slate-400">Recettes encaissées vs Dépenses d'exploitation (FCFA)</p>
            </div>
            <span className="text-xs font-bold text-gold-600 bg-gold-50 px-2.5 py-1 rounded-lg border border-gold-200">
              Devise : FCFA (XAF)
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyChart || []}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value) => [formatFCFA(value), '']}
                  contentStyle={{
                    backgroundColor: '#0B192C',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="recettes" name="Recettes (FCFA)" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                <Bar dataKey="depenses" name="Dépenses (FCFA)" fill="#0B192C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Répartition par Destination */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-navy-950 mb-1">
            Fret par Destination
          </h3>
          <p className="text-xs text-slate-400 mb-4">Répartition des flux depuis Brazzaville</p>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={destinationBreakdown || []}
                  dataKey="count"
                  nameKey="destination"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={4}
                >
                  {(destinationBreakdown || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} expéditions`, name]}
                  contentStyle={{
                    backgroundColor: '#0B192C',
                    borderRadius: '10px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 space-y-1.5 flex-1 overflow-y-auto max-h-36">
            {(destinationBreakdown || []).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-none">
                <span className="flex items-center gap-2 text-slate-700 font-medium">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  {item.destination}
                </span>
                <span className="font-bold text-navy-950">{item.count} voyages</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dernières Expéditions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-navy-950">
              Dernières Expéditions Traitées
            </h3>
            <p className="text-xs text-slate-400">Consultez et suivez l'acheminement en temps réel</p>
          </div>
          <Link
            to="/shipments"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-800 hover:text-gold-600 transition-colors"
          >
            <span>Voir toutes les expéditions</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">N° Suivi</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Trajet</th>
                <th className="px-4 py-3">Date Départ</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Paiement</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 rounded-r-xl text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(recentShipments || []).map((shipment) => {
                const statusBadge = getShipmentStatusBadge(shipment.status);
                const paymentBadge = getPaymentStatusBadge(shipment.payment_status);

                return (
                  <tr key={shipment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-navy-950">
                      <Link to={`/shipments/${shipment.id}`} className="hover:text-gold-600 font-mono">
                        {shipment.tracking_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      {shipment.client_name}
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      <span className="font-semibold text-slate-700">{shipment.origin}</span>
                      <span className="text-slate-400 mx-1">→</span>
                      <span className="font-semibold text-navy-800">{shipment.destination}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {formatDate(shipment.departure_date)}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-navy-950 text-xs">
                      {formatFCFA(shipment.total_cost)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${paymentBadge.bg}`}>
                        {paymentBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        to={`/shipments/${shipment.id}`}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-navy-900 hover:text-white transition-colors"
                      >
                        Détails
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

