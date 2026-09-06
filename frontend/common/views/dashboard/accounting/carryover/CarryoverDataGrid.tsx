"use client";

import {
  AddOutlined,
  DeleteOutlined,
  EditOutlined,
  EventNoteOutlined,
  FileDownloadOutlined,
  MoreVertOutlined,
  ReceiptLongOutlined,
  UndoOutlined,
} from "@mui/icons-material";
import { Box, Button, IconButton, Menu, MenuItem, Stack, Tooltip, Typography } from "@mui/material";
import type { GridColDef, GridRowId, GridRowSelectionModel } from "@mui/x-data-grid";
import { useCallback, useMemo, useState } from "react";
import { ExportButton, SectionPanel } from "@/frontend/common/components/ui";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { PersonProfileLinkCell } from "@/frontend/common/components/ui/display/personProfileLink/PersonProfileLinkCell";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { ErrorState } from "@/frontend/common/components/ui/state";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import {
  dateCell,
  formatAccountingDate,
  formatAccountingMoney,
  numericCell,
  textCell,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import { DisabledTeacherChip } from "@/frontend/common/views/dashboard/accounting/carryover/DisabledTeacherChip";
import { PaidStatusChip } from "@/frontend/common/views/dashboard/accounting/carryover/PaidStatusChip";
import { useCarryoverExport } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverExport";
import type {
  CarryoverAggregates,
  CarryoverRow,
  CarryoverViewModel,
} from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingPayments } from "@/shared/locale/namespaces";
import type { CarryoverLabels } from "@/shared/locale/types/dashboard/accounting/carryover";

/** Container callbacks that open the lifted dialogs/drawer for a row or the selection. */
export interface CarryoverDialogCallbacks {
  /** Opens the form dialog in add mode (`null` row) or edit mode (row snapshot). */
  readonly onOpenForm: (row: CarryoverRow | null) => void;
  /** Opens the bulk-to-expense dialog for the current selection. */
  readonly onOpenBulkToExpense: () => void;
  /** Opens the delete confirmation for the given rows (single row or the selection). */
  readonly onOpenDelete: (rows: readonly CarryoverRow[]) => void;
  /** Opens the unpay confirmation; only offered for paid rows. */
  readonly onOpenUnpay: (row: CarryoverRow) => void;
  /** Opens the detail drawer with the linked sessions for the row. */
  readonly onOpenDrawer: (row: CarryoverRow) => void;
}

/** View-model slice the carryover grid renders from, plus the dialog opener callbacks. */
export type CarryoverDataGridProps = Pick<
  CarryoverViewModel,
  | "labels"
  | "rows"
  | "totalCount"
  | "aggregates"
  | "isLoading"
  | "error"
  | "refetch"
  | "page"
  | "pageSize"
  | "onPageChange"
  | "onPageSizeChange"
  | "pageSizeOptions"
  | "selectedIds"
  | "toggleSelected"
  | "clearSelection"
  | "canManageCarryover"
  | "handleExportCsv"
> &
  CarryoverDialogCallbacks;

interface CarryoverRowActionsMenuProps {
  readonly row: CarryoverRow;
  readonly labels: CarryoverLabels;
  readonly actionsColumnLabel: string;
  /** Manager-only items (Edit / Unpay / Delete) are hidden when false; View Sessions stays. */
  readonly canManageCarryover: boolean;
  readonly onOpenForm: (row: CarryoverRow) => void;
  readonly onOpenDelete: (rows: readonly CarryoverRow[]) => void;
  readonly onOpenUnpay: (row: CarryoverRow) => void;
  readonly onOpenDrawer: (row: CarryoverRow) => void;
}

/**
 * Per-row "more" menu: View Sessions is a read affordance available to every
 * viewer; Edit / Unpay / Delete are manager-only (Unpay only while the row is
 * settled, Delete disabled for settled rows — paid carryovers must be unpaid
 * before they can be removed). Owns purely local anchor state.
 */
