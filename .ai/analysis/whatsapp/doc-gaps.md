# Doc Gaps — Features/patterns in plans but missing from canonical docs
# (Canonical docs should be updated)

Each finding: feature/pattern; where in plan; what docs are missing; severity.

---

## DG1 — [MAJOR] Q6 spec code is declared in the doc's prefix table but
is never explained anywhere in `docs/services/whatsapp-cloud-api.md`

**Plan says:**
- `specs.md:406` — applied findings only up to Q5.
- `implementation.md`, `trackable-tasks.md` Review-Finding Traceability
  (lines 430-458) — Q6 is never referenced.

**Docs say:**
- `docs/services/whatsapp-cloud-api.md:28` — "| **Q1–Q6** | Quality |"
  declares Q1-Q6 as the Quality tier.
- `docs/services/whatsapp-cloud-api.md:67-70` — Only **Q4** (Tier Budget
  Accounting) and **Q5** (Raw Tier Enum Verbatim) are individually
  documented. **Q1, Q2, Q3, Q6** never appear in the doc body.

**Recommendation:**
Either (a) drop the Q1-Q6 range to Q1-Q5 in the prefix table to match
the plan's traceability and the doc body's coverage, or (b) add a "Q6"
section explaining what Q6 represents. Given the plan never references
Q6 and the skill-improvement retrospective doesn't either, (a) is
preferred unless someone can retrieve what Q6 was meant to be.

---

## DG2 — [MAJOR] Canonical backend doc missing the "deprecated Meta
field names" gotcha for `phone_number_quality_update`

**Plan says:**
- `specs.md:156` (REQ-5.6) — "WHEN webhook is `phone_number_quality_update`
  THEN Siraj SHALL read `max_daily_conversations_per_business` (not
  deprecated `old_limit`/`current_limit`) and update
  `portfolioMessagingLimitTier`".
- `specs.md:390` (Glossary) — "Surfaced via
  `max_daily_conversations_per_business` /
  `whatsapp_business_manager_messaging_limit` fields."
- `implementation.md:403` (event table) — "phone_number_quality_update →
  Update account `portfolioMessagingLimitTier` from
  `max_daily_conversations_per_business` (not deprecated fields)".
- `trackable-tasks.md:200` — same.

**Docs say:**
- `docs/services/whatsapp-cloud-api.md:156` — only "Handler processes by
  `field`: … `phone_number_quality_update` (Q5)," with no field-name
  detail.
- `docs/services/whatsapp-cloud-api.md:100` — lists the **enum values**
  but not the source field name.

**Recommendation:**
Add to `whatsapp-cloud-api.md` Webhook section (§9) a one-liner:
"`phone_number_quality_update`: read
`max_daily_conversations_per_business` (deprecated:
`old_limit`/`current_limit`)".

---

## DG3 — [MINOR] Canonical backend doc missing explicit H1/H2 webhook
HTTP status code table

**Plan says:**
- `implementation.md:366-373` — GET (log only, return 403), POST (401 on
  HMAC mismatch, 404 on `body.object !== whatapp_business_account`).

**Docs say:**
- `docs/services/whatsapp-cloud-api.md:154-164` — Same status codes are
  embedded in prose: "401 on HMAC mismatch, 400 on invalid JSON, 404 on
  `body.object !== \"whatsapp_business_account\"`." — but no GET code
  stated.

**Recommendation:**
Add an explicit two-column table (HTTP branch | Status Code | Trigger)
to `whatsapp-cloud-api.md` §9 so reviewers don't have to read through
prose.

---

## DG4 — [MAJOR] Canonical UI doc misses the "ALL 20-task plan" was
actually 20 tasks; backend plan's Webhook section Task 12-13 cross-ref
mismatch

**Plan says:**
- `outcome/research-specs-gaps.md:27` (UI research) — "Q10 Mobile UX:
  explicit intent: mobile = read-only dashboard."
- Many references throughout ui-spec to "Q10/Q11" as parent plan codes.

**Docs say:**
- `docs/frontend/whatsapp-ui-patterns.md:1-3` says "20-task WhatsApp UI
  improvement implementation" — implicitly acknowledging the ui-spec
  sequence.
