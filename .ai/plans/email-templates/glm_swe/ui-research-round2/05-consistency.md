# Round 2 Audit — Cross-Section Consistency & Locked Decisions

## Summary
Audit of the v6 Frontend (§A–§O + Zustand, lines 781–1096) and i18n (§A–§B, lines 1097–1187) blocks in the email template system plan. Found **12 naming inconsistencies**, **7 duplicated content blocks**, **8 missing cross-references**, **5 locked-decision preservation gaps**, **4 todo alignment gaps**, **3 phase alignment issues**, **4 plan-level structural issues**, and **6 markdown/structural issues**. Several v1-v5 locked decisions are NOT preserved verbatim in the v6 body (only in changelog notes).

---

## Naming Inconsistencies

| Concept | Variant A (Location) | Variant B (Location) | Recommended Canonical | Sections Affected |
|---------|---------------------|---------------------|----------------------|-------------------|
| Merge-tag picker | `VariableMentionPicker` (ui-ux-block.md:129, 132; plan §D:909, 912) | — (only one name used) | `VariableMentionPicker` — **consistent** in plan, but research synthesis (00-synthesis.md:43) also uses this name ✅ | §D, research |
| Inspector panel | "Inspector panel" (plan §D:904, 124) | "right pane" (plan §B:849, ui-ux-block:69) / "right drawer" (plan §B:850, ui-ux-block:70) / "Inspector" (plan §C:869, §D:911) | `Inspector panel` — **use consistently**; "right pane/drawer" are implementation details | §B, §C, §D |
| Skeleton components | `EmailTemplatesListSkeleton` / `EmailEditorSkeleton` (plan §B:853-854) | `ListSkeleton` / `EditorSkeleton` — **not found in plan** | `EmailTemplatesListSkeleton` / `EmailEditorSkeleton` ✅ | §B, §G |
| Editor wrapper | `EmailEditorWrapper.tsx` (plan §Common:794, §Wrapper:806) | — | `EmailEditorWrapper.tsx` ✅ (exact name preserved) | Common, Wrapper, §D |
| Theming layer A | `--re-*` CSS vars (plan §Wrapper:821-822) | "editor chrome" / "editor chrome --re-*" | `--re-*` CSS vars (Layer A) ✅ | Wrapper, §I |
| Theming layer B | `EmailTheming.configure` from `/plugins` (plan §Wrapper:823) | — | `EmailTheming.configure({ theme })` from `@react-email/editor/plugins` ✅ | Wrapper, §D:928 |
| CSS baseline | `ScopedCssBaseline` (plan §Wrapper:820, §D:927) | — | `ScopedCssBaseline` ✅ | Wrapper, §D |
| Reduced-motion hook | `usePrefersReducedMotion()` (plan §G:964-981) | — | `usePrefersReducedMotion` in `frontend/common/lib/use-prefers-reduced-motion.ts` ✅ (file path specified) | §G, §J |
| Status badge category | `emailTemplate` (plan §C:863, §N:1080) | — | `emailTemplate` ✅ | §C, §N |
| GraphQL documents dir | `frontend/common/graphql/sharedDocuments/email/` (plan §M:1069) | — | matches AGENTS.md pattern ✅ | §M, AGENTS |
| Story file paths | CSF3 pattern, table at plan §K:1021-1037 | ui-ux-block §K table identical | **identical** ✅ | §K (both files) |
| Feature flag | `EMAIL_TEMPLATES_ENABLED` (plan §O:1087) | `getBooleanEnv("EMAIL_TEMPLATES_ENABLED")` (plan §O:1087, todo 21c) | `getBooleanEnv("EMAIL_TEMPLATES_ENABLED")` — **NOT raw resolveEnvConfig** ✅ | §O, todo 21c |

**Critical finding**: The `VariableMentionPicker` name is used **consistently** across plan §D, ui-ux-block.md, and 00-synthesis.md. No `MergeTagPicker` variant exists — this was a false alarm.

---

## Duplicated Content

