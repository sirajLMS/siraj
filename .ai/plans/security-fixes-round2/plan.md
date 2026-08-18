# Backend Security Review — Round 2 Implementation Plan

## Overview

A second-pass backend security audit of the Siraj LMS codebase, covering 7 security domains via parallel subagent investigations. This plan addresses **NEW** vulnerabilities not covered by Round 1 (which implemented 15 fixes: H1-H4, M1-M5, L1-L5).

**Constraints**:
- No commits or pushes — all changes stay in working directory
- Respect another agent's work on shared files — do not revert changes we did not make
- Only fix errors on files we modify; ignore pre-existing errors on untouched files
- All DB, service, and GraphQL tests must continue to pass
- Respect AGENTS.md, layer-specific AGENTS.md, and instruction files

## Severity Summary

| Severity | Count | IDs |
|----------|-------|-----|
| CRITICAL | 1 | R2H-1 |
| HIGH | 8 | R2H-2 through R2H-9 |
| MEDIUM | 10 | R2M-1 through R2M-10 |
| LOW | 9 | R2L-1 through R2L-9 |

---

## CRITICAL

### R2H-1: Unbounded date-range expansion in expandDateRange → CPU/memory DoS

**File**: `backend/services/scheduling/availability.service.ts` (line 422-428)
**Severity**: CRITICAL
**Source**: `r2-rate-limiting-audit`

**Issue**: `searchCrossStaffAvailability` accepts caller-supplied `fromDate`/`toDate` strings from the `AvailabilitySearchInput` Pothos input field (`availability-search.pothos.ts:63-64`). The service only checks `fromDate <= toDate` (line 425) but does NOT enforce a maximum span. The `expandDateRange` function (also in `availability.helpers.ts:304`) builds an in-memory date array with no upper bound. A client can submit `fromDate=2000-01-01, toDate=9999-12-31` to generate ~2.9M dates, causing server-wide CPU/memory DoS.

**IMPORTANT — Other Agent's Work**: `availability.helpers.ts` is in the current git diff (modified by another agent). We MUST NOT touch this file. The fix goes in `availability.service.ts` only — adding a span validation before the `fromDate`/`toDate` are passed to the repository.

**Fix**: In `availability.service.ts`, add a maximum date span check (90 days) after the `fromDate <= toDate` validation:

```typescript
const MAX_AVAILABILITY_SEARCH_SPAN_DAYS = 90;

// After: if (fromDate > toDate) { throw ... }

const fromDateMs = Date.parse(`${fromDate}T00:00:00.000Z`);
const toDateMs = Date.parse(`${toDate}T00:00:00.000Z`);
const spanDays = (toDateMs - fromDateMs) / (24 * 60 * 60 * 1000);
if (spanDays > MAX_AVAILABILITY_SEARCH_SPAN_DAYS) {
  const { invalidInput } = getServerTranslations("en").errorsTranslations;
  throw new ValidationError(`${invalidInput}; Date range cannot exceed ${MAX_AVAILABILITY_SEARCH_SPAN_DAYS} days`);
}
```

**Affected Tests**: `backend/services/scheduling/availability.service.test.ts` or equivalent (if any test exercises large date ranges). Also check `backend/db/test/logic/shared/hours-recalc.test.ts`.

---

## HIGH

### R2H-2: Unescaped LIKE wildcard injection in staff directory search

**File**: `backend/db/repo/teachers/staff-profile.repository.ts` (line 248-250)
**Severity**: HIGH
**Source**: `r2-sql-injection-audit`

**Issue**: `getStaffDirectoryLite` builds `ilike(users.name, \`%${trimmedSearch}%\`)` using `options.search.trim()` WITHOUT `escapeLikeWildcards()`. A user-supplied `%` or `_` in the search string is treated as a LIKE wildcard, enabling wildcard injection. This is the exact pattern Round 1 fixed in 7 other repositories.

**Fix**: Import `escapeLikeWildcards` from `@/backend/utils` (confirmed: `parent.repository.ts:31`, `user.repository.ts:18`, `recurring-schedule.repository.ts:12` all import from this path) and apply:

```typescript
const trimmedSearch = options.search?.trim();
if (trimmedSearch) {
  const escapedSearch = escapeLikeWildcards(trimmedSearch);
  searchConditions.push(or(ilike(users.name, `%${escapedSearch}%`), ilike(users.email, `%${escapedSearch}%`)));
}
```

**Affected Tests**: `backend/db/test/repo/teachers/staff-profile.repository.test.ts` (if search test exists).

### R2H-3: Unescaped LIKE wildcard injection in invoice search

**File**: `backend/db/repo/billing/billing.repository.ts` (line 686-696)
**Severity**: HIGH
**Source**: `r2-sql-injection-audit` (VERIFY → escalated to HIGH)

