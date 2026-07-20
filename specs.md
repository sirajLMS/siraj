# specs.md — Notification Wiring Universal Subagent Specification

> **MANDATORY READING for every agent at every nesting level.**
> The orchestrator, every Wave subagent (S1..S8), every nested subagent they
> dispatch, every fix-round subagent, and every quality-gate-reconciliation
> subagent MUST read this file in full BEFORE doing any work.
>
> The orchestrator's dispatch prompts MUST:
>   1. Reference this file by ABSOLUTE PATH: `/home/ahmed/Projects/siraj/specs.md`
>   2. Pass it via `file_attachments: ["specs.md"]` to the Task tool
>   3. Include the summary-card (§13) inline at the top of each Task prompt
>   4. Instruct the receiving subagent to:
>      (a) read it via the Read tool BEFORE its first action,
>      (b) re-read it after every fix round,
>      (c) reference it explicitly in any CROSS-FILE DEPENDENCY report
>
> This file is binding on agents handling the smallest slice AND on the
> final Wave 2 quality-gate orchestrator. Any rule in a higher-level plan
> or memory file (AGENTS.md, layer AGENTS.md, instruction files) that
> appears to contradict this document is OVERRIDDEN by this document —
> but ONLY to the extent of the conflict; everything else still applies.

---

## 0. The Three Inviolable Rules (recite before doing anything)

1. **Every notification dispatch in the codebase must go through**
   `dispatchWithPreferences` from
   `@/backend/services/notification/notification-dispatch.helpers.ts`
   — NO direct `CommunicationService.dispatch`/`dispatchMulti` calls from
   domain services. NO direct `NotificationRepository.createDelivery`/
   `createDeliveriesBatch` from domain services (only the existing
   `GroupClassService.resendNotifications` legacy call is grandfathered).

2. **Every notification payload must be built by a pure builder from**
   `@/backend/services/notification/notification-payloads.builders.ts`.
   Domain services MUST NOT inline `CommunicationPayload` objects. They
   call e.g. `buildInvoiceGeneratedPayloads(parentUserId, invoice, locale)`
   and pass the result to `dispatchWithPreferences`.

3. **Every user-facing string (title, body, error) must be localized**
   through the compile-time i18n system at `shared/locale/notifications/`.
   NO hardcoded English strings. NO `t("...")` from `next-intl` inside
   the `backend/services/notification/` layer — use
   `getServerTranslations(locale, "notifications")` from
   `@/shared/locale/server-graphql` (the backend/scripts/api route path).

If you find yourself about to write ANY of: `CommunicationService.dispatch(`
or `CommunicationService.dispatchMulti(` directly inside a domain service,
`new NotificationRepository.createDelivery` inside a domain service,
hardcoded `"Invoice created"` strings, `console.log`, `next-intl`
`useTranslations`, `enqueueSnackbar`, removing an existing
`NotificationSyncService.syncUnpaidNotifications` call without keeping a
tray-summary update, or modifying a file outside your assigned ownership
matrix — **STOP. You are about to violate the rules. Re-read sections
1-6 below.**

---

## 1. File ownership strict-mode matrix (no subagent edits files it doesn't own)

