interface GeminiRequest {
  contents: {
    parts: {
      text: string;
    }[];
  }[];
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

export class GeminiService {
  private static API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'AIzaSyC5oKr0JpQHnQIKi3iZ3-ChlOEXKlcSiHw';
  private static API_URL = process.env.REACT_APP_GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite-preview:generateContent';

  // Markdown formatını temizleyen yardımcı fonksiyon
  private static cleanGeminiResponse(response: string): string {
    if (response.includes('```json')) {
      return response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    return response;
  }

  // Akıllı işlem kategorilendirme
  static async categorizeTransaction(description: string, amount: number, type: 'income' | 'expense'): Promise<{
    category: string;
    confidence: number;
    suggestions: string[];
  }> {
    try {
      const prompt = `
        Aşağıdaki işlem açıklamasını analiz ederek en uygun kategoriyi öner:
        
        İşlem: ${description}
        Tutar: ${amount} TL
        Tür: ${type === 'income' ? 'Gelir' : 'Gider'}
        
        Türkçe kategoriler:
        Gelir: Maaş, Ek Gelir, Yatırım, Kira Geliri, Diğer
        Gider: Market, Ulaşım, Faturalar, Sağlık, Eğlence, Eğitim, Giyim, Ev, Diğer
        
        Sadece JSON formatında yanıtla:
        {
          "category": "kategori_adı",
          "confidence": 0.95,
          "suggestions": ["öneri1", "öneri2", "öneri3"]
        }
      `;

      const response = await this.callGeminiAPI(prompt);
      return JSON.parse(this.cleanGeminiResponse(response));
    } catch (error) {
      console.error('Gemini categorization error:', error);
      return {
        category: 'Diğer',
        confidence: 0.5,
        suggestions: []
      };
    }
  }

  // Akıllı açıklama önerileri
  static async getDescriptionSuggestions(partialDescription: string, type: 'income' | 'expense' | 'transfer'): Promise<string[]> {
    try {
      const prompt = `
        Kullanıcı şu açıklamayı yazıyor: "${partialDescription}"
        İşlem türü: ${type === 'income' ? 'Gelir' : type === 'expense' ? 'Gider' : 'Transfer'}
        
        Bu açıklamayı tamamlayacak 3 farklı öneri ver. Kısa ve net olsun.
        ${type === 'transfer' ? 'Transfer işlemleri için hesap adlarını kullan.' : ''}
        Sadece JSON array formatında yanıtla:
        ["öneri1", "öneri2", "öneri3"]
      `;

      const response = await this.callGeminiAPI(prompt);
      return JSON.parse(this.cleanGeminiResponse(response));
    } catch (error) {
      console.error('Gemini description suggestions error:', error);
      return [];
    }
  }

  // Harcama analizi ve öneriler
  static async analyzeSpending(transactions: any[]): Promise<{
    analysis: string;
    insights: string[];
    recommendations: string[];
  }> {
    try {
      const recentTransactions = transactions.slice(0, 10);
      const transactionText = recentTransactions.map(t => 
        `${t.description}: ${t.amount} TL (${t.type})`
      ).join('\n');

      const prompt = `
        Son işlemlerimi analiz et ve öneriler ver:
        
        ${transactionText}
        
        Analiz et ve şu formatta yanıtla:
        {
          "analysis": "Genel harcama analizi",
          "insights": ["görüş1", "görüş2", "görüş3"],
          "recommendations": ["öneri1", "öneri2", "öneri3"]
        }
      `;

      const response = await this.callGeminiAPI(prompt);
      return JSON.parse(this.cleanGeminiResponse(response));
    } catch (error) {
      console.error('Gemini spending analysis error:', error);
      return {
        analysis: 'Analiz yapılamadı',
        insights: [],
        recommendations: []
      };
    }
  }

  // Bütçe önerileri
  static async getBudgetRecommendations(income: number, expenses: any[]): Promise<{
    recommendations: string[];
    categories: { [key: string]: number };
  }> {
    try {
      const expenseText = expenses.map(e => 
        `${e.category}: ${e.amount} TL`
      ).join('\n');

      const prompt = `
        Gelir: ${income} TL
        Giderler:
        ${expenseText}
        
        Bu verilere göre bütçe önerileri ver. Kategorilere göre ideal harcama dağılımı öner.
        
        JSON formatında yanıtla:
        {
          "recommendations": ["öneri1", "öneri2", "öneri3"],
          "categories": {
            "Market": 30,
            "Ulaşım": 15,
            "Faturalar": 20,
            "Eğlence": 10,
            "Diğer": 25
          }
        }
      `;

      const response = await this.callGeminiAPI(prompt);
      return JSON.parse(this.cleanGeminiResponse(response));
    } catch (error) {
      console.error('Gemini budget recommendations error:', error);
      return {
        recommendations: [],
        categories: {}
      };
    }
  }

  // Gelir/Gider işlemleri için doğal dil ayrıştırma
  static async parseIncomeExpense(input: string, categories?: any[], accounts?: any[]): Promise<{
    type: 'income' | 'expense';
    amount: number;
    description: string;
    category_id: string;
    account_id?: string;
    vendor?: string;
    summary?: string;
  }> {
    try {
      console.log('🔍 Gemini API - Gelir/Gider ayrıştırma başlatılıyor...');
      console.log('📝 Input:', input);
      
      // Kategorileri hem isim hem ID ile prompt'a ekle
      const categoriesText = categories && categories.length > 0 
        ? `\nMevcut kategoriler:\n${categories.map(cat => `- ${cat.name} (ID: ${cat.id}, Tür: ${cat.type})`).join('\n')}`
        : '';
      
      const accountsText = accounts && accounts.length > 0
        ? `\nMevcut hesaplar:\n${accounts.map(acc => `- ${acc.name} (ID: ${acc.id}, Tür: ${acc.type})`).join('\n')}`
        : '';

      const prompt = `
        Bu doğal dil ifadesini GELİR veya GİDER işlem verilerine çevir:
        "${input}"
        
        Kurallar:
        - Tutarı sayısal değer olarak çıkar (TL, lira, dolar, $, USD gibi birimleri kaldır)
        - İşlem türünü belirle: gelir veya gider
        
        Gelir İşlemleri Anahtar Kelimeleri:
        - maaş, gelir, geldi, aldım, kazandım, bonus, prim, ek gelir, kira geliri, yatırım geliri
        
        Gider İşlemleri Anahtar Kelimeleri:
        - alışveriş, harcama, ödeme, fatura, market, restoran, yemek, ulaşım, benzin, yakıt, sağlık, eğitim, giyim, eğlence
        
        Yemek Kategorileri Eşleştirme:
        - "yemek yedik", "yemek", "köfteci", "restoran", "lokanta", "dönerci", "pizzacı", "burgerci" → Restoran
        - "cafe", "kahve", "çay", "tatlı", "kurabiye", "börek" → Cafe
        - "market", "süpermarket", "alışveriş", "gıda", "yiyecek" → Market
        - "fast food", "hızlı yemek", "take away" → Fast Food
        - "kahvaltı", "brunch" → Kahvaltı
        
        Hesap Eşleştirme Kuralları:
        - "kredi kartı", "kart", "kuveyttürk", "garanti", "işbank", "akbank", "yapıkredi", "denizbank" → Kredi Kartı
        - "nakit", "cash", "cüzdan", "para" → Nakit/Cüzdan
        - "banka", "hesap", "tl hesabı", "dolar hesabı" → Banka Hesabı
        - "dijital", "papara", "paycell", "enpara" → Dijital Cüzdan
        
        Giyim Kategorileri Eşleştirme:
        - "erkek giyim", "erkek kıyafet", "gömlek", "pantolon", "ceket" → Erkek Giyim
        - "kadın giyim", "kadın kıyafet", "elbise", "bluz", "etek" → Kadın Giyim
        - "çocuk giyim", "bebek kıyafet", "çocuk elbise" → Çocuk Giyim
        - "ayakkabı", "ayak", "sandalet", "topuklu", "spor ayakkabı" → Ayakkabı
        - "aksesuar", "kolye", "bilezik", "saat", "gözlük" → Aksesuar
        - "iç giyim", "iç çamaşır", "pijama" → İç Giyim
        - "spor giyim", "spor kıyafet", "eşofman" → Spor Giyim
        - "takı", "mücevher", "yüzük", "küpe" → Takı & Mücevher
        - "kozmetik", "makyaj", "parfüm", "bakım" → Kozmetik & Bakım
        - "çanta", "cüzdan", "sırt çantası" → Çanta & Cüzdan
        
        Giyim için genel öneriler:
        - Eğer "Giyim" kategorisi varsa: Günlük Giyim, Dış Giyim, Ayakkabı, İç Giyim, Spor Giyim, Aksesuar, Takı & Mücevher
        - Eğer "Alışveriş" kategorisi varsa: Giyim Alışverişi alt kategorisini kullan
        - Eğer "Kişisel Bakım" kategorisi varsa: Giyim & Aksesuar alt kategorisini kullan
        - Eğer "Eğlence" kategorisi varsa: Giyim & Moda alt kategorisini kullan
        
        Giyim anahtar kelimeleri:
        - Günlük: tişört, pantolon, elbise, gömlek, şort, etek, bluz, sweatshirt
        - Dış: ceket, mont, kaban, hırka, kazak, blazer, trench coat
        - Ayakkabı: ayakkabı, sandalet, bot, spor ayakkabı, topuklu, loafer, sneaker
        - İç: iç çamaşırı, pijama, gecelik, sutyen, boxer, atlet, tayt
        - Spor: spor kıyafeti, egzersiz, fitness, koşu, yoga, antrenman, eşofman
        - Aksesuar: çanta, cüzdan, kemer, şal, şapka, eldiven, kravat, güneş gözlüğü
        - Takı: yüzük, kolye, küpe, bilezik, saat, piercing, pandantif
        
        - Kategoriyi yukarıdaki kategorilerden seç ve ID'sini kullan
        - Gelir işlemleri için sadece gelir kategorilerini kullan
        - Gider işlemleri için sadece gider kategorilerini kullan
        - Mümkün olduğunca alt kategorileri (subcategories) tercih et, ana kategorileri sadece uygun alt kategori yoksa kullan
        - Hesabı yukarıdaki hesaplardan seç ve ID'sini kullan
        - Açıklamayı kısa ve net yap
        - Satıcı/vendor bilgisini çıkar (Migros, A101, BİM, Carrefour, vb.)
        - Alışveriş özeti ekle (ne alındı, nereden alındı)
        ${categoriesText}
        ${accountsText}
        
        ÖNEMLİ: Response'da mutlaka ID'leri kullan, isimleri değil!
        ÖNEMLİ: Gelir işlemleri için sadece gelir kategorileri, gider işlemleri için sadece gider kategorileri seç!
        
        Sadece JSON formatında yanıtla:
        {
          "type": "income|expense",
          "amount": 123.45,
          "description": "Açıklama",
          "category_id": "kategori_id_buraya",
          "account_id": "hesap_id_buraya",
          "vendor": "Satıcı adı",
          "summary": "Alışveriş özeti"
        }
      `;

      console.log('📤 Gemini API Prompt:', prompt);
      
      const response = await this.callGeminiAPI(prompt);
      console.log('📥 Gemini API Response:', response);
      
      const cleanedResponse = this.cleanGeminiResponse(response);
      console.log('🧹 Temizlenmiş response:', cleanedResponse);
      
      const result = JSON.parse(cleanedResponse);
      console.log('✅ Ayrıştırılmış sonuç:', result);
      
      // Gelir/Gider işlemleri için kategori kontrolü
      if (!result.category_id) {
        console.error('❌ Kategori ID döndürülmedi!');
        throw new Error('Kategori ID bulunamadı');
      }
      
      if (!result.account_id) {
        console.warn('⚠️ Hesap ID döndürülmedi, varsayılan hesap kullanılacak');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Gemini gelir/gider ayrıştırma hatası:', error);
      throw new Error('Gelir/Gider ayrıştırılamadı');
    }
  }

  // Transfer işlemleri için doğal dil ayrıştırma
  static async parseTransfer(input: string, accounts?: any[]): Promise<{
    type: 'transfer';
    amount: number;
    description: string;
    from_account_id: string;
    to_account_id: string;
    summary?: string;
  }> {
    try {
      console.log('🔍 Gemini API - Transfer ayrıştırma başlatılıyor...');
      console.log('📝 Input:', input);
      
      const accountsText = accounts && accounts.length > 0
        ? `\nMevcut hesaplar:\n${accounts.map(acc => `- ${acc.name} (ID: ${acc.id}, Tür: ${acc.type})`).join('\n')}`
        : '';

      const prompt = `
        Bu doğal dil ifadesini TRANSFER işlem verilerine çevir:
        "${input}"
        
        Transfer İşlemleri Örnekleri:
        - "Türkiye Finans'tan 8000 lira çektim" → transfer (banka → nakit)
        - "Banka hesabımdan cüzdanıma para çektim" → transfer (banka → nakit)
        - "ATM'den para çektim" → transfer (banka → nakit)
        - "Kredi kartı ödemesi yaptım" → transfer (banka → kredi kartı)
        - "Hesaplar arası transfer" → transfer (hesap1 → hesap2)
        
        Hesap Eşleştirme:
        - "Türkiye Finans" → Türkiye Finans hesabı
        - "banka" → banka hesabı
        - "nakit", "cüzdan", "para çektim" → nakit hesabı
        - "kredi kartı" → kredi kartı hesabı
        
        Kurallar:
        - Tutarı sayısal değer olarak çıkar (TL, lira, dolar, $, USD gibi birimleri kaldır)
        - İşlem türü her zaman "transfer" olmalı
        - Gönderen hesabı (from_account_id) ve alıcı hesabı (to_account_id) belirle
        - Açıklamayı kısa ve net yap
        - Transfer özeti ekle
        ${accountsText}
        
        ÖNEMLİ: Response'da mutlaka ID'leri kullan, isimleri değil!
        
        Sadece JSON formatında yanıtla:
        {
          "type": "transfer",
          "amount": 123.45,
          "description": "Transfer açıklaması",
          "from_account_id": "gönderen_hesap_id",
          "to_account_id": "alıcı_hesap_id",
          "summary": "Transfer özeti"
        }
      `;

      console.log('📤 Gemini API Prompt:', prompt);
      
      const response = await this.callGeminiAPI(prompt);
      console.log('📥 Gemini API Response:', response);
      
      const cleanedResponse = this.cleanGeminiResponse(response);
      console.log('🧹 Temizlenmiş response:', cleanedResponse);
      
      const result = JSON.parse(cleanedResponse);
      console.log('✅ Ayrıştırılmış sonuç:', result);
      
      // Transfer işlemleri için hesap kontrolü
      if (!result.from_account_id || !result.to_account_id) {
        console.error('❌ Transfer işlemi için hesap ID\'leri eksik!');
        throw new Error('Transfer işlemi için hesap bilgileri eksik');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Gemini transfer ayrıştırma hatası:', error);
      throw new Error('Transfer ayrıştırılamadı');
    }
  }

  // Doğal dil işlem girişi (genel - eski fonksiyon, geriye uyumluluk için)
  static async parseNaturalLanguage(input: string, categories?: any[], accounts?: any[]): Promise<{
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    description: string;
    category_id?: string;
    account_id?: string;
    from_account_id?: string;
    to_account_id?: string;
    vendor?: string;
    summary?: string;
  }> {
    try {
      console.log('🔍 Gemini API - Genel doğal dil ayrıştırma başlatılıyor...');
      console.log('📝 Input:', input);
      
      // Önce transfer olup olmadığını kontrol et
      const textLower = input.toLowerCase();
      const isTransfer = textLower.includes('transfer') || 
                        textLower.includes('çektim') || 
                        textLower.includes('para çektim') ||
                        textLower.includes('atm') ||
                        textLower.includes('kredi kartı ödemesi') ||
                        textLower.includes('gönderdim');
      
      if (isTransfer) {
        // Transfer işlemi için özel fonksiyonu çağır
        const transferResult = await this.parseTransfer(input, accounts);
        return {
          ...transferResult,
          category_id: undefined,
          account_id: undefined,
          vendor: undefined
        };
      } else {
        // Gelir/Gider işlemi için özel fonksiyonu çağır
        const incomeExpenseResult = await this.parseIncomeExpense(input, categories, accounts);
        return {
          ...incomeExpenseResult,
          from_account_id: undefined,
          to_account_id: undefined
        };
      }
    } catch (error) {
      console.error('❌ Gemini doğal dil ayrıştırma hatası:', error);
      throw new Error('Doğal dil ayrıştırılamadı');
    }
  }

  // Akıllı hedef belirleme
  static async suggestFinancialGoals(transactions: any[], age: number, income: number): Promise<{
    shortTerm: string[];
    mediumTerm: string[];
    longTerm: string[];
  }> {
    try {
      const prompt = `
        Kullanıcı profili:
        Yaş: ${age}
        Aylık gelir: ${income} TL
        
        Son işlemler:
        ${transactions.slice(0, 5).map(t => `${t.description}: ${t.amount} TL`).join('\n')}
        
        Bu profile göre finansal hedefler öner:
        
        JSON formatında yanıtla:
        {
          "shortTerm": ["kısa vadeli hedef1", "kısa vadeli hedef2"],
          "mediumTerm": ["orta vadeli hedef1", "orta vadeli hedef2"],
          "longTerm": ["uzun vadeli hedef1", "uzun vadeli hedef2"]
        }
      `;

      const response = await this.callGeminiAPI(prompt);
      return JSON.parse(this.cleanGeminiResponse(response));
    } catch (error) {
      console.error('Gemini financial goals error:', error);
      return {
        shortTerm: [],
        mediumTerm: [],
        longTerm: []
      };
    }
  }

  // Gemini API çağrısı
  private static async callGeminiAPI(prompt: string): Promise<string> {
    console.log('🌐 Gemini API - API çağrısı başlatılıyor...');
    console.log('🔑 API Key kontrolü:', this.API_KEY ? '✅ Mevcut' : '❌ Yok');
    console.log('🔗 API URL:', this.API_URL);
    
    if (!this.API_KEY) {
      throw new Error('Gemini API key not found');
    }

    const requestBody: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    };

    console.log('📤 Gemini API - Request body:', JSON.stringify(requestBody, null, 2));
    console.log('🔗 Gemini API - Endpoint:', `${this.API_URL}?key=${this.API_KEY.substring(0, 10)}...`);

    try {
      const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Gemini API - Response status:', response.status);
      console.log('📥 Gemini API - Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API - Error response:', errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data: GeminiResponse = await response.json();
      console.log('📥 Gemini API - Full response:', JSON.stringify(data, null, 2));
      
      const result = data.candidates[0].content.parts[0].text;
      console.log('✅ Gemini API - Extracted text:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Gemini API - Network error:', error);
      throw error;
    }
  }

  // API key kontrolü
  static isConfigured(): boolean {
    console.log('🔍 Gemini API Key kontrolü:');
    console.log('  - API_KEY:', this.API_KEY ? '✅ Mevcut' : '❌ Yok');
    console.log('  - API_URL:', this.API_URL);
    console.log('  - process.env.REACT_APP_GEMINI_API_KEY:', process.env.REACT_APP_GEMINI_API_KEY ? '✅ Mevcut' : '❌ Yok');
    return !!this.API_KEY;
  }
} 