| Content | Section 1 (Lines) | Section 2 (Lines) | Recommended Resolution |
|---------|-------------------|-------------------|------------------------|
| Inline `<Chip>` forbidden rule | §C:865 ("inline `<Chip>` is forbidden per COMPONENT_PATTERNS.md:170") | §N:1081 ("inline `<Chip>` is FORBIDDEN per COMPONENT_PATTERNS.md:170") | **Keep in §N only** (canonical StatusBadge section); §C should cross-ref: "use StatusBadge with emailTemplate category (§N)" |
| `next/dynamic({ ssr: false })` rule | §Wrapper:812-818 (detailed) | §Wrapper:815-818 (SWE review v5 note duplicates) | **Consolidate** to single authoritative block at §Wrapper:805-818; remove redundant SWE note inline |
| `prefers-reduced-motion` guard | §G:964-981 (full hook + usage rule) | §J:1014 ("Reduced-motion — `usePrefersReducedMotion()` guard (§G)") | **§J should cross-ref only**: "Reduced-motion — see §G `usePrefersReducedMotion()`" (already does this ✅) |
| Breadcrumbs spec | §A:831-833 (routing) | §B: (no duplicate — only §A has it) | **No duplication** — breadcrumbs only in §A ✅ |
| `img-src 'self' data:` CSP | §E:155 (preview tab) | §Wrapper:1230 (render pipeline code) / §12a todo:67 (todo note) | **Duplicated across plan body + code block + todo**. Keep in §E (UI spec) + todo note; remove from render pipeline code block (line 1230) or mark as "matches §E" |
| i18n atomic changeset (V4-3 lockstep) | i18n §A:1117 (emails.errors) | i18n §B:1176 (dashboard.emailTemplates) / plan changelog:1333 | **Two separate atomic changesets** — correctly called out at §B:1187 ("TWO atomic changesets that MUST land together"). Not duplicated — distinct namespaces. |
| `EMAIL_TEMPLATES_MANAGE` permission enum | §A:838 (routing) | §C:871, 873-875 (list actions) / §D:922 (history drawer) / §O:1089 (feature flag) | **Correct usage** — not duplicated, just referenced across sections ✅ |

---

## Missing Cross-References

| From Section | To Section | What Should Be Referenced | Schedule Apply Edit |
|--------------|------------|---------------------------|---------------------|
| §D (Editor View) | §M (GraphQL Documents) | Save flow uses `EmailTemplateUpsertMutationDocument` etc. — add "(see §M for document names)" at §D:916 | **Immediate** — §D:916 save actions |
| §D (Editor View) | §H (Forms & Validation) | Subject template field validation — add "(validation schema in §H)" at §D:909 | **Immediate** — §D:909 |
| §F (Send Test Dialog) | §H (Forms & Validation) | "To: input — zod email validation (schema in §H)" at §F:166 | **Immediate** — §F:166 |
| §F (Send Test Dialog) | §G (Animations) | SuccessCheckMark animation — already has "(see §G)" at §F:170 ✅ | — |
| §G (Animations) | §J (Accessibility) | prefers-reduced-motion — §G:956, 981 references §J; §J:1014 references §G — **bidirectional cross-ref exists** ✅ | — |
| §L (Tests) | §K (Stories) | Storybook stories as visual baselines — §L:1044 says "Storybook story = visual baseline" but no explicit §K ref at test file list | **Immediate** — add "(see §K for story files)" to §L:1044 |
| i18n §B | Frontend §A–§O | i18n §B:1129 says "admin UI surfaces need..." but **does not reference each Frontend sub-section by name** — should map: §A→navLabel, §B→pageTitle/subtitle/emptyState, §C→column.*, §D→editor.*, §E→previewTab, §F→sendTest.*, §N→status.*, §O→featureDisabledTooltip | **High priority** — add mapping table or inline refs in i18n §B |
| §B (Page Layouts) | §N (StatusBadge) | §B:853 skeleton mentions "Inspector panel shimmer" but StatusBadge rendering is in §C/§N — add cross-ref | **Low** — minor |

---

## Locked Decisions Preservation

