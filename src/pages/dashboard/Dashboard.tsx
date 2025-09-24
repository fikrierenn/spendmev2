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
import PaymentMethodsChart from '../../components/charts/PaymentMethodsChart';
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
  
  // Zaman aralığı seçimi için state
  const [timeRange, setTimeRange] = useState<'monthly' | 'allTime'>('monthly');

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
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
             {/* Page header - Mobile first */}
       <div className="px-2 sm:px-4 lg:px-6">
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
           <div className="text-center sm:text-left">
             <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
             <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
               Finansal durumunuzun genel görünümü
             </p>
           </div>
           <div className="flex items-center space-x-3">
             {/* Zaman aralığı toggle */}
             <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
               <button
                 onClick={() => setTimeRange('monthly')}
                 className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                   timeRange === 'monthly'
                     ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                     : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                 }`}
                 aria-label="Bu ay verilerini göster"
               >
                 Bu Ay
               </button>
               <button
                 onClick={() => setTimeRange('allTime')}
                 className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                   timeRange === 'allTime'
                     ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                     : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                 }`}
                 aria-label="Tüm zamanlar verilerini göster"
               >
                 Tüm Zamanlar
               </button>
             </div>
             <button 
               onClick={handleRefresh}
               className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 rounded-lg transition-colors"
               title="Verileri yenile"
               aria-label="Verileri yenile"
             >
               <RefreshCw className="h-5 w-5" />
             </button>
           </div>
         </div>
       </div>

      {/* Mobile Quick Actions - Mobile first design */}
      <div className="px-2 sm:px-4 lg:hidden" role="region" aria-label="Hızlı İşlemler">
        <div className="flex space-x-2 sm:space-x-3 mb-4">
          <button 
            onClick={() => {
              if (process.env.NODE_ENV === 'development') {
                console.log('🚀 Gelir Ekle butonuna tıklandı');
              }
              navigate('/transactions/add?type=income');
            }}
            className="flex-1 bg-success-500 text-white py-3 px-3 sm:px-4 rounded-xl font-medium flex items-center justify-center space-x-2 hover:bg-success-600 transition-colors active:scale-95 focus:outline-none focus:ring-2 focus:ring-success-300 focus:ring-offset-2"
            aria-label="Gelir ekle"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/transactions/add?type=income');
              }
            }}
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            <span className="text-sm sm:text-base">Gelir Ekle</span>
          </button>
          <button 
            onClick={() => {
              if (process.env.NODE_ENV === 'development') {
                console.log('🚀 Gider Ekle butonuna tıklandı');
              }
              navigate('/transactions/add?type=expense');
            }}
            className="flex-1 bg-danger-500 text-white py-3 px-3 sm:px-4 rounded-xl font-medium flex items-center justify-center space-x-2 hover:bg-danger-600 transition-colors active:scale-95 focus:outline-none focus:ring-2 focus:ring-danger-300 focus:ring-offset-2"
            aria-label="Gider ekle"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/transactions/add?type=expense');
              }
            }}
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            <span className="text-sm sm:text-base">Gider Ekle</span>
          </button>
        </div>
      </div>

             {/* Stats cards - Mobile first grid */}
       <div className="px-2 sm:px-4" role="region" aria-label="Finansal Özet">
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                      <StatCard
              title={`Toplam Gelir ${timeRange === 'monthly' ? '(Bu Ay)' : '(Tüm Zamanlar)'}`}
              value={formatCurrency(timeRange === 'monthly' ? stats.monthlyIncome : stats.totalIncome)}
              icon={TrendingUp}
              iconColor="success"
              change=""
              changeType="positive"
            />
            <StatCard
              title={`Toplam Gider ${timeRange === 'monthly' ? '(Bu Ay)' : '(Tüm Zamanlar)'}`}
              value={formatCurrency(timeRange === 'monthly' ? stats.monthlyExpense : stats.totalExpense)}
              icon={TrendingDown}
              iconColor="danger"
              change=""
              changeType="negative"
            />
            <StatCard
              title={`Genel Bakiye ${timeRange === 'monthly' ? '(Bu Ay)' : '(Tüm Zamanlar)'}`}
              value={formatCurrency(timeRange === 'monthly' ? stats.monthlyBalance : stats.balance)}
              icon={DollarSign}
              iconColor="primary"
              change=""
              changeType={timeRange === 'monthly' ? (stats.monthlyBalance >= 0 ? "positive" : "negative") : (stats.balance >= 0 ? "positive" : "negative")}
            />
            <StatCard
              title="Hesap Bakiyeleri (Zaman Bağımsız)"
              value={formatCurrency(stats.walletTotal + stats.bankTotal - stats.creditCards.reduce((sum, c) => sum + c.debt, 0))}
              icon={CreditCard}
              iconColor="warning"
            />
         </div>
       </div>

             {/* Hesap özetleri - Mobile first grid */}
       <div className="px-2 sm:px-4">
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
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
               title={`Kredi Kartları ${timeRange === 'monthly' ? '(Bu Ay)' : '(Tüm Zamanlar)'}`}
               value={formatCurrency(stats.creditCards.reduce((sum, c) => sum + c.debt, 0))}
               icon={CreditCard}
               iconColor={stats.creditCards.reduce((sum, c) => sum + c.available, 0) > 0 ? "primary" : "danger"}
               onClick={() => setShowCreditModal(true)}
               clickable
             />
           )}
         </div>
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

      {/* Charts and recent transactions - Mobile first grid */}
      <div className="px-2 sm:px-4" role="region" aria-label="Grafikler ve Son İşlemler">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                     {/* Top categories chart */}
           <div className="card p-3 sm:p-4 lg:p-6" role="region" aria-label="En Çok Harcanan Kategoriler">
             <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">
               En Çok Harcanan Kategoriler {timeRange === 'monthly' ? '(Bu Ay)' : '(Tüm Zamanlar)'}
             </h3>
                                                 <div className="h-48 sm:h-64 lg:h-80" role="img" aria-label="Kategori harcama grafiği">
                {(() => {
                  const currentData = timeRange === 'monthly' ? stats.topCategories : stats.topCategoriesAllTime;
                  
                  return currentData.length > 0 ? (
                    <TopCategoriesChart data={currentData} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400" role="status" aria-live="polite">
                      Henüz harcama verisi bulunmuyor
                    </div>
                  );
                })()}
              </div>
          </div>

                     {/* Payment methods chart */}
           <div className="card p-3 sm:p-4 lg:p-6" role="region" aria-label="Ödeme Yöntemlerine Göre Harcama">
             <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">
               Ödeme Yöntemlerine Göre Harcama {timeRange === 'monthly' ? '(Bu Ay)' : '(Tüm Zamanlar)'}
             </h3>
                                                 <div className="h-48 sm:h-64 lg:h-80 relative" role="img" aria-label="Ödeme yöntemi harcama grafiği">
                {(() => {
                  const currentData = timeRange === 'monthly' ? stats.paymentMethods : stats.paymentMethodsAllTime;
                  
                  return currentData && currentData.length > 0 ? (
                    <PaymentMethodsChart data={currentData} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400" role="status" aria-live="polite">
                      Henüz ödeme yöntemi verisi bulunmuyor
                    </div>
                  );
                })()}
              </div>
          </div>

          {/* Recent transactions */}
          <div className="card p-3 sm:p-4 lg:p-6" role="region" aria-label="Son İşlemler">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 dark:text-white">
                Son İşlemler
              </h3>
              <button 
                className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2"
                aria-label="Tüm işlemleri görüntüle"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    // Tüm işlemler sayfasına yönlendir
                    navigate('/transactions');
                  }
                }}
              >
                Tümünü Gör
              </button>
            </div>
            {stats.recentTransactions.length > 0 ? (
              <RecentTransactions transactions={stats.recentTransactions} />
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400" role="status" aria-live="polite">
                Henüz işlem bulunmuyor
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="px-2 sm:px-4" role="region" aria-label="AI Analizi">
        <AIAnalysis />
      </div>

      {/* Budget status */}
      <div className="px-2 sm:px-4" role="region" aria-label="Bütçe Durumu">
        <div className="card p-3 sm:p-4 lg:p-6">
          <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">
            Bütçe Durumu
          </h3>
          <BudgetStatus selectedPeriod="2025-07" />
        </div>
      </div>

      {/* Quick actions - Desktop only */}
      <div className="px-2 sm:px-4" role="region" aria-label="Hızlı İşlemler (Desktop)">
        <div className="hidden lg:grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <button 
            onClick={() => navigate('/transactions/add?type=income')}
            className="card hover:shadow-md transition-all duration-200 text-left p-4 lg:p-6 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2"
            aria-label="Gelir ekle - Yeni gelir kaydı oluştur"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/transactions/add?type=income');
              }
            }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-primary-600" aria-hidden="true" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm lg:text-base">Gelir Ekle</h4>
                <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">Yeni gelir kaydı</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => navigate('/transactions/add?type=expense')}
            className="card hover:shadow-md transition-all duration-200 text-left p-4 lg:p-6 active:scale-95 focus:outline-none focus:ring-2 focus:ring-danger-300 focus:ring-offset-2"
            aria-label="Gider ekle - Yeni gider kaydı oluştur"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/transactions/add?type=expense');
              }
            }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-danger-100 rounded-xl flex items-center justify-center">
                <ArrowDownRight className="h-5 w-5 text-danger-600" aria-hidden="true" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm lg:text-base">Gider Ekle</h4>
                <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">Yeni gider kaydı</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => navigate('/budgets')}
            className="card hover:shadow-md transition-all duration-200 text-left p-4 lg:p-6 active:scale-95 focus:outline-none focus:ring-2 focus:ring-success-300 focus:ring-offset-2"
            aria-label="Bütçe oluştur - Yeni bütçe planı oluştur"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/budgets');
              }
            }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-success-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-success-600" aria-hidden="true" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm lg:text-base">Bütçe Oluştur</h4>
                <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">Yeni bütçe planı</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => navigate('/accounts')}
            className="card hover:shadow-md transition-all duration-200 text-left p-4 lg:p-6 active:scale-95 focus:outline-none focus:ring-2 focus:ring-warning-300 focus:ring-offset-2"
            aria-label="Hesap ekle - Yeni hesap tanımla"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/accounts');
              }
            }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-warning-100 rounded-xl flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-warning-600" aria-hidden="true" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm lg:text-base">Hesap Ekle</h4>
                <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">Yeni hesap tanımla</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 