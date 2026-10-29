import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Alert from '../components/common/Alert';
import { formatFCFA } from '../utils/formatters';
import { Truck, ArrowLeft, Plus, Package, Calendar, User, DollarSign, Check } from 'lucide-react';

export default function ShipmentForm() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [unassignedCargo, setUnassignedCargo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    client_id: '',
    origin: 'Brazzaville',
    destination: 'Pointe-Noire',
    sender_name: '',
    sender_phone: '',
    receiver_name: '',
    receiver_phone: '',
    receiver_address: '',
    carrier_name: 'Flotte Kenaya - Camion Renault Kerax',
    carrier_phone: '+242 06 654 32 10',
    vehicle_plate: '1452-BZ-5',
    departure_date: new Date().toISOString().split('T')[0],
    estimated_arrival: '',
    shipping_cost: 450000,
    insurance_cost: 25000,
    other_fees: 10000,
    notes: '',
    cargo_ids: []
  });

  useEffect(() => {
    async function init() {
      try {
        const [clientsRes, cargoRes] = await Promise.all([
          api.get('/clients'),
          api.get('/cargo', { status: 'enregistrée' })
        ]);

        if (clientsRes.success) {
          setClients(clientsRes.data);
          if (clientsRes.data.length > 0) {
            const firstClient = clientsRes.data[0];
            setFormData(prev => ({
              ...prev,
              client_id: firstClient.id,
              sender_name: firstClient.name,
              sender_phone: firstClient.phone
            }));
          }
        }

        if (cargoRes.success) {
          setUnassignedCargo(cargoRes.data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    init();
  }, []);

  // Mise à jour de l'expéditeur lors du choix client
  const handleClientChange = (clientId) => {
    const selected = clients.find(c => c.id === parseInt(clientId, 10));
    setFormData(prev => ({
      ...prev,
      client_id: clientId,
      sender_name: selected ? selected.name : prev.sender_name,
      sender_phone: selected ? selected.phone : prev.sender_phone
    }));
  };

  const toggleCargoSelection = (id) => {
    setFormData(prev => {
      const exists = prev.cargo_ids.includes(id);
      return {
        ...prev,
        cargo_ids: exists ? prev.cargo_ids.filter(cId => cId !== id) : [...prev.cargo_ids, id]
      };
    });
  };

  const totalCost =
    parseFloat(formData.shipping_cost || 0) +
    parseFloat(formData.insurance_cost || 0) +
    parseFloat(formData.other_fees || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification(null);
    setLoading(true);

    try {
      const res = await api.post('/shipments', formData);
      if (res.success && res.data) {
        navigate(`/shipments/${res.data.id}`);
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Retour */}
      <div>
        <Link
          to="/shipments"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy-950 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Retour à la liste des expéditions</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="border-b border-slate-100 pb-5 mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight">
            Créer une Nouvelle Expédition (RN1)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Génération automatique du numéro de suivi KN-XXXX, lettre de transport et facturation.
          </p>
        </div>

        {notification && (
          <div className="mb-6">
            <Alert type={notification.type} message={notification.message} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1 : Trajet & Client */}
          <div>
            <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-navy-900 text-gold-400 font-bold flex items-center justify-center text-xs">1</span>
              <span>Client & Trajet</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Client Donneur d'Ordre *
                </label>
                <select
                  required
                  value={formData.client_id}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
                >
                  <option value="">-- Choisir un client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.city}) - {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Localité de départ (Origine) *
                </label>
                <select
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
                >
                  <option value="Brazzaville">Brazzaville (Hub Principal)</option>
                  <option value="Pointe-Noire">Pointe-Noire (Zone Portuaire)</option>
                  <option value="Dolisie">Dolisie</option>
                  <option value="Nkayi">Nkayi</option>
                  <option value="Oyo">Oyo</option>
                  <option value="Ouesso">Ouesso</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Localité de destination *
                </label>
                <select
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-navy-950 focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
                >
                  <option value="Pointe-Noire">Pointe-Noire (Terminus RN1)</option>
                  <option value="Brazzaville">Brazzaville</option>
                  <option value="Dolisie">Dolisie</option>
                  <option value="Nkayi">Nkayi</option>
                  <option value="Oyo">Oyo</option>
                  <option value="Ouesso">Ouesso</option>
                  <option value="Impfondo">Impfondo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Date de départ prévue *
                </label>
                <input
                  type="date"
                  required
                  value={formData.departure_date}
                  onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
                />
              </div>
            </div>
          </div>

          {/* Section 2 : Expéditeur & Destinataire */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-navy-900 text-gold-400 font-bold flex items-center justify-center text-xs">2</span>
              <span>Expéditeur & Destinataire</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nom Expéditeur *
                </label>
                <input
                  type="text"
                  required
                  value={formData.sender_name}
                  onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Téléphone Expéditeur *
                </label>
                <input
                  type="text"
                  required
                  value={formData.sender_phone}
                  onChange={(e) => setFormData({ ...formData, sender_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nom Destinataire *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: M. Tchicaya"
                  value={formData.receiver_name}
                  onChange={(e) => setFormData({ ...formData, receiver_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Téléphone Destinataire *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: +242 05 540 10 20"
                  value={formData.receiver_phone}
                  onChange={(e) => setFormData({ ...formData, receiver_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Adresse de livraison (Quartier, Avenue, Repère)
                </label>
                <input
                  type="text"
                  placeholder="ex: Hangar B4, Zone Portuaire Autonome, Pointe-Noire"
                  value={formData.receiver_address}
                  onChange={(e) => setFormData({ ...formData, receiver_address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
                />
              </div>
            </div>
          </div>

          {/* Section 3 : Transporteur & Flotte */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-navy-900 text-gold-400 font-bold flex items-center justify-center text-xs">3</span>
              <span>Transporteur & Convoi Routier</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nom Transporteur / Chauffeur
                </label>
                <input
                  type="text"
                  value={formData.carrier_name}
                  onChange={(e) => setFormData({ ...formData, carrier_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Téléphone Chauffeur
                </label>
                <input
                  type="text"
                  value={formData.carrier_phone}
                  onChange={(e) => setFormData({ ...formData, carrier_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Immatriculation Véhicule
                </label>
                <input
                  type="text"
                  placeholder="ex: 1452-BZ-5"
                  value={formData.vehicle_plate}
                  onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
                />
              </div>
            </div>
          </div>

          {/* Section 4 : Marchandises à charger */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-navy-900 text-gold-400 font-bold flex items-center justify-center text-xs">4</span>
                <span>Marchandises au quai disponibles ({unassignedCargo.length})</span>
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {formData.cargo_ids.length} marchandise(s) sélectionnée(s)
              </span>
            </div>

            {unassignedCargo.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                Aucune marchandise en attente au quai. Vous pourrez en associer ultérieurement depuis le module Marchandises.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1">
                {unassignedCargo.map(ci => {
                  const isSelected = formData.cargo_ids.includes(ci.id);
                  return (
                    <div
                      key={ci.id}
                      onClick={() => toggleCargoSelection(ci.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-gold-50 border-gold-400 text-navy-950 shadow-sm'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{ci.designation}</div>
                        <div className="text-[11px] text-slate-500">
                          {ci.quantity} {ci.unit} • {ci.weight_kg} kg • {formatFCFA(ci.declared_value)}
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                        isSelected ? 'bg-gold-500 border-gold-600 text-navy-950' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check size={14} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 5 : Tarification en FCFA */}
          <div className="pt-4 border-t border-slate-100 bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-gold-600" />
              <span>Tarification & Frais d'Acheminement (FCFA)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Frais de Fret Route *
                </label>
                <input
                  type="number"
                  step="1000"
                  required
                  value={formData.shipping_cost}
                  onChange={(e) => setFormData({ ...formData, shipping_cost: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Assurance Marchandise
                </label>
                <input
                  type="number"
                  step="1000"
                  value={formData.insurance_cost}
                  onChange={(e) => setFormData({ ...formData, insurance_cost: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Autres Frais (Manutention, etc.)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={formData.other_fees}
                  onChange={(e) => setFormData({ ...formData, other_fees: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
              <span className="text-xs font-bold text-slate-700 uppercase">
                Montant Total Facturé au Client :
              </span>
              <span className="text-xl font-black text-navy-950 font-mono">
                {formatFCFA(totalCost)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              to="/shipments"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-navy-950 font-bold text-sm shadow-lg shadow-gold-500/25 transition-all flex items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Truck size={17} />
                  <span>Enregistrer l'expédition & Générer le suivi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

