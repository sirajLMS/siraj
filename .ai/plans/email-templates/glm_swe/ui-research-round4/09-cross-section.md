Agent is idle (waiting for messages). agent_id: r4-cross-section, agent_type: explore, status: idle, description: R4: Cross-section consistency, elapsed: 1453s, total_turns: 1

[Turn 0]
I now have all the data I need. The §Q10 reference at line 1524 was just "Q10" without §. Let me confirm the §H target doesn't exist (admitted in V1) and verify the duplicateSlug i18n key is NOT in catalogue. I have enough to write the full report now — the i18n catalogue (§A: templateNotFound, templateNotPublished, unauthorizedEditor, invalidDesignJson, attachmentTooLarge, invalidLocale, renderFailed; §B: loadFailed, previewFailed, notFound, notEditable, versionMismatch, invalidDesignJson, duplicateScopeLocale, missingCompiledHtml, rateLimited, saved...) does NOT include `duplicateSlug`. I have all needed information.

---

# Round 4 Cross-Section Consistency Audit — v8 Plan

**File:** `.cursor/plans/email_template_system_(react_email_+_editor)_08419060.plan.md` (1957 lines, v8)
**Audited range:** §S (L1401) – §Z (L1856), plus full re-scan of §A–§R and todo list (L4–124).

---

## 1. Cross-Reference Integrity

Format note: §A–§R live as `#### X.` headers under "Frontend"/"i18n"; §P/§Q/§R subsections are `**P1.` bold; §S–§Z are `### X.` headers with `#### SX.` subsections.

| Source §S–§Z | Target ref | Target exists? | Status |
|---|---|---|---|
| S2 (L1411) | §P2 | ✅ `**P2.` L888 | OK |
| S4 (L1427) | §P7 | ✅ `**P7.` L925 | OK (correctly flags it as wrong/superseded) |
| S6 (L1442) | (S2 helper) | ✅ | OK |
| S8 (L1452) | §P | ✅ `#### P.` L880 | OK |
| S9 (L1457,1459) | §P7, §Q7 | ✅ both | OK |
| T2 (L1476) | (Q2 cache-first) | ⚠ no `§Q2` token; refers to "Q2" implicitly | Minor |
| T3 (L1487) | "todo 16" | ✅ todo 16 exists | OK |
| T4 (L1498) | §Q1, "line 772" | ✅ `**Q1.` L956; L772 is `emailTemplates` query | OK |
| T8 (L1523) | "(Q10)" | ✅ `**Q10.` L1049 — note token lacks `§` prefix; still resolvable | Minor |
| T9 (L1534) | §Q6, "(Q2)" | ✅ `**Q6.` L1015, `**Q2.` L986 | OK |
| T10 (L1540) | S5 | ✅ §S5 exists | OK |
| U3 (L1561) | "line 774" | ✅ L774 `previewEmailTemplate` query | OK |
| U4 | §E (L1942 changelog claims canonical CSP at §E) | ⚠ no `#### E.` header exists | Dangling |
| V1 (L1592–1598) | §G (×3), §F, §H, §I, §J | §F/§G/§H/§I **ABSENT** — V1 itself documents this as P0 gap | Acknowledged gap |
| V3 (L1610) | §P "status badge update" L949 | ✅ | OK |
| V5 (L1633) | §G | ⚠ same dangling §G (V1 promises creation) | Pending fix |
| W1 (L1677) | `frontend/common/graphql/AGENTS.md` | external | OK |
| W4 (L1700) | §L | ✅ `#### L.` L831 | OK |
| W9 (L1736) | §K, §L | ✅ both | OK |
| W10 (L1741) | §Q4 | ✅ | OK |
| X3 (L1771,1777) | §P1, §P8 | ✅ both | OK |
| X7 (L1794) | §J | ✅ `#### J.` L781 | OK |
| Y3 (L1815) | "Todo 19 note" | ✅ todo 19 | OK |
| Z6 (L1893) | "§GraphQL surface" | ⚠ malformed — "§GraphQL surface" is not a section letter | Dangling |
| Z7 (L1908) | (eslint config) | external | OK |
| Z8 (L1915) | "todo 16" | ✅ | OK |
| Z9 (L1919) | "todo 9" | ✅ | OK |
| Z10 (L1923) | "todo 15" | ✅ | OK |
| Z11 | §E implicitly | ⚠ | Dangling |

