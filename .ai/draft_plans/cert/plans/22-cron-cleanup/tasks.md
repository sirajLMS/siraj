# Plan 22 — Cron Jobs & Cleanup Tasks: Tasks

> **Plan #**: 22
> **Dependencies**: Plan 1 (schema), Plan 3 (repository), Plan 4 (services), Plan 5 (GraphQL—types), Plan 6 (PDF rendering—cache entries), Plan 7 (storage—storage cleanup), Plan 16 (certificates—status updates)
> **Scope**: 5 cron jobs: expired certificate detection, storage cleanup (orphaned files), render cache cleanup, verification log archiving, batch generation cleanup. Vercel Cron integration, Redis single-flight locks, failure isolation, audit logging, idempotency
> **Execution**: Sequential through phases below

---

## Dependency Graph

```
T01 ──► T02 ──► T03 ──► T04
                          │
         ┌─── T05 (parallel) ───┐
         │                       │
T06 ──► T07 ──► T08 ──► T09 ──► T10 ──► T11
```

---

## Phase 1: Shared Infrastructure (T01–T04)

### T01: Create Cleanup Infrastructure Module
- [ ] Create `backend/services/cert/cleanup/CleanupModule.ts` — namespace export barrel for cleanup services
- [ ] Create `backend/services/cert/cleanup/cleanup-lock.ts` — Redis single-flight lock utility
  - `acquireLock(jobName: string, ttl: number = 300)`: `SET NX EX` on `cron:cert:{jobName}` key
  - `releaseLock(jobName: string)`: `DEL` on key
  - Lock TTL: 300s (5 min max runtime before auto-release)
  - If lock cannot be acquired, job skips this run and logs `logger.info`
- [ ] Create `backend/services/cert/cleanup/cleanup-audit.ts` — audit logging helper
  - `logCleanupEvent(jobName, affectedCount, metadata)`: inserts into audit log table
- [ ] Create `backend/services/cert/cleanup/cleanup-stats.ts` — stats aggregation
  - `recordJobStats(jobName, status, duration, processedCount, errorCount)`
- [ ] Run quality loop on all files
- [ ] Verify against: `backend/services/AGENTS.md`, `backend/AGENTS.md`, `.agents/instructions/backend.instructions.md`
- **Requirements**: REQ-CRON-05 (Redis single-flight), REQ-CRON-13 (failure isolation), REQ-CRON-16 (audit logging)
- **Files created**: `CleanupModule.ts`, `cleanup-lock.ts`, `cleanup-audit.ts`, `cleanup-stats.ts`
- **Dependencies**: Plan 4 (service patterns)
- **Estimated**: 3h

### T02: Register Cron Environment Variables
- [ ] Update `backend/lib/env.ts` (or wherever env config is registered in Siraj) to include cert cron variables:
  - `CERT_CRON_EXPIRED_CHECK_INTERVAL`: schedule for expired cert detection (default: `0 2 * * *` — daily at 2am)
  - `CERT_CRON_STORAGE_CLEANUP_INTERVAL`: schedule for storage cleanup (default: `0 3 * * 0` — weekly Sunday at 3am)
  - `CERT_CRON_CACHE_CLEANUP_INTERVAL`: schedule for render cache cleanup (default: `0 4 * * *` — daily at 4am)
  - `CERT_CRON_LOG_ARCHIVE_INTERVAL`: schedule for verification log archiving (default: `0 5 * * 0` — weekly Sunday at 5am)
  - `CERT_CRON_BATCH_CLEANUP_INTERVAL`: schedule for batch generation cleanup (default: `0 6 * * *` — daily at 6am)
- [ ] Add variables to `.env.example` with comments explaining each schedule
- [ ] Use zod validation for schedule format if Siraj's env system uses zod
- [ ] Run quality loop
- **Requirements**: REQ-CRON-14 (env config registration)
- **Files modified**: `backend/lib/env.ts`, `.env.example`
- **Dependencies**: T01
- **Estimated**: 2h