| Subagent | Owns (creates/edits ONLY these files) |
|---|---|
| S1 — Foundation | `backend/enum/notifications/notificationDeliveries.enum.ts`, `backend/graphql/pothos/shared/enum.pothos.ts`, `backend/services/notification/notification-preferences.service.test.ts` (assertion count), review DB migration output (do NOT hand-edit migrations) |
| S2 — Builders | `backend/services/notification/notification-payloads.builders.ts` (new), `backend/services/notification/notification-dispatch.helpers.ts` (new), `backend/services/notification/index.ts` (barrel), `shared/locale/notifications/*.ts` (new namespace files), `shared/locale/notifications/index.ts`, `shared/messages/notifications.ts` (legacy redundant IF needed) |
| S3 — Billing | `backend/services/billing/billing-management.service.ts` (only), `backend/services/billing/billing-management.service.test.ts` (new) |
| S4 — Payment | `backend/services/payment-method/payment-method.service.ts`, `backend/services/payment-method/payment-method.service.test.ts` (new) |
| S5 — Classes | `backend/services/session/class-session.service.ts`, `backend/services/schedule/recurring-class.service.ts`, `backend/services/schedule/schedule-deletion.service.ts`, `backend/services/session/class-instance-expiry.service.ts`, `backend/db/repo/scheduling/scheduling-queries.repository.helpers.ts` (new helper), `backend/db/repo/scheduling/index.ts` (barrel only — no editing logic), `backend/db/repo/scheduling/scheduling-queries.repository.helpers.test.ts` (new) |
| S6 — Students | `backend/services/student/student-lifecycle.service.ts`, `backend/services/student/student-management.service.ts`, `backend/services/student/student-lifecycle.service.test.ts` (new) |
| S7 — Frontend | `frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes.ts`, `frontend/common/views/dashboard/components/navbar/NotificationPanel.tsx`, `frontend/common/views/dashboard/components/DashboardClientBridge.tsx`, `frontend/common/graphql/sharedDocuments/notifications/notification-alerts.documents.ts`, `backend/graphql/mutation/notifications/mark-notifications-read.mutation.ts` (new), `backend/graphql/mutation/notifications/index.ts` (barrel only), `backend/services/notification/notification-alerts.service.ts` (add `markAlertsRead`), `backend/types/notifications/notification-alerts.types.ts` (only if return type shape changes) |
| S8 — Cron + tests | `app/api/cron/class-reminders/route.ts` (new), `vercel.json` (append entry — do NOT remove the existing FX cron), `backend/db/repo/scheduling/scheduling-queries.repository.findUpcoming.ts` (new), `backend/db/repo/scheduling/index.ts` (barrel only — already shared with S5), `backend/services/notification/class-reminder.service.ts` (new), `backend/services/notification/index.ts` (barrel only — already shared with S2), `backend/services/notification/notification-dispatch.helpers.test.ts` (new prefs-filter test), `scripts/run-test/tests/class-reminders.cron.test.ts` (new idempotency test) |

**Barrel file co-ownership disclaimer**: when two subagents both need to add
exports to the same `index.ts` barrel, the order is S1's enum first,
S2's builders/helpers second, then S8's cron service. If a barrel conflict
arises, subagents report CROSS-FILE DEPENDENCY (§7) instead of racing edits.

**If you need to edit a file you do NOT own**: emit a CROSS-FILE DEPENDENCY
report (§7) and STOP. The orchestrator dispatches a reconciliation subagent.

---

## 2. Imports — what files MAY and MAY NOT bring in

### `backend/services/<domain>/*.service.ts` (wiring subagents S3–S6) MAY import:

1. `@/backend/services/notification/notification-payloads.builders`
   (pure builders — types come back from these function returns)
2. `@/backend/services/notification/notification-dispatch.helpers`
   (the `dispatchWithPreferences` entry point)
3. `@/backend/db/repo` (existing repos, including new helpers from S5/S8)
4. `@/backend/lib` (logger)
5. `@/backend/enum` (NotificationEventType, AppPermission)
6. `@/backend/types` (existing domain types)
7. `@/shared/locale/server-graphql` (getServerTranslations)
8. Anything the file already imports — no need to remove existing imports

### `backend/services/<domain>/*.service.ts` MUST NOT import:

1. `@/backend/services/communication/communication.service.ts`
   `CommunicationService.dispatch` / `dispatchMulti` directly — go through
   `dispatchWithPreferences`
2. `@/backend/db/repo/notifications/notification.repository.ts`
   `NotificationRepository.createDelivery` / `createDeliveriesBatch`
   — same rule, use the helper layer
3. `notistack`, `next-intl`'s `useTranslations`, `enqueueSnackbar`
4. `console.*` — use `logger` from `@/backend/lib`
5. `zod` validators — services do not validate; types come from `@/backend/types`

### `backend/services/notification/*` (subagent S2) MAY import:

1. `@/backend/services/communication/communication.service.ts`
   `CommunicationService.dispatchMulti` — this is the ONLY layer allowed
   to call it directly
2. `@/backend/db/repo/notifications/notification-preferences.repository`
3. `@/backend/db/repo/notifications/notification.repository`
4. `@/backend/types/notifications/communications.types`
5. `@/backend/types/notifications/notificationDeliveries.types`
6. `@/shared/locale/server-graphql`

### `frontend/common/**/*.ts(x)` (subagent S7) MAY import:

1. `@/frontend/common/graphql/generated/gql/graphql-types`
   (codegen-generated enum names)
2. `@/frontend/common/graphql/sharedDocuments/notifications/*`
3. `@apollo/client/react` `useQuery`/`useMutation` (NOT `useLazyQuery`,
   NOT `useSubscription` — project rule)
