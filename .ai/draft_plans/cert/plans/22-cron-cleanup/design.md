# Plan 22 — Cron Jobs & Cleanup: Design

## Document Info

| Field | Value |
|-------|-------|
| Feature | Certificate Cron Jobs & Cleanup |
| Plan # | 22 |
| Depends On | Plan 4 (Services & Business Logic), Plan 7 (Storage & File Management) |
| Related Docs | `MASTER_ARCHITECTURE.md`, `siraj_analysis/12-cron-config-infra.md`, `siraj_analysis/10-testing-quality-patterns.md`, `requirements.md` (same directory) |
| Requirements | `requirements.md` (same directory) |

---

## 1. Architecture Overview

### Layer Position

This plan introduces five certificate-specific cron jobs that integrate with Siraj's existing Vercel Cron infrastructure. The cron jobs span the following layers:

```
┌─────────────────────────────────────────────────────────┐
│                  Vercel Cron (vercel.json)                  │
│    crons[] entries for 5 certificate jobs                   │
├─────────────────────────────────────────────────────────┤
│               API Routes (app/api/cron/)                    │
│  cert-expiry-detection/route.ts                             │
│  cert-storage-cleanup/route.ts                              │
│  cert-render-cache-cleanup/route.ts                         │
│  cert-verification-cleanup/route.ts                         │
│  cert-batchgen-cleanup/route.ts                             │
├─────────────────────────────────────────────────────────┤
│          Auth Guard (shared cron infrastructure)             │
│  verifyCronSecretAuth(request) → CRON_SECRET validation     │
├─────────────────────────────────────────────────────────┤
│            Redis Single-Flight Lock                         │
│  cron-lock:cert-<job-name> (SET NX EX 300)                   │
├─────────────────────────────────────────────────────────┤
│              Backend Services                               │
│  backend/services/cert/cleanup/ namespace                    │
│  ├── ExpiryDetectionService                                 │
│  ├── StorageCleanupService                                  │
│  ├── RenderCacheCleanupService                              │
│  ├── VerificationLogCleanupService                          │
│  └── BatchGenCleanupService                                 │
├─────────────────────────────────────────────────────────┤
│            Backend Repositories                              │
│  backend/db/repo/cert/ — existing repos extended            │
│  with cleanup-specific query methods                        │
├─────────────────────────────────────────────────────────┤
│              Env Config (shared infrastructure)              │
│  environment.d.ts, env-config-keys.ts, .env.example,       │
│  deploy.yml — CERT_* schedule/strategy vars                │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
Vercel Cron triggers GET /api/cron/cert-<job>/route.ts
    ↓
verifyCronSecretAuth(request) — rejects if CRON_SECRET mismatch
    ↓
Redis SET NX EX cron-lock:cert-<job> (300s TTL)
    ↓ (lock acquired)
CleanupService.execute() — delegates to domain-specific service
    ↓
Per-item processing (try/catch per item, failure isolation)
    ↓
Repository queries (batch scan, update, delete — with tx where needed)
    ↓
Notification dispatch (via existing notification pipeline)
    ↓
Audit log entry (via existing audit repository)
    ↓
Redis DEL cron-lock:cert-<job> (release lock)
    ↓
NextResponse.json({ success, stats, partial }) → 200
```

### Existing Infrastructure Integration

This plan builds on Siraj's existing cron infrastructure without modifying it:

| Infrastructure Component | Existing Location | Usage in This Plan |
|--------------------------|-------------------|-------------------|
| Vercel Cron registration | `vercel.json` crons[] | Add 5 new entries |
| Cron auth guard | `backend/lib/cron-auth.ts` `verifyCronSecretAuth` | Reuse as-is |
| CRON_SECRET env var | `environment.d.ts`, `env-config-keys.ts`, `.env.example`, `deploy.yml` | Reuse as-is |
| Server logger | `backend/lib/logger.ts` | Use for all cron log messages |
| Redis service | `backend/services/redis/` | Use for single-flight locks |
| Notification pipeline | `backend/services/notifications/` | Use for expiry and quota notifications |
| Audit log repository | `backend/db/repo/audit/` | Use for all cleanup audit entries |
| Entity cache service | `backend/services/cache/` | Use for render cache invalidation |
| ENV_CONFIG_KEYS registry | `backend/lib/env-config-keys.ts` | Add CERT_* entries |

---

## 2. Design Decisions

### DD-1: Redis Single-Flight Lock for All Certificate Cron Jobs

**Decision**: Every certificate cron job acquires a Redis `SET NX EX` lock before executing, with key `cron-lock:cert-<job-name>` and TTL of 300 seconds. If the lock is held, the invocation returns `200 { skipped: true, reason: "lock_held" }`.

**Rationale**: Siraj's existing cron routes do not use single-flight locks — idempotency is maintained via UTC-date keys in payload metadata. However, certificate cron jobs are heavier (scanning tables, deleting files, dispatching notifications) and overlapping invocations could cause duplicate notifications, double-deletes, or redundant processing. The Redis lock pattern is documented in the Redis README as a rate-limitting/idempotency primitive and is the established pattern for this need, even though no existing cron route currently uses it.

**Alternatives Considered**:
- DB-based lock (SELECT FOR UPDATE on a lock row): Rejected because it holds a DB connection for the entire job duration, which is problematic in serverless.
- No lock (rely on idempotency keys): Rejected because the processing cost of redundant scans and notification dispatch is non-trivial.
- Vercel Cron `maxDuration` only: Rejected because it doesn't prevent concurrent invocations — it only limits duration.

### DD-2: Per-Item Failure Isolation with Partial Success

**Decision**: Each certificate cron job processes items (certificates, files, jobs) in a loop with try/catch per item. Failed items are logged and counted but do not halt the loop. The cron response returns `200 { success: true, processed: N, failed: M, ... }` even when some items fail. The response only returns 500 if the entire job body fails before per-item processing begins (e.g., auth failure, Redis unavailable, service initialization failure).

**Rationale**: This matches Siraj's existing cron pattern (class-reminders) where per-item failures are logged and the job continues. Certificate cleanup jobs may process hundreds of items — a single failure should not prevent cleanup of the remaining items.

**Alternatives Considered**:
- All-or-nothing (fail on first error): Rejected because it leaves cleanup incomplete.
- Retry failed items in the same run: Rejected because it complicates the loop and risks infinite retry loops.

### DD-3: UTC-Date Idempotency Key for Expiry Detection

**Decision**: The expiry detection cron job uses a UTC-date-based idempotency key to prevent duplicate notifications and audit entries when the job runs multiple times on the same UTC date. The key is composed of `cert-expiry:{certificateId}:{utcDate}` and is checked against a notification dispatch log before sending.

**Rationale**: Vercel Cron may retry a failed invocation, or the job may be manually triggered on the same day. Without idempotency, a certificate holder could receive multiple expiry notifications. The UTC-date key is the established Siraj pattern (used by class-reminders) — soft dedupe via payload metadata.

**Alternatives Considered**:
- DB UNIQUE constraint on `(certificateId, utcDate)`: Considered as a stronger guarantee, but rejected for the initial implementation because it requires a new DB table (cert_expiry_notification_log). The soft dedupe via metadata is sufficient for notifications. The audit log already has a unique event type + entity ID + timestamp pattern.
- Redis-based idempotency (SET NX EX with 24h TTL): Considered but rejected because Redis is not guaranteed to persist for 24h in serverless environments (Upstash may evict).

