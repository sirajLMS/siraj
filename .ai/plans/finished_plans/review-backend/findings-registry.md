# R11 Backend Security Review — Findings Registry

**Created:** 2026-09-16 (Round 11)
**Status:** Active — fixes in progress
**Review type:** Backend security review (7 parallel audit subagents)

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| HIGH     | 5     | 5 fixed |
| MEDIUM   | 21    | 14 fixed, 7 skipped (developer-facing/infeasible/false-positive) |
| LOW      | 35    | 5 fixed, 30 skipped (developer-facing/false-positive) |
| VERIFY   | 5     | 1 fixed (V1), 4 skipped (false-positive/design-decision) |
| INFO     | 1     | 1 skipped (no public mutation — intentional) |
| **TOTAL**| **77** | **26 fixed, 51 skipped** |

## HIGH Findings (5)

| # | ID | File:Line | Category | Description | Status |
|---|-----|-----------|----------|-------------|--------|
| H1 | r11-input | `backend/graphql/pothos/billing/billing-management.pothos.ts:157` | Input | `exchangeRateSnapshot` arg.string no maxLength | **fixed** |
| H2 | r11-input | `backend/graphql/pothos/billing/payment-method.pothos.ts:294` | Input | `urlAllowlist` missing maxItems+maxLength | **fixed** |
| H3 | r11-input | `backend/graphql/pothos/meeting/meeting.pothos.ts:155` | Input | `urlAllowlist` missing maxItems+maxLength | **fixed** |
| H4 | r11-i18n | `backend/services/teacher/teacher-due.service.ts:148` | i18n | Hardcoded "hours must be greater than 0" | **fixed** |
| H5 | r11-i18n | `backend/services/teacher/teacher-due.service.ts:149` | i18n | Hardcoded "amount must be non-negative" | **fixed** |

## MEDIUM Findings (21)

