import type { Metadata } from "next";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { TeacherRulesContainer } from "@/frontend/common/views/dashboard/teachers/rules/TeacherRulesContainer";
import { getTranslations } from "@/shared/locale/server";

interface PageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.teacherDashboard;
  return { title: t.rules.pageTitle };
}

export default async function TeacherRulesPage({ params }: PageProps) {
  const { locale } = await params;

  const { userId } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin(locale);
    return;
  }

  return <TeacherRulesContainer />;
}
