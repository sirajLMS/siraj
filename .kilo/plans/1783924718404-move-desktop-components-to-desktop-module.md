# Move Desktop Components into the `frontend/desktop/` Module

**Status:** Finalized
**Date:** 2026-07-13
**Sibling plan:** `.kilo/plans/1783924718404-move-mobile-components-to-mobile-module.md` (already EXECUTED — `frontend/mobile/` populated, 3 tier-paired parents updated to import `.mobile.*` from `@/frontend/mobile/components/ui/...`). This plan completes the symmetric desktop half.

## Architecture constraint (user-confirmed)

New top-level module layout — `frontend/{common,mobile,desktop}`. The old in-domain `mobile/`, `desktop/`, `shared/` directory convention in `frontend/AGENTS.md` and `.agents/instructions/mobile-desktop.instructions.md` is **DEPRECATED** for this migration and updated in a follow-up. Do NOT enforce those rules against the new structure. **Switcher (`xxView.tsx`) physical relocation is OUT OF SCOPE — covered by a separate future plan.** Switchers stay at their current path in `frontend/views/...`; this plan only rewrites their dynamic-import specifiers.

## Locked design decisions

1. **Bucket A (Desktop-prefixed primitives) is empty.** Verified — 0 `Desktop*`-prefixed files in `common` or `views`. Desktop tier consumes shared primitives (`AppDataGrid`, `PageHeader`, `Grid`, `SectionPanel`, `MetricCardGrid`, `PaginationControls`, `PersonProfileLink`, `BaseCard`, `StatusBadge`, `ExportButton`, `FilterButton`, `PrimaryPageAction`, `PageContainer`, `ErrorState`, `LoadingState`, `UserAvatar`, `MeetingJoinAction`, `PhoneDisplay`, `TimezoneDisplay`, `CurrencyDisplay`, `CountryDisplay`, `LanguageDisplay`, `LocaleEmoji`, `LocalizedStringDisplay`, `MeetingConfigDisplay`, `MeetingConfigList`, `PaymentMethodDisplay`, `PaymentMethodList`, `ClassProfileLink`, `ClassProfileLinkCell`, `FieldWrapper`, `AppDatePicker`, `AppDateRangePicker`, `AppTimePicker`, `AppTimeRangePicker`, `FormErrorSnackbar`, `FormSuccessSnackbar`, …) which **stay in `common`** because both tiers import them. No primitives move from `common` to `desktop`.
2. **Tier-paired parents stay in `common`.** The 3 un-suffixed parents (`DateNavigator.tsx`, `LocaleAdornmentSwitch.tsx`, `LocalizedStringDrawer.tsx`) remain in `frontend/common/components/ui/{filter,input/localizedString}/`. Only the `.desktop.*` variants move to `@/frontend/desktop/components/ui/...`. After this plan, all 3 parents lazy-import BOTH halves (mobile from `@/frontend/mobile/components/ui/...`, desktop from `@/frontend/desktop/components/ui/...`).
3. **`DateNavigator.tsx` becomes consistent** — currently it **statically** imports `DateNavigatorDesktop` from `common`. This plan converts it to a **lazy import** from `@/frontend/desktop/components/ui/filter/dateNavigator.desktop`, matching the pattern of the other 2 parents. (Concurrent rewrite item in Phase A.)
4. **Switchers (`xxView.tsx`) stay in `frontend/views/...`.** Only their dynamic-import specifiers change.
5. **Per-group barrels in `frontend/desktop/components/ui/`** — only `filter/index.ts` and `input/localizedString/index.ts` (the two groups holding moved Bucket B files). No top-level `ui/index.ts` barrel needed since no primitives move (desktop view files will directly import shared primitives from `@/frontend/common/components/ui`).
6. **`frontend/desktop/views/` mirrors `frontend/views/dashboard/...` 1:1** (collapse the in-domain `desktop/` folder segment). Same rule the mobile plan used.
7. **Clean cut on `common` barrels for the 3 moved `.desktop.*` files** — remove their re-export lines from any common barrel (if present). Verify each.
8. **`.bak` files get deleted** (36 across frontend) as part of this migration's cleanup phase.
9. **5 leftover empty `frontend/views/.../mobile/` dirs** from the mobile plan get cleaned up too.
10. ESLint rules: the moved `.desktop.tsx` files are tier-versioned files. They must NOT import `@/frontend/mobile/...` (already-enforced rule fires on `\\.mobile$`-suffix imports from a `.desktop.*` file). Parents in `common` are NOT tier-versioned; their lazy `import("@/frontend/desktop/...")` is allowed. Switchers in `frontend/views/...` are also not tier-versioned; they keep dynamic-importing both tiers.

