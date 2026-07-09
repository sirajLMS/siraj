import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/lib/redirectToLogin";
import { TeacherRulesContainer } from "@/frontend/views/dashboard/teachers/rules/TeacherRulesContainer";

export const metadata: Metadata = {
  title: "Rules - Siraj LMS",
};

interface PageProps {
  readonly params: Promise<{ readonly locale: string }>;
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
