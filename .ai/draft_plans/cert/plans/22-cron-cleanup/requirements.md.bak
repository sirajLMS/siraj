# Requirements — Plan 22: Cron Jobs & Cleanup

> **Plan #:** 22
> **Plan Name:** Cron Jobs & Cleanup
> **Dependencies:** Plan 4 (Services & Business Logic), Plan 7 (Storage & File Management)
> **Stakeholders:** Backend engineering, DevOps, Admin staff
> **Related Docs:** `MASTER_ARCHITECTURE.md`, `siraj_analysis/12-cron-config-infra.md`, `cgvs_analysis/05-storage-system.md` (§12), `cgvs_analysis/01-generation-logic.md` (§7)

---

## 1. Introduction

### Overview
This plan defines the scheduled job system for the certificate feature: detecting expired certificates, cleaning up orphan files and expired signed URLs, invalidating render caches, archiving old verification logs, and managing the batch generation queue. All jobs integrate with Siraj's existing Vercel Cron infrastructure (`vercel.json` → `app/api/cron/*/route.ts` → `verifyCronSecretAuth` → namespace service).

### Business Value
- Prevents expired certificates from remaining in `issued` status, which would confuse verification lookups.
- Reclaims storage by removing orphaned PDFs and background images after a grace period.
- Keeps verification log tables lean by archiving old entries (default 90 days).
- Keeps the batch generation queue healthy by cancelling stuck jobs and cleaning old completed records.
- Invalidates stale cached PDF renders when templates change or certificates are revoked.

### Scope

| In Scope | Out of Scope |
|----------|-------------|
| Expired certificate detection & status update | Certificate generation pipeline itself (Plan 4, 17) |
| Expiry notification dispatch to holder | Notification system infrastructure (exists) |
| Audit log entry for status changes | Audit log schema (exists) |
| Orphan PDF file detection & deletion after grace | Storage adapter implementations (Plan 7) |
| Orphan background image detection & deletion | Background image upload UI (Plan 10) |
| Expired signed URL cleanup (cron strategy) | Signed URL generation (Plan 7) |
| Storage quota check & alerting | Storage browser UI (Plan 7) |
| Render cache invalidation on template publish/update | PDF rendering engine (Plan 6) |
| Render cache invalidation on certificate revoke | Cache storage infra (exists) |
| Scheduled periodic render cache cleanup | — |
| Verification log archiving with pre-aggregation | Verification log query UI (Plan 19) |
| Batch generation queue cleanup (stuck, failed, old) | Batch generation pipeline (Plan 4, 17) |
| Vercel Cron route registration | Vercel deployment config (exists) |
| Env config registration for schedules/strategies | Settings UI framework (exists) |
| i18n keys for cron log messages & cleanup notifications | — |

---

## 2. Requirements

### Feature Area 1: Expired Certificate Detection

**REQ-22.1 (expired-detection-scan)**
WHEN the expired-certificate cron job runs at the configured schedule
THEN the system SHALL scan all certificates with `status = 'issued'` whose `expiryDate` is less than or equal to `now()`
AND mark each matching certificate's `status` to `'expired'`.

**REQ-22.2 (expired-detection-notification)**
WHEN a certificate is marked as expired by the cron job
THEN the system SHALL dispatch a notification to the certificate holder (student or parent) via the existing notification dispatch pipeline
AND the notification payload SHALL include the certificate title, template name, and expiry date.

**REQ-22.3 (expired-detection-audit)**
WHEN a certificate status changes from `issued` to `expired` by the cron job
THEN the system SHALL write an audit log entry with event type `certificate_auto_expired`, the certificate ID, and the triggering job run timestamp.

**REQ-22.4 (expired-detection-config)**
WHEN an admin configures the expired-certificate detection schedule via the `CERT_EXPIRY_CRON_SCHEDULE` env var
THEN the system SHALL use that schedule in `vercel.json` (default: `0 6 * * *` — daily at 06:00 UTC)
AND the job SHALL be idempotent: re-running on the same UTC date SHALL NOT produce duplicate notifications or duplicate audit entries.

