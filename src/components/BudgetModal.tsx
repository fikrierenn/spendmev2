import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, FileText } from 'lucide-react';
import { BudgetService } from '../services/budgetService';
import { CategoryService } from '../services/categoryService';
import { Database } from '../lib/supabase';
import { supabase } from '../lib/supabase';

type Budget = Database['public']['Tables']['spendme_budgets']['Row'] & {
  category?: {
    name: string;
    icon: string;
    type: 'income' | 'expense';
    parent_id?: string | null;
  };
  description?: string;
};

type Category = Database['public']['Tables']['spendme_categories']['Row'];

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  budget?: Budget | null;
  userId: string;
  period: string;
  onPeriodChange?: (period: string) => void;
}

const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  budget,
  userId,
  period,
  onPeriodChange
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'income' | 'expense'>('expense');
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copyFromPeriod, setCopyFromPeriod] = useState<string>('');
  const [copyToPeriod, setCopyToPeriod] = useState<string>('');
  const [availablePeriods, setAvailablePeriods] = useState<Array<{value: string, label: string}>>([]);
  const [targetPeriods, setTargetPeriods] = useState<Array<{value: string, label: string}>>([]);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{category_id: string, amount: number, confidence: number}>>([]);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadAvailablePeriods();
      console.log('Modal opened, loading data...');
      if (budget) {
        // Editing existing budget
        setSelectedCategoryId(budget.category_id || '');
        setAmount(budget.amount?.toString() || '');
        setDescription(budget.description || '');
        setSelectedType(budget.category?.type || 'expense');
        setShowCopyDialog(false);
        console.log('Editing existing budget:', budget);
      } else {
        // Creating new budget
        setSelectedCategoryId('');
        setAmount('');
        setDescription('');
        setSelectedType('expense');
        setShowCopyDialog(true);
        console.log('Creating new budget, showing copy dialog');
      }
    }
  }, [isOpen, budget]);

  const loadCategories = async () => {
    try {
      const categoriesData = await CategoryService.getCategories(userId);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Kategoriler yüklenirken hata oluştu');
    }
  };

  const loadAvailablePeriods = async () => {
    try {
      // Get all periods that have budget data for source selection
      const { data: periodsData, error } = await supabase
        .from('spendme_budgets')
        .select('period')
        .eq('user_id', userId)
        .order('period', { ascending: false });

      if (error) {
        console.error('Error fetching periods:', error);
        return;
      }

      // Get unique periods that have budgets
      const uniquePeriods = Array.from(new Set(periodsData?.map((p: any) => p.period) || []));
      
      const periodsWithBudgets = uniquePeriods.map((period: any) => {
        const [year, month] = period.split('-');
        const monthNames = [
          'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
          'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ];
        const label = `${monthNames[parseInt(month) - 1]} ${year}`;
        return { value: period, label };
      });

      console.log('Periods with budgets:', periodsWithBudgets);
      setAvailablePeriods(periodsWithBudgets);
      
      // Generate all possible target periods (current year and next year)
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const nextYear = currentYear + 1;
      const targetPeriodsList = [];
      
      // Add all months for current year
      for (let month = 1; month <= 12; month++) {
        const period = `${currentYear}-${String(month).padStart(2, '0')}`;
        const monthNames = [
          'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
          'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ];
        const label = `${monthNames[month - 1]} ${currentYear}`;
        targetPeriodsList.push({ value: period, label });
      }
      
      // Add all months for next year
      for (let month = 1; month <= 12; month++) {
        const period = `${nextYear}-${String(month).padStart(2, '0')}`;
        const monthNames = [
          'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
          'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ];
        const label = `${monthNames[month - 1]} ${nextYear}`;
        targetPeriodsList.push({ value: period, label });
      }
      
      setTargetPeriods(targetPeriodsList);
      
      // Set default target period to current month
      const currentMonth = currentDate.getMonth() + 1;
      const defaultTargetPeriod = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
      setCopyToPeriod(defaultTargetPeriod);
    } catch (err) {
      console.error('Error loading available periods:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategoryId) {
      setError('Lütfen bir kategori seçin');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Lütfen geçerli bir tutar girin');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const budgetData = {
        user_id: userId,
        category_id: selectedCategoryId,
        amount: parseFloat(amount),
        description: description.trim() || null,
        period: period
      };

      if (budget) {
        // Update existing budget
        await BudgetService.updateBudget(budget.id, budgetData);
      } else {
        // Create new budget
        await BudgetService.createBudget(budgetData);
      }

      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving budget:', err);
      setError(err instanceof Error ? err.message : 'Bütçe kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCategories = () => {
    return categories.filter(cat => cat.type === selectedType);
  };

  const getCategoryDisplayName = (category: Category) => {
    if (category.parent_id) {
      const parent = categories.find(c => c.id === category.parent_id);
      return parent ? `${parent.name} > ${category.name}` : category.name;
    }
    return category.name;
  };

  const handleCopyFromPeriod = async () => {
    if (!copyFromPeriod) {
      setError('Lütfen bir dönem seçin');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get budgets from selected period
      const sourceBudgets = await BudgetService.getBudgetsByPeriod(userId, copyFromPeriod);
      
      if (sourceBudgets.length === 0) {
        setError('Seçilen dönemde bütçe bulunamadı');
        setLoading(false);
        return;
      }

      // Copy budgets to current period
      for (const sourceBudget of sourceBudgets) {
        const budgetData = {
          user_id: userId,
          category_id: sourceBudget.category_id,
          amount: sourceBudget.amount,
          period: copyToPeriod
        };

        // Check if budget already exists for this category in target period
        const existingBudget = await BudgetService.getBudgetsByPeriod(userId, copyToPeriod);
        const categoryExists = existingBudget.some(b => b.category_id === sourceBudget.category_id);

        if (!categoryExists) {
          await BudgetService.createBudget(budgetData);
        }
      }

      setShowCopyDialog(false);
      setError(null);
      // Show success message
      alert(`${copyFromPeriod} döneminden ${copyToPeriod} dönemine ${sourceBudgets.length} bütçe başarıyla kopyalandı!`);
      
      // Force refresh the parent component and switch to target period
      setTimeout(() => {
        onSave();
        // Switch to the target period
        if (onPeriodChange) {
          onPeriodChange(copyToPeriod);
        }
      }, 100);
    } catch (err) {
      console.error('Error copying budgets:', err);
      setError(err instanceof Error ? err.message : 'Bütçeler kopyalanırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipCopy = () => {
    setShowCopyDialog(false);
  };

  const generateAISuggestions = async () => {
    setAiLoading(true);
    setError(null);

    try {
      // Get historical spending data for AI analysis
      const historicalData = await BudgetService.getHistoricalData(userId, 6); // Last 6 months
      
      if (historicalData.length === 0) {
        setError('AI önerileri için yeterli geçmiş veri bulunamadı. En az 2-3 ay veri gerekli.');
        setAiLoading(false);
        return;
      }

      // Simple AI algorithm: Calculate average spending per category
      const categoryAverages: {[key: string]: {total: number, count: number}} = {};
      
      historicalData.forEach((budget: any) => {
        if (budget.category_id && budget.amount) {
          if (!categoryAverages[budget.category_id]) {
            categoryAverages[budget.category_id] = { total: 0, count: 0 };
          }
          categoryAverages[budget.category_id].total += budget.amount;
          categoryAverages[budget.category_id].count += 1;
        }
      });

      // Generate suggestions with confidence scores
      const suggestions = Object.entries(categoryAverages)
        .map(([categoryId, data]) => {
          const average = data.total / data.count;
          const confidence = Math.min(data.count / 3, 1); // Higher confidence for more data points
          
          return {
            category_id: categoryId,
            amount: Math.round(average * 100) / 100, // Round to 2 decimal places
            confidence: confidence
          };
        })
        .filter(suggestion => suggestion.confidence >= 0.3) // Only suggest if we have some confidence
        .sort((a, b) => b.confidence - a.confidence); // Sort by confidence

      setAiSuggestions(suggestions);
      setShowAISuggestions(true);
    } catch (err) {
      console.error('Error generating AI suggestions:', err);
      setError('AI önerileri oluşturulurken hata oluştu');
    } finally {
      setAiLoading(false);
    }
  };

  const applyAISuggestions = async () => {
    if (aiSuggestions.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // Apply AI suggestions to current period
      for (const suggestion of aiSuggestions) {
        const budgetData = {
          user_id: userId,
          category_id: suggestion.category_id,
          amount: suggestion.amount,
          period: period
        };

        // Check if budget already exists for this category
        const existingBudgets = await BudgetService.getBudgetsByPeriod(userId, period);
        const categoryExists = existingBudgets.some(b => b.category_id === suggestion.category_id);

        if (!categoryExists) {
          await BudgetService.createBudget(budgetData);
        }
      }

      setShowAISuggestions(false);
      onSave();
    } catch (err) {
      console.error('Error applying AI suggestions:', err);
      setError('AI önerileri uygulanırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? getCategoryDisplayName(category) : 'Bilinmeyen Kategori';
  };

  if (!isOpen) return null;

  // Show AI suggestions dialog
  if (showAISuggestions && !budget) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              AI Bütçe Önerileri
            </h3>
            <button
              onClick={() => setShowAISuggestions(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Geçmiş verilerinizden öğrenen AI önerileri
              </h4>
              <p className="text-sm text-gray-500 mb-6">
                Son 6 ayın harcama verilerinizi analiz ederek akıllı bütçe önerileri oluşturduk.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {aiSuggestions.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-gray-900">Önerilen Bütçeler</h5>
                  <span className="text-sm text-gray-500">{aiSuggestions.length} kategori</span>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {aiSuggestions.map((suggestion, index) => (
                    <div key={suggestion.category_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {getCategoryName(suggestion.category_id)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Güven: {Math.round(suggestion.confidence * 100)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg text-gray-900">
                          ₺{suggestion.amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          Ortalama tutar
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">AI Nasıl Çalışır?</p>
                      <p>Geçmiş harcama verilerinizi analiz ederek her kategori için ortalama tutarları hesaplar. Daha fazla veri oldukça öneriler daha doğru olur.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500">Henüz yeterli veri yok. 2-3 ay bütçe verisi girdikten sonra AI önerileri alabilirsiniz.</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowAISuggestions(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={loading}
              >
                Geri Dön
              </button>
              {aiSuggestions.length > 0 && (
                <button
                  type="button"
                  onClick={applyAISuggestions}
                  disabled={loading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uygulanıyor...
                    </div>
                  ) : (
                    'Önerileri Uygula'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show copy dialog for new budgets
  if (showCopyDialog && !budget) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-md">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Bütçe Kopyalama
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Hangi aydan kopyalamak istiyorsunuz?
              </h4>
              <p className="text-sm text-gray-500 mb-6">
                Önceki ayların bütçelerini kopyalayarak hızlıca yeni bütçe oluşturabilirsiniz.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kopyalanacak Dönem
                </label>
                <select
                  value={copyFromPeriod}
                  onChange={(e) => {
                    console.log('Selected source period:', e.target.value);
                    setCopyFromPeriod(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Kaynak dönem seçin</option>
                  {availablePeriods.map((periodOption) => (
                    <option key={periodOption.value} value={periodOption.value}>
                      {periodOption.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hedef Dönem
                </label>
                <select
                  value={copyToPeriod}
                  onChange={(e) => {
                    console.log('Selected target period:', e.target.value);
                    setCopyToPeriod(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Hedef dönem seçin</option>
                  {targetPeriods.map((periodOption) => (
                    <option key={periodOption.value} value={periodOption.value}>
                      {periodOption.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 mt-1">
              {availablePeriods.length} dönem seçeneği
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleSkipCopy}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={loading}
              >
                Atlayın
              </button>
              <button
                type="button"
                onClick={handleCopyFromPeriod}
                disabled={loading || !copyFromPeriod || !copyToPeriod}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Kopyalanıyor...
                  </div>
                ) : (
                  'Kopyala ve Devam Et'
                )}
              </button>
            </div>

            {/* AI Suggestions Option */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-3">Veya AI önerileri ile akıllı bütçe oluşturun</p>
                <button
                  type="button"
                  onClick={generateAISuggestions}
                  disabled={aiLoading}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50"
                >
                  {aiLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      AI Analiz Ediyor...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      AI Önerileri Al
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {budget ? 'Bütçe Düzenle' : 'Yeni Bütçe'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Budget Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bütçe Türü
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedType('income')}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  selectedType === 'income'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <DollarSign className="h-5 w-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Gelir</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('expense')}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  selectedType === 'expense'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <DollarSign className="h-5 w-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Gider</span>
              </button>
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Kategori seçin</option>
              {getFilteredCategories().map(category => (
                <option key={category.id} value={category.id}>
                  {getCategoryDisplayName(category)}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tutar (₺)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={amount}
                onChange={(e) => {
                  // Sadece sayı, nokta ve virgül kabul et
                  const value = e.target.value.replace(/[^0-9.,]/g, '');
                  // Virgülü noktaya çevir
                  const normalizedValue = value.replace(',', '.');
                  setAmount(normalizedValue);
                }}
                placeholder="0.00"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama (İsteğe bağlı)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Bütçe açıklaması..."
                rows={3}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
          </div>

          {/* Period Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dönem
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={period}
                disabled
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={loading}
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Kaydediliyor...
                </div>
              ) : (
                budget ? 'Güncelle' : 'Kaydet'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetModal; 