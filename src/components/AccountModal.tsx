import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Building, CreditCard, Banknote, Wallet } from 'lucide-react';
import { AccountService } from '../services/accountService';
import { Database } from '../lib/supabase';
import IconPicker from './forms/IconPicker';

type Account = Database['public']['Tables']['spendme_accounts']['Row'];
type AccountInsert = Database['public']['Tables']['spendme_accounts']['Insert'];

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  account?: Account | null;
  userId: string;
}

const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  account,
  userId
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank' as 'bank' | 'wallet' | 'credit_card' | 'other',
    icon: '',
    iban: '',
    note: '',
    card_limit: '',
    statement_day: '',
    due_day: '',
    card_note: '',
    card_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!account;

  useEffect(() => {
    if (account) {
              setFormData({
          name: account.name,
          type: account.type as 'bank' | 'wallet' | 'credit_card' | 'other',
          icon: account.icon || '',
        iban: account.iban || '',
        note: account.note || '',
        card_limit: account.card_limit?.toString() || '',
        statement_day: account.statement_day?.toString() || '',
        due_day: account.due_day?.toString() || '',
        card_note: account.card_note || '',
        card_number: account.card_number || ''
      });
    } else {
      setFormData({
        name: '',
        type: 'bank',
        icon: '',
        iban: '',
        note: '',
        card_limit: '',
        statement_day: '',
        due_day: '',
        card_note: '',
        card_number: ''
      });
    }
    setError(null);
  }, [account, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Hesap adı gereklidir');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const accountData: AccountInsert = {
        name: formData.name.trim(),
        type: formData.type,
        icon: formData.icon.trim() || null,
        iban: formData.iban.trim() || null,
        note: formData.note.trim() || null,
        card_limit: formData.card_limit ? parseFloat(formData.card_limit) : null,
        statement_day: formData.statement_day ? parseInt(formData.statement_day) : null,
        due_day: formData.due_day ? parseInt(formData.due_day) : null,
        card_note: formData.card_note.trim() || null,
        card_number: formData.card_number.trim() || null,
        user_id: userId
      };

      if (isEditing && account) {
        await AccountService.updateAccount(account.id, accountData);
      } else {
        await AccountService.createAccount(accountData);
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hesap kaydedilirken hata oluştu');
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

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return Building;
      case 'credit_card':
        return CreditCard;
      case 'wallet':
        return Banknote;
      default:
        return Wallet;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Hesap Düzenle' : 'Yeni Hesap'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hesap Adı *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Örn: Ziraat Bankası"
              maxLength={50}
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İkon
            </label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => handleInputChange('icon', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Örn: 🏦"
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
              Hesap Türü *
            </label>
            <div className="grid grid-cols-2 gap-3">
                              {[
                  { value: 'bank', label: 'Banka Hesabı', icon: Building },
                  { value: 'credit_card', label: 'Kredi Kartı', icon: CreditCard },
                  { value: 'wallet', label: 'Cüzdan', icon: Banknote },
                  { value: 'other', label: 'Diğer', icon: Wallet }
                ].map((type) => {
                const IconComponent = type.icon;
                return (
                  <label
                    key={type.value}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.type === type.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="sr-only"
                    />
                    <IconComponent className="h-5 w-5 mr-2 text-gray-600" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Bank Account Fields */}
          {formData.type === 'bank' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IBAN
                </label>
                <input
                  type="text"
                  value={formData.iban}
                  onChange={(e) => handleInputChange('iban', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                  maxLength={34}
                />
              </div>
            </div>
          )}

          {/* Credit Card Fields */}
          {formData.type === 'credit_card' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kart Limiti (₺)
                  </label>
                  <input
                    type="number"
                    value={formData.card_limit}
                    onChange={(e) => handleInputChange('card_limit', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kart Numarası
                  </label>
                  <input
                    type="text"
                    value={formData.card_number}
                    onChange={(e) => handleInputChange('card_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="**** **** **** ****"
                    maxLength={19}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ekstre Günü
                  </label>
                  <input
                    type="number"
                    value={formData.statement_day}
                    onChange={(e) => handleInputChange('statement_day', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="1-31"
                    min="1"
                    max="31"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Son Ödeme Günü
                  </label>
                  <input
                    type="number"
                    value={formData.due_day}
                    onChange={(e) => handleInputChange('due_day', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="1-31"
                    min="1"
                    max="31"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kart Notu
                </label>
                <textarea
                  value={formData.card_note}
                  onChange={(e) => handleInputChange('card_note', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Kart ile ilgili notlar..."
                  rows={2}
                  maxLength={200}
                />
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Not
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => handleInputChange('note', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Hesap ile ilgili notlar..."
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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

export default AccountModal; 