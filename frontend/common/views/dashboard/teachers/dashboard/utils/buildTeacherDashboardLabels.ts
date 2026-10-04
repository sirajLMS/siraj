import type { TeacherDashboardViewLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";
import {
  buildActionLabels,
  buildActiveControlsLabels,
  buildManualClassEntryLabels,
} from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildTeacherDashboardActionLabels.helpers";
import {
  buildActiveWelcomeLabels,
  buildAlertLabels,
  buildDateFilterLabels,
  buildErrorLabels,
  buildPolicyLabels,
  buildProgressFeedLabels,
  buildSupportLabels,
} from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildTeacherDashboardInfoLabels.helpers";
import {
  buildActiveMetricsLabels,
  buildMetricsLabels,
  buildScheduleLabels,
  buildStatusLabels,
} from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildTeacherDashboardScheduleLabels.helpers";
import { buildClassInstanceStatusLabels } from "@/frontend/common/views/dashboard/utils/classInstanceStatusLabels";
import type { AdminDashboardLabels, TeacherDashboardLabels as TeacherDashboardTranslator } from "@/shared/locale";

type DashboardTranslator = AdminDashboardLabels;

export function buildTeacherDashboardLabels(
  t: TeacherDashboardTranslator,
  dashboardT: DashboardTranslator,
  joinEmptyTeacher: string
): TeacherDashboardViewLabels {
  const instanceStatusLabels = buildClassInstanceStatusLabels(dashboardT.statusLabels);

  return {
    pageTitle: t.pageTitle,
    pageSubtitle: t.pageSubtitle,
    overviewTitle: t.overviewTitle,
    todayChip: t.todayChip,
    metrics: buildMetricsLabels(t),
    activeMetrics: buildActiveMetricsLabels(t),
    activeWelcome: buildActiveWelcomeLabels(t),
    schedule: buildScheduleLabels(t),
    status: buildStatusLabels(t),
    actions: buildActionLabels(t),
    activeControls: buildActiveControlsLabels(t),
    progressFeed: buildProgressFeedLabels(t),
    alert: buildAlertLabels(t),
    policy: buildPolicyLabels(t),
    dateFilter: buildDateFilterLabels(t),
    support: buildSupportLabels(t),
    errors: buildErrorLabels(t),
    manualClassEntry: buildManualClassEntryLabels(t),
    supportRequestSubmitted: t.supportRequestSubmitted,
    rules: {
      pageTitle: t.rules.pageTitle,
      pageSubtitle: t.rules.pageSubtitle,
    },
    instanceStatusLabels,
    meetingLabels: { emptyTeacher: joinEmptyTeacher },
  };
}