**Issue**: `buildInvoiceSearchCondition` constructs `pattern = \`%${normalized.toLowerCase()}%\`` and uses it raw in three `sql\`LOWER(...) LIKE ${pattern}\`` clauses. `normalized` comes from `search?.trim()` (user input) but is NOT passed through `escapeLikeWildcards()`. A `%` or `_` in the user search becomes a literal wildcard.

**Fix**: Apply `escapeLikeWildcards` before building the pattern:

```typescript
import { escapeLikeWildcards } from "@/backend/utils";

function buildInvoiceSearchCondition(search: string | null | undefined): SQL | undefined {
  const normalized = search?.trim();
  if (!normalized) return undefined;
  const escaped = escapeLikeWildcards(normalized).toLowerCase();
  const pattern = `%${escaped}%`;
  return or(
    sql`LOWER(${invoices.id}::text) LIKE ${pattern}`,
    sql`LOWER(COALESCE(${students.name}, '')::text) LIKE ${pattern}`,
    sql`LOWER(${invoices.amount}::text) LIKE ${pattern}`
  );
}
```

**Affected Tests**: `backend/db/test/repo/billing/billing.repository.test.ts` (if invoice search test exists).

### R2H-4: Hardcoded fallback HMAC key for session hashing

**File**: `backend/lib/auth/session-hash.ts` (line 4, 18)
**Severity**: HIGH
**Source**: `r2-secrets-config-audit`

**Issue**: `FALLBACK_DEV_KEY = "siraj-session-hmac:fallback-dev-key"` is a known, predictable string committed to source. When `JWT_SECRET` is unset in non-production environments, all session hashes are derived from this publicly-known constant. An attacker can forge session hashes if the fallback path is reached in any deployed environment (staging, misconfigured test, Vercel preview).

**Fix**: Remove the hardcoded fallback and generate a random per-boot key in non-production:

```typescript
function resolveSessionHmacKey(): string {
  if (process.env.JWT_SECRET) {
    return `siraj-session-hmac:${process.env.JWT_SECRET}`;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("CRITICAL: JWT_SECRET is not set in production environment. Session hash key cannot be derived.");
  }

  const randomKey = randomBytes(32).toString("hex");
  logger.warn(
    "⚠️  JWT_SECRET not set. Using random ephemeral HMAC key for session hashing. Set JWT_SECRET for production-grade security."
  );
  return `siraj-session-hmac:ephemeral:${randomKey}`;
}
```

