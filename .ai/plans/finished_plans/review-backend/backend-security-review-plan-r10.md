# Backend Security Review — Round 10 Implementation Plan

> **Source**: Backend security review (2026-08-18)
> **Status**: DRAFT — R10 — 12 HIGH, 15 MEDIUM, 10 LOW, 6 VERIFY

## Constraints
- No commits or pushes
- Respect concurrent agent's work — don't revert changes on files we didn't modify
- If a file we modified has changes we didn't make, another agent did it — respect their work
- Ensure db and services tests continue passing
- Fix all severities

---

## HIGH Severity

### H1 — LIKE wildcard injection: parent.repository.ts (2 sites)
- **File**: `backend/db/repo/parents/parent.repository.ts`
- **Lines**: 132, 653-654
- **Problem**: Both `ilike()` call sites use raw user `options.search`/`input.search` without `escapeLikeWildcards()`. File does NOT import it.
- **Fix**: Add `import { escapeLikeWildcards } from "@/backend/utils"`, wrap all search patterns:
  - Line 132: `or(ilike(users.name, \`%${escapeLikeWildcards(options.search)}%\`), ilike(users.email, \`%${escapeLikeWildcards(options.search)}%\`))`
  - Line 653: `const searchPattern = \`%${escapeLikeWildcards(input.search)}%\``
- **Tests**: parent-related db tests — verify still pass

### H2 — LIKE wildcard injection: user.repository.ts
- **File**: `backend/db/repo/users/user.repository.ts`
- **Line**: 198
- **Problem**: `ilike(users.name, ...)` and `ilike(users.email, ...)` use unescaped `trimmedSearch`. File does NOT import `escapeLikeWildcards`.
- **Fix**: Add `import { escapeLikeWildcards } from "@/backend/utils"`, wrap both: `or(ilike(users.name, \`%${escapeLikeWildcards(trimmedSearch)}%\`), ilike(users.email, \`%${escapeLikeWildcards(trimmedSearch)}%\`))`
- **Tests**: user.repository.test.ts (2 tests) — verify still pass

### H3 — LIKE wildcard injection: staff-profile.repository.ts:250
- **File**: `backend/db/repo/teachers/staff-profile.repository.ts`
- **Line**: 250
- **Problem**: Both `ilike()` calls use unescaped `trimmedSearch`. File imports `escapeLikeWildcards` (R9 added it for line 147) but this second site at line 250 was not wrapped.
- **Fix**: Wrap both: `or(ilike(users.name, \`%${escapeLikeWildcards(trimmedSearch)}%\`), ilike(users.email, \`%${escapeLikeWildcards(trimmedSearch)}%\`))`
- **Tests**: staff-profile-related tests

### H4 — LIKE wildcard injection: recurring-schedule.repository.ts
- **File**: `backend/db/repo/scheduling/recurring-schedule.repository.ts`
- **Lines**: 226-227
- **Problem**: `searchPattern = \`%${options.search}%\`` from raw user input fed to `sql` template ILIKE. No `escapeLikeWildcards` import.
- **Fix**: Add import, escape: `const searchPattern = \`%${escapeLikeWildcards(options.search)}%\``
- **Tests**: recurring-schedule-related tests

### H5 — LIKE wildcard injection: daily-schedule.utils.ts
- **File**: `backend/db/repo/scheduling/scheduling-queries.repository/daily-schedule.utils.ts`
- **Lines**: 101-114
- **Problem**: `searchPattern = \`%${search}%\`` from raw user input fed to 3 `ilike()` calls. No import.
- **Fix**: Add import, escape: `const searchPattern = \`%${escapeLikeWildcards(search)}%\``
- **Tests**: daily-schedule-related tests

### H6 — LIKE wildcard injection: reschedule-tracking.utils.ts
- **File**: `backend/db/repo/scheduling/scheduling-queries.repository/reschedule-tracking.utils.ts`
- **Lines**: 23-26
- **Problem**: `searchPattern = \`%${input.search}%\`` fed to 2 `ILIKE` template-tag clauses. No import.
- **Fix**: Add import, escape: `const searchPattern = \`%${escapeLikeWildcards(input.search)}%\``
- **Tests**: reschedule-tracking-related tests