### DD-4: Cleanup Log Table for Orphan File Tracking

**Decision**: Introduce a `certificate_cleanup_log` table to track orphan file detection timestamps and deletion status. This table records: file path, file type (pdf/background_image), detected_at timestamp, deleted_at timestamp (nullable), file size.

**Rationale**: The grace period (default 7 days) requires tracking when an orphan was first detected. Without a persistent log, the cron job would re-detect orphans on every run and never know if the grace period has elapsed. A dedicated cleanup log table is the simplest persistent tracking mechanism.

**Alternatives Considered**:
- Redis hash for orphan tracking (path → detectedAt): Rejected because orphan cleanup may span multiple days and Redis is not guaranteed to persist that long in serverless.
- In-memory state (process-level): Rejected because serverless functions are stateless between invocations.

### DD-5: Verification Log Aggregation Before Deletion

**Decision**: The verification log cleanup job first aggregates logs older than the retention period into daily and monthly summary records, then deletes the individual log entries. Aggregation records contain: date (or month), total hits, unique IPs, unique verification codes, success count, fail count.

**Rationale**: Deleting verification logs without aggregation loses historical analytics data. Aggregation preserves the statistical value (total hits, unique visitors, success rate) while reducing storage. Daily aggregation provides day-level analytics; monthly aggregation provides trend analysis.

**Alternatives Considered**:
- Delete without aggregation: Rejected because it destroys historical verification analytics.
- Move to archive table instead of aggregation: Rejected because an archive table grows indefinitely, while aggregation summaries are bounded (365 daily + 12 monthly per year).

### DD-6: Cache Tag-Based Invalidation for Render Cache

**Decision**: Render cache invalidation uses cache tags (`render-cache:template:{templateId}`, `render-cache:cert:{certificateId}`) rather than key-based deletion. When a template is published or updated, all cache entries with the template tag are invalidated. When a certificate is revoked, its cache entry is invalidated by key.

**Rationale**: A single template change can invalidate cached renders for hundreds of certificates. Tag-based invalidation allows bulk deletion via a single tag lookup. Key-based invalidation would require iterating all certificate IDs using that template — inefficient and error-prone. Siraj's entity cache service already supports tag-based invalidation.

**Alternatives Considered**:
- Time-based expiration only (TTL): Rejected because template changes need immediate invalidation — a 7-day TTL means stale renders for up to 7 days after a template update.
- Key-based invalidation (enumerate all cert IDs for a template): Rejected as inefficient and racy.

### DD-7: Manual Trigger Mutations for All Cron Jobs

**Decision**: Each certificate cron job has a corresponding GraphQL manual trigger mutation (e.g., `triggerCertificateExpiryDetection`) with a `trigger` argument of type `'cron' | 'manual'`. The mutation requires admin auth scope and delegates to the same service used by the cron route. The `trigger` value is persisted in run metadata and audit entries.

**Rationale**: Admins need the ability to manually trigger cleanup jobs outside the cron schedule for:
- Testing and verification (verify the job works without waiting for the schedule)
- Error recovery (re-run after a partial failure)
- On-demand cleanup (e.g., after a bulk template update, force cache invalidation)

This follows the existing Siraj pattern (`refreshExchangeRates` mutation with `FxSyncTrigger.Manual`).

**Alternatives Considered**:
- No manual trigger (cron only): Rejected because it severely limits operational flexibility.
- Separate admin script: Rejected because GraphQL mutations integrate with the existing admin UI and auth scope system.

### DD-8: No New Cron Auth Infrastructure

**Decision**: All certificate cron jobs reuse the existing `CRON_SECRET` env var and `verifyCronSecretAuth` function. No new auth secrets, no new auth middleware, no new env var categories for authentication.

**Rationale**: `CRON_SECRET` is already declared in `environment.d.ts`, `env-config-keys.ts`, `.env.example`, and `deploy.yml`. It is DB-overridable via Settings. The `verifyCronSecretAuth` function handles Bearer header validation. Introducing a separate secret for certificate cron jobs would add operational complexity without security benefit.

**Alternatives Considered**:
- Per-job secrets (CERT_EXPIRY_CRON_SECRET, etc.): Rejected because it multiplies secret management overhead with no security gain.
- JWT-based auth for cron routes: Rejected as over-engineered for server-side cron invocations.

---

## 3. Interface Contracts

### 3.1 Cron Route Interface

Each cron route at `app/api/cron/cert-*/route.ts` exports a single `GET` handler:

| Property | Value |
|----------|-------|
| Method | GET |
| Auth | `verifyCronSecretAuth(request)` — Bearer token from `CRON_SECRET` |
| Return (success) | `NextResponse.json({ success: true, ...stats })` — HTTP 200 |
| Return (skipped) | `NextResponse.json({ success: true, skipped: true, reason: "lock_held" })` — HTTP 200 |
| Return (auth failure) | `authResult.response` — HTTP 401 |
| Return (internal error) | `NextResponse.json({ success: false, error: message })` — HTTP 500 |
| Logging | `logger.info` for job start/finish, `logger.warn` for per-item failures, `logger.error` for job-level failures |

### 3.2 Cleanup Service Interface

Each cleanup service in `backend/services/cert/cleanup/` follows this interface contract:

| Method | Params | Returns | Description |
|--------|--------|---------|-------------|
| `execute` | `locale: string` (default "en") | `CleanupResult` | Main entry point — acquires lock, processes items, releases lock |
| `processItems` | `locale: string` | `ItemProcessingResult` | Internal — iterates items with per-item try/catch |
| `acquireLock` | none | `LockResult` | Internal — Redis SET NX EX, returns acquired/skipped |
| `releaseLock` | none | `void` | Internal — Redis DEL |
| `logResult` | `result: CleanupResult, locale: string` | `void` | Internal — logger calls with i18n messages |

### 3.3 CleanupResult Type

| Field | Type | Description |
|------|------|-------------|
| `success` | `boolean` | True if job completed (even with partial failures) |
| `skipped` | `boolean` | True if lock was not acquired |
| `skipReason` | `string \| null` | Reason for skip (e.g., "lock_held") |
| `processed` | `number` | Total items processed |
| `succeeded` | `number` | Items that succeeded |
| `failed` | `number` | Items that failed |
| `errors` | `string[]` | Error messages from failed items (max 10, truncated) |
| `jobName` | `string` | Name of the cron job for logging |
| `runTimestamp` | `Date` | UTC timestamp of job execution |

### 3.4 Per-Service Method Signatures

#### ExpiryDetectionService

| Method | Params | Returns | Description |
|--------|--------|---------|-------------|
| `findExpiredCertificates` | `tx?: DbTransaction` | `CertificateSelectType[]` | Find all issued certs with expiryDate <= now() |
| `markCertificateExpired` | `certificateId: string, tx?: DbTransaction` | `void` | Update cert status to expired |
| `dispatchExpiryNotification` | `certificate: CertificateSelectType, locale: string` | `void` | Send notification to certificate holder |
| `writeExpiryAuditEntry` | `certificateId: string, runTimestamp: Date, tx?: DbTransaction` | `void` | Write audit log entry |
| `checkIdempotency` | `certificateId: string, utcDate: string` | `boolean` | Check if notification already sent today |
| `recordIdempotency` | `certificateId: string, utcDate: string` | `void` | Record notification dispatch |

