# TB.4 — 4-Tier Test Verification for the Six Backend/Shared Surfaces — Outcome

- **Date**: 2026-09-05
- **Status**: ✅ Complete (WAVE-O-2)

## Method

For each of the six assigned surfaces, read the implementation and its test
file, audited both against the 4-Tier framework (Tier 1: 100% branch coverage;
Tier 2: boundary/edge/unicode; Tier 3: randomized/exhaustive sweeps where
sensible; Tier 4: security/abuse), and added ONLY genuinely missing cases.
Every test file touched (and every file verified-complete) was run via
`bun run test/scripts/run-test.ts <path>` until green; every touched file was
then taken through `bun run scripts/health/sub-loop.ts <file> --lifecycle
codescene` until exit 0.

Baseline (before this task): mapper 32 pass, predicate 9 pass, serializer
11 pass, service 12 pass, repository 13 pass, route 20 pass — all green out of
the box.

## Per-file verdict table

| Implementation | Test file | Verdict | Before → after | Cases added by this task |
|---|---|---|---|---|
| `shared/constants/classes/session-audit-status.ts` | `session-audit-status.test.ts` | Tier 1 already exhaustive (every COMPLETED branch × actualStartAt null/undefined/Date/ISO-string, COMPLETED+PENDING/null, RUNNING/ACTIVATED/NOT_ACTIVATED, all four ON_DEMAND states, nullish inputs, registry completeness) | 32 → 33 pass | Tier 3 sweep: every `ClassExecutionState × ClassOutcome × {null, Date}` combination maps to a registered `STATUS_TO_PREDICATE_KEY` key (never throws, never leaves the union) |
| `backend/services/accounting/session-audit-status-predicate.ts` | `session-audit-status-predicate.test.ts` | Tier 1 complete (each of the 4 predicates' exact SQL, OR-join, dedup, empty→`true`, unknown→open); Tier 2 mixed dedup missing | 9 → 11 pass | Mixed known+unknown list (`["end","RETIRED-LEGACY"]` ≡ `["end","open"]`); Tier 4 injection: `"open' OR 1=1 --"`, `"end; DROP TABLE class_instances;"`, `"Absent'/*"` all collapse to the open fallback and never appear in the rendered SQL or params |
| `backend/services/accounting/session-audit-csv.serializer.ts` | `session-audit-csv.serializer.test.ts` | Tier 1 complete (header+rows, comma/quote/newline escaping, empty array, null fields, `=`/`+`/`-`/Tab formula prefixes); Tier 4 formula list units incomplete | 11 → 14 pass | CR-led formula cell unit case (completes the OWASP prefix set); unicode/Arabic text preserved verbatim + ASCII comma inside Arabic text quoted (Arabic comma `،` passes through — verified empirically); overlong payroll note (2 000+ chars) serialized verbatim inside one quoted cell (specs edge: long note preserved in CSV) |
| `backend/services/accounting/session-audit.service.ts` | `session-audit.service.test.ts` | Tier 1 permission/validation/clamp/log flows complete; money-math helper branches were uncovered | 12 → 17 pass | Malformed amounts (`"not-a-number"`, `" "`) excluded from the total instead of zeroed; >2-decimal half-up rounding (`1.255/2.254/7` → `10.51`, float-safe); negative totals (`-20.00 + 5.00` → `-15.00`) covering the negative branch of the formatter; equal currency tallies keep the earliest-seen currency; last-page clamp equality boundary (`offset === totalCount` → re-fetch at `floor((n-1)/limit)*limit`) |
| `backend/db/repo/scheduling/session-audit.repository.ts` | `session-audit.repository.test.ts` | Tier 1 near-complete: all 10 sort fields asc+desc, all filters individually + combined, PAID-gated payment date, 2-statement query count, soft-delete default / `includeDeleted` pass-through, LIMIT/OFFSET normalization | 13 → 16 net pass via my 3 tests (17 at run time incl. a sibling's test) | Offset past end → empty rows with full `totalCount` (documented contract, previously untested); blank / whitespace-only search ignored (token filter branch); session starts at exact inclusive day bounds (`00:00:00.000` / `23:59:59.999Z` in, adjacent out) |
| `app/api/accounting/reports/export/route.ts` | `route.test.ts` | Tier 1 + Tier 4 largely complete (401/403/500, every 400 branch, `includeDeleted` manage-gating, formula/quote/comma CSV hardening through the REAL serializer, truncation >10 000) | 20 → 25 pass | Locale fallback branch (no `accept-language` header → Arabic strings); compound header primary-subtag parsing (`en-US,en;q=0.9`); truncation equality boundary (`totalCount === 10 000` → `X-Export-Truncated: "false"`); comma-only `currentStatuses` treated as absent; search at exactly 200 chars accepted (boundary next to the 201 rejection) |

## Cross collision with a sibling agent

While this task was mid-flight, another agent edited
`backend/db/test/repo/scheduling/session-audit.repository.test.ts` and added a
LIKE-wildcard literal test covering BOTH `%` and `_` abuse (teacher-name
fixtures with `100%Wildcard` / `200_Marker` vs decoys). I dropped my planned
underscore-wildcard test to avoid duplication; the Tier 4 ILIKE-abuse
requirement for the repository is therefore satisfied by that test. My edit to
that file was the three tests listed above (re-read the file after the
external modification before editing).

## Deliberately NOT fuzzed (with reasons)

- **CSV serializer round-trip fuzz**: any non-trivial fuzz property requires a
  CSV parser in the test (random content legitimately contains CR/LF, so naive
  line-count invariants break). The escaping table is exhaustive (`= + - @
  \t \r` prefixes × quote/comma/newline cells × empty/null) — an explicit-case
  matrix is the honest coverage here. Route-level hardening (TB.5 territory)
  additionally passes adversarial cells through the real serializer.
- **Predicate RNG fuzz**: the input domain after normalization is only the
  four known keys + unknown; the mixed/injection cases plus the dedup +
  OR-join tests cover every reachable output shape. A seeded RNG would re-roll
  the same four equivalence classes.
- **Service/repo concurrency**: no shared mutable state beyond per-call locals
  (service) and a single `queryDb(tx)` handle issued as two parallel
  statements (repo); the concurrency concern of specs E8 / NFR-4 is asserted
  by the TB.3 access-isolation journey, which is the right layer for it.
- **`isCalendarDate` leap-year sweep**: the strict parse + rollover rejection
  (regex shape + impossible-day check) is already asserted; month/day
  extremes would redo the same two predicates.

## Verification commands + results

- `bun run test/scripts/run-test.ts shared/constants/classes/session-audit-status.test.ts` → **33 pass / 0 fail**
- `bun run test/scripts/run-test.ts backend/services/accounting/session-audit-status-predicate.test.ts` → **11 pass / 0 fail**
- `bun run test/scripts/run-test.ts backend/services/accounting/session-audit-csv.serializer.test.ts` → **14 pass / 0 fail** (one failure during authoring — the Arabic comma `،` is U+060C, not ASCII, so it does NOT trigger RFC-4180 quoting; test corrected to pin the real behavior)
- `bun run test/scripts/run-test.ts backend/services/accounting/session-audit.service.test.ts` → **17 pass / 0 fail**
- `bun run test/scripts/run-test.ts backend/db/test/repo/scheduling/session-audit.repository.test.ts` → **17 pass / 0 fail** (incl. sibling's wildcard test)
- `bun run test/scripts/run-test.ts app/api/accounting/reports/export/route.test.ts` → **25 pass / 0 fail**
- `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` → **exit 0** on all six test files (tsgo, oxlint, biome, lint, duplicates, codescene)

Totals: 97 baseline tests → 117 tests across the six files.

## Semantic review

- Test-only changes: zero implementation files were modified.
- No `console.*`, no plan-artifact references (REQ/Task/AC/E-numbers/plan
  paths) in comments; comments state behavior only.
- Repo tests stay inside `runInRollback` with `tx` passed everywhere; no
  `expect().rejects` inside transactions; fixtures via `entity-setup` helpers
  with unique prefixes.
- No mocks weakened: the new service tests route through the existing mocked
  repository; the route additions still exercise the real CSV serializer.
- Did not run `generate:gqlSchema` / `codegen` (owned by a sibling wave). No
  schema migrations touched.

## CROSS-FILE DEPENDENCY

None.