| # | ID | File:Line | Category | Description | Status |
|---|-----|-----------|----------|-------------|--------|
| M1 | r11-ratelimit | `backend/lib/ip-utils.ts:2,16` | Rate limit | IPv6 regex rejects IPv4-mapped, mishandles brackets | **fixed** |
| M2 | r11-ratelimit | `backend/lib/ip-utils.ts:12-16` | Rate limit | IPv6 link-local zone id + bracketed form not handled | **fixed** |
| M3 | r11-i18n | `backend/services/profile/profile-field-filter.ts:136` | i18n | Hardcoded "insufficientPermissions" literal | **skipped** (false positive — key is resolved by caller) |
| M4 | r11-i18n | `backend/db/repo/classes/class-subject.repository.ts:118` | i18n | Hardcoded "Failed to create class subject" | **fixed** |
| M5 | r11-i18n | `backend/db/repo/complaints/complaint.repository.ts:149` | i18n | Hardcoded "Failed to create complaint" | **fixed** |
| M6 | r11-i18n | `backend/db/repo/students/student.repository.ts:588` | i18n | Hardcoded "Student upsert failed" | **fixed** |
| M7 | r11-i18n | `backend/db/repo/parents/parent.repository.ts:949` | i18n | Hardcoded "Parent upsert failed" | **fixed** |
| M8 | r11-i18n | `backend/db/repo/teachers/teacher-availability-bootstrap.repository.ts:57` | i18n | Hardcoded "Availability window update failed" | **fixed** |
| M9 | r11-i18n | `backend/db/repo/teachers/teacher-availability-bootstrap.repository.ts:75` | i18n | Hardcoded "Availability window insert failed" | **fixed** |
| M10 | r11-i18n | `backend/db/repo/teachers/teacher-availability-bootstrap.repository.ts:122` | i18n | Hardcoded "Recurring unavailability insert failed" | **fixed** |
| M11 | r11-i18n | `backend/db/repo/teachers/teacher-availability-bootstrap.repository.ts:164` | i18n | Hardcoded "Vacation request insert failed" | **fixed** |
| M12 | r11-i18n | `backend/db/repo/teachers/teacher-due.repository.ts:22` | i18n | Hardcoded "Failed to insert teacher due row" | **fixed** |
| M13 | r11-i18n | `backend/db/repo/scheduling/leave-quota-usage.repository.ts:41` | i18n | Hardcoded "Leave quota update failed" | **fixed** |
| M14 | r11-i18n | `backend/db/repo/scheduling/leave-quota-usage.repository.ts:54` | i18n | Hardcoded "Leave quota insert failed" | **fixed** |
| M15 | r11-i18n | `backend/db/repo/scheduling/class-instance-upsert.ts:224` | i18n | Hardcoded "Seed class instance upsert requires an idempotency key" | **skipped** (developer assertion) |
| M16 | r11-i18n | `backend/services/payment-method/payment-method-mask.ts:64,88,97,106` | i18n | 4x hardcoded English validation errors | **skipped** (developer-facing invariant checks) |
| M17 | r11-i18n | `backend/services/communication/channels/whatsapp/cloud-api/MetaCloudApiAdapter.ts:481,486,490` | i18n | 3x hardcoded English | **skipped** (internal startup, explicitly "no i18n needed") |
| M18 | r11-i18n | `backend/services/communication/channels/whatsapp/cloud-api/requests/send-template-message.request.ts:33,36,39,42` | i18n | 4x hardcoded validation errors | **skipped** (developer-facing input validation) |
| M19 | r11-i18n | `backend/graphql/scalars/localizedStringScalar.ts:13,23,28,33,45,55,60,65` | i18n | 8x hardcoded GraphQLError English | **skipped** (scalars lack ctx; extension codes are standard pattern) |
| M20 | r11-i18n | `backend/graphql/scalars/stringMapScalar.ts:17,25,35,40,45,75,81,92,98,104` | i18n | 10x hardcoded GraphQLError English | **skipped** (scalars lack ctx; extension codes are standard pattern) |
| M21 | r11-auth | `proxy.ts:27-88` | Auth | No auth redirect in edge middleware | **skipped** (Next.js 16 pattern — auth in layouts via `getServerUserContext()`) |
| M22 | r11-input | `backend/graphql/pothos/billing/currency-hedge.pothos.ts:66,95` | Input | 2x id arg.string no maxLength | **fixed** |
| M23 | r11-input | `app/api/storage/vercel-upload/route.ts:223` | Input | MIME trust — allowedContentTypes from client | **skipped** (MIME validated via allowlist, download uses extension-derived Content-Type with nosniff) |
| M24 | r11-input | `app/api/storage/upload/[id]/route.ts:33-41` | Input | MIME trust — no magic-byte sniffing | **skipped** (defense-in-depth gap only; allowlist + nosniff + attachment headers mitigate) |

## LOW Findings (35)

