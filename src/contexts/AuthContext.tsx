import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, uploadProfilePhoto } from '../lib/supabase';

interface UserProfile {
  id?: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  phone: string;
  location: string;
  avatar_url?: string;
  // Notification settings
  email_notifications?: boolean;
  push_notifications?: boolean;
  budget_alerts?: boolean;
  transaction_reminders?: boolean;
  weekly_reports?: boolean;
  monthly_reports?: boolean;
  security_alerts?: boolean;
  marketing_emails?: boolean;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<{ error: any }>;
  updateProfilePhoto: (file: File) => Promise<{ error: any }>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async (userId: string) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Loading profile for user:', userId);
      }
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile load timeout')), 10000);
      });
      
      const profilePromise = supabase
        .from('spendme_user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

      if (process.env.NODE_ENV === 'development') {
        console.log('Profile load result:', { data, error });
      }

      // 406 hatası genellikle RLS politikası sorunu, bu durumda profile'ı null olarak ayarla
      if (error) {
        if (error.code === 'PGRST116' || error.code === '406') {
          if (process.env.NODE_ENV === 'development') {
            console.log('Profile not found or access denied, setting to null');
          }
          setUserProfile(null);
          return;
        }
        console.error('Profile load error:', error);
        setUserProfile(null);
        return;
      }

      if (data) {
        const profile = {
          id: data.id,
          user_id: data.user_id,
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          location: data.location || '',
          avatar_url: data.avatar_url,
          // Notification settings
          email_notifications: data.email_notifications ?? true,
          push_notifications: data.push_notifications ?? true,
          budget_alerts: data.budget_alerts ?? true,
          transaction_reminders: data.transaction_reminders ?? true,
          weekly_reports: data.weekly_reports ?? false,
          monthly_reports: data.monthly_reports ?? true,
          security_alerts: data.security_alerts ?? true,
          marketing_emails: data.marketing_emails ?? false
        };
        if (process.env.NODE_ENV === 'development') {
          console.log('Setting user profile:', profile);
        }
        setUserProfile(profile);
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('No profile data found, setting to null');
        }
        setUserProfile(null);
      }
    } catch (error) {
      // Detaylı error handling
      if (error instanceof Error) {
        console.error('Profile load error:', {
          message: error.message,
          name: error.name,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      } else {
        console.error('Profile load error (unknown type):', error);
      }
      
      // User-friendly error message
      if (process.env.NODE_ENV === 'development') {
        console.warn('Profile yüklenemedi, varsayılan değerler kullanılıyor');
      }
      
      setUserProfile(null);
    }
  };

  const updateUserProfile = async (profile: Partial<UserProfile>) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Updating profile for user:', user.id);
        console.log('Profile data:', profile);
      }
      
      const { data: existingData } = await supabase
        .from('spendme_user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (process.env.NODE_ENV === 'development') {
        console.log('Existing data:', existingData);
      }

      let result;
      if (existingData) {
        // Update existing profile
        if (process.env.NODE_ENV === 'development') {
          console.log('Updating existing profile...');
        }
        result = await supabase
          .from('spendme_user_profiles')
          .update(profile)
          .eq('user_id', user.id);
      } else {
        // Insert new profile
        if (process.env.NODE_ENV === 'development') {
          console.log('Inserting new profile...');
        }
        result = await supabase
          .from('spendme_user_profiles')
          .insert({
            user_id: user.id,
            ...profile
          });
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Result:', result);
      }

      if (result.error) {
        // Detaylı error logging
        console.error('Profile update error:', {
          message: result.error.message,
          code: result.error.code,
          details: result.error.details,
          hint: result.error.hint
        });
        return { error: result.error };
      }

      // Refresh profile data
      await refreshUserProfile();
      return { error: null };
    } catch (error: any) {
      // Detaylı error handling
      if (error instanceof Error) {
        console.error('Profile update exception:', {
          message: error.message,
          name: error.name,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      } else {
        console.error('Profile update exception (unknown type):', error);
      }
      return { error };
    }
  };

  const updateProfilePhoto = async (file: File) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Uploading profile photo for user:', user.id);
      }
      
      // Upload to Supabase Storage
      const publicUrl = await uploadProfilePhoto(file, user.id);
      
      if (!publicUrl) {
        throw new Error('Failed to upload profile photo');
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Photo uploaded, public URL:', publicUrl);
      }

      // Update profile with new avatar URL
      const { error: updateError } = await updateUserProfile({
        avatar_url: publicUrl
      });

      if (updateError) {
        throw updateError;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Profile updated with new avatar URL:', publicUrl);
        console.log('Current userProfile after update:', userProfile);
      }

      return { error: null };
    } catch (error: any) {
      // Detaylı error handling
      if (error instanceof Error) {
        console.error('Profile photo update error:', {
          message: error.message,
          name: error.name,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      } else {
        console.error('Profile photo update error (unknown type):', error);
      }
      return { error };
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  };



  // Test için geçici kullanıcı objesi ve ilgili kodlar kaldırıldı
  // Sadece gerçek kullanıcı ile oturum açılır
  useEffect(() => {
    let isMounted = true;
    // Get initial session
    const getInitialSession = async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Getting initial session...');
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Session:', session);
        }
        if (isMounted && session?.user) {
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ User authenticated:', session.user.email);
          }
          setUser(session.user);
          await loadUserProfile(session.user.id);
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('❌ No user in session');
          }
        }
      } catch (error) {
        // Detaylı error handling
        if (error instanceof Error) {
          console.error('❌ Initial session error:', {
            message: error.message,
            name: error.name,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
          });
        } else {
          console.error('❌ Initial session error (unknown type):', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 3000);
    getInitialSession();
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        try {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Auth state change:', event, session?.user?.email);
          }
          clearTimeout(timeoutId);
          if (isMounted && session?.user) {
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ Auth state change - User authenticated:', session.user.email);
            }
            setUser(session.user);
            await loadUserProfile(session.user.id);
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log('❌ Auth state change - No user');
            }
            setUser(null);
            setUserProfile(null);
          }
        } catch (error) {
          // Detaylı error handling
          if (error instanceof Error) {
            console.error('❌ Auth state change error:', {
              message: error.message,
              name: error.name,
              stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
          } else {
            console.error('❌ Auth state change error (unknown type):', error);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    );
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Attempting sign in with:', { email, password: '***' });
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Sign in result:', { error: error?.message });
    }
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 Attempting sign up with:', { email, password: '***' });
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 Sign up result:', { error: error?.message });
    }
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    updateUserProfile,
    updateProfilePhoto,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 