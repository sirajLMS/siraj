# Design: Code Duplication Elimination — Phase 4

**Feature:** Phase 4 — Backend / Shared / App / Scripts Focus
**Version:** 1.0
**Date:** 2026-08-11

---

## 1. Design Goals

1. Eliminate ≥31 of 36 in-scope pairs (~86%) in `app/`, `shared/`, `backend/`, `scripts/`, `codegen.ts`
2. Zero regressions (no behavioral change, no tsgo/oxlint/biome/lint errors)
3. Reuse established patterns: `__shared__/` subdirs, `makeBillingRepo` factory, Pothos `_*Fields(t,…)` field helper idioms, `makeXQueryField` factories
4. Establish missing patterns: `ParentServiceBase`, `prepareMeetingConfigUpsert` generic, `createAuthSession`, `resolveTeacherId`, `buildParentInsertPayload`, `buildTeacherInsertPayload`, `makeBillingUpsertMany`, `resolveStudentIdFromArgsOrUser`, shared scripts helpers
5. **No re-exports** — duplicates deleted; importers repointed to canonical sources
6. **No server tests** — `sub-loop.ts --lifecycle codescene` is sole verification

## 2. Critical Policy

**NO RE-EXPORTS** (per Phase 1-3). Canonical files only.
**Direct module paths** (not barrel `index.ts`) for intra-`__shared__/` imports — prevents circular-dependency TDZ errors learned in Phases 1-2.
**Cross-layer enums live in `shared/constants/`** — backend imports `@/shared/constants/*` (allowed direction); the `backend/enum/shared/` copies are stale duplicates and must be deleted.
**jscpd-ignore patterns require explicit justification** in `.jscpd.json` (and the deferred-items ledger).

## 3. Key Design Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Delete `backend/enum/shared/currency.enum.ts` | Probe confirms 0 importers — already orphaned |
| 2 | Delete `backend/enum/classes/class-instance-detail.enum.ts` | Probe confirms no direct importers (likely dead — verify barrel first) |
| 3 | Codemod-repoint `backend/enum/shared/timezone` → `@/shared/constants/iana-timezone` (57 importers) | Largest clone (446 lines); canonical is in shared; backend → shared is the allowed direction |
| 4 | Extract `ParentServiceBase` in `backend/services/parent/__shared__/parentServiceBase.ts` | Pair 24 (parent-portal ↔ parent-social) — also finishes the unfinished `ComplaintSuggestionBaseService` style work |
| 5 | Extract `resolveTeacherId` in `backend/services/schedule/__shared__/resolveTeacherId.ts` | Pair 25 — shared admin-vs-teacher resolver |
| 6 | Extract `prepareMeetingConfigUpsert(inputs, { topicDefault, buildPayload })` in `backend/services/meeting/__shared__/prepareMeetingConfigUpsert.ts` | Pair 23 — generic over payload-builder; captures topic-default + secret nuance |
| 7 | Extract `createAuthSession(user, { skipComments })` in `backend/lib/auth/createAuthSession.ts` | Pair 9 — token generation + session persist |
| 8 | Extract `buildParentInsertPayload`, `buildTeacherInsertPayload` in respective repos | Pairs 4, 6 — repo-owned insert payload builders; service passes the input shape |
| 9 | Soft-fail wrapper preserved at billing call site for `listUserIdsWithPermission` | Pair 5 — repo throws; service swallows + returns []. Behavior preserved |
| 10 | Extend `billingRepoFactory.ts` with `makeBillingUpsertMany` | Pair 1 — `upsertMany` body not covered by current `makeBillingRepo` |
| 11 | Extract `coreScheduleColumns(students, teachers, …)` Drizzle helper for scheduling.ts | Pair 8 — intra-file schedule table shape duplication |
| 12 | Pothos field factory pattern: `*Fields(t, opts)` helper functions | Pairs 11-18 — idiomatic Pothos field-builder extracts |
| 13 | Pothos input helper: `*Fields(t, required)` for create-vs-update input duplication | Pairs 13, 17, 18 |
| 14 | Pothos query factories: `make*QueryField(name, typeRef, serviceMethod)` | Pairs 10, 19, 20, 21 |
| 15 | Cross-file resolver prelude: `resolveStudentIdFromArgsOrUser(args, ctx, tErrors)` in `backend/graphql/__shared__/studentQueryHelpers.ts` | Pair 22 |
| 16 | Scripts shared modules: `scripts/health/__shared__/{log.ts,bin-resolver.ts,sub-loop-types.ts}`, `scripts/unused/__shared__/types.ts` | Pairs 33-36 |
| 17 | Codegen: hoist `sharedGqlConfig` const in `codegen.ts` | Pair 32 |
| 18 | App route shims: small factories OR `.jscpd.json` ignore with justification | Pairs 29-31 — low-ROI; defer to per-task decision |

