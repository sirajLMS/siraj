"use client";

import {
  AddOutlined,
  DeleteOutlined,
  EditOutlined,
  EventNoteOutlined,
  FileDownloadOutlined,
  MoreVertOutlined,
  UndoOutlined,
} from "@mui/icons-material";
import { Box, Divider, IconButton, Menu, MenuItem, Paper, Stack, Typography } from "@mui/material";
import { type ReactNode, useState } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import {
  formatAccountingDate,
  formatAccountingMoney,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import type { CarryoverViewProps } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverContainer";
import { CarryoverFilterBar } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverFilterBar";
import { DisabledTeacherChip } from "@/frontend/common/views/dashboard/accounting/carryover/DisabledTeacherChip";
import { PaidStatusChip } from "@/frontend/common/views/dashboard/accounting/carryover/PaidStatusChip";
import { useCarryoverExport } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverExport";
import type {
  CarryoverAggregates,
  CarryoverRow,
} from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel";
import {
  MobileListCardSkeletons,
  MobileListErrorNotice,
} from "@/frontend/common/views/dashboard/accounting/components/__shared__/mobileListStateShared";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentInset,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";
import type { CarryoverLabels } from "@/shared/locale/types/dashboard/accounting/carryover";

/** Height of each placeholder card while the first page loads. */
const LIST_SKELETON_HEIGHT = 148;

interface CarryoverMenuItem {
  readonly key: "edit" | "sessions" | "unpay" | "delete";
  readonly icon: ReactNode;
  readonly label: string;
  readonly run: () => void;
  readonly disabled?: boolean;
  readonly danger?: boolean;
}

interface CarryoverRowMenuProps {
  readonly row: CarryoverRow;
  readonly labels: CarryoverLabels;
  readonly actionsMenuLabel: string;
  /** Manager-only items (Edit / Unpay / Delete) are omitted when false; View Sessions stays. */
  readonly canManage: boolean;
  readonly onOpenForm: (row: CarryoverRow) => void;
  readonly onOpenDelete: (rows: readonly CarryoverRow[]) => void;
  readonly onOpenUnpay: (row: CarryoverRow) => void;
  readonly onOpenDrawer: (row: CarryoverRow) => void;
}

/** Builds the overflow menu entries; the write actions sit behind the manage gate while View Sessions stays a plain read affordance. */
function buildRowMenuItems(args: Omit<CarryoverRowMenuProps, "actionsMenuLabel">): CarryoverMenuItem[] {
  const { row, labels, canManage, onOpenForm, onOpenDelete, onOpenUnpay, onOpenDrawer } = args;
  const paid = row.isPaid === true;
  const items: CarryoverMenuItem[] = [
    {
      key: "sessions",
      icon: <EventNoteOutlined fontSize="small" />,
      label: labels.action.viewSessions,
      run: () => onOpenDrawer(row),
    },
  ];
  if (!canManage) return items;
  items.unshift({
    key: "edit",
    icon: <EditOutlined fontSize="small" />,
    label: labels.action.edit,
    run: () => onOpenForm(row),
  });
  if (paid) {
    items.push({
      key: "unpay",
      icon: <UndoOutlined fontSize="small" />,
      label: labels.action.unpay,
      run: () => onOpenUnpay(row),
    });
  }
  items.push({
    key: "delete",
    icon: <DeleteOutlined fontSize="small" />,
    label: labels.action.delete,
    run: () => onOpenDelete([row]),
    disabled: paid,
    danger: true,
  });
  return items;
}

/** Per-card overflow menu holding the row actions in the compact mobile layout. */
function CarryoverRowMenu(props: Readonly<CarryoverRowMenuProps>) {
  const { row, actionsMenuLabel } = props;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const menuOpen = anchorEl !== null;
  const items = buildRowMenuItems(props);
  const rowId = row.id ?? "";

  return (
    <>
      <IconButton
        size="small"
        onClick={event => setAnchorEl(event.currentTarget)}
        aria-label={actionsMenuLabel}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls={menuOpen ? `carryover-card-menu-${rowId}` : undefined}
      >
        <MoreVertOutlined fontSize="small" />
      </IconButton>
      <Menu id={`carryover-card-menu-${rowId}`} anchorEl={anchorEl} open={menuOpen} onClose={() => setAnchorEl(null)}>
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

interface CarryoverCardProps extends Omit<CarryoverRowMenuProps, "actionsMenuLabel"> {
  readonly actionsMenuLabel: string;
  readonly locale: string;
}

/** One carryover row as a mobile card: identity + amount, status chip, period, and actions. */
function CarryoverCard({
  row,
  labels,
  actionsMenuLabel,
  locale,
  canManage,
  ...callbacks
}: Readonly<CarryoverCardProps>) {
  return (
    <MobileCardListItem variant="rounded">
      <Stack sx={{ gap: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
          <Stack sx={{ gap: 0.5, minWidth: 0 }}>
            <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
              <Typography variant="titleLg">{row.teacherName ?? "—"}</Typography>
              {row.isDisabledTeacher === true ? <DisabledTeacherChip /> : null}
            </Stack>
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {labels.column.studentsCount}: {row.studentsCount ?? 0} · {row.totalDuration ?? "—"}
            </Typography>
          </Stack>
          <Stack sx={{ alignItems: "flex-end", gap: 0.5, flexShrink: 0 }}>
            <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
              {formatAccountingMoney(row.payable)} {row.teacherCurrency ?? ""}
            </Typography>
            <PaidStatusChip paid={row.isPaid === true} />
          </Stack>
        </Box>
        <Divider />
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {formatAccountingDate(row.fromDate, locale)} – {formatAccountingDate(row.toDate, locale)}
          </Typography>
          <CarryoverRowMenu
            row={row}
            labels={labels}
            actionsMenuLabel={actionsMenuLabel}
            canManage={canManage}
            {...callbacks}
          />
        </Box>
      </Stack>
    </MobileCardListItem>
  );
}

/** Slim totals strip above the list: payable and paid totals in the dominant currency. */
function CarryoverAggregateStrip({
  aggregates,
  labels,
}: Readonly<{ aggregates: CarryoverAggregates; labels: CarryoverLabels }>) {
  const currency = aggregates.dominantCurrency === null ? "" : ` ${aggregates.dominantCurrency}`;
  const items = [
    { key: "payable", label: labels.aggregate.totalPayable, amount: aggregates.totalPayable },
    { key: "paid", label: labels.aggregate.totalPaid, amount: aggregates.totalPaid },
  ].filter(item => item.amount !== null);
  if (items.length === 0) return null;

  return (
    <Paper
      variant="outlined"
      sx={{ px: 2, py: 1.5, display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}
    >
      {items.map(item => (
        <Typography key={item.key} variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {item.label} {formatAccountingMoney(item.amount)}
          {currency}
        </Typography>
      ))}
    </Paper>
  );
}

/**
 * Mobile layout of the carryover balance page: a totals strip, the stacked
 * filter controls, then the rows as tappable cards with server pagination.
 */
export function CarryoverMobileView(props: Readonly<CarryoverViewProps>) {
  const { labels, rows, totalCount, aggregates, isLoading, error } = props;
  const { page, pageSize, onPageChange, onPageSizeChange, pageSizeOptions } = props;
  const { canManageCarryover, actionsMenuLabel, onOpenForm, onOpenDelete, onOpenUnpay, onOpenDrawer } = props;
  const locale = useAppLocale();
  const listFailed = error !== null && rows.length === 0;
  const { exporting, runExport } = useCarryoverExport(props.handleExportCsv, labels);

  return (
    <MobilePageContainer>
      <MobilePageHeader
        title={labels.title}
        actions={
          <Stack direction="row" sx={{ alignItems: "center" }}>
            <IconButton aria-label={labels.action.exportCsv} onClick={runExport} disabled={exporting} size="small">
              <FileDownloadOutlined />
            </IconButton>
            {canManageCarryover ? (
              <IconButton aria-label={labels.action.addNew} onClick={() => onOpenForm(null)} size="small">
                <AddOutlined />
              </IconButton>
            ) : null}
          </Stack>
        }
      />
      <Stack sx={{ gap: 2, pb: 4 }}>
        <MobileContentInset>
          <CarryoverAggregateStrip aggregates={aggregates} labels={labels} />
        </MobileContentInset>
        <MobileContentInset>
          <CarryoverFilterBar />
        </MobileContentInset>
        <MobileListErrorNotice visible={listFailed} message={labels.loadError} />
        {listFailed ? null : (
          <MobileCardList
            rows={rows}
            layout="rounded"
            getKey={row => row.id ?? `${row.teacherId ?? ""}-${row.fromDate ?? ""}-${row.toDate ?? ""}`}
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
              <CarryoverCard
                row={row}
                labels={labels}
                locale={locale}
                canManage={canManageCarryover}
                actionsMenuLabel={actionsMenuLabel}
                onOpenForm={onOpenForm}
                onOpenDelete={onOpenDelete}
                onOpenUnpay={onOpenUnpay}
                onOpenDrawer={onOpenDrawer}
              />
            )}
          />
        )}
      </Stack>
    </MobilePageContainer>
  );
}