function CarryoverRowActionsMenu({
  row,
  labels,
  actionsColumnLabel,
  canManageCarryover,
  onOpenForm,
  onOpenDelete,
  onOpenUnpay,
  onOpenDrawer,
}: Readonly<CarryoverRowActionsMenuProps>) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = anchorEl !== null;
  const rowId = row.id ?? "";
  const closeMenu = () => setAnchorEl(null);

  const runAction = (action: () => void) => {
    closeMenu();
    action();
  };

  return (
    <>
      <IconButton
        id={`carryover-row-actions-${rowId}`}
        size="small"
        onClick={event => setAnchorEl(event.currentTarget)}
        aria-label={actionsColumnLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `carryover-row-menu-${rowId}` : undefined}
      >
        <MoreVertOutlined fontSize="small" />
      </IconButton>
      <Menu id={`carryover-row-menu-${rowId}`} anchorEl={anchorEl} open={open} onClose={closeMenu}>
        {canManageCarryover ? (
          <MenuItem onClick={() => runAction(() => onOpenForm(row))}>
            <EditOutlined fontSize="small" sx={{ marginInlineEnd: 1 }} />
            {labels.action.edit}
          </MenuItem>
        ) : null}
        <MenuItem onClick={() => runAction(() => onOpenDrawer(row))}>
          <EventNoteOutlined fontSize="small" sx={{ marginInlineEnd: 1 }} />
          {labels.action.viewSessions}
        </MenuItem>
        {canManageCarryover && row.isPaid === true ? (
          <MenuItem onClick={() => runAction(() => onOpenUnpay(row))}>
            <UndoOutlined fontSize="small" sx={{ marginInlineEnd: 1 }} />
            {labels.action.unpay}
          </MenuItem>
        ) : null}
        {canManageCarryover ? (
          <MenuItem
            onClick={() => runAction(() => onOpenDelete([row]))}
            disabled={row.isPaid === true}
            sx={theme => ({ color: row.isPaid === true ? theme.palette.text.disabled : theme.palette.error.main })}
          >
            <DeleteOutlined fontSize="small" sx={{ marginInlineEnd: 1 }} />
            {labels.action.delete}
          </MenuItem>
        ) : null}
      </Menu>
    </>
  );
}

/** Teacher identity cell: profile-linked name with the disabled-teacher chip alongside. */
function CarryoverTeacherCell({ row }: Readonly<{ row: CarryoverRow }>) {
  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 1, minWidth: 0 }}>
      <PersonProfileLinkCell
        href={profileHrefForTeacher({ teacherId: row.teacherId })}
        name={row.teacherName ?? row.teacherId ?? ""}
        avatarUrl={row.teacherAvatarUrl}
      />
      {row.isDisabledTeacher === true ? <DisabledTeacherChip /> : null}
    </Stack>
  );
}

/** One-line students-text excerpt; the full list stays readable on hover. */
function CarryoverStudentsTextCell({ value }: Readonly<{ value: string | null }>) {
  if (value === null || value.trim() === "") {
    return (
      <Box component="span" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        —
      </Box>
    );
  }
  return (
    <Tooltip title={value}>
      <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {value}
      </Box>
    </Tooltip>
  );
}

/** Money cell: grouped amount with the teacher currency beside it, both theme-toned. */
function CarryoverMoneyCell({ amount, currency }: Readonly<{ amount: string | null; currency: string | null }>) {
  return (
    <Stack direction="row" sx={{ alignItems: "baseline", gap: 0.5 }}>
      <Box component="span" sx={{ fontWeight: 600 }}>
        {formatAccountingMoney(amount)}
      </Box>
      {currency !== null ? (
        <Box component="span" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {currency}
        </Box>
      ) : null}
    </Stack>
  );
}

