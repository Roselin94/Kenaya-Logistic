import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { formatFCFA, formatDate, getShipmentStatusBadge } from '../utils/formatters';
import {
  Navigation,
  Search,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  Package,
  Printer,
  Phone,
  Shield,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

export default function TrackingPublic() {
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || 'KN-2026-0101';
  const [trackingNumber, setTrackingNumber] = useState(initialCode);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTracking = async (code) => {
    if (!code || !code.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.get(`/tracking/public/${code.trim()}`);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Numéro de suivi introuvable. Veuillez vérifier votre référence.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      fetchTracking(initialCode);
    }
  }, [initialCode]);

  // Détermination de l'étape sur la barre de progression (1 à 4)
  const getStepProgress = (status) => {
    switch (status?.toLowerCase()) {
      case 'en attente':
        return 1;
      case 'en transit':
        return 2;
      case 'arrivée à destination':
        return 3;
      case 'livrée':
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = data ? getStepProgress(data.shipment.status) : 1;
  const statusBadge = data ? getShipmentStatusBadge(data.shipment.status) : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      {/* Barre de navigation publique */}
      <header className="bg-navy-950 text-white border-b border-navy-800 py-4 px-4 sm:px-8 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gold-600 to-gold-400 text-navy-950 font-black text-xl flex items-center justify-center shadow-lg shadow-gold-500/20">
              K
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                KENAYA <span className="text-gold-400 font-extrabold">LOGISTIC</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                Portail Public de Suivi Fret Congo
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-3.5 py-1.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-slate-300 hover:text-white text-xs font-semibold border border-navy-700 transition-colors"
            >
              Espace Collaborateurs
            </Link>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 sm:py-12 space-y-8">
        {/* Titre et boîte de recherche */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-100 text-gold-800 text-xs font-bold border border-gold-200">
            <Navigation size={13} className="text-gold-600" />
            Traçabilité Routière RN1 en Direct
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-navy-950 tracking-tight">
            Suivez l'Acheminement de Votre Colis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Saisissez le numéro de suivi délivré sur votre bordereau de dépôt KENAYA LOGISTIC.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchTracking(trackingNumber);
            }}
            className="max-w-xl mx-auto mt-6 flex flex-col sm:flex-row items-center gap-2 bg-white p-2 rounded-2xl border border-slate-300 shadow-lg shadow-navy-950/5"
          >
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                required
                placeholder="Exemple : KN-2026-0101"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                className="w-full pl-10 pr-4 py-3 bg-transparent font-mono text-sm uppercase tracking-wider focus:outline-none text-navy-950 placeholder:text-slate-400 font-bold"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-navy-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Localiser</span>
                  <Navigation size={14} />
                </>
              )}
            </button>
          </form>

          {/* Exemples de tests */}
          <div className="text-xs text-slate-400 flex items-center justify-center gap-2 pt-1">
            <span>Numéros de démonstration :</span>
            <button
              onClick={() => {
                setTrackingNumber('KN-2026-0101');
                fetchTracking('KN-2026-0101');
              }}
              className="font-mono font-bold text-navy-800 hover:text-gold-600 underline"
            >
              KN-2026-0101
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setTrackingNumber('KN-2026-0102');
                fetchTracking('KN-2026-0102');
              }}
              className="font-mono font-bold text-navy-800 hover:text-gold-600 underline"
            >
              KN-2026-0102
            </button>
          </div>
        </div>

        {error && (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center text-sm font-semibold max-w-xl mx-auto">
            <AlertCircle size={24} className="mx-auto text-rose-600 mb-2" />
            <div>{error}</div>
          </div>
        )}

        {/* Détails du colis */}
        {data && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8">
            {/* Barre d'état et référence */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Numéro de Suivi Certifié
                </span>
                <div className="font-mono text-2xl sm:text-3xl font-black text-navy-950 mt-0.5">
                  {data.shipment.tracking_number}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusBadge?.bg}`}>
                  <span className={`w-2 h-2 rounded-full ${statusBadge?.dot}`} />
                  {statusBadge?.label}
                </span>

                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title="Imprimer le justificatif"
                >
                  <Printer size={16} />
                </button>
              </div>
            </div>

            {/* Stepper visuel 4 étapes */}
            <div className="py-2">
              <div className="grid grid-cols-4 gap-2 relative">
                {/* Ligne de connexion */}
                <div className="absolute top-4 left-6 right-6 h-1 bg-slate-200 -z-0" />
                <div
                  className="absolute top-4 left-6 h-1 bg-gold-500 transition-all duration-500 -z-0"
                  style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                />

                {/* Étape 1 */}
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep >= 1 ? 'bg-navy-950 text-gold-400 shadow-md ring-4 ring-gold-100' : 'bg-slate-200 text-slate-500'
                  }`}>
                    1
                  </div>
                  <span className="text-[11px] font-bold text-slate-900 mt-2">Prise en charge</span>
                  <span className="text-[10px] text-slate-400">{data.shipment.origin}</span>
                </div>

                {/* Étape 2 */}
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep >= 2 ? 'bg-navy-950 text-gold-400 shadow-md ring-4 ring-gold-100' : 'bg-slate-200 text-slate-500'
                  }`}>
                    2
                  </div>
                  <span className="text-[11px] font-bold text-slate-900 mt-2">En transit</span>
                  <span className="text-[10px] text-slate-400">Route RN1</span>
                </div>

                {/* Étape 3 */}
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep >= 3 ? 'bg-navy-950 text-gold-400 shadow-md ring-4 ring-gold-100' : 'bg-slate-200 text-slate-500'
                  }`}>
                    3
                  </div>
                  <span className="text-[11px] font-bold text-slate-900 mt-2">Au centre de tri</span>
                  <span className="text-[10px] text-slate-400">{data.shipment.destination}</span>
                </div>

                {/* Étape 4 */}
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep >= 4 ? 'bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100' : 'bg-slate-200 text-slate-500'
                  }`}>
                    ✓
                  </div>
                  <span className="text-[11px] font-bold text-slate-900 mt-2">Livré</span>
                  <span className="text-[10px] text-slate-400">Destinataire</span>
                </div>
              </div>
            </div>

            {/* Informations Route & Acteurs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Expéditeur :</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{data.shipment.sender_name}</div>
                <div className="text-slate-500 mt-0.5">Lieu de départ : {data.shipment.origin}</div>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Destinataire :</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{data.shipment.receiver_name}</div>
                <div className="text-slate-500 mt-0.5">Destination finale : {data.shipment.destination}</div>
              </div>
            </div>

            {/* Marchandises */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Package size={15} className="text-gold-600" />
                <span>Colis & Marchandises Enregistrés</span>
              </h3>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                {(data.cargo || []).map((ci, i) => (
                  <div key={i} className="p-3 bg-white flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{ci.designation}</div>
                      <div className="text-slate-400">{ci.category}</div>
                    </div>
                    <div className="text-right font-semibold text-slate-700">
                      {ci.quantity} {ci.unit} ({ci.weight_kg} kg)
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chronologie des événements */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                <Clock size={15} className="text-navy-900" />
                <span>Historique du Parcours</span>
              </h3>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {(data.events || []).map((ev, i) => (
                  <div key={i} className="relative">
                    <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-navy-950 border-2 border-white shadow-sm" />
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{ev.location}</span>
                        <span className="text-[11px] font-mono font-normal text-slate-400">
                          {formatDate(ev.created_at, true)}
                        </span>
                      </div>
                      <div className="text-slate-600 mt-1">{ev.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Pied de page public */}
      <footer className="bg-navy-950 text-slate-400 border-t border-navy-800 py-6 px-4 text-center text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            © {new Date().getFullYear()} KENAYA LOGISTIC. Tous droits réservés. République du Congo.
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <span>Brazzaville : +242 06 654 32 10</span>
            <span>•</span>
            <span>Pointe-Noire : +242 05 521 88 44</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

