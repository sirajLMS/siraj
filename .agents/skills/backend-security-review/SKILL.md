---
name: backend-security-review
description: >
  Backend security review for the Siraj codebase (Pothos GraphQL + Drizzle ORM + PostgreSQL + Next.js 16).
  Dispatches parallel explore subagents to audit authentication, authorization, input validation, SQL/LIKE
  injection, file upload security, secrets, rate limiting, and i18n compliance. Produces a structured
  findings report with severity ratings and a plan file. Use when asked to review backend security,
  audit for vulnerabilities, or before implementing sensitive features (auth, payments, file uploads).
---

# Backend Security Review Skill

You are a backend security review orchestrator for the Siraj LMS codebase. Your job is to:

1. **Ask scoping questions** to define the review boundary
2. **Dispatch parallel explore subagents** to audit specific security domains
3. **Verify findings** against actual source code (line numbers, file paths, existing guards)
4. **Write a structured plan** to `.ai/plans/` with severity-rated findings and fix proposals
5. **Refine the plan** across multiple passes — cross-checking every code snippet, line number, and file path against the real codebase
6. **Validate** the plan with the `plan-review` skill

## Context Window Discipline Rules (CRITICAL)

Your context window is a scarce resource. Violating these rules will degrade your performance.

### ❌ NEVER do these yourself (during review phase):
- Read every source file individually — delegate bulk file reading to subagents
- Run build/lint/test commands — delegate to `task` subagents
- Aggregate large blocks of code into your context

### ✅ ALWAYS delegate to subagents:
- **File discovery & code audit** → use `explore` subagent (agent_type: "explore")
- **Command execution** (git, grep, find) → use `task` subagent (agent_type: "task")
- **Fix implementation** → use `general-purpose` subagent (agent_type: "general-purpose") — only when user confirms

### ✅ Keep in your context ONLY:
- User's scoping answers and preferences
- Aggregated FINDING lines (one line per finding)
- The plan file content
- Risk entries and verification results
- Summary counts and status

## Instruction Files (MUST follow when implementing fixes)

| Instruction File | `applyTo` Pattern | Covers |
|---|---|---|
| `.github/instructions/backend.instructions.md` | `backend/**/*.ts` | Architecture layers, types, Pothos, i18n, logging, repos, seeds |
| `.github/instructions/tests.instructions.md` | `**/*.test.ts, **/*.spec.ts` | DB test safety, runInRollback, tx patterns, entity setup |

---

## Phase 1: Interactive Scoping

Greet the user briefly, then ask scoping questions using `ask_user`.

### Question 1: Review Scope

```
ask_user:
  question: "What backend security scope should this review cover?"
  choices:
    - "Full backend — all GraphQL, services, repos, API routes, auth, middleware"
    - "Specific area — I'll specify (e.g., auth, file uploads, GraphQL resolvers)"
    - "Uncommitted changes only — review my current diff"
```

### Question 2: Output

```
ask_user:
  question: "Should I create a plan file after the review?"
  choices:
    - "Yes — create a plan file in .ai/plans/ (Recommended)"
    - "No — just report findings in chat"
```

If yes, ask for a filename or use default `security-fixes/plan.md`.

### Question 3: Implementation

```
ask_user:
  question: "After the review and plan, should I implement fixes?"
  choices:
    - "No — review and plan only (Recommended for security reviews)"
    - "Yes — implement, verify, and commit"
```

**Default to "review only"** — security fixes should be reviewed before implementation.

---

## Phase 2: Dispatch Security Audit Subagents

Launch ALL audit subagents in PARALLEL in a SINGLE response using `Task` tool with `agent_type: "explore"` and `mode: "background"`.

### Subagent Groupings