/** Inclusive period the carryover covers, rendered as a from/to two-line stack. */
function CarryoverPeriodCell({ row, locale }: Readonly<{ row: CarryoverRow; locale: string }>) {
  return (
    <Stack sx={{ gap: 0.25 }}>
      <Box component="span">{formatAccountingDate(row.fromDate, locale)}</Box>
      <Box component="span" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {formatAccountingDate(row.toDate, locale)}
      </Box>
    </Stack>
  );
}

/** Paid state: the paid/unpaid chip with the settled amount beneath it when paid. */
function CarryoverPaidCell({ row }: Readonly<{ row: CarryoverRow }>) {
  const paid = row.isPaid === true;
  return (
    <Stack sx={{ gap: 0.5, alignItems: "flex-start" }}>
      <PaidStatusChip paid={paid} />
      {paid && row.paid !== null ? (
        <Box component="span" sx={theme => ({ color: theme.palette.status.onActiveContainer })}>
          {formatAccountingMoney(row.paid)} {row.teacherCurrency ?? ""}
        </Box>
      ) : null}
    </Stack>
  );
}

interface CarryoverColumnArgs extends CarryoverDialogCallbacks {
  readonly labels: CarryoverLabels;
  readonly actionsColumnLabel: string;
  readonly createdAtColumnLabel: string;
  readonly locale: string;
  readonly canManageCarryover: boolean;
}

function buildCarryoverColumns(args: CarryoverColumnArgs): GridColDef<CarryoverRow>[] {
  const { labels, locale, canManageCarryover } = args;
  const columns: GridColDef<CarryoverRow>[] = [
    {
      field: "teacherName",
      headerName: labels.column.teacher,
      flex: 1,
      minWidth: 180,
      renderCell: ({ row }) => <CarryoverTeacherCell row={row} />,
    },
    {
      field: "studentsCount",
      headerName: labels.column.studentsCount,
      width: 110,
      align: "right",
      headerAlign: "right",
      valueFormatter: value => (value === null ? "—" : String(numericCell(value))),
    },
    {
      field: "studentsText",
      headerName: labels.column.studentsText,
      flex: 1,
      minWidth: 160,
      sortable: false,
      renderCell: ({ row }) => <CarryoverStudentsTextCell value={row.studentsText} />,
    },
    {
      field: "totalDuration",
      headerName: labels.column.totalDuration,
      width: 120,
      align: "right",
      headerAlign: "right",
      valueFormatter: value => textCell(value),
    },
    {
      field: "payable",
      headerName: labels.column.payable,
      width: 150,
      align: "right",
      headerAlign: "right",
      renderCell: ({ row }) => <CarryoverMoneyCell amount={row.payable} currency={row.teacherCurrency} />,
    },
    {
      field: "paid",
      headerName: labels.column.paid,
      width: 150,
      renderCell: ({ row }) => <CarryoverPaidCell row={row} />,
    },
    {
      field: "paymentDate",
      headerName: labels.column.paymentDate,
      width: 140,
      valueFormatter: value => formatAccountingDate(dateCell(value), locale),
    },
    {
      field: "fromDate",
      headerName: `${labels.column.fromDate} – ${labels.column.toDate}`,
      width: 130,
      sortable: false,
      renderCell: ({ row }) => <CarryoverPeriodCell row={row} locale={locale} />,
    },
    {
      field: "createdAt",
      headerName: args.createdAtColumnLabel,
      width: 120,
      valueFormatter: value => formatAccountingDate(dateCell(value), locale),
    },
  ];
  columns.push({
    field: "actions",
    headerName: args.actionsColumnLabel,
    width: 90,
    sortable: false,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }) => (
      <CarryoverRowActionsMenu
        row={row}
        labels={labels}
        actionsColumnLabel={args.actionsColumnLabel}
        canManageCarryover={canManageCarryover}
        onOpenForm={args.onOpenForm}
        onOpenDelete={args.onOpenDelete}
        onOpenUnpay={args.onOpenUnpay}
        onOpenDrawer={args.onOpenDrawer}
      />
    ),
  });
  return columns;
}

