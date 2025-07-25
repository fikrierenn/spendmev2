import React, { useState, useRef, useEffect } from 'react';
import { User, Camera, Edit, Save, X, Key, Shield, Bell, Trash2, Settings, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface UserProfile {
  id?: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  phone: string;
  location: string;
  avatar_url?: string;
  email?: string;
  // Notification settings
  email_notifications?: boolean;
  push_notifications?: boolean;
  budget_alerts?: boolean;
  transaction_reminders?: boolean;
  weekly_reports?: boolean;
  monthly_reports?: boolean;
  security_alerts?: boolean;
  marketing_emails?: boolean;
}

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  budget_alerts: boolean;
  transaction_reminders: boolean;
  weekly_reports: boolean;
  monthly_reports: boolean;
  security_alerts: boolean;
  marketing_emails: boolean;
}

const Profile: React.FC = () => {
  const { user, userProfile, updateUserProfile, updateProfilePhoto } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    budget_alerts: true,
    transaction_reminders: true,
    weekly_reports: false,
    monthly_reports: true,
    security_alerts: true,
    marketing_emails: false
  });
  
  // Refs for input focus management
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);

  const [transactionStats, setTransactionStats] = useState({
    toplamIslem: 0,
    toplamGelir: 0,
    toplamGider: 0
  });

  // Get current values from refs or fallback to userProfile
  const getCurrentFormData = (): UserProfile => ({
    first_name: firstNameRef.current?.value || userProfile?.first_name || '',
    last_name: lastNameRef.current?.value || userProfile?.last_name || '',
    phone: phoneRef.current?.value || userProfile?.phone || '',
    location: locationRef.current?.value || userProfile?.location || '',
    email: user?.email || ''
  });

  const handleEdit = () => {
    setIsEditing(true);
    // Focus first input after a short delay
    setTimeout(() => {
      firstNameRef.current?.focus();
    }, 100);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const formData = getCurrentFormData();
      console.log('=== PROFILE SAVE DEBUG ===');
      console.log('User ID:', user.id);
      console.log('Form data to save:', formData);
      console.log('Current userProfile:', userProfile);
      
      const { error } = await updateUserProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        location: formData.location,
      });

      console.log('Update result error:', error);

      if (error) {
        throw error;
      }

      console.log('Profile saved successfully!');
      setIsEditing(false);
      toast.success('Profil bilgileri başarıyla kaydedildi!');
      
    } catch (error: any) {
      console.error('Profile save error:', error);
      toast.error(`Profil kaydedilirken hata oluştu: ${error?.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset input values to original
    if (firstNameRef.current) firstNameRef.current.value = userProfile?.first_name || '';
    if (lastNameRef.current) lastNameRef.current.value = userProfile?.last_name || '';
    if (phoneRef.current) phoneRef.current.value = userProfile?.phone || '';
    if (locationRef.current) locationRef.current.value = userProfile?.location || '';
    setIsEditing(false);
  };

  const handleNotificationChange = async (key: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }));
    
    // Save to database
    try {
      const { error } = await updateUserProfile({
        [key]: value
      });
      
      if (error) {
        toast.error('Bildirim ayarı kaydedilemedi');
        // Revert the change
        setNotificationSettings(prev => ({ ...prev, [key]: !value }));
      } else {
        toast.success('Bildirim ayarı güncellendi');
      }
    } catch (error) {
      toast.error('Bildirim ayarı kaydedilemedi');
      // Revert the change
      setNotificationSettings(prev => ({ ...prev, [key]: !value }));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  };

  useEffect(() => {
    // Kullanıcının işlemlerini Supabase'den çek ve istatistikleri hesapla
    const fetchStats = async () => {
      if (!user) return;
      const { data: transactions, error } = await supabase
        .from('spendme_transactions')
        .select('*')
        .eq('user_id', user.id);
      if (error) return;
      const toplamIslem = transactions.length;
      const toplamGelir = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
      const toplamGider = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
      setTransactionStats({ toplamIslem, toplamGelir, toplamGider });
    };
    fetchStats();
  }, [user]);


  const SettingSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ 
    title, 
    icon, 
    children 
  }) => (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              {icon}
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>
        </div>
      </div>
      <div className="px-6 py-4">
        {children}
      </div>
    </div>
  );

  const SettingItem: React.FC<{ 
    label: string; 
    description?: string;
    children: React.ReactNode;
  }> = ({ label, description, children }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </p>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      <div className="ml-4">
        {children}
      </div>
    </div>
  );

  // Update form data when userProfile changes
  React.useEffect(() => {
    if (userProfile && !isEditing) {
      // Reset input values when userProfile is loaded
      if (firstNameRef.current) firstNameRef.current.value = userProfile.first_name || '';
      if (lastNameRef.current) lastNameRef.current.value = userProfile.last_name || '';
      if (phoneRef.current) phoneRef.current.value = userProfile.phone || '';
      if (locationRef.current) locationRef.current.value = userProfile.location || '';
      
      // Load notification settings from userProfile
      setNotificationSettings({
        email_notifications: userProfile.email_notifications ?? true,
        push_notifications: userProfile.push_notifications ?? true,
        budget_alerts: userProfile.budget_alerts ?? true,
        transaction_reminders: userProfile.transaction_reminders ?? true,
        weekly_reports: userProfile.weekly_reports ?? false,
        monthly_reports: userProfile.monthly_reports ?? true,
        security_alerts: userProfile.security_alerts ?? true,
        marketing_emails: userProfile.marketing_emails ?? false
      });
    }
  }, [userProfile, isEditing]);

  const currentData = getCurrentFormData();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Profil
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Kişisel bilgilerinizi ve hesap ayarlarınızı yönetin
              </p>
            </div>
            {!isEditing ? (
              <button 
                onClick={handleEdit}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Düzenle
              </button>
            ) : (
              <div className="flex space-x-2">
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
                <button 
                  onClick={handleCancel}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  İptal
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Profile Avatar Section */}
          <SettingSection title="Profil Fotoğrafı" icon={<User className="w-6 h-6" />}>
            <div className="text-center">
              <div className="relative inline-block">
                {userProfile?.avatar_url ? (
                  <img 
                    src={userProfile.avatar_url} 
                    alt="Profil fotoğrafı"
                    className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-white dark:border-gray-700 shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
                    {currentData.first_name.charAt(0) || 'U'}{currentData.last_name.charAt(0) || ''}
                  </div>
                )}
                {isEditing && (
                  <button 
                    onClick={() => {
                      // Create file input
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/jpeg,image/png,image/webp';
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          try {
                            // Validate file size (max 5MB)
                            const maxSize = 5 * 1024 * 1024; // 5MB
                            if (file.size > maxSize) {
                              toast.error('Dosya boyutu çok büyük. 5MB\'dan küçük bir resim seçin.');
                              return;
                            }

                            // Validate file type
                            if (!file.type.startsWith('image/')) {
                              toast.error('Lütfen geçerli bir resim dosyası seçin.');
                              return;
                            }

                            toast.loading('Fotoğraf yükleniyor...');
                            const { error } = await updateProfilePhoto(file);
                            
                            if (error) {
                              toast.error('Fotoğraf yüklenirken hata oluştu: ' + error.message);
                            } else {
                              toast.success('Profil fotoğrafı başarıyla güncellendi!');
                            }
                          } catch (error: any) {
                            toast.error('Fotoğraf yüklenirken hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
                          }
                        }
                      };
                      input.click();
                    }}
                    className="absolute bottom-0 right-0 bg-white dark:bg-gray-700 p-2 rounded-full shadow-lg border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Camera className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Profil fotoğrafınızı değiştirmek için kamera ikonuna tıklayın
              </p>
            </div>
          </SettingSection>

          {/* Personal Information */}
          <SettingSection title="Kişisel Bilgiler" icon={<User className="w-6 h-6" />}>
            <SettingItem 
              label="Ad" 
              description="Adınızı güncelleyin"
            >
              {isEditing ? (
                <input
                  ref={firstNameRef}
                  type="text"
                  defaultValue={userProfile?.first_name || ''}
                  className="block w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              ) : (
                <span className="text-gray-900 dark:text-white">{currentData.first_name || 'Belirtilmemiş'}</span>
              )}
            </SettingItem>

            <SettingItem 
              label="Soyad" 
              description="Soyadınızı güncelleyin"
            >
              {isEditing ? (
                <input
                  ref={lastNameRef}
                  type="text"
                  defaultValue={userProfile?.last_name || ''}
                  className="block w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              ) : (
                <span className="text-gray-900 dark:text-white">{currentData.last_name || 'Belirtilmemiş'}</span>
              )}
            </SettingItem>

            <SettingItem 
              label="Telefon" 
              description="Telefon numaranızı güncelleyin"
            >
              {isEditing ? (
                <input
                  ref={phoneRef}
                  type="tel"
                  defaultValue={userProfile?.phone || ''}
                  className="block w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              ) : (
                <span className="text-gray-900 dark:text-white">{currentData.phone || 'Belirtilmemiş'}</span>
              )}
            </SettingItem>

            <SettingItem 
              label="Konum" 
              description="Konumunuzu güncelleyin"
            >
              {isEditing ? (
                <input
                  ref={locationRef}
                  type="text"
                  defaultValue={userProfile?.location || ''}
                  className="block w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              ) : (
                <span className="text-gray-900 dark:text-white">{currentData.location || 'Belirtilmemiş'}</span>
              )}
            </SettingItem>

            <SettingItem 
              label="E-posta" 
              description="E-posta adresiniz"
            >
              <span className="text-gray-900 dark:text-white">{currentData.email || 'Belirtilmemiş'}</span>
            </SettingItem>
          </SettingSection>

          {/* Data Export */}
          <SettingSection title="Veri Dışa Aktar" icon={<Settings className="w-6 h-6" />}>
            <SettingItem 
              label="Harcama Verileri" 
              description="Tüm harcama verilerinizi CSV formatında indirin (Yakında)"
            >
              <button 
                disabled={true}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
              >
                <Settings className="h-4 w-4 mr-2" />
                Yakında
              </button>
            </SettingItem>
          </SettingSection>

          {/* Notification Settings */}
          <SettingSection title="Bildirim Ayarları" icon={<Bell className="w-6 h-6" />}>
            <SettingItem 
              label="E-posta Bildirimleri" 
              description="Önemli güncellemeler için e-posta alın"
            >
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.email_notifications}
                  onChange={(e) => handleNotificationChange('email_notifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </SettingItem>

            <SettingItem 
              label="Push Bildirimleri" 
              description="Anlık bildirimler alın"
            >
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.push_notifications}
                  onChange={(e) => handleNotificationChange('push_notifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </SettingItem>

            <SettingItem 
              label="Bütçe Uyarıları" 
              description="Bütçe limitlerinize yaklaştığınızda uyarı alın"
            >
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.budget_alerts}
                  onChange={(e) => handleNotificationChange('budget_alerts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </SettingItem>

            <SettingItem 
              label="İşlem Hatırlatıcıları" 
              description="Düzenli ödemeler için hatırlatmalar alın"
            >
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.transaction_reminders}
                  onChange={(e) => handleNotificationChange('transaction_reminders', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </SettingItem>

            <SettingItem 
              label="Haftalık Raporlar" 
              description="Haftalık harcama özetinizi e-posta ile alın"
            >
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.weekly_reports}
                  onChange={(e) => handleNotificationChange('weekly_reports', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </SettingItem>

            <SettingItem 
              label="Aylık Raporlar" 
              description="Aylık finansal özetinizi e-posta ile alın"
            >
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.monthly_reports}
                  onChange={(e) => handleNotificationChange('monthly_reports', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </SettingItem>

            <SettingItem 
              label="Güvenlik Uyarıları" 
              description="Hesap güvenliği ile ilgili önemli uyarılar"
            >
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.security_alerts}
                  onChange={(e) => handleNotificationChange('security_alerts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </SettingItem>

            <SettingItem 
              label="Pazarlama E-postaları" 
              description="Yeni özellikler ve güncellemeler hakkında bilgi alın"
            >
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.marketing_emails}
                  onChange={(e) => handleNotificationChange('marketing_emails', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </SettingItem>
          </SettingSection>

          {/* Security Settings */}
          <SettingSection title="Güvenlik" icon={<Shield className="w-6 h-6" />}>
            <SettingItem 
              label="Şifre Değiştir" 
              description="Hesap şifrenizi güncelleyin"
            >
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Key className="h-4 w-4 mr-2" />
                Değiştir
              </button>
            </SettingItem>

            <SettingItem 
              label="İki Faktörlü Doğrulama" 
              description="Hesabınızı daha güvenli hale getirin (Yakında)"
            >
              <button 
                disabled={true}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
              >
                <Shield className="h-4 w-4 mr-2" />
                Yakında
              </button>
            </SettingItem>
          </SettingSection>

          {/* Account Statistics */}
          <SettingSection title="Hesap İstatistikleri" icon={<User className="w-6 h-6" />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{transactionStats.toplamIslem}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Toplam İşlem</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(transactionStats.toplamGelir)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Toplam Gelir</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(transactionStats.toplamGider)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Toplam Gider</div>
              </div>
            </div>
          </SettingSection>

          {/* Account Management */}
          <SettingSection title="Hesap Yönetimi" icon={<User className="w-6 h-6" />}>
            <SettingItem 
              label="Hesabı Sil" 
              description="Tüm verilerinizle birlikte hesabınızı kalıcı olarak silin"
            >
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hesabı Sil
              </button>
            </SettingItem>
          </SettingSection>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Şifre Değiştir
            </h3>
            <PasswordChangeModal 
              onClose={() => setShowPasswordModal(false)}
              onSuccess={() => {
                setShowPasswordModal(false);
                toast.success('Şifre başarıyla değiştirildi!');
              }}
              userEmail={user?.email || ''}
            />
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-red-600 mb-4">
              Hesabı Sil
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecektir.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  toast.error('Hesap silme özelliği henüz aktif değil');
                }}
                className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Hesabı Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Password Change Modal Component
const PasswordChangeModal: React.FC<{ onClose: () => void; onSuccess: () => void; userEmail: string }> = ({ onClose, onSuccess, userEmail }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setLoading(true);
    try {
      // First, verify current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword
      });

      if (signInError) {
        toast.error('Mevcut şifre yanlış');
        return;
      }

      // Update password using Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        toast.error(`Şifre güncellenirken hata oluştu: ${updateError.message}`);
        return;
      }

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      onSuccess();
    } catch (error: any) {
      toast.error(`Şifre değiştirilirken hata oluştu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Mevcut Şifre
        </label>
        <div className="relative">
          <input
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            required
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showCurrentPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Yeni Şifre
        </label>
        <div className="relative">
          <input
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            required
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showNewPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Yeni Şifre (Tekrar)
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
          </button>
        </div>
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          İptal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Değiştiriliyor...' : 'Değiştir'}
        </button>
      </div>
    </form>
  );
};

export default Profile; 