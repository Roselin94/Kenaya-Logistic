import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import KPICard from '../components/common/KPICard';
import { formatFCFA, formatDate, getVehicleStatusBadge, getRentalStatusBadge, getDepositStatusBadge } from '../utils/formatters';
import {
  Car,
  KeyRound,
  CalendarCheck,
  Clock,
  AlertTriangle,
  Wrench,
  ShieldAlert,
  Plus,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
  FileCheck
} from 'lucide-react';

export default function RentalDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/rentals/dashboard');
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Impossible de charger le tableau de bord de location.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px]">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-gold-500 rounded-full animate-spin mb-2" />
        <span className="text-xs text-slate-500">Chargement du module de location...</span>
      </div>
    );
  }

  const { fleet = {}, rentals = {}, finances = {}, recentRentals = [], alertVehicles = [] } = data || {};

  return (
    <div className="space-y-4">
      {/* Barre d'actions rapides supérieure */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-navy-950 flex items-center gap-1.5">
            <Car size={16} className="text-gold-500" />
            Supervision de la Flotte Automobile & Locations
          </h2>
          <p className="text-[11px] text-slate-500">
            Gestion du parc, réservations, contrats, états des lieux et cautions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/rentals/vehicles"
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11.5px] font-medium transition-colors"
          >
            Parc Véhicules ({fleet.total || 0})
          </Link>
          <Link
            to="/rentals/list"
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11.5px] font-medium transition-colors"
          >
            Tous les Contrats
          </Link>
          <Link
            to="/rentals/new"
            className="px-3 py-1.5 rounded-lg bg-navy-950 hover:bg-navy-900 text-white text-[11.5px] font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus size={13} className="text-gold-400" />
            Nouvelle Location
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
          {error}
        </div>
      )}

      {/* Cartes d'indicateurs KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title="Véhicules Disponibles"
          value={`${fleet.available || 0} / ${fleet.total || 0}`}
          color="emerald"
          icon={Car}
        />
        <KPICard
          title="Locations en Cours"
          value={rentals.active || 0}
          color="blue"
          icon={KeyRound}
        />
        <KPICard
          title="Réservations Confirmées"
          value={rentals.confirmed || 0}
          color="gold"
          icon={CalendarCheck}
        />
        <KPICard
          title="Flotte en Maintenance"
          value={fleet.maintenance || 0}
          color="navy"
          icon={Wrench}
        />
      </div>

      {/* Statistiques financières synthétiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
              Recettes Location (Total)
            </div>
            <div className="text-base font-bold text-navy-950 mt-0.5">
              {formatFCFA(finances.revenue_fcfa)}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp size={16} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
              Cautions Déposées Actives
            </div>
            <div className="text-base font-bold text-amber-600 mt-0.5">
              {formatFCFA(finances.active_deposits_fcfa)}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldAlert size={16} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
              Frais d'Entretien Flotte
            </div>
            <div className="text-base font-bold text-slate-700 mt-0.5">
              {formatFCFA(finances.maintenance_cost_fcfa)}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <Wrench size={16} />
          </div>
        </div>
      </div>

      {/* Section principale : Contrats récents + Alertes administratives */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Liste des contrats récents */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 shadow-xs p-3.5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-navy-950 flex items-center gap-1.5">
              <CalendarCheck size={14} className="text-navy-900" />
              Contrats de Location & Réservations Récentes
            </h3>
            <Link to="/rentals/list" className="text-[11px] font-semibold text-gold-600 hover:text-gold-700 flex items-center gap-0.5">
              Voir tout <ArrowRight size={12} />
            </Link>
          </div>

          {recentRentals.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Aucun contrat de location enregistré pour le moment.
            </div>
          ) : (
            <div className="space-y-2">
              {recentRentals.map((r) => {
                const sBadge = getRentalStatusBadge(r.status);
                const dBadge = getDepositStatusBadge(r.deposit_status);
                return (
                  <div
                    key={r.id}
                    className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-300/80 bg-slate-50/40 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-navy-100 text-navy-800 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        {r.brand?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-navy-950">{r.rental_number}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold border bg-white text-slate-600">
                            {r.plate_number}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${sBadge.bg}`}>
                            {sBadge.label}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                          {r.brand} {r.model} • Client : <strong className="text-navy-900">{r.client_name}</strong>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Du {formatDate(r.start_datetime)} au {formatDate(r.end_datetime)}</span>
                          <span>•</span>
                          <span className="text-slate-500 font-medium">Total : {formatFCFA(r.total_amount)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                      <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-medium border ${dBadge.bg}`}>
                        {dBadge.label} ({formatFCFA(r.deposit_amount)})
                      </span>
                      <Link
                        to={`/rentals/${r.id}`}
                        className="text-[11px] text-navy-900 hover:text-gold-600 font-semibold flex items-center gap-0.5"
                      >
                        Détails & Contrat <ArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Colonne latérale : Alertes Visites & Assurances + Traceur GPS */}
        <div className="space-y-3">
          {/* Alertes administratives */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-3.5">
            <h3 className="text-xs font-bold text-navy-950 flex items-center gap-1.5 mb-2.5 pb-1.5 border-b border-slate-100">
              <AlertTriangle size={14} className="text-amber-500" />
              Échéances Documents Véhicules
            </h3>

            {alertVehicles.length === 0 ? (
              <div className="text-center py-4 text-emerald-600 text-[11px] font-medium flex items-center justify-center gap-1">
                <CheckCircle2 size={13} />
                Tous les documents et assurances sont à jour.
              </div>
            ) : (
              <div className="space-y-2">
                {alertVehicles.map((v) => (
                  <div key={v.id} className="p-2 rounded-lg bg-amber-50/60 border border-amber-100 text-[11px]">
                    <div className="flex items-center justify-between font-bold text-navy-950">
                      <span>{v.brand} {v.model}</span>
                      <span className="text-[10px] text-slate-500">{v.plate_number}</span>
                    </div>
                    {v.insurance_expiry && (
                      <div className="text-slate-600 text-[10px] mt-0.5">
                        Assurance expire le : <strong className="text-amber-800">{formatDate(v.insurance_expiry)}</strong>
                      </div>
                    )}
                    {v.technical_inspection_expiry && (
                      <div className="text-slate-600 text-[10px]">
                        Contrôle tech. expire le : <strong className="text-amber-800">{formatDate(v.technical_inspection_expiry)}</strong>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Connecteur Traceurs GPS */}
          <div className="bg-navy-950 text-white rounded-xl p-3.5 shadow-xs border border-navy-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-gold-400 flex items-center gap-1.5">
                <MapPin size={14} />
                Traceurs GPS Intégrés
              </h3>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase">
                Actif
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Positionnement en direct des véhicules loués sur l'axe Brazzaville ⇄ Pointe-Noire (RN1).
            </p>
            <div className="mt-2.5 pt-2 border-t border-navy-800 flex items-center justify-between text-[10.5px]">
              <span className="text-slate-400">Véhicules équipés :</span>
              <span className="font-bold text-gold-300">5 / 5 traceurs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