| Group | Security Domain | Audit Targets |
|---|---|---|
| 1 — Auth & AuthZ | Pothos `authScopes`, API route auth, middleware/proxy gate | `backend/graphql/pothos/`, `app/api/`, `proxy.ts` |
| 2 — SQL & LIKE Injection | `sql.raw` usage, `ilike()` calls, string interpolation in queries | `backend/db/repo/`, `backend/services/` |
| 3 — Input Validation | GraphQL input args, `stringList` bounds, file upload MIME/size | `backend/graphql/pothos/`, `app/api/storage/` |
| 4 — Secrets & Config | Hardcoded passwords, env-var fallbacks, demo credentials | `shared/`, `backend/lib/`, `.env*` |
| 5 — Rate Limiting & DoS | `checkRateLimit` coverage, `demoLogin`, expensive queries | `backend/graphql/mutation/`, `backend/lib/` |
| 6 — i18n Security Errors | Error messages using hardcoded strings instead of i18n system | All backend files |
| 7 — Test Security | Test passwords, test server env, `ensureDemoUsers` auth | `backend/graphql/mutation/shared/`, test files |

### Subagent Prompt Template

Each subagent receives:

```
You are auditing the Siraj codebase for security vulnerabilities in [DOMAIN].

## Scope
[Specific files/directories for this group]

## What to look for
[Domain-specific audit checklist — see Phase 3 for details]

## Output Format
For EACH finding, output one line:
FINDING|[SEVERITY]|[FILE:LINE]|[DESCRIPTION]|[RECOMMENDED_FIX]

Severity: CRITICAL, HIGH, MEDIUM, LOW, VERIFY
- CRITICAL: Exploitable vulnerability, no auth required
- HIGH: Auth bypass or injection vector
- MEDIUM: Defense-in-depth gap, hardening needed
- LOW: Best practice violation, low exploitability
- VERIFY: Suspected issue needing manual confirmation

## Critical Rules
- Report ACTUAL line numbers from the source code (use grep -n)
- If you suspect an issue but cannot confirm, mark as VERIFY
- Do NOT report issues that are already mitigated (verify existing guards first)
- For each `ilike()` or `sql.raw` call, check if `escapeLikeWildcards()` is already applied
- For each queryField/mutationField, check if `authScopes` is present
- For each API route, check if authentication is verified before processing
- Do NOT read the entire file — use `grep -n` to find patterns, then `sed -n 'START,ENDp'` to view context

## Codebase Context
- ORM: Drizzle (not Prisma/Supabase) — look for `ilike()`, `sql\`...\``, `sql.raw()`
- GraphQL: Pothos — look for `authScopes: { loggedIn: true }`, `authScopes: { permission: "..." }`
- Auth: httpOnly cookies (session_id, access_token, refresh_token) — NOT localStorage
- Rate limiting: `checkRateLimit(ipAddress, authRateLimiter)` pattern in `auth.mutation.ts`
- LIKE escaping: `escapeLikeWildcards()` from `@/backend/utils` — already used in some repos
- Logging: `logger` from `@/backend/lib/logger` — NEVER `console.*`
- i18n: Compile-time TypeScript system in `shared/locale/` — NEVER hardcoded error strings
- Edge middleware: `proxy.ts` (NOT `middleware.ts`) in Next.js 16
```

Wait for ALL subagents to complete before moving to Phase 3.

---

## Phase 3: Security Audit Checklist

These are the specific checks each subagent performs. Paste the relevant section into each subagent's prompt.

### Group 1 — Auth & AuthZ Checklist

**Pothos GraphQL resolvers** (`backend/graphql/pothos/**/*.pothos.ts`):
- [ ] Every `queryField` has `authScopes` — no unauthenticated data access
- [ ] Every `mutationField` has `authScopes` — no unauthenticated mutations
- [ ] `authScopes` uses the correct scope (`loggedIn`, `permission`, `role`)
- [ ] Resolvers don't use `ctx.user?.id ?? ""` (silent anonymous fallback) — if authScopes requires login, this is dead code; if authScopes is missing, this is a bypass
- [ ] Test-helper mutations (`test-helper.mutation.ts`) — `ensureDemoUsers` has `authScopes` matching siblings (`createTestEntities`, `cleanupTestEntities` both have `authScopes: { loggedIn: true }`)

**API routes** (`app/api/**/*.ts`):
- [ ] Every route verifies authentication before processing (cookie check or session verify)
- [ ] Authorization checks use `PermissionsService.getUserContext()` for `isSuperAdmin` — NOT `user.isSuperAdmin` (that field is on `UserPermissionContext`, not `CurrentUserProfile`)
- [ ] No email-comparison auth checks (`user.email === adminEmail`) — use role/permission checks instead
- [ ] No IDOR (Insecure Direct Object Reference) — verify resource ownership before returning/modifying

**Edge middleware** (`proxy.ts`):
- [ ] Protected route prefixes redirect unauthenticated users to `/login`
- [ ] Public routes (`/login`, `/`) are excluded from the redirect
- [ ] API routes (`/api/`) are excluded from the auth redirect (they have their own auth)
- [ ] Route list matches ACTUAL app routes — no phantom routes, no missing routes (verify with `find app/ -name 'page.tsx'`)
- [ ] No locale-prefixed URLs in redirects if the app uses cookie-based locale

### Group 2 — SQL & LIKE Injection Checklist

**`sql.raw()` usage** (`backend/db/repo/`, `backend/services/`):
- [ ] Every `sql.raw()` call uses a hardcoded string OR a validated allowlist — never raw user input
- [ ] Dynamic table names in `sql.raw()` are validated against a known set (e.g., `KNOWN_TABLES` built from Drizzle schema)
- [ ] Enum values in `sql.raw()` are validated against the actual TS enum (e.g., `Object.values(AppPermission)`)
- [ ] Prefer `sql.identifier()` over `sql.raw()` for dynamic identifiers — it's parameterized

**`ilike()` / `LIKE` patterns** (`backend/db/repo/`):
- [ ] Every `ilike(column, pattern)` call wraps user input with `escapeLikeWildcards()`
- [ ] Every `sql\`${column} ILIKE ${pattern}\`` wraps user input with `escapeLikeWildcards()`
- [ ] Check if `escapeLikeWildcards` is already imported in the file — if yes, any unescaped `ilike()` is a finding
- [ ] Distinguish between `ilike()` function calls (wrap the argument) and `sql` template tags (wrap the `searchPattern` variable assignment)
- [ ] Verify line numbers against actual source — use `grep -n "ilike\|ILIKE\|escapeLike" <file>`
- [ ] Some lines have **TWO** `ilike()` calls (e.g., `or(ilike(name, ...), ilike(email, ...))`) — both need wrapping