**Affected Tests**: `backend/services/auth/session.service.test.ts` (verify session hash tests don't depend on the constant fallback value). Also any test in `backend/db/test/logic/auth/` that validates session hashes.

### R2H-5: Missing rate limiting on changePassword mutation

**File**: `backend/graphql/mutation/auth/auth.mutation.ts` (line 401-413)
**Severity**: HIGH
**Source**: `r2-rate-limiting-audit`

**Issue**: `changePassword` mutation performs password verification (`AuthPasswordService.changePassword`) on every authed request without rate limiting. An attacker can repeatedly call this mutation to brute-force the user's current password via timing/error differences, or perform expensive bcrypt hashing on every call (DoS amplifier). `login` and `demoLogin` are rate-limited but `changePassword` is not.

**Fix**: Add `checkRateLimit` at the start of the resolver:

```typescript
// authRateLimiter is already imported at the top of auth.mutation.ts (line 20)
// checkRateLimit is also already imported (line 20)

changePassword: t.field({
  // ... existing config ...
  resolve: async (_parent, args, ctx) => {
    const tErrors = ctx.t().errorsTranslations;
    // Rate limit password-change attempts (brute-force / DoS protection)
    const rateLimitResult = await checkRateLimit(ctx.ipAddress, authRateLimiter);
    if (!rateLimitResult.success) {
      throw new GraphQLError(tErrors.auth.tooManyLoginAttempts, {
        extensions: { code: "TOO_MANY_ATTEMPTS" },
      });
    }
    const actorUserId = await requireAuth(ctx);
    return AuthPasswordService.changePassword(actorUserId, args.input, ctx.locale);
  },
}),
```

**IMPORTANT**: 
- `checkRateLimit` signature is `(identifier: string, limiter: RateLimiter, options?)` — do NOT pass `tErrors` as third arg
- `authRateLimiter` and `checkRateLimit` are already imported at line 20 of `auth.mutation.ts`
- `ctx.ipAddress` is available from the GraphQL context (set by `gqlContextFactory`)

**Affected Tests**: `backend/db/test/logic/auth/auth_rate_limit_enforcement.test.ts` (already exists from Round 1 L4 fix — verify it still passes; may need a new test case for changePassword rate limiting).

### R2H-6: Missing rate limiting on adminResetPassword mutation

**File**: `backend/graphql/mutation/auth/admin-password.mutation.ts` (line 9-46)
**Severity**: HIGH
**Source**: `r2-rate-limiting-audit`

**Issue**: `adminResetPassword` triggers bcrypt password hashing + email notification on every call and has no per-IP/per-user rate limiting. A privileged user (or attacker who gained admin token) can hammer this to cause CPU exhaustion or abuse the email-notification side channel for email bombing.

**Fix**: Add `checkRateLimit` at the start of the resolver:

```typescript
import { checkRateLimit, authRateLimiter } from "@/backend/lib/ratelimit";

resolve: async (_parent, args, ctx) => {
  const tErrors = ctx.t().errorsTranslations;
  // Rate limit admin password resets (email-bombing / DoS protection)
  const rateLimitResult = await checkRateLimit(ctx.ipAddress ?? "[unknown]", authRateLimiter);
  if (!rateLimitResult.success) {
    throw new GraphQLError(tErrors.auth.tooManyLoginAttempts, {
      extensions: { code: "TOO_MANY_ATTEMPTS" },
    });
  }
  const actorUserId = await requireAuth(ctx);
  // ... existing logic ...
},
```

**IMPORTANT**: 
- `checkRateLimit` signature is `(identifier: string, limiter: RateLimiter, options?)` — do NOT pass `tErrors` as third arg
- Must check `rateLimitResult.success` and throw `GraphQLError` with `TOO_MANY_ATTEMPTS` code on failure
- `ctx.ipAddress` is available from the GraphQL context

**Affected Tests**: `backend/db/test/logic/auth/auth_rate_limit_enforcement.test.ts` (verify still passes).

### R2H-7: DST bulk update mutation requires only `loggedIn` — any user can trigger server-wide rewrite

**File**: `backend/graphql/mutation/classes/dst-migration.mutation.ts` (line 6-20)
**Severity**: HIGH
**Source**: `r2-rate-limiting-audit`

**Issue**: `executeDstBulkUpdate` has `authScopes: { loggedIn: true }` — far too permissive for a global bulk maintenance operation. Any authenticated user can trigger a server-wide bulk DST rewrite of all scheduled classes.

**Fix**: Elevate to superAdmin permission scope:

```typescript
authScopes: { superAdmin: true },
```

Per `backend/graphql/AGENTS.md`, `superAdmin: true` is appropriate for "truly superadmin-only operations" — a global DST bulk update affecting all scheduled classes qualifies.

**Affected Tests**: `batch/graphql/test/` (verify DST mutation tests update authScopes expectation). Check if `backend/services/scheduling/dst-migration.service.test.ts` exists.

### R2H-8: Legacy signed-URL upload route lacks MIME allowlist enforcement

**File**: `app/api/storage/upload/[id]/route.ts` (line 134-145+)
**Severity**: HIGH
**Source**: `r2-input-validation-audit`

**Issue**: The legacy signed-URL PUT handler only checks `contentType !== signedUrl.contentType` (string equality) and `BigInt(contentLength) > signedUrl.fileSize`. There is NO MIME-type allowlist (the `ALLOWED_MIME_TYPES` set in `vercel-upload/route.ts` is NOT consulted here). A signed URL created with `contentType: "image/svg+xml"` or `text/html` would be accepted, allowing users to store XSS payloads.

**Fix**: Apply the same `ALLOWED_MIME_TYPES` allowlist from `vercel-upload/route.ts` before persisting:

```typescript
// At the top of the PUT handler, after extracting contentType from signedUrl:
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Explicitly EXCLUDE: image/svg+xml, text/html
]);

if (!ALLOWED_MIME_TYPES.has(signedUrl.contentType)) {
  return NextResponse.json({ error: tErrors.file.invalidFileType }, { status: 400 });
}
```

Alternatively, export `ALLOWED_MIME_TYPES` from `vercel-upload/route.ts` or better from a shared constants file to avoid duplication.

**Affected Tests**: Any integration test for the upload route. Check `frontend/common/graphql/test/` for storage upload tests.

### R2H-9: Missing authScopes on statusTrackingSchedule queryField

**File**: `backend/graphql/pothos/scheduling/schedule.pothos.ts` (line 181-198)
**Severity**: HIGH (escalated from MEDIUM)
**Source**: `r2-auth-authz-audit`

**Issue**: The `statusTrackingSchedule` queryField defines NO `authScopes`. The resolver passes `ctx.user?.id ?? ""` to the service, so an anonymous client reaches the service with an empty actor id. While the service does enforce permission checks internally, the field exposes the resolver to anonymous execution — inconsistent with every other scheduling query which declares `authScopes` for defense-in-depth and faster rejection.

**Fix**: Add `authScopes` matching the service's permission requirement:

```typescript
import { AppPermission } from "@/backend/enum";

gqlSchemaBuilder.queryField("statusTrackingSchedule", t =>
  t.field({
    type: [StatusTrackingScheduleRowRef],
    authScopes: { permission: AppPermission.SCHEDULE_VIEW_ALL },
    args: { ... },
    resolve: async (_root, args, ctx) => { ... },
  })
);
```

**Affected Tests**: GraphQL integration tests for `statusTrackingSchedule` query. Check `frontend/common/graphql/test/` for scheduling query tests.

---

## MEDIUM

### R2M-1: Hardcoded English error messages in GraphQL scalar validators

**Files**:
- `backend/graphql/scalars/stringMapScalar.ts` (lines 17,25,35,40,45,75,81,92,98,104)
- `backend/graphql/scalars/localizedStringScalar.ts` (lines 13,23,28,33,45,55,60,65)
**Severity**: MEDIUM
**Source**: `r2-i18n-security-audit`

**Issue**: User-facing `GraphQLError` throws in scalar validators use hardcoded English strings like "StringMap must be an object", "LocalizedString must be an object keyed by AppLocale". These are returned to API clients via `errors[].message` regardless of `Accept-Language`.

**Fix**: This is a complex fix because scalars currently lack access to the request locale via `ctx`. The simplest approach is to use machine-readable error codes in `extensions.code` (which are already present in some) and move the human-readable message to the i18n system. However, since scalars run before resolvers where `ctx.t()` is available, we'll implement a lighter fix:

1. Replace hardcoded English messages with error constant strings that are used as `extensions.code`
2. The frontend already handles error display — it can map these codes to translated messages

**PREREQUISITE**: Check if the locale files have a `scalar` namespace for these errors. If not, this becomes a larger change requiring locale file additions to both `en` and `ar` error indices.

**Decision**: DEFER to a future round if the locale infrastructure changes are too large. For now, add `extensions.code` to distinguish error types so the frontend can translate them.

**Affected Tests**: Scalar-specific tests if they assert error messages.

### R2M-2: Vercel preview deployment gap in test-helper-gate

**File**: `backend/lib/test-helper-gate.ts` (line 17-19)
**Severity**: MEDIUM
**Source**: `r2-test-security-audit`

**Issue**: `isRealProductionDeployment()` only blocks `VERCEL_ENV === "production"`. A Vercel **preview** deployment with a leaked `TEST_SERVER=1` env var would have `isTestHelperEnabled()` return `true`, enabling `bootstrapDemoSuperAdmin` / `ensureDemoUsers` / `createTestEntities` mutations on a publicly-reachable preview URL.

**Fix**: Also block preview deployments:

```typescript
function isRealProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview";
}
```

**Affected Tests**: `backend/lib/test-helper-gate.test.ts` (add test case for `VERCEL_ENV=preview + TEST_SERVER=1` expecting `isTestHelperEnabled()` to be `false`).

### R2M-3: Missing rate limiting on admin API routes (storage/cleanup, etc.)

**File**: `app/api/storage/cleanup/route.ts` (line 60)
**Severity**: MEDIUM
**Source**: `r2-rate-limiting-audit`

**Issue**: Super-admin-only `POST /api/storage/cleanup` triggers `StorageService.cleanupExpiredSignedUrls()` on demand and is not rate-limited. A leaked/borrowed admin token can flood the DB with bulk deletes.

**Fix**: Add `checkRateLimit` with an `apiRateLimiter` to admin API routes. However, this requires checking if `checkRateLimit` can be used outside of GraphQL context (it's currently designed for GraphQL resolvers with `ctx.ipAddress`). For API routes, use `getClientIdentifier(request)` from `ratelimit.ts`:

```typescript
import { checkRateLimit, apiRateLimiter, getClientIdentifier } from "@/backend/lib/ratelimit";

export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  await checkRateLimit(clientId, apiRateLimiter, tErrors);
  // ... existing logic
}
```

**PREREQUISITE**: Verify that `apiRateLimiter` and `getClientIdentifier` are exported from `ratelimit.ts`. Also check if the admin auth check is already in place (Round 1 M3 added `isSuperAdmin` check). Only add rate limiting if it doesn't duplicate existing work.

**Decision**: Only fix `storage/cleanup` for now; other admin API routes (cron, fx/refresh) already have their own auth mechanisms. DEFER the broader API route rate limiting.

**Affected Tests**: No direct tests for API route rate limiting currently.

### R2M-4: Missing maxLength on storage operation input fields

**File**: `backend/graphql/pothos/storage/storage.pothos.ts` (lines 133, 204, 257, 267, 269, 293, 309, 319, 338, 351)
**Severity**: MEDIUM
**Source**: `r2-input-validation-audit`

**Issue**: Multiple `t.string({ required: true })` input fields (path, contentHash, contentType, newName, destinationPath, filePath, currentPath) have NO `maxLength` constraint. Path/contentType/contentHash/newName/destinationPath are attacker-controllable and feed storage operations. An attacker can submit arbitrarily large strings, causing memory/DoS and oversized filesystem paths.

**Fix**: Add `directives: { constraint: { maxLength: <N> } }` on every `t.string` field:
- Paths: `maxLength: 1024`
- `contentType`: `maxLength: 128`
- `contentHash`: `maxLength: 128`
- `newName`/`destinationPath`: `maxLength: 255`

**Affected Tests**: GraphQL integration tests for storage mutations. Check `frontend/common/graphql/test/` for storage tests.

### R2M-5: Missing fileSize bounds on UploadPreparationInput

**File**: `backend/graphql/pothos/storage/storage.pothos.ts` (line 268)
**Severity**: MEDIUM
**Source**: `r2-input-validation-audit`

**Issue**: `fileSize: t.int({ required: true })` in `UploadPreparationInput` has NO `min`/`max` bounds. An attacker can request absurdly large signed-URL sizes. Round 1 added `MAX_BLOB_SIZE` (100MB) on the Vercel path, but the legacy signed-URL path validates only against `signedUrl.fileSize` (which originates from this unbounded arg).

**Fix**: Add bounds:

```typescript
fileSize: t.int({ required: true, directives: { constraint: { min: 1, max: 104857600 } } }),
```

**Affected Tests**: Same storage tests as R2M-4.

### R2M-6: Missing maxLength on billing input fields

**File**: `backend/graphql/pothos/billing/billing-management.pothos.ts` (multiple lines)
**Severity**: MEDIUM
**Source**: `r2-input-validation-audit`

**Issue**: `amount`, `issueDate`, `dueDate`, `exchangeRateSnapshot`, `exchangeRateSource`, `rejectionReason`, `invoiceId`, `studentId`, `parentId` are all `t.arg.string({...})` with NO `maxLength`. Unbounded length enables DoS and storage abuse.

**Fix**: Add maxLength directives:
- UUID fields (invoiceId, studentId, parentId): `maxLength: 36`
- Date fields: `maxLength: 50`
- `exchangeRateSource`: `maxLength: 64`
- `rejectionReason`: `maxLength: 1000`
- `amount`: `maxLength: 64`

**Affected Tests**: Billing GraphQL tests in `frontend/common/graphql/test/`.

### R2M-7: Missing maxLength on billing search args (parentId, userId, search)

**File**: `backend/graphql/pothos/billing/billing-history.pothos.ts` (lines 221,222,224,254,307,308)
**Severity**: MEDIUM
**Source**: `r2-input-validation-audit`

**Issue**: `parentId`, `userId`, `search` query args (used in billing history / payment search) have NO `maxLength`. The `search` field feeds SQL filter logic. Compare with `complaints.pothos.ts:148` which correctly bounded `search` at `maxLength:255`.

**Fix**: Add maxLength (36 for ids, 255 for search) on all six occurrences.

**Affected Tests**: Billing history GraphQL tests.

### R2M-8: Missing maxLength on parent suggestion/search args

**File**: `backend/graphql/pothos/parents/suggestion.pothos.ts` (lines 258,259,339,384)
**Severity**: MEDIUM
**Source**: `r2-input-validation-audit`

**Issue**: `query`, `excludeId`, `suggestionId` args are unbounded. `query` is used for live autocomplete search and hits DB LIKE queries directly. `suggestionId`/`excludeId` are treated as UUIDs but lack `maxLength:36`.

**Fix**: Add maxLength (36 for ids, 255 for query).

**Affected Tests**: Parent suggestion GraphQL tests.

### R2M-9: Missing maxLength on schedule search args (date, search)

**File**: `backend/graphql/pothos/scheduling/schedule.pothos.ts` (lines 185-186) and `recurring-schedule.pothos.ts` (line 73)
**Severity**: MEDIUM
**Source**: `r2-input-validation-audit`

**Issue**: `date` (required), `search` (optional) have no maxLength. `search` strings feed SQL LIKE queries with no bound.

**Fix**: Add maxLength (20 for date, 255 for search).

**Affected Tests**: Scheduling GraphQL tests.

### R2M-10: MeetingChannelError surfaces internal system details to API clients

**File**: `backend/graphql/utils/handle-meeting-channel-error.ts` (line 15)
**Severity**: MEDIUM
**Source**: `r2-i18n-security-audit`

**Issue**: `handleMeetingChannelError` wraps `MeetingChannelError` into `GraphQLError(error.message, ...)`. The `error.message` is a hardcoded English string from channel-error subclasses (e.g., `RateLimitedError` → "Rate limited by 'zoom'. Retry after 30s."). These surface to GraphQL clients via `errors[].message`.

**Fix**: Map `error.code` (the machine-readable code on `MeetingChannelError.code`) to a translated message from `tErrors`. This requires passing `tErrors` into the helper or moving the translation to the resolver level.

Since `handleMeetingChannelError` doesn't have access to `ctx`, the simplest fix is to pass `tErrors` as a parameter:

```typescript
export function handleMeetingChannelError(error: unknown, tErrors: ErrorsLabels): never {
  if (error instanceof MeetingChannelError) {
    const message = mapMeetingChannelErrorToMessage(error, tErrors);
    throw new GraphQLError(message, {
      extensions: {
        code: error.code,
        ...(error.upstreamMessage ? { upstreamMessage: error.upstreamMessage } : {}),
      },
    });
  }
  throw error;
}
```

**PREREQUISITE**: Need to add meeting-channel error keys to the locale files (`shared/locale/en/errors/` and `shared/locale/ar/errors/`). This is a larger change requiring new i18n keys.

**Decision**: For this round, focus on adding `extensions.code` (already present) and stripping internal details from `error.message` so the raw upstream message is not leaked. Full i18n translation can be a follow-up.

**Affected Tests**: Meeting channel GraphQL tests if any assert error message content.

---

## LOW

### R2L-1: Missing proxy.ts prefixes for feedback, schedule, tools routes

**File**: `proxy.ts` (PROTECTED_PREFIXES array)
**Severity**: LOW
**Source**: `r2-auth-authz-audit`

**Issue**: The `feedback`, `schedule`, and `tools` routes exist under `app/(dashboard)/` but are MISSING from `PROTECTED_PREFIXES` in `proxy.ts`. They ARE protected by `(dashboard)/layout.tsx`'s `getServerUserContext()` gate, so no SSR auth bypass exists; the gap is only the edge-defense-in-depth Cookie-existence redirect not firing.

**Fix**: Add `"feedback"`, `"schedule"`, and `"tools"` to `PROTECTED_PREFIXES`:

```typescript
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/billing", "/parents", "/students", "/teachers", "/staff", "/supervisor",
  "/settings", "/billing-payments", "/payment-methods",
  "/scheduling", "/feedback", "/schedule", "/tools",
  // ...
];
```

**Affected Tests**: No direct tests for proxy.ts prefixes.

### R2L-2: gqlContextFactory getIpAddress trusts spoofable x-forwarded-for

**File**: `backend/graphql/gqlContextFactory.ts` (line 71-83)
**Severity**: LOW
**Source**: `r2-rate-limiting-audit`

**Issue**: `gqlContextFactory.getIpAddress` trusts `x-forwarded-for` unconditionally (no Vercel/Cloudflare gating, unlike `getClientIdentifier` in `ratelimit.ts:296-323`), so the IP used for resolver-scoped `authRateLimiter` is spoofable. An attacker can rotate the leftmost value to get a fresh auth rate-limit bucket.

**Fix**: Make `gqlContextFactory.getIpAddress` use the same conditional-trust logic as `getClientIdentifier`, or have resolvers use a server-derived identifier. However, `gqlContextFactory.ts` was already modified in Round 1 (L2 IPv6 support). Need to check if another agent also modified this file.

**NOTE**: `gqlContextFactory.ts` is in the current git diff — check if another agent's changes conflict before modifying.

**Decision**: DEFER if the file was modified by another agent. Otherwise, apply the fix by importing the IP extraction logic from `ratelimit.ts`.

**Affected Tests**: `backend/db/test/logic/auth/auth_rate_limit_enforcement.test.ts`.

### R2L-3: Test server forwards full process.env to spawned server

**File**: `frontend/common/graphql/test/testServer.ts` (line 24-34)
**Severity**: LOW
**Source**: `r2-test-security-audit`

**Issue**: `getDevTestServerEnv()` spreads `...process.env` into the spawned server's environment, forwarding every env var from the developer's shell (potentially including real secrets).

**Fix**: Filter forwarded env to an explicit allow-list. However, `testServer.ts` was already modified in Round 1 (M1 fix). Need to be careful not to undo our own Round 1 changes.

**Decision**: This is a LOW severity test-infrastructure issue. DEFER unless it's a quick fix.

**Affected Tests**: None directly (test infrastructure).

### R2L-4: loginUser default password "password" is a footgun

**File**: `frontend/common/graphql/test/helpers.ts` (line 228)
**Severity**: LOW
**Source**: `r2-test-security-audit`

**Issue**: `loginUser(email, password = "password")` has a default password that fails H2 complexity rules. While all call sites pass `TEST_USER_PASSWORD`, the default is a footgun.

**Fix**: Remove the default value so callers must pass it explicitly:

```typescript
export async function loginUser(email: string, password: string): Promise<...> {
```

**Affected Tests**: Verify all callers of `loginUser` pass the password explicitly (they should already do so).

### R2L-5: Missing maxLength on impersonation mutation args

**File**: `backend/graphql/pothos/auth/impersonation.pothos.ts` (lines 84,85)
**Severity**: LOW
**Source**: `r2-input-validation-audit`

**Issue**: Impersonation mutation args `targetUserId` (required) and `reason` (optional) are unbounded.

**Fix**: Add maxLength (36 for targetUserId, 1000 for reason).

**Affected Tests**: Impersonation GraphQL tests if any.

### R2L-6: Missing maxLength on cron operation id args

**File** `backend/graphql/pothos/cron/cron.pothos.ts` (lines 320,347,360)
**Severity**: LOW
**Source**: `r2-input-validation-audit`

**Issue**: `id: t.arg.string({ required: true })` (3 occurrences) for cron operations has no `maxLength:36` UUID cap.

**Fix**: Add `directives: { constraint: { maxLength: 36 } }`.

**Affected Tests**: Cron GraphQL tests.

### R2L-7: Missing maxLength on parent document/lifecycle args

**Files**: `backend/graphql/pothos/parents/parent-document.pothos.ts` (lines 23,36,37,38), `parent-lifecycle.pothos.ts` (line 22)
**Severity**: LOW
**Source**: `r2-input-validation-audit`

**Issue**: `parentId`, `fileId`, `usageType` all unbounded; `usageType` is an enum-like string with no length cap, and `fileId`/`parentId` are UUIDs.

**Fix**: Add maxLength (36 for ids, 64 for usageType).

**Affected Tests**: Parent GraphQL tests.

### R2L-8: Missing maxLength on system config key args

**Files**: `backend/graphql/pothos/system/general-settings.pothos.ts` (lines 92,143), `environment-config.pothos.ts` (line 189), `session-config.pothos.ts` (lines 125,155), `meeting-integrations.pothos.ts` (line 260)
**Severity**: LOW
**Source**: `r2-input-validation-audit`

**Issue**: Various `key`, `roleName`, `providerSlug` args are unbounded despite being identifiers.

**Fix**: Add maxLength:100 on these identifier args.

**Affected Tests**: System config GraphQL tests.

### R2L-9: Missing maxLength on permission group simulation groupSlug

**File**: `backend/graphql/pothos/permissions/permission-group-simulation.pothos.ts` (line 53)
**Severity**: LOW
**Source**: `r2-input-validation-audit`

**Issue**: `groupSlug` arg unbounded despite being a slug/identifier.

**Fix**: Add maxLength:100.

**Affected Tests**: Permission simulation GraphQL tests.

---

## Plan Review Findings (plan-review skill output)

### Violations Found & Fixed in Plan

1. **[BACKEND/DB/REPO] R2H-2, R2H-3: Wrong `escapeLikeWildcards` import path**
   - Plan had: `@/backend/db/repo/shared/like-utils`
   - Correct: `@/backend/utils` (confirmed via `parent.repository.ts:31`, `user.repository.ts:18`, `recurring-schedule.repository.ts:12`)
   - **FIXED**: Updated plan import paths

2. **[BACKEND/GRAPHQL] R2H-5, R2H-6: Wrong `checkRateLimit` call signature**
   - Plan had: `checkRateLimit(ctx.ipAddress, authRateLimiter, tErrors)` — three args with `tErrors`
   - Correct: `checkRateLimit(identifier, limiter, options?)` — `tErrors` is NOT a parameter. Must check `rateLimitResult.success` and throw `GraphQLError` with `TOO_MANY_ATTEMPTS` code
   - **FIXED**: Updated plan code samples with correct call pattern + result checking

### Rule Compliance Confirmed

- ✅ **Type imports**: Plan doesn't create local type definitions; uses existing types
- ✅ **Service boundaries**: No server/client component boundary violations
- ✅ **i18n**: R2H-1 uses `getServerTranslations` (already imported); R2M-10 acknowledges locale infrastructure needs
- ✅ **Logging**: Plan doesn't add `console.*` calls; session-hash fix uses `logger.warn`
- ✅ **Test conventions**: Rate-limit tests acknowledged in affected tests section
- ✅ **GraphQL documents**: No new documents needed (all changes are to existing resolvers/inputs)
- ✅ **No hardcoded error strings in repos**: escapeLikeWildcards fixes don't add error strings
- ✅ **backend/graphql/AGENTS.md**: `superAdmin: true` confirmed appropriate for DST bulk update
- ✅ **AppPermission.SCHEDULE_VIEW_ALL** exists in `backend/enum/permissions/permission.enum.ts:11`
- ✅ **`apiRateLimiter` and `getClientIdentifier`** exported from `@/backend/lib/ratelimit`
- ✅ Codegen step (`bun run generate:gqlSchema && bun codegen`) included after Pothos changes

---

## Verification Limits / DEFERRED Items

The following items were identified but are DEFERRED to future rounds:

1. **Unbounded `limit`/`offset` on many list queries** — pervasive pattern across 10+ Pothos input files. Fixing all at once is too large for this round. The `depthLimit(7)` and default limits on most repos mitigate the worst cases.

2. **Missing `maxComplexity` GraphQL validation rule** — adding cost-based analysis is a significant infrastructure change. Track separately.

3. **WhatsApp account field length validation** — requires verifying the service-layer validation claim and possibly adding directives.

4. **Vercel Blob onUploadCompleted magic-byte verification** — requires fetching and inspecting blob content post-upload, a larger feature.

5. **Full i18n translation of scalar error messages** — requires locale infrastructure changes and is tracked as R2M-1.

6. **Several env var provider-secret validation gaps** — deferred as resilient (lazy error at call-time).

---

## Affected Tests

### Database Repository Tests (`bun run test:db`)
- `backend/db/test/repo/teachers/staff-profile.repository.test.ts` — R2H-2 (escapeLikeWildcards in staff directory)
- `backend/db/test/repo/billing/billing.repository.test.ts` — R2H-3 (escapeLikeWildcards in invoice search)
- `backend/lib/test-helper-gate.test.ts` — R2M-2 (preview blocking)
- `backend/db/test/logic/auth/auth_rate_limit_enforcement.test.ts` — R2H-5, R2H-6 (rate limiting on changePassword, adminResetPassword)

### Service Tests (`bun run test:services`)
- `backend/services/scheduling/availability.service.test.ts` — R2H-1 (date span limit)
- `backend/services/auth/session.service.test.ts` — R2H-4 (session hash key change)

### GraphQL Integration Tests (`bun run test:graphql`)
- Status tracking schedule query tests — R2H-9 (authScopes added)
- Storage mutation tests — R2M-4, R2M-5 (maxLength + fileSize bounds)
- Billing mutation tests — R2M-6, R2M-7 (maxLength on billing args)
- Parent suggestion tests — R2M-8 (maxLength on suggestion args)
- Scheduling query tests — R2M-9 (maxLength on schedule args)
- DST migration tests — R2H-7 (authScopes elevated to superAdmin)
- Meeting integration tests — R2M-10 (error code mapping)

### Code Generation Required
After modifying Pothos input types (adding `directives: { constraint: { maxLength } }`), run:
```bash
bun run generate:gqlSchema && bun codegen
```

---

## Risks

1. **`availability.helpers.ts` is modified by another agent** — We MUST NOT touch this file. The date-span fix goes in `availability.service.ts` only. If the other agent's changes affect the same code path, our fix must be compatible.

2. **`gqlContextFactory.ts` may be modified by another agent** — R2L-2 depends on this file. Check git status before modifying. If another agent already changed it, skip or adapt.

3. **Test compatibility with rate limiting changes** — Adding `checkRateLimit` to `changePassword` and `adminResetPassword` may cause test failures if tests call these mutations many times in quick succession. The rate limiter may need to be mocked or use a higher limit in test mode.

4. **authScopes elevation on DST mutation** — Changing from `loggedIn` to `superAdmin` will break any GraphQL test that calls `executeDstBulkUpdate` without a superadmin context. Update the test to use a superadmin user.

5. **escapeLikeWildcards import path** — Verify the correct import path for `escapeLikeWildcards` before using it in new files. Other repos import it from a shared utils file.

6. **Locale infrastructure for new i18n keys** — If meeting channel error translations are needed (R2M-10), new locale keys must be added to both `en` and `ar` error indices, which requires updating the locale type schema too. This is a large change and may be deferred.

7. **Another agent may modify shared files** — Files like `gqlContextFactory.ts`, `auth.mutation.ts` are in the current git diff. Before modifying, check if another agent's changes are present and respect them.

8. **GraphQL codegen after schema changes** — Any change to Pothos input types (maxLength directives) requires regenerating the schema and codegen. The generated files are also in the git diff — ensure we don't conflict with the other agent's generated files.

---

## Implementation Order

1. **R2H-4** (session-hash fallback key) — isolated file, no dependencies
2. **R2H-2** (staff directory escapeLikeWildcards) — isolated repo file
3. **R2H-3** (invoice search escapeLikeWildcards) — isolated repo file
4. **R2M-2** (test-helper-gate preview fix) — isolated lib file
5. **R2H-1** (availability date span limit) — service file only
6. **R2H-7** (DST mutation authScopes) — small mutation file
7. **R2H-9** (statusTrackingSchedule authScopes) — single Pothos field
8. **R2H-5, R2H-6** (rate limiting on password mutations) — two mutation files
9. **R2H-8** (legacy upload MIME allowlist) — API route file
10. **R2L-1** (proxy.ts missing prefixes) — small edit
11. **R2M-4, R2M-5** (storage maxLength + fileSize bounds) — Pothos storage input
12. **R2M-6, R2M-7, R2M-8, R2M-9** (billing/parent/schedule maxLength) — multiple Pothos inputs
13. **R2L-5 through R2L-9** (low-priority maxLength additions) — multiple Pothos inputs
14. **R2M-10** (meeting channel error code mapping) — if feasible
15. **R2L-2** (gqlContextFactory IP spoofing) — if file not modified by another agent
16. **Run `bun run generate:gqlSchema && bun codegen`** — after all Pothos changes
17. **Run quality-gate per file** — `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`
18. **Run all tests** — `bun tsgo && bun run test:db && bun run test:services && bun run test:graphql`
