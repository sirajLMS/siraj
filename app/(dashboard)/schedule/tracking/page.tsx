import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { ScheduleTrackingPageContainer } from "@/frontend/common/views/dashboard/schedule/tracking/ScheduleTrackingPageContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.scheduleTrackingParent;
  return { title: t.pageTitle };
}

export default async function ScheduleTrackingPage() {
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return undefined;
  }
  await requirePermissionForPage(
    userId,
    [
      AppPermission.SESSION_RESCHEDULE,
      AppPermission.SCHEDULE_VIEW_ALL,
      AppPermission.SCHEDULE_VIEW_LIST,
      AppPermission.DASHBOARD_VIEW_METRICS,
    ],
    locale,
    context
  );
  return <ScheduleTrackingPageContainer />;
}
