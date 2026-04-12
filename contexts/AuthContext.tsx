import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { DEFAULT_PROFILE_SETTINGS, DEFAULT_PREFERENCE_SETTINGS, saveProfileSettings, savePreferenceSettings } from '../lib/userSettings';

type AuthContextValue = {
  isEnabled: boolean;
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signInWithGitHub: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const hydrate = async () => {
      try {
        setLoading(true);
        
        // Wait a tick for Supabase to process OAuth callback from URL hash
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!isMounted) return;
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message || 'Failed to load auth session');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    hydrate();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (isMounted) {
        setSession(nextSession ?? null);
        setUser(nextSession?.user ?? null);
        setLoading(false);
        setError(null);

        // Trigger Lifecycle Marketing Emails on active login
        if (event === 'SIGNED_IN' && nextSession?.user) {
          triggerLifecycleEmails(nextSession.user);
        }
      }
    });

    // Marketing Function securely pings the Edge Function
    const triggerLifecycleEmails = async (currentUser: User) => {
      try {
        const welcomeKey = `moviemonk_has_welcomed_${currentUser.id}`;
        const lastReloginKey = `moviemonk_last_relogin_${currentUser.id}`;
        const now = Date.now();

        let emailType: 'welcome' | 'relogin' | null = null;

        if (!localStorage.getItem(welcomeKey)) {
          // Send Welcome Email
          emailType = 'welcome';
          localStorage.setItem(welcomeKey, 'true');
          localStorage.setItem(lastReloginKey, now.toString()); // Set baseline
        } else {
          // Check if it's been > 7 days since last relogin
          const lastReloginTime = parseInt(localStorage.getItem(lastReloginKey) || '0', 10);
          const daysSinceLastLogin = (now - lastReloginTime) / (1000 * 60 * 60 * 24);
          
          if (daysSinceLastLogin > 7) {
             emailType = 'relogin';
             localStorage.setItem(lastReloginKey, now.toString());
          }
        }

        if (emailType) {
           await supabase.functions.invoke('send-email', {
              body: {
                 email: currentUser.email,
                 name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || 'Movie Fan',
                 type: emailType
              }
           });
        }
      } catch (err) {
         console.warn("Silent marketing email failure:", err);
      }
    };

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGitHub = async () => {
    if (!isSupabaseConfigured || !supabase) {
      const configError = new Error('Supabase auth is not configured');
      setError(configError.message);
      throw configError;
    }

    setError(null);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'github'
    });
    if (authError) {
      setError(authError.message || 'GitHub sign-in failed');
      throw authError;
    }
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured || !supabase) {
      const configError = new Error('Supabase auth is not configured');
      setError(configError.message);
      throw configError;
    }

    setError(null);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google'
    });
    if (authError) {
      setError(authError.message || 'Google sign-in failed');
      throw authError;
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured || !supabase) {
      const configError = new Error('Supabase auth is not configured');
      setError(configError.message);
      throw configError;
    }

    setError(null);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message || 'Sign-out failed');
      throw signOutError;
    }
    
    // Clear user preferences and profile from localStorage on sign-out
    saveProfileSettings(DEFAULT_PROFILE_SETTINGS);
    savePreferenceSettings(DEFAULT_PREFERENCE_SETTINGS);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      isEnabled: isSupabaseConfigured,
      user,
      session,
      loading,
      error,
      signInWithGitHub,
      signInWithGoogle,
      signOut
    }),
    [user, session, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