### 3.1 Decisions on intentionally-structural duplication

| Pair | Disposition | Reason |
|------|-------------|--------|
| 3   | jscpd-ignore (Pothos `upsertManyWith` callback tuple shape) | Generic call-site — inherent to TS generics |
| 7   | jscpd-ignore (Drizzle `pgTable` index array callback) | Table metadata; abstraction hurts readability |
| 29  | Per-task: try `buildMeetingProviderPageMetadata(mode)` helper; fallback jscpd-ignore | Next.js requires per-route metadata fn |
| 30  | Per-task: try `makeParentProfileRedirectPage("view"|"edit")`; fallback jscpd-ignore | Tiny redirect shim |
| 31  | Per-task: try `makeUserProfilePage(mode)`; fallback jscpd-ignore | Next.js profile mirror (view vs edit) |

## 4. Phase Architecture

```
Phase 0: Baseline
  └─ tsgo + biome + lint + check:duplicates + deferred-items.md + outcome/0-baseline-outcome.md

Phase 1: Cross-Layer Enum Cleanup (zero-risk deletes first) [AC-1]
  └─ 1.1 Delete backend/enum/shared/currency.enum.ts + barrel entry
  └─ 1.2 Delete backend/enum/classes/class-instance-detail.enum.ts + barrel entry
  └─ 1.3 Codemod repoint 57 backend/enum/shared/timezone imports → @/shared/constants/iana-timezone; delete backend copy

Phase 2: Service-layer Extraction [AC-2]
  └─ 2.1 ParentServiceBase (parent-portal ↔ parent-social)
  └─ 2.2 resolveTeacherId (schedule.service ↔ weekly-schedule.service)
  └─ 2.3 prepareMeetingConfigUpsert (meeting-config.service intra-file)
  └─ 2.4 createAuthSession (auth.mutation ↔ demo-auth.service)
  └─ 2.5 buildInsertPayload helpers (parent, teacher) + soft-fail permission resolve

Phase 3: GraphQL (Pothos + Query) Helpers [AC-3]
  └─ 3.1 Pothos field helpers (billing-payments, credit, schedule ✓ dashboard, schedule ✓ student-status, class-subject input, teacher-notes input, whatsapp-account input, recurring-schedule)
  └─ 3.2 Pothos input helpers (class-subject, teacher-notes, whatsapp-account: create vs update)
  └─ 3.3 Query resolver factories (payment-method, monthly-report, schedule/weekly)
  └─ 3.4 Cross-file resolver prelude resolveStudentIdFromArgsOrUser (student-history ↔ student-profile)
  └─ 3.5 Mutation resolver factory (payment-method.mutation intra-file)

Phase 4: Repository / Schema Helpers [AC-4]
  └─ 4.1 Extend billingRepoFactory with makeBillingUpsertMany (supported-mobile-wallet ↔ supported-payment-link)
  └─ 4.2 coreScheduleColumns helper (scheduling.ts intra-file)

Phase 5: Scripts & Codegen [AC-5, AC-6]
  └─ 5.1 scripts/health/__shared__/log.ts (COLORS + logInfo/Success/Warning/Error) (codescene ↔ sonar config)
  └─ 5.2 scripts/health/__shared__/bin-resolver.ts (resolveCodesceneBin ↔ resolveDockerBin)
  └─ 5.3 scripts/health/__shared__/sub-loop-types.ts (CheckResult + runCommand + exitCodePassed + Lifecycle) (sub-loop ↔ sub-loop-uncommitted)
  └─ 5.4 scripts/unused/__shared__/types.ts (Summary + TypeFile + LayerFile) (knip-* pair)
  └─ 5.5 codegen.ts sharedGqlConfig const (codegen.ts intra-file)

Phase 6: App Router [AC-7]
  └─ 6.1 meeting-providers create↔edit metadata helper OR ignore
  └─ 6.2 parents/[id]/profile↔edit redirect shim OR ignore
  └─ 6.3 users/[id]/profile↔edit profile page helper OR ignore

Phase 7: Plan Review Gate → Mid-Point Review Gate → Final Verification
  └─ 7.1 Plan review (run plan-review skill on this folder)
  └─ 7.2 Mid-point review after Phases 1-4 (backend-only) complete
  └─ 7.3 Post-implementation review after all phases complete
  └─ 7.4 Final jscpd + quality gate

Phase 8: Deferred Items Resolution & Knowledge Propagation
  └─ 8.1 Resolve any deferred-items ledger entries
  └─ 8.2 Knowledge propagation (docs/, AGENTS.md, instructions, skills)
```

## 5. Parallelism Strategy

