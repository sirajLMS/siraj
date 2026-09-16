# Outcome — Task CF-2: Carryover i18n gaps rollup

- **Date**: 2026-09-05
- **Status**: Complete

## What was done

Extended the existing `CarryoverLabels` namespace (task 3.3 + 5.3 keys untouched;
all additions are additive) in the three plan-owning locale files with every key
called out by the gap rollups in the 5.5 drawer CROSS-FILE report, the Payroll
export-feedback precedent (grep: `exportTruncated`/`exportFailed` in
`shared/locale/{types,en,ar}/dashboard/billing/payroll.ts` and the sessionAudit
namespace), the 4.4 filter-bar composition, and the 5.1 form validation surface.

Keys added:

1. **`drawer.*` group** (per the 5.5 CROSS-FILE DEPENDENCY "Required fix" list):
   - `title(teacherName: string): string` — EN `Carryover Balance — ${teacherName}`,
     AR `رصيد الترحيل — ${teacherName}` (typed interpolation function).
   - `sessionsHeading(count: number): string` — CLDR-shaped plural. EN:
     0 → "No linked sessions", 1 → "1 linked session", else "{count} linked sessions".
     AR with full 0/1/2/3–10/11+ branching: ``لا توجد جلسات مرتبطة`` /
     ``جلسة مرتبطة واحدة`` / ``جلستان مرتبطتان`` / ``{count} جلسات مرتبطة`` /
     ``{count} جلسة مرتبطة``. `if`/`return` only (no nested ternaries —
     `sonarjs/no-nested-conditional`).
   - `noSessions` — EN "No sessions are linked to this carryover balance." /
     AR "لا توجد جلسات مرتبطة بهذا الرصيد."
   - Session column headers: `sessionDate` (Date/التاريخ), `student` (Student/الطالب),
     `subject` (Subject/المادة), `duration` ("Duration (h)"/المدة (س) — mirrors the
     existing `column.totalDuration` treatment), `amount` (Amount/المبلغ),
     `status` (Status/الحالة).
2. **Top-level `exportTruncated` + `exportFailed`** — verbatim Payroll precedents:
   EN "Export truncated to 10 000 rows." / "CSV export failed. Please try again.";
   AR "تم اقتطاع التصدير إلى 10 000 صف." / "فشل تصدير CSV. حاول مرة أخرى."
   (`exportTruncated` matches the CSV route's 10 000-row `X-Export-Truncated`
   contract in `app/api/carryover/export/route.ts`).
3. **`filters.dateRange`** — EN "Date range" / AR "نطاق التاريخ" (single composable
   label replacing the filter-bar's ad-hoc `${fromDate} – ${toDate}` composition).
4. **`validation.studentsCountInvalid`** — EN "Students must be a non-negative whole
   number." / AR "يجب أن يكون عدد الطلاب عدداً صحيحاً غير سالب." (follows the
   existing `validation.*` key phrasing).

No barrel/registration changes needed — the keys are structural members of the
existing `CarryoverLabels` interface consumed through the existing
`dashboard.accounting.carryover` namespace handle and eager `messages.ts` tree.
Locale snapshots intentionally NOT re-run (orchestrator regenerates after codegen;
translation-cache-store falls back to compile-time loaders for missing keys in the
interim).

## Files

### Edited (additive only)
- `shared/locale/types/dashboard/accounting/carryover.ts` — `CarryoverLabels`:
  `exportTruncated`, `exportFailed`, `filters.dateRange`, `drawer.*` group,
  `validation.studentsCountInvalid`; doc comment extended to cover the drawer and
  CSV export feedback surfaces.
- `shared/locale/en/dashboard/accounting/carryover.ts` — EN implementations.
- `shared/locale/ar/dashboard/accounting/carryover.ts` — AR implementations
  (CLDR pluralization, arabic-locale-review conventions).

## Verification

`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`:

| File | Result |
|---|---|
| `shared/locale/types/dashboard/accounting/carryover.ts` | ✅ exit 0 (first pass) |
| `shared/locale/en/dashboard/accounting/carryover.ts` | ✅ exit 0 (first pass) |
| `shared/locale/ar/dashboard/accounting/carryover.ts` | ✅ exit 0 (second pass — first run's codescene stage hit a transient `CS_ACCESS_TOKEN` fetch failure; re-run passed all six stages: tsgo, oxlint, biome, lint:type-aware, duplicates, codescene) |

No UI/E2E tests run (policy). No new tests added (locale namespace leaves have none
by convention).

## CROSS-FILE DEPENDENCY reports

None. All gaps were confined to the three plan-owned locale leaf files.

## Carry-forward

- Orchestrator: after codegen, `bun run locale:snapshots` must regenerate
  `public/static/locale-snapshots/{en,ar}/dashboard.accounting.carryover.json` so
  the drawer/export/dateRange/studentsCountInvalid keys land in the snapshots.
- `CarryoverDetailDrawer.tsx` (task 5.5): replace the interim
  `balance?.teacherName ?? labels.title` fallback with
  `labels.drawer.title(balance?.teacherName ?? "")`; when the linked-sessions query
  lands (its own CROSS-FILE dependency on `classInstancesByCarryoverId`), bind the
  sessions section heading to `labels.drawer.sessionsHeading(count)`, empty state to
  `labels.drawer.noSessions`, and the six column headers to `drawer.sessionDate /
  drawer.student / drawer.subject / drawer.duration / drawer.amount / drawer.status`.
- Container/toolbar owners (4.6/4.7): consume `labels.exportTruncated` (warning
  toast when the CSV response carries `X-Export-Truncated: true`) and
  `labels.exportFailed` (error toast on fetch failure).
- `CarryoverFilterBar.tsx` (4.4): swap `const dateRangeLabel =
  \`${t.filters.fromDate} – ${t.filters.toDate}\`` for `t.filters.dateRange` when
  the merged range chip is finalized.
- `useCarryoverFormViewModel.ts`: `studentsCount` currently parses leniently; if a
  strict non-negative-integer check is added, wire
  `labels.validation.studentsCountInvalid` into `addPresenceIssues`.
