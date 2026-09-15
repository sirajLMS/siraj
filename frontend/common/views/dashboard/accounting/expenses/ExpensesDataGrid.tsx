"use client";

import {
  AddOutlined,
  DeleteOutlined,
  EditOutlined,
  FileDownloadOutlined,
  LinkOutlined,
  MoreVertOutlined,
  ReceiptLongOutlined,
} from "@mui/icons-material";
import { Box, Chip, IconButton, Menu, MenuItem, Stack, Tooltip, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useMemo, useState } from "react";
import {
  DangerActionButton,
  ExportButton,
  PrimaryPageAction,
  SectionPanel,
  StatusBadge,
} from "@/frontend/common/components/ui";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { usePageLocalRowSelection } from "@/frontend/common/components/ui/dataGrid/usePageLocalRowSelection";
import { PersonProfileLinkCell } from "@/frontend/common/components/ui/display/personProfileLink/PersonProfileLinkCell";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { ErrorState } from "@/frontend/common/components/ui/state";
import { ExpenseType } from "@/frontend/common/graphql/generated/gql/graphql";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import {
  dateCell,
  formatAccountingDate,
  formatAccountingMoney,
  formatAccountingMonth,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import type {
  ExpenseAggregates,
  ExpenseCsvExportOutcome,
  ExpenseRow,
  ExpensesViewModel,
} from "@/frontend/common/views/dashboard/accounting/expenses/useExpensesViewModel";
import { EXPENSE_SOURCE_CARRYOVER_BALANCES } from "@/shared/constants/expenses";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

/**
 * The MUI X grid hides its horizontal scrollbar on overlay-scrollbar
 * platforms (macOS, Gnome Web) until the user guesses at scrolling, so a
 * clipped trailing column reads as the end of the table. Painting a persistent
 * thin thumb/track on the grid's horizontal scrollbar element keeps off-frame
 * columns discoverable; the element only exists while columns overflow, so no
 * cue appears when everything fits.
 */
const EXPENSES_SCROLLBAR_CUE_SX = (theme: Theme) => ({
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
 * Zero-row geometry: the collapsed grid body would otherwise be shorter than
 * the empty-state panel, so the panel would overflow under the footer. A
 * min-height reserved while there are no rows gives the panel its room; once
 * rows exist, the grid stretches past it on its own.
 */
const EXPENSES_EMPTY_GRID_MIN_HEIGHT_SX = {
  minHeight: 400,
} as const;

/** Ellipsized single-line text content for truncated cell values. */
const ELLIPSIZED_TEXT_SX = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

/** Placeholder color for cells whose value is absent — always distinct from real values. */
const EXPENSES_EMPTY_VALUE_SX = (theme: Theme) => ({ color: theme.palette.text.disabled });

/** Container callbacks that open the lifted dialogs/drawer for a row or the selection. */
export interface ExpensesDialogCallbacks {
  /** Opens the form dialog in add mode (`null` row) or edit mode (row snapshot). */
  readonly onOpenForm: (row: ExpenseRow | null) => void;
  /** Opens the delete confirmation for the given rows (single row or the selection). */
  readonly onOpenDelete: (rows: readonly ExpenseRow[]) => void;
  /** Opens the linked carryover detail drawer for the row's provenance id. */
  readonly onViewSource: (sourceEntityId: string) => void;
}

/** View-model slice the expenses grid renders from, plus the dialog opener callbacks. */
export type ExpensesDataGridProps = Pick<
  ExpensesViewModel,
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
  | "canManageExpenses"
  | "handleExportCsv"
> &
  ExpensesDialogCallbacks;

/** Toast duration for the CSV export outcome notices. */
const EXPORT_TOAST_DURATION_MS = 5000;

interface ExpensesExport {
  /** True while a download request is in flight. */
  readonly exporting: boolean;
  /** Runs the export and surfaces its outcome as a toast. */
  readonly runExport: () => void;
}

/**
 * Drives one CSV export run with a busy lock and outcome toasts: failure when
 * the download itself failed, the truncation notice when the server capped the
 * export at its row ceiling, and silence for a clean download. The wrapped
 * handler never rejects, so no try/catch is needed here.
 */
function useExpensesExport(
  handleExportCsv: () => Promise<ExpenseCsvExportOutcome | null>,
  labels: ExpensesLabels
): ExpensesExport {
  const notifications = useNotifications();
  const [exporting, setExporting] = useState(false);

  const runExport = useCallback(() => {
    const run = async () => {
      setExporting(true);
      const outcome = await handleExportCsv();
      setExporting(false);
      if (outcome === null) {
        notifications.show(labels.exportFailed, {
          severity: "error",
          autoHideDuration: EXPORT_TOAST_DURATION_MS,
        });
        return;
      }
      if (outcome.truncated) {
        notifications.show(labels.exportTruncated, {
          severity: "warning",
          autoHideDuration: EXPORT_TOAST_DURATION_MS,
        });
      }
    };
    void run();
  }, [handleExportCsv, labels, notifications]);

  return { exporting, runExport };
}

/**
 * The server reports `rowCountByType` keyed by the backend enum's display
 * value ("Salaries"), while grid rows carry the GraphQL codegen enum
 * ("SALARIES") — the footer maps back through this table to reuse the same
 * type badges the grid column renders.
 */
const AGGREGATE_KEY_BY_TYPE: Record<ExpenseType, string> = {
  [ExpenseType.Salaries]: "Salaries",
  [ExpenseType.Marketing]: "Marketing",
  [ExpenseType.Logistics]: "Logistics",
  [ExpenseType.Technology]: "Technology",
};

/** Maps the codegen enum to the localized-label keys of the expenses namespace. */
const TYPE_LABEL_KEY_BY_TYPE: Record<ExpenseType, keyof ExpensesLabels["type"]> = {
  [ExpenseType.Salaries]: "Salaries",
  [ExpenseType.Marketing]: "Marketing",
  [ExpenseType.Logistics]: "Logistics",
  [ExpenseType.Technology]: "Technology",
};

/** Localized label for an expense type, so badge cells carry the full copy. */
function expenseTypeLabel(labels: ExpensesLabels, type: ExpenseType): string {
  return labels.type[TYPE_LABEL_KEY_BY_TYPE[type]];
}

const EXPENSE_TYPES: readonly ExpenseType[] = [
  ExpenseType.Salaries,
  ExpenseType.Marketing,
  ExpenseType.Logistics,
  ExpenseType.Technology,
];

/** Resolves a `rowCountByType` key to the codegen enum, or null when unknown. */
function expenseTypeFromAggregateKey(key: string): ExpenseType | null {
  for (const type of EXPENSE_TYPES) {
    if (AGGREGATE_KEY_BY_TYPE[type] === key) return type;
  }
  return null;
}

/**
 * Title cell: the expense name with a hover tooltip, ellipsized when narrow.
 * Soft-deleted rows (surfaced when the include-deleted filter is on) render
 * struck-through in the muted tone with a "Deleted" badge alongside.
 */
function ExpenseTitleCell({ row, labels }: Readonly<{ row: ExpenseRow; labels: ExpensesLabels }>) {
  const title = row.title ?? "";
  const deleted = row.deletedAt !== null;
  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 1, minWidth: 0, width: "100%" }}>
      <Tooltip title={title}>
        <Box
          component="span"
          sx={(theme: Theme) => ({
            ...ELLIPSIZED_TEXT_SX,
            ...(deleted ? { textDecoration: "line-through", color: theme.palette.text.disabled } : null),
          })}
        >
          {title}
        </Box>
      </Tooltip>
      {deleted ? (
        <Box sx={{ flexShrink: 0 }}>
          <StatusBadge category="session" status="cancelled" label={labels.deletedBadge} />
        </Box>
      ) : null}
    </Stack>
  );
}