#### StorageCleanupService

| Method | Params | Returns | Description |
|--------|--------|---------|-------------|
| `findOrphanPdfs` | `tx?: DbTransaction` | `OrphanFile[]` | Find PDFs in storage not referenced by certificates |
| `findOrphanBackgroundImages` | `tx?: DbTransaction` | `OrphanFile[]` | Find background images not referenced by templates |
| `deleteOrphanFile` | `filePath: string, fileType: string` | `DeleteResult` | Delete file from storage, write cleanup log |
| `cleanupExpiredSignedUrls` | `tx?: DbTransaction` | `number` | Delete expired signed_urls records, return count |
| `checkStorageQuota` | none | `QuotaCheckResult` | Check total storage usage vs threshold |
| `dispatchQuotaWarning` | `result: QuotaCheckResult, locale: string` | `void` | Send admin notification if quota exceeded |

#### RenderCacheCleanupService

| Method | Params | Returns | Description |
|--------|--------|---------|-------------|
| `invalidateByTemplate` | `templateId: string` | `void` | Invalidate all cache entries with `render-cache:template:{id}` tag |
| `invalidateByCertificate` | `certificateId: string` | `void` | Invalidate cache entry `render-cache:cert:{id}` |
| `cleanupOldRenders` | `retentionHours: number` | `number` | Delete cache entries older than retention, return count |
| `isCacheKeyValid` | `key: string` | `boolean` | Check if a cache key still exists |

#### VerificationLogCleanupService

| Method | Params | Returns | Description |
|--------|--------|---------|-------------|
| `aggregateLogs` | `olderThanDays: number, tx?: DbTransaction` | `AggregationResult` | Compute daily/monthly aggregates before deletion |
| `deleteOldLogs` | `olderThanDays: number, tx?: DbTransaction` | `number` | Delete individual log entries, return count |
| `writeArchiveAuditEntry` | `count: number, dateRange: DateRange, tx?: DbTransaction` | `void` | Write audit log entry |

#### BatchGenCleanupService

| Method | Params | Returns | Description |
|--------|--------|---------|-------------|
| `findStuckJobs` | `tx?: DbTransaction` | `BatchGenJob[]` | Find running jobs with startedAt > 30 min ago |
| `cancelStuckJob` | `jobId: string, tx?: DbTransaction` | `void` | Mark job cancelled with stuck_timeout reason |
| `findFailedJobsForRetry` | `tx?: DbTransaction` | `BatchGenJob[]` | Find failed jobs with retry count < 3 |
| `reEnqueueFailedJob` | `jobId: string, tx?: DbTransaction` | `void` | Increment retry count, re-enqueue job |
| `findOldJobRecords` | `tx?: DbTransaction` | `BatchGenJob[]` | Find completed/cancelled/failed jobs > 30 days old |
| `purgeOldJobRecords` | `jobIds: string[], tx?: DbTransaction` | `number` | Delete old job records, return count |

### 3.5 Manual Trigger Mutation Interface

Each manual trigger mutation follows this pattern:

| Property | Value |
|----------|-------|
| Auth scope | admin |
| Input | `trigger: 'cron' | 'manual'` (default: 'manual') |
| Return | `{ success: boolean, jobName: string, stats: CleanupResult }` |
| Delegation | Calls same `CleanupService.execute(locale)` as cron route |
| Audit | Writes audit entry with `trigger` discriminator |

---

## 4. Cron Job Specifications

### 4.1 Expired Certificate Detection

| Property | Value |
|----------|-------|
| Route path | `app/api/cron/cert-expiry-detection/route.ts` |
| vercel.json schedule | `0 6 * * *` (daily at 06:00 UTC) |
| Schedule env var | `CERT_EXPIRY_CRON_SCHEDULE` (default: `0 6 * * *`) |
| Service | `ExpiryDetectionService` |
| Redis lock key | `cron-lock:cert-expiry-detection` |
| Redis lock TTL | 300 seconds |
| Items | Certificates with `status = 'issued'` and `expiryDate <= now()` |
| Per-item actions | 1. Mark status expired, 2. Dispatch notification, 3. Write audit entry |
| Idempotency | UTC-date key per certificate (no duplicate notifications or audit entries on same UTC date) |
| Failure isolation | Per-certificate try/catch; continue loop on failure |
| Notifications | Certificate holder (student or parent) — subject and body from i18n keys |
| Audit event type | `certificate_auto_expired` |

### 4.2 Storage Cleanup

| Property | Value |
|----------|-------|
| Route path | `app/api/cron/cert-storage-cleanup/route.ts` |
| vercel.json schedule | `0 7 * * *` (daily at 07:00 UTC) |
| Schedule env var | `CERT_STORAGE_CLEANUP_CRON_SCHEDULE` (default: `0 7 * * *`) |
| Service | `StorageCleanupService` |
| Redis lock key | `cron-lock:cert-storage-cleanup` |
| Redis lock TTL | 300 seconds |
| Sub-tasks | 1. Orphan PDF detection + grace deletion, 2. Orphan background image detection + grace deletion, 3. Expired signed URL cleanup, 4. Storage quota check |
| Grace period env var | `CERT_ORPHAN_FILE_GRACE_DAYS` (default: 7) |
| Signed URL strategy env var | `SIGNED_URL_CLEANUP_STRATEGY` (existing — reused) |
| Quota threshold env var | `CERT_STORAGE_QUOTA_WARN_PERCENT` (default: 80) |
| Per-file failure isolation | Per-file try/catch; continue loop on failure |
| Notifications | Admin notification if quota exceeded — subject and body from i18n keys |
| Audit event types | `storage_orphan_deleted`, `signed_urls_cleaned`, `quota_warning` |

### 4.3 Render Cache Cleanup

| Property | Value |
|----------|-------|
| Route path | `app/api/cron/cert-render-cache-cleanup/route.ts` |
| vercel.json schedule | `0 3 * * *` (daily at 03:00 UTC) |
| Schedule env var | `CERT_RENDER_CACHE_CLEANUP_CRON_SCHEDULE` (default: `0 3 * * *`) |
| Service | `RenderCacheCleanupService` |
| Redis lock key | `cron-lock:cert-render-cache-cleanup` |
| Redis lock TTL | 300 seconds |
| Retention env var | `CERT_RENDER_CACHE_RETENTION_HOURS` (default: 168 / 7 days) |
| Action | Delete cached PDF renders older than retention period |
| Cache tag naming | `render-cache:cert:{certificateId}`, `render-cache:template:{templateId}` |
| Idempotency | Cache deletion is inherently idempotent — deleting a non-existent key is a no-op |
| Event-driven invalidation | Template publish → `invalidateByTemplate`, Certificate revoke → `invalidateByCertificate` (not cron-triggered) |
| Audit event type | `render_cache_evicted` |

### 4.4 Verification Log Cleanup

| Property | Value |
|----------|-------|
| Route path | `app/api/cron/cert-verification-cleanup/route.ts` |
| vercel.json schedule | `0 8 * * 0` (weekly on Sunday at 08:00 UTC) |
| Schedule env var | `CERT_VERIFICATION_CLEANUP_CRON_SCHEDULE` (default: `0 8 * * 0`) |
| Service | `VerificationLogCleanupService` |
| Redis lock key | `cron-lock:cert-verification-cleanup` |
| Redis lock TTL | 300 seconds |
| Retention env var | `CERT_VERIFICATION_LOG_RETENTION_DAYS` (default: 90) |
| Action sequence | 1. Aggregate logs older than retention (daily + monthly summaries), 2. Delete individual log entries, 3. Write audit entry |
| Manual trigger | GraphQL mutation `triggerVerificationLogCleanup` with `trigger: 'manual'` discriminator |
| Aggregation fields | Date/month, total hits, unique IPs, unique verification codes, success count, fail count |
| Audit event type | `verification_logs_archived` |