4. `@/shared/locale/client` — `useAppTranslation`
5. Existing UI primitive imports

### `frontend/common/**/*.ts(x)` MUST NOT import:

1. `@/backend/enum` directly — frontend MUST use the codegen-generated
   enums from `graphql-types.ts`. This is enforced in `backend/enum/AGENTS.md`.
2. `@toolpad/core/useNotifications` inside `NotificationPanel.tsx` —
   the panel only emits mutations, it doesn't show toasts. Toasts are the
   ViewModel's concern.
3. `console.*` — use `logger` from `@/frontend/utils/logger` if needed.

---

## 3. The Sixteen Forbidden Patterns (auto-checked by Wave 2)

Each subagent MUST self-check these grep predicates against its touched
files before reporting completion.

| ID | Pattern forbidden | Self-check grep |
|---|---|---|
| **F1** | `CommunicationService.dispatch(` inside a domain service (not in `backend/services/notification/` or `backend/services/communication/`) | `rg -n "CommunicationService\.(dispatch\|dispatchMulti)\("` `backend/services/billing backend/services/payment-method backend/services/session backend/services/schedule backend/services/student` → 0 |
| **F2** | `NotificationRepository.createDelivery` or `createDeliveriesBatch` inside a domain service (not in `backend/services/notification/` or `backend/services/communication/` or existing `backend/services/group-class/group-class.service.ts` legacy call) | `rg -n "NotificationRepository\.(createDelivery\|createDeliveriesBatch)\("` `backend/services/billing backend/services/payment-method backend/services/session backend/services/schedule backend/services/student` → 0 |
| **F3** | Hardcoded English string literals as notification `title`/`body` (inside a payload builder or service call site) | `rg -n 'title:\s*"[A-Z][^"]+"' \` `rg -n 'body:\s*"[A-Z][^"]+"' \` inside the new files → only inside `shared/locale/notifications/` |
| **F4** | `console.*` anywhere in touched files | `rg -n "console\\." <touched files>` → 0 |
| **F5** | `next-intl`'s `useTranslations` inside backend services | `rg -n "useTranslations\(" backend/services/` → 0 |
| **F6** | `notistack`/`enqueueSnackbar` imports anywhere touched | `rg -n "notistack\|enqueueSnackbar" <touched>` → 0 |
| **F7** | `useLazyQuery` or `useSubscription` anywhere touched in frontend | `rg -n "useLazyQuery\|useSubscription" <touched>` → 0 |
| **F8** | `import .* from "@/backend/enum"` anywhere in `frontend/` touched files | `rg -n 'from "@/backend/enum' frontend/` → 0 |
| **F9** | Removing an existing `NotificationSyncService.syncUnpaidNotifications(...)` call without keeping an equivalent tray-summary update | `git diff` review — the call can move but not vanish silently |
| **F10** | Editing a file outside the ownership matrix | `git diff --name-only` of the subagent's commits must be a subset of its ownership row in §1 |
| **F11** | Running raw eslint bypassing the lint queue (no longer an issue in practice — `bun run lint` IS the lint queue client now; just don't bypass the queue server) | `rg` of agent actions or shell history — orchestrator restarts the subagent |
| **F12** | `bun sonar-scan` or `bun scripts/sonar-manager.ts` executed by a non-quality-gate subagent | same as F11 |
| **F13** | Removing the existing FX cron entry from `vercel.json` | `git diff vercel.json` review — the FX entry MUST still be present |
| **F14** | Modifying `backend/db/schema/communications/communications.ts` or any DB schema file outside the allowed Drizzle migration generation | this plan does NOT add a new table — it only adds pg-enum values via `bun run db:generate` migration. Hand-editing schema = violation |
| **F15** | Direct `case "EMAIL":` / `case "SMS":` literal strings in payload builders — use `NotificationChannel.EMAIL` etc. from the enum | `rg -n 'case "(EMAIL\|SMS\|PUSH\|ON_APP)"' <touched>` → 0 |
| **F16** | Hardcoded user IDs in any dispatch call | `rg -n 'userId:\s*"[a-f0-9]{20,}"' <touched>` → 0 |

The escape hatch is a comment on the offending line:

| Comment | Permitted only when |
|---|---|
| `// LEGACY grandfathered: group-class resendManual` | ONLY for the existing `GroupClassService.resendNotifications` call at `backend/services/group-class/group-class.service.ts:188` |
| `// NOTIFICATION-SPEC: <reason>` | Any other deviation; Wave 2's auditor reviews each one |

