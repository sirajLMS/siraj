# Move Mobile Components into the `frontend/mobile/` Module

**Status:** Finalized
**Date:** 2026-07-13
**Architecture constraint (user-confirmed):** New top-level module layout — `frontend/{common,mobile,desktop}`. The existing in-domain `mobile/` / `desktop/` / `shared/` directory convention documented in `frontend/AGENTS.md` and `.agents/instructions/mobile-desktop.instructions.md` is **DEPRECATED** for this migration and will be updated in a follow-up. Do NOT enforce those rules against the new structure.

## Locked Design Decisions

1. **`frontend/mobile/views/` mirrors the `frontend/views/dashboard/...` subtree 1:1.** A file currently at `frontend/views/dashboard/billing/mobile/parentBilling.mobile.tsx` moves to `frontend/mobile/views/dashboard/billing/parentBilling.mobile.tsx` (the in-domain `mobile/` folder is collapsed into the mirrored path).
2. **Tier-paired parents/switchers stay in `common`.** Only the `.mobile.*` variant files move; the un-suffixed parent (`DateNavigator.tsx`, `LocaleAdornmentSwitch.tsx`, `LocalizedStringDrawer.tsx`, `LocalizedStringInput.tsx`) stays in `common` and imports its mobile variant via `@/frontend/mobile/components/...`.
3. **Stories move alongside their moved component.**
4. **Clean cut on common barrels.** Mobile* symbols are removed from `frontend/common/components/ui/**/index.ts`. Every consumer import is rewritten to `@/frontend/mobile/components/ui` (or the per-group bucket). No shim re-export kept in `common`.
5. **Per-group barrels in `frontend/mobile/components/ui/`** mirror common's structure (`button/index.ts`, `card/index.ts`, `container/index.ts`, `container/page/index.ts`, `state/index.ts`, `filter/index.ts`, `input/localizedString/index.ts`, plus a top-level `ui/index.ts`).
6. **`.desktop.tsx` consumers do NOT change their imports** — they import only shared/truly-common symbols from `@/frontend/common/components/ui`, which still resolve. ESLint already forbids `.desktop.tsx` importing `.mobile` paths, so desktop is unaffected by the move.
7. **Storybook glob** (`../frontend/**/*.stories.*`) already covers `frontend/mobile/**`, no `.storybook/main.ts` change needed.
8. **No `app/` route touches Mobile\* primitives** (verified — 0 matches in `app/`). Scope is `frontend/views/**` + `frontend/common/**` barrels + the moved files themselves.

## Current State Survey (verified counts)

- `frontend/common/components/ui/` mobile-specific files to move: **14** (see Bucket A below)
- Tier-paired `.mobile.*` variants in `common` to move: **3** (see Bucket B below)
- Mobile view files under `frontend/views/**/mobile/...` and inline `.mobile.tsx`: **51** (see Bucket C below)
- `xxView.tsx` switchers that dynamic-`import()` a `.mobile.*` view: **14** (list in Phase C.3)
- Total mobile view import-specifier rewrites: **~14** dynamic imports + **~35 inline `.mobile.tsx`** that import Mobile\* from `@/frontend/common/components/ui` + sibling `./...` relative imports inside moved view trees (recomputed after the move).

## Execution Phases

Each phase must leave the tree in a typecheck-clean state before the next phase starts. Run `bun tsgo` between phases; only continue when it returns 0.

### Phase 0 — Scaffolding

Create empty barrel + directory skeleton under `frontend/mobile/`:

```
frontend/mobile/components/ui/
├── index.ts                       (re-exports from per-group barrels)
├── button/index.ts
├── card/index.ts
├── container/index.ts
├── container/page/index.ts
├── state/index.ts
├── filter/index.ts
└── input/localizedString/index.ts
frontend/mobile/views/            (directories created lazily during Phase C)
frontend/mobile/AGENTS.md          (new — placeholder, document that this module owns MOBILE ONLY)
```

**Verification:** `bun tsgo` passes (empty barrels are valid TS).

### Phase A — Move tier-paired `.mobile.*` variants (small blast radius)

This phase is done first because each moved file has **exactly one importer** (the parent switcher in `common`), so the import rewrite is trivial and low-risk. It also forces the `frontend/mobile/components/ui/filter` and `.../input/localizedString` barrels into existence early.

