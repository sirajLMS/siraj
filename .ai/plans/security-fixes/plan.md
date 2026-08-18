# Backend Security Fixes — Implementation Plan

> **Source**: Backend security review (15 findings: 4 HIGH, 5 MEDIUM, 5 LOW, 1 VERIFY)
> **Status**: Refined (3rd pass) — 19 risks identified, L3 getTableRowCounts removed (already fixed), H4/L3/M3/L1/L5 line numbers corrected against codebase, L1 route list completed, L5 missed fields added, H4 phantom citation removed, H4 SQL template vs ilike() pattern distinction documented — DO NOT IMPLEMENT until plan-review passes

---

## HIGH Severity

### H1 — `recurringSchedules` query missing `authScopes`

- **File**: `backend/graphql/pothos/scheduling/recurring-schedule.pothos.ts`
- **Line**: 67-73 (the `queryField` call starts at line 67, `t.field({` at line 68)
- **Layer**: `backend/graphql/`
- **Problem**: The `recurringSchedules` queryField has NO `authScopes` — any unauthenticated client can call it. The resolver uses `ctx.user?.id ?? ""` (line 76), silently treating anonymous requests as user-id `""`.
- **Fix**: Add `authScopes: { loggedIn: true }` to the `t.field({})` options (between `type` and `args`, or after `args` — matching sibling pattern).
- **Code change**:
  ```ts
  // line 67-73, add authScopes:
  gqlSchemaBuilder.queryField("recurringSchedules", t =>
    t.field({
      type: RecurringSchedulesPaginatedResultRef,
      authScopes: { loggedIn: true },           // ← ADD THIS
      args: {
        pagination: t.arg({ type: PaginationArgsObject, required: false }),
        search: t.arg.string({ required: false }),
      },
      resolve: async (_root, args, ctx) => {
  ```
- **i18n**: No new keys — `authScopes` is a Pothos built-in, no user-facing message.
- **Types**: No new type imports.
- **Tests**: No existing tests for this resolver's auth — consider adding one (non-blocking).

---

### H2 — Password complexity rules not implemented

- **File**: `backend/lib/auth/password.ts`
- **Lines**: 11-17
- **Layer**: `backend/lib/` (covered by root `AGENTS.md`)
- **Problem**: The docstring (lines 6-9) claims 4 complexity rules (uppercase, lowercase, digit, special char), but `validatePasswordStrength` only checks `password.length < 8`.
- **Fix**: Add 4 regex checks after the length check, using existing i18n keys.
- **i18n keys already exist**:
  - `shared/locale/types/errors/index.ts:11-14`: `passwordRequiresUppercase`, `passwordRequiresLowercase`, `passwordRequiresDigit`, `passwordRequiresSpecialChar`
  - `shared/locale/en/errors/index.ts:82-85`: English implementations ✅
  - `shared/locale/ar/errors/index.ts:82-85`: Arabic implementations ✅
  - No new i18n registrations needed.
- **Code change**:
  ```ts
  export async function validatePasswordStrength(password: string, locale?: string): Promise<void> {
    const { auth } = getServerTranslations(locale ?? "en").errorsTranslations;

    if (password.length < 8) {
      throw new Error(auth.passwordMinLength);
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error(auth.passwordRequiresUppercase);
    }
    if (!/[a-z]/.test(password)) {
      throw new Error(auth.passwordRequiresLowercase);
    }
    if (!/[0-9]/.test(password)) {
      throw new Error(auth.passwordRequiresDigit);
    }
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:',.<>?\/]/.test(password)) {
      throw new Error(auth.passwordRequiresSpecialChar);
    }
  }
  ```
- **Types**: No new types. `getServerTranslations` already imported.
- **Tests**: Update `backend/services/auth/test/admin-reset-password.service.test.ts` to cover the 4 new error paths (non-blocking — existing tests for `passwordMinLength` still pass).
- **⚠️ RISK — Bare `randomUUID()` passwords in GraphQL tests**: Most test helpers use `generateTestPassword()` which returns `"TestPass-XXXXXXXX!"` — this has uppercase (T,P), lowercase (est,ass), digit (UUID hex), and special char (`-`, `!`), so it passes the new rules ✅. HOWEVER, `frontend/common/graphql/test/teachers/teacher-onboarding.test.ts:31` and `:231` use **bare `randomUUID()`** as the password — UUIDs are all lowercase hex digits with no uppercase and no special char. **These will FAIL** after this fix. Must update these to `generateTestPassword()` or `"TestPass-${randomUUID().slice(0, 8)}!"`.
  - **Files to audit**: `frontend/common/graphql/test/teachers/teacher-onboarding.test.ts:31,231` (both use bare `randomUUID()`).
  - **Files confirmed safe**: `admin-password.test.ts`, `student-onboarding.test.ts` (`Pwd_${randomUUID()}` — has uppercase P, lowercase wd, special _), `parent-onboarding.test.ts` (same pattern), `manager-onboarding.test.ts` (same pattern), all backend service tests using `generateTestPassword()`.
