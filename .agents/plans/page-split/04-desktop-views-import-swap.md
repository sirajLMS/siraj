# Plan 4: Desktop View Import Swap (39 files)

## Context

Main orchestrator plan: `~/.cursor/plans/page_container_header_tier_split_3f98d657.plan.md`. Wave C plan. Depends on Plan 1 (COMPLETE) — the desktop primitives exist:

- `DesktopPageContainer` exported from `@/frontend/desktop/components/ui` (top-level barrel) and `@/frontend/desktop/components/ui/container/page`
- `DesktopPageHeader` exported from same paths, plus re-exports `PageHeaderBreadcrumb`

## Goal

Update all 39 `.desktop.tsx` view files that import `PageContainer` and/or `PageHeader` from `@/frontend/common/components/ui` (or `@/frontend/common/components/ui/container`) to import them from `@/frontend/desktop/components/ui` instead, using the new `DesktopPageContainer` and `DesktopPageHeader` names.

## Files to process (39)

Confirmed by traversal of the grep result for `import { ... PageContainer|PageHeader ... } from "@/frontend/common/components/ui"`:

```
frontend/desktop/views/dashboard/admin/billing/adminBilling.desktop.tsx
frontend/desktop/views/dashboard/admin/parents/home/parentsView.desktop.tsx
frontend/desktop/views/dashboard/admin/parents/students/students.desktop.tsx
frontend/desktop/views/dashboard/billing/manual/manualInvoice.desktop.tsx
frontend/desktop/views/dashboard/billing/parentBilling.desktop.tsx
frontend/desktop/views/dashboard/classes/audit/classAuditView.desktop.tsx
frontend/desktop/views/dashboard/classes/details/classDetailsContainer.desktop.tsx
frontend/desktop/views/dashboard/classes/recurring/createRecurringClassView.desktop.tsx
frontend/desktop/views/dashboard/classes/status/tracking/statusTrackingView.desktop.tsx
frontend/desktop/views/dashboard/complaints/adminComplaints.desktop.tsx
frontend/desktop/views/dashboard/complaints/parentComplaints.desktop.tsx
frontend/desktop/views/dashboard/managers/home/managersView.desktop.tsx
frontend/desktop/views/dashboard/parent/dashboard/parentDashboard.desktop.tsx
frontend/desktop/views/dashboard/permissions/permissionManagementView.desktop.tsx
frontend/desktop/views/dashboard/reports/reports.desktop.tsx
frontend/desktop/views/dashboard/reschedule/home/rescheduleView.desktop.tsx
frontend/desktop/views/dashboard/reschedule/tracking/rescheduleTrackingView.desktop.tsx
frontend/desktop/views/dashboard/resources/resources.desktop.tsx
frontend/desktop/views/dashboard/schedule/alerts/scheduleAlertsView.desktop.tsx
frontend/desktop/views/dashboard/student/credits/studentCredits.desktop.tsx
frontend/desktop/views/dashboard/student/dashboard/studentDashboard.desktop.tsx
frontend/desktop/views/dashboard/student/history/studentHistory.desktop.tsx
frontend/desktop/views/dashboard/student/profile/studentProfile.desktop.tsx
frontend/desktop/views/dashboard/subjects/home/subjectsView.desktop.tsx
frontend/desktop/views/dashboard/suggestions/adminSuggestions.desktop.tsx
frontend/desktop/views/dashboard/suggestions/parentSuggestions.desktop.tsx
frontend/desktop/views/dashboard/supervisor/dashboard/supervisorDashboard.desktop.tsx
frontend/desktop/views/dashboard/supervisor/lesson-reviews/pendingReviews.desktop.tsx
frontend/desktop/views/dashboard/supervisor/monthly-reports/monthlyReports.desktop.tsx
frontend/desktop/views/dashboard/supervisor/teacher-dues/teacherDues.desktop.tsx
frontend/desktop/views/dashboard/teachers/availability/teacherAvailabilityView.desktop.tsx
frontend/desktop/views/dashboard/teachers/dashboard/teacherDashboard.desktop.tsx
frontend/desktop/views/dashboard/teachers/futureSchedule/futureScheduleView.desktop.tsx
frontend/desktop/views/dashboard/teachers/home/teachersView.desktop.tsx
frontend/desktop/views/dashboard/teachers/reassignment/teacherReassignmentView.desktop.tsx
frontend/desktop/views/dashboard/teachers/schedule/weekly/teacherWeeklyScheduleView.desktop.tsx
frontend/desktop/views/dashboard/tools/dst-migration/dstMigrationView.desktop.tsx
frontend/desktop/views/dashboard/users/billing-profile/userBillingProfile.desktop.tsx
```

(Note: `futureClassCard.desktop.tsx` was a false-positive per subagent findings — it imports `BaseCard` not `PageContainer`. Skip it. If you find during processing that some other file is also a false positive, skip it and report.)

## Transformation rule per file

