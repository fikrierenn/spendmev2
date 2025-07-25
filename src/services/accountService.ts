import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';

type Account = Database['public']['Tables']['spendme_accounts']['Row'];
type AccountInsert = Database['public']['Tables']['spendme_accounts']['Insert'];
type AccountUpdate = Database['public']['Tables']['spendme_accounts']['Update'];

export class AccountService {
  // Get all accounts for a user
  static async getAccounts(userId: string): Promise<Account[]> {
    // TODO: Remove this temporary fix - get all accounts for testing
    const { data, error } = await supabase
      .from('spendme_accounts')
      .select('*')
      // .eq('user_id', userId) // Temporarily commented out for testing
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching accounts: ${error.message}`);
    }

    return data || [];
  }

  // Get account by ID
  static async getAccount(id: string): Promise<Account | null> {
    const { data, error } = await supabase
      .from('spendme_accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error fetching account: ${error.message}`);
    }

    return data;
  }

  // Create new account
  static async createAccount(account: AccountInsert): Promise<Account> {
    const { data, error } = await supabase
      .from('spendme_accounts')
      .insert(account)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating account: ${error.message}`);
    }

    return data;
  }

  // Update account
  static async updateAccount(id: string, updates: AccountUpdate): Promise<Account> {
    const { data, error } = await supabase
      .from('spendme_accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating account: ${error.message}`);
    }

    return data;
  }

  // Delete account
  static async deleteAccount(id: string): Promise<void> {
    const { error } = await supabase
      .from('spendme_accounts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting account: ${error.message}`);
    }
  }

  // Get accounts by type
  static async getAccountsByType(userId: string, type: string): Promise<Account[]> {
    const { data, error } = await supabase
      .from('spendme_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching accounts by type: ${error.message}`);
    }

    return data || [];
  }
} 