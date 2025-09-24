import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/dummyData';

interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyBalance: number;
  // Hem aylık hem tüm zamanlar için kategoriler
  topCategories: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  topCategoriesAllTime: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  recentTransactions: any[];
  budgetStatus: Array<{
    category_id: string;
    category_name: string;
    budget_amount: number;
    spent_amount: number;
    remaining_amount: number;
    percentage_used: number;
    is_over_budget: boolean;
  }>;
  // Yeni eklenenler:
  walletTotal: number; // Cüzdan (nakit) toplamı
  bankTotal: number;   // Banka hesapları toplamı
  creditCards: Array<{
    id: string;
    name: string;
    limit: number;
    debt: number;
    available: number;
  }>;
  bankAccounts: Array<{
    id: string;
    name: string;
    balance: number;
  }>;
  // Hem aylık hem tüm zamanlar için ödeme yöntemleri
  paymentMethods: Array<{
    name: string;
    value: number;
    color: string;
    icon: string;
  }>;
  paymentMethodsAllTime: Array<{
    name: string;
    value: number;
    color: string;
    icon: string;
  }>;
}

export const useDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Get current month start and end dates for monthly stats
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Fetch ALL transactions (geçmiş veriler dahil) for total stats
      const { data: allTransactions, error: allTransactionsError } = await supabase
        .from('spendme_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (allTransactionsError) {
        throw allTransactionsError;
      }

      // Fetch transactions for current month only (for monthly stats)
      const { data: monthlyTransactions, error: monthlyTransactionsError } = await supabase
        .from('spendme_transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', monthStart.toISOString().split('T')[0])
        .lte('date', monthEnd.toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (monthlyTransactionsError) {
        throw monthlyTransactionsError;
      }

      // Use allTransactions for total stats, monthlyTransactions for monthly stats
      const transactions = allTransactions;
      const monthlyTransactionsData = monthlyTransactions;

      // Calculate TOTAL stats (tüm zamanlar)
      const allIncome = transactions?.filter(t => t.type === 'income') || [];
      const allExpenses = transactions?.filter(t => t.type === 'expense') || [];
      
      const totalIncome = allIncome.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalExpense = allExpenses.reduce((sum, t) => sum + (t.amount || 0), 0);
      const balance = totalIncome - totalExpense;

      // Calculate MONTHLY stats (sadece bu ay)
      const monthlyIncome = monthlyTransactionsData?.filter(t => t.type === 'income') || [];
      const monthlyExpenses = monthlyTransactionsData?.filter(t => t.type === 'expense') || [];
      
      const monthlyIncomeTotal = monthlyIncome.reduce((sum, t) => sum + (t.amount || 0), 0);
      const monthlyExpenseTotal = monthlyExpenses.reduce((sum, t) => sum + (t.amount || 0), 0);
      const monthlyBalance = monthlyIncomeTotal - monthlyExpenseTotal;

      // Get category names for transactions (hem bu ay hem tüm zamanlar için)
      const allCategoryIds = Array.from(new Set(allExpenses.map(t => t.category_id)));
      const monthlyCategoryIds = Array.from(new Set(monthlyExpenses.map(t => t.category_id)));
      
      // Tüm kategori ID'lerini birleştir ve tekrarları kaldır
      const allUniqueCategoryIds = Array.from(new Set([...allCategoryIds, ...monthlyCategoryIds]));
      
      const { data: categories } = await supabase
        .from('spendme_categories')
        .select('id, name')
        .in('id', allUniqueCategoryIds);

      // Get top categories (bu ay)
      const monthlyCategoryTotals: { [key: string]: number } = {};
      monthlyExpenses.forEach(transaction => {
        const category = categories?.find(c => c.id === transaction.category_id);
        const categoryName = category?.name || 'Bilinmeyen';
        monthlyCategoryTotals[categoryName] = (monthlyCategoryTotals[categoryName] || 0) + (transaction.amount || 0);
      });

      const topCategories = Object.entries(monthlyCategoryTotals)
        .map(([name, value]) => ({
          name,
          value,
          color: getRandomColor(name)
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Get top categories (tüm zamanlar)
      const allTimeCategoryTotals: { [key: string]: number } = {};
      allExpenses.forEach(transaction => {
        const category = categories?.find(c => c.id === transaction.category_id);
        const categoryName = category?.name || 'Bilinmeyen';
        allTimeCategoryTotals[categoryName] = (allTimeCategoryTotals[categoryName] || 0) + (transaction.amount || 0);
      });

      const topCategoriesAllTime = Object.entries(allTimeCategoryTotals)
        .map(([name, value]) => ({
          name,
          value,
          color: getRandomColor(name)
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Get recent transactions
      const recentTransactions = transactions?.slice(0, 5) || [];

      // Fetch budgets and calculate status
      const { data: budgets, error: budgetsError } = await supabase
        .from('spendme_budgets')
        .select('*')
        .eq('user_id', user.id);

      if (budgetsError) {
        throw budgetsError;
      }

      // Get category names for budgets
      const budgetCategoryIds = Array.from(new Set(budgets?.map(b => b.category_id) || []));
      const { data: budgetCategories } = await supabase
        .from('spendme_categories')
        .select('id, name')
        .in('id', budgetCategoryIds);

      const budgetStatus = budgets?.map(budget => {
        // Bütçe durumu için sadece bu ayın harcamalarını kullan
        const categoryExpenses = monthlyExpenses.filter(t => t.category_id === budget.category_id);
        const spentAmount = categoryExpenses.reduce((sum, t) => sum + (t.amount || 0), 0);
        const remainingAmount = (budget.amount || 0) - spentAmount;
        const percentageUsed = budget.amount ? (spentAmount / budget.amount) * 100 : 0;
        
        const category = budgetCategories?.find(c => c.id === budget.category_id);

        return {
          category_id: budget.category_id,
          category_name: category?.name || 'Bilinmeyen',
          budget_amount: budget.amount || 0,
          spent_amount: spentAmount,
          remaining_amount: remainingAmount,
          percentage_used: percentageUsed,
          is_over_budget: spentAmount > (budget.amount || 0)
        };
      }) || [];

      // --- HESAP BAKİYELERİ VE KREDİ KARTI ÖZETİ ---
      // Tüm hesapları çek
      const { data: accounts, error: accountsError } = await supabase
        .from('spendme_accounts')
        .select('*')
        .eq('user_id', user.id);
      if (accountsError) throw accountsError;

      // Hesapları türlerine göre ayır (tüm varyasyonları kapsa)
      const walletAccounts = accounts.filter(acc => acc.type === 'cash' || acc.type === 'wallet');
      const bankAccounts = accounts.filter(acc => acc.type === 'bank');
      const creditAccounts = accounts.filter(acc => acc.type === 'credit' || acc.type === 'credit_card');

      // Her hesabın bakiyesini hesaplamak için arrow function ve null kontrolü
      const calcBalance = (accountId: string) => {
        // Eğer transactions null ise boş dizi kullanılır
        const txns = transactions || [];
        const incomeSum = txns.filter(t => t.account_id === accountId && t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
        const expenseSum = txns.filter(t => t.account_id === accountId && t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
        // Transfer gelenler
        const transferIn = txns.filter(t => t.to_account_id === accountId && t.type === 'transfer').reduce((sum, t) => sum + (t.amount || 0), 0);
        // Transfer gidenler
        const transferOut = txns.filter(t => t.account_id === accountId && t.type === 'transfer').reduce((sum, t) => sum + (t.amount || 0), 0);
        return incomeSum + transferIn - expenseSum - transferOut;
      }

      // Cüzdan toplamı
      const walletTotal = walletAccounts.reduce((sum, acc) => sum + calcBalance(acc.id), 0);
      // Banka toplamı
      const bankTotal = bankAccounts.reduce((sum, acc) => sum + calcBalance(acc.id), 0);

      // Banka hesaplarının detaylarını stats'a ekle
      const bankAccountsDetails = bankAccounts.map(acc => ({
        id: acc.id,
        name: acc.name,
        balance: calcBalance(acc.id)
      }));

      // Kredi kartı özetleri
      const creditCards = creditAccounts.map(acc => {
        // Borç: Bu karta ait tüm giderler + transfer gidenler - transfer gelenler
        const debt = transactions.filter(t => t.account_id === acc.id && t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0)
          + transactions.filter(t => t.account_id === acc.id && t.type === 'transfer').reduce((sum, t) => sum + (t.amount || 0), 0)
          - transactions.filter(t => t.to_account_id === acc.id && t.type === 'transfer').reduce((sum, t) => sum + (t.amount || 0), 0);
        const limit = acc.card_limit || 0;
        const available = limit - debt;
        return {
          id: acc.id,
          name: acc.name,
          limit,
          debt,
          available
        };
      });

      // Tüm kredi kartlarının toplamı
      const totalCreditLimit = creditCards.reduce((sum, card) => sum + card.limit, 0);
      const totalCreditDebt = creditCards.reduce((sum, card) => sum + card.debt, 0);
      const totalCreditAvailable = creditCards.reduce((sum, card) => sum + card.available, 0);

      // Ödeme yöntemlerine göre harcama dağılımı (bu ay)
      const monthlyPaymentMethodTotals: { [key: string]: number } = {};
      monthlyExpenses.forEach(transaction => {
        const paymentMethod = transaction.payment_method || 'Bilinmeyen';
        monthlyPaymentMethodTotals[paymentMethod] = (monthlyPaymentMethodTotals[paymentMethod] || 0) + (transaction.amount || 0);
      });

      // Ödeme yöntemlerine göre harcama dağılımı (tüm zamanlar)
      const allTimePaymentMethodTotals: { [key: string]: number } = {};
      allExpenses.forEach(transaction => {
        const paymentMethod = transaction.payment_method || 'Bilinmeyen';
        allTimePaymentMethodTotals[paymentMethod] = (allTimePaymentMethodTotals[paymentMethod] || 0) + (transaction.amount || 0);
      });

      // Ödeme yöntemlerini renk ve ikon ile birlikte hazırla
      const paymentMethodIcons: { [key: string]: string } = {
        'nakit': '💵',
        'kredi kartı': '💳',
        'banka kartı': '🏦',
        'havale': '📤',
        'eft': '📤',
        'papel': '🧾',
        'Bilinmeyen': '❓'
      };

      const paymentMethodColors: { [key: string]: string } = {
        'nakit': '#10B981',      // Yeşil
        'kredi kartı': '#3B82F6', // Mavi
        'banka kartı': '#8B5CF6', // Mor
        'havale': '#F59E0B',     // Turuncu
        'eft': '#EF4444',        // Kırmızı
        'papel': '#6366F1',      // İndigo
        'Bilinmeyen': '#6B7280'  // Gri
      };

      const paymentMethods = Object.entries(monthlyPaymentMethodTotals)
        .map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1), // İlk harfi büyük yap
          value,
          color: paymentMethodColors[name] || paymentMethodColors['Bilinmeyen'],
          icon: paymentMethodIcons[name] || paymentMethodIcons['Bilinmeyen']
        }))
        .sort((a, b) => b.value - a.value); // En yüksek tutardan sırala

      const paymentMethodsAllTime = Object.entries(allTimePaymentMethodTotals)
        .map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1), // İlk harfi büyük yap
          value,
          color: paymentMethodColors[name] || paymentMethodColors['Bilinmeyen'],
          icon: paymentMethodIcons[name] || paymentMethodIcons['Bilinmeyen']
        }))
        .sort((a, b) => b.value - a.value); // En yüksek tutardan sırala

      const dashboardStats: DashboardStats = {
        totalIncome,
        totalExpense,
        balance,
        monthlyIncome: monthlyIncomeTotal,
        monthlyExpense: monthlyExpenseTotal,
        monthlyBalance: monthlyBalance,
        topCategories,
        topCategoriesAllTime,
        recentTransactions,
        budgetStatus,
        walletTotal,
        bankTotal,
        creditCards,
        bankAccounts: bankAccountsDetails,
        paymentMethods,
        paymentMethodsAllTime
      };

      setStats(dashboardStats);
    } catch (err: any) {
      console.error('Dashboard data fetch error:', err);
      setError(err.message || 'Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getRandomColor = (seed: string): string => {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
    ];
    const index = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const refreshData = () => {
    fetchDashboardData();
  };

  return {
    stats,
    loading,
    error,
    refreshData
  };
}; 