Find import lines that:
- Match `import { ... PageContainer ... } from "@/frontend/common/components/ui"` OR `from "@/frontend/common/components/ui/container"` (intermediate barrel form)

Apply:
1. Split the import into TWO imports if `PageContainer` and `PageHeader` are mixed with other shared primitives (like `SectionPanel`, `BaseCard`, `FilterButton`, `PrimaryPageAction`, `StatusBadge`):
   - Keep the non-page primitives in the original `import { ... } from "@/frontend/common/components/ui"` line (minus `PageContainer`/`PageHeader`)
   - Add a new line: `import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";` (only import the ones that were used)
2. Rename usage in the JSX body: `PageContainer` → `DesktopPageContainer`, `PageHeader` → `DesktopPageHeader`

Edge cases:
- If a file imports `PageHeaderBreadcrumb` type from common alongside `PageHeader`, re-import the type from `@/frontend/desktop/components/ui/container/page` (it's re-exported from `DesktopPageHeader.tsx`'s barrel) — or just import from `@/frontend/desktop/components/ui`.
- If a file does NOT import other shared primitives (ONLY PageContainer/PageHeader), replace the entire import line with the desktop import.

Constraints:
- Use the StrReplace or Write tool — NOT sed/awk.
- Preserve all other imports and JSX unchanged.
- Do NOT introduce `useViewport` or `useMediaQuery` (forbidden in `.desktop.tsx`).
- Do NOT cross-import mobile — already ESLint enforced.

## Verification

Use the lint queue server (should already be running from earlier waves — verify with `curl -s http://localhost:4777/status` and start if needed).

Waves of ~8 files in parallel (5 waves total). After each wave:
1. Run `~/.bun/bin/bun tsgo` (full project) — capture whether your specific files appear in errors.
2. For each file in the wave, run `~/.bun/bin/bun biome:check <path>`.
3. Submit each file to the lint queue:
   ```
   curl -s -X POST http://localhost:4777/lint -H "Content-Type: application/json" -d '{"id":"plan4-waveN-fileX","files":["<path>"]}'
   ```
4. Fix any errors in the same files (do NOT modify other files). Re-verify.

## Nested parallel subagents (RECOMMENDED)

This is a large mechanical job — dispatch up to 8 nested subagents in parallel (one per file per wave), do 5 waves sequentially. Each nested subagent gets ONE file, applies the transformation rule, and verifies with `scripts/health/sub-loop.ts <file> --lifecycle lint`.

Template prompt for each nested subagent:
> You are modifying ONE file in the siraj project at /home/ahmed/Projects/siraj: `<FILE_PATH>`.
> 
> Goal: this `.desktop.tsx` view file imports `PageContainer` (and/or `PageHeader`) from `@/frontend/common/components/ui` (or `@/frontend/common/components/ui/container`). Replace those specific imports with `DesktopPageContainer` (and/or `DesktopPageHeader`) from `@/frontend/desktop/components/ui`. If PageContainer/PageHeader were imported alongside other shared primitives (SectionPanel, BaseCard, StatusBadge, FilterButton, PrimaryPageAction, etc.), split the import — keep the shared primitives on the original line from `@/frontend/common/components/ui`, add a new line for the desktop primitives from `@/frontend/desktop/components/ui`. Update JSX usage in the body: `<PageContainer>` → `<DesktopPageContainer>`, `<PageHeader>` → `<DesktopPageHeader>`, and `</PageHeader>` (if any) → `</DesktopPageHeader>`.
> 
> Use the StrReplace or Write tool. Do NOT use sed/awk/echo.
> 
> Read the file first, identify the import line(s) that contain PageContainer/PageHeader, rewrite those lines only. Preserve all other imports and logic.
> 
> Do NOT introduce any new logic. Do NOT add `useViewport`. Do NOT modify any other file.
> 
> Verify with: `~/.bun/bin/bun biome:check <FILE_PATH>` and submit to the lint queue:
> `curl -s -X POST http://localhost:4777/lint -H "Content-Type: application/json" -d '{"id":"plan4-<filename>","files":["<FILE_PATH>"]}'`
> 
> Report: the diff summary and whether verification passed. If lint reports pre-existing errors that are NOT in your edited lines, report them and skip (do NOT fix pre-existing errors outside your change).

## Errors / cross-file dependencies

If a fix requires modifying ANOTHER file (e.g. a prop type mismatch because the desktop wrapper has a slightly different prop name), DO NOT modify the other file. Instead, report:
```
CROSS-FILE DEPENDENCY:
Target file: <this file>
Blocked by: <other file>
Required fix: <description>
```
Note: The desktop wrappers preserve the exact same props as PageContainer/PageHeader, so this should be RARE. Only report if you hit one.

## Report when done

- Count of files processed
- List any false positives skipped (with reason)
- Any cross-file dependencies reported
- Any errors that remain (other than pre-existing ones outside your changes)

Do NOT proceed to Plan 8. Stay within Plan 4's scope.