Comment clauses MUST be on the line immediately above the offending
declaration. Wave 2's auditor greps over adjacent lines.

---

## 4. Type discipline — single canonical contract per concept

For every dispatch shape there is exactly ONE `*Payloads` type, built by
the corresponding builder in `notification-payloads.builders.ts`:

```typescript
// backend/services/notification/notification-payloads.builders.ts
export function buildInvoiceGeneratedPayloads(
  parentUserId: string,
  invoice: InvoiceSelectType,
  locale?: string
): CommunicationPayload[];
```

Subagents MUST NOT:

1. Inline `CommunicationPayload` objects inside service files.
2. Declare ad-hoc `InvoiceNotificationPayload` types — the builder's
   return type is the canonical shape.
3. Add new fields to `CommunicationPayload` (in
   `backend/types/notifications/communications.types.ts`) — this plan
   reuses the existing shape.

If a builder's signature does not fit a dispatch call site, the subagent
reports a CROSS-FILE DEPENDENCY against the builder file (owned by S2).
Do NOT extend the builder's signature from outside S2's scope.

### 4.1 Event types — single source of truth

`backend/enum/notifications/notificationDeliveries.enum.ts` is the SOLE
source. Pothos registers it once. Frontend consumes via codegen. NO
duplicate enum anywhere.

The full new enum membership after Wave 0:

```
EXISTING (8): CLASS_REMINDER, INVOICE_GENERATED, COMPLAINT_RESPONSE,
PAYMENT_METHOD_CHANGED, NEW_COMPLAINT, NEW_SUGGESTION,
SUGGESTION_ACKNOWLEDGED, SUGGESTION_DUPLICATE_MARKED

NEW (14): INVOICE_STATUS_CHANGED, CLASS_SCHEDULED, CLASS_ACTIVATED,
CLASS_STARTED, CLASS_COMPLETED, CLASS_MARKED_ABSENT, CLASS_MARKED_MISSED,
CLASS_LEAVE_REQUESTED, CLASS_RESCHEDULED, CLASS_CANCELLED, CLASS_RESET,
STUDENT_TEACHER_REASSIGNED, STUDENT_STATUS_CHANGED,
STUDENT_QUOTA_OVERRIDDEN

TOTAL: 22 event types × 4 channels = 88 preference cells
```

### 4.2 Prefs assertion update

`backend/services/notification/notification-preferences.service.test.ts`
currently asserts `channelCount * eventCount === 32`. After Wave 0 it
MUST assert `=== 88` (`4 × 22`). The
`NotificationPreferencesService.mergeWithDefaults` logic must continue to
lazily fill missing preference rows as `enabled: true` for all 22 events
on all 4 channels.

---

## 5. Builder + helper discipline (subagent S2)

### 5.1 Builders are PURE

`notification-payloads.builders.ts` exports functions that are:

- **Pure**: no I/O, no DB, no logger, no side-effects.
- **Localized**: take an optional `locale?: string` and call
  `getServerTranslations(locale ?? "en", "notifications")` to derive
  `title` and `body`. Always return a ready-to-dispatch
  `CommunicationPayload[]` array containing entries for all 4 channels
  (`on_app`, `email`, `sms`, `push`); the `dispatchWithPreferences`
  helper will filter out channels the user has opted out of.
- **Idempotent**: same inputs → same outputs.

Builder function listing (full contract — S2 implements exactly this):

| Function | Args | Returns | Channels included |
|---|---|---|---|
| `buildInvoiceGeneratedPayloads` | `parentUserId, invoice: InvoiceSelectType, locale?` | `CommunicationPayload[]` | all 4 |
| `buildInvoiceStatusChangedPayloads` | `parentUserId, action: "proofSubmitted" \| "proofApproved" \| "proofRejected" \| "markedPaid", invoice, locale?` | `CommunicationPayload[]` | all 4 |
| `buildPaymentMethodChangedPayloads` | `userId, action: "created" \| "updated" \| "deleted" \| "setDefault" \| "verified", locale?, metadata?` | `CommunicationPayload[]` | all 4 |
| `buildClassLifecyclePayloads` | `classInstance: ClassInstanceSelectType, eventType: NotificationEventType, affectedUserIds: string[], locale?, metadata?` | `CommunicationPayload[]` | all 4 |
| `buildStudentLifecyclePayloads` | `studentId, eventType: NotificationEventType, affectedUserIds: string[], locale?, metadata?` | `CommunicationPayload[]` | all 4 |

