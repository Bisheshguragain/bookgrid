import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../lib/database.types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  setUser: (user: User | null) => void;
  _loadingProfile: boolean; // Internal flag to prevent concurrent loads
}

// Global flag to prevent concurrent profile loads
let isLoadingProfile = false;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      loading: true,
      isAuthenticated: false,
      _loadingProfile: false,

      setUser: (user: User | null) => {
        const state = get();
        
        // Always set loading to false
        if (state.loading) {
          set({ loading: false });
        }
        
        // Prevent infinite loops - only update if user ID changed
        const currentUserId = state.user?.id;
        const newUserId = user?.id;
        
        if (currentUserId === newUserId) {
          return; // No change
        }

        // Update state
        if (user) {
          set({ user, isAuthenticated: true });
          // Load profile in next tick to prevent stack overflow
          setTimeout(() => get().loadProfile(), 0);
        } else {
          set({ user: null, profile: null, isAuthenticated: false });
        }
      },

      signIn: async (email: string, password: string) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          set({ user: data.user, isAuthenticated: true });
          await get().loadProfile();

          return { error: null };
        } catch (error) {
          return { error: error as Error };
        }
      },

      signUp: async (email: string, password: string, fullName: string) => {
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
              },
            },
          });

          if (error) throw error;

          // Create user profile
          if (data.user) {
            const { error: profileError } = await supabase
              .from('users_profile')
              .insert({
                id: data.user.id,
                email: data.user.email!,
                full_name: fullName,
              });

            if (profileError) throw profileError;

            // Create default global settings
            await supabase
              .from('global_settings')
              .insert({
                user_id: data.user.id,
                minimum_notice_hours: 24,
                max_events_per_day: 10,
              });
          }

          return { error: null };
        } catch (error) {
          return { error: error as Error };
        }
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null, isAuthenticated: false });
      },

      resetPassword: async (email: string) => {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });
          return { error };
        } catch (error) {
          return { error: error as Error };
        }
      },

      loadProfile: async () => {
        const { user, profile: currentProfile, _loadingProfile } = get();
        
        // Prevent concurrent profile loads
        if (!user || _loadingProfile || isLoadingProfile) {
          return;
        }

        try {
          isLoadingProfile = true;
          set({ _loadingProfile: true });

          const { data, error } = await supabase
            .from('users_profile')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('Error loading profile:', error);
            throw error;
          }

          // Only update if critical fields have changed to prevent infinite loops
          const hasChanged = !currentProfile ||
            currentProfile.email !== data?.email ||
            currentProfile.full_name !== data?.full_name ||
            currentProfile.role !== data?.role ||
            currentProfile.subscription_plan !== data?.subscription_plan ||
            currentProfile.subscription_status !== data?.subscription_status;

          if (hasChanged && data) {
            set({ profile: data });
          }
        } catch (error) {
          console.error('Error loading profile:', error);
        } finally {
          isLoadingProfile = false;
          set({ _loadingProfile: false });
        }
      },

      updateProfile: async (updates: Partial<UserProfile>) => {
        const { user } = get();
        if (!user) return { error: new Error('Not authenticated') };

        try {
          const { data, error } = await supabase
            .from('users_profile')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

          if (error) throw error;

          set({ profile: data });
          return { error: null };
        } catch (error) {
          return { error: error as Error };
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Only persist essential non-object fields to avoid circular reference issues
        isAuthenticated: state.isAuthenticated,
      }),
      // Don't rehydrate the full user/profile objects
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Set loading to true so the app will fetch fresh data
          state.loading = false; // Don't show loading spinner, just fetch data
        }
      },
    }
  )
);