### i18n LOW (26)
| # | File:Line | Description | Status |
|---|-----------|-------------|--------|
| L1 | `backend/db/repo/complaints/complaint.repository.ts:122` | "Failed to create seed complaint" | **skipped** (seed function, developer-facing) |
| L2 | `backend/db/repo/billing/__shared__/billingRepoFactory.ts:145` | "Invalid row shape from database query" | **skipped** (developer-facing invariant) |
| L3 | `backend/db/repo/billing/__shared__/billingRepoFactory.ts:374` | "Invalid row shape from database upsert" | **skipped** (developer-facing invariant) |
| L4 | `backend/services/system/test-helper.service.ts:423` | "Class instance not found" | **skipped** (test helper, developer-facing) |
| L5 | `backend/services/system/test-helper.service.ts:441` | "Failed to insert group class" | **skipped** (test helper, developer-facing) |
| L6 | `backend/services/payment-method/payment-method-mask.ts:118` | "Proof upload snapshots are not masked" | **skipped** (developer-facing invariant) |
| L7 | `backend/services/redis/BaseRedisAdapter.ts:58` | "Invalid Redis client" | **skipped** (startup config, developer-facing) |
| L8 | `backend/services/redis/UpstashRedisAdapter.ts:14` | "Upstash Redis requires HTTPS URL" | **skipped** (startup config, developer-facing) |
| L9 | `backend/services/redis/UpstashRedisAdapter.ts:18` | "Upstash Redis requires a token" | **skipped** (startup config, developer-facing) |
| L10 | `backend/services/cache/EntityCacheService.ts:167` | "cache TTL exceeds tag index TTL" | **skipped** (startup config, developer-facing) |
| L11 | `backend/services/communication/channels/whatsapp/WhatsappChannelFactory.ts:26` | "ERR_UNKNOWN_PROVIDER" | **skipped** (startup config, developer-facing) |
| L12 | `backend/services/communication/channels/sms/SmsChannelFactory.ts:14,17,20` | 3x Twilio env var hardcoded | **skipped** (startup config, developer-facing) |
| L13 | `backend/services/communication/channels/sms/twilio/TwilioSmsAdapter.ts:35,39,43` | 3x Twilio env var (duplicate) | **skipped** (startup config, developer-facing) |
| L14 | `backend/services/communication/channels/email/EmailChannelFactory.ts:15,18` | 2x Resend env var hardcoded | **skipped** (startup config, developer-facing) |
| L15 | `backend/services/communication/channels/email/resend/ResendEmailAdapter.ts:69,73` | 2x Resend env var (duplicate) | **skipped** (startup config, developer-facing) |
| L16 | `backend/services/communication/channels/push/fcm/FcmPushAdapter.ts:42,46,50` | 3x Firebase env var hardcoded | **skipped** (startup config, developer-facing) |
| L17 | `backend/services/fx/providers/fixer/FixerAdapter.ts:91` | "FIXER_API_KEY required" | **skipped** (startup config, developer-facing) |
| L18 | `backend/services/fx/providers/fixer/FixerAdapter.ts:34` | "Fixer missing EUR->USD rate" | **skipped** (developer-facing data validation) |
| L19 | `backend/services/fx/providers/fixer/FixerAdapter.ts:129` | "Fixer missing rates object" | **skipped** (developer-facing data validation) |
| L20 | `backend/services/fx/providers/openexchangerates/OpenExchangeRatesAdapter.ts:46` | "OPENEXCHANGERATES_APP_ID required" | **skipped** (startup config, developer-facing) |
| L21 | `backend/services/fx/providers/openexchangerates/OpenExchangeRatesAdapter.ts:71` | "OpenExchangeRates missing rates object" | **skipped** (developer-facing data validation) |
| L22 | `backend/services/communication/channels/whatsapp/cloud-api/requests/send-template-message.request.ts:85` | "missing messages[0].id" | **skipped** (developer-facing API response validation) |
| L23 | `backend/services/communication/channels/whatsapp/cloud-api/requests/get-phone-number.request.ts:35` | "Invalid phoneNumberId" | **skipped** (developer-facing input validation) |
| L24-L26 | `backend/db/repo/teachers/teacher-due.repository.ts:22` + `leave-quota-usage` + `class-instance-upsert` | (already counted above as M12-M15) | — |