### H7 — LIKE wildcard injection: quota.repository.ts
- **File**: `backend/db/repo/billing/quota.repository.ts`
- **Line**: 357-358
- **Problem**: `searchPattern = \`%${filter.search}%\`` fed to `sql` ILIKE. No `escapeLikeWildcards` import.
- **Fix**: Add import, escape: `const searchPattern = \`%${escapeLikeWildcards(filter.search)}%\``
- **Tests**: quota.repository.test.ts (9 tests) — verify still pass

### H8 — Missing authScopes: recurringSchedules queryField
- **File**: `backend/graphql/pothos/scheduling/recurring-schedule.pothos.ts`
- **Line**: 67
- **Problem**: `queryField("recurringSchedules")` has no `authScopes`. Resolver uses `ctx.user?.id ?? ""` fallback.
- **Fix**: Add `authScopes: { loggedIn: true }` to the field definition (before `resolve`). Keep the `requireAuth` or service-layer check as defense-in-depth.
- **Note**: Check if concurrent agent modified this file first. If so, respect their changes.

### H9 — Missing authScopes: suggestion.pothos.ts (3 queryFields) — R9 carryforward
- **File**: `backend/graphql/pothos/parents/suggestion.pothos.ts`
- **Lines**: 232 (parentSuggestions), 253 (searchSuggestions), 270 (suggestionContributorStats)
- **Problem**: These 3 queryFields lack `authScopes` despite R9 identifying them. Fix was not persisted (concurrent agent may have reverted).
- **Fix**: Add `authScopes: { loggedIn: true }` to parentSuggestions and suggestionContributorStats, `authScopes: { permission: AppPermission.SUGGESTIONS_REVIEW }` to searchSuggestions. Import `AppPermission` from `@/backend/enum` if not already imported.
- **Note**: Check if concurrent agent modified this file. If they added authScopes already, skip.

### H10 — Missing authScopes: supportedCurrencies queryField — R9 carryforward
- **File**: `backend/graphql/pothos/billing/currency.pothos.ts`
- **Line**: 40
- **Problem**: `queryField("supportedCurrencies")` has no `authScopes`. R9 identified this but fix was not persisted.
- **Fix**: Add `authScopes: { loggedIn: true }` to the field definition.
- **Note**: Check if concurrent agent modified this file. If they added authScopes already, skip.

### H11 — Email-comparison auth check in storage cleanup route
- **File**: `app/api/storage/cleanup/route.ts`
- **Lines**: 48-49
- **Problem**: Admin authorization uses `user.email !== adminEmail` (email comparison) instead of `PermissionsService.getUserContext().isSuperAdmin`. Brittle and bypasses RBAC.
- **Fix**: Replace email comparison with permission check:
  ```ts
  const { PermissionsService } = await import("@/backend/services/auth/permissions.service");
  const permCtx = await PermissionsService.getUserContext(user.id);
  if (!permCtx.isSuperAdmin) {
    return NextResponse.json({ error: tErrors.forbidden }, { status: 403 });
  }
  ```
- **Tests**: None directly — manual verification

### H12 — demoLogin mutation lacks rate limiting
- **File**: `backend/graphql/mutation/auth/auth.mutation.ts`
- **Lines**: 276-311
- **Problem**: `demoLogin` mutation has no `checkRateLimit` call, unlike `login` (line 189). When IS_DEMO is enabled, attacker can call unboundedly.
- **Fix**: Add `checkRateLimit(ctx.ipAddress ?? "[unknown]", authRateLimiter)` at the top of the resolver body (after line 285, before the IS_DEMO check or immediately after).
- **Tests**: auth.test.ts — verify rate limit doesn't break existing tests (DISABLE_RATE_LIMITING may need to be set in test env)

