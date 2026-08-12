import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { ParentRulesContainer } from "@/frontend/common/views/dashboard/parent/rules/ParentRulesContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.parentRules;
  return { title: t.pageTitle };
}

export default withPageAuth([AppPermission.SCHEDULE_VIEW_FAMILY], async () => {
  return <ParentRulesContainer />;
});