Per-action channel restrictions (from the plan) are applied INSIDE
`dispatchWithPreferences` via a single `eventChannelAllowlist: Map<eventType, NotificationChannel[]>` export
(also owned by S2). For example:

```typescript
export const EVENT_CHANNEL_ALLOWLIST: Partial<Record<NotificationEventType, NotificationChannel[]>> = {
  [NotificationEventType.CLASS_SCHEDULED]: [NotificationChannel.ON_APP, NotificationChannel.EMAIL],
  [NotificationEventType.CLASS_ACTIVATED]: [NotificationChannel.ON_APP, NotificationChannel.PUSH],
  // etc per the plan's per-action channel matrix
};
```

If `dispatchWithPreferences` sees an event in the allowlist, it filters
payloads to those channels BEFORE consulting user prefs. If absent
from the allowlist, all 4 channels are considered.

### 5.2 `dispatchWithPreferences` contract

```typescript
export async function dispatchWithPreferences(
  payloads: CommunicationPayload[],
  affectedUserIds: string[],
  locale?: string
): Promise<ChannelDispatchResult[]>;
```

Algorithm:

1. If `payloads.length === 0` or `affectedUserIds.length === 0`, return `[]`.
2. Read the `EVENT_CHANNEL_ALLOWLIST` and reduce `payloads` to the
   allowed channels (per `payload.eventType`).
3. For each `userId` in `affectedUserIds`:
   a. Fetch prefs via `NotificationPreferencesRepository.getByUserId(userId)`.
   b. For each `payload` in the allowed payload list, check whether the
      pair `(payload.channel, payload.eventType)` is `enabled: false`
      in the user's prefs map. If disabled, skip.
   c. Collect surviving payloads, call `CommunicationService.dispatchMulti`
      with the union across users.
4. Log dispatch stats (success / failure / skipped-by-pref counts) via
   `logger.info` from `@/backend/lib`.
5. Return the per-channel result list.

The helper MUST catch errors per-user so a single user's failed fetch
does NOT poison the dispatch for others. Log the user-fetch error and
fall back to "all channels enabled" semantics for that user (safer:
over-notifies rather than under-notifies).

---

## 6. Translation namespace discipline (subagent S2 owns `shared/locale/notifications/`)

Per `shared/AGENTS.md`, compile-time i18n files live per locale. The
new `shared/locale/notifications/` namespace MUST:

1. Have a TypeScript type-schema file declaring all keys once:
   `shared/locale/notifications/notifications.types.ts` — export interface
   with `title: string` and `body: (...) => string` per event-action
   combination from §5.1 above.
2. Have one implementation per locale (e.g. `en.ts`, `ar.ts`) — the
   project uses locale codes that match existing locales; check
   `shared/locale/` for the precise directory layout before adding.
3. Export through `shared/locale/notifications/index.ts`.
4. Backend reads via `getServerTranslations(locale, "notifications")`
   from `@/shared/locale/server-graphql`.

Hardcoded English in builders is forbidden (F3). The builder file
imports the typed translation functions and calls them with parameters
inserted via template literals.

---

## 7. CROSS-FILE DEPENDENCY — the report shape

If a subagent needs to fix something outside its assigned file set, it
MUST NOT modify the un-assigned file. It MUST emit:

```
CROSS-FILE DEPENDENCY:
  Target file: <this file path>
  Blocked by: <other file path that needs changes>
  Rule violated: <F<n> from §3, or the exact rule name from §4/§5/§6>
  Required fix: <concrete description of the edits the other file needs>
  Severity: <BLOCKING | NON-BLOCKING>
```

The orchestrator collects these and dispatches a Wave 2 reconciliation
subagent. A subagent that silently edits out-of-scope files is a
contract violation — Wave 2's `git diff --stat` cross-check will catch
it (F10).

### Common cross-file cases to expect (don't try to "be helpful" by
editing them):

- Wave 1 S5's new `SchedulingRepository.getClassInstanceAffectedUsers`
  helper is needed by S8's cron service. S5 owns it; S8 imports it. If
  the import fails because S5 hasn't merged, S8 reports CROSS-FILE
  DEPENDENCY (BLOCKING) and waits.
