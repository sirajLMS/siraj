"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type {
  AcademicClassRow,
  AlertsMetric,
  ScheduleAlert,
  ScheduleAlertType,
} from "@/frontend/common/views/dashboard/schedule/alerts/types";

export interface ScheduleAlertsLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly alertMessages: Record<ScheduleAlertType, string>;
  readonly reportTitle: string;
  readonly reportDescription: string;
  readonly reportDescriptionMobile: string;
  readonly downloadPdf: string;
  readonly sectionTitle: string;
  readonly sectionSubtitle: string;
  readonly filter: string;
  readonly export: string;
  readonly className: string;
  readonly instructor: string;
  readonly time: string;
  readonly room: string;
  readonly status: string;
  readonly joinSession: string;
  readonly leaveClass: string;
  readonly leaveDisabledReason: string;
  readonly viewClassAudit: string;
  readonly contactAdmin: string;
  readonly showingOf: string;
  readonly active: string;
  readonly upcoming: string;
  readonly missed: string;
  readonly hold: string;
  readonly endOfSchedule: string;
  readonly noEntries: string;
  readonly loading: string;
}

export type CardListLabels = {
  readonly joinSession: string;
  readonly leaveClass: string;
  readonly leaveDisabledReason: string;
  readonly viewClassAudit: string;
  readonly contactAdmin: string;
  readonly active: string;
  readonly upcoming: string;
  readonly missed: string;
  readonly hold: string;
  readonly endOfSchedule: string;
};

export interface ScheduleAlertsViewProps {
  readonly alerts: readonly ScheduleAlert[];
  readonly metrics: readonly AlertsMetric[];
  readonly metricLabels: Record<string, { label: string; subLabel: string }>;
  readonly classes: readonly AcademicClassRow[];
  readonly totalClasses?: number;
  readonly currentPage: number;
  readonly pageSize: number;
  readonly labels: ScheduleAlertsLabels;
  readonly onLeave: (id: string) => void;
  readonly onViewClassAudit: (id: string) => void;
  readonly onPageChange: (page: number) => void;
  readonly loading?: boolean;
  readonly onDownloadReport: () => void;
  readonly onFilter: () => void;
  readonly onExport: () => void;
}

const lazyViews = createLazyView<ScheduleAlertsViewProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/schedule/alerts/scheduleAlertsView.mobile").then(m => ({
      default: m.ScheduleAlertsViewMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/schedule/alerts/scheduleAlertsView.desktop").then(m => ({
      default: m.ScheduleAlertsViewDesktop,
    }))
);

export function ScheduleAlertsView(props: Readonly<ScheduleAlertsViewProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
