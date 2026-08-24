import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { TeacherMonthlyAppraisalsContainer } from "@/frontend/common/views/dashboard/reports/monthly-appraisal/teacher/TeacherMonthlyAppraisalsContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.monthlyAppraisal;
  return { title: t.teacherView.pageTitle };
}

export default async function TeacherMonthlyAppraisalsPage() {
  const { userId, context } = await getServerUserContext();
  const locale = await getLocale();

  if (!userId) {
    await redirectToLogin();
    return undefined;
  }

  await requirePermissionForPage(userId, [AppPermission.APPRAISAL_SUBMIT], locale, context);
  return <TeacherMonthlyAppraisalsContainer />;
}
