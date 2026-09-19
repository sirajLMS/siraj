# Round 5 Cross-Section Consistency Audit

## Summary
- Total cross-references checked: 71 distinct `§` references (across ~130 occurrences; §G ref x5, §H ref x5, §M x5, §K x5, §L x5, §Y3 x5)
- Dangling references remaining: 0 hard-dangling (§G and §H were both created in v9); however §A/§F/§I/§J/§K/§L/§M/§N/§O/§P/§Q/§R/§D/§E resolve only via their **named** H3 headings (no `§A`/`§F`… **lettered** H3 header exists — see §6 below for the structural mismatch). Net flagged: **3** structural ambiguity issues.
- Phase inconsistencies: **5** (Phase Mapping subsection-range mismatches for §S, §W, §X, §Y, §Z)
- Missing i18n keys: **10** (5 shortcut keys + 4 dnd keys + 1 mergeTag label)
- Locked decision count correct: **NO** — changelogs say "30"; actual unique `V#-#` ids = **33**
- Item-section alignment issues: **1** (item 30 §G1 path contradiction vs §V2)
- Section ordering issues: **2** (§G/§H inserted physically AFTER §Q-era content, before §S — grouped-by-insertion not alphabetical; plus §A–§F do not use the lettered H3 convention §G/§H/§S–§Z do)
- v9 changelog accuracy: **INACCURATE** — 3 factual defects (decision count, 235KB size, "3 locations" of seed-fix)
- Codebase path mismatches: **3** (`frontend/stores/` does not exist; `eslint.config.js` vs actual `.mjs`; Round-4 dir 232.6 KB not 235 KB — minor)

---

## 1. Dangling References

Every `§` token in the design was tokenized (`§` + optional letter + optional digits). The 71 distinct targets referenced resolve as follows:

| Ref | Target | Exists? | Notes |
|-----|--------|---------|-------|
| §A | emails namespace section | YES (named H3 at "### i18n…" sub-heading ####A "Extend existing `emails` namespace", L1205) | Resolves to `i18n → #### A` |
| §B | dashboard.emailTemplates catalogue | YES (#### B, L1233) | OK |
| §D | "Draft + tab close / nav away" section | YES (named H3 in body, lines ~970/990) | OK |
| §E | CSP / preview-iframe section | YES (named H3) | OK |
| §F | forward-ref to §H | YES via line 2202 ("§F→§H") | **Mild**: no `### F.` lettered header exists; §F is only referenced as a *pointer* (`§F→§H`) — no body defines §F. Acceptable cross-pointer, not a dangling body-forward. |
| §G | Accessibility & Interaction Patterns | **YES (L1440, created v9)** | RESOLVED ✅ |
| §H | Validation Schemas | **YES (L1538, created v9)** | RESOLVED ✅ |
| §I–§J | (referenced once each) | §I: pointer only (L…); §J: line 2033 (`§J confirms…`) → resolves to "Accessibility" named H3 | No `§I` body header; appears only as enumeration in V1 ("§F, §G, §H, §I entirely absent") — historical, now stale after §G/§H insertion. |
| §K, §L, §M, §N, §O | Frontend named H3 sections | YES (all have `### ` headings) | OK |
| §P (incl. §P1/P2/P7/P8) | State Transitions section (§P) | YES | OK — but note: V-phase-mapping table (L2220) does NOT list §P–§R rows; that's by design (only §S–§Z + new §G/§H). |
| §Q, §R | Data-flow / Responsive sections | YES | OK |
| §S–§Z | Round-3 audit sections | YES (all 10 present L1615–L2099) | OK |
| §G refs @ L790, L884, L1038 | now target §G1/§G2/§G3 | RESOLVED ✅ (§G created L1440) | The v9 changelog & §V1 both still reference the *old* line numbers (790/884/1038) as evidence — those lines are unchanged in v9, refs now valid. |
| §H refs @ L1971-1972 | §H now exists | RESOLVED ✅ | Same — refs now land on §H1 (L1542) which is authoritative. |
| §Y3 (x5 refs) | Migration section Y3 | YES (#### Y3, L…) | OK |
| §Y8, §W1, §M cross-refs | exist | YES | OK |

**Conclusion:** No hard-dangling reference remains after v9 — the §G/§H closure bug is fixed. **Stale residue only**: L1814 (§V1) and L1842 (§G header) STILL contain the text "§G does not exist as a section" / "§G did not exist as a section in v6-v8" — these are historical narratives, not live dangling refs, but they read as contradictions to the now-existing §G for a casual reader.

---

## 2. Phase Consistency

### 2.1 Phase definitions (L2214–2218) vs frontmatter todos
- **Phase 0** (L2214): "Todos 1, 21b." — frontmatter ids 1, 21b present ✅
- **Phase 1** (L2215): "Todos 1-8, 3a, 7a, 7b." — all present ✅. **§Y3 fix verified:** Phase 1 text explicitly says `no seeds — seeds are Phase 2` ✅
- **Phase 2** (L2216): "Todos 9-12, 12a, 14-17, 16a, 19, 21a." + **`seed default email templates` (item 19, per §Y3 correction)** ✅ — §Y3 fix is in place.
- **Phase 3** (L2217): "Todos 13, 18, 20, 20a, 21c." ✅
- **Phase 4** (L2218): "Todos 20b, 21." ✅

### 2.2 New v9 todos 22-31 — phase placement in `note:` fields
| item | section | `note:` phase claim | consistency |
|------|---------|---------------------|------------|
| 22 §S | S5/S6/S7 | "Phase 1 (registry/errors) + Phase 2 (GraphQL error mapping)" | OK ✅ (matches table L2224) |
| 23 §T | T1/T2/T10 | "Phase 2. T6 bundle analysis deferred to Phase 4" | OK ✅ |
| 24 §U | U2/U3/U7 | "Phase 1 (U1 Email scalar) + Phase 2 (U3, U7)" | **MINOR**: item content says U2, note phase list starts "U1" — U1 vs U2 swap, harmless (both Phase 1). |
| 25 §V | V3/V7/V8 | "Phase 2 — ships with UI" | OK ✅ |
| 26 §W | W2/W4/W5 | "Phase 1 (W1) + Phase 2 (W2-W4) + Phase 3 (W5)" | OK ✅ |
| 27 §X | X1/X4/X6 | "Phase 1 (X1) + Phase 2 (X4) + Phase 4 (X6)" | OK ✅ |
| 28 §Y | Y1/Y3/Y6/Y7 | "Phase 1 (Y1) + Phase 2 (Y3 seeds) + Phase 3 (Y5 rollback)" | OK ✅ |
| 29 §Z | Z1/Z3/Z4/Z8 | "Phase 1 (Z1-Z4) + Phase 2 (Z6-Z8)" | OK ✅ |
| 30 §G | G1-G4 | "Phase 2 — ships with editor UI" | OK ✅ (matches table L2232) |
| 31 §H | H1-H5 | "Phase 1 (H1-H2) + Phase 2 (H3-H5)" | OK ✅ (matches L2233) |

### 2.3 Phase Mapping table (L2220–2233) — **5 subsection-range errors**
The table header enumerates subsection ranges that UNDER-count the actual subsections present in the body:

| Section | Table claim | Actual `#### X#.` count | Issue |
|---------|-------------|------------------------|-------|
| §S | "S1-S8" | **9** (S1-S9, L1619-1675) | Missing S9 ✗ |
| §T | "T1-T10" | 10 | OK ✅ |
| §U | "U1-U7" | 7 | OK ✅ |
| §V | "V1-V8" | 8 | OK ✅ |
| §W | "W1-W9" | **11** (W1-W11, L1895-1976) | Missing W10, W11 ✗ |
| §X | "X1-X6" | **7** (X1-X7, L1982-?) | Missing X7 ✗ |
| §Y | "Y1-Y7" | **8** (Y1-Y8, L?) | Missing Y8 ✗ |
| §Z | "Z1-Z8" | **11** (Z1-Z11, L2101-2171) | Missing Z9, Z10, Z11 ✗ |
| §G | "G1-G4" | 4 | OK ✅ |
| §H | "H1-H5" | 5 | OK ✅ |

Additionally: §W row phase column omits Phase-3 entry for W10 (W10 is in §W body, L1970 — "optimistic rollback" — Phase 3 sendTest lifecycle). §Z row omits entirely the Phase-1/2 placement of Z9, Z10, Z11 (barrel export, codegen glob, two Zustand stores). These are not placed in any phase in the table at all.

---

## 3. i18n Key Catalogue (§B)

### 3.1 §B catalogue inventory (L1237-1278) — verified complete for stated scopes EXCEPT the items below.

### 3.2 MISSING KEYS — referenced in body but ABSENT from §B catalogue:

| Missing key | Referenced at | Catalogue scope where it should live | Severity |
|-------------|---------------|--------------------------------------|----------|
| `editor.shortcuts.saveDraft` | §G4 L1527 | `dashboard.emailTemplates.editor.*` | P0 — used by keyboard-shortcut wiring |
| `editor.shortcuts.publish` | §G4 L1528 | same | P0 |
| `editor.shortcuts.sendTest` | §G4 L1529 | same | P0 |
| `editor.shortcuts.close` | §G4 L1530 | same | P0 |
| `editor.shortcuts.mergeTags` | §G4 L1531 | same | P0 |
| `dnd.started` | §V7 L1875 | `dashboard.emailTemplates.dnd.*` (new sub-ns) | P0 — V7 mandated it |
| `dnd.over` | §V7 L1876 | same | P0 |
| `dnd.dropped` | §V7 L1877 | same | P0 |
| `dnd.cancelled` | §V7 L1878 | same | P0 (onDragCancel is REQUIRED per V7) |
| `mergeTag.triggerLabel` | §V8 L1886 | `dashboard.emailTemplates.mergeTag.*` (new sub-ns) | P0 — ARIA label requirement |

### 3.3 PRESENT keys verified ✅
- `duplicateSlug` (**v9 added**) — IS in catalogue (L1264 inside `error.*` group) ✅
- `duplicateScopeLocale` — present (L1264) ✅
- §S6/S7 service error keys (`templateNotFound`, `templateNotPublished`, `unauthorizedEditor`, `invalidDesignJson`, `attachmentTooLarge`, `invalidLocale`, `renderFailed`) — all listed in §A's `EmailsErrorLabels` (L1212-1218) ✅
- §S7 error codes (`VERSION_MISMATCH`, `RATE_LIMITED`, `DUPLICATE_SCOPE_LOCALE`, `DUPLICATE_SLUG`, `NOT_FOUND`, `RENDER_FAILED`, `PROVIDER_DEGRADED`, `EMAIL_TEMPLATES_DISABLED`, `INVALID_EMAIL`, `INVALID_SAMPLE_PROPS`) — these are **enum members**, not i18n keys; UI binding via `getGraphQLErrorCode` (S2) to existing `error.*` keys except `RATE_LIMITED`, `NOT_FOUND`, `INVALID_EMAIL`, `INVALID_SAMPLE_PROPS` which have **no canonical UI message key** in §B `error.*` group (`loadFailed`, `previewFailed`, `notFound`, `notEditable`, `versionMismatch`, `invalidDesignJson`, `duplicateScopeLocale`, `duplicateSlug`, `missingCompiledHtml`). Mapping: `notFound` ↔ `NOT_FOUND` ✅; but **`RATE_LIMITED`, `INVALID_EMAIL`, `INVALID_SAMPLE_PROPS` have NO matching §B error key** — the only `rateLimited` key lives in `toast.*` (L1261) and `sendTest.*` (L1276), which is contextually different from a GraphQL-error-code binding. Flag as P1 i18n gap.

**Total missing: 10 (P0) + up to 3 (P1) = 13.**

---

## 4. Locked Decision Count

### 4.1 Actual unique V-numbered decision ids (extracted & deduplicated):
**33 unique ids** — V3-1, V3-2, V3-3, V3-5, V3-6, V3-7, V3-8, V3-9, V3-10, V3-11, V3-12, V3-14, V3-15 (13 in V3 — note V3-4 and V3-13 are absent) ; V4-1, V4-2, V4-3, V4-4, V4-5, V4-6, V4-7, V4-8, V4-9, V4-10 (10 in V4) ; V5-1, V5-2, V5-3, V5-4, V5-5, V5-6, V5-7, V5-8, V5-9, V5-10 (10 in V5).

### 4.2 Changelog claims (searched all `**v…` entries):
- **v9 entry** (L2188): "30 V-numbered decisions across v3-v5, not '12'" ✱ claims **30** ✗
- **v8 entry** (L2192): "All 30 v1-v5 locked decisions preserved verbatim." ✱ claims **30** ✗
- **v8 footer** (L2194): "All 30 v1-v7 locked decisions preserved verbatim." ✱ claims **30** ✗
- **v7 entry** (L2207): "All 30 v1-v5 locked decisions preserved verbatim." ✱ claims **30** ✗

### 4.3 Result
- **No "12" count remains anywhere** (the v9 fix successfully purged the old wrong "12" — verified zero `…12… locked decisions` matches) ✅
- **BUT the corrected number is itself WRONG**: every entry says "30"; the real unique count is **33** (10 V4 + 10 V5 + 13 distinct V3). The v9 "correction" replaced 12 → 30, but the true count is 33 (or, if counting only the decisions the authors *intended* to lock, they may have miscounted V3's set — gaps V3-4/V3-13 suggest renumbering churn). Either the changelog count or the body must be reconciled.
- Net: **Locked decision count correct = NO** (off by 3).

---

## 5. Item Completeness

### 5.1 Item ids present in frontmatter: 1, 2, 3, 3a, 4, 5, 6, 7, 7a, 7b, 8, 9, 10, 11, 12, 12a, 13, 14, 15, 16, 16a, 17, 18, 19, 20, 20a, 20b, 21, 21a, 21b, 21c, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31. **41 todos totzl; primary ids 1-31 (with alpha suffixes) — all present.**

### 5.2 Every major section has ≥1 item:
- §G → item 30 ✅
- §H → item 31 ✅
- §S–§Z → todos 22-29 respectively ✅

### 5.3 Cross-references from todos to sections — verification
All todos 22-31 `content:` strings cite their parent section reference (e.g. item 30 says "§G — …"); all parent sections exist. **No item references a non-existent section.** ✅

### 5.4 ONE path contradiction in item 30 (§G1) vs §V2:
- **Item 30 / §G1 (L1446):** `usePrefersReducedMotion()` lives in `frontend/stores/preferencesStore.ts` (a Zustand store + hook).
- **§V2 (L1823):** same hook lives at `frontend/common/hooks/usePrefersReducedMotion.ts`.
- TWO different file paths for the SAME symbol. Codebase check confirms `frontend/stores/` **does not exist** (real store dir is `frontend/common/stores/`) and `frontend/common/hooks/` exists (houses many hooks but no `usePrefersReducedMotion.ts`). Either §G1 or §V2 must yield — they contradict on BOTH path and architecture (store-state-driven vs matchMedia-hook).

---

## 6. Section Numbering & Ordering

### 6.1 Actual section sequence (line order)

| Line | Section |
|------|---------|
| ~169-1391 | Named H3 sections (Library decision, Scope enum, Registry, Multi-provider, DB schema, Backend types, Repo, Service, GraphQL, i18n §A/§B as #### sub, React Email, Render pipeline, Logging, Migration, Future WhatsApp, Phasing) |
| 1440 | **§G** (new in v9) |
| 1538 | **§H** (new in v9) |
| 1615 | §S |
| 1680 | §T |
| 1763 | §U |
| 1811 | §V |
| 1893 | §W |
| 1980 | §X |
| 2038 | §Y |
| 2099 | §Z |

### 6.2 Ordering anomaly #1 — lettered scheme is not contiguous
The design uses TWO parallel conventions:
- The early UI/UX sections (introduced v6/v7) use **named H3s** ("### Service layer", "### GraphQL surface", "i18n #### A/B"). They map logically to §D–§O but **never carry a `### X.` lettered header**.
- The audit closure sections (v8/v9) use the **`### <letter>. Title (vX — Round Y Audit)`** convention exclusively (§G, §H, §S-§Z).

Consequence: ref readers can find §G/§H/§S-§Z by header search, but a `§F→§H` cross-ref (L2202) and refs to §A/§B require resolving via the ####A / ####B sub-headings inside "### i18n" — a non-obvious indirection. §F has no header at all (it is referenced only as a pointer). This is **not strictly dangling** but structurally inconsistent.

### 6.3 Ordering anomaly #2 — §G/§H physically AFTER §Z-ear material
§G and §H are alphabetically BEFORE §S, but in the file they sit between the "Phasing recommendation" block (L1391-1438) and §S (L1615). This is "insertion-order grouped", not alphabetical. Acceptable for readability (new sections appended before the audit block) but means a reader expecting A,B,…G,H,…S expects §G/§H earlier. Minor.

### 6.4 Section labels correct?
- §G / §H: "(v9 — Round 4 Audit Closure)" ✅ correct.
- §S-§Z: "(v8 — Round 3 Audit)" ✅ correct (these labels were NOT bumped to v9 — consistent because §S-§Z bodies contain v9 *content edits inside* but the SECTION was created in v8). Acceptable.
- ONE residual stale label-text: §V1 heading body (L1813-1819) still says "§G does not exist as a section … §F, §G, §H, §I entirely absent". This is **now false** post-v9 — §G and §H exist. The line is historical prose, not a heading label, but it contradicts the current state. Flag for cleanup.

---

## 7. v9 Changelog Accuracy

### 7.1 v9 entry (L2175-2190) — item-by-item verification
| Claim | Verified |
|-------|----------|
| "9 parallel audit subagents, each validating one v8 section (§S–§Z)" | ⚠️ §S-§Z = 8 sections, plus a cross-section agent = 9 reports total. Wording "each validating one v8 section" overcounts: 8 sections + 1 cross-section = 9, so "9 subagents … (§S–§Z)" implies 9 INDEPENDENT section audits — actually 8. **Minor inaccuracy.** |
| "Total 19 INVALID designs corrected" | Plausible (matches §S/§T/§U/V/W/X/Y/Z bullet tallies: S6+S7+S8+S5=4; T1/T2/T6/T10=4; U3/U7=2; V3/V7/V8=3; W2/W4/W5/W9=4; X1/X4/X6=3; Y1/Y3/Y6/Y7=4; Z1/Z3/Z4/Z8/Z6=5 = ~29 → shadowed by "19 INVALID + dozens PARTIAL"). Roughly consistent. |
| "19 INVALID designs corrected, plus dozens of PARTIAL designs deepened" | OK |
| §S corrections listed (S5/S6/S7/S8) | Match §S body ✅ |
| §T (T1/T2/T6/T10) | Match ✅ |
| §U (U3/U7) | Match ✅ |
| §V (V3/V7/V8) | Match ✅ |
| §W (W2/W4/W5/W9) | Match ✅ |
| §X (X1/X4/X6) | Match ✅ |
| §Y (Y1/Y3/Y6/Y7) | Match ✅ |
| §Z (Z1/Z3/Z4/Z8/Z6) | Match ✅ |
| "Created §G" with hooks G1-G4 | Match ✅ |
| "Created §H" with H1-H5 | Match ✅ |
| "Phase corrections: Seed phase contradiction fixed at 3 locations" | **INACCURATE** — searched: only **1 explicit** place in Phase-definitions says "no seeds/seeds are Phase 2" (Phase 1 L2215 + Phase 2 L2216 = 1 pair of statements) plus item 19 note = 1 + §Y3 body = 1. Even counting generously (Phase-1 sentence, Phase-2 sentence, item 19 note, §Y3 section heading) = **4 locations**, not 3. The "3 locations" tally is unexplained/loose. Minor inaccuracy. |
| "i18n: added `duplicateSlug` … referenced in §S6/S7 but absent from catalogue" | ✅ `duplicateSlug` IS now in §B `error.*` (L1264) — confirmed present. |
| "Locked-decision count corrected (30 V-numbered … not '12')" | **INACCURATE** — actual count is 33, not 30 (see §4). |
| "Research files at `.ai/designs/email-templates/glm_swe/ui-research-round4/01-09-*.md` (9 reports, ~235KB total)" | **INACCURATE (minor)** — 9 files exist ✅ (names 01-09), but total size is **238,196 bytes = 232.6 KiB (~233 KB)**, not "235KB". Off by ~5 KB (2%). Path pattern `01-09-*.md` is correct. |

### 7.2 Net verdict
**v9 changelog is INACCURATE** with 3 defects of varying severity:
1. **P1** — Locked-decision count says 30 but actual is 33 (also wrong in v7 and v8 footers).
2. **P2** — "~235KB" Round-4 size is ~233 KB (cosmetic).
3. **P3** — "3 locations" of seed-fix is unspecified/loose (cosmetic), and "9 parallel subagents validating §S–§Z" is actually 8 section audits + 1 cross-section audit.

All *factual* design-correction bullets (S/T/U/V/W/X/Y/Z, §G/§H creation, duplicateSlug addition) ARE accurate.

---

## 8. Codebase Path Validation

| Design claim | Path/design | Verified result | Issue |
|------------|-----------|-----------------|-------|
| §G1: `frontend/stores/preferencesStore.ts` (create new) | L1446 | `frontend/stores/` **does not exist**. Existing stores live at `frontend/common/stores/` (verified). | **MISMATCH** — new file should be `frontend/common/stores/preferencesStore.ts` OR §G1's path should be corrected. |
| §V2: `frontend/common/hooks/usePrefersReducedMotion.ts` | L1823 | `frontend/common/hooks/` EXISTS (useApolloConnectivity.ts, useAppLocale.ts, …) but `usePrefersReducedMotion.ts` does not (to be created). | OK (to-create) — **but contradicts §G1's store location** (§5.4 / §6 above). |
| §Z1: `shared/locale/types/emails/` for `EmailLabels` | L2102 | EXISTS ✅, contains `index.ts` | OK |
| §H: `shared/lib/validations/emailTemplate.ts` (create new) | L1545 | `shared/lib/validations/` **does not exist** — `shared/lib/` has `datetime`, `locale`, `logger`, `meeting`, `national-id`, `phone`, `schedule`, `social`, `timezone` subdirs but NO `validations/`. | **TO-CREATE** ✅ (matches §H intent) — but path is new; ensure `shared/AGENTS.md` allows the new subdir. No mismatch — just a new path. |
| §S7: `backend/enum/notifications/email-template-error-code.enum.ts` (create) | L1661 | `backend/enum/notifications/` EXISTS (contains `index.ts`, `notificationDeliveries.enum.ts`). | OK (to-create in existing dir) ✅ |
| §Z7: `eslint.config.js` + `biome.json` overrides for backend `.tsx` | L2152 | Repo has `eslint.config.mjs` (NOT `.js`) and `biome.json`. | **MISMATCH (minor)** — design says `eslint.config.js`; actuality `eslint.config.mjs`. |

**Codebase path mismatches: 3** (§G1 dir, §H stale to-create OK by intent — not a mismatch; eslint extension).

---

## Recommendations for v10

Prioritized by severity. **P0 = blocks implementation correctness, P1 = blocks audit credibility, P2 = cosmetic.**

### P0 — Must fix before implementation begins
1. **Add 10 missing i18n keys to §B catalogue** (§3.2): `dashboard.emailTemplates.editor.shortcuts.{saveDraft,publish,sendTest,close,mergeTags}`, `dashboard.emailTemplates.dnd.{started,over,dropped,cancelled}`, `dashboard.emailTemplates.mergeTag.triggerLabel`. Without these, the v9 V7 fix (announcements) and G4 keyboard-shortcut wiring cannot ship — `t('editor.shortcuts.*')` / `t('dnd.*')` calls (L1534, L1875-1878) will resolve to missing keys at runtime.
2. **Resolve §G1 vs §V2 path/architecture contradiction** (§5.4). Decide ONE: either (a) the reduced-motion signal is a Zustand store at `frontend/common/stores/preferencesStore.ts` + a thin `usePrefersReducedMotion` reader (per §G1), OR (b) a self-contained matchMedia hook at `frontend/common/hooks/usePrefersReducedMotion.ts` (per §V2). The two designs describe different mechanisms for the same hook. Also fix the path `frontend/stores/` → `frontend/common/stores/` (codebase-correct).
3. **Add UI i18n keys for currently-unbound GraphQL error codes** (§3.3): `RATE_LIMITED`, `INVALID_EMAIL`, `INVALID_SAMPLE_PROPS` need canonical `dashboard.emailTemplates.error.*` mapping keys (the existing `toast.rateLimited` / `sendTest.rateLimited` are toast-context, not error-code bindings).

### P1 — Audit credibility / phase-traceability
4. **Reconcile locked-decision count** (§4): either recount to 33 and update all four changelog footers (v7/v8/v8-footer/v9) from "30" → "33", or explicitly enumerate which 30 ids are "locked" vs "carryover" (V3-4 and V3-13 are absent — clarify if intentional renumbering reduced 33 → 30).
5. **Fix Phase Mapping table subsection ranges** (§2.3): §S → S1-S9, §W → W1-W11, §X → X1-X7, §Y → Y1-Y8, §Z → Z1-Z11. Add missing phase placements for §W row (Phase 3 for W10) and §Z row (Phase 1 for Z9 barrel / Z11 stores; Phase 2 for Z10 codegen).
6. **Update §V1 narrative** (L1813-1819) to remove "§G does not exist as a section … §F, §G, §H, §I entirely absent" — this is now false post-v9 and contradicts the now-existing §G/§H. Replace with "(historical: v8 flagged these as dangling; v9 closed via §G/§H creation)".

### P2 — Cosmetic / documentation hygiene
7. **Round-4 size**: change "~235KB" → "~233KB" (or "~232 KiB") at L2190 for accuracy.
8. **Subagent count wording** (L2175): "9 parallel audit subagents, each validating one v8 section (§S–§Z)" → "8 section-audit subagents (§S-§Z) + 1 cross-section consistency subagent" (the §S-§Z set is 8, not 9).
9. **"3 locations" of seed-fix** (L2186): either enumerate the 3 (Phase-1 line, Phase-2 line, item-19 note) or restate as "across Phase-1/Phase-2 definitions + item 19 note + §Y3 body".
10. **eslint config filename** (§Z7/L2152): `eslint.config.js` → `eslint.config.mjs`.
11. **Historical labels**: §G header note (L1442) and §H header note (L1540) reference "lines 790, 884, 1038" and "lines 1971-1972" — these line citations are from v8-era file and have not drifted (verified still valid in v9 file), so OK to keep; just flag that any *future* edit above those lines will silently invalidate the citations. Consider converting to anchor refs.

### Carry-forward (NON-issues, verified clean)
- §Y3 Phase-2 seed fix: correctly applied (Phase-1 says "no seeds", Phase-2 says "seeds", item 19 note updated) ✅
- `duplicateSlug` i18n key: present in §B ✅
- §G and §H sections: both created and now resolve all pre-existing dangling refs ✅
- Todos 22-31: all correctly assigned to sections and phases ✅
- No "12" decision count residue remains anywhere ✅
- `shared/lib/validations/`, `backend/enum/notifications/` — all are correctly design'd as new (to-create) paths in existing parent dirs ✅
