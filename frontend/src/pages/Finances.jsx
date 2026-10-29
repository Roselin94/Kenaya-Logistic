import React, { useState, useEffect } from 'react';
import api from '../services/api';
import KPICard from '../components/common/KPICard';
import Modal from '../components/common/Modal';
import Alert from '../components/common/Alert';
import { formatFCFA, formatDate } from '../utils/formatters';
import {
  Wallet,
  TrendingUp,
  CreditCard,
  DollarSign,
  AlertCircle,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Finances() {
  const [overview, setOverview] = useState(null);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [debts, setDebts] = useState([]);
  const [clients, setClients] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'payments', 'expenses', 'debts'
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Formulaire Paiement
  const [paymentForm, setPaymentForm] = useState({
    client_id: '',
    shipment_id: '',
    amount: '',
    payment_method: 'Espèces',
    reference: '',
    notes: ''
  });

  // Formulaire Dépense
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'Carburant',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    paid_to: '',
    payment_method: 'Espèces',
    shipment_id: '',
    notes: ''
  });

  const loadAllFinancials = async () => {
    try {
      setLoading(true);
      const [ovRes, payRes, expRes, debtRes, clientRes, shipRes] = await Promise.all([
        api.get('/finances/overview'),
        api.get('/finances/payments'),
        api.get('/finances/expenses'),
        api.get('/finances/debts'),
        api.get('/clients'),
        api.get('/shipments')
      ]);

      if (ovRes.success) setOverview(ovRes.data);
      if (payRes.success) setPayments(payRes.data);
      if (expRes.success) setExpenses(expRes.data);
      if (debtRes.success) setDebts(debtRes.data);
      if (clientRes.success) setClients(clientRes.data);
      if (shipRes.success) setShipments(shipRes.data);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllFinancials();
  }, []);

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/finances/payments', paymentForm);
      setNotification({ type: 'success', message: 'Encaissement validé avec succès en caisse.' });
      setIsPaymentModalOpen(false);
      setPaymentForm({
        client_id: '',
        shipment_id: '',
        amount: '',
        payment_method: 'Espèces',
        reference: '',
        notes: ''
      });
      loadAllFinancials();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/finances/expenses', expenseForm);
      setNotification({ type: 'success', message: 'Dépense d\'exploitation enregistrée.' });
      setIsExpenseModalOpen(false);
      setExpenseForm({
        title: '',
        category: 'Carburant',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        paid_to: '',
        payment_method: 'Espèces',
        shipment_id: '',
        notes: ''
      });
      loadAllFinancials();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Voulez-vous supprimer cette écriture de dépense ?')) return;
    try {
      await api.delete(`/finances/expenses/${id}`);
      setNotification({ type: 'success', message: 'Dépense supprimée.' });
      loadAllFinancials();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight">
            Gestion Financière & Trésorerie
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Suivi des recettes, dépenses de flotte, bénéfice net et recouvrement des créances en FCFA (XAF).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
          >
            <Plus size={15} />
            <span>Enregistrer Dépense</span>
          </button>

          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-navy-950 font-bold text-xs shadow-md shadow-gold-500/20 transition-all"
          >
            <Plus size={15} />
            <span>Encaisser Paiement</span>
          </button>
        </div>
      </div>

      {notification && (
        <Alert
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Cartes KPI Financières */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          title="Recettes Totales"
          value={formatFCFA(overview?.totalRevenue)}
          subtitle="Paiements réels perçus"
          icon={TrendingUp}
          color="navy"
          badge="FCFA"
        />

        <KPICard
          title="Dépenses d'Exploitation"
          value={formatFCFA(overview?.totalExpenses)}
          subtitle="Carburant, péage, maintenance"
          icon={CreditCard}
          color="white"
          badge="Charges"
        />

        <KPICard
          title="Bénéfice Net"
          value={formatFCFA(overview?.netProfit)}
          subtitle={`Marge nette : ${overview?.profitMargin}%`}
          icon={DollarSign}
          color="emerald"
          badge="Résultat"
        />

        <KPICard
          title="Créances Clients"
          value={formatFCFA(overview?.totalDebts)}
          subtitle="Reste à recouvrer"
          icon={AlertCircle}
          color="gold"
          badge="Impayés"
        />
      </div>

      {/* Onglets Modules Financiers */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-200 px-6 pt-3 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative ${
              activeTab === 'overview'
                ? 'text-navy-950 border-b-2 border-gold-500'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Vue d'Ensemble & Catégories
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
          <button
            onClick={() => setActiveTab('expenses')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative ${
              activeTab === 'expenses'
                ? 'text-navy-950 border-b-2 border-gold-500'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Dépenses d'Exploitation ({expenses.length})
          </button>
          <button
            onClick={() => setActiveTab('debts')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative ${
              activeTab === 'debts'
                ? 'text-navy-950 border-b-2 border-gold-500'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Créances & Impayés ({debts.length})
          </button>
        </div>

        <div className="p-6">
          {/* 1. Vue d'ensemble */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dépenses par catégorie */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <h3 className="text-sm font-bold text-navy-950 mb-3 flex items-center justify-between">
                  <span>Dépenses par Catégorie</span>
                  <span className="text-xs text-slate-400 font-normal">Axe RN1</span>
                </h3>
                <div className="space-y-2">
                  {(overview?.expensesByCategory || []).map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{cat.category}</span>
                        <div className="text-[10px] text-slate-400">{cat.count} opération(s)</div>
                      </div>
                      <span className="font-black text-navy-950 font-mono">
                        {formatFCFA(cat.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Règlements par mode de paiement */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <h3 className="text-sm font-bold text-navy-950 mb-3 flex items-center justify-between">
                  <span>Recettes par Moyen de Paiement</span>
                  <span className="text-xs text-slate-400 font-normal">Congo</span>
                </h3>
                <div className="space-y-2">
                  {(overview?.paymentsByMethod || []).map((method, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{method.payment_method}</span>
                        <div className="text-[10px] text-slate-400">{method.count} transaction(s)</div>
                      </div>
                      <span className="font-black text-emerald-700 font-mono">
                        {formatFCFA(method.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. Paiements */}
          {activeTab === 'payments' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Client</th>
                    <th className="px-4 py-2.5">Expédition</th>
                    <th className="px-4 py-2.5">Mode</th>
                    <th className="px-4 py-2.5">Réf Transaction</th>
                    <th className="px-4 py-2.5">Montant Reçu</th>
                    <th className="px-4 py-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDate(p.payment_date, true)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 text-xs">
                        {p.client_name}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-navy-900">
                        {p.tracking_number ? (
                          <Link to={`/shipments/${p.shipment_id}`} className="hover:underline">
                            {p.tracking_number}
                          </Link>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                          {p.payment_method}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">
                        {p.reference || '-'}
                      </td>
                      <td className="px-4 py-3 font-black text-emerald-700 text-xs">
                        {formatFCFA(p.amount)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 italic">
                        {p.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. Dépenses */}
          {activeTab === 'expenses' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Intitulé</th>
                    <th className="px-4 py-2.5">Catégorie</th>
                    <th className="px-4 py-2.5">Bénéficiaire</th>
                    <th className="px-4 py-2.5">Expédition Liée</th>
                    <th className="px-4 py-2.5">Montant</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDate(e.expense_date)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 text-xs">
                        {e.title}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-navy-50 text-navy-800 border border-navy-100">
                          {e.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {e.paid_to || '-'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {e.tracking_number || 'Charge générale'}
                      </td>
                      <td className="px-4 py-3 font-black text-navy-950 text-xs">
                        {formatFCFA(e.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteExpense(e.id)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. Créances / Impayés */}
          {activeTab === 'debts' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">Client Débiteur</th>
                    <th className="px-4 py-2.5">Localité</th>
                    <th className="px-4 py-2.5">Téléphone</th>
                    <th className="px-4 py-2.5">Voyages Non Soldés</th>
                    <th className="px-4 py-2.5">Total Facturé</th>
                    <th className="px-4 py-2.5">Déjà Réglé</th>
                    <th className="px-4 py-2.5">Solde Dû (FCFA)</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {debts.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-xs text-emerald-700 font-semibold">
                        Toutes les créances clients sont recouvrées ! Aucun impayé en cours.
                      </td>
                    </tr>
                  ) : (
                    debts.map((d) => (
                      <tr key={d.client_id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-900 text-xs">
                          <Link to={`/clients/${d.client_id}`} className="hover:underline">
                            {d.client_name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{d.client_city}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{d.client_phone}</td>
                        <td className="px-4 py-3 text-xs font-semibold">{d.unpaid_shipments_count} expédition(s)</td>
                        <td className="px-4 py-3 text-xs">{formatFCFA(d.total_invoiced)}</td>
                        <td className="px-4 py-3 text-xs text-emerald-700">{formatFCFA(d.total_paid)}</td>
                        <td className="px-4 py-3 font-black text-rose-700 text-xs">
                          {formatFCFA(d.total_debt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setPaymentForm({
                                ...paymentForm,
                                client_id: d.client_id,
                                amount: d.total_debt
                              });
                              setIsPaymentModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gold-500 hover:bg-gold-400 text-navy-950 transition-colors"
                          >
                            Régler
                          </button>
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

      {/* Modal Encaisser Paiement */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Encaisser un Paiement Client (Recette)"
      >
        <form onSubmit={handleCreatePayment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Client concerné *
            </label>
            <select
              required
              value={paymentForm.client_id}
              onChange={(e) => setPaymentForm({ ...paymentForm, client_id: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold"
            >
              <option value="">-- Choisir un client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Rattacher à une expédition (optionnel)
            </label>
            <select
              value={paymentForm.shipment_id}
              onChange={(e) => setPaymentForm({ ...paymentForm, shipment_id: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono"
            >
              <option value="">-- Aucune expédition spécifique --</option>
              {shipments.map(s => (
                <option key={s.id} value={s.id}>
                  {s.tracking_number} ({s.origin} → {s.destination}) - Total: {formatFCFA(s.total_cost)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Montant versé (en FCFA) *
            </label>
            <input
              type="number"
              step="1000"
              required
              placeholder="ex: 500000"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-black text-navy-950"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Moyen de règlement *
            </label>
            <select
              value={paymentForm.payment_method}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold"
            >
              <option value="Espèces">Espèces (Versement caisse)</option>
              <option value="Airtel Money">Airtel Money Congo</option>
              <option value="MTN Mobile Money">MTN Mobile Money Congo</option>
              <option value="Virement bancaire">Virement bancaire (BGFI, LCB, etc.)</option>
              <option value="Chèque">Chèque certifié</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Référence du reçu / Transaction
            </label>
            <input
              type="text"
              placeholder="ex: AIRTEL-88912 ou Reçu N°..."
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
            />
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
            >
              Enregistrer l'encaissement
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Ajouter Dépense */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Enregistrer une Dépense d'Exploitation"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Intitulé de la dépense *
            </label>
            <input
              type="text"
              required
              placeholder="ex: Carburant Gazole convoi BZV-PNR"
              value={expenseForm.title}
              onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Catégorie *
              </label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold"
              >
                <option value="Carburant">Carburant</option>
                <option value="Péage RN1">Péage RN1 (Lifoula, Yié...)</option>
                <option value="Maintenance camion">Maintenance camion</option>
                <option value="Manutention">Manutention (Dockers)</option>
                <option value="Frais de douane / contrôle">Frais pont bascule / contrôle</option>
                <option value="Salaires / Chauffeurs">Salaires / Frais de mission</option>
                <option value="Loyer entrepôt">Loyer entrepôt</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Montant de la dépense (en FCFA) *
              </label>
              <input
                type="number"
                step="500"
                required
                placeholder="ex: 150000"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-black text-navy-950"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Date de la dépense *
              </label>
              <input
                type="date"
                required
                value={expenseForm.expense_date}
                onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Payé à (Fournisseur / Station)
              </label>
              <input
                type="text"
                placeholder="ex: Station Total Lifoula"
                value={expenseForm.paid_to}
                onChange={(e) => setExpenseForm({ ...expenseForm, paid_to: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Rattacher à une expédition (optionnel)
            </label>
            <select
              value={expenseForm.shipment_id}
              onChange={(e) => setExpenseForm({ ...expenseForm, shipment_id: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono"
            >
              <option value="">-- Dépense générale de structure --</option>
              {shipments.map(s => (
                <option key={s.id} value={s.id}>
                  {s.tracking_number} ({s.origin} → {s.destination})
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-navy-950 hover:bg-navy-800 text-white font-bold text-xs shadow-md"
            >
              Enregistrer la dépense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