/**
 * Teacher cell: profile-linked name for teacher-bound expenses, a muted dash
 * for manual rows without a teacher. The name is a creation-time snapshot, so
 * the row stays correct after a teacher rename or deactivation.
 */
function ExpenseTeacherCell({ row }: Readonly<{ row: ExpenseRow }>) {
  const name = row.teacherName ?? "";
  if (row.teacherId === null || name === "") {
    return (
      <Box component="span" sx={EXPENSES_EMPTY_VALUE_SX}>
        —
      </Box>
    );
  }
  return (
    <Tooltip title={name}>
      <Box
        sx={{
          minWidth: 0,
          width: "100%",
          "& .MuiStack-root": { minWidth: 0 },
          "& .MuiTypography-root": ELLIPSIZED_TEXT_SX,
        }}
      >
        <PersonProfileLinkCell href={profileHrefForTeacher({ teacherId: row.teacherId })} name={name} />
      </Box>
    </Tooltip>
  );
}

/** Money cell: grouped amount with the expense currency beside it, both theme-toned. */
function ExpenseMoneyCell({ amount, currency }: Readonly<{ amount: string | null; currency: string | null }>) {
  const isEmpty = amount === null;
  return (
    <Stack direction="row" sx={{ alignItems: "baseline", gap: 0.5 }}>
      <Box component="span" sx={isEmpty ? EXPENSES_EMPTY_VALUE_SX : { fontWeight: 600 }}>
        {formatAccountingMoney(amount)}
      </Box>
      {currency !== null ? (
        <Box component="span" sx={(theme: Theme) => ({ color: theme.palette.onSurfaceVariant })}>
          {currency}
        </Box>
      ) : null}
    </Stack>
  );
}

