"use client";

import { FileDownloadOutlined, LinkOutlined } from "@mui/icons-material";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import type { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { ExportButton } from "@/frontend/common/components/ui/button/ActionButtons";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { ExpenseType } from "@/frontend/common/graphql/generated/gql/graphql";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useProfitLossFilterStore } from "@/frontend/common/stores/profitLossFilterStore";
import { logger } from "@/frontend/common/utils/logger";
import {
  dateCell,
  formatAccountingDate,
  formatAccountingMoney,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import { CarryoverDetailDrawer } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDetailDrawer";
import type {
  ProfitLossExpenseRow,
  ProfitLossViewModel,
} from "@/frontend/common/views/dashboard/accounting/profit-loss/useProfitLossViewModel";
import { EXPENSE_SOURCE_CARRYOVER_BALANCES } from "@/shared/constants/expenses";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingExpenses } from "@/shared/locale/namespaces";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";
import type { ProfitLossLabels } from "@/shared/locale/types/dashboard/accounting/profit-loss";

type ExpensesTabProps = Pick<
  ProfitLossViewModel,
  "labels" | "expensesPage" | "month" | "currency" | "isLoading" | "onExpensesPageChange" | "pageSize"
>;

const CSV_EXPORT_URL = "/api/profit-loss/expenses/export";

function buildExpensesExportUrl(month: string, currency: string): string {
  const params = new URLSearchParams({ month, currency });
  return `${CSV_EXPORT_URL}?${params.toString()}`;
}

/**
 * Runs one CSV download of the month's expense ledger and resolves to the
 * server's truncation flag, or null when the download itself failed, so the
 * busy flag always clears.
 */
function useExpensesCsvExport(month: string, currency: string): () => Promise<{ truncated: boolean } | null> {
  return useCallback(async () => {
    const url = buildExpensesExportUrl(month, currency);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        logger.error("Expenses CSV export request failed", { status: response.status, url });
        return null;
      }
      const truncated = response.headers.get("X-Export-Truncated") === "true";
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      return { truncated };
    } catch (exportError) {
      logger.error("Expenses CSV export failed", { error: exportError, url });
      return null;
    }
  }, [month, currency]);
}

/** Maps the codegen enum onto the backend aggregate's per-type tally keys. */
const AGGREGATE_KEY_BY_TYPE: Record<ExpenseType, string> = {
  [ExpenseType.Salaries]: "Salaries",
  [ExpenseType.Marketing]: "Marketing",
  [ExpenseType.Logistics]: "Logistics",
  [ExpenseType.Technology]: "Technology",
};

const TYPE_LABEL_KEY_BY_TYPE: Record<ExpenseType, keyof ExpensesLabels["type"]> = {
  [ExpenseType.Salaries]: "Salaries",
  [ExpenseType.Marketing]: "Marketing",
  [ExpenseType.Logistics]: "Logistics",
  [ExpenseType.Technology]: "Technology",
};

function expenseTypeLabel(labels: ExpensesLabels, type: ExpenseType): string {
  return labels.type[TYPE_LABEL_KEY_BY_TYPE[type]];
}

const EXPENSE_TYPES: readonly ExpenseType[] = [
  ExpenseType.Salaries,
  ExpenseType.Marketing,
  ExpenseType.Logistics,
  ExpenseType.Technology,
];

/** Resolves the aggregate's per-type tally to verified string→number pairs. */
function toTypeTallies(rowCountByType: unknown): [string, number][] {
  if (typeof rowCountByType !== "object" || rowCountByType === null) return [];
  return Object.entries(rowCountByType).filter((entry): entry is [string, number] => typeof entry[1] === "number");
}

/** Resolves a `rowCountByType` aggregate key to the codegen enum, or null when unknown. */
function expenseTypeFromAggregateKey(key: string): ExpenseType | null {
  for (const type of EXPENSE_TYPES) {
    if (AGGREGATE_KEY_BY_TYPE[type] === key) return type;
  }
  return null;
}

/**
 * Type chip cell: renders the expense's category with the same colors the
 * expense ledger grid uses, or the muted dash when the category is absent.
 */
function ExpenseTypeCell({
  type,
  typeLabels,
  empty,
}: Readonly<{ type: ExpenseType | null; typeLabels: ExpensesLabels; empty: string }>) {
  if (type === null) return <Box component="span">{empty}</Box>;
  const label = expenseTypeLabel(typeLabels, type);
  return <StatusBadge category="expenseType" status={type} label={label} />;
}