**Established pattern** (`escapeLikeWildcards` from `@/backend/utils`):
- Already used in: `complaint.repository.ts`, `teacher.repository.ts`, `teacher-availability.repository.ts`, `suggestion.repository.ts`, `storage.repository.ts`
- Any repo that does NOT import it but uses `ilike()` with user input is a finding
- Verify each claimed existing-usage site — do NOT trust pattern counts without grep verification

### Group 3 — Input Validation Checklist

**GraphQL input args** (`backend/graphql/pothos/**/*.pothos.ts`):
- [ ] `t.arg.stringList()` inputs have `maxItems` constraint (e.g., `directives: { constraint: { maxItems: 100 } }`)
- [ ] `stringList` inputs have per-item `maxLength` (e.g., `directives: { constraint: { maxLength: 36 } }` for UUIDs)
- [ ] `t.arg.string()` inputs have `maxLength` constraint where appropriate
- [ ] No unbounded string or stringList inputs — every input should have a size cap
- [ ] Check ALL stringList inputs, not just the obvious ones — search for `t.arg.stringList` AND `t.stringList` (the latter is used in object/input types)

**File uploads** (`app/api/storage/**/*.ts`):
- [ ] MIME type is validated server-side — NOT trusted from client `contentType`
- [ ] File size is capped (`maximumSize` in `handleUpload` or equivalent)
- [ ] SVG (`image/svg+xml`) is NOT in the allowlist (stored XSS vector — SVG can execute JavaScript)
- [ ] Extension allowlist does NOT include `svg` for inline-served content
- [ ] Non-image files served with `Content-Disposition: attachment` (prevents inline rendering)
- [ ] Public content extensions are allowlisted (not blacklisted)

