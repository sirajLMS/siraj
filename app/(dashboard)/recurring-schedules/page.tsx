import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { RecurringSchedulesListContainer } from "@/frontend/common/views/dashboard/classes/recurring/RecurringSchedulesListContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.recurringSchedulesList;
  return { title: t.shell.pageTitle };
}

export default withPageAuth([AppPermission.SCHEDULE_VIEW_LIST], async () => {
  return <RecurringSchedulesListContainer />;
});
