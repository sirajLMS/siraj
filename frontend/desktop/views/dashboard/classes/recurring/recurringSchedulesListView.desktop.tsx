"use client";

import { Box } from "@mui/material";
import { useRouter } from "next/navigation";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import { RecurringViewShellShared } from "@/frontend/common/views/dashboard/classes/recurring/__shared__/recurringViewShellShared";
import type { RecurringSchedulesListViewModel } from "@/frontend/common/views/dashboard/classes/recurring/types/recurringSchedulesListViewModel.types";
import { DesktopAppDataGrid, DesktopSectionPanel } from "@/frontend/desktop/components/ui";

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

  return (
    <RecurringViewShellShared
      variant="desktop"
      loading={loading}
      error={error}
      invalidIdMessage={null}
      onRetry={onRetry}
      pageTitle={shell.pageTitle}
      subtitle={shell.subtitle}
      retryLabel={shell.retryLabel}
      desktopBreadcrumbs={shell.breadcrumbs}
    >
      <Box sx={{ mb: 2, maxWidth: 420 }}>
        <SearchBarField value={searchValue} placeholder={filters.searchPlaceholder} onChange={onSearchChange} />
      </Box>
      <DesktopSectionPanel contentPadding={false}>
        <DesktopAppDataGrid
          rows={rows}
          columns={[
            { field: "studentName", headerName: columns.student, flex: 1 },
            { field: "teacherName", headerName: columns.teacher, flex: 1 },
            { field: "defaultStartTime", headerName: columns.schedule, flex: 1 },
            {
              field: "durationMinutes",
              headerName: columns.duration,
              flex: 1,
              valueGetter: (_value, row) => columns.durationMinutesShort(row.durationMinutes ?? 0),
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
          emptyMessage={shell.emptyMessage}
          paginationOptions={buildServerPaginationOptions({
            page: currentPage,
            pageSize,
            totalCount,
            onPageChange,
          })}
        />
      </DesktopSectionPanel>
    </RecurringViewShellShared>
  );
}
