# Credit Adjustment System

This document describes the Credit Adjustment System — operator-driven manual
adjustments to a student's class-credit balance (Add / Subtract / Subtract with
Carryover), written as ledger rows on the same `credit_transactions` table used
by purchases and deductions, with server-derived idempotency, an advisory-lock
transaction, rich-text reason sanitization, and a carryover handoff seam for
the teacher payout settlement workstream.

> **Ledger relationship:** Adjustments move the class ledger
> (`students.classesRemaining`/`classesTotal`) via `changeAmount` rows —
> exactly like purchases/deductions in `docs/billing/quota-system.md`
> (adjustments also trigger `QuotaService.refreshStudentOndemandInstances`).
> `changeAmountHours` stays `NULL` (the XOR CHECK with `changeAmount` is
> preserved); the hour-based parallel ledger described in
> `docs/billing/credit-hours-system.md` is untouched.

## Architecture Overview

```
RichTextEditor / AdjustmentTypeRadioGroup / CarryoverBanner (client form state: Zustand)
  → CreditAdjustForm → useMutation(recordCreditAdjustmentMutationDocument)
    → recordCreditAdjustment Pothos mutation (authScopes loggedIn; requireAuth)
      → CreditService.recordAdjustment (permission → validate → dispatch)
        → executeAdjustmentTransaction (advisory lock → idempotency pre-check → guards → insert → balance → handoff)
          → CreditRepository.createAdjustment → credit_transactions
```

| Layer | File(s) |
|---|---|
| Enums | `shared/constants/billing/credit-adjustment.enum.ts` (canonical `CreditAdjustmentType`), `backend/enum/billing/credit-adjustment.enum.ts` (value re-export shim), `backend/graphql/pothos/shared/enum.pothos.ts` (single Pothos registration) |
| Schema | `backend/db/schema/billing/credit-transactions.ts`, `backend/db/schema/enums.ts` (`credit_adjustment_type` PG enum via `createPgEnumFromEnum`) |
| Permission | `backend/db/migration/35-accounting-credits-permission.sql` (`ACCOUNTING_CREDITS_MANAGE`, granted to `super_admin` + `academy_admin`) |
| Types | `backend/types/billing/credit.types.ts` (`CreditAdjustmentInput`, `CreditAdjustmentReturnType`, `CreditAdjustmentInsertInput`) |
| Repository | `backend/db/repo/billing/credit.repository.ts` (`createAdjustment`); soft-delete-aware lookups `StudentRepository.findActiveById` / `TeacherRepository.findActiveById` |
| Service | `backend/services/billing/credit.service.ts` (`recordAdjustment` at `credit.service.ts:863`), `backend/services/billing/credit-adjustment.idempotency.ts`, `backend/services/billing/carryover-handoff.ts` |
| GraphQL | `backend/graphql/mutation/billing/credit-adjustment.mutation.ts`, `backend/graphql/pothos/billing/credit-adjustment.pothos.ts`, shared field helper `backend/graphql/pothos/billing/__shared__/creditFieldHelpers.ts` |
| Frontend documents | `frontend/common/graphql/sharedDocuments/billing/credit-adjustment.documents.ts` |
| Routes | `app/(dashboard)/accounting/credits/page.tsx`, `app/(dashboard)/accounting/credits/adjust/page.tsx` (both behind `withPageAuth([ACCOUNTING_CREDITS_MANAGE])`) |
| Views | `frontend/common/views/dashboard/accounting/credits/` (`StudentCreditsList`, `CreditAdjustForm`, `AdjustmentTypeRadioGroup`, `CarryoverBanner`, `creditAdjust.constants.ts`) |
| Store | `frontend/common/stores/creditAdjustFormStore.ts` |
| Editor | `frontend/common/components/ui/input/richText/RichTextEditor.tsx` |
| Sanitizer | `backend/lib/sanitize/richTextSanitizer.ts` |
| i18n | `shared/locale/**` namespaces `dashboard.billing.creditAdjustment` + `ui.richText` |

## Adjustment Types & Column Model

| Type | `CreditReason` on the row | Effect |
|---|---|---|
| `ADD` | `CREDIT_ADJUSTMENT_ADD` | `classesRemaining += hours`, `classesTotal += hours` |
| `SUBTRACT` | `CREDIT_ADJUSTMENT_SUBTRACT` | `classesRemaining -= hours` (rejected beyond remaining) |
| `SUBTRACT_WITH_CARRYOVER` | `CREDIT_ADJUSTMENT_CARRYOVER` | Same subtraction, plus the four carryover columns are stamped and the payout handoff runs in the same transaction |

