"use client";

import { AddOutlined, DeleteOutlined, EditOutlined, LinkOutlined, MoreVertOutlined } from "@mui/icons-material";
import { Box, Chip, IconButton, Menu, MenuItem, Paper, Stack, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { type ReactNode, useState } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { formatAccountingMoney } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import {
  MobileListCardSkeletons,
  MobileListErrorNotice,
} from "@/frontend/common/views/dashboard/accounting/components/__shared__/mobileListStateShared";
import { ExpenseFilterBar } from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseFilterBar";
import { ExpenseSourceChip } from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseSourceChip";
import type { ExpensesViewProps } from "@/frontend/common/views/dashboard/accounting/expenses/ExpensesContainer";
import { ExpenseTypeChip } from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseTypeChip";
import type {
  ExpenseAggregates,
  ExpenseRow,
} from "@/frontend/common/views/dashboard/accounting/expenses/useExpensesViewModel";
import { usePageBreadcrumbs } from "@/frontend/common/views/dashboard/lib/usePageBreadcrumbs";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentInset,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

/** Height of each placeholder card while the first page loads. */
const LIST_SKELETON_HEIGHT = 128;

/** Native-button reset for the tappable card body that opens the detail drawer. */
const CARD_TAP_TARGET_SX = (theme: Theme) => ({
  flex: 1,
  minWidth: 0,
  padding: 0,
  border: "none",
  background: "none",
  cursor: "pointer",
  textAlign: "start",
  color: "inherit",
  font: "inherit",
  borderRadius: 1,
  "&:focus-visible": {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
  },
});

interface ExpenseMenuItem {
  readonly key: "edit" | "delete" | "viewSource";
  readonly icon: ReactNode;
  readonly label: string;
  readonly run: () => void;
  readonly disabled?: boolean;
  readonly danger?: boolean;
}

interface ExpenseRowMenuProps {
  readonly row: ExpenseRow;
  readonly labels: ExpensesLabels;
  readonly menuAriaLabel: string;
  /** Manager-only items (Edit / Delete) are omitted when false; View Source stays. */
  readonly canManage: boolean;
  readonly onOpenForm: (row: ExpenseRow) => void;
  readonly onOpenDelete: (rows: readonly ExpenseRow[]) => void;
  readonly onViewSource: (sourceEntityId: string) => void;
}

/** Builds the overflow menu entries; write actions sit behind the manage gate while View Source stays a read affordance. */
function buildRowMenuItems(args: Omit<ExpenseRowMenuProps, "menuAriaLabel">): ExpenseMenuItem[] {
  const { row, labels, canManage, onOpenForm, onOpenDelete, onViewSource } = args;
  const deleted = row.deletedAt !== null;
  const items: ExpenseMenuItem[] = [
    {
      key: "viewSource",
      icon: <LinkOutlined fontSize="small" />,
      label: labels.action.viewSource,
      run: () => {
        const sourceId = row.sourceEntityId;
        if (sourceId !== null) onViewSource(sourceId);
      },
      disabled: row.sourceEntityId === null,
    },
  ];
  if (!canManage) return items;
  items.unshift({
    key: "edit",
    icon: <EditOutlined fontSize="small" />,
    label: labels.action.edit,
    run: () => onOpenForm(row),
    disabled: deleted,
  });
  items.push({
    key: "delete",
    icon: <DeleteOutlined fontSize="small" />,
    label: labels.action.delete,
    run: () => onOpenDelete([row]),
    disabled: deleted,
    danger: true,
  });
  return items;
}

/** Per-card overflow menu holding the row actions in the compact mobile layout. */
function ExpenseRowMenu(props: Readonly<ExpenseRowMenuProps>) {
  const { row, menuAriaLabel } = props;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const menuOpen = anchorEl !== null;
  const items = buildRowMenuItems(props);
  const rowId = row.id ?? "";

  return (
    <>
      <IconButton
        size="small"
        onClick={event => setAnchorEl(event.currentTarget)}
        aria-label={menuAriaLabel}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls={menuOpen ? `expense-card-menu-${rowId}` : undefined}
      >
        <MoreVertOutlined fontSize="small" />
      </IconButton>
      <Menu id={`expense-card-menu-${rowId}`} anchorEl={anchorEl} open={menuOpen} onClose={() => setAnchorEl(null)}>
        {items.map(item => (
          <MenuItem
            key={item.key}
            disabled={item.disabled ?? false}
            onClick={() => {
              setAnchorEl(null);
              item.run();
            }}
            sx={item.danger === true ? theme => ({ color: theme.palette.error.main }) : undefined}
          >
            <Box component="span" sx={{ marginInlineEnd: 1, display: "inline-flex" }}>
              {item.icon}
            </Box>
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

interface ExpenseCardProps extends Omit<ExpenseRowMenuProps, "menuAriaLabel"> {
  readonly menuAriaLabel: string;
  readonly onOpenDrawer: (row: ExpenseRow) => void;
}

/**
 * One expense row as a mobile card: tappable body (opens the detail drawer)
 * with title + amount, the type/source chip row with the deleted badge, the
 * teacher line when set, and a per-card overflow menu holding the row actions.
 * Soft-deleted rows render dimmed with a struck-through title.
 */
function ExpenseCard({
  row,
  labels,
  menuAriaLabel,
  canManage,
  onOpenDrawer,
  ...callbacks
}: Readonly<ExpenseCardProps>) {
  const deleted = row.deletedAt !== null;
  const title = row.title ?? "";
  return (
    <MobileCardListItem variant="rounded" dimmed={deleted}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
        <Box
          component="button"
          type="button"
          onClick={() => onOpenDrawer(row)}
          aria-label={labels.drawer.title(title)}
          sx={CARD_TAP_TARGET_SX}
        >
          <Stack sx={{ gap: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 1 }}>
              <Typography
                variant="titleLg"
                sx={{ minWidth: 0, ...(deleted ? { textDecoration: "line-through" } : null) }}
              >
                {title}
              </Typography>
              <Typography variant="titleLg" sx={{ flexShrink: 0 }}>
                {formatAccountingMoney(row.expenseValue)} {row.expenseCurrency ?? ""}
              </Typography>
            </Box>
            <Stack direction="row" sx={{ alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              {row.type !== null ? <ExpenseTypeChip type={row.type} /> : null}
              <ExpenseSourceChip sourceEntity={row.sourceEntity} sourceEntityId={row.sourceEntityId} />
              {deleted ? (
                <Chip
                  label={labels.deletedBadge}
                  size="small"
                  aria-label={labels.deletedBadge}
                  sx={theme => ({
                    backgroundColor: theme.palette.errorContainer,
                    color: theme.palette.onErrorContainer,
                  })}
                />
              ) : null}
            </Stack>
            {row.teacherName !== null && row.teacherName !== "" ? (
              <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                {row.teacherName}
              </Typography>
            ) : null}
          </Stack>
        </Box>
        <ExpenseRowMenu row={row} labels={labels} menuAriaLabel={menuAriaLabel} canManage={canManage} {...callbacks} />
      </Box>
    </MobileCardListItem>
  );
}

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
      <Stack sx={{ gap: 2, pb: 11 }}>
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
      </Stack>
    </MobilePageContainer>
  );
}