### H13 — IPv6 collapse in sanitizeIpAddress
- **File**: `backend/lib/ip-utils.ts`
- **Lines**: 10-12
- **Problem**: `sanitizeIpAddress` uses `ip.split(":")` and only validates IPv4. All IPv6 addresses collapse to `"127.0.0.1"` fallback, causing all IPv6 clients to share one rate-limit/lockout bucket.
- **Fix**: Add IPv6 validation and return IPv6 addresses as-is:
  ```ts
  const IPV4_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  const IPV6_REGEX = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  
  export function sanitizeIpAddress(ip: string | null | undefined): string | null {
    if (!ip) return null;
    // Strip IPv4 port suffix (IPv4:port)
    const parts = ip.split(":");
    const cleanIp = parts.length === 2 ? parts[0] : ip;
    if (IPV4_REGEX.test(cleanIp)) return cleanIp;
    if (IPV6_REGEX.test(ip)) return ip;
    return "127.0.0.1";
  }
  ```
- **Tests**: ip-format.test.ts — verify existing tests still pass, check if IPv6 tests exist

### H14 — i18n: availability.service.ts hardcoded English tails (5 sites)
- **File**: `backend/services/scheduling/availability.service.ts`
- **Lines**: 318, 400-401, 419, 427, 436
- **Problem**: ValidationError messages append hardcoded English after translated prefix. Lines 419, 427, 436 also hardcode `getServerTranslations("en")` ignoring caller locale.
- **Fix**: Add i18n keys to `shared/locale/types/errors/index.ts`, `shared/locale/en/errors/index.ts`, and `shared/locale/ar/errors/index.ts`:
  - `vacationStartBeforeEnd`
  - `startTimeBeforeEndTime`
  - `dateRangeExceedsMax: (maxDays: number) => string`
  - `vacationRequestNotPending: (id: string) => string`
  - `vacationRequestAlreadyCancelled: (id: string) => string`
  Then replace hardcoded English with `tErrors.scheduling.vacationStartBeforeEnd` etc.
- **Tests**: availability.service.test.ts — verify still passes

### H15 — MIME validation gap: vercel-upload route + validateUpload
- **File**: `app/api/storage/vercel-upload/route.ts:105-115`, `backend/db/repo/storage/storage.repository.ts:756-782`
- **Problem**: Vercel Blob upload trusts client-supplied `contentType` without server-side MIME allowlist check. `validateUpload` has a TODO comment skipping MIME validation. SVG/HTML/JS could be uploaded.
- **Fix**: In `validateUpload` (storage.repository.ts:776-778), replace the TODO with:
  ```ts
  if (!isAllowedMimeType(contentType)) {
    return tErrors.invalidFileType;
  }
  ```
  Import `isAllowedMimeType` from `@/backend/lib/storage/mime-allowlist`.
- **Tests**: storage-related tests — verify MIME rejection works

### H16 — Test passwords: general-user-create.test.ts bare randomUUID()
- **File**: `frontend/common/graphql/test/users/general-user-create.test.ts`
- **Lines**: 71, 136
- **Problem**: Bare `randomUUID()` used as password. All-lowercase hex, no uppercase/special. Flows through `validatePassword: true`.
- **Fix**: Replace with `generateTestPassword()` or `"TestPass-${randomUUID().slice(0,8)}!"` pattern.
- **Tests**: The test file itself — verify still passes after change

---

## MEDIUM Severity

### M1 — resolveAdminPassword silent fallback for IS_DEMO/TEST_SERVER
- **File**: `shared/demo-users.ts`
- **Lines**: 19-28
- **Problem**: `resolveAdminPassword()` only throws when `NODE_ENV === "production"`. In non-production IS_DEMO deployments, silently falls back to source-known `DEFAULT_SEED_ADMIN_PASSWORD`.
- **Fix**: Add check using raw `process.env` (NOT `getBooleanEnv` — shared/ MUST NOT import from `@/backend/**`):
  ```ts
  if ((process.env.IS_DEMO === "true" || process.env.TEST_SERVER === "1") && !process.env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD env var is required when IS_DEMO/TEST_SERVER is set");
  }
  ```

