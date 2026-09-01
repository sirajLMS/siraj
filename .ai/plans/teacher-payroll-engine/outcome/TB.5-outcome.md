# TB.5 — Penetration Verification Outcome (payroll engine attack surface)

Task: TB.5 Penetration verification (trackable-tasks.md, Wave 2). Method per `.agents/skills/pentester/SKILL.md` (API1/API3/API5/API8 focus + OWASP CSV-injection + XSS batteries). Probes were throwaway `bun:test` files under `test/scratch-tb5/` (real services + real test DB at the service/GraphQL-scope/route layers, never route-import in DB journeys) — deleted after evidence capture below. Committed regression proof lives in the payroll journeys + CSV route suite.

## Attack matrix

| # | Vector (surface) | Payload class | Result | Verdict |
|---|---|---|---|---|
| P0 | Baseline: teacher telemetry → operator stop → auto-calc | — | CALCULATED 120.00 committed in-tx | SECURE (control) |
| P1 | BOLA read: `getReport` by teacher(own/victim id)/student/parent/staff_default; VIEW-only auditor cross-teacher read | IDOR via `teacherId` filter | 5/5 non-VIEW actors → `ForbiddenError` + `tErrors.insufficientPermissions` BEFORE any row read; VIEW auditor reads academy-wide incl. amounts (US-1 designed contract) | SECURE (gate is the boundary, by design) |
| P2 | BOLA write: `applyOverride` by teacher(own instance)/student/parent/staff/VIEW-only auditor; MANAGE actor → ghost instanceId | IDOR via arbitrary `instanceId` | 5/5 non-MANAGE → Forbidden before validation; ghost id → NotFoundError; row snapshot + event count + `audit_logs` for all 6 actors unchanged (zero state impact) | SECURE |
| P3 | LIKE-wildcard injection through `getReport` search (`%`, `_`, `\`, fullwidth `％`, `'--;DROP`, bare `%`) | wildcard/SQLi via search filter | Escaped `%`/`_`/`\` behave as literals (only literal-named rows match); SQLi payload parameterized, no error, no match; bare `%` returns only literal-`%` rows (no match-all) | SECURE (repo `escapeLikeWildcards`, parameterized) |
| P4 | `payrollNote` XSS through the real `applyOverride` write path: `<script>`, `<img onerror>`, double-encode, `javascript:`+mutation-XSS chain, CSV formula `=SUM…HYPERLINK`, control chars `\t\r\n`, fullwidth `＜script＞`, 3000-char `<b>` bomb; idempotency raw-note hashing | XSS / formatter abuse / idempotency collision | All 8 payloads land as `sanitizePlainText` output in BOTH `class_instances.payrollNote` and the `PAYROLL_OVERRIDE` event description; exact raw re-submit dedupes (same auditEventId, no new event); different-raw-note-that-sanitizes-identical does NOT dedupe (hashes raw by design) | SECURE (E16 honored; E15 truncation covered in TB.4 battery) |
| P4b | NUL byte (`\u0000`) inside `payrollNote` | invalid-encoding abuse | pg driver rejects with SQLSTATE 22021 (`invalid byte sequence … 0x00`) surfaced as DrizzleQueryError — a 500-class error, not a clean 400; transaction rolls back: row amount/note + event count unchanged | **VULN (Low) → DEFERRED as D24** (privileged-only surface, no injection, no state corruption; app-wide text-input hardening, not payroll-specific) |
| P5 | `force` flag escalation: VIEW-only + force, session-teacher(own) + force, MANAGE + force on CALCULATED, WAITING_PAID unforced vs forced, PAID + force | authz bypass via flag | force never bypasses the MANAGE gate (2× Forbidden, row untouched); MANAGE+force on CALCULATED → PARTIALLY 48.00 (40% of 120); WAITING_PAID unforced → DomainError `awaitingSettlement` pre-write; forced → allowed; PAID + force → DomainError, amount/status frozen | SECURE (gate precedes validation; PAID immutable even with force) |
| P6 | D22: `getClassStatusEvents` PAYROLL_* payloads to non-payroll viewers | second-order confidentiality leak | PRE-FIX (predecessor run): session teacher + student saw `PAYROLL_STATUS_TRANSITION` + `PAYROLL_OVERRIDE` rows with `fromState`/`toState` amount JSON — CONFIRMED EXPOSURE. POST-FIX (this wave): teacher/student see zero `PAYROLL_*` events; operator (VIEW holder) still sees the full audit trail | **VULN (Medium) → FIXED in-plan** (see D22 decision) |
| C1 | CSV export hostile query params (malformed dates, bogus status enum, >200-char search, `%00`) | route-layer abuse | All → localized 400 JSON, service never invoked, zero 500s | SECURE |
| C2 | CSV export wildcard-laden but well-formed params | wildcard pass-through | Reach the service verbatim (`%_\'; --％`); repo owns escaping (P3) | SECURE |
| C3 | CSV formula battery through the real builder (`=`,`+`,`-`,`@` prefixes) | OWASP CSV injection | All get the protective `'` prefix; no raw formula starts a cell | SECURE |
| C4 | CSV tab-led (`0x09=HYPERLINK…`) and CR-led (`0x0D=1+1`) formula cells | OWASP CSV injection (extended prefixes) | PRE-FIX (predecessor evidence): tab-led cell emitted with NO neutralizer, CR-led content un-neutralized inside quotes — CONFIRMED GAP. POST-FIX: both get `'` prefix before RFC-4180 quoting | **VULN (Low-Medium) → FIXED in-plan** (`CSV_FORMULA_PREFIXES` += `\t`, `\r`) |
| C5 | CSV embedded CRLF row-smuggling (`evil\r\n=CMD('calc')`) | CSV row injection | Stays RFC-4180-quoted with doubled quotes; smuggled formula never starts a raw cell (outside-quotes scan clean) | SECURE |
| G1 | GraphQL `payrollReport` with no payroll permission (real Pothos scope-auth plugin) | transport-layer BFLA | FORBIDDEN + `insufficientPermissions`, resolver never invoked | SECURE (AC-7.3) |
| G2 | GraphQL hostile wildcard search at transport (`%_\'; DROP TABLE class_instances; --％`) | transport wildcard/SQLi | Accepted, passed RAW to service (escaping deliberately repo-owned → P3 proves the repo escapes) | SECURE |
| G3 | GraphQL `applyPayrollOverride` with VIEW-only + `force:true` | transport BFLA | FORBIDDEN, service never invoked | SECURE (AC-7.4) |
| G4 | GraphQL `applyPayrollOverride` with MANAGE while impersonating | impersonation abuse | Denied by the `$all notImpersonating` scope, service never invoked | SECURE |

## Predecessor's 4 failing scratch tests — diagnosis (3 probe bugs, 1 real finding)

Predecessor run: 7 tests, 3 pass / 4 fail (`/tmp/tb5-service-probe.log`, since removed).

1. **P1 fail — PROBE BUG (fixture mapping)**: expected the victim teacher's read to return `[instA, instC]`, but the fixture gives the victim only `instA` (decoy owns `instB`+`instC`). Product returned exactly the victim's single row — correct. Fixed the expectation.
2. **P3 fail — PROBE BUG (same fixture mapping)**: `search("PREFIX wild 100X")` expected `[instB]` but correctly matched BOTH decoy instances (`instB`+`instC` share the decoy teacher whose name contains `wild 100X`). The actual wildcard-security assertion (escaped `100%` matches only the literal row) passed. Fixed the expectation.
3. **P4 fail — REAL FINDING (Low)**: payload `"a\tb\rc\nd \u0000 ctrl"` — `sanitizePlainText` does not strip NUL, pg rejects with SQLSTATE 22021 → unhandled DrizzleQueryError (500-class). Payloads 1–5 (the actual XSS battery) had already passed before the throw. Split into: sanitized control-chars payload (passes) + dedicated P4b NUL evidence test. Deferred as **D24** (app-wide text-input hardening; shared-sanitizer blast radius too broad for this wave; privileged-only, rollback-safe).
4. **P5 fail — PROBE BUG (proration baseline)**: expected `48.00` (40% of full-session 120) but PARTIALLY proration applies the percentage to the CURRENT row amount (`payroll-override.service.test.ts`: "halves the calculated amount", "prorates from a fresh calculation when the row carries no amount") — P4's loop had compounded the row to 3.75 → 40% = 1.50 was CORRECT product behavior. Probe now re-baselines the row to CALCULATED 120.00 (with `isPartialPercentage: null` to satisfy `class_instances_partial_percentage_chk`) before the forced override; `48.00` assertion holds. (Also surfaced: the predecessor's WAITING_PAID/PAID direct resets needed the same null-out — never reached before because the test died earlier.)

