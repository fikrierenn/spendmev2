import { createClient } from '@supabase/supabase-js';

// Supabase configuration - environment variables kullan
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://rgvegoevmdayjszwgxph.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJndmVnb2V2bWRheWpzendneHBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MzU3MzUsImV4cCI6MjA2MzQxMTczNX0.5tpoLHj0vEpfEwtJ9-oIF341Cv9fBOo6DBn3wbGl9x8';

// Development ortamında credentials kontrolü
if (process.env.NODE_ENV === 'development') {
  console.log('✅ Supabase configured with environment variables');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseAnonKey ? '✅ Mevcut' : '❌ Eksik');
} else {
  // Production'da credentials loglanmaz
  console.log('✅ Supabase configured for production');
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Profile photo upload function
export const uploadProfilePhoto = async (file: File, userId: string): Promise<string | null> => {
  try {
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size too large. Please select an image smaller than 5MB.');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select a valid image file.');
    }

    const fileName = `${userId}-${Date.now()}.${file.name.split('.').pop()}`;
    
    console.log('Uploading file:', { fileName, fileSize: file.size, fileType: file.type });
    
    // Try with different bucket names without checking if they exist first
    const bucketNames = ['avatars', 'profile-photos', 'user-avatars'];
    
    for (const bucketName of bucketNames) {
      try {
        console.log(`Trying direct upload to bucket: ${bucketName}`);
        
        // Try direct upload without checking bucket first
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) {
          console.log(`Upload error for ${bucketName}:`, error);
          
          if (error.message?.includes('row-level security policy')) {
            console.log(`RLS policy error for ${bucketName}, trying next bucket...`);
            continue;
          } else if (error.message?.includes('not found')) {
            console.log(`Bucket ${bucketName} not found, trying next bucket...`);
            continue;
          } else {
            throw error;
          }
        }

        if (data) {
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);
          
          console.log(`Upload successful to ${bucketName}, public URL:`, urlData.publicUrl);
          return urlData.publicUrl;
        }
      } catch (bucketError) {
        console.log(`Error with bucket ${bucketName}:`, bucketError);
        continue;
      }
    }

    // If all buckets failed, throw error
    throw new Error('All storage buckets failed. Please check bucket permissions and RLS policies.');
  } catch (error) {
    console.log('Profile photo upload error:', error);
    throw error;
  }
};

// Database types
export interface Database {
  public: {
    Tables: {

      spendme_categories: {
        Row: {
          id: string;
          name: string;
          icon: string | null;
          type: string;
          is_main: boolean | null;
          parent_id: string | null;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          icon?: string | null;
          type?: string;
          is_main?: boolean | null;
          parent_id?: string | null;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          icon?: string | null;
          type?: string;
          is_main?: boolean | null;
          parent_id?: string | null;
          user_id?: string;
        };
      };
      spendme_accounts: {
        Row: {
          id: string;
          name: string;
          type: string;
          icon: string | null;
          iban: string | null;
          note: string | null;
          card_limit: number | null;
          statement_day: number | null;
          due_day: number | null;
          card_note: string | null;
          card_number: string | null;
          user_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          icon?: string | null;
          iban?: string | null;
          note?: string | null;
          card_limit?: number | null;
          statement_day?: number | null;
          due_day?: number | null;
          card_note?: string | null;
          card_number?: string | null;
          user_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          icon?: string | null;
          iban?: string | null;
          note?: string | null;
          card_limit?: number | null;
          statement_day?: number | null;
          due_day?: number | null;
          card_note?: string | null;
          card_number?: string | null;
          user_id?: string;
          created_at?: string | null;
        };
      };
      spendme_transactions: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          amount: number;
          account_id: string | null;
          category_id: string | null;
          payment_method: string | null;
          installments: number | null;
          vendor: string | null;
          description: string | null;
          date: string;
          created_at: string | null;
          to_account_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          amount: number;
          account_id?: string | null;
          category_id?: string | null;
          payment_method?: string | null;
          installments?: number | null;
          vendor?: string | null;
          description?: string | null;
          date: string;
          created_at?: string | null;
          to_account_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          amount?: number;
          account_id?: string | null;
          category_id?: string | null;
          payment_method?: string | null;
          installments?: number | null;
          vendor?: string | null;
          description?: string | null;
          date?: string;
          created_at?: string | null;
          to_account_id?: string | null;
        };
      };
      spendme_budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          period: string;
          amount: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          period: string;
          amount: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          period?: string;
          amount?: number;
          created_at?: string | null;
        };
      };

    };
  };
} 