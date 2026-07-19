import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { SearchScheduleContainer } from "@/frontend/common/views/dashboard/search-schedule/SearchScheduleContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.coreSearchSchedule;
  return { title: t.pageTitle };
}

export default async function SearchSchedulePage() {
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }
  await requirePermissionForPage(userId, [AppPermission.SCHEDULE_SEARCH_AVAILABILITY], locale, context);
  return <SearchScheduleContainer />;
}