**REQ-22.5 (expired-detection-failure-isolation)**
WHEN a single certificate's expiry processing fails (status update, notification dispatch, or audit write)
THEN the system SHALL log the error and continue processing the remaining certificates
AND the cron response SHALL report `success: true` with partial stats even when some items fail.

---

### Feature Area 2: Storage Cleanup

**REQ-22.6 (orphan-pdf-detection)**
WHEN the storage cleanup cron job runs
THEN the system SHALL identify PDF files in certificate storage that are not referenced by any `certificates.pdfStoragePath` column
AND mark them as orphan candidates with a `detectedAt` timestamp tracked in a cleanup log table.

**REQ-22.7 (orphan-pdf-deletion-grace)**
WHEN an orphan PDF has been detected for longer than the configured grace period (default: 7 days, env: `CERT_ORPHAN_FILE_GRACE_DAYS`)
THEN the system SHALL delete the file from storage
AND write an audit log entry with event type `storage_orphan_deleted` including the file path and size.

**REQ-22.8 (orphan-background-image-detection)**
WHEN the storage cleanup cron job runs
THEN the system SHALL identify background images in template storage not referenced by any `certificate_templates.backgroundImagePath`
AND apply the same grace period and deletion logic as REQ-22.7.

**REQ-22.9 (expired-signed-url-cleanup)**
WHEN the signed URL cleanup cron job runs and `SIGNED_URL_CLEANUP_STRATEGY` is set to `cron` or `both`
THEN the system SHALL delete all `signed_urls` records where `expiresAt < now()`
AND log the count of deleted records.

**REQ-22.10 (storage-quota-check)**
WHEN the storage cleanup cron job runs
THEN the system SHALL check the total certificate storage usage against the configured quota threshold (env: `CERT_STORAGE_QUOTA_WARN_PERCENT`, default: 80)
AND if usage exceeds the threshold, dispatch a notification to admins with the current usage percentage and absolute size.

**REQ-22.11 (storage-cleanup-failure-isolation)**
WHEN a single file deletion or quota check fails
THEN the system SHALL log the error and continue processing the remaining files
AND never cause the entire cron run to fail with HTTP 500 unless all items fail.

---

### Feature Area 3: Certificate Render Cache Invalidation

**REQ-22.12 (template-publish-cache-invalidation)**
WHEN a template is published or updated (status changes to `published` or template version is bumped)
THEN the system SHALL invalidate all cached PDF renders for certificates using that template
AND the invalidation SHALL use cache tag deletion (`render-cache:template:{templateId}`).

**REQ-22.13 (certificate-revoke-cache-invalidation)**
WHEN a certificate is revoked
THEN the system SHALL invalidate its cached PDF render (`render-cache:cert:{certificateId}`)
AND the next verification or download request SHALL produce a fresh render or indicate the revoked state.

**REQ-22.14 (periodic-render-cache-cleanup)**
WHEN the render cache cleanup cron job runs at the configured schedule (env: `CERT_RENDER_CACHE_CLEANUP_CRON_SCHEDULE`, default: `0 3 * * *` — daily at 03:00 UTC)
THEN the system SHALL delete cached PDF renders whose `createdAt` is older than the retention period (env: `CERT_RENDER_CACHE_RETENTION_HOURS`, default: 168 hours / 7 days)
AND log the count of evicted cache entries.

**REQ-22.15 (cache-invalidation-idempotent)**
WHEN cache invalidation is triggered (by template publish, certificate revoke, or periodic cleanup)
THEN the operation SHALL be idempotent — re-running the same invalidation SHALL NOT cause errors or cascading failures.

---

### Feature Area 4: Verification Log Cleanup

**REQ-22.16 (verification-log-aggregation)**
WHEN the verification log cleanup cron job runs
THEN the system SHALL first aggregate verification logs older than the retention period (env: `CERT_VERIFICATION_LOG_RETENTION_DAYS`, default: 90) into daily and monthly summary records (total hits, unique IPs, unique verification codes, success/fail counts)
AND the aggregation SHALL be computed before archival deletion.