**Phase 1 (enum deletes)**: sequential — task 1.3 (timezone codemod) touches 57 files; must follow 1.1/1.2 to avoid barrel churn conflicts.

**Phases 2-6**: parallel subagent dispatch — one subagent per file cluster (sibling or one-or-two small files), pool size 16. Each cluster is independent within its phase.

| Phase | Subagent clusters | Pool size |
|-------|-------------------|-----------|
| 2     | 5 clusters (each pair)        | 5 |
| 3     | 5 clusters (by file group)    | 5 |
| 4     | 2 clusters                    | 2 |
| 5     | 5 clusters (1 per shared helper) | 5 |
| 6     | 3 clusters                    | 3 |

Subagent prompt template standardised — see `.agents/skills/quality-gate/SKILL.md` subagent template.
**Subagents MUST NOT run any test command** (per §3 No-Server-Tests Policy).

## 6. UX/Navigation Specification

**No UX/Navigation changes.** Phase 4 is a pure refactor — no routes added/removed, no UI changes, no role/permission changes, no navigation changes.

## 7. Outcome & Knowledge Transfer Protocol

Per spec-driven-development skill:

- **BEFORE each task**: read ALL existing files in `.ai/plans/duplications-phase4/outcome/`.
- **AFTER each task**: create `.ai/plans/duplications-phase4/outcome/<task-id>-outcome.md` with research findings, implementation details, behavioral-change notes, and carry-over points.
- **Progress tracking**: update `[ ]` → `[x]` in `tasks.md`.

Task 8.2 (Knowledge Propagation) updates:
- `docs/i18n/cross-layer-enum-migration.md` (new) — capturing the currency/timezone/class-instance-detail delete workflow + codemod pattern
- `docs/backend/service-base-pattern.md` (new) — ParentServiceBase + extend pattern (extends `docs/backend/shared-types-pattern.md`)
- `docs/graphql/pothos-field-factories.md` (new) — `_*Fields(t,…)` + `make*QueryField` idioms
- `docs/backend/billing-repo-factory.md` (update) — adds `makeBillingUpsertMany` section
- `AGENTS.md` (root Important References section) — adds new docs
- `backend/services/AGENTS.md`, `backend/graphql/AGENTS.md`, `backend/types/AGENTS.md`, `backend/db/repo/AGENTS.md` — add references to new docs
- `.agents/instructions/backend.instructions.md` — add cross-layer enum + Pothos field factory rules
- `.agents/skills/spec-driven-development/SKILL.md` — no change (skills already cover the lifecycle)

## 8. Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Timezone codemod breaks a backend file (type mismatch) | Medium | Each repointed file gets `sub-loop.ts --lifecycle tsgo` check; fallback to manual file-by-file if codemod misses edge cases |
| `coreScheduleColumns` helper introduces circular import in `scheduling.ts` | Low | Helper returns plain Drizzle column object; no `schema/index.ts` import |
| Pothos field-builder breaks builder fluent chain | Low | Use `t.field({ ..., resolve: … })` form returning `t.<Type>` — established Phase 3 pattern |
| `makeBillingUpsertMany` parameterisation loses type-safety | Low | Generic over `TSelect, TInsert` with `toSelectType(row): TSelect` and `valuesAdapter(input): TInsert` — preserves type flow |
| jscpd-ignore additions mask real drift | Medium | Each jscpd-ignore entry references a deferred-items row with justification |

## 9. Edge Cases & Constraints

- **Barrel file in `backend/enum/index.ts`**: must remove deleted enum files from barrel re-exports — failure to do so leaves the barrel export broken.
- **`backend/lib/timezone.ts`**: probe flagged it imports `backend/enum/shared/timezone` — confirm it's repointed in task 1.3 (very high blast radius if missed).
- **57 timezone importers**: codemod via `grep -lr "@/backend/enum/shared/timezone" backend/` then `sed -i` rewrite; verify with follow-up `grep` returning 0 results.
- **ECMAScript import path strings**: backend currently imports from `@/backend/enum/shared/timezone`; new path is `@/shared/constants/iana-timezone` — alias is already configured in `tsconfig.json`.
- **ESLint `no-restricted-imports` for shared layer**: applies only to `shared/` importing from backend/frontend — backend importing from `shared/` is the allowed direction; no rule violations expected.

## 10. Related Documents

- `requirements.md` (this phase)
- `tasks.md`
- `deferred-items.md`
- `../duplications-phase3/outcome/11.1-final-jscpd-outcome.md` (claimed 580→95; current actual 528 — informs this phase)
- `docs/drizzle/prepared-statements.md`, `docs/backend/billing-repo-factory.md`, `docs/backend/meeting-adapter-base.md` (existing patterns referenced)
