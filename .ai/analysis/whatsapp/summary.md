# WhatsApp Plan-vs-Documentation Analysis — Executive Summary

**Date:** 2026-08-17
**Analyst:** research subagent (read-only)
**Scope:** Compare `.ai/finished_plans/whatsapp/` plan set against canonical docs
  `docs/services/whatsapp-cloud-api.md` and `docs/frontend/whatsapp-ui-patterns.md`.

## Overall Health

The backend-focused plan set (specs.md / implementation.md / trackable-tasks.md)
is **well-aligned** with `docs/services/whatsapp-cloud-api.md`. The canonical
backend doc was explicitly produced by the plan's own knowledge-propagation task
(see `outcome/30.1-knowledge-propagation-outcome.md:9-22`), so coverage is
near-complete and spec codes (REQ-*, B1-B6, P1-P3, S1-S5, C1-C3, Q1-Q6,
R1-R8, BL1-BL4) are consistently honored in both directions.

The **UI improvement plan set** (`.ai/finished_plans/whatsapp/ui-spec/*`)
has **substantial alignment problems** against
`docs/frontend/whatsapp-ui-patterns.md` — the very document that plan
produced. Three CRITICAL contradictions and several MAJOR ones exist
because the ui-spec plan was authored *before* the canonical UI doc and
its own outcome files surfaced the contradictions, but the plan stubs
were not corrected. The outcomes correctly note the contradictions
(see `ui-spec/outcome/1-i18n-foundations-outcome.md:51-59` and
`ui-spec/outcome/20-knowledge-propagation-outcome.md:53-55`), yet the
plan source still instructs otherwise.

## Issue Counts by Severity

| Severity | Count | Distribution |
|----------|-------|--------------|
| CRITICAL | 3 | All in `ui-spec/` plan set |
| MAJOR | 9 | 7 in `ui-spec/`, 1 in parent plan, 1 doc-vs-codebase |
| MINOR | 7 | 5 in `ui-spec/`, 2 in parent plan / docs |
| INFO | 4 | Mostly status / hygiene items |

## Top Findings (CRITICAL)

1. **Plan asks to add i18n keys for non-existent enum values** — the ui-spec
   plan repeatedly directs adding `tier250K`, `tier1M`, `qualityOrange` keys
   for `WhatsappLimitTier.TIER_250K / TIER_1M` and `WhatsappQualityRating.ORANGE`.
   Both the canonical UI doc (`whatsapp-ui-patterns.md:180-182`) and the
   actual enum source (`shared/constants/whatsapp-templates.enum.ts`)
   confirm these enum values do not exist. The implementation correctly
   refused (see `ui-spec/outcome/1-i18n-foundations-outcome.md:52-59`) but
   the plan still mandates them. Severity CRITICAL because acting on the
   plan would produce dead i18n keys and trigger `tsgo` exhaustive-map
   errors against the real enum.

2. **Permission symbol `WHATSAPP_MANAGE` is used throughout the ui-spec plan
   but does not exist** — the canonical UI doc explicitly warns
   "WhatsappConfigManage (not WHATSAPP_MANAGE)"
   (`whatsapp-ui-patterns.md:186-190`), and the actual codebase enum
   (`backend/enum/permissions/permission.enum.ts`) confirms only
   `WHATSAPP_VIEW`, `WHATSAPP_CONFIG_MANAGE`, `WHATSAPP_TEMPLATES_MANAGE`
   exist. The ui-spec plan uses `AppPermission.WHATSAPP_MANAGE` as the
   single gate for create/edit/delete operations
   (`ui-spec/implementation.md:99,143,180,199-200,244-247`; `ui-spec/specs.md:76`).
   This contradicts both the parent plan's `WHATSAPP_CONFIG_MANAGE`
   (`specs.md:55-61`) and the canonical docs. Severity CRITICAL: any
   `RequirePermission permissions={AppPermission.WHATSAPP_MANAGE}` JSX
   would fail tsgo at compile time.

3. **ui-spec claims "no backend changes needed: All backend resolvers
   already exist"** (`ui-spec/trackable-tasks.md:429`, `ui-spec/specs.md:381-388`)
   while the canonical UI doc explicitly states `whatsappTemplates` and
   `whatsappOptInAudit` queries **DO NOT exist** with "stub documents
   commented out" (`whatsapp-ui-patterns.md:171-176`). The ui-spec's own
   implementation.md acknowledges this once
   (`ui-spec/implementation.md:156`, `whatsapp.documents.ts` ⚠️ marker)
   but the top-level Scope ("Out of Scope: GraphQL resolvers (Pothos)
   changes" at `ui-spec/specs.md:40`) and Progress Summary assertions
   contradict it. Severity CRITICAL: this directly causes the
   UI-REQ-2 (template persistence) and UI-REQ-6 (opt-in audit history)
   acceptance criteria to be unachievable as the plan is written.

## Recommendations

1. **Patch the ui-spec plan** for the three CRITICAL issues above before
   any re-execution, even though its outcome files record the resolutions.
   A plan with `WHATSAPP_MANAGE` placeholder tokens, calls for non-existent
   enum i18n keys, and an "on backend already exists" assumption that
   three of its own task descriptions refute — is unsafe to hand to a
   fresh executing agent that may not read every outcome file.
2. **Add the canonical UI doc's gotchas forward** into
   `ui-spec/specs.md` — at minimum the "Missing Backend Resolvers",
   "Missing Enum Values" and "Permission Enum Names" sections of
   `whatsapp-ui-patterns.md:169-202` should appear as explicit
   "Assumptions / Non-Assumptions" in the plan.
3. **Resolve the empty `.ai/todo/whatsapp.md`** — it contains a single
   GitHub URL to `wwebjs/whatsapp-web.js` which is an **inbound-chat
   library** (WhatsApp Web automation), directly at odds with the
   parent plan's stance that inbound chat is out of scope (v2 / BL4)
   and that Cloud API is the only supported path (`specs.md:17`).
   Either remove the file or convert it to a structured backlog for
   inbound-chat investigation (v2).
4. **Update canonical backend doc** for `Metastable Send Flow` — the
   doc lists a step named "empty-recipient guard" but the Step 4 list
   at `whatsapp-cloud-api.md:56` mixes the dispatch layer's
   `dispatchMulti` (which is documented separately as Q4 accounting)
   and the adapter's send flow; a single clean sequence would help.
   Low priority — clarity, not correctness.
5. **Promote the r3-comprehensive-review's two HIGH findings** into the
   next plan revision's "Known Issues / Out-of-Scope" section so they
   aren't silently dropped. The parent plan's Knowledge Propagation
   Task 30 marked its final quality check "Pending"
   (`30.1-knowledge-propagation-outcome.md:60`) — none of the 23 r3
   review findings were ever fixed (`r3-comprehensive-review.md:48-51`
   "Fixed: 0 / 23"), and the canonical doc does not list them.

## Files Produced

| File | Purpose |
|------|---------|
| `discrepancies.md` | Concrete contradictions: plan says X, doc says Y |
| `doc-gaps.md` | Features in plans that the docs should add |
| `plan-gaps.md` | Patterns documented in docs that the plans lack |
| `internal-consistency.md` | Issues within/between plan files themselves |
| `summary.md` | This file |
```

---
