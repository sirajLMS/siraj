"use client";

import { Box, Stack, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { RecurringViewShellShared } from "@/frontend/common/views/dashboard/classes/recurring/__shared__/recurringViewShellShared";
import type { RecurringSchedulesListViewModel } from "@/frontend/common/views/dashboard/classes/recurring/types/recurringSchedulesListViewModel.types";
import { MobileCardList, MobileCardListItem } from "@/frontend/mobile/components/ui";
import { MobileContentInset } from "@/frontend/mobile/components/ui/container/MobileContentInset";

export function RecurringSchedulesListMobileView({
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
      variant="mobile"
      loading={loading}
      error={error}
      invalidIdMessage={null}
      onRetry={onRetry}
      pageTitle={shell.pageTitle}
      subtitle={shell.subtitle}
      mobileBreadcrumbs={shell.breadcrumbs}
    >
      <MobileContentInset>
        <TextField
          fullWidth
          size="small"
          placeholder={filters.searchPlaceholder}
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          sx={{ mb: 2 }}
        />
      </MobileContentInset>
      <MobileCardList
        rows={rows}
        getKey={row => row.id ?? ""}
        paginationOptions={buildServerPaginationOptions({
          page: currentPage,
          pageSize,
          totalCount,
          onPageChange,
        })}
        emptyMessage={shell.emptyMessage}
        renderItem={row => (
          <MobileCardListItem variant="edge-to-edge" interactive>
            <Box
              onClick={() => router.push(`/recurring-schedules/${row.id}`)}
              sx={{ cursor: "pointer", width: "100%" }}
            >
              <Stack spacing={0.5}>
                <Typography sx={{ fontWeight: 700 }}>{row.studentName ?? ""}</Typography>
                <Typography sx={{ typography: "bodyMd", color: "text.secondary" }}>
                  {columns.teacher}: {row.teacherName ?? ""}
                </Typography>
                <Typography sx={{ typography: "bodyMd" }}>
                  {columns.schedule}: {row.defaultStartTime ?? ""}
                </Typography>
                <Typography sx={{ typography: "bodyMd" }}>
                  {columns.duration}: {row.durationMinutes ?? 0} min
                </Typography>
                {row.hourlyRate ? (
                  <Typography sx={{ typography: "bodyMd" }}>
                    {columns.rate}: {row.hourlyRate}
                  </Typography>
                ) : null}
              </Stack>
            </Box>
          </MobileCardListItem>
        )}
      />
    </RecurringViewShellShared>
  );
}
