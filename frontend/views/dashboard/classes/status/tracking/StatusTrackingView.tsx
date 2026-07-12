"use client";

import { useViewport } from "@/frontend/hooks/useViewport";
import { StatusTrackingDesktopView } from "@/frontend/views/dashboard/classes/status/tracking/statusTrackingView.desktop";
import { StatusTrackingMobileView } from "@/frontend/views/dashboard/classes/status/tracking/statusTrackingView.mobile";
import type {
  CardListLabels,
  StatusTrackingViewProps,
  SuspensionAnalyticsLabels,
} from "@/frontend/views/dashboard/classes/status/tracking/types";

/**
 * Switcher for the Status Tracking dashboard view.
 *
 * This is the ONLY file in this domain that reads the viewport tier. It computes
 * the pure-presentational `cardListLabels` / `analyticsLabels` derived from the
 * shared `labels` prop, then delegates rendering to either the mobile or desktop
 * tier-specific component. The Container component (`StatusTrackingContainer.tsx`)
 * continues to call `<StatusTrackingView {...} />` with the same props interface.
 */
export function StatusTrackingView(props: Readonly<StatusTrackingViewProps>) {
  const { isMobile } = useViewport();
  const { labels } = props;

  const cardListLabels: CardListLabels = {
    joinSession: labels.joinSession,
    activate: labels.activate,
    reschedule: labels.reschedule,
    verifyDocuments: labels.verifyDocuments,
    sessionLocked: labels.sessionLocked,
    sessionEnded: labels.sessionEnded,
    seeAll: labels.seeAll,
    todaysSchedule: labels.todaysSchedule,
    regular: labels.regular,
    suspendedPending: labels.suspendedPending,
    onLeave: labels.onLeave,
    pendingVerification: labels.pendingVerification,
  };

  const analyticsLabels: SuspensionAnalyticsLabels = {
    suspensionAnalytics: labels.suspensionAnalytics,
    analyticsNote: labels.analyticsNote,
    urgentTask: labels.urgentTask,
    accountsLocked: labels.accountsLocked,
    auditDescription: labels.auditDescription,
    openAuditLogs: labels.openAuditLogs,
    suspended: labels.suspendedPending,
    days: labels.days,
  };

  if (isMobile) {
    return <StatusTrackingMobileView {...props} cardListLabels={cardListLabels} />;
  }

  return <StatusTrackingDesktopView {...props} analyticsLabels={analyticsLabels} />;
}