## Current state survey (verified counts)

- Bucket B (tier-paired `.desktop.*` in `common`): **3 files** (dateNavigator.desktop, localeAdornmentSwitch.desktop, localizedStringDrawer.desktop)
- Bucket C (desktop view variant files): **46 `.desktop.tsx`** = 32 inline + 14 under `*/desktop/` folders
- View-side switchers to rewrite: **27 files** containing `import(".../something.desktop")`
- Common barrels referencing moved `.desktop.*` files: to verify per-file in Phase A
- Existing `*/desktop/` directories: **12** (will become empty post-move → cleanup)
- Existing leftover empty `*/mobile/` directories: **5** (from mobile plan — cleanup)
- `.bak` files to delete: **36** (11 `*DesktopView.tsx.bak` + 11 `*MobileView.tsx.bak` + 13 `*View.tsx.bak` legacy + 1 `ScheduleOverviewSection.tsx.bak`)
- Tier-paired parents in `common` already at their post-mobile-plan state (mobile half moved, parent updated): confirmed for all 3. DateNavigator is the only one with a static desktop import.

## Execution phases

Each phase must leave the tree typecheck-clean (`bun tsgo` passes) before the next phase starts.

### Phase 0 — Scaffolding

Create:

```
frontend/desktop/components/ui/
├── filter/index.ts
└── input/localizedString/index.ts
frontend/desktop/views/          (dirs created lazily during Phase B)
frontend/desktop/AGENTS.md       (placeholder — document that this module owns DESKTOP ONLY;
                                  MAY import from @/frontend/common/... and @/shared/...;
                                  MUST NOT import @/frontend/mobile/...)
```

Barrel contents written in Phase A once the actual export symbols are known.

### Phase A — Move 3 tier-paired `.desktop.*` variants + fix DateNavigator lazy load

**Files to move (Bucket B):**

| Source | Destination |
|---|---|
| `frontend/common/components/ui/filter/dateNavigator.desktop.tsx` | `frontend/desktop/components/ui/filter/dateNavigator.desktop.tsx` |
| `frontend/common/components/ui/input/localizedString/localeAdornmentSwitch.desktop.tsx` | `frontend/desktop/components/ui/input/localizedString/localeAdornmentSwitch.desktop.tsx` |
| `frontend/common/components/ui/input/localizedString/localizedStringDrawer.desktop.tsx` | `frontend/desktop/components/ui/input/localizedString/localizedStringDrawer.desktop.tsx` |

**Steps:**

1. `git mv` each source → destination (preserves history).
2. Per moved file: update any **relative** import of siblings (most `.desktop.*` variants import MUI + shared styles only) to point at `@/frontend/common/...` where applicable. Inspect each file's imports.
3. Create `frontend/desktop/components/ui/filter/index.ts`:
   ```ts
   export { DateNavigatorDesktop } from "@/frontend/desktop/components/ui/filter/dateNavigator.desktop";
   ```
   (Confirm exact export symbol first by reading the moved file.)
