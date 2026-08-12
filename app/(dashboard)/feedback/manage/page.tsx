import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { FeedbackManagePageContainer } from "@/frontend/common/views/dashboard/feedback/FeedbackManagePageContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.feedbackManageParent;
  return { title: t.pageTitle };
}

export default withPageAuth(
  [AppPermission.COMPLAINTS_RESPOND, AppPermission.COMPLAINTS_LIST, AppPermission.SUGGESTIONS_LIST],
  async () => {
    return <FeedbackManagePageContainer />;
  }
);
