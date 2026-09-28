# קלוריות — מפרט טכני וארכיטקטורה (TECHNICAL.md)

## 1. ארכיטקטורת המערכת (System Architecture)

מערכת אחודה, מודרנית וקלת משקל (Single Application):
- **Client (Frontend):** React + TypeScript (Vite/Next.js Architecture), תמיכה מלאה ב-RTL, Web App Manifest, Service Worker ו-Tailwind CSS.
- **Server Runtime:** Node.js API Routes בצד השרת עבור פעולות מאובטחות, פירוק AI (Gemini / OpenAI API), טיפול ב-Multipart (תמונות ואודיו), ו-Web Push VAPID.
- **אימות (Auth):** Supabase Auth מנהל כרגע כניסה ו־sessions; ה־API מאמת את ה־access token בכל בקשת נתונים.
- **מסד נתונים ואבטחה:** Neon PostgreSQL דרך `pg` בשרת Express. `DATABASE_URL` נשאר סודי בצד השרת; כל פעולת DB מוגבלת ל־`user_id` מתוך token מאומת.
- **בינה מלאכותית (AI Engine):** עיבוד בשרת בלבד עם Structured Outputs (JSON Schema מוגדר וקשיח).
- **תמונות ומדיה:** Zero Persistence — קובץ התמונה או האודיו מעובד בזיכרון/Buffer של הבקשה ונמחק מיד בסיום.
- **Web Push:** מנגנון VAPID מובנה עם משימת תזמון עצמאית (Dispatcher).

---

## 2. מודל נתונים (Data Schema)

### 2.1 טבלת פרופילים (`profiles`)
| שדה | סוג | תיאור |
|---|---|---|
| `user_id` | UUID / String (PK) | מזהה משתמש ייחודי |
| `birth_date` | Date / String | תאריך לידה |
| `biological_sex` | Enum ('male', 'female') | מין ביולוגי עבור Mifflin–St Jeor |
| `height_cm` | Numeric (5,1) | גובה בסנטימטרים |
| `activity_level` | Enum ('sedentary', 'light', 'moderate', 'active', 'very_active') | מקדם פעילות גופנית |
| `target_weight_kg` | Numeric (5,2) | משקל יעד בק"ג |
| `calorie_target_kcal`| Integer | יעד קלוריות יומי מאושר |
| `protein_target_g` | Integer | יעד חלבון בגרמים |
| `carb_target_g` | Integer | יעד פחמימות בגרמים |
| `fat_target_g` | Integer | יעד שומן בגרמים |
| `fiber_target_g` | Integer | יעד סיבים בגרמים |
| `timezone` | String | אזור זמן (ברירת מחדל: המכשיר המקומי) |
| `locale` | String | ברירת מחדל: `'he-IL'` |
| `onboarding_completed_at` | Timestamp | תאריך השלמת הגדרה ראשונית |
| `created_at`, `updated_at` | Timestamp | חותמות זמן |

### 2.2 טבלת שקילות (`weight_entries`)
| שדה | סוג | תיאור |
|---|---|---|
| `id` | UUID (PK) | מזהה שקילה |
| `user_id` | UUID / String (FK) | שייכות למשתמש |
| `weight_kg` | Numeric (5,2) | משקל בק"ג |
| `recorded_at` | Timestamp | תאריך ושעת השקילה |
| `created_at` | Timestamp | חותמת זמן יצירה |

