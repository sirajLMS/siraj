# Concrete Discrepancies — Plan vs. Canonical Documentation

Each finding: file path + line/section; what the plan says; what the doc says;
why it matters. Severity tags: [CRITICAL] [MAJOR] [MINOR] [INFO].

---

## D1 — [CRITICAL] `WHATSAPP_MANAGE` is used throughout the ui-spec plan,
but no such permission exists

**Plan says:**
- `ui-spec/specs.md:76` — "Backend resolvers for create/update already exist
  and are permission-gated with `WHATSAPP_MANAGE`."
- `ui-spec/implementation.md:99` — `RequirePermission permissions={AppPermission.WHATSAPP_MANAGE}` (Numbers tab guard).
- `ui-spec/implementation.md:143` — "All admin-only affordances … MUST be
  wrapped in `<RequirePermission permissions={AppPermission.WHATSAPP_MANAGE}>`."
- `ui-spec/implementation.md:180,199-200,244-247` — Same `WHATSAPP_MANAGE`
  symbol used for Numbers, create account, edit name, delete, edit credentials,
  admin consolidated opt-in view.
- `ui-spec/implementation.md:239-249` route table — Numbers tab `AppPermission.WHATSAPP_MANAGE`.
- `ui-spec/trackable-tasks.md` — multiple `RequirePermission` references
  (see tasks 8, 13, 14 instructions).

**Docs / parent plan / codebase say:**
- `docs/frontend/whatsapp-ui-patterns.md:186-189` —
  "**`AppPermission.WhatsappConfigManage`** (not `WHATSAPP_MANAGE`) … No
  `WHATSAPP_OPT_IN_MANAGE` exists at all."
- Parent plan `specs.md:289`, `implementation.md:325-329` — permission is
  `WHATSAPP_VIEW` / `WHATSAPP_CONFIG_MANAGE` / `WHATSAPP_TEMPLATES_MANAGE`.
- Codebase `backend/enum/permissions/permission.enum.ts` — only three
  `WHATSAPP_*` enums exist: `WHATSAPP_VIEW`, `WHATSAPP_CONFIG_MANAGE`,
  `WHATSAPP_TEMPLATES_MANAGE`. Verified by grep on 2026-08-17.

**Why it matters:**
Any executing agent that mechanically applies the plan code samples would
write `<RequirePermission permissions={AppPermission.WHATSAPP_MANAGE}>` — a
non-existent enum member — and tsgo / codegen would fail. Replacing
`WHATSAPP_MANAGE` with `WHATSAPP_CONFIG_MANAGE` everywhere in this plan is
required for it to be executable as written.

---

## D2 — [CRITICAL] ui-spec plan mandates adding i18n keys for enum values
that do not exist (`TIER_250K`, `TIER_1M`, `ORANGE`)

**Plan says:**
- `ui-spec/trackable-tasks.md:81` — "Add missing i18n keys: `tier100K`,
  `tier250K`, `tier1M`, and `qualityOrange` (no keys exist for these enum
  values — add to type schema + EN + AR locale files; per
  `implementation.md:577-599`)."
- `ui-spec/implementation.md:607-616` — `whatsappTierLabel.ts` helper
  switches on `WhatsappLimitTier.TIER_250K` → "tier250K" and
  `WhatsappLimitTier.TIER_1M` → "tier1M", with comments "NOTE: tier250K
  key does NOT exist yet — must be added".
- `ui-spec/implementation.md:593-595` — `whatsappQualityLabel.ts` includes
  `case WhatsappQualityRating.ORANGE: return "qualityOrange";` with
  comment "NOTE: qualityOrange key does NOT exist yet".
- `ui-spec/specs.md:103` — "WHEN a phone number's tier is
  TIER_1K/TIER_10K/TIER_100K/**TIER_250K/TIER_1M**/unknown THEN system
  SHALL display the corresponding localized label." and `specs.md:102` —
  "quality rating is GREEN/YELLOW/RED/**ORANGE**/unknown".

**Docs / codebase say:**
- `docs/frontend/whatsapp-ui-patterns.md:180-182` — "**`TIER_250K`, `TIER_1M`**:
  Do NOT exist in `WhatsappLimitTier`. Actual values: `UNTIERED`, `TIER_50`,
  `TIER_250`, `TIER_1K`, `TIER_10K`, `TIER_100K`, `TIER_UNLIMITED`,
  `TIER_NOT_SET`." and "**`qualityOrange`**: Does NOT exist in
  `WhatsappQualityRating`. Actual values: `GREEN`, `YELLOW`, `RED`, `UNKNOWN`."
