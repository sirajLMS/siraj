"use client";

import { Box, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { AppDataGrid, ErrorState, LoadingState } from "@/frontend/common/components/ui";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { RecurringSchedulesListViewModel } from "@/frontend/common/views/dashboard/classes/recurring/useRecurringSchedulesListViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

export function RecurringSchedulesListDesktopView({
  labelsBySection,
  loading,
  error,
  rows,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onSearchChange,
  searchValue,
  onRetry,
}: Readonly<RecurringSchedulesListViewModel>) {
  const { shell, columns, filters } = labelsBySection;
  const router = useRouter();

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <DesktopPageContainer>
        <ErrorState embedded message={error} retryLabel="Retry" onRetry={onRetry} />
      </DesktopPageContainer>
    );
  }

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={shell.pageTitle} subtitle={shell.subtitle} breadcrumbs={shell.breadcrumbs} />
      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder={filters.searchPlaceholder}
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          sx={{ minWidth: 300 }}
        />
      </Box>
      {rows.length === 0 ? (
        <Typography sx={{ color: "text.secondary" }}>{shell.emptyMessage}</Typography>
      ) : (
        <AppDataGrid
          rows={rows}
          columns={[
            { field: "studentName", headerName: columns.student, flex: 1 },
            { field: "teacherName", headerName: columns.teacher, flex: 1 },
            { field: "defaultStartTime", headerName: columns.schedule, flex: 1 },
            {
              field: "durationMinutes",
              headerName: columns.duration,
              flex: 1,
              valueGetter: (_value, row) => `${row.durationMinutes ?? 0} min`,
            },
            {
              field: "hourlyRate",
              headerName: columns.rate,
              flex: 1,
              valueGetter: (_value, row) => row.hourlyRate ?? "-",
            },
          ]}
          getRowId={row => row.id ?? ""}
          onRowClick={row => router.push(`/recurring-schedules/${row.id}`)}
          paginationOptions={buildServerPaginationOptions({
            page: currentPage,
            pageSize,
            totalCount,
            onPageChange,
          })}
        />
      )}
    </DesktopPageContainer>
  );
}
