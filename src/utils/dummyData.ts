import { 
  Transaction, 
  Category, 
  Account, 
  Budget, 
  DashboardStats, 
  ChartData,
  BudgetStatus 
} from '../types';
import { format, subDays } from 'date-fns';

// Dummy Categories
export const dummyCategories: Category[] = [
  { id: '1', user_id: 'user1', name: 'Market', icon: 'ShoppingCart', type: 'expense', is_main: true },
  { id: '2', user_id: 'user1', name: 'Ulaşım', icon: 'Car', type: 'expense', is_main: true },
  { id: '3', user_id: 'user1', name: 'Akaryakıt', icon: 'Fuel', type: 'expense', is_main: true },
  { id: '4', user_id: 'user1', name: 'Faturalar', icon: 'FileText', type: 'expense', is_main: true },
  { id: '5', user_id: 'user1', name: 'Sağlık', icon: 'Heart', type: 'expense', is_main: true },
  { id: '6', user_id: 'user1', name: 'Eğlence', icon: 'Gamepad2', type: 'expense', is_main: true },
  { id: '7', user_id: 'user1', name: 'Restoran', icon: 'Utensils', type: 'expense', is_main: true },
  { id: '8', user_id: 'user1', name: 'Alışveriş', icon: 'ShoppingBag', type: 'expense', is_main: true },
  { id: '9', user_id: 'user1', name: 'Maaş', icon: 'DollarSign', type: 'income', is_main: true },
  { id: '10', user_id: 'user1', name: 'Ek Gelir', icon: 'PlusCircle', type: 'income', is_main: true },
  { id: '11', user_id: 'user1', name: 'Yatırım', icon: 'TrendingUp', type: 'income', is_main: true },
];

// Dummy Accounts
export const dummyAccounts: Account[] = [
  { id: '1', user_id: 'user1', name: 'Nakit', type: 'nakit', icon: 'Banknote', created_at: '2024-01-01' },
  { id: '2', user_id: 'user1', name: 'Ziraat Bankası', type: 'banka', icon: 'Building', iban: 'TR123456789012345678901234', created_at: '2024-01-01' },
  { id: '3', user_id: 'user1', name: 'Kredi Kartı', type: 'kredi_karti', icon: 'CreditCard', card_limit: 15000, statement_day: 15, due_day: 5, created_at: '2024-01-01' },
];

// Dummy Transactions
export const dummyTransactions: Transaction[] = [
  {
    id: '1',
    user_id: 'user1',
    type: 'expense',
    amount: 450,
    account_id: '3',
    category_id: '1',
    payment_method: 'Kredi Kartı',
    vendor: 'Migros',
    description: 'Market alışverişi',
    date: format(new Date(), 'yyyy-MM-dd'),
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    user_id: 'user1',
    type: 'expense',
    amount: 120,
    account_id: '1',
    category_id: '7',
    payment_method: 'Nakit',
    vendor: 'Kebapçı',
    description: 'Öğle yemeği',
    date: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
    created_at: subDays(new Date(), 1).toISOString(),
  },
  {
    id: '3',
    user_id: 'user1',
    type: 'expense',
    amount: 800,
    account_id: '1',
    category_id: '3',
    payment_method: 'Nakit',
    vendor: 'Petrol Ofisi',
    description: 'Benzin',
    date: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
    created_at: subDays(new Date(), 2).toISOString(),
  },
  {
    id: '4',
    user_id: 'user1',
    type: 'income',
    amount: 25000,
    account_id: '2',
    category_id: '9',
    payment_method: 'Havale',
    vendor: 'Şirket',
    description: 'Maaş',
    date: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
    created_at: subDays(new Date(), 5).toISOString(),
  },
  {
    id: '5',
    user_id: 'user1',
    type: 'expense',
    amount: 1500,
    account_id: '2',
    category_id: '4',
    payment_method: 'Havale',
    vendor: 'Elektrik Şirketi',
    description: 'Elektrik faturası',
    date: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    created_at: subDays(new Date(), 7).toISOString(),
  },
  {
    id: '6',
    user_id: 'user1',
    type: 'expense',
    amount: 300,
    account_id: '3',
    category_id: '8',
    payment_method: 'Kredi Kartı',
    vendor: 'H&M',
    description: 'Kıyafet alışverişi',
    date: format(subDays(new Date(), 10), 'yyyy-MM-dd'),
    created_at: subDays(new Date(), 10).toISOString(),
  },
  {
    id: '7',
    user_id: 'user1',
    type: 'expense',
    amount: 200,
    account_id: '1',
    category_id: '6',
    payment_method: 'Nakit',
    vendor: 'Sinema',
    description: 'Film bileti',
    date: format(subDays(new Date(), 12), 'yyyy-MM-dd'),
    created_at: subDays(new Date(), 12).toISOString(),
  },
  {
    id: '8',
    user_id: 'user1',
    type: 'income',
    amount: 5000,
    account_id: '2',
    category_id: '10',
    payment_method: 'Havale',
    vendor: 'Freelance',
    description: 'Ek gelir',
    date: format(subDays(new Date(), 15), 'yyyy-MM-dd'),
    created_at: subDays(new Date(), 15).toISOString(),
  },
];