- `ui-spec/outcome/1-i18n-foundations-outcome.md:52-59` (the actual
  implementation outcome) — "The task description referenced enum values
  `TIER_250K`, `TIER_1M`, and `ORANGE` … These enum values **do not
  exist** in the actual codebase … These keys have no corresponding enum
  values, so they were **not added**."
- Backend doc `docs/services/whatsapp-cloud-api.md:100` — same actual tier
  enum list (no 250K/1M).

**Why it matters:**
The implementation outcome already notes this contradiction and refused to
add the dead keys. But the plan source — the artifact handed to a fresh
executing agent — still mandates it. A future re-run could comply with the
letter of the plan and produce: (a) dead i18n entries that tsgo may flag
under exhaustive `Record<WhatsappLimitTier, string>` patterns, (b) switch
arms on non-existent enum members (compile-time error if exhaustive),
(c) UI dead-ends where an unknown value shows a fallback label forever.

---

## D3 — [CRITICAL] ui-spec scope claims "no backend changes needed: All
backend resolvers already exist" — contradicted by the canonical UI doc
and by the ui-spec's own implementation.md

**Plan says:**
- `ui-spec/specs.md:38-43` — "Out of Scope: … GraphQL resolvers (Pothos)
  changes."
- `ui-spec/specs.md:381` — "Backend resolvers already exist for
  create/update account mutations."
- `ui-spec/specs.md:382` — "Templates are already persisted in the database
  from sync operations (just no query to fetch them)."
- `ui-spec/specs.md:387` — "The `WhatsappTemplatesQueryDocument` … backend
  resolver already exists or can be trivially added (backend stores templates)."
- `ui-spec/trackable-tasks.md:429` — "**No backend changes needed**: All
  backend resolvers already exist."
- `ui-spec/trackable-tasks.md:70` — "No backend changes. All changes are
  frontend-only."

**Docs / outcomes say:**
- `docs/frontend/whatsapp-ui-patterns.md:171-176` — "### Missing Backend
  Resolvers — `whatsappTemplates` query: Does NOT exist. GraphQL document
  is a commented-out stub in `whatsapp.documents.ts`. Templates come from
  `syncWhatsappAccountsFromMeta` mutation result. `whatsappOptInAudit`
  query: Does NOT exist. Same stub pattern. UI uses placeholder empty
  array with TODO comment."
- `ui-spec/implementation.md:156` —
  "Use persisted templates query (⚠️ backend resolver does not exist —
  create first or use sync mutation snapshot)" for `TemplatesTabContent.tsx`.
- `ui-spec/implementation.md:271` — "templates (⚠️ requires backend resolver
  or use sync mutation snapshot)".
- `ui-spec/implementation.md:199` — task 9 description repeats: "Backend
  resolver for a standalone templates query does not exist yet — either
  create it first (backend task) or use template snapshots".
- Codebase grep on 2026-08-17: zero matches for
  `whatsappTemplates|whatsappOptInAudit` in `backend/` directory —
  confirming the queries are not resolvers.

**Why it matters:**
UI-REQ-2 requires templates to persist across page navigations and survive
remounts via a `whatsappTemplates` GraphQL query
(`ui-spec/specs.md:82-88`). UI-REQ-6 requires a `whatsappOptInAudit`
query for non-admin opt-in history (`ui-spec/specs.md:160-165`). Both
acceptance criteria are unreachable without backend work the plan
simultaneously forbids. The plan is internally inconsistent (see also
`internal-consistency.md` and the implementation.md workaround notes),
and the canonical UI doc records the consequences.

---

## D4 — [MAJOR] ui-spec references spec codes Q10 / Q11 that exist
in neither parent plan nor canonical docs

**Plan says:**
- `ui-spec/specs.md:171` — "The parent plan's Q11 explicitly called for
  these features."
- `ui-spec/specs.md:285`, `:383` — "Current mobile `NumbersTab.mobile.tsx`
  is read-only by design (per Q10 in parent plan)."
- `ui-spec/implementation.md:27,39,40` — "Q10 read-only decision" /
  "parent plan (Q10) intentionally made mobile Numbers tab read-only."
- `ui-spec/trackable-tasks.md:276` — "Modify `tabs/NumbersTab.mobile.tsx`
  to support full CRUD (reverses Q10 read-only decision)".
