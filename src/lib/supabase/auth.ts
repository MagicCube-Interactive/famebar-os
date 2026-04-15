/**
 * Supabase Authentication Helper Functions
 *
 * Client-side auth operations: sign up, sign in, sign out, and user management.
 * These functions wrap Supabase Auth methods.
 */

import { createClient } from './client';
import type { AmbassadorProfile } from '@/types';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  referralCode: string;
  telegramHandle: string;
  signalHandle: string;
  ageVerified: boolean;
}

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

/**
 * Sign up a new user with email and password
 *
 * @param data - Sign up data including email, password, name, role
 * @returns User object from Supabase auth
 * @throws Error if sign up fails
 */
export async function signUpWithEmail(data: SignUpData) {
  const {
    email,
    password,
    firstName,
    lastName,
    referralCode,
    telegramHandle,
    signalHandle,
    ageVerified,
  } = data;
  const supabase = createClient();

  // Create Supabase auth user with metadata — invited signups start as buyers.
  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: `${firstName} ${lastName}`,
        role: 'buyer' as const,
        referral_code: referralCode,
        telegram_handle: telegramHandle,
        signal_handle: signalHandle,
        age_verified: ageVerified,
      },
    },
  });

  if (error) {
    throw error;
  }

  if (!authData.user) {
    throw new Error('Failed to create user');
  }

  // The profiles table will be auto-populated by a trigger on auth.users
  return authData.user;
}

/**
 * Sign in user with email and password
 *
 * @param email - User email
 * @param password - User password
 * @returns User object from Supabase auth
 * @throws Error if sign in fails
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error('Failed to sign in');
  }

  return data.user;
}

/**
 * Sign out current user
 *
 * @returns Promise that resolves when sign out completes
 */
export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

/**
 * Get current authenticated user
 *
 * @returns User object or null if not authenticated
 */
export async function getCurrentUser() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * Watch for auth state changes
 * Useful for React components
 *
 * @param callback - Function called when auth state changes
 * @returns Unsubscribe function
 */
export function onAuthStateChange(
  callback: (user: User | null) => void
) {
  const supabase = createClient();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
    callback(session?.user ?? null);
  });

  return () => {
    subscription?.unsubscribe();
  };
}

/**
 * Get user profile from profiles table
 *
 * @param userId - User ID (UUID from auth.users)
 * @returns User profile or null if not found
 */
export async function getUserProfile(userId: string) {
  // Use the server-side /api/me route to bypass RLS policies
  // (the profiles table has RLS that causes infinite recursion
  //  when queried from the client with anon key)
  try {
    const res = await fetch('/api/me', {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      console.error('getUserProfile: /api/me returned', res.status);
      return null;
    }

    const { profile } = await res.json();
    return profile || null;
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return null;
  }
}

/**
 * Get ambassador profile from ambassador_profiles table
 *
 * @param ambassadorId - Ambassador ID (UUID)
 * @returns Ambassador profile or null if not found
 */
export async function getAmbassadorProfile(ambassadorId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('ambassador_profiles')
    .select('*')
    .eq('id', ambassadorId)
    .single();

  if (error) {
    console.error('Error fetching ambassador profile:', error);
    return null;
  }

  return data;
}

/**
 * Update user profile
 *
 * @param userId - User ID
 * @param updates - Partial profile updates
 */
export async function updateUserProfile(
  userId: string,
  updates: Record<string, any>
) {
  const supabase = createClient();

  const { error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    throw error;
  }
}

/**
 * Update ambassador profile
 *
 * @param ambassadorId - Ambassador ID
 * @param updates - Partial profile updates
 */
export async function updateAmbassadorProfile(
  ambassadorId: string,
  updates: Record<string, any>
) {
  const supabase = createClient();

  const { error } = await supabase
    .from('ambassador_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ambassadorId);

  if (error) {
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a unique referral code from email
 *
 * @param email - User email address
 * @returns Generated referral code
 */
export function generateReferralCode(email: string): string {
  const [localPart] = email.split('@');
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${localPart}-${randomSuffix}`;
}

/**
 * Validate email format
 *
 * @param email - Email to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 *
 * @param password - Password to validate
 * @returns Object with validation result and error message
 */
export function validatePassword(password: string): {
  isValid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long',
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter',
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter',
    };
  }

  if (!/\d/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number',
    };
  }

  return { isValid: true };
}

/**
 * Check if password and confirm password match
 *
 * @param password - Original password
 * @param confirmPassword - Confirmation password
 * @returns true if passwords match
 */
export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
}