// Dummy Budgets
export const dummyBudgets: Budget[] = [
  { id: '1', user_id: 'user1', category_id: '1', period: 'monthly', amount: 2000, created_at: '2024-01-01' },
  { id: '2', user_id: 'user1', category_id: '3', period: 'monthly', amount: 1000, created_at: '2024-01-01' },
  { id: '3', user_id: 'user1', category_id: '4', period: 'monthly', amount: 1500, created_at: '2024-01-01' },
  { id: '4', user_id: 'user1', category_id: '7', period: 'monthly', amount: 800, created_at: '2024-01-01' },
  { id: '5', user_id: 'user1', period: 'monthly', amount: 8000, created_at: '2024-01-01' }, // Genel bütçe
];

// Dummy Chart Data
export const dummyTopCategories: ChartData[] = [
  { name: 'Market', value: 450, color: '#3B82F6' },
  { name: 'Faturalar', value: 1500, color: '#EF4444' },
  { name: 'Akaryakıt', value: 800, color: '#10B981' },
  { name: 'Restoran', value: 120, color: '#F59E0B' },
  { name: 'Alışveriş', value: 300, color: '#8B5CF6' },
];

export const dummyMonthlyData = [
  { month: 'Ocak', income: 30000, expense: 12000, balance: 18000 },
  { month: 'Şubat', income: 30000, expense: 13500, balance: 16500 },
  { month: 'Mart', income: 30000, expense: 14200, balance: 15800 },
  { month: 'Nisan', income: 30000, expense: 11800, balance: 18200 },
  { month: 'Mayıs', income: 30000, expense: 15600, balance: 14400 },
  { month: 'Haziran', income: 30000, expense: 12800, balance: 17200 },
];

// Dummy Budget Status
export const dummyBudgetStatus: BudgetStatus[] = [
  {
    category_id: '1',
    category_name: 'Market',
    budget_amount: 2000,
    spent_amount: 450,
    remaining_amount: 1550,
    percentage_used: 22.5,
    is_over_budget: false,
  },
  {
    category_id: '3',
    category_name: 'Akaryakıt',
    budget_amount: 1000,
    spent_amount: 800,
    remaining_amount: 200,
    percentage_used: 80,
    is_over_budget: false,
  },
  {
    category_id: '4',
    category_name: 'Faturalar',
    budget_amount: 1500,
    spent_amount: 1500,
    remaining_amount: 0,
    percentage_used: 100,
    is_over_budget: false,
  },
  {
    category_id: '7',
    category_name: 'Restoran',
    budget_amount: 800,
    spent_amount: 120,
    remaining_amount: 680,
    percentage_used: 15,
    is_over_budget: false,
  },
];

// Dummy Dashboard Stats
export const dummyDashboardStats: DashboardStats = {
  totalIncome: 30000,
  totalExpense: 12800,
  balance: 17200,
  monthlyIncome: 30000,
  monthlyExpense: 12800,
  monthlyBalance: 17200,
  topCategories: dummyTopCategories,
  recentTransactions: dummyTransactions.slice(0, 5),
  budgetStatus: dummyBudgetStatus,
};

// Helper function to get category name by id
export const getCategoryName = (categoryId: string): string => {
  const category = dummyCategories.find(cat => cat.id === categoryId);
  return category?.name || 'Bilinmeyen';
};

// Helper function to get account name by id
export const getAccountName = (accountId: string): string => {
  const account = dummyAccounts.find(acc => acc.id === accountId);
  return account?.name || 'Bilinmeyen';
};

// Helper function to get category by id
export const getCategory = (categoryId: string): Category | undefined => {
  return dummyCategories.find(cat => cat.id === categoryId);
};

// Helper function to get account by id
export const getAccount = (accountId: string): Account | undefined => {
  return dummyAccounts.find(acc => acc.id === accountId);
};

// Para birimini Türk Lirası (₺) olarak ayarla
export function formatCurrency(amount: number): string {
  // Türk Lirası simgesi ile formatla
  return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Helper function to format date
export const formatDate = (date: string): string => {
  return format(new Date(date), 'dd.MM.yyyy');
};

// Helper function to get transaction type label
export const getTransactionTypeLabel = (type: string): string => {
  switch (type) {
    case 'income':
      return 'Gelir';
    case 'expense':
      return 'Gider';
    case 'transfer':
      return 'Transfer';
    default:
      return 'Bilinmeyen';
  }
};

// Helper function to get transaction type color
export const getTransactionTypeColor = (type: string): string => {
  switch (type) {
    case 'income':
      return 'success';
    case 'expense':
      return 'danger';
    case 'transfer':
      return 'primary';
    default:
      return 'gray';
  }
}; 