## D22 decision — FIX NOW (implemented)

- **Evidence**: P6 (pre-fix) — session teacher and student, authorized only for instance view, received `PAYROLL_STATUS_TRANSITION`/`PAYROLL_OVERRIDE` events whose `fromState`/`toState` JSON carry `teacherPaidAmount`/rates; the GraphQL field is `authScopes: { loggedIn: true }` + service-level instance-view auth, so every participant (teacher/student/parent of the class) can call it directly regardless of UI gating.
- **Rationale**: US-7's intent ("only authorized accounting staff can read … pay") + the TB.1 precedent (detail surface already strips the 8 payroll fields via `withoutPayrollSnapshot`) left the events surface as the only payroll-amount leak on the same page; AC-7.1's enumeration predates this surface's payroll payloads, and D22 explicitly reserved the decision for this wave. Filtering at the service layer mirrors the existing pattern (defense in depth, transport-agnostic), keeps the operator audit trail intact, and is a 3-line change — strictly cheaper than documenting an accepted risk that contradicts the detail-surface behavior.
- **Fix**: `backend/services/session/class-session.service.ts` → `getClassStatusEvents` now drops `PAYROLL_*` events for actors without `ACCOUNTING_PAYROLL_VIEW` (via `PermissionsService.hasPermission`, same as `getClassInstanceDetail`).
- **Proof**: TB.1 journey step 7 extended (teacher + student see zero `PAYROLL_*` events; operator still sees 1 transition/instance) — 8/8 green; scratch P6 post-fix assertions green; FULL `test:workflows` 74 pass / 0 fail across 11 files (TB.1/TB.2/TB.3 journeys green with the filter in).

