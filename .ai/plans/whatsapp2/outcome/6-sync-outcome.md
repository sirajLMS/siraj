# 6 — Coexistence Sync Orchestrator Outcome

- **Task**: Phase 6 (`6-sync`) of `.ai/plans/whatsapp2/`
- **Date**: 2026-09-05
- **Requirements**: REQ-5 (coexistence sync lifecycle)

## Deliverables

| Task | File | State |
|---|---|---|
| 6.1 | `backend/services/communication/channels/whatsapp/cloud-api/requests/request-smb-app-data.request.ts` | verified (pre-built) |
| 6.2 | `backend/services/whatsapp/whatsapp-coexistence-sync.service.ts` | verified + one fix |
| 6.3 | `app/api/cron/whatsapp-sync-sweep/route.ts` + cron registration | verified + registration added |
| 6.TE | `backend/services/whatsapp/test/whatsapp-coexistence-sync.test.ts` | new, 25 tests green |

## What was actually found vs rebuilt

Most of the phase was already on disk and correct; this pass verified and closed the two genuine gaps:

1. **Cron registration was missing.** The route existed with a doc comment claiming hourly scheduling, but `scripts/build/generate-vercel-config.ts` (`CRON_DEFINITIONS`) — the single registration point that generates `vercel.json` — did not include `/api/cron/whatsapp-sync-sweep`. Added it: env-overridable via `CRON_WHATSAPP_SYNC_SWEEP_SCHEDULE`, default `13 * * * *` (hourly, off-:00), `alwaysInclude: true` (expiry enforcement is correctness, not a Pro-tier luxury; the tick is cheap and empty when nothing is pending). Documented the new key in `.env.example` beside the other `CRON_*_SCHEDULE` keys.
2. **API version resolution bypassed the canonical helper.** `postSmbAppDataSync` called `resolveEnvConfig("WHATSAPP_API_VERSION")` directly, ignoring the canonical resolution chain (`WHATSAPP_GRAPH_API_VERSION` → legacy key → `v25.0` default). Switched to `resolveGraphApiVersion()` from `@/backend/lib/whatsapp-constants` so Phase 4's version-key migration applies to sync POSTs automatically.

## Verified invariants (service)

- **One-shot enforcement**: `whatsapp_sync_requests` unique `(accountId, syncType)`; `ensure()` inserts-or-returns; POST happens only when `requestId IS NULL`; `recordRequestId` is guarded by `WHERE requestId IS NULL` (returns `null` on guard loss → bucketed `alreadyRequested`, never `requested`). A retry after a crash mid-POST/record sequence never double-POSTs.
- **Deadline handling**: `syncDeadlineAt` is stamped on account creation-time base (onboarding + 24h) even when the Meta POST fails, so the sweeper can always expire. `sweepExpiredSyncs` flips PENDING rows to FAILED + account to `FAILED(syncDeadlineExpired)` past the deadline, and retries outstanding POSTs inside the window (retry-safe via the requestId guard).
- **Decline (2593109)**: `handleHistoryDeclined` fails the history row; a completed history row outranks a late decline webhook; the account only flips to `historyDeclined` once contacts reach a terminal state (or via `maybeCompleteAccountSync` when contacts complete later).
- **Progress**: `recordHistoryProgress` clamps to `[0,100]`, STREAMING on first chunk, COMPLETE at 100, idempotent on terminal rows; `getSyncStatus` returns `WhatsappAccountSyncOverview` (account + per-type rows).

## Tests (6.TE)

`backend/services/whatsapp/test/whatsapp-coexistence-sync.test.ts` — 25 tests, **all green** via `bun run test/scripts/run-test.ts`. All Meta fetch calls mocked (no network); full fake in-memory repo layer. Coverage map:

- Enqueue: happy path (2 POSTs, correct `sync_type` order + URL), one-shot re-enqueue (0 extra POSTs), `recordRequestId` guard-loss → `alreadyRequested`, transient Meta 500 → rows stay PENDING + deadline still stamped, closed window → no POST, terminal rows never re-POSTed, offboarded account skipped, placeholder token skipped, missing account throws `NotFoundError`.
- Sweep: expiry flips rows/account, in-window retry re-POSTs, terminal accounts untouched.
- Decline: all four branches (terminal contacts, streaming contacts, completed history, missing row).
- Progress: mid-stream, clamping, completion to COMPLETE, terminal-row idempotency, missing row no-op.
- Contacts completion after decline surfaces `historyDeclined`; `getSyncStatus` shape + null.

## Quality loop (6.QL)

`sub-loop.ts --lifecycle codescene` exit 0 for every touched file: the service, the request builder, the cron route, the test file, `scripts/build/generate-vercel-config.ts`.

## Security & tenancy (6.SEC)

- Cron route is `withCronAuth` (CRON_SECRET, GET-only); no user identity is read from untrusted input.
- The service never logs the access token; Meta error bodies propagate through `GraphApiError` (status + body), logged via `logger.logDomainError`.
- `accountId` is server-derived (onboarding flow / webhook `phone_number_id` match); no ID can be minted by a client.
- No new secret material; `CRON_WHATSAPP_SYNC_SWEEP_SCHEDULE` is a non-secret operational key.

## Semantic review (6.SR)

- No unvalidated input spreads, no read-then-write without a guard (the `requestId IS NULL` update *is* the atomic guard).
- No unbounded module state in the service; state lives in DB rows.
- Env completeness: `.env.example` updated; `environment.d.ts` needs no change (the other `CRON_*_SCHEDULE` keys are not declared there either).
- No replay/idempotency gap found worth deferring beyond what the plan already tracks.

## Instruction verification (6.IV)

Read and validated against: root `AGENTS.md`, `backend/AGENTS.md`, `backend/services/AGENTS.md` (no external API calls in tests — all fetch mocked; service-layer types from `@/backend/types`), `app/AGENTS.md` (route handler shape), `.agents/instructions/backend.instructions.md`, `.agents/instructions/tests.instructions.md` (no `runInRollback` misuse — service tests use fully mocked repos).

## Notes for follow-on phases

- Phase 7 (webhook handler) consumes: `recordHistoryProgress`, `handleHistoryDeclined`, `markContactsSyncComplete`; its own sweeper attaches to the same `CRON_DEFINITIONS` list.
- Phase 8 (ES completion) should call `enqueuePostOnboardingSync` — already wired via barrel `@/backend/services/whatsapp`.
