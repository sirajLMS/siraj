"use client";

import type { ReportLedgerRow } from "@/frontend/common/views/dashboard/reports/types/reportsTypes";
import { MobileCardList, MobileCardListItem, MobileContentStack } from "@/frontend/mobile/components/ui";
import {
  PerformanceLedgerCardMobile,
  type PerformanceLedgerCardMobileLabels,
} from "@/frontend/mobile/views/dashboard/reports/components/performanceLedgerCard.mobile";

interface PerformanceLedgerCardListMobileProps {
  readonly rows: readonly ReportLedgerRow[];
  readonly labels: PerformanceLedgerCardMobileLabels;
  readonly loading?: boolean;
  readonly onRowClick?: (row: ReportLedgerRow) => void;
}

export function PerformanceLedgerCardListMobile({
  rows,
  labels,
  loading = false,
  onRowClick,
}: Readonly<PerformanceLedgerCardListMobileProps>) {
  return (
    <MobileContentStack gap={2}>
      <MobileCardList<ReportLedgerRow>
        rows={rows}
        getKey={row => row.id}
        loading={loading}
        gap={2}
        renderItem={row => (
          <MobileCardListItem key={row.id} interactive={Boolean(onRowClick)}>
            <PerformanceLedgerCardMobile row={row} labels={labels} onClick={onRowClick} />
          </MobileCardListItem>
        )}
      />
    </MobileContentStack>
  );
}
