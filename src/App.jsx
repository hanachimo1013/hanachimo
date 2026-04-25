import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import LoadingOverlay from './components/ui/LoadingOverlay';

// ── Lazy-loaded page components (code-splitting) ──
const Layout = React.lazy(() => import('./components/layout/Layout'));
const Dashboard = React.lazy(() => import('./components/pages/Dashboard'));
const Employees = React.lazy(() => import('./components/employee/Employees'));
const Settings = React.lazy(() => import('./components/pages/Settings'));
const Reports = React.lazy(() => import('./components/pages/Reports'));
const NotFound = React.lazy(() => import('./components/pages/NotFound'));
const Login = React.lazy(() => import('./components/auth/Login'));
const ProtectedRoute = React.lazy(() => import('./components/auth/ProtectedRoute'));
const PublicOnlyRoute = React.lazy(() => import('./components/auth/PublicOnlyRoute'));
const HanachimoProfile = React.lazy(() => import('./components/pages/HanachimoProfile'));
const MangaList = React.lazy(() => import('./components/pages/MangaList'));
const MangaReader = React.lazy(() => import('./components/pages/MangaReader'));

/* ──────────────────────────────────────────────
   Context Detection helpers
   ────────────────────────────────────────────── */
const getAppContext = () => {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname.toLowerCase();

  if (pathname.startsWith('/doujin')) return 'doujin';
  if (pathname.startsWith('/bdlag')) return 'bdlag';

  const parts = hostname.split('.');
  if (parts.length >= 3) {
    const sub = parts[0].toLowerCase();
    if (sub === 'doujin') return 'doujin';
    if (sub === 'bdlag') return 'bdlag';
  }
  return 'www';
};

const routeTitles = {
  'dashboard': 'Dashboard',
  'employees': 'Employees',
  'settings': 'Settings',
  'reports': 'Reports',
  'login': 'Login',
};

const TitleUpdater = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const ctx = getAppContext();
    if (ctx === 'doujin') {
      document.title = 'Doujin | Batodeluna';
    } else if (ctx === 'bdlag') {
      const parts = pathname.split('/').filter(Boolean);
      // If path is /bdlag/dashboard, basename is dashboard
      const basename = parts[parts.length - 1] || 'dashboard';
      const title = routeTitles[basename] || 'Admin';
      document.title = `BDLAG | ${title}`;
    } else {
      document.title = 'Hanachimo';
    }
  }, [pathname]);

  return null;
};

/**
 * Subdomain Redirector
 * If a user hits doujin.domain.art/ (no path), redirect them to /doujin
 * This preserves legacy subdomain access while using path-based routing.
 */
const SubdomainRedirector = () => {
  const { pathname } = useLocation();
  const hostname = window.location.hostname;
  
  // Only redirect if at the root path of a subdomain
  if (pathname === '/') {
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      const sub = parts[0].toLowerCase();
      if (sub === 'doujin') return <Navigate to="/doujin" replace />;
      if (sub === 'bdlag') return <Navigate to="/bdlag" replace />;
    }
  }
  return null;
};

const App = () => {
  return (
    <Router>
      <TitleUpdater />
      <SubdomainRedirector />
      <Suspense fallback={<LoadingOverlay message="Loading..." />}>
        <main className="flex flex-col min-h-screen">
          <Routes>
            {/* ──────────────────────────────────────────────
               Doujin Manga Section
               ────────────────────────────────────────────── */}
            <Route path="/doujin">
              <Route index element={<MangaList />} />
              <Route path=":slug" element={<MangaReader />} />
              <Route path=":slug/:pageNum" element={<MangaReader />} />
            </Route>

            {/* ──────────────────────────────────────────────
               BDLAG Admin Section
               ────────────────────────────────────────────── */ }
            <Route path="/bdlag">
              <Route index element={<Navigate to="login" replace />} />
              <Route path="login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
              <Route path="dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
              <Route path="employees" element={<ProtectedRoute><Layout><Employees /></Layout></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute allowedRoles={['superadmin', 'viewer']}><Layout><Settings /></Layout></ProtectedRoute>} />
              <Route path="reports" element={<ProtectedRoute allowedRoles={['superadmin', 'viewer']}><Layout><Reports /></Layout></ProtectedRoute>} />
              <Route path="report" element={<Navigate to="../reports" replace />} />
            </Route>

            {/* ──────────────────────────────────────────────
               Public Profile / Home
               ────────────────────────────────────────────── */}
            <Route path="/" element={<HanachimoProfile />} />
            <Route path="/hanachimo" element={<HanachimoProfile />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>

        </main>
      </Suspense>
    </Router>
  );
};

export default App;
