import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building, CreditCard, Banknote, Wallet } from 'lucide-react';
import { AccountService } from '../../services/accountService';
import { Database } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import AccountModal from '../../components/AccountModal';

type Account = Database['public']['Tables']['spendme_accounts']['Row'];

const Accounts: React.FC = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  useEffect(() => {
    if (user) {
      loadAccounts();
    }
  }, [user]);

  const loadAccounts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await AccountService.getAccounts(user.id);
      setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hesaplar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!window.confirm('Bu hesabı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await AccountService.deleteAccount(accountId);
      await loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hesap silinirken hata oluştu');
    }
  };

  const handleSaveAccount = async () => {
    await loadAccounts();
    setIsModalOpen(false);
    setEditingAccount(null);
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return Building;
      case 'credit_card':
        return CreditCard;
      case 'wallet':
        return Banknote;
      case 'other':
        return Wallet;
      default:
        return Wallet;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'bank':
        return 'Banka Hesabı';
      case 'credit_card':
        return 'Kredi Kartı';
      case 'wallet':
        return 'Cüzdan';
      case 'other':
        return 'Diğer';
      default:
        return 'Diğer';
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'bank':
        return 'text-primary-600 bg-primary-100';
      case 'credit_card':
        return 'text-warning-600 bg-warning-100';
      case 'wallet':
        return 'text-success-600 bg-success-100';
      case 'other':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Hesaplar</h1>
          <p className="mt-1 text-sm text-gray-500">
            Banka hesaplarınızı ve kredi kartlarınızı yönetin
          </p>
        </div>
        <button 
          className="btn-primary"
          onClick={handleAddAccount}
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni Hesap
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Accounts grouped by type */}
      <div className="space-y-8">
        {/* Bank Accounts */}
        {accounts.filter(acc => acc.type === 'bank').length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2 text-primary-600" />
              Banka Hesapları
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {accounts.filter(acc => acc.type === 'bank').map((account) => {
                const IconComponent = getAccountIcon(account.type);
                
                return (
                  <div key={account.id} className="card hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {account.icon ? (
                            <span className="text-2xl">{account.icon}</span>
                          ) : (
                            <IconComponent className="h-6 w-6 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{account.name}</h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccountTypeColor(account.type)}`}>
                            {getAccountTypeLabel(account.type)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          className="p-1 text-gray-400 hover:text-gray-600"
                          onClick={() => handleEditAccount(account)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-1 text-gray-400 hover:text-danger-600"
                          onClick={() => handleDeleteAccount(account.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {account.iban && (
                        <div className="text-sm">
                          <span className="text-gray-500">IBAN:</span>
                          <div className="font-mono text-xs mt-1 p-2 bg-gray-50 rounded">
                            {account.iban}
                          </div>
                        </div>
                      )}
                      
                      {account.note && (
                        <div className="text-sm">
                          <span className="text-gray-500">Not:</span>
                          <p className="text-gray-700 mt-1">{account.note}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Credit Cards */}
        {accounts.filter(acc => acc.type === 'credit_card').length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-warning-600" />
              Kredi Kartları
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {accounts.filter(acc => acc.type === 'credit_card').map((account) => {
                const IconComponent = getAccountIcon(account.type);
                
                return (
                  <div key={account.id} className="card hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {account.icon ? (
                            <span className="text-2xl">{account.icon}</span>
                          ) : (
                            <IconComponent className="h-6 w-6 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{account.name}</h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccountTypeColor(account.type)}`}>
                            {getAccountTypeLabel(account.type)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          className="p-1 text-gray-400 hover:text-gray-600"
                          onClick={() => handleEditAccount(account)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-1 text-gray-400 hover:text-danger-600"
                          onClick={() => handleDeleteAccount(account.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {account.card_limit && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Kart Limiti:</span>
                          <span className="font-medium">{account.card_limit.toLocaleString('tr-TR')} ₺</span>
                        </div>
                      )}
                      
                      {account.statement_day && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Ekstre Günü:</span>
                          <span className="font-medium">{account.statement_day}</span>
                        </div>
                      )}
                      
                      {account.due_day && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Son Ödeme:</span>
                          <span className="font-medium">{account.due_day}</span>
                        </div>
                      )}
                      
                      {account.note && (
                        <div className="text-sm">
                          <span className="text-gray-500">Not:</span>
                          <p className="text-gray-700 mt-1">{account.note}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Wallet/Other Accounts */}
        {accounts.filter(acc => acc.type === 'wallet' || acc.type === 'other').length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Wallet className="h-5 w-5 mr-2 text-success-600" />
              Diğer Hesaplar
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {accounts.filter(acc => acc.type === 'wallet' || acc.type === 'other').map((account) => {
                const IconComponent = getAccountIcon(account.type);
                
                return (
                  <div key={account.id} className="card hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {account.icon ? (
                            <span className="text-2xl">{account.icon}</span>
                          ) : (
                            <IconComponent className="h-6 w-6 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{account.name}</h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccountTypeColor(account.type)}`}>
                            {getAccountTypeLabel(account.type)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          className="p-1 text-gray-400 hover:text-gray-600"
                          onClick={() => handleEditAccount(account)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-1 text-gray-400 hover:text-danger-600"
                          onClick={() => handleDeleteAccount(account.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {account.note && (
                        <div className="text-sm">
                          <span className="text-gray-500">Not:</span>
                          <p className="text-gray-700 mt-1">{account.note}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {accounts.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Wallet className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Hesap bulunamadı</h3>
          <p className="text-gray-500">
            Henüz hesap eklenmemiş.
          </p>
        </div>
      )}

      {/* Account Modal */}
      <AccountModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAccount(null);
        }}
        onSave={handleSaveAccount}
        account={editingAccount}
        userId={user?.id || ''}
      />
    </div>
  );
};

export default Accounts; 