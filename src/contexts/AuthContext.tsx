// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  customUser: any | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get session from localStorage if available
const getStoredSession = (): Session | null => {
  try {
    const storedSession = localStorage.getItem('supabase.auth.token');
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        if (parsedSession?.currentSession) {
          return parsedSession.currentSession as Session;
        }
      } catch (e) {
        console.error('Error parsing stored session:', e);
      }
    }
    return null;
  } catch (e) {
    console.error('Error accessing localStorage:', e);
    return null;
  }
};

// Get custom user from localStorage
const getCustomUser = (): any | null => {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        console.error('Error parsing custom user:', e);
      }
    }
    return null;
  } catch (e) {
    console.error('Error accessing localStorage for custom user:', e);
    return null;
  }
};

// Create a fake Supabase session from a custom user
const createFakeSessionFromCustomUser = (customUser: any): Session | null => {
  if (!customUser || !customUser.id) return null;
  
  // Create a JWT-like token structure for RLS policies
  // This won't pass cryptographic verification but will be stored locally
  const fakeToken = btoa(JSON.stringify({
    sub: customUser.id, // This is used by RLS policies to match auth.uid()
    email: customUser.email,
    role: 'authenticated'
  }));
  
  const now = Math.floor(Date.now() / 1000);
  const tomorrow = now + 86400; // 24 hours from now
  
  const fakeSession: Session = {
    access_token: fakeToken,
    refresh_token: fakeToken,
    expires_at: tomorrow,
    expires_in: 86400,
    token_type: 'bearer',
    user: {
      id: customUser.id,
      email: customUser.email || '',
      app_metadata: { provider: 'email' },
      user_metadata: {
        first_name: customUser.first_name,
        last_name: customUser.last_name,
        is_farm: customUser.is_farm,
        full_name: `${customUser.first_name || ''} ${customUser.last_name || ''}`.trim()
      },
      aud: 'authenticated',
      created_at: customUser.created_at || new Date().toISOString()
    }
  };
  
  // Store the fake session in the same format as Supabase would
  try {
    localStorage.setItem('sb-itbuxujsotcgexofbrwq-auth-token', JSON.stringify({
      currentSession: fakeSession,
      expiresAt: tomorrow * 1000 // milliseconds
    }));
    console.log('Stored fake auth session for custom user');
  } catch (e) {
    console.error('Failed to store fake session:', e);
  }
  
  return fakeSession;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(getStoredSession());
  const [user, setUser] = useState<User | null>(session?.user ?? null);
  const [customUser, setCustomUser] = useState<any | null>(getCustomUser());
  const [loading, setLoading] = useState(true);

  // Refresh the session - useful for debugging and recovering from auth errors
  const refreshSession = async (): Promise<boolean> => {
    try {
      // Try to refresh the session
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        return false;
      }
      
      if (data && data.session) {
        setSession(data.session);
        setUser(data.session.user);
        console.log('Session refreshed successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Exception refreshing session:', error);
      return false;
    }
  };

  useEffect(() => {
    // Get initial session and check for custom user
    const getSession = async () => {
      try {
        console.log('Getting initial session...');
        
        // Check for custom user first
        const customUserData = getCustomUser();
        if (customUserData) {
          console.log('Found custom user in localStorage:', customUserData.email);
          setCustomUser(customUserData);
          
          // If we have a custom user but no Supabase user, create a fake session
          if (!session) {
            console.log('Creating fake session for custom user');
            const fakeSession = createFakeSessionFromCustomUser(customUserData);
            if (fakeSession) {
              setSession(fakeSession);
              setUser(fakeSession.user);
              console.log('Using fake session for authentication');
              setLoading(false);
              return;
            }
          }
        }
        
        // Then try to get session using Supabase API
        const { data, error } = await supabase.auth.getSession();
        const apiSession = data.session;

        if (error) {
          console.error('Error getting session:', error);
        }
        
        if (apiSession) {
          console.log('Session found via API');
          setSession(apiSession);
          setUser(apiSession.user);
        } else {
          // Fallback to localStorage if API fails
          const storedSession = getStoredSession();
          if (storedSession) {
            console.log('Using stored session from localStorage');
            setSession(storedSession);
            setUser(storedSession.user);
            
            // Try to refresh the token if we're using stored session
            refreshSession().then(success => {
              if (success) {
                console.log('Token refreshed after using stored session');
              } else {
                console.warn('Could not refresh token, using stored session anyway');
              }
            });
          } else if (customUserData) {
            // If we have a custom user but no session, create a fake one
            console.log('No Supabase session found, but we have a custom user');
            const fakeSession = createFakeSessionFromCustomUser(customUserData);
            if (fakeSession) {
              setSession(fakeSession);
              setUser(fakeSession.user);
              console.log('Using fake session for authentication');
            } else {
              console.log('Could not create fake session for custom user');
            }
          } else {
            console.log('No session or custom user found');
          }
        }
      } catch (error) {
        console.error('Error in getSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      setSession(session);
      setUser(session?.user ?? null);
      
      // Store session in localStorage as a backup (Supabase should do this automatically,
      // but we're adding an extra layer of persistence)
      if (session) {
        try {
          localStorage.setItem('guadzefie.session.backup', JSON.stringify({
            timestamp: new Date().toISOString(),
            userId: session.user.id,
            hasSession: true
          }));
        } catch (e) {
          console.error('Error storing session backup:', e);
        }
      }
    });

    // Add a listener for custom user changes in localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        try {
          if (e.newValue) {
            const newCustomUser = JSON.parse(e.newValue);
            setCustomUser(newCustomUser);
            console.log('Custom user updated in localStorage');
            
            // If we don't have a Supabase session, create a fake one for the custom user
            if (!session) {
              console.log('Creating fake session for updated custom user');
              const fakeSession = createFakeSessionFromCustomUser(newCustomUser);
              if (fakeSession) {
                setSession(fakeSession);
                setUser(fakeSession.user);
              }
            }
          } else {
            setCustomUser(null);
            console.log('Custom user removed from localStorage');
          }
        } catch (err) {
          console.error('Error parsing custom user from storage event:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Check for custom user changes periodically
  useEffect(() => {
    const checkCustomUser = () => {
      const currentCustomUser = getCustomUser();
      if (JSON.stringify(currentCustomUser) !== JSON.stringify(customUser)) {
        setCustomUser(currentCustomUser);
        console.log('Custom user updated (polling)');
        
        // If customUser was added or changed and we don't have a session, create a fake one
        if (currentCustomUser && !session) {
          console.log('Creating fake session for updated custom user (polling)');
          const fakeSession = createFakeSessionFromCustomUser(currentCustomUser);
          if (fakeSession) {
            setSession(fakeSession);
            setUser(fakeSession.user);
          }
        }
      }
    };

    const interval = setInterval(checkCustomUser, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [customUser, session]);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        toast.success('Account created successfully! Please check your email for verification.');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during signup');
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Ensure we have the latest session
      await refreshSession();
      toast.success('Logged in successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Invalid login credentials');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('AuthContext: Starting sign out process');
      
      // First clear local state
      setSession(null);
      setUser(null);
      setCustomUser(null);
      
      // Then clear all possible storage locations
      try {
        console.log('AuthContext: Clearing localStorage');
        localStorage.removeItem('guadzefie.session.backup');
        localStorage.removeItem('user');
        localStorage.removeItem('sb-itbuxujsotcgexofbrwq-auth-token');
        
        // Clear any other potential session keys
        const potentialKeys = [
          'supabase.auth.token',
          'supabase-auth-token',
          `sb-${process.env.REACT_APP_SUPABASE_PROJECT_ID}-auth-token`
        ];
        
        potentialKeys.forEach(key => {
          try {
            if (localStorage.getItem(key)) {
              console.log(`AuthContext: Removing ${key} from localStorage`);
              localStorage.removeItem(key);
            }
          } catch (err) {
            console.error(`AuthContext: Error removing ${key}:`, err);
          }
        });
      } catch (e) {
        console.error('AuthContext: Error clearing localStorage:', e);
      }
      
      // Finally call Supabase signOut
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthContext: Supabase signOut error:', error);
        // Continue despite error since we already cleared local state
      } else {
        console.log('AuthContext: Supabase signOut successful');
      }
      
      toast.success('Logged out successfully');
    } catch (error: any) {
      console.error('AuthContext: Error during sign out process:', error);
      toast.error('Error during sign out, but session has been cleared locally');
      // Don't rethrow, as we want the calling code to continue to the login page
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      
      if (error) throw error;
      
      toast.success('Password reset instructions sent to your email');
    } catch (error: any) {
      toast.error(error.message || 'Error sending reset password instructions');
      throw error;
    }
  };

  const value = {
    session,
    user: user || (customUser ? {
      id: customUser.id,
      email: customUser.email,
      user_metadata: {
        first_name: customUser.first_name,
        last_name: customUser.last_name,
        is_farm: customUser.is_farm
      }
    } as any : null),
    customUser,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};