import { Pool } from '@neondatabase/serverless';

let poolInstance: Pool | null = null;

function getEnvVar(name: string): string | undefined {
  try {
    const meta = import.meta as unknown as { env?: Record<string, string | undefined> };
    if (meta && meta.env && meta.env[name]) {
      return meta.env[name];
    }
  } catch {
    // Ignore
  }
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name];
  }
  return undefined;
}

export function isNeonConfigured(): boolean {
  const url = getNeonDatabaseUrl();
  return Boolean(url && url.trim().length > 0);
}

export function getNeonDatabaseUrl(): string | undefined {
  return getEnvVar('VITE_NEON_DATABASE_URL') || getEnvVar('NEON_DATABASE_URL');
}

export function getNeonPool(): Pool | null {
  if (poolInstance) return poolInstance;

  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) return null;

  poolInstance = new Pool({ connectionString: dbUrl });
  return poolInstance;
}

export async function queryNeon<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const pool = getNeonPool();
  if (!pool) {
    throw new Error('מחרוזת החיבור של Neon (NEON_DATABASE_URL) אינה מוגדרת.');
  }

  const { rows } = await pool.query(sql, params);
  return rows as T[];
}

export async function testNeonConnection(): Promise<{
  ok: boolean;
  message: string;
  details?: any;
}> {
  const dbUrl = getNeonDatabaseUrl();
  if (!dbUrl) {
    return {
      ok: false,
      message: 'מחרוזת החיבור של Neon (NEON_DATABASE_URL) אינה מוגדרת במשתני הסביבה.',
    };
  }

  try {
    const pool = getNeonPool();
    if (!pool) {
      return { ok: false, message: 'כישלון ביצירת חיבור ל-Neon' };
    }

    await pool.query('SELECT 1');
    return {
      ok: true,
      message: 'החיבור ל-Neon Serverless PostgreSQL תקין ופעיל!',
    };
  } catch (err: any) {
    return {
      ok: false,
      message: `שגיאה בתקשורת עם Neon: ${err.message || String(err)}`,
      details: err,
    };
  }
}
