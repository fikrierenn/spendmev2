import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';

type Category = Database['public']['Tables']['spendme_categories']['Row'];
type CategoryInsert = Database['public']['Tables']['spendme_categories']['Insert'];
type CategoryUpdate = Database['public']['Tables']['spendme_categories']['Update'];

export class CategoryService {
  // Get all categories for a user
  static async getCategories(userId: string): Promise<Category[]> {
    console.log('CategoryService.getCategories called with userId:', userId);
    
    const { data, error } = await supabase
      .from('spendme_categories')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    console.log('Supabase response - data:', data, 'error:', error);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Error fetching categories: ${error.message}`);
    }

    console.log('Returning categories:', data || []);
    return data || [];
  }

  // Get categories by type (income/expense)
  static async getCategoriesByType(userId: string, type: 'income' | 'expense'): Promise<Category[]> {
    const { data, error } = await supabase
      .from('spendme_categories')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Error fetching categories: ${error.message}`);
    }

    return data || [];
  }

  // Get main categories (parent categories)
  static async getMainCategories(userId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('spendme_categories')
      .select('*')
      .eq('user_id', userId)
      .is('parent_id', null)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Error fetching main categories: ${error.message}`);
    }

    return data || [];
  }

  // Get subcategories for a parent category
  static async getSubcategories(userId: string, parentId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('spendme_categories')
      .select('*')
      .eq('user_id', userId)
      .eq('parent_id', parentId)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Error fetching subcategories: ${error.message}`);
    }

    return data || [];
  }

  // Get category with subcategories
  static async getCategoryWithSubcategories(userId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('spendme_categories')
      .select(`
        *,
        subcategories:spendme_categories(*)
      `)
      .eq('user_id', userId)
      .is('parent_id', null)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Error fetching categories with subcategories: ${error.message}`);
    }

    return data || [];
  }

  // Get category by ID
  static async getCategory(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('spendme_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error fetching category: ${error.message}`);
    }

    return data;
  }

  // Create new category
  static async createCategory(category: CategoryInsert): Promise<Category> {
    const { data, error } = await supabase
      .from('spendme_categories')
      .insert(category)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating category: ${error.message}`);
    }

    return data;
  }

  // Update category
  static async updateCategory(id: string, updates: CategoryUpdate): Promise<Category> {
    const { data, error } = await supabase
      .from('spendme_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating category: ${error.message}`);
    }

    return data;
  }

  // Delete category
  static async deleteCategory(id: string): Promise<void> {
    // First delete subcategories
    await supabase
      .from('spendme_categories')
      .delete()
      .eq('parent_id', id);

    // Then delete the main category
    const { error } = await supabase
      .from('spendme_categories')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting category: ${error.message}`);
    }
  }

  // Initialize default categories for a user
  static async initializeDefaultCategories(userId: string): Promise<void> {
    const defaultCategories = [
      // Main expense categories
      { name: 'Market', icon: '🛒', type: 'expense' as const, is_main: true, parent_id: null, user_id: userId },
      { name: 'Yemek', icon: '🍽️', type: 'expense' as const, is_main: true, parent_id: null, user_id: userId },
      { name: 'Ulaşım', icon: '🚗', type: 'expense' as const, is_main: true, parent_id: null, user_id: userId },
      { name: 'Sağlık', icon: '🏥', type: 'expense' as const, is_main: true, parent_id: null, user_id: userId },
      { name: 'Konut', icon: '🏠', type: 'expense' as const, is_main: true, parent_id: null, user_id: userId },
      { name: 'Faturalar', icon: '📄', type: 'expense' as const, is_main: true, parent_id: null, user_id: userId },
      
      // Main income categories
      { name: 'Gelir', icon: '💰', type: 'income' as const, is_main: true, parent_id: null, user_id: userId },
    ];

    // Try with regular client first, fallback to service role client
    let { data: mainCategories, error: mainError } = await supabase
      .from('spendme_categories')
      .insert(defaultCategories)
      .select();

    // If RLS blocks the insert, try with service role client
    if (mainError && mainError.message.includes('row-level security policy')) {
      console.log('RLS blocked insert, trying with service role client...');
      const result = await supabase
        .from('spendme_categories')
        .insert(defaultCategories)
        .select();
      
      mainCategories = result.data;
      mainError = result.error;
    }

    if (mainError) {
      throw new Error(`Error initializing main categories: ${mainError.message}`);
    }

    // Create subcategories for each main category
    const subcategories = [];
    
    for (const mainCategory of mainCategories || []) {
      if (mainCategory.name === 'Market') {
        subcategories.push(
          { name: 'Süpermarket', icon: '🛒', type: 'expense' as const, is_main: false, parent_id: mainCategory.id, user_id: userId },
          { name: 'Manav', icon: '🥬', type: 'expense' as const, is_main: false, parent_id: mainCategory.id, user_id: userId },
          { name: 'Kasap', icon: '🥩', type: 'expense' as const, is_main: false, parent_id: mainCategory.id, user_id: userId },
          { name: 'Fırın', icon: '🥖', type: 'expense' as const, is_main: false, parent_id: mainCategory.id, user_id: userId },
          { name: 'Şarküteri', icon: '🧀', type: 'expense' as const, is_main: false, parent_id: mainCategory.id, user_id: userId },
          { name: 'Pazar', icon: '🏪', type: 'expense' as const, is_main: false, parent_id: mainCategory.id, user_id: userId }
        );
      } else if (mainCategory.name === 'Yemek') {
        subcategories.push(
          { name: 'Restoran', icon: '🍽️', type: 'expense' as const, is_main: false, parent_id: mainCategory.id, user_id: userId },
          { name: 'Fast Food', icon: '🍔', type: 'expense' as const, is_main: false, parent_id: mainCategory.id, user_id: userId },
          { name: 'Cafe', icon: '☕', type: 'expense' as const, is_main: false, parent_id: mainCategory.id, user_id: userId },
          { name: 'Yemek Siparişi', icon: '🛵', type: 'expense' as const, is_main: false, parent_id: mainCategory.id, user_id: userId }
        );
      } else if (mainCategory.name === 'Ulaşım') {
        subcategories.push(
          { name: 'Akaryakıt', icon: '⛽', type: 'expense' as const, is_main: false, parent_id: mainCategory.id, user_id: userId },
          { name: 'Toplu Taşıma', icon: '🚌', type: 'expense' as const, is_main: false, parent_id: mainCategory.id, user_id: userId },
          { name: 'Taksi', icon: '🚕', type: 'expense' as const, is_main: false, parent_id: mainCategory.id, user_id: userId },
          { name: 'Araç Bakım', icon: '🔧', type: 'expense' as const, is_main: false, parent_id: mainCategory.id, user_id: userId }
        );
      } else if (mainCategory.name === 'Sağlık') {
        subcategories.push(
          { name: 'Hastane', icon: '🏥', type: 'expense' as const, is_main: false, parent_id: mainCategory.id, user_id: userId },
          { name: 'Eczane', icon: '💊', type: 'expense' as const, is_main: false, parent_id: mainCategory.id, user_id: userId },
          { name: 'Diş', icon: '🦷', type: 'expense' as const, is_main: false, parent_id: mainCategory.id, user_id: userId },
          { name: 'Gözlük/Lens', icon: '👓', type: 'expense' as const, is_main: false, parent_id: mainCategory.id, user_id: userId }
        );
      } else if (mainCategory.name === 'Konut') {
        subcategories.push(
          { name: 'Kira', icon: '🏠', type: 'expense' as const, is_main: false, parent_id: mainCategory.id, user_id: userId },
          { name: 'Aidat', icon: '🏢', type: 'expense' as const, is_main: false, parent_id: mainCategory.id, user_id: userId }
        );
      } else if (mainCategory.name === 'Faturalar') {
        subcategories.push(
          { name: 'Elektrik', icon: '⚡', type: 'expense' as const, is_main: false, parent_id: mainCategory.id, user_id: userId },
          { name: 'Su', icon: '💧', type: 'expense' as const, is_main: false, parent_id: mainCategory.id, user_id: userId },
          { name: 'Doğalgaz', icon: '🔥', type: 'expense' as const, is_main: false, parent_id: mainCategory.id, user_id: userId },
          { name: 'İnternet', icon: '📶', type: 'expense' as const, is_main: false, parent_id: mainCategory.id, user_id: userId },
          { name: 'Telefon', icon: '📱', type: 'expense' as const, is_main: false, parent_id: mainCategory.id, user_id: userId },
          { name: 'TV/Streaming', icon: '📺', type: 'expense' as const, is_main: false, parent_id: mainCategory.id, user_id: userId }
        );
      } else if (mainCategory.name === 'Gelir') {
        subcategories.push(
          { name: 'Maaş', icon: '💼', type: 'income' as const, is_main: false, parent_id: mainCategory.id, user_id: userId },
          { name: 'Ek Gelir', icon: '💰', type: 'income' as const, is_main: false, parent_id: mainCategory.id, user_id: userId },
          { name: 'Danışmanlık', icon: '🧑‍🏫', type: 'income' as const, is_main: false, parent_id: mainCategory.id, user_id: userId },
          { name: 'Kira Geliri', icon: '🏠', type: 'income' as const, is_main: false, parent_id: mainCategory.id, user_id: userId }
        );
      }
    }

    if (subcategories.length > 0) {
      // Try with regular client first, fallback to service role client
      let { error: subError } = await supabase
        .from('spendme_categories')
        .insert(subcategories);

      // If RLS blocks the insert, try with service role client
      if (subError && subError.message.includes('row-level security policy')) {
        console.log('RLS blocked subcategories insert, trying with service role client...');
        const result = await supabase
          .from('spendme_categories')
          .insert(subcategories);
        
        subError = result.error;
      }

      if (subError) {
        throw new Error(`Error initializing subcategories: ${subError.message}`);
      }
    }
  }

  // Get category usage statistics
  static async getCategoryStats(userId: string, period: 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate: string;

    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    } else {
      startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from('spendme_transactions')
      .select(`
        amount,
        category_id,
        spendme_categories(name, icon)
      `)
      .eq('user_id', userId)
      .gte('date', startDate)
      .not('category_id', 'is', null);

    if (error) {
      throw new Error(`Error fetching category stats: ${error.message}`);
    }

    const categoryStats: { [key: string]: { name: string; icon: string; total: number; count: number } } = {};

    data?.forEach((transaction: any) => {
      if (transaction.category_id && transaction.spendme_categories) {
        const categoryId = transaction.category_id;
        const category = transaction.spendme_categories as any;
        if (!categoryStats[categoryId]) {
          categoryStats[categoryId] = {
            name: category.name,
            icon: category.icon,
            total: 0,
            count: 0
          };
        }
        categoryStats[categoryId].total += transaction.amount;
        categoryStats[categoryId].count += 1;
      }
    });

    return Object.values(categoryStats).sort((a, b) => b.total - a.total);
  }
} 