// Türkçe açıklama: Bu dosyada, modern bütçe yönetimi arayüzü tasarlanmıştır. Ana kategoriler akordiyon olarak listelenir, açılınca alt kategoriler (deeper elements) görünür. Gelir ve gider kategorileri ayrı bölümlerde, toplam bütçe kartları ve dönem seçici ile birlikte sunulur. Supabase'den gerçek veri çeker.

import React, { useState, useEffect } from 'react';
import { ChevronRight, DollarSign, TrendingUp, TrendingDown, Calendar, Plus, Trash2, PieChart, Banknote, FileText } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { BudgetService } from '../../services/budgetService';
import { CategoryService } from '../../services/categoryService';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/supabase';

// Supabase tip tanımları
type Budget = Database['public']['Tables']['spendme_budgets']['Row'] & {
  category?: {
    name: string;
    icon: string;
    type: 'income' | 'expense';
    parent_id?: string | null;
  };
};

type Category = Database['public']['Tables']['spendme_categories']['Row'];

// Kategori ile alt kategorileri içeren tip
type CategoryWithSubcategories = Category & {
  subcategories?: Category[];
};

// Bütçe durumu tipi (gerçekleşen harcama dahil)
interface BudgetStatusType {
  category_id: string;
  budget_amount: number;
  spent_amount: number;
}

// Props
interface BudgetStatusProps {
  selectedPeriod?: string;
}

// Yardımcı fonksiyon: Bir sonraki ayın ilk günü
function getNextMonthFirstDay(period: string) {
  const [year, month] = period.split('-').map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
}

