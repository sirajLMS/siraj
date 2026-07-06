import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { TeacherStudentsContainer } from "@/frontend/views/dashboard/teachers/students/TeacherStudentsContainer";
import { redirect } from "@/shared/i18n/routing";

export const metadata: Metadata = {
  title: "Your Students - Siraj LMS",
};

interface PageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export default async function TeacherMeStudentsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { userId } = await getServerUserContext();
  if (!userId) {
    redirect({ href: "/login", locale });
    return;
  }

  return <TeacherStudentsContainer />;
}