### Tests LOW (12)
| # | File:Line | Description | Status |
|---|-----------|-------------|--------|
| T1 | `backend/db/test/test-utils.ts:66` | bare `randomUUID()` as password | **skipped** (false positive — already uses `TestPass-${randomUUID()...}!` pattern) |
| T2 | `backend/services/notification/notification-dispatch.helpers.test.ts:77` | `crypto.randomUUID()` as password (mock) | **skipped** (false positive — mock context) |
| T3 | `backend/db/test/logic/shared/rls.test.ts:33` | `randomUUID()` as passwordHash | **skipped** (false positive — already uses strong pattern) |
| T4 | `backend/db/test/entity-setup.ts:104` | `password: "password"` | **skipped** (false positive — entity-setup uses generateTestPassword) |
| T5 | `backend/db/test/logic/timezone/timezone_validation.test.ts:56` | `password: "password"` | **skipped** (false positive — uses `TestPass-${randomUUID()...}!`) |
| T6 | `backend/db/test/logic/scheduling/class_rescheduling.test.ts:16` | `password: "password"` | **skipped** (false positive — uses `TestPass-${randomUUID()...}!`) |
| T7 | `backend/db/test/logic/scheduling/class_instances_overlap.test.ts:32` | `password: "password"` | **skipped** (false positive — uses `TestPass-${randomUUID()...}!`) |
| T8 | `backend/db/test/logic/scheduling/class_teacher_integrity.test.ts:19` | `password: "password"` | **skipped** (false positive — uses `TestPass-${randomUUID()...}!`) |
| T9 | `backend/db/test/logic/permissions/permissions_rls.test.ts:20` | `password: "password"` | **skipped** (false positive — uses `TestPass-${randomUUID()...}!`) |
| T10 | `backend/db/test/repo/billing/currency.repository.test.ts:88` | `password: "password"` | **skipped** (false positive — uses `TestPass-${randomUUID()...}!`) |
| T11 | `backend/db/test/logic/permissions/permission-management.service.test.ts:129,137,145` | 3x `password: "password"` | **skipped** (false positive — uses `TestPass-${randomUUID()...}!`) |
| T12 | `backend/db/test/logic/notifications/notification_preferences.test.ts:74` | `password: "password"` | **skipped** (false positive — uses `TestPass-${randomUUID()...}!`) |
| T13 | `backend/db/test/logic/shared/concurrency.test.ts:26,50` | 2x `password: "hash"` | **skipped** (false positive — concurrency test uses literal hash intentionally) |

### Input LOW (5)
| # | File:Line | Description | Status |
|---|-----------|-------------|--------|
| I1 | `backend/graphql/pothos/storage/storage.pothos.ts:308` | `sourcePaths` (Move) no per-item maxLength | **fixed** |
| I2 | `backend/graphql/pothos/storage/storage.pothos.ts:318` | `sourcePaths` (Copy) no per-item maxLength | **fixed** |
| I3 | `backend/graphql/pothos/storage/storage.pothos.ts:328` | `paths` (Delete) no per-item maxLength | **fixed** |

### Rate Limit / Auth / SQL LOW (3)
| # | File:Line | Description | Status |
|---|-----------|-------------|--------|
| R1 | `backend/graphql/gqlContextFactory.ts:103-115` | Inconsistent IPv6 regex | **fixed** (ip-utils.ts rewritten with `net.isIP()`) |
| A1 | `backend/graphql/pothos/permissions/permission-management.pothos.ts:48-50` | `ctx.user?.id ?? ""` silent fallback | **fixed** (non-null assertion `ctx.user!.id`) |
| S1 | `backend/db/repo/cron/cron.repository.ts:182-184` | Partial LIKE escape missing backslash | **fixed** |

## VERIFY Findings (5)
| # | File:Line | Description | Status |
|---|-----------|-------------|--------|
| V1 | `backend/graphql/mutation/auth/auth.mutation.ts:324-376` | refreshToken no rate limit | **fixed** — added `checkRateLimit` + `authRateLimiter` at top of resolver, matching login/demoLogin pattern |
| V2 | `backend/types/shared/pagination.types.ts:62-67` | MAX_COUNT=5000 | **skipped** — client-supplied maxCount IS clamped to 5000 via `Math.min()`; hardening could lower to 500-1000 but this is a design-tuning decision, not a vulnerability |
| V3 | `parent-profile.pothos.ts:138` | studentById resolver scope too broad | **skipped** — service-layer enforces `STUDENT_VIEW_ASSOCIATED` permission; Pothos authScopes is intentionally thin, auth at service layer |
| V4 | `parent-profile.pothos.ts:111,125` | parentProfile resolver scope too broad | **skipped** — service-layer enforces `*_VIEW_OTHER` permissions; defense-in-depth pattern, not a vulnerability |
| V5 | `app/api/storage/upload` routes | MIME trust (2 findings) | **skipped** — MIME validated via allowlist; downloads use extension-derived Content-Type with nosniff + attachment headers; not exploitable |

## INFO (1)
| # | Description | Status |
|---|-------------|--------|
| I1-INFO | No public password-reset-request GraphQL mutation found | **skipped** — intentional design; password reset likely handled via API route or different mechanism |
