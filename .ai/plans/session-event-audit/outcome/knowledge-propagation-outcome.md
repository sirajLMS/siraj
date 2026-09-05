# WAVE-S-2 — Knowledge Propagation — Outcome

- **Date**: 2026-09-05
- **Status**: ✅ Complete

## Source material read

All 42 outcome files under `.ai/plans/session-event-audit/outcome/*.md` (phase-0
baseline, tasks 0.1–5.2 waves A–M, fix waves FIX-R ×4 / M-3 / A1 / P-1, E2E 8.1 +
rename, TB.1–TB.5 journeys/pentest, plan-review R1/R2).

## Deliverable 1 — canonical reference doc

**Created `docs/services/session-audit-reports.md`** (new file). Structure mirrors
the established `docs/services/teacher-payroll.md` / `whatsapp-cloud-api.md`
reference style and covers every required topic:

- **Architecture** — surface map table + full flow diagram
  (`mapToSessionAuditStatus` → `expandStatusesToSql` → repository (2 statements) →
  `SessionAuditService.getReport` → GraphQL query / CSV export route → filter store
  → grid), plus the key layering rules (one status rule in two representations,
  read-model repo, thin adapters).
- **Status-mapping truth table** — the four `SessionAuditStatus` wire values ↔
  exact SQL conditions, including the `open` catch-all (complement predicate) and
  the unknown→`open` fallback for legacy strings.
- **Permission model** — VIEW vs MANAGE, migration-39 grant groups
  (`super_admin` + `academy_admin` only), defense-in-depth read gating,
  `FORBIDDEN` contract, and the `includeDeleted` entry-point double-gating rule
  (service accepts unconditionally; resolver + route each re-gate).
- **CSV export contract** — exact 22-column grid-visual-order header (ids last,
  per the FIX-R backend AC-8.3 reorder), formula-injection hardening (`'`-prefix
  for `= + - @` tab CR, before quoting), CRLF/trailing CRLF, nulls→empty, fixed
  filename, `X-Export-Truncated` semantics, and the 401/403/400/500 mapping.
- **URL-param contract** — full `sessionAuditFilterStore` table (formats,
  defaults omitted, pair validation, 0-based page), replaceState + 100 ms sync,
  foreign-param preservation, reset-first hydration.
- **`openOverride` deep-link mechanics** — the five-step chain from
  `ClassAuditContainer` (MANAGE-gated, always strip-on-consume) through the
  audit-scoped `useClassAuditStore` flag (not the class-details store),
  `useClassAuditPayroll` (instance document + status events, VIEW+MANAGE dialog
  gate), the narrowed `OverrideDialogRow` Pick, and `onApplied` refetches.
- **Known design decisions** — dominant-currency aggregate (minor-unit bigint,
  ties → first-seen, empty → SAR), page-level aggregates, last-30-days default in
  the service (shared by query + route), strict service-side date validation,
  repo→service deep-import precedent, Pothos enum wiring (real TS enums, once,
  exhaustive Record converters, reused `OrderSortDirection`), student name from
  `students.name`, PAID-only `teacherDuePaymentDate`, service-owned default sort.
- **Gotchas** — state machine never produces mapper-`Absent` (stamps
  `actual_start_at`), includeDeleted gating at every entry point, search token/
  wildcard semantics, decimal-as-text numeric sort, service-owned last-page
  clamp, `NOT_CALCULATED`-never-null, no generated hooks (useQuery only), JSON
  aggregate narrowing at the view-model boundary, do-not-trim
  `teacherId`/`studentId` selection columns, and the journey-test teacherId
  scoping requirement.

## Deliverable 2 — root AGENTS.md pointer

Added one bullet to the `# Important References` section, after the cron-service
line, matching the existing bullet style:

```
- `docs/services/session-audit-reports.md` - Session audit reports canonical reference (status mapper/predicate/CSV/permission model, URL-param + openOverride deep-link contracts, aggregates design)
```