Columns added to `credit_transactions` (additive migration; every pre-existing
row is a plain ledger entry via the default):

- `adjustment_type` `credit_adjustment_type NOT NULL DEFAULT 'ADD'` (the PG
  enum mirrors the shared TS enum; `.$type<CreditAdjustmentType>()` pins the
  inferred type).
- `carryover_teacher_id` `uuid → teachers.id ON DELETE SET NULL` (+ index).
- `carryover_from_date` / `carryover_to_date` / `carryover_payment_date` —
  TEXT holding ISO `YYYY-MM-DD` (PG `date` has no dialect-aware helper; TEXT
  ISO strings are the settled repo convention).
- Index `credit_transactions_adjustment_type_idx`.

Both carryover date *ranges* may be entirely in the past or entirely in the
future; the two enforced fences are `fromDate <= toDate` and
`paymentDate <= now + 1 day` (shared client-side fence constant
`PAYMENT_DATE_MAX_FUTURE_DAYS = 1` in
`frontend/common/views/dashboard/accounting/credits/creditAdjust.constants.ts`).

## Service Layer

`CreditService.recordAdjustment(actorUserId, input, tErrors)` is the single
public entry point:

1. `requirePermission(actorUserId, AppPermission.ACCOUNTING_CREDITS_MANAGE)` —
   **first**, before any validation or DB work.
2. `validateAdjustmentInput` — non-blank `studentId`; `Number.isInteger(hours)`
   with `1 <= hours <= 100_000` (mirrors the Pothos `Int` constraint for
   non-GraphQL callers); carryover block (teacher + all three dates) required
   iff `SUBTRACT_WITH_CARRYOVER`; `fromDate <= toDate`; payment-date fence.
3. Dispatch on `adjustmentType` to `addCredit` / `subtractCredit` /
   `subtractWithCarryover` — thin wrappers over the shared transaction
   skeleton `executeAdjustmentTransaction`
   (`backend/services/billing/credit.service.ts:205`), which is parametrized by
   signed hours, ledger reason, and an optional carryover block.

Inside the transaction, in strict order:

1. `acquireAdvisoryLock(tx, \`student_${studentId}\`)` — per-student
   serialization (`pg_advisory_xact_lock`, no-op on SQLite).
2. **Idempotency pre-check** (see next section).
3. `assertActiveStudentExists` (`credit.service.ts:67`) →
   `StudentRepository.findActiveById` (joins `users`, filters
   `users.deletedAt`). Carryover only: `assertTeacherExists` via
   `TeacherRepository.findActiveById`. These use the soft-delete-aware
   lookups; the legacy purchase/read flows keep the old `findById` behavior.
4. Subtract variants only: `assertSufficientClasses` — balance read and check
   run **under the lock**, so there is no unlocked read-modify-write.
5. `CreditRepository.createAdjustment(tx, { … })` with sanitized notes.
6. `StudentRepository.addClasses` / `deductClasses` +
   `QuotaService.refreshStudentOndemandInstances(studentId, tx)`.
7. Carryover only: `maybeInsertCarryoverBalanceEntry` — same transaction.

## Idempotency Design

The credit ledger has a unique index on `credit_transactions.idempotency_key`;
adjustments exploit it with a fully server-derived key.

### Key derivation (`backend/services/billing/credit-adjustment.idempotency.ts:30`)

```
["credit-adjustment", actorUserId, studentId, adjustmentType, String(hours),
 carryoverTeacherId ?? "", carryoverFromDate ?? "",
 carryoverToDate ?? "", carryoverPaymentDate ?? ""].join(":")
  → SHA-256 hex (64 chars)
```

- **Namespace prefix** `credit-adjustment:` prevents collisions with keys
  derived by other ledger flows (purchase/deduction).
- **Actor participates**: two distinct operators submitting the identical
  payload each persist their own ledger row (both carryover handoffs fire);
  the key differs because the second segment differs. Same-actor re-submit
  (double-click, network retry) collapses onto the first row.
- **`notes` (the rich-text reason) is deliberately excluded** from the hash:
  a retried submission whose only difference is the reason text still
  collapses onto the persisted row. This is the retry-tolerance property —
  document it; do not "fix" it by hashing notes.
- `null` and `undefined` carryover fields normalize to the same empty segment;
  no client-supplied `clientRequestId` exists anywhere (the field was
  intentionally dropped from the GraphQL input — idempotency is server-side
  only).

### Transaction ordering: replay pre-check precedes state-dependent guards