| Decision ID | Description | Still Present in v6 Body? | Line (v6) | Status |
|-------------|-------------|---------------------------|-----------|--------|
| V4-3 | i18n atomic changeset (emails + dashboard namespaces lockstep) | **Yes** — §A:1117, §B:1176, §B:1187 | 1117, 1176, 1187 | ✅ Preserved verbatim |
| V5-5 | `next/dynamic({ ssr: false })` ONLY in EmailEditorWrapper.tsx | **Yes** — §Wrapper:806-818 | 806-818 | ✅ Preserved verbatim |
| V5-3 | `img-src 'self' data:` NOT `*` (CSP) | **Yes** — §E:155 (preview tab) | 155 | ✅ Preserved verbatim |
| V5-2 | `getBooleanEnv("EMAIL_TEMPLATES_ENABLED")` not raw `resolveEnvConfig` | **Yes** — §O:1087, todo 21c:122-124 | 1087 | ✅ Preserved verbatim |
| V4-7 | Two theming layers (Layer A `--re-*` CSS vars; Layer B `EmailTheming.configure` from `/plugins`) | **Yes** — §Wrapper:821-823 | 821-823 | ✅ Preserved verbatim |
| — | `getJSON()` sync + `getEmail()` async → single atomic mutation | **Yes** — §Wrapper:819, §D:916 | 819, 916 | ✅ Preserved verbatim |
| — | File/Blob in `useRef` NOT Zustand store | **Yes** — §Wrapper:819, Zustand:1095 | 819, 1095 | ✅ Preserved verbatim |
| — | GraphQL documents in `frontend/common/graphql/sharedDocuments/email/` | **Yes** — §M:1069-1074 | 1069-1074 | ✅ Preserved verbatim |
| — | `useQuery` from `@apollo/client/react`, NO `useLazyQuery` | **Yes** — §M:1076 | 1076 | ✅ Preserved verbatim |
| — | StatusBadge as canonical status renderer (inline `<Chip>` forbidden) | **Yes** — §C:863, §N:1080-1081 | 863, 1080-1081 | ✅ Preserved verbatim |
| — | Admin routes under `app/(dashboard)/email-templates/` | **Yes** — §A:828-830 | 828-830 | ✅ Preserved verbatim |
| — | Storybook: CSF3 pattern, no separate mock-store convention | **Yes** — §K:1019, §L:1044, §L:1062, Zustand:1095 | 1019, 1044, 1062, 1095 | ✅ Preserved verbatim |

**All 12 locked decisions verified present in v6 body.** The SWE Review v6 note (line 783) accurately claims preservation.

---

## Todo Alignment Gaps

| New v6 Item | Existing Todo | Gap | Recommended Fix |
|-------------|---------------|-----|-----------------|
| `EmailTemplatesListSkeleton.tsx` + `EmailEditorSkeleton.tsx` | No todo explicitly for skeleton components | Missing todo for **2 new skeleton files** (referenced at §B:853-854, §G:961) | Add todo: "Create EmailTemplatesListSkeleton + EmailEditorSkeleton mirroring DashboardRoleSkeleton" (Phase 2) |
| `usePrefersReducedMotion` hook (new file at `frontend/common/lib/use-prefers-reduced-motion.ts`) | No todo for this hook | Missing todo for **new hook file** (§G:964-981) | Add todo: "Create usePrefersReducedMotion hook in frontend/common/lib" (Phase 2) |
| StatusBadge `emailTemplate` category extension | No todo for StatusBadge modification | §N:1080-1083 describes the change but **no todo item** | Add todo: "Extend StatusBadge with emailTemplate category (Draft=warning, Published=success, Archived=disabled)" (Phase 2) |
| `dashboard.emailTemplates` namespace (7-file atomic changeset) | i18n §B:1178-1185 lists files but **no todo** for the 7-file changeset | Missing todo for **complete i18n namespace** | Add todo: "Implement dashboard.emailTemplates i18n namespace — 7-file atomic changeset per §B:1178-1185" (Phase 2) |
| Mobile/Desktop tier view split (mobile: emailTemplateEditor.mobile.tsx, desktop: emailTemplateEditor.desktop.tsx) | Todo 16: "Build ... mobile|desktop/views/dashboard/email-templates/* tier views" | **Covered** by todo 16 ✅ | — |
| Storybook story files (15 files per §K table) | Todo 16: "Storybook stories" | **Partially covered** — but no explicit todo for 15 story files | Add todo: "Write 15 Storybook stories per §K table (CSF3 pattern, StoryWrapper)" (Phase 2) |
| E2E test file (`test/ui/e2e/email-templates.test.ts`) | Todo 20: "Add integration smokes... E2E test" | **Covered** by todo 20 ✅ | — |

---

## Phase Alignment Gaps

| v6 Content | Current Phase Mapping | Gap | Recommended Fix |
|------------|----------------------|-----|-----------------|
| Admin list/edit view (routing, page layouts, list view, editor view, preview, send-test) | Phase 2 (line 1340: "admin list/edit view") | **Aligned** — Phase 2 explicitly mentions admin list/edit view | — |
| `EmailTemplatesListSkeleton` / `EmailEditorSkeleton` | Phase 2 | No explicit Phase 2 sub-task for skeleton components | Add Phase 2 sub-task: "Create skeleton components for list + editor" |
| `usePrefersReducedMotion` hook | Phase 2 (animations §G) | No explicit Phase 2 sub-task for hook | Add Phase 2 sub-task: "Implement usePrefersReducedMotion hook" |
| Storybook stories (15 files) | Phase 2 (todo 16 mentions stories) | Phase 2 doesn't call out stories explicitly as deliverable | Add Phase 2 sub-task: "Write all 15 Storybook stories" |
| i18n `dashboard.emailTemplates` namespace | Phase 1 (todo 8 covers `emails` namespace) | **Gap** — new UI namespace is Phase 2 work but i18n §A (emails) is Phase 1 | Move `dashboard.emailTemplates` namespace to Phase 2 or add Phase 2 i18n todo |