- `ui-spec/outcome/research-specs-gaps.md:27,77` — "Q10 Mobile UX:
  explicit intent: mobile = read-only dashboard" and "Q10/Q11 explicitly
  reference unimplemented items".

**Docs / parent plan say:**
- Parent plan `specs.md:406` review checklist — "Post-review findings applied
  (**C1–C3, B1–B6, S1–S5, P1–P3, BL1–BL4, Q1–Q5**)". Q6 is not even
  claimed. Q10 and Q11 are nowhere defined.
- `docs/services/whatsapp-cloud-api.md:28` — spec code prefix table lists
  only "**Q1–Q6**" for Quality.
- Grep for `\bQ10\b` across the parent plan `.ai/finished_plans/whatsapp/`
  files — **zero matches outside the ui-spec subtree** (verified
  2026-08-17).

**Why it matters:**
The ui-spec attributes authority for decisions to spec codes (Q10 mobile
read-only; Q11 deferred opt-in features) that the parent plan never
defined. The canonical doc's Quality range is Q1–Q6 only. Either: (a) the
ui-spec mis-numbered someone's ad-hoc note, or (b) Q7/Q8/Q9/Q10/Q11
were an internal research numbering that should have been formalized.
Without documented authority, "reversing Q10" is a rationale the parent
plan cannot verify.

---

## D5 — [MAJOR] Parent plan `specs.md` claims "Q1-Q5" yet the canonical
doc defines "Q1-Q6"

**Plan says:**
- `specs.md:406` — "Post-review findings applied (C1–C3, B1–B6, S1–S5,
  P1–P3, BL1–BL4, **Q1–Q5**)".
- `trackable-tasks.md` Review-Finding Traceability table (lines 430-458)
  — last finding is "Q5 raw tier enum verbatim". No Q6 row.

**Docs say:**
- `docs/services/whatsapp-cloud-api.md:28` — "| **Q1–Q6** | Quality |".
- `docs/services/whatsapp-cloud-api.md:67-70` — Only **Q4** and **Q5**
  are individually documented in the doc body. **Q6 is referenced in
  the prefix table but is never explained anywhere in the doc itself.**

**Why it matters:**
Q6 is in the doc's spec-code taxonomy but never explained — a doc gap (see
`doc-gaps.md` DG1 below). The parent plan claims to apply only up to Q5,
so a discrepancy exists between the two sources about which Quality
findings are in scope. The r3-comprehensive-review and skill-improvement
outcome don't reference Q6 either — Q6 may be a placeholder that was
never actually populated, in which case the doc's prefix table is
itself misleading.

---

## D6 — [MAJOR] Parent plan specs REQ-5.6 uses
`max_daily_conversations_per_business` for `phone_number_quality_update`
— docs say the same but doc groups it under Q5 differently from plan

**Plan says:**
- `specs.md:156` — "WHEN webhook is `phone_number_quality_update` THEN
  Siraj SHALL read `max_daily_conversations_per_business` (not deprecated
  `old_limit`/`current_limit`) and update `portfolioMessagingLimitTier`
  … (Q5)."
- `trackable-tasks.md:200` — Task 13.5 maps `phone_number_quality_update`
  → `portfolioMessagingLimitTier` from `max_daily_conversations_per_business`,
  **stored verbatim (Q5)**.

**Docs say:**
- `docs/services/whatsapp-cloud-api.md:100` — Tier values listed verbatim.
- `docs/services/whatsapp-cloud-api.md:164` — Handler fields list uses
  "`phone_number_quality_update` (Q5)" — i.e. same field mapping, but
  the doc does not repeat the "not deprecated old_limit/current_limit"
  detail that the plan emphasizes.
- `docs/services/whatsapp-cloud-api.md:156` — Webhook handler Q5
  association is only at the high level.

**Why it matters:**
This is more a doc thinness than a contradiction — the doc is missing the
"deprecated field names" gotcha that the plan calls out. Functionally
equivalent. See `doc-gaps.md` DG2.

---

## D7 — [MAJOR] Webhook POST body-size cap semantics differ

**Plan says:**
- `specs.md` — REQ-5.4 references `\`INSERT … ON CONFLICT DO UPDATE\`,` (P3)
  but does not state the body-size threshold.
- `implementation.md:369` — "If `rawBody.length > 1_000_000` bytes → 413
  without parsing" (01 MB threshold, single threshold).
