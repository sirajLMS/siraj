"use client";

import { CheckCircleOutlined, OpenInNewOutlined } from "@mui/icons-material";
import { Box, Button, IconButton, Stack, Tooltip } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { GridCellParams, GridColDef, GridSortModel, MuiEvent } from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { formatDateTime, parseDateInput } from "@/frontend/common/components/intl/dateFormat";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { ErrorState } from "@/frontend/common/components/ui/state";
import {
  CalculationStatus,
  OrderSortDirection,
  SessionAuditReportSortField,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { CalculationStatusChip } from "@/frontend/common/views/dashboard/accounting/payroll/CalculationStatusChip";
import {
  formatDurationMinutes,
  formatPaidAmount,
  formatPartialPercentage,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/formatters/sessionAuditCellFormatters";
import { PayrollNotePopover } from "@/frontend/common/views/dashboard/billing/accounting/reports/PayrollNotePopover";
import { SessionAuditAggregateCard } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditAggregateCard";
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
 * Timestamp cells render day, short month, and time — the year is omitted so
 * the three date-time columns stay narrow enough to fit beside the name and
 * status columns; the complete timestamp remains available in cell tooltips.
 */
const COMPACT_SESSION_TIME_FORMAT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
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
    return new Intl.DateTimeFormat(getLatnLocaleTag(locale), COMPACT_SESSION_TIME_FORMAT).format(parsed);
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

/** Ellipsized single-line text content for compact cell values (datetimes). */
const ELLIPSIZED_CELL_SX = {
  display: "block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

/**
 * Cells whose own interactive content must not trigger row navigation:
 * the note popover button and the row-action button own their clicks and
 * keystrokes.
 */
const NON_NAVIGATING_FIELDS: ReadonlySet<string> = new Set(["payrollNote", "actions"]);

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

function auditHref(instanceId: string): string {
  return `/classes/${instanceId}/audit`;
}

function auditOverrideHref(instanceId: string): string {
  return `/classes/${instanceId}/audit?openOverride=1`;
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
 * Plan-3 payroll status cell: grey dash while uncalculated, the status chip
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
  const chip = <CalculationStatusChip status={status} labels={statusLabels} />;
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

interface SessionAuditColumnArgs {
  readonly labels: SessionAuditLabels;
  readonly payrollLabels: PayrollLabels;
  readonly calculationStatusLabels: Record<CalculationStatus, string>;
  readonly locale: string;
  readonly canManageReports: boolean;
  readonly onOpenAuditOverride: (row: SessionAuditReportRow) => void;
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
    width: 104,
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
}: SessionAuditColumnArgs): GridColDef<SessionAuditReportRow>[] {
  const columns: GridColDef<SessionAuditReportRow>[] = [
    {
      field: "scheduledStartAt",
      headerName: labels.column.scheduledStart,
      width: 108,
      renderCell: ({ value }) => (
        <ScheduledStartCell value={value} locale={locale} fallback={labels.cell.notCalculated} />
      ),
    },
    {
      field: "teacherName",
      headerName: labels.filters.teacher,
      flex: 1.25,
      minWidth: 120,
      renderCell: ({ row }) => <PersonNameCell value={row.teacherName} />,
    },
    {
      field: "currentStatus",
      headerName: labels.filters.status,
      width: 128,
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
      minWidth: 120,
      renderCell: ({ row }) => <PersonNameCell value={row.studentName} />,
    },
    {
      field: "subjectName",
      headerName: payrollLabels.column.subject,
      flex: 1,
      minWidth: 100,
      sortable: false,
      renderCell: ({ row }) => <PersonNameCell value={row.subjectName} />,
    },
    buildTimeCellColumn("open", labels.column.openSessionTime, labels, locale),
    buildTimeCellColumn("end", labels.column.endSessionTime, labels, locale),
    {
      field: "durationMinutes",
      headerName: labels.column.durationAssumed,
      width: 92,
      align: "right",
      headerAlign: "right",
      valueFormatter: value => formatDurationMinutes(typeof value === "number" ? value : null, labels.cell),
    },
    {
      field: "calculatedDuration",
      headerName: labels.column.calculatedDuration,
      width: 96,
      align: "right",
      headerAlign: "right",
      valueFormatter: value => formatDurationMinutes(typeof value === "number" ? value : null, labels.cell),
    },
    {
      field: "teacherPaidAmount",
      headerName: labels.column.paidAmount,
      width: 96,
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
      width: 64,
      align: "right",
      headerAlign: "right",
      sortable: false,
      valueFormatter: value => formatPartialPercentage(typeof value === "number" ? value : null, locale, labels.cell),
    },
    {
      field: "payrollNote",
      headerName: labels.column.note,
      flex: 1,
      minWidth: 84,
      sortable: false,
      renderCell: ({ row }) => <PayrollNotePopover note={row.payrollNote} labels={labels.cell} />,
    },
  ];
  if (canManageReports) {
    columns.push({
      field: "actions",
      headerName: payrollLabels.column.actions,
      width: 80,
      align: "center",
      headerAlign: "center",
      sortable: false,
      // Single-word header is wider than the compact column: ellipsize it
      // rather than letting the grid clip the trailing glyphs.
      renderHeader: () => (
        <Box component="span" sx={ELLIPSIZED_CELL_SX}>
          {payrollLabels.column.actions}
        </Box>
      ),
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
>;

/**
 * Main session-audit grid: server-side sorting and pagination over the report
 * rows, drill-down navigation per row, permission-gated override deep link,
 * and the aggregate footer card. Interactive cells (note popover, actions) own
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
}: Readonly<SessionAuditDataGridProps>) {
  const locale = useAppLocale();
  const payrollLabels = useAppTranslation(DashboardBillingPayroll);
  const calculationStatusLabels: Record<CalculationStatus, string> = payrollLabels.status;
  const router = useRouter();

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

  const columns = useMemo<GridColDef<SessionAuditReportRow>[]>(
    () =>
      buildSessionAuditColumns({
        labels,
        payrollLabels,
        calculationStatusLabels,
        locale,
        canManageReports,
        onOpenAuditOverride: openAuditOverride,
      }),
    [labels, payrollLabels, calculationStatusLabels, locale, canManageReports, openAuditOverride]
  );

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

  const showClearFiltersAction = hasActiveFilters && !isLoading && error === null && rows.length === 0;

  return (
    <Stack sx={{ gap: 1.5, width: "100%" }}>
      {error !== null ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <AppDataGrid<SessionAuditReportRow>
          rows={rows}
          columns={columns}
          loading={isLoading}
          getRowId={row => row.instanceId ?? row.id ?? ""}
          emptyMessage={labels.emptyState.title}
          ariaLabel={labels.title}
          disableColumnMenu
          sortingMode="server"
          sx={[HEADER_WRAP_SX, SCROLLBAR_CUE_SX]}
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
          onCellClick={handleCellClick}
          onCellKeyDown={handleCellKeyDown}
          paginationOptions={buildServerPaginationOptions({
            page,
            pageSize,
            totalCount,
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
            pageSizeOptions: SESSION_AUDIT_PAGE_SIZE_OPTIONS,
          })}
        />
      )}
      {showClearFiltersAction ? (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Button size="small" variant="outlined" onClick={clearFilters}>
            {labels.emptyState.cta}
          </Button>
        </Box>
      ) : null}
      <SessionAuditAggregateCard
        totalPaidAmount={aggregates.totalPaidAmount}
        totalPaidCurrency={aggregates.totalPaidCurrency}
        rowCountByStatus={aggregates.rowCountByStatus}
        rowCountByPaid={aggregates.rowCountByPaid}
        labels={labels.aggregate}
        statusLabels={labels.status}
      />
    </Stack>
  );
}