## C4 fix — CSV tab/CR formula prefixes (in-plan)

`app/api/payroll/export/route.ts`: `CSV_FORMULA_PREFIXES` extended to `["=", "+", "-", "@", "\t", "\r"]` (OWASP CSV-injection guidance) + comment updates. Proof: committed `route.test.ts` gains "neutralizes tab- and CR-led formula cells (OWASP 0x09/0x0D prefixes)" — suite 13/0; scratch C4 post-fix assertions green. Blast radius: the `'` prefix lands before RFC-4180 quoting, so C5 row-smuggling behavior is unchanged (verified).

## Runs (all via `bun run test/scripts/run-test.ts` / `bun run`)

- `test/scratch-tb5/tb5-service-probe.test.ts` → **8 pass / 0 fail** (P0–P6 + P4b)
- `test/scratch-tb5/route.probe.test.ts` → **5 pass / 0 fail** (C1–C5, post-fix)
- `test/scratch-tb5/tb5-gql-probe.test.ts` → **4 pass / 0 fail** (G1–G4)
- `app/api/payroll/export/route.test.ts` → **13 pass / 0 fail** (12 prior + 1 new)
- `test/workflows/payroll/auto-calculation-to-payroll-visibility.test.ts` (TB.1) → **8 pass / 0 fail**
- FULL `bun run test:workflows` → **74 pass / 0 fail / 11 files**
- Sub-loop `--lifecycle codescene` exit 0 on all 4 touched files (first try for service/route/route.test; journey file needed one `no-await-in-loop` → `Promise.all` refactor, then exit 0)

## Files touched (no commits — orchestrator commits)

- `backend/services/session/class-session.service.ts` — D22 events filter
- `app/api/payroll/export/route.ts` — CSV tab/CR prefix hardening
- `app/api/payroll/export/route.test.ts` — +1 tab/CR neutralization test
- `test/workflows/payroll/auto-calculation-to-payroll-visibility.test.ts` — step 7 D22 blindness assertions
- `test/scratch-tb5/` (3 files) — probes, deleted after evidence capture; `/tmp/tb5-service-probe.log` removed

## Deferred ledger impact

- **D22 → ✅ Done** (fixed this wave; evidence above).
- **D24 (NEW)** — NUL-byte (and general invalid-encoding) text input hardening: rejected at the DB driver with SQLSTATE 22021 → 500-class error instead of a clean 400; affects every user-writable text column app-wide (payrollNote, remarks, names…). Owner: future hardening wave; suggested shape: strip/reject `\u0000` at the validation layer (shared sanitizer or global input pipe).

## Verdict summary

- BOLA/IDOR (read + write): **SECURE** — permission gate is the boundary and precedes validation; VIEW academy-wide reads are the designed US-1 contract.
- Wildcard/LIKE injection (repo + GraphQL transport + CSV route): **SECURE**.
- CSV export (params, formulas incl. tab/CR, row smuggling): **SECURE** after the C4 fix (was Low-Medium gap).
- payrollNote XSS (E16) + idempotency: **SECURE**.
- force-flag escalation: **SECURE** (PAID immutable even with force; MANAGE gate precedes force).
- D22 events-surface exposure: **was Medium VULN → FIXED in-plan** (US-7 intent; detail/events surfaces now consistent).
- Residual: **D24** (Low, accepted-for-now via deferral, privileged-only surface on the payroll leg).
