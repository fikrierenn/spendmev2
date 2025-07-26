import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, Lightbulb, Bot, RefreshCw, Sparkles } from 'lucide-react';
import { GeminiService } from '../../services/geminiService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface AIAnalysisData {
  analysis: string;
  insights: string[];
  recommendations: string[];
}

const AIAnalysis: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<AIAnalysisData | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('spendme_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const generateAnalysis = async () => {
    console.log('🔍 AI Analizi başlatılıyor...');
    console.log('👤 Kullanıcı:', user?.id);
    console.log('📊 İşlem sayısı:', transactions.length);
    
    if (!GeminiService.isConfigured()) {
      console.log('❌ Gemini AI yapılandırılmamış');
      toast.error('Gemini AI yapılandırılmamış');
      return;
    }

    if (transactions.length === 0) {
      console.log('❌ Analiz için işlem bulunamadı');
      toast.error('Analiz için işlem bulunamadı');
      return;
    }

    console.log('📋 İşlemler:', transactions.slice(0, 3)); // İlk 3 işlemi göster

    setLoading(true);
    try {
      console.log('🤖 Gemini AI analizi başlatılıyor...');
      const analysis = await GeminiService.analyzeSpending(transactions);
      console.log('✅ AI Analizi sonucu:', analysis);
      setAnalysisData(analysis);
      toast.success('AI analizi tamamlandı!');
    } catch (error) {
      console.error('❌ AI analysis error:', error);
      toast.error('AI analizi sırasında hata oluştu');
      
      // Hata durumunda varsayılan analiz göster
      setAnalysisData({
        analysis: 'Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.',
        insights: ['API bağlantısında sorun olabilir', 'İnternet bağlantınızı kontrol edin'],
        recommendations: ['Sayfayı yenileyin', 'Daha sonra tekrar deneyin']
      });
    } finally {
      setLoading(false);
    }
  };

  const getBudgetRecommendations = async () => {
    if (!GeminiService.isConfigured()) {
      toast.error('Gemini AI yapılandırılmamış');
      return;
    }

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    setLoading(true);
    try {
      const recommendations = await GeminiService.getBudgetRecommendations(income, [
        { category: 'Toplam Gider', amount: expenses }
      ]);
      
      // Show recommendations in a toast or modal
      toast.success('Bütçe önerileri hazırlandı!');
      console.log('Budget recommendations:', recommendations);
    } catch (error) {
      console.error('Budget recommendations error:', error);
      toast.error('Bütçe önerileri alınırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!GeminiService.isConfigured()) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <Brain className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Analizi
          </h3>
        </div>
        <div className="text-center py-8">
          <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Gemini AI yapılandırılmamış
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            AI analizi için Gemini API key'i gerekli
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Brain className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Gemini AI Analizi
          </h3>
          <div className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs rounded-full">
            Aktif
          </div>
        </div>
        <button
          onClick={generateAnalysis}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          <span>{loading ? 'Analiz Ediliyor...' : 'AI Analizi'}</span>
        </button>
      </div>

      {analysisData ? (
        <div className="space-y-6">
          {/* Genel Analiz */}
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Genel Analiz
            </h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              {analysisData.analysis}
            </p>
          </div>

          {/* Görüşler */}
          {analysisData.insights.length > 0 && (
            <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <Lightbulb className="h-4 w-4 text-yellow-600 mr-2" />
                AI Görüşleri
              </h4>
              <ul className="space-y-2">
                {analysisData.insights.map((insight, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Öneriler */}
          {analysisData.recommendations.length > 0 && (
            <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                AI Önerileri
              </h4>
              <ul className="space-y-2">
                {analysisData.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Bütçe Önerileri Butonu */}
          <button
            onClick={getBudgetRecommendations}
            disabled={loading}
            className="w-full p-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <TrendingUp className="h-4 w-4" />
            <span>Bütçe Önerileri Al</span>
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4 text-left">
            <code className="text-xs text-gray-700 dark:text-gray-300">
              SELECT a.type, 
              CASE 
                WHEN t.type = 'expense' THEN -1 * SUM(t.amount) 
                ELSE SUM(t.amount) 
              END as total
              FROM spendme_accounts as a
              JOIN spendme_transactions as t 
                ON t.account_id = a.id AND t.user_id = a.user_id
              GROUP BY a.type, t.type
              LIMIT 100;
            </code>
          </div>
          <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Harcama analizi için AI'yı çalıştırın
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Son işlemlerinizi analiz ederek öneriler sunar
          </p>
        </div>
      )}

      {/* İstatistikler */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {transactions.filter(t => t.type === 'income').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Gelir İşlemi</div>
        </div>
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {transactions.filter(t => t.type === 'expense').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Gider İşlemi</div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysis; 