### M2 — Demo user passwords bypass resolveAdminPassword
- **File**: `shared/demo-users.ts`
- **Lines**: 46,56,66,76,86,96
- **Problem**: All non-superadmin demo users hard-wire `plainPassword: DEFAULT_SEED_ADMIN_PASSWORD` directly.
- **Fix**: Route all `plainPassword` fields through `resolveAdminPassword()`.

### M3 — No Content-Disposition on file serving
- **File**: `app/api/storage/files/[[...path]]/route.ts`
- **Lines**: 161-171, 104-115
- **Problem**: No `Content-Disposition: attachment` for non-image files. Combined with MIME gap, could enable content-sniffing XSS.
- **Fix**: Add `Content-Disposition: attachment` for non-image MIME types in `buildFileResponse`.

### M4 — contentTypes stringList missing maxItems
- **File**: `backend/graphql/pothos/storage/storage.pothos.ts`
- **Line**: 143
- **Problem**: `contentTypes: t.stringList({ required: false })` has no `maxItems` or `maxLength`.
- **Fix**: Add `directives: { constraint: { maxItems: 100, maxLength: 128 } }`

### M5 — permission-management.pothos.ts stringList missing maxLength
- **File**: `backend/graphql/pothos/permissions/permission-management.pothos.ts`
- **Lines**: 130, 139, 231
- **Problem**: Three `permissionIds`/`userIds` stringList inputs have `maxItems: 100` but no per-item `maxLength`.
- **Fix**: Add `maxLength: 36` to each (UUID length).

### M6 — Unbounded string inputs in billing pothos files
- **Files**: `backend/graphql/pothos/billing/currency-hedge.pothos.ts:42,68,70`, `backend/graphql/pothos/billing/fx-ingestion.pothos.ts:279`, `backend/graphql/pothos/classes/group-class.pothos.ts:127`
- **Problem**: Multiple `t.arg.string()` inputs lack `maxLength`.
- **Fix**: Add appropriate `maxLength` constraints (notes: 10000, rate: 32, content: 10000, UUID fields: 36).

### M7 — maxCount client-overridable pagination limit
- **File**: `backend/types/shared/pagination.types.ts`
- **Lines**: 51-67, 88
- **Problem**: `maxCount` is a client-supplied input with no upper bound clamp. Client can override default 100 with any value.
- **Fix**: Clamp `maxCount` to `MAX_COUNT` in `perPage` getter regardless of client input.

### M8 — Unauthenticated POST /api/logs
- **File**: `app/api/logs/route.ts`
- **Lines**: 175-189
- **Problem**: No authentication before writing client log batches to disk. When CLIENT_LOGS_ENABLED, anonymous callers can fill disk.
- **Fix**: Require authentication before accepting the batch.

### M9 — Missing DISABLE_RATE_LIMITING in dev test env
- **File**: `frontend/common/graphql/test/testServer.ts`
- **Lines**: 24-33
- **Problem**: Dev mode test env doesn't set `DISABLE_RATE_LIMITING: "true"`, unlike production test env.
- **Fix**: Add `DISABLE_RATE_LIMITING: "true"` to `getDevTestServerEnv`.

### M10-M22 — Repo i18n hardcoded English throws (13 sites)
Multiple repo files have `throw new Error("Failed to create/update X")` or `"X not found"` with hardcoded English:
- `subject-resource.repository.ts:112,152,186`
- `suggestion.repository.ts:59,83`
- `complaint-response.repository.ts:65`
- `teacher.repository.ts:50,325`
- `teacher-notes.repository.ts:60`
- `staff-profile.repository.ts:64,415`
- `user-payment-method.repository.ts:79`
- `currency-hedge.repository.ts:41`
- `class-meeting-config.repository.ts:103`
- `meeting-provider-token.repository.ts:76,86`
- `session.repository.ts:258,321`

- **Fix**: For each, add i18n keys to locale files and use `getServerTranslations(locale ?? "en")` pattern. Thread `locale?` param where needed.
- **Tests**: Verify corresponding test suites still pass