### Group 4 — Secrets & Config Checklist

**Hardcoded credentials** (`shared/`, `backend/lib/`, `backend/services/`):
- [ ] No hardcoded API keys, passwords, or tokens in source code
- [ ] `DEFAULT_*_PASSWORD` constants are only for dev/test mode — guarded by `IS_DEMO` or `TEST_SERVER`
- [ ] `resolveAdminPassword()` (or equivalent) throws if `IS_DEMO`/`TEST_SERVER` is set without an explicit `ADMIN_PASSWORD` env var
- [ ] Test server env config (`testServer.ts`) sets `ADMIN_PASSWORD` if `IS_DEMO` is true
- [ ] Production code paths throw if required env vars are missing (no silent fallback)

**Shared layer constraint**:
- [ ] `shared/` files do NOT import from `@/backend/**` or `@/app/**` (ESLint enforced)
- [ ] `shared/` uses raw `process.env` — NOT `getBooleanEnv` from `@/backend/lib/env`
- [ ] No secrets in `shared/` — secrets belong in `backend/lib/` with env-var access

### Group 5 — Rate Limiting & DoS Checklist

**Mutation rate limiting** (`backend/graphql/mutation/**/*.ts`):
- [ ] `login` mutation has `checkRateLimit(ipAddress, authRateLimiter)` — verify it exists
- [ ] `demoLogin` mutation has rate limiting (mirror `login` pattern)
- [ ] Other authentication-adjacent mutations (password reset, OTP, etc.) have rate limiting
- [ ] Rate limiter uses `ctx.ipAddress` from GraphQL context

**IP address extraction** (`backend/graphql/gqlContextFactory.ts`):
- [ ] IPv6 addresses are handled correctly — not collapsed to a shared fallback
- [ ] Port stripping works for IPv4:port format (e.g., `"1.2.3.4:8080"` → `"1.2.3.4"`)
- [ ] IPv6 addresses (e.g., `"::1"`, `"fe80::1"`) are returned as-is (not regex-validated with a broken pattern)
- [ ] Verify: does the existing `raw.split(":")` port-stripping logic break for IPv6? (IPv6 has colons in the address)

**Expensive query DoS**:
- [ ] GraphQL queries have `maxItems`/pagination limits — no unbounded `findMany`
- [ ] Nested resolvers don't create N+1 query bombs (DataLoader batching in place)

### Group 6 — i18n Security Error Checklist

**Error messages** (all backend files):
- [ ] All user-facing error messages use the compile-time i18n system (`shared/locale/`)
- [ ] No hardcoded error strings (e.g., `throw new Error("Unauthorized")`) — use `tErrors.auth.forbidden` or equivalent
- [ ] GraphQL resolvers use `ctx.t()` (already bound to `ctx.locale`)
- [ ] API routes use `getServerTranslations(locale, "namespace")` from `@/shared/locale/server`
- [ ] API routes use `getServerTranslations(locale ?? "en")` with a sensible fallback
- [ ] Verify i18n keys exist in BOTH `en` and `ar` locale files before proposing them

### Group 7 — Test Security Checklist

**Test passwords** (`backend/graphql/test/`, `frontend/common/graphql/test/`):
- [ ] Test passwords meet complexity rules if password validation is enforced
- [ ] No bare `randomUUID()` as password (all-lowercase hex, no uppercase, no special char)
- [ ] Use `generateTestPassword()` helper or `"TestPass-${randomUUID().slice(0,8)}!"` pattern
- [ ] Verify ALL test files that create users — not just the obvious ones

**Test server configuration**:
- [ ] `testServer.ts` sets `ADMIN_PASSWORD` if `IS_DEMO` is true (or `resolveAdminPassword()` will throw)
- [ ] `testServer.ts` sets `TEST_SERVER: "1"` for test-helper gate
- [ ] Rate limit behavior in tests — does `checkRateLimit` need to be disabled or raised for parallel test execution?

