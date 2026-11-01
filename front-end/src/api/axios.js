import axios from 'axios';
import { toast } from 'react-toastify';

// ── Base instance ─────────────────────────────────────────────────────────────
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor — attach JWT ─────────────────────────────────────────
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle token expiry ───────────────────────────────
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Token expired — attempt silent refresh once
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
          { refreshToken }
        );

        const newAccess  = data.data.accessToken;
        const newRefresh = data.data.refreshToken;

        localStorage.setItem('accessToken',  newAccess);
        localStorage.setItem('refreshToken', newRefresh);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return API(originalRequest);

      } catch {
        // Refresh failed — force logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        toast.error('Your session has expired. Please log in again.');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    // Generic 401 (invalid token, account deleted, etc.)
    if (error.response?.status === 401 && !originalRequest._retry) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Server errors — show toast for 500+
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }

    return Promise.reject(error);
  }
);

// ── Typed API helpers ─────────────────────────────────────────────────────────

// Auth
export const authAPI = {
  register      : (data)  => API.post('/auth/register', data),
  login         : (data)  => API.post('/auth/login', data),
  refresh       : (token) => API.post('/auth/refresh', { refreshToken: token }),
  getMe         : ()      => API.get('/auth/me'),
  changePassword: (data)  => API.patch('/auth/change-password', data),
};

// Transactions
export const transactionsAPI = {
  getAll    : (params) => API.get('/transactions', { params }),
  getById   : (id)     => API.get(`/transactions/${id}`),
  getSummary: (params) => API.get('/transactions/summary', { params }),
  create    : (data)   => API.post('/transactions', data),
  update    : (id, data) => API.put(`/transactions/${id}`, data),
  delete    : (id)     => API.delete(`/transactions/${id}`),
};

// Categories
export const categoriesAPI = {
  getAll  : (params) => API.get('/categories', { params }),
  getById : (id)     => API.get(`/categories/${id}`),
  create  : (data)   => API.post('/categories', data),
  update  : (id, data) => API.put(`/categories/${id}`, data),
  delete  : (id)     => API.delete(`/categories/${id}`),
};

// Budgets
export const budgetsAPI = {
  getAll   : (params) => API.get('/budgets', { params }),
  getById  : (id)     => API.get(`/budgets/${id}`),
  getAlerts: ()       => API.get('/budgets/alerts'),
  create   : (data)   => API.post('/budgets', data),
  update   : (id, data) => API.put(`/budgets/${id}`, data),
  delete   : (id)     => API.delete(`/budgets/${id}`),
};

// Dashboard & Analytics
export const dashboardAPI = {
  getSummary        : ()       => API.get('/dashboard/summary'),
  getMonthlyAnalytics: (params) => API.get('/dashboard/analytics/monthly', { params }),
  getCategoryBreakdown: (params) => API.get('/dashboard/analytics/category', { params }),
  getDailySpending  : (params) => API.get('/dashboard/analytics/daily', { params }),
  getYearlyComparison: ()      => API.get('/dashboard/analytics/yearly'),
};

// Profile
export const profileAPI = {
  get          : ()     => API.get('/profile'),
  update       : (data) => API.put('/profile', data),
  getGoals     : ()     => API.get('/profile/goals'),
  deleteAccount: (data) => API.delete('/profile/account', { data }),
};

export default API;