### 4.5 Batch Generation Queue Cleanup

| Property | Value |
|----------|-------|
| Route path | `app/api/cron/cert-batchgen-cleanup/route.ts` |
| vercel.json schedule | `*/30 * * * *` (every 30 minutes) |
| Schedule env var | `CERT_BATCHGEN_CLEANUP_CRON_SCHEDULE` (default: `*/30 * * * *`) |
| Service | `BatchGenCleanupService` |
| Redis lock key | `cron-lock:cert-batchgen-cleanup` |
| Redis lock TTL | 120 seconds (shorter due to frequency) |
| Sub-tasks | 1. Cancel stuck jobs (running > 30 min), 2. Retry failed jobs (< 3 retries), 3. Purge old records (> 30 days) |
| Stuck job timeout | 30 minutes (hardcoded — not configurable) |
| Max retries | 3 (hardcoded — not configurable) |
| Old record retention | 30 days (hardcoded — not configurable) |
| Notifications | Admin notification for each cancelled stuck job — subject and body from i18n keys |
| Audit event types | `batchgen_stuck_cancelled`, `batchgen_retried`, `batchgen_records_purged` |

---

## 5. Error Handling Strategy

### 5.1 Authentication Failure

| Scenario | Response | Logging |
|----------|----------|---------|
| CRON_SECRET mismatch | 401 (from `authResult.response`) | `logger.warn` with i18n message |
| Missing Authorization header | 401 (from `authResult.response`) | `logger.warn` with i18n message |

### 5.2 Redis Lock Failure

| Scenario | Response | Logging |
|----------|----------|---------|
| Lock already held | 200 `{ skipped: true, reason: "lock_held" }` | `logger.info` with `cron.common.lockSkipped` i18n key |
| Redis unavailable (connection error) | Proceed without lock (graceful degradation) | `logger.warn` — "Redis lock unavailable, proceeding without lock" |
| Lock TTL expired mid-job | Job continues; next invocation may overlap | Acceptable risk — idempotency keys prevent duplicate effects |

### 5.3 Per-Item Processing Failure

| Scenario | Handling | Logging |
|----------|----------|---------|
| Single certificate expiry processing fails | Log error, continue to next certificate | `logger.warn` with certificate ID and error message |
| Single file deletion fails | Log error, continue to next file | `logger.warn` with file path and error message |
| Single cache entry deletion fails | Log error, continue to next entry | `logger.warn` with cache key and error message |
| Single verification log aggregation fails | Abort aggregation, do not delete logs | `logger.error` with date range and error message |
| Single batch gen job cancellation fails | Log error, continue to next job | `logger.warn` with job ID and error message |

### 5.4 Job-Level Failure

| Scenario | Response | Logging |
|----------|----------|---------|
| Service initialization failure | 500 `{ success: false, error: message }` | `logger.error` with `cron.common.jobFailed` i18n key |
| Repository query failure (non-per-item) | 500 `{ success: false, error: message }` | `logger.error` with service context |
| Unhandled exception | 500 `{ success: false, error: "Internal error" }` | `logger.error` with full stack trace |

### 5.5 Partial Success Reporting

All cron responses include a stats object with:

| Field | Type | Description |
|------|------|-------------|
| `success` | `boolean` | True if job completed (even with partial failures) |
| `processed` | `number` | Total items attempted |
| `succeeded` | `number` | Items that succeeded |
| `failed` | `number` | Items that failed |
| `errors` | `string[]` | Up to 10 error messages from failed items |
| `jobName` | `string` | Cron job name for identification |
| `runTimestamp` | `string` | ISO UTC timestamp |

---

## 6. Env Config Registration

### 6.1 New Environment Variables

| Var Name | Type | Default | Category | isSecret | Description |
|----------|------|---------|----------|----------|-------------|
| `CERT_EXPIRY_CRON_SCHEDULE` | string | `0 6 * * *` | cron | false | Expired certificate detection schedule |
| `CERT_STORAGE_CLEANUP_CRON_SCHEDULE` | string | `0 7 * * *` | cron | false | Storage cleanup schedule |
| `CERT_ORPHAN_FILE_GRACE_DAYS` | number | 7 | config | false | Grace period (days) before orphan file deletion |
| `CERT_STORAGE_QUOTA_WARN_PERCENT` | number | 80 | config | false | Storage usage percentage threshold for warning |
| `CERT_RENDER_CACHE_CLEANUP_CRON_SCHEDULE` | string | `0 3 * * *` | cron | false | Render cache cleanup schedule |
| `CERT_RENDER_CACHE_RETENTION_HOURS` | number | 168 | config | false | Render cache retention period (hours) |
| `CERT_VERIFICATION_CLEANUP_CRON_SCHEDULE` | string | `0 8 * * 0` | cron | false | Verification log cleanup schedule |
| `CERT_VERIFICATION_LOG_RETENTION_DAYS` | number | 90 | config | false | Verification log retention (days) |
| `CERT_BATCHGEN_CLEANUP_CRON_SCHEDULE` | string | `*/30 * * * *` | cron | false | Batch generation cleanup schedule |

### 6.2 Registration Files

Each new env var is registered in four locations (following the `SIGNED_URL_CLEANUP_*` precedent):

| File | Registration Action |
|------|---------------------|
| `backend/lib/environment.d.ts` | Add type declaration for each new env var |
| `backend/lib/env-config-keys.ts` | Add entry to `ENV_CONFIG_KEYS[]` array with `category`, `isSecret`, `displayStrategy` |
| `.env.example` | Add commented-out entry with default value and description |
| `.github/workflows/deploy.yml` | Add env var injection in all 3 environment steps (build, preview, production) |

### 6.3 vercel.json Registration

Add 5 new entries to the `crons[]` array in `vercel.json`:

| Entry | Path | Schedule |
|-------|------|----------|
| 1 | `/api/cron/cert-expiry-detection` | `0 6 * * *` |
| 2 | `/api/cron/cert-storage-cleanup` | `0 7 * * *` |
| 3 | `/api/cron/cert-render-cache-cleanup` | `0 3 * * *` |
| 4 | `/api/cron/cert-verification-cleanup` | `0 8 * * 0` |
| 5 | `/api/cron/cert-batchgen-cleanup` | `*/30 * * * *` |

Note: The schedules in `vercel.json` are static — they cannot reference env vars. The env vars (`CERT_*_CRON_SCHEDULE`) are for documentation and manual override purposes. The actual schedule used by Vercel Cron is the one in `vercel.json`. If an admin needs to change the schedule, they must update `vercel.json` and redeploy. The env vars serve as the documented intent and can be read by monitoring tools.

---

## 7. i18n Design

### 7.1 Namespace and Sub-Domain

All cron job log messages and cleanup-related notifications use the `certificates` namespace with the `cron` sub-domain.

