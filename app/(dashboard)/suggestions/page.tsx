import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { ParentSuggestionsContainer } from "@/frontend/common/views/dashboard/suggestions/ParentSuggestionsContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.suggestions;
  return { title: t.parent.pageTitle };
}

export default withPageAuth([AppPermission.COMMUNICATION_SUBMIT_SUGGESTION], async () => {
  return <ParentSuggestionsContainer />;
});