4. Create `frontend/desktop/components/ui/input/localizedString/index.ts` exporting both `LocaleAdornmentSwitchDesktop` and `LocalizedStringDrawerDesktop` (confirm exact symbols).
5. **Update the 3 parents in `common`** (still at their current paths):
   - `frontend/common/components/ui/filter/DateNavigator.tsx`:
     - **Remove** the static `import { DateNavigatorDesktop } from "@/frontend/common/.../dateNavigator.desktop";`
     - **Add** lazy import inside the non-mobile branch: `const Desktop = lazy(() => import("@/frontend/desktop/components/ui/filter/dateNavigator.desktop").then(m => ({ default: m.DateNavigatorDesktop })));` (or simplest: replicate the pattern of `LocaleAdornmentSwitch.tsx` — dynamic `import().then()` inside a function body or a `useLazyDesktop`-style switcher).
     - Confirm which pattern matches the existing `LocaleAdornmentSwitch.tsx` (which already lazy-imports both halves) and mirror it exactly so all 3 parents are symmetric.
   - `frontend/common/components/ui/input/localizedString/LocaleAdornmentSwitch.tsx`: change `import("@/frontend/common/.../localeAdornmentSwitch.desktop")` → `import("@/frontend/desktop/components/ui/input/localizedString/localeAdornmentSwitch.desktop")`.
   - `frontend/common/components/ui/input/localizedString/LocalizedStringDrawer.tsx`: same rewrite for the desktop half.
