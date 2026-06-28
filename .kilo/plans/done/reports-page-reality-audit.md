# Reports Page - Reality Audit & Fix Plan

## Findings: Components Using Fake/Non-Functional Data or Actions

After auditing the entire `app/[locale]/(dashboard)/reports` page tree, I identified **4 issues** where components use fake data or have no-op actions.

---

### Issue 1: `engagementGrowth` is hardcoded to `12.4`
**File**: `frontend/views/dashboard/reports/ReportsContainer.tsx:81`

The `engagementGrowth` value (shown in the `EngagementRateCard` as "+12.4% Growth") is always hardcoded to `12.4` regardless of report data. The backend (`ReportRepository`) does not calculate growth — it only returns current-period aggregates. There is no "previous period" comparison available.

**Decision: Add backend support for period-over-period growth calculation**

Implementation plan:
1. Add `engagementGrowth` field to `AttendanceReportRow` in `report.repository.ts` — calculate by running a parallel query for the previous period (same duration, shifted back) and computing the percentage change in `takenClasses`
2. Expose the field in `report.service.ts` (pass through from repo)
3. Add `engagementGrowth` field to `AttendanceReportRowObj` in `report.pothos.ts` as a nullable float
4. Add `engagementGrowth` to `report.documents.ts` GraphQL selection set
5. Update `mapReportRows` and `ReportsSummarySection` in `ReportsContainer.tsx` to use the real growth value from the API response

---

### Issue 2: `handleExportCsv` is a no-op (only logs)
**File**: `frontend/views/dashboard/reports/ReportsContainer.tsx:286-288`

**Decision: Use `xlsx-js-style` for styled Excel export**

The project already has `xlsx` (^0.18.5) in `package.json` (though not used yet). The mo3lmti project uses `xlsx-js-style` extensively with rich cell styling (fonts, fills, borders, alignment, formulas, dynamic dimensions, hidden unused cells). This is the right approach for a professional reports page.

Implementation plan:
1. Add `xlsx-js-style` as a dependency: `~/.bun/bin/bun add xlsx-js-style`
2. Create `frontend/utils/excel-export/report-export.ts` — utility module with:
   - Styles: title, header, body (normal/alternate), financial highlight styles
   - `exportAttendanceReport(rows, summary, labels, filters)` function:
     - Dynamic import of `xlsx-js-style` for code splitting
     - Build workbook with: title row (merged, styled), header row, data rows, totals row
     - Conditional financial columns based on `showFinancials`
     - Apply cell styling, dynamic column widths, row heights
     - `XLSX.writeFile(workbook, filename)`
3. Update `ReportsContainer.tsx` `handleExportCsv` to call the export utility
4. Remove `xlsx` (original unstyled fork) if no longer needed, or replace with `xlsx-js-style`

**Why xlsx-js-style over CSV**: Excel provides:
- Professional styling (branded headers, alternating row colors, bold totals)
- Auto-calculated column widths
- Formulas (e.g., SUM for totals instead of static values)
- RTL support for Arabic locale
- Merged cells for title sections
- `@media print` would look unstyled; PDF libs add heavy dependencies; `xlsx-js-style` is already proven in mo3lmti

---

### Issue 3: `handlePrintReport` is a no-op (only logs)
**File**: `frontend/views/dashboard/reports/ReportsContainer.tsx:290-292`

**Recommendation: Use `window.print()`** — here's the analysis:

| Option | Pros | Cons |
|--------|------|------|
| `window.print()` | Zero dependencies, respects page layout, user gets browser print dialog (Save as PDF, printer selection, margins), works with existing responsive layout | No custom page breaks or header/footer control without `@media print` CSS |
| PDF lib (jspdf / react-pdf) | Full control over PDF layout | Heavy dependency, must replicate all the data grid/summary layout manually, significant dev effort for each report type |
| `react-to-print` | Fine-grained control over what gets printed | Extra dependency, still relies on browser print under the hood, complexity for marginal gain |

**Decision: `window.print()`** — it's sufficient because:
- The report page already has a clean, structured layout
- Browser print dialog allows saving as PDF natively
- No extra dependencies needed
- `@media print` CSS rules can be added later if needed for page breaks

Implementation plan:
1. Change `handlePrintReport` to `window.print()`
2. Optionally add minimal `@media print` CSS to hide nav/sidebar chrome and show only the report content

---

### Issue 4: `by_student` report type has no backend support
**File**: `frontend/views/dashboard/reports/components/ReportFiltersForm.tsx:139`

