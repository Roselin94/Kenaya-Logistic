/**
 * Client API universel pour KENAYA LOGISTIC
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('kenaya_auth_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  let data;
  try {
    data = await response.json();
  } catch {
    data = { success: false, message: 'Réponse serveur non reconnue.' };
  }

  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      // Déconnexion si le jeton est expiré
      localStorage.removeItem('kenaya_auth_token');
      localStorage.removeItem('kenaya_auth_user');
      window.location.href = '/login?expired=1';
    }
    throw new Error(data.message || 'Une erreur est survenue lors de la communication avec le serveur.');
  }

  return data;
}

export const api = {
  get: (url, params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString();
    return request(queryString ? `${url}?${queryString}` : url, { method: 'GET' });
  },

  post: (url, body) => request(url, { method: 'POST', body }),
  put: (url, body) => request(url, { method: 'PUT', body }),
  patch: (url, body) => request(url, { method: 'PATCH', body }),
  delete: (url) => request(url, { method: 'DELETE' })
};

export default api;

