# CGVS Auth, Security & Configuration Analysis

**Project:** CGVS (`/home/ahmed/Projects/cgvs/`)
**Analysis Date:** 2025-01-25
**Focus:** Authentication, Authorization, Security Headers, Environment Configuration, Rate Limiting, Encryption
**Comparison Target:** Siraj (`/home/ahmed/Projects/siraj-cert/`)

---

## Table of Contents

1. [JWT Implementation](#1-jwt-implementation)
2. [Password Hashing](#2-password-hashing)
3. [Auth Flow](#3-auth-flow)
4. [Session Management](#4-session-management)
5. [Route Protection](#5-route-protection)
6. [GraphQL Auth](#6-graphql-auth)
7. [Security Headers](#7-security-headers)
8. [Rate Limiting](#8-rate-limiting)
9. [Environment Variables](#9-environment-variables)
10. [Encryption](#10-encryption)
11. [Password Validation](#11-password-validation)
12. [Admin RBAC](#12-admin-rbac)
13. [CORS](#13-cors)
14. [Logging Security](#14-logging-security)
15. [Siraj Comparison: Reuse vs Adaptation](#15-siraj-comparison-reuse-vs-adaptation)
16. [Security Gaps Summary](#16-security-gaps-summary)

---

## 1. JWT Implementation

### Library & Algorithm
- **Library:** `jose` (specifically `SignJWT` and `jwtVerify` from `jose`)
- **Algorithm:** HS256 (HMAC-SHA256)
- **Same library as Siraj:** Yes — Siraj also uses `jose`

### Token Types
CGVS uses a **dual-token system** with two JWT types:

| Token | Expiry | Storage | Purpose |
|-------|--------|---------|---------|
| Access Token | 15 minutes (`"15m"`) | React state (memory only) | API authentication via `Authorization: Bearer <token>` |
| Refresh Token | 7 days (`"7d"`) | httpOnly cookie (`cgvs_refresh_token`) | Session restoration, token rotation |

### JWT Claims (Custom Payload)
```typescript
interface CustomJWTPayload extends JWTPayload {
  userId: number;    // numeric user ID from DB
  email: string;     // user email
  type: "access" | "refresh";  // token type discriminator
}
```

### Token Generation
- **`signToken(payload, expiresIn, type)`** — creates a JWT with `userId`, `email`, `type` claims
- Issuer: `"cgvs"` — hardcoded
- Audience: not set

### Token Verification
- **`verifyToken(token): CustomJWTPayload | null`** — catches errors silently, returns null on failure
- **`extractTokenFromHeader(authHeader): string | null`** — extracts Bearer token from Authorization header

### Secret Management
- **`JWT_SECRET`** env var — required
- **Development fallback:** `"your-secret-key-change-this-in-production"` (hardcoded in `jwt.ts`)
- **Production validation:** `env.ts` enforces JWT_SECRET must be ≥32 chars in production, fails fast with `process.exit(1)` if invalid
- **Security hardening plan** recommends: minimum 64 chars, RS256 algorithm, blacklist mechanism

### Token Rotation
- On refresh: both access and refresh tokens are regenerated
- Old refresh token is not explicitly invalidated (no blacklist)
- Old session entry may be reused or replaced

### Security Notes
- No `issuer` validation in `verifyToken()` (issuer is set on sign but not checked on verify)
- No `audience` validation
- No algorithm pinning in `jwtVerify` (defaults to HS256 but not explicitly restricted)
- No token blacklist for revoked tokens — logout deletes DB sessions but JWT tokens remain valid until expiry

---

## 2. Password Hashing

### Library & Configuration
- **Library:** `bcryptjs` (pure JS implementation, not native `bcrypt`)
- **Same library as Siraj:** Yes — Siraj also uses `bcryptjs`
- **Salt Rounds:** 12 — hardcoded in `password.ts`
- Also hardcoded as 12 in `user.repository.ts` (duplicate constant)

### Functions
```typescript
// password.ts
export async function hashPassword(password: string): Promise<string>
export async function comparePassword(password: string, hash: string): Promise<boolean>
```

### Security Assessment
- 12 rounds is reasonable (industry standard is 10-12)
- `bcryptjs` is pure JS — slower than native `bcrypt` but no native dependencies needed
- No password breach check (e.g., HaveIBeenPwned API)
- No pepper (server-wide secret added before hashing)

---

## 3. Auth Flow

### Login Flow (Client → Server → Token Storage → Subsequent Requests)

```
1. CLIENT: LoginForm.tsx
   └─ User enters email + password
   └─ Calls Apollo `LOGIN_MUTATION` with credentials

2. SERVER: GraphQL Handler (app/api/graphql/route.ts)
   └─ POST → withRateLimit() → GraphQL handler
   └─ Rate limit check (graphqlRateLimiter: 100/min per IP)
   └─ Apollo Server processes mutation

3. SERVER: auth.mutation.ts → login resolver
   └─ userRepo.findByEmail(email) → load user from DB
   └─ comparePassword(password, user.password) → verify credentials
   └─ signToken({ userId, email }, "15m", "access") → access JWT
   └─ signToken({ userId, email }, "7d", "refresh") → refresh JWT
   └─ sessionRepo.create({ userId, sessionId: randomUUID() }) → DB session
   └─ Set cookies: cgvs_session_id, cgvs_refresh_token (httpOnly, secure in prod, sameSite: lax)
   └─ Return { token: accessToken, user: { id, name, email } }

4. CLIENT: AuthContext.tsx
   └─ Store accessToken in React state (memory only — NOT localStorage)
   └─ Store user object in React state
   └─ setIsAuthenticated(true)
   └─ Hard redirect: window.location.href = redirect || "/" (breaks race conditions)

5. SUBSEQUENT REQUESTS:
   └─ Apollo Client authLink adds Authorization: Bearer <accessToken>
   └─ Browser automatically sends httpOnly cookies with every request
   └─ Server: gqlContextFactory verifies JWT, loads user into context
```

### Token Refresh Flow
```
1. On app load: AuthContext calls REFRESH_TOKEN_MUTATION
2. Server: auth.mutation.ts → refreshToken resolver
   a. Try session ID cookie first:
      └─ sessionRepo.findById(sessionId) → load session
      └─ Check lastActivity vs 7-day timeout
      └─ Validate session belongs to requesting user
      └─ Update lastActivity timestamp
   b. If no valid session, try refresh token JWT:
      └─ verifyToken(refreshToken) → decode JWT
      └─ Validate user still exists
   c. If either succeeds:
      └─ Generate new access token (15m)
      └─ Generate new refresh token (7d)
      └─ Rotate: update session, set new cookies
      └─ Return new access token
   d. If both fail: return null → client redirects to login
```

### Logout Flow
```
1. Client: AuthContext calls LOGOUT_MUTATION
2. Server: auth.mutation.ts → logout resolver (authScopes: { loggedIn: true })
   └─ sessionRepo.deleteAllByUserId(user.id) → delete ALL user sessions from DB
   └─ Clear cookies: cgvs_session_id, cgvs_refresh_token
3. Client:
   └─ setAuthToken(null), setUser(null), setIsAuthenticated(false)
   └─ Hard redirect to /login
```

---

## 4. Session Management

### Architecture: DB-Based (PostgreSQL)
CGVS uses **database-backed sessions** — NOT Redis, NOT stateless JWT-only.

### Sessions Table Schema (`server/db/schema/users.ts`)
```typescript
sessions = pgTable("sessions", {
  id: varchar("id").primaryKey(),           // randomUUID() — not auto-increment
  userId: integer("user_id").notNull(),      // FK to users.id
  ipAddress: varchar("ip_address"),          // nullable — NOT populated on login (gap)
  userAgent: varchar("user_agent"),          // nullable — NOT populated on login (gap)
  payload: jsonb("payload"),                // metadata storage (JSON)
  lastActivity: timestamp("last_activity"), // for inactivity timeout
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})
```

### Session Lifecycle
- **Creation:** On successful login, `sessionRepo.create()` inserts a new session with `randomUUID()` as ID
- **Validation:** `refreshToken` resolver checks `lastActivity` against `SESSION_TIMEOUT` (7 days), deletes expired sessions
- **Deletion:** Logout deletes ALL sessions for the user (`deleteAllByUserId`)
- **Cleanup:** `sessionRepo.cleanup()` method exists but is NOT called automatically (no cron, no middleware)

### Session Repository (`server/db/repo/session.repository.ts`)
Key methods:
- `create(data)` — insert new session
- `findById(id)` — lookup by session ID
- `update(id, data)` — update session metadata
- `deleteAllByUserId(userId)` — delete all sessions for a user (logout)
- `cleanup()` — remove expired sessions (not auto-called)

### Security Gaps
1. `ipAddress` and `userAgent` fields exist in schema but are **NOT populated** on login (resolver doesn't pass them)
2. No concurrent session limit (unlimited sessions per user)
3. No session fixation protection (session ID not rotated on privilege change)
4. No "logout all devices" exposed as a user-facing feature
5. Cleanup is manual — expired sessions persist until `cleanup()` is called

---

## 5. Route Protection

### Architecture: Client-Side Only

CGVS route protection is **entirely client-side**. There is **NO server-side middleware auth check**.

### ProtectedRoute Component (`client/components/ProtectedRoute.tsx`)
```typescript
// Checks useAuth() hook for isAuthenticated
// Redirects to /login?redirect=<currentPath> if not authenticated
// Has requireAdmin prop BUT IT'S COMMENTED OUT:
// "todo: Uncomment when we have user roles"
```

### App Layout Structure
```
app/(root)/
  ├─ layout.tsx          — root layout (no auth check)
  ├─ login/page.tsx     — login page (public)
  └─ (auth)/
       ├─ layout.tsx     — wraps children in ProtectedRoute
       ├─ admin/
       │    └─ layout.tsx — checks isAdmin from useAuth (client-side only)
       └─ dashboard/     — protected by parent (auth)/layout.tsx
```

### Middleware (`lib/middleware.ts`)
- **Does NOT perform authentication** — only logs requests
- No redirect logic for unauthenticated users
- No session validation
- No route-based access control

### Security Assessment
| Aspect | Implementation | Risk |
|--------|---------------|------|
| Client-side auth check | ProtectedRoute | Medium — bypassable by disabling JS, but GraphQL mutations still require valid JWT |
| Server-side middleware | None | High — no defense-in-depth at the HTTP layer |
| Admin route protection | Client-side check in admin/layout.tsx | High — admin role check is in ProtectedRoute but commented out; admin layout does its own check |
| Redirect param injection | Possible | Medium — redirect URL from query param not sanitized |

### How Siraj Differs
Siraj likely uses Next.js middleware for server-side route protection with locale-based routing. CGVS's approach is purely client-side — the real security boundary is GraphQL scope-auth, not route protection.

---

## 6. GraphQL Auth

### Schema Builder Configuration (`server/graphql/gqlSchemaBuilder.ts`)
```typescript
import SchemaBuilder, { ScopeAuthPlugin } from "@pothos/core";

export const builder = new SchemaBuilder<{
  Context: BaseContext;
  AuthScopes: {
    loggedIn: boolean;
    admin: boolean;
    role: string;  // role name to check
  };
}>({ 
  plugins: [ScopeAuthPlugin],
  authScopes: (ctx) => ({
    loggedIn: !!ctx.user,
    admin: ctx.roles?.includes("admin") ?? false,
    role: (r: string) => ctx.roles?.includes(r) ?? false,
  }),
});
```

### Context (`server/graphql/gqlContext.ts`, `gqlContextFactory.ts`)
```typescript
interface BaseContext {
  user: { id: number; email: string } | null;
  roles: string[];        // loaded from DB via user → roles → userRoles relation
  token: string | null;   // access token
  sessionId: string | null;
  refreshToken: string | null;
}
```

Context factory flow:
1. Extract access token from `Authorization: Bearer <token>` header
2. Extract refresh token and session ID from cookies
3. Verify access token JWT → decode `userId`, `email`
4. Load user from DB, load roles via `user.roles` relation
5. Build context with `{ user, roles, token, sessionId, refreshToken }`

### Permission Rules (Scope-Auth)

| Query/Mutation | Auth Scope | Notes |
|----------------|-----------|-------|
| `me` query | `{ loggedIn: true }` | Returns current user |
| `users` query | **NONE** | ⚠️ **SECURITY GAP** — publicly lists ALL users |
| `user` query | **NONE** | Publicly fetches any user by ID |
| `login` mutation | **NONE** | Public (expected) |
| `refreshToken` mutation | **NONE** | Public (expected, uses cookies) |
| `logout` mutation | `{ loggedIn: true }` | Requires auth |
| Template/resource mutations | **NONE** | ⚠️ No auth scopes on most mutations |

### Apollo Server Hardening (`app/api/graphql/route.ts`)
- **CSRF Prevention:** Apollo's `csrfPrevention` with `x-apollo-operation-name`, `apollo-require-preflight`, `x-csrf-token` headers
- **Introspection:** Disabled in production, enabled in development
- **Schema details:** Hidden from client errors in production (`hideSchemaDetailsFromClientErrors: true`)
- **Stacktraces:** Included in error responses only in development
- **Persisted queries:** Enabled with cache adapter, indefinite TTL
- **Landing page:** Disabled in production, local default in dev

### Security Notes
- GraphQL context loads roles on EVERY request — potential N+1 or performance concern
- No per-field auth scopes — only top-level query/mutation scopes
- No depth limiting or query complexity analysis
- `users` query exposes all user data (emails, IDs, names) to anyone

---

## 7. Security Headers

### Configuration (`next.config.ts`)

| Header | Value | Assessment |
|--------|-------|------------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Good — but missing `preload` |
| `X-Frame-Options` | `DENY` | Good — prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Good — prevents MIME sniffing |
| `X-XSS-Protection` | `1; mode=block` | Legacy — deprecated in modern browsers, can introduce vulnerabilities |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Good |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` | Good — disables sensitive APIs |
| `X-DNS-Prefetch-Control` | `off` | Good — prevents DNS prefetching |

### Content Security Policy (CSP)

**Production CSP:**
```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: blob: https:;
connect-src 'self' https:;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

**Development CSP:** Same as production but adds `https://www.google.com` to style-src (for Google Fonts)

### CSP Weaknesses
1. **`unsafe-eval` in script-src** — allows `eval()` — needed by some dev tools but risky in production
2. **`unsafe-inline` in script-src** — allows inline scripts — XSS risk
3. **No nonce-based CSP** — no per-request nonce for script/style tags
4. **No `strict-dynamic`** — not leveraging modern CSP features
5. `style-src` allows Google Fonts (external domain)

### Missing Headers
- `Cross-Origin-Embedder-Policy` — not set
- `Cross-Origin-Opener-Policy` — not set
- `Cross-Origin-Resource-Policy` — not set

---

## 8. Rate Limiting

### Architecture: Cache-Service-Backed (Redis OR PostgreSQL)

Rate limiting uses a custom `RateLimiter` class backed by `cacheService` which abstracts either Redis or PostgreSQL (configurable via `CACHE_PROVIDER` env var).

### Rate Limiter Configuration (`server/lib/ratelimit.ts`)

| Limiter | Scope | Limit | Window | Key Pattern |
|---------|-------|-------|--------|-------------|
| `authRateLimiter` | Auth mutations | 10 requests | 15 minutes | `ratelimit:auth:{ip}` |
| `graphqlRateLimiter` | All GraphQL | 100 requests | 1 minute | `ratelimit:graphql:{ip}` |
| `generalRateLimiter` | General API | 200 requests | 1 minute | `ratelimit:api:{ip}` |

### Implementation Details
```typescript
class RateLimiter {
  // Uses cacheService (Redis or PostgreSQL-backed)
  // limitSimple: simple counter with TTL
  // limitSliding: sliding window (BUT getCount falls back to simple GET — mismatch)
}
```

- **`checkRateLimit(identifier, limiter)`** — helper that uses `limitSimple` (counter-based)
- **Sliding window** `limitSliding` method exists but `getCount` doesn't use the sorted set — implementation mismatch
- **Fail-open design:** Returns `success: true` if cache errors occur (`catch` returns allowed)

### Client Identification
```typescript
function getClientIdentifier(request: NextRequest): string {
  // Checks: x-forwarded-for → x-real-ip → cf-connecting-ip → fallback
}
```

### Rate Limit Application
Rate limiting is applied at the **HTTP route handler level** (`app/api/graphql/route.ts`):
```typescript
// POST and GET handlers both go through withRateLimit wrapper
async function withRateLimit(request, handler) {
  const identifier = getClientIdentifier(request);
  const { success, limit, remaining, reset } = await checkRateLimit(identifier, graphqlRateLimiter);
  if (!success) return NextResponse.json({ errors: [...] }, { status: 429, ... });
  // ... process request, add X-RateLimit-* headers
}
```

### Auth-Specific Rate Limiting
The `authRateLimiter` (10 requests/15 minutes) is defined but **NOT actively wired** in the auth mutations or the GraphQL route handler. Only `graphqlRateLimiter` (100/min) is applied at the route level. Auth-specific rate limiting would need manual application in auth resolvers.

### Rate Limit Headers
Response headers set on all rate-limited responses:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
- `Retry-After` (on 429 responses only)

### Security Assessment
| Aspect | Status | Notes |
|--------|--------|-------|
| Redis-backed | Yes (via cacheService) | Also supports PostgreSQL fallback |
| Per-route | Partial | Only GraphQL endpoint has rate limiting; auth limiter defined but not wired |
| Fail-open | Yes | Security tradeoff — availability over strictness |
| Sliding window | Broken | Falls back to simple counter due to implementation bug |
| Client identification | IP-based | Can be spoofed via x-forwarded-for if not behind trusted proxy |

---

## 9. Environment Variables

### Complete List from `.env.example`

#### Database
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (`postgresql://user:pass@host:port/db`) |

#### JWT / Auth
| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | JWT signing secret — ≥32 chars in production |
| `ADMIN_EMAIL` | No | Bootstrap admin user email |
| `ADMIN_PASSWORD` | No | Bootstrap admin user password |

#### Redis / Cache
| Variable | Required | Description |
|----------|----------|-------------|
| `REDIS_PROVIDER` | Yes | `"local"` or `"upstash"` |
| `REDIS_URL` | Conditional | Local Redis connection string (required if `REDIS_PROVIDER=local`) |
| `UPSTASH_REDIS_REST_URL` | Conditional | Upstash REST URL (required if `REDIS_PROVIDER=upstash`) |
| `UPSTASH_REDIS_REST_TOKEN` | Conditional | Upstash REST token |
| `CACHE_PROVIDER` | Yes | `"redis"` or `"postgres"` — cache backend for rate limiting |

#### GraphQL
| Variable | Required | Description |
|----------|----------|-------------|
| `GRAPHQL_ENCRYPTION_KEY` | Yes* | For GraphQL binary serialization encryption |
| `NEXT_PUBLIC_ENABLE_BINARY_GRAPHQL` | No | Enables binary GraphQL transport |

#### CORS / Security
| Variable | Required | Description |
|----------|----------|-------------|
| `ALLOWED_ORIGIN` | Conditional | CORS allowed origin (required in production) |

#### Storage
| Variable | Required | Description |
|----------|----------|-------------|
| `STORAGE_PROVIDER` | Yes | `"local"`, `"gcp"`, `"vercel"`, `"s3"`, `"r2"` |
| `LOCAL_STORAGE_PATH` | Conditional | Local storage directory |
| `NEXT_PUBLIC_BASE_URL` | No | Public base URL for signed URLs |
| `SIGNED_URL_CLEANUP_STRATEGY` | No | `"lazy"`, `"cron"`, `"both"`, `"disabled"` |
| `SIGNED_URL_CLEANUP_CRON_SCHEDULE` | No | Cron schedule for cleanup |
| `CRON_SECRET` | No | Authenticates cron request endpoints |

#### GCP Storage
| Variable | Required | Description |
|----------|----------|-------------|
| `GCP_PROJECT_ID` | Conditional | Google Cloud project ID |
| `GCP_BUCKET_NAME` | Conditional | GCS bucket name |
| `GCP_SECRET_VERSION` | Conditional | Secret version |
| `GCP_SECRET_ID` | Conditional | Secret ID |

#### Environment
| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `"development"`, `"production"`, `"test"` |

### Environment Validation (`server/lib/env.ts`)
- Auto-validates on module import (side-effect)
- **Production-only checks:** `JWT_SECRET` must be ≥32 chars, `DATABASE_URL` must start with `postgresql://`, Redis config must match provider type
- **Fail-fast:** Calls `process.exit(1)` if validation fails
- **Development:** Falls back to default values for missing optional vars

### Security Notes
- `ADMIN_PASSWORD` in env vars — used for bootstrap admin creation (only at first run)
- `CRON_SECRET` — authenticates cron endpoints (prevents external invocation)
- `GRAPHQL_ENCRYPTION_KEY` — declared but **not actively used** in code (binary GraphQL feature appears unimplemented)
- No `.env` file in repo — only `.env.example` (secrets excluded)
- Environment type definitions in `server/types/environment.d.ts` provide type safety

---

## 10. Encryption

### Database Column-Level Encryption
**CGVS has NO database column-level encryption.**

- `users` table: email stored as plaintext (`varchar`), phone numbers stored as plaintext
- `passwordResetTokens` table: tokens stored as **plaintext** (`varchar`) — not hashed
- `sessions` table: `payload` JSONB field stores metadata in plaintext
- No AES-256-GCM, no PostgreSQL `pgcrypto`, no application-level encryption utilities

### GraphQL Encryption
- **`GRAPHQL_ENCRYPTION_KEY`** environment variable exists
- **`NEXT_PUBLIC_ENABLE_BINARY_GRAPHQL`** env var exists
- **Type definitions** (`environment.d.ts`) declare both variables
- **Implementation:** Searching all server and client code reveals **NO usage** of these variables — the binary GraphQL encryption feature appears to be **planned but not implemented**

### Transport Encryption
- HTTPS enforced via HSTS header in production
- No certificate pinning
- No client-side encryption for sensitive fields before transmission

### Siraj Comparison
Siraj implements **AES-256-GCM column-level encryption** for sensitive database fields. CGVS has **no equivalent** — this is a major gap that needs to be built from scratch when porting to Siraj's architecture.

---

## 11. Password Validation

### Client-Side Validation (`utils/auth.ts` — shared)

```typescript
// AuthUtils class — client-side only validation
static validatePassword(password: string): { isValid: boolean; error?: string } {
  // Checks: empty → error
  // Checks: min 8 characters → error if shorter
  // Returns: { isValid: boolean, error?: string }
}

static validatePasswordMatch(password: string, confirmPassword: string) {
  // Checks: passwords match
}

static validateUserName(name: string): { isValid: boolean; error?: string } {
  // Checks: 3-255 characters
}
```

### Validation Rules
| Rule | Enforced | Location |
|------|----------|----------|
| Minimum 8 characters | Yes | Client-side (`utils/auth.ts`) |
| Maximum length | No | Not enforced |
| Uppercase required | No | Not enforced |
| Lowercase required | No | Not enforced |
| Number required | No | Not enforced |
| Special character required | No | Not enforced |
| Common password check | No | Not checked against breach databases |
| Server-side validation | No | Login/register mutations do NOT validate password complexity |

### Security Assessment
- Password validation is **client-side only** — easily bypassed
- Only enforces minimum 8 characters — no complexity requirements
- Security hardening plan recommends: min 12 chars, uppercase, lowercase, number, special char, breach check

---

## 12. Admin RBAC

### Role System Architecture

### Database Schema
```typescript
// roles table — defines available roles
roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
});

// userRoles table — many-to-many user↔role junction
userRoles = pgTable("user_roles", {
  userId: integer("user_id").references(() => users.id),
  roleId: integer("role_id").references(() => roles.id),
});
```

### Known Roles
Based on context and auth scope definitions:
- `admin` — administrative access
- `teacher` — (inferred from THE_HARDENING_PLAN docs and project domain)
- `student` — (inferred from project domain)

### Role Loading
In `gqlContextFactory.ts`:
```typescript
// After verifying JWT, load user from DB
const user = await userRepo.findById(payload.userId);
// User repo eagerly loads roles via Drizzle relations
// user.roles → array of role names (strings)
// Passed as ctx.roles in GraphQL context
```

### Permission Enforcement

| Layer | Implementation | Status |
|-------|---------------|--------|
| GraphQL scope-auth | `admin: ctx.roles.includes("admin")` | Defined but minimally used |
| GraphQL role scope | `role: (r) => ctx.roles.includes(r)` | Defined but **not used on any query/mutation** |
| ProtectedRoute | `requireAdmin` prop | ⚠️ **Commented out** ("todo: Uncomment when we have user roles") |
| Admin layout | `isAdmin` check via `useAuth()` | Client-side only — checks `user.roles?.includes("admin")` |
| Server middleware | None | No server-side role enforcement |

### Security Assessment
1. **No role enforcement on GraphQL queries/mutations** — the `users` query has no authScopes, exposing all user data
2. **Admin route protection is client-side only** and **commented out in ProtectedRoute**
3. **No role-based field-level auth** — no per-field access control
4. Roles are loaded from DB on every request — potential performance concern
5. No role hierarchy (admin > teacher > student) — flat string matching only
6. No audit logging for admin actions

---

## 13. CORS

### Configuration (Two Locations)

#### 1. `next.config.ts` — Rewrites for `/api/:path*`
Security headers are set globally including some CORS-related headers.

#### 2. `app/api/graphql/route.ts` — OPTIONS Handler
```typescript
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": process.env.NODE_ENV === "production"
        ? process.env.ALLOWED_ORIGIN || "https://yourdomain.com"  // ⚠️ hardcoded fallback
        : "http://localhost:3000",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, X-Requested-With, X-Refresh-Token, X-Apollo-Operation-Name, Apollo-Require-Preflight, X-CSRF-Token",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400",
    },
  });
}
```

### CORS Assessment
| Aspect | Value | Risk |
|--------|-------|------|
| Allowed Origin (prod) | `ALLOWED_ORIGIN` env var | Good if set |
| Fallback Origin (prod) | `https://yourdomain.com` | ⚠️ Hardcoded — if `ALLOWED_ORIGIN` not set, allows a non-existent domain (safe but misleading) |
| Allowed Origin (dev) | `http://localhost:3000` | Correct |
| Credentials | `true` | Required for cookies — correct |
| Methods | GET, POST, OPTIONS, HEAD | Reasonable for GraphQL |
| Max-Age | 86400 (24h) | Standard |
| CORS applied to | Only `/api/graphql` OPTIONS handler | Other routes don't have explicit CORS |

### Security Gaps
1. **Hardcoded fallback origin** in production — `"https://yourdomain.com"` is a placeholder
2. CORS only configured for the GraphQL route — other API routes have no CORS headers
3. No origin validation/whitelist pattern — single origin only
4. `Access-Control-Allow-Credentials: true` with a potentially incorrect fallback origin could expose the API

---

## 14. Logging Security

### Logger Architecture

#### Server Logger (`server/lib/logger.ts`)
- Custom `Logger` class wrapping `BaseLogger` from `lib/base-logger.ts`
- Methods: `logger.info`, `logger.warn`, `logger.error`, `logger.debug`
- Uses `no-console` ESLint rule enforcement — all logging goes through custom logger

#### Base Logger (`lib/base-logger.ts`)
```typescript
class BaseLogger {
  // File-based logging to logs/ directory
  // ONLY enables in development (NODE_ENV !== "production")
  // 7-day log retention with automated cleanup
  // Plain text format (not structured JSON)
  // No PII scrubbing mechanism
}
```

### Logging Characteristics

| Aspect | Value | Assessment |
|--------|-------|------------|
| Active in production | **No** | ⚠️ Logger disabled entirely in production — no observability |
| Format | Plain text | Not structured — harder to search/aggregate |
| PII scrubbing | **None** | ⚠️ No mechanism to redact emails, passwords, tokens |
| Log retention | 7 days | Automatic cleanup |
| Log level filtering | None in production | N/A since logging is disabled |
| Audit logging | None | No admin action audit trail |
| Request logging | Middleware only | Logs IP, user-agent, request ID — no response logging |

### Middleware Logging (`lib/middleware.ts`)
```typescript
// Logs: timestamp, method, path, IP address, user-agent, request ID
// Does NOT log: request body, response body, auth tokens
// Generates request ID for correlation
```

### Security Concerns
1. **No production logging** — zero observability and no security event detection in production
2. **No PII scrubbing** — if logging were enabled in production, passwords/emails/tokens could leak
3. **No structured logging** — plain text makes log aggregation tools (ELK, Datadog) ineffective
4. **No audit trail** — admin actions, auth events, data changes not logged
5. **Rate limit exceeded** events ARE logged via `logger.warn()` in the route handler

---

## 15. Siraj Comparison: Reuse vs Adaptation

### Directly Reusable (Same Library/Pattern)

| Component | CGVS | Siraj | Reusability |
|-----------|------|-------|-------------|
| JWT Library | `jose` (HS256) | `jose` (HS256) | ✅ Directly reusable — same library, same algorithm |
| Password Hashing | `bcryptjs` (12 rounds) | `bcryptjs` (12 rounds) | ✅ Directly reusable — identical implementation |
| GraphQL Auth Plugin | Pothos `ScopeAuthPlugin` | Pothos `ScopeAuthPlugin` | ✅ Pattern reusable — scope definitions may need extension |
| Auth scopes pattern | `loggedIn`, `admin`, `role` | Equivalent scopes | ✅ Pattern reusable — Siraj likely has more complete scopes |
| httpOnly cookies | Yes (session + refresh) | Yes | ✅ Pattern reusable |
| CSRF Prevention | Apollo `csrfPrevention` | Apollo equivalent | ✅ Directly reusable |

### Needs Adaptation (Different Implementation, Same Concept)

| Component | CGVS | Siraj | Adaptation Needed |
|-----------|------|-------|-------------------|
| Session management | DB-backed (PostgreSQL sessions table) | Stateless JWT (likely) | Siraj probably uses JWT-only sessions — CGVS's DB sessions add complexity but enable server-side revocation. Decide: keep DB sessions for revocation capability or use Siraj's stateless approach |
| Rate limiting | Custom `RateLimiter` class via `cacheService` (Redis/Postgres) | Redis-based | Similar concept but CGVS uses an abstraction layer over Redis. Siraj likely uses Redis directly. Adapt: use Siraj's Redis rate limiter interface, keep CGVS's limiter configurations (10/15min auth, 100/min GraphQL) |
| Rate limit application | HTTP route handler wrapper | Unknown | CGVS applies at `app/api/graphql/route.ts` — adapt to Siraj's GraphQL route setup |
| Security headers | `next.config.ts` | `next.config.ts` | Mostly reusable — merge CGVS headers with Siraj's existing headers. Siraj likely has nonce-based CSP (better) |
| CORS | OPTIONS handler in route.ts | Unknown | Adapt to Siraj's route structure |
| Cookie configuration | `sameSite: "lax"`, secure in prod | Likely similar | Reusable — consider upgrading to `"strict"` per hardening plan |
| Client auth context | `AuthContext.tsx` with memory-only token | Unknown | Pattern reusable — memory-only token storage is best practice |
| ProtectedRoute | Client-side component | Likely server middleware | Siraj likely has server-side middleware — prefer that over client-side |
| Env validation | `env.ts` with fail-fast | Siraj equivalent | Pattern reusable — adapt env var list to Siraj's needs |

### Must Build From Scratch (CGVS Lacks, Siraj Has)

| Component | CGVS Status | Siraj Has | Build Effort |
|-----------|-------------|-----------|--------------|
| **Database column-level encryption** | ❌ None | ✅ AES-256-GCM | High — need to build encryption service, identify sensitive columns, implement encrypt/decrypt in repository layer |
| **Production logging** | ❌ Disabled in prod | ✅ Active | Medium — need structured JSON logging, log level filtering, PII scrubbing |
| **PII scrubbing** | ❌ None | Unknown | Medium — implement log sanitization for emails, phones, tokens |
| **Password complexity** | ❌ Min 8 chars only | Unknown | Low — add complexity rules to validation |
| **Token blacklist** | ❌ None | Unknown | Medium — implement Redis-based blacklist for revoked tokens |
| **Server-side route protection** | ❌ Client-side only | Likely middleware | Medium — implement Next.js middleware auth checks |
| **Auth-specific rate limiting** | ❌ Not wired | Unknown | Low — wire `authRateLimiter` into auth resolvers |
| **Session cleanup cron** | ❌ Manual cleanup | N/A if stateless | Low — add cron job or middleware-triggered cleanup |
| **Query depth/complexity limiting** | ❌ None | Unknown | Medium — add GraphQL depth/complexity analysis plugin |
| **Audit logging** | ❌ None | Unknown | Medium — log admin actions, auth events |

### Key Architectural Differences

1. **Session model**: CGVS uses DB-backed sessions (enables server-side revocation, concurrent session tracking). Siraj likely uses stateless JWT (simpler, scalable, but can't revoke individual tokens without a blacklist). Recommendation: Keep DB sessions if revocation is a requirement.

2. **Rate limiting abstraction**: CGVS uses a `cacheService` abstraction that can back onto Redis or PostgreSQL. Siraj likely uses Redis directly. Consider keeping the abstraction for flexibility.

3. **Encryption gap**: CGVS has NO column-level encryption. Siraj has AES-256-GCM. This is the **biggest gap** — all sensitive data (emails, phone numbers, tokens) in CGVS is stored in plaintext.

4. **Route protection**: CGVS is client-side only (bypassable). Siraj likely has server-side middleware. This is a critical security gap in CGVS.

---

## 16. Security Gaps Summary

### Critical Priority

| # | Gap | Impact | Remediation |
|---|-----|--------|-------------|
| 1 | `users` query has no authScopes | Anyone can list all users (emails, IDs, names) | Add `authScopes: { loggedIn: true }` or admin-only |
| 2 | `user` query has no authScopes | Anyone can fetch any user by ID | Add `authScopes: { loggedIn: true }` |
| 3 | No database column-level encryption | Sensitive data (emails, phones) stored in plaintext | Implement AES-256-GCM encryption service |
| 4 | `passwordResetTokens` stored in plaintext | Token theft from DB = account takeover | Hash tokens before storing (SHA-256) |
| 5 | Admin RBAC in ProtectedRoute commented out | Client-side admin protection disabled | Uncomment and implement server-side checks |
| 6 | No server-side middleware auth | All route protection is client-side only | Implement Next.js middleware with JWT verification |

### High Priority

| # | Gap | Impact | Remediation |
|---|-----|--------|-------------|
| 7 | No password complexity requirements | Weak passwords allowed | Add uppercase, lowercase, number, special char requirements |
| 8 | Rate limiter fails open | DDoS protection disabled if cache fails | Consider fail-closed with logging |
| 9 | CORS has hardcoded fallback origin in production | Misleading/incorrect CORS config | Require `ALLOWED_ORIGIN` to be set in production |
| 10 | No production logging | Zero observability, no security events | Enable structured JSON logging in production |
| 11 | No PII scrubbing in logs | Risk of sensitive data in logs | Implement log sanitization |
| 12 | No GraphQL depth/complexity limiting | DoS via deeply nested queries | Add `graphql-depth-limit` or complexity plugin |
| 13 | No token blacklist on logout | JWTs remain valid until expiry | Implement Redis-based blacklist with TTL |
| 14 | Sessions table ipAddress/userAgent not populated | No session audit trail | Pass IP and user-agent on session creation |

### Medium Priority

| # | Gap | Impact | Remediation |
|---|-----|--------|-------------|
| 15 | CSP uses `unsafe-eval` and `unsafe-inline` | XSS risk | Implement nonce-based CSP |
| 16 | HSTS missing `preload` | First-visit vulnerability | Add `preload` directive |
| 17 | Auth-specific rate limiter not wired | Auth endpoints not individually rate-limited | Wire `authRateLimiter` in auth mutations |
| 18 | Session cleanup not automatic | Expired sessions accumulate | Add cron job or middleware-triggered cleanup |
| 19 | No concurrent session limit | Unlimited sessions per user | Add max 3 concurrent sessions policy |
| 20 | JWT issuer not validated on verify | Potential cross-application token use | Validate issuer in `verifyToken()` |
| 21 | `X-XSS-Protection` header (deprecated) | Can introduce vulnerabilities in legacy browsers | Remove this header |
| 22 | No audit logging for admin actions | No accountability for privileged operations | Log all admin mutations |
| 23 | GRAPHQL_ENCRYPTION_KEY declared but unused | Dead config — confusing | Remove or implement the feature |
| 24 | No redirect URL sanitization | Open redirect via `?redirect=` param | Validate redirect URLs against allowlist |

---

## Appendix: File Reference

| File | Path | Purpose |
|------|------|---------|
| JWT Implementation | `server/lib/auth/jwt.ts` | Token signing/verification |
| Password Hashing | `server/lib/auth/password.ts` | bcrypt hash/compare |
| Auth Barrel | `server/lib/auth/index.ts` | Exports jwt + password modules |
| Env Validation | `server/lib/env.ts` | Environment variable validation |
| Rate Limiting | `server/lib/ratelimit.ts` | Custom RateLimiter class |
| Server Logger | `server/lib/logger.ts` | Logger wrapping BaseLogger |
| Base Logger | `lib/base-logger.ts` | File-based logging (dev only) |
| Email Service | `server/lib/email.ts` | Email validation/sending |
| Phone Validation | `server/lib/phoneNumber.ts` | Phone number validation |
| Server Enums | `server/lib/enum.ts` | Server-side enums |
| User Repository | `server/db/repo/user.repository.ts` | User CRUD, findByEmail, role loading |
| Session Repository | `server/db/repo/session.repository.ts` | Session CRUD, cleanup |
| Schema (Users) | `server/db/schema/users.ts` | users, roles, userRoles, sessions, passwordResetTokens |
| Auth Mutations | `server/graphql/mutation/auth.mutation.ts` | login, refreshToken, logout |
| Auth Queries | `server/graphql/query/auth.query.ts` | me, users, user |
| Auth Pothos | `server/graphql/pothos/auth.pothos.ts` | Pothos type definitions for auth |
| Schema Builder | `server/graphql/gqlSchemaBuilder.ts` | ScopeAuthPlugin config |
| GraphQL Context | `server/graphql/gqlContext.ts` | Context interface |
| Context Factory | `server/graphql/gqlContextFactory.ts` | Context creation, JWT verification |
| GraphQL Route | `app/api/graphql/route.ts` | Apollo Server, rate limiting, CORS |
| Client Auth Context | `client/contexts/AuthContext.tsx` | Client-side auth state |
| ProtectedRoute | `client/components/ProtectedRoute.tsx` | Route protection wrapper |
| LoginForm | `client/views/auth/LoginForm.tsx` | Login form component |
| Login Page | `app/(root)/login/page.tsx` | Login route page |
| Auth Layout | `app/(root)/(auth)/layout.tsx` | Protected layout wrapper |
| Admin Layout | `app/(root)/(auth)/admin/layout.tsx` | Admin route guard |
| Next Config | `next.config.ts` | Security headers, CSP, CORS |
| Env Example | `.env.example` | Environment variable template |
| Middleware | `lib/middleware.ts` | Request logging (no auth) |
| Shared Auth Utils | `utils/auth.ts` | Password validation rules |
| Server Auth Utils | `server/utils/auth.utils.ts` | Token extraction utilities |
| Environment Types | `server/types/environment.d.ts` | ProcessEnv type declarations |
| ESLint Config | `eslint.config.mjs` | Client/server boundary enforcement |
| AGENTS.md | `AGENTS.md` | Agent coding rules |