The filter form offers "by_student" as a grouping option, but the backend `ReportGroupingMode` enum only has `DATE` and `TEACHER`. When a user selects "by_student", `handleSubmit` maps it to `ReportGroupingMode.Teacher` (fallback).

**Decision: Add `STUDENT` grouping mode to the backend**

Implementation plan — 4 layers bottom-up:

**Layer 1: Repository** (`backend/db/repo/report.repository.ts`)
- Add `STUDENT = "STUDENT"` to `ReportGroupingMode` enum
- Update `generateAttendanceReport` query to handle `STUDENT` grouping:
  - `groupKeyExpr`: group by `classInstances.studentId`
  - `groupLabelExpr`: join `students` → `users` table to get student name
  - Requires joining `students` table (check schema for the join path)

**Layer 2: Types** (`backend/types/report.types.ts`) — if not already present, create canonical types
- Ensure `AttendanceReportRow` type includes `engagementGrowth`
- Ensure `ReportGroupingMode` is properly exported

**Layer 3: Service** (`backend/services/report/report.service.ts`)
- Pass through `STUDENT` grouping mode (no special service logic needed)

**Layer 4: GraphQL** (`backend/graphql/pothos/report.pothos.ts`)
- `ReportGroupingModeEnum` will automatically pick up the new enum value since it uses `ReportGroupingMode` directly
- Add `engagementGrowth` float field to `AttendanceReportRowObj`
- No new query/mutation needed

**Layer 5: Frontend** 
- `ReportsContainer.tsx`: Fix `handleSubmit` to map `by_student` → `ReportGroupingMode.Student` instead of fallback to Teacher
- Update `report.documents.ts` to include `engagementGrowth` in the selection
- Update `ReportsContainer.tsx` to read `engagementGrowth` from the API response instead of hardcoding

---

## Implementation Order (Bottom-Up by Layer)

### Phase 1: Backend (Repository → Types → Service → GraphQL)
1. Add `STUDENT` to `ReportGroupingMode` in `report.repository.ts` + implement the query
2. Add `engagementGrowth` calculation to `report.repository.ts` (previous-period comparison)
3. Update `report.service.ts` to pass through the new fields
4. Update `report.pothos.ts` to expose `engagementGrowth` field
5. Run `bun run generate:gqlSchema && bun codegen` to regenerate types
6. Run backend tests: `bun run test:db` (report repo tests) and `bun run test:graphql`

### Phase 2: Frontend (Documents → Container → Components)
7. Add `engagementGrowth` to `report.documents.ts` selection set
8. Implement `xlsx-js-style` Excel export utility in `frontend/utils/excel-export/`
9. Update `ReportsContainer.tsx`:
   - Replace hardcoded `engagementGrowth = 12.4` with API data
   - Replace no-op `handleExportCsv` with real Excel export call
   - Replace no-op `handlePrintReport` with `window.print()`
   - Fix `by_student` → `ReportGroupingMode.Student` mapping
10. Run `bun tsgo`, `bun biome:check`, `bun lint`
11. Run `bun run test:ui:components`

---

## Components That Are Already Real (No Changes Needed)

| Component | Status |
|-----------|--------|
| `ReportsContainer` data fetching | Real — `useQuery` with `teachersQueryDocument` and `generateAttendanceReportQueryDocument` |
| `ReportFiltersForm` filter inputs | Real — date pickers, teacher dropdown, grouping select feed into GraphQL query |
| `ReportsDataGrid` data display | Real — renders rows from GraphQL response |
| `ReportsTotalsRow` summary display | Real — computed from actual row data |
| `FinancialDistributionCard` | Real — EGP/USD percentages from actual data |
| `EngagementRateCard` (rate only) | Real — engagement rate computed from actual data |
| `PerformanceLedgerCard` / `PerformanceLedgerCardList` | Real — renders actual row data in mobile view |
| `ReportFiltersCollapsible` | Real — mobile wrapper for `ReportFiltersForm` |
| Permission gating (`canGenerate`, `showFinancials`) | Real — checks actual user permissions |
| `RequirePermission` wrapper | Real — gates entire page on `ReportGenerateCustom` |

---

## Quality Checks After Each Phase

- `bun tsgo` — type check
- `bun biome:check` — lint/format
- `bun lint` — ESLint
- Phase 1: `bun run test:db` for repo tests, `bun run test:graphql` for GraphQL tests
- Phase 2: `bun run test:ui:components` for UI component tests
- Do NOT run codescene or sonarscan (per user instructions)

## Scope Boundary

Only modify files within the reports domain. Do NOT fix issues in other files/layers even if errors are found.
