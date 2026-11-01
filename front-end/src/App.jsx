import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import LoadingSpinner from './components/common/LoadingSpinner';

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
const Login        = lazy(() => import('./pages/Login'));
const Register     = lazy(() => import('./pages/Register'));
const Dashboard    = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Budgets      = lazy(() => import('./pages/Budgets'));
const Analytics    = lazy(() => import('./pages/Analytics'));
const Profile      = lazy(() => import('./pages/Profile'));

// ── Layout wrapper with sidebar ───────────────────────────────────────────────
const Layout = lazy(() => import('./components/common/Layout'));

// ── Route guards ──────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

// ── App shell ─────────────────────────────────────────────────────────────────
const AppRoutes = () => (
  <Suspense fallback={<LoadingSpinner fullScreen />}>
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Protected — all wrapped inside the shared Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index                  element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"       element={<Dashboard />} />
        <Route path="transactions"    element={<Transactions />} />
        <Route path="budgets"         element={<Budgets />} />
        <Route path="analytics"       element={<Analytics />} />
        <Route path="profile"         element={<Profile />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </Suspense>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;