**`ensureDemoUsers` bootstrap**:
- [ ] If adding `authScopes: { loggedIn: true }` to `ensureDemoUsers`, the test lifecycle must be restructured (circular dependency: need token to call `ensureDemoUsers`, need `ensureDemoUsers` to provision user to get token)
- [ ] Document the bootstrap flow: seed super admin via DB → `demoLogin` → `ensureDemoUsers` with token

---

## Phase 4: Aggregate & Verify Findings

When all subagents return, aggregate findings. For each finding:

1. **Record one line**: `[SEVERITY] <domain>: <file>:<line> — <description>`
2. **Verify critical findings yourself** — use `grep -n` and `sed -n 'START,ENDp'` to confirm:
   - The file path exists
   - The line number is correct (±1 line tolerance)
   - The described pattern is actually present
   - Existing guards (e.g., `escapeLikeWildcards`, `authScopes`) are NOT already in place
3. **De-duplicate** — if two subagents report the same issue, merge into one finding
4. **Re-classify** — if a HIGH finding turns out to already be mitigated, downgrade to VERIFY or remove

### Common Verification Failures (learned from experience)

These are recurring mistakes that subagents make — ALWAYS verify:

| Mistake | How to Verify | Example |
|---|---|---|
| Wrong line numbers | `grep -n "pattern" <file>` | Plan said line 404, actual line 358 |
| Phantom file references | `grep -rn "function" <dir> --include="*.ts"` | Plan cited `cron.repository.ts:184` — no such usage exists |
| Already-mitigated findings | Read the actual function body | `getTableRowCounts` already has a dynamic `KNOWN_TABLES` allowlist |
| Missing existing guards | `grep -n "escapeLikeWildcards\|authScopes" <file>` | File already imports `escapeLikeWildcards` at line 12 |
| Phantom routes | `find app/ -name 'page.tsx' -path '*/(dashboard)/*'` | Plan listed `/feedback` — no `page.tsx` exists |
| Wrong type fields | `grep -n "isSuperAdmin" <types-file>` | `CurrentUserProfile` has no `isSuperAdmin` — it's on `UserPermissionContext` |
| Wrong import paths | `grep -n "import.*function" <file>` | `AppPermission` is in `@/backend/enum`, not `shared/constants/` |
| Missing stringList inputs | `grep -rn "stringList" <pothos-dir>` | Subagent missed `contentTypes` in `FileMetadataInput` |

---

## Phase 5: Write Plan File

Write the plan to `.ai/plans/<filename>.md`.

### Plan file format:

```markdown
# Backend Security Fixes — Implementation Plan

> **Source**: Backend security review ([date])
> **Status**: [DRAFT / REFINED — Nth pass — N risks identified]

---

## HIGH Severity

### H1 — [Title]
- **File**: `[file path]`
- **Line**: [actual line number, verified with grep -n]
- **Layer**: [architecture layer]
- **Problem**: [what's wrong]
- **Fix**: [what to change]
- **Code change**:
  ```ts
  // [Exact code snippet with correct line numbers]
  ```
- **i18n**: [required keys or "No new keys needed"]
- **Types**: [type imports needed or "No new types"]
- **Tests**: [test impact or "None"]

---

## MEDIUM Severity
[...same format...]

## LOW Severity
[...same format...]

---

## Risks

[Each risk: what can go wrong during implementation, test breakage, regression potential]

---

## Testing

[Map each fix to affected existing test files, what will break, and new tests to add]

---

## Files Changed Summary

| Fix | File | Severity | Description |
|---|---|---|---|
| H1 | `path/to/file.ts` | HIGH | [brief description] |
```