/**
 * Plain text cell where the absent-value placeholder renders muted so an
 * em-dash never reads as real data beside populated cells.
 */
function ExpenseValueCell({ text, empty }: Readonly<{ text: string; empty: boolean }>) {
  if (empty) {
    return (
      <Box component="span" sx={EXPENSES_EMPTY_VALUE_SX}>
        —
      </Box>
    );
  }
  return <Box component="span">{text}</Box>;
}

/** One-line note excerpt; the full note stays readable on hover. */
function ExpenseNoteCell({ value }: Readonly<{ value: string | null }>) {
  if (value === null || value.trim() === "") {
    return (
      <Box component="span" sx={EXPENSES_EMPTY_VALUE_SX}>
        —
      </Box>
    );
  }
  return (
    <Tooltip title={value}>
      <Box component="span" sx={ELLIPSIZED_TEXT_SX}>
        {value}
      </Box>
    </Tooltip>
  );
}

interface ExpenseRowActionsMenuProps {
  readonly row: ExpenseRow;
  readonly labels: ExpensesLabels;
  /** Manager-only items (Edit / Delete) are hidden when false; View Source stays. */
  readonly canManageExpenses: boolean;
  readonly onOpenForm: (row: ExpenseRow) => void;
  readonly onOpenDelete: (rows: readonly ExpenseRow[]) => void;
  readonly onViewSource: (sourceEntityId: string) => void;
}

/**
 * Per-row "more" menu: View Source is a read affordance available to every
 * viewer (enabled only when the row carries a linked source entity); Edit and
 * Delete are manager-only and disabled on soft-deleted rows, which must first
 * be handled through the delete/restore accounting flow. Owns purely local
 * anchor state.
 */
