"use client";

import { Box, Stack, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui/badge";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { CalculationStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { PAGE_SIZE_OPTIONS } from "@/frontend/common/stores/payrollReportsFilterStore";
import { formatAccountingDate } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import {
  MobileListCardSkeletons,
  MobileListErrorNotice,
} from "@/frontend/common/views/dashboard/accounting/components/__shared__/mobileListStateShared";
import type { PayrollReportsViewProps } from "@/frontend/common/views/dashboard/accounting/payroll/PayrollReportsContainer";
import { PayrollReportsFilterBar } from "@/frontend/common/views/dashboard/accounting/payroll/PayrollReportsFilterBar";
import type { PayrollReportRow } from "@/frontend/common/views/dashboard/accounting/payroll/usePayrollReportsViewModel";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentInset,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";
import type { PayrollLabels } from "@/shared/locale/types/dashboard/billing/payroll";

/** Height of each placeholder card while the first page loads. */
const LIST_SKELETON_HEIGHT = 112;

interface PayrollReportCardProps {
  readonly row: PayrollReportRow;
  readonly labels: PayrollLabels;
  readonly statusLabels: Record<CalculationStatus, string>;
  readonly locale: string;
}

/**
 * One payroll report row as a mobile card: the scheduled-start date as the
 * title with the calculation badge, the teacher line, and the scheduled
 * duration line. Rows recorded without a calculation status render the shared
 * muted dash, matching the grid's empty-status marker.
 */
function PayrollReportCard({ row, labels, statusLabels, locale }: Readonly<PayrollReportCardProps>) {
  return (
    <MobileCardListItem variant="rounded">
      <Stack sx={{ gap: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 1 }}>
          <Typography variant="titleLg" sx={{ minWidth: 0 }}>
            {formatAccountingDate(row.scheduledStartAt, locale)}
          </Typography>
          {row.calculationStatus === null ? (
            <Box component="span" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              —
            </Box>
          ) : (
            <Box sx={{ flexShrink: 0 }}>
              <StatusBadge
                category="payrollCalculation"
                status={row.calculationStatus}
                label={statusLabels[row.calculationStatus]}
              />
            </Box>
          )}
        </Box>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {row.teacherName ?? "—"}
        </Typography>
        <Stack direction="row" sx={{ alignItems: "baseline", gap: 1 }}>
          <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.column.scheduledDuration}
          </Typography>
          <Typography variant="bodyMd">{row.scheduledDurationMinutes ?? "—"}</Typography>
        </Stack>
      </Stack>
    </MobileCardListItem>
  );
}

/**
 * Mobile layout of the Payroll Reports page: the filter controls stack above
 * the report rows as cards with server pagination.
 */
export function PayrollReportsMobileView(props: Readonly<PayrollReportsViewProps>) {
  const { labels, statusLabels, rows, loading, error } = props;
  const { page, pageSize, totalCount, onPageChange, onPageSizeChange } = props;
  const locale = useAppLocale();
  const reportFailed = error && rows.length === 0;

  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.title} />
      <Stack sx={{ gap: 2, pb: 4 }}>
        <MobileContentInset>
          <PayrollReportsFilterBar {...props} />
        </MobileContentInset>
        <MobileListErrorNotice visible={reportFailed} message={labels.loadError} />
        {reportFailed ? null : (
          <MobileCardList<PayrollReportRow>
            rows={rows}
            layout="rounded"
            getKey={row => row.instanceId ?? row.id ?? ""}
            loading={loading}
            emptyMessage={labels.empty}
            renderSkeleton={() => <MobileListCardSkeletons height={LIST_SKELETON_HEIGHT} />}
            paginationOptions={buildServerPaginationOptions({
              page,
              pageSize,
              totalCount,
              onPageChange,
              onPageSizeChange,
              pageSizeOptions: PAGE_SIZE_OPTIONS,
            })}
            renderItem={row => (
              <PayrollReportCard row={row} labels={labels} statusLabels={statusLabels} locale={locale} />
            )}
          />
        )}
      </Stack>
    </MobilePageContainer>
  );
}
