import { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase/client';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export type AuthResult = {
  success: boolean;
  error?: string;
  user?: User | null;
};

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase אינו מוגדר במערכת' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: translateAuthError(error) };
  }

  return { success: true, user: data.user };
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase אינו מוגדר במערכת' };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { success: false, error: translateAuthError(error) };
  }

  return { success: true, user: data.user };
}

/**
 * Sign in with Magic Link OTP
 */
export async function signInWithOtp(email: string): Promise<AuthResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase אינו מוגדר במערכת' };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  });

  if (error) {
    return { success: false, error: translateAuthError(error) };
  }

  return { success: true };
}

/**
 * Sign in with OAuth provider (Google)
 */
export async function signInWithOAuth(provider: 'google' | 'apple' = 'google'): Promise<AuthResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase אינו מוגדר במערכת' };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  });

  if (error) {
    return { success: false, error: translateAuthError(error) };
  }

  return { success: true };
}

/**
 * Sign out current session
 */
export async function signOutUser(): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: true };
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    return { success: false, error: translateAuthError(error) };
  }

  return { success: true };
}

/**
 * Get current session user
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch {
    return null;
  }
}

/**
 * Helper to translate common Supabase error messages to Hebrew
 */
function translateAuthError(error: AuthError): string {
  const msg = error.message.toLowerCase();
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'אימייל או סיסמה שגויים';
  }
  if (msg.includes('user already registered') || msg.includes('already exists')) {
    return 'משתמש עם כתובת אימייל זו כבר קיים במערכת';
  }
  if (msg.includes('password should be at least')) {
    return 'הסיסמה חייבת להכיל לפחות 6 תווים';
  }
  if (msg.includes('rate limit')) {
    return 'יותר מדי נסיונות בזמן קצר. אנא המתן מספר רגעים ונסה שוב';
  }
  if (msg.includes('email not confirmed')) {
    return 'כתובת האימייל עדיין לא אומתה. אנא בדוק את תיבת הדואר הנכנס שלך';
  }
  return error.message || 'אירעה שגיאה בתהליך ההתחברות';
}