| Property | Value |
|----------|-------|
| Namespace | `certificates` |
| Sub-domain | `cron` |
| Type schema location | `shared/locale/certificates.ts` (type schema) |
| English implementation | `shared/locale/en/certificates.ts` |
| Arabic implementation | `shared/locale/ar/certificates.ts` |
| Key count | ~25 (as defined in requirements.md §7) |
| Pluralization | Count-based keys use Arabic plural rules (zero/one/two/few/many/other) |
| Interpolation | Several keys use `{count}`, `{code}`, `{title}`, `{path}`, `{jobId}`, etc. |

### 7.2 Key Categories

| Category | Key Prefix | Count | Interpolation | Pluralization |
|----------|-----------|-------|----------------|---------------|
| Expiry detection | `cron.expiry.*` | 6 | `count`, `code`, `title`, `issueDate`, `expiryDate` | `count` keys |
| Storage cleanup | `cron.storage.*` | 6 | `count`, `path`, `sizeBytes`, `percent`, `usedBytes`, `limitBytes` | `count` keys |
| Render cache | `cron.renderCache.*` | 3 | `count`, `scope`, `id` | `count` keys |
| Verification | `cron.verification.*` | 2 | `count`, `startDate`, `endDate`, `retentionDays` | `count` keys |
| Batch generation | `cron.batchGen.*` | 3 | `count`, `jobId`, `retryCount` | `count` keys |
| Common | `cron.common.*` | 2 | `jobName`, `error` | None |

### 7.3 Implementation Approach

The `cron` sub-domain keys are defined alongside all other certificate sub-domains in the type schema. Each key's type is defined based on its interpolation parameters:

- Simple log messages: `() => string`
- Count-based messages: `(count: number) => string` (with Arabic pluralization)
- Interpolation messages: `(param: string) => string` or `(count: number, param: string) => string`
- Multi-parameter messages: `(title: string, issueDate: string, expiryDate: string) => string`

Both English and Arabic implementations provide the translations. Arabic implementations for count-based keys must implement all six plural forms (zero/one/two/few/many/other).

### 7.4 Access Patterns

| Context | Access Pattern | Example |
|---------|---------------|---------|
| Cron route (server-side) | `getServerTranslations(locale).dashboardTranslations.certificate` then `t.certificates.cron.expiry.jobStarted()` | Default locale "en" for cron |
| Service layer | `ctx.t().certTranslations` or `getServerTranslations(locale).dashboardTranslations.certificate` | Same as cron route |
| Notification dispatch | `getServerTranslations(holderLocale, "certificates")` | Use holder's preferred locale |

Note: Cron jobs run unauthenticated — the locale defaults to "en". For notification dispatch, the certificate holder's preferred locale (if stored) is used; otherwise "en".

---

## 8. Data Model References

### 8.1 Existing Tables (Referenced)

| Table | Plan | Usage in Cron Jobs |
|-------|------|--------------------|
| `certificates` | Plan 1 | Expired detection (scan + update status) |
| `certificate_templates` | Plan 1 | Orphan background image detection (reference check) |
| `certificate_verification_logs` | Plan 1 | Verification log cleanup (aggregate + delete) |
| `batch_generation_jobs` | Plan 1 | Batch gen cleanup (cancel stuck, retry failed, purge old) |
| `audit_logs` | Existing | All cron jobs write audit entries |
| `signed_urls` | Existing | Signed URL cleanup |
| `notifications` | Existing | Expiry and quota notification dispatch |

### 8.2 New Table

| Table | Purpose | Columns |
|-------|---------|---------|
| `certificate_cleanup_log` | Track orphan file detection and deletion | `id`, `filePath`, `fileType` (pdf/background_image), `detectedAt`, `deletedAt` (nullable), `fileSizeBytes`, `createdAt`, `updatedAt` |

### 8.3 New GraphQL Mutations

| Mutation | Auth Scope | Input | Returns |
|----------|-----------|-------|---------|
| `triggerCertificateExpiryDetection` | admin | `trigger: 'cron' \| 'manual'` | `CleanupResult` |
| `triggerCertificateStorageCleanup` | admin | `trigger: 'cron' \| 'manual'` | `CleanupResult` |
| `triggerCertificateRenderCacheCleanup` | admin | `trigger: 'cron' \| 'manual'` | `CleanupResult` |
| `triggerVerificationLogCleanup` | admin | `trigger: 'cron' \| 'manual'` | `CleanupResult` |
| `triggerBatchGenerationCleanup` | admin | `trigger: 'cron' \| 'manual'` | `CleanupResult` |

---

## 9. AGENTS.md Updates

This plan adds certificate cron documentation to:

| AGENTS.md File | Section Added | Content |
|----------------|--------------|--------|
| `app/AGENTS.md` | Certificate Cron Routes | Route paths, auth pattern, service delegation, lock pattern |
| `backend/services/AGENTS.md` | Certificate Cleanup Services | Namespace structure, service list, per-item failure isolation |
| Root `AGENTS.md` | Certificate Feature (cron subsection) | Cron route list, env var list, Redis lock pattern |

(Detailed AGENTS.md updates are executed by Plan 21 — Knowledge Propagation.)

---

## 10. Testing Strategy

### 10.1 Service Tests

| Service | Test File | Test Strategy |
|---------|-----------|---------------|
| ExpiryDetectionService | `backend/services/cert/test/cleanup/expiry-detection.test.ts` | Mocked repos, test happy path + per-item failure + idempotency + notification dispatch |
| StorageCleanupService | `backend/services/cert/test/cleanup/storage-cleanup.test.ts` | Mocked storage adapter + repos, test orphan detection + grace period + deletion + quota |
| RenderCacheCleanupService | `backend/services/cert/test/cleanup/render-cache-cleanup.test.ts` | Mocked entity cache service, test invalidation by tag + by key + periodic cleanup |
| VerificationLogCleanupService | `backend/services/cert/test/cleanup/verification-log-cleanup.test.ts` | `runInRollback` with real DB, test aggregation + deletion + audit entry |
| BatchGenCleanupService | `backend/services/cert/test/cleanup/batchgen-cleanup.test.ts` | `runInRollback` with real DB, test stuck cancellation + retry + purge |

### 10.2 Cron Route Tests

| Route | Test File | Test Strategy |
|-------|-----------|---------------|
| All 5 cert cron routes | `frontend/common/graphql/test/cert/cron/` | `testClient` (dev server), test auth failure, lock skip, manual trigger mutations |

### 10.3 Integration Tests

| Test | File | Strategy |
|------|------|----------|
| Expiry detection end-to-end | `backend/db/test/logic/cert/cron/expiry-detection.test.ts` | `runInRollback`, create test certs with past expiry, run service, verify status + notification + audit |
| Storage cleanup end-to-end | `backend/db/test/logic/cert/cron/storage-cleanup.test.ts` | `runInRollback`, create test orphans, run service, verify cleanup log + deletion |
| Verification log cleanup | `backend/db/test/logic/cert/cron/verification-cleanup.test.ts` | `runInRollback`, create test logs, run service, verify aggregation + deletion |

---

## 11. Quality Verification Approach