### T03: Register Cron Jobs in vercel.json
- [ ] Update `vercel.json` to add 5 cron job entries:
  - `cert-expiry-detection`: path `/api/cron/cert-expiry-detection`, schedule from env
  - `cert-storage-cleanup`: path `/api/cron/cert-storage-cleanup`, schedule from env
  - `cert-render-cache-cleanup`: path `/api/cron/cert-render-cache-cleanup`, schedule from env
  - `cert-verification-cleanup`: path `/api/cron/cert-verification-cleanup`, schedule from env
  - `cert-batchgen-cleanup`: path `/api/cron/cert-batchgen-cleanup`, schedule from env
- [ ] Verify syntax against Vercel Cron format (consult `node_modules/next/dist/docs/` if Next.js 16 cron docs exist)
- [ ] Run quality loop on `vercel.json`
- **Requirements**: REQ-CRON-01 (Vercel Cron integration)
- **Files modified**: `vercel.json`
- **Dependencies**: T02
- **Estimated**: 1h

### T04: Create Cron Auth Helper (if not existing)
- [ ] Check if Siraj already has `verifyCronSecretAuth` function in `backend/lib/` or `app/api/cron/`
- [ ] If not: create `backend/lib/cron-auth.ts` — verifies `Authorization: Bearer {CRON_SECRET}` header
- [ ] If existing: verify it works for the new cert cron paths and that no modifications are needed
- [ ] Document the auth pattern in the cleanup infrastructure module
- [ ] Run quality loop
- **Requirements**: REQ-CRON-02 (cron secret auth)
- **Files created**: `backend/lib/cron-auth.ts` (if not existing)
- **Dependencies**: T03
- **Estimated**: 1h

---

## Phase 2: Individual Cron Jobs (T05–T09)

### T05: Create Expired Certificate Detection Service
- [ ] Create `backend/services/cert/cleanup/ExpiredCertificatesCleanup.ts` — service for detecting expired certificates
- [ ] Service logic:
  - Query certificates where `expiresAt < NOW()` AND `status = 'issued'`
  - For each expired certificate: update status to `expired`, log audit entry
  - Record affected count in stats
  - Return cleanup result: `{ processed: number, updated: number, errors: number }`
- [ ] Idempotency: certificates already `expired` are skipped (no re-processing)
- [ ] Failure isolation: if one certificate update fails, log error and continue to next
- [ ] Service exported from `CleanupModule.ts`
- [ ] Run quality loop
- **Requirements**: REQ-CRON-03 (expired detection), REQ-CRON-13 (failure isolation), REQ-CRON-16 (audit logging)
- **Files created**: `ExpiredCertificatesCleanup.ts`
- **Dependencies**: T01, T04
- **Estimated**: 3h

