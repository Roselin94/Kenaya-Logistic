import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CargoList from './pages/CargoList';
import ClientsList from './pages/ClientsList';
import ClientDetail from './pages/ClientDetail';
import ShipmentsList from './pages/ShipmentsList';
import ShipmentDetail from './pages/ShipmentDetail';
import ShipmentForm from './pages/ShipmentForm';
import TrackingManagement from './pages/TrackingManagement';
import TrackingPublic from './pages/TrackingPublic';
import Finances from './pages/Finances';
import InvoicesList from './pages/InvoicesList';
import InvoiceView from './pages/InvoiceView';
import Reports from './pages/Reports';
import UsersList from './pages/UsersList';

// Module Location de Voitures
import RentalDashboard from './pages/RentalDashboard';
import VehiclesList from './pages/VehiclesList';
import RentalsList from './pages/RentalsList';
import RentalForm from './pages/RentalForm';
import RentalDetail from './pages/RentalDetail';

// Composant Route Protégée
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 max-w-lg mx-auto mt-12">
        <h3 className="text-base font-bold text-rose-600 mb-2">Accès Restreint</h3>
        <p className="text-xs text-slate-500">
          Votre compte n'a pas les droits requis pour accéder à ce module.
        </p>
      </div>
    );
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Routes Publiques */}
          <Route path="/login" element={<Login />} />
          <Route path="/public-tracking" element={<TrackingPublic />} />

          {/* Routes Protégées avec Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            
            {/* Marchandises */}
            <Route path="cargo" element={<CargoList />} />

            {/* Clients */}
            <Route path="clients" element={<ClientsList />} />
            <Route path="clients/:id" element={<ClientDetail />} />

            {/* Expéditions */}
            <Route path="shipments" element={<ShipmentsList />} />
            <Route path="shipments/new" element={<ShipmentForm />} />
            <Route path="shipments/:id" element={<ShipmentDetail />} />

            {/* Module Location de Voitures */}
            <Route path="rentals/dashboard" element={<RentalDashboard />} />
            <Route path="rentals/vehicles" element={<VehiclesList />} />
            <Route path="rentals/list" element={<RentalsList />} />
            <Route path="rentals/new" element={<RentalForm />} />
            <Route path="rentals/:id" element={<RentalDetail />} />

            {/* Suivi */}
            <Route path="tracking" element={<TrackingManagement />} />

            {/* Finances */}
            <Route
              path="finances"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'accountant']}>
                  <Finances />
                </ProtectedRoute>
              }
            />

            {/* Factures & Reçus */}
            <Route path="invoices" element={<InvoicesList />} />
            <Route path="invoices/:id" element={<InvoiceView />} />

            {/* Rapports */}
            <Route
              path="reports"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'accountant']}>
                  <Reports />
                </ProtectedRoute>
              }
            />

            {/* Utilisateurs & Rôles (Admin uniquement) */}
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UsersList />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

