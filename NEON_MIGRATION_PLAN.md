# תוכנית עבודה מפורטת: מעבר מ-Supabase ל-Neon Serverless PostgreSQL

מסמך זה מפרט תוכנית עבודה מקיפה, מסודרת ומפורטת להעברת בסיס הנתונים ותשתיות האחסון של האפליקציה מ-**Supabase** ל-**Neon Serverless PostgreSQL**.

---

## 1. תקציר ומטרות המעבר

### למה Neon?
1. **Serverless PostgreSQL טהור:** קנה מידה אוטומטי (Auto-scaling) עם אפרוריות זיכרון (Scale to Zero) המפחיתה עלויות בזמני חוסר פעילות.
2. **Branching (ענפי בסיס נתונים):** יכולת ליצור ענפי DB מיידיים עבור סביבות Development ו-Staging בלחיצת כפתור/API.
3. **ביצועים וחיבור קל:** תמיכה בחיבור תהליכי Serverless דרך HTTP/WebSocket driver וחיבור PostgreSQL סטנדרטי.

---

## 2. השוואת ארכיטקטורה: Supabase vs. Neon

| רכיב | Supabase | Neon |
|---|---|---|
| **סוג בסיס הנתונים** | Managed PostgreSQL + PostgREST | Serverless PostgreSQL (Pure Postgres) |
| **אימות משתמשים (Auth)** | Supabase Auth (מובנה בתוך ה-DB) | עצמאי (Express Auth / Auth0 / Clerk / JWT) |
| **אבטחת מידע ברמת שורה** | Row Level Security (RLS) עם `auth.uid()` | מסנני שאילתות מבוססי `user_id` ברמת השרת/מתאם |
| **דרייבר התחברות** | `@supabase/supabase-js` | `@neondatabase/serverless` או `pg` |

---

## 3. שלבי תוכנית העבודה (Migration Plan Steps)

### שלב 1: הקמת פרויקט ב-Neon והגדרת משתני סביבה
1. **הרשמה ויצירת פרויקט:**
   - היכנס ל-Dashboard ב-https://neon.tech וצור פרויקט חדש (למשל: `calorie-tracker-db`).
2. **קבלת מחרוזת החיבור (Connection String):**
   - העתק את ה-`Database URL` במבנה:
     `postgresql://<user>:<password>@<ep-hostname>.neon.tech/<dbname>?sslmode=require`
3. **הגדרת משתני הסביבה באפליקציה (`.env` / `.env.example`):**
   ```env
   # Neon Connection URL
   VITE_NEON_DATABASE_URL="postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require"
   NEON_DATABASE_URL="postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require"
   ```

---

### שלב 2: פריסת הסכמה (Schema Deployment) ב-Neon

1. פתח את ה-**SQL Editor** ב-Neon Console.
2. הרץ את סכמת ה-PostgreSQL המותאמת הנמצאת בקובץ `src/services/neon/schema.sql`.

#### טבלאות עיקריות בסכמה:
- `user_profiles` – פרופיל משתמש ויעדים תזונתיים.
- `food_reports` – יומן דיווחי מזון (טקסט, קול, צילום).
- `food_components` – רכיבים תזונתיים מפורטים לכל דיווח (cascade delete בקישור לדיווח).
- `weight_entries` – מעקב שקילות משקל.
- `user_food_memories` – זיכרונות אוכל מותאמים אישית.
- `water_entries` – מעקב שתיית מים יומית.

---

### שלב 3: התאמת שכבת האחסון וה-Adapter בצידי הלקוח והשרת

1. **Client / Connection:**
   - הקובץ `src/services/neon/client.ts` מנהל את בדיקת החיבור ומשתני הסביבה.
2. **NeonAdapter (`src/services/repository/NeonAdapter.ts`):**
   - מתאם נתונים המממש את ממשק `IDataRepository`.
   - מאפשר עבודה שקופה מול Neon עם תמיכה במצב Offline-First (נפילה חזרה ל-LocalStorage כשאין חיבור).
3. **Repository Factory (`src/services/repository/index.ts`):**
   - תמיכה בטייפ `StorageProviderType = 'local' | 'supabase' | 'neon'`.
   - בחירה אוטומטית של Neon כאשר `VITE_NEON_DATABASE_URL` מוגדר.

---

### שלב 4: העברת נתונים קיימים (Data Migration Process)

אם קיימים נתונים ב-Supabase או בזיכרון המקומי בדפדפנים:
1. **ייצוא:** השתמש בכפתור **"ייצוא גיבוי JSON"** בהגדרות הנתונים באפליקציה לקבלת קובץ `calories-backup-YYYY-MM-DD.json`.
2. **מעבר מנוע:** החלף את סוג האחסון ל-**Neon** בהגדרות.
3. **ייבוא:** הטרע את הקובץ באמצעות **"ייבוא מגיבוי"** – כל הנתונים ישוחזרו ישירות לתוך ה-Neon PostgreSQL Database.

---

## 4. בדיקת תקינות ואימות (Verification)

לאחר ביצוע המעבר:
1. **בדיקת חיבור:** לחץ על **"בדוק חיבור לענן"** במסך ניהול הנתונים באפליקציה.
2. **בדיקת CRUD מלאה:**
   - הוספת דיווח מזון חדש ביומן.
   - עדכון משקל יומיומי.
   - הוספת זיכרון אוכל מותאם.
   - רענון העמוד ואימות שהנתונים נשמרים בהצלחה ב-Neon.
