import type { Metadata } from "next";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { SubjectsContainer } from "@/frontend/common/views/dashboard/subjects/home/SubjectsContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.subjects;
  return { title: t.pageTitle };
}

export default async function SubjectsPage() {
  const { userId } = await getServerUserContext();

  if (!userId) {
    await redirectToLogin();
    return;
  }

  return <SubjectsContainer />;
}