- **⚠️ Note on `_` as special char**: The regex `/[!@#$%^&*()_+\-=\[\]{}|;:',.<>?\/]/` includes `_`. The `Pwd_${randomUUID()}` pattern uses `_` which counts as a special char. ✅. But if the team decides `_` is too weak (it's a word char), adjust the regex.

---

### H3 — `ensureDemoUsers` mutation missing `authScopes`

- **File**: `backend/graphql/mutation/shared/test-helper.mutation.ts`
- **Line**: 48
- **Layer**: `backend/graphql/`
- **Problem**: The `ensureDemoUsers` mutation has NO `authScopes` — relies only on `assertTestHelperAllowed()` runtime check. Sibling mutations `createTestEntities` (:61) and `cleanupTestEntities` (:76) both have `authScopes: { loggedIn: true }`.
- **Fix**: Add `authScopes: { loggedIn: true }` to the `t.field({})` options.
- **⚠️ CRITICAL RISK — Circular bootstrap problem**: `ensureDemoUsers` provisions the demo super admin user. After it runs, tests call `demoLogin("super_admin")` to get an auth token. Adding `authScopes: { loggedIn: true }` to `ensureDemoUsers` creates a circular dependency: you need a token to call `ensureDemoUsers`, but you need `ensureDemoUsers` to provision the user to get a token. **This will break ~40 GraphQL test suites** that call `setupTestServerLifecycle()` → `ensureDemoUsersForTests()` in `beforeAll`.
  - **Recommended solution (Option A)**: Seed the super admin via DB seed (direct repository call, bypassing GraphQL) in the test lifecycle's `beforeAll`, then call `demoLogin("super_admin")` to get a token, then call `ensureDemoUsers` with the token to provision remaining demo users.
  - **Alternative (Option B)**: Exempt `ensureDemoUsers` from `authScopes` but add a secret token check (e.g., `X-Test-Secret` header matching `process.env.TEST_SECRET`). Less clean but avoids restructuring.
  - See Testing section for per-test-suite impact and migration steps.
- **Code change**:
  ```ts
  // line 48-55, add authScopes:
  gqlSchemaBuilder.mutationField("ensureDemoUsers", t =>
    t.field({
      type: "Boolean",
      authScopes: { loggedIn: true },           // ← ADD THIS
      resolve: async () => {
        assertTestHelperAllowed();
        return await TestHelperService.ensureDemoUsers();
      },
    })
  );
  ```
- **i18n**: No new keys.
- **Types**: No new type imports.

---

### H4 — Unescaped LIKE wildcards in 7 repository search sites

- **Files** (7 unescaped sites found — more than original 5):
  1. `backend/db/repo/scheduling/recurring-schedule.repository.ts:226` — `const searchPattern = '%${options.search}%'` → used in `sql` template: `... ILIKE ${searchPattern}` at line 227 (**2 ILIKE occurrences on line 227**)
  2. `backend/db/repo/scheduling/scheduling-queries.repository/reschedule-tracking.utils.ts:23` — `const searchPattern = '%${input.search}%'` → used in `sql` template: `... ILIKE ${searchPattern}` at line 26 (**2 ILIKE occurrences on line 26**)
  3. `backend/db/repo/scheduling/scheduling-queries.repository/daily-schedule.utils.ts:101` — `const searchPattern = '%${search}%'` → used in 3 `ilike()` calls at lines 112-114 (`ilike(students.name, searchPattern)`, `ilike(users.name, searchPattern)`, `ilike(sql\`${classInstances.id}::text\`, searchPattern)`) — all 3 calls consume the same `searchPattern` variable
  4. `backend/db/repo/parents/parent.repository.ts:132` — `ilike(users.name, '%${options.search}%')` and `ilike(users.email, '%${options.search}%')` (inline, no escape — **note: TWO ilike calls on this line, both need wrapping**)
  5. `backend/db/repo/parents/parent.repository.ts:654` — `const searchPattern = '%${input.search}%'` (~~plan originally said line 653~~ — **corrected to line 654**)
  6. `backend/db/repo/billing/quota.repository.ts:358` — `const searchPattern = '%${filter.search}%'` → used in `sql` template: `${quotas.name} ILIKE ${searchPattern}` at line 358 (~~plan originally said line 404, then corrected to 357~~ — **actual line is 358**)
  7. `backend/db/repo/users/user.repository.ts:196` — `ilike(users.name, '%${trimmedSearch}%')` and `ilike(users.email, '%${trimmedSearch}%')` (inline, no escape — **note: TWO ilike calls** — ~~plan originally said line 208~~ — **corrected to line 196**)

> **Implementation note**: Sites 1, 2, 6 use SQL template tags (`sql\`... ILIKE ${searchPattern}\``) — wrap the `searchPattern` variable assignment with `escapeLikeWildcards()`. Sites 3, 4, 5, 7 use either the `ilike()` function or a mix — for `ilike()` calls, wrap the search string argument. For site 3, wrapping the `searchPattern` variable (line 101) covers all 3 downstream `ilike()` calls. For sites 4 and 7, the search string is inline in each `ilike()` call, so each needs individual wrapping (or extract into a shared escaped variable first).
- **Layer**: `backend/db/repo/`
- **Problem**: User-supplied search input is interpolated directly into LIKE/ILIKE patterns without escaping `%` and `_` wildcards. A malicious search string like `%admin%` or `_` can bypass intended search semantics or cause performance issues.
- **Fix**: Wrap user search input with `escapeLikeWildcards()` from `@/backend/utils`.
- **Established pattern**: `escapeLikeWildcards` is already used in 5 repositories:
  - `backend/db/repo/complaints/complaint.repository.ts:31` — `ilike(users.name, '%${escapeLikeWildcards(options.search)}%')`
  - `backend/db/repo/teachers/teacher.repository.ts:112,129,130` — same pattern
  - `backend/db/repo/teachers/teacher-availability.repository.ts:520` — `const escapedSearch = escapeLikeWildcards(teacherNameSearch.trim())`
  - `backend/db/repo/parents/suggestion.repository.ts:160,338` — same
  - `backend/db/repo/storage/storage.repository.ts:100` — `escapeLikeWildcards(parentPath) + "/%"`
  - ~~`cron.repository.ts:184`~~ — **DOES NOT EXIST**. The plan's original claim that `cron.repository.ts` uses `escapeLikeWildcards` is wrong — grep confirms no such usage. This site was removed from the established-pattern list.
- **Code change** (per file):
  ```ts
  // Add import (if not already present):
  import { escapeLikeWildcards } from "@/backend/utils";

  // Wrap search input:
  // Before: const searchPattern = `%${options.search}%`;
  // After:  const searchPattern = `%${escapeLikeWildcards(options.search)}%`;

  // For inline patterns:
  // Before: ilike(users.name, `%${trimmedSearch}%`)
  // After:  ilike(users.name, `%${escapeLikeWildcards(trimmedSearch)}%`)
  ```
- **i18n**: No user-facing messages.
- **Types**: No new types.

---

## MEDIUM Severity

### M1 — `DEFAULT_SEED_ADMIN_PASSWORD` fallback used for all demo roles

- **File**: `shared/demo-users.ts`
- **Lines**: 17, 19-28, and all `plainPassword: DEFAULT_SEED_ADMIN_PASSWORD` references (lines 46, 57, 67, 77, 87, 97)
- **Layer**: `shared/`
- **Problem**: When `IS_DEMO` or `TEST_SERVER` is enabled, `resolveAdminPassword()` falls back to a hardcoded default `"Seed_Pass1!"` for dev/test. All non-superadmin demo users (academy admin, teacher, supervisor, staff, student, parent) always use `DEFAULT_SEED_ADMIN_PASSWORD` directly — no env-var override. In a demo deployment, an attacker who knows the source code knows all demo passwords.
- **Fix**: Require explicit `ADMIN_PASSWORD` when `IS_DEMO` or `TEST_SERVER` is set. If neither is set in production, throw (already handled by `resolveAdminPassword` production guard).
- **Layer constraint**: `shared/` MUST NOT import from `@/backend/**` or `@/app/**`. Must use raw `process.env` — do NOT import `getBooleanEnv` from `@/backend/lib/env`.
- **Code change**:
  ```ts
  // Replace lines 17-28:
  export const DEFAULT_SEED_ADMIN_PASSWORD = process.env.DEFAULT_SEED_ADMIN_PASSWORD ?? ["Seed", "Pass1!"].join("_");

  function resolveAdminPassword(): string {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminPassword) return adminPassword;

    const nodeEnv = process.env.NODE_ENV ?? "development";
    const isDemoOrTest = process.env.IS_DEMO === "true" || process.env.TEST_SERVER === "true";

    if (nodeEnv === "production" || isDemoOrTest) {
      throw new Error("ADMIN_PASSWORD env var is required when IS_DEMO or TEST_SERVER is enabled or in production");
    }
    return DEFAULT_SEED_ADMIN_PASSWORD;
  }
  ```
- **Note**: All non-superadmin demo users use `DEFAULT_SEED_ADMIN_PASSWORD` — the fix makes them use `resolveAdminPassword()` too, so all demo passwords require `ADMIN_PASSWORD` in demo/test mode.
- **⚠️ CRITICAL RISK — Test server crash**: `frontend/common/graphql/test/testServer.ts:30-31` sets `IS_DEMO: "true"` and `TEST_SERVER: "1"` but does NOT set `ADMIN_PASSWORD`. After this fix, the test server will **crash on boot** with "ADMIN_PASSWORD env var is required". **Must add `ADMIN_PASSWORD: "TestAdminPass1!"` to `testServer.ts` env config** before this fix is applied. See Testing section for details.
- **i18n**: No — this is a startup error, not a user-facing message.
- **Types**: No new types.

---

### M2 — Public storage files served without `Content-Disposition` or extension allowlist

- **File**: `app/api/storage/files/[[...path]]/route.ts`
- **Lines**: 189-207 (public file branch), 148-171 (`buildFileResponse`)
- **Layer**: `app/`
- **Problem**: The `public/` and `avatars/` directories allow unauthenticated file access. The response sets `Content-Type` from the file extension but never sets `Content-Disposition: attachment` — browsers may render HTML/SVG files inline, causing stored XSS. There's also no extension allowlist for public files.
- **Fix**:
  1. Add `Content-Disposition: attachment` for non-image extensions in `buildFileResponse`.
  2. Add an extension allowlist for public/avatars directories.
- **⚠️ CAUTION — SVG XSS risk**: The plan's allowlist includes `"svg"` in `SAFE_PUBLIC_EXTENSIONS` AND in the inline-safe list. **SVG files can execute JavaScript when rendered inline in browsers** — this is a stored XSS vector. **Remove `"svg"` from the inline-safe list** (`isInlineSafe`). Also consider whether SVG belongs in `SAFE_PUBLIC_EXTENSIONS` at all for public/avatars directories — if SVG uploads are needed, serve them with `Content-Disposition: attachment` and `Content-Type: image/svg+xml` (which modern browsers sandbox), but never inline.
- **Code change**:
  ```ts
  // In buildFileResponse (or a new helper):
  const SAFE_PUBLIC_EXTENSIONS = new Set([
    "jpg", "jpeg", "png", "gif", "webp", // images — NO svg (XSS risk)
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", // documents
    "mp4", "webm", "mp3", "wav", // media
  ]);

  const ext = path.extname(relativePath).toLowerCase().replace(".", "");
  const isInlineSafe = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext); // NO svg
  const contentDisposition = isInlineSafe ? "inline" : "attachment";

  // In the public file branch, add extension check:
  if (!SAFE_PUBLIC_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: tErrors.file.invalidFileType }, { status: 400 });
  }

  // Add Content-Disposition header to responses:
  headers: { "Content-Disposition": contentDisposition, ... }
  ```
- **i18n**: `tErrors.file.invalidFileType` verified — exists at `shared/locale/types/errors/index.ts:94` (FileErrors), implemented in `en/errors/index.ts:162` and `ar/errors/index.ts` ✅
- **Types**: No new types.

---

### M3 — Cleanup route auth uses email-match instead of role check

- **File**: `app/api/storage/cleanup/route.ts`
- **Lines**: 48-52
- **Layer**: `app/`
- **Problem**: `authenticateAdmin` checks `user.email !== adminEmail` (email-match auth). This is fragile — the admin email env var might not match the actual admin user, or an email could change. Should use role/permission check.
- **Fix**: Replace email comparison with `isSuperAdmin` check via `PermissionsService.getUserContext(userId)`.
- **⚠️ CRITICAL — `CurrentUserProfile` does NOT have `isSuperAdmin`**: The `user` object returned by `SessionService.getCurrentUserProfile(userId)` is of type `CurrentUserProfile` (defined in `backend/types/auth/auth.types.ts:21+`), which does NOT include `isSuperAdmin`. The `isSuperAdmin` field lives on `UserPermissionContext` (defined in `backend/types/permissions/permission.types.ts:8`), returned by `PermissionsService.getUserContext(userId)`. Must call `PermissionsService.getUserContext` separately.
- **⚠️ `PermissionsService` location**: `PermissionsService` is defined in `backend/services/auth/permissions.service.ts:9` (inside `export namespace PermissionsService`). It is re-exported from `@/backend/services` barrel. The plan's `import { PermissionsService } from "@/backend/services"` is correct. **However**, note that `permission-management.service.ts` is a **different file** (`backend/services/auth/permission-management.service.ts`) — do not confuse the two. `PermissionsService.getUserContext` lives in `permissions.service.ts`, not `permission-management.service.ts`.
- **Code change**:
  ```ts
  // Replace lines 48-52 (the email-match check):
  // Before:
  const adminEmail = getEnvironmentConfig().adminEmail;
  if (!adminEmail || user.email !== adminEmail) {
    logger.warn("Unauthorized cleanup attempt - non-admin user", { userId: user.id, email: user.email });
    return NextResponse.json({ error: tErrors.forbidden }, { status: 403 });
  }

  // After:
  import { PermissionsService } from "@/backend/services";

  const permContext = await PermissionsService.getUserContext(user.id);
  if (!permContext.isSuperAdmin) {
    logger.warn("Unauthorized cleanup attempt - non-admin user", { userId: user.id });
    return NextResponse.json({ error: tErrors.forbidden }, { status: 403 });
  }
  ```
- **i18n**: Use existing `tErrors.forbidden` key — exists at `ErrorsLabels.forbidden` (top-level, line 418 in type schema), already used at line 50 of current code. ✅
- **Types**: `UserPermissionContext` from `@/backend/types/permissions/permission.types.ts:5-10` — has `isSuperAdmin: boolean`. `PermissionsService.getUserContext(userId)` returns `Promise<UserPermissionContext>`.
- **⚠️ Caution**: `getEnvironmentConfig` import may become unused — remove if no other reference in this file.

---

### M4 — `demoLogin` error code is `UNAUTHENTICATED` instead of `FORBIDDEN`

- **File**: `backend/graphql/mutation/auth/auth.mutation.ts`
- **Line**: 289 (`demoLoginNotEnabled` error code) and 307 (`demoLoginFailed` error code — leave as-is)
- **Layer**: `backend/graphql/`
- **Problem**: When `IS_DEMO` is false and a client calls `demoLogin`, the server throws `UNAUTHENTICATED` at line 289 — but the user IS authenticated (or doesn't need to be). The correct error code is `FORBIDDEN` (the operation is not allowed, not that the user isn't authenticated).
- **Fix**: Change `extensions: { code: "UNAUTHENTICATED" }` to `extensions: { code: "FORBIDDEN" }` at line 289.
- **⚠️ Also at line 307**: `demoLoginFailed` (line 307) also uses `extensions: { code: "UNAUTHENTICATED" }`. This is the error thrown when `demoLogin("super_admin")` fails (e.g., wrong password). **Decision needed**: Should this also be changed to `FORBIDDEN`? Arguments for: consistency — both are "operation not allowed" errors. Arguments against: `demoLoginFailed` means the credentials are wrong, which is closer to "unauthenticated". **Recommendation**: Leave line 307 as `UNAUTHENTICATED` (credential failure is auth-related), only change line 289 (feature disabled). Update any test asserting `UNAUTHENTICATED` on the disabled-feature path.
- **Code change**:
  ```ts
  // line 287-290:
  throw new GraphQLError(tErrors.auth.demoLoginNotEnabled, {
    extensions: { code: "FORBIDDEN" },  // ← was "UNAUTHENTICATED" at line 289
  });
  ```
- **i18n**: No change — message (`demoLoginNotEnabled`) stays the same. Error code is machine-readable, not user-facing.
- **Types**: No new types.

---

### M5 — Vercel Blob upload trusts client-supplied MIME type

- **File**: `app/api/storage/vercel-upload/route.ts`
- **Lines**: 168-183, 220-229
- **Layer**: `app/`
- **Problem**: The `contentType` from `clientPayload` (client-supplied) is passed to `StorageService.validateUpload` and to `handleUpload`'s `allowedContentTypes: [contentType]`. A client can claim `image/png` while uploading a malicious HTML file. The existing `validateUpload` in `storage.repository.ts:754-780` checks for path traversal and size but does NOT validate the MIME type against an allowlist.
- **Fix**:
  1. Add MIME type allowlist check in the vercel-upload route (or in `StorageService.validateUpload`).
  2. Pass `maximumSize` to `handleUpload` token (currently only validated server-side, not enforced by Vercel Blob).
- **Code change**:
  ```ts
  // Add MIME allowlist at the top of vercel-upload route:
  const ALLOWED_MIME_TYPES = new Set([
    "image/jpeg", "image/png", "image/gif", "image/webp", // NO image/svg+xml (XSS risk)
    "application/pdf",
    "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "video/mp4", "video/webm",
    "audio/mpeg", "audio/wav",
  ]);
  const MAX_BLOB_SIZE = 100 * 1024 * 1024; // 100MB

  // In validateUploadPayload or after parsing clientPayload, add:
  if (!ALLOWED_MIME_TYPES.has(contentType)) {
    logger.warn("Disallowed MIME type in upload request", { contentType, pathname: pathName });
    return NextResponse.json({ error: tErrors.file.invalidFileType }, { status: 400 });
  }
  if (fileSize > MAX_BLOB_SIZE) {
    return NextResponse.json({ error: tErrors.file.fileSizeExceedsMaximum(MAX_BLOB_SIZE / (1024 * 1024)) }, { status: 400 });
  }

  // In onBeforeGenerateToken, add maximumSize:
  return Promise.resolve({
    allowOverwrite: false,
    allowedContentTypes: [contentType],
    maximumSize: MAX_BLOB_SIZE,  // ← ADD THIS
    tokenPayload: JSON.stringify({ sessionId, pathname: pathName, userId }),
  });
  ```
- **i18n**: Use existing `tErrors.file.invalidFileType` and `tErrors.file.fileSizeExceedsMaximum` — verify both exist. `fileSizeExceedsMaximum` is already used in `storage.repository.ts:769`.
- **Types**: No new types.
- **⚠️ Caution**: The MIME allowlist check could also be added to `StorageDbRepository.validateUpload` (in the repo layer) for defense-in-depth. When registering new MIME validation in the service, follow the service-layer rule: error messages via `getServerTranslations(locale, "errors")`.

---

## LOW Severity

### L1 — No edge-level auth redirect middleware

- **File**: New file (either `middleware.ts` at repo root or extend `proxy.ts`)
- **Layer**: `app/` (root `AGENTS.md`)
- **Problem**: There's no middleware-level auth redirect. Unauthenticated users can navigate to any page before the page-level `withPageAuth()` guard runs. While `withPageAuth()` catches it at render time, an edge-level redirect is defense-in-depth.
- **Fix**: Add auth-cookie-existence check in `proxy.ts` (preferred — it's already the edge middleware) for protected path prefixes.
- **⚠️ CRITICAL CAUTION**: Next.js 16 uses `proxy.ts` (not `middleware.ts`) for edge middleware. The existing `proxy.ts` matcher excludes API routes (`/((?!api|_next|_vercel|.*\\..*).*)`). The auth redirect must:
  1. Be added to `proxy.ts` (NOT a separate `middleware.ts` — Next.js may not support both).
  2. Only redirect for protected page routes (not public routes like `/login`, `/api/*`, `/_next/*`).
  3. Use a lightweight cookie-existence check (not full session validation — edge runtime can't access DB).
  4. Defer full auth validation to the page-level `withPageAuth()` guard.
  5. NOT log via `console.*` — but edge middleware in `proxy.ts` currently has no logger import (commented out).
- **⚠️ Route groups**: The app uses Next.js route groups — `/(auth)/login/page.tsx` → URL `/login`, `/(dashboard)/billing/page.tsx` → URL `/billing`. Parenthesized groups are NOT part of the URL. The URL pathname in `proxy.ts` (`request.nextUrl.pathname`) is the resolved path WITHOUT parentheses.
- **⚠️ No locale-prefixed URLs**: This app uses cookie-based locale (`NEXT_LOCALE` cookie), NOT URL-prefixed routes like `/en/login`. The only auth page is `/login` (at `/(auth)/login/page.tsx`). **Do NOT prepend locale to the login URL**.
- **Code change** (extend `proxy.ts`):
  ```ts
  // Define public routes that don't require auth (only pages that actually exist):
  const PUBLIC_ROUTES = new Set(["/login", "/"]);  // only these pages exist without auth
  // Protected route prefixes (resolved URLs from actual app/(dashboard)/* pages):
  const PROTECTED_PREFIXES = ["/dashboard", "/billing", "/classes", "/complaints",
    "/cron", "/lesson-reports", "/meeting-providers", "/monthly-reports", "/parents",
    "/payment-catalogs", "/people", "/permissions", "/profile", "/quotas",
    "/recurring-schedules", "/reports", "/resources", "/search-schedule",
    "/settings", "/staff", "/students", "/subjects", "/suggestions",
    "/teacher-dues", "/teachers", "/users"];

  // In proxy function, after locale resolution, add:
  const isPublicRoute = PUBLIC_ROUTES.has(pathname) || PROTECTED_PREFIXES.every(
    prefix => !pathname.startsWith(prefix)
  );
  const hasAuthCookie = request.cookies.get("session_id") || request.cookies.get("access_token");

  if (!isPublicRoute && !hasAuthCookie) {
    const loginUrl = new URL("/login", request.url);  // NO locale prefix — app uses cookie-based locale
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
  ```
  - **⚠️ Route list verified**: The `PROTECTED_PREFIXES` list above is derived from `find /app/(dashboard) -name 'page.tsx'` — it includes ALL 27 dashboard pages. The previous version was missing `/cron`, `/feedback`, `/staff`, `/users`, `/teacher-dues`, `/profile`, `/people`, `/payment-catalogs`, `/monthly-reports`, `/quotas`, `/recurring-schedules`, `/subjects`. Note: `/(dashboard)/[...slug]/page.tsx` is a catch-all — its URL prefix is `/` + any slug, so it's already covered by the `!isPublicRoute` check (any path not in `PUBLIC_ROUTES` and not matching a prefix is treated as protected).
  - **⚠️ Auth cookies**: The app uses 3 auth cookies: `session_id` (7-day), `access_token` (15-min JWT), and `refresh_token` — verified in `backend/lib/auth/cookies.ts:39-53`. The `access_token` cookie has `httpOnly: true` but is **not** `HttpOnly` on the client side — it IS set as HttpOnly. The `session_id` cookie is the right one for edge middleware (long-lived, always present for logged-in users). Use `request.cookies.get("session_id")` as the primary check.
- **i18n**: No — redirect is a URL change, not a user-facing message.
- **Types**: No new types.

---

### L2 — IPv6 rate-limit bucket collapse

- **File**: `backend/graphql/gqlContextFactory.ts`
- **Lines**: 68-77
- **Layer**: `backend/lib/` (root `AGENTS.md`)
- **Problem**: `getIpAddress` only matches IPv4 (`IPV4_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/`). The existing code at lines 74-76 does `const parts = raw.split(":"); const ip = parts.length === 2 ? parts[0] : raw;` — this attempts to strip ports by splitting on `:` and taking the first part only when there are exactly 2 parts (i.e., IPv4:port). For IPv6 addresses (which have many `:` characters), `parts.length` is > 2, so `ip = raw` (no stripping). Then `IPV4_REGEX.test(ip)` fails for any IPv6 address, and the function falls back to `"127.0.0.1"`, collapsing all IPv6 clients into the same rate-limit bucket.
- **Fix**: Update the regex to accept IPv6 or fall back to raw string (instead of `"127.0.0.1"`).
- **⚠️ IPv6 regex risk**: The proposed `IPV6_REGEX = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/` does NOT match compressed IPv6 addresses like `::1` (localhost) or `::` (unspecified) because they have fewer than 2 colon-separated groups. Consider using a more comprehensive regex, or better yet, fall back to `raw` (the original header value) for anything that's not clearly IPv4 — this avoids the regex complexity entirely and accepts any proxy-provided IP:
- **Code change** (revised — simpler approach avoids IPv6 regex entirely):
  ```ts
  // Replace lines 68-77:
  const IPV4_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

  function getIpAddress(headersList: Headers): string {
    const forwardedFor = headersList.get("x-forwarded-for")?.split(",")[0]?.trim();
    const realIp = headersList.get("x-real-ip");
    const raw = realIp ?? forwardedFor ?? "127.0.0.1";
    // Handle IPv4:port format (e.g., "192.168.1.1:8080") — strip port
    if (raw.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/)) {
      return raw.substring(0, raw.lastIndexOf(":"));
    }
    // Accept valid IPv4
    if (IPV4_REGEX.test(raw)) return raw;
    // Accept anything else (IPv6, IPv4:port already handled) — better than collapsing to 127.0.0.1
    return raw;
  }
  ```
  This avoids the IPv6 regex pitfall entirely — any non-IPv4 value with a colon (including `::1`, `fe80::1`, `[::1]:8080`) is returned as-is. The only IPv4:port stripping happens for the clearly identifiable IPv4:port pattern. Rate-limiting on raw IPv6 strings is correct — each client has a unique address.
  - **⚠️ Existing code behavior change**: The existing code at line 75 does `parts.length === 2 ? parts[0] : raw` — for IPv4:port (`"192.168.1.1:8080"`), `parts = ["192.168.1.1", "8080"]`, `parts.length === 2` → `ip = "192.168.1.1"` → passes IPv4 regex → returned. The new code handles this case with the explicit IPv4:port regex. For IPv6 (`"::1"`), existing code: `parts = ["", "", "1"]`, `parts.length === 3` → `ip = "::1"` → fails IPv4 regex → returns `"127.0.0.1"` (BUG). New code: `raw = "::1"` → doesn't match IPv4:port regex → doesn't match IPv4 regex → returns `"::1"` (CORRECT).
- **i18n**: No.
- **Types**: No new types.

---

### L3 — `sql.raw` used with potentially unvalidated input

- **Files**:
  1. ~~`backend/services/system/reference-data.service.ts:88` — `db.execute(sql.raw('SELECT COUNT(*)::int AS count FROM "${tableName}"'))`~~ **ALREADY FIXED** — see below.
  2. `backend/services/auth/permission-management.service.ts:132,134` — `sql.raw(action)` (safe — `"ENABLE"`/`"DISABLE"` literal)
  3. `backend/services/auth/permission-management.service.ts:497` — `sql.raw('ALTER TYPE app_permission ADD VALUE IF NOT EXISTS '${key}';')` (~~plan originally said line 487~~ — **corrected to line 497**)
- **Layer**: `backend/services/`
- **Problem**: `sql.raw` interpolates strings directly into SQL without escaping. The `setSystemPermissionTrigger` `sql.raw(action)` is safe because `action` is derived from a boolean. But `getTableRowCounts(tableName)` and `ensurePermissionEnumValues(key)` accept caller-supplied values that could contain SQL injection if not validated.
- **Analysis**:
  - `setSystemPermissionTrigger`: `action = enabled ? "ENABLE" : "DISABLE"` (line 127) — **SAFE**, no fix needed.
  - `getTableRowCounts`: **ALREADY FIXED** — `reference-data.service.ts` lines 15-31 build `KNOWN_TABLES` dynamically from Drizzle schema at module load. Lines 104-114 reject unknown table names with `throw new Error(...)`. Uses `sql.identifier(tableName)` (line 119, parameterized) instead of `sql.raw`. **No code change needed — implementing the hardcoded allowlist below would be a REGRESSION** (static list vs. dynamic schema-derived one).
  - `ensurePermissionEnumValues` (line 495): `key` comes from `AppPermission` enum — **partially safe** (TS enum constrains values at compile time). Additionally, `upsertSystemPermissions` (line 518) already validates keys via `parseAppPermission(spec.key)` before calling `ensurePermissionEnumValues`. The runtime guard below is **defense-in-depth only** since both compile-time and primary validation paths already exist.
- ~~**Code change** for `getTableRowCounts`~~ (**REMOVED** — already implemented, see above).
- **Code change** for `ensurePermissionEnumValues` (defense-in-depth only — existing validation via `parseAppPermission` is the primary guard):
  ```ts
  // In permission-management.service.ts, add enum validation:
  export async function ensurePermissionEnumValues(keys: readonly AppPermission[]): Promise<void> {
    // AppPermission is already a TS enum, but add runtime guard for defense-in-depth
    const VALID_PERMISSION_KEYS = new Set(Object.values(AppPermission));
    for (const key of keys) {
      if (!VALID_PERMISSION_KEYS.has(key)) {
        throw new Error(`Invalid permission key: ${key}`);
      }
    }
    await Promise.all(
      keys.map(key => db.execute(sql.raw(`ALTER TYPE app_permission ADD VALUE IF NOT EXISTS '${key}';`)))
    );
  }
  ```
  - **⚠️ Caution**: `AppPermission` enum is defined in `backend/enum/permissions/permission.enum.ts:1` — import from `@/backend/enum` (NOT `shared/constants/`). The existing `permission-management.service.ts` already imports it via `@/backend/enum`. The runtime guard in the snippet below uses `Object.values(AppPermission)` — since `AppPermission` is already a TS enum, this is a compile-time-safe set. However, if the enum re-export is from `backend/enum`, verify the import path in the service file matches.
- **i18n**: These are internal server errors (not user-facing) — use plain `throw new Error(...)`. If user-facing, must use `getServerTranslations`.
- **Types**: No new types.

---

### L4 — `demoLogin` mutation has no rate limiting

- **File**: `backend/graphql/mutation/auth/auth.mutation.ts`
- **Lines**: 276-311
- **Layer**: `backend/graphql/`
- **Problem**: The `login` mutation (lines 188-195) uses `checkRateLimit(ipAddress, authRateLimiter)` before credential checks. The `demoLogin` mutation has no rate limiting — an attacker can brute-force demo logins to try all role slugs.
- **Fix**: Add `checkRateLimit` at the top of the `demoLogin` resolver, mirroring the `login` pattern.
- **Code change**:
  ```ts
  // At line 283, after `const tErrors = ctx.t().errorsTranslations;`:
  resolve: async (_parent, args, ctx) => {
    const tErrors = ctx.t().errorsTranslations;
    const ipAddress = ctx.ipAddress ?? "127.0.0.1";

    // Rate limit demo login attempts (same as login)
    const rateLimitResult = await checkRateLimit(ipAddress, authRateLimiter);
    if (!rateLimitResult.success) {
      throw new GraphQLError(tErrors.auth.tooManyLoginAttempts, {
        extensions: { code: "TOO_MANY_ATTEMPTS" },
      });
    }

    const isDemo = getBooleanEnv("IS_DEMO");
    // ... rest of resolver (line 286 onward)
  ```
  - **⚠️ Line number**: The plan originally said "at line 283, after `const tErrors = ctx.t().errorsTranslations;`". Verified: line 284 is the `tErrors` assignment, line 285 is `const isDemo = getBooleanEnv("IS_DEMO");`. The rate-limit code must be inserted between lines 284 and 285 (after `tErrors`, before `isDemo`).
  - **⚠️ Also wrap `checkRateLimit` in try/catch?**: The `login` mutation (line 188-195) does NOT wrap `checkRateLimit` in a try/catch — it lets exceptions propagate. Mirror that same pattern. Don't add error handling that the original doesn't have.
- **i18n**: Use existing `tErrors.auth.tooManyLoginAttempts` — already used by `login` mutation. ✅
- **Types**: No new types.
- **Imports**: `checkRateLimit` and `authRateLimiter` are already imported at lines 20. ✅

---

### L5 — `t.stringList` inputs lack per-item `maxLength`

- **Files** (input fields only, not output resolvers):
  1. `backend/graphql/pothos/storage/storage.pothos.ts:308` — `sourcePaths: t.stringList({ required: true })`
  2. `backend/graphql/pothos/storage/storage.pothos.ts:318` — `sourcePaths: t.stringList({ required: true })`
  3. `backend/graphql/pothos/storage/storage.pothos.ts:328` — `paths: t.stringList({ required: true })`
  4. ~~`backend/graphql/pothos/storage/storage.pothos.ts:143` — `contentTypes: t.stringList({ required: false })`~~ — This is an **input** but it's in the `FileMetadataInput` object type, used for creating/updating file metadata. **Verify if this field accepts user-supplied content types** — if yes, add `maxItems` here too.
  5. `backend/graphql/pothos/billing/payment-method.pothos.ts:294` — `urlAllowlist: t.stringList({ required })` (input)
  6. `backend/graphql/pothos/permissions/permission-management.pothos.ts:130` — `permissionIds: t.stringList({ required: true, directives: { constraint: { maxItems: 100 } } })` (already has `maxItems` but no per-item `maxLength`)
  7. `backend/graphql/pothos/permissions/permission-management.pothos.ts:139` — same (but `required: false`)
  8. `backend/graphql/pothos/permissions/permission-management.pothos.ts:231` — `userIds: t.arg.stringList({ required: true, directives: { constraint: { maxItems: 100 } } })` — **MISSED in original plan**. This is also an unbounded stringList input. Already has `maxItems: 100` but no per-item `maxLength`.
- **Layer**: `backend/graphql/`
- **Problem**: `t.stringList` inputs accept arrays of strings, but without per-item `maxLength`, a client can send extremely long strings, causing memory/CPU issues. The `permission-management` ones already have `maxItems: 100` but no per-item length limit.
- **Fix**: Add `directives: { constraint: { maxItems: 100, ... } }` where missing, and add per-item maxLength. Check if Pothos `@constraint` directive supports per-item `maxLength` for `stringList` — if not, validate in the resolver.
- **⚠️ CAUTION**: The `@constraint` directive may NOT support per-item constraints on `stringList`. The `graphql-constraint-directive` package typically supports `maxLength` on individual `String` fields, not on list items. Two options:
  1. **Option A**: Use `@constraint` with `maxItems` (list-level) + validate per-item `maxLength` in the resolver/service.
  2. **Option B**: Convert `t.stringList` to `t.listOf(t.string({ directives: { constraint: { maxLength: 500 } } }))` if supported.
- **Code change** (Option A — most likely correct for this codebase):
  ```ts
  // For storage stringLists (add maxItems if missing + resolve-level per-item validation):
  sourcePaths: t.stringList({ required: true, directives: { constraint: { maxItems: 100 } } }),
  paths: t.stringList({ required: true, directives: { constraint: { maxItems: 100 } } }),

  // For payment-method urlAllowlist (add maxItems if missing):
  urlAllowlist: t.stringList({ required, directives: { constraint: { maxItems: 50 } } }),

  // For permission-management (already has maxItems: 100 — no code change needed,
  // per-item maxLength should be validated in the resolver/service)
  ```
  - Add per-item `maxLength` validation in the relevant service methods (e.g., reject paths/URLs exceeding 500 chars).
- **i18n**: Use existing `tErrors.invalidInput` or service-level validation error messages.
- **Types**: No new types.
- **⚠️ Non-blocking**: This is a defense-in-depth issue. The `@constraint` directive already enforces `maxItems` where added. Adding per-item `maxLength` is a nice-to-have but not critical.

---

## Risks

This section consolidates all risks identified during plan refinement. Each risk is rated by severity (🔴 HIGH = blocks implementation if unaddressed, 🟡 MEDIUM = requires planning, 🟢 LOW = awareness only).

### R1 — 🔴 H3 circular bootstrap problem (blocks ~40 GraphQL test suites)

- **Fix**: H3 (`ensureDemoUsers` `authScopes`)
- **Description**: `ensureDemoUsers` provisions the super admin. Tests call it in `beforeAll` → then `demoLogin` to get a token. Adding `authScopes: { loggedIn: true }` creates a circular dependency (need token to call `ensureDemoUsers`, need `ensureDemoUsers` to provision user to get token).
- **Impact**: ~40 GraphQL test suites under `frontend/common/graphql/test/**/*.test.ts` will break — they call `setupTestServerLifecycle()` → `ensureDemoUsersForTests()` which calls the `ensureDemoUsers` mutation without a token.
- **Mitigation**: Restructure test lifecycle to seed super admin via direct DB/repository call (bypassing GraphQL), then `demoLogin`, then `ensureDemoUsers` with token. See Testing section (H3 entry) for detailed migration steps.
- **Owner**: Must be done as part of H3 implementation, NOT as a separate fix.

### R2 — 🔴 M1 test server crash (blocks all GraphQL + integration tests)

- **Fix**: M1 (`ADMIN_PASSWORD` env requirement)
- **Description**: `frontend/common/graphql/test/testServer.ts:30-31` sets `IS_DEMO: "true"` and `TEST_SERVER: "1"` but does NOT set `ADMIN_PASSWORD`. After M1, `resolveAdminPassword()` throws on boot.
- **Impact**: Test server fails to start → all GraphQL integration tests and provider integration tests that depend on the test server will fail.
- **Mitigation**: Add `ADMIN_PASSWORD: "TestAdminPass1!"` to `testServer.ts` env config **before** applying M1. Also update `.env.test` or CI env if applicable.

### R3 — 🟡 H2 bare `randomUUID()` passwords in GraphQL tests

- **Fix**: H2 (password complexity)
- **Description**: `teacher-onboarding.test.ts:31,231` use bare `randomUUID()` as password — UUID is all-lowercase hex, no uppercase, no special char. Fails the new complexity rules.
- **Impact**: 2 GraphQL test suites break.
- **Mitigation**: Replace bare `randomUUID()` with `generateTestPassword()` or `"TestPass-${randomUUID().slice(0, 8)}!"`.
- **Confirmed safe**: All backend service tests using `generateTestPassword()`, and `student-onboarding.test.ts` / `parent-onboarding.test.ts` / `manager-onboarding.test.ts` using `Pwd_${randomUUID()}` pattern.

### R4 — 🟡 L4 rate-limit flakiness in parallel test execution

- **Fix**: L4 (`demoLogin` rate limiting)
- **Description**: If `demoLogin` gets rate-limited by IP address and multiple test suites run in parallel on the same test server, suites that call `demoLogin` rapidly may hit the rate limit and fail spuriously.
- **Impact**: Intermittent test failures in parallel test runs.
- **Mitigation**: Configure `TEST_SERVER` env to either (a) disable rate limiting for L4, (b) use a much higher limit, or (c) use a per-test nonce in the IP address. Check how the existing `login` rate limit (lines 185-195) is handled in tests — follow the same pattern.

### R5 — 🟡 M5 Blob upload validation bypassed in test mocks

- **Fix**: M5 (Vercel Blob MIME allowlist + `maximumSize`)
- **Description**: If tests mock `handleUpload` or the Vercel Blob API, the new `onBeforeGenerateToken` validation may not be exercised. Tests may pass while production is unprotected.
- **Impact**: False green tests.
- **Mitigation**: Tests for M5 must call the actual `onBeforeGenerateToken` callback or the real route handler, not a mocked upload function. Verify that `validateUpload` is invoked with the client-supplied `contentType` and rejects disallowed MIME types.

### R6 — 🟢 M2 SVG XSS — plan originally included SVG in inline-safe list

- **Fix**: M2 (public storage files)
- **Description**: The original plan snippet listed `"svg"` in both `SAFE_PUBLIC_EXTENSIONS` and the inline-safe list. SVG can execute JavaScript when rendered inline — a stored XSS vector.
- **Status**: **FIXED in this refinement** — SVG removed from inline-safe list. Also removed from `SAFE_PUBLIC_EXTENSIONS` entirely for public/avatars directories.
- **Mitigation**: If SVG uploads are needed, serve with `Content-Disposition: attachment` + `Content-Type: image/svg+xml`.

### R7 — 🟢 M4 `demoLoginFailed` error code ambiguity

- **Fix**: M4 (error code `UNAUTHENTICATED` → `FORBIDDEN`)
- **Description**: The original plan only addressed line 289 (`demoLoginNotEnabled`). Line 307 (`demoLoginFailed`) also uses `UNAUTHENTICATED`. This is the "wrong password" case, which is arguably auth-related.
- **Status**: **Addressed in this refinement** — leave line 307 as `UNAUTHENTICATED` (credential failure is auth-related), only change line 289 (feature disabled).

### R8 — 🟢 M3 `CurrentUserProfile` does not have `isSuperAdmin` (plan-review violation, already flagged)

- **Fix**: M3 (cleanup route email-match → `isSuperAdmin`)
- **Description**: The M3 code snippet at line 224 uses `user.isSuperAdmin` — but `CurrentUserProfile` does not have this field. It lives on `UserPermissionContext` (via `PermissionsService.getUserContext(userId)`).
- **Status**: **Known from prior plan-review**. Fix: call `PermissionsService.getUserContext(userId)` separately after verifying the token, check `permContext.isSuperAdmin`.

### R9 — 🟢 L3 `getTableRowCounts` already implemented (plan would regress)

- **Fix**: L3 (`sql.raw` allowlist)
- **Description**: The original plan proposed a hardcoded `KNOWN_TABLES` allowlist for `getTableRowCounts`. The actual code already has a **dynamic schema-derived** `KNOWN_TABLES` (built from Drizzle schema at module load, lines 15-31) and uses `sql.identifier(tableName)` (parameterized, not `sql.raw`). The hardcoded proposal would be a regression.
- **Status**: **FIXED in this refinement** — the `getTableRowCounts` fix has been removed from the plan. `ensurePermissionEnumValues` defense-in-depth guard remains (acknowledging existing `parseAppPermission` validation).

### R10 — 🟡 L1 phantom public routes + wrong locale-prefix logic

- **Fix**: L1 (edge auth redirect)
- **Description**: The original plan listed `/unauthenticated`, `/forgot-password`, `/reset-password` in `PUBLIC_ROUTES` — **none of these pages exist** in the app (verified: only `/login` exists under `/(auth)/`). The plan also used `localePrefix = locale === "ar" ? "/ar" : "/en"` to construct the login redirect URL — but **this app uses cookie-based locale, NOT locale-prefixed URLs**. `/en/login` and `/ar/login` do not resolve to any page. The login URL is just `/login`.
- **Impact**: L1 redirect would (a) allow phantom routes through and (b) redirect to `/en/login` which 404s instead of `/login` — breaking the auth redirect entirely for every unauthenticated user.
- **Status**: **FIXED in this refinement** — `PUBLIC_ROUTES` now only contains routes that actually exist (`/login`, `/`), `PROTECTED_PREFIXES` uses resolved URL paths, and login URL is `/login` with no locale prefix.

### R11 — 🟡 L2 proposed IPv6 regex misses `::1` (most common IPv6 loopback)

- **Fix**: L2 (IPv6 rate-limit bucket collapse)
- **Description**: The original plan's `IPV6_REGEX = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/` doesn't match compressed IPv6 like `::1` or `fe80::1` (which have `::` — a double-colon representing one or more omitted groups). These addresses would fail the regex, fall through to the `IPV4_REGEX` check, also fail, and then fall back to `raw` — so the final code path is correct by accident, but the IPv6 regex check is dead code for the most common IPv6 formats, giving a false sense of validation.
- **Impact**: IPv6 addresses with `::` compression (including PureIPv6 localhost `::1`) skip the regex match but still reach the `return raw` fallback — correct behavior, but if someone later "fixes" the fallback to reject unknown formats, these addresses would collapse back to a shared bucket.
- **Status**: **FIXED in this refinement** — the revised code eliminates the IPv6 regex entirely. It only strips ports from the clearly identifiable IPv4:port pattern, and returns any other value as-is. This is simpler, correct, and avoids the regex pitfall.

### R12 — 🟢 M5 SVG in MIME allowlist (same XSS risk as M2)

- **Fix**: M5 (Vercel Blob upload MIME allowlist)
- **Description**: The first refinement pass removed SVG from M2's extension allowlist, but **missed M5's MIME type allowlist** — the original `ALLOWED_MIME_TYPES` included `image/svg+xml`. An SVG uploaded via Vercel Blob and served inline could execute JavaScript (stored XSS via blob URL, though on a different origin).
- **Impact**: Low (Vercel Blob URLs are on a separate domain, same-origin policy mitigates), but still defense-in-depth.
- **Status**: **FIXED in this refinement** — `image/svg+xml` removed from `ALLOWED_MIME_TYPES` in the M5 code snippet.

### R13 — 🟡 H4 wrong line numbers in 2 of 7 sites

- **Fix**: H4 (unescaped LIKE wildcards)
- **Description**: The plan listed incorrect line numbers for two H4 sites:
  - `quota.repository.ts`: Plan said line 404, **actual is line 358** (~~first corrected to 357~~, then to **358** in R19).
  - `users/user.repository.ts`: Plan said line 208, **actual is line 196**.
  - Also, two sites have **TWO `ilike()` calls on the same line** (both needing wrapping):
    - `parent.repository.ts:132` — `ilike(users.name, ...)` AND `ilike(users.email, ...)`
    - `user.repository.ts:196` — `ilike(users.name, ...)` AND `ilike(users.email, ...)`
- **Impact**: An implementer using the plan's line numbers would edit the wrong lines, missing the actual vulnerabilities.
- **Status**: **FIXED in this refinement** — line numbers corrected, both `ilike` calls noted. See R19 for further corrections to additional sites.

### R14 — 🟡 L3 wrong line number for `ensurePermissionEnumValues`

- **Fix**: L3 (`sql.raw` enum validation)
- **Description**: Plan said `ensurePermissionEnumValues` is at line 487 — **actual is line 497**. Plan also said `upsertSystemPermissions` validates at lines 510-514 — **actual is line 518**. Additionally, the plan's caution note said "check `backend/enum/` or `shared/constants/`" for the `AppPermission` enum — it's definitely in `backend/enum/permissions/permission.enum.ts:1`.
- **Impact**: Low (implementer would still find the function by name), but plan accuracy matters for review.
- **Status**: **FIXED in this refinement** — line numbers corrected, import path confirmed as `@/backend/enum`.

### R15 — 🟡 M3 wrong line number and incomplete `PermissionsService` location info

- **Fix**: M3 (cleanup route auth)
- **Description**: Plan said "replace lines 47-51" — **actual email-match check is at lines 48-52** (line 47 is the closing `}` of the `user` null check). Also, the plan didn't note that `PermissionsService` lives in `permissions.service.ts` (not `permission-management.service.ts`) — these are two different files in the same directory, and confusing them would lead to editing the wrong file.
- **Impact**: Implementer might edit line 47 (wrong — that's the closing brace of the null check) and might look for `getUserContext` in the wrong file.
- **Status**: **FIXED in this refinement** — line range corrected to 48-52, `PermissionsService` file location documented.

### R16 — 🟢 L1 `PROTECTED_PREFIXES` list was incomplete (12 routes missing)

- **Fix**: L1 (edge auth redirect)
- **Description**: The 2nd-pass `PROTECTED_PREFIXES` list had 19 entries but the actual `app/(dashboard)/` directory has 27 page routes. Missing from the list: `/cron`, `/staff`, `/users`, `/teacher-dues`, `/profile`, `/people`, `/payment-catalogs`, `/monthly-reports`, `/quotas`, `/recurring-schedules`, `/subjects`, and the `[...slug]` catch-all (which maps to any unmatched path under `/`). Additionally, the list included `/feedback` and `/schedule` — **neither of these routes exist** in the app (no `page.tsx` found). `/feedback` was phantom, and `/schedule` doesn't exist (the actual route is `/search-schedule`).
- **Impact**: 12 real dashboard routes would not be protected by the edge redirect, and 2 phantom routes were in the allowlist (harmless but incorrect).
- **Status**: **FIXED in this refinement** — `PROTECTED_PREFIXES` now lists all 27 actual dashboard routes, phantom routes removed, catch-all noted.

### R17 — 🟢 L5 missed `userIds` input field and `contentTypes` input

- **Fix**: L5 (stringList `maxItems`/`maxLength`)
- **Description**: The plan listed 6 `stringList` input sites but missed:
  - `permission-management.pothos.ts:231` — `userIds: t.arg.stringList({ required: true, directives: { constraint: { maxItems: 100 } } })` — an input field accepting user IDs. Already has `maxItems: 100` but no per-item `maxLength`. An attacker could send 100 UUIDs of 10KB each.
  - `storage.pothos.ts:143` — `contentTypes: t.stringList({ required: false })` — an input in `FileMetadataInput`. **No `maxItems` at all**. Needs both `maxItems` and per-item validation.
- **Impact**: 2 additional input fields left unbounded.
- **Status**: **FIXED in this refinement** — both fields added to the L5 file list.

### R18 — 🟢 H4 established-pattern list had phantom `cron.repository.ts` reference

- **Fix**: H4 (unescaped LIKE wildcards)
- **Description**: The plan's "established pattern" list claimed `cron.repository.ts:184` uses `escapeLikeWildcards` — **grep confirms NO such usage exists**. The actual `escapeLikeWildcards` usage is in 5 repos (complaint, teacher, teacher-availability, suggestion, storage), not 6+. Also, all repository paths have been corrected to fully-qualified paths (e.g., `backend/db/repo/storage/storage.repository.ts:100` instead of just `storage.repository.ts:100`).
- **Impact**: Low — the phantom citation was used to justify the pattern, but the pattern is still valid (5 real examples exist).
- **Status**: **FIXED in this refinement** — phantom `cron.repository.ts` removed, count changed from "6+" to "5", all paths fully qualified.

### R19 — 🟡 H4 line numbers for 4 of 7 sites were off by 1-11 lines

- **Fix**: H4 (unescaped LIKE wildcards)
- **Description**: A fourth-pass grep of each H4 site against actual source code revealed multiple line-number errors:
  - Site 1 (`recurring-schedule.repository.ts`): plan said **226**, the `searchPattern` assignment is at line **226** — ✅ correct. But the ILIKE usage is at line **227** (not documented).
  - Site 2 (`reschedule-tracking.utils.ts`): plan said **23**, actual `searchPattern` assignment is at line **23** — ✅ correct. But the ILIKE usage is at line **26** (not documented).
  - Site 3 (`daily-schedule.utils.ts`): plan said **101**, actual `searchPattern` assignment is at line **101** — ✅ correct. But three `ilike()` calls span lines **112-114** (not documented).
  - Site 5 (`parent.repository.ts:653`): plan said **653**, actual is **654** — **off by 1**.
  - Site 6 (`quota.repository.ts:357`): plan said **357** (previously "corrected" from 404), actual is **358** — **off by 1**.
  - Site 7 (`user.repository.ts:196`): ✅ correct.
  - Site 4 (`parent.repository.ts:132`): ✅ correct.
- **Key finding** (not previously documented): Sites 1, 2, 6 use `sql\`... ILIKE ${searchPattern}\`` (SQL template tags), while sites 3, 4, 5, 7 use the `ilike()` Drizzle function. The fix approach differs:
  - For SQL template tags: wrap the `searchPattern` variable assignment (one change covers all downstream usages).
  - For `ilike()` function calls: wrap each inline search argument individually (or extract a shared escaped variable first).
- **Impact**: Medium — wrong line numbers would cause confusion during implementation, but all file paths are correct so the implementor can locate the code. The missing pattern-type distinction (SQL template vs `ilike()`) is more impactful.
- **Status**: **FIXED in this refinement** — all line numbers verified against source, ILIKE usage lines documented, implementation note added distinguishing SQL template vs `ilike()` fix approaches.

---

## Testing

This section maps each fix to affected existing test files, what will break, and new tests to add. **UI tests (`test/ui/**`) are excluded** per scope.

### Test conventions (from AGENTS.md)

- **Database tests** (`backend/db/test/**`): MUST use `runInRollback` wrapper, pass `tx` to ALL repository methods, NEVER use `expect(...).rejects.toThrow()` inside `runInRollback` (use try/catch helper pattern), NEVER query seed data (use `entity-setup.ts` helpers).
- **GraphQL integration tests** (`frontend/common/graphql/test/**`): Use `testClient` from `helpers.ts` (not raw `fetch`), start a dev server via `setupTestServerLifecycle`, use `authenticatedRequest` for authed calls, `assertOperationDenied` for denial assertions.
- **Service tests** (`backend/services/**/test/`): Use `runInRollback` if touching the DB; mock external services.
- **Run command for database tests**: `bun run scripts/run-test/run-test.ts <test-path>` (NOT raw `bun test` — captures deadlocks/transaction issues).
- **Run command for GraphQL tests**: `bun run test:graphql` (dev server) or `bun run scripts/run-test/run-test.ts <test-path>`.

---

### H1 — `recurringSchedules` query `authScopes`

- **Existing tests at risk**: None. `recurringSchedulesQueryDocument` exists in `frontend/common/graphql/sharedDocuments/scheduling/recurring-schedule.documents.ts:31` but **no test file imports it** (verified via grep).
- **Repository tests unaffected**: `backend/db/test/repo/scheduling/scheduling-recurring.repository.test.ts` tests `findById`, soft-delete, day-rows — does NOT exercise the GraphQL query's auth path.
- **Integration tests unaffected**: `frontend/common/graphql/test/scheduling/schedule.test.ts` tests `dailyScheduleList`, `teacherWeeklyScheduleGrid`, `createRecurringClass` — does NOT query `recurringSchedules`.
- **What will break**: Nothing.
- **New tests to add**: Add an unauthenticated-access test in `frontend/common/graphql/test/scheduling/schedule.test.ts` — call `recurringSchedules` query without auth headers, assert `UNAUTHENTICATED` error code (mirroring `auth.test.ts:167-185` pattern for `me` query).

---

### H2 — Password complexity regex checks

- **Existing tests at risk**:
  - `backend/services/auth/test/admin-reset-password.service.test.ts:169-173` — `runErrorTest({ type: "validation", newPassword: "short" }, tErrors.auth.passwordMinLength, …)`. Password `"short"` (length 5) still fails `passwordMinLength` (length < 8) **before** reaching complexity checks → **still passes** ✅. However, the test should be updated to also cover the new complexity errors.
  - `frontend/common/graphql/test/auth/admin-password.test.ts:30-37, 68-113` — success-path tests use a `testPassword` value. **If `testPassword` lacks uppercase/lowercase/digit/special char, the success tests will FAIL** with a new complexity error. Must audit and update `testPassword` to meet all 4 new rules (e.g., `"TestPass123!"`).
  - Onboarding suites that set passwords via `adminResetPassword` or `completeSignup`: `frontend/common/graphql/test/students/student-onboarding.test.ts`, `teachers/teacher-onboarding.test.ts`, `parents/parent-onboarding.test.ts`, `teachers/manager-onboarding.test.ts` — audit all password values used in success paths.
- **What will break**: Any success-path test using a password that doesn't meet the new complexity rules (uppercase + lowercase + digit + special char + min length). The `"short"` negative test still passes (fails on length first).
- **Audit results** (verified during refinement):
  - ✅ SAFE: `admin-password.test.ts:57` uses `generateTestPassword()` → `"TestPass-XXXXXXXX!"` (has upper P, lower est, digit, special `-!`)
  - ✅ SAFE: `student-onboarding.test.ts:19,49` uses `Pwd_${randomUUID()}` (upper P, lower wd, digit, special `_`)
  - ✅ SAFE: `parent-onboarding.test.ts:30,67` uses `Pwd_${randomUUID()}`
  - ✅ SAFE: `manager-onboarding.test.ts:29` uses `Pwd_${randomUUID()}`
  - ✅ SAFE: All backend service tests (`admin-reset-password`, `user-onboarding`, `teacher-onboarding`, `parent-onboarding`, `general-user-onboarding`) use `generateTestPassword()`
  - ❌ WILL BREAK: `teacher-onboarding.test.ts:31,231` use bare `randomUUID()` (all lowercase hex, no uppercase, no special char) — **must fix**
- **New tests to add** in `backend/services/auth/test/admin-reset-password.service.test.ts` — 4 new error-case tests:
  1. Password missing uppercase → throws `tErrors.auth.passwordRequiresUppercase`
  2. Password missing lowercase → throws `tErrors.auth.passwordRequiresLowercase`
  3. Password missing digit → throws `tErrors.auth.passwordRequiresDigit`
  4. Password missing special char → throws `tErrors.auth.passwordRequiresSpecialChar`

---

### H3 — `ensureDemoUsers` mutation `authScopes` ⚠️ HIGH IMPACT

- **Existing tests at risk**: **~40 GraphQL integration test suites** — ALL suites that call `setupTestServerLifecycle()`:
  - `frontend/common/graphql/test/helpers.ts:52-61` — `attemptEnsureDemoUsers()` calls `ensureDemoUsersMutationDocument` **with NO auth token**
  - `frontend/common/graphql/test/lifecycle.ts:43` — `await ensureDemoUsersForTests()` runs in `beforeAll` of every suite calling `setupTestServerLifecycle()`
  - Affected suites (non-exhaustive): `auth/auth.test.ts`, `auth/admin-password.test.ts`, `auth/impersonation.test.ts`, `billing/billing-management.test.ts`, `billing/payment-method.test.ts`, `classes/group-class.test.ts`, `classes/class-session.test.ts`, `classes/class-instance-detail.test.ts`, `complaints/complaint.test.ts`, `meeting/meeting-config.test.ts`, `notifications/notification-preferences.test.ts`, `parents/parent.test.ts`, `parents/parent-onboarding.test.ts`, `parents/parent-portal.test.ts`, `permissions/permission-group-simulation.test.ts`, `profile/profile.test.ts`, `reports/report.test.ts`, `resources/learning-resource-graphql.test.ts`, `scheduling/schedule.test.ts`, `settings/*.test.ts` (6 files), `students/*.test.ts` (6 files), `suggestions/suggestion.test.ts`, `teachers/*.test.ts` (5 files), `translations/translation.test.ts`, `users/general-user-create.test.ts`
- **What will break**: **EVERY suite's `beforeAll`** — adding `authScopes: { loggedIn: true }` rejects the unauthenticated `ensureDemoUsers` call, causing `provisionDemoUsers()` (helpers.ts:58-66) to throw `"ensureDemoUsers returned false"` or a GraphQL `UNAUTHENTICATED` error.
- **Required test-infra change** (NOT a new test — a fix to the test harness forced by H3):
  - Update `frontend/common/graphql/test/helpers.ts` `attemptEnsureDemoUsers()` to first obtain a valid super-admin token (e.g., via a bootstrap mechanism that doesn't require `ensureDemoUsers`), then send that token with the `ensureDemoUsers` mutation call.
  - **Challenge**: The current bootstrap flow is circular — `ensureDemoUsers` provisions the demo super admin, then `demoLogin("super_admin")` gets a token. If `ensureDemoUsers` now requires auth, the bootstrap must use a different mechanism:
    - **Option A**: Seed a super admin via `backend/db/seeds/` before tests start (server startup seed), then `demoLogin("super_admin")` to get the token, then call `ensureDemoUsers` with that token.
    - **Option B**: Add a server-side test-only bootstrap endpoint that provisions demo users without GraphQL auth (gated by `isTestHelperEnabled()`).
    - **Option C**: Use the existing `test-helper.mutation.ts` sibling mutations (`cleanupTestEntities`, `cleanupTestGroupClass`, etc.) — these already have `authScopes: { loggedIn: true }` and tests already send super-admin tokens for them. The harness already obtains a super-admin token via `demoLogin` after `ensureDemoUsers` succeeds. The fix must restructure the bootstrap to seed the super admin first (via DB seed or a non-authed path), then `demoLogin`, then `ensureDemoUsers` with token.
  - **Recommended**: Option A — verify the seed system already creates a super admin on server start in test mode. If so, `demoLogin("super_admin")` works without `ensureDemoUsers`, and the harness can call `ensureDemoUsers` with the token. If not, add a seed step.
- **New tests to add**: No new test file — but add a test in `frontend/common/graphql/test/auth/auth.test.ts` asserting `ensureDemoUsers` mutation returns `UNAUTHENTICATED` when called without a token (after the harness fix is in place).

---

### H4 — `escapeLikeWildcards()` in 7 repository search sites

- **Existing tests at risk**:
  - `backend/db/test/repo/parents/parent.repository.test.ts:357-377` — `getParentDirectory({ search: "Dir Parent" })` and `{ search: "Dir Parent A" }` — uses plain alphanumeric strings → `escapeLikeWildcards()` is transparent → **still passes** ✅
  - ~~`backend/db/test/repo/billing/quota.repository.test.ts`~~ — NO search/filter test found
  - ~~`backend/db/test/repo/user.repository.test.ts`~~ — only tests `updateDisplayCurrency`, NO search test
  - `backend/db/test/repo/scheduling/scheduling-recurring.repository.test.ts` — tests `findById`, soft-delete, day-rows; does NOT exercise the search branch at `recurring-schedule.repository.ts:226`
  - `backend/db/repo/scheduling/scheduling-queries.repository.helpers.test.ts` — need to verify coverage of `reschedule-tracking.utils.ts:23` and `daily-schedule.utils.ts:101`
- **What will break**: Nothing — `escapeLikeWildcards()` is transparent for plain alphanumeric search strings.
- **New tests to add** in the affected repository test files — add search-wildcard tests verifying `%` and `_` are escaped (treated as literals, not wildcards):
  - `parent.repository.test.ts`: search for `"Dir Parent%"` and `"Dir_Parent"` — assert exact-match behavior (no wildcard expansion)
  - `quota.repository.test.ts`: add a search test with `%`/`_` in the query
  - `user.repository.test.ts`: add a search test with `%`/`_` in the query
  - `scheduling-recurring.repository.test.ts`: add a search test exercising `recurring-schedule.repository.ts:226` with `%`/`_`

---

### M1 — Require `ADMIN_PASSWORD` for IS_DEMO/TEST_SERVER

- **Existing tests at risk**:
  - `backend/lib/test-helper-gate.test.ts` — tests `isTestHelperEnabled` using `TEST_SERVER` env, does NOT touch `ADMIN_PASSWORD` or import `shared/demo-users.ts` → **safe** ✅
  - `backend/lib/bootstrap-gate.test.ts` — tests `isSeedWriteAllowed` with `TEST_SERVER` env, does NOT import `shared/demo-users.ts` → **safe** ✅
  - `backend/lib/cron-auth.test.ts:34` — `adminPassword: process.env.ADMIN_PASSWORD ?? process.env.PATH ?? …` (cosmetic fallback). Mocks `@/backend/lib`, not `@/shared/demo-users` → **likely safe**. BUT: if `shared/demo-users.ts` throws on import when `IS_DEMO=true` without `ADMIN_PASSWORD`, any test that transitively imports it will fail on module load.
  - `frontend/common/graphql/test/testServer.ts:30` — sets `IS_DEMO: "true"` → if the test server startup imports `shared/demo-users.ts` and `ADMIN_PASSWORD` is not set, the server will crash on boot.
  - **Mitigation**: Ensure `ADMIN_PASSWORD` is set in `testServer.ts` env config (or in the test bootstrap script).
- **What will break**: Any test bootstrap that imports `shared/demo-users.ts` while `IS_DEMO`/`TEST_SERVER` is set without `ADMIN_PASSWORD` will throw on module load. The GraphQL integration test server (`testServer.ts`) is the primary risk.
- **Required test-infra change**: Set `ADMIN_PASSWORD` in `frontend/common/graphql/test/testServer.ts` env config (alongside the existing `IS_DEMO: "true"` line).
- **New tests to add**: Create `shared/test/demo-users.test.ts` (or `backend/lib/demo-users.test.ts`) — unit test for `resolveAdminPassword()`:
  1. Throws when `IS_DEMO=true` without `ADMIN_PASSWORD`
  2. Throws when `TEST_SERVER=true` without `ADMIN_PASSWORD`
  3. Returns env value when `ADMIN_PASSWORD` is set
  4. Returns fallback when neither `IS_DEMO` nor `TEST_SERVER` is set

---

### M2 — `Content-Disposition` + extension allowlist for public files

- **Existing tests at risk**: None — no `route.test.ts` exists in `app/api/storage/files/` directory.
- **What will break**: Nothing (no test coverage).
- **New tests to add**: Create `app/api/storage/files/[[...path]]/route.test.ts`:
  1. Public image (`.png`, `.jpg`) returns `Content-Disposition: inline`
  2. Public HTML/SVG returns `Content-Disposition: attachment`
  3. Disallowed extension (e.g., `.exe`, `.js`) returns 400 `invalidFileType`
  4. Allowed extension with `download` query param returns `Content-Disposition: attachment`

---

### M3 — Cleanup route `isSuperAdmin` check

- **Existing tests at risk**: None — no `route.test.ts` exists for `app/api/storage/cleanup/`.
- **What will break**: Nothing (no test coverage). Note: `route.ts:42` calls `SessionService.getCurrentUserProfile(userId)` and checks `user.email !== adminEmail` at line 49. The fix replaces lines 48-52 with `PermissionsService.getUserContext(user.id)` to check `isSuperAdmin` — but `CurrentUserProfile` does NOT have `isSuperAdmin` (see M3 violation in plan-review). The fix must call `PermissionsService.getUserContext(userId)` to get `isSuperAdmin`.
- **New tests to add**: Create `app/api/storage/cleanup/route.test.ts`:
  1. Super admin succeeds (200)
  2. Non-admin gets 403
  3. Unauthenticated gets 401
  4. Verify the route no longer depends on `getEnvironmentConfig().adminEmail`

---

### M4 — `demoLogin` error code `UNAUTHENTICATED` → `FORBIDDEN`

- **Existing tests at risk**:
  - `frontend/common/graphql/test/auth/auth.test.ts:39-64` — invokes `demoLogin` mutation (happy path, `IS_DEMO=true` in test server). The error-path (`demoLoginNotEnabled`, which returns `FORBIDDEN`) is only triggered when `IS_DEMO=false`, which the test server doesn't set → **no existing test asserts the disabled-`demoLogin` error code**.
  - `auth.test.ts:167-185` — checks `UNAUTHENTICATED` for the `me` query (not `demoLogin`) → **unaffected** ✅
- **What will break**: No existing test asserts the `demoLogin`-when-disabled error code. The integration test server runs with `IS_DEMO` enabled, so the `FORBIDDEN` branch is never exercised.
- **New tests to add**: Add a unit-level test (e.g., in `backend/services/auth/test/` or a new `auth.mutation.test.ts`) verifying that when `IS_DEMO=false`, `demoLogin` throws with `extensions.code === "FORBIDDEN"` (not `UNAUTHENTICATED`). This may require mocking `IS_DEMO` env or extracting the check into a testable service function.

---

### M5 — Vercel Blob upload MIME allowlist + `maximumSize`

- **Existing tests at risk**:
  - `app/api/storage/vercel-upload/route.test.ts` — directly tests this route (124 lines). Tests `POST /api/storage/vercel-upload` auth via cookie/header (lines 100-124) using `AUTHENTICATED_UPLOAD_BODY` with `contentType: "image/png"` and `fileSize: 100` (lines 67-77). `image/png` is allowlisted and `100` is well under max → existing 4 auth tests **still pass** ✅
  - `frontend/common/graphql/test/storageUploadHarness.ts` — shared upload harness used by `learning-resource-graphql.test.ts:15` and `billing-management.test.ts:24`. Defaults `contentType: "application/pdf"` (allowlisted) → **still passes** ✅
  - **Risk**: The mock for `handleUpload` (`route.test.ts:50-52`) returns a generic success, bypassing `@vercel/blob` server-side checks. If the new MIME/size checks sit BEFORE the `handleUpload` call (in the route handler), the mock doesn't affect them. If they sit AFTER (inside `handleUpload`), the mock bypasses them. The fix should place checks BEFORE `handleUpload` for testability.
- **What will break**: Likely nothing — existing tests use allowlisted MIME types and small sizes.
- **New tests to add** in `app/api/storage/vercel-upload/route.test.ts`:
  1. 400 for disallowed MIME type (e.g., `text/html`, `application/x-msdownload`)
  2. 400 for `fileSize > MAX_BLOB_SIZE` (e.g., 200MB)
  3. Verify `maximumSize` is passed to `onBeforeGenerateToken` (check the mock call args)

---

### L1 — `proxy.ts` auth-cookie redirect

- **Existing tests at risk**: None — no test references `proxy.ts` directly. GraphQL integration tests hit `/api/graphql` (excluded from proxy matcher at line 87: `/((?!api|_next|_vercel|.*\\..*).*)`). → **safe** ✅
- **What will break**: Nothing. ⚠️ HIGH RISK if matcher is wrong — edge middleware runs on every page navigation. But existing tests use `testClient` which hits `/api/graphql` directly, not page routes.
- **New tests to add**: Create `proxy.test.ts` (or `test/proxy.test.ts`):
  1. Unauthenticated request to `/dashboard` redirects to `/login?redirect=/dashboard`
  2. Request with `session_id` cookie passes through (no redirect)
  3. Public routes (`/login`, `/`) pass through
  4. API routes (`/api/*`) are excluded from the matcher

---

### L2 — Accept IPv6 in `gqlContextFactory`

- **Existing tests at risk**:
  - `backend/db/test/logic/shared/ip-format.test.ts` — tests IPv6 at the **DB/schema level** (lines 81-107: inserts `"[IPv6_EXAMPLE]"` into `auditLogs`, asserts stored value). This tests the Postgres `inet` column, NOT the `getIpAddress()` function in `gqlContextFactory.ts`. → **unaffected** ✅
  - No test directly imports `gqlContextFactory` or `getIpAddress`.
- **What will break**: Nothing — the DB-level IPv6 test already passes (Postgres `inet` accepts IPv6). The fix only changes the JS-side regex/fallback, which has no current test.
- **New tests to add**: Create `backend/graphql/test/gqlContextFactory.test.ts` (or extend `ip-format.test.ts`) — unit test for `getIpAddress()`:
  1. IPv4 in `x-forwarded-for` → returns IPv4
  2. IPv6 in `x-real-ip` → returns IPv6 (not `"[IP_REDACTED]"`)
  3. IPv4 with port (`192.168.1.1:8080`) → strips port, returns `192.168.1.1`
  4. Malformed string → falls back to raw string (NOT `"[IP_REDACTED]"`)

---

### L3 — Defense-in-depth enum validation for `ensurePermissionEnumValues` (`getTableRowCounts` already fixed)

- **Existing tests at risk**:
  - `backend/db/test/logic/permissions/permission-management.service.test.ts` — tests `PermissionManagementService` methods (listPermissions, createGroup, updateGroup, deleteGroup, assignGroupToUser, bulkAssign, updateUserOverrides, getEffectiveUserPermissions). No test calls `ensurePermissionEnumValues` directly (grep returned no matches). → **safe** ✅
  - `getTableRowCounts`: **already has allowlist guard** — no test needed. Existing callers use valid table names. → **safe** ✅
- **What will break**: Nothing — existing tests only use valid enum values. The defense-in-depth guard throws on invalid keys, but `parseAppPermission` already validates before this point.
- **New tests to add**:
  - In `backend/db/test/logic/permissions/permission-management.service.test.ts` (or a new file):
    1. `ensurePermissionEnumValues` throws on invalid key (not in `AppPermission` enum) — verifies the new defense-in-depth guard
    2. `ensurePermissionEnumValues` succeeds for valid enum values

---

### L4 — Rate limiting for `demoLogin`

- **Existing tests at risk**:
  - `frontend/common/graphql/test/auth/auth.test.ts:39-64` — calls `demoLogin` for `super_admin`, `academy_admin` (2-3 calls per run). Under `checkRateLimit`, repeated runs may approach the limit. If the limiter is per-IP and the test server shares one IP, running the suite multiple times could trip the limiter. → **potential flakiness in parallel execution** ⚠️
  - `backend/db/test/logic/auth/auth_rate_limit_enforcement.test.ts` — tests rate-limit enforcement at the DB level. Does NOT test `demoLogin` or `checkRateLimit` directly. → **safe** ✅
  - **Risk**: `auth.test.ts:39-54` "obtain super admin token via demoLogin" — if the limiter is keyed by IP and tests run in parallel on one server, repeated `demoLogin("super_admin")` calls across suites could trip the limit. **Potential breakage in parallel test execution.**
  - **Mitigation**: The rate limiter threshold for `demoLogin` should be high enough (e.g., 20+ attempts) to not interfere with test runs, OR the test server should use a separate rate-limiter namespace for demo logins, OR the rate limiter should be reset between test runs.
- **What will break**: Potentially `auth.test.ts` if rate limit is too low or tests run in parallel. Most likely nothing breaks with a reasonable threshold.
- **New tests to add**: Add a test in `backend/db/test/logic/auth/auth_rate_limit_enforcement.test.ts` (or a new `demoLogin-rate-limit.test.ts`) verifying `demoLogin` returns `TOO_MANY_ATTEMPTS` error code after exceeding the rate limit, mirroring the existing `login` rate-limit test pattern.

---

### L5 — `maxItems`/per-item `maxLength` for `t.stringList` inputs

- **Existing tests at risk**:
  - `frontend/common/graphql/test/meeting/meeting-config.test.ts:22` — uses `urlAllowlist: ["zoom.us", "*.zoom.us"]` (2 items, under any `maxItems`) → **safe** ✅
  - `backend/lib/meeting-config.validation.test.ts:12,36,107,121` — `urlAllowlist` validation with small arrays → **safe** ✅
  - `frontend/common/graphql/test/permissions/permission-group-simulation.test.ts` — permission group tests with `permissionIds` arrays (need to verify array sizes) → **likely safe** ✅
  - `frontend/common/graphql/test/billing/payment-method.test.ts` — payment method mutation with `urlAllowlist` → **likely safe** ✅
  - `storageUploadHarness.ts` — builds paths used by `learning-resource-graphql.test.ts` and `billing-management.test.ts`. Paths are short → **likely safe** ✅
- **What will break**: Existing tests use small arrays and short strings → nothing breaks unless per-item `maxLength` is set very low. Verify no test sends a >500-char path/URL.
- **New tests to add**:
  - Storage mutation rejects `sourcePaths` with >100 items
  - Payment-method rejects `urlAllowlist` with >50 items (or whatever `maxItems` is set to)
  - Per-item `maxLength` rejection if implemented (e.g., 500-char path/URL → 400 error)

---

### Testing Summary Table

| Fix | Existing test files at risk | What breaks? | New tests needed |
|-----|----------------------------|--------------|------------------|
| **H1** | None | Nothing | 1 unauthenticated-access test for `recurringSchedules` query |
| **H2** | `admin-reset-password.service.test.ts:169`, `admin-password.test.ts`, onboarding suites | Success-path tests using non-complex passwords | 4 complexity error-case tests + audit/update `testPassword` values |
| **H3** ⚠️ | `helpers.ts` + ~40 suites via `lifecycle.ts` | **ALL suites' `beforeAll`** — `ensureDemoUsers` call rejected | Test-harness fix (bootstrap token) + 1 denial test |
| **H4** | `parent.repository.test.ts:357`, `scheduling-recurring.repository.test.ts` | Nothing (transparent for alphanumeric) | Wildcard-escaping search tests in 4 repo test files |
| **M1** | `testServer.ts:30` (IS_DEMO without ADMIN_PASSWORD) | Server crash on boot if `ADMIN_PASSWORD` unset | Set `ADMIN_PASSWORD` in testServer.ts + 4 unit tests for `resolveAdminPassword()` |
| **M2** | None | Nothing | New `route.test.ts` — 4 tests (inline, attachment, rejection, download param) |
| **M3** | None | Nothing | New `route.test.ts` — 4 tests (admin success, 403, 401, no adminEmail dep) |
| **M4** | None (disabled branch not exercised) | Nothing | 1 unit test asserting `FORBIDDEN` when `IS_DEMO=false` |
| **M5** | `vercel-upload/route.test.ts`, `storageUploadHarness.ts` | Likely nothing (uses allowlisted types) | 3 tests: bad MIME, oversize, `maximumSize` passed to mock |
| **L1** | None | Nothing | New `proxy.test.ts` — 4 tests (redirect, pass-through, public, API excluded) |
| **L2** | `ip-format.test.ts` (DB-level only) | Nothing | New `gqlContextFactory.test.ts` — 4 `getIpAddress()` unit tests |
| **L3** | `permission-management.service.test.ts` | Nothing | 2 tests: `ensurePermissionEnumValues` defense-in-depth guard (`getTableRowCounts` already fixed) |
| **L4** | `auth.test.ts:39-64` (parallel-run risk) | Potential flakiness if threshold too low | 1 rate-limit test for `demoLogin` + verify threshold is test-safe |
| **L5** | `meeting-config.test.ts`, `payment-method.test.ts`, etc. | Nothing (small arrays) | 3 tests: `maxItems` rejection for stringLists |

### Test execution commands

```bash
# Database tests (use run-test script, NOT raw bun test)
bun run scripts/run-test/run-test.ts backend/db/test/repo/parents/parent.repository.test.ts
bun run scripts/run-test/run-test.ts backend/db/test/repo/scheduling/scheduling-recurring.repository.test.ts
bun run scripts/run-test/run-test.ts backend/db/test/logic/permissions/permission-management.service.test.ts
bun run scripts/run-test/run-test.ts backend/db/test/logic/auth/auth_rate_limit_enforcement.test.ts

# Service tests
bun run scripts/run-test/run-test.ts backend/services/auth/test/admin-reset-password.service.test.ts

# GraphQL integration tests (dev server)
bun run test:graphql

# API route tests (Bun test)
bun run scripts/run-test/run-test.ts app/api/storage/vercel-upload/route.test.ts
bun run scripts/run-test/run-test.ts app/api/storage/files/[[\...path]]/route.test.ts
bun run scripts/run-test/run-test.ts app/api/storage/cleanup/route.test.ts

# Library unit tests
bun run scripts/run-test/run-test.ts backend/lib/test-helper-gate.test.ts
bun run scripts/run-test/run-test.ts backend/lib/demo-users.test.ts
```

---

## Verification

### V1 — Run quality gate after all fixes

- **Command**: `bun tsgo && bun oxlint && bun biome:check && bun run lint`
- **Scope**: All changed files
- **Note**: Run per-file verification loop BEFORE importing/using any changed file elsewhere.

---

## Files Changed Summary

| # | File | Severity | Changes |
|---|------|----------|---------|
| H1 | `backend/graphql/pothos/scheduling/recurring-schedule.pothos.ts` | HIGH | Add `authScopes: { loggedIn: true }` |
| H2 | `backend/lib/auth/password.ts` | HIGH | Add 4 password complexity regex checks |
| H3 | `backend/graphql/mutation/shared/test-helper.mutation.ts` | HIGH | Add `authScopes: { loggedIn: true }` |
| H4 | 7 repository files | HIGH | Wrap search input with `escapeLikeWildcards()` |
| M1 | `shared/demo-users.ts` | MEDIUM | Require `ADMIN_PASSWORD` for IS_DEMO/TEST_SERVER |
| M2 | `app/api/storage/files/[[...path]]/route.ts` | MEDIUM | Add `Content-Disposition` + extension allowlist |
| M3 | `app/api/storage/cleanup/route.ts` | MEDIUM | Replace email-match with `isSuperAdmin` check |
| M4 | `backend/graphql/mutation/auth/auth.mutation.ts` | MEDIUM | Change error code to `FORBIDDEN` |
| M5 | `app/api/storage/vercel-upload/route.ts` | MEDIUM | Add MIME allowlist + `maximumSize` |
| L1 | `proxy.ts` | LOW | Add auth-cookie-existence redirect |
| L2 | `backend/graphql/gqlContextFactory.ts` | LOW | Accept IPv6 or fall back to raw string |
| L3 | `backend/services/auth/permission-management.service.ts` | LOW | Defense-in-depth enum validation (`getTableRowCounts` already fixed) |
| L4 | `backend/graphql/mutation/auth/auth.mutation.ts` | LOW | Add `checkRateLimit` to `demoLogin` |
| L5 | 3+ Pothos files | LOW | Add `maxItems` to stringList inputs (including `userIds` and `contentTypes` previously missed) |
