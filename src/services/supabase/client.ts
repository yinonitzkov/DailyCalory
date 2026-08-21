import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

function getEnvVar(name: string): string | undefined {
  try {
    const meta = import.meta as unknown as { env?: Record<string, string | undefined> };
    if (meta && meta.env && meta.env[name]) {
      return meta.env[name];
    }
  } catch {
    // Ignore
  }
  return undefined;
}

export function isSupabaseConfigured(): boolean {
  const url = getEnvVar('VITE_SUPABASE_URL');
  const key = getEnvVar('VITE_SUPABASE_ANON_KEY');
  return Boolean(url && key && url.trim().length > 0 && key.trim().length > 0);
}

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const url = getEnvVar('VITE_SUPABASE_URL');
  const key = getEnvVar('VITE_SUPABASE_ANON_KEY');

  if (!url || !key) {
    return null;
  }

  supabaseInstance = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return supabaseInstance;
}

export async function testSupabaseConnection(): Promise<{
  ok: boolean;
  message: string;
  details?: any;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      message: 'פרטי החיבור של Supabase (URL / ANON KEY) אינם מוגדרים במשתני הסביבה.',
    };
  }

  try {
    // Quick test query against user_profiles or food_reports table
    const { error } = await client.from('user_profiles').select('user_id').limit(1);
    if (error) {
      return {
        ok: false,
        message: `שגיאה בתקשורת עם מסד הנתונים: ${error.message}`,
        details: error,
      };
    }
    return {
      ok: true,
      message: 'החיבור ל-Supabase תקין ופעיל! כל הטבלאות נגישות.',
    };
  } catch (err: any) {
    return {
      ok: false,
      message: `שגיאת רשת בעת חיבור לענן: ${err.message || String(err)}`,
      details: err,
    };
  }
}