### M23-M28 — Test passwords: bare randomUUID() in manager-onboarding tests
- **File**: `backend/services/staff/test/manager-onboarding.service.test.ts`
- **Lines**: 98, 124, 154, 169, 189, 214
- **Problem**: Bare `randomUUID()` as password in service-layer test fixtures.
- **Fix**: Replace with `generateTestPassword()` or `"TestPass-${randomUUID().slice(0,8)}!"` pattern.

---

## LOW Severity

### L1-L6 — Missing maxLength on UUID string inputs
- `parent-profile.pothos.ts:117,130,144,162,175,188` — 6 ID inputs lack `maxLength: 36`
- `student-lifecycle.pothos.ts:39,40,61` — 3 ID inputs lack `maxLength: 36`
- `staff-directory.pothos.ts:163,164` — filter inputs lack `maxLength: 64`
- `learning-resource.pothos.ts:40` — searchQuery lacks `maxLength: 255`

### L7-L22 — Test passwords: bare randomUUID() in DB logic tests
Multiple `backend/db/test/logic/` files use bare `randomUUID()` as password in direct `users` table inserts. Low severity (bypasses validation) but inconsistent with the `generateTestPassword()` convention.
- Files: `teacher_availability.test.ts:20`, `student_progress.test.ts:32`, `rls.test.ts:81,116`, `audit-immutability.test.ts:21`, `payment-idempotency.test.ts:25,51`, `ip-format.test.ts:22,51,91,120`, `audit-trail.test.ts:36`, `column-encryption.test.ts:17`
- `admin-reset-password.service.test.ts:31`, `impersonation.service.test.ts:43`

### L23 — learning-resource.repository.ts hardcoded English
- `backend/db/repo/storage/learning-resource.repository.ts:71,146` — "Failed to create X" throws
- **Fix**: Add i18n keys and throw localized errors

### L24-L25 — Service i18n hardcoded throws
- `permissions.service.ts:96` — "Permission group not found" (use existing `tErrors.permissionManagement.permissionGroupNotFound(id)`)
- `quota.service.ts:732,735` — "Cannot refresh non-periodic quota" / "Quota has no valid period days configured"
- `fx-ingestion.service.ts:95` — "fxSyncAlreadyRunning" opaque code

### L26 — Edge proxy lack auth check
- `proxy.ts` — No edge-level cookie check. Mitigated by server-component layout auth.
- **Status**: DEFER — server-component auth is sufficient

---

## VERIFY (needs manual confirmation)

### V1 — supportedCurrencies intentional public?
- Confirm whether currency catalog is intended to be public. If not, add `authScopes: { loggedIn: true }`.

### V2 — validatePasswordStrength contract gap
- `backend/lib/auth/password.ts:11-17` — docstring claims complexity rules but only checks length<8. Root cause for bare UUID passwords passing.

### V3-V6 — GraphQL scalars + opaque error codes
- `stringMapScalar.ts`, `localizedStringScalar.ts` — verify if locale is available in scalar context
- `payment-method-mask.ts` — verify if shape guards surface to users
- `app/api/logs/route.ts:24` — invalidSessionId throw not localized

### V7 — ensureDemoUsers missing authScopes
- **DO NOT FIX** — intentional for bootstrap. Adding `authScopes` would break circular dependency. Add a comment documenting the rationale instead.

---

## Risks

### R1 — LIKE injection fixes may change search behavior
- **Impact**: Escaping `%` and `_` in search patterns changes behavior for users who rely on wildcards
- **Mitigation**: This is a security fix — wildcard characters in search are not a documented feature

### R2 — authScopes additions may break GraphQL tests
- **Impact**: Adding `authScopes` to queryFields means unauthenticated test clients will be rejected
- **Mitigation**: Test lifecycle uses `ensureDemoUsers` → `demoLogin` → authenticated `testClient` — should be fine

### R3 — i18n fixes require adding locale keys to 3 files
- **Impact**: Must verify keys exist in both `en` and `ar` locale files before referencing
- **Mitigation**: Use existing key patterns; verify with grep

### R4 — validateUpload MIME check may reject legitimate uploads
- **Impact**: Adding `isAllowedMimeType` check could block file types that were previously allowed
- **Mitigation**: Check `mime-allowlist.ts` include list — it already has common types

