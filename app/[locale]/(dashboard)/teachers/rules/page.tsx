import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { TeacherRulesContainer } from "@/frontend/views/dashboard/teachers/rules/TeacherRulesContainer";

interface PageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.teacherDashboard.rules" });
  return { title: t("pageTitle") };
}

export default async function TeacherRulesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { userId } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin(locale);
    return;
  }

  return <TeacherRulesContainer />;
}
