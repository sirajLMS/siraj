# Knowledge Propagation Outcome — carryover-balance-module

- **Date**: 2026-09-06
- **Status**: ✅ Complete
- **Source**: all 40+ outcome files under `.ai/plans/carryover-balance-module/outcome/` read in full.

## Knowledge targets touched

### 1. `docs/billing/carryover-balances.md` (NEW canonical reference)

Consolidates the full module: architecture table (permissions → schema → relations
→ repos → service → GraphQL → CSV route → documents → store → views → routes →
i18n → tests), table-by-table column design (money-as-text, snapshot items, soft
`expenseId` link), all ten service operations with permission gates, the
idempotency design (advisory lock → replay lookup → row locks; sha256
scope-prefixed keys; metadata-based replay reconstruction), the GraphQL surface
(incl. `t.loadable`-for-counts / root-query-for-lists rule and the
`graphql-constraint-directive`-vs-graphql-17 caveat), the CSV export incl. the
`X-Export-Truncated` contract, frontend composition, the full error-code list,
14 battle-tested gotchas (PARTIALLY/`isPartialPercentage` clear+restore via item
snapshots, replay paging >100 rows, id-sorted FOR UPDATE, soft-delete exclusion
in lock reads, uuid narrowing before uuid-typed queries, guard-ordering
NOT_AUDITED-before-ALREADY_LINKED, lock-then-transition, permission-grant custom
SQL migrations, expense-adapter stub contract pending Plan 6, nullable-column
fixture blast radius, dual-DB migrate discipline, hashed FK names, test-harness
conventions), the test-layer map, and the open follow-ups (Plan 4 grid
integration, Plan 6 ledger, unexecuted UI/E2E suites, clone-pair follow-ups).

### 2. Root `AGENTS.md`

Important References:
`docs/billing/carryover-balances.md` entry added directly after
`docs/billing/credit-adjustments.md` (one line).

### 3. `backend/db/repo/AGENTS.md`

One new permanent repository-layer rule (not previously documented anywhere):
batch `FOR UPDATE` lookups MUST sort ids before query + `ORDER BY id`
(deadlock avoidance), require `tx`, and apply the same `isNull(deletedAt)`
soft-delete exclusion as every other read path. Both halves of the rule were
real review findings (non-linear lock order → deadlock risk; deleted sessions
being settled for money).

### 4. `docs/quality/linting-rules.md`

Two missing recipes added (both repeatedly exercised during this plan):

- `no-array-sort` + `sonarjs/no-alphabetical-sort` → `toSorted((a, b) =>
  a.localeCompare(b))` (validation: `no-map-spread` and `no-await-in-loop` were
  already covered, so no entries added for them).
- `sonarjs/no-nested-conditional` → if/return early exits (locale pluralization
  functions in particular).

## Deliberately NOT touched (strict-filter decisions)

- **`backend/AGENTS.md`** — no line added. The candidate (custom SQL
  permission-grant migration pattern) is already documented where it operates:
  `backend/db/seeds/AGENTS.md` ("Do not seed system permissions… new permission
  keys/groups → SQL under `backend/db/migration/`"). The pattern detail now also
  lives in the canonical doc (gotcha #10). Adding another pointer to
  `backend/AGENTS.md` would duplicate, violating the strict filter.
- **`shared/AGENTS.md`** — no line added. The one cross-locale lesson (hoist a
  closed literal-set (`Paid/Unpaid/Both`) into `shared/constants/` as a const
  tuple + derived type) is already the documented "Shared Enums" /
  "Cross-Layer Shared Types" patterns in that file; the CLDR
  if/return lesson is covered by the new lint recipe instead.
- **`test/workflows/AGENTS.md`** — no line added. No new workflow-layer
  invariant emerged: journey patterns used (committed fixtures, honest
  permissions, dispatch spy, trigger-toggle audit sweep, DIAGRAMS.md mermaid
  requirement) are all already rules 1–11 in that file.
- **`deferred-items.md`, `trackable-tasks.md`, all source files** — untouched;
  no git mutations performed.

## Verification

Markdown files are outside the repo's lint/format pipeline (confirmed by
running the actual tools, matching the known md/json artifact):

- `bun run scripts/health/sub-loop.ts docs/billing/carryover-balances.md
  --lifecycle codescene` → tsgo stage **passed** (project-wide, zero errors for
  the file); oxlint stops with "No files found to lint" because md has no lint
  config — pipeline artifact, identical behavior on pre-existing committed docs.
- `bunx biome check` on all four touched md files → all four are ignored by
  biome config (repo formats/lints TS only; no md tooling exists).
- No `package.json` script lints or link-checks markdown.
- tsgo is project-wide: the root `AGENTS.md` and `backend/db/repo/AGENTS.md`
  edits are comment-only and carry no code blast radius; the project-wide tsgo
  inside the sub-loop run above is the green check.
- All paths referenced in the new doc were derived from the outcome files (which
  recorded their own sub-loop exit-0 and test-suite passes: 18 suites / 362
  tests green at final verification).
