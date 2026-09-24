# Bridge Group deployment notes

## Required environment variables

Create a production `.env` file with values appropriate for your host. At minimum:

- `PORT=4000`
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
- Database: SQLite file on a persistent volume for low-traffic MVPs

## Security checklist

- Keep `ENABLE_DEMO_DATA=false` in production
- Rotate the JWT secret and never commit it
- Restrict CORS to your real public domain(s)
- Run HTTPS only
- Use a reverse proxy such as Nginx or managed hosting with TLS termination
- Keep server logs and DB files outside the public web root
