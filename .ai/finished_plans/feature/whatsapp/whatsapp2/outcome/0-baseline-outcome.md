# Phase 0 — Pre-Implementation Baseline (Task 0)

- **Date**: 2026-09-05
- **Plan**: `.ai/plans/whatsapp2/`
- **Tasks covered**: 0.1 (baselines), 0.2 (deferred-items ledger confirmation), 0.3 (research re-read)

## Task 0.1 — Baseline Tool Health

| Check | Command | Result | Notes |
|---|---|---|---|
| Type check | `bun tsgo 2>&1 \| grep -c "error TS"` | **9 errors** | All 9 are in OTHER agents' in-flight work (see below); none in whatsapp2 scope |
| Biome | `bun run biome:check` | **7 errors, 1 warning** (6034 files checked, exit 1) | Errors: 6× `lint/a11y/useButtonType` in untracked scratch files `.check-thread*.html`, 1× `lint/suspicious/noThenProperty` in untracked `backend/services/leave-request/test/leave-request.service.test.ts`. Warning: broken symbolic link in tree. Biome auto-fixed 2 files (incl. `package.json` trailing-newline) — harmless |
| ESLint | `bun run scripts/lint-service.ts --json --id baseline` | **success: true, exitCode 0, 0 issues** | Full-repo, ~124 s, queue depth 0 |

### tsgo error breakdown (all pre-existing, all foreign in-flight work)

- `backend/services/notification/test/class-reminder.service.test.ts` — 1 (TS2741, `carryoverBalanceId` missing)
- `backend/services/teacher/payroll-calculation.service.test.ts` — 1 (TS2322)
- `backend/services/teacher/payroll-override.service.test.ts` — 1 (TS2322)
- `backend/services/teacher/teacher-due-payroll-integration.test.ts` — 2 (TS2741, TS2322)
- `backend/services/teacher/teacher-due.service.test.ts` — 2 (TS2741, TS2322)
- `frontend/common/views/dashboard/billing/accounting/reports/formatters/sessionAuditCellFormatters.test.ts` — 2 (TS2741, `viewFullNote` missing)

Root causes: the carryover-balance feature (accounts for 7 errors in teacher/notification test fixtures; its schema/type edits are in-flight) and the accounting session-audit feature (2 errors). Both are other agents' active work in this shared tree — DO NOT fix them from this plan; the Task 14.2 delta comparison must treat 9 as the tsgo baseline.

## Git working-tree baseline (foreign in-flight work to distinguish from plan files)

Captures `git status --porcelain` at baseline time (75 entries: 34 modified, 41 untracked). **Nothing whatsapp2-related is in this list** except the plan directory itself (`.ai/plans/whatsapp2/` already committed? plan files were authored earlier) — every file below belongs to the concurrent accounting/carryover/permissions/class-audit work of other agents and must NOT be modified by whatsapp2 subagents.

### Modified (` M`)

```
backend/db/drizzleRelations.ts
backend/db/repo/scheduling/class-instances.ts
backend/db/repo/teachers/index.ts
backend/db/repo/teachers/teacher.repository.ts
backend/db/schema/classes/scheduling.ts
backend/db/schema/teachers/index.ts
backend/db/test/repo/teachers/teacher.repository.test.ts
backend/drizzle/.custom-migrations.json
backend/drizzle/20260904064952_custom_39-accounting-reports-permissions/migration.sql
backend/enum/permissions/permission.enum.test.ts
backend/enum/permissions/permission.enum.ts
backend/services/index.ts
backend/types/billing/index.ts
frontend/common/graphql/generated/gql/graphql.ts
frontend/common/graphql/sharedDocuments/billing/index.ts
frontend/common/stores/appearancePreviewStore.ts
frontend/common/types/page-permissions.types.ts
frontend/common/views/dashboard/classes/audit/ClassAuditContainer.tsx
frontend/common/views/dashboard/config/navigationConfig.ts
package.json                          (biome newline fix from this baseline run)
public/static/locale-snapshots/ar/dashboard.core.nav.json
public/static/locale-snapshots/en/dashboard.core.nav.json
shared/locale/ar/dashboard/core/nav.ts
shared/locale/ar/messages.ts
shared/locale/en/dashboard/core/nav.ts
shared/locale/en/messages.ts
shared/locale/namespaces/dashboard/reports/index.ts
shared/locale/namespaces/translation.ts
shared/locale/types/dashboard/core/nav.ts
shared/locale/types/dashboard/reports/index.ts
shared/locale/types/message.ts
test/ui/components/translation-preload.ts
test/workflows/accounting/DIAGRAMS.md
```

### Untracked (`??`)

