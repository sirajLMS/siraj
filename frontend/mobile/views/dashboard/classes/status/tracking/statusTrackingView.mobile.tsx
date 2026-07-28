"use client";

import { AddOutlined } from "@mui/icons-material";
import type { MobileLayoutProps } from "@/frontend/common/views/dashboard/classes/status/tracking/types";
import {
  MobileContentStack,
  MobileFab,
  MobileMetricCardGrid,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";
import { DateNavigatorMobile } from "@/frontend/mobile/components/ui/filter";
import { StatusTrackingCardList } from "@/frontend/mobile/views/dashboard/classes/status/tracking/components/statusTrackingCardList.mobile";
import { SuspensionAnalyticsMobile } from "@/frontend/mobile/views/dashboard/classes/status/tracking/components/suspensionAnalytics.mobile";

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
  suspendedCount,
  labelsBySection,
  dateValue,
  onDateChange,
  onActivate,
  onReschedule,
  onVerify,
  onNewReport,
  onOpenAuditLogs,
}: Readonly<MobileLayoutProps>) {
  const { shell, filters, cardList, analytics } = labelsBySection;

  return (
    <MobilePageContainer>
      <MobilePageHeader title={shell.pageTitle} subtitle={shell.pageSubtitle} />

      <MobileContentStack gap={3} paddingBottom={12}>
        <DateNavigatorMobile
          dateValue={dateValue}
          todayLabel={filters.dateFilter.today}
          previousDayLabel={filters.dateFilter.previousDay}
          nextDayLabel={filters.dateFilter.nextDay}
          dateLabel={filters.dateFilter.dateLabel}
          onDateChange={onDateChange}
        />

        <MobileMetricCardGrid metrics={metrics} />

        <StatusTrackingCardList
          rows={rows}
          totalSessions={totalSessions}
          labels={cardList}
          onActivate={onActivate}
          onReschedule={onReschedule}
          onVerify={onVerify}
        />

        <SuspensionAnalyticsMobile
          labels={analytics}
          suspendedCount={suspendedCount}
          onOpenAuditLogs={onOpenAuditLogs}
        />
      </MobileContentStack>

      <MobileFab icon={<AddOutlined />} label={shell.newReport} onClick={onNewReport} />
    </MobilePageContainer>
  );
}
