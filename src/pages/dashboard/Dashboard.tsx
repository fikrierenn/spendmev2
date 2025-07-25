import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '../../utils/dummyData';
import { useDashboard } from '../../hooks/useDashboard';
import StatCard from '../../components/ui/StatCard';
import RecentTransactions from '../../components/ui/RecentTransactions';
import BudgetStatus from '../../components/ui/BudgetStatus';
import TopCategoriesChart from '../../components/charts/TopCategoriesChart';
import AIAnalysis from './AIAnalysis';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { stats, loading, error, refreshData } = useDashboard();
  
  // Debug için authentication durumunu logla
  console.log('🔍 Dashboard - Authentication check');

  // Modal state'leri
  const [showBankModal, setShowBankModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);

  const handleRefresh = () => {
    refreshData();
    toast.success('Veriler yenilendi');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Henüz veri bulunmuyor</p>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Yenile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Page header */}
      <div className="px-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Finansal durumunuzun genel görünümü
            </p>
          </div>
          <button 
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Verileri yenile"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Quick Actions - Only visible on mobile */}
      <div className="lg:hidden">
        <div className="flex space-x-3 mb-4">
          <button 
            onClick={() => {
              console.log('🚀 Gelir Ekle butonuna tıklandı');
              navigate('/transactions/add?type=income');
            }}
            className="flex-1 bg-success-500 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2 hover:bg-success-600 transition-colors active:scale-95"
          >
            <Plus className="h-5 w-5" />
            <span>Gelir Ekle</span>
          </button>
          <button 
            onClick={() => {
              console.log('🚀 Gider Ekle butonuna tıklandı');
              navigate('/transactions/add?type=expense');
            }}
            className="flex-1 bg-danger-500 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2 hover:bg-danger-600 transition-colors active:scale-95"
          >
            <Plus className="h-5 w-5" />
            <span>Gider Ekle</span>
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 lg:gap-5 lg:grid-cols-4">
        <StatCard
          title="Toplam Gelir"
          value={formatCurrency(stats.totalIncome)}
          icon={TrendingUp}
          iconColor="success"
          change=""
          changeType="positive"
        />
        <StatCard
          title="Toplam Gider"
          value={formatCurrency(stats.totalExpense)}
          icon={TrendingDown}
          iconColor="danger"
          change=""
          changeType="negative"
        />
        <StatCard
          title="Bakiye"
          value={formatCurrency(stats.balance)}
          icon={DollarSign}
          iconColor="primary"
          change=""
          changeType={stats.balance >= 0 ? "positive" : "negative"}
        />
        <StatCard
          title="Bu Ay"
          value={formatCurrency(stats.monthlyBalance)}
          icon={CreditCard}
          iconColor="warning"
          change=""
          changeType={stats.monthlyBalance >= 0 ? "positive" : "negative"}
        />
      </div>

      {/* Hesap özetleri */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-5">
        <StatCard
          title="Cüzdan (Nakit) Toplamı"
          value={formatCurrency(stats.walletTotal)}
          icon={DollarSign}
          iconColor="primary"
        />
        <StatCard
          title="Banka Hesapları Toplamı"
          value={formatCurrency(stats.bankTotal)}
          icon={DollarSign}
          iconColor="success"
          onClick={() => setShowBankModal(true)}
          clickable
        />
        {/* Kredi kartı toplamı */}
        {stats.creditCards.length === 0 ? (
          <StatCard
            title="Kredi Kartı"
            value="Tanımlı kart yok"
            icon={CreditCard}
            iconColor="warning"
          />
        ) : (
          <StatCard
            title="Kredi Kartları Toplam Borç"
            value={formatCurrency(stats.creditCards.reduce((sum, c) => sum + c.debt, 0))}
            icon={CreditCard}
            iconColor={stats.creditCards.reduce((sum, c) => sum + c.available, 0) > 0 ? "primary" : "danger"}
            onClick={() => setShowCreditModal(true)}
            clickable
          />
        )}
      </div>

      {/* Banka hesapları detay modalı */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative animate-fadeIn">
            <button onClick={() => setShowBankModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 text-xl font-bold">×</button>
            <h2 className="text-2xl font-bold mb-6 text-center">Banka Hesapları Detayı</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-base mb-6 border-separate border-spacing-y-2">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-4 py-2">Hesap Adı</th>
                    <th className="text-right px-4 py-2">Bakiye</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.bankAccounts && stats.bankAccounts.length > 0 ? (
                    stats.bankAccounts.map(acc => (
                      <tr key={acc.id} className="bg-white shadow rounded-xl">
                        <td className="px-4 py-2 font-medium">{acc.name}</td>
                        <td className="text-right px-4 py-2">{formatCurrency(acc.balance)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={2} className="text-center py-4">Tanımlı banka hesabı yok</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Kredi kartları detay modalı */}
      {showCreditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative animate-fadeIn">
            <button onClick={() => setShowCreditModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 text-xl font-bold">×</button>
            <h2 className="text-2xl font-bold mb-6 text-center">Kredi Kartları Detayı</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-base mb-6 border-separate border-spacing-y-2">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-4 py-2">Kart Adı</th>
                    <th className="text-right px-4 py-2">Limit</th>
                    <th className="text-right px-4 py-2">Borç</th>
                    <th className="text-right px-4 py-2">Kalan</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.creditCards.length > 0 ? (
                    stats.creditCards.map(card => (
                      <tr key={card.id} className="bg-white shadow rounded-xl">
                        <td className="px-4 py-2 font-medium">{card.name}</td>
                        <td className="text-right px-4 py-2">{formatCurrency(card.limit)}</td>
                        <td className="text-right px-4 py-2">{formatCurrency(card.debt)}</td>
                        <td className="text-right px-4 py-2">{formatCurrency(card.available)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="text-center py-4">Tanımlı kredi kartı yok</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Charts and recent transactions */}
      <div className="grid grid-cols-1 gap-4 lg:gap-6 lg:grid-cols-2">
        {/* Top categories chart */}
        <div className="card">
          <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-4">
            En Çok Harcanan Kategoriler
          </h3>
          <div className="h-64 lg:h-80">
            {stats.topCategories.length > 0 ? (
              <TopCategoriesChart data={stats.topCategories} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Henüz harcama verisi bulunmuyor
              </div>
            )}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-medium text-gray-900">
              Son İşlemler
            </h3>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors">
              Tümünü Gör
            </button>
          </div>
          {stats.recentTransactions.length > 0 ? (
            <RecentTransactions transactions={stats.recentTransactions} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              Henüz işlem bulunmuyor
            </div>
          )}
        </div>
      </div>

      {/* AI Analysis */}
      <AIAnalysis />

      {/* Budget status */}
      <div className="card">
        <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-4">
          Bütçe Durumu
        </h3>
        <BudgetStatus selectedPeriod="2025-07" />
      </div>

      {/* Quick actions - Desktop only */}
      <div className="hidden lg:grid grid-cols-2 gap-4 lg:grid-cols-4">
        <button 
          onClick={() => window.location.href = '/transactions?type=income'}
          className="card hover:shadow-md transition-all duration-200 text-left p-4 lg:p-6 active:scale-95"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <ArrowUpRight className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm lg:text-base">Gelir Ekle</h4>
              <p className="text-xs lg:text-sm text-gray-500">Yeni gelir kaydı</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => window.location.href = '/transactions?type=expense'}
          className="card hover:shadow-md transition-all duration-200 text-left p-4 lg:p-6 active:scale-95"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-danger-100 rounded-xl flex items-center justify-center">
              <ArrowDownRight className="h-5 w-5 text-danger-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm lg:text-base">Gider Ekle</h4>
              <p className="text-xs lg:text-sm text-gray-500">Yeni gider kaydı</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => window.location.href = '/budgets'}
          className="card hover:shadow-md transition-all duration-200 text-left p-4 lg:p-6 active:scale-95"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-success-100 rounded-xl flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm lg:text-base">Bütçe Oluştur</h4>
              <p className="text-xs lg:text-sm text-gray-500">Yeni bütçe planı</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => window.location.href = '/accounts'}
          className="card hover:shadow-md transition-all duration-200 text-left p-4 lg:p-6 active:scale-95"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-warning-100 rounded-xl flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-warning-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm lg:text-base">Hesap Ekle</h4>
              <p className="text-xs lg:text-sm text-gray-500">Yeni hesap tanımla</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Dashboard; 