Inside `executeAdjustmentTransaction` the idempotency pre-check
(`CreditRepository.findByIdempotencyKeys`, in-tx) runs **immediately after
the advisory lock and before** the student/teacher existence checks and the
balance guard. This ordering is load-bearing: a replayed submission of a
legitimately executed adjustment must return the original persisted row
**even when the state that guarded the first write has since moved** — e.g. a
drained balance would otherwise make a replay throw `INSUFFICIENT_CLASSES`
instead of returning the original row. Do not move the pre-check after the
guards.

### 23505 recovery

If two concurrent same-actor submissions both pass the pre-check (both read
before either inserts), the loser's insert raises a Postgres unique violation
(SQLSTATE 23505). `runAdjustment` (`credit.service.ts:268`) catches it and
`resolveDuplicateAdjustment` re-reads the winning row by key outside the
rolled-back transaction and returns it; non-unique errors rethrow. The client
therefore always sees a successful "the adjustment" response — never a
duplicate-key error.

### Observability symmetry

`executeAdjustmentTransaction` returns `{ row, createdNewRow }`. The
post-commit success log and the audit entry fire **only when a new ledger row
was actually persisted**; replay paths (in-tx pre-check hit and 23505
recovery) stay silent so collapsed re-submits never produce duplicate audit
records.

## Security Posture

- **Permission gating**: `ACCOUNTING_CREDITS_MANAGE` checked first in the
  service, before any validation or read; the Pothos mutation only requires
  authentication and delegates. Route shells gate both
  `/accounting/credits` pages via `withPageAuth`; the sidebar item renders
  only for holders of the permission.
- **Soft-delete guards**: adjustments against students whose linked user is
  soft-deleted are rejected (`STUDENT_NOT_FOUND`, zero writes); same for the
  carryover teacher (`TEACHER_NOT_FOUND`). Unknown UUIDs take the same reject
  path (plus an FK failsafe at the repo layer).
- **Sanitizer contract**: `sanitizeRichText`
  (`backend/lib/sanitize/richTextSanitizer.ts`) is a pure, zero-dependency
  allowlist rewriter (NOT DOMPurify/jsdom — the jsdom chain breaks the Vercel
  serverless runtime; see the ban notice in
  `shared/lib/appearance.helpers.ts`). Allowed tags:
  `b, br, em, i, li, ol, p, strong, u, ul`. **No attributes survive on any
  tag** (event handlers, `style`, `href`, `src` are dropped by construction);
  `script/style/iframe/object/embed/svg/math` containers are removed with
  their contents; stray `<` is escaped. Blank or fully stripped reasons are
  persisted as `NULL`. The TipTap editor's toolbar emits exactly this
  allowlist (see Frontend below) — client and server agree by design.
