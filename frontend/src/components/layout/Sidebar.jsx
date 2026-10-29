import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRoleDetails } from '../../utils/formatters';
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  Navigation,
  Wallet,
  FileText,
  BarChart3,
  ShieldCheck,
  Search,
  ChevronRight,
  X,
  Car,
  KeyRound
} from 'lucide-react';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { user, can, isAdmin } = useAuth();
  const roleInfo = getRoleDetails(user?.role);

  // Éléments de navigation pilotés par les permissions granulaires
  const navItems = [
    {
      to: '/',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      module: 'dashboard'
    },
    {
      to: '/cargo',
      label: 'Marchandises',
      icon: Package,
      module: 'cargo'
    },
    {
      to: '/clients',
      label: 'Clients & Historique',
      icon: Users,
      module: 'clients'
    },
    {
      to: '/shipments',
      label: 'Expéditions',
      icon: Truck,
      module: 'shipments'
    },
    {
      to: '/rentals/dashboard',
      label: 'Location Voitures',
      icon: Car,
      module: 'rentals'
    },
    {
      to: '/rentals/vehicles',
      label: 'Parc Automobile',
      icon: KeyRound,
      module: 'vehicles'
    },
    {
      to: '/tracking',
      label: 'Suivi des colis',
      icon: Navigation,
      module: 'tracking'
    },
    {
      to: '/finances',
      label: 'Finances (FCFA)',
      icon: Wallet,
      module: 'finances'
    },
    {
      to: '/invoices',
      label: 'Factures & Reçus',
      icon: FileText,
      module: 'invoices'
    },
    {
      to: '/reports',
      label: 'Rapports & Stats',
      icon: BarChart3,
      module: 'reports'
    },
    {
      to: '/users',
      label: 'Utilisateurs & Sécurité',
      icon: ShieldCheck,
      module: 'users',
      adminOnly: true
    }
  ];

  return (
    <>
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-56 bg-navy-950 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-navy-800/70 shadow-xl`}
      >
        {/* En-tête Marque */}
        <div className="p-3.5 border-b border-navy-800/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-gold-600 to-gold-400 flex items-center justify-center text-navy-950 font-black text-xs shadow-sm shadow-gold-500/20">
              K
            </div>
            <div>
              <div className="text-[13px] font-bold tracking-tight text-white flex items-center gap-1 leading-none">
                KENAYA <span className="text-gold-400 font-extrabold">LOGISTIC</span>
              </div>
              <div className="text-[9px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">
                Brazza ⇄ Pointe-Noire
              </div>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md"
          >
            <X size={16} />
          </button>
        </div>

        {/* Bouton Suivi Public Rapide */}
        <div className="px-2.5 pt-2.5">
          <NavLink
            to="/public-tracking"
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-navy-900/90 border border-gold-500/30 text-gold-400 hover:bg-gold-500 hover:text-navy-950 transition-all text-[11px] font-medium group"
          >
            <span className="flex items-center gap-1.5">
              <Search size={12} className="text-gold-400 group-hover:text-navy-950 transition-colors" />
              Suivi public sans compte
            </span>
            <ChevronRight size={12} />
          </NavLink>
        </div>

        {/* Liens de navigation avec vérification des permissions réelles */}
        <nav className="flex-1 px-2.5 py-2 space-y-0.5 overflow-y-auto">
          <div className="px-2 pb-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </div>

          {navItems.map((item) => {
            // Seule la Directrice Générale accède à la gestion des utilisateurs
            if (item.adminOnly && !isAdmin) {
              return null;
            }
            // Contrôle par permission de consultation (can view)
            if (!isAdmin && !can(item.module, 'view')) {
              return null;
            }

            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-all duration-150 group ${
                    isActive
                      ? 'bg-gradient-to-r from-navy-800 to-navy-900 text-white font-semibold border-l-2 border-gold-400'
                      : 'text-slate-300 hover:bg-navy-900 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={15}
                      className={`transition-colors shrink-0 ${
                        isActive ? 'text-gold-400' : 'text-slate-400 group-hover:text-white'
                      }`}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Profil connecté épuré */}
        <div className="p-3 border-t border-navy-800 bg-navy-900/60">
          <div className="flex items-center gap-2.5 px-1.5 py-0.5">
            <div className="w-8 h-8 rounded-full bg-navy-800 border border-gold-500/40 flex items-center justify-center text-gold-400 font-bold text-xs shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {user?.name || 'Utilisateur'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {roleInfo.label}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
