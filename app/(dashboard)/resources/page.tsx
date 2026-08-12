import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { ResourcesContainer } from "@/frontend/common/views/dashboard/resources/ResourcesContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.resources;
  return { title: t.pageTitle };
}

export default withPageAuth([AppPermission.RESOURCES_LIST], async () => {
  return <ResourcesContainer />;
});