### R5 — sanitizeIpAddress IPv6 fix may break existing IP tests
- **Impact**: ip-format.test.ts may assert specific behavior for IPv6
- **Mitigation**: Check test expectations before changing

### R6 — Concurrent agent file conflicts
- **Impact**: Another agent is working on backend files; they may modify the same files
- **Mitigation**: Check each file for concurrent changes before editing; respect their work; don't revert

---

## Files Changed Summary

| Fix | File | Severity | Description |
|---|---|---|---|
| H1 | `backend/db/repo/parents/parent.repository.ts` | HIGH | LIKE wildcard escape (2 sites) |
| H2 | `backend/db/repo/users/user.repository.ts` | HIGH | LIKE wildcard escape |
| H3 | `backend/db/repo/teachers/staff-profile.repository.ts` | HIGH | LIKE wildcard escape (2nd site) |
| H4 | `backend/db/repo/scheduling/recurring-schedule.repository.ts` | HIGH | LIKE wildcard escape |
| H5 | `backend/db/repo/scheduling/scheduling-queries.repository/daily-schedule.utils.ts` | HIGH | LIKE wildcard escape (3 ilike) |
| H6 | `backend/db/repo/scheduling/scheduling-queries.repository/reschedule-tracking.utils.ts` | HIGH | LIKE wildcard escape |
| H7 | `backend/db/repo/billing/quota.repository.ts` | HIGH | LIKE wildcard escape |
| H8 | `backend/graphql/pothos/scheduling/recurring-schedule.pothos.ts` | HIGH | Add authScopes |
| H9 | `backend/graphql/pothos/parents/suggestion.pothos.ts` | HIGH | Add authScopes (3 queryFields) |
| H10 | `backend/graphql/pothos/billing/currency.pothos.ts` | HIGH | Add authScopes |
| H11 | `app/api/storage/cleanup/route.ts` | HIGH | Replace email-comparison auth with PermissionsService |
| H12 | `backend/graphql/mutation/auth/auth.mutation.ts` | HIGH | Add rate limiting to demoLogin |
| H13 | `backend/lib/ip-utils.ts` | HIGH | Fix IPv6 handling in sanitizeIpAddress |
| H14 | `backend/services/scheduling/availability.service.ts` | HIGH | i18n hardcoded English tails (5 sites) |
| H15 | `backend/db/repo/storage/storage.repository.ts` | HIGH | Add MIME validation to validateUpload |
| H16 | `frontend/common/graphql/test/users/general-user-create.test.ts` | HIGH | Replace bare randomUUID passwords |
| M1-M2 | `shared/demo-users.ts` | MEDIUM | resolveAdminPassword fallback + demo passwords |
| M3 | `app/api/storage/files/[[...path]]/route.ts` | MEDIUM | Content-Disposition: attachment |
| M4 | `backend/graphql/pothos/storage/storage.pothos.ts` | MEDIUM | contentTypes maxItems+maxLength |
| M5 | `backend/graphql/pothos/permissions/permission-management.pothos.ts` | MEDIUM | stringList maxLength |
| M6 | Multiple billing pothos files | MEDIUM | String input maxLength constraints |
| M7 | `backend/types/shared/pagination.types.ts` | MEDIUM | Clamp maxCount |
| M8 | `app/api/logs/route.ts` | MEDIUM | Require auth for log ingestion |
| M9 | `frontend/common/graphql/test/testServer.ts` | MEDIUM | DISABLE_RATE_LIMITING in dev env |
| M10-M22 | Multiple repo files | MEDIUM | i18n hardcoded English throws |
| M23-M28 | `backend/services/staff/test/manager-onboarding.service.test.ts` | MEDIUM | Replace bare randomUUID passwords |
| L1-L6 | Multiple pothos files | LOW | maxLength on UUID inputs |
| L7-L22 | Multiple DB test files | LOW | Replace bare randomUUID passwords |
| L23-L25 | Service/repo files | LOW | i18n hardcoded throws |