### Plan quality rules:
- **Every line number MUST be verified** with `grep -n` before writing
- **Every file path MUST be fully qualified** (e.g., `backend/db/repo/billing/quota.repository.ts`, not just `quota.repository.ts`)
- **Every code snippet MUST be cross-checked** against the actual source — paste the real code, then show the diff
- **Every i18n key MUST be verified** to exist in both `en` and `ar` locale files
- **Every type field reference MUST be verified** — check that the type actually has the field (e.g., `isSuperAdmin` is on `UserPermissionContext`, not `CurrentUserProfile`)
- **Every existing guard MUST be acknowledged** — if the code already has a mitigation, note it and don't propose a redundant fix
- **Distinguish SQL template tags from `ilike()` function calls** — the fix approach differs

---

## Phase 6: Plan Refinement (Multi-Pass)

After writing the initial plan, refine it across multiple passes. Each pass focuses on a different verification dimension:

### Pass 1 — Risk Identification
- What can break during implementation?
- Which tests will be affected?
- Are there circular dependencies (e.g., adding `authScopes` to `ensureDemoUsers` → test bootstrap breaks)?
- Are there env-var dependencies (e.g., requiring `ADMIN_PASSWORD` breaks test server)?
- Are there test password issues (e.g., bare `randomUUID()` fails new complexity rules)?

### Pass 2 — Codebase Accuracy
- Verify every file path exists
- Verify every line number with `grep -n`
- Verify every code snippet against actual source
- Check for phantom routes in middleware route lists
- Check for phantom file references in "established pattern" citations
- Verify type fields exist on the referenced types

### Pass 3 — Completeness
- Did subagents miss any `stringList` inputs? (`grep -rn "stringList" <pothos-dir>`)
- Did subagents miss any API routes? (`find app/api -name "route.ts"`)
- Did subagents miss any `queryField` without `authScopes`? (`grep -rn "queryField" <pothos-dir>`)
- Are all dashboard routes covered in the middleware `PROTECTED_PREFIXES` list?
- Are all `ilike()` calls found? (Some lines have TWO `ilike()` calls — both need wrapping)
- Distinguish between `sql\`... ILIKE ${pattern}\`` (template tag) and `ilike(col, pattern)` (function call) — the fix differs

### Pass 4 — Cross-Check
- Re-run `grep -n` on every line number cited in the plan
- Verify established-pattern citations actually exist (`grep -rn "escapeLikeWildcards" <dir>`)
- Verify i18n key implementations in `en` AND `ar` locale files
- Verify `PermissionsService` is in the right file (`permissions.service.ts` vs `permission-management.service.ts` — different files, same directory)

### Refinement Output

After each pass, add to the Risks section:

```markdown
### R[N] — [SEVERITY_ICON] [Title]
- **Fix**: [Which fix this risk relates to]
- **Description**: [What was wrong in the plan]
- **Impact**: [What would happen if unaddressed]
- **Status**: **FIXED in this refinement** — [what was corrected]
```

Update the status header to reflect the current pass and risk count.

---

## Phase 7: Plan-Review Skill Validation

After refinement, invoke the `plan-review` skill:

```
skill:
  skill: "plan-review"
```

After it returns:
1. Add any violations to the plan's Risks section
2. Fix the violations in the code snippets
3. Re-run plan-review if violations were found (loop until clean)

---

## Phase 8: Final Report

If the user chose "review only" (Phase 1 Question 3):
1. Print summary: total findings by severity, risk count, plan file location
2. List the top 3 highest-priority findings
3. Suggest next steps (implement fixes, refine plan further, run plan-review)

If the user chose "implement":
1. Follow `review-backend` skill Phase 6-9 (issue fix scoping → implementation → quality gate → commit)
2. Apply security fixes in the order specified by risk severity
3. **Test infrastructure changes FIRST** (R1/R2-type risks) — fix the test harness before fixing the security issue that breaks it
4. Run quality gate after all fixes

---

## Severity Classification Guide

