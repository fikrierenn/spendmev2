import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag, ChevronDown, ChevronRight } from 'lucide-react';
import { CategoryService } from '../../services/categoryService';
import { Database } from '../../lib/supabase';
import CategoryModal from '../../components/CategoryModal';
import { useAuth } from '../../contexts/AuthContext';

type Category = Database['public']['Tables']['spendme_categories']['Row'];

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<{ [key: string]: Category[] }>({});
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income'>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Get user from auth context
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (userId) {
      loadCategories();
    }
  }, [userId]);

  const loadCategories = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading categories for user:', userId);
      const allCategories = await CategoryService.getCategories(userId);
      console.log('Fetched categories:', allCategories);
      
      // If no categories exist, initialize default ones
      if (allCategories.length === 0) {
        console.log('No categories found, initializing default categories...');
        await CategoryService.initializeDefaultCategories(userId);
        const newCategories = await CategoryService.getCategories(userId);
        console.log('After initialization:', newCategories);
        setCategories(newCategories);
        
        // Separate main categories and subcategories
        const main = newCategories.filter(cat => cat.parent_id === null);
        const subcats: { [key: string]: Category[] } = {};
        
        newCategories.forEach(cat => {
          if (cat.parent_id) {
            if (!subcats[cat.parent_id]) {
              subcats[cat.parent_id] = [];
            }
            subcats[cat.parent_id].push(cat);
          }
        });

        setMainCategories(main);
        setSubcategories(subcats);
      } else {
        setCategories(allCategories);

        // Separate main categories and subcategories
        const main = allCategories.filter(cat => cat.parent_id === null);
        const subcats: { [key: string]: Category[] } = {};
        
        allCategories.forEach(cat => {
          if (cat.parent_id) {
            if (!subcats[cat.parent_id]) {
              subcats[cat.parent_id] = [];
            }
            subcats[cat.parent_id].push(cat);
          }
        });

        setMainCategories(main);
        setSubcategories(subcats);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
      setError(err instanceof Error ? err.message : 'Kategoriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const filteredMainCategories = mainCategories.filter(category => 
    selectedType === 'all' || category.type === selectedType
  );

  const getTypeColor = (type: string) => {
    return type === 'income' ? 'text-success-600 bg-success-100' : 'text-danger-600 bg-danger-100';
  };

  const getTypeLabel = (type: string) => {
    return type === 'income' ? 'Gelir' : 'Gider';
  };

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        await CategoryService.deleteCategory(categoryId);
        await loadCategories(); // Reload categories
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Kategori silinirken hata oluştu');
      }
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleModalSave = () => {
    loadCategories(); // Reload categories after save
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kategoriler</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gelir ve gider kategorilerinizi yönetin
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Kategoriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kategoriler</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gelir ve gider kategorilerinizi yönetin
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="text-red-400 mb-4">
            <Tag className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Hata oluştu</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={loadCategories}
            className="btn-primary"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kategoriler</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gelir ve gider kategorilerinizi yönetin
          </p>
        </div>
        <button 
          onClick={handleAddCategory}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni Kategori
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            selectedType === 'all'
              ? 'bg-primary-100 text-primary-700'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Tümü
        </button>
        <button
          onClick={() => setSelectedType('expense')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            selectedType === 'expense'
              ? 'bg-danger-100 text-danger-700'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Giderler
        </button>
        <button
          onClick={() => setSelectedType('income')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            selectedType === 'income'
              ? 'bg-success-100 text-success-700'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Gelirler
        </button>
      </div>

      {/* Categories list */}
      <div className="space-y-2">
        {filteredMainCategories.map((category) => (
          <div key={category.id}>
            {/* Main category */}
            <div className="card hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleExpanded(category.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {subcategories[category.id]?.length > 0 ? (
                      expandedCategories.has(category.id) ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )
                    ) : (
                      <div className="w-4 h-4"></div>
                    )}
                  </button>
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(category.type)}`}>
                      {getTypeLabel(category.type)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleEditCategory(category)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Düzenle"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    className="p-1 text-gray-400 hover:text-danger-600"
                    onClick={() => handleDeleteCategory(category.id)}
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {category.is_main && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-500">Ana kategori</span>
                </div>
              )}
            </div>

            {/* Subcategories */}
            {expandedCategories.has(category.id) && subcategories[category.id] && (
              <div className="ml-8 mt-2 space-y-2">
                {subcategories[category.id].map((subcategory) => (
                  <div key={subcategory.id} className="card hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-sm">
                          {subcategory.icon}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{subcategory.name}</h4>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(subcategory.type)}`}>
                            {getTypeLabel(subcategory.type)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleEditCategory(subcategory)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Düzenle"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-1 text-gray-400 hover:text-danger-600"
                          onClick={() => handleDeleteCategory(subcategory.id)}
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredMainCategories.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Tag className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Kategori bulunamadı</h3>
          <p className="text-gray-500">
            Seçili türde kategori bulunamadı.
          </p>
        </div>
      )}

      {/* Category Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        category={editingCategory}
        mainCategories={mainCategories}
        userId={userId || ''}
      />
    </div>
  );
};

export default Categories; 