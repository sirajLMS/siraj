# Backend Security Review Round 2 — Findings & Fix Plan

> **Source**: Security review round 2 (2026-09-18) — 7 parallel security-auditor domains over the in-flight changeset (uncommitted working tree, ~45 new + 132 modified code files), plus re-verification of round-1 open items
> **Status**: **IMPLEMENTED 2026-09-18/19 — all HIGH (H1–H4), all MEDIUM except M8 (deferred — schema migration must coordinate with the in-flight workstream), and all new LOWs landed; round-1 LOW batch landed except L14/L17/L21/L22 (accepted/deferred, see below). tsgo ✓, full-repo lint ✓, all affected suites green. M12 is a doc note (landed in the mutation contract). VERIFY items remain open pending owner decisions.**
> **Round-1 plan**: `.ai/plans/security-fixes/plan.md` (implemented 2026-09-18, commit 9cf24881f6) — all its previous fixes verified INTACT in this round (see Holdchecks)
> **Context**: the audited tree contains a concurrent in-flight workstream (PII field encryption, profit-loss reporting, user anonymization, storage blob-access changes). Findings may shift as that workstream lands; re-verify each finding before implementing against moving files.

## Result Summary

| Severity | Count | IDs |
|---|---|---|
| HIGH | 4 | H1–H4 |
| MEDIUM | 19 | M1–M19 |
| LOW | 24 (new) | L-A..L-X |
| VERIFY | 9 | V-A..V-I |
| Round-1 LOW re-check | 19 STILL-OPEN / 1 NOW-FIXED (L10) / 3 DRIFTED (L5, L11, L17) | L1–L23 |

## HIGH Severity

### H1 — Invoice PDFs under `public/` are served unauthenticated (verifyInvoiceAccess bypass; round-1 item V1 confirmed open) ✅ IMPLEMENTED 2026-09-18
- **File**: `app/api/invoices/[id]/download/route.ts`
- **Line**: :27-32 (redirect with only `validatePath`); `app/api/storage/files/[[...path]]/route.ts:254` (`public/` branch serves unauthenticated); `backend/db/seeds/billing/seed-invoices.ts:92-100` (seeds wrote `public/invoices/${idempotencyKey}.pdf`)
- **Layer**: App Router API + storage
- **Problem**: any invoice whose PDF lives under `public/` is fetchable by URL without auth, bypassing `verifyInvoiceAccess` (backend/services/billing/billing-management.service.ts:630).
- **Fix (implemented)**: guard added before the redirect — `public/`-prefixed `filePath` → `logger.error` + 500 (`tErrors.internalServerError`); seeds now store under `invoices/` with `ensureParentDirs: ["invoices"]`. No test file existed for the route (none added).
- **i18n**: No new keys (reused existing). **Types**: None. **Tests**: none existed; route test recommended as follow-up.
- **Follow-up data fix**: environments seeded before this change carry `entity_files.filePath` under `public/invoices/...` for `usageType: invoice_pdf` — one-time prefix strip needed there or those invoices 500.

### H2 — User anonymization never touches WhatsApp data (right-to-be-forgotten gap)
- **File**: `backend/services/users/user-anonymization.service.ts`
- **Line**: scrub steps ~:83-114; zero references to whatsapp tables (grep-verified)
- **Layer**: Backend service
- **Problem**: mutation contract claims permanent PII erasure, but `whatsapp_contacts` (phone_number/full_name/first_name, whatsapp-contacts.ts:32-36), `whatsapp_conversations` (wa_id/display_name/last_message_preview, :32-37) and `whatsapp_messages` bodies persist — subject stays re-identifiable by phone.
- **Fix**: inside the same `db.transaction`, capture users.phone / parents.whatsapp before nulling; null/mask matching whatsapp_contacts and whatsapp_conversations rows (wa_id is partial-unique — nulling drops the row from it); delete/anonymize subject's message content per a documented retention policy.
- **i18n**: any new error keys atomic (types+en+ar). **Types**: none new. **Tests**: extend anonymization service test (WhatsApp rows scrubbed).

### H3 — Anonymization leaves physical files and avatarFilePath (photos, payment proofs persist in storage)
- **File**: `backend/services/users/user-anonymization.service.ts`
- **Line**: ~:65-79 (sets `avatarUrl: null` but never `avatarFilePath` — users.ts:36; never deletes files linked via user_files/teacher_files/student_files/parent_files junctions, storage.ts:37-101)
- **Layer**: Backend service + storage
- **Problem**: the person's photograph and uploaded documents remain in storage after "irreversible" anonymization.
- **Fix**: set `avatarFilePath: null` in the users update; delete (same transaction or enqueued cleanup) physical files linked via the junction tables for the anonymized ids; reuse the existing StorageService deletion path if present.
- **i18n**: atomic keys if new. **Tests**: extend service test.

### H4 — Vercel blob "private by default" not enforced on the primary client upload path (private files become public blobs) ✅ IMPLEMENTED 2026-09-18
- **File**: `frontend/common/utils/storage/uploadClientFile.ts:64` (+ `app/api/storage/vercel-upload/route.ts`)
- **Layer**: Frontend util + storage
- **Problem**: client SDK upload hardcoded `access: "public"` for ALL uploads incl. non-public paths (learning resources at bare `path: file.name` — useResourcesViewModel.ts:183); `access` is NOT token-encoded in @vercel/blob (client-controlled `x-vercel-blob-access` header), so server-side resolveBlobAccess/adapter flip only reached server-side put() and an advisory prepareUpload result. Compounded by moveVercelBlob copy() hardcoding public (see M18). Net: app ACL (storage.service.ts:254) bypassed for any known/guessable blob URL.
- **Fix (implemented)**: `uploadViaVercelBlob` now uses the `access` returned by the server's prepareUpload GraphQL result (`UploadPreparation.access`, adapter-derived via resolveBlobAccess), defaulting to `"private"` when absent (signature stable); server-side enforcement probe added in `onUploadCompleted` — non-`public/` blobs fetched anonymously, 2xx → `del()` + security warn (try/catch-guarded); plus M19 fail-closed magic bytes below.
- **i18n**: No new keys. **Types**: None. **Tests**: 3 new cases in vercel-upload route.test.ts (probe-deletes anonymously-readable non-public blob; magic-byte failure deletes; public/ lenient) — 8/8 pass.

## MEDIUM Severity

