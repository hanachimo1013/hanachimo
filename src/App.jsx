import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './components/pages/Dashboard';
import Employees from './components/employee/Employees';
import Settings from './components/pages/Settings';
import Reports from './components/pages/Reports';
import NotFound from './components/pages/NotFound';
import Login from './components/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicOnlyRoute from './components/auth/PublicOnlyRoute';
import HanachimoProfile from './components/pages/HanachimoProfile';
import MangaList from './components/pages/MangaList';
import MangaReader from './components/pages/MangaReader';

/* ──────────────────────────────────────────────
   Subdomain detection
   ────────────────────────────────────────────── */
function getSubdomain() {
  const hostname = window.location.hostname; // e.g. "doujin.batodeluna-lu.online"
  // Local dev: treat as "bldlag" (BDLAG app) by default
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'bldlag';

  const parts = hostname.split('.');
  // hostname like "doujin.batodeluna-lu.online" → parts = ["doujin", "batodeluna-lu", "online"]
  // hostname like "bldlag.batodeluna-lu.online" → parts = ["bldlag", "batodeluna-lu", "online"]
  // hostname like "batodeluna-lu.online"        → parts = ["batodeluna-lu", "online"]
  // hostname like "www.batodeluna-lu.online"    → parts = ["www", "batodeluna-lu", "online"]
  if (parts.length >= 3) {
    const sub = parts[0].toLowerCase();
    if (sub === 'www') return 'www';
    return sub; // "doujin", "bldlag", etc.
  }
  return 'www'; // bare domain, treat as www
}

const routeTitles = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employees',
  '/settings': 'Settings',
  '/reports': 'Reports',
  '/login': 'Login',
};

function TitleUpdater() {
  const location = useLocation();

  useEffect(() => {
    const sub = getSubdomain();
    if (sub === 'doujin') {
      document.title = 'Doujin | Batodeluna';
    } else {
      const title = routeTitles[location.pathname] || 'Page';
      document.title = `BDLAG | ${title}`;
    }
  }, [location.pathname]);

  return null;
}

/* ──────────────────────────────────────────────
   Route sets per subdomain
   ────────────────────────────────────────────── */
function DoujinRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MangaList />} />
      <Route path="/:slug" element={<MangaReader />} />
      <Route path="/:slug/:pageNum" element={<MangaReader />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function BdlagRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <Layout>
              <Employees />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'viewer']}>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'viewer']}>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/report"
        element={<Navigate to="/reports" replace />}
      />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route path="/hanachimo" element={<HanachimoProfile />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function WwwRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HanachimoProfile />} />
      <Route path="/hanachimo" element={<HanachimoProfile />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  const subdomain = getSubdomain();

  return (
    <Router>
      <TitleUpdater />
      {subdomain === 'doujin' && <DoujinRoutes />}
      {subdomain === 'bldlag' && <BdlagRoutes />}
      {subdomain === 'www' && <WwwRoutes />}
      {!['doujin', 'bldlag', 'www'].includes(subdomain) && <BdlagRoutes />}
    </Router>
  );
}