### T06: Create Storage Cleanup Service
- [ ] Create `backend/services/cert/cleanup/StorageCleanup.ts` — service for cleaning orphaned storage files
- [ ] Service logic:
  - Query storage usage records where `usageType LIKE 'certificate_%'` AND `entityId IS NULL` OR `entityId` references a soft-deleted certificate
  - For each orphaned file: delete from storage provider (Plan 7's storage service)
  - Delete the storage usage record
  - Record affected count
- [ ] Idempotency: if file doesn't exist in storage, skip (no error)
- [ ] Failure isolation: storage provider errors logged and skipped, continue to next file
- [ ] Soft-delete awareness: only clean files where parent entity is soft-deleted for > 30 days
- [ ] Run quality loop
- **Requirements**: REQ-CRON-04 (storage cleanup), REQ-CRON-13 (failure isolation)
- **Files created**: `StorageCleanup.ts`
- **Dependencies**: T01, T04, Plan 7 (storage service)
- **Estimated**: 3h

### T07: Create Render Cache Cleanup Service
- [ ] Create `backend/services/cert/cleanup/RenderCacheCleanup.ts` — service for cleaning expired render cache entries
- [ ] Service logic:
  - Query storage usage records where `usageType = 'certificate_pdf_cache'` AND `createdAt < NOW() - INTERVAL '7 days'`
  - Delete cached PDF files from storage provider
  - Delete storage usage records
  - Record affected count
- [ ] Cache TTL: 7 days (configurable via `CERT_CACHE_TTL_DAYS` env)
- [ ] Idempotency: already-deleted cache files are skipped
- [ ] Failure isolation: per-file errors logged, continue to next
- [ ] Run quality loop
- **Requirements**: REQ-CRON-06 (cache cleanup), REQ-CRON-13 (failure isolation)
- **Files created**: `RenderCacheCleanup.ts`
- **Dependencies**: T01, T04, Plan 6 (cache usage type), Plan 7 (storage service)
- **Estimated**: 2h

### T08: Create Verification Log Archiving Service
- [ ] Create `backend/services/cert/cleanup/VerificationLogArchive.ts` — service for archiving old verification logs
- [ ] Service logic:
  - Query `certificate_verifications` where `verified_at < NOW() - INTERVAL '90 days'`
  - Move old logs to archive table (or mark with `archived = true` flag if design uses soft archive) — follow Plan 1's design
  - Delete archived logs from active table (or update `archived` flag)
  - Record affected count
- [ ] Archive retention: 90 days active, archived retained indefinitely (or per `CERT_VERIFICATION_LOG_RETENTION_DAYS` env)
- [ ] Idempotency: already-archived logs are skipped
- [ ] Failure isolation: per-log errors logged, continue to next
- [ ] Run quality loop
- **Requirements**: REQ-CRON-07 (verification log archiving), REQ-CRON-13 (failure isolation)
- **Files created**: `VerificationLogArchive.ts`
- **Dependencies**: T01, T04, Plan 1 (verifications table)
- **Estimated**: 2h

### T09: Create Batch Generation Cleanup Service
- [ ] Create `backend/services/cert/cleanup/BatchGenerationCleanup.ts` — service for cleaning up stuck batch generations
- [ ] Service logic:
  - Query recipient group items where `status = 'generating'` AND `updatedAt < NOW() - INTERVAL '24 hours'` (stuck for > 24h)
  - Mark stuck items as `failed` with error message "Generation timed out"
  - Query generation jobs (if separate table) where status is pending/generating > 24h → mark as failed
  - Record affected count
- [ ] Timeout threshold: 24 hours (configurable via `CERT_BATCH_TIMEOUT_HOURS` env)
- [ ] Idempotency: items already `failed` or `complete` are skipped
- [ ] Failure isolation: per-item errors logged, continue to next
- [ ] Run quality loop
- **Requirements**: REQ-CRON-08 (batch gen cleanup), REQ-CRON-13 (failure isolation)
- **Files created**: `BatchGenerationCleanup.ts`
- **Dependencies**: T01, T04, Plan 1 (recipient_group_items table)
- **Estimated**: 3h

---

## Phase 3: Cron Route Files & Integration (T10)

### T10: Create 5 App Router Cron Route Files
- [ ] Create `app/api/cron/cert-expiry-detection/route.ts`:
  - Verify cron secret auth (T04)
  - Acquire Redis lock (T01)
  - Call `ExpiredCertificatesCleanup.run()`
  - Release lock
  - Return `Response.json({ success: true, processed: N })`
- [ ] Create `app/api/cron/cert-storage-cleanup/route.ts`:
  - Same pattern: verify auth, acquire lock, call `StorageCleanup.run()`, release, return
- [ ] Create `app/api/cron/cert-render-cache-cleanup/route.ts`:
  - Same pattern: verify auth, acquire lock, call `RenderCacheCleanup.run()`, release, return
- [ ] Create `app/api/cron/cert-verification-cleanup/route.ts`:
  - Same pattern: verify auth, acquire lock, call `VerificationLogArchive.run()`, release, return
- [ ] Create `app/api/cron/cert-batchgen-cleanup/route.ts`:
  - Same pattern: verify auth, acquire lock, call `BatchGenerationCleanup.run()`, release, return
- [ ] All routes follow Next.js 16 App Router route handler conventions (consult `node_modules/next/dist/docs/`)
- [ ] Error responses: `Response.json({ error: 'Unauthorized' }, { status: 401 })` for auth failures, `Response.json({ error: 'Lock busy' }, { status: 409 })` for lock failures, `Response.json({ error: 'Internal error' }, { status: 500 })` for service errors
- [ ] Run quality loop on all 5 route files
- [ ] Verify against: `app/AGENTS.md`, `.agents/instructions/frontend.instructions.md`
- **Requirements**: REQ-CRON-01 (Vercel Cron), REQ-CRON-02 (auth), REQ-CRON-09–12 (route handlers)
- **Files created**: 5 `route.ts` files
- **Dependencies**: T05, T06, T07, T08, T09
- **Estimated**: 3h

---

## Phase 4: Knowledge Propagation (T11)

### T11: Knowledge Propagation & Documentation
- [ ] Read all outcome files in `.ai/plans/cert-cron-cleanup/outcome/`
- [ ] Create canonical reference doc under `docs/services/certificate-cron-cleanup.md` consolidating:
  - 5 cron job specifications (schedule, scope, retry, idempotency)
  - Redis single-flight lock pattern
  - Failure isolation pattern
  - Audit logging workflow
  - Vercel Cron + Next.js route handler integration
  - Env configuration for schedules
- [ ] Update `backend/services/AGENTS.md` with cron cleanup patterns and document reference
- [ ] Update `backend/AGENTS.md` with cert cron section
- [ ] Update `app/AGENTS.md` with cron route handler pattern
- [ ] Update root `AGENTS.md` Important References with new doc
- [ ] Update `.agents/instructions/backend.instructions.md` if new backend service conventions emerged
- [ ] Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings)
- [ ] Write outcome file: `.ai/plans/cert-cron-cleanup/outcome/T11-knowledge-propagation-outcome.md`
- [ ] Update progress: Mark all tasks as `[x]` in this file
- **Requirements**: Feature 6 (Outcome Knowledge Base)
- **Files created**: `docs/services/certificate-cron-cleanup.md`, outcome file
- **Files modified**: `backend/services/AGENTS.md`, `backend/AGENTS.md`, `app/AGENTS.md`, root `AGENTS.md`, instruction files
- **Dependencies**: T10
- **Estimated**: 3h

