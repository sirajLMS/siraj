import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { StudentCreditsContainer } from "@/frontend/common/views/dashboard/student/credits/StudentCreditsContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.studentPortalCredits;
  return { title: t.pageTitle };
}

export default withPageAuth([AppPermission.STUDENT_VIEW_OWN_DASHBOARD], async () => {
  return <StudentCreditsContainer />;
});
