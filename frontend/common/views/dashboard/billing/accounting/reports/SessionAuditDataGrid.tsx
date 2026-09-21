"use client";

import { AccountBalanceWalletOutlined, CheckCircleOutlined, OpenInNewOutlined } from "@mui/icons-material";
import { Box, Button, Chip, IconButton, Stack, Tooltip } from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import type { GridCellParams, GridColDef, GridSortModel, MuiEvent } from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { formatDateTime, getDateTimeFormatter, parseDateInput } from "@/frontend/common/components/intl/dateFormat";
import { StatusBadge } from "@/frontend/common/components/ui";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { usePageLocalRowSelection } from "@/frontend/common/components/ui/dataGrid/usePageLocalRowSelection";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { ErrorState } from "@/frontend/common/components/ui/state";
import {
  CalculationStatus,
  OrderSortDirection,
  SessionAuditReportSortField,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { CarryoverBulkCreateDialog } from "@/frontend/common/views/dashboard/billing/accounting/reports/CarryoverBulkCreateDialog";
import {
  formatDurationMinutes,
  formatPaidAmount,
  formatPartialPercentage,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/formatters/sessionAuditCellFormatters";
import { PayrollNotePopover } from "@/frontend/common/views/dashboard/billing/accounting/reports/PayrollNotePopover";
import { SessionAuditAggregateCard } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditAggregateCard";
import { SessionAuditEmptyState } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditEmptyState";
import { SessionAuditStatusChip } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditStatusChip";
import type {
  SessionAuditReportRow,
  SessionAuditReportsViewModel,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";
import { useAppTranslation } from "@/shared/locale";
import { DashboardBillingPayroll } from "@/shared/locale/namespaces";
import type { PayrollLabels } from "@/shared/locale/types/dashboard/billing/payroll";
import type { SessionAuditLabels } from "@/shared/locale/types/dashboard/reports";

/** Page-size choices surfaced in the grid pager dropdown. */
const SESSION_AUDIT_PAGE_SIZE_OPTIONS: readonly number[] = [25, 50, 100, 200];

/**
 * Timestamp cells render a numeric day/month plus short time — the year and
 * the spelled-out month name are omitted so the three date-time columns stay
 * narrow enough to fit beside the name and status columns. Arabic month names
 * are wider than Latin ones, so the numeric month keeps both scripts inside
 * the column budget; the complete timestamp remains available in cell tooltips.
 */
const COMPACT_SESSION_TIME_FORMAT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

/**
 * Compact date-time for the grid's timestamp cells. Mirrors the shared cell
 * formatter contract: invalid input passes through verbatim when it carries
 * text, otherwise the cell placeholder wins.
 */
function formatCompactSessionTime(
  value: Date | string | number | null | undefined,
  locale: string,
  fallbackText: string
): string {
  const parsed = parseDateInput(value);
  if (parsed !== null) {
    return getDateTimeFormatter(getLatnLocaleTag(locale), COMPACT_SESSION_TIME_FORMAT).format(parsed);
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return fallbackText;
}

/**
 * The MUI X grid hides its horizontal scrollbar on overlay-scrollbar
 * platforms (macOS, Gnome Web) until the user guesses at scrolling, so a
 * clipped trailing column reads as the end of the table. Painting a persistent
 * thin thumb/track on the grid's horizontal scrollbar element keeps off-frame
 * columns discoverable; the element only exists while columns overflow, so no
 * cue appears when everything fits.
 */
const SCROLLBAR_CUE_SX = (theme: Theme) => ({
  "& .MuiDataGrid-scrollbar--horizontal": {
    scrollbarWidth: "thin",
    scrollbarColor: `${theme.palette.action.active} ${theme.palette.action.hover}`,
    "&[IP_REDACTED]-webkit-scrollbar": {
      height: 8,
    },
    "&[IP_REDACTED]-webkit-scrollbar-track": {
      backgroundColor: theme.palette.action.hover,
    },
    "&[IP_REDACTED]-webkit-scrollbar-thumb": {
      backgroundColor: theme.palette.action.active,
      borderRadius: theme.shape.borderRadius,
    },
  },
});

/**
 * Long localized headers (e.g. the two duration columns) wrap onto a second
 * line within the standard header height. The slightly reduced size and
 * letter-spacing keep the longest unbreakable word ("CALCULATED") inside the
 * narrowest header without mid-word clipping; wrapping stays at word
 * boundaries only.
 */
const HEADER_WRAP_SX = {
  "& .MuiDataGrid-columnHeaderTitle": {
    whiteSpace: "normal",
    overflowWrap: "normal",
    lineHeight: 1.25,
    fontSize: "0.7rem",
    letterSpacing: "0.04em",
  },
} as const;

/** Denser horizontal cell padding than the shared default; the columns stay readable at report widths. */
const CELL_PAD_SX = {
  "& .MuiDataGrid-cell": {
    paddingInline: 8,
  },
} as const;

/** Ellipsized single-line text content for compact cell values (datetimes). */
const ELLIPSIZED_CELL_SX = {
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
const EMPTY_REPORT_SX = {
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
const MOBILE_EDGE_FADE_SX = (theme: Theme) => ({
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
const NON_NAVIGATING_FIELDS: ReadonlySet<string> = new Set(["payrollNote", "actions", "carryoverLink", "__check__"]);

/** Grid column field → server sort field, for the columns the API can sort. */
const GRID_FIELD_TO_SORT_FIELD: Record<string, SessionAuditReportSortField> = {
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
const SORT_DIRECTION_TO_GRID_SORT: Record<OrderSortDirection, "asc" | "desc"> = {
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
const SESSION_AUDIT_SORTING_ORDER: readonly ("asc" | "desc")[] = ["asc", "desc"];

function auditHref(instanceId: string): string {
  return `/classes/${instanceId}/audit`;
}

function auditOverrideHref(instanceId: string): string {
  return `/classes/${instanceId}/audit?openOverride=1`;
}

/** Drill-down deep link to the carryover detail drawer for a linked session. */
function carryoverHref(carryoverBalanceId: string): string {
  return `/accounting/carryover/${carryoverBalanceId}`;
}

interface SessionTimeCellProps {
  /** Raw ISO timestamp from the report row; null renders the muted placeholder. */
  readonly value: string | null;
  /** Booking timezone snapshot recorded when the session was scheduled; tooltip-only context. */
  readonly bookingTimezone: string | null;
  readonly locale: string;
  readonly labels: SessionAuditLabels;
  /** Which timestamp this cell renders; selects the formatter and placeholder copy. */
  readonly kind: "open" | "end";
  /** Whether the session was actually joined; gates the end cell's in-progress placeholder. */
  readonly sessionStarted: boolean;
}

/**
 * Missing-timestamp copy for a time cell: a room-exit placeholder reads
 * "in progress" only once the session has actually started; sessions never
 * joined read "not joined" in both cells.
 */
function resolveTimeCellPlaceholder(kind: "open" | "end", sessionStarted: boolean, labels: SessionAuditLabels): string {
  if (kind === "open" || !sessionStarted) {
    return labels.cell.notJoined;
  }
  return labels.cell.inProgress;
}

/**
 * Room-entry / room-exit cell: localized timestamp in the operator's time zone,
 * with a hover tooltip revealing the raw UTC value and the booking timezone.
 * Missing timestamps render as muted placeholders and carry no tooltip.
 */
function SessionTimeCell({
  value,
  bookingTimezone,
  locale,
  labels,
  kind,
  sessionStarted,
}: Readonly<SessionTimeCellProps>) {
  const placeholder = resolveTimeCellPlaceholder(kind, sessionStarted, labels);
  if (value === null || value.trim() === "") {
    return (
      <Box component="span" sx={theme => ({ color: theme.palette.text.secondary })}>
        {placeholder}
      </Box>
    );
  }
  const tooltip = (
    <Stack sx={{ gap: 0.25 }}>
      <Box component="span">{labels.tooltip.rawUtc(value)}</Box>
      {bookingTimezone !== null && bookingTimezone !== "" ? (
        <Box component="span">{labels.tooltip.bookingTimezone(bookingTimezone)}</Box>
      ) : null}
    </Stack>
  );
  return (
    <Tooltip title={tooltip}>
      <Box component="span" sx={ELLIPSIZED_CELL_SX}>
        {formatCompactSessionTime(value, locale, placeholder)}
      </Box>
    </Tooltip>
  );
}

interface ScheduledStartCellProps {
  /** Raw ISO timestamp; sessions are scheduled in the future so this is always present. */
  readonly value: string | null | undefined;
  readonly locale: string;
  /** Muted placeholder rendered when the row carries no scheduled start. */
  readonly fallback: string;
}

/**
 * Scheduled-start cell: compact date-plus-time without the year keeps the
 * column narrow; the full localized timestamp is revealed in a hover tooltip
 * (keyboard users focus the cell content). Corrupt non-empty values pass
 * through verbatim so bad data stays visible instead of masquerading empty.
 */
function ScheduledStartCell({ value, locale, fallback }: Readonly<ScheduledStartCellProps>) {
  const parsed = parseDateInput(value);
  if (parsed !== null) {
    return (
      <Tooltip title={formatDateTime(parsed, locale)}>
        <Box component="span" sx={ELLIPSIZED_CELL_SX}>
          {formatCompactSessionTime(parsed, locale, fallback)}
        </Box>
      </Tooltip>
    );
  }
  const verbatim = value?.trim() ?? "";
  if (verbatim.length > 0) {
    return (
      <Box component="span" sx={ELLIPSIZED_CELL_SX}>
        {verbatim}
      </Box>
    );
  }
  return (
    <Box component="span" sx={theme => ({ color: theme.palette.text.secondary })}>
      {fallback}
    </Box>
  );
}

interface CalculationStatusCellProps {
  readonly status: CalculationStatus | null;
  /** Payment timestamp of the settled teacher due; only meaningful for paid rows. */
  readonly paymentDateIso: string | null;
  readonly locale: string;
  readonly cellLabels: SessionAuditLabels["cell"];
  readonly statusLabels: Record<CalculationStatus, string>;
}

/**
 * Payroll status cell: grey dash while uncalculated, the status badge
 * otherwise, and for paid rows a success marker whose tooltip reveals when the
 * payment was made.
 */
function CalculationStatusCell({
  status,
  paymentDateIso,
  locale,
  cellLabels,
  statusLabels,
}: Readonly<CalculationStatusCellProps>) {
  if (status === null) {
    return (
      <Box component="span" sx={theme => ({ color: theme.palette.text.secondary })}>
        {cellLabels.notCalculated}
      </Box>
    );
  }
  const chip = <StatusBadge category="payrollCalculation" status={status} label={statusLabels[status]} />;
  if (status === CalculationStatus.Paid && paymentDateIso !== null) {
    return (
      <Stack direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
        {chip}
        <Tooltip title={formatDateTime(paymentDateIso, locale)}>
          <CheckCircleOutlined fontSize="small" sx={theme => ({ color: theme.palette.success.main })} />
        </Tooltip>
      </Stack>
    );
  }
  return chip;
}

interface PersonNameCellProps {
  readonly value: string | null;
}

/**
 * Person/subject name cell. Teacher/student names are often Latin while the
 * surrounding grid row may be RTL; without an isolated direction context the
 * bidi algorithm clips the name's leading characters at the cell edge. The
 * `dir="auto"` + `unicode-bidi: isolate` span anchors each name in its own
 * direction while `text-align: start` keeps it flush with the cell's inline
 * start, so truncation always removes trailing characters.
 */
function PersonNameCell({ value }: Readonly<PersonNameCellProps>) {
  if (value === null || value.trim() === "") {
    return null;
  }
  return (
    <Box
      component="span"
      dir="auto"
      title={value}
      sx={{
        flex: 1,
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        textAlign: "start",
        unicodeBidi: "isolate",
      }}
    >
      {value}
    </Box>
  );
}

interface CarryoverLinkCellProps {
  readonly carryoverBalanceId: string | null;
  readonly chipLabel: string;
  /** Muted placeholder rendered while the session is not linked to any carryover. */
  readonly emptyText: string;
  readonly onOpen: (carryoverBalanceId: string) => void;
}

/**
 * Carryover-link column cell: a clickable chip on rows already rolled into a
 * carryover balance (navigates to the carryover detail route), or the muted
 * placeholder while the session is still unlinked.
 */
function CarryoverLinkCell({ carryoverBalanceId, chipLabel, emptyText, onOpen }: Readonly<CarryoverLinkCellProps>) {
  if (carryoverBalanceId === null || carryoverBalanceId === "") {
    return (
      <Box component="span" sx={theme => ({ color: theme.palette.text.secondary })}>
        {emptyText}
      </Box>
    );
  }
  return (
    <Chip
      size="small"
      clickable
      color="success"
      variant="outlined"
      label={chipLabel}
      aria-label={chipLabel}
      onClick={() => onOpen(carryoverBalanceId)}
    />
  );
}

interface SessionAuditColumnArgs {
  readonly labels: SessionAuditLabels;
  readonly payrollLabels: PayrollLabels;
  readonly calculationStatusLabels: Record<CalculationStatus, string>;
  readonly locale: string;
  readonly canManageReports: boolean;
  readonly onOpenAuditOverride: (row: SessionAuditReportRow) => void;
  readonly onOpenCarryover: (carryoverBalanceId: string) => void;
}

function buildTimeCellColumn(
  kind: "open" | "end",
  headerName: string,
  labels: SessionAuditLabels,
  locale: string
): GridColDef<SessionAuditReportRow> {
  return {
    field: kind === "open" ? "actualStartAt" : "actualEndAt",
    headerName,
    // The compact numeric-month date-time plus the localized "in progress" /
    // "not joined" placeholders need a little more room than the sorted-name
    // columns; the width also holds the sort direction icon without ellipsizing.
    width: 124,
    renderCell: ({ row }) => (
      <SessionTimeCell
        value={kind === "open" ? row.actualStartAt : row.actualEndAt}
        bookingTimezone={row.bookingTimezone}
        locale={locale}
        labels={labels}
        kind={kind}
        sessionStarted={row.actualStartAt !== null}
      />
    ),
  };
}

function buildSessionAuditColumns({
  labels,
  payrollLabels,
  calculationStatusLabels,
  locale,
  canManageReports,
  onOpenAuditOverride,
  onOpenCarryover,
}: SessionAuditColumnArgs): GridColDef<SessionAuditReportRow>[] {
  const columns: GridColDef<SessionAuditReportRow>[] = [
    {
      field: "scheduledStartAt",
      headerName: labels.column.scheduledStart,
      // The two-word header wraps onto two lines; below ~124px the sort icon
      // steals the room "SCHEDULED" needs and the header ellipsizes.
      width: 124,
      renderCell: ({ value }) => (
        <ScheduledStartCell value={value} locale={locale} fallback={labels.cell.notCalculated} />
      ),
    },
    {
      field: "teacherName",
      headerName: labels.filters.teacher,
      flex: 1.25,
      // Roomier name floor reclaims width from the numeric columns so full
      // names render without ellipsizing at default desktop widths.
      minWidth: 150,
      renderCell: ({ row }) => <PersonNameCell value={row.teacherName} />,
    },
    {
      field: "currentStatus",
      headerName: labels.filters.status,
      width: 124,
      sortable: false,
      renderCell: ({ row }) =>
        row.currentStatus === null ? (
          <Box component="span" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.cell.notCalculated}
          </Box>
        ) : (
          <SessionAuditStatusChip
            status={row.currentStatus}
            labels={labels.status}
            actualStartAt={row.actualStartAt}
            actualEndAt={row.actualEndAt}
          />
        ),
    },
    {
      field: "studentName",
      headerName: labels.filters.student,
      flex: 1.25,
      minWidth: 150,
      renderCell: ({ row }) => <PersonNameCell value={row.studentName} />,
    },
    {
      field: "subjectName",
      headerName: payrollLabels.column.subject,
      flex: 1,
      minWidth: 104,
      sortable: false,
      renderCell: ({ row }) => <PersonNameCell value={row.subjectName} />,
    },
    buildTimeCellColumn("open", labels.column.openSessionTime, labels, locale),
    buildTimeCellColumn("end", labels.column.endSessionTime, labels, locale),
    {
      field: "durationMinutes",
      headerName: labels.column.durationAssumed,
      width: 100,
      align: "right",
      headerAlign: "right",
      valueFormatter: value => formatDurationMinutes(typeof value === "number" ? value : null, labels.cell),
    },
    {
      field: "calculatedDuration",
      headerName: labels.column.calculatedDuration,
      width: 104,
      align: "right",
      headerAlign: "right",
      // renderCell rather than valueFormatter: the grid skips the value
      // formatter for nullish values, which would leave an empty cell here
      // instead of the "not calculated" dash.
      renderCell: ({ row }) => <Box component="span">{formatDurationMinutes(row.calculatedDuration, labels.cell)}</Box>,
    },
    {
      field: "teacherPaidAmount",
      headerName: labels.column.paidAmount,
      // The localized header wraps onto two lines; the fixed width must keep
      // the longer word entire even while a sort direction icon holds room in
      // the header, otherwise the truncated ellipsis reads as clipped copy.
      width: 108,
      minWidth: 108,
      align: "right",
      headerAlign: "right",
      renderCell: ({ row }) => (
        <Box component="span" dir="ltr" sx={{ fontWeight: 600, unicodeBidi: "isolate" }}>
          {formatPaidAmount(row.teacherPaidAmount, row.teacherPaidCurrency, locale, labels.cell)}
        </Box>
      ),
    },
    {
      field: "calculationStatus",
      headerName: labels.column.calculationStatus,
      width: 124,
      renderCell: ({ row }) => (
        <CalculationStatusCell
          status={row.calculationStatus}
          paymentDateIso={row.teacherDuePaymentDate}
          locale={locale}
          cellLabels={labels.cell}
          statusLabels={calculationStatusLabels}
        />
      ),
    },
    {
      field: "isPartialPercentage",
      headerName: payrollLabels.column.partialPercentage,
      width: 96,
      align: "right",
      headerAlign: "right",
      sortable: false,
      valueFormatter: value => formatPartialPercentage(typeof value === "number" ? value : null, locale, labels.cell),
    },
    {
      field: "carryoverLink",
      headerName: labels.carryover.linkedColumn,
      width: 96,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: ({ row }) => (
        <CarryoverLinkCell
          carryoverBalanceId={row.carryoverBalanceId}
          chipLabel={labels.carryover.linkedChip}
          emptyText={labels.cell.notCalculated}
          onOpen={onOpenCarryover}
        />
      ),
    },
    {
      field: "payrollNote",
      headerName: labels.column.note,
      flex: 1,
      minWidth: 72,
      sortable: false,
      renderCell: ({ row }) => <PayrollNotePopover note={row.payrollNote} labels={labels.cell} />,
    },
  ];
  if (canManageReports) {
    columns.push({
      field: "actions",
      headerName: payrollLabels.column.actions,
      // The single-word localized header must fit whole; the cell body is a
      // single icon, so the wider header-driven floor keeps the column compact.
      width: 92,
      minWidth: 92,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: ({ row }) =>
        row.instanceId === null ? null : (
          <Tooltip title={labels.action.openAuditPage}>
            <IconButton size="small" aria-label={labels.action.openAuditPage} onClick={() => onOpenAuditOverride(row)}>
              <OpenInNewOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
    });
  }
  return columns;
}

/** Builds the zero-row slot component with the empty-state copy and handlers bound. */
function createSessionAuditNoRowsOverlay(
  labels: SessionAuditLabels["emptyState"],
  hasActiveFilters: boolean,
  onClearFilters: () => void
): React.ComponentType {
  return function SessionAuditNoRowsOverlay() {
    return (
      <SessionAuditEmptyState labels={labels} hasActiveFilters={hasActiveFilters} onClearFilters={onClearFilters} />
    );
  };
}

/** View-model slice the session audit grid renders from. */
export type SessionAuditDataGridProps = Pick<
  SessionAuditReportsViewModel,
  | "labels"
  | "rows"
  | "totalCount"
  | "aggregates"
  | "isLoading"
  | "error"
  | "refetch"
  | "sortField"
  | "sortDirection"
  | "setSort"
  | "page"
  | "pageSize"
  | "setPage"
  | "setPageSize"
  | "canManageReports"
  | "hasActiveFilters"
  | "clearFilters"
  | "selectedIds"
  | "toggleSelected"
  | "clearSelection"
  | "canManageCarryover"
>;

/**
 * Main session-audit grid: server-side sorting and pagination over the report
 * rows, drill-down navigation per row, permission-gated override deep link,
 * the carryover bulk-action toolbar with checkbox selection for carryover
 * managers, the linked-carryover chip column, and the aggregate footer card.
 * Interactive cells (note popover, actions, carryover chip, checkboxes) own
 * their clicks so they never trigger row navigation.
 */
export function SessionAuditDataGrid({
  labels,
  rows,
  totalCount,
  aggregates,
  isLoading,
  error,
  refetch,
  sortField,
  sortDirection,
  setSort,
  page,
  pageSize,
  setPage,
  setPageSize,
  canManageReports,
  hasActiveFilters,
  clearFilters,
  selectedIds,
  toggleSelected,
  clearSelection,
  canManageCarryover,
}: Readonly<SessionAuditDataGridProps>) {
  const locale = useAppLocale();
  const payrollLabels = useAppTranslation(DashboardBillingPayroll);
  const calculationStatusLabels: Record<CalculationStatus, string> = payrollLabels.status;
  const router = useRouter();
  const [carryoverDialogOpen, setCarryoverDialogOpen] = useState(false);

  const navigateToAudit = useCallback(
    (instanceId: string | null) => {
      if (instanceId === null) return;
      router.push(auditHref(instanceId));
    },
    [router]
  );

  const openAuditOverride = useCallback(
    (row: SessionAuditReportRow) => {
      if (row.instanceId === null) return;
      router.push(auditOverrideHref(row.instanceId));
    },
    [router]
  );

  const openCarryover = useCallback(
    (carryoverBalanceId: string) => {
      router.push(carryoverHref(carryoverBalanceId));
    },
    [router]
  );

  const columns = useMemo<GridColDef<SessionAuditReportRow>[]>(
    () =>
      buildSessionAuditColumns({
        labels,
        payrollLabels,
        calculationStatusLabels,
        locale,
        canManageReports,
        onOpenAuditOverride: openAuditOverride,
        onOpenCarryover: openCarryover,
      }),
    [labels, payrollLabels, calculationStatusLabels, locale, canManageReports, openAuditOverride, openCarryover]
  );

  const selection = usePageLocalRowSelection({
    selectedIds,
    toggleSelected,
    clearSelection,
    onPageChange: setPage,
    onPageSizeChange: setPageSize,
  });

  /** Selection rows resolved against the visible page; the bulk action always acts on these rows. */
  const selectedRows = useMemo(() => {
    const idSet = new Set(selectedIds);
    return rows.filter(row => idSet.has(row.instanceId ?? row.id ?? ""));
  }, [rows, selectedIds]);

  const sortModel = useMemo<GridSortModel>(
    () => [{ field: sortField, sort: SORT_DIRECTION_TO_GRID_SORT[sortDirection] }],
    [sortField, sortDirection]
  );

  const handleSortModelChange = useCallback(
    (model: GridSortModel) => {
      // A cleared model (third header click) falls back to the default server sort.
      if (model.length === 0) {
        setSort(SessionAuditReportSortField.ScheduledStartAt, OrderSortDirection.Desc);
        return;
      }
      const entry = model[0];
      if (!(entry.field in GRID_FIELD_TO_SORT_FIELD)) return;
      const field = GRID_FIELD_TO_SORT_FIELD[entry.field];
      setSort(field, entry.sort === "desc" ? OrderSortDirection.Desc : OrderSortDirection.Asc);
    },
    [setSort]
  );

  const handleCellClick = useCallback(
    (params: GridCellParams<SessionAuditReportRow>) => {
      if (NON_NAVIGATING_FIELDS.has(params.field)) return;
      navigateToAudit(params.row.instanceId);
    },
    [navigateToAudit]
  );

  const handleCellKeyDown = useCallback(
    (params: GridCellParams<SessionAuditReportRow>, event: MuiEvent<React.KeyboardEvent>) => {
      if (event.key !== "Enter") return;
      if (NON_NAVIGATING_FIELDS.has(params.field)) return;
      navigateToAudit(params.row.instanceId);
    },
    [navigateToAudit]
  );

  // The no-rows slot replaces the grid body for the zero-row state so the
  // column headers and the pager stay mounted around the empty-state panel.
  // Mirroring the dataGrid layer's createNoRowsOverlay, the slot component is
  // built by a module-scope factory: oxlint forbids defining components
  // inline inside a render function.
  const noRowsOverlay = useMemo(
    () => createSessionAuditNoRowsOverlay(labels.emptyState, hasActiveFilters, clearFilters),
    [labels, hasActiveFilters, clearFilters]
  );

  return (
    <Stack sx={{ gap: 1.5, width: "100%" }}>
      {canManageCarryover ? (
        <Stack direction="row" sx={{ gap: 1, justifyContent: "flex-end" }}>
          <Button
            id="session-audit-bulk-carryover"
            size="small"
            variant="outlined"
            startIcon={<AccountBalanceWalletOutlined />}
            disabled={selectedRows.length === 0}
            onClick={() => setCarryoverDialogOpen(true)}
          >
            {labels.carryover.bulkAction}
          </Button>
        </Stack>
      ) : null}
      {error !== null ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <Box sx={{ position: "relative" }}>
          <AppDataGrid<SessionAuditReportRow>
            rows={rows}
            columns={columns}
            loading={isLoading}
            getRowId={row => row.instanceId ?? row.id ?? ""}
            ariaLabel={labels.title}
            slots={{ noRowsOverlay }}
            disableColumnMenu
            sortingMode="server"
            sortingOrder={SESSION_AUDIT_SORTING_ORDER}
            sx={
              rows.length === 0
                ? [HEADER_WRAP_SX, CELL_PAD_SX, SCROLLBAR_CUE_SX, EMPTY_REPORT_SX]
                : [HEADER_WRAP_SX, CELL_PAD_SX, SCROLLBAR_CUE_SX]
            }
            sortModel={sortModel}
            onSortModelChange={handleSortModelChange}
            onCellClick={handleCellClick}
            onCellKeyDown={handleCellKeyDown}
            disableRowSelectionOnClick
            checkboxSelection={canManageCarryover}
            rowSelectionModel={selection.rowSelectionModel}
            onRowSelectionModelChange={selection.onSelectionChange}
            paginationOptions={buildServerPaginationOptions({
              page,
              pageSize,
              totalCount,
              onPageChange: canManageCarryover ? selection.onPageChange : setPage,
              onPageSizeChange: canManageCarryover ? selection.onPageSizeChange : setPageSize,
              pageSizeOptions: SESSION_AUDIT_PAGE_SIZE_OPTIONS,
            })}
          />
          <Box aria-hidden sx={MOBILE_EDGE_FADE_SX} />
        </Box>
      )}
      <SessionAuditAggregateCard
        totalPaidAmount={aggregates.totalPaidAmount}
        totalPaidCurrency={aggregates.totalPaidCurrency}
        rowCountByStatus={aggregates.rowCountByStatus}
        rowCountByPaid={aggregates.rowCountByPaid}
        labels={labels.aggregate}
        statusLabels={labels.status}
      />
      <CarryoverBulkCreateDialog
        open={carryoverDialogOpen}
        rows={selectedRows}
        labels={labels.carryover}
        onClose={() => setCarryoverDialogOpen(false)}
        onDone={clearSelection}
      />
    </Stack>
  );
}