interface CarryoverToolbarProps {
  readonly labels: CarryoverLabels;
  readonly exporting: boolean;
  /** Visible rows that are part of the current bulk selection. */
  readonly selectedRows: readonly CarryoverRow[];
  /** True when every selected row is unpaid (bulk-to-expense precondition). */
  readonly selectionAllUnpaid: boolean;
  /** False hides the manager-only bulk actions and the Add New entry point. */
  readonly canManageCarryover: boolean;
  readonly onOpenForm: (row: CarryoverRow | null) => void;
  readonly onOpenBulkToExpense: () => void;
  readonly onOpenDelete: (rows: readonly CarryoverRow[]) => void;
  readonly onExportCsv: () => void;
}

/**
 * List toolbar: CSV export for every viewer (read-level operation) and, for
 * managers, the bulk actions on the store-driven selection plus the Add New
 * entry point. `marginInlineStart: "auto"` keeps the trailing edge RTL-correct.
 */
function CarryoverToolbar({
  labels,
  exporting,
  selectedRows,
  selectionAllUnpaid,
  canManageCarryover,
  onOpenForm,
  onOpenBulkToExpense,
  onOpenDelete,
  onExportCsv,
}: Readonly<CarryoverToolbarProps>) {
  const hasSelection = selectedRows.length > 0;
  return (
    <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
      {canManageCarryover ? (
        <>
          <Button
            id="carryover-bulk-to-expense"
            size="small"
            variant="outlined"
            startIcon={<ReceiptLongOutlined />}
            disabled={!hasSelection || !selectionAllUnpaid}
            onClick={onOpenBulkToExpense}
          >
            {labels.action.bulkToExpense}
          </Button>
          <Button
            id="carryover-bulk-delete"
            size="small"
            variant="outlined"
            startIcon={<DeleteOutlined />}
            disabled={!hasSelection}
            onClick={() => onOpenDelete(selectedRows)}
            sx={theme => ({
              color: theme.palette.error.main,
              borderColor: theme.palette.error.main,
            })}
          >
            {labels.action.bulkDelete}
          </Button>
        </>
      ) : null}
      <Box sx={{ marginInlineStart: "auto", display: "flex", gap: 1 }}>
        <ExportButton
          id="carryover-export-csv"
          startIcon={<FileDownloadOutlined />}
          disabled={exporting}
          onClick={onExportCsv}
          size="small"
        >
          {labels.action.exportCsv}
        </ExportButton>
        {canManageCarryover ? (
          <Button
            id="carryover-add-new"
            size="small"
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={() => onOpenForm(null)}
          >
            {labels.action.addNew}
          </Button>
        ) : null}
      </Box>
    </Stack>
  );
}

/** Picks the visible rows whose ids sit in the store-backed bulk selection. */
function selectedVisibleRows(rows: readonly CarryoverRow[], selectedIds: readonly string[]): CarryoverRow[] {
  const idSet = new Set(selectedIds);
  return rows.filter(row => row.id !== null && idSet.has(row.id));
}

/** True when every selected row is unpaid, so the selection can convert to expenses. */
function selectionIsAllUnpaid(selectedRows: readonly CarryoverRow[]): boolean {
  return selectedRows.every(row => row.isPaid !== true);
}

interface AggregateAmountProps {
  readonly label: string;
  readonly amount: string | null;
  readonly currency: string | null;
}

/** One footer money figure: small caps label over the amount and dominant currency. */
function AggregateAmount({ label, amount, currency }: Readonly<AggregateAmountProps>) {
  return (
    <Stack sx={{ gap: 0.5 }}>
      <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {label}
      </Typography>
      <Stack direction="row" sx={{ alignItems: "baseline", gap: 1 }}>
        <Typography variant="titleLg">{formatAccountingMoney(amount)}</Typography>
        {currency !== null ? (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {currency}
          </Typography>
        ) : null}
      </Stack>
    </Stack>
  );
}

