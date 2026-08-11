import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { SubjectsContainer } from "@/frontend/common/views/dashboard/subjects/home/SubjectsContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.subjects;
  return { title: t.pageTitle };
}

export default withPageAuth([AppPermission.SUBJECTS_LIST], async () => {
  return <SubjectsContainer />;
});