- **Directory search safety**: the student directory LIKE path escapes
  `%`/`_`/`\` via `escapeLikeWildcards` (`backend/utils/db.utils.ts`); the
  full-text path parameterizes `to_tsquery` through drizzle `sql` template
  binds. `search` is capped at 255 chars, `limit` at 500 in the GraphQL layer.
- **Audit**: committed adjustments emit a best-effort `AuditService` entry
  (post-commit, swallows its own failures with a `logger.error` so a failed
  audit never fails a committed adjustment): `action: "UPDATE"`,
  `entityType: "STUDENT"`, `newState: { creditTransactionId, adjustmentType,
  changeAmount, carryoverTeacherId }`.
- **Notes rendering**: the frontend renders persisted notes as React text
  (no `dangerouslySetInnerHTML`) — defense in depth on top of the sanitizer.

## Frontend

### Pages & navigation

- `/accounting/credits` — `StudentCreditsList` (`SectionPanel` + AppDataGrid):
  debounced (300 ms) server-side search over
  `studentsDirectoryQueryDocument`, avatar/name/email, assigned teacher,
  colored `remaining / total` balance chip, per-row Adjust action deep-linking
  to `/accounting/credits/adjust?studentId=<id>`. The directory fetch is
  capped at `DIRECTORY_FETCH_LIMIT = 500` rows; when the cap is hit a
  translated `resultsCappedHint(limit)` caption tells the operator to refine
  the search (never truncate silently).
- `/accounting/credits/adjust` — `CreditAdjustForm`. `searchParams` is a
  Promise (Next.js 16); resolved via `await searchParams` inside
  `withPageAuth`.

### Store (`frontend/common/stores/creditAdjustFormStore.ts`)

Zustand slice holding `studentId`, `adjustmentType` (shared
`CreditAdjustmentType` enum from `@/shared/constants/billing`), `hours`,
`notes` (HTML), the four carryover fields (ISO date strings), and
`clientRequestId`. Key actions: `clearCarryover()` (nulls only the carryover
fields — invoked by the radio group when leaving
`SUBTRACT_WITH_CARRYOVER`), `regenerateClientRequestId()` (called on form
mount — rotates the guard token without wiping a `?studentId=` preselection),
`reset()` (defaults + token rotation; runs on unmount and after success).
The store deliberately does NOT auto-clear carryover on type change; the
radio group owns that pairing synchronously (one batched render).

### Form composition (`CreditAdjustForm`)

`StudentAutocomplete` picker → `AdjustmentTypeRadioGroup` (palette-family
card radios: success/error/warning) → hours `TextField` → `RichTextEditor`
reason → conditional `CarryoverBanner` → Cancel/Submit. Details worth
reusing:

- **Deep-link preselection**: `?studentId=` seeds the store on mount;
  `studentByIdQueryDocument` resolves a read-only summary row (avatar, name,
  balance chip). The shared autocompletes ignore MUI's programmatic `reset`
  sync, so the summary row — not the picker input — is the visible anchor.
- **Cache eviction on success**: the mutation result does not carry
  recomputed balances, so success evicts the `studentsDirectory` **and**
  `studentById` root fields (the list uses `cache-and-network` and refetches;
  a revisited deep link never shows a stale balance).
- **Double-submit guard (client side)**: a `submittedTokenRef` compared
  against the store's `clientRequestId`, plus `loading`-driven button
  disable; the ref is cleared on rejection so retries work. The server-side
  idempotency chain is the authoritative net.
- **Server error mapping**: `errorPolicy: "none"`; `INSUFFICIENT_CLASSES`
  surfaces inline on the hours field without navigating/toasting; other
  errors toast the server's already-localized message with a
  `common.operationFailed` fallback.
- **Reason emptiness**: `hasReasonText(html)` strips tags and decodes
  `&nbsp;` before trimming — TipTap stores a lone space as `"<p>&nbsp;</p>"`,
  so a naive `trim()` never rejects whitespace-only reasons.
- **Carryover toast**: the store keeps only the teacher id; the form resolves
  the display name from the person-picker result cache
  (`useUserAutocompleteStore`) and degrades to the subtract toast if
  unresolved.

### RichTextEditor (`frontend/common/components/ui/input/richText/`)

Controlled TipTap v3 editor ("use client", `immediatelyRender: false`).
StarterKit is configured so the toolbar (Bold/Italic/Underline/Bullet/
Ordered list) maps 1:1 to the sanitizer allowlist — heading, blockquote,
code, strike, link, and horizontal rule are disabled so the client cannot
emit markup the server would strip. Behavior contracts: empty is exactly
`""`; `onChange` never fires on mount or on echoed `value`; programmatic
`value=""` resets the document without emitting; `onChange` is mirrored
through a ref (defensive stale-closure guard). Toolbar labels come from the
`ui.richText` namespace.

### i18n

- Namespace `dashboard.billing.creditAdjustment`
  (`shared/locale/{types,en,ar,namespaces}/dashboard/billing/creditAdjustment*`),
  consumed via `useAppTranslation(DashboardBillingCreditAdjustment)` with the
  handle imported directly from `@/shared/locale/namespaces` (it is not in
  the `Translation` lookup registry). Nav label `accountingCredits` lives in
  `dashboard.core.nav` only — do not duplicate it.
- Arabic success toasts (`success.added` / `subtracted` / `carryover`)
  implement full CLDR plural branching (one → two → few 3–10 → many/other);
  no zero branch because `hours >= 1` is invariant client- and server-side
  (pattern per `docs/frontend/quota-ui-patterns.md`).
- After any locale-leaf edit run `bun run locale:snapshots` — the command
  rewrites every drifted snapshot, including other workstreams' leaves.

## Carryover Handoff (Payout Settlement Seam)

`maybeInsertCarryoverBalanceEntry`
(`backend/services/billing/carryover-handoff.ts:53`) is the integration seam
for the teacher payout settlement workstream. Contract:

```ts
export interface CarryoverHandoffPayload {
  creditTransactionId: string;
  teacherId: string;
  studentId: string;
  fromDate: string;      // ISO YYYY-MM-DD
  toDate: string;
  paymentDate: string;
  hours: number;
  approvedByUserId: string;
}
export async function maybeInsertCarryoverBalanceEntry(tx: DBTransaction, payload): Promise<void>
```

Current behavior: no-op on SQLite or when the tx cannot execute raw SQL;
otherwise probes `SELECT to_regclass('teacher_carryover_balances')` and, when
the table exists, inserts a `PENDING` row (columns: `credit_transaction_id`,
`teacher_id`, `student_id`, `from_date`, `to_date`, `payment_date`, `hours`,
`approved_by_user_id`, `status`, `created_at`) via a parameterized `sql`
template (`sql.identifier` for the table name). The table does not exist yet,
so today the stub is a verified no-op and the four `carryover_*` columns on
`credit_transactions` are the full carryover record.

The payout workstream must: ship the `teacher_carryover_balances` table
(`approved_by_user_id` is already inserted — add the column to the table
definition), replace the no-op with the settlement flow, and add the real-DB
insert-path integration test (the probe branches are already pinned by
`backend/services/billing/carryover-handoff.test.ts`; the journey tests
assert the invocation contract via a spy).

## Testing Inventory

| Surface | Suite | What it proves |
|---|---|---|
| Journeys (real DB, committed fixtures) | `test/workflows/billing/credit-adjustment-student-visibility.test.ts` | Add/Subtract happy paths, family/operator visibility, unrelated-family isolation, denial battery (permissionless, legacy `credits.manage`-only, view-only), replay collapse (different notes), insufficient balance, audit emission, zero notification dispatch |
| Journeys | `test/workflows/billing/credit-adjustment-carryover.test.ts` | Carryover happy path + handoff payload (incl. `approvedByUserId`), carryover visibility, future ranges, two-operator concurrency (both commit) vs same-actor collapse, denial atomicity (ledger/balance/handoff frozen), audit recount |
| Security workflows | `test/workflows/billing/credit-adjustment-security.test.ts` | Real-permission denies for teacher/parent/student actors, soft-deleted/unknown student & teacher rejection with zero writes, sequential + concurrent replay collapse, stored-XSS write→read roundtrip |
| Service (mocked modules) | `backend/services/billing/credit-adjustment.service.test.ts` | All three flows, replay-after-guards ordering (drained-balance replay returns the first row), two-operator distinct keys/rows vs same-actor collapse, 23505 winner resolution + miss rethrow, validation matrix, XSS battery against the real sanitizer, audit/log only-on-new-row |
| Idempotency helper | `backend/services/billing/credit-adjustment.idempotency.test.ts` | Determinism, field sensitivity (incl. actor), notes exclusion, null≡undefined, seeded fuzz, verbatim (no case/whitespace normalization) |
| Handoff stub | `backend/services/billing/carryover-handoff.test.ts` | No-op branches, insert with exact column/param order, SQL-injection parameterization proof |
| Repository | `backend/db/test/repo/billing/credit-adjustment.repository.test.ts`, `credit.repository.test.ts`, student/teacher `findActiveById` + directory suites | Insert shapes, FK + unique-index driver rejection (savepoint-wrapped), soft-delete filtering, LIKE wildcard literalness, parameterized FTS |
| Migration | `backend/db/test/migrations/credit-adjustment-columns.test.ts` | Columns/types/defaults, enum values, indexes, FK delete rule, idempotent re-application |
| GraphQL mutation | `backend/graphql/mutation/billing/credit-adjustment.mutation.test.ts` | Registration, full input pass-through (null + non-null), `FORBIDDEN`/`VALIDATION`/`UNAUTHENTICATED` extensions propagation |
| Components | `test/ui/components/accounting/CreditAdjustForm.test.tsx`, `StudentCreditsList.test.tsx`, `test/ui/components/ui/RichTextEditor.test.tsx` | Type-switch UX, carryover submit payload, double-click single mutation, inline INSUFFICIENT_CLASSES, deep-link preselection, cache evictions, whitespace-reason rejection, capped-list hint, editor contracts, axe-core zero-violation |
| E2E | `test/ui/e2e/accounting-credits.test.ts` | Permission-gated pages + sidebar item both directions, full Add/Subtract/Carryover flow against the dev test server |
| Sanitizer | `backend/lib/sanitize/richTextSanitizer.test.ts` | Allowlist branches, container strips, stray-`<` escaping, seeded fuzz, named XSS-payload neutralization |

## Related Documents

- `docs/billing/quota-system.md` — class-credit quota ledger (FIFO, rollover,
  on-demand integration; adjustments trigger the on-demand refresh of that
  system).
- `docs/billing/credit-hours-system.md` — hour-based parallel ledger
  (`changeAmountHours`, package plans); untouched by adjustments.
- `docs/frontend/quota-ui-patterns.md` — i18n CLDR plurals and shared UI
  patterns reused by the credits pages.
