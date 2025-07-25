import React, { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw, Edit, Trash2, X, ArrowRight, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../utils/dummyData';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { TransactionService } from '../../services/transactionService';
import toast from 'react-hot-toast';
import { Database } from '../../lib/supabase';

type Transaction = Database['public']['Tables']['spendme_transactions']['Row'] & {
  category?: { name: string };
  account?: { name: string };
  from_account?: { name: string };
  to_account?: { name: string };
  installment_group_id?: string;
  installment_no?: number;
};

const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({
    description: '',
    amount: 0,
    category_id: '',
    account_id: '',
    date: '',
    vendor: '',
    installments: 1,
    type: 'expense' as 'income' | 'expense' | 'transfer',
    payment_method: 'kredi kartı'
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  
  // Taksitli işlem düzenleme state'leri
  const [isInstallmentTransaction, setIsInstallmentTransaction] = useState(false);
  const [installmentGroup, setInstallmentGroup] = useState<Transaction[]>([]);
  const [editMode, setEditMode] = useState<'single' | 'all_installments'>('single');
  const [showEditModeDialog, setShowEditModeDialog] = useState(false);
  
  // Hierarchical selection state
  const [mainCategories, setMainCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [showSubcategories, setShowSubcategories] = useState(false);
  
  // Account hierarchy state
  const [accountGroups, setAccountGroups] = useState<{ [key: string]: any[] }>({});
  const [selectedAccountGroup, setSelectedAccountGroup] = useState<string | null>(null);
  const [showAccountSubcategories, setShowAccountSubcategories] = useState(false);
  
  // Filter state
  const [dateFilter, setDateFilter] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10)
  });
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [accountFilter, setAccountFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Helper functions
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Bilinmeyen';
  };

  const getAccountName = (accountId: string): string => {
    const account = accounts.find(acc => acc.id === accountId);
    return account?.name || 'Bilinmeyen';
  };

  // Transfer işlemleri için hesap adını al
  const getTransactionAccountName = (transaction: Transaction): string => {
    if (transaction.type === 'transfer') {
      const fromAccount = transaction.from_account?.name || 'Bilinmeyen';
      const toAccount = transaction.to_account?.name || 'Bilinmeyen';
      return `${fromAccount} → ${toAccount}`;
    } else {
      return transaction.account?.name || getAccountName(transaction.account_id || '');
    }
  };

  // Taksitli işlem tespiti ve grup bulma
  const checkInstallmentTransaction = async (transaction: Transaction) => {
    if (TransactionService.isInstallmentTransaction(transaction)) {
      setIsInstallmentTransaction(true);
      
      console.log('🔍 Taksitli işlem tespit edildi:', {
        id: transaction.id,
        description: transaction.description,
        installments: transaction.installments,
        installment_group_id: transaction.installment_group_id
      });
      
      try {
        // Eğer installment_group_id varsa, yeni yöntemi kullan
        if (transaction.installment_group_id) {
          console.log('✅ Yeni yöntem kullanılıyor - installment_group_id:', transaction.installment_group_id);
          const group = await TransactionService.getInstallmentGroup(
            user!.id,
            transaction.installment_group_id
          );
          
          console.log('📊 Bulunan grup:', group);
          
          if (group && group.length > 0) {
            setInstallmentGroup(group as Transaction[]);
            setShowEditModeDialog(true);
            return;
          }
        }
        
        // Eski yöntem - geriye uyumluluk için
        console.log('⚠️ Eski yöntem kullanılıyor - installment_group_id yok');
        const group = await TransactionService.getInstallmentGroupByFields(
          user!.id,
          transaction.description || '',
          transaction.amount,
          transaction.payment_method || '',
          transaction.account_id || '',
          transaction.category_id || '',
          transaction.installments || 1
        );
        
        // Eğer grup bulunamazsa veya boşsa, sadece bu işlemi göster
        if (!group || group.length === 0) {
          console.warn('Installment group not found, treating as single transaction');
          setIsInstallmentTransaction(false);
          setInstallmentGroup([]);
          setEditMode('single');
          setShowEditModal(true);
          return;
        }
        
        setInstallmentGroup(group as Transaction[]);
        
        // Düzenleme modu seçimi için dialog göster
        setShowEditModeDialog(true);
      } catch (error) {
        console.error('Error fetching installment group:', error);
        // Hata durumunda normal düzenleme modal'ını aç
        setIsInstallmentTransaction(false);
        setInstallmentGroup([]);
        setEditMode('single');
        setShowEditModal(true);
      }
    } else {
      setIsInstallmentTransaction(false);
      setInstallmentGroup([]);
      setEditMode('single');
    }
  };

  // Load transactions
  const loadTransactions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('spendme_transactions')
        .select(`
          *,
          spendme_categories!spendme_transactions_category_id_fkey(name, icon),
          spendme_accounts!spendme_transactions_account_id_fkey(name, type, icon),
          from_account:spendme_accounts!spendme_transactions_from_account_id_fkey(name, type, icon),
          to_account:spendme_accounts!spendme_transactions_to_account_id_fkey(name, type, icon)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      console.log('📊 Yüklenen işlemler:', {
        toplamSayi: data?.length || 0,
        taksitliIslemler: data?.filter(t => t.installments && t.installments > 1).length || 0,
        normalIslemler: data?.filter(t => !t.installments || t.installments <= 1).length || 0,
        ornekIslemler: data?.slice(0, 3).map(t => ({
          id: t.id,
          description: t.description,
          amount: t.amount,
          installments: t.installments,
          installment_group_id: t.installment_group_id
        }))
      });

      setTransactions(data || []);
    } catch (err: any) {
      console.error('Error loading transactions:', err);
      toast.error('İşlemler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
    loadCategoriesAndAccounts();
  }, [user]);

  // Load categories and accounts for edit form
  const loadCategoriesAndAccounts = async () => {
    if (!user) return;
    
    try {
      const [categoriesResult, accountsResult, mainCategoriesResult] = await Promise.all([
        supabase.from('spendme_categories').select('id, name, type, icon, parent_id').eq('user_id', user.id),
        supabase.from('spendme_accounts').select('id, name, type, icon').eq('user_id', user.id),
        supabase.from('spendme_categories').select('id, name, type, icon').eq('user_id', user.id).is('parent_id', null)
      ]);
      
      setCategories(categoriesResult.data || []);
      setAccounts(accountsResult.data || []);
      setMainCategories(mainCategoriesResult.data || []);
      
      // Group accounts by type
      const grouped = groupAccountsByType(accountsResult.data || []);
      setAccountGroups(grouped);
    } catch (error) {
      console.error('Error loading categories and accounts:', error);
    }
  };

  // Group accounts by type
  const groupAccountsByType = (accounts: any[]) => {
    const groups: { [key: string]: any[] } = {};
    
    accounts.forEach(account => {
      const groupKey = getAccountGroupKey(account.type);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(account);
    });
    
    return groups;
  };

  // Get account group key based on type
  const getAccountGroupKey = (type: string) => {
    switch (type) {
      case 'wallet':
      case 'cash':
        return 'Cüzdan';
      case 'credit_card':
        return 'Kredi Kartı';
      case 'bank':
      case 'savings':
        return 'Banka';
      default:
        return 'Diğer';
    }
  };

  // Get account group display name
  const getAccountGroupDisplayName = (groupKey: string) => {
    switch (groupKey) {
      case 'Cüzdan':
        return '💳 Cüzdan';
      case 'Kredi Kartı':
        return '💳 Kredi Kartı';
      case 'Banka':
        return '🏦 Banka';
      default:
        return '📁 Diğer';
    }
  };

  // Load subcategories for a main category
  const loadSubcategories = async (parentId: string) => {
    try {
      const { data } = await supabase
        .from('spendme_categories')
        .select('id, name, type, icon')
        .eq('user_id', user?.id)
        .eq('parent_id', parentId);
      
      setSubcategories(data || []);
    } catch (error) {
      console.error('Error loading subcategories:', error);
    }
  };

  // Handle edit transaction - Taksitli işlem kontrolü ile güncellendi
  const handleEdit = async (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    
    // Taksitli işlemlerde toplam tutarı hesapla
    let displayAmount = transaction.amount;
    let displayDate = transaction.date;
    
    if (TransactionService.isInstallmentTransaction(transaction)) {
      displayAmount = transaction.amount * (transaction.installments || 1);
      
      // Taksitli işlemlerde ilk taksit tarihini hesapla
      if (transaction.installment_no && transaction.installment_no > 1) {
        const currentDate = new Date(transaction.date);
        const monthsToSubtract = transaction.installment_no - 1;
        currentDate.setMonth(currentDate.getMonth() - monthsToSubtract);
        displayDate = currentDate.toISOString().split('T')[0];
        
        console.log('📅 Taksit tarihi hesaplanıyor:', {
          secilenTaksitNo: transaction.installment_no,
          secilenTarih: transaction.date,
          hesaplananIlkTarih: displayDate,
          aylarGeri: monthsToSubtract
        });
      }
    }
    
    // Taksitli işlemlerde açıklamadan taksit bilgisini temizle
    let cleanDescription = transaction.description || '';
    if (TransactionService.isInstallmentTransaction(transaction)) {
      cleanDescription = cleanDescription.replace(/\s*\(Taksit\s+\d+\/\d+\)\s*$/, '');
    }
    
    setEditForm({
      description: cleanDescription,
      amount: displayAmount, // Taksitli işlemlerde toplam tutar
      category_id: transaction.category_id || '',
      account_id: transaction.account_id || '',
      date: displayDate, // Taksitli işlemlerde ilk taksit tarihi
      vendor: transaction.vendor || '',
      installments: transaction.installments || 1,
      type: transaction.type as 'income' | 'expense' | 'transfer',
      payment_method: transaction.payment_method || 'kredi kartı'
    });
    
    // Taksitli işlem kontrolü
    await checkInstallmentTransaction(transaction);
    
    // Set up hierarchical category selection
    const selectedCategory = categories.find(cat => cat.id === transaction.category_id);
    if (selectedCategory) {
      if (selectedCategory.parent_id) {
        // It's a subcategory, find and select the main category
        setSelectedMainCategory(selectedCategory.parent_id);
        setShowSubcategories(true);
        loadSubcategories(selectedCategory.parent_id);
      } else {
        // It's a main category
        setSelectedMainCategory(selectedCategory.id);
        setShowSubcategories(false);
        setSubcategories([]);
      }
    } else {
      setSelectedMainCategory(null);
      setShowSubcategories(false);
      setSubcategories([]);
    }
    
    // Set up hierarchical account selection
    const selectedAccount = accounts.find(acc => acc.id === transaction.account_id);
    if (selectedAccount) {
      const groupKey = getAccountGroupKey(selectedAccount.type);
      setSelectedAccountGroup(groupKey);
      setShowAccountSubcategories(true);
    } else {
      setSelectedAccountGroup(null);
      setShowAccountSubcategories(false);
    }
    
    // Eğer taksitli işlem değilse direkt modal'ı aç
    if (!TransactionService.isInstallmentTransaction(transaction)) {
      setShowEditModal(true);
    }
  };

  // Düzenleme modu seçimi
  const handleEditModeSelect = (mode: 'single' | 'all_installments') => {
    setEditMode(mode);
    setShowEditModeDialog(false);
    setShowEditModal(true);
  };

  // Handle delete transaction - Taksitli işlem kontrolü ile güncellendi
  const handleDelete = async (transaction: Transaction) => {
    if (!window.confirm('Bu işlemi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      // Taksitli işlem kontrolü
      if (TransactionService.isInstallmentTransaction(transaction)) {
        let group: Transaction[] = [];
        
        // Eğer installment_group_id varsa, yeni yöntemi kullan
        if (transaction.installment_group_id) {
          group = await TransactionService.getInstallmentGroup(
            user!.id,
            transaction.installment_group_id
          );
        } else {
          // Eski yöntem - geriye uyumluluk için
          group = await TransactionService.getInstallmentGroupByFields(
            user!.id,
            transaction.description || '',
            transaction.amount,
            transaction.payment_method || '',
            transaction.account_id || '',
            transaction.category_id || '',
            transaction.installments || 1
          );
        }
        
        const shouldDeleteAll = window.confirm(
          `Bu taksitli işlem ${transaction.installments} taksitten oluşuyor. Tüm taksitleri silmek istiyor musunuz?`
        );
        
        if (shouldDeleteAll) {
          // Tüm taksitleri sil
          await TransactionService.deleteInstallmentGroup(group.map(t => t.id));
          toast.success('Tüm taksitler başarıyla silindi');
        } else {
          // Sadece seçilen taksiti sil
          const { error } = await supabase
            .from('spendme_transactions')
            .delete()
            .eq('id', transaction.id);

          if (error) throw error;
          toast.success('Taksit başarıyla silindi');
        }
      } else {
        // Normal işlem silme
        const { error } = await supabase
          .from('spendme_transactions')
          .delete()
          .eq('id', transaction.id);

        if (error) throw error;
        toast.success('İşlem başarıyla silindi');
      }
      
      loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('İşlem silinirken hata oluştu');
    }
  };

  // Handle save edit - Taksitli işlem desteği ile güncellendi
  const handleSaveEdit = async () => {
    if (!selectedTransaction) return;

    setEditLoading(true);
    try {
      if (isInstallmentTransaction && editMode === 'all_installments') {
        // Yeni sistem: Tüm taksitleri sil ve yeniden oluştur
        console.log('🔄 Taksitli işlem güncelleniyor:', {
          installmentGroupId: selectedTransaction.installment_group_id,
          toplamTutar: editForm.amount,
          taksitSayisi: editForm.installments,
          baslangicTarihi: editForm.date
        });
        
        // Taksitli işlemi güncelle (tüm taksitleri yeniden oluştur)
        await TransactionService.updateInstallmentTransaction(
          user!.id,
          selectedTransaction.installment_group_id!,
          {
            type: editForm.type as 'income' | 'expense' | 'transfer',
            amount: editForm.amount, // Toplam tutar
            description: editForm.description,
            date: editForm.date, // İlk taksit tarihi
            payment_method: editForm.payment_method || 'kredi kartı',
            vendor: editForm.vendor,
            installments: editForm.installments || 1,
            category_id: editForm.category_id,
            account_id: editForm.account_id
          }
        );
        
        toast.success('Tüm taksitler başarıyla güncellendi');
      } else {
        // Tek işlem güncelleme
        const { error } = await supabase
          .from('spendme_transactions')
          .update({
            description: editForm.description,
            amount: editForm.amount,
            category_id: editForm.category_id,
            account_id: editForm.account_id,
            date: editForm.date,
            vendor: editForm.vendor,
            installments: editForm.installments
          })
          .eq('id', selectedTransaction.id);

        if (error) throw error;
        toast.success('İşlem başarıyla güncellendi');
      }
      
      setShowEditModal(false);
      setSelectedTransaction(null);
      resetModalStates();
      loadTransactions();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('İşlem güncellenirken hata oluştu');
    } finally {
      setEditLoading(false);
    }
  };

  const handleRefresh = () => {
    loadTransactions();
    toast.success('İşlemler yenilendi');
  };

  const filteredTransactions = transactions.filter(transaction => {
    // Search term filter
    const matchesSearch = 
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCategoryName(transaction.category_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTransactionAccountName(transaction).toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date filter
    const transactionDate = new Date(transaction.date);
    const startDate = new Date(dateFilter.startDate);
    const endDate = new Date(dateFilter.endDate);
    const matchesDate = transactionDate >= startDate && transactionDate <= endDate;
    
    // Type filter
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    
    // Category filter
    const matchesCategory = !categoryFilter || transaction.category_id === categoryFilter;
    
    // Account filter
    const matchesAccount = !accountFilter || transaction.account_id === accountFilter;
    
    const isVisible = matchesSearch && matchesDate && matchesType && matchesCategory && matchesAccount;
    
    // Debug için taksit işlemlerini logla
    if (transaction.installments && transaction.installments > 1) {
      console.log('🔍 Taksit işlemi filtreleniyor:', {
        id: transaction.id,
        description: transaction.description,
        date: transaction.date,
        installments: transaction.installments,
        matchesSearch,
        matchesDate,
        matchesType,
        matchesCategory,
        matchesAccount,
        isVisible,
        searchTerm,
        dateFilter,
        typeFilter,
        categoryFilter,
        accountFilter
      });
    }
    
    return isVisible;
  });

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-success-600 bg-success-100';
      case 'expense':
        return 'text-danger-600 bg-danger-100';
      case 'transfer':
        return 'text-primary-600 bg-primary-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTransactionTypeLabel = (type: string) => {
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

  // Handle main category selection in edit modal
  const handleMainCategorySelect = async (categoryId: string) => {
    setSelectedMainCategory(categoryId);
    setShowSubcategories(true);
    setEditForm(prev => ({ ...prev, category_id: '' })); // Reset subcategory selection
    
    if (user) {
      await loadSubcategories(categoryId);
    }
  };

  // Handle subcategory selection in edit modal
  const handleSubcategorySelect = (categoryId: string) => {
    setEditForm(prev => ({ ...prev, category_id: categoryId }));
  };

  // Handle account group selection in edit modal
  const handleAccountGroupSelect = (groupKey: string) => {
    setSelectedAccountGroup(groupKey);
    setShowAccountSubcategories(true);
    setEditForm(prev => ({ ...prev, account_id: '' })); // Reset account selection
  };

  // Handle account selection in edit modal
  const handleAccountSelect = (accountId: string) => {
    setEditForm(prev => ({ ...prev, account_id: accountId }));
  };

  // Reset modal states
  const resetModalStates = () => {
    setSelectedMainCategory(null);
    setShowSubcategories(false);
    setSubcategories([]);
    setSelectedAccountGroup(null);
    setShowAccountSubcategories(false);
    setEditForm({
      description: '',
      amount: 0,
      category_id: '',
      account_id: '',
      date: '',
      vendor: '',
      installments: 1,
      type: 'expense' as 'income' | 'expense' | 'transfer',
      payment_method: 'kredi kartı'
    });
    
    // Taksitli işlem state'lerini sıfırla
    setIsInstallmentTransaction(false);
    setInstallmentGroup([]);
    setEditMode('single');
    setShowEditModeDialog(false);
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Sayfa başlığı ve aksiyon butonları - Her zaman görünür */}
      <div className="flex items-center justify-between lg:flex-row flex-col lg:space-y-0 space-y-2">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">İşlemler</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tüm gelir ve gider işlemlerinizi görüntüleyin
          </p>
        </div>
        {/* Her zaman görünür butonlar - hem mobil hem masaüstünde */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleRefresh}
            className="inline-flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            title="İşlemleri yenile"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button 
            onClick={() => navigate('/transactions/transfer')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            <span>Transfer</span>
          </button>
          <button 
            onClick={() => navigate('/transactions/add')}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Yeni İşlem</span>
            <span className="sm:hidden">Ekle</span>
          </button>
        </div>
      </div>

      {/* Filters and search */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="İşlem ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        
        {/* Advanced Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tarih Aralığı
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              />
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
          </div>
          
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              İşlem Türü
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="all">Tümü</option>
              <option value="income">Gelir</option>
              <option value="expense">Gider</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
          
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kategori
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Account Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hesap
            </label>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Tüm Hesaplar</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.icon} {account.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Filter Summary */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            {filteredTransactions.length} işlem bulundu
            {(dateFilter.startDate !== new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10) || 
              dateFilter.endDate !== new Date().toISOString().slice(0, 10) || 
              typeFilter !== 'all' || 
              categoryFilter || 
              accountFilter) && (
              <span className="ml-2 text-blue-600">(filtrelenmiş)</span>
            )}
          </span>
          <button
            onClick={() => {
              setDateFilter({
                startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
                endDate: new Date().toISOString().slice(0, 10)
              });
              setTypeFilter('all');
              setCategoryFilter('');
              setAccountFilter('');
            }}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Filtreleri Temizle
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">İşlemler yükleniyor...</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredTransactions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Arama kriterlerinize uygun işlem bulunamadı' : 'Henüz işlem bulunmuyor'}
          </p>
          {!searchTerm && (
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Yenile
            </button>
          )}
        </div>
      )}

      {/* Mobile Transactions List */}
      <div className="lg:hidden space-y-3">
        {!loading && filteredTransactions.map((transaction) => (
          <div key={transaction.id} className="card p-4 hover:shadow-md transition-shadow cursor-pointer active:scale-98">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  transaction.type === 'income' 
                    ? 'bg-success-100 text-success-600' 
                    : transaction.type === 'expense'
                    ? 'bg-danger-100 text-danger-600'
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  <span className="text-sm font-bold">
                    {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : '↔'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    <div className="flex items-center space-x-2">
                      <span>{transaction.description || 'Açıklama yok'}</span>
                      {transaction.installments && transaction.installments > 1 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-full">
                          <CreditCard className="h-3 w-3 mr-1" />
                          Taksitli
                        </span>
                      )}
                    </div>
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {getCategoryName(transaction.category_id || '')} • {getTransactionAccountName(transaction)}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className={`text-sm font-medium ${
                  transaction.type === 'income' ? 'text-success-600' : transaction.type === 'expense' ? 'text-danger-600' : 'text-blue-600'
                }`}>
                  {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}{formatCurrency(transaction.amount)}
                </p>
                <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
              </div>
            </div>
            
            {transaction.vendor && (
              <div className="text-xs text-gray-500 mb-2">
                Satıcı: {transaction.vendor}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(transaction.type)}`}>
                {getTransactionTypeLabel(transaction.type)}
              </span>
              <div className="flex items-center space-x-1">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(transaction);
                  }}
                  className="text-gray-400 hover:text-blue-600 p-1 transition-colors"
                  title="Düzenle"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(transaction);
                  }}
                  className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                  title="Sil"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Transactions Table */}
      <div className="hidden lg:block card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Açıklama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hesap
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tür
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tutar
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {!loading && filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                        <span>{transaction.description || 'Açıklama yok'}</span>
                        {transaction.installments && transaction.installments > 1 && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-full">
                            <CreditCard className="h-3 w-3 mr-1" />
                            Taksitli
                          </span>
                        )}
                      </div>
                      {transaction.vendor && (
                        <div className="text-sm text-gray-500">{transaction.vendor}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getCategoryName(transaction.category_id || '')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getTransactionAccountName(transaction)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(transaction.type)}`}>
                      {getTransactionTypeLabel(transaction.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <span className={
                      transaction.type === 'income' ? 'text-success-600' : 
                      transaction.type === 'expense' ? 'text-danger-600' : 
                      'text-blue-600'
                    }>
                      {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}{formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-1">
                      <button 
                        onClick={() => handleEdit(transaction)}
                        className="text-gray-400 hover:text-blue-600 p-1 transition-colors"
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(transaction)}
                        className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                İşlem Düzenle
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetModalStates();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Açıklama
                </label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isInstallmentTransaction ? 'Toplam Tutar' : 'Tutar'}
                </label>
                
                {/* Taksitli işlemler için taksit tutarı bilgisi */}
                {isInstallmentTransaction && (
                  <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700 dark:text-blue-300 font-medium">Taksit Tutarı:</span>
                      <span className="text-blue-800 dark:text-blue-200 font-semibold">
                        {formatCurrency(editForm.amount / (editForm.installments || 1))}
                      </span>
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      ({editForm.installments} taksit × {formatCurrency(editForm.amount / (editForm.installments || 1))})
                    </div>
                  </div>
                )}
                
                <input
                  type="number"
                  step="0.01"
                  value={editForm.amount}
                  onChange={(e) => setEditForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder={isInstallmentTransaction ? "Toplam tutarı girin" : "Tutarı girin"}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kategori
                </label>
                
                {/* Ana Kategoriler */}
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Ana Kategoriler
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {mainCategories
                      .filter(cat => cat.type === selectedTransaction?.type)
                      .map(category => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => handleMainCategorySelect(category.id)}
                          className={`p-2 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 text-xs ${
                            selectedMainCategory === category.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                          }`}
                        >
                          {category.icon && <span className="text-sm">{category.icon}</span>}
                          <span className="font-medium">{category.name}</span>
                        </button>
                      ))}
                  </div>
                </div>
                
                {/* Alt Kategoriler */}
                {showSubcategories && selectedMainCategory && (
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Alt Kategoriler
                    </h4>
                    {subcategories.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {subcategories.map(category => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => handleSubcategorySelect(category.id)}
                            className={`p-2 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 text-xs ${
                              editForm.category_id === category.id
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                : 'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600'
                            }`}
                          >
                            {category.icon && <span className="text-sm">{category.icon}</span>}
                            <span className="font-medium">{category.name}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                        <p className="text-xs">Bu ana kategoride alt kategori yok</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hesap
                </label>
                
                {/* Hesap Grupları */}
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Hesap Grupları
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(accountGroups).map(groupKey => (
                      <button
                        key={groupKey}
                        type="button"
                        onClick={() => handleAccountGroupSelect(groupKey)}
                        className={`p-2 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 text-xs ${
                          selectedAccountGroup === groupKey
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                        }`}
                      >
                        <span className="text-sm">{getAccountGroupDisplayName(groupKey).split(' ')[0]}</span>
                        <span className="font-medium">{getAccountGroupDisplayName(groupKey).split(' ').slice(1).join(' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Hesap Alt Kategorileri */}
                {showAccountSubcategories && selectedAccountGroup && (
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Hesaplar
                    </h4>
                    {accountGroups[selectedAccountGroup]?.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {accountGroups[selectedAccountGroup].map(account => (
                          <button
                            key={account.id}
                            type="button"
                            onClick={() => handleAccountSelect(account.id)}
                            className={`p-2 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 text-xs ${
                              editForm.account_id === account.id
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                : 'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600'
                            }`}
                          >
                            {account.icon && <span className="text-sm">{account.icon}</span>}
                            <span className="font-medium">{account.name}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                        <p className="text-xs">Bu grupta hesap yok</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tarih
                </label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Vendor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Satıcı (İsteğe bağlı)
                </label>
                <input
                  type="text"
                  value={editForm.vendor}
                  onChange={(e) => setEditForm(prev => ({ ...prev, vendor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Satıcı adı (opsiyonel)"
                />
              </div>

                            {/* Taksit Alanı - Sadece taksitli işlemlerde göster */}
              {isInstallmentTransaction && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Taksit Sayısı
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={36}
                    value={editForm.installments}
                    onChange={(e) => setEditForm(prev => ({ ...prev, installments: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                    Taksit sayısını değiştirirseniz, tüm taksitler güncellenir.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetModalStates();
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editLoading ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Taksitli İşlem Düzenleme Modu Seçim Dialog'u */}
      {showEditModeDialog && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                Taksitli İşlem Düzenleme
              </h3>
              <button
                onClick={() => {
                  setShowEditModeDialog(false);
                  resetModalStates();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Bu işlem <strong>{selectedTransaction.installments} taksitli</strong> bir kredi kartı işlemidir. 
                Nasıl düzenlemek istiyorsunuz?
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleEditModeSelect('all_installments')}
                  className="w-full p-4 border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <div className="text-left">
                    <div className="font-semibold">Tüm Taksitleri Düzenle</div>
                    <div className="text-sm opacity-75">
                      Tüm {selectedTransaction.installments} taksiti aynı anda günceller
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleEditModeSelect('single')}
                  className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="text-left">
                                         <div className="font-semibold">Sadece Bu Taksiti Düzenle</div>
                     <div className="text-sm opacity-75">
                       Sadece seçilen taksiti günceller
                     </div>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowEditModeDialog(false);
                  resetModalStates();
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions; 