**REQ-22.17 (verification-log-archive)**
WHEN the verification log aggregation for a given period completes successfully
THEN the system SHALL delete the individual verification log entries older than the retention period
AND write an audit log entry with event type `verification_logs_archived` including the count and date range.

**REQ-22.18 (verification-log-cleanup-config)**
WHEN an admin changes the retention period via env config
THEN the next cron run SHALL use the updated value without code changes
AND the system SHALL also support a manual GraphQL trigger (mutation `triggerVerificationLogCleanup`) with `trigger: 'manual'` discriminator.

---

### Feature Area 5: Batch Generation Queue Cleanup

**REQ-22.19 (stuck-job-cancellation)**
WHEN the batch generation cleanup cron job runs
THEN the system SHALL identify batch generation jobs with status `running` whose `startedAt` is more than 30 minutes ago
AND mark them as `cancelled` with a failure reason `stuck_timeout`
AND dispatch a notification to the initiating admin that the job was cancelled.

**REQ-22.20 (failed-job-retry)**
WHEN the batch generation cleanup cron job runs
THEN the system SHALL identify batch generation jobs with status `failed` whose retry count is less than 3
AND re-enqueue them with an incremented retry count
AND log each retry attempt.

**REQ-22.21 (old-job-record-cleanup)**
WHEN the batch generation cleanup cron job runs
THEN the system SHALL delete batch generation job records with status `completed`, `cancelled`, or `failed` (with retries exhausted) whose `updatedAt` is older than 30 days
AND write an audit log entry with the count of purged records.

---

### Feature Area 6: Integration with Siraj Cron Infrastructure

**REQ-22.22 (cron-route-pattern)**
WHEN a new certificate cron job is added
THEN the route SHALL be created at `app/api/cron/<name>/route.ts` exporting `GET(request)`
AND the route SHALL call `verifyCronSecretAuth(request)` and return `authResult.response` on auth failure
AND the route SHALL call the domain service inside a try/catch, log via `logger`, and return `NextResponse.json(...)`.

**REQ-22.23 (vercel-json-registration)**
WHEN certificate cron jobs are deployed
THEN each job path and schedule SHALL be registered in `vercel.json` `crons[]`
AND all jobs SHALL reuse the existing `CRON_SECRET` for authentication (no new secret infrastructure).

**REQ-22.24 (env-config-registration)**
WHEN certificate cron schedule or strategy env vars are introduced
THEN they SHALL be registered in `environment.d.ts` (type declarations), `backend/lib/env-config-keys.ts` (`ENV_CONFIG_KEYS[]` registry), `.env.example`, and `.github/workflows/deploy.yml`
AND follow the `SIGNED_URL_CLEANUP_*` precedent for strategy + schedule config knobs.

**REQ-22.25 (redis-single-flight-lock)**
WHEN a certificate cron job runs concurrently (overlapping Vercel invocations)
THEN the system SHALL acquire a Redis `SET NX EX` lock with a key like `cron-lock:cert-<job-name>` and a TTL of 300 seconds
AND if the lock is already held, the invocation SHALL return `200 { skipped: true, reason: "lock_held" }` without executing the job body
AND the lock SHALL be released (Redis `DEL`) on job completion or failure.

---

### Feature Area 7: i18n Requirements

All cron job log messages and cleanup-related notifications SHALL use the compile-time translation system in `shared/locale/`.

**Namespace:** `certificates` (sub-domain: `cron`)

**Translation Keys (sub-domain: `cron`):**

