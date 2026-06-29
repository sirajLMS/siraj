# Tracking Refactor Fixes: Excel with i18n Labels

## Goal
Fix all 5 review findings. Replace unsafe CSV export with styled Excel export using `xlsx-js-style`, following the exact same patterns as `report-export.ts` and `parent-directory-export.ts`.

## Findings to Fix
| # | Severity | Issue |
|---|----------|-------|
| 1 | WARNING | CSV injection via unescaped field values + unsafe `encodeURI`/`data:` URI |
| 2 | WARNING | `new Date()` fallback for null dates fabricates misleading data |
| 3 | WARNING | Null status defaulted to `Pending` — enables approve/reject on unknown-state records |
| 4 | SUGGESTION | Three label interfaces duplicate 10 shared fields — drift risk |
| 5 | SUGGESTION | `RescheduleTrackingDataGridHeaders` is a dead standalone export |

## Existing Patterns (MUST follow)

### Excel export pattern (`frontend/utils/excel-export/`)
Both existing exports share the same structure:
1. **Label interface**: Accept `labels` object with i18n strings (built via `t()` in Container)
2. **Dynamic import**: `const XLSX = await import("xlsx-js-style")`
3. **Workbook creation**: `XLSX.utils.book_new()` → `XLSX.utils.aoa_to_sheet([[]])` → cell-by-cell population → `XLSX.utils.book_append_sheet` → `XLSX.writeFile`
4. **Cell format**: `{ v: value, t: "s" | "n", s: CellStyle }`
5. **Styles**: `titleStyle`, `headerStyle`, `bodyStyle`, `bodyAltStyle`, `nameStyle` (left-aligned bold for names)
6. **Layout**: Row 0 = merged title, Row 1 = blank/subtitle, Row 2/3 = headers, data starts after
7. **Alt rows**: `idx % 2 === 1` gets `bodyAltStyle` (light purple fill `F5F5FA`)
8. **Font**: Cairo throughout
9. **Column widths**: Calculated from header + max data length
10. **Row heights**: Title 30pt, blank, headers 22pt
11. **Filename**: `{name}-{isoDate}.xlsx`
12. **Async**: Function returns `Promise<void>`, caller uses `.catch()` for errors

### i18n label passing pattern
- Container builds labels via `t()` from `useTranslations`
- Labels passed to export function as structured object
- Export function is **stateless** — never calls `t()` itself

## Implementation Details

### 1. New file: `frontend/utils/excel-export/tracking-export.ts`

**Why new file**: Follows existing convention — each domain gets its own export file in `frontend/utils/excel-export/`.

**Label interface** (mirrors `ReportExportLabels` / `ParentDirectoryExportLabels`):
```typescript
interface TrackingExportLabels {
  readonly pageTitle: string;
  readonly table: {
    readonly teacher: string;
    readonly student: string;
    readonly scheduledDate: string;
    readonly timeSlot: string;
    readonly status: string;
  };
  readonly statusLabels: Record<string, string>;
}
```

**Data interface**:
```typescript
interface TrackingExportData {
  readonly rows: readonly TrackingRow[];
  readonly labels: TrackingExportLabels;
}
```

**Styles**: Copy from `parent-directory-export.ts` (simpler, no financials):
- `titleStyle`, `headerStyle`, `bodyStyle`, `bodyAltStyle`, `nameStyle`, `nameAltStyle`, `statusStyle`, `statusAltStyle`
- All using Cairo font, same color scheme (`#1A237E` header, `#F5F5FA` alt fill, etc.)

**Row population**:
```typescript
rows.forEach((row, idx) => {
  const r = dataStartRow + idx;
  const isAlt = idx % 2 === 1;
  const values = [
    row.teacherName ?? "",
    row.studentName ?? "",
    row.scheduledDate ?? "",
    row.timeSlot ?? "",
    row.status != null ? (labels.statusLabels[row.status] ?? row.status) : "",
  ];
  // Column 0: nameStyle/nameAltStyle (left-aligned, bold)
  // Column 4: statusStyle/statusAltStyle (bold)
  // Other columns: bodyStyle/bodyAltStyle
});
```

**Column widths**: `[25, 25, 18, 20, 16]`
**Row heights**: `[30, {}, 22]` (title, blank, header)
**Filename**: `reschedule-tracking-${isoDate}.xlsx`

### 2. Changes to `tracking.helpers.tsx`

**Remove**: `handleExportData` function entirely (moved to `tracking-export.ts`)

**Date null fix** in `buildTrackingRows`:
```typescript
// Before
const start = r.scheduledStartAt && typeof r.scheduledStartAt === "string"
  ? new Date(r.scheduledStartAt) : new Date();

// After
const start = r.scheduledStartAt && typeof r.scheduledStartAt === "string"
  ? new Date(r.scheduledStartAt) : undefined;
const end = r.scheduledEndAt && typeof r.scheduledEndAt === "string"
  ? new Date(r.scheduledEndAt) : undefined;

const scheduledDate = start
  ? start.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric" })
  : "";
const timeSlot = start && end
  ? `${formatTime(start)} - ${formatTime(end)}`
  : "";
```