| Check | Method | Pass Criteria |
|------|--------|---------------|
| Type checking | `bun tsgo` | No errors in new service, route, or locale files |
| Formatting | `bun biome:check` | All new files formatted correctly |
| Linting | Lint queue client on new files | No lint errors in new files |
| Service tests | `bun run scripts/run-test/run-test.ts <test-path>` | All service tests pass |
| Cron route tests | `bun run test:graphql` (with cert cron test files) | All cron route tests pass |
| Integration tests | `bun run scripts/run-test/run-test.ts <test-path>` | All integration tests pass (runInRollback) |
| Env config registration | Verify all 4 files updated | `environment.d.ts`, `env-config-keys.ts`, `.env.example`, `deploy.yml` all have new vars |
| vercel.json | Verify 5 new cron entries | All 5 cert cron routes registered |

---

## 12. Design Decision Trade-Offs

### 12.1 Cron Frequency vs. Cost

| Job | Frequency | Justification |
|-----|-----------|---------------|
| Expired detection | Daily | Certificates expire on a date — daily check is sufficient |
| Storage cleanup | Daily | Orphan files accumulate slowly; daily is sufficient |
| Render cache cleanup | Daily | Cached renders expire by TTL anyway; daily cleanup reclaims space |
| Verification cleanup | Weekly | Log aggregation is a batch operation; weekly reduces DB load |
| Batch gen cleanup | Every 30 min | Stuck jobs should be caught quickly to prevent user-visible delays |

### 12.2 Hardcoded vs. Configurable Thresholds

| Threshold | Configurable? | Justification |
|-----------|--------------|---------------|
| Stuck job timeout (30 min) | Hardcoded | 30 min is a universal reasonable timeout — unlikely to need per-deployment tuning |
| Max retries (3) | Hardcoded | 3 retries is a standard industry practice — unlikely to need tuning |
| Old record retention (30 days) | Hardcoded | 30 days is sufficient for audit — unlikely to need tuning |
| Orphan file grace period (7 days) | Env configurable | May need adjustment based on deployment backup strategy |
| Log retention (90 days) | Env configurable | Compliance requirements may vary by deployment |
| Render cache retention (168 hours) | Env configurable | Storage cost vs. performance trade-off may vary |
| Storage quota warning (80%) | Env configurable | Different deployments have different storage limits |

---

## 13. Security Considerations

### 13.1 Cron Auth

All certificate cron routes use `verifyCronSecretAuth` with the existing `CRON_SECRET`. No new secrets are introduced. The auth guard rejects requests without a valid Bearer token.

### 13.2 Manual Trigger Auth

All manual trigger mutations require admin auth scope — only admin users can trigger cleanup jobs outside the cron schedule.

### 13.3 Data Access

Cron jobs access data with system-level permissions (no user context). This is acceptable because:
- Cron runs are authenticated via `CRON_SECRET` (server-to-server)
- Manual triggers require admin auth scope
- All operations are logged via audit entries

### 13.4 File Deletion Safety

Orphan file deletion has a grace period (default 7 days) to prevent accidental deletion of files that are in the process of being associated. The cleanup log table tracks detection and deletion timestamps for auditability.

### 13.5 No Sensitive Data in Logs

Cron log messages do not include sensitive data (verification codes, file contents). Log messages include only operational metadata (counts, file paths, error messages, job names).

---

## Reality Check Notes

Verified against the actual codebase at `/home/ahmed/Projects/siraj-cert/` on 2026-08-02.

### Verified Correct
- **Cron auth helper**: `backend/lib/cron-auth.ts` EXISTS and exports `verifyCronSecretAuth(request)` returning `CronAuthResult`. Verified `CRON_SECRET`/`Authorization: Bearer ...` header pattern, GET-only enforcement, timing-safe compare. Plan's "reuse as-is" decision (T04) is correct — the function already exists.
- **Vercel Cron infrastructure**: `vercel.json` has a top-level `"crons": [...]` array with `{ "path": "/api/cron/class-reminders", "schedule": "0 6 * * *" }` entries. Plan's approach of appending 5 new entries to `crons[]` matches the actual format.
- **Flat route convention**: The existing codebase uses FLAT route paths at `app/api/cron/<name>/route.ts` — confirmed via `app/api/cron/class-reminders/route.ts`, `app/api/cron/ticker/`, `app/api/cron/execute/`. No nesting under a `cert/` subfolder. design.md's `app/api/cron/cert-*/route.ts` pattern matches; **tasks.md was updated to match** (T03 vercel.json entries and T10 route file paths were changed from the nested `app/api/cron/cert/<job>/route.ts` form to the flat `app/api/cron/cert-<job>/route.ts` form, aligning with design.md and the actual convention).
- **Service organization**: `backend/services/cert/cleanup/` is a NEW domain namespace (no `backend/services/cert/` exists yet — created by earlier cert plans). Consistent with existing per-domain service folders (`backend/services/notification/`, `backend/services/billing/`, etc.). The existing `backend/services/cron/` (with `queue-adapters/`, `test/`) is a SEPARATE generic cron-infra service and is NOT the home for cert cleanup services.
- **Service test location**: `backend/services/cert/test/cleanup/*.test.ts` matches the existing `<domain>/test/` subdirectory convention (e.g. `backend/services/auth/test/`, `backend/services/billing/test/`). Co-located `*.test.ts` files also exist elsewhere but the `test/` subdir form is valid.
- **DB test location**: `backend/db/test/logic/cert/cron/*.test.ts` matches `backend/db/test/logic/<domain>/` convention. Repo tests at `backend/db/test/repo/cert/*.repository.test.ts` match `{entity}.repository.test.ts` naming (e.g. existing `student.repository.test.ts`).
- **Docs destination**: `docs/services/certificate-cron-cleanup.md` matches `docs/services/` (currently holds `entity-cache-service.md`).
- **`runInRollback`**: exists at `backend/db/test/test-utils.ts` (exported, used throughout DB tests). Plan's usage is correct.
- **package.json**: no cron/scheduling library (node-cron, bull, etc.) — Vercel Cron is the only scheduler. Plan correctly relies solely on `vercel.json` + route handlers; no job-queue dependency introduced.

### Corrections Made
1. **tasks.md T03 + T10**: route paths changed from nested `app/api/cron/cert/<job>/route.ts` to flat `app/api/cron/cert-<job>/route.ts` (and matching `/api/cron/cert-<job>` vercel.json paths) to align with design.md §3.1 and the actual `app/api/cron/<name>/route.ts` convention (e.g. `class-reminders`). Job names normalized to design.md's canonical names: `cert-expiry-detection`, `cert-storage-cleanup`, `cert-render-cache-cleanup`, `cert-verification-cleanup`, `cert-batchgen-cleanup`.

### Notes
- The `crons[]` schedules in design.md are static strings in `vercel.json`; `CERT_*_CRON_SCHEDULE` env vars are documentation-only (cannot drive Vercel Cron scheduling). Plan documents this correctly (design.md §6.3).
- `frontend/stores/` is NOT referenced by this plan (no frontend store work), so the `frontend/common/stores/` correction (stores do not live at `frontend/stores/`) does not apply here.


---

## SWE Expert Review Notes

> Review performed 2026-08-02 against the actual codebase at `/home/ahmed/Projects/siraj-cert/`.

### Job Design