interface CarryoverAggregateFooterProps {
  readonly aggregates: CarryoverAggregates;
  readonly labels: CarryoverLabels;
}

/**
 * Footer card under the grid summarizing the whole filtered set (all pages):
 * total payable, total paid, and the paid vs unpaid row tallies.
 */
function CarryoverAggregateFooter({ aggregates, labels }: Readonly<CarryoverAggregateFooterProps>) {
  return (
    <SectionPanel>
      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{ flexWrap: "wrap", gap: 3, alignItems: { xs: "flex-start", md: "center" } }}
      >
        <AggregateAmount
          label={labels.aggregate.totalPayable}
          amount={aggregates.totalPayable}
          currency={aggregates.dominantCurrency}
        />
        <AggregateAmount
          label={labels.aggregate.totalPaid}
          amount={aggregates.totalPaid}
          currency={aggregates.dominantCurrency}
        />
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2, alignItems: "center" }}>
          <Stack direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
            <PaidStatusChip paid />
            <Typography variant="bodyMd">{labels.aggregate.paidCount(aggregates.rowCountByPaid.paid)}</Typography>
          </Stack>
          <Stack direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
            <PaidStatusChip paid={false} />
            <Typography variant="bodyMd">{labels.aggregate.unpaidCount(aggregates.rowCountByPaid.unpaid)}</Typography>
          </Stack>
        </Stack>
      </Stack>
    </SectionPanel>
  );
}

/** Memoized column set for the carryover grid, rebuilt only when an input changes. */
function useCarryoverColumns(args: CarryoverColumnArgs): GridColDef<CarryoverRow>[] {
  const { labels, actionsColumnLabel, createdAtColumnLabel, locale, canManageCarryover } = args;
  const { onOpenForm, onOpenBulkToExpense, onOpenDelete, onOpenUnpay, onOpenDrawer } = args;
  return useMemo<GridColDef<CarryoverRow>[]>(
    () =>
      buildCarryoverColumns({
        labels,
        actionsColumnLabel,
        createdAtColumnLabel,
        locale,
        canManageCarryover,
        onOpenForm,
        onOpenBulkToExpense,
        onOpenDelete,
        onOpenUnpay,
        onOpenDrawer,
      }),
    [
      labels,
      actionsColumnLabel,
      createdAtColumnLabel,
      locale,
      canManageCarryover,
      onOpenForm,
      onOpenBulkToExpense,
      onOpenDelete,
      onOpenUnpay,
      onOpenDrawer,
    ]
  );
}

interface CarryoverRowSelectionArgs {
  readonly selectedIds: readonly string[];
  readonly toggleSelected: (id: string) => void;
  readonly clearSelection: () => void;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
}

interface CarryoverRowSelection {
  readonly rowSelectionModel: GridRowSelectionModel;
  readonly onSelectionChange: (model: GridRowSelectionModel) => void;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
}

/** Store-backed checkbox model plus page-turn handlers; changing pages clears the page-local selection. */
function useCarryoverRowSelection(args: CarryoverRowSelectionArgs): CarryoverRowSelection {
  const { selectedIds, toggleSelected, clearSelection, onPageChange, onPageSizeChange } = args;
  const rowSelectionModel = useMemo<GridRowSelectionModel>(
    () => ({ type: "include", ids: new Set<GridRowId>(selectedIds) }),
    [selectedIds]
  );

  /** Checkbox diffs map onto the store's toggle: each added/removed id flips once. */
  const onSelectionChange = useCallback(
    (model: GridRowSelectionModel) => {
      const nextIds = new Set(Array.from(model.ids, String));
      for (const id of selectedIds) {
        if (!nextIds.has(id)) toggleSelected(id);
      }
      for (const id of nextIds) {
        if (!selectedIds.includes(id)) toggleSelected(id);
      }
    },
    [selectedIds, toggleSelected]
  );

  /** Bulk selection is scoped to the visible page, so a page turn drops it. */
  const handlePageChange = useCallback(
    (nextPage: number) => {
      if (selectedIds.length > 0) clearSelection();
      onPageChange(nextPage);
    },
    [clearSelection, onPageChange, selectedIds.length]
  );
  const handlePageSizeChange = useCallback(
    (nextPageSize: number) => {
      if (selectedIds.length > 0) clearSelection();
      onPageSizeChange(nextPageSize);
    },
    [clearSelection, onPageSizeChange, selectedIds.length]
  );

  return {
    rowSelectionModel,
    onSelectionChange,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
  };
}

