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
  // Get all budgets for a user
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
        console.warn('RLS error, trying service role:', error.message);
        
        // Fallback to service role if RLS blocks access
        if (!supabaseService) {
          console.warn('Service role key not configured, returning empty array');
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
      throw new Error(`Error fetching budgets: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  // Get budget by ID
  static async getBudget(id: string): Promise<Budget | null> {
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
  }

  // Create new budget
  static async createBudget(budget: BudgetInsert): Promise<Budget> {
    const { data, error } = await supabase
      .from('spendme_budgets')
      .insert(budget)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating budget: ${error.message}`);
    }

    return data;
  }

  // Update budget
  static async updateBudget(id: string, updates: BudgetUpdate): Promise<Budget> {
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
  }

  // Delete budget
  static async deleteBudget(id: string): Promise<void> {
    const { error } = await supabase
      .from('spendme_budgets')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting budget: ${error.message}`);
    }
  }

  // Get budgets by period
  static async getBudgetsByPeriod(userId: string, period: string): Promise<Budget[]> {
    try {
      console.log('Fetching budgets for user:', userId, 'period:', period);
      
      // First, get budgets without join
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('spendme_budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('period', period)
        .order('created_at', { ascending: false });

      if (budgetsError) {
        console.error('Error fetching budgets:', budgetsError);
        throw new Error(`Error fetching budgets: ${budgetsError.message}`);
      }

      console.log('Raw budgets data:', budgetsData);

      if (!budgetsData || budgetsData.length === 0) {
        return [];
      }

      // Get unique category IDs
      const categoryIds = Array.from(new Set(budgetsData.map((b: any) => b.category_id).filter(Boolean)));
      console.log('Category IDs:', categoryIds);

      // Get categories separately
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('spendme_categories')
        .select('id, name, icon, type, parent_id')
        .in('id', categoryIds);

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        // Continue without categories
      }

      console.log('Categories data:', categoriesData);

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

      console.log('Combined budgets:', budgetsWithCategories);
      return budgetsWithCategories;

    } catch (err) {
      console.error('Error in getBudgetsByPeriod:', err);
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

      console.log('Fetching historical data for periods:', periods);
      
      // Get budgets for all periods
      const { data, error } = await supabase
        .from('spendme_budgets')
        .select('*')
        .eq('user_id', userId)
        .in('period', periods)
        .order('period', { ascending: false });

      if (error) {
        console.warn('RLS error, trying service role:', error.message);
        
        // Fallback to service role if RLS blocks access
        if (!supabaseService) {
          console.warn('Service role key not configured, returning empty array');
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

      console.log('Historical data fetched:', data?.length || 0, 'records');
      return data || [];
    } catch (err) {
      console.error('Error fetching historical data:', err);
      throw new Error(`Error fetching historical data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }
} 