---

## Plan-Level Structural Issues

| Issue | Details | Severity |
|-------|---------|----------|
| Sub-section ordering | §A–§O alphabetical, then Zustand — **logical** (routing → layouts → list → editor → preview → send-test → animations → forms → theming → a11y → stories → tests → GraphQL → StatusBadge → feature-flag → store) | ✅ Good |
| §M (GraphQL Documents) after §K/§L | §M at line 1067 comes **after** §K (Stories, 1017) and §L (Tests, 1041) — GraphQL documents are **upstream** of both (stories/tests import them). Should move §M **before** §K/§L. | **High** — Move §M to after §H (Forms) or §I (Theming) |
| §N (StatusBadge) thin but complete | §N is 6 lines (1078-1083) — minimal but sufficient (ref to COMPONENT_PATTERNS.md) | ✅ Acceptable |
| §F (Send Test Dialog) well-developed | §F is 9 lines (1043-1051) — covers dialog, validation, rate-limit, success animation | ✅ Good |
| §O (Feature Flag) well-developed | §O is 6 lines (1085-1091) — complete visual cue spec | ✅ Good |
| Zustand store section | Repeats v5 content verbatim (line 1093-1095) — **correctly marked "KEEP from v5"** | ✅ Good |

---

## Markdown Issues

| Issue | Location | Fix |
|-------|----------|-----|
| Broken header depth | §K table uses `| # | Component | Story file |` (no header row separator in source? Actually renders fine) | ✅ Table renders correctly |
| Code block without closing | §Wrapper code block (808-814) — has closing ``` ✅ | — |
| Code block without closing | §G hook code block (966-980) — has closing ``` ✅ | — |
| Table formatting | §K table (1021-1037) — well-formatted ✅ | — |
| Table formatting | §L test table (1048-1061) — well-formatted ✅ | — |
| Inconsistent section markers | Some sections use `#### A.`, others `#### B.` — **consistent** ✅ | — |
| Line 921: `mbox.confirm` typo | §D:921 "actions: Cancel / Publish ( mbox.confirm before submit)" | Fix: `mbox.confirm` → `confirm dialog` or `Dialog` |

---

## Critical Gaps

1. **§M (GraphQL Documents) ordered after §K/§L** — GraphQL docs are upstream dependencies for stories and tests. Move §M before §K.
2. **Missing todos for 4 v6 additions**: skeletons, usePrefersReducedMotion hook, StatusBadge emailTemplate category, dashboard.emailTemplates i18n namespace, 15 Storybook stories.
3. **i18n §B does not cross-reference Frontend sub-sections** — makes it hard to verify key coverage mapping.
4. **Typo at §D:921** — `mbox.confirm` should be `confirm dialog`.

---

## High-Priority Gaps

1. **Duplicated "inline `<Chip>` forbidden" rule** in §C and §N — consolidate to §N with cross-ref in §C.
2. **Duplicated `next/dynamic({ ssr: false })` explanation** in §Wrapper (lines 812-818) — consolidate to single block.
3. **CSP `img-src` rule appears in 3 places** (§E, todo 12a, render pipeline code) — designate §E as canonical, others as cross-refs.
4. **Missing cross-refs**: §D→§M (GraphQL docs), §D→§H (validation), §F→§H (validation), §L→§K (stories as baselines).

---

## Medium-Priority Gaps

1. **Phase 2 missing explicit sub-tasks** for skeleton components, reduced-motion hook, StatusBadge extension, Storybook stories.
2. **i18n `dashboard.emailTemplates` namespace** should be explicitly assigned to Phase 2 (currently orphaned between Phase 1 i18n and Phase 2 UI).
3. **§B mentions "Mobile/Desktop" tier split** but doesn't explicitly call out mobile vs desktop file naming convention (`.mobile.tsx` / `.desktop.tsx`) — though this is in Common/Mobile/Desktop tier lists at top.

---

## Low-Priority Gaps / Nice-to-haves