### M1 — recordPayment missing notImpersonating (round-1 M1 invariant gap)
- **File**: `backend/graphql/mutation/billing/billing-payments.mutation.ts:19`
- **Layer**: Backend GraphQL
- **Problem**: bare `authScopes: { loggedIn: true }`; resolver permission check runs against `requireAuth(ctx)` = effective (impersonated) identity. Every sibling billing mutation in this changeset uses `$all: { ..., notImpersonating: true }`. An admin impersonating a user with BILLING_UPDATE_STATUS_PAID can execute a financial write attributed to the impersonated identity.
- **Fix**: wrap in `authScopes: { $all: { loggedIn: true, notImpersonating: true } }`; verify whether the permission check should move into authScopes for uniformity.
- **i18n / Types**: None. **Tests**: add recordPayment FORBIDDEN-under-impersonation case to impersonation.auth-scopes.test.ts pattern.

### M2 — Key derivation is unsalted single SHA-256, not a KDF
- **File**: `backend/lib/field-encryption.ts:15`
- **Layer**: Backend lib (crypto)
- **Problem**: SHA-256 of raw `DATABASE_ENCRYPTION_KEY`; production gate (:10) checks only 32-char length → human passphrase brute-forceable at SHA-256 speed by a DB-dump attacker.
- **Fix**: scrypt/PBKDF2 with per-deployment salt (stored in key header) or require 32-byte decoded entropy (validated base64/hex); reject known weak constants (ties L-D). ORDERING: changes all existing ciphertext unless versioned dual-read — see R3.
- **i18n / Types**: None. **Tests**: field-encryption unit tests.

### M3 — No AAD, no key-version, single key across domains
- **File**: `backend/lib/field-encryption.ts:18-27`
- **Layer**: Backend lib (crypto)
- **Problem**: ciphertext `iv:ct:tag`; `setAAD` never called; same key covers teachers/parents PII, env-config secrets, bank details, WhatsApp/meeting tokens → SQL-write attacker can splice values across rows/columns/tables; no rotation dual-read window.
- **Fix**: `cipher.setAAD(\`${table}:${column}:${rowId}\`)`, prefix key-version (`v1:iv:ct:tag`), HKDF per-domain subkeys; decrypt dispatches on version prefix (legacy un-prefixed accepted only during migration window — see R3).
- **i18n / Types**: None. **Tests**: field-encryption unit tests + backfill re-encryption.

### M4 — decryptField fail-open legacy passthrough
- **File**: `backend/lib/field-encryption.ts:37-49`
- **Layer**: Backend lib (crypto)
- **Problem**: values not shaped `a:b:c` returned as-is with once-per-process warn → SQL-write attacker can plant plaintext in encrypted PII columns and the app consumes it; legacy plaintext indistinguishable forever.
- **Fix**: explicit migration window (env flag + deadline), per-column legacy-row counts, then throw on non-ciphertext; backfill tags rows instead of shape-sniffing. ORDERING: land AFTER backfill completes (R3).
- **i18n / Types**: None. **Tests**: field-encryption unit tests.

### M5 — REDIS_URL credentials plaintext at rest and in audit logs
- **File**: `backend/lib/env-config-keys.ts` (~:255-262) + `backend/services/system/environment-config.service.ts` (~:729 store, :876-888 audit)
- **Layer**: Backend service + config
- **Problem**: descriptor `maskUrlCredentials: true, isSecret: false` — value stored verbatim in system_settings; `auditEnvConfigChange` masks only `isSecret` keys, so every upsert persists the raw `redis://user:pass@host` into audit_logs newState (raw value passed as auditValue from environment-config.mutation.ts:32). Two tables leak the Redis password.
- **Fix**: set `isSecret: true` on REDIS_URL (display path already masks URL creds; `decryptDbOverrideIfSecret` passes legacy plaintext rows through) AND/OR extend the audit masking branch to apply `sanitizeUrlCredentials` for `maskUrlCredentials` keys on both priorValue and newValue.
- **i18n / Types**: None. **Tests**: environment-config service tests (audit row masking for maskUrlCredentials keys).

### M6 — Env-secret backfill script cannot ship (type error)
- **File**: `scripts/encrypt-env-config-secrets.ts:46`
- **Layer**: Scripts
- **Problem**: `setting.value == null` compares the non-nullable `systemSettings.value` (`textColumn("value").notNull()`, backend/db/schema/shared/settings.ts:17) → type-check failure (known lint:type-aware error). Until it runs, pre-existing plaintext secret overrides stay readable at rest and M4's passthrough keeps resolving them.
- **Fix**: guard on `setting.value === ""` only; add dry-run count == 0 verification gating deployment.
- **i18n / Types**: None. **Tests**: backfill dry-run test.

### M7 — dateOfBirth/nationality/countryCode/gender exposed without identity-view scope (teacher)
- **File**: `backend/graphql/pothos/teachers/staff-profile.pothos.ts` (:31 dateOfBirth; also nationality, countryCode, gender ungated)
- **Layer**: Backend GraphQL
- **Problem**: no field-level authScopes while sibling `nationalId` (:24) and `address` (:33) require `PROFILE_TEACHER_IDENTITY_VIEW_OTHER`; service masks only nationalId (staff-profile.service.ts:23-27). A holder of PROFILE_TEACHER_PROFESSIONAL_EDIT_OTHER reads cleartext DOB etc. via teacherProfileForEdit/teacherAdminProfile — newly encrypted PII through an unguarded field.
- **Fix**: gate all four with `PROFILE_TEACHER_IDENTITY_VIEW_OTHER` + mask DOB (year-only) in `toMaskedTeacherProfile`.
- **i18n / Types**: None. **Tests**: staff-profile pothos/service tests (field gating for non-identity holders).

### M8 — Lookup-dependent PII stays plaintext, no blind-index design
- **File**: `backend/db/repo/users/user.repository.ts:58` (users.phone equality findByPhone); `backend/db/schema/students/students.ts:129` (date_of_birth indexed); `backend/db/schema/whatsapp/whatsapp-contacts.ts:32` (phone_number unique)
- **Layer**: Database repo + schema
- **Problem**: same PII classes the workstream just encrypted remain cleartext; encryptedText can't serve equality/uniqueness lookups.
- **Fix**: HMAC-SHA256 blind-index columns (key = HKDF(master, info="blind-index"), separate from AEAD key) for equality/uniqueness, then convert columns to encryptedText; note whatsapp_contacts duplicates parents.whatsapp data.
- **i18n / Types**: schema migration + repo changes. **Tests**: repo tests.

