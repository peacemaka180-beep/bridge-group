// backend/security.js
//
// Central security middleware for the Bridge Group API.
// Import and apply this in server.js, BEFORE your route handlers.
//
// What this covers:
//   1. Security headers (helmet)
//   2. Rate limiting (brute-force / scraping protection)
//   3. CSRF protection for cookie-based requests
//   4. Request body size limits
//   5. Basic input sanitization against NoSQL/operator injection
//   6. A safe CORS allowlist
//
// What this does NOT cover (out of scope for a single file):
//   - SQL injection: you already use parameterized queries ($1, $2, ...)
//     in features.js — keep doing that everywhere, never string-concat SQL.
//   - Password hashing: confirm backend/auth.js uses bcrypt or argon2,
//     never plain text or unsalted hashes.
//   - Secrets management: JWT secret, DB password, etc. must live in
//     environment variables (.env, gitignored), never committed to git.
//
// Install the dependencies this file needs:
//   npm install helmet express-rate-limit
//
// NOTE ON CSRF: this file deliberately does NOT include csurf.
// Your app authenticates with a Bearer token in the Authorization header
// (JWT in localStorage), not a session cookie, so the browser never
// auto-attaches credentials to a forged cross-site request — which is
// the entire mechanism CSRF protection defends against. csurf is also
// an archived, unmaintained package whose dependency chain (csrf-tokens
// -> base64-url) has a HIGH severity vulnerability as of this writing.
// Don't add it back unless you migrate to cookie-based sessions, and if
// you do, use a maintained alternative (e.g. "csrf-csrf" or the double-
// submit-cookie pattern implemented directly), not csurf.

import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

/* ------------------------------------------------------------------ */
/* 1. Security headers                                                 */
/* ------------------------------------------------------------------ */

export const securityHeaders = helmet({
  contentSecurityPolicy: false, // enable and configure this once you know every asset host you load from
  crossOriginResourcePolicy: { policy: 'same-site' },
})

/* ------------------------------------------------------------------ */
/* 2. Rate limiting                                                    */
/* ------------------------------------------------------------------ */

// General API traffic: generous, just stops scripted hammering.
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down and try again shortly.' },
})

// Auth endpoints: tight, because this is where brute-forcing happens.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only counts failed attempts
  message: { message: 'Too many sign-in attempts. Please wait 15 minutes and try again.' },
})

/* ------------------------------------------------------------------ */
/* 3. CSRF protection — intentionally not implemented here              */
/* ------------------------------------------------------------------ */
//
// See the note at the top of this file. Nothing to mount for this
// section under the current Bearer-token design. If you later add a
// cookie-based session, come back and add CSRF protection scoped to
// just those routes, using a maintained library (not csurf).

/* ------------------------------------------------------------------ */
/* 4. Body size limits                                                  */
/* ------------------------------------------------------------------ */
// Pass these to express.json()/express.urlencoded() in server.js:
export const jsonLimit = { limit: '1mb' }

/* ------------------------------------------------------------------ */
/* 5. Input sanitization                                                */
/* ------------------------------------------------------------------ */
// Strips keys starting with "$" or containing "." from req.body/query/params,
// which blocks NoSQL/operator-injection style payloads and prototype
// pollution attempts (e.g. {"__proto__": {...}}).
export function sanitizeInput(req, res, next) {
  const clean = (obj) => {
    if (!obj || typeof obj !== 'object') return
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.') || key === '__proto__' || key === 'constructor') {
        delete obj[key]
        continue
      }
      if (typeof obj[key] === 'object') clean(obj[key])
    }
  }
  clean(req.body)
  clean(req.query)
  clean(req.params)
  next()
}

/* ------------------------------------------------------------------ */
/* 6. CORS allowlist                                                    */
/* ------------------------------------------------------------------ */
// Replace with your actual deployed frontend URL(s). Never use
// `origin: true` or `origin: '*'` alongside credentials: true.
export const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  // 'https://your-production-domain.com',
]

export function corsOptionsDelegate(req, callback) {
  const origin = req.header('Origin')
  const allowed = !origin || allowedOrigins.includes(origin)
  callback(null, {
    origin: allowed,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  })
}