- Wave 1 S2's `dispatchWithPreferences` and builders are needed by S3-S6,
  S8. S2 owns them. If the imports fail because S2 hasn't merged, the
  consumer reports CROSS-FILE DEPENDENCY (BLOCKING) and waits.
- Wave 0 S1's enum expansion is needed by every Wave 1 subagent. This is
  why Wave 0 runs sequentially first.

---

## 8. Lint queue server — non-negotiable

The orchestrator starts the lint queue server ONCE before Wave 1:

```bash
~/.bun/bin/bun run scripts/lint-queue-server.ts    # listens on 4777
```

Every Wave 1 subagent MUST use the client:

```bash
curl -s -X POST http://localhost:4777/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"<unique-id-string>","files":["<path1>","<path2>"]}'
```

Response: `{ success: boolean, output: string, exitCode: number }`.
Blocks until the lint run on those files completes (server serializes).

**Use `bun run lint` or `bun lint` freely** — `bun run lint` IS the lint queue client (it calls `requestFullRepoLint` from `scripts/lint-queue-client.ts` and serializes through the queue server on port 4777). (F11 now covers only raw eslint invocations that bypass the queue.)

### Per-file verification order (progressive enforcement)

For each file modified/created, run sequentially via
`bun run scripts/health/sub-loop.ts <file> --lifecycle <stage>`:

| `--lifecycle` | Checks run (in order) |
|---|---|
| `tsgo` | `bun tsgo` only |
| `biome` | tsgo → `bun biome:check` |
| `lint` | tsgo → biome → lint-queue-client |
| `codescene` | tsgo → biome → lint-queue → `codescene --file` |

Start at the lowest relevant lifecycle and short-circuit at first
failure. Don't run later stages until earlier stages pass.

### Health check the queue

```bash
curl -s http://localhost:4777/status    # { running: true, queueLength: N }
```

If `running: false` or connection refused — STOP and report as a
CROSS-FILE DEPENDENCY targeting "lint-queue-server".

---

## 9. Pre-flight every subagent does (before its first edit)

1. **Read this `specs.md` in full** via the Read tool (file path
   `/home/ahmed/Projects/siraj/specs.md`).
2. **Read the layer-AGENTS.md files** that apply to its slice:
   - Files under `backend/services/` → `backend/services/AGENTS.md` +
     `backend/AGENTS.md`
   - Files under `backend/enum/` → `backend/enum/AGENTS.md` +
     `backend/AGENTS.md` (S1 only)
   - Files under `backend/db/repo/` → `backend/db/repo/AGENTS.md` +
     `backend/AGENTS.md` (S5, S8)
   - Files under `backend/graphql/` → `backend/graphql/AGENTS.md` +
     `backend/AGENTS.md` (S1, S7)
   - Files under `backend/types/` → `backend/types/AGENTS.md` +
     `backend/AGENTS.md`
   - Files under `frontend/common/` → `frontend/AGENTS.md` (S7)
   - Files under `frontend/common/graphql/sharedDocuments/` → that
     folder's AGENTS.md as well (S7)
   - Files under `app/api/` → `app/AGENTS.md` (S8)
   - Files under `shared/locale/` → `shared/AGENTS.md` (S2)
3. **Read the instruction files** (`.github/instructions/*.instructions.md`)
   that match its file path:
   - `backend/**` → `backend.instructions.md`
   - `frontend/**` → `frontend.instructions.md`
   - `**/*.test.ts(x)` or path patterns matching tests.instructions.md
     → `tests.instructions.md`
4. **Grep existing words before declaring new ones**: e.g. before creating
   a new builder function name, `rg "buildInvoiceGeneratedPayloads"`
   to ensure no duplicate exists.
5. **Grep-check the slice files** against each of F1-F16 BEFORE editing
   — so you already know the existing baseline; you won't accidentally
   pass through unchanged violations.

Skip step 1 only if your previous Read of `specs.md` was within the same
fix-loop round (≤3 rounds — re-read after the loop). Otherwise: ALWAYS
re-read.

---

## 10. Per-fix-loop-round re-verification

After each round of fixes (max 3 rounds per subagent per file):

1. Re-read `specs.md` section 3 (the 16 forbidden patterns). The list
   drifts in your head otherwise.