1. **Idempotency — MIXED; strongest on expiry, weakest on purge (P1).**
   - **Expiry detection**: UTC-date idempotency key (DD-3, REQ-22.4) is correct and matches the verified `class-reminders` precedent (soft dedupe via payload metadata). Good.
   - **Storage orphan cleanup**: `certificate_cleanup_log` (DD-4, REQ-22.6/22.7) tracks `detectedAt` → `deletedAt`. Re-running is safe (a deleted file → `cleanupExpiredSignedUrls` deletion is a no-op; FileExists is checked). **Acceptable.**
   - **`cleanupExpiredSignedUrls`**: deleting rows where `expiresAt < now()` is idempotent. Good.
   - **Storage quota**: idempotent (re-check is fine), but **no de-dupe on the admin notification** — repeated quota breaches across runs spam admins. **Fix (P1):** suppress quota warning if a warning was already sent within N hours (Redis `SET NX EX` on `cert-quota-warn-sent:<scope>` with TTL = 24h).
   - **Verification log cleanup**: aggregate-then-delete — idempotent only if aggregation is keyed (e.g. by day/month) and re-running is "insert or update on conflict". The design says "Aggregation SHALL be computed before archival deletion" but does not state the aggregation is upsert (idempotent). If a run aggregates days X..Y then deletes, and a re-run aggregates X..Y again it will find zero rows (already deleted) — so re-running the same window is safe ONLY because the rows are gone, NOT because aggregation itself is idempotent. A **partial failure** (aggregate succeeds for X, fails for Y, delete never runs) leaves X aggregated but X rows still present; a re-run re-aggregates X → **double-counting**. **Fix (P1):** make aggregation a `... ON CONFLICT (date) DO UPDATE SET ...` upsert keyed by date, OR wrap "aggregate batch for day K" + "delete day K rows" in a single per-day transaction so a failed day is never partially aggregated. State this explicitly.
   - **Batchgen purge**: deleting records > 30 days old is idempotent (delete-where-style). Re-running is safe. Good. But "re-enqueue failed jobs with retry < 3" (REQ-22.20): if the re-enqueue itself fails mid-way (increment retry count succeeds, enqueue fails), the next run sees the incremented count and may under-retry or skip — **non-idempotent retry increment**. **Fix (P2):** the retry-increment + enqueue must be one transaction; on failure, roll back the increment.
2. **Safe to re-run — YES overall** with the per-day aggregation caveat (issue #1) and the retry-increment atomicity caveat. Document the per-job re-run contracts in a singlematrix (added under "Reality-Check Corrections").
3. **Interval > job duration (overlap) — HANDLED via Redis lock (good) BUT fragile (P1).** DD-1 sets a 300s (5min) TTL. The batchgen job runs every 30 min with a 120s lock (§4.5). If a job takes longer than its TTL, the lock auto-expires and a subsequent invocation overlaps. design.md §5.2 acknowledges "TTL expired mid-job... acceptable risk — idempotency keys prevent duplicate effects". This is true for expiry/aggregate, but for **file deletion** (storage cleanup) an overlap can cause:
   - Worker A deletes file F (after grace). Worker B re-detects F as orphan (race: B's `findOrphanPdfs` ran before A's `deletedAt` write committed), worker B writes a new `certificate_cleanup_log` row with a fresh `detectedAt` and tries to delete F again (idempotent deletion = no-op, BUT the cleanup-log row is now orphan-of-an-orphan, polluting the audit table). **Fix (P1):** `findOrphanPdfs` must EXCLUDE rows already deleted (`deletedAt IS NULL`) AND must check `deleteOrphanFile` returns already-deleted as skip (no new log row). The design implies this but should state "deleteOrphanFile is idempotent AND does not insert a duplicate cleanup_log row on re-detection".
   - Better: use a per-file Redis lock (`cron-lock:cert-storage-cleanup:file:<path>`) OR a `SELECT ... FOR UPDATE SKIP LOCKED` on the cleanup_log row during deletion.
4. **Lock TTL vs maxDuration — UNSPECIFIED (P2).** Vercel Cron functions have a `maxDuration` (Hobby 60s, Pro 300s, Enterprise 900s by default). The 300s lock TTL is within Pro's 300s limit but a job that legitimately takes 290s would be killed by Vercel while holding the lock — the lock leaks for its remaining TTL, blocking the next scheduled run. **Fix:** set `maxDuration` for each cron route via `export const maxDuration = 60` (or appropriate), < lock TTL, document the relationship.

### Vercel Cron

5. **vercel.json registration — CORRECT IN SHAPE (P0 none).** Verified `vercel.json` has top-level `"crons": [{ "path": "/api/...", "schedule": "..." }]`. The 5 new entries follow the exact format. **However (P1):** the existing entries are `0 6 * * *` and `0 6 * * *`. The cert jobs add `0 3`, `0 6`, `0 7`, `0 8 * * 0`, `*/30 * * * *`. **Vercel Hobby plan limits crons to 2 daily** (free tier); Pro allows more but with frequency caps. The repo currently has 2 crons — adding 5 ⇒ 7 total. **Risk (P1):** if the deployment is on Hobby, this silently exceeds the cron quota and some jobs will not run (Vercel does not error — it skips). **Fix (P1):** verify the deployment plan tier in `deploy.yml` (verified exists at `.github/workflows/deploy.yml`) and state the cron-count assumption; if Hobby, consolidate jobs (e.g. one `cert-daily-cleanup` route that dispatches all daily sub-Jobs) to stay within 2 daily + the existing 2.
6. **Auth secret checked — YES (P0 none).** Verified `backend/lib/cron-auth.ts` exports `verifyCronSecretAuth` using `CRON_SECRET` via `getEnvironmentConfig().cronSecret`, timing-safe compare, GET-only, fail-closed. Plan correctly reuses it as-is (DD-8, REQ-22.22). T04's "if not existing" branch is dead code (it exists) — note that T04 should be a no-op verification task, not a creation task.
7. **Schedule times — REASONABLE but collide with existing jobs (P2).** `0 6` is already used by fx/refresh and class-reminders. Adding `cert-expiry-detection` at `0 6` triples the 06:00 UTC load. **Fix (P2):** stagger: expiry `0 6`, storage `0 7` ✓, render-cache `0 4`, verification `0 8 * * 0` ✓, batchgen `*/30`. Shift expiry to `0 5` to avoid stacking on 06:00. Document the load-distribution intent (one heavy job per hour slot).
8. **Static schedules cannot be env-driven — CORRECTLY DOCUMENTED** (design.md §6.3 notes "schedules in vercel.json are static; CERT_*_CRON_SCHEDULE env vars are documentation-only"). This makes the env-var registration partly ceremonious — handlers won't read them. **P2)** consider dropping the schedule env-var registration entirely OR repurpose them: the cron route itself can READ `CERT_*_CRON_SCHEDULE` and **reschedule itself via the Vercel API** on deploy-trigger. If purely documentation, file them under a `documentation-only` category in `env-config-keys.ts` (see issue #11) to avoid giving admins a false impression they can change clock cadence from Settings.

### Cleanup Logic

9. **Orphan detection — INCOMPLETE (P1).** The design says "identify PDFs in certificate storage that are not referenced by any `certificates.pdfStoragePath` column" (REQ-22.6). This requires LISTING every object in storage and subtract ing DB-referenced paths. For large storage this is O(objects) and slow. **Fix (P1):** the inverse scan — `SELECT storage_usage WHERE usageType='certificate_pdf' AND certificateId IS NOT NULL` join `certificates` on a path; rows whose certificate is soft-deleted for > 30 days ⇒ orphan. This avoids listing all bucket objects (which can be 100k+). The design's T06 says exactly this ("usageType LIKE 'certificate_%' AND entityId IS NULL OR entityId references a soft-deleted certificate") — **good** — but conflicts with REQ-22.6's literal "PDFs in storage not referenced by certificates.pdfStoragePath". **Reconcile (P1):** choose the storage-usage-table approach (T06) as canonical (efficient, auditable) and rewrite REQ-22.6/22.8 to match. The bucket-listing scan is not viable at scale.
10. **Dry-run modes — MISSING (P1).** No dry-run mode for any cleanup job. File deletion and record purge are **destructive, irreversible operations**. The manual trigger mutation (REQ-22.18, DD-7) is the only out-of-band control and it runs the full destructive path. **Fix (P1):** add a `dryRun: boolean` input to all manual trigger mutations (default `false` for backward compat) and to the cron routes via query param `?dryRun=true`. Dry-run: report what would be deleted, change zero rows, delete zero files. This is a standard safety primitive for cleanup jobs and its absence is a deployment-blocking risk.
11. **Safety limits (max files per run) — MISSING (P1).** A storage cleanup run could delete thousands of files in one invocation, blowing `maxDuration` and risking a partial-delete-with-locked-state. **Fix (P1):** add `MAX_FILES_PER_RUN` (default 100) and `MAX_RECORDS_PER_RUN` (default 5000) env-configurable caps; jobs process up to the cap and report `truncated: true` so operators know to re-run. The batchgen purge and verification-log delete especially need this — a 90-day back-clog on first run could be millions of rows.
12. **Grace period logic — CORRECT.** 7-day grace with `detectedAt` persistence (DD-4) prevents deleting a file mid-upload. Good.

### Error Handling

13. **Per-item failure isolation — CORRECT and matches `class-reminders` precedent (P0 none).** verifyCrrenron route patterns confirmed: `class-reminders/route.ts` (verified full source) uses exactly try/catch + `logger.error` + 500. DD-2's partial-success reporting is consistent.
14. **Job failure → what happens — PARTIAL (P1).** The design documents the HTTP response (200 partial / 500 job-level) and logging (`logger.error` with `cron.common.jobFailed`). **Missing:**
   - **No alerting.** A failed cron job produces a `logger.error` line in the Vercel observability stream but there is NO mechanism to page/notify an operator. Vercel Cron failures do generate a notification in the Vercel dashboard, but a **partial-success** (200 with `failed: 50`) is NOT flagged by Vercel (Vercel only alerts on non-2xx). **Fix (P1):** on `failed > 0` OR `skipped` (lock held), dispatch an admin notification via the existing notification pipeline (`backend/services/notification/`) — same as the storage-quota-warning path. Reuse the same 24h de-dupe key as issue #1.
   - **No retry policy.** If a job fails entirely (500), Vercel Cron retries per its platform config (default: no automatic retry). The design does not specify whether the cert jobs should set `vercel.json` retry options (Vercel does not support per-job retry in `vercel.json` currently — so retries must be self-healing on the NEXT scheduled run). State this: "failed jobs self-heal on next scheduled run; no manual intervention needed unless the failure persists > 2 consecutive runs". Add a consecutive-failure counter in the cleanup_log/stats to detect "stuck" jobs (failed N times in a row → escalate alert).
15. **Failure logging — ADEQUATE (P2).** `logger.warn` per-item, `logger.error` job-level. But log messages interpolate `{path}`, `{sizeBytes}` etc. into i18n strings (REQ-22.7 logs the file path) — file paths may contain PII-path patterns (user IDs in uploads). Confirm `certificate.pdfStoragePath` naming does NOT embed user names/emails. **P2)** audit storage-path naming with Plan 7 before assuming paths are safe to log.

