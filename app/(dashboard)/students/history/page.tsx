import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { StudentHistoryView } from "@/frontend/common/views/dashboard/student/history/StudentHistoryContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.studentPortalHistory;
  return { title: t.pageTitle };
}

export default withPageAuth([AppPermission.STUDENT_VIEW_OWN_DASHBOARD], async () => {
  return <StudentHistoryView />;
});
