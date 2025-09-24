import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';

type Transaction = Database['public']['Tables']['spendme_transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['spendme_transactions']['Insert'];
type TransactionUpdate = Database['public']['Tables']['spendme_transactions']['Update'];

export class TransactionService {
  /**
   * Kullanıcının tüm işlemlerini getirir
   * @param userId - Kullanıcı ID'si
   * @returns Promise<Transaction[]> - İşlem listesi
   * @throws Error - API hatası durumunda
   */
  static async getTransactions(userId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('spendme_transactions')
      .select(`
        *,
        spendme_categories(name, icon),
        spendme_accounts(name, type, icon)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Error fetching transactions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Filtrelerle işlemleri getirir
   * @param userId - Kullanıcı ID'si
   * @param filters - Filtre parametreleri
   * @param filters.type - İşlem türü (income/expense/transfer)
   * @param filters.category_id - Kategori ID'si
   * @param filters.account_id - Hesap ID'si
   * @param filters.start_date - Başlangıç tarihi
   * @param filters.end_date - Bitiş tarihi
   * @param filters.search - Arama terimi
   * @returns Promise<Transaction[]> - Filtrelenmiş işlem listesi
   * @throws Error - API hatası durumunda
   */
  static async getTransactionsWithFilters(
    userId: string,
    filters: {
      type?: string;
      category_id?: string;
      account_id?: string;
      start_date?: string;
      end_date?: string;
      search?: string;
    }
  ): Promise<Transaction[]> {
    let query = supabase
      .from('spendme_transactions')
      .select(`
        *,
        spendme_categories(name, icon),
        spendme_accounts(name, type, icon)
      `)
      .eq('user_id', userId);

    // Apply filters
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
    if (filters.account_id) {
      query = query.eq('account_id', filters.account_id);
    }
    if (filters.start_date) {
      query = query.gte('date', filters.start_date);
    }
    if (filters.end_date) {
      query = query.lte('date', filters.end_date);
    }
    if (filters.search) {
      query = query.ilike('description', `%${filters.search}%`);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) {
      throw new Error(`Error fetching transactions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * ID ile işlem getirir
   * @param id - İşlem ID'si
   * @returns Promise<Transaction | null> - İşlem veya null
   * @throws Error - API hatası durumunda
   */
  static async getTransaction(id: string): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('spendme_transactions')
      .select(`
        *,
        spendme_categories(name, icon),
        spendme_accounts(name, type, icon)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error fetching transaction: ${error.message}`);
    }

    return data;
  }

  // Create new transaction
  static async createTransaction(transaction: TransactionInsert): Promise<Transaction> {
    const { data, error } = await supabase
      .from('spendme_transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating transaction: ${error.message}`);
    }

    return data;
  }

  // Update transaction
  static async updateTransaction(id: string, updates: TransactionUpdate): Promise<Transaction> {
    const { data, error } = await supabase
      .from('spendme_transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating transaction: ${error.message}`);
    }

    return data;
  }

  // Delete transaction
  static async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase
      .from('spendme_transactions')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting transaction: ${error.message}`);
    }
  }

  // Get transaction statistics
  static async getTransactionStats(userId: string, period: 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate: string;

    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    } else {
      startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from('spendme_transactions')
      .select('type, amount')
      .eq('user_id', userId)
      .gte('date', startDate);

    if (error) {
      throw new Error(`Error fetching transaction stats: ${error.message}`);
    }

    const stats = {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      transactionCount: data?.length || 0
    };

    data?.forEach((transaction: any) => {
      if (transaction.type === 'income') {
        stats.totalIncome += transaction.amount;
      } else if (transaction.type === 'expense') {
        stats.totalExpense += transaction.amount;
      }
    });

    stats.balance = stats.totalIncome - stats.totalExpense;

    return stats;
  }

  // Get recent transactions
  static async getRecentTransactions(userId: string, limit: number = 10): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('spendme_transactions')
      .select(`
        *,
        spendme_categories(name, icon),
        spendme_accounts(name, type, icon)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Error fetching recent transactions: ${error.message}`);
    }

    return data || [];
  }

  // Taksitli işlem grubunu bulma fonksiyonu
  static async getInstallmentGroup(
    userId: string,
    installmentGroupId: string
  ): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('spendme_transactions')
      .select(`
        *,
        spendme_categories!spendme_transactions_category_id_fkey(name, icon),
        spendme_accounts!spendme_transactions_account_id_fkey(name, type, icon),
        from_account:spendme_accounts!spendme_transactions_from_account_id_fkey(name, type, icon),
        to_account:spendme_accounts!spendme_transactions_to_account_id_fkey(name, type, icon)
      `)
      .eq('user_id', userId)
      .eq('installment_group_id', installmentGroupId)
      .order('date', { ascending: true });

    if (error) {
      throw new Error(`Error fetching installment group: ${error.message}`);
    }

    return data || [];
  }

  // Eski fonksiyon - geriye uyumluluk için (kullanılmayacak)
  static async getInstallmentGroupByFields(
    userId: string,
    description: string,
    amount: number,
    paymentMethod: string,
    accountId: string,
    categoryId: string,
    installments: number
  ): Promise<Transaction[]> {
    // Daha esnek arama için description'ı temizle (taksit numarası olmadan)
    const cleanDescription = description.replace(/\s*\(Taksit\s+\d+\/\d+\)\s*$/, '');
    
    const { data, error } = await supabase
      .from('spendme_transactions')
      .select(`
        *,
        spendme_categories!spendme_transactions_category_id_fkey(name, icon),
        spendme_accounts!spendme_transactions_account_id_fkey(name, type, icon),
        from_account:spendme_accounts!spendme_transactions_from_account_id_fkey(name, type, icon),
        to_account:spendme_accounts!spendme_transactions_to_account_id_fkey(name, type, icon)
      `)
      .eq('user_id', userId)
      .eq('payment_method', paymentMethod)
      .eq('account_id', accountId)
      .eq('category_id', categoryId)
      .eq('installments', installments)
      .ilike('description', `%${cleanDescription}%`)
      .order('date', { ascending: true });

    if (error) {
      throw new Error(`Error fetching installment group: ${error.message}`);
    }

    return data || [];
  }

  // Taksitli işlem grubunu toplu güncelleme fonksiyonu
  static async updateInstallmentGroup(
    transactionIds: string[],
    updates: Partial<TransactionUpdate>
  ): Promise<void> {
    // Her taksit kaydını ayrı ayrı güncelle
    for (const transactionId of transactionIds) {
      const { error } = await supabase
        .from('spendme_transactions')
        .update(updates)
        .eq('id', transactionId);

      if (error) {
        throw new Error(`Error updating installment ${transactionId}: ${error.message}`);
      }
    }
  }

  // Taksitli işlem grubunu toplu silme fonksiyonu
  static async deleteInstallmentGroup(transactionIds: string[]): Promise<void> {
    // Her taksit kaydını ayrı ayrı sil
    for (const transactionId of transactionIds) {
      const { error } = await supabase
        .from('spendme_transactions')
        .delete()
        .eq('id', transactionId);

      if (error) {
        throw new Error(`Error deleting installment ${transactionId}: ${error.message}`);
      }
    }
  }

  // İşlemin taksitli olup olmadığını kontrol etme fonksiyonu
  static isInstallmentTransaction(transaction: Transaction): boolean {
    return !!(transaction.installments && transaction.installments > 1);
  }

  // Taksitli işlem için ana işlemi bulma (ilk tarihli olan)
  static async getMainInstallmentTransaction(
    userId: string,
    description: string,
    amount: number,
    paymentMethod: string,
    accountId: string,
    categoryId: string,
    installments: number
  ): Promise<Transaction | null> {
    // Daha esnek arama için description'ı temizle (taksit numarası olmadan)
    const cleanDescription = description.replace(/\s*\(Taksit\s+\d+\/\d+\)\s*$/, '');
    
    const { data, error } = await supabase
      .from('spendme_transactions')
      .select(`
        *,
        spendme_categories(name, icon),
        spendme_accounts(name, type, icon)
      `)
      .eq('user_id', userId)
      .eq('payment_method', paymentMethod)
      .eq('account_id', accountId)
      .eq('category_id', categoryId)
      .eq('installments', installments)
      .ilike('description', `%${cleanDescription}%`)
      .order('date', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Kayıt bulunamadı
        return null;
      }
      throw new Error(`Error fetching main installment transaction: ${error.message}`);
    }

    return data;
  }

  // Yeni taksitli işlem yönetimi fonksiyonları
  static async createInstallmentTransaction(
    userId: string,
    baseTransaction: {
      type: 'income' | 'expense' | 'transfer';
      amount: number;
      description: string;
      date: string;
      payment_method: string;
      vendor?: string;
      installments: number;
      category_id: string;
      account_id: string;
    }
  ): Promise<string> {
    console.log('🎯 TransactionService.createInstallmentTransaction başlatıldı');
    console.log('📊 Gelen parametreler:', {
      userId,
      baseTransaction: {
        ...baseTransaction,
        amount: baseTransaction.amount,
        installments: baseTransaction.installments
      }
    });
    
    try {
      // Taksit grubu için benzersiz ID oluştur
      const installmentGroupId = crypto.randomUUID();
      console.log('🆔 Oluşturulan Group ID:', installmentGroupId);
      
      // İlk taksit tarihini al
      const firstInstallmentDate = new Date(baseTransaction.date);
      console.log('📅 İlk taksit tarihi:', firstInstallmentDate.toISOString().split('T')[0]);
      
      // Her taksit için ayrı kayıt oluştur
      const installmentTransactions = [];
      
      console.log('🔄 Taksit döngüsü başlatılıyor...');
      
      for (let i = 1; i <= baseTransaction.installments; i++) {
        console.log(`\n📝 Taksit ${i}/${baseTransaction.installments} işleniyor...`);
        
        // Taksit tarihini hesapla (her ay ileri)
        const installmentDate = new Date(firstInstallmentDate);
        installmentDate.setMonth(installmentDate.getMonth() + (i - 1));
        
        // Taksit tutarını hesapla
        const installmentAmount = Math.round((baseTransaction.amount / baseTransaction.installments) * 100) / 100;
        
        // Taksit açıklamasını oluştur
        const installmentDescription = `${baseTransaction.description} (Taksit ${i}/${baseTransaction.installments})`;
        
        console.log(`🔍 Taksit ${i} detayları:`, {
          orijinalAciklama: baseTransaction.description,
          taksitAciklamasi: installmentDescription,
          taksitNo: i,
          toplamTaksit: baseTransaction.installments,
          taksitTutari: installmentAmount,
          taksitTarihi: installmentDate.toISOString().split('T')[0]
        });
        
        const installmentTransaction = {
          user_id: userId,
          type: baseTransaction.type,
          amount: installmentAmount,
          description: installmentDescription,
          date: installmentDate.toISOString().split('T')[0],
          payment_method: baseTransaction.payment_method,
          vendor: baseTransaction.vendor,
          installments: baseTransaction.installments,
          installment_no: i,
          category_id: baseTransaction.category_id,
          account_id: baseTransaction.account_id,
          installment_group_id: installmentGroupId
        };
        
        console.log(`💾 Taksit ${i} veritabanı kaydı:`, installmentTransaction);
        
        installmentTransactions.push(installmentTransaction);
      }
      
      console.log(`\n🚀 ${installmentTransactions.length} taksit veritabanına ekleniyor...`);
      console.log('📋 Eklenecek taksitler:', installmentTransactions);
      
      // Tüm taksitleri veritabanına ekle
      const { data, error } = await supabase
        .from('spendme_transactions')
        .insert(installmentTransactions)
        .select();
      
      if (error) {
        console.error('❌ Veritabanı hatası:', error);
        throw new Error(`Error creating installment transactions: ${error.message}`);
      }
      
      console.log('✅ Taksitler başarıyla eklendi!');
      console.log('📊 Eklenen kayıtlar:', data);
      console.log('🆔 Döndürülen Group ID:', installmentGroupId);
      
      return installmentGroupId;
    } catch (error) {
      console.error('❌ createInstallmentTransaction genel hatası:', error);
      throw new Error(`Error creating installment transaction: ${error}`);
    }
  }

  // Taksitli işlemi güncelle (tüm taksitleri yeniden oluştur)
  static async updateInstallmentTransaction(
    userId: string,
    installmentGroupId: string,
    updatedTransaction: {
      type: 'income' | 'expense' | 'transfer';
      amount: number;
      description: string;
      date: string;
      payment_method: string;
      vendor?: string;
      installments: number;
      category_id: string;
      account_id: string;
    }
  ): Promise<void> {
    try {
      // Açıklamadan mevcut taksit bilgisini temizle
      const cleanDescription = updatedTransaction.description.replace(/\s*\(Taksit\s+\d+\/\d+\)\s*$/, '');
      
      // Temizlenmiş açıklama ile güncelleme yap
      const cleanTransaction = {
        ...updatedTransaction,
        description: cleanDescription
      };
      
      // Önce mevcut taksit grubunu sil
      await this.deleteInstallmentGroupByGroupId(installmentGroupId);
      
      // Yeni taksit grubunu oluştur
      await this.createInstallmentTransaction(userId, cleanTransaction);
    } catch (error) {
      throw new Error(`Error updating installment transaction: ${error}`);
    }
  }

  // Taksit grubunu group_id ile sil
  static async deleteInstallmentGroupByGroupId(installmentGroupId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('spendme_transactions')
        .delete()
        .eq('installment_group_id', installmentGroupId);

      if (error) {
        throw new Error(`Error deleting installment group: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`Error deleting installment group: ${error}`);
    }
  }
} 