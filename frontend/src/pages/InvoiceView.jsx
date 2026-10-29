import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { formatFCFA, formatDate, getPaymentStatusBadge } from '../utils/formatters';
import {
  Printer,
  ArrowLeft,
  CheckCircle,
  Truck,
  Package,
  Calendar,
  AlertCircle,
  QrCode
} from 'lucide-react';

export default function InvoiceView() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInvoice() {
      try {
        setLoading(true);
        const res = await api.get(`/invoices/${id}`);
        if (res.success && res.data) {
          setInvoice(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadInvoice();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-gold-500 rounded-full animate-spin mb-3" />
        <div className="text-sm font-semibold text-navy-950">Génération du document certifié...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <AlertCircle size={36} className="mx-auto text-rose-500 mb-2" />
        <h3 className="text-base font-bold text-navy-950">Facture introuvable</h3>
        <Link to="/invoices" className="mt-3 inline-block text-xs font-bold text-navy-800 underline">
          Retour à la liste des factures
        </Link>
      </div>
    );
  }

  const paymentBadge = getPaymentStatusBadge(invoice.status);
  const remainingDebt = parseFloat(invoice.total_amount || 0) - parseFloat(invoice.paid_amount || 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Barre d'action non imprimable */}
      <div className="no-print flex items-center justify-between">
        <Link
          to="/invoices"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy-950 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Retour aux factures</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy-950 hover:bg-navy-800 text-white font-bold text-xs shadow-md transition-all"
          >
            <Printer size={15} className="text-gold-400" />
            <span>Imprimer la Facture / Reçu (A4)</span>
          </button>
        </div>
      </div>

      {/* Feuille de Facture Imprimable (Format A4) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-12 print-shadow-none text-slate-800">
        {/* En-tête Marque */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b-2 border-navy-900 pb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-navy-950 text-gold-400 font-black text-2xl flex items-center justify-center shadow-md">
                K
              </div>
              <div>
                <div className="text-2xl font-black text-navy-950 tracking-tight">
                  KENAYA <span className="text-gold-600">LOGISTIC</span>
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Fret & Acheminement Congo
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-500 space-y-0.5 leading-relaxed">
              <div className="font-semibold text-slate-800">KENAYA LOGISTIC SARL</div>
              <div>Siège Social : 45 Avenue de la Paix, Bacongo, Brazzaville</div>
              <div>Agence Portuaire : Zone Mpita / Port Autonome, Pointe-Noire</div>
              <div>RCCM : CG-BZV-01-2021-B12-00452 • NIU : M20210009845X</div>
              <div>Téléphones : +242 06 654 32 10 / +242 05 521 88 44</div>
              <div>Email : contact@kenayalogistic.cg • contact@kenaya.cg</div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="inline-block px-3 py-1 rounded-lg bg-navy-950 text-white text-xs font-black uppercase tracking-wider mb-2">
              FACTURE DE TRANSPORT
            </div>
            <div className="font-mono text-xl sm:text-2xl font-black text-navy-950">
              {invoice.invoice_number}
            </div>

            <div className="mt-3 text-xs space-y-1 text-slate-600">
              <div>
                <span className="text-slate-400 font-medium">Date d'émission :</span>{' '}
                <span className="font-bold text-slate-900">{formatDate(invoice.issue_date)}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Date d'échéance :</span>{' '}
                <span className="font-semibold">{formatDate(invoice.due_date)}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">N° Suivi Expédition :</span>{' '}
                <span className="font-mono font-bold text-navy-800">{invoice.tracking_number}</span>
              </div>
              <div className="pt-1">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase border ${paymentBadge.bg}`}>
                  {paymentBadge.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Coordonnées Client & Fret */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-slate-100">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
              Facturé à (Client Donneur d'Ordre) :
            </div>
            <div className="text-sm font-black text-navy-950">{invoice.client_name}</div>
            <div className="text-xs text-slate-600 mt-1 space-y-0.5">
              {invoice.client_address && <div>{invoice.client_address}</div>}
              <div>Ville : <span className="font-semibold text-slate-800">{invoice.client_city}</span></div>
              <div>Téléphone : <span className="font-semibold text-slate-800">{invoice.client_phone}</span></div>
              {invoice.client_email && <div>Email : {invoice.client_email}</div>}
              {invoice.client_id_number && (
                <div className="font-mono text-[11px] text-slate-500 pt-1">
                  Réf RCCM / CNI : {invoice.client_id_number}
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
              Détails du Trajet Routier (RN1) :
            </div>
            <div className="text-xs text-slate-700 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Axe d'acheminement :</span>
                <span className="font-bold text-navy-950">{invoice.origin} → {invoice.destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expéditeur :</span>
                <span className="font-medium text-slate-900">{invoice.sender_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Destinataire :</span>
                <span className="font-medium text-slate-900">{invoice.receiver_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Transporteur / Flotte :</span>
                <span className="font-medium text-slate-900">{invoice.carrier_name || 'Flotte Kenaya'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Véhicule / Plaque :</span>
                <span className="font-mono font-bold text-navy-900">{invoice.vehicle_plate || 'Kenaya Express'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau des prestations & frais de fret */}
        <div className="py-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-950 text-white uppercase text-[10px] font-black tracking-wider">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Désignation de la prestation</th>
                <th className="px-4 py-3 text-center">Quantité</th>
                <th className="px-4 py-3 text-right">Prix Unitaire</th>
                <th className="px-4 py-3 rounded-r-xl text-right">Total FCFA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="px-4 py-3.5">
                  <div className="font-bold text-slate-900 text-sm">
                    Frais d'acheminement de fret routier ({invoice.origin} → {invoice.destination})
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Transport sécurisé par voie routière RN1 avec bâche renforcée et scellés.
                  </div>
                </td>
                <td className="px-4 py-3.5 text-center font-bold">1 voyage</td>
                <td className="px-4 py-3.5 text-right font-mono">{formatFCFA(invoice.shipping_cost || invoice.subtotal)}</td>
                <td className="px-4 py-3.5 text-right font-mono font-bold text-navy-950">
                  {formatFCFA(invoice.shipping_cost || invoice.subtotal)}
                </td>
              </tr>

              {parseFloat(invoice.insurance_cost || 0) > 0 && (
                <tr>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-800">Assurance transport et garantie marchandise</div>
                    <div className="text-slate-400 text-[11px]">Couverture avarie et perte intégrale sur trajet RN1.</div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold">1 police</td>
                  <td className="px-4 py-3 text-right font-mono">{formatFCFA(invoice.insurance_cost)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-navy-950">
                    {formatFCFA(invoice.insurance_cost)}
                  </td>
                </tr>
              )}

              {parseFloat(invoice.other_fees || 0) > 0 && (
                <tr>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-800">Manutention, chargement et quaiage</div>
                    <div className="text-slate-400 text-[11px]">Équipe de manutentionnaires qualifiés au dépôt.</div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold">Forfait</td>
                  <td className="px-4 py-3 text-right font-mono">{formatFCFA(invoice.other_fees)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-navy-950">
                    {formatFCFA(invoice.other_fees)}
                  </td>
                </tr>
              )}

              {/* Ligne des marchandises détaillées */}
              {(invoice.cargo || []).map((ci, idx) => (
                <tr key={idx} className="bg-slate-50/50">
                  <td className="px-4 py-2 text-[11px]">
                    <span className="font-semibold text-slate-800">Colis {idx + 1} : {ci.designation}</span> ({ci.category})
                  </td>
                  <td className="px-4 py-2 text-center text-[11px]">
                    {ci.quantity} {ci.unit} ({ci.weight_kg} kg)
                  </td>
                  <td className="px-4 py-2 text-right text-[11px] text-slate-400">
                    Valeur : {formatFCFA(ci.declared_value)}
                  </td>
                  <td className="px-4 py-2 text-right text-[11px] text-slate-500 font-mono">
                    Inclus
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totaux & Règlements */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t-2 border-slate-200">
          {/* Modalités de paiement */}
          <div className="text-xs space-y-2 text-slate-600">
            <div className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
              Modalités de Paiement & Coordonnées Bancaires
            </div>
            <div>• <span className="font-semibold">BGFI Bank Congo :</span> Compte N° 30004 00120 10928374011 45</div>
            <div>• <span className="font-semibold">Airtel Money Congo :</span> Marchand N° 06 654 32 10 (KENAYA LOGISTIC)</div>
            <div>• <span className="font-semibold">MTN Mobile Money :</span> Code Marchand N° 05 521 88 44</div>
            <div>• <span className="font-semibold">Espèces :</span> Caisse centrale Brazzaville ou Pointe-Noire</div>
            <div className="pt-2 text-[11px] text-slate-400 italic">
              Règlement exigible selon les termes convenus sur la lettre de voiture.
            </div>
          </div>

          {/* Récapitulatif montants */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Sous-total Prestations :</span>
              <span className="font-mono font-bold text-slate-800">{formatFCFA(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">TVA (Exonération transport interurbain) :</span>
              <span className="font-mono text-slate-600">0 FCFA (0%)</span>
            </div>
            <div className="flex justify-between py-2 border-b-2 border-navy-950 text-sm">
              <span className="font-black text-navy-950 uppercase">TOTAL FACTURÉ :</span>
              <span className="font-mono font-black text-navy-950 text-base">{formatFCFA(invoice.total_amount)}</span>
            </div>
            <div className="flex justify-between py-1 text-emerald-700 font-bold">
              <span>Montant Déjà Encaissé :</span>
              <span className="font-mono">{formatFCFA(invoice.paid_amount)}</span>
            </div>
            <div className={`flex justify-between py-1.5 px-3 rounded-xl font-bold ${
              remainingDebt > 0 ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800'
            }`}>
              <span>SOLDE RESTANT DÛ :</span>
              <span className="font-mono text-sm">{formatFCFA(remainingDebt)}</span>
            </div>
          </div>
        </div>

        {/* Signatures & Cachet */}
        <div className="grid grid-cols-2 gap-8 pt-12 mt-6 border-t border-slate-100 text-center text-xs">
          <div>
            <div className="text-slate-400 font-semibold mb-12">Le Client / Réceptionnaire</div>
            <div className="text-[11px] text-slate-400">Date, Signature & Mention "Lu et Approuvé"</div>
          </div>

          <div>
            <div className="text-slate-400 font-semibold mb-2">Pour KENAYA LOGISTIC SARL</div>
            {/* Cachet et signature certifiée */}
            <div className="w-36 h-20 mx-auto rounded-xl border-2 border-dashed border-navy-900/30 flex flex-col items-center justify-center text-[10px] text-navy-900 font-bold bg-navy-50/50">
              <div className="text-gold-600 font-black tracking-widest uppercase">KENAYA LOGISTIC</div>
              <div className="text-[9px] text-slate-500">DIRECTION GÉNÉRALE</div>
              <div className="text-[8px] text-emerald-700 font-mono mt-0.5">VISA CONFORME RN1</div>
            </div>
            <div className="text-[11px] text-slate-400 mt-2">Cachet et Signature Autorisée</div>
          </div>
        </div>
      </div>
    </div>
  );
}

