import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { formatFCFA } from '../utils/formatters';
import {
  Car,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  DollarSign,
  Fuel,
  Info
} from 'lucide-react';

export default function RentalForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialVehicleId = searchParams.get('vehicle_id') || '';

  const [vehicles, setVehicles] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [error, setError] = useState('');

  // Valeurs par défaut : départ demain matin 08:00, retour dans 3 jours 18:00
  const getDefaultDates = () => {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(8, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 3);
    end.setHours(18, 0, 0, 0);

    const formatForInput = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    return {
      start_datetime: formatForInput(start),
      end_datetime: formatForInput(end)
    };
  };

  const dates = getDefaultDates();

  const [formData, setFormData] = useState({
    vehicle_id: initialVehicleId,
    client_id: '',
    start_datetime: dates.start_datetime,
    end_datetime: dates.end_datetime,
    rate_type: 'daily',
    driver_included: false,
    driver_fee: 10000, // Forfait chauffeur 10 000 FCFA / jour
    destination_usage: 'Brazzaville & Environs',
    discount: 0,
    initial_payment: 0,
    payment_method: 'Espèces',
    notes: ''
  });

  useEffect(() => {
    async function loadInitData() {
      try {
        setLoading(true);
        const [vehRes, cliRes] = await Promise.all([
          api.get('/rentals/vehicles'),
          api.get('/clients')
        ]);
        if (vehRes.success) setVehicles(vehRes.data || []);
        if (cliRes.success) setClients(cliRes.data || []);
      } catch (err) {
        setError('Impossible de charger les données de référence.');
      } finally {
        setLoading(false);
      }
    }
    loadInitData();
  }, []);

  // Véhicule actuellement sélectionné
  const selectedVehicle = vehicles.find((v) => String(v.id) === String(formData.vehicle_id));

  // Calcul dynamique de durée et coût
  const calculateCosts = () => {
    if (!selectedVehicle || !formData.start_datetime || !formData.end_datetime) {
      return { durationUnits: 0, subtotal: 0, totalAmount: 0, depositAmount: 0 };
    }

    const start = new Date(formData.start_datetime);
    const end = new Date(formData.end_datetime);
    const diffHours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)));
    const diffDays = Math.max(1, Math.ceil(diffHours / 24));

    let unitRate = parseFloat(selectedVehicle.rate_daily);
    let durationUnits = diffDays;

    if (formData.rate_type === 'hourly') {
      unitRate = parseFloat(selectedVehicle.rate_hourly);
      durationUnits = diffHours;
    } else if (formData.rate_type === 'weekly') {
      unitRate = parseFloat(selectedVehicle.rate_weekly);
      durationUnits = Math.max(1, Math.ceil(diffDays / 7));
    } else if (formData.rate_type === 'monthly') {
      unitRate = parseFloat(selectedVehicle.rate_monthly);
      durationUnits = Math.max(1, Math.ceil(diffDays / 30));
    }

    const subtotal = unitRate * durationUnits;
    const driverTotal = formData.driver_included ? parseFloat(formData.driver_fee || 0) * diffDays : 0;
    const totalAmount = Math.max(0, subtotal + driverTotal - parseFloat(formData.discount || 0));
    const depositAmount = parseFloat(selectedVehicle.deposit_amount || 150000);

    return {
      durationUnits,
      unitRate,
      subtotal,
      driverTotal,
      totalAmount,
      depositAmount
    };
  };

  const costs = calculateCosts();

  // Vérifier la disponibilité en direct
  const verifyAvailability = async () => {
    if (!formData.vehicle_id || !formData.start_datetime || !formData.end_datetime) return;
    try {
      setCheckingAvailability(true);
      const res = await api.get('/rentals/availability', {
        vehicle_id: formData.vehicle_id,
        start_datetime: formData.start_datetime,
        end_datetime: formData.end_datetime
      });
      setAvailabilityMessage(res);
    } catch (err) {
      setAvailabilityMessage({ available: false, message: err.message || 'Erreur vérification disponibilité.' });
    } finally {
      setCheckingAvailability(false);
    }
  };

  useEffect(() => {
    if (formData.vehicle_id && formData.start_datetime && formData.end_datetime) {
      verifyAvailability();
    }
  }, [formData.vehicle_id, formData.start_datetime, formData.end_datetime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (availabilityMessage && !availabilityMessage.available) {
      alert('Veuillez sélectionner un autre véhicule ou changer les dates : ce véhicule est déjà réservé.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/rentals/rentals', {
        ...formData,
        driver_fee: formData.driver_included ? costs.driverTotal : 0
      });
      if (res.success && res.rentalId) {
        navigate(`/rentals/${res.rentalId}`);
      }
    } catch (err) {
      alert(err.message || 'Erreur lors de la création de la location.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-gold-500 rounded-full animate-spin mb-2" />
        <span className="text-xs text-slate-500">Chargement du formulaire...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-3.5">
      {/* Bouton retour et en-tête */}
      <div className="flex items-center justify-between">
        <Link
          to="/rentals/list"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-navy-950 font-medium transition-colors"
        >
          <ArrowLeft size={14} />
          Retour à la liste des locations
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gold-600 bg-gold-50 px-2 py-0.5 rounded border border-gold-200">
          Module Location KENAYA
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Section 1 : Véhicule et Période */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-navy-950 flex items-center gap-1.5">
              <Car size={14} className="text-navy-900" />
              1. Choix du Véhicule & Période de Location
            </h3>
            {checkingAvailability && (
              <span className="text-[10px] text-slate-400 animate-pulse">Vérification calendrier...</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Véhicule de la flotte *</label>
              <select
                required
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                className="w-full font-medium"
              >
                <option value="">-- Sélectionner un véhicule --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.brand} {v.model} ({v.plate_number}) - {formatFCFA(v.rate_daily)}/j
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Date & Heure de Départ *</label>
              <input
                type="datetime-local"
                required
                value={formData.start_datetime}
                onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Date & Heure de Retour Prévu *</label>
              <input
                type="datetime-local"
                required
                value={formData.end_datetime}
                onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
                className="w-full"
              />
            </div>
          </div>

          {/* Résultat du contrôle de disponibilité anti double-réservation */}
          {availabilityMessage && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
                availabilityMessage.available
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {availabilityMessage.available ? (
                <CheckCircle size={15} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle size={15} className="text-rose-600 shrink-0" />
              )}
              <span className="font-medium text-[11px]">{availabilityMessage.message}</span>
            </div>
          )}

          {/* Type de tarification */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {['daily', 'hourly', 'weekly', 'monthly'].map((type) => (
              <label
                key={type}
                className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                  formData.rate_type === type
                    ? 'border-navy-950 bg-navy-50/50 text-navy-950 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="capitalize text-[11px]">
                  {type === 'daily' ? 'Journalier (24h)' : type === 'hourly' ? 'Horaire' : type === 'weekly' ? 'Hebdomadaire' : 'Mensuel'}
                </span>
                <input
                  type="radio"
                  name="rate_type"
                  value={type}
                  checked={formData.rate_type === type}
                  onChange={(e) => setFormData({ ...formData, rate_type: e.target.value })}
                  className="hidden"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Section 2 : Client & Conditions de conduite */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-navy-950 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <User size={14} className="text-navy-900" />
            2. Client & Conditions d'Utilisation
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Client Locataire *</label>
              <select
                required
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                className="w-full font-medium"
              >
                <option value="">-- Sélectionner un client enregistré --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) - {c.city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Destination & Zone d'usage prévue</label>
              <input
                type="text"
                placeholder="ex: Brazzaville & Environs, Axe RN1 vers Pointe-Noire, Dolisie"
                value={formData.destination_usage}
                onChange={(e) => setFormData({ ...formData, destination_usage: e.target.value })}
                className="w-full"
              />
            </div>
          </div>

          {/* Option Chauffeur */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.driver_included}
                onChange={(e) => setFormData({ ...formData, driver_included: e.target.checked })}
                className="rounded border-slate-300 text-gold-500 focus:ring-gold-500"
              />
              <div>
                <span className="text-xs font-bold text-navy-950">Mise à disposition d'un chauffeur professionnel KENAYA</span>
                <p className="text-[10px] text-slate-500">Chauffeur expérimenté connaissant l'axe RN1 Brazzaville ⇄ Pointe-Noire</p>
              </div>
            </label>

            {formData.driver_included && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 text-[10.5px]">Indemnité journalière :</span>
                <input
                  type="number"
                  value={formData.driver_fee}
                  onChange={(e) => setFormData({ ...formData, driver_fee: parseFloat(e.target.value) })}
                  className="w-24 text-right font-bold py-1"
                />
                <span className="text-slate-400 text-[10px]">FCFA/j</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 3 : Récapitulatif Financier, Caution et Acompte */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-navy-950 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <ShieldCheck size={14} className="text-navy-900" />
            3. Calcul Financier, Caution Obligatoire & Règlement
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-navy-950 text-white p-3.5 rounded-xl">
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase">Tarif de base calculé</div>
              <div className="text-sm font-bold text-white mt-0.5">
                {formatFCFA(costs.subtotal)}
              </div>
              <div className="text-[9.5px] text-slate-400 mt-0.5">
                {costs.durationUnits} {formData.rate_type === 'daily' ? 'jours' : formData.rate_type} × {formatFCFA(costs.unitRate)}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-semibold text-gold-400 uppercase">Caution de Garantie (Séquestre)</div>
              <div className="text-sm font-bold text-gold-400 mt-0.5">
                {formatFCFA(costs.depositAmount)}
              </div>
              <div className="text-[9.5px] text-slate-400 mt-0.5">
                Restituée à la fin après état des lieux
              </div>
            </div>

            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase">Total Facturation Contrat</div>
              <div className="text-base font-extrabold text-gold-300 mt-0.5">
                {formatFCFA(costs.totalAmount)}
              </div>
              {formData.driver_included && (
                <div className="text-[9.5px] text-slate-300 mt-0.5">
                  Dont {formatFCFA(costs.driverTotal)} pour chauffeur
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Remise commerciale (FCFA)</label>
              <input
                type="number"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                className="w-full text-right"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Acompte versé à la réservation (FCFA)</label>
              <input
                type="number"
                value={formData.initial_payment}
                onChange={(e) => setFormData({ ...formData, initial_payment: parseFloat(e.target.value) || 0 })}
                className="w-full text-right font-bold text-emerald-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Moyen d'encaissement</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full"
              >
                <option value="Espèces">Espèces</option>
                <option value="MTN Mobile Money">MTN Mobile Money</option>
                <option value="Airtel Money">Airtel Money</option>
                <option value="Virement bancaire">Virement BGFI / LCB</option>
                <option value="Chèque">Chèque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Notes et observations particulières</label>
            <textarea
              rows={2}
              placeholder="Instructions pour la livraison du véhicule, exigences particulières..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full"
            />
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Link
            to="/rentals/list"
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={submitting || (availabilityMessage && !availabilityMessage.available)}
            className="px-5 py-2 rounded-lg bg-navy-950 hover:bg-navy-900 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
          >
            {submitting ? 'Création du contrat en cours...' : 'Valider & Créer le Contrat de Location'}
          </button>
        </div>
      </form>
    </div>
  );
}

