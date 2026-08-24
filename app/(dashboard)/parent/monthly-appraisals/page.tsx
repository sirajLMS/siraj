import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { StudentParentAppraisalContainer } from "@/frontend/common/views/dashboard/reports/monthly-appraisal/student-parent/StudentParentAppraisalContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.monthlyAppraisal;
  return { title: t.studentParentView.pageTitle };
}

export default async function ParentMonthlyAppraisalsPage() {
  const { userId, context } = await getServerUserContext();
  const locale = await getLocale();

  if (!userId) {
    await redirectToLogin();
    return undefined;
  }

  await requirePermissionForPage(userId, [AppPermission.APPRAISAL_VIEW], locale, context);
  // parent view: pass a specific studentId to view that child's appraisals.
  // For the initial implementation, pass null to let the container show the
  // parent's first linked child (handled by a student-switcher in a future task).
  return <StudentParentAppraisalContainer studentId={null} />;
}