/**
 * Carryover balance list grid: teacher/students/duration/money columns, paid and
 * disabled-teacher chips, per-row action menu (View Sessions for viewers, the
 * write actions for managers only), a toolbar whose Export CSV is available to
 * every viewer while bulk actions and Add New stay manager-gated, store-backed
 * checkbox selection, and the aggregate footer. Selection clears on page turns
 * so the bulk actions always act on rows the operator can see.
 */
export function CarryoverDataGrid({
  labels,
  rows,
  totalCount,
  aggregates,
  isLoading,
  error,
  refetch,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
  selectedIds,
  toggleSelected,
  clearSelection,
  canManageCarryover,
  handleExportCsv,
  onOpenForm,
  onOpenBulkToExpense,
  onOpenDelete,
  onOpenUnpay,
  onOpenDrawer,
}: Readonly<CarryoverDataGridProps>) {
  const locale = useAppLocale();
  const paymentsLabels = useAppTranslation(DashboardAccountingPayments);
  const { exporting, runExport } = useCarryoverExport(handleExportCsv, labels);

  const columns = useCarryoverColumns({
    labels,
    actionsColumnLabel: paymentsLabels.columns.actions,
    createdAtColumnLabel: paymentsLabels.columns.createdAt,
    locale,
    canManageCarryover,
    onOpenForm,
    onOpenBulkToExpense,
    onOpenDelete,
    onOpenUnpay,
    onOpenDrawer,
  });
  const selection = useCarryoverRowSelection({
    selectedIds,
    toggleSelected,
    clearSelection,
    onPageChange,
    onPageSizeChange,
  });

  const selectedRows = useMemo(() => selectedVisibleRows(rows, selectedIds), [rows, selectedIds]);
  const allUnpaidSelected = selectionIsAllUnpaid(selectedRows);

  return (
    <Stack sx={{ gap: 1.5, width: "100%" }}>
      <CarryoverToolbar
        labels={labels}
        exporting={exporting}
        selectedRows={selectedRows}
        selectionAllUnpaid={allUnpaidSelected}
        canManageCarryover={canManageCarryover}
        onOpenForm={onOpenForm}
        onOpenBulkToExpense={onOpenBulkToExpense}
        onOpenDelete={onOpenDelete}
        onExportCsv={runExport}
      />
      {error !== null ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <AppDataGrid<CarryoverRow>
          rows={rows}
          columns={columns}
          loading={isLoading}
          getRowId={row => row.id ?? ""}
          emptyMessage={labels.empty}
          ariaLabel={labels.title}
          disableColumnMenu
          disableRowSelectionOnClick
          checkboxSelection={canManageCarryover}
          rowSelectionModel={selection.rowSelectionModel}
          onRowSelectionModelChange={selection.onSelectionChange}
          paginationOptions={buildServerPaginationOptions({
            page,
            pageSize,
            totalCount,
            onPageChange: selection.onPageChange,
            onPageSizeChange: selection.onPageSizeChange,
            pageSizeOptions,
          })}
        />
      )}
      <CarryoverAggregateFooter aggregates={aggregates} labels={labels} />
    </Stack>
  );
}
