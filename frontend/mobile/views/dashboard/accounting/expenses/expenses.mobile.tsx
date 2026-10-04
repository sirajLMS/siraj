"use client";

import { AddOutlined } from "@mui/icons-material";
import { IconButton, Paper, Stack, Typography } from "@mui/material";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { formatAccountingMoney } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import {
  MobileListCardSkeletons,
  MobileListErrorNotice,
} from "@/frontend/common/views/dashboard/accounting/components/__shared__/mobileListStateShared";
import { ExpenseFilterBar } from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseFilterBar";
import type { ExpensesViewProps } from "@/frontend/common/views/dashboard/accounting/expenses/ExpensesContainer";
import type { ExpenseAggregates } from "@/frontend/common/views/dashboard/accounting/expenses/useExpensesViewModel";
import { usePageBreadcrumbs } from "@/frontend/common/views/dashboard/lib/usePageBreadcrumbs";
import {
  MobileCardList,
  MobileContentInset,
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";
import { ExpenseCard } from "@/frontend/mobile/views/dashboard/accounting/expenses/expenses.mobile.card";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

/** Height of each placeholder card while the first page loads. */
const LIST_SKELETON_HEIGHT = 128;

/** Totals strip above the list: the filtered set's total value and record count. */
function ExpenseAggregateStrip({
  aggregates,
  labels,
  totalCount,
}: Readonly<{ aggregates: ExpenseAggregates; labels: ExpensesLabels; totalCount: number }>) {
  if (aggregates.totalValue === null) return null;
  const currency = aggregates.dominantCurrency === null ? "" : ` ${aggregates.dominantCurrency}`;
  return (
    <Paper variant="outlined" sx={{ px: 2, py: 1.5 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ gap: { xs: 1.5, sm: 3 }, flexWrap: "wrap", alignItems: { sm: "flex-end" } }}
      >
        <Stack sx={{ gap: 0.25 }}>
          <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.aggregate.totalValue}
          </Typography>
          <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
            {formatAccountingMoney(aggregates.totalValue)}
            {currency}
          </Typography>
        </Stack>
        <Stack sx={{ gap: 0.25, marginInlineStart: { sm: "auto" } }}>
          <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.aggregate.rowCount}
          </Typography>
          <Typography variant="titleLg">{totalCount}</Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}

/**
 * Mobile layout of the expense ledger page: a totals strip, the stacked
 * filter controls, then the rows as tappable cards with server pagination.
 */
export function ExpensesMobileView(props: Readonly<ExpensesViewProps>) {
  const { labels, rows, totalCount, aggregates, isLoading, error } = props;
  const { page, pageSize, onPageChange, onPageSizeChange, pageSizeOptions } = props;
  const { canManageExpenses, onOpenForm, onOpenDelete, onViewSource, onOpenDrawer } = props;
  const listFailed = error !== null && rows.length === 0;
  // The trailing auto breadcrumb repeats the page title, so the trail keeps
  // only the parent path.
  const crumbs = usePageBreadcrumbs();
  const breadcrumbs = crumbs.length > 0 ? crumbs.slice(0, -1) : crumbs;

  return (
    <MobilePageContainer>
      <MobilePageHeader
        title={labels.title}
        breadcrumbs={breadcrumbs}
        actions={
          canManageExpenses ? (
            <IconButton aria-label={labels.action.addNew} onClick={() => onOpenForm(null)} size="small">
              <AddOutlined />
            </IconButton>
          ) : null
        }
      />
      <MobileContentStack gap={2} paddingBottom={11}>
        <MobileContentInset>
          <ExpenseAggregateStrip aggregates={aggregates} labels={labels} totalCount={totalCount} />
        </MobileContentInset>
        <MobileContentInset>
          <ExpenseFilterBar />
        </MobileContentInset>
        <MobileListErrorNotice visible={listFailed} message={labels.loadError} />
        {listFailed ? null : (
          <MobileCardList
            rows={rows}
            layout="rounded"
            getKey={row => row.id ?? `${row.title ?? ""}-${row.createdAt ?? ""}`}
            loading={isLoading}
            emptyMessage={labels.empty}
            renderSkeleton={() => <MobileListCardSkeletons height={LIST_SKELETON_HEIGHT} />}
            paginationOptions={buildServerPaginationOptions({
              page,
              pageSize,
              totalCount,
              onPageChange,
              onPageSizeChange,
              pageSizeOptions,
            })}
            renderItem={row => (
              <ExpenseCard
                row={row}
                labels={labels}
                canManage={canManageExpenses}
                menuAriaLabel={labels.column.rowActions(row.title ?? "")}
                onOpenDrawer={onOpenDrawer}
                onOpenForm={onOpenForm}
                onOpenDelete={onOpenDelete}
                onViewSource={onViewSource}
              />
            )}
          />
        )}
      </MobileContentStack>
    </MobilePageContainer>
  );
}
