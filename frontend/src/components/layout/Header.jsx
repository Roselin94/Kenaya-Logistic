import React from 'react';
import { Menu, Plus, Package, Calendar, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRoleDetails } from '../../utils/formatters';
import { Link, useNavigate } from 'react-router-dom';

export default function Header({ setMobileOpen, title = 'KENAYA LOGISTIC' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const roleInfo = getRoleDetails(user?.role);
  const today = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-5 py-2 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-1 rounded-md text-slate-600 hover:text-navy-950 hover:bg-slate-100 transition-colors"
        >
          <Menu size={18} />
        </button>

        <div>
          <h1 className="text-sm sm:text-base font-bold text-navy-950 tracking-tight leading-none">
            {title}
          </h1>
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-500 font-medium mt-0.5">
            <span className="flex items-center gap-1">
              <Calendar size={11} className="text-gold-600" />
              {today.charAt(0).toUpperCase() + today.slice(1)}
            </span>
            <span>•</span>
            <span className="text-navy-800 font-semibold">Axe Brazzaville ⇄ Pointe-Noire (RN1)</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Actions rapides selon rôle */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            to="/shipments/new"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-950 text-white hover:bg-navy-800 text-xs font-semibold shadow-sm transition-all duration-150 border border-navy-800"
          >
            <Plus size={14} className="text-gold-400" />
            <span>Nouvelle Expédition</span>
          </Link>
          <Link
            to="/cargo"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-navy-900 hover:bg-slate-200 text-xs font-semibold transition-colors"
          >
            <Package size={13} className="text-slate-600" />
            <span>Entrée Marchandise</span>
          </Link>
        </div>

        {/* Profil utilisateur & Rôle */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-navy-900 text-gold-400 font-bold flex items-center justify-center text-xs shadow-inner">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-navy-950 leading-tight">
              {user?.name}
            </div>
            <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold border ${roleInfo.badge}`}>
              {roleInfo.label}
            </span>
          </div>
        </div>

        {/* Bouton Déconnexion dans le Header à droite */}
        <button
          onClick={handleLogout}
          title="Se déconnecter de la plateforme"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-200 transition-all duration-150 shadow-xs ml-1"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  );
}