### 2.3 טבלת דיווחי מזון (`food_reports`)
| שדה | סוג | תיאור |
|---|---|---|
| `id` | UUID (PK) | מזהה דיווח |
| `user_id` | UUID / String (FK) | שייכות למשתמש |
| `client_request_id` | UUID / String | מזהה Idempotency ייחודי מהלקוח |
| `input_type` | Enum ('text', 'voice', 'photo') | סוג הקלט |
| `original_text` | Text | הטקסט שהוזן או התמלול הקולי |
| `status` | Enum ('queued', 'processing', 'saved', 'needs_clarification', 'failed', 'deleted') | סטטוס עיבוד |
| `confidence` | Enum ('high', 'medium', 'low') | רמת ביטחון כללית |
| `calories` | Integer | סך קלוריות מחושב |
| `protein` | Numeric (5,1) | סך חלבון (גרם) |
| `carbs` | Numeric (5,1) | סך פחמימות (גרם) |
| `fat` | Numeric (5,1) | סך שומן (גרם) |
| `fiber` | Numeric (5,1) | סך סיבים (גרם) |
| `recorded_at` | Timestamp | תאריך ושעת הדיווח |
| `created_at`, `updated_at` | Timestamp | חותמות זמן |

### 2.4 טבלת רכיבי מזון (`food_components`)
| שדה | סוג | תיאור |
|---|---|---|
| `id` | UUID (PK) | מזהה רכיב |
| `report_id` | UUID (FK) | שייך לדיווח |
| `user_id` | UUID / String (FK) | שייך למשתמש (אבטחה כפולה) |
| `name` | String | שם המרכיב (בעברית) |
| `quantity_value` | Numeric (6,2) | כמות מספרית |
| `quantity_unit` | String | יחידת מידה (גרם, כף, יחידה, כוס וכו') |
| `calories` | Integer | קלוריות ברכיב |
| `protein` | Numeric (5,1) | חלבון (גרם) |
| `carbs` | Numeric (5,1) | פחמימות (גרם) |
| `fat` | Numeric (5,1) | שומן (גרם) |
| `fiber` | Numeric (5,1) | סיבים (גרם) |
| `confidence` | Enum ('high', 'medium', 'low') | רמת ביטחון לרכיב |
| `is_estimated` | Boolean | האם הערך מסומן כהערכה |
| `sort_order` | Integer | סדר תצוגה |

### 2.5 היסטוריית הודעות שיחה (`report_messages`)
| שדה | סוג | תיאור |
|---|---|---|
| `id` | UUID (PK) | מזהה הודעה |
| `report_id` | UUID (FK) | מזהה הדיווח המקושר |
| `user_id` | UUID / String (FK) | שייך למשתמש |
| `role` | Enum ('user', 'assistant', 'system') | תפקיד הדובר |
| `content` | Text | תוכן ההודעה |
| `operation_json`| JSON / Object | פעולות תיקון מובנות שבוצעו |
| `created_at` | Timestamp | מועד שליחה |

### 2.6 הגדרות ותזמון התראות (`notification_preferences` & `push_subscriptions`)
- `food_enabled`, `food_time_local`: תזכורת יומית לאוכל.
- `weight_enabled`, `weight_weekday`, `weight_time_local`: תזכורת שבועית לשקילה.
- שמירת Push Subscriptions מבוססת `endpoint` ו-`keys (p256dh, auth)`.

---

## 3. חוזי AI ומבנה פלט (AI Contracts & Schemas)

### 3.1 ניתוח דיווח (Analyze Food)
**פלט JSON Schema מובנה מה-AI:**
```json
{
  "status": "parsed", // "parsed" | "needs_clarification" | "failed"
  "overall_confidence": "high", // "high" | "medium" | "low"
  "clarification_question": null, // מוחזר רק אם הסטטוס הוא needs_clarification
  "notes": "הערה קצרה במידת הצורך",
  "components": [
    {
      "name": "חזה עוף צלוי",
      "quantity_value": 150,
      "quantity_unit": "גרם",
      "calories": 248,
      "protein_g": 46.5,
      "carbs_g": 0.0,
      "fat_g": 5.4,
      "fiber_g": 0.0,
      "confidence": "high",
      "is_estimated": false
    },
    {
      "name": "אורז לבן מבושל",
      "quantity_value": 150,
      "quantity_unit": "גרם",
      "calories": 195,
      "protein_g": 4.1,
      "carbs_g": 42.3,
      "fat_g": 0.4,
      "fiber_g": 0.6,
      "confidence": "high",
      "is_estimated": false
    }
  ]
}
```

### 3.2 תיקון שיחתי (Conversational Correction)
**פלט פעולות תיקון מובנה מה-AI:**
```json
{
  "status": "success", // "success" | "clarify"
  "clarification_question": null,
  "operations": [
    {
      "action": "update", // "add" | "update" | "replace" | "remove"
      "target_component_name": "אורז לבן מבושל",
      "component": {
        "name": "אורז לבן מבושל",
        "quantity_value": 100,
        "quantity_unit": "גרם",
        "calories": 130,
        "protein_g": 2.7,
        "carbs_g": 28.2,
        "fat_g": 0.3,
        "fiber_g": 0.4,
        "confidence": "high",
        "is_estimated": false
      }
    }
  ]
}
```

---

## 4. נוסחת חישוב יעד קלורי (Mifflin–St Jeor Calculator)

1. **חישוב קצב חילוף חומרים בסיסי (BMR / REE):**
   - **גברים:** `REE = (10 × משקל_קג) + (6.25 × גובה_סמ) - (5 × גיל) + 5`
   - **נשים:** `REE = (10 × משקל_קג) + (6.25 × גובה_סמ) - (5 × גיל) - 161`

2. **חישוב סך הוצאה אנרגטית יומית (TDEE):**
   - `TDEE = REE × מקדם_פעילות`
   - מקדמי פעילות: יושבני (1.2), קל (1.375), בינוני (1.55), פעיל (1.725), פעיל מאוד (1.9).

3. **חישוב גירעון קלורי מוצע לירידה במשקל:**
   - גירעון מומלץ: 500 קק"ל או מקסימום 20% מ-TDEE (הנמוך מביניהם).
   - רצפת בטיחות מינימלית: 1,200 קק"ל לנשים, 1,500 קק"ל לגברים.
   - התראה אם הגירעון חורג מהרצפה.

4. **חלוקת מאקרו מומלצת ברירת מחדל:**
   - חלבון: 25% מהקלוריות (4 קק"ל לגרם)
   - פחמימות: 45% מהקלוריות (4 קק"ל לגרם)
   - שומן: 30% מהקלוריות (9 קק"ל לגרם)
   - סיבים: 14 גרם לכל 1,000 קק"ל

---

## 5. ממשקי API ו-Endpoints

- `POST /api/reports/analyze-text`: מקבל `{ text, client_request_id }`, מבצע פירוק ושמירה בטרנזקציה יחידה.
- `POST /api/reports/analyze-media`: מקבל קובץ `multipart/form-data` (תמונה או אודיו), מפעיל ניתוח, מוחק את הקובץ מיד מהזיכרון ומחזיר את הדיווח השמור.
- `POST /api/reports/:id/correct`: מקבל `{ correction_text }`, מחיל פעולות תיקון ומעדכן סיכומים.
- `POST /api/reports/:id/retry`: ניסיון חוזר לדיווח שנכשל (Idempotent).
- `DELETE /api/reports/:id`: מחיקת דיווח ועדכון הסיכום היומי.
- `POST /api/weights`: הזנה/עריכה/מחיקה של שקילה.
- `POST /api/profile`: עדכון נתוני פרופיל ויעדים תזונתיים.
- `POST /api/push/subscribe`: רישום מנוי Web Push.

---

## 6. מנגנון Offline וסנכרון Outbox
1. שמירת דיווחי טקסט ב-`IndexedDB` מקומי (`outbox`) כאשר `navigator.onLine === false`.
2. האזנה לאירוע `online` וביצוע פלאש לסנכרון הרשומות בתור.
3. בדיקת `client_request_id` בשרת מונעת כפילויות במקרה של ניסיונות סנכרון חוזרים.
4. מחיקת הפריט מה-Outbox רק לאחר אישור שמירה מוצלח מהשרת.
