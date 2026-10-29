import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('kenaya_auth_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [permissions, setPermissions] = useState(() => {
    try {
      const savedPerms = localStorage.getItem('kenaya_auth_permissions');
      return savedPerms ? JSON.parse(savedPerms) : {};
    } catch {
      return {};
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('kenaya_auth_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifySession() {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('kenaya_auth_user', JSON.stringify(res.user));
            if (res.permissions) {
              setPermissions(res.permissions);
              localStorage.setItem('kenaya_auth_permissions', JSON.stringify(res.permissions));
            }
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    }
    verifySession();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      const userPerms = res.permissions || {};
      setPermissions(userPerms);
      localStorage.setItem('kenaya_auth_token', res.token);
      localStorage.setItem('kenaya_auth_user', JSON.stringify(res.user));
      localStorage.setItem('kenaya_auth_permissions', JSON.stringify(userPerms));
    }
    return res;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setPermissions({});
    localStorage.removeItem('kenaya_auth_token');
    localStorage.removeItem('kenaya_auth_user');
    localStorage.removeItem('kenaya_auth_permissions');
  };

  const updateUserProfile = (updatedUser) => {
    setUser(prev => {
      const merged = { ...prev, ...updatedUser };
      localStorage.setItem('kenaya_auth_user', JSON.stringify(merged));
      return merged;
    });
  };

  // Rôles
  const hasRole = (allowedRoles = []) => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Directrice Générale a tous les privilèges
    return allowedRoles.map(r => r.toLowerCase()).includes(user.role?.toLowerCase());
  };

  /**
   * Vérifie une permission granulaire par module et action
   * @param {string} module - Nom du module (ex: 'shipments', 'finances', 'clients', 'rentals', 'users')
   * @param {string} action - 'view' | 'create' | 'edit' | 'delete' | 'validate' | 'export'
   */
  const can = (module, action = 'view') => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Directrice Générale accès total
    if (!permissions || !permissions[module]) return false;
    return !!permissions[module][action];
  };

  const value = {
    user,
    token,
    loading,
    permissions,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    updateUserProfile,
    hasRole,
    can,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager' || user?.role === 'admin',
    isAccountant: user?.role === 'accountant' || user?.role === 'admin',
    isSecretary: user?.role === 'secretary',
    isAgent: user?.role === 'agent' || user?.role === 'secretary' || user?.role === 'admin',
    isTechAdmin: user?.role === 'tech_admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
}
