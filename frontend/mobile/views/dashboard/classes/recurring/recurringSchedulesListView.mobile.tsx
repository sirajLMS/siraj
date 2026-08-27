"use client";

import { Box, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
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
      retryLabel={shell.retryLabel}
      mobileBreadcrumbs={shell.breadcrumbs}
    >
      <MobileContentInset>
        <Box sx={{ mb: 2 }}>
          <SearchBarField value={searchValue} placeholder={filters.searchPlaceholder} onChange={onSearchChange} />
        </Box>
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
                <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
                  {columns.teacher}: {row.teacherName ?? ""}
                </Typography>
                <Typography sx={{ typography: "bodyMd" }}>
                  {columns.schedule}: {row.defaultStartTime ?? ""}
                </Typography>
                <Typography sx={{ typography: "bodyMd" }}>
                  {columns.duration}: {columns.durationMinutesShort(row.durationMinutes ?? 0)}
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
