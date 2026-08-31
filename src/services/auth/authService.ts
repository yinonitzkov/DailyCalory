export interface SimpleUser {
  id: string;
  email: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: SimpleUser | null;
}

const LOCAL_USER_KEY = 'calories_logged_in_user';

export function getStoredUser(): SimpleUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: SimpleUser | null): void {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(LOCAL_USER_KEY);
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, pass: string): Promise<AuthResult> {
  if (!email || !pass) {
    return { success: false, error: 'נא להזין אימייל וסיסמה' };
  }
  const userId = `user-${Math.abs(hashString(email))}`;
  const user: SimpleUser = { id: userId, email };
  setStoredUser(user);
  return { success: true, user };
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, pass: string): Promise<AuthResult> {
  return signInWithEmail(email, pass);
}

/**
 * Sign in with Magic Link OTP
 */
export async function signInWithOtp(email: string): Promise<AuthResult> {
  if (!email) {
    return { success: false, error: 'נא להזין כתובת אימייל' };
  }
  return { success: true };
}

/**
 * Sign in with OAuth provider (Google)
 */
export async function signInWithOAuth(provider: 'google' | 'apple' = 'google'): Promise<AuthResult> {
  const user: SimpleUser = { id: 'google-user-1', email: 'user@google.com' };
  setStoredUser(user);
  return { success: true, user };
}

/**
 * Sign out current session
 */
export async function signOutUser(): Promise<{ success: boolean; error?: string }> {
  setStoredUser(null);
  return { success: true };
}

export async function getCurrentUser(): Promise<SimpleUser | null> {
  return getStoredUser();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
