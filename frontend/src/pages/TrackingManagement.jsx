import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Alert from '../components/common/Alert';
import { formatFCFA, formatDate, getShipmentStatusBadge } from '../utils/formatters';
import {
  Navigation,
  Search,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Send,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TrackingManagement() {
  const [trackingNumber, setTrackingNumber] = useState('KN-2026-0102');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);

  // Formulaire d'ajout d'événement de suivi
  const [newEvent, setNewEvent] = useState({
    status: 'en transit',
    location: '',
    description: ''
  });

  const handleSearch = async (codeToSearch) => {
    const code = codeToSearch || trackingNumber;
    if (!code.trim()) return;

    setLoading(true);
    setError('');
    setNotification(null);

    try {
      const res = await api.get(`/tracking/public/${code.trim()}`);
      if (res.success && res.data) {
        setData(res.data);
        setNewEvent(prev => ({
          ...prev,
          status: res.data.shipment.status || 'en transit',
          location: res.data.shipment.destination || 'Axe RN1'
        }));
      }
    } catch (err) {
      setError(err.message || 'Numéro de suivi introuvable.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch('KN-2026-0102');
  }, []);

  const handleAddCheckpoint = async (status, location, description) => {
    if (!data?.shipment?.id) return;
    try {
      await api.post('/tracking/events', {
        shipment_id: data.shipment.id,
        status,
        location,
        description
      });
      setNotification({ type: 'success', message: `Pointage enregistré : "${location}" - ${status}.` });
      handleSearch(data.shipment.tracking_number);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!data?.shipment?.id) return;
    try {
      await api.post('/tracking/events', {
        shipment_id: data.shipment.id,
        status: newEvent.status,
        location: newEvent.location,
        description: newEvent.description
      });
      setNotification({ type: 'success', message: 'Nouvelle étape ajoutée avec succès au journal.' });
      setNewEvent({ ...newEvent, description: '' });
      handleSearch(data.shipment.tracking_number);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const statusBadge = data ? getShipmentStatusBadge(data.shipment.status) : null;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight">
            Pointage & Suivi en Direct (Axe RN1)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Mise à jour en temps réel des étapes de transport entre Brazzaville et Pointe-Noire.
          </p>
        </div>

        <Link
          to="/public-tracking"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
        >
          <span>Ouvrir le portail client public</span>
          <ExternalLink size={13} />
        </Link>
      </div>

      {notification && (
        <Alert
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Barre de recherche par numéro de suivi */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Saisissez un numéro de suivi (ex: KN-2026-0101, KN-2026-0102)..."
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm uppercase tracking-wider focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-navy-950 hover:bg-navy-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Navigation size={15} className="text-gold-400" />
                <span>Rechercher le convoi</span>
              </>
            )}
          </button>
        </form>

        {/* Suggestions rapides */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-400">Voyages récents :</span>
          {['KN-2026-0101', 'KN-2026-0102', 'KN-2026-0103', 'KN-2026-0104'].map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                setTrackingNumber(code);
                handleSearch(code);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-gold-50 hover:text-navy-950 font-mono text-[11px] font-bold text-slate-700 transition-colors"
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Résultat de la recherche */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche : Synthèse & Formulaire d'étape */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xl font-black text-navy-950">
                  {data.shipment.tracking_number}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadge?.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusBadge?.dot}`} />
                  {statusBadge?.label}
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Trajet :</span>
                  <span className="font-bold text-slate-900">{data.shipment.origin} → {data.shipment.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Expéditeur :</span>
                  <span className="font-medium text-slate-800">{data.shipment.sender_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Destinataire :</span>
                  <span className="font-medium text-slate-800">{data.shipment.receiver_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Véhicule :</span>
                  <span className="font-mono font-bold text-navy-900">{data.shipment.vehicle_plate || 'Non renseigné'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Marchandises :</span>
                  <span className="font-semibold text-slate-900">{data.shipment.cargo_count || 0} colis ({data.shipment.total_weight || 0} kg)</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <Link
                  to={`/shipments/${data.shipment.id}`}
                  className="w-full block text-center py-2 rounded-xl bg-slate-100 hover:bg-navy-950 hover:text-white text-xs font-bold transition-colors"
                >
                  Accéder au dossier complet
                </Link>
              </div>
            </div>

            {/* Pointages Rapides Pré-configurés RN1 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Pointages Rapides Axe RN1
              </h3>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleAddCheckpoint('en transit', 'Péage Lifoula (PK 45)', 'Passage du péage de Lifoula, circulation fluide vers le sud.')}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-700">1. Péage Lifoula (Sortie BZV)</span>
                  <Plus size={14} className="text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleAddCheckpoint('en transit', 'Relais Routier Dolisie', 'Contrôle technique et pause d\'équipage à Dolisie.')}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-700">2. Relais Routier Dolisie</span>
                  <Plus size={14} className="text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleAddCheckpoint('arrivée à destination', 'Hub Pointe-Noire (Mpita)', 'Convoi arrivé au centre de déchargement de Pointe-Noire.')}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-700">3. Arrivée Hub Pointe-Noire</span>
                  <Plus size={14} className="text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleAddCheckpoint('livrée', 'Adresse Client (Pointe-Noire)', 'Marchandises réceptionnées et contrôlées par le destinataire.')}
                  className="w-full text-left p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100/50 transition-colors flex items-center justify-between text-xs text-emerald-900"
                >
                  <span className="font-bold">4. Livraison Terminée & Signée</span>
                  <CheckCircle size={14} className="text-emerald-600" />
                </button>
              </div>
            </div>

            {/* Formulaire manuel d'étape */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Enregistrer un Pointage Personnalisé
              </h3>
              <form onSubmit={handleFormSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Statut du Voyage
                  </label>
                  <select
                    value={newEvent.status}
                    onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="en attente">En attente</option>
                    <option value="en transit">En transit</option>
                    <option value="arrivée à destination">Arrivée à destination</option>
                    <option value="livrée">Livrée</option>
                    <option value="annulée">Annulée</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Lieu / Point de passage
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Péage Yié, Entrepôt Mindouli..."
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Description du statut
                  </label>
                  <textarea
                    rows="2"
                    required
                    placeholder="ex: Traversée du col de Bamba sans incident."
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-navy-950 hover:bg-navy-800 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <Send size={13} />
                  <span>Publier l'étape de suivi</span>
                </button>
              </form>
            </div>
          </div>

          {/* Colonne droite : Chronologie détaillée (Timeline) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-navy-950 mb-1 flex items-center gap-2">
              <Clock size={17} className="text-gold-600" />
              <span>Chronologie Complète de l'Acheminement</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Traçabilité horodatée consultable par l'équipe logistique et les clients.
            </p>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {(data.events || []).map((event, idx) => {
                const b = getShipmentStatusBadge(event.status);
                return (
                  <div key={event.id || idx} className="relative flex items-start gap-4">
                    <span
                      className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${b.dot}`}
                    />
                    <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-navy-950 text-xs flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${b.bg}`}>
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
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