function ExpenseRowActionsMenu({
  row,
  labels,
  canManageExpenses,
  onOpenForm,
  onOpenDelete,
  onViewSource,
}: Readonly<ExpenseRowActionsMenuProps>) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = anchorEl !== null;
  const rowId = row.id ?? "";
  const deleted = row.deletedAt !== null;
  const closeMenu = () => setAnchorEl(null);

  const runAction = (action: () => void) => {
    closeMenu();
    action();
  };

  const openSource = () => {
    const sourceId = row.sourceEntityId;
    if (sourceId === null) return;
    runAction(() => onViewSource(sourceId));
  };

  return (
    <>
      <IconButton
        id={`expenses-row-actions-${rowId}`}
        size="small"
        onClick={event => setAnchorEl(event.currentTarget)}
        aria-label={labels.column.rowActions(row.title ?? "")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `expenses-row-menu-${rowId}` : undefined}
      >
        <MoreVertOutlined fontSize="small" />
      </IconButton>
      <Menu id={`expenses-row-menu-${rowId}`} anchorEl={anchorEl} open={open} onClose={closeMenu}>
        {canManageExpenses ? (
          <MenuItem onClick={() => runAction(() => onOpenForm(row))} disabled={deleted}>
            <EditOutlined fontSize="small" sx={{ marginInlineEnd: 1 }} />
            {labels.action.edit}
          </MenuItem>
        ) : null}
        {canManageExpenses ? (
          <MenuItem
            onClick={() => runAction(() => onOpenDelete([row]))}
            disabled={deleted}
            sx={(theme: Theme) => ({ color: theme.palette.error.main })}
          >
            <DeleteOutlined fontSize="small" sx={{ marginInlineEnd: 1 }} />
            {labels.action.delete}
          </MenuItem>
        ) : null}
        <MenuItem onClick={openSource} disabled={row.sourceEntityId === null}>
          <LinkOutlined fontSize="small" sx={{ marginInlineEnd: 1 }} />
          {labels.action.viewSource}
        </MenuItem>
      </Menu>
    </>
  );
}

/**
 * Provenance cell: a neutral "Manual" badge for hand-entered rows, a "From
 * Carryover" badge for settlement-produced rows, and nothing for a carryover
 * marker without a resolvable linked id (unreachable per the server
 * invariant). The deep link stays available through the row actions menu.
 */
function ExpenseSourceBadgeCell({
  sourceEntity,
  sourceEntityId,
  labels,
}: Readonly<{ sourceEntity: string | null; sourceEntityId: string | null; labels: ExpensesLabels }>) {
  if (sourceEntity === EXPENSE_SOURCE_CARRYOVER_BALANCES && sourceEntityId !== null) {
    return (
      <StatusBadge
        category="expenseSource"
        status="carryover"
        label={labels.source.FromCarryover}
        icon={<LinkOutlined fontSize="small" />}
      />
    );
  }
  if (sourceEntity !== null) return null;
  return <StatusBadge category="expenseSource" status="manual" label={labels.source.Manual} />;
}

interface ExpensesColumnArgs extends ExpensesDialogCallbacks {
  readonly labels: ExpensesLabels;
  readonly locale: string;
  readonly canManageExpenses: boolean;
}

