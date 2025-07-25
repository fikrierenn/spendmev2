// User types
export interface User {
  id: string;
  email?: string;
  display_name?: string;
  created_at: string;
}

// Account types
export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: 'banka' | 'nakit' | 'kredi_karti' | 'diger';
  icon?: string;
  iban?: string;
  note?: string;
  card_limit?: number;
  statement_day?: number;
  due_day?: number;
  card_note?: string;
  card_number?: string;
  created_at: string;
}

// Category types
export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon?: string;
  type: 'expense' | 'income';
  is_main: boolean;
  parent_id?: string;
}

// Transaction types
export interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  account_id?: string;
  category_id?: string;
  payment_method?: string;
  installments?: number;
  vendor?: string;
  description?: string;
  date: string;
  to_account_id?: string;
  created_at: string;
}

// Budget types
export interface Budget {
  id: string;
  user_id: string;
  category_id?: string;
  period: 'monthly' | 'weekly' | 'yearly';
  amount: number;
  created_at: string;
}

// Settings types
export interface Settings {
  id: string;
  user_id: string;
  theme?: 'light' | 'dark' | 'auto';
  ai_humor_mode?: 'serious' | 'friendly' | 'funny' | 'clown';
  language?: 'tr' | 'en';
  created_at: string;
}

// AI Response types
export interface AIAnalysisResponse {
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  category?: string;
  account?: string;
  date?: string;
  description?: string;
}

export interface AIRecommendationResponse {
  analysis: string;
  recommendations: string[];
  humor_mode: 'serious' | 'friendly' | 'funny' | 'clown';
}

// Form types
export interface TransactionFormData {
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  account_id?: string;
  category_id?: string;
  payment_method?: string;
  installments?: number;
  vendor?: string;
  description?: string;
  date: string;
  to_account_id?: string;
}

export interface CategoryFormData {
  name: string;
  icon?: string;
  type: 'expense' | 'income';
  is_main: boolean;
  parent_id?: string;
}

export interface AccountFormData {
  name: string;
  type: 'banka' | 'nakit' | 'kredi_karti' | 'diger';
  icon?: string;
  iban?: string;
  note?: string;
  card_limit?: number;
  statement_day?: number;
  due_day?: number;
  card_note?: string;
  card_number?: string;
}

export interface BudgetFormData {
  category_id?: string;
  period: 'monthly' | 'weekly' | 'yearly';
  amount: number;
}

// Chart types
export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

// Navigation types
export interface NavItem {
  name: string;
  href: string;
  icon: string;
  badge?: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Filter types
export interface TransactionFilters {
  type?: 'income' | 'expense' | 'transfer';
  category_id?: string;
  account_id?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
}

// Dashboard types
export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyBalance: number;
  topCategories: ChartData[];
  recentTransactions: Transaction[];
  budgetStatus: BudgetStatus[];
}

export interface BudgetStatus {
  category_id?: string;
  category_name: string;
  budget_amount: number;
  spent_amount: number;
  remaining_amount: number;
  percentage_used: number;
  is_over_budget: boolean;
} 