| Key | English | Arabic | Notes |
|-----|---------|--------|-------|
| `cron.expiry.jobStarted` | `"Certificate expiry detection job started"` | `"بدء مهمة الكشف عن انتهاء الشهادات"` | Log message |
| `cron.expiry.processed` | `"Processed {count} certificates"` | `"تمت معالجة {count} شهادة"` | Interpolation: `count: number`; AR plural: zero/one/two/few/many/other |
| `cron.expiry.markedExpired` | `"{count} certificates marked as expired"` | `"تم تمييز {count} شهادة كمنتهية"` | Interpolation: `count: number` |
| `cron.expiry.notificationSent` | `"Expiry notification sent for certificate {code}"` | `"تم إرسال إشعار انتهاء للشهادة {code}"` | Interpolation: `code: string` |
| `cron.expiry.notificationSubject` | `"Your certificate '{title}' has expired"` | `"انتهت صلاحية شهادتك '{title}'"` | Notification subject; Interpolation: `title: string` |
| `cron.expiry.notificationBody` | `"Your certificate '{title}' issued on {issueDate} has expired on {expiryDate}. Please contact your institution if you believe this is an error."` | `"انتهت صلاحية شهادتك '{title}' الصادرة في {issueDate} بتاريخ {expiryDate}. يرجى التواصل مع مؤسستك إذا كنت تعتقد أن هذا خطأ."` | Interpolation: `title: string`, `issueDate: string`, `expiryDate: string` |
| `cron.storage.jobStarted` | `"Storage cleanup job started"` | `"بدء مهمة تنظيف التخزين"` | Log message |
| `cron.storage.orphanPdfDeleted` | `"Deleted orphan PDF: {path} ({sizeBytes} bytes)"` | `"تم حذف PDF يتيم: {path} ({sizeBytes} بايت)"` | Interpolation: `path: string`, `sizeBytes: number` |
| `cron.storage.orphanImageDeleted` | `"Deleted orphan background image: {path}"` | `"تم حذف صورة خلفية يتيمة: {path}"` | Interpolation: `path: string` |
| `cron.storage.signedUrlsDeleted` | `"Deleted {count} expired signed URLs"` | `"تم حذف {count} رابط موقع منتهي الصلاحية"` | Interpolation: `count: number`; AR plural rules |
| `cron.storage.quotaWarningSubject` | `"Storage quota warning: {percent}% used"` | `"تحذير حصة التخزين: تم استخدام {percent}%"` | Interpolation: `percent: number` |
| `cron.storage.quotaWarningBody` | `"Certificate storage is at {percent}% capacity ({usedBytes} of {limitBytes} bytes). Please review and clean up unnecessary files."` | `"مساحة تخزين الشهادات وصلت إلى {percent}٪ ({usedBytes} من {limitBytes} بايت). يرجى المراجعة وتنظيف الملفات غير الضرورية."` | Interpolation: `percent: number`, `usedBytes: number`, `limitBytes: number` |
| `cron.renderCache.jobStarted` | `"Render cache cleanup job started"` | `"بدء مهمة تنظيف ذاكرة العرض المؤقتة"` | Log message |
| `cron.renderCache.evicted` | `"Evicted {count} stale render cache entries"` | `"تم إزالة {count} إدخال من ذاكرة العرض المؤقتة"` | Interpolation: `count: number`; AR plural |
| `cron.renderCache.invalidated` | `"Invalidated render cache for {scope} {id}"` | `"تم إبطال ذاكرة العرض لـ {scope} {id}"` | Interpolation: `scope: string` (template/cert), `id: string` |
| `cron.verification.aggregated` | `"Aggregated {count} verification logs for period {startDate} to {endDate}"` | `"تم تجميع {count} سجل تحقق للفترة من {startDate} إلى {endDate}"` | Interpolation: `count: number`, `startDate: string`, `endDate: string` |
| `cron.verification.archived` | `"Archived {count} verification logs older than {retentionDays} days"` | `"تمت أرشفة {count} سجل تحقق أقدم من {retentionDays} يوماً"` | Interpolation: `count: number`, `retentionDays: number` |
| `cron.batchGen.stuckCancelled` | `"Cancelled stuck job {jobId} (running > 30 min)"` | `"تم إلغاء مهمة عالقة {jobId} (تعمل لأكثر من 30 دقيقة)"` | Interpolation: `jobId: string` |
| `cron.batchGen.retried` | `"Retried failed job {jobId} (attempt {retryCount}/3)"` | `"إعادة محاولة مهمة فاشلة {jobId} (المحاولة {retryCount}/3)"` | Interpolation: `jobId: string`, `retryCount: number` |
| `cron.batchGen.purged` | `"Purged {count} old batch generation records"` | `"تمت إزالة {count} سجل توليد دفعي قديم"` | Interpolation: `count: number`; AR plural |
| `cron.common.lockSkipped` | `"Cron job {jobName} skipped: lock already held"` | `"تم تخطي مهمة cron {jobName}: القفل محتجز بالفعل"` | Interpolation: `jobName: string` |
| `cron.common.jobFailed` | `"Cron job {jobName} failed: {error}"` | `"فشلت مهمة cron {jobName}: {error}"` | Interpolation: `jobName: string`, `error: string` |