```
.check-thread.html
.check-thread1b.html
.check-thread2.html
app/(dashboard)/accounting/reports/
app/api/accounting/
backend/db/migration/40-accounting-carryover-permissions.sql
backend/db/repo/teachers/carryover-balance.repository.ts
backend/db/schema/teachers/carryover-balances.ts
backend/db/test/migrations/carryover-tables.test.ts
backend/db/test/repo/scheduling/class-instances-carryover.repository.test.ts
backend/drizzle/20260904223645_custom_40-accounting-carryover-permissions/
backend/drizzle/20260904235039_mixed_midnight/
backend/services/leave-request/test/
backend/services/meeting/effective-meeting-benchmark.test.ts
backend/services/schedule/schedule-query.service.test.ts
backend/services/student/student-field-manifest.test.ts
backend/services/teachers/
backend/types/billing/carryover-balance.types.ts
frontend/common/graphql/sharedDocuments/billing/session-audit.documents.ts
frontend/common/stores/sessionAuditFilterStore.test.ts
frontend/common/stores/sessionAuditFilterStore.ts
frontend/common/views/dashboard/billing/accounting/
frontend/common/views/dashboard/classes/audit/ClassAuditContainer.test.tsx
frontend/desktop/views/dashboard/billing/accounting/
frontend/mobile/views/dashboard/billing/accounting/
public/static/locale-snapshots/ar/dashboard.reports.sessionAudit.json
public/static/locale-snapshots/en/dashboard.reports.sessionAudit.json
shared/locale/ar/dashboard/reports/sessionAudit.ts
shared/locale/en/dashboard/reports/sessionAudit.ts
shared/locale/namespaces/dashboard/reports/sessionAudit.namespace.ts
shared/locale/types/dashboard/reports/sessionAudit.ts
test/ui/components/accounting/PayrollNotePopover.test.tsx
test/ui/components/accounting/SessionAuditAggregateCard.test.tsx
test/ui/components/accounting/SessionAuditDataGrid.test.tsx
test/ui/components/accounting/SessionAuditFilterBar.test.tsx
test/ui/components/accounting/SessionAuditReportsContainer.test.tsx
test/ui/components/accounting/SessionAuditStatusChip.test.tsx
test/ui/components/sw-script.test.ts
test/ui/e2e/accounting/
test/workflows/accounting/session-audit-access-isolation.test.ts
test/workflows/accounting/session-audit-session-lifecycle.test.ts
whatsapp-thread-desktop.png
```

**Collision warnings for whatsapp2 implementers** — these shared files are actively modified by foreign work AND are touched by whatsapp2 tasks. Subagents must edit surgically (match exact context, never rewrite the file) and re-read before editing:
- `backend/enum/permissions/permission.enum.ts` + its test (task 1.6 adds `WHATSAPP_INBOX_*` — foreign work is also adding accounting permissions above the existing whatsapp entries)
- `backend/types/billing/index.ts`, `backend/services/index.ts`, `shared/locale/types/message.ts`, `shared/locale/namespaces/translation.ts`, `shared/locale/{en,ar}/messages.ts`, `frontend/common/graphql/generated/gql/graphql.ts` (regenerated — expect churn; always regenerate in Phase 9, never hand-edit over foreign diffs)

## Task 0.2 — Deferred-items ledger confirmation

`deferred-items.md` exists and is complete. All required pre-existing v1 gaps are present with 📋 statuses:

| Ledger ID | Item | Status |
|---|---|---|
| D1 | `whatsappTemplates` query resolver | 📋 Pre-existing ✓ |
| D2 | Opt-in audit/history resolvers (placeholder arrays in `WhatsappTabPanels.tsx:163-172`) | 📋 Pre-existing ✓ |
| D3 | Groups API | 📋 Backlog ✓ |
| D4 | Marketing Messages API | 📋 Backlog ✓ |
| D6 | Free-text (non-template) outbound v2 / BL4 | 📋 Backlog ✓ |
| D7 | Inbox reply composer (`WHATSAPP_INBOX_MANAGE` reserved) | 📋 Backlog ✓ |

Additional recorded items: D5 (calling/SIP 📋), D8 (polling vs realtime 📋), D9 (process-local concurrency guard 📋), D10 (stale doc table — 🔄 In Progress, targeted by Task 15.2), D11 (account-model evolution Phase 3 WAAC-ID cutover, H1 2028 📋).

**apiVersion item**: the apiVersion inconsistency (hardcoded `v20.0`) is **NOT in the deferred ledger** — it is marked for **in-plan fixing** (Task 4.2: remove hardcoded `v20.0`, introduce env-config key `WHATSAPP_GRAPH_API_VERSION` defaulting to **v25.0**, DB-overridable via `env::` settings; D6 in `implementation.md`). Deferral is only permitted if descoped mid-plan.

Blocking-status check: 0 ❌/⚠️ status entries in the ledger table (the two grep hits for those glyphs are prose mentions in the purpose/enforcement sections). Final gate 14.1 requirement (0 blocking) is satisfied at baseline.

