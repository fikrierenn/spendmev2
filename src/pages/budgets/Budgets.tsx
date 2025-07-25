import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, TrendingUp, Calendar, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { BudgetService } from '../../services/budgetService';
import { CategoryService } from '../../services/categoryService';
import { Database } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import BudgetModal from '../../components/BudgetModal';

type Budget = Database['public']['Tables']['spendme_budgets']['Row'] & {
  category?: {
    name: string;
    icon: string;
    type: 'income' | 'expense';
    parent_id?: string | null;
  };
  description?: string;
};

type CategoryWithSubcategories = Database['public']['Tables']['spendme_categories']['Row'] & {
  subcategories?: CategoryWithSubcategories[];
};

const Budgets: React.FC = () => {
  const { user } = useAuth();
  
  // Temporary: Use the user ID that has budget data
  const effectiveUserId = 'b5318971-add4-48ba-85fb-b856f2bd22ca';
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<CategoryWithSubcategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('2025-07'); // Temmuz 2025'i test edelim
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState<string>('');
  const [periodOptions, setPeriodOptions] = useState<Array<{value: string, label: string}>>([]);

  useEffect(() => {
    if (selectedPeriod) {
      loadData();
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadPeriodOptions();
  }, []);

  // Force refresh when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      loadPeriodOptions();
    }
  }, [isModalOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading budgets for user:', effectiveUserId, 'period:', selectedPeriod);
      
      // Debug: Check all budgets for this user
      const { data: allBudgets, error: allBudgetsError } = await supabase
        .from('spendme_budgets')
        .select('*')
        .eq('user_id', effectiveUserId);
      
      if (allBudgetsError) {
        console.error('Error fetching all budgets:', allBudgetsError);
      } else {
        console.log('ALL BUDGETS FOR USER:', allBudgets);
        console.log('Total budget count:', allBudgets?.length || 0);
      }
      
      const [budgetsData, categoriesData] = await Promise.all([
        BudgetService.getBudgetsByPeriod(effectiveUserId, selectedPeriod),
        CategoryService.getCategoryWithSubcategories(effectiveUserId)
      ]);
      
      console.log('Raw budgets loaded:', budgetsData);
      console.log('Categories loaded:', categoriesData);
      
      // Clean and deduplicate budgets
      const cleanedBudgets = BudgetService.cleanBudgets(budgetsData);
      console.log('Cleaned budgets:', cleanedBudgets);
      
      setBudgets(cleanedBudgets);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBudget = () => {
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };



  const handleSaveBudget = async () => {
    await loadData();
    await loadPeriodOptions(); // Dönem seçeneklerini de yenile
    setIsModalOpen(false);
    setEditingBudget(null);
  };

  const handleInlineEdit = (categoryId: string, currentAmount: number) => {
    setEditingCategoryId(categoryId);
    setEditingAmount(currentAmount.toString());
  };

  const handleInlineSave = async (categoryId: string) => {
    const amount = parseFloat(editingAmount);
    
    if (isNaN(amount) || amount < 0) {
      setEditingCategoryId(null);
      setEditingAmount('');
      return;
    }

    // Save current scroll position
    const scrollPosition = window.scrollY;

    try {
      // Find existing budget for this category
      const existingBudget = budgets.find(b => b.category_id === categoryId);
      
      if (amount === 0) {
        // Delete budget if amount is 0
        if (existingBudget) {
          await BudgetService.deleteBudget(existingBudget.id);
        }
      } else {
        // Update or create budget
        const budgetData = {
          user_id: effectiveUserId,
          category_id: categoryId,
          amount: amount,
          period: selectedPeriod
        };

        if (existingBudget) {
          await BudgetService.updateBudget(existingBudget.id, budgetData);
        } else {
          await BudgetService.createBudget(budgetData);
        }
      }

      // Update local state instead of reloading all data
      if (amount === 0) {
        // Remove budget from local state
        setBudgets(prevBudgets => prevBudgets.filter(b => b.category_id !== categoryId));
      } else {
        // Update or add budget in local state
        setBudgets(prevBudgets => {
          const existingIndex = prevBudgets.findIndex(b => b.category_id === categoryId);

          if (existingIndex >= 0) {
            // Update existing budget
            const newBudgets = [...prevBudgets];
            newBudgets[existingIndex] = {
              ...newBudgets[existingIndex],
              amount: amount
            };
            return newBudgets;
          } else {
            // Add new budget - we need to reload data for new budgets since we don't have the ID
            setTimeout(() => loadData(), 100);
            return prevBudgets;
          }
        });
      }

      // Restore scroll position after state update
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 0);
    } catch (err) {
      console.error('Error saving inline budget:', err);
      // If error occurs, reload data to ensure consistency
      await loadData();
    } finally {
      setEditingCategoryId(null);
      setEditingAmount('');
    }
  };

  const handleInlineCancel = () => {
    setEditingCategoryId(null);
    setEditingAmount('');
  };

  const handleDeleteBudget = async (categoryId: string) => {
    if (!window.confirm('Bu bütçeyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      // Find existing budget for this category
      const existingBudget = budgets.find(b => b.category_id === categoryId);
      
      if (existingBudget) {
        await BudgetService.deleteBudget(existingBudget.id);
        console.log('Budget deleted for category:', categoryId);
        await loadData();
      }
    } catch (err) {
      console.error('Error deleting budget:', err);
      alert('Bütçe silinirken hata oluştu');
    }
  };

  const handleDeleteAllBudgets = async () => {
    const periodLabel = getPeriodLabel(selectedPeriod);
    const budgetCount = budgets.length;
    
    if (!window.confirm(`${periodLabel} dönemindeki ${budgetCount} bütçeyi silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz!`)) {
      return;
    }

    try {
      console.log('Deleting all budgets for period:', selectedPeriod);
      
      // Delete all budgets for the current period
      for (const budget of budgets) {
        await BudgetService.deleteBudget(budget.id);
        console.log('Deleted budget:', budget.id);
      }

      console.log('All budgets deleted successfully');
      alert(`${periodLabel} dönemindeki tüm bütçeler başarıyla silindi!`);
      
      // Reload data and period options
      await loadData();
      await loadPeriodOptions();
    } catch (err) {
      console.error('Error deleting all budgets:', err);
      alert('Bütçeler silinirken hata oluştu');
    }
  };



  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getPeriodLabel = (period: string) => {
    const [year, month] = period.split('-');
    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const loadPeriodOptions = async () => {
    try {
      console.log('Loading period options for user:', effectiveUserId);
      
      // Get all periods that have budget data
      const { data: periodsData, error } = await supabase
        .from('spendme_budgets')
        .select('period')
        .eq('user_id', effectiveUserId)
        .order('period', { ascending: false });

      if (error) {
        console.error('Error fetching periods:', error);
        return;
      }

      console.log('Raw periods data:', periodsData);

      // Get unique periods and create options
      const uniquePeriods = Array.from(new Set(periodsData?.map((p: any) => p.period) || []));
      
      const periods = uniquePeriods.map((period: any) => ({
        value: period,
        label: getPeriodLabel(period)
      }));

      console.log('Available periods with budgets:', periods);
      console.log('Setting period options:', periods);
      console.log('Period options count:', periods.length);
      
      // Only set periods that actually have budget data
      if (periods.length > 0) {
        setPeriodOptions(periods);
      } else {
        console.log('No periods with budget data found');
        setPeriodOptions([]);
      }
    } catch (err) {
      console.error('Error loading period options:', err);
    }
  };

  const getTotalBudget = (type?: 'income' | 'expense') => {
    if (type) {
      return budgets
        .filter(budget => budget.category?.type === type)
        .reduce((total, budget) => total + (budget.amount || 0), 0);
    }
    return budgets.reduce((total, budget) => total + (budget.amount || 0), 0);
  };

  const getBudgetsByCategory = (categoryId: string) => {
    const filteredBudgets = budgets.filter(budget => budget.category_id === categoryId);
    return filteredBudgets;
  };

  const getCategoryTotal = (categoryId: string) => {
    // Get budgets for this category
    const categoryBudgets = getBudgetsByCategory(categoryId);
    const categoryTotal = categoryBudgets.reduce((total, budget) => total + (budget.amount || 0), 0);
    
    // Find subcategories and add their totals
    const category = categories.find(cat => cat.id === categoryId);
    if (category?.subcategories) {
      const subcategoryTotal = category.subcategories.reduce((total, subcategory) => {
        const subcategoryBudgets = getBudgetsByCategory(subcategory.id);
        return total + subcategoryBudgets.reduce((sum, budget) => sum + (budget.amount || 0), 0);
      }, 0);
      
      return categoryTotal + subcategoryTotal;
    }
    
    return categoryTotal;
  };

  const getCategoryWithBudgetCount = (category: CategoryWithSubcategories) => {
    if (!category.subcategories) return 0;
    
    return category.subcategories.filter(subcategory => {
      const subcategoryBudgets = getBudgetsByCategory(subcategory.id);
      return subcategoryBudgets.length > 0;
    }).length;
  };

  const getCategoryTotalWithoutSubcategories = (categoryId: string) => {
    const categoryBudgets = getBudgetsByCategory(categoryId);
    const total = categoryBudgets.reduce((total, budget) => total + (budget.amount || 0), 0);
    return total;
  };



  const renderCategorySection = (type: 'income' | 'expense') => {
    const typeCategories = categories.filter(cat => cat.type === type);
    
    if (typeCategories.length === 0) return null;

    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              type === 'income' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <DollarSign className={`h-6 w-6 ${
                type === 'income' ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {type === 'income' ? 'Gelir' : 'Gider'} Kategorileri
              </h3>
              <p className="text-sm text-gray-500">
                Toplam: {getTotalBudget(type).toLocaleString('tr-TR')} ₺
              </p>
            </div>
          </div>

        </div>

        <div className="space-y-4">
          {typeCategories.map(category => {
            const categoryBudgets = getBudgetsByCategory(category.id);
            const hasSubcategories = category.subcategories && category.subcategories.length > 0;
            const isExpanded = expandedCategories.has(category.id);
            
            return (
              <div key={category.id} className="border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between p-4 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    {hasSubcategories && (
                      <button
                        onClick={() => toggleCategoryExpansion(category.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                      {category.icon ? (
                        <span className="text-sm">{category.icon}</span>
                      ) : (
                        <DollarSign className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                      <p className="text-sm text-gray-500">
                        {getCategoryWithBudgetCount(category)} alt kategori • {getCategoryTotal(category.id).toLocaleString('tr-TR')} ₺
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {editingCategoryId === category.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editingAmount}
                          onChange={(e) => {
                            // Sadece sayı, nokta ve virgül kabul et
                            const value = e.target.value.replace(/[^0-9.,]/g, '');
                            // Virgülü noktaya çevir
                            const normalizedValue = value.replace(',', '.');
                            setEditingAmount(normalizedValue);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleInlineSave(category.id);
                            } else if (e.key === 'Escape') {
                              handleInlineCancel();
                            }
                          }}
                          onBlur={() => handleInlineSave(category.id)}
                          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                          autoFocus
                        />
                        <span className="text-sm text-gray-500">₺</span>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleInlineEdit(category.id, getCategoryTotalWithoutSubcategories(category.id))}
                          className="text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                        >
                          {getCategoryTotalWithoutSubcategories(category.id).toLocaleString('tr-TR')} ₺
                        </button>

                      </>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-3">


                                         {/* Subcategories */}
                     {hasSubcategories && category.subcategories?.map((subcategory: CategoryWithSubcategories) => (
                        <div key={subcategory.id} className="ml-4 border-l-2 border-gray-200 pl-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                                {subcategory.icon ? (
                                  <span className="text-xs">{subcategory.icon}</span>
                                ) : (
                                  <DollarSign className="h-3 w-3 text-gray-600" />
                                )}
                              </div>
                              <h6 className="text-sm font-medium text-gray-800">{subcategory.name}</h6>
                            </div>
                            <div className="flex items-center space-x-2">
                              {editingCategoryId === subcategory.id ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={editingAmount}
                                    onChange={(e) => {
                                      // Sadece sayı, nokta ve virgül kabul et
                                      const value = e.target.value.replace(/[^0-9.,]/g, '');
                                      // Virgülü noktaya çevir
                                      const normalizedValue = value.replace(',', '.');
                                      setEditingAmount(normalizedValue);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleInlineSave(subcategory.id);
                                      } else if (e.key === 'Escape') {
                                        handleInlineCancel();
                                      }
                                    }}
                                    onBlur={() => handleInlineSave(subcategory.id)}
                                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    autoFocus
                                  />
                                  <span className="text-sm text-gray-500">₺</span>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleInlineEdit(subcategory.id, getCategoryTotal(subcategory.id))}
                                    className="text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                  >
                                    {getCategoryTotal(subcategory.id).toLocaleString('tr-TR')} ₺
                                  </button>

                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bütçeler</h1>
          <p className="mt-1 text-sm text-gray-500">
            Aylık harcama bütçelerinizi yönetin
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {budgets.length > 0 && (
            <button 
              className="btn-danger"
              onClick={() => handleDeleteAllBudgets()}
              title="Tüm bütçeleri sil"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Tümünü Sil
            </button>
          )}
          <button 
            className="btn-primary"
            onClick={handleAddBudget}
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Bütçe
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Period selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Dönem:</label>
                  <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[200px]"
        >
          {periodOptions.length > 0 ? (
            periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          ) : (
            <option value="">Bütçe bulunamadı</option>
          )}
        </select>
        </div>
        <div className="text-sm text-gray-500">
          {budgets.length} bütçe kaydı
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Toplam Bütçe</p>
              <p className="text-2xl font-bold text-gray-900">
                {getTotalBudget().toLocaleString('tr-TR')} ₺
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Gelir Bütçesi</p>
              <p className="text-2xl font-bold text-green-600">
                {getTotalBudget('income').toLocaleString('tr-TR')} ₺
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Gider Bütçesi</p>
              <p className="text-2xl font-bold text-red-600">
                {getTotalBudget('expense').toLocaleString('tr-TR')} ₺
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-info-100 rounded-lg">
              <Calendar className="h-6 w-6 text-info-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Seçili Dönem</p>
              <p className="text-2xl font-bold text-gray-900">
                {getPeriodLabel(selectedPeriod)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget sections by type */}
      <div className="space-y-6">
        {renderCategorySection('income')}
        {renderCategorySection('expense')}
      </div>

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBudget(null);
        }}
        onSave={handleSaveBudget}
        budget={editingBudget}
        userId={effectiveUserId}
        period={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />
    </div>
  );
};

export default Budgets; 