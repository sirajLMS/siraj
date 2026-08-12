import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { ScheduleTrackingPageContainer } from "@/frontend/common/views/dashboard/schedule/tracking/ScheduleTrackingPageContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.scheduleTrackingParent;
  return { title: t.pageTitle };
}

export default withPageAuth(
  [
    AppPermission.SESSION_RESCHEDULE,
    AppPermission.SCHEDULE_VIEW_ALL,
    AppPermission.SCHEDULE_VIEW_LIST,
    AppPermission.DASHBOARD_VIEW_METRICS,
  ],
  async () => {
    return <ScheduleTrackingPageContainer />;
  }
);
