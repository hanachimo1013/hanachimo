import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Employees from './components/Employees';
import Settings from './components/Settings';
import Reports from './components/Reports';
import NotFound from './components/NotFound';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import HanachimoProfile from './components/HanachimoProfile';

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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