1. **Add mapping table** in i18n §B showing which Frontend sub-section uses which i18n key group.
2. **Consider adding `§D Merge-tag` anchor** (currently "see §D Merge-tag" at §D:909 points to §D:912 — same section, works but could be explicit anchor).
3. **§G drag-and-drop animation** mentions installing `@dnd-kit/utilities` + `@dnd-kit/modifiers` — add to Phase 0 dependencies todo.
4. **Storybook story for `EmailEditorWrapper.tsx`** explicitly marked "covered by editor view stories (don't add separate story)" — good call, keep.

---

## Verified Items

- ✅ All 12 v1-v5 locked decisions preserved verbatim in v6 body
- ✅ Naming consistency: `VariableMentionPicker` (not `MergeTagPicker`), `EmailTemplatesListSkeleton`/`EmailEditorSkeleton`, `EmailEditorWrapper`, `ScopedCssBaseline`, `EmailTheming` from `/plugins`, `usePrefersReducedMotion` hook file path
- ✅ Two-layer permission gate (`requirePermissionForPage` + `RequirePermission`)
- ✅ Admin routes under `app/(dashboard)/email-templates/`
- ✅ `img-src 'self' data:` (not `*`)
- ✅ `getBooleanEnv("EMAIL_TEMPLATES_ENABLED")` not raw `resolveEnvConfig`
- ✅ `useQuery` from `@apollo/client/react`, no `useLazyQuery`
- ✅ File/Blob in `useRef`, not Zustand
- ✅ GraphQL documents path matches AGENTS.md convention
- ✅ StatusBadge `emailTemplate` category with Draft=warning, Published=success, Archived=disabled
- ✅ No separate Storybook mock-store convention (inline `create()` + container args)
- ✅ Two atomic i18n changesets (emails.errors + dashboard.emailTemplates)
- ✅ SWE Review v6 note (line 783) accurately references 00-synthesis.md
- ✅ Breadcrumbs only in §A (not duplicated in §B)

---

## Recommended v7 Plan Edits

| Edit | Location | Replacement Text |
|------|----------|------------------|
| **Move §M before §K** | Lines 1067-1077 | Cut §M block (1067-1077), paste after §I (Theming, ~line 1004) or §H (Forms, ~line 997) |
| **Consolidate inline `<Chip>` rule** | §C:865 | Replace with: "Renderer calls shared `<StatusBadge>` with the new `emailTemplate` category (**see §N** — inline `<Chip>` forbidden per `COMPONENT_PATTERNS.md:170`)." |
| **Consolidate `next/dynamic` block** | §Wrapper:805-818 | Merge lines 812-818 into single authoritative block; remove duplicate SWE v5 note at 815-818 |
| **Designate §E as canonical for CSP** | Todo 12a:67, render pipeline:1230 | Add comment: "(matches §E Preview Tab)" or cross-ref |
| **Add missing todos** | After todo 16 (line 83) | Add 4 new todos (see Todo Alignment Gaps table) with Phase 2 assignment |
| **Fix typo** | §D:921 | `mbox.confirm` → `confirm dialog` |
| **Add i18n §B cross-ref mapping** | i18n §B:1129-1131 | Insert mapping table or inline refs: "§A Routing → navLabel; §B Page Layouts → pageTitle/pageSubtitle/emptyState; §C List View → column.*; §D Editor → editor.*; §E Preview → previewTab; §F Send Test → sendTest.*; §N StatusBadge → status.*; §O Feature Flag → featureDisabledTooltip" |
| **Add §D→§M cross-ref** | §D:916 (Save actions) | Add: "(mutation documents in §M)" |
| **Add §D→§H cross-ref** | §D:909 (Subject template) | Add: "(validation schema in §H)" |
| **Add §F→§H cross-ref** | §F:166 (To: input) | Add: "(zod schema in §H)" |
| **Add §L→§K cross-ref** | §L:1044 | Add: "(see §K for story files used as visual baselines)" |
| **Assign i18n namespace to Phase 2** | Phase list (1338-1342) | Add Phase 2 bullet: "i18n `dashboard.emailTemplates` namespace (7-file atomic changeset)" |

---

**Audit completed**: 2026-08-02  
**Plan version audited**: v6 (Frontend lines 781-1096, i18n lines 1097-1187)  
**Total lines reviewed**: ~406 lines (Frontend) + ~90 lines (i18n) = ~496 lines  
**Research files cross-checked**: 00-synthesis.md, ui-ux-block.md, AGENTS.md (3 files)
