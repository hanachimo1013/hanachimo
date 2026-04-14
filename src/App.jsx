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
    const title = routeTitles[location.pathname] || 'Page';
    document.title = `BDLAG | ${title}`;
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <Router>
      <TitleUpdater />
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
        <Route path="/doujin" element={<MangaList />} />
        <Route path="/doujin/:slug" element={<MangaReader />} />
        <Route path="/doujin/:slug/:pageNum" element={<MangaReader />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
