import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/common/Modal';
import Alert from '../components/common/Alert';
import { formatFCFA, formatDate, getShipmentStatusBadge, getPaymentStatusBadge, getCargoStatusBadge } from '../utils/formatters';
import {
  Truck,
  ArrowLeft,
  Navigation,
  MapPin,
  Calendar,
  User,
  Phone,
  Package,
  CreditCard,
  FileText,
  Clock,
  Printer,
  Plus,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function ShipmentDetail() {
  const { id } = useParams();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // Formulaire changement de statut
  const [statusForm, setStatusForm] = useState({
    status: 'en transit',
    location: '',
    description: ''
  });

  // Formulaire versement paiement
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'Espèces',
    reference: '',
    notes: ''
  });

  const loadShipment = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/shipments/${id}`);
      if (res.success && res.data) {
        setShipment(res.data);
        setStatusForm({
          status: res.data.status,
          location: res.data.destination || 'En route RN1',
          description: `Progression de l'acheminement.`
        });
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipment();
  }, [id]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/shipments/${id}/status`, statusForm);
      setNotification({ type: 'success', message: `Statut mis à jour : "${statusForm.status}".` });
      setIsStatusModalOpen(false);
      loadShipment();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/finances/payments', {
        shipment_id: id,
        client_id: shipment.client_id,
        amount: paymentForm.amount,
        payment_method: paymentForm.payment_method,
        reference: paymentForm.reference,
        notes: paymentForm.notes
      });
      setNotification({ type: 'success', message: 'Paiement enregistré avec succès.' });
      setIsPaymentModalOpen(false);
      loadShipment();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-gold-500 rounded-full animate-spin mb-3" />
        <div className="text-sm font-semibold text-navy-950">Chargement de l'expédition...</div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <AlertCircle size={36} className="mx-auto text-rose-500 mb-2" />
        <h3 className="text-base font-bold text-navy-950">Expédition introuvable</h3>
        <Link to="/shipments" className="mt-3 inline-block text-xs font-bold text-navy-800 underline">
          Retour aux expéditions
        </Link>
      </div>
    );
  }

  const statusBadge = getShipmentStatusBadge(shipment.status);
  const paymentBadge = getPaymentStatusBadge(shipment.payment_status);
  const remainingDebt = parseFloat(shipment.total_cost || 0) - parseFloat(shipment.paid_amount || 0);

  return (
    <div className="space-y-6">
      {/* Barre de retour et actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/shipments"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy-950 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Retour à la liste des expéditions</span>
        </Link>

        <div className="flex items-center gap-2">
          {shipment.invoice && (
            <Link
              to={`/invoices/${shipment.invoice.id}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
            >
              <Printer size={14} />
              <span>Facture / Reçu</span>
            </Link>
          )}

          <button
            onClick={() => setIsStatusModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-navy-950 hover:bg-navy-800 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Navigation size={14} className="text-gold-400" />
            <span>Mettre à jour le statut</span>
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

      {/* En-tête de l'expédition */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
                {shipment.tracking_number}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.bg}`}>
                <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`} />
                {statusBadge.label}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span className="text-slate-900">{shipment.origin}</span>
              <span className="text-gold-600 font-black">→</span>
              <span className="text-navy-900">{shipment.destination}</span>
              <span className="text-slate-400 mx-1">•</span>
              <span className="text-xs text-slate-500 font-normal">Axe Routier RN1</span>
            </div>
          </div>

          {/* Synthèse financière du fret */}
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Total Fret</div>
              <div className="text-lg font-black text-navy-950 mt-0.5">
                {formatFCFA(shipment.total_cost)}
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Encaissé</div>
              <div className="text-lg font-black text-emerald-700 mt-0.5">
                {formatFCFA(shipment.paid_amount)}
              </div>
            </div>
            {remainingDebt > 0 && (
              <>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <button
                    onClick={() => {
                      setPaymentForm({ ...paymentForm, amount: remainingDebt });
                      setIsPaymentModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gold-500 hover:bg-gold-400 text-navy-950 transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <Plus size={13} />
                    <span>Encaisser {formatFCFA(remainingDebt)}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Grille Informations Expéditeur / Destinataire / Transporteur */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Expéditeur */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            <User size={15} className="text-navy-800" />
            <span>Expéditeur (Origine)</span>
          </div>
          <div className="font-bold text-slate-900 text-sm">{shipment.sender_name}</div>
          <div className="text-xs text-slate-600 mt-1 flex items-center gap-1">
            <Phone size={12} className="text-slate-400" />
            <span>{shipment.sender_phone}</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Ville de départ : <span className="font-semibold text-slate-800">{shipment.origin}</span>
          </div>
        </div>

        {/* Destinataire */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            <MapPin size={15} className="text-gold-600" />
            <span>Destinataire (Arrivée)</span>
          </div>
          <div className="font-bold text-slate-900 text-sm">{shipment.receiver_name}</div>
          <div className="text-xs text-slate-600 mt-1 flex items-center gap-1">
            <Phone size={12} className="text-slate-400" />
            <span>{shipment.receiver_phone}</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Adresse de livraison : <span className="font-semibold text-slate-800">{shipment.receiver_address || shipment.destination}</span>
          </div>
        </div>

        {/* Transporteur & Dates */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            <Truck size={15} className="text-emerald-600" />
            <span>Transporteur & Véhicule</span>
          </div>
          <div className="font-bold text-slate-900 text-sm">{shipment.carrier_name || 'Flotte Kenaya Logistic'}</div>
          <div className="text-xs text-slate-600 mt-1">
            Immatriculation : <span className="font-mono font-bold text-navy-950">{shipment.vehicle_plate || 'Non renseignée'}</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Départ : <span className="font-semibold text-slate-800">{formatDate(shipment.departure_date)}</span>
          </div>
        </div>
      </div>

      {/* Marchandises incluses dans le voyage */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-navy-950 mb-4 flex items-center gap-2">
          <Package size={18} className="text-gold-600" />
          <span>Marchandises Transportées ({shipment.cargo?.length || 0})</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400">
              <tr>
                <th className="px-4 py-2.5">Réf / Code-barres</th>
                <th className="px-4 py-2.5">Désignation</th>
                <th className="px-4 py-2.5">Catégorie</th>
                <th className="px-4 py-2.5">Quantité & Unité</th>
                <th className="px-4 py-2.5">Poids (kg)</th>
                <th className="px-4 py-2.5">Volume (m³)</th>
                <th className="px-4 py-2.5">Valeur Déclarée</th>
                <th className="px-4 py-2.5">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(shipment.cargo || []).map((ci) => {
                const badge = getCargoStatusBadge(ci.status);
                return (
                  <tr key={ci.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-navy-950">
                      {ci.barcode || `KN-CARGO-${ci.id}`}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 text-xs">
                      {ci.designation}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {ci.category}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold">
                      {ci.quantity} {ci.unit}
                    </td>
                    <td className="px-4 py-3 text-xs">{ci.weight_kg} kg</td>
                    <td className="px-4 py-3 text-xs">{ci.volume_cbm} m³</td>
                    <td className="px-4 py-3 text-xs font-bold text-navy-950">
                      {formatFCFA(ci.declared_value)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timeline des événements de suivi (Journal d'acheminement) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-navy-950 flex items-center gap-2">
              <Navigation size={18} className="text-navy-900" />
              <span>Journal d'Acheminement & Timeline</span>
            </h3>
            <p className="text-xs text-slate-400">Historique des étapes franchies sur l'axe RN1</p>
          </div>

          <button
            onClick={() => setIsStatusModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-navy-950 text-xs font-bold transition-colors"
          >
            <Plus size={14} />
            <span>Ajouter une étape</span>
          </button>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {(shipment.trackingEvents || []).map((event, idx) => {
            const badge = getShipmentStatusBadge(event.status);
            return (
              <div key={event.id || idx} className="relative flex items-start gap-4">
                <span
                  className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${badge.dot}`}
                />
                <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-navy-950 text-xs flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${badge.bg}`}>
                        {event.status}
                      </span>
                      <span>•</span>
                      <span>{event.location}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatDate(event.created_at, true)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {event.description}
                  </p>
                  {event.agent_name && (
                    <div className="text-[10px] text-slate-400 mt-1 italic">
                      Pointé par : {event.agent_name}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Changement de statut */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={`Mettre à jour le suivi • ${shipment.tracking_number}`}
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Nouveau Statut de l'expédition *
            </label>
            <select
              value={statusForm.status}
              onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
            >
              <option value="en attente">En attente (Entrepôt départ)</option>
              <option value="en transit">En transit sur la RN1</option>
              <option value="arrivée à destination">Arrivée à destination (Dépôt d'accueil)</option>
              <option value="livrée">Livrée au destinataire</option>
              <option value="annulée">Annulée</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Localisation actuelle du convoi *
            </label>
            <input
              type="text"
              required
              placeholder="ex: Poste péage Lifoula, Relais Dolisie, Entrepôt Pointe-Noire..."
              value={statusForm.location}
              onChange={(e) => setStatusForm({ ...statusForm, location: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Description de l'événement / Commentaire *
            </label>
            <textarea
              rows="3"
              required
              placeholder="ex: Contrôle technique validé, véhicule en route sans incident signalé."
              value={statusForm.description}
              onChange={(e) => setStatusForm({ ...statusForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
            />
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsStatusModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-navy-950 text-white font-bold text-xs hover:bg-navy-800 shadow-md transition-all"
            >
              Enregistrer l'étape
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Versement Paiement */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Encaisser un règlement • ${shipment.tracking_number}`}
      >
        <form onSubmit={handleCreatePayment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Montant à encaisser (en FCFA) *
            </label>
            <input
              type="number"
              step="1000"
              required
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-navy-950 focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Mode de paiement *
            </label>
            <select
              value={paymentForm.payment_method}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
            >
              <option value="Espèces">Espèces (Caisse)</option>
              <option value="Airtel Money">Airtel Money Congo</option>
              <option value="MTN Mobile Money">MTN Mobile Money Congo</option>
              <option value="Virement bancaire">Virement bancaire (BGFI, LCB, etc.)</option>
              <option value="Chèque">Chèque certifié</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Référence / N° de transaction
            </label>
            <input
              type="text"
              placeholder="ex: MoMo-CG-991204 ou N° Reçu caisse"
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Notes complémentaires
            </label>
            <textarea
              rows="2"
              placeholder="Reçu délivré, acompte de départ..."
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
            />
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
            >
              Valider le versement
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

