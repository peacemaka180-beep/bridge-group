# Bridge Group deployment notes

## Required environment variables

The production backend runs on Render and stores application data in Supabase Postgres. Set these in the Render backend service:

- `DATABASE_URL`: the Supabase Postgres connection string. In Supabase, open **Connect**, select **Session pooler**, and copy its URI. Keep this secret in Render; do not add it to Vercel or commit it.
- `JWT_SECRET`: a long random secret. Render can generate this.
- `CORS_ALLOWED_ORIGINS`: the exact public Vercel URL, for example `https://your-site.vercel.app` (comma-separated if you have more than one).
- `NODE_ENV=production`
- `ENABLE_DEMO_DATA=false`

In Vercel, set this for the frontend project and redeploy:

- `VITE_API_URL`: the public Render API URL, for example `https://bridge-group-api.onrender.com`.
- `VITE_ENABLE_DEMO_DATA=false`

## Apply the Supabase schema

The backend now uses Supabase Postgres directly. Apply the committed migration before the Render service starts:

1. In Supabase, open **SQL Editor** and run `supabase/schema.sql`, or link this repo to the project with the Supabase CLI and run `supabase db push`.
2. In Supabase **Connect**, copy the **Session pooler** connection URI and save it as Render's `DATABASE_URL`.
3. Save the Render and Vercel variables above, then redeploy both services.

The Render health endpoint at `/api/health` checks the Postgres connection and reports `database: connected` when ready. The backend uses its existing API authentication and keeps Supabase credentials server-side; the Vercel frontend only calls the Render API.

## Production run

For local development, set `DATABASE_URL` and `JWT_SECRET` in `.env`, apply the Supabase schema, then run `npm --prefix backend install` and `npm --prefix backend start`. Build the frontend from `frontend` with `npm ci --legacy-peer-deps && npm run build`.

## Recommended public hosting

- Frontend: Vercel, Netlify, or Cloudflare Pages
- API: Railway, Render, Fly.io, or a VPS
- Database: SQLite file on a persistent volume for low-traffic MVPs

## Security checklist

- Keep `ENABLE_DEMO_DATA=false` in production
- Rotate the JWT secret and never commit it
- Restrict CORS to your real public domain(s)
- Run HTTPS only
- Use a reverse proxy such as Nginx or managed hosting with TLS termination
- Keep server logs and DB files outside the public web root
