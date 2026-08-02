# Siraj Auth & Permissions System Analysis

**Project:** Siraj (`/home/ahmed/Projects/siraj-cert/`)
**Analysis Date:** 2026-08-01
**Focus:** Authentication, Authorization, Sessions, Permissions, Impersonation, Encryption, Per-Role Data Access
**Purpose:** Reference for certificate feature integration

---

## Table of Contents

1. [Auth Schema (Users, Sessions, Impersonation)](#1-auth-schema-users-sessions-impersonation)
2. [Auth Enums](#2-auth-enums)
3. [Auth Services (Login, Session, Password, Demo)](#3-auth-services-login-session-password-demo)
4. [JWT Implementation](#4-jwt-implementation)
5. [Session Management (DB + Redis Hybrid)](#5-session-management-db--redis-hybrid)
6. [Permissions Service](#6-permissions-service)
7. [Permission Schema (Groups, Overrides)](#7-permission-schema-groups-overrides)
8. [Permission Enums (AppPermission catalog)](#8-permission-enums-apppermission-catalog)
9. [Auth Context (GraphQL)](#9-auth-context-graphql)
10. [Auth Scopes in Pothos Resolvers](#10-auth-scopes-in-pothos-resolvers)
11. [Role Hierarchy](#11-role-hierarchy)
12. [Column-Level Encryption (AES-256-GCM)](#12-column-level-encryption-aes-256-gcm)
13. [Impersonation Feature](#13-impersonation-feature)
14. [Permission Group Simulation](#14-permission-group-simulation)
15. [Per-Role Data Access](#15-per-role-data-access)
16. [Server-Side Page Guards](#16-server-side-page-guards)
17. [Certificate Feature Integration Notes](#17-certificate-feature-integration-notes)

---

## 1. Auth Schema (Users, Sessions, Impersonation)

### Users Table
**File:** `backend/db/schema/users/users.ts:23-59`

```typescript
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerifiedAt: timestamp("email_verified_at", ...),
  password: varchar("password", { length: 255 }).notNull(), // bcrypt hash
  rememberTokenHash: varchar("remember_token_hash", { length: 255 }),
  avatarFilePath: varchar("avatar_file_path", { length: 1024 }),
  avatarUrl: varchar("avatar_url", { length: 1024 }),
  phone: varchar("phone", { length: 50 }),
  status: accountStatusEnum("status").notNull().default(AccountStatus.ACTIVATED),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  timezone: varchar("timezone", { length: 100 }).notNull().default(IanaTimezone.UTC),
  displayCurrency: currencyCodeEnum("display_currency").$type<CurrencyCode>(),
  lastLoginAt: timestamp("last_login_at", ...),
  createdAt: timestamp("created_at", ...).notNull(),
  updatedAt: timestamp("updated_at", ...).notNull(),
  deletedAt: timestamp("deleted_at", ...), // soft-delete (RLS active)
});
```

Key points:
- **No `role` column** — role is *derived* from permission-group membership (see §11). There IS an `isSuperAdmin` boolean escape-hatch.
- **RLS active** — PostgreSQL Row-Level Security filters soft-deleted records (`deleted_at IS NOT NULL`) automatically for SELECT/UPDATE (comment at line 21-22).
- `isSuperAdmin` bypasses all permission checks and grants every `AppPermission` in the catalog.

### Sessions Tables (Legacy + Metadata + Config)
**File:** `backend/db/schema/users/users.ts:61-113`

Three session-related tables exist:

1. **`sessions`** (legacy, lines 63-77) — `DEPRECATED`. Stores `hashedId` (PK), `userId`, `ipAddress`, `userAgent`, `payload` (JSON string), `lastActivity`. Kept for backwards compatibility.
2. **`session_metadata`** (lines 81-103) — New metadata table. Stores `sessionId`, `userId`, device info, `createdAt`, `lastActivityAt`, `expiresAt`. Actual session data is in Redis with TTL.
3. **`session_config`** (lines 106-113) — Per-role session config: `roleName`, `ttlSeconds` (default 604800 = 7 days), `maxConcurrentSessions` (default 5).

```typescript
export const sessionConfig = pgTable("session_config", {
  id: uuid("id").defaultRandom().primaryKey(),
  roleName: varchar("role_name", { length: 100 }).notNull().unique(),
  ttlSeconds: integer("ttl_seconds").notNull().default(604800),
  maxConcurrentSessions: integer("max_concurrent_sessions").notNull().default(5),
  ...
});
```

### Password Reset & Rate Limiting
**File:** `backend/db/schema/users/users.ts:115-147`

- **`passwordResetTokens`** — `email`, `hashedToken`, `expiresAt`.
- **`authRateLimits`** — `ipAddress`, `email`, `attempts`, `lockedUntil`. Unique on `(ipAddress, email)`.

### Impersonation Sessions Table
**File:** `backend/db/schema/auth/impersonation.ts:5-34`

```typescript
export const impersonationSessions = pgTable("impersonation_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorUserId: uuid("actor_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  targetUserId: uuid("target_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  sessionId: varchar("session_id", { length: 255 }).notNull(), // stored HASHED
  reason: text("reason"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  ipAddress: inet("ip_address"),
  userAgent: text("user_agent"),
  isActive: boolean("is_active").notNull().default(true),
});
```

**Critical constraint (partial unique index, line 30-32):**
```typescript
uniqueIndex("impersonation_sessions_one_active_per_actor")
  .on(table.actorUserId)
  .where(sql`${table.isActive} = true`),
```
Only ONE active impersonation per actor at a time.

---

## 2. Auth Enums

### File: `backend/enum/auth/auth.enum.ts`

```typescript
export enum AppLanguage {
  ar = "ar",
  en = "en",
}

export enum AccountStatus {
  ACTIVATED = "ACTIVATED",
  DEACTIVATED = "DEACTIVATED",
}

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ACADEMY_ADMIN = "ACADEMY_ADMIN",
  SUPERVISOR = "SUPERVISOR",
  TEACHER = "TEACHER",
  PARENT = "PARENT",
  STUDENT = "STUDENT",
  STAFF = "STAFF",
  USER = "USER",
  GUEST = "GUEST",
}
```

**Note:** `UserRole` is **not** a stored DB column. It is *derived* from permission-group membership via `resolveRoleFromGroupSlugs()` (see §6, §11). The `GUEST` value is the fallback for unauthenticated / unrecognized users.

### Permission Management Enum
**File:** `backend/enum/permissions/permission-management.enum.ts`

```typescript
export enum OverrideState {
  GRANTED = "GRANTED",
  DENIED = "DENIED",
}
```

Used by `user_permission_overrides` to grant/deny individual permissions to a user on top of their group memberships.

---

## 3. Auth Services (Login, Session, Password, Demo)

### Barrel
**File:** `backend/services/auth/index.ts` — exports:
- `AuthPasswordService`
- `DemoAuthService`
- `ImpersonationService`
- `PermissionGroupSimulationService`
- `PermissionManagementService`
- `PermissionsService`
- `SessionService`

### Login Mutation
**File:** `backend/graphql/mutation/auth/auth.mutation.ts:170-269`

The `login` resolver flow:
1. **Rate limit** — `checkRateLimit(ipAddress, authRateLimiter)`, then `RateLimitRepository.isLocked(ipAddress, email)`.
2. **Find user** by email via `UserRepository.findByEmail`. Records attempt even on non-existent user to prevent enumeration.
3. **Password verify** — `comparePassword(password, user.password)` (bcrypt). Failed attempt → `RateLimitRepository.recordAttempt`; may lock account (`result.isLocked`).
4. **Status check** — throws `accountDeactivated` if `user.status === AccountStatus.DEACTIVATED`.
5. **Reset attempts** on success.
6. **Generate tokens** — `generateAccessToken(user.id, user.email)` + `generateRefreshToken(user.id, user.email)`.
7. **Create session** — `SessionRepository.create({ hashedId: sessionId (a raw UUID), userId, payload })`. Note: `hashedId` is set to the raw UUID; the repo hashes internally before storage.
8. **Set cookies** — `setAuthCookies(ctx, sessionId, refreshToken, accessToken)` (httpOnly, secure in prod, sameSite lax).

### Session Service
**File:** `backend/services/auth/session.service.ts`

- **`validateSession(rawSessionId)`** (lines 32-79): Transparently migrates legacy SHA-256 session hashes to HMAC-SHA256. Tries HMAC hash first (fast path), then legacy SHA-256 (slow path) and rehashes if found. Also purges orphan sessions referencing non-existent users.
- **`getCurrentUserProfile(userId)`** (lines 81-113): Resolves `safeUser`, permission context, `teacherId`, `parentId`. Teachers must complete national ID on first login (`nationalIdComplete` flag).
- **`logoutUser(input)`** (lines 123-154): Validates session, ends impersonation if active (best-effort), deletes all sessions owned by the session owner.

### Auth Password Service
**File:** `backend/services/auth/auth-password.service.ts`

`changePassword(userId, input, locale)`:
- Verifies `newPassword === confirmPassword`.
- Verifies current password via `comparePassword`.
- Validates strength (`validatePasswordStrength` — currently only enforces min 8 chars, see password.ts lines 36-42).
- Hashes new password (`hashPassword` bcrypt, 12 rounds) and updates via `UserRepository.updatePassword`.

### Password Hashing
**File:** `backend/lib/auth/password.ts`
- **bcryptjs**, `SALT_ROUNDS = 12`.
- `validatePasswordStrength` only enforces `length >= 8` (the full complexity regex version is commented out, lines 11-34).

### Demo Auth Service
**File:** `backend/services/auth/demo-auth.service.ts`

`loginWithGroupSlug(groupSlug, tErrors)`:
- Gated by `IS_DEMO` env var (checked in resolver).
- Excludes internal machine roles (`system_automated`).
- Looks up the permission group by slug, finds the canonical demo user (from `INTERNAL_DEMO_USERS` shared list) or earliest-created group member.
- Bypasses password — issues tokens + creates session directly.

---

## 4. JWT Implementation

### File: `backend/lib/auth/jwt.ts`

- **Library:** `jose` (`SignJWT`, `jwtVerify`).
- **Algorithm:** HS256 (HMAC-SHA256).
- **Secret:** `process.env.JWT_SECRET` (required at module load — throws if missing).
- **Access token expiry:** 15 minutes (`"15m"`).
- **Refresh token expiry:** 7 days (`"7d"`).

### Custom JWT Payload
```typescript
export interface CustomJWTPayload extends JoseJWTPayload {
  userId: string;
  email: string;
  type: "access" | "refresh";
  jti?: string;                       // unique token id (randomUUID)
  // Impersonation-only fields:
  actorUserId?: string;
  impersonation?: true;
  impersonationExpiresAt?: number;
  // Group simulation-only fields:
  groupSimulation?: true;
  groupSimulationSlug?: string;
  groupSimulationExpiresAt?: number;
}
```

### Token Generators
- `generateAccessToken(userId, email)` — standard access token.
- `generateRefreshToken(userId, email)` — standard refresh token.
- `generateImpersonationAccessToken(actorUserId, targetUserId, targetEmail, impersonationExpiresAt)` — access token where `userId`/`email` are the *target* and `actorUserId` + `impersonation: true` mark it as impersonation.
- `generateGroupSimulationAccessToken(userId, email, groupSlug, groupSimulationExpiresAt)` — identity stays as the admin (`userId`), but `groupSimulation: true` and `groupSimulationSlug` tag it.
- `verifyToken(token)` — returns `CustomJWTPayload | null` (swallows errors → null).
- `extractTokenFromHeader(authHeader)` — strips `Bearer ` prefix.

---

## 5. Session Management (DB + Redis Hybrid)

### Architecture
- **Sessions are DB-backed** (`sessions` table stores `hashedId`, `userId`, `payload`, `lastActivity`) AND **Redis-backed** (actual session data with TTL, plus impersonation/group-simulation state).
- The `session_metadata` table tracks device info but the canonical session is in `sessions` + Redis.
- `session_config` allows *per-role* TTL and concurrent session limits (default 7 days / 5 sessions).

### Session Hashing (Security)
**File:** `backend/lib/auth/session-hash.ts`

Session IDs are NEVER stored in plaintext — they are hashed before lookup/storage:
- **Current:** HMAC-SHA256 keyed with `siraj-session-hmac:${JWT_SECRET}` (`hashSessionId`).
- **Legacy:** Unsalted SHA-256 (`hashSessionIdLegacy` — module-private).
- `computeSessionHashes(sessionId)` returns both — used for migration lookups.
- `verifyAndMigrateSessionHash(sessionId, storedHash)` rehashes legacy sessions to HMAC on access.
- In production, missing `JWT_SECRET` is a hard error; in dev it falls back to `siraj-session-hmac:fallback-dev-key`.

### Cookies
**File:** `backend/lib/auth/cookies.ts`
- `session_id` cookie — 7 days maxAge, httpOnly, `Secure` in production (unless `AUTH_COOKIE_SECURE=false`), sameSite `lax`.
- `refresh_token` cookie — same options.
- `access_token` cookie — **15 minutes** maxAge (matches JWT expiry).
- `clearAuthCookies` deletes all three with `path: "/"`.

### Refresh Token Rotation
**File:** `backend/graphql/mutation/auth/auth.mutation.ts:317-368` (`refreshToken` mutation)

Resolves user either by `session_id` cookie or `refresh_token` JWT, validates JTI against session payload, then:
- Rotates both access + refresh tokens.
- Stores new refresh JTI in session payload.
- Issues impersonation/group-simulation access tokens if active.
- Re-issues session if resolved via refresh_token only.

### Server-Side Auth Resolution
**File:** `backend/lib/auth/server-auth.ts`

`getServerUserContext` (React `cache()`-d per request):
1. Reads `session_id` + `access_token` cookies.
2. `validateSession(sessionId)` via `SessionService`.
3. If no/invalid access token → `buildSessionOnlyContext(userId)` (trust long-lived session_id; client rotates token).
4. Verifies access token JWT.
5. Resolves impersonation (`resolveImpersonation`) then group simulation (`resolveGroupSimulation`).
6. Returns `{ userId, actorUserId?, isImpersonating, isSimulatingGroup, simulatedGroupSlug?, context }`.

This is thecanonical SSR auth entrypoint (documented in `docs/auth/REDIRECT_LOOP_FIX.md`).

---

## 6. Permissions Service

### File: `backend/services/auth/permissions.service.ts`

### `UserPermissionContext`
```typescript
export type UserPermissionContext = {
  permissions: AppPermission[];
  permissionGroups: string[];     // slugs
  isSuperAdmin: boolean;
  role: UserRole;
};
```

### `getUserContext(userId)` (lines 16-63)
1. Loads user `isSuperAdmin` flag.
2. Loads the user's permission-group slugs via `userPermissionGroups ⋈ permissionGroups`.
3. **Super admin shortcut:** if `isSuperAdmin`, returns ALL permissions in the catalog (`filterKnownAppPermissions`).
4. Otherwise joins `userPermissionGroups ⋈ groupPermissions ⋈ permissions` to collect permission keys.
5. Derives `role` via `resolveRoleFromGroupSlugs(groupSlugs)`.

### `hasPermission(userId, permissionKey)` — single check (super admin OR includes permission).
### `hasAnyPermission(userId, permissionKeys[])` — OR semantics.
### `getUserContexts(userIds[])` — batch version (for notifications etc.).
### `getUserIdsWithPermission(permissionKey)` — reverse lookup (who has this permission?).
### `getPermissionGroupContext(groupSlug)` — context for a standalone group (used by group simulation).

### Role Derivation
**`resolveRoleFromGroupSlugs(groupSlugs)` (lines 77-90)** — the actual role "hierarchy":
```typescript
function resolveRoleFromGroupSlugs(groupSlugs: string[]): UserRole {
  if (groupSlugs.includes(SystemPermissionGroupSlug.SUPER_ADMIN)) return UserRole.SUPER_ADMIN;
  if (groupSlugs.includes(SystemPermissionGroupSlug.ACADEMY_ADMIN)) return UserRole.ACADEMY_ADMIN;
  if (groupSlugs.some(slug => slug === SystemPermissionGroupSlug.TEACHER_DEFAULT || slug === "teacher")) return UserRole.TEACHER;
  if (groupSlugs.some(slug => slug === SystemPermissionGroupSlug.PARENT_DEFAULT || slug === "parent")) return UserRole.PARENT;
  if (groupSlugs.includes(SystemPermissionGroupSlug.SUPERVISOR_DEFAULT)) return UserRole.SUPERVISOR;
  if (groupSlugs.includes(SystemPermissionGroupSlug.STUDENT_DEFAULT)) return UserRole.STUDENT;
  if (groupSlugs.includes(SystemPermissionGroupSlug.STAFF_DEFAULT)) return UserRole.STAFF;
  return UserRole.USER;
}
```
**First match wins** in the order above — this is the effective role precedence (see §11).

### Legacy/Alternative
**File:** `backend/lib/auth/permissions.ts` — `resolveUserPermissions(userId)` is an older version (no `role`, no super-admin special-casing). Kept for back-compat but `PermissionsService.getUserContext` is the canonical implementation referenced by GraphQL context.

---

## 7. Permission Schema (Groups, Overrides)

### File: `backend/db/schema/permissions/permissions.ts`

### `permissions` table (lines 13-30) — the permission CATALOG
```typescript
export const permissions = pgTable("permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: appPermissionEnum("key").notNull().unique(),   // AppPermission enum value
  resource: varchar("resource", { length: 100 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  description: jsonb("description").$type<LocalizedString>().notNull(),  // locale map
  category: jsonb("category").$type<LocalizedString>().notNull(),       // locale map
  isSystem: boolean("is_system").notNull().default(false),
});
```
- `key` is a Postgres enum `app_permission` whose values mirror `AppPermission`.
- **`is_system` is protected by a DB trigger `trg_protect_system_permissions`** — prevents creating new system permissions or converting custom→system. System permissions are immutable and seeded.
- `description` and `category` are `LocalizedString` JSONB (per-locale maps).

### `permission_groups` table (lines 36-54) — role bundles
```typescript
export const permissionGroups = pgTable("permission_groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: jsonb("name").$type<LocalizedString>().notNull(),
  description: jsonb("description").$type<LocalizedString>(),
  isSystem: boolean("is_system").notNull().default(false),
  slug: varchar("slug", { length: 100 }).notNull().unique(),   // uniqueness on slug, not name
  createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  ...
});
```

### `group_permissions` table (lines 56-71) — group ↔ permission M:N
Composite PK `(groupId, permissionId)`, cascade deletes.

### `user_permission_groups` table (lines 73-91) — user ↔ group assignment
Composite PK `(userId, groupId)`. Tracks `assignedAt` and `assignedByUserId`.

### `user_permission_overrides` table (lines 93-113) — per-user grant/deny
```typescript
export const userPermissionOverrides = pgTable("user_permission_overrides", {
  userId, permissionId, state: varchar("state", { length: 20 }).notNull(), // 'GRANTED' | 'DENIED'
  assignedByUserId,
  createdAt,
});
```
Allows granting or denying an individual permission to a user on top of their group memberships (see `AppPermission` overrides in `PermissionManagementService`).

---

## 8. Permission Enums (AppPermission catalog)

### File: `backend/enum/permissions/permission.enum.ts`

### `AppPermission` enum — the full permission catalog (~200 entries). Grouped by domain:

**Auth:**
- `AUTH_LOGIN = "auth.login"`

**Dashboard:**
- `DASHBOARD_VIEW`, `DASHBOARD_VIEW_METRICS`, `DASHBOARD_FILTER_METRICS`, `DASHBOARD_METRICS_VIEW_ALL`, `DASHBOARD_SEARCH`

**Schedule/Session (large set):** `SCHEDULE_VIEW_LIST`, `SCHEDULE_VIEW_ALL`, `SCHEDULE_VIEW_ASSIGNED`, `SCHEDULE_VIEW_FAMILY`, `SCHEDULE_CREATE_CLASS`, `SCHEDULE_DELETE_CLASS`, `SESSION_*` (activate, start/absent/leave, reschedule, reset, override), `SCHEDULE_MANAGE_RECURRING`, `SCHEDULE_DST_MIGRATE`, `SCHEDULE_VIEW_TIMEZONES`, `SCHEDULE_VIEW_WEEKLY`, `SCHEDULE_VIEW_WORKLOAD`, `SCHEDULE_CLEAR_WEEKLY`, `SCHEDULE_SEARCH_AVAILABILITY`, `SCHEDULE_FILTER_ADVANCED`, `HISTORY_VIEW_*`.

**Teachers/Staff:** `TEACHERS_LIST`, `TEACHERS_CREATE`, `TEACHERS_EDIT`, `TEACHERS_MANAGE_SCHEDULE`, `TEACHER_VIEW_DASHBOARD`, `TEACHER_VIEW_STUDENTS`, `STAFF_VIEW_DIRECTORY`, `STAFF_LIST`, `STAFF_CREATE`, `STAFF_EDIT`, `TEACHER_DUES_VIEW`, `TEACHER_DUES_MARK_PAID`, `SUPERVISOR_VIEW_DASHBOARD`.

**Parents/Students:** `PARENTS_LIST`, `PARENTS_CREATE`, `PARENTS_EDIT`, `STUDENTS_LIST`, `STUDENTS_CREATE`, `STUDENTS_EDIT`, `STUDENTS_CHANGE_TEACHER`, `STUDENTS_CHANGE_STATUS`, `STUDENTS_OVERRIDE_QUOTA`, `PARENT_VIEW_DIRECTORY`, `PARENT_VIEW_STUDENTS`, `PARENT_MANAGE_STATUS`, `STUDENT_VIEW_ASSOCIATED`, `STUDENT_VIEW_OWN_DASHBOARD`, `STUDENT_REASSIGN_TEACHER`, `STUDENT_MANAGE_STATUS`, `STUDENT_EDIT_QUOTA`, plus per-field-group `STUDENT_*_VIEW_OWN/VIEW_OTHER/EDIT_OWN/EDIT_OTHER` for identity/academic/teacher/parent/schedule/history/quota.

**Billing/Invoices:** `INVOICES_*`, `BILLING_*` (view history, create/update/delete invoice, submit payment proof, unpaid invoices), **FX rates:** `BILLING_VIEW_EXCHANGE_RATES`, `BILLING_REFRESH_EXCHANGE_RATES`, `BILLING_MANAGE_FX_PROVIDER`, `BILLING_OVERRIDE_EXCHANGE_RATES`, `BILLING_MANAGE_CURRENCY_HEDGES`, `BILLING_MANAGE_CURRENCIES`. **Payment methods:** `PAYMENT_METHODS_MANAGE_CATALOGS`, `PAYMENT_METHODS_VERIFY_BANK_TRANSFER`.

**Profile field-group ACL (extensive):** `PROFILE_CORE_IDENTITY_*`, `PROFILE_CORE_CONTACT_*`, `PROFILE_TEACHER_PROFESSIONAL_*`, `PROFILE_TEACHER_IDENTITY_*`, `PROFILE_PARENT_SOCIAL_*`, `PROFILE_PARENT_IDENTITY_*`, `PROFILE_PARENT_BILLING_*`, `PROFILE_PARENT_ACCOUNT_*`, `PROFILE_PARENT_STUDENTS_*`, `PROFILE_TEACHER_STUDENTS_*`, `PROFILE_STAFF_ROLE_*`, `PROFILE_STAFF_PERMISSIONS_*`, `PROFILE_PAYMENT_METHODS_*`, `PROFILE_MEETING_CONFIGS_*` — each with `VIEW_OWN`, `VIEW_OTHER`, `EDIT_OWN`, `EDIT_OTHER` variants.

**Resources/Notes/Subjects/Categories:** `RESOURCES_*`, `NOTES_*`, `SUBJECTS_*`, `CATEGORIES_*`.

**Reports/LMS:** `REPORTS_GENERATE`, `REPORT_GENERATE_CUSTOM`, `REPORT_VIEW_FINANCIALS`, `MONTHLY_REPORTS_VIEW`, `LESSON_REPORTS_*` (submit/review/approve/reject), `CREDITS_MANAGE`.

**Complaints/Suggestions/Support:** `COMPLAINTS_*`, `SUGGESTIONS_*`, `SUPPORT_*`, `COMMUNICATION_SUBMIT_SUGGESTION`.

**System:** `SYSTEM_ENFORCE_TIME_WINDOW`, `SYSTEM_ENFORCE_LEAVE_LIMIT`, `SYSTEM_BULK_UPDATE_DST`, `SYSTEM_DISPATCH_EMAIL`, `SYSTEM_SYNC_NOTIFICATIONS`, `SYSTEM_ENFORCE_SUSPENDED_LOCK`, `SYSTEM_PROCESS_STUDENT_LEAVE`, `SYSTEM_RESTRICT_RESOURCE_ACCESS`, `STORAGE_MANAGE`.

**Permission Management:** `PERMISSION_GROUPS_MANAGE`, `PERMISSION_GROUPS_ASSIGN`.

**Notifications:** `NOTIFICATION_VIEW_ALERTS`.

**Meeting providers/configs:** `MEETING_PROVIDERS_MANAGE_CATALOG`, `MEETING_CONFIGS_MANAGE_OWN/OTHER/CLASS`.

**Settings:** `SETTINGS_VIEW`, `SETTINGS_EDIT_GENERAL`, `SETTINGS_EDIT_ENV`, `SETTINGS_EDIT_SESSION`, `SETTINGS_AUDIT_VIEW`, `SETTINGS_SITE_CONTENT_MANAGE`, `SETTINGS_TIMEZONES_VIEW`.

**Test (system flags):** `TEST_SYSTEM_ONLY`, `TEST_CUSTOM_ONLY`, `TEST_CUSTOM_ALT`.

### `filterKnownAppPermissions(keys)` (lines 261-272)
Drops any DB rows whose keys were removed from the TypeScript enum (legacy profile ACLs). Super admins always get filtered to known keys. Maintains a cached `Set` of `Object.values(AppPermission)`.

### `SystemPermissionGroupSlug`
**File:** `backend/enum/permissions/permission-group.enum.ts`
```typescript
export enum SystemPermissionGroupSlug {
  SUPER_ADMIN = "super_admin",
  ACADEMY_ADMIN = "academy_admin",
  TEACHER_DEFAULT = "teacher_default",
  PARENT_DEFAULT = "parent_default",
  STAFF_DEFAULT = "staff_default",
  SUPERVISOR_DEFAULT = "supervisor_default",
  STUDENT_DEFAULT = "student_default",
}
```
These slugs drive role derivation (§11). Custom groups can be created (non-system) for arbitrary role bundles.

---

## 9. Auth Context (GraphQL)

### File: `backend/graphql/gqlContext.ts`

### `BaseContext`
```typescript
export type BaseContext = {
  user: { id: string; displayCurrency: CurrencyCode | null } | undefined;
  permissions: AppPermission[];
  permissionGroups: string[];
  isSuperAdmin: boolean;
  actorUserId?: string;        // the real admin (during impersonation)
  isImpersonating: boolean;
  realUserId?: string;         // effective real user = realUserId ?? actorUserId ?? user.id
  isSimulatingGroup: boolean;
  simulatedGroupSlug?: string;
  refreshToken: string | undefined;
  sessionId: string | undefined;
  ipAddress?: string;
  cookies?: ResponseCookies;
  role: UserRole;
  locale: string;
  billingFxDisplayCurrency?: CurrencyCode | null;
  billingFxDisplayCurrencyByUserId?: Map<string, CurrencyCode | null>;
  t: () => Translations;
};
```

### `AuthContexts` (for Pothos type narrowing)
```typescript
export type AuthContexts = {
  loggedIn: BaseContext & { user: object };
  permission: BaseContext & { user: object };
};
```
When a resolver declares `authScopes: { loggedIn: true }` or `permission: ...`, Pothos narrows `ctx` so `ctx.user` is non-`undefined`.

### `createContext({ userId, actorUserId, isImpersonating, realUserId, isSimulatingGroup, simulatedGroupSlug, locale })`
- If no `userId` → returns guest context (`role: UserRole.GUEST`, empty perms).
- If `isSimulatingGroup && simulatedGroupSlug` → uses `PermissionsService.getPermissionGroupContext(slug)` (admin keeps their identity but perms come from the simulated group).
- Otherwise `PermissionsService.getUserContext(userId)`.
- Loads `safeUser` for `displayCurrency`.

---

## 10. Auth Scopes in Pothos Resolvers

### File: `backend/graphql/gqlSchemaBuilder.ts:75-150`

### AuthScopes type (lines 31-37)
```typescript
AuthScopes: {
  loggedIn: boolean;
  permission: AppPermission;
  superAdmin: boolean;
  notImpersonating: boolean;
  notSimulatingGroup: boolean;
};
```

### `scopeAuth.authScopes` resolver (lines 93-111)
```typescript
authScopes: async ctx => {
  const realUserId = ctx.realUserId ?? ctx.actorUserId ?? ctx.user?.id;
  let actorIsSuperAdmin = ctx.isSuperAdmin;
  if (realUserId) {
    const actorContext = await PermissionsService.getUserContext(realUserId);
    actorIsSuperAdmin = actorContext.isSuperAdmin;
  } else if (ctx.actorUserId) {
    const actorContext = await PermissionsService.getUserContext(ctx.actorUserId);
    actorIsSuperAdmin = actorContext.isSuperAdmin;
  }
  return {
    loggedIn: !!ctx.user,
    permission: (key: AppPermission) => ctx.isSuperAdmin || ctx.permissions.includes(key),
    superAdmin: actorIsSuperAdmin,           // checks the REAL actor (not impersonated)
    notImpersonating: !ctx.isImpersonating,
    notSimulatingGroup: !ctx.isSimulatingGroup,
  };
},
```

Key behaviors:
- **`permission`** scope always passes for `ctx.isSuperAdmin` (the *effective* user) — so impersonation by a super admin into a non-super-admin target still grants all perms. This is by design: impersonation is super-admin-only (§13).
- **`superAdmin`** scope checks `actorIsSuperAdmin` (re-resolved from DB using `realUserId`/`actorUserId`) — so the *real actor* must be a super admin, independent of impersonation.
- **`notImpersonating`** / **`notSimulatingGroup`** block mutations that must be performed as the real admin (e.g. permission management).

### `unauthorizedError` (lines 112-133)
Customizes the `GraphQLError`:
- If the failed scope was `loggedIn` (or an aggregate including `loggedIn`) → `code: "UNAUTHENTICATED"`.
- Otherwise → `code: "FORBIDDEN"`.

### Usage Patterns

**Pattern 1 — Logged-in only:**
```typescript
authScopes: { loggedIn: true },
```
Example: `logout`, `changePassword` (`auth.mutation.ts:373,396`), `impersonationStatus` (`impersonation.pothos.ts:67`).

**Pattern 2 — Single permission:**
```typescript
authScopes: { permission: AppPermission.PERMISSION_GROUPS_MANAGE, notImpersonating: true },
```
Example: all permission-management queries/mutations (`permission-management.pothos.ts:163,170,...`).

**Pattern 3 — Function-based (OR over multiple perms):**
```typescript
authScopes: (_parent, _args, ctx) =>
  ctx.isSuperAdmin ||
  ctx.permissions.includes(AppPermission.TEACHERS_LIST) ||
  ctx.permissions.includes(AppPermission.STAFF_VIEW_DIRECTORY),
```
Example: `teacherDirectory` (`teacher.query.ts:31-34`).

**Pattern 4 — Super admin only (and not impersonating/simulating):**
```typescript
authScopes: { superAdmin: true, notImpersonating: true, notSimulatingGroup: true },
```
Example: `startImpersonation` (`impersonation.pothos.ts:82`).

### Per-role data scoping happens INSIDE resolvers (not just via authScopes)
The `authScopes` gate admits the request; the resolver then uses `ctx.user.id` (and resolved `teacherId`/`parentId`) to scope the query. Example (`teacher.query.ts:18-20`):
```typescript
resolve: async (_parent, args, ctx) => {
  return await TeacherService.searchTeachers(ctx.user?.id, args.search, args.limit, ctx.locale);
}
```

---

## 11. Role Hierarchy

### Stored role? No.
There is **no `role` column** on `users`. Role is *derived* from permission-group membership via `resolveRoleFromGroupSlugs()` (`permissions.service.ts:77-90`).

The only role-related stored flag is **`users.isSuperAdmin`** (boolean).

### Effective role precedence (first match wins in `resolveRoleFromGroupSlugs`):
```
SUPER_ADMIN  (group slug "super_admin"  OR  users.isSuperAdmin=true)
  → ACADEMY_ADMIN (group slug "academy_admin")
    → TEACHER (group slug "teacher_default" or legacy "teacher")
      → PARENT (group slug "parent_default" or legacy "parent")
        → SUPERVISOR (group slug "supervisor_default")
          → STUDENT (group slug "student_default")
            → STAFF (group slug "staff_default")
              → USER (fallback)
                → GUEST (unauthenticated / not found)
```

**This is NOT a strict permission hierarchy** — it is a *label derivation* for display/branching. Actual authorization is **permission-based, not role-based**: a `TEACHER` gets the `teacher_default` group's permissions, not "all teacher permissions implicitly". Custom groups can be created and assigned alongside system ones.

### Super Admin
- `users.isSuperAdmin = true` short-circuits `PermissionsService.getUserContext` to return **all** `AppPermission` values in the catalog.
- The `permission` auth scope always passes for super admins (even during impersonation).
- The `superAdmin` auth scope re-resolves `actorIsSuperAdmin` from DB on every request (no trusting stale ctx).

---

## 12. Column-Level Encryption (AES-256-GCM)

### Core encryption library
**File:** `backend/lib/field-encryption.ts`

```typescript
const ENCRYPTION_KEY_RAW = process.env.DATABASE_ENCRYPTION_KEY;  // required
const ENCRYPTION_KEY = crypto.createHash("sha256").update(ENCRYPTION_KEY_RAW).digest(); // 32 bytes
const IV_LENGTH = 12;  // GCM standard 96-bit IV

export function encryptField(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${encrypted}:${authTag}`;  // iv:cipherText:authTag
}

export function decryptField(encryptedText: string): string | null {
  const parts = encryptedText.split(":");
  if (parts.length !== 3) return encryptedText;   // legacy plaintext fallback
  // ... decrypt with auth tag verification
}
```
- Key derived via SHA-256 from `DATABASE_ENCRYPTION_KEY` env var (required at module load).
- Format `iv:cipherText:authTag` (all hex).
- **Legacy fallback:** if split doesn't yield 3 parts, the value is treated as plaintext (migration-friendly).
- Decryption failure → returns `null` (does NOT leak ciphertext).

### Drizzle custom type
**File:** `backend/db/schema/custom-types.ts`
```typescript
export const encryptedText = (name: string) =>
  customType<{ data: string | null; driverData: string }>({
    dataType() { return "text"; },
    toDriver(value: string | null): string {
      if (value === null) return "";
      return encryptField(value);
    },
    fromDriver(value: string): string | null {
      return decryptField(value);
    },
  })(name);
```
**Transparent encryption at the ORM layer** — any column declared as `encryptedText("col_name")` is auto-encrypted on write and auto-decrypted on read.

### Where `encryptedText` is used (DB columns)
1. **`backend/db/schema/teachers/teachers.ts:20`** — `nationalId: encryptedText("national_id")` (teacher national ID — PII, validated against country format).
2. **`backend/db/schema/meeting/__shared__/meeting-config-columns.ts:18`** — `encryptedSecret: encryptedText("encrypted_secret")` (meeting provider OAuth/API secrets).

### JSONB field encryption (payment methods)
**File:** `backend/lib/payment-method-jsonb.ts`

For `BankTransferDetails` JSONB, specific sensitive routing fields are encrypted in-place (copy-on-write):
```typescript
const SENSITIVE_BANK_FIELDS = ["iban", "accountNumber", "routingNumber", "swiftBic"] as const;
export function encryptBankTransferDetails(details) { ... } // encrypts those 4 fields
export function decryptBankTransferDetails(details) { ... } // decrypts, falls back to stored value on failure
```
`beneficiaryName` and `bankName` are left plaintext (display labels). `encryptPaymentMethodDetails`/`decryptPaymentMethodDetails` are no-op passthroughs for non-bank types. Used by `backend/services/payment-method/payment-method.service.ts` and `payment-method-snapshot.ts`.

---

## 13. Impersonation Feature

### Files
- Service: `backend/services/auth/impersonation.service.ts`
- GraphQL: `backend/graphql/pothos/auth/impersonation.pothos.ts`

### `IMPERSONATION_TTL_MS = 30 * 60 * 1000` (30 minutes)

### `assertCanImpersonate(actorUserId, targetUserId, tErrors)` (lines 93-123)
- Cannot impersonate self.
- **Actor must be super admin** (`actorContext.isSuperAdmin`).
- Target must exist, not be soft-deleted, not be deactivated.
- **Cannot impersonate another super admin.**

### `startImpersonation(input, tErrors)` (lines 125-189)
1. `assertCanImpersonate`.
2. `assertActorOwnsSession` (session.userId must equal actorUserId — the session is owned by the real admin).
3. Hash the session ID; end any prior active impersonation for this actor; clear group simulation (mutually exclusive).
4. Insert a row into `impersonation_sessions` (one active per actor enforced by partial unique index).
5. Sync to Redis (`syncOptionalRedisImpersonation`).
6. Issue `generateImpersonationAccessToken(actorUserId, targetUserId, targetEmail, expiresAt)` — JWT where `userId` is the *target* and `actorUserId` + `impersonation: true` mark it.
7. Write `IMPERSONATION_START` to `admin_audit_logs`.

### `resolveAuthIdentityFromToken(payload, rawSessionId)` (lines 262-305)
The verification path for incoming impersonation tokens:
- If no `rawSessionId` → returns effective userId from token (not impersonating).
- Validates session userId === payload.actorUserId (the session is always owned by the real actor).
- Checks the active DB impersonation row; `targetUserId` must match `payload.userId`.
- Auto-expires if `impersonationExpiresAt` passed → ends session, clears Redis, returns null.

### `endImpersonation`, `getStatusForSession`, `issueAccessTokenForSession` complete the lifecycle.

### GraphQL surface
- `impersonationStatus` query — `authScopes: { loggedIn: true }`.
- `startImpersonation` mutation — `authScopes: { superAdmin: true, notImpersonating: true, notSimulatingGroup: true }`.
- `endImpersonation` mutation — `authScopes: { loggedIn: true }`.

### Audit
All start/end actions write to `admin_audit_logs` with `actorUserId`, `targetUserId`, action, metadata, sanitized IP.

---

## 14. Permission Group Simulation

### File: `backend/services/auth/permission-group-simulation.service.ts`

A distinct admin tool: a super admin can *simulate* a permission group to preview what a user with that role would see — **without losing their own identity** (`userId` stays the admin; only `permissions` come from the simulated group).

### `GROUP_SIMULATION_TTL_MS = 30 * 60 * 1000` (30 min)
### `NON_SIMULATABLE_GROUP_SLUGS = ["system_automated"]`

### `listSimulatableGroups(actorUserId, locale)` — excludes the actor's own groups and `system_automated`; super admins also exclude `super_admin`.

### `assertCanSimulateGroup(actorUserId, groupSlug, tErrors)` — actor must be super admin; cannot simulate a group they already hold; group must exist.

### `startSimulation(input, tErrors)`:
- Mutually exclusive with impersonation (ends active impersonation, clears Redis impersonation).
- Stores simulation in Redis (`syncGroupSimulation`).
- Issues `generateGroupSimulationAccessToken(userId=admin, email, groupSlug, expiresAt)` — `userId` is the admin, tagged with `groupSimulation: true`.

### `resolveGroupSimulationFromToken(payload, rawSessionId)` (lines 284-362) — resolves active simulation on every request; returns null if impersonation payload present (mutually exclusive enforcement).

### `createContext` uses `PermissionsService.getPermissionGroupContext(simulatedGroupSlug)` when `isSimulatingGroup` — so the *effective permissions* are the simulated group's, while the identity remains the admin.

### GraphQL: `backend/graphql/pothos/permissions/permission-group-simulation.pothos.ts`.

---

## 15. Per-Role Data Access

The system uses **permission-group-based RBAC, not role-based access control**. Role labels (TEACHER/PARENT/etc.) are derived for convenience, but data scoping is enforced by:

1. **Auth scopes** (gate the resolver) + **resolver logic** (scope the query by `ctx.user.id` and resolved `teacherId`/`parentId`).

### Teacher → their students
- `TeacherPortalService.resolveTeacherIdForUser(userId)` (`teacher-portal.service.ts:118-121`) — `TeacherRepository.findByUserId(userId)` → returns `teacher.id`.
- Teachers access their data via `teacherId`, e.g. `TeacherService.searchTeachers(ctx.user.id, ...)`, assigned-class lists scoped by teacher.
- Page guard: `requireTeacherIdForPage(userId, locale, permissionContext)` (`lib/auth/require-teacher-id.ts`) — redirects/forbids if no `teacherId` is resolved.

### Parent → their children
- `ParentPortalService.resolveParentIdForUser(userId)` (`parent-portal.service.ts:70`) — returns the parent record id.
- Page guard: `requireParentIdForPage(userId, locale, permissionContext)` (`lib/auth/require-parent-id.ts`).
- Profile-access ACLs use the `PROFILE_PARENT_STUDENTS_*` (view_own / view_other / edit_own / edit_other) permission group to control whether a parent can see/edit their children's data vs. an admin viewing "other".

### Student → own data
- `STUDENT_VIEW_OWN_DASHBOARD`, `student.view_own_dashboard` permission.
- `STUDENT_*_VIEW_OWN` family for per-field-group visibility into the student's own record.

### SUPER_ADMIN / ACADEMY_ADMIN → everything
- `ctx.isSuperAdmin` → all perms. `ACADEMY_ADMIN` group grants the admin-scoped permissions (`PERMISSION_GROUPS_MANAGE`, `STAFF_CREATE`, billing FX, etc.).

### Per-field-group ACL pattern (fine-grained)
Many permissions follow `<resource>.<field_group>.view_own / view_other / edit_own / edit_other`. Services check these explicitly, e.g. (`teacher-portal.service.ts:133-140`):
```typescript
const canEditOwn = await PermissionsService.hasAnyPermission(userId, [
  AppPermission.PROFILE_CORE_IDENTITY_EDIT_OWN,
  AppPermission.PROFILE_CORE_CONTACT_EDIT_OWN,
  AppPermission.PROFILE_TEACHER_PROFESSIONAL_EDIT_OWN,
]);
if (!canEditOwn) throw new Error(tErrors.unauthorizedAction);
```
And `teacher.id !== teacherId` throws `unauthorizedAction` — so a teacher can only edit their OWN profile.

### `PermissionManagementService` enforces `requireNonSuperAdmin` (line 99-105): super admins cannot have their permissions/group membership modified by anyone.

---

## 16. Server-Side Page Guards

**File:** `backend/lib/auth/require-permission.ts:24-42` — `requirePermissionForPage(userId, permissions[], locale, permissionContext?)`:
- OR semantics: passes if `isSuperAdmin || permissions.some(p => context.permissions.includes(p))`.
- On failure: redirect to `/dashboard` (or `forbidden()` for prefetches to avoid App Router redirect loops — documented workaround).
- Prefetch detection via `isPrefetchRequest()` (`Sec-Purpose: prefetch`).

Similar guards in `require-teacher-id.ts` / `require-parent-id.ts` resolve the role's portal entity id and redirect/forbid if absent.

---

## 17. Certificate Feature Integration Notes

For a new certificate feature, the existing auth/permission machinery covers most needs without schema changes to auth/permissions:

### Recommended approach — add AppPermission entries
Add to `AppPermission` enum (`backend/enum/permissions/permission.enum.ts`), e.g.:
- `CERTIFICATES_LIST = "certificates.list"`
- `CERTIFICATES_CREATE = "certificates.create"`
- `CERTIFICATES_EDIT = "certificates.edit"`
- `CERTIFICATES_DELETE = "certificates.delete"`
- `CERTIFICATES_VIEW_OWN = "certificates.view_own"` (student/parent self)
- `CERTIFICATES_VIEW_OTHER = "certificates.view_other"` (admin/teacher)
- `CERTIFICATES_GENERATE = "certificates.generate"` (teacher/admin issue)
- `CERTIFICATES_REVOKE = "certificates.revoke"`

Then seed these as system permissions (the `app_permission` Postgres enum must be extended in a migration; the `permissions` table rows get `is_system = true`). The `trg_protect_system_permissions` trigger will then make them immutable.

### Assign via existing permission groups
- `super_admin` / `academy_admin` already get all permissions via the super-admin shortcut (no group change needed for super_admin).
- For `teacher_default` / `parent_default` / `student_default` / `staff_default` groups: add the relevant `CERTIFICATES_*` keys to those groups via the existing `group_permissions` table (managed through `PermissionManagementService.assignGroupToUser` or a seed migration).

### Per-role data scoping will live in the resolver/service
Use `ctx.user.id` → resolve `teacherId` (`TeacherPortalService.resolveTeacherIdForUser`) or `parentId` (`ParentPortalService.resolveParentIdForUser`) to scope certificate queries. Use the `view_own` / `view_other` permission pattern (already pervasive for profiles and students) to distinguish self-access from admin-access.

### GraphQL auth scope patterns to mirror
- Public-ish list: `authScopes: { loggedIn: true }`.
- Admin-only management: `authScopes: { permission: AppPermission.CERTIFICATES_MANAGE, notImpersonating: true }` (block during impersonation to prevent privilege escalation auditing gaps).
- Use the function form `authScopes: (_p, _a, ctx) => ctx.isSuperAdmin || ctx.permissions.includes(...)` for OR-over-permission gates.

### Sensitive certificate data? Use `encryptedText`
If certificates carry PII (recipient national ID, etc.), define columns with the `encryptedText` custom type (`backend/db/schema/custom-types.ts`) for transparent AES-256-GCM at rest. Set `DATABASE_ENCRYPTION_KEY`.

### Audit
Reuse `admin_audit_logs` (used by impersonation & group simulation) for certificate issuance/revocation events — `actorUserId`, `targetUserId`, `action`, `newState` metadata, `ipAddress`.

### Session/TTL
Per-role session TTL/concurrency is configurable in `session_config` — no auth code change needed if certificates inherit the user's existing role session limits.

### No changes needed to
- JWT (`jwt.ts`) — certificate endpoints reuse standard access tokens.
- Session management — unchanged.
- `BaseContext` / `AuthContexts` — already carry everything needed (`permissions`, `isSuperAdmin`, `actorUserId`, `isImpersonating`, `role`).
- Role derivation — adding a "certificate issuer" role would be a *custom* permission group, not a new `UserRole` enum value (the system favors permission groups over roles).

---

*End of analysis.*
