import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/common/Modal';
import { formatFCFA, formatDate, getRentalStatusBadge, getDepositStatusBadge } from '../utils/formatters';
import {
  KeyRound,
  Car,
  User,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Printer,
  ArrowLeft,
  FileText,
  AlertTriangle,
  ClipboardCheck,
  RotateCcw,
  Ban,
  DollarSign
} from 'lucide-react';

export default function RentalDetail() {
  const { id } = useParams();
  const [rental, setRental] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals d'actions opérationnelles
  const [startModal, setStartModal] = useState(false);
  const [completeModal, setCompleteModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Formulaire départ
  const [startForm, setStartForm] = useState({
    mileage: 0,
    fuel_level: 'Full',
    cleanliness: 'clean',
    existing_damages: 'Aucun dommage.',
    deposit_received: true
  });

  // Formulaire retour
  const [completeForm, setCompleteForm] = useState({
    mileage: 0,
    fuel_level: 'Full',
    cleanliness: 'clean',
    new_damages: 'Aucun dommage.',
    damage_fee: 0,
    late_fee: 0,
    fuel_charge: 0,
    refund_deposit: true
  });

  // Formulaire annulation
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadRental();
  }, [id]);

  const loadRental = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/rentals/rentals/${id}`);
      if (res.success && res.data) {
        setRental(res.data);
        setStartForm((prev) => ({
          ...prev,
          mileage: res.data.vehicle_mileage || 0
        }));
        setCompleteForm((prev) => ({
          ...prev,
          mileage: (res.data.vehicle_mileage || 0) + 150
        }));
      }
    } catch (err) {
      setError(err.message || 'Impossible de charger le dossier de location.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRental = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.post(`/rentals/rentals/${id}/start`, startForm);
      setStartModal(false);
      loadRental();
    } catch (err) {
      alert(err.message || 'Erreur lors du départ du véhicule.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteRental = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.post(`/rentals/rentals/${id}/complete`, completeForm);
      setCompleteModal(false);
      loadRental();
    } catch (err) {
      alert(err.message || 'Erreur lors de la clôture de la location.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRental = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.post(`/rentals/rentals/${id}/cancel`, { cancellation_reason: cancelReason });
      setCancelModal(false);
      loadRental();
    } catch (err) {
      alert(err.message || 'Erreur lors de l\'annulation.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-gold-500 rounded-full animate-spin mb-2" />
        <span className="text-xs text-slate-500">Chargement du contrat de location...</span>
      </div>
    );
  }

  if (error || !rental) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
        {error || 'Contrat introuvable.'}
      </div>
    );
  }

  const sBadge = getRentalStatusBadge(rental.status);
  const dBadge = getDepositStatusBadge(rental.deposit_status);

  return (
    <div className="max-w-4xl mx-auto space-y-3.5">
      {/* Barre supérieure no-print */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2">
          <Link
            to="/rentals/list"
            className="p-1 rounded hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-navy-950">{rental.rental_number}</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${sBadge.bg}`}>
                {sBadge.label}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Contrat officiel de mise à disposition de véhicule
            </p>
          </div>
        </div>

        {/* Boutons d'actions selon le cycle de vie */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => window.print()}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer size={13} />
            <span>Imprimer Contrat A4</span>
          </button>

          {rental.status === 'confirmed' && (
            <button
              onClick={() => setStartModal(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-colors"
            >
              <ClipboardCheck size={13} />
              <span>Remise Clés (Départ)</span>
            </button>
          )}

          {rental.status === 'active' && (
            <button
              onClick={() => setCompleteModal(true)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-colors"
            >
              <RotateCcw size={13} />
              <span>Restitution (Retour)</span>
            </button>
          )}

          {rental.status !== 'completed' && rental.status !== 'cancelled' && (
            <button
              onClick={() => setCancelModal(true)}
              className="px-2 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 text-[11px] font-medium transition-colors"
            >
              <Ban size={13} />
            </button>
          )}
        </div>
      </div>

      {/* DOCUMENT CONTRAT A4 IMPRIMABLE (KENAYA LOGISTIC) */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200/90 shadow-sm print-shadow-none text-slate-800 text-[11px] leading-relaxed">
        {/* En-tête officiel de l'entreprise */}
        <div className="flex items-start justify-between border-b-2 border-navy-950 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-gold-600 to-gold-400 flex items-center justify-center text-navy-950 font-black text-2xl shadow-md">
              K
            </div>
            <div>
              <div className="text-base font-extrabold text-navy-950 tracking-tight">
                KENAYA <span className="text-gold-600">LOGISTIC</span> SARL
              </div>
              <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                Transport, Fret & Location de Véhicules
              </div>
              <div className="text-[9.5px] text-slate-400 mt-0.5">
                Brazzaville : Avenue de la Paix, Bacongo • Pointe-Noire : Mpita Centre
              </div>
              <div className="text-[9.5px] text-slate-400">
                RCCM : CG-BZV-01-2023-B14-00129 • Tél : +242 06 654 32 10 / 05 521 88 44
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-bold text-navy-950 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded">
              CONTRAT DE LOCATION N° {rental.rental_number}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Date d'émission : {formatDate(rental.created_at)}
            </div>
            <div className="text-[10px] text-slate-500">
              Statut : <strong className="text-navy-950 uppercase">{rental.status}</strong>
            </div>
          </div>
        </div>

        {/* Bloc Parties Contractantes : Véhicule & Locataire */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-navy-950 mb-1.5 flex items-center gap-1">
              <Car size={12} className="text-gold-600" />
              1. Véhicule Loué
            </div>
            <div className="font-bold text-navy-950 text-xs">
              {rental.brand} {rental.model}
            </div>
            <div className="space-y-0.5 text-slate-600 mt-1">
              <div>Immatriculation : <strong className="text-navy-900">{rental.plate_number}</strong></div>
              <div>Catégorie : {rental.category} ({rental.transmission}, {rental.fuel_type})</div>
              <div>Kilométrage initial : {rental.vehicle_mileage || 0} km</div>
              <div>Assurance : AGC Congo (Tous risques)</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-navy-950 mb-1.5 flex items-center gap-1">
              <User size={12} className="text-gold-600" />
              2. Locataire (Client)
            </div>
            <div className="font-bold text-navy-950 text-xs">
              {rental.client_name}
            </div>
            <div className="space-y-0.5 text-slate-600 mt-1">
              <div>Téléphone : {rental.client_phone}</div>
              <div>Email : {rental.client_email || 'Non renseigné'}</div>
              <div>Adresse : {rental.client_address || 'Brazzaville, Rép. du Congo'}</div>
              <div>Pièce d'identité / RCCM : {rental.client_id_number || 'Vérifié à l\'agence'}</div>
            </div>
          </div>
        </div>

        {/* Période et Modalités de trajet */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-navy-950 mb-1.5 flex items-center gap-1">
            <Calendar size={12} className="text-gold-600" />
            3. Période & Conditions de Mise à Disposition
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-700">
            <div>
              <span className="text-slate-400 block text-[9.5px]">Prise en charge :</span>
              <strong className="text-navy-950">{formatDate(rental.start_datetime, true)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[9.5px]">Restitution prévue :</span>
              <strong className="text-navy-950">{formatDate(rental.end_datetime, true)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[9.5px]">Zone d'utilisation :</span>
              <strong className="text-navy-950">{rental.destination_usage}</strong>
            </div>
          </div>
        </div>

        {/* Tableau Financier : Coûts, Cautions et Règlements */}
        <div className="mb-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-navy-950 mb-1">
            4. Décompte Financier & Caution de Garantie
          </div>
          <table className="w-full border border-slate-200 text-left">
            <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600">
              <tr>
                <th className="p-2 border-b border-slate-200">Désignation</th>
                <th className="p-2 border-b border-slate-200 text-center">Quantité</th>
                <th className="p-2 border-b border-slate-200 text-right">Tarif Unitaire</th>
                <th className="p-2 border-b border-slate-200 text-right">Montant (FCFA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-2">
                  Location {rental.brand} {rental.model} ({rental.rate_type === 'daily' ? 'Journalier' : rental.rate_type})
                </td>
                <td className="p-2 text-center">{rental.duration_units}</td>
                <td className="p-2 text-right">{formatFCFA(rental.unit_rate)}</td>
                <td className="p-2 text-right font-semibold">{formatFCFA(rental.subtotal)}</td>
              </tr>
              {rental.driver_included === 1 && (
                <tr>
                  <td className="p-2">Prestation Chauffeur Professionnel KENAYA</td>
                  <td className="p-2 text-center">{rental.duration_units} j</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right font-semibold">{formatFCFA(rental.driver_fee)}</td>
                </tr>
              )}
              {parseFloat(rental.discount) > 0 && (
                <tr className="text-emerald-700">
                  <td className="p-2">Remise Commerciale Exceptionnelle</td>
                  <td className="p-2 text-center">1</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right font-semibold">- {formatFCFA(rental.discount)}</td>
                </tr>
              )}
              {parseFloat(rental.late_fee) > 0 && (
                <tr className="text-rose-700">
                  <td className="p-2">Pénalités de retard restitution</td>
                  <td className="p-2 text-center">1</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right font-semibold">+ {formatFCFA(rental.late_fee)}</td>
                </tr>
              )}
              {parseFloat(rental.damage_fee) > 0 && (
                <tr className="text-rose-700">
                  <td className="p-2">Frais de remise en état (Dommages constatés)</td>
                  <td className="p-2 text-center">1</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right font-semibold">+ {formatFCFA(rental.damage_fee)}</td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
              <tr>
                <td colSpan={3} className="p-2 text-right uppercase">Total Contrat TTC :</td>
                <td className="p-2 text-right text-navy-950 font-black">{formatFCFA(rental.total_amount)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="p-2 text-right text-slate-600">Montant Déjà Encaissé :</td>
                <td className="p-2 text-right text-emerald-700">{formatFCFA(rental.paid_amount)}</td>
              </tr>
              <tr className="bg-amber-50/80 text-amber-900">
                <td colSpan={3} className="p-2 text-right uppercase">Caution Séquestre (Restituable) :</td>
                <td className="p-2 text-right font-black">{formatFCFA(rental.deposit_amount)} ({dBadge.label})</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Historique des états des lieux */}
        {rental.inspections && rental.inspections.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-navy-950 mb-1">
              5. États des Lieux Enregistrés
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {rental.inspections.map((insp) => (
                <div key={insp.id} className="p-2.5 rounded border border-slate-200 bg-slate-50/50 text-[10.5px]">
                  <div className="font-bold text-navy-950 capitalize flex items-center justify-between">
                    <span>État des lieux de {insp.type === 'departure' ? 'Départ' : 'Retour'}</span>
                    <span className="text-[9.5px] text-slate-500">{formatDate(insp.inspection_date, true)}</span>
                  </div>
                  <div className="text-slate-600 mt-1 space-y-0.5">
                    <div>Kilométrage relevé : <strong>{Number(insp.mileage).toLocaleString('fr-FR')} km</strong></div>
                    <div>Niveau carburant : <strong>{insp.fuel_level}</strong> • Propreté : <strong>{insp.cleanliness}</strong></div>
                    {insp.existing_damages && <div>Observations départ : {insp.existing_damages}</div>}
                    {insp.new_damages && <div className="text-rose-600">Constat retour : {insp.new_damages}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clauses et Signatures */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="text-[9.5px] text-slate-500 leading-tight mb-4">
            Le locataire reconnaît avoir pris possession du véhicule ci-dessus en parfait état de fonctionnement, 
            avec sa carte grise, attestation d'assurance, cric et roue de secours. Il s'engage à respecter le code de la route,
            à ne pas sous-louer le véhicule et à restituer le véhicule avec le même niveau de carburant.
          </div>

          <div className="grid grid-cols-2 gap-8 text-center pt-2">
            <div>
              <div className="text-[10px] font-bold uppercase text-navy-950">Pour KENAYA LOGISTIC SARL</div>
              <div className="text-[9px] text-slate-400">Signature & Cachet de l'Agence</div>
              <div className="h-16 flex items-center justify-center text-slate-300 font-serif italic text-xs">
                KENAYA LOGISTIC AG
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase text-navy-950">Le Locataire (Client)</div>
              <div className="text-[9px] text-slate-400">Mention manuscrite « Lu et approuvé »</div>
              <div className="h-16 flex items-center justify-center text-slate-300 font-serif italic text-xs">
                {rental.client_name}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Départ (Remise des Clés) */}
      <Modal
        isOpen={startModal}
        onClose={() => setStartModal(false)}
        title="État des lieux de départ & Remise des clés"
        size="md"
      >
        <form onSubmit={handleStartRental} className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kilométrage compteur (km) *</label>
              <input
                type="number"
                required
                value={startForm.mileage}
                onChange={(e) => setStartForm({ ...startForm, mileage: parseInt(e.target.value, 10) })}
                className="w-full font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Jauge Carburant</label>
              <select
                value={startForm.fuel_level}
                onChange={(e) => setStartForm({ ...startForm, fuel_level: e.target.value })}
                className="w-full"
              >
                <option value="Full">Plein (Full)</option>
                <option value="3/4">3/4</option>
                <option value="1/2">1/2</option>
                <option value="1/4">1/4</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Propreté du véhicule</label>
            <select
              value={startForm.cleanliness}
              onChange={(e) => setStartForm({ ...startForm, cleanliness: e.target.value })}
              className="w-full"
            >
              <option value="clean">Propre / Lavé</option>
              <option value="acceptable">Acceptable</option>
              <option value="dirty">Sale</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Dommages ou rayures préexistants</label>
            <textarea
              rows={2}
              value={startForm.existing_damages}
              onChange={(e) => setStartForm({ ...startForm, existing_damages: e.target.value })}
              className="w-full"
            />
          </div>

          <label className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-900 cursor-pointer">
            <input
              type="checkbox"
              checked={startForm.deposit_received}
              onChange={(e) => setStartForm({ ...startForm, deposit_received: e.target.checked })}
              className="rounded text-gold-500"
            />
            <span>Caution de {formatFCFA(rental.deposit_amount)} bien encaissée et séquestrée</span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStartModal(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
            >
              {actionLoading ? 'Validation...' : 'Valider la Remise du Véhicule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Clôture & Restitution */}
      <Modal
        isOpen={completeModal}
        onClose={() => setCompleteModal(false)}
        title="État des lieux de retour & Restitution caution"
        size="md"
      >
        <form onSubmit={handleCompleteRental} className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kilométrage de retour (km) *</label>
              <input
                type="number"
                required
                value={completeForm.mileage}
                onChange={(e) => setCompleteForm({ ...completeForm, mileage: parseInt(e.target.value, 10) })}
                className="w-full font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Niveau carburant retour</label>
              <select
                value={completeForm.fuel_level}
                onChange={(e) => setCompleteForm({ ...completeForm, fuel_level: e.target.value })}
                className="w-full"
              >
                <option value="Full">Plein (Full)</option>
                <option value="3/4">3/4</option>
                <option value="1/2">1/2</option>
                <option value="1/4">1/4</option>
                <option value="Empty">Vide</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Frais de dommage (FCFA)</label>
              <input
                type="number"
                value={completeForm.damage_fee}
                onChange={(e) => setCompleteForm({ ...completeForm, damage_fee: parseFloat(e.target.value) || 0 })}
                className="w-full text-rose-600 font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Pénalités retard (FCFA)</label>
              <input
                type="number"
                value={completeForm.late_fee}
                onChange={(e) => setCompleteForm({ ...completeForm, late_fee: parseFloat(e.target.value) || 0 })}
                className="w-full text-rose-600 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Constat de dommages éventuels</label>
            <textarea
              rows={2}
              value={completeForm.new_damages}
              onChange={(e) => setCompleteForm({ ...completeForm, new_damages: e.target.value })}
              className="w-full"
            />
          </div>

          <label className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-900 cursor-pointer">
            <input
              type="checkbox"
              checked={completeForm.refund_deposit}
              onChange={(e) => setCompleteForm({ ...completeForm, refund_deposit: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>Restituer la caution au client (après déduction d'éventuels frais)</span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCompleteModal(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold"
            >
              {actionLoading ? 'Clôture en cours...' : 'Valider le Retour du Véhicule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Annulation */}
      <Modal
        isOpen={cancelModal}
        onClose={() => setCancelModal(false)}
        title="Annuler le contrat de location"
        size="sm"
      >
        <form onSubmit={handleCancelRental} className="space-y-3">
          <p className="text-xs text-slate-600">
            Êtes-vous sûr de vouloir annuler cette réservation ? Le véhicule sera immédiatement libéré pour d'autres clients.
          </p>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Motif d'annulation *</label>
            <textarea
              required
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="ex: Désistement client, empêchement..."
              className="w-full"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCancelModal(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600"
            >
              Fermer
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold"
            >
              Confirmer l'annulation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

