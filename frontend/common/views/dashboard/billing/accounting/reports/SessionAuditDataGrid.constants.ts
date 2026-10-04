import { alpha, type Theme } from "@mui/material/styles";
import { OrderSortDirection, SessionAuditReportSortField } from "@/frontend/common/graphql/generated/gql/graphql";

/** Page-size choices surfaced in the grid pager dropdown. */
export const SESSION_AUDIT_PAGE_SIZE_OPTIONS: readonly number[] = [25, 50, 100, 200];

/**
 * Timestamp cells render a numeric day/month plus short time — the year and
 * the spelled-out month name are omitted so the three date-time columns stay
 * narrow enough to fit beside the name and status columns. Arabic month names
 * are wider than Latin ones, so the numeric month keeps both scripts inside
 * the column budget; the complete timestamp remains available in cell tooltips.
 */
export const COMPACT_SESSION_TIME_FORMAT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

/**
 * Long localized headers (e.g. the two duration columns) wrap onto a second
 * line within the standard header height. The slightly reduced size and
 * letter-spacing keep the longest unbreakable word ("CALCULATED") inside the
 * narrowest header without mid-word clipping; wrapping stays at word
 * boundaries only.
 */
export const HEADER_WRAP_SX = {
  "& .MuiDataGrid-columnHeaderTitle": {
    whiteSpace: "normal",
    overflowWrap: "normal",
    lineHeight: 1.25,
    fontSize: "0.7rem",
    letterSpacing: "0.04em",
  },
} as const;

/** Denser horizontal cell padding than the shared default; the columns stay readable at report widths. */
export const CELL_PAD_SX = {
  "& .MuiDataGrid-cell": {
    paddingInline: 8,
  },
} as const;

/** Ellipsized single-line text content for compact cell values (datetimes). */
export const ELLIPSIZED_CELL_SX = {
  display: "block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

/**
 * Zero-row geometry: the collapsed grid body would otherwise be shorter than
 * the empty-state panel, so the panel would overflow under the footer. A
 * min-height reserved while there are no rows gives the panel its room; once
 * rows exist, the grid stretches past it on its own. While the panel covers
 * the body, the footer's "no data" caption duplicates the panel heading, so
 * it hides and the footer footprint stays — pagination reports a zero-page
 * range either way.
 */
export const EMPTY_REPORT_SX = {
  minHeight: 300,
  "& .MuiDataGrid-footerContainer .MuiTypography-root": {
    visibility: "hidden",
  },
} as const;

/**
 * Narrow viewport cue: columns overflow the grid's inline end and, on OS
 * chrome that paints no scrollbar, a clipped column reads as the end of the
 * table. The strip is an explicit overlay sibling of the grid (a pseudo
 * element's fully-opaque paper-colored destination blends invisibly into the
 * row surfaces in dark surfaces), rendered as a semi-transparent paper raft so
 * chips visibly fade under it, with a 1px divider line at the strip's
 * inline-start edge and a light elevation shadow marking the clip boundary.
 * It rides above the virtualized row layers so chips fade under it rather
 * than next to it; above md the persistent scrollbar cue does this job.
 */
export const MOBILE_EDGE_FADE_SX = (theme: Theme) => ({
  position: "absolute",
  top: 0,
  bottom: 0,
  insetInlineEnd: 0,
  width: 44,
  pointerEvents: "none",
  zIndex: 5,
  background:
    theme.direction === "rtl"
      ? `linear-gradient(to left, transparent, ${alpha(theme.palette.background.paper, 0.35)} 45%, ${alpha(theme.palette.background.paper, 0.95)})`
      : `linear-gradient(to right, transparent, ${alpha(theme.palette.background.paper, 0.35)} 45%, ${alpha(theme.palette.background.paper, 0.95)})`,
  borderInlineStart: `1.5px solid ${theme.palette.action.disabledBackground}`,
  boxShadow: theme.shadows[4],
  display: { xs: "block", md: "none" },
});

/**
 * Cells whose own interactive content must not trigger row navigation:
 * the note popover button, the row-action button, the carryover link chip, and
 * the checkbox-selection column own their clicks and keystrokes.
 */
export const NON_NAVIGATING_FIELDS: ReadonlySet<string> = new Set([
  "payrollNote",
  "actions",
  "carryoverLink",
  "__check__",
]);

/** Grid column field → server sort field, for the columns the API can sort. */
export const GRID_FIELD_TO_SORT_FIELD: Record<string, SessionAuditReportSortField> = {
  scheduledStartAt: SessionAuditReportSortField.ScheduledStartAt,
  actualStartAt: SessionAuditReportSortField.ActualStartAt,
  actualEndAt: SessionAuditReportSortField.ActualEndAt,
  durationMinutes: SessionAuditReportSortField.DurationMinutes,
  calculatedDuration: SessionAuditReportSortField.CalculatedDuration,
  teacherPaidAmount: SessionAuditReportSortField.TeacherPaidAmount,
  calculationStatus: SessionAuditReportSortField.CalculationStatus,
  teacherName: SessionAuditReportSortField.TeacherName,
  studentName: SessionAuditReportSortField.StudentName,
};

/** View-model sort direction → MUI column sort direction. */
export const SORT_DIRECTION_TO_GRID_SORT: Record<OrderSortDirection, "asc" | "desc"> = {
  [OrderSortDirection.Asc]: "asc",
  [OrderSortDirection.Desc]: "desc",
};

/**
 * The grid's default cycle includes a third "unsorted" state, but every report
 * query always carries a server sort — the cleared model falls back to the
 * default sort instead, so a "no sort" step on the default column would read
 * as a dead click. Restricting the cycle to asc/desc keeps every header click
 * a visible direction flip.
 */
export const SESSION_AUDIT_SORTING_ORDER: readonly ("asc" | "desc")[] = ["asc", "desc"];

export function auditHref(instanceId: string): string {
  return `/classes/${instanceId}/audit`;
}

export function auditOverrideHref(instanceId: string): string {
  return `/classes/${instanceId}/audit?openOverride=1`;
}

/** Drill-down deep link to the carryover detail drawer for a linked session. */
export function carryoverHref(carryoverBalanceId: string): string {
  return `/accounting/carryover/${carryoverBalanceId}`;
}