const BudgetStatus: React.FC<BudgetStatusProps> = ({ selectedPeriod }) => {
  const { user } = useAuth();
  
  // State'ler
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Akordiyon ve dönem state'leri
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [currentPeriod, setCurrentPeriod] = useState(selectedPeriod || '2025-07');

  // Veri yükleme fonksiyonu
  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      console.log('BudgetStatus: Veri yükleniyor...', { userId: user.id, period: currentPeriod });

      // Paralel olarak tüm verileri çek
      const [budgetsData, categoriesData, transactionsData] = await Promise.all([
        // Bütçeleri çek
        BudgetService.getBudgetsByPeriod(user.id, currentPeriod),
        // Kategorileri çek (ana ve alt kategoriler)
        CategoryService.getCategoryWithSubcategories(user.id),
        // Transaction'ları çek (gerçekleşen harcamalar için)
        supabase
          .from('spendme_transactions')
          .select('category_id, amount, type')
          .eq('user_id', user.id)
          .gte('date', `${currentPeriod}-01`)
          .lt('date', getNextMonthFirstDay(currentPeriod)) // 32. gün yerine bir sonraki ayın ilk günü
      ]);

      console.log('BudgetStatus: Bütçeler yüklendi:', budgetsData);
      console.log('BudgetStatus: Kategoriler yüklendi:', categoriesData);
      console.log('BudgetStatus: Transaction\'lar yüklendi:', transactionsData.data);

      // Kategorileri düzleştir (ana ve alt kategorileri tek dizide topla)
      const flattenedCategories: Category[] = [];
      (categoriesData as CategoryWithSubcategories[]).forEach(mainCat => {
        flattenedCategories.push(mainCat);
        if (mainCat.subcategories) {
          flattenedCategories.push(...mainCat.subcategories);
        }
      });

      setCategories(flattenedCategories);
      setBudgets(budgetsData);
      setTransactions(transactionsData.data || []);
      // DEBUG: Transaction verisini logla
      console.log('DEBUG - Transaction verisi:', transactionsData.data);

    } catch (err) {
      console.error('BudgetStatus: Veri yükleme hatası:', err);
      setError(err instanceof Error ? err.message : 'Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Dönem değiştiğinde veriyi yeniden yükle
  useEffect(() => {
    loadData();
  }, [user, currentPeriod]);

  // Akordiyon toggle fonksiyonu
  const toggleGroup = (groupId: string) => {
    const newOpenGroups = new Set(openGroups);
    if (newOpenGroups.has(groupId)) {
      newOpenGroups.delete(groupId);
    } else {
      newOpenGroups.add(groupId);
    }
    setOpenGroups(newOpenGroups);
  };

  // Ana kategorileri bul (parent_id olmayanlar)
  const mainCategories = categories.filter(cat => !cat.parent_id);

  // Gelir ve gider kategorilerini ayır
  const incomeCategories = mainCategories.filter(cat => cat.type === 'income');
  const expenseCategories = mainCategories.filter(cat => cat.type === 'expense');

  // Kategori için gerçekleşen harcamayı hesapla
  const getCategorySpentAmount = (categoryId: string): number => {
    return transactions
      .filter(tx => tx.category_id === categoryId && tx.type === 'expense')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  };

  // Kategori için gelir tutarını hesapla
  const getCategoryIncomeAmount = (categoryId: string): number => {
    return transactions
      .filter(tx => tx.category_id === categoryId && tx.type === 'income')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  };

  // Ana kategori için toplam hesaplama
  const getMainCategoryTotals = (mainCategory: Category) => {
    const subCategories = categories.filter(cat => cat.parent_id === mainCategory.id);
    const subCategoryIds = subCategories.map(sub => sub.id);
    
    let budgetTotal = 0;
    let spentTotal = 0;

    // Bütçe tutarlarını topla
    budgets.forEach(budget => {
      if (subCategoryIds.includes(budget.category_id || '')) {
        budgetTotal += budget.amount || 0;
      }
    });

    // Gerçekleşen tutarları topla
    subCategories.forEach(subCat => {
      if (subCat.type === 'expense') {
        spentTotal += getCategorySpentAmount(subCat.id);
      } else if (subCat.type === 'income') {
        spentTotal += getCategoryIncomeAmount(subCat.id);
      }
    });
    
    return { budgetTotal, spentTotal, subCount: subCategories.length };
  };

  // Toplam hesaplamalar
  const totalBudget = budgets.reduce((sum, budget) => sum + (budget.amount || 0), 0);
  const totalIncomeBudget = budgets.filter(budget => {
    const category = categories.find(cat => cat.id === budget.category_id);
    return category?.type === 'income';
  }).reduce((sum, budget) => sum + (budget.amount || 0), 0);
  const totalExpenseBudget = budgets.filter(budget => {
    const category = categories.find(cat => cat.id === budget.category_id);
    return category?.type === 'expense';
  }).reduce((sum, budget) => sum + (budget.amount || 0), 0);

  // Kalan bütçe hesaplama
  const totalSpent = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const remainingBudget = totalBudget - totalSpent;

  // Gelir ve gider gerçekleşen ve kalan hesaplama
  const totalIncomeSpent = transactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const remainingIncome = totalIncomeBudget - totalIncomeSpent;
  const isIncomeUnder = remainingIncome > 0;

  const totalExpenseSpent = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const remainingExpense = totalExpenseBudget - totalExpenseSpent;
  const isExpenseOver = remainingExpense < 0;

  // Planlanan (bütçeye göre)
  const netBudgetTarget = totalIncomeBudget - totalExpenseBudget; // Hedef gelir-gider farkı
  const isTargetDeficit = netBudgetTarget < 0;
  // Gerçekleşen (fiili)
  const netActual = totalIncomeSpent - totalExpenseSpent; // Gerçekleşen gelir-gider farkı
  const isActualDeficit = netActual < 0;
  // Hedefe göre kalan
  const netRemaining = netBudgetTarget - netActual; // Hedefe göre kalan
  const isDeficit = netActual < 0;
  const isOverTarget = netRemaining < 0;

  // Dönem seçenekleri
  const periodOptions = [
    { value: '2025-07', label: 'Temmuz 2025' },
    { value: '2025-06', label: 'Haziran 2025' },
    { value: '2025-05', label: 'Mayıs 2025' },
  ];

  // Kategori bölümü render fonksiyonu
  const renderCategorySection = (title: string, categories: Category[], type: 'income' | 'expense') => {
    const totalBudget = categories.reduce((sum, cat) => {
      const totals = getMainCategoryTotals(cat);
      return sum + totals.budgetTotal;
    }, 0);

    // Lucide ikonlarını string olarak eşleştirmek için
    const lucideIcons = {
      DollarSign,
      TrendingUp,
      Calendar,
      // Diğer Lucide ikonları eklenebilir
    };

    // Icon render helper
    const renderIcon = (icon: string | null) => {
      if (!icon) return null;
      // Eğer Lucide ikon adı ise
      if (lucideIcons[icon as keyof typeof lucideIcons]) {
        const LucideIcon = lucideIcons[icon as keyof typeof lucideIcons];
        return <LucideIcon className="h-5 w-5" />;
      }
      // Değilse doğrudan emoji veya unicode göster
      return <span className="text-lg">{icon}</span>;
    };

    return (
      <div className="mb-8">
        {/* Bölüm başlığı */}
        <div className="flex items-center mb-4">
          <div className={`p-2 rounded-lg mr-3 ${type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {/* Dolar yerine anlamlı ikonlar */}
            {type === 'income' ? <Banknote className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">Toplam: {totalBudget.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
          </div>
        </div>

        {/* Ana kategoriler */}
        <div className="space-y-2">
          {categories.map(mainCategory => {
            const { budgetTotal, spentTotal, subCount } = getMainCategoryTotals(mainCategory);
            const isOpen = openGroups.has(mainCategory.id);
            // Sadece bu ana kategoriye ait alt kategorileri bul
            const subCategories: Category[] = (mainCategory as any).subcategories || [];

            return (
              <div key={mainCategory.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Ana kategori başlığı */}
                <button
                  onClick={() => toggleGroup(mainCategory.id)}
                  className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <ChevronRight 
                      className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} 
                    />
                    {renderIcon(mainCategory.icon)}
                    <div className="text-left">
                      <div className="font-medium text-gray-900">{mainCategory.name}</div>
                      <div className="text-sm text-gray-600">
                        {subCategories.length} alt kategori • {budgetTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </div>
                    </div>
                  </div>
                  {/* Ana kategori için Hedef, Gerçekleşen, Oran */}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-xs text-gray-500">Hedef:</span>
                    <span className="font-medium text-blue-900">{budgetTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-xs text-gray-500">Gerçekleşen:</span>
                    <span className="font-medium text-gray-900">{spentTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-xs text-gray-500">%{budgetTotal > 0 ? ((spentTotal / budgetTotal) * 100).toFixed(1) : '0.0'}</span>
                  </div>
                </button>

                {/* Alt kategoriler (deeper elements) */}
                {isOpen && subCategories.length > 0 && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    {subCategories.map((subCategory: Category) => {
                      // DEBUG: Alt kategori id ve eşleşen transactionlar
                      const matchingTransactions = transactions.filter(tx => tx.category_id === subCategory.id);
                      console.log('DEBUG - Alt kategori:', subCategory.name, 'id:', subCategory.id, 'Eşleşen transactionlar:', matchingTransactions);
                      // Bu alt kategori için bütçe bul
                      const budget = budgets.find(b => b.category_id === subCategory.id);
                      const budgetAmount = budget?.amount || 0;
                      // Bu alt kategori için gerçekleşen tutar
                      let spentAmount = 0;
                      if (subCategory.type === 'expense') {
                        spentAmount = getCategorySpentAmount(subCategory.id);
                      } else if (subCategory.type === 'income') {
                        spentAmount = getCategoryIncomeAmount(subCategory.id);
                      }
                      const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
                      const isOver = spentAmount > budgetAmount;
                      return (
                        <div key={subCategory.id} className="p-4 border-b border-gray-200 last:border-b-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              {renderIcon(subCategory.icon)}
                              <span className="font-medium text-gray-900">{subCategory.name}</span>
                            </div>
                            {/* Tek satırda hedef, gerçekleşen ve yüzde */}
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-xs text-gray-500">Hedef:</span>
                              <span className="font-medium text-blue-900">{budgetAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                              <span className="text-xs text-gray-400">|</span>
                              <span className="text-xs text-gray-500">Gerçekleşen:</span>
                              <span className={`font-medium ${isOver ? 'text-red-600' : 'text-gray-900'}`}>{spentAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                              <span className="text-xs text-gray-400">|</span>
                              <span className="text-xs text-gray-500">%{percentage.toFixed(1)}</span>
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${isOver ? 'bg-red-500' : percentage >= 100 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          {isOver && (
                            <div className="text-xs text-red-600 mt-1 font-semibold">Bütçe aşıldı!</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Loading durumu
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Bütçe verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  // Türkçe açıklama: Raporlama sayfası için üstte ay seçici ve özet kartlar tekrar eklendi. Akordiyonlar ve alt kategoriler çalışır durumda.
  return (
    <div className="space-y-6">
      {/* Dönem seçici */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700">Dönem:</span>
        <select
          value={currentPeriod}
          onChange={(e) => setCurrentPeriod(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {periodOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Toplam bütçe kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Gelir Bütçesi */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Gelir Bütçesi</p>
              <p className="text-xl font-bold text-green-900">
                {totalIncomeBudget.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </p>
              <p className="text-xs text-gray-500">Gerçekleşen: {totalIncomeSpent.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
              <p className={`text-xs ${isIncomeUnder ? 'text-orange-600 font-bold' : 'text-gray-500'}`}>Kalan: {remainingIncome.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}{isIncomeUnder ? ' (Hedefin altında kaldınız!)' : ''}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        {/* Gider Bütçesi */}
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Gider Bütçesi</p>
              <p className="text-xl font-bold text-orange-900">
                {totalExpenseBudget.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </p>
              <p className="text-xs text-gray-500">Gerçekleşen: {totalExpenseSpent.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
              <p className={`text-xs ${isExpenseOver ? 'text-red-600 font-bold' : 'text-gray-500'}`}>Kalan: {remainingExpense.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}{isExpenseOver ? ' (Bütçe aşıldı!)' : ''}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        {/* Bütçe Eksiği/Fazlası (Planlanan) */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Bütçe Eksiği/Fazlası</p>
              <p className={`text-xl font-bold ${isTargetDeficit ? 'text-red-600' : 'text-green-700'}`}>{netBudgetTarget.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
              <p className="text-xs text-gray-500">
                ({totalIncomeBudget.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} - {totalExpenseBudget.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })})
              </p>
              <p className="text-xs text-gray-400">Gelir Bütçesi - Gider Bütçesi</p>
              {isTargetDeficit && <p className="text-xs text-red-600 font-bold">Planlanan bütçe açığı!</p>}
            </div>
            <PieChart className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        {/* Gerçekleşene Göre Bütçe Eksiği/Fazlası */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Gerçekleşene Göre Bütçe Eksiği/Fazlası</p>
              <p className={`text-xl font-bold ${isActualDeficit ? 'text-red-600' : 'text-green-700'}`}>{netActual.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
              <p className="text-xs text-gray-500">
                ({totalIncomeSpent.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} - {totalExpenseSpent.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })})
              </p>
              <p className="text-xs text-gray-400">Gerçekleşen Gelir - Gerçekleşen Gider</p>
              {isActualDeficit && <p className="text-xs text-red-600 font-bold">Fiili bütçe açığı!</p>}
            </div>
            <PieChart className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Kategori bölümleri */}
      {renderCategorySection('Gelir Kategorileri', incomeCategories, 'income')}
      {renderCategorySection('Gider Kategorileri', expenseCategories, 'expense')}
    </div>
  );
};

export default BudgetStatus; 