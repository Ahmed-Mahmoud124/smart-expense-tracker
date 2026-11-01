import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/axios';
import { toast } from 'react-toastify';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,            setUser]            = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading,         setLoading]         = useState(true);

  // ── Bootstrap: restore session from localStorage ──────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      const token       = localStorage.getItem('accessToken');
      const storedUser  = localStorage.getItem('user');

      if (!token || !storedUser) {
        setLoading(false);
        return;
      }

      try {
        // Verify token is still valid with a lightweight /me call
        const { data } = await authAPI.getMe();
        setUser(data.data.user);
        setIsAuthenticated(true);
      } catch {
        // Token invalid or expired — clear storage silently
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    const { data } = await authAPI.register(formData);
    const { user: newUser, accessToken, refreshToken } = data.data;

    localStorage.setItem('accessToken',  accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user',         JSON.stringify(newUser));

    setUser(newUser);
    setIsAuthenticated(true);
    toast.success(`Welcome, ${newUser.name}! Your account has been created.`);

    return data;
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    const { data } = await authAPI.login(credentials);
    const { user: loggedInUser, accessToken, refreshToken } = data.data;

    localStorage.setItem('accessToken',  accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user',         JSON.stringify(loggedInUser));

    setUser(loggedInUser);
    setIsAuthenticated(true);
    toast.success(`Welcome back, ${loggedInUser.name}!`);

    return data;
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    setUser(null);
    setIsAuthenticated(false);
    toast.info('You have been logged out.');
  }, []);

  // ── Update user in context (after profile edit) ───────────────────────────
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    register,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};