### M9 — Anonymization misses teacher/student identity fields
- **File**: `backend/services/users/user-anonymization.service.ts` (~:96-114)
- **Layer**: Backend service
- **Problem**: teachers.nationality/gender/countryCode (teachers.ts:27,33,36) and students.gender/language/timezone_override (students.ts:63-65) survive (parent scrub DOES null nationality — asymmetric).
- **Fix**: extend scrub objects; add a schema-to-scrub coverage test that fails when any PII-bearing column lacks a scrub entry.
- **i18n / Types**: None. **Tests**: coverage test + service test.

### M10 — Anonymization misses communications PII
- **File**: `backend/services/users/user-anonymization.service.ts` + `backend/db/schema/communications/communications.ts`
- **Layer**: Backend service
- **Problem**: complaints.submitterEmail (:159) + body, suggestions.submitterName (:208) + body, notification_deliveries title/body/webhook_payload (:115-119), user_device_tokens.token/deviceName (:76-78) all persist post-erasure.
- **Fix**: scrub/soft-delete complaints & suggestions within the transaction, delete device-token rows, purge deliveries per documented retention policy.
- **i18n / Types**: None. **Tests**: extend service test.

### M11 — Irreversible anonymizeUser needs re-auth + rate limit
- **File**: `backend/graphql/mutation/profile/user-anonymization.mutation.ts:9-31`
- **Layer**: Backend GraphQL
- **Problem**: no password re-confirmation (sudo mode), no rate limit; a hijacked 7-day session can bulk-erase users.
- **Fix**: recent-authentication check (re-verify actor's password via existing password-verification helper; `confirmPassword` arg, maxLength 128 constraint) + per-actor rate limit (reuse `checkRateLimit`/fail-closed limiter pattern from auth.mutation.ts); consider two-step dry-run/confirm given irreversibility.
- **i18n**: atomic keys if new. **Types**: arg addition. **Tests**: rate-limit + wrong-password cases.

### M12 — Immutable audit rows retain erased persons' identifiers (Art. 17 gap)
- **File**: `backend/db/repo/audit/audit-masking.helpers.ts:3-6` (+ trigger in `backend/db/schema/audit/audit.ts:14-23`)
- **Layer**: Database repo
- **Problem**: audit_logs/admin_audit_logs intentionally keep name/email and are UPDATE/DELETE-blocked by prevent_audit_modification trigger. The new erasure feature doesn't document or scope this.
- **Fix**: document the legal basis (statutory retention) in the mutation contract, or add a controlled break-glass redaction pathway.
- **i18n / Types**: docs/contract text. **Tests**: none.

### M13 — Students scrub RLS posture + no affected-row assertion (silent partial anonymization risk)
- **File**: `backend/services/users/user-anonymization.service.ts`
- **Line**: :110-114 (bare `t.update(students)` with no returning()/count assertion); students has FORCE RLS with fail-closed current_user_id() policies (`backend/db/migration/49-rls-guc-fail-closed.sql`); the service opens db.transaction without withCurrentUser
- **Layer**: Backend service + RLS
- **Problem**: Production code never sets app.current_user_id — under the GUC-scoped posture the codebase prescribes, the UPDATE matches zero rows and the mutation still returns anonymized: true. Relies on ambient BYPASSRLS today.
- **Fix** (plan-review corrected): route the students scrub through a repository method (students repo, `tx` threaded — repositories are the only layer that touches the DB; do NOT add inline `t.select`/`t.update` to the service) that returns `{ priorCount, scrubbedCount }` via `.returning()`, wrap the execution in withCurrentUser (exists at `backend/db/repo/shared/with-current-user.ts` — confirmed not test-only), and throw a **localized DomainError** (not a raw English `Error`) on mismatch. (Verify production role BYPASSRLS — see VERIFY V-D.)
- **Code change** (current, in service):
```ts
      await t
        .update(students)
        .set({ name: DELETED_USER_NAME, dateOfBirth: null, avatarUrl: null, updatedAt: now })
        .where(or(eq(students.userId, userId), parent ? eq(students.parentId, parent.id) : undefined));
```
proposed (repo method in the students repo, e.g. `scrubForAnonymization(tx, { userId, parentId })` → `{ priorCount, scrubbedCount }`; service side):
```ts
      const { priorCount, scrubbedCount } = await StudentsRepository.scrubForAnonymization(t, {
        userId,
        parentId: parent?.id ?? null,
      });
      if (scrubbedCount !== priorCount) {
        throw new DomainError(tErrors.error.anonymizationScrubMismatch);
      }
```
- **i18n / Types / Tests**: NEW key `error.anonymizationScrubMismatch` — must land atomically in `shared/locale/types/errors` + `shared/locale/en/errors` + `shared/locale/ar/errors` before use (verify key naming against existing error type-schema conventions). Tests: anonymization mismatch-throw case (try/catch pattern); RLS-scoped integration test.

### M14 — Platform IP headers returned verbatim (rate-limit bucket rotation; round-1 L18 root)
- **File**: `backend/graphql/gqlContextFactory.ts` (+ `backend/lib/ratelimit.ts`)
- **Line**: gqlContextFactory.ts:143-153 (`x-vercel-forwarded-for` / `cf-connecting-ip` returned with only `.trim()`, no isIP()); same pattern in `getClientIdentifier` (ratelimit.ts:376-387)
- **Layer**: Backend GraphQL + lib
- **Problem**: raw string becomes the auth rate-limit bucket key (auth.mutation.ts:329,455,509) — if chain passthrough is client-influenced, attacker rotates buckets per request (10/15-min limit bypass); audit records degrade. Escalate to HIGH if passthrough confirmed for deployment.
- **Fix**: `sanitizeIpAddress()`/`isIP()` at extraction; parse comma lists, keep last valid entry, fallback shared bucket. Leftmost-vs-last trust semantics stay VERIFY (V-F).
- **i18n / Types**: None. **Tests**: gqlContextFactory IP extraction tests (comma lists, IPv6, invalid entries).

### M15 — Raw client IP logged on 429 ✅ IMPLEMENTED 2026-09-18
- **File**: `app/api/storage/upload/[id]/route.ts:246`
- **Layer**: App Router API
- **Problem**: `logger.warn("Storage upload rate limit exceeded", { tokenId, rateLimitKey })` embedded the raw client IP — contradicting the codebase's `rateLimitLogId` convention (ratelimit.ts:254-263). Fires at high volume during floods.
- **Fix (implemented)**: logs `rateLimitLogId(rateLimitKey)` (keeps `tokenId`); `rateLimitLogId` exported from `backend/lib/ratelimit.ts` + re-exported via the `backend/lib/index.ts` barrel.
- **i18n / Types**: None. **Tests**: none for this route; log redaction covered by existing limiter tests.

### M16 — node-count-limit fragment amplification
- **File**: `backend/graphql/shared/node-count-limit.ts:15-24`
- **Layer**: Backend GraphQL
- **Problem**: Field/InlineFragment/FragmentSpread each count 1; a fragment's body is counted once at definition while each spread adds 1 → a ~1000-field fragment spread ~999 times counts ~2000 (budget MAX_GRAPHQL_NODE_COUNT=2000, app/api/graphql/route.ts:42) but executes ~10^6 field selections in ONE operation; batch ≤10 multiplies ×10 (per-op rate-limit units are the compensating control). Explicitly blessed by node-count-limit.test.ts:86-108.
- **Fix**: on FragmentSpread add the fragment's precomputed node count (NoFragmentCycles guarantees acyclicity); keep the budget at 2000 unless real dashboard queries measure comfortably lower (R5).
- **i18n / Types**: None. **Tests**: node-count-limit.test.ts updates (fragment amplification case). See R5.

### M17 — Profit-loss double FX conversion N+1 (up to ~3k queries/report)
- **File**: `backend/services/accounting/profit-loss.service.ts` (+ `backend/services/accounting/profit-loss-helpers.ts`)
- **Line**: service page-builder maps :113-123 (payments), :166-172 (expenses), :209-215 (adjustments) each convert per row AND `aggregateWithFx` re-converts (helpers :72-77); every convertCurrency is an unmemoized `getLatestExchangeRateForDisplay` DB read (helpers :38 → `backend/db/repo/billing/billing.repository.ts:188-202`)
- **Layer**: Backend service (accounting)
- **Problem**: At 500 rows/tab × 3 tabs ≈ 3,000 redundant queries per report (~30k per batched request). Gated by admin permission + export limiter → DB-load hardening.
- **Fix** (plan-review corrected): cache the FX **rate lookup** per `(from, to)` pair per request — NOT a converted amount (an earlier snippet cached a first-row amount under the pair key, corrupting every later row). Add a request-scoped memoized lookup factory in the helpers, thread it through `convertCurrency`/`aggregateWithFx` via an optional param, and have the service create ONE lookup per report request; prefer passing the service's already-computed per-row `convertedAmount` into `aggregateWithFx` so rows are converted exactly once. No non-null assertions (oxlint rejects `rate.rate!`).
- **Code change** (helpers, current):
```ts
export async function convertCurrency(amount: string, from: CurrencyCode, to: CurrencyCode): Promise<string | null> {
  if (from === to) {
    return toTwoDecimalString(Number.parseFloat(amount));
  }
  const latest = await BillingRepository.getLatestExchangeRateForDisplay(from, to);
  if (latest.rate == null || latest.stale) {
    return null;
  }
  return multiplyAmountByRate(amount, latest.rate);
}
```
proposed:
```ts
export type FxRateLookup = (
  from: CurrencyCode,
  to: CurrencyCode
) => Promise<{ rate: number; stale: boolean } | null>;

/** Request-scoped memoized FX lookup: one DB read per (from, to) pair, shared by all rows in the report. */
export function createFxRateLookup(): FxRateLookup {
  const cache = new Map<CurrencyCode, Map<CurrencyCode, Promise<{ rate: number; stale: boolean } | null>>>();
  return (from, to) => {
    if (from === to) return Promise.resolve({ rate: 1, stale: false });
    const byTarget = cache.get(from) ?? new Map<CurrencyCode, Promise<{ rate: number; stale: boolean } | null>>();
    let pending = byTarget.get(to);
    if (!pending) {
      pending = BillingRepository.getLatestExchangeRateForDisplay(from, to).then(latest =>
        latest.rate == null || latest.stale ? null : { rate: latest.rate, stale: latest.stale }
      );
      byTarget.set(to, pending);
    }
    cache.set(from, byTarget);
    return pending;
  };
}

export async function convertCurrency(
  amount: string,
  from: CurrencyCode,
  to: CurrencyCode,
  rateLookup: FxRateLookup = createDbRateLookup // default keeps today's per-call DB read for existing callers
): Promise<string | null> {
  if (from === to) {
    return toTwoDecimalString(Number.parseFloat(amount));
  }
  const latest = await rateLookup(from, to);
  if (latest == null) {
    return null;
  }
  return multiplyAmountByRate(amount, latest.rate);
}
```
Service side: one `const rateLookup = createFxRateLookup()` per `getReport` call, threaded into the page-builder conversions and `aggregateWithFx` (add the optional `rateLookup` param there and forward it to `convertCurrency`); where the page builder already computed `convertedAmount`, pass it through instead of re-converting.
- **i18n / Types / Tests**: None. Tests: profit-loss helpers tests (memoized rates — single fetch per (from,to); identical converted values across rows sharing a pair).

### M18 — Rename/move re-publishes private blobs public ✅ IMPLEMENTED 2026-09-18
- **File**: `backend/storage/disk/vercel/operations/file.operations.ts` (+ copy.operations.ts, move.operations.ts)
- **Line**: file.operations.ts:136 (`moveVercelBlob` copy() hardcoded `access: "public"`); copy.operations.ts:44,71 and move.operations.ts:79,110 used raw `ctx.access` without resolveBlobAccess
- **Layer**: Backend storage operations
- **Problem**: A private file renamed/moved became a public blob at its new URL regardless of VERCEL_BLOB_ACCESS=private.
- **Fix (implemented)**: `resolveBlobAccess(ctx.access, <destination path>)` at all copy/move sites.
- **i18n / Types**: None. **Tests**: no operations tests existed.

### M19 — hasValidMagicBytes fails open ✅ IMPLEMENTED 2026-09-18
- **File**: `app/api/storage/vercel-upload/route.ts:151-166`
- **Layer**: App Router API + storage
- **Problem**: fetch error/non-2xx/206/empty body/thrown → returned true (blob accepted). If the Range+Bearer fetch silently fails in a deployment, image magic-byte verification is disabled with only an error log.
- **Fix (implemented)**: fails CLOSED for non-`public/` paths — on fetch failure the blob is deleted (same del() path as definitive mismatch), `logger.error` includes pathname; `public/` paths keep lenient behavior with an explanatory comment.
- **i18n / Types**: None. **Tests**: 3 new cases in vercel-upload route.test.ts — 8/8 pass.

## LOW Severity (new this round)

| # | File:Line | Finding | Fix |
|---|---|---|---|
| L-A | `backend/db/schema/__shared__/dialectAwareBuilder.ts:279,283` | `toDriver(null)` returns "" — NULL never round-trips on encrypted columns; reads come back "" via legacy passthrough; not-set vs blank distinction lost | Let null pass as NULL; map "" → null in fromDriver |
| L-B | `backend/lib/payment-method-jsonb.ts:43` | `plain ?? value` surfaces STORED ciphertext into domain object when GCM auth fails (e.g. after key rotation); owners with revealSensitive see raw ciphertext as IBAN/accountNumber | Propagate null on decrypt failure; callers mask/omit |
| L-C | `scripts/encrypt-legacy-pii.ts:35,71` | skip-regex `/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/` looser than canonical `isEncryptedFieldValue` (fixed 24-hex IV / 32-hex tag) — plaintext like "010:123:4567" classified encrypted, never migrated, decryptField then returns null (silent data loss) | Import `isEncryptedFieldValue` from env-config.helpers |
| L-D | `backend/lib/field-encryption.ts:10-11` | Prod strength gate length-only → committed CI fallback constant `development-database-encryption-key-must-be-changed-in-production` (`.github/workflows/ci.yml:98`, graphql.yml:59) would pass in production | Blocklist known dev constant; require decoded 32-byte entropy |
| L-E | `backend/services/accounting/profit-loss-helpers.ts:87` | Float money math end-to-end (parseFloat :24,:35; float accumulation :87; service float addition :135) vs API contract "precision-safe decimal strings" (profit-loss.pothos.ts:215); sub-cent drift over 10k rows; toFixed(2) vs banker's rounding | Integer minor units or decimal library; at minimum round per-conversion |
| L-F | `backend/services/accounting/profit-loss-helpers.ts:166` | MAX_PAGE_LIMIT=500 exceeds repo-wide clamp 200 (backend/types/shared/pagination.types.ts:37) → 1,500 rows/request possible | Align to 200 or document delta |
| L-G | `backend/graphql/query/books/book.query.ts:22` | booksAndBags → `BookService.listBooks` → unbounded `findMany()` (backend/services/resource/book.service.ts:18) — unbounded full-table read from GraphQL (RESOURCES_LIST-gated) | Default PaginationArgs ≤200 or explicit .limit() |
| L-H | `app/api/accounting/reports/export/route.ts:83-88` | Local UUID_SHAPE/isUuidShape duplicate of canonical `backend/lib/id-shape.ts:9` | Import canonical, delete local copy |
| L-I | `test/security/multi-account-bola.test.ts:84` | No BOLA cases for new admin money surface (ProfitLossService.getReport / 4 export routes rely solely on requirePermission, negative tests mock-based) | Add parent_default/teacher_default → ForbiddenError/403 journey cases |
| L-J | `app/api/storage/upload/[id]/route.ts:326` | processUpload returns raw error.message for non-UploadStreamError failures — fs/stream errors embed absolute server paths (pre-existing but diff touched the catch) | Localized `tErrors.file.failedToWriteFile` for unexpected errors — verify key exists in `shared/locale/{types,en,ar}/errors` FIRST; land atomically if missing |
| L-K | `backend/storage/disk/local/utils.ts:34` | getAbsolutePath check-then-use TOCTOU: realpath containment runs before caller opens path; dangling symlink final component passes via basename re-attach + lexical check → createWriteStream follows planted symlink outside base (requires pre-existing local write access — hardening) | O_NOFOLLOW / re-assert containment on realpath'd result at open; lstat final component |
| L-L | `backend/db/repo/shared/signedUrl.repository.ts:42` | getLatestByFilePath = "newest mint wins" provenance — STORAGE_MANAGE holder can mint newer unused session for a path and false-deny the real uploader (billing-payment-proof.helpers.ts:45-47) or claim provenance | Persist uploadedByUserId on file row at finalize; check that |
| L-M | `backend/lib/ratelimit.ts:235` | storageUploadRateLimiter & exportRateLimiter constructed failOpen:true, no call site passes failOpen:false (contrast oauth-callback-handler.ts:56-58 fail-closed) — cache outage unbounds CPU-heavy exports/uploads | failOpen:false at construction/call sites, or document tradeoff |
| L-N | `backend/graphql/mutation/auth/auth.mutation.ts:140-160` | checkAuthRateLimitBounded in-process fallback unreachable: checkRateLimit never throws (ratelimit.ts:318-326 catches all, returns fail-closed result) — dead code with misleading "without falsely rejecting" comments; effective outage behavior = all logins rejected | Delete fallback or invoke on fail-closed sentinel result (policy decision) + fix comments |
| L-O | `backend/services/auth/__shared__/simulationBase.ts:13-21` | writeSimulationAuditLog inserts adminAuditLogs directly, bypassing maskAuditPayload; metadata JSONB stored raw (mapSingleAuditLogRow masks only previousState/newState/changes, audit.repository.ts:45-50) | Route through AuditRepository; mask metadata too |
| L-P | `app/logout/route.ts:93-95` | New sec-fetch-site cross-site guard added to GET only; POST lacks it → cross-site auto-submitting form still force-logouts; GET guard skipped when header absent | Apply same check in POST (+ Origin check) |
| L-Q | `backend/services/auth/session.service.ts:172-174` | Logout revokes server-side only when session_id cookie present (`if (!sessionId) return false`) — stolen refresh token (jti-bound) can mint new session up to 7 days if victim logged out while cookie lost | When session_id absent but refresh_token present: decode + deleteByUserId sessions |
| L-R | `backend/services/meeting/integrations/meeting-oauth.service.ts:179` | OAuth state jwtVerify missing `algorithms: ["HS256"]` pin that the same workstream added to access-token verify (jwt.ts:104) — inconsistent hardening (jose restricts to HS* anyway) | Add algorithms pin |
| L-S | `backend/services/auth/login-audit.service.ts:15-19,77-81` | Unknown-email failures persist 16-hex (64-bit) truncated SHA-256 of email — low-entropy, SETTINGS_AUDIT_VIEW holders can dictionary-recover offline | Full 64-hex digest or keyed HMAC |
| L-T | `backend/graphql/gqlContextFactory.ts:170-173` | Production no-trusted-source fallback = shared "anon:unknown" bucket for everyone — self-hosted without TRUSTED_PROXY: attacker trivially locks out ALL anonymous logins/complaints/suggestions (documented fail-conservative tradeoff) | Larger shared-bucket allowance for anonymous contexts or repeated-hit operational alert |
| L-U | `backend/db/repo/audit/audit-masking.helpers.ts:12-27,39-41` | Masking exact-key case-sensitive, suffix-blind (passwordHash/apiKey/clientSecret variants pass), stops below depth 8 (MAX_AUDIT_MASK_DEPTH) — test documents the gap (audit-masking.helpers.test.ts:95-96); write-path only, no historical backfill (audit.repository.ts:45-48) | Case-insensitive/substring matching; mask whole subtree past depth cap; one-time re-mask migration |
| L-V | `backend/enum/audit/audit.enum.ts` + `backend/types/audit/audit.types.ts` | ~~USER_ANONYMIZED missing from AuditAction union/AUDIT_ACTION_VALUES~~ **NOW LANDED by the in-flight workstream** (both files now include it alongside LOGIN_SUCCESS/LOGIN_FAILED) — residual: verify the GraphQL filter enum mirror + any parity/drift test also cover it; audit row omits ipAddress despite ctx support | Verify mirrors; pass sanitized ctx IP to createManyAdminAuditLogs |
| L-W | `backend/db/schema/users/users.ts:64` | Anonymization leaves sessions/session_metadata (payload/IP/UA), authRateLimits.email (:128-145), password_reset_tokens.email (:112-127) — sessions purged only lazily on next request; email-keyed rows never scrubbed | Delete sessions/session_metadata/device tokens in the anonymization transaction; clear email-keyed rows |
| L-X | `app/api/storage/vercel-upload/route.ts:229-236` (+ `shared/utils/storage.utils.ts:2-23`) | Dual inconsistent MIME allowlists: declared contentType validated against WIDER shared list (adds text/plain, zip, mp4, fonts) while Vercel token enforces NARROW backend/lib/storage/mime-allowlist.ts:14-27 — validateUpload misleads about real policy | validateUpload consumes backend ALLOWED_MIME_TYPES |

## Round-1 LOW items re-check (L1–L23)

- **STILL-OPEN (19)**: L1 book.query.ts:14; L2 report.query.ts:18; L3 student-history.query.ts:21; L4 complaint.mutation.ts:30 (+suggestion:38, complaintResponses:29, shared/auth-rate-limit.ts:10, auth.mutation.ts:509 — no NEW spread); L6 query.extensions.ts:45 (regex `/[&|!():]/g` only); L7 accounting.pothos.ts:114,137,167,178; L8 expense.pothos.ts:104,132,145; L9 carryover.mutation.ts:140; L12 stringMapScalar.ts:31,39,54 / localizedStringScalar.ts:25,35,40 / ianaTimezoneScalar.ts:38 (echoes raw input); L13 leave-request.service.ts:67,222; L14 shared/demo-users.ts:18 (optional); L15 .github/workflows/ci.yml:103 + graphql.yml:64; L16 scripts/health/sonar/ts/config.ts:41; L18 gqlContextFactory.ts:143 (=M14); L19 app/api/set-locale/route.ts:88-102 (origin check only in POST :109-110); L20 notification-dispatch.helpers.test.ts:77 — undercount: 16 test files use scattered `TestPass-${randomUUID().slice(0,8)}!` copies, canonical `generateTestPassword()` at backend/db/test/test-utils.ts:15, duplicate local defs at admin-password.repository.test.ts:14 + admin-reset-password.service.test.ts:16; L21/V9 student-onboarding.pothos.ts:29-32 (maxLength 128 only; service skips validatePasswordStrength — student-onboarding.service.ts:37-53 vs teacher passing true); L22 proxy.ts:27 (by design); L23 permission-management.service.ts:255 (slug probe LIKE unescaped — no SQLi, wildcard matching risk).
- **NOW-FIXED (1)**: L10 — profit-loss pagination now clamped by `validatePagination` (backend/services/accounting/profit-loss-helpers.ts:174-195, invoked profit-loss.service.ts:252).
- **DRIFTED (3)**: L5 → auth.mutation.ts:322 (`ctx.ipAddress ?? "127.0.0.1"` — shared localhost bucket, demoLogin :452, refreshToken `?? "[unknown]"` :509); L11 → accounting.mutation.ts:79-80,92 (hardcoded English requireString messages); L17 → ratelimit.ts:302-314 (dev log-and-allow; IP hashing improved).
- **OBSOLETE (0)**.

## Round-1 VERIFY items re-check

- **V1** → CONFIRMED-OPEN, escalated to **H1** (implemented).
- **V4** → MITIGATED for image/XSS vectors: server-side allowedContentTypes token constraint (vercel-upload route.ts:276 + mime-allowlist.ts:9-27), maximumSizeInBytes=100MB (:280), magic-byte verification with blob deletion (:302-311). Residuals: fail-open behavior (M19 — implemented), non-image types unverified + extension/contentType cross-check missing (V-G), dual allowlists (L-X).
- **V5** → PARTIALLY-MITIGATED: nodeCountLimit(2000) added at app/api/graphql/route.ts:42,106 (validation phase, fails closed, aliases/inline fragments counted). Residual: fragment amplification (M16) + batch multiplication.
- **V6** → PARTIALLY-MITIGATED: new profit-loss GraphQL layer clean (pure exposes over one service call; subtract-credits fetched in single batched query). Residual: service-layer double-FX N+1 (M17); booksAndBags unbounded (L-G).
- **V2** (proxy.ts:84-86 x-pathname/x-search reflection) → STILL-OPEN; practical CRLF exploitability low (NextURL preserves percent-encoding; Headers.set rejects raw CR/LF) but no CR/LF stripping added.
- **L18** → STILL-OPEN (= M14). **L19** → STILL-OPEN. **L4/L5/L17** → STILL-OPEN/drifted as above.

## VERIFY Items (this round)

| # | File:Line | Suspicion | How to confirm |
|---|---|---|---|
| V-A | `backend/graphql/pothos/parents/parent-profile.pothos.ts:31,33` + parent-portal.pothos.ts:48,50 | Parent address/whatsapp (newly encrypted) have no field-level authScopes (unlike teacher model) | Confirm policy: gate with parent VIEW_OTHER permission or document contact-info-by-design |
| V-B | `backend/services/accounting/profit-loss.service.ts:123,172,215` (+ pothos descriptions :109,155,199) | Tab aggregates (→ summary/netProfit/margin + summary CSV) computed over FETCHED PAGE rows only (default 50; cap 500), not full month — official accounting exports materially understated for >50-row months vs "aggregates over the whole accounting month" docstrings | Confirm product intent; fix = SQL month-wide SUMs independent of pagination |
| V-C | `backend/services/accounting/profit-loss.service.ts:133,135,141-142` | subtractCreditsTotal adds hour-delta SUBTRACT adjustments (credit.repository.ts:493-510 returns currency:null) directly into FX currency sums → unit-mixed totalPayments feeding Net Profit | Confirm SUBTRACT semantics with accounting owner; exclude or convert |
| V-D | `backend/services/users/user-anonymization.service.ts:110-114` | Students scrub silently no-ops if prod role lacks BYPASSRLS (FORCE RLS migration 49 + no withCurrentUser) | Verify prod role BYPASSRLS status; hardening = M13 |
| V-E | `next.config.ts:125-137` | "Fallback CSP" for `/(.*)` may double-set/conflict with proxy.ts:71-87 nonce CSP — intersection could block Next inline bootstrap scripts or kill nonce mechanism | Verify emitted headers on a prod build page route; scope to /(api|_next)/(.*) if duplicated |
| V-F | `backend/graphql/gqlContextFactory.ts:106-126` + ratelimit.ts:395-413 | Under TRUSTED_PROXY both extractors take LEFTMOST x-forwarded-for entry; nginx default appends → leftmost may be client-controlled (isIP validates format, not trust) | Confirm reverse-proxy XFF semantics; if append, take last entry or x-real-ip |
| V-G | `app/api/storage/vercel-upload/route.ts:302` | Only image/* magic-verified (isImageContentType gate :138); non-image declared types pass arbitrary bytes; extension never cross-checked against contentType; public blob URLs served by Vercel platform where app can't set nosniff/CSP | Probe a public blob URL for X-Content-Type-Options; extend signatures (%PDF-, PK\\x03\\x04, D0 CF 11 E0) or proxy-serve all blobs |
| V-H | `backend/graphql/pothos/students/student-onboarding.pothos.ts:29-32` | Confirmed still-open as L21: password policy not enforced on student onboarding path (schema-only maxLength 128) | Decide: enforce validatePasswordStrength like teacher path |
| V-I | `app/api/profit-loss/*/export/route.ts:32,62` | Impersonated financial exports attributed to impersonated identity (getServerUserContext returns effective userId; real admin in actorUserId never logged) | Confirm whether to log both identities and/or block exports under impersonation (consistent with mutations' notImpersonating) |

## Verified Clean / Holdchecks

- **Round-1 fixes INTACT (holdcheck-verified)**: M5 magic bytes (upload/[id]/route.ts:147-161,168; vercel-upload :302-311), M6 streamed byte cap (:140-145 + hash check), M7 private cache (files route :35,153,217), public-path-guard (files route :250-270 — only exact public/ prefix, avatars/ NOT exempt), cleanup-gate (cleanup/route.ts:42-53 + new rate limit placed after gate), uploader-binding (upload/[id]/route.ts:263-277; storage.service.ts:155,164-176; mint persists uploadedByUserId), attachment-disposition + nosniff + CSP sandbox + svg excluded from inline (files route :145,156-158,210-222), MIME allowlist excludes svg/html/js/xhtml/javascript (mime-allowlist.ts:14-27), validatePath traversal/null-byte/charset/1024 guard (storage.utils.ts:10-30).
- **Cipher core**: AES-256-GCM fresh random 12-byte IV per record, auth tag verified, decrypt failure → null never raw ciphertext (field-encryption.ts:16-27,61-64). Production fails closed on missing/short DATABASE_ENCRYPTION_KEY (module load). No dev fallback key constant in library code.
- **Teacher/parent directory search**: targets only users.name/email with escapeLikeWildcards; NO ilike/equality/orderBy on any encrypted column.
- **Profit-loss**: all 4 export routes 401→429(exportRateLimiter)→requirePermission(ACCOUNTING_PROFITS_VIEW, service :250) before any read; permission-before-validation ordering; CSV formula-injection neutralization (=/+/-/@/tab/CR + RFC4180, 10k cap + X-Export-Truncated, attachment, strict YYYY-MM validated before filename); pagination clamped; month calendar-validated + repo-level re-check (class-instances.ts:851); repos fully parameterized, empty inArray guarded; permission in enum + migration 50 granted only super_admin/academy_admin; nested types reachable only via gated root.
- **Billing regressions**: every multi-key authScopes in modified billing mutations $all-wrapped (M10 extended); round-1-M1 impersonation guard extended (accounting/payment-method/currency/fx/billing-management); billing-history queries tightened loggedIn→BILLING_VIEW_HISTORY; legacy export routes gained shared export limiter + UUID-shape validation; bola-suite changes only strengthen.
- **Anonymization**: mutation super-admin-gated ($all + notImpersonating), super-admin targets refused, re-run fails closed (soft-delete.repository.ts:76-88), single db.transaction all-or-nothing, tombstone email collision-safe (deleted_<id>@removed.invalid), no PII in audit row/logs, financial records preserved.
- **Auth/session**: JWT HS256-pinned verify + expiry (jwt.ts:104), prod requires ≥32-char JWT_SECRET; impersonation claims cross-checked vs DB with expiry (impersonation.service.ts:269-282); startImpersonation/adminResetPassword $all-wrapped + pinned by new test; gqlSchemaBuilder returns EFFECTIVE user superAdmin while impersonating (de-escalation); oauth callback PKCE + session-bound single-use state + fail-closed limiter; rateLimitLogId IP hashing in limiter warnings; login-audit stores no passwords, static strings only; bootstrap gate fails closed (TEST_HARNESS_KEY ≥32 + hard-deny on Vercel prod); demoLogin hard-blocked on Vercel + NODE_ENV=production.
- **GraphQL entry**: depth 7 + 256KB + batch ≤10 intact; introspection off + landing disabled in prod; no subscriptions; nodeCountLimit runs at validation phase (no fail-open path); storage-file ACL default-deny with owner/superAdmin/reference checks (storage.service.ts:243-283,301-316).
- **Scripts hygiene**: encryption scripts log key names/counts only, no values, no plaintext temp files, parameterized, LIMIT-capped.

## Risks

- **R1 (High)**: H1 fix ordering — add the invoice-route public/ guard FIRST, then change the seed prefix; existing environments with invoice_pdf rows under public/ need a data migration (filePath update), else those invoices break. *(Guard + seed change landed together 2026-09-18; data migration remains a follow-up for pre-existing environments.)*
- **R2 (High)**: H2/H3/M9/M10/L-W extension scope needs retention-policy decisions (WhatsApp message content, notification deliveries, audit identifiers) — legal/product input required before implementing; erasure scope expansion must stay inside the single transaction or be idempotent-enqueued.
- **R3 (Med)**: Crypto chain ordering (M2/M3/M4/M6/L-C/L-D): land M6 (fix backfill script) → run backfill → then M3 (AAD/key-version changes ciphertext format, needs re-encryption or dual-read) → only then tighten M4 (remove fail-open passthrough) or legacy plaintext rows throw. M2 key-derivation change invalidates ALL existing ciphertext — ciphertext has NO key-version/header today (verified in-source: `iv:ct:tag` only), so a dual-read migration is required.
- **R4 (Med)**: M5 isSecret flip on REDIS_URL — verify decryptDbOverrideIfSecret passthrough for legacy plaintext rows + display masking before flipping; audit-log re-mask needs the L-U backfill mechanism.
- **R5 (Med)**: M16 lowering node budget to 500 may break heavy legitimate dashboard queries — measure real queries before lowering; fragment-count change alters existing test expectations (node-count-limit.test.ts:86-108).
- **R6 (Med)**: H4 frontend change affects ALL client uploads — the onUploadCompleted probe adds per-upload latency and a Vercel API fetch; V-B/V-C accounting semantics need owner sign-off before changing totals users already see.
- **R7 (Med)**: M14 IP sanitization must respect the actual deployment's header trust (ties V-F) — wrong choice either re-opens bucket rotation or causes shared-bucket lockouts (L-T).
- **R8 (Low)**: M13 withCurrentUser + affected-row assertion — withCurrentUser confirmed to exist at backend/db/repo/shared/with-current-user.ts (not test-only), but verify RLS GUC behavior in the prod role (V-D) before relying on it.
- **R9 (Low)**: M11 re-auth UX for super-admin anonymization needs product decision; rate limit must not break the GraphQL test suite (test:graphql uses admin sessions repeatedly).
- **R10 (Low)**: Concurrent workstream — all fixes touch in-flight uncommitted files; implement only after that workstream lands, re-verifying each finding. *(The workstream was still active during implementation: audit enum values landed mid-session.)*
- **R11 (Low)**: Plan-review round 1 found 5 violations — M13 raw-English Error + inline Drizzle in service (corrected to repo-method + localized DomainError), M17 wrong cached-value snippet (corrected to rate-lookup factory), H1 `// H1:` comment tag (implemented code verified clean), L-J unverified locale key (atomic-landing step added). All folded into fix descriptions above.

## Testing

- **H1**: new test recommended in app/api/invoices/[id]/download route tests (public/ filePath → 500); storage files route test for public/invoices/ no longer unauthenticated after seed change.
- **H2/H3/M9/M10/L-W**: extend backend/services/users/user-anonymization.service.test.ts (WhatsApp rows scrubbed, files deleted/enqueued, field coverage); new schema-to-scrub coverage test.
- **H4/M19**: vercel-upload route tests (probe deletes publicly-readable non-public blob; magic-byte fail-closed) — landed, 8/8 pass.
- **M1**: impersonation.auth-scopes.test.ts pattern — add recordPayment FORBIDDEN-under-impersonation case.
- **M5/M6**: env-config service tests (audit row masking for maskUrlCredentials keys); backfill script dry-run test.
- **M7**: staff-profile pothos/service tests (field gating for non-identity holders).
- **M13**: anonymization mismatch-throw case (try/catch pattern); RLS-scoped integration test.
- **M14/V-F**: gqlContextFactory IP extraction tests (comma lists, IPv6, invalid entries).
- **M15/M18**: storage route/operations tests (log redaction; resolveBlobAccess on move/copy).
- **M16**: node-count-limit.test.ts updates (fragment amplification case).
- **M17**: profit-loss helpers tests (memoized rates — single fetch per (from,to); identical converted values across rows sharing a pair).
- **L-\***: respective unit tests; multi-account-bola additions (L-I).
- Round-1 blocked test files (`teachers/teacher-onboarding`, `parents/parent-onboarding`) re-run after the concurrent PII-encryption workstream lands; then a clean full `bun run test:graphql`.

## Files Changed Summary

| Fix | File | Severity | Description |
|---|---|---|---|
| H1 | `app/api/invoices/[id]/download/route.ts`, `backend/db/seeds/billing/seed-invoices.ts` | HIGH | public/-prefix guard + seed prefix move (IMPLEMENTED) |
| H2 | `backend/services/users/user-anonymization.service.ts` | HIGH | WhatsApp data scrub (pending) |
| H3 | `backend/services/users/user-anonymization.service.ts` | HIGH | Physical file + avatarFilePath erasure (pending) |
| H4 | `frontend/common/utils/storage/uploadClientFile.ts`, `app/api/storage/vercel-upload/route.ts` | HIGH | prepareUpload-provided access + anonymous-readability probe (IMPLEMENTED) |
| M1 | `backend/graphql/mutation/billing/billing-payments.mutation.ts` | MEDIUM | $all notImpersonating wrap (pending) |
| M2–M4 | `backend/lib/field-encryption.ts` | MEDIUM | KDF + AAD/key-version + bounded passthrough (pending, R3 ordering) |
| M5 | `backend/lib/env-config-keys.ts`, `backend/services/system/environment-config.service.ts` | MEDIUM | REDIS_URL isSecret + audit masking (pending) |
| M6 | `scripts/encrypt-env-config-secrets.ts` | MEDIUM | Backfill type fix + dry-run gate (pending) |
| M7 | `backend/graphql/pothos/teachers/staff-profile.pothos.ts` | MEDIUM | Identity-view gating + DOB masking (pending) |
| M8 | `backend/db/schema/`, `backend/db/repo/users/` | MEDIUM | Blind-index columns (pending) |
| M9–M13 | `backend/services/users/user-anonymization.service.ts` (+ repo, enum, mutation) | MEDIUM | Field/comms gaps, re-auth, row assertion (pending) |
| M14 | `backend/graphql/gqlContextFactory.ts`, `backend/lib/ratelimit.ts` | MEDIUM | IP sanitization at extraction (pending) |
| M15 | `app/api/storage/upload/[id]/route.ts` | MEDIUM | rateLimitLogId logging (IMPLEMENTED) |
| M16 | `backend/graphql/shared/node-count-limit.ts` | MEDIUM | Fragment-spread count fix (pending) |
| M17 | `backend/services/accounting/profit-loss-helpers.ts` (+ service) | MEDIUM | Rate-lookup memoization factory (pending) |
| M18 | `backend/storage/disk/vercel/operations/*` | MEDIUM | resolveBlobAccess on move/copy (IMPLEMENTED) |
| M19 | `app/api/storage/vercel-upload/route.ts` | MEDIUM | Fail-closed magic bytes (IMPLEMENTED) |
