// Navigation items - Desktop (all items)
export const NAV_ITEMS = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: 'Home',
    mobile: true, // Show on mobile
  },
  {
    name: 'İşlemler',
    href: '/transactions',
    icon: 'CreditCard',
    mobile: true, // Show on mobile
  },
  {
    name: 'Kategoriler',
    href: '/categories',
    icon: 'Tag',
    mobile: false, // Hide on mobile
  },
  {
    name: 'Hesaplar',
    href: '/accounts',
    icon: 'Wallet',
    mobile: false, // Hide on mobile
  },
  {
    name: 'Bütçeler',
    href: '/budgets',
    icon: 'PieChart',
    mobile: true, // Show on mobile
  },
  {
    name: 'Raporlar',
    href: '/reports',
    icon: 'BarChart3',
    mobile: false, // Hide on mobile
  },
  {
    name: 'AI Asistan',
    href: '/ai',
    icon: 'Bot',
    mobile: false, // Hide on mobile
  },
  {
    name: 'Bütçe Durumu',
    href: '/budget-status',
    icon: 'PieChart',
    mobile: false, // Sadece desktop menüde göster
  },

  {
    name: 'Ayarlar',
    href: '/settings',
    icon: 'Settings',
    mobile: true, // Show on mobile
  },
];

// Mobile navigation items (only essential features)
export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter(item => item.mobile);

// Desktop navigation items (all features)
export const DESKTOP_NAV_ITEMS = NAV_ITEMS;

// Default categories
export const DEFAULT_CATEGORIES = [
  // Expense categories
  { name: 'Market', icon: 'ShoppingCart', type: 'expense' as const, is_main: true },
  { name: 'Ulaşım', icon: 'Car', type: 'expense' as const, is_main: true },
  { name: 'Akaryakıt', icon: 'Fuel', type: 'expense' as const, is_main: true },
  { name: 'Faturalar', icon: 'FileText', type: 'expense' as const, is_main: true },
  { name: 'Sağlık', icon: 'Heart', type: 'expense' as const, is_main: true },
  { name: 'Eğlence', icon: 'Gamepad2', type: 'expense' as const, is_main: true },
  { name: 'Restoran', icon: 'Utensils', type: 'expense' as const, is_main: true },
  { name: 'Alışveriş', icon: 'ShoppingBag', type: 'expense' as const, is_main: true },
  { name: 'Eğitim', icon: 'BookOpen', type: 'expense' as const, is_main: true },
  { name: 'Spor', icon: 'Dumbbell', type: 'expense' as const, is_main: true },
  
  // Income categories
  { name: 'Maaş', icon: 'DollarSign', type: 'income' as const, is_main: true },
  { name: 'Ek Gelir', icon: 'PlusCircle', type: 'income' as const, is_main: true },
  { name: 'Yatırım', icon: 'TrendingUp', type: 'income' as const, is_main: true },
  { name: 'Hediye', icon: 'Gift', type: 'income' as const, is_main: true },
  { name: 'Kira Geliri', icon: 'Home', type: 'income' as const, is_main: true },
];

// Default accounts
export const DEFAULT_ACCOUNTS = [
  { name: 'Nakit', type: 'nakit' as const, icon: 'Banknote' },
  { name: 'Ziraat Bankası', type: 'banka' as const, icon: 'Building' },
  { name: 'Kredi Kartı', type: 'kredi_karti' as const, icon: 'CreditCard' },
];

// Transaction types
export const TRANSACTION_TYPES = [
  { value: 'expense', label: 'Gider', icon: 'MinusCircle', color: 'danger' },
  { value: 'income', label: 'Gelir', icon: 'PlusCircle', color: 'success' },
  { value: 'transfer', label: 'Transfer', icon: 'ArrowLeftRight', color: 'primary' },
];

// Account types
export const ACCOUNT_TYPES = [
  { value: 'banka', label: 'Banka Hesabı', icon: 'Building' },
  { value: 'nakit', label: 'Nakit', icon: 'Banknote' },
  { value: 'kredi_karti', label: 'Kredi Kartı', icon: 'CreditCard' },
  { value: 'diger', label: 'Diğer', icon: 'Wallet' },
];

// Payment methods
export const PAYMENT_METHODS = [
  'Nakit',
  'Kredi Kartı',
  'Banka Kartı',
  'Havale/EFT',
  'Çek',
  'Diğer',
];

