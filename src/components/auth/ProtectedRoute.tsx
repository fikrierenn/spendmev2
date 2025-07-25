import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../layout/Layout';

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  console.log('🔍 ProtectedRoute - Auth check:', { user: user?.email, loading });

  // Show loading spinner while checking auth
  if (loading) {
    console.log('⏳ ProtectedRoute - Loading...');
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('❌ ProtectedRoute - No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('✅ ProtectedRoute - User authenticated, rendering layout');

  // Render protected content with layout
  return <Layout />;
};

export default ProtectedRoute; 