import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { getRecurringSchedulePageTitle } from "@/backend/lib/titles/cached-page-title";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { RecurringScheduleDetailContainer } from "@/frontend/common/views/dashboard/classes/recurring/RecurringScheduleDetailContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly id: string; readonly locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const t = getTranslations(locale).commonTranslations;
  const scheduleName = await getRecurringSchedulePageTitle(id);
  if (scheduleName) {
    return { title: scheduleName };
  }
  return { title: t.title };
}

export default async function RecurringScheduleDetailPage() {
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }
  await requirePermissionForPage(userId, [AppPermission.SCHEDULE_VIEW_ALL], locale, context);
  return <RecurringScheduleDetailContainer />;
}
