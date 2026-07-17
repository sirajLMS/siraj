"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type {
  CardListLabels,
  DesktopLayoutProps,
  MobileLayoutProps,
  StatusTrackingViewProps,
  SuspensionAnalyticsLabels,
} from "@/frontend/common/views/dashboard/classes/status/tracking/types";

export type { StatusTrackingViewProps };

type SwitcherViewModel = MobileLayoutProps & DesktopLayoutProps;

const lazyViews = createLazyView<SwitcherViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/classes/status/tracking/statusTrackingView.mobile").then(m => ({
      default: m.StatusTrackingMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/classes/status/tracking/statusTrackingView.desktop").then(m => ({
      default: m.StatusTrackingDesktopView,
    }))
);

/**
 * Switcher for the Status Tracking dashboard view.
 *
 * This is the ONLY file in this domain that orchestrates tier selection. It
 * computes the pure-presentational `cardListLabels` / `analyticsLabels` derived
 * from the shared `labels` prop, then delegates rendering to either the mobile
 * or desktop tier-specific component via `ResponsiveViewSwitch`. The Container
 * component (`StatusTrackingContainer.tsx`) continues to call `<StatusTrackingView
 * {...} />` with the same props interface.
 *
 * The mobile leaf reads `cardListLabels` and ignores `analyticsLabels`; the
 * desktop leaf reads `analyticsLabels` and ignores `cardListLabels`. Computing
 * both derived objects unconditionally keeps the switcher pure and lets a single
 * intersection-typed view model feed both tier components.
 */
export function StatusTrackingView(props: Readonly<StatusTrackingViewProps>) {
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
    accountsLocked: (count: number) => labels.accountsLocked(count),
    auditDescription: labels.auditDescription,
    openAuditLogs: labels.openAuditLogs,
    suspended: labels.suspendedPending,
    days: labels.days,
  };

  const viewModel = {
    ...props,
    cardListLabels,
    analyticsLabels,
  } as SwitcherViewModel;

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