6. Check `frontend/common/components/ui/input/localizedString/LocalizedStringInput.tsx` and any other importer of the moved `.desktop.*` symbols — if it referenced the moved files, update it. (Earlier grep showed `LocalizedStringInput.tsx` does NOT import the drawer mobile — re-verify it doesn't import the desktop drawer either.)
7. Audit common barrels (`frontend/common/components/ui/filter/index.ts`, `.../input/localizedString/index.ts` if present) for any re-export of the moved files → remove those lines. Clean cut — no shim re-export.

**Verification:** `bun tsgo`, `bun biome:check`, lint queue on the 3 moved files + 3 updated parents + the 2 barrel files.

### Phase B — Move 46 desktop view variant files (mirrored subtree)

For each `.desktop.tsx` file, the destination uses the collapsed-subtree rule:

| Source pattern | Destination pattern |
|---|---|
| `frontend/views/dashboard/<domain>/desktop/<x>.desktop.tsx` | `frontend/desktop/views/dashboard/<domain>/<x>.desktop.tsx` |
| `frontend/views/dashboard/<domain>/desktop/components/<y>.desktop.tsx` | `frontend/desktop/views/dashboard/<domain>/components/<y>.desktop.tsx` |
| `frontend/views/dashboard/<domain>/<z>.desktop.tsx` (inline) | `frontend/desktop/views/dashboard/<domain>/<z>.desktop.tsx` |
| `frontend/views/dashboard/<domain>/<sub>/<w>.desktop.tsx` (inline) | `frontend/desktop/views/dashboard/<domain>/<sub>/<w>.desktop.tsx` |

**Concrete enumeration (46 files):**

```
# --- 14 under */desktop/ folders ---
admin/billing/desktop/adminBilling.desktop.tsx                                  → desktop/views/dashboard/admin/billing/adminBilling.desktop.tsx
admin/home/scheduleOverview/desktop/scheduleOverview.desktop.tsx                 → desktop/views/dashboard/admin/home/scheduleOverview/scheduleOverview.desktop.tsx
admin/parents/students/desktop/students.desktop.tsx                            → desktop/views/dashboard/admin/parents/students/students.desktop.tsx
billing/desktop/parentBilling.desktop.tsx                                       → desktop/views/dashboard/billing/parentBilling.desktop.tsx
billing/manual/desktop/manualInvoice.desktop.tsx                                → desktop/views/dashboard/billing/manual/manualInvoice.desktop.tsx
complaints/desktop/adminComplaints.desktop.tsx                                  → desktop/views/dashboard/complaints/adminComplaints.desktop.tsx
complaints/desktop/parentComplaints.desktop.tsx                                 → desktop/views/dashboard/complaints/parentComplaints.desktop.tsx
parent/dashboard/desktop/parentDashboard.desktop.tsx                            → desktop/views/dashboard/parent/dashboard/parentDashboard.desktop.tsx
reports/desktop/reports.desktop.tsx                                             → desktop/views/dashboard/reports/reports.desktop.tsx
resources/desktop/resources.desktop.tsx                                         → desktop/views/dashboard/resources/resources.desktop.tsx
suggestions/desktop/adminSuggestions.desktop.tsx                               → desktop/views/dashboard/suggestions/adminSuggestions.desktop.tsx
suggestions/desktop/parentSuggestions.desktop.tsx                              → desktop/views/dashboard/suggestions/parentSuggestions.desktop.tsx
teachers/dashboard/desktop/teacherDashboard.desktop.tsx                        → desktop/views/dashboard/teachers/dashboard/teacherDashboard.desktop.tsx
users/billing-profile/desktop/userBillingProfile.desktop.tsx                   → desktop/views/dashboard/users/billing-profile/userBillingProfile.desktop.tsx

# --- 32 inline desktop/ siblings ---
admin/parents/home/parentsView.desktop.tsx                                      → desktop/views/dashboard/admin/parents/home/parentsView.desktop.tsx
classes/audit/adminNoteCard.desktop.tsx                                         → desktop/views/dashboard/classes/audit/adminNoteCard.desktop.tsx
classes/audit/classAuditView.desktop.tsx                                        → desktop/views/dashboard/classes/audit/classAuditView.desktop.tsx
classes/audit/communicationLogCard.desktop.tsx                                   → desktop/views/dashboard/classes/audit/communicationLogCard.desktop.tsx
classes/audit/onlineMeetingCard.desktop.tsx                                      → desktop/views/dashboard/classes/audit/onlineMeetingCard.desktop.tsx
classes/details/classDetailsContainer.desktop.tsx                               → desktop/views/dashboard/classes/details/classDetailsContainer.desktop.tsx
classes/recurring/createRecurringClassView.desktop.tsx                          → desktop/views/dashboard/classes/recurring/createRecurringClassView.desktop.tsx
classes/status/tracking/statusTrackingDataGrid.desktop.tsx                      → desktop/views/dashboard/classes/status/tracking/statusTrackingDataGrid.desktop.tsx
classes/status/tracking/statusTrackingView.desktop.tsx                          → desktop/views/dashboard/classes/status/tracking/statusTrackingView.desktop.tsx
components/dashboardMetricsSection.desktop.tsx                                  → desktop/views/dashboard/components/dashboardMetricsSection.desktop.tsx
managers/home/managersView.desktop.tsx                                          → desktop/views/dashboard/managers/home/managersView.desktop.tsx
permissions/components/permissionCatalogSection.desktop.tsx                     → desktop/views/dashboard/permissions/components/permissionCatalogSection.desktop.tsx
permissions/permissionManagementView.desktop.tsx                                 → desktop/views/dashboard/permissions/permissionManagementView.desktop.tsx
profile/core/notifications/notificationPreferencesTab.desktop.tsx               → desktop/views/dashboard/profile/core/notifications/notificationPreferencesTab.desktop.tsx
reschedule/home/rescheduleView.desktop.tsx                                      → desktop/views/dashboard/reschedule/home/rescheduleView.desktop.tsx
reschedule/tracking/rescheduleTrackingView.desktop.tsx                          → desktop/views/dashboard/reschedule/tracking/rescheduleTrackingView.desktop.tsx
schedule/alerts/institutionalReportCard.desktop.tsx                             → desktop/views/dashboard/schedule/alerts/institutionalReportCard.desktop.tsx
schedule/alerts/scheduleAlertBanners.desktop.tsx                                → desktop/views/dashboard/schedule/alerts/scheduleAlertBanners.desktop.tsx
schedule/alerts/scheduleAlertsView.desktop.tsx                                  → desktop/views/dashboard/schedule/alerts/scheduleAlertsView.desktop.tsx
search-schedule/searchScheduleFilterDrawer.desktop.tsx                          → desktop/views/dashboard/search-schedule/searchScheduleFilterDrawer.desktop.tsx
students/status/components/studentStatusHeader.desktop.tsx                      → desktop/views/dashboard/students/status/components/studentStatusHeader.desktop.tsx
students/status/components/upcomingClassesTable.desktop.tsx                     → desktop/views/dashboard/students/status/components/upcomingClassesTable.desktop.tsx
subjects/home/subjectsView.desktop.tsx                                          → desktop/views/dashboard/subjects/home/subjectsView.desktop.tsx
teachers/availability/teacherAvailabilityView.desktop.tsx                       → desktop/views/dashboard/teachers/availability/teacherAvailabilityView.desktop.tsx
teachers/futureSchedule/components/futureClassCard.desktop.tsx                  → desktop/views/dashboard/teachers/futureSchedule/components/futureClassCard.desktop.tsx
teachers/futureSchedule/components/jumpToDateHeader.desktop.tsx                  → desktop/views/dashboard/teachers/futureSchedule/components/jumpToDateHeader.desktop.tsx
teachers/futureSchedule/futureScheduleView.desktop.tsx                          → desktop/views/dashboard/teachers/futureSchedule/futureScheduleView.desktop.tsx
teachers/home/teachersView.desktop.tsx                                          → desktop/views/dashboard/teachers/home/teachersView.desktop.tsx
teachers/reassignment/teacherReassignmentView.desktop.tsx                        → desktop/views/dashboard/teachers/reassignment/teacherReassignmentView.desktop.tsx
teachers/schedule/weekly/teacherWeeklyScheduleView.desktop.tsx                   → desktop/views/dashboard/teachers/schedule/weekly/teacherWeeklyScheduleView.desktop.tsx
tools/dst-migration/components/updatedSessionsSection.desktop.tsx               → desktop/views/dashboard/tools/dst-migration/components/updatedSessionsSection.desktop.tsx
tools/dst-migration/dstMigrationView.desktop.tsx                                → desktop/views/dashboard/tools/dst-migration/dstMigrationView.desktop.tsx
```

**Steps:**

1. Create destination directories on demand.
2. `git mv` each source → destination. Tree is temporarily broken (switchers point at stale paths); fixed in Phase C.
3. For each moved file, audit its imports and classify:
   - `@/frontend/common/...`, `@/shared/...`, MUI, `next/...`, `react`, `@apollo/...` → unchanged.
   - `@/frontend/views/dashboard/<domain>/desktop/<x>.desktop` (absolute path to a sibling desktop file that ALSO moved) → rewrite to `@/frontend/desktop/views/dashboard/<domain>/<x>.desktop`.
   - `@/frontend/views/dashboard/<domain>/<SomeShared>.tsx` (sibling not versioned — Container, `useXxViewModel.ts`, schemas, types, `*DataGrid.tsx`, `*CardList.tsx`, `*FilterBar.tsx`, etc. that STAY in `frontend/views/...`) — **stays unchanged**.
   - Relative `./` / `../` imports between moved sibling `.desktop.tsx` files (e.g., classAuditView.desktop imports `./adminNoteCard.desktop`) — relative depth is preserved because the sibling subtree moved intact, so they stay valid IF the relative path didn't cross into the `desktop/` segment that got collapsed. Audit each; prefer rewriting relative paths to absolute `@/frontend/desktop/views/...` to avoid depth surprises.

**Parallelization:** Phase B move + import rewrite can be dispatched as parallel subagents grouped by dashboard domain subtree (admin/billing, complaints, suggestions, teachers, classes, schedule, reschedule, etc.). Each subagent owns: its `git mv`s + its intra-file import rewrites + per-file tsgo verification on ONLY its files.

**Verification:** `bun tsgo` (whole tree). Lint via queue server.

### Phase C — Rewrite switcher dynamic-import specifiers

**27 switcher files** to update (from earlier enumeration, excluding the 3 `.md`/AGENTS files and the 2 tier-paired parents handled in Phase A):

```
frontend/views/dashboard/admin/billing/adminBillingView.tsx
frontend/views/dashboard/admin/home/scheduleOverview/scheduleOverviewView.tsx
frontend/views/dashboard/admin/parents/home/ParentsView.tsx
frontend/views/dashboard/admin/parents/students/studentsView.tsx
frontend/views/dashboard/billing/manual/manualInvoiceView.tsx
frontend/views/dashboard/billing/parentBillingView.tsx
frontend/views/dashboard/classes/audit/ClassAuditView.tsx
frontend/views/dashboard/classes/status/tracking/StatusTrackingDataGrid.tsx
frontend/views/dashboard/complaints/adminComplaintsView.tsx
frontend/views/dashboard/complaints/parentComplaintsView.tsx
frontend/views/dashboard/managers/home/ManagersView.tsx
frontend/views/dashboard/parent/dashboard/parentDashboardView.tsx
frontend/views/dashboard/reports/reportsView.tsx
frontend/views/dashboard/reschedule/home/RescheduleView.tsx
frontend/views/dashboard/reschedule/tracking/RescheduleTrackingView.tsx
frontend/views/dashboard/resources/resourcesView.tsx
frontend/views/dashboard/schedule/alerts/ScheduleAlertsView.tsx
frontend/views/dashboard/search-schedule/SearchScheduleFilterDrawer.tsx
frontend/views/dashboard/subjects/home/SubjectsView.tsx
frontend/views/dashboard/suggestions/adminSuggestionsView.tsx
frontend/views/dashboard/suggestions/parentSuggestionsView.tsx
frontend/views/dashboard/teachers/dashboard/teacherDashboardView.tsx
frontend/views/dashboard/teachers/futureSchedule/components/FutureClassCard.tsx
frontend/views/dashboard/teachers/futureSchedule/components/JumpToDateHeader.tsx
frontend/views/dashboard/teachers/futureSchedule/FutureScheduleView.tsx
frontend/views/dashboard/teachers/schedule/weekly/TeacherWeeklyScheduleView.tsx
frontend/views/dashboard/users/billing-profile/userBillingProfileView.tsx
```

**Rewrite rule:** In each switcher, every `import("@/frontend/views/dashboard/<domain>/desktop/<x>.desktop")` OR `import("@/frontend/views/dashboard/<domain>/<sub>/<y>.desktop")` specifier is rewritten to:

- `@/frontend/views/dashboard/<domain>/desktop/<x>.desktop` → `@/frontend/desktop/views/dashboard/<domain>/<x>.desktop`
- `@/frontend/views/dashboard/<domain>/<sub>/<y>.desktop` (inline) → `@/frontend/desktop/views/dashboard/<domain>/<sub>/<y>.desktop`

(The in-domain `desktop/` segment is collapsed, mirroring the mobile plan.)

**Note:** `StatusTrackingDataGrid.tsx` is a class-audit inline switcher that itself stays in `frontend/views/...` and imports the desktop statusTrackingDataGrid variant — apply the inline rewrite rule.

**Steps:**

1. For each of the 27 switchers: locate the `import( ...desktop" )` literal and rewrite per the rule. Use the same `.then(m => ({ default: m.<Export> }))` continuation; only the path changes.
2. Some switchers import BOTH `...mobile` and `...desktop` halves — verify the mobile half was already updated by the mobile plan (paths like `@/frontend/mobile/views/dashboard/<domain>/<x>.mobile`). If any mobile dynamic-import specifier still points at the OLD `@/frontend/views/.../mobile/...` path, fix it as a missed mobile-plan artifact.

**Parallelization:** Each switcher is independent → full parallel dispatch (one subagent per switcher file is overkill; bundle 3-5 switchers per subagent).

**Verification:** `bun tsgo` (whole tree). `bun run build` to confirm Next.js resolves dynamic imports.

### Phase D — Cleanup & docs

1. **Delete now-empty `*/desktop/` directories** (12 total, post-Phase B):
   ```
   frontend/views/dashboard/admin/billing/desktop
   frontend/views/dashboard/admin/home/scheduleOverview/desktop
   frontend/views/dashboard/admin/parents/students/desktop
   frontend/views/dashboard/billing/desktop
   frontend/views/dashboard/billing/manual/desktop
   frontend/views/dashboard/complaints/desktop
   frontend/views/dashboard/parent/dashboard/desktop
   frontend/views/dashboard/reports/desktop
   frontend/views/dashboard/resources/desktop
   frontend/views/dashboard/suggestions/desktop
   frontend/views/dashboard/teachers/dashboard/desktop
   frontend/views/dashboard/users/billing-profile/desktop
   ```
2. **Delete leftover empty `*/mobile/` directories from the mobile plan** (5 total):
   ```
   frontend/views/dashboard/admin/billing/mobile
   frontend/views/dashboard/admin/home/scheduleOverview/mobile
   frontend/views/dashboard/admin/parents/students/mobile
   frontend/views/dashboard/parent/dashboard/mobile
   frontend/views/dashboard/teachers/dashboard/mobile
   ```
3. **Delete 36 `.bak` files** (all under `frontend/views/`):
   - 11 `*DesktopView.tsx.bak`
   - 11 `*MobileView.tsx.bak`
   - 13 `*View.tsx.bak` legacy switcher backups (including `AdminBillingView.tsx.bak`, `StudentsView.tsx.bak`, `manualInvoiceView.tsx.bak`, `ParentBillingView.tsx.bak`, `adminComplaintsView.tsx.bak`, `parentComplaintsView.tsx.bak`, `ParentDashboardView.tsx.bak`, `ReportsView.tsx.bak`, `ResourcesView.tsx.bak`, `adminSuggestionsView.tsx.bak`, `parentSuggestionsView.tsx.bak`, `TeacherDashboardView.tsx.bak`, `userBillingProfileView.tsx.bak`)
   - 1 `ScheduleOverviewSection.tsx.bak`
   
   Use `git rm` so removal is tracked. Confirm none are imported anywhere before deletion (grep should already show zero live imports of `.bak` — verified during planning; re-run as a safety check before `git rm`).
4. Write `frontend/desktop/AGENTS.md` documenting the new module contract:
   - Purpose: desktop-only views + tier-paired `.desktop.*` variants.
   - MAY import `@/frontend/common/...`, `@/shared/...`, MUI, etc.
   - MUST NOT import `@/frontend/mobile/...` (ESLint-enforced via `no-restricted-imports`).
   - MUST NOT use `useMediaQuery` or `useViewport` inside `.desktop.tsx` files (already ESLint-enforced).
5. (Deferred — out of scope for THIS plan) Updating `frontend/AGENTS.md`, `frontend/common/components/ui/AGENTS.md`, `.agents/instructions/mobile-desktop.instructions.md` to the new top-level module convention. Follow-up commit.

## Verification gate (end of migration)

```bash
bun tsgo                          # Whole-tree type check — must exit 0
bun biome:check                  # Formatting + lint — must pass
# Lint queue (start server then submit per-file):
~/.bun/bin/bun run scripts/lint-queue-server.ts &
# After lint server is up, for each changed file:
curl -s -X POST http://localhost:4777/lint -H "Content-Type: application/json" \
  -d '{"id":"verify","files":["<each changed file>"]}'
bun run build                    # Next.js production build — MUST succeed
# Storybook smoke (stories auto-discovered from new path):
# (optional) bun run storybook
```

**Acceptance criteria:**
- `bun tsgo` exits 0.
- `bun run build` succeeds.
- No `@/frontend/common/...` import references `.desktop.*` symbols anywhere (grep must be empty).
- No `.mobile.tsx` file imports from `@/frontend/desktop/...` (ESLint already enforces; verify).
- `frontend/views/**/desktop/` directories are gone.
- The 5 leftover `frontend/views/**/mobile/` directories (from the prior mobile plan) are gone.
- `frontend/desktop/views/` subtree mirrors `frontend/views/dashboard/...` paths (minus the `desktop/` segment).
- All 36 `.bak` files gone.
- All 3 tier-paired parents in `common` lazy-import BOTH halves symmetrically (no remaining static `import` of a `.desktop.*` symbol).

## Risk register

| Risk | Mitigation |
|---|---|
| A moved `.desktop.tsx` has a relative import to a sibling `.tsx` that did NOT move (stays in `frontend/views/...`) | In Phase B, audit each moved file's relative imports and fix depths; prefer rewriting relative paths to absolute `@/frontend/views/dashboard/<domain>/...` to avoid depth surprises. |
| A switcher uses a relative `./desktop/X.desktop` import (not the `@/frontend/views/...` form) | Re-grep confirmed ONLY `@/frontend/views/...` absolute and `@/frontend/views/.../desktop/...` forms exist. No relative `./desktop/` specifier found in switchers. (Confirmed during planning.) |
| DateNavigator.tsx conversion from static-import to lazy-load changes its rendered behavior | Keep the same `<DateNavigatorDesktop {...props} />` JSX; only the import mechanism changes (use React.lazy + Suspense, or inline dynamic import inside the branch). Vegetate the conversion against the existing pattern in `LocaleAdornmentSwitch.tsx` (already does lazy for both halves) and copy it. |
| ESLint `no-restricted-imports` cross-tier rule fires on the moved `.desktop.tsx` files importing something `.mobile`-suffixed | Audit each moved desktop file; none should currently import `.mobile.*`. If any does (existing violation), this plan leaves it as-is and reports it — fix in a separate cleanup. |
| Lint queue contention | Always use queue; never run raw `bun lint`. |
| `.bak` file is imported somewhere unexpected | Pre-delete grep confirmed zero live imports of `.bak` files. Re-run as safety check immediately before `git rm`. |
| Mixed-import statements in moved `.desktop.tsx` (shared + desktop-only symbols combined) | No desktop-only primitives move — desktop variant files only import shared primitives, sibling desktop variants, and shared domain helpers. The split-import rewrite (mobile plan's Phase B step 7) is NOT needed here. |

## Out of scope (explicitly deferred)

- Switcher (`xxView.tsx`) **physical relocation** into a tier-neutral home (e.g., `frontend/common/views/` or similar) — separate future plan per user instruction.
- Moving desktop-only shared primitives (`AppDataGrid`, `PageHeader`, `SectionPanel`, `MetricCardGrid`, etc.) from `common` into `desktop/components/ui` — user decided these stay shared in `common` (both tiers consume).
- Updating `frontend/AGENTS.md`, `frontend/common/components/ui/AGENTS.md`, `.agents/instructions/mobile-desktop.instructions.md`, `frontend/page-prompt.md` to the new top-level module convention — follow-up commit.
- Restructuring moved `.desktop.tsx` files to follow any new sub-convention (e.g., per-component `components/` sub-folders) — just physically relocate, do not restructure.
- Any work on `frontend/mobile/` (mobile plan already executed and complete except the 5 leftover empty `mobile/` dirs swept up in Phase D of THIS plan).
