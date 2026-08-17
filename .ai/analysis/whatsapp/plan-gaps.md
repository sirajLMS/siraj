# Plan Gaps — Patterns documented in canonical docs that the plans
# do not reflect (Plans should be updated)

Each finding: pattern in docs; where in docs; what plan misses; severity.

---

## PG1 — [MAJOR] Parent plan declares "No `whatsapp_templates` table in v1"
but ui-spec's UI-REQ-2 calls for a "persisted templates query"

**Docs say:**
- `docs/services/whatsapp-cloud-api.md:155` (Key Design Decisions table,
  plan reference implementation.md:155) — "No `whatsapp_templates` table
  in v1 — Templates authored in WhatsApp Manager; webhook events → audit
  log only". (Cross-reference: parent `implementation.md:155`.)
- `docs/frontend/whatsapp-ui-patterns.md:171-176` — "`whatsappTemplates`
  query: Does NOT exist. GraphQL document is a commented-out stub.
  Templates come from `syncWhatsappAccountsFromMeta` mutation result."

**Parent plan says:**
- `implementation.md:155` — "No `whatsapp_templates` table in v1".
- `trackable-tasks.md:318` — Task 25 "Sync Templates button →
  `syncTemplates` mutation". This implicitly relies on sync-mutation-result
  template snapshots.

**ui-spec plan says:**
- `ui-spec/specs.md:82-88` (UI-REQ-2 acceptance criteria) — "WHEN admin
  navigates to the Templates tab THEN system SHALL **query persisted
  templates from the server** (not rely on sync mutation result only)"
  — directly contradicts the canonical doc.
- `ui-spec/specs.md:93` — Dependencies declare a
  `WhatsappTemplatesQueryDocument` GraphQL document as "New" — i.e., the
  spec contemplates backend schema work the parent plan defers.

**Why it matters:**
The ui-spec's UI-REQ-2 is unsatisfiable without backend changes that
the parent plan forbids. The canonical doc records this precisely.
Plan should adopt the doc's stub pattern (front-end reads sync mutation
result; backend resolver is a follow-up) or escalate the parent plan
scope.

---

## PG2 — [MAJOR] Canonical UI doc `whatsapp-ui-patterns.md` reports the
actual implementation pattern for `whatsappStatusBadge` (syncStatus
category, no new category added); ui-spec plan still contemplates a
new `StatusBadge` WhatsApp category

**Docs say:**
- `docs/frontend/whatsapp-ui-patterns.md:85-89` — "`syncStatus` category
  reused (**no new `StatusBadgeCategory` added**). `WHATSAPP_TEMPLATE_STATUS_BADGE`
  maps all 6 `WhatsappTemplateStatus` values to `syncStatus` + semantic
  keys."
- `docs/frontend/whatsapp-ui-patterns.md:194-196` —
  "WhatsappTemplateSnapshot … `body` and `buttonStructure` do NOT exist
  on this type."

**ui-spec plan says:**
- `ui-spec/implementation.md:564-578` — `whatsappTemplateStatusConfig`
  and `whatsappAccountStatusConfig` are defined as
  `Record<string, StatusBadgeCategory>` (status config) — but the doc
  says only `syncStatus` was reused; the plan's separate
  `whatsappAccountStatusConfig` with `CONNECTED/PENDING/DISCONNECTED/ERROR`
  is fabricated against an enum that doesn't exist
  (`whatsapp-ui-patterns.md:87-89`: `getWhatsappAccountStatusBadgeConfig(isActive)`
  — **boolean**, not CONNECTED/PENDING strings).
- `ui-spec/implementation.md:398-403` — TemplatesTabContent target data
  flow queries `body`, `buttonStructure` from `whatsappTemplates` — but
  the docs say `body`/`buttonStructure` do not exist on
  `WhatsappTemplateSnapshot` (`whatsapp-ui-patterns.md:194-196`).

**Why it matters:**
The ui-spec plan author invented `CONNECTED/PENDING/DISCONNECTED/ERROR`
template account statuses that the canonical doc explicitly says aren't
used. The codebase WordCount reality (boolean `isActive`) is in the doc
but absent from the plan. A fresh executing agent reading only the plan
would build a fictional type.