**Findings:**
- **§G is referenced 6× (L790, 884, 1038, 1593×3, 1601, 1633) but does NOT exist.** V1 (L1592) explicitly flags this as a P0 gap and plans to CREATE §G — but the creation has not yet happened in v8. This is an **open dangling cross-reference**.
- **§F, §H, §I also do not exist as sections** (confirmed by V1's own admission at L1593). §H is referenced (L932, 951, 1948) as the home for validation schemas. §F referenced L1941 (`§F→§H` cross-ref). §I never referenced.
- **"§E" referenced L1942 (changelog) and §U4 implies it** — but no `#### E.` header exists. The changelog claim "CSP `img-src` canonical at §E" (L1942) is a **dangling self-reference** — there is no §E section.
- **"§GraphQL surface" (Z6, L1893)** — malformed reference, no such section.

---

## 2. i18n Key Completeness

§A (`EmailsErrorLabels`, L1170–1180) provides: `templateNotFound`, `templateNotPublished`, `unauthorizedEditor`, `invalidDesignJson`, `attachmentTooLarge`, `invalidLocale`, `renderFailed`.
§B (`dashboard.emailTemplates.error.*` L1224–1225, plus `toast.*` L1222, `sendTest.rateLimited` L1237) provides: `loadFailed`, `previewFailed`, `notFound`, `notEditable`, `versionMismatch`, `invalidDesignJson`, `duplicateScopeLocale`, `missingCompiledHtml`, `rateLimited`, `saved`, etc.

| Key | Referenced in §S–§Z | Present in §A/§B? | Action needed |
|---|---|---|---|
| `renderFailed` | S5 L1432, safeRender (L1300 impl) | ✅ §A L1179 | None |
| `duplicateScopeLocale` | S6 L1442, Z1 (uses scope) | ✅ §B L1225 | None |
| `duplicateSlug` | S6 L1442, S7 L1447 (enum code) | ❌ **NOT in catalogue** | **Add `duplicateSlug` to §B `error.*`** |
| `attachmentTooLarge` | (referenced generally) | ✅ §A L1177 | None |
| `rateLimited` | V4 L1629, §B L1222/1237 | ✅ §B (toast + sendTest) | ⚠ Defined twice (toast + sendTest) — clarify which scope |
| `versionMismatch` | S2 L1416, V4 L1629 | ✅ §B L1225 | None |
| `RATE_LIMITED`/`DUPLICATE_SLUG` (error codes, not i18n) | S7 L1447 | n/a (GraphQL code enum, not i18n) | OK |
| `featureDisabled` | U1 area | ✅ §B toast L1222 | None |
| `previewFailed` | W8 L1733 | ✅ §B L1224 | None |
| `loadFailed` | W8 L1733 | ✅ §B L1224 | None |

**Findings:**
- **`duplicateSlug` is missing.** S6 (L1442) and S7 (L1447, enum `DUPLICATE_SLUG`) both rely on a `duplicateSlug` i18n key to bind `extensions.code === "DUPLICATE_SLUG"`, but §B `error.*` (L1225) only lists `duplicateScopeLocale`, not `duplicateSlug`. **P0 gap — add to §B.**
- `RATE_LIMITED` appears in the S7 enum (L1447) and as a GraphQL error code, but there's no `RATE_LIMITED` i18n message; `rateLimited` only covers send-test toasts (L1237) and toast.* (L1222), not a generic rate-limit error for the preview-query 30/min limit (U3 L1563). Minor gap.
- `EMAIL_TEMPLATES_DISABLED` (S7 enum L1447, Z U1) has no corresponding i18n key beyond `featureDisabled` (toast). Likely acceptable but note.

---

## 3. Todo Coverage Gap

Current todos: **1, 2, 3, 3a, 4, 5, 6, 7, 7a, 7b, 8, 9, 10, 11, 12, 12a, 13, 14, 15, 16, 16a, 17, 18, 19, 20, 20a, 20b, 21, 21a, 21b, 21c** (31 ids). No new todos added in v8 §S–§Z.

| §S–§Z spec | Todo exists? | Recommended new todo? | Phase |
|---|---|---|---|
| S1 Editor Error Boundary (`EmailEditorErrorBoundary.tsx`) | ❌ No | Yes — new todo | Phase 2 |
| S2 Optimistic lock round-trip | Partial (todo 11 version increment) — but service+GraphQL+frontend wiring NOT covered | Augment todo 11/14 | Phase 2 |
| S3 `EmailSendRetryPolicy` + DLQ | ❌ No | Yes — new todo | Phase 3 |
| S5 safeRender degraded-mode (`success` type change) | ⚠ Alters todo 7b signature | Augment todo 7b | Phase 1 |
| S7 `EmailTemplateErrorCode` enum | ❌ No | Yes — new todo | Phase 1 (enum) / Phase 2 (frontend helper) |
| S8 Toast convention consolidation | ❌ No | Yes — new todo | Phase 2 |
| T1 Memoization discipline | ❌ No | Yes — new todo (verification step) | Phase 2 |
| T3 Lazy-load deps (`next/dynamic`) | ⚠ todo 16 mentions Prism lazy; rest not | Augment todo 16 / new todo | Phase 2 |
| T4 DB indexes | ❌ No | Yes — new todo | Phase 2 |
| T6 `withBundleAnalyzer` wiring | ⚠ todo 20b says "verify" wiring, but doesn't create it | Augment todo 20b to "wire" | Phase 4 (or Phase 0) |
| T9 `cache.evict` | ❌ No | Yes — new todo | Phase 2 |
| U1 `EMAIL_TEMPLATES_ENABLED` registration | ✅ todo 21c note covers it (V4-9) | OK but cross-link to U1 | Phase 1 |
| U2 Server-side zod for sendTest | ❌ No | Yes — new todo | Phase 2 |
| U3 `authScope` on preview query | ⚠ todo 14 notes notImpersonating; preview query authScope not explicit | Augment todo 14 | Phase 2 |
| U4 CSP via iframe `srcdoc` | ❌ No (todo 12a assumes a route header) | Yes — **CONTRADICTS todo 12a** | Phase 2 |
| W1 `test/email/` directory | ❌ No (todo 16 covers components, not GraphQL integration) | Yes — new todo | Phase 2 |
| W2 Apollo mock factories | ❌ No | Yes — new todo | Phase 2 |
| W3 `emailTemplateFixtures.ts` | ❌ No (fixtures dir only has `adminDashboardFixtures.ts`) | Yes — new todo | Phase 2 |
| W4 ViewModel hook tests | ⚠ todo 16 mentions tests but no `renderHook` pattern | Augment todo 16 | Phase 2 |
| X1 `scripts/email-setup.ts` | ❌ No | Yes — new todo | Phase 4 (DX) |
| X4 `MockEmailAdapter.ts` | ❌ No | Yes — new todo | Phase 1 or Phase 4 |
| Y5 `scripts/email-post-deploy-check.ts` | ❌ No | Yes — new todo | Phase 3 |
| Y6 `EMAIL_TEMPLATE_SCOPES_ENABLED` env var | ❌ No | Yes — new todo | Phase 3 |
| Z1 Per-scope `EmailLabels` interfaces | ⚠ todo 8 says "labels for all EmailScopes" — broadly matches | Augment todo 8 to be explicit | Phase 1 |
| Z3 `ComplaintReturnType.title` fix | ❌ No | Yes — new todo | Phase 1 (blocks Z1) |
| Z4 `EmailAttachmentEncoding` enum | ❌ No | Yes — new todo | Phase 1 |
| Z7 `.tsx` ESLint/Biome override | ❌ No | Yes — new todo | Phase 1/Phase 0 |
| Z11 Second Zustand store | ⚠ todo 16 files ONE store; Z11 requires two | Augment todo 16 | Phase 2 |

**Finding:** **18+ new todos are required and NONE exist.** This is the single largest v8 gap. The Phase 0-4 summary (L1953–1957) does not list any §S–§Z work, and the todo list (L4–124) stops at "21c" — completely frozen at v7.

---

## 4. Phase Assignment Accuracy

Current phase mapping (L1953–1957): Phase 0 deps · Phase 1 types/registry/safeRender/i18n · Phase 2 DB/repo/GraphQL/UI · Phase 3 dispatcher · Phase 4 bundle/auth-emails.

| §S–§Z spec domain | Recommended phase | Plan says | Assessment |
|---|---|---|---|
| §U Security (U1–U7) | Mixed: U1/U3/U4 = Phase 2; U2 = Phase 2; U5/U6/U7 = Phase 1/2 | v8 doesn't phase-assign §U at all | **Requires explicit phasing** |
| §W Testing (W1–W11) | W1–W5 = Phase 2; W6–W11 = Phase 2/3 | Not phase-assigned | **Requires explicit phasing** |
| §Y Migration (Y1–Y8) | Y1–Y4 = Phase 2; Y5–Y7 = Phase 3; Y8 docs = Phase 3 | Not phase-assigned | **Requires explicit phasing.** Y3 explicitly says "seeds should be Phase 2" — contradicts todo 19 note which says "Phase 1" |
| §X DX (X1–X7) | X1/X4 = Phase 4 (DX-only); X2/X3 = Phase 2; X6/X7 = Phase 5 | Not phase-assigned | **Requires explicit phasing.** Y8 (L1845–1852) invents a "deployment order" with 5 steps but adds "Phase 4 = bundle+auth" only — §X not reconciled |
| §S Error Handling | S1/S2/S6/S7 = Phase 2; S3 = Phase 3; S4/S5/S8/S9 = Phase 1/2 | Not phase-assigned | **Requires explicit phasing** |
| §T Performance | T1/T2/T3/T4/T6/T7/T8 = Phase 2; T5 = Phase 2; T9 = Phase 2; T10 = Phase 1 | Not phase-assigned | Requires explicit phasing |
| §V A11y/RTL | V1/V2/V3/V4 = Phase 1/2; V5–V8 = Phase 2 | Not phase-assigned | Requires explicit phasing. **V2 `usePrefersReducedMotion` is referenced Phase 1-style but lives in Phase 2 UI** |
| §Z Implementation Patterns | Z1–Z4 = Phase 1; Z5–Z8 = Phase 1/2; Z9–Z11 = Phase 2 | Not phase-assigned | Requires explicit phasing. **Z3 ComplaintReturnType.title is a Phase-1 BLOCKER for seeds** |

**Critical contradiction:** **Y3 (L1815–1818) explicitly contradicts todo 19's note (L94–97).** Todo 19 says "seeds should be Phase 1"; Y3 says move seeds to Phase 2 (after DB schema). The v8 §Y section is correct (seeds need the `email_templates` table = Phase 2), but **todo 19 is now stale and the Phase 1 summary line (L1954) still lists "seed default templates"** — internal contradiction.

---

## 5. Locked-Decision Preservation

Auditor's list claims "12 locked decisions" but enumerates 15 items; v8 changelog (L1931, L1933) claims **"All 12 v1-v7 locked decisions preserved verbatim"** (twice). The discrepancy itself (12 vs 15) is an inconsistency.

| # | Decision | Present? | Line |
|---|---|---|---|
| 1 | EmailEditorWrapper `ssr:false` | ✅ | L1406, L850, L1406 |
| 2 | ScopedCssBaseline | ✅ | (story context, referenced) |
| 3 | EmailTheming `/plugins` import | ✅ | L1380 (V4-7) |
| 4 | Atomic save flow | ✅ | L62 (todo 12), L1002 |
| 5 | File/Blob in useRef | ✅ | L1057, L877 |
| 6 | GraphQL docs at `frontend/common/graphql/sharedDocuments/email/` | ✅ | L78, L796 |
| 7 | `useQuery` from `@apollo/client/react` | ✅ | L803 |
| 8 | StatusBadge canonical | ✅ | L858 `#### N.` |
| 9 | Admin routes | ✅ | L88 (`#### O.`), todo 17 |
| 10 | Two-layer permission gate | ✅ | L74 (todo 14 notImpersonating), L1948 |
| 11 | `img-src 'self' data:` | ✅ | L66 (todo 12a), L1568 (U4) |
| 12 | `getBooleanEnv` | ✅ | L124 (todo 21c V5-2), L584, L1548 |
| 13 | LOCKSTEP i18n (en/ar atomic) | ✅ | L1182, L1241 |
| 14 | CSF3 Storybook | ✅ | L808 |
| 15 | No separate mock-store | ✅ | L83, L877, L1395 |

**Finding:** All 15 locked decisions are preserved verbatim. **But the count is wrong** — the auditor gives 15 items but labels the list "12 locked decisions" and the v8 changelog also says "12". Either the changelog undercounts (15 actually present) or three items should be promoted from "convention" to "locked". **The "12" claim is inconsistent with the 15 items actually verified.**

---

## 6. Section Letter Inventory

**Headers present in v8:**
- `#### A.` (L1166), `#### B.` (L1194) — i18n catalogue (under "i18n")
- `#### J.` (L781), `#### K.` (L806), `#### L.` (L831), `#### M.` (L794), `#### N.` (L858), `#### O.` (L866) — Frontend
- `#### P.` (L880), `#### Q.` (L954), `#### R.` (L1065) — State/Data/Responsive
- `### S.` (L1401), `### T.` (L1464), `### U.` (L1544), `### V.` (L1590), `### W.` (L1668), `### X.` (L1750), `### Y.` (L1799), `### Z.` (L1856)

**Section letters absent:** C, D, E, F, G, H, I.

**Letters referenced but NOT present as sections:**
- **`§G`** — referenced 6× (L790, 884, 1038, 1593×3, 1601, 1633). V1 admits this and schedules creation; **still dangling in v8**.
- **`§H`** — referenced L932, 951, 1941, 1948 ("validation schema in §H"). No `#### H.` header. Inline schema content appears elsewhere but no §H anchor.
- **`§F`** — referenced L1941 ("§F→§H cross-ref"). No `#### F.` header.
- **`§I`** — V1 (L1593) lists it as "absent" but it's never actually referenced anywhere. Phantom.
- **`§E`** — referenced L1942 (changelog "CSP `img-src` canonical at §E"). No `#### E.` header.
- **`§D`** — referenced L931, 932 (draft+navigate guard), L1941. No `#### D.` header, but inline `beforeunload`/nav-guard content exists at L931–932.
- **`§C`** — never referenced. Gap.

**Letters referenced and present:** A, B, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z — all exist.

**Collisions:** None (no two sections share a letter).
**Gap pattern:** Letters C–I are missing as headers; the plan uses `#### J.` as the first Frontend header instead of `#### C.`. The §A/§B under "i18n" are a separate namespace from the Frontend J–R sequence, which is genuinely confusing and creates the appearance that C–I are missing. V1's claim that "Headers jump §A–§J (§F, §G, §H, §I entirely absent)" is accurate.

**Sub-letter inventory:** S1–S9, T1–T10, U1–U7, V1–V8, W1–W11, X1–X7, Y1–Y8, Z1–Z11 — all sequential, no sub-letter collisions.

---

## 7. Duplicate / Contradiction Findings

**Contradictions:**

1. **Y3 vs todo 19 vs Phase 1 summary (HIGH).** Y3 (L1815): seeds belong in Phase 2. Todo 19 note (L97): "seeds should be Phase 1." Phase 1 summary (L1954): "seed default templates." Three-way contradiction. Y3 is correct; the other two are stale.

2. **U4 vs todo 12a (HIGH).** U4 (L1567): "CSP injection via iframe `srcdoc` ... NOT a route header." Todo 12a (L66): "previewEmailTemplate query must set CSP headers ... on the preview route." Directly contradictory — U4 is correct (CSP on a GraphQL route would break the endpoint).

3. **Z5 vs todo 13 note (MEDIUM).** Z5 (L1888): `findByIdempotencyKey` is the WRONG convention — change to `findByIdempotencyKeys` (plural). Todo 13 note (L72, V5-1): specifies `findByIdempotencyKey(key: string)` (singular, no tx). Z5 supersedes this; todo 13 not updated.

4. **V4 i18n pluralization vs V5-10 / V4-10 (MEDIUM).** V4 (L1616) says "All 9 pluralizable toast/error keys use `(count: number) => string`". But §B (L1222) lists `saved: () => string` (no args), `testSent: (to: string)`, `copyHtmlCopied: () => string` — only some are count-based. The "9 pluralizable keys" count is unverified.

5. **Z11 vs todo 16 (MEDIUM).** Z11 (L1925): "Plan only files ONE store ... there are two stores." Todo 16 (L81): only `emailTemplateEditorStore.ts`. Contradiction acknowledged but todo not split.

6. **S8 severity vs §P (MEDIUM).** S8 (L1452) flags that `notifications.show(msg, {severity})` is wrong per codebase; §P (L894+) assumes the severity arg works. S8 itself defers the resolution as a "verify" step — leaves the contradiction live.

**Duplicates (content repeated without new info):**

7. **S5 degraded-mode and todo 7b** — S5 re-specifies the safeRender fallback already in todo 7b (L42). Adds the `{degraded}` return-type change (new) — NOT pure duplication, but overlaps ~60%.
8. **T8 URL.revokeObjectURL** duplicates the cleanup already implicit in todo 16's "lazy-load" + V5-8. New (adds specific pattern), so not pure dup.
9. **Duplicate `rateLimited` i18n key** — defined in both `toast.rateLimited` (L1222) and `sendTest.rateLimited` (L1237). Same signature, different surfaces — acceptable but should be noted as intentional.

No large blocks of pure verbatim duplication were found between §S–§Z and §A–§R.

---

## 8. Changelog Accuracy (v8 entry, L1931–1933)

The v8 changelog entry claims:
- "206 gaps identified across 8 audit reports (168KB, 1405 lines)" — unverifiable here (research files external); assume correct.
- Lists §S–§Z topics — all 8 sections exist ✅.
- "editor error boundary, optimistic lock round-trip wiring, outbound send retry + DLQ, safeRender degraded-mode signal, server-side input validation, env key registration, preview query authScope, CSP iframe injection, Arabic pluralization rules, screen reader live regions, keyboard shortcuts, GraphQL integration test directory, Apollo mock factories, test fixtures, single-command bring-up, mock email adapter, rollback runbook, per-scope canary opt-in, monitoring alerts, per-scope EmailLabels field lists, ComplaintReturnType.title fix, enum for EmailPayload.encoding, barrel export + codegen glob + two Zustand stores" — all verifiable in §S–§Z ✅.

**Inaccuracies:**
1. **"All 12 v1-v7 locked decisions preserved verbatim"** — count is wrong; 15 are actually present (or 3 are mislabeled). Stated twice (L1931, L1933).
2. **Changelog does NOT mention the 18+ missing todos** — it presents §S–§Z as "applied enhancements" but none are wired to the todo list. Misleading — readers assume work is actioned.
3. **Changelog does NOT mention the §G/§F/§H/§I/§E dangling-reference gaps**, despite V1 explicitly identifying them. Self-contradictory.
4. **Changelog mentions "barrel export + codegen glob + two Zustand stores"** (Z8/Z9/Z10/Z11) but these are scheduled ("Add to todo X") rather than applied — wording implies completion.
5. **No mention of the Y3 seed-phase contradiction** or the U4-vs-todo-12a CSP contradiction.

---

# Top-10 Actionable Recommendations for v9

1. **Create §G (Accessibility & Interaction Patterns) and §H (Validation Schemas) as real sections**, or systematically rewrite every `§G`/`§H`/`§F`/§E` reference to point to the actual inline content. Today 6 dangling `§G` refs survive and V1 only *plans* the fix without executing it. **(P0)**

2. **Add ~18 new todos** for the §S–§Z specs (S1, S3, S7, S8, T1, T3, T4, T6, T9, U2, U4, W1, W2, W3, W4, X1, X4, Y5, Y6, Z3, Z4, Z7, plus augment 11/14/16). The todo list is frozen at 21c and silently omits the entire v8 work surface. **(P0)**

3. **Add `duplicateSlug` to the §B i18n error catalogue** (L1225) and verify it's locked-step with en/ar. S6+S7 depend on it. **(P0)**

4. **Resolve the Y3 / todo 19 / Phase 1 seed-phase contradiction.** Move seeds to Phase 2 (per Y3) and update todo 19 note + Phase 1 summary line (L1954) to remove "seed default templates." **(P0)**

5. **Resolve U4 vs todo 12a CSP contradiction.** Update todo 12a to specify `srcdoc` `<meta>` injection (per U4), not a route header, OR remove todo 12a in favor of a new U4 todo. **(P0)**

6. **Fix the malformed `§E` canonical-CSP reference** (L1942 changelog) — point it to todo 12a / U4 instead, since no `#### E.` section exists.

7. **Fix the malformed "§GraphQL surface" reference** in Z6 (L1893) to `#### M. GraphQL Documents` (L794) or the Pothos surface (L771).

8. **Add explicit Phase assignments for all §S–§Z specs** (a one-line "Phase: X" per subsection, or a phase-mapping table). Today none of §S–§Z is phase-labelled, making the Phase 0–4 summary (L1953–1957) incomplete. Prioritize: §Z (Phase 1 blockers: Z1/Z3/Z4), §U (Phase 2), §V (Phase 2), §T (Phase 2), §S (mixed), §W (Phase 2/3), §X (Phase 4), §Y (Phase 3).

9. **Reconcile the "12 locked decisions" count.** Either (a) relabel the count to 15 to match what's verifiable, or (b) demote CSF3/no-mock-store/something-else to "convention" status and stop calling them locked. The current "12" appears in the v8 changelog but 15 items are enumerated in the audit checklist.

10. **Re-run a targeted cross-reference indexer on v9.** The §G/§H/§F/§I absence, the "§GraphQL surface" token, and the implicit `Q10`/`Q2` references (L1523, L1476 miss the `§` prefix) show that no automated link-check was performed. Add a build-time `grep -oE '§[A-Z][0-9]*[a-z]?' | diff-against-headers` step to the plan's CI.

**Overall:** v8 successfully adds 8 substantive audit sections (§S–§Z), but **fails to wire them into the action surface** — the todo list, phase summary, and several inline cross-references are stale or contradictory. The 18+ missing todos and 3 high-severity contradictions (Y3 seed phase, U4 CSP, Z5 idempotency naming) are the most urgent v9 fixes.