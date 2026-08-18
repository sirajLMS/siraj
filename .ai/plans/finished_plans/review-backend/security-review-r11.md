# R11 Backend Security Review — Fix Plan

**Date:** 2026-09-16
**Review type:** Backend security review (`/backend-security-review`)
**Subagents:** 7 parallel explore agents (auth, sql, input, secrets, ratelimit, i18n, tests)
**Total findings:** 68 (5 HIGH, 21 MEDIUM, 35 LOW, 5 VERIFY, 1 INFO)

## Constraints
- NO commits, NO pushes
- Respect concurrent agent changes — don't revert others' work
- Ignore errors on files we didn't modify
- Fix ALL severities
- Ensure db and services tests still pass
- Respect AGENTS.md and instruction files

## Fix Batches (grouped by file ownership to avoid conflicts)

### Batch 1: Input Validation — HIGH (3 findings → 3 files)
- **H1**: `backend/graphql/pothos/billing/billing-management.pothos.ts:157` — Add `maxLength` to `exchangeRateSnapshot` arg
- **H2**: `backend/graphql/pothos/billing/payment-method.pothos.ts:294` — Add `maxItems` + `maxLength` to `urlAllowlist`
- **H3**: `backend/graphql/pothos/meeting/meeting.pothos.ts:155` — Add `maxItems` + `maxLength` to `urlAllowlist`

### Batch 2: i18n HIGH (2 findings → 1 file)
- **H4**: `backend/services/teacher/teacher-due.service.ts:148` — Replace hardcoded "hours must be greater than 0" with i18n
- **H5**: `backend/services/teacher/teacher-due.service.ts:149` — Replace hardcoded "amount must be non-negative" with i18n

### Batch 3: Rate Limit HIGH + MEDIUM (3 findings → 1 file)
- **M1**: `backend/lib/ip-utils.ts:2,16` — Fix IPv6 regex to handle IPv4-mapped + bracketed forms
- **M2**: `backend/lib/ip-utils.ts:12-16` — Handle IPv6 link-local zone id + bracketed form
- Note: M3 (fallback to shared IP) is a design concern, not a code fix — documented as VERIFY

### Batch 4: i18n MEDIUM — Service Layer (8 findings → 5 files)
- **M3**: `backend/services/profile/profile-field-filter.ts:136` — Use `tErrors.insufficientPermissions`
- **M16**: `backend/services/payment-method/payment-method-mask.ts:64,88,97,106` — 4x i18n
- **M17**: `backend/services/communication/channels/whatsapp/cloud-api/MetaCloudApiAdapter.ts:481,486,490` — 3x i18n
- **M18**: `backend/services/communication/channels/whatsapp/cloud-api/requests/send-template-message.request.ts:33,36,39,42` — 4x i18n
- **M22**: `backend/graphql/pothos/billing/currency-hedge.pothos.ts:66,95` — Add maxLength to 2x id args

### Batch 5: i18n MEDIUM — Repo Layer (11 findings → 7 files)
- **M4**: `backend/db/repo/classes/class-subject.repository.ts:118`
- **M5**: `backend/db/repo/complaints/complaint.repository.ts:149`
- **M6**: `backend/db/repo/students/student.repository.ts:588`
- **M7**: `backend/db/repo/parents/parent.repository.ts:949`
- **M8-M11**: `backend/db/repo/teachers/teacher-availability-bootstrap.repository.ts:57,75,122,164` — 4x i18n
- **M12**: `backend/db/repo/teachers/teacher-due.repository.ts:22`
- **M13-M14**: `backend/db/repo/scheduling/leave-quota-usage.repository.ts:41,54` — 2x i18n
- **M15**: `backend/db/repo/scheduling/class-instance-upsert.ts:224`

### Batch 6: i18n MEDIUM — GraphQL Scalars (2 files, 18 findings)
- **M19**: `backend/graphql/scalars/localizedStringScalar.ts` — 8x hardcoded GraphQLError
- **M20**: `backend/graphql/scalars/stringMapScalar.ts` — 10x hardcoded GraphQLError

### Batch 7: Auth MEDIUM (1 finding → 1 file)
- **M21**: `proxy.ts:27-88` — Edge middleware auth redirect (VERIFY — may be intentional Next.js 16 pattern)

### Batch 8: Test Passwords LOW (13 findings → 13 files)
- **T1**: `backend/db/test/test-utils.ts:66` — Replace bare `randomUUID()` with `TestPass-${randomUUID().slice(0,8)}!`
- **T2**: `backend/services/notification/notification-dispatch.helpers.test.ts:77` — Replace `crypto.randomUUID()`
- **T3-T13**: Replace `password: "password"` / `password: "hash"` with `TestPass-${randomUUID().slice(0,8)}!` pattern

### Batch 9: i18n LOW — Startup/Config throws (23 findings → ~12 files)
- All adapter/factory startup `throw new Error("... env required")` → convert to i18n keys
- Files: `BaseRedisAdapter.ts`, `UpstashRedisAdapter.ts`, `EntityCacheService.ts`, `WhatsappChannelFactory.ts`, `SmsChannelFactory.ts`, `TwilioSmsAdapter.ts`, `EmailChannelFactory.ts`, `ResendEmailAdapter.ts`, `FcmPushAdapter.ts`, `FixerAdapter.ts`, `OpenExchangeRatesAdapter.ts`

### Batch 10: i18n LOW — Repo/Service invariant throws (5 findings → 4 files)
- `complaint.repository.ts:122`, `billingRepoFactory.ts:145,374`, `test-helper.service.ts:423,441`, `payment-method-mask.ts:118`

### Batch 11: Input LOW (3 findings → 1 file)
- **I1-I3**: `backend/graphql/pothos/storage/storage.pothos.ts:308,318,328` — Add per-item `maxLength: 1024`

### Batch 12: SQL LOW (1 finding → 1 file)
- **S1**: `backend/db/repo/cron/cron.repository.ts:182-184` — Replace inline escape with `escapeLikeWildcards()`

### Batch 13: Auth LOW (1 finding → 1 file)
- **A1**: `backend/graphql/pothos/permissions/permission-management.pothos.ts:48-50` — Replace `?? ""` with `ctx.user!.id`

### VERIFY (5 — assess, may not need code fix)
- V1: `refreshToken` rate limit — assess if needed (authenticated by refresh token)
- V2: `MAX_COUNT=5000` — assess if global cap is appropriate
- V3-V4: Parent profile resolver scopes — service layer enforces, may be intentional
- V5: Storage upload MIME — defense-in-depth, already has allowlist

## Execution Strategy

1. Execute batches 1-3 first (HIGH severity)
2. Execute batches 4-7 (MEDIUM) in parallel where files don't overlap
3. Execute batches 8-12 (LOW) in parallel
4. Batch 13 (VERIFY) — assess and document
5. Run quality-loop on all modified files
6. Run targeted tests: `bun run test:db` + `bun run test:services` for modified files

## File Ownership Map (to avoid concurrent agent conflicts)
- All files in `backend/` are potentially being modified by concurrent agent
- Before modifying each file: check `git diff --name-only` for changes we didn't make
- If file has concurrent changes: modify only our specific lines, don't revert others