---

## Execution Order

```
Phase 1: T01 → T02 → T03 → T04         (shared infrastructure)
Phase 2: T05 / T06 / T07 / T08 / T09    (5 cleanup services — can overlap)
Phase 3: T10                              (5 route files)
Phase 4: T11                              (knowledge propagation)
```

Total: 11 tasks, ~29 hours estimated

---

## Quality Loop (Per File)

After creating/modifying ANY file, run:

```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-22","files":["<the-file>"]}'
```

Fix all errors before proceeding to next task.

---

## Instruction Verification (Per Subtask)

| Layer | AGENTS.md | Instruction File |
|---|---|---|
| Backend Services | `backend/services/AGENTS.md`, `backend/AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| Backend Lib | `backend/AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| App Router | `app/AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| Root Config | `AGENTS.md` (root) | — |

---

## Acceptance Criteria Mapping

| AC | Task(s) | Description |
|---|---|---|
| AC-CRON-01 | T03, T10 | 5 cron jobs registered in vercel.json with route handlers |
| AC-CRON-02 | T04, T10 | All routes verify cron secret before executing |
| AC-CRON-03 | T05 | Expired certificates detected and status updated |
| AC-CRON-04 | T06 | Orphaned storage files cleaned |
| AC-CRON-05 | T01 | Redis single-flight lock prevents concurrent runs |
| AC-CRON-06 | T07 | Expired render cache entries deleted |
| AC-CRON-07 | T08 | Old verification logs archived |
| AC-CRON-08 | T09 | Stuck batch generations marked as failed |
| AC-CRON-09–12 | T10 | 5 route handlers return correct status codes |
| AC-CRON-13 | T05–T09 | Failure isolation: per-item errors don't stop job |
| AC-CRON-14 | T02 | All 5 schedules configurable via env vars |
| AC-CRON-15 | T05–T09 | Jobs are idempotent (re-runs skip already-processed items) |
| AC-CRON-16 | T01 | Audit entries created for status changes |