- `trackable-tasks.md:186` — "body-size cap ~1 MB → 413".

**Docs say:**
- `docs/services/whatsapp-cloud-api.md:160` — "Body-size cap
  (**Content-Length + actual, both >1MB** → 413)." — implies the cap is a
  conjunction (Content-Length header > 1MB **AND** actual body > 1MB),
  not the simpler "rawBody.length > 1_000_000 → 413" the implementation
  describes.

**Why it matters:**
The actual implementation per the doc requires **both** Content-Length and
actual length to exceed 1MB. The plan's `rawBody.length > 1_000_000 → 413`
would reject a >1MB body even when Content-Length was honest but small
(or vice-versa). If a downstream test asserts the plan's simpler behavior,
it would diverge from the documented implementation. Minor for security
(strict rejects more), but a real mismatch in semantics.

---

## D8 — [MAJOR] GET verify mismatch HTTP code: plan says 403, docs say 403 +
401/404 elsewhere — but plan's GET says 403 while docs only document POST (401/404)

**Plan says:**
- `specs.md:151` — "Compare SHALL use `crypto.timingSafeEqual` over
  constant-length buffers (S5). Repeated failures from the same IP SHALL
  be logged with `(ip, userAgent, contentLength)` only and rate-limited
  (S1)."
- `implementation.md:366` — "On mismatch: log `(ip, userAgent,
  contentLength)` only (S2); **return 403**".

**Docs say:**
- `docs/services/whatsapp-cloud-api.md:154-161` — GET verification
  describes rate-limiting (S1) and timingSafeEqual (S5); POST documents
  401 (HMAC mismatch), 400 (invalid JSON), 404 (`body.object !==
  "whatsapp_business_account"`). The doc does not state 403 for GET
  mismatch explicitly, and `trackable-tasks.md:186` itself says "403 on
  mismatch".

**Why it matters:**
The canonical doc's webhook section gives explicit HTTP codes for POST
branch but not GET. 403 vs 401 is a semantic choice the docs leave to
implementation. The plan is internally consistent (403 for GET) but
lacks explicit confirmation from the doc. Minor disagreement in
abstraction; treat as INFO if no test pins the code.

Severity downgraded from MAJOR → INFO given docs simply don't pin the GET
code, but worth documenting.

---

## D9 — [MAJOR] ui-spec's H1/H2 documentation status assertion
"templates are already persisted in the database from sync operations"
contradicts canonical doc

**Plan says:**
- `ui-spec/specs.md:382` — "Templates are already persisted in the
  database from sync operations (just no query to fetch them)."
- `ui-spec/specs.md:93-94` — "Assumptions: Templates are stored in the
  database from the sync operation (backend already persists them)."

**Docs say:**
- `docs/services/whatsapp-cloud-api.md:79` — "`WhatsappPayload` has **no
  free-text `body` field** — only `template: WhatsappTemplateRef` +
  `components[]`. Free-text sends deferred to v2 (BL4)."
- `docs/services/whatsapp-cloud-api.md:139` — "WhatsappTemplateSnapshotPothosObject
  (BL3): id, name, language, status, category." — i.e., snapshots exist
  on the **account** mutation result (`syncWhatsappAccountsFromMeta`),
  not as persisted `whatsapp_templates` table rows.
- `docs/services/whatsapp-cloud-api.md:344` — "Template authoring in v1:
  WhatsApp Manager (Meta UI). `syncTemplates` mutation is required (BL3)
  but performs read-only sync — **never write** — to back audit
  reconciliation."
- `docs/frontend/whatsapp-ui-patterns.md:173` — "Templates come from
  `syncWhatsappAccountsFromMeta` mutation result." (i.e., NOT a persisted
  query; they live in the mutation payload).
- `docs/frontend/whatsapp-ui-patterns.md:194-196` — "WhatsappTemplateSnapshot
  only has: `id`, `name`, `language`, `status`, `category`,
  `lastSyncedAt`. **`body` and `buttonStructure` do NOT exist on this
  type.**"

**Why it matters:**
The ui-spec assumption 382/93 — "templates are already persisted in the
database" — is half true. The parent plan does **not** create a
`whatsapp_templates` database table in v1 (this is a v1 deferral; see
plan-gaps PG1 below for the parent plan's "No `whatsapp_templates` table
in v1" decision at `implementation.md:155`). The only persistence is JSON
metadata on the audit entry (`specs.md:138`, BL3). The UI feature
"templates persist across page navigations" and "body preview" can't be
satisfied without either (a) a backend table or (b) re-calling the sync
mutation serially — neither is in scope per plan.

The ui-spec also references `body` and `buttonStructure` on the snapshot
in its GraphQL document samples (`ui-spec/implementation.md:398-403`),
which the doc explicitly says don't exist on that type.

---

## D10 — [MINOR] Skill improvement outcome claims `62c4ac915` became
"final commit" but the canonical doc's Knowledge Propagation outcome says
Task 30.8 quality check is "Pending"

**Outcome says:**
- `outcome/whatsapp-implementation-skill-improvement-outcome.md:24-29` —
  "Final Commit … Hash: `62c4ac915` … feat(whatsapp): implement
  WhatsApp Cloud API integration with R12 review fixes … 194 files".
- `outcome/30.1-knowledge-propagation-outcome.md:60` —
  "30.8 — Global quality check — **Pending** — will run tsgo, biome:check,
  and lint to verify 0 errors/warnings on all modified files."

**Why it matters:**
The knowledge-propagation task that *created* the canonical doc declared
its own quality gate "Pending." If tsgo/biome/lint were never run on the
doc-update files, the canonical doc may itself have drift against the
committed code. The skill-improvement outcome (a separate retrospective
file) sets "Quality gates: tsgo ✅, biome ✅, lint ✅ (zero errors)" — but
that file's stop-point in the doc-update subtask reads as though quality
verification was a fait accompli. Two posts of the project's status
disagree.

Severity: MINOR because the docs are readable as-is, but it's a process
hygiene concern flagged by the skill-improvement outcome itself
(`whatsapp-implementation-skill-improvement-outcome.md:153-156`,
"3.9 Final Knowledge-Propagation Quality Check Was Left Pending").

---

## D11 — [MINOR] Plan `specs.md` line 50 says messages[] stripped at
route level before *logging/audit*; docs agree but stress the
*belt-and-suspenders* handler re-check

**Plan says:**
- `specs.md:50` — "Webhooks: outbound status only; inbound `messages[]`
  acknowledged with 200, stripped at the route level before any
  logging/audit (S3), not persisted."
- `specs.md:158` (REQ-5.8) — Same.

**Docs say:**
- `docs/services/whatsapp-cloud-api.md:162` — "`stripInboundMessages()`
  removes `value.messages[]` before anything else (S3)."
- `docs/services/whatsapp-cloud-api.md:218-220` — "### `messages[]`
  Stripped Defensively — Route already strips `value.messages[]` (S3) but
  the handler also defensively checks/deletes it (belt-and-suspenders)."

**Why it matters:**
The plan emphasizes route-strip-only (S3). The doc explicitly adds
"belt-and-suspenders" defensive re-strip in the handler. The plan's task
13.7 in `trackable-tasks.md:202` DOES include "Inbound `messages[]`
already stripped at route (S3); **handler defensively drops if
encountered**", so plan and doc agree. INFO only — just noting the doc
adds emphasis the plan omits at the spec level.

---

## D12 — [INFO] `.ai/todo/whatsapp.md` is essentially empty and contains a
URL pointing to a deprecated-style inbound-chat library

**Doc says:**
- `.ai/todo/whatsapp.md` (entire file): "consider
  https://github.com/wwebjs/whatsapp-web.js"

**Parent plan / docs say:**
- `specs.md:17` (Introduction) — "Meta WhatsApp Cloud API direct (no BSP
  markup). On-premises WhatsApp API is deprecated (Oct 2025); Cloud API
  is the only supported path."
- `specs.md:30-32` — "Out of scope (v2): Inbound chat / supervisor reply
  UI".
- `docs/services/whatsapp-cloud-api.md:1-3` — Doc consolidates WhatsApp
  Cloud API integration. No mention of `wwebjs/whatsapp-web.js`.

**Why it matters:**
`whatsapp-web.js` is a WhatsApp Web automation library (unofficial,
client-side QR-pairing based). It is fundamentally opposite to the
parent plan's Cloud API strategy. The todo file being empty except for
this URL is suspicious because (a) it suggests an abandoned alternative
investigation, (b) it could mislead a future agent into believing
inbound-chat is in active consideration. Recommend either deleting the
file or replacing its contents with a structured backlog referencing
WHEN/IF inbound chat becomes v2 scope. This does not contradict the
canonical docs (they don't mention it). It is a hygiene/gap concern
surfaced to the orchestrator.
```

---