- But `docs/frontend/whatsapp-ui-patterns.md` does not list Q10/Q11 —
  only refers to "20 tasks" generically.

**Recommendation:**
The "Missed Backend Resolvers" section of `whatsapp-ui-patterns.md:171`
implies the ui-spec ran into planned-but-not-shipped queries. Add a
briefly-numbered "Plan Debt" or "Deferred parent-plan items" section
that itemizes the parent plan's tasks 26.3-26.6 (Numbers opt-in table,
bulk actions, audit trail — explicitly deferred in the parent
`trackable-tasks.md:325-328` marked `[~]`) so the deferred work isn't
lost between plan and doc.

---

## DG5 — [INFO] Canonical backend doc doesn't reference the parent plan's
r3-comprehensive-review HIGH findings (TOCTOU race, dead upsert)

**Plan / outcome says:**
- `r3-comprehensive-review.md:14-22` — 2 HIGH findings (TOCTOU race in
  `notification.repository.ts:346-394`; `handleMessagesStatus` never
  passes userId/channel/eventType, making INSERT upsert dead code).
- `r3-comprehensive-review.md:48-51` — "Fixed: 0 / 23; Remaining: 23".

**Docs say:**
- `docs/services/whatsapp-cloud-api.md` (entire file) — does not mention
  either HIGH finding nor the fact that 23 review findings remain
  unfixed.

**Recommendation:**
Add a "Known Open Issues" section to `whatsapp-cloud-api.md` listing
the two HIGH r3 findings, so any consumer of the doc understands what
is *known but unresolved*. Otherwise the doc gives a misleading
"this is canonical / done" impression.

---

## DG6 — [INFO] Canonical UI doc's hook listing (10 sub-hooks) omitted
`useWhatsappCreateHandler` is mentioned as a sub-hook in the plan but
doc enumerates "10 sub-hooks"; verify count

**Plan / outcome says:**
- `ui-spec/implementation.md:268-293` describes the ViewModel as
  "decomposed into sub-hooks" with a list —
  `useWhatsappQueries`, `useWhatsappMutations`, `useDerivedWhatsappData`,
  `useWhatsappDialogs`, `useWhatsappSnackbar`, `useWhatsappCreateHandler`,
  `useWhatsappUpdateDeleteHandlers`, `useWhatsappUtilityHandlers`,
  `useWhatsappLabels`, `useRefetchers`. **= 10 sub-hooks.**

**Docs say:**
- `docs/frontend/whatsapp-ui-patterns.md:32-45` — enumerates:
  `useWhatsappQueries`, `useWhatsappMutations`, `useDerivedWhatsappData`,
  `useWhatsappDialogs`, `useWhatsappSnackbar`, `useWhatsappCreateHandler`,
  `useWhatsappUpdateDeleteHandlers`, `useWhatsappUtilityHandlers`,
  `useWhatsappLabels`, `useRefetchers`. = **10 sub-hooks** — **MATCHES**.

**Conclusion:** Verified consistent; no doc gap. LGTM.

---

## DG7 — [MINOR] Backend doc lacks explicit mention of the parent plan's
12-review-cycle history

**Plan says:**
- `outcome/whatsapp-implementation-skill-improvement-outcome.md:159-220` —
  R1-R12 review-cycle analysis, with finding counts (e.g. R3: 23 / 2 HIGH;
  R4: ~90 / 12 CRIT; R11: ~210 / 7 CRIT).
- `outcome/whatsapp-implementation-skill-improvement-outcome.md:24-29` —
  Final commit `62c4ac915`, 194 files.

**Docs say:**
- `docs/services/whatsapp-cloud-api.md:1-3` — claims to consolidate
  "patterns, rules, and gotchas from the WhatsApp Cloud API integration
  (Tasks 1–29)" — note: Tasks 1-**29**, but plan summary declares
  completion of all 30 tasks
  (`trackable-tasks.md:406` "Total 30 / 30 / 100%").

**Why it matters:**
The doc's scope statement names Tasks 1-29 while Knowledge Propagation
is Task 30 — likely deliberate but worth a one-line note: "Task 30
(knowledge propagation) produced this doc; tasks cited are 1-29." Minor.

**Recommendation:** Update header subtitle to "Tasks 1-29 (knowledge
propagation is Task 30)".
```

---