---

## PG3 — [MAJOR] Canonical UI doc records specific i18n label helper
filenames (`whatsappQualityLabel.ts`, `whatsappTierLabel.ts`,
`whatsappTemplateStatusLabels.ts`, `whatsappThroughputLabel.ts`); the
ui-spec plan only creates the first three and the missing 4th is
documented in the canonical doc

**Docs say:**
- `docs/frontend/whatsapp-ui-patterns.md:107-115` — label helpers table:
  `getQualityLabelKey`, `getTierLabelKey`, `getTemplateStatusLabelKey`,
  `getThroughputLabelKey` — **4 helpers**, including
  `WhatsappThroughputLevel`.

**ui-spec plan says:**
- `ui-spec/specs.md:113` — implementation creates the 3 first label
  helpers (path matches). The 4th helper `getThroughputLabelKey` is in
  `trackable-tasks.md` task 11 outcome (`11-i18n-localization-outcome.md`
  line 22-27 creates `whatsappThroughputLabel.ts`).

**Conclusion:**
The throughput helper IS created by task 11 — but the **plan** trackable
tasks in `ui-spec/trackable-tasks.md:244-352` (task 11 description) does
NOT mention creating `whatsappThroughputLabel.ts`. The actual outcome
file `11-i18n-localization-outcome.md:22-27` declares it, contradicting
the plan task description. INFO/MAJOR boundary: canonical doc is
correct and matches outcome; the *plan* is gapping the doc.

**Why it matters:**
A re-execution of task 11 from the plan source would invent a different
shape than task 11's actual outcome produced. The plan should mention
the `whatsappThroughputLabel.ts` helper at task 11.

---

## PG4 — [MAJOR] Canonical UI doc records Consumer-Component testing
pattern (renderHook unavailable in bun:test); ui-spec plan tasks 18, 19
still narrate the unavailable `renderHook`-equivalent approach without
the consumer-component pattern

**Docs say:**
- `docs/frontend/whatsapp-ui-patterns.md:149-167` — Consumer-component
  pattern; `vmRef`; `MockLink`; `renderWithWrapper`; `baseMocks()`.
- `docs/frontend/whatsapp-ui-patterns.md:206-211` — must use
  consumer-pattern instead of `renderHook`.
- `docs/frontend/whatsapp-ui-patterns.md:209-210` — MockLink variable
  matching "including nulls".
- `docs/frontend/whatsapp-ui-patterns.md:210` —
  `toggleOptInAction` uses `source: "graphql"` (not "settings" / "manual").

**ui-spec plan says:**
- `ui-spec/trackable-tasks.md:353-358` — Task 18 includes the line
  "Since `renderHook` is unavailable in `bun:test`, use a
  consumer-component pattern" — **acknowledges** the pattern.
- `ui-spec/trackable-tasks.md:354-361` — Task 19 references
  `renderWithWrapper` and `MockLink`.

**Why it matters:** Mostly consistent — the plan captures the doc's
gotcha. **However**, the canonical doc's gotcha `toggleOptInAction`
uses `source: "graphql"` (`whatsapp-ui-patterns.md:210`) is **not**
mentioned anywhere in the ui-spec plan or specs.md — neither in UI-REQ
nor in tasks. A fresh agent implementing UI-REQ-6 history may pick the
wrong source value without canonical-doc awareness.

---

## PG5 — [MAJOR] Canonical UI doc records the `WhatsappConfigTab` type
re-exported from `whatsappConfig.constants.ts` (`"numbers" | "templates" |
"optin"`); ui-spec plan uses `"opt-in"` (with hyphen) in some places

**Docs say:**
- `docs/frontend/whatsapp-ui-patterns.md:24-27` — "Tab IDs allowlist:
  `WhatsappConfigTab` type (`\"numbers\" | \"templates\" | \"optin\"`)
  is re-exported from `whatsappConfig.constants.ts`."

**ui-spec plan says:**
- `ui-spec/specs.md:124` — "WHEN user navigates to `/settings/whatsapp?tab=optin`"
  — uses `optin`.
