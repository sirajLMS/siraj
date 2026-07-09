import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/lib/redirectToLogin";
import { TeacherClassListContainer } from "@/frontend/views/dashboard/teachers/classes/TeacherClassListContainer";

export const metadata: Metadata = {
  title: "Class Details - Siraj LMS",
};

interface PageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export default async function TeacherMeClassesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { userId } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin(locale);
    return;
  }

  return <TeacherClassListContainer />;
}
