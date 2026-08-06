"use client";

import { Box, Paper, Stack, type SxProps, type Theme } from "@mui/material";
import { Fragment, type ReactNode } from "react";
import { PaginationControls } from "@/frontend/common/components/ui";
import {
  ScheduleOverviewCardSkeleton,
  ScheduleOverviewEmptyState,
} from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewCardList";

/**
 * Raw props forwarded to {@link PaginationControls} when the shell renders
 * the pager. Callers compute `pageCount` locally (same as the legacy inline
 * block) — the shell is strictly presentational and never derives pagination.
 */
export interface ScheduleOverviewListShellPagination {
  readonly page: number;
  readonly pageCount: number;
  readonly rowCount: number;
  readonly pageSize: number;
  readonly onPageChange: (page: number) => void;
}

export interface ScheduleOverviewListShellProps<Row> {
  readonly rows: readonly Row[];
  readonly renderItem: (row: Row) => ReactNode;
  readonly getKey: (row: Row) => string | number;
  readonly loading?: boolean;
  readonly emptyMessage: string;
  readonly renderSkeleton?: () => ReactNode;
  readonly renderEmptyState?: () => ReactNode;
  readonly pagination?: ScheduleOverviewListShellPagination;
  readonly sx?: SxProps<Theme>;
}

export function ScheduleOverviewListShell<Row>({
  rows,
  renderItem,
  getKey,
  loading = false,
  emptyMessage,
  renderSkeleton,
  renderEmptyState,
  pagination,
  sx,
}: Readonly<ScheduleOverviewListShellProps<Row>>) {
  const isLoadingWithNoRows = loading && rows.length === 0;
  const hasNoRows = rows.length === 0;

  const defaultSkeletonContent = (
    <Stack spacing={2}>
      <Paper
        elevation={0}
        sx={theme => ({
          borderRadius: 2,
          border: `1px solid ${theme.palette.border.light}`,
          backgroundColor: theme.palette.surfaceContainerLowest,
        })}
      >
        <ScheduleOverviewCardSkeleton />
      </Paper>
    </Stack>
  );

  let skeletonContent: ReactNode;
  if (renderSkeleton) {
    skeletonContent = renderSkeleton();
  } else {
    skeletonContent = defaultSkeletonContent;
  }

  let emptyStateContent: ReactNode;
  if (renderEmptyState) {
    emptyStateContent = renderEmptyState();
  } else {
    emptyStateContent = <ScheduleOverviewEmptyState message={emptyMessage} />;
  }

  const listContent = (
    <Stack spacing={0}>
      {rows.map(row => (
        <Fragment key={getKey(row)}>{renderItem(row)}</Fragment>
      ))}
    </Stack>
  );

  let mainContent: ReactNode;
  if (isLoadingWithNoRows) {
    mainContent = skeletonContent;
  } else if (hasNoRows) {
    mainContent = emptyStateContent;
  } else {
    mainContent = listContent;
  }

  return (
    <Stack sx={sx}>
      {mainContent}

      {pagination && (
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <PaginationControls
            page={pagination.page}
            pageCount={pagination.pageCount}
            rowCount={pagination.rowCount}
            pageSize={pagination.pageSize}
            onPageChange={pagination.onPageChange}
          />
        </Box>
      )}
    </Stack>
  );
}