**Status null fix** in `buildTrackingRows`:
```typescript
// Before
status: r.status ?? LeaveRequestStatus.Pending,

// After — propagate null, don't default
status: r.status ?? null,
```

### 3. Changes to `tracking.types.ts`

**Label deduplication** — extract shared base:
```typescript
interface RescheduleTrackingCommonLabels extends TrackingStatusLabelMap {
  readonly newDate: string;
  readonly leaveRequest: string;
  readonly rescheduled: string;
  readonly pendingLeave: string;
  readonly viewDetails: string;
  readonly noEntries: string;
}

interface RescheduleTrackingCardListLabels extends RescheduleTrackingCommonLabels {}

interface RescheduleTrackingDataGridLabels extends RescheduleTrackingCommonLabels {
  readonly approveLeave: string;
  readonly rejectLeave: string;
}

interface RescheduleTrackingViewLabels extends RescheduleTrackingCommonLabels {
  readonly exportData: string;
  readonly filterAll: string;
  readonly showingOf: string;
  readonly teacherName: string;
  readonly studentName: string;
  readonly scheduledDate: string;
  readonly timeSlot: string;
  readonly classStatus: string;
  readonly action: string;
}
```

**Dead export cleanup** — inline headers into props:
```typescript
interface RescheduleTrackingDataGridProps {
  readonly rows: readonly TrackingRow[];
  readonly headers: {
    readonly teacherName: string;
    readonly studentName: string;
    readonly scheduledDate: string;
    readonly timeSlot: string;
    readonly classStatus: string;
    readonly action: string;
  };
  // ...rest unchanged
}
```

Remove `RescheduleTrackingDataGridHeaders` export.

### 4. Changes to `RescheduleTrackingContainer.tsx`

- Import `exportRescheduleTracking` from `@/frontend/utils/excel-export/tracking-export`
- Build export labels from `t()`:
```typescript
const handleExport = useCallback(() => {
  exportRescheduleTracking({
    rows,
    labels: {
      pageTitle: t("pageTitle"),
      table: {
        teacher: t("table.teacherName"),
        student: t("table.studentClass"),
        scheduledDate: t("table.scheduledDate"),
        timeSlot: t("table.timeSlot"),
        status: t("table.classStatus"),
      },
      statusLabels: {
        [LeaveRequestStatus.Pending]: t("status.pendingLeave"),
        [LeaveRequestStatus.Rescheduled]: t("status.rescheduled"),
        [LeaveRequestStatus.Approved]: t("status.approved"),
        [LeaveRequestStatus.Cancelled]: t("status.cancelled"),
      },
    },
  }).catch((err: unknown) => {
    logger.error("Excel export failed", err);
  });
}, [rows, t]);
```

- Remove `handleExportData` import from `tracking.helpers`

### 5. Changes to DataGrid + CardList (status null handling)

Both components already use `row.status ?? LeaveRequestStatus.Pending` in the render. Change to:
- Extract `const status = row.status;` (no default)
- For StatusBadge: `status={status ?? LeaveRequestStatus.Pending}` for display badge only
- For action buttons: add null guard
```typescript
if (status == null) {
  // No action buttons for unknown status
  return <Tooltip title={labels.viewDetails}>...</Tooltip>;
}
if (status === LeaveRequestStatus.Pending) {
  // Show approve/reject
}
```

### 6. Changes to i18n labels (`RescheduleTrackingLabels`)

No new i18n keys needed — all existing keys cover the export:
- `pageTitle` → Excel title
- `table.teacherName` → column header
- `table.studentClass` → column header
- `table.scheduledDate` → column header
- `table.timeSlot` → column header
- `table.classStatus` → column header
- `status.*` → status cell values

### 7. Remove old CSV export

Delete the `handleExportData` function from `tracking.helpers.tsx`. The Excel export lives in `frontend/utils/excel-export/tracking-export.ts`.

## Files Changed
| File | Changes |
|------|---------|
| `frontend/utils/excel-export/tracking-export.ts` | **NEW** — Excel export function + styles + label interface |
| `tracking.helpers.tsx` | Remove `handleExportData`, fix date nulls, fix status nulls |
| `tracking.types.ts` | Label dedup, inline headers, status type |
| `RescheduleTrackingContainer.tsx` | Use `exportRescheduleTracking`, build i18n labels |
| `RescheduleTrackingDataGrid.tsx` | Status null guard for actions, type updates |
| `RescheduleTrackingCardList.tsx` | Status null handling in CardFooter |
| `RescheduleTrackingView.tsx` | Type updates from label refactor |

## Verification
1. `tsgo` clean — no type errors after label refactor
2. `biome:check` clean
3. Manual: Excel file opens with i18n labels, styled rows, null dates show blank, unknown status shows blank
