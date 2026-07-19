import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { ScheduleAlertsContainer } from "@/frontend/common/views/dashboard/schedule/alerts/ScheduleAlertsContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.coreScheduleAlerts;
  return { title: t.pageTitle };
}

export default async function ScheduleAlertsPage() {
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }
  await requirePermissionForPage(userId, [AppPermission.SCHEDULE_VIEW_LIST], locale, context);
  return <ScheduleAlertsContainer />;
}
