import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Account {
  id: string;
  name: string;
  type: string;
  icon: string;
  balance?: number;
}

interface AccountGroup {
  [key: string]: Account[];
}

const TransferTransaction: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    fromAccountId: '',
    toAccountId: '',
    description: '',
    date: new Date().toISOString().slice(0, 10)
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountGroups, setAccountGroups] = useState<AccountGroup>({});
  const [selectedFromGroup, setSelectedFromGroup] = useState<string | null>(null);
  const [selectedToGroup, setSelectedToGroup] = useState<string | null>(null);
  const [showFromAccounts, setShowFromAccounts] = useState(false);
  const [showToAccounts, setShowToAccounts] = useState(false);

  useEffect(() => {
    if (user) {
      loadAccounts();
    }
  }, [user]);

  // Load accounts
  const loadAccounts = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('spendme_accounts')
        .select('id, name, type, icon')
        .eq('user_id', user.id);
      
      setAccounts(data || []);
      
      // Group accounts by type
      const grouped = groupAccountsByType(data || []);
      setAccountGroups(grouped);
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Hesaplar yüklenirken hata oluştu');
    }
  };

  // Group accounts by type
  const groupAccountsByType = (accounts: Account[]) => {
    const groups: AccountGroup = {};
    
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

  // Handle from account group selection
  const handleFromGroupSelect = (groupKey: string) => {
    setSelectedFromGroup(groupKey);
    setShowFromAccounts(true);
    setFormData(prev => ({ ...prev, fromAccountId: '' }));
  };

  // Handle to account group selection
  const handleToGroupSelect = (groupKey: string) => {
    setSelectedToGroup(groupKey);
    setShowToAccounts(true);
    setFormData(prev => ({ ...prev, toAccountId: '' }));
  };

  // Handle from account selection
  const handleFromAccountSelect = (accountId: string) => {
    setFormData(prev => ({ ...prev, fromAccountId: accountId }));
  };

  // Handle to account selection
  const handleToAccountSelect = (accountId: string) => {
    setFormData(prev => ({ ...prev, toAccountId: accountId }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Kullanıcı oturumu bulunamadı');
      return;
    }

    if (!formData.amount || !formData.fromAccountId || !formData.toAccountId) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    if (formData.fromAccountId === formData.toAccountId) {
      toast.error('Aynı hesaptan aynı hesaba transfer yapamazsınız');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Geçerli bir tutar girin');
      return;
    }

    setLoading(true);
    try {
      // Create transfer transaction
      const { error } = await supabase
        .from('spendme_transactions')
        .insert({
          user_id: user.id,
          type: 'transfer',
          amount: amount,
          from_account_id: formData.fromAccountId,
          to_account_id: formData.toAccountId,
          description: formData.description || `Transfer: ${getAccountName(formData.fromAccountId)} → ${getAccountName(formData.toAccountId)}`,
          date: formData.date,
          category_id: null, // Transfer işlemleri için kategori yok
          account_id: formData.fromAccountId // Ana hesap olarak from account
        });

      if (error) throw error;

      toast.success('Transfer işlemi başarıyla oluşturuldu');
      navigate('/transactions');
    } catch (error) {
      console.error('Error creating transfer:', error);
      toast.error('Transfer işlemi oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Get account name by ID
  const getAccountName = (accountId: string): string => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : 'Bilinmeyen Hesap';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/transactions')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Hesap Transferi
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Hesaplar arası para transferi yapın
            </p>
          </div>
        </div>
      </div>

      {/* Transfer Form */}
      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Transfer Tutarı
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              className="input pl-8"
              required
            />
          </div>
        </div>

        {/* From Account */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Gönderen Hesap
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
                  onClick={() => handleFromGroupSelect(groupKey)}
                  className={`p-2 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 text-xs ${
                    selectedFromGroup === groupKey
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
          
          {/* Hesap Seçimi */}
          {showFromAccounts && selectedFromGroup && (
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Hesaplar
              </h4>
              {accountGroups[selectedFromGroup]?.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {accountGroups[selectedFromGroup].map(account => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => handleFromAccountSelect(account.id)}
                      className={`p-2 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 text-xs ${
                        formData.fromAccountId === account.id
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                          : 'border-gray-200 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-600'
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

        {/* Transfer Arrow */}
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <ArrowRight className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        {/* To Account */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Alıcı Hesap
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
                  onClick={() => handleToGroupSelect(groupKey)}
                  className={`p-2 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 text-xs ${
                    selectedToGroup === groupKey
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
          
          {/* Hesap Seçimi */}
          {showToAccounts && selectedToGroup && (
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Hesaplar
              </h4>
              {accountGroups[selectedToGroup]?.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {accountGroups[selectedToGroup].map(account => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => handleToAccountSelect(account.id)}
                      className={`p-2 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 text-xs ${
                        formData.toAccountId === account.id
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

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Açıklama (İsteğe bağlı)
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Transfer açıklaması..."
            className="input"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Transfer Tarihi
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className="input"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !formData.amount || !formData.fromAccountId || !formData.toAccountId}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Transfer Oluşturuluyor...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Transfer Oluştur
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default TransferTransaction; 