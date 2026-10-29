/**
 * Utilitaires de formatage et de badges pour KENAYA LOGISTIC
 */

// Formatage monétaire en Francs CFA (XAF / FCFA)
export function formatFCFA(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0 FCFA';
  }
  const formatted = Math.round(Number(amount))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} FCFA`;
}

// Formatage de dates en français
export function formatDate(dateString, includeTime = false) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const options = {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    };

    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }

    return new Intl.DateTimeFormat('fr-FR', options).format(date);
  } catch {
    return dateString;
  }
}

// Badge de statut pour les expéditions
export function getShipmentStatusBadge(status) {
  switch (status?.toLowerCase()) {
    case 'en attente':
      return {
        label: 'En attente',
        bg: 'bg-amber-100 text-amber-800 border-amber-200',
        dot: 'bg-amber-500'
      };
    case 'en transit':
      return {
        label: 'En transit',
        bg: 'bg-blue-100 text-blue-800 border-blue-200',
        dot: 'bg-blue-600'
      };
    case 'arrivée à destination':
      return {
        label: 'Arrivée à destination',
        bg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        dot: 'bg-indigo-600'
      };
    case 'livrée':
      return {
        label: 'Livrée',
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-600'
      };
    case 'annulée':
      return {
        label: 'Annulée',
        bg: 'bg-rose-100 text-rose-800 border-rose-200',
        dot: 'bg-rose-600'
      };
    default:
      return {
        label: status || 'Inconnu',
        bg: 'bg-slate-100 text-slate-800 border-slate-200',
        dot: 'bg-slate-500'
      };
  }
}

// Badge de statut pour les marchandises
export function getCargoStatusBadge(status) {
  switch (status?.toLowerCase()) {
    case 'enregistrée':
      return { label: 'Enregistrée', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    case 'en attente d\'expédition':
      return { label: 'En attente départ', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
    case 'en transit':
      return { label: 'En transit', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
    case 'au dépôt':
      return { label: 'Au dépôt', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
    case 'livrée':
      return { label: 'Livrée', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    case 'endommagée':
      return { label: 'Endommagée', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
    default:
      return { label: status || 'Statut inconnu', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

// Badge de statut pour les paiements
export function getPaymentStatusBadge(status) {
  switch (status?.toLowerCase()) {
    case 'paid':
      return { label: 'Payé intégralement', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    case 'partial':
    case 'partially_paid':
      return { label: 'Acompte versé', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
    case 'pending':
    case 'unpaid':
      return { label: 'Impayé / En attente', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
    case 'cancelled':
      return { label: 'Annulé', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    default:
      return { label: status || 'Non défini', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

// Traduction et couleur de rôle utilisateur
export function getRoleDetails(role) {
  switch (role?.toLowerCase()) {
    case 'admin':
      return {
        label: 'Directeur / Administrateur',
        badge: 'bg-purple-100 text-purple-800 border-purple-200',
        description: 'Accès total à tous les modules et configurations'
      };
    case 'manager':
      return {
        label: 'Gestionnaire Logistique',
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
        description: 'Supervision des expéditions, cargaisons et flotte'
      };
    case 'accountant':
      return {
        label: 'Comptable & Finances',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        description: 'Gestion des paiements, dépenses, factures et créances'
      };
    case 'agent':
      return {
        label: 'Agent Logistique Quai',
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
        description: 'Enregistrement fret, pesée, suivi et livraisons'
      };
    case 'secretary':
      return {
        label: 'Secrétaire / Accueil',
        badge: 'bg-pink-100 text-pink-800 border-pink-200',
        description: 'Réservations, clients, contrats de location et états des lieux'
      };
    case 'tech_admin':
      return {
        label: 'Admin Technique / Parc',
        badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        description: 'Flotte automobile, GPS, entretiens et configurations techniques'
      };
    default:
      return {
        label: role || 'Agent',
        badge: 'bg-slate-100 text-slate-800 border-slate-200',
        description: 'Accès standard'
      };
  }
}

// Badge de statut pour les véhicules de location
export function getVehicleStatusBadge(status) {
  switch (status?.toLowerCase()) {
    case 'available':
      return { label: 'Disponible', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' };
    case 'reserved':
      return { label: 'Réservé', bg: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500' };
    case 'rented':
      return { label: 'En location', bg: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500' };
    case 'maintenance':
      return { label: 'En maintenance', bg: 'bg-purple-100 text-purple-800 border-purple-200', dot: 'bg-purple-500' };
    case 'immobilized':
      return { label: 'Immobilisé', bg: 'bg-rose-100 text-rose-800 border-rose-200', dot: 'bg-rose-500' };
    default:
      return { label: status || 'Inconnu', bg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' };
  }
}

// Badge de statut pour les dossiers de location
export function getRentalStatusBadge(status) {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return { label: 'Confirmée', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
    case 'active':
      return { label: 'En cours', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
    case 'completed':
      return { label: 'Clôturée', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    case 'cancelled':
      return { label: 'Annulée', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
    default:
      return { label: status || 'En attente', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

// Badge de caution
export function getDepositStatusBadge(status) {
  switch (status?.toLowerCase()) {
    case 'paid':
      return { label: 'Caution reçue', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    case 'refunded':
      return { label: 'Caution restituée', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
    case 'partially_refunded':
      return { label: 'Restitution partielle', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
    case 'retained':
      return { label: 'Caution retenue', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
    default:
      return { label: 'Non encaissée', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
  }
}

