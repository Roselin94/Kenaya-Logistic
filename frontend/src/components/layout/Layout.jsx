import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Détermination du titre selon la route
  const getPageTitle = (pathname) => {
    if (pathname === '/') return 'Tableau de bord logistique';
    if (pathname.startsWith('/cargo')) return 'Gestion des marchandises & fret';
    if (pathname.startsWith('/clients')) return 'Répertoire clients & historique';
    if (pathname.startsWith('/shipments/new')) return 'Création d\'une expédition';
    if (pathname.startsWith('/shipments')) return 'Gestion des expéditions & transport';
    if (pathname.startsWith('/rentals/dashboard')) return 'Tableau de bord Location de Voitures';
    if (pathname.startsWith('/rentals/vehicles')) return 'Parc Automobile & Flotte de Véhicules';
    if (pathname.startsWith('/rentals/new')) return 'Création d\'un Contrat de Location';
    if (pathname.startsWith('/rentals/list')) return 'Contrats de Location & Réservations';
    if (pathname.startsWith('/rentals')) return 'Dossier Contrat de Location Automobile';
    if (pathname.startsWith('/tracking')) return 'Suivi en direct & journal d\'acheminement';
    if (pathname.startsWith('/finances')) return 'Gestion financière & trésorerie (FCFA)';
    if (pathname.startsWith('/invoices')) return 'Factures & reçus de transport';
    if (pathname.startsWith('/reports')) return 'Rapports d\'activité & statistiques';
    if (pathname.startsWith('/users')) return 'Administration des utilisateurs & rôles';
    return 'KENAYA LOGISTIC';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Barre latérale */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-56">
        <Header setMobileOpen={setMobileOpen} title={getPageTitle(location.pathname)} />
        <main className="flex-1 p-3 sm:p-4 lg:p-5 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

