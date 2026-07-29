import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { FeedbackManagePageContainer } from "@/frontend/common/views/dashboard/feedback/FeedbackManagePageContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.feedbackManageParent;
  return { title: t.pageTitle };
}

export default async function FeedbackManagePage() {
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }
  await requirePermissionForPage(
    userId,
    [AppPermission.COMPLAINTS_RESPOND, AppPermission.COMPLAINTS_LIST, AppPermission.SUGGESTIONS_LIST],
    locale,
    context
  );
  return <FeedbackManagePageContainer />;
}