function buildExpensesColumns(args: ExpensesColumnArgs): GridColDef<ExpenseRow>[] {
  const { labels, locale, canManageExpenses } = args;
  return [
    {
      field: "title",
      headerName: labels.column.title,
      flex: 1,
      minWidth: 180,
      renderCell: ({ row }) => <ExpenseTitleCell row={row} labels={labels} />,
    },
    {
      field: "type",
      headerName: labels.column.type,
      width: 130,
      renderCell: ({ row }) =>
        row.type === null ? (
          <ExpenseValueCell text="—" empty />
        ) : (
          <StatusBadge category="expenseType" status={row.type} label={expenseTypeLabel(labels, row.type)} />
        ),
    },
    {
      field: "teacherName",
      headerName: labels.column.teacher,
      flex: 1,
      minWidth: 150,
      sortable: false,
      renderCell: ({ row }) => <ExpenseTeacherCell row={row} />,
    },
    {
      field: "expenseValue",
      headerName: labels.column.value,
      width: 140,
      align: "right",
      headerAlign: "right",
      renderCell: ({ row }) => <ExpenseMoneyCell amount={row.expenseValue} currency={row.expenseCurrency} />,
    },
    {
      field: "paymentDate",
      headerName: labels.column.paymentDate,
      width: 130,
      renderCell: ({ value }) => (
        <ExpenseValueCell empty={dateCell(value) === null} text={formatAccountingDate(dateCell(value), locale)} />
      ),
    },
    {
      field: "expenseDate",
      headerName: labels.column.expenseDate,
      width: 110,
      renderCell: ({ value }) => (
        <ExpenseValueCell empty={dateCell(value) === null} text={formatAccountingMonth(dateCell(value), locale)} />
      ),
    },
    {
      field: "sourceEntity",
      headerName: labels.column.source,
      width: 150,
      sortable: false,
      renderCell: ({ row }) => (
        <ExpenseSourceBadgeCell sourceEntity={row.sourceEntity} sourceEntityId={row.sourceEntityId} labels={labels} />
      ),
    },
    {
      field: "note",
      headerName: labels.column.note,
      flex: 1,
      minWidth: 140,
      sortable: false,
      renderCell: ({ row }) => <ExpenseNoteCell value={row.note} />,
    },
    {
      field: "createdAt",
      headerName: labels.column.createdAt,
      width: 110,
      renderCell: ({ value }) => (
        <ExpenseValueCell empty={dateCell(value) === null} text={formatAccountingDate(dateCell(value), locale)} />
      ),
    },
    {
      field: "actions",
      headerName: labels.column.actions,
      width: 80,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }) => (
        <ExpenseRowActionsMenu
          row={row}
          labels={labels}
          canManageExpenses={canManageExpenses}
          onOpenForm={args.onOpenForm}
          onOpenDelete={args.onOpenDelete}
          onViewSource={args.onViewSource}
        />
      ),
    },
  ];
}

/** Memoized column set for the expenses grid, rebuilt only when an input changes. */
function useExpensesColumns(args: ExpensesColumnArgs): GridColDef<ExpenseRow>[] {
  const { labels, locale, canManageExpenses, onOpenForm, onOpenDelete, onViewSource } = args;
  return useMemo<GridColDef<ExpenseRow>[]>(
    () => buildExpensesColumns({ labels, locale, canManageExpenses, onOpenForm, onOpenDelete, onViewSource }),
    [labels, locale, canManageExpenses, onOpenForm, onOpenDelete, onViewSource]
  );
}

/** Picks the visible rows whose ids sit in the store-backed bulk selection. */
function selectedVisibleRows(rows: readonly ExpenseRow[], selectedIds: readonly string[]): ExpenseRow[] {
  const idSet = new Set(selectedIds);
  return rows.filter(row => row.id !== null && idSet.has(row.id));
}

interface ExpensesToolbarProps {
  readonly labels: ExpensesLabels;
  readonly exporting: boolean;
  /** Visible rows that are part of the current bulk selection. */
  readonly selectedRows: readonly ExpenseRow[];
  /** False hides the manager-only bulk action and the Add New entry point. */
  readonly canManageExpenses: boolean;
  readonly onOpenForm: (row: ExpenseRow | null) => void;
  readonly onOpenDelete: (rows: readonly ExpenseRow[]) => void;
  readonly onExportCsv: () => void;
}

/**
 * List toolbar: CSV export for every viewer (read-level operation) and, for
 * managers, the bulk delete on the store-driven selection plus the Add New
 * entry point. `marginInlineStart: "auto"` keeps the trailing edge RTL-correct.
 */
function ExpensesToolbar({
  labels,
  exporting,
  selectedRows,
  canManageExpenses,
  onOpenForm,
  onOpenDelete,
  onExportCsv,
}: Readonly<ExpensesToolbarProps>) {
  const hasSelection = selectedRows.length > 0;
  return (
    <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
      {canManageExpenses ? (
        <>
          <DangerActionButton
            id="expenses-bulk-delete"
            size="small"
            startIcon={<DeleteOutlined />}
            disabled={!hasSelection}
            onClick={() => onOpenDelete(selectedRows)}
          >
            {labels.action.bulkDelete}
          </DangerActionButton>
          {hasSelection ? (
            <Chip
              id="expenses-selection-count"
              size="small"
              variant="outlined"
              label={labels.selectedCount(selectedRows.length)}
            />
          ) : null}
        </>
      ) : null}
      <Box sx={{ marginInlineStart: "auto", display: "flex", gap: 1 }}>
        <ExportButton
          id="expenses-export-csv"
          startIcon={<FileDownloadOutlined />}
          disabled={exporting}
          onClick={onExportCsv}
          size="small"
        >
          {labels.action.exportCsv}
        </ExportButton>
        {canManageExpenses ? (
          <PrimaryPageAction
            id="expenses-add-new"
            size="small"
            startIcon={<AddOutlined />}
            onClick={() => onOpenForm(null)}
          >
            {labels.action.addNew}
          </PrimaryPageAction>
        ) : null}
      </Box>
    </Stack>
  );
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
      <Typography variant="labelUppercase" sx={(theme: Theme) => ({ color: theme.palette.onSurfaceVariant })}>
        {label}
      </Typography>
      <Stack direction="row" sx={{ alignItems: "baseline", gap: 1 }}>
        <Typography variant="titleLg">{formatAccountingMoney(amount)}</Typography>
        {currency !== null ? (
          <Typography variant="bodyMd" sx={(theme: Theme) => ({ color: theme.palette.onSurfaceVariant })}>
            {currency}
          </Typography>
        ) : null}
      </Stack>
    </Stack>
  );
}

/** One plain footer figure without a currency companion, e.g. the records tally. */
function AggregateCount({ label, count }: Readonly<{ label: string; count: number }>) {
  return (
    <Stack sx={{ gap: 0.5 }}>
      <Typography variant="labelUppercase" sx={(theme: Theme) => ({ color: theme.palette.onSurfaceVariant })}>
        {label}
      </Typography>
      <Typography variant="titleLg">{count}</Typography>
    </Stack>
  );
}

/** Type tally in the footer: the same badge the grid rows render plus its row count. */
function ExpenseTypeTally({
  typeKey,
  labels,
  count,
}: Readonly<{ typeKey: string; labels: ExpensesLabels; count: number }>) {
  const type = expenseTypeFromAggregateKey(typeKey);
  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
      {type !== null ? (
        <StatusBadge category="expenseType" status={type} label={expenseTypeLabel(labels, type)} />
      ) : null}
      <Typography variant="bodyMd">{count}</Typography>
    </Stack>
  );
}

interface ExpensesAggregateFooterProps {
  readonly aggregates: ExpenseAggregates;
  /** Total rows across all pages of the current filter, shown as the records tally. */
  readonly totalCount: number;
  readonly labels: ExpensesLabels;
}

/**
 * Footer card under the grid summarizing the whole filtered set (all pages):
 * the total value in the dominant currency, the records tally, and the
 * per-type tallies with the same badges the rows render.
 */
function ExpensesAggregateFooter({ aggregates, totalCount, labels }: Readonly<ExpensesAggregateFooterProps>) {
  const typeTallies = Object.entries(aggregates.rowCountByType);
  return (
    <SectionPanel>
      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{ flexWrap: "wrap", gap: 3, alignItems: { xs: "flex-start", md: "center" } }}
      >
        <AggregateAmount
          label={labels.aggregate.totalValue}
          amount={aggregates.totalValue}
          currency={aggregates.dominantCurrency}
        />
        <AggregateCount label={labels.aggregate.rowCount} count={totalCount} />
        <Stack
          direction="row"
          sx={{ flexWrap: "wrap", gap: 2, alignItems: "center", marginInlineStart: { xs: 0, md: "auto" } }}
        >
          {typeTallies.map(([typeKey, count]) => (
            <ExpenseTypeTally key={typeKey} typeKey={typeKey} labels={labels} count={count} />
          ))}
        </Stack>
      </Stack>
    </SectionPanel>
  );
}

/**
 * Zero-row panel rendered by the grid's no-rows slot: a muted receipt glyph
 * over the empty-state copy. Widths are symmetric and direction-free so the
 * panel reads identically in RTL.
 */
function ExpensesEmptyStateContent({ heading, hint }: Readonly<{ heading: string; hint: string }>) {
  return (
    <Stack
      sx={{
        height: "100%",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        px: 2,
        py: 6,
        textAlign: "center",
      }}
    >
      <Box
        sx={(theme: Theme) => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 56,
          height: 56,
          borderRadius: "50%",
          mb: 0.5,
          backgroundColor: theme.palette.action.hover,
          color: theme.palette.text.secondary,
        })}
      >
        <ReceiptLongOutlined fontSize="large" />
      </Box>
      <Typography variant="titleLg">{heading}</Typography>
      <Typography variant="bodyMd" sx={(theme: Theme) => ({ color: theme.palette.text.secondary, maxWidth: 360 })}>
        {hint}
      </Typography>
    </Stack>
  );
}

/**
 * Builds the zero-row slot component with the empty-state copy bound. Mirroring
 * the data-grid overlay factories, the slot component is built by a
 * module-scope factory: oxlint forbids defining components inline inside a
 * render function.
 */
function createExpensesNoRowsOverlay(labels: ExpensesLabels): React.ComponentType {
  return function ExpensesNoRowsOverlay() {
    return <ExpensesEmptyStateContent heading={labels.title} hint={labels.empty} />;
  };
}

/**
 * Expense ledger list grid: title/type/teacher/money/dates/source/note columns
 * with a deleted banner row state, per-row action menu (View Source for every
 * viewer, Edit/Delete for managers), a toolbar whose Export CSV is available to
 * every viewer while Bulk Delete and Add New stay manager-gated, store-backed
 * checkbox selection, and the aggregate footer. Selection clears on page turns
 * so the bulk actions always act on rows the operator can see.
 */
export function ExpensesDataGrid({
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
  canManageExpenses,
  handleExportCsv,
  onOpenForm,
  onOpenDelete,
  onViewSource,
}: Readonly<ExpensesDataGridProps>) {
  const locale = useAppLocale();
  const { exporting, runExport } = useExpensesExport(handleExportCsv, labels);

  const columns = useExpensesColumns({
    labels,
    locale,
    canManageExpenses,
    onOpenForm,
    onOpenDelete,
    onViewSource,
  });
  const selection = usePageLocalRowSelection({
    selectedIds,
    toggleSelected,
    clearSelection,
    onPageChange,
    onPageSizeChange,
  });

  const selectedRows = useMemo(() => selectedVisibleRows(rows, selectedIds), [rows, selectedIds]);
  const noRowsOverlay = useMemo(() => createExpensesNoRowsOverlay(labels), [labels]);

  return (
    <Stack sx={{ gap: 1.5, width: "100%" }}>
      <ExpensesToolbar
        labels={labels}
        exporting={exporting}
        selectedRows={selectedRows}
        canManageExpenses={canManageExpenses}
        onOpenForm={onOpenForm}
        onOpenDelete={onOpenDelete}
        onExportCsv={runExport}
      />
      {error !== null ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <AppDataGrid<ExpenseRow>
          rows={rows}
          columns={columns}
          loading={isLoading}
          getRowId={row => row.id ?? ""}
          ariaLabel={labels.title}
          slots={{ noRowsOverlay }}
          sx={
            rows.length === 0
              ? [EXPENSES_EMPTY_GRID_MIN_HEIGHT_SX, EXPENSES_SCROLLBAR_CUE_SX]
              : EXPENSES_SCROLLBAR_CUE_SX
          }
          disableColumnMenu
          disableRowSelectionOnClick
          checkboxSelection={canManageExpenses}
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
      <ExpensesAggregateFooter aggregates={aggregates} totalCount={totalCount} labels={labels} />
    </Stack>
  );
}