- `ui-spec/implementation.md:372` — `params.set("tab", tab)` (no explicit
  value here).
- `ui-spec/implementation.md:393-403` — Sample tab IDs assume the
  canonical 3.

**Conclusion:** Match is consistent. INFO only. Verified on 2026-08-17.

Why it matters: Documentation alignment is fine.

---

## PG6 — [INFO] Plan tasks 13.4 + 13.5 list all four template lifecycle
events; canonical doc NEW consolidates them as "`message_template_status_update`
(R6, audit-only)"

**Plan says:**
- `specs.md:155` (REQ-5.5) — four lifecycle event types:
  `message_template_status_update`, `template_category_update`,
  `message_template_quality_update`, `message_template_components_update`.
- `trackable-tasks.md:199` (Task 13.4) — "Four template lifecycle events
  → audit log only".
- `implementation.md:398-404` — event table lists all four separately.

**Docs say:**
- `docs/services/whatsapp-cloud-api.md:164` — "Handler processes by
  `field`: `message_template_status_update` (R6, audit-only)" — only the
  first event is named explicitly; the doc condenses the four events
  named in `whatsapp-cloud-api.md:152-164`.

**Why it matters:** Doc says "`message_template_status_update` (R6,
audit-only)" — the doc appears to have collapsed the four events into
one field name as if Meta drives them all under one `field`
identifier. If the plan's four-event breakdown is correct (which matches
Meta's documented Cloud API webhook fields), then the doc is
under-documenting four fields as one. Either way, the discrepancy
needs reconciliation. Likely a doc gap (DG) more than a plan gap — but
could affect re-execution if an agent blindly follows the canonical doc.

---

## PG7 — [MAJOR] Canonical UI doc's `MobileCardList Suspense` testing
gotcha is not reflected in the ui-spec test plan tasks

**Docs say:**
- `docs/frontend/whatsapp-ui-patterns.md:165-167` — "MobileCardList
  Suspense: Uses `next/dynamic` → tests need `findByText`/`waitFor`,
  not synchronous `getByText`." and "GenericTabNav dynamic import:
  Mock directly with `mock.module` in test files since
  `next-dynamic-mock.ts` doesn't cache it."
- `docs/frontend/whatsapp-ui-patterns.md:166-167` —
  "mockNextNavigation: Called at module scope before tests
  await mockNextNavigation(...)".

**ui-spec plan says:**
- `ui-spec/trackable-tasks.md:361-378` — Task 19 describes "Use
  `renderWithWrapper` from `TestWrapper.tsx` with mocked Apollo `MockLink`".
- The plan **does not** mention the `findByText`/`waitFor` Sync restriction
  for `MobileCardList`, nor does it include `mockNextNavigation` /
  `mock.module` setup.

**Why it matters:** A new agent implementing component tests for mobile
would hit asynchronous Suspense import issues that the doc explicitly
warns about. Plan must reference the doc's testing gotcha section.

---

## PG8 — [INFO] Parent plan tasks 26.3-26.6 explicitly deferred (`[~]`)
in `trackable-tasks.md`; canonical UI doc records this fallback, but
no ui-spec plan row tracks them as "Parent-Plan Deferred"

**Plan says:**
- `trackable-tasks.md:325-328` — Task 26.3-26.6 marked `[~]` with notes
  "deferred to per-user opt-in schema extension (Task 29)".

**Docs say:**
- `docs/frontend/whatsapp-ui-patterns.md:171-176` — "Missing Backend
  Resolvers" implies the UI currently shows placeholder empty arrays
  with TODO comments — i.e., the implementations are stubbed.

**Why it matters:** The r3-comprehensive-review and skill-improvement
outcomes record the parent plan's known rollback (see
`whatsapp-implementation-skill-improvement-outcome.md:96-107` — "Env-config
registration of 3 keys … Never resolved", "`resetWhatsappChannel` cache
completeness … Incomplete until R7"). These **closed-as-still-broken**
deferred items are not surfaced in either canonical doc. INFO only —
worth promoting to a "Plan Debt" section if the project remains active.
```

---
