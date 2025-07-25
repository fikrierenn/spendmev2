import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboard from './pages/dashboard/Dashboard';
import Transactions from './pages/transactions/Transactions';
import Categories from './pages/categories/Categories';
import Accounts from './pages/accounts/Accounts';
import Budgets from './pages/budgets/Budgets';
import Settings from './pages/settings/Settings';
import Profile from './pages/profile/Profile';
import Login from './pages/auth/Login';
import AILogin from './pages/auth/AILogin';
import AIAddTransaction from './pages/transactions/AIAddTransaction';
import TransferTransaction from './pages/transactions/TransferTransaction';
import SupabaseTest from './components/SupabaseTest';
import TestPage from './pages/TestPage';
import PWAInstallBanner from './components/ui/PWAInstallBanner';
import { register } from './serviceWorkerRegistration';
import './index.css';
import BudgetStatusPage from './pages/budget-status/BudgetStatusPage';

// Create a client
const queryClient = new QueryClient();

// Register service worker
register();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <Router>
    <div className="App">
                    <Routes>
            <Route path="/login" element={<AILogin />} />
            <Route path="/login-old" element={<Login />} />
            <Route path="/test-page" element={<TestPage />} />
            <Route path="/" element={<ProtectedRoute />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="transactions/add" element={<AIAddTransaction />} />
              <Route path="transactions/transfer" element={<TransferTransaction />} />
              <Route path="categories" element={<Categories />} />
              <Route path="accounts" element={<Accounts />} />
              <Route path="budgets" element={<Budgets />} />
              <Route path="budget-status" element={<BudgetStatusPage />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
              <Route path="test" element={<SupabaseTest />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
          <PWAInstallBanner />
    </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