**Arabic Pluralization Rules (for `count` interpolations):**
- `zero` (0): صفر
- `one` (1): استخدام صيغة المفرد
- `two` (2): استخدام صيغة المثنى
- `few` (3–10): استخدام صيغة التمييز
- `many` (11–99): استخدام صيغة الجمع
- `other` (100+): استخدام صيغة الجمع العام

---

## 3. Acceptance Criteria

### AC-22.1: Expired Certificate Detection
- [ ] Cron route `GET /api/cron/cert-expiry-detection` exists with `verifyCronSecretAuth` guard
- [ ] Service marks all `issued` certs with `expiryDate <= now()` as `expired`
- [ ] Notification dispatched to each certificate holder
- [ ] Audit log entry written per certificate
- [ ] Re-running same UTC date produces no duplicate notifications or audit entries
- [ ] Per-certificate failure does not halt the loop

### AC-22.2: Storage Cleanup
- [ ] Cron route `GET /api/cron/cert-storage-cleanup` exists with `verifyCronSecretAuth` guard
- [ ] Orphan PDFs detected, grace-period enforced, deleted after grace expires
- [ ] Orphan background images detected, grace-period enforced, deleted after grace expires
- [ ] Expired signed URLs deleted when strategy is `cron` or `both`
- [ ] Storage quota check dispatches admin notification when usage > threshold
- [ ] Per-file failure isolated; full run returns partial success

### AC-22.3: Render Cache Invalidation
- [ ] Template publish/update invalidates `render-cache:template:{templateId}` cache tag
- [ ] Certificate revoke invalidates `render-cache:cert:{certificateId}` cache key
- [ ] Periodic cleanup evicts cache entries older than retention period
- [ ] Invalidation is idempotent

### AC-22.4: Verification Log Cleanup
- [ ] Cron route `GET /api/cron/cert-verification-cleanup` exists with `verifyCronSecretAuth` guard
- [ ] Aggregation computes daily/monthly stats before deletion
- [ ] Individual log entries older than retention period deleted after aggregation
- [ ] Audit log entry written with count and date range
- [ ] Manual GraphQL trigger mutation exists with `trigger: 'manual'` discriminator

### AC-22.5: Batch Generation Queue Cleanup
- [ ] Cron route `GET /api/cron/cert-batchgen-cleanup` exists with `verifyCronSecretAuth` guard
- [ ] Jobs running > 30 min cancelled with `stuck_timeout` reason
- [ ] Failed jobs with < 3 retries re-enqueued
- [ ] Old completed/cancelled/failed records > 30 days purged
- [ ] Audit log entries written for cancellations and purges

### AC-22.6: Cron Infrastructure Integration
- [ ] All cron routes follow `verifyCronSecretAuth` + `logger` + `NextResponse.json` pattern
- [ ] All jobs registered in `vercel.json` `crons[]`
- [ ] Env vars registered in `environment.d.ts`, `env-config-keys.ts`, `.env.example`, `deploy.yml`
- [ ] Redis single-flight lock prevents overlapping invocations
- [ ] All log messages and notifications use `shared/locale/` translation keys

### AC-22.7: i18n
- [ ] All translation keys defined in `shared/locale/` with English and Arabic implementations
- [ ] Arabic pluralization rules (zero/one/two/few/many/other) correctly implemented
- [ ] Interpolation parameters typed in the locale type schema
- [ ] No hardcoded user-facing strings in services or cron routes
