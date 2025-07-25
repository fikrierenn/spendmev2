import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Plus, X, Brain, Zap, TrendingUp, TrendingDown, 
  Calendar, Tag, Building, DollarSign, Smartphone,
  Lightbulb, Bot, CheckCircle, AlertCircle, Sparkles, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { GeminiService } from '../../services/geminiService';
import { CategoryService } from '../../services/categoryService';
import { TransactionService } from '../../services/transactionService';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'transfer';
  icon?: string;
  parent_id?: string | null;
}

interface Account {
  id: string;
  name: string;
  type: string;
  balance?: number;
  description?: string;
}

interface Transaction {
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  category_id: string;
  account_id: string;
  description: string;
  date: string;
  payment_method?: string;
  vendor?: string;
  installments?: number;
  from_account_id?: string;
  to_account_id?: string;
}

const AIAddTransaction: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [groupedAccounts, setGroupedAccounts] = useState<any>({});
  
  // Alt kategori sistemi için yeni state'ler
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [showSubcategories, setShowSubcategories] = useState(false);
  
  const [formData, setFormData] = useState<Transaction>({
    type: 'expense',
    amount: 0,
    category_id: '',
    account_id: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: '',
    vendor: '',
    installments: 1,
    from_account_id: '',
    to_account_id: ''
  });

  const [showQuickAmounts, setShowQuickAmounts] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<any[]>([]);
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [showNaturalLanguage, setShowNaturalLanguage] = useState(false);

  // Taksit alanının görünürlüğü için yeni state
  const [showInstallmentField, setShowInstallmentField] = useState(false);

  const descriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // URL parametresinden type'ı al ve formData'ya set et
  useEffect(() => {
    const typeFromUrl = searchParams.get('type');
    console.log('🔍 AIAddTransaction - URL type parametresi:', typeFromUrl);
    if (typeFromUrl && ['income', 'expense', 'transfer'].includes(typeFromUrl)) {
      setFormData(prev => ({ ...prev, type: typeFromUrl as 'income' | 'expense' | 'transfer' }));
      console.log('✅ Form type güncellendi:', typeFromUrl);
    }
  }, [searchParams]);

  // Load categories and accounts
  useEffect(() => {
    if (user) {
      loadCategories();
      loadAccounts();
      loadRecentTransactions();
    }
  }, [user]);

  // Alt kategorileri otomatik yükle
  useEffect(() => {
    if (selectedMainCategory && user) {
      console.log('🔄 Ana kategori değişti, alt kategoriler yükleniyor:', selectedMainCategory);
      loadSubcategories(user.id, selectedMainCategory);
    }
  }, [selectedMainCategory, user]);

  // AI description suggestions
  useEffect(() => {
    if (descriptionTimeoutRef.current) {
      clearTimeout(descriptionTimeoutRef.current);
    }

    if (formData.description.length > 2) {
      descriptionTimeoutRef.current = setTimeout(() => {
        getAIDescriptionSuggestions();
      }, 500);
    }

    return () => {
      if (descriptionTimeoutRef.current) {
        clearTimeout(descriptionTimeoutRef.current);
      }
    };
  }, [formData.description]);

  // Alt kategorileri otomatik yükle
  useEffect(() => {
    if (selectedMainCategory && user) {
      console.log('🔄 Ana kategori değişti, alt kategoriler yükleniyor:', selectedMainCategory);
      loadSubcategories(user.id, selectedMainCategory);
    }
  }, [selectedMainCategory, user]);

  const loadCategories = async () => {
    if (!user) return;
    
    try {
      console.log('🔄 Kategoriler yükleniyor...');
      
      // Supabase'den direkt çek
      const { data: supabaseCategories, error: supabaseError } = await supabase
        .from('spendme_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      
      if (supabaseError) {
        console.error('❌ Supabase kategori hatası:', supabaseError);
        toast.error('Kategoriler yüklenirken hata oluştu');
        return;
      }
      
      console.log('📊 Kategori sayısı:', supabaseCategories?.length || 0);
      
      // Ana kategorileri al (parent_id = null)
      const mainCats = await CategoryService.getMainCategories(user.id);
      console.log('✅ Ana kategoriler:', mainCats);
      setMainCategories(mainCats as Category[]);
      
      // Tüm kategorileri de sakla (Gemini için)
      setCategories(supabaseCategories as Category[] || []);
      
      // İlk ana kategoriyi seç (varsa)
      if (mainCats.length > 0 && !selectedMainCategory) {
        setSelectedMainCategory(mainCats[0].id);
        await loadSubcategories(user.id, mainCats[0].id);
      }
      
    } catch (error) {
      console.error('❌ Kategori yükleme hatası:', error);
      toast.error('Kategoriler yüklenirken hata oluştu');
    }
  };

  const loadSubcategories = async (userId: string, parentId: string) => {
    try {
      const subcats = await CategoryService.getSubcategories(userId, parentId);
      setSubcategories(subcats as Category[]);
    } catch (error) {
      console.error('❌ Alt kategori yükleme hatası:', error);
      toast.error('Alt kategoriler yüklenirken hata oluştu');
    }
  };


  const loadAccounts = async () => {
    try {
      console.log('🏦 Hesaplar yükleniyor... User ID:', user?.id);
      
      if (!user?.id) {
        console.log('❌ User ID yok');
        return;
      }

      const { data, error } = await supabase
        .from('spendme_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (error) {
        console.error('❌ Hesap yükleme hatası:', error);
        throw error;
      }

      console.log('🔍 Supabase\'den çekilen hesaplar:', data);
      console.log('📊 Hesap sayısı:', data?.length || 0);
      
      // Hesapları türlerine göre grupla
      const groupedAccounts = data?.reduce((groups: any, account) => {
        const type = account.type || 'other';
        if (!groups[type]) {
          groups[type] = [];
        }
        groups[type].push(account);
        return groups;
      }, {}) || {};
      
      console.log('📋 Gruplandırılmış hesaplar:', groupedAccounts);
      
      setAccounts(data || []);
      setGroupedAccounts(groupedAccounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadRecentTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('spendme_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentTransactions(data || []);
    } catch (error) {
      console.error('Error loading recent transactions:', error);
    }
  };

  const getAIDescriptionSuggestions = async () => {
    if (!formData.description || formData.description.length < 3) return;

    setAiLoading(true);
    try {
      let suggestions: string[] = [];
      
      // Try Gemini first, fallback to local AI
      if (GeminiService.isConfigured()) {
        try {
          suggestions = await GeminiService.getDescriptionSuggestions(formData.description, formData.type);
        } catch (geminiError) {
          console.error('Gemini error, falling back to local AI:', geminiError);
        }
      }
      
      // Fallback to local AI if Gemini fails or not configured
      if (suggestions.length === 0) {
        const description = formData.description.toLowerCase();
        
        // Common expense patterns
        if (formData.type === 'expense') {
          if (description.includes('market') || description.includes('süper')) {
            suggestions.push('Market alışverişi');
            suggestions.push('Gıda alışverişi');
          } else if (description.includes('benzin') || description.includes('yakıt')) {
            suggestions.push('Benzin alımı');
            suggestions.push('Yakıt gideri');
          } else if (description.includes('fatura') || description.includes('elektrik')) {
            suggestions.push('Elektrik faturası');
            suggestions.push('Fatura ödemesi');
          } else if (description.includes('yemek') || description.includes('restoran')) {
            suggestions.push('Restoran yemeği');
            suggestions.push('Dışarıda yemek');
          }
        }

        // Common income patterns
        if (formData.type === 'income') {
          if (description.includes('maaş') || description.includes('salary')) {
            suggestions.push('Maaş ödemesi');
            suggestions.push('Aylık gelir');
          } else if (description.includes('ek') || description.includes('bonus')) {
            suggestions.push('Ek gelir');
            suggestions.push('Bonus ödemesi');
          }
        }
      }

      if (suggestions.length > 0) {
        setAiSuggestions(suggestions);
        setShowAiSuggestions(true);
      }
    } catch (error) {
      console.error('AI suggestions error:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const parseLocally = async (text: string, availableCategories: Category[], availableAccounts: Account[]) => {
    console.log('🔄 Yerel ayrıştırma başlatılıyor...');
    console.log('📝 Input text:', text);
    console.log('🏦 Mevcut hesaplar:', availableAccounts.map(a => ({ id: a.id, name: a.name, type: a.type })));
    console.log('📊 Mevcut kategoriler:', availableCategories.map(c => ({ id: c.id, name: c.name, type: c.type })));

    let result: any = null;

    // Tutar çıkarma fonksiyonu - daha gelişmiş
    const extractAmount = (text: string): number => {
      // Farklı para birimi formatları
      const amountPatterns = [
        /(\d+(?:[.,]\d+)?)\s*(?:tl|lira|₺)/i,
      ]; // Sadece TL/lira/₺ destekleniyor
      
      for (const pattern of amountPatterns) {
        const match = text.match(pattern);
        if (match) {
          const amount = parseFloat(match[1].replace(',', '.'));
          if (amount > 0) {
            return amount;
          }
        }
      }
      return 0;
    };

    // Vendor çıkarma fonksiyonu - daha gelişmiş
    const extractVendor = (text: string): string => {
      // Yaygın vendor isimleri
      const vendorPatterns = [
        /(köfteci\s+\w+)/i,
        /(dönerci\s+\w+)/i,
        /(pizzacı\s+\w+)/i,
        /(burgerci\s+\w+)/i,
        /(kebapçı\s+\w+)/i,
        /(çiğköfteci\s+\w+)/i,
        /(mantıcı\s+\w+)/i,
        /(lahmacuncu\s+\w+)/i,
        /(börekçi\s+\w+)/i,
        /(simitçi\s+\w+)/i,
        /(restoran\s+\w+)/i,
        /(cafe\s+\w+)/i,
        /(migros|a101|bim|carrefour|sok|şok)/i,
        /(mc\s*donalds|burger\s*king|kfc)/i,
        /(starbucks|gloria\s*jeans)/i,
        /(dominos|pizza\s*hut)/i,
        /(subway|wendys)/i,
        /(türkiye\s+finans|kuveyt\s+türk|enpara|garanti|iş\s+bankası|akbank|yapı\s+kredi)/i
      ];
      
      for (const pattern of vendorPatterns) {
        const match = text.match(pattern);
        if (match) {
          return match[1];
        }
      }
      
      // Eğer pattern bulunamazsa, ilk iki kelimeyi vendor olarak al
      const words = text.split(' ').filter(word => 
        !word.match(/\d/) && // Sayı içermeyen
        !word.match(/tl|lira|₺/i) && // Sadece TL
        !word.match(/nakit|kredi|kart|atm|çektim|gönderdim/i) && // Ödeme yöntemi olmayan
        word.length > 2 // 2 karakterden uzun
      );
      
      if (words.length >= 2) {
        return `${words[0]} ${words[1]}`;
      } else if (words.length === 1) {
        return words[0];
      }
      
      return '';
    };

    // Transfer işlemleri için
    const transferKeywords = ['çektim', 'para çektim', 'atm', 'atm\'den', 'transfer', 'gönderdim', 'kredi kartı ödemesi', 'kart ödemesi'];
    const isTransfer = transferKeywords.some(keyword => text.toLowerCase().includes(keyword));
    
    if (isTransfer) {
      console.log('🔄 Transfer işlemi tespit edildi...');
      const transferAccounts = findTransferAccounts(text, availableAccounts);
      const amount = extractAmount(text);
      result = {
        type: 'transfer',
        amount: amount,
        description: text,
        date: extractDateFromText(text) || new Date().toISOString().split('T')[0],
        from_account_id: transferAccounts.fromAccountId,
        to_account_id: transferAccounts.toAccountId,
        category_id: '', // Transfer işlemleri için kategori yok
        account_id: transferAccounts.fromAccountId, // Ana hesap olarak gönderen hesap
        vendor: '',
        summary: `Transfer: ${amount} TL`
      };
      console.log('🔄 Yerel transfer işlemi ayrıştırıldı:', result);
      return result;
    }

    // Yemek/Gıda harcamaları için (yerel ayrıştırma)
    const foodKeywords = [
      // Et ürünleri
      'kıyma', 'köfte', 'döner', 'hamburger', 'pizza', 'sucuk', 'pastırma', 'salam', 'sosis', 'tavuk', 'balık', 'et', 'pirzola', 'bonfile',
      
      // Yemek türleri
      'yemek', 'yemek siparişi', 'restoran', 'cafe', 'kahve', 'çay', 'tatlı', 'dondurma', 'çorba', 'salata', 'pilav', 'makarna', 'mantı', 'lahmacun',
      
      // Gıda ürünleri
      'sebze', 'meyve', 'ekmek', 'süt', 'peynir', 'yoğurt', 'yumurta', 'zeytin', 'bal', 'reçel', 'çikolata', 'bisküvi', 'cips', 'fındık', 'fıstık',
      
      // İçecekler
      'su', 'meyve suyu', 'kola', 'fanta', 'sprite', 'ayran', 'şalgam', 'limonata', 'ice tea', 'enerji içeceği',
      
      // Yemek yerleri
      'köfteci', 'dönerci', 'pizzacı', 'burgerci', 'kebapçı', 'çiğköfteci', 'mantıcı', 'lahmacuncu', 'börekçi', 'simitçi'
    ];
    
    const isFoodExpense = foodKeywords.some(keyword => text.toLowerCase().includes(keyword));
    
    if (isFoodExpense) {
      console.log('🍽️ Yemek harcaması tespit edildi, yerel ayrıştırma yapılıyor...');
      
      const amount = extractAmount(text);
      const vendor = extractVendor(text);
      
      // Et ürünleri için kasap kategorisini öncelikle ara
      const meatKeywords = ['kıyma', 'et', 'pirzola', 'bonfile', 'sucuk', 'pastırma', 'salam', 'sosis'];
      const isMeatProduct = meatKeywords.some(keyword => text.toLowerCase().includes(keyword));
      
      let foodCategory;
      
      if (isMeatProduct) {
        // Et ürünleri için kasap kategorisini ara
        foodCategory = availableCategories.find(cat => 
          cat.name.toLowerCase().includes('kasap') ||
          cat.name.toLowerCase().includes('şarküteri')
        );
        console.log('🥩 Et ürünü tespit edildi, kasap kategorisi aranıyor...');
      }
      
      // Kasap kategorisi bulunamazsa genel yemek kategorilerini ara
      if (!foodCategory) {
        // Restoran kategorilerini öncelikle ara
        const restaurantKeywords = ['yemek yedik', 'köfteci', 'restoran', 'lokanta', 'dönerci', 'pizzacı', 'burgerci', 'kebapçı'];
        const isRestaurant = restaurantKeywords.some(keyword => text.toLowerCase().includes(keyword));
        
        if (isRestaurant) {
          foodCategory = availableCategories.find(cat => 
            cat.name.toLowerCase().includes('restoran') ||
            cat.name.toLowerCase().includes('lokanta')
          );
          console.log('🍽️ Restoran harcaması tespit edildi, restoran kategorisi aranıyor...');
        }
        
        // Cafe kategorilerini ara
        if (!foodCategory) {
          const cafeKeywords = ['cafe', 'kahve', 'çay', 'tatlı', 'kurabiye', 'börek'];
          const isCafe = cafeKeywords.some(keyword => text.toLowerCase().includes(keyword));
          
          if (isCafe) {
            foodCategory = availableCategories.find(cat => 
              cat.name.toLowerCase().includes('cafe') ||
              cat.name.toLowerCase().includes('kahve')
            );
            console.log('☕ Cafe harcaması tespit edildi, cafe kategorisi aranıyor...');
          }
        }
        
        // Genel yemek kategorilerini ara
        if (!foodCategory) {
          foodCategory = availableCategories.find(cat => 
            cat.name.toLowerCase().includes('yemek') || 
            cat.name.toLowerCase().includes('market') ||
            cat.name.toLowerCase().includes('gıda') ||
            cat.name.toLowerCase().includes('fast food')
          );
        }
      }
      
      // Hesap eşleştirme - öncelik sırası
      let selectedAccount = null;
      const textLower = text.toLowerCase();
      
      // 1. Marka/banka adı önceliği (örn. kuveyttürk, garanti, işbank, akbank, yapıkredi, denizbank, enpara)
      const bankBrands = ['kuveyttürk', 'garanti', 'işbank', 'akbank', 'yapıkredi', 'denizbank', 'enpara'];
      const matchedBrand = bankBrands.find(brand => textLower.includes(brand));
      if (matchedBrand) {
        // Önce adı veya açıklaması bu markayı içeren kredi kartı hesabını bul
        selectedAccount = availableAccounts.find(acc =>
          (acc.name.toLowerCase().includes(matchedBrand) || (typeof acc.description === 'string' && acc.description.toLowerCase().includes(matchedBrand))) &&
          (acc.type.toLowerCase().includes('credit') || acc.name.toLowerCase().includes('kart') || acc.name.toLowerCase().includes('kredi'))
        );
        if (selectedAccount) {
          console.log(`🏦 Marka öncelikli kredi kartı bulundu: ${matchedBrand}`);
        }
      }
      
      // 2. Genel kredi kartı anahtar kelimeleri (eğer yukarıda bulunamazsa)
      if (!selectedAccount) {
        const creditCardKeywords = ['kredi kartı', 'kart'];
        const isCreditCard = creditCardKeywords.some(keyword => textLower.includes(keyword));
        if (isCreditCard) {
          selectedAccount = availableAccounts.find(acc =>
            acc.type.toLowerCase().includes('credit') ||
            acc.name.toLowerCase().includes('kart') ||
            acc.name.toLowerCase().includes('kredi')
          );
          if (selectedAccount) {
            console.log('💳 Genel kredi kartı hesabı bulundu.');
          }
        }
      }
      
      // 3. Nakit anahtar kelimeleri (eğer yukarıda bulunamazsa)
      if (!selectedAccount) {
        const cashKeywords = ['nakit', 'cash', 'cüzdan', 'para'];
        const isCash = cashKeywords.some(keyword => textLower.includes(keyword));
        if (isCash) {
          selectedAccount = availableAccounts.find(acc =>
            acc.name.toLowerCase().includes('nakit') ||
            acc.name.toLowerCase().includes('cash') ||
            acc.type.toLowerCase().includes('cash') ||
            acc.name.toLowerCase().includes('cüzdan')
          );
          if (selectedAccount) {
            console.log('💰 Nakit hesabı bulundu.');
          }
        }
      }
      
      // 4. Varsayılan hesap (hiçbiri bulunamazsa)
      if (!selectedAccount) {
        selectedAccount = availableAccounts.length > 0 ? availableAccounts[0] : null;
        console.log('🔄 Varsayılan hesap kullanılıyor:', selectedAccount);
      }
      
      // Türkçe açıklama:
      // Önce metinde geçen banka/marka adı ile kredi kartı hesabı aranır.
      // Sonra genel kredi kartı anahtar kelimeleri ile aranır.
      // Sonra nakit anahtar kelimeleri ile aranır.
      // Hiçbiri bulunamazsa ilk hesap seçilir.
      
      result = {
        type: 'expense' as const,
        amount: amount,
        description: text,
        date: extractDateFromText(text) || new Date().toISOString().split('T')[0],
        category_id: foodCategory?.id || '',
        account_id: selectedAccount?.id || '',
        vendor: vendor,
        summary: `${vendor ? vendor + ' - ' : ''}${amount} TL ${isMeatProduct ? 'et ürünü' : 'yemek'} harcaması`
      };
      
      console.log('🔄 Yerel yemek harcaması ayrıştırıldı:', result);
      return result;
    }

    // Gelir işlemleri için
    const incomeKeywords = ['maaş', 'gelir', 'aldım', 'kazandım', 'bonus', 'prim', 'ek gelir', 'kira geliri', 'yatırım geliri', 'danışmanlık'];
    const isIncome = incomeKeywords.some(keyword => text.toLowerCase().includes(keyword));
    
    if (isIncome) {
      console.log('💰 Gelir işlemi tespit edildi...');
      
      const amount = extractAmount(text);
      const vendor = extractVendor(text);
      const incomeCategory = availableCategories.find(cat => cat.type === 'income');
      const defaultAccount = availableAccounts.length > 0 ? availableAccounts[0] : null;
      
      result = {
        type: 'income' as const,
        amount: amount,
        description: text,
        date: extractDateFromText(text) || new Date().toISOString().split('T')[0],
        category_id: incomeCategory?.id || '',
        account_id: defaultAccount?.id || '',
        vendor: vendor,
        summary: `${vendor ? vendor + ' - ' : ''}${amount} TL gelir`
      };
      
      console.log('🔄 Yerel gelir işlemi ayrıştırıldı:', result);
      return result;
    }

    // Giyim harcamaları için
    const clothingKeywords = [
      'giyim', 'kıyafet', 'tişört', 'pantolon', 'elbise', 'gömlek', 'ceket', 'mont', 'kaban', 'hırka', 'kazak',
      'ayakkabı', 'sandalet', 'bot', 'spor ayakkabı', 'topuklu', 'iç çamaşırı', 'pijama', 'spor kıyafeti',
      'çanta', 'cüzdan', 'kemer', 'şal', 'şapka', 'eldiven', 'kravat', 'yüzük', 'kolye', 'küpe', 'bilezik', 'saat'
    ];
    
    const isClothingExpense = clothingKeywords.some(keyword => text.toLowerCase().includes(keyword));
    
    if (isClothingExpense) {
      console.log('👕 Giyim harcaması tespit edildi...');
      
      const amount = extractAmount(text);
      const vendor = extractVendor(text);
      
      // Giyim kategorisini bul
      const clothingCategory = availableCategories.find(cat => 
        cat.name.toLowerCase().includes('giyim') ||
        cat.name.toLowerCase().includes('alışveriş')
      );
      
      const defaultAccount = availableAccounts.length > 0 ? availableAccounts[0] : null;
      
      result = {
        type: 'expense' as const,
        amount: amount,
        description: text,
        date: extractDateFromText(text) || new Date().toISOString().split('T')[0],
        category_id: clothingCategory?.id || '',
        account_id: defaultAccount?.id || '',
        vendor: vendor,
        summary: `${vendor ? vendor + ' - ' : ''}${amount} TL giyim harcaması`
      };
      
      console.log('🔄 Yerel giyim harcaması ayrıştırıldı:', result);
      return result;
    }

    // Genel gider işlemleri için
    const expenseKeywords = [
      'alışveriş', 'harcama', 'ödeme', 'fatura', 'market', 'ulaşım', 'benzin', 'yakıt', 'sağlık', 'eğitim', 
      'eğlence', 'konut', 'kira', 'elektrik', 'su', 'doğalgaz', 'internet', 'telefon', 'sigorta', 'otopark'
    ];
    const isGeneralExpense = expenseKeywords.some(keyword => text.toLowerCase().includes(keyword));
    
    if (isGeneralExpense) {
      console.log('💸 Genel gider işlemi tespit edildi...');
      
      const amount = extractAmount(text);
      const vendor = extractVendor(text);
      const expenseCategory = availableCategories.find(cat => cat.type === 'expense');
      const defaultAccount = availableAccounts.length > 0 ? availableAccounts[0] : null;
      
      result = {
        type: 'expense' as const,
        amount: amount,
        description: text,
        date: extractDateFromText(text) || new Date().toISOString().split('T')[0],
        category_id: expenseCategory?.id || '',
        account_id: defaultAccount?.id || '',
        vendor: vendor,
        summary: `${vendor ? vendor + ' - ' : ''}${amount} TL harcama`
      };
      
      console.log('🔄 Yerel genel gider işlemi ayrıştırıldı:', result);
      return result;
    }

    // Genel harcama (son çare) - tutar varsa
    const amount = extractAmount(text);
    if (amount > 0) {
      console.log('💰 Tutar bulundu, genel harcama olarak işaretleniyor...');
      
      const expenseCategory = availableCategories.find(cat => cat.type === 'expense');
      const defaultAccount = availableAccounts.length > 0 ? availableAccounts[0] : null;
      const vendor = extractVendor(text);
      
      result = {
        type: 'expense' as const,
        amount: amount,
        description: text,
        date: extractDateFromText(text) || new Date().toISOString().split('T')[0],
        category_id: expenseCategory?.id || '',
        account_id: defaultAccount?.id || '',
        vendor: vendor,
        summary: `${vendor ? vendor + ' - ' : ''}${amount} TL genel harcama`
      };
      
      console.log('🔄 Genel harcama ayrıştırıldı:', result);
      return result;
    }

    // Yerel ayrıştırma başarısızsa null döndür
    console.log('❌ Yerel ayrıştırma başarısız oldu.');
    return null;
  };

  const parseNaturalLanguage = async () => {
    if (!naturalLanguageInput.trim()) return;

    console.log('🚀 Doğal dil ayrıştırma başlatılıyor...');
    console.log('📝 Input text:', naturalLanguageInput);
    console.log('🔧 Gemini configured:', GeminiService.isConfigured());
    console.log('📊 Mevcut kategoriler:', categories.map(c => ({ id: c.id, name: c.name, type: c.type })));
    console.log('🏦 Mevcut hesaplar:', accounts.map(a => ({ id: a.id, name: a.name, type: a.type })));

    setAiLoading(true);
    try {
      if (GeminiService.isConfigured()) {
        console.log('✅ Gemini AI yapılandırılmış, API çağrısı yapılıyor...');
        
        // Kategoriler ve hesaplar yüklenene kadar bekle
        if (categories.length === 0 || accounts.length === 0) {
          console.log('⏳ Kategoriler ve hesaplar yükleniyor, bekleniyor...');
          toast.error('Veriler yükleniyor, lütfen bekleyin...');
          return;
        }
        
        // İşlem türünü önceden belirle
        const textLower = naturalLanguageInput.toLowerCase();
        
        // Transfer işlemleri için anahtar kelimeler
        const isTransfer = textLower.includes('transfer') || 
                          textLower.includes('çektim') || 
                          textLower.includes('para çektim') ||
                          textLower.includes('atm') ||
                          textLower.includes('kredi kartı ödemesi') ||
                          textLower.includes('gönderdim');
        
        // Gelir işlemleri için anahtar kelimeler
        const isIncome = textLower.includes('maaş') || 
                        textLower.includes('gelir') ||
                        textLower.includes('geldi') ||
                        textLower.includes('aldım') ||
                        textLower.includes('kazandım') ||
                        textLower.includes('bonus') ||
                        textLower.includes('prim') ||
                        textLower.includes('ek gelir') ||
                        textLower.includes('kira geliri') ||
                        textLower.includes('yatırım geliri');
        
        // Gider işlemleri için anahtar kelimeler
        const isExpense = textLower.includes('alışveriş') || 
                         textLower.includes('harcama') ||
                         textLower.includes('ödeme') ||
                         textLower.includes('fatura') ||
                         textLower.includes('market') ||
                         textLower.includes('restoran') ||
                         textLower.includes('yemek') ||
                         textLower.includes('ulaşım') ||
                         textLower.includes('benzin') ||
                         textLower.includes('yakıt') ||
                         textLower.includes('sağlık') ||
                         textLower.includes('eğitim') ||
                         textLower.includes('giyim') ||
                         textLower.includes('eğlence');
        
        let result: any;
        
        try {
          if (isTransfer) {
            console.log('🔄 Transfer işlemi tespit edildi, transfer AI fonksiyonu çağrılıyor...');
            result = await GeminiService.parseTransfer(naturalLanguageInput, accounts);
          } else if (isIncome) {
            console.log('🔄 Gelir işlemi tespit edildi, gelir AI fonksiyonu çağrılıyor...');
            const incomePrompt = `Bu bir gelir işlemidir: ${naturalLanguageInput}`;
            result = await GeminiService.parseIncomeExpense(incomePrompt, categories, accounts);
          } else if (isExpense) {
            console.log('🔄 Gider işlemi tespit edildi, gider AI fonksiyonu çağrılıyor...');
            const expensePrompt = `Bu bir gider işlemidir: ${naturalLanguageInput}`;
            result = await GeminiService.parseIncomeExpense(expensePrompt, categories, accounts);
          } else {
            console.log('🔄 İşlem türü belirsiz, genel AI fonksiyonu çağrılıyor...');
            result = await GeminiService.parseIncomeExpense(naturalLanguageInput, categories, accounts);
          }
        } catch (aiError) {
          console.error('❌ AI servisi hatası:', aiError);
          
          // AI hatası durumunda yerel ayrıştırma dene
          console.log('🔄 AI hatası, yerel ayrıştırma deneniyor...');
          result = await parseLocally(naturalLanguageInput, categories, accounts);
          
          if (!result) {
            toast.error('AI servisi ve yerel ayrıştırma başarısız oldu. Lütfen manuel giriş yapın.');
            return;
          }
        }
        
        // AI veya yerel ayrıştırma sonucunu işle
        console.log('🎯 Ayrıştırma sonucu:', result);
        
        if (!result) {
          throw new Error('Ayrıştırma sonucu döndürmedi');
        }
        
        // Transfer işlemleri için özel işleme
        if (result.type === 'transfer') {
          console.log('🔄 Transfer işlemi işleniyor...');
          
          const newFormData = {
            type: 'transfer' as const,
            amount: result.amount,
            description: result.description,
            date: result.date,
            from_account_id: result.from_account_id,
            to_account_id: result.to_account_id,
            category_id: '', // Transfer işlemleri için kategori yok
            account_id: result.account_id
          };
          
          setFormData(prev => ({
            ...prev,
            ...newFormData
          }));
          
          if (result.summary) {
            toast.success(`Transfer özeti: ${result.summary}`, { duration: 5000 });
          }
          
          toast.success('Transfer işlemi başarıyla ayrıştırıldı!');
          setNaturalLanguageInput('');
          setShowNaturalLanguage(false);
          return;
        }
        
        // Gelir/Gider işlemleri için normal işleme
        console.log('🔄 Gelir/Gider işlemi işleniyor...');
        
        // ID'den kategori bulma
        const matchingCategory = categories.find(cat => cat.id === result.category_id);
        console.log('🏷️ ID ile bulunan kategori:', matchingCategory);
        
        if (!matchingCategory) {
          console.warn('⚠️ Kategori ID bulunamadı:', result.category_id);
          console.log('📋 Mevcut kategori ID\'leri:', categories.map(c => c.id));
          
          // Kategori bulunamazsa yerel eşleştirme dene
          const localCategory = findBestCategoryMatch(naturalLanguageInput, result.type, categories);
          if (localCategory) {
            console.log('🔄 Yerel kategori eşleştirmesi:', localCategory);
            result.category_id = localCategory.id;
          } else {
            toast.error('Kategori bulunamadı, manuel seçim yapın');
            return;
          }
        }

        // Kategoriyi tekrar bul (yerel eşleştirme sonrası)
        const finalMatchingCategory = categories.find(cat => cat.id === result.category_id);
        console.log('🏷️ Final kategori eşleştirmesi:', finalMatchingCategory);

        // Ana kategoriyi bul ve seç
        let mainCategoryId: string | null = null;
        let selectedCategoryId = result.category_id;
        
        if (finalMatchingCategory) {
          if ((finalMatchingCategory as any).parent_id) {
            // Alt kategori ise, ana kategorisini bul
            mainCategoryId = (finalMatchingCategory as any).parent_id;
            selectedCategoryId = result.category_id; // Alt kategori ID'sini koru
            console.log('🏷️ Alt kategori tespit edildi, ana kategori ID:', mainCategoryId);
          } else {
            // Ana kategori ise, kendisi
            mainCategoryId = finalMatchingCategory.id;
            selectedCategoryId = result.category_id; // Ana kategori ID'sini koru
            console.log('🏷️ Ana kategori tespit edildi, ID:', mainCategoryId);
          }
          
          console.log('🏷️ Ana kategori ID:', mainCategoryId);
          console.log('🏷️ Seçilen kategori ID:', selectedCategoryId);
          
          // Ana kategoriyi seç ve alt kategorileri yükle
          setSelectedMainCategory(mainCategoryId);
          setShowSubcategories(true);
          
          // Alt kategorileri yükle (eğer ana kategori ise)
          if (user && !(finalMatchingCategory as any).parent_id && mainCategoryId) {
            console.log('🔄 Alt kategoriler yükleniyor...');
            await loadSubcategories(user.id, mainCategoryId);
            
            // Alt kategoriler yüklendikten sonra tekrar kontrol et
            // Eğer seçilen kategori alt kategorilerde varsa onu seç
            const updatedSubcategories = subcategories.filter(sub => sub.parent_id === mainCategoryId);
            if (updatedSubcategories.length > 0) {
              // İlk alt kategoriyi varsayılan olarak seç
              const defaultSubcategory = updatedSubcategories[0];
              console.log('🔄 Varsayılan alt kategori seçiliyor:', defaultSubcategory);
              selectedCategoryId = defaultSubcategory.id;
            }
          }
          
          // Alt kategorilerin yüklenmesi için kısa bir bekleme
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          console.warn('⚠️ Kategori bulunamadı, varsayılan değerler kullanılıyor');
          selectedCategoryId = result.category_id;
        }
        
        // ID'den hesap bulma
        const matchingAccount = accounts.find(acc => acc.id === result.account_id);
        console.log('🏦 ID ile bulunan hesap:', matchingAccount);
        
        if (!matchingAccount && result.account_id) {
          console.warn('⚠️ Hesap ID bulunamadı:', result.account_id);
          console.log('📋 Mevcut hesap ID\'leri:', accounts.map(a => a.id));
          
          // Hesap bulunamazsa yerel eşleştirme dene
          const localAccount = findBestAccountMatch(naturalLanguageInput, accounts);
          if (localAccount) {
            console.log('🔄 Yerel hesap eşleştirmesi:', localAccount);
            result.account_id = localAccount.id;
          } else {
            // Hesap bulunamazsa ilk hesabı kullan
            if (accounts.length > 0) {
              console.log('🔄 İlk hesap kullanılıyor:', accounts[0]);
              result.account_id = accounts[0].id;
            }
          }
        }

        // Tarih çıkarma (bugün varsayılan)
        const extractedDate = extractDateFromText(naturalLanguageInput) || new Date().toISOString().split('T')[0];
        console.log('📅 Çıkarılan tarih:', extractedDate);

        // Vendor ve özet bilgisi
        console.log('🏪 Vendor bilgisi:', result.vendor);
        console.log('📋 Alışveriş özeti:', result.summary);

        const newFormData = {
          type: result.type,
          amount: result.amount,
          description: result.description,
          date: extractedDate,
          vendor: result.vendor || '',
          category_id: selectedCategoryId, // Doğru kategori ID'sini kullan
          account_id: result.account_id || (accounts.length > 0 ? accounts[0].id : '')
        };
        
        console.log('📝 Gelir/Gider form verisi:', newFormData);

        setFormData(prev => ({
          ...prev,
          ...newFormData
        }));

        // Alışveriş özeti varsa göster
        if (result.summary) {
          toast.success(`Alışveriş özeti: ${result.summary}`, { duration: 5000 });
        }

        console.log('✅ Gelir/Gider form güncellendi');
        toast.success('Doğal dil işlemi başarıyla ayrıştırıldı!');
        setNaturalLanguageInput('');
        setShowNaturalLanguage(false);
      } else {
        console.error('❌ Gemini AI yapılandırılmamış');
        toast.error('Gemini AI yapılandırılmamış, yerel ayrıştırma deneniyor...');
        
        // AI yapılandırılmamışsa yerel ayrıştırma dene
        const result = await parseLocally(naturalLanguageInput, categories, accounts);
        if (result) {
          // Yerel ayrıştırma sonucunu işle
          console.log('✅ Yerel ayrıştırma başarılı:', result);
          toast.success('Yerel ayrıştırma başarılı!');
        } else {
          toast.error('Yerel ayrıştırma da başarısız, manuel giriş yapın');
        }
      }
    } catch (error) {
      console.error('❌ Natural language parsing error:', error);
      toast.error(`Doğal dil ayrıştırma hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    } finally {
      setAiLoading(false);
    }
  };

  const getSmartSuggestions = () => {
    const suggestions: any[] = [];
    
    // Suggest based on recent transactions
    recentTransactions.forEach(transaction => {
      if (transaction.type === formData.type && transaction.amount > 0) {
        if (formData.type === 'transfer') {
          // Transfer işlemleri için sadece açıklama ve tutar
          suggestions.push({
            type: 'recent',
            title: transaction.description,
            amount: transaction.amount
          });
        } else {
          // Gelir/Gider işlemleri için tüm alanlar
          if (transaction.category_id) {
            suggestions.push({
              type: 'recent',
              title: transaction.description,
              amount: transaction.amount,
              category_id: transaction.category_id,
              account_id: transaction.account_id
            });
          }
        }
      }
    });

    // Suggest based on common amounts
    const commonAmounts = [10, 20, 50, 100, 200, 500, 1000];
    commonAmounts.forEach(amount => {
      if (amount !== formData.amount) {
        suggestions.push({
          type: 'amount',
          title: `${amount} USD`,
          amount: amount
        });
      }
    });

    setSmartSuggestions(suggestions.slice(0, 5));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || formData.amount <= 0) {
      toast.error('Geçerli bir tutar girin');
      return;
    }

    if (formData.type === 'transfer') {
      // Transfer işlemleri için özel validasyon
      if (!formData.from_account_id) {
        toast.error('Gönderen hesap seçin');
        return;
      }
      if (!formData.to_account_id) {
        toast.error('Alıcı hesap seçin');
        return;
      }
      if (formData.from_account_id === formData.to_account_id) {
        toast.error('Aynı hesaptan aynı hesaba transfer yapamazsınız');
        return;
      }
    } else {
      // Gelir/Gider işlemleri için normal validasyon
      if (!formData.category_id) {
        toast.error('Kategori seçin');
        return;
      }
      if (!formData.account_id) {
        toast.error('Hesap seçin');
        return;
      }
    }

    setLoading(true);
    try {
      // Eğer taksitli işlem ise, TransactionService kullanarak oluştur
      if (formData.payment_method === 'kredi kartı' && formData.installments && formData.installments > 1) {
        console.log('🚀 Taksitli işlem başlatılıyor:', {
          toplamTutar: formData.amount,
          taksitSayisi: formData.installments,
          baslangicTarihi: formData.date,
          odemeYontemi: formData.payment_method,
          kategori: formData.category_id,
          hesap: formData.account_id,
          aciklama: formData.description || 'Açıklama yok'
        });
        
        console.log('📋 TransactionService.createInstallmentTransaction çağrılıyor...');
        
        try {
          // TransactionService kullanarak taksitli işlem oluştur
          const groupId = await TransactionService.createInstallmentTransaction(user!.id, {
            type: formData.type as 'income' | 'expense' | 'transfer',
            amount: formData.amount,
            description: formData.description || 'Açıklama yok',
            date: formData.date,
            payment_method: formData.payment_method,
            vendor: formData.vendor,
            installments: formData.installments,
            category_id: formData.category_id,
            account_id: formData.account_id
          });
          
          console.log('✅ Taksitli işlem başarıyla oluşturuldu! Group ID:', groupId);
          toast.success('Taksitli işlem başarıyla eklendi!');
          navigate('/transactions');
          return;
        } catch (error) {
          console.error('❌ TransactionService.createInstallmentTransaction hatası:', error);
          throw error; // Hatayı yukarı fırlat
        }
      }

      const transactionData = {
        user_id: user?.id,
        type: formData.type,
        amount: formData.amount,
        description: formData.description || (formData.type === 'transfer' ? 
          `Transfer: ${accounts.find(acc => acc.id === formData.from_account_id)?.name} → ${accounts.find(acc => acc.id === formData.to_account_id)?.name}` : 
          'Açıklama yok'),
        date: formData.date,
        payment_method: formData.payment_method,
        vendor: formData.vendor,
        installments: formData.installments
      };

      // Transfer işlemleri için farklı alanlar
      if (formData.type === 'transfer') {
        Object.assign(transactionData, {
          from_account_id: formData.from_account_id,
          to_account_id: formData.to_account_id,
          account_id: formData.from_account_id, // Ana hesap olarak gönderen hesap
          category_id: null // Transfer işlemleri için kategori yok
        });
      } else {
        Object.assign(transactionData, {
          category_id: formData.category_id,
          account_id: formData.account_id
        });
      }

      const { error } = await supabase
        .from('spendme_transactions')
        .insert(transactionData);

      if (error) throw error;

      const successMessage = formData.type === 'transfer' ? 'Transfer başarıyla eklendi!' :
        formData.type === 'income' ? 'Gelir başarıyla eklendi!' : 'Gider başarıyla eklendi!';
      
      toast.success(successMessage);
      navigate('/transactions');
    } catch (error: any) {
      console.error('❌ İşlem ekleme hatası:', error);
      console.error('📋 Hata detayları:', {
        message: error.message,
        stack: error.stack,
        formData: formData
      });
      
      // Hata mesajını daha detaylı göster
      let errorMessage = 'İşlem eklenirken hata oluştu';
      if (error.message) {
        if (error.message.includes('installment')) {
          errorMessage = 'Taksitli işlem oluşturulurken hata oluştu';
        } else if (error.message.includes('database')) {
          errorMessage = 'Veritabanı hatası oluştu';
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Hesap seçildiğinde otomatik ödeme yöntemi ve taksit alanı kontrolü
  const handleAccountSelect = (accountId: string) => {
    console.log('🏦 Hesap seçimi başlatıldı:', accountId);
    
    const selectedAccount = accounts.find(acc => acc.id === accountId);
    let paymentMethod = '';
    let showInstallments = false;
    
    console.log('📋 Seçilen hesap:', selectedAccount);
    
    if (selectedAccount) {
      // Hesap tipine göre otomatik ödeme yöntemi belirleme
      switch(selectedAccount.type) {
        case 'credit_card':
          paymentMethod = 'kredi kartı';
          showInstallments = true; // Kredi kartı seçilince taksit alanını aç
          console.log('💳 Kredi kartı seçildi - taksit alanı açılacak');
          break;
        case 'bank':
          paymentMethod = 'banka';
          console.log('🏛️ Banka hesabı seçildi');
          break;
        case 'cash':
          paymentMethod = 'nakit';
          console.log('💵 Nakit hesabı seçildi');
          break;
        case 'wallet':
          paymentMethod = 'dijital';
          console.log('📱 Dijital cüzdan seçildi');
          break;
        default:
          paymentMethod = 'diğer';
          console.log('❓ Diğer hesap tipi seçildi:', selectedAccount.type);
          break;
      }
    }
    
    console.log('🔧 Belirlenen ödeme yöntemi:', paymentMethod);
    console.log('📊 Taksit alanı gösterilecek mi:', showInstallments);
    
    // Form verilerini güncelle
    setFormData(prev => ({ 
      ...prev, 
      account_id: accountId,
      payment_method: paymentMethod 
    }));
    
    // Kredi kartı seçilirse taksit alanını göster, değilse gizle
    if (showInstallments) {
      setShowInstallmentField(true);
      console.log('✅ Taksit alanı gösterildi');
    } else {
      setShowInstallmentField(false);
      setFormData(prev => ({ ...prev, installments: 1 })); // Taksit sayısını sıfırla
      console.log('❌ Taksit alanı gizlendi, taksit sayısı 1 olarak ayarlandı');
    }
  };

  // Mevcut handleInputChange fonksiyonunu güncelle
  const handleInputChange = (field: string, value: any) => {
    // Amount için özel işlem - 0 değerini boş string olarak göster
    if (field === 'amount') {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Reset fields when type changes
    if (field === 'type') {
      if (value === 'transfer') {
        // Transfer işlemi için kategori ve normal hesap alanlarını temizle
        setFormData(prev => ({ 
          ...prev, 
          category_id: '',
          account_id: '',
          from_account_id: '',
          to_account_id: ''
        }));
      } else {
        // Gelir/Gider işlemi için transfer alanlarını temizle
        setFormData(prev => ({ 
          ...prev, 
          from_account_id: '',
          to_account_id: ''
        }));
      }
    }
    
    // Hesap seçimi değiştiğinde otomatik ödeme yöntemi belirleme
    if (field === 'account_id' && value) {
      handleAccountSelect(value);
    }
  };

  const applySuggestion = (suggestion: any) => {
    if (suggestion.type === 'recent') {
      if (formData.type === 'transfer') {
        // Transfer işlemleri için sadece açıklama ve tutar
        setFormData(prev => ({
          ...prev,
          description: suggestion.title,
          amount: suggestion.amount
        }));
      } else {
        // Gelir/Gider işlemleri için tüm alanlar
        setFormData(prev => ({
          ...prev,
          description: suggestion.title,
          amount: suggestion.amount,
          category_id: suggestion.category_id,
          account_id: suggestion.account_id
        }));
      }
    } else if (suggestion.type === 'amount') {
      setFormData(prev => ({
        ...prev,
        amount: suggestion.amount
      }));
    }
  };

  const quickAmounts = [10, 20, 50, 100, 200, 500, 1000];

  // Akıllı kategori eşleştirme fonksiyonu
  const findBestCategoryMatch = (aiCategory: string, type: 'income' | 'expense' | 'transfer', availableCategories: Category[]) => {
    const aiCategoryLower = aiCategory.toLowerCase();
    
    // Önce alt kategorilerde tam eşleşme ara
    let match = availableCategories.find(cat => 
      cat.name.toLowerCase() === aiCategoryLower && 
      cat.type === type && 
      cat.parent_id // Alt kategori olduğunu kontrol et
    );
    
    if (match) return match;
    
    // Alt kategorilerde kısmi eşleşme ara
    match = availableCategories.find(cat => 
      cat.name.toLowerCase().includes(aiCategoryLower) && 
      cat.type === type && 
      cat.parent_id
    );
    
    if (match) return match;
    
    // Ana kategorilerde tam eşleşme ara
    match = availableCategories.find(cat => 
      cat.name.toLowerCase() === aiCategoryLower && 
      cat.type === type && 
      !cat.parent_id // Ana kategori olduğunu kontrol et
    );
    
    if (match) return match;
    
    // Ana kategorilerde kısmi eşleşme ara
    match = availableCategories.find(cat => 
      cat.name.toLowerCase().includes(aiCategoryLower) && 
      cat.type === type && 
      !cat.parent_id
    );
    
    if (match) return match;
    
    // AI kategori adını bizim kategorilerimizle eşleştir
    const categoryMappings: { [key: string]: string } = {
      'market': 'Market',
      'alışveriş': 'Market',
      'süpermarket': 'Market',
      'gıda': 'Market',
      'kıyma': 'Kasap',
      'et': 'Kasap',
      'tavuk': 'Kasap',
      'balık': 'Kasap',
      'sucuk': 'Kasap',
      'pastırma': 'Kasap',
      'sosis': 'Kasap',
      'kasap': 'Kasap',
      'ulaşım': 'Ulaşım',
      'transport': 'Ulaşım',
      'otobüs': 'Ulaşım',
      'metro': 'Ulaşım',
      'taksi': 'Ulaşım',
      'fatura': 'Faturalar',
      'elektrik': 'Faturalar',
      'su': 'Faturalar',
      'internet': 'Faturalar',
      'sağlık': 'Sağlık',
      'hastane': 'Sağlık',
      'eczane': 'Sağlık',
      'doktor': 'Sağlık',
      'eğlence': 'Eğlence',
      'sinema': 'Eğlence',
      'restoran': 'Eğlence',
      'kafe': 'Eğlence',
      'mağaza': 'Eğlence',
      'maaş': 'Maaş',
      'gelir': 'Maaş',
      'ek gelir': 'Ek Gelir',
      'bonus': 'Ek Gelir',
      'prim': 'Ek Gelir',
      // Giyim kategorileri
      'giyim': 'Giyim',
      'kıyafet': 'Giyim',
      'erkek giyim': 'Erkek Giyim',
      'erkek kıyafet': 'Erkek Giyim',
      'gömlek': 'Erkek Giyim',
      'pantolon': 'Erkek Giyim',
      'ceket': 'Erkek Giyim',
      'kadın giyim': 'Kadın Giyim',
      'kadın kıyafet': 'Kadın Giyim',
      'elbise': 'Kadın Giyim',
      'bluz': 'Kadın Giyim',
      'etek': 'Kadın Giyim',
      'çocuk giyim': 'Çocuk Giyim',
      'bebek kıyafet': 'Çocuk Giyim',
      'çocuk elbise': 'Çocuk Giyim',
      'ayakkabı': 'Ayakkabı',
      'ayak': 'Ayakkabı',
      'sandalet': 'Ayakkabı',
      'topuklu': 'Ayakkabı',
      'spor ayakkabı': 'Ayakkabı',
      'aksesuar': 'Aksesuar',
      'kolye': 'Aksesuar',
      'bilezik': 'Aksesuar',
      'saat': 'Aksesuar',
      'gözlük': 'Aksesuar',
      'iç giyim': 'İç Giyim',
      'iç çamaşır': 'İç Giyim',
      'pijama': 'İç Giyim',
      'spor giyim': 'Spor Giyim',
      'spor kıyafet': 'Spor Giyim',
      'eşofman': 'Spor Giyim',
      'takı': 'Takı & Mücevher',
      'mücevher': 'Takı & Mücevher',
      'yüzük': 'Takı & Mücevher',
      'küpe': 'Takı & Mücevher',
      'kozmetik': 'Kozmetik & Bakım',
      'makyaj': 'Kozmetik & Bakım',
      'parfüm': 'Kozmetik & Bakım',
      'bakım': 'Kozmetik & Bakım',
      'çanta': 'Çanta & Cüzdan',
      'cüzdan': 'Çanta & Cüzdan',
      'sırt çantası': 'Çanta & Cüzdan'
    };
    
    const mappedCategory = categoryMappings[aiCategoryLower];
    if (mappedCategory) {
      // Önce alt kategorilerde ara
      let mappedMatch = availableCategories.find(cat => 
        cat.name === mappedCategory && cat.type === type && cat.parent_id
      );
      
      if (mappedMatch) return mappedMatch;
      
      // Alt kategori yoksa ana kategoride ara
      mappedMatch = availableCategories.find(cat => 
        cat.name === mappedCategory && cat.type === type && !cat.parent_id
      );
      
      if (mappedMatch) return mappedMatch;
    }
    
    // Varsayılan kategori (önce alt kategorilerde ara)
    const defaultCategory = availableCategories.find(cat => 
      cat.name === 'Diğer' && cat.type === type && cat.parent_id
    );
    
    if (defaultCategory) return defaultCategory;
    
    // Alt kategori yoksa ana kategori
    return availableCategories.find(cat => cat.name === 'Diğer' && cat.type === type && !cat.parent_id);
  };

  // Transfer işlemleri için hesap eşleştirme fonksiyonu
  const findTransferAccounts = (text: string, availableAccounts: Account[]) => {
    const textLower = text.toLowerCase();
    let fromAccountId = '';
    let toAccountId = '';
    
    // Para çekme işlemleri (banka → nakit)
    if (textLower.includes('çektim') || textLower.includes('para çektim') || 
        textLower.includes('atm') || textLower.includes('atm\'den')) {
      
      // Gönderen hesap (banka)
      const bankAccount = availableAccounts.find(acc => 
        acc.type === 'bank' || 
        acc.name.toLowerCase().includes('banka') ||
        acc.name.toLowerCase().includes('bank') ||
        textLower.includes(acc.name.toLowerCase())
      );
      
      // Alıcı hesap (nakit)
      const cashAccount = availableAccounts.find(acc => 
        acc.type === 'cash' || 
        acc.name.toLowerCase().includes('nakit') ||
        acc.name.toLowerCase().includes('cüzdan') ||
        acc.name.toLowerCase().includes('cash')
      );
      
      if (bankAccount) fromAccountId = bankAccount.id;
      if (cashAccount) toAccountId = cashAccount.id;
    }
    
    // Kredi kartı ödemesi (banka → kredi kartı)
    else if (textLower.includes('kredi kartı ödemesi') || 
             textLower.includes('kart ödemesi') ||
             textLower.includes('kredi kartı')) {
      
      // Gönderen hesap (banka)
      const bankAccount = availableAccounts.find(acc => 
        acc.type === 'bank' || 
        acc.name.toLowerCase().includes('banka') ||
        acc.name.toLowerCase().includes('bank')
      );
      
      // Alıcı hesap (kredi kartı)
      const creditAccount = availableAccounts.find(acc => 
        acc.type === 'credit' || 
        acc.name.toLowerCase().includes('kredi') ||
        acc.name.toLowerCase().includes('credit')
      );
      
      if (bankAccount) fromAccountId = bankAccount.id;
      if (creditAccount) toAccountId = creditAccount.id;
    }
    
    // Genel transfer işlemleri
    else if (textLower.includes('transfer') || textLower.includes('gönderdim')) {
      // İlk iki hesabı kullan
      if (availableAccounts.length >= 2) {
        fromAccountId = availableAccounts[0].id;
        toAccountId = availableAccounts[1].id;
      }
    }
    
    // Varsayılan değerler
    if (!fromAccountId && availableAccounts.length > 0) {
      fromAccountId = availableAccounts[0].id;
    }
    if (!toAccountId && availableAccounts.length > 1) {
      toAccountId = availableAccounts[1].id;
    }
    
    return { fromAccountId, toAccountId };
  };

  // Akıllı hesap eşleştirme fonksiyonu
  const findBestAccountMatch = (text: string, availableAccounts: Account[]) => {
    const textLower = text.toLowerCase();
    
    // Hesap adlarını ara (tam eşleşme)
    for (const account of availableAccounts) {
      if (textLower.includes(account.name.toLowerCase())) {
        return account;
      }
    }
    
    // Transfer işlemleri için özel eşleştirme
    if (textLower.includes('çektim') || textLower.includes('para çektim') || 
        textLower.includes('nakit') || textLower.includes('cüzdan')) {
      // Nakit hesabı ara
      const cashAccount = availableAccounts.find(acc => 
        acc.type === 'cash' || acc.name.toLowerCase().includes('nakit') || 
        acc.name.toLowerCase().includes('cüzdan')
      );
      if (cashAccount) return cashAccount;
    }
    
    // Banka hesapları için eşleştirme
    if (textLower.includes('türkiye finans') || textLower.includes('garanti') || 
        textLower.includes('iş bankası') || textLower.includes('akbank') ||
        textLower.includes('banka') || textLower.includes('bank')) {
      // Banka hesabı ara
      const bankAccount = availableAccounts.find(acc => 
        acc.type === 'bank' || acc.name.toLowerCase().includes('banka') ||
        acc.name.toLowerCase().includes('bank')
      );
      if (bankAccount) return bankAccount;
    }
    
    // Kredi kartı anahtar kelimeleri
    if (textLower.includes('kredi kartı') || textLower.includes('credit card') ||
        textLower.includes('kart') || textLower.includes('card')) {
      const creditAccount = availableAccounts.find(acc => 
        acc.type === 'credit' || acc.name.toLowerCase().includes('kredi') ||
        acc.name.toLowerCase().includes('credit')
      );
      if (creditAccount) return creditAccount;
    }
    
    // ATM'den para çekme
    if (textLower.includes('atm') || textLower.includes('atm\'den')) {
      // Banka hesabı ara (ATM genellikle banka hesabından para çekme)
      const bankAccount = availableAccounts.find(acc => 
        acc.type === 'bank' || acc.name.toLowerCase().includes('banka')
      );
      if (bankAccount) return bankAccount;
    }
    
    // Varsayılan olarak ilk hesabı döndür
    return availableAccounts[0];
  };

  // Tarih çıkarma fonksiyonu
  const extractDateFromText = (text: string): string | null => {
    const textLower = text.toLowerCase();
    
    // Bugün
    if (textLower.includes('bugün') || textLower.includes('today')) {
      return new Date().toISOString().split('T')[0];
    }
    
    // Dün
    if (textLower.includes('dün') || textLower.includes('yesterday')) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    }
    
    // Yarın
    if (textLower.includes('yarın') || textLower.includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    
    // Tarih formatları (DD/MM/YYYY, DD-MM-YYYY, vb.)
    const dateRegex = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/;
    const match = text.match(dateRegex);
    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return null; // Tarih bulunamadı
  };

  const handleMainCategorySelect = async (categoryId: string) => {
    setSelectedMainCategory(categoryId);
    setShowSubcategories(true);
    setFormData(prev => ({ ...prev, category_id: '' })); // Alt kategori seçimini sıfırla
    
    if (user) {
      await loadSubcategories(user.id, categoryId);
    }
  };

  const handleSubcategorySelect = (categoryId: string) => {
    setFormData(prev => ({ ...prev, category_id: categoryId }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* AI Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative max-w-2xl mx-auto p-2 sm:p-4 pt-4 sm:pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/transactions')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Destekli
                </span>
                <br />
                İşlem Ekle
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Akıllı önerilerle hızlı işlem girişi
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-blue-600">
            <Brain className="h-5 w-5" />
            <span className="text-sm font-medium">AI Aktif</span>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Natural Language Input */}
            <div>
              <button
                type="button"
                onClick={() => setShowNaturalLanguage(!showNaturalLanguage)}
                className="w-full p-3 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg text-blue-600 dark:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500 transition-colors flex items-center justify-center space-x-2 mb-4"
              >
                <Brain className="h-4 w-4" />
                <span>Doğal Dil ile İşlem Ekle</span>
              </button>
              
              {showNaturalLanguage && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <div className="flex items-center mb-3">
                    <Bot className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Gemini AI ile Doğal Dil Ayrıştırma
                    </span>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={naturalLanguageInput}
                      onChange={(e) => setNaturalLanguageInput(e.target.value)}
                      className="block w-full px-4 py-3 border border-blue-300 dark:border-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Örnek: Bugün marketten 150 TL alışveriş yaptım"
                    />
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={parseNaturalLanguage}
                        disabled={aiLoading || !naturalLanguageInput.trim()}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {aiLoading ? 'Ayrıştırılıyor...' : 'Ayrıştır'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNaturalLanguageInput('');
                          setShowNaturalLanguage(false);
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        İptal
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Örnekler: "Maaşım geldi 5000 TL", "Benzin aldım 200 TL", "Restoranda yemek yedim 80 TL"
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                İşlem Türü
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => handleInputChange('type', 'expense')}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
                    formData.type === 'expense'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-600'
                  }`}
                >
                  <TrendingDown className="h-5 w-5" />
                  <span className="font-medium">Gider</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('type', 'income')}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
                    formData.type === 'income'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600'
                  }`}
                >
                  <TrendingUp className="h-5 w-5" />
                  <span className="font-medium">Gelir</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('type', 'transfer')}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
                    formData.type === 'transfer'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
                >
                  <ArrowRight className="h-5 w-5" />
                  <span className="font-medium">Transfer</span>
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Tutar
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-lg font-medium">₺</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount === 0 ? '' : formData.amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Eğer boş string ise 0 olarak ayarla, değilse parse et
                    const numValue = value === '' ? 0 : parseFloat(value);
                    handleInputChange('amount', numValue);
                  }}
                  className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-lg font-medium"
                  placeholder="0.00"
                />
              </div>
              
              {/* Quick Amount Buttons */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowQuickAmounts(!showQuickAmounts)}
                  className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 flex items-center space-x-1"
                >
                  <Zap className="h-4 w-4" />
                  <span>Hızlı tutarlar</span>
                </button>
                {showQuickAmounts && (
                  <div className="mt-2 flex flex-wrap gap-1 sm:gap-2">
                    {quickAmounts.map(amount => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => handleInputChange('amount', amount)}
                        className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        {amount} TL
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Category */}
            {formData.type !== 'transfer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Kategori
                </label>
              
                {/* Ana Kategoriler */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Ana Kategoriler
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {mainCategories
                      .filter(cat => cat.type === formData.type)
                      .map(category => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => handleMainCategorySelect(category.id)}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
                            selectedMainCategory === category.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                          }`}
                        >
                          {category.icon && <span className="text-lg">{category.icon}</span>}
                          <span className="text-sm font-medium">{category.name}</span>
                        </button>
                      ))}
                  </div>
                </div>
                
                {/* Alt Kategoriler */}
                {showSubcategories && selectedMainCategory && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Alt Kategoriler
                    </h4>
                    {subcategories.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {subcategories.map(category => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => handleSubcategorySelect(category.id)}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
                              formData.category_id === category.id
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                : 'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600'
                            }`}
                          >
                            {category.icon && <span className="text-lg">{category.icon}</span>}
                            <span className="text-sm font-medium">{category.name}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                        <Tag className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">Bu ana kategoride alt kategori yok</p>
                        <button
                          type="button"
                          onClick={() => navigate('/categories')}
                          className="text-blue-600 hover:text-blue-500 text-xs mt-1"
                        >
                          Alt kategori ekle
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Kategori Bulunamadı */}
                {mainCategories.filter(cat => cat.type === formData.type).length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <Tag className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>Bu türde kategori bulunamadı</p>
                    <button
                      type="button"
                      onClick={() => navigate('/categories')}
                      className="text-blue-600 hover:text-blue-500 text-sm mt-1"
                    >
                      Kategori ekle
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {formData.type === 'transfer' ? 'Hesaplar' : 'Hesap'}
              </label>
              
              {formData.type === 'transfer' ? (
                <div className="space-y-4">
                  {/* From Account */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Gönderen Hesap
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {accounts.map(account => (
                        <button
                          key={account.id}
                          type="button"
                          onClick={() => handleInputChange('from_account_id', account.id)}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
                            formData.from_account_id === account.id
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                              : 'border-gray-200 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-600'
                          }`}
                        >
                          <Building className="h-4 w-4" />
                          <span className="text-sm font-medium">{account.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Transfer Arrow */}
                  <div className="flex justify-center">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  
                  {/* To Account */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Alıcı Hesap
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {accounts.map(account => (
                        <button
                          key={account.id}
                          type="button"
                          onClick={() => handleInputChange('to_account_id', account.id)}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
                            formData.to_account_id === account.id
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                              : 'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600'
                          }`}
                        >
                          <Building className="h-4 w-4" />
                          <span className="text-sm font-medium">{account.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 max-h-48 overflow-y-auto">
                  {Object.entries(groupedAccounts).map(([type, accountsInGroup]: [string, any]) => (
                    <div key={type} className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {type === 'cash' ? 'Nakit' : 
                         type === 'credit_card' ? 'Kredi Kartı' : 
                         type === 'bank' ? 'Banka Hesabı' : 
                         type === 'wallet' ? 'Dijital Cüzdan' : 
                         type}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {accountsInGroup.map((account: Account) => (
                          <button
                            key={account.id}
                            type="button"
                            onClick={() => handleInputChange('account_id', account.id)}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
                              formData.account_id === account.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                            }`}
                          >
                            <Building className="h-4 w-4" />
                            <span className="text-sm font-medium">{account.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {accounts.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <Building className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Hesap bulunamadı</p>
                  <button
                    type="button"
                    onClick={() => navigate('/accounts')}
                    className="text-blue-600 hover:text-blue-500 text-sm mt-1"
                  >
                    Hesap ekle
                  </button>
                </div>
              )}
            </div>

            {/* Taksit Alanı - Sadece kredi kartı seçilirse göster */}
            {showInstallmentField && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Taksit Sayısı
                </label>
                <input
                  type="text"
                  value={formData.installments || 1}
                  onChange={e => {
                    const value = e.target.value;
                    // Sadece sayıları kabul et
                    const numValue = value.replace(/[^0-9]/g, '');
                    if (numValue === '') {
                      handleInputChange('installments', 1);
                    } else {
                      const parsedValue = parseInt(numValue);
                      if (parsedValue >= 1 && parsedValue <= 36) {
                        handleInputChange('installments', parsedValue);
                      }
                    }
                  }}
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="1"
                />
                <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                  Kredi kartı ile yapılan işlemlerde taksit seçeneği kullanılabilir. Her taksit için ayrı kayıt oluşturulur.
                </p>
              </div>
            )}

            {/* Ödeme Yöntemi Combo Alanı Kaldırıldı - Hesap Seçimine Göre Otomatik Belirleniyor */}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Açıklama
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="İşlem açıklaması..."
                />
                {aiLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
              
              {/* AI Suggestions */}
              {showAiSuggestions && aiSuggestions.length > 0 && (
                <div className="mt-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <Bot className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      AI Önerileri
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {aiSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          handleInputChange('description', suggestion);
                          setShowAiSuggestions(false);
                        }}
                        className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Tarih
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Smart Suggestions */}
            <div>
              <button
                type="button"
                onClick={getSmartSuggestions}
                className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center space-x-2"
              >
                <Sparkles className="h-4 w-4" />
                <span>Akıllı Öneriler</span>
              </button>
              
              {smartSuggestions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {smartSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => applySuggestion(suggestion)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{suggestion.title}</span>
                        {suggestion.amount && (
                          <span className="text-sm text-gray-500">
                            {suggestion.amount} USD
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-6 rounded-xl font-medium text-white transition-all duration-200 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : formData.type === 'income'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Ekleniyor...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Plus className="h-5 w-5 mr-2" />
                  {formData.type === 'income' ? 'Gelir Ekle' : 'Gider Ekle'}
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAddTransaction; 