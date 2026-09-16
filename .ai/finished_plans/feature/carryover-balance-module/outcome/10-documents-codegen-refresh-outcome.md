# Task 10 Outcome — Documents + Codegen + Snapshots Refresh (CF-1 Follow-up)

- **Date**: 2026-09-05
- **Status**: ✅ Complete

## Files

| File | Change |
|---|---|
| `frontend/common/graphql/sharedDocuments/teachers/carryover.documents.ts` | ➕ `linkedSessionCount` added to the shared `CarryoverBalanceFields` fragment (all 9 operations picking up the fragment — list/detail queries + create/update/unpay mutations — now select it). ➕ New `carryoverBalanceLinkedSessionsQueryDocument` (`query CarryoverBalanceLinkedSessions($carryoverId: ID!)`) selecting `id, studentId, studentName, subjectName, scheduledStartAt, durationMinutes, originalAmount, originalCurrency, originalStatus, currentStatus` — field names verified verbatim against `backend/graphql/pothos/teachers/carryover.pothos.ts` (`CarryoverLinkedSessionPothosObject`). Typed as `TypedDocumentNode<CarryoverBalanceLinkedSessionsQuery, CarryoverBalanceLinkedSessionsQueryVariables>` per the sharedDocuments convention. |
| `frontend/common/graphql/generated/schema.graphql` | Regenerated via `bun run generate:gqlSchema` — now contains `linkedSessionCount: Int` on `CarryoverBalance` and root query `carryoverBalanceLinkedSessions(carryoverId: ID!): [CarryoverLinkedSession!]`. |
| `frontend/common/graphql/generated/gql/graphql.ts` | Regenerated via `bun codegen` — `CarryoverBalanceLinkedSessionsQuery` / `…Variables` types (lines ~4994–4997), `CarryoverBalanceLinkedSessionsDocument` const (line 5734), `linkedSessionCount` present in `CarryoverBalanceFieldsFragment` and every consuming operation type. |
| `public/static/locale-snapshots/{en,ar}/dashboard.accounting.carryover.json` | Verified up-to-date via `bun run locale:snapshots` (0 written = already refreshed on disk by the CF-2/3.2 agents). Contains all CF-2 keys: `drawer.sessionsHeading`, `drawer.noSessions`, `exportTruncated`, `exportFailed`, `filters.dateRange`, `validation.studentsCountInvalid` (grep count 7 per locale). |
| `public/static/locale-snapshots/{en,ar}/dashboard.core.nav.json` | Verified: gained the `Carryover` nav label (+1 line diff vs HEAD). |
| `.ai/plans/carryover-balance-module/outcome/10-documents-codegen-refresh-outcome.md` | This file. |

Sibling-plan snapshot diffs (`session-audit`, payroll, cron) in the working tree were left untouched.

## Codegen verification

- `bun run generate:gqlSchema` → exit 0; new field + query present in `schema.graphql` (lines 825, 3993).
- `bun codegen` → exit 0. Same as outcome 4.1: this repo configures no React-hooks codegen plugin — consumers pass `CarryoverBalanceLinkedSessionsDocument` (or the `carryoverBalanceLinkedSessionsQueryDocument` TypedDocumentNode) to `useQuery` from `@apollo/client/react` directly.

## Sub-loop

`bun run scripts/health/sub-loop.ts frontend/common/graphql/sharedDocuments/teachers/carryover.documents.ts --lifecycle codescene` → **exit 0, first pass** (tsgo ✓ oxlint ✓ biome ✓ lint:type-aware ✓ duplicates ✓ codescene ✓). Generated `generated/**` files and snapshot JSON are lint-excluded by design — no sub-loop run on them.

## Carry-forward

- Drawer/`LinkedSessionsSection` consumers: `carryoverBalanceLinkedSessionsQueryDocument` returns `CarryoverBalanceLinkedSessionsQuery["carryoverBalanceLinkedSessions"]` rows; `scheduledStartAt` is an ISO string (DateTime scalar) — format client-side (per CF-1 outcome note).
- `linkedSessionCount: number | null` is now on every `CarryoverBalance`-shaped operation result type; grid/dialog row consumers can read it directly.
- No git mutations; no test runs (UI tests out of scope for this wave).
