import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Service role client for bypassing RLS
const supabaseService = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(
      process.env.REACT_APP_SUPABASE_URL!,
      process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

type Budget = Database['public']['Tables']['spendme_budgets']['Row'];
type BudgetInsert = Database['public']['Tables']['spendme_budgets']['Insert'];
type BudgetUpdate = Database['public']['Tables']['spendme_budgets']['Update'];

export class BudgetService {
  /**
   * Kullanıcının tüm bütçelerini getirir
   * @param userId - Kullanıcı ID'si
   * @returns Promise<Budget[]> - Bütçe listesi
   * @throws Error - API hatası durumunda
   */
  static async getBudgets(userId: string): Promise<Budget[]> {
    try {
      const { data, error } = await supabase
        .from('spendme_budgets')
        .select(`
          *,
          category:spendme_categories(name, icon)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('RLS error, trying service role:', error.message);
        }
        
        // Fallback to service role if RLS blocks access
        if (!supabaseService) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Service role key not configured, returning empty array');
          }
          return [];
        }
        
        const { data: serviceData, error: serviceError } = await supabaseService
          .from('spendme_budgets')
          .select(`
            *,
            category:spendme_categories(name, icon)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (serviceError) {
          throw new Error(`Error fetching budgets: ${serviceError.message}`);
        }

        return serviceData || [];
      }

      return data || [];
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('BudgetService.getBudgets error:', err);
      }
      throw new Error(`Error fetching budgets: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  /**
   * ID ile bütçe getirir
   * @param id - Bütçe ID'si
   * @returns Promise<Budget | null> - Bütçe veya null
   * @throws Error - API hatası durumunda
   */
  static async getBudget(id: string): Promise<Budget | null> {
    try {
      const { data, error } = await supabase
        .from('spendme_budgets')
        .select(`
          *,
          category:spendme_categories(name, icon)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Error fetching budget: ${error.message}`);
      }

      return data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('BudgetService.getBudget error:', error);
      }
      throw error;
    }
  }

  /**
   * Yeni bütçe oluşturur
   * @param budget - Oluşturulacak bütçe verisi
   * @returns Promise<Budget> - Oluşturulan bütçe
   * @throws Error - API hatası durumunda
   */
  static async createBudget(budget: BudgetInsert): Promise<Budget> {
    try {
      const { data, error } = await supabase
        .from('spendme_budgets')
        .insert(budget)
        .select()
        .single();

      if (error) {
        throw new Error(`Error creating budget: ${error.message}`);
      }

      return data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('BudgetService.createBudget error:', error);
      }
      throw error;
    }
  }

  /**
   * Bütçe günceller
   * @param id - Bütçe ID'si
   * @param updates - Güncellenecek alanlar
   * @returns Promise<Budget> - Güncellenmiş bütçe
   * @throws Error - API hatası durumunda
   */
  static async updateBudget(id: string, updates: BudgetUpdate): Promise<Budget> {
    try {
      const { data, error } = await supabase
        .from('spendme_budgets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Error updating budget: ${error.message}`);
      }

      return data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('BudgetService.updateBudget error:', error);
      }
      throw error;
    }
  }

  /**
   * Bütçe siler
   * @param id - Bütçe ID'si
   * @throws Error - API hatası durumunda
   */
  static async deleteBudget(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('spendme_budgets')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Error deleting budget: ${error.message}`);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('BudgetService.deleteBudget error:', error);
      }
      throw error;
    }
  }

  /**
   * Kullanıcının belirli dönemdeki bütçelerini getirir
   * @param userId - Kullanıcı ID'si
   * @param period - Dönem (monthly, yearly)
   * @returns Promise<Budget[]> - Bütçe listesi
   * @throws Error - API hatası durumunda
   */
  static async getBudgetsByPeriod(userId: string, period: string): Promise<Budget[]> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Fetching budgets for user:', userId, 'period:', period);
      }
      
      // First, get budgets without join
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('spendme_budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('period', period)
        .order('created_at', { ascending: false });

      if (budgetsError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching budgets:', budgetsError);
        }
        throw new Error(`Error fetching budgets: ${budgetsError.message}`);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Raw budgets data:', budgetsData);
      }

      if (!budgetsData || budgetsData.length === 0) {
        return [];
      }

      // Get unique category IDs
      const categoryIds = Array.from(new Set(budgetsData.map((b: any) => b.category_id).filter(Boolean)));
      if (process.env.NODE_ENV === 'development') {
        console.log('Category IDs:', categoryIds);
      }

      // Get categories separately
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('spendme_categories')
        .select('id, name, icon, type, parent_id')
        .in('id', categoryIds);

      if (categoriesError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching categories:', categoriesError);
        }
        // Continue without categories
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Categories data:', categoriesData);
      }

      // Combine budgets with categories
      const budgetsWithCategories = budgetsData.map((budget: any) => {
        const category = categoriesData?.find((c: any) => c.id === budget.category_id);
        return {
          ...budget,
          category: category ? { 
            name: category.name, 
            icon: category.icon,
            type: category.type as 'income' | 'expense',
            parent_id: category.parent_id
          } : undefined
        };
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('Combined budgets:', budgetsWithCategories);
      }
      return budgetsWithCategories;

    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error in getBudgetsByPeriod:', err);
      }
      throw new Error(`Error fetching budgets by period: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  // Get current month budgets
  static async getCurrentMonthBudgets(userId: string): Promise<Budget[]> {
    const currentDate = new Date();
    const currentPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    return this.getBudgetsByPeriod(userId, currentPeriod);
  }

  // Clean and deduplicate budgets - keep only the latest budget for each category in a period
  static cleanBudgets(budgets: Budget[]): Budget[] {
    const budgetMap = new Map<string, Budget>();
    
    // Sort by created_at descending to get the latest first
    const sortedBudgets = budgets.sort((a, b) => 
      new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
    );
    
    // Keep only the latest budget for each category
    sortedBudgets.forEach(budget => {
      if (budget.category_id) {
        budgetMap.set(budget.category_id, budget);
      }
    });
    
    return Array.from(budgetMap.values());
  }

  // Get historical budget data for AI analysis
  static async getHistoricalData(userId: string, months: number = 6): Promise<Budget[]> {
    try {
      const currentDate = new Date();
      const periods: string[] = [];
      
      // Generate period strings for the last N months
      for (let i = 1; i <= months; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        periods.push(period);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Fetching historical data for periods:', periods);
      }
      
      // Get budgets for all periods
      const { data, error } = await supabase
        .from('spendme_budgets')
        .select('*')
        .eq('user_id', userId)
        .in('period', periods)
        .order('period', { ascending: false });

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('RLS error, trying service role:', error.message);
        }
        
        // Fallback to service role if RLS blocks access
        if (!supabaseService) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Service role key not configured, returning empty array');
          }
          return [];
        }
        
        const { data: serviceData, error: serviceError } = await supabaseService
          .from('spendme_budgets')
          .select('*')
          .eq('user_id', userId)
          .in('period', periods)
          .order('period', { ascending: false });

        if (serviceError) {
          throw new Error(`Error fetching historical data: ${serviceError.message}`);
        }

        return serviceData || [];
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Historical data fetched:', data?.length || 0, 'records');
      }
      return data || [];
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching historical data:', err);
      }
      throw new Error(`Error fetching historical data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }
} 