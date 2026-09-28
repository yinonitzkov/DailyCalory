# Neon database setup

The app stores application data in Neon PostgreSQL. The browser calls the Express API; `DATABASE_URL` is read only by the server. Supabase Auth remains the current identity provider, so the server validates its access token and uses the verified user ID for every query.

1. Create a Neon PostgreSQL database and copy its pooled connection string into the server environment as `DATABASE_URL`. Keep `sslmode=require` and never expose this value through a `VITE_` variable.
2. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the existing sign-in flow, and the matching `SUPABASE_URL` and `SUPABASE_ANON_KEY` on the server for token verification. The Vite variables are public; the server variables are private.
3. Run `server/db/schema.sql` once against the Neon database, using Neon SQL Editor or `psql "$DATABASE_URL" -f server/db/schema.sql`.
4. Deploy the frontend and Express server together so `/api/data` is served by the same app origin.
5. Sign in and use **העבר נתונים מ־Supabase הישן** in Settings to copy existing cloud data, or **סנכרן נתונים מקומיים לענן** for browser-local data. Verify the account's reports, weights, and workout plans before retiring the old Supabase database.

The schema intentionally keeps the app's relational tables, including workout plans and their exercise ID references. It does not install Supabase RLS policies; database access is private to the server and API queries scope every operation to the user ID from the verified token.