Note: the root `AGENTS.md` was concurrently edited by another agent during this
slice; re-checked after the on-disk change — the pointer line is present
(`AGENTS.md:451`).

## Deliverable 3 — layer AGENTS.md rules (deliberately minimal)

Reviewed every permanent-pattern candidate the plan proved against
"NOTHING plan-specific; at most one 1–2 line rule each; when in doubt, skip":

**Added (1 rule total):**

- `backend/graphql/AGENTS.md` — under the existing `permission` vs `superAdmin`
  section, one bullet: **privileged filter flags are enforced at EVERY entry
  point** (resolver AND route re-gate flags like `includeDeleted`; gating one
  entry point is a privilege-escalation hole), pointing at the new doc. This was
  the genuinely universal lesson — TB.5 pentest found a real
  privilege-escalation vulnerability from asymmetric gating, and the rule
  applies to any future privileged-filter/flag surface.

**Explicitly skipped (with reasons):**

- *Mapper/predicate single-rule pairing* — plan-specific to session statuses;
  the general DRY principle already exists in the type/enum rules. Skipped.
- *URL-hydration reset-first* — valuable but only meaningful for the 1–2
  URL-synced stores in the codebase; not yet a repeated pattern. Documented in
  the canonical doc instead. Skipped.
- *Repo→service deep import* — already an established pattern
  (`class-instances.ts` precedent); nothing new proved. Skipped.
- *No-hooks codegen / `useQuery(document, …)`* — already the standing GraphQL
  rules in AGENTS.md. Skipped.
- *Journey-test teacherId scoping / `--no-env-file` migration* — test-infra
  specifics, recorded in the canonical doc's Gotchas. Skipped.
- No edits to `shared/AGENTS.md`, `frontend/*/AGENTS.md`, or any skill file —
  none were demonstrably wrong on a point this plan proved.

## Files changed (complete list)

| File | Change |
|---|---|
| `docs/services/session-audit-reports.md` | 🆕 canonical reference (new) |
| `AGENTS.md` (root) | ✏️ one Important References bullet |
| `backend/graphql/AGENTS.md` | ✏️ one privileged-filter-flag rule bullet |
| `.ai/plans/session-event-audit/outcome/knowledge-propagation-outcome.md` | 🆕 this file |

No other files touched; no code changes in this slice; the concurrent
carryover-balance / whatsapp-inbox in-flight work was left untouched (verified via
scoped greps after the concurrent root-AGENTS.md rewrite).

## Verification

- Markdown edits only — not lintable (biome/oxlint/lint have no markdown
  linting); per slice instruction "quality-loop the AGENTS.md edit
  (markdown-not-lintable; fine) — no code".
- Root `AGENTS.md` pointer re-grepped after the concurrent on-disk change:
  present at line 451.
- `backend/graphql/AGENTS.md` change re-verified by re-reading the edited
  section (bullet present directly under the authScope pattern heading).
- Doc content spot-checked against source outcomes: CSV header string matches
  `1.5-csv-serializer-outcome.md` / `fix-r-backend-outcome.md` verbatim; status
  predicates match `1.2-status-predicate-outcome.md`; permission gates match
  `TB.5-pentest-outcome.md`; deep-link chain matches
  `3.6-open-override-outcome.md` + `a1-audit-payroll-data-outcome.md` +
  `p1-override-dialog-wired-outcome.md` + `fix-r-store-outcome.md`.
- Fixed one stray non-ASCII fragment introduced during drafting
  (`resolveDateTimeCell` trailing text) — re-read and corrected before
  finalizing.

## Hand-off notes

- The dev DB still needs `bun db migrate` for migration 39 grants (test DB is
  already applied) — recorded in TB.3/TB.5; environment task, unchanged here.
- When the UI/E2E run policy lifts, the session-audit grid/formatters/card/
  filter-bar/container tests plus
  `test/ui/e2e/accounting/session-audit-reports.test.ts` should be executed once
  as a regression sweep (all are written-but-never-run).
