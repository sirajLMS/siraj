import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { getCachedParentIdForComplaints } from "@/backend/lib/auth/cached-parent";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { logger } from "@/backend/lib/logger";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { ParentComplaintsContainer } from "@/frontend/common/views/dashboard/complaints/ParentComplaintsContainer";
import { redirect } from "@/shared/i18n/routing";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.complaints;
  return { title: t.parent.pageTitle };
}

export default async function ComplaintsPage() {
  const { userId, context } = await getServerUserContext();
  const locale = await getLocale();

  if (!userId) {
    await redirectToLogin();
    return undefined;
  }

  try {
    await getCachedParentIdForComplaints(userId, locale);
  } catch (error) {
    logger.warn("Failed to retrieve parent ID for complaints page. Redirecting to home dashboard.", { error });
    redirect({ href: "/dashboard" });
  }

  await requirePermissionForPage(userId, [AppPermission.SUPPORT_SUBMIT_COMPLAINT], locale, context);
  return <ParentComplaintsContainer />;
}
