# תוכנית יישום טכנית לביצוע AI: מעבר ל-Neon Serverless PostgreSQL

תוכנית טכנית ממוקדת, תמציתית וחד-משמעית למימוש מעבר מ-Supabase ל-Neon. מיועדת להרצה ישירה ע״י סוכן AI / מפתח.

---

## 🚀 מערך משימות טכניות (Technical Task Execution Array)

### [TASK-01] התקנת תלויות ודרייבר Neon Serverless
- **קובץ יעד:** `package.json`
- **פעולה:** הוספת חבילת `@neondatabase/serverless` ו-`pg` עבור חיבור Serverless HTTP/WebSocket.
- **הנחיית מימוש:**
  ```bash
  npm install @neondatabase/serverless pg
  npm install --save-dev @types/pg
  ```

---

### [TASK-02] הגדרת חיבור ולקוח Neon Client
- **קובץ יעד:** `src/services/neon/client.ts`
- **פעולה:** יצירת מודול חיבור ל-Neon המשתמש ב-`@neondatabase/serverless` עם Pooling מתאים עבור Serverless.
- **הנחיית מימוש:**
  ```typescript
  import { Pool, neonConfig } from '@neondatabase/serverless';

  export function getNeonPool(): Pool | null {
    const connectionString = import.meta.env.VITE_NEON_DATABASE_URL || process.env.NEON_DATABASE_URL;
    if (!connectionString) return null;
    return new Pool({ connectionString });
  }

  export async function queryNeon<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const pool = getNeonPool();
    if (!pool) throw new Error('Neon connection string not configured');
    const { rows } = await pool.query(sql, params);
    return rows;
  }
  ```

---

### [TASK-03] יישום מלא של NeonAdapter (CRUD מלא)
- **קובץ יעד:** `src/services/repository/NeonAdapter.ts`
- **פעולה:** מימוש מלא של הממשק `IDataRepository` המבצע שאילתות SQL ישירות מול Neon דרך `queryNeon`.
- **הנחיית מימוש:**
  - `getProfile(userId)` -> `SELECT * FROM user_profiles WHERE user_id = $1`
  - `saveProfile(profile)` -> `INSERT INTO user_profiles (...) VALUES (...) ON CONFLICT (user_id) DO UPDATE ...`
  - `getReports(userId, filters)` -> `SELECT r.*, json_agg(c.*) as components FROM food_reports r LEFT JOIN food_components c ON r.id = c.report_id WHERE r.user_id = $1 GROUP BY r.id`
  - `createReport(report)` -> Transaction / Batch query להכנסת הדיווח והרכיבים.
  - `addWeightEntry(entry)`, `saveFoodMemory(memory)`, `setWater(date, amountMl)`.

---

### [TASK-04] התאמת שרת Node/Express עבור Neon Query Endpoint
- **קובץ יעד:** `server.ts`
- **פעולה:** הוספת API Endpoint מאובטח בשרת למעבר שאילתות SQL מול Neon במקום גישה ישירה מהלקוח.
- **הנחיית מימוש:**
  ```typescript
  app.post('/api/neon/query', async (req, res) => {
    try {
      const { sql, params } = req.body;
      const results = await queryNeon(sql, params);
      return res.json({ success: true, data: results });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  ```

---

### [TASK-05] פריסת סכמת בסיס הנתונים ב-Neon
- **קובץ יעד:** `src/services/neon/schema.sql`
- **פעולה:** הרצת סכמת ה-PostgreSQL ב-Neon SQL Console.
- **הנחיית מימוש:**
  1. יצירת טבלאות: `user_profiles`, `food_reports`, `food_components`, `weight_entries`, `user_food_memories`, `water_entries`.
  2. יצירת אינדקסים על `(user_id, recorded_at)` ו-`(report_id)`.
  3. יצירת פונקציה וטריגר `set_updated_at()`.

---

### [TASK-06] עדכון Repository Factory ו-AppContext
- **קובצי יעד:** `src/services/repository/index.ts`, `src/context/AppContext.tsx`
- **פעולה:** חיבור ה-NeonAdapter למנגנון ה-Repository Factory כברירת מחדל כאשר `VITE_NEON_DATABASE_URL` מוגדר.
- **הנחיית מימוש:**
  ```typescript
  if (isNeonConfigured()) {
    return new NeonAdapter();
  }
  ```

---

### [TASK-07] אימות ובדיקות מקצה לקצה (End-to-End Verification)
- **פעולה:**
  1. הרצת `npm run lint` (`tsc --noEmit`).
  2. הרצת `npm run build` לוודא תקינות הידור.
  3. בדיקת CRUD מלאה של דיווחים, שקילות ומים בממשק.
