"use client";

import { AddOutlined } from "@mui/icons-material";
import { MetricCardGrid } from "@/frontend/common/components/reports/MetricCardGrid";
import type { MobileLayoutProps } from "@/frontend/common/views/dashboard/classes/status/tracking/types";
import { MobileContentStack, MobileFab, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { StatusTrackingCardList } from "@/frontend/mobile/views/dashboard/classes/status/tracking/components/statusTrackingCardList.mobile";

/**
 * Mobile variant of the Status Tracking dashboard view.
 *
 * Tier-specific presentation component — receives a fully-resolved view model
 * via props. Must NEVER import `useMediaQuery` or `useViewport` (viewport tier
 * is decided by the parent switcher `StatusTrackingView.tsx`).
 */
export function StatusTrackingMobileView({
  metrics,
  rows,
  totalSessions,
  labels,
  cardListLabels,
  onActivate,
  onReschedule,
  onVerify,
  onNewReport,
  onSeeAll,
}: Readonly<MobileLayoutProps>) {
  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} edgeToEdge={false} />

      <MobileContentStack gap={3} paddingBottom={12}>
        <MetricCardGrid metrics={metrics} />

        <StatusTrackingCardList
          rows={rows}
          totalSessions={totalSessions}
          labels={cardListLabels}
          onActivate={onActivate}
          onReschedule={onReschedule}
          onVerify={onVerify}
          onSeeAll={onSeeAll}
        />
      </MobileContentStack>

      <MobileFab icon={<AddOutlined />} label={labels.newReport} onClick={onNewReport} />
    </MobilePageContainer>
  );
}
