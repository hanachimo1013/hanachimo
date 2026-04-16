import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SpeedInsights } from "@vercel/speed-insights/react"
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
function isLocalDevHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function isLocalBdlagPath(pathname) {
  return pathname === '/bdlag' || pathname.startsWith('/bdlag/');
}

function getSubdomain() {
  const hostname = window.location.hostname; // e.g. "doujin.batodeluna-lu.online"
  const pathname = window.location.pathname;

  // Local dev only: allow path-based switching for testing.
  if (isLocalDevHost(hostname)) {
    if (pathname === '/doujin' || pathname.startsWith('/doujin/')) return 'doujin';
    if (isLocalBdlagPath(pathname)) return 'bldlag';
    return 'www';
  }

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
    } else if (sub === 'www') {
      document.title = 'Hanachimo';
    } else {
      const normalizedPath = isLocalDevHost(window.location.hostname) && isLocalBdlagPath(location.pathname)
        ? location.pathname.replace(/^\/bdlag/, '') || '/'
        : location.pathname;
      const title = routeTitles[normalizedPath] || 'Page';
      document.title = `BDLAG | ${title}`;
    }
  }, [location.pathname]);

  return null;
}

/* ──────────────────────────────────────────────
   Route sets per subdomain
   ────────────────────────────────────────────── */
function DoujinRoutes() {
  const isLocalTesting = isLocalDevHost(window.location.hostname);

  return (
    <Routes>
      {isLocalTesting ? (
        <>
          <Route path="/doujin" element={<MangaList />} />
          <Route path="/doujin/:slug" element={<MangaReader />} />
          <Route path="/doujin/:slug/:pageNum" element={<MangaReader />} />
        </>
      ) : (
        <>
          <Route path="/" element={<MangaList />} />
          <Route path="/:slug" element={<MangaReader />} />
          <Route path="/:slug/:pageNum" element={<MangaReader />} />
        </>
      )}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function BdlagRoutes() {
  const isLocalTesting = isLocalDevHost(window.location.hostname);

  return (
    <Routes>
      {isLocalTesting ? (
        <>
          <Route
            path="/bdlag"
            element={<Navigate to="/bdlag/login" replace />}
          />
          <Route
            path="/bdlag/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bdlag/employees"
            element={
              <ProtectedRoute>
                <Layout>
                  <Employees />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bdlag/settings"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'viewer']}>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bdlag/reports"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'viewer']}>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bdlag/report"
            element={<Navigate to="/bdlag/reports" replace />}
          />
          <Route
            path="/bdlag/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
        </>
      ) : (
        <>
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
        </>
      )}
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
