# Bridge Group deployment notes

## Required environment variables

Set production environment variables in your hosting dashboard. For local development, use an untracked `.env` file. At minimum:

- `PORT=4000`
- `DATABASE_URL=<Supabase Postgres connection string>`
- `SUPABASE_URL=https://<project-ref>.supabase.co`
- `SUPABASE_ANON_KEY=<Supabase publishable/anon key>`
- `JWT_SECRET=<strong-random-secret>`
- `CLIENT_URL=https://your-domain.com`
- `CORS_ALLOWED_ORIGINS=https://your-domain.com`
- `NODE_ENV=production`
- `ENABLE_DEMO_DATA=false`

Frontend variables:

- `VITE_API_URL=https://api.your-domain.com`
- `VITE_ENABLE_DEMO_DATA=false`

## Production run

1. Install dependencies:
   npm install
2. Build frontend:
   npm run build
3. Start backend:
   PORT=4000 JWT_SECRET=... NODE_ENV=production ENABLE_DEMO_DATA=false CORS_ALLOWED_ORIGINS=https://your-domain.com node backend/server.js
4. Serve the built frontend via your hosting platform or static host.

## Recommended public hosting

- Frontend: Vercel, Netlify, or Cloudflare Pages
- API: Railway, Render, Fly.io, or a VPS
- Database: Supabase Postgres

On Render, set `DATABASE_URL` in the backend service environment dashboard. Use Supabase **Database settings → Connection string → Postgres connection string**. Do not use the Supabase project API URL.

The backend uses Supabase Auth. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to the same Render service from Supabase **Project Settings → API**. Configure the production site URL and redirect URLs in Supabase Auth before enabling email confirmation.

## Security checklist

- Keep `ENABLE_DEMO_DATA=false` in production
- Rotate the JWT secret and never commit it
- Restrict CORS to your real public domain(s)
- Run HTTPS only
- Use a reverse proxy such as Nginx or managed hosting with TLS termination
- Keep server logs outside the public web root