// Budget periods
export const BUDGET_PERIODS = [
  { value: 'weekly', label: 'Haftalık' },
  { value: 'monthly', label: 'Aylık' },
  { value: 'yearly', label: 'Yıllık' },
];

// AI humor modes
export const AI_HUMOR_MODES = [
  { value: 'serious', label: 'Ciddi', description: 'Profesyonel ve ciddi' },
  { value: 'friendly', label: 'Samimi', description: 'Dostane ve samimi' },
  { value: 'funny', label: 'Eğlenceli', description: 'Mizahi ve eğlenceli' },
  { value: 'clown', label: 'Palyaço', description: 'Tamamen eğlenceli' },
];

// Chart colors
export const CHART_COLORS = [
  '#3B82F6', // primary-500
  '#EF4444', // danger-500
  '#10B981', // success-500
  '#F59E0B', // warning-500
  '#8B5CF6', // purple-500
  '#06B6D4', // cyan-500
  '#F97316', // orange-500
  '#84CC16', // lime-500
  '#EC4899', // pink-500
  '#6B7280', // gray-500
];

// Date formats
export const DATE_FORMATS = {
  display: 'dd.MM.yyyy',
  input: 'yyyy-MM-dd',
  month: 'MMMM yyyy',
  short: 'dd.MM',
};

// Currency
export const CURRENCY = {
  symbol: '₺',
  code: 'TRY',
  locale: 'tr-TR',
};

// Local storage keys
export const STORAGE_KEYS = {
  USER_SETTINGS: 'spendme_user_settings',
  THEME: 'spendme_theme',
  LANGUAGE: 'spendme_language',
  AI_HUMOR_MODE: 'spendme_ai_humor_mode',
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  TRANSACTIONS: '/transactions',
  CATEGORIES: '/categories',
  ACCOUNTS: '/accounts',
  BUDGETS: '/budgets',
  SETTINGS: '/settings',
  AI: {
    ANALYZE: '/ai/analyze',
    RECOMMEND: '/ai/recommend',
  },
};

// Validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'Bu alan zorunludur',
  EMAIL: 'Geçerli bir e-posta adresi giriniz',
  MIN_LENGTH: (min: number) => `En az ${min} karakter olmalıdır`,
  MAX_LENGTH: (max: number) => `En fazla ${max} karakter olmalıdır`,
  MIN_VALUE: (min: number) => `En az ${min} olmalıdır`,
  MAX_VALUE: (max: number) => `En fazla ${max} olmalıdır`,
  POSITIVE_NUMBER: 'Pozitif bir sayı giriniz',
  FUTURE_DATE: 'Gelecek bir tarih seçiniz',
  PAST_DATE: 'Geçmiş bir tarih seçiniz',
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Bağlantı hatası oluştu. Lütfen tekrar deneyiniz.',
  UNAUTHORIZED: 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapınız.',
  FORBIDDEN: 'Bu işlem için yetkiniz bulunmamaktadır.',
  NOT_FOUND: 'Aradığınız kayıt bulunamadı.',
  SERVER_ERROR: 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyiniz.',
  UNKNOWN_ERROR: 'Bilinmeyen bir hata oluştu.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  SAVED: 'Kayıt başarıyla kaydedildi.',
  UPDATED: 'Kayıt başarıyla güncellendi.',
  DELETED: 'Kayıt başarıyla silindi.',
  LOGIN: 'Başarıyla giriş yaptınız.',
  LOGOUT: 'Başarıyla çıkış yaptınız.',
  REGISTER: 'Hesabınız başarıyla oluşturuldu.',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

// Mobile breakpoints
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}; 

// Category emoji icon list
export const CATEGORY_EMOJIS = [
  '💸', '💰', '🏦', '🛒', '🍔', '☕', '🚗', '🏠', '🧾', '🎁',
  '🏥', '🎓', '🛍️', '🏖️', '🐾', '📱', '🎬', '🧴', '🛠️', '🧸',
  '🏋️', '📚', '🥳', '🏫', '🏢', '🏬', '🏧', '🏠', '🛏️', '🖥️',
  '🧳', '🛡️', '🧃', '🥗', '🧂', '🧹', '🧺', '🧻', '🧼', '🧯',
  '🧪', '🧑‍🎓', '🧑‍💼', '🧑‍🔧', '🧑‍🍳', '🧑‍🚀', '🧑‍🌾', '🧑‍🎤', '🧑‍🏫'
]; 