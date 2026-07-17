"use client";

import { Box } from "@mui/material";
import { profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import type { ReportsDataGridLabels } from "@/frontend/common/views/dashboard/reports/types/reportsLabelTypes";
import type { ReportLedgerRow, ReportType } from "@/frontend/common/views/dashboard/reports/types/reportsTypes";
import { MobileCardList, MobileCardListItem } from "@/frontend/mobile/components/ui";
import {
  PerformanceLedgerCardMobile,
  type PerformanceLedgerCardMobileLabels,
} from "@/frontend/mobile/views/dashboard/reports/components/performanceLedgerCard.mobile";

export type ReportsDataGridMobileLabels = ReportsDataGridLabels;

interface ReportsDataGridMobileProps {
  readonly rows: readonly ReportLedgerRow[];
  readonly labels: ReportsDataGridMobileLabels;
  readonly reportType: ReportType;
  readonly onRowClick?: (row: ReportLedgerRow) => void;
  readonly loading?: boolean;
}

function nameHrefForRow(row: ReportLedgerRow, reportType: ReportType): string | undefined {
  if (!row.entityId) {
    return undefined;
  }
  if (reportType === "by_teacher") {
    return profileHrefForTeacher({ teacherId: row.entityId });
  }
  if (reportType === "by_student") {
    return studentHref(row.entityId);
  }
  return undefined;
}

export function ReportsDataGridMobile({
  rows,
  labels,
  reportType,
  loading = false,
  onRowClick,
}: Readonly<ReportsDataGridMobileProps>) {
  const ledgerLabels: PerformanceLedgerCardMobileLabels = {
    studentLabel: () => "",
    paid: labels.paid,
    statusLabels: {} as never,
    taken: labels.taken,
    absent: labels.absent,
    leave: labels.leave,
    pending: labels.pending,
    hours: labels.hours,
  };

  return (
    <Box sx={{ px: { xs: 0 }, pb: 1 }}>
      <MobileCardList<ReportLedgerRow>
        rows={rows}
        getKey={row => row.id}
        loading={loading}
        emptyMessage={labels.noEntries}
        gap={2}
        renderItem={row => {
          const href = nameHrefForRow(row, reportType);
          return (
            <MobileCardListItem
              key={row.id}
              interactive={Boolean(onRowClick)}
              {...(href ? { accentBorder: { color: "primary", side: "inline-start", width: 4 } } : {})}
            >
              <PerformanceLedgerCardMobile row={row} labels={ledgerLabels} onClick={onRowClick} />
            </MobileCardListItem>
          );
        }}
      />
    </Box>
  );
}
