# Outcome 13: Task 31 — Knowledge Propagation

**Date**: 2025-07-17
**Status**: COMPLETE

## What Was Done

### 31a. `docs/billing/quota-system.md` — Architecture Reference
Created comprehensive reference (~17,800 chars) covering:
- Architecture overview (append-only ledger, denormalized cached columns)
- Data model (quotas, quota_ledger, class_instances integration)
- Business logic (FIFO selection, idempotency, rollover, on-demand flow)
- Integration points (AvailabilityService, RecurringClassService, etc.)
- Notification event types and categories
- Frontend views (Quota Insights, Student Quota Tab)
- Cron jobs (expiry-sweeper, ondemand-*, teacher-digest)
- Key gotchas (FK RESTRICT on ledger, CHECK constraints, CASCADE alternatives)

### 31b. AGENTS.md Layer Files Updated
- `backend/AGENTS.md`: Added "Quota System (Billing Domain)" section with ledger rules, permissions (QUOTAS_MANAGE/VIEW), and integration points
- `backend/db/repo/AGENTS.md`: Added "Append-Only Ledger Pattern (Quota)" with idempotency key derivations
- `backend/services/AGENTS.md`: Added "Quota System Integration" section
- `frontend/views/AGENTS.md`: Added "Quota Views" section before Storybook

### 31c. Root `AGENTS.md` Updated
Added `docs/billing/quota-system.md` to Important References section with note about quota audit trail in `quota_ledger`.

### 31d. `.agents/skills/` and `.agents/instructions/`
Verified: No quota-specific skills or instructions exist. The layer-level AGENTS.md files already cover quota patterns. `frontend-patterns/SKILL.md` does not exist (was mentioned in plan but never created). No action needed.

### 31e (ad-hoc fix): `QuotaInsightsContainer.tsx`
Fixed deprecated `Cell` import from recharts (suppressed via biome-ignore pragma since recharts has no replacement API) and fixed a relative import (`./useQuotaViewModel` → `@/frontend/...`).

## Quality Gate Verification
- `bun tsgo`: ✅ Passed
- `bun biome:check`: ✅ Passed (after Cell deprecation suppression + import fix)
- `bun run lint`: ✅ Passed (via lint queue server)

## Files Created
- `docs/billing/quota-system.md`

## Files Modified
- `AGENTS.md` (root) — Important References section
- `backend/AGENTS.md` — Quota System subsection
- `backend/db/repo/AGENTS.md` — Append-Only Ledger Pattern
- `backend/services/AGENTS.md` — Quota System Integration
- `frontend/views/AGENTS.md` — Quota Views section
- `frontend/common/views/dashboard/billing/quota/QuotaInsightsContainer.tsx` — biome-ignore + import fix