2. Re-run the relevant grep checks (F1-F16) on the touched files.
3. If the grep returns violations, emit another fix-loop round.
4. On round 3 with remaining violations, STOP and report PARTIAL with
   CROSS-FILE DEPENDENCIES explaining the residual violations.

---

## 11. Reporting format — every subagent's final message

```
SUBAGENT <id-or-name> — <PASS | PARTIAL | FAIL>

Files changed (this subagent's edits — `git diff --name-only` from the
workspace root is the authoritative list):
- <path> — <action: created | modified | deleted | repointed-imports>

Enum additions (S1 only):
- backend/enum/notifications/notificationDeliveries.enum.ts — added: [ ... ]

New files created (any subagent):
- <path> — purpose (one line)

Builder additions (S2 only):
- notification-payloads.builders.ts — functions: [ ... ]
- notification-dispatch.helpers.ts — exports: [ ... ]
- shared/locale/notifications/ — locales: [ ... ]
- EVENT_CHANNEL_ALLOWLIST — entries: [ ... ]

Dispatch sites added (S3-S6, S8):
- backend/services/.../<file>.ts:<line> — <functionName> -> <eventType> -> channels [<list>]

CROSS-FILE DEPENDENCIES (blockers requiring orchestrator reconciliation):
- Target: <path> | Blocked by: <path> | Rule: <F<n> or section> | Required
  fix: <description> | Severity: <BLOCKING/NON-BLOCKING>

Acceptance criteria LOCAL checks (the 16 greps you ran on your touched files):
- F1: PASS — evidence "rg output: 0 lines"
- F2: PASS — evidence "..."
- ... (every F that applies to your scope; the rest as N/A: not-in-scope)

Per-file sub-loop.ts verification results:
- <file> — lifecycle lint — exit code 0
```

Wave 2 collects this format and feeds the final acceptance dashboard.

---

## 12. The orchestrator's contract with subagents (reciprocal)

The orchestrator:

- Will NOT edit files itself during the wave (only pre-flights, dispatches,
  reconciles the cross-file-log, runs the auditor).
- Will include this file's ABSOLUTE path
  (`/home/ahmed/Projects/siraj/specs.md`) in every Task prompt it sends,
  with the line: `Read /home/ahmed/Projects/siraj/specs.md in full before
  your first action. It is binding on every nesting level.`
- Will pass this file as `file_attachments: ["specs.md"]` to every Task
  invocation.
- Will NOT paraphrase or summarize this file; subagents read the original.
- Will re-include `specs.md` in fix-round retries and Wave 2 prompts
  (the file may have been updated since the last read).

Main subagents:

- Pass this file's path down to ANY nested subagents they spawn in the
  same manner.
- Embedded nested-subagent prompt template MUST contain the line:
  `Read /home/ahmed/Projects/siraj/specs.md in full. It binds you equally.`
- For the Task tool, pass `file_attachments: ["specs.md"]` (relative
  path from the workspace root) on every nested dispatch.

Fix-round nested subagents:

- Receive the same instructions as initial nested subagents.

Wave 2 reconciliation subagents:

- Same — additionally the orchestrator tells them exactly which dependency
  they're unblocking, so they can read `specs.md` §6/§4 against the
  specific contract.

---

## 13. One-page reminder (PASTE this at the top of every subagent prompt)

> **specs.md summary card** — you are bound by `/home/ahmed/Projects/siraj/specs.md`.
> Read it. Three top rules: (1) every dispatch goes through
> `dispatchWithPreferences` from
> `@/backend/services/notification/notification-dispatch.helpers.ts`,
> (2) every payload is built by a pure builder from
> `notification-payloads.builders.ts`, (3) every user-facing string goes
> through the `shared/locale/notifications/` i18n namespace.
> Sixteen forbidden patterns F1-F16 self-check via `rg` before reporting.
> Hardcoded `"Invoice created"` strings = F3 violation.
> `CommunicationService.dispatch(` in a domain service = F1 violation.
> `console.log` anywhere = F4 violation. Raw eslint bypassing the queue = F11.
> Stick to your ownership matrix from §1. Use the lint queue client on
> port 4777. Per-file verify via
> `bun run scripts/health/sub-loop.ts <file> --lifecycle lint`.
> Emit CROSS-FILE DEPENDENCY entries (§7 format) when blocked. Cap fix
> loops at 3 rounds. Rate `PASS/PARTIAL/FAIL` with the canonical report
> format from §11. Don't drift. Don't be helpful by editing files you
> don't own.