**Files to move (Bucket B — 3 files):**

| Source | Destination |
|---|---|
| `frontend/common/components/ui/filter/dateNavigator.mobile.tsx` | `frontend/mobile/components/ui/filter/dateNavigator.mobile.tsx` |
| `frontend/common/components/ui/input/localizedString/localeAdornmentSwitch.mobile.tsx` | `frontend/mobile/components/ui/input/localizedString/localeAdornmentSwitch.mobile.tsx` |
| `frontend/common/components/ui/input/localizedString/localizedStringDrawer.mobile.tsx` | `frontend/mobile/components/ui/input/localizedString/localizedStringDrawer.mobile.tsx` |

**Steps:**
1. Create target dirs.
2. Use `git mv` to relocate each file (preserves history).
3. Create per-group barrel in `frontend/mobile/components/ui/filter/index.ts`:
   ```ts
   export { DateNavigatorMobile } from "@/frontend/mobile/components/ui/filter/dateNavigator.mobile";
   ```
   (Inspect the file's actual export symbol first — confirm before writing.)
4. Create `frontend/mobile/components/ui/input/localizedString/index.ts` exporting both moved variants.
5. Update the THREE parent switchers in `common` to lazy-import from the new mobile path:
   - `frontend/common/components/ui/filter/DateNavigator.tsx` → `@/frontend/mobile/components/ui/filter/dateNavigator.mobile`
   - `frontend/common/components/ui/input/localizedString/LocaleAdornmentSwitch.tsx` → `@/frontend/mobile/components/ui/input/localizedString/localeAdornmentSwitch.mobile`
   - `frontend/common/components/ui/input/localizedString/LocalizedStringDrawer.tsx` → `@/frontend/mobile/components/ui/input/localizedString/localizedStringDrawer.mobile`
6. ESLint note: these 3 importer files in `common` are NOT `.mobile.tsx`/`.desktop.tsx` files, so the cross-tier import rule does NOT fire. The dynamic `import(...)` of a `.mobile` path from a non-tiered file is allowed.

**Verification:** `bun tsgo`, `bun biome:check`, lint queue on the 3 moved files + 3 updated parents.

### Phase B — Move Mobile\* UIKit primitives + stories + clean-cut barrel rewrite

**Files to move (Bucket A — 11 files incl. stories):**

| Source | Destination |
|---|---|
| `frontend/common/components/ui/button/MobileFab.tsx` | `frontend/mobile/components/ui/button/MobileFab.tsx` |
| `frontend/common/components/ui/card/MobileCardListItem.tsx` | `frontend/mobile/components/ui/card/MobileCardListItem.tsx` |
| `frontend/common/components/ui/card/MobileCardListItem.stories.tsx` | `frontend/mobile/components/ui/card/MobileCardListItem.stories.tsx` |
| `frontend/common/components/ui/card/MobileMetricCardGrid.tsx` | `frontend/mobile/components/ui/card/MobileMetricCardGrid.tsx` |
| `frontend/common/components/ui/container/MobileCardList.tsx` | `frontend/mobile/components/ui/container/MobileCardList.tsx` |
| `frontend/common/components/ui/container/MobileContentStack.tsx` | `frontend/mobile/components/ui/container/MobileContentStack.tsx` |
| `frontend/common/components/ui/container/MobileContentStack.stories.tsx` | `frontend/mobile/components/ui/container/MobileContentStack.stories.tsx` |
| `frontend/common/components/ui/container/page/MobilePageHeader.tsx` | `frontend/mobile/components/ui/container/page/MobilePageHeader.tsx` |
| `frontend/common/components/ui/container/page/MobilePageHeader.stories.tsx` | `frontend/mobile/components/ui/container/page/MobilePageHeader.stories.tsx` |
| `frontend/common/components/ui/state/MobileEmptyState.tsx` | `frontend/mobile/components/ui/state/MobileEmptyState.tsx` |
| `frontend/common/components/ui/state/MobileEmptyState.stories.tsx` | `frontend/mobile/components/ui/state/MobileEmptyState.stories.tsx` |

**Steps:**
1. `git mv` each file to its destination.
2. Inside each moved `.tsx`, update any **relative** import of siblings that moved together or of `common`-only primitives — most Mobile\* files import only MUI + shared utils (`edgeToEdgeSx`, `mergeSx`), which stay in `common`, so paths become `@/frontend/common/utils/sx/...`. Inspect per-file and rewrite.
3. Inside each moved `.stories.tsx`, update the self-import path from `@/frontend/common/components/ui/.../MobileX` to `@/frontend/mobile/components/ui/.../MobileX`, and any story wrappers (e.g. `StoryBookPageContainer`) stay `@/frontend/common/...`.
4. Create / populate the per-group barrels in `frontend/mobile/components/ui/{button,card,container,container/page,state}/index.ts` with named exports only.
5. Create the top-level `frontend/mobile/components/ui/index.ts` re-exporting from the per-group barrels.
6. **Remove** the Mobile\* re-export lines from the `common` barrels:
   - `frontend/common/components/ui/button/index.ts` → drop `MobileFab`, `MobileFabProps`
   - `frontend/common/components/ui/card/index.ts` → drop `MobileCardListItem`, `MobileMetricCardGrid`
   - `frontend/common/components/ui/container/index.ts` → drop `MobileCardList`, `MobileContentStack`
   - `frontend/common/components/ui/container/page/index.ts` → drop `MobilePageHeader`
   - `frontend/common/components/ui/state/index.ts` → drop `MobileEmptyState`
7. **Rewrite every consumer import.** Audit-list (from the earlier grep — 35 `.mobile.tsx` consumers + a few non-tiered helpers like `TeacherScheduleMobileCard.tsx` that USE Mobile\* symbols). For each consumer file:
   - If the file is a `.mobile.tsx` (mobile tier) or a mobile-only helper: change `import { MobileX, ... } from "@/frontend/common/components/ui";` to **two** imports — one for Mobile\* from `@/frontend/mobile/components/ui`, one for the remaining shared symbols (StatusBadge, BaseCard, PageContainer, …) from `@/frontend/common/components/ui`. Example rewrite:
     ```ts
     // before
     import { BaseCard, MobileContentStack, MobilePageHeader, PageContainer } from "@/frontend/common/components/ui";
     // after
     import { BaseCard, PageContainer } from "@/frontend/common/components/ui";
     import { MobileContentStack, MobilePageHeader } from "@/frontend/mobile/components/ui";
     ```
   - If the file (`TeacherScheduleMobileCard.tsx`, `MobileScheduleList.tsx`, `StudentMobileMetricsScroll.tsx`, `BillingMobileSearchBar.tsx`, `MobileWalletCatalogGrid.tsx`, `MobileWeeklyScroller.tsx`, `StudentHistoryMobile.tsx`, etc.) is a **mobile-only helper** that imports only `StatusBadge` / `BaseCard` etc. (NOT Mobile\* symbols), no change needed — it stays on common.
   - **Filter the consumer list to only files that actually use Mobile\* symbols** — re-run the audit before each rewrite batch.

**Parallelization:** This phase can be dispatched as parallel subagents — one subagent per logical group of consumer files (e.g., one per dashboard domain subtree), plus one for the barrel rewrite. All subagents MUST use the lint queue server for lint, never raw `bun lint`.

**Verification:** `bun tsgo` clean (the lint ESLint rule that blocks `.desktop.tsx` from importing `@/frontend/mobile` should not fire because desktop files don't use Mobile\* symbols). Run lint queue on every changed file. Run `bun run build` to confirm Next.js resolves the new paths.

### Phase C — Move mobile VIEW files (mirrored subtree)

**Files to move (Bucket C — 51 `.mobile.tsx` files).** Mirror the source path under `frontend/mobile/views/` while dropping the in-domain `mobile/` segment.

Source → destination mapping rules:

| Source pattern | Destination pattern |
|---|---|
| `frontend/views/dashboard/<domain>/mobile/<x>.mobile.tsx` | `frontend/mobile/views/dashboard/<domain>/<x>.mobile.tsx` |
| `frontend/views/dashboard/<domain>/mobile/components/<y>.mobile.tsx` | `frontend/mobile/views/dashboard/<domain>/components/<y>.mobile.tsx` |
| `frontend/views/dashboard/<domain>/<z>.mobile.tsx` (inline) | `frontend/mobile/views/dashboard/<domain>/<z>.mobile.tsx` |
| `frontend/views/dashboard/<domain>/<sub>/<w>.mobile.tsx` (inline) | `frontend/mobile/views/dashboard/<domain>/<sub>/<w>.mobile.tsx` |

Concrete enumeration (51 files):

```
admin/billing/mobile/adminBilling.mobile.tsx                                          → mobile/views/dashboard/admin/billing/adminBilling.mobile.tsx
admin/billing/mobile/components/adminInvoiceCard.mobile.tsx                         → mobile/views/dashboard/admin/billing/components/adminInvoiceCard.mobile.tsx
admin/home/scheduleOverview/mobile/components/scheduleOverviewCard.mobile.tsx        → mobile/views/dashboard/admin/home/scheduleOverview/components/scheduleOverviewCard.mobile.tsx
admin/home/scheduleOverview/mobile/scheduleOverview.mobile.tsx                       → mobile/views/dashboard/admin/home/scheduleOverview/scheduleOverview.mobile.tsx
admin/parents/home/parentsView.mobile.tsx                                            → mobile/views/dashboard/admin/parents/home/parentsView.mobile.tsx
admin/parents/students/mobile/components/studentDirectoryCard.mobile.tsx             → mobile/views/dashboard/admin/parents/students/components/studentDirectoryCard.mobile.tsx
admin/parents/students/mobile/students.mobile.tsx                                    → mobile/views/dashboard/admin/parents/students/students.mobile.tsx
billing/manual/mobile/manualInvoice.mobile.tsx                                       → mobile/views/dashboard/billing/manual/manualInvoice.mobile.tsx
billing/mobile/parentBilling.mobile.tsx                                              → mobile/views/dashboard/billing/parentBilling.mobile.tsx
classes/audit/adminNoteCard.mobile.tsx                                               → mobile/views/dashboard/classes/audit/adminNoteCard.mobile.tsx
classes/audit/classAuditView.mobile.tsx                                              → mobile/views/dashboard/classes/audit/classAuditView.mobile.tsx
classes/audit/communicationLogCard.mobile.tsx                                        → mobile/views/dashboard/classes/audit/communicationLogCard.mobile.tsx
classes/audit/onlineMeetingCard.mobile.tsx                                            → mobile/views/dashboard/classes/audit/onlineMeetingCard.mobile.tsx
classes/details/classDetailsContainer.mobile.tsx                                     → mobile/views/dashboard/classes/details/classDetailsContainer.mobile.tsx
classes/recurring/createRecurringClassView.mobile.tsx                                → mobile/views/dashboard/classes/recurring/createRecurringClassView.mobile.tsx
classes/status/tracking/statusTrackingDataGrid.mobile.tsx                           → mobile/views/dashboard/classes/status/tracking/statusTrackingDataGrid.mobile.tsx
classes/status/tracking/statusTrackingView.mobile.tsx                                → mobile/views/dashboard/classes/status/tracking/statusTrackingView.mobile.tsx
complaints/mobile/adminComplaints.mobile.tsx                                         → mobile/views/dashboard/complaints/adminComplaints.mobile.tsx
complaints/mobile/parentComplaints.mobile.tsx                                        → mobile/views/dashboard/complaints/parentComplaints.mobile.tsx
components/dashboardMetricsSection.mobile.tsx                                        → mobile/views/dashboard/components/dashboardMetricsSection.mobile.tsx
managers/home/managersView.mobile.tsx                                                → mobile/views/dashboard/managers/home/managersView.mobile.tsx
parent/dashboard/mobile/components/parentScheduleCard.mobile.tsx                     → mobile/views/dashboard/parent/dashboard/components/parentScheduleCard.mobile.tsx
parent/dashboard/mobile/parentDashboard.mobile.tsx                                   → mobile/views/dashboard/parent/dashboard/parentDashboard.mobile.tsx
permissions/components/permissionCatalogSection.mobile.tsx                           → mobile/views/dashboard/permissions/components/permissionCatalogSection.mobile.tsx
permissions/permissionManagementView.mobile.tsx                                       → mobile/views/dashboard/permissions/permissionManagementView.mobile.tsx
profile/core/notifications/notificationPreferencesTab.mobile.tsx                      → mobile/views/dashboard/profile/core/notifications/notificationPreferencesTab.mobile.tsx
reports/mobile/reports.mobile.tsx                                                    → mobile/views/dashboard/reports/reports.mobile.tsx
reschedule/home/rescheduleView.mobile.tsx                                            → mobile/views/dashboard/reschedule/home/rescheduleView.mobile.tsx
reschedule/tracking/rescheduleTrackingView.mobile.tsx                                → mobile/views/dashboard/reschedule/tracking/rescheduleTrackingView.mobile.tsx
resources/mobile/resources.mobile.tsx                                                → mobile/views/dashboard/resources/resources.mobile.tsx
schedule/alerts/institutionalReportCard.mobile.tsx                                   → mobile/views/dashboard/schedule/alerts/institutionalReportCard.mobile.tsx
schedule/alerts/scheduleAlertBanners.mobile.tsx                                       → mobile/views/dashboard/schedule/alerts/scheduleAlertBanners.mobile.tsx
schedule/alerts/scheduleAlertsView.mobile.tsx                                        → mobile/views/dashboard/schedule/alerts/scheduleAlertsView.mobile.tsx
search-schedule/searchScheduleFilterDrawer.mobile.tsx                                → mobile/views/dashboard/search-schedule/searchScheduleFilterDrawer.mobile.tsx
students/status/components/studentStatusHeader.mobile.tsx                            → mobile/views/dashboard/students/status/components/studentStatusHeader.mobile.tsx
students/status/components/upcomingClassesTable.mobile.tsx                           → mobile/views/dashboard/students/status/components/upcomingClassesTable.mobile.tsx
subjects/home/subjectsView.mobile.tsx                                                → mobile/views/dashboard/subjects/home/subjectsView.mobile.tsx
suggestions/mobile/adminSuggestions.mobile.tsx                                       → mobile/views/dashboard/suggestions/adminSuggestions.mobile.tsx
suggestions/mobile/parentSuggestions.mobile.tsx                                      → mobile/views/dashboard/suggestions/parentSuggestions.mobile.tsx
teachers/availability/teacherAvailabilityView.mobile.tsx                             → mobile/views/dashboard/teachers/availability/teacherAvailabilityView.mobile.tsx
teachers/dashboard/mobile/components/teacherScheduleCard.mobile.tsx                  → mobile/views/dashboard/teachers/dashboard/components/teacherScheduleCard.mobile.tsx
teachers/dashboard/mobile/teacherDashboard.mobile.tsx                                → mobile/views/dashboard/teachers/dashboard/teacherDashboard.mobile.tsx
teachers/futureSchedule/components/futureClassCard.mobile.tsx                        → mobile/views/dashboard/teachers/futureSchedule/components/futureClassCard.mobile.tsx
teachers/futureSchedule/components/jumpToDateHeader.mobile.tsx                        → mobile/views/dashboard/teachers/futureSchedule/components/jumpToDateHeader.mobile.tsx
teachers/futureSchedule/futureScheduleView.mobile.tsx                                → mobile/views/dashboard/teachers/futureSchedule/futureScheduleView.mobile.tsx
teachers/home/teachersView.mobile.tsx                                                → mobile/views/dashboard/teachers/home/teachersView.mobile.tsx
teachers/reassignment/teacherReassignmentView.mobile.tsx                             → mobile/views/dashboard/teachers/reassignment/teacherReassignmentView.mobile.tsx
teachers/schedule/weekly/teacherWeeklyScheduleView.mobile.tsx                         → mobile/views/dashboard/teachers/schedule/weekly/teacherWeeklyScheduleView.mobile.tsx
tools/dst-migration/components/updatedSessionsSection.mobile.tsx                     → mobile/views/dashboard/tools/dst-migration/components/updatedSessionsSection.mobile.tsx
tools/dst-migration/dstMigrationView.mobile.tsx                                      → mobile/views/dashboard/tools/dst-migration/dstMigrationView.mobile.tsx
users/billing-profile/mobile/userBillingProfile.mobile.tsx                           → mobile/views/dashboard/users/billing-profile/userBillingProfile.mobile.tsx
```

**Steps (three sub-phases):**

#### Phase C.1 — Move the view files via `git mv`

Create destination directories on demand and `git mv` each file. After this point, the old `frontend/views/**/mobile/` paths no longer exist; only `frontend/mobile/views/...` does. The tree is temporarily broken (switchers point at stale paths) — that's expected, fixed in C.3.

#### Phase C.2 — Rewrite intra-mobile imports inside moved files

Each moved view file may import siblings via relative paths (`./components/foo.mobile`, `../shared/bar`, `../../SomethingView`) or via `@/frontend/views/...` absolute paths. After the move:
- Relative intra-mobile imports (`./`, `../` between moved `.mobile.tsx` files) **stay valid** because the relative tree was moved intact.
- `@/frontend/views/dashboard/<domain>/mobile/<x>.mobile` absolute imports **break** — rewrite to `@/frontend/mobile/views/dashboard/<domain>/<x>.mobile`.
- `@/frontend/views/dashboard/<domain>/<SomeShared>.tsx` imports of **non-mobile** helpers/shared types that STAY in `frontend/views/...` remain valid — do not rewrite those.
- Any moved `.mobile` file that imports a sibling `.mobile` file that ALSO moved must rewrite to the new path (covered by the absolute-path rewrite rule above).

Audit method: for each moved file, list its `import ... from ...` specifiers. Classify each as:
  - **stays-untouched** if it points to `@/frontend/common/...`, `@/frontend/mobile/...`, MUI, etc.
  - **needs rewrite** if it points to `@/frontend/views/dashboard/.../mobile/...` (now-moved mobile path) — rewrite to `@/frontend/mobile/views/dashboard/.../...`
  - **stays-untouched** if it points to `@/frontend/views/dashboard/...` that did NOT move (shared sibling e.g. `useXxViewModel.ts`, schemas, types, `xxx.shared.tsx`).

#### Phase C.3 — Rewrite the 14 switcher dynamic imports (in `frontend/views/...`)

Each `xxView.tsx` switcher (which STAYS in `frontend/views/...`) currently calls `import("@/frontend/views/dashboard/<domain>/mobile/<x>.mobile")`. Rewrite each to `import("@/frontend/mobile/views/dashboard/<domain>/<x>.mobile")`.

Full list of the 14 switchers (from earlier grep):

```
frontend/views/dashboard/teachers/dashboard/teacherDashboardView.tsx
frontend/views/dashboard/resources/resourcesView.tsx
frontend/views/dashboard/billing/parentBillingView.tsx
frontend/views/dashboard/billing/manual/manualInvoiceView.tsx
frontend/views/dashboard/users/billing-profile/userBillingProfileView.tsx
frontend/views/dashboard/reports/reportsView.tsx
frontend/views/dashboard/complaints/adminComplaintsView.tsx
frontend/views/dashboard/complaints/parentComplaintsView.tsx
frontend/views/dashboard/suggestions/parentSuggestionsView.tsx
frontend/views/dashboard/suggestions/adminSuggestionsView.tsx
frontend/views/dashboard/admin/billing/adminBillingView.tsx
frontend/views/dashboard/parent/dashboard/parentDashboardView.tsx
frontend/views/dashboard/admin/parents/students/studentsView.tsx
frontend/views/dashboard/admin/home/scheduleOverview/scheduleOverviewView.tsx
```

Also audit (do this in the same subagent wave) for any OTHER `import("@/frontend/views/.../mobile/..."` specifier across `frontend/views/**` and `frontend/app/**` — there should be ~14, but re-grep to catch any missed. Additionally some switchers may use relative `./mobile/<x>.mobile` instead of the absolute `@/frontend/views/...` form — re-grep for both forms.

**Parallelization:** Phase C can be dispatched as parallel subagents grouped by dashboard domain subtree (admin/billing, complaints, suggestions, teachers, classes, etc.). Each subagent owns: its `git mv`s + its switcher rewrite + its intra-file import rewrites + verification on its files.

### Phase D — Cleanup & Doc

1. Delete now-empty directories: `frontend/views/dashboard/{billing,complaints,suggestions,reports,resources,users/billing-profile,admin/billing,admin/parents/students,admin/home/scheduleOverview,parent/dashboard,teachers/dashboard}/mobile/` if `git mv` left them empty.
2. Verify `frontend/common/components/ui/**/index.ts` barrels no longer reference any Mobile\* symbol.
3. Write `frontend/mobile/AGENTS.md` documenting the new module contract (mobile-only; MAY import from `@/frontend/common/...`; MUST NOT import desktop-only).
4. Update (in a follow-up commit, NOT this migration) `frontend/AGENTS.md` and `.agents/instructions/mobile-desktop.instructions.md` to reflect the new top-level module convention. (Out of scope for the structural move itself.)

## Verification Gate (end of full migration)

```bash
bun tsgo                         # Must pass — no broken imports
bun biome:check                  # Formatting + lint suggestions
# Lint via queue (start server first):
~/.bun/bin/bun run scripts/lint-queue-server.ts &
# then per-file:
curl -s -X POST http://localhost:4777/lint -H "Content-Type: application/json" \
  -d '{"id":"verify","files":["<each changed file>"]}'
bun run build                    # Next.js production build must succeed
```

**Acceptance criteria:**
- `bun tsgo` exits 0.
- `bun run build` succeeds.
- No `@/frontend/common/...` import references Mobile\* symbols anywhere (grep must return empty).
- No `.desktop.tsx` file imports from `@/frontend/mobile/...` (ESLint rule should already prevent; verify).
- `frontend/views/**/mobile/` directories are gone (collapsed into `frontend/mobile/views/...`).
- `frontend/mobile/views/` subtree mirrors `frontend/views/dashboard/...` paths (minus the `mobile/` segment).
- Storybook still loads all `.stories.tsx` (they're now under `frontend/mobile/`).

## Risk Register

| Risk | Mitigation |
|---|---|
| A moved `.mobile.tsx` has a relative import to a sibling `.tsx` that did NOT move (stays in `frontend/views/...`) | Relative path depth changes after move. In Phase C.2, audit each moved file's relative imports and fix depths (e.g. `../shared/X` may become `../../../../../views/dashboard/<domain>/shared/X`, but prefer rewriting to `@/frontend/views/dashboard/<domain>/shared/X` absolute). |
| A switcher uses a relative `./mobile/X.mobile` dynamic import (not the `@/frontend/views/...` form) | Re-grep for both `./mobile/` and `@/frontend/views/.../mobile/` patterns in Phase C.3. |
| Storybook stories break because their import path to a sibling moved | Each story's self-import is rewritten in Phase B step 3 / during Phase C if the story moves with its view. |
| ESLint `no-restricted-imports` matches `.mobile` / `.desktop` inside module paths (e.g. `@/frontend/mobile/.../something.mobile`) | The regex `\\.desktop(\\.tsx?)?$` only matches the END of import specifiers, and `\\.mobile(\\.tsx?)?$` likewise. Paths like `@/frontend/mobile/components/ui/button/MobileFab` end in `MobileFab`, not `.mobile`, so they pass. The 3 tier-paired parents in `common` are NOT `.mobile.tsx` / `.desktop.tsx` files, so the cross-tier rule doesn't apply to them. Verified. |
| Lint queue server contention from parallel subagents | Always use the queue; never run raw `bun lint`. |
| Mobile tier imports that mix shared + Mobile\* symbols in one statement need a multi-import rewrite | Phase B step 7 shows the split-import pattern. Use it. |

## Out of Scope (deferred)

- Updating `frontend/AGENTS.md`, `frontend/common/components/ui/AGENTS.md`, `.agents/instructions/mobile-desktop.instructions.md`, `frontend/page-prompt.md` to reflect the new `frontend/{common,mobile,desktop}` module convention. (Will be a follow-up commit.)
- Moving `.desktop.*` variants and desktop-only primitives into `frontend/desktop/` — symmetric task, separate plan.
- Refactoring mobile view files to follow the new AGENTS.md `mobile/components/` sub-convention — the user explicitly said "don't care about instructions" for now; just **physically relocate** the files, do not restructure them further.
- Deleting the per-domain `desktop/` folders — they stay until the desktop migration.
