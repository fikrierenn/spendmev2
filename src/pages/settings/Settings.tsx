import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import {
  BellIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  TrashIcon,
  KeyIcon,
  ShieldCheckIcon,
  UserIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'tr' | 'en';
  aiHumorMode: 'serious' | 'friendly' | 'funny' | 'clown';
  currency: 'TRY' | 'USD' | 'EUR';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY';
  notifications: {
    enabled: boolean;
    budgetAlerts: boolean;
    budgetThreshold: number;
    weeklyReports: boolean;
  };
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'auto',
    language: 'tr',
    aiHumorMode: 'friendly',
    currency: 'TRY',
    dateFormat: 'DD/MM/YYYY',
    notifications: {
      enabled: true,
      budgetAlerts: true,
      budgetThreshold: 80,
      weeklyReports: true,
    }
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('spendme_user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Settings load error:', error);
        return;
      }

      if (data) {
        const loadedSettings = {
          theme: data.theme || 'auto',
          language: data.language || 'tr',
          aiHumorMode: data.ai_humor_mode || 'friendly',
          currency: data.currency || 'TRY',
          dateFormat: data.date_format || 'DD/MM/YYYY',
          notifications: {
            enabled: data.notifications_enabled ?? true,
            budgetAlerts: data.budget_alerts ?? true,
            budgetThreshold: data.budget_threshold ?? 80,
            weeklyReports: data.weekly_reports ?? true,
          }
        };
        
        setSettings(loadedSettings);
        
        // Apply theme when settings are loaded
        if (loadedSettings.theme) {
          setTheme(loadedSettings.theme);
        }
      }
    } catch (error: any) {
      console.error('Settings load error:', error);
    }
  };

  const saveSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      console.log('Saving settings for user:', user.id);
      console.log('Settings to save:', updatedSettings);
      
      // Önce mevcut kaydı kontrol et
      const { data: existingData, error: checkError } = await supabase
        .from('spendme_user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      console.log('Existing data:', existingData);
      console.log('Check error:', checkError);
      
      let result;
      if (existingData) {
        // Update existing record
        result = await supabase
          .from('spendme_user_settings')
          .update({
            theme: updatedSettings.theme,
            language: updatedSettings.language,
            currency: updatedSettings.currency,
            date_format: updatedSettings.dateFormat,
            ai_humor_mode: updatedSettings.aiHumorMode,
            notifications_enabled: updatedSettings.notifications.enabled,
            budget_alerts: updatedSettings.notifications.budgetAlerts,
            budget_threshold: updatedSettings.notifications.budgetThreshold,
            weekly_reports: updatedSettings.notifications.weeklyReports,
          })
          .eq('user_id', user.id);
      } else {
        // Insert new record
        result = await supabase
          .from('spendme_user_settings')
          .insert({
            user_id: user.id,
            theme: updatedSettings.theme,
            language: updatedSettings.language,
            currency: updatedSettings.currency,
            date_format: updatedSettings.dateFormat,
            ai_humor_mode: updatedSettings.aiHumorMode,
            notifications_enabled: updatedSettings.notifications.enabled,
            budget_alerts: updatedSettings.notifications.budgetAlerts,
            budget_threshold: updatedSettings.notifications.budgetThreshold,
            weekly_reports: updatedSettings.notifications.weeklyReports,
          });
      }

      if (result.error) {
        throw result.error;
      }

      setSettings(updatedSettings);
      setMessage({ type: 'success', text: 'Ayarlar başarıyla kaydedildi!' });
      
      // Apply theme immediately
      if (newSettings.theme) {
        setTheme(newSettings.theme);
      }
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Settings save error:', error);
      setMessage({ type: 'error', text: `Ayarlar kaydedilirken hata oluştu: ${error?.message || error}` });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };



  const exportData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Export transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);

      // Export budgets
      const { data: budgets } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id);

      // Export accounts
      const { data: accounts } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);

      const exportData = {
        transactions,
        budgets,
        accounts,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spendme-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Veriler başarıyla dışa aktarıldı!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setMessage({ type: 'error', text: 'Veri dışa aktarma hatası!' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!user || !window.confirm('Tüm verileriniz kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam etmek istediğinizden emin misiniz?')) {
      return;
    }

    setLoading(true);
    try {
      // Delete all user data
      await supabase.from('transactions').delete().eq('user_id', user.id);
      await supabase.from('budgets').delete().eq('user_id', user.id);
      await supabase.from('accounts').delete().eq('user_id', user.id);
      await supabase.from('user_settings').delete().eq('user_id', user.id);
      
      // Delete user account
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: 'Hesabınız başarıyla silindi!' });
      // Redirect to auth page
      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);
    } catch (error) {
      console.error('Delete account error:', error);
      setMessage({ type: 'error', text: 'Hesap silme hatası!' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const SettingSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ 
    title, 
    icon, 
    children 
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="text-gray-500 dark:text-gray-400">
            {icon}
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
      </div>
      <div className="px-6 py-4 space-y-4">
        {children}
      </div>
    </div>
  );

  const SettingItem: React.FC<{ 
    label: string; 
    description?: string;
    children: React.ReactNode;
  }> = ({ label, description, children }) => (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </label>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
      <div className="ml-4">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Ayarlar
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Uygulama tercihlerinizi yönetin
          </p>
          {user && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Kullanıcı: {user.email} (ID: {user.id})
            </p>
          )}
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {/* Görünüm Ayarları */}
          <SettingSection title="Görünüm" icon={<Cog6ToothIcon className="w-6 h-6" />}>
            <SettingItem 
              label="Tema" 
              description="Uygulama temasını seçin"
            >
              <select
                value={settings.theme}
                onChange={(e) => saveSettings({ theme: e.target.value as any })}
                disabled={loading}
                className="block w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="light">Açık</option>
                <option value="dark">Koyu</option>
                <option value="auto">Otomatik</option>
              </select>
            </SettingItem>

            <SettingItem 
              label="Dil" 
              description="Uygulama dilini seçin"
            >
              <select
                value={settings.language}
                onChange={(e) => saveSettings({ language: e.target.value as any })}
                disabled={loading}
                className="block w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
              </select>
            </SettingItem>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Para Birimi</label>
              <select className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-700" value="TRY" disabled>
                <option value="TRY">₺ Türk Lirası</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Şu anda sadece Türk Lirası desteklenmektedir.</p>
            </div>

            <SettingItem 
              label="Tarih Formatı" 
              description="Tarih gösterim formatını seçin"
            >
              <select
                value={settings.dateFormat}
                onChange={(e) => saveSettings({ dateFormat: e.target.value as any })}
                disabled={loading}
                className="block w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="DD/MM/YYYY">GG/AA/YYYY</option>
                <option value="MM/DD/YYYY">AA/GG/YYYY</option>
              </select>
            </SettingItem>
          </SettingSection>

          {/* AI Ayarları */}
          <SettingSection title="AI Asistan" icon={<Cog6ToothIcon className="w-6 h-6" />}>
            <SettingItem 
              label="AI Humor Modu" 
              description="AI asistanın mizah seviyesini seçin"
            >
              <select
                value={settings.aiHumorMode}
                onChange={(e) => saveSettings({ aiHumorMode: e.target.value as any })}
                disabled={loading}
                className="block w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="serious">Ciddi</option>
                <option value="friendly">Samimi</option>
                <option value="funny">Eğlenceli</option>
                <option value="clown">Palyaço</option>
              </select>
            </SettingItem>
          </SettingSection>

          {/* Bildirim Ayarları */}
          <SettingSection title="Bildirimler" icon={<BellIcon className="w-6 h-6" />}>
            <SettingItem 
              label="Bildirimler" 
              description="Push bildirimlerini açın/kapatın"
            >
              <button
                onClick={() => saveSettings({ 
                  notifications: { 
                    ...settings.notifications, 
                    enabled: !settings.notifications.enabled 
                  } 
                })}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.notifications.enabled 
                    ? 'bg-blue-600' 
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </SettingItem>

            <SettingItem 
              label="Bütçe Uyarıları" 
              description="Bütçe limitine yaklaştığınızda uyarı alın"
            >
              <button
                onClick={() => saveSettings({ 
                  notifications: { 
                    ...settings.notifications, 
                    budgetAlerts: !settings.notifications.budgetAlerts 
                  } 
                })}
                disabled={loading || !settings.notifications.enabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.notifications.budgetAlerts && settings.notifications.enabled
                    ? 'bg-blue-600' 
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications.budgetAlerts && settings.notifications.enabled 
                      ? 'translate-x-6' 
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </SettingItem>

            <SettingItem 
              label="Bütçe Uyarı Eşiği" 
              description="Bütçenizin yüzde kaçında uyarı almak istiyorsunuz"
            >
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={settings.notifications.budgetThreshold}
                  onChange={(e) => saveSettings({ 
                    notifications: { 
                      ...settings.notifications, 
                      budgetThreshold: parseInt(e.target.value) 
                    } 
                  })}
                  disabled={loading || !settings.notifications.enabled || !settings.notifications.budgetAlerts}
                  className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                  {settings.notifications.budgetThreshold}%
                </span>
              </div>
            </SettingItem>

            <SettingItem 
              label="Haftalık Raporlar" 
              description="Haftalık harcama raporları alın"
            >
              <button
                onClick={() => saveSettings({ 
                  notifications: { 
                    ...settings.notifications, 
                    weeklyReports: !settings.notifications.weeklyReports 
                  } 
                })}
                disabled={loading || !settings.notifications.enabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.notifications.weeklyReports && settings.notifications.enabled
                    ? 'bg-blue-600' 
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications.weeklyReports && settings.notifications.enabled
                      ? 'translate-x-6' 
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </SettingItem>
          </SettingSection>

          {/* Veri Yönetimi */}
          <SettingSection title="Veri Yönetimi" icon={<DocumentArrowDownIcon className="w-6 h-6" />}>
            <SettingItem 
              label="Veri Dışa Aktar" 
              description="Tüm verilerinizi JSON formatında indirin"
            >
              <button
                onClick={exportData}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                Dışa Aktar
              </button>
            </SettingItem>

            <SettingItem 
              label="Veri İçe Aktar" 
              description="Daha önce dışa aktardığınız verileri geri yükleyin"
            >
              <button
                onClick={() => {
                  // TODO: Implement import functionality
                  setMessage({ type: 'error', text: 'Bu özellik yakında eklenecek!' });
                  setTimeout(() => setMessage(null), 3000);
                }}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
                İçe Aktar
              </button>
            </SettingItem>
          </SettingSection>


        </div>
      </div>
    </div>
  );
};

export default Settings; 