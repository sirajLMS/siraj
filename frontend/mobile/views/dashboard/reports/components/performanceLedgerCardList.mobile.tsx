"use client";

import type { PerformanceLedgerCardLabels } from "@/frontend/common/views/dashboard/reports/types/reportsLabelTypes";
import type { PerformanceLedgerCardListProps } from "@/frontend/common/views/dashboard/reports/types/reportsViewProps";
import { MobileCardList, MobileCardListItem, MobileContentStack } from "@/frontend/mobile/components/ui";
import {
  PerformanceLedgerCardMobile,
  type PerformanceLedgerCardMobileLabels,
} from "@/frontend/mobile/views/dashboard/reports/components/performanceLedgerCard.mobile";

export type PerformanceLedgerCardListMobileLabels = PerformanceLedgerCardLabels;

export function PerformanceLedgerCardListMobile({
  rows,
  labels,
  loading = false,
  onRowClick,
  showFinancials,
  formatPaidAmounts,
}: Readonly<PerformanceLedgerCardListProps>) {
  return (
    <MobileContentStack gap={2}>
      <MobileCardList<(typeof rows)[number]>
        rows={rows}
        getKey={row => row.id}
        loading={loading}
        gap={2}
        paginationOptions={{ mode: "client" }}
        renderItem={row => (
          <MobileCardListItem key={row.id} interactive={Boolean(onRowClick)}>
            <PerformanceLedgerCardMobile
              row={row}
              labels={labels as PerformanceLedgerCardMobileLabels}
              showFinancials={showFinancials}
              paidLabel={formatPaidAmounts(row.paidAmounts)}
              onClick={onRowClick}
            />
          </MobileCardListItem>
        )}
      />
    </MobileContentStack>
  );
}
