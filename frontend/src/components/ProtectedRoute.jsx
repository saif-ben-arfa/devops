import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  console.log('ProtectedRoute:', { user, loading });

  if (loading) {
    console.log('ProtectedRoute: loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute: no user, redirecting to /login');
    return <Navigate to="/login" />;
  }

  console.log('ProtectedRoute: user authenticated, rendering children');
  return children;
};

export default ProtectedRoute; 