### Reality-Check Corrections to Apply

A. **Verify Vercel cron quota** (issue #5) — 7 total crons may exceed Hobby limit; consider consolidating to a single `cert-daily-cleanup` dispatcher if tier is Hobby.
B. **Add `dryRun` mode** to manual triggers and cron routes (issue #10).
C. **Add `MAX_FILES_PER_RUN` / `MAX_RECORDS_PER_RUN` safety caps** (issue #11).
D. **Make verification-log aggregation idempotent per-day** (upsert + per-day tx) (issue #1).
E. **Wrap batchgen retry-increment + enqueue in one transaction** (issue #1).
F. **Add consecutive-failure counter + admin alert on partial-success** (issue #14).
G. **Add quota-warning de-dupe** (24h key) (issue #1).
H. **Reconcile REQ-22.6/22.8 orphan detection** to the storage-usage-table approach used in T06 (issue #9).
I. **Set `export const maxDuration` per route, < lock TTL** (issue #4).
J. **Stagger `0 6` expiry to `0 5`** to avoid stacking (issue #7).
K. **Add an `EnvConfigCategory` of `"cron"` (or reuse `"app"`/`"general"`)** — verified the existing union is `email|sms|push|fx|cache|redis|storage|auth|app|meeting|billing|general`; **`"cron"` does NOT exist**. The design (§6.1) lists category `cron` for schedule vars — this will not type-check. **Fix (P1):** add `"cron"` to the `EnvConfigCategory` union in `backend/lib/env-config-keys.ts` AND `backend/types/shared/env-config.types.ts`, OR map schedule/retention vars to existing `"storage"` / `"app"` / `"general"` categories. State which.
L. **`environment.d.ts` path** — design §6.2 references `backend/lib/environment.d.ts`; verified the actual file is `environment.d.ts` at REPO ROOT (not under `backend/lib/`). **Fix (P2):** correct the path to `/environment.d.ts` (root).

### Remaining Risks

- **Single-flight lock vs. graceful Redis-down degradation (DD-1 / §5.2):** the design chooses "proceed without lock on Redis outage". This means a Redis outage converts every cron invocation into a potential overlap. For the storage-delete job this can corrupt the cleanup_log (issue #3). Recommend: on Redis-unavailable, the destructive jobs (storage, verification-delete, batchgen-purge) should **SKIP** rather than proceed (fail-safe), while non-destructive jobs (expiry detection) may proceed. State this refinement.
- **`cert-verification-cleanup` weekly-run leaves logs growing between runs:** if verification volume is large, 7 days between cleanups means the `certificate_verifications` table grows by up to 7× daily volume before being pruned. For high-traffic public verification, make this daily not weekly, OR add an on-insert TTL/archival trigger. Reconsider REQ-22.16 cadence.
- **Manual-trigger GraphQL mutations (DD-7) require `admin` scope but the manual trigger delegates to the SAME service used by the cron route — which runs with system privileges (no user context).** A privileged admin can trigger destructive cleanup on-demand. There is no audit of "which admin triggered it" beyond the audit event `trigger: 'manual'` discriminator — ensure the triggering admin's user ID is recorded in the audit entry metadata (REQ-22.18 says "persisted in run metadata" — confirm the admin user ID is in that metadata, not just the trigger enum).
- **`certificate_cleanup_log` table grows unbounded** (rows for detected orphans, never deleted after the file is deleted). Add a cleanup of `certificate_cleanup_log` rows where `deletedAt IS NOT NULL AND deletedAt < now() - 90 days` into the storage cleanup job itself.
- **Plan 22 ↔ Plan 21 coupling:** Plan 21's CRON_PATTERNS.md is authored from Plan 22's requirements.md — if Plan 22's design changes (e.g. adding `dryRun`, caps), Plan 21's doc must be re-synced. Cross-link the two plans in their respective "Related Docs".
