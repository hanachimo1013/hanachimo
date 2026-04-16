import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function getBdlagPath(path) {
  const hostname = window.location.hostname;
  const isLocalDev = hostname === 'localhost' || hostname === '127.0.0.1';
  return isLocalDev ? `/bdlag${path}` : path;
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-100">
        Checking session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={getBdlagPath('/login')} replace state={{ from: location }} />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to={getBdlagPath('/dashboard')} replace />;
  }

  return children;
}
