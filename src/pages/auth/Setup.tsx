import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Check, Plus, Copy, ArrowRight, Star, FolderOpen, Folder } from 'lucide-react';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'income' | 'expense';
  is_main: boolean;
  user_id: string;
  parent_id?: string | null;
}

interface Account {
  id: string;
  name: string;
  type: string;
  icon: string;
  user_id: string;
}

const Setup: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Kategori hiyerarşisi tercihi
  const [wantsSubcategories, setWantsSubcategories] = useState<boolean | null>(null);
  
  // Seçimler
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  
  // Veriler
  const [popularCategories, setPopularCategories] = useState<Category[]>([]);
  const [popularAccounts, setPopularAccounts] = useState<Account[]>([]);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [customAccounts, setCustomAccounts] = useState<Account[]>([]);
  
  // Alt kategoriler
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);

  // Yeni kategori/hesap formları
  const [newCategory, setNewCategory] = useState({ name: '', icon: '📁', type: 'expense' as 'income' | 'expense' });
  const [newAccount, setNewAccount] = useState({ name: '', type: 'cash', icon: '💳' });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadPopularData();
  }, [user, navigate]);

  const loadPopularData = async () => {
    try {
      console.log('🔄 Popüler veriler yükleniyor...');
      
      // Ana kategorileri yükle (parent_id null olanlar ve sadece unique isimler)
      const { data: categories } = await supabase
        .from('spendme_categories')
        .select('*')
        .is('parent_id', null)
        .order('name');

      if (categories) {
        console.log('📊 Yüklenen kategoriler:', categories.length);
        
        // Duplicate kategori kontrolü - aynı isimde kategorileri filtrele
        const uniqueCategories = categories.filter((category, index, self) => 
          index === self.findIndex(c => c.name === category.name && c.type === category.type)
        );
        
        console.log('✅ Unique kategoriler:', uniqueCategories.length);
        setPopularCategories(uniqueCategories);
      }

      // Popüler hesapları yükle (duplicate kontrolü için)
      const { data: accounts } = await supabase
        .from('spendme_accounts')
        .select('*')
        .order('name');

      if (accounts) {
        console.log('🏦 Yüklenen hesaplar:', accounts.length);
        
        // Duplicate kontrolü - aynı isimde hesapları filtrele
        const uniqueAccounts = accounts.filter((account, index, self) => 
          index === self.findIndex(a => a.name === account.name && a.type === account.type)
        );
        
        console.log('✅ Unique hesaplar:', uniqueAccounts.length);
        setPopularAccounts(uniqueAccounts);
      }
    } catch (error) {
      console.error('❌ Error loading popular data:', error);
    }
  };

  // Alt kategorileri yükle
  const loadSubcategories = async (parentCategoryIds: string[]) => {
    try {
      console.log('🔄 Alt kategoriler yükleniyor...');
      
      const { data: subcats } = await supabase
        .from('spendme_categories')
        .select('*')
        .in('parent_id', parentCategoryIds)
        .order('name');

      if (subcats) {
        console.log('📊 Yüklenen alt kategoriler:', subcats.length);
        setSubcategories(subcats);
      }
    } catch (error) {
      console.error('❌ Error loading subcategories:', error);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => {
      const newSelection = prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId];
      
      // Alt kategori istiyorsa, seçilen ana kategorilerin alt kategorilerini yükle
      if (wantsSubcategories) {
        loadSubcategories(newSelection);
      }
      
      return newSelection;
    });
  };

  const handleSubcategoryToggle = (subcategoryId: string) => {
    setSelectedSubcategories(prev => 
      prev.includes(subcategoryId) 
        ? prev.filter(id => id !== subcategoryId)
        : [...prev, subcategoryId]
    );
  };

  const handleAccountToggle = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const addCustomCategory = () => {
    if (!newCategory.name.trim()) {
      toast.error('Kategori adı gerekli!');
      return;
    }

    const category: Category = {
      id: crypto.randomUUID(), // UUID formatında yeni ID
      name: newCategory.name,
      icon: newCategory.icon,
      type: newCategory.type,
      is_main: true,
      user_id: user!.id
    };

    setCustomCategories(prev => [...prev, category]);
    setSelectedCategories(prev => [...prev, category.id]);
    setNewCategory({ name: '', icon: '📁', type: 'expense' });
  };

  const addCustomAccount = () => {
    if (!newAccount.name.trim()) {
      toast.error('Hesap adı gerekli!');
      return;
    }

    const account: Account = {
      id: crypto.randomUUID(), // UUID formatında yeni ID
      name: newAccount.name,
      type: newAccount.type,
      icon: newAccount.icon,
      user_id: user!.id
    };

    setCustomAccounts(prev => [...prev, account]);
    setSelectedAccounts(prev => [...prev, account.id]);
    setNewAccount({ name: '', type: 'cash', icon: '💳' });
  };

  const copyFromUser = async (userId: string) => {
    try {
      setLoading(true);
      console.log('📋 Kullanıcıdan kopyalama başlatılıyor:', userId);
      
      // Mevcut seçimleri al
      const currentCategories = [
        ...popularCategories.filter(c => selectedCategories.includes(c.id)),
        ...customCategories.filter(c => selectedCategories.includes(c.id))
      ];
      
      const currentAccounts = [
        ...popularAccounts.filter(a => selectedAccounts.includes(a.id)),
        ...customAccounts.filter(a => selectedAccounts.includes(a.id))
      ];

      // Kategorileri kopyala - İlişkileri koruyarak
      let categoriesToCopy: Category[] = [];
      if (wantsSubcategories) {
        // Seçilen ana kategorileri ve onların alt kategorilerini al
        const selectedCategoryIds = selectedCategories.join(',');
        
        // Önce seçilen ana kategorileri al
        const { data: mainCategories } = await supabase
          .from('spendme_categories')
          .select('*')
          .eq('user_id', userId)
          .in('id', selectedCategories);
        
        // Sonra bu ana kategorilerin alt kategorilerini al
        const { data: subCategories } = await supabase
          .from('spendme_categories')
          .select('*')
          .eq('user_id', userId)
          .in('parent_id', selectedCategories);
        
        // Ana kategoriler ve alt kategorileri birleştir
        categoriesToCopy = [
          ...(mainCategories || []),
          ...(subCategories || [])
        ];
        
        console.log('📊 Ana kategoriler:', mainCategories?.length || 0);
        console.log('📊 Alt kategoriler:', subCategories?.length || 0);
        console.log('📊 Toplam kopyalanacak:', categoriesToCopy.length);
        
      } else {
        // Sadece ana kategoriler
        const { data: categories } = await supabase
          .from('spendme_categories')
          .select('*')
          .eq('user_id', userId)
          .is('parent_id', null);
        
        categoriesToCopy = categories || [];
      }

      if (categoriesToCopy.length > 0) {
        console.log('📊 Kopyalanacak kategoriler:', categoriesToCopy.length);
        
        // Mevcut kategorileri kontrol et
        const { data: existingCategories } = await supabase
          .from('spendme_categories')
          .select('name, type, parent_id')
          .eq('user_id', user!.id);

        // Duplicate olmayan kategorileri filtrele
        const uniqueCategories = categoriesToCopy.filter(cat => 
          !existingCategories?.some(existing => 
            existing.name === cat.name && 
            existing.type === cat.type &&
            existing.parent_id === cat.parent_id
          )
        );

        console.log('✅ Unique kategoriler:', uniqueCategories.length);

        // İlişkileri koruyarak kategorileri kopyala
        const idMapping = new Map<string, string>();
        
        // Ana kategorileri ve alt kategorileri ayır
        const mainCategories = uniqueCategories.filter(cat => !cat.parent_id);
        const subCategories = uniqueCategories.filter(cat => cat.parent_id);
        
        console.log('🏗️ Ana kategoriler kopyalanıyor:', mainCategories.length);
        console.log('📋 Alt kategoriler kopyalanıyor:', subCategories.length);
        
        // 1. ADIM: Ana kategorileri kopyala ve ID mapping'i oluştur
        const newMainCategories = mainCategories.map(cat => {
          const newId = crypto.randomUUID(); // UUID formatında yeni ID
          idMapping.set(cat.id, newId); // Eski ID → Yeni ID mapping'i
          
          return {
            ...cat,
            id: newId,
            user_id: user!.id,
            parent_id: null // Ana kategoriler için parent_id null
          };
        });
        
        console.log('✅ Ana kategoriler kopyalandı, ID mapping:', Object.fromEntries(idMapping));
        
        // 2. ADIM: Alt kategorileri kopyala ve parent_id'leri yeni ana kategori ID'leri ile güncelle
        const newSubCategories = subCategories.map(cat => {
          const newId = crypto.randomUUID(); // UUID formatında yeni ID
          idMapping.set(cat.id, newId); // Alt kategori için de ID mapping
          
          // Parent'ının yeni ID'sini mapping'den al
          const newParentId = idMapping.get(cat.parent_id!);
          
          if (!newParentId) {
            console.warn('⚠️ Parent ID bulunamadı:', cat.parent_id, 'Kategori:', cat.name);
          }
          
          return {
            ...cat,
            id: newId,
            user_id: user!.id,
            parent_id: newParentId || null // Yeni parent ID'si
          };
        });
        
        // 3. ADIM: Tüm kategorileri birleştir
        const newCategories = [...newMainCategories, ...newSubCategories];
        
        console.log('🔗 Final ID mapping (eski → yeni):', Object.fromEntries(idMapping));
        console.log('📊 Yeni ana kategoriler:', newMainCategories.length);
        console.log('📊 Yeni alt kategoriler:', newSubCategories.length);
        console.log('📊 Toplam yeni kategoriler:', newCategories.length);
        
        // 4. ADIM: Parent-child ilişkilerini kontrol et
        newCategories.forEach(cat => {
          if (cat.parent_id) {
            const parentExists = newCategories.some(c => c.id === cat.parent_id);
            if (!parentExists) {
              console.warn('⚠️ Parent bulunamadı:', cat.name, 'Parent ID:', cat.parent_id);
            }
          }
        });
        
        setCustomCategories(prev => [...prev, ...newCategories]);
        setSelectedCategories(prev => [...prev, ...newCategories.map(c => c.id)]);
      }

      // Hesapları kopyala
      const { data: accounts } = await supabase
        .from('spendme_accounts')
        .select('*')
        .eq('user_id', userId);

      if (accounts) {
        console.log('🏦 Kopyalanacak hesaplar:', accounts.length);
        
        // Mevcut hesapları kontrol et
        const { data: existingAccounts } = await supabase
          .from('spendme_accounts')
          .select('name, type')
          .eq('user_id', user!.id);

        // Duplicate olmayan hesapları filtrele
        const uniqueAccounts = accounts.filter(acc => 
          !existingAccounts?.some(existing => 
            existing.name === acc.name && existing.type === acc.type
          )
        );

        console.log('✅ Unique hesaplar:', uniqueAccounts.length);

        const newAccounts = uniqueAccounts.map(acc => ({
          ...acc,
          id: crypto.randomUUID(), // UUID formatında yeni ID
          user_id: user!.id
        }));
        
        setCustomAccounts(prev => [...prev, ...newAccounts]);
        setSelectedAccounts(prev => [...prev, ...newAccounts.map(a => a.id)]);
      }

      toast.success('Kategoriler ve hesaplar kopyalandı!');
    } catch (error) {
      console.error('❌ Error copying data:', error);
      toast.error('Kopyalama sırasında hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  const saveSetup = async () => {
    if (wantsSubcategories === null) {
      toast.error('Kategori hiyerarşisi tercihini seçmelisiniz!');
      return;
    }

    if (selectedCategories.length === 0) {
      toast.error('En az bir kategori seçmelisiniz!');
      return;
    }

    if (selectedAccounts.length === 0) {
      toast.error('En az bir hesap seçmelisiniz!');
      return;
    }

    try {
      setLoading(true);
      console.log('💾 Setup kaydediliyor...');

      // Seçili kategorileri ve hesapları hazırla
      const categoriesToSave = [
        ...popularCategories.filter(c => selectedCategories.includes(c.id)),
        ...customCategories.filter(c => selectedCategories.includes(c.id))
      ];

      // Alt kategorileri de ekle (eğer seçildiyse)
      if (wantsSubcategories && selectedSubcategories.length > 0) {
        const subcategoriesToSave = subcategories.filter(s => selectedSubcategories.includes(s.id));
        categoriesToSave.push(...subcategoriesToSave);
      }

      const accountsToSave = [
        ...popularAccounts.filter(a => selectedAccounts.includes(a.id)),
        ...customAccounts.filter(a => selectedAccounts.includes(a.id))
      ];

      console.log('📊 Kaydedilecek kategoriler:', categoriesToSave.length);
      console.log('🏦 Kaydedilecek hesaplar:', accountsToSave.length);

      // Mevcut kategorileri kontrol et (duplicate önlemek için)
      const { data: existingCategories } = await supabase
        .from('spendme_categories')
        .select('name, type, parent_id')
        .eq('user_id', user!.id);

      // Mevcut hesapları kontrol et (duplicate önlemek için)
      const { data: existingAccounts } = await supabase
        .from('spendme_accounts')
        .select('name, type')
        .eq('user_id', user!.id);

      // Duplicate olmayan kategorileri filtrele
      const newCategories = categoriesToSave.filter(cat => 
        !existingCategories?.some(existing => 
          existing.name === cat.name && 
          existing.type === cat.type &&
          existing.parent_id === cat.parent_id
        )
      );

      // Duplicate olmayan hesapları filtrele
      const newAccounts = accountsToSave.filter(acc => 
        !existingAccounts?.some(existing => 
          existing.name === acc.name && existing.type === acc.type
        )
      );

      console.log('✅ Yeni kategoriler:', newCategories.length);
      console.log('✅ Yeni hesaplar:', newAccounts.length);

      // Kategorileri kaydet
      if (newCategories.length > 0) {
        const categoriesToInsert = newCategories.map(cat => ({
          name: cat.name,
          icon: cat.icon,
          type: cat.type,
          is_main: cat.parent_id ? false : true, // Alt kategori ise is_main false
          user_id: user!.id,
          parent_id: cat.parent_id || null
        }));

        const { error: catError } = await supabase
          .from('spendme_categories')
          .insert(categoriesToInsert);

        if (catError) {
          console.error('❌ Kategori kaydetme hatası:', catError);
          throw catError;
        }
      }

      // Hesapları kaydet
      if (newAccounts.length > 0) {
        const accountsToInsert = newAccounts.map(acc => ({
          name: acc.name,
          type: acc.type,
          icon: acc.icon,
          user_id: user!.id
        }));

        const { error: accError } = await supabase
          .from('spendme_accounts')
          .insert(accountsToInsert);

        if (accError) {
          console.error('❌ Hesap kaydetme hatası:', accError);
          throw accError;
        }
      }

      // Kullanıcı profili oluştur (eğer yoksa)
      try {
        const { data: existingProfile } = await supabase
          .from('spendme_user_profiles')
          .select('*')
          .eq('user_id', user!.id)
          .single();

        if (!existingProfile) {
          const { error: profileError } = await supabase
            .from('spendme_user_profiles')
            .insert({
              user_id: user!.id,
              first_name: '',
              last_name: '',
              phone: '',
              location: '',
              email_notifications: true,
              push_notifications: true,
              budget_alerts: true,
              transaction_reminders: true,
              weekly_reports: false,
              monthly_reports: false,
              security_alerts: true,
              marketing_emails: false
            });

          if (profileError) {
            console.error('❌ Profile creation error:', profileError);
          } else {
            console.log('✅ User profile created successfully');
          }
        }
      } catch (profileException) {
        console.error('💥 Profile creation exception:', profileException);
      }

      toast.success('Kurulum tamamlandı!');
      await refreshUserProfile();
      navigate('/dashboard');
    } catch (error) {
      console.error('❌ Error saving setup:', error);
      toast.error('Kurulum sırasında hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Kategorilerinizi Seçin
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Harcamalarınızı takip etmek için kategoriler seçin
        </p>
      </div>

      {/* Kategori Hiyerarşisi Tercihi */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Kategori Hiyerarşisi Tercihi
        </h3>
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="radio"
            id="subcategories-yes"
            name="wantsSubcategories"
            value="true"
            checked={wantsSubcategories === true}
            onChange={() => setWantsSubcategories(true)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-blue-600"
          />
          <label htmlFor="subcategories-yes" className="text-sm text-gray-700 dark:text-gray-300">
            Alt kategorileri de seçebilirim
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id="subcategories-no"
            name="wantsSubcategories"
            value="false"
            checked={wantsSubcategories === false}
            onChange={() => setWantsSubcategories(false)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-blue-600"
          />
          <label htmlFor="subcategories-no" className="text-sm text-gray-700 dark:text-gray-300">
            Sadece ana kategorileri seçebilirim
          </label>
        </div>
      </div>

      {/* Popüler Kategoriler */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Popüler Kategoriler
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {popularCategories.map(category => (
            <button
              key={category.id}
              onClick={() => handleCategoryToggle(category.id)}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedCategories.includes(category.id)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{category.icon}</span>
                <span className="text-sm font-medium">{category.name}</span>
                {selectedCategories.includes(category.id) && (
                  <Check className="h-4 w-4 text-blue-500" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Özel Kategori Ekleme */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Özel Kategori Ekle
        </h3>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Kategori adı"
            value={newCategory.name}
            onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <select
            value={newCategory.type}
            onChange={(e) => setNewCategory(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="expense">Gider</option>
            <option value="income">Gelir</option>
          </select>
          <button
            onClick={addCustomCategory}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Özel Kategoriler */}
      {customCategories.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Özel Kategorileriniz
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {customCategories.map(category => (
              <button
                key={category.id}
                onClick={() => handleCategoryToggle(category.id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedCategories.includes(category.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{category.icon}</span>
                  <span className="text-sm font-medium">{category.name}</span>
                  {selectedCategories.includes(category.id) && (
                    <Check className="h-4 w-4 text-blue-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Alt Kategoriler */}
      {wantsSubcategories && subcategories.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Alt Kategorileriniz
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {subcategories.map(subcategory => (
              <button
                key={subcategory.id}
                onClick={() => handleSubcategoryToggle(subcategory.id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedSubcategories.includes(subcategory.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Folder className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">{subcategory.name}</span>
                  {selectedSubcategories.includes(subcategory.id) && (
                    <Check className="h-4 w-4 text-blue-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => setStep(2)}
          disabled={wantsSubcategories === null || selectedCategories.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Devam Et <ArrowRight className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Hesaplarınızı Seçin
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Finansal hesaplarınızı ekleyin
        </p>
      </div>

      {/* Popüler Hesaplar */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Popüler Hesaplar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {popularAccounts.map(account => (
            <button
              key={account.id}
              onClick={() => handleAccountToggle(account.id)}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedAccounts.includes(account.id)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{account.icon}</span>
                <span className="text-sm font-medium">{account.name}</span>
                {selectedAccounts.includes(account.id) && (
                  <Check className="h-4 w-4 text-blue-500" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Özel Hesap Ekleme */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Özel Hesap Ekle
        </h3>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Hesap adı"
            value={newAccount.name}
            onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <select
            value={newAccount.type}
            onChange={(e) => setNewAccount(prev => ({ ...prev, type: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="cash">Nakit</option>
            <option value="bank">Banka</option>
            <option value="credit_card">Kredi Kartı</option>
            <option value="wallet">Cüzdan</option>
          </select>
          <button
            onClick={addCustomAccount}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Özel Hesaplar */}
      {customAccounts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Özel Hesaplarınız
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {customAccounts.map(account => (
              <button
                key={account.id}
                onClick={() => handleAccountToggle(account.id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedAccounts.includes(account.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{account.icon}</span>
                  <span className="text-sm font-medium">{account.name}</span>
                  {selectedAccounts.includes(account.id) && (
                    <Check className="h-4 w-4 text-blue-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => setStep(1)}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Geri
        </button>
        <button
          onClick={() => setStep(3)}
          disabled={selectedAccounts.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Devam Et <ArrowRight className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Diğer Kullanıcılardan Öneriler
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Deneyimli kullanıcıların kategorilerini kopyalayabilirsiniz
        </p>
      </div>

      {/* Seçilen Kategoriler Özeti */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Seçilen Kategorileriniz ({selectedCategories.length + selectedSubcategories.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map(catId => {
            const category = [...popularCategories, ...customCategories].find(c => c.id === catId);
            return category ? (
              <span key={catId} className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded">
                {category.icon} {category.name}
              </span>
            ) : null;
          })}
          {selectedSubcategories.map(subId => {
            const subcategory = subcategories.find(s => s.id === subId);
            return subcategory ? (
              <span key={subId} className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded">
                📁 {subcategory.name}
              </span>
            ) : null;
          })}
        </div>
      </div>

      {/* Önerilen Kullanıcılar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <Star className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Fikri Eren</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Deneyimli kullanıcı - Detaylı kategori yapısı
          </p>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            <strong>Kategoriler:</strong> Faturalar, Market, Sağlık, Ulaşım, Yemek, Konut, Yatırım, Gelir
          </div>
          <button
            onClick={() => copyFromUser('b5318971-add4-48ba-85fb-b856f2bd22ca')}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Copy className="h-4 w-4 inline mr-2" />
            Eksik Kategorileri Tamamla
          </button>
        </div>

        <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <Star className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Demo Kullanıcı</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Başlangıç için ideal - Temel kategoriler
          </p>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            <strong>Kategoriler:</strong> Market, Sağlık, Ulaşım, Faturalar, Gelir, Eğlence
          </div>
          <button
            onClick={() => copyFromUser('d5827f42-3f56-4454-a65f-569965fe4000')}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Copy className="h-4 w-4 inline mr-2" />
            Eksik Kategorileri Tamamla
          </button>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setStep(2)}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Geri
        </button>
        <button
          onClick={saveSetup}
          disabled={loading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Kaydediliyor...' : 'Kurulumu Tamamla'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">₺</span>
          </div>
        </div>
        
        <h1 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
          Hoş Geldiniz! 🎉
        </h1>
        
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Hızlı kurulum ile başlayalım
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl rounded-xl sm:px-10">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Adım {step}/3</span>
              <span>{Math.round((step / 3) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step Content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </div>
    </div>
  );
};

export default Setup; 