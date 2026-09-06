# Phase 14 — Final Quality Gate (Task 14)

- **Date**: 2026-09-06
- **Plan**: `.ai/plans/whatsapp2/`
- **User constraint honored**: NO `test/ui/**`, NO `test:ui:*`, NO Playwright/E2E executed. UI component tests are implemented (Phases 11/12) but intentionally not executed.

## 14.1 — Deferred-items blocking check

`grep -c "❌\|⚠️" .ai/plans/whatsapp2/deferred-items.md` → **2 hits, both prose mentions** (purpose section line 9 and enforcement section line 32). Zero ❌/⚠️ status rows in the ledger table. Ledger statuses: D1–D9, D11–D14 📋; D10 🔄 (doc-only, owned by Task 15.2). **PASS — 0 blocking.**

D12/D13/D14 confirmed present and honestly worded:
- **D12** (payloadHash partial-unique): correctly explains app-side 5-min replay guard + idempotent downstream upserts, and why a sliding-window DB unique is not expressible — deferred with rationale, not hidden.
- **D13** (sweeper NotFoundError locale): correctly states callers now pass localized labels and only the request-locale-less cron sweeper falls back to English for a log-only error.
- **D14** (template-map reachability): correctly describes the `CLASS_LIFECYCLE_EVENTS` + `EVENT_CHANNEL_ALLOWLIST` gap as pre-existing, and notes routing itself is proven by the Phase 13 journey via `dispatchWithPreferences`.

## 14.2 — Tool health vs baseline (`outcome/0-baseline-outcome.md`)

| Check | Baseline | Final | Delta | whatsapp2 errors |
|---|---|---|---|---|
| tsgo | 9 errors (all foreign carryover/accounting in-flight) | **2 errors** (both foreign: `test/ui/components/fixtures/classDetailsFixtures.tsx` TS2740, `test/ui/components/classes/classDetailsAdminView.test.tsx` TS2322 — in-flight classDetails work; foreign work resolved 7 of its own 9) | −7 | **0** |
| biome:check | 7 errors, 1 warning (foreign scratch `.check-thread*.html` + untracked leave-request) | **1 error, 2 warnings** (error: untracked foreign `backend/services/leave-request/test/leave-request.service.test.ts` noThenProperty — same as baseline; warnings: committed foreign `backend/lib/test/security-regression.test.ts` noTemplateCurlyInString + symlink) | −6 errors | **0** |
| lint (full repo) | exit 0, 0 issues | **exit 0 after 1 whatsapp2 fix** — initial run flagged `frontend/common/graphql/test/whatsapp/whatsapp-inbox.test.ts:151` `sonarjs/assertions-in-tests` (helper-only assertion via `expectMutationError`); fixed by adding explicit `expect(superAdminToken).toBeTruthy()` per repo recipe (`student-lifecycle.test.ts:176`). Full-repo re-run confirmed exit 0. | 1 → 0 | **0 remaining** |

Foreign in-flight failures (carryover/classDetails/accounting/leave-request/security-regression) were NOT touched — per shared-tree policy they belong to other agents' work.

## 14.3 — whatsapp2 non-UI suites (all via `bun run test/scripts/run-test.ts`)

| Suite | Result |
|---|---|
| `backend/db/test/repo/whatsapp/` (6 files) | 60 pass / 0 fail |
| `backend/db/test/migrations/whatsapp-v2-schema.test.ts` | 9 pass / 0 fail |
| `backend/services/whatsapp/test/whatsapp-coexistence-sync.test.ts` | 26 pass / 0 fail |
| `backend/services/whatsapp/test/whatsapp-embedded-signup.test.ts` | 15 pass / 0 fail |
| `backend/services/whatsapp/test/whatsapp-optin.test.ts` | 16 pass / 0 fail |
| `backend/services/whatsapp/test/whatsapp-webhook.handler.test.ts` | 45 pass / 0 fail |
| `backend/services/whatsapp/test/whatsapp-webhook-ingest.test.ts` | 17 pass / 0 fail |
| `app/api/webhooks/whatsapp/route.test.ts` | 24 pass / 0 fail |
| `test/workflows/whatsapp/coexistence-routing.test.ts` | 7 pass / 0 fail |
| `frontend/common/graphql/test/whatsapp/whatsapp-inbox.test.ts` (locked server runner, port 3099) | 9 pass / 0 fail (37 expect() calls) |

**Subtotal: 228 pass / 0 fail across 14 suites.** `test/ui/**` skipped outright per user constraint.

## 14.4 — v1 regression smoke (code-level, no browser)

| Suite | Result |
|---|---|
| `backend/services/communication/test/whatsapp-channel.test.ts` | 32 pass / 0 fail |
| `backend/services/communication/test/whatsapp-purpose-routing.test.ts` | 9 pass / 0 fail |
| `backend/services/communication/test/pair-rate-limit.test.ts` | 14 pass / 0 fail |
| `backend/services/communication/test/communication.service.test.ts` | 9 pass / 0 fail |
| `backend/services/notification/notification-dispatch.helpers.test.ts` | 14 pass / 0 fail |
| whatsapp-optin + whatsapp-webhook.handler (status-delivery assertions incl.) | covered in 14.3, green |

**Subtotal: 78 pass / 0 fail.** The GENERAL-purpose fallback + legacy adapter path keep the single-account tenant flow intact (proven by channel/service/dispatch suites). `stripInboundMessages`: repo-wide grep matches **only** docs/plan markdown — zero code callers remain in `app/api/webhooks/whatsapp/route.ts` or anywhere else.

## 14.5 — sweep + flip

- `// __NEXT__` survivors: none in code; the single grep hit is a sentence in `outcome/13-journey-outcome.md` asserting none remain.
- Remaining `[ ]` in `trackable-tasks.md`: only Phase 14 (this task) and Phase 15 (knowledge propagation — explicitly out of this task's scope). 14.1–14.5 + parent 14 flipped to `[x]`.

## Totals

- **306 tests executed, 306 pass, 0 fail** (14.3: 228 + 14.4: 78).
- whatsapp2 quality-regression count: **1** (sonarjs assertion in the GraphQL test), fixed; tsgo/biome/lint all at **0 whatsapp2 issues** at close.
- Plan remains open only for Phase 15 (canonical docs / knowledge propagation).