| Severity | Criteria | Examples |
|---|---|---|
| **CRITICAL** | Exploitable without authentication, direct data breach | Public GraphQL query exposing all users, SQL injection in public endpoint |
| **HIGH** | Auth bypass, injection vector, missing auth on sensitive operation | Missing `authScopes` on query, unescaped LIKE wildcards, password complexity not enforced |
| **MEDIUM** | Defense-in-depth gap, hardening needed, reduced attack surface | Email-comparison auth check, demo password fallback, missing rate limiting on non-critical endpoint |
| **LOW** | Best practice violation, low exploitability | Missing `maxItems` on `stringList`, missing `Content-Disposition` on download, IPv6 bucket collapse |
| **VERIFY** | Suspected issue needing manual confirmation | Possible existing mitigation, ambiguous code path, needs runtime verification |

---

## Key Codebase Patterns (Reference for Subagents)

### Auth & AuthZ
- **Pothos authScopes**: `authScopes: { loggedIn: true }` (basic), `authScopes: { permission: "PERMISSION_KEY" }` (RBAC)
- **PermissionsService**: `backend/services/auth/permissions.service.ts` — `PermissionsService.getUserContext(userId)` returns `UserPermissionContext` with `isSuperAdmin: boolean`
- **CurrentUserProfile**: `backend/types/auth/auth.types.ts` — does NOT have `isSuperAdmin`
- **Auth cookies**: `session_id` (7-day), `access_token` (15-min JWT), `refresh_token` — set via `setAuthCookies()` from `backend/lib/auth/cookies.ts`
- **Edge middleware**: `proxy.ts` (NOT `middleware.ts`) — Next.js 16 uses `proxy.ts` for edge middleware

### SQL & LIKE Injection
- **`escapeLikeWildcards(input: string)`**: Defined in `backend/utils/db.utils.ts:15`, exported via `@/backend/utils`
- **Already used in**: `complaints/complaint.repository.ts`, `teachers/teacher.repository.ts`, `teachers/teacher-availability.repository.ts`, `parents/suggestion.repository.ts`, `storage/storage.repository.ts`
- **Two ILIKE patterns**: `ilike(column, pattern)` (Drizzle function) and `sql\`${column} ILIKE ${pattern}\`` (SQL template tag) — fix approach differs
- **`sql.raw()` vs `sql.identifier()`**: `sql.raw()` is raw string interpolation (dangerous); `sql.identifier()` is parameterized (safe for table/column names)

### i18n
- **GraphQL resolvers**: `ctx.t("namespace")` — already bound to `ctx.locale`
- **API routes**: `getServerTranslations(locale ?? "en", "namespace")` from `@/shared/locale/server`
- **Tests/scripts**: `getServerTranslations(locale, "namespace")` from `@/shared/locale/server-graphql`
- **Locale files**: `shared/locale/en/errors/index.ts` (English), `shared/locale/ar/errors/index.ts` (Arabic) — verify keys exist in both

### Rate Limiting
- **Pattern**: `checkRateLimit(ipAddress, authRateLimiter)` → throws `GraphQLError` with `code: "TOO_MANY_ATTEMPTS"`
- **Existing**: `login` mutation in `backend/graphql/mutation/auth/auth.mutation.ts`
- **Both `checkRateLimit` and `authRateLimiter`** are imported at the top of `auth.mutation.ts`

### Logging
- **Backend**: `import { logger } from "@/backend/lib/logger"` — methods: `info`, `warn`, `error`, `debug`
- **Frontend**: `import { logger } from "@/frontend/utils/logger"`
- **NEVER** use `console.*` — ESLint will error

### Test Infrastructure
- **Test server**: `frontend/common/graphql/test/testServer.ts` — sets `IS_DEMO`, `TEST_SERVER` env vars
- **Test lifecycle**: `frontend/common/graphql/test/lifecycle.ts` — `ensureDemoUsersForTests()` in `beforeAll`
- **Test helpers**: `frontend/common/graphql/test/helpers.ts` — `attemptEnsureDemoUsers()`, `provisionDemoUsers()`
- **Demon login**: `demoLogin("super_admin")` pattern — needs `ensureDemoUsers` to have run first (circular dependency risk)
