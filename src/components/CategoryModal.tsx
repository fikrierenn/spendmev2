import React, { useState, useEffect } from 'react';
import { X, Save, Plus } from 'lucide-react';
import { CategoryService } from '../services/categoryService';
import { Database } from '../lib/supabase';
import IconPicker from './forms/IconPicker';

type Category = Database['public']['Tables']['spendme_categories']['Row'];
type CategoryInsert = Database['public']['Tables']['spendme_categories']['Insert'];

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  category?: Category | null;
  mainCategories: Category[];
  userId: string;
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  category,
  mainCategories,
  userId
}) => {
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    type: 'expense' as 'expense' | 'income',
    is_main: false,
    parent_id: '' as string | null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!category;

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        icon: category.icon || '',
        type: category.type as 'expense' | 'income',
        is_main: category.is_main || false,
        parent_id: category.parent_id
      });
    } else {
      setFormData({
        name: '',
        icon: '',
        type: 'expense',
        is_main: false,
        parent_id: null
      });
    }
    setError(null);
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Kategori adı gereklidir');
      return;
    }

    if (!formData.icon.trim()) {
      setError('Kategori ikonu gereklidir');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const categoryData: CategoryInsert = {
        name: formData.name.trim(),
        icon: formData.icon.trim(),
        type: formData.type,
        is_main: formData.is_main,
        parent_id: formData.is_main ? null : formData.parent_id,
        user_id: userId
      };

      if (isEditing && category) {
        await CategoryService.updateCategory(category.id, categoryData);
      } else {
        await CategoryService.createCategory(categoryData);
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kategori kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {isEditing ? 'Kategori Düzenle' : 'Yeni Kategori'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 -mr-1"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori Adı *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Örn: Market"
              maxLength={50}
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İkon *
            </label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => handleInputChange('icon', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Örn: 🛒"
              maxLength={10}
            />
            <p className="text-xs text-gray-500 mt-1">
              Emoji veya ikon kullanabilirsiniz
            </p>
            <div className="mt-2">
              <IconPicker value={formData.icon} onChange={(icon) => handleInputChange('icon', icon)} />
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tür
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="expense"
                  checked={formData.type === 'expense'}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Gider</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="income"
                  checked={formData.type === 'income'}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Gelir</span>
              </label>
            </div>
          </div>

          {/* Is Main Category */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_main}
                onChange={(e) => handleInputChange('is_main', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Ana kategori
              </span>
            </label>
          </div>

          {/* Parent Category */}
          {!formData.is_main && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Üst Kategori
              </label>
              <select
                value={formData.parent_id || ''}
                onChange={(e) => handleInputChange('parent_id', e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Ana kategori seçin</option>
                {mainCategories
                  .filter(cat => cat.type === formData.type)
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 sm:py-2 text-gray-700 bg-gray-100 rounded-lg sm:rounded-md hover:bg-gray-200 transition-colors text-base sm:text-sm font-medium"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 sm:py-2 bg-primary-600 text-white rounded-lg sm:rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-base sm:text-sm font-medium"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  {isEditing ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  {isEditing ? 'Kaydet' : 'Ekle'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal; 