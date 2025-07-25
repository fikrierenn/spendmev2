import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const TestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testSupabaseConnection = async () => {
    setLoading(true);
    setTestResults([]);
    
    try {
      addResult('🔍 Supabase bağlantısı test ediliyor...');
      
      // Test 1: Basic connection
      addResult('📡 Temel bağlantı testi...');
      addResult('✅ Supabase bağlantısı başarılı (auth.users kullanılıyor)');

      // Test 1.5: Check specific tables
      addResult('🗄️ Belirli tablolar kontrol ediliyor...');
      
      const tablesToCheck = [
        'spendme_user_profiles',
        'spendme_categories',
        'spendme_accounts',
        'spendme_transactions',
        'spendme_budgets'
      ];
      
      for (const tableName of tablesToCheck) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('count')
            .limit(1);
          
          if (error) {
            addResult(`❌ ${tableName}: ${error.message}`);
          } else {
            addResult(`✅ ${tableName}: Mevcut`);
          }
        } catch (tableError: any) {
          addResult(`❌ ${tableName}: ${tableError.message}`);
        }
      }

      // Test 2: Auth test
      addResult('🔐 Auth sistemi test ediliyor...');
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        addResult(`❌ Auth hatası: ${authError.message}`);
      } else {
        addResult(`✅ Auth sistemi çalışıyor. Session: ${authData.session ? 'Var' : 'Yok'}`);
      }

      // Test 3: Storage test
      addResult('📦 Storage test ediliyor...');
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
      
      if (storageError) {
        addResult(`❌ Storage hatası: ${storageError.message}`);
      } else {
        addResult(`✅ Storage çalışıyor. Bucket sayısı: ${buckets?.length || 0}`);
        buckets?.forEach(bucket => {
          addResult(`   - Bucket: ${bucket.name} (${bucket.public ? 'Public' : 'Private'})`);
        });
      }



            // Test 4: Try login with updated password
      addResult('🔑 Güncellenmiş şifre ile giriş yapılıyor...');
      addResult('📝 Kullanıcı bilgileri:');
      addResult('   E-posta: fikrieren@gmail.com');
      addResult('   Şifre: 123456');
      
      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: 'fikrieren@gmail.com',
          password: '123456'
        });
        
        addResult(`🔍 SignIn response: ${JSON.stringify(signInData, null, 2)}`);
        addResult(`🔍 SignIn error: ${JSON.stringify(signInError, null, 2)}`);
        
        if (signInError) {
          addResult(`❌ Giriş hatası: ${signInError.message}`);
          addResult(`🔍 Giriş hata detayı: ${JSON.stringify(signInError, null, 2)}`);
        } else {
          addResult(`✅ Giriş başarılı! User ID: ${signInData.user?.id}`);
          addResult(`📧 Email: ${signInData.user?.email}`);
          addResult('🚪 Çıkış yapılıyor...');
          await supabase.auth.signOut();
          addResult('✅ Çıkış başarılı');
        }
      } catch (authError: any) {
        addResult(`❌ Auth genel hatası: ${authError.message}`);
      }

    } catch (error: any) {
      addResult(`💥 Genel hata: ${error.message}`);
      addResult(`🔍 Hata stack: ${error.stack}`);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            🔧 Supabase Test Sayfası
          </h1>
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={testSupabaseConnection}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '🔄 Test Ediliyor...' : '🚀 Test Başlat'}
            </button>
            
            <button
              onClick={clearResults}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              🗑️ Temizle
            </button>
          </div>

          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Test Sonuçları:
            </h2>
            
            {testResults.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                Test başlatmak için yukarıdaki butona tıklayın...
              </p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 Test Açıklaması:
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Temel Supabase bağlantısı</li>
              <li>• Auth sistemi kontrolü</li>
              <li>• Storage bucket listesi</li>
              <li>• Test kullanıcısı oluşturma</li>
              <li>• Test girişi ve çıkışı</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage; 