interface ExpenseSourceCellProps {
  readonly row: ProfitLossExpenseRow;
  readonly sourceLabels: ExpensesLabels["source"];
  /** Opens the linked carryover balance's detail drawer. */
  readonly onOpenCarryover: (sourceEntityId: string) => void;
}

/**
 * Source chip cell: "Manual" for hand-entered rows, a linked "From Carryover"
 * chip for settlement-produced rows that opens the carryover drawer on click.
 * The chip swallows its own click so the row navigation never fires.
 */
function ExpenseSourceCell({ row, sourceLabels, onOpenCarryover }: Readonly<ExpenseSourceCellProps>) {
  if (row.sourceEntity === EXPENSE_SOURCE_CARRYOVER_BALANCES) {
    const clickable = row.sourceEntityId !== null;
    const chip = (
      <StatusBadge
        category="expenseSource"
        status="carryover"
        label={sourceLabels.FromCarryover}
        icon={<LinkOutlined fontSize="small" />}
      />
    );
    if (!clickable) return chip;
    return (
      <Tooltip title={sourceLabels.FromCarryover}>
        <span>
          <Box
            component="a"
            onClick={event => {
              event.stopPropagation();
              if (row.sourceEntityId !== null) onOpenCarryover(row.sourceEntityId);
            }}
            sx={{ display: "inline-flex", cursor: "pointer", textDecoration: "none" }}
          >
            {chip}
          </Box>
        </span>
      </Tooltip>
    );
  }
  return <StatusBadge category="expenseSource" status="manual" label={sourceLabels.Manual} />;
}

interface ExpensesColumnArgs {
  readonly labels: ProfitLossLabels;
  readonly typeLabels: ExpensesLabels;
  readonly sourceLabels: ExpensesLabels["source"];
  readonly locale: string;
  readonly onOpenCarryover: (sourceEntityId: string) => void;
}

function buildExpensesColumns(args: ExpensesColumnArgs): GridColDef<ProfitLossExpenseRow>[] {
  const { labels, typeLabels, sourceLabels, locale, onOpenCarryover } = args;
  return [
    {
      field: "paymentDate",
      headerName: labels.column.paymentDate,
      width: 140,
      valueGetter: (_value, row) => formatAccountingDate(dateCell(row.paymentDate), locale),
    },
    {
      field: "type",
      headerName: labels.column.type,
      width: 140,
      sortable: false,
      renderCell: ({ row }) => <ExpenseTypeCell type={row.type} typeLabels={typeLabels} empty="—" />,
    },
    {
      field: "title",
      headerName: labels.column.title,
      flex: 1,
      minWidth: 180,
      valueGetter: (_value, row) => row.title ?? "—",
    },
    {
      field: "teacherName",
      headerName: labels.column.teacher,
      flex: 1,
      minWidth: 150,
      sortable: false,
      valueGetter: (_value, row) => row.teacherName ?? "—",
    },
    {
      field: "expenseValue",
      headerName: labels.column.value,
      width: 150,
      align: "right",
      headerAlign: "right",
      renderCell: ({ row }) => (
        <Stack direction="row" sx={{ alignItems: "baseline", gap: 0.5 }}>
          <Box component="span" sx={{ fontWeight: 600 }}>
            {formatAccountingMoney(row.expenseValue)}
          </Box>
          {row.expenseCurrency !== null ? (
            <Box component="span" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {row.expenseCurrency}
            </Box>
          ) : null}
        </Stack>
      ),
    },
    {
      field: "sourceEntity",
      headerName: labels.column.source,
      width: 170,
      sortable: false,
      renderCell: ({ row }) => (
        <ExpenseSourceCell row={row} sourceLabels={sourceLabels} onOpenCarryover={onOpenCarryover} />
      ),
    },
    {
      field: "note",
      headerName: typeLabels.column.note,
      sortable: false,
      flex: 1,
      minWidth: 140,
      valueGetter: (_value, row) => row.note ?? "—",
    },
  ];
}

/** Memoized column set, rebuilt only when an input changes. */
function useExpensesColumns(args: ExpensesColumnArgs): GridColDef<ProfitLossExpenseRow>[] {
  const { labels, typeLabels, sourceLabels, locale, onOpenCarryover } = args;
  return useMemo(
    () => buildExpensesColumns({ labels, typeLabels, sourceLabels, locale, onOpenCarryover }),
    [labels, typeLabels, sourceLabels, locale, onOpenCarryover]
  );
}

interface ExpenseTypeTallyProps {
  readonly typeKey: string;
  readonly typeLabels: ExpensesLabels;
  readonly count: number;
}

/** Footer type tally: the same badge the rows render plus its whole-month count. */
function ExpenseTypeTally({ typeKey, typeLabels, count }: Readonly<ExpenseTypeTallyProps>) {
  const type = expenseTypeFromAggregateKey(typeKey);
  if (type === null) return null;
  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
      <StatusBadge category="expenseType" status={type} label={expenseTypeLabel(typeLabels, type)} />
      <Typography variant="bodyMd">{count}</Typography>
    </Stack>
  );
}

/**
 * Expenses tab of the P&L dashboard: paginated expense-ledger rows for the
 * selected month, a footer with the whole-month total in the dominant
 * currency plus per-type tallies, the FX-excluded row count when present, a
 * CSV export of the month, and drill-downs — the row navigates to the
 * expense detail page while the "From Carryover" chip opens the carryover
 * drawer for the row's linked balance.
 */
export function ExpensesTab(props: Readonly<ExpensesTabProps>) {
  const { labels, expensesPage, month, currency, isLoading, onExpensesPageChange, pageSize } = props;
  const router = useRouter();
  const locale = useAppLocale();
  const expensesLabels = useAppTranslation(DashboardAccountingExpenses);
  const runExport = useExpensesCsvExport(month, currency);
  const [exporting, setExporting] = useState(false);
  const [carryoverId, setCarryoverId] = useState<string | null>(null);

  const handleOpenCarryover = useCallback((sourceEntityId: string) => setCarryoverId(sourceEntityId), []);
  const handleCloseCarryover = useCallback(() => setCarryoverId(null), []);

  const columns = useExpensesColumns({
    labels,
    typeLabels: expensesLabels,
    sourceLabels: expensesLabels.source,
    locale,
    onOpenCarryover: handleOpenCarryover,
  });

  const handleExportClick = useCallback(() => {
    const run = async () => {
      setExporting(true);
      const outcome = await runExport();
      setExporting(false);
      if (outcome?.truncated) {
        logger.warn("Expenses CSV export truncated at the server row ceiling");
      }
    };
    void run();
  }, [runExport]);

  const handleRowClick = useCallback(
    (row: ProfitLossExpenseRow) => {
      if (row.id !== null) {
        router.push(`/accounting/expenses/${row.id}`);
      }
    },
    [router]
  );

  const handleGridRowClick = useCallback(
    (params: GridRowParams<ProfitLossExpenseRow>) => {
      handleRowClick(params.row);
    },
    [handleRowClick]
  );

  const expensesPageIndex = useProfitLossFilterStore(state => state.expensesPage);

  const aggregate = expensesPage.aggregate;
  const total = aggregate?.totalExpenses ?? "0";
  const dominant = aggregate?.dominantCurrency ?? null;
  const excludedCount = aggregate?.excludedRowCount ?? 0;
  const typeTallies = aggregate === null ? [] : toTypeTallies(aggregate.rowCountByType);

  return (
    <Box component="section" aria-label={labels.tab.expenses} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <AppDataGrid<ProfitLossExpenseRow>
        rows={[...expensesPage.rows]}
        columns={columns}
        getRowId={row => row.id ?? ""}
        onRowClick={handleGridRowClick}
        loading={isLoading}
        emptyMessage={labels.empty.description}
        paginationOptions={buildServerPaginationOptions({
          page: expensesPageIndex,
          pageSize,
          totalCount: expensesPage.totalCount,
          onPageChange: onExpensesPageChange,
        })}
      />
      <Stack
        sx={{
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography variant="titleLg">{`${labels.aggregate.totalExpenses}: ${formatAccountingMoney(total)} ${
            dominant ?? currency
          }`}</Typography>
          {dominant !== null && (
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {`${labels.aggregate.dominantCurrency}: ${dominant}`}
            </Typography>
          )}
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, alignItems: "center" }}>
            {typeTallies.map(([typeKey, count]) => (
              <ExpenseTypeTally key={typeKey} typeKey={typeKey} typeLabels={expensesLabels} count={count} />
            ))}
          </Stack>
          {excludedCount > 0 && (
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {labels.aggregate.excludedRows(excludedCount)}
            </Typography>
          )}
        </Box>
        <ExportButton
          id="profit-loss-expenses-export-csv"
          startIcon={<FileDownloadOutlined />}
          disabled={exporting || isLoading || expensesPage.totalCount === 0}
          onClick={handleExportClick}
        >
          {labels.action.exportCsv}
        </ExportButton>
      </Stack>
      <CarryoverDetailDrawer
        carryoverId={carryoverId ?? ""}
        open={carryoverId !== null}
        onClose={handleCloseCarryover}
      />
    </Box>
  );
}