## Task 0.3 — Research re-read (Meta fact completeness)

Re-read: `docs-research-coexistence.md`, `docs-research-multi-number.md`, `docs-verification-coexistence.md` (82 claims: 78 CONFIRMED, 2 CONTRADICTED→fixed, 2 NOT-FOUND), `docs-verification-multi-number.md` (34 CONFIRMED, 0 contradicted, 2 confirm-with-correction), `docs-verification-webhooks.md` (15 CONFIRMED, 1 CONTRADICTED→fixed, 2 NOT-FOUND, 2 caveat), `docs-verification-fixes.md` (all corrections applied to specs/implementation/trackable-tasks/deferred-items), `docs-reverification-2026-09-14.md` (full re-verification pass; 2 amendments applied).

**No critical Meta fact is missing.** The two historical contradictions (ES `extras.version: 'v4'`, media "14-day fetch window") were corrected and folded back into the plan docs by `docs-verification-fixes.md`. Residual unknowns are explicitly labeled assumptions and are safe:

- No documented error codes for repeat/expired `smb_app_data` calls → plan keys its own state machine on unique `(accountId, syncType)` + 24h deadline (justified design, not a gap).
- No documented webhook ack-time limit for messaging (only a ~20s calling-FAQ figure) → plan's <200ms target is internal design, fine.
- 1MB webhook body cap is a self-labeled assumption → mid-plan rehearsal check is already mandated (verify against a real history sync; raise if needed).
- `smb_app_state_sync` `action` enum literal values (`add`/`remove`) → spot-check against live reference at implementation time (W14), non-blocking.

No appends to research docs were needed.

## Carry-forward knowledge for implementers (critical Meta facts, one-line index)

1. **ES v4**: v4 is activated by the Facebook Login for Business **Configuration** (`config_id` = `WHATSAPP_ES_CONFIG_ID`); `extras: { setup: {}, featureType: 'whatsapp_business_app_onboarding' }` with **NO `version: 'v4'`** (invalid value). `FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING` payload may contain **only `waba_id`** → resolve `phone_number_id` via `GET /<WABA_ID>?fields=phone_numbers`.
2. **`smb_app_data` one-shot sync**: must POST within **24h of onboarding**; each `sync_type` (`smb_app_state_sync`, `history`) exactly once; `request_id` = acceptance only, never echoed in webhooks; history decline = error **2593109** nested at `value.history[].errors[]`; contacts sync is independent of history decline.
3. **History webhooks**: `phase` (0/1/2 = day 0–1 / 1–90 / 90–180), `chunk_order` (ordering; no delivery-order guarantee), `progress` 100 = complete (phases with no history send NO webhooks); dedupe messages by `wamid`, chunks by `(phase, chunk_order)`; envelope field name is `history`, not `messages`.
4. **Media**: `media_placeholder` rows; follow-up media webhook arrives only for media ≤14 days old at onboarding; once an asset ID arrives, **fetch within 7 days** (webhook media IDs expire in 7 days; API-uploaded IDs expire in 30 days; URLs in 5 min).
5. **Coexistence numbers**: fixed **20 msg/s** throughput (error **130429** on exceed; not the 80/1000 131056/131057 ladder); registration/deregistration limit 10 per number per 72h (error **133016**); Groups API never available; disappearing messages/view-once/live location/broadcast lists get disabled in the Business app.
6. **Portfolio model**: messaging limits are portfolio-level (250→2K→10K→100K→Unlimited), new numbers inherit immediately; number cap 2→20; quality is per-number but portfolio scaling requires high quality across ALL numbers; templates are WABA-scoped (shared across numbers); display names are per-number with 14-day re-register deadline after approval.
7. **`business_capability_update` parser MUST**: accept `max_daily_conversations_per_business` as BOTH `TIER_*` strings and integers; parse legacy `max_daily_conversation_per_phone` (only field on webhooks <v24.0); tolerate absent `max_phone_numbers_per_business`/`_per_waba` (conditional inclusion ≠ no cap).
8. **Webhook delivery**: retries up to 7 days with duplicate bodies (even after a 200); no ordering; no at-least-once SLA; "capture contents first, process asynchronously" is Meta's own mandate → persist-before-200 + wamid/chunk idempotent upserts + sweeper are all docs-backed requirements, not choices. Handle **PARTNER_REMOVED** with `disconnection_info.reason` (in-plan, Task 7.5).
9. **Graph API version**: default **v25.0** via `WHATSAPP_GRAPH_API_VERSION` env-config (DB-overridable); webhook field gating makes v24.0+ webhooks carry the new portfolio field, so parse both shapes regardless of configured version.
10. **CSW rules**: 24h window opens only from a user message to a business already on Cloud API; Business-app sends do NOT open/extend Cloud API windows — the inbox must track CSW openness only from inbound `messages` webhook events (this preserves the data the deferred D7 composer will need).
