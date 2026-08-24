import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { LeaveRequestsContainer } from "@/frontend/common/views/dashboard/scheduling/leave-requests/LeaveRequestsContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.selfServiceReschedule;
  return { title: t.requestsList.title };
}

export default async function StudentRequestsPage() {
  const { userId, context } = await getServerUserContext();
  const locale = await getLocale();

  if (!userId) {
    await redirectToLogin();
    return undefined;
  }

  await requirePermissionForPage(userId, [AppPermission.SESSION_SELF_DELAY], locale, context);
  return